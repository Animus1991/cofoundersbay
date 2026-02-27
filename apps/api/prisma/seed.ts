import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SKILLS = [
  { name: 'Product Management', slug: 'product-management', category: 'business' },
  { name: 'Software Engineering', slug: 'software-engineering', category: 'technical' },
  { name: 'Design (UI/UX)', slug: 'design-ui-ux', category: 'design' },
  { name: 'Marketing', slug: 'marketing', category: 'business' },
  { name: 'Sales', slug: 'sales', category: 'business' },
  { name: 'Finance', slug: 'finance', category: 'business' },
  { name: 'Legal', slug: 'legal', category: 'business' },
  { name: 'Data Science', slug: 'data-science', category: 'technical' },
  { name: 'DevOps', slug: 'devops', category: 'technical' },
  { name: 'Mobile Development', slug: 'mobile-development', category: 'technical' },
  { name: 'Frontend Development', slug: 'frontend-development', category: 'technical' },
  { name: 'Backend Development', slug: 'backend-development', category: 'technical' },
  { name: 'Fundraising', slug: 'fundraising', category: 'business' },
  { name: 'Strategy', slug: 'strategy', category: 'business' },
  { name: 'Operations', slug: 'operations', category: 'business' },
];

async function main() {
  for (const s of SKILLS) {
    await prisma.skill.upsert({
      where: { slug: s.slug },
      create: s,
      update: { name: s.name, category: s.category },
    });
  }
  console.log(`Seeded ${SKILLS.length} skills`);

  const firstUser = await prisma.user.findFirst();
  if (firstUser) {
    const existingPoll = await prisma.poll.findFirst();
    if (!existingPoll) {
      const poll = await prisma.poll.create({
        data: {
          creatorId: firstUser.id,
          question: 'What topic should we cover in the next community call?',
          isActive: true,
          options: {
            create: [
              { label: 'Fundraising & term sheets', sortOrder: 0 },
              { label: 'Product-market fit', sortOrder: 1 },
              { label: 'Hiring first team', sortOrder: 2 },
            ],
          },
        },
      });
      console.log(`Seeded sample poll: ${poll.id}`);
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
