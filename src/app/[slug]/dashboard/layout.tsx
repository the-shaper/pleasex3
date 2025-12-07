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
  const name = slug || "PPP";
  return { title: `${name}'s Dashboard — PPP!` };
}

export default function DashboardLayout({ children }: LayoutProps) {
  return children;
}
