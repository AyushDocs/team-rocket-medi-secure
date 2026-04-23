import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { CONFIG } from "../config/constants.js";
import logger from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

class MigrationManager {
    constructor() {
        this.migrationsDir = path.join(__dirname, "../prisma/migrations");
        this.lockFile = path.join(__dirname, "../prisma/migration.lock");
    }

    async ensureLock() {
        if (fs.existsSync(this.lockFile)) {
            const lock = JSON.parse(fs.readFileSync(this.lockFile, "utf-8"));
            const lockAge = Date.now() - lock.timestamp;
            if (lockAge < 60000) {
                throw new Error("Migration already in progress by: " + lock.serviceId);
            }
            fs.unlinkSync(this.lockFile);
        }
        fs.writeFileSync(this.lockFile, JSON.stringify({
            serviceId: CONFIG.SERVICE_ID,
            timestamp: Date.now()
        }));
    }

    async releaseLock() {
        if (fs.existsSync(this.lockFile)) {
            fs.unlinkSync(this.lockFile);
        }
    }

    async getAppliedMigrations() {
        const result = await prisma.$queryRaw`
            SELECT name FROM _migrations ORDER BY executed_at DESC
        `;
        return result.map(r => r.name);
    }

    async getPendingMigrations() {
        const applied = await this.getAppliedMigrations();
        const files = fs.readdirSync(this.migrationsDir)
            .filter(f => f.endsWith(".sql"))
            .sort();
        
        return files.filter(f => !applied.includes(f.replace(".sql", "")));
    }

    async runMigrations() {
        try {
            await this.ensureLock();
            
            await prisma.$executeRaw`
                CREATE TABLE IF NOT EXISTS _migrations (
                    name TEXT PRIMARY KEY,
                    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;

            const pending = await this.getPendingMigrations();
            
            if (pending.length === 0) {
                logger.info(`[${CONFIG.SERVICE_ID}] No pending migrations`);
                return { applied: [], skipped: 0 };
            }

            const applied = [];
            for (const file of pending) {
                const sql = fs.readFileSync(path.join(this.migrationsDir, file), "utf-8");
                await prisma.$executeRawUnsafe(sql);
                await prisma.$executeRaw`
                    INSERT INTO _migrations (name) VALUES (${file.replace(".sql", "")})
                `;
                applied.push(file);
                logger.info(`[${CONFIG.SERVICE_ID}] Applied migration: ${file}`);
            }

            return { applied, skipped: pending.length - applied.length };
        } catch (error) {
            logger.error(`[${CONFIG.SERVICE_ID}] Migration failed`, { error: error.message });
            throw error;
        } finally {
            await this.releaseLock();
        }
    }

    async rollback(migrationName) {
        try {
            await this.ensureLock();
            const migrationFile = path.join(this.migrationsDir, `${migrationName}.sql`);
            throw new Error("Rollback not implemented - use prisma migrate reset");
        } finally {
            await this.releaseLock();
        }
    }

    async status() {
        const applied = await this.getAppliedMigrations();
        const pending = await this.getPendingMigrations();
        return {
            serviceId: CONFIG.SERVICE_ID,
            applied: applied.length,
            pending: pending.length,
            lastMigration: applied[0] || null
        };
    }
}

export const migrationManager = new MigrationManager();
export default MigrationManager;