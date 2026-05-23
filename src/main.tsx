import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./styles.css";
import HomePage from "./pages/Home";
import PartnerPage from "./pages/Partner";
import EnrollPage from "./pages/Enroll";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminMfa from "./pages/AdminMfa";
import NotFound from "./pages/NotFound";
import RequireAdmin from "./components/RequireAdmin";
import { runAdminGuardSelfTest } from "./lib/adminGuard.selftest";
import { ADMIN_DASHBOARD_PATH, ADMIN_MFA_PATH } from "./lib/admin";

if (import.meta.env.DEV) {
  // Fire-and-forget: verifies a stale non-admin localStorage session can't
  // pass the admin check. Logs a single line to the console on success.
  void runAdminGuardSelfTest();
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/partner" element={<PartnerPage />} />
        <Route path="/enroll" element={<EnrollPage />} />
        <Route
          path={ADMIN_DASHBOARD_PATH}
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path={ADMIN_MFA_PATH} element={<AdminMfa />} />
        {/* Legacy /admin URL no longer resolves — falls through to 404. */}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
