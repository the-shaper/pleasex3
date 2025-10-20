import { NextRequest } from "next/server";
import { ConvexDataProvider } from "@/lib/data/convex";

const dataProvider = new ConvexDataProvider();

export async function POST(
  _req: NextRequest,
  { params }: { params: { ref: string } }
) {
  try {
    const result = await dataProvider.rejectTicket(params.ref);

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
