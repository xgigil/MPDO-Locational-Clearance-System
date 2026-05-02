// For intercepters, which intercepts requests and responses to add the access token to the header and refresh the token if it has expired
import axios from "axios";
import { ACCESS_TOKEN } from "./constants";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL
})

api.interceptors.request.use(
    // Look into local storage and see if there is an access token, if there is, add it as an authorization header of the request
    (config) => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        // For passing a JWT access token
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
)



// to use api object instead of the axios default to send all the different requests to the backend.
export default api;