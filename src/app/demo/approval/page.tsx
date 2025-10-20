"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DemoApprovalPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard where approval functionality is now integrated
    router.replace("/demo/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-bg py-8 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4 text-text">
          Redirecting to Dashboard...
        </h1>
        <p className="text-gray-600">
          Approval functionality has been integrated into the main dashboard.
        </p>
      </div>
    </div>
  );
}
