"use client";

import React, { useState, ChangeEvent } from "react";
import { HandsSettings, HandConfig, GlobalConfig } from "./types";

interface ControlsProps {
    settings: HandsSettings;
    onSettingsChange: (newSettings: HandsSettings) => void;
}

export const Controls: React.FC<ControlsProps> = ({
    settings,
    onSettingsChange,
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const updateGlobal = (key: keyof GlobalConfig, value: number) => {
        onSettingsChange({
            ...settings,
            global: {
                ...settings.global,
                [key]: value,
            },
        });
    };

    const updateHand = (side: "left" | "right", key: keyof HandConfig, value: number | string | null) => {
        onSettingsChange({
            ...settings,
            [side]: {
                ...settings[side],
                [key]: value,
            },
        });
    };

    const handleFileUpload = (e: ChangeEvent<HTMLInputElement>, side: "left" | "right") => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target?.result as string;
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, "image/svg+xml");
                const pathEl = doc.querySelector("path");

                if (pathEl) {
                    const d = pathEl.getAttribute("d");
                    if (d) {
                        // Calculate auto offset (simplified version of original logic)
                        // Ideally we would do this via a hidden SVG element, but for now just update path
                        // The original code did calculateAutoOffset. 
                        // We can try to implement a basic version or just let the user adjust.
                        // Let's just update the path for now.
                        updateHand(side, "pathString", d);
                    }
                }
            } catch (err) {
                console.error("Error parsing SVG", err);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div
            className={`fixed top-5 left-5 w-[300px] bg-white/95 p-5 rounded-xl shadow-lg border border-gray-200 z-50 transition-all duration-300 ${isCollapsed ? "max-h-[50px] overflow-hidden pb-0" : "max-h-[90vh] overflow-y-auto"
                }`}
        >
            <div className="flex justify-between items-start border-b-2 border-[#eb655b] pb-1 mb-2">
                <h3 className="m-0 text-lg text-[#333] font-bold">Controls</h3>
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="bg-none border-none text-xl cursor-pointer text-[#555] hover:text-[#eb655b] px-1"
                >
                    {isCollapsed ? "+" : "–"}
                </button>
            </div>

            <div className={`transition-opacity duration-200 ${isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                {/* GLOBAL MOVEMENT */}
                <div className="mb-5 border-b border-gray-100 pb-4">
                    <label className="block text-xs font-bold mb-1 text-[#eb655b] uppercase">Global Movement</label>

                    <div className="mb-2">
                        <label className="block text-xs font-bold mb-1 text-[#555]">Path Angle (°)</label>
                        <div className="flex justify-between items-center gap-2">
                            <input
                                type="range"
                                min="-180"
                                max="180"
                                value={settings.global.pathAngle}
                                onChange={(e) => updateGlobal("pathAngle", parseFloat(e.target.value))}
                                className="w-full cursor-pointer h-1.5"
                            />
                            <input
                                type="number"
                                value={settings.global.pathAngle}
                                onChange={(e) => updateGlobal("pathAngle", parseFloat(e.target.value))}
                                className="w-[60px] p-0.5 text-xs border border-gray-300 rounded"
                            />
                        </div>
                    </div>

                    <div className="mb-2">
                        <label className="block text-xs font-bold mb-1 text-[#555]">Spread Distance</label>
                        <div className="flex justify-between items-center gap-2">
                            <input
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={settings.global.spreadFactor}
                                onChange={(e) => updateGlobal("spreadFactor", parseFloat(e.target.value))}
                                className="w-full cursor-pointer h-1.5"
                            />
                            <input
                                type="number"
                                step="0.1"
                                value={settings.global.spreadFactor}
                                onChange={(e) => updateGlobal("spreadFactor", parseFloat(e.target.value))}
                                className="w-[60px] p-0.5 text-xs border border-gray-300 rounded"
                            />
                        </div>
                    </div>

                    <div className="mb-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-[#555]">
                            <input
                                type="checkbox"
                                checked={settings.showPath}
                                onChange={(e) => onSettingsChange({ ...settings, showPath: e.target.checked })}
                            />
                            Show Movement Path
                        </label>
                    </div>
                </div>

                {/* HAND CONTROLS HELPER */}
                {["left", "right"].map((side) => {
                    const s = side as "left" | "right";
                    const config = settings[s];
                    return (
                        <div key={side} className="mb-5 border-b border-gray-100 pb-4">
                            <label className="block text-xs font-bold mb-1 text-[#eb655b] uppercase capitalize">{side} Hand</label>

                            <div className="mb-2">
                                <label className="block text-xs font-bold mb-1 text-[#555]">Upload SVG File</label>
                                <input type="file" accept=".svg" onChange={(e) => handleFileUpload(e, s)} className="text-xs w-full mb-1" />
                            </div>

                            <div className="mb-2">
                                <label className="block text-xs font-bold mb-1 text-[#555]">Scale</label>
                                <div className="flex justify-between items-center gap-2">
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="10"
                                        step="0.1"
                                        value={config.scale}
                                        onChange={(e) => updateHand(s, "scale", parseFloat(e.target.value))}
                                        className="w-full cursor-pointer h-1.5"
                                    />
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={config.scale}
                                        onChange={(e) => updateHand(s, "scale", parseFloat(e.target.value))}
                                        className="w-[60px] p-0.5 text-xs border border-gray-300 rounded"
                                    />
                                </div>
                            </div>

                            <div className="mb-2">
                                <label className="block text-xs font-bold mb-1 text-[#555]">Offset X</label>
                                <div className="flex justify-between items-center gap-2">
                                    <input
                                        type="range"
                                        min="-2000"
                                        max="2000"
                                        step="10"
                                        value={config.offX}
                                        onChange={(e) => updateHand(s, "offX", parseFloat(e.target.value))}
                                        className="w-full cursor-pointer h-1.5"
                                    />
                                    <input
                                        type="number"
                                        value={config.offX}
                                        onChange={(e) => updateHand(s, "offX", parseFloat(e.target.value))}
                                        className="w-[60px] p-0.5 text-xs border border-gray-300 rounded"
                                    />
                                </div>
                            </div>

                            <div className="mb-2">
                                <label className="block text-xs font-bold mb-1 text-[#555]">Offset Y</label>
                                <div className="flex justify-between items-center gap-2">
                                    <input
                                        type="range"
                                        min="-2000"
                                        max="2000"
                                        step="10"
                                        value={config.offY}
                                        onChange={(e) => updateHand(s, "offY", parseFloat(e.target.value))}
                                        className="w-full cursor-pointer h-1.5"
                                    />
                                    <input
                                        type="number"
                                        value={config.offY}
                                        onChange={(e) => updateHand(s, "offY", parseFloat(e.target.value))}
                                        className="w-[60px] p-0.5 text-xs border border-gray-300 rounded"
                                    />
                                </div>
                            </div>

                            <div className="mb-2">
                                <label className="block text-xs font-bold mb-1 text-[#555]">Rotation (°)</label>
                                <div className="flex justify-between items-center gap-2">
                                    <input
                                        type="range"
                                        min="-180"
                                        max="180"
                                        value={config.rotation}
                                        onChange={(e) => updateHand(s, "rotation", parseFloat(e.target.value))}
                                        className="w-full cursor-pointer h-1.5"
                                    />
                                    <input
                                        type="number"
                                        value={config.rotation}
                                        onChange={(e) => updateHand(s, "rotation", parseFloat(e.target.value))}
                                        className="w-[60px] p-0.5 text-xs border border-gray-300 rounded"
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}

                <div className="mb-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-[#555]">
                        <input
                            type="checkbox"
                            checked={settings.showCircles}
                            onChange={(e) => onSettingsChange({ ...settings, showCircles: e.target.checked })}
                        />
                        Show Helper Circles
                    </label>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
                            alert("Configuration copied to clipboard! You can now paste this into src/components/HandsBackground/config.ts");
                        }}
                        className="w-full bg-[#eb655b] text-white text-xs font-bold py-2 px-4 rounded hover:bg-[#d9544b] transition-colors"
                    >
                        COPY CONFIG TO CLIPBOARD
                    </button>
                </div>
            </div>
        </div>
    );
};
