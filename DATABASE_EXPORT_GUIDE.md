# Database Export Guide (Direct Database Connections)

> **⚠️ IMPORTANT**: This guide is for **direct PostgreSQL database connections** only.
> 
> **🌐 Using Prisma Accelerate?** → Use the [**Prisma Accelerate Export Guide**](./PRISMA_ACCELERATE_EXPORT_GUIDE.md) instead!

This guide provides comprehensive methods to export your PostgreSQL database data when you have **direct database access** (not using Prisma Accelerate).

## 🔍 **Which Guide Should I Use?**

| Database Setup | Recommended Guide |
|----------------|-------------------|
| **Prisma Accelerate** (Cloud Proxy)<br/>DATABASE_URL contains `accelerate.prisma-data.net` | 👉 [**Prisma Accelerate Export Guide**](./PRISMA_ACCELERATE_EXPORT_GUIDE.md) |
| **Direct PostgreSQL Connection**<br/>DATABASE_URL like `postgresql://user:pass@host:port/db` | 👉 **This guide** (you're in the right place) |

## 🚀 Quick Start (Direct Database Only)

### Prerequisites
- Direct PostgreSQL database access (not Prisma Accelerate)
- PostgreSQL client tools installed (`pg_dump`, `psql`)
- `.env` file configured with direct `DATABASE_URL`
- Database server accessible from your machine

### Available Export Methods

## 📋 Method 1: PNPM Scripts (For Direct Database Connections)

> **Note**: For Prisma Accelerate users, use `pnpm run export:db` instead (see the Prisma Accelerate guide).

Use the legacy export scripts for direct database connections:

```bash
# Legacy export script (for direct database connections)
pnpm run export:db:legacy

# Shell script with pg_dump (requires direct database access)
./scripts/export-db.sh [format] [output_dir]
```

**⚠️ These commands will NOT work with Prisma Accelerate:**
- `./scripts/export-db.sh` - Requires direct database access
- Any commands using `pg_dump` directly

## 📋 Method 2: Direct Script Execution

### TypeScript Export Script
```bash
# Run the TypeScript export script directly
npx ts-node scripts/export-database.ts [format] [output_dir]

# Examples:
npx ts-node scripts/export-database.ts json ./my-exports
npx ts-node scripts/export-database.ts csv
npx ts-node scripts/export-database.ts all ./backups
```

### Shell Script (Advanced PostgreSQL Options)
```bash
# Run the shell script directly
./scripts/export-db.sh [format] [output_dir]

# Examples:
./scripts/export-db.sh full ./backups
./scripts/export-db.sh compressed
./scripts/export-db.sh schema ./schema-backup
```

## 📋 Method 3: Direct pg_dump Commands

For advanced users who want full control:

```bash
# Load environment variables
source .env

# Full database dump
pg_dump $DATABASE_URL --clean --create --if-exists -f full-dump.sql

# Schema only
pg_dump $DATABASE_URL --schema-only --clean --create -f schema-only.sql

# Data only
pg_dump $DATABASE_URL --data-only --disable-triggers -f data-only.sql

# Compressed custom format
pg_dump $DATABASE_URL --format=custom --compress=9 -f database.backup
```

## 📊 Export Formats

### 1. JSON Export
- **Method**: Uses Prisma client for type-safe exports
- **Output**: Single JSON file with all tables
- **Best for**: Application data migration, API seeding
- **File**: `database-export-YYYY-MM-DD-HH-mm-ss.json`

### 2. CSV Export  
- **Method**: Uses Prisma client to generate CSV files
- **Output**: Separate CSV file per table
- **Best for**: Excel analysis, data processing
- **Files**: `csv-export-YYYY-MM-DD-HH-mm-ss/table_name.csv`

### 3. SQL Dump (Full)
- **Method**: Uses pg_dump for complete database export
- **Output**: SQL file with schema + data
- **Best for**: Database migration, full backup
- **File**: `database-dump-YYYY-MM-DD-HH-mm-ss.sql`

### 4. Schema Only
- **Method**: Uses pg_dump for structure only
- **Output**: SQL file with table definitions
- **Best for**: Setting up new environments
- **File**: `schema-only-YYYY-MM-DD-HH-mm-ss.sql`

### 5. Compressed Backup
- **Method**: Uses pg_dump with custom format
- **Output**: Binary compressed file
- **Best for**: Large databases, efficient storage
- **File**: `compressed-dump-YYYY-MM-DD-HH-mm-ss.backup`

## 🗂️ Output Structure

```
exports/
├── database-export-2024-01-15-14-30-25.json
├── csv-export-2024-01-15-14-30-25/
│   ├── user.csv
│   ├── session.csv
│   ├── quiz.csv
│   └── ...
├── database-dump-2024-01-15-14-30-25.sql
├── schema-only-2024-01-15-14-30-25.sql
└── compressed-dump-2024-01-15-14-30-25.backup
```

## 🔧 Configuration

### Environment Variables
Ensure your `.env` file contains:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
```

### Custom Export Directory
All methods support custom output directories:
```bash
npm run export:db json ./my-custom-exports
./scripts/export-db.sh full ./backups/$(date +%Y-%m-%d)
```

## 📚 Exported Tables

The scripts will export the following tables:
- `User` - User accounts and profiles
- `Session` - Training sessions
- `Quiz` & `Question` - Quiz data and questions  
- `QuizResponse` - Quiz answers and scores
- `Poll` & `PollQuestion` - Polling data
- `PollResponse` - Poll responses
- `Content` - Session content
- `ActivityLog` - User activity tracking
- `Team` & `TeamMember` - Team management
- `TeamPointAward` - Team point awards
- `IndividualPointAward` - Individual achievements

## 🔒 Security Considerations

1. **Sensitive Data**: Exported files contain sensitive information including passwords and personal data
2. **Storage**: Store exports in secure locations with appropriate access controls
3. **Cleanup**: Consider automatic cleanup of old export files
4. **Encryption**: For production exports, consider encrypting sensitive data

## 🚨 Troubleshooting

### Common Issues:

**1. "pg_dump: error: could not translate host name" or "Name or service not known"**
```bash
# This usually means you're using Prisma Accelerate
# Switch to the Prisma Accelerate Export Guide instead!
```
👉 **Solution**: Use the [Prisma Accelerate Export Guide](./PRISMA_ACCELERATE_EXPORT_GUIDE.md)

**2. "DATABASE_URL not found"**
```bash
# Check if .env file exists and contains DATABASE_URL
cat .env | grep DATABASE_URL
```

**3. "pg_dump: command not found"**
```bash
# Install PostgreSQL client tools
sudo dnf install postgresql-server postgresql  # Fedora
sudo apt install postgresql-client             # Ubuntu
brew install postgresql                        # macOS
```

**4. "Permission denied: ./scripts/export-db.sh"**
```bash
# Make script executable
chmod +x scripts/export-db.sh
```

**5. "Connection refused"**
```bash
# Verify direct database connection (not Prisma Accelerate)
psql $DATABASE_URL -c "SELECT 1;"
```

**6. Using Prisma Accelerate by mistake?**
If your `DATABASE_URL` contains `accelerate.prisma-data.net`, you're using Prisma Accelerate.
👉 **Switch to**: [Prisma Accelerate Export Guide](./PRISMA_ACCELERATE_EXPORT_GUIDE.md)

## 💡 Tips & Best Practices

1. **Regular Exports**: Set up cron jobs for automated backups
2. **Version Control**: Don't commit exported data to git
3. **Naming**: Exports include timestamps for easy identification
4. **Testing**: Test restore procedures regularly
5. **Monitoring**: Check export file sizes for anomalies

## 🔄 Restoring Data

### From SQL Dump:
```bash
# Full restore
psql $DATABASE_URL < full-dump.sql

# Schema only
psql $DATABASE_URL < schema-only.sql
```

### From Compressed Backup:
```bash
pg_restore -d $DATABASE_URL compressed-dump.backup
```

### From JSON/CSV:
Use custom import scripts or Prisma seed functions.

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your database connection
3. Ensure all prerequisites are met
4. Check file permissions and disk space

## 🎯 **Summary: Which Export Method to Use**

| Your Database Setup | Use This |
|---------------------|----------|
| **Prisma Accelerate** | → [Prisma Accelerate Export Guide](./PRISMA_ACCELERATE_EXPORT_GUIDE.md)<br/>Commands: `pnpm run export:db` |
| **Direct PostgreSQL** | → This guide<br/>Commands: `pnpm run export:db:legacy`, `./scripts/export-db.sh` |
| **Not sure?** | Check your `DATABASE_URL`:<br/>- Contains `accelerate.prisma-data.net`? → Prisma Accelerate<br/>- Contains `postgresql://host:port`? → Direct connection |

---

**Happy Exporting! 🎉**

> **Need the working export solution?** Most users should use the [**Prisma Accelerate Export Guide**](./PRISMA_ACCELERATE_EXPORT_GUIDE.md) for the best experience. 