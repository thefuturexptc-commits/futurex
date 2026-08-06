import tls from 'node:tls';

const COMPANY_EMAIL = 'thefuturex.ptc@gmail.com';

const send = (res, status, body) => {
  res.status(status).json(body);
};

const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const cleanHeader = (value) => String(value ?? '').replace(/[\r\n]+/g, ' ').trim();

const getPublicEmailError = (error) => {
  const message = error instanceof Error ? error.message : String(error || '');
  if (/535|badcredentials|username and password not accepted/i.test(message)) {
    return 'Order email could not be sent because SMTP login is not configured correctly. Please update SMTP_USER and SMTP_PASS with a valid Gmail app password.';
  }
  return message || 'Order email failed.';
};

const extractEmailAddress = (value) => {
  const match = String(value || '').match(/<([^>]+)>/);
  return (match?.[1] || value || '').trim();
};

const readSmtpResponse = (socket) =>
  new Promise((resolve, reject) => {
    let response = '';
    const onData = (chunk) => {
      response += chunk.toString('utf8');
      const lines = response.split(/\r?\n/).filter(Boolean);
      const lastLine = lines[lines.length - 1] || '';
      if (/^\d{3} /.test(lastLine)) {
        socket.off('data', onData);
        socket.off('error', onError);
        resolve(response);
      }
    };
    const onError = (error) => {
      socket.off('data', onData);
      reject(error);
    };
    socket.on('data', onData);
    socket.once('error', onError);
  });

const sendSmtpCommand = async (socket, command, expectedCodes) => {
  socket.write(`${command}\r\n`);
  const response = await readSmtpResponse(socket);
  const code = Number(response.slice(0, 3));
  if (!expectedCodes.includes(code)) {
    throw new Error(`SMTP command failed (${code}): ${response.trim()}`);
  }
  return response;
};

const sendSmtpEmail = async ({ to, from, replyTo, subject, html }) => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  if (!user || !pass) {
    return { skipped: true, reason: 'SMTP_USER or SMTP_PASS is not configured.' };
  }

  const envelopeFrom = extractEmailAddress(from) || user;
  const messageId = `${Date.now()}.${Math.random().toString(36).slice(2)}@thefuturex`;
  const headers = [
    `From: ${cleanHeader(from)}`,
    `To: ${cleanHeader(to)}`,
    `Subject: ${cleanHeader(subject)}`,
    `Message-ID: <${messageId}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
  ];

  if (replyTo) {
    headers.push(`Reply-To: ${cleanHeader(replyTo)}`);
  }

  const message = `${headers.join('\r\n')}\r\n\r\n${html}`;

  const socket = tls.connect({ host, port, servername: host });
  try {
    await readSmtpResponse(socket);
    await sendSmtpCommand(socket, 'EHLO thefuturex.in', [250]);
    await sendSmtpCommand(socket, 'AUTH LOGIN', [334]);
    await sendSmtpCommand(socket, Buffer.from(user).toString('base64'), [334]);
    await sendSmtpCommand(socket, Buffer.from(pass.replace(/\s+/g, '')).toString('base64'), [235]);
    await sendSmtpCommand(socket, `MAIL FROM:<${envelopeFrom}>`, [250]);
    await sendSmtpCommand(socket, `RCPT TO:<${extractEmailAddress(to)}>`, [250, 251]);
    await sendSmtpCommand(socket, 'DATA', [354]);
    await sendSmtpCommand(socket, `${message}\r\n.`, [250]);
    await sendSmtpCommand(socket, 'QUIT', [221]);
    return { skipped: false };
  } finally {
    socket.end();
  }
};

const buildOrderHtml = (order) => {
  const details = order?.shippingDetails || {};
  const items = Array.isArray(order?.items) ? order.items : [];
  const rows = items
    .map((item) => {
      const variant = [item.selectedColorName, item.selectedSize].filter(Boolean).join(' / ');
      return `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.name)}</td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(variant || '-')}</td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:center;">${escapeHtml(item.quantity || 1)}</td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatMoney(Number(item.price || item.salePrice || 0) * Number(item.quantity || 1))}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5;">
      <h2 style="margin:0 0 12px;">New TheFutureX Order</h2>
      <p><strong>Order ID:</strong> ${escapeHtml(order?.id)}</p>
      <p><strong>Status:</strong> ${escapeHtml(order?.status || 'Processing')}</p>
      <p><strong>Payment:</strong> ${escapeHtml(order?.paymentMethod || '-')} / ${escapeHtml(order?.paymentStatus || '-')}</p>
      <p><strong>Total:</strong> ${formatMoney(order?.total)}</p>

      <h3 style="margin-top:22px;">Customer</h3>
      <p>
        <strong>Name:</strong> ${escapeHtml(order?.customerName || details.name || 'Customer')}<br />
        <strong>Email:</strong> ${escapeHtml(order?.customerEmail || '-')}<br />
        <strong>Phone:</strong> ${escapeHtml(order?.customerPhone || order?.phoneNumber || details.phoneNumber || '-')}
      </p>

      <h3 style="margin-top:22px;">Shipping Address</h3>
      <p>
        ${escapeHtml(details.address || order?.shippingAddress?.street || '-')}<br />
        ${escapeHtml(details.city || order?.shippingAddress?.city || '')}
        ${escapeHtml(details.state ? `, ${details.state}` : '')}<br />
        ${escapeHtml(details.pincode || order?.shippingAddress?.zip || '')}
      </p>

      <h3 style="margin-top:22px;">Items</h3>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:10px;text-align:left;">Product</th>
            <th style="padding:10px;text-align:left;">Variant</th>
            <th style="padding:10px;text-align:center;">Qty</th>
            <th style="padding:10px;text-align:right;">Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    send(res, 405, { ok: false, error: 'Method not allowed.' });
    return;
  }

  try {
    const order = req.body?.order;
    if (!order?.id) {
      send(res, 400, { ok: false, error: 'order is required.' });
      return;
    }

    const to = process.env.ORDER_NOTIFICATION_EMAIL || COMPANY_EMAIL;
    const from = process.env.ORDER_NOTIFICATION_FROM || `TheFutureX Orders <${process.env.SMTP_USER || COMPANY_EMAIL}>`;
    const result = await sendSmtpEmail({
      to,
      from,
      subject: `New order placed: ${order.id}`,
      html: buildOrderHtml(order),
      replyTo: order.customerEmail || undefined,
    });
    send(res, 200, { ok: true, ...result });
  } catch (error) {
    send(res, 500, { ok: false, error: getPublicEmailError(error) });
  }
}
