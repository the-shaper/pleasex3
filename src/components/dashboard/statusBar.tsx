import React from "react";

export interface StatusBarProps {
    /** Number of queued tasks */
    queuedTasks: number;
    /** Number of new requests */
    newRequests: number;
    /** User slug for the link */
    userSlug: string;
    /** Variant of the status bar */
    variant?: "dark" | "light";
    /** Whether the status bar should be clickable/linkable */
    clickable?: boolean;
    /** Additional CSS classes */
    className?: string;
}

/**
 * StatusBar component displays the creator's queue status with queued tasks and new requests.
 * 
 * @param queuedTasks - Number of queued tasks
 * @param newRequests - Number of new requests
 * @param userSlug - User slug for the dashboard link
 * @param variant - Visual variant: "dark" (dark background) or "light" (clear background)
 * @param clickable - Whether the status bar should be a clickable link (default: true)
 * @param className - Additional CSS classes
 */
export const StatusBar: React.FC<StatusBarProps> = ({
    queuedTasks,
    newRequests,
    userSlug,
    variant = "dark",
    clickable = true,
    className = "",
}) => {
    const variantClasses =
        variant === "dark"
            ? "text-bg text-xs bg-text border-text py-2 h-full"
            : "text-xs text-text-muted bg-transparent border-gray-subtle py-[5.6px]";

    const numberColors =
        variant === "dark"
            ? "text-coral"
            : "text-text-muted";

    const content = (
        <h6
            className={`uppercase tracking-widest px-4 border ${variantClasses}`}
        >
            You have{" "}
            <span className={`font-bold ${numberColors}`}>{queuedTasks}</span> queued{" "}
            {queuedTasks === 1 ? "task" : "tasks"} and{" "}
            <span className={`font-bold ${numberColors}`}>{newRequests}</span> new{" "}
            {newRequests === 1 ? "request" : "requests"}
        </h6>
    );

    if (clickable) {
        return (
            <a
                href={`/${userSlug}/dashboard`}
                className={`flex items-start justify-center ${className}`}
            >
                {content}
            </a>
        );
    }

    return (
        <div className={`flex items-start justify-center ${className}`}>
            {content}
        </div>
    );
};

export default StatusBar;
