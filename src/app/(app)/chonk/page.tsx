"use client";

import { useState } from "react";

const REACTIONS = [
  "Purrrrrr~",
  "Mrrrrp?",
  "*happy tail wiggle*",
  "*rolls over for belly rubs*",
  "*headbutts your hand*",
  "*slow blink of approval*",
  "*aggressively kneads blanket*",
  "Mrrrow~",
  "*vibrating with joy*",
  "*loaf mode activated*",
];

export default function ChonkPage() {
  const [pats, setPats] = useState(0);
  const [reaction, setReaction] = useState("");
  const [isPatting, setIsPatting] = useState(false);

  function handlePat() {
    setPats((p) => p + 1);
    setIsPatting(true);
    setReaction(REACTIONS[Math.floor(Math.random() * REACTIONS.length)]);
    setTimeout(() => setIsPatting(false), 300);
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center gap-6 p-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black tracking-tight">
          The Orange Chonk
        </h1>
        <p className="text-muted-foreground text-sm">
          pat pat the chonk 🐈
        </p>
      </div>

      <button
        onClick={handlePat}
        className="relative select-none cursor-pointer focus:outline-none"
        aria-label="Pat the chonk"
      >
        <div
          className={`text-[120px] leading-none transition-transform duration-150 ${
            isPatting ? "scale-110" : "scale-100"
          } hover:scale-105 active:scale-95`}
        >
          🐈
        </div>
        {reaction && (
          <span
            key={pats}
            className="absolute -top-4 left-1/2 -translate-x-1/2 text-sm font-bold text-amber-500 animate-bounce whitespace-nowrap"
          >
            {reaction}
          </span>
        )}
      </button>

      <div className="text-center space-y-1">
        <p className="text-4xl font-black tabular-nums">{pats}</p>
        <p className="text-xs text-muted-foreground uppercase tracking-widest">
          {pats === 0
            ? "no pats yet..."
            : pats === 1
            ? "pat given!"
            : "pats given!"}
        </p>
      </div>

      {pats >= 10 && (
        <p className="text-sm text-amber-500 font-bold animate-pulse">
          🏆 The chonk is pleased.
        </p>
      )}

      {pats >= 50 && (
        <p className="text-xs text-muted-foreground">
          You have unlocked: <span className="font-bold">Certified Chonk Whisperer</span>
        </p>
      )}
    </div>
  );
}
