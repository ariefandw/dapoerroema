"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const REACTIONS = [
  "Purrrrrr~",
  "Mrrrrp?",
  "Mrrrow~",
  "Mew!",
  "Nyaa~",
  "Prrrt?",
];

const ACTIONS = [
  { text: "*happy tail wiggle*", mood: "happy" },
  { text: "*rolls over for belly rubs*", mood: "belly" },
  { text: "*headbutts your hand*", mood: "headbutt" },
  { text: "*slow blink of approval*", mood: "blink" },
  { text: "*aggressively kneads blanket*", mood: "knead" },
  { text: "*vibrating with joy*", mood: "vibrate" },
  { text: "*loaf mode activated*", mood: "loaf" },
  { text: "*purses engines to maximum*", mood: "purr" },
  { text: "*extends one toe bean*", mood: "bean" },
  { text: "*judges you silently*", mood: "judge" },
  { text: "*knocks thing off table*", mood: "chaos" },
  { text: "*zooms at 3am speed*", mood: "zoom" },
  { text: "*sits in your spot*", mood: "sit" },
  { text: "*demanding screams*", mood: "scream" },
];

const CAT_FACES: Record<string, string> = {
  idle: "😺",
  happy: "😻",
  headbutt: "🐱",
  blink: "😸",
  loaf: "🍞",
  purr: "😺",
  judge: "😼",
  chaos: "😈",
  zoom: "🏃",
  scream: "🙀",
  belly: "🥰",
  knead: "🐾",
  vibrate: "⚡",
  bean: "🤏",
  pat: "🥰",
};

const MILESTONES = [
  { count: 5, title: "Acquaintance", emoji: "🤝" },
  { count: 15, title: "Cat Lover", emoji: "❤️" },
  { count: 30, title: "Chonk Whisperer", emoji: "🐾" },
  { count: 50, title: "Supreme Bean Handler", emoji: "👑" },
  { count: 75, title: "Chonk Lord", emoji: "🏆" },
  { count: 100, title: "One With The Chonk", emoji: "🌟" },
];

const FLOATING_EMOJIS = ["✨", "💕", "🐾", "⭐", "💖", "🌸", "💛", "🧡"];

interface FloatingEmoji {
  id: number;
  x: number;
  emoji: string;
}

interface AchievementPopup {
  title: string;
  emoji: string;
}

