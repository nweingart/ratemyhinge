import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import PrivateRoute from './components/layout/PrivateRoute';
import Layout from './components/layout/Layout';
import Login from './components/auth/Login';
import GetFixed from './pages/GetFixed';
import RateProfiles from './pages/RateProfiles';
import AccountSettings from './pages/AccountSettings';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

// Separate component for routes that needs auth context
function AppRoutes() {
  const { currentUser, loading } = useAuth();

  // Show loading state or spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Root redirect */}
      <Route 
        path="/" 
        element={
          <Navigate to={currentUser ? "/get-fixed" : "/rate"} replace />
        }
      />

      {/* Public Routes */}
      <Route path="/rate" element={<Layout><RateProfiles /></Layout>} />
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes */}
      <Route
        path="/get-fixed"
        element={
          <PrivateRoute>
            <Layout><GetFixed /></Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <Layout><AccountSettings /></Layout>
          </PrivateRoute>
        }
      />

      {/* Catch all unknown routes */}
      <Route 
        path="*" 
        element={
          <Navigate to={currentUser ? "/get-fixed" : "/rate"} replace />
        }
      />
    </Routes>
  );
}

export default App; 