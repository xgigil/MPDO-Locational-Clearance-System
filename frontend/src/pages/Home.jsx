import { Link, useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, USER_PROFILE } from "../constants";
import { useState, useEffect } from "react";
import "../styles/Home.css";

function Home() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isInternalUser, setIsInternalUser] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem(ACCESS_TOKEN);
        const profileRaw = localStorage.getItem(USER_PROFILE);
        let parsedProfile = null;
        try {
            parsedProfile = profileRaw ? JSON.parse(profileRaw) : null;
        } catch {
            parsedProfile = null;
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsLoggedIn(!!token);
        setIsInternalUser(Boolean(parsedProfile?.is_internal));
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        setIsLoggedIn(false);
        navigate("/");
    };

    return (
        <div className="home-container">
            <h1>Welcome to Locational Clearance System</h1>
            <p>Manage your applications and track your progress</p>
            
            <div className="button-group">
                <Link to="/about" className="nav-button about-btn">
                    About Us
                </Link>
                {!isLoggedIn ? (
                    <>
                        <Link to="/login" className="nav-button login-btn">
                            Login
                        </Link>
                        <Link to="/register" className="nav-button register-btn">
                            Register
                        </Link>
                        <Link to="/Application" className="nav-button application-btn">
                            Application
                        </Link>
                    </>
                ) : (
                    <>
                        <Link to="/Application" className="nav-button application-btn">
                            Application
                        </Link>
                        {isInternalUser && (
                            <Link to="/internal" className="nav-button application-btn">
                                Internal Dashboard
                            </Link>
                        )}
                        <button onClick={handleLogout} className="nav-button logout-btn">
                            Logout
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default Home;