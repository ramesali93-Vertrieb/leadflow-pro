"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;

    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
      return;
    }

    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  function handleToggle() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("theme", nextTheme);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="theme-toggle"
      aria-label={
        theme === "dark" ? "Zu hellem Modus wechseln" : "Zu dunklem Modus wechseln"
      }
    >
      {theme === "dark" ? "☀️ Hell" : "🌙 Dunkel"}
    </button>
  );
}
