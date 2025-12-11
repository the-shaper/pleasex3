export type DeviceTier = "unsupported" | "low" | "high";

/**
 * Lightweight capability gate:
 * - Returns "unsupported" when no GL context can be created.
 * - Returns "low" for clearly weak hardware (RAM/cores) or weak GPU strings.
 * - Defaults to "high" otherwise.
 */
export const checkDeviceCapability = async (): Promise<DeviceTier> => {
  if (typeof window === "undefined") return "low";

  const canvas = document.createElement("canvas");
  const gl = (canvas.getContext("webgl", {
    failIfMajorPerformanceCaveat: true,
  }) ||
    canvas.getContext("experimental-webgl", {
      failIfMajorPerformanceCaveat: true,
    }) ||
    canvas.getContext("webgl") ||
    canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;

  if (!gl) return "unsupported";

  const cores =
    typeof navigator !== "undefined" &&
    typeof navigator.hardwareConcurrency === "number"
      ? navigator.hardwareConcurrency
      : 4;

  const navWithMem = navigator as Navigator & { deviceMemory?: number };
  const ram =
    typeof navigator !== "undefined" &&
    typeof navWithMem.deviceMemory === "number"
      ? navWithMem.deviceMemory
      : 4;

  if (ram < 4 || cores < 4) return "low";

  const debugInfo = gl.getExtension(
    "WEBGL_debug_renderer_info"
  ) as WEBGL_debug_renderer_info | null;
  if (debugInfo) {
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as
      | string
      | null;

    if (renderer) {
      const r = renderer.toLowerCase();
      const weakGPUs = [
        "mali",
        "adreno 3",
        "adreno 4",
        "adreno 50",
        "intel hd",
        "powervr",
        "vivante",
      ];
      if (weakGPUs.some((gpu) => r.includes(gpu))) return "low";
    }
  }

  return "high";
};
