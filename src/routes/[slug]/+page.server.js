import { error, redirect, fail } from "@sveltejs/kit";
import { collectAnswers } from "$lib/formFields";

export const load = async ({ params, locals, cookies }) => {
  const session = await locals.getSession();

  const { data: event } = await locals.supabase
    .from("events")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!event) throw error(404, "Event not found");
  if (!event.is_public) throw error(403, "This event is private");

  if (event.user_id) {
    const { data: profile } = await locals.supabase
      .from("profiles")
      .select("*")
      .eq("id", event.user_id)
      .maybeSingle();
    event.profile = profile;
  }

  const { count: attendeeCount } = await locals.supabase
    .from("registrations")
    .select("*", { count: "exact", head: true })
    .eq("event_id", event.id);

  let isRegistered = false;
  if (session) {
    const { data: r } = await locals.supabase
      .from("registrations")
      .select("id")
      .eq("event_id", event.id)
      .eq("user_id", session.user.id)
      .maybeSingle();
    isRegistered = !!r;
  }

  const guestRegistered = !session && !!cookies.get(`rsvp_${event.id}`);

  const isHost = !!session && session.user.id === event.user_id;

  let viewer = null;
  if (session) {
    const { data: vp } = await locals.supabase
      .from("profiles")
      .select("first_name, last_name, avatar_url")
      .eq("id", session.user.id)
      .maybeSingle();
    viewer = vp;
  }

  return {
    event,
    attendeeCount: attendeeCount ?? 0,
    isRegistered,
    guestRegistered,
    isSignedIn: !!session,
    isHost,
    viewer,
  };
};

export const actions = {
  register: async ({ params, locals, request, cookies }) => {
    const session = await locals.getSession();
    const form = await request.formData();

    const { data: event } = await locals.supabase
      .from("events")
      .select(
        "id, is_public, registration_open, max_attendees, user_id, registration_questions",
      )
      .eq("slug", params.slug)
      .maybeSingle();
    if (!event) return fail(404, { error: "Event not found" });
    if (!event.is_public) return fail(403, { error: "Event is private" });
    if (!event.registration_open) {
      return fail(400, { error: "Registration is closed" });
    }
    if (session && event.user_id === session.user.id) {
      return fail(400, { error: "Hosts cannot register for their own event" });
    }

    if (event.max_attendees) {
      const { count } = await locals.supabase
        .from("registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", event.id);
      if ((count ?? 0) >= event.max_attendees) {
        return fail(400, { error: "Event is full" });
      }
    }

    const questions = event.registration_questions ?? [];
    const { answers, error: answerErr } = collectAnswers(questions, form);
    if (answerErr) return fail(400, { error: answerErr });

    let row;
    if (session) {
      row = { event_id: event.id, user_id: session.user.id };
    } else {
      const first_name = (form.get("first_name") ?? "").toString().trim();
      const last_name = (form.get("last_name") ?? "").toString().trim();
      const email = (form.get("email") ?? "").toString().trim().toLowerCase();
      if (!first_name || !last_name || !email) {
        return fail(400, {
          error: "First name, last name, and email are required",
        });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return fail(400, { error: "Invalid email" });
      }
      row = {
        event_id: event.id,
        user_id: null,
        first_name,
        last_name,
        email,
      };
    }

    row.answers = answers;

    const { error: err } = await locals.supabase
      .from("registrations")
      .insert(row);

    if (err) {
      if (err.code === "23505") {
        return fail(400, { error: "You're already registered for this event" });
      }
      return fail(500, { error: err.message });
    }

    if (!session) {
      cookies.set(`rsvp_${event.id}`, "1", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
  },

  unregister: async ({ params, locals }) => {
    const session = await locals.getSession();
    if (!session) throw redirect(303, "/login");

    const { data: event } = await locals.supabase
      .from("events")
      .select("id")
      .eq("slug", params.slug)
      .maybeSingle();
    if (!event) return fail(404, { error: "Event not found" });

    await locals.supabase
      .from("registrations")
      .delete()
      .eq("event_id", event.id)
      .eq("user_id", session.user.id);
  },
};
