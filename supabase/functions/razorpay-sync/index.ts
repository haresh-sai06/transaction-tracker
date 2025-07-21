import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RazorpayTransaction {
  id: string
  amount: number
  currency: string
  status: string
  created_at: number
  description?: string
  notes?: { [key: string]: string }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { action, accountId } = await req.json()

    if (action === 'sync') {
      // Get Razorpay credentials from secrets
      const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')
      const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

      if (!razorpayKeyId || !razorpayKeySecret) {
        return new Response(
          JSON.stringify({ error: 'Razorpay credentials not configured' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create authorization header for Razorpay API
      const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`)
      
      // Fetch recent payments from Razorpay
      const fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - 30) // Last 30 days
      
      const razorpayResponse = await fetch(
        `https://api.razorpay.com/v1/payments?from=${Math.floor(fromDate.getTime() / 1000)}&to=${Math.floor(Date.now() / 1000)}&count=100`,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!razorpayResponse.ok) {
        throw new Error(`Razorpay API error: ${razorpayResponse.statusText}`)
      }

      const razorpayData = await razorpayResponse.json()
      const transactions: RazorpayTransaction[] = razorpayData.items || []

      // Process and insert transactions
      const processedTransactions = []
      
      for (const transaction of transactions) {
        // Skip failed transactions
        if (transaction.status !== 'captured') continue

        // Check if transaction already exists
        const { data: existingTransaction } = await supabaseClient
          .from('transactions')
          .select('id')
          .eq('user_id', user.id)
          .eq('source', `razorpay_${transaction.id}`)
          .single()

        if (existingTransaction) continue

        // Convert amount from paise to rupees
        const amount = transaction.amount / 100
        
        const newTransaction = {
          user_id: user.id,
          amount: amount,
          currency: transaction.currency.toUpperCase(),
          date: new Date(transaction.created_at * 1000).toISOString(),
          source: `razorpay_${transaction.id}`,
          category_id: null, // Will be categorized later
        }

        const { data, error } = await supabaseClient
          .from('transactions')
          .insert(newTransaction)
          .select()
          .single()

        if (error) {
          console.error('Error inserting transaction:', error)
          continue
        }

        processedTransactions.push(data)
      }

      // Update payment account sync status
      await supabaseClient
        .from('payment_accounts')
        .update({ 
          last_sync: new Date().toISOString(),
          is_active: true 
        })
        .eq('user_id', user.id)
        .eq('provider', 'razorpay')

      return new Response(
        JSON.stringify({ 
          success: true, 
          synced: processedTransactions.length,
          total_found: transactions.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in razorpay-sync function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})