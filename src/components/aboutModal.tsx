"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import { useMemo, useState, type ComponentProps } from "react";
import { ButtonBase } from "./general/buttonBase";

type TabType = "what" | "how" | "why";

const mergeClassName = (base: string, extra?: string) =>
  extra ? `${base} ${extra}` : base;

export interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function AboutModal({
  isOpen,
  onClose,
  className = "",
}: AboutModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("what");

  const markdownComponents = useMemo<Components>(
    () => ({
      h1: ({
        children,
        className: headingClass,
        ...props
      }: ComponentProps<"h1">) => (
        <h1
          {...props}
          className={mergeClassName(
            "text-3xl md:text-4xl font-bold text-text mb-6 tracking-tighter",
            headingClass
          )}
        >
          {children}
        </h1>
      ),
      h2: ({
        children,
        className: headingClass,
        ...props
      }: ComponentProps<"h2">) => (
        <h2
          {...props}
          className={mergeClassName(
            "text-2xl md:text-3xl font-bold text-text mt-6 mb-4 tracking-tight",
            headingClass
          )}
        >
          {children}
        </h2>
      ),
      h3: ({
        children,
        className: headingClass,
        ...props
      }: ComponentProps<"h3">) => (
        <h3
          {...props}
          className={mergeClassName(
            "text-xl md:text-2xl font-bold text-text mt-4 mb-3",
            headingClass
          )}
        >
          {children}
        </h3>
      ),
      p: ({
        children,
        className: paragraphClass,
        ...props
      }: ComponentProps<"p">) => (
        <p
          {...props}
          className={mergeClassName(
            "mb-4 font-mono text-sm text-text leading-relaxed",
            paragraphClass
          )}
        >
          {children}
        </p>
      ),
      strong: ({
        children,
        className: strongClass,
        ...props
      }: ComponentProps<"strong">) => (
        <strong
          {...props}
          className={mergeClassName("font-bold text-coral", strongClass)}
        >
          {children}
        </strong>
      ),
      a: ({
        children,
        className: linkClassName,
        ...props
      }: ComponentProps<"a">) => (
        <a
          {...props}
          className={mergeClassName(
            "text-blue hover:text-blue-2 underline",
            linkClassName
          )}
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      ),
    }),
    []
  );

  const whatContent = `# PLEASE PLEASE PLEASE?

![Tickets background](/tickets-px3.png)

A tiny system –by and for independent creatives– that protects your time from the "quick favors" that pile up.

Friends can submit requests through your link, see where they stand, and wait or choose to pay to accelerate delivery.

You get to control your time. They get what they need. Everybody wins.`;

  const howContent = `# HOW HOW HOW?

### HOW IT WORKS
1. **Sign up** and share your link to get friends in your queue.
2. **Connect Stripe** to enable tips.
3. **(Optional) Enable Priority queue** and set a minimum amount and delivery time.

### THE "CATCH" (fees and payouts)
- **Platform fee:** For every $50 of gross tips you collect in a calendar month, we keep $3.33. If you make less than $50 in a month, we take $0.
- **Stripe processing fee:** Charged on every captured tip; typically ~2.9% + $0.30 per card transaction (varies by country/payment method).
- **Examples:**
  - Friend tips $1 → Stripe takes about $0.33 → you have about $0.67 before our platform fee.
  - Friend tips $5 → Stripe takes about $0.45 → you have about $4.55 before our platform fee.
- **Payouts:** Sent monthly on a calendar schedule. Your payout is what’s left after Stripe processing fees and our platform fee for that month.

**Rationale:** This makes it explicit that Stripe fees are per transaction, our platform fee is monthly per $50 block of gross tips, and payouts are monthly.`;

  const whyContent = `# WHY WHY WHY?

This thing is part tool, part social experiment. I built it because I needed it, and I suspect other freelancers do too.

After many years of freelancing, I’ve noticed a constant: there’s always a favor on my to-do list. Many a times, half of my “pending work” is unpaid. Maybe that’s an acute case of people-pleasing. Maybe it’s friendship. But the effect is the same: my creative life gets crowded out.

A friend needs to clean up a logo “real quick.” Someone else wants "a quick fix" to their site. Another wants consulting for a project they’ll monetize. Their urgency becomes your urgency, but here’s the thing: most “urgent” things are only urgent enough to ask a friend, yet rarely urgent enough to hire someone.

And that reveals a contradiction: there's a lot of talk about “supporting your local businesses,” but it is often assumed that service-providing friends—those whose product is their time and knowledge—don't have to pay a price for their time and knowledge. Physical goods are allowed to have a cost. Time and expertise somehow aren’t, despite time being the most valuable resource we have.

And we all love being useful to our friends and community. But what happens when their capacity to ask exceeds your capacity to deliver? And what’s worse; saying no upfront, or disappointing someone you said yes to but can’t actually help?

So PLEASE PLEASE PLEASE! aims to solve that problem. You get control of your time, your friends get a clear picture of your capacity to deliver and become aware of the value of your time, while we all benefit from it.

The "social experiment" part is because I genuinenly don't know if this tool will be successful in the sense that it will encourage people to pay for your time, or to even bother to go through the steps needed to request a ticket from you. It will be interesting to see the usage metrics and how the tool evolves.

The thing is, even if the app happens to discourage people from asking you for favors, you win by having one less item in your to-do list.

Thank you for participating!

[— Alejandro via TWILIGHT FRINGE](https://twilightfringe.com)`;

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
        <div className="flex border-b-1 border-text-muted max-h-16 items-center">
          <button
            className={`w-3/10 py-4 px-6 text-lg font-bold uppercase transition-colors border-text-muted ${
              activeTab === "what"
                ? "bg-coral text-text"
                : "bg-gray-subtle text-text hover:bg-pink"
            }`}
            onClick={() => setActiveTab("what")}
          >
            WHAT?
          </button>
          <button
            className={`w-3/10 py-4 px-6 text-lg font-bold uppercase transition-colors border-l-1 border-text-muted ${
              activeTab === "how"
                ? "bg-purple text-text"
                : "bg-gray-subtle text-text hover:bg-purple"
            }`}
            onClick={() => setActiveTab("how")}
          >
            HOW?
          </button>
          <button
            className={`w-3/10 py-4 px-6 text-lg font-bold uppercase transition-colors border-l-1 border-text-muted ${
              activeTab === "why"
                ? "bg-blue text-text"
                : "bg-gray-subtle text-text hover:bg-blue-2"
            }`}
            onClick={() => setActiveTab("why")}
          >
            WHY?
          </button>
          <button
            className="flex-1 py-4 px-3 text-lg font-bold uppercase transition-colors border-l-1 border-text-muted bg-gray-subtle text-text hover:bg-text hover:text-bg max-h-16"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 relative custom-scrollbar">
          {activeTab === "what" && (
            <div className="space-y-6">
              <div className="markdown-body">
                <ReactMarkdown components={markdownComponents}>
                  {whatContent}
                </ReactMarkdown>
              </div>

              <div className="flex flex-col gap-3 mt-4">
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

          {activeTab === "how" && (
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
              <div className="markdown-body">
                <ReactMarkdown components={markdownComponents}>
                  {howContent}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {activeTab === "why" && (
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
              <div className="markdown-body">
                <ReactMarkdown components={markdownComponents}>
                  {whyContent}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
