import { redirect, fail } from "@sveltejs/kit";
import { generateSlug } from "$lib/slug";
import { normalizeQuestions } from "$lib/formFields";

export const load = async ({ locals }) => {
  const session = await locals.getSession();
  if (!session) {
    return {
      landing: true,
      events: [],
      attendeesByEvent: {},
      registeredEvents: [],
      profile: null,
      session: null,
    };
  }

  const userId = session.user.id;

  const { data: events } = await locals.supabase
    .from("events")
    .select("*")
    .eq("user_id", userId)
    .order("start_time", { ascending: true });

  const ownEventIds = (events ?? []).map((e) => e.id);

  let attendeesByEvent = {};
  if (ownEventIds.length) {
    const { data: regs } = await locals.supabase
      .from("registrations")
      .select(
        "id, event_id, user_id, created_at, first_name, last_name, email, answers, checked_in, checked_in_at",
      )
      .in("event_id", ownEventIds)
      .order("created_at", { ascending: true });

    const userIds = [
      ...new Set((regs ?? []).map((r) => r.user_id).filter(Boolean)),
    ];
    let profilesById = {};
    if (userIds.length) {
      const { data: profs } = await locals.supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url")
        .in("id", userIds);
      profilesById = Object.fromEntries((profs ?? []).map((p) => [p.id, p]));
    }
    for (const r of regs ?? []) {
      (attendeesByEvent[r.event_id] ??= []).push({
        ...r,
        profile: profilesById[r.user_id] ?? null,
      });
    }
  }

  const { data: myRegs } = await locals.supabase
    .from("registrations")
    .select("event_id, created_at")
    .eq("user_id", userId);

  const regEventIds = (myRegs ?? []).map((r) => r.event_id);
  let registeredEvents = [];
  if (regEventIds.length) {
    const { data: regEvents } = await locals.supabase
      .from("events")
      .select("*")
      .in("id", regEventIds)
      .order("start_time", { ascending: true });
    registeredEvents = regEvents ?? [];
  }

  const { data: profile } = await locals.supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  return {
    events: events ?? [],
    attendeesByEvent,
    registeredEvents,
    profile,
    session,
  };
};

export const actions = {
  create: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!session) throw redirect(303, "/login");

    const form = await request.formData();
    const start_time = form.get("start_time");
    const end_time = form.get("end_time");

    if (new Date(end_time) <= new Date(start_time)) {
      return fail(400, { error: "End time must be after start time" });
    }

    let slug;
    let attempts = 0;
    while (attempts < 5) {
      slug = generateSlug();
      const { data: existing } = await locals.supabase
        .from("events")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!existing) break;
      attempts++;
    }

    const { error } = await locals.supabase.from("events").insert({
      user_id: session.user.id,
      name: form.get("name"),
      description: form.get("description"),
      location: form.get("location"),
      start_time,
      end_time,
      max_attendees: form.get("max_attendees")
        ? Number(form.get("max_attendees"))
        : null,
      is_public: form.get("is_public") === "on",
      cover_image_url: form.get("cover_image_url") || null,
      background_color: form.get("background_color") || null,
      text_color: form.get("text_color") || null,
      accent_color: form.get("accent_color") || null,
      join_code: form.get("join_code")?.toString().trim() || null,
      registration_questions: normalizeQuestions(
        form.get("registration_questions"),
      ),
      slug,
    });

    if (error) return fail(500, { error: error.message });
  },

  update: async ({ request, locals }) => {
    const form = await request.formData();
    const start_time = form.get("start_time");
    const end_time = form.get("end_time");

    if (new Date(end_time) <= new Date(start_time)) {
      return fail(400, { error: "End time must be after start time" });
    }

    const { error } = await locals.supabase
      .from("events")
      .update({
        name: form.get("name"),
        description: form.get("description"),
        location: form.get("location"),
        start_time,
        end_time,
        max_attendees: form.get("max_attendees")
          ? Number(form.get("max_attendees"))
          : null,
        is_public: form.get("is_public") === "on",
        cover_image_url: form.get("cover_image_url") || null,
        background_color: form.get("background_color") || null,
        text_color: form.get("text_color") || null,
        accent_color: form.get("accent_color") || null,
        join_code: form.get("join_code")?.toString().trim() || null,
        registration_questions: normalizeQuestions(
          form.get("registration_questions"),
        ),
      })
      .eq("id", form.get("id"));

    if (error) return fail(500, { error: error.message });
  },

  delete: async ({ request, locals }) => {
    const form = await request.formData();
    await locals.supabase.from("events").delete().eq("id", form.get("id"));
  },

  toggle_registration: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!session) throw redirect(303, "/login");
    const form = await request.formData();
    const id = form.get("id");

    const { data: ev } = await locals.supabase
      .from("events")
      .select("registration_open, user_id")
      .eq("id", id)
      .maybeSingle();
    if (!ev || ev.user_id !== session.user.id) {
      return fail(403, { error: "Forbidden" });
    }

    const { error } = await locals.supabase
      .from("events")
      .update({ registration_open: !ev.registration_open })
      .eq("id", id);
    if (error) return fail(500, { error: error.message });
  },

  cancel_registration: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!session) throw redirect(303, "/login");
    const form = await request.formData();
    await locals.supabase
      .from("registrations")
      .delete()
      .eq("event_id", form.get("event_id"))
      .eq("user_id", session.user.id);
  },
};
