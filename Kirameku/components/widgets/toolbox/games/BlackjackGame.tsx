"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "game-blackjack-best";

type Suit = "♠" | "♥" | "♦" | "♣";
type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";

interface Card { suit: Suit; rank: Rank; hidden?: boolean; }

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS)
    for (const rank of RANKS)
      deck.push({ suit, rank });
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function cardValue(card: Card): number {
  if (card.hidden) return 0;
  if (card.rank === "A") return 11;
  if (["K", "Q", "J"].includes(card.rank)) return 10;
  return Number(card.rank);
}

function handValue(hand: Card[]): number {
  let total = 0;
  let aces = 0;
  for (const c of hand) {
    if (c.hidden) continue;
    total += cardValue(c);
    if (c.rank === "A") aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function isSoft(hand: Card[]): boolean {
  let total = 0;
  let aces = 0;
  for (const c of hand) {
    if (c.hidden) continue;
    total += cardValue(c);
    if (c.rank === "A") aces++;
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return aces > 0 && total <= 21;
}

const SUIT_COLORS: Record<Suit, string> = {
  "♠": "text-slate-800 dark:text-white",
  "♣": "text-slate-800 dark:text-white",
  "♥": "text-red-500",
  "♦": "text-red-500",
};

type GameState = "betting" | "playing" | "dealer" | "done";

export default function BlackjackGame() {
  const [deck, setDeck] = useState<Card[]>(createDeck);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [chips, setChips] = useState(1000);
  const [bet, setBet] = useState(100);
  const [best, setBest] = useState(() => {
    try { return Number(localStorage.getItem(STORAGE_KEY)) || 1000; } catch { return 1000; }
  });
  const [state, setState] = useState<GameState>("betting");
  const [message, setMessage] = useState("");
  const [deckRef, setDeckRef] = useState<Card[]>(createDeck);

  const saveBest = useCallback((c: number) => {
    setBest((b) => {
      const nb = Math.max(b, c);
      localStorage.setItem(STORAGE_KEY, String(nb));
      return nb;
    });
  }, []);

  const drawCard = useCallback((d: Card[], hidden = false): { card: Card; remaining: Card[] } => {
    if (d.length < 10) d = [...d, ...createDeck()];
    const card = { ...d[0], hidden };
    return { card, remaining: d.slice(1) };
  }, []);

  const deal = useCallback(() => {
    if (chips < bet) return;
    let d = [...deckRef];
    const ph: Card[] = [];
    const dh: Card[] = [];

    let result = drawCard(d); ph.push(result.card); d = result.remaining;
    result = drawCard(d); dh.push(result.card); d = result.remaining;
    result = drawCard(d); ph.push(result.card); d = result.remaining;
    result = drawCard(d, true); dh.push(result.card); d = result.remaining;

    setDeckRef(d);
    setPlayerHand(ph);
    setDealerHand(dh);
    setState("playing");
    setMessage("");

    // Check natural blackjack
    if (handValue(ph) === 21) {
      // Reveal dealer hidden card
      const revealedDh = dh.map((c) => ({ ...c, hidden: false }));
      setDealerHand(revealedDh);
      if (handValue(revealedDh) === 21) {
        setMessage("平局！");
        setState("done");
      } else {
        const win = Math.floor(bet * 1.5);
        setChips((c) => c + win);
        setMessage(`Blackjack! +${win}`);
        saveBest(chips + win);
        setState("done");
      }
    }
  }, [chips, bet, deckRef, drawCard, saveBest]);

  const hit = useCallback(() => {
    const { card, remaining } = drawCard(deckRef);
    const newHand = [...playerHand, card];
    setPlayerHand(newHand);
    setDeckRef(remaining);

    if (handValue(newHand) > 21) {
      // Bust
      const revealedDh = dealerHand.map((c) => ({ ...c, hidden: false }));
      setDealerHand(revealedDh);
      setChips((c) => c - bet);
      setMessage(`爆了！ -${bet}`);
      saveBest(chips - bet);
      setState("done");
    }
  }, [deckRef, playerHand, dealerHand, bet, chips, drawCard, saveBest]);

  const stand = useCallback(() => {
    // Reveal dealer card
    let dh = dealerHand.map((c) => ({ ...c, hidden: false }));
    setDealerHand(dh);
    setState("dealer");

    let d = [...deckRef];
    const dealerPlay = () => {
      while (handValue(dh) < 17) {
        const result = drawCard(d);
        dh = [...dh, result.card];
        d = result.remaining;
      }
      setDealerHand([...dh]);
      setDeckRef(d);

      // Determine winner
      const pv = handValue(playerHand);
      const dv = handValue(dh);
      let msg: string;
      let chipDelta: number;

      if (dv > 21) {
        msg = `庄家爆了！ +${bet}`;
        chipDelta = bet;
      } else if (pv > dv) {
        msg = `你赢了！ +${bet}`;
        chipDelta = bet;
      } else if (pv < dv) {
        msg = `你输了 -${bet}`;
        chipDelta = -bet;
      } else {
        msg = "平局！";
        chipDelta = 0;
      }

      setMessage(msg);
      setChips((c) => {
        const nc = c + chipDelta;
        saveBest(nc);
        return nc;
      });
      setState("done");
    };

    setTimeout(dealerPlay, 600);
  }, [deckRef, playerHand, dealerHand, bet, drawCard, saveBest]);

  const doubleDown = useCallback(() => {
    if (chips < bet * 2) return;
    const { card, remaining } = drawCard(deckRef);
    const newHand = [...playerHand, card];
    setPlayerHand(newHand);
    setDeckRef(remaining);
    const newBet = bet * 2;
    setBet(newBet);

    if (handValue(newHand) > 21) {
      const revealedDh = dealerHand.map((c) => ({ ...c, hidden: false }));
      setDealerHand(revealedDh);
      setChips((c) => c - newBet);
      setMessage(`爆了！ -${newBet}`);
      saveBest(chips - newBet);
      setState("done");
    } else {
      // Auto stand
      setTimeout(() => stand(), 300);
    }
  }, [deckRef, playerHand, dealerHand, bet, chips, drawCard, saveBest, stand]);

  const newRound = () => {
    setPlayerHand([]);
    setDealerHand([]);
    setState("betting");
    setMessage("");
    if (chips <= 0) {
      setChips(1000);
      setBet(100);
    }
  };

  const adjustBet = (delta: number) => {
    setBet((b) => Math.max(10, Math.min(chips, b + delta)));
  };

  const renderCard = (card: Card, i: number) => {
    if (card.hidden) {
      return (
        <div key={i} className="w-12 h-16 md:w-14 md:h-[72px] rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 border-2 border-blue-400 flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5" />
            <path d="M8 8h8M8 12h8M8 16h4" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      );
    }
    const color = SUIT_COLORS[card.suit];
    return (
      <div key={i} className="w-12 h-16 md:w-14 md:h-[72px] rounded-lg bg-white dark:bg-slate-100 border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-0 relative">
        <span className={`text-[10px] font-bold absolute top-1 left-1.5 ${color}`}>{card.rank}</span>
        <span className={`text-lg md:text-xl ${color}`}>{card.suit}</span>
        <span className={`text-[10px] font-bold absolute bottom-1 right-1.5 rotate-180 ${color}`}>{card.rank}</span>
      </div>
    );
  };

  const pv = handValue(playerHand);
  const dv = handValue(dealerHand);

  return (
    <div className="flex flex-col items-center gap-2 md:gap-3 w-full max-w-[280px] md:max-w-xs mx-auto select-none py-2">
      {/* Chips */}
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-lg p-1.5 text-center">
          <div className="text-[9px] text-green-600 font-bold">筹码</div>
          <div className="text-sm font-black text-green-700 dark:text-green-400">{chips}</div>
        </div>
        <div className="flex-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-1.5 text-center">
          <div className="text-[9px] text-amber-600 font-bold">下注</div>
          <div className="text-sm font-black text-amber-700 dark:text-amber-400">{bet}</div>
        </div>
        <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-lg p-1.5 text-center">
          <div className="text-[9px] text-slate-400 font-bold">最高</div>
          <div className="text-sm font-black text-amber-500">{best}</div>
        </div>
      </div>

      {/* Dealer */}
      <div className="w-full text-center space-y-1">
        <div className="text-[10px] text-slate-400 font-bold">庄家 {dealerHand.length > 0 ? `(${dv})` : ""}</div>
        <div className="flex items-center justify-center gap-1 min-h-[72px]">
          {dealerHand.map((c, i) => renderCard(c, i))}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`text-center px-3 py-1 rounded-lg text-xs font-bold ${
          message.includes("赢") || message.includes("Blackjack") || message.includes("爆了！ +")
            ? "bg-green-50 dark:bg-green-900/20 text-green-600"
            : message.includes("输") || message.includes("爆了！ -")
              ? "bg-red-50 dark:bg-red-900/20 text-red-600"
              : "bg-slate-100 dark:bg-slate-800 text-slate-600"
        }`}>
          {message}
        </div>
      )}

      {/* Player */}
      <div className="w-full text-center space-y-1">
        <div className="text-[10px] text-slate-400 font-bold">你的手牌 {playerHand.length > 0 ? `(${pv})` : ""}</div>
        <div className="flex items-center justify-center gap-1 min-h-[72px]">
          {playerHand.map((c, i) => renderCard(c, i))}
        </div>
      </div>

      {/* Actions */}
      {state === "betting" && (
        <div className="flex flex-col items-center gap-2 w-full">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => adjustBet(-10)} disabled={bet <= 10}
              className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-30 active:scale-95 transition-all">-</button>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 w-16 text-center">{bet}</span>
            <button type="button" onClick={() => adjustBet(10)} disabled={bet >= chips}
              className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-30 active:scale-95 transition-all">+</button>
          </div>
          <button type="button" onClick={deal}
            className="w-full py-2 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 active:scale-95 transition-all">
            发牌
          </button>
        </div>
      )}

      {state === "playing" && (
        <div className="flex gap-2 w-full">
          <button type="button" onClick={hit}
            className="flex-1 py-2 rounded-xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 active:scale-95 transition-all">
            要牌
          </button>
          <button type="button" onClick={stand}
            className="flex-1 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 active:scale-95 transition-all">
            停牌
          </button>
          <button type="button" onClick={doubleDown} disabled={chips < bet * 2}
            className="flex-1 py-2 rounded-xl bg-purple-500 text-white text-sm font-bold hover:bg-purple-600 disabled:opacity-40 active:scale-95 transition-all">
            加倍
          </button>
        </div>
      )}

      {state === "dealer" && (
        <div className="text-center text-sm text-slate-500 animate-pulse font-bold">庄家思考中...</div>
      )}

      {state === "done" && (
        <button type="button" onClick={newRound}
          className="w-full py-2 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 active:scale-95 transition-all">
          {chips <= 0 ? "重新开始" : "下一局"}
        </button>
      )}

      <div className="text-[10px] text-slate-400">接近21点为赢 · A=1/10 · JQK=10</div>
    </div>
  );
}
