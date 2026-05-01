import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN } from "../constants.js";

export default function Requirements() {
  const navigate = useNavigate();
  const loggedIn = Boolean(localStorage.getItem(ACCESS_TOKEN));

  return (
    <main>
      <section className="section">
        <div className="container">
          <div className="req-hero">
            <div>
              <h1 className="req-title">Requirements to Prepare</h1>
              <p className="req-subtitle">
                Here’s a checklist of documents and forms applicants typically prepare before submitting a request.
              </p>
            </div>
            <button
              className="btn req-cta"
              type="button"
              onClick={() => {
                if (!loggedIn) {
                  navigate("/register", { replace: true });
                  return;
                }
                navigate("/Application");
              }}
            >
              Proceed to Application
            </button>
          </div>

          <div className="req-card req-card--single">
            <div className="req-card-top">
              <div className="req-badge" aria-hidden="true">
                ✓
              </div>
              <div>
                <div className="req-card-title">Checklist</div>
                <div className="req-card-sub">Prepare these to make your application smoother.</div>
              </div>
            </div>

            <ol className="req-sections">
              <li className="req-section">
                <div className="req-section-head">
                  <div className="req-section-title">Required Documents for Locational Clearance</div>
                  <div className="req-section-sub">Zoning Certificate (requirements listed below)</div>
                </div>
                <ul className="req-list">
                  <li>Lot Title</li>
                  <li>Survey Plan</li>
                  <li>
                    Deed of Sale <span className="req-muted">(Optional)</span>
                  </li>
                  <li>
                    Authorization Letter / Special Power of Attorney <span className="req-muted">(Optional)</span>
                  </li>
                  <li>Tax Declaration</li>
                  <li>Tax Clearance</li>
                  <li>Barangay Construction Clearance</li>
                </ul>
              </li>

              <li className="req-section">
                <div className="req-section-head">
                  <div className="req-section-title">Drawing Plan</div>
                </div>
              </li>

              <li className="req-section">
                <div className="req-section-head">
                  <div className="req-section-title">Application Forms for Building Permit</div>
                </div>
              </li>

              <li className="req-section">
                <div className="req-section-head">
                  <div className="req-section-title">Specification and Cost Estimates</div>
                </div>
              </li>

              <li className="req-section">
                <div className="req-section-head">
                  <div className="req-section-title">Structural Analysis</div>
                </div>
              </li>
            </ol>
          </div>

          <div className="req-foot">
            <div className="req-foot-card">
              <div className="req-foot-title">Tip</div>
              <div className="req-foot-text">
                If you don’t have an optional document, you can still proceed — but having it ready can speed up
                validation.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

