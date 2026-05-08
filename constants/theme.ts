export type AppThemeMode = "system" | "light" | "dark";

export const lightColors = {
  background: "#f5f7fb",
  surface: "#ffffff",
  text: "#101828",
  muted: "#667085",
  border: "#d0d5dd",
  pepsiBlue: "#005cb9",
  pepsiRed: "#d71920",
  danger: "#b42318",
  dangerSoft: "#fff1f0",
  success: "#027a48",
  successSoft: "#ecfdf3",
  amber: "#b54708",
  amberSoft: "#fffaeb",
  blueSoft: "#eaf3ff"
};

export const darkColors = {
  background: "#0b1220",
  surface: "#111827",
  text: "#f8fafc",
  muted: "#9ca3af",
  border: "#263244",
  pepsiBlue: "#60a5fa",
  pepsiRed: "#fb7185",
  danger: "#f87171",
  dangerSoft: "#3f1d22",
  success: "#34d399",
  successSoft: "#12372a",
  amber: "#fbbf24",
  amberSoft: "#3b2f12",
  blueSoft: "#10243f"
};

export type AppColors = typeof lightColors;

let activeColors: AppColors = lightColors;

export function setActiveColors(nextColors: AppColors) {
  activeColors = nextColors;
}

export const colors = new Proxy(lightColors, {
  get(_target, property: keyof AppColors) {
    return activeColors[property];
  }
}) as AppColors;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16
};
