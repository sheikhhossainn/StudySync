#!/usr/bin/env node
/**
 * Update StudySync frontend configuration for production deployment
 * Run this script after deploying your backend to update the API URL
 * 
 * Usage: node update-production-config.js YOUR_BACKEND_URL
 * Example: node update-production-config.js https://studysync-backend-abc123.vercel.app
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_CONFIG_PATH = path.join(__dirname, 'frontend', 'assets', 'js', 'config.js');

function updateProductionURL(backendURL) {
    if (!backendURL) {
        console.error('❌ Error: Please provide the backend URL');
        console.log('Usage: node update-production-config.js YOUR_BACKEND_URL');
        console.log('Example: node update-production-config.js https://studysync-backend-abc123.vercel.app');
        process.exit(1);
    }

    try {
        // Read the current config file
        let configContent = fs.readFileSync(FRONTEND_CONFIG_PATH, 'utf8');

        // Update the production URL
        const updatedContent = configContent.replace(
            /return 'https:\/\/studysync-backend-production\.vercel\.app';/,
            `return '${backendURL}';`
        );

        // Write the updated content back
        fs.writeFileSync(FRONTEND_CONFIG_PATH, updatedContent, 'utf8');

        console.log('✅ Successfully updated frontend configuration!');
        console.log(`📍 Production API URL set to: ${backendURL}`);
        console.log('\n🚀 Next steps:');
        console.log('1. Commit and push the changes');
        console.log('2. Deploy your frontend');
        console.log('3. Test the application');

    } catch (error) {
        console.error('❌ Error updating configuration:', error.message);
        process.exit(1);
    }
}

// Get the backend URL from command line arguments
const backendURL = process.argv[2];
updateProductionURL(backendURL);
