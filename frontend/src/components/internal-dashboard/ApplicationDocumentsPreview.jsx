import { useEffect, useState } from "react";
import { ACCESS_TOKEN } from "../../constants";

function ApplicationDocumentsPreview({ documents = [] }) {
    const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
    const [previewUrl, setPreviewUrl] = useState("");
    const [previewName, setPreviewName] = useState("");

    useEffect(() => {
        return () => {
            if (previewUrl) {
                window.URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const resolveDocumentUrl = (downloadUrl) => {
        if (!downloadUrl) return "#";
        if (downloadUrl.startsWith("http://") || downloadUrl.startsWith("https://")) return downloadUrl;
        return `${apiBaseUrl}${downloadUrl}`;
    };

    const openDocument = async (documentItem) => {
        try {
            const accessToken = localStorage.getItem(ACCESS_TOKEN);
            const response = await fetch(resolveDocumentUrl(documentItem.download_url), {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (!response.ok) throw new Error("Failed to open document");
            const blob = await response.blob();
            if (previewUrl) {
                window.URL.revokeObjectURL(previewUrl);
            }
            const pdfBlob = blob.type === "application/pdf"
                ? blob
                : new Blob([blob], { type: "application/pdf" });
            const url = window.URL.createObjectURL(pdfBlob);
            setPreviewUrl(url);
            setPreviewName(documentItem.document_label || "Document preview");
        } catch (error) {
            alert(`Unable to open document: ${error.message}`);
        }
    };

    return (
        <div style={{ marginTop: "0.5rem" }}>
            <p style={{ margin: "0.25rem 0" }}>Attached Documents:</p>
            {documents.length === 0 ? (
                <p className="helper-text" style={{ margin: "0.25rem 0" }}>No uploaded documents yet.</p>
            ) : (
                <ul className="document-copy-list">
                    {documents.map((documentItem, index) => (
                        <li key={documentItem.download_url || `${documentItem.document_type}-${documentItem.upload_timestamp}-${index}`}>
                            <button
                                type="button"
                                className="download-link-btn"
                                onClick={() => openDocument(documentItem)}
                            >
                                Open {documentItem.document_label}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            {previewUrl && (
                <div style={{ marginTop: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                        <p className="helper-text" style={{ margin: 0 }}>{previewName}</p>
                        <button
                            type="button"
                            className="secondary-btn"
                            onClick={() => {
                                window.URL.revokeObjectURL(previewUrl);
                                setPreviewUrl("");
                                setPreviewName("");
                            }}
                        >
                            Close Preview
                        </button>
                    </div>
                    <iframe
                        title="Internal document preview"
                        src={previewUrl}
                        style={{
                            width: "100%",
                            height: "50vh",
                            marginTop: "0.5rem",
                            border: "1px solid #ccc",
                            borderRadius: "8px",
                            background: "#fff",
                        }}
                    />
                </div>
            )}
        </div>
    );
}

export default ApplicationDocumentsPreview;
