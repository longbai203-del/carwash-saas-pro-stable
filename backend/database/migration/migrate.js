// backend/database/migrate.js
import { supabase } from '../src/shared/supabase/index.js'
import fs from 'fs/promises'

class DatabaseMigrator {
  constructor() {
    this.migrationsTable = '_migrations'
    this.migrationsDir = './database/migrations'
  }

  async init() {
    // 创建迁移记录表
    await supabase.query(`
      CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
        id SERIAL PRIMARY KEY,
        version VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
  }

  async getAppliedMigrations() {
    const { data } = await supabase
      .from(this.migrationsTable)
      .select('version')
      .order('id')
    return data.map(m => m.version)
  }

  async applyMigration(version, name, sql) {
    console.log(`📦 Applying migration: ${version} - ${name}`)
    
    try {
      await supabase.query(sql)
      
      await supabase
        .from(this.migrationsTable)
        .insert({ version, name })
      
      console.log(`✅ Migration ${version} applied successfully`)
    } catch (error) {
      console.error(`❌ Failed to apply migration ${version}:`, error)
      throw error
    }
  }

  async migrate() {
    await this.init()
    
    const applied = await this.getAppliedMigrations()
    const files = await fs.readdir(this.migrationsDir)
    const migrationFiles = files
      .filter(f => f.endsWith('.sql'))
      .sort()
    
    let appliedCount = 0
    
    for (const file of migrationFiles) {
      const version = file.split('_')[0]
      
      if (applied.includes(version)) {
        console.log(`⏭️  Skipping ${file} - already applied`)
        continue
      }
      
      const sql = await fs.readFile(`${this.migrationsDir}/${file}`, 'utf8')
      const name = file.replace(/^\d+_/, '').replace('.sql', '')
      
      await this.applyMigration(version, name, sql)
      appliedCount++
    }
    
    console.log(`🎉 Migration complete! ${appliedCount} migrations applied`)
  }

  async rollback(version) {
    console.log(`⬅️ Rolling back migration: ${version}`)
    
    // 查找迁移文件
    const files = await fs.readdir(this.migrationsDir)
    const migrationFile = files.find(f => f.startsWith(version))
    
    if (!migrationFile) {
      throw new Error(`Migration file for version ${version} not found`)
    }
    
    // 读取回滚SQL
    const sql = await fs.readFile(`${this.migrationsDir}/${version}_rollback.sql`, 'utf8')
    
    await supabase.query(sql)
    
    await supabase
      .from(this.migrationsTable)
      .delete()
      .eq('version', version)
    
    console.log(`✅ Migration ${version} rolled back successfully`)
  }
}

// 命令行执行
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2]
  const migrator = new DatabaseMigrator()
  
  switch (command) {
    case 'up':
      migrator.migrate()
      break
    case 'down':
      const version = process.argv[3]
      if (!version) {
        console.error('Please specify version to rollback')
        process.exit(1)
      }
      migrator.rollback(version)
      break
    case 'status':
      const applied = await migrator.getAppliedMigrations()
      console.log('Applied migrations:', applied)
      break
    default:
      console.log('Usage:')
      console.log('  node migrate.js up                  # Apply all pending migrations')
      console.log('  node migrate.js down VERSION        # Rollback a migration')
      console.log('  node migrate.js status              # Show applied migrations')
  }
}

export { DatabaseMigrator }