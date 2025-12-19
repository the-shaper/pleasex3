'use client';

import { ColorToken } from './ColorToken';

const colorTokens = [
  { name: 'Text', variable: 'text', description: 'Paragraph normal' },
  { name: 'Text Bright', variable: 'text-bright', description: 'Bright text' },
  { name: 'Text Muted', variable: 'text-muted', description: 'Lighter dark' },
  { name: 'Gray Subtle', variable: 'gray-subtle', description: 'Subtle gray' },
  { name: 'Background', variable: 'bg', description: 'Main background' },
  { name: 'Green Lite', variable: 'greenlite', description: 'Greenielo' },
  { name: 'Coral', variable: 'coral', description: 'Coral red' },
  { name: 'Pink', variable: 'pink', description: 'Light pink' },
  { name: 'Gold', variable: 'gold', description: 'UI gold' },
  { name: 'Ielo', variable: 'ielo', description: 'UI gold' },
  { name: 'Purple', variable: 'purple', description: 'Purple' },
  { name: 'Blue', variable: 'blue', description: 'Big blu' },
  { name: 'Blue 2', variable: 'blue-2', description: 'Other blu' },
  { name: 'Background Pink', variable: 'bg-pink', description: 'Background pink' },
];

export function ColorPalette() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-semibold text-text mb-2">
          Color Tokens
        </h2>
        <p className="text-text-muted">
          Click any color swatch or value to copy it to your clipboard.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {colorTokens.map((token) => (
          <ColorToken
            key={token.variable}
            name={token.name}
            variable={token.variable}
            description={token.description}
          />
        ))}
      </div>
      
      <div className="mt-8 p-4 border border-gray-subtle rounded-lg bg-bg">
        <h3 className="font-heading font-semibold text-text mb-2">
          Usage Guidelines
        </h3>
        <ul className="space-y-1 text-sm text-text-muted">
          <li>• Use CSS variables for consistency: <code className="font-mono">var(--color-text)</code></li>
          <li>• Use Tailwind classes for rapid development: <code className="font-mono">text-text</code></li>
          <li>• Click any value to copy it to your clipboard</li>
          <li>• Colors are optimized for the current theme and may change in dark mode</li>
        </ul>
      </div>
    </div>
  );
}