import { readFile } from "node:fs/promises";
import path from "node:path";

const DIR = path.join(process.cwd(), ".data", "shares");

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  if (!/^[A-Za-z0-9_-]+$/.test(token)) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }
  try {
    const raw = await readFile(path.join(DIR, `${token}.json`), "utf8");
    return new Response(raw, { headers: { "content-type": "application/json" } });
  } catch {
    return Response.json({ error: "not found" }, { status: 404 });
  }
}
