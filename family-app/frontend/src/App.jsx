import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import AppShell from './components/AppShell';
import Login from './pages/Login';
import Families from './pages/Families';
import Feed from './pages/Feed';
import Topology from './pages/Topology';
import Post from './pages/Post';
import { Onboarding, PendingApproval } from './pages/Onboarding';
import AdminJoinRequests from './pages/AdminJoinRequests';
import JoinFamily from './pages/JoinFamily';

function App({ RouterComponent = BrowserRouter }) {
  return (
    <RouterComponent>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/families" replace />} />
          <Route path="families" element={<Families />} />
          <Route path="feed" element={<Feed />} />
          <Route path="topology" element={<Topology />} />
          <Route path="post" element={<Post />} />
          <Route path="join" element={<JoinFamily />} />
          <Route path="admin/join-requests" element={<AdminJoinRequests />} />
        </Route>
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pending"
          element={
            <ProtectedRoute>
              <PendingApproval />
            </ProtectedRoute>
          }
        />
      </Routes>
    </RouterComponent>
  );
}

export default App;
