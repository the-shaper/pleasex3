"use client";

import { useState, useEffect, useRef } from "react";
import { ButtonBase } from "../../general/buttonBase";

interface ConfirmDoneProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export default function ConfirmDone({
  isOpen,
  onCancel,
  onConfirm,
  isSubmitting = false,
}: ConfirmDoneProps) {
  const [confirmInput, setConfirmInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isValidConfirmation = confirmInput.toLowerCase() === "done!";

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset input when modal closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmInput("");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidConfirmation && !isSubmitting) {
      onConfirm();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-done-title"
      aria-describedby="confirm-done-description"
    >
      <div
        className="bg-bg shadow-xl max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="confirm-done-title"
          className="text-xl font-mono font-bold mb-4 text-text"
        >
          Confirm Task Completion
        </h2>

        <p id="confirm-done-description" className="text-text-muted mb-6">
          This action cannot be undone. Type{" "}
          <span className="font-mono bg-gray-subtle px-2 py-1 ">Done!</span> to
          mark this task as finished.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              ref={inputRef}
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder='Type "Done!" to confirm'
              className="w-full px-3 py-2 border border-gray-subtle bg-bg text-text focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent"
              disabled={isSubmitting}
              autoComplete="off"
              spellCheck="false"
            />
            {confirmInput && !isValidConfirmation && (
              <p className="text-sm text-red-600 mt-1">
                Please type exactly "Done!" to confirm
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <ButtonBase
              variant="neutral"
              size="sm"
              className="flex-1"
              onClick={onCancel}
              disabled={isSubmitting}
              type="button"
            >
              Cancel
            </ButtonBase>
            <ButtonBase
              variant="primary"
              size="sm"
              className="flex-1"
              disabled={!isValidConfirmation || isSubmitting}
              loading={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Marking as Finished..." : "Mark as Finished"}
            </ButtonBase>
          </div>
        </form>
      </div>
    </div>
  );
}
