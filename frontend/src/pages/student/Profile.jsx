import { useEffect, useState, useRef } from "react";
import useMyContext from "@/hooks/useMyContext";
import axiosInstance from "@/helper/axios";
import { toast } from "sonner";
import { BookOpen, Users, Calendar, Award, User, Edit, Save, X, MessageSquare, Send, Phone, Mail, Video, ArrowLeft, Upload, Hash, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getSocket } from "@/utils/socket.js";
import MeetingInvite from "@/components/MeetingInvite.jsx";
import ProfileAvatar from "@/components/ProfileAvatar.jsx";
import { useNavigate } from "react-router-dom";

export default function StudentProfile() {
  const { user, userLoaded, initialized, chatDb, auth } = useMyContext();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  
  // Chat functionality
  const [chatDrawer, setChatDrawer] = useState({ open: false, teacher: null });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [showMeetingInvite, setShowMeetingInvite] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      // ✅ Only fetch if user is loaded and is a student
      if (!user || !userLoaded || !initialized) {
        return;
      }

      if (user.role !== 'student') {
        return;
      }

      try {
        const [profileRes, teachersRes] = await Promise.allSettled([
          axiosInstance.get("/users/profile/student"),
          axiosInstance.get("/offers/fetchOffers") // Get teachers from accepted offers
        ]);

        if (profileRes.status === 'fulfilled') {
          setProfileData(profileRes.value.data.data);
          setEditForm(profileRes.value.data.data.user);
        }

        if (teachersRes.status === 'fulfilled') {
          // Extract unique teachers from accepted offers
          const acceptedOffers = teachersRes.value.data.data.filter(offer => offer.status === 'Accepted');
          const uniqueTeachers = acceptedOffers.reduce((acc, offer) => {
            if (offer.offeredBy && !acc.find(t => t._id === offer.offeredBy._id)) {
              acc.push({
                ...offer.offeredBy,
                offerId: offer._id,
                lastMessage: null,
                lastMessageTime: null
              });
            }
            return acc;
          }, []);
          setTeachers(uniqueTeachers);
        }
      } catch (error) {
        console.error("❌ Error fetching profile:", error);
        console.error("❌ Error response:", error.response?.data);
        console.error("❌ Error status:", error.response?.status);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user, userLoaded, initialized]);

  // Edit profile functions
  const handleEdit = () => {
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      const response = await axiosInstance.put("/users/profile", editForm);
      setProfileData(prev => ({ ...prev, user: response.data.data }));
      setEditing(false);
      toast.success("Profile updated successfully");
      
      // Refresh user data in context to update header
      if (auth.refreshUser) {
        await auth.refreshUser();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const handleCancel = () => {
    setEditForm(profileData.user);
    setEditing(false);
  };

  // Chat functions
  const handleOpenChat = (teacher) => {
    setChatDrawer({ open: true, teacher });
    setMessages([]);
  };

  const handleCloseChat = () => {
    setChatDrawer({ open: false, teacher: null });
    setMessages([]);
    setInput("");
    setShowMeetingInvite(false);
  };

  // Fetch messages for selected chat
  useEffect(() => {
    const fetchMessages = async () => {
      if (!chatDrawer.open || !chatDrawer.teacher?.offerId) return;
      try {
        const chats = await chatDb.fetchChats(chatDrawer.teacher.offerId);
        setMessages(chats || []);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
    fetchMessages();
  }, [chatDrawer.open, chatDrawer.teacher?.offerId, chatDb]);

  // Real-time chat listener
  useEffect(() => {
    if (chatDrawer.open && chatDrawer.teacher?.offerId) {
      const joinChatRoom = async () => {
        try {
          await chatDb.joinRoom(chatDrawer.teacher.offerId);
        } catch (error) {
          console.error('❌ Failed to join chat room:', error);
        }
      };
      
      joinChatRoom();

      const handleIncomingMessage = (msg) => {
        if (msg.offer === chatDrawer.teacher.offerId) {
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
  }, [chatDrawer.open, chatDrawer.teacher?.offerId, chatDb]);

  // Scroll chat to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !chatDrawer.teacher) return;
    
    const messageText = input.trim();
    setInput("");
    
    // Optimistic update
    const optimisticMessage = {
      _id: `temp_${Date.now()}`,
      message: messageText,
      sender: {
        _id: user._id,
        fullName: user.fullName,
        role: user.role
      },
      receiver: {
        _id: chatDrawer.teacher._id,
        fullName: chatDrawer.teacher.fullName,
        role: 'teacher'
      },
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };
    
    setMessages((prev) => [...prev, optimisticMessage]);
    
    try {
      const newMsg = await chatDb.createChat(
        chatDrawer.teacher._id,
        chatDrawer.teacher.offerId,
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
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      
      setMessages((prev) => 
        prev.filter(msg => !(msg.isOptimistic && msg.message === messageText))
      );
      setInput(messageText);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No profile data available</p>
      </div>
    );
  }

  // ✅ Show loading while waiting for user authentication
  if (!userLoaded || !initialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-neutral-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  // ✅ Show message if user is not a student (shouldn't happen with RoleBasedRoute)
  if (user?.role !== 'student') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-neutral-500 mb-4">Access denied. This page is for students only.</p>
          <p className="text-sm text-neutral-400">You will be redirected shortly...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 border border-gray-200 hover:bg-gray-200 transition-colors shadow-sm"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center relative">
              {editing ? (
                <div className="relative">
                  {editForm.profilePicture ? (
                    <img 
                      src={editForm.profilePicture} 
                      alt="Profile" 
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-10 w-10 text-green-600" />
                  )}
                  <label 
                    className="absolute -bottom-1 -right-1 bg-green-600 text-white rounded-full p-1 hover:bg-green-700 cursor-pointer"
                    htmlFor="profile-picture-upload"
                  >
                    <Upload className="h-3 w-3" />
                  </label>
                  <input
                    id="profile-picture-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        // Check file size (limit to 5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error("Image size must be less than 5MB");
                          return;
                        }
                        
                        // Check file type
                        if (!file.type.startsWith('image/')) {
                          toast.error("Please select a valid image file");
                          return;
                        }
                        
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          setEditForm(prev => ({ ...prev, profilePicture: e.target.result }));
                        };
                        reader.onerror = (error) => {
                          console.error('FileReader error:', error);
                          toast.error("Failed to read image file");
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              ) : (
                profileData.user.profilePicture ? (
                  <img 
                    src={profileData.user.profilePicture} 
                    alt="Profile" 
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-green-600" />
                )
              )}
            </div>
            <div>
              {editing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={editForm.fullName || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                    className="text-2xl font-bold text-gray-800 border-b border-gray-300 focus:border-green-500 outline-none bg-transparent w-full"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="text-gray-600 border-b border-gray-300 focus:border-green-500 outline-none bg-transparent w-full"
                    disabled
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="Age"
                      value={editForm.age || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, age: e.target.value }))}
                      className="text-gray-600 border-b border-gray-300 focus:border-green-500 outline-none bg-transparent"
                      min="1"
                      max="120"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={editForm.phoneNumber || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      className="text-gray-600 border-b border-gray-300 focus:border-green-500 outline-none bg-transparent"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Current School/Institution"
                    value={editForm.currentCenter || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, currentCenter: e.target.value }))}
                    className="text-gray-600 border-b border-gray-300 focus:border-green-500 outline-none bg-transparent w-full"
                  />
                  <input
                    type="text"
                    placeholder="Qualification/Grade"
                    value={editForm.qualification || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, qualification: e.target.value }))}
                    className="text-gray-600 border-b border-gray-300 focus:border-green-500 outline-none bg-transparent w-full"
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {profileData.user.fullName}
                  </h1>
                  <p className="text-gray-600">{profileData.user.email}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profileData.user.age && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        <Hash className="h-3 w-3" />
                        {profileData.user.age} years
                      </span>
                    )}
                    {profileData.user.phoneNumber && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        <Phone className="h-3 w-3" />
                        {profileData.user.phoneNumber}
                      </span>
                    )}
                    {profileData.user.qualification && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                        <GraduationCap className="h-3 w-3" />
                        {profileData.user.qualification}
                      </span>
                    )}
                    {profileData.user.currentCenter && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                        <User className="h-3 w-3" />
                        {profileData.user.currentCenter}
                      </span>
                    )}
                  </div>
                </>
              )}
              <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                Student
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button onClick={handleCancel} variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={handleEdit} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{profileData.user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{profileData.user.phoneNumber || 'Not provided'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Teachers Chat Section */}
      {teachers.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Teachers Chat
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachers.map((teacher) => (
              <div key={teacher._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <ProfileAvatar 
                    user={teacher} 
                    size="md"
                  />
                  <div>
                    <p className="font-semibold text-gray-800">{teacher.fullName}</p>
                    <p className="text-sm text-gray-500">{teacher.email}</p>
                  </div>
                </div>
                <Button 
                  onClick={() => handleOpenChat(teacher)}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Classes Attended</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {profileData.stats.classesAttended}
              </p>
            </div>
            <Calendar className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Courses Read</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {profileData.stats.coursesRead}
              </p>
            </div>
            <BookOpen className="h-10 w-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Teachers</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {profileData.stats.teachersCount}
              </p>
            </div>
            <Users className="h-10 w-10 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Accepted Offers</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {profileData.stats.acceptedOffersCount}
              </p>
            </div>
            <Award className="h-10 w-10 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Chat Drawer */}
      {chatDrawer.teacher && (
        <Sheet open={chatDrawer.open} onOpenChange={handleCloseChat}>
          <SheetContent side="right" className="max-w-md w-full flex flex-col bg-gray-100">
            <SheetHeader className="bg-green-600 text-white p-4 border-b-0">
              <div className="flex items-center gap-3">
                <ProfileAvatar 
                  user={chatDrawer.teacher} 
                  size="md"
                  className="bg-green-700"
                  showOnlineStatus={true}
                />
                <div className="flex-1">
                  <SheetTitle className="text-lg font-semibold text-white flex items-center gap-2">
                    {chatDrawer.teacher.fullName}
                  </SheetTitle>
                  <div className="text-xs text-green-100 mt-1">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-300 rounded-full"></span>
                      Teacher • Online
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => setShowMeetingInvite(!showMeetingInvite)}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-green-700"
                >
                  <Video className="w-5 h-5" />
                </Button>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f0f0f0' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}>
              {/* Meeting Invite Section */}
              {showMeetingInvite && (
                <div className="mb-4">
                  <MeetingInvite
                    recipientId={chatDrawer.teacher._id}
                    recipientName={chatDrawer.teacher.fullName}
                    recipientRole="teacher"
                    subject={`Study Session with ${chatDrawer.teacher.fullName}`}
                    onMeetingCreated={(meetingData) => {
                      setShowMeetingInvite(false);
                    }}
                  />
                </div>
              )}

              {messages.length === 0 ? (
                <div className="text-center mt-8">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="text-gray-400" size={24} />
                  </div>
                  <div className="text-gray-400 text-sm">No messages yet</div>
                  <div className="text-gray-300 text-xs mt-1">Start the conversation!</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, idx) => {
                    const isCurrentUser = msg.sender?._id === user?._id;
                    // For student chat: show teacher name for left-side messages, student name for right-side messages
                    const displayName = isCurrentUser 
                      ? user?.fullName || "You" 
                      : chatDrawer.teacher?.fullName || "Teacher";
                    
                    // Ensure we always have a unique key
                    const messageKey = msg._id || `msg-${idx}-${msg.createdAt || Date.now()}`;
                    
                    return (
                      <div key={messageKey} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] ${isCurrentUser ? "ml-12" : "mr-12"}`}>
                          {/* Sender name - only show for other person's messages (left side) */}
                          {!isCurrentUser && (
                            <div className="text-xs font-medium mb-1 text-green-600 ml-3">
                              {displayName}
                            </div>
                          )}
                          
                          {/* Message bubble with WhatsApp-style design */}
                          <div className={`relative px-4 py-2 rounded-2xl text-sm shadow-md ${
                            isCurrentUser
                              ? "bg-green-500 text-white rounded-br-md" // YOUR messages: green, right-aligned
                              : "bg-white text-gray-800 rounded-bl-md border border-gray-200" // OTHER PERSON's messages: white, left-aligned
                          } ${msg.isOptimistic ? "opacity-70" : ""}`}>
                            
                            {/* WhatsApp-style message tail */}
                            <div className={`absolute top-0 w-0 h-0 ${
                              isCurrentUser
                                ? "right-0 -mr-2 border-l-8 border-l-green-500 border-t-8 border-t-transparent border-b-8 border-b-transparent"
                                : "left-0 -ml-2 border-r-8 border-r-white border-t-8 border-t-transparent border-b-8 border-b-transparent"
                            }`}></div>
                            
                            <div className="break-words leading-relaxed">{msg.message}</div>
                            
                            {/* Timestamp and status inside the bubble */}
                            <div className={`text-xs mt-2 flex items-center gap-1 ${
                              isCurrentUser ? "text-green-100 justify-end" : "text-gray-500 justify-start"
                            }`}>
                              <span>
                                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                              </span>
                              {/* Only show status indicators for current user's messages (right side) */}
                              {isCurrentUser && (
                                <span className="flex items-center ml-1">
                                  {msg.isOptimistic ? (
                                    <div className="w-3 h-3 border border-green-200 border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <span className="text-green-200 text-sm">✓✓</span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            <div className="bg-white border-t p-4 shadow-lg">
              <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
                <div className="flex-1 relative">
                  <input
                    className="w-full border border-gray-300 rounded-full px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder-gray-500 pr-16 bg-gray-50 focus:bg-white"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    maxLength={500}
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                    {input.length > 450 && `${input.length}/500`}
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="bg-green-500 hover:bg-green-600 text-white rounded-full w-12 h-12 p-0 flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl" 
                  disabled={!input.trim()}
                >
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}