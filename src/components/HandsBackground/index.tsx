"use client";

import React, { useState } from "react";
import { HandsCanvas } from "./HandsCanvas";
import { Controls } from "./Controls";
import { defaultSettings } from "./config";
import { HandsSettings } from "./types";

interface HandsBackgroundProps {
    initialSettings?: HandsSettings;
    showControls?: boolean;
    className?: string;
}

export const HandsBackground: React.FC<HandsBackgroundProps> = ({
    initialSettings = defaultSettings,
    showControls = false,
    className = "fixed inset-0 -z-10 pointer-events-none", // Default to background
}) => {
    const [settings, setSettings] = useState<HandsSettings>(initialSettings);

    // Load from localStorage on mount
    React.useEffect(() => {
        const saved = localStorage.getItem("hands-bg-settings");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setSettings((prev) => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error("Failed to parse settings from localStorage", e);
            }
        }
    }, []);

    // Save to localStorage on change
    React.useEffect(() => {
        localStorage.setItem("hands-bg-settings", JSON.stringify(settings));
    }, [settings]);

    return (
        <>
            <HandsCanvas settings={settings} className={className} />
            {showControls && (
                <Controls settings={settings} onSettingsChange={setSettings} />
            )}
        </>
    );
};

export * from "./types";
export * from "./config";
