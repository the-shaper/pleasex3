import type { Metadata } from "next";
import type { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const name = slug || "User";
  return { title: `${name}'s Ticket Machine - PPP!` };
}

export default function CreatorLayout({ children }: LayoutProps) {
  return children;
}

