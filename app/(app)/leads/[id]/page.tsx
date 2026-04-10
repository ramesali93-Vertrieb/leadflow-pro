import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type Lead = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type LeadActivity = {
  id: string;
  lead_id: string;
  type?: string | null;
  activity_type?: string | null;
  note?: string | null;
  content?: string | null;
  description?: string | null;
  status_from?: string | null;
  status_to?: string | null;
  created_at: string | null;
  created_by?: string | null;
};

function getActivityLabel(activity: LeadActivity) {
  if (activity.activity_type) return activity.activity_type;
  if (activity.type) return activity.type;
  if (activity.status_from || activity.status_to) return "status_change";
  return "activity";
}

function getActivityTitle(activity: LeadActivity) {
  const label = getActivityLabel(activity);

  if (label === "status_change") {
    return `Status geändert: ${activity.status_from || "—"} → ${activity.status_to || "—"}`;
  }

  if (label === "call") return "Anruf";
  if (label === "note") return "Notiz";
  if (label === "email") return "E-Mail";

  return label;
}

function getActivityBody(activity: LeadActivity) {
  return activity.note || activity.content || activity.description || "Kein Inhalt vorhanden.";
}

function getStatusBadgeClass(status: string | null) {
  switch ((status || "").toLowerCase()) {
    case "new":
      return "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200";
    case "contacted":
      return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
    case "qualified":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
    case "lost":
      return "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200";
    case "won":
      return "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200";
    default:
      return "bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-200";
  }
}

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: lead, error: leadError }, { data: activities, error: activitiesError }] =
    await Promise.all([
      supabase
        .from("leads")
        .select("id, name, company, email, phone, status, notes, created_at, updated_at")
        .eq("id", id)
        .single<Lead>(),
      supabase
        .from("lead_activities")
        .select("*")
        .eq("lead_id", id)
        .order("created_at", { ascending: false }),
    ]);

  if (leadError || !lead) {
    notFound();
  }

  if (activitiesError) {
    throw new Error(`Fehler beim Laden der Aktivitäten: ${activitiesError.message}`);
  }

  return (
    <AppShell
      title="Lead-Detail"
      description="Einzelansicht des Leads mit Stammdaten und vollständiger Aktivitäts-Historie."
      actions={
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
        >
          Zurück zum Dashboard
        </Link>
      }
    >
      <div className="space-y-6">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
                {lead.name}
              </h2>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(
                    lead.status
                  )}`}
                >
                  {lead.status || "Kein Status"}
                </span>

                <span className="text-sm text-zinc-500">
                  Erstellt: {formatDateTime(lead.created_at)}
                </span>

                <span className="text-sm text-zinc-500">
                  Aktualisiert: {formatDateTime(lead.updated_at)}
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-3">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm xl:col-span-1">
            <h3 className="text-lg font-semibold text-zinc-900">Stammdaten</h3>

            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-zinc-500">Name</dt>
                <dd className="mt-1 font-medium text-zinc-900">{lead.name}</dd>
              </div>

              <div>
                <dt className="text-zinc-500">Firma</dt>
                <dd className="mt-1 text-zinc-900">{lead.company || "—"}</dd>
              </div>

              <div>
                <dt className="text-zinc-500">E-Mail</dt>
                <dd className="mt-1 text-zinc-900">{lead.email || "—"}</dd>
              </div>

              <div>
                <dt className="text-zinc-500">Telefon</dt>
                <dd className="mt-1 text-zinc-900">{lead.phone || "—"}</dd>
              </div>

              <div>
                <dt className="text-zinc-500">Status</dt>
                <dd className="mt-1 text-zinc-900">{lead.status || "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm xl:col-span-2">
            <h3 className="text-lg font-semibold text-zinc-900">Notizen</h3>

            <div className="mt-4 rounded-xl bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
              {lead.notes || "Noch keine Lead-Notizen vorhanden."}
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-zinc-900">Aktivitäts-Historie</h3>

              <div className="mt-4 space-y-4">
                {(activities as LeadActivity[] | null)?.length ? (
                  (activities as LeadActivity[]).map((activity) => (
                    <div
                      key={activity.id}
                      className="rounded-xl border border-zinc-200 p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">
                            {getActivityTitle(activity)}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-600">
                            {getActivityBody(activity)}
                          </p>
                        </div>

                        <div className="shrink-0 text-xs text-zinc-500">
                          {formatDateTime(activity.created_at)}
                        </div>
                      </div>

                      {activity.created_by ? (
                        <p className="mt-3 text-xs text-zinc-400">
                          Erstellt von: {activity.created_by}
                        </p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-500">
                    Noch keine Aktivitäten für diesen Lead vorhanden.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
