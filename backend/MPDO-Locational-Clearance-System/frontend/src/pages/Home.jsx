import { Link } from "react-router-dom";

function Home() {
  return (
    <main>
      <section className="section hero">
        <div className="container hero-grid">
          <div className="about-copy" id="about-hero">
            <h2>About the Municipal Planning and Development</h2>
            <p>
              The Municipal Planning and Development Office (MPDO) of Alubijid oversees the implementation and
              regulation of zoning policies and land-use planning within the municipality.
            </p>
            <p>
              As part of its commitment to improving public service delivery, the office adopted a Web-Based Automated
              Location Clearance System that streamlines applications and monitoring of location clearance requests in
              accordance with the municipality&apos;s zoning ordinance and development plans.
            </p>
          </div>

          <div className="about-card">
            <div className="about-card-inner">
              <img className="about-card-image" alt="MPDO Alubijid details" src="/mpdo-details.png" />
            </div>
          </div>
        </div>
      </section>

      <section className="section services" id="services">
        <div className="container">
          <h2 className="section-title">SERVICES</h2>

          <div className="services-grid">
            <Link className="service-card" to="/Application">
              <div className="service-card-body">
                <h3>Zoning</h3>
                <p className="service-desc">
                  Location Clearance, Zoning Certification, Subdivision, Projects with Required Location Guidelines and
                  Standards
                </p>
              </div>
              <span className="service-card-cta" aria-hidden="true">
                &rsaquo;
              </span>
            </Link>

            <Link className="service-card" to="/about">
              <div className="service-card-body">
                <h3>About Us</h3>
                <p className="service-desc">Learn more about the MPDO.</p>
              </div>
              <span className="service-card-cta" aria-hidden="true">
                &rsaquo;
              </span>
            </Link>

            <Link className="service-card service-card--requirements" to="/requirements">
              <div className="service-card-body">
                <h3>Requirements</h3>
                <p className="service-desc">What to prepare before applying.</p>
              </div>
              <span className="service-card-cta" aria-hidden="true">
                &rsaquo;
              </span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;