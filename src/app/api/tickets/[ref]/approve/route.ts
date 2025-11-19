import { NextRequest } from "next/server";
import { ConvexDataProvider } from "@/lib/data/convex";

const dataProvider = new ConvexDataProvider();

function extractRefFromUrl(url: string): string {
  const segments = new URL(url).pathname.split("/");
  // Expected: ['', 'api', 'tickets', '{ref}', 'approve']
  return segments[segments.length - 2] || "";
}

export async function POST(req: NextRequest) {
  try {
    const ref = extractRefFromUrl(req.url);
    if (!ref) {
      return new Response(JSON.stringify({ error: "Missing ticket ref" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await dataProvider.approveTicket(ref);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error approving ticket:", error);
    return new Response(JSON.stringify({ error: "Failed to approve ticket" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
