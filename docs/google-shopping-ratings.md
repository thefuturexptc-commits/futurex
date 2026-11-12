# Google Shopping product stars

The star line in Google's product cards is the **Product Ratings** feature. Page `Product` / `AggregateRating` markup supports search eligibility; Shopping also needs Merchant Center Product Ratings onboarding and a review data source.

Google's [direct-feed enrollment requirements](https://support.google.com/merchants/answer/14620732) require at least **50 product reviews across the store**, not 50 per product. The current live catalog contains **10 saved reviews** as checked on November 12, 2026. This is below the direct-feed enrollment threshold. Google reviews the application and controls whether stars display; uploading data does not guarantee placement.

## Prepared integration

- Deploy the new endpoint and rewrite. Its production URL will be `https://thefuturex.in/product-reviews.xml`.
- The endpoint generates Google's [Product Review Feed 2.4](https://developers.google.com/product-review-feeds/schema/) from live saved customer reviews. It includes the complete set, including low-star reviews; the website's two-card preview does not limit the feed.
- SKU identifiers match the existing product feed, including colour variants. Existing GTIN/MPN and brand fields are included when available. No product identifiers are invented. Accurate GTINs provide stronger matching; add genuine identifiers to the product catalog if available.
- Saved names, text, dates, ratings and product photos are exported. Email addresses, phone numbers and internal account IDs are not included. A website submission is not automatically claimed as a verified purchase.
- The feed refuses to serve partial data if the live review query fails or a required saved ID/date is missing. Google treats each upload as a replacement of the previous full feed, so a partial response could remove reviews.
- If `MERCHANT_FEED_USERNAME` and `MERCHANT_FEED_PASSWORD` are configured for the existing product feed, the review feed uses the same Basic authentication. Enter these credentials in Merchant Center's scheduled-fetch setup; do not place passwords in URLs.

## Merchant Center activation

1. Collect enough genuine customer product reviews to meet the minimum; do not copy, manufacture or duplicate reviews to reach it.
2. Apply through Google's Product Ratings Interest Form linked in the [official onboarding instructions](https://support.google.com/merchants/answer/14620732).
3. After approval, open **Analytics → Reviews → Product reviews → Product review data sources → Add product reviews**.
4. Add the deployed XML URL above using scheduled fetch. Fetch daily to pick up new website reviews; Google requires a full update at least monthly.
5. Inspect processing errors and identifier match rates. Keep product/review URLs accessible and retain the full review history. Google's instructions say initial reviews may take **2–4 weeks** to go live after submission.

No Merchant Center application, feed registration, deployment or approval has been performed by this code change. Google currently does not support submitting product-review data sources through the Merchant API; this setup step is performed in Merchant Center.
