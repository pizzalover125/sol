import { error, fail } from "@sveltejs/kit";

export const load = async ({ params, locals, url }) => {
  const session = await locals.getSession();
  if (!session) throw error(401, "Not signed in");

  const { data: event } = await locals.supabase
    .from("events")
    .select("id, name, slug, user_id")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!event) throw error(404, "Event not found");
  if (event.user_id !== session.user.id)
    throw error(403, "Only the event host can check in attendees");

  const { data: registrations } = await locals.supabase
    .from("registrations")
    .select(
      "id, user_id, first_name, last_name, email, created_at, checked_in, checked_in_at",
    )
    .eq("event_id", event.id)
    .order("created_at", { ascending: true });

  const userIds = [
    ...new Set((registrations ?? []).map((r) => r.user_id).filter(Boolean)),
  ];
  let profilesById = {};
  if (userIds.length) {
    const { data: profs } = await locals.supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url")
      .in("id", userIds);
    profilesById = Object.fromEntries((profs ?? []).map((p) => [p.id, p]));
  }

  const attendees = (registrations ?? []).map((r) => ({
    ...r,
    profile: profilesById[r.user_id] ?? null,
  }));

  let checkedIn = null;
  let checkInError = null;
  const ticketId = url.searchParams.get("ticket");
  if (ticketId) {
    const { data: reg } = await locals.supabase
      .from("registrations")
      .select("id, checked_in")
      .eq("id", ticketId)
      .eq("event_id", event.id)
      .maybeSingle();

    if (!reg) {
      checkInError = "Invalid ticket";
    } else if (reg.checked_in) {
      checkedIn = reg;
      checkInError = "already_checked_in";
    } else {
      const { error: updErr } = await locals.supabase
        .from("registrations")
        .update({ checked_in: true, checked_in_at: new Date().toISOString() })
        .eq("id", ticketId);

      if (updErr) {
        checkInError = "Failed to check in";
      } else {
        checkedIn = reg;
      }
    }
  }

  return {
    event,
    attendees,
    checkedIn,
    checkedInError,
  };
};

export const actions = {
  check_in: async ({ params, locals, request }) => {
    const session = await locals.getSession();
    if (!session) return fail(401, { error: "Not signed in" });

    const form = await request.formData();
    const ticketId = form.get("ticket_id")?.toString().trim();
    if (!ticketId) return fail(400, { error: "Missing ticket ID" });

    const { data: event } = await locals.supabase
      .from("events")
      .select("id, user_id")
      .eq("slug", params.slug)
      .maybeSingle();

    if (!event) return fail(404, { error: "Event not found" });
    if (event.user_id !== session.user.id)
      return fail(403, { error: "Forbidden" });

    const { data: reg } = await locals.supabase
      .from("registrations")
      .select("id, checked_in")
      .eq("id", ticketId)
      .eq("event_id", event.id)
      .maybeSingle();

    if (!reg) return fail(404, { error: "Registration not found" });
    if (reg.checked_in) return fail(400, { error: "Already checked in" });

    const { error: updErr } = await locals.supabase
      .from("registrations")
      .update({ checked_in: true, checked_in_at: new Date().toISOString() })
      .eq("id", ticketId);

    if (updErr) return fail(500, { error: updErr.message });

    return { success: true };
  },
};
