"use client";

import { useEffect, useMemo, useState } from "react";
import MathBlock from "@/components/primitives/MathBlock";

/* ------------------------------------------------------------------ */
/*  Core minimax engine                                                */
/* ------------------------------------------------------------------ */

type Mark = "X" | "O";
type Cell = Mark | null;
type Board = Cell[]; // length 9

const WIN_LINES: number[][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],            // diagonals
];

function getWinningLine(board: Board): number[] | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return line;
  }
  return null;
}

function checkWinner(board: Board): Mark | null {
  const line = getWinningLine(board);
  return line ? (board[line[0]] as Mark) : null;
}

function isFull(board: Board): boolean {
  return board.every((c) => c !== null);
}

function availableMoves(board: Board): number[] {
  const moves: number[] = [];
  board.forEach((c, i) => {
    if (c === null) moves.push(i);
  });
  return moves;
}

/**
 * Classic minimax with alpha-beta pruning.
 * X is the maximizer, O is the minimizer.
 * Scores are depth-adjusted so the agent prefers the fastest win
 * and the slowest loss: +10 - depth for an X win, depth - 10 for an O win, 0 for a draw.
 */
function minimax(
  board: Board,
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number
): number {
  const winner = checkWinner(board);
  if (winner === "X") return 10 - depth;
  if (winner === "O") return depth - 10;
  if (isFull(board)) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (const move of availableMoves(board)) {
      board[move] = "X";
      best = Math.max(best, minimax(board, depth + 1, false, alpha, beta));
      board[move] = null;
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of availableMoves(board)) {
      board[move] = "O";
      best = Math.min(best, minimax(board, depth + 1, true, alpha, beta));
      board[move] = null;
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

interface ChildEval {
  move: number;
  board: Board;
  score: number;
}

/** Evaluate every legal reply to `board` for `player`, one ply deep, then minimax below it. */
function getChildEvaluations(board: Board, player: Mark): ChildEval[] {
  return availableMoves(board).map((move) => {
    const next = board.slice();
    next[move] = player;
    const winner = checkWinner(next);
    let score: number;
    if (winner === "X") score = 10 - 1;
    else if (winner === "O") score = 1 - 10;
    else if (isFull(next)) score = 0;
    else score = minimax(next.slice(), 1, player === "O", -Infinity, Infinity);
    return { move, board: next, score };
  });
}

function bestScoreFor(player: Mark, evals: ChildEval[]): number {
  return player === "X"
    ? Math.max(...evals.map((e) => e.score))
    : Math.min(...evals.map((e) => e.score));
}

/* ------------------------------------------------------------------ */
/*  Small presentational pieces                                       */
/* ------------------------------------------------------------------ */

function Glyph({ mark, className = "" }: { mark: Cell; className?: string }) {
  if (!mark) return null;
  const gradId = mark === "X" ? "gradX" : "gradO";
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <defs>
        <linearGradient id="gradX" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff5f9e" />
          <stop offset="100%" stopColor="#ff9d5c" />
        </linearGradient>
        <linearGradient id="gradO" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22e5c9" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      {mark === "X" ? (
        <path
          d="M5 5L19 19M19 5L5 19"
          stroke={`url(#${gradId})`}
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      ) : (
        <circle cx="12" cy="12" r="8" stroke={`url(#${gradId})`} strokeWidth="2.6" />
      )}
    </svg>
  );
}

/** Small non-interactive board thumbnail, used inside the tree explorer. */
function MiniBoard({
  board,
  highlight,
  size = 64,
}: {
  board: Board;
  highlight?: number;
  size?: number;
}) {
  return (
    <div
      className="grid grid-cols-3 gap-[3px] rounded-lg bg-background-secondary p-[3px] ring-1 ring-border"
      style={{ width: size, height: size }}
    >
      {board.map((cell, i) => (
        <div
          key={i}
          className={`flex items-center justify-center rounded-[4px] transition-colors ${i === highlight
            ? "bg-gradient-to-br from-[#ffd166]/20 to-transparent ring-1 ring-[#ffd166]/50"
            : "bg-surface"
            }`}
        >
          <Glyph mark={cell} className="w-[58%] h-[58%]" />
        </div>
      ))}
    </div>
  );
}

function scoreTextClass(score: number): string {
  if (score > 0) return "text-[#ff5f9e]";
  if (score < 0) return "text-[#22e5c9]";
  return "text-foreground-muted";
}

function scorePillClass(score: number): string {
  if (score > 0) return "bg-[#ff5f9e]/15 ring-[#ff5f9e]/30";
  if (score < 0) return "bg-[#22e5c9]/15 ring-[#22e5c9]/30";
  return "bg-surface ring-border";
}

function scoreLabel(score: number): string {
  return score > 0 ? `+${score}` : `${score}`;
}

/** Percent-space centers for a 0..3 x 0..3 grid, used to draw the winning line overlay. */
function cellCenter(i: number): [number, number] {
  return [(i % 3) + 0.5, Math.floor(i / 3) + 0.5];
}

/* ------------------------------------------------------------------ */
/*  Generic two-player search engine (reused by every mini-game)      */
/* ------------------------------------------------------------------ */

/** Depth-limited alpha-beta search over an arbitrary game state. */
function alphaBeta<S, M>(
  state: S,
  depth: number,
  maximizing: boolean,
  getMoves: (s: S) => M[],
  applyMove: (s: S, m: M) => S,
  isTerminal: (s: S) => boolean,
  evaluate: (s: S) => number,
  alpha = -Infinity,
  beta = Infinity
): number {
  if (depth === 0 || isTerminal(state)) return evaluate(state);
  const moves = getMoves(state);
  if (moves.length === 0) return evaluate(state);
  if (maximizing) {
    let best = -Infinity;
    for (const m of moves) {
      const val = alphaBeta(applyMove(state, m), depth - 1, false, getMoves, applyMove, isTerminal, evaluate, alpha, beta);
      if (val > best) best = val;
      if (best > alpha) alpha = best;
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) {
      const val = alphaBeta(applyMove(state, m), depth - 1, true, getMoves, applyMove, isTerminal, evaluate, alpha, beta);
      if (val < best) best = val;
      if (best < beta) beta = best;
      if (beta <= alpha) break;
    }
    return best;
  }
}

/** Picks the best move for `player` (maximizing = true chooses the highest score). */
function chooseBestMove<S, M>(
  state: S,
  maximizing: boolean,
  depth: number,
  getMoves: (s: S) => M[],
  applyMove: (s: S, m: M) => S,
  isTerminal: (s: S) => boolean,
  evaluate: (s: S) => number
): M | null {
  const moves = getMoves(state);
  if (moves.length === 0) return null;
  let bestMove = moves[0];
  let bestVal = maximizing ? -Infinity : Infinity;
  for (const m of moves) {
    const val = alphaBeta(applyMove(state, m), depth - 1, !maximizing, getMoves, applyMove, isTerminal, evaluate);
    if (maximizing ? val > bestVal : val < bestVal) {
      bestVal = val;
      bestMove = m;
    }
  }
  return bestMove;
}

/* ------------------------------------------------------------------ */
/*  Shared presentational pieces for the mini-game arcade             */
/* ------------------------------------------------------------------ */

/** A generic colored game piece for two-player board games. */
function Piece({
  player,
  className = "",
  king = false,
}: {
  player: 1 | 2 | null;
  className?: string;
  king?: boolean;
}) {
  if (!player) return null;
  return (
    <span
      className={`relative block rounded-full shadow-sm ${player === 1
        ? "bg-gradient-to-br from-[#ff5f9e] to-[#ff9d5c]"
        : "bg-gradient-to-br from-[#22e5c9] to-[#3b82f6]"
        } ${className}`}
    >
      {king && (
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white/90">
          Q
        </span>
      )}
    </span>
  );
}

const P1_DOT = "h-2 w-2 rounded-full bg-gradient-to-br from-[#ff5f9e] to-[#ff9d5c]";
const P2_DOT = "h-2 w-2 rounded-full bg-gradient-to-br from-[#22e5c9] to-[#3b82f6]";

