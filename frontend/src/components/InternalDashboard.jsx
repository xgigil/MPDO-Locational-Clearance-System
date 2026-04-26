import { useEffect, useMemo, useState } from "react";
import api from "../api";
import { USER_PROFILE } from "../constants";

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
    // Build a stable backend admin URL from VITE_API_URL.
    // This allows frontend users to open Django's prebuilt admin site.
    const backendBaseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
    const djangoAdminUrl = backendBaseUrl
        ? `${backendBaseUrl.replace(/\/api$/, "")}/admin/`
        : "/admin/";

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const response = await api.get("/api/internal/profile/");
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

    const roleCards = useMemo(() => {
        if (!profile?.personnel_roles?.length) return [];
        return profile.personnel_roles.map((role) => ({
            key: role,
            title: ROLE_LABELS[role] ?? role,
            description: `Role-specific queue and actions for ${ROLE_LABELS[role] ?? role}.`,
        }));
    }, [profile]);

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
            await api.post("/api/internal/users/create/", newInternalUser);
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
            await api.post(`/api/internal/users/${grantUserId}/grant-admin/`);
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

                {profile.is_personnel && (
                    <>
                        <h2>Personnel Role Views</h2>
                        <div className="section-grid">
                            {roleCards.map((card) => (
                                <div key={card.key}>
                                    <label className="field-label">{card.title}</label>
                                    <p>{card.description}</p>
                                </div>
                            ))}
                        </div>
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
