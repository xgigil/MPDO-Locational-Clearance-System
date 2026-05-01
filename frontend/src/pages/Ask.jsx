import { useRef } from "react";

export default function Ask() {
  const ref = useRef(null);

  return (
    <main>
      <div className="container ask-wrap">
        <div className="ask-shell">
          <div className="ask-left">
            <div className="ask-left-top">Contact Information</div>
            <div className="ask-left-sub">Say something to start a live chat!</div>

            <div className="ask-left-item">
              <div className="ask-left-label">📞</div>
              <div className="ask-left-value">+63-955-462-1820</div>
            </div>
            <div className="ask-left-item">
              <div className="ask-left-label">✉</div>
              <div className="ask-left-value">mpdoalubijid@gmail.com</div>
            </div>
            <div className="ask-left-item">
              <div className="ask-left-label">📍</div>
              <div className="ask-left-value">Sta. Cruz St., Pob. Alubijid, Misamis Oriental</div>
            </div>

            <div className="ask-left-foot">
              <div className="ask-left-cta">Any question or remarks? Just write us a message!</div>
            </div>
          </div>

          <div className="ask-right">
            <form
              id="ask-form"
              ref={ref}
              onSubmit={(e) => {
                e.preventDefault();
                alert("Message sent (demo).");
                ref.current?.reset?.();
              }}
            >
              <div className="ask-grid">
                <label className="auth-label">
                  <span>First Name</span>
                  <input type="text" name="firstName" placeholder="Jane" />
                </label>
                <label className="auth-label">
                  <span>Last Name</span>
                  <input type="text" name="lastName" placeholder="Doe" />
                </label>

                <label className="auth-label">
                  <span>Email</span>
                  <input type="email" name="email" placeholder="Email" />
                </label>
                <label className="auth-label">
                  <span>Phone Number</span>
                  <input type="tel" name="phone" placeholder="+63 XXX XXX XXXX" />
                </label>

                <div className="auth-label ask-subject" aria-label="Select Subject">
                  <span>Select Subject?</span>
                  <div className="ask-radio-row">
                    <label className="auth-radio">
                      <input type="radio" name="subject" value="General Inquiry" defaultChecked />
                      <span>General Inquiry</span>
                    </label>
                    <label className="auth-radio">
                      <input type="radio" name="subject" value="General Inquiry 2" />
                      <span>General Inquiry</span>
                    </label>
                    <label className="auth-radio">
                      <input type="radio" name="subject" value="General Inquiry 3" />
                      <span>General Inquiry</span>
                    </label>
                    <label className="auth-radio">
                      <input type="radio" name="subject" value="General Inquiry 4" />
                      <span>General Inquiry</span>
                    </label>
                  </div>
                </div>

                <label className="auth-label ask-message">
                  <span>Message</span>
                  <textarea name="message" placeholder="Write your message..." rows="4"></textarea>
                </label>
              </div>

              <button className="btn btn-send-message" type="submit">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

