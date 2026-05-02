import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

const OPTIONAL_DOCUMENTS = [
    { key: "deed_of_sale", label: "Deed of Sale" },
    { key: "auth_letter", label: "Authorization Letter" },
    { key: "letter_exception", label: "Letter of Exception" },
];

const BARANGAY_OPTIONS = [
    "Baybay",
    "Benigwayan",
    "Calatcat",
    "Lagtang",
    "Lanao",
    "Loguilo",
    "Lourdes",
    "Lumbo",
    "Molocboloc",
    "Poblacion",
    "Sampatulog",
    "Sungay",
    "Talaba",
    "Taparak",
    "Tugasnon",
    "Tula",
];

const PROJECT_NATURE_OPTIONS = [
    "New Development",
    "Expansion/Renovation",
    "Change of Use",
    "Others",
];

const PROJECT_TENURE_OPTIONS = ["permanent", "temporary"];

const EXISTING_USE_OPTIONS = [
    "Residential",
    "Commercial",
    "Institutional",
    "Industrial",
    "Agricultural",
    "Vacant/Idle",
    "Tenanted",
    "Not Tenanted",
    "Others",
];

const REQUIRED_DOCUMENTS = [
    { key: "loc_clear_app_form", label: "Locational Clearance Application Form" },
    { key: "lot_title", label: "Lot Title" },
    { key: "survey_plan", label: "Survey Plan" },
    { key: "tax_dec", label: "Tax Declaration" },
    { key: "tax_clear", label: "Tax Clearance" },
    { key: "brgy_const_clear", label: "Barangay Construction Clearance" },
    { key: "draw_plan", label: "Drawing Plan" },
    { key: "app_fr_bldg_permit", label: "Application for Building Permit" },
    { key: "cost_est", label: "Cost Estimate" },
    { key: "struc_analysis", label: "Structural Analysis" },
];

const INITIAL_FORM = {
    applicant_type: "Individual",
    first_name: "",
    last_name: "",
    middle_name: "",
    suffix: "",
    house_street: "",
    barangay: BARANGAY_OPTIONS[0],
    right_over_land: "Owner",
    corp_name: "",
    corp_address: "",
    corp_telephone: "",
    absoluteowner_first_name: "",
    absoluteowner_last_name: "",
    absoluteowner_middle_name: "",
    absoluteowner_suffix: "",
    project_title: "",
    project_type: "",
    project_nature: PROJECT_NATURE_OPTIONS[0],
    project_tenure: PROJECT_TENURE_OPTIONS[0],
    project_cost: "",
    project_address: "",
    project_barangay: BARANGAY_OPTIONS[0],
    area_lot: "",
    area_improvement: "",
    area_bldg: "",
    existing_use: EXISTING_USE_OPTIONS[0],
};

function FileDropzone({ label, file, onFileChange, required = false }) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        const droppedFile = event.dataTransfer.files?.[0];
        if (!droppedFile) return;
        if (droppedFile.type !== "application/pdf") {
            alert(`${label} only accepts PDF files.`);
            return;
        }
        onFileChange(droppedFile);
    };

    return (
        <label className="wiz-label">
            <span>
                {label}
                {required ? " *" : ""}
            </span>
            <div
                className={`dropzone ${isDragging ? "is-dragover" : ""}`}
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
                    <div className="dropzone-text">{file.name}</div>
                ) : (
                    <div className="dropzone-text">Drag and drop a PDF here, or click to browse.</div>
                )}
            </div>
        </label>
    );
}

