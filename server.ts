import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post("/api/login", (req, res) => {
    const { ambulanceId, password } = req.body;
    
    // Hardcoded credentials for demo
    if (ambulanceId === "AMB123" && password === "1234") {
      // In a real app, we'd use JWT here
      res.json({ 
        success: true, 
        token: "clearroute-demo-token-" + Date.now(),
        user: { id: "AMB123", role: "operator" }
      });
    } else {
      res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
