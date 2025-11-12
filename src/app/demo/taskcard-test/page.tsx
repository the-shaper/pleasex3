import TaskCard, { TaskCardData } from "@/components/taskcard";

// Sample data for testing
const autoqueueData: TaskCardData = {
  currentTurn: 1,
  nextTurn: 2,
  etaMins: 45,
  activeCount: 1,
  enabled: true,
  name: "Alex Johnson",
  email: "alex.johnson@example.com",
  phone: "+1 (555) 123-4567",
  location: "San Francisco, CA",
  social: "@alexj",
  needText:
    "Help me set up my home office workspace with proper ergonomics. I need recommendations for a desk chair, monitor stand, and keyboard that would be good for long coding sessions.",
  message:
    "Help me set up my home office workspace with proper ergonomics. I need recommendations for a desk chair, monitor stand, and keyboard that would be good for long coding sessions.",
  attachments: [
    "https://example.com/current-setup.jpg",
    "https://example.com/room-dimensions.pdf",
  ],
  tipCents: 0,
  queueKind: "personal",
  status: "current",
  tags: ["current"],
  createdAt: Date.now() - 3600000, // 1 hour ago
  ref: "AUTO-001",
};

const priorityData: TaskCardData = {
  currentTurn: 5,
  nextTurn: 6,
  etaMins: 30,
  activeCount: 2,
  enabled: true,
  name: "Morgan Smith",
  email: "morgan.smith@company.com",
  phone: "+1 (555) 987-6543",
  needText:
    "Need help debugging a critical production issue in our React application. The error occurs when users try to upload large files. We've identified it's related to memory management but need expert help to fix it quickly.",
  message:
    "Need help debugging a critical production issue in our React application. The error occurs when users try to upload large files. We've identified it's related to memory management but need expert help to fix it quickly.",
  attachments: [
    "https://example.com/error-logs.txt",
    "https://github.com/company/app/issues/123",
  ],
  tipCents: 2500, // $25
  queueKind: "priority",
  status: "next-up",
  tags: ["next-up"],
  createdAt: Date.now() - 1800000, // 30 minutes ago
  ref: "PRIO-006",
};

const personalData: TaskCardData = {
  currentTurn: 17,
  nextTurn: 18,
  etaMins: 90,
  activeCount: 5,
  enabled: true,
  name: "Taylor Wilson",
  email: "taylor.wilson@email.com",
  needText:
    "Looking for recommendations for beginner-friendly houseplants that are low maintenance and safe for cats. I have a north-facing apartment with limited natural light.",
  message:
    "Looking for recommendations for beginner-friendly houseplants that are low maintenance and safe for cats. I have a north-facing apartment with limited natural light.",
  attachments: [],
  tipCents: 0,
  queueKind: "personal",
  status: "pending",
  tags: ["pending"],
  createdAt: Date.now() - 7200000, // 2 hours ago
  ref: "PERS-018",
};

const finishedData: TaskCardData = {
  currentTurn: 12,
  nextTurn: 13,
  etaMins: 60,
  activeCount: 0,
  enabled: true,
  name: "Casey Rivera",
  email: "casey.rivera@email.com",
  needText:
    "Help me choose a new laptop for web development work. Budget is around $1500, need good battery life and a comfortable keyboard.",
  message:
    "Help me choose a new laptop for web development work. Budget is around $1500, need good battery life and a comfortable keyboard.",
  attachments: ["https://example.com/laptop-options.docx"],
  tipCents: 1500, // $15
  queueKind: "personal",
  status: "finished",
  tags: ["finished"],
  createdAt: Date.now() - 86400000, // 1 day ago
  ref: "PERS-013",
};

export default function TaskCardTestPage() {
  return (
    <div className="bg-bg min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold mb-2">TaskCard Component Test</h1>
          <p className="text-text-muted">
            Testing different variants and states of the TaskCard component
          </p>
        </header>

        <main className="space-y-12">
          {/* Autoqueue Card (expanded by default) */}
          <section>
            <h2 className="text-xl font-semibold mb-4">
              Autoqueue Card (Expanded by Default)
            </h2>
            <TaskCard variant="autoqueue" data={autoqueueData} />
          </section>

          {/* Priority Card (collapsed by default) */}
          <section>
            <h2 className="text-xl font-semibold mb-4">
              Priority Card (Collapsed by Default)
            </h2>
            <TaskCard variant="priority" data={priorityData} />
          </section>

          {/* Personal Card (collapsed by default) */}
          <section>
            <h2 className="text-xl font-semibold mb-4">
              Personal Card (Collapsed by Default)
            </h2>
            <TaskCard variant="personal" data={personalData} />
          </section>

          {/* Finished Card */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Finished Card</h2>
            <TaskCard variant="personal" data={finishedData} />
          </section>
        </main>
      </div>
    </div>
  );
}
