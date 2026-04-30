import { useMemo, useState } from "react";
import { USER_PROFILE } from "../constants.js";

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
                    onSubmit={(e) => {
                      e.preventDefault();
                      setNote("Password change endpoint is not exposed yet in the backend API.");
                    }}
                  >
                    <label className="settings-label">
                      <span>Current Password</span>
                      <input className="settings-input" type="password" autoComplete="current-password" />
                    </label>
                    <label className="settings-label">
                      <span>New Password</span>
                      <input className="settings-input" type="password" autoComplete="new-password" />
                    </label>
                    <label className="settings-label">
                      <span>Confirm New Password</span>
                      <input className="settings-input" type="password" autoComplete="new-password" />
                    </label>

                    <div className="settings-actions">
                      <button className="track-btn" type="submit">
                        Update Password
                      </button>
                    </div>
                    <div className="settings-note is-error" aria-live="polite">
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

