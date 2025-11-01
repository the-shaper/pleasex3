import { NextRequest } from "next/server";
import { ConvexDataProvider } from "@/lib/data/convex";

const dataProvider = new ConvexDataProvider();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Map the form data to the expected CreateTicketInput format
    const input = {
      creatorSlug: body.creatorSlug,
      queueKind: body.queue, // API uses "queue", Convex expects "queueKind"
      tipCents: body.priorityTipCents || 0,
      taskTitle: body.taskTitle || undefined,
      message: body.needText || undefined,
      // Add user contact fields
      name: body.name,
      email: body.email,
      phone: body.phone || undefined,
      location: body.location || undefined,
      social: body.social || undefined,
      attachments: body.attachments, // Already processed as array in SubmitClient
      consentEmail: body.consentEmail,
    };

    const result = await dataProvider.createTicket(input);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return new Response(JSON.stringify({ error: "Failed to create ticket" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
