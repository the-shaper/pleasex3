import { mutation } from "./_generated/server";

export default mutation(async (ctx) => {
    const queues = await ctx.db.query("queues").collect();
    let count = 0;
    for (const q of queues) {
        const doc = { ...q } as any;
        if (doc.etaMins !== undefined) {
            delete doc.etaMins;
            // Ensure we keep _id and _creationTime? replace takes the doc without system fields usually?
            // convex replace: "Replaces a document. The new document must include the _id field."
            // It preserves _creationTime automatically if not provided? Or we should not provide it?
            // Actually, replace expects the full document.

            // Let's just use the doc as is, minus etaMins.
            // We need to make sure we don't lose other fields.

            await ctx.db.replace(q._id, doc);
            count++;
        }
    }
    return `Replaced ${count} queues to remove etaMins`;
});