/** Shared chrome for every mini-game: header, rules card, board card. */
function GameShell({
  eyebrow,
  title,
  description,
  status,
  thinking,
  onReset,
  children,
  info,
  p1Label = "you",
  p2Label = "agent",
}: {
  eyebrow: string;
  title: string;
  description: string;
  status: string;
  thinking?: boolean;
  onReset: () => void;
  children: React.ReactNode;
  info: React.ReactNode;
  p1Label?: string;
  p2Label?: string;
}) {
  return (
    <>
      <div className="rise-in mb-8">
        <p className="font-score text-xs uppercase tracking-[0.3em] text-accent font-semibold">
          {eyebrow}
        </p>
        <h2 className="font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h2>
        <p className="mt-3 max-w-2xl text-foreground-muted">{description}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="rise-in widget-card backdrop-blur-xl order-1">
          <div className="mb-5 flex items-center justify-between">
            <span className="font-score text-sm text-foreground-muted">
              {status}
              {thinking && (
                <span className="ml-1.5 inline-flex gap-[3px] align-middle">
                  <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
              )}
            </span>
            <button
              onClick={onReset}
              className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent hover:bg-surface-hover"
            >
              Reset
            </button>
          </div>

          {children}

          <p className="mt-5 flex items-center gap-2 text-xs leading-relaxed text-foreground-subtle">
            <span className="inline-flex items-center gap-1 font-medium">
              <span className={P1_DOT} />
              {p1Label}
            </span>
            <span className="text-foreground-subtle/50">vs</span>
            <span className="inline-flex items-center gap-1 font-medium">
              <span className={P2_DOT} />
              {p2Label}
            </span>
          </p>
        </div>

        <div className="rise-in widget-card backdrop-blur-xl order-2">
          <h3 className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-foreground-muted mb-3">
            How it works
          </h3>
          <div className="text-sm leading-relaxed text-foreground-subtle space-y-2.5">{info}</div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  1. Tic-Tac-Toe — full minimax + search tree explorer              */
/* ------------------------------------------------------------------ */

const TTT_EMPTY: Board = Array(9).fill(null);
const TTT_HUMAN: Mark = "X";
const TTT_AGENT: Mark = "O";

function TicTacToeGame() {
  const [board, setBoard] = useState<Board>(TTT_EMPTY);
  const [turn, setTurn] = useState<Mark>("X");
  const [thinking, setThinking] = useState(false);
  const [explorePath, setExplorePath] = useState<number[]>([]);
  const [lineDrawn, setLineDrawn] = useState(false);

  const winningLine = getWinningLine(board);
  const winner = winningLine ? (board[winningLine[0]] as Mark) : null;
  const draw = !winner && isFull(board);
  const over = Boolean(winner) || draw;

  useEffect(() => {
    setExplorePath([]);
  }, [board]);

  useEffect(() => {
    setLineDrawn(false);
    if (winningLine) {
      const t = setTimeout(() => setLineDrawn(true), 60);
      return () => clearTimeout(t);
    }
  }, [winningLine]);

  useEffect(() => {
    if (over || turn !== TTT_AGENT) return;
    setThinking(true);
    const t = setTimeout(() => {
      const evals = getChildEvaluations(board, TTT_AGENT);
      const best = bestScoreFor(TTT_AGENT, evals);
      const choice = evals.find((e) => e.score === best)!;
      setBoard(choice.board);
      setTurn(TTT_HUMAN);
      setThinking(false);
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, turn, over]);

  function playCell(i: number) {
    if (over || turn !== TTT_HUMAN || board[i] !== null || thinking) return;
    const next = board.slice();
    next[i] = TTT_HUMAN;
    setBoard(next);
    setTurn(TTT_AGENT);
  }

  function reset() {
    setBoard(TTT_EMPTY);
    setTurn("X");
    setExplorePath([]);
  }

  const { nodeBoard, nodePlayer } = useMemo(() => {
    let b = board.slice();
    let p: Mark = turn;
    for (const move of explorePath) {
      b = b.slice();
      b[move] = p;
      p = p === "X" ? "O" : "X";
    }
    return { nodeBoard: b, nodePlayer: p };
  }, [board, turn, explorePath]);

  const nodeWinner = checkWinner(nodeBoard);
  const nodeDraw = !nodeWinner && isFull(nodeBoard);
  const nodeOver = Boolean(nodeWinner) || nodeDraw;

  const children = useMemo(
    () => (nodeOver ? [] : getChildEvaluations(nodeBoard, nodePlayer)),
    [nodeBoard, nodePlayer, nodeOver]
  );
  const sortedChildren = useMemo(
    () => children.slice().sort((a, b) => a.move - b.move),
    [children]
  );
  const bestChildScore = children.length ? bestScoreFor(nodePlayer, children) : null;

  let status: string;
  if (winner) status = winner === TTT_HUMAN ? "You win! \u2728" : "Agent wins.";
  else if (draw) status = "Draw.";
  else if (thinking) status = "Agent is searching\u2026";
  else status = turn === TTT_HUMAN ? "Your move" : "Agent's move";

  let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
  if (winningLine) {
    [x1, y1] = cellCenter(winningLine[0]);
    [x2, y2] = cellCenter(winningLine[2]);
  }

  return (
    <>
      <div className="rise-in mb-8">
        <p className="font-score text-xs uppercase tracking-[0.3em] text-accent font-semibold">
          Game Playing
        </p>
        <h2 className="font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          ❌⭕ Tic-Tac-Toe
        </h2>
        <p className="mt-3 max-w-2xl text-foreground-muted">
          Play against an agent that never loses, then follow its reasoning branch by branch
          through the fully scored search tree.
        </p>
      </div>

      <div className="rise-in widget-card mb-8">
        <div className="widget-card__title">The Minimax Value</div>
        <p className="text-sm text-foreground-muted mb-3">
          The agent evaluates every possible future via a recursive value function:
        </p>
        <MathBlock tex={String.raw`V(s) = \begin{cases} \text{Utility}(s) & \text{if } s \text{ is terminal} \\ \max_{a} V(\text{Result}(s,a)) & \text{if Player}(s) = \text{MAX} \\ \min_{a} V(\text{Result}(s,a)) & \text{if Player}(s) = \text{MIN} \end{cases}`} />
        <p className="text-xs text-foreground-subtle mt-3">
          <span className="font-semibold text-[#ff5f9e]">MAX (X)</span> aims for{" "}
          <span className="font-score font-bold">+10</span> while{" "}
          <span className="font-semibold text-[#22e5c9]">MIN (O)</span> aims for{" "}
          <span className="font-score font-bold">&minus;10</span>. Depth is subtracted so the
          agent prefers the fastest win.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]">
        <div className="rise-in widget-card backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between">
            <span className="font-score text-sm text-foreground-muted">
              {status}
              {thinking && (
                <span className="ml-1.5 inline-flex gap-[3px] align-middle">
                  <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
              )}
            </span>
            <button
              onClick={reset}
              className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent hover:bg-surface-hover"
            >
              Reset
            </button>
          </div>

          <div className="relative">
            <div className="grid grid-cols-3 gap-2.5">
              {board.map((cell, i) => (
                <button
                  key={i}
                  onClick={() => playCell(i)}
                  disabled={over || turn !== TTT_HUMAN || cell !== null || thinking}
                  className={`group flex aspect-square items-center justify-center rounded-xl border transition disabled:cursor-default ${winningLine?.includes(i)
                    ? "border-[#ffd166]/60 bg-[#ffd166]/10"
                    : "border-border bg-surface hover:enabled:border-accent/40 hover:enabled:bg-surface-hover"
                    }`}
                >
                  {cell && <Glyph mark={cell} className="pop-in h-10 w-10" />}
                </button>
              ))}
            </div>

            {winningLine && (
              <svg
                viewBox="0 0 3 3"
                className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
              >
                <defs>
                  <linearGradient id="winLine" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ffd166" />
                    <stop offset="100%" stopColor="#ff5f9e" />
                  </linearGradient>
                </defs>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="url(#winLine)"
                  strokeWidth={0.09}
                  strokeLinecap="round"
                  pathLength={1}
                  style={{
                    filter: "drop-shadow(0 0 6px rgba(255,209,102,0.8))",
                    strokeDasharray: 1,
                    strokeDashoffset: lineDrawn ? 0 : 1,
                    transition: "stroke-dashoffset 0.5s ease-out",
                  }}
                />
              </svg>
            )}
          </div>

          <p className="mt-5 flex items-center gap-2 text-xs leading-relaxed text-foreground-subtle">
            <span className="inline-flex items-center gap-1 font-medium">
              <span className="h-2 w-2 rounded-full bg-gradient-to-br from-[#ff5f9e] to-[#ff9d5c]" />
              you (X)
            </span>
            <span className="text-foreground-subtle/50">vs</span>
            <span className="inline-flex items-center gap-1 font-medium">
              <span className="h-2 w-2 rounded-full bg-gradient-to-br from-[#22e5c9] to-[#3b82f6]" />
              agent (O)
            </span>
          </p>
        </div>

        <div className="rise-in widget-card backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-foreground-muted">
              Search tree
            </h2>
            {explorePath.length > 0 && (
              <button
                onClick={() => setExplorePath([])}
                className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold transition hover:border-accent hover:bg-surface-hover"
              >
                Back to current move
              </button>
            )}
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-1 font-score text-xs text-foreground-muted">
            <button
              onClick={() => setExplorePath([])}
              className={`rounded px-1.5 py-0.5 transition hover:text-accent ${explorePath.length === 0 ? "text-accent font-semibold" : ""
                }`}
            >
              current position
            </button>
            {explorePath.map((move, idx) => (
              <span key={idx} className="flex items-center gap-1">
                <span className="text-foreground-subtle/40">/</span>
                <button
                  onClick={() => setExplorePath(explorePath.slice(0, idx + 1))}
                  className={`rounded px-1.5 py-0.5 transition hover:text-accent ${idx === explorePath.length - 1 ? "text-accent font-semibold" : ""
                    }`}
                >
                  cell {move}
                </button>
              </span>
            ))}
          </div>

          <div className="mb-2 flex items-center gap-5">
            <MiniBoard board={nodeBoard} size={92} />
            <div>
              <p className="font-semibold text-lg">
                {nodeWinner
                  ? `${nodeWinner} wins this line \u2728`
                  : nodeDraw
                    ? "This line is a draw"
                    : `${nodePlayer} to move here`}
              </p>
              {!nodeOver && (
                <p className="mt-1 text-xs text-foreground-muted">
                  {nodePlayer === "X" ? "Maximizing" : "Minimizing"} player &mdash; choosing
                  the {nodePlayer === "X" ? "highest" : "lowest"} scoring reply below.
                </p>
              )}
            </div>
          </div>

          {!nodeOver && (
            <>
              <div className="mt-7 flex justify-center">
                <div className="h-6 w-px bg-gradient-to-b from-border-strong to-transparent" />
              </div>
              <div className="relative -mt-px flex flex-wrap justify-center gap-x-4 gap-y-6 border-t border-border pt-6">
                {sortedChildren.map((child) => {
                  const isOptimal = child.score === bestChildScore;
                  return (
                    <button
                      key={child.move}
                      onClick={() => setExplorePath([...explorePath, child.move])}
                      className="group relative flex flex-col items-center gap-2"
                    >
                      <span className="absolute -top-6 h-6 w-px bg-gradient-to-b from-border-strong to-transparent" />
                      <div
                        className={`flex flex-col items-center gap-2 rounded-xl border p-2.5 transition ${isOptimal
                          ? "border-[#ffd166]/50 bg-[#ffd166]/[0.06] shadow-[0_0_25px_-8px_rgba(255,209,102,0.5)]"
                          : "border-border bg-surface"
                          } group-hover:border-accent/40 group-hover:bg-surface-hover`}
                      >
                        <MiniBoard board={child.board} highlight={child.move} size={64} />
                        <span
                          className={`font-score rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${scorePillClass(
                            child.score
                          )} ${scoreTextClass(child.score)}`}
                        >
                          {scoreLabel(child.score)}
                        </span>
                        {isOptimal && (
                          <span className="text-[10px] font-semibold tracking-wide text-warning">
                            optimal
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="mt-7 border-t border-border pt-5 text-xs leading-relaxed text-foreground-subtle">
            Scores run from <span className="font-score font-bold text-[#ff5f9e]">+10</span>{" "}
            (fastest win for X) to{" "}
            <span className="font-score font-bold text-[#22e5c9]">&minus;10</span> (fastest
            win for O), with <span className="font-score font-bold text-foreground-muted">0</span> a
            drawn line. Click any reply to descend a level and see how its own replies were
            scored.
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  2. Nim — optimal play via the nim-sum                             */
/* ------------------------------------------------------------------ */

const NIM_START = [3, 5, 7];

function nimSum(piles: number[]): number {
  return piles.reduce((a, b) => a ^ b, 0);
}

/** Optimal Nim move: returns the pile index to move to and the resulting size. */
function nimBestMove(piles: number[]): { pile: number; to: number } {
  const sum = nimSum(piles);
  if (sum !== 0) {
    for (let i = 0; i < piles.length; i++) {
      const target = piles[i] ^ sum;
      if (target < piles[i]) return { pile: i, to: target };
    }
  }
  // Losing position — just take one stone from the largest pile.
  let biggest = 0;
  for (let i = 1; i < piles.length; i++) if (piles[i] > piles[biggest]) biggest = i;
  return { pile: biggest, to: Math.max(0, piles[biggest] - 1) };
}

function NimGame() {
  const [piles, setPiles] = useState<number[]>(NIM_START);
  const [turn, setTurn] = useState<1 | 2>(1);
  const [thinking, setThinking] = useState(false);

  const total = piles.reduce((a, b) => a + b, 0);
  const over = total === 0;
  // The player who took the last stone (i.e. the previous mover) wins.
  const winner: 1 | 2 | null = over ? (turn === 1 ? 2 : 1) : null;

  useEffect(() => {
    if (over || turn !== 2) return;
    setThinking(true);
    const t = setTimeout(() => {
      const { pile, to } = nimBestMove(piles);
      const next = piles.slice();
      next[pile] = to;
      setPiles(next);
      setTurn(1);
      setThinking(false);
    }, 550);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [piles, turn, over]);

  function takeFrom(pileIdx: number, stoneIdx: number) {
    if (over || turn !== 1 || thinking) return;
    const next = piles.slice();
    next[pileIdx] = stoneIdx; // remove this stone and every stone after it
    setPiles(next);
    setTurn(2);
  }

  function reset() {
    setPiles(NIM_START);
    setTurn(1);
  }

  let status: string;
  if (winner) status = winner === 1 ? "You win! \u2728" : "Agent wins.";
  else if (thinking) status = "Agent is calculating\u2026";
  else status = turn === 1 ? "Your move \u2014 click stones to remove them" : "Agent's move";

  return (
    <GameShell
      eyebrow="Combinatorial Game Theory"
      title="🪵 Nim"
      description="Take turns removing stones from any one pile. Whoever takes the last stone wins. The agent plays the mathematically optimal strategy using the nim-sum."
      status={status}
      thinking={thinking}
      onReset={reset}
      info={
        <>
          <p>
            Click a stone to remove it <em>and every stone to its right</em> in that pile —
            that's how many stones you take on your turn.
          </p>
          <p>
            The agent computes the XOR (nim-sum) of all pile sizes. If it's nonzero, a winning
            move exists that makes it zero again — that's what it plays.
          </p>
          <p className="font-score text-xs text-foreground-subtle">
            nim-sum = {piles[0]} ⊕ {piles[1]} ⊕ {piles[2]} = {nimSum(piles)}
          </p>
        </>
      }
    >
      <div className="space-y-4">
        {piles.map((size, pileIdx) => (
          <div key={pileIdx} className="flex flex-wrap items-center gap-1.5">
            <span className="font-score w-14 shrink-0 text-xs text-foreground-subtle">
              pile {pileIdx + 1}
            </span>
            {Array.from({ length: size }).map((_, stoneIdx) => (
              <button
                key={stoneIdx}
                onClick={() => takeFrom(pileIdx, stoneIdx)}
                disabled={over || turn !== 1 || thinking}
                className="pop-in h-7 w-7 rounded-md border border-border bg-gradient-to-br from-[#ffd166] to-[#ff9d5c] shadow-sm transition hover:enabled:scale-110 hover:enabled:shadow-md disabled:cursor-default"
                title={`Take ${size - stoneIdx} stone${size - stoneIdx > 1 ? "s" : ""}`}
              />
            ))}
            {size === 0 && (
              <span className="text-xs text-foreground-subtle/50 italic">empty</span>
            )}
          </div>
        ))}
      </div>
    </GameShell>
  );
}

/* ------------------------------------------------------------------ */
/*  3. Hexapawn — tiny chess-like capture game on a 3×3 board         */
/* ------------------------------------------------------------------ */

type HexPlayer = "X" | "O";
type HexCell = HexPlayer | null;
type HexBoardT = HexCell[];
interface HexMove { from: number; to: number }
interface HexState { board: HexBoardT; turn: HexPlayer }

const HEX_START: HexBoardT = ["O", "O", "O", null, null, null, "X", "X", "X"];

function hexMoves(board: HexBoardT, player: HexPlayer): HexMove[] {
  const moves: HexMove[] = [];
  const opp: HexPlayer = player === "X" ? "O" : "X";
  const dRow = player === "X" ? -1 : 1;
  for (let i = 0; i < 9; i++) {
    if (board[i] !== player) continue;
    const row = Math.floor(i / 3), col = i % 3;
    const nr = row + dRow;
    if (nr < 0 || nr > 2) continue;
    const fwd = nr * 3 + col;
    if (board[fwd] === null) moves.push({ from: i, to: fwd });
    for (const dc of [-1, 1]) {
      const nc = col + dc;
      if (nc < 0 || nc > 2) continue;
      const cap = nr * 3 + nc;
      if (board[cap] === opp) moves.push({ from: i, to: cap });
    }
  }
  return moves;
}

function hexWinner(board: HexBoardT): HexPlayer | null {
  for (let i = 0; i < 3; i++) if (board[i] === "X") return "X";
  for (let i = 6; i < 9; i++) if (board[i] === "O") return "O";
  const xCount = board.filter((c) => c === "X").length;
  const oCount = board.filter((c) => c === "O").length;
  if (xCount === 0) return "O";
  if (oCount === 0) return "X";
  return null;
}

function hexIsTerminal(state: HexState): boolean {
  if (hexWinner(state.board)) return true;
  return hexMoves(state.board, state.turn).length === 0;
}

function hexApply(state: HexState, move: HexMove): HexState {
  const board = state.board.slice();
  board[move.to] = state.turn;
  board[move.from] = null;
  return { board, turn: state.turn === "X" ? "O" : "X" };
}

function hexEvaluate(state: HexState): number {
  const w = hexWinner(state.board);
  if (w === "X") return 100;
  if (w === "O") return -100;
  if (hexMoves(state.board, state.turn).length === 0) {
    // The player to move has no moves and therefore loses.
    return state.turn === "X" ? -100 : 100;
  }
  const xCount = state.board.filter((c) => c === "X").length;
  const oCount = state.board.filter((c) => c === "O").length;
  return (xCount - oCount) * 3;
}

function HexapawnGame() {
  const [board, setBoard] = useState<HexBoardT>(HEX_START);
  const [turn, setTurn] = useState<HexPlayer>("X");
  const [thinking, setThinking] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  const winner = hexWinner(board);
  const stalemate = !winner && hexMoves(board, turn).length === 0;
  const over = Boolean(winner) || stalemate;
  const effectiveWinner: HexPlayer | null = winner ?? (stalemate ? (turn === "X" ? "O" : "X") : null);

  useEffect(() => {
    if (over || turn !== "O") return;
    setThinking(true);
    const t = setTimeout(() => {
      const state: HexState = { board, turn: "O" };
      const move = chooseBestMove(
        state, false, 12,
        (s) => hexMoves(s.board, s.turn),
        hexApply, hexIsTerminal, hexEvaluate
      );
      if (move) setBoard(hexApply(state, move).board);
      setTurn("X");
      setThinking(false);
    }, 550);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, turn, over]);

  const legalForSelected = useMemo(
    () => (selected === null ? [] : hexMoves(board, "X").filter((m) => m.from === selected)),
    [board, selected]
  );

  function click(i: number) {
    if (over || turn !== "X" || thinking) return;
    if (selected === null) {
      if (board[i] === "X") setSelected(i);
      return;
    }
    const move = legalForSelected.find((m) => m.to === i);
    if (move) {
      setBoard(hexApply({ board, turn: "X" }, move).board);
      setTurn("O");
      setSelected(null);
    } else if (board[i] === "X") {
      setSelected(i);
    } else {
      setSelected(null);
    }
  }

  function reset() {
    setBoard(HEX_START);
    setTurn("X");
    setSelected(null);
  }

  let status: string;
  if (effectiveWinner) status = effectiveWinner === "X" ? "You win! \u2728" : "Agent wins.";
  else if (thinking) status = "Agent is searching\u2026";
  else status = turn === "X" ? "Your move" : "Agent's move";

  return (
    <GameShell
      eyebrow="Solved Game"
      title="⭐ Hexapawn"
      description="Pawns push forward one square or capture diagonally. Reach the far row, capture every enemy pawn, or trap your opponent with no moves — the agent has fully solved this tiny board."
      status={status}
      thinking={thinking}
      onReset={reset}
      info={
        <>
          <p>Pawns (you, bottom) move up; the agent's pawns move down.</p>
          <p>Click your own pawn, then click an empty square ahead or an enemy pawn diagonally ahead to capture it.</p>
          <p>You win by reaching the top row, capturing all agent pawns, or leaving the agent with no legal move.</p>
        </>
      }
    >
      <div className="mx-auto grid w-fit grid-cols-3 gap-2.5">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => click(i)}
            disabled={over || thinking}
            className={`flex h-16 w-16 items-center justify-center rounded-xl border transition disabled:cursor-default ${selected === i
              ? "border-accent bg-accent/10"
              : legalForSelected.some((m) => m.to === i)
                ? "border-[#ffd166]/60 bg-[#ffd166]/10"
                : "border-border bg-surface hover:enabled:border-accent/40"
              }`}
          >
            {cell && <Piece player={cell === "X" ? 1 : 2} className="pop-in h-9 w-9" />}
          </button>
        ))}
      </div>
    </GameShell>
  );
}

/* ------------------------------------------------------------------ */
/*  4. Coin Row Game — pick from either end, maximize your total      */
/* ------------------------------------------------------------------ */

const COIN_ROW = [5, 8, 2, 9, 3, 7, 4, 6];

function coinBestDiff(coins: number[], l: number, r: number, memo: Map<string, number>): number {
  if (l > r) return 0;
  const key = `${l},${r}`;
  const cached = memo.get(key);
  if (cached !== undefined) return cached;
  const pickLeft = coins[l] - coinBestDiff(coins, l + 1, r, memo);
  const pickRight = coins[r] - coinBestDiff(coins, l, r - 1, memo);
  const val = Math.max(pickLeft, pickRight);
  memo.set(key, val);
  return val;
}

function CoinRowGame() {
  const [l, setL] = useState(0);
  const [r, setR] = useState(COIN_ROW.length - 1);
  const [turn, setTurn] = useState<1 | 2>(1);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [thinking, setThinking] = useState(false);

  const over = l > r;
  const winner: 1 | 2 | "tie" | null = over
    ? p1Score > p2Score ? 1 : p2Score > p1Score ? 2 : "tie"
    : null;

  useEffect(() => {
    if (over || turn !== 2) return;
    setThinking(true);
    const t = setTimeout(() => {
      const memo = new Map<string, number>();
      const pickLeft = COIN_ROW[l] - coinBestDiff(COIN_ROW, l + 1, r, memo);
      const pickRight = COIN_ROW[r] - coinBestDiff(COIN_ROW, l, r - 1, memo);
      if (pickLeft >= pickRight) {
        setP2Score((s) => s + COIN_ROW[l]);
        setL(l + 1);
      } else {
        setP2Score((s) => s + COIN_ROW[r]);
        setR(r - 1);
      }
      setTurn(1);
      setThinking(false);
    }, 550);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [l, r, turn, over]);

  function pick(end: "l" | "r") {
    if (over || turn !== 1 || thinking) return;
    if (end === "l") {
      setP1Score((s) => s + COIN_ROW[l]);
      setL(l + 1);
    } else {
      setP1Score((s) => s + COIN_ROW[r]);
      setR(r - 1);
    }
    setTurn(2);
  }

  function reset() {
    setL(0);
    setR(COIN_ROW.length - 1);
    setTurn(1);
    setP1Score(0);
    setP2Score(0);
  }

  let status: string;
  if (winner === "tie") status = "It's a tie.";
  else if (winner === 1) status = "You win! \u2728";
  else if (winner === 2) status = "Agent wins.";
  else if (thinking) status = "Agent is calculating\u2026";
  else status = turn === 1 ? "Your move \u2014 pick an end" : "Agent's move";

  return (
    <GameShell
      eyebrow="Optimal Substructure"
      title="🪙 Coin Row Game"
      description="Coins are laid out in a row. Each turn, take the coin from either end and add its value to your score. The agent always plays the game-theoretically optimal end."
      status={status}
      thinking={thinking}
      onReset={reset}
      info={
        <>
          <p>
            Both players see every value. The agent computes, for every remaining sub-row, the
            best possible score <em>advantage</em> the mover can guarantee:
          </p>
          <p className="font-score text-xs">
            best(l,r) = max(coin[l] &minus; best(l+1,r), coin[r] &minus; best(l,r&minus;1))
          </p>
          <p>Whoever ends with the higher total wins.</p>
        </>
      }
    >
      <div className="mb-6 flex justify-center gap-8 font-score text-sm">
        <span>
          you: <span className="font-bold text-[#ff5f9e]">{p1Score}</span>
        </span>
        <span>
          agent: <span className="font-bold text-[#22e5c9]">{p2Score}</span>
        </span>
      </div>
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => pick("l")}
          disabled={over || turn !== 1 || thinking}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground-muted transition hover:enabled:border-accent hover:enabled:bg-surface-hover disabled:cursor-default disabled:opacity-40"
        >
          ◀ take left
        </button>
        <div className="flex gap-1.5">
          {COIN_ROW.map((v, i) => {
            const taken = i < l || i > r;
            const isEnd = (i === l || i === r) && !over;
            return (
              <div
                key={i}
                className={`flex h-14 w-11 items-center justify-center rounded-lg border font-score text-sm font-bold transition ${taken
                  ? "border-border/40 bg-surface/30 text-foreground-subtle/30"
                  : isEnd
                    ? "border-[#ffd166]/60 bg-[#ffd166]/10 text-foreground"
                    : "border-border bg-surface text-foreground-muted"
                  }`}
              >
                {v}
              </div>
            );
          })}
        </div>
        <button
          onClick={() => pick("r")}
          disabled={over || turn !== 1 || thinking}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground-muted transition hover:enabled:border-accent hover:enabled:bg-surface-hover disabled:cursor-default disabled:opacity-40"
        >
          take right ▶
        </button>
      </div>
    </GameShell>
  );
}

/* ------------------------------------------------------------------ */
/*  5. Pick-a-Number Game — the "15 game", isomorphic to tic-tac-toe  */
/* ------------------------------------------------------------------ */

// A magic square: every row, column and diagonal sums to 15.
const MAGIC_SQUARE = [2, 7, 6, 9, 5, 1, 4, 3, 8];

function PickANumberGame() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [turn, setTurn] = useState<Mark>("X");
  const [thinking, setThinking] = useState(false);

  const winningLine = getWinningLine(board);
  const winner = winningLine ? (board[winningLine[0]] as Mark) : null;
  const draw = !winner && isFull(board);
  const over = Boolean(winner) || draw;

  useEffect(() => {
    if (over || turn !== "O") return;
    setThinking(true);
    const t = setTimeout(() => {
      const evals = getChildEvaluations(board, "O");
      const best = bestScoreFor("O", evals);
      const choice = evals.find((e) => e.score === best)!;
      setBoard(choice.board);
      setTurn("X");
      setThinking(false);
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, turn, over]);

  function pick(i: number) {
    if (over || turn !== "X" || board[i] !== null || thinking) return;
    const next = board.slice();
    next[i] = "X";
    setBoard(next);
    setTurn("O");
  }

  function reset() {
    setBoard(Array(9).fill(null));
    setTurn("X");
  }

  function pickedNumbers(mark: Mark): number[] {
    return board.map((c, i) => (c === mark ? MAGIC_SQUARE[i] : null)).filter((n): n is number => n !== null);
  }

  let status: string;
  if (winner) status = winner === "X" ? "You win! \u2728 (three numbers sum to 15)" : "Agent wins.";
  else if (draw) status = "Draw \u2014 no line of three sums to 15.";
  else if (thinking) status = "Agent is thinking\u2026";
  else status = turn === "X" ? "Your move \u2014 pick a number" : "Agent's move";

  return (
    <GameShell
      eyebrow="Classic Puzzle"
      title="🔢 Pick-a-Number Game"
      description="Numbers 1–9 sit in a shared pool. Take turns claiming one. The first player whose three claimed numbers sum to exactly 15 wins."
      status={status}
      thinking={thinking}
      onReset={reset}
      info={
        <>
          <p>Every number 1–9 can only be claimed once, by either player.</p>
          <p>
            This game is secretly identical to tic-tac-toe: arrange 1–9 in a magic square and
            every winning triplet (summing to 15) becomes a straight line.
          </p>
          <p>
            Your numbers: <span className="font-score">{pickedNumbers("X").join(", ") || "—"}</span>
            <br />
            Agent's numbers: <span className="font-score">{pickedNumbers("O").join(", ") || "—"}</span>
          </p>
        </>
      }
    >
      <div className="mx-auto grid w-fit grid-cols-3 gap-2.5">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => pick(i)}
            disabled={over || turn !== "X" || cell !== null || thinking}
            className={`flex h-16 w-16 items-center justify-center rounded-xl border font-score text-xl font-bold transition disabled:cursor-default ${winningLine?.includes(i)
              ? "border-[#ffd166]/60 bg-[#ffd166]/10"
              : cell === "X"
                ? "border-[#ff5f9e]/40 bg-[#ff5f9e]/10 text-[#ff5f9e]"
                : cell === "O"
                  ? "border-[#22e5c9]/40 bg-[#22e5c9]/10 text-[#22e5c9]"
                  : "border-border bg-surface hover:enabled:border-accent/40 hover:enabled:bg-surface-hover text-foreground"
              }`}
          >
            {MAGIC_SQUARE[i]}
          </button>
        ))}
      </div>
    </GameShell>
  );
}

/* ------------------------------------------------------------------ */
/*  6. Three Men's Morris — place, then slide to make a line of 3     */
/* ------------------------------------------------------------------ */

type TmmMove = { type: "place"; to: number } | { type: "move"; from: number; to: number };
interface TmmState { board: Board; turn: Mark }

function tmmAdjacent(i: number): number[] {
  const row = Math.floor(i / 3), col = i % 3;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr, nc = col + dc;
      if (nr < 0 || nr > 2 || nc < 0 || nc > 2) continue;
      out.push(nr * 3 + nc);
    }
  }
  return out;
}

function tmmMoves(state: TmmState): TmmMove[] {
  const count = state.board.filter((c) => c === state.turn).length;
  if (count < 3) {
    return state.board
      .map((c, i) => (c === null ? ({ type: "place", to: i } as TmmMove) : null))
      .filter((m): m is TmmMove => m !== null);
  }
  const out: TmmMove[] = [];
  state.board.forEach((c, i) => {
    if (c !== state.turn) return;
    for (const adj of tmmAdjacent(i)) {
      if (state.board[adj] === null) out.push({ type: "move", from: i, to: adj });
    }
  });
  return out;
}

function tmmApply(state: TmmState, move: TmmMove): TmmState {
  const board = state.board.slice();
  if (move.type === "place") board[move.to] = state.turn;
  else {
    board[move.to] = state.turn;
    board[move.from] = null;
  }
  return { board, turn: state.turn === "X" ? "O" : "X" };
}

function tmmIsTerminal(state: TmmState): boolean {
  return Boolean(checkWinner(state.board)) || tmmMoves(state).length === 0;
}

function tmmEvaluate(state: TmmState): number {
  const w = checkWinner(state.board);
  if (w === "X") return 100;
  if (w === "O") return -100;
  const moves = tmmMoves(state);
  if (moves.length === 0) return state.turn === "X" ? -100 : 100;
  let score = state.board[4] === "X" ? 3 : state.board[4] === "O" ? -3 : 0;
  const xMobility = tmmMoves({ board: state.board, turn: "X" }).length;
  const oMobility = tmmMoves({ board: state.board, turn: "O" }).length;
  score += (xMobility - oMobility) * 0.5;
  return score;
}

const TMM_EMPTY: Board = Array(9).fill(null);

function ThreeMensMorrisGame() {
  const [board, setBoard] = useState<Board>(TMM_EMPTY);
  const [turn, setTurn] = useState<Mark>("X");
  const [thinking, setThinking] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  const winningLine = getWinningLine(board);
  const winner = winningLine ? (board[winningLine[0]] as Mark) : null;
  const state: TmmState = { board, turn };
  const stalemate = !winner && tmmMoves(state).length === 0;
  const over = Boolean(winner) || stalemate;
  const effectiveWinner: Mark | null = winner ?? (stalemate ? (turn === "X" ? "O" : "X") : null);
  const phase = board.filter((c) => c === "X").length < 3 || board.filter((c) => c === "O").length < 3 ? "placing" : "sliding";

  useEffect(() => {
    if (over || turn !== "O") return;
    setThinking(true);
    const t = setTimeout(() => {
      const move = chooseBestMove(state, false, 6, tmmMoves, tmmApply, tmmIsTerminal, tmmEvaluate);
      if (move) setBoard(tmmApply(state, move).board);
      setTurn("X");
      setThinking(false);
    }, 550);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, turn, over]);

  const myMoves = useMemo(() => (turn === "X" ? tmmMoves({ board, turn: "X" }) : []), [board, turn]);
  const legalTargets = selected === null ? [] : myMoves.filter((m) => m.type === "move" && m.from === selected).map((m: any) => m.to);

  function click(i: number) {
    if (over || turn !== "X" || thinking) return;
    if (phase === "placing") {
      if (board[i] === null) {
        setBoard(tmmApply(state, { type: "place", to: i }).board);
        setTurn("O");
      }
      return;
    }
    if (selected === null) {
      if (board[i] === "X") setSelected(i);
      return;
    }
    if (legalTargets.includes(i)) {
      setBoard(tmmApply(state, { type: "move", from: selected, to: i }).board);
      setTurn("O");
      setSelected(null);
    } else if (board[i] === "X") {
      setSelected(i);
    } else {
      setSelected(null);
    }
  }

  function reset() {
    setBoard(TMM_EMPTY);
    setTurn("X");
    setSelected(null);
  }

  let status: string;
  if (effectiveWinner) status = effectiveWinner === "X" ? "You win! \u2728" : "Agent wins.";
  else if (thinking) status = "Agent is thinking\u2026";
  else status = turn === "X" ? (phase === "placing" ? "Your move \u2014 place a piece" : "Your move \u2014 slide a piece") : "Agent's move";

  return (
    <GameShell
      eyebrow="Ancient Board Game"
      title="🔺 Three Men's Morris"
      description="Each player places 3 pieces, then slides them one step at a time along any line — including diagonals — trying to line up all three."
      status={status}
      thinking={thinking}
      onReset={reset}
      info={
        <>
          <p>Phase 1: take turns placing your 3 pieces on empty cells.</p>
          <p>Phase 2: click one of your pieces, then click an adjacent empty cell (any of the 8 directions) to slide it.</p>
          <p>First to line up all three pieces &mdash; row, column, or diagonal &mdash; wins.</p>
        </>
      }
    >
      <div className="mx-auto grid w-fit grid-cols-3 gap-2.5">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => click(i)}
            disabled={over || turn !== "X" || thinking}
            className={`flex h-16 w-16 items-center justify-center rounded-xl border transition disabled:cursor-default ${winningLine?.includes(i)
              ? "border-[#ffd166]/60 bg-[#ffd166]/10"
              : selected === i
                ? "border-accent bg-accent/10"
                : legalTargets.includes(i)
                  ? "border-[#ffd166]/60 bg-[#ffd166]/10"
                  : "border-border bg-surface hover:enabled:border-accent/40 hover:enabled:bg-surface-hover"
              }`}
          >
            {cell && <Piece player={cell === "X" ? 1 : 2} className="pop-in h-9 w-9" />}
          </button>
        ))}
      </div>
    </GameShell>
  );
}

/* ------------------------------------------------------------------ */
/*  7. Dots and Boxes — a 3×3 dot grid (four boxes)                   */
/* ------------------------------------------------------------------ */

interface DabState { edges: boolean[]; boxOwner: (1 | 2 | null)[]; turn: 1 | 2 }

const DAB_EDGE_COUNT = 12; // 6 horizontal + 6 vertical

function dabBoxCompleted(edges: boolean[], b: number): boolean {
  const r = Math.floor(b / 2), c = b % 2;
  const top = r * 2 + c;
  const bottom = (r + 1) * 2 + c;
  const left = 6 + r * 3 + c;
  const right = 6 + r * 3 + (c + 1);
  return edges[top] && edges[bottom] && edges[left] && edges[right];
}

function dabMoves(state: DabState): number[] {
  return state.edges.map((taken, i) => (taken ? -1 : i)).filter((i) => i >= 0);
}

function dabApply(state: DabState, edgeIdx: number): DabState {
  const edges = state.edges.slice();
  edges[edgeIdx] = true;
  const boxOwner = state.boxOwner.slice();
  let completed = false;
  for (let b = 0; b < 4; b++) {
    if (boxOwner[b] === null && dabBoxCompleted(edges, b)) {
      boxOwner[b] = state.turn;
      completed = true;
    }
  }
  return { edges, boxOwner, turn: completed ? state.turn : state.turn === 1 ? 2 : 1 };
}

function dabIsTerminal(state: DabState): boolean {
  return state.edges.every(Boolean);
}

function dabEvaluate(state: DabState): number {
  const p1 = state.boxOwner.filter((o) => o === 1).length;
  const p2 = state.boxOwner.filter((o) => o === 2).length;
  return (p1 - p2) * 10;
}

const DAB_START: DabState = { edges: Array(DAB_EDGE_COUNT).fill(false), boxOwner: Array(4).fill(null), turn: 1 };

function DotsAndBoxesGame() {
  const [state, setState] = useState<DabState>(DAB_START);
  const [thinking, setThinking] = useState(false);
  const over = dabIsTerminal(state);

  const p1Boxes = state.boxOwner.filter((o) => o === 1).length;
  const p2Boxes = state.boxOwner.filter((o) => o === 2).length;
  const winner = over ? (p1Boxes > p2Boxes ? 1 : p2Boxes > p1Boxes ? 2 : "tie") : null;

  useEffect(() => {
    if (over || state.turn !== 2) return;
    setThinking(true);
    const t = setTimeout(() => {
      const move = chooseBestMove(state, false, 5, dabMoves, dabApply, dabIsTerminal, dabEvaluate);
      if (move !== null && move !== undefined) setState(dabApply(state, move));
      setThinking(false);
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, over]);

  function playEdge(i: number) {
    if (over || state.turn !== 1 || state.edges[i] || thinking) return;
    setState(dabApply(state, i));
  }

  function reset() {
    setState(DAB_START);
  }

  let status: string;
  if (winner === "tie") status = "It's a tie.";
  else if (winner === 1) status = "You win! \u2728";
  else if (winner === 2) status = "Agent wins.";
  else if (thinking) status = "Agent is thinking\u2026";
  else status = state.turn === 1 ? "Your move \u2014 draw a line" : "Agent's move";

  const cols = ["22px", "54px", "22px", "54px", "22px"];

  return (
    <GameShell
      eyebrow="Territory Game"
      title="✏️ Dots and Boxes"
      description="Take turns drawing one line between two dots. Complete the fourth side of a box and you claim it — plus an extra turn. Most boxes wins."
      status={status}
      thinking={thinking}
      onReset={reset}
      info={
        <>
          <p>Click any open edge (line segment) to draw it.</p>
          <p>Completing a box colors it in your player color and gives you another turn immediately.</p>
          <p>
            Score &mdash; you: <span className="font-score font-bold text-[#ff5f9e]">{p1Boxes}</span>{" "}
            agent: <span className="font-score font-bold text-[#22e5c9]">{p2Boxes}</span>
          </p>
        </>
      }
    >
      <div
        className="mx-auto grid w-fit"
        style={{ gridTemplateColumns: cols.join(" "), gridTemplateRows: cols.join(" ") }}
      >
        {Array.from({ length: 25 }).map((_, idx) => {
          const gr = Math.floor(idx / 5), gc = idx % 5;
          if (gr % 2 === 0 && gc % 2 === 0) {
            return <div key={idx} className="h-[22px] w-[22px] rounded-full bg-foreground-subtle/60" />;
          }
          if (gr % 2 === 0 && gc % 2 === 1) {
            const r = gr / 2, c = (gc - 1) / 2;
            const eIdx = r * 2 + c;
            return (
              <button
                key={idx}
                onClick={() => playEdge(eIdx)}
                disabled={over || state.turn !== 1 || state.edges[eIdx] || thinking}
                className={`h-[22px] w-[54px] rounded transition disabled:cursor-default ${state.edges[eIdx] ? "bg-accent" : "bg-border hover:enabled:bg-accent/50"
                  }`}
              />
            );
          }
          if (gr % 2 === 1 && gc % 2 === 0) {
            const r = (gr - 1) / 2, c = gc / 2;
            const eIdx = 6 + r * 3 + c;
            return (
              <button
                key={idx}
                onClick={() => playEdge(eIdx)}
                disabled={over || state.turn !== 1 || state.edges[eIdx] || thinking}
                className={`h-[54px] w-[22px] rounded transition disabled:cursor-default ${state.edges[eIdx] ? "bg-accent" : "bg-border hover:enabled:bg-accent/50"
                  }`}
              />
            );
          }
          const r = (gr - 1) / 2, c = (gc - 1) / 2;
          const boxIdx = r * 2 + c;
          const owner = state.boxOwner[boxIdx];
          return (
            <div
              key={idx}
              className={`flex h-[54px] w-[54px] items-center justify-center rounded-md transition ${owner === 1
                ? "bg-[#ff5f9e]/20"
                : owner === 2
                  ? "bg-[#22e5c9]/20"
                  : "bg-transparent"
                }`}
            >
              {owner && <Piece player={owner} className="h-4 w-4 opacity-70" />}
            </div>
          );
        })}
      </div>
    </GameShell>
  );
}

/* ------------------------------------------------------------------ */
/*  8. Domineering — place dominoes until you can't                   */
/* ------------------------------------------------------------------ */

interface DomState { cells: (1 | 2 | null)[]; turn: 1 | 2 } // 1 = vertical (you), 2 = horizontal (agent)
interface DomMove { a: number; b: number }

function domMoves(state: DomState): DomMove[] {
  const out: DomMove[] = [];
  if (state.turn === 1) {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        const a = r * 4 + c, b = (r + 1) * 4 + c;
        if (state.cells[a] === null && state.cells[b] === null) out.push({ a, b });
      }
    }
  } else {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        const a = r * 4 + c, b = r * 4 + c + 1;
        if (state.cells[a] === null && state.cells[b] === null) out.push({ a, b });
      }
    }
  }
  return out;
}

function domApply(state: DomState, move: DomMove): DomState {
  const cells = state.cells.slice();
  cells[move.a] = state.turn;
  cells[move.b] = state.turn;
  return { cells, turn: state.turn === 1 ? 2 : 1 };
}

function domIsTerminal(state: DomState): boolean {
  return domMoves(state).length === 0;
}

function domEvaluate(state: DomState): number {
  if (domMoves(state).length === 0) {
    // The player to move has no domino to place and loses.
    return state.turn === 1 ? -100 : 100;
  }
  const vMoves = domMoves({ cells: state.cells, turn: 1 }).length;
  const hMoves = domMoves({ cells: state.cells, turn: 2 }).length;
  return (vMoves - hMoves) * 3;
}

const DOM_START: DomState = { cells: Array(16).fill(null), turn: 1 };

function DomineeringGame() {
  const [state, setState] = useState<DomState>(DOM_START);
  const [thinking, setThinking] = useState(false);
  const over = domIsTerminal(state);
  const winner: 1 | 2 | null = over ? (state.turn === 1 ? 2 : 1) : null;

  useEffect(() => {
    if (over || state.turn !== 2) return;
    setThinking(true);
    const t = setTimeout(() => {
      const move = chooseBestMove(state, false, 9, domMoves, domApply, domIsTerminal, domEvaluate);
      if (move) setState(domApply(state, move));
      else setState((s) => ({ ...s, turn: 1 })); // agent stuck, pass loss handled by `over`
      setThinking(false);
    }, 550);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, over]);

  function click(i: number) {
    if (over || state.turn !== 1 || thinking) return;
    const move = domMoves(state).find((m) => m.a === i || m.b === i);
    if (move) setState(domApply(state, move));
  }

  function reset() {
    setState(DOM_START);
  }

  let status: string;
  if (winner === 1) status = "You win \u2014 the agent has no move left! \u2728";
  else if (winner === 2) status = "Agent wins \u2014 you have no move left.";
  else if (thinking) status = "Agent is thinking\u2026";
  else status = "Your move \u2014 place a vertical domino";

  return (
    <GameShell
      eyebrow="Combinatorial Game Theory"
      title="🧱 Domineering"
      description="You place vertical dominoes, the agent places horizontal ones, on a 4×4 grid. Whoever runs out of room to move first loses."
      status={status}
      thinking={thinking}
      onReset={reset}
      info={
        <>
          <p>Click any empty cell to place your vertical domino there (it fills that cell and the one below it).</p>
          <p>The agent can only place horizontal dominoes (a cell and the one to its right).</p>
          <p>The first player unable to place a domino loses.</p>
        </>
      }
      p1Label="you (vertical)"
      p2Label="agent (horizontal)"
    >
      <div className="mx-auto grid w-fit grid-cols-4 gap-1.5">
        {state.cells.map((owner, i) => (
          <button
            key={i}
            onClick={() => click(i)}
            disabled={over || state.turn !== 1 || owner !== null || thinking}
            className={`flex h-14 w-14 items-center justify-center rounded-lg border transition disabled:cursor-default ${owner === 1
              ? "border-[#ff5f9e]/40 bg-[#ff5f9e]/15"
              : owner === 2
                ? "border-[#22e5c9]/40 bg-[#22e5c9]/15"
                : "border-border bg-surface hover:enabled:border-accent/40 hover:enabled:bg-surface-hover"
              }`}
          />
        ))}
      </div>
    </GameShell>
  );
}

/* ------------------------------------------------------------------ */
/*  9. Mini Othello — 4×4 board                                       */
/* ------------------------------------------------------------------ */

type OthCell = 1 | 2 | null;
interface OthState { board: OthCell[]; turn: 1 | 2 }

function othFlipsFor(board: OthCell[], player: 1 | 2, idx: number): number[] {
  const row = Math.floor(idx / 4), col = idx % 4;
  const opp: 1 | 2 = player === 1 ? 2 : 1;
  const flips: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      let r = row + dr, c = col + dc;
      const line: number[] = [];
      while (r >= 0 && r < 4 && c >= 0 && c < 4 && board[r * 4 + c] === opp) {
        line.push(r * 4 + c);
        r += dr; c += dc;
      }
      if (line.length > 0 && r >= 0 && r < 4 && c >= 0 && c < 4 && board[r * 4 + c] === player) {
        flips.push(...line);
      }
    }
  }
  return flips;
}

function othValidMoves(board: OthCell[], player: 1 | 2): number[] {
  const out: number[] = [];
  for (let i = 0; i < 16; i++) {
    if (board[i] !== null) continue;
    if (othFlipsFor(board, player, i).length > 0) out.push(i);
  }
  return out;
}

function othMoves(state: OthState): number[] {
  const legal = othValidMoves(state.board, state.turn);
  return legal.length > 0 ? legal : [-1]; // -1 = pass
}

function othApply(state: OthState, move: number): OthState {
  const opp: 1 | 2 = state.turn === 1 ? 2 : 1;
  if (move === -1) return { board: state.board, turn: opp };
  const board = state.board.slice();
  const flips = othFlipsFor(board, state.turn, move);
  board[move] = state.turn;
  for (const f of flips) board[f] = state.turn;
  return { board, turn: opp };
}

function othIsTerminal(state: OthState): boolean {
  if (state.board.every((c) => c !== null)) return true;
  return othValidMoves(state.board, 1).length === 0 && othValidMoves(state.board, 2).length === 0;
}

const OTH_CORNERS = [0, 3, 12, 15];

function othEvaluate(state: OthState): number {
  const p1 = state.board.filter((c) => c === 1).length;
  const p2 = state.board.filter((c) => c === 2).length;
  let score = (p1 - p2) * 2;
  for (const corner of OTH_CORNERS) {
    if (state.board[corner] === 1) score += 8;
    if (state.board[corner] === 2) score -= 8;
  }
  return score;
}

const OTH_START: OthState = {
  board: (() => {
    const b: OthCell[] = Array(16).fill(null);
    b[5] = 2; b[10] = 2; b[6] = 1; b[9] = 1;
    return b;
  })(),
  turn: 1,
};

function MiniOthelloGame() {
  const [state, setState] = useState<OthState>(OTH_START);
  const [thinking, setThinking] = useState(false);
  const over = othIsTerminal(state);
  const p1 = state.board.filter((c) => c === 1).length;
  const p2 = state.board.filter((c) => c === 2).length;
  const winner: 1 | 2 | "tie" | null = over ? (p1 > p2 ? 1 : p2 > p1 ? 2 : "tie") : null;
  const legalNow = othValidMoves(state.board, state.turn);

  // auto-pass when the side to move has no legal move but the game isn't over
  useEffect(() => {
    if (over) return;
    if (legalNow.length === 0) {
      const t = setTimeout(() => setState((s) => ({ ...s, turn: s.turn === 1 ? 2 : 1 })), 400);
      return () => clearTimeout(t);
    }
  }, [state, over, legalNow.length]);

  useEffect(() => {
    if (over || state.turn !== 2 || legalNow.length === 0) return;
    setThinking(true);
    const t = setTimeout(() => {
      const move = chooseBestMove(state, false, 8, othMoves, othApply, othIsTerminal, othEvaluate);
      if (move !== null) setState(othApply(state, move));
      setThinking(false);
    }, 550);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, over]);

  function click(i: number) {
    if (over || state.turn !== 1 || thinking || !legalNow.includes(i)) return;
    setState(othApply(state, i));
  }

  function reset() {
    setState(OTH_START);
  }

  let status: string;
  if (winner === "tie") status = "It's a tie.";
  else if (winner === 1) status = "You win! \u2728";
  else if (winner === 2) status = "Agent wins.";
  else if (thinking) status = "Agent is thinking\u2026";
  else if (legalNow.length === 0) status = "No legal move \u2014 passing\u2026";
  else status = "Your move \u2014 flip the agent's discs";

  return (
    <GameShell
      eyebrow="Classic Strategy"
      title="⚫⚪ Mini Othello"
      description="A 4×4 take on Othello. Outflank a line of the agent's discs to flip them to your color. Most discs when the board fills wins."
      status={status}
      thinking={thinking}
      onReset={reset}
      info={
        <>
          <p>Place a disc so it traps one or more opponent discs between your new disc and another of your own, in a straight line.</p>
          <p>All trapped discs flip to your color.</p>
          <p>
            Score &mdash; you: <span className="font-score font-bold text-[#ff5f9e]">{p1}</span>{" "}
            agent: <span className="font-score font-bold text-[#22e5c9]">{p2}</span>
          </p>
        </>
      }
    >
      <div className="mx-auto grid w-fit grid-cols-4 gap-1.5">
        {state.board.map((cell, i) => (
          <button
            key={i}
            onClick={() => click(i)}
            disabled={over || state.turn !== 1 || thinking || !legalNow.includes(i)}
            className={`flex h-14 w-14 items-center justify-center rounded-lg border transition disabled:cursor-default ${legalNow.includes(i) && state.turn === 1
              ? "border-[#ffd166]/60 bg-[#ffd166]/10"
              : "border-border bg-surface hover:enabled:border-accent/40"
              }`}
          >
            {cell && <Piece player={cell} className="pop-in h-8 w-8" />}
          </button>
        ))}
      </div>
    </GameShell>
  );
}

/* ------------------------------------------------------------------ */
/*  10. SOS Game — spell "S-O-S" in any of 4 directions to win        */
/* ------------------------------------------------------------------ */

type SosLetter = "S" | "O";
type SosCell = SosLetter | null;
interface SosState { grid: SosCell[]; turn: 1 | 2; winner: 1 | 2 | null }
interface SosMove { cell: number; letter: SosLetter }

const SOS_N = 4;
const SOS_DIRS: [number, number][] = [[0, 1], [1, 0], [1, 1], [1, -1]];

function sosInBounds(r: number, c: number): boolean {
  return r >= 0 && r < SOS_N && c >= 0 && c < SOS_N;
}

function sosCompletesAt(grid: SosCell[], idx: number): boolean {
  const row = Math.floor(idx / SOS_N), col = idx % SOS_N;
  for (const [dr, dc] of SOS_DIRS) {
    for (let pos = 0; pos < 3; pos++) {
      const r0 = row - dr * pos, c0 = col - dc * pos;
      const cells: [number, number][] = [[r0, c0], [r0 + dr, c0 + dc], [r0 + 2 * dr, c0 + 2 * dc]];
      if (cells.every(([r, c]) => sosInBounds(r, c))) {
        const vals = cells.map(([r, c]) => grid[r * SOS_N + c]);
        if (vals[0] === "S" && vals[1] === "O" && vals[2] === "S") return true;
      }
    }
  }
  return false;
}

function sosMoves(state: SosState): SosMove[] {
  if (state.winner) return [];
  const out: SosMove[] = [];
  state.grid.forEach((c, i) => {
    if (c === null) {
      out.push({ cell: i, letter: "S" });
      out.push({ cell: i, letter: "O" });
    }
  });
  return out;
}

function sosApply(state: SosState, move: SosMove): SosState {
  const grid = state.grid.slice();
  grid[move.cell] = move.letter;
  const completed = sosCompletesAt(grid, move.cell);
  return {
    grid,
    turn: completed ? state.turn : state.turn === 1 ? 2 : 1,
    winner: completed ? state.turn : null,
  };
}

function sosIsTerminal(state: SosState): boolean {
  return state.winner !== null || state.grid.every((c) => c !== null);
}

function sosEvaluate(state: SosState): number {
  if (state.winner === 1) return 100;
  if (state.winner === 2) return -100;
  return 0;
}

const SOS_START: SosState = { grid: Array(16).fill(null), turn: 1, winner: null };

function SosGame() {
  const [state, setState] = useState<SosState>(SOS_START);
  const [thinking, setThinking] = useState(false);
  const [letter, setLetter] = useState<SosLetter>("S");
  const over = sosIsTerminal(state);
  const draw = over && !state.winner;

  useEffect(() => {
    if (over || state.turn !== 2) return;
    setThinking(true);
    const t = setTimeout(() => {
      const move = chooseBestMove(state, false, 3, sosMoves, sosApply, sosIsTerminal, sosEvaluate);
      if (move) setState(sosApply(state, move));
      setThinking(false);
    }, 550);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, over]);

  function click(i: number) {
    if (over || state.turn !== 1 || state.grid[i] !== null || thinking) return;
    setState(sosApply(state, { cell: i, letter }));
  }

  function reset() {
    setState(SOS_START);
    setLetter("S");
  }

  let status: string;
  if (state.winner) status = state.winner === 1 ? "You win! \u2728" : "Agent wins.";
  else if (draw) status = "Board full \u2014 no SOS formed. Draw.";
  else if (thinking) status = "Agent is thinking\u2026";
  else status = `Your move \u2014 placing "${letter}"`;

  return (
    <GameShell
      eyebrow="Pattern Forming"
      title="🔤 SOS Game"
      description="Take turns writing an S or an O in any empty cell. Complete the sequence S-O-S in a row, column, or diagonal and you win instantly."
      status={status}
      thinking={thinking}
      onReset={reset}
      info={
        <>
          <p>Choose which letter to place, then click a cell.</p>
          <p>An SOS can be completed by any player's move, using letters placed by either side.</p>
          <p>First SOS wins immediately. A full board with no SOS is a draw.</p>
        </>
      }
    >
      <div className="mb-4 flex justify-center gap-2">
        {(["S", "O"] as SosLetter[]).map((l) => (
          <button
            key={l}
            onClick={() => setLetter(l)}
            disabled={over || state.turn !== 1}
            className={`h-9 w-9 rounded-lg border font-score text-sm font-bold transition disabled:cursor-default ${letter === l
              ? "border-accent bg-accent/15 text-accent"
              : "border-border bg-surface text-foreground-muted hover:enabled:border-accent/40"
              }`}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="mx-auto grid w-fit grid-cols-4 gap-2">
        {state.grid.map((cell, i) => (
          <button
            key={i}
            onClick={() => click(i)}
            disabled={over || state.turn !== 1 || cell !== null || thinking}
            className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-surface font-score text-lg font-bold text-foreground transition hover:enabled:border-accent/40 hover:enabled:bg-surface-hover disabled:cursor-default"
          >
            {cell}
          </button>
        ))}
      </div>
    </GameShell>
  );
}

/* ------------------------------------------------------------------ */
/*  11. Connect Four — 5×4 small board, connect four                  */
/* ------------------------------------------------------------------ */

const C4_ROWS = 4, C4_COLS = 5;
interface C4State { grid: (1 | 2 | null)[]; turn: 1 | 2 }
const C4_DIRS: [number, number][] = [[0, 1], [1, 0], [1, 1], [1, -1]];

function c4LowestRow(grid: (1 | 2 | null)[], col: number): number {
  for (let r = C4_ROWS - 1; r >= 0; r--) if (grid[r * C4_COLS + col] === null) return r;
  return -1;
}

function c4Moves(state: C4State): number[] {
  const out: number[] = [];
  for (let c = 0; c < C4_COLS; c++) if (c4LowestRow(state.grid, c) >= 0) out.push(c);
  return out;
}

function c4Winner(grid: (1 | 2 | null)[]): 1 | 2 | null {
  for (let r = 0; r < C4_ROWS; r++) {
    for (let c = 0; c < C4_COLS; c++) {
      const v = grid[r * C4_COLS + c];
      if (!v) continue;
      for (const [dr, dc] of C4_DIRS) {
        let ok = true;
        for (let k = 1; k < 4; k++) {
          const nr = r + dr * k, nc = c + dc * k;
          if (nr < 0 || nr >= C4_ROWS || nc < 0 || nc >= C4_COLS || grid[nr * C4_COLS + nc] !== v) { ok = false; break; }
        }
        if (ok) return v;
      }
    }
  }
  return null;
}

function c4Apply(state: C4State, col: number): C4State {
  const row = c4LowestRow(state.grid, col);
  const grid = state.grid.slice();
  grid[row * C4_COLS + col] = state.turn;
  return { grid, turn: state.turn === 1 ? 2 : 1 };
}

function c4IsTerminal(state: C4State): boolean {
  return Boolean(c4Winner(state.grid)) || c4Moves(state).length === 0;
}

const C4_WEIGHTS = [0, 1, 4, 20];

function c4Evaluate(state: C4State): number {
  const grid = state.grid;
  const w = c4Winner(grid);
  if (w === 1) return 1000;
  if (w === 2) return -1000;
  let score = 0;
  for (let r = 0; r < C4_ROWS; r++) {
    for (let c = 0; c < C4_COLS; c++) {
      for (const [dr, dc] of C4_DIRS) {
        const vals: (1 | 2 | null)[] = [];
        let inb = true;
        for (let k = 0; k < 4; k++) {
          const nr = r + dr * k, nc = c + dc * k;
          if (nr < 0 || nr >= C4_ROWS || nc < 0 || nc >= C4_COLS) { inb = false; break; }
          vals.push(grid[nr * C4_COLS + nc]);
        }
        if (!inb) continue;
        const p1 = vals.filter((v) => v === 1).length;
        const p2 = vals.filter((v) => v === 2).length;
        if (p1 > 0 && p2 > 0) continue;
        if (p1 > 0) score += C4_WEIGHTS[p1];
        if (p2 > 0) score -= C4_WEIGHTS[p2];
      }
    }
  }
  return score;
}

const C4_START: C4State = { grid: Array(C4_ROWS * C4_COLS).fill(null), turn: 1 };

function ConnectFourGame() {
  const [state, setState] = useState<C4State>(C4_START);
  const [thinking, setThinking] = useState(false);
  const winner = c4Winner(state.grid);
  const over = c4IsTerminal(state);
  const draw = over && !winner;

  useEffect(() => {
    if (over || state.turn !== 2) return;
    setThinking(true);
    const t = setTimeout(() => {
      const move = chooseBestMove(state, false, 4, c4Moves, c4Apply, c4IsTerminal, c4Evaluate);
      if (move !== null) setState(c4Apply(state, move));
      setThinking(false);
    }, 550);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, over]);

  function play(col: number) {
    if (over || state.turn !== 1 || thinking || c4LowestRow(state.grid, col) < 0) return;
    setState(c4Apply(state, col));
  }

  function reset() {
    setState(C4_START);
  }

  let status: string;
  if (winner) status = winner === 1 ? "You win! \u2728" : "Agent wins.";
  else if (draw) status = "Board full \u2014 draw.";
  else if (thinking) status = "Agent is thinking\u2026";
  else status = "Your move \u2014 pick a column";

  return (
    <GameShell
      eyebrow="Classic Strategy"
      title="🔴🟡 Connect Four"
      description="A compact 5×4 board. Drop discs into a column and try to line up four in a row — horizontally, vertically, or diagonally."
      status={status}
      thinking={thinking}
      onReset={reset}
      info={
        <>
          <p>Click any cell in a column to drop your disc into the lowest open slot.</p>
          <p>The agent scores every possible 4-in-a-row window on the board and favors moves that build its own lines while blocking yours.</p>
        </>
      }
    >
      <div className="mx-auto grid w-fit gap-1.5" style={{ gridTemplateColumns: `repeat(${C4_COLS}, 44px)` }}>
        {state.grid.map((cell, i) => {
          const col = i % C4_COLS;
          return (
            <button
              key={i}
              onClick={() => play(col)}
              disabled={over || state.turn !== 1 || thinking || c4LowestRow(state.grid, col) < 0}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface transition hover:enabled:border-accent/40 hover:enabled:bg-surface-hover disabled:cursor-default"
            >
              {cell && <Piece player={cell} className="pop-in h-8 w-8" />}
            </button>
          );
        })}
      </div>
    </GameShell>
  );
}

/* ------------------------------------------------------------------ */
/*  12. Pentago — 6×6 board, place then rotate a quadrant             */
/* ------------------------------------------------------------------ */

const PEN_N = 6;
interface PenState { grid: (1 | 2 | null)[]; turn: 1 | 2 }
interface PenMove { cell: number; quadrant: 0 | 1 | 2 | 3; dir: 1 | -1 }
const PEN_DIRS: [number, number][] = [[0, 1], [1, 0], [1, 1], [1, -1]];
const PEN_QUAD_ORIGIN: [number, number][] = [[0, 0], [0, 3], [3, 0], [3, 3]];

function penRotate(grid: (1 | 2 | null)[], quadrant: 0 | 1 | 2 | 3, dir: 1 | -1): (1 | 2 | null)[] {
  const [r0, c0] = PEN_QUAD_ORIGIN[quadrant];
  const next = grid.slice();
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let ni: number, nj: number;
      if (dir === 1) { ni = j; nj = 2 - i; } else { ni = 2 - j; nj = i; }
      next[(r0 + ni) * PEN_N + (c0 + nj)] = grid[(r0 + i) * PEN_N + (c0 + j)];
    }
  }
  return next;
}

function penWinner(grid: (1 | 2 | null)[]): 1 | 2 | null {
  for (let r = 0; r < PEN_N; r++) {
    for (let c = 0; c < PEN_N; c++) {
      const v = grid[r * PEN_N + c];
      if (!v) continue;
      for (const [dr, dc] of PEN_DIRS) {
        let ok = true;
        for (let k = 1; k < 5; k++) {
          const nr = r + dr * k, nc = c + dc * k;
          if (nr < 0 || nr >= PEN_N || nc < 0 || nc >= PEN_N || grid[nr * PEN_N + nc] !== v) { ok = false; break; }
        }
        if (ok) return v;
      }
    }
  }
  return null;
}

function penMoves(state: PenState): PenMove[] {
  const out: PenMove[] = [];
  state.grid.forEach((c, i) => {
    if (c !== null) return;
    for (let q = 0; q < 4; q++) {
      out.push({ cell: i, quadrant: q as 0 | 1 | 2 | 3, dir: 1 });
      out.push({ cell: i, quadrant: q as 0 | 1 | 2 | 3, dir: -1 });
    }
  });
  return out;
}

function penApply(state: PenState, move: PenMove): PenState {
  const placed = state.grid.slice();
  placed[move.cell] = state.turn;
  const rotated = penRotate(placed, move.quadrant, move.dir);
  return { grid: rotated, turn: state.turn === 1 ? 2 : 1 };
}

function penIsTerminal(state: PenState): boolean {
  return Boolean(penWinner(state.grid)) || state.grid.every((c) => c !== null);
}

const PEN_WEIGHTS = [0, 1, 3, 10, 40];

function penEvaluate(state: PenState): number {
  const grid = state.grid;
  const w = penWinner(grid);
  if (w === 1) return 1000;
  if (w === 2) return -1000;
  let score = 0;
  for (let r = 0; r < PEN_N; r++) {
    for (let c = 0; c < PEN_N; c++) {
      for (const [dr, dc] of PEN_DIRS) {
        const vals: (1 | 2 | null)[] = [];
        let inb = true;
        for (let k = 0; k < 5; k++) {
          const nr = r + dr * k, nc = c + dc * k;
          if (nr < 0 || nr >= PEN_N || nc < 0 || nc >= PEN_N) { inb = false; break; }
          vals.push(grid[nr * PEN_N + nc]);
        }
        if (!inb) continue;
        const p1 = vals.filter((v) => v === 1).length;
        const p2 = vals.filter((v) => v === 2).length;
        if (p1 > 0 && p2 > 0) continue;
        if (p1 > 0) score += PEN_WEIGHTS[p1];
        if (p2 > 0) score -= PEN_WEIGHTS[p2];
      }
    }
  }
  return score;
}

const PEN_START: PenState = { grid: Array(36).fill(null), turn: 1 };

function PentagoGame() {
  const [state, setState] = useState<PenState>(PEN_START);
  const [thinking, setThinking] = useState(false);
  const [pendingCell, setPendingCell] = useState<number | null>(null);
  const winner = penWinner(state.grid);
  const over = penIsTerminal(state);
  const draw = over && !winner;

  useEffect(() => {
    if (over || state.turn !== 2) return;
    setThinking(true);
    const t = setTimeout(() => {
      const move = chooseBestMove(state, false, 1, penMoves, penApply, penIsTerminal, penEvaluate);
      if (move) setState(penApply(state, move));
      setThinking(false);
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, over]);

  function placeCell(i: number) {
    if (over || state.turn !== 1 || state.grid[i] !== null || thinking) return;
    setPendingCell(i);
  }

  function rotate(quadrant: 0 | 1 | 2 | 3, dir: 1 | -1) {
    if (pendingCell === null) return;
    setState(penApply(state, { cell: pendingCell, quadrant, dir }));
    setPendingCell(null);
  }

  function reset() {
    setState(PEN_START);
    setPendingCell(null);
  }

  let status: string;
  if (winner) status = winner === 1 ? "You win! \u2728" : "Agent wins.";
  else if (draw) status = "Board full \u2014 draw.";
  else if (thinking) status = "Agent is thinking\u2026";
  else if (pendingCell !== null) status = "Now rotate a quadrant";
  else status = "Your move \u2014 place a marble";

  return (
    <GameShell
      eyebrow="Rotating Board"
      title="🌀 Pentago"
      description="Place a marble on the 6×6 board, then rotate one of the four 3×3 quadrants 90°. Five in a row — in any direction — wins, and a rotation can create or break a line instantly."
      status={status}
      thinking={thinking}
      onReset={reset}
      info={
        <>
          <p>Click an empty cell to place your marble there.</p>
          <p>Then pick a quadrant and a rotation direction below the board — every placement must be followed by a rotation.</p>
          <p>Five marbles in a row (any direction) after the rotation wins the game, for either player.</p>
        </>
      }
    >
      <div className="mx-auto grid w-fit grid-cols-6 gap-1">
        {state.grid.map((cell, i) => {
          const row = Math.floor(i / PEN_N), col = i % PEN_N;
          const quadBorder = `${col === 3 ? "ml-1.5" : ""} ${row === 3 ? "mt-1.5" : ""}`;
          return (
            <button
              key={i}
              onClick={() => placeCell(i)}
              disabled={over || state.turn !== 1 || cell !== null || thinking || pendingCell !== null}
              className={`flex h-9 w-9 items-center justify-center rounded-md border transition disabled:cursor-default ${quadBorder} ${pendingCell === i
                ? "border-accent bg-accent/10"
                : "border-border bg-surface hover:enabled:border-accent/40"
                }`}
            >
              {cell && <Piece player={cell} className="pop-in h-6 w-6" />}
            </button>
          );
        })}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {([0, 1, 2, 3] as const).map((q) => (
          <div key={q} className="flex items-center justify-center gap-1 rounded-lg border border-border bg-surface p-1.5">
            <span className="font-score text-[10px] text-foreground-subtle">Q{q + 1}</span>
            <button
              onClick={() => rotate(q, -1)}
              disabled={pendingCell === null}
              className="rounded-md border border-border bg-background-secondary px-2 py-1 text-xs transition hover:enabled:border-accent disabled:cursor-default disabled:opacity-30"
            >
              ↺
            </button>
            <button
              onClick={() => rotate(q, 1)}
              disabled={pendingCell === null}
              className="rounded-md border border-border bg-background-secondary px-2 py-1 text-xs transition hover:enabled:border-accent disabled:cursor-default disabled:opacity-30"
            >
              ↻
            </button>
          </div>
        ))}
      </div>
    </GameShell>
  );
}

/* ------------------------------------------------------------------ */
/*  13. Mini Checkers — 6×6 board                                     */
/* ------------------------------------------------------------------ */

interface CkPiece { player: 1 | 2; king: boolean }
type CkCell = CkPiece | null;
interface CkState { board: CkCell[]; turn: 1 | 2 }
interface CkMove { from: number; to: number; captured: number | null }

const CK_N = 6;

function ckDirsFor(piece: CkPiece): [number, number][] {
  if (piece.king) return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  return piece.player === 1 ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
}

function ckMovesForPiece(board: CkCell[], idx: number): CkMove[] {
  const piece = board[idx];
  if (!piece) return [];
  const row = Math.floor(idx / CK_N), col = idx % CK_N;
  const out: CkMove[] = [];
  for (const [dr, dc] of ckDirsFor(piece)) {
    const nr = row + dr, nc = col + dc;
    if (nr < 0 || nr >= CK_N || nc < 0 || nc >= CK_N) continue;
    const nIdx = nr * CK_N + nc;
    if (board[nIdx] === null) {
      out.push({ from: idx, to: nIdx, captured: null });
    } else if (board[nIdx]!.player !== piece.player) {
      const jr = row + dr * 2, jc = col + dc * 2;
      if (jr >= 0 && jr < CK_N && jc >= 0 && jc < CK_N) {
        const jIdx = jr * CK_N + jc;
        if (board[jIdx] === null) out.push({ from: idx, to: jIdx, captured: nIdx });
      }
    }
  }
  return out;
}

function ckMoves(state: CkState): CkMove[] {
  const all: CkMove[] = [];
  state.board.forEach((p, i) => {
    if (p && p.player === state.turn) all.push(...ckMovesForPiece(state.board, i));
  });
  const captures = all.filter((m) => m.captured !== null);
  return captures.length > 0 ? captures : all;
}

function ckApply(state: CkState, move: CkMove): CkState {
  const board = state.board.slice();
  const piece = board[move.from]!;
  board[move.from] = null;
  if (move.captured !== null) board[move.captured] = null;
  const row = Math.floor(move.to / CK_N);
  const promoted = (piece.player === 1 && row === 0) || (piece.player === 2 && row === CK_N - 1);
  board[move.to] = { player: piece.player, king: piece.king || promoted };
  return { board, turn: state.turn === 1 ? 2 : 1 };
}

function ckIsTerminal(state: CkState): boolean {
  const p1 = state.board.filter((p) => p && p.player === 1).length;
  const p2 = state.board.filter((p) => p && p.player === 2).length;
  if (p1 === 0 || p2 === 0) return true;
  return ckMoves(state).length === 0;
}

function ckEvaluate(state: CkState): number {
  let score = 0;
  state.board.forEach((p) => {
    if (!p) return;
    const val = p.king ? 5 : 3;
    score += p.player === 1 ? val : -val;
  });
  if (ckMoves(state).length === 0) score += state.turn === 1 ? -50 : 50;
  return score;
}

function ckStart(): CkState {
  const board: CkCell[] = Array(36).fill(null);
  for (let i = 0; i < 36; i++) {
    const row = Math.floor(i / CK_N), col = i % CK_N;
    if ((row + col) % 2 === 1) {
      if (row <= 1) board[i] = { player: 2, king: false };
      if (row >= 4) board[i] = { player: 1, king: false };
    }
  }
  return { board, turn: 1 };
}

function MiniCheckersGame() {
  const [state, setState] = useState<CkState>(ckStart);
  const [thinking, setThinking] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const over = ckIsTerminal(state);
  const p1Count = state.board.filter((p) => p && p.player === 1).length;
  const p2Count = state.board.filter((p) => p && p.player === 2).length;
  const winner: 1 | 2 | null = over ? (state.turn === 1 ? 2 : 1) : null;

  useEffect(() => {
    if (over || state.turn !== 2) return;
    setThinking(true);
    const t = setTimeout(() => {
      const move = chooseBestMove(state, false, 4, ckMoves, ckApply, ckIsTerminal, ckEvaluate);
      if (move) setState(ckApply(state, move));
      setThinking(false);
    }, 550);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, over]);

  const legalNow = useMemo(() => ckMoves(state), [state]);
  const legalTargets = selected === null ? [] : legalNow.filter((m) => m.from === selected).map((m) => m.to);

  function click(i: number) {
    if (over || state.turn !== 1 || thinking) return;
    const target = legalTargets.includes(i);
    if (target) {
      const move = legalNow.find((m) => m.from === selected && m.to === i)!;
      setState(ckApply(state, move));
      setSelected(null);
      return;
    }
    const piece = state.board[i];
    if (piece && piece.player === 1 && legalNow.some((m) => m.from === i)) setSelected(i);
    else setSelected(null);
  }

  function reset() {
    setState(ckStart());
    setSelected(null);
  }

  let status: string;
  if (winner) status = winner === 1 ? "You win! \u2728" : "Agent wins.";
  else if (thinking) status = "Agent is thinking\u2026";
  else status = "Your move \u2014 captures are mandatory when available";

  return (
    <GameShell
      eyebrow="Classic Strategy"
      title="🟩 Mini Checkers"
      description="A 6×6 checkers board. Move diagonally, jump to capture, and reach the far row to crown a king that can move in any diagonal direction."
      status={status}
      thinking={thinking}
      onReset={reset}
      info={
        <>
          <p>Click one of your pieces, then a highlighted destination.</p>
          <p>If a capture is available for any of your pieces, you must take it.</p>
          <p>
            Pieces &mdash; you: <span className="font-score font-bold text-[#ff5f9e]">{p1Count}</span>{" "}
            agent: <span className="font-score font-bold text-[#22e5c9]">{p2Count}</span>
          </p>
        </>
      }
    >
      <div className="mx-auto grid w-fit grid-cols-6 gap-0.5 rounded-lg bg-background-secondary p-1.5">
        {state.board.map((piece, i) => {
          const row = Math.floor(i / CK_N), col = i % CK_N;
          const dark = (row + col) % 2 === 1;
          return (
            <button
              key={i}
              onClick={() => click(i)}
              disabled={over || thinking}
              className={`flex h-10 w-10 items-center justify-center rounded-sm transition disabled:cursor-default ${selected === i
                ? "bg-accent/30"
                : legalTargets.includes(i)
                  ? "bg-[#ffd166]/30"
                  : dark
                    ? "bg-surface"
                    : "bg-transparent"
                }`}
            >
              {piece && <Piece player={piece.player} king={piece.king} className="pop-in h-7 w-7" />}
            </button>
          );
        })}
      </div>
    </GameShell>
  );
}

/* ------------------------------------------------------------------ */
/*  14. Teeko — 4 pieces each, 4-in-a-row or a 2×2 square wins        */
/* ------------------------------------------------------------------ */

const TK_N = 5;
type TkCell = 1 | 2 | null;
interface TkState { board: TkCell[]; turn: 1 | 2 }
type TkMove = { type: "place"; to: number } | { type: "move"; from: number; to: number };

function tkLines(): number[][] {
  const idx = (r: number, c: number) => r * TK_N + c;
  const lines: number[][] = [];
  for (let r = 0; r < TK_N; r++) for (let c = 0; c <= 1; c++) lines.push([idx(r, c), idx(r, c + 1), idx(r, c + 2), idx(r, c + 3)]);
  for (let c = 0; c < TK_N; c++) for (let r = 0; r <= 1; r++) lines.push([idx(r, c), idx(r + 1, c), idx(r + 2, c), idx(r + 3, c)]);
  for (let r = 0; r <= 1; r++) for (let c = 0; c <= 1; c++) lines.push([idx(r, c), idx(r + 1, c + 1), idx(r + 2, c + 2), idx(r + 3, c + 3)]);
  for (let r = 0; r <= 1; r++) for (let c = 3; c <= 4; c++) lines.push([idx(r, c), idx(r + 1, c - 1), idx(r + 2, c - 2), idx(r + 3, c - 3)]);
  for (let r = 0; r < TK_N - 1; r++) for (let c = 0; c < TK_N - 1; c++) lines.push([idx(r, c), idx(r, c + 1), idx(r + 1, c), idx(r + 1, c + 1)]);
  return lines;
}
const TK_LINES = tkLines();

function tkWinner(board: TkCell[]): 1 | 2 | null {
  for (const line of TK_LINES) {
    const vals = line.map((i) => board[i]);
    if (vals[0] !== null && vals.every((v) => v === vals[0])) return vals[0];
  }
  return null;
}

function tkAdjacent(i: number): number[] {
  const row = Math.floor(i / TK_N), col = i % TK_N;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (dr === 0 && dc === 0) continue;
    const nr = row + dr, nc = col + dc;
    if (nr < 0 || nr >= TK_N || nc < 0 || nc >= TK_N) continue;
    out.push(nr * TK_N + nc);
  }
  return out;
}

function tkMoves(state: TkState): TkMove[] {
  const count = state.board.filter((c) => c === state.turn).length;
  if (count < 4) {
    return state.board.map((c, i) => (c === null ? ({ type: "place", to: i } as TkMove) : null)).filter((m): m is TkMove => m !== null);
  }
  const out: TkMove[] = [];
  state.board.forEach((c, i) => {
    if (c !== state.turn) return;
    for (const adj of tkAdjacent(i)) if (state.board[adj] === null) out.push({ type: "move", from: i, to: adj });
  });
  return out;
}

function tkApply(state: TkState, move: TkMove): TkState {
  const board = state.board.slice();
  if (move.type === "place") board[move.to] = state.turn;
  else { board[move.to] = state.turn; board[move.from] = null; }
  return { board, turn: state.turn === 1 ? 2 : 1 };
}

function tkIsTerminal(state: TkState): boolean {
  return Boolean(tkWinner(state.board)) || tkMoves(state).length === 0;
}

function tkEvaluate(state: TkState): number {
  const w = tkWinner(state.board);
  if (w === 1) return 1000;
  if (w === 2) return -1000;
  let score = 0;
  for (const line of TK_LINES) {
    const vals = line.map((i) => state.board[i]);
    const p1 = vals.filter((v) => v === 1).length;
    const p2 = vals.filter((v) => v === 2).length;
    if (p1 > 0 && p2 > 0) continue;
    if (p1 > 0) score += [0, 1, 4, 15][p1];
    if (p2 > 0) score -= [0, 1, 4, 15][p2];
  }
  return score;
}

const TK_START: TkState = { board: Array(25).fill(null), turn: 1 };

function TeekoGame() {
  const [state, setState] = useState<TkState>(TK_START);
  const [thinking, setThinking] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const winner = tkWinner(state.board);
  const over = tkIsTerminal(state);
  const phase = state.board.filter((c) => c === 1).length < 4 || state.board.filter((c) => c === 2).length < 4 ? "placing" : "moving";

  useEffect(() => {
    if (over || state.turn !== 2) return;
    setThinking(true);
    const t = setTimeout(() => {
      const move = chooseBestMove(state, false, 2, tkMoves, tkApply, tkIsTerminal, tkEvaluate);
      if (move) setState(tkApply(state, move));
      setThinking(false);
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, over]);

  const myMoves = useMemo(() => (state.turn === 1 ? tkMoves(state) : []), [state]);
  const legalTargets = selected === null ? [] : (myMoves.filter((m) => m.type === "move" && (m as any).from === selected) as any[]).map((m) => m.to);

  function click(i: number) {
    if (over || state.turn !== 1 || thinking) return;
    if (phase === "placing") {
      if (state.board[i] === null) setState(tkApply(state, { type: "place", to: i }));
      return;
    }
    if (selected === null) {
      if (state.board[i] === 1) setSelected(i);
      return;
    }
    if (legalTargets.includes(i)) {
      setState(tkApply(state, { type: "move", from: selected, to: i }));
      setSelected(null);
    } else if (state.board[i] === 1) setSelected(i);
    else setSelected(null);
  }

  function reset() {
    setState(TK_START);
    setSelected(null);
  }

  let status: string;
  if (winner) status = winner === 1 ? "You win! \u2728" : "Agent wins.";
  else if (thinking) status = "Agent is thinking\u2026";
  else status = state.turn === 1 ? (phase === "placing" ? "Your move \u2014 place a piece" : "Your move \u2014 slide a piece") : "Agent's move";

  return (
    <GameShell
      eyebrow="Positional Strategy"
      title="🔷 Teeko"
      description="Place your 4 pieces on a 5×5 board, then slide them one step at a time. Line up 4 in a row, or form a 2×2 square, to win."
      status={status}
      thinking={thinking}
      onReset={reset}
      info={
        <>
          <p>Phase 1: take turns placing your 4 pieces.</p>
          <p>Phase 2: click a piece, then an adjacent empty cell to slide it.</p>
          <p>Win with 4 in a row (any direction) or by forming a solid 2×2 square.</p>
        </>
      }
    >
      <div className="mx-auto grid w-fit grid-cols-5 gap-1.5">
        {state.board.map((cell, i) => (
          <button
            key={i}
            onClick={() => click(i)}
            disabled={over || state.turn !== 1 || thinking}
            className={`flex h-12 w-12 items-center justify-center rounded-lg border transition disabled:cursor-default ${selected === i
              ? "border-accent bg-accent/10"
              : legalTargets.includes(i)
                ? "border-[#ffd166]/60 bg-[#ffd166]/10"
                : "border-border bg-surface hover:enabled:border-accent/40"
              }`}
          >
            {cell && <Piece player={cell} className="pop-in h-7 w-7" />}
          </button>
        ))}
      </div>
    </GameShell>
  );
}

/* ------------------------------------------------------------------ */
/*  15. Mini Isolation — move, then remove a cell from the board      */
/* ------------------------------------------------------------------ */

const ISO_N = 5;
interface IsoState { avail: boolean[]; p1: number; p2: number; turn: 1 | 2 }
interface IsoMove { to: number; remove: number }

function isoQueenMoves(avail: boolean[], from: number): number[] {
  const dirs: [number, number][] = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  const row = Math.floor(from / ISO_N), col = from % ISO_N;
  const out: number[] = [];
  for (const [dr, dc] of dirs) {
    let r = row + dr, c = col + dc;
    while (r >= 0 && r < ISO_N && c >= 0 && c < ISO_N) {
      const idx = r * ISO_N + c;
      if (!avail[idx]) break;
      out.push(idx);
      r += dr; c += dc;
    }
  }
  return out;
}

function isoMoves(state: IsoState): IsoMove[] {
  const from = state.turn === 1 ? state.p1 : state.p2;
  const targets = isoQueenMoves(state.avail, from);
  const out: IsoMove[] = [];
  for (const to of targets) {
    for (let idx = 0; idx < 25; idx++) {
      const availableForRemoval = idx === from ? true : idx === to ? false : state.avail[idx];
      if (availableForRemoval) out.push({ to, remove: idx });
    }
  }
  return out;
}

function isoApply(state: IsoState, move: IsoMove): IsoState {
  const avail = state.avail.slice();
  const from = state.turn === 1 ? state.p1 : state.p2;
  avail[from] = true;
  avail[move.to] = false;
  avail[move.remove] = false;
  const p1 = state.turn === 1 ? move.to : state.p1;
  const p2 = state.turn === 2 ? move.to : state.p2;
  return { avail, p1, p2, turn: state.turn === 1 ? 2 : 1 };
}

function isoIsTerminal(state: IsoState): boolean {
  return isoMoves(state).length === 0;
}

function isoEvaluate(state: IsoState): number {
  if (isoMoves(state).length === 0) return state.turn === 1 ? -100 : 100;
  const p1Mob = isoQueenMoves(state.avail, state.p1).length;
  const p2Mob = isoQueenMoves(state.avail, state.p2).length;
  return (p1Mob - p2Mob) * 3;
}

function isoStart(): IsoState {
  const avail = Array(25).fill(true);
  avail[0] = false;
  avail[24] = false;
  return { avail, p1: 0, p2: 24, turn: 1 };
}

function MiniIsolationGame() {
  const [state, setState] = useState<IsoState>(isoStart);
  const [thinking, setThinking] = useState(false);
  const [pendingTo, setPendingTo] = useState<number | null>(null);
  const over = isoIsTerminal(state);
  const winner: 1 | 2 | null = over ? (state.turn === 1 ? 2 : 1) : null;

  useEffect(() => {
    if (over || state.turn !== 2) return;
    setThinking(true);
    const t = setTimeout(() => {
      const move = chooseBestMove(state, false, 1, isoMoves, isoApply, isoIsTerminal, isoEvaluate);
      if (move) setState(isoApply(state, move));
      setThinking(false);
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, over]);

  const destinations = useMemo(() => (state.turn === 1 ? isoQueenMoves(state.avail, state.p1) : []), [state]);

  function clickCell(i: number) {
    if (over || state.turn !== 1 || thinking) return;
    if (pendingTo === null) {
      if (destinations.includes(i)) setPendingTo(i);
      return;
    }
    const removable = i === state.p1 ? true : i === pendingTo ? false : state.avail[i];
    if (removable) {
      setState(isoApply(state, { to: pendingTo, remove: i }));
      setPendingTo(null);
    }
  }

  function reset() {
    setState(isoStart());
    setPendingTo(null);
  }

  let status: string;
  if (winner) status = winner === 1 ? "You win \u2014 the agent is trapped! \u2728" : "Agent wins \u2014 you're trapped.";
  else if (thinking) status = "Agent is thinking\u2026";
  else if (pendingTo !== null) status = "Now remove a cell from the board";
  else status = "Your move \u2014 slide your piece like a queen";

  return (
    <GameShell
      eyebrow="Mobility Game"
      title="🏰 Mini Isolation"
      description="Move your piece any distance in a straight line, then permanently remove a cell from the board. Trap your opponent with no legal move to win."
      status={status}
      thinking={thinking}
      onReset={reset}
      info={
        <>
          <p>Click a highlighted cell to move there (like a queen — any straight line, blocked by removed cells or either piece).</p>
          <p>Then click any other open cell to remove it from play forever.</p>
          <p>If you can't move on your turn, you lose.</p>
        </>
      }
    >
      <div className="mx-auto grid w-fit grid-cols-5 gap-1.5">
        {Array.from({ length: 25 }).map((_, i) => {
          const removed = !state.avail[i] && i !== state.p1 && i !== state.p2;
          const isDest = pendingTo === null && destinations.includes(i);
          const isRemovable = pendingTo !== null && (i === state.p1 ? true : i === pendingTo ? false : state.avail[i]);
          return (
            <button
              key={i}
              onClick={() => clickCell(i)}
              disabled={over || thinking || (pendingTo === null && !isDest) || (pendingTo !== null && !isRemovable)}
              className={`flex h-12 w-12 items-center justify-center rounded-lg border transition disabled:cursor-default ${removed
                ? "border-border/30 bg-background-secondary/60"
                : isDest || isRemovable
                  ? "border-[#ffd166]/60 bg-[#ffd166]/10"
                  : "border-border bg-surface"
                }`}
            >
              {i === state.p1 && <Piece player={1} className="pop-in h-7 w-7" />}
              {i === state.p2 && <Piece player={2} className="pop-in h-7 w-7" />}
            </button>
          );
        })}
      </div>
    </GameShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Game registry + arcade shell                                      */
/* ------------------------------------------------------------------ */

type GameId =
  | "tictactoe" | "connectfour" | "threemensmorris" | "nim" | "dotsandboxes"
  | "pentago" | "othello" | "checkers" | "hexapawn" | "domineering"
  | "teeko" | "isolation" | "pickanumber" | "sos" | "coinrow";

interface GameMeta { id: GameId; emoji: string; name: string; blurb: string; component: () => React.ReactElement }

const GAMES: GameMeta[] = [
  { id: "tictactoe", emoji: "❌⭕", name: "Tic-Tac-Toe", blurb: "Perfect-play classic + search tree", component: TicTacToeGame },
  { id: "connectfour", emoji: "🔴🟡", name: "Connect Four", blurb: "5×4 mini board", component: ConnectFourGame },
  { id: "threemensmorris", emoji: "🔺", name: "Three Men's Morris", blurb: "Place, then slide", component: ThreeMensMorrisGame },
  { id: "nim", emoji: "🪵", name: "Nim", blurb: "Take stones, nim-sum solved", component: NimGame },
  { id: "dotsandboxes", emoji: "✏️", name: "Dots and Boxes", blurb: "Claim the most boxes", component: DotsAndBoxesGame },
  { id: "pentago", emoji: "🌀", name: "Pentago", blurb: "Place then rotate a quadrant", component: PentagoGame },
  { id: "othello", emoji: "⚫⚪", name: "Mini Othello", blurb: "4×4 disc-flipping", component: MiniOthelloGame },
  { id: "checkers", emoji: "🟩", name: "Mini Checkers", blurb: "6×6 board, kings included", component: MiniCheckersGame },
  { id: "hexapawn", emoji: "⭐", name: "Hexapawn", blurb: "Fully solved 3×3 pawn game", component: HexapawnGame },
  { id: "domineering", emoji: "🧱", name: "Domineering", blurb: "4×4 domino placement", component: DomineeringGame },
  { id: "teeko", emoji: "🔷", name: "Teeko", blurb: "4-in-a-row or a 2×2 square", component: TeekoGame },
  { id: "isolation", emoji: "🏰", name: "Mini Isolation", blurb: "Move, then remove a cell", component: MiniIsolationGame },
  { id: "pickanumber", emoji: "🔢", name: "Pick-a-Number", blurb: "The 15-sum number game", component: PickANumberGame },
  { id: "sos", emoji: "🔤", name: "SOS Game", blurb: "Spell S-O-S first", component: SosGame },
  { id: "coinrow", emoji: "🪙", name: "Coin Row Game", blurb: "Optimal end-picking", component: CoinRowGame },
];

function GamePickerCard({ game, onSelect }: { game: GameMeta; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="group rise-in widget-card flex flex-col items-start gap-2 p-4 text-left backdrop-blur-xl transition hover:border-accent/50 hover:bg-surface-hover"
    >
      <span className="text-2xl">{game.emoji}</span>
      <span className="font-display text-sm font-semibold text-foreground">{game.name}</span>
      <span className="text-xs text-foreground-subtle">{game.blurb}</span>
    </button>
  );
}

export default function Page() {
  const [selected, setSelected] = useState<GameId | null>(null);
  const ActiveGame = selected ? GAMES.find((g) => g.id === selected)?.component ?? null : null;

  return (
    <div className="relative text-foreground" style={{
      "--glow-a": "rgba(99,102,241,0.15)",
      "--glow-b": "rgba(124,58,237,0.12)",
      "--glow-c": "rgba(139,92,246,0.12)",
    } as React.CSSProperties}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap");

        .font-display { font-family: "Space Grotesk", ui-sans-serif, system-ui, sans-serif; }
        .font-body { font-family: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif; }
        .font-score { font-family: "Space Mono", ui-monospace, monospace; }

        @keyframes pulse-dot {
          0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-2px); }
        }
        .thinking-dot { animation: pulse-dot 1.1s infinite ease-in-out; }
        .thinking-dot:nth-child(2) { animation-delay: 0.15s; }
        .thinking-dot:nth-child(3) { animation-delay: 0.3s; }

        @keyframes rise-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .rise-in { animation: rise-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }

        @keyframes pop-in {
          from { opacity: 0; transform: scale(0.55); }
          to { opacity: 1; transform: scale(1); }
        }
        .pop-in { animation: pop-in 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

        @keyframes drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(3%, -4%) scale(1.08); }
        }
        .drift-a { animation: drift 22s ease-in-out infinite; }
        .drift-b { animation: drift 26s ease-in-out infinite reverse; }
      ` }} />

      <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden transition-all duration-700">
        <div className="drift-a absolute -left-32 -top-32 h-[32rem] w-[32rem] rounded-full blur-[120px] transition-[background-color] duration-700" style={{ backgroundColor: "var(--glow-a)" }} />
        <div className="drift-b absolute -right-24 top-1/3 h-[30rem] w-[30rem] rounded-full blur-[120px] transition-[background-color] duration-700" style={{ backgroundColor: "var(--glow-b)" }} />
        <div className="absolute bottom-[-10rem] left-1/3 h-[28rem] w-[28rem] rounded-full blur-[130px] transition-[background-color] duration-700" style={{ backgroundColor: "var(--glow-c)" }} />
      </div>

      <div className="relative mx-auto font-body">
        {!selected && (
          <>
            <div className="rise-in mb-8">
              <p className="font-score text-xs uppercase tracking-[0.3em] text-accent font-semibold">
                Game Playing Arcade
              </p>
              <h1 className="font-display mt-3 bg-gradient-to-r from-[#ff5f9e] via-[#ffd166] to-[#22e5c9] bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
                15 Games, One Search Algorithm
              </h1>
              <p className="mt-3 max-w-2xl text-foreground-muted">
                Every game here is played against an agent built on the same idea: search the
                game tree, score the outcomes, and pick the move that leads there. Smaller games
                get perfect, unbeatable play; larger ones use a depth-limited search guided by a
                heuristic. Pick one to start.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {GAMES.map((g) => (
                <GamePickerCard key={g.id} game={g} onSelect={() => setSelected(g.id)} />
              ))}
            </div>
          </>
        )}

        {selected && ActiveGame && (
          <>
            <button
              onClick={() => setSelected(null)}
              className="rise-in mb-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-foreground-muted transition hover:border-accent hover:bg-surface-hover"
            >
              ← All games
            </button>
            <ActiveGame />
          </>
        )}
      </div>
    </div>
  );
}