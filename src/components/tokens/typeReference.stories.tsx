import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TypeReference } from "./typeReference";

const meta = {
    title: "Tokens/TypeReference",
    component: TypeReference,
    parameters: {
        layout: "padded",
        docs: {
            description: {
                component:
                    "A comprehensive typography reference showcasing the design system's type hierarchy. Includes titles, body text, meta labels, and interactive elements built on Space Mono.",
            },
        },
    },
    tags: ["autodocs"],
    argTypes: {
        variant: {
            control: { type: "select" },
            options: ["compact", "expanded"],
            description: "Display mode for the reference",
        },
        categories: {
            control: { type: "check" },
            options: ["titles", "body", "meta", "interactions"],
            description: "Categories to display",
        },
        showCode: {
            control: { type: "boolean" },
            description: "Show Tailwind class snippets",
        },
    },
} satisfies Meta<typeof TypeReference>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─────────────────────────────────────────────────────────────────────────────
// STORIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The complete typography reference with all categories and code snippets visible.
 * This is the default view for design system documentation.
 */
export const Complete: Story = {
    args: {
        variant: "expanded",
        categories: ["titles", "body", "meta", "interactions"],
        showCode: true,
    },
};

/**
 * Focused view showing only title typography.
 * Use for reviewing heading hierarchy.
 */
export const TitlesOnly: Story = {
    args: {
        variant: "expanded",
        categories: ["titles"],
        showCode: true,
    },
};

/**
 * Focused view showing only body typography.
 * Use for reviewing paragraph and content text styles.
 */
export const BodyOnly: Story = {
    args: {
        variant: "expanded",
        categories: ["body"],
        showCode: true,
    },
};

/**
 * Focused view showing only meta typography.
 * Includes labels, captions, and numeric displays.
 */
export const MetaOnly: Story = {
    args: {
        variant: "expanded",
        categories: ["meta"],
        showCode: true,
    },
};

/**
 * Focused view showing only interactive typography.
 * Buttons, links, and action-oriented text styles.
 */
export const InteractionsOnly: Story = {
    args: {
        variant: "expanded",
        categories: ["interactions"],
        showCode: true,
    },
};

/**
 * Compact single-column layout.
 * Useful for side panels or narrower viewports.
 */
export const Compact: Story = {
    args: {
        variant: "compact",
        categories: ["titles", "body", "meta", "interactions"],
        showCode: true,
    },
};

/**
 * Clean presentation without code snippets.
 * Ideal for non-developer stakeholders reviewing the type system.
 */
export const NoCode: Story = {
    args: {
        variant: "expanded",
        categories: ["titles", "body", "meta", "interactions"],
        showCode: false,
    },
};

/**
 * Minimal view with just titles and body text.
 * Core reading experience typography.
 */
export const ContentTypography: Story = {
    args: {
        variant: "expanded",
        categories: ["titles", "body"],
        showCode: true,
    },
};

/**
 * UI-focused typography showing meta and interactions.
 * For reviewing interface text patterns.
 */
export const UITypography: Story = {
    args: {
        variant: "expanded",
        categories: ["meta", "interactions"],
        showCode: true,
    },
};
