"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./insights.module.css";

const previewSize = 5;

export function InsightList<Item>({ items, label, className, ordered, renderItem }: {
  items: Item[];
  label: string;
  className?: string;
  ordered?: boolean;
  renderItem: (item: Item, index: number) => ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const remaining = items.length - previewSize;
  const canExpand = remaining > 0;
  const isExpanded = canExpand && expanded;
  const List = ordered ? "ol" : "ul";
  const buttonText = isExpanded ? "Show less" : `Show ${remaining} more`;

  return (
    <div className={styles.listBlock}>
      <div
        id={id}
        className={isExpanded ? styles.listScroll : undefined}
        tabIndex={isExpanded ? 0 : undefined}
        role={isExpanded ? "region" : undefined}
        aria-label={isExpanded ? label : undefined}
      >
        <List className={className} aria-label={label}>
          {(isExpanded ? items : items.slice(0, previewSize)).map(renderItem)}
        </List>
      </div>
      {canExpand && <button
        className={styles.listToggle}
        type="button"
        aria-expanded={isExpanded}
        aria-controls={id}
        aria-label={`${buttonText} · ${label}`}
        onClick={() => setExpanded(!isExpanded)}
      >
        {buttonText}
        <ChevronDown aria-hidden="true" />
      </button>}
    </div>
  );
}
