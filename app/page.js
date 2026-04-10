"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const TODAY = "2026-04-10";

const statusColors = {
  "Neu": "#1e293b",
  "Erstkontakt offen": "#9a3412",
  "Kontaktversuch": "#a16207",
  "Termin geplant": "#6d28d9",
  "Angebot": "#1d4ed8",
  "Nachfassen": "#0f766e",
  "Gewonnen": "#166534",
  "Storno": "#991b1b",
};

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [activities, setActivities] = useState([]);

  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  const [noteText, setNoteText] = useState("");
  const [statusComment, setStatusComment] = useState("");

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setUser(user);
    const loadedProfile = await loadProfile(user.id);
    const loadedLeads = await loadLeads(user.id, loadedProfile?.role);

    if (loadedLeads.length > 0) {
      setSelectedLead(loadedLeads[0]);
      await loadActivities(loadedLeads[0].id);
    }
  }

  async function loadProfile(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setProfile(data);
      return data;
    }

    return null;
  }

  async function loadLeads(userId, roleOverride = null) {
    const role = roleOverride || profile?.role;

    let query = supabase
      .from("leads")
      .select(`
        id,
        external_lead_id,
        full_name,
        phone,
        email,
        city,
        status,
        priority,
        next_step,
        due_date,
        offer_amount,
        win_chance,
        base_note,
        source,
        project_start,
        roof_type,
        storage_interest,
        financing,
        address,
        owner_id,
        owner:owner_id (
          id,
          name
        ),
        last_activity_type,
        last_activity_at
      `)
      .order("created_at", { ascending: false });

    if (role !== "admin") {
      query = query.eq("owner_id", userId);
    }

    const { data, error } = await query;

    if (!error && data) {
      setLeads(data);
      return data;
    }

    return [];
  }

  async function loadActivities(leadId) {
    const { data, error } = await supabase
      .from("lead_activities")
      .select(`
        id,
        activity_type,
        body,
        created_at,
        user:user_id (
          name
        )
      `)
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setActivities(data);
    } else {
      setActivities([]);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setLoginError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoginError("Login fehlgeschlagen");
      setLoading(false);
      return;
    }

    setUser(data.user);

    const loadedProfile = await loadProfile(data.user.id);
    const loadedLeads = await loadLeads(data.user.id, loadedProfile?.role);

    await supabase.rpc("record_daily_login");

    if (loadedLeads.length > 0) {
      setSelectedLead(loadedLeads[0]);
      await loadActivities(loadedLeads[0].id);
    }

    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setLeads([]);
    setSelectedLead(null);
    setActivities([]);
    setEmail("");
    setPassword("");
  }

  async function selectLead(lead) {
    setSelectedLead(lead);
    await loadActivities(lead.id);
  }

  async function addNote() {
    if (!selectedLead || !noteText.trim()) return;

    const { error } = await supabase.rpc("add_lead_activity", {
      p_lead_id: selectedLead.id,
      p_activity_type: "note",
      p_body: noteText.trim(),
      p_new_status: null,
      p_next_step: null,
      p_due_date: null,
    });

    if (!error) {
      setNoteText("");
      await refreshCurrentData(selectedLead.id);
    }
  }

  async function quickAction(type) {
    if (!selectedLead) return;

    const texts = {
      call: "Anruf dokumentiert.",
      email: "E-Mail dokumentiert.",
      followup: "Follow-up gesetzt.",
      offer: "Angebot dokumentiert.",
    };

    const { error } = await supabase.rpc("add_lead_activity", {
      p_lead_id: selectedLead.id,
      p_activity_type: type,
      p_body: texts[type],
      p_new_status: null,
      p_next_step: null,
      p_due_date: null,
    });

    if (!error) {
      await refreshCurrentData(selectedLead.id);
    }
  }

  async function changeStatus(newStatus) {
    if (!selectedLead || !statusComment.trim()) return;

    const { error } = await supabase.rpc("add_lead_activity", {
      p_lead_id: selectedLead.id,
      p_activity_type: "status_change",
      p_body: statusComment.trim(),
      p_new_status: newStatus,
      p_next_step: null,
      p_due_date: null,
    });

    if (!error) {
      setStatusComment("");
      await refreshCurrentData(selectedLead.id);
    }
  }

  async function refreshCurrentData(currentLeadId) {
    if (!user) return;

    const loadedLeads = await loadLeads(user.id, profile?.role);
    const updatedLead = loadedLeads.find((l) => l.id === currentLeadId) || loadedLeads[0] || null;
    setSelectedLead(updatedLead);

    if (updatedLead) {
      await loadActivities(updatedLead.id);
    } else {
      setActivities([]);
    }
  }

  const dueToday = useMemo(
    () =>
      leads.filter(
        (lead) =>
          lead.due_date === TODAY &&
          lead.status !== "Gewonnen" &&
          lead.status !== "Storno"
      ),
    [leads]
  );

  const openLeads = useMemo(
    () =>
      leads.filter(
        (lead) => lead.status !== "Gewonnen" && lead.status !== "Storno"
      ),
    [leads]
  );

  const pipelineValue = useMemo(
    () =>
      leads.reduce(
        (sum, lead) => sum + Number(lead.offer_amount || 0) * (Number(lead.win_chance || 0) / 100),
        0
      ),
    [leads]
  );

  if (!user) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background:
            "radial-gradient(circle at top left, rgba(99,102,241,0.18), transparent 25%), linear-gradient(180deg, #020617, #0f172a)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 460,
            background: "#111827",
            border: "1px solid #334155",
            borderRadius: 24,
            padding: 28,
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          }}
        >
          <h1 style={{ marginTop: 0, fontSize: 42, marginBottom: 8 }}>Leadflow Pro</h1>
          <p style={{ color: "#94a3b8", marginBottom: 24 }}>
            Vertriebssystem mit Login, Leads und Historie
          </p>

          <form
            onSubmit={handleLogin}
            style={{ display: "grid", gap: 12 }}
          >
            <input
              type="email"
              placeholder="E-Mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />

            {loginError ? (
              <div
                style={{
                  background: "#450a0a",
                  color: "#fecaca",
                  padding: 12,
                  borderRadius: 12,
                  fontSize: 14,
                }}
              >
                {loginError}
              </div>
            ) : null}

            <button type="submit" disabled={loading} style={primaryButton}>
              {loading ? "Lädt..." : "Einloggen"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 20,
        background:
          "radial-gradient(circle at top left, rgba(99,102,241,0.14), transparent 25%), linear-gradient(180deg, #020617, #0f172a)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px minmax(0,1fr) 420px",
          gap: 20,
        }}
      >
        <aside
          style={{
            background: "#020617",
            border: "1px solid #1e293b",
            borderRadius: 28,
            padding: 20,
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, letterSpacing: 2, color: "#94a3b8" }}>LEAD OS</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>Leadflow Pro</div>
          </div>

          <div
            style={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: 18,
              padding: 14,
              marginBottom: 20,
            }}
          >
            <div style={{ fontWeight: 700 }}>{profile?.name}</div>
            <div style={{ fontSize: 14, color: "#94a3b8", marginTop: 4 }}>
              {profile?.role}
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <SidebarItem label="Dashboard" active />
            <SidebarItem label="Pipeline" />
            <SidebarItem label="Leads" />
            <SidebarItem label="Heute" />
          </div>

          <button
            onClick={handleLogout}
            style={{ ...secondaryButton, width: "100%", marginTop: 24 }}
          >
            Logout
          </button>
        </aside>

        <section style={{ minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 20,
              marginBottom: 20,
            }}
          >
            <div>
              <div style={{ color: "#60a5fa", fontSize: 14, fontWeight: 700 }}>
                Sales Ops Command Center
              </div>
              <h1 style={{ margin: "8px 0 8px", fontSize: 36 }}>
                {profile?.role === "admin" ? "Alle Leads im Blick" : "Deine Leads im Blick"}
              </h1>
              <p style={{ color: "#94a3b8", margin: 0 }}>
                Heute-Ansicht, Lead-Liste und Aktivitäts-Historie
              </p>
            </div>

            <div
              style={{
                background: "#111827",
                border: "1px solid #334155",
                borderRadius: 16,
                padding: "10px 14px",
                fontSize: 14,
                whiteSpace: "nowrap",
              }}
            >
              {profile?.name} · {profile?.role}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0,1fr))",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <StatCard title="Sichtbare Leads" value={leads.length} />
            <StatCard title="Heute fällig" value={dueToday.length} />
            <StatCard title="Offene Leads" value={openLeads.length} />
            <StatCard title="Pipeline Wert" value={`${pipelineValue.toFixed(0)} €`} />
          </div>

          <div
            style={{
              background: "#111827",
              border: "1px solid #334155",
              borderRadius: 22,
              padding: 18,
              marginBottom: 20,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 14 }}>Heute anstehend</div>

            {dueToday.length === 0 ? (
              <div style={{ color: "#94a3b8" }}>Keine offenen Aufgaben für heute.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {dueToday.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => selectLead(lead)}
                    style={{
                      background: "#0b1220",
                      border: "1px solid #1e293b",
                      borderRadius: 16,
                      padding: 14,
                      textAlign: "left",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{lead.full_name}</div>
                    <div style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>
                      {lead.owner?.name || "—"} · {lead.next_step}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div
            style={{
              background: "#111827",
              border: "1px solid #334155",
              borderRadius: 22,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                padding: 16,
                background: "#0b1220",
                fontWeight: 700,
              }}
            >
              <div>Lead</div>
              <div>Status</div>
              <div>Owner</div>
              <div>Nächster Schritt</div>
              <div>Fällig</div>
            </div>

            {leads.map((lead) => (
              <button
                key={lead.id}
                onClick={() => selectLead(lead)}
                style={{
                  width: "100%",
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                  padding: 16,
                  borderTop: "1px solid #1e293b",
                  background: selectedLead?.id === lead.id ? "#0f172a" : "transparent",
                  color: "white",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{lead.full_name}</div>
                  <div style={{ color: "#94a3b8", fontSize: 14 }}>
                    {lead.city || "—"} · {lead.email || "—"}
                  </div>
                </div>
                <div>
                  <span
                    style={{
                      background: statusColors[lead.status] || "#334155",
                      padding: "6px 10px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {lead.status}
                  </span>
                </div>
                <div>{lead.owner?.name || "—"}</div>
                <div>{lead.next_step}</div>
                <div>{lead.due_date}</div>
              </button>
            ))}

            {!leads.length ? (
              <div style={{ padding: 24, color: "#94a3b8" }}>
                Noch keine Leads gefunden.
              </div>
            ) : null}
          </div>
        </section>

        <aside>
          <div
            style={{
              background: "#111827",
              border: "1px solid #334155",
              borderRadius: 24,
              padding: 20,
              minHeight: "calc(100vh - 40px)",
            }}
          >
            {!selectedLead ? (
              <div style={{ color: "#94a3b8" }}>Wähle einen Lead aus.</div>
            ) : (
              <>
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>
                    {selectedLead.full_name}
                  </div>
                  <div style={{ color: "#94a3b8", marginTop: 6 }}>
                    {selectedLead.city || "—"} · {selectedLead.owner?.name || "—"}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
                  <InfoBox label="Telefon" value={selectedLead.phone || "—"} />
                  <InfoBox label="E-Mail" value={selectedLead.email || "—"} />
                  <InfoBox label="Status" value={selectedLead.status || "—"} />
                  <InfoBox label="Nächster Schritt" value={selectedLead.next_step || "—"} />
                  <InfoBox label="Fällig" value={selectedLead.due_date || "—"} />
                  <InfoBox label="Angebot" value={`${selectedLead.offer_amount || 0} €`} />
                  <InfoBox label="Chance" value={`${selectedLead.win_chance || 0}%`} />
                  <InfoBox label="Quelle" value={selectedLead.source || "—"} />
                </div>

                <div
                  style={{
                    background: "#0b1220",
                    border: "1px solid #1e293b",
                    borderRadius: 18,
                    padding: 14,
                    marginBottom: 18,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>Lead-Notiz</div>
                  <div style={{ color: "#cbd5e1", fontSize: 14 }}>
                    {selectedLead.base_note || "Noch keine Basisnotiz."}
                  </div>
                </div>

                <div
                  style={{
                    background: "#0b1220",
                    border: "1px solid #1e293b",
                    borderRadius: 18,
                    padding: 14,
                    marginBottom: 18,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>Neue Notiz</div>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="z. B. Kunde angerufen, interessiert, Rückruf morgen 10:00 ..."
                    style={{
                      width: "100%",
                      minHeight: 100,
                      borderRadius: 12,
                      padding: 12,
                      border: "1px solid #334155",
                      background: "#020617",
                      color: "white",
                      resize: "vertical",
                    }}
                  />
                  <button onClick={addNote} style={{ ...primaryButton, width: "100%", marginTop: 10 }}>
                    Notiz speichern
                  </button>
                </div>

                <div
                  style={{
                    background: "#0b1220",
                    border: "1px solid #1e293b",
                    borderRadius: 18,
                    padding: 14,
                    marginBottom: 18,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>Quick Actions</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <button onClick={() => quickAction("call")} style={secondaryButton}>Anruf</button>
                    <button onClick={() => quickAction("email")} style={secondaryButton}>E-Mail</button>
                    <button onClick={() => quickAction("followup")} style={secondaryButton}>Follow-up</button>
                    <button onClick={() => quickAction("offer")} style={secondaryButton}>Angebot</button>
                  </div>
                </div>

                <div
                  style={{
                    background: "#0b1220",
                    border: "1px solid #1e293b",
                    borderRadius: 18,
                    padding: 14,
                    marginBottom: 18,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>Status ändern</div>
                  <div style={{ display: "grid", gap: 10 }}>
                    <input
                      value={statusComment}
                      onChange={(e) => setStatusComment(e.target.value)}
                      placeholder="Kommentar zum Statuswechsel"
                      style={inputStyle}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {["Kontaktversuch", "Termin geplant", "Angebot", "Nachfassen", "Gewonnen", "Storno"].map((status) => (
                        <button
                          key={status}
                          onClick={() => changeStatus(status)}
                          style={secondaryButton}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: "#0b1220",
                    border: "1px solid #1e293b",
                    borderRadius: 18,
                    padding: 14,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 10 }}>Historie</div>
                  <div style={{ display: "grid", gap: 10 }}>
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        style={{
                          border: "1px solid #1e293b",
                          borderRadius: 14,
                          padding: 12,
                          background: "#111827",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ fontWeight: 700 }}>
                            {activity.user?.name || "Unbekannt"}
                          </div>
                          <div style={{ fontSize: 12, color: "#94a3b8" }}>
                            {new Date(activity.created_at).toLocaleString("de-DE")}
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: "#60a5fa", marginTop: 4 }}>
                          {activity.activity_type}
                        </div>
                        <div style={{ color: "#cbd5e1", fontSize: 14, marginTop: 8 }}>
                          {activity.body}
                        </div>
                      </div>
                    ))}

                    {activities.length === 0 ? (
                      <div style={{ color: "#94a3b8" }}>Noch keine Aktivitäten vorhanden.</div>
                    ) : null}
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

function SidebarItem({ label, active = false }) {
  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 14,
        background: active ? "white" : "transparent",
        color: active ? "#020617" : "white",
        fontWeight: 700,
      }}
    >
      {label}
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div
      style={{
        background: "#111827",
        border: "1px solid #334155",
        borderRadius: 20,
        padding: 20,
      }}
    >
      <div style={{ color: "#94a3b8", fontSize: 14 }}>{title}</div>
      <div style={{ fontSize: 34, fontWeight: 800, marginTop: 10 }}>{value}</div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div
      style={{
        background: "#0b1220",
        border: "1px solid #1e293b",
        borderRadius: 16,
        padding: 12,
      }}
    >
      <div style={{ fontSize: 12, color: "#94a3b8", textTransform: "uppercase" }}>{label}</div>
      <div style={{ marginTop: 6, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

const inputStyle = {
  padding: 12,
  borderRadius: 12,
  border: "1px solid #334155",
  background: "#020617",
  color: "white",
};

const primaryButton = {
  padding: 12,
  borderRadius: 12,
  border: 0,
  background: "#2563eb",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButton = {
  padding: 12,
  borderRadius: 12,
  border: "1px solid #334155",
  background: "#111827",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};
