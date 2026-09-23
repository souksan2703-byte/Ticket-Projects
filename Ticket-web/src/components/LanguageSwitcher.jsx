import { useEffect, useRef, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

// ธง UK แบบ SVG จริง (ไม่ใช่ emoji) เพื่อให้แสดงผลเหมือนกันทุกเครื่อง
// รวมถึง Windows ที่บาง font ไม่รองรับ emoji ธงชาติ (ขึ้นเป็นตัวอักษรแทน)
function FlagGB({ size }) {
  return (
    <svg viewBox="0 0 60 60" width={size} height={size}>
      <clipPath id="gb-circle">
        <circle cx="30" cy="30" r="30" />
      </clipPath>
      <g clipPath="url(#gb-circle)">
        <rect width="60" height="60" fill="#00247d" />
        <path d="M0 0L60 60M60 0L0 60" stroke="#fff" strokeWidth="12" />
        <path d="M0 0L60 60M60 0L0 60" stroke="#cf142b" strokeWidth="4" />
        <path d="M30 0V60M0 30H60" stroke="#fff" strokeWidth="20" />
        <path d="M30 0V60M0 30H60" stroke="#cf142b" strokeWidth="12" />
      </g>
    </svg>
  );
}

// ธงลาวแบบ SVG จริง: แถบแดง-น้ำเงิน-แดง พร้อมวงกลมขาวตรงกลาง
function FlagLA({ size }) {
  return (
    <svg viewBox="0 0 60 60" width={size} height={size}>
      <clipPath id="la-circle">
        <circle cx="30" cy="30" r="30" />
      </clipPath>
      <g clipPath="url(#la-circle)">
        <rect width="60" height="60" fill="#ce1126" />
        <rect y="15" width="60" height="30" fill="#002868" />
        <circle cx="30" cy="30" r="11" fill="#fff" />
      </g>
    </svg>
  );
}

const LANGUAGES = [
  { code: "en", label: "English", Flag: FlagGB },
  { code: "lo", label: "Lao", Flag: FlagLA },
];

function FlagBadge({ Flag, size = 28 }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full"
      style={{ width: size, height: size }}
    >
      <Flag size={size} />
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
        <FlagBadge Flag={current.Flag} size={26} />
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
              <FlagBadge Flag={l.Flag} size={30} />
              <span className="text-base text-neutral-800">{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}