/**
 * City Fragrance Environment Switcher & Data Migrator
 * 
 * An interactive, secure CLI script to switch environment configurations
 * and safely migrate Neon DB and Cloudinary media between environments.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');
const { Client } = require('pg');

// File paths
const WORKSPACE_DIR = path.resolve(__dirname, '..');
const ENV_FILE_PATH = path.join(WORKSPACE_DIR, '.env.local');
const CONFIG_FILE_PATH = path.join(WORKSPACE_DIR, 'scripts', 'accounts-config.json');
const DATA_DIR = path.join(WORKSPACE_DIR, 'data');

// Ordered list of tables to migrate to preserve foreign keys
const TABLES_ORDER = [
  'User',
  'Subscriber',
  'Collection',
  'CollectionImage',
  'Product',
  '_CollectionToProduct', // Junction table for implicit many-to-many
  'GiftSet',
  'SiteSetting',
  'Shift',
  'Order',
  'ShiftLog'
];

/**
 * Returns primary key column name(s) for a given table.
 */
function getPrimaryKey(tableName) {
  if (tableName === 'CollectionImage') return ['slug'];
  if (tableName === '_CollectionToProduct') return ['A', 'B'];
  return ['id'];
}

/**
 * Reads and parses a JSON config file.
 */
function readConfig() {
  if (!fs.existsSync(CONFIG_FILE_PATH)) {
    console.error(`Error: Configuration file not found at ${CONFIG_FILE_PATH}`);
    process.exit(1);
  }
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf-8'));
  } catch (err) {
    console.error(`Error parsing configuration file: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Parses current environment variables from .env.local.
 */
function parseCurrentEnv() {
  if (!fs.existsSync(ENV_FILE_PATH)) {
    return {};
  }
  const content = fs.readFileSync(ENV_FILE_PATH, 'utf-8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const eqIndex = trimmed.indexOf('=');
      const key = trimmed.substring(0, eqIndex).trim();
      let val = trimmed.substring(eqIndex + 1).trim();
      // Remove surrounding quotes if present
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      env[key] = val;
    }
  });
  return env;
}

/**
 * Writes updated environment variables back to .env.local while preserving comments and other keys.
 */
function writeEnvFile(newEnvValues, dryRun = false) {
  let content = '';
  if (fs.existsSync(ENV_FILE_PATH)) {
    content = fs.readFileSync(ENV_FILE_PATH, 'utf-8');
  }

  const lines = content.split('\n');
  const updatedLines = [];
  const processedKeys = new Set();

  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const eqIndex = trimmed.indexOf('=');
      const key = trimmed.substring(0, eqIndex).trim();
      if (newEnvValues[key] !== undefined) {
        const value = newEnvValues[key];
        const formattedValue = value.includes(' ') || value.includes('#') ? `"${value}"` : value;
        updatedLines.push(`${key}=${formattedValue}`);
        processedKeys.add(key);
        continue;
      }
    }
    updatedLines.push(line);
  }

  // Add keys that were not already in .env.local
  for (const key of Object.keys(newEnvValues)) {
    if (!processedKeys.has(key)) {
      const value = newEnvValues[key];
      const formattedValue = value.includes(' ') || value.includes('#') ? `"${value}"` : value;
      updatedLines.push(`${key}=${formattedValue}`);
    }
  }

  const outputContent = updatedLines.join('\n');
  if (dryRun) {
    console.log('\n[DRY RUN] Would write the following keys to .env.local:');
    for (const [k, v] of Object.entries(newEnvValues)) {
      console.log(`  ${k}=${v.substring(0, 15)}...[REDACTED]`);
    }
  } else {
    fs.writeFileSync(ENV_FILE_PATH, outputContent, 'utf-8');
    console.log('\nSuccessfully updated .env.local!');
  }
}

/**
 * Parses Cloudinary URL structure.
 */
function parseCloudinaryUrl(url, oldCloudName) {
  if (!url || typeof url !== 'string' || !url.startsWith('https://res.cloudinary.com/')) {
    return null;
  }
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    
    const cloudName = parts[0];
    const resourceType = parts[1]; // image, video, raw
    const type = parts[2]; // upload, etc.

    if (cloudName !== oldCloudName) {
      return null;
    }

    // Traverse segments to find the version and transformations
    let startIndex = 3;
    while (startIndex < parts.length) {
      const part = parts[startIndex];
      if (part.startsWith('v') && /^\d+$/.test(part.substring(1))) {
        startIndex++;
        break;
      }
      if (part === 'f_auto,q_auto:best' || part.includes(',') || part.includes('_') || part.includes('h_') || part.includes('w_')) {
        startIndex++;
        continue;
      }
      break;
    }

    const remainingPath = parts.slice(startIndex).join('/');
    const lastDotIndex = remainingPath.lastIndexOf('.');
    const publicId = lastDotIndex !== -1 ? remainingPath.substring(0, lastDotIndex) : remainingPath;

    return {
      url,
      resourceType,
      publicId
    };
  } catch (e) {
    return null;
  }
}

/**
 * Recursively scans any object/array/value for Cloudinary URLs.
 */
function findCloudinaryUrls(val, oldCloudName, resultSet = new Map()) {
  if (!val) return resultSet;
  if (typeof val === 'string') {
    const parsed = parseCloudinaryUrl(val, oldCloudName);
    if (parsed) {
      resultSet.set(val, parsed);
    }
  } else if (Array.isArray(val)) {
    for (const item of val) {
      findCloudinaryUrls(item, oldCloudName, resultSet);
    }
  } else if (typeof val === 'object' && !(val instanceof Date)) {
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        findCloudinaryUrls(val[key], oldCloudName, resultSet);
      }
    }
  }
  return resultSet;
}

/**
 * Recursively replaces the old Cloudinary cloud name in URL strings with the new one.
 */
function replaceCloudinaryUrls(val, oldCloudName, newCloudName) {
  if (!val) return val;
  if (typeof val === 'string') {
    if (val.startsWith('https://res.cloudinary.com/')) {
      return val.replace(`https://res.cloudinary.com/${oldCloudName}`, `https://res.cloudinary.com/${newCloudName}`);
    }
    return val;
  } else if (Array.isArray(val)) {
    return val.map(item => replaceCloudinaryUrls(item, oldCloudName, newCloudName));
  } else if (typeof val === 'object' && !(val instanceof Date)) {
    const newVal = {};
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        newVal[key] = replaceCloudinaryUrls(val[key], oldCloudName, newCloudName);
      }
    }
    return newVal;
  }
  return val;
}

/**
 * Prompts user with a question.
 */
function askQuestion(rl, query) {
  return new Promise(resolve => rl.question(query, answer => resolve(answer.trim())));
}

/**
 * Main switch and migration runner.
 */
async function main() {
  console.log('\n==================================================');
  console.log('    City Fragrance Environment Manager & Migrator');
  console.log('==================================================\n');

  const configData = readConfig();
  const currentEnv = parseCurrentEnv();

  // Identify current active account
  const currentDbUrl = currentEnv.DATABASE_URL || '';
  let activeIndex = -1;
  for (let i = 0; i < configData.accounts.length; i++) {
    const acc = configData.accounts[i];
    if (acc.env.DATABASE_URL && currentDbUrl.includes(acc.env.DATABASE_URL.split('@')[1] || '---NO_MATCH---')) {
      activeIndex = i;
      break;
    }
  }

  const activeAccountName = activeIndex !== -1 ? configData.accounts[activeIndex].name : 'Unknown / Custom Environment';
  console.log(`Current Active Account: \x1b[32m${activeAccountName}\x1b[0m`);

  // Prompt account selection
  console.log('\nSelect an account to switch to:');
  configData.accounts.forEach((acc, i) => {
    const isCurrent = i === activeIndex ? ' (Active)' : '';
    console.log(`  ${i + 1}) ${acc.name}${isCurrent}`);
  });
  console.log('  q) Quit / Exit');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const choice = await askQuestion(rl, '\nEnter choice (1-3 or q): ');
  if (choice.toLowerCase() === 'q') {
    console.log('Exiting...');
    rl.close();
    process.exit(0);
  }

  const targetIndex = parseInt(choice, 10) - 1;
  if (isNaN(targetIndex) || targetIndex < 0 || targetIndex >= configData.accounts.length) {
    console.error('Invalid selection.');
    rl.close();
    process.exit(1);
  }

  const targetAccount = configData.accounts[targetIndex];
  console.log(`\nSelected target environment: \x1b[36m${targetAccount.name}\x1b[0m`);

  // Check if target account is configured
  const targetEnv = targetAccount.env;
  if (!targetEnv.DATABASE_URL || targetEnv.DATABASE_URL.includes('REPLACE_WITH_')) {
    console.error(`\x1b[31mError: Target account "${targetAccount.name}" is not fully configured.\x1b[0m`);
    rl.close();
    process.exit(1);
  }

  // Ask for Dry Run Mode
  const dryRunAnswer = await askQuestion(rl, 'Do you want to run in Safe Simulation Mode (Dry Run Mode)? (y/n): ');
  const isDryRun = dryRunAnswer.toLowerCase() === 'y' || dryRunAnswer.toLowerCase() === 'yes' || dryRunAnswer === '';
  
  if (isDryRun) {
    console.log('\n\x1b[33m>>> SAFE SIMULATION MODE (DRY RUN) ACTIVE <<<\x1b[0m');
    console.log('No database rows will be inserted, and no files will be uploaded to Cloudinary.\n');
  }

  // Ask for Data & Media Migration
  const migrateAnswer = await askQuestion(rl, 'Do you want to migrate data and Cloudinary media from the old account to the selected account? (y/n): ');
  const shouldMigrate = migrateAnswer.toLowerCase() === 'y' || migrateAnswer.toLowerCase() === 'yes';

  let sourceClient = null;
  let targetClient = null;

  if (shouldMigrate) {
    if (activeIndex === -1) {
      console.error('\x1b[31mError: Cannot migrate because the current active environment is unknown or unconfigured.\x1b[0m');
      rl.close();
      process.exit(1);
    }
    if (activeIndex === targetIndex) {
      console.log('Source and target environments are identical. Skipping data migration.');
    } else {
      const sourceAccount = configData.accounts[activeIndex];
      console.log(`\nStarting migration: ${sourceAccount.name} -> ${targetAccount.name}...`);

      // Initialize PostgreSQL Clients using @neondatabase/serverless (pg compatible)
      sourceClient = new Client({ connectionString: sourceAccount.env.DATABASE_URL });
      targetClient = new Client({ connectionString: targetAccount.env.DATABASE_URL });

      try {
        console.log('  Connecting to source and target databases...');
        await sourceClient.connect();
        if (!isDryRun) {
          await targetClient.connect();
        }

        // --- STEP 1: Sync DB Schema on Target Database ---
        console.log('\n1. Synchronizing Prisma schema to target database...');
        if (isDryRun) {
          console.log('  [SIMULATION] Would run "npx prisma db push" on target database');
        } else {
          // Temporarily set DATABASE_URL in process env to run db push
          execSync('npx prisma db push', {
            env: { ...process.env, DATABASE_URL: targetAccount.env.DATABASE_URL },
            stdio: 'inherit'
          });
          console.log('  Target database schema is synchronized.');
        }

        // --- STEP 2: Scan for Cloudinary URLs in database and JSON files ---
        console.log('\n2. Scanning database and local files for Cloudinary media...');
        const oldCloudName = sourceAccount.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const newCloudName = targetAccount.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const allMediaUrls = new Map();

        // Scan database tables
        console.log('  Scanning tables in source database...');
        for (const tableName of TABLES_ORDER) {
          if (tableName.startsWith('_')) continue; // Skip junction tables
          try {
            const res = await sourceClient.query(`SELECT * FROM "${tableName}"`);
            findCloudinaryUrls(res.rows, oldCloudName, allMediaUrls);
          } catch (err) {
            console.warn(`  Warning scanning table ${tableName}: ${err.message}`);
          }
        }

        // Scan local JSON files
        console.log('  Scanning local JSON files in data/ directory...');
        if (fs.existsSync(DATA_DIR)) {
          const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
          for (const file of files) {
            try {
              const fileContent = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'));
              findCloudinaryUrls(fileContent, oldCloudName, allMediaUrls);
            } catch (err) {
              console.warn(`  Warning scanning file ${file}: ${err.message}`);
            }
          }
        }

        console.log(`  Found ${allMediaUrls.size} unique Cloudinary media file(s) referenced.`);

        // --- STEP 3: Migrate Cloudinary Media ---
        console.log('\n3. Migrating Cloudinary media files...');
        let targetCloudinary = null;
        if (!isDryRun && allMediaUrls.size > 0) {
          const cloudinary = require('cloudinary').v2;
          cloudinary.config({
            cloud_name: targetAccount.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
            api_key: targetAccount.env.CLOUDINARY_API_KEY,
            api_secret: targetAccount.env.CLOUDINARY_API_SECRET,
            secure: true
          });
          targetCloudinary = cloudinary;
        }

        let mediaIndex = 0;
        for (const [oldUrl, parsed] of allMediaUrls.entries()) {
          mediaIndex++;
          const newUrl = oldUrl.replace(`https://res.cloudinary.com/${oldCloudName}`, `https://res.cloudinary.com/${newCloudName}`);
          
          if (isDryRun) {
            console.log(`  [SIMULATION] (${mediaIndex}/${allMediaUrls.size}) Would upload:`);
            console.log(`    Source: ${oldUrl}`);
            console.log(`    Target Cloud Name: ${newCloudName}`);
            console.log(`    Target public_id: ${parsed.publicId}`);
            console.log(`    Target resource_type: ${parsed.resourceType}`);
            console.log(`    Result URL: ${newUrl}`);
          } else {
            console.log(`  (${mediaIndex}/${allMediaUrls.size}) Uploading ${parsed.publicId} (${parsed.resourceType})...`);
            try {
              await targetCloudinary.uploader.upload(oldUrl, {
                public_id: parsed.publicId,
                resource_type: parsed.resourceType,
                invalidate: true
              });
              console.log(`    Success!`);
            } catch (err) {
              console.error(`    Error migrating asset: ${err.message}`);
            }
          }
        }

        // --- STEP 4: Database Rows Migration ---
        console.log('\n4. Migrating database tables in dependency order...');
        for (const tableName of TABLES_ORDER) {
          console.log(`  Migrating table: ${tableName}`);
          let rows = [];
          try {
            const res = await sourceClient.query(`SELECT * FROM "${tableName}"`);
            rows = res.rows;
          } catch (err) {
            console.error(`    Error fetching rows from source table ${tableName}: ${err.message}`);
            continue;
          }

          if (rows.length === 0) {
            console.log(`    No rows found. Skipping.`);
            continue;
          }

          console.log(`    Found ${rows.length} row(s) to migrate.`);
          let tableMigratedCount = 0;

          for (const row of rows) {
            // Replace Cloudinary URLs in database row to point to new account
            const updatedRow = replaceCloudinaryUrls(row, oldCloudName, newCloudName);

            if (isDryRun) {
              tableMigratedCount++;
              if (tableMigratedCount <= 1) {
                console.log(`    [SIMULATION] Would upsert row details:`, JSON.stringify(updatedRow).substring(0, 100) + '...');
              }
            } else {
              const keys = Object.keys(updatedRow);
              if (keys.length === 0) continue;

              const columnsStr = keys.map(k => `"${k}"`).join(', ');
              const placeholdersStr = keys.map((_, idx) => `$${idx + 1}`).join(', ');
              const pks = getPrimaryKey(tableName);
              const pkConflictStr = pks.map(pk => `"${pk}"`).join(', ');

              const values = keys.map(k => {
                const val = updatedRow[k];
                if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
                  return JSON.stringify(val);
                }
                return val;
              });

              const nonPks = keys.filter(k => !pks.includes(k));
              let sql = '';
              if (nonPks.length === 0) {
                sql = `INSERT INTO "${tableName}" (${columnsStr}) VALUES (${placeholdersStr}) ON CONFLICT (${pkConflictStr}) DO NOTHING`;
              } else {
                const updateStr = nonPks.map(k => `"${k}" = EXCLUDED."${k}"`).join(', ');
                sql = `INSERT INTO "${tableName}" (${columnsStr}) VALUES (${placeholdersStr}) ON CONFLICT (${pkConflictStr}) DO UPDATE SET ${updateStr}`;
              }

              try {
                await targetClient.query(sql, values);
                tableMigratedCount++;
              } catch (err) {
                console.error(`    Error inserting row in table ${tableName}: ${err.message}`);
              }
            }
          }
          console.log(`    Migrated ${tableMigratedCount}/${rows.length} row(s) successfully.`);
        }

        // --- STEP 5: Local JSON Files Update & Cloudinary Backup Sync ---
        console.log('\n5. Updating local JSON files & Cloudinary raw backups...');
        if (fs.existsSync(DATA_DIR)) {
          const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
          let targetCloudinary = null;
          if (!isDryRun && shouldMigrate) {
            const cloudinary = require('cloudinary').v2;
            cloudinary.config({
              cloud_name: targetAccount.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
              api_key: targetAccount.env.CLOUDINARY_API_KEY,
              api_secret: targetAccount.env.CLOUDINARY_API_SECRET,
              secure: true
            });
            targetCloudinary = cloudinary;
          }

          for (const file of files) {
            const filePath = path.join(DATA_DIR, file);
            try {
              const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
              const updatedContent = replaceCloudinaryUrls(fileContent, oldCloudName, newCloudName);
              
              if (isDryRun) {
                console.log(`  [SIMULATION] Would rewrite local JSON: data/${file}`);
                console.log(`  [SIMULATION] Would upload raw backup to Cloudinary: city-fragrance-data/${file}`);
              } else {
                // Write updated local JSON file
                fs.writeFileSync(filePath, JSON.stringify(updatedContent, null, 2), 'utf-8');
                console.log(`  Updated local file data/${file}`);

                // Upload to target Cloudinary account raw backups folder
                try {
                  await targetCloudinary.uploader.upload(filePath, {
                    public_id: `city-fragrance-data/${file}`,
                    resource_type: 'raw',
                    invalidate: true
                  });
                  console.log(`  Uploaded raw backup to Cloudinary: city-fragrance-data/${file}`);
                } catch (err) {
                  console.error(`  Failed to upload raw backup for ${file}: ${err.message}`);
                }
              }
            } catch (err) {
              console.error(`  Error processing file ${file}: ${err.message}`);
            }
          }
        }

        console.log('\n\x1b[32m✔ Migration completed successfully!\x1b[0m');
      } catch (err) {
        console.error(`\x1b[31mCritical error during migration: ${err.message}\x1b[0m`);
      } finally {
        if (sourceClient) {
          try { await sourceClient.end(); } catch (e) {}
        }
        if (targetClient) {
          try { await targetClient.end(); } catch (e) {}
        }
      }
    }
  }

  // --- STEP 6: Write updated .env.local ---
  writeEnvFile(targetEnv, isDryRun);

  if (isDryRun) {
    console.log('\n\x1b[33m[DRY RUN] Simulation complete. No actual changes made.\x1b[0m');
  } else {
    console.log(`\n\x1b[32m✔ Successfully switched active environment to: ${targetAccount.name}\x1b[0m`);
  }

  rl.close();
}

main().catch(err => {
  console.error('Unhandled fatal error:', err);
  process.exit(1);
});
