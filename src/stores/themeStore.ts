import { create } from "zustand";

interface ThemeStore {
  dark: boolean;
  toggle: () => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  dark: typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches,
  toggle: () =>
    set((state) => {
      const next = !state.dark;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("narris-theme", next ? "dark" : "light");
      return { dark: next };
    }),
}));

// Initialize on load
if (typeof window !== "undefined") {
  const saved = localStorage.getItem("narris-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = saved ? saved === "dark" : prefersDark;
  if (isDark) {
    document.documentElement.classList.add("dark");
    useThemeStore.setState({ dark: true });
  }
}
