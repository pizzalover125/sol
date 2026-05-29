import { redirect, fail } from "@sveltejs/kit";
import { generateSlug } from "$lib/slug";

export const load = async ({ locals }) => {
  const session = await locals.getSession();
  if (!session) throw redirect(303, "/login");

  const { data: events } = await locals.supabase
    .from("events")
    .select("*")
    .order("start_time", { ascending: true });

  return { events: events ?? [], session };
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

    // Generate a unique slug, retry if collision
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
      })
      .eq("id", form.get("id"));

    if (error) return fail(500, { error: error.message });
  },

  delete: async ({ request, locals }) => {
    const form = await request.formData();
    await locals.supabase.from("events").delete().eq("id", form.get("id"));
  },
};
