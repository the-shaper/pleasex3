interface FinalDonationProps {
  isPriority: boolean;
  tipDollarsInt: number;
  minPriorityTipCents: number;
}

export default function FinalDonation({
  isPriority,
  tipDollarsInt,
  minPriorityTipCents,
}: FinalDonationProps) {
  return (
    <div className="text-center p-3 border border-gray-subtle bg-[#372525]">
      <div
        className={`text-[14px] uppercase mb-2 ${
          isPriority ? "text-gold" : "text-greenlite"
        }`}
      >
        Your Final Donation
      </div>
      <div
        className={`inline-flex items-center gap-1 text-[22px] font-mono ${
          isPriority ? "text-gold" : "text-greenlite"
        }`}
      >
        <div className="inline-flex items-center gap-1 px-2">
          <span>$</span>
          <span className="font-mono font-semibold">{tipDollarsInt}</span>
        </div>
      </div>
      {isPriority && minPriorityTipCents > 0 && (
        <div className="mt-1 text-[12px] text-text-muted">
          Priority ticket minimum met
        </div>
      )}
    </div>
  );
}
