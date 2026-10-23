# Terrace public pages

A static product page and Terrace’s privacy policy, support and community guidelines.
The landing page has a small local script for the garden-world preview. The help pages remain script-free. No dependencies, analytics, cookies, user records or application credentials are included.

Build and check with Node.js:

```sh
node scripts/build.mjs
node --test tests/pages.test.mjs
```

GitHub Pages publishes `main` → `/docs`. The `.nojekyll` file keeps the output static.
Rebuild and check before publishing changes to the page source.

The repository contains only public website content. Native app source, garden data, invitations and private recovery files belong elsewhere.

Landing source lives in `src/landing/`; policy source remains in `src/public-pages.mjs`. Garden imagery is exported from Terrace’s native renderer with synthetic preview progress. It is product artwork, not a recording of a live session. Font and color choices follow the native application. The launch contact opens a real email request; there is no pretend signup form or active store purchase link. Public app release remains manual and held.
