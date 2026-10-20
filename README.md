# Terrace public pages

Small static pages for Terrace’s privacy policy, support and community guidelines.
No dependencies, JavaScript in the delivered pages, analytics, cookies, user records or application credentials are included.

Build and check with Node.js:

```sh
node scripts/build.mjs
node --test tests/pages.test.mjs
```

GitHub Pages publishes `main` → `/docs`. The `.nojekyll` file keeps the output static.
Rebuild and check before publishing changes to the page source.

The repository contains only public website content. Native app source, garden data, invitations and private recovery files belong elsewhere.
