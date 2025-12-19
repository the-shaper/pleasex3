import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DashHeaderContent } from "./DashHeaderOG";

const meta: Meta<typeof DashHeaderContent> = {
  component: DashHeaderContent,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Basic dashboard header component",
      },
    },
  },
  argTypes: {
    title: {
      control: { type: "text" },
      description: "The main title displayed in the header",
    },
    username: {
      control: { type: "text" },
      description: "The username displayed below the title",
    },
    isAuthenticated: {
      control: { type: "boolean" },
      description: "Whether the user is signed in",
    },
    onMenuClick: { action: "menu-clicked" },
    onPublicPageClick: { action: "public-page-clicked" },
    onSignOutClick: { action: "sign-out-clicked" },
    onSignInClick: { action: "sign-in-clicked" },
    className: {
      control: { type: "text" },
      description: "Additional CSS classes",
    },
  },
};

export default meta;

type Story = StoryObj<typeof DashHeaderContent>;

export const DefaultSignedOut: Story = {
  args: {
    isAuthenticated: false,
    isLoading: false,
  },
};

export const SignedIn: Story = {
  args: {
    isAuthenticated: true,
    username: "demo_user",
    userSlug: "demo_user",
    isLoading: false,
    statusMetrics: { queuedTasks: 5, newRequests: 2 },
  },
};

export const CustomTitle: Story = {
  args: {
    ...SignedIn.args,
    title: "Custom Dashboard Title",
  },
};

export const Loading: Story = {
  args: {
    isAuthenticated: false,
    isLoading: true,
  },
};

// Story showing the component in a typical dashboard layout context
const DashboardLayoutExample = () => (
  <div className="bg-bg p-8 min-h-screen">
    <DashHeaderContent
      title="PLEASE PLEASE PLEASE"
      username="user"
      userSlug="user"
      isAuthenticated={true}
      isLoading={false}
      statusMetrics={{ queuedTasks: 12, newRequests: 3 }}
      onPublicPageClick={() => console.log("public page")}
      onSignOutClick={() => console.log("sign out")}
      onFaqClick={() => console.log("faq")}
    />
    <div className="mt-8">
      <p className="text-text-muted">Dashboard content would go here...</p>
    </div>
  </div>
);

export const InDashboardLayout: Story = {
  render: () => <DashboardLayoutExample />,
};
