#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log(chalk.blue.bold('\n🚀 Supabase Project Setup Script\n'));
  console.log(chalk.gray('This script will help you set up a new Supabase project with all required tables, policies, and functions.\n'));

  try {
    // Step 1: Collect credentials
    console.log(chalk.bold('Step 1: Supabase Credentials\n'));
    console.log(chalk.gray('Get these from your Supabase Dashboard → Project Settings → API\n'));

    const supabaseUrl = await question(chalk.cyan('Supabase Project URL (https://...supabase.co): '));
    if (!supabaseUrl.startsWith('https://')) {
      throw new Error('Invalid Supabase URL. Must start with https://');
    }

    const anonKey = await question(chalk.cyan('Anon/Public Key (starts with eyJ...): '));
    if (!anonKey.startsWith('eyJ')) {
      throw new Error('Invalid Anon Key. Must start with eyJ');
    }

    const serviceRoleKey = await question(chalk.cyan('Service Role Key (starts with eyJ...): '));
    if (!serviceRoleKey.startsWith('eyJ')) {
      throw new Error('Invalid Service Role Key. Must start with eyJ');
    }

    // Step 2: Test connection
    console.log(chalk.bold('\n\nStep 2: Testing Connection...\n'));
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    try {
      // Simple test: try to get auth info
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) {
        throw error;
      }
      console.log(chalk.green('✓ Connection successful!\n'));
    } catch (error) {
      throw new Error(`Failed to connect to Supabase: ${error.message}`);
    }

    // Step 3: Collect Retell API Key (agent IDs will be per-widget)
    console.log(chalk.bold('Step 3: Retell AI API Key\n'));
    console.log(chalk.gray('Get this from your Retell AI dashboard (https://retell.ai/dashboard)\n'));
    console.log(chalk.gray('Note: Agent IDs will be configured per-widget in the dashboard\n'));

    const retellApiKey = await question(chalk.cyan('Retell API Key: '));

    // Step 4: Run migrations
    console.log(chalk.bold('\n\nStep 4: Running Migrations...\n'));
    console.log(chalk.gray('Note: Migrations are typically applied via Supabase CLI.\n'));
    console.log(chalk.yellow('⚠ Skipping automated migration execution.\n'));
    console.log(chalk.gray('You will need to run migrations manually using:\n'));
    console.log(chalk.cyan('  supabase db push\n'));
    console.log(chalk.gray('(After linking your project with "supabase link")\n'));

    // Step 5: Verify tables
    console.log(chalk.bold('\n\nStep 5: Verifying Tables...\n'));

    const tablesToCheck = ['profiles', 'widget_configs', 'demo_settings', 'teams', 'team_members', 'user_roles'];
    let tablesVerified = 0;

    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase.from(tableName).select('*').limit(1);
        if (!error) {
          console.log(chalk.green(`✓ ${tableName}`));
          tablesVerified++;
        } else {
          console.log(chalk.yellow(`⚠ ${tableName} (may not exist yet)`));
        }
      } catch {
        console.log(chalk.yellow(`⚠ ${tableName} (may not exist yet)`));
      }
    }

    console.log(chalk.green(`\n${tablesVerified}/${tablesToCheck.length} tables verified`));

    // Step 6: Create .env.local
    console.log(chalk.bold('\n\nStep 6: Creating .env.local...\n'));

    const projectRef = supabaseUrl.split('//')[1].split('.')[0];
    const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_PUBLISHABLE_KEY=${anonKey}
VITE_SUPABASE_PROJECT_ID=${projectRef}

# Retell AI Configuration
# API Key used by Edge Functions to authenticate with Retell
VITE_RETELL_API_KEY=${retellApiKey}

# Note: Agent IDs are configured per-widget in the dashboard
# Each widget can have different voice_agent_id and chat_agent_id
`;

    const envPath = path.join(__dirname, '..', '.env.local');
    fs.writeFileSync(envPath, envContent);
    console.log(chalk.green(`✓ Created .env.local\n`));

    // Step 7: Next steps
    console.log(chalk.bold('\n\nStep 7: Next Steps\n'));
    console.log(chalk.cyan('1. Install Supabase CLI:'));
    console.log(chalk.gray('   npm install -g supabase\n'));

    console.log(chalk.cyan('2. Link to your project:'));
    console.log(chalk.gray(`   supabase link --project-ref ${projectRef}\n`));

    console.log(chalk.cyan('3. Push database migrations:'));
    console.log(chalk.gray(`   supabase db push\n`));
    console.log(chalk.gray('   (This will create all tables, policies, and functions)\n'));

    console.log(chalk.cyan('4. Deploy Edge Functions:'));
    console.log(chalk.gray(`   supabase functions deploy retell-create-call`));
    console.log(chalk.gray(`   supabase functions deploy retell-text-chat`));
    console.log(chalk.gray(`   supabase functions deploy widget-config`));
    console.log(chalk.gray(`   supabase functions deploy widget-embed`));
    console.log(chalk.gray(`   supabase functions deploy wordpress-plugin\n`));

    console.log(chalk.cyan('5. Set Edge Function secret:'));
    console.log(chalk.gray(`   supabase secrets set RETELL_API_KEY=${retellApiKey}\n`));
    console.log(chalk.gray('   (Agent IDs will be set per-widget in the dashboard)\n'));

    console.log(chalk.cyan('6. Start development server:'));
    console.log(chalk.gray('   npm run dev\n'));

    console.log(chalk.cyan('7. Sign up and test:'));
    console.log(chalk.gray('   Visit http://localhost:8080/auth and create an account\n'));

    console.log(chalk.green.bold('✓ Setup complete!\n'));
    console.log(chalk.gray('For detailed instructions, see SUPABASE_SETUP_GUIDE.md\n'));

  } catch (error) {
    console.error(chalk.red.bold('\n✗ Error:'), chalk.red(error.message), '\n');
    process.exit(1);
  } finally {
    rl.close();
  }
}

await main();
