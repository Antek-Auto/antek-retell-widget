# Vercel Cron Job Setup Guide

## Files Created ✅

Two files have been created to set up your Supabase keep-alive cron job:

1. **`api/cron/keep-alive.ts`** - Serverless function that pings Supabase every 3 days
2. **`vercel.json`** - Vercel configuration with cron schedule

## Next Steps

### Step 1: Generate CRON_SECRET

In your terminal, run:
```bash
openssl rand -base64 32
```

This will output a random string like: `r8yr6lIf2zJVpug+MWfhCBKW4LYT+4lFgF2eIysSOO4=`

**Save this value** - you'll need it in Step 3.

### Step 2: Deploy to Vercel

Push your changes to GitHub and deploy:

```bash
# Commit and push changes
git add api/ vercel.json
git commit -m "Add Vercel cron job to keep Supabase active"
git push

# Or deploy directly via Vercel CLI
vercel --prod
```

### Step 3: Configure Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add three variables:

   | Name | Value | Example |
   |------|-------|---------|
   | `VITE_SUPABASE_URL` | Copy from your `.env` file | `https://mqgiftqsovbapxpvnbqt.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | Copy from your `.env` file | `eyJhbGci...` |
   | `CRON_SECRET` | Generated from Step 1 | `r8yr6lIf2zJVpug+MWfhCBKW4LYT+4lFgF2eIysSOO4=` |

5. Click **Deploy** button if prompted

### Step 4: Verify Cron Job Configuration

1. In Vercel Dashboard, go to your project
2. Click on **Cron Jobs** tab (or **Deployments** → **Functions**)
3. You should see your cron job:
   - **Path**: `/api/cron/keep-alive`
   - **Schedule**: `0 12 */3 * *` (Every 3 days at 12:00 PM UTC)

### Step 5: Test the Cron Job

**Option A: Manual Test in Vercel Dashboard**
1. Find your cron job in the list
2. Click the **Manual Run** button
3. Check the response - should show:
   ```json
   {
     "success": true,
     "timestamp": "2026-01-11T20:00:00.000Z",
     "count": 5,
     "message": "Supabase pinged successfully"
   }
   ```

**Option B: Test Locally**
```bash
# Install Vercel CLI if you haven't
npm install -g vercel

# Start local development server
vercel dev

# In another terminal, test the endpoint
curl -X GET http://localhost:3000/api/cron/keep-alive \
  -H "Authorization: Bearer <your-CRON_SECRET>"
```

### Step 6: Monitor Going Forward

**Weekly Check**:
- Vercel Dashboard → Deployments → Functions → Look for recent logs with "Keep-alive ping successful"

**Supabase Check**:
- Supabase Dashboard → Settings → Usage
- Look for "Last Activity" timestamp - should update every 3 days

## How It Works

- **Frequency**: Every 3 days at 12:00 PM UTC
- **What it does**: Performs a lightweight COUNT query on `widget_configs` table
- **Security**: Requires authorization header with `CRON_SECRET`
- **Cost**: ~10 executions/month (well under Vercel's 100/month free tier limit)

## Troubleshooting

### Issue: "Unauthorized" error
**Solution**: Verify `CRON_SECRET` in Vercel environment variables matches the one you generated

### Issue: "Cannot find module '@supabase/supabase-js'"
**Solution**: Run `npm install @supabase/supabase-js` (should already be installed, but verify)

### Issue: Cron job shows "Failed"
**Solution**:
1. Check Vercel logs for specific error message
2. Verify Supabase URL and key are correct
3. Try manually triggering from Vercel Dashboard to see error details

### Issue: Supabase still pauses after deployment
**Solution**:
1. Check if cron job is actually running (check logs)
2. Verify schedule is correct: `0 12 */3 * *`
3. Try manual test to confirm endpoint works

## Going Deeper

**Alternative: GitHub Actions** (if Vercel cron doesn't work)
```yaml
name: Keep Supabase Alive
on:
  schedule:
    - cron: '0 12 */3 * *'
jobs:
  keep-alive:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Ping Supabase
        run: |
          curl -X GET https://your-vercel-url.vercel.app/api/cron/keep-alive \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## Summary

✅ **What you have**:
- Serverless function in `/api/cron/keep-alive.ts`
- Vercel configuration in `vercel.json` with 3-day schedule
- Instructions to complete setup

✅ **What you need to do**:
1. Generate `CRON_SECRET` using `openssl rand -base64 32`
2. Deploy to Vercel (via Git push or `vercel --prod`)
3. Add environment variables in Vercel Dashboard
4. Manually test to verify it works

**Result**: Supabase free tier will stay active indefinitely with no manual intervention! 🎉
