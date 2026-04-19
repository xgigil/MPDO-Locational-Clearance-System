import { Link, useNavigate } from "react-router-dom";
import { ACCESS_TOKEN } from "../constants";
import { useState, useEffect } from "react";
import "../styles/Home.css";

function AboutUs() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem(ACCESS_TOKEN);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsLoggedIn(!!token);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        setIsLoggedIn(false);
        navigate("/");
    };

    return (
        <div className="home-container">
            <h1>About Us</h1>
            <p>MPDO shdaojfhjksahfuohe</p>
            
            <div className="button-group">
                <Link to="/" className="nav-button home-btn">
                    Home
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
                        <button onClick={handleLogout} className="nav-button logout-btn">
                            Logout
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default AboutUs;