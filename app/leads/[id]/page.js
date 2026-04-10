"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const statusList = [
  "Kontaktversuch",
  "Termin geplant",
  "Angebot",
  "Nachfassen",
  "Gewonnen",
  "Storno",
];

export default function LeadDetailPage({ params }) {
  const leadId = params.id;

  const [user, setUser] = useState(null);
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [statusComment, setStatusComment] = useState("");

  useEffect(() => {
    loadPage();
  }, [leadId]);

  async function loadPage() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);

    const { data: leadData } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    setLead(leadData || null);

    const { data: activityData } = await supabase
      .from("lead_activities")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });

    setActivities(activityData || []);
  }

  async function saveNote() {
    if (!noteText.trim() || !lead || !user) return;

    await supabase.from("lead_activities").insert({
      lead_id: lead.id,
      user_id: user.id,
      activity_type: "note",
      body: noteText.trim(),
    });

    setNoteText("");
    await loadPage();
  }

  async function quickAction(type) {
    if (!lead || !user) return;

    const texts = {
      call: "Anruf dokumentiert.",
      email: "E-Mail dokumentiert.",
      followup: "Follow-up gesetzt.",
      offer: "Angebot dokumentiert.",
    };

    await supabase.from("lead_activities").insert({
      lead_id: lead.id,
      user_id: user.id,
      activity_type: type,
      body: texts[type],
    });

    await loadPage();
  }

  async function changeStatus(newStatus) {
    if (!lead || !user || !statusComment.trim()) return;

    await supabase
      .from("leads")
      .update({
        status: newStatus,
      })
      .eq("id", lead.id);

    await supabase.from("lead_activities").insert({
      lead_id: lead.id,
      user_id: user.id,
      activity_type: "status_change",
      body: `${newStatus}: ${statusComment.trim()}`,
    });

    setStatusComment("");
    await loadPage();
  }

  if (!lead) {
    return (
      <main style={pageStyle}>
        <div style={{ color: "white" }}>Lead wird geladen ...</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={topBar}>
        <Link href="/" style={backLink}>
          ← Zurück zur Übersicht
        </Link>
      </div>

      <div style={detailGrid}>
        <section style={mainCard}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, color: "#60a5fa", fontWeight: 700 }}>
              Lead Detailseite
            </div>
            <h1 style={{ margin: "10px 0 6px", fontSize: 40, color: "white" }}>
              {lead.full_name}
            </h1>
            <p style={{ color: "#94a3b8", margin: 0 }}>
              {lead.city || "—"} · {lead.email || "—"}
            </p>
          </div>

          <div style={infoGrid}>
            <InfoCard label="Telefon" value={lead.phone || "—"} />
            <InfoCard label="E-Mail" value={lead.email || "—"} />
            <InfoCard label="Status" value={lead.status || "—"} />
            <InfoCard label="Nächster Schritt" value={lead.next_step || "—"} />
            <InfoCard label="Fällig" value={lead.due_date || "—"} />
            <InfoCard label="Angebot" value={`${lead.offer_amount || 0} €`} />
            <InfoCard label="Chance" value={`${lead.win_chance || 0}%`} />
            <InfoCard label="Owner ID" value={lead.owner_id || "—"} />
          </div>

          <div style={sectionCard}>
            <h3 style={sectionTitle}>Lead-Notiz</h3>
            <div style={{ color: "#cbd5e1" }}>
              {lead.base_note || "Noch keine Basisnotiz."}
            </div>
          </div>

          <div style={sectionCard}>
            <h3 style={sectionTitle}>Neue Notiz</h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="z. B. Kunde angerufen, interessiert, Rückruf morgen 10:00 ..."
              style={textareaStyle}
            />
            <button onClick={saveNote} style={{ ...primaryButton, marginTop: 12 }}>
              Notiz speichern
            </button>
          </div>

          <div style={sectionCard}>
            <h3 style={sectionTitle}>Historie</h3>

            <div style={{ display: "grid", gap: 10 }}>
              {activities.map((activity) => (
                <div key={activity.id} style={activityCard}>
                  <div style={activityTop}>
                    <strong>{activity.activity_type}</strong>
                    <span style={{ color: "#94a3b8", fontSize: 12 }}>
                      {new Date(activity.created_at).toLocaleString("de-DE")}
                    </span>
                  </div>
                  <div style={{ marginTop: 8, color: "#cbd5e1" }}>{activity.body}</div>
                </div>
              ))}

              {!activities.length ? (
                <div style={{ color: "#94a3b8" }}>Noch keine Aktivitäten vorhanden.</div>
              ) : null}
            </div>
          </div>
        </section>

        <aside style={sideCard}>
          <div style={sectionCardCompact}>
            <h3 style={sectionTitle}>Quick Actions</h3>
            <div style={buttonGrid}>
              <button onClick={() => quickAction("call")} style={secondaryButton}>Anruf</button>
              <button onClick={() => quickAction("email")} style={secondaryButton}>E-Mail</button>
              <button onClick={() => quickAction("followup")} style={secondaryButton}>Follow-up</button>
              <button onClick={() => quickAction("offer")} style={secondaryButton}>Angebot</button>
            </div>
          </div>

          <div style={sectionCardCompact}>
            <h3 style={sectionTitle}>Status ändern</h3>
            <input
              value={statusComment}
              onChange={(e) => setStatusComment(e.target.value)}
              placeholder="Kommentar zum Statuswechsel"
              style={inputStyle}
            />

            <div style={{ ...buttonGrid, marginTop: 12 }}>
              {statusList.map((status) => (
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
        </aside>
      </div>
    </main>
  );
}

function InfoCard({ label, value }) {
  return (
    <div style={infoCard}>
      <div style={{ fontSize: 12, color: "#94a3b8", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ marginTop: 6, fontWeight: 700, color: "white" }}>{value}</div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  padding: 20,
  background:
    "radial-gradient(circle at top left, rgba(99,102,241,0.14), transparent 25%), linear-gradient(180deg, #020617, #0f172a)",
};

const topBar = {
  marginBottom: 16,
};

const backLink = {
  color: "#93c5fd",
  textDecoration: "none",
  fontWeight: 700,
};

const detailGrid = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) 340px",
  gap: 20,
};

