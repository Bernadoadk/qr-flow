#!/usr/bin/env node

/**
 * Script to toggle fidelity feature access
 * 
 * Usage:
 * - node scripts/toggleFidelityAccess.js on   -> Enable fidelity features
 * - node scripts/toggleFidelityAccess.js off  -> Disable fidelity features (Coming Soon mode)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FEATURES_FILE = path.join(__dirname, '..', 'app', 'config', 'features.ts');

function updateFeatureFlag(enabled) {
  try {
    // Read the current features file
    let content = fs.readFileSync(FEATURES_FILE, 'utf8');
    
    // Update the FIDELITY_ENABLED value
    const newContent = content.replace(
      /FIDELITY_ENABLED:\s*(true|false)/,
      `FIDELITY_ENABLED: ${enabled}`
    );
    
    // Write back to file
    fs.writeFileSync(FEATURES_FILE, newContent, 'utf8');
    
    console.log(`✅ Fidelity features ${enabled ? 'enabled' : 'disabled'} successfully!`);
    console.log(`   FIDELITY_ENABLED is now set to: ${enabled}`);
    
    if (!enabled) {
      console.log('   🎉 Fidelity features are now in "Coming Soon" mode');
    } else {
      console.log('   🚀 Fidelity features are now fully accessible');
    }
    
  } catch (error) {
    console.error('❌ Error updating feature flag:', error.message);
    process.exit(1);
  }
}

function main() {
  const command = process.argv[2];
  
  if (!command) {
    console.log('Usage: node scripts/toggleFidelityAccess.js [on|off]');
    console.log('');
    console.log('Commands:');
    console.log('  on  - Enable fidelity features');
    console.log('  off - Disable fidelity features (Coming Soon mode)');
    process.exit(1);
  }
  
  if (command === 'on') {
    updateFeatureFlag(true);
  } else if (command === 'off') {
    updateFeatureFlag(false);
  } else {
    console.error('❌ Invalid command. Use "on" or "off"');
    console.log('');
    console.log('Usage: node scripts/toggleFidelityAccess.js [on|off]');
    process.exit(1);
  }
}

main();
