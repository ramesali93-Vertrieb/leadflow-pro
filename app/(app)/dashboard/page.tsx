import { AppShell } from "../../../components/app/app-shell";
import { LeadsTable } from "../../../components/leads/leads-table";
import { createServerSupabaseClient } from "../../../lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();

  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, name, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Fehler beim Laden der Leads: " + error.message);
  }

  const normalizedLeads = (leads ?? []).map((lead) => ({
    id: lead.id,
    name: lead.name ?? null,
    company: null,
    email: null,
    status: lead.status ?? null,
    created_at: lead.created_at ?? null,
    updated_at: null,
  }));

  return (
    <AppShell
      title="Dashboard"
      description="Alle Leads in einer sauberen Übersicht"
    >
      <LeadsTable leads={normalizedLeads} />
    </AppShell>
  );
}
