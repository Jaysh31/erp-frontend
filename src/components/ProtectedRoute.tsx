// src/components/ProtectedRoute.tsx

import { Navigate, useLocation } from 'react-router-dom';
import { useModulePermissions } from '../hooks/useModulePermissions';
import { storage } from '../utils/storage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const { isPathAccessible } = useModulePermissions();
  
  // Check if user is authenticated
  if (!storage.isAuthenticated()) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check if token is expired
  if (storage.isTokenExpired()) {
    console.log('Token expired, clearing and redirecting to login');
    storage.clearAuthData();
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Allow access to /home and root paths
  if (location.pathname === '/home' || location.pathname === '/') {
    return <>{children}</>;
  }

  // Check if the requested path is accessible
  const accessible = isPathAccessible(location.pathname);
  console.log(`Checking path: ${location.pathname}, Accessible: ${accessible}`);
  
  if (!accessible) {
    console.log('Path not accessible, redirecting to home');
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}