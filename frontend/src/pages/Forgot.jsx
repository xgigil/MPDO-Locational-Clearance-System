import { useState } from "react";
import { Link } from "react-router-dom";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <main>
      <div className="container auth-wrap">
        <div className="auth-card forgot-card">
          <h1 className="auth-title">Forgot Password</h1>
          <p className="auth-subtitle forgot-subtitle">Enter your email and we’ll send reset instructions (demo).</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <label className="auth-label">
              <span>Email Address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                autoComplete="email"
                required
              />
            </label>

            <div className="forgot-actions">
              <button className="btn-forgot-send" type="submit">
                Send Reset Link
              </button>
              <Link className="btn-forgot-cancel" to="/login">
                Back to Login
              </Link>
            </div>

            {sent && (
              <div className="auth-subtitle" style={{ marginTop: 16, marginBottom: 0 }}>
                If this email exists, a reset link has been sent (demo).
              </div>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}

