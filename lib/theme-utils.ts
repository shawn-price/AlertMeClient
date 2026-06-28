/**
 * Theme utilities for handling theme persistence and initialization
 */

// Default Ecobank theme colors
const DEFAULT_THEME = {
  primary: "#004A9F",
  secondary: "#00B2A9",
  accent: "#A4D233",
  background: "#FAFAFA",
}

// Helper function to convert hex to RGB values
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

// Helper function to convert hex to HSL
export const hexToHsl = (hex: string): string => {
  const rgb = hexToRgb(hex)
  if (!rgb) return "0 0% 0%"

  let r = rgb.r / 255
  let g = rgb.g / 255
  let b = rgb.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0,
    s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  const hue = Math.round(h * 360)
  const saturation = Math.round(s * 100)
  const lightness = Math.round(l * 100)

  return `${hue} ${saturation}% ${lightness}%`
}

export interface StoredTheme {
  themeId: string
  name: string
  primary: string
  secondary: string
  accent: string
  background: string
}

// Inject dynamic CSS to override hardcoded colors
const injectThemeStyles = (theme: StoredTheme): void => {
  if (typeof document === "undefined") return

  // Remove existing theme style if it exists
  const existingStyle = document.getElementById("ecobank-theme-override")
  if (existingStyle) {
    existingStyle.remove()
  }

  // Create a new style element for theme overrides
  const style = document.createElement("style")
  style.id = "ecobank-theme-override"
  
  // Get hover colors (darker versions)
  const hexToRgbStr = (hex: string): string => {
    const rgb = hexToRgb(hex)
    if (!rgb) return "0, 0, 0"
    return `${rgb.r}, ${rgb.g}, ${rgb.b}`
  }

  // Generate CSS that replaces hardcoded colors
  const primaryRgb = hexToRgbStr(theme.primary)
  const secondaryRgb = hexToRgbStr(theme.secondary)
  const accentRgb = hexToRgbStr(theme.accent)

  // All the hardcoded colors used in the app - create replacements
  const css = `
    /* Override hardcoded Ecobank primary color #004A9F */
    [class*="bg-\\[#004A9F\\]"] { background-color: ${theme.primary} !important; }
    [class*="from-\\[#004A9F\\]"] { --tw-gradient-from: ${theme.primary} !important; }
    [class*="to-\\[#004A9F\\]"] { --tw-gradient-to: ${theme.primary} !important; }
    [class*="text-\\[#004A9F\\]"] { color: ${theme.primary} !important; }
    [class*="border-\\[#004A9F\\]"] { border-color: ${theme.primary} !important; }
    
    /* Override hover variant */
    [class*="hover\\:bg-\\[#003875\\]"]:hover { background-color: ${theme.primary}dd !important; }
    
    /* Override accent color #A4D233 */
    [class*="bg-\\[#A4D233\\]"] { background-color: ${theme.accent} !important; }
    [class*="text-\\[#A4D233\\]"] { color: ${theme.accent} !important; }
    [class*="hover\\:bg-\\[#8BC220\\]"]:hover { background-color: ${theme.accent}dd !important; }
    
    /* Override secondary colors */
    [class*="bg-\\[#0072C6\\]"] { background-color: ${theme.secondary} !important; }
    [class*="text-\\[#00B2A9\\]"] { color: ${theme.secondary} !important; }
    
    /* Additional color overrides for other hardcoded values */
    [class*="from-\\[#0072C6\\]"] { --tw-gradient-from: ${theme.secondary} !important; }
    [class*="to-\\[#0072C6\\]"] { --tw-gradient-to: ${theme.secondary} !important; }
  `
  
  style.textContent = css
  
  if (document.head) {
    document.head.appendChild(style)
    console.log("[Theme] Injected theme styles for:", theme.themeId)
  } else {
    console.warn("[Theme] Document head not available, deferring style injection")
  }
}

// Initialize theme from localStorage on page load
export const initializeTheme = (): void => {
  if (typeof window === "undefined") return

  try {
    const savedTheme = localStorage.getItem("ecobank-theme")
    if (savedTheme) {
      const theme = JSON.parse(savedTheme) as StoredTheme
      applyTheme(theme)
    } else {
      // Apply default Ecobank theme if no saved theme
      applyTheme({
        themeId: "ecobank",
        name: "Ecobank",
        primary: DEFAULT_THEME.primary,
        secondary: DEFAULT_THEME.secondary,
        accent: DEFAULT_THEME.accent,
        background: DEFAULT_THEME.background,
      })
    }
  } catch (error) {
    console.warn("Failed to initialize theme:", error)
  }
}

// Apply theme to document
export const applyTheme = (theme: StoredTheme): void => {
  if (typeof document === "undefined") return

  try {
    const primaryHsl = hexToHsl(theme.primary)
    const secondaryHsl = hexToHsl(theme.secondary)
    const accentHsl = hexToHsl(theme.accent)
    const backgroundHsl = hexToHsl(theme.background)

    // Set CSS variables for Tailwind
    document.documentElement.style.setProperty("--primary", primaryHsl)
    document.documentElement.style.setProperty("--secondary", secondaryHsl)
    document.documentElement.style.setProperty("--accent", accentHsl)
    document.documentElement.style.setProperty("--background", backgroundHsl)

    // Set raw hex colors for components using hardcoded colors
    document.documentElement.style.setProperty("--primary-color", theme.primary)
    document.documentElement.style.setProperty("--secondary-color", theme.secondary)
    document.documentElement.style.setProperty("--accent-color", theme.accent)
    document.documentElement.style.setProperty("--background-color", theme.background)

    // Inject dynamic CSS overrides for hardcoded colors
    injectThemeStyles(theme)

    // Store theme in localStorage for persistence
    localStorage.setItem("ecobank-theme", JSON.stringify(theme))
    
    console.log("[Theme] Applied theme:", theme.themeId, theme.name)
  } catch (error) {
    console.error("[Theme] Failed to apply theme:", error)
  }
}
