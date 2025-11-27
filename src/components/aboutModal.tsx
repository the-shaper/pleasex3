"use client";

import { useState } from "react";
import { ButtonBase } from "./general/buttonBase";

type TabType = "what" | "why";

export interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
    className?: string;
}

export function AboutModal({ isOpen, onClose, className = "" }: AboutModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>("what");

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-text/50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className={`bg-bg border-2 border-text max-w-3xl w-full max-h-[90vh] flex flex-col ${className}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Tab Headers */}
                <div className="flex border-b-2 border-text">
                    <button
                        className={`flex-1 py-4 px-6 text-lg font-bold uppercase transition-colors ${activeTab === "what"
                            ? "bg-coral text-text"
                            : "bg-gray-subtle text-text hover:bg-pink"
                            }`}
                        onClick={() => setActiveTab("what")}
                    >
                        WHAT?
                    </button>
                    <button
                        className={`flex-1 py-4 px-6 text-lg font-bold uppercase transition-colors border-l-2 border-text ${activeTab === "why"
                            ? "bg-blue text-text"
                            : "bg-gray-subtle text-text hover:bg-blue-2"
                            }`}
                        onClick={() => setActiveTab("why")}
                    >
                        WHY?
                    </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-8 md:p-12 relative custom-scrollbar">
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-subtle hover:bg-text hover:text-bg transition-colors text-2xl leading-none"
                        aria-label="Close modal"
                    >
                        ×
                    </button>

                    {activeTab === "what" && (
                        <div className="space-y-6">
                            <h2 className="text-xl md:text-4xl font-bold text-text mb-8 tracking-tighter">
                                PLEASE PLEASE PLEASE?
                            </h2>

                            <div className="bg-gray-subtle p-8 md:p-12 flex items-center justify-center min-h-[200px] mb-6">
                                <p className="text-text uppercase text-sm">DIV PLACEHOLDER</p>
                            </div>

                            <div className="space-y-4 font-mono text-sm text-text leading-relaxed">
                                <p>
                                    A tiny system –by and for for freelancers– that protects your
                                    time from the "quick favors" that pile up.
                                </p>

                                <p>
                                    Friends can submit requests through your link, see where they
                                    stand, and choose to wait or pay to accelerate delivery.
                                </p>

                                <p>
                                    You get clarity. They get transparency. Everyone gets fewer
                                    misunderstandings.
                                </p>

                                <p>It's not about saying no–it's about making "yes" manageable.</p>
                            </div>

                            <div className="flex flex-col gap-3 mt-8">
                                <ButtonBase
                                    variant="primary"
                                    className="w-full bg-coral text-text hover:bg-coral/90"
                                >
                                    I WANT TO DO FAVORS
                                </ButtonBase>
                                <ButtonBase
                                    variant="default"
                                    className="w-full bg-ielo text-text hover:bg-ielo/90"
                                >
                                    THIS IS DUMB!
                                </ButtonBase>
                            </div>
                        </div>
                    )}

                    {activeTab === "why" && (
                        <div className="space-y-6">
                            <h2 className="text-5xl md:text-4xl font-bold text-text mb-8 tracking-tighter">
                                WHY WHY WHY?
                            </h2>

                            <div className="space-y-4 font-mono text-sm text-text leading-relaxed">
                                <p>
                                    This thing is part tool, part social experiment. I built it because I needed it, and I suspect other freelancers do too.
                                </p>

                                <p>After 15+ years of freelancing, I’ve noticed something constant: there’s always a favor on my to-do list. Often, half my “pending work” is unpaid. Maybe that’s people-pleasing. Maybe it’s friendship. But the effect is the same: my actual work gets crowded out.</p>

                                <p>A friend needs to clean up a logo “real quick.” Someone else wants me to “just look at” their site. Another wants consulting for a project they’ll monetize. Their urgency becomes your urgency, but here’s the thing: most of the “urgent” requests are only urgent enough to ask a friend, yet rarely urgent enough to hire someone.</p>

                                <p>And that reveals a contradiction: there's a lot of talk about “supporting your local businesses,” but it is often expected that service-providing friends—those whose product is their time and knowledge—give their time away for free. Physical goods are allowed to have a cost. Time and expertise somehow aren’t, despite time being the most valuable resource we have.</p>

                                <p>And I love being useful to my friends. But what happens when their capacity to ask exceeds your capacity to deliver? And what’s worse; saying no upfront, or disappointing someone you said yes to but can’t actually help?</p>

                                <p>So Please Please Please aims to solve that problem. You get control of your time, your friends get a clear picture of your capacity to deliver + awareness of the value of your time, and we all benefit from it.</p>

                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
