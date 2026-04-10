import { AuthGuard } from "../../../components/app/auth-guard";
import { AppShell } from "../../../components/app/app-shell";
import { LeadsTable } from "../../../components/leads/leads-table";
import { createServerSupabaseClient } from "../../../lib/supabase-server";

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
};

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("leads")
    .select("id, full_name, status, priority, next_step, due_date, created_at")
    .order("due_date", { ascending: true })
    .limit(50);

  if (error) {
    throw new Error("Fehler beim Laden der Leads: " + error.message);
  }

  const leads = ((data ?? []) as DashboardLead[]).map((lead) => ({
    id: lead.id,
    full_name: lead.full_name,
    status: lead.status,
    priority: lead.priority,
    next_step: lead.next_step,
    due_date: lead.due_date,
    created_at: lead.created_at,
  }));

  return (
    <AuthGuard>
      <AppShell
        title="Dashboard"
        description="Lead-Übersicht mit echtem Datenbestand"
      >
        <LeadsTable leads={leads} />
      </AppShell>
    </AuthGuard>
  );
}
