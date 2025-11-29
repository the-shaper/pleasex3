import { QueryCtx, MutationCtx } from "../_generated/server";

export async function requireCreatorOwnership(
    ctx: QueryCtx | MutationCtx,
    creatorSlug: string,
    options?: { throwIfNotFound?: boolean }
) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        if (options?.throwIfNotFound === false) {
            return null;
        }
        throw new Error("Unauthorized: You must be signed in");
    }

    const creator = await ctx.db
        .query("creators")
        .withIndex("by_slug", (q) => q.eq("slug", creatorSlug))
        .unique();

    if (!creator) {
        if (options?.throwIfNotFound === false) {
            return null;
        }
        throw new Error("Creator not found");
    }

    // If the creator record has a clerkUserId, enforce that it matches the logged-in user.
    if (creator.clerkUserId && creator.clerkUserId !== identity.subject) {
        throw new Error("Unauthorized: You do not own this dashboard");
    }

    return creator;
}
