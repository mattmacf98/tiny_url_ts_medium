import express from "express";
import process from "node:process";
import crypto from "node:crypto";

const app = express();
const port = process.env.PORT ?? 8080;
const baseUrl = process.env.BASE_URL ?? `http://localhost:${port}`;

// In-memory store: shortCode -> long URL
const urlStore = new Map<string, string>();

app.use(express.json());

function getShortCodeFromUrl(url: string): string {
  return crypto.createHash("sha256").update(url).digest("hex").slice(0, 8);
}

app.get("/health", (_req, res) => {
  res.send("healthy");
});

app.post("/shorten", (req, res) => {
  const url = req.body?.url;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing or invalid url field" });
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  const shortCode = getShortCodeFromUrl(url);
  urlStore.set(shortCode, url);

  const shortUrl = `${baseUrl}/short/${shortCode}`;
  return res.status(201).json({ short_url: shortUrl });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
