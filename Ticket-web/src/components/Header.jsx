import { useLanguage } from "../i18n/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header() {
  const { t } = useLanguage();

  return (
    <header className="fixed left-0 right-0 top-0 z-50 h-16 border-b border-neutral-200 bg-white">
      <div className="flex h-full items-center justify-between px-6">
        {/* ชื่อระบบ */}
        <div className="flex items-center">
          <span className="text-lg font-semibold text-neutral-900">
            {t("appTitle")}
          </span>
        </div>

        {/* เปลี่ยนภาษา */}
        <div className="flex items-center">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}