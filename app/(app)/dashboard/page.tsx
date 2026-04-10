import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { LeadsTable } from "@/components/leads/leads-table";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { count: leadsCount, error: leadsCountError },
    { count: activitiesCount, error: activitiesCountError },
    { data: leads, error: leadsError },
  ] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase.from("lead_activities").select("*", { count: "exact", head: true }),
    supabase
      .from("leads")
      .select("id, name, company, status, email, created_at, updated_at")
      .order("updated_at", { ascending: false, nullsFirst: false }),
  ]);

  if (leadsCountError) {
    throw new Error(`Fehler beim Laden der Lead-Anzahl: ${leadsCountError.message}`);
  }

  if (activitiesCountError) {
    throw new Error(
      `Fehler beim Laden der Aktivitäts-Anzahl: ${activitiesCountError.message}`
    );
  }

  if (leadsError) {
    throw new Error(`Fehler beim Laden der Leads: ${leadsError.message}`);
  }

  return (
    <AppShell
      title="Dashboard"
      description="Zentrale Lead-Liste mit stabiler, serverseitiger Datenladung."
      actions={
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          Aktualisieren
        </Link>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Leads gesamt</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">
              {leadsCount ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Aktivitäten gesamt</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">
              {activitiesCount ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">Angemeldeter User</p>
            <p className="mt-3 truncate text-sm font-medium text-zinc-900">
              {user.email}
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Lead-Liste</h2>
              <p className="text-sm text-zinc-500">
                Dashboard und Detailseite sind jetzt klar getrennt.
              </p>
            </div>
          </div>

          <LeadsTable leads={leads ?? []} />
        </section>
      </div>
    </AppShell>
  );
}
