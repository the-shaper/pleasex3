"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { ButtonBase } from "@/components/general/buttonBase";

export default function AdminPayoutsPage() {
    const schedulePayouts = useAction(api.payments.scheduleMonthlyPayouts);
    const [status, setStatus] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    // Default to previous month
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const [year, setYear] = useState(prevMonth.getFullYear());
    const [month, setMonth] = useState(prevMonth.getMonth() + 1); // 1-indexed

    const handlePayout = async () => {
        if (!confirm(`Are you sure you want to trigger payouts for ${year}-${month}?`)) return;

        setIsLoading(true);
        setStatus("Processing...");
        try {
            const result = await schedulePayouts({ year, month });
            setStatus(`Success! Processed: ${result.processed}, Transfers: ${result.transfers}`);
        } catch (err: any) {
            console.error(err);
            setStatus(`Error: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-md mx-auto font-sans">
            <h1 className="text-2xl font-bold mb-6">Admin: Monthly Payouts</h1>

            <div className="space-y-4 bg-gray-100 p-6 rounded-lg">
                <div>
                    <label className="block text-sm font-medium mb-1">Year</label>
                    <input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        className="w-full p-2 border rounded"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Month (1-12)</label>
                    <input
                        type="number"
                        value={month}
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                        className="w-full p-2 border rounded"
                        min={1}
                        max={12}
                    />
                </div>

                <div className="pt-4">
                    <ButtonBase
                        variant="primary"
                        onClick={handlePayout}
                        disabled={isLoading}
                        className="w-full justify-center"
                    >
                        {isLoading ? "Processing..." : "Trigger Payouts"}
                    </ButtonBase>
                </div>

                {status && (
                    <div className={`mt-4 p-3 rounded ${status.startsWith("Error") ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                        {status}
                    </div>
                )}
            </div>
        </div>
    );
}
