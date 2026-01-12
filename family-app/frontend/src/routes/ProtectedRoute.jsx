import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFamily } from '../context/FamilyContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { activeFamilyId } = useFamily();
  const location = useLocation();

  // Routes that require an active family
  const familyRequiredRoutes = ['/feed', '/topology', '/post'];

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if current route requires active family
  if (familyRequiredRoutes.some(route => location.pathname.startsWith(route))) {
    if (!activeFamilyId) {
      return <Navigate to="/families" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
