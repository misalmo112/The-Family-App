import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFamily } from '../context/FamilyContext';
import { getFamilies } from '../services/families';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { activeFamilyId } = useFamily();
  const location = useLocation();
  const [hasFamilies, setHasFamilies] = useState(null);
  const [checking, setChecking] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  // Routes that don't require families check
  const onboardingRoutes = ['/onboarding', '/pending'];

  // Routes that require an active family
  const familyRequiredRoutes = ['/app/feed', '/app/topology'];

  useEffect(() => {
    const checkFamilies = async () => {
      if (!isAuthenticated) {
        setChecking(false);
        return;
      }

      // Skip check for onboarding routes
      if (onboardingRoutes.some(route => location.pathname.startsWith(route))) {
        setChecking(false);
        return;
      }

      // Check if user is superadmin - if so, skip family check
      try {
        const { getHealth } = await import('../services/admin');
        await getHealth();
        setIsSuperadmin(true);
        setHasFamilies(true); // Set to true to bypass family requirement
        setChecking(false);
        return;
      } catch (err) {
        setIsSuperadmin(false);
        // Not superadmin, continue with family check
      }

      try {
        const families = await getFamilies();
        setHasFamilies(families && families.length > 0);
      } catch (err) {
        console.error('Error checking families:', err);
        // On error, assume no families to be safe
        setHasFamilies(false);
      } finally {
        setChecking(false);
      }
    };

    checkFamilies();
  }, [isAuthenticated, location.pathname]);

  // Show loading while checking auth state
  if (authLoading || checking) {
    return null; // Or a loading spinner if preferred
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user has no families and is not on onboarding routes, redirect to onboarding
  // But skip if user is superadmin
  if (hasFamilies === false && !isSuperadmin && !onboardingRoutes.some(route => location.pathname.startsWith(route))) {
    return <Navigate to="/onboarding" replace />;
  }
  
  // If user is superadmin and on a regular route, redirect to superadmin panel
  if (isSuperadmin && !location.pathname.startsWith('/superadmin') && !onboardingRoutes.some(route => location.pathname.startsWith(route))) {
    return <Navigate to="/superadmin" replace />;
  }

  // Check if current route requires active family
  if (familyRequiredRoutes.some(route => location.pathname.startsWith(route))) {
    if (!activeFamilyId) {
      // If user has families but no active one, go to families page
      // Otherwise onboarding will handle it
      return <Navigate to="/app/families" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
