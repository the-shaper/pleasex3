"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { api } from "@convex/_generated/api";
import { useMemo } from "react";

export function ConvexProviderWrapper({ children }: { children: React.ReactNode }) {
  const convex = useMemo(
    () => new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!),
    []
  );

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
