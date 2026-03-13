import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PRODUCT_CATALOG } from "../services/productCatalog.js";

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

function buildRow(product) {
  const price = Number(product.salePrice || product.price || 0).toFixed(2);
  const imageLink = resolveImageUrl(product.images?.[0] || "");

  return {
    id: product.id,
    title: product.name,
    description: buildDescription(product),
    link: `${SITE_URL}/product/${product.id}`,
    image_link: imageLink,
    price: `${price} INR`,
    availability: product.inStock ? "in_stock" : "out_of_stock",
    condition: "new",
    brand: BRAND,
  };
}

function generateCsv(products) {
  const headers = ["id", "title", "description", "link", "image_link", "price", "availability", "condition", "brand"];
  const lines = [headers.join(",")];

  for (const product of products) {
    const row = buildRow(product);
    lines.push(headers.map((header) => csvEscape(row[header])).join(","));
  }

  return `${lines.join("\n")}\n`;
}

mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, generateCsv(PRODUCT_CATALOG), "utf8");

console.log(`Generated ${path.relative(projectRoot, OUTPUT_PATH)} from ${PRODUCT_CATALOG.length} products.`);
