"use client";

export function Board({
  board,
  onCellClick,
  disabled,
}: {
  board: (string | null)[];
  onCellClick?: (index: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-900 p-3">
      {board.map((cell, i) => (
        <button
          key={i}
          disabled={disabled || cell !== null || !onCellClick}
          onClick={() => onCellClick?.(i)}
          className={`flex h-20 w-20 items-center justify-center rounded-lg text-3xl font-bold ${
            cell === "X" ? "bg-indigo-500/20 text-indigo-300" : cell === "O" ? "bg-rose-500/20 text-rose-300" : "bg-slate-800"
          } ${onCellClick && !cell && !disabled ? "hover:bg-slate-700" : ""}`}
        >
          {cell}
        </button>
      ))}
    </div>
  );
}
