import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Handshake, 
  Video, 
  BarChart3, 
  Settings,
  Shield
} from "lucide-react";
import Logo from "./Logo";

const adminMenuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/admin/dashboard"
  },
  {
    title: "Users",
    icon: Users,
    path: "/admin/users"
  },
  {
    title: "Posts",
    icon: FileText,
    path: "/admin/posts"
  },
  {
    title: "Offers",
    icon: Handshake,
    path: "/admin/offers"
  },
  {
    title: "Meetings",
    icon: Video,
    path: "/admin/meetings"
  },
  {
    title: "Analytics",
    icon: BarChart3,
    path: "/admin/analytics"
  }
];

export default function AdminSidebar({ isOpen = true }) {
  return (
    <div 
      className={`bg-white shadow-lg border-r border-gray-200 flex flex-col h-full transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-0 md:w-20'
      } overflow-hidden`}
    >
      {/* Logo */}
      <div className={`p-6 border-b border-gray-200 ${!isOpen && 'md:p-4'}`}>
        <div className={`flex items-center gap-2 ${!isOpen && 'md:flex-col md:gap-1'}`}>
          {isOpen ? (
            <>
              <Logo size="sm" />
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-600">Admin</span>
              </div>
            </>
          ) : (
            <div className="hidden md:flex flex-col items-center gap-1">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 flex-1 overflow-y-auto">
        <ul className="space-y-2">
          {adminMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 border-l-4 border-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    } ${!isOpen && 'md:justify-center md:px-2'}`
                  }
                  title={!isOpen ? item.title : ''}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {isOpen && <span className="font-medium">{item.title}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Admin Badge - Now at bottom but not fixed */}
      {isOpen && (
        <div className="p-4 border-t border-gray-200">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">Administrator</span>
            </div>
            <p className="text-xs text-red-600 mt-1">
              Full system access
            </p>
          </div>
        </div>
      )}
    </div>
  );
}