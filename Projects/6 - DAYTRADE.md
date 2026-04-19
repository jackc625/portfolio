# Crypto Breakout Trader

A risk-disciplined momentum breakout bot for liquid crypto/USD pairs, paired with a walk-forward validation pipeline that blocks promotion of strategies that don't earn it.

Single-process Python application. Runs a paper-trading loop against Gemini's sandbox API on 5-minute candles, and ships a full walk-forward + hold-out + Monte Carlo backtesting pipeline that replays the same strategy, filter, and risk code against historical Parquet data. Every design decision prioritizes correctness and capital preservation over throughput or flash.

---

<!-- CASE-STUDY-START -->

## Problem

Systematic crypto day-trading is easy to implement badly and expensive to run badly. Most open-source bots I looked at chased a strategy — "I found the magic indicator combination" — and ignored the surrounding engineering: position sizing that doesn't exceed the account, a kill switch that reads unrealized losses and not just closed-trade P&L, state that survives a mid-write crash without leaving phantom positions, and a backtest that can't cheat by seeing tomorrow's close. I wanted to build Daytrade to flip that ratio. The strategy was the replaceable component; the surrounding apparatus was the product. The non-obvious constraint was code-path identity between live trading and backtest: if the paper loop and the walk-forward backtest use different indicator math or different entry logic, a bug in either surface hides from the other — and the whole promotion pipeline becomes aspirational rather than binding.

## Approach & Architecture

I built Daytrade as a single-process Python application composed through constructor injection at `TradingBot` startup. Each component implemented an ABC from `interfaces.py` — `BaseStrategy`, `BaseBroker`, `BaseExchange`, `BaseFilter` — so the orchestrator depended on interfaces, not implementations. The main loop polls every 20 seconds, pulls 5-minute OHLCV candles via `DataFeed` → `ExchangeClient` (a CCXT Gemini wrapper with 3-retry network handling), and dispatches through `BreakoutStrategy` → `FilterChain` → `PositionSizer` → `PaperBroker`.

The breakout strategy fires on a newly closed candle when `close >= yesterday_high * (1 + BREAKOUT_BUFFER)` and `volume >= VOL_MULT * mean(prior 20 candles)`. Yesterday's high is cached per UTC day; the 20-bar volume baseline uses `.shift(1).rolling(20).mean()` so the current bar is never in its own average. Exits are pre-computed at entry with `TP_MULT=2.0` giving a 2R target. The same function body runs in the backtest via `check_signal_on_df` — shared indicator math, shared entry logic — so any drift between live and backtest paths breaks a test.

Signal filtering ran through a composable `FilterChain`: `TrendFilter` rejected counter-trend breakouts when `EMA-50 < EMA-200` and `RSI(14) < 50`, `ChopFilter` rejected ranging markets when `ADX(14) < 20`, and `LiquidityFilter` rejected wide bid-ask spreads. All three ran on every signal — no short-circuit — so every rejection got logged with its reason. Cheapest-first ordering put the cache-local reads (trend, chop) before the exchange round-trip (liquidity). NaN indicator values defaulted to pass so a fresh symbol with a half-warm ADX didn't silently block entries.

Risk management was layered. `PositionSizer` computed `qty = (equity * RISK_PER_TRADE) / stop_distance` and clamped against `get_available_capital()`, which returned `max(0, equity - allocated_capital)` — this closed a real over-allocation bug (AUDIT-02) where three concurrent positions could silently fund a fourth the account couldn't support. `DailyGuard` read `PaperBroker.get_equity_with_unrealized`, walked every open position at the latest candle close, applied mark-to-market P&L, and compared against the `-3%` daily threshold. `TradeCounter` hard-capped trades per symbol per UTC day with a 3-consecutive-stop-out lockout.

State persistence used `portalocker.Lock` + `.tmp` + `os.replace` — atomic on POSIX and Windows — so `state/bot_state.json` could never be half-written. Reads retried 3 times on contention and logged `CRITICAL` if all failed. The same pattern wrote backtest promotion artifacts.

## Tradeoffs

Composable filters added startup config complexity but made A/B-testing a config change rather than a redeploy. Conservative fills — assuming the stop filled first when both stop and take-profit were touched in the same candle — systematically underestimated paper performance, which was what I wanted (false confidence before live is strictly more dangerous than honest underperformance). `os.replace` atomicity added one fsync per state-changing event but eliminated half-written-state bugs. 5-minute candles reduced noise versus 1-minute at the cost of delayed entries; the filter chain was tuned assuming 5m.

## Outcome

Daytrade ran as a single-process Python application polling 5-minute candles every 20 seconds across a configurable USD-pair universe on Gemini's sandbox. The codebase sits at around 300 passing tests across unit, integration, slow, and live markers (strictly enforced via `--strict-markers`), with golden Parquet + CSV fixtures in `tests/fixtures/` so indicator-math drift shows up as a diff. The walk-forward pipeline in `backtest/` produced 180/60/30 day train/validation/test windows with a 200-bar pre-warm buffer, Optuna TPE optimization with plateau-centroid parameter picking and jitter-robustness checks, Monte Carlo permutation of returns, and a 7-gate promotion evaluator (Sharpe, max-drawdown, positive-weeks on both OOS and hold-out slices, plus a jitter pass-rate floor). The gate emits an atomic `PROMOTION.json` bound to git SHA, parameter hash, and SHA-256-per-symbol Parquet content hashes. The current shipped artifact at `data/backtests/breakout/.../PROMOTION.json` shows `verdict: "FAILED"` for the breakout strategy at Gemini's 1.20% taker / 0.60% maker base-tier fees: five of seven gates failed. That is the pipeline doing exactly what it was built to do.

## Learnings

The hardest lesson was that the backtest's job is to refuse promotion, not to rubber-stamp it. My first instinct was to tune the gate thresholds until the breakout strategy passed. The correct move was the opposite: lock the gate floors with Pydantic `ge`/`le` validators so they couldn't be relaxed through `.env` editing, and let a failing strategy fail visibly in the artifact. The deeper lesson was that hard-coded safety floors are worth their maintenance cost — security-through-configuration only works when the configuration has teeth. A close second was atomic state persistence: my first version wrote directly to the state file, and one mid-write crash produced a corrupted JSON that fed a phantom position into the next startup. The temp-file-then-`os.replace` pattern with `portalocker` is three lines of extra code and eliminates a class of bugs I could not reason my way around.

<!-- CASE-STUDY-END -->

## Project Status

> **Paper trading only.** `settings.mode == "live"` raises `NotImplementedError` at bot init (`main.py`). The `LiveBroker` class does not exist in the codebase — only its docstring references do.

What's live today:

- **Breakout strategy** — intraday momentum, 5-minute candles, yesterday-high + volume-spike signal, long-only.
- **Backtest & promotion pipeline** — walk-forward windows, hold-out guard, Monte Carlo permutation, and a 7-gate promotion evaluator that emits a signed, machine-readable `PROMOTION.json`.
- **Paper broker** — conservative SL-first fill model, allocation tracking, unrealized-aware equity for the kill switch.
- **State persistence & crash recovery** — atomic JSON state writes with cross-platform file locking.
- **Health monitor, rotating logs, pydantic-settings config with range validators.**

What's scaffolded or planned:

- VWAP Pullback, Volatility Squeeze, and Cross-Sectional Momentum strategies — planned, not yet implemented. Only the breakout strategy is wired in, and it is the only name on the promotion allowlist.
- Meta-controller, React/Next.js dashboard, Telegram alerts, REST/WebSocket API, Docker / CI pipeline, multi-exchange support — planned, roadmap-only. None are present in the repo today.

**Current promotion verdict — and why it's a feature, not a bug:** The repo ships a real artifact at `data/backtests/breakout/2026-04-15T19-58-55Z_281f303/PROMOTION.json` showing `verdict: "FAILED"` for the breakout strategy at Gemini's 1.20% taker / 0.60% maker base-tier fees. Five of seven gates failed. This is the validation pipeline doing exactly what it was built to do: refuse to hand a losing strategy to a future live broker. Promotion is not a rubber stamp.

---

## High-Level Overview

**What it is.** A standalone Python CLI (`python main.py`) that runs a polling trading loop, detects intraday breakout signals on 5-minute candles for a configurable universe of USD pairs on Gemini, gates those signals through three filters, sizes positions using a risk-per-trade formula, and manages stop-loss / take-profit exits through a simulated paper broker. Alongside the trading loop, the repo contains a full offline validation subsystem under `backtest/` that replays historical Parquet data through the same breakout strategy, filter, and risk code.

**Who it's for.** A single operator running it on their own machine. This is an engineering project, not a product — there is no multi-user system, no hosted service, no dashboard, no API.

**What problem it solves.** Systematic breakout trading is easy to implement badly and expensive to run badly. This project treats the strategy as one replaceable component in a larger apparatus whose real job is to *not lose money through bugs*: to size positions correctly, to honor stop-losses reliably, to fire a kill switch exactly when it's supposed to, to never corrupt state across a crash, and to never promote a strategy to live trading that hasn't survived a rigorous walk-forward and Monte Carlo pipeline. The breakout strategy is the proof-of-concept; the surrounding machinery is the product.

**Why it's interesting.** Three things separate this from a typical open-source trading bot:

1. **Code-path identity between live and backtest.** Indicator math and breakout logic live in shared pure functions — the backtest exercises the same entry rules the paper loop does, so a bug in either path shows up in the other.
2. **A real promotion gate.** The backtest CLI doesn't just print a tearsheet. It writes an atomic, hash-bound, git-SHA-stamped `PROMOTION.{json,md}` verdict designed to be consumed by a future live broker at startup.
3. **Production-mindedness at the seams.** Atomic state writes, Windows-safe concurrent log rotation, pydantic range validators, fail-safe-to-no-action error handling, and an unrealized-inclusive kill switch — the boring engineering that matters when real money is on the line.

---

## Key Features

### Strategy Engine

- **Intraday momentum breakout** on 5-minute candles. Enters long when `close >= yesterday_high * (1 + BREAKOUT_BUFFER)` and current volume `>= VOL_MULT * avg(prior 20 candles)`.
- **Signal dataclass** carries full breakout metadata — yesterday's high, breakout threshold, current volume, 20-bar average volume, volume ratio — so every decision is inspectable after the fact.
- **Per-symbol candle dedupe** via `last_seen_timestamps` ensures a new candle close produces at most one signal even though the loop polls every 20 seconds.
- **Stop-loss / take-profit pre-computed at entry** as `entry * (1 - SL_PCT)` and `entry * (1 + SL_PCT * TP_MULT)`. Exits are evaluated on every new candle against the raw high/low.
- **Code-path identity** — `DataFeed.compute_indicators` (live) and `backtest/indicators.py::compute_indicators_on_df` (offline) are the same function body, called from a thin live delegator. Same for the strategy's live `check_signal()` and offline `check_signal_on_df()`.

### Filter Pipeline

- **Composable `FilterChain`** — filters implement the `BaseFilter` ABC and are composed at runtime. The strategy is unaware filters exist; the orchestrator runs `filter_chain.passes()` between signal and sizing.
- **Three filters active by default:**
  - `TrendFilter` — blocks entries when `EMA-50 < EMA-200` AND `RSI(14) < 50` (counter-trend rejection).
  - `ChopFilter` — blocks entries when `ADX(14) < 20` (rejects ranging markets).
  - `LiquidityFilter` — blocks entries when the bid-ask spread exceeds a configurable threshold.
- **No short-circuit evaluation.** All filters run on every signal so every rejection reason is logged. Debugging why a signal got rejected never requires re-running anything.
- **Cheapest-first ordering** — cache-local DataFrame reads (trend, chop) run before the exchange round-trip (liquidity).
- **NaN defaults to pass.** Missing indicator data is fail-safe: a blank ADX on a fresh symbol should not silently block entries.

### Risk Management

- **Risk-based position sizing.** `qty = (equity * risk_per_trade) / stop_distance`. A 1% risk with a 1% stop makes the notional equal to equity; the math is deliberately obvious.
- **Daily kill switch on unrealized-inclusive equity.** The `DailyGuard` check walks every open position at the most recent candle close, subtracts unrealized losses, and compares to a start-of-day baseline before the `-3%` threshold. This catches accounts bleeding into a bad day through held losers that haven't yet tripped their stops.
- **Per-symbol trade counter.** Hard cap of `MAX_TRADES_PER_COIN` per UTC day, plus an additional "3 consecutive stop-outs blocks the coin for the day" rule.
- **Max concurrent positions** cap across all symbols.
- **ATR-ratio volatility guard.** When the current ATR(14) exceeds `VOLATILITY_ATR_MULT` times the 20-bar median ATR, position size is reduced — not blocked. Preserves signal exposure without over-sizing in unusually volatile conditions.
- **Available-capital sizing.** Position sizer clamps to `max(0, equity - allocated_capital)` so concurrent positions can never sum to more than the account. This closed a real bug (AUDIT-02) where the bot could silently allocate >100% across open positions.
- **Exchange-limit validation.** Every order is validated against exchange minimum notional, min/max quantity, and precision *before* placement.

### State Persistence & Crash Recovery

- **Atomic JSON state writes** via `portalocker` + tmp-file + `os.replace`. The on-disk state at `state/bot_state.json` can never be half-written.
- **Retry on read contention.** The read path retries up to 3 times on lock contention, backs off between attempts, and logs `CRITICAL` if all retries fail rather than silently losing data.
- **Full position restoration at startup.** Open positions, equity, and allocation tracking are rebuilt from disk; the bot does not forget about positions through a restart.
- **Graceful shutdown.** `Ctrl+C` persists state if positions are open, clears it if not, and prints a full session summary before exit.

### Backtest & Promotion Pipeline

- **Walk-forward windows** — 180-day train / 60-day validation / 30-day test, rolled forward with a 200-bar pre-warm buffer so the first bar of every window has real indicator values.
- **Hold-out guard** — a structural assertion (`assert_not_in_holdout`) that blocks optimization from peeking into the reserved hold-out slice.
- **Optuna TPE optimization** per window with plateau-centroid parameter picking and jitter robustness checks (configurable trial and jitter counts).
- **Monte Carlo permutation** of returns to produce confidence intervals that don't assume normality.
- **7 promotion gates** — Sharpe, max-drawdown, positive-weeks on both the out-of-sample and hold-out slices, plus a jitter pass-rate floor.
- **Atomic, hash-bound verdict.** `PROMOTION.{json,md}` are written with the same portalocker + tmp + `os.replace` pattern as the live state file, and the JSON artifact is bound to git SHA, parameter hash, and per-Parquet SHA-256 content hashes so a future consumer can verify the exact strategy + data at startup.
- **Strategy name allowlist.** The `--strategy` CLI argument is validated against `ALLOWED_STRATEGY_NAMES = frozenset({"breakout"})` and a conservative identifier regex *before* any filesystem path is built from it. Untrusted input cannot create a traversal path.

### Observability

- **Windows-safe rotating logs.** Uses `ConcurrentRotatingFileHandler` when available (Windows needs it — stdlib `RotatingFileHandler` fights file locks during rotation), falls back to the stdlib handler otherwise, with 10MB × 5-file rotation at UTF-8.
- **Structured session summaries** on shutdown — peak equity, max drawdown, win rate, time-in-market, per-symbol breakdown.
- **Health monitor dedup.** Failure messages are logged once per state transition via a `blocking_logged` flag so a hung exchange doesn't flood the log.

---

## Technical Highlights

Seven engineering decisions that matter. Each is grounded in a specific module and exists because the naive alternative was worse.

### 1. Atomic state persistence with cross-platform file locking

`state_manager.py` writes state to a `.tmp` sibling of `state/bot_state.json` while holding a `portalocker.Lock`, then calls `os.replace` to swap the files atomically. `os.replace` is atomic on POSIX and Windows — there is no window in which a crash can corrupt the live state file. The read path retries 3 times on lock contention and logs `CRITICAL` ("positions may be orphaned") if all retries fail rather than silently returning stale or empty data. The same pattern is reused by the promotion artifact writer.

### 2. Conservative paper-broker fill model

`broker.py::PaperBroker.evaluate_exits` assumes SL-first when both the stop and the take-profit are touched in the same candle. This is the pessimistic assumption — it systematically *under*states paper-trading performance rather than overstating it. The backtest broker (`backtest/broker.py`) makes the same assumption, so optimism or pessimism never creeps in differently between the two paths.

### 3. Kill switch on unrealized equity, not just realized

`PaperBroker.get_equity_with_unrealized` walks every open position at the latest candle close and applies unrealized P&L to the equity snapshot before the `DailyGuard` compares it to the `-3%` drawdown threshold. Logged equity and `equity_after` in the trade journal are intentionally realized-only — those fields capture historical fact — but the kill switch reads the right number. Without this, a `-2.5%` realized day with two losers a breath from their stops could bleed into `-5%` before a single stop fires.

### 4. Available-capital sizing closes the over-allocation gap

`PaperBroker.get_available_capital()` returns `max(0, equity - allocated_capital)`, where `allocated_capital` is the running sum of open-position notionals. `TradingBot.process_entry_signal` sizes against available capital, not raw equity. This stopped the bot from silently opening a position it couldn't fund when three concurrent positions already existed.

### 5. Fail-safe-to-no-action error handling at every layer

A missed signal is strictly safer than a bad one. The code is written accordingly:

- Per-symbol `try/except` in `process_symbols` — one symbol's exception never stops the loop or affects another symbol.
- Per-position `try/except` in `evaluate_all_exits` — a bad candle for BTC never blocks an ETH exit.
- `ExchangeClient` retries `ccxt.NetworkError` 3 times with a 2-second delay before giving up.
- `DataFeed` returns empty DataFrames on error (the strategy reads them and correctly produces no signal).
- `BreakoutStrategy.check_signal` returns `None` on any exception.
- Config validation is range-checked at startup (see §Reliability) — a malformed `.env` crashes before a single order is placed.

### 6. Structural no-lookahead in the backtest engine

`backtest/engine.py` slices `df.iloc[:t_idx+1]` before handing a DataFrame to the strategy — the strategy *cannot* see future bars because they are not in the object it receives. The 20-bar volume average used in the breakout rule is computed as `.shift(1).rolling(20).mean()`, so the current bar is never in its own baseline. Entries open at `t+1` open, not `t` close. This eliminates the entire class of "my backtest looked great until I ran it live" bugs.

### 7. Git-SHA + data-hash bound promotion verdicts

`backtest/promotion.py` emits `PROMOTION.json` with a locked v1.0 schema: `verdict`, `git_sha`, `param_hash`, `parquet_file_hashes` (SHA-256 per symbol), `centroid_params`, `gate_results` (per-gate passed/actual/threshold/reason), `fees_used`, `slippage_used`, `master_seed`, `monte_carlo`. The companion `PROMOTION.md` is a human-readable diff. A future live broker can re-hash its own Parquet files at startup and refuse to run if anything has shifted since promotion. The same strategy-name allowlist that guards the CLI also appears here — no path into the writer can take a string the repo doesn't recognize.

---

## Architecture Overview

### Live path (paper trading loop)

```
main.py::TradingBot
  ├── config.settings ─────────────────────────── (imported everywhere)
  ├── interfaces (BaseStrategy/Broker/Exchange/Filter)
  ├── exchange_client.ExchangeClient ──► ccxt.gemini  (sandbox or live endpoint)
  ├── data_feed.DataFeed ──► exchange_client, backtest.indicators (pure fn)
  ├── strategy.BreakoutStrategy ──► data_feed, models.Signal
  ├── filters.{Trend,Chop,Liquidity,Chain} ──► interfaces.BaseFilter
  ├── risk.{PositionSizer, DailyGuard, TradeCounter}
  ├── broker.PaperBroker ──► models.Position, interfaces.BaseBroker
  ├── journal.TradeJournal ──► models.Position  (CSV append)
  ├── state_manager.StateManager ──► portalocker, models.Position (JSON, atomic)
  ├── metrics.PerformanceMetrics ──► broker, journal
  └── health_checks.HealthMonitor ──► exchange_client
```

`TradingBot` is the orchestrator. It is instantiated once at startup and composes every other component via constructor injection. Components never reach across each other — interactions go through the orchestrator.

### Backtest path (offline validation)

```
backtest.__main__ (CLI: walkforward / single-run / evaluate / promote)
  ├── backtest.data_loader.ParquetDataLoader ──► Parquet (+ SHA-256 hash)
  ├── backtest.wfo.build_windows / prewarm_indicators / WalkForwardRunner / HoldoutGuard
  ├── backtest.engine.BacktestEngine ──► strategy.check_signal_on_df, filters.FilterChain, risk.*
  ├── backtest.broker.BacktestBroker ──► backtest.fees.FeeSchedule, backtest.slippage.HybridSlippage
  ├── backtest.optimizer (Optuna TPE, plateau centroid, jitter, DefaultGates)
  ├── backtest.analytics (Sharpe/Calmar/Sortino, Monte Carlo, quantstats wrappers)
  ├── backtest.report (quantstats tearsheet)
  └── backtest.promotion (7 gates, ALLOWED_STRATEGY_NAMES, PROMOTION.{json,md} atomic write)
```

The orchestrator here is `WalkForwardRunner`, which calls `BacktestEngine.run(df, symbol=X)` one window at a time. The engine is single-symbol by design; cross-symbol composition happens in the runner. `HoldoutGuard` is a structural barrier — not a flag — that raises if optimization ever touches hold-out data.

### Component responsibilities

| Component | What it owns |
|---|---|
| `TradingBot` | Lifecycle, main loop, daily reset, component composition |
| `ExchangeClient` | CCXT Gemini wrapper, retry on network errors, markets cache |
| `DataFeed` | OHLCV fetching, yesterday's-high cache, indicator pipeline |
| `BreakoutStrategy` | Entry rules (price + volume), exit math, dedupe per symbol |
| `FilterChain` | Runs `TrendFilter`, `ChopFilter`, `LiquidityFilter` in cheapest-first order |
| `PositionSizer` | Risk-based qty formula, ATR volatility guard, exchange limit validation |
| `DailyGuard` | Kill switch against unrealized-inclusive equity |
| `TradeCounter` | Per-symbol trade and stop-out counters |
| `PaperBroker` | Position lifecycle, SL-first fill model, allocation tracking |
| `TradeJournal` | Append-only CSV of closed trades |
| `StateManager` | Atomic JSON persistence of open positions + equity |
| `PerformanceMetrics` | Drawdown, time-in-market, session and all-time summaries |
| `HealthMonitor` | Freshness, connectivity, watchdog, entry gating |

---

## Tech Stack

Actual runtime dependencies declared in `requirements.txt` (minimum-version constraints, no lockfile):

| Package | Constraint | Used for |
|---|---|---|
| `ccxt` | `>= 4.0.0` | Gemini API client (sandbox + live endpoints) |
| `pandas` | `>= 2.0.0` | OHLCV processing, trade journal, DataFrame ops |
| `numpy` | `>= 1.24.0` | Numerical ops (mostly transitive through pandas) |
| `pandas-ta` | `>= 0.4.0` | EMA, RSI, ADX, ATR indicators |
| `pyarrow` | `>= 15.0.0` | Parquet I/O for the historical-data cache |
| `pydantic` | `>= 2.0.0` | Settings model with field-level validators |
| `pydantic-settings` | `>= 2.0.0` | `.env` loading with `BaseSettings` |
| `python-dotenv` | `>= 1.0.0` | Transitive through pydantic-settings |
| `requests` | `>= 2.31.0` | Transitive through ccxt |
| `concurrent-log-handler` | `>= 0.9.25` | Windows-safe rotating file handler |
| `portalocker` | `>= 2.8.0` | Cross-platform file locking for atomic writes |
| `optuna` | `>= 4.8.0` | TPE optimization inside walk-forward windows |
| `quantstats` | `>= 0.0.81` | Sharpe/Calmar/Sortino wrappers and HTML tearsheets |

Dev dependencies: `pytest >= 7.4.0`, `pytest-cov >= 4.1.0`.

**What's deliberately not present.** No `black`, `ruff`, `mypy`, `flake8`, or `pre-commit`. No `.github/workflows/`, no `Dockerfile`, no `docker-compose.yml`. No FastAPI, Flask, or Starlette — this project has no HTTP surface. No database driver, no ORM, no migrations. No `python-telegram-bot`, no Slack SDK. No `frontend/` or `dashboard/` directory; no `package.json` anywhere. Tooling is pytest. Everything else is aspirational and lives on the roadmap.

---

## Feature Deep Dive

### Breakout Strategy

Entry condition (both must be true on a newly closed 5m candle):

1. **Price trigger.** `close >= yesterday_high * (1 + BREAKOUT_BUFFER)`. `yesterday_high` is computed from the prior UTC day's daily candle and cached in `DataFeed.yesterday_highs` — refreshed once per UTC-midnight rollover, not per loop.
2. **Volume trigger.** `current_volume >= VOL_MULT * mean(prior 20 candles' volume)`. The "prior 20" window is implemented as `.shift(1).rolling(20).mean()` so the current bar is excluded from its own baseline.

Exit math is pre-computed at entry:

- `stop_loss = entry * (1 - SL_PCT)`  (default 1% below entry)
- `take_profit = entry * (1 + SL_PCT * TP_MULT)`  (default 2% above — `TP_MULT=2.0` gives a 2R target)

The same rules run in the backtest via `check_signal_on_df` on a historical DataFrame, which derives `yesterday_high` from the prior UTC day's max high in the frame. When the two code paths drift, a test breaks — they share the indicator module and a parallel signal function.

### Filter Chain

Three independent filters, composed through `FilterChain`:

- **`TrendFilter`** — rejects the signal when `EMA-50 < EMA-200` **and** `RSI(14) < FILTER_RSI_THRESHOLD` (default 50). Either a rising trend or an RSI above 50 is enough to pass. This is a cache-local DataFrame read.
- **`ChopFilter`** — rejects when `ADX(14) < FILTER_ADX_THRESHOLD` (default 20). ADX below 20 indicates a ranging market where breakouts are more likely noise than signal. Also cache-local.
- **`LiquidityFilter`** — rejects when `(ask - bid) / mid > FILTER_SPREAD_THRESHOLD` (default 0.2%). Requires a fresh ticker call — intentionally last in the chain.

Ordering is explicit: the cheapest filter runs first. If a signal is going to be rejected for chop, it is rejected before the bot spends an API round-trip on the bid-ask spread.

The chain never short-circuits. Every filter runs on every candidate signal. That means every rejection is fully explained in the log, which makes "why did X not fire?" a question you can answer without re-running anything. NaN indicator values default to pass — a fresh symbol with a half-filled ADX should never silently block an entry just because the indicator hasn't warmed up.

### Risk Layer

Position sizing lives in `risk.py::PositionSizer`:

```
notional = equity * RISK_PER_TRADE / stop_distance_fraction
qty      = notional / entry_price
```

With defaults (`equity = $10,000`, `RISK_PER_TRADE = 0.01`, `SL_PCT = 0.01`), the notional is exactly equity. Larger stops sized smaller. The formula is written this way because it is self-explanatory and cannot drift.

Three independent gates run before a signal becomes an order:

- **`DailyGuard`** — compares start-of-day equity against current equity-including-unrealized. If the drawdown exceeds `DAILY_DRAWDOWN` (default `-3%`), the kill switch latches and blocks entries for the remainder of the UTC day. The guard resets at midnight UTC.
- **`TradeCounter`** — hard cap on trades per symbol per day (`MAX_TRADES_PER_COIN`, default 3), with a separate 3-consecutive-stop-outs rule that removes a coin from eligibility for the day.
- **Volatility guard** — compares `ATR(14)` to the 20-bar median ATR. If the ratio exceeds `VOLATILITY_ATR_MULT`, the position *size* is reduced. The signal is not blocked — the bot trades smaller rather than hesitating.

Two exchange-side validations run last: min notional and min/max quantity with precision. If any of those fail, the order is skipped and logged, and the loop continues.

### Paper Broker

`PaperBroker` is the only broker implementation. It is responsible for three things:

1. **Opening and restoring positions.** `open_position` runs through `TradeCounter` and the exchange-limit validator. `restore_position` (used only on startup) bypasses risk validation but correctly updates `allocated_capital` so the bot's available-capital math stays right through a restart.
2. **Evaluating exits on each new candle.** For each open position, it checks the just-closed candle's high and low against the position's take-profit and stop-loss. If both are touched in the same bar, it assumes the stop filled first — a deliberately pessimistic assumption that keeps paper performance honest. The backtest broker makes the same assumption.
3. **Tracking equity and allocation.** `get_current_equity` returns realized equity (unrealized P&L is intentionally excluded from logged equity and the CSV `equity_after` column so the journal captures historical fact). `get_equity_with_unrealized` walks open positions at the latest candle close — that is what the kill switch reads. `get_available_capital` returns `max(0, equity - allocated_capital)`; the sizer uses this, not raw equity, to prevent the bot from opening a fourth position it cannot fund.

### State Persistence

`state/bot_state.json` holds the live open-position set and the equity reading at last save. The write path is:

1. Acquire `portalocker.Lock` on the target file.
2. Serialize positions + equity + timestamp to JSON.
3. Write to a `.tmp` sibling.
4. `os.replace(tmp, target)` — atomic on both POSIX and Windows.
5. Release the lock.

Reads retry 3 times on lock contention with exponential backoff. A corruption on read returns `([], None)` — the bot boots clean rather than dying — and logs `CRITICAL` so the operator knows positions may be orphaned. On graceful shutdown the bot saves if positions are open, and *clears* the file if none are, so a clean exit never leaves stale state for the next run.

### Health Monitor

`HealthMonitor` runs on a cadence inside the main loop and gates new entries only (exits always run — never let a health problem stop the bot from closing a losing position).

- **Data freshness.** Flags candle data older than 10 minutes. Common causes: exchange outage, misconfigured symbol, weekend on a traditional market.
- **Exchange connectivity.** Every ~3 minutes the monitor pings the exchange. A failure logs once (via a `blocking_logged` flag) and flips the entry gate; recovery logs once.
- **Watchdog.** 15 minutes with no new candle across *any* symbol in the universe means something is wrong at a system level — connectivity issue, network partition, stopped exchange feed — and entries are blocked.

The gate is a single method — `should_block_new_entries()` — and is called once per symbol per loop iteration. Structurally simple, so it cannot drift from the feature list.

### Backtest & Promotion Pipeline

The pipeline replays historical Parquet data through the same strategy, filter, and risk code the live loop uses. Top-level orchestration lives in `backtest/wfo.py::WalkForwardRunner`; the CLI entry point is `python -m backtest`.

**Window construction.** `build_windows` produces rolling 180/60/30 day (train/validation/test) windows with a 200-bar pre-warm buffer so indicators are fully populated by the first active bar of every window. Windows are day-based; `to_ms(data_start_ms)` lifts them to millisecond boundaries when hitting loaders.

**Hold-out guard.** A slice of data — the tail — is reserved. `HoldoutGuard.assert_not_in_holdout` is called from inside the optimizer callback and raises if optimization ever touches the reserved range. Structural, not a flag.

**Per-window optimization.** Each window runs an Optuna TPE study over a search space defined as tuples (no Optuna `Trial` object leaks to callers). Selection does not pick the best single trial — it computes a *plateau centroid* over trials within a tolerance of the best, which is more robust to overfit spikes.

**Jitter robustness.** After centroid selection, the optimizer re-runs with small perturbations to the chosen params and records a pass rate. A centroid that wins by luck and nothing else will fail the jitter gate.

**Monte Carlo.** Returns from the out-of-sample slice are permuted many times (default 1000) to produce a distribution of possible outcomes. This is the statistic the promotion gate reads — it does not assume normality.

**Promotion gates.** `backtest/promotion.py` implements seven gates — Sharpe (OOS), max-drawdown (OOS), positive-weeks (OOS), Sharpe (hold-out), max-drawdown (hold-out), positive-weeks (hold-out), and jitter pass rate. Each gate returns a `GateResult` with `passed`, `actual`, `threshold`, and `reason`. `FAILED` is a first-class verdict — no gate raises, so the artifact is always well-formed even on a losing run. That is why the repo can ship a real `PROMOTION.json` with `verdict: "FAILED"` rather than a half-finished run.

**Atomic write + content binding.** `PROMOTION.{json,md}` are written via portalocker + tmp + `os.replace`, same pattern as the live state file. The JSON is bound to `git_sha`, `param_hash`, and per-Parquet `parquet_file_hashes` (SHA-256 per symbol) so a future live-broker consumer can re-verify at startup that the strategy and data haven't drifted. The writer is also guarded by the strategy-name allowlist — the CLI's `--strategy` arg is validated against `ALLOWED_STRATEGY_NAMES = frozenset({"breakout"})` and a conservative identifier regex *before* any filesystem path is constructed from it.

---

## Data & Domain Model

### `Position` (`models.py`)

Required at construction:

- `symbol: str` (e.g. `"BTC/USD"`)
- `entry_price: float`, `stop_loss: float`, `take_profit: float`
- `quantity: float`
- `entry_timestamp: int` (milliseconds UTC)

Optional / populated on close:

- `side: str` — defaults to `"long"`. Short P&L math exists in `calculate_pnl`, but `PaperBroker.open_position` hard-codes long — the current live flow is long-only by design.
- `exit_price`, `exit_timestamp`, `pnl`, `exit_reason` (`"TP"`, `"SL"`, `"manual"`, `"time_stop"`, `"eod"`)
- `net_pnl: Optional[float]` — populated by fee-aware brokers (e.g. `BacktestBroker`). `pnl` stays gross.

Behavior: `calculate_pnl`, `close_position`, `is_open`, `get_duration_ms` / `get_duration_minutes`, `get_r_multiple`, `to_dict`, `to_csv_row`.

### `Signal` (`models.py`)

Fields: `symbol`, `entry_price`, `timestamp`, `yesterday_high`, `breakout_threshold`, `volume_ratio`, `avg_volume`, `current_volume`. Carries enough context that a rejected signal, or a retroactive review of a fired one, is always inspectable.

### Trade journal CSV (`data/trades.csv`)

Append-only. Twelve columns:

```
ts_open, symbol, entry, sl, tp, qty, ts_close, exit, side, pnl, equity_after, exit_reason
```

Timestamps are integer milliseconds UTC. `equity_after` is realized equity at the moment the trade closed — not session equity, not a running mark-to-market.

### State JSON (`state/bot_state.json`)

```json
{
  "positions": [
    {
      "symbol": "BTC/USD",
      "entry_price": 50000.0,
      "stop_loss": 49500.0,
      "take_profit": 51000.0,
      "quantity": 0.1,
      "entry_timestamp": 1234567890000,
      "side": "long"
    }
  ],
  "equity": 10200.0,
  "timestamp": "2026-04-16T12:00:00.000000+00:00"
}
```

Written atomically on every state-changing event (open, close, restore).

### `PROMOTION.json` v1.0

Locked fields: `schema_version`, `verdict` (`"PROMOTED"` | `"FAILED"`), `run_id`, `strategy_class_name`, `git_sha`, `centroid_params`, `param_hash`, `parquet_file_hashes`, `gate_results`, `fees_used`, `slippage_used`, `master_seed`, `monte_carlo`. Additive fields require bumping `schema_version`. The current artifact in `data/backtests/breakout/` is a complete, real example.

---

## Configuration

All configuration is `.env`-driven and validated by `config.py::Settings` (a `pydantic-settings.BaseSettings` model). A malformed `.env` crashes at startup with a friendly error — never at first order.

Most operationally meaningful variables (full list in `.env.example`):

| Variable | Default | Notes |
|---|---|---|
| `MODE` | `paper` | `in {paper, live}`; live raises `NotImplementedError` at init |
| `EXCHANGE` | `gemini_sandbox` | `in {gemini_sandbox, gemini}` |
| `GEMINI_API_KEY`, `GEMINI_API_SECRET` | — | Required; must not be empty or placeholder |
| `UNIVERSE` | `BTC/USD, ETH/USD` | Comma-separated; non-empty |
| `TIMEFRAME` | `5m` | |
| `RISK_PER_TRADE` | `0.01` | Bounded `(0, 0.05]` — cannot exceed 5% per trade |
| `DAILY_DRAWDOWN` | `-0.03` | Must be negative |
| `MAX_CONCURRENT` | `5` | Positive int |
| `MAX_TRADES_PER_COIN` | `3` | Positive int |
| `SL_PCT` | `0.01` | Positive |
| `TP_MULT` | `2.0` | Positive; 2R target |
| `BREAKOUT_BUFFER` | `0.0025` | 0.25% above yesterday's high |
| `VOL_MULT` | `2.0` | Volume ratio vs 20-bar mean |
| `STARTING_EQUITY` | `10000.0` | Paper only |
| `FILTER_TREND_ENABLED` | `True` | Each filter individually toggleable |
| `FILTER_CHOP_ENABLED` | `True` | |
| `FILTER_LIQUIDITY_ENABLED` | `True` | |
| `VOLATILITY_GUARD_ENABLED` | `True` | |
| `FILTER_ADX_THRESHOLD` | `20.0` | |
| `FILTER_RSI_THRESHOLD` | `50.0` | |
| `FILTER_SPREAD_THRESHOLD` | `0.002` | `0 < v < 1` |
| `VOLATILITY_ATR_MULT` | `1.5` | |
| `PROMOTION_MIN_SHARPE` | `1.0` | Hard floor `ge=0.8` — cannot be relaxed in `.env` |
| `PROMOTION_MAX_DRAWDOWN` | `0.12` | Hard ceiling `le=0.15` |
| `PROMOTION_MIN_POSITIVE_WEEKS` | `0.55` | Floor `ge=0.50` |
| `PROMOTION_MIN_JITTER_PASS_RATE` | `0.90` | Floor `ge=0.85` |
| `BACKTEST_TAKER_FEE` | `0.012` | Gemini base tier |
| `BACKTEST_MAKER_FEE` | `0.006` | |
| `SLIPPAGE_FIXED_BPS` | `2.0` | `[0, 50]` |
| `SLIPPAGE_ATR_COEFF` | `0.05` | `[0, 1]` |

The promotion-gate floors deserve particular attention: they are `Field(..., ge=...)` validators, meaning you cannot silently loosen a gate through `.env` editing. Relaxing them requires a visible code diff in a PR. Security-through-configuration only works if the configuration has teeth.

---

## Reliability & Production Considerations

The production story is the third pillar of this project, not an afterthought. The bot is expected to run unattended against real money in its live successor, so the current paper version is already written as if it were.

**Fail-safe to no action.** A missed signal is always safer than a bad one. At every layer the default on error is to skip the current unit of work and continue, never to panic or crash:

- `process_symbols` wraps each symbol iteration in `try/except`. One broken symbol never affects another or halts the loop.
- `evaluate_all_exits` wraps each open position in `try/except`. Errors evaluating BTC's exit cannot prevent ETH from taking its take-profit.
- `ExchangeClient` retries `ccxt.NetworkError` 3 times with a 2-second delay.
- `DataFeed` returns empty DataFrames on error; `BreakoutStrategy.check_signal` returns `None` on any exception.
- The health monitor blocks *only* new entries on bad data — exits continue unconditionally.

**Atomicity at the file system.** All state-mutating writes — `state/bot_state.json`, `data/backtests/.../PROMOTION.{json,md}` — use `portalocker.Lock` + `.tmp` + `os.replace`. A crash mid-write leaves the previous state intact. A reader during a write is serialized behind the lock.

**Cross-platform robustness.** The developer machine is Windows; the code treats that as a first-class target. UTF-8 console reconfigure at startup, `ConcurrentRotatingFileHandler` in preference to stdlib's `RotatingFileHandler` (which fights file locks on Windows), and `portalocker` (not `fcntl`) for file locking.

**Rotating logs with backpressure.** 10 MB per file, 5 backups, UTF-8 encoded. `ccxt` and `urllib3` are demoted to `WARNING` so they do not flood the log. Backtest runs further demote broker/engine/strategy loggers to `ERROR` inside the CLI — multi-GB run logs at `INFO` were an observed problem.

**Config cannot silently degrade safety.** `risk_per_trade` is bounded above. `daily_dd_limit` must be negative. Promotion-gate thresholds have `ge`/`le` validators that keep the floors genuinely floors. Wrong config crashes loud at startup.

**Entry gating on health.** Exchange outage, stale data (>10 min), or a quiet feed (>15 min across the universe) all block new entries without touching exit evaluation.

**No silent allocation bug.** Available-capital sizing is the specific fix to a real over-allocation issue (AUDIT-02) that existed in an earlier revision.

**Tests as the only automated check.** No GitHub Actions pipeline is wired up today — CI is planned but not yet present. The test suite is the line of defense — ~300 passing tests covering broker, risk, state manager, filters, health checks, historical data, backtest engine/broker/analytics/promotion, and end-to-end integration. Pytest markers (`unit`, `integration`, `slow`, `live`) are enforced via `--strict-markers`, so typos don't silently skip tests.

---

## Project Structure

```
crypto-breakout-trader/
├── main.py                     # Entry point; TradingBot orchestrator; main loop; logging setup
├── config.py                   # pydantic-settings Settings; .env loading; range validators
├── interfaces.py               # ABCs: BaseStrategy, BaseBroker, BaseExchange, BaseFilter
├── models.py                   # Position, Signal dataclasses
├── exchange_client.py          # CCXT Gemini wrapper; sandbox/live toggle; retry; markets cache
├── data_feed.py                # OHLCV fetching; yesterday's-high cache; indicator delegator
├── strategy.py                 # BreakoutStrategy: live + offline signal functions + exit math
├── filters.py                  # TrendFilter, ChopFilter, LiquidityFilter, FilterChain
├── risk.py                     # PositionSizer, DailyGuard, TradeCounter
├── broker.py                   # PaperBroker (only live broker implementation)
├── journal.py                  # TradeJournal (append-only CSV)
├── state_manager.py            # Atomic JSON state persistence (portalocker)
├── metrics.py                  # PerformanceMetrics: drawdown, time-in-market, summaries
├── health_checks.py            # HealthMonitor: freshness, connectivity, watchdog
├── historical_data.py          # CLI: Binance → Parquet backfill pipeline
│
├── backtest/
│   ├── __main__.py             # CLI: walkforward / single-run / evaluate / promote
│   ├── engine.py               # BacktestEngine — bar-by-bar; no-lookahead slicing; t+1 entry
│   ├── broker.py               # BacktestBroker — gap-through SL/TP; fees both legs
│   ├── fees.py                 # FeeSchedule frozen dataclass; Gemini base-tier factory
│   ├── slippage.py             # HybridSlippage (fixed + ATR); NoSlippage
│   ├── indicators.py           # Pure-function indicator computation (shared with live)
│   ├── data_loader.py          # ParquetDataLoader; windowed reads; SHA-256 content hashing
│   ├── wfo.py                  # build_windows, prewarm_indicators, WalkForwardRunner, HoldoutGuard
│   ├── optimizer.py            # Optuna TPE wrapper; plateau centroid; jitter; DefaultGates
│   ├── analytics.py            # Sharpe/Calmar/Sortino + Monte Carlo + quantstats wrappers
│   ├── promotion.py            # 7 gates; ALLOWED_STRATEGY_NAMES; PROMOTION.{json,md} writer
│   ├── report.py               # quantstats tearsheet wrapper
│   └── types.py                # Frozen dataclasses: WindowResult, BacktestRun, PromotionRecord
│
├── tests/                      # ~300 tests across unit/integration/slow/live markers
│   ├── conftest.py             # Shared fixtures (settings, mock_exchange, broker, ...)
│   ├── fixtures/               # Golden candles (Parquet) and golden trades (CSV)
│   └── test_*.py               # One test module per source module + integration tests
│
├── utils/
│   └── time.py                 # Candle-close math; timeframe parsing (library, not wired into main)
│
├── data/
│   ├── trades.csv              # Append-only trade journal
│   ├── historical/             # Parquet OHLCV cache by symbol/timeframe
│   └── backtests/              # PROMOTION artifacts + per-window metrics + tearsheets
│
├── state/bot_state.json        # Live state snapshot (atomic)
├── logs/bot.log                # Rotating log (10 MB × 5)
│
├── requirements.txt
├── pytest.ini
├── .env.example                # Full documented template
└── CLAUDE.md                   # Agent-facing project conventions
```

---

## Getting Started

The bot runs as a foreground process. There is no UI; everything is CLI + log tail.

```bash
# One-time setup
python -m venv .venv
.venv\Scripts\activate           # or source .venv/bin/activate on POSIX
pip install -r requirements.txt

# Configure
cp .env.example .env             # fill in GEMINI_API_KEY / GEMINI_API_SECRET (sandbox keys)

# Run the paper trading loop
python main.py

# Backfill historical OHLCV into Parquet cache (Binance is used because Gemini cannot paginate)
python historical_data.py --symbol BTC/USDT --out-symbol BTC/USD --days 365

# Run a full walk-forward + promotion pipeline
python -m backtest walkforward --strategy breakout --universe all --seed 42 --n-trials 200
```

The operator lives in three places:

1. **The log tail** (`logs/bot.log`) — every signal, filter rejection, order, exit, and daily-reset event is there.
2. **The trade journal** (`data/trades.csv`) — an append-only history of closed trades.
3. **Backtest artifacts** (`data/backtests/<strategy>/<run_id>/`) — `PROMOTION.json`, `PROMOTION.md`, per-window metrics, tearsheets, trade Parquet files.

`Ctrl+C` exits cleanly: open positions are persisted to state, a session summary is logged, and the bot shuts down.

---

## Testing

The test suite is the primary safety net.

- **~300 passing tests** across `tests/` — exact count varies with recent gap-closure work.
- **Markers:** `unit`, `integration`, `slow`, `live` — declared in `pytest.ini` and enforced via `--strict-markers`, so typos fail the run.
- **Offline-only.** `tests/conftest.py` provides shared fixtures (`settings`, `mock_exchange_client`, `broker`, `slippage_zero`, ...) that make every test runnable without a `.env` file or real network access.
- **Deterministic fixtures.** `tests/fixtures/` contains `golden_candles.parquet` and `golden_trades.csv` plus the `make_golden_*.py` scripts that regenerate them, so changes to indicator math or fill behavior show up as golden-diff failures.
- **Coverage emphasis** on the modules where correctness matters most: `broker.py`, `risk.py`, `state_manager.py`, `filters.py`, `health_checks.py`, and the full `backtest/` subsystem.

```bash
pytest                           # all tests
pytest -m unit                   # unit only
pytest -m "not slow"             # skip the slow integration and backtest tests
pytest --cov=.                   # with coverage (pytest-cov is pre-installed)
```

---

## Roadmap & Extensibility

None of the items below are implemented. They are listed here because the extension points for them — the ABCs, the filter chain, the fee-schedule injection, the strategy-name allowlist — are real architectural surface that's already in the codebase.

**Planned features:**

- **`LiveBroker`.** Currently raises `NotImplementedError` in `TradingBot.__init__` when `MODE=live`. A real implementation needs CCXT live order placement, OCO or polling-based SL/TP, slippage tracking (measured vs expected), and verification against the promoted `PROMOTION.json` at startup.
- **Additional strategies (planned).** VWAP Pullback, Volatility Squeeze, and Cross-Sectional Momentum are scoped in `PRD.txt` as roadmap items but are not yet implemented. Each would live beside `strategy.py::BreakoutStrategy` and implement `BaseStrategy`.
- **Meta-controller.** A strategy-selection layer that routes live trading to the right strategy for the current market regime. Not yet implemented; the backtest allowlist (`ALLOWED_STRATEGY_NAMES = {"breakout"}`) enumerates what the pipeline can promote today.
- **React / Next.js dashboard (planned).** No `frontend/`, `dashboard/`, or `web/` directory exists today. No `package.json` anywhere in the repo — this is roadmap, not implemented.
- **Telegram alerts.** `grep -i telegram` returns nothing in any `.py` file. The architectural enabler (a pub/sub event bus) is also not yet present.
- **REST / WebSocket API (planned).** No FastAPI, Flask, or Starlette imports exist anywhere in the codebase — this surface is roadmap, not yet implemented.
- **Multi-exchange support.** Only `ccxt.gemini` is instantiated. `config.EXCHANGE` validates against `{gemini_sandbox, gemini}`; adding another exchange requires touching the validator *and* the client wiring.

**Extension points that are already present:**

- **Four ABCs** in `interfaces.py` — `BaseStrategy`, `BaseBroker`, `BaseExchange`, `BaseFilter` — define the contract shape for every implementation. A new filter is `class MyFilter(BaseFilter)` and a line in `filters.py::FilterChain`.
- **`FilterChain` composition.** Filters are runtime-composable; the chain has no knowledge of the strategy.
- **`FeeSchedule` injection.** The backtest broker takes its fee schedule at construction; adding a new exchange tier or promotional rate is a `FeeSchedule(...)` instance.
- **`ALLOWED_STRATEGY_NAMES` allowlist.** Registering a new strategy name in the promotion pipeline is a single frozenset edit — intentionally small and visible.
- **Code-path identity.** A new strategy that implements `check_signal_on_df` the same way `BreakoutStrategy` does gets free backtest support — no extra glue required.

---

## Conclusion

The headline of this project is not "an open-source trading bot." The headline is the machinery around the strategy: atomic state with cross-platform file locking, a walk-forward + Monte Carlo + 7-gate promotion pipeline that emits a hash-bound `PROMOTION.json`, a kill switch that reads unrealized equity, a paper broker that is pessimistic about its own fills, code-path identity between live and backtest, and a config system whose safety floors cannot be silently relaxed through `.env` editing.

The breakout strategy itself currently fails promotion at Gemini's base-tier fees — and that is exactly what the pipeline is supposed to do when a strategy doesn't earn promotion. The work is in the refusal.

What's missing from the roadmap — live broker, additional strategies, a dashboard, alerts, a REST API — is called out honestly and labeled as planned, not as features. The goal is a README a senior engineer can read end to end and trust every line of, including the lines that say "not yet."
