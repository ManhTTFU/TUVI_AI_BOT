import express from 'express';
import cors from 'cors';
import { tuviRouter } from './routes/tuvi.js';
import { ensureDirs } from './store.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'tuvi-api' }));

app.use('/api/tuvi', tuviRouter);

const port = Number(process.env.API_PORT || 4000);

ensureDirs().then(() => {
  app.listen(port, () => {
    console.log(`[api] listening on http://localhost:${port}`);
  });
});
