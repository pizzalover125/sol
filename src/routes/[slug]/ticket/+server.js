import { error } from "@sveltejs/kit";
import { generateTicketPDF } from "$lib/server/ticket.js";

export const GET = async ({ params, locals, url }) => {
  const session = await locals.getSession();
  if (!session) throw error(401, "Not signed in");

  const { data: event } = await locals.supabase
    .from("events")
    .select("id, slug")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!event) throw error(404, "Event not found");

  const { data: registration } = await locals.supabase
    .from("registrations")
    .select("id")
    .eq("event_id", event.id)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!registration) throw error(403, "Not registered");

  const ticketUrl = `${url.origin}/${event.slug}/check-in?ticket=${registration.id}`;

  const pdfBytes = await generateTicketPDF({ ticketUrl });

  return new Response(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ticket-${event.slug}.pdf"`,
      "Content-Length": pdfBytes.length.toString(),
    },
  });
};
