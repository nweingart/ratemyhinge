import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function PrivateRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  console.log('[PrivateRoute] State:', {
    hasUser: !!currentUser,
    isLoading: loading,
    path: location.pathname,
    userId: currentUser?.uid
  });

  // Show nothing while checking auth state
  if (loading) {
    return null;
  }

  // Redirect to login if no user, preserving the attempted URL
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
} 