import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import {
  appendSupportChatMessage,
  getProducts,
  getSupportChatsByUserId,
  getUserOrders,
  upsertSupportChat,
  updateSupportChatSession,
} from '../services/backend';
import { Order, Product, SupportChatMessage, SupportChatSession } from '../types';
import supportAssistantLogo from '../assets/images/support-assistant-logo.jpg';

type Sender = SupportChatMessage['sender'];
type ChatProductCard = NonNullable<SupportChatMessage['products']>[number];

const QUICK_CHIPS = ['price', 'stock', 'warranty', 'order status', 'new arrivals', 'best sellers'];
const SUPPORT_PHONE = '+91 85303 40676';
const SUPPORT_EMAIL = 'thefuturex.ptc@gmail.com';
const DEFAULT_BOT_TEXT =
  "Hi! I'm TheFutureX Assistant.\n\nI can help with:\n- Product price\n- Stock availability\n- Warranty\n- Battery details\n- Product specs\n- Order status\n\nJust type your question below.";

const stopwords = new Set([
  'the', 'a', 'an', 'for', 'with', 'and', 'or', 'is', 'my', 'of', 'in', 'on', 'to', 'show', 'tell', 'about'
]);

const normalize = (value: string) => value.toLowerCase().trim();
const formatCurrency = (amount: number) => `Rs ${Number(amount || 0).toLocaleString()}`;
const formatOrderSummary = (order: Order) =>
  `${order.id}: ${order.status} | ${formatCurrency(order.total)} | ${new Date(order.date).toLocaleString()}`;
const isPositiveReply = (text: string) => /^(yes|y|yeah|yep|sure|okay|ok)\b/i.test(text.trim());
const isNegativeReply = (text: string) => /^(no+|n|nope|nah|not really)\b/i.test(text.trim());

const formatWarranty = (value?: string) => {
  const raw = (value || '').trim();
  if (!raw) return 'Not specified.';
  if (/year|month|day/i.test(raw)) return raw;
  if (/^\d+(\.\d+)?$/.test(raw)) {
    const n = Number(raw);
    if (n <= 0) return 'Not specified.';
    return `${raw} ${n > 1 ? 'Years' : 'Year'}`;
  }
  return raw;
};

const getSessionId = (userId: string) => {
  const key = `tfx_support_session_${userId}`;
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const next = `chat_${userId}_${Date.now()}`;
  localStorage.setItem(key, next);
  return next;
};

