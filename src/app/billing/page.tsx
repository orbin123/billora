"use client";

import { useMemo, useState, type ComponentType } from "react";
import {
  Bell,
  Banknote,
  ChartNoAxesCombined,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleUserRound,
  CookingPot,
  CreditCard,
  LayoutDashboard,
  Menu,
  Minus,
  PencilLine,
  Plus,
  Printer,
  ReceiptText,
  Search,
  Settings,
  Shapes,
  ShoppingBag,
  Smartphone,
  Trash2,
  UsersRound,
  UtensilsCrossed,
  X,
} from "lucide-react";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import styles from "./billing.module.css";
import common from "../categories/categories.module.css";

type Food = {
  id: number;
  name: string;
  category: "Rice" | "Fish" | "Curry" | "Egg" | "Drinks" | "Juice";
  price: number;
  emoji: string;
  tone: string;
};

type CartItem = Food & { quantity: number };
type Icon = ComponentType<{ className?: string; strokeWidth?: number }>;
type PaymentMethod = "Cash" | "UPI" | "PhonePe" | "Card";

const foods: Food[] = [
  { id: 1, name: "Meals", category: "Rice", price: 70, emoji: "🍚", tone: "rice" },
  { id: 2, name: "Chicken curry", category: "Curry", price: 90, emoji: "🍛", tone: "curry" },
  { id: 3, name: "Fish fry", category: "Fish", price: 120, emoji: "🐟", tone: "fish" },
  { id: 4, name: "Egg curry", category: "Egg", price: 25, emoji: "🥘", tone: "egg" },
  { id: 5, name: "Parotta", category: "Rice", price: 20, emoji: "🫓", tone: "parotta" },
  { id: 6, name: "Ghee rice", category: "Rice", price: 80, emoji: "🍚", tone: "ghee" },
  { id: 7, name: "Curd rice", category: "Rice", price: 50, emoji: "🍚", tone: "curd" },
  { id: 8, name: "Tea", category: "Drinks", price: 15, emoji: "☕", tone: "tea" },
  { id: 9, name: "Lime juice", category: "Juice", price: 25, emoji: "🥤", tone: "juice" },
];

