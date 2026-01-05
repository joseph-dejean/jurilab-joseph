import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './store/store';
import { Layout } from './components/Layout';
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
import { DocumentsPage } from './pages/DocumentsPage';
import { PortfolioPage } from './pages/PortfolioPage';

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register-lawyer" element={<LawyerRegistrationPage />} />
            <Route path="/lawyer/profile-editor" element={<LawyerProfileEditor />} />
            <Route path="/my-appointments" element={<MyAppointmentsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/video-call" element={<VideoCallPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppProvider>
  );
};

export default App;