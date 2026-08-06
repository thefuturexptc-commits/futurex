import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

type ComplaintFormState = {
  name: string;
  email: string;
  phone: string;
  orderId: string;
  productName: string;
  complaintType: string;
  priority: string;
  purchaseChannel: string;
  preferredContact: string;
  preferredResolution: string;
  issueDate: string;
  city: string;
  state: string;
  pincode: string;
  message: string;
};

type UploadPreview = {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
};

const MAX_UPLOADS = 3;
const MAX_UPLOAD_BYTES = 900 * 1024;

const complaintTypes = [
  'Product not working',
  'Damaged product received',
  'Missing accessory',
  'Wrong product or variant',
  'Order delivery issue',
  'Warranty or repair support',
  'Payment issue',
  'Other',
];

const productOptions = [
  'TFX Vital V5 Smart Band',
  'Premium Smart Band',
  'TFX Display Pro Smart Ring',
  'Smart Ring',
  'TP-09 Pro Bladeless Fan',
  'Q8 Pro Bladeless Fan',
  'Smart Monitoring Device',
  'AI Smart Glasses',
  'Other',
];

const purchaseChannels = ['TheFutureX Website', 'Amazon', 'Flipkart', 'Retail Store', 'Corporate Order', 'Gift', 'Other'];
const priorities = ['Normal', 'Urgent', 'Critical'];
const contactOptions = ['Phone call', 'WhatsApp', 'Email'];
const resolutionOptions = ['Troubleshooting help', 'Warranty support', 'Replacement check', 'Repair assistance', 'Order support'];

const initialForm: ComplaintFormState = {
  name: '',
  email: '',
  phone: '',
  orderId: '',
  productName: '',
  complaintType: '',
  priority: 'Normal',
  purchaseChannel: 'TheFutureX Website',
  preferredContact: 'Phone call',
  preferredResolution: 'Troubleshooting help',
  issueDate: '',
  city: '',
  state: '',
  pincode: '',
  message: '',
};

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read selected file.'));
    reader.readAsDataURL(file);
  });

const formatFileSize = (size: number) => {
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const readJsonResponse = async (response: Response): Promise<{ ok?: boolean; error?: string; referenceId?: string; skipped?: boolean }> => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    if (/request entity too large|payload too large/i.test(text)) {
      return { ok: false, error: 'Uploaded files are too large. Please upload smaller proof images under 900 KB each.' };
    }
    return { ok: false, error: text.slice(0, 180) || 'Server returned an invalid response.' };
  }
};

