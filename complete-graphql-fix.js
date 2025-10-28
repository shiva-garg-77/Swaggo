/**
 * Complete GraphQL Fix Script
 * This script performs a complete reset and fix for GraphQL module duplication issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Starting complete GraphQL fix...');

// Function to run commands safely
function runCommand(command, cwd) {
  try {
    console.log(`\nExecuting: ${command}`);
    execSync(command, { cwd, stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`, error.message);
    return false;
  }
}

// Function to safely remove directories with retries
function removeDir(dirPath) {
  for (let i = 0; i < 3; i++) {
    try {
      if (fs.existsSync(dirPath)) {
        console.log(`🗑️ Removing: ${dirPath} (attempt ${i + 1})`);
        fs.rmSync(dirPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
        if (!fs.existsSync(dirPath)) {
          console.log(`✅ Successfully removed: ${dirPath}`);
          return;
        }
      } else {
        console.log(`ℹ️ Directory does not exist: ${dirPath}`);
        return;
      }
    } catch (error) {
      console.warn(`⚠️ Failed to remove (attempt ${i + 1}): ${dirPath}`, error.message);
      if (i < 2) {
        // Wait before retry
        execSync('timeout /t 2 /nobreak', { stdio: 'ignore' });
      }
    }
  }
  console.error(`❌ Failed to remove after 3 attempts: ${dirPath}`);
}

// Function to update package.json with proper overrides
function updatePackageJson(packageJsonPath) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Ensure proper overrides for GraphQL
  packageJson.overrides = packageJson.overrides || {};
  packageJson.overrides.graphql = "^16.11.0";
  
  // For Apollo dependencies, ensure they use the same GraphQL version
  if (packageJson.dependencies && packageJson.dependencies["@apollo/client"]) {
    packageJson.overrides["@apollo/client"] = packageJson.overrides["@apollo/client"] || {};
    packageJson.overrides["@apollo/client"].graphql = "^16.11.0";
  }
  
  if (packageJson.dependencies && packageJson.dependencies["@apollo/server"]) {
    packageJson.overrides["@apollo/server"] = packageJson.overrides["@apollo/server"] || {};
    packageJson.overrides["@apollo/server"].graphql = "^16.11.0";
  }
  
  // Ensure graphql is in dependencies
  if (packageJson.dependencies) {
    packageJson.dependencies.graphql = "^16.11.0";
  }
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Updated package.json with proper overrides');
}

try {
  // Fix Frontend
  console.log('\n=== FIXING FRONTEND ===');
  const frontendPath = path.join(__dirname, 'Website', 'Frontend');
  
  // Update package.json
  updatePackageJson(path.join(frontendPath, 'package.json'));
  
  // Clean cache and node_modules
  console.log('\n--- Cleaning Frontend ---');
  runCommand('npm cache clean --force', frontendPath);
  removeDir(path.join(frontendPath, 'node_modules'));
  if (fs.existsSync(path.join(frontendPath, 'package-lock.json'))) {
    fs.unlinkSync(path.join(frontendPath, 'package-lock.json'));
  }
  
  // Fix Backend
  console.log('\n=== FIXING BACKEND ===');
  const backendPath = path.join(__dirname, 'Website', 'Backend');
  
  // Update package.json
  updatePackageJson(path.join(backendPath, 'package.json'));
  
  // Clean cache and node_modules
  console.log('\n--- Cleaning Backend ---');
  runCommand('npm cache clean --force', backendPath);
  removeDir(path.join(backendPath, 'node_modules'));
  if (fs.existsSync(path.join(backendPath, 'package-lock.json'))) {
    fs.unlinkSync(path.join(backendPath, 'package-lock.json'));
  }
  
  // Reinstall dependencies for both
  console.log('\n=== REINSTALLING DEPENDENCIES ===');
  console.log('\n--- Installing Frontend Dependencies ---');
  runCommand('npm install --legacy-peer-deps', frontendPath);
  
  console.log('\n--- Installing Backend Dependencies ---');
  runCommand('npm install --legacy-peer-deps', backendPath);
  
  // Verify installations
  console.log('\n=== VERIFYING INSTALLATIONS ===');
  console.log('\n--- Frontend GraphQL Status ---');
  runCommand('npm list graphql', frontendPath);
  
  console.log('\n--- Backend GraphQL Status ---');
  runCommand('npm list graphql', backendPath);
  
  console.log('\n✅ Complete GraphQL fix finished!');
  console.log('Please restart your development servers.');
  
} catch (error) {
  console.error('\n❌ Complete GraphQL fix failed:', error.message);
  process.exit(1);
}