export function GameActivationCard({
  gameLabel,
  isActive,
  onToggle,
  joinUrl,
  videotronUrl,
  qrDataUrl,
}: {
  gameLabel: string;
  isActive: boolean;
  onToggle: (checked: boolean) => void;
  joinUrl: string;
  videotronUrl: string;
  qrDataUrl: string;
}) {
  return (
    <section className="flex flex-wrap items-center gap-6 rounded-lg bg-slate-900 p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrDataUrl} alt={`QR join ${gameLabel}`} className="h-32 w-32 rounded-md bg-white p-1" />
      <div className="flex flex-col gap-2 text-sm">
        <p>
          Join URL:{" "}
          <a className="text-indigo-400 underline" href={joinUrl} target="_blank" rel="noreferrer">
            {joinUrl}
          </a>
        </p>
        <p>
          Videotron URL:{" "}
          <a className="text-indigo-400 underline" href={videotronUrl} target="_blank" rel="noreferrer">
            {videotronUrl}
          </a>
        </p>
        <label className="mt-2 flex items-center gap-2">
          <input type="checkbox" checked={isActive} onChange={(e) => onToggle(e.target.checked)} />
          {gameLabel} aktif untuk peserta
        </label>
      </div>
    </section>
  );
}
