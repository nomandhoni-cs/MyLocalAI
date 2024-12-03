import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

export const ThemeChanger = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      {theme === "light" ? (
        <button onClick={() => setTheme("dark")}>
          <MoonIcon className="h-5 w-5" />
        </button>
      ) : (
        <button onClick={() => setTheme("light")}>
          <SunIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};
