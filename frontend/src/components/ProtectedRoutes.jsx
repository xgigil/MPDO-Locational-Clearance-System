import {useNavigate, useLocation} from "react-router-dom";
import {jwtDecode} from "jwt-decode";
import api from "../api";
import { REFRESH_TOKEN, ACCESS_TOKEN, USER_PROFILE } from "../constants";
import { useState, useEffect } from "react";

// This component is used to protect routes that require authentication. To check if user is authorized before they can access the route. Otherwise, they are redirect and are required to login first.
// Frontend protection only
function ProtectedRoute({ children, requireInternal = false }) {
    const [isAuthorized, setIsAuthorized] = useState(null);
    const [hasRequiredPortalAccess, setHasRequiredPortalAccess] = useState(true);
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
            const res = await api.post("/api/user/applicant/refresh/", { 
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
            localStorage.removeItem(ACCESS_TOKEN);
            localStorage.removeItem(REFRESH_TOKEN);
            localStorage.removeItem(USER_PROFILE);
            setIsAuthorized(false);
        }
    }

    // Check if token needs to be refreshed or it is good to go
    const hasInternalAccessFromCache = () => {
        try {
            const profileRaw = localStorage.getItem(USER_PROFILE);
            const profile = profileRaw ? JSON.parse(profileRaw) : null;
            return Boolean(profile?.is_internal);
        } catch {
            return false;
        }
    };

    const auth = async () => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        
        if (!token) { 
            setIsAuthorized(false)
            return
        }

        const decoded = jwtDecode(token);
        const tokenExpiration = decoded.exp; // JWT exp is in seconds
        const now = Date.now() / 1000; // Current time in seconds

        if (tokenExpiration < now) {
            await refreshToken();
        } else {
            setIsAuthorized(true); // If token is still valid, set isAuthorized to true
        }

        // Internal route guard: authenticated applicants cannot open internal pages.
        if (requireInternal && !hasInternalAccessFromCache()) {
            setHasRequiredPortalAccess(false);
        } else {
            setHasRequiredPortalAccess(true);
        }
    }

    useEffect(() => {
        // If not authorized, redirect to login and replace the history entry
        if (isAuthorized === false) {
            navigate(requireInternal ? "/internal/login" : "/login", { replace: true });
            return;
        }
        // If logged in but wrong portal type, send user to external home.
        if (isAuthorized && requireInternal && !hasRequiredPortalAccess) {
            navigate("/", { replace: true });
        }
    }, [isAuthorized, hasRequiredPortalAccess, navigate, requireInternal]);

    // 
    if (isAuthorized === null) {
        return <div>Loading...</div>
    }

    // If the user is authorized, render the children components
    return isAuthorized && hasRequiredPortalAccess ? children : null;
}

export default ProtectedRoute;