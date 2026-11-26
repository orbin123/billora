import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { InsightList } from "./insight-list";
import styles from "./insights.module.css";

export function InsightPanel({ title, icon: Icon, action, className, children }: {
  title: string; icon: LucideIcon; action?: ReactNode; className?: string; children: ReactNode;
}) {
  return (
    <article className={`${styles.panel} ${className ?? ""}`}>
      <header className={styles.header}>
        <span className={styles.icon}><Icon aria-hidden="true" /></span>
        <h3>{title}</h3>
        {action}
      </header>
      {children}
    </article>
  );
}

export function InsightEmpty({ children }: { children: ReactNode }) {
  return <p className={styles.empty}>{children}</p>;
}

type InsightRow = { label: string; value: string; detail?: string; mark?: ReactNode };

export function InsightRows({ rows, label, empty, ranked }: { rows: InsightRow[]; label: string; empty: string; ranked?: boolean }) {
  if (!rows.length) return <InsightEmpty>{empty}</InsightEmpty>;

  return <InsightList
    items={rows}
    label={label}
    ordered={ranked}
    renderItem={({ label, value, detail, mark }) => (
      <li className={styles.row} key={label}>
        {mark && <span className={styles.mark} aria-hidden="true">{mark}</span>}
        <span className={styles.rowLabel}>{label}{detail && <small>{detail}</small>}</span>
        <strong>{value}</strong>
      </li>
    )}
  />;
}
