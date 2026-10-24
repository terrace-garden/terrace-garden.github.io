# Terrace public pages

A static prelaunch product page and Terrace’s privacy policy, support, standalone Mac terms, refund/cancellation policy and community guidelines.
The landing page has a small local script for the garden-world preview. The help pages remain script-free. No dependencies, analytics, cookies, user records or private application credentials are included.

Build and check with Node.js:

```sh
node scripts/build.mjs
node --test tests/*.test.mjs
```

GitHub Pages publishes `main` → `/docs`. The `.nojekyll` file keeps the output static.
Rebuild and check before publishing changes to the page source.

The repository contains only public website content. Native app source, garden data, invitations and private recovery files belong elsewhere.

Landing source lives in `src/landing/`; privacy/support source remains in `src/public-pages.mjs`; standalone terms/refunds are in `src/commerce-pages.mjs`. Garden imagery is exported from Terrace’s native renderer with synthetic preview progress. It is product artwork, not a recording of a live session. Font and color choices follow the native application. The launch contact opens a real email request; there is no pretend signup form or active store purchase link. Public app release remains manual and held.

## Unlinked Sandbox checkout preparation

The separate `/checkout/` route is prepared only for authorized Paddle Sandbox
tests. It is not linked from the landing or help pages. Its public configuration
contains a Sandbox client token, never an API, webhook or licensing secret. A valid
exact `_ptxn` link is required before Paddle.js loads; the page clearly labels the
test as no charge. Checkout completion does not grant Pro. Public app downloads,
live payments and release remain held. Test with `node --test tests/*.test.mjs`.

## Prelaunch policies

Terms identify Kaden Zheng, trading as Terrace, and explain standalone Mac use,
optional Pro, Paddle billing and separate Apple purchases. Privacy and support
cover optional local sharing, private restore keys and bounded offline access.
Policy navigation is on the help/policy pages; only the landing’s policy navigation and USD label change; its design and the
unlinked Sandbox checkout remain unchanged. Public downloads and live purchases are unavailable.
The policy pages are prepared for owner review; this local candidate does not
approve publication or certify legal compliance. Do not add a supplier address
or company registration that the owner has not provided. No live token, package
metadata, download module, runtime service code or customer data belongs here.
