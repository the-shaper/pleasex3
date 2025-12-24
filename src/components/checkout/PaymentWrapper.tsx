"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "./CheckoutForm";
import { formatCurrency, type SupportedCurrency } from "@/lib/currency";

// Make sure to set this in your .env.local
const STRIPE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

interface PaymentWrapperProps {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
  amountCents?: number;
  currency?: SupportedCurrency;
  originalUsdCents?: number;
}

export default function PaymentWrapper({
  clientSecret,
  onSuccess,
  onCancel,
  amountCents,
  currency = "usd",
  originalUsdCents,
}: PaymentWrapperProps) {
  // Show currency conversion info if charging in non-USD
  const showConversionInfo = currency !== "usd" && amountCents && originalUsdCents;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md relative">
        <button
          onClick={onCancel}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4 text-gray-900">
          Complete Payment
        </h2>
        
        {/* Show charge amount with currency conversion info */}
        {amountCents && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(amountCents, currency)}
            </div>
            {showConversionInfo && (
              <div className="text-sm text-gray-500 mt-1">
                ≈ {formatCurrency(originalUsdCents, "usd")} USD
              </div>
            )}
          </div>
        )}
        
        <p className="text-sm text-gray-500 mb-4">
          Your funds will be held securely and only captured when your request is approved.
        </p>
        
        {clientSecret && stripePromise ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: { theme: "stripe" },
            }}
          >
            <CheckoutForm onSuccess={onSuccess} amountCents={amountCents} currency={currency} />
          </Elements>
        ) : (
          <div className="text-red-500 p-4 text-center">
            Error: Stripe configuration is missing. Please contact support.
          </div>
        )}
      </div>
    </div>
  );
}





