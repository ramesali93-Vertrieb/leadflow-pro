import Link from "next/link";
import { formatDateTime } from "@/lib/format";

export type LeadRow = {
  id: string;
  name: string;
  company: string | null;
  status: string | null;
  email: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type LeadsTableProps = {
  leads: LeadRow[];
};

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

export function LeadsTable({ leads }: LeadsTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500">
                Lead
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500">
                Firma
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500">
                Erstellt
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-500">
                Aktualisiert
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-zinc-500">
                Aktion
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100">
            {leads.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-sm text-zinc-500"
                >
                  Keine Leads vorhanden.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900">
                        {lead.name}
                      </p>
                      <p className="truncate text-sm text-zinc-500">
                        {lead.email || "Keine E-Mail"}
                      </p>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm text-zinc-700">
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

                  <td className="px-4 py-4 text-sm text-zinc-600">
                    {formatDateTime(lead.created_at)}
                  </td>

                  <td className="px-4 py-4 text-sm text-zinc-600">
                    {formatDateTime(lead.updated_at)}
                  </td>

                  <td className="px-4 py-4 text-right text-sm">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="font-medium text-zinc-900 underline underline-offset-4"
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
