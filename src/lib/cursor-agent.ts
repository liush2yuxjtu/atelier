import { spawn } from "node:child_process";
import { accessSync, constants, mkdtempSync } from "node:fs";
import { tmpdir, homedir } from "node:os";
import path from "node:path";

/** Locate the cursor-agent CLI (Cursor subscription, Auto model). */
export function findCursorAgent(): string | null {
  const candidates = [
    process.env.CURSOR_AGENT_BIN,
    path.join(homedir(), ".local/bin/cursor-agent"),
    "/opt/homebrew/bin/cursor-agent",
    "/usr/local/bin/cursor-agent",
    ...(process.env.PATH ?? "").split(path.delimiter).map((d) => path.join(d, "cursor-agent")),
  ].filter(Boolean) as string[];
  for (const c of candidates) {
    try {
      accessSync(c, constants.X_OK);
      return c;
    } catch {
      /* next */
    }
  }
  return null;
}

/** Which backend /api/add-tweaks uses. Env wins; otherwise cursor when installed. */
export function addTweaksProvider(): "cursor" | "http" {
  const env = (process.env.ATELIER_LLM_PROVIDER || "").toLowerCase();
  if (env === "cursor") return "cursor";
  if (env) return "http";
  return findCursorAgent() ? "cursor" : "http";
}

/**
 * One-shot, read-only Cursor Auto call. Runs in an empty temp workspace in
 * "ask" mode so the agent cannot edit files. Returns the model's final text.
 */
export function cursorAgentComplete(
  system: string,
  user: string,
  opts: { timeoutMs?: number; model?: string } = {},
): Promise<{ text: string; durationMs?: number }> {
  const bin = findCursorAgent();
  if (!bin) return Promise.reject(new Error("cursor-agent not found (install Cursor CLI and run `cursor-agent login`)"));
  const cwd = mkdtempSync(path.join(tmpdir(), "atelier-auto-"));
  const prompt = `${system}\n\n---\n\n${user}\n\nRespond with the JSON object only. Do not use tools.`;
  const args = [
    "-p",
    "--model",
    opts.model || process.env.ATELIER_CURSOR_MODEL || "auto",
    "--output-format",
    "json",
    "--mode",
    "ask",
    "--trust",
    "--workspace",
    cwd,
    prompt,
  ];
  return new Promise((resolve, reject) => {
    const child = spawn(/*turbopackIgnore: true*/ bin, args, { cwd, env: process.env, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn();
    };
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish(() => reject(new Error("cursor-agent timed out")));
    }, opts.timeoutMs ?? (Number(process.env.ATELIER_CURSOR_TIMEOUT_MS) || 300_000));
    const tryParse = () => {
      // The CLI can linger after printing its result line; resolve as soon as it appears.
      for (const line of out.split("\n")) {
        const t = line.trim();
        if (!t.startsWith("{")) continue;
        try {
          const j = JSON.parse(t) as { type?: string; is_error?: boolean; result?: string; duration_ms?: number };
          if (j.type === "result") {
            finish(() => {
              child.kill("SIGTERM");
              if (j.is_error) reject(new Error(j.result || "cursor-agent error"));
              else resolve({ text: j.result ?? "", durationMs: j.duration_ms });
            });
            return;
          }
        } catch {
          /* partial line */
        }
      }
    };
    child.stdout.on("data", (d) => {
      out += String(d);
      tryParse();
    });
    child.stderr.on("data", (d) => {
      err += String(d);
    });
    child.on("error", (e) => finish(() => reject(e)));
    child.on("close", (code) => {
      tryParse();
      finish(() => {
        const msg = /log ?in|auth|unauthori/i.test(err + out)
          ? "cursor-agent is not logged in — run `cursor-agent login` on the server machine"
          : `cursor-agent exited ${code}: ${(err || out).slice(0, 300)}`;
        reject(new Error(msg));
      });
    });
  });
}
