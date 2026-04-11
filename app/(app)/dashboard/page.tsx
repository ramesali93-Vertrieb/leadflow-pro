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

  if (value.includes("neu")) {
    return "border border-white/10 bg-white/8 text-white/80";
  }

  if (value.includes("kontakt")) {
    return "border border-amber-300/20 bg-amber-400/10 text-amber-200";
  }

  if (value.includes("qual")) {
    return "border border-emerald-300/20 bg-emerald-400/10 text-emerald-200";
  }

  if (value.includes("gewonnen") || value.includes("won")) {
    return "border border-emerald-300/20 bg-emerald-400/10 text-emerald-200";
  }

  if (value.includes("verloren") || value.includes("lost")) {
    return "border border-rose-300/20 bg-rose-400/10 text-rose-200";
  }

  return "border border-white/10 bg-white/8 text-white/75";
}

function priorityTone(priority: string) {
  const value = priority.toLowerCase();

  if (value === "hoch") {
    return "border border-rose-300/20 bg-rose-400/10 text-rose-200";
  }

  if (value === "mittel") {
    return "border border-amber-300/20 bg-amber-400/10 text-amber-200";
  }

  if (value === "niedrig") {
    return "border border-sky-300/20 bg-sky-400/10 text-sky-200";
  }

  return "border border-white/10 bg-white/8 text-white/75";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function GlassBadge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium tracking-[0.02em] backdrop-blur-xl ${tone}`}
    >
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  helper,
  valueClassName = "",
}: {
  label: string;
  value: string | number;
  helper: string;
  valueClassName?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.05),transparent_55%)]" />
      <div className="relative">
        <div className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-white/45">
          {label}
        </div>
        <div
          className={`text-4xl font-semibold tracking-tight text-white ${valueClassName}`}
        >
          {value}
        </div>
        <div className="mt-2 max-w-[18rem] text-sm leading-6 text-white/50">
          {helper}
        </div>
      </div>
    </div>
  );
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
          <Link
            href="/leads"
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 bg-white/80 px-5 text-sm font-medium text-neutral-950 backdrop-blur-xl transition hover:scale-[1.02] hover:bg-white"
          >
            Zur Leadliste
          </Link>
        }
      >
        <div className="relative isolate overflow-hidden rounded-[36px] border border-white/8 bg-[#06081a] px-5 py-5 shadow-[0_20px_80px_rgba(0,0,0,0.45)] sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-sky-500/12 blur-3xl" />
            <div className="absolute right-0 top-10 h-80 w-80 rounded-full bg-violet-500/12 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-400/8 blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_18%,transparent_82%,rgba(255,255,255,0.03))]" />
          </div>

          <div className="relative z-10 space-y-8">
            <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.30),inset_0_1px_0_rgba(255,255,255,0.08)] lg:p-8">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent_45%)]" />

              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-3 inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-white/50 backdrop-blur-xl">
                    Leadflow Pro
                  </div>
                  <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                    Dashboard
                  </h1>
                  <p className="mt-3 max-w-xl text-[15px] leading-7 text-white/60">
                    Ein ruhiger, klarer Überblick über Prioritäten,
                    Fälligkeiten und Abschlusspotenzial.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.05] px-4 py-3 backdrop-blur-xl">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                      Heute
                    </div>
                    <div className="mt-1 text-lg font-medium text-white">
                      {dueToday.length}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/[0.05] px-4 py-3 backdrop-blur-xl">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                      Offen
                    </div>
                    <div className="mt-1 text-lg font-medium text-white">
                      {totalLeads}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/[0.05] px-4 py-3 backdrop-blur-xl col-span-2 sm:col-span-1">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                      Pipeline
                    </div>
                    <div className="mt-1 text-lg font-medium text-white">
                      {formatCurrency(pipelineValue)}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <StatCard
                label="Leads gesamt"
                value={totalLeads}
                helper="Alle aktuell verfügbaren Leads"
              />
              <StatCard
                label="Heute fällig"
                value={dueToday.length}
                helper="Leads mit Termin für heute"
              />
              <StatCard
                label="Überfällig"
                value={overdueLeads.length}
                helper="Brauchen sofort Aufmerksamkeit"
              />
              <StatCard
                label="Neue Leads heute"
                value={newToday.length}
                helper="Heute neu angelegt"
              />
              <StatCard
                label="Hohe Priorität"
                value={highPriorityCount}
                helper="Direkt relevante Leads"
              />
              <StatCard
                label="Pipeline-Wert"
                value={formatCurrency(pipelineValue)}
                helper="Summe aus Angebotssummen"
                valueClassName="text-[2rem] leading-tight"
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
              <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.30),inset_0_1px_0_rgba(255,255,255,0.08)] lg:p-6">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_30%)]" />

                <div className="relative">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight text-white">
                        Heute &amp; überfällig
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-white/55">
                        Das sind die Leads, die du zuerst anfassen solltest.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {upcomingLeads.length === 0 ? (
                      <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-6 text-sm text-white/55 backdrop-blur-xl">
                        Keine fälligen Leads vorhanden.
                      </div>
                    ) : (
                      upcomingLeads.map((lead) => {
                        const isOverdue =
                          lead.due_date &&
                          normalizeDateOnly(lead.due_date).getTime() <
                            today.getTime();

                        const isToday =
                          lead.due_date &&
                          normalizeDateOnly(lead.due_date).getTime() ===
                            today.getTime();

                        const dueTone = isOverdue
                          ? "border-rose-300/20 bg-rose-400/10 text-rose-200"
                          : isToday
                          ? "border-amber-300/20 bg-amber-400/10 text-amber-200"
                          : "border-sky-300/20 bg-sky-400/10 text-sky-200";

                        return (
                          <Link
                            key={lead.id}
                            href={`/leads/${lead.id}`}
                            className="group flex items-start justify-between gap-4 rounded-[28px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.07] hover:shadow-[0_12px_35px_rgba(0,0,0,0.22)]"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-lg font-medium text-white">
                                {lead.full_name}
                              </div>

                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <GlassBadge tone={statusTone(lead.status)}>
                                  {lead.status}
                                </GlassBadge>
                                <GlassBadge tone={priorityTone(lead.priority)}>
                                  {lead.priority}
                                </GlassBadge>
                              </div>

                              <div className="mt-4 text-sm leading-6 text-white/58">
                                {lead.next_step}
                              </div>
                            </div>

                            <div className="shrink-0">
                              <GlassBadge tone={`backdrop-blur-xl ${dueTone}`}>
                                {isOverdue
                                  ? "Überfällig"
                                  : isToday
                                  ? "Heute"
                                  : formatDate(lead.due_date)}
                              </GlassBadge>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.30),inset_0_1px_0_rgba(255,255,255,0.08)] lg:p-6">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_30%)]" />

                  <div className="relative">
                    <div className="mb-5">
                      <h2 className="text-2xl font-semibold tracking-tight text-white">
                        Stärkste Chancen
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-white/55">
                        Priorität, Chance und Relevanz kombiniert.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {hottestLeads.length === 0 ? (
                        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-6 text-sm text-white/55 backdrop-blur-xl">
                          Keine Leads vorhanden.
                        </div>
                      ) : (
                        hottestLeads.map((lead) => (
                          <Link
                            key={lead.id}
                            href={`/leads/${lead.id}`}
                            className="group flex items-center justify-between gap-4 rounded-[26px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.07]"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-lg font-medium text-white">
                                {lead.full_name}
                              </div>

                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <GlassBadge tone={priorityTone(lead.priority)}>
                                  {lead.priority}
                                </GlassBadge>
                                <GlassBadge tone={statusTone(lead.status)}>
                                  {lead.status}
                                </GlassBadge>
                              </div>
                            </div>

                            <div className="shrink-0 text-right">
                              <div className="text-3xl font-semibold tracking-tight text-white">
                                {lead.win_chance ?? 0}%
                              </div>
                              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/35">
                                Chance
                              </div>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-2xl shadow-[0_10px_40px_rgba(0,0,0,0.30),inset_0_1px_0_rgba(255,255,255,0.08)] lg:p-6">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_30%)]" />

                  <div className="relative">
                    <div className="mb-5">
                      <h2 className="text-2xl font-semibold tracking-tight text-white">
                        Neueste Leads
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-white/55">
                        Die zuletzt angelegten Datensätze.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {latestLeads.length === 0 ? (
                        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-6 text-sm text-white/55 backdrop-blur-xl">
                          Keine Leads vorhanden.
                        </div>
                      ) : (
                        latestLeads.map((lead) => (
                          <Link
                            key={lead.id}
                            href={`/leads/${lead.id}`}
                            className="group flex items-center justify-between gap-4 rounded-[26px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.07]"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-lg font-medium text-white">
                                {lead.full_name}
                              </div>
                              <div className="mt-3 text-sm leading-6 text-white/55">
                                Erstellt: {formatDateTime(lead.created_at)}
                              </div>
                            </div>

                            <div className="shrink-0">
                              <GlassBadge tone={statusTone(lead.status)}>
                                {lead.status}
                              </GlassBadge>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
