import { execSync } from 'child_process';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, 'dist');

console.log('🚀 Starting deployment process...');

try {
  // 1. Build the project
  console.log('📦 Building project...');
  execSync('npm run build', { stdio: 'inherit' });

  if (!fs.existsSync(distDir)) {
    throw new Error('Build failed: dist directory not found');
  }

  // 2. Get the remote URL from the root git config
  console.log('🔗 Getting remote URL...');
  const remoteUrl = execSync('git config --get remote.origin.url').toString().trim();

  // 3. Initialize git in dist directory and push
  console.log('📤 Pushing to GitHub Pages...');
  
  const runInDist = (cmd) => execSync(cmd, { cwd: distDir, stdio: 'inherit' });

  // Initialize fresh git repo in dist
  runInDist('git init');

  // Set git config for the dummy repo to prevent "Author identity unknown" error
  runInDist('git config user.name "Deploy Bot"');
  runInDist('git config user.email "deploy@example.com"');
  
  // Create/Checkout gh-pages branch
  runInDist('git checkout -B gh-pages');
  
  // Add all files
  runInDist('git add -A');
  
  // Commit
  runInDist('git commit -m "deploy: updated site"');
  
  // Add remote (handle potential error if it exists, though in a fresh init it shouldn't)
  try {
    runInDist(`git remote add origin ${remoteUrl}`);
  } catch (e) {
    runInDist(`git remote set-url origin ${remoteUrl}`);
  }

  // Push force
  runInDist('git push -f origin gh-pages');

  console.log('✅ Deployed successfully!');
  console.log('🌍 Your site should be live in a few minutes at:');
  console.log('   https://miguelacondutog-lgtm.github.io/geocalc/');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}