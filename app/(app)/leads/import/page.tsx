import Link from "next/link";
import { AuthGuard } from "../../../../components/app/auth-guard";
import { AppShell } from "../../../../components/app/app-shell";
import { LeadImportClient } from "../../../../components/leads/lead-import-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function LeadsImportPage() {
  return (
    <AuthGuard>
      <AppShell
        title="Lead Import"
        description="Füge Lead-Blöcke aus deinem Quellsystem ein, prüfe die Vorschau und importiere sie in dein CRM."
        actions={
          <Link href="/leads" className="table-action">
            Zurück zu Leads
          </Link>
        }
      >
        <LeadImportClient />
      </AppShell>
    </AuthGuard>
  );
}
