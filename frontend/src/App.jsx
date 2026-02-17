import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth.jsx";
import { MyContextProvider } from "./utils/context/myContext.jsx";
import ProtectedRoutes from "./utils/ProtectedRoutes";
import RoleBasedRoute from "./utils/RoleBasedRoute";

// Layouts & Pages
import AppLayout from "./layouts/AppLayout";
import LandingPageLayout from "./layouts/LandingPageLayout";
import Home from "./pages/LandingPage/Home";
import Feature from "./components/Landingpage/Feature";
import Testimonials from "./components/Landingpage/Testimonial";
import Faq from "./components/Landingpage/Faq";
import About from "./pages/LandingPage/About";
import Contact from "./pages/LandingPage/Contact";
import Login from "./pages/Login";
import Registration from "./pages/Registration";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResendVerification from "./pages/auth/ResendVerification.jsx";
import VerifyEmail from "./pages/auth/VerifyEmail.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";
import ResetPasswordRedirect from "./components/ResetPasswordRedirect.jsx";
import MeetingNotification from "./components/MeetingNotification.jsx";
import SimpleMeetingReminder from "./components/SimpleMeetingReminder.jsx";
import AppointmentNotification from "./components/AppointmentNotification.jsx";
import Chatbot from "./components/Chatbot.jsx";
import MeetingsPage from "./pages/shared/Meetings.jsx";
import NotFound from "./pages/NotFound";

// Student Pages
import StudentLayout from "./layouts/StudentLayout";
import StudentDashboard from "./pages/student/Dashboard";
import StudentProfile from "./pages/student/Profile";
import StudentProfileView from "./pages/StudentProfileView";
import StudentCourses from "./pages/student/Courses";
import StudentPaymentHistory from "./pages/student/PaymentHistory";
import StudentReviews from "./pages/student/Reviews";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminPosts from "./pages/admin/Posts";
import AdminOffers from "./pages/admin/Offers";
import AdminMeetings from "./pages/admin/Meetings";
import AdminAnalytics from "./pages/admin/Analytics";
import Offers from "./pages/student/Offers";
import Requests from "./pages/student/Requests";

// Teacher Pages
import TeacherLayout from "./layouts/TeacherLayout";
import TeacherDashboard from "./pages/teacher/Dashboard";
import TeacherProfile from "./pages/teacher/Profile";
import ExploreRequests from "./pages/teacher/ExploreRequests";
import Offered from "./pages/teacher/Offered";
import TeacherCourses from "./pages/teacher/Courses";
import TeacherReviews from "./pages/teacher/Reviews";
import TeacherEarnings from "./pages/teacher/Earnings";
import PaymentSettings from "./pages/teacher/PaymentSettings";

import RequestDetails from "./pages/requestDetails";
import { Toaster } from "sonner";
import NetworkStatus from "./components/NetworkStatus";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      // Landing pages
      {
        path: "",
        element: <LandingPageLayout />,
        children: [
          { index: true, element: <Home /> },
          { path: "feature", element: <Feature /> },
          { path: "testimonials", element: <Testimonials /> },
          { path: "faq", element: <Faq /> },
          { path: "about", element: <About /> },
          { path: "contact", element: <Contact /> },
        ],
      },

      // Auth routes
      {
        path: "auth",
        element: <Outlet />,
        children: [
          { path: "login", element: <Login /> },
          { path: "register", element: <Registration /> },
          { path: "forgot-password", element: <ForgotPassword /> },
          { path: "reset-password/:token", element: <ResetPassword /> },
          { path: "verify-email", element: <VerifyEmail /> },
          { path: "resend-verification", element: <ResendVerification /> },
        ],
      },

      // Request details
      { path: "request-details/:id", element: <RequestDetails /> },
      
      // Payment callback routes (public - no auth required)
      { path: "payment/success", element: <PaymentSuccess /> },
      { path: "payment/failure", element: <PaymentFailure /> },
      
      // Legacy reset password redirect (for old emails without /auth prefix)
      { path: "reset-password/:token", element: <ResetPasswordRedirect /> },

      // Protected Student & Teacher routes
      {
        path: "",
        element: <ProtectedRoutes />,
        children: [
          // Meetings page (accessible to all authenticated users)
          { path: "meetings", element: <MeetingsPage /> },
          
          {
            path: "student",
            element: <RoleBasedRoute allowedRoles={['student']} />,
            children: [
              {
                path: "",
                element: <StudentLayout />,
                children: [
                  { path: "dashboard", element: <StudentDashboard /> },
                  { path: "requests", element: <Requests /> },
                  { path: "accepted-offers", element: <Offers /> },
                  { path: "courses", element: <StudentCourses /> },
                  { path: "payments", element: <StudentPaymentHistory /> },
                  { path: "reviews", element: <StudentReviews /> },
                  { path: "profile", element: <StudentProfile /> },
                ],
              },
            ],
          },
          {
            path: "teacher",
            element: <RoleBasedRoute allowedRoles={['teacher']} />,
            children: [
              {
                path: "",
                element: <TeacherLayout />,
                children: [
                  { path: "dashboard", element: <TeacherDashboard /> },
                  { path: "explore-requests", element: <ExploreRequests /> },
                  { path: "offered", element: <Offered /> },
                  { path: "courses", element: <TeacherCourses /> },
                  { path: "earnings", element: <TeacherEarnings /> },
                  { path: "reviews", element: <TeacherReviews /> },
                  { path: "payment-settings", element: <PaymentSettings /> },
                  { path: "profile", element: <TeacherProfile /> },
                ],
              },
            ],
          },
          {
            path: "admin",
            element: <RoleBasedRoute allowedRoles={['admin']} />,
            children: [
              {
                path: "",
                element: <AdminLayout />,
                children: [
                  { path: "dashboard", element: <AdminDashboard /> },
                  { path: "users", element: <AdminUsers /> },
                  { path: "posts", element: <AdminPosts /> },
                  { path: "offers", element: <AdminOffers /> },
                  { path: "meetings", element: <AdminMeetings /> },
                  { path: "analytics", element: <AdminAnalytics /> },
                ],
              },
            ],
          },
          // Public student profile view (accessible by teachers)
          {
            path: "student-profile/:studentId",
            element: <StudentProfileView />,
          },
        ],
      },

      { path: "*", element: <NotFound /> },
    ],
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <MyContextProvider>
        <AppContent />
      </MyContextProvider>
    </AuthProvider>
  );
}

// Separate component to handle loading state
function AppContent() {
  return (
    <main>
      <Toaster richColors position="top-center" />
      <NetworkStatus />
      <MeetingNotification />
      <SimpleMeetingReminder />
      <AppointmentNotification />
      <Chatbot />
      <RouterProvider router={router} />
    </main>
  );
}
