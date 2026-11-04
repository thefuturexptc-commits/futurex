# Performance audit follow-up

## Implemented

- Replace the blocking Tailwind Play CDN and browser compilation with Tailwind 3/PostCSS build output. Preserve the existing theme. Vite minifies production JavaScript and CSS.
- Load Home as a route chunk. Import bundled blog articles only when requested, and Firebase Storage only for uploads.
- Load the Best Sellers comparison section near the viewport.
- Replace the automatically opened YouTube modal with a pairing-guide button. The player is now created only after a click.
- Generate responsive WebP versions of the first hero and three collection images before development and production builds. Use `srcset`/`sizes`, preload the first hero only on the homepage, and avoid mounting unseen hero slides until selected.
- Move static home and app-shell styles into compiled CSS files. Keep computed runtime styles where they support animation or user-selected values.
- Show generated home, collection, blog, and product content in initial HTML instead of hiding it with `display:none`. Avoid duplicating the same content in noscript fallbacks. This is static prerendering with a client-rendered app, not React hydration.
- Add the homepage H1 and nest static product-card H3s below section H2s. H5/H6 headings are not required when there are no sections at those depths.
- Normalize existing WordPress policy/post redirects and remove the self-redirect for `?page_id=5`. Resolve that query through a 301 endpoint that removes the old parameter and retains campaign parameters.
- Correct existing blog typing errors so typechecking can validate the changes.

## Audited and retained

- Routes were already mostly lazy-loaded. GTM was already asynchronous and delayed until after window load. Meta Pixel is asynchronous; its two configured pixel IDs were retained because ownership and GTM container contents are not available here.
- The footer Facebook URL identifies a specific profile: https://www.facebook.com/people/The-Future-X-India/61585558692279/. It is not the bare `/people` URL from the audit. Ownership has not been independently verified.
- Most local banners were already WebP. Responsive resizing still materially reduces transferred image bytes. This is Vite/React, so `next/image` does not apply.
- Product pages already use a live server-rendered endpoint. Build-time prerendering already exists for the homepage and collection pages; this change makes its content visible.
- `/checkout` remains the current checkout route. Vercel's trailing-slash normalization handles `/checkout/`; redirecting it to a policy or shop page would break existing links.

## Email and DNS

The user confirmed `thefuturex.ptc@gmail.com` as the sender. The code defaults to Gmail SMTP. Authentication of mail actually sent from that address belongs to Gmail's domain, so adding Google Workspace SPF to `thefuturex.in` would not authenticate those messages. No DNS changes were made.

Before using an `@thefuturex.in` From address, inventory every sending service, configure that provider's SPF and DKIM, and verify alignment with DMARC. Check deployed `ORDER_NOTIFICATION_FROM` and SMTP settings and inspect headers of a delivered message; source defaults alone do not prove production authentication.

Reference: [Google's sender authentication guidance](https://support.google.com/mail/answer/81126).

## Deployment verification still required

1. Deploy the build and verify the homepage and product source contain visible headings/copy with JavaScript disabled. Check the mobile hero, menu, product selection, cart, checkout, and comparison section in a browser.
2. Test HTTP/HTTPS, www/non-www, both policy trailing-slash forms, the old hello-world URL, and `/?page_id=5`. Record each Location response. Domain-level HTTP upgrades are controlled by hosting and may still add a hop.
3. Run Google PageSpeed Insights for mobile and desktop against the deployed homepage and a product page. Repeat mobile runs and compare the median LCP, FCP, TBT and transferred bytes against the supplied baseline (mobile 23, LCP 15.5s, FCP 7.7s, TBT 1.23s). No new live score is claimed by these code changes.
4. Fetch the deployed Merchant feeds and confirm the updated MRP and unchanged sale prices remain aligned with landing pages.
5. Review the GTM container for duplicate GA/Meta tags with the marketing account owner. Link building and subscriber growth remain marketing work.

Build setup follows the [Tailwind 3 configuration documentation](https://v3.tailwindcss.com/docs/configuration).

## Local validation

- Typechecking and production builds passed. All 13 Merchant pricing and legacy redirect tests passed.
- Checked generated HTML for visible initial content, absence of the Tailwind CDN, homepage-only responsive hero preloads, compiled utilities/theme, and emitted image files.
- Headless Edge at a 390px viewport displayed the mobile hero and guide button. The rendered initial DOM contained no YouTube iframe.
- The main app JavaScript artifact decreased from approximately 562 KB in the existing local build to 361 KB. This excludes shared/lazy chunks and is not a measured PageSpeed improvement.
- The five optimized images total approximately 76 KB at 480px, versus 654 KB for their source files. Actual downloads vary with viewport and device pixel ratio.
- This machine needs `NODE_USE_SYSTEM_CA=1` to fetch remote build data reliably. A build using that setting fetched the live catalog; a subsequent build without it used local fallbacks after a certificate error. Production already refuses fallback-only catalog generation through its `VERCEL` guard. Remote blog fetching also reported missing permissions; public static blog posts were generated.
- npm reported 15 dependency vulnerabilities during installation (2 moderate, 12 high, 1 critical). Dependency remediation needs a separate review.
