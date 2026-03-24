import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import ambulanceRoutes from './routes/ambulanceRoutes';
import signalRoutes from './routes/signalRoutes';
import authRoutes from './routes/authRoutes';
import { setupSocketHandlers } from './sockets/socketHandler';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.use('/api', authRoutes);
  app.use('/api/ambulance', ambulanceRoutes);
  app.use('/api/signals', signalRoutes);

  // Socket.io setup
  setupSocketHandlers(io);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
