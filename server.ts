import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("scores.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    score INTEGER NOT NULL,
    level INTEGER NOT NULL,
    lines INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/scores", (req, res) => {
    const scores = db.prepare("SELECT * FROM scores ORDER BY score DESC LIMIT 10").all();
    res.json(scores);
  });

  app.post("/api/scores", (req, res) => {
    const { name, score, level, lines } = req.body;
    if (!name || score === undefined) {
      return res.status(400).json({ error: "Name and score are required" });
    }
    const info = db.prepare("INSERT INTO scores (name, score, level, lines) VALUES (?, ?, ?, ?)").run(name, score, level, lines);
    res.json({ id: info.lastInsertRowid });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
