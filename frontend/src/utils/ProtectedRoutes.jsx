import { Navigate, Outlet } from "react-router-dom";
import useMyContext from "@/hooks/useMyContext.jsx";

const ProtectedRoutes = () => {
  const { user, userLoaded, initialized } = useMyContext();

  // ✅ Removed loading state - go directly to auth check
  return user ? <Outlet /> : <Navigate to="/auth/login" replace />;
};

export default ProtectedRoutes;
