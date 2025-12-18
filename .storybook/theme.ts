import { create } from "storybook/theming/create";

// Using actual color values from your design tokens
// These match the values in src/app/globals.css
export default create({
  base: "light",

  // Typography
  fontBase: '"Space Mono", monospace',
  fontCode: '"Space Mono", monospace',

  // Brand
  brandTitle: "TWILIGHT DESIGN SYSTEM",
  brandUrl: "./",
  brandTarget: "_self",

  // Colors - using actual color values from your design tokens
  colorPrimary: "#ff5757", // --color-coral
  colorSecondary: "#ff5757", // --color-coral

  // UI Backgrounds
  appBg: "#e9f8ee", // --color-bg
  appContentBg: "#e9f8ee", // --color-bg
  appPreviewBg: "#e9f8ee", // --color-bg
  appBorderColor: "#c6d9d1", // --color-gray-subtle
  appBorderRadius: 0,

  // Text colors
  textColor: "#372525", // --color-text
  textInverseColor: "#e9f8ee", // --color-text-bright
  textMutedColor: "#6a8689", // --color-text-muted

  // Toolbar
  barTextColor: "#6a8689", // --color-text-muted
  barSelectedColor: "#372525", // --color-text
  barHoverColor: "#372525", // --color-text
  barBg: "#e9f8ee", // --color-bg

  // Form elements
  inputBg: "#e9f8ee", // --color-bg
  inputBorder: "#c6d9d1", // --color-gray-subtle
  inputTextColor: "#372525", // --color-text
  inputBorderRadius: 2,

  // Button
  buttonBg: "#94ecff", // --color-blue
  buttonBorder: "#94ecff", // --color-blue
  booleanBg: "#c6d9d1", // --color-gray-subtle
  booleanSelectedBg: "#94ecff", // --color-blue
});
