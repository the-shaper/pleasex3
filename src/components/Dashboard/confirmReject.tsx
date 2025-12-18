"use client";

interface ConfirmRejectProps {
    isOpen: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    isSubmitting?: boolean;
    ticketRef: string;
}

export default function ConfirmReject({
    isOpen,
    onCancel,
    onConfirm,
    isSubmitting = false,
    ticketRef,
}: ConfirmRejectProps) {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape" && !isSubmitting) {
            onCancel();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={!isSubmitting ? onCancel : undefined}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-reject-title"
            aria-describedby="confirm-reject-description"
        >
            <div
                className="bg-bg max-w-md w-full p-6 transform transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                <h3
                    id="confirm-reject-title"
                    className="text-xl font-bold text-coral mb-2"
                >
                    Reject This Ticket?
                </h3>
                <p id="confirm-reject-description" className="text-text mb-6">
                    Are you sure you want to reject ticket{" "}
                    <strong className="font-mono">{ticketRef}</strong>? This action will
                    cancel or refund the payment and cannot be undone.
                </p>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-greenlite text-gray-700 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 uppercase disabled:cursor-not-allowed"
                    >
                        Keep Ticket
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-text text-coral font-medium hover:bg-red-700 hover:text-bg transition-colors flex items-center gap-2 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Rejecting...
                            </>
                        ) : (
                            "Yes, Reject Ticket"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
