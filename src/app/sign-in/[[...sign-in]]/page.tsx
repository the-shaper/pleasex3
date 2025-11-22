"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg gap-8 py-10">
      <Image
        src="/px3-maintitle.svg"
        alt="Please Please Please"
        width={870}
        height={127}
        className="w-full max-w-[400px] h-auto px-4"
        priority
      />
      <SignIn
        afterSignInUrl={redirectUrl}
        signUpUrl="/sign-up"
        appearance={{
          variables: {
            borderRadius: "0",
            colorPrimary: "#ff5757",
            colorText: "#372525",
            colorBackground: "#e9f8ee",
            fontFamily: "var(--font-space-mono)",
          },
          elements: {
            card: "bg-bg shadow-none border border-gray-subtle",
            headerTitle: "text-coral",
            headerSubtitle: "text-text-muted",
            formButtonPrimary: "shadow-none",
            formFieldInput: "bg-white border-gray-subtle",
            footerActionLink: "text-coral hover:text-coral/90",
            identityPreviewEditButtonIcon: "text-coral",
            socialButtonsBlockButton: "bg-white border-gray-subtle shadow-none",
            socialButtonsBlockButtonText: "text-text font-mono",
            socialButtonsBlockButtonArrow: "text-coral",
          },
        }}
      />
    </div>
  );
}
