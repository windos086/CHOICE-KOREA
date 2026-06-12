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

  // Bypass CORS to retrieve standard real-time N Powerball result JSON from Frame domain (matching the live dashboard exactly)
  app.get("/api/game-result/powerball", async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    try {
      const response = await fetch("https://xn--950bo4em5v.co/data/minigame/nball/powerball5/result.json?t=" + Date.now(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (response.status === 200) {
        const data = await response.json();
        return res.json(data);
      }
      return res.status(response.status).json({ error: "Failed to fetch from co" });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Recent results for Powerball (5분)
  app.get("/api/game-result/powerball/recent", async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    try {
      const response = await fetch("https://xn--950bo4em5v.co/data/minigame/nball/powerball5/recent.json?t=" + Date.now(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (response.status === 200) {
        const data = await response.json();
        return res.json(data);
      }
      return res.status(response.status).json({ error: "Failed to fetch from co recent" });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // N Powerball (3분) result
  app.get("/api/game-result/powerball3", async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    try {
      const response = await fetch("https://xn--950bo4em5v.co/data/minigame/nball/powerball3/result.json?t=" + Date.now(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (response.status === 200) {
        const data = await response.json();
        return res.json(data);
      }
      return res.status(response.status).json({ error: "Failed to fetch from co powerball3" });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Recent results for Powerball (3분)
  app.get("/api/game-result/powerball3/recent", async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    try {
      const response = await fetch("https://xn--950bo4em5v.co/data/minigame/nball/powerball3/recent.json?t=" + Date.now(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (response.status === 200) {
        const data = await response.json();
        return res.json(data);
      }
      return res.status(response.status).json({ error: "Failed to fetch from co powerball3 recent" });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // N Power Ladder result (5분)
  app.get("/api/game-result/powerladder", async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    try {
      const response = await fetch("https://xn--950bo4em5v.co/data/minigame/nball/powerladder5/result.json?t=" + Date.now(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (response.status === 200) {
        const data = await response.json();
        return res.json(data);
      }
      return res.status(response.status).json({ error: "Failed to fetch from co" });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Recent results for Power Ladder (5분)
  app.get("/api/game-result/powerladder/recent", async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    try {
      const response = await fetch("https://xn--950bo4em5v.co/data/minigame/nball/powerladder5/recent.json?t=" + Date.now(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (response.status === 200) {
        const data = await response.json();
        return res.json(data);
      }
      return res.status(response.status).json({ error: "Failed to fetch from co powerladder recent" });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Red Power Ladder result
  app.get("/api/game-result/redpowerladder", async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    try {
      const response = await fetch("https://xn--950bo4em5v.co/data/minigame/redball/powerladder/result.json?t=" + Date.now(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (response.status === 200) {
        const data = await response.json();
        return res.json(data);
      }
      return res.status(response.status).json({ error: "Failed to fetch from co red" });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Recent results for Red Power Ladder
  app.get("/api/game-result/redpowerladder/recent", async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    try {
      const response = await fetch("https://xn--950bo4em5v.co/data/minigame/redball/powerladder/recent.json?t=" + Date.now(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (response.status === 200) {
        const data = await response.json();
        return res.json(data);
      }
      return res.status(response.status).json({ error: "Failed to fetch from co red recent" });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // N Power Ladder (3분) result
  app.get("/api/game-result/powerladder3min", async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    try {
      const response = await fetch("https://xn--950bo4em5v.co/data/minigame/nball/powerladder3/result.json?t=" + Date.now(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (response.status === 200) {
        const data = await response.json();
        return res.json(data);
      }
      return res.status(response.status).json({ error: "Failed to fetch from co powerladder3" });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Recent results for Power Ladder (3분)
  app.get("/api/game-result/powerladder3min/recent", async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    try {
      const response = await fetch("https://xn--950bo4em5v.co/data/minigame/nball/powerladder3/recent.json?t=" + Date.now(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (response.status === 200) {
        const data = await response.json();
        return res.json(data);
      }
      return res.status(response.status).json({ error: "Failed to fetch from co powerladder3 recent" });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Speed Ladder 1min result
  app.get("/api/game-result/speedladder1", async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    try {
      const response = await fetch("https://xn--950bo4em5v.co/data/minigame/ladder/speedladder/result.json?t=" + Date.now(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (response.status === 200) {
        const data = await response.json();
        return res.json(data);
      }
      return res.status(response.status).json({ error: "Failed to fetch from co speedladder1" });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Recent results for Speed Ladder 1min
  app.get("/api/game-result/speedladder1/recent", async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    try {
      const response = await fetch("https://xn--950bo4em5v.co/data/minigame/ladder/speedladder/recent.json?t=" + Date.now(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (response.status === 200) {
        const data = await response.json();
        return res.json(data);
      }
      return res.status(response.status).json({ error: "Failed to fetch from co speedladder1 recent" });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Bypass CORS to retrieve standard Ladder result JSON (using keno_ladder since it matches 5-minute schedule/RNG) from Entry
  app.get("/api/game-result/ladder", async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    try {
      const response = await fetch("https://www.ntry.com/data/json/games/keno_ladder/result.json?t=" + Date.now(), {
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

  // Helper for mapping Bepick Keno Ladder item format to the expected format
  function mapBepickItem(item: any) {
    if (!item) return null;
    
    // date is "20260612" in Bepick API, map it to "2026-06-12"
    let formattedDate = "";
    if (typeof item.date === 'string' && item.date.length === 8) {
      formattedDate = `${item.date.slice(0, 4)}-${item.date.slice(4, 6)}-${item.date.slice(6, 8)}`;
    } else {
      formattedDate = String(item.date || "");
    }
    
    // start_point: fd1 = 1 is LEFT, fd1 = 2 is RIGHT
    const start_point = item.fd1 === 1 ? "LEFT" : "RIGHT";
    
    // line_count: fd2 = 1 is 3, fd2 = 2 is 4
    const line_count = item.fd2 === 1 ? 3 : 4;
    
    // odd_even: fd3 = 1 is ODD, fd3 = 2 is EVEN
    const odd_even = item.fd3 === 1 ? "ODD" : "EVEN";
    
    return {
      date: formattedDate,
      round: String(item.round),
      start_point,
      line_count,
      odd_even,
      date_round: item.round,
      fixed_date_round: (item.date || "").replace(/-/g, '') + String(item.round).padStart(3, '0')
    };
  }

  // Endpoints for Keno Ladder (엔트리 키노사다리)
  app.get("/api/game-result/kenoladder", async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    try {
      const response = await fetch("https://api.bepick.io/game/ntry_keladder", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (response.status === 200) {
        const result: any = await response.json();
        if (result && result.success && Array.isArray(result.data) && result.data.length > 0) {
          const firstItem = result.data[0];
          const mapped = mapBepickItem(firstItem);
          if (mapped) {
            return res.json({
              d: mapped.date,
              r: mapped.date_round,
              s: mapped.start_point,
              l: mapped.line_count,
              o: mapped.odd_even,
              ...mapped
            });
          }
        }
      }
      return res.status(response.status).json({ error: "Failed to fetch from bepick ntry_keladder" });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/game-result/kenoladder/recent", async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    try {
      const response = await fetch("https://api.bepick.io/game/ntry_keladder", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (response.status === 200) {
        const result: any = await response.json();
        if (result && result.success && Array.isArray(result.data)) {
          const mappedList = result.data.map(mapBepickItem).filter(Boolean);
          return res.json(mappedList);
        }
      }
      return res.status(response.status).json({ error: "Failed to fetch from bepick ntry_keladder recent" });
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

