const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
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
