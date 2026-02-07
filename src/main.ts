import express from "express";
import process from "node:process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const app = express();
const port = process.env.PORT ?? 8080;
const baseUrl = process.env.BASE_URL ?? `http://localhost:${port}`;

const STORE_PATH = path.join(process.cwd(), "data", "urls.json");

// In-memory store: shortCode -> long URL
const urlStore = new Map<string, string>();

app.use(express.json());

async function loadStore(): Promise<void> {
  try {
    const data = await fs.readFile(STORE_PATH, "utf-8");
    const obj = JSON.parse(data) as Record<string, string>;
    urlStore.clear();
    for (const [shortCode, url] of Object.entries(obj)) {
      urlStore.set(shortCode, url);
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      throw err;
    }
    // File doesn't exist yet, start with empty store
  }
}

async function saveStore(): Promise<void> {
  const dir = path.dirname(STORE_PATH);
  await fs.mkdir(dir, { recursive: true });
  const obj = Object.fromEntries(urlStore);
  await fs.writeFile(STORE_PATH, JSON.stringify(obj, null, 2), "utf-8");
}

function getShortCodeFromUrl(url: string): string {
  return crypto.createHash("sha256").update(url).digest("hex").slice(0, 8);
}

app.get("/health", (_req, res) => {
  res.send("healthy");
});

app.post("/shorten", async (req, res) => {
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
  await saveStore();

  const shortUrl = `${baseUrl}/short/${shortCode}`;
  return res.status(201).json({ short_url: shortUrl });
});

app.get("/short/:shortCode", (req, res) => {
    const { shortCode } = req.params;
    const originalUrl = urlStore.get(shortCode);
  
    if (!originalUrl) {
      return res.status(404).send("Not Found");
    }
  
    return res.redirect(302, originalUrl);
  });

async function start() {
  await loadStore();
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

start();
