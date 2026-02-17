import React, { useEffect, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MessageCircle, Calendar as CalendarIcon, ArrowLeft } from "lucide-react";
import useMyContext from "@/hooks/useMyContext";
import ProfileAvatar from "@/components/ProfileAvatar";
import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getSocket } from "@/utils/socket.js";

function OfferChatCard({ offer, onChat }) {
  return (
    <div className="bg-white border border-neutral-100 rounded-xl shadow-sm p-5 flex flex-col gap-2 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-neutral-800 text-base text-md max-w-[70%]">
          {offer?.post?.topic || 'Request Topic Unavailable'}
        </span>
        {offer?.post?._id && (
          <NavLink to={`/request-details/${offer.post._id}`} className="font-semibold text-neutral-800 text-base text-md">
            View Post
          </NavLink>
        )}
      </div>
      <div className="text-neutral-500 text-md mb-1 truncate">
        Teacher:{" "}
        <span className="font-semibold text-green-700">
          {offer?.offeredBy?.fullName || 'Unknown Teacher'}
        </span>
      </div>
      <div className="flex flex-wrap gap-3 text-md text-neutral-400 mb-2">
        <span>
          Fee:{" "}
          <span className="text-green-600 font-semibold">
            ₹{offer?.proposed_price || 0}
          </span>
        </span>
        <span>Time: {offer?.appointmentTime ? new Date(offer.appointmentTime).toLocaleString() : 'Time not set'}</span>
      </div>
      <div className="text-neutral-500 text-md mb-1 truncate">
        Message: <span className="">{offer?.message || 'No message'}</span>
      </div>
      <Button
        // size="sm"
        className="mt-2 bg-green-600 text-white px-4 py-2 hover:bg-green-700 flex items-center gap-2 cursor-pointer"
        onClick={() => onChat(offer)}
      >
        <MessageCircle size={18} /> Chat
      </Button>
    </div>
  );
}

function AppointmentBox({ url, time, onConfirm }) {
  return (
    <div className="mb-4 p-4 rounded-xl border border-green-200 bg-green-50 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-green-700 font-semibold mb-1">
        <CalendarIcon size={16} /> Appointment
      </div>
      <p className="text-sm text-neutral-600">
        Appointment has been scheduled at the time :{" "}
        {new Date(time).toLocaleString()}
      </p>
      {Date.now() >= new Date(time) && (
        <div className="flex gap-2 mt-2">
          <a
            className="bg-green-600 text-center flex-1 text-white hover:bg-green-700 rounded-full px-5 py-2 "
            onClick={onConfirm}
            href={url}
            target="_blank"
          >
            Join
          </a>
        </div>
      )}
    </div>
  );
}

