import type { QueueSnapshot } from "@/lib/types";

interface QueueSettingsProps {
  queueSnapshot: QueueSnapshot | null;
  toggleQueue: (args: { creatorSlug: string; kind: "personal" | "priority" }) => Promise<{ enabled: boolean }>;
  slug: string;
  personalEnabled: boolean;
  setPersonalEnabled: (enabled: boolean) => void;
  priorityEnabled: boolean;
  setPriorityEnabled: (enabled: boolean) => void;
  showAutoqueueCard?: boolean;
  onToggleAutoqueueCard?: (value: boolean) => void;
}

export function QueueSettings({
  queueSnapshot,
  toggleQueue,
  slug,
  personalEnabled,
  setPersonalEnabled,
  priorityEnabled,
  setPriorityEnabled,
  showAutoqueueCard,
  onToggleAutoqueueCard,
}: QueueSettingsProps) {
  if (!queueSnapshot) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] text-gray-500">
        Loading queue settings...
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
      <div className="w-full max-w-md space-y-4">
        <h3 className="text-xl font-bold text-center">Queue Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
            <label className="text-sm font-medium">Personal Queue: {personalEnabled ? "On" : "Off"}</label>
            <button
              onClick={async () => {
                const result = await toggleQueue({
                  creatorSlug: slug,
                  kind: "personal",
                });
                setPersonalEnabled(result.enabled);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Toggle
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
            <label className="text-sm font-medium">Priority Queue: {priorityEnabled ? "On" : "Off"}</label>
            <button
              onClick={async () => {
                const result = await toggleQueue({
                  creatorSlug: slug,
                  kind: "priority",
                });
                setPriorityEnabled(result.enabled);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Toggle
            </button>
          </div>

          {onToggleAutoqueueCard && (
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
              <label className="text-sm font-medium">
                Show autoqueue card in NEXT UP: {showAutoqueueCard ? "On" : "Off"}
              </label>
              <button
                onClick={() => onToggleAutoqueueCard(!showAutoqueueCard)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Toggle
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
