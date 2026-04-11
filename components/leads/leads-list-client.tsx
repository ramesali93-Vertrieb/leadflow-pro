"use client";

import Link from "next/link";
import { CSSProperties, useMemo, useState } from "react";
import { formatDate } from "../../lib/format";
import type { LeadListItem } from "../../app/(app)/leads/page";

type LeadsListClientProps = {
  leads: LeadListItem[];
};

type SortOption =
  | "newest"
  | "oldest"
  | "due_asc"
  | "name_asc"
  | "name_desc"
  | "priority_desc";

const pageStyle: CSSProperties = {
  display: "grid",
  gap: "20px",
};

const controlsCardStyle: CSSProperties = {
  padding: "20px",
};

const controlsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

const fieldWrapStyle: CSSProperties = {
  minWidth: 0,
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "8px",
  fontSize: "14px",
  fontWeight: 700,
  lineHeight: 1.4,
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "50px",
  padding: "0 14px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "#f4f4f5",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  outline: "none",
  fontSize: "16px",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
};

const infoRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  gap: "10px",
  fontSize: "14px",
  color: "rgba(255,255,255,0.58)",
};

const listStyle: CSSProperties = {
  display: "grid",
  gap: "16px",
};

const itemStyle: CSSProperties = {
  padding: "18px",
  borderRadius: "22px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
};

const itemTopStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  flexWrap: "wrap",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "20px",
  fontWeight: 700,
  lineHeight: 1.2,
  letterSpacing: "-0.03em",
};

const nextStepStyle: CSSProperties = {
  marginTop: "10px",
  fontSize: "15px",
  lineHeight: 1.6,
  color: "rgba(255,255,255,0.62)",
  overflowWrap: "anywhere",
};

const metaRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginTop: "14px",
};

const badgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: "32px",
  padding: "0 12px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 700,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  color: "#f4f4f5",
};

const emptyStyle: CSSProperties = {
  padding: "26px",
  borderRadius: "22px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "rgba(255,255,255,0.58)",
};

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function priorityWeight(priority: string) {
  const value = normalize(priority);
  if (value === "hoch") return 3;
  if (value === "mittel") return 2;
  if (value === "niedrig") return 1;
  return 0;
}

function dueDateWeight(value: string | null) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  return new Date(`${value}T00:00:00`).getTime();
}

function statusBadgeStyle(status: string): CSSProperties {
  const value = normalize(status);

  if (value.includes("neu")) {
    return {
      ...badgeStyle,
      background: "rgba(59, 130, 246, 0.10)",
      color: "#d8e9ff",
      borderColor: "rgba(59, 130, 246, 0.22)",
    };
  }

  if (value.includes("kontakt")) {
    return {
      ...badgeStyle,
      background: "rgba(245, 158, 11, 0.10)",
      color: "#ffe9b0",
      borderColor: "rgba(245, 158, 11, 0.20)",
    };
  }

  if (value.includes("qual") || value.includes("gewonnen") || value.includes("won")) {
    return {
      ...badgeStyle,
      background: "rgba(34, 197, 94, 0.10)",
      color: "#d6ffe2",
      borderColor: "rgba(34, 197, 94, 0.18)",
    };
  }

  if (value.includes("verloren") || value.includes("lost")) {
    return {
      ...badgeStyle,
      background: "rgba(239, 68, 68, 0.10)",
      color: "#ffd3d3",
      borderColor: "rgba(239, 68, 68, 0.18)",
    };
  }

  return badgeStyle;
}

function priorityBadgeStyle(priority: string): CSSProperties {
  const value = normalize(priority);

  if (value === "hoch") {
    return {
      ...badgeStyle,
      background: "rgba(239, 68, 68, 0.10)",
      color: "#ffd3d3",
      borderColor: "rgba(239, 68, 68, 0.18)",
    };
  }

  if (value === "mittel") {
    return {
      ...badgeStyle,
      background: "rgba(245, 158, 11, 0.10)",
      color: "#ffe9b0",
      borderColor: "rgba(245, 158, 11, 0.20)",
    };
  }

  if (value === "niedrig") {
    return {
      ...badgeStyle,
      background: "rgba(59, 130, 246, 0.10)",
      color: "#d8e9ff",
      borderColor: "rgba(59, 130, 246, 0.22)",
    };
  }

  return badgeStyle;
}

