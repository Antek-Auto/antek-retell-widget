import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Store conversation history in memory (per request context)
// For production, you'd want to store this in a database
const conversations = new Map<string, Array<{ role: string; content: string }>>();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RETELL_API_KEY = Deno.env.get('RETELL_API_KEY');
    const RETELL_TEXT_AGENT_ID = Deno.env.get('RETELL_TEXT_AGENT_ID');

    if (!RETELL_API_KEY) {
      console.error('RETELL_API_KEY is not configured');
      throw new Error('RETELL_API_KEY is not configured');
    }

    if (!RETELL_TEXT_AGENT_ID) {
      console.error('RETELL_TEXT_AGENT_ID is not configured');
      throw new Error('RETELL_TEXT_AGENT_ID is not configured');
    }

    const { message, conversation_id } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    console.log('Sending text message to agent:', RETELL_TEXT_AGENT_ID);

    // Use the Chat Completion API for chat agents
    const response = await fetch("https://api.retellai.com/v2/create-chat-completion", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RETELL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent_id: RETELL_TEXT_AGENT_ID,
        user_message: message,
        conversation_id: conversation_id || undefined,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Retell API error:', response.status, errorText);
      throw new Error(`Failed to send message: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Chat completion response received:', data);

    return new Response(JSON.stringify({ 
      response: data.agent_message || data.response || data.content,
      conversation_id: data.conversation_id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in retell-text-chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
