#!/usr/bin/env node

/**
 * SwagGo Frontend Cleanup Script
 * Removes duplicate components and unused files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '..');

const CLEANUP_SUMMARY = {
    filesRemoved: 0,
    filesBackedUp: 0,
    bytesFreed: 0,
    errors: []
};

console.log('🧹 Starting Frontend Cleanup...\n');

// Files to be removed or consolidated
const FRONTEND_CLEANUP_TARGETS = {
    // Multiple duplicate Chat components - keep ComprehensiveChatInterface.js
    duplicateChatComponents: [
        'Components/Chat/ModernChatInterface.js', // 49KB duplicate
        'Components/Chat/UltraAdvancedChatInterface.js', // 27KB duplicate
        'Components/Chat/AdvancedChatInterface.js', // 18KB duplicate (in AIBot folder)
        'Components/Chat/ModernChatList.js', // Keep ChatList.js instead
        'Components/Chat/ModernChatSidebar.js', // Keep ChatSidebar.js instead
    ],
    
    // Multiple duplicate EditProfile components - keep one best version
    duplicateEditProfileComponents: [
        'Components/Settings/sections/ImprovedEditProfile.js', // 33KB
        'Components/Settings/sections/EnhancedEditProfile.js', // 33KB  
        'Components/Settings/sections/FullFeaturedEditProfile.js', // 48KB
        // Keep MacOSEditProfile.js (49KB - largest, most feature-complete)
    ],
    
    // Debug and test files
    debugTestFiles: [
        'pages/chat-debug.js',
        'pages/chat-test.js', 
        'tests/ChatSystemTest.js',
        'Components/Debug/SocketDebug.js',
        'Components/Debug/WebRTCDebug.js',
    ],
    
    // Build artifacts and generated files
    buildArtifacts: [
        '.next',
        'out',
        'build'
    ],
    
    // Unused service files (duplicates)
    duplicateServices: [
        // Keep the main service files, remove duplicates if any
    ]
};

// Function to safely remove files
const safeRemove = async (relativePath) => {
    const fullPath = path.join(frontendDir, relativePath);
    
    try {
        if (!fs.existsSync(fullPath)) {
            console.log(`⚠️  Path not found: ${relativePath}`);
            return false;
        }
        
        const stat = fs.statSync(fullPath);
        CLEANUP_SUMMARY.bytesFreed += stat.size;
        
        if (stat.isDirectory()) {
            console.log(`📁 Removing directory: ${relativePath}`);
            fs.rmSync(fullPath, { recursive: true, force: true });
        } else {
            console.log(`📄 Removing file: ${relativePath} (${(stat.size / 1024).toFixed(1)}KB)`);
            fs.unlinkSync(fullPath);
        }
        
        CLEANUP_SUMMARY.filesRemoved++;
        return true;
    } catch (error) {
        console.error(`❌ Error removing ${relativePath}:`, error.message);
        CLEANUP_SUMMARY.errors.push({ path: relativePath, error: error.message });
        return false;
    }
};

// Function to backup important files before removal
const backupFile = async (relativePath) => {
    try {
        const fullPath = path.join(frontendDir, relativePath);
        const backupPath = fullPath + '.backup';
        
        if (fs.existsSync(fullPath) && !fs.existsSync(backupPath)) {
            fs.copyFileSync(fullPath, backupPath);
            console.log(`💾 Backed up: ${relativePath}`);
            CLEANUP_SUMMARY.filesBackedUp++;
            return true;
        }
    } catch (error) {
        console.error(`❌ Backup failed for ${relativePath}:`, error.message);
        CLEANUP_SUMMARY.errors.push({ path: relativePath, error: error.message });
    }
    return false;
};

// Function to analyze component usage
const analyzeComponentUsage = () => {
    console.log('🔍 Analyzing component usage...\n');
    
    // Find all JS/JSX files
    const findFiles = (dir, extensions = ['.js', '.jsx', '.ts', '.tsx']) => {
        const files = [];
        
        const scan = (currentDir) => {
            try {
                const items = fs.readdirSync(currentDir);
                
                items.forEach(item => {
                    const fullPath = path.join(currentDir, item);
                    const relativePath = path.relative(frontendDir, fullPath);
                    
                    // Skip node_modules, .next, out, build
                    if (['node_modules', '.next', 'out', 'build', '.git'].includes(item)) {
                        return;
                    }
                    
                    if (fs.statSync(fullPath).isDirectory()) {
                        scan(fullPath);
                    } else if (extensions.includes(path.extname(item))) {
                        files.push({
                            path: relativePath,
                            fullPath: fullPath,
                            size: fs.statSync(fullPath).size,
                            lines: fs.readFileSync(fullPath, 'utf8').split('\n').length
                        });
                    }
                });
            } catch (error) {
                console.error(`Error scanning ${currentDir}:`, error.message);
            }
        };
        
        scan(dir);
        return files;
    };
    
    const allFiles = findFiles(frontendDir);
    
    // Find largest files
    const largeFiles = allFiles
        .filter(f => f.size > 30000) // Files larger than 30KB
        .sort((a, b) => b.size - a.size)
        .slice(0, 10);
    
    console.log('📊 Largest Frontend Files:');
    largeFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file.path} - ${(file.size / 1024).toFixed(1)}KB (${file.lines} lines)`);
    });
    
    return { allFiles, largeFiles };
};

// Main cleanup function
const performFrontendCleanup = async () => {
    console.log('🔍 Phase 1: Analyzing frontend structure...\n');
    
    const { allFiles, largeFiles } = analyzeComponentUsage();
    
    console.log(`\nFound ${allFiles.length} frontend source files`);
    console.log(`Found ${largeFiles.length} files larger than 30KB\n`);
    
    console.log('🗑️  Phase 2: Removing duplicate chat components...\n');
    
    // Remove duplicate chat components
    for (const chatFile of FRONTEND_CLEANUP_TARGETS.duplicateChatComponents) {
        await safeRemove(chatFile);
    }
    
    console.log('\n🗑️  Phase 3: Removing duplicate EditProfile components...\n');
    
    // Backup the best EditProfile component first
    await backupFile('Components/Settings/sections/MacOSEditProfile.js');
    
    // Remove duplicate EditProfile components
    for (const editFile of FRONTEND_CLEANUP_TARGETS.duplicateEditProfileComponents) {
        await safeRemove(editFile);
    }
    
    console.log('\n🗑️  Phase 4: Removing debug and test files...\n');
    
    // Remove debug/test files
    for (const debugFile of FRONTEND_CLEANUP_TARGETS.debugTestFiles) {
        await safeRemove(debugFile);
    }
    
    console.log('\n🗑️  Phase 5: Cleaning build artifacts...\n');
    
    // Remove build artifacts
    for (const buildDir of FRONTEND_CLEANUP_TARGETS.buildArtifacts) {
        await safeRemove(buildDir);
    }
    
    console.log('\n📝 Phase 6: Creating consolidated components index...\n');
    
    // Create an index of remaining components for easier imports
    const componentIndex = `// Auto-generated component index
// Main Chat Interface
export { default as ComprehensiveChatInterface } from './Chat/ComprehensiveChatInterface';
export { default as ChatList } from './Chat/ChatList';
export { default as ChatSidebar } from './Chat/ChatSidebar';
export { default as MessageArea } from './Chat/MessageArea';
export { default as AdvancedMessageInput } from './Chat/AdvancedMessageInput';

// Profile Management  
export { default as MacOSEditProfile } from './Settings/sections/MacOSEditProfile';

// Services
export { default as WebRTCService } from './Services/WebRTCService';
export { default as ChatNotificationService } from './Services/ChatNotificationService';
export { default as NotificationService } from '../services/UnifiedNotificationService.js';

// Post Creation
export { default as CreatePostModal } from './Posts/CreatePostModal';

// AI Features
export { default as AIResponseSystem } from './AI/AIResponseSystem';

// Content Display
export { default as ReelComments } from './Reels/ReelComments';
export { default as HomeContent } from './Home/HomeContent';

// Feature Systems
export { default as BookmarksGamesSystem } from './Features/BookmarksGamesSystem';
export { default as NotesRemindersSystem } from './Features/NotesRemindersSystem';
`;

    try {
        const indexPath = path.join(frontendDir, 'Components', 'index.js');
        fs.writeFileSync(indexPath, componentIndex);
        console.log('✅ Created Components/index.js for easier imports');
    } catch (error) {
        console.error('❌ Failed to create component index:', error.message);
    }
};

// Execute cleanup
performFrontendCleanup().then(() => {
    console.log('\n📋 FRONTEND CLEANUP SUMMARY:');
    console.log('===============================');
    console.log(`🗑️  Files removed: ${CLEANUP_SUMMARY.filesRemoved}`);
    console.log(`💾 Files backed up: ${CLEANUP_SUMMARY.filesBackedUp}`);
    console.log(`💾 Space freed: ${(CLEANUP_SUMMARY.bytesFreed / (1024 * 1024)).toFixed(2)}MB`);
    console.log(`❌ Errors: ${CLEANUP_SUMMARY.errors.length}`);
    
    if (CLEANUP_SUMMARY.errors.length > 0) {
        console.log('\n❌ Errors encountered:');
        CLEANUP_SUMMARY.errors.forEach(({ path, error }) => {
            console.log(`   - ${path}: ${error}`);
        });
    }
    
    console.log('\n✅ Frontend cleanup completed!');
    console.log('\n📌 RECOMMENDATIONS:');
    console.log('1. Update imports to use the remaining consolidated components');
    console.log('2. Use Components/index.js for cleaner imports');
    console.log('3. Test the application to ensure all functionality works');
    console.log('4. Review the MacOSEditProfile component - it\'s now your main EditProfile');
    console.log('5. ComprehensiveChatInterface is now your main chat component');
    
}).catch(error => {
    console.error('💥 Frontend cleanup failed:', error);
    process.exit(1);
});