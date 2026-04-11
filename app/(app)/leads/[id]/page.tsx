import Link from "next/link";
import { notFound } from "next/navigation";
import { CSSProperties } from "react";
import { AuthGuard } from "../../../../components/app/auth-guard";
import { AppShell } from "../../../../components/app/app-shell";
import { AddActivityForm } from "../../../../components/leads/add-activity-form";
import { formatDate, formatDateTime } from "../../../../lib/format";
import { createServerSupabaseClient } from "../../../../lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: {
    id: string;
  };
};

type Lead = {
  id: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  salutation: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  postal_code: string | null;
  street: string | null;
  address: string | null;
  status: string;
  priority: string;
  next_step: string;
  due_date: string;
  base_note: string | null;
  source: string | null;
  project_start: string | null;
  roof_type: string | null;
  storage_interest: string | null;
  financing: string | null;
  offer_amount: number;
  win_chance: number;
  owner_id: string | null;
  created_by: string | null;
  last_activity_type: string | null;
  last_activity_at: string | null;
  last_activity_by: string | null;
  created_at: string;
  updated_at: string;
};

type LeadActivity = {
  id: string;
  lead_id: string;
  user_id: string;
  activity_type: string;
  body: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

type Profile = {
  id: string;
  name: string;
};

function formatActivityType(activityType: string) {
  switch (activityType) {
    case "note":
      return "Notiz";
    case "call":
      return "Anruf";
    case "email":
      return "E-Mail";
    case "followup":
      return "Follow-up";
    case "offer":
      return "Angebot";
    case "status_change":
      return "Statusänderung";
    case "import":
      return "Import";
    case "system":
      return "System";
    default:
      return activityType;
  }
}

function buildAddress(lead: Lead) {
  if (lead.address) return lead.address;

  const parts = [lead.street, [lead.postal_code, lead.city].filter(Boolean).join(" ")].filter(
    Boolean
  );

  return parts.length > 0 ? parts.join(", ") : "—";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value ?? 0);
}

function getProfileName(profileMap: Map<string, string>, id: string | null) {
  if (!id) return "—";
  return profileMap.get(id) ?? id;
}

const pageGridStyle: CSSProperties = {
  display: "grid",
  gap: "24px",
};

const topCardsGridStyle: CSSProperties = {
  display: "grid",
  gap: "24px",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  alignItems: "start",
};

const cardStyle: CSSProperties = {
  padding: "24px",
};

const sectionTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "20px",
  fontSize: "clamp(28px, 4vw, 38px)",
  lineHeight: 1.05,
  letterSpacing: "-0.04em",
};

const infoGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "18px 24px",
};

const stackedGridStyle: CSSProperties = {
  display: "grid",
  gap: "18px",
};

const fieldStyle: CSSProperties = {
  minWidth: 0,
};

const fieldLabelStyle: CSSProperties = {
  display: "block",
  marginBottom: "6px",
  fontSize: "14px",
  fontWeight: 700,
  lineHeight: 1.3,
};

const fieldValueStyle: CSSProperties = {
  fontSize: "clamp(16px, 2.2vw, 18px)",
  lineHeight: 1.45,
  color: "inherit",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const noteTextStyle: CSSProperties = {
  whiteSpace: "pre-wrap",
  lineHeight: 1.7,
  fontSize: "16px",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const historyListStyle: CSSProperties = {
  display: "grid",
  gap: "16px",
};

const historyItemStyle: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "18px",
  padding: "16px",
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
};

const historyHeadStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
  marginBottom: "10px",
  flexWrap: "wrap",
};

const historyMetaStyle: CSSProperties = {
  color: "rgba(255,255,255,0.56)",
  fontSize: "14px",
  lineHeight: 1.4,
};

const historyBodyStyle: CSSProperties = {
  marginBottom: "10px",
  whiteSpace: "pre-wrap",
  lineHeight: 1.7,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

const metadataPreStyle: CSSProperties = {
  marginTop: "12px",
  padding: "12px",
  borderRadius: "12px",
  background: "rgba(0,0,0,0.28)",
  color: "#d4d4d8",
  overflowX: "auto",
  fontSize: "12px",
  lineHeight: 1.5,
};

export default async function LeadDetailPage({ params }: PageProps) {
  const supabase = createServerSupabaseClient();
  const { id } = params;

  const [{ data: lead, error: leadError }, { data: activities, error: activitiesError }] =
    await Promise.all([
      supabase
        .from("leads")
        .select(
          `
            id,
            full_name,
            first_name,
            last_name,
            salutation,
            email,
            phone,
            city,
            postal_code,
            street,
            address,
            status,
            priority,
            next_step,
            due_date,
            base_note,
            source,
            project_start,
            roof_type,
            storage_interest,
            financing,
            offer_amount,
            win_chance,
            owner_id,
            created_by,
            last_activity_type,
            last_activity_at,
            last_activity_by,
            created_at,
            updated_at
          `
        )
        .eq("id", id)
        .single<Lead>(),
      supabase
        .from("lead_activities")
        .select("id, lead_id, user_id, activity_type, body, metadata, created_at")
        .eq("lead_id", id)
        .order("created_at", { ascending: false }),
    ]);

  if (leadError || !lead) {
    notFound();
  }

  if (activitiesError) {
    throw new Error("Fehler beim Laden der Aktivitäten: " + activitiesError.message);
  }

  const userIds = Array.from(
    new Set(
      [
        lead.owner_id,
        lead.created_by,
        lead.last_activity_by,
        ...(activities ?? []).map((activity) => activity.user_id),
      ].filter(Boolean)
    )
  ) as string[];

  let profileMap = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", userIds);

    if (profilesError) {
      throw new Error("Fehler beim Laden der Profile: " + profilesError.message);
    }

    profileMap = new Map((profiles as Profile[]).map((profile) => [profile.id, profile.name]));
  }

  const fallbackUserId = lead.owner_id || lead.created_by || "";

  return (
    <AuthGuard>
      <AppShell
        title={lead.full_name}
        description="Lead-Detailseite mit Stammdaten, Basisnotiz und Aktivitätshistorie"
        actions={
          <Link href="/dashboard" className="table-action">
            Zurück zum Dashboard
          </Link>
        }
      >
        <div style={pageGridStyle}>
          <div style={topCardsGridStyle}>
            <section className="card" style={cardStyle}>
              <h2 style={sectionTitleStyle}>Stammdaten</h2>

              <div style={infoGridStyle}>
                <div style={fieldStyle}>
                  <strong style={fieldLabelStyle}>Name</strong>
                  <div style={fieldValueStyle}>{lead.full_name}</div>
                </div>

                <div style={fieldStyle}>
                  <strong style={fieldLabelStyle}>Anrede</strong>
                  <div style={fieldValueStyle}>{lead.salutation || "—"}</div>
                </div>

                <div style={fieldStyle}>
                  <strong style={fieldLabelStyle}>E-Mail</strong>
                  <div style={fieldValueStyle}>{lead.email || "—"}</div>
                </div>

                <div style={fieldStyle}>
                  <strong style={fieldLabelStyle}>Telefon</strong>
                  <div style={fieldValueStyle}>{lead.phone || "—"}</div>
                </div>

                <div style={fieldStyle}>
                  <strong style={fieldLabelStyle}>Adresse</strong>
                  <div style={fieldValueStyle}>{buildAddress(lead)}</div>
                </div>

                <div style={fieldStyle}>
                  <strong style={fieldLabelStyle}>Quelle</strong>
                  <div style={fieldValueStyle}>{lead.source || "—"}</div>
                </div>

                <div style={fieldStyle}>
                  <strong style={fieldLabelStyle}>Status</strong>
                  <div style={fieldValueStyle}>{lead.status}</div>
                </div>

                <div style={fieldStyle}>
                  <strong style={fieldLabelStyle}>Priorität</strong>
                  <div style={fieldValueStyle}>{lead.priority}</div>
                </div>

                <div style={fieldStyle}>
                  <strong style={fieldLabelStyle}>Nächster Schritt</strong>
                  <div style={fieldValueStyle}>{lead.next_step}</div>
                </div>

                <div style={fieldStyle}>
                  <strong style={fieldLabelStyle}>Fällig</strong>
                  <div style={fieldValueStyle}>{formatDate(lead.due_date)}</div>
                </div>
              </div>
            </section>

            <section className="card" style={cardStyle}>
              <h2 style={sectionTitleStyle}>CRM-Daten</h2>

              <div style={stackedGridStyle}>
                <div style={fieldStyle}>
                  <strong style={fieldLabelStyle}>Angebot</strong>
                  <div style={fieldValueStyle}>{formatCurrency(lead.offer_amount)}</div>
                </div>

                <div style={fieldStyle}>
                  <strong style={fieldLabelStyle}>Abschlusschance</strong>
                  <div style={fieldValueStyle}>{lead.win_chance}%</div>
                </div>

                <div style={fieldStyle}>
                  <strong style={fieldLabelStyle}>Projektstart</strong>
                  <div style={fieldValueStyle}>{lead.project_start || "—"}</div>
                </div>

                <div style={fieldStyle}>
                  <strong style={fieldLabelStyle}>Dachtyp</strong>
                  <div style={fieldValueStyle}>{lead.roof_type || "—"}</div>
                </div>

                <div style={fieldStyle}>
                  <strong style={fieldLabelStyle}>Speicherinteresse</strong>
                  <div style={fieldValueStyle}>{lead.storage_interest || "—"}</div>
                </div>

                <div style={fieldStyle}>
                  <strong style={fieldLabelStyle}>Finanzierung</strong>
                  <div style={fieldValueStyle}>{lead.financing || "—"}</div>
                </div>

                <div style={fieldStyle}>
                  <strong style={fieldLabelStyle}>Owner</strong>
                  <div style={fieldValueStyle}>{getProfileName(profileMap, lead.owner_id)}</div>
                </div>

                <div style={fieldStyle}>
                  <strong style={fieldLabelStyle}>Erstellt von</strong>
                  <div style={fieldValueStyle}>{getProfileName(profileMap, lead.created_by)}</div>
                </div>

                <div style={fieldStyle}>
                  <strong style={fieldLabelStyle}>Letzte Aktivität</strong>
                  <div style={fieldValueStyle}>
                    {lead.last_activity_type
                      ? `${formatActivityType(lead.last_activity_type)} · ${formatDateTime(
                          lead.last_activity_at
                        )}`
                      : "—"}
                  </div>
                </div>

                <div style={fieldStyle}>
                  <strong style={fieldLabelStyle}>Zuletzt aktualisiert</strong>
                  <div style={fieldValueStyle}>{formatDateTime(lead.updated_at)}</div>
                </div>
              </div>
            </section>
          </div>

          <section className="card" style={cardStyle}>
            <h2 style={sectionTitleStyle}>Basisnotiz</h2>
            <div style={noteTextStyle}>
              {lead.base_note || "Keine Basisnotiz vorhanden."}
            </div>
          </section>

          <AddActivityForm leadId={lead.id} fallbackUserId={fallbackUserId} />

          <section className="card" style={cardStyle}>
            <h2 style={sectionTitleStyle}>Aktivitätshistorie</h2>

            {(activities ?? []).length === 0 ? (
              <div className="empty-state">Noch keine Aktivitäten vorhanden.</div>
            ) : (
              <div style={historyListStyle}>
                {(activities as LeadActivity[]).map((activity) => (
                  <div key={activity.id} style={historyItemStyle}>
                    <div style={historyHeadStyle}>
                      <strong>{formatActivityType(activity.activity_type)}</strong>
                      <span style={historyMetaStyle}>
                        {formatDateTime(activity.created_at)}
                      </span>
                    </div>

                    <div style={historyBodyStyle}>{activity.body}</div>

                    <div style={historyMetaStyle}>
                      Von: {getProfileName(profileMap, activity.user_id)}
                    </div>

                    {activity.metadata &&
                    typeof activity.metadata === "object" &&
                    Object.keys(activity.metadata).length > 0 ? (
                      <pre style={metadataPreStyle}>
                        {JSON.stringify(activity.metadata, null, 2)}
                      </pre>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
