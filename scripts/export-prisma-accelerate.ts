import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

class PrismaAccelerateExporter {
  private outputDir: string;

  constructor(outputDir: string = './exports') {
    this.outputDir = outputDir;
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async exportToJSON(): Promise<void> {
    console.log('🚀 Starting JSON export via Prisma Accelerate...');

    const allData: any = {};

    // Export each model individually to avoid TypeScript union type issues
    const models = [
      { name: 'User', getData: () => prisma.user.findMany() },
      { name: 'Session', getData: () => prisma.session.findMany() },
      { name: 'Quiz', getData: () => prisma.quiz.findMany() },
      { name: 'Question', getData: () => prisma.question.findMany() },
      { name: 'QuizResponse', getData: () => prisma.quizResponse.findMany() },
      { name: 'Poll', getData: () => prisma.poll.findMany() },
      { name: 'PollQuestion', getData: () => prisma.pollQuestion.findMany() },
      { name: 'PollQuestionOption', getData: () => prisma.pollQuestionOption.findMany() },
      { name: 'PollResponse', getData: () => prisma.pollResponse.findMany() },
      { name: 'PollOption', getData: () => prisma.pollOption.findMany() },
      { name: 'Content', getData: () => prisma.content.findMany() },
      { name: 'ActivityLog', getData: () => prisma.activityLog.findMany() },
      { name: 'Team', getData: () => prisma.team.findMany() },
      { name: 'TeamMember', getData: () => prisma.teamMember.findMany() },
      { name: 'TeamPointAward', getData: () => prisma.teamPointAward.findMany() },
      { name: 'IndividualPointAward', getData: () => prisma.individualPointAward.findMany() },
    ];

    for (const { name, getData } of models) {
      try {
        console.log(`📊 Exporting ${name}...`);
        const data = await getData();
        allData[name] = data;
        console.log(`✅ ${name}: ${data.length} records`);
      } catch (error) {
        console.error(`❌ Error exporting ${name}:`, error);
        allData[name] = { error: 'Export failed', message: (error as Error).message };
      }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `prisma-accelerate-export-${timestamp}.json`;
    const filePath = path.join(this.outputDir, filename);

    fs.writeFileSync(filePath, JSON.stringify(allData, null, 2));
    console.log(`📁 JSON export completed: ${filePath}`);
  }

  async exportToCSV(): Promise<void> {
    console.log('🚀 Starting CSV export via Prisma Accelerate...');

    const models = [
      { name: 'User', getData: () => prisma.user.findMany() },
      { name: 'Session', getData: () => prisma.session.findMany() },
      { name: 'Quiz', getData: () => prisma.quiz.findMany() },
      { name: 'Question', getData: () => prisma.question.findMany() },
      { name: 'QuizResponse', getData: () => prisma.quizResponse.findMany() },
      { name: 'Poll', getData: () => prisma.poll.findMany() },
      { name: 'PollQuestion', getData: () => prisma.pollQuestion.findMany() },
      { name: 'PollQuestionOption', getData: () => prisma.pollQuestionOption.findMany() },
      { name: 'PollResponse', getData: () => prisma.pollResponse.findMany() },
      { name: 'PollOption', getData: () => prisma.pollOption.findMany() },
      { name: 'Content', getData: () => prisma.content.findMany() },
      { name: 'ActivityLog', getData: () => prisma.activityLog.findMany() },
      { name: 'Team', getData: () => prisma.team.findMany() },
      { name: 'TeamMember', getData: () => prisma.teamMember.findMany() },
      { name: 'TeamPointAward', getData: () => prisma.teamPointAward.findMany() },
      { name: 'IndividualPointAward', getData: () => prisma.individualPointAward.findMany() },
    ];

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const csvDir = path.join(this.outputDir, `csv-export-${timestamp}`);

    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true });
    }

