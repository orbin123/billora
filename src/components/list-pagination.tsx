"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./list-pagination.module.css";

type Page = {
  start: number;
  end: number;
  total: number;
  page: number;
  pageCount: number;
  setPage: (page: number) => void;
};

export function ListPagination({ pagination, label, singular, className }: {
  pagination: Page;
  label: string;
  singular: string;
  className?: string;
}) {
  const { start, end, total, page, pageCount, setPage } = pagination;
  if (!total) return null;

  const count = total === 1 ? "1 " + singular : total.toLocaleString("en-IN") + " " + label;

  return (
    <div className={`${styles.pagination} ${className ?? ""}`}>
      <span aria-live="polite" aria-atomic="true">
        {pageCount > 1 ? `${start + 1}–${end} of ${count}` : count}
      </span>
      {pageCount > 1 && <nav className={styles.controls} aria-label={`Pagination for ${label}`}>
        <button type="button" onClick={() => setPage(page - 1)} disabled={page === 1} aria-label="Previous page">
          <ChevronLeft aria-hidden="true" />
        </button>
        <span>Page {page} of {pageCount}</span>
        <button type="button" onClick={() => setPage(page + 1)} disabled={page === pageCount} aria-label="Next page">
          <ChevronRight aria-hidden="true" />
        </button>
      </nav>}
    </div>
  );
}
