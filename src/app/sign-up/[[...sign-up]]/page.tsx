"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { SignUp } from "@clerk/nextjs";
import { TosModal } from "@/components/general/tosModal";
import { PrivacyModal } from "@/components/general/privacyModal";

export default function SignUpPage() {
  const [isTosModalOpen, setIsTosModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // Intercept Clerk's terms of service and privacy policy link clicks to open our modals instead
  useEffect(() => {
    const handleLegalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if the clicked element is a terms/privacy link (Clerk uses various selectors)
      const link =
        target.closest('a[href*="terms"]') ||
        target.closest('a[href*="legal"]') ||
        target.closest('a[href*="privacy"]') ||
        (target.tagName === "A" &&
          (target.textContent?.toLowerCase().includes("terms") ||
            target.textContent?.toLowerCase().includes("privacy") ||
            target.getAttribute("href")?.includes("terms") ||
            target.getAttribute("href")?.includes("privacy")));

      if (link) {
        e.preventDefault();
        e.stopPropagation();

        // Determine which modal to open based on link content/href
        const linkText = target.textContent?.toLowerCase() || "";
        const linkHref = target.getAttribute("href") || "";

        if (linkText.includes("privacy") || linkHref.includes("privacy")) {
          setIsPrivacyModalOpen(true);
        } else {
          setIsTosModalOpen(true);
        }
        return false;
      }
    };

    // Use event delegation on the document to catch dynamically rendered links
    // Capture phase to catch before Clerk's handlers
    document.addEventListener("click", handleLegalClick, true);

    // Also observe DOM changes to catch links added after initial render
    const observer = new MutationObserver(() => {
      // Re-attach listeners if Clerk re-renders
      const legalLinks = document.querySelectorAll(
        'a[href*="terms"], a[href*="legal"], a[href*="privacy"]'
      );
      legalLinks.forEach((link) => {
        link.addEventListener(
          "click",
          (e) => {
            e.preventDefault();
            e.stopPropagation();

            const linkText = link.textContent?.toLowerCase() || "";
            const linkHref = link.getAttribute("href") || "";

            if (linkText.includes("privacy") || linkHref.includes("privacy")) {
              setIsPrivacyModalOpen(true);
            } else {
              setIsTosModalOpen(true);
            }
          },
          true
        );
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      document.removeEventListener("click", handleLegalClick, true);
      observer.disconnect();
    };
  }, []);

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
      <SignUp
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
      <TosModal
        isOpen={isTosModalOpen}
        onClose={() => setIsTosModalOpen(false)}
      />
      <PrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
    </div>
  );
}
