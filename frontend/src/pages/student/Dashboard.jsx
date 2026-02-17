// StudentDashboard.jsx
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { FilePlus2, HandCoins, X, StickyNote, User2, MessageCircle, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";

import useMyContext from "@/hooks/useMyContext.jsx";
import useProgressiveLoading from "@/hooks/useProgressiveLoading.jsx";
import { toast } from "sonner";
import { getSocket } from "@/utils/socket.js"; // ✅ Re-enabled Socket.IO
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { startTimer, endTimer, logSummary, debounce } from "@/utils/performance.js"; // ✅ Performance monitoring
import { DashboardSkeleton, SkeletonCard, SkeletonStatCard } from "@/components/SkeletonLoader.jsx";
import ProfileAvatar from "@/components/ProfileAvatar.jsx";
import PageHeader from "@/components/PageHeader.jsx";

// ✅ Simple cache for dashboard data
const dashboardCache = {
  posts: { data: null, timestamp: 0 },
  offers: { data: null, timestamp: 0 },
  teachers: { data: null, timestamp: 0 }
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const StudentDashboard = () => {
  const { postDb, offerDb, chatDb, user, userLoaded } = useMyContext(); // ✅ Add user and userLoaded
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [offersReceived, setOffersReceived] = useState([]);
  const [teachersWhoMessaged, setTeachersWhoMessaged] = useState([]);

  const [chatDrawer, setChatDrawer] = useState({ open: false, offer: null });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  // ✅ Progressive loading configuration
  const loadingStages = useMemo(() => [
    {
      key: 'posts',
      priority: 1, // Highest priority - load first
      critical: true,
      delay: 100,
      loader: async () => {
        const cachedPosts = getCachedData('posts');
        if (cachedPosts) {
          setPosts(cachedPosts);
          return;
        }
        
        const data = await postDb.fetchPosts();
        setPosts(data || []);
        setCachedData('posts', data || []);
      }
    },
    {
      key: 'offers',
      priority: 2, // Second priority
      critical: false,
      delay: 150,
      loader: async () => {
        const cachedOffers = getCachedData('offers');
        if (cachedOffers) {
          setOffersReceived(cachedOffers);
          return;
        }
        
        const data = await offerDb.fetchOffers();
        setOffersReceived(data || []);
        setCachedData('offers', data || []);
      }
    },
    {
      key: 'teachers',
      priority: 3, // Lowest priority - load last
      critical: false,
      delay: 0,
      loader: async () => {
        // Set empty array for now since function doesn't exist
        setTeachersWhoMessaged([]);
        setCachedData('teachers', []);
      }
    }
  ], [postDb, offerDb]);

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

  // ✅ Memoized cache check function
  const getCachedData = useCallback((key) => {
    const cached = dashboardCache[key];
    if (cached.data && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }, []);

  // ✅ Memoized cache set function
  const setCachedData = useCallback((key, data) => {
    dashboardCache[key] = {
      data,
      timestamp: Date.now()
    };
  }, []);

  // ✅ Optimized data fetching with progressive loading
  const fetchDashboardData = useCallback(async () => {
    if (!user || !userLoaded) {
      return;
    }

    startTimer('dashboard-load');
    
    try {
      await executeStages();
      endTimer('dashboard-load');
      logSummary();
    } catch (error) {
      console.error('❌ Dashboard fetch error:', error);
      toast.error("Failed to load dashboard data");
    }
  }, [user, userLoaded, executeStages]);

  // ✅ Debounced fetch dashboard data to prevent multiple rapid calls
  const debouncedFetchDashboard = useCallback(() => {
    debounce('dashboard-fetch', fetchDashboardData, 200);
  }, [fetchDashboardData]);

  // Fetch dashboard data with debouncing
  useEffect(() => {
    debouncedFetchDashboard();
  }, [debouncedFetchDashboard]);

  // ✅ Manual refresh function with progressive loading
  const handleRefresh = useCallback(() => {
    // Clear cache
    dashboardCache.posts = { data: null, timestamp: 0 };
    dashboardCache.offers = { data: null, timestamp: 0 };
    dashboardCache.teachers = { data: null, timestamp: 0 };
    
    // Reset states
    setPosts([]);
    setOffersReceived([]);
    setTeachersWhoMessaged([]);
    
    // Reset progressive loading and start fresh
    resetLoading();
    fetchDashboardData();
    toast.success("Dashboard refreshed!");
  }, [fetchDashboardData, resetLoading]);

  // ✅ Memoized dashboard stats
  const stats = useMemo(() => ({
    postsCreated: posts.length,
    matched: offersReceived.filter((o) => o.status === "Accepted").length,
    rejected: offersReceived.filter((o) => o.status === "Rejected").length,
  }), [posts.length, offersReceived]);

  const statCards = useMemo(() => [
    { label: "Posts Created", value: stats.postsCreated, icon: <FilePlus2 className="text-green-500" size={28} /> },
    { label: "Offers Matched", value: stats.matched, icon: <HandCoins className="text-green-500" size={28} /> },
    { label: "Offers Rejected", value: stats.rejected, icon: <X className="text-red-400" size={28} /> },
  ], [stats]);

  // Chat drawer
  const handleOpenChat = (teacherData) => {
    if (!teacherData?.offer) return;
    setChatDrawer({
      open: true,
      offer: {
        _id: teacherData.offer._id,
        offeredBy: teacherData.teacher,
        post: teacherData.offer.post,
        proposed_price: teacherData.offer.proposed_price,
        status: teacherData.offer.status,
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
      // ✅ Handle async joinRoom
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
    setInput(""); // Clear input immediately for better UX
    
    // ✅ Optimistic update - add message immediately to UI with correct sender info
    const optimisticMessage = {
      _id: `temp_${Date.now()}`, // Temporary ID
      message: messageText,
      sender: {
        _id: user._id,
        fullName: user.fullName,
        role: user.role
      },
      receiver: {
        _id: chatDrawer.offer.offeredBy._id,
        fullName: chatDrawer.offer.offeredBy.fullName,
        role: 'teacher'
      },
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };
    
    setMessages((prev) => [...prev, optimisticMessage]);
    
    try {
      const newMsg = await chatDb.createChat(
        chatDrawer.offer.offeredBy._id,
        chatDrawer.offer._id,
        messageText
      );
      
      // Replace optimistic message with real message
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
      
      // Remove optimistic message on error
      setMessages((prev) => 
        prev.filter(msg => !(msg.isOptimistic && msg.message === messageText))
      );
      setInput(messageText); // Restore input on error
    }
  };

  // ✅ Progressive loading UI - removed overall loading check
  return (
    <div className="min-h-[90vh] w-full font-sans">
      {/* Header */}
      <PageHeader
        title="Welcome back 👋"
        subtitle="Student Dashboard"
        onRefresh={handleRefresh}
        loading={overallLoading}
        showBack={false}
      />

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
        </div>
      </div>

      {/* Teachers Who Messaged */}
      {teachersWhoMessaged.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="text-green-500" size={20} />
            <h2 className="text-lg font-semibold text-neutral-800">Teachers Who Messaged</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachersWhoMessaged.map((item, idx) => (
              <div key={item.teacher?._id || `teacher-${idx}`} className="bg-white border border-neutral-100 rounded-xl shadow-sm p-5 flex flex-col gap-2 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <ProfileAvatar 
                    user={item.teacher} 
                    size="md"
                  />
                  <div>
                    <p className="font-semibold text-neutral-800">{item.teacher.fullName}</p>
                    <p className="text-xs text-neutral-500">{item.teacher.email}</p>
                  </div>
                </div>
                {item.lastMessage && (
                  <div className="text-xs text-neutral-500 bg-neutral-50 p-2 rounded">
                    <p className="truncate">{item.lastMessage}</p>
                    <p className="text-[10px] mt-1">{new Date(item.lastMessageTime).toLocaleString()}</p>
                  </div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-neutral-400">{item.messageCount} message{item.messageCount !== 1 ? 's' : ''}</span>
                  <Button
                    onClick={() => handleOpenChat(item)}
                    className="bg-green-600 text-white hover:bg-green-700 px-4 py-1.5 text-sm flex items-center gap-2"
                  >
                    <MessageCircle size={16} /> Chat
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Latest Posts with progressive loading */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <StickyNote className="text-green-500" size={20} />
          <h2 className="text-lg font-semibold text-neutral-800">Latest Posts</h2>
        </div>
        
        {posts.length === 0 ? (
          <div className="text-neutral-400 text-center py-8">
            <StickyNote className="mx-auto mb-2 text-gray-300" size={48} />
            <p>No posts created yet.</p>
            <p className="text-sm mt-1">Create your first post to get started!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {posts.slice(0, 4).map((post) => (
              <div key={post._id} className="bg-white border border-neutral-100 rounded-xl shadow-sm p-5 flex flex-col gap-2 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-800 text-base truncate max-w-[70%]">{post.topic || 'N/A'}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${post.status === 'open' ? 'bg-green-50 text-green-600' : 'bg-green-500 text-white'}`}>
                    {post.status}
                  </span>
                </div>
                {post.createdAt && (
                  <div className="text-neutral-400 text-xs mt-1">Created: {new Date(post.createdAt).toLocaleDateString()}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Drawer */}
      {chatDrawer.offer && (
        <Sheet open={chatDrawer.open} onOpenChange={handleCloseChat}>
          <SheetContent side="right" className="max-w-md w-full flex flex-col bg-gray-50">
            <SheetHeader className="bg-white p-4 border-b">
              <div className="flex items-center gap-3">
                <ProfileAvatar 
                  user={chatDrawer.offer.offeredBy} 
                  size="md"
                />
                <div className="flex-1">
                  <SheetTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    💬 {chatDrawer.offer.offeredBy?.fullName}
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  </SheetTitle>
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="inline-flex items-center gap-1">
                      <span className="text-green-500">●</span>
                      Teacher • Online
                    </span>
                    {chatDrawer.offer.post && (
                      <span className="ml-2">
                        • For post: <span className="font-medium text-green-600">{chatDrawer.offer.post.topic}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center mt-8">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="text-gray-400" size={24} />
                  </div>
                  <div className="text-gray-400 text-sm">No messages yet</div>
                  <div className="text-gray-300 text-xs mt-1">Start the conversation!</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg, idx) => {
                    // ✅ WhatsApp-style: Check if current user is the sender
                    const isCurrentUser = msg.sender?._id === user?._id;
                    const senderName = msg.sender?.fullName || "Unknown";
                    const senderRole = msg.sender?.role || "unknown";
                    
                    // Ensure we always have a unique key
                    const messageKey = msg._id || `msg-${idx}-${msg.createdAt || Date.now()}`;
                    
                    return (
                      <div key={messageKey} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} mb-4`}>
                        <div className="max-w-[75%]">
                          {/* Sender name - only show for other person's messages */}
                          {!isCurrentUser && (
                            <div className="text-xs font-medium mb-1 text-left text-blue-600">
                              {senderName} ({senderRole === 'teacher' ? 'Teacher' : 'Student'})
                            </div>
                          )}
                          
                          {/* Message bubble */}
                          <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm relative ${
                            isCurrentUser
                              ? "bg-green-500 text-white rounded-br-sm" // YOUR messages: green, right side
                              : "bg-white text-gray-800 rounded-bl-sm border border-gray-200" // OTHER PERSON's messages: white, left side
                          } ${msg.isOptimistic ? "opacity-70" : ""}`}>
                            {msg.message}
                          </div>
                          
                          {/* Timestamp */}
                          <div className={`text-xs text-gray-400 mt-1 ${isCurrentUser ? "text-right" : "text-left"}`}>
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                            {isCurrentUser && !msg.isOptimistic && (
                              <span className="ml-1 text-green-500">✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            <div className="bg-white border-t p-4">
              <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <input
                    className="w-full border border-gray-200 rounded-full px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all placeholder-gray-400 pr-12"
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    maxLength={500}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                    {input.length}/500
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="bg-green-500 hover:bg-green-600 text-white rounded-full w-12 h-12 p-0 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={!input.trim()}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </Button>
              </form>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

export default StudentDashboard;
