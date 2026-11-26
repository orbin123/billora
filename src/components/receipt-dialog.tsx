"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, Printer, X } from "lucide-react";
import { useWorkspaceMutation } from "@/lib/use-workspace-mutation";
import { useWorkspace } from "@/components/workspace-provider";
import { WorkspaceDialog } from "@/components/workspace-dialog";
import { RestaurantReceipt } from "./restaurant-receipt";
import receiptStyles from "./restaurant-receipt.module.css";
import type { Bill } from "@/data/workspace";
import styles from "@/app/billing/billing.module.css";

const printMessages = {
  idle: "Choose the printer in the system print dialog.",
  printing: "Waiting for the system print dialog…",
  failed: "Couldn’t print. Check the printer and try again.",
};

export function ReceiptDialog({ bill, onClose }: { bill: Bill; onClose: () => void }) {
  const { paper, owner, allows } = useWorkspace();
  const canPrint = allows("Print bills");
  const preference = useWorkspaceMutation();
  const [status, setStatus] = useState<"idle" | "printing" | "failed">("idle");
  const printing = useRef(false);

  function systemPrint() {
    if (!canPrint || printing.current) return;
    printing.current = true;
    setStatus("printing");

    try {
      window.print();
      setStatus("idle");
    } catch {
      setStatus("failed");
    } finally {
      printing.current = false;
    }
  }

  return <>
    <WorkspaceDialog titleId="receipt-title" className={styles.receiptModal} onClose={onClose}>
      <header><div><p>Payment complete</p><h2 id="receipt-title">Receipt ready</h2></div><button type="button" onClick={onClose} aria-label="Close receipt"><X /></button></header>
      <RestaurantReceipt bill={bill} paper={paper} />
      {canPrint && <div className={styles.printStatus} data-print-error={status === "failed" ? "" : undefined}>
        {owner && <label className={styles.receiptPaper}>Receipt width
          <select value={paper} onChange={(event) => preference.run({ kind: "paper", width: event.target.value === "80" ? 80 : 58 })} disabled={status === "printing" || preference.pending}>
            <option value="58">58 mm</option>
            <option value="80">80 mm</option>
          </select>
        </label>}
        {preference.error && <p role="alert" className="text-rose-800">{preference.error}</p>}
        <p role={status === "failed" ? "alert" : "status"}>
          {status === "failed" ? <AlertCircle aria-hidden="true" /> : <Printer aria-hidden="true" />}<span>{printMessages[status]}</span>
        </p>
      </div>}
      <footer>
        <button type="button" onClick={onClose}>Done</button>
        {canPrint && <button type="button" className={styles.primaryReceiptAction} onClick={systemPrint} disabled={status === "printing" || preference.pending}><Printer aria-hidden="true" /> Print receipt</button>}
      </footer>
    </WorkspaceDialog>
    {canPrint && createPortal(
      <div aria-hidden="true" className={receiptStyles.printOnly}><RestaurantReceipt bill={bill} paper={paper} /></div>,
      document.body,
    )}
  </>;
}
