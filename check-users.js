/**
 * Quick script to check all users in the database
 * Run: node check-users.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('\n📊 Checking database users...\n');

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        vendor: {
          select: {
            businessName: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (users.length === 0) {
      console.log('❌ No users found in database\n');
      return;
    }

    console.log(`✅ Found ${users.length} user(s):\n`);
    console.log('─'.repeat(80));

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Name: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
      console.log(`   Avatar: ${user.avatar || 'N/A'}`);
      if (user.vendor) {
        console.log(`   Business: ${user.vendor.businessName}`);
        console.log(`   Status: ${user.vendor.status}`);
      }
      console.log(`   Created: ${user.createdAt.toLocaleString()}`);
      console.log('─'.repeat(80));
    });

    console.log(`\n📝 Total users: ${users.length}\n`);

    // Count by role
    const roleCounts = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Users by role:');
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`   ${role}: ${count}`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ Error checking users:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
