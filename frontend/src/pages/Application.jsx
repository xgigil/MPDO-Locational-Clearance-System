import { useEffect, useState } from "react";
import ApplicationCopy from "../components/ApplicationCopy";
import ApplicationForm from "../components/ApplicationForm";
import api from "../api";

function Application() {
    const [loading, setLoading] = useState(true);
    const [latestApplication, setLatestApplication] = useState(null);

    useEffect(() => {
        const fetchLatestApplication = async () => {
            try {
                const response = await api.get("/api/applications/my-latest/");
                if (response.data?.has_application) {
                    setLatestApplication(response.data.application ?? null);
                } else {
                    // No prior applications is valid; show the form.
                    setLatestApplication(null);
                }
            } catch (error) {
                // Fail open: if lookup fails, still allow first-time form submission UX.
                setLatestApplication(null);
                console.error("Failed to load /api/applications/my-latest/:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLatestApplication();
    }, []);

    const handleSubmitted = (applicationCopy) => {
        // After successful submit, switch to copy view immediately.
        setLatestApplication(applicationCopy);
    };

    if (loading) {
        return <div className="application-page">Loading application...</div>;
    }

    const hasExistingApplication = Boolean(latestApplication);
    const hasActiveIncompleteApplication =
        hasExistingApplication && latestApplication.application_completion === false;

    if (hasActiveIncompleteApplication) {
        return <ApplicationCopy application={latestApplication} />;
    }

    return <ApplicationForm onSubmitted={handleSubmitted} />;
}

export default Application;
