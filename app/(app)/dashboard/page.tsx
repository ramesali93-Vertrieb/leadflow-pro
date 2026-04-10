import { AppShell } from "../../../components/app/app-shell";
import { LeadsTable } from "../../../components/leads/leads-table";
import { createServerSupabaseClient } from "../../../lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();

  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, name, company, email, status, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error("Fehler beim Laden der Leads: " + error.message);
  }

  return (
    <AppShell
      title="Dashboard"
      description="Alle Leads in einer sauberen Übersicht"
    >
      <LeadsTable leads={leads ?? []} />
    </AppShell>
  );
}
