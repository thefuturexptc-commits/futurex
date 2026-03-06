import { WebsiteSettings } from '../types';

export const DEFAULT_FOOTER_SECTIONS: NonNullable<WebsiteSettings['footerSections']> = [
  { title: 'COMPANY', items: ['About Us', 'Contact'] },
  { title: 'SUPPORT', items: ['Shipping', 'Returns/Refund'] },
  { title: 'LEGAL', items: ['Privacy', 'Terms'] },
];

export const DEFAULT_PAGE_CONTENT: NonNullable<WebsiteSettings['pageContent']> = {
  'about-us': `Welcome to TheFutureX, your trusted destination for innovative and high-quality electronic products designed for modern lifestyles.

At TheFutureX, we believe technology should make life easier, smarter, and more convenient. Our goal is to provide reliable gadgets and smart devices that enhance everyday living while maintaining excellent quality and affordability.

Our Mission

Our mission is to bring the latest and most useful technology products to customers across India while ensuring great customer service and a smooth shopping experience.

We focus on offering products that combine innovation, durability, and value for money.

What We Offer

At TheFutureX, we specialize in a range of modern electronic products, including:

Smart wearable devices
Electronic accessories
Personal care gadgets
Home and lifestyle electronics
Innovative tech products designed for everyday use

Each product is carefully selected to ensure it meets our standards for performance, quality, and reliability.

Customer Commitment

Customer satisfaction is at the heart of everything we do. We are committed to:

Providing high-quality products
Offering secure online payments
Ensuring fast and reliable shipping
Delivering responsive customer support

Our aim is to build long-term trust with every customer who chooses TheFutureX.

Our Vision

Our vision is to become a trusted technology brand that provides innovative products to customers while making online shopping simple and reliable.

Contact Us

If you have any questions or need assistance, feel free to contact us:

Email: support@thefuturex.in
Location: Virar East, Maharashtra, India
Website: https://thefuturex.in`,
  contact: `Contact Us

We are here to help. If you have any questions about our products, orders, shipping, or returns, please feel free to contact us. Our support team will be happy to assist you.

Customer Support
Email: support@thefuturex.in

For order-related queries, please include your Order ID in the email so we can assist you faster.

Business Address
TheFutureX
Office No. 310, Padmi Bai Tower
Virar East, Maharashtra
India

Working Hours
Monday - Saturday: 10:00 AM - 6:00 PM
Sunday: Closed`,
  shipping: `Shipping Policy

At TheFutureX, we aim to deliver your orders quickly and safely. This Shipping Policy explains how we process and ship your orders.

1. Order Processing
All orders placed on TheFutureX.in are processed within 1-2 business days after successful payment confirmation.
Orders are not processed or shipped on Sundays or public holidays.
If we experience a high volume of orders, shipments may be delayed slightly. In such cases, customers will be notified.

2. Shipping Time
Estimated delivery time depends on the customer's location.
Metro Cities: 3-5 business days
Other Cities: 4-7 business days
Delivery timelines may vary depending on courier availability and unforeseen circumstances.

3. Shipping Charges
Shipping charges may vary depending on the product and delivery location.
In some cases, free shipping may be offered during promotional offers or on selected products.
The final shipping cost will be shown at the checkout page before payment.

4. Order Tracking
Once your order is shipped, you will receive a tracking ID via email or SMS.
You can track your order using the tracking link provided.

5. Delivery Issues
If you face any issues with delivery, such as delayed shipment, package not delivered, or incorrect delivery address, please contact our support team immediately.

6. Incorrect Address
Customers must ensure that the shipping address provided during checkout is accurate.
TheFutureX will not be responsible for orders delivered to an incorrect address provided by the customer.

7. Damaged Packages
If your package arrives damaged or tampered, please take photos or videos while opening the package and contact our support team within 24 hours of delivery.

8. Contact Us
Email: support@thefuturex.in
Address: Virar East, Maharashtra, India
Website: https://thefuturex.in`,
  'returns-refund': `Refund & Return Policy

At TheFutureX, customer satisfaction is our priority. If you are not completely satisfied with your purchase, you may request a return or refund under the conditions mentioned below.

Return Eligibility
You may request a return if:
The product is damaged, defective, or incorrect.
The return request is made within 7 days of delivery.
The product is unused and in its original packaging.
All accessories, manuals, and packaging materials are included.
Returns requested after the allowed period may not be accepted.

How to Request a Return
To initiate a return request, please contact our support team with the following details:
Order ID
Reason for return
Photos or unboxing video (if product is damaged or defective)
Email: support@thefuturex.in

Our support team will review your request and provide instructions for the return process.

Return Process
Once the return request is approved:
The customer will be informed about the return shipping process.
The product must be packed securely in its original packaging.
The product should be returned to the address provided by our support team.

Refund Policy
After the returned product is received and inspected:
If the return is approved, the refund will be processed within 5-7 business days.
Refunds will be credited to the original payment method used during checkout.
For Cash on Delivery (COD) orders, refunds may be processed through bank transfer or UPI.

Non-Returnable Items
The following cases may not qualify for return or refund:
Products damaged due to misuse or improper handling
Used products
Products returned without original packaging
Requests made after the return period

Damaged or Defective Products
If you receive a damaged or defective product, please report it within 24 hours of delivery with photos or videos for quick resolution.

Contact Us
If you have any questions about refunds or returns, please contact us:
Email: support@thefuturex.in
Phone: +91 8530340676
Address: Office No. 310, Padmi Bai Tower, Virar East, Maharashtra, India`,
  returns: `See Returns/Refund policy for complete return and refund details.`,
  privacy: `Privacy Policy

At TheFutureX, accessible from https://thefuturex.in, protecting the privacy of our customers is one of our main priorities. This Privacy Policy document outlines the types of information that are collected and recorded by TheFutureX and how we use it.

By using our website, you agree to the collection and use of information in accordance with this policy.

1. Information We Collect
When you visit or make a purchase on our website, we may collect the following information:
Personal Information - Name, email address, phone number, and shipping address.
Order Information - Products purchased, payment details, and transaction history.
Device Information - IP address, browser type, device type, and operating system.
Usage Data - Pages visited, time spent on the website, and other analytical information.

2. How We Use Your Information
We use the collected information to:
Process and fulfill orders
Provide customer support
Send order confirmations and updates
Improve our website and services
Detect and prevent fraudulent transactions
Send promotional emails or offers (if you opt-in)

3. Payment Security
All payments on TheFutureX are processed securely through trusted payment gateways such as Razorpay.
We do not store credit card or debit card details on our servers.

4. Cookies
Our website may use cookies to improve user experience. Cookies help us:
Remember your preferences
Understand how visitors use the website
Improve website performance
You can disable cookies through your browser settings if you prefer.

5. Sharing of Information
We do not sell, trade, or rent your personal information to third parties.
Your information may only be shared with:
Payment processing providers
Shipping and delivery partners
Legal authorities if required by law

6. Data Security
We take appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.
Our website uses SSL encryption to secure data transmission.

7. Third-Party Services
Our website may contain links to third-party websites or services. We are not responsible for the privacy practices or content of those websites.

8. Your Rights
You have the right to:
Access the personal information we hold about you
Request correction of incorrect information
Request deletion of your data
To exercise these rights, please contact us.

9. Changes to This Policy
We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date.`,
  terms: `Terms & Conditions

Welcome to TheFutureX. These Terms and Conditions outline the rules and regulations for using our website https://thefuturex.in and purchasing our products.

By accessing this website and placing an order, you accept these terms and conditions in full. If you do not agree with any part of these terms, please do not use our website.

1. Company Information
TheFutureX is an online store that sells electronic products and accessories.
Business Name: TheFutureX
Website: https://thefuturex.in
Email: support@thefuturex.in

2. Use of Website
By using this website, you agree to:
Provide accurate and complete information when placing an order.
Use the website only for lawful purposes.
Not misuse or attempt to damage the website or its services.
We reserve the right to suspend or terminate access if misuse or fraudulent activity is detected.

3. Product Information
We try our best to ensure that product descriptions, images, and prices on our website are accurate. However:
Product colors may slightly vary due to screen settings.
Prices and product availability may change without prior notice.
We reserve the right to cancel orders if incorrect pricing or information is displayed.

4. Orders and Payments
When you place an order on TheFutureX:
You agree that all information provided is correct.
Payments must be completed through the available payment methods on our website.
Orders may be canceled if:
Payment is not successful
Fraudulent activity is suspected
Product is out of stock

5. Shipping Policy
Orders are processed within 1-2 business days after payment confirmation.
Delivery times may vary depending on location and courier services.
Customers will receive tracking details once the order is shipped.

6. Return & Refund
Returns and refunds are handled according to our Refund and Return Policy.
Customers may request a return within 7 days of delivery if the product is defective, damaged, or incorrect.

7. Warranty
Some products sold on TheFutureX may include a manufacturer warranty. Warranty terms may vary depending on the product.
Warranty does not cover:
Physical damage
Water damage (unless specified as waterproof)
Damage caused by improper use

8. Intellectual Property
All content on this website including logos, images, text, graphics, and product designs belongs to TheFutureX and may not be copied, reproduced, or used without permission.

9. Limitation of Liability
TheFutureX will not be held responsible for:
Any indirect or incidental damages resulting from the use of our products
Delays caused by courier partners
Loss caused by misuse of products

10. Privacy
By using our website, you agree to our Privacy Policy, which explains how we collect and use your personal data.

11. Changes to Terms
We reserve the right to update or modify these Terms and Conditions at any time without prior notice. Continued use of the website means you accept the updated terms.

12. Contact Us
If you have any questions about these Terms and Conditions, please contact us:
Email: support@thefuturex.in
Address: Virar East, Maharashtra, India`,
};

export const DEFAULT_SOCIAL_LINKS: NonNullable<WebsiteSettings['socialLinks']> = {
  email: 'support@thefuturex.in',
  twitter: '',
  facebook: 'https://www.facebook.com/people/The-Future-X-India/61585558692279/',
  instagram: 'https://www.instagram.com/thefuturex.in/',
  youtube: '',
  linkedin: '',
};
