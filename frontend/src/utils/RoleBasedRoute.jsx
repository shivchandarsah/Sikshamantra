import { Navigate, Outlet } from "react-router-dom";
import useMyContext from "@/hooks/useMyContext.jsx";
import { toast } from "sonner";
import { useEffect, useState } from "react";

const RoleBasedRoute = ({ allowedRoles = [], redirectTo = "/dashboard" }) => {
  const { user, userLoaded, initialized } = useMyContext();
  const [hasShownError, setHasShownError] = useState(false);

  useEffect(() => {
    if (user && userLoaded && initialized && !hasShownError) {
      if (!allowedRoles.includes(user.role)) {
        toast.error(`Access denied. This page is only for ${allowedRoles.join(' and ')}s.`);
        setHasShownError(true);
      }
    }
  }, [user, userLoaded, initialized, allowedRoles, hasShownError]);

  // Wait for user to be loaded
  if (!userLoaded || !initialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Redirect if role not allowed
  if (!allowedRoles.includes(user.role)) {
    let redirectPath;
    switch (user.role) {
      case 'student':
        redirectPath = '/student/dashboard';
        break;
      case 'teacher':
        redirectPath = '/teacher/dashboard';
        break;
      case 'admin':
        redirectPath = '/admin/dashboard';
        break;
      default:
        redirectPath = '/auth/login';
    }
    return <Navigate to={redirectPath} replace />;
  }

  // Render the protected component
  return <Outlet />;
};

export default RoleBasedRoute;