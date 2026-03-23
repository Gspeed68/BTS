# Deploying BTS Client Forms to the Web

This guide uses **Render.com** — free, no credit card required.
Once deployed you'll have a permanent URL like `https://bts-client-forms.onrender.com`
that you can send directly to clients.

---

## Step 1 — Create a free GitHub account (if you don't have one)

1. Go to https://github.com and click **Sign up**
2. Follow the prompts to create your account

---

## Step 2 — Upload the BTS-Client-Forms folder to GitHub

1. Go to https://github.com/new
2. Name the repository **bts-client-forms**
3. Set it to **Private**
4. Click **Create repository**
5. On the next page click **uploading an existing file**
6. Drag the entire **BTS-Client-Forms** folder contents into the upload area
   (everything inside the folder — all .html, .py, .js, .css files, etc.)
7. Click **Commit changes**

---

## Step 3 — Create a free Render account

1. Go to https://render.com and click **Get Started for Free**
2. Sign up with your GitHub account (click **GitHub** button)
3. Authorize Render to access your GitHub

---

## Step 4 — Deploy the app

1. In Render dashboard click **New +** → **Web Service**
2. Click **Connect** next to your **bts-client-forms** repository
3. Render will auto-detect the settings. Verify:
   - **Runtime:** Python
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn server:app`
4. Scroll down to **Instance Type** and select **Free**
5. Click **Create Web Service**

---

## Step 5 — Add the database

1. In Render dashboard click **New +** → **PostgreSQL**
2. Name it **bts-forms-db**
3. Select **Free** tier
4. Click **Create Database**
5. Once created, go back to your Web Service
6. Click **Environment** in the left menu
7. Click **Add Environment Variable**
   - Key: `DATABASE_URL`
   - Value: (paste the **Internal Database URL** from your PostgreSQL dashboard)
8. Click **Save Changes** — Render will redeploy automatically

---

## Step 6 — Open your live site

After ~2 minutes your site will be live. Find the URL at the top of your
Web Service page (e.g. `https://bts-client-forms.onrender.com`).

- **Client forms:** `https://bts-client-forms.onrender.com`
- **Admin panel:** `https://bts-client-forms.onrender.com/admin.html`

---

## Notes

- **Free tier sleeps** after 15 minutes of inactivity and takes ~30 seconds
  to wake up on the first visit. Upgrade to the $7/month "Starter" plan for
  always-on if needed.
- The database on the free tier holds up to 1 GB (thousands of submissions).
- To update the site after making changes: re-upload changed files to GitHub
  and Render will redeploy automatically.
