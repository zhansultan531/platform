require('dotenv/config');
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');

const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: '*', credentials: true },
});

app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── APPS ──────────────────────────────────────────────
app.get('/api/apps', async (req, res) => {
  try {
    const apps = await prisma.app.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { deploys: true, pipelines: true } } },
    });
    res.json(apps);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/apps', async (req, res) => {
  try {
    const { name, description, repoUrl, branch, port } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const app2 = await prisma.app.create({
      data: { name, description, repoUrl, branch: branch || 'main', port: port ? Number(port) : null },
    });
    res.status(201).json(app2);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/apps/:id', async (req, res) => {
  try {
    const updated = await prisma.app.update({ where: { id: req.params.id }, data: req.body });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/apps/:id', async (req, res) => {
  try {
    await prisma.app.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/apps/:id/restart', async (req, res) => {
  try {
    const updated = await prisma.app.update({ where: { id: req.params.id }, data: { status: 'RUNNING' } });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/apps/:id/stop', async (req, res) => {
  try {
    const updated = await prisma.app.update({ where: { id: req.params.id }, data: { status: 'STOPPED' } });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── DEPLOYS ───────────────────────────────────────────
app.get('/api/deploys', async (req, res) => {
  try {
    const { appId } = req.query;
    const deploys = await prisma.deploy.findMany({
      where: appId ? { appId } : undefined,
      orderBy: { startedAt: 'desc' },
      take: 50,
      include: { app: { select: { name: true } } },
    });
    res.json(deploys);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/deploys', async (req, res) => {
  try {
    const { appId, version } = req.body;
    if (!appId || !version) return res.status(400).json({ error: 'appId and version required' });
    await prisma.app.update({ where: { id: appId }, data: { status: 'DEPLOYING' } });
    const deploy = await prisma.deploy.create({ data: { appId, version, status: 'RUNNING' } });
    setTimeout(async () => {
      await prisma.deploy.update({ where: { id: deploy.id }, data: { status: 'SUCCESS', finishedAt: new Date() } });
      await prisma.app.update({ where: { id: appId }, data: { status: 'RUNNING' } });
    }, 3000);
    res.status(201).json(deploy);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/deploys/:id/rollback', async (req, res) => {
  try {
    const deploy = await prisma.deploy.update({
      where: { id: req.params.id },
      data: { status: 'ROLLED_BACK', finishedAt: new Date() },
    });
    res.json(deploy);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PIPELINES ─────────────────────────────────────────
const defaultStages = [
  { name: 'checkout', status: 'pending', duration: null },
  { name: 'install',  status: 'pending', duration: null },
  { name: 'lint',     status: 'pending', duration: null },
  { name: 'test',     status: 'pending', duration: null },
  { name: 'build',    status: 'pending', duration: null },
  { name: 'deploy',   status: 'pending', duration: null },
];

app.get('/api/pipelines', async (req, res) => {
  try {
    const { appId } = req.query;
    const pipelines = await prisma.pipeline.findMany({
      where: appId ? { appId } : undefined,
      orderBy: { startedAt: 'desc' },
      take: 30,
      include: { app: { select: { name: true } } },
    });
    res.json(pipelines);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/pipelines', async (req, res) => {
  try {
    const { appId, branch } = req.body;
    if (!appId) return res.status(400).json({ error: 'appId required' });
    const pipeline = await prisma.pipeline.create({
      data: { appId, branch: branch || 'main', status: 'RUNNING', stages: JSON.parse(JSON.stringify(defaultStages)) },
    });
    let idx = 0;
    const interval = setInterval(async () => {
      if (idx >= defaultStages.length) {
        clearInterval(interval);
        await prisma.pipeline.update({ where: { id: pipeline.id }, data: { status: 'SUCCESS', finishedAt: new Date() } });
        return;
      }
      const stages = defaultStages.map((s, i) => ({
        ...s,
        status: i < idx ? 'success' : i === idx ? 'running' : 'pending',
        duration: i < idx ? Math.floor(Math.random() * 30) + 5 : null,
      }));
      await prisma.pipeline.update({ where: { id: pipeline.id }, data: { stages } });
      idx++;
    }, 2000);
    res.status(201).json(pipeline);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/pipelines/:id/cancel', async (req, res) => {
  try {
    const pipeline = await prisma.pipeline.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED', finishedAt: new Date() },
    });
    res.json(pipeline);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── METRICS ───────────────────────────────────────────
app.get('/api/metrics/current', (req, res) => {
  const points = (base, range) => Array.from({ length: 60 }, (_, i) => ({
    time: new Date(Date.now() - (59 - i) * 60000).toISOString(),
    value: Math.round(base + Math.random() * range),
  }));
  res.json({
    cpu: points(20, 40), memory: points(256, 200), latency: points(40, 120),
    summary: {
      cpu: Math.round(20 + Math.random() * 40),
      memory: Math.round(256 + Math.random() * 200),
      latency: Math.round(40 + Math.random() * 120),
      requestsPerMin: Math.floor(Math.random() * 500) + 100,
    },
  });
});

// ── LOGS ──────────────────────────────────────────────
app.get('/api/logs', (req, res) => {
  const { level, limit = '100' } = req.query;
  const levels = ['INFO', 'INFO', 'INFO', 'WARN', 'ERROR'];
  const services = ['api', 'worker', 'scheduler', 'auth'];
  const messages = [
    'Request processed successfully', 'Database query completed in 12ms',
    'Cache hit for key user:session', 'Health check passed',
    'Worker job started', 'JWT token validated', 'Rate limit check passed',
  ];
  const logs = Array.from({ length: Number(limit) }, (_, i) => ({
    id: `log-${Date.now()}-${i}`,
    timestamp: new Date(Date.now() - i * 1500).toISOString(),
    level: levels[Math.floor(Math.random() * levels.length)],
    service: services[Math.floor(Math.random() * services.length)],
    message: messages[Math.floor(Math.random() * messages.length)],
  }));
  const filtered = level ? logs.filter(l => l.level === level.toString().toUpperCase()) : logs;
  res.json(filtered);
});

// ── AUTH ──────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'All fields required' });
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hash, name } });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── WEBSOCKET ─────────────────────────────────────────
io.on('connection', (socket) => {
  let logInterval, metricsInterval;

  socket.on('subscribe:logs', () => {
    const levels = ['INFO', 'INFO', 'INFO', 'WARN', 'ERROR'];
    const services = ['api', 'worker', 'auth'];
    const messages = ['Request GET /api/apps 200', 'DB query ok', 'Cache hit', 'Health OK', 'Job processed'];
    logInterval = setInterval(() => {
      socket.emit('log:entry', {
        id: `${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: levels[Math.floor(Math.random() * levels.length)],
        service: services[Math.floor(Math.random() * services.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
      });
    }, 1500);
  });

  socket.on('subscribe:metrics', () => {
    metricsInterval = setInterval(() => {
      socket.emit('metrics:update', {
        cpu: Math.round(20 + Math.random() * 50),
        memory: Math.round(256 + Math.random() * 300),
        latency: Math.round(40 + Math.random() * 120),
        requestsPerMin: Math.floor(Math.random() * 600) + 50,
        timestamp: new Date().toISOString(),
      });
    }, 3000);
  });

  socket.on('disconnect', () => {
    clearInterval(logInterval);
    clearInterval(metricsInterval);
  });
});

// ── START ─────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
