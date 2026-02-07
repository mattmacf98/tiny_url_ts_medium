import express from "express";
import process from "node:process";

const app = express();
const port = process.env.PORT ?? 8080;

app.get("/health", (_req, res) => {
  res.send("healthy");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
