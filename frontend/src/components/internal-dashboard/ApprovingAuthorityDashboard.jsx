<<<<<<< HEAD
import { useState } from "react";
import { useRoleQueue } from "./roleQueueApi";
import ApplicationDocumentsPreview from "./ApplicationDocumentsPreview";
=======
import { useMemo, useState } from "react";
import { useRoleQueue } from "./roleQueueApi";
import ApplicationPreviousStagesPreview from "./ApplicationPreviousStagesPreview";
>>>>>>> eb68380 (for draftsman and authuority)

function ApprovingAuthorityDashboard() {
    const { applications, loading, feedback, performAction, loadQueue } = useRoleQueue("approving_authority");
    const [fileById, setFileById] = useState({});
    const [commentById, setCommentById] = useState({});

<<<<<<< HEAD
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
                    <ApplicationDocumentsPreview documents={application.documents ?? []} />
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
=======
    const endorsedApps = useMemo(
        () => (applications ?? []).filter((application) => application.application_endorsement === true),
        [applications]
    );
    const notEndorsedApps = useMemo(
        () => (applications ?? []).filter((application) => application.application_endorsement !== true),
        [applications]
    );

    if (loading) return <p className="helper-text">Loading Approving Authority queue...</p>;

    const renderCard = (application) => (
        <div key={application.application_id} className="application-card application-copy" style={{ marginTop: "0.75rem" }}>
            <p>Application #{application.application_id} - {application.project?.project_title}</p>
            <p>Status: {application.application_status} / {application.review_status}</p>
            <ApplicationPreviousStagesPreview application={application} />
            <input
                type="file"
                accept="application/pdf"
                onChange={(event) =>
                    setFileById((prev) => ({ ...prev, [application.application_id]: event.target.files?.[0] ?? null }))
                }
            />
            <input
                placeholder="Rejection or approval notes"
                value={commentById[application.application_id] ?? ""}
                onChange={(event) =>
                    setCommentById((prev) => ({ ...prev, [application.application_id]: event.target.value }))
                }
            />
            <div className="button-row">
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
                    onClick={() =>
                        performAction(application.application_id, {
                            role: "approving_authority",
                            action: "reject_application",
                            comment: commentById[application.application_id] ?? "",
                        })
                    }
                >
                    Reject Application
                </button>
            </div>
        </div>
    );

    return (
        <section>
            <h3>Approving Authority Queue</h3>
            <p className="helper-text">
                Grouped by Draftsman endorsement. Rejecting marks the application rejected and review complete; it appears
                under Record Staff → Final Rejected.
            </p>
            <button type="button" className="secondary-btn" onClick={loadQueue}>Refresh Queue</button>
            {feedback && <p className="helper-text" style={{ marginTop: "0.5rem" }}>{feedback}</p>}

            <h4 style={{ marginTop: "1rem" }}>Endorsed for MPDC review</h4>
            {!endorsedApps.length ? (
                <p className="helper-text">No endorsed applications in queue.</p>
            ) : (
                endorsedApps.map(renderCard)
            )}

            <h4 style={{ marginTop: "1.25rem" }}>Not endorsed for MPDC review</h4>
            {!notEndorsedApps.length ? (
                <p className="helper-text">No not-endorsed applications in queue.</p>
            ) : (
                notEndorsedApps.map(renderCard)
            )}
>>>>>>> eb68380 (for draftsman and authuority)
        </section>
    );
}

export default ApprovingAuthorityDashboard;
