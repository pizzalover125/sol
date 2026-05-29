import { error } from "@sveltejs/kit";

export const load = async ({ params, locals }) => {
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

  return { event };
};
