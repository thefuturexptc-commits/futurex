import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const merchantId = process.env.GOOGLE_MERCHANT_ID || process.env.MERCHANT_ID || '5807768582';
const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS)
  : path.join(__dirname, 'service-account.json');

const auth = new google.auth.GoogleAuth({
  keyFile,
  scopes: ['https://www.googleapis.com/auth/content'],
});

const products = [
  {
    offerId: 'ring001',
    title: 'The Future X TP-09 Pro Heating & Cooling Air Safe for Kids Pets',
    description: 'Heating and cooling air device from FutureX, safe for kids and pets.',
    link: 'https://thefuturex.in/product/the-future-x-tp-09-pro-heating-cooling-air-safe-for-kids-pets',
    imageLink: 'https://firebasestorage.googleapis.com/v0/b/futurexweb-ae46b.firebasestorage.app/o/products%2F1777095640864_TP-09%20Pro%20slide%201.jpg.webp?alt=media&token=3336a46e-26d9-43aa-85e3-eecb1250914c',
    additionalImageLinks: [],
    price: '11499',
  },
];

async function uploadProduct() {
  try {
    if (!merchantId) {
      throw new Error('Please add your Merchant Center ID to merchantId.');
    }

    const client = await auth.getClient();
    const content = google.content({
      version: 'v2.1',
      auth: client,
    });

    for (const product of products) {
      const response = await content.products.insert({
        merchantId,
        requestBody: {
          offerId: product.offerId,
          title: product.title,
          description: product.description,
          link: product.link,
          imageLink: product.imageLink,
          additionalImageLinks: product.additionalImageLinks || [],
          contentLanguage: 'en',
          targetCountry: 'IN',
          channel: 'online',
          availability: 'in stock',
          condition: 'new',
          price: {
            value: product.price,
            currency: 'INR',
          },
          brand: 'FutureX',
        },
      });

      console.log('Product uploaded:', response.data);
    }
  } catch (error) {
    const message = error.response?.data || error.message;
    console.error('Error uploading product:', message);
  }
}

uploadProduct();
