import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/Application.css";

function ApplicantComplianceResubmit() {
    const [loading, setLoading] = useState(true);
    const [application, setApplication] = useState(null);
    const [documents, setDocuments] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const loadLatest = async () => {
            try {
                const response = await api.get("/api/user/applicant/applications/my-latest/");
                const latest = response.data?.application ?? null;
                setApplication(latest);
            } catch {
                setApplication(null);
            } finally {
                setLoading(false);
            }
        };
        loadLatest();
    }, []);

    const requiredDocumentTypes = useMemo(
        () => application?.compliance_required_document_types ?? [],
        [application]
    );

    const canResubmit =
        application?.application_status === "notice_to_comply" &&
        requiredDocumentTypes.length > 0;

    const handleSubmit = async () => {
        if (!application?.application_id) return;

        const missing = requiredDocumentTypes.filter((documentType) => !documents[documentType]);
        if (missing.length > 0) {
            setMessage(`Please upload all required documents: ${missing.join(", ")}`);
            return;
        }

        setSubmitting(true);
        setMessage("");
        try {
            const payload = new FormData();
            requiredDocumentTypes.forEach((documentType) => {
                payload.append(documentType, documents[documentType]);
            });

            const response = await api.post(
                `/api/user/applicant/applications/${application.application_id}/resubmit-compliance/`,
                payload,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            setMessage(response.data?.message ?? "Compliance documents resubmitted.");
            // Redirect applicant back to application copy to verify status returned to pending.
            setTimeout(() => navigate("/Application"), 700);
        } catch (error) {
            setMessage(
                String(
                    error.response?.data?.detail ??
                    "Resubmission failed. Please check required files."
                )
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="application-page">Loading compliance resubmission...</div>;

    return (
        <div className="application-page">
            <div className="application-card">
                <h1>Notice to Comply - Resubmit Documents</h1>
                {!canResubmit ? (
                    <>
                        <p className="helper-text">
                            This application is not currently in `notice_to_comply` state with required documents.
                        </p>
                        <div className="button-row">
                            <Link to="/Application" className="secondary-btn">Back to Application</Link>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="helper-text">Application ID: {application.application_id}</p>
                        {!!application.compliance_message && (
                            <p className="status-message">{application.compliance_message}</p>
                        )}
                        <p className="helper-text">
                            Only the document types selected by Record Staff are editable here.
                        </p>
                        <div className="section-grid" style={{ marginTop: "0.75rem" }}>
                            {requiredDocumentTypes.map((documentType) => (
                                <div key={documentType}>
                                    <label className="field-label">{documentType}</label>
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={(event) =>
                                            setDocuments((prev) => ({
                                                ...prev,
                                                [documentType]: event.target.files?.[0] ?? null,
                                            }))
                                        }
                                    />
                                </div>
                            ))}
                        </div>

                        {message && <p className="status-message">{message}</p>}

                        <div className="button-row">
                            <Link to="/Application" className="secondary-btn">Cancel</Link>
                            <button
                                type="button"
                                className="primary-btn"
                                disabled={submitting}
                                onClick={handleSubmit}
                            >
                                {submitting ? "Submitting..." : "Resubmit Required Documents"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default ApplicantComplianceResubmit;