    for (const { name, getData } of models) {
      try {
        console.log(`📊 Exporting ${name} to CSV...`);
        const data = await getData();

        if (data.length > 0) {
          const csvContent = this.convertToCSV(data);
          const csvFilePath = path.join(csvDir, `${name.toLowerCase()}.csv`);
          fs.writeFileSync(csvFilePath, csvContent);
          console.log(`✅ ${name}: ${data.length} records exported to ${csvFilePath}`);
        } else {
          console.log(`⚠️  ${name}: No records found`);
        }
      } catch (error) {
        console.error(`❌ Error exporting ${name} to CSV:`, error);
      }
    }

    console.log(`📁 CSV export completed in directory: ${csvDir}`);
  }

  async exportDatabaseInfo(): Promise<void> {
    console.log('🚀 Starting database info export...');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `database-info-${timestamp}.json`;
    const filePath = path.join(this.outputDir, filename);

    try {
      const info: any = {
        exportDate: new Date().toISOString(),
        databaseType: 'Prisma Accelerate',
        databaseUrl: process.env.DATABASE_URL?.replace(/api_key=[^&]+/, 'api_key=***'),
        tables: {},
      };

      const models = [
        { name: 'User', getCount: () => prisma.user.count() },
        { name: 'Session', getCount: () => prisma.session.count() },
        { name: 'Quiz', getCount: () => prisma.quiz.count() },
        { name: 'Question', getCount: () => prisma.question.count() },
        { name: 'QuizResponse', getCount: () => prisma.quizResponse.count() },
        { name: 'Poll', getCount: () => prisma.poll.count() },
        { name: 'PollQuestion', getCount: () => prisma.pollQuestion.count() },
        { name: 'PollQuestionOption', getCount: () => prisma.pollQuestionOption.count() },
        { name: 'PollResponse', getCount: () => prisma.pollResponse.count() },
        { name: 'PollOption', getCount: () => prisma.pollOption.count() },
        { name: 'Content', getCount: () => prisma.content.count() },
        { name: 'ActivityLog', getCount: () => prisma.activityLog.count() },
        { name: 'Team', getCount: () => prisma.team.count() },
        { name: 'TeamMember', getCount: () => prisma.teamMember.count() },
        { name: 'TeamPointAward', getCount: () => prisma.teamPointAward.count() },
        { name: 'IndividualPointAward', getCount: () => prisma.individualPointAward.count() },
      ];

      for (const { name, getCount } of models) {
        try {
          const count = await getCount();
          info.tables[name] = { recordCount: count };
          console.log(`📊 ${name}: ${count} records`);
        } catch (error) {
          console.log(`⚠️  ${name}: Unable to count records`);
          info.tables[name] = { recordCount: 'N/A', error: 'Access denied or table not found' };
        }
      }

      fs.writeFileSync(filePath, JSON.stringify(info, null, 2));
      console.log(`✅ Database info exported: ${filePath}`);
    } catch (error) {
      console.error('❌ Error exporting database info:', error);
      throw error;
    }
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  async exportAll(): Promise<void> {
    console.log('🚀 Starting complete Prisma Accelerate export...');

    try {
      await this.exportDatabaseInfo();
      await this.exportToJSON();
      await this.exportToCSV();

      console.log('🎉 All exports completed successfully!');
    } catch (error) {
      console.error('❌ Export failed:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const format = args[0] || 'all';
  const outputDir = args[1] || './exports';

  console.log('🌐 Prisma Accelerate Database Exporter');
  console.log('=====================================');

  const exporter = new PrismaAccelerateExporter(outputDir);

  try {
    switch (format.toLowerCase()) {
      case 'json':
        await exporter.exportToJSON();
        break;
      case 'csv':
        await exporter.exportToCSV();
        break;
      case 'info':
        await exporter.exportDatabaseInfo();
        break;
      case 'all':
      default:
        await exporter.exportAll();
        break;
    }
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { PrismaAccelerateExporter };
