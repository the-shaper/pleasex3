interface StripeOnboardingBannerProps {
    hasStripeAccount: boolean;
    onNavigateToEarnings: () => void;
}

export function StripeOnboardingBanner({
    hasStripeAccount,
    onNavigateToEarnings,
}: StripeOnboardingBannerProps) {
    if (hasStripeAccount) {
        return null;
    }

    return (
        <div
            className="w-screen bg-gold text-text py-3 px-6 flex items-center justify-center"
            style={{ fontFamily: "var(--font-body)" }}
        >
            <div className="flex items-center justify-center gap-4 max-w-6xl w-full">
                <span className="text-sm uppercase tracking-wide">
                    💰 Start monetizing your time
                </span>
                <button
                    onClick={onNavigateToEarnings}
                    className="bg-text text-coral px-4 py-1 uppercase text-sm font-bold hover:bg-coral hover:text-text transition-colors"
                    style={{ fontFamily: "var(--font-body)" }}
                >
                    Connect Stripe
                </button>
            </div>
        </div>
    );
}

