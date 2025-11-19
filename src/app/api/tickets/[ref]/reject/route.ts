import { NextRequest } from "next/server";
import { ConvexDataProvider } from "@/lib/data/convex";

const dataProvider = new ConvexDataProvider();

function extractRefFromUrl(url: string): string {
  const segments = new URL(url).pathname.split("/");
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

    const result = await dataProvider.rejectTicket(ref);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error rejecting ticket:", error);
    return new Response(JSON.stringify({ error: "Failed to reject ticket" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