function sortLeads(leads: LeadListItem[], sortBy: SortOption) {
  const items = [...leads];

  items.sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }

    if (sortBy === "oldest") {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }

    if (sortBy === "due_asc") {
      return dueDateWeight(a.due_date) - dueDateWeight(b.due_date);
    }

    if (sortBy === "name_asc") {
      return a.full_name.localeCompare(b.full_name, "de");
    }

    if (sortBy === "name_desc") {
      return b.full_name.localeCompare(a.full_name, "de");
    }

    if (sortBy === "priority_desc") {
      const weightDiff = priorityWeight(b.priority) - priorityWeight(a.priority);
      if (weightDiff !== 0) return weightDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }

    return 0;
  });

  return items;
}

export function LeadsListClient({ leads }: LeadsListClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("alle");
  const [priorityFilter, setPriorityFilter] = useState("alle");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(leads.map((lead) => lead.status).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "de")
    );
  }, [leads]);

  const uniquePriorities = useMemo(() => {
    return Array.from(new Set(leads.map((lead) => lead.priority).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "de")
    );
  }, [leads]);

  const filteredLeads = useMemo(() => {
    const searchTerm = normalize(search);

    const filtered = leads.filter((lead) => {
      const matchesSearch =
        searchTerm.length === 0 ||
        normalize(lead.full_name).includes(searchTerm) ||
        normalize(lead.status).includes(searchTerm) ||
        normalize(lead.priority).includes(searchTerm) ||
        normalize(lead.next_step).includes(searchTerm);

      const matchesStatus =
        statusFilter === "alle" || normalize(lead.status) === normalize(statusFilter);

      const matchesPriority =
        priorityFilter === "alle" || normalize(lead.priority) === normalize(priorityFilter);

      return matchesSearch && matchesStatus && matchesPriority;
    });

    return sortLeads(filtered, sortBy);
  }, [leads, priorityFilter, search, sortBy, statusFilter]);

  return (
    <div style={pageStyle}>
      <section className="card" style={controlsCardStyle}>
        <div style={controlsGridStyle}>
          <div style={fieldWrapStyle}>
            <label htmlFor="lead-search" style={labelStyle}>
              Suche
            </label>
            <input
              id="lead-search"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nach Name, Status oder nächstem Schritt suchen"
              style={inputStyle}
            />
          </div>

          <div style={fieldWrapStyle}>
            <label htmlFor="lead-status-filter" style={labelStyle}>
              Status
            </label>
            <select
              id="lead-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              style={inputStyle}
            >
              <option value="alle">Alle Status</option>
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div style={fieldWrapStyle}>
            <label htmlFor="lead-priority-filter" style={labelStyle}>
              Priorität
            </label>
            <select
              id="lead-priority-filter"
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              style={inputStyle}
            >
              <option value="alle">Alle Prioritäten</option>
              {uniquePriorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>

          <div style={fieldWrapStyle}>
            <label htmlFor="lead-sort" style={labelStyle}>
              Sortierung
            </label>
            <select
              id="lead-sort"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              style={inputStyle}
            >
              <option value="newest">Neueste zuerst</option>
              <option value="oldest">Älteste zuerst</option>
              <option value="due_asc">Fällig zuerst</option>
              <option value="priority_desc">Priorität hoch zuerst</option>
              <option value="name_asc">Name A–Z</option>
              <option value="name_desc">Name Z–A</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: "16px" }}>
          <div style={infoRowStyle}>
            <span>{filteredLeads.length} Leads sichtbar</span>
            <span>{leads.length} insgesamt</span>
          </div>
        </div>
      </section>

      {filteredLeads.length === 0 ? (
        <div style={emptyStyle}>Keine Leads für diese Suche oder Filter gefunden.</div>
      ) : (
        <div style={listStyle}>
          {filteredLeads.map((lead) => (
            <Link
              key={lead.id}
              href={`/leads/${lead.id}`}
              style={{ textDecoration: "none" }}
            >
              <div style={itemStyle}>
                <div style={itemTopStyle}>
                  <h2 style={titleStyle}>{lead.full_name}</h2>
                  <div style={{ ...badgeStyle, whiteSpace: "nowrap" }}>
                    {lead.due_date ? formatDate(lead.due_date) : "Kein Datum"}
                  </div>
                </div>

                <div style={nextStepStyle}>
                  {lead.next_step || "Kein nächster Schritt hinterlegt."}
                </div>

                <div style={metaRowStyle}>
                  <span style={statusBadgeStyle(lead.status)}>{lead.status}</span>
                  <span style={priorityBadgeStyle(lead.priority)}>{lead.priority}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
