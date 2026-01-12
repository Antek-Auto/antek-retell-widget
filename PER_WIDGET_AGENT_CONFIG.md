# Per-Widget Agent Configuration

This explains how to configure different Retell agents for each widget.

## Overview

You set up **one global Retell API key**, then each widget gets its **own agent IDs**.

```
Setup:
  └─ Global API Key (VITE_RETELL_API_KEY)
     │
     ├─ Widget 1
     │  ├─ voice_agent_id: "agent_xyz123"
     │  └─ chat_agent_id: "agent_abc456"
     │
     ├─ Widget 2
     │  ├─ voice_agent_id: "agent_def789"
     │  └─ chat_agent_id: "agent_ghi012"
     │
     └─ Widget 3
        ├─ voice_agent_id: "agent_jkl345"
        └─ chat_agent_id: "agent_mno678"
```

## Setup Process

### 1. During Initial Setup
```bash
npm run setup:supabase

# When prompted:
✓ Supabase Project URL
✓ Supabase Anon Key
✓ Supabase Service Role Key
✓ Retell API Key  ← This is the global one
  (No agent IDs asked here)
```

The global API key is stored in `.env.local` as `VITE_RETELL_API_KEY`.

### 2. Deploy Edge Functions
```bash
supabase secrets set RETELL_API_KEY=<YOUR_GLOBAL_API_KEY>
```

All widgets use this API key for authentication with Retell.

### 3. Configure Widgets in Dashboard
When you create or edit a widget in the dashboard, you set:

- **Voice Agent ID** - The Retell agent that handles voice calls
- **Chat Agent ID** - The Retell agent that handles text chat
- **Optional: Custom Retell API Key** - Override global key for this widget (if you have multiple Retell accounts)

## Example Scenarios

### Scenario 1: Customer Support Bot
```
Widget Name: Support
├─ Voice Agent: "agent_support_voice"
│  └─ Training: "Handle customer support calls"
└─ Chat Agent: "agent_support_chat"
   └─ Training: "Answer support questions via text"
```

### Scenario 2: Sales Inquiry Bot
```
Widget Name: Sales
├─ Voice Agent: "agent_sales_voice"
│  └─ Training: "Qualify leads, schedule demos"
└─ Chat Agent: "agent_sales_chat"
   └─ Training: "Answer product questions, collect emails"
```

### Scenario 3: Demo Widget
```
Widget Name: Demo
├─ Voice Agent: "agent_demo_voice"
│  └─ Training: "Showcase product features"
└─ Chat Agent: "agent_demo_chat"
   └─ Training: "Answer general product questions"
```

## Database Schema

The `widget_configs` table stores:

```sql
-- Global configuration
api_key              TEXT       -- Public API key for the widget
retell_api_key       TEXT       -- Optional: Custom Retell API key override
                                  (if NULL, uses global RETELL_API_KEY)

-- Per-widget agent IDs
voice_agent_id       TEXT       -- Retell agent ID for voice calls
chat_agent_id        TEXT       -- Retell agent ID for chat

-- Other widget settings
primary_color        TEXT       -- Widget color customization
position            TEXT       -- "bottom-right" or "bottom-left"
title               TEXT       -- Widget title
greeting            TEXT       -- Initial greeting message
enable_voice        BOOLEAN    -- Allow voice calls?
enable_chat         BOOLEAN    -- Allow chat?
allowed_domains     TEXT[]     -- Allowed domains for embed
```

## How It Works (Architecture)

### User Visits Your Site with Widget
```
1. User visits: example.com (with embedded widget code)
2. Widget code fetches config from: /api/cron/widget-config?api_key=wgt_xxx
3. Returns: { voice_agent_id, chat_agent_id, primary_color, etc. }
4. User clicks "Start Call" or "Chat"
5. Widget calls: /api/cron/retell-create-call or /api/cron/retell-text-chat
6. Edge Function uses:
   - Global RETELL_API_KEY (from environment)
   - Widget's voice_agent_id or chat_agent_id (from request)
   - Creates connection to that specific Retell agent
```

