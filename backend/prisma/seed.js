const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding...');

  const existing = await prisma.user.findUnique({ where: { email: 'admin@deployhub.com' } });
  if (existing) { console.log('Already seeded'); return; }

  const hash = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: { email: 'admin@deployhub.com', password: hash, name: 'Admin', role: 'ADMIN' },
  });

  const app1 = await prisma.app.create({
    data: { name: 'frontend-app', description: 'React SPA', branch: 'main', status: 'RUNNING', port: 3000 },
  });
  const app2 = await prisma.app.create({
    data: { name: 'api-service', description: 'Node.js REST API', branch: 'main', status: 'RUNNING', port: 4000 },
  });
  const app3 = await prisma.app.create({
    data: { name: 'worker', description: 'Background jobs', branch: 'develop', status: 'STOPPED' },
  });

  for (const app of [app1, app2, app3]) {
    await prisma.deploy.create({
      data: {
        appId: app.id, version: 'v1.0.0', status: 'SUCCESS',
        startedAt: new Date(Date.now() - 86400000),
        finishedAt: new Date(Date.now() - 86390000),
      },
    });
    await prisma.pipeline.create({
      data: {
        appId: app.id, branch: app.branch, status: 'SUCCESS',
        stages: [
          { name: 'checkout', status: 'success', duration: 3 },
          { name: 'install', status: 'success', duration: 12 },
          { name: 'lint', status: 'success', duration: 8 },
          { name: 'test', status: 'success', duration: 24 },
          { name: 'build', status: 'success', duration: 18 },
          { name: 'deploy', status: 'success', duration: 6 },
        ],
        startedAt: new Date(Date.now() - 3600000),
        finishedAt: new Date(Date.now() - 3529000),
      },
    });
  }

  console.log('Seed complete! Login: admin@deployhub.com / admin123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
