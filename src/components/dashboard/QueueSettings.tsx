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
  minPriorityTipCents?: number;
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
  minPriorityTipCents = 0,
}: QueueSettingsProps) {
  const updateSettings = useMutation(api.queues.updateQueueSettings);
  const updateMinPriorityFee = useMutation(api.creators.updateMinPriorityFee);

  const [personalDays, setPersonalDays] = useState(1);
  const [priorityDays, setPriorityDays] = useState(1);
  const [minFee, setMinFee] = useState(50);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (minPriorityTipCents !== undefined) {
      // Convert cents to dollars for display, default to 50 if 0
      setMinFee(minPriorityTipCents > 0 ? minPriorityTipCents / 100 : 50);
    }
  }, [minPriorityTipCents]);

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

  const handleMinFeeChange = async (val: number) => {
    setMinFee(val);
    await updateMinPriorityFee({
      slug,
      minPriorityTipCents: val * 100,
    });
  };

  const handleCopyUrl = async () => {
    const url = `https://pleasepleaseplease.me/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!queueSnapshot) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] text-gray-500">
        Loading queue settings...
      </div>
    );
  }

  return (
    <div className="flex items-start justify-start min-h-[calc(100vh-200px)]  ">
      <div className="w-full  max-w-2xl space-y-3 ">
        {/* Title */}
        <h2
          className="text-xl font-bold text-left uppercase tracking-tight border-b border-gray-subtle pb-2"
          style={{ fontFamily: "var(--font-body)" }}
        >
          QUEUE SETTINGS
        </h2>

        <button
          onClick={handleCopyUrl}
          className="group w-full flex flex-col md:flex-row gap-4 justify-center p-2 bg-blue-2 hover:bg-text hover:cursor-pointer transition-colors border hover:border-text  border-blue-2"
        >
          <div>
            <h4 className="uppercase text-left font-bold group-hover:text-white transition-colors">
              Your public queue url:
            </h4>
            <p className={`text-left text-xs group-hover:text-white transition-colors ${isCopied ? 'text-coral' : ''}`}>
              {isCopied ? 'LINK COPIED!' : 'CLICK/TAP TO COPY'}
            </p>
          </div>
          <div className="">
            <p className="font-bold text-left group-hover:text-white transition-colors text-xs uppercase">
              https://pleasepleaseplease.me/{slug}
            </p>
            <p className="text-left text-xs group-hover:text-white transition-colors">
              Share this with your friends to get them in line!
            </p>
          </div>
        </button>

        <div className="flex flex-col md:flex-row gap-2">
          {/* Personal Queue Settings */}
          <div className="overflow-hidden border border-gray-subtle">
            {/* Header */}
            <div
              className="bg-greenlite  px-6 text-center"
              style={{ fontFamily: "var(--font-body)" }}
            >
              <h3 className="text-[20px] font-bold uppercase tracking-wide">PERSONAL</h3>
            </div>

            {/* Content */}
            <div className="space-y-4 p-6 ">
              {/* Queue Status */}
              <div className="flex items-center justify-between">
                <label
                  className="text-sm uppercase tracking-wide"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  QUEUE STATUS
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!personalEnabled) {
                        const result = await toggleQueue({
                          creatorSlug: slug,
                          kind: "personal",
                        });
                        setPersonalEnabled(result.enabled);
                      }
                    }}
                    className={`px-4 py-2 text-[14px] font-bold uppercase  ${personalEnabled
                      ? "bg-coral text-text"
                      : "bg-gray-300 text-text-muted"
                      }`}
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    ON
                  </button>
                  <button
                    onClick={async () => {
                      if (personalEnabled) {
                        const result = await toggleQueue({
                          creatorSlug: slug,
                          kind: "personal",
                        });
                        setPersonalEnabled(result.enabled);
                      }
                    }}
                    className={`px-4 py-2 text-[14px] font-bold uppercase   ${!personalEnabled
                      ? "bg-text text-coral"
                      : "bg-gray-200 text-text-muted"
                      }`}
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    OFF
                  </button>
                </div>
              </div>

              {/* Avg Time / Favor */}
              <div className="flex items-center justify-between">
                <div>
                  <div
                    className="text-sm uppercase tracking-wide"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    AVG TIME/FAVOR
                  </div>
                  <div
                    className="text-[12px] text-text-muted"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    (DAYS)
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDaysChange("personal", Math.max(1, personalDays - 1))}
                    className="w-8 h-10 flex items-center justify-center bg-white border border-gray-300 text-[20px] hover:bg-gray-100"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    &lt;
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={personalDays}
                    onChange={(e) => handleDaysChange("personal", parseInt(e.target.value) || 1)}
                    className="w-20 h-10 px-3 text-center bg-white border border-gray-300 text-[16px] font-mono no-spinners focus:outline-blue-2"
                  />
                  <button
                    onClick={() => handleDaysChange("personal", personalDays + 1)}
                    className="w-8 h-10 flex items-center justify-center bg-white border border-gray-300 text-[20px] hover:bg-gray-100"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Priority Queue Settings */}
          <div className="overflow-hidden border border-gray-subtle">
            {/* Header */}
            <div
              className="bg-gold px-6 text-center "
              style={{ fontFamily: "var(--font-body)" }}
            >
              <h3 className="text-[20px] font-bold uppercase tracking-wide">PRIORITY</h3>
            </div>

            {/* Content */}
            <div className=" space-y-4 p-6 ">
              {/* Queue Status */}
              <div className="flex items-center justify-between">
                <label
                  className="text-sm uppercase tracking-wide"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  QUEUE STATUS
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!priorityEnabled) {
                        const result = await toggleQueue({
                          creatorSlug: slug,
                          kind: "priority",
                        });
                        setPriorityEnabled(result.enabled);
                      }
                    }}
                    className={`px-6 py-2 text-[14px] font-bold uppercase ${priorityEnabled
                      ? "bg-coral text-text"
                      : "bg-gray-300 text-text-muted"
                      }`}
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    ON
                  </button>
                  <button
                    onClick={async () => {
                      if (priorityEnabled) {
                        const result = await toggleQueue({
                          creatorSlug: slug,
                          kind: "priority",
                        });
                        setPriorityEnabled(result.enabled);
                      }
                    }}
                    className={`px-6 py-2 text-[14px] font-bold uppercase ${!priorityEnabled
                      ? "bg-text text-coral"
                      : "bg-gray-200 text-text-muted"
                      }`}
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    OFF
                  </button>
                </div>
              </div>

              {/* Avg Time / Favor */}
              <div className="flex items-center justify-between">
                <div>
                  <div
                    className="text-sm uppercase tracking-wide"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    AVG TIME/FAVOR
                  </div>
                  <div
                    className="text-[12px] text-text-muted"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    (DAYS)
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDaysChange("priority", Math.max(1, priorityDays - 1))}
                    className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 text-[20px] hover:bg-gray-100 "
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    &lt;
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={priorityDays}
                    onChange={(e) => handleDaysChange("priority", parseInt(e.target.value) || 1)}
                    className="w-20 h-10 px-3 text-center bg-white border border-gray-300 text-[16px] font-mono no-spinners focus:outline-blue-2"
                  />
                  <button
                    onClick={() => handleDaysChange("priority", priorityDays + 1)}
                    className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 text-[20px] hover:bg-gray-100 "
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    &gt;
                  </button>
                </div>
              </div>

              {/* Minimum Fee */}
              <div className="flex items-center justify-between">
                <div>
                  <div
                    className="text-sm uppercase tracking-wide"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    MINIMUM FEE
                  </div>
                  <div
                    className="text-[12px] text-text-muted"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    ($USD)
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleMinFeeChange(Math.max(1, minFee - 1))}
                    className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 text-[20px] hover:bg-gray-100 "
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    &lt;
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={minFee}
                    onChange={(e) => handleMinFeeChange(parseInt(e.target.value) || 1)}
                    className="w-20 h-10 px-3 text-center bg-white border border-gray-300 text-[16px] font-mono no-spinners focus:outline-blue-2"
                  />
                  <button
                    onClick={() => handleMinFeeChange(minFee + 1)}
                    className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 text-[20px] hover:bg-gray-100 "
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
