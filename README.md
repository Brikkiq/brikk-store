# Brikk — Built to Close

The command center for real estate agents.

## What's in this project

- **Landing page** at `/` — marketing site with interactive demo, email capture, features, pricing, FAQ
- **Full dashboard** at `/demo` — complete 6-screen command center with AI Copilot
- **PWA ready** — agents can install it on their phone home screen

---

## Deploy to Vercel (Step by Step)

### Prerequisites
You need these accounts (all free):
1. GitHub account (github.com)
2. Vercel account (vercel.com — sign up with GitHub)

### Step 1: Create a GitHub Repository

1. Go to github.com and log in
2. Click the **+** icon in the top right corner
3. Click **"New repository"**
4. Name it: `brikk-site`
5. Keep it **Public** (or Private, either works)
6. Do NOT check "Add a README file" (we already have one)
7. Click **"Create repository"**
8. You'll see a page with setup instructions — keep this page open

### Step 2: Upload the Project Files

**Option A — Using the GitHub website (easiest, no terminal needed):**

1. On your new repository page, click **"uploading an existing file"**
2. Drag and drop ALL the files from the brikk-site folder
3. IMPORTANT: You need to recreate the folder structure. GitHub's upload UI is flat, so:
   - First, create the files at root level (package.json, next.config.js, README.md)
   - Then use "Add file" > "Create new file" for nested files
   - For `app/layout.js`, type `app/layout.js` in the filename field (the slash creates the folder)
   - Do the same for `app/globals.css`, `app/page.js`, `app/demo/page.js`
   - And for `public/manifest.json`, `public/favicon.svg`

**Option B — Using the terminal (faster if comfortable):**

```bash
# Install Git if you don't have it: https://git-scm.com/downloads

cd path/to/brikk-site
git init
git add .
git commit -m "Initial commit - Brikk landing page and dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/brikk-site.git
git push -u origin main
```

Replace YOUR_USERNAME with your actual GitHub username.

### Step 3: Deploy on Vercel

1. Go to vercel.com and log in
2. Click **"Add New..."** > **"Project"**
3. You'll see your GitHub repos — find **brikk-site** and click **"Import"**
4. Vercel auto-detects it's a Next.js project
5. Don't change any settings
6. Click **"Deploy"**
7. Wait 1-2 minutes — Vercel builds and deploys your site
8. You'll get a live URL like: `brikk-site.vercel.app`

### Step 4: Connect Your Domain (brikk.store)

1. In Vercel, go to your project settings
2. Click **"Domains"**
3. Type `brikk.store` and click **"Add"**
4. Vercel will show you DNS records to add
5. Go to Namecheap (where you bought brikk.store)
6. Go to Domain List > brikk.store > **"Manage"**
7. Click **"Advanced DNS"**
8. Add the records Vercel told you to add (usually):
   - Type: **A Record**, Host: **@**, Value: **76.76.21.21**
   - Type: **CNAME Record**, Host: **www**, Value: **cname.vercel-dns.com**
9. Wait 5-30 minutes for DNS to propagate
10. Your site is now live at **brikk.store**

---

## Project Structure

```
brikk-site/
├── package.json          # Dependencies
├── next.config.js        # Next.js config
├── README.md             # This file
├── public/
│   ├── manifest.json     # PWA manifest
│   └── favicon.svg       # Brikk logo
└── app/
    ├── layout.js         # Root layout, SEO, fonts
    ├── globals.css       # Global styles
    ├── page.js           # Landing page (brikk.store)
    └── demo/
        └── page.js       # Full dashboard (brikk.store/demo)
```

---

## What's Next

After deploying, your priorities are:

1. Share brikk.store in real estate Facebook groups and Reddit
2. Collect emails from the landing page
3. Get 5 pilot agents using the demo with their real data
4. Build the functional backend (auth, data entry, Claude API for Copilot)
5. Start charging

---

Built with Next.js, React, and Recharts. Deployed on Vercel.
