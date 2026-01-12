import { createClient } from '@supabase/supabase-js'

export const config = {
  runtime: 'edge',
}

export default async function handler(req: Request) {
  // Security: Verify cron secret
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL!
    const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Lightweight query: Count widget_configs without fetching data
    const { count, error } = await supabase
      .from('widget_configs')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Supabase query error:', error)
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log(`Keep-alive ping successful. Widget configs count: ${count}`)

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      count,
      message: 'Supabase pinged successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Keep-alive error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
