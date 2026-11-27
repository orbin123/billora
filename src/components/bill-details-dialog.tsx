"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Printer, X } from "lucide-react";
import { currencyFormatter } from "@/data/business-profile";
import type { Bill } from "@/data/workspace";
import { InsightRows } from "./insight-panel";
import { RestaurantReceipt } from "./restaurant-receipt";
import receiptStyles from "./restaurant-receipt.module.css";
import { Button } from "./ui/button";
import { WorkspaceDialog } from "./workspace-dialog";
import { useWorkspace } from "./workspace-provider";
import styles from "./bill-details-dialog.module.css";

export function BillDetailsDialog({ bill, onClose }: { bill: Bill; onClose: () => void }) {
  const { paper, allows } = useWorkspace();
  const canPrint = allows("Print bills");
  const [printError, setPrintError] = useState(false);
  const money = currencyFormatter(bill.business.currency);
  const time = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium", timeStyle: "short", timeZone: bill.business.timeZone,
  });

  function printBill() {
    setPrintError(false);
    try {
      window.print();
    } catch {
      setPrintError(true);
    }
  }

  return <>
    <WorkspaceDialog titleId="bill-details-title" onClose={onClose} className={styles.dialog}>
      <header className={styles.header}>
        <div><p>Bill details</p><h2 id="bill-details-title">{bill.id}</h2></div>
        <Button type="button" variant="ghost" className={styles.close} onClick={onClose} aria-label="Close bill details">
          <X aria-hidden="true" />
        </Button>
      </header>
      <div className={styles.body}>
        <dl className={styles.metadata}>
          <div><dt>Date and time</dt><dd><time dateTime={bill.createdAt}>{time.format(new Date(bill.createdAt))}</time></dd></div>
          <div><dt>Cashier</dt><dd>{bill.cashier}</dd></div>
          <div><dt>Payment method</dt><dd>{bill.payment}</dd></div>
          <div><dt>Order type</dt><dd>{bill.orderType}</dd></div>
          {bill.customerName && <div><dt>Customer</dt><dd>{bill.customerName}</dd></div>}
        </dl>
        <section aria-labelledby="billed-items-title">
          <h3 id="billed-items-title">Items</h3>
          <InsightRows
            label="Billed items"
            rows={bill.lines.map((line) => ({
              key: line.id,
              label: line.name,
              detail: `${line.quantity} × ${money.format(line.price)}`,
              value: money.format(line.quantity * line.price),
            }))}
            empty="No items on this bill."
          />
        </section>
        <dl className={styles.amounts}>
          <div><dt>Subtotal</dt><dd>{money.format(bill.subtotal)}</dd></div>
          <div><dt>CGST ({bill.gstRate}%)</dt><dd>{money.format(bill.cgst)}</dd></div>
          <div><dt>SGST ({bill.gstRate}%)</dt><dd>{money.format(bill.sgst)}</dd></div>
          <div><dt>Round off</dt><dd>{money.format(bill.roundOff)}</dd></div>
          <div className={styles.total}><dt>Total paid</dt><dd>{money.format(bill.total)}</dd></div>
          {bill.received !== undefined && <div><dt>Cash received</dt><dd>{money.format(bill.received)}</dd></div>}
          {bill.change !== undefined && <div><dt>Change</dt><dd>{money.format(bill.change)}</dd></div>}
        </dl>
      </div>
      <footer className={styles.footer}>
        {printError && <p role="alert">Couldn’t print. Check the printer and try again.</p>}
        <Button type="button" variant="outline" onClick={onClose}>Done</Button>
        {canPrint && <Button type="button" onClick={printBill}><Printer size={16} aria-hidden="true" /> Print receipt</Button>}
      </footer>
    </WorkspaceDialog>
    {canPrint && createPortal(
      <div aria-hidden="true" className={receiptStyles.printOnly}><RestaurantReceipt bill={bill} paper={paper} /></div>,
      document.body,
    )}
  </>;
}
