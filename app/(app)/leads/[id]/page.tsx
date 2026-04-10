import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "../../../../components/app/app-shell";
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

  return (
    <AppShell
      title={lead.full_name}
      description="Lead-Detailseite mit Stammdaten, Basisnotiz und Aktivitätshistorie"
      actions={
        <Link href="/dashboard" className="table-action">
          Zurück zum Dashboard
        </Link>
      }
    >
      <div
        style={{
          display: "grid",
          gap: "24px",
        }}
      >
        <div
          style={{
            display: "grid",
            gap: "24px",
            gridTemplateColumns: "1.2fr 0.8fr",
          }}
        >
          <section className="card" style={{ padding: "24px" }}>
            <h2 style={{ marginTop: 0 }}>Stammdaten</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "16px 24px",
              }}
            >
              <div>
                <strong>Name</strong>
                <div>{lead.full_name}</div>
              </div>

              <div>
                <strong>Anrede</strong>
                <div>{lead.salutation || "—"}</div>
              </div>

              <div>
                <strong>E-Mail</strong>
                <div>{lead.email || "—"}</div>
              </div>

              <div>
                <strong>Telefon</strong>
                <div>{lead.phone || "—"}</div>
              </div>

              <div>
                <strong>Adresse</strong>
                <div>{buildAddress(lead)}</div>
              </div>

              <div>
                <strong>Quelle</strong>
                <div>{lead.source || "—"}</div>
              </div>

              <div>
                <strong>Status</strong>
                <div>{lead.status}</div>
              </div>

              <div>
                <strong>Priorität</strong>
                <div>{lead.priority}</div>
              </div>

              <div>
                <strong>Nächster Schritt</strong>
                <div>{lead.next_step}</div>
              </div>

              <div>
                <strong>Fällig</strong>
                <div>{formatDate(lead.due_date)}</div>
              </div>
            </div>
          </section>

          <section className="card" style={{ padding: "24px" }}>
            <h2 style={{ marginTop: 0 }}>CRM-Daten</h2>

            <div
              style={{
                display: "grid",
                gap: "16px",
              }}
            >
              <div>
                <strong>Angebot</strong>
                <div>{formatCurrency(lead.offer_amount)}</div>
              </div>

              <div>
                <strong>Abschlusschance</strong>
                <div>{lead.win_chance}%</div>
              </div>

              <div>
                <strong>Projektstart</strong>
                <div>{lead.project_start || "—"}</div>
              </div>

              <div>
                <strong>Dachtyp</strong>
                <div>{lead.roof_type || "—"}</div>
              </div>

              <div>
                <strong>Speicherinteresse</strong>
                <div>{lead.storage_interest || "—"}</div>
              </div>

              <div>
                <strong>Finanzierung</strong>
                <div>{lead.financing || "—"}</div>
              </div>

              <div>
                <strong>Owner</strong>
                <div>{getProfileName(profileMap, lead.owner_id)}</div>
              </div>

              <div>
                <strong>Erstellt von</strong>
                <div>{getProfileName(profileMap, lead.created_by)}</div>
              </div>

              <div>
                <strong>Letzte Aktivität</strong>
                <div>
                  {lead.last_activity_type
                    ? `${formatActivityType(lead.last_activity_type)} · ${formatDateTime(
                        lead.last_activity_at
                      )}`
                    : "—"}
                </div>
              </div>

              <div>
                <strong>Zuletzt aktualisiert</strong>
                <div>{formatDateTime(lead.updated_at)}</div>
              </div>
            </div>
          </section>
        </div>

        <section className="card" style={{ padding: "24px" }}>
          <h2 style={{ marginTop: 0 }}>Basisnotiz</h2>
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
            {lead.base_note || "Keine Basisnotiz vorhanden."}
          </div>
        </section>

        <section className="card" style={{ padding: "24px" }}>
          <h2 style={{ marginTop: 0 }}>Aktivitätshistorie</h2>

          {(activities ?? []).length === 0 ? (
            <div className="empty-state">Noch keine Aktivitäten vorhanden.</div>
          ) : (
            <div style={{ display: "grid", gap: "16px" }}>
              {(activities as LeadActivity[]).map((activity) => (
                <div
                  key={activity.id}
                  style={{
                    border: "1px solid #27272a",
                    borderRadius: "14px",
                    padding: "16px",
                    background: "#111113",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "16px",
                      marginBottom: "8px",
                    }}
                  >
                    <strong>{formatActivityType(activity.activity_type)}</strong>
                    <span style={{ color: "#a1a1aa", fontSize: "14px" }}>
                      {formatDateTime(activity.created_at)}
                    </span>
                  </div>

                  <div style={{ marginBottom: "10px", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                    {activity.body}
                  </div>

                  <div style={{ color: "#a1a1aa", fontSize: "14px" }}>
                    Von: {getProfileName(profileMap, activity.user_id)}
                  </div>

                  {activity.metadata &&
                  typeof activity.metadata === "object" &&
                  Object.keys(activity.metadata).length > 0 ? (
                    <pre
                      style={{
                        marginTop: "12px",
                        padding: "12px",
                        borderRadius: "10px",
                        background: "#09090b",
                        color: "#d4d4d8",
                        overflowX: "auto",
                        fontSize: "12px",
                      }}
                    >
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
  );
}
