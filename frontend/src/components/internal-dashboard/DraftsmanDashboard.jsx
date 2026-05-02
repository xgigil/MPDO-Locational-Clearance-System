import { useState } from "react";
import { useRoleQueue } from "./roleQueueApi";
<<<<<<< HEAD
import ApplicationDocumentsPreview from "./ApplicationDocumentsPreview";

function DraftsmanDashboard() {
    const { applications, loading, feedback, performAction, loadQueue } = useRoleQueue("draftsman");
    const [fileById, setFileById] = useState({});
=======
import ApplicationPreviousStagesPreview from "./ApplicationPreviousStagesPreview";
import "../../styles/Application.css";

function PdfDropzone({ label, file, onFileChange, required = false }) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        const droppedFile = event.dataTransfer.files?.[0];
        if (!droppedFile) return;
        if (droppedFile.type !== "application/pdf") {
            alert(`${label} — PDF files only.`);
            return;
        }
        onFileChange(droppedFile);
    };

    return (
        <label className="wiz-label" style={{ display: "block", marginTop: "0.75rem" }}>
            <span>
                {label}
                {required ? " *" : ""}
            </span>
            <div
                className={`dropzone ${isDragging ? "dragging" : ""}`}
                onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
            >
                <input
                    className="dropzone-input"
                    type="file"
                    accept="application/pdf"
                    onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
                />
                {file ? (
                    <p className="dropzone-file">{file.name}</p>
                ) : (
                    <p className="dropzone-placeholder">Drag and drop a PDF here, or click to browse.</p>
                )}
            </div>
        </label>
    );
}

function DraftsmanDashboard() {
    const { applications, loading, feedback, performAction, loadQueue } = useRoleQueue("draftsman");
    const [evaluationFileById, setEvaluationFileById] = useState({});
    const [locationalClearanceDraftById, setLocationalClearanceDraftById] = useState({});
>>>>>>> eb68380 (for draftsman and authuority)
    const [isEndorsedById, setIsEndorsedById] = useState({});

    if (loading) return <p className="helper-text">Loading Draftsman queue...</p>;

<<<<<<< HEAD
=======
    const getEndorsed = (applicationId, application) =>
        Object.prototype.hasOwnProperty.call(isEndorsedById, applicationId)
            ? Boolean(isEndorsedById[applicationId])
            : Boolean(application.application_endorsement);

    const canSubmit = (applicationId, application) => {
        const endorsed = getEndorsed(applicationId, application);
        const hasEval = Boolean(evaluationFileById[applicationId]);
        const hasLcDraft = Boolean(locationalClearanceDraftById[applicationId]);
        if (!hasEval) return false;
        if (endorsed && !hasLcDraft) return false;
        return true;
    };

>>>>>>> eb68380 (for draftsman and authuority)
    return (
        <section>
            <h3>Draftsman Queue</h3>
            <button type="button" className="secondary-btn" onClick={loadQueue}>Refresh Queue</button>
            {feedback && <p className="helper-text" style={{ marginTop: "0.5rem" }}>{feedback}</p>}
<<<<<<< HEAD
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
=======
            {(applications ?? []).map((application) => {
                const applicationId = application.application_id;
                const endorsed = getEndorsed(applicationId, application);
                return (
                    <div key={applicationId} className="application-card application-copy" style={{ marginTop: "0.75rem" }}>
                        <p>Application #{applicationId} - {application.project?.project_title}</p>
                        <p>Status: {application.application_status} / {application.review_status}</p>
                        <ApplicationPreviousStagesPreview application={application} />
                        <label style={{ display: "block", margin: "0.5rem 0" }}>
                            <input
                                type="checkbox"
                                checked={endorsed}
                                onChange={(event) => {
                                    const checked = event.target.checked;
                                    setIsEndorsedById((prev) => ({ ...prev, [applicationId]: checked }));
                                    if (!checked) {
                                        setLocationalClearanceDraftById((prev) => {
                                            const next = { ...prev };
                                            delete next[applicationId];
                                            return next;
                                        });
                                    }
                                }}
                            />
                            {" "}Endorsed for MPDC review
                        </label>

                        {endorsed && (
                            <PdfDropzone
                                label="Locational Clearance Draft (signed)"
                                file={locationalClearanceDraftById[applicationId] ?? null}
                                required
                                onFileChange={(file) =>
                                    setLocationalClearanceDraftById((prev) => ({ ...prev, [applicationId]: file }))
                                }
                            />
                        )}

                        <PdfDropzone
                            label="Evaluation Report (signed)"
                            file={evaluationFileById[applicationId] ?? null}
                            required
                            onFileChange={(file) =>
                                setEvaluationFileById((prev) => ({ ...prev, [applicationId]: file }))
                            }
                        />

                        <div className="button-row" style={{ marginTop: "0.75rem" }}>
                            <button
                                type="button"
                                className="secondary-btn"
                                disabled={!canSubmit(applicationId, application)}
                                onClick={() => {
                                    const payload = new FormData();
                                    payload.append("role", "draftsman");
                                    payload.append("action", "upload_draftsman_report");
                                    payload.append("is_endorsed", String(endorsed));
                                    payload.append("evaluation_report_file", evaluationFileById[applicationId]);
                                    if (endorsed) {
                                        payload.append(
                                            "locational_clearance_draft_file",
                                            locationalClearanceDraftById[applicationId]
                                        );
                                    }
                                    performAction(applicationId, payload);
                                }}
                            >
                                Submit to Approving Authority
                            </button>
                        </div>
                    </div>
                );
            })}
>>>>>>> eb68380 (for draftsman and authuority)
        </section>
    );
}

export default DraftsmanDashboard;
