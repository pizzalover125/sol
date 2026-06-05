function pad(n) {
  return String(n).padStart(2, "0");
}

export function toICSDate(value) {
  const d = new Date(value);
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escapeICSText(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function foldICSLine(line) {
  if (line.length <= 75) return line;
  const chunks = [];
  let i = 0;
  while (i < line.length) {
    if (i === 0) {
      chunks.push(line.slice(0, 75));
      i = 75;
    } else {
      chunks.push(" " + line.slice(i, i + 74));
      i += 74;
    }
  }
  return chunks.join("\r\n");
}

export function buildICS(event, { url, domain = "sol.events" } = {}) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//sol//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id ?? event.slug}@${domain}`,
    `DTSTAMP:${toICSDate(Date.now())}`,
    `DTSTART:${toICSDate(event.start_time)}`,
    `DTEND:${toICSDate(event.end_time)}`,
    `SUMMARY:${escapeICSText(event.name)}`,
  ];
  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICSText(event.description)}`);
  }
  if (event.location) lines.push(`LOCATION:${escapeICSText(event.location)}`);
  if (url) lines.push(`URL:${escapeICSText(url)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.map(foldICSLine).join("\r\n");
}

function detailsWithLink(event, url) {
  const desc = event.description ?? "";
  if (!url) return desc;
  return desc ? `${desc}\n\n${url}` : url;
}

export function googleCalendarUrl(event, url) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.name ?? "",
    dates: `${toICSDate(event.start_time)}/${toICSDate(event.end_time)}`,
  });
  const details = detailsWithLink(event, url);
  if (details) params.set("details", details);
  if (event.location) params.set("location", event.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
