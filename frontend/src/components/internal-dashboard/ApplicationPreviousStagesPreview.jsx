import ApplicationDocumentsPreview from "./ApplicationDocumentsPreview";

function byUploadTime(a, b) {
    const ta = new Date(a.upload_timestamp || 0).getTime();
    const tb = new Date(b.upload_timestamp || 0).getTime();
    return ta - tb;
}

function partitionApplicantAndReports(documents) {
    const applicant = [];
    const reports = [];
    for (const d of documents ?? []) {
        if (d.document_type === "report_document") {
            reports.push(d);
        } else {
            applicant.push(d);
        }
    }
    applicant.sort(byUploadTime);
    reports.sort(byUploadTime);
    return { applicant, reports };
}

/**
 * Draftsman / Approving Authority: applicant-submitted PDFs plus technical reports from prior stages.
 */
function ApplicationPreviousStagesPreview({ application }) {
    const { applicant, reports } = partitionApplicantAndReports(application?.documents);

    return (
        <details open style={{ marginTop: "0.5rem" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                Applicant documents & reports from previous stages
            </summary>
            <p className="helper-text" style={{ margin: "0.5rem 0 0.35rem" }}>
                Review PDFs submitted by the applicant (requirements, proof of payment, etc.) and technical reports from GIS, drone, site inspection, and drafting steps. Open a row to preview.
            </p>
            <ApplicationDocumentsPreview
                heading="Applicant submitted documents"
                documents={applicant}
            />
            <div style={{ marginTop: "0.65rem" }}>
                <ApplicationDocumentsPreview
                    heading="Attached reports from previous stages"
                    documents={reports}
                />
            </div>
        </details>
    );
}

export default ApplicationPreviousStagesPreview;
