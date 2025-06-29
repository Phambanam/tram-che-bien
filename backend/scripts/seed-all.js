const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting comprehensive database seeding...\n');

const scripts = [
  { name: 'Core Database', file: '../run-seed.js' },
  { name: 'Data Library', file: 'seed-data-library.js' },
  { name: 'Generate Dishes', file: 'generate-dishes.js' },
  { name: 'Tofu Dishes', file: 'add-tofu-dishes.js' },
  { name: 'Menu Data', file: 'seed-menu-data.js' },
  { name: 'Supply Data', file: 'seed-supplies.js' },
  { name: 'Demo Tofu Data', file: '../demo-tofu-data.js' }
];

async function runScript(scriptName, scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`\n📋 Running ${scriptName}...`);
    console.log('─'.repeat(50));
    
    const child = spawn('node', [scriptPath], {
      cwd: path.dirname(scriptPath),
      stdio: 'inherit'
    });
    
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${scriptName} failed with code ${code}`));
      } else {
        console.log(`✅ ${scriptName} completed successfully`);
        resolve();
      }
    });
    
    child.on('error', (err) => {
      reject(err);
    });
  });
}

async function seedAll() {
  try {
    for (const script of scripts) {
      const scriptPath = path.join(__dirname, script.file);
      await runScript(script.name, scriptPath);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 All database seeding completed successfully!');
    console.log('='.repeat(50));
    
    console.log('\n📊 Database is now populated with:');
    console.log('  ✓ Users and authentication');
    console.log('  ✓ Units and personnel data');
    console.log('  ✓ Categories and products');
    console.log('  ✓ 1000+ dishes including tofu dishes');
    console.log('  ✓ 8 weeks of menu data');
    console.log('  ✓ Supply records with tofu');
    console.log('  ✓ Processing station data');
    console.log('  ✓ LTTP inventory data');
    
    console.log('\n🔐 Login credentials:');
    console.log('  Admin: admin@military.gov.vn / admin123');
    console.log('  Manager: manager@military.gov.vn / admin123');
    console.log('  User: user@military.gov.vn / admin123');
    
  } catch (error) {
    console.error('\n❌ Error during seeding:', error.message);
    process.exit(1);
  }
}

// Run the seeding
seedAll(); 