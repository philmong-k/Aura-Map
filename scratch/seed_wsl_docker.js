
import { PrismaClient } from '@prisma/client';

const prismaDocker = new PrismaClient({
  datasources: {
    db: { url: 'mysql://root:kasfsk76dd**@localhost:3307/aura_db' }
  }
});

async function seedDocker() {
  console.log('🌱 Seeding WSL2 Docker (3307) with Golden Projects...');
  
  try {
    // I'll fetch them from Production one last time to be 100% sure I have the latest data
    // Actually, I'll just use the ones I already have if I can.
    // For now, I'll just confirm they are there.
  } catch (e) {
    console.error(e);
  } finally {
    await prismaDocker.$disconnect();
  }
}
