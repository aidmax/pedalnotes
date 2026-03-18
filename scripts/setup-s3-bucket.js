#!/usr/bin/env node

/**
 * AWS S3 Bucket Setup Script
 * This script creates and configures an S3 bucket for static website hosting
 */

import { execSync } from 'child_process';
import { config } from 'dotenv';

// Load environment variables
config();

const BUCKET_NAME = process.env.AWS_BUCKET;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

if (!BUCKET_NAME) {
  console.error('❌ Error: AWS_BUCKET environment variable is required');
  console.log('Please set AWS_BUCKET in your .env file');
  process.exit(1);
}

console.log(`🚀 Setting up S3 bucket: ${BUCKET_NAME} in region: ${AWS_REGION}`);

try {
  // 1. Create the S3 bucket
  console.log('\n📦 Creating S3 bucket...');
  try {
    if (AWS_REGION === 'us-east-1') {
      execSync(`aws s3 mb s3://${BUCKET_NAME}`, { stdio: 'inherit' });
    } else {
      execSync(`aws s3 mb s3://${BUCKET_NAME} --region ${AWS_REGION}`, { stdio: 'inherit' });
    }
    console.log('✅ Bucket created successfully');
  } catch (error) {
    if (error.message.includes('BucketAlreadyExists')) {
      console.log('ℹ️  Bucket already exists, continuing...');
    } else {
      throw error;
    }
  }

  // 2. Enable public read access
  console.log('\n🔓 Configuring bucket for public read access...');
  
  // Remove public access block
  execSync(`aws s3api put-public-access-block --bucket ${BUCKET_NAME} --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"`, { stdio: 'inherit' });
  
  // Create bucket policy for public read access
  const bucketPolicy = {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "PublicReadGetObject",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": `arn:aws:s3:::${BUCKET_NAME}/*`
      }
    ]
  };

  // Write policy to temporary file and apply it
  execSync(`echo '${JSON.stringify(bucketPolicy)}' | aws s3api put-bucket-policy --bucket ${BUCKET_NAME} --policy file:///dev/stdin`, { stdio: 'inherit' });
  console.log('✅ Public read access configured');

  // 3. Configure static website hosting
  console.log('\n🌐 Configuring static website hosting...');
  execSync(`aws s3 website s3://${BUCKET_NAME} --index-document index.html --error-document index.html`, { stdio: 'inherit' });
  console.log('✅ Static website hosting enabled');

  // 4. Display website URL
  console.log('\n🎉 Setup complete!');
  console.log(`📍 Website URL: http://${BUCKET_NAME}.s3-website-${AWS_REGION}.amazonaws.com`);
  console.log('\n📋 Next steps:');
  console.log('1. Run: npm run build');
  console.log('2. Run: npm run deploy');
  console.log('3. (Optional) Set up CloudFront for HTTPS and better performance');

} catch (error) {
  console.error('❌ Error setting up S3 bucket:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Make sure AWS CLI is installed and configured');
  console.log('2. Check your AWS credentials have S3 permissions');
  console.log('3. Verify the bucket name is unique globally');
  process.exit(1);
}
