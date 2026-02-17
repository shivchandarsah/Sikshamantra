import { Outlet } from "react-router-dom";
import PropTypes from "prop-types";
import ChatNotificationManager from "../components/ChatNotificationManager.jsx";
import RoleChangeListener from "../components/RoleChangeListener.jsx";

const AppLayout = ({ children }) => {
  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  return (
    <div>
      {children}
      <ChatNotificationManager />
      {user && <RoleChangeListener user={user} />}
      <Outlet />
    </div>
  );
};

AppLayout.propTypes = {
  children: PropTypes.node,
};

export default AppLayout;
