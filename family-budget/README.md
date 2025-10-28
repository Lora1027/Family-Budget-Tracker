
# Family Budget (Bi-Weekly) — React + GitHub Pages

## Quick Start
1. Install Node.js (https://nodejs.org)
2. Open a terminal here and run:
   ```bash
   npm install
   npm start
   ```

## Deploy to GitHub Pages
1. Edit `package.json` and replace `YOUR_GITHUB_USERNAME` in the `homepage` value.
2. Initialize git, push to GitHub, then deploy:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/family-budget.git
   git push -u origin main
   npm run deploy
   ```
3. Visit: https://YOUR_GITHUB_USERNAME.github.io/family-budget

## Notes
- Data is saved in the browser's LocalStorage (per device). Use Backup/Restore to move between devices.
- Multi-user works by inviting family members with the **Family Code** and having them "Join Family" on the same device or by importing backups.

- Currency defaults to CAD (en-CA).
