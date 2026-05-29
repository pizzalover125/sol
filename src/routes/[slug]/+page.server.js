import { error } from "@sveltejs/kit";

export const load = async ({ params, locals }) => {
  const { data: event } = await locals.supabase
    .from("events")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!event) throw error(404, "Event not found");
  if (!event.is_public) throw error(403, "This event is private");

  return { event };
};
