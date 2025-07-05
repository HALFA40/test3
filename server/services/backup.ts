import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export interface BackupResult {
  success: boolean;
  filename?: string;
  error?: string;
  size?: number;
}

export class DatabaseBackupService {
  private backupDir = path.join(process.cwd(), 'backups');
  private maxBackups = 7; // Keep last 7 backups

  constructor() {
    this.ensureBackupDirectory();
  }

  private async ensureBackupDirectory() {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
    }
  }

  async createBackup(): Promise<BackupResult> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `inventory-backup-${timestamp}.sql`;
      const filepath = path.join(this.backupDir, filename);

      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      // Create database dump using pg_dump
      const command = `pg_dump "${databaseUrl}" > "${filepath}"`;
      
      await execAsync(command);

      // Get file size
      const stats = await fs.stat(filepath);
      const size = stats.size;

      // Clean up old backups
      await this.cleanupOldBackups();

      return {
        success: true,
        filename,
        size
      };
    } catch (error) {
      console.error('Backup failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown backup error'
      };
    }
  }

  async scheduleAutomaticBackups() {
    // Create initial backup
    const result = await this.createBackup();
    console.log('Initial backup result:', result);

    // Schedule daily backups
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    setInterval(async () => {
      const backupResult = await this.createBackup();
      console.log('Scheduled backup result:', backupResult);
    }, TWENTY_FOUR_HOURS);
  }

  private async cleanupOldBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(file => file.startsWith('inventory-backup-') && file.endsWith('.sql'))
        .map(async file => {
          const filepath = path.join(this.backupDir, file);
          const stats = await fs.stat(filepath);
          return { file, path: filepath, created: stats.birthtime };
        });

      const fileStats = await Promise.all(backupFiles);
      
      // Sort by creation date (newest first)
      fileStats.sort((a, b) => b.created.getTime() - a.created.getTime());

      // Delete old backups beyond maxBackups
      const filesToDelete = fileStats.slice(this.maxBackups);
      
      for (const fileInfo of filesToDelete) {
        await fs.unlink(fileInfo.path);
        console.log(`Deleted old backup: ${fileInfo.file}`);
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  async listBackups(): Promise<Array<{ filename: string; created: Date; size: number }>> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(file => file.startsWith('inventory-backup-') && file.endsWith('.sql'))
        .map(async file => {
          const filepath = path.join(this.backupDir, file);
          const stats = await fs.stat(filepath);
          return {
            filename: file,
            created: stats.birthtime,
            size: stats.size
          };
        });

      const fileStats = await Promise.all(backupFiles);
      return fileStats.sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  async restoreBackup(filename: string): Promise<BackupResult> {
    try {
      const filepath = path.join(this.backupDir, filename);
      
      // Verify backup file exists
      await fs.access(filepath);

      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      // Restore database from backup
      const command = `psql "${databaseUrl}" < "${filepath}"`;
      
      await execAsync(command);

      return {
        success: true,
        filename
      };
    } catch (error) {
      console.error('Restore failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown restore error'
      };
    }
  }
}

export const backupService = new DatabaseBackupService();