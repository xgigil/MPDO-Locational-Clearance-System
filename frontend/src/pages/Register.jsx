import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

function Register() {
  const navigate = useNavigate();
  const dateRef = useRef(null);

  const [busy, setBusy] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [suffix, setSuffix] = useState("");

  const [contactNumber, setContactNumber] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [houseStreet, setHouseStreet] = useState("");
  const [barangay, setBarangay] = useState("");

  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!agree) {
      setError("Please agree to the terms to continue.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== repeatPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      await api.post("/api/user/applicant/register/", {
        username,
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        middle_initial: middleInitial,
        suffix,
        contact_number: contactNumber,
        birthdate,
        applicant: {
          email,
          house_street: houseStreet,
          barangay,
        },
      });
      navigate("/login");
    } catch (err) {
      const msg = err?.response?.data
        ? JSON.stringify(err.response.data)
        : "Registration failed. Please check your inputs and try again.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="section">
      <div className="container auth-wrap">
        <div className="register-page-card">
          <div className="register-grid">
            <div className="register-hero" aria-hidden="true">
              <img className="register-hero-img" src="/boat pic.avif" alt="" />
              <div className="register-hero-overlay">
                <div className="register-hero-title">WELCOME</div>
                <div className="register-hero-sub">Municipality of Alubijid</div>
              </div>
            </div>

            <div className="register-panel">
              <h2 className="register-page-title">Create an Account</h2>
              <p className="register-page-subtitle">
                Create an account to access applications and tracking.
              </p>

              <div className={`register-feedback ${error ? "is-show" : ""}`} role="alert" aria-live="polite">
                {error}
              </div>

              <form className="register-form" autoComplete="on" onSubmit={submit}>
                <div className="register-form-row">
                  <label>
                    <span>Username</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username"
                      autoComplete="username"
                      required
                    />
                  </label>
                  <label>
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
                </div>

                <div className="register-form-row" style={{ marginTop: 18 }}>
                  <label>
                    <span>First Name</span>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First Name"
                      autoComplete="given-name"
                      required
                    />
                  </label>
                  <label>
                    <span>Last Name</span>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last Name"
                      autoComplete="family-name"
                      required
                    />
                  </label>
                </div>

                <div className="register-form-row" style={{ marginTop: 18 }}>
                  <label>
                    <span>Middle Initial (optional)</span>
                    <input
                      type="text"
                      value={middleInitial}
                      onChange={(e) => setMiddleInitial(e.target.value)}
                      placeholder="M"
                      maxLength={1}
                      autoComplete="additional-name"
                    />
                  </label>
                  <label>
                    <span>Suffix (optional)</span>
                    <input
                      type="text"
                      value={suffix}
                      onChange={(e) => setSuffix(e.target.value)}
                      placeholder="Jr., III"
                      autoComplete="honorific-suffix"
                    />
                  </label>
                </div>

                <div className="register-form-row" style={{ marginTop: 18 }}>
                  <label>
                    <span>Phone Number</span>
                    <input
                      type="tel"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="+63-XXX-XXX-XXXX"
                      autoComplete="tel"
                      required
                    />
                  </label>
                  <label className="date-field">
                    <span>Birthday</span>
                    <input
                      ref={dateRef}
                      type="date"
                      value={birthdate}
                      onChange={(e) => setBirthdate(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="date-field-trigger"
                      aria-label="Open calendar"
                      onClick={() => {
                        const el = dateRef.current;
                        if (!el) return;
                        if (typeof el.showPicker === "function") el.showPicker();
                        else {
                          el.focus();
                          el.click();
                        }
                      }}
                    >
                      <span className="date-field-icon" aria-hidden="true"></span>
                    </button>
                  </label>
                </div>

                <div className="register-form-row" style={{ marginTop: 18 }}>
                  <label>
                    <span>Password</span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      required
                    />
                  </label>
                  <label>
                    <span>Repeat Password</span>
                    <input
                      type="password"
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      required
                    />
                  </label>
                </div>

                <div className="register-form-row" style={{ marginTop: 18 }}>
                  <label>
                    <span>House Street</span>
                    <input
                      type="text"
                      value={houseStreet}
                      onChange={(e) => setHouseStreet(e.target.value)}
                      placeholder="House / Street"
                      required
                    />
                  </label>
                  <label>
                    <span>Barangay</span>
                    <input
                      type="text"
                      value={barangay}
                      onChange={(e) => setBarangay(e.target.value)}
                      placeholder="Barangay"
                      required
                    />
                  </label>
                </div>

                <label className="register-terms register-agree" style={{ marginTop: 18 }}>
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} required />
                  <span>
                    By signing up you agree to our <span className="register-link">Terms and conditions</span> and{" "}
                    <span className="register-link">Privacy policy</span>
                  </span>
                </label>

                <div className="register-actions">
                  <button className="register-submit" type="submit" disabled={busy}>
                    {busy ? "Creating..." : "SIGN UP"}
                  </button>
                </div>

                <div className="register-alt">
                  <Link className="register-alt-link" to="/login">
                    Already have an account?
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Register;