
# Deploying ChatChain Haven

This document guides you through deploying ChatChain Haven for free.

## Option 1: Deploy to Netlify

Netlify provides a generous free tier that's perfect for showcasing projects.

1. Push your code to a GitHub repository
2. Sign up for a [Netlify account](https://app.netlify.com/signup)
3. Click "New site from Git"
4. Select GitHub and authorize Netlify
5. Select your repository
6. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
7. Click "Deploy site"

## Option 2: Deploy to Vercel

Vercel is another excellent option for React applications.

1. Push your code to a GitHub repository
2. Sign up for a [Vercel account](https://vercel.com/signup)
3. Click "Import Project"
4. Select "Import Git Repository"
5. Select your repository
6. Configure project:
   - Framework preset: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
7. Click "Deploy"

## Option 3: GitHub Pages

GitHub provides free hosting through GitHub Pages.

1. Add the following to your package.json:
   ```json
   "homepage": "https://yourusername.github.io/chatchain-haven",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
2. Install the deployment package:
   ```
   npm install --save-dev gh-pages
   ```
3. Run:
   ```
   npm run deploy
   ```

## Important Notes:

- The app uses localStorage for data persistence, which means all user data is stored in the browser.
- For a production application, you would want to integrate with a real blockchain solution.
- Consider adding environment configuration for different deployment environments.
