import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import PageHeader from "../components/PageHeader.jsx";
import { changeOwnPassword } from "../api.js";
import { useLanguage } from "../i18n/LanguageContext";

export default function MyProfilePage({ currentUser }) {
  const { t } = useLanguage();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newPassword || !confirmPassword) {
      setError(t("fillAllFields"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("passwordsDontMatch"));
      return;
    }
    if (newPassword.length < 6) {
      setError(t("passwordTooShort"));
      return;
    }

    setSaving(true);
    try {
      await changeOwnPassword(newPassword);
      setSuccess(t("passwordChangedSuccess"));
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || t("passwordChangeFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title={t("myProfile")} />

      <div className="mx-auto max-w-xl space-y-6">
        <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-5">
          <div className="h-12 w-12 shrink-0 rounded-full bg-red-100" />
          <div>
            <p className="font-medium text-neutral-900">{currentUser?.name}</p>
            <p className="text-sm text-neutral-500">
              {currentUser?.role} · {currentUser?.username}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-4 text-center text-base font-medium text-neutral-900">
            {t("changePassword")}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-3.5 py-2.5 text-sm text-green-700">
                {success}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm text-neutral-700">
                {t("newPassword")}
              </label>

              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 pr-12 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />

                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                  aria-label={
                    showNewPassword ? "Hide password" : "Show password"
                  }
                >
                  <span
                    className="inline-flex transition-all duration-200 ease-in-out"
                    style={{
                      transform: showNewPassword
                        ? "scale(1) rotate(0deg)"
                        : "scale(0.9) rotate(-8deg)",
                    }}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-6 w-6" strokeWidth={2.2} />
                    ) : (
                      <Eye className="h-6 w-6" strokeWidth={2.2} />
                    )}
                  </span>
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 pr-12 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                <span
                  className="inline-flex transition-all duration-200 ease-in-out"
                  style={{
                    transform: showConfirmPassword
                      ? "scale(1) rotate(0deg)"
                      : "scale(0.9) rotate(-8deg)",
                  }}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-6 w-6" strokeWidth={2.2} />
                  ) : (
                    <Eye className="h-6 w-6" strokeWidth={2.2} />
                  )}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
