import { error } from "@sveltejs/kit";
import { buildICS } from "$lib/calendar";

export const GET = async ({ params, locals, url }) => {
  const session = await locals.getSession();

  const { data: event } = await locals.supabase
    .from("events")
    .select(
      "id, name, slug, description, location, start_time, end_time, is_public, user_id",
    )
    .eq("slug", params.slug)
    .maybeSingle();

  if (!event) throw error(404, "Event not found");

  const isHost = !!session && session.user.id === event.user_id;
  if (!event.is_public && !isHost) throw error(403, "This event is private");

  const eventUrl = `${url.origin}/${event.slug}`;
  const ics = buildICS(event, { url: eventUrl });

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
      "Cache-Control": "no-store",
    },
  });
};
