const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Querying triggers and functions...');
    
    // Find all triggers
    const triggers = await prisma.$queryRawUnsafe(`
      SELECT 
        trigger_name, 
        event_object_table, 
        action_statement, 
        action_timing
      FROM information_schema.triggers
      ORDER BY event_object_table;
    `);
    
    console.log('--- TRIGGERS ---');
    console.log(JSON.stringify(triggers, null, 2));

    // Find user-defined functions that might update order or order items
    const functions = await prisma.$queryRawUnsafe(`
      SELECT 
        proname, 
        prosrc
      FROM pg_proc 
      JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid 
      WHERE pg_namespace.nspname = 'public'
      AND (prosrc ILIKE '%status%' OR prosrc ILIKE '%complete%');
    `);

    console.log('--- FUNCTIONS ---');
    console.log(JSON.stringify(functions, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
