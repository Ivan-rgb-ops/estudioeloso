/**
 * Cloudflare Pages Function
 * Ruta: /create-preference
 *
 * Crea una preferencia de pago en MercadoPago y devuelve el init_point.
 * El Access Token vive como variable de entorno en el dashboard de Cloudflare
 * (nunca en el código fuente).
 */

const MP_API_URL = 'https://api.mercadopago.com/checkout/preferences';

export async function onRequestPost(context) {
  const { request, env } = context;

  // ── CORS ──────────────────────────────────────────────────────────────────
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // ── Body ──────────────────────────────────────────────────────────────────
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Body inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const { items } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return new Response(JSON.stringify({ error: 'Se requiere al menos un item' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // ── Credenciales ──────────────────────────────────────────────────────────
  const accessToken = env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return new Response(JSON.stringify({ error: 'Configuración de pago no disponible' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // ── Preferencia de pago ───────────────────────────────────────────────────
  const baseUrl = 'https://estudioeloso.pages.dev';

  const preference = {
    items: items.map(item => ({
      id: item.id,
      title: item.title,
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unit_price),
      currency_id: 'ARS',
    })),
    back_urls: {
      success: `${baseUrl}/pago-aprobado.html`,
      pending: `${baseUrl}/pago-pendiente.html`,
      failure: `${baseUrl}/pago-error.html`,
    },
    auto_return: 'approved',
    statement_descriptor: 'ESTUDIO EL OSO',
    payment_methods: {
      excluded_payment_types: [],
      installments: 1,
    },
  };

  // ── Llamada a la API de MP ─────────────────────────────────────────────────
  let mpResponse;
  try {
    mpResponse = await fetch(MP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify(preference),
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error conectando con MercadoPago' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const mpData = await mpResponse.json();

  if (!mpResponse.ok) {
    console.error('MP API error:', mpData);
    return new Response(JSON.stringify({ error: 'Error al crear la preferencia de pago' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  return new Response(JSON.stringify({ init_point: mpData.init_point }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

// Maneja el preflight de CORS
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
