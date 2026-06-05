import { error } from "@sveltejs/kit";
import { formatAnswer } from "$lib/formFields";

function csvCell(value) {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(cells) {
  return cells.map(csvCell).join(",");
}

export const GET = async ({ params, locals }) => {
  const session = await locals.getSession();
  if (!session) throw error(401, "Not signed in");

  const { data: event } = await locals.supabase
    .from("events")
    .select("id, name, slug, user_id, registration_questions")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!event) throw error(404, "Event not found");
  if (event.user_id !== session.user.id) throw error(403, "Forbidden");

  const { data: regs } = await locals.supabase
    .from("registrations")
    .select("user_id, created_at, first_name, last_name, email, answers")
    .eq("event_id", event.id)
    .order("created_at", { ascending: true });

  const userIds = [
    ...new Set((regs ?? []).map((r) => r.user_id).filter(Boolean)),
  ];
  let profilesById = {};
  if (userIds.length) {
    const { data: profs } = await locals.supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", userIds);
    profilesById = Object.fromEntries((profs ?? []).map((p) => [p.id, p]));
  }

  const questions = event.registration_questions ?? [];
  const header = [
    "First Name",
    "Last Name",
    "Email",
    "Type",
    "Registered At",
    ...questions.map((q) => q.label),
  ];

  const lines = [csvRow(header)];
  for (const r of regs ?? []) {
    const profile = profilesById[r.user_id] ?? null;
    const firstName = profile?.first_name ?? r.first_name ?? "";
    const lastName = profile?.last_name ?? r.last_name ?? "";
    const ans = r.answers ?? {};
    lines.push(
      csvRow([
        firstName,
        lastName,
        r.email ?? "",
        r.user_id ? "member" : "guest",
        new Date(r.created_at).toISOString(),
        ...questions.map((q) => formatAnswer(ans[q.id])),
      ]),
    );
  }

  const csv = "﻿" + lines.join("\r\n");
  const filename = `${event.slug}-attendees.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
};
