/**
 * Final verification script to confirm GraphQL fix
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 Final GraphQL Fix Verification');
console.log('================================');

function runCommand(command, cwd) {
  try {
    return execSync(command, { cwd, encoding: 'utf-8' });
  } catch (error) {
    console.error(`❌ Command failed: ${command}`, error.message);
    return null;
  }
}

try {
  // Check frontend
  console.log('\n=== Frontend GraphQL Status ===');
  const frontendPath = path.join(__dirname, 'Website', 'Frontend');
  const frontendOutput = runCommand('npm list graphql', frontendPath);
  console.log(frontendOutput);
  
  // Check backend
  console.log('\n=== Backend GraphQL Status ===');
  const backendPath = path.join(__dirname, 'Website', 'Backend');
  const backendOutput = runCommand('npm list graphql', backendPath);
  console.log(backendOutput);
  
  // Check for duplicate graphql directories
  console.log('\n=== Checking for Duplicate GraphQL Directories ===');
  
  const frontendDuplicates = runCommand('Get-ChildItem -Recurse -Directory -Force | Where-Object { $_.Name -eq "graphql" -and $_.FullName -like "*node_modules*" } | Measure-Object | ForEach-Object { $_.Count }', frontendPath);
  console.log(`Frontend duplicate graphql directories: ${frontendDuplicates ? frontendDuplicates.trim() : 'unknown'}`);
  
  const backendDuplicates = runCommand('Get-ChildItem -Recurse -Directory -Force | Where-Object { $_.Name -eq "graphql" -and $_.FullName -like "*node_modules*" } | Measure-Object | ForEach-Object { $_.Count }', backendPath);
  console.log(`Backend duplicate graphql directories: ${backendDuplicates ? backendDuplicates.trim() : 'unknown'}`);
  
  console.log('\n✅ VERIFICATION COMPLETE');
  console.log('If all graphql entries show as "deduped" or "overridden", the fix is successful.');
  console.log('Note: Internal graphql directories within packages (like @apollo/client) are normal.');
  
} catch (error) {
  console.error('❌ Error during verification:', error.message);
  process.exit(1);
}