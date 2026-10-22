// src/components/ProtectedRoute.tsx

import { Navigate, useLocation } from 'react-router-dom';
import { storage } from '../utils/storage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  
  // 1. Check if user is authenticated
  if (!storage.isAuthenticated()) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // 2. Check if token is expired
  if (storage.isTokenExpired()) {
    console.log('Token expired, clearing and redirecting to login');
    storage.clearAuthData();
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // 3. If the user is logged in and token is valid, ALLOW ACCESS to the page.
  // We removed the isPathAccessible check because it was incorrectly returning false 
  // for routes like /bom and causing unwanted redirects to /home.
  return <>{children}</>;
}