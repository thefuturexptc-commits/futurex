import tls from 'node:tls';

const COMPANY_EMAIL = 'thefuturex.ptc@gmail.com';
const MAX_ATTACHMENTS = 3;
const MAX_ATTACHMENT_BYTES = 900 * 1024;

const send = (res, status, body) => {
  res.status(status).json(body);
};

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
    return 'Complaint could not be emailed because SMTP login is not configured correctly. Please update SMTP_USER and SMTP_PASS with a valid Gmail app password.';
  }
  return message || 'Complaint email failed.';
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

const wrapBase64 = (value) => String(value || '').replace(/(.{76})/g, '$1\r\n');

const buildMimeMessage = ({ to, from, replyTo, subject, html, attachments }) => {
  const messageId = `${Date.now()}.${Math.random().toString(36).slice(2)}@thefuturex`;
  const boundary = `tfx-complaint-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const headers = [
    `From: ${cleanHeader(from)}`,
    `To: ${cleanHeader(to)}`,
    `Subject: ${cleanHeader(subject)}`,
    `Message-ID: <${messageId}>`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
  ];

  if (replyTo) {
    headers.push(`Reply-To: ${cleanHeader(replyTo)}`);
  }

  const parts = [
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    html,
  ];

  attachments.forEach((file, index) => {
    const safeName = cleanHeader(file.name || `complaint-proof-${index + 1}.jpg`).replace(/"/g, '');
    parts.push(
      `--${boundary}`,
      `Content-Type: ${cleanHeader(file.type || 'application/octet-stream')}; name="${safeName}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${safeName}"`,
      '',
      wrapBase64(file.content),
    );
  });

  parts.push(`--${boundary}--`, '');
  return `${headers.join('\r\n')}\r\n\r\n${parts.join('\r\n')}`;
};

const sendSmtpEmail = async ({ to, from, replyTo, subject, html, attachments = [] }) => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  if (!user || !pass) {
    return { skipped: true, reason: 'SMTP_USER or SMTP_PASS is not configured.' };
  }

  const envelopeFrom = extractEmailAddress(from) || user;
  const message = buildMimeMessage({ to, from, replyTo, subject, html, attachments });
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

const getComplaintReference = () => `TFX-CMP-${Date.now().toString(36).toUpperCase()}`;

const cleanAttachment = (file) => {
  const content = String(file?.content || '').replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');
  const byteLength = Math.ceil((content.length * 3) / 4);
  if (!content || byteLength > MAX_ATTACHMENT_BYTES) return null;
  return {
    name: String(file?.name || 'complaint-proof.jpg').slice(0, 120),
    type: String(file?.type || 'application/octet-stream').slice(0, 80),
    size: Number(file?.size || byteLength),
    content,
  };
};

const buildComplaintHtml = (complaint, referenceId, attachments) => {
  const field = (label, value) => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #e5e7eb;font-weight:700;width:180px;background:#f8fafc;">${escapeHtml(label)}</td>
      <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(value || '-')}</td>
    </tr>
  `;

  return `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5;">
      <h2 style="margin:0 0 8px;">New TheFutureX Complaint</h2>
      <p style="margin:0 0 18px;color:#475569;">Reference ID: <strong>${escapeHtml(referenceId)}</strong></p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;">
        <tbody>
          ${field('Complaint Type', complaint.complaintType)}
          ${field('Priority', complaint.priority)}
          ${field('Purchase Channel', complaint.purchaseChannel)}
          ${field('Order / Marketplace ID', complaint.orderId)}
          ${field('Product / Model', complaint.productName)}
          ${field('Customer Name', complaint.name)}
          ${field('Email', complaint.email)}
          ${field('Phone', complaint.phone)}
          ${field('Preferred Contact', complaint.preferredContact)}
          ${field('Preferred Resolution', complaint.preferredResolution)}
          ${field('Issue Started On', complaint.issueDate)}
          ${field('City / State', [complaint.city, complaint.state].filter(Boolean).join(', '))}
          ${field('Pincode', complaint.pincode)}
          ${field('Attachments', attachments.length ? `${attachments.length} file(s) attached` : 'No attachments')}
        </tbody>
      </table>

      <h3 style="margin:22px 0 8px;">Complaint Details</h3>
      <p style="white-space:pre-wrap;margin:0;padding:14px;border:1px solid #e5e7eb;background:#f8fafc;border-radius:8px;">${escapeHtml(complaint.message)}</p>
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
    const complaint = req.body?.complaint || {};
    if (!complaint.name || !complaint.phone || !complaint.message) {
      send(res, 400, { ok: false, error: 'Name, phone, and complaint details are required.' });
      return;
    }

    const attachments = (Array.isArray(req.body?.attachments) ? req.body.attachments : [])
      .slice(0, MAX_ATTACHMENTS)
      .map(cleanAttachment)
      .filter(Boolean);
    const referenceId = getComplaintReference();
    const to = process.env.COMPLAINT_NOTIFICATION_EMAIL || process.env.ORDER_NOTIFICATION_EMAIL || COMPANY_EMAIL;
    const from =
      process.env.COMPLAINT_NOTIFICATION_FROM ||
      process.env.ORDER_NOTIFICATION_FROM ||
      `TheFutureX Complaints <${process.env.SMTP_USER || COMPANY_EMAIL}>`;
    const subjectPrefix = [complaint.purchaseChannel, complaint.orderId].filter(Boolean).join(' - ');
    const subject = `Complaint ${referenceId}: ${subjectPrefix || complaint.productName || complaint.complaintType || 'Customer issue'}`;

    const result = await sendSmtpEmail({
      to,
      from,
      subject,
      html: buildComplaintHtml(complaint, referenceId, attachments),
      replyTo: complaint.email || undefined,
      attachments,
    });

    send(res, 200, { ok: true, referenceId, attachmentCount: attachments.length, ...result });
  } catch (error) {
    send(res, 500, { ok: false, error: getPublicEmailError(error) });
  }
}
