import {useNavigate, useLocation} from "react-router-dom";
import {jwtDecode} from "jwt-decode";
import api from "../api";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../constants";
import { useState, useEffect } from "react";

// This component is used to protect routes that require authentication. To check if user is authorized before they can access the route. Otherwise, they are redirect and are required to login first.
// Frontend protection only
function ProtectedRoute({children}) { 
    const [isAuthorized, setIsAuthorized] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // eslint-disable-next-line react-hooks/immutability
        auth().catch(() => setIsAuthorized(false));
        }, [navigate, location]);

    // Refresh the access token automathically
    const refreshToken = async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN);

        // Send a request to the backend to refresh the access token using the refresh token
        try {
            const res = await api.post("/api/token/refresh/", { 
                refresh: refreshToken, 
            });

            if (res.status === 200) {
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                setIsAuthorized(true);
            } else {
                setIsAuthorized(false);
            }

        } catch (error) {
            console.log("Error refreshing token:", error);
            setIsAuthorized(false);
        }
    }

    // Check if token needs to be refreshed or it is good to go
    const auth = async () => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        
        if (!token) { 
            setIsAuthorized(false)
            return
        }

        const decoded = jwtDecode(token);
        const tokenExpiration = decoded.exp * 1000; // Convert to milliseconds
        const now = Date.now() / 1000; // Convert to seconds

        if (tokenExpiration < now) {
            await refreshToken();
        } else {
            setIsAuthorized(true); // If token is still valid, set isAuthorized to true
        }
    }

    useEffect(() => {
        // If not authorized, redirect to login and replace the history entry
        if (isAuthorized === false) {
            navigate("/login", { replace: true });
        }
    }, [isAuthorized, navigate]);

    // 
    if (isAuthorized === null) {
        return <div>Loading...</div>
    }

    // If the user is authorized, render the children components
    return isAuthorized ? children : null;
}

export default ProtectedRoute;