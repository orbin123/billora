"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./insights.module.css";

export const listPreviewSize = 5;

export function ListToggle({ id, label, remaining, expanded, onToggle }: {
  id: string;
  label: string;
  remaining: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (remaining <= 0) return null;
  const buttonText = expanded ? "Show less" : `Show ${remaining} more`;

  return <button
    className={styles.listToggle}
    type="button"
    aria-expanded={expanded}
    aria-controls={id}
    aria-label={`${buttonText} · ${label}`}
    onClick={onToggle}
  >
    {buttonText}
    <ChevronDown aria-hidden="true" />
  </button>;
}

export function InsightList<Item>({ items, label, className, ordered, renderItem }: {
  items: Item[];
  label: string;
  className?: string;
  ordered?: boolean;
  renderItem: (item: Item, index: number) => ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const remaining = items.length - listPreviewSize;
  const isExpanded = remaining > 0 && expanded;
  const List = ordered ? "ol" : "ul";

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
          {(isExpanded ? items : items.slice(0, listPreviewSize)).map(renderItem)}
        </List>
      </div>
      <ListToggle id={id} label={label} remaining={remaining} expanded={isExpanded} onToggle={() => setExpanded(!isExpanded)} />
    </div>
  );
}
