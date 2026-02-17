import { createContext, useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth.jsx";
import useOffer from "../services/offerService.js";
import usePost from "../services/postService.js";
import useChat from "../services/chatService.js";
import useAppointment from "../services/appointmentService.js";
import useMeeting from "../services/meetingService.js";
import useNotification from "../services/notificationService.js";

// ✅ Create context with proper export for HMR
const MyContext = createContext();

const MyContextProvider = ({ children }) => {
  const [userLoaded, setUserLoaded] = useState(false);

  const auth = useAuth();
  const { user = null, loading = true, initialized = false } = auth || {};

  // ✅ Optimize: Only mark user as loaded when auth is initialized
  useEffect(() => {
    if (initialized && !userLoaded) {
      setUserLoaded(true);
    }
  }, [initialized, userLoaded]);

  // ✅ Initialize service instances directly (not in useMemo callback)
  const offerDb = useOffer();
  const postDb = usePost();
  const chatDb = useChat();
  const appointmentDb = useAppointment();
  const meetingDb = useMeeting();
  const notificationDb = useNotification();

  // ✅ Memoize context data to prevent unnecessary re-renders
  const contextData = useMemo(() => ({
    loading,
    user,
    userLoaded,
    initialized,
    auth,
    offerDb,
    postDb,
    chatDb,
    appointmentDb,
    meetingDb,
    notificationDb,
  }), [loading, user, userLoaded, initialized, auth, offerDb, postDb, chatDb, appointmentDb, meetingDb, notificationDb]);

  return <MyContext.Provider value={contextData}>{children}</MyContext.Provider>;
};

// ✅ Export both named and default for better HMR compatibility
export { MyContext, MyContextProvider };
export default MyContextProvider;
