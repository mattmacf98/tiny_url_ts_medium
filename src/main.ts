import express from "express";
import process from "node:process";
import crypto from "node:crypto";
import { Database } from "./db";
import { Cache } from "./cache";

const app = express();
const port = process.env.PORT ?? 8080;
const baseUrl = process.env.BASE_URL ?? `http://localhost:${port}`;

let db: Database;
let cache: Cache;
app.use(express.json());

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
  await db.addShortUrlEntry(shortCode, url);

  const shortUrl = `${baseUrl}/short/${shortCode}`;
  return res.status(201).json({ short_url: shortUrl });
});

app.get("/short/:shortCode", async (req, res) => {
  const { shortCode } = req.params;
  let originalUrl = await cache.get(shortCode);
  if (!originalUrl) {
    // If the URL is not in the cache, get it from the database
    originalUrl = await db.getShortUrlByShortId(shortCode);
    if (originalUrl) {
      // If the URL is found in the database, cache it
      await cache.set(shortCode, originalUrl);
    }
  }

  if (!originalUrl) {
    return res.status(404).send("Not Found");
  }

  await db.incrementShortIdAccesses(shortCode);

  return res.redirect(302, originalUrl);
});

async function start() {
  const postgresDsn = process.env.POSTGRES_DSN;
  if (!postgresDsn) {
    throw new Error("POSTGRES_DSN environment variable is required");
  }
  const redisAddr = process.env.REDIS_DSN;
  if (!redisAddr) {
    throw new Error("REDIS_DSN environment variable is required");
  }
  db = await Database.Connect(postgresDsn);
  cache = await Cache.connect(redisAddr);
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

start();
