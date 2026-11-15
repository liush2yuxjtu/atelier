"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";
import { translate, type Locale } from "@/lib/locale";

const KEY = "atelier:locale";
const EVENT = "atelier:locale-change";
let fallback: Locale = "en";
const LocaleContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void } | null>(null);
function getLocale(): Locale {
  try {
    const saved = localStorage.getItem(KEY);
    return saved === "en" || saved === "zh-CN" ? saved : fallback;
  } catch { return fallback; }
}
function subscribe(listener: () => void) {
  window.addEventListener(EVENT, listener);
  window.addEventListener("storage", listener);
  return () => { window.removeEventListener(EVENT, listener); window.removeEventListener("storage", listener); };
}
function setLocale(locale: Locale) {
  fallback = locale;
  try { localStorage.setItem(KEY, locale); } catch { /* Selection still works when browser storage is unavailable. */ }
  window.dispatchEvent(new Event(EVENT));
}
const serverLocale = (): Locale => "en";
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getLocale, serverLocale);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("LocaleProvider is required");
  return { ...value, t: (text: string) => translate(value.locale, text) };
}

export function LocaleControl() {
  const { locale, setLocale } = useLocale();
  return (
    <select
      aria-label="Language / 语言"
      data-testid="locale-select"
      value={locale}
      onChange={(event) => setLocale(event.target.value as Locale)}
      className="rounded border border-white/15 bg-[#16141f] px-2 py-1 text-xs text-stone-300"
    >
      <option value="en">English</option>
      <option value="zh-CN">简体中文</option>
    </select>
  );
}
