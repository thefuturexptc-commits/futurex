import React, { useMemo, useState } from 'react';
import { Order, User } from '../../../types';
import { Button } from '../../ui/Button';
import { Pagination } from '../common/Pagination';
import { SectionHeader } from '../common/SectionHeader';
import { StatusBadge } from '../common/StatusBadge';
import { TableSkeleton } from '../common/TableSkeleton';
import tfxLogo from '../../../assets/images/thefuturex-logo.png';

interface Props {
  orders: Order[];
  users: User[];
  isLoading: boolean;
  onStatusUpdate: (orderId: string, status: Order['status']) => Promise<void> | void;
}

export const OrdersTab: React.FC<Props> = ({ orders, users, isLoading, onStatusUpdate }) => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Order['status']>('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filtered = useMemo(() => {
    const now = Date.now();
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      const email = users.find((u) => u.id === order.userId)?.email?.toLowerCase() || '';
      const textMatch = !q || order.id.toLowerCase().includes(q) || email.includes(q);
      const statusMatch = statusFilter === 'all' || order.status === statusFilter;
      const source = (order.orderSource || 'Website').toLowerCase();
      const sourceMatch = sourceFilter === 'all' || source === sourceFilter.toLowerCase();
      const ageDays = (now - new Date(order.date).getTime()) / (1000 * 60 * 60 * 24);
      const dateMatch =
        dateFilter === 'all' ||
        (dateFilter === '7d' && ageDays <= 7) ||
        (dateFilter === '30d' && ageDays <= 30) ||
        (dateFilter === '90d' && ageDays <= 90);
      return textMatch && statusMatch && sourceMatch && dateMatch;
    });
  }, [orders, users, query, statusFilter, sourceFilter, dateFilter]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const buildInvoiceNumber = (order: Order) => {
    const date = new Date(order.date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const numericId = order.id.replace(/\D/g, '');
    const suffix = numericId.slice(-4) || String(date.getTime()).slice(-4);
    return `TFX-${year}${month}${day}-${suffix}`;
  };

  const generateInvoice = (order: Order) => {
    const customer = users.find((u) => u.id === order.userId);
    const shipping = order.shippingDetails;
    const invoiceDate = new Date(order.date);
    const invoiceNumber = buildInvoiceNumber(order);
    const paymentMethodLabel =
      order.paymentMethod === 'cod'
        ? 'Cash on Delivery'
        : order.paymentMethod === 'online'
        ? 'Online Payment'
        : order.paymentStatus === 'Pending'
        ? 'Cash on Delivery'
        : 'Online Payment';
    const customerName = shipping?.name || customer?.name || 'Unknown Customer';
    const customerEmail = customer?.email || order.userId || '-';
    const customerPhone = order.phoneNumber ? `+91 ${order.phoneNumber}` : '-';
    const addressLines = [
      shipping?.address || order.shippingAddress.street || '',
      shipping?.city || order.shippingAddress.city || '',
      shipping?.pincode || order.shippingAddress.zip || '',
      shipping?.state || order.shippingAddress.country || 'India',
    ].filter(Boolean);
    const rows = order.items
      .map((item) => {
        const variantBits = [item.selectedColorName ? `Color: ${item.selectedColorName}` : '', item.selectedSize ? `Size: ${item.selectedSize}` : '']
          .filter(Boolean)
          .join(' | ');
        return `
          <tr>
            <td style="padding:14px 12px;border-bottom:1px solid #e5e7eb;vertical-align:top;">
              <div style="font-weight:600;color:#111827;">${item.name}</div>
              ${variantBits ? `<div style="margin-top:4px;font-size:12px;color:#6b7280;">${variantBits}</div>` : ''}
            </td>
            <td style="padding:14px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
            <td style="padding:14px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">Rs ${item.price.toFixed(2)}</td>
            <td style="padding:14px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">Rs ${(item.price * item.quantity).toFixed(2)}</td>
          </tr>
        `;
      })
      .join('');
    const html = `
      <html>
      <head>
        <title>${invoiceNumber}</title>
        <style>
          @page {
            size: A4;
            margin: 14mm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            background: #eef2f7;
            font-family: Arial, sans-serif;
            color: #111827;
          }

          .invoice-shell {
            max-width: 900px;
            margin: 24px auto;
            background: #ffffff;
            border: 1px solid #dbe3ee;
          }

          .invoice-header {
            padding: 28px 32px;
            border-bottom: 1px solid #e5e7eb;
            display: grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: 28px;
            align-items: start;
          }

          .brand-title {
            font-size: 30px;
            font-weight: 700;
            letter-spacing: 0.04em;
          }

          .brand-meta {
            margin-top: 12px;
            font-size: 14px;
            line-height: 1.8;
          }

          .info-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
          }

          .info-table td {
            padding: 9px 0;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: top;
          }

          .info-table td:first-child {
            font-weight: 600;
            color: #374151;
            width: 48%;
          }

          .info-table td:last-child {
            text-align: right;
            color: #111827;
          }

          .section-grid {
            padding: 28px 32px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 28px;
            border-bottom: 1px solid #e5e7eb;
          }

          .section-label {
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.08em;
            color: #6b7280;
            margin-bottom: 10px;
          }

          .bill-name {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 8px;
          }

          .line {
            font-size: 14px;
            line-height: 1.7;
          }

          .invoice-body {
            padding: 24px 32px 32px;
          }

          .product-table {
            width: 100%;
            border-collapse: collapse;
          }

          .product-table thead tr {
            background: #f9fafb;
          }

          .product-table th {
            padding: 12px;
            text-align: left;
            font-size: 12px;
            letter-spacing: 0.06em;
            color: #6b7280;
            border-bottom: 1px solid #e5e7eb;
          }

          .product-table th:nth-child(2),
          .product-table td:nth-child(2) {
            text-align: center;
          }

          .product-table th:nth-child(3),
          .product-table th:nth-child(4),
          .product-table td:nth-child(3),
          .product-table td:nth-child(4) {
            text-align: right;
          }

          .product-table td {
            padding: 14px 12px;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: top;
            font-size: 14px;
          }

          .product-name {
            font-weight: 600;
            color: #111827;
          }

          .product-meta {
            margin-top: 4px;
            font-size: 12px;
            color: #6b7280;
          }

          .summary-grid {
            margin-top: 24px;
            display: grid;
            grid-template-columns: 1fr 320px;
            gap: 24px;
            align-items: start;
          }

          .notes-box {
            padding: 16px;
            border: 1px solid #e5e7eb;
            background: #f9fafb;
            min-height: 120px;
          }

          .totals-box {
            border: 1px solid #e5e7eb;
            padding: 14px 18px;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
          }

          .total-row:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }

          .grand-total {
            font-size: 18px;
            font-weight: 700;
            padding-top: 14px;
          }

          @media print {
            body {
              background: #ffffff;
            }

            .invoice-shell {
              margin: 0;
              max-width: none;
              border: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-shell">
          <div class="invoice-header">
            <div>
              <img src="${tfxLogo}" alt="TheFutureX" style="height:56px;max-width:180px;object-fit:contain;display:block;margin-bottom:10px;" />
              <div class="brand-title">INVOICE</div>
              <div class="brand-meta">
                <div><strong>Company:</strong> TheFutureX</div>
                <div><strong>Website:</strong> https://thefuturex.in</div>
                <div><strong>GSTIN:</strong> 27AALCP9913F1Z2</div>
              </div>
            </div>
            <div>
              <div class="section-label">INVOICE DETAILS</div>
              <table class="info-table">
                <tbody>
                  <tr>
                    <td>Invoice Number</td>
                    <td>${invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td>Order Number</td>
                    <td>${order.id}</td>
                  </tr>
                  <tr>
                    <td>Invoice Date</td>
                    <td>${invoiceDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  </tr>
                  <tr>
                    <td>Order Date</td>
                    <td>${invoiceDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  </tr>
                  <tr>
                    <td>Payment Method</td>
                    <td>${paymentMethodLabel}</td>
                  </tr>
                  <tr>
                    <td>Source</td>
                    <td>${order.orderSource || 'Website'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="section-grid">
            <div>
              <div class="section-label">BILL TO</div>
              <div class="bill-name">${customerName}</div>
              ${addressLines.map((line) => `<div class="line">${line}</div>`).join('')}
            </div>
            <div>
              <div class="section-label">CUSTOMER DETAILS</div>
              <div class="line"><strong>Email:</strong> ${customerEmail}</div>
              <div class="line"><strong>Phone:</strong> ${customerPhone}</div>
              <div class="line"><strong>Status:</strong> ${order.status}</div>
            </div>
          </div>

          <div class="invoice-body">
            <table class="product-table">
              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>QUANTITY</th>
                  <th>PRICE</th>
                  <th>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>

            <div class="summary-grid">
              <div class="notes-box">
                <div class="section-label">CUSTOMER NOTES</div>
                <div class="line" style="color:#374151;">No customer notes provided.</div>
              </div>
              <div class="totals-box">
                <div class="total-row">
                  <span>Subtotal</span>
                  <strong>Rs ${order.total.toFixed(2)}</strong>
                </div>
                <div class="total-row">
                  <span>Shipping</span>
                  <strong>Free Shipping</strong>
                </div>
                <div class="total-row grand-total">
                  <span>Total</span>
                  <span>Rs ${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    window.setTimeout(() => {
      win.print();
    }, 250);
  };

  React.useEffect(() => {
    setPage(1);
  }, [query, statusFilter, sourceFilter, dateFilter]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <SectionHeader title="Orders" subtitle="Track fulfillment and customer transactions" />

      <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-white/10 p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by order id or customer email"
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | Order['status'])}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600"
        >
          <option value="all">All Status</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Returned">Returned</option>
        </select>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600"
        >
          <option value="all">All Time</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600"
        >
          <option value="all">All Sources</option>
          <option value="website">Website</option>
          <option value="facebook">Facebook</option>
          <option value="meta ads">Meta Ads</option>
          <option value="instagram">Instagram</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="google">Google</option>
          <option value="youtube">YouTube</option>
          <option value="referral">Referral</option>
        </select>
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">{filtered.length} orders</div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : (
        <div className="bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-white/10 overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Source</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((order, idx) => {
                const customer = users.find((u) => u.id === order.userId);
                return (
                  <tr
                    key={order.id}
                    className={`${idx % 2 === 0 ? 'bg-white dark:bg-dark-surface' : 'bg-gray-50/60 dark:bg-white/5'} hover:bg-primary-50/40 dark:hover:bg-primary-900/10`}
                  >
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">{order.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      <p className="font-medium text-gray-900 dark:text-white">{customer?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{customer?.email || order.userId}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      <p>{new Date(order.date).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-500">{new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{order.orderSource || 'Website'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                      <select
                        value={order.status}
                        onChange={(e) => onStatusUpdate(order.id, e.target.value as Order['status'])}
                        className="mt-2 h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600"
                      >
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Returned">Returned</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">Rs {order.total.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => generateInvoice(order)}>Generate Invoice PDF</Button>
                    </td>
                  </tr>
                );
              })}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">No matching orders.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pageSize={pageSize} total={filtered.length} onChange={setPage} />
    </div>
  );
};
