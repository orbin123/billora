"use client";

import { useState } from "react";

export function useListPage<Item>(items: Item[], pageSize = 10) {
  const [requestedPage, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(requestedPage, pageCount);
  if (page !== requestedPage) setPage(page);

  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    start,
    end: Math.min(start + pageSize, items.length),
    total: items.length,
    page,
    pageCount,
    setPage,
  };
}
