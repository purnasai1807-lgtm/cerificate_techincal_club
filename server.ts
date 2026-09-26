import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import http from 'http';
import https from 'https';

const PORT = Number(process.env.PORT || 3000);
const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173,https://certificateflow-portal.vercel.app').split(',').map((origin) => origin.trim()).filter(Boolean);
const BACKEND_URL = (process.env.BACKEND_URL || process.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
const FRONTEND_DIST = path.resolve(process.cwd(), 'dist');

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
  if (origin && (allowedOrigins.includes(origin) || allowedOrigins.includes('*'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

function proxyToBackend(req: Request, res: Response) {
  const target = new URL(req.originalUrl, BACKEND_URL);
  const client = target.protocol === 'https:' ? https : http;
  const upstreamHeaders: Record<string, string> = { ...req.headers } as Record<string, string>;
  delete upstreamHeaders.host;
  delete upstreamHeaders.connection;
  delete upstreamHeaders['content-length'];

  const upstream = client.request(
    {
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port ? Number(target.port) : undefined,
      path: `${target.pathname}${target.search}`,
      method: req.method,
      headers: upstreamHeaders,
    },
    (upstreamRes) => {
      res.statusCode = upstreamRes.statusCode || 200;
      Object.entries(upstreamRes.headers).forEach(([key, value]) => {
        if (value === undefined) return;
        const normalized = Array.isArray(value) ? value : [value];
        res.setHeader(key, normalized as any);
      });
      upstreamRes.pipe(res);
    },
  );

  upstream.on('error', () => {
    res.status(502).json({
      success: false,
      error: {
        code: 'BACKEND_UNAVAILABLE',
        message: `Unified backend unavailable. Start the Flask API or set BACKEND_URL (current value: ${BACKEND_URL}).`,
      },
    });
  });

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    req.pipe(upstream);
  } else {
    upstream.end();
  }
}

app.use('/api', proxyToBackend);
app.use('/api/v1', proxyToBackend);

app.use(express.static(FRONTEND_DIST));

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'operational', service: 'CertificateFlow frontend proxy', backendUrl: BACKEND_URL });
});

app.get('*', (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) {
    return next();
  }

  const builtFile = path.join(FRONTEND_DIST, req.path === '/' ? 'index.html' : req.path);
  if (req.path === '/' || !req.path.includes('.')) {
    return res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  }
  if (req.path.startsWith('/assets/') || req.path.endsWith('.js') || req.path.endsWith('.css') || req.path.endsWith('.png') || req.path.endsWith('.jpg') || req.path.endsWith('.jpeg') || req.path.endsWith('.svg') || req.path.endsWith('.ico') || req.path.endsWith('.webmanifest') || req.path.endsWith('.map')) {
    return res.sendFile(builtFile);
  }
  return res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
});

app.use((req: Request, res: Response) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'API endpoint not found.' } });
  }
  return res.status(404).send('Not found');
});

app.listen(PORT, () => {
  console.log(`Unified app listening on http://localhost:${PORT}`);
  console.log(`Proxying API requests to ${BACKEND_URL}`);
});
