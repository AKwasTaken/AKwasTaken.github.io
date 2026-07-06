---
title: "TermLog"
date: 2026-07-06
desc: "A lightweight, zero-dependency session logger for macOS that captures, sanitizes, and streams clean terminal workflows into separate log files across multiple windows and tabs simultaneously."
source: "http://github.com/AKwasTaken/TermLog"
download: "https://github.com/AKwasTaken/TermLog/releases/download/v1.0/termlog-v1.0.tar.gz"
tags: ["GO", "MacOS", "Utility"]
---

## The Main Motivation

Every developer has been there: you spend three hours debugging a complex environment issue, running dozens of commands, piping outputs, and wrestling with configuration files. Finally, it works. But thirty minutes later, you realize you forgot to log your terminal session, and the precise sequence of steps you took is now lost in a messy shell history full of typos and raw ANSI noise.

To solve this, I built TermLog. It is a lightweight, high-performance, zero-dependency command-line utility written in Go designed to capture, sanitize, and preserve your terminal workflows in real-time into individual log files across multiple terminal windows or tabs simultaneously.

Here is a deep dive into why I built it, how it works under the hood, its architectural trade-offs, and where the project is headed.

---

## The Core Philosophy

Existing solutions for terminal logging generally fall into two camps: the heavy-handed Unix `script` utility (which captures every single raw character, cursor movement, and ANSI color escape sequence, making the raw output practically unreadable), or shell history files (which only log the command itself, omitting the execution output completely).

TermLog was engineered around a simple philosophy: **capture the context, discard the noise.**

It continuously monitors your active shell sessions, automatically strips out interface clutter, and tracks separate window contexts dynamically without requiring you to manage complex environment variables manually.


---

## Implemented Features & Powers

| Command | Usage | Description |
| :--- | :--- | :--- |
| **Log From Below** | `termlog below {filename}` | Initializes a new session and records terminal activity forward from this exact point. |
| **Log Snapshot** | `termlog above {filename}` | Captures a static export of the existing terminal scrollback history up to this point. |
| **Live Tracking** | `termlog live {filename}` | Baseline snapshots current window text and continuously streams future activity live. |
| **Pause Logging** | `termlog offline` | Temporarily halts real-time tracking while preserving all previously captured log content. |
| **Resume Logging** | `termlog online` | Restarts real-time logging and injects a clean structural timeline marker into the file. |
| **Session Status** | `termlog status` | Displays the current monitoring state, active logging mode, and absolute target file path. |
| **Stop Engine** | `termlog quit` | Terminates the background daemon process safely for the active terminal window session. |

### 1. Flexible Session Capturing

TermLog provides three discrete operational modes to adapt to whenever you realize you need a log:

* **Live Tracking (`termlog live`):** Captures your entire current terminal scrollback buffer as a baseline, then immediately begins streaming all future command inputs and execution outputs to the log file in real-time.
* **Point-Forward Logging (`termlog below`):** Drops a chronological marker in your session and records only the terminal activity generated *after* that precise moment.
* **Instant Snapshot (`termlog above`):** Dumps a static export of your existing scrollback history on demand, perfect for when you've finished a task and want to save the recipe retroactively.

### 2. High-Performance, Zero-Leak Engine

The backend daemon is written completely in Go. Because it is natively compiled, it executes with an incredibly low footprint. While the background daemon snapshots interface buffers sequentially, it avoids common memory leak pitfalls by pre-compiling matching regex patterns globally and rigorously enforcing synchronous file descriptor recycling to maintain rock-solid memory stability.

### 3. Dynamic Multi-Terminal Mapping

One of the hardest problems with background terminal logging is context separation. If you have four terminal tabs open, how does a single background process know which command belongs to which file?

TermLog solves this using a centralized JSON state machine (`~/.termlog_state.json`) combined with dynamic screen-anchored session trackers. When you start logging, a unique cryptographic anchor marker is printed to your screen canvas. The background daemon concurrently polls open window buffers and cross-references these markers against active tracking profiles in the JSON registry, seamlessly routing inputs and outputs to their respective log files without overlapping data streams.

### 4. Granular Timeline Control

You can pause and resume tracking dynamically mid-session by typing `termlog offline` and `termlog online` directly into your terminal. The parsing engine recognizes these explicitly typed boundaries, ceases or resumes writing to disk accordingly, and leaves your historical logs perfectly intact while injecting clean structural timeline markers.

---

## Security & Safe-Tracking Guardrails

Security was a non-negotiable requirement during design. Because TermLog operates by scraping the rendered screen buffers rather than intercepting raw keyboard hardware events, it inherits several critical safety features natively:

* **Zero Password Exposure:** Secure shell prompts (like `sudo` or SSH authentication fields) explicitly suppress character echo on the terminal UI canvas. Because those characters are never drawn to the screen, sensitive password strings never touch TermLog's memory or log files.
* **Interactive App Separation:** Fullscreen alternate screen applications (such as text editors like `nano` and `vim`, or resource monitors like `top`) manipulate terminal textures on an entirely separate display layer. TermLog's streaming engine gracefully skips recording these complex interactive interface updates, automatically picking back up the moment you exit the app and return to the primary shell timeline.

---

## Pros & Cons

### Pros

* **Zero Dependencies:** Compiles down to a single, self-contained binary file. No interpreters, external libraries, or runtimes required.
* **Pragmatically Clean Logs:** Advanced regex sanitization layers proactively strip away raw ANSI color escape sequences, backspace/arrow navigation artifacts, and trailing spatial blank lines.
* **Low System Overhead:** The asynchronous loop sleeps for wide intervals relative to CPU cycles, consuming negligible processing power.
* **Native Context Isolation:** Flawlessly handles multiple window tabs and concurrent terminal apps independently out of the box.

### Cons

* **OS Bottleneck:** The current architecture relies heavily on macOS-specific UI-Automation hooks (AppleScript), natively binding the execution layer to `Terminal.app` and `iTerm2`.
* **Asynchronous Polling Delay:** Because the tracking routine functions via a 1-second polling frequency, there can be up to a one-second latency before executed commands flush to the physical log file.

---

## Architectural Limitations

The biggest structural hurdle currently facing TermLog is the **VS Code / Integrated Panel Blindspot**.

Because Electron-based environments (like VS Code, Cursor, or Obsidian) render their integrated terminals inside a custom Chromium web container rather than natively exposing standard macOS window structures, AppleScript is entirely blind to their text canvases. If you run TermLog inside an integrated editor panel, it will fail to scrape the screen. For now, users must utilize external terminal applications like `iTerm2` split-screens side-by-side with their text editors to ensure reliable tracking.

---

## Installation & Setup

Choose one of the three deployment methods below to install TermLog on your system.

### Method 1: Homebrew Tap (Recommended)

TermLog can be installed via a custom Homebrew Tap. Because it is a self-published formula, Homebrew requires you to explicitly grant a trust permission to the tap before installation:

```bash
# Add the custom repository tap
brew tap AKwasTaken/tap

# Grant explicit trust to the tap to bypass untrusted source errors
brew trust AKwasTaken/tap

# Install TermLog globally
brew install termlog

```

### Method 2: Pre-Compiled Binary (Tarball)

If you prefer to use the production release assets directly, download the latest release archive (`termlog-{version}.tar.gz`) from the Releases tab and run:

```bash
# Extract the production binary asset
tar -xzf termlog-{version}.tar.gz

# Make it executable and route it to your local system binaries
chmod +x termlog
sudo mv termlog /usr/local/bin/

```

### Method 3: Compile From Source (Manual Build)

If you wish to audit the codebase or optimize the executable compilation for your specific machine architecture, you can clone and build the binary manually using Go:

```bash
# Clone the repository workspace
git clone https://github.com/AKwasTaken/TermLog.git
cd termlog

# Strip development debug symbols and compile a production binary
go build -ldflags="-s -w" -o termlog *.go

# Install the binary into your system path execution layers
chmod +x termlog
sudo mv termlog /usr/local/bin/

```

---

### MacOS Security Requirements

Because TermLog utilizes underlying system scraping APIs to log separate tab buffers seamlessly, macOS requires two specific user-side authorizations during its initial execution:

1. **Automation Permissions:** The first time you execute an operational command (such as `termlog live` or `termlog below`), macOS will prompt you with a system modal requesting **Automation Permissions** so AppleScript can read window layout text arrays. You must click **OK** to authorize tracking.
2. **Gatekeeper Quarantine Override:** If you install TermLog via the pre-compiled Tarball or manual Go compilation rather than Homebrew, macOS Gatekeeper may flag the binary as unsigned. Strip the isolation attributes once to allow it to run:

```bash
sudo xattr -dr com.apple.quarantine /usr/local/bin/termlog

```

---

## The Master Plan: Future Roadmap

TermLog is currently a highly effective macOS-specific automation tool, but the next phase of development aims to convert it into a world-class, universally compatible logging platform.

### Phase 1: Pseudo-Terminal (PTY) Wrapper Core

The primary engineering priority is a complete rewrite of the core scraping logic, transitioning away from AppleScript UI-Automation toward a native Unix Pseudo-Terminal (PTY) wrapper system. By acting as a thin layer directly between the shell process and the operating system, TermLog will become completely cross-platform (Linux and macOS support) and will natively log text anywhere—including inside VS Code integrated terminals, headless multiplexers like `tmux`, and remote SSH loops.

### Phase 2: Automatic Shell Initialization

We plan to introduce a silent daemon auto-start integration via `.zshrc` or `.bashrc`. TermLog will run invisibly in the background for *every* terminal tab you open, discarding the temporary history upon a clean exit unless you explicitly request a save. This completely eliminates the human-error factor of forgetting to activate logging manually.

### Phase 3: Real-Time Content Processing

Future releases will introduce intelligent streaming formatting pipelines, including:

* **Automated Markdown Fencing:** Converting terminal code execution blocks and runtime outputs into fully structured, syntax-highlighted Markdown logs automatically.
* **Localized Pattern Redaction:** A customizable regex screening layer (`termlog redaction --status online --msg "[REDACTED]"`) to automatically scan for accidental leakage of API tokens, private keys, or credentials, scrubbing them before they ever reach the disk.
* **Retrospective Log Cleansing:** Commands like `termlog rm` to quickly slice the last executed block or specific programmatic clutter (like `pip install --upgrade` output logs) out of the active history file instantly.