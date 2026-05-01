import { useEffect, useMemo, useState } from "react";
import api from "../api";

const TRACKER_STEPS = [
    { key: "initial_review", label: "Initial Review" },
    { key: "gis_review", label: "GIS Review" },
    { key: "site_review", label: "Site Review" },
    { key: "drafting_review", label: "Draftsman Review" },
    { key: "approving_authority_review", label: "Approving Authority Review" },
];

function getTrackerStepIndex(reviewStatus) {
    if (reviewStatus === "initial_review") return 0;
    if (reviewStatus === "gis_review" || reviewStatus === "drone_review") return 1;
    if (reviewStatus === "site_review") return 2;
    if (reviewStatus === "drafting_review") return 3;
    if (reviewStatus === "approving_authority_review") return 4;
    return -1;
}

function ApplicationTracker() {
    const [loading, setLoading] = useState(true);
    const [application, setApplication] = useState(null);

    useEffect(() => {
        const loadLatest = async () => {
            try {
                const response = await api.get("/api/user/applicant/applications/my-latest/");
                setApplication(response.data?.application ?? null);
            } finally {
                setLoading(false);
            }
        };
        loadLatest();
    }, []);

    const stepStates = useMemo(() => {
        if (!application?.review_status) return [];
        const currentIdx = getTrackerStepIndex(application.review_status);
        return TRACKER_STEPS.map((step, index) => {
            // Change: tracker now follows README state colors (grey pending, yellow current, green done).
            let color = "#6b7280";
            if (application.review_status === "review_complete" || (currentIdx >= 0 && index < currentIdx)) color = "#22c55e";
            if (currentIdx >= 0 && index === currentIdx) color = "#facc15";
            return { ...step, color };
        });
    }, [application]);

    if (loading) return <div className="application-page">Loading tracker...</div>;
    if (!application) return <div className="application-page">No application found for tracker.</div>;

    return (
        <div className="application-page">
            <div className="application-card">
                <h1>Application Tracker</h1>
                <p className="helper-text">Application #{application.application_id}</p>
                <p className="helper-text">Overall Status: {application.application_status}</p>
                <div className="section-grid" style={{ marginTop: "1rem" }}>
                    {stepStates.map((step) => (
                        <div key={step.key} style={{ border: `1px solid ${step.color}`, borderRadius: "8px", padding: "0.7rem" }}>
                            <p style={{ margin: 0 }}>{step.label}</p>
                            <p style={{ margin: 0, color: step.color }}>{step.color === "#22c55e" ? "Complete" : step.color === "#facc15" ? "In Progress" : "Waiting"}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default ApplicationTracker;