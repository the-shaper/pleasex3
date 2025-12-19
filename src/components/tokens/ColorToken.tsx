'use client';

import { useState, useEffect, useRef } from 'react';

interface ColorTokenProps {
  name: string;
  variable: string;
  description?: string;
  showUsage?: boolean;
}

export function ColorToken({
  name,
  variable,
  description,
  showUsage = true
}: ColorTokenProps) {
  const [copied, setCopied] = useState(false);
  const [hexValue, setHexValue] = useState<string>('');
  const swatchRef = useRef<HTMLDivElement>(null);

  const rgbToHex = (colorStr: string) => {
    if (!colorStr) return '';
    // Handle hex already
    if (colorStr.startsWith('#')) return colorStr.toUpperCase();

    // Extract r, g, b from rgb() or rgba()
    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (!match) return colorStr;

    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);

    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  };

  useEffect(() => {
    const updateHexValue = () => {
      if (swatchRef.current) {
        const style = getComputedStyle(swatchRef.current);
        const bgColor = style.backgroundColor;

        // If it's transparent or empty, try to get the variable directly as a fallback
        if (!bgColor || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
          const directValue = getComputedStyle(document.documentElement)
            .getPropertyValue(`--color-${variable}`)
            .trim();
          if (directValue) {
            setHexValue(rgbToHex(directValue));
            return;
          }
        }

        setHexValue(rgbToHex(bgColor));
      }
    };

    // Initial check
    updateHexValue();

    // Check again after a short delay for Storybook/DOM readiness
    const timer = setTimeout(updateHexValue, 200);

    // Also update on window focus/load just in case
    window.addEventListener('load', updateHexValue);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('load', updateHexValue);
    };
  }, [variable]);

  const copyToClipboard = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="border border-gray-subtle p-4 rounded-lg bg-bg">
      <div className="flex items-start gap-4">
        <div
          ref={swatchRef}
          className="w-16 h-16 rounded-md border border-text-muted flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
          style={{ backgroundColor: `var(--color-${variable})` }}
          onClick={() => copyToClipboard(hexValue)}
          title="Click to copy hex value"
        />

        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-semibold text-text mb-1">
            {name}
          </h3>

          {description && (
            <p className="text-sm text-text-muted mb-2">
              {description}
            </p>
          )}

          <div className="space-y-1 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-text-muted">CSS:</span>
              <button
                onClick={() => copyToClipboard(`var(--color-${variable})`)}
                className="text-text hover:text-text-bright transition-colors cursor-pointer"
              >
                var(--color-{variable})
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-text-muted">Hex:</span>
              <button
                onClick={() => copyToClipboard(hexValue)}
                className="text-text hover:text-text-bright transition-colors cursor-pointer"
              >
                {hexValue || 'Loading...'}
              </button>
            </div>

            {showUsage && (
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Tailwind:</span>
                <button
                  onClick={() => copyToClipboard(`${variable}`)}
                  className="text-text hover:text-text-bright transition-colors cursor-pointer"
                >
                  {variable}
                </button>
              </div>
            )}
          </div>

          {copied && (
            <div className="mt-2 text-xs text-coral">
              Copied!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}