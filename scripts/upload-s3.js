#!/usr/bin/env node

/**
 * Load environment variables and execute AWS S3 sync command
 */

import { config } from 'dotenv';
import { execSync } from 'child_process';

// Load environment variables from .env file
config();

const AWS_BUCKET = process.env.AWS_BUCKET;
const args = process.argv.slice(2);

if (!AWS_BUCKET) {
  console.error('❌ Error: AWS_BUCKET environment variable is required');
  console.log('Please set AWS_BUCKET in your .env file');
  process.exit(1);
}

// Build the command based on arguments
let command;
if (args.includes('--no-cache')) {
  command = `aws s3 sync dist/ s3://${AWS_BUCKET} --delete`;
  console.log('🚀 Uploading to S3 without cache headers...');
} else {
  command = `aws s3 sync dist/ s3://${AWS_BUCKET} --delete --cache-control max-age=31536000,public`;
  console.log('🚀 Uploading to S3 with 1-year cache headers...');
}

console.log(`📦 Bucket: ${AWS_BUCKET}`);
console.log(`🔧 Command: ${command}`);

try {
  execSync(command, { stdio: 'inherit' });
  console.log('✅ Upload completed successfully!');
  
  const region = process.env.AWS_REGION || 'us-east-1';
  console.log(`🌐 Website URL: http://${AWS_BUCKET}.s3-website-${region}.amazonaws.com`);
} catch (error) {
  console.error('❌ Upload failed:', error.message);
  process.exit(1);
}