export default function ChonkPage() {
  const [pats, setPats] = useState(0);
  const [catFace, setCatFace] = useState("idle");
  const [action, setAction] = useState("");
  const [sound, setSound] = useState("");
  const [isPatting, setIsPatting] = useState(false);
  const [happiness, setHappiness] = useState(0);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const [currentMilestone, setCurrentMilestone] = useState<AchievementPopup | null>(null);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const emojiIdRef = useRef(0);
  const faceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const milestoneTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Background color shifts with happiness
  const bgHue = Math.min(happiness * 3, 50);
  const bgSat = Math.min(happiness * 0.5, 30);

  const spawnEmojis = useCallback((count: number) => {
    const newEmojis: FloatingEmoji[] = [];
    for (let i = 0; i < count; i++) {
      newEmojis.push({
        id: emojiIdRef.current++,
        x: 20 + Math.random() * 60,
        emoji: FLOATING_EMOJIS[Math.floor(Math.random() * FLOATING_EMOJIS.length)],
      });
    }
    setFloatingEmojis((prev) => [...prev, ...newEmojis]);
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.slice(newEmojis.length));
    }, 1500);
  }, []);

  function handlePat() {
    const newPats = pats + 1;
    setPats(newPats);
    setHappiness((h) => Math.min(h + 2, 100));
    setIsPatting(true);
    setCatFace("pat");
    setShakeIntensity(Math.min(newPats * 0.2, 3));

    // Pick sound + action
    setSound(REACTIONS[Math.floor(Math.random() * REACTIONS.length)]);
    const act = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    setAction(act.text);

    // Face changes based on mood
    if (faceTimeoutRef.current) clearTimeout(faceTimeoutRef.current);
    faceTimeoutRef.current = setTimeout(() => {
      setCatFace(act.mood);
      faceTimeoutRef.current = setTimeout(() => setCatFace("idle"), 2000);
    }, 300);

    // Spawn floating emojis
    spawnEmojis(Math.min(1 + Math.floor(newPats / 20), 5));

    setTimeout(() => {
      setIsPatting(false);
      setShakeIntensity(0);
    }, 200);

    // Check milestones
    const milestone = MILESTONES.find((m) => m.count === newPats);
    if (milestone) {
      setCurrentMilestone(milestone);
      spawnEmojis(8);
      if (milestoneTimeoutRef.current) clearTimeout(milestoneTimeoutRef.current);
      milestoneTimeoutRef.current = setTimeout(() => setCurrentMilestone(null), 3000);
    }
  }

  // Chonk size grows with pats
  const chonkSize = Math.min(120 + pats * 0.5, 200);

  // Current rank
  const currentRank = [...MILESTONES].reverse().find((m) => pats >= m.count);

  // Next milestone
  const nextMilestone = MILESTONES.find((m) => pats < m.count);
  const progressToNext = nextMilestone
    ? ((pats - (MILESTONES[MILESTONES.indexOf(nextMilestone) - 1]?.count || 0)) /
        (nextMilestone.count - (MILESTONES[MILESTONES.indexOf(nextMilestone) - 1]?.count || 0))) *
      100
    : 100;

  return (
    <div
      className="min-h-[85vh] flex flex-col items-center justify-center gap-4 p-8 relative overflow-hidden select-none transition-colors duration-1000"
      style={{
        background: `radial-gradient(ellipse at center, hsl(${bgHue}, ${bgSat}%, 97%) 0%, transparent 70%)`,
      }}
    >
      {/* Floating emojis */}
      {floatingEmojis.map((e) => (
        <span
          key={e.id}
          className="absolute text-2xl animate-bounce pointer-events-none"
          style={{
            left: `${e.x}%`,
            bottom: "30%",
            animation: "float-up 1.5s ease-out forwards",
          }}
        >
          {e.emoji}
        </span>
      ))}

      {/* Achievement popup */}
      {currentMilestone && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-amber-400 text-amber-900 px-6 py-3 rounded-2xl shadow-lg shadow-amber-400/30 flex items-center gap-3 font-black text-lg">
            <span className="text-2xl">{currentMilestone.emoji}</span>
            <span>{currentMilestone.title}!</span>
          </div>
        </div>
      )}

      {/* Title */}
      <div className="text-center space-y-1 relative z-10">
        <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
          The Orange Chonk
        </h1>
        <p className="text-muted-foreground text-sm">
          pat pat the chonk
        </p>
      </div>

      {/* The Cat */}
      <div className="relative" style={{ transform: `translateY(${Math.sin(Date.now() / 800) * 2}px)` }}>
        <button
          onClick={handlePat}
          className="relative cursor-pointer focus:outline-none group"
          aria-label="Pat the chonk"
          style={{
            transform: isPatting
              ? `scale(0.92) rotate(${(Math.random() - 0.5) * shakeIntensity}deg)`
              : "scale(1)",
            transition: "transform 0.1s ease-out",
          }}
        >
          <div
            className="leading-none transition-all duration-300 hover:scale-105"
            style={{ fontSize: `${chonkSize}px` }}
          >
            {CAT_FACES[catFace] || "😺"}
          </div>

          {/* Glow ring */}
          <div
            className="absolute inset-0 rounded-full blur-xl -z-10 transition-opacity duration-500"
            style={{
              background: `radial-gradient(circle, rgba(251,191,36,${happiness / 200}) 0%, transparent 70%)`,
            }}
          />
        </button>

        {/* Speech bubble */}
        {(sound || action) && (
          <div
            key={pats}
            className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none"
            style={{ animation: "float-up 1.2s ease-out forwards" }}
          >
            <div className="bg-background/90 border border-border/50 rounded-xl px-3 py-1.5 shadow-md text-sm space-y-0.5">
              {sound && <p className="font-bold text-amber-600">{sound}</p>}
              {action && <p className="text-muted-foreground text-xs italic">{action}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Happiness bar */}
      <div className="w-48 space-y-1">
        <div className="flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
          <span>Happiness</span>
          <span>{happiness}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${happiness}%`,
              background: `linear-gradient(90deg, #f59e0b, #ef4444, #ec4899)`,
            }}
          />
        </div>
      </div>

      {/* Pat counter */}
      <div className="text-center space-y-0.5">
        <p className="text-5xl font-black tabular-nums">{pats}</p>
        <p className="text-xs text-muted-foreground uppercase tracking-widest">
          {pats === 0 ? "no pats yet..." : pats === 1 ? "pat given!" : "pats given!"}
        </p>
      </div>

      {/* Progress to next milestone */}
      {nextMilestone && (
        <div className="w-56 space-y-1">
          <div className="flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            <span>Next: {nextMilestone.emoji} {nextMilestone.title}</span>
            <span>{nextMilestone.count}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${progressToNext}%` }}
            />
          </div>
        </div>
      )}

      {/* Current rank badge */}
      {currentRank && (
        <div className="flex items-center gap-2 bg-background/50 border border-border/50 rounded-full px-4 py-1.5 shadow-sm">
          <span className="text-lg">{currentRank.emoji}</span>
          <span className="text-sm font-bold">{currentRank.title}</span>
        </div>
      )}

      {/* Collection of unlocked milestones */}
      {pats >= 5 && (
        <div className="flex flex-wrap justify-center gap-1 max-w-xs">
          {MILESTONES.filter((m) => pats >= m.count).map((m) => (
            <span
              key={m.count}
              className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold"
            >
              {m.emoji} {m.title}
            </span>
          ))}
        </div>
      )}

      {/* Tiny secret hint */}
      {pats >= 100 && (
        <p className="text-[10px] text-muted-foreground/40 mt-8">
          you have achieved enlightenment 🧘
        </p>
      )}

      {/* CSS animations */}
      <style jsx>{`
        @keyframes float-up {
          0% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-80px);
          }
        }
      `}</style>
    </div>
  );
}
