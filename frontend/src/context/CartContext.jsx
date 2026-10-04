import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'sb.cart.plumbing';

const CartContext = createContext(null);

/**
 * Catalogue items that were retired because they repeated another item (V23
 * migration), and the item that replaced each. A cart saved in someone's
 * browser before that still holds the old slug; without this its checkout
 * would be rejected as "not an option". Only the old line's identity and
 * price are swapped — quantity is kept.
 */
const RETIRED_ITEMS = {
  'health-faucet-installation-tapfaucet': {
    itemSlug: 'health-faucet-installation',
    unitPricePaise: 29900,
    description: 'Installation of health faucet with holder and connection.',
  },
};

function migrateRetiredItems(items) {
  const merged = [];

  items.forEach((item) => {
    const next = RETIRED_ITEMS[item.itemSlug] ? { ...item, ...RETIRED_ITEMS[item.itemSlug] } : item;
    const existing = merged.find((i) => i.itemSlug === next.itemSlug);

    if (existing) {
      existing.quantity += next.quantity;
    } else {
      merged.push({ ...next });
    }
  });

  return merged;
}

function readStoredItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? migrateRetiredItems(parsed) : [];
  } catch {
    return [];
  }
}

/** Which cart an item belongs to: electrical items' slugs start "elec-"
    (data/electricalContent.js), everything else is plumbing. */
const cartOf = (itemSlug) => (String(itemSlug || '').startsWith('elec-') ? 'electrical' : 'plumbing');

/**
 * The services carts (plumbing and electrical) — client-side state persisted
 * to localStorage (same pattern as LocationContext), so it survives
 * navigation and a page reload. There is no server-side "saved cart": the
 * cart exists only until the customer checks out, at which point its
 * contents are submitted as one real booking (see PlumbingCheckout.jsx) and
 * that cart is cleared.
 *
 * Both carts share one list and one storage key; useCart('electrical') and
 * useCart() (plumbing) each see, count, total and clear only their own
 * items, so checking out one never touches the other.
 *
 * An item's identity is its catalogue slug (itemSlug) — adding an item
 * already in the cart increments its quantity rather than duplicating the row.
 */
export function CartProvider({ children }) {
  const [items, setItems] = useState(readStoredItems);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* private browsing or storage disabled — cart still works for this session */
    }
  }, [items]);

  const addItem = (item) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.itemSlug === item.itemSlug);
      if (existing) {
        return prev.map((i) =>
          i.itemSlug === item.itemSlug ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (itemSlug) => {
    setItems((prev) => prev.filter((i) => i.itemSlug !== itemSlug));
  };

  const updateQuantity = (itemSlug, quantity) => {
    if (quantity <= 0) {
      removeItem(itemSlug);
      return;
    }
    setItems((prev) => prev.map((i) => (i.itemSlug === itemSlug ? { ...i, quantity } : i)));
  };

  const quantityOf = (itemSlug) => items.find((i) => i.itemSlug === itemSlug)?.quantity || 0;

  return (
    <CartContext.Provider value={{ items, setItems, addItem, removeItem, updateQuantity, quantityOf }}>
      {children}
    </CartContext.Provider>
  );
}

/** One cart: 'plumbing' (the default) or 'electrical'. */
export function useCart(cart = 'plumbing') {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');

  const { items: allItems, setItems, ...actions } = ctx;
  const items = useMemo(() => allItems.filter((i) => cartOf(i.itemSlug) === cart), [allItems, cart]);
  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotalPaise = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPricePaise * i.quantity, 0),
    [items]
  );
  const clear = () => setItems((prev) => prev.filter((i) => cartOf(i.itemSlug) !== cart));

  return { ...actions, items, count, subtotalPaise, clear };
}

/** Items across both carts, for the cart badges in the header and bottom bar. */
export function useCartCount() {
  const plumbing = useCart('plumbing');
  const electrical = useCart('electrical');
  return plumbing.count + electrical.count;
}
