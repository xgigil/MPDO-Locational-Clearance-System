import { useMemo, useState } from "react";
import { useRoleQueue } from "./roleQueueApi";
import ApplicationDocumentsPreview from "./ApplicationDocumentsPreview";

const COMPLIANCE_DOCUMENT_OPTIONS = [
    { key: "lot_title", label: "Lot Title" },
    { key: "survey_plan", label: "Survey Plan" },
    { key: "tax_dec", label: "Tax Declaration" },
    { key: "tax_clear", label: "Tax Clearance" },
    { key: "brgy_const_clear", label: "Barangay Construction Clearance" },
    { key: "deed_of_sale", label: "Deed of Sale" },
    { key: "auth_letter", label: "Authorization Letter" },
    { key: "letter_exception", label: "Letter of Exception" },
    { key: "draw_plan", label: "Drawing Plan" },
    { key: "app_fr_bldg_permit", label: "Application for Building Permit" },
    { key: "cost_est", label: "Cost Estimate" },
    { key: "struc_analysis", label: "Structural Analysis" },
    { key: "loc_clear_app_form", label: "Locational Clearance Application Form" },
];

function RecordStaffDashboard() {
    const { applications, loading, feedback, performAction, loadQueue } = useRoleQueue("record_staff");
    const [commentById, setCommentById] = useState({});
    const [paymentFileById, setPaymentFileById] = useState({});
    const [paymentErrorById, setPaymentErrorById] = useState({});
    const [selectedComplianceDocsById, setSelectedComplianceDocsById] = useState({});
    const [paymentReadyById, setPaymentReadyById] = useState({});

    const pendingApps = useMemo(
        () => (applications ?? []).filter((application) => application.application_status === "pending"),
        [applications]
    );
    const complianceApps = useMemo(
        () => (applications ?? []).filter((application) => application.application_status === "notice_to_comply"),
        [applications]
    );
    const uploadPaymentApps = useMemo(
        () => (applications ?? []).filter((application) => application.application_status === "upload_payment"),
        [applications]
    );
    const acceptedCompleteApps = useMemo(
        () =>
            (applications ?? []).filter(
                (application) =>
                    application.application_status === "accepted" &&
                    application.review_status === "review_complete"
            ),
        [applications]
    );
    const rejectedCompleteApps = useMemo(
        () =>
            (applications ?? []).filter(
                (application) =>
                    application.application_status === "rejected" &&
                    application.review_status === "review_complete"
            ),
        [applications]
    );

    const toggleComplianceDoc = (applicationId, documentType) => {
        setSelectedComplianceDocsById((prev) => {
            const existing = prev[applicationId] ?? [];
            const hasDoc = existing.includes(documentType);
            return {
                ...prev,
                [applicationId]: hasDoc
                    ? existing.filter((docType) => docType !== documentType)
                    : [...existing, documentType],
            };
        });
    };

    const renderApplicationCopySummary = (application) => (
        <div style={{ margin: "0.5rem 0" }}>
            <p style={{ margin: 0 }}>Application #{application.application_id} - {application.submitted_by_username}</p>
            <p style={{ margin: "0.25rem 0" }}>Project: {application.project?.project_title || "N/A"}</p>
            <p style={{ margin: "0.25rem 0" }}>Status: {application.application_status} / {application.review_status}</p>
            <ApplicationDocumentsPreview documents={application.documents ?? []} />
            {!!application.compliance_required_document_types?.length && (
                <p className="helper-text" style={{ marginTop: "0.35rem" }}>
                    Required for compliance: {application.compliance_required_document_types.join(", ")}
                </p>
            )}
        </div>
    );

    const hasUploadedProofPayment = (application) =>
        (application.documents ?? []).some((document) => document.document_type === "proof_payment");

    if (loading) return <p className="helper-text">Loading Record Staff queue...</p>;

    return (
        <section>
            <h3>Record Staff Queue</h3>
            <p className="helper-text">Separated by workflow stage: pending, notice to comply, payment, and final decisions.</p>
            <button type="button" className="secondary-btn" onClick={loadQueue}>Refresh Queue</button>
            {feedback && <p className="helper-text" style={{ marginTop: "0.5rem" }}>{feedback}</p>}

            <h4 style={{ marginTop: "1rem" }}>Pending Applications (Initial/Recheck)</h4>
            {(pendingApps ?? []).map((application) => (
                <div key={`pending-${application.application_id}`} className="application-card application-copy" style={{ marginTop: "0.75rem" }}>
                    {renderApplicationCopySummary(application)}
                    <input
                        placeholder="Notice to Comply comment"
                        value={commentById[application.application_id] ?? ""}
                        onChange={(event) => setCommentById((prev) => ({ ...prev, [application.application_id]: event.target.value }))}
                    />
                    <p className="helper-text" style={{ marginTop: "0.5rem" }}>Select required document types for compliance:</p>
                    <div style={{ display: "grid", gap: "0.25rem", marginTop: "0.25rem" }}>
                        {COMPLIANCE_DOCUMENT_OPTIONS.map((doc) => (
                            <label key={`${application.application_id}-${doc.key}`}>
                                <input
                                    type="checkbox"
                                    checked={(selectedComplianceDocsById[application.application_id] ?? []).includes(doc.key)}
                                    onChange={() => toggleComplianceDoc(application.application_id, doc.key)}
                                />
                                {` ${doc.label}`}
                            </label>
                        ))}
                    </div>
                    <div className="button-row">
                        {/* Change: Notice to Comply now includes selected document types for applicant resubmission scope. */}
                        <button
                            type="button"
                            className="secondary-btn"
                            disabled={!(selectedComplianceDocsById[application.application_id] ?? []).length}
                            onClick={() =>
                                performAction(application.application_id, {
                                    role: "record_staff",
                                    action: "request_compliance",
                                    comment: commentById[application.application_id] ?? "",
                                    required_document_types: selectedComplianceDocsById[application.application_id] ?? [],
                                })
                            }
                        >
                            Submit Notice to Comply
                        </button>
                        {/* Change: first button marks docs as complete and reveals "Send For Payment". */}
                        <button
                            type="button"
                            className="secondary-btn"
                            onClick={() => setPaymentReadyById((prev) => ({ ...prev, [application.application_id]: true }))}
                        >
                            Documents Complete
                        </button>
                        {paymentReadyById[application.application_id] && (
                            <button
                                type="button"
                                className="secondary-btn"
                                onClick={() =>
                                    performAction(application.application_id, {
                                        role: "record_staff",
                                        action: "send_for_payment",
                                        comment: "Proceed to payment stage.",
                                    })
                                }
                            >
                                Send For Payment
                            </button>
                        )}
                    </div>
                </div>
            ))}

            <h4 style={{ marginTop: "1rem" }}>Notice to Comply</h4>
            {(complianceApps ?? []).map((application) => (
                <div key={`comply-${application.application_id}`} className="application-card application-copy" style={{ marginTop: "0.75rem" }}>
                    {renderApplicationCopySummary(application)}
                    <p className="helper-text">Waiting for applicant resubmission of required documents.</p>
                </div>
            ))}

            <h4 style={{ marginTop: "1rem" }}>Upload Payment</h4>
            {(uploadPaymentApps ?? []).map((application) => (
                <div key={`payment-${application.application_id}`} className="application-card application-copy" style={{ marginTop: "0.75rem" }}>
                    {renderApplicationCopySummary(application)}
                    {!hasUploadedProofPayment(application) && (
                        <>
                            <label className="field-label">Upload proof of payment here</label>
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={(event) => {
                                    const selectedFile = event.target.files?.[0] ?? null;
                                    setPaymentFileById((prev) => ({
                                        ...prev,
                                        [application.application_id]: selectedFile,
                                    }));
                                }}
                            />
                        </>
                    )}
                    {paymentErrorById[application.application_id] && (
                        <p className="helper-text" style={{ color: "#fca5a5", marginTop: "0.35rem" }}>
                            {paymentErrorById[application.application_id]}
                        </p>
                    )}
                    <p className="helper-text" style={{ marginTop: "0.35rem" }}>
                        {hasUploadedProofPayment(application)
                            ? "Proof of payment is uploaded."
                            : "Need to upload proof of payment first."}
                    </p>
                    <div className="button-row">
                        {/* Change: proof of payment upload is handled by Record Staff. */}
                        <button
                            type="button"
                            className="secondary-btn"
                            disabled={hasUploadedProofPayment(application)}
                            onClick={() => {
                                if (!paymentFileById[application.application_id]) {
                                    setPaymentErrorById((prev) => ({
                                        ...prev,
                                        [application.application_id]: "Need to upload proof of payment first.",
                                    }));
                                    return;
                                }
                                const payload = new FormData();
                                payload.append("role", "record_staff");
                                payload.append("action", "upload_payment_proof");
                                payload.append("report_file", paymentFileById[application.application_id]);
                                performAction(application.application_id, payload);
                                setPaymentErrorById((prev) => ({
                                    ...prev,
                                    [application.application_id]: "Proof of payment submitted.",
                                }));
                            }}
                        >
                            Upload Proof of Payment
                        </button>
                        {/* Change: move application to under_review + gis_review after payment proof. */}
                        <button
                            type="button"
                            className="secondary-btn"
                            onClick={() => {
                                if (!hasUploadedProofPayment(application)) {
                                    setPaymentErrorById((prev) => ({
                                        ...prev,
                                        [application.application_id]: "Need to upload proof of payment first.",
                                    }));
                                    return;
                                }
                                performAction(application.application_id, {
                                    role: "record_staff",
                                    action: "mark_under_review",
                                });
                            }}
                        >
                            Mark For Review
                        </button>
                    </div>
                </div>
            ))}

            <h4 style={{ marginTop: "1rem" }}>Final Accepted (Review Complete)</h4>
            {(acceptedCompleteApps ?? []).map((application) => (
                <div key={`accepted-${application.application_id}`} className="application-card application-copy" style={{ marginTop: "0.75rem" }}>
                    {renderApplicationCopySummary(application)}
                    <div className="button-row">
                        {/* Change: notification buttons are placeholders for later notification module. */}
                        <button
                            type="button"
                            className="secondary-btn"
                            onClick={() =>
                                performAction(application.application_id, {
                                    role: "record_staff",
                                    action: "record_staff_release_accepted",
                                })
                            }
                        >
                            Send Accepted Notification
                        </button>
                    </div>
                </div>
            ))}

            <h4 style={{ marginTop: "1rem" }}>Final Rejected (Review Complete)</h4>
<<<<<<< HEAD
=======
            <p className="helper-text" style={{ marginTop: "0.25rem" }}>
                Includes applications rejected by the Approving Authority (review finished; status rejected / review complete).
            </p>
>>>>>>> eb68380 (for draftsman and authuority)
            {(rejectedCompleteApps ?? []).map((application) => (
                <div key={`rejected-${application.application_id}`} className="application-card application-copy" style={{ marginTop: "0.75rem" }}>
                    {renderApplicationCopySummary(application)}
                    <div className="button-row">
                        <button
                            type="button"
                            className="secondary-btn"
                            onClick={() =>
                                performAction(application.application_id, {
                                    role: "record_staff",
                                    action: "record_staff_release_rejected",
                                })
                            }
                        >
                            Send Rejected Notification
                        </button>
                    </div>
                </div>
            ))}
        </section>
    );
}

export default RecordStaffDashboard;