export const SupportAssistant: React.FC = () => {
  const { user } = useAuth();
  const { addToCart, isCartOpen } = useCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [awaitingFeedback, setAwaitingFeedback] = useState(false);
  const [session, setSession] = useState<SupportChatSession | null>(null);
  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(() => !localStorage.getItem('tfx_support_tooltip_seen'));
  const [isTyping, setIsTyping] = useState(false);
  const [compareBuffer, setCompareBuffer] = useState<ChatProductCard[]>([]);
  const [awaitingCheckout, setAwaitingCheckout] = useState(false);

  const messagesContainerRef = React.useRef<HTMLDivElement | null>(null);
  const bottomRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  const userId = user?.id || 'guest';

  useEffect(() => {
    let active = true;
    setLoadingProducts(true);
    getProducts()
      .then((data) => {
        if (!active) return;
        setProducts(data);
      })
      .catch(() => {
        if (!active) return;
        setProducts([]);
      })
      .finally(() => {
        if (active) setLoadingProducts(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadSession = async () => {
      const sessionId = getSessionId(userId);
      const existing = (await getSupportChatsByUserId(userId)).find((chat) => chat.id === sessionId);
      if (existing) {
        if (!active) return;
        setSession(existing);
        setMessages(existing.messages || []);
        return;
      }

      const initialMessage: SupportChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: DEFAULT_BOT_TEXT,
        timestamp: new Date().toISOString(),
      };

      const created: SupportChatSession = {
        id: sessionId,
        userId,
        userEmail: user?.email,
        userName: user?.name,
        status: 'open',
        satisfied: true,
        createdAt: new Date().toISOString(),
        lastMessageAt: initialMessage.timestamp,
        messages: [initialMessage],
      };
      await upsertSupportChat(created);
      if (!active) return;
      setSession(created);
      setMessages(created.messages);
    };

    void loadSession();
    return () => {
      active = false;
    };
  }, [userId, user?.email, user?.name]);

  useEffect(() => {
    if (!session) return;
    const timer = window.setInterval(async () => {
      const latest = (await getSupportChatsByUserId(userId)).find((chat) => chat.id === session.id);
      if (!latest) return;
      setSession(latest);
      setMessages((prev) => {
        if ((latest.messages || []).length === prev.length) return prev;
        return latest.messages || prev;
      });
    }, 7000);
    return () => window.clearInterval(timer);
  }, [session, userId]);

  useEffect(() => {
    if (!open) return;
    if (!shouldAutoScroll) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, open, shouldAutoScroll]);

  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  useEffect(() => {
    // Auto-minimize chat while cart drawer is open.
    if (isCartOpen && open) {
      setOpen(false);
    }
  }, [isCartOpen, open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const targetNode = event.target as Node | null;
      if (!targetNode) return;
      if (panelRef.current?.contains(targetNode)) return;
      setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !showTooltip) return;
    setShowTooltip(false);
    localStorage.setItem('tfx_support_tooltip_seen', '1');
  }, [open, showTooltip]);

  useEffect(() => {
    const onAskProduct = (event: Event) => {
      const customEvent = event as CustomEvent<{ prompt?: string }>;
      const prompt = (customEvent.detail?.prompt || '').trim();
      if (!prompt) return;
      setOpen(true);
      setShouldAutoScroll(true);
      setPendingPrompt(prompt);
    };
    window.addEventListener('support-assistant:ask-product', onAskProduct as EventListener);
    return () => {
      window.removeEventListener('support-assistant:ask-product', onAskProduct as EventListener);
    };
  }, []);

  const addMessage = async (
    sender: Sender,
    text: string,
    patch?: Partial<SupportChatSession>,
    messageExtras?: Partial<SupportChatMessage>
  ) => {
    if (!session) return;
    const message: SupportChatMessage = {
      id: `${sender}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      sender,
      text,
      timestamp: new Date().toISOString(),
      ...messageExtras,
    };
    const updated = await appendSupportChatMessage(session.id, message, {
      ...patch,
      userEmail: user?.email,
      userName: user?.name,
    });
    if (updated) {
      setSession(updated);
      setMessages(updated.messages || []);
    }
  };

  const addBotAnswer = async (text: string) => {
    await addMessage('bot', text);
    await addMessage('bot', 'Was this helpful? Please reply with Yes or No.');
    setAwaitingFeedback(true);
  };

  const addBotProductCardsAnswer = async (title: string, cards: ChatProductCard[]) => {
    await addMessage('bot', title);
    await addMessage('bot', '', undefined, { type: 'products', products: cards });
    await addMessage('bot', 'Was this helpful? Please reply with Yes or No.');
    setAwaitingFeedback(true);
  };

  const keywordIntent = (text: string) => {
    const t = normalize(text);
    return {
      order: /order|track|shipment|delivery|status/.test(t),
      price: /price|cost|mrp|sale/.test(t),
      stock: /stock|available|availability/.test(t),
      rating: /rating|review|stars?/.test(t),
      warranty: /warranty|guarantee/.test(t),
      battery: /battery|mah|backup|life/.test(t),
      water: /water|waterproof|resistance|atm|ip\d+/i.test(t),
      specs: /spec|specification|feature|details/.test(t),
      hello: /hi|hello|hey/.test(t),
      arrivals: /new arrivals?|latest arrivals?|just dropped|latest products?|new launch/.test(t),
      bestSellers: /best sellers?|top sellers?|customer favorites?|popular products?/.test(t),
    };
  };

  const listProductsForIntent = (kind: 'arrivals' | 'bestSellers'): ChatProductCard[] => {
    const byLatest = [...products].sort((a, b) => {
      const aId = Number((a.id || '').replace(/[^0-9]/g, '')) || 0;
      const bId = Number((b.id || '').replace(/[^0-9]/g, '')) || 0;
      return bId - aId;
    });

    const selected =
      kind === 'arrivals'
        ? [...products.filter((p) => Boolean(p.isFeatured)), ...byLatest].filter(
            (product, index, arr) => arr.findIndex((x) => x.id === product.id) === index
          )
        : [...products.filter((p) => Boolean(p.isBestSeller)), ...[...products].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))]
            .filter((product, index, arr) => arr.findIndex((x) => x.id === product.id) === index);

    if (!selected.length) return [];

    return selected.slice(0, 8).map((product) => {
      const available = Math.max(0, Number(product.stock || 0) - Number(product.reservedStock || 0));
      const batterySpec = findSpecSnippet(product, /battery|mah|backup|hours|days/i);
      return {
        id: product.id,
        name: product.name,
        price: Number(product.salePrice || product.price || 0),
        stock: available,
        isNew: kind === 'arrivals' ? true : Boolean(product.isFeatured),
        image: product.images?.[0] || '',
        warranty: formatWarranty(product.warranty),
        battery: batterySpec || 'Not listed',
      };
    });
  };

  const getProductById = (id: string) => products.find((product) => product.id === id);

  const handleAddToCartFromChat = async (card: ChatProductCard) => {
    const fullProduct = getProductById(card.id);
    if (!fullProduct) {
      await addMessage('bot', 'This product is no longer available.');
      return;
    }
    addToCart({ ...fullProduct, price: card.price }, 1);
    setAwaitingFeedback(false);
    setAwaitingCheckout(true);
    await addMessage(
      'bot',
      `Added ${fullProduct.name} to cart.\nWould you like to checkout now?`
    );
  };

  const handleCompareFromChat = async (card: ChatProductCard) => {
    if (compareBuffer.some((item) => item.id === card.id)) {
      await addMessage('bot', `${card.name} is already selected for compare.`);
      return;
    }
    const next = [...compareBuffer, card].slice(-2);
    setCompareBuffer(next);
    if (next.length === 1) {
      await addMessage('bot', `Selected ${card.name} for compare. Choose one more product.`);
    }
  };

  const handleCheckoutReply = async (text: string): Promise<boolean> => {
    if (!awaitingCheckout) return false;
    const normalizedText = normalize(text);
    if (isPositiveReply(text) || /checkout|check out|go checkout|buy now/.test(normalizedText)) {
      await addMessage('bot', 'Taking you to checkout...');
      setAwaitingCheckout(false);
      setOpen(false);
      navigate('/checkout');
      return true;
    }
    if (isNegativeReply(text)) {
      await addMessage('bot', 'No problem. You can continue shopping, or type checkout anytime.');
      setAwaitingCheckout(false);
      return true;
    }
    await addMessage('bot', 'Would you like to checkout now? Please reply with Yes or No.');
    return true;
  };

  useEffect(() => {
    if (compareBuffer.length < 2) return;
    const [first, second] = compareBuffer;
    void addMessage(
      'bot',
      'Quick Compare',
      undefined,
      {
        type: 'compare',
        compareProducts: [
          {
            id: first.id,
            name: first.name,
            price: first.price,
            stock: first.stock,
            warranty: first.warranty,
            battery: first.battery,
          },
          {
            id: second.id,
            name: second.name,
            price: second.price,
            stock: second.stock,
            warranty: second.warranty,
            battery: second.battery,
          },
        ],
      }
    );
    setCompareBuffer([]);
  }, [compareBuffer]);

  const findProduct = (text: string): Product | undefined => {
    const t = normalize(text);
    const direct = products.find((p) => t.includes(normalize(p.name)));
    if (direct) return direct;

    const tokens = t
      .split(/[^a-z0-9]+/)
      .filter((token) => token && !stopwords.has(token) && token.length > 1);
    if (!tokens.length) return undefined;

    let best: { score: number; product: Product } | null = null;
    for (const product of products) {
      const nameTokens = normalize(product.name).split(/[^a-z0-9]+/).filter(Boolean);
      const score = tokens.reduce((acc, token) => (nameTokens.includes(token) ? acc + 1 : acc), 0);
      if (score > 0 && (!best || score > best.score)) best = { score, product };
    }
    return best?.score && best.score >= 1 ? best.product : undefined;
  };

  const findSpecSnippet = (product: Product, matcher: RegExp): string | undefined => {
    const fromSpecs = Object.entries(product.specs || {}).find(([k, v]) => matcher.test(`${k} ${v}`));
    if (fromSpecs) return `${fromSpecs[0]}: ${fromSpecs[1]}`;
    const fromFeatures = (product.features || []).find((f) => matcher.test(f));
    if (fromFeatures) return fromFeatures;
    if (matcher.test(product.description || '')) return 'Found in product description.';
    return undefined;
  };

  const buildProductAnswer = (product: Product, text: string) => {
    const intent = keywordIntent(text);
    const available = Math.max(0, Number(product.stock || 0) - Number(product.reservedStock || 0));
    const chunks: string[] = [`${product.name} (${product.category})`];
    const topSpecs = Object.entries(product.specs || {}).slice(0, 4);
    const topFeatures = (product.features || []).slice(0, 3);
    const specsSummary = topSpecs.map(([k, v]) => `${k}: ${v}`).join(' | ');
    const featureSummary = topFeatures.join(' | ');

    if (intent.price) chunks.push(`Price: ${formatCurrency(product.salePrice || product.price)}${product.mrp ? ` (MRP ${formatCurrency(product.mrp)})` : ''}`);
    if (intent.stock) chunks.push(`Stock: ${available > 0 ? `${available} available` : 'Out of stock'}`);
    if (intent.rating) chunks.push(`Rating: ${Number(product.rating || 0).toFixed(1)} from ${Number(product.reviewCount || 0)} reviews`);
    if (intent.warranty) chunks.push(`Warranty: ${formatWarranty(product.warranty)}`);
    if (intent.battery) chunks.push(`Battery: ${findSpecSnippet(product, /battery|mah|backup|hours|days/i) || 'Battery details are not listed.'}`);
    if (intent.water) chunks.push(`Water Resistance: ${findSpecSnippet(product, /water|waterproof|resistance|atm|ip\d+/i) || 'Water resistance details are not listed.'}`);
    if (intent.specs) chunks.push(`Specs: ${Object.entries(product.specs || {}).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' | ') || 'Specs not available.'}`);
    if (specsSummary) chunks.push(`Key Specifications: ${specsSummary}`);
    if (featureSummary) chunks.push(`Key Features: ${featureSummary}`);

    if (chunks.length === 1) {
      chunks.push(`Price: ${formatCurrency(product.salePrice || product.price)}`);
      chunks.push(`Stock: ${available > 0 ? `${available} available` : 'Out of stock'}`);
      chunks.push(`Warranty: ${formatWarranty(product.warranty)}`);
    }
    return chunks.join('\n');
  };

  const handleOrderIntent = async (text: string) => {
    if (!user) {
      await addMessage('bot', 'Please log in first to check your order details.');
      return;
    }

    try {
      const orders = await getUserOrders(user.id);
      if (!orders.length) {
        await addMessage('bot', 'No orders were found for your account yet.');
        return;
      }

      const orderIdMatch = text.match(/ORD[-_]?[\d]+/i)?.[0]?.toUpperCase();
      if (orderIdMatch) {
        const target = orders.find((order) => normalize(order.id) === normalize(orderIdMatch));
        if (!target) {
          await addMessage('bot', `I couldn't find ${orderIdMatch}. Please share a valid order ID.`);
          return;
        }
        if (target.userId !== user.id) {
          await addMessage('bot', 'Security check failed. You can only view your own orders.');
          return;
        }
        await addBotAnswer(`Order details:\n${formatOrderSummary(target)}`);
        return;
      }

      const ownOrders = orders.filter((order) => order.userId === user.id);
      const latest = ownOrders.slice(0, 3).map(formatOrderSummary).join('\n');
      await addBotAnswer(`Here are your recent orders:\n${latest}`);
    } catch {
      await addMessage('bot', 'Unable to fetch order details right now. Please try again in a moment.');
    }
  };

  const handleSatisfactionReply = async (text: string): Promise<boolean> => {
    if (!awaitingFeedback) return false;
    if (isPositiveReply(text)) {
      await addMessage('bot', 'Glad to help! Let me know if you need anything else.', { satisfied: true, status: 'open' });
      setAwaitingFeedback(false);
      return true;
    }
    if (isNegativeReply(text)) {
      await addMessage(
        'bot',
        `I'm sorry about that.\nYou can contact support:\nPhone: ${SUPPORT_PHONE}\nEmail: ${SUPPORT_EMAIL}\nOr continue chatting here.`,
        { satisfied: false, status: 'open' }
      );
      if (session) await updateSupportChatSession(session.id, { satisfied: false, status: 'open' });
      setAwaitingFeedback(false);
      return true;
    }
    return false;
  };

  const processMessage = async (raw: string) => {
    const text = raw.trim();
    if (!text || !session) return;

    await addMessage('user', text, { status: 'open' });
    setShouldAutoScroll(true);
    setInput('');
    setIsTyping(true);

    try {
      if (await handleCheckoutReply(text)) return;
      if (await handleSatisfactionReply(text)) return;

      if (isNegativeReply(text)) {
        await addMessage(
          'bot',
          `I'm sorry about that.\nYou can contact support:\nPhone: ${SUPPORT_PHONE}\nEmail: ${SUPPORT_EMAIL}\nOr continue chatting here.`,
          { satisfied: false, status: 'open' }
        );
        if (session) await updateSupportChatSession(session.id, { satisfied: false, status: 'open' });
        return;
      }

      const intent = keywordIntent(text);
      if (intent.hello) {
        await addMessage(
          'bot',
          'I can help with price, stock, warranty, specs, new arrivals, best sellers or order status.'
        );
        return;
      }
      if (intent.order) {
        await handleOrderIntent(text);
        return;
      }
      if (intent.arrivals || intent.bestSellers) {
        const kind = intent.arrivals ? 'arrivals' : 'bestSellers';
        const loadingId = `bot_loading_${Date.now()}`;
        await addMessage(
          'bot',
          '',
          undefined,
          {
            id: loadingId,
            type: 'loading_products',
          }
        );
        const latestProducts = loadingProducts ? await getProducts() : products;
        if (loadingProducts) setProducts(latestProducts);
        const list =
          kind === 'arrivals'
            ? listProductsForIntent('arrivals')
            : listProductsForIntent('bestSellers');
        if (!list.length) {
          await addMessage(
            'bot',
            kind === 'arrivals'
              ? 'No new arrivals are available right now.'
              : 'No best seller products are available right now.'
          );
          return;
        }
        await addBotProductCardsAnswer(
          kind === 'arrivals' ? 'Here are our new arrivals:' : 'Here are our best sellers:',
          list
        );
        return;
      }

      const product = findProduct(text);
      if (product) {
        await addBotAnswer(buildProductAnswer(product, text));
        return;
      }

      const asksProductField =
        intent.price || intent.stock || intent.warranty || intent.battery || intent.water || intent.specs || intent.rating;
      if (asksProductField) {
        await addMessage(
          'bot',
          `Please mention the product name.\n\nFor example:\n${productPromptExamples}`
        );
        return;
      }

      if (loadingProducts) {
        await addMessage('bot', 'Please wait a moment. I am still loading product data.');
        return;
      }

      await addMessage(
        'bot',
        'I can help with price, stock, warranty, specs, new arrivals, best sellers or order status.'
      );
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (!pendingPrompt || !session) return;
    void processMessage(pendingPrompt);
    setPendingPrompt(null);
  }, [pendingPrompt, session]);

  const chips = useMemo(() => QUICK_CHIPS, []);
  const productPromptExamples = useMemo(() => {
    const candidates = products
      .filter((product) => Boolean(product?.name))
      .slice(0, 3)
      .map((product) => `- ${product.name}`);
    if (candidates.length === 0) return '- Smart Ring\n- Smart Monitor\n- Smart Band';
    return candidates.join('\n');
  }, [products]);

  return (
    <div className="fixed bottom-4 right-0 left-0 sm:left-auto sm:bottom-8 sm:right-5 z-[95] pointer-events-none">
      {open ? (
        <div
          ref={panelRef}
          className="pointer-events-auto w-full sm:w-[390px] h-[78vh] sm:h-[580px] sm:rounded-2xl border border-slate-700 bg-slate-900 text-gray-100 shadow-2xl overflow-hidden flex flex-col transform transition-all duration-300 ease-out animate-fade-in-up"
        >
          <div className="px-4 py-3 border-b border-slate-700 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <img
                    src={supportAssistantLogo}
                    alt="TheFutureX Assistant"
                    className="h-9 w-9 rounded-full object-cover border border-gray-200 shadow-sm"
                  />
                </div>
                <div>
                  <p className="font-semibold text-sm leading-tight text-white">TheFutureX Support</p>
                  <p className="text-[11px] text-slate-300 leading-tight">Smart Support by TheFutureX</p>
                  <p className="text-[11px] text-slate-400 leading-tight">This conversation may be recorded for quality purposes.</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mr-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Online
              </div>
              <button
                type="button"
                className="h-7 w-7 rounded-full text-slate-300 hover:bg-slate-700 transition-colors"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
              >
                x
              </button>
            </div>
          </div>

          <div
            ref={messagesContainerRef}
            onScroll={() => {
              const el = messagesContainerRef.current;
              if (!el) return;
              const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
              setShouldAutoScroll(distanceFromBottom < 40);
            }}
            className="chat-scrollbar flex-1 overflow-y-scroll p-3 space-y-2 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.98))]"
          >
            {(messages || []).map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.type === 'loading_products' ? (
                  <div className="w-full max-w-[92%] mt-1 overflow-x-auto">
                    <div className="flex gap-3 min-w-max animate-pulse pb-2">
                      <div className="w-64 h-48 bg-gray-200 rounded-2xl border border-gray-100" />
                      <div className="w-64 h-48 bg-gray-200 rounded-2xl border border-gray-100" />
                    </div>
                  </div>
                ) : msg.type === 'compare' && msg.compareProducts && msg.compareProducts.length === 2 ? (
                  <div className="w-full max-w-[92%] bg-white rounded-2xl shadow-md p-4 border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-3">Quick Compare</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {msg.compareProducts.map((product) => (
                        <div key={`${msg.id}_${product.id}`} className="rounded-xl border border-gray-100 p-3">
                          <p className="font-semibold text-gray-900">{product.name}</p>
                          <p className="text-primary-600 font-semibold mt-1">Rs {product.price.toLocaleString()}</p>
                          <p className="text-gray-500 mt-1">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
                          <p className="text-gray-600 mt-1">Battery: {product.battery || 'Not listed'}</p>
                          <p className="text-gray-600">Warranty: {product.warranty || 'Not listed'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : msg.type === 'products' && msg.products && msg.products.length > 0 ? (
                  <div className="w-full max-w-[92%] mt-1 overflow-x-auto">
                    <div className="flex gap-4 min-w-max pb-2">
                      {msg.products.map((product) => (
                        <div
                          key={`${msg.id}_${product.id}`}
                          className="w-64 bg-white rounded-2xl shadow-md p-4 border border-gray-100 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl flex-shrink-0"
                        >
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-32 object-cover rounded-lg border border-gray-100"
                            />
                          ) : (
                            <div className="w-full h-32 rounded-lg border border-gray-100 bg-gray-50" />
                          )}
                          <div className="mt-2 flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-gray-900 text-sm leading-snug">{product.name}</h3>
                            {product.isNew && (
                              <span className="text-[10px] px-2 py-1 bg-green-100 text-green-600 rounded-full font-medium">
                                NEW
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-lg font-bold text-primary-600">Rs {product.price.toLocaleString()}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button
                              type="button"
                              className="flex-1 bg-primary-600 text-white text-xs py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => void handleAddToCartFromChat(product)}
                              disabled={product.stock <= 0}
                            >
                              Add to Cart
                            </button>
                            <button
                              type="button"
                              className="flex-1 border border-gray-300 bg-white text-gray-700 text-xs py-2 rounded-lg hover:bg-gray-100 transition"
                              onClick={() => void handleCompareFromChat(product)}
                            >
                              Compare
                            </button>
                            <button
                              type="button"
                              className="flex-1 border border-primary-200 bg-white text-primary-700 text-xs py-2 rounded-lg hover:bg-primary-50 transition"
                              onClick={() => {
                                window.location.href = `/product/${product.id}`;
                              }}
                            >
                              View
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                      msg.sender === 'user'
                        ? 'bg-primary-600 text-white shadow-sm'
                        : msg.sender === 'admin'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-100 border border-slate-700'
                    }`}
                  >
                    {msg.text}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3 py-2 text-sm shadow-sm">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.2s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.1s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-3 py-2 border-t border-slate-700 bg-slate-900 sticky bottom-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void processMessage(input);
                }}
                placeholder="Type your message..."
                className="flex-1 rounded-lg px-3 py-2 text-sm border border-slate-600 bg-slate-800 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              />
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm font-semibold bg-primary-600 text-white hover:bg-primary-500"
                onClick={() => void processMessage(input)}
              >
                Send
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {chips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="text-xs px-2 py-1 rounded-full border border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700"
                  onClick={() => void processMessage(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="pointer-events-auto flex justify-end p-3 sm:p-0 sm:pr-0">
          <div className="relative">
            {showTooltip && (
              <div className="absolute -top-12 right-0 rounded-lg border border-primary-400/40 bg-slate-900 text-slate-100 text-xs px-2.5 py-1.5 shadow-md whitespace-nowrap">
                Hi! Ask me about products or orders.
              </div>
            )}
            <button
              type="button"
              className="h-12 w-12 rounded-full border border-primary-400/60 bg-slate-900 text-white shadow-[0_0_0_3px_rgba(99,102,241,0.2),0_10px_20px_rgba(0,0,0,0.35)] hover:shadow-[0_0_0_4px_rgba(99,102,241,0.28),0_12px_24px_rgba(0,0,0,0.4)] transition-all duration-200 flex items-center justify-center"
              onClick={() => setOpen(true)}
              aria-label="Open support chat"
            >
              <span className="relative inline-flex">
                <img
                  src={supportAssistantLogo}
                  alt="Assistant logo"
                  className="h-7 w-7 rounded-full object-cover border border-slate-500"
                />
                <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-white" />
              </span>
            </button>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="absolute right-14 top-1/2 -translate-y-1/2 rounded-full border border-primary-400/60 bg-gradient-to-r from-primary-600 to-cyan-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200 whitespace-nowrap"
              aria-label="Chat with Smart Support"
            >
              Chat with Smart Support
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
