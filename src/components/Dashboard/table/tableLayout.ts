export type TableVariant = "active" | "past" | "all";

export const getGridColumns = (variant: TableVariant | string) => {
    switch (variant) {
        case "past":
        case "all":
            // GENERAL, TICKET, QUEUE, TASK, FRIEND, TAGS, STATUS, TIP, REQUESTED ON, RESOLVED ON
            return "100px 100px 100px 200px 150px 120px 100px 100px 140px 140px";
        case "active":
        default:
            // GENERAL, TICKET, QUEUE, TASK, FRIEND, REQUESTED ON
            return "100px 100px 100px 1fr 1fr 140px";
    }
};
