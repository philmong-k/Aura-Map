
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  console.log("🧐 Production DB Probe Starting...");
  try {
    const all = await prisma.tacticalMap.findMany();
    console.log(`📊 Total Maps in DB: ${all.length}`);
    all.forEach(m => {
        console.log(` - [${m.title}] | User: ${m.userId} | Folder: ${m.folderName}`);
    });
  } catch (e) {
    console.error("❌ Probe Failed:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

run();
