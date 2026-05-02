import { useState } from "react";
import { useRoleQueue } from "./roleQueueApi";
import ApplicationDocumentsPreview from "./ApplicationDocumentsPreview";

function DraftsmanDashboard() {
    const { applications, loading, feedback, performAction, loadQueue } = useRoleQueue("draftsman");
    const [fileById, setFileById] = useState({});
    const [isEndorsedById, setIsEndorsedById] = useState({});

    if (loading) return <p className="helper-text">Loading Draftsman queue...</p>;

    return (
        <section>
            <h3>Draftsman Queue</h3>
            <button type="button" className="secondary-btn" onClick={loadQueue}>Refresh Queue</button>
            {feedback && <p className="helper-text" style={{ marginTop: "0.5rem" }}>{feedback}</p>}
            {(applications ?? []).map((application) => (
                <div key={application.application_id} className="application-card application-copy" style={{ marginTop: "0.75rem" }}>
                    <p>Application #{application.application_id} - {application.project?.project_title}</p>
                    <p>Status: {application.application_status} / {application.review_status}</p>
                    <ApplicationDocumentsPreview documents={application.documents ?? []} />
                    {/* Change: draftsman can now set endorsement state before forwarding to approving authority. */}
                    <label style={{ display: "block", margin: "0.5rem 0" }}>
                        <input
                            type="checkbox"
                            checked={Boolean(isEndorsedById[application.application_id])}
                            onChange={(event) => setIsEndorsedById((prev) => ({ ...prev, [application.application_id]: event.target.checked }))}
                        />
                        {" "}Endorsed for MPDC review
                    </label>
                    <input type="file" accept="application/pdf" onChange={(event) => setFileById((prev) => ({ ...prev, [application.application_id]: event.target.files?.[0] ?? null }))} />
                    <div className="button-row">
                        <button
                            type="button"
                            className="secondary-btn"
                            disabled={!fileById[application.application_id]}
                            onClick={() => {
                                const payload = new FormData();
                                payload.append("role", "draftsman");
                                payload.append("action", "upload_draftsman_report");
                                payload.append("report_type", "eval_rep");
                                payload.append("is_endorsed", String(Boolean(isEndorsedById[application.application_id])));
                                payload.append("report_file", fileById[application.application_id]);
                                performAction(application.application_id, payload);
                            }}
                        >
                            Upload Draftsman Evaluation
                        </button>
                    </div>
                </div>
            ))}
        </section>
    );
}

export default DraftsmanDashboard;
