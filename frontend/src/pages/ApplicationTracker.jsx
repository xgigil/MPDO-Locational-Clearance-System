import { useEffect, useMemo, useState } from "react";
import api from "../api";

const STATUS_UI = {
  accepted: { cls: "status-pill--approved", label: "Approved" },
  rejected: { cls: "status-pill--rejected", label: "Rejected" },
  notice_to_comply: { cls: "status-pill--incomplete", label: "Incomplete" },
  under_review: { cls: "status-pill--review", label: "Under Review" },
  pending: { cls: "status-pill--pending", label: "Pending" },
  upload_payment: { cls: "status-pill--pending", label: "Pending" },
};

function normalizeId(v) {
  const raw = String(v || "").trim();
  const m = raw.match(/\d+/);
  return m ? m[0] : "";
}

export default function ApplicationTracker() {
  const [loading, setLoading] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const entry = useMemo(() => {
    const st = result?.application_status;
    return STATUS_UI[st] || STATUS_UI.pending;
  }, [result]);

  const track = async (id) => {
    const appId = normalizeId(id);
    if (!appId) {
      setError("Please enter a valid tracking number (Application ID).");
      setResult(null);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/api/user/applicant/applications/track/${appId}/`);
      setResult(res.data);
    } catch (e) {
      setResult(null);
      if (e?.response?.status === 404) setError("No record found. Please double-check and try again.");
      else setError("Failed to track. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Default view: show latest application if it exists.
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/user/applicant/applications/my-latest/");
        if (res.data?.has_application && res.data.application) {
          const app = res.data.application;
          setTrackingId(String(app.application_id || ""));
          setResult({
            found: true,
            application_id: app.application_id,
            application_status: app.application_status,
            review_status: app.review_status,
            application: app,
          });
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main>
      <section className="section">
        <div className="container">
          <div className="profile-shell">
            <h1 className="profile-title" style={{ textTransform: "uppercase", letterSpacing: ".4px" }}>
              Track Status
            </h1>
            <p className="profile-subtitle">
              Enter your tracking number (Application ID) to see the latest status.
            </p>

            <div className="track-card" id="track-status">
              <div className="track-row">
                <input
                  className="track-input"
                  id="tracking-number"
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter Tracking Number (e.g., 101)"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      track(trackingId);
                    }
                  }}
                />
                <button className="track-btn" id="track-application" type="button" onClick={() => track(trackingId)} disabled={loading}>
                  {loading ? "Tracking..." : "Track Application"}
                </button>
              </div>

              <div className={`track-result ${result ? "is-show" : ""}`} id="track-result" aria-live="polite">
                <div className="track-result-title" id="track-result-title">
                  {result ? "Application Status" : "Result"}
                </div>
                <div className="track-result-line">
                  <div className={`status-pill ${entry.cls}`} id="track-status-pill">
                    <span className="dot" aria-hidden="true"></span>
                    <span id="track-status-text">{entry.label}</span>
                  </div>
                  <div className="profile-subtitle" style={{ margin: 0 }}>
                    Tracking No:{" "}
                    <strong style={{ fontWeight: 900 }} id="track-code">
                      {result?.application_id ?? "—"}
                    </strong>
                  </div>
                </div>
                <div className="profile-subtitle" style={{ marginTop: 10 }} id="track-message">
                  {error || (result ? `Review stage: ${String(result.review_status || "").replaceAll("_", " ")}` : "")}
                </div>
              </div>

              <div className="legend" aria-label="Status legend">
                <div className="legend-item">
                  <span className="legend-dot approved" aria-hidden="true"></span> Approved
                </div>
                <div className="legend-item">
                  <span className="legend-dot rejected" aria-hidden="true"></span> Rejected
                </div>
                <div className="legend-item">
                  <span className="legend-dot incomplete" aria-hidden="true"></span> Incomplete
                </div>
                <div className="legend-item">
                  <span className="legend-dot review" aria-hidden="true"></span> Under Review
                </div>
                <div className="legend-item">
                  <span className="legend-dot pending" aria-hidden="true"></span> Pending
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}