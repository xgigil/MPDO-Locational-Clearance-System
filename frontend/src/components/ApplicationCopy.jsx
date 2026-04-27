import { Link } from "react-router-dom";
import "../styles/Application.css";
function ApplicationCopy({ application }) {

    return (
        <div className="application-page">
            <div className="application-card application-copy">
                <h1>Current Application</h1>
                <p className="helper-text">Application ID: {application.application_id}</p>
                <p className="helper-text">
                    Status: {application.application_status} / {application.review_status}
                </p>
                <p className="status-message">
                    Your current application is still active (`application_completion = false`).
                    New application submissions are disabled until this one is completed.
                </p>
                {application.application_status === "notice_to_comply" && (
                    <p className="status-message">
                        Record Staff requested compliance updates.
                        Use the resubmission page to upload only the required documents.
                    </p>
                )}

                <div className="section-grid">
                    <label className="field-label">Applicant Type</label>
                    <p>{application.applicant_type}</p>

                    <label className="field-label">Applicant Name</label>
                    <p>
                        {/* Applicant name links to the applicant profile page. */}
                        <Link to={`/profile/${application.submitted_by_id}`}>
                            {application.submitted_by_full_name ||
                                application.submitted_by_username ||
                                "Unknown Applicant"}
                        </Link>
                    </p>

                    <label className="field-label">Right Over Land</label>
                    <p>{application.right_over_land}</p>

                    <label className="field-label">Project Name</label>
                    <p>{application.project?.project_title}</p>

                    <label className="field-label">Project Nature</label>
                    <p>{application.project?.project_nature}</p>

                    <label className="field-label">Project Tenure</label>
                    <p>{application.project?.project_tenure}</p>

                    <label className="field-label">Existing Use</label>
                    <p>{application.project?.existing_use}</p>

                    <label className="field-label">Project Barangay</label>
                    <p>{application.project?.project_barangay}</p>

                    <label className="field-label">Uploaded Documents</label>
                    <ul className="document-copy-list">
                        {(application.documents ?? []).map((documentItem) => (
                            <li key={`${documentItem.document_type}-${documentItem.upload_timestamp}`}>
                                {documentItem.document_label}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="button-row">
                    {application.application_status === "notice_to_comply" && (
                        <Link to="/Application/Resubmit" className="primary-btn">
                            Open Compliance Resubmission
                        </Link>
                    )}
                    <Link to="/" className="secondary-btn">
                        Home
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default ApplicationCopy;
