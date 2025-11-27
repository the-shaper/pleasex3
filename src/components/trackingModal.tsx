"use client";

import { useState } from "react";
import { ConvexDataProvider } from "@/lib/data/convex";
import TicketApprovalCreatorCard from "@/components/checkout/ticketApprovalCreatorCard";
import { ButtonBase } from "./general/buttonBase";
import type { Ticket } from "@/lib/types";

const dataProvider = new ConvexDataProvider();

// Helper functions from QueueCard
function formatEtaDays(etaDays: number | null | undefined): string {
    if (!etaDays || etaDays <= 0) return "—";
    if (etaDays < 1) return "<1 day";
    if (etaDays === 1) return "1 day";
    return `${etaDays} days`;
}

function formatEtaDate(etaDays: number | null | undefined): string {
    if (!etaDays || etaDays <= 0) return "—";
    const ms = etaDays * 24 * 60 * 60 * 1000;
    const d = new Date(Date.now() + ms);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    return `${mm}.${dd}.${yy}`;
}

export interface TrackingModalProps {
    isOpen: boolean;
    onClose: () => void;
    className?: string;
}

interface QueueData {
    etaDays: number | null;
    avgDaysPerTicket?: number;
    activeCount: number;
}

export function TrackingModal({ isOpen, onClose, className = "" }: TrackingModalProps) {
    const [trackingNumber, setTrackingNumber] = useState("");
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [queueData, setQueueData] = useState<QueueData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackingNumber.trim()) return;

        setLoading(true);
        setError(null);
        setTicket(null);
        setQueueData(null);

        try {
            const result = await dataProvider.getTicketByRef(trackingNumber.trim());
            if (result) {
                setTicket(result);

                // Fetch queue snapshot to get ETA information
                try {
                    const snapshot = await dataProvider.getQueueSnapshot(result.creatorSlug);
                    const queueKind = result.queueKind as "personal" | "priority";
                    const queueInfo = snapshot[queueKind];

                    setQueueData({
                        etaDays: queueInfo.etaDays ?? null,
                        avgDaysPerTicket: queueInfo.avgDaysPerTicket,
                        activeCount: queueInfo.activeCount || 0,
                    });
                } catch (queueErr) {
                    console.error("Error fetching queue data:", queueErr);
                    // Continue without queue data
                }
            } else {
                setError("Ticket not found. Please check your tracking number.");
            }
        } catch (err) {
            console.error("Error fetching ticket:", err);
            setError("An error occurred while searching. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Helper to format form data for the card
    const getFormData = (t: Ticket) => ({
        name: t.name || "Anonymous",
        email: t.email || "—",
        taskTitle: t.taskTitle,
        needText: t.message || "No description provided",
        attachments: t.attachments ? t.attachments.join(", ") : "",
        priorityTipCents: t.tipCents || 0,
    });

    // Reset state when modal closes
    const handleClose = () => {
        setTrackingNumber("");
        setTicket(null);
        setQueueData(null);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-text/50 flex items-center justify-center z-50 p-4"
            onClick={handleClose}
        >
            <div
                className={`bg-bg border-2 border-text max-w-3xl w-full max-h-[90vh] flex flex-col ${className}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex border-b-2 border-text bg-coral">
                    <div className="flex-1 py-4 px-6 text-lg font-bold uppercase">
                        TRACK YOUR FAVOR
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 md:p-12 relative custom-scrollbar">
                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-subtle hover:bg-text hover:text-bg transition-colors text-2xl leading-none"
                        aria-label="Close modal"
                    >
                        ×
                    </button>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-xl md:text-4xl font-bold text-text tracking-tighter">
                                TRACK YOUR FAVOR
                            </h2>
                            <p className="text-text-muted uppercase text-sm font-mono">
                                Enter your reference number below
                            </p>
                        </div>

                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="flex flex-col gap-2">
                                <input
                                    type="text"
                                    value={trackingNumber}
                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                    placeholder="REF-123456"
                                    className="w-full p-3 bg-white border border-gray-subtle text-text placeholder:text-text-muted focus:outline-none focus:border-coral uppercase font-mono"
                                    suppressHydrationWarning
                                />
                                <ButtonBase
                                    variant="primary"
                                    size="lg"
                                    type="submit"
                                    disabled={loading || !trackingNumber.trim()}
                                    className="w-full bg-coral text-text hover:bg-coral/90"
                                >
                                    {loading ? "SEARCHING..." : "TRACK FAVOR"}
                                </ButtonBase>
                            </div>
                        </form>

                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 text-center text-sm uppercase font-medium border border-red-100">
                                {error}
                            </div>
                        )}

                        {ticket && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* ETA Information Card - Only show for approved tickets */}
                                {ticket.status === "approved" && queueData && (
                                    <div className="bg-gray-subtle p-4 border border-text">
                                        <h3 className="text-sm font-bold text-text uppercase mb-3">
                                            Estimated Delivery
                                        </h3>
                                        <div className="flex gap-6 text-xs text-text" style={{ fontFamily: "var(--font-body)" }}>
                                            <div>
                                                <div className="font-bold">Average Time / Favor</div>
                                                <div>{formatEtaDays(queueData.avgDaysPerTicket)}</div>
                                            </div>
                                            <div>
                                                <div className="font-bold">Estimated Delivery</div>
                                                <div>{formatEtaDate(queueData.etaDays)}</div>
                                            </div>
                                            <div>
                                                <div className="font-bold">Queue Position</div>
                                                <div>#{ticket.queueNumber || "—"}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Ticket Details Card */}
                                <div className="flex justify-center">
                                    <TicketApprovalCreatorCard
                                        form={getFormData(ticket)}
                                        isPriority={ticket.queueKind === "priority"}
                                        activeQueue={{
                                            nextTurn: ticket.queueNumber || "—",
                                            activeCount: queueData?.activeCount || 0,
                                        }}
                                        tipDollarsInt={Math.floor((ticket.tipCents || 0) / 100)}
                                        minPriorityTipCents={0}
                                        formatEtaMins={() => "—"}
                                        onChange={() => { }}
                                        userName={ticket.name || "User"}
                                        referenceNumber={ticket.ref}
                                        approvedContext={ticket.status === "approved"}
                                        ticketNumber={ticket.queueNumber}
                                        hideOutOf={true}
                                        status={ticket.status}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
