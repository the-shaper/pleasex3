import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/server";
import { api } from "@convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL must be set to call Convex actions.");
}

const client = new ConvexHttpClient(convexUrl);

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const session = await client.mutation(
      api.payments.createCheckoutSession,
      payload
    );
    return NextResponse.json(session);
  } catch (error) {
    console.error("Failed to create checkout session", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

