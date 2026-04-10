"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

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

const TODAY = "2026-04-10";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setUser(user);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(profileData || null);

    const { data: leadsData } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    setLeads(leadsData || []);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  const dueToday = leads.filter(
    (lead) =>
      lead.due_date === TODAY &&
      lead.status !== "Gewonnen" &&
      lead.status !== "Storno"
  );

  const openLeads = leads.filter(
    (lead) => lead.status !== "Gewonnen" && lead.status !== "Storno"
  );

  const pipelineValue = leads.reduce(
    (sum, lead) =>
      sum +
      Number(lead.offer_amount || 0) * (Number(lead.win_chance || 0) / 100),
    0
  );

  if (!user) {
    return (
      <main style={loginPage}>
        <div style={loginCard}>
          <h1 style={{ marginTop: 0 }}>Leadflow Pro</h1>
          <p style={{ color: "#94a3b8" }}>
            Bitte zuerst einloggen.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={layoutStyle}>
        <aside style={sidebarStyle}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, letterSpacing: 2, color: "#94a3b8" }}>
              LEAD OS
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>
              Leadflow Pro
            </div>
          </div>

          <div style={profileCard}>
            <div style={{ fontWeight: 700 }}>{profile?.name || "Unbekannt"}</div>
            <div style={{ fontSize: 14, color: "#94a3b8", marginTop: 4 }}>
              {profile?.role || "—"}
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <SidebarItem label="Dashboard" active />
            <SidebarItem label="Pipeline" />
            <SidebarItem label="Leads" />
            <SidebarItem label="Heute" />
          </div>

          <button onClick={handleLogout} style={{ ...secondaryButton, width: "100%", marginTop: 24 }}>
            Logout
          </button>
        </aside>

        <section style={{ minWidth: 0 }}>
          <div style={headerRow}>
            <div>
              <div style={{ color: "#60a5fa", fontSize: 14, fontWeight: 700 }}>
                Sales Ops Command Center
              </div>
              <h1 style={{ margin: "8px 0", fontSize: 38 }}>
                Lead Übersicht
              </h1>
              <p style={{ color: "#94a3b8", margin: 0 }}>
                Klick auf einen Lead, um die komplette Detailseite zu öffnen.
              </p>
            </div>

            <div style={roleBadge}>
              {profile?.name} · {profile?.role}
            </div>
          </div>

          <div style={statsGrid}>
            <StatCard title="Sichtbare Leads" value={leads.length} />
            <StatCard title="Heute fällig" value={dueToday.length} />
            <StatCard title="Offene Leads" value={openLeads.length} />
            <StatCard title="Pipeline Wert" value={`${pipelineValue.toFixed(0)} €`} />
          </div>

          <div style={panelStyle}>
            <div style={{ fontWeight: 700, marginBottom: 14 }}>Heute anstehend</div>

            {dueToday.length === 0 ? (
              <div style={{ color: "#94a3b8" }}>Keine offenen Aufgaben für heute.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {dueToday.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                    style={todoCard}
                  >
                    <div style={{ fontWeight: 700 }}>{lead.full_name}</div>
                    <div style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>
                      {lead.next_step || "—"}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div style={tableWrap}>
            <div style={tableHeader}>
              <div>Lead</div>
              <div>Status</div>
              <div>Owner</div>
              <div>Nächster Schritt</div>
              <div>Fällig</div>
            </div>

            {leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                style={tableRow}
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
                      color: "white",
                    }}
                  >
                    {lead.status}
                  </span>
                </div>

                <div>{lead.owner_id || "—"}</div>
                <div>{lead.next_step || "—"}</div>
                <div>{lead.due_date || "—"}</div>
              </Link>
            ))}

            {!leads.length ? (
              <div style={{ padding: 24, color: "#94a3b8" }}>
                Noch keine Leads gefunden.
              </div>
            ) : null}
          </div>
        </section>
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
    <div style={statCard}>
      <div style={{ color: "#94a3b8", fontSize: 14 }}>{title}</div>
      <div style={{ fontSize: 34, fontWeight: 800, marginTop: 10 }}>{value}</div>
    </div>
  );
}

const loginPage = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  background:
    "radial-gradient(circle at top left, rgba(99,102,241,0.18), transparent 25%), linear-gradient(180deg, #020617, #0f172a)",
};

const loginCard = {
  background: "#111827",
  border: "1px solid #334155",
  borderRadius: 24,
  padding: 28,
  width: "100%",
  maxWidth: 420,
};

const pageStyle = {
  minHeight: "100vh",
  padding: 20,
  background:
    "radial-gradient(circle at top left, rgba(99,102,241,0.14), transparent 25%), linear-gradient(180deg, #020617, #0f172a)",
};

const layoutStyle = {
  display: "grid",
  gridTemplateColumns: "260px minmax(0,1fr)",
  gap: 20,
};

const sidebarStyle = {
  background: "#020617",
  border: "1px solid #1e293b",
  borderRadius: 28,
  padding: 20,
  minHeight: "calc(100vh - 40px)",
};

const profileCard = {
  background: "#0f172a",
  border: "1px solid #1e293b",
  borderRadius: 18,
  padding: 14,
  marginBottom: 20,
};

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 20,
  marginBottom: 20,
};

const roleBadge = {
  background: "#111827",
  border: "1px solid #334155",
  borderRadius: 16,
  padding: "10px 14px",
  fontSize: 14,
  whiteSpace: "nowrap",
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0,1fr))",
  gap: 16,
  marginBottom: 20,
};

const statCard = {
  background: "#111827",
  border: "1px solid #334155",
  borderRadius: 20,
  padding: 20,
};

const panelStyle = {
  background: "#111827",
  border: "1px solid #334155",
  borderRadius: 22,
  padding: 18,
  marginBottom: 20,
};

const todoCard = {
  display: "block",
  background: "#0b1220",
  border: "1px solid #1e293b",
  borderRadius: 16,
  padding: 14,
  textAlign: "left",
  color: "white",
  textDecoration: "none",
};

const tableWrap = {
  background: "#111827",
  border: "1px solid #334155",
  borderRadius: 22,
  overflow: "hidden",
};

const tableHeader = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
  padding: 16,
  background: "#0b1220",
  fontWeight: 700,
};

const tableRow = {
  width: "100%",
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
  padding: 16,
  borderTop: "1px solid #1e293b",
  color: "white",
  textAlign: "left",
  textDecoration: "none",
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
