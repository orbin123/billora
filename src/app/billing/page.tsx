"use client";

import { useCallback, useRef, useState } from "react";
import { Banknote, Check, CheckCircle2, CookingPot, CreditCard, Menu, Minus, Plus, ReceiptText, Search, ShoppingBag, Smartphone, Trash2, UtensilsCrossed, X } from "lucide-react";
import { useWorkspaceMutation } from "@/lib/use-workspace-mutation";
import { useWorkspace } from "@/components/workspace-provider";
import { ReceiptDialog } from "@/components/receipt-dialog";
import { WorkspaceDialog } from "@/components/workspace-dialog";
import { WorkspaceNavigation, WorkspaceProfile } from "@/components/workspace-navigation";
import { paymentMethods, totalsFor, type Bill, type BillLine, type Food, type OrderDetails, type PaymentMethod } from "@/data/workspace";
import styles from "./billing.module.css";
import common from "../categories/categories.module.css";

const initialOrder: OrderDetails = { customerName: "", orderType: "Pick Up" };

export default function BillingPage() {
  const { categories, foods, heldBill, business, money } = useWorkspace();
  const mutation = useWorkspaceMutation();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<BillLine[]>(heldBill?.lines ?? []);
  const [cartOpen, setCartOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const held = heldBill !== null;
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [order, setOrder] = useState<OrderDetails>(heldBill ?? initialOrder);
  const [receipt, setReceipt] = useState<Bill | null>(null);
  const availableCategories = categories.filter((category) => category.status === "Active");
  const filteredFoods = foods.filter((food) =>
    food.status === "Available" &&
    availableCategories.some(({ id }) => id === food.categoryId) &&
    (activeCategory === null || food.categoryId === activeCategory) &&
    food.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const pricedCart = cart.map((item) => ({ ...item, price: foods.find(({ id }) => id === item.id)?.price ?? item.price }));
  const totals = totalsFor(pricedCart, business);
  const checkoutAttempt = useRef<{ input: string; key: string } | null>(null);

  function updateCart(food: Pick<Food, "id" | "name" | "price">, amount: number) {
    const stock = foods.find(({ id }) => id === food.id)?.quantity ?? 0;
    setCart((current) => {
      const line = current.find((item) => item.id === food.id);
      const quantity = Math.min(stock, (line?.quantity ?? 0) + amount);
      if (quantity <= 0) return current.filter(({ id }) => id !== food.id);
      if (!line) return [...current, { id: food.id, name: food.name, price: food.price, quantity }];
      return current.map((item) => item.id === food.id ? { ...item, quantity } : item);
    });
    if (amount > 0) setNotice(`${food.name} added to the bill.`);
  }

  function completeBill(payment: PaymentMethod, received?: number) {
    if (!cart.length) return;
    const checkout = {
      ...order,
      lines: pricedCart.map(({ id, price, quantity }) => ({ id, price, quantity })),
      payment, received, currency: business.currency, gstComponentRate: business.gstComponentRate,
    };
    const input = JSON.stringify(checkout);
    if (checkoutAttempt.current?.input !== input) checkoutAttempt.current = { input, key: crypto.randomUUID() };
    void mutation.run({ kind: "checkout", checkout: { ...checkout, key: checkoutAttempt.current.key } }, (bill) => {
      if (!bill) return;
      checkoutAttempt.current = null;
      setCart([]);
      setOrder(initialOrder);
      setPaymentOpen(false);
      setNotice("");
      setReceipt(bill);
    });
  }

  function toggleHold() {
    void mutation.run({ kind: "hold", bill: held ? null : { ...order, lines: cart } }, () => {
      setNotice(held ? "Bill resumed." : "Bill held. You can resume it when you return.");
    });
  }

  return <div className={common.shell}>
    <WorkspaceNavigation styles={common} current="/billing" open={menuOpen} onClose={closeMenu} />
    <main className={common.main}>
      <header className={common.topbar}>
        <div className={common.pageIntro}>
          <button className={common.menuButton} type="button" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu /></button>
          <div><p>Point of sale</p><h1>New bill</h1></div>
        </div>
        <WorkspaceProfile styles={common} />
      </header>
      <div className={styles.page}>
        <div className={styles.workspace}>
          <section className={styles.catalogue} aria-label="Food catalogue">
            <div className={styles.catalogueHeading}>
              <h2>Food catalogue</h2>
              <p className={styles.foodCount}>{filteredFoods.length} foods</p>
            </div>
            <label className={styles.searchBox}>
              <Search aria-hidden="true" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search foods by name…" aria-label="Search foods" />
              {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X aria-hidden="true" /></button>}
            </label>
            <div className={styles.categoryList} aria-label="Food categories">
              <button type="button" onClick={() => setActiveCategory(null)} className={activeCategory === null ? styles.categoryActive : ""} aria-pressed={activeCategory === null}><UtensilsCrossed aria-hidden="true" /> All</button>
              {availableCategories.map((category) => <button type="button" key={category.id} onClick={() => setActiveCategory(category.id)} className={activeCategory === category.id ? styles.categoryActive : ""} aria-pressed={activeCategory === category.id}>{category.name}</button>)}
            </div>
            {filteredFoods.length ? <div className={styles.foodGrid}>
              {filteredFoods.map((food) => {
                const inCart = cart.find((item) => item.id === food.id);
                return <article className={styles.foodCard} key={food.id}>
                  <div className={`${styles.foodVisual} ${styles[food.tone] ?? ""}`} aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element -- Local file preview. */}
                    {food.image ? <img src={food.image} alt="" /> : <span>{food.emoji}</span>}
                  </div>
                  <div className={styles.foodDetails}><span className={styles.foodCategory}>{categories.find(({ id }) => id === food.categoryId)?.name}</span><h2>{food.name}</h2></div>
                  <div className={styles.foodFooter}>
                    <strong>{money.format(food.price)}</strong>
                    {inCart
                      ? <QuantityControl name={food.name} quantity={inCart.quantity} limit={food.quantity} held={held} onChange={(amount) => updateCart(food, amount)} />
                      : <button className={styles.addFood} type="button" disabled={held || food.quantity === 0} onClick={() => updateCart(food, 1)} aria-label={food.quantity === 0 ? undefined : `Add ${food.name}`}>{food.quantity === 0 ? "Sold out" : <><Plus aria-hidden="true" /><span>Add</span></>}</button>}
                  </div>
                </article>;
              })}
            </div> : <div className={styles.emptyFoods}><CookingPot aria-hidden="true" /><strong>No foods found</strong><span>Try a different search or category.</span><button type="button" onClick={() => { setQuery(""); setActiveCategory(null); }}>Show all foods</button></div>}
          </section>
          <aside className={`${styles.billPanel} ${cartOpen ? styles.billOpen : ""}`} aria-label="Current bill">
            <div className={styles.mobileSheetHandle} />
            <div className={styles.billHeader}>
              <h2>Current bill</h2>
              {held && <span className={styles.heldButton}><Check aria-hidden="true" /> Held</span>}
              <button type="button" className={styles.closeCart} onClick={() => setCartOpen(false)} aria-label="Close current bill"><X /></button>
            </div>
            <div className={styles.cartItems}>
              {cart.length ? pricedCart.map((item) => {
                const food = foods.find(({ id }) => id === item.id);
                return <article className={styles.cartItem} key={item.id}>
                  <span className={`${styles.cartEmoji} ${styles[food?.tone ?? ""] ?? ""}`} aria-hidden="true">{food?.emoji}</span>
                  <div className={styles.cartCopy}><strong>{item.name}</strong><span>{money.format(item.price)} each</span>
                    <QuantityControl name={item.name} quantity={item.quantity} limit={food?.quantity ?? 0} held={held} onChange={(amount) => updateCart(item, amount)} compact />
                  </div>
                  <div className={styles.cartPrice}><strong>{money.format(item.price * item.quantity)}</strong>
                    <button type="button" disabled={held} onClick={() => setCart((current) => current.filter(({ id }) => id !== item.id))} aria-label={`Remove ${item.name} from bill`}><Trash2 aria-hidden="true" /></button>
                  </div>
                </article>;
              }) : <div className={styles.emptyBill}><ShoppingBag aria-hidden="true" /><strong>Your bill is empty</strong><span>Add foods from the menu to get started.</span></div>}
            </div>
            <div className={styles.summary}>
              <div><span>Subtotal</span><strong>{money.format(totals.subtotal)}</strong></div>
              <div><span>CGST ({business.gstComponentRate}%)</span><strong>{money.format(totals.cgst)}</strong></div>
              <div><span>SGST ({business.gstComponentRate}%)</span><strong>{money.format(totals.sgst)}</strong></div>
              <div><span>Round off</span><strong>{money.format(totals.roundOff)}</strong></div>
              <div className={styles.grandTotal} aria-live="polite"><span>Grand total</span><strong>{money.format(totals.total)}</strong></div>
            </div>
            <div className={styles.billActions}>
              <button className={styles.holdBill} type="button" onClick={toggleHold} disabled={!cart.length || mutation.pending}>{held ? "Resume bill" : "Hold bill"}</button>
              <button className={styles.checkout} type="button" onClick={() => { mutation.clearError(); setCartOpen(false); setPaymentOpen(true); }} disabled={!cart.length || held || mutation.pending}><ReceiptText aria-hidden="true" /> Checkout</button>
            </div>
          </aside>
        </div>

        <button className={styles.mobileCart} type="button" onClick={() => setCartOpen(true)} aria-expanded={cartOpen} aria-label={`Open current bill with ${itemCount} items`}>
          <span className={styles.mobileCartIcon}><ShoppingBag aria-hidden="true" /><i>{itemCount}</i></span><span><small>Current bill</small><strong>{money.format(totals.total)}</strong></span><span>View bill</span>
        </button>
        {!paymentOpen && mutation.error && <p className={styles.notice} role="alert">{mutation.error}</p>}
        {notice && !mutation.error && <div className={styles.notice} role="status"><Check aria-hidden="true" />{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss message"><X aria-hidden="true" /></button></div>}
        {cartOpen && <button className={styles.billScrim} type="button" tabIndex={-1} aria-label="Dismiss current bill" onClick={() => setCartOpen(false)} />}
        {paymentOpen && <PaymentDialog total={totals.total} order={order} onOrderChange={setOrder} onClose={() => { if (!mutation.pending) { mutation.clearError(); setPaymentOpen(false); } }} onComplete={completeBill} pending={mutation.pending} error={mutation.error} />}
        {receipt && <ReceiptDialog bill={receipt} onClose={() => { setReceipt(null); setNotice(`Bill ${receipt.id} completed.`); }} />}
      </div>
    </main>
  </div>;
}

function QuantityControl({ name, quantity, limit, held, onChange, compact }: {
  name: string; quantity: number; limit: number; held: boolean; onChange: (amount: number) => void; compact?: boolean;
}) {
  return <div className={compact ? styles.cartStepper : styles.foodStepper} aria-label={`${name} quantity`}>
    <button type="button" disabled={held} onClick={() => onChange(-1)} aria-label={`Remove one ${name}`}><Minus aria-hidden="true" /></button>
    <span>{quantity}</span>
    <button type="button" disabled={held || quantity >= limit} onClick={() => onChange(1)} aria-label={`Add one ${name}`}><Plus aria-hidden="true" /></button>
  </div>;
}

function PaymentDialog({ total, order, onOrderChange, onClose, onComplete, pending, error }: {
  total: number;
  order: OrderDetails;
  onOrderChange: (order: OrderDetails) => void;
  onClose: () => void;
  onComplete: (method: PaymentMethod, received?: number) => void;
  pending: boolean;
  error: string;
}) {
  const { money, business } = useWorkspace();
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [received, setReceived] = useState(total.toFixed(2));
  const cash = method === "Cash";
  const valid = !cash || (received.trim().length > 0 && Number.isFinite(Number(received)) && Number(received) >= total);
  const change = cash && valid ? Math.round((Number(received) - total) * 100) / 100 : 0;

  return <WorkspaceDialog titleId="payment-title" onClose={onClose} className={styles.paymentModal}>
    <header><button type="button" onClick={onClose} aria-label="Back to bill"><X /></button><div><p>Checkout</p><h2 id="payment-title">Payment</h2></div></header>
    <div className={styles.paymentTotal}><span>Grand total</span><strong>{money.format(total)}</strong></div>
    <div className={styles.orderDetails}>
      <label className="workspace-field">Customer name <input autoComplete="off" maxLength={80} placeholder="Optional" value={order.customerName} onChange={(event) => onOrderChange({ ...order, customerName: event.target.value })} /></label>
      <label className="workspace-field">Order type
        <select value={order.orderType} onChange={(event) => onOrderChange({ ...order, orderType: event.target.value === "Dine In" ? "Dine In" : "Pick Up" })}>
          <option>Pick Up</option>
          <option>Dine In</option>
        </select>
      </label>
    </div>
    <fieldset className={styles.methodField}><legend>Payment method</legend>
      <div>{paymentMethods.map((label) => {
        const Icon = label === "Cash" ? Banknote : label === "Card" ? CreditCard : Smartphone;
        return <button type="button" key={label} className={method === label ? styles.methodActive : ""} onClick={() => setMethod(label)} aria-pressed={method === label}><Icon />{label}</button>;
      })}</div>
    </fieldset>
    {cash ? <label className={styles.receivedField}><span>Received amount <small>{business.currency}</small></span>
      <input inputMode="decimal" type="number" min={total} step="0.01" aria-label="Received amount" value={received} onChange={(event) => setReceived(event.target.value)} />
      {!valid && <small role="status">Enter at least {money.format(total)}.</small>}
    </label> : <div className={styles.digitalPayment}><Smartphone /><span><strong>{method} selected</strong><small>Collect {money.format(total)} from the customer, then confirm below.</small></span></div>}
    {cash && <div className={styles.changeRow}><span>Change</span><strong>{money.format(change)}</strong></div>}
    {error && <p className="mt-3 text-sm text-rose-800" role="alert">{error}</p>}
    <button className={styles.completePayment} type="button" disabled={!valid || pending} onClick={() => onComplete(method, cash ? Number(received) : undefined)}><CheckCircle2 /> {pending ? "Saving bill…" : "Complete payment"}</button>
  </WorkspaceDialog>;
}
