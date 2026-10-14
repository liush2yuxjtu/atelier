import { githubRawUrl } from "@/lib/extract";

export async function POST(req: Request) {
  const { url } = (await req.json()) as { url?: string };
  if (!url) return Response.json({ error: "url required" }, { status: 400 });

  try {
    if (url.includes("github.com")) {
      const candidates = [
        githubRawUrl(url, "src/index.css"),
        githubRawUrl(url, "app/globals.css"),
        githubRawUrl(url, "styles.css"),
        githubRawUrl(url, "README.md"),
      ].filter(Boolean) as string[];
      for (const candidate of candidates) {
        const res = await fetch(candidate, { redirect: "follow" });
        if (res.ok) {
          return Response.json({
            css: await res.text(),
            name: url,
            source: "github",
          });
        }
      }
      return Response.json({ error: "no CSS found in that repo" }, { status: 404 });
    }

    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return Response.json({ error: `fetch ${res.status}` }, { status: 502 });
    const html = await res.text();
    const cssParts = [html];
    const links = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi)];
    for (const link of links.slice(0, 4)) {
      const href = link[0].match(/href=["']([^"']+)["']/i)?.[1];
      if (!href) continue;
      try {
        const abs = new URL(href, url).toString();
        const cssRes = await fetch(abs);
        if (cssRes.ok) cssParts.push(await cssRes.text());
      } catch {
        /* skip */
      }
    }
    return Response.json({ css: cssParts.join("\n"), name: url, source: "url" });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "extract failed" },
      { status: 502 },
    );
  }
}
