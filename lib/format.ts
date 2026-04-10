export function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "—";

  const date = new Date(dateString);

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(dateString: string | null | undefined) {
  if (!dateString) return "—";

  const date = new Date(dateString);

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
