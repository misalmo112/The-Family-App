import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import SuperadminGuard from './routes/SuperadminGuard';
import AppShell from './components/AppShell';
import SuperadminLayout from './components/SuperadminLayout';
import Login from './pages/Login';
import Families from './pages/Families';
import Feed from './pages/Feed';
import Topology from './pages/Topology';
import Post from './pages/Post';
import { Onboarding, PendingApproval } from './pages/Onboarding';
import AdminJoinRequests from './pages/AdminJoinRequests';
import JoinFamily from './pages/JoinFamily';
import SuperadminUsers from './pages/Superadmin/Users';
import SuperadminFamilies from './pages/Superadmin/Families';
import SuperadminErrorLogs from './pages/Superadmin/ErrorLogs';
import SuperadminAuditLogs from './pages/Superadmin/AuditLogs';
import SuperadminFeedback from './pages/Superadmin/Feedback';
import Dashboard from './pages/Superadmin/Dashboard';
import Health from './pages/Superadmin/Health';

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
        <Route
          path="/superadmin"
          element={
            <SuperadminGuard>
              <SuperadminLayout />
            </SuperadminGuard>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="health" element={<Health />} />
          <Route path="users" element={<SuperadminUsers />} />
          <Route path="families" element={<SuperadminFamilies />} />
          <Route path="logs/errors" element={<SuperadminErrorLogs />} />
          <Route path="logs/audit" element={<SuperadminAuditLogs />} />
          <Route path="feedback" element={<SuperadminFeedback />} />
        </Route>
      </Routes>
    </RouterComponent>
  );
}

export default App;
