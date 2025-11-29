import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function GET() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/");
    }

    const user = await currentUser();
    const userSlug = user?.username || user?.emailAddresses[0]?.emailAddress;

    if (userSlug) {
        redirect(`/${userSlug}/dashboard`);
    }

    redirect("/");
}
