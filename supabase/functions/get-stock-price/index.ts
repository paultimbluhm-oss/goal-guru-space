import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    
    if (!symbol) {
      return new Response(
        JSON.stringify({ error: 'Symbol is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Yahoo Finance API via a free endpoint
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error('Yahoo Finance API error:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch stock price', status: response.status }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    const result = data.chart?.result?.[0];
    if (!result) {
      return new Response(
        JSON.stringify({ error: 'No data found for symbol' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const meta = result.meta;
    const price = meta.regularMarketPrice;
    const currency = meta.currency;
    const previousClose = meta.chartPreviousClose || meta.previousClose;
    
    // Convert to EUR if needed (approximate)
    let priceInEur = price;
    if (currency === 'USD') {
      // Approximate USD to EUR conversion
      priceInEur = price * 0.92;
    } else if (currency === 'GBP') {
      priceInEur = price * 1.17;
    }
    // If already EUR or unknown, keep the price

    return new Response(
      JSON.stringify({
        symbol: symbol,
        price: priceInEur,
        originalPrice: price,
        currency: currency,
        previousClose: previousClose,
        change: price - previousClose,
        changePercent: ((price - previousClose) / previousClose) * 100,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
