const DEFAULT_LOCALE = "de-DE";
const DEFAULT_TIME_ZONE = "Europe/Berlin";

export function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "—";

  const date = new Date(dateString);

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    timeZone: DEFAULT_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(dateString: string | null | undefined) {
  if (!dateString) return "—";

  const date = new Date(dateString);

  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    timeZone: DEFAULT_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
