import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import PublicNavbar from "./components/layout/PublicNavbar";
import Footer from "./components/layout/Footer";

import Home from "./pages/public/Home.jsx";
import Properties from "./pages/public/Properties.jsx";
import PropertyDetail from "./pages/public/PropertyDetail.jsx";
import Contact from "./pages/public/Contact.jsx";
import About from "./pages/public/About.jsx";

import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import VerifyEmail from "./pages/auth/VerifyEmail.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";

import ProtectedRoute from "./components/layout/ProtectedRoute.jsx";
import AdminLayout from "./components/layout/AdminLayout.jsx";

import Dashboard from "./pages/admin/Dashboard.jsx";
import PropertiesAdmin from "./pages/admin/PropertiesAdmin.jsx";
import InquiriesAdmin from "./pages/admin/InquiriesAdmin.jsx";
import SalesManagement from "./pages/admin/SalesManagement.jsx";
import Analytics from "./pages/admin/Analytics.jsx";
import Profile from "./pages/admin/Profile.jsx";
import PropertyDetailPage from "./pages/admin/PropertyDetailPage.jsx";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route
          element={
            <>
              <PublicNavbar />
              <main className="flex-1">
                <Outlet />
              </main>
              <Footer />
            </>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/properties/:id" element={<PropertyDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        {/* AUTH ROUTES */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/register" element={<Register />} />
        <Route path="/admin/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* ADMIN ROUTES */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="properties" element={<PropertiesAdmin />} />
          <Route path="properties/:id" element={<PropertyDetailPage />} />
          <Route path="profile" element={<Profile />} />
          <Route path="inquiries" element={<InquiriesAdmin />} />
          <Route path="sales" element={<SalesManagement />} />
          <Route path="reports" element={<Analytics />} />
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
      />
    </AuthProvider>
  );
}
