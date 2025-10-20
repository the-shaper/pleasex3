import { NextRequest } from "next/server";
import { ConvexDataProvider } from "@/lib/data/convex";

const dataProvider = new ConvexDataProvider();

export async function POST(
  _req: NextRequest,
  { params }: { params: { ref: string } }
) {
  try {
    const result = await dataProvider.approveTicket(params.ref);

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