const categories = ["All", "Rice", "Fish", "Curry", "Egg", "Drinks", "Juice"] as const;
const navigation: Array<{ label: string; icon: Icon; href?: string }> = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Categories", icon: Shapes, href: "/categories" },
  { label: "Foods", icon: UtensilsCrossed, href: "/foods" },
  { label: "Billing", icon: ReceiptText, href: "/billing" },
  { label: "Today's bills", icon: ReceiptText, href: "/bills" },
  { label: "Reports", icon: ChartNoAxesCombined, href: "/reports" },
  { label: "Users", icon: UsersRound, href: "/users" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export default function BillingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>("All");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([
    { ...foods[0], quantity: 2 },
    { ...foods[2], quantity: 1 },
    { ...foods[3], quantity: 1 },
  ]);
  const [cartOpen, setCartOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [held, setHeld] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"payment" | "receipt" | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [receivedAmount, setReceivedAmount] = useState("");

  const filteredFoods = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return foods.filter((food) => {
      const matchesCategory = activeCategory === "All" || food.category === activeCategory;
      const matchesSearch = !normalizedQuery || food.name.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, query]);

  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;
  const received = Number(receivedAmount) || 0;
  const amountReceived = paymentMethod === "Cash" ? received : total;
  const change = Math.max(0, amountReceived - total);
  const canCompletePayment = paymentMethod !== "Cash" || amountReceived >= total;
  const billNumber = `BILL-${String(124).padStart(6, "0")}`;

  const openPayment = () => {
    setPaymentMethod("Cash");
    setReceivedAmount(String(Math.ceil(total)));
    setCartOpen(false);
    setCheckoutStep("payment");
  };

  const updateCart = (food: Food, amount: number) => {
    setCart((current) => {
      const found = current.find((item) => item.id === food.id);
      if (!found && amount > 0) return [...current, { ...food, quantity: 1 }];
      if (!found) return current;
      const nextQuantity = found.quantity + amount;
      if (nextQuantity <= 0) return current.filter((item) => item.id !== food.id);
      return current.map((item) => item.id === food.id ? { ...item, quantity: nextQuantity } : item);
    });
    if (amount > 0) setNotice(`${food.name} added to the bill`);
  };

  const removeItem = (id: number) => setCart((current) => current.filter((item) => item.id !== id));

  return (
    <div className={common.shell}>
      <button className={`${common.scrim} ${menuOpen ? common.scrimVisible : ""}`} aria-label="Close navigation" onClick={() => setMenuOpen(false)} />
      <aside className={`${common.sidebar} ${menuOpen ? common.sidebarOpen : ""}`}>
        <div className={common.brandRow}><BrandMark className={common.brandMark} size="sidebar" /><div className={common.brandCopy}><strong>BILLORA</strong><span>All Your Billing, One Place.</span></div><button className={common.closeMenu} onClick={() => setMenuOpen(false)} aria-label="Close menu"><X /></button></div>
        <nav className={common.nav} aria-label="Main navigation"><span className={common.navLabel}>Workspace</span>{navigation.map((item) => { const NavIcon = item.icon; const content = <><NavIcon aria-hidden="true" /><span>{item.label}</span></>; return item.href ? <Link className={`${common.navItem} ${item.label === "Billing" ? common.navItemActive : ""}`} href={item.href} key={item.label} aria-current={item.label === "Billing" ? "page" : undefined} onClick={() => setMenuOpen(false)}>{content}</Link> : <button className={common.navItem} key={item.label} type="button">{content}</button>; })}</nav>
        <div className={common.sidebarFooter}><div className={common.storeStatus}><i /><span><strong>Hotel Malabar</strong><small>Counter is online</small></span></div></div>
      </aside>
      <main className={common.main}>
        <header className={common.topbar}><div className={common.pageIntro}><button className={common.menuButton} onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu /></button><div><p>Point of sale</p><h1>New bill</h1></div></div><div className={common.profileArea}><span className={common.demoBadge}>Demo data</span><button className={common.iconButton} type="button" aria-label="Notifications"><Bell /></button><button className={common.profileButton} type="button" aria-label="Open profile menu"><span className={common.avatar}><CircleUserRound /></span><span className={common.profileCopy}><strong>Ajmal</strong><small>Administrator</small></span><ChevronDown /></button></div></header>
        <div className={styles.page}>
      <div className={styles.workspace}>
        <section className={styles.catalogue} aria-label="Food catalogue">
          <div className={styles.catalogueHeading}>
            <div><p className={styles.eyebrow}>Point of sale</p><h1>New bill</h1></div>
            <p className={styles.foodCount}>{filteredFoods.length} foods available</p>
          </div>

          <label className={styles.searchBox}>
            <Search aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search foods by name…" aria-label="Search foods" />
            {query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X aria-hidden="true" /></button> : <span className={styles.searchShortcut}>⌘ K</span>}
          </label>

          <div className={styles.categoryList} aria-label="Food categories">
            {categories.map((category) => (
              <button type="button" key={category} onClick={() => setActiveCategory(category)} className={activeCategory === category ? styles.categoryActive : ""} aria-pressed={activeCategory === category}>
                {category === "All" && <UtensilsCrossed aria-hidden="true" />}{category}
              </button>
            ))}
          </div>

          {filteredFoods.length > 0 ? (
            <div className={styles.foodGrid}>
              {filteredFoods.map((food) => {
                const inCart = cart.find((item) => item.id === food.id);
                return (
                  <article className={styles.foodCard} key={food.id}>
                    <div className={`${styles.foodVisual} ${styles[food.tone]}`} aria-hidden="true"><span>{food.emoji}</span></div>
                    <div className={styles.foodDetails}><span className={styles.foodCategory}>{food.category}</span><h2>{food.name}</h2></div>
                    <div className={styles.foodFooter}><strong>₹{food.price}</strong>
                      {inCart ? (
                        <div className={styles.foodStepper} aria-label={`${food.name} quantity`}><button type="button" onClick={() => updateCart(food, -1)} aria-label={`Remove one ${food.name}`}><Minus aria-hidden="true" /></button><span>{inCart.quantity}</span><button type="button" onClick={() => updateCart(food, 1)} aria-label={`Add one ${food.name}`}><Plus aria-hidden="true" /></button></div>
                      ) : <button className={styles.addFood} type="button" onClick={() => updateCart(food, 1)} aria-label={`Add ${food.name}`}><Plus aria-hidden="true" /><span>Add</span></button>}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : <div className={styles.emptyFoods}><CookingPot aria-hidden="true" /><strong>No foods found</strong><span>Try a different search or category.</span><button type="button" onClick={() => { setQuery(""); setActiveCategory("All"); }}>Show all foods</button></div>}
        </section>

        <aside className={`${styles.billPanel} ${cartOpen ? styles.billOpen : ""}`} aria-label="Current bill">
          <div className={styles.mobileSheetHandle} />
          <div className={styles.billHeader}><div><p className={styles.eyebrow}>Order #{String(23).padStart(4, "0")}</p><h2>Current bill</h2></div><button className={held ? styles.heldButton : styles.dineInButton} type="button" onClick={() => setHeld((current) => !current)}>{held ? <><Check aria-hidden="true" /> Held</> : <>Dine in <ChevronDown aria-hidden="true" /></>}</button></div>

          <div className={styles.cartItems}>
            {cart.length ? cart.map((item) => (
              <article className={styles.cartItem} key={item.id}>
                <span className={`${styles.cartEmoji} ${styles[item.tone]}`} aria-hidden="true">{item.emoji}</span>
                <div className={styles.cartCopy}><strong>{item.name}</strong><span>₹{item.price} each</span><div className={styles.cartStepper}><button type="button" onClick={() => updateCart(item, -1)} aria-label={`Remove one ${item.name}`}><Minus aria-hidden="true" /></button><span>{item.quantity}</span><button type="button" onClick={() => updateCart(item, 1)} aria-label={`Add one ${item.name}`}><Plus aria-hidden="true" /></button></div></div>
                <div className={styles.cartPrice}><strong>₹{item.price * item.quantity}</strong><button type="button" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name} from bill`}><Trash2 aria-hidden="true" /></button></div>
              </article>
            )) : <div className={styles.emptyBill}><ShoppingBag aria-hidden="true" /><strong>Your bill is empty</strong><span>Add foods from the menu to get started.</span></div>}
          </div>

          <div className={styles.summary}>
            <div><span>Subtotal</span><strong>₹{subtotal.toFixed(2)}</strong></div>
            <div><span>Discount <button type="button" aria-label="Edit discount"><PencilLine aria-hidden="true" /></button></span><strong>₹0.00</strong></div>
            <div><span>CGST (2.5%)</span><strong>₹{(tax / 2).toFixed(2)}</strong></div>
            <div><span>SGST (2.5%)</span><strong>₹{(tax / 2).toFixed(2)}</strong></div>
            <div className={styles.grandTotal}><span>Grand total</span><strong>₹{total.toFixed(2)}</strong></div>
          </div>

          <div className={styles.billActions}><button className={styles.holdBill} type="button" onClick={() => { setHeld(true); setNotice("Bill held safely for later"); }} disabled={!cart.length}>Hold bill</button><button className={styles.checkout} type="button" onClick={openPayment} disabled={!cart.length}><ReceiptText aria-hidden="true" /> Checkout</button></div>
        </aside>
      </div>

      <button className={styles.mobileCart} type="button" onClick={() => setCartOpen(true)} aria-label={`Open current bill with ${itemCount} items`}><span className={styles.mobileCartIcon}><ShoppingBag aria-hidden="true" /><i>{itemCount}</i></span><span><small>Current bill</small><strong>₹{total.toFixed(2)}</strong></span><span>View bill</span></button>
      {notice && <div className={styles.notice} role="status"><Check aria-hidden="true" />{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss message"><X aria-hidden="true" /></button></div>}
      {cartOpen && <button className={styles.billScrim} type="button" aria-label="Close current bill" onClick={() => setCartOpen(false)} />}
      {checkoutStep === "payment" && <PaymentModal total={total} paymentMethod={paymentMethod} receivedAmount={receivedAmount} change={change} canCompletePayment={canCompletePayment} onMethodChange={setPaymentMethod} onReceivedChange={setReceivedAmount} onBack={() => setCheckoutStep(null)} onComplete={() => setCheckoutStep("receipt")} />}
      {checkoutStep === "receipt" && <ReceiptModal billNumber={billNumber} cart={cart} subtotal={subtotal} tax={tax} total={total} paymentMethod={paymentMethod} onClose={() => { setCheckoutStep(null); setNotice("Payment completed and receipt is ready"); }} />}
        </div>
      </main>
    </div>
  );
}

function PaymentModal({ total, paymentMethod, receivedAmount, change, canCompletePayment, onMethodChange, onReceivedChange, onBack, onComplete }: { total: number; paymentMethod: PaymentMethod; receivedAmount: string; change: number; canCompletePayment: boolean; onMethodChange: (method: PaymentMethod) => void; onReceivedChange: (amount: string) => void; onBack: () => void; onComplete: () => void }) {
  const methods: Array<{ label: PaymentMethod; icon: typeof Banknote }> = [{ label: "Cash", icon: Banknote }, { label: "UPI", icon: Smartphone }, { label: "PhonePe", icon: Smartphone }, { label: "Card", icon: CreditCard }];
  return <div className={styles.checkoutBackdrop} role="presentation"><section className={styles.paymentModal} role="dialog" aria-modal="true" aria-labelledby="payment-title"><header><button type="button" onClick={onBack} aria-label="Back to bill"><X /></button><div><p>Checkout</p><h2 id="payment-title">Payment</h2></div></header><div className={styles.paymentTotal}><span>Grand total</span><strong>₹{total.toFixed(2)}</strong></div><fieldset className={styles.methodField}><legend>Payment method</legend><div>{methods.map(({ label, icon: MethodIcon }) => <button type="button" key={label} className={paymentMethod === label ? styles.methodActive : ""} onClick={() => onMethodChange(label)} aria-pressed={paymentMethod === label}><MethodIcon /><span>{label}</span></button>)}</div></fieldset>{paymentMethod === "Cash" ? <label className={styles.receivedField}><span>Received amount <small>₹</small></span><input inputMode="decimal" type="number" min={total} value={receivedAmount} onChange={(event) => onReceivedChange(event.target.value)} aria-label="Received amount" /><small>{Number(receivedAmount) < total ? `Enter at least ₹${total.toFixed(2)}` : ""}</small></label> : <div className={styles.digitalPayment}><Smartphone /><span><strong>{paymentMethod} selected</strong><small>Collect ₹{total.toFixed(2)} from the customer, then confirm below.</small></span></div>}<div className={styles.changeRow}><span>Change</span><strong>₹{change.toFixed(2)}</strong></div><button className={styles.completePayment} type="button" disabled={!canCompletePayment} onClick={onComplete}><CheckCircle2 /> Complete payment</button></section></div>;
}

function ReceiptModal({ billNumber, cart, subtotal, tax, total, paymentMethod, onClose }: { billNumber: string; cart: CartItem[]; subtotal: number; tax: number; total: number; paymentMethod: PaymentMethod; onClose: () => void }) {
  return <div className={styles.checkoutBackdrop} role="presentation"><section className={styles.receiptModal} role="dialog" aria-modal="true" aria-labelledby="receipt-title"><header><div><p>Payment complete</p><h2 id="receipt-title">Receipt preview</h2></div><button type="button" onClick={onClose} aria-label="Close receipt"><X /></button></header><article className={styles.receipt}><div className={styles.receiptBrand}><span><CookingPot /></span><div><strong>HOTEL MALABAR</strong><small>Delicious food, happy you!</small></div></div><div className={styles.receiptMeta}><span>Bill no. <b>{billNumber}</b></span><span>23 Aug 2026, 9:55 PM</span></div><div className={styles.receiptItems}><div className={styles.receiptHead}><span>Item</span><span>Qty</span><span>Price</span><span>Total</span></div>{cart.map((item) => <div key={item.id}><span>{item.name}</span><span>{item.quantity}</span><span>₹{item.price}</span><strong>₹{item.price * item.quantity}</strong></div>)}</div><div className={styles.receiptTotals}><span><b>Subtotal</b><b>₹{subtotal.toFixed(2)}</b></span><span><b>CGST (2.5%)</b><b>₹{(tax / 2).toFixed(2)}</b></span><span><b>SGST (2.5%)</b><b>₹{(tax / 2).toFixed(2)}</b></span><strong><b>Grand total</b><b>₹{total.toFixed(2)}</b></strong></div><div className={styles.receiptPayment}><span>Payment · {paymentMethod}</span><i aria-label="Payment confirmed"><Check /></i></div><p className={styles.receiptThanks}>Thank you. Visit again!</p><p className={styles.receiptFoot}>Powered by Billora</p></article><footer><button type="button" onClick={onClose}>Done</button><button type="button" onClick={() => window.print()}><Printer /> Print receipt</button></footer></section></div>;
}
