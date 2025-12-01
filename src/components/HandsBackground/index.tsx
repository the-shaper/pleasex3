"use client";

import React, { useState, useRef, useCallback } from "react";
import { HandsCanvas } from "./HandsCanvas";
import { Controls } from "./Controls";
import { defaultSettings } from "./config";
import { HandsSettings } from "./types";
import { ShaderPipeline } from "./shaders/ShaderPipeline";
import { ShaderControls } from "./shaders/ShaderControls";
import { ShaderSettings, defaultShaderSettings } from "./shaders/types";

interface HandsBackgroundProps {
  initialSettings?: HandsSettings;
  initialShaderSettings?: ShaderSettings;
  showControls?: boolean;
  showShaderControls?: boolean;
  className?: string;
}

export const HandsBackground: React.FC<HandsBackgroundProps> = ({
  initialSettings = defaultSettings,
  initialShaderSettings = defaultShaderSettings,
  showControls = false,
  showShaderControls = false,
  className = "fixed inset-0 -z-10 pointer-events-none",
}) => {
  const [settings, setSettings] = useState<HandsSettings>(initialSettings);
  const [shaderSettings, setShaderSettings] = useState<ShaderSettings>(
    initialShaderSettings
  );
  const [sourceCanvas, setSourceCanvas] = useState<HTMLCanvasElement | null>(
    null
  );

  // Callback when HandsCanvas is ready
  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    setSourceCanvas(canvas);
  }, []);

  // Load hands settings from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem("hands-bg-settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to parse hands settings from localStorage", e);
      }
    }
  }, []);

  // Load shader settings from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem("hands-shader-settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setShaderSettings((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to parse shader settings from localStorage", e);
      }
    }
  }, []);

  // Save hands settings to localStorage on change
  React.useEffect(() => {
    localStorage.setItem("hands-bg-settings", JSON.stringify(settings));
  }, [settings]);

  // Save shader settings to localStorage on change
  React.useEffect(() => {
    localStorage.setItem(
      "hands-shader-settings",
      JSON.stringify(shaderSettings)
    );
  }, [shaderSettings]);

  return (
    <>
      {/* Source canvas - renders hands animation (hidden, used as texture) */}
      <HandsCanvas
        settings={settings}
        className="fixed inset-0 -z-20 pointer-events-none invisible"
        onCanvasReady={handleCanvasReady}
      />

      {/* Shader output canvas - visible, applies post-processing effects */}
      <ShaderPipeline
        sourceCanvas={sourceCanvas}
        settings={shaderSettings}
        className={className}
      />

      {/* Hands animation controls (left side) */}
      {showControls && (
        <Controls settings={settings} onSettingsChange={setSettings} />
      )}

      {/* Shader controls (right side) */}
      {showShaderControls && (
        <ShaderControls
          settings={shaderSettings}
          onSettingsChange={setShaderSettings}
        />
      )}
    </>
  );
};

export * from "./types";
export * from "./config";
export * from "./shaders/types";
