"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseExporter = void 0;
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma = new client_1.PrismaClient();
class DatabaseExporter {
    constructor(outputDir = './exports') {
        this.outputDir = outputDir;
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }
    async exportToJSON(tables) {
        console.log('🚀 Starting JSON export...');
        const allData = {};
        const tablesToExport = tables || [
            'User',
            'Session',
            'Quiz',
            'Question',
            'QuizResponse',
            'Poll',
            'PollQuestion',
            'PollQuestionOption',
            'PollResponse',
            'PollOption',
            'Content',
            'ActivityLog',
            'Team',
            'TeamMember',
            'TeamPointAward',
            'IndividualPointAward',
        ];
        for (const table of tablesToExport) {
            try {
                console.log(`📊 Exporting ${table}...`);
                const model = prisma[table.toLowerCase()];
                if (model && typeof model.findMany === 'function') {
                    const data = await model.findMany();
                    allData[table] = data;
                    console.log(`✅ ${table}: ${data.length} records`);
                }
                else {
                    console.log(`⚠️  ${table}: Model not found or not accessible`);
                }
            }
            catch (error) {
                console.error(`❌ Error exporting ${table}:`, error);
            }
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `database-export-${timestamp}.json`;
        const filePath = path.join(this.outputDir, filename);
        fs.writeFileSync(filePath, JSON.stringify(allData, null, 2));
        console.log(`📁 JSON export completed: ${filePath}`);
    }
    async exportToCSV(tables) {
        console.log('🚀 Starting CSV export...');
        const tablesToExport = tables || [
            'User',
            'Session',
            'Quiz',
            'Question',
            'QuizResponse',
            'Poll',
            'PollQuestion',
            'PollQuestionOption',
            'PollResponse',
            'PollOption',
            'Content',
            'ActivityLog',
            'Team',
            'TeamMember',
            'TeamPointAward',
            'IndividualPointAward',
        ];
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const csvDir = path.join(this.outputDir, `csv-export-${timestamp}`);
        if (!fs.existsSync(csvDir)) {
            fs.mkdirSync(csvDir, { recursive: true });
        }
        for (const table of tablesToExport) {
            try {
                console.log(`📊 Exporting ${table} to CSV...`);
                const model = prisma[table.toLowerCase()];
                if (model && typeof model.findMany === 'function') {
                    const data = await model.findMany();
                    if (data.length > 0) {
                        const csvContent = this.convertToCSV(data);
                        const csvFilePath = path.join(csvDir, `${table.toLowerCase()}.csv`);
                        fs.writeFileSync(csvFilePath, csvContent);
                        console.log(`✅ ${table}: ${data.length} records exported to ${csvFilePath}`);
                    }
                    else {
                        console.log(`⚠️  ${table}: No records found`);
                    }
                }
                else {
                    console.log(`⚠️  ${table}: Model not found or not accessible`);
                }
            }
            catch (error) {
                console.error(`❌ Error exporting ${table} to CSV:`, error);
            }
        }
        console.log(`📁 CSV export completed in directory: ${csvDir}`);
    }
    async exportPrismaSchema() {
        console.log('🚀 Starting Prisma schema export...');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `prisma-schema-${timestamp}.prisma`;
        const filePath = path.join(this.outputDir, filename);
        try {
            const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
            if (fs.existsSync(schemaPath)) {
                const schemaContent = fs.readFileSync(schemaPath, 'utf8');
                fs.writeFileSync(filePath, schemaContent);
                console.log(`✅ Prisma schema exported: ${filePath}`);
            }
            else {
                console.log('⚠️  Prisma schema file not found');
            }
        }
        catch (error) {
            console.error('❌ Error exporting Prisma schema:', error);
            throw error;
        }
    }
    async exportDatabaseStats() {
        var _a;
        console.log('🚀 Starting database statistics export...');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `database-stats-${timestamp}.json`;
        const filePath = path.join(this.outputDir, filename);
        try {
            const stats = {
                exportDate: new Date().toISOString(),
                databaseUrl: ((_a = process.env.DATABASE_URL) === null || _a === void 0 ? void 0 : _a.includes('accelerate'))
                    ? 'Prisma Accelerate'
                    : 'Direct Connection',
                tables: {},
            };
            const tablesToExport = [
                'User',
                'Session',
                'Quiz',
                'Question',
                'QuizResponse',
                'Poll',
                'PollQuestion',
                'PollQuestionOption',
                'PollResponse',
                'PollOption',
                'Content',
                'ActivityLog',
                'Team',
                'TeamMember',
                'TeamPointAward',
                'IndividualPointAward',
            ];
            for (const table of tablesToExport) {
                try {
                    const model = prisma[table.toLowerCase()];
                    if (model && typeof model.count === 'function') {
                        const count = await model.count();
                        stats.tables[table] = { recordCount: count };
                        console.log(`📊 ${table}: ${count} records`);
                    }
                }
                catch (error) {
                    console.log(`⚠️  ${table}: Unable to count records`);
                    stats.tables[table] = { recordCount: 'N/A', error: 'Access denied or table not found' };
                }
            }
            fs.writeFileSync(filePath, JSON.stringify(stats, null, 2));
            console.log(`✅ Database statistics exported: ${filePath}`);
        }
        catch (error) {
            console.error('❌ Error exporting database statistics:', error);
            throw error;
        }
    }
    convertToCSV(data) {
        if (data.length === 0)
            return '';
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header];
                if (value === null || value === undefined)
                    return '';
                if (typeof value === 'object')
                    return JSON.stringify(value);
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            csvRows.push(values.join(','));
        }
        return csvRows.join('\n');
    }
    async exportAll() {
        console.log('🚀 Starting complete database export...');
        try {
            await this.exportToJSON();
            await this.exportToCSV();
            await this.exportPrismaSchema();
            await this.exportDatabaseStats();
            console.log('🎉 All exports completed successfully!');
        }
        catch (error) {
            console.error('❌ Export failed:', error);
            throw error;
        }
        finally {
            await prisma.$disconnect();
        }
    }
}
exports.DatabaseExporter = DatabaseExporter;
async function main() {
    const args = process.argv.slice(2);
    const format = args[0] || 'all';
    const outputDir = args[1] || './exports';
    const exporter = new DatabaseExporter(outputDir);
    try {
        switch (format.toLowerCase()) {
            case 'json':
                await exporter.exportToJSON();
                break;
            case 'csv':
                await exporter.exportToCSV();
                break;
            case 'schema':
                await exporter.exportPrismaSchema();
                break;
            case 'stats':
                await exporter.exportDatabaseStats();
                break;
            case 'all':
            default:
                await exporter.exportAll();
                break;
        }
    }
    catch (error) {
        console.error('❌ Export failed:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    main();
}
//# sourceMappingURL=export-database.js.map