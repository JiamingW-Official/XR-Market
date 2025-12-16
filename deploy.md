# GitHub Pages Deployment Instructions

## Step 1: Add your GitHub repository as remote

If you haven't already, add your GitHub repository as the remote origin:

```bash
git remote add origin https://github.com/YOUR_USERNAME/XR-Market.git
```

Replace `YOUR_USERNAME` with your GitHub username.

## Step 2: Push to GitHub

```bash
git push -u origin main
```

## Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings**
3. Scroll down to **Pages** in the left sidebar
4. Under **Source**, select **GitHub Actions** (not "Deploy from a branch")
5. The GitHub Actions workflow will automatically build and deploy your site

## Step 4: Wait for deployment

After pushing, GitHub Actions will automatically:
- Build your Vite project
- Deploy it to GitHub Pages
- Your site will be available at: `https://YOUR_USERNAME.github.io/XR-Market/`

The deployment usually takes 1-2 minutes. You can check the progress in the **Actions** tab of your repository.

## Note

The GitHub Actions workflow (`.github/workflows/deploy.yml`) is already configured and will:
- Build on every push to `main` branch
- Automatically deploy to GitHub Pages
- Use the latest Vite build output

