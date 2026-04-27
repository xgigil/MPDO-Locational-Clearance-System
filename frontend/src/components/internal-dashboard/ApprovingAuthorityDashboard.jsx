import { useState } from "react";
import { useRoleQueue } from "./roleQueueApi";

function ApprovingAuthorityDashboard() {
    const { applications, loading, feedback, performAction, loadQueue } = useRoleQueue("approving_authority");
    const [fileById, setFileById] = useState({});
    const [commentById, setCommentById] = useState({});

    if (loading) return <p className="helper-text">Loading Approving Authority queue...</p>;

    return (
        <section>
            <h3>Approving Authority Queue</h3>
            <button type="button" className="secondary-btn" onClick={loadQueue}>Refresh Queue</button>
            {feedback && <p className="helper-text" style={{ marginTop: "0.5rem" }}>{feedback}</p>}
            {(applications ?? []).map((application) => (
                <div key={application.application_id} className="application-card application-copy" style={{ marginTop: "0.75rem" }}>
                    <p>Application #{application.application_id} - {application.project?.project_title}</p>
                    <p>Status: {application.application_status} / {application.review_status}</p>
                    <input type="file" accept="application/pdf" onChange={(event) => setFileById((prev) => ({ ...prev, [application.application_id]: event.target.files?.[0] ?? null }))} />
                    <input
                        placeholder="Rejection or approval notes"
                        value={commentById[application.application_id] ?? ""}
                        onChange={(event) => setCommentById((prev) => ({ ...prev, [application.application_id]: event.target.value }))}
                    />
                    <div className="button-row">
                        {/* Change: approving authority now has explicit approve + reject actions. */}
                        <button
                            type="button"
                            className="secondary-btn"
                            disabled={!fileById[application.application_id]}
                            onClick={() => {
                                const payload = new FormData();
                                payload.append("role", "approving_authority");
                                payload.append("action", "upload_approving_report");
                                payload.append("report_type", "signed_eval_rep");
                                payload.append("report_file", fileById[application.application_id]);
                                performAction(application.application_id, payload);
                            }}
                        >
                            Approve and Upload Signed Report
                        </button>
                        <button
                            type="button"
                            className="secondary-btn"
                            onClick={() => performAction(application.application_id, {
                                role: "approving_authority",
                                action: "reject_application",
                                comment: commentById[application.application_id] ?? "",
                            })}
                        >
                            Reject Application
                        </button>
                    </div>
                </div>
            ))}
        </section>
    );
}

export default ApprovingAuthorityDashboard;
