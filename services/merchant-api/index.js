import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const merchantId = '5614449922'; // Add your Merchant Center ID here.

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'service-account.json'),
  scopes: ['https://www.googleapis.com/auth/content'],
});

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

    const response = await content.products.insert({
      merchantId,
      requestBody: {
        offerId: 'ring001',
        title: 'Smart Ring',
        description: 'Advanced health tracking smart ring',
        link: 'https://thefuturex.in/product/the-future-x-tp-09-pro-heating-cooling-air-safe-for-kids-pets',
        imageLink: 'https://firebasestorage.googleapis.com/v0/b/futurexweb-ae46b.firebasestorage.app/o/products%2F1777095640864_TP-09%20Pro%20slide%201.jpg.webp?alt=media&token=3336a46e-26d9-43aa-85e3-eecb1250914c',
        contentLanguage: 'en',
        targetCountry: 'IN',
        channel: 'online',
        availability: 'in stock',
        condition: 'new',
        price: {
          value: '11499',
          currency: 'INR',
        },
        brand: 'FutureX',
      },
    });

    console.log('Product uploaded:', response.data);
  } catch (error) {
    const message = error.response?.data || error.message;
    console.error('Error uploading product:', message);
  }
}

uploadProduct();
