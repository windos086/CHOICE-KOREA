import express from "express";
import path from "path";
import { WebSocketServer } from "ws";
import "dotenv/config";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Enable CORS robustly
  app.use(cors({
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
  }));

  // API Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Authoritative server time endpoint
  app.get("/api/time", (req, res) => {
    res.json({ serverTime: Date.now() });
  });

  // Bypass CORS to retrieve standard real-time N Powerball result JSON from Entry
  app.get("/api/game-result/powerball", async (req, res) => {
    try {
      const response = await fetch("https://www.ntry.com/data/json/games/powerball/result.json", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (response.status === 200) {
        const data = await response.json();
        return res.json(data);
      }
      return res.status(response.status).json({ error: "Failed to fetch from ntry" });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Bypass CORS to retrieve N Power Ladder result JSON from Entry
  app.get("/api/game-result/powerladder", async (req, res) => {
    try {
      const response = await fetch("https://www.ntry.com/data/json/games/power_ladder/result.json", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (response.status === 200) {
        const data = await response.json();
        return res.json(data);
      }
      return res.status(response.status).json({ error: "Failed to fetch from ntry" });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Bypass CORS to retrieve standard Ladder result JSON (using keno_ladder since it matches 5-minute schedule/RNG) from Entry
  app.get("/api/game-result/ladder", async (req, res) => {
    try {
      const response = await fetch("https://www.ntry.com/data/json/games/keno_ladder/result.json", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (response.status === 200) {
        const data = await response.json();
        return res.json(data);
      }
      return res.status(response.status).json({ error: "Failed to fetch from ntry" });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware setup
  let vite: any;
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api') || url.includes('.')) {
        return next();
      }
      try {
        const fs = await import("fs");
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // WebSocket Server setup
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("🟢 WebSocket Client Connected");

    ws.on("message", (message) => {
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(message.toString());
        }
      });
    });

    ws.on("close", () => {
      console.log("🔴 WebSocket Client Disconnected");
    });
  });
}

startServer();

