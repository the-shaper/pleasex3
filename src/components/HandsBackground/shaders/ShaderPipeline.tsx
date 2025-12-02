"use client";

import React, { useRef, useEffect, useCallback } from "react";
import {
  ShaderSettings,
  ShaderLayer,
  HalftoneSettings,
  AdjustmentsSettings,
} from "./types";
import {
  halftoneVertexShader,
  halftoneFragmentShader,
  passthroughFragmentShader,
} from "./halftone";
import {
  adjustmentsVertexShader,
  adjustmentsFragmentShader,
} from "./adjustments";

interface ShaderPipelineProps {
  sourceCanvas: HTMLCanvasElement | null;
  settings: ShaderSettings;
  className?: string;
}

interface ShaderProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

interface Framebuffer {
  fb: WebGLFramebuffer;
  texture: WebGLTexture;
}

export const ShaderPipeline: React.FC<ShaderPipelineProps> = ({
  sourceCanvas,
  settings,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programsRef = useRef<Record<string, ShaderProgram>>({});
  const sourceTextureRef = useRef<WebGLTexture | null>(null);
  const framebuffersRef = useRef<[Framebuffer | null, Framebuffer | null]>([
    null,
    null,
  ]);
  const reqRef = useRef<number | null>(null);
  const settingsRef = useRef(settings);
  const lastSizeRef = useRef({ width: 0, height: 0 });

  // Update settings ref when prop changes
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Compile a shader from source
  const compileShader = useCallback(
    (
      gl: WebGLRenderingContext,
      type: number,
      source: string
    ): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;

      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    },
    []
  );

  // Create a shader program with cached uniforms
  const createProgram = useCallback(
    (
      gl: WebGLRenderingContext,
      vertexSource: string,
      fragmentSource: string,
      uniformNames: string[]
    ): ShaderProgram | null => {
      const vs = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
      const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
      if (!vs || !fs) return null;

      const program = gl.createProgram();
      if (!program) return null;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Shader link error:", gl.getProgramInfoLog(program));
        return null;
      }

      // Cache uniform locations
      const uniforms: Record<string, WebGLUniformLocation | null> = {};
      for (const name of uniformNames) {
        uniforms[name] = gl.getUniformLocation(program, name);
      }

      return { program, uniforms };
    },
    [compileShader]
  );

  // Setup vertex attributes for drawing
  const setupAttributes = useCallback(
    (gl: WebGLRenderingContext, program: WebGLProgram) => {
      const positions = new Float32Array([
        -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
      ]);
      const texCoords = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]);

      const posBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
      const posLoc = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      const texBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
      const texLoc = gl.getAttribLocation(program, "a_texCoord");
      gl.enableVertexAttribArray(texLoc);
      gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);
    },
    []
  );

  // Create or resize a framebuffer with texture
  const createFramebuffer = useCallback(
    (
      gl: WebGLRenderingContext,
      width: number,
      height: number
    ): Framebuffer | null => {
      const texture = gl.createTexture();
      if (!texture) return null;

      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        width,
        height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      const fb = gl.createFramebuffer();
      if (!fb) return null;

      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texture,
        0
      );

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      return { fb, texture };
    },
    []
  );

  // Initialize WebGL context and all shader programs
  const initGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const gl = canvas.getContext("webgl", {
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    });
    if (!gl) {
      console.error("WebGL not supported");
      return false;
    }
    glRef.current = gl;

    // Create halftone shader program
    const halftoneProgram = createProgram(
      gl,
      halftoneVertexShader,
      halftoneFragmentShader,
      [
        "u_texture",
        "u_resolution",
        "u_dotSize",
        "u_gridSpacing",
        "u_gridAngle",
        "u_smoothness",
        "u_pattern",
        "u_colorMode",
        "u_monoColor",
        "u_monoBackground",
        "u_showOriginal",
      ]
    );
    if (!halftoneProgram) return false;
    programsRef.current.halftone = halftoneProgram;

    // Create adjustments shader program
    const adjustmentsProgram = createProgram(
      gl,
      adjustmentsVertexShader,
      adjustmentsFragmentShader,
      [
        "u_texture",
        "u_resolution",
        "u_blurRadius",
        "u_gamma",
        "u_contrast",
        "u_brightness",
        "u_saturation",
      ]
    );
    if (!adjustmentsProgram) return false;
    programsRef.current.adjustments = adjustmentsProgram;

    // Create passthrough shader program
    const passthroughProgram = createProgram(
      gl,
      halftoneVertexShader,
      passthroughFragmentShader,
      ["u_texture"]
    );
    if (!passthroughProgram) return false;
    programsRef.current.passthrough = passthroughProgram;

    // Create source texture
    const sourceTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    sourceTextureRef.current = sourceTexture;

    return true;
  }, [compileShader, createProgram]);

  // Ensure framebuffers are correct size
  const ensureFramebuffers = useCallback(
    (gl: WebGLRenderingContext, width: number, height: number) => {
      if (
        lastSizeRef.current.width === width &&
        lastSizeRef.current.height === height &&
        framebuffersRef.current[0] &&
        framebuffersRef.current[1]
      ) {
        return;
      }

      // Create two framebuffers for ping-pong rendering
      framebuffersRef.current[0] = createFramebuffer(gl, width, height);
      framebuffersRef.current[1] = createFramebuffer(gl, width, height);
      lastSizeRef.current = { width, height };
    },
    [createFramebuffer]
  );

  // Get active layers (enabled only)
  const getActiveLayers = useCallback((): ShaderLayer[] => {
    return settingsRef.current.layers.filter((layer) => layer.enabled);
  }, []);

  // Main render loop
  const render = useCallback(() => {
    const gl = glRef.current;
    const canvas = canvasRef.current;
    const sourceTexture = sourceTextureRef.current;
    const programs = programsRef.current;

    if (
      !gl ||
      !canvas ||
      !sourceTexture ||
      !sourceCanvas ||
      !programs.halftone ||
      !programs.adjustments ||
      !programs.passthrough
    ) {
      reqRef.current = requestAnimationFrame(render);
      return;
    }

    const width = sourceCanvas.width;
    const height = sourceCanvas.height;

    // Resize canvas if needed
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    // Ensure framebuffers exist at correct size
    ensureFramebuffers(gl, width, height);

    // Upload source canvas to texture
    gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      sourceCanvas
    );

    // Get active layers
    const activeLayers = getActiveLayers();

    // If no layers are active, just passthrough
    if (activeLayers.length === 0) {
      gl.useProgram(programs.passthrough.program);
      setupAttributes(gl, programs.passthrough.program);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, width, height);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
      gl.uniform1i(programs.passthrough.uniforms.u_texture, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      reqRef.current = requestAnimationFrame(render);
      return;
    }

    // Multi-pass rendering with ping-pong framebuffers
    let currentInput = sourceTexture;
    let fbIndex = 0;

    for (let i = 0; i < activeLayers.length; i++) {
      const layer = activeLayers[i];
      const isLastPass = i === activeLayers.length - 1;
      const outputFb = isLastPass
        ? null
        : framebuffersRef.current[fbIndex]?.fb || null;
      const outputTexture = framebuffersRef.current[fbIndex]?.texture;

      const shaderProgram =
        layer.type === "halftone" ? programs.halftone : programs.adjustments;

      gl.useProgram(shaderProgram.program);
      setupAttributes(gl, shaderProgram.program);

      gl.bindFramebuffer(gl.FRAMEBUFFER, outputFb);
      gl.viewport(0, 0, width, height);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, currentInput);
      gl.uniform1i(shaderProgram.uniforms.u_texture, 0);

      if (layer.type === "adjustments") {
        const s = layer.settings as AdjustmentsSettings;
        gl.uniform2f(shaderProgram.uniforms.u_resolution, width, height);
        gl.uniform1f(shaderProgram.uniforms.u_blurRadius, s.blur);
        gl.uniform1f(shaderProgram.uniforms.u_gamma, s.gamma);
        gl.uniform1f(shaderProgram.uniforms.u_contrast, s.contrast);
        gl.uniform1f(shaderProgram.uniforms.u_brightness, s.brightness);
        gl.uniform1f(shaderProgram.uniforms.u_saturation, s.saturation);
      } else if (layer.type === "halftone") {
        const s = layer.settings as HalftoneSettings;
        gl.uniform2f(shaderProgram.uniforms.u_resolution, width, height);
        gl.uniform1f(shaderProgram.uniforms.u_dotSize, s.dotSize);
        gl.uniform1f(shaderProgram.uniforms.u_gridSpacing, s.gridSpacing);
        gl.uniform1f(
          shaderProgram.uniforms.u_gridAngle,
          (s.gridAngle * Math.PI) / 180
        );
        gl.uniform1f(shaderProgram.uniforms.u_smoothness, s.smoothness);
        gl.uniform1i(
          shaderProgram.uniforms.u_pattern,
          s.pattern === "dot" ? 0 : 1
        );
        gl.uniform1i(
          shaderProgram.uniforms.u_colorMode,
          s.colorMode === "cmyk" ? 0 : s.colorMode === "rgb" ? 1 : 2
        );
        gl.uniform3f(shaderProgram.uniforms.u_monoColor, ...s.monoColor);
        gl.uniform3f(
          shaderProgram.uniforms.u_monoBackground,
          ...s.monoBackgroundColor
        );
        gl.uniform1f(shaderProgram.uniforms.u_showOriginal, s.showOriginal);
      }

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // Swap for next pass
      if (!isLastPass && outputTexture) {
        currentInput = outputTexture;
        fbIndex = 1 - fbIndex;
      }
    }

    reqRef.current = requestAnimationFrame(render);
  }, [sourceCanvas, ensureFramebuffers, setupAttributes, getActiveLayers]);

  // Initialize and start render loop
  useEffect(() => {
    if (!initGL()) {
      console.error("Failed to initialize WebGL");
      return;
    }
    reqRef.current = requestAnimationFrame(render);

    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [initGL, render]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas && sourceCanvas && glRef.current) {
        canvas.width = sourceCanvas.width;
        canvas.height = sourceCanvas.height;
        glRef.current.viewport(0, 0, canvas.width, canvas.height);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sourceCanvas]);

  return <canvas ref={canvasRef} className={className} />;
};
