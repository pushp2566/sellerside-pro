// Sandbox-only integration probe. Requires Node 22+; no external packages.
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const command = process.argv[2];
if (!['create', 'capture', 'refund', 'status'].includes(command)) {
  console.log('Usage: node scripts/paypal-smoke.mjs create|capture|refund|status');
  process.exit(0);
}
const client = process.env.PAYPAL_CLIENT_ID;
const secret = process.env.PAYPAL_CLIENT_SECRET;
if (!client || !secret) {
  console.error('Missing sandbox credentials. Copy .env.example to .env.local and fill it in privately.');
  process.exit(1);
}
const base = 'https://api-m.sandbox.paypal.com';
const file = '.local/paypal-smoke.json';
await mkdir('.local', { recursive: true });
let state = existsSync(file) ? JSON.parse(await readFile(file, 'utf8')) : {};
const save = () => writeFile(file, JSON.stringify(state, null, 2));

async function decode(response) {
  const body = await response.json();
  if (!response.ok) {
    // Do not log raw responses: they can contain customer details.
    throw new Error(`PayPal HTTP ${response.status}: ${body.name || body.error || 'request failed'}; debug ID: ${body.debug_id || 'unavailable'}`);
  }
  return body;
}

try {
  const auth = await decode(await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`${client}:${secret}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials', signal: AbortSignal.timeout(30000),
  }));
  async function call(path, body, requestId) {
    return decode(await fetch(`${base}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { Authorization: `Bearer ${auth.access_token}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(requestId ? { 'PayPal-Request-Id': requestId } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000),
    }));
  }
  if (command === 'create') {
    if (state.orderId) throw new Error('This test already has an order. Use status or continue with capture/refund.');
    state.createKey ||= randomUUID();
    await save();
    const order = await call('/v2/checkout/orders', {
      intent: 'CAPTURE',
      purchase_units: [{ description: 'SellerSide Pro sandbox probe: 24 cupcakes', amount: { currency_code: 'USD', value: '60.00' } }],
      application_context: { user_action: 'PAY_NOW', return_url: 'http://localhost:3000/paypal-test/approved', cancel_url: 'http://localhost:3000/paypal-test/cancelled' },
    }, state.createKey);
    state.orderId = order.id;
    state.approvalUrl = order.links?.find(link => link.rel === 'approve' || link.rel === 'payer-action')?.href;
    await save();
    console.log('Sandbox order:', state.orderId, '\nBuyer approval URL:', state.approvalUrl);
    console.log('Approve using the sandbox PERSONAL buyer, then run capture. The localhost return page is not built yet; it may show a connection error after approval.');
  } else {
    if (!state.orderId) throw new Error('Run create first.');
    if (command === 'capture') {
      state.captureKey ||= randomUUID();
      await save();
      const order = await call(`/v2/checkout/orders/${encodeURIComponent(state.orderId)}/capture`, {}, state.captureKey);
      const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
      if (!capture?.id) throw new Error('No capture returned. Run status before retrying.');
      state.captureId = capture.id;
      state.captureStatus = capture.status;
      await save();
      console.log('Capture:', capture.id, capture.status);
    } else if (command === 'refund') {
      if (!process.argv.includes('--approve-test-refund')) throw new Error('To approve the fixed USD 15 sandbox refund, add --approve-test-refund.');
      if (!state.captureId) throw new Error('Capture the approved order first.');
      const capture = await call(`/v2/payments/captures/${encodeURIComponent(state.captureId)}`);
      if (!['COMPLETED', 'PARTIALLY_REFUNDED'].includes(capture.status)) throw new Error(`Capture is ${capture.status}; do not refund yet.`);
      state.refundKey ||= randomUUID();
      await save();
      const refund = await call(`/v2/payments/captures/${encodeURIComponent(state.captureId)}/refund`, { amount: { currency_code: 'USD', value: '15.00' } }, state.refundKey);
      state.refundId = refund.id;
      await save();
      console.log('Refund:', refund.id, refund.status);
    } else {
      const order = await call(`/v2/checkout/orders/${encodeURIComponent(state.orderId)}`);
      console.log('Order:', order.id, order.status);
      const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
      if (capture) { state.captureId = capture.id; await save(); console.log('Capture:', capture.id, capture.status); }
      if (state.refundId) {
        const refund = await call(`/v2/payments/refunds/${encodeURIComponent(state.refundId)}`);
        console.log('Refund:', refund.id, refund.status);
      }
    }
  }
} catch (error) {
  console.error(error.message);
  console.error('If a request timed out, check status before retrying. Keep .local state so retries reuse the same request ID.');
  process.exitCode = 1;
}
