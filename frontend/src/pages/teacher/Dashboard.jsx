// TeacherDashboard.jsx
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { FilePlus2, HandCoins, X, StickyNote, User2, MessageCircle, Video, Palette } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useMyContext from "@/hooks/useMyContext.jsx";
import useProgressiveLoading from "@/hooks/useProgressiveLoading.jsx";
import { toast } from "sonner";
import { getSocket } from "@/utils/socket.js";
import DigitalWhiteboard from "@/components/DigitalWhiteboard.jsx";
import ProfileAvatar from "@/components/ProfileAvatar.jsx";
import PageHeader from "@/components/PageHeader.jsx";
import PaymentSetupBanner from "@/components/PaymentSetupBanner.jsx";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { startTimer, endTimer, logSummary, debounce } from "@/utils/performance.js";
import { DashboardSkeleton, SkeletonCard, SkeletonStatCard } from "@/components/SkeletonLoader.jsx";

// ✅ Simple cache for dashboard data
const teacherDashboardCache = {
  offers: { data: null, timestamp: 0 },
  requests: { data: null, timestamp: 0 },
  students: { data: null, timestamp: 0 }
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const TeacherDashboard = () => {
  const { offerDb, chatDb, postDb, user, userLoaded, auth } = useMyContext();
  const navigate = useNavigate();

  const [offers, setOffers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [studentsWhoMessaged, setStudentsWhoMessaged] = useState([]);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);

  const [chatDrawer, setChatDrawer] = useState({ open: false, offer: null });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const hasRefreshedUser = useRef(false);

  // ✅ Refresh user data once on mount to ensure payment details are up to date
  useEffect(() => {
    if (auth?.refreshUser && userLoaded && !hasRefreshedUser.current) {
      auth.refreshUser();
      hasRefreshedUser.current = true;
    }
  }, [auth, userLoaded]);

  // ✅ Memoized cache functions
  const getCachedData = useCallback((key) => {
    const cached = teacherDashboardCache[key];
    if (cached.data && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }, []);

  const setCachedData = useCallback((key, data) => {
    teacherDashboardCache[key] = {
      data,
      timestamp: Date.now()
    };
  }, []);

  // ✅ Progressive loading configuration for teacher dashboard
  const loadingStages = useMemo(() => [
    {
      key: 'offers',
      priority: 1,
      critical: true,
      delay: 100,
      loader: async () => {
        const cachedOffers = getCachedData('offers');
        if (cachedOffers) {
          setOffers(cachedOffers);
          return;
        }
        
        const data = await offerDb.fetchOffers();
        setOffers(data || []);
        setCachedData('offers', data || []);
      }
    },
    {
      key: 'requests',
      priority: 2,
      critical: false,
      delay: 150,
      loader: async () => {
        const cachedRequests = getCachedData('requests');
        if (cachedRequests) {
          setRequests(cachedRequests);
          return;
        }
        
        const data = await postDb.fetchPostsForTeacher();
        setRequests(data || []);
        setCachedData('requests', data || []);
      }
    },
    {
      key: 'students',
      priority: 3,
      critical: false,
      delay: 0,
      loader: async () => {
        setStudentsWhoMessaged([]);
        setCachedData('students', []);
      }
    }
  ], [offerDb, postDb, getCachedData, setCachedData]);

  // ✅ Progressive loading hook
  const {
    overallLoading,
    executeStages,
    reset: resetLoading,
    isStageLoading,
    getProgress
  } = useProgressiveLoading({
    stages: loadingStages,
    enabled: user && userLoaded,
    onStageComplete: (stageKey, completed, total) => {
      // Stage completion tracking
    }
  });

  // ✅ Optimized data fetching with progressive loading
  const fetchDashboardData = useCallback(async () => {
    if (!user || !userLoaded) {
      return;
    }

    startTimer('teacher-dashboard-load');
    
    try {
      await executeStages();
      endTimer('teacher-dashboard-load');
      logSummary();
    } catch (error) {
      console.error('❌ Teacher dashboard fetch error:', error);
      toast.error("Failed to load dashboard data");
    }
  }, [user, userLoaded, executeStages]);

  // ✅ Debounced fetch dashboard data
  const debouncedFetchDashboard = useCallback(() => {
    debounce('teacher-dashboard-fetch', fetchDashboardData, 200);
  }, [fetchDashboardData]);

  // Fetch dashboard data with debouncing
  useEffect(() => {
    debouncedFetchDashboard();
  }, [debouncedFetchDashboard]);

  // ✅ Manual refresh function
  const handleRefresh = useCallback(() => {
    // Clear cache
    teacherDashboardCache.offers = { data: null, timestamp: 0 };
    teacherDashboardCache.requests = { data: null, timestamp: 0 };
    teacherDashboardCache.students = { data: null, timestamp: 0 };
    
    // Reset states
    setOffers([]);
    setRequests([]);
    setStudentsWhoMessaged([]);
    
    // Reset progressive loading and start fresh
    resetLoading();
    fetchDashboardData();
    toast.success("Dashboard refreshed!");
  }, [fetchDashboardData, resetLoading]);

  // ✅ Memoized dashboard stats
  const stats = useMemo(() => ({
    offered: offers.length,
    matched: offers.filter((o) => o.status === "Accepted").length,
    rejected: offers.filter((o) => o.status === "Rejected").length,
  }), [offers]);

  const statCards = useMemo(() => [
    { label: "Offers Created", value: stats.offered, icon: <FilePlus2 className="text-green-500" size={28} /> },
    { label: "Offers Matched", value: stats.matched, icon: <HandCoins className="text-green-500" size={28} /> },
    { label: "Offers Rejected", value: stats.rejected, icon: <X className="text-red-400" size={28} /> },
  ], [stats]);

  // Chat drawer functions
  const handleOpenChat = (studentData) => {
    if (!studentData?.offer) return;
    setChatDrawer({
      open: true,
      offer: {
        _id: studentData.offer._id,
        offeredTo: studentData.student,
        post: studentData.offer.post,
        proposed_price: studentData.offer.proposed_price,
        status: studentData.offer.status,
      },
    });
  };

  const handleCloseChat = () => {
    setChatDrawer({ open: false, offer: null });
    setMessages([]);
    setInput("");
  };

  // Fetch messages for selected chat
  useEffect(() => {
    const fetchMessages = async () => {
      if (!chatDrawer.open || !chatDrawer.offer?._id) return;
      try {
        const chats = await chatDb.fetchChats(chatDrawer.offer._id);
        setMessages(chats || []);
      } catch (error) {
        console.error(error);
      }
    };
    fetchMessages();
  }, [chatDrawer.open, chatDrawer.offer?._id, chatDb]);

  // Real-time chat listener
  useEffect(() => {
    if (chatDrawer.open && chatDrawer.offer?._id) {
      const joinChatRoom = async () => {
        try {
          await chatDb.joinRoom(chatDrawer.offer._id);
        } catch (error) {
          console.error('❌ Failed to join chat room:', error);
        }
      };
      
      joinChatRoom();

      const handleIncomingMessage = (msg) => {
        if (msg.offer === chatDrawer.offer._id) {
          setMessages((prev) => [...prev, msg]);
        }
      };

      chatDb.onMessageReceived(handleIncomingMessage);

      return () => {
        try {
          const socket = getSocket();
          if (socket && typeof socket.off === 'function') {
            socket.off("receiveMessage", handleIncomingMessage);
          }
        } catch (error) {
          console.error('❌ Error cleaning up socket listener:', error);
        }
      };
    }
  }, [chatDrawer.open, chatDrawer.offer?._id, chatDb]);

  // Scroll chat to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !chatDrawer.offer) return;
    
    const messageText = input.trim();
    setInput("");
    
    const optimisticMessage = {
      _id: `temp_${Date.now()}`,
      message: messageText,
      sender: {
        _id: user._id,
        fullName: user.fullName,
        role: user.role
      },
      receiver: {
        _id: chatDrawer.offer.offeredTo._id,
        fullName: chatDrawer.offer.offeredTo.fullName,
        role: 'student'
      },
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };
    
    setMessages((prev) => [...prev, optimisticMessage]);
    
    try {
      const newMsg = await chatDb.createChat(
        chatDrawer.offer.offeredTo._id,
        chatDrawer.offer._id,
        messageText
      );
      
      setMessages((prev) => 
        prev.map(msg => 
          msg.isOptimistic && msg.message === messageText 
            ? newMsg
            : msg
        )
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to send message");
      
      setMessages((prev) => 
        prev.filter(msg => !(msg.isOptimistic && msg.message === messageText))
      );
      setInput(messageText);
    }
  };

  // ✅ Progressive loading UI - removed overall loading check
  return (
    <div className="min-h-[90vh] w-full font-sans">
      {/* Header with refresh button */}
      <PageHeader
        title="Welcome back 👋"
        subtitle="Teacher Dashboard"
        onRefresh={handleRefresh}
        loading={overallLoading}
        showBack={false}
      />

      {/* Payment Setup Banner */}
      <PaymentSetupBanner user={user} />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="group flex flex-col items-center justify-center rounded-xl shadow bg-white p-6 border border-neutral-100 hover:shadow-md transition"
          >
            <div className="mb-2">{card.icon}</div>
            <span className="text-3xl font-extrabold text-green-600 group-hover:text-green-500 transition-colors">{card.value}</span>
            <span className="text-neutral-600 font-medium text-base mt-1">{card.label}</span>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-neutral-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/meetings')}
            className="group flex items-center gap-4 bg-white border border-neutral-100 rounded-xl shadow-sm p-6 hover:shadow-md transition-all hover:border-blue-200"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Video className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-neutral-800 group-hover:text-blue-600 transition-colors">My Meetings</h3>
              <p className="text-sm text-neutral-500">View and join scheduled meetings</p>
            </div>
          </button>
          
          <button
            onClick={() => setWhiteboardOpen(true)}
            className="group flex items-center gap-4 bg-white border border-neutral-100 rounded-xl shadow-sm p-6 hover:shadow-md transition-all hover:border-green-200"
          >
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <Palette className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-neutral-800 group-hover:text-green-600 transition-colors">Digital Whiteboard</h3>
              <p className="text-sm text-neutral-500">Open interactive teaching board</p>
            </div>
          </button>
        </div>
      </div>

      {/* Latest Offers with progressive loading */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <HandCoins className="text-green-500" size={20} />
          <h2 className="text-lg font-semibold text-neutral-800">Latest Offers Made</h2>
        </div>
        
        {offers.length === 0 ? (
          <div className="text-neutral-400 text-center py-8">
            <HandCoins className="mx-auto mb-2 text-gray-300" size={48} />
            <p>No offers created yet.</p>
            <p className="text-sm mt-1">Start making offers to students!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {offers.slice(0, 4).map((offer) => (
              <div key={offer._id} className="bg-white border border-neutral-100 rounded-xl shadow-sm p-5 flex flex-col gap-2 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-800 text-base truncate max-w-[70%]">{offer.post?.topic || 'N/A'}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${offer.status === 'Accepted' ? 'bg-green-500 text-white' : offer.status === 'Rejected' ? 'bg-red-500 text-white' : 'bg-green-50 text-green-600'}`}>
                    {offer.status}
                  </span>
                </div>
                {offer.offeredTo && (
                  <div className="flex items-center gap-2 text-neutral-500 text-sm">
                    <ProfileAvatar 
                      user={offer.offeredTo} 
                      size="xs"
                    />
                    {offer.offeredTo.fullName} • Fee: <span className="font-bold text-green-600">₹{offer.proposed_price}</span>
                  </div>
                )}
                {offer.createdAt && (
                  <div className="text-neutral-400 text-xs mt-1">Created: {new Date(offer.createdAt).toLocaleDateString()}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Requests with progressive loading */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <StickyNote className="text-green-500" size={20} />
          <h2 className="text-lg font-semibold text-neutral-800">Available Requests</h2>
        </div>
        
        {requests.length === 0 ? (
          <div className="text-neutral-400 text-center py-8">
            <StickyNote className="mx-auto mb-2 text-gray-300" size={48} />
            <p>No requests available.</p>
            <p className="text-sm mt-1">Check back later for new student requests!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {requests.slice(0, 4).map((request) => (
              <div key={request._id} className="bg-white border border-neutral-100 rounded-xl shadow-sm p-5 flex flex-col gap-2 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-800 text-base truncate max-w-[70%]">{request.topic || 'N/A'}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${request.status === 'open' ? 'bg-green-50 text-green-600' : 'bg-gray-500 text-white'}`}>
                    {request.status}
                  </span>
                </div>
                {request.studentDetail && (
                  <div className="flex items-center gap-2 text-neutral-500 text-sm">
                    <ProfileAvatar 
                      user={request.studentDetail} 
                      size="xs"
                    />
                    {request.studentDetail.fullName}
                  </div>
                )}
                {request.createdAt && (
                  <div className="text-neutral-400 text-xs mt-1">Posted: {new Date(request.createdAt).toLocaleDateString()}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Digital Whiteboard Modal */}
      <DigitalWhiteboard 
        isOpen={whiteboardOpen}
        onClose={() => setWhiteboardOpen(false)}
        meetingId="teacher-session"
      />
    </div>
  );
};

export default TeacherDashboard;