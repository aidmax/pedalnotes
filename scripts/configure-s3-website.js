#!/usr/bin/env node

/**
 * Configure S3 bucket for static website hosting
 */

import { config } from 'dotenv';
import { execSync } from 'child_process';

// Load environment variables from .env file
config();

const AWS_BUCKET = process.env.AWS_BUCKET;

if (!AWS_BUCKET) {
  console.error('❌ Error: AWS_BUCKET environment variable is required');
  console.log('Please set AWS_BUCKET in your .env file');
  process.exit(1);
}

console.log('🌐 Configuring S3 bucket for static website hosting...');
console.log(`📦 Bucket: ${AWS_BUCKET}`);

try {
  const command = `aws s3 website s3://${AWS_BUCKET} --index-document index.html --error-document index.html`;
  execSync(command, { stdio: 'inherit' });
  console.log('✅ Static website hosting configured successfully!');
  
  const region = process.env.AWS_REGION || 'us-east-1';
  console.log(`🌐 Website URL: http://${AWS_BUCKET}.s3-website-${region}.amazonaws.com`);
} catch (error) {
  console.error('❌ Configuration failed:', error.message);
  process.exit(1);
}
