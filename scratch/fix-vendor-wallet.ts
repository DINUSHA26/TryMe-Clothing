import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const email = 'kaludinu22@gmail.com';
    console.log(`Locating user: ${email}...`);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        vendor: {
          include: {
            wallet: true
          }
        }
      }
    });

    if (!user || !user.vendor || !user.vendor.wallet) {
      console.error('Vendor or wallet not found!');
      return;
    }

    const wallet = user.vendor.wallet;
    console.log('--- WALLET BEFORE ---');
    console.log('Available Balance:', wallet.availableBalance.toString());
    console.log('Total Earnings:', wallet.totalEarnings.toString());

    // We align totalEarnings to availableBalance (16740.00)
    const targetEarnings = wallet.availableBalance;
    console.log(`Updating totalEarnings to: ${targetEarnings.toString()}...`);

    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        totalEarnings: targetEarnings
      }
    });

    console.log('--- WALLET AFTER ---');
    console.log('Available Balance:', updatedWallet.availableBalance.toString());
    console.log('Total Earnings:', updatedWallet.totalEarnings.toString());
    console.log('✅ Vendor wallet aligned successfully!');

  } catch (error) {
    console.error('Error during database update:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
