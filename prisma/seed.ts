import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.session.upsert({
    where: { sessionId: "demo-session" },
    update: { mode: "research-demo" },
    create: { sessionId: "demo-session", mode: "research-demo" },
  });

  const alerts = [
    {
      title: "Cognitive Stability Dropping",
      description: "Simulated stability trend fell below its 15-minute moving estimate.",
      type: "warning",
    },
    {
      title: "Performance Prediction",
      description: "Projected decline window detected from synthetic workload indicators.",
      type: "info",
    },
  ];

  for (const alert of alerts) {
    const existing = await prisma.alert.findFirst({ where: { title: alert.title } });
    if (!existing) {
      await prisma.alert.create({ data: alert });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
