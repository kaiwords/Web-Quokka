// No Stripe keys are configured for this project, and charging a real card
// needs client-side tokenization (Stripe Elements) plus webhook
// verification — a meaningfully bigger addition than a server-only env
// check can fake. So this is an honest stub, not a gated real
// implementation: it always "succeeds" as a test/demo payment. The call
// site (POST /api/portal/invoices/[id]/pay) is the seam — swap this
// function's body for a real Stripe PaymentIntent confirmation once
// Elements + webhooks are wired in, without changing anything that calls it.
export async function chargeInvoice(): Promise<{ success: true }> {
  return { success: true };
}