### Data Flow
```
┌─────────────────┐
│  Your Website   │
│ (with widget)   │
└────────┬────────┘
         │
         │ Requests widget config
         ▼
┌──────────────────────────────────┐
│  Supabase Edge Function          │
│  /widget-config                  │
│  Returns: voice_agent_id, etc.   │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│  Supabase Edge Function          │
│  /retell-create-call             │
│  Uses: voice_agent_id            │
└────────────┬─────────────────────┘
             │
             │ Calls Retell API with:
             │ - RETELL_API_KEY (global)
             │ - agent_id (per-widget)
             ▼
┌──────────────────────────────────┐
│  Retell AI Service               │
│  voice_agent_id agent processes  │
│  the call                        │
└──────────────────────────────────┘
```

## Creating Widgets with Different Agents

### Via Dashboard
1. Go to http://localhost:8080/dashboard
2. Click **Create Widget**
3. Fill in:
   - Widget Name: e.g., "Support Bot"
   - Voice Agent ID: `agent_abc123` (from Retell dashboard)
   - Chat Agent ID: `agent_def456` (from Retell dashboard)
   - Customize: color, position, greeting, etc.
4. Click **Save**

### Via SQL (Advanced)
```sql
INSERT INTO widget_configs (
  user_id,
  name,
  api_key,
  voice_agent_id,
  chat_agent_id,
  title,
  greeting,
  primary_color,
  enable_voice,
  enable_chat
)
VALUES (
  '<YOUR_USER_ID>',
  'Support Widget',
  'wgt_' || encode(gen_random_bytes(24), 'hex'),
  'agent_abc123',
  'agent_def456',
  'Support Assistant',
  'Hi! How can I help?',
  '#14b8a6',
  true,
  true
);
```

## Getting Agent IDs from Retell

1. Go to https://retell.ai/dashboard
2. Create or select an agent
3. Copy the **Agent ID** from the agent details
4. Use this ID in your widget configuration

## Advanced: Multiple Retell Accounts

If you have multiple Retell accounts, you can use different API keys per widget:

```sql
UPDATE widget_configs
SET retell_api_key = 'your_alternate_retell_key_here'
WHERE id = 'widget_id_xyz';
```

When a widget has a custom `retell_api_key`, the Edge Functions use it instead of the global key.

## Testing Your Configuration

### Test Voice Agent
1. Go to Dashboard
2. Click your widget
3. Click **Test Widget** or use embed code
4. Click microphone icon
5. Speak to test the voice agent

### Test Chat Agent
1. Go to Dashboard
2. Click your widget
3. Click **Test Widget** or use embed code
4. Click chat icon
5. Type to test the chat agent

### View Agent Logs
In Retell dashboard, you can see:
- Call history
- Chat transcripts
- Agent responses
- Duration and quality metrics

## Troubleshooting

### "Agent not found" error
- Verify the agent ID is correct
- Check agent is published in Retell dashboard
- Ensure Retell API key is correct

### "Can't reach Retell service"
- Check `RETELL_API_KEY` environment variable is set
- Verify global API key is valid
- Check Retell service status

### Widget shows wrong agent
- Verify agent ID is saved to database
- Check browser cache
- Reload the page
- Check widget config in Supabase dashboard

### Different agents on different pages
- Create multiple widgets with different agent IDs
- Embed each widget on its respective page
- Each gets its own agent configuration

## Summary

✅ **Global Setup**
- One Retell API key for authentication
- Set once in environment: `RETELL_API_KEY`

✅ **Per-Widget Configuration**
- Each widget has: `voice_agent_id`, `chat_agent_id`
- Set in Dashboard or via SQL
- Can be different for each widget

✅ **Benefits**
- Different behaviors for different use cases
- Different training data per agent
- Different personalities per widget
- Scalable to unlimited widgets

---

**Key Takeaway**: The global API key stays in `RETELL_API_KEY`. All customization happens per-widget in the dashboard or database.
