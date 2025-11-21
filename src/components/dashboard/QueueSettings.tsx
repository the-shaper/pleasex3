import type { QueueSnapshot } from "@/lib/types";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState, useEffect } from "react";

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
  const updateSettings = useMutation(api.queues.updateQueueSettings);

  const [personalDays, setPersonalDays] = useState(1);
  const [priorityDays, setPriorityDays] = useState(1);

  useEffect(() => {
    if (queueSnapshot) {
      setPersonalDays(queueSnapshot.personal.avgDaysPerTicket ?? 1);
      setPriorityDays(queueSnapshot.priority.avgDaysPerTicket ?? 1);
    }
  }, [queueSnapshot]);

  const handleDaysChange = async (kind: "personal" | "priority", val: number) => {
    if (kind === "personal") setPersonalDays(val);
    else setPriorityDays(val);

    await updateSettings({
      creatorSlug: slug,
      kind,
      avgDaysPerTicket: val,
    });
  };

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
          {/* Personal Queue Settings */}
          <div className="p-4 bg-white rounded-lg border border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
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
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <label className="text-sm text-gray-600">Avg Time / Favor (days)</label>
              <input
                type="number"
                min="1"
                value={personalDays}
                onChange={(e) => handleDaysChange("personal", parseInt(e.target.value) || 0)}
                className="w-20 px-2 py-1 border rounded text-right"
              />
            </div>
          </div>

          {/* Priority Queue Settings */}
          <div className="p-4 bg-white rounded-lg border border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
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
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <label className="text-sm text-gray-600">Avg Time / Favor (days)</label>
              <input
                type="number"
                min="1"
                value={priorityDays}
                onChange={(e) => handleDaysChange("priority", parseInt(e.target.value) || 0)}
                className="w-20 px-2 py-1 border rounded text-right"
              />
            </div>
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
