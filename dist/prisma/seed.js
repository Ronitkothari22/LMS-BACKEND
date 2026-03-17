"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    await prisma.user.deleteMany({});
    const adminPassword = await bcryptjs_1.default.hash('Admin123!', 10);
    const userPassword = await bcryptjs_1.default.hash('User123!', 10);
    await prisma.user.create({
        data: {
            email: 'admin@example.com',
            name: 'Admin User',
            password: adminPassword,
            role: client_1.Role.ADMIN,
            emailVerified: true,
            profilePhoto: 'https://randomuser.me/api/portraits/men/1.jpg',
            companyPosition: 'System Administrator',
            department: 'IT',
            isActive: true
        },
    });
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
                role: client_1.Role.USER,
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
//# sourceMappingURL=seed.js.map