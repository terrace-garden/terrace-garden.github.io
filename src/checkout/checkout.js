(() => {
  'use strict';
  if (window.__terraceCheckoutStarted) return;
  Object.defineProperty(window, '__terraceCheckoutStarted', { value: true });

  const status = document.getElementById('checkout-status');
  const frame = document.getElementById('checkout-container');
  if (!status || !frame) return;
  const show = (text, phase) => {
    status.textContent = text;
    status.dataset.phase = phase;
  };
  const config = window.TERRACE_CHECKOUT_CONFIG;
  if (!config || config.enabled !== true) {
    show('Checkout is not open yet.', 'held');
    return;
  }

  let url;
  try { url = new URL(window.location.href); } catch { /* invalid page URL */ }
  const transaction = url?.searchParams.get('_ptxn');
  const validTransaction = /^txn_[a-z0-9]{26}$/.test(transaction ?? '');
  const validPage = url && `${url.origin}${url.pathname}` === 'https://terrace-garden.github.io/checkout/'
    && url.username === '' && url.password === '';
  const validQuery = validTransaction && url.search === `?_ptxn=${transaction}` && !window.location.href.includes('#');
  const environment = config.environment;
  const clientToken = config.clientToken;
  const tokenPrefix = environment === 'sandbox' ? 'test_' : environment === 'production' ? 'live_' : null;
  const validToken = tokenPrefix && typeof clientToken === 'string'
    && new RegExp(`^${tokenPrefix}[a-zA-Z0-9]{16,128}$`).test(clientToken);
  if (!validPage || !validQuery || !validToken) {
    show('This checkout link is unavailable. Start again from Terrace.', 'unavailable');
    return;
  }

  show('Preparing your checkout…', 'loading');
  let finishedLoading = false;
  let completed = false;
  let checkoutTimeout;
  const script = document.createElement('script');
  const fail = () => {
    if (finishedLoading) return;
    finishedLoading = true;
    window.clearTimeout(timeout);
    window.clearTimeout(checkoutTimeout);
    script.onload = null;
    script.onerror = null;
    script.remove();
    frame.hidden = true;
    show('Checkout could not connect. Please try this link again when you’re online.', 'error');
  };
  const timeout = window.setTimeout(fail, 15000);
  script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
  script.async = true;
  script.referrerPolicy = 'no-referrer';
  script.onload = () => {
    if (finishedLoading) return;
    try {
      if (window.TERRACE_CHECKOUT_CONFIG !== config || config.enabled !== true
        || config.environment !== environment || config.clientToken !== clientToken) throw new Error('Checkout configuration changed');
      const paddle = window.Paddle;
      if (!paddle || typeof paddle.Initialize !== 'function') throw new Error('Checkout unavailable');
      if (environment === 'sandbox') {
        if (typeof paddle.Environment?.set !== 'function') throw new Error('Sandbox unavailable');
        paddle.Environment.set('sandbox');
      }
      frame.hidden = false;
      checkoutTimeout = window.setTimeout(() => {
        frame.hidden = true;
        show('Checkout could not connect. Please try this link again when you’re online.', 'error');
      }, 30000);
      // Paddle.js opens the validated _ptxn transaction automatically. Calling
      // Checkout.open here would override the payment link or create two flows.
      paddle.Initialize({
        token: clientToken,
        checkout: { settings: {
          displayMode: 'inline', theme: 'light', frameTarget: 'checkout-container',
          frameInitialHeight: '450',
          frameStyle: 'width: 100%; min-width: 312px; background-color: transparent; border: none;'
        } },
        eventCallback: event => {
          if (event?.data?.transaction_id !== transaction || completed) return;
          if (!['checkout.completed', 'checkout.loaded', 'checkout.closed', 'checkout.error', 'checkout.payment.error', 'checkout.payment.failed'].includes(event.name)) return;
          window.clearTimeout(checkoutTimeout);
          frame.hidden = false;
          if (event.name === 'checkout.completed') {
            completed = true;
            show('Payment complete. Return to Terrace.', 'complete');
          } else if (event.name === 'checkout.loaded') {
            show('Complete your purchase below.', 'ready');
          } else if (event.name === 'checkout.closed') {
            show('Checkout closed. You can return to Terrace.', 'closed');
          } else if (['checkout.error', 'checkout.payment.error', 'checkout.payment.failed'].includes(event.name)) {
            show('Payment could not finish. Check the details below or try another payment method.', 'payment-error');
          }
        }
      });
      finishedLoading = true;
      window.clearTimeout(timeout);
      script.onload = null;
      script.onerror = null;
    } catch { fail(); }
  };
  script.onerror = fail;
  document.head.appendChild(script);
})();
