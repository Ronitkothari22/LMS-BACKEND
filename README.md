<<<<<<< HEAD
# LMS-BACKEND
=======
# Joining Dots Backend

A production-grade Node.js backend with Express, Prisma, and TypeScript for interactive training sessions, quizzes, polls, and team management.

## 🚀 Features

- **Session Management**: Create and manage training sessions with QR codes
- **Interactive Quizzes**: Real-time quizzes with scoring and analytics
- **Live Polling**: Interactive polls with multiple question types
- **Team Management**: Organize users into teams with point systems
- **Content Management**: Upload and manage session content
- **Real-time Communication**: Socket.io for live interactions
- **Database Export**: Comprehensive data export functionality
- **User Authentication**: JWT-based authentication with role-based access

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Database Proxy**: Prisma Accelerate (Cloud)
- **Real-time**: Socket.io
- **Authentication**: JWT tokens
- **File Upload**: Cloudinary integration
- **Email**: Nodemailer
- **Package Manager**: pnpm

## 📦 Quick Start

### Prerequisites
- Node.js (>= 14.0.0)
- pnpm
- PostgreSQL database (or Prisma Accelerate)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd joining_dots_backend

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database and API keys

# Generate Prisma client
pnpm run prisma:generate

# Run database migrations
pnpm run prisma:migrate

# Seed the database (optional)
pnpm run seed

# Start development server
pnpm run dev
```

## 🔧 Available Scripts

### Development
```bash
pnpm run dev          # Start development server with hot reload
pnpm run build        # Build for production
pnpm run start        # Start production server
pnpm run lint         # Run ESLint
pnpm run lint:fix     # Fix ESLint issues
pnpm run format       # Format code with Prettier
```

### Database
```bash
pnpm run prisma:generate    # Generate Prisma client
pnpm run prisma:migrate     # Run database migrations
pnpm run prisma:studio      # Open Prisma Studio
pnpm run seed              # Seed database with sample data
```

### Database Export 📊
```bash
# Export all data (recommended)
pnpm run export:db

# Export specific formats
pnpm run export:db:json    # JSON format
pnpm run export:db:csv     # CSV format
pnpm run export:db:info    # Database statistics

# Legacy export (for direct database connections)
pnpm run export:db:legacy
```

## 📊 Database Export System

This project includes a comprehensive database export system optimized for **Prisma Accelerate**:

### Quick Export
```bash
# Export everything (JSON + CSV + Statistics)
pnpm run export:db
```

### Export Formats
- **JSON**: Single file with all table data (`~644KB`)
- **CSV**: Separate files per table (Excel-friendly)  
- **Statistics**: Database metadata and record counts

### Output Location
All exports are saved to `./exports/` with timestamps:
```
exports/
├── prisma-accelerate-export-2025-06-24T04-06-57-460Z.json
├── database-info-2025-06-24T04-06-37-349Z.json
└── csv-export-2025-06-24T04-06-57-468Z/
    ├── user.csv (22 records)
    ├── session.csv (16 records)
    ├── quiz.csv (19 records)
    └── ... (15 total tables)
```

### Documentation
- 📖 [Prisma Accelerate Export Guide](./PRISMA_ACCELERATE_EXPORT_GUIDE.md)
- 📖 [General Database Export Guide](./DATABASE_EXPORT_GUIDE.md)

## 🏗️ Project Structure

```
src/
├── app.ts                 # Express app configuration
├── server.ts             # Server entry point
├── config/               # Configuration files
│   ├── env.config.ts     # Environment variables
│   ├── jwt.config.ts     # JWT configuration
│   └── cloudinary.config.ts
├── controllers/          # Route controllers
│   ├── auth.controller.ts
│   ├── session.controller.ts
│   ├── quiz.controller.ts
│   └── ...
├── middleware/           # Custom middleware
│   ├── auth.middleware.ts
│   ├── validate.middleware.ts
│   └── ...
├── routes/              # API routes
│   ├── index.ts
│   ├── auth.routes.ts
│   └── ...
├── services/            # Business logic services
├── utils/               # Utility functions
├── validations/         # Zod validation schemas
└── types/               # TypeScript type definitions

scripts/
├── export-prisma-accelerate.ts  # Main export script
├── export-database.ts           # Legacy export script
└── export-db.sh                # Shell export script

prisma/
├── schema.prisma        # Database schema
└── seed.ts             # Database seeding
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Sessions
- `GET /api/sessions` - List sessions
- `POST /api/sessions` - Create session
- `GET /api/sessions/:id` - Get session details
- `PUT /api/sessions/:id` - Update session

### Quizzes
- `GET /api/quizzes` - List quizzes
- `POST /api/quizzes` - Create quiz
- `POST /api/quizzes/:id/submit` - Submit quiz response

### Polls
- `GET /api/polls` - List polls
- `POST /api/polls` - Create poll
- `POST /api/polls/:id/vote` - Submit poll vote

### Teams
- `GET /api/teams` - List teams
- `POST /api/teams` - Create team
- `POST /api/teams/:id/members` - Add team member

## 🔒 Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="your-database-url"

# JWT
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="24h"

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Email (optional)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# Server
PORT=3000
NODE_ENV="development"
```

## 🗄️ Database Schema

The application uses PostgreSQL with the following main entities:

- **Users**: User accounts with roles and profiles
- **Sessions**: Training sessions with participants
- **Quizzes/Questions**: Interactive quizzes with questions
- **Polls**: Live polling with multiple question types
- **Teams**: Team management with members and points
- **Content**: Session materials and uploads
- **Activity Logs**: User activity tracking

## 📈 Data Statistics

Current database contains:
- **2,157 total records** across 15 active tables
- **22 users** with various roles
- **16 sessions** with interactive content
- **19 quizzes** with 48 questions
- **35 polls** with real-time responses
- **20 teams** with 32 members

## 🔧 Development

### Code Quality
- ESLint for code linting
- Prettier for code formatting
- Husky for pre-commit hooks
- TypeScript for type safety

### Testing
```bash
# Run tests (when available)
pnpm test
pnpm test:watch
pnpm test:coverage
```

## 🚀 Deployment

### Build
```bash
pnpm run build
```

### Production
```bash
pnpm start
```

### Environment Setup
1. Set production environment variables
2. Run database migrations
3. Generate Prisma client
4. Start the server

## 📚 Documentation

- [Database Export Guide](./PRISMA_ACCELERATE_EXPORT_GUIDE.md) - Comprehensive export documentation
- [API Documentation](./api-docs-session-quiz.md) - API endpoint details
- [Team Management](./team-management-api.md) - Team API documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and formatting
5. Submit a pull request

## 📄 License

[Add your license here]

## 🆘 Support

For issues and questions:
1. Check the documentation files
2. Review the API documentation
3. Run `pnpm run export:db:info` for database insights
4. Check the logs for error details

---

**Built with ❤️ using Node.js, TypeScript, Prisma, and Express**
>>>>>>> ecc5bb1 (Initial commit - backend)
