import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Application from "./pages/Application";
import ApplicationTracker from "./pages/ApplicationTracker";
import ApplicantComplianceResubmit from "./pages/ApplicantComplianceResubmit";
import Login from "./pages/Login";
import InternalLogin from "./pages/InternalLogin";
import Register from "./pages/Register";
import Home from "./pages/Home";
import AboutUs from "./pages/AboutUs";
import NotFound from "./pages/NotFound";
import InternalHome from "./pages/InternalHome";
import ProtectedRoute from "./components/ProtectedRoutes";
import Layout from "./components/Layout.jsx";
import Requirements from "./pages/Requirements.jsx";
import Ask from "./pages/Ask.jsx";
import Settings from "./pages/Settings.jsx";
import Forgot from "./pages/Forgot.jsx";

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
        <Route element={<Layout />}>
          {/* Default landing page */}
          <Route path="/" element={<Home />} />

          {/* About us page */}
          <Route path="/about" element={<AboutUs />} />
          <Route path="/requirements" element={<Requirements />} />
          <Route path="/ask" element={<Ask />} />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Applicant protected area: Application page */}
          <Route
            path="/Application"
            element={
              <ProtectedRoute>
                <Application />
              </ProtectedRoute>
            }
          />

          {/* Applicant protected area: Application tracker page */}
          <Route
            path="/Application/Tracker"
            element={
              <ProtectedRoute>
                <ApplicationTracker />
              </ProtectedRoute>
            }
          />

          <Route
            path="/Application/Resubmit"
            element={
              <ProtectedRoute>
                <ApplicantComplianceResubmit />
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
          <Route path="/forgot" element={<Forgot />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
