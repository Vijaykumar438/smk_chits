# SMK Chits — Setup & Deployment Guide

Follow these steps **in order** to get your app live.

---

## Step 1: Create a Firebase Project

1. Go to **https://console.firebase.google.com**
2. Click **"Add project"**
3. Name it: `smk-chits`
4. Disable Google Analytics (not needed) → Click **Create Project**
5. Once created, click the **Web icon** `</>` to register a web app
6. App nickname: `SMK Chits`
7. ✅ Check **"Also set up Firebase Hosting"** (optional, we'll use Vercel instead)
8. Click **Register App**
9. You'll see a config object like this — **copy these values**:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "smk-chits-xxxxx.firebaseapp.com",
  projectId: "smk-chits-xxxxx",
  storageBucket: "smk-chits-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

---

## Step 2: Enable Authentication

1. In Firebase Console → **Build** → **Authentication**
2. Click **Get Started**
3. Under **Sign-in providers**, click **Email/Password**
4. Toggle **Enable** → Click **Save**
5. Go to the **Users** tab → Click **Add User**
6. Enter your dad's login credentials:
   - **Email:** `admin@smkchits.com` (or any email he'll remember)
   - **Password:** Choose a strong password
7. Click **Add User** — this is the only admin account needed

---

## Step 3: Set Up Firestore Database

1. In Firebase Console → **Build** → **Firestore Database**
2. Click **Create Database**
3. Choose location: **asia-south1 (Mumbai)** ← closest to India
4. Start in **Production mode** → Click **Create**
5. Go to the **Rules** tab and replace the rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can read/write
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

6. Click **Publish**

---

## Step 4: Add Firebase Config to Your App

Open the file `.env.local` in your project root and replace the placeholder values with your actual Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...your_actual_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=smk-chits-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=smk-chits-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=smk-chits-xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

> ⚠️ Replace each value with the ones from Step 1. Keep the `NEXT_PUBLIC_` prefix — it's required.

---

## Step 5: Test Locally

Open a terminal in the project folder and run:

```powershell
# Set Node.js path (if using portable install)
$nodeBin = "$env:USERPROFILE\.nodejs\node-v22.14.0-win-x64"
$env:Path = "$nodeBin;$env:Path"

# Start dev server
npm run dev
```

Then open **http://localhost:3000** in your browser.

### Verify:
- [ ] Login page appears with SMK branding
- [ ] You can log in with the email/password from Step 2
- [ ] Dashboard loads after login
- [ ] You can add a member
- [ ] You can create a chit group
- [ ] Language toggle (EN/TE) works

---

## Step 6: Deploy to Vercel (Free)

### Option A: Using Git + Vercel Dashboard (Recommended)

1. **Create a GitHub account** at https://github.com if you don't have one
2. **Push your code to GitHub:**
   ```powershell
   cd "c:\Users\z004n5ra\Desktop\SUB Projects\MSKChits"
   git init
   git add .
   git commit -m "SMK Chits - initial release"
   # Create a new repo on GitHub named "smk-chits", then:
   git remote add origin https://github.com/YOUR_USERNAME/smk-chits.git
   git branch -M main
   git push -u origin main
   ```
3. Go to **https://vercel.com** → Sign up with GitHub
4. Click **"Add New Project"** → Import your `smk-chits` repo
5. In **Environment Variables**, add all 6 variables from your `.env.local`:
   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | your_key |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | your_domain |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | your_id |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | your_bucket |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | your_sender_id |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | your_app_id |
6. Click **Deploy** — wait ~2 minutes
7. Your app is now live at `https://smk-chits.vercel.app` 🎉

### Option B: Using Vercel CLI (Quick)

```powershell
npx vercel
# Follow the prompts — it will auto-detect Next.js
# Add your env variables when asked, or set them in the Vercel dashboard after
```

---

## Step 7: Update Firebase Authorized Domains

After deploying to Vercel, you need to allow your Vercel domain in Firebase:

1. Firebase Console → **Authentication** → **Settings** tab
2. Scroll to **Authorized domains**
3. Click **Add domain**
4. Add: `smk-chits.vercel.app` (or your custom Vercel domain)
5. Also add: `localhost` (should already be there)

---

## Step 8: Add to Phone Home Screen (PWA)

Your dad can install the app on his phone:

### Android:
1. Open the deployed URL in **Chrome**
2. Tap the **⋮** menu → **"Add to Home screen"**
3. Tap **Add** — the app icon appears on the home screen

### iPhone:
1. Open the deployed URL in **Safari**
2. Tap the **Share** icon → **"Add to Home Screen"**
3. Tap **Add**

The app works offline for viewing cached data!

---

## Step 9: Optional — Custom Domain

If you want a custom domain like `smkchits.in`:

1. Buy a domain from **Namecheap**, **GoDaddy**, or **Google Domains** (~₹600/year for `.in`)
2. In Vercel Dashboard → Your Project → **Settings** → **Domains**
3. Add your domain and follow the DNS setup instructions
4. Update Firebase Authorized Domains (Step 7) with the new domain

---

## Quick Reference

| Item | URL |
|------|-----|
| Firebase Console | https://console.firebase.google.com |
| Vercel Dashboard | https://vercel.com/dashboard |
| Local Dev Server | http://localhost:3000 |
| Live App | https://smk-chits.vercel.app |

## App Routes

| Page | English | Telugu |
|------|---------|--------|
| Login | `/en/login` | `/te/login` |
| Dashboard | `/en/dashboard` | `/te/dashboard` |
| Members | `/en/members` | `/te/members` |
| Chit Groups | `/en/chit-groups` | `/te/chit-groups` |
| Auctions | `/en/auctions` | `/te/auctions` |
| Collections | `/en/collections` | `/te/collections` |
| Reports | `/en/reports` | `/te/reports` |
| Settings | `/en/settings` | `/te/settings` |

---

## Troubleshooting

### "Firebase: Error (auth/invalid-api-key)"
→ Check `.env.local` — make sure `NEXT_PUBLIC_FIREBASE_API_KEY` has the correct key. Restart the dev server after changing env vars.

### "Permission denied" on Firestore
→ Check Firestore Rules (Step 3) — make sure authenticated users have read/write access.

### Login doesn't work on Vercel
→ Add your Vercel domain to Firebase Authorized Domains (Step 7).

### App shows blank page
→ Open browser DevTools (F12) → Console tab. Check for errors. Usually a missing env variable.

### Node.js not found
→ Run: `$env:Path = "$env:USERPROFILE\.nodejs\node-v22.14.0-win-x64;$env:Path"` before running npm commands.

---

*Built with ❤️ for Seethala Murali Krishna — SMK Chits*
