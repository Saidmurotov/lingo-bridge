// Demo data per docs/03-DATABASE.md §5. Run with `pnpm --filter api db:seed`.
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const demoPassword = await argon2.hash('demo1234');

  const client = await prisma.user.upsert({
    where: { email: 'demo@lingobridge.uz' },
    update: {},
    create: {
      email: 'demo@lingobridge.uz',
      passwordHash: demoPassword,
      fullName: 'Demo Mijoz',
      role: 'CLIENT',
    },
  });

  await prisma.user.upsert({
    where: { email: 'tarjimon@lingobridge.uz' },
    update: {},
    create: {
      email: 'tarjimon@lingobridge.uz',
      passwordHash: demoPassword,
      fullName: 'Demo Tarjimon',
      role: 'TRANSLATOR',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@lingobridge.uz' },
    update: {},
    create: {
      email: 'admin@lingobridge.uz',
      passwordHash: demoPassword,
      fullName: 'Demo Admin',
      role: 'ADMIN',
    },
  });

  const existingQuick = await prisma.quickTranslation.count({ where: { userId: client.id } });
  if (existingQuick === 0) {
    await prisma.quickTranslation.createMany({
      data: [
        {
          userId: client.id,
          fromLang: 'EN',
          toLang: 'UZ',
          sourceText: 'The hypothesis was rejected.',
          resultText: 'Gipoteza rad etildi.',
          academic: true,
        },
        {
          userId: client.id,
          fromLang: 'UZ',
          toLang: 'EN',
          sourceText: 'Ilmiy ish himoya qilindi.',
          resultText: 'The thesis was defended.',
          academic: false,
        },
      ],
    });
  }

  const existingMaterials = await prisma.material.count({ where: { userId: client.id } });
  if (existingMaterials === 0) {
    await prisma.material.create({
      data: {
        userId: client.id,
        subject: 'Ingliz tili',
        topic: 'Present Perfect',
        level: 'B1',
        type: 'EXERCISES',
        outputLang: 'UZ',
        notes: '10 ta gap, kalitlari bilan',
        content:
          '1. She ___ (finish) her homework. → has finished\n2. They ___ (visit) Samarkand twice. → have visited\n...',
      },
    });
  }

  console.log('Seed completed: demo client, translator, admin + sample data.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
