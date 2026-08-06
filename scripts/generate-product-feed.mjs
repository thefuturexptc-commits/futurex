import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const SITE_URL = (process.env.PRODUCT_FEED_SITE_URL || "https://thefuturex.in").replace(/\/+$/, "");
const BRAND = process.env.PRODUCT_FEED_BRAND || "TheFutureX";
const OUTPUT_PATH = path.resolve(projectRoot, "public", "product-feed.csv");

function resolveImageUrl(image) {
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;

  if (image.startsWith("/")) {
    return `${SITE_URL}${image}`;
  }

  return `${SITE_URL}/${image.replace(/^\.?\//, "")}`;
}

function buildDescription(product) {
  const parts = [product.description];

  if (product.features?.length) {
    parts.push(`Features: ${product.features.join("; ")}.`);
  }

  const specs = Object.entries(product.specs || {});
  if (specs.length) {
    parts.push(`Specs: ${specs.map(([key, value]) => `${key}: ${value}`).join("; ")}.`);
  }

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}

function slugify(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const DISPLAY_PRO_LEGACY_SLUG = "tfx-display-pro-smart-ring-premium-tracking-with-display-and-wireless-charging";
const DISPLAY_PRO_CANONICAL_SLUG = "tfx-display-pro-smart-ring";

function getProductSlug(product) {
  const slug = slugify(product.slug || product.name || product.id);
  return slug === DISPLAY_PRO_LEGACY_SLUG ? DISPLAY_PRO_CANONICAL_SLUG : slug;
}

function buildRow(product) {
  const price = Number(product.salePrice || product.price || 0).toFixed(2);
  const imageLink = resolveImageUrl(product.images?.[0] || "");
  const slug = getProductSlug(product);
  const emiAvailable = typeof product.emiAvailable === "boolean"
    ? product.emiAvailable
    : typeof product.emi_available === "boolean"
      ? product.emi_available
      : true;

  return {
    id: product.id,
    title: product.name,
    description: buildDescription(product),
    link: `${SITE_URL}/product/${slug}`,
    image_link: imageLink,
    price: `${price} INR`,
    availability: product.inStock ? "in_stock" : "out_of_stock",
    emiAvailable: emiAvailable ? "true" : "false",
    condition: "new",
    brand: BRAND,
  };
}

function generateCsv(products) {
  const headers = ["id", "title", "description", "link", "image_link", "price", "availability", "emiAvailable", "condition", "brand"];
  const lines = [headers.join(",")];

  for (const product of products) {
    const row = buildRow(product);
    lines.push(headers.map((header) => csvEscape(row[header])).join(","));
  }

  return `${lines.join("\n")}\n`;
}

mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, generateCsv([]), "utf8");

console.log(`Generated ${path.relative(projectRoot, OUTPUT_PATH)} without sample products. Live products sync from the admin catalog.`);
