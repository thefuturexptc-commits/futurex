// Shared by the visible homepage FAQ and its JSON-LD. Keep the supplied text intact.
export const homepageFaqs = [
  { question: 'What is TheFutureX (TFX)?', answer: 'TheFutureX (TFX) is an Indian consumer-tech brand focused on smart wearables and connected lifestyle products, including AI Smart Bands, Smart Rings, Bladeless Fans, Smart Monitoring Systems, and AI Smart Glasses. All products are sold and shipped directly through thefuturex.in, backed by dedicated customer support and warranty coverage.' },
  { question: 'What products does TheFutureX sell?', answer: 'TheFutureX sells AI Smart Bands for fitness and health tracking, Smart Rings for compact wellness tracking, Bladeless Fans for cooling, heating and air purification, Smart Monitoring devices for sleep and recovery tracking, and AI Smart Glasses for hands-free calling, music and voice assistant support.' },
  { question: 'Does TheFutureX ship across India?', answer: 'Yes, TheFutureX ships pan-India to virtually every serviceable pin code when ordered directly from thefuturex.in. Orders are processed through verified logistics partners with secure, end-to-end checkout and order tracking.' },
  { question: 'Are TheFutureX smart bands and rings screenless?', answer: 'It depends on the model. TheFutureX offers both screen-equipped models, like the TFX Display Pro Smart Ring, and screenless models that are lighter and sync data to the TheFutureX Smartwear app. Check the display specification on each product page.' },
  { question: 'What metrics do TheFutureX wearables track?', answer: 'TheFutureX wearables track heart rate, SpO2 (blood oxygen), sleep stages and quality, step count and distance, calories burned, and recovery or activity cues, all synced to the TheFutureX Smartwear app for daily, weekly and trend-based reports.' },
  { question: 'Do TheFutureX bladeless fans have features beyond cooling?', answer: 'Yes. TheFutureX bladeless fans offer winter heating modes, built-in air purification, remote control operation, adjustable speed settings, bladeless safety design, and space-saving wall-mounted or tower formats.' },
  { question: 'What can TheFutureX AI Smart Glasses do?', answer: 'TFX AI Smart Glasses offer Bluetooth calling, wireless music playback, voice assistant support, and HD recording, combining multiple everyday gadgets into one hands-free, stylish wearable.' },
  { question: 'Where can I buy TheFutureX products?', answer: 'TheFutureX products can be purchased directly from the official website, thefuturex.in, which guarantees genuine products, full warranty coverage, and access to official customer support.' },
  { question: 'Does TheFutureX offer a warranty?', answer: 'Yes. Smart bands and smart rings include a 6-month limited warranty covering manufacturing defects, and bladeless fans include a 1-year warranty on the motor and internal components. Full terms and exclusions are listed in the warranty policy.' },
  { question: 'Does TheFutureX have a mobile app?', answer: 'Yes, the TheFutureX Smartwear app is available free on Google Play and connects with compatible smart bands and rings to display real-time and historical health data, manage firmware updates, and customize device settings.' },
];

export const homepageFaqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: homepageFaqs.map(({ question, answer }) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: { '@type': 'Answer', text: answer },
  })),
};
