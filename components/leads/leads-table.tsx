import Link from "next/link";
import { formatDateTime } from "../../lib/format";

export type LeadRow = {
  id: string;
  name: string | null;
  company: string | null;
  email: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type LeadsTableProps = {
  leads: LeadRow[];
};

function getStatusBadgeClass(status: string | null) {
  switch ((status || "").toLowerCase()) {
    case "new":
      return "bg-blue-500/10 text-blue-300 ring-1 ring-inset ring-blue-500/30";
    case "contacted":
      return "bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-500/30";
    case "qualified":
      return "bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-500/30";
    case "won":
      return "bg-green-500/10 text-green-300 ring-1 ring-inset ring-green-500/30";
    case "lost":
      return "bg-rose-500/10 text-rose-300 ring-1 ring-inset ring-rose-500/30";
    default:
      return "bg-zinc-800 text-zinc-300 ring-1 ring-inset ring-zinc-700";
  }
}

export function LeadsTable({ leads }: LeadsTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-950/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                Lead
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                Firma
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                Erstellt
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">
                Aktualisiert
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-zinc-400">
                Aktion
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800">
            {leads.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-sm text-zinc-400"
                >
                  Keine Leads vorhanden.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-zinc-800/40">
                  <td className="px-4 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {lead.name || "Ohne Namen"}
                      </p>
                      <p className="truncate text-sm text-zinc-400">
                        {lead.email || "Keine E-Mail"}
                      </p>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm text-zinc-300">
                    {lead.company || "—"}
                  </td>

                  <td className="px-4 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(
                        lead.status
                      )}`}
                    >
                      {lead.status || "Kein Status"}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-sm text-zinc-400">
                    {formatDateTime(lead.created_at)}
                  </td>

                  <td className="px-4 py-4 text-sm text-zinc-400">
                    {formatDateTime(lead.updated_at)}
                  </td>

                  <td className="px-4 py-4 text-right text-sm">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="font-medium text-white underline underline-offset-4"
                    >
                      Öffnen
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
