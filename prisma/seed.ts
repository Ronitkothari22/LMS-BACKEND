import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.user.deleteMany({});

  // Create a test admin user
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const userPassword = await bcrypt.hash('User123!', 10);

  // Create admin user
  await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: Role.ADMIN,
      emailVerified: true,
      profilePhoto: 'https://randomuser.me/api/portraits/men/1.jpg',
      companyPosition: 'System Administrator',
      department: 'IT',
      isActive: true
    },
  });

  // Create regular users
  const users = [
    {
      email: 'user1@gmail.com',
      name: 'John Doe',
      password: userPassword,
      profilePhoto: 'https://randomuser.me/api/portraits/men/2.jpg',
      companyPosition: 'Marketing Specialist',
      department: 'Marketing',
    },
    {
      email: 'user2@gmail.com',
      name: 'Jane Smith',
      password: userPassword,
      profilePhoto: 'https://randomuser.me/api/portraits/women/3.jpg',
      companyPosition: 'Sales Manager',
      department: 'Sales',
    },
    {
      email: 'user3@example.com',
      name: 'Alex Johnson',
      password: userPassword,
      profilePhoto: 'https://randomuser.me/api/portraits/men/4.jpg',
      companyPosition: 'Product Manager',
      department: 'Product',
    }
  ];

  for (const user of users) {
    await prisma.user.create({
      data: {
        ...user,
        role: Role.USER,
        emailVerified: true,
        isActive: true
      },
    });
  }

  console.log('Database has been seeded with admin and user accounts.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
