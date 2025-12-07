interface CheckoutDonationProps {
  isPriority: boolean;
  tipDollarsInt: number;
  minPriorityTipCents: number;
  priorityTipCents: number;
  onChangeTip: (cents: number) => void;
}

export default function CheckoutDonation({
  isPriority,
  tipDollarsInt,
  minPriorityTipCents,
  priorityTipCents,
  onChangeTip,
}: CheckoutDonationProps) {
  return (
    <div className="text-center p-3 border border-gray-subtle bg-[#372525]">
      <div
        className={`text-[12px] uppercase mb-2 ${
          isPriority ? "text-gold" : "text-greenlite"
        }`}
      >
        You are choosing to donate (USD)
      </div>
      <div
        className={`inline-flex items-center gap-1 text-[16px] ${
          isPriority ? "text-gold" : "text-greenlite"
        }`}
      >
        <button
          type="button"
          className="px-2 py-1 border border-gray-subtle"
          onClick={() => onChangeTip(Math.max(0, priorityTipCents - 100))}
          aria-label="Decrease tip by one dollar"
        >
          −
        </button>
        <label className="inline-flex items-center gap-1 px-2">
          <span>$</span>
          <input
            type="number"
            inputMode="numeric"
            step="1"
            min={0}
            className="w-11 bg-transparent outline-none text-inherit text-center no-spinners"
            value={String(tipDollarsInt)}
            onChange={(e) => {
              const dollars =
                parseInt((e.target.value || "0").replace(/[^0-9]/g, ""), 10) ||
                0;
              const cents = Math.max(0, dollars * 100);
              onChangeTip(cents);
            }}
            aria-label="Tip amount in dollars"
          />
        </label>
        <button
          type="button"
          className="px-2 py-1 border border-gray-subtle"
          onClick={() => onChangeTip(priorityTipCents + 100)}
          aria-label="Increase tip by one dollar"
        >
          +
        </button>
      </div>
      {isPriority && minPriorityTipCents > 0 && (
        <div className="mt-1 text-[12px] text-text-muted">
          Minimum for priority: ${Math.round(minPriorityTipCents / 100)}
        </div>
      )}
    </div>
  );
}
