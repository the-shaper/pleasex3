import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardRedirectPage() {
    const user = await currentUser();

    if (!user) {
        redirect("/");
    }

    const slug = user.username || user.primaryEmailAddress?.emailAddress;

    if (!slug) {
        redirect("/");
    }

    redirect(`/${slug}/dashboard`);
}
