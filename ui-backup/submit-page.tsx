// Server component wrapper for RU-2 submit page
import SubmitClient from "../src/app/demo/submit/SubmitClient";

export default async function SubmitPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/creators/${slug}/queue`,
    { next: { revalidate: 5 } }
  );
  const initialQueue = res.ok ? await res.json() : null;
  return <SubmitClient slug={slug} initialQueue={initialQueue} />;
}
