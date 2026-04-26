import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import "../styles/Application.css";

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
        <div className="dropzone-wrapper">
            <label className="field-label">
                {label}
                {required ? " *" : ""}
            </label>
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
                    <p className="dropzone-placeholder">
                        Drag and drop a PDF here, or click to browse.
                    </p>
                )}
            </div>
        </div>
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

            const response = await api.post("/api/applications/submit/", payload, {
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
        <div className="application-page">
            <div className="application-card">
                <h1>Application Form</h1>
                <p className="step-indicator">
                    Step {step + 1} of {stepLabels.length}: {visibleStep}
                </p>

                {visibleStep === "Applicant Information" && (
                    <div className="section-grid">
                        <label className="field-label">Applicant Type</label>
                        <select
                            value={form.applicant_type}
                            onChange={(event) => setField("applicant_type", event.target.value)}
                        >
                            <option value="Individual">Individual</option>
                            <option value="Corporation">Corporation</option>
                        </select>

                        <label className="field-label">First Name</label>
                        <input
                            value={form.first_name}
                            onChange={(event) => setField("first_name", event.target.value)}
                        />

                        <label className="field-label">Last Name</label>
                        <input
                            value={form.last_name}
                            onChange={(event) => setField("last_name", event.target.value)}
                        />

                        <label className="field-label">Middle Name</label>
                        <input
                            value={form.middle_name}
                            onChange={(event) => setField("middle_name", event.target.value)}
                        />

                        <label className="field-label">Suffix</label>
                        <input
                            value={form.suffix}
                            onChange={(event) => setField("suffix", event.target.value)}
                        />

                        <label className="field-label">House / Street *</label>
                        <input
                            value={form.house_street}
                            onChange={(event) => setField("house_street", event.target.value)}
                        />

                        <label className="field-label">Barangay *</label>
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

                        <label className="field-label">Right Over Land</label>
                        <select
                            value={form.right_over_land}
                            onChange={(event) => setField("right_over_land", event.target.value)}
                        >
                            <option value="Owner">Owner</option>
                            <option value="Leased">Leased</option>
                            <option value="NotLot_Owner">Not Lot Owner</option>
                        </select>

                        {form.applicant_type === "Corporation" && (
                            <>
                                <label className="field-label">Corporation Name</label>
                                <input
                                    value={form.corp_name}
                                    onChange={(event) => setField("corp_name", event.target.value)}
                                />

                                <label className="field-label">Corporation Address</label>
                                <input
                                    value={form.corp_address}
                                    onChange={(event) => setField("corp_address", event.target.value)}
                                />

                                <label className="field-label">Corporation Telephone</label>
                                <input
                                    value={form.corp_telephone}
                                    onChange={(event) => setField("corp_telephone", event.target.value)}
                                />
                            </>
                        )}
                    </div>
                )}

                {visibleStep === "Absolute Owner Information" && (
                    <div className="section-grid">
                        <label className="field-label">First Name of Absolute Owner</label>
                        <input
                            value={form.absoluteowner_first_name}
                            onChange={(event) =>
                                setField("absoluteowner_first_name", event.target.value)
                            }
                        />

                        <label className="field-label">Last Name of Absolute Owner</label>
                        <input
                            value={form.absoluteowner_last_name}
                            onChange={(event) =>
                                setField("absoluteowner_last_name", event.target.value)
                            }
                        />

                        <label className="field-label">Middle Initial of Absolute Owner</label>
                        <input
                            value={form.absoluteowner_middle_name}
                            onChange={(event) =>
                                setField("absoluteowner_middle_name", event.target.value)
                            }
                        />

                        <label className="field-label">Suffix of Absolute Owner</label>
                        <input
                            value={form.absoluteowner_suffix}
                            onChange={(event) =>
                                setField("absoluteowner_suffix", event.target.value)
                            }
                        />
                    </div>
                )}

                {visibleStep === "Project Details" && (
                    <div className="section-grid">
                        <label className="field-label">Project Name</label>
                        <input
                            value={form.project_title}
                            onChange={(event) => setField("project_title", event.target.value)}
                        />

                        <label className="field-label">Project Type</label>
                        <input
                            value={form.project_type}
                            onChange={(event) => setField("project_type", event.target.value)}
                        />

                        <label className="field-label">Project Nature *</label>
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

                        <label className="field-label">Project Tenure *</label>
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

                        <label className="field-label">Project Cost *</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.project_cost}
                            onChange={(event) => setField("project_cost", event.target.value)}
                        />

                        <label className="field-label">Project Address *</label>
                        <input
                            value={form.project_address}
                            onChange={(event) => setField("project_address", event.target.value)}
                        />

                        <label className="field-label">Project Barangay *</label>
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

                        <label className="field-label">Area of Lot (sqm) *</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.area_lot}
                            onChange={(event) => setField("area_lot", event.target.value)}
                        />

                        <label className="field-label">Area of Improvement (sqm) *</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.area_improvement}
                            onChange={(event) => setField("area_improvement", event.target.value)}
                        />

                        <label className="field-label">Area of Building (sqm) *</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.area_bldg}
                            onChange={(event) => setField("area_bldg", event.target.value)}
                        />

                        <label className="field-label">Existing Use of Lot *</label>
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
                    </div>
                )}

                {visibleStep === "Upload Required Documents" && (
                    <div className="section-grid">
                        <p className="helper-text">
                            Based on the README flow, all required PDFs below must be uploaded.
                        </p>
                        {REQUIRED_DOCUMENTS.map((doc) => (
                            <FileDropzone
                                key={doc.key}
                                label={doc.label}
                                file={documents[doc.key]}
                                required
                                onFileChange={(file) =>
                                    setDocuments((prev) => ({ ...prev, [doc.key]: file }))
                                }
                            />
                        ))}

                        {shouldShowOptionalDocuments && (
                            <>
                                <div className="optional-docs">
                                    <h3>Optional Documents</h3>
                                    {OPTIONAL_DOCUMENTS.map((doc) => (
                                        <label className="checkbox-item" key={doc.key}>
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
                                        onFileChange={(file) =>
                                            setDocuments((prev) => ({ ...prev, [doc.key]: file }))
                                        }
                                        required
                                    />
                                ))}
                            </>
                        )}
                    </div>
                )}

                {message && <p className="status-message">{message}</p>}

                <div className="button-row">
                    <Link to="/" className="secondary-btn">
                        Home
                    </Link>
                    {step > 0 && (
                        <button type="button" className="secondary-btn" onClick={handleBack}>
                            Back
                        </button>
                    )}
                    {step < stepLabels.length - 1 ? (
                        <button
                            type="button"
                            className="primary-btn"
                            onClick={handleNext}
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="primary-btn"
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? "Submitting..." : "Submit Application"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ApplicationForm;
