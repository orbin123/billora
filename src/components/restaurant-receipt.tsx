import { currencyFormatter } from "@/data/business-profile";
import type { Bill } from "@/data/workspace";
import styles from "./restaurant-receipt.module.css";

export function RestaurantReceipt({ bill, paper }: { bill: Bill; paper: 58 | 80 }) {
  const date = new Date(bill.createdAt);
  const { business: businessProfile } = bill;
  const { timeZone, currency } = businessProfile;
  const money = currencyFormatter(currency);
  const receiptDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "numeric", year: "2-digit", timeZone });
  const receiptTime = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone });
  const totalQuantity = bill.lines.reduce((sum, line) => sum + line.quantity, 0);
  const billNumber = bill.id.replace(/^BILL-/, "");
  const taxRate = ` (${bill.gstRate}%)`;

  return (
    <article className={styles.receipt} data-paper={paper} aria-label="Thermal receipt">
      <header className={styles.business}>
        <strong>{businessProfile.name}</strong>
        {businessProfile.addressLines.map((line) => <div key={line}>{line}</div>)}
        {businessProfile.gstin && <div>GSTIN {businessProfile.gstin}</div>}
        {businessProfile.phone && <div>Phone {businessProfile.phone}</div>}
      </header>
      <div className={styles.customer}>Name: {bill.customerName}</div>
      <div className={styles.metadata}>
        <div className={styles.metadataPair}>
          <span>Date: <time dateTime={bill.createdAt}>{receiptDate.format(date)}</time></span>
          <strong>{bill.orderType}</strong>
        </div>
        <div>{receiptTime.format(date)}</div>
        <div className={styles.metadataPair}><span>Cashier: {bill.cashier}</span><span>Bill No.: {billNumber}</span></div>
      </div>

      <table className={styles.items} aria-label="Billed items">
        <thead><tr><th scope="col">Item</th><th scope="col">Qty.</th><th scope="col">Price</th><th scope="col">Amount</th></tr></thead>
        <tbody>
          {bill.lines.map((line) => (
            <tr key={line.id}><td>{line.name}</td><td>{line.quantity}</td><td>{line.price.toFixed(2)}</td><td>{(line.price * line.quantity).toFixed(2)}</td></tr>
          ))}
        </tbody>
      </table>

      <div className={styles.breakdown}>
        <div className={styles.subtotal}><span>Total Qty: {totalQuantity}</span><span>Sub Total</span><span>{bill.subtotal.toFixed(2)}</span></div>
        <div className={styles.amount}><span>CGST{taxRate}</span><span>{bill.cgst.toFixed(2)}</span></div>
        <div className={styles.amount}><span>SGST{taxRate}</span><span>{bill.sgst.toFixed(2)}</span></div>
      </div>
      <div className={styles.final}>
        <div className={styles.amount}><span>Round off</span><span>{bill.roundOff.toFixed(2)}</span></div>
        <strong className={styles.amount}><span>Grand Total</span><span>{money.format(bill.total)}</span></strong>
        <div className={styles.amount}><span>Payment</span><span>{bill.payment}</span></div>
        {bill.received !== undefined && bill.change !== undefined && <>
          <div className={styles.amount}><span>Cash received</span><span>{bill.received.toFixed(2)}</span></div>
          <div className={styles.amount}><span>Change</span><span>{bill.change.toFixed(2)}</span></div>
        </>}
      </div>
      <div className={styles.licence}>
        {businessProfile.fssaiLicense && <div>FSSAI licence {businessProfile.fssaiLicense}</div>}
        <div>Thanks</div>
      </div>
    </article>
  );
}