export const Complaint: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState<ComplaintFormState>(() => {
    const params = new URLSearchParams(location.search);
    return {
      ...initialForm,
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      orderId: params.get('orderId') || '',
      productName: params.get('product') || '',
    };
  });
  const [uploads, setUploads] = useState<UploadPreview[]>([]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isFormReady = useMemo(() => {
    const phoneDigits = form.phone.replace(/\D/g, '');
    return Boolean(form.name.trim() && phoneDigits.length >= 10 && form.complaintType && form.message.trim().length >= 8);
  }, [form]);

  const updateField = (key: keyof ComplaintFormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError('');
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError('');

    const allowed = Array.from(files)
      .filter((file) => file.type.startsWith('image/') || file.type === 'application/pdf')
      .slice(0, Math.max(0, MAX_UPLOADS - uploads.length));

    if (uploads.length >= MAX_UPLOADS) {
      setError(`You can upload up to ${MAX_UPLOADS} proof files.`);
      return;
    }

    const oversized = allowed.find((file) => file.size > MAX_UPLOAD_BYTES);
    if (oversized) {
      setError('Each proof image or PDF must be under 900 KB.');
      return;
    }

    try {
      const nextUploads = await Promise.all(
        allowed.map(async (file) => ({
          id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          content: await fileToDataUrl(file),
        }))
      );
      setUploads((current) => [...current, ...nextUploads].slice(0, MAX_UPLOADS));
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : 'Unable to read selected files.');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isFormReady) {
      setError('Please add your name, valid phone number, feedback type, and feedback details.');
      return;
    }

    setSubmitting(true);
    setError('');
    setStatus('');

    try {
      const response = await fetch('/api/complaint-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint: {
            ...form,
            phone: form.phone.replace(/\D/g, ''),
          },
          attachments: uploads,
        }),
      });
      const data = await readJsonResponse(response);
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Unable to submit feedback right now.');
      }
      setStatus(
        data.skipped
          ? `Feedback captured locally for testing. Reference: ${data.referenceId}. SMTP email is not configured.`
          : `Feedback submitted successfully. Reference: ${data.referenceId}. Our support team will contact you soon.`
      );
      setForm({ ...initialForm, name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
      setUploads([]);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit feedback right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="complaint-page tfx-standard-page min-h-screen bg-[#f3f8fb] px-4 py-8 text-slate-950 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <section className="grid gap-6 lg:grid-cols-[0.38fr_0.62fr]">
          <div className="rounded-2xl bg-[#063b4a] p-6 text-white shadow-[0_18px_50px_rgba(15,63,70,0.16)] lg:p-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#65e4dd]">Support Request</p>
            <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">Give Feedback</h1>
            <p className="mt-4 text-sm leading-7 text-slate-200">
              Share your order details, product issue, preferred resolution, and proof images. Your feedback is emailed directly to TheFutureX support.
            </p>
            <div className="mt-6 space-y-3 text-sm text-slate-200">
              <p><strong className="text-white">Email:</strong> thefuturex.ptc@gmail.com</p>
              <p><strong className="text-white">Phone:</strong> 8530340676</p>
              <p><strong className="text-white">Hours:</strong> Monday - Saturday, 10:00 AM to 06:30 PM IST</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-4 shadow-[0_18px_50px_rgba(15,63,70,0.10)] sm:p-6 lg:p-8">
            {status && <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{status}</div>}
            {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Full Name*</span>
                <input required value={form.name} onChange={(event) => updateField('name', event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/20" placeholder="Your name" />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Phone Number*</span>
                <input required value={form.phone} onChange={(event) => updateField('phone', event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/20" inputMode="tel" placeholder="+91 phone number" />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Email Address</span>
                <input value={form.email} onChange={(event) => updateField('email', event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/20" type="email" placeholder="you@example.com" />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Order ID / Marketplace Order ID</span>
                <input
                  value={form.orderId}
                  onChange={(event) => updateField('orderId', event.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/20"
                  placeholder="TheFutureX, Amazon, Flipkart, or other order ID"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Product / Model</span>
                <input
                  value={form.productName}
                  onChange={(event) => updateField('productName', event.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/20"
                  placeholder="Write product name or model"
                  list="complaint-product-options"
                />
                <datalist id="complaint-product-options">
                  {productOptions.map((item) => <option key={item} value={item} />)}
                </datalist>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Feedback Type*</span>
                <select required value={form.complaintType} onChange={(event) => updateField('complaintType', event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/20">
                  <option value="">Select issue</option>
                  {complaintTypes.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Priority</span>
                <select value={form.priority} onChange={(event) => updateField('priority', event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/20">
                  {priorities.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Purchase Channel</span>
                <select value={form.purchaseChannel} onChange={(event) => updateField('purchaseChannel', event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/20">
                  {purchaseChannels.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Preferred Contact</span>
                <select value={form.preferredContact} onChange={(event) => updateField('preferredContact', event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/20">
                  {contactOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Preferred Resolution</span>
                <select value={form.preferredResolution} onChange={(event) => updateField('preferredResolution', event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/20">
                  {resolutionOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Issue Started On</span>
                <input value={form.issueDate} onChange={(event) => updateField('issueDate', event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/20" type="date" />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Pincode</span>
                <input value={form.pincode} onChange={(event) => updateField('pincode', event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/20" inputMode="numeric" maxLength={6} placeholder="Enter pincode" />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">City</span>
                <input value={form.city} onChange={(event) => updateField('city', event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/20" placeholder="City" />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">State</span>
                <input value={form.state} onChange={(event) => updateField('state', event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/20" placeholder="State" />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-sm font-bold text-slate-700">Feedback Details*</span>
                <textarea required value={form.message} onChange={(event) => updateField('message', event.target.value)} className="mt-1 min-h-32 w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#0284c7] focus:ring-2 focus:ring-[#0284c7]/20" placeholder="Explain the issue, what happened, and what support you need." />
              </label>

              <div className="sm:col-span-2">
                <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#bae6fd] bg-[#f0f9ff] px-4 py-5 text-center transition hover:border-[#0284c7]">
                  <span className="text-sm font-black text-slate-800">Upload proof images or invoice</span>
                  <span className="mt-1 text-xs text-slate-500">JPG, PNG, WEBP, or PDF. Up to 3 files, 900 KB each.</span>
                  <input type="file" accept="image/*,.pdf" multiple className="sr-only" onChange={(event) => void handleFiles(event.target.files)} />
                </label>

                {uploads.length > 0 && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {uploads.map((file) => (
                      <div key={file.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm">
                        <span className="min-w-0">
                          <strong className="block truncate text-slate-800">{file.name}</strong>
                          <span className="text-xs text-slate-500">{formatFileSize(file.size)}</span>
                        </span>
                        <button type="button" onClick={() => setUploads((current) => current.filter((item) => item.id !== file.id))} className="shrink-0 rounded-full px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-50">
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {!isFormReady && (
              <p className="mt-4 text-xs font-semibold text-slate-500">
                Required: name, phone number, feedback type, and feedback details.
              </p>
            )}

            <Button type="submit" disabled={submitting} className="mt-6 w-full sm:w-auto">
              {submitting ? 'Submitting Feedback...' : 'Submit Feedback'}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
};