function ApplicationForm({ onSubmitted }) {
    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [form, setForm] = useState(INITIAL_FORM);
    const [optionalSelections, setOptionalSelections] = useState([]);
    const [documents, setDocuments] = useState({});

    const goesToAbsoluteOwner = form.right_over_land !== "Owner";
    const stepLabels = useMemo(() => {
        if (goesToAbsoluteOwner) {
            return [
                "Applicant Information",
                "Absolute Owner Information",
                "Project Details",
                "Upload Required Documents",
            ];
        }
        return [
            "Applicant Information",
            "Project Details",
            "Upload Required Documents",
        ];
    }, [goesToAbsoluteOwner]);

    const visibleStep = stepLabels[step];

    const totalSteps = stepLabels.length;
    const stepTitle =
        visibleStep === "Applicant Information"
            ? "Applicant Information"
            : visibleStep === "Absolute Owner Information"
              ? "Absolute Owner Information"
              : visibleStep === "Project Details"
                ? "Project Details"
                : "Upload Required Documents";

    const setField = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const hasAbsoluteOwnerInfo =
        form.absoluteowner_first_name.trim() !== "" &&
        form.absoluteowner_last_name.trim() !== "";

    const shouldShowOptionalDocuments = hasAbsoluteOwnerInfo;

    const selectedOptionalDocumentsForSubmission = shouldShowOptionalDocuments
        ? optionalSelections
        : [];

    const visibleOptionalDocuments = shouldShowOptionalDocuments
        ? OPTIONAL_DOCUMENTS.filter((doc) => optionalSelections.includes(doc.key))
        : [];
        
    const expectedDocuments = [...REQUIRED_DOCUMENTS, ...visibleOptionalDocuments];

    const validateCurrentStep = () => {
        if (visibleStep === "Applicant Information") {
            if (!form.first_name || !form.last_name || !form.house_street || !form.barangay) {
                alert("Please complete all required applicant fields.");
                return false;
            }
            if (form.applicant_type === "Corporation" && !form.corp_name) {
                alert("Corporation name is required.");
                return false;
            }
            return true;
        }

        if (visibleStep === "Absolute Owner Information") {
            if (!form.absoluteowner_first_name || !form.absoluteowner_last_name) {
                alert("Absolute owner first and last name are required.");
                return false;
            }
            return true;
        }

        if (visibleStep === "Project Details") {
            const requiredFields = [
                "project_title",
                "project_type",
                "project_nature",
                "project_tenure",
                "project_cost",
                "project_address",
                "project_barangay",
                "area_lot",
                "area_improvement",
                "area_bldg",
                "existing_use",
            ];
            const hasMissing = requiredFields.some((field) => !String(form[field]).trim());
            if (hasMissing) {
                alert("Please complete all required project detail fields.");
                return false;
            }
            return true;
        }

        if (visibleStep === "Upload Required Documents") {
            const missingDocuments = expectedDocuments
                .filter((doc) => !documents[doc.key])
                .map((doc) => doc.label);
            if (missingDocuments.length > 0) {
                alert(`Please upload all required files:\n- ${missingDocuments.join("\n- ")}`);
                return false;
            }
        }

        return true;
    };

    const handleNext = () => {
        if (!validateCurrentStep()) return;
        setStep((prev) => Math.min(prev + 1, stepLabels.length - 1));
    };

    const handleBack = () => {
        setStep((prev) => Math.max(prev - 1, 0));
    };

    const handleOptionalToggle = (docType) => {
        setOptionalSelections((prev) =>
            prev.includes(docType)
                ? prev.filter((entry) => entry !== docType)
                : [...prev, docType]
        );
    };

    const handleSubmit = async () => {
        if (!validateCurrentStep()) return;
        setSubmitting(true);
        setMessage("");
        try {
            const payload = new FormData();
            Object.entries(form).forEach(([key, value]) => payload.append(key, value));
            // Send optional documents as repeated form keys (best fit for multipart + DRF ListField).
            selectedOptionalDocumentsForSubmission.forEach((documentType) => {
                payload.append("selected_optional_documents", documentType);
            });
            expectedDocuments.forEach((doc) => {
                payload.append(doc.key, documents[doc.key]);
            });

            const response = await api.post("/api/user/applicant/applications/submit/", payload, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setMessage(
                `Submitted successfully. Application ID: ${response.data.application_id}`
            );
            // Let parent page switch from form view to copy view after submit.
            onSubmitted?.(response.data.application_copy ?? null);
            setForm(INITIAL_FORM);
            setDocuments({});
            setOptionalSelections([]);
            setStep(0);
        } catch (error) {
            const backendMessage =
                error.response?.data?.documents ||
                error.response?.data?.detail ||
                "Submission failed. Check all required fields and files.";
            setMessage(String(backendMessage));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main>
            <div className="container wizard-wrap">
                <div className="wizard-shell">
                    <aside className="wizard-left" aria-label="Application steps">
                        {stepLabels.map((label, idx) => {
                            const done = idx < step;
                            const active = idx === step;
                            return (
                                <div key={label} className="wizard-section">
                                    <div
                                        className={[
                                            "wizard-dot",
                                            active ? "wizard-dot--active" : "",
                                            done ? "wizard-dot--done" : "",
                                        ]
                                            .filter(Boolean)
                                            .join(" ")}
                                        aria-hidden="true"
                                    >
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <div className="wizard-section-title">{label}</div>
                                        <div className="wizard-section-sub">
                                            {active ? "In progress" : done ? "Completed" : "Pending"}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </aside>

                    <section className="wizard-card" aria-label="Application form">
                        <div className="wizard-card-top">
                            <div>
                                <div className="wizard-card-title">Application Form</div>
                                <div className="wizard-card-step">
                                    Step {step + 1} of {totalSteps}: {stepTitle}
                                </div>
                            </div>
                            <Link to="/" className="wizard-close" aria-label="Close application form">
                                ×
                            </Link>
                        </div>

                        <div className="wizard-form">
                            {visibleStep === "Applicant Information" && (
                                <div className="wizard-step-content is-active" data-step="1">
                                    <div className="wiz-grid-2">
                                        <label className="wiz-label">
                                            <span>Applicant Type</span>
                                            <select
                                                value={form.applicant_type}
                                                onChange={(event) => setField("applicant_type", event.target.value)}
                                            >
                                                <option value="Individual">Individual</option>
                                                <option value="Corporation">Corporation</option>
                                            </select>
                                        </label>

                                        <label className="wiz-label">
                                            <span>Right Over Land</span>
                                            <select
                                                value={form.right_over_land}
                                                onChange={(event) => setField("right_over_land", event.target.value)}
                                            >
                                                <option value="Owner">Owner</option>
                                                <option value="Leased">Leased</option>
                                                <option value="NotLot_Owner">Not Lot Owner</option>
                                            </select>
                                        </label>
                                    </div>

                                    <div className="wiz-grid-2">
                                        <label className="wiz-label">
                                            <span>First Name *</span>
                                            <input
                                                value={form.first_name}
                                                onChange={(event) => setField("first_name", event.target.value)}
                                            />
                                        </label>
                                        <label className="wiz-label">
                                            <span>Last Name *</span>
                                            <input
                                                value={form.last_name}
                                                onChange={(event) => setField("last_name", event.target.value)}
                                            />
                                        </label>
                                    </div>

                                    <div className="wiz-grid-2">
                                        <label className="wiz-label">
                                            <span>Middle Name</span>
                                            <input
                                                value={form.middle_name}
                                                onChange={(event) => setField("middle_name", event.target.value)}
                                            />
                                        </label>
                                        <label className="wiz-label">
                                            <span>Suffix</span>
                                            <input value={form.suffix} onChange={(event) => setField("suffix", event.target.value)} />
                                        </label>
                                    </div>

                                    <label className="wiz-label">
                                        <span>House / Street *</span>
                                        <input
                                            value={form.house_street}
                                            onChange={(event) => setField("house_street", event.target.value)}
                                        />
                                    </label>

                                    <label className="wiz-label">
                                        <span>Barangay *</span>
                                        <select
                                            value={form.barangay}
                                            onChange={(event) => setField("barangay", event.target.value)}
                                        >
                                            {BARANGAY_OPTIONS.map((barangayOption) => (
                                                <option key={barangayOption} value={barangayOption}>
                                                    {barangayOption}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    {form.applicant_type === "Corporation" && (
                                        <div className="wiz-composite">
                                            <div className="wiz-bullet-title">Corporation Details</div>
                                            <label className="wiz-label">
                                                <span>Corporation Name *</span>
                                                <input
                                                    value={form.corp_name}
                                                    onChange={(event) => setField("corp_name", event.target.value)}
                                                />
                                            </label>
                                            <label className="wiz-label">
                                                <span>Corporation Address</span>
                                                <input
                                                    value={form.corp_address}
                                                    onChange={(event) => setField("corp_address", event.target.value)}
                                                />
                                            </label>
                                            <label className="wiz-label">
                                                <span>Corporation Telephone</span>
                                                <input
                                                    value={form.corp_telephone}
                                                    onChange={(event) => setField("corp_telephone", event.target.value)}
                                                />
                                            </label>
                                        </div>
                                    )}
                                </div>
                            )}

                            {visibleStep === "Absolute Owner Information" && (
                                <div className="wizard-step-content is-active" data-step="2">
                                    <div className="wiz-grid-2">
                                        <label className="wiz-label">
                                            <span>First Name of Absolute Owner *</span>
                                            <input
                                                value={form.absoluteowner_first_name}
                                                onChange={(event) => setField("absoluteowner_first_name", event.target.value)}
                                            />
                                        </label>
                                        <label className="wiz-label">
                                            <span>Last Name of Absolute Owner *</span>
                                            <input
                                                value={form.absoluteowner_last_name}
                                                onChange={(event) => setField("absoluteowner_last_name", event.target.value)}
                                            />
                                        </label>
                                    </div>

                                    <div className="wiz-grid-2">
                                        <label className="wiz-label">
                                            <span>Middle Initial</span>
                                            <input
                                                value={form.absoluteowner_middle_name}
                                                onChange={(event) => setField("absoluteowner_middle_name", event.target.value)}
                                            />
                                        </label>
                                        <label className="wiz-label">
                                            <span>Suffix</span>
                                            <input
                                                value={form.absoluteowner_suffix}
                                                onChange={(event) => setField("absoluteowner_suffix", event.target.value)}
                                            />
                                        </label>
                                    </div>

                                    <div className="wiz-note" data-rep-note>
                                        Optional documents will become available after entering absolute owner details.
                                    </div>
                                </div>
                            )}

                            {visibleStep === "Project Details" && (
                                <div className="wizard-step-content is-active" data-step="3">
                                    <label className="wiz-label">
                                        <span>Project Name *</span>
                                        <input
                                            value={form.project_title}
                                            onChange={(event) => setField("project_title", event.target.value)}
                                        />
                                    </label>

                                    <label className="wiz-label">
                                        <span>Project Type *</span>
                                        <input
                                            value={form.project_type}
                                            onChange={(event) => setField("project_type", event.target.value)}
                                        />
                                    </label>

                                    <div className="wiz-grid-2">
                                        <label className="wiz-label">
                                            <span>Project Nature *</span>
                                            <select
                                                value={form.project_nature}
                                                onChange={(event) => setField("project_nature", event.target.value)}
                                            >
                                                {PROJECT_NATURE_OPTIONS.map((natureOption) => (
                                                    <option key={natureOption} value={natureOption}>
                                                        {natureOption}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        <label className="wiz-label">
                                            <span>Project Tenure *</span>
                                            <select
                                                value={form.project_tenure}
                                                onChange={(event) => setField("project_tenure", event.target.value)}
                                            >
                                                {PROJECT_TENURE_OPTIONS.map((tenureOption) => (
                                                    <option key={tenureOption} value={tenureOption}>
                                                        {tenureOption}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>

                                    <div className="wiz-grid-2">
                                        <label className="wiz-label">
                                            <span>Project Cost *</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={form.project_cost}
                                                onChange={(event) => setField("project_cost", event.target.value)}
                                            />
                                        </label>

                                        <label className="wiz-label">
                                            <span>Project Barangay *</span>
                                            <select
                                                value={form.project_barangay}
                                                onChange={(event) => setField("project_barangay", event.target.value)}
                                            >
                                                {BARANGAY_OPTIONS.map((barangayOption) => (
                                                    <option key={barangayOption} value={barangayOption}>
                                                        {barangayOption}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>

                                    <label className="wiz-label">
                                        <span>Project Address *</span>
                                        <input
                                            value={form.project_address}
                                            onChange={(event) => setField("project_address", event.target.value)}
                                        />
                                    </label>

                                    <div className="wiz-grid-2">
                                        <label className="wiz-label">
                                            <span>Area of Lot (sqm) *</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={form.area_lot}
                                                onChange={(event) => setField("area_lot", event.target.value)}
                                            />
                                        </label>
                                        <label className="wiz-label">
                                            <span>Area of Improvement (sqm) *</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={form.area_improvement}
                                                onChange={(event) => setField("area_improvement", event.target.value)}
                                            />
                                        </label>
                                    </div>

                                    <div className="wiz-grid-2">
                                        <label className="wiz-label">
                                            <span>Area of Building (sqm) *</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={form.area_bldg}
                                                onChange={(event) => setField("area_bldg", event.target.value)}
                                            />
                                        </label>
                                        <label className="wiz-label">
                                            <span>Existing Use of Lot *</span>
                                            <select
                                                value={form.existing_use}
                                                onChange={(event) => setField("existing_use", event.target.value)}
                                            >
                                                {EXISTING_USE_OPTIONS.map((useOption) => (
                                                    <option key={useOption} value={useOption}>
                                                        {useOption}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {visibleStep === "Upload Required Documents" && (
                                <div className="wizard-step-content is-active" data-step="4">
                                    <div className="wiz-note" style={{ marginBottom: 10 }}>
                                        Upload all required PDFs below.
                                    </div>
                                    {REQUIRED_DOCUMENTS.map((doc) => (
                                        <FileDropzone
                                            key={doc.key}
                                            label={doc.label}
                                            file={documents[doc.key]}
                                            required
                                            onFileChange={(file) => setDocuments((prev) => ({ ...prev, [doc.key]: file }))}
                                        />
                                    ))}

                                    {shouldShowOptionalDocuments && (
                                        <>
                                            <div className="wiz-bullet-title">Optional Documents</div>
                                            <div className="wiz-note">
                                                Select optional documents, then upload PDFs for selected items.
                                            </div>
                                            <div className="wizard-review-check">
                                                {OPTIONAL_DOCUMENTS.map((doc) => (
                                                    <label key={doc.key}>
                                                        <input
                                                            type="checkbox"
                                                            checked={optionalSelections.includes(doc.key)}
                                                            onChange={() => handleOptionalToggle(doc.key)}
                                                        />
                                                        <span>{doc.label}</span>
                                                    </label>
                                                ))}
                                            </div>

                                            {visibleOptionalDocuments.map((doc) => (
                                                <FileDropzone
                                                    key={doc.key}
                                                    label={doc.label}
                                                    file={documents[doc.key]}
                                                    onFileChange={(file) => setDocuments((prev) => ({ ...prev, [doc.key]: file }))}
                                                    required
                                                />
                                            ))}
                                        </>
                                    )}

                                    {message && <div className="wiz-inline-error is-show">{message}</div>}
                                </div>
                            )}

                            {message && visibleStep !== "Upload Required Documents" && (
                                <div className="wiz-inline-error is-show">{message}</div>
                            )}

                            <div className="wizard-actions">
                                <button
                                    type="button"
                                    className="btn-wiz-back"
                                    onClick={handleBack}
                                    disabled={step === 0}
                                >
                                    Back
                                </button>

                                {step < stepLabels.length - 1 ? (
                                    <button type="button" className="btn-wiz-primary" onClick={handleNext}>
                                        Next
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="btn-wiz-primary is-submit"
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                    >
                                        {submitting ? "Submitting..." : "Submit Application"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}

export default ApplicationForm;
