"use client";

import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useState } from "react";
import { formatCurrency, type SupportedCurrency } from "@/lib/currency";

interface CheckoutFormProps {
  onSuccess: () => void;
  amountCents?: number;
  currency?: SupportedCurrency;
}

export default function CheckoutForm({ onSuccess, amountCents, currency = "usd" }: CheckoutFormProps) {
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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/52800dcc-1f0f-4708-aec6-2c5e74412eb3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CheckoutForm.tsx:confirmPayment',message:'Confirming payment',data:{amountCents, currency},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B-multicurrency'})}).catch(()=>{});
    // #endregion

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required", // Important: Avoid redirect if not needed (e.g. card)
    });

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/52800dcc-1f0f-4708-aec6-2c5e74412eb3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CheckoutForm.tsx:result',message:'Payment result',data:{error: error ? { type: error.type, code: error.code, message: error.message } : null, status: paymentIntent?.status, currency: paymentIntent?.currency},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B-multicurrency'})}).catch(()=>{});
    // #endregion

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

  // Format the button text with the charge amount
  const buttonText = isProcessing 
    ? "Processing..." 
    : amountCents 
      ? `Confirm Hold (${formatCurrency(amountCents, currency)})`
      : "Confirm Hold";

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
        {buttonText}
      </button>
    </form>
  );
}





