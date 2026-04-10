import { AppShell } from "../../../components/app/app-shell";
import { LeadsTable } from "../../../components/leads/leads-table";
import { createServerSupabaseClient } from "../../../lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();

  const { data: leads, error } = await supabase
    .from("leads")
    .select("id")
    .limit(50);

  if (error) {
    throw new Error("Fehler beim Laden der Leads: " + error.message);
  }

  const normalizedLeads = (leads ?? []).map((lead, index) => ({
    id: lead.id,
    name: `Lead ${index + 1}`,
    company: null,
    email: null,
    status: null,
    created_at: null,
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
