import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Inbox,
} from "lucide-react";

import ErrorState from "../../common/ErrorState";
import { toPersianDigits } from "../../../utils/authHelpers";

const ALIGN = {
  start: "text-start",
  center: "text-center",
  end: "text-end",
};

const HIDE = {
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

const cellClass = (col) =>
  `px-4 py-3 ${ALIGN[col.align || "start"]} ${
    col.hideBelow ? HIDE[col.hideBelow] : ""
  } ${col.className || ""}`;

const buildPages = (page, pages) => {
  const list = [...new Set([1, pages, page - 1, page, page + 1])]
    .filter((p) => p >= 1 && p <= pages)
    .sort((a, b) => a - b);

  const out = [];

  list.forEach((p, i) => {
    if (i > 0 && p - list[i - 1] > 1) {
      out.push({ gap: true, key: `gap-${p}` });
    }

    out.push({ page: p, key: `p-${p}` });
  });

  return out;
};

const TableFooter = ({
  pagination,
  onPageChange,
  onLimitChange,
  limitOptions,
}) => {
  const { page, pages, total, limit } = pagination;

  if (!total) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-xs text-muted">
      <div className="flex items-center gap-3">
        <span>
          نمایش {toPersianDigits(from)} تا {toPersianDigits(to)} از{" "}
          {toPersianDigits(total)} مورد
        </span>

        {onLimitChange && (
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            aria-label="تعداد در هر صفحه"
            className="rounded-md border border-line bg-ink px-2 py-1 text-xs text-paper focus:border-bronze focus:outline-none"
          >
            {limitOptions.map((n) => (
              <option key={n} value={n}>
                {toPersianDigits(n)} در صفحه
              </option>
            ))}
          </select>
        )}
      </div>

      {pages > 1 && (
        <nav aria-label="صفحه‌بندی" className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="صفحه‌ی قبل"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-well hover:text-paper disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {buildPages(page, pages).map((item) =>
            item.gap ? (
              <span key={item.key} className="px-1">
                …
              </span>
            ) : (
              <button
                key={item.key}
                onClick={() => onPageChange(item.page)}
                aria-current={item.page === page ? "page" : undefined}
                className={`h-8 min-w-8 rounded-md px-2 text-xs transition-colors ${
                  item.page === page
                    ? "bg-bronze font-medium text-ink"
                    : "text-muted hover:bg-well hover:text-paper"
                }`}
              >
                {toPersianDigits(item.page)}
              </button>
            ),
          )}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pages}
            aria-label="صفحه‌ی بعد"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-well hover:text-paper disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
};

const DataTable = ({
  columns,
  rows = [],
  rowKey = "_id",
  loading = false,
  fetching = false,
  error = null,
  onRetry,
  sort,
  onSortChange,
  pagination,
  onPageChange,
  onLimitChange,
  limitOptions = [20, 50, 100],
  onRowClick,
  empty = {
    title: "موردی پیدا نشد",
    message: "فیلتر یا عبارت جستجو را تغییر دهید.",
  },
}) => {
  if (error && rows.length === 0) {
    return (
      <ErrorState message="دریافت اطلاعات با خطا مواجه شد" onRetry={onRetry} />
    );
  }

  const toggleSort = (col) => {
    if (!onSortChange) return;

    const dir =
      sort?.key === col.sortKey && sort.dir === "asc" ? "desc" : "asc";

    onSortChange({
      key: col.sortKey,
      dir,
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-card">
      <div
        className={`overflow-x-auto transition-opacity ${
          fetching ? "opacity-60" : ""
        }`}
        aria-busy={loading || fetching}
      >
        {!loading && rows.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-16 text-center">
            <Inbox className="mb-4 h-10 w-10 text-sage" strokeWidth={1.3} />

            <p className="font-display text-base font-bold text-paper">
              {empty.title}
            </p>

            {empty.message && (
              <p className="mt-1.5 text-sm text-muted">{empty.message}</p>
            )}

            {empty.action && <div className="mt-5">{empty.action}</div>}
          </div>
        ) : (
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                {columns.map((col) => {
                  const sorted = col.sortKey && sort?.key === col.sortKey;

                  return (
                    <th
                      key={col.key}
                      scope="col"
                      aria-sort={
                        sorted
                          ? sort.dir === "asc"
                            ? "ascending"
                            : "descending"
                          : undefined
                      }
                      style={col.width ? { width: col.width } : undefined}
                      className={`${cellClass(col)} font-medium`}
                    >
                      {col.sortKey && onSortChange ? (
                        <button
                          onClick={() => toggleSort(col)}
                          className="inline-flex items-center gap-1 transition-colors hover:text-paper"
                        >
                          {col.header}

                          {sorted ? (
                            sort.dir === "asc" ? (
                              <ArrowUp className="h-3.5 w-3.5 text-bronze" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5 text-bronze" />
                            )
                          ) : (
                            <ChevronsUpDown className="h-3.5 w-3.5" />
                          )}
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr
                      key={i}
                      className="border-b border-line last:border-b-0"
                    >
                      {columns.map((col) => (
                        <td key={col.key} className={cellClass(col)}>
                          <div className="h-5 w-3/4 animate-pulse rounded-md bg-well" />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.map((row) => (
                    <tr
                      key={row[rowKey]}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      onKeyDown={
                        onRowClick
                          ? (e) => {
                              if (
                                (e.key === "Enter" || e.key === " ") &&
                                e.target === e.currentTarget
                              ) {
                                e.preventDefault();
                                onRowClick(row);
                              }
                            }
                          : undefined
                      }
                      tabIndex={onRowClick ? 0 : undefined}
                      className={`border-b border-line transition-colors last:border-b-0 hover:bg-well/40 ${
                        onRowClick ? "cursor-pointer" : ""
                      }`}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          onClick={
                            col.stopRowClick
                              ? (e) => e.stopPropagation()
                              : undefined
                          }
                          className={cellClass(col)}
                        >
                          {col.cell ? col.cell(row) : row[col.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        )}
      </div>

      {pagination && !loading && (
        <TableFooter
          pagination={pagination}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          limitOptions={limitOptions}
        />
      )}
    </div>
  );
};

export default DataTable;