function ChatDrawer({ open, onOpenChange, offer }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const { chatDb, appointmentDb, user } = useMyContext();
  const [appointmentMsg, setAppointmentMsg] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const fetchChats = async () => {
      if (!offer?._id) return;
      try {
        const chats = await chatDb.fetchChats(offer._id);
        setMessages(chats || []);
      } catch (error) {
        console.error("Failed to fetch chats:", error);
      }
    };
    fetchChats();
  }, [open, offer?._id, chatDb]);

  useEffect(() => {
    const fetchAppoinemt = async () => {
      if (!offer?._id) return;
      try {
        const res = await appointmentDb.fetchAppointment(offer._id);
        setAppointmentMsg(res);
      } catch (error) {
        // Silently handle - 404 errors are expected when no appointment exists
        // Other errors are logged by axios interceptor
      }
    };
    fetchAppoinemt();
  }, [open, offer?._id, appointmentDb]);

  // ✅ Real-time chat listener
  useEffect(() => {
    if (open && offer?._id) {
      // ✅ Handle async joinRoom
      const joinChatRoom = async () => {
        try {
          await chatDb.joinRoom(offer._id);
        } catch (error) {
          console.error('❌ Failed to join chat room:', error);
        }
      };
      
      joinChatRoom();

      const handleIncomingMessage = (msg) => {
        if (msg.offer === offer._id) {
          setMessages((prev) => [...prev, msg]);
        }
      };

      chatDb.onMessageReceived(handleIncomingMessage);

      return () => {
        try {
          const socket = getSocket(); // ✅ Use getSocket() instead of connectSocket()
          if (socket && typeof socket.off === 'function') {
            socket.off("receiveMessage", handleIncomingMessage);
          }
        } catch (error) {
          console.error('❌ Error cleaning up socket listener:', error);
        }
      };
    }
  }, [open, offer?._id, chatDb]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !offer) return;
    
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
        _id: offer.offeredBy._id,
        fullName: offer.offeredBy.fullName,
        role: 'teacher'
      },
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };
    
    setMessages((prev) => [...prev, optimisticMessage]);
    
    try {
      const newMsg = await chatDb.createChat(
        offer.offeredBy._id,
        offer._id,
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
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
      
      // Remove optimistic message on error
      setMessages((prev) => 
        prev.filter(msg => !(msg.isOptimistic && msg.message === messageText))
      );
      setInput(messageText); // Restore input on error
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="max-w-md w-full flex flex-col bg-gray-50">
        <SheetHeader className="bg-white p-4 border-b">
          <div className="flex items-center gap-3">
            <ProfileAvatar 
              user={offer?.offeredBy} 
              size="md"
            />
            <div className="flex-1">
              <SheetTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                💬 {offer?.offeredBy.fullName}
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              </SheetTitle>
              <div className="text-xs text-gray-500 mt-1">
                <span className="inline-flex items-center gap-1">
                  <span className="text-green-500">●</span>
                  Teacher • Online
                </span>
                {offer?.post && (
                  <span className="ml-2">
                    • For request: <span className="font-medium text-green-600">{offer.post.topic}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        {appointmentMsg && (
          <AppointmentBox
            url={appointmentMsg?.zoomLink}
            time={appointmentMsg?.scheduleTime}
            status={""}
            onConfirm={() => {}}
            onReject={() => {}}
          />
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages?.length === 0 ? (
            <div className="text-center mt-8">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="text-gray-400" size={24} />
              </div>
              <div className="text-gray-400 text-sm">No messages yet</div>
              <div className="text-gray-300 text-xs mt-1">Start the conversation!</div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages?.map((msg, idx) => {
                // ✅ WhatsApp-style: Check if current user is the sender
                const isCurrentUser = msg.sender?._id === user?._id;
                // For student offers page: show teacher name for left-side messages, student name for right-side messages
                const displayName = isCurrentUser 
                  ? user?.fullName || "You" 
                  : offer?.offeredBy?.fullName || "Teacher";
                
                // Ensure we always have a unique key
                const messageKey = msg._id || `msg-${idx}-${msg.createdAt || Date.now()}`;
                
                return (
                  <div key={messageKey} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} mb-4`}>
                    <div className="max-w-[75%]">
                      {/* Sender name - only show for other person's messages */}
                      {!isCurrentUser && (
                        <div className="text-xs font-medium mb-1 text-left text-blue-600">
                          {displayName}
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
          <form onSubmit={handleSend} className="flex gap-3 items-end">
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
  );
}

export default function Offers() {
  const navigate = useNavigate();
  const [chatDrawer, setChatDrawer] = useState({ open: false, offer: null });
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { offerDb, user, userLoaded, initialized } = useMyContext();

  const handleOpenChat = (offer) => {
    setChatDrawer({ open: true, offer });
  };
  const handleCloseChat = () => {
    setChatDrawer({ open: false, offer: null });
  };

  useEffect(() => {
    const fetchOffers = async () => {
      // ✅ Wait for user authentication
      if (!user || !userLoaded || !initialized) {
        return;
      }

      if (!offerDb) {
        return;
      }

      setLoading(true);
      try {
        const response = await offerDb.fetchOffers();
        setOffers(response || []);
      } catch (error) {
        console.error("❌ Failed to fetch offers:", error);
        console.error("❌ Error details:", error.response?.data);
        // Don't show error toast for empty results
        if (error.response?.status !== 404) {
          toast.error("Failed to load offers. Please try again later.");
        }
        setOffers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [offerDb, user, userLoaded, initialized]);

  return (
    <div className="w-full ">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
          title="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-1 tracking-tight">
          Accepted Offers
        </h1>
        <p className="text-neutral-500 text-base md:text-lg">
          Here are the teachers you've chosen for your learning requests. Click
          ‘Chat’ to stay connected and prepare for your upcoming sessions.
        </p>
        </div>
      </div>
      {offers.length === 0 ? (
        <div className="text-neutral-400 text-center py-16">
          No accepted offers yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-4 text-center text-neutral-500">
              Loading offers...
            </div>
          ) : offers.length > 0 ? (
            offers.map((offer) => (
              <OfferChatCard
                key={offer._id}
                offer={offer}
                onChat={handleOpenChat}
              />
            ))
          ) : (
            <div className="col-span-4 text-center text-neutral-500">
              No offers available.
            </div>
          )}
        </div>
      )}

      {loading ? (
        <></>
      ) : (
        offers.length > 0 && (
          <ChatDrawer
            open={chatDrawer.open}
            onOpenChange={handleCloseChat}
            offer={chatDrawer.offer}
          />
        )
      )}
    </div>
  );
}
