import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { nanoid } from "nanoid";

const DIR = path.join(process.cwd(), ".data", "shares");

export async function POST(req: Request) {
  const snapshot = await req.json();
  await mkdir(DIR, { recursive: true });
  const token = nanoid(12);
  await writeFile(path.join(DIR, `${token}.json`), JSON.stringify(snapshot), "utf8");
  return Response.json({ token });
}
