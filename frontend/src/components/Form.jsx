import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN, USER_PROFILE } from "../constants";
import "../styles/Form.css";
import LoadingIndicator from "./LoadingIndicator";

function Form({ route, method, portal = "applicant", requireInternal = false }) {
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
        <form onSubmit={handleSubmit} className="form-container">
            <h1>{method === "login" ? loginTitle : name}</h1>
            {method === "login" && <p>{loginHelper}</p>}

            {method === "login" && (
                <>
                    <input
                        className="form-input"
                        type="text"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        placeholder="Username"
                        required
                    />
                    <input
                        className="form-input"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                    />
                </>
            )}

            {method === "register" && (
                <>
                    <input
                        className="form-input"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username"
                        required
                    />
                    <input
                        className="form-input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        required
                    />
                    <input
                        className="form-input"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                    />
                    <input
                        className="form-input"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First Name"
                        required
                    />
                    <input
                        className="form-input"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last Name"
                        required
                    />
                    <input
                        className="form-input"
                        type="text"
                        value={middleInitial}
                        onChange={(e) => setMiddleInitial(e.target.value)}
                        placeholder="Middle Initial"
                    />
                    <input
                        className="form-input"
                        type="text"
                        value={suffix}
                        onChange={(e) => setSuffix(e.target.value)}
                        placeholder="Suffix"
                    />
                    <input
                        className="form-input"
                        type="text"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        placeholder="Contact Number"
                        required
                    />
                    <input
                        className="form-input"
                        type="date"
                        value={birthdate}
                        onChange={(e) => setBirthdate(e.target.value)}
                        placeholder="Birthdate"
                        required
                    />
                    <input
                        className="form-input"
                        type="text"
                        value={houseStreet}
                        onChange={(e) => setHouseStreet(e.target.value)}
                        placeholder="House Street"
                        required
                    />
                    <input
                        className="form-input"
                        type="text"
                        value={barangay}
                        onChange={(e) => setBarangay(e.target.value)}
                        placeholder="Barangay"
                        required
                    />
                </>
            )}

            {loading && <LoadingIndicator />}

            <button className="form-button" type="submit">
                {name}
            </button>
            <button className="form-button" type="button" onClick={() => navigate(-1)}>
                Back
            </button>
        </form>
    );
}

export default Form;