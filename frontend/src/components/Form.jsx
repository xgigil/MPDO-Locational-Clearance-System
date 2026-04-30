import { useState } from "react";
import api from "../api";
import { Link, useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN, USER_PROFILE } from "../constants";
import LoadingIndicator from "./LoadingIndicator";

function Form({ route, method, portal = "applicant", requireInternal = false, disallowInternal = false }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Shared fields
    const [login, setLogin] = useState("");   // username OR email for login
    const [password, setPassword] = useState("");

    // Extra fields for register
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [middleInitial, setMiddleInitial] = useState("");
    const [suffix, setSuffix] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [birthdate, setBirthdate] = useState("");
    const [houseStreet, setHouseStreet] = useState("");
    const [barangay, setBarangay] = useState("");

    const name = method === "login" ? "Login" : "Register";
    const loginTitle = portal === "internal" ? "Internal User Login" : "Applicant Login";
    const loginHelper =
        portal === "internal"
            ? "Authorized internal accounts only."
            : "Sign in to submit and track your application.";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (method === "login") {
                // Login for both external and internal users.
                const res = await api.post(route, { username: login, password });

                // Keep internal and external portals separate by account type.
                if (requireInternal && !res.data.is_internal) {
                    localStorage.removeItem(ACCESS_TOKEN);
                    localStorage.removeItem(REFRESH_TOKEN);
                    localStorage.removeItem(USER_PROFILE);
                    alert("This portal is for internal users only.");
                    return;
                }
                if (disallowInternal && res.data.is_internal) {
                    localStorage.removeItem(ACCESS_TOKEN);
                    localStorage.removeItem(REFRESH_TOKEN);
                    localStorage.removeItem(USER_PROFILE);
                    alert("Invalid login credentials.");
                    return;
                }

                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
                localStorage.setItem(USER_PROFILE, JSON.stringify({
                    user_id: res.data.user_id,
                    username: res.data.username,
                    is_admin: res.data.is_admin,
                    is_personnel: res.data.is_personnel,
                    is_applicant: res.data.is_applicant,
                    is_internal: res.data.is_internal,
                    personnel_roles: res.data.personnel_roles ?? [],
                }));
                navigate(res.data.is_internal ? "/internal" : "/");
            } else {
                // Register: email must be inside applicant
                await api.post(route, {
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
                        // Keep this for backwards compatibility; backend now defaults to user email.
                        email,
                        house_street: houseStreet,
                        barangay,
                    },
                });
                navigate("/login");
            }
        } catch (error) {
            console.log(error.response?.data);
            alert(`${name} failed. Check console for details.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main>
            <div className="container auth-wrap">
                <div className="auth-card">
                    <h1 className="auth-title">{method === "login" ? loginTitle : "Create an Account"}</h1>
                    {method === "login" ? (
                        <p className="auth-subtitle">{loginHelper}</p>
                    ) : (
                        <p className="auth-subtitle">Create an account to access applications and tracking.</p>
                    )}

                    <form onSubmit={handleSubmit}>
                        {method === "login" && (
                            <>
                                <label className="auth-label">
                                    <span>Username or Email</span>
                                    <input
                                        type="text"
                                        value={login}
                                        onChange={(e) => setLogin(e.target.value)}
                                        placeholder="Username or Email"
                                        autoComplete="username"
                                        required
                                    />
                                </label>
                                <label className="auth-label">
                                    <span>Password</span>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        required
                                    />
                                </label>

                                <div className="auth-row">
                                    <label className="auth-check">
                                        <input type="checkbox" name="remember" />
                                        <span>Remember me</span>
                                    </label>
                                    <Link className="auth-link" to="/forgot">
                                        Forgot Password
                                    </Link>
                                </div>

                                <button className="btn-login" type="submit" disabled={loading}>
                                    {loading ? "Signing in..." : "Login"}
                                </button>

                                {portal !== "internal" && (
                                    <div className="auth-divider">
                                        <span className="auth-divider-line" aria-hidden="true"></span>
                                        <button
                                            className="auth-divider-text auth-divider-link"
                                            type="button"
                                            onClick={() => navigate("/register")}
                                        >
                                            Don&apos;t have an account?
                                        </button>
                                        <span className="auth-divider-line" aria-hidden="true"></span>
                                    </div>
                                )}

                                {portal !== "internal" && (
                                    <div className="auth-subtitle" style={{ marginTop: 14, marginBottom: 0 }}>
                                        Internal personnel/admin accounts should log in via{" "}
                                        <Link className="auth-link" to="/internal/login">
                                            Internal Login
                                        </Link>
                                        .
                                    </div>
                                )}
                            </>
                        )}

                        {method === "register" && (
                            <>
                                <label className="auth-label">
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
                                <label className="auth-label">
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

                                <div className="auth-row" style={{ justifyContent: "stretch" }}>
                                    <label className="auth-label" style={{ flex: 1, marginTop: 0 }}>
                                        <span>First Name</span>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            placeholder="First Name"
                                            required
                                        />
                                    </label>
                                    <label className="auth-label" style={{ flex: 1, marginTop: 0 }}>
                                        <span>Last Name</span>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            placeholder="Last Name"
                                            required
                                        />
                                    </label>
                                </div>

                                <div className="auth-row" style={{ justifyContent: "stretch" }}>
                                    <label className="auth-label" style={{ flex: 1, marginTop: 0 }}>
                                        <span>Middle Initial</span>
                                        <input
                                            type="text"
                                            value={middleInitial}
                                            onChange={(e) => setMiddleInitial(e.target.value)}
                                            placeholder="M"
                                            maxLength={1}
                                        />
                                    </label>
                                    <label className="auth-label" style={{ flex: 1, marginTop: 0 }}>
                                        <span>Suffix</span>
                                        <input
                                            type="text"
                                            value={suffix}
                                            onChange={(e) => setSuffix(e.target.value)}
                                            placeholder="Suffix"
                                        />
                                    </label>
                                </div>

                                <label className="auth-label">
                                    <span>Contact Number</span>
                                    <input
                                        type="text"
                                        value={contactNumber}
                                        onChange={(e) => setContactNumber(e.target.value)}
                                        placeholder="Contact Number"
                                        required
                                    />
                                </label>
                                <label className="auth-label">
                                    <span>Birthdate</span>
                                    <input
                                        type="date"
                                        value={birthdate}
                                        onChange={(e) => setBirthdate(e.target.value)}
                                        required
                                    />
                                </label>
                                <label className="auth-label">
                                    <span>House / Street</span>
                                    <input
                                        type="text"
                                        value={houseStreet}
                                        onChange={(e) => setHouseStreet(e.target.value)}
                                        placeholder="House Street"
                                        required
                                    />
                                </label>
                                <label className="auth-label">
                                    <span>Barangay</span>
                                    <input
                                        type="text"
                                        value={barangay}
                                        onChange={(e) => setBarangay(e.target.value)}
                                        placeholder="Barangay"
                                        required
                                    />
                                </label>
                            </>
                        )}

                        {loading && <LoadingIndicator />}

                        {method === "register" && (
                            <button className="btn-login" type="submit" disabled={loading}>
                                {loading ? "Creating..." : "Register"}
                            </button>
                        )}

                        <div className="forgot-actions">
                            <button className="btn-forgot-cancel" type="button" onClick={() => navigate(-1)}>
                                Back
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}

export default Form;