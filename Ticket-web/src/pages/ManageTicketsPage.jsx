import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import StatusPill from "../components/StatusPill.jsx";
import AddTicketModal from "../components/AddTicketModal.jsx";
import { currency } from "../data/sampleData.js";
import {
  getTickets,
  createTicket,
  updateTicket,
  deleteTicket,
  getImageUrl,
} from "../api.js";
import { useLanguage } from "../i18n/LanguageContext";
import { Trash2, X, AlertTriangle } from "lucide-react";

function formatDateTime(value) {
  if (!value) return "-";

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/,
  );

  if (match) {
    const [, year, month, day, startTime, endTime] = match;

    return `${day}/${month}/${year} ${startTime} - ${endTime}`;
  }

  return value;
}

export default function ManageTicketsPage() {
  const { t } = useLanguage();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  async function loadTickets() {
    setLoading(true);
    setError(null);
    try {
      const data = await getTickets();
      setTickets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  async function handleSave(formData) {
    if (editingTicket) {
      await updateTicket(editingTicket.id, formData);
    } else {
      await createTicket(formData);
    }
    setModalOpen(false);
    setEditingTicket(null);
    await loadTickets();
  }

  async function handleDelete() {
    if (!ticketToDelete || deleting) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      await deleteTicket(ticketToDelete.id);
      setTicketToDelete(null);
      await loadTickets();
    } catch (err) {
      setDeleteError(err.message || t("deleteFailed"));
    } finally {
      setDeleting(false);
    }
  }

  const openCount = tickets.filter((e) => e.status === "Open").length;

  return (
    <div>
      <PageHeader
        title={t("manageTickets")}
        action={
          <button
            onClick={() => {
              setEditingTicket(null);
              setModalOpen(true);
            }}
            className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700"
          >
            {t("addTicket")}
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4">
        <StatCard
          label={t("totalTickets")}
          value={tickets.length}
          className="bg-neutral-100 text-neutral-900"
        />
        <StatCard
          label={t("openForSale")}
          value={openCount}
          className="bg-neutral-100 text-green-700"
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t("loadFailed")}: {error}
          <button onClick={loadTickets} className="ml-3 underline">
            {t("retry")}
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="px-5 py-3 font-normal">{t("colEvent")}</th>
              <th className="px-5 py-3 font-normal">{t("colPrice")}</th>
              <th className="px-5 py-3 font-normal">{t("colStock")}</th>
              <th className="px-5 py-3 font-normal">{t("colDateTime")}</th>
              <th className="px-5 py-3 font-normal">{t("colStatus")}</th>
              <th className="px-5 py-3 font-normal">{t("colEdit")}</th>
              <th className="px-5 py-3 font-normal">{t("colDelete")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-8 text-center text-neutral-400"
                >
                  {t("loadingEllipsis")}
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-8 text-center text-neutral-400"
                >
                  {t("noTicketsYet")}
                </td>
              </tr>
            ) : (
              tickets.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-neutral-100 last:border-0"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {e.logo ? (
                        <img
                          src={getImageUrl(e.logo)}
                          alt={e.name}
                          className="h-9 w-9 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <div className="h-9 w-9 shrink-0 rounded-md bg-neutral-200" />
                      )}
                      <div>
                        <p className="font-medium text-neutral-900">{e.name}</p>
                        <p className="text-xs text-neutral-500">{e.location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-neutral-700">
                    {currency(e.price)}
                  </td>
                  <td className="px-5 py-4 text-neutral-700">
                    {e.stock?.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-neutral-700">
                    {formatDateTime(e.date)}
                  </td>
                  <td className="px-5 py-4">
                    <StatusPill status={e.status} />
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => {
                        setEditingTicket(e);
                        setModalOpen(true);
                      }}
                      className="text-neutral-600 hover:text-neutral-900"
                    >
                      {t("colEdit")}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => {
                        setTicketToDelete(e);
                        setDeleteError(null);
                      }}
                      aria-label={`${t("colDelete")} ${e.name}`}
                      className="inline-flex items-center justify-center rounded-lg p-2
                       text-red-500 transition hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <AddTicketModal
          initialData={editingTicket}
          onClose={() => {
            setModalOpen(false);
            setEditingTicket(null);
          }}
          onSave={handleSave}
        />
      )}

      {ticketToDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center
      bg-neutral-950/50 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !deleting) {
              setTicketToDelete(null);
              setDeleteError(null);
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-ticket-title"
            className="w-full max-w-md overflow-hidden rounded-2xl
        bg-white shadow-2xl"
          >
            <div className="p-6 sm:p-7">
              <div className="mb-5 flex items-start justify-between">
                <div
                  className="flex h-14 w-14 items-center justify-center
            rounded-2xl bg-red-50 text-red-600"
                >
                  <Trash2 className="h-7 w-7" />
                </div>

                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => {
                    setTicketToDelete(null);
                    setDeleteError(null);
                  }}
                  className="rounded-lg p-2 text-neutral-400
              transition hover:bg-neutral-100 hover:text-neutral-700
              disabled:opacity-50"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <h2
                id="delete-ticket-title"
                className="text-xl font-bold text-neutral-900"
              >
                {t("confirmDeleteTicket")}
              </h2>

              <p className="mt-2 text-sm leading-6 text-neutral-500">
                {t("confirmDeleteTicketDesc")}
              </p>

              <div
                className="mt-5 flex items-center gap-3 rounded-xl
          border border-red-100 bg-red-50/70 p-3.5"
              >
                {ticketToDelete.logo ? (
                  <img
                    src={getImageUrl(ticketToDelete.logo)}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className="flex h-14 w-14 shrink-0 items-center
              justify-center rounded-lg bg-red-100 text-red-500"
                  >
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                )}

                <div className="min-w-0">
                  <p className="break-words font-semibold text-neutral-900">
                    {ticketToDelete.name}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {ticketToDelete.location || "-"}
                  </p>
                  <p className="mt-1 text-xs text-neutral-400">
                    {formatDateTime(ticketToDelete.date)}
                  </p>
                </div>
              </div>

              {deleteError && (
                <div
                  className="mt-4 rounded-lg border border-red-200
            bg-red-50 px-3 py-2.5 text-sm text-red-700"
                >
                  {deleteError}
                </div>
              )}

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => {
                    setTicketToDelete(null);
                    setDeleteError(null);
                  }}
                  className="flex-1 rounded-xl border border-neutral-200
              px-4 py-3 text-sm font-semibold text-neutral-700
              transition hover:bg-neutral-50 disabled:opacity-50"
                >
                  {t("cancel")}
                </button>

                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="flex-1 inline-flex items-center justify-center
              gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm
              font-semibold text-white shadow-sm transition
              hover:bg-red-700 disabled:cursor-not-allowed
              disabled:opacity-60"
                >
                  {deleting ? (
                    <>
                      <span
                        className="h-4 w-4 animate-spin rounded-full
                  border-2 border-white/40 border-t-white"
                      />
                      {t("Forgetting")}
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      {t("confirmDeletion")}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
