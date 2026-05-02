import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { USER_PROFILE } from "../constants";
import RecordStaffDashboard from "./internal-dashboard/RecordStaffDashboard";
import GisSpecialistDashboard from "./internal-dashboard/GisSpecialistDashboard";
import DroneSpecialistDashboard from "./internal-dashboard/DroneSpecialistDashboard";
import SiteInspectorDashboard from "./internal-dashboard/SiteInspectorDashboard";
import DraftsmanDashboard from "./internal-dashboard/DraftsmanDashboard";
import ApprovingAuthorityDashboard from "./internal-dashboard/ApprovingAuthorityDashboard";

const ROLE_LABELS = {
    record_staff: "Record Staff",
    gis_specialist: "GIS Specialist",
    drone_specialist: "Drone Specialist",
    site_inspector: "Site Inspector",
    draftsman: "Draftsman",
    approving_authority: "Approving Authority",
};

function InternalDashboard() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newInternalUser, setNewInternalUser] = useState({
        username: "",
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        contact_number: "",
        personnel_roles: [],
        make_admin: false,
    });
    const [grantUserId, setGrantUserId] = useState("");
    const [feedback, setFeedback] = useState("");
    const djangoAdminUrl = `${(import.meta.env.VITE_API_URL ?? "").replace(/\/api\/?$/, "")}/admin/`;

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const response = await api.get("/api/user/internal/profile/");
                setProfile(response.data);
                // Keep local cache in sync so internal route guards can reuse profile.
                localStorage.setItem(USER_PROFILE, JSON.stringify(response.data));
            } catch {
                setProfile(null);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);

    const renderRoleDashboard = (role) => {
        // Change: role content moved out of InternalDashboard to keep this parent component thin.
        if (role === "record_staff") return <RecordStaffDashboard key={role} />;
        if (role === "gis_specialist") return <GisSpecialistDashboard key={role} />;
        if (role === "drone_specialist") return <DroneSpecialistDashboard key={role} />;
        if (role === "site_inspector") return <SiteInspectorDashboard key={role} />;
        if (role === "draftsman") return <DraftsmanDashboard key={role} />;
        if (role === "approving_authority") return <ApprovingAuthorityDashboard key={role} />;
        return null;
    };

    const toggleRole = (roleKey) => {
        setNewInternalUser((prev) => {
            const hasRole = prev.personnel_roles.includes(roleKey);
            return {
                ...prev,
                personnel_roles: hasRole
                    ? prev.personnel_roles.filter((role) => role !== roleKey)
                    : [...prev.personnel_roles, roleKey],
            };
        });
    };

    const createInternalUser = async (event) => {
        event.preventDefault();
        try {
            await api.post("/api/user/internal/create/", newInternalUser);
            setFeedback("Internal user created successfully.");
            setNewInternalUser({
                username: "",
                email: "",
                password: "",
                first_name: "",
                last_name: "",
                contact_number: "",
                personnel_roles: [],
                make_admin: false,
            });
        } catch (error) {
            setFeedback(`Create failed: ${JSON.stringify(error.response?.data ?? {})}`);
        }
    };

    const grantAdminPrivilege = async (event) => {
        event.preventDefault();
        if (!grantUserId) return;
        try {
            await api.post(`/api/user/internal/${grantUserId}/grant-admin/`);
            setFeedback(`Admin privilege granted to user ${grantUserId}.`);
            setGrantUserId("");
        } catch (error) {
            setFeedback(`Grant failed: ${JSON.stringify(error.response?.data ?? {})}`);
        }
    };

    if (loading) return <div>Loading internal dashboard...</div>;
    if (!profile?.is_internal) return <div>This account is not an internal user.</div>;

    return (
        <div className="application-page">
            <div className="application-card">
                <h1>Internal Dashboard</h1>
                <p className="helper-text">
                    Signed in as {profile.username} ({profile.is_admin ? "Admin" : "Personnel"})
                </p>
                <div className="button-row" style={{ marginTop: "0.6rem", justifyContent: "flex-start" }}>
                    <Link to="/logout" className="secondary-btn">Logout</Link>
                </div>

                {profile.is_personnel && (
                    <>
                        <h2>Personnel Role Views</h2>
                        <p className="helper-text" style={{ marginBottom: "0.8rem" }}>
                            Role-specific queues and actions are rendered in dedicated components below.
                        </p>
                        {(profile.personnel_roles ?? []).map((role) => (
                            <div key={role} style={{ marginBottom: "1rem" }}>
                                <label className="field-label" style={{ display: "block", marginBottom: "0.45rem" }}>
                                    {ROLE_LABELS[role] ?? role}
                                </label>
                                {renderRoleDashboard(role)}
                            </div>
                        ))}
                    </>
                )}
                
                {profile.is_admin && ( 
                    <>
                        <h2>Admin Tools</h2>
                        <p className="helper-text">
                            Admins can create internal users and grant admin privileges to personnel.
                        </p>
                        <p>
                            <a href={djangoAdminUrl} target="_blank" rel="noopener noreferrer" className="secondary-btn">
                                Open Django Admin Dashboard
                            </a>
                        </p>

                        <form onSubmit={createInternalUser} className="section-grid" style={{ gap: "0.6rem" }}>
                            <label className="field-label">Create Internal User</label>
                            <div />
                            <input
                                placeholder="Username"
                                value={newInternalUser.username}
                                onChange={(event) => setNewInternalUser((prev) => ({ ...prev, username: event.target.value }))}
                                required
                            />
                            <input
                                placeholder="Email"
                                type="email"
                                value={newInternalUser.email}
                                onChange={(event) => setNewInternalUser((prev) => ({ ...prev, email: event.target.value }))}
                                required
                            />
                            <input
                                placeholder="Password"
                                type="password"
                                value={newInternalUser.password}
                                onChange={(event) => setNewInternalUser((prev) => ({ ...prev, password: event.target.value }))}
                                required
                            />
                            <input
                                placeholder="First name"
                                value={newInternalUser.first_name}
                                onChange={(event) => setNewInternalUser((prev) => ({ ...prev, first_name: event.target.value }))}
                            />
                            <input
                                placeholder="Last name"
                                value={newInternalUser.last_name}
                                onChange={(event) => setNewInternalUser((prev) => ({ ...prev, last_name: event.target.value }))}
                            />
                            <input
                                placeholder="Contact number"
                                value={newInternalUser.contact_number}
                                onChange={(event) => setNewInternalUser((prev) => ({ ...prev, contact_number: event.target.value }))}
                            />

                            <label className="field-label">Personnel Roles</label>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                {Object.entries(ROLE_LABELS).map(([roleKey, label]) => (
                                    <label key={roleKey}>
                                        <input
                                            type="checkbox"
                                            checked={newInternalUser.personnel_roles.includes(roleKey)}
                                            onChange={() => toggleRole(roleKey)}
                                        />
                                        {` ${label}`}
                                    </label>
                                ))}
                            </div>

                            <label>
                                <input
                                    type="checkbox"
                                    checked={newInternalUser.make_admin}
                                    onChange={(event) => setNewInternalUser((prev) => ({ ...prev, make_admin: event.target.checked }))}
                                />
                                {" Create with admin privileges"}
                            </label>
                            <button type="submit" className="secondary-btn">Create Internal User</button>
                        </form>

                        <form onSubmit={grantAdminPrivilege} style={{ marginTop: "1rem" }}>
                            <label className="field-label">Grant Admin Privilege</label>
                            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                                <input
                                    placeholder="Target user ID"
                                    value={grantUserId}
                                    onChange={(event) => setGrantUserId(event.target.value)}
                                    required
                                />
                                <button type="submit" className="secondary-btn">Grant</button>
                            </div>
                        </form>
                    </>
                )}

                {feedback && <p className="helper-text" style={{ marginTop: "0.75rem" }}>{feedback}</p>}
            </div>
        </div>
    );
}

export default InternalDashboard;
