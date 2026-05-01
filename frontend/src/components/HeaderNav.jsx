import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, USER_PROFILE } from "../constants.js";

function hasInternalAccessFromCache() {
  try {
    const profileRaw = localStorage.getItem(USER_PROFILE);
    const profile = profileRaw ? JSON.parse(profileRaw) : null;
    return Boolean(profile?.is_internal);
  } catch {
    return false;
  }
}

export default function HeaderNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const loggedIn = Boolean(localStorage.getItem(ACCESS_TOKEN));
  const isInternal = loggedIn && hasInternalAccessFromCache();

  useEffect(() => {
    const onDoc = () => setMenuOpen(false);
    const onEsc = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="main-header">
      <div className="container main-header-inner">
        <div className="nav-brand">MPDO Alubijid</div>
        <nav className="nav" aria-label="Primary">
          <NavLink className="nav-link" to="/">
            Home
          </NavLink>

          <NavLink className="nav-link" to="/about">
            About Us
          </NavLink>

          {!loggedIn ? (
            <>
              <NavLink className="nav-link" to="/register">
                Register
              </NavLink>
              <NavLink className="nav-link" to="/login">
                Login
              </NavLink>
            </>
          ) : (
            <>
              {!isInternal && (
                <NavLink className="nav-link" to="/Application">
                  Application
                </NavLink>
              )}

              {isInternal && (
                <NavLink className="nav-link" to="/internal">
                  Internal
                </NavLink>
              )}

              <div className="nav-dropdown">
                <button
                  type="button"
                  className="nav-link nav-trigger"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenuOpen((v) => !v);
                  }}
                >
                  <span aria-hidden="true" style={{ marginRight: 8 }}>
                    👤
                  </span>
                  Profile
                </button>

                <div
                  className={`nav-menu ${menuOpen ? "is-open" : ""}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {!isInternal && (
                    <Link className="nav-menu-link" to="/Application/Tracker">
                      Track Status
                    </Link>
                  )}
                  <Link className="nav-menu-link" to="/settings">
                    Settings
                  </Link>
                  <Link className="nav-menu-link" to="/requirements">
                    Requirements
                  </Link>
                  <Link className="nav-menu-link" to="/ask">
                    Ask a Question
                  </Link>
                  <div className="nav-menu-sep" />
                  <button
                    type="button"
                    className="nav-menu-btn"
                    onClick={() => {
                      localStorage.clear();
                      navigate("/login", { replace: true });
                    }}
                  >
                    Log Out
                  </button>
                </div>
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

