# Frontend CI/CD Documentation

This document describes the CI/CD pipelines configured for the EMDC Frontend application.

## Overview

The frontend uses **GitHub Actions** for continuous integration and deployment. Three main workflows are configured:

1. **CI Pipeline** (`ci.yml`) - Runs on every push and PR
2. **Docker Build** (`docker.yml`) - Builds and publishes Docker images
3. **Deployment** (`deploy.yml`) - Deploys to production/staging

---

## 🔄 CI Pipeline (`ci.yml`)

### Triggers
- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop`

### Jobs

#### 1. **Lint**
- Runs ESLint to check code quality
- Ensures code follows style guidelines
- Blocks merge if linting fails

```bash
npm run lint
```

#### 2. **Build**
- Compiles TypeScript and builds production bundle
- Runs after successful linting
- Uploads build artifacts for 7 days
- Uses Vite to create optimized production build

```bash
npm run build
```

#### 3. **Type Check**
- Validates TypeScript types across the codebase
- Runs in parallel with other jobs
- Catches type errors before deployment

```bash
npx tsc --noEmit
```

#### 4. **Security Scan**
- Runs `npm audit` to check for vulnerable dependencies
- Lists outdated packages
- Continues even if vulnerabilities are found (warnings only)

---

## 🐳 Docker Build Pipeline (`docker.yml`)

### Triggers
- Push to `main` branch
- Version tags (e.g., `v1.0.0`)
- Pull requests to `main`

### Features
- Builds multi-stage Docker image
- Pushes to GitHub Container Registry (ghcr.io)
- Uses Docker layer caching for faster builds
- Automatic tagging based on branch/version

### Image Tags Generated
- `main` - Latest main branch
- `v1.0.0` - Semantic version tags
- `pr-123` - Pull request builds
- `main-abc1234` - Commit SHA tags
- `latest` - Latest stable release

### Registry
```
ghcr.io/emdc-fall-2025/frontend:latest
```

---

## 🚀 Deployment Pipeline (`deploy.yml`)

### Triggers
- Manual dispatch via GitHub UI
- Optional: Automatic on push to `main` (commented out)

### Deployment Options

The deployment workflow includes templates for multiple hosting providers:

#### **Option 1: Vercel**
```yaml
- name: Deploy to Vercel
  uses: amondnet/vercel-action@v25
```

**Required Secrets:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

#### **Option 2: Netlify**
```yaml
- name: Deploy to Netlify
  uses: nwtgck/actions-netlify@v2
```

**Required Secrets:**
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

#### **Option 3: DigitalOcean App Platform**
```yaml
- name: Deploy to DigitalOcean
  uses: digitalocean/app_action@main
```

**Required Secrets:**
- `DIGITALOCEAN_ACCESS_TOKEN`

#### **Option 4: VPS via SSH**
```yaml
- name: Deploy to VPS via SSH
  uses: appleboy/scp-action@master
```

**Required Secrets:**
- `SSH_HOST`
- `SSH_USERNAME`
- `SSH_PRIVATE_KEY`
- `SSH_PORT` (optional, defaults to 22)

#### **Option 5: Docker Container**
Deploys using Docker Compose on a remote server.

**Required Secrets:**
- `SSH_HOST`
- `SSH_USERNAME`
- `SSH_PRIVATE_KEY`

---

## 🔐 Required Secrets

Configure these secrets in your GitHub repository settings:

### **Repository Secrets** (Settings → Secrets and variables → Actions)

#### Build & Deploy
- `VITE_BACKEND_URL` - Backend API URL (e.g., `https://api.emdc.com`)
- `APP_URL` - Deployed frontend URL

#### Hosting Provider (choose one)
- **Vercel**: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- **Netlify**: `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`
- **DigitalOcean**: `DIGITALOCEAN_ACCESS_TOKEN`
- **SSH/VPS**: `SSH_HOST`, `SSH_USERNAME`, `SSH_PRIVATE_KEY`, `SSH_PORT`

---

## 📋 Setup Instructions

### 1. Enable GitHub Actions
GitHub Actions is automatically enabled for this repository.

### 2. Configure Secrets
1. Go to **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Add required secrets based on your deployment target

### 3. Enable Workflows
All workflows are active by default. You can:
- View workflow runs in the **Actions** tab
- Manually trigger deployment via **Actions → Deploy Frontend → Run workflow**

### 4. Configure Branch Protection (Recommended)
1. Go to **Settings → Branches**
2. Add rule for `main` branch:
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date
   - Select: `Lint Code`, `Build Application`, `TypeScript Type Check`

---

## 🔧 Customization

### Enable Automatic Deployment
Edit `.github/workflows/deploy.yml` and uncomment:

```yaml
on:
  push:
    branches:
      - main
    paths:
      - 'src/**'
      - 'package.json'
      - 'vite.config.ts'
```

### Add Environment-Specific Builds
Create different environments in GitHub:
1. Go to **Settings → Environments**
2. Create `production` and `staging` environments
3. Add environment-specific secrets

### Modify Build Commands
Edit `package.json` scripts or workflow files as needed.

---

## 📊 Monitoring Workflows

### View Workflow Status
- **Actions Tab**: See all workflow runs
- **Commit Status**: Shows checks on each commit
- **Pull Requests**: CI status visible on PR page

### Artifacts
Build artifacts are stored for 7 days and can be downloaded from:
- Actions → Workflow Run → Artifacts section

### Notifications
Configure notifications in **Settings → Notifications** to receive alerts on:
- Failed workflows
- Deployment completions
- Security vulnerabilities

---

## 🐛 Troubleshooting

### Build Fails
1. Check the **Actions** tab for error logs
2. Verify all dependencies are in `package.json`
3. Ensure `VITE_BACKEND_URL` secret is set

### Deployment Fails
1. Verify all required secrets are configured
2. Check hosting provider credentials are valid
3. Review deployment logs in workflow run

### Docker Build Fails
1. Ensure Dockerfile is valid
2. Check for missing dependencies
3. Verify build arguments are correct

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## 🤝 Contributing

When adding new CI/CD features:
1. Test changes in a feature branch
2. Update this documentation
3. Notify team of any new required secrets
4. Test deployment process before merging

