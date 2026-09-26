import { useEffect, useState, type MouseEvent } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

function currentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function ThemeToggle({ inverted = false }: { inverted?: boolean }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => setTheme(currentTheme()), []);

  const toggleTheme = (event: MouseEvent<HTMLButtonElement>) => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    const applyTheme = () => {
      document.documentElement.classList.toggle("dark", next === "dark");
      window.localStorage.setItem("vvs-theme", next);
      setTheme(next);
    };
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startViewTransition = document.startViewTransition?.bind(document);
    if (!startViewTransition || reduceMotion) return applyTheme();

    const { clientX: x, clientY: y } = event;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const transition = startViewTransition(applyTheme);
    void transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 420, easing: "cubic-bezier(.2,.75,.2,1)", pseudoElement: "::view-transition-new(root)" },
      );
    });
  };

  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={inverted ? "text-owner-foreground hover:bg-owner-foreground/10 hover:text-owner-foreground" : undefined}
    >
      <span key={theme} className="theme-icon-enter" aria-hidden="true">
        {theme === "dark" ? <Sun /> : <Moon />}
      </span>
    </Button>
  );
}