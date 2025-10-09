#!/usr/bin/env node

/**
 * GREEN BUTTON TEST RUNNER
 * ========================
 * Automated test execution script for all green button tests
 * with detailed reporting and CI/CD integration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    🟢 GREEN BUTTON AUTOMATED TEST RUNNER 🟢                ║
║                                                              ║
║    TradeAI Platform - Comprehensive Button Testing          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);

const testConfig = {
  testMatch: [
    'src/__tests__/buttons/**/*.test.js',
    'src/__tests__/buttons/**/*.test.jsx'
  ],
  coverage: true,
  verbose: true,
  ci: process.env.CI === 'true',
  maxWorkers: process.env.CI ? 2 : '50%'
};

console.log('📋 Test Configuration:');
console.log('  - Test Pattern:', testConfig.testMatch.join(', '));
console.log('  - Coverage:', testConfig.coverage ? 'Enabled' : 'Disabled');
console.log('  - Verbose:', testConfig.verbose ? 'Yes' : 'No');
console.log('  - CI Mode:', testConfig.ci ? 'Yes' : 'No');
console.log('  - Max Workers:', testConfig.maxWorkers);
console.log('');

console.log('🔍 Scanning for green button tests...');

const testDir = path.join(__dirname, 'src', '__tests__', 'buttons');
if (!fs.existsSync(testDir)) {
  console.error('❌ Test directory not found:', testDir);
  process.exit(1);
}

const testFiles = fs.readdirSync(testDir).filter(file => 
  file.endsWith('.test.js') || file.endsWith('.test.jsx')
);

console.log(`✅ Found ${testFiles.length} test file(s):`);
testFiles.forEach((file, index) => {
  console.log(`   ${index + 1}. ${file}`);
});
console.log('');

// Build Jest command
const jestArgs = [
  '--testMatch="<rootDir>/src/__tests__/buttons/**/*.test.js"',
  '--verbose',
  '--colors',
  '--runInBand', // Run serially for detailed output
  '--detectOpenHandles',
  '--forceExit'
];

if (testConfig.coverage) {
  jestArgs.push('--coverage');
  jestArgs.push('--coverageDirectory=coverage-green-buttons');
  jestArgs.push('--collectCoverageFrom=src/components/**/*.{js,jsx}');
}

if (testConfig.ci) {
  jestArgs.push('--ci');
  jestArgs.push('--reporters=default');
  jestArgs.push('--reporters=jest-junit');
}

const command = `npx jest ${jestArgs.join(' ')}`;

console.log('🚀 Executing test command:');
console.log(`   ${command}`);
console.log('');
console.log(''.padEnd(70, '='));
console.log('');

const startTime = Date.now();

try {
  execSync(command, {
    stdio: 'inherit',
    cwd: __dirname,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      CI: testConfig.ci ? 'true' : 'false'
    }
  });
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('');
  console.log(''.padEnd(70, '='));
  console.log('');
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    ✅ ALL GREEN BUTTON TESTS PASSED! ✅                     ║
║                                                              ║
║    Duration: ${duration}s                                        
║    Status: SUCCESS                                           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
  
  if (testConfig.coverage) {
    console.log('📊 Coverage report generated:');
    console.log(`   file://${path.join(__dirname, 'coverage-green-buttons', 'lcov-report', 'index.html')}`);
    console.log('');
  }
  
  process.exit(0);
  
} catch (error) {
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('');
  console.log(''.padEnd(70, '='));
  console.log('');
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    ❌ SOME TESTS FAILED ❌                                  ║
║                                                              ║
║    Duration: ${duration}s                                        
║    Status: FAILURE                                           ║
║                                                              ║
║    Please review the output above for details.              ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
  
  process.exit(1);
}
