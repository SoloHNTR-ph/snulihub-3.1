import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(true);

  useEffect(() => {
    if (!loading) {
      console.log('ProtectedRoute - Current User:', currentUser);
      console.log('ProtectedRoute - Required Role:', requiredRole);
      
      // Check authentication
      if (!currentUser) {
        console.log('ProtectedRoute - No current user, redirecting to login');
        // For admin routes, redirect to admin login
        if (requiredRole === 'webmaster') {
          navigate('/admin/login', { replace: true });
        } else {
          // For other routes, redirect to regular login
          navigate('/login', { replace: true });
        }
        setIsAuthorized(false);
        return;
      }

      // Check authorization
      if (requiredRole) {
        const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        console.log('ProtectedRoute - Allowed Roles:', allowedRoles);
        console.log('ProtectedRoute - User Category:', currentUser.category);
        
        if (!allowedRoles.includes(currentUser.category)) {
          // For admin routes, redirect to admin/users
          if (allowedRoles.includes('webmaster')) {
            navigate('/admin/users', { 
              state: { message: 'Access denied: Insufficient permissions' }
            });
          } else {
            // For other protected routes, redirect to login
            navigate('/login', {
              state: { message: 'Access denied: Please log in with appropriate permissions' }
            });
          }
          setIsAuthorized(false);
          return;
        }
      }

      console.log('ProtectedRoute - Access granted');
      setIsAuthorized(true);
    }
  }, [currentUser, loading, navigate, requiredRole]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Only render children if authorized
  return isAuthorized ? children : null;
};

export default ProtectedRoute;
