import { useState } from "react";
import { useRoleQueue } from "./roleQueueApi";
import ApplicationDocumentsPreview from "./ApplicationDocumentsPreview";

function GisSpecialistDashboard() {
    const { applications, loading, feedback, performAction, loadQueue } = useRoleQueue("gis_specialist");
    const [fileById, setFileById] = useState({});
    const [requiresDroneById, setRequiresDroneById] = useState({});
    const [commentById, setCommentById] = useState({});

    if (loading) return <p className="helper-text">Loading GIS queue...</p>;

    const submit = (applicationId) => {
        const payload = new FormData();
        payload.append("role", "gis_specialist");
        payload.append("action", "upload_gis");
        payload.append("report_type", "gis_eval");
        payload.append("requires_drone", String(Boolean(requiresDroneById[applicationId])));
        payload.append("comment", commentById[applicationId] ?? "");
        payload.append("report_file", fileById[applicationId]);
        performAction(applicationId, payload);
    };

    return (
        <section>
            <h3>GIS Specialist Queue</h3>
            <button type="button" className="secondary-btn" onClick={loadQueue}>Refresh Queue</button>
            {feedback && <p className="helper-text" style={{ marginTop: "0.5rem" }}>{feedback}</p>}
            {(applications ?? []).map((application) => (
                <div key={application.application_id} className="application-card application-copy" style={{ marginTop: "0.75rem" }}>
                    <p>Application #{application.application_id} - {application.project?.project_title}</p>
                    <p>Status: {application.application_status} / {application.review_status}</p>
                    <ApplicationDocumentsPreview documents={application.documents ?? []} />
                    {/* Change: GIS upload can now route either to drone review or site review. */}
                    <input type="file" accept="application/pdf" onChange={(event) => setFileById((prev) => ({ ...prev, [application.application_id]: event.target.files?.[0] ?? null }))} />
                    <label style={{ display: "block", marginTop: "0.5rem" }}>
                        <input type="checkbox" checked={Boolean(requiresDroneById[application.application_id])} onChange={(event) => setRequiresDroneById((prev) => ({ ...prev, [application.application_id]: event.target.checked }))} />
                        {" "}Require Drone Inspection
                    </label>
                    <input
                        placeholder="Comment (required reason when drone is requested)"
                        value={commentById[application.application_id] ?? ""}
                        onChange={(event) => setCommentById((prev) => ({ ...prev, [application.application_id]: event.target.value }))}
                    />
                    <div className="button-row">
                        <button type="button" className="secondary-btn" disabled={!fileById[application.application_id]} onClick={() => submit(application.application_id)}>
                            Upload GIS Evaluation
                        </button>
                    </div>
                </div>
            ))}
        </section>
    );
}

export default GisSpecialistDashboard;
