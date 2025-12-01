"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { HandsSettings, HandConfig } from "./types";

interface HandsCanvasProps {
    settings: HandsSettings;
    className?: string;
    onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export const HandsCanvas: React.FC<HandsCanvasProps> = ({
    settings,
    className,
    onCanvasReady,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const settingsRef = useRef(settings);
    const pathsRef = useRef<{ left: Path2D | null; right: Path2D | null }>({
        left: null,
        right: null,
    });
    const reqRef = useRef<number | null>(null);
    const mouseRef = useRef({ y: 0 });
    const isActivatedRef = useRef(false);

    // Update settings ref when prop changes
    useEffect(() => {
        settingsRef.current = settings;

        // Update Path2D objects if strings changed
        if (settings.left.pathString) {
            pathsRef.current.left = new Path2D(settings.left.pathString);
        } else {
            pathsRef.current.left = null;
        }

        if (settings.right.pathString) {
            pathsRef.current.right = new Path2D(settings.right.pathString);
        } else {
            pathsRef.current.right = null;
        }

    }, [settings]);

    // Constants
    const bgColor = "#e8f6ee";
    const handColor = "#ff5757";
    const pathColor = "#99ccbb";
    const handRadius = 50;

    const drawHand = useCallback(
        (
            ctx: CanvasRenderingContext2D,
            x: number,
            y: number,
            config: HandConfig,
            path2D: Path2D | null,
            showCircles: boolean
        ) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((config.rotation * Math.PI) / 180);

            ctx.fillStyle = handColor;

            // Draw Helper Circle
            if (!path2D || showCircles) {
                ctx.beginPath();
                ctx.arc(0, 0, handRadius, 0, Math.PI * 2);
                ctx.fillStyle = path2D ? "rgba(235, 101, 91, 0.3)" : handColor;
                ctx.fill();
                ctx.fillStyle = handColor; // Reset
            }

            // Draw SVG Path
            if (path2D) {
                ctx.save();
                ctx.scale(config.scale, config.scale);
                ctx.translate(config.offX, config.offY);
                ctx.fill(path2D);
                ctx.restore();
            }

            ctx.restore();
        },
        []
    );

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const currentSettings = settingsRef.current;
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const maxDist = Math.hypot(width / 2, height / 2);

        // 1. Clear
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);

        // 2. Logic: Factor Calculation
        let mouseY = mouseRef.current.y;

        // If not activated yet, check if we should activate
        if (!isActivatedRef.current) {
            // If mouse is near center (within 50px), activate
            if (Math.abs(mouseY - centerY) < 5 && mouseY !== 0) {
                isActivatedRef.current = true;
            } else {
                // Otherwise force center position
                mouseY = centerY;
            }
        }

        if (mouseY === 0) mouseY = centerY;

        const distY = Math.abs(mouseY - centerY);
        let factor = distY / centerY;
        factor = Math.min(factor, 1);

        // 3. Logic: Position Calculation
        const angleRad = (currentSettings.global.pathAngle * Math.PI) / 180;
        const currentDistance =
            maxDist * currentSettings.global.spreadFactor * factor;

        const h1_offsetX = Math.cos(angleRad) * currentDistance;
        const h1_offsetY = Math.sin(angleRad) * currentDistance;

        const h2_offsetX = -h1_offsetX;
        const h2_offsetY = -h1_offsetY;

        const h1_x = centerX + h1_offsetX;
        const h1_y = centerY + h1_offsetY;

        const h2_x = centerX + h2_offsetX;
        const h2_y = centerY + h2_offsetY;

        // 4. Draw Paths
        if (currentSettings.showPath) {
            ctx.save();
            ctx.strokeStyle = pathColor;
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 10]);

            const startX1 =
                centerX +
                Math.cos(angleRad) * maxDist * currentSettings.global.spreadFactor;
            const startY1 =
                centerY +
                Math.sin(angleRad) * maxDist * currentSettings.global.spreadFactor;

            ctx.beginPath();
            ctx.moveTo(startX1, startY1);
            ctx.lineTo(centerX, centerY);
            ctx.stroke();

            const startX2 =
                centerX -
                Math.cos(angleRad) * maxDist * currentSettings.global.spreadFactor;
            const startY2 =
                centerY -
                Math.sin(angleRad) * maxDist * currentSettings.global.spreadFactor;

            ctx.beginPath();
            ctx.moveTo(startX2, startY2);
            ctx.lineTo(centerX, centerY);
            ctx.stroke();

            ctx.restore();
        }

        // 5. Draw Hands
        drawHand(
            ctx,
            h1_x,
            h1_y,
            currentSettings.left,
            pathsRef.current.left,
            currentSettings.showCircles
        );
        drawHand(
            ctx,
            h2_x,
            h2_y,
            currentSettings.right,
            pathsRef.current.right,
            currentSettings.showCircles
        );

        reqRef.current = requestAnimationFrame(draw);
    }, [drawHand]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Notify parent when canvas is ready
        if (onCanvasReady) {
            onCanvasReady(canvas);
        }

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current.y = e.clientY;
        };

        const handleTouchMove = (e: TouchEvent) => {
            mouseRef.current.y = e.touches[0].clientY;
        }

        window.addEventListener("resize", resize);
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("touchmove", handleTouchMove);

        resize();
        reqRef.current = requestAnimationFrame(draw);

        return () => {
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("touchmove", handleTouchMove);
            if (reqRef.current) cancelAnimationFrame(reqRef.current);
        };
    }, [draw, onCanvasReady]);

    return <canvas ref={canvasRef} className={className} />;
};
