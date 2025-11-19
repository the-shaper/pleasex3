import React, { useState } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
  Elements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// Initialize Stripe outside of component to avoid recreation
const STRIPE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

interface PaymentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  amountCents: number;
}

const PaymentForm = ({ onSuccess, onCancel, amountCents }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // We don't redirect, we handle success inline if possible,
        // BUT confirmPayment usually requires a return_url for 3DS.
        // We can use 'if_required' or just provide a dummy return url that points to success.
        // Actually, for manual capture, it's same flow.
        return_url: window.location.origin + "/payment-processing", // Dummy intermediate or current page
      },
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message ?? "An unknown error occurred");
      setProcessing(false);
    } else {
      // Payment authorized!
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-bg border border-gray-subtle rounded-md">
        <PaymentElement />
      </div>
      {errorMessage && (
        <div className="text-red-500 text-sm">{errorMessage}</div>
      )}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {processing ? "Processing..." : `Pay $${(amountCents / 100).toFixed(2)}`}
        </button>
      </div>
    </form>
  );
};

interface StripePaymentModalProps {
  clientSecret: string;
  amountCents: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function StripePaymentModal({
  clientSecret,
  amountCents,
  onSuccess,
  onCancel,
}: StripePaymentModalProps) {
  const options = {
    clientSecret,
    appearance: {
      theme: "stripe" as const,
      variables: {
        colorPrimary: "#000000",
      },
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Complete Payment</h2>
        <p className="text-sm text-gray-500 mb-6">
          Your funds will be held securely and only captured when your request is approved.
        </p>

        {stripePromise ? (
          <Elements stripe={stripePromise} options={options}>
            <PaymentForm
              onSuccess={onSuccess}
              onCancel={onCancel}
              amountCents={amountCents}
            />
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
