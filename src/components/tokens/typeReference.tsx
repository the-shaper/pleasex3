"use client";

import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type TypographyCategory = "titles" | "body" | "meta" | "interactions";

export interface TypeSpecimen {
    name: string;
    element: string;
    className: string;
    sampleText?: string;
    description?: string;
    cssProperties?: Record<string, string>;
}

export interface TypeSectionProps {
    category: TypographyCategory;
    specimens: TypeSpecimen[];
    showCode?: boolean;
}

export interface TypeReferenceProps {
    /** Display as a compact single-column or expanded grid */
    variant?: "compact" | "expanded";
    /** Show only specific categories */
    categories?: TypographyCategory[];
    /** Show CSS/Tailwind code snippets */
    showCode?: boolean;
    className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT SPECIMENS - The design system's typography
// ─────────────────────────────────────────────────────────────────────────────

const titleSpecimens: TypeSpecimen[] = [
    {
        name: "Display XL",
        element: "h1",
        className: "text-4xl md:text-6xl font-mono tracking-tight font-bold uppercase",
        sampleText: "Please!",
        description: "Hero sections, major page titles",
        cssProperties: {
            fontSize: "clamp(3.75rem, 8vw, 6rem)",
            fontFamily: "var(--font-heading)",
            letterSpacing: "-0.025em",
        },
    },
    {
        name: "Display L",
        element: "h1",
        className: "text-3xl md:text-4xl font-mono uppercase font-bold",
        sampleText: "Headlines",
        description: "Page headers, section intros",
    },
    {
        name: "Heading",
        element: "h2",
        className: "text-2xl md:text-2xl font-mono uppercase font-bold",
        sampleText: "Section Title",
        description: "Major content sections",
    },
    {
        name: "Subheading",
        element: "h3",
        className: "text-xl md:text-xl font-mono uppercase font-bold",
        sampleText: "Card Headers",
        description: "Cards, modals, subsections",
    },
    {
        name: "Small Heading",
        element: "h4",
        className: "text-lg font-mono uppercase",
        sampleText: "Thin Headers",
        description: "UI component headers",
    },
];

const bodySpecimens: TypeSpecimen[] = [
    {
        name: "Body Large",
        element: "p",
        className: "text-lg font-mono leading-relaxed",
        sampleText:
            "The quick brown fox jumps over the lazy dog. This specimen showcases the readability of body text at larger sizes.",
        description: "Lead paragraphs, featured content",
    },
    {
        name: "Body Default",
        element: "p",
        className: "text-sm font-mono leading-normal",
        sampleText:
            "Standard body text for paragraphs and general content. Optimized for comfortable reading at typical viewport distances.",
        description: "Standard paragraphs, descriptions",
    },
    {
        name: "Body Small",
        element: "p",
        className: "text-xs font-mono leading-snug",
        sampleText:
            "Smaller body text for secondary information, captions, and supporting details.",
        description: "Secondary content, captions",
    },
    {
        name: "Body Tiny",
        element: "p",
        className: "text-xs font-mono",
        sampleText: "Fine print, legal text, footnotes",
        description: "Legal, footnotes, disclaimers",
    },
];

const metaSpecimens: TypeSpecimen[] = [
    {
        name: "Label",
        element: "span",
        className: "text-sm uppercase tracking-wider text-text-muted",
        sampleText: "FORM LABEL",
        description: "Form labels, field names",
    },
    {
        name: "Label Small",
        element: "span",
        className: "text-xs uppercase tracking-wider text-text-muted",
        sampleText: "META LABEL",
        description: "Status indicators, small labels",
    },
    {
        name: "Caption",
        element: "span",
        className: "text-[10px] uppercase tracking-widest text-text-muted",
        sampleText: "TICKET • 001",
        description: "Tags, badges, timestamps",
    },
    {
        name: "Mono Number",
        element: "span",
        className: "text-6xl font-mono text-coral tabular-nums",
        sampleText: "42",
        description: "Queue numbers, statistics",
    },
    {
        name: "Mono Number Small",
        element: "span",
        className: "text-xl font-mono text-text-muted tabular-nums",
        sampleText: "1,234",
        description: "Secondary numbers, counts",
    },
];

const interactionSpecimens: TypeSpecimen[] = [
    {
        name: "Button Primary",
        element: "button",
        className:
            "text-sm font-mono uppercase tracking-wide bg-coral text-text px-4 py-2 hover:opacity-90 transition-opacity",
        sampleText: "SUBMIT REQUEST",
        description: "Primary actions",
    },
    {
        name: "Button Secondary",
        element: "button",
        className:
            "text-sm font-mono uppercase tracking-wide bg-gray-subtle text-text px-4 py-2 hover:bg-text hover:text-bg transition-colors",
        sampleText: "CANCEL",
        description: "Secondary actions",
    },
    {
        name: "Link",
        element: "a",
        className:
            "text-sm font-mono underline underline-offset-4 text-text hover:text-coral transition-colors cursor-pointer",
        sampleText: "View Details →",
        description: "Inline links, navigation",
    },
    {
        name: "Link Muted",
        element: "a",
        className:
            "text-xs font-mono text-text-muted hover:text-text transition-colors cursor-pointer",
        sampleText: "terms of service",
        description: "Footer links, secondary navigation",
    },
    {
        name: "Tag",
        element: "span",
        className:
            "text-[10px] font-mono uppercase tracking-wider bg-gold text-text px-3 py-0.5",
        sampleText: "PRIORITY",
        description: "Status tags, category badges",
    },
];

const specimensByCategory: Record<TypographyCategory, TypeSpecimen[]> = {
    titles: titleSpecimens,
    body: bodySpecimens,
    meta: metaSpecimens,
    interactions: interactionSpecimens,
};

const categoryMeta: Record<
    TypographyCategory,
    { label: string; color: string; description: string }
> = {
    titles: {
        label: "Titles",
        color: "bg-coral",
        description: "Display and heading hierarchy for page structure",
    },
    body: {
        label: "Body",
        color: "bg-greenlite",
        description: "Readable text for content and paragraphs",
    },
    meta: {
        label: "Meta",
        color: "bg-purple",
        description: "Labels, captions, and supporting information",
    },
    interactions: {
        label: "Interactions",
        color: "bg-gold",
        description: "Buttons, links, and actionable elements",
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// SPECIMEN CARD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function SpecimenCard({
    specimen,
    showCode = true,
}: {
    specimen: TypeSpecimen;
    showCode?: boolean;
}) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            console.error("Failed to copy");
        }
    };

    return (
        <div className="group border border-gray-subtle bg-bg hover:border-text transition-colors">
            {/* Specimen Preview */}
            <div className="p-6 min-h-[120px] flex items-center justify-center bg-bg-pink/30">
                <div
                    className={specimen.className}
                    style={{ fontFamily: '"Space Mono", monospace' }}
                >
                    {specimen.sampleText}
                </div>
            </div>


            {/* Specimen Info */}
            <div className="p-4 border-t border-gray-subtle space-y-3">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <h4 className="text-sm font-mono font-semibold text-text">
                            {specimen.name}
                        </h4>
                        {specimen.description && (
                            <p className="text-xs text-text-muted mt-0.5">
                                {specimen.description}
                            </p>
                        )}
                    </div>
                    <span className="text-[10px] uppercase tracking-wider bg-gray-subtle text-text-muted px-2 py-0.5">
                        &lt;{specimen.element}&gt;
                    </span>
                </div>

                {showCode && (
                    <div className="pt-2 border-t border-gray-subtle">
                        <div className="flex items-center justify-between gap-2">
                            <code className="text-[10px] font-mono text-text-muted break-all flex-1">
                                {specimen.className}
                            </code>
                            <button
                                onClick={() => copyToClipboard(specimen.className)}
                                className="text-[10px] uppercase tracking-wider text-text-muted hover:text-coral transition-colors shrink-0"
                            >
                                {copied ? "Copied!" : "Copy"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPE SECTION COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function TypeSection({ category, specimens, showCode = true }: TypeSectionProps) {
    const meta = categoryMeta[category];

    return (
        <section className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center gap-4">
                <div className={`w-3 h-3 ${meta.color}`} />
                <div className="flex-1">
                    <h3 className="text-xl font-mono uppercase tracking-wider text-text">
                        {meta.label}
                    </h3>
                    <p className="text-sm text-text-muted">{meta.description}</p>
                </div>
            </div>

            {/* Specimens Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {specimens.map((specimen) => (
                    <SpecimenCard
                        key={specimen.name}
                        specimen={specimen}
                        showCode={showCode}
                    />
                ))}
            </div>
        </section>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN TYPE REFERENCE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function TypeReference({
    variant = "expanded",
    categories = ["titles", "body", "meta", "interactions"],
    showCode = true,
    className = "",
}: TypeReferenceProps) {
    const isCompact = variant === "compact";

    return (
        <div className={`${className}`}>
            {/* Header */}
            <div className="mb-8 pb-6 border-b border-gray-subtle">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] uppercase tracking-widest text-text-muted bg-gray-subtle px-2 py-0.5">
                        Design System
                    </span>
                    <span className="text-[10px] text-text-muted">•</span>
                    <span className="text-[10px] uppercase tracking-wider text-text-muted">
                        Space Mono
                    </span>
                </div>
                <h2
                    className="text-4xl md:text-5xl font-mono text-text"
                    style={{ fontFamily: '"Space Mono", monospace' }}
                >
                    Typography
                </h2>

                <p className="text-base text-text-muted mt-2 max-w-2xl">
                    A comprehensive type system built on Space Mono. Click any specimen
                    to copy its Tailwind classes.
                </p>
            </div>

            {/* Category Navigation */}
            <nav className="flex flex-wrap gap-2 mb-8">
                {categories.map((cat) => (
                    <a
                        key={cat}
                        href={`#type-${cat}`}
                        className={`text-xs font-mono uppercase tracking-wider px-3 py-1.5 transition-colors ${categoryMeta[cat].color} text-text hover:opacity-80`}
                    >
                        {categoryMeta[cat].label}
                    </a>
                ))}
            </nav>

            {/* Sections */}
            <div
                className={`space-y-12 ${isCompact ? "max-w-xl" : ""}`}
            >
                {categories.map((category) => (
                    <div key={category} id={`type-${category}`}>
                        <TypeSection
                            category={category}
                            specimens={specimensByCategory[category]}
                            showCode={showCode}
                        />
                    </div>
                ))}
            </div>

            {/* Footer */}
            <footer className="mt-12 pt-6 border-t border-gray-subtle">
                <p className="text-xs text-text-muted">
                    Font:{" "}
                    <a
                        href="https://fonts.google.com/specimen/Space+Mono"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-text"
                    >
                        Space Mono
                    </a>{" "}
                    by Colophon Foundry • Licensed under{" "}
                    <span className="text-text">SIL Open Font License 1.1</span>
                </p>
            </footer>
        </div>
    );
}

export default TypeReference;
