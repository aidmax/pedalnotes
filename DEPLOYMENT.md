# AWS S3 Deployment Guide

This guide will help you deploy your workout tracker to AWS S3 as a static website.

## Prerequisites

1. **AWS CLI installed**
   ```bash
   # Install AWS CLI
   curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
   sudo installer -pkg AWSCLIV2.pkg -target /
   ```

2. **AWS Account with S3 permissions**
   - Create an IAM user with S3 full access
   - Get Access Key ID and Secret Access Key

## Setup Steps

### 1. Configure Environment Variables

Copy the example environment file and fill in your AWS details:
```bash
cp .env.example .env
```

Edit `.env` with your AWS credentials:
```env
AWS_REGION=us-east-1
AWS_BUCKET=your-unique-bucket-name
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

### 2. Configure AWS CLI

```bash
aws configure
```
Enter your:
- AWS Access Key ID
- AWS Secret Access Key  
- Default region (e.g., us-east-1)
- Default output format (json)

### 3. Set Up S3 Bucket

Run the automated setup script:
```bash
npm run setup-s3-bucket
```

This will:
- Create your S3 bucket
- Configure public read access
- Enable static website hosting
- Display your website URL

### 4. Build and Deploy

```bash
# Build the application
npm run build

# Deploy to S3
npm run deploy
```

## Deployment Commands

| Command | Description |
|---------|-------------|
| `npm run deploy` | Build and upload with caching headers |
| `npm run upload-s3` | Upload to S3 with 1-year cache headers |
| `npm run upload-s3-no-cache` | Upload to S3 without cache headers |
| `npm run configure-s3-website` | Configure S3 for static website hosting |

## CloudFront Setup (Optional but Recommended)

For HTTPS and better performance:

1. **Create CloudFront Distribution**
   - Origin: Your S3 bucket website endpoint
   - Default Root Object: `index.html`
   - Error Pages: 404 → `/index.html` (for SPA routing)

2. **Add Distribution ID to .env**
   ```env
   AWS_CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id
   ```

3. **Deploy with cache invalidation**
   ```bash
   npm run deploy-with-cloudfront
   ```

## Website URLs

After deployment, your app will be available at:

- **S3 Website URL**: `http://your-bucket-name.s3-website-region.amazonaws.com`
- **CloudFront URL**: `https://your-distribution-id.cloudfront.net`
- **Custom Domain**: Configure CNAME/ALIAS to CloudFront distribution

## Troubleshooting

### Common Issues

1. **Bucket name already exists**
   - S3 bucket names must be globally unique
   - Try a different bucket name

2. **Access denied errors**
   - Check your AWS credentials
   - Verify IAM permissions for S3

3. **Website not loading**
   - Check bucket policy allows public read
   - Verify static website hosting is enabled
   - Check index.html exists in bucket

### Useful AWS CLI Commands

```bash
# List your buckets
aws s3 ls

# Check bucket website configuration
aws s3api get-bucket-website --bucket your-bucket-name

# View bucket policy
aws s3api get-bucket-policy --bucket your-bucket-name

# List files in bucket
aws s3 ls s3://your-bucket-name --recursive
```

## Cost Optimization

- **S3 Storage**: ~$0.023 per GB/month
- **Data Transfer**: First 1 GB free, then ~$0.09 per GB
- **CloudFront**: First 1 TB free, then ~$0.085 per GB

For a static website, costs are typically under $1/month for low traffic.

## Security Notes

- Never commit `.env` file to version control
- Use IAM roles instead of keys when possible
- Consider restricting S3 bucket access to CloudFront only
- Enable CloudFront logging for monitoring
