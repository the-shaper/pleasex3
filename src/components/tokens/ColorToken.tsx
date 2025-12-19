'use client';

import { useState } from 'react';

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

  const getCSSValue = () => {
    if (typeof window !== 'undefined') {
      return getComputedStyle(document.documentElement)
        .getPropertyValue(`--color-${variable}`)
        .trim();
    }
    return '';
  };

  const hexValue = getCSSValue();

  const copyToClipboard = async (text: string) => {
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
                  onClick={() => copyToClipboard(`text-${variable}`)}
                  className="text-text hover:text-text-bright transition-colors cursor-pointer"
                >
                  text-{variable}
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