import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import StatusBar from "./statusBar";

const meta: Meta<typeof StatusBar> = {
    component: StatusBar,
    tags: ["autodocs"],
    parameters: {
        layout: "centered",
        docs: {
            description: {
                component: "Status bar used on homepage and dashboard. Displays queued tasks and new requests.",
            },
        },
    },
    argTypes: {
        queuedTasks: {
            control: { type: "number", min: 0, max: 100 },
            description: "Number of queued tasks",
        },
        newRequests: {
            control: { type: "number", min: 0, max: 100 },
            description: "Number of new requests",
        },
        userSlug: {
            control: { type: "text" },
            description: "User slug for the dashboard link",
        },
        variant: {
            control: { type: "radio" },
            options: ["dark", "light"],
            description: "Visual variant of the status bar",
        },
        clickable: {
            control: { type: "boolean" },
            description: "Whether the status bar should be a clickable link",
        },
        className: {
            control: { type: "text" },
            description: "Additional CSS classes",
        },
    },
};

export default meta;

type Story = StoryObj<typeof StatusBar>;

export const DarkVariant: Story = {
    args: {
        queuedTasks: 5,
        newRequests: 3,
        userSlug: "demo-user",
        variant: "dark",
    },
};

export const LightVariant: Story = {
    args: {
        queuedTasks: 5,
        newRequests: 3,
        userSlug: "demo-user",
        variant: "light",
    },
};

export const NoTasks: Story = {
    args: {
        queuedTasks: 0,
        newRequests: 0,
        userSlug: "demo-user",
        variant: "dark",
    },
};

export const SingleTask: Story = {
    args: {
        queuedTasks: 1,
        newRequests: 1,
        userSlug: "demo-user",
        variant: "dark",
    },
};

export const ManyTasks: Story = {
    args: {
        queuedTasks: 42,
        newRequests: 15,
        userSlug: "demo-user",
        variant: "dark",
    },
};

export const OnlyQueuedTasks: Story = {
    args: {
        queuedTasks: 8,
        newRequests: 0,
        userSlug: "demo-user",
        variant: "dark",
    },
};

export const OnlyNewRequests: Story = {
    args: {
        queuedTasks: 0,
        newRequests: 7,
        userSlug: "demo-user",
        variant: "dark",
    },
};

export const NonClickableDark: Story = {
    args: {
        queuedTasks: 5,
        newRequests: 3,
        userSlug: "demo-user",
        variant: "dark",
        clickable: false,
    },
};

export const NonClickableLight: Story = {
    args: {
        queuedTasks: 5,
        newRequests: 3,
        userSlug: "demo-user",
        variant: "light",
        clickable: false,
    },
};

// Comparison story showing both variants side by side
const VariantComparison = () => (
    <div className="flex flex-col gap-4 p-8 bg-bg">
        <div>
            <p className="text-text-muted text-sm mb-2">Dark Variant (Clickable):</p>
            <StatusBar
                queuedTasks={5}
                newRequests={3}
                userSlug="demo-user"
                variant="dark"
                clickable={true}
            />
        </div>
        <div>
            <p className="text-text-muted text-sm mb-2">Light Variant (Clickable):</p>
            <StatusBar
                queuedTasks={5}
                newRequests={3}
                userSlug="demo-user"
                variant="light"
                clickable={true}
            />
        </div>
        <div>
            <p className="text-text-muted text-sm mb-2">Dark Variant (Non-Clickable):</p>
            <StatusBar
                queuedTasks={5}
                newRequests={3}
                userSlug="demo-user"
                variant="dark"
                clickable={false}
            />
        </div>
        <div>
            <p className="text-text-muted text-sm mb-2">Light Variant (Non-Clickable):</p>
            <StatusBar
                queuedTasks={5}
                newRequests={3}
                userSlug="demo-user"
                variant="light"
                clickable={false}
            />
        </div>
    </div>
);

export const VariantComparison_Story: Story = {
    render: () => <VariantComparison />,
};
