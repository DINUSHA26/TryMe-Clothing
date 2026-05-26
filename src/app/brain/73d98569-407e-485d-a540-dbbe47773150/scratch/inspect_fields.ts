import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // @ts-ignore - inspecting internal metadata
    const orderItemModel = (prisma as any)._runtimeDataModel.models.OrderItem;
    console.log('OrderItem fields:', orderItemModel.fields.map((f: any) => f.name).join(', '));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
