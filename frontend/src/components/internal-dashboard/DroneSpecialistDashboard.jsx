import { useState } from "react";
import { useRoleQueue } from "./roleQueueApi";
import ApplicationDocumentsPreview from "./ApplicationDocumentsPreview";

function DroneSpecialistDashboard() {
    const { applications, loading, feedback, performAction, loadQueue } = useRoleQueue("drone_specialist");
    const [fileById, setFileById] = useState({});

    if (loading) return <p className="helper-text">Loading Drone queue...</p>;

    return (
        <section>
            <h3>Drone Inspection Queue</h3>
            <button type="button" className="secondary-btn" onClick={loadQueue}>Refresh Queue</button>
            {feedback && <p className="helper-text" style={{ marginTop: "0.5rem" }}>{feedback}</p>}
            {(applications ?? []).map((application) => (
                <div key={application.application_id} className="application-card application-copy" style={{ marginTop: "0.75rem" }}>
                    <p>Application #{application.application_id} - {application.project?.project_title}</p>
                    <p>Status: {application.application_status} / {application.review_status}</p>
                    <ApplicationDocumentsPreview documents={application.documents ?? []} />
                    {/* Change: dedicated drone report upload action that advances to site inspection. */}
                    <input type="file" accept="application/pdf" onChange={(event) => setFileById((prev) => ({ ...prev, [application.application_id]: event.target.files?.[0] ?? null }))} />
                    <div className="button-row">
                        <button
                            type="button"
                            className="secondary-btn"
                            disabled={!fileById[application.application_id]}
                            onClick={() => {
                                const payload = new FormData();
                                payload.append("role", "drone_specialist");
                                payload.append("action", "upload_drone");
                                payload.append("report_type", "drone_eval");
                                payload.append("report_file", fileById[application.application_id]);
                                performAction(application.application_id, payload);
                            }}
                        >
                            Upload Drone Inspection Report
                        </button>
                    </div>
                </div>
            ))}
        </section>
    );
}

export default DroneSpecialistDashboard;
