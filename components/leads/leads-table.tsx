import Link from "next/link";
import { formatDate, formatDateTime } from "../../lib/format";

export type LeadRow = {
  id: string;
  full_name: string;
  status: string;
  priority: string;
  next_step: string;
  due_date: string;
  created_at: string;
};

type LeadsTableProps = {
  leads: LeadRow[];
};

function getStatusBadgeClass(status: string) {
  switch (status.toLowerCase()) {
    case "neu":
    case "new":
      return "status-badge";
    case "kontaktiert":
    case "contacted":
      return "status-badge";
    case "qualifiziert":
    case "qualified":
      return "status-badge";
    case "gewonnen":
    case "won":
      return "status-badge";
    case "verloren":
    case "lost":
      return "status-badge";
    default:
      return "status-badge";
  }
}

export function LeadsTable({ leads }: LeadsTableProps) {
  return (
    <div className="card">
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Lead</th>
              <th>Status</th>
              <th>Priorität</th>
              <th>Nächster Schritt</th>
              <th>Fällig</th>
              <th>Erstellt</th>
              <th>Aktion</th>
            </tr>
          </thead>

          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  Keine Leads vorhanden.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.full_name}</td>

                  <td>
                    <span className={getStatusBadgeClass(lead.status)}>
                      {lead.status}
                    </span>
                  </td>

                  <td>{lead.priority}</td>

                  <td>{lead.next_step}</td>

                  <td>{formatDate(lead.due_date)}</td>

                  <td>{formatDateTime(lead.created_at)}</td>

                  <td>
                    <Link href={`/leads/${lead.id}`} className="table-action">
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
