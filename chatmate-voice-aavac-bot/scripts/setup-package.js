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

// Password validation
const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) errors.push('at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('an uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('a lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('a number');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('a special character');
  return errors;
};

async function main() {
  console.log(chalk.blue.bold('\n🚀 Self-Hosted Package Setup\n'));
  console.log(chalk.gray('This script will initialize your Retell Voice Agent Widget application.\n'));

  try {
    // Step 1: Collect Supabase credentials
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
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;
      console.log(chalk.green('✓ Connection successful!\n'));
    } catch (error) {
      throw new Error(`Failed to connect to Supabase: ${error.message}`);
    }

    // Step 3: Collect Retell API Key
    console.log(chalk.bold('Step 3: Retell AI API Key\n'));
    console.log(chalk.gray('Get this from your Retell AI dashboard (https://retell.ai/dashboard)\n'));

    const retellApiKey = await question(chalk.cyan('Retell API Key: '));
    if (!retellApiKey) {
      throw new Error('Retell API Key is required');
    }

    // Step 4: Collect Super Admin credentials
    console.log(chalk.bold('\n\nStep 4: Super Admin Account Setup\n'));
    console.log(chalk.gray('Create credentials for your super admin account (you will use these to log in first time)\n'));

    const adminEmail = await question(chalk.cyan('Super Admin Email: '));
    if (!adminEmail.includes('@')) {
      throw new Error('Please enter a valid email address');
    }

    let adminPassword = '';
    let passwordValid = false;
    while (!passwordValid) {
      adminPassword = await question(chalk.cyan('Super Admin Password: '));
      const errors = validatePassword(adminPassword);
      if (errors.length > 0) {
        console.log(chalk.yellow(`✗ Password must contain: ${errors.join(', ')}\n`));
      } else {
        passwordValid = true;
      }
    }

    const adminPasswordConfirm = await question(chalk.cyan('Confirm Password: '));
    if (adminPassword !== adminPasswordConfirm) {
      throw new Error('Passwords do not match');
    }

    const adminName = await question(chalk.cyan('Super Admin Full Name: '));

    // Step 5: Run migrations
    console.log(chalk.bold('\n\nStep 5: Database Setup\n'));
    console.log(chalk.gray('Note: Make sure you have run migrations before this script completes.\n'));
    console.log(chalk.gray('Instructions:\n'));
    console.log(chalk.cyan('  1. Install Supabase CLI if not already installed:'));
    console.log(chalk.gray('     npm install -g supabase\n'));
    console.log(chalk.cyan('  2. Link to your project:'));
    const projectRef = supabaseUrl.split('//')[1].split('.')[0];
    console.log(chalk.gray(`     supabase link --project-ref ${projectRef}\n`));
    console.log(chalk.cyan('  3. Push database migrations:'));
    console.log(chalk.gray('     supabase db push\n'));

    const migrationsReady = await question(chalk.cyan('Have you completed the database migrations? (yes/no): '));
    if (migrationsReady.toLowerCase() !== 'yes' && migrationsReady.toLowerCase() !== 'y') {
      console.log(chalk.yellow('\n⚠ Please run the database migrations and run this script again.\n'));
      rl.close();
      process.exit(1);
    }

    // Step 6: Create super admin user
    console.log(chalk.bold('\n\nStep 6: Creating Super Admin User...\n'));

    try {
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          full_name: adminName,
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authUser || !authUser.user) {
        throw new Error('Failed to create user');
      }

      console.log(chalk.green(`✓ Super admin user created: ${adminEmail}\n`));

      // Assign super_admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authUser.user.id,
          role: 'super_admin',
        });

      if (roleError && !roleError.message.includes('duplicate')) {
        console.log(chalk.yellow(`⚠ Could not assign super_admin role: ${roleError.message}`));
      } else {
        console.log(chalk.green('✓ Super admin role assigned\n'));
      }

      // Create main team
      try {
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .insert({
            owner_id: authUser.user.id,
            name: 'Main Team',
          })
          .select()
          .single();

        if (teamError) {
          console.log(chalk.yellow(`⚠ Could not create main team: ${teamError.message}`));
        } else {
          console.log(chalk.green('✓ Main team created\n'));
        }
      } catch (err) {
        console.log(chalk.yellow(`⚠ Could not create main team: ${err.message}`));
      }
    } catch (error) {
      throw new Error(`Failed to create super admin: ${error.message}`);
    }

    // Step 7: Deploy edge functions
    console.log(chalk.bold('Step 7: Deploy Edge Functions\n'));
    console.log(chalk.gray('Deploy your edge functions using Supabase CLI:\n'));
    console.log(chalk.cyan('  supabase functions deploy retell-create-call'));
    console.log(chalk.cyan('  supabase functions deploy retell-text-chat'));
    console.log(chalk.cyan('  supabase functions deploy widget-config'));
    console.log(chalk.cyan('  supabase functions deploy widget-embed'));
    console.log(chalk.cyan('  supabase functions deploy wordpress-plugin\n'));
    console.log(chalk.cyan('  supabase secrets set RETELL_API_KEY=' + retellApiKey + '\n'));

    const functionsDeployed = await question(chalk.cyan('Have you deployed all edge functions and set secrets? (yes/no): '));
    if (functionsDeployed.toLowerCase() !== 'yes' && functionsDeployed.toLowerCase() !== 'y') {
      console.log(chalk.yellow('\n⚠ Please deploy edge functions and set secrets, then run this script again.\n'));
      rl.close();
      process.exit(1);
    }

    // Step 8: Create .env.local
    console.log(chalk.bold('\nStep 8: Creating .env.local...\n'));

    const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_PUBLISHABLE_KEY=${anonKey}
VITE_SUPABASE_PROJECT_ID=${projectRef}

# Retell AI Configuration
VITE_RETELL_API_KEY=${retellApiKey}

# Note: Agent IDs are configured per-widget in the dashboard
# Each widget can have different voice_agent_id and chat_agent_id
`;

    const envPath = path.join(path.dirname(__dirname), '.env.local');
    fs.writeFileSync(envPath, envContent);
    console.log(chalk.green(`✓ Created .env.local\n`));

    // Step 9: Success summary
    console.log(chalk.green.bold('\n✓ Setup Complete!\n'));
    console.log(chalk.blue('Next Steps:\n'));
    console.log(chalk.cyan('  1. Start development server:'));
    console.log(chalk.gray(`     npm run dev\n`));
    console.log(chalk.cyan('  2. Open your browser:'));
    console.log(chalk.gray(`     http://localhost:8080/auth\n`));
    console.log(chalk.cyan('  3. Sign in with:'));
    console.log(chalk.gray(`     Email: ${adminEmail}`));
    console.log(chalk.gray(`     Password: (the password you entered)\n`));
    console.log(chalk.cyan('  4. Go to Admin Panel:'));
    console.log(chalk.gray(`     http://localhost:8080/admin/panel\n`));
    console.log(chalk.cyan('  5. Invite team members and manage widgets!\n'));
    console.log(chalk.gray('For deployment to Vercel, see DEPLOYMENT.md\n'));

    rl.close();
  } catch (error) {
    console.error(chalk.red.bold('\n✗ Error:'), chalk.red(error.message), '\n');
    rl.close();
    process.exit(1);
  }
}

await main();
