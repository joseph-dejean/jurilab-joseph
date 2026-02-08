import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './store/store';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { LawyerRegistrationPage } from './pages/LawyerRegistrationPage';
import { LawyerProfileEditor } from './pages/LawyerProfileEditor';
import { MyAppointmentsPage } from './pages/MyAppointmentsPage';
import VideoCallPage from './pages/VideoCallPage';
import { AdminPage } from './pages/AdminPage';
import { MessagesPage } from './pages/MessagesPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { CalendarPage } from './pages/CalendarPage';
import { ProfileCompletionPage } from './pages/ProfileCompletionPage';
import { CalendarProvider } from './context/CalendarContext';

// Wrapper component to add error boundary to each route
const RouteErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary
    fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-deep-950 p-4">
        <div className="bg-white dark:bg-deep-900 p-6 rounded-lg shadow-xl max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-3">Page Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This page encountered an error. Try navigating to another page or refresh.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => window.history.back()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-200 dark:bg-deep-700 text-gray-800 dark:text-gray-200 py-2 px-4 rounded hover:bg-gray-300 dark:hover:bg-deep-600 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

const AppContent: React.FC = () => {
  const { currentUser } = useApp();

  return (
      <CalendarProvider currentUser={currentUser}>
        <HashRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<RouteErrorBoundary><HomePage /></RouteErrorBoundary>} />
              <Route path="/search" element={<RouteErrorBoundary><SearchPage /></RouteErrorBoundary>} />
              <Route path="/dashboard" element={<RouteErrorBoundary><DashboardPage /></RouteErrorBoundary>} />
              <Route path="/login" element={<RouteErrorBoundary><LoginPage /></RouteErrorBoundary>} />
              <Route path="/complete-profile" element={<RouteErrorBoundary><ProfileCompletionPage /></RouteErrorBoundary>} />
              <Route path="/register-lawyer" element={<RouteErrorBoundary><LawyerRegistrationPage /></RouteErrorBoundary>} />
              <Route path="/lawyer/profile-editor" element={<RouteErrorBoundary><LawyerProfileEditor /></RouteErrorBoundary>} />
              <Route path="/my-appointments" element={<RouteErrorBoundary><MyAppointmentsPage /></RouteErrorBoundary>} />
              <Route path="/messages" element={<RouteErrorBoundary><MessagesPage /></RouteErrorBoundary>} />
              <Route path="/video-call" element={<RouteErrorBoundary><VideoCallPage /></RouteErrorBoundary>} />
              <Route path="/portfolio" element={<RouteErrorBoundary><PortfolioPage /></RouteErrorBoundary>} />
              <Route path="/calendar" element={<RouteErrorBoundary><CalendarPage /></RouteErrorBoundary>} />
              <Route path="/admin" element={<RouteErrorBoundary><AdminPage /></RouteErrorBoundary>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </HashRouter>
      </CalendarProvider>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
