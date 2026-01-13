import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFamily } from '../context/FamilyContext';
import { getFamilies } from '../services/families';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { activeFamilyId } = useFamily();
  const location = useLocation();
  const [hasFamilies, setHasFamilies] = useState(null);
  const [checking, setChecking] = useState(true);

  // Routes that don't require families check
  const onboardingRoutes = ['/onboarding', '/pending'];

  // Routes that require an active family
  const familyRequiredRoutes = ['/feed', '/topology', '/post'];

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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Show loading while checking
  if (checking) {
    return null; // Or a loading spinner if preferred
  }

  // If user has no families and is not on onboarding routes, redirect to onboarding
  if (hasFamilies === false && !onboardingRoutes.some(route => location.pathname.startsWith(route))) {
    return <Navigate to="/onboarding" replace />;
  }

  // Check if current route requires active family
  if (familyRequiredRoutes.some(route => location.pathname.startsWith(route))) {
    if (!activeFamilyId) {
      // If user has families but no active one, go to families page
      // Otherwise onboarding will handle it
      return <Navigate to="/families" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
