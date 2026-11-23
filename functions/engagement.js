const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { onDocumentCreated, onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret } = require('firebase-functions/params');
const nodemailer = require('nodemailer');
const { buildReviewMessage, eligibleCart } = require('./engagementPolicy');

if (!getApps().length) initializeApp();
const db = getFirestore();
const smtpUser = defineSecret('SMTP_USER');
const smtpPass = defineSecret('SMTP_PASS');
const region = 'asia-south1';
const site = 'https://thefuturex.in';
const hour = 3600000;
const orderNotificationEmail = process.env.ORDER_NOTIFICATION_EMAIL || 'thefuturex.ptc@gmail.com';

const formatOrderAmount = value => `₹${Number(value || 0).toLocaleString('en-IN', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
})}`;

const escapeOrderHtml = value => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const buildOrderNotificationHtml = order => {
  const shipping = order.shippingDetails || order.shippingAddress || {};
  const items = Array.isArray(order.items) ? order.items : [];
  const itemRows = items.map(item => {
    const variant = [item.selectedColorName, item.selectedSize].filter(Boolean).join(' / ');
    const amount = Number(item.price || item.salePrice || 0) * Number(item.quantity || 1);
    return `<tr><td style="padding:10px;border-bottom:1px solid #e5e7eb;">${escapeOrderHtml(item.name)}</td><td style="padding:10px;border-bottom:1px solid #e5e7eb;">${escapeOrderHtml(variant || '-')}</td><td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:center;">${escapeOrderHtml(item.quantity || 1)}</td><td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatOrderAmount(amount)}</td></tr>`;
  }).join('');

  return `<div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5;"><h2 style="margin:0 0 12px;">New TheFutureX Order</h2><p><strong>Order ID:</strong> ${escapeOrderHtml(order.id)}<br /><strong>Status:</strong> ${escapeOrderHtml(order.status || 'Processing')}<br /><strong>Payment:</strong> ${escapeOrderHtml(order.paymentMethod || '-')} / ${escapeOrderHtml(order.paymentStatus || '-')}<br /><strong>Total:</strong> ${formatOrderAmount(order.total)}</p><h3 style="margin-top:22px;">Customer</h3><p><strong>Name:</strong> ${escapeOrderHtml(order.customerName || shipping.name || 'Customer')}<br /><strong>Email:</strong> ${escapeOrderHtml(order.customerEmail || '-')}<br /><strong>Phone:</strong> ${escapeOrderHtml(order.customerPhone || order.phoneNumber || shipping.phoneNumber || '-')}</p><h3 style="margin-top:22px;">Shipping Address</h3><p>${escapeOrderHtml(shipping.address || shipping.street || '-')}<br />${escapeOrderHtml(shipping.city || '')}${escapeOrderHtml(shipping.state ? `, ${shipping.state}` : '')}<br />${escapeOrderHtml(shipping.pincode || shipping.zip || '')}</p><h3 style="margin-top:22px;">Items</h3><table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;"><thead><tr style="background:#f8fafc;"><th style="padding:10px;text-align:left;">Product</th><th style="padding:10px;text-align:left;">Variant</th><th style="padding:10px;text-align:center;">Qty</th><th style="padding:10px;text-align:right;">Amount</th></tr></thead><tbody>${itemRows}</tbody></table></div>`;
};

exports.sendNewOrderNotification = onDocumentCreated({ document: 'orders/{orderId}', region, secrets: [smtpUser, smtpPass], retry: true, timeoutSeconds: 120 }, async event => {
  const order = event.data?.data();
  if (!order) return;

  const notificationRef = db.doc(`order_email_notifications/${event.params.orderId}`);
  const canSend = await db.runTransaction(async transaction => {
    const existing = (await transaction.get(notificationRef)).data();
    if (existing?.status === 'sent') return false;
    if (existing?.status === 'sending' && existing.leaseUntil && Date.parse(existing.leaseUntil) > Date.now()) return false;
    transaction.set(notificationRef, {
      status: 'sending',
      attempts: Number(existing?.attempts || 0) + 1,
      updatedAt: new Date().toISOString(),
      leaseUntil: new Date(Date.now() + 10 * 60000).toISOString(),
    }, { merge: true });
    return true;
  });
  if (!canSend) return;

  try {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 465),
      secure: Number(process.env.SMTP_PORT || 465) === 465,
      auth: { user: smtpUser.value(), pass: smtpPass.value() },
      connectionTimeout: 10000,
      socketTimeout: 20000,
    });
    await transport.sendMail({
      from: process.env.ORDER_NOTIFICATION_FROM || `TheFutureX Orders <${smtpUser.value()}>`,
      to: orderNotificationEmail,
      replyTo: order.customerEmail || undefined,
      subject: `New order placed: ${order.id || event.params.orderId}`,
      html: buildOrderNotificationHtml({ ...order, id: order.id || event.params.orderId }),
      messageId: `<order-${event.params.orderId}@thefuturex.in>`,
    });
    await notificationRef.set({ status: 'sent', sentAt: new Date().toISOString(), leaseUntil: null }, { merge: true });
  } catch (error) {
    await notificationRef.set({ status: 'failed', failedAt: new Date().toISOString(), leaseUntil: null, error: String(error?.code || error?.message || 'unknown') }, { merge: true });
    throw error;
  }
});

