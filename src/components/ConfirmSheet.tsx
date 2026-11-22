/**
 * Eigene Bestätigung statt window.confirm(): funktioniert auch dort, wo der Browser
 * Dialoge unterdrückt (z. B. in eingebetteten Vorschauen), und ist mit dem Daumen bedienbar.
 */
export function ConfirmSheet({
  title,
  text,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  title: string;
  text?: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={onCancel}>
      <div
        className="fade-up pb-safe mx-auto w-full max-w-xl rounded-t-3xl bg-white px-5 pt-5 shadow-lift sm:rounded-3xl sm:pb-5 dark:bg-stone-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-lg font-bold">
          {title}
        </h2>
        {text && <p className="mt-1 text-[15px] text-stone-600 dark:text-stone-300">{text}</p>}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button onClick={onCancel} className="min-h-13 rounded-2xl bg-stone-100 px-4 py-3 font-semibold active:scale-[0.98] dark:bg-stone-800">
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            autoFocus
            className={`min-h-13 rounded-2xl px-4 py-3 font-semibold text-white active:scale-[0.98] ${danger ? 'bg-rose-700' : 'bg-teal-700 dark:bg-teal-600'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
