import { publicDocument } from './public-pages.mjs';

const sections = {
  terms: {
    title: 'Website terms — Terrace', description: 'Terms for Terrace’s standalone Mac edition.',
    heading: 'Room to focus. Clear terms.',
    text: [
      ['Who provides Terrace', 'Terrace is supplied by Kaden Zheng, trading as Terrace. Contact <a href="mailto:veil@tryrlay.com">veil@tryrlay.com</a> for product support. These terms cover Terrace’s standalone Mac download.'],
      ['Using Terrace', 'You may download, install and use Terrace for personal or professional purposes on compatible Macs you own or control. Permission to use the app does not transfer ownership of Terrace or its artwork. Core features do not require Pro. A private Pro account supports up to five active Macs; do not share its restore key.'],
      ['Your garden stays yours', 'Core focus sessions and earned garden progress remain available without Pro. Updating the same app or allowing Pro to end does not erase earned plants or arrangements. Keep a private Garden Passport recovery copy; it contains a secret key and should never be sent to support.'],
      ['Optional Terrace Pro', 'The base prices are $3.99 per month or $29.99 per year, in USD. Checkout shows the final total, applicable tax and any available local currency. A 14-day trial is optional when offered to eligible customers and requires a payment method. The checkout will state the selected plan, amount, trial and renewal date before confirmation. Subscriptions renew until cancelled.'],
      ['A website purchase', 'When website checkout opens, Paddle will handle the sale as merchant of record under <a href="https://www.paddle.com/legal/buyer-terms">Paddle’s buyer terms</a>. Website Pro is for the standalone Mac download, with a private restore key and up to five active Macs. Save the key before deactivating a Mac, and use it to restore Pro on another Mac. This key does not restore a garden; Garden Passport is separate. Website Pro and Apple’s App Store purchases are separate: neither unlocks the other edition. A website purchase does not unlock the iPhone edition. Available regions and payment methods are shown at checkout.'],
      ['Trials and payment recovery', 'The free 14-day trial is optional and limited to one use per private Pro account, not verified personal identity. Paid-renewal recovery may keep Pro available for up to 16 days after the last verified paid-through date. A trial that never became paid does not receive this grace. A cached signed paid lease can support up to 72 hours offline, bounded by its access deadline. Refunds or deactivation take effect on an offline Mac after a successful check or lease expiry. Earned garden progress and core focus remain available.'],
      ['Use and support', 'Use Terrace lawfully and follow the community guidelines when joining a shared garden. Do not share activation secrets, membership keys or recovery files. For help, contact veil@tryrlay.com. These terms do not remove rights that apply under consumer law.'],
      ['Cancellation and refunds', 'Use the link in your Paddle receipt, the Mac app’s Manage subscription action or <a href="https://paddle.net">Paddle buyer support</a> to manage website billing. <a href="/refunds">Refunds &amp; cancellation</a>, <a href="https://www.paddle.com/legal/refund-policy">Paddle’s refund policy</a>, its buyer terms and your mandatory consumer rights govern payment requests. Terrace adds no separate refund guarantee. Apple manages App Store billing and refunds separately; <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/">Apple’s standard license agreement</a> applies to those editions.']
    ]
  },
  refunds: {
    title: 'Refunds & cancellation — Terrace', description: 'Cancellation and refund guidance for Terrace’s website purchases.',
    heading: 'Leave with your garden intact.',
    text: [
      ['Before website purchases open', 'Kaden Zheng, trading as Terrace, supplies the standalone Mac app. Paddle will handle website sales as merchant of record.'],
      ['Cancel a renewal', 'Manage subscription in the Mac app opens Paddle’s secure customer portal. You can also use the link in your Paddle receipt, including when your private Pro restore key is unavailable. Cancel there before the next renewal to stop future charges. A cancellation scheduled for the end of a paid period keeps Pro through that period; the portal will show its effective date. Cancellation does not erase earned garden progress.'],
      ['Trial choices', 'If you explicitly choose an eligible 14-day free trial, review its renewal amount and end date before confirming. A payment method is required. The optional trial is limited to one use per private Pro account; this is not identity verification per person. Cancel before the trial converts if you do not want the first recurring charge. A free core edition remains available without starting a trial.'],
      ['Recovery and offline access', 'Paid-renewal grace is available for up to 16 days after the last verified paid-through date. A trial that never converted to paid is not eligible for paid-renewal grace. An offline signed paid lease can remain valid for up to 72 hours within its access deadline, so a refund or deactivation may not remove offline access immediately. Reconnect and use Refresh Pro to check current status. Your earned garden remains intact.'],
      ['Request help with a payment', 'Use the link in your Paddle receipt or visit <a href="https://paddle.net">Paddle buyer support</a> for payment, cancellation and refund requests. For a technical issue, contact <a href="mailto:veil@tryrlay.com">veil@tryrlay.com</a> with your app version and order reference so we can help resolve it. Do not send card numbers, passwords, activation secrets or garden recovery files. Refund requests are assessed under <a href="https://www.paddle.com/legal/refund-policy">Paddle’s refund policy</a>, its <a href="https://www.paddle.com/legal/buyer-terms">buyer terms</a> and your mandatory consumer rights. Terrace adds no separate refund guarantee.'],
      ['App Store purchases', 'Apple manages App Store subscriptions and refund requests separately. The Paddle portal cannot manage Apple purchases. Use Apple’s subscription settings or refund process for those purchases.']
    ]
  }
};

export function commercePage(request, path) {
  const key = path.replace(/^\//, '').replace(/\/$/, '');
  if (request.method !== 'GET' || !Object.hasOwn(sections, key)) return null;
  const page = sections[key];
  const content = `<main id="main"><div class="intro"><p class="eyebrow">Standalone Mac</p><h1>${page.heading}</h1><p class="lede">Terrace is coming soon. Public downloads and live website purchases are not available yet.</p></div><article class="policy">${page.text.map(([title, text]) => `<section><h2>${title}</h2><p>${text}</p></section>`).join('')}<section><h2>Related information</h2><p><a href="/terms">Website terms</a> · <a href="/refunds">Refunds &amp; cancellation</a> · <a href="/privacy">Privacy</a> · <a href="/support">Support</a></p></section></article></main>`;
  return new Response(publicDocument({ title: page.title, description: page.description, content, policyLinks: true }), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
