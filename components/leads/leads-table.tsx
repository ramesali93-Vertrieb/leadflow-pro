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

export function LeadsTable({ leads }: LeadsTableProps) {
  return (
    <div className="card">
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Lead</th>
              <th>Status</th>
              <th>Erstellt</th>
              <th>Aktion</th>
            </tr>
          </thead>

          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-state">
                  Keine Leads vorhanden.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.name || "Ohne Namen"}</td>

                  <td>
                    <span className="status-badge">
                      {lead.status || "Kein Status"}
                    </span>
                  </td>

                  <td>{formatDateTime(lead.created_at)}</td>

                  <td>
                    <Link
                      href={`/leads/${lead.id}`}
                      className="table-action"
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
