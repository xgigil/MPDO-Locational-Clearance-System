import { usePhilippineClock } from "../hooks/usePhilippineClock.js";

export default function TopBanner() {
  const { time, date } = usePhilippineClock();

  return (
    <div className="top-banner">
      <div className="container top-banner-inner">
        <div className="seal seal--logo" aria-hidden="true">
          <div className="seal-ring"></div>
          <img className="seal-logo" alt="Municipal Seal" src="/seal-logo.png" />
        </div>

        <div className="banner-copy">
          <div className="banner-line banner-title">Republic of the Philippines</div>
          <div className="banner-line banner-subtitle">Alubijid, Misamis Oriental</div>
          <div className="banner-line banner-small">Municipal Planning and Development Office</div>
        </div>

        <div className="banner-time">
          <div className="time-label">Philippine Standard Time</div>
          <div className="time-value" id="clock">
            {time}
          </div>
          <div className="time-date" id="date">
            {date}
          </div>
        </div>
      </div>
    </div>
  );
}

