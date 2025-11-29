"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export interface ResizableDividerProps {
    onResize: (newTopPercentage: number) => void;
    className?: string;
}

export function ResizableDivider({
    onResize,
    className = "",
}: ResizableDividerProps) {
    const [isDragging, setIsDragging] = useState(false);
    const dividerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isDragging) return;

            const container = dividerRef.current?.parentElement;
            if (!container) return;

            const containerRect = container.getBoundingClientRect();
            const relativeY = e.clientY - containerRect.top;
            const percentage = (relativeY / containerRect.height) * 100;

            // Clamp between 20% and 80% to prevent panels from becoming too small
            const clampedPercentage = Math.min(Math.max(percentage, 20), 80);
            onResize(clampedPercentage);
        },
        [isDragging, onResize]
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "row-resize";
            document.body.style.userSelect = "none";

            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
                document.body.style.cursor = "";
                document.body.style.userSelect = "";
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return (
        <div
            ref={dividerRef}
            onMouseDown={handleMouseDown}
            className={`relative flex items-center justify-center cursor-row-resize group ${className}`}
            style={{ height: "8px", flexShrink: 0 }}
        >
            {/* Visual divider bar */}
            <div
                className={`absolute inset-x-0 h-[2px] bg-gray-subtle transition-colors ${isDragging ? "bg-coral" : "group-hover:bg-text-muted"
                    }`}
            />

            {/* Drag handle dots */}
            <div className="relative z-10 flex gap-1 bg-bg px-2">
                <div
                    className={`w-1 h-1 rounded-full transition-colors ${isDragging ? "bg-coral" : "bg-gray-subtle group-hover:bg-text-muted"
                        }`}
                />
                <div
                    className={`w-1 h-1 rounded-full transition-colors ${isDragging ? "bg-coral" : "bg-gray-subtle group-hover:bg-text-muted"
                        }`}
                />
                <div
                    className={`w-1 h-1 rounded-full transition-colors ${isDragging ? "bg-coral" : "bg-gray-subtle group-hover:bg-text-muted"
                        }`}
                />
            </div>
        </div>
    );
}
