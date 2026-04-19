// For Login and Register forms, which are used in the Login and Register pages respectively
import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/Form.css"
import LoadingIndicator from "./LoadingIndicator";

function Form({ route, method }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Shared fields
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Extra fields for register
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [middleInitial, setMiddleInitial] = useState("");
    const [suffix, setSuffix] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [birthdate, setBirthdate] = useState("");
    const [houseStreet, setHouseStreet] = useState("");
    const [barangay, setBarangay] = useState("");

    const name = method === "login" ? "Login" : "Register";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (method === "login") {
            // Login only needs email + password
            const res = await api.post(route, { email, password });
            localStorage.setItem(ACCESS_TOKEN, res.data.access);
            localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
            navigate("/");
            } else {
            // Register needs full serializer fields
            await api.post(route, {
                email,
                password,
                first_name: firstName,
                last_name: lastName,
                middle_initial: middleInitial,
                suffix,
                contact_number: contactNumber,
                birthdate,
                applicant: {
                house_street: houseStreet,
                barangay,
                },
            });
            navigate("/login");
            }
        } catch (error) {
            console.log(error.response?.data); // shows DRF validation errors
            alert("Registration failed. Check console for details.");
        } finally {
            setLoading(false);
        }
    };


    return (
        <form onSubmit={handleSubmit} className="form-container">
            <h1>{name}</h1>
            <input
                className="form-input"
                type="text"
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

            {/* Extra Fields only for register */}
            {method === "register" && (
                <>
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
    )
}

export default Form