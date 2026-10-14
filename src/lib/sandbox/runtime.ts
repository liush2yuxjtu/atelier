/**
 * Injected into every sandboxed artboard. Pure string — no bundler, no host imports.
 * Lives in an opaque-origin iframe; talks only via postMessage.
 */
export function buildRuntimeScript(nonce: string): string {
  return `(() => {
  const CHANNEL = "atelier";
  const NONCE = ${JSON.stringify(nonce)};
  const STYLE_KEYS = ${JSON.stringify([
    "color",
    "backgroundColor",
    "fontSize",
    "fontWeight",
    "fontFamily",
    "lineHeight",
    "letterSpacing",
    "textAlign",
    "padding",
    "margin",
    "borderRadius",
    "border",
    "opacity",
    "width",
    "height",
    "display",
    "gap",
  ])};

  let mode = "preview";
  let overlay = null;
  let selectedEl = null;
  let vendorBase = "";
  const pendingComplete = {};

  function send(payload) {
    parent.postMessage({ channel: CHANNEL, nonce: NONCE, payload }, "*");
  }

  function cssPath(el) {
    if (!el || el === document.documentElement) return "html";
    if (el.id) return "#" + CSS.escape(el.id);
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && node !== document.body) {
      let sel = node.nodeName.toLowerCase();
      if (node.className && typeof node.className === "string") {
        const cls = node.className.trim().split(/\\s+/).slice(0, 2).join(".");
        if (cls) sel += "." + cls.replace(/\\./g, "\\\\.");
      }
      const parent = node.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter((c) => c.nodeName === node.nodeName);
        if (siblings.length > 1) {
          sel += ":nth-of-type(" + (siblings.indexOf(node) + 1) + ")";
        }
      }
      parts.unshift(sel);
      node = node.parentElement;
      if (parts.length > 6) break;
    }
    return parts.join(" > ") || el.nodeName.toLowerCase();
  }

  function pickStyles(el) {
    const cs = getComputedStyle(el);
    const out = {};
    for (const k of STYLE_KEYS) out[k] = cs[k];
    return out;
  }

  function rectOf(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, width: r.width, height: r.height };
  }

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.setAttribute("data-atelier-chrome", "overlay");
    overlay.style.cssText = "position:fixed;pointer-events:none;border:2px solid #e8a87c;background:rgba(232,168,124,0.12);z-index:2147483646;display:none;border-radius:3px;";
    document.documentElement.appendChild(overlay);
    return overlay;
  }

  function showOverlay(el) {
    if (!el) { ensureOverlay().style.display = "none"; return; }
    const o = ensureOverlay();
    const r = el.getBoundingClientRect();
    o.style.display = "block";
    o.style.left = r.left + "px";
    o.style.top = r.top + "px";
    o.style.width = r.width + "px";
    o.style.height = r.height + "px";
  }

  function parseTweaks() {
    const script = document.querySelector('script[type="application/atelier-tweaks"]');
    let raw = script ? script.textContent : null;
    if (!raw) {
      const html = document.documentElement.innerHTML;
      const start = html.indexOf("/*@atelier-tweaks");
      const end = html.indexOf("@atelier-tweaks*/");
      if (start !== -1 && end !== -1) raw = html.slice(start + 17, end);
    }
    if (!raw) return {};
    try { return JSON.parse(raw); } catch { return {}; }
  }

  function applyTweaks(tweaks) {
    const schema = parseTweaks();
    const root = document.documentElement;
    Object.keys(tweaks).forEach((key) => {
      const field = schema[key] || {};
      let v = tweaks[key];
      if (typeof v === "boolean") v = v ? "1" : "0";
      else if (typeof v === "number" && field.unit) v = v + field.unit;
      root.style.setProperty("--tweak-" + key, String(v));
      document.querySelectorAll('[data-tweak="' + key + '"]').forEach((n) => {
        if (field.type === "text" || typeof tweaks[key] === "string") {
          n.textContent = String(tweaks[key]);
        }
      });
      if (key === "paper") document.body.style.background = String(tweaks[key]);
      if (key === "ink") document.body.style.color = String(tweaks[key]);
      if (key === "layout") {
        document.documentElement.setAttribute("data-layout", String(tweaks[key]));
        document.body.setAttribute("data-layout", String(tweaks[key]));
      }
    });
    applySections(tweaks);
  }

  function applySections(tweaks) {
    const by = {};
    Object.keys(tweaks).forEach((key) => {
      const m = /^sec:([a-z0-9-]+):(layout|visible|order|variant)$/.exec(key);
      if (!m) return;
      const id = m[1], prop = m[2];
      by[id] = by[id] || {};
      by[id][prop] = tweaks[key];
    });
    document.querySelectorAll("[data-section]").forEach((el) => {
      const id = el.getAttribute("data-section");
      const s = by[id];
      if (!s) return;
      if (s.layout != null) el.setAttribute("data-layout", String(s.layout));
      if (s.variant != null) el.setAttribute("data-variant", String(s.variant));
      if (s.order != null) el.style.order = String(s.order);
      if (s.visible != null) {
        const on = s.visible === true || s.visible === 1 || s.visible === "1" || s.visible === "true";
        el.hidden = !on;
        el.style.display = on ? "" : "none";
      }
    });
  }

  function isChrome(el) {
    return el && el.closest && el.closest("[data-atelier-chrome]");
  }

  function targetFrom(e) {
    const el = e.target;
    if (!el || el === document.documentElement || el === document.body || isChrome(el)) return null;
    return el.nodeType === 1 ? el : el.parentElement;
  }

  document.addEventListener("mousemove", (e) => {
    if (mode === "preview") return;
    const el = targetFrom(e);
    if (!el) { send({ type: "hover", selector: null }); showOverlay(null); return; }
    showOverlay(el);
    send({ type: "hover", selector: cssPath(el), rect: rectOf(el) });
  }, true);

  document.addEventListener("click", (e) => {
    if (mode === "preview") return;
    const el = targetFrom(e);
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    if (mode === "comment") {
      send({ type: "comment-pin", x: e.clientX, y: e.clientY, selector: cssPath(el) });
      return;
    }
    selectedEl = el;
    showOverlay(el);
    if (mode === "edit") {
      el.setAttribute("contenteditable", "true");
      el.focus();
    }
    send({
      type: "selected",
      selector: cssPath(el),
      tag: el.tagName.toLowerCase(),
      text: (el.innerText || "").slice(0, 500),
      styles: pickStyles(el),
      rect: rectOf(el),
    });
  }, true);

  document.addEventListener("input", (e) => {
    if (mode !== "edit") return;
    const el = e.target;
    if (!el || !el.getAttribute || el.getAttribute("contenteditable") !== "true") return;
    send({ type: "text-changed", selector: cssPath(el), text: el.innerText || "" });
  }, true);

  window.addEventListener("error", (e) => {
    send({ type: "error", message: e.message || "Script error", stack: e.error && e.error.stack });
  });
  window.addEventListener("unhandledrejection", (e) => {
    send({ type: "error", message: String(e.reason) });
  });

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error("failed to load " + src));
      document.head.appendChild(s);
    });
  }

  async function exportPng() {
    if (!window.html2canvas) {
      const base = vendorBase || "";
      await loadScript(base + "/vendor/html2canvas.min.js");
    }
    const canvas = await window.html2canvas(document.documentElement, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      logging: false,
    });
    return {
      data: canvas.toDataURL("image/png"),
      mime: "image/png",
      width: canvas.width,
      height: canvas.height,
    };
  }

  function pageInfo() {
    const w = Math.max(document.documentElement.scrollWidth, document.body ? document.body.scrollWidth : 0);
    const h = Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0);
    return { width: w, height: h };
  }

  window.artifact = {
    complete: function (prompt, options) {
      const id = (crypto.randomUUID && crypto.randomUUID()) || String(Date.now());
      return new Promise((resolve, reject) => {
        pendingComplete[id] = { resolve, reject };
        send({ type: "complete", id, prompt: String(prompt), options: options || {} });
        setTimeout(() => {
          if (pendingComplete[id]) {
            pendingComplete[id].reject(new Error("artifact.complete timed out"));
            delete pendingComplete[id];
          }
        }, 60000);
      });
    },
  };

  window.addEventListener("message", (e) => {
    const data = e.data;
    if (!data || data.channel !== CHANNEL || !data.payload) return;
    if (data.nonce && data.nonce !== NONCE) return;
    const msg = data.payload;
    switch (msg.type) {
      case "init":
        vendorBase = msg.vendorBase || "";
        break;
      case "set-mode":
        mode = msg.mode || "preview";
        if (mode === "preview") {
          if (selectedEl) selectedEl.removeAttribute("contenteditable");
          showOverlay(null);
        }
        break;
      case "apply-tweaks":
        applyTweaks(msg.tweaks || {});
        break;
      case "edit-style": {
        const el = document.querySelector(msg.selector);
        if (el && msg.styles) {
          Object.keys(msg.styles).forEach((k) => { el.style[k] = msg.styles[k]; });
          showOverlay(el);
        }
        break;
      }
      case "edit-text": {
        const el = document.querySelector(msg.selector);
        if (el) el.innerText = msg.text;
        break;
      }
      case "highlight": {
        const el = msg.selector ? document.querySelector(msg.selector) : null;
        showOverlay(el);
        break;
      }
      case "ping":
        send({ type: "pong", requestId: msg.requestId });
        break;
      case "export":
        (async () => {
          try {
            if (msg.format === "html") {
              send({
                type: "export-result",
                requestId: msg.requestId,
                format: "html",
                data: "<!DOCTYPE html>\\n" + document.documentElement.outerHTML,
                mime: "text/html",
                ...pageInfo(),
              });
            } else if (msg.format === "pdf-info") {
              send({
                type: "export-result",
                requestId: msg.requestId,
                format: "pdf-info",
                data: JSON.stringify(pageInfo()),
                mime: "application/json",
                ...pageInfo(),
              });
            } else {
              const png = await exportPng();
              send({ type: "export-result", requestId: msg.requestId, format: "png", ...png });
            }
          } catch (err) {
            send({ type: "error", message: "export failed: " + (err && err.message) });
          }
        })();
        break;
      case "complete-result": {
        const p = pendingComplete[msg.id];
        if (!p) break;
        delete pendingComplete[msg.id];
        if (msg.error) p.reject(new Error(msg.error));
        else p.resolve(msg.text || "");
        break;
      }
      default:
        break;
    }
  });

  function boot() {
    const schema = parseTweaks();
    const values = {};
    Object.keys(schema).forEach((k) => { values[k] = schema[k] && schema[k].value; });
    applyTweaks(values);
    const size = pageInfo();
    send({ type: "ready", tweaks: schema, size: { w: size.width, h: size.height }, nonce: NONCE });
    send({ type: "loaded" });
  }

  if (document.readyState === "complete" || document.readyState === "interactive") boot();
  else document.addEventListener("DOMContentLoaded", boot);
})();`;
}
