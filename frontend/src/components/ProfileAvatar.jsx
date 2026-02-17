import { User } from "lucide-react";

const ProfileAvatar = ({ 
  user, 
  size = "md", 
  className = "", 
  showOnlineStatus = false,
  fallbackIcon: FallbackIcon = User 
}) => {
  // Size configurations
  const sizeClasses = {
    xs: "h-6 w-6",
    sm: "h-8 w-8", 
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
    "2xl": "h-20 w-20"
  };

  const iconSizes = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5", 
    lg: "h-6 w-6",
    xl: "h-8 w-8",
    "2xl": "h-10 w-10"
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const iconSize = iconSizes[size] || iconSizes.md;

  // Role-based background colors
  const getBgColor = (role) => {
    switch (role) {
      case 'teacher':
        return 'bg-green-100';
      case 'student':
        return 'bg-blue-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getIconColor = (role) => {
    switch (role) {
      case 'teacher':
        return 'text-green-600';
      case 'student':
        return 'text-blue-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className={`relative ${sizeClass} ${className}`}>
      <div className={`${sizeClass} rounded-full flex items-center justify-center overflow-hidden ${
        user?.profilePicture ? '' : getBgColor(user?.role)
      }`}>
        {user?.profilePicture ? (
          <img 
            src={user.profilePicture} 
            alt={user.fullName || 'Profile'} 
            className={`${sizeClass} rounded-full object-cover`}
          />
        ) : (
          <FallbackIcon className={`${iconSize} ${getIconColor(user?.role)}`} />
        )}
      </div>
      
      {/* Online status indicator */}
      {showOnlineStatus && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
      )}
    </div>
  );
};

export default ProfileAvatar;