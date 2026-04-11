import Link from "next/link";
import { CSSProperties } from "react";
import { AuthGuard } from "../../../components/app/auth-guard";
import { AppShell } from "../../../components/app/app-shell";
import { createServerSupabaseClient } from "../../../lib/supabase-server";
import { formatDate } from "../../../lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Lead = {
  id: string;
  full_name: string;
  status: string;
  priority: string;
  next_step: string;
  due_date: string;
  created_at: string;
};

const gridStyle: CSSProperties = {
  display: "grid",
  gap: "16px",
};

const cardStyle: CSSProperties = {
  padding: "18px",
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  transition: "transform 0.18s ease, box-shadow 0.18s ease",
};

const titleStyle: CSSProperties = {
  fontSize: "18px",
  fontWeight: 700,
  marginBottom: "6px",
};

const metaRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginTop: "8px",
};

const metaStyle: CSSProperties = {
  fontSize: "13px",
  padding: "4px 10px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const helperStyle: CSSProperties = {
  marginTop: "8px",
  fontSize: "14px",
  color: "rgba(255,255,255,0.6)",
};

export default async function LeadsPage() {
  const supabase = createServerSupabaseClient();

  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, full_name, status, priority, next_step, due_date, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Fehler beim Laden der Leads: " + error.message);
  }

  return (
    <AuthGuard>
      <AppShell
        title="Leads"
        description="Alle Leads im Überblick – mobil optimiert"
      >
        <div style={gridStyle}>
          {(leads ?? []).length === 0 ? (
            <div className="empty-state">Keine Leads vorhanden.</div>
          ) : (
            leads.map((lead: Lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                style={{ textDecoration: "none" }}
              >
                <div style={cardStyle}>
                  <div style={titleStyle}>{lead.full_name}</div>

                  <div style={helperStyle}>
                    {lead.next_step || "Kein nächster Schritt"}
                  </div>

                  <div style={metaRowStyle}>
                    <span style={metaStyle}>{lead.status}</span>
                    <span style={metaStyle}>{lead.priority}</span>
                    <span style={metaStyle}>
                      {lead.due_date ? formatDate(lead.due_date) : "—"}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
