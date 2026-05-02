import { Link } from "react-router-dom";

function AboutUs() {
  return (
    <main>
      <div className="container auth-wrap contact-wrap">
        <div className="contact-header">
          <h1 className="contact-title">Contact Us</h1>
          <p className="contact-subtitle">We&apos;re here to help</p>
        </div>

        <div className="contact-cards">
          <div className="contact-card">
            <div className="contact-icon contact-icon-phone" aria-hidden="true">
              ☎
            </div>
            <h2 className="contact-card-title">Call Us</h2>
            <p className="contact-card-text">For immediate assistance, please call us.</p>
            <p className="contact-card-text">+63-955-462-1802</p>
            <div className="contact-card-bottom" aria-hidden="true"></div>
          </div>

          <div className="contact-card">
            <div className="contact-icon contact-icon-mail" aria-hidden="true">
              ✉
            </div>
            <h2 className="contact-card-title">Ask a Question</h2>
            <p className="contact-card-text">Have a question? Send us an email!</p>
            <Link className="btn btn-ask-start" to="/ask">
              Get Started
            </Link>
            <div className="contact-card-bottom" aria-hidden="true"></div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default AboutUs;