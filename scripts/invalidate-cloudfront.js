#!/usr/bin/env node

/**
 * CloudFront cache invalidation script
 */

import { config } from 'dotenv';
import { execSync } from 'child_process';

// Load environment variables from .env file
config();

const AWS_CLOUDFRONT_DISTRIBUTION_ID = process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID;

if (!AWS_CLOUDFRONT_DISTRIBUTION_ID) {
  console.error('❌ Error: AWS_CLOUDFRONT_DISTRIBUTION_ID environment variable is required');
  console.log('Please set AWS_CLOUDFRONT_DISTRIBUTION_ID in your .env file');
  process.exit(1);
}

console.log('🔄 Invalidating CloudFront cache...');
console.log(`📡 Distribution ID: ${AWS_CLOUDFRONT_DISTRIBUTION_ID}`);

try {
  const command = `aws cloudfront create-invalidation --distribution-id ${AWS_CLOUDFRONT_DISTRIBUTION_ID} --paths '/*'`;
  execSync(command, { stdio: 'inherit' });
  console.log('✅ CloudFront cache invalidation completed!');
} catch (error) {
  console.error('❌ CloudFront invalidation failed:', error.message);
  process.exit(1);
}
