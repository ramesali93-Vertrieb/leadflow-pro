import { AuthGuard } from "../../../components/app/auth-guard";
import { AppShell } from "../../../components/app/app-shell";
import { createServerSupabaseClient } from "../../../lib/supabase-server";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();

  // 1. Basisdaten laden
  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, full_name, status, due_date, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Fehler beim Laden der Leads: " + error.message);
  }

  const now = new Date();

  // 2. KPIs berechnen
  const totalLeads = leads?.length ?? 0;

  const dueToday =
    leads?.filter((lead) => {
      if (!lead.due_date) return false;
      const due = new Date(lead.due_date);
      return (
        due.getDate() === now.getDate() &&
        due.getMonth() === now.getMonth() &&
        due.getFullYear() === now.getFullYear()
      );
    }).length ?? 0;

  const newLeads =
    leads?.filter((lead) => {
      const created = new Date(lead.created_at);
      return (
        created.getDate() === now.getDate() &&
        created.getMonth() === now.getMonth() &&
        created.getFullYear() === now.getFullYear()
      );
    }).length ?? 0;

  // 3. wichtige Leads (nächste 5 fällige)
  const upcomingLeads =
    leads
      ?.filter((l) => l.due_date)
      .sort(
        (a, b) =>
          new Date(a.due_date).getTime() -
          new Date(b.due_date).getTime()
      )
      .slice(0, 5) ?? [];

  return (
    <AuthGuard>
      <AppShell
        title="Dashboard"
        description="Übersicht über deine Leads und Aktivitäten"
      >
        <div style={{ display: "grid", gap: "24px" }}>
          
          {/* KPIs */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "16px",
            }}
          >
            <div className="card" style={{ padding: "20px" }}>
              <strong>Gesamt Leads</strong>
              <div style={{ fontSize: "28px", marginTop: "8px" }}>
                {totalLeads}
              </div>
            </div>

            <div className="card" style={{ padding: "20px" }}>
              <strong>Heute fällig</strong>
              <div style={{ fontSize: "28px", marginTop: "8px" }}>
                {dueToday}
              </div>
            </div>

            <div className="card" style={{ padding: "20px" }}>
              <strong>Neue Leads heute</strong>
              <div style={{ fontSize: "28px", marginTop: "8px" }}>
                {newLeads}
              </div>
            </div>
          </div>

          {/* Wichtige Leads */}
          <div className="card" style={{ padding: "20px" }}>
            <h2>Wichtige Leads</h2>

            {upcomingLeads.length === 0 ? (
              <div>Keine fälligen Leads</div>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {upcomingLeads.map((lead) => (
                  <div
                    key={lead.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid #27272a",
                      paddingBottom: "8px",
                    }}
                  >
                    <div>
                      <div>{lead.full_name}</div>
                      <div style={{ fontSize: "12px", color: "#a1a1aa" }}>
                        Fällig: {lead.due_date}
                      </div>
                    </div>

                    <Link
                      href={`/leads/${lead.id}`}
                      className="table-action"
                    >
                      Öffnen
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Link zur Leadliste */}
          <div>
            <Link href="/leads" className="table-action">
              → Zur vollständigen Leadliste
            </Link>
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