exports.queueCartReminder = onDocumentWritten({ document: 'recovery_carts/{uid}', region }, async event => {
  const ref = db.doc(`engagement_jobs/cart_${event.params.uid}`);
  // Re-read: Firestore triggers can arrive out of order.
  const cart = (await db.doc(`recovery_carts/${event.params.uid}`).get()).data();
  await db.runTransaction(async transaction => {
    const job = (await transaction.get(ref)).data();
    if (!eligibleCart(cart)) {
      if (job) transaction.update(ref, { status: 'cancelled' });
      return;
    }
    if (job?.sentAt && Date.now() - Date.parse(job.sentAt) < 7 * 24 * hour) return;
    transaction.set(ref, { type: 'cart', userId: event.params.uid, status: 'pending', dueAt: new Date(Date.now() + hour).toISOString(), cartVersion: cart.updatedAt, attempts: 0 });
  });
});

exports.queueOrderEngagement = onDocumentWritten({ document: 'orders/{orderId}', region }, async event => {
  const before = event.data.before.data();
  const order = event.data.after.data();
  if (!order) return;
  if (order.status === 'Delivered' && before?.status !== 'Delivered') {
    const ref = db.doc(`engagement_jobs/review_${event.params.orderId}`);
    // A delivery status toggle must not request a second review.
    await db.runTransaction(async transaction => {
      if ((await transaction.get(ref)).exists) return;
      transaction.create(ref, { type: 'review', orderId: event.params.orderId, userId: order.userId, status: 'pending', dueAt: new Date(Date.now() + 48 * hour).toISOString(), attempts: 0 });
    });
  }
});

exports.sendEngagementEmails = onSchedule({ schedule: 'every 30 minutes', timeZone: 'Asia/Kolkata', region, secrets: [smtpUser, smtpPass], timeoutSeconds: 300, maxInstances: 1 }, async () => {
  const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST || 'smtp.gmail.com', port: Number(process.env.SMTP_PORT || 465), secure: Number(process.env.SMTP_PORT || 465) === 465, auth: { user: smtpUser.value(), pass: smtpPass.value() }, connectionTimeout: 10000, socketTimeout: 20000 });
  const jobs = await db.collection('engagement_jobs').where('status', '==', 'pending').where('dueAt', '<=', new Date().toISOString()).orderBy('dueAt').limit(50).get();
  for (const snapshot of jobs.docs) {
    const job = await db.runTransaction(async transaction => {
      const current = (await transaction.get(snapshot.ref)).data();
      if (current.status !== 'pending' || (current.leaseUntil && Date.parse(current.leaseUntil) > Date.now())) return null;
      transaction.update(snapshot.ref, { leaseUntil: new Date(Date.now() + 10 * 60000).toISOString() });
      return current;
    });
    if (!job) continue;
    try {
      // Recipient always comes from Firebase Auth, never a client-supplied email.
      const account = await getAuth().getUser(job.userId);
      if (!account.email || account.disabled) {
        await snapshot.ref.update({ status: 'cancelled', reason: 'No active email account' });
        continue;
      }
      let subject;
      let text;
      if (job.type === 'cart') {
        const cart = (await db.doc(`recovery_carts/${job.userId}`).get()).data();
        const orders = await db.collection('orders').where('userId', '==', job.userId).get();
        const purchased = orders.docs.some(doc => {
          const order = doc.data();
          return !['Cancelled', 'Returned'].includes(order.status) && Date.parse(order.createdAt || order.date) >= Date.parse(job.cartVersion);
        });
        if (!eligibleCart(cart) || cart.updatedAt !== job.cartVersion || purchased) {
          // A newer cart trigger owns its new pending job; do not overwrite it.
          await db.runTransaction(async transaction => {
            const current = (await transaction.get(snapshot.ref)).data();
            if (current.cartVersion === job.cartVersion) transaction.update(snapshot.ref, { status: 'cancelled' });
          });
          continue;
        }
        subject = 'Your TheFutureX cart is waiting';
        text = `You asked us to remind you about your cart.\n\n${cart.items.map(item => `${item.name} × ${item.quantity}`).join('\n')}\n\nReturn on the same browser to find your cart: ${site}/cart\nPrices and availability are confirmed at checkout.\n\nTurn off future cart reminders: ${site}/cart (sign in and uncheck the reminder option).`;
      } else {
        const order = (await db.doc(`orders/${job.orderId}`).get()).data();
        if (!order || order.status !== 'Delivered') {
          await snapshot.ref.update({ status: 'cancelled' });
          continue;
        }
        ({ subject, text } = buildReviewMessage(order, site));
      }
      await transport.sendMail({ from: `TheFutureX <${smtpUser.value()}>`, to: account.email, subject, text, messageId: `<${snapshot.id}@thefuturex.in>` });
      await db.runTransaction(async transaction => {
        const current = (await transaction.get(snapshot.ref)).data();
        // Preserve an updated cart, while applying the send cooldown.
        transaction.update(snapshot.ref, { sentAt: new Date().toISOString(), ...(job.type !== 'cart' || current.cartVersion === job.cartVersion ? { status: 'sent' } : { status: 'cancelled' }) });
      });
    } catch (error) {
      console.error('Engagement email failed', snapshot.id, error.code || 'unknown');
      await db.runTransaction(async transaction => {
        const current = (await transaction.get(snapshot.ref)).data();
        if (job.type === 'cart' && current.cartVersion !== job.cartVersion) return;
        const attempts = (current.attempts || 0) + 1;
        transaction.update(snapshot.ref, { attempts, status: attempts >= 3 ? 'failed' : 'pending', dueAt: new Date(Date.now() + hour).toISOString(), leaseUntil: null });
      });
    }
  }
});
