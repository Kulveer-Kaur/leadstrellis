import { prisma } from '../../src/lib/prisma.js';
import { seedAutomationRules } from './seeders/automation-rules.seeder.js';
import { seedLeads } from './seeders/leads.seeder.js';
import { seedProperties } from './seeders/properties.seeder.js';
import { seedUsers } from './seeders/users.seeder.js';

const TABLES = [
  'AiCallLog', 'ActivityLog', 'AutomationRun', 'AutomationRule', 'Task', 'Viewing', 'CallTranscriptTurn', 'Call',
  'Message', 'LeadPropertyMatch', 'LeadScore', 'LeadRequirement', 'Lead', 'Property', 'User',
];

export async function runSeed() {
  console.log('Resetting tables…');
  await prisma.$executeRawUnsafe(`TRUNCATE ${TABLES.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`);
  await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Lead_number_seq" RESTART WITH 1001`);

  const users = await seedUsers();
  console.log(`✔ ${users.length} users`);
  console.log(`✔ ${await seedAutomationRules()} automation rules`);
  console.log(`✔ ${await seedProperties()} properties`);
  const leads = await seedLeads();
  console.log(`✔ ${leads.total} leads (${leads.pending} left pending for live AI processing on server start)`);

  console.log('\nLogin: admin@leadstrellis.com / Admin@123  (agents: <name>@leadstrellis.com / Agent@123)');
  await prisma.$disconnect();
}