const mainCard = {
  background: "#111827",
  border: "1px solid #334155",
  borderRadius: 24,
  padding: 24,
};

const sideCard = {
  display: "grid",
  gap: 16,
  alignContent: "start",
};

const infoGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0,1fr))",
  gap: 12,
  marginBottom: 20,
};

const infoCard = {
  background: "#0b1220",
  border: "1px solid #1e293b",
  borderRadius: 16,
  padding: 14,
};

const sectionCard = {
  background: "#0b1220",
  border: "1px solid #1e293b",
  borderRadius: 18,
  padding: 16,
  marginBottom: 18,
};

const sectionCardCompact = {
  background: "#111827",
  border: "1px solid #334155",
  borderRadius: 18,
  padding: 16,
};

const sectionTitle = {
  marginTop: 0,
  marginBottom: 12,
  color: "white",
};

const textareaStyle = {
  width: "100%",
  minHeight: 110,
  borderRadius: 12,
  padding: 12,
  border: "1px solid #334155",
  background: "#020617",
  color: "white",
  resize: "vertical",
};

const inputStyle = {
  width: "100%",
  padding: 12,
  borderRadius: 12,
  border: "1px solid #334155",
  background: "#020617",
  color: "white",
  boxSizing: "border-box",
};

const activityCard = {
  border: "1px solid #1e293b",
  borderRadius: 14,
  padding: 12,
  background: "#111827",
};

const activityTop = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  color: "white",
};

const buttonGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
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
