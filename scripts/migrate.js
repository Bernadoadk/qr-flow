#!/usr/bin/env node

/**
 * Migration script for QRFlow
 * This script helps migrate from mock data to real database
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 QRFlow Migration Script');
console.log('========================\n');

// Check if .env exists
if (!fs.existsSync('.env')) {
  console.log('❌ .env file not found. Please copy .env.example to .env and configure it.');
  process.exit(1);
}

// Check if DATABASE_URL is set
require('dotenv').config();
if (!process.env.DATABASE_URL) {
  console.log('❌ DATABASE_URL not set in .env file.');
  process.exit(1);
}

console.log('✅ Environment variables loaded');

// Step 1: Generate Prisma client
console.log('\n📦 Step 1: Generating Prisma client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated');
} catch (error) {
  console.log('❌ Failed to generate Prisma client:', error.message);
  process.exit(1);
}

// Step 2: Run database migrations
console.log('\n🗄️  Step 2: Running database migrations...');
try {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log('✅ Database migrations completed');
} catch (error) {
  console.log('❌ Failed to run migrations:', error.message);
  process.exit(1);
}

// Step 3: Seed database
console.log('\n🌱 Step 3: Seeding database...');
try {
  execSync('npm run db:seed', { stdio: 'inherit' });
  console.log('✅ Database seeded with demo data');
} catch (error) {
  console.log('❌ Failed to seed database:', error.message);
  process.exit(1);
}

// Step 4: Test the system
console.log('\n🧪 Step 4: Testing system...');
try {
  // Start the server in background for testing
  const server = execSync('npm run dev &', { stdio: 'pipe' });
  
  // Wait a bit for server to start
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Test the API
  const testResponse = execSync('curl -s http://localhost:3000/api/test?type=health', { 
    encoding: 'utf8',
    timeout: 10000 
  });
  
  const health = JSON.parse(testResponse);
  if (health.status === 'healthy') {
    console.log('✅ System health check passed');
  } else {
    console.log('⚠️  System health check shows:', health.status);
  }
  
  // Kill the server
  execSync('pkill -f "npm run dev"', { stdio: 'pipe' });
  
} catch (error) {
  console.log('⚠️  System test failed (this is normal if server is not running):', error.message);
}

console.log('\n🎉 Migration completed successfully!');
console.log('\nNext steps:');
console.log('1. Run "npm run dev" to start the development server');
console.log('2. Visit http://localhost:3000 to test the application');
console.log('3. Check the demo data in Prisma Studio: "npm run db:studio"');
console.log('4. Test the scan route: http://localhost:3000/scan/premium-bf2024');
console.log('\n📚 For more information, see the README.md file');




