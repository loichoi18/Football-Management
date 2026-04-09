# Nations FC - Football Team Manager

A web app to manage your football team: events with voting, player roster, and accounts.

## 🔧 Setup (one-time)

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Add project** → name it anything → Create
3. In the project, click the **web icon** `</>` to add a web app
4. Copy the `firebaseConfig` object

### 2. Paste your Firebase config
Open `src/firebase.js` and replace the placeholder values with your config.

### 3. Enable Firebase services
In your Firebase Console:

**Authentication:**
- Go to **Authentication → Sign-in method**
- Enable **Email/Password**

**Firestore:**
- Go to **Firestore Database → Create database**
- Start in **test mode** (for now)
- Choose a region close to you (e.g. `australia-southeast1`)

**Storage:**
- Go to **Storage → Get started**
- Start in **test mode**

### 4. Install & run locally
```bash
npm install
npm run dev
```

### 5. Deploy to Vercel
```bash
# Option A: Push to GitHub, then import in vercel.com
git init && git add . && git commit -m "init"
# Push to GitHub, then go to vercel.com → New Project → Import

# Option B: Vercel CLI
npm i -g vercel
vercel
```

## 📱 Features
- **Events tab**: Create matches with date/time/location. Anyone can vote (Buổi này đi k?). Shows voter count and names.
- **Members tab**: Player roster grouped by position (GK, DF, MF, ATK). Each player has primary + optional secondary position. Upload photos or auto-generate avatar from initials.
- **Profile tab**: Register/login. Only logged-in users can add players, create/delete events. Anyone can vote.

## ⚠️ Security Note
Before going live, update your Firestore & Storage rules to restrict write access to authenticated users only.
