import React from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Application from "./pages/Application";
import ApplicationTracker from "./pages/ApplicationTracker";
import Login from "./pages/Login";
import InternalLogin from "./pages/InternalLogin";
import Register from "./pages/Register";
import Home from "./pages/Home";
import AboutUs from "./pages/AboutUs";
import NotFound from "./pages/NotFound";
import InternalHome from "./pages/InternalHome";
import ProtectedRoute from "./components/ProtectedRoutes";

function Logout() {
  localStorage.clear();
  return <Navigate to="/login" />;
}

// So when soemeone registers, local storage is cleared to prevent sending tokens to the register route. 
function RegisterandLogout() {
  localStorage.clear();
  return <Navigate to="/register" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default landing page */}
        <Route path="/" element={<Home />} />

        {/* About us page */}
        <Route path="/about" element={<AboutUs />} />

        {/* Internal protected area: Application page */}
        <Route 
          path="/Application"
          element={
            <ProtectedRoute>
              <Application />
            </ProtectedRoute>
          }
        />

        {/* Internal protected area: Application tracker page */}
        <Route 
          path="/Application/Tracker"
          element={
            <ProtectedRoute>
              <ApplicationTracker />
            </ProtectedRoute>
          }
        />

        {/* Internal protected dashboard for personnel/admin users */}
        <Route
          path="/internal"
          element={
            <ProtectedRoute requireInternal>
              <InternalHome />
            </ProtectedRoute>
          }
        />

        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/internal/login" element={<InternalLogin />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/register" element={<Register />} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
