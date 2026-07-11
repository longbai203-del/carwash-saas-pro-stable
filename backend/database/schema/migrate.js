/**
 * Database Migration Script
 * Manages database schema migrations
 * 
 * @module database/schema/migrate
 * 
 * @example
 * node database/schema/migrate.js up      # Run all pending migrations
 * node database/schema/migrate.js status  # Check migration status
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_TABLE = '_migrations';
const MIGRATIONS_DIR = path.join(__dirname, '../../migration');

function log(message) {
    console.log(message);
}

function logGreen(message) {
    console.log('\x1b[32m' + message + '\x1b[0m');
}

function logYellow(message) {
    console.log('\x1b[33m' + message + '\x1b[0m');
}

function logRed(message) {
    console.log('\x1b[31m' + message + '\x1b[0m');
}

function logCyan(message) {
    console.log('\x1b[36m' + message + '\x1b[0m');
}

function logGray(message) {
    console.log('\x1b[90m' + message + '\x1b[0m');
}

class DatabaseMigrator {
    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase credentials');
        }

        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    async init() {
        try {
            const { error } = await this.supabase
                .from(MIGRATIONS_TABLE)
                .select('id')
                .limit(1);

            if (error && error.code === '42P01') {
                logYellow('[INIT] Creating migrations table...');
                const sql = 'CREATE TABLE IF NOT EXISTS ' + MIGRATIONS_TABLE + ' (' +
                    'id SERIAL PRIMARY KEY, ' +
                    'version VARCHAR(20) NOT NULL UNIQUE, ' +
                    'name VARCHAR(200) NOT NULL, ' +
                    'applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()' +
                    ')';
                const { error: createError } = await this.supabase.rpc('exec_sql', { sql: sql });
                if (createError) throw createError;
                logGreen('[INIT] Migrations table created successfully');
            }
        } catch (error) {
            logRed('[INIT] Failed: ' + error.message);
            throw error;
        }
    }

    async getAppliedMigrations() {
        try {
            const { data, error } = await this.supabase
                .from(MIGRATIONS_TABLE)
                .select('version')
                .order('id');

            if (error) return [];
            return data.map(function(m) { return m.version; });
        } catch (error) {
            return [];
        }
    }

    async getMigrationFiles() {
        try {
            const files = await fs.readdir(MIGRATIONS_DIR);
            return files
                .filter(function(f) { return f.endsWith('.sql'); })
                .sort();
        } catch (error) {
            await fs.mkdir(MIGRATIONS_DIR, { recursive: true });
            return [];
        }
    }

    async applyMigration(version, name, sql) {
        logCyan('[APPLY] ' + version + ' - ' + name);

        try {
            await this.supabase.rpc('exec_sql', { sql: sql });
            await this.supabase.from(MIGRATIONS_TABLE).insert({ version: version, name: name });
            logGreen('[APPLY] ' + version + ' applied successfully');
            return true;
        } catch (error) {
            logRed('[APPLY] ' + version + ' failed: ' + error.message);
            return false;
        }
    }

    async migrate() {
        logYellow('[MIGRATE] Starting database migration...');
        await this.init();

        var applied = await this.getAppliedMigrations();
        var files = await this.getMigrationFiles();

        var appliedCount = 0;
        var failedCount = 0;

        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            var match = file.match(/^migration_(\d+)_(.+)\.sql$/);
            if (!match) continue;

            var version = match[1];
            var name = match[2];

            if (applied.indexOf(version) !== -1) {
                logGray('[SKIP] ' + file + ' (already applied)');
                continue;
            }

            var filePath = path.join(MIGRATIONS_DIR, file);
            var sql = await fs.readFile(filePath, 'utf8');

            var success = await this.applyMigration(version, name, sql);
            if (success) {
                appliedCount++;
            } else {
                failedCount++;
            }
        }

        logCyan('[MIGRATE] Complete: ' + appliedCount + ' success, ' + failedCount + ' failed');
        return { applied: appliedCount, failed: failedCount };
    }

    async status() {
        await this.init();
        var applied = await this.getAppliedMigrations();
        var files = await this.getMigrationFiles();

        logCyan('[STATUS] Migration Status');
        logGray('----------------------------------------');

        logYellow('[STATUS] Applied:');
        if (applied.length === 0) {
            logGray('  (none)');
        } else {
            for (var i = 0; i < applied.length; i++) {
                logGreen('  ' + applied[i]);
            }
        }

        logYellow('[STATUS] Pending:');
        var pending = [];
        for (var j = 0; j < files.length; j++) {
            var match = files[j].match(/^migration_(\d+)_/);
            if (match && applied.indexOf(match[1]) === -1) {
                pending.push(files[j]);
            }
        }

        if (pending.length === 0) {
            logGray('  (none)');
        } else {
            for (var k = 0; k < pending.length; k++) {
                logYellow('  ' + pending[k]);
            }
        }

        logGray('----------------------------------------');
    }
}

async function main() {
    var args = process.argv.slice(2);
    var command = args[0] || 'help';
    var migrator = new DatabaseMigrator();

    try {
        switch (command) {
            case 'up':
            case 'migrate':
                await migrator.migrate();
                break;
            case 'status':
                await migrator.status();
                break;
            case 'help':
            case '-h':
            case '--help':
            default:
                logCyan('Database Migration Tool');
                logGray('  node migrate.js up       Run migrations');
                logGray('  node migrate.js status   Check status');
                break;
        }
    } catch (error) {
        logRed('Error: ' + error.message);
        process.exit(1);
    }
}

if (import.meta.url === 'file://' + process.argv[1]) {
    main();
}
