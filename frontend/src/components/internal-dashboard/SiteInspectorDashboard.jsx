import { useState } from "react";
import { useRoleQueue } from "./roleQueueApi";
import ApplicationDocumentsPreview from "./ApplicationDocumentsPreview";

function SiteInspectorDashboard() {
    const { applications, loading, feedback, performAction, loadQueue } = useRoleQueue("site_inspector");
    const [fileById, setFileById] = useState({});

    if (loading) return <p className="helper-text">Loading Site Inspection queue...</p>;

    return (
        <section>
            <h3>Site Inspection Queue</h3>
            <button type="button" className="secondary-btn" onClick={loadQueue}>Refresh Queue</button>
            {feedback && <p className="helper-text" style={{ marginTop: "0.5rem" }}>{feedback}</p>}
            {(applications ?? []).map((application) => (
                <div key={application.application_id} className="application-card application-copy" style={{ marginTop: "0.75rem" }}>
                    <p>Application #{application.application_id} - {application.project?.project_title}</p>
                    <p>Status: {application.application_status} / {application.review_status}</p>
                    <ApplicationDocumentsPreview documents={application.documents ?? []} />
                    {/* Change: site inspection upload action now routes the app to draftsman review. */}
                    <input type="file" accept="application/pdf" onChange={(event) => setFileById((prev) => ({ ...prev, [application.application_id]: event.target.files?.[0] ?? null }))} />
                    <div className="button-row">
                        <button
                            type="button"
                            className="secondary-btn"
                            disabled={!fileById[application.application_id]}
                            onClick={() => {
                                const payload = new FormData();
                                payload.append("role", "site_inspector");
                                payload.append("action", "upload_site");
                                payload.append("report_type", "site_eval");
                                payload.append("report_file", fileById[application.application_id]);
                                performAction(application.application_id, payload);
                            }}
                        >
                            Upload Site Inspection Report
                        </button>
                    </div>
                </div>
            ))}
        </section>
    );
}

export default SiteInspectorDashboard;
