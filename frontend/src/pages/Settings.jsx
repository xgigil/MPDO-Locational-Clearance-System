import { useMemo, useState } from "react";
import { USER_PROFILE } from "../constants.js";
import api from "../api.js";

function readProfile() {
  try {
    const raw = localStorage.getItem(USER_PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function Settings() {
  const profile = useMemo(() => readProfile() || {}, []);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  return (
    <main>
      <section className="section">
        <div className="container">
          <div className="profile-shell">
            <h1 className="profile-title" style={{ textTransform: "uppercase", letterSpacing: ".4px" }}>
              Settings
            </h1>
            <p className="profile-subtitle">Account details and password changes (backend hookup pending).</p>

            <div className="settings-card">
              <div className="settings-grid">
                <div className="settings-block">
                  <div className="settings-title">Account Details</div>
                  <div className="settings-form">
                    <label className="settings-label">
                      <span>Username</span>
                      <input className="settings-input" type="text" readOnly value={String(profile.username || "")} />
                    </label>
                    <label className="settings-label">
                      <span>User ID</span>
                      <input className="settings-input" type="text" readOnly value={String(profile.user_id || "")} />
                    </label>
                    <label className="settings-label">
                      <span>Portal</span>
                      <input
                        className="settings-input"
                        type="text"
                        readOnly
                        value={profile.is_internal ? "Internal" : "Applicant"}
                      />
                    </label>
                  </div>
                </div>

                <div className="settings-block">
                  <div className="settings-title">Change Password</div>
                  <form
                    className="settings-form"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setNote("");
                      if (newPassword !== confirmNewPassword) {
                        setNote("New passwords do not match.");
                        return;
                      }
                      const errors = [];
                      if ((newPassword || "").length < 12) errors.push("at least 12 characters");
                      if (!/[A-Z]/.test(newPassword || "")) errors.push("1 uppercase letter");
                      if (!/[a-z]/.test(newPassword || "")) errors.push("1 lowercase letter");
                      if (!/[^A-Za-z0-9]/.test(newPassword || "")) errors.push("1 special character");
                      if (errors.length) {
                        setNote(`Password must have ${errors.join(", ")}.`);
                        return;
                      }

                      setBusy(true);
                      try {
                        await api.post("/api/user/change-password/", {
                          current_password: currentPassword,
                          new_password: newPassword,
                        });
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmNewPassword("");
                        setNote("Password updated successfully. Please log in again.");
                      } catch (err) {
                        const msg =
                          err?.response?.data?.current_password ||
                          err?.response?.data?.new_password ||
                          err?.response?.data?.detail ||
                          "Failed to update password.";
                        setNote(Array.isArray(msg) ? msg.join(" ") : String(msg));
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <label className="settings-label">
                      <span>Current Password</span>
                      <input
                        className="settings-input"
                        type="password"
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </label>
                    <label className="settings-label">
                      <span>New Password</span>
                      <input
                        className="settings-input"
                        type="password"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </label>
                    <label className="settings-label">
                      <span>Confirm New Password</span>
                      <input
                        className="settings-input"
                        type="password"
                        autoComplete="new-password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                      />
                    </label>

                    <div className="settings-actions">
                      <button className="track-btn" type="submit" disabled={busy}>
                        {busy ? "Updating..." : "Update Password"}
                      </button>
                    </div>
                    <div className={`settings-note ${note?.includes("success") ? "is-ok" : "is-error"}`} aria-live="polite">
                      {note}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

