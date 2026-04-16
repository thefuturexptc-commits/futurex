import React, { useMemo, useState } from 'react';
import { Order, User } from '../../../types';
import { Button } from '../../ui/Button';
import { Pagination } from '../common/Pagination';
import { SectionHeader } from '../common/SectionHeader';
import { StatusBadge } from '../common/StatusBadge';
import { TableSkeleton } from '../common/TableSkeleton';
import tfxLogo from '../../../assets/images/thefuturex-logo.webp';

interface Props {
  orders: Order[];
  users: User[];
  isLoading: boolean;
  onStatusUpdate: (orderId: string, status: Order['status']) => Promise<void> | void;
  onDeleteOrder: (order: Order) => void;
}

export const OrdersTab: React.FC<Props> = ({ orders, users, isLoading, onStatusUpdate, onDeleteOrder }) => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Order['status']>('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const normalizeEmail = (value?: string) => (value || '').trim().toLowerCase();
  const normalizePhone = (value?: string) => {
    const digits = (value || '').replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
    return digits;
  };

  const getOrderCustomer = (order: Order) => {
    const orderEmail = normalizeEmail(order.customerEmail);
    const orderUserIdEmail = normalizeEmail(order.userId);
    const orderPhone = normalizePhone(order.customerPhone || order.shippingDetails?.phoneNumber || order.phoneNumber);
    return users.find((u) => {
      const userEmail = normalizeEmail(u.email);
      const userPhone = normalizePhone(u.phone);
      return (
        u.id === order.userId ||
        Boolean(orderEmail && userEmail === orderEmail) ||
        Boolean(orderUserIdEmail && userEmail === orderUserIdEmail) ||
        Boolean(orderPhone && userPhone && userPhone === orderPhone)
      );
    });
  };

  const getCustomerDetails = (order: Order) => {
    const customer = getOrderCustomer(order);
    const shipping = order.shippingDetails;
    return {
      name: shipping?.name || order.customerName || customer?.name || 'Unknown Customer',
      email: order.customerEmail || customer?.email || (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.userId) ? order.userId : '-'),
      phone: shipping?.phoneNumber || order.customerPhone || order.phoneNumber || customer?.phone || '-',
      address: [
        shipping?.address || order.shippingAddress.street || '',
        shipping?.city || order.shippingAddress.city || '',
        shipping?.state || '',
        shipping?.pincode || order.shippingAddress.zip || '',
        order.shippingAddress.country || 'India',
      ].filter(Boolean),
    };
  };

  const filtered = useMemo(() => {
    const now = Date.now();
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      const customer = getCustomerDetails(order);
      const textMatch =
        !q ||
        order.id.toLowerCase().includes(q) ||
        customer.email.toLowerCase().includes(q) ||
        customer.name.toLowerCase().includes(q) ||
        customer.phone.toLowerCase().includes(q);
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
    const shipping = order.shippingDetails;
    const customerDetails = getCustomerDetails(order);
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
    const customerName = customerDetails.name;
    const customerEmail = customerDetails.email;
    const customerPhone = customerDetails.phone && customerDetails.phone !== '-' ? `+91 ${customerDetails.phone.replace(/^\+?91/, '')}` : '-';
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

  const openOrderStatus = (order: Order) => {
    const params = new URLSearchParams({
      orderId: order.id,
      paymentMethod: order.paymentMethod === 'cod' ? 'cod' : 'online',
    });
    window.open(`/order-success?${params.toString()}`, '_blank', 'noopener,noreferrer');
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
                const customerDetails = getCustomerDetails(order);
                return (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`${idx % 2 === 0 ? 'bg-white dark:bg-dark-surface' : 'bg-gray-50/60 dark:bg-white/5'} cursor-pointer hover:bg-primary-50/40 dark:hover:bg-primary-900/10`}
                  >
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                      <p>Order ID</p>
                      <p className="mt-1 font-mono text-xs text-primary-600 dark:text-primary-300">{order.id}</p>
                      <p className="mt-1 text-xs font-normal text-gray-500">Tap to view details</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      <p className="font-medium text-gray-900 dark:text-white">{customerDetails.name}</p>
                      <p className="text-xs text-gray-500 break-all">{customerDetails.email}</p>
                      <p className="text-xs text-gray-500">{customerDetails.phone !== '-' ? `+91 ${customerDetails.phone.replace(/^\+?91/, '')}` : '-'}</p>
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
                        onClick={(event) => event.stopPropagation()}
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
                      <div className="flex flex-col items-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedOrder(order);
                          }}
                        >
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation();
                            openOrderStatus(order);
                          }}
                        >
                          Open Status
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation();
                            generateInvoice(order);
                          }}
                        >
                          Invoice PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-900/20"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDeleteOrder(order);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
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

      {selectedOrder && (() => {
        const customerDetails = getCustomerDetails(selectedOrder);
        return (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true">
            <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-dark-surface">
              <div className="flex flex-col gap-3 border-b border-gray-200 p-4 dark:border-white/10 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-500">Order Details</p>
                  <h3 className="mt-1 font-mono text-lg font-bold text-gray-900 dark:text-white">{selectedOrder.id}</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {new Date(selectedOrder.date).toLocaleString()} · {selectedOrder.orderSource || 'Website'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Button size="sm" variant="outline" onClick={() => openOrderStatus(selectedOrder)}>
                    Open Status
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => generateInvoice(selectedOrder)}>
                    Invoice PDF
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedOrder(null)}>
                    Close
                  </Button>
                </div>
              </div>

              <div className="max-h-[calc(90vh-96px)] overflow-y-auto p-4 sm:p-5">
                <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
                  <section className="rounded-xl border border-gray-200 p-4 dark:border-white/10">
                    <h4 className="font-bold text-gray-900 dark:text-white">Customer Information</h4>
                    <div className="mt-4 space-y-3 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-gray-500">Name</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{customerDetails.name}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-gray-500">Email</p>
                        <p className="break-all text-gray-700 dark:text-gray-300">{customerDetails.email}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-gray-500">Phone</p>
                        <p className="text-gray-700 dark:text-gray-300">{customerDetails.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-gray-500">Shipping Address</p>
                        <address className="mt-1 not-italic leading-6 text-gray-700 dark:text-gray-300">
                          {customerDetails.address.length ? customerDetails.address.map((line) => (
                            <React.Fragment key={line}>
                              {line}
                              <br />
                            </React.Fragment>
                          )) : '-'}
                        </address>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-xl border border-gray-200 p-4 dark:border-white/10">
                    <h4 className="font-bold text-gray-900 dark:text-white">Order Summary</h4>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                      <div className="rounded-lg bg-gray-50 p-3 dark:bg-white/5">
                        <p className="text-xs text-gray-500">Status</p>
                        <div className="mt-1"><StatusBadge status={selectedOrder.status} /></div>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3 dark:bg-white/5">
                        <p className="text-xs text-gray-500">Payment</p>
                        <p className="mt-1 font-semibold text-gray-900 dark:text-white">{selectedOrder.paymentMethod === 'cod' ? 'COD' : 'Online'}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3 dark:bg-white/5">
                        <p className="text-xs text-gray-500">Payment Status</p>
                        <p className="mt-1 font-semibold text-gray-900 dark:text-white">{selectedOrder.paymentStatus || '-'}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3 dark:bg-white/5">
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="mt-1 font-semibold text-gray-900 dark:text-white">Rs {selectedOrder.total.toFixed(2)}</p>
                      </div>
                    </div>
                  </section>
                </div>

                <section className="mt-4 rounded-xl border border-gray-200 p-4 dark:border-white/10">
                  <h4 className="font-bold text-gray-900 dark:text-white">Products Ordered</h4>
                  <div className="mt-4 divide-y divide-gray-200 dark:divide-white/10">
                    {selectedOrder.items.map((item) => {
                      const image = item.colors?.[0]?.images?.[0] || item.images?.[0] || '';
                      const variants = [
                        item.selectedColorName ? `Color: ${item.selectedColorName}` : '',
                        item.selectedSize ? `Size: ${item.selectedSize}` : '',
                      ].filter(Boolean);
                      return (
                        <div key={`${selectedOrder.id}_${item.id}_${item.selectedColorName || ''}_${item.selectedSize || ''}`} className="flex gap-3 py-3">
                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-white/5">
                            {image ? (
                              <img src={image} alt={item.name} loading="lazy" decoding="async" className="h-full w-full object-contain" />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                            <p className="mt-1 text-xs text-gray-500">{item.category}</p>
                            {variants.length > 0 && <p className="mt-1 text-xs text-gray-500">{variants.join(' · ')}</p>}
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-700 dark:text-gray-300">
                              <span>Qty: {item.quantity}</span>
                              <span>Price: Rs {Number(item.price || 0).toFixed(2)}</span>
                              <span className="font-semibold">Total: Rs {(Number(item.price || 0) * item.quantity).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
