"use client";

import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useState } from "react";

export default function CheckoutForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required", // Important: Avoid redirect if not needed (e.g. card)
    });

    if (error) {
      setErrorMessage(error.message ?? "An unknown error occurred");
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === "requires_capture") {
      // Success! The funds are held.
      onSuccess();
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      // Should not happen with capture_method: manual, but handle it anyway
      onSuccess();
    } else {
      setErrorMessage("Payment status: " + (paymentIntent?.status || "unknown"));
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {errorMessage && (
        <div className="text-red-500 text-sm">{errorMessage}</div>
      )}
      <button
        disabled={isProcessing || !stripe || !elements}
        type="submit"
        className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isProcessing ? "Processing..." : "Confirm Hold ($)"}
      </button>
    </form>
  );
}

