"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

type PosthogInitProps = {
  children: React.ReactNode;
};

export function PosthogInit({ children }: PosthogInitProps) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    try {
      console.info("[posthog] init start", {
        apiHost: "/ingest",
        uiHost: "https://us.posthog.com",
        env: process.env.NODE_ENV,
      });

      posthog.init(key, {
        api_host: "/ingest",
        ui_host: "https://us.posthog.com",
        defaults: "2025-05-24",
        capture_exceptions: true,
        debug: process.env.NODE_ENV === "development",
      });

      console.info("[posthog] init complete");
    } catch (error) {
      console.error("[posthog] init failed", error);
    }
  }, []);

  return children;
}
