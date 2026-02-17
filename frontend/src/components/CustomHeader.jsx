
import { useSidebar } from "@/components/ui/sidebar";
import Dropdown from "./DropDown";
import { ChevronDown, LogOut, Menu, User } from "lucide-react";
import useMyContext from "@/hooks/useMyContext";
import ProfileAvatar from "./ProfileAvatar";
import NotificationCenter from "./NotificationCenter";
import { useLocation } from "react-router-dom";

const CustomHeader = ({ onToggleSidebar }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // Only use sidebar hook if not in admin routes
  let toggleSidebar = null;
  try {
    if (!isAdminRoute) {
      const sidebar = useSidebar();
      toggleSidebar = sidebar.toggleSidebar;
    }
  } catch (error) {
    // Sidebar provider not available, which is fine for admin routes
  }

  const {auth, user} = useMyContext();

 

  const logoutUser = async () => {
    try {
      await auth.logout();
    } catch (error) {
      console.error(error);
    }
  };

  const getProfilePath = () => {
    if (user?.role === "student") {
      return "/student/profile";
    } else if (user?.role === "teacher") {
      return "/teacher/profile";
    } else if (user?.role === "admin") {
      return "/admin/dashboard";
    }
    return "#";
  };

  const items = [
    {
      label: "Profile",
      path: getProfilePath(),
      icon: <User />,
    },
    {
      label: "Logout",
      onclick: logoutUser,
      icon: <LogOut />,
    },
  ];

  const Trigger = () => {
    return (
      <div className="flex justify-center items-center gap-x-2 hover:cursor-pointer">
        <ProfileAvatar 
          user={user} 
          size="md" 
          className="border border-gray-400"
        />
        <div className="hidden md:block">
          <p className="text-gray-700 text-sm font-medium">{user?.fullName || 'User'}</p>
          <p className="text-gray-500 text-xs capitalize">{user?.role || 'Role'}</p>
        </div>
        <span>
           <ChevronDown />
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white px-3 py-3 flex justify-between items-center sticky top-0 z-10 border-b">
      {!isAdminRoute && toggleSidebar && (
        <button
          onClick={toggleSidebar}
          className="text-2xl text-black-100 rounded-full hover:cursor-pointer"
        >
         <Menu />
        </button>
      )}
      {isAdminRoute && (
        <button
          onClick={onToggleSidebar}
          className="text-2xl text-gray-600 rounded-full hover:cursor-pointer hover:bg-gray-100 p-2 transition-colors"
        >
         <Menu />
        </button>
      )}
      <div className="flex gap-x-4 items-center">
        <NotificationCenter />
        <Dropdown items={items} trigger={<Trigger />} />
      </div>
    </div>
  );
};

export default CustomHeader;
