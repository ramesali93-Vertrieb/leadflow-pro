import { AuthGuard } from "../../../components/app/auth-guard";
import { AppShell } from "../../../components/app/app-shell";
import { LeadsListClient } from "../../../components/leads/leads-list-client";
import { createServerSupabaseClient } from "../../../lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export type LeadListItem = {
  id: string;
  full_name: string;
  status: string;
  priority: string;
  next_step: string;
  due_date: string | null;
  created_at: string;
};

export default async function LeadsPage() {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("leads")
    .select("id, full_name, status, priority, next_step, due_date, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Fehler beim Laden der Leads: " + error.message);
  }

  const leads = (data ?? []) as LeadListItem[];

  return (
    <AuthGuard>
      <AppShell
        title="Leads"
        description="Arbeitsliste für deinen Vertrieb – mit Suche und Filtern."
      >
        <LeadsListClient leads={leads} />
      </AppShell>
    </AuthGuard>
  );
}
