import { useLanguage } from "../i18n/LanguageContext";

const STYLES = {
  Open: "bg-green-100 text-green-700",
  OFF: "bg-red-100 text-red-600",
  Sold: "bg-green-100 text-green-700",
  Available: "bg-red-100 text-red-600",
  Used: "bg-indigo-100 text-indigo-700",
  Active: "bg-green-100 text-green-700",
  Disabled: "bg-red-100 text-red-600",
  Admin: "bg-red-50 text-red-600",
  User: "bg-neutral-100 text-neutral-600",
  Success: "bg-green-100 text-green-700",
};

// status ที่ backend ส่งมาเป็นภาษาอังกฤษเสมอ (เช่น "Open", "Sold") ไม่แปลตรงนั้น
// map ไปเป็น translation key ที่นี่แทน เพื่อโชว์เป็นภาษาที่เลือกไว้
const STATUS_KEYS = {
  Open: "statusOpen",
  OFF: "statusOff",
  Sold: "statusSold",
  Available: "statusAvailable",
  Used: "statusUsed",
  Active: "statusActive",
  Disabled: "statusDisabled",
  Admin: "roleAdmin",
  User: "roleUser",
  Success: "statusSuccess",
};

export default function StatusPill({ status }) {
  const { t } = useLanguage();
  const key = STATUS_KEYS[status];
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${
        STYLES[status] || "bg-neutral-100 text-neutral-600"
      }`}
    >
      {key ? t(key) : status}
    </span>
  );
}
