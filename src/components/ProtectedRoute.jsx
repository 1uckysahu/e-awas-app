import React from 'react';
import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const ProtectedRoute = ({ user, allowedRoles, children }) => {
  // 1. If no user is logged in, kick them to the login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Figure out their role based on your database structure
  const role = user.userType || user.officerType || 'public';

  // 3. If they are logged in, but don't have the right role, kick them to home
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  // 4. If they pass all checks, let them in!
  return children;
};

ProtectedRoute.propTypes = {
  user: PropTypes.object,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;