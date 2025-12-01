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

                            <div className="bg-[url(/tickets-px3.png)] bg-contain bg-no-repeat bg-center p-8 md:p-12 flex items-center justify-center min-h-[200px] mb-6">
                            </div>

                            <div className="space-y-4 font-mono text-sm text-text leading-relaxed">
                                <p>
                                    A tiny system –by and for freelancers– that protects your
                                    time from the "quick favors" that pile up.
                                </p>

                                <p>
                                    Friends can submit requests through your link, see where they
                                    stand, and wait or choose to pay to accelerate delivery.
                                </p>

                                <p>
                                    You get to control your time. They get what they need. Everybody wins.
                                </p>

                            </div>

                            <div className="flex flex-col gap-3 mt-8">
                                <ButtonBase
                                    variant="neutral"
                                    className="w-full bg-greenlite hover:bg-greenlite/90 hover:font-bold"
                                    href="/sign-up"
                                >
                                    SIGN UP TO DO FAVORS
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

                                <p>After many years of freelancing, I’ve noticed a constant: there’s always a favor on my to-do list. Many a times, half of my “pending work” is unpaid. Maybe that’s an acute case of people-pleasing. Maybe it’s friendship. But the effect is the same: my creative life gets crowded out.</p>

                                <p>A friend needs to clean up a logo “real quick.” Someone else wants "a quick fix" to their site. Another wants consulting for a project they’ll monetize. Their urgency becomes your urgency, but here’s the thing: most “urgent” things are only urgent enough to ask a friend, yet rarely urgent enough to hire someone.</p>

                                <p>And that reveals a contradiction: there's a lot of talk about “supporting your local businesses,” but it is often assumed that service-providing friends—those whose product is their time and knowledge—don't have to pay a price for their time and knowledge. Physical goods are allowed to have a cost. Time and expertise somehow aren’t, despite time being the most valuable resource we have.</p>

                                <p>And we all love being useful to our friends and community. But what happens when their capacity to ask exceeds your capacity to deliver? And what’s worse; saying no upfront, or disappointing someone you said yes to but can’t actually help?</p>

                                <p>So PLEASE PLEASE PLEASE! aims to solve that problem. You get control of your time, your friends get a clear picture of your capacity to deliver and become aware of the value of your time, while we all benefit from it.</p>

                                <p> The "social experiment" part is because I genuinenly don't know if this tool will be successful in the sense that it will encourage people to pay for your time, or to even bother to go through the steps needed to request a ticket from you. It will be interesting to see the usage metrics and how the tool evolves.
                                </p>

                                <p>The thing is, even if the app happens to discourage people from asking you for favors, you win by having one less item in your to-do list.</p>

                                <p> Thank you for participating!</p>

                                <p><a className="text-text hover:text-text/80 transition-colors cursor-pointer" href="https://twilightfringe.com" target="_blank">— Alejandro via TWILIGHT FRINGE </a></p>

                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
