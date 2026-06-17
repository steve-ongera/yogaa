// src/routes/AppRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/common/ProtectedRoute';

// Pages
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Discover from '../pages/Discover';
import Profile from '../pages/Profile';
import EditProfile from '../pages/EditProfile';
import Matches from '../pages/Matches';
import Chat from '../pages/Chat';
import Subscription from '../pages/Subscription';
import Verification from '../pages/Verification';
import Settings from '../pages/Settings';
import AdminDashboard from '../pages/AdminDashboard';

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/discover" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/discover" />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/discover" element={<Discover />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/chat/:matchId" element={<Chat />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/verification" element={<Verification />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;