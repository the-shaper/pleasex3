"use client";

import React, { useState, useRef, useCallback } from "react";
import { HandsCanvas } from "./HandsCanvas";
import { Controls } from "./Controls";
import { defaultSettings } from "./config";
import { HandsSettings } from "./types";
import { ShaderPipeline } from "./shaders/ShaderPipeline";
import { ShaderControls } from "./shaders/ShaderControls";
import {
  AdjustmentsSettings,
  ShaderSettings,
  defaultShaderSettings,
} from "./shaders/types";
import { checkDeviceCapability, DeviceTier } from "./capability";

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
  const [tier, setTier] = useState<DeviceTier>("low");

  // Callback when HandsCanvas is ready
  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    setSourceCanvas(canvas);
  }, []);

  // Capability gate (default to low; upgrade to high when safe; mark unsupported to skip GL)
  React.useEffect(() => {
    let mounted = true;
    checkDeviceCapability()
      .then((result) => {
        if (mounted) setTier(result);
      })
      .catch(() => {
        if (mounted) setTier("low");
      });
    return () => {
      mounted = false;
    };
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

  // Derive gated shader settings for low-tier devices
  const safeShaderSettings = React.useMemo(() => {
    if (tier === "high") return shaderSettings;

    const gatedLayers = shaderSettings.layers.map((layer) => {
      if (layer.type === "halftone") {
        return { ...layer, enabled: false };
      }
      if (layer.type === "adjustments") {
        const s = layer.settings as AdjustmentsSettings;
        return { ...layer, settings: { ...s, blur: 0 } };
      }
      return layer;
    });

    return { ...shaderSettings, layers: gatedLayers };
  }, [shaderSettings, tier]);

  // Render
  if (tier === "unsupported") {
    return (
      <div
        className={className}
        aria-hidden
        style={{ background: "#e8f6ee" }}
      />
    );
  }

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
        settings={safeShaderSettings}
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
