import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  const { email, password } = req.body || {};
  // TODO: valida contra tu base de datos / Firebase Admin / etc.
  if (!email || !password)
    return res.status(400).json({ error: "email/password required" });

  // Demo: NO usar en producción. Aquí pondrías tu lógica real.
  const fakeToken = "demo.jwt.token";
  return res.status(200).json({ user: { email }, token: fakeToken });
}
