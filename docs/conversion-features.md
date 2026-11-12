# Conversion features and release checks

The changes are local source changes. No hosting deployment, production data deletion, or customer message was performed.

## Analytics

- Tracking waits for Firebase authentication/profile restoration. Admin routes, admin/superadmin accounts, and the owner email are excluded from the data layer, Meta events and the first-party visitor event writer. GTM now loads through that same gate rather than unconditionally from HTML.
- Historical dashboard data excludes entire sessions linked to admin routes, admin account IDs, roles, or emails. Raw historical records are retained. Anonymous activity without any admin identifier cannot be reliably attributed retrospectively.
- On admin login, a private exclusion marker also identifies the current and legacy browser session IDs. This can remove the owner's earlier anonymous views from reports without deleting raw events. The dashboard subscribes to these markers and reports a rules/read failure visibly.
- Sessions use sessionStorage with a 30-minute inactivity limit. Legacy localStorage IDs are no longer reused forever.
- Firestore event writes omit undefined fields and use the event ID as the document ID, allowing local/cloud records to deduplicate. Purchase fires after order creation and deduplicates by order ID; confirmation-page fallback remains. COD order acceptance counts as purchase.
- The funnel counts unique sessions completing view, cart, checkout and purchase **in order**, within the selected reporting period. It uses the existing latest-1,500-event query, so it is a bounded activity report rather than a full historical warehouse.
- Before releasing, use GTM Preview to confirm that its GA tags use the intended ecommerce custom events and exclude `window.tfxAnalyticsExcluded`. Existing container history/automatic page-view triggers are managed outside this repository. The configured GA measurement ID also receives its disable flag when identity is unresolved or admin.

## Storefront

- Existing MRP/discount display, galleries, variant videos and mobile cart bar are retained. Hidden mobile actions are removed from keyboard navigation.
- Pincode verification displays the existing 3–7-business-day estimate with the verified city/state. It is a planning estimate, not a courier serviceability guarantee. COD eligibility is confirmed at checkout. Warranty copy uses the existing family policy.
- Photo reviews use restricted per-user Storage paths, JPG/PNG/WebP validation, a 5 MB limit and compression. Review persistence is confirmed before showing success.
- Review lists initially show two cards; total count/rating includes all valid saved reviews. Website submissions get a date and source marker after a successful cloud write, and appear newest first. Shared review validation/aggregation keeps the browser, live Google-facing HTML and generated fallback pages aligned. Seeded/demo rows, rejected reviews and invalid ratings are excluded. New submissions are not automatically labelled verified purchases.
- The homepage offer popup captures WhatsApp number and explicit marketing consent using existing catalog promotions (10% fans, 5% eligible wearables). It is suppressed for signed-in users, previous captures and session dismissals; dismissing does not grant consent. It does not introduce an additional first-order-only pricing rule.
- Bundle selectors require stocked models, colours and explicit ring sizes. The displayed savings use the same catalog offers as checkout. No separate bundle pricing policy is introduced.
- The band/ring comparison and preference quiz are on the homepage. They recommend a category; model-specific capabilities remain in the existing specifications.
- WhatsApp opens directly from the persistent contact rail on every route. Contact details are unchanged.

## Email automation setup

The implementation uses [Firebase scheduled functions](https://firebase.google.com/docs/functions/schedule-functions) and [Nodemailer SMTP](https://nodemailer.com/smtp). Configure the functions environment separately from Vercel's existing order email endpoint.

1. Install locked functions dependencies with `npm ci --prefix functions`.
2. Set Firebase secrets interactively using `firebase functions:secrets:set SMTP_USER` and `firebase functions:secrets:set SMTP_PASS`. Do not put secret values in source files or CLI arguments. Optional functions environment variables: `SMTP_HOST`, `SMTP_PORT` (defaults: smtp.gmail.com, 465).
3. Deploy Firestore rules/indexes and Storage rules, then the three functions: `queueCartReminder`, `queueOrderEngagement`, `sendEngagementEmails`. The Firebase project needs scheduled-functions billing/APIs enabled. Use the repository's existing Firebase project configuration.
4. In a staging project, opt in on `/cart`, leave it for an hour, and confirm one email after the next half-hour scheduler run. Verify opting out, emptying the cart or placing an order suppresses it. Recipient addresses come from Firebase Auth, not client input. Messages link to the cart on the same browser; there is no cross-device cart restore.
5. Change a staging order status to `Delivered`. One review request is queued for 48 hours later, linking to each product's photo-review form. Old delivered orders are not bulk messaged. Cancelled/returned orders are suppressed when the job runs. An admin/order-status integration must persist the Delivered state; a tracking-page-only status does not trigger it.

`engagement_jobs` is server-only under the default Firestore deny policy. Check failed jobs through Firebase; three failures stop automatic retries. Cart reminders have a seven-day cooldown. SMTP delivery is at-least-once: a process crash after SMTP acceptance but before recording `sent` can repeat a message; deterministic Message-ID helps but is not an exactly-once guarantee. No WhatsApp reminder provider is configured; reminder delivery is implemented through email.

## SEO, performance and admin

- Existing generated product metadata and Product/Offer schemas, category CollectionPage/ItemList schemas, blog Article metadata, sitemap and robots configuration remain in place. Rating schema is based only on actual reviews. Category pages link to the products' detailed offer/rating schema.
- Retired product slugs without current catalog data no longer receive indexable homepage fallback HTML. The generated-page SEO audit checks every emitted product route and all six main category/shop routes.
- The homepage now links visibly to `/blog`, in addition to the existing generated crawler links. This makes the blog indexable; actual Google indexing requires a post-release Search Console check.
- The local build can generate maintained static blog pages, but the live Firestore read for additional remote blog posts currently returns permission denied. Deploy/verify the public blog read rule before relying on remote-only posts appearing in the generated sitemap.
- Gallery videos mount only when selected; overview videos mount near the viewport and use click-to-play. New raster uploads are resized/compressed to WebP when smaller. The existing responsive image build produces 76 KB of 480px homepage images from 654 KB of sources. Existing remote originals are not rewritten.
- Analytics includes India-time today/yesterday totals, available-stock alerts at five units or fewer and the top five products for the selected period. Today is a partial-day comparison.

## Verification

Run `npm run typecheck`, `npm run test:conversion`, `npm run build` and `npm run audit:seo`. To use the workstation's trusted certificate store in Node child processes on this machine, set `NODE_OPTIONS=--use-system-ca` for the build command. Do not disable TLS verification.

Regression tests cover admin traffic exclusion across sinks, auth gating, clean ecommerce persistence, purchase deduplication, ordered session funnel counts, stock/size-safe bundle choices, reminder consent/completion rules and review links. Function exports are also loaded locally to check dependency/runtime compatibility. Production mail delivery and Firebase rules require staging verification after deployment. Visual browser QA was blocked by automatic approval review on this workstation.
