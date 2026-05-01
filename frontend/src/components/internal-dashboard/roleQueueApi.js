import { useCallback, useEffect, useState } from "react";
import api from "../../api";

export function useRoleQueue(roleKey) {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [feedback, setFeedback] = useState("");

    const loadQueue = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get(`/api/user/internal/applications/queue/?role=${roleKey}`);
            setApplications(response.data ?? []);
        } catch (error) {
            setFeedback(`Failed to load queue: ${JSON.stringify(error.response?.data ?? {})}`);
        } finally {
            setLoading(false);
        }
    }, [roleKey]);

    useEffect(() => {
        loadQueue();
    }, [loadQueue]);

    const performAction = useCallback(async (applicationId, payload) => {
        try {
            await api.post(
                `/api/user/internal/applications/${applicationId}/action/`,
                payload,
                {
                    headers: payload instanceof FormData
                        ? { "Content-Type": "multipart/form-data" }
                        : undefined,
                }
            );
            // Reload role-filtered queue so processed applications disappear immediately.
            await loadQueue();
            setFeedback(`Action completed for application ${applicationId}.`);
        } catch (error) {
            setFeedback(`Action failed: ${JSON.stringify(error.response?.data ?? {})}`);
        }
    }, [loadQueue]);

    return {
        applications,
        loading,
        feedback,
        setFeedback,
        loadQueue,
        performAction,
    };
}
