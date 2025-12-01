"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { ShaderSettings, ShaderLayerType } from "./types";
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

  // Run a single shader pass
  const runShaderPass = useCallback(
    (
      gl: WebGLRenderingContext,
      shaderProgram: ShaderProgram,
      inputTexture: WebGLTexture,
      outputFramebuffer: WebGLFramebuffer | null, // null = render to screen
      width: number,
      height: number,
      setUniforms: (
        uniforms: Record<string, WebGLUniformLocation | null>
      ) => void
    ) => {
      gl.useProgram(shaderProgram.program);
      setupAttributes(gl, shaderProgram.program);

      gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);
      gl.viewport(0, 0, width, height);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, inputTexture);

      gl.uniform1i(shaderProgram.uniforms.u_texture, 0);
      setUniforms(shaderProgram.uniforms);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    },
    [setupAttributes]
  );

  // Get active layers in order (only enabled ones)
  const getActiveLayers = useCallback((): ShaderLayerType[] => {
    const s = settingsRef.current;
    return s.layerOrder.filter((layer) => {
      if (layer === "halftone") return s.halftone.enabled;
      if (layer === "adjustments") return s.adjustments.enabled;
      return false;
    });
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

    const s = settingsRef.current;
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
      runShaderPass(
        gl,
        programs.passthrough,
        sourceTexture,
        null,
        width,
        height,
        () => {}
      );
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

      if (layer === "adjustments") {
        runShaderPass(
          gl,
          programs.adjustments,
          currentInput,
          outputFb,
          width,
          height,
          (uniforms) => {
            gl.uniform2f(uniforms.u_resolution, width, height);
            gl.uniform1f(uniforms.u_blurRadius, s.adjustments.blur);
            gl.uniform1f(uniforms.u_gamma, s.adjustments.gamma);
            gl.uniform1f(uniforms.u_contrast, s.adjustments.contrast);
            gl.uniform1f(uniforms.u_brightness, s.adjustments.brightness);
            gl.uniform1f(uniforms.u_saturation, s.adjustments.saturation);
          }
        );
      } else if (layer === "halftone") {
        runShaderPass(
          gl,
          programs.halftone,
          currentInput,
          outputFb,
          width,
          height,
          (uniforms) => {
            gl.uniform2f(uniforms.u_resolution, width, height);
            gl.uniform1f(uniforms.u_dotSize, s.halftone.dotSize);
            gl.uniform1f(uniforms.u_gridSpacing, s.halftone.gridSpacing);
            gl.uniform1f(
              uniforms.u_gridAngle,
              (s.halftone.gridAngle * Math.PI) / 180
            );
            gl.uniform1f(uniforms.u_smoothness, s.halftone.smoothness);
            gl.uniform1i(
              uniforms.u_pattern,
              s.halftone.pattern === "dot" ? 0 : 1
            );
            gl.uniform1i(
              uniforms.u_colorMode,
              s.halftone.colorMode === "cmyk"
                ? 0
                : s.halftone.colorMode === "rgb"
                  ? 1
                  : 2
            );
            gl.uniform3f(uniforms.u_monoColor, ...s.halftone.monoColor);
            gl.uniform1f(uniforms.u_showOriginal, s.halftone.showOriginal);
          }
        );
      }

      // Swap for next pass
      if (!isLastPass && outputTexture) {
        currentInput = outputTexture;
        fbIndex = 1 - fbIndex; // Toggle between 0 and 1
      }
    }

    reqRef.current = requestAnimationFrame(render);
  }, [sourceCanvas, ensureFramebuffers, runShaderPass, getActiveLayers]);

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
