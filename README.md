# CourtOrder 🏀

A premium March Madness bracket platform with a "Sports Broadcast" aesthetic.

## Tech Stack
- **Frontend**: React 19 + Vite 8
- **Styling**: Tailwind CSS 4 (Neon Sports Theme)
- **Database/Auth**: Firebase Firestore & Auth
- **State Management**: Zustand (with Persistence)
- **Icons**: Lucide-React
- **Hosting**: GitHub Pages via GitHub Actions

## Deployment

This repository is configured for "hands-free" deployment. Every push to the `main` branch will automatically trigger a build and deploy to GitHub Pages.

### Custom Domain
The project is configured for `courtorder.sunitmathur.com`.
Ensure your DNS settings have a CNAME record:
- Name: `courtorder`
- Value: `mathursunit.github.io`

### Firebase Setup
1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore Database** and **Authentication** (Google & Email).
3. In your GitHub Repository, go to **Settings > Secrets and variables > Actions** and add the following secrets:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

**Crucial for Sign-In:**
If you use a custom domain (like `courtorder.sunitmathur.com`), you **must** add it to your Firebase authorized domains:
1. Go to **Firebase Console** > **Authentication** > **Settings** > **Authorized Domains**.
2. Click **"Add Domain"** and enter `courtorder.sunitmathur.com`.

## Local Development
1. Clone the repo.
2. `npm install`
3. Create a `.env.local` file using `.env.example`.
4. `npm run dev`

## 🤖 Score Automation (ScoreBot)
The application includes a background service to auto-populate winners:
1. Generate a **Service Account JSON** in [Firebase Console](https://console.firebase.google.com/) (Project Settings > Service Accounts).
2. Go to your GitHub Repository -> **Settings > Secrets and variables > Actions**.
3. Add a new repository secret named `FIREBASE_SERVICE_ACCOUNT_JSON` and paste the entire JSON content.
4. The GitHub Action in `.github/workflows/auto-update.yml` will now poll ESPN every 4 hours and update the bracket!
