import { useEffect, useRef, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "lo", label: "Lao", flag: "🇱🇦" },
];

function FlagBadge({ flag, size = 28 }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100"
      style={{ width: size, height: size, fontSize: size * 0.68, lineHeight: 1 }}
    >
      {flag}
    </span>
  );
}

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 shadow-sm transition hover:bg-neutral-50"
      >
        <FlagBadge flag={current.flag} size={26} />
        <span className="text-sm font-semibold text-neutral-900">
          {current.code.toUpperCase()}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-neutral-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-neutral-500" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-44 rounded-2xl border border-neutral-200 bg-white p-2 shadow-lg">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLanguage(l.code);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-neutral-50 ${
                l.code === language ? "bg-neutral-50" : ""
              }`}
            >
              <FlagBadge flag={l.flag} size={30} />
              <span className="text-base text-neutral-800">{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
