import Link from "next/link";
import { AuthGuard } from "../../../components/app/auth-guard";
import { AppShell } from "../../../components/app/app-shell";
import { createServerSupabaseClient } from "../../../lib/supabase-server";
import { formatDate, formatDateTime } from "../../../lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DashboardLead = {
  id: string;
  full_name: string;
  status: string;
  priority: string;
  next_step: string;
  due_date: string;
  created_at: string;
  offer_amount?: number | null;
  win_chance?: number | null;
  last_activity_at?: string | null;
};

function normalizeDateOnly(value: string) {
  const date = new Date(`${value}T00:00:00`);
  date.setHours(0, 0, 0, 0);
  return date;
}

function priorityWeight(priority: string) {
  const value = priority.toLowerCase();
  if (value === "hoch") return 3;
  if (value === "mittel") return 2;
  if (value === "niedrig") return 1;
  return 0;
}

function statusTone(status: string) {
  const value = status.toLowerCase();

  if (value.includes("neu")) return "badge badge-blue";
  if (value.includes("kontakt")) return "badge badge-amber";
  if (value.includes("qual")) return "badge badge-green";
  if (value.includes("gewonnen") || value.includes("won")) return "badge badge-green";
  if (value.includes("verloren") || value.includes("lost")) return "badge badge-red";

  return "badge";
}

function priorityTone(priority: string) {
  const value = priority.toLowerCase();

  if (value === "hoch") return "badge badge-red";
  if (value === "mittel") return "badge badge-amber";
  if (value === "niedrig") return "badge badge-blue";

  return "badge";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, full_name, status, priority, next_step, due_date, created_at, offer_amount, win_chance, last_activity_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error("Fehler beim Laden der Leads: " + error.message);
  }

  const leads = (data ?? []) as DashboardLead[];

  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalLeads = leads.length;

  const dueToday = leads.filter((lead) => {
    if (!lead.due_date) return false;
    return normalizeDateOnly(lead.due_date).getTime() === today.getTime();
  });

  const overdueLeads = leads.filter((lead) => {
    if (!lead.due_date) return false;
    return normalizeDateOnly(lead.due_date).getTime() < today.getTime();
  });

  const newToday = leads.filter((lead) => {
    const created = new Date(lead.created_at);
    return (
      created.getDate() === now.getDate() &&
      created.getMonth() === now.getMonth() &&
      created.getFullYear() === now.getFullYear()
    );
  });

  const highPriorityCount = leads.filter(
    (lead) => lead.priority?.toLowerCase() === "hoch"
  ).length;

  const pipelineValue = leads.reduce(
    (sum, lead) => sum + Number(lead.offer_amount ?? 0),
    0
  );

  const hottestLeads = [...leads]
    .sort((a, b) => {
      const aScore =
        priorityWeight(a.priority) * 100 +
        Number(a.win_chance ?? 0) +
        (a.due_date ? 10 : 0);
      const bScore =
        priorityWeight(b.priority) * 100 +
        Number(b.win_chance ?? 0) +
        (b.due_date ? 10 : 0);

      return bScore - aScore;
    })
    .slice(0, 5);

  const upcomingLeads = [...leads]
    .filter((lead) => !!lead.due_date)
    .sort(
      (a, b) =>
        normalizeDateOnly(a.due_date).getTime() -
        normalizeDateOnly(b.due_date).getTime()
    )
    .slice(0, 6);

  const latestLeads = [...leads]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 6);

  return (
    <AuthGuard>
      <AppShell
        title="Dashboard"
        description="Dein Vertriebs-Cockpit für Prioritäten, Fälligkeiten und wichtige Leads."
        actions={
          <Link href="/leads" className="dashboard-primary-link">
            Zur Leadliste
          </Link>
        }
      >
        <div className="dashboard-grid">
          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Leads gesamt</div>
              <div className="stat-value">{totalLeads}</div>
              <div className="stat-helper">Alle aktuell verfügbaren Leads</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Heute fällig</div>
              <div className="stat-value">{dueToday.length}</div>
              <div className="stat-helper">Leads mit Termin für heute</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Überfällig</div>
              <div className="stat-value">{overdueLeads.length}</div>
              <div className="stat-helper">Brauchen sofort Aufmerksamkeit</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Neue Leads heute</div>
              <div className="stat-value">{newToday.length}</div>
              <div className="stat-helper">Heute neu angelegt</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Hohe Priorität</div>
              <div className="stat-value">{highPriorityCount}</div>
              <div className="stat-helper">Direkt relevante Leads</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Pipeline-Wert</div>
              <div className="stat-value stat-value-money">
                {formatCurrency(pipelineValue)}
              </div>
              <div className="stat-helper">Summe aus Angebotssummen</div>
            </div>
          </section>

          <section className="dashboard-columns">
            <div className="dashboard-panel">
              <div className="dashboard-panel-head">
                <div>
                  <h2 className="dashboard-panel-title">Heute &amp; überfällig</h2>
                  <p className="dashboard-panel-subtitle">
                    Das sind die Leads, die du zuerst anfassen solltest.
                  </p>
                </div>
              </div>

              <div className="dashboard-list">
                {upcomingLeads.length === 0 ? (
                  <div className="dashboard-empty">
                    Keine fälligen Leads vorhanden.
                  </div>
                ) : (
                  upcomingLeads.map((lead) => {
                    const isOverdue =
                      lead.due_date &&
                      normalizeDateOnly(lead.due_date).getTime() < today.getTime();

                    const isToday =
                      lead.due_date &&
                      normalizeDateOnly(lead.due_date).getTime() === today.getTime();

                    return (
                      <Link
                        key={lead.id}
                        href={`/leads/${lead.id}`}
                        className="dashboard-list-item"
                      >
                        <div className="dashboard-list-main">
                          <div className="dashboard-list-title">
                            {lead.full_name}
                          </div>
                          <div className="dashboard-list-meta">
                            <span className={statusTone(lead.status)}>
                              {lead.status}
                            </span>
                            <span className={priorityTone(lead.priority)}>
                              {lead.priority}
                            </span>
                          </div>
                          <div className="dashboard-list-text">
                            {lead.next_step}
                          </div>
                        </div>

                        <div className="dashboard-list-side">
                          <div
                            className={`due-pill ${
                              isOverdue
                                ? "due-pill-red"
                                : isToday
                                ? "due-pill-amber"
                                : "due-pill-blue"
                            }`}
                          >
                            {isOverdue
                              ? "Überfällig"
                              : isToday
                              ? "Heute"
                              : formatDate(lead.due_date)}
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>

            <div className="dashboard-stack">
              <div className="dashboard-panel">
                <div className="dashboard-panel-head">
                  <div>
                    <h2 className="dashboard-panel-title">Stärkste Chancen</h2>
                    <p className="dashboard-panel-subtitle">
                      Priorität, Chance und Relevanz kombiniert.
                    </p>
                  </div>
                </div>

                <div className="dashboard-list compact">
                  {hottestLeads.length === 0 ? (
                    <div className="dashboard-empty">Keine Leads vorhanden.</div>
                  ) : (
                    hottestLeads.map((lead) => (
                      <Link
                        key={lead.id}
                        href={`/leads/${lead.id}`}
                        className="dashboard-list-item"
                      >
                        <div className="dashboard-list-main">
                          <div className="dashboard-list-title">
                            {lead.full_name}
                          </div>
                          <div className="dashboard-list-meta">
                            <span className={priorityTone(lead.priority)}>
                              {lead.priority}
                            </span>
                            <span className={statusTone(lead.status)}>
                              {lead.status}
                            </span>
                          </div>
                        </div>

                        <div className="dashboard-list-side">
                          <div className="dashboard-side-number">
                            {lead.win_chance ?? 0}%
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              <div className="dashboard-panel">
                <div className="dashboard-panel-head">
                  <div>
                    <h2 className="dashboard-panel-title">Neueste Leads</h2>
                    <p className="dashboard-panel-subtitle">
                      Die zuletzt angelegten Datensätze.
                    </p>
                  </div>
                </div>

                <div className="dashboard-list compact">
                  {latestLeads.length === 0 ? (
                    <div className="dashboard-empty">Keine Leads vorhanden.</div>
                  ) : (
                    latestLeads.map((lead) => (
                      <Link
                        key={lead.id}
                        href={`/leads/${lead.id}`}
                        className="dashboard-list-item"
                      >
                        <div className="dashboard-list-main">
                          <div className="dashboard-list-title">
                            {lead.full_name}
                          </div>
                          <div className="dashboard-list-text">
                            Erstellt: {formatDateTime(lead.created_at)}
                          </div>
                        </div>

                        <div className="dashboard-list-side">
                          <span className={statusTone(lead.status)}>
                            {lead.status}
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
