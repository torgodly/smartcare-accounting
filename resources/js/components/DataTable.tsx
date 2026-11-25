import {
    createColumnHelper as createTanstackColumnHelper,
    createSortedRowModel,
    rowSortingFeature,
    sortFn_alphanumeric,
    sortFn_basic,
    sortFn_text,
    tableFeatures,
    useTable,
} from '@tanstack/react-table';
import type {
    ColumnDef,
    ColumnHelper,
    SortingState,
    Updater,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { m, useReducedMotion } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type {
    CSSProperties,
    KeyboardEvent,
    MouseEvent,
    ReactNode,
} from 'react';
import { Skeleton } from '@/components/Skeleton';
import { useRovingRows } from '@/hooks/use-roving-rows';
import { staggerDelay } from '@/lib/motion';
import { readStored, writeStored } from '@/lib/storage';
import { cn } from '@/lib/utils';

/** Per-column layout options (`meta` on a column def). */
export type DataColumnMeta = {
    /** Numeric columns use `end`. */
    align?: 'start' | 'end';
    /** Sticky first column. */
    sticky?: boolean;
    width?: number | string;
    headerClassName?: string;
    cellClassName?: string;
    footerClassName?: string;
};

/** The shared tanstack v9 feature set: client sorting only. */
export const dataTableFeatures = tableFeatures({
    rowSortingFeature,
    sortedRowModel: createSortedRowModel(),
    sortFns: {
        alphanumeric: sortFn_alphanumeric,
        basic: sortFn_basic,
        text: sortFn_text,
    },
    columnMeta: {} as DataColumnMeta,
});

export type DataTableFeatures = typeof dataTableFeatures;

/** A column definition for DataTable rows of type T. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DataColumnDef<T> = ColumnDef<DataTableFeatures, T, any>;

/**
 * Typed column helper bound to the shared features:
 * `const column = createColumnHelper<PayrollRow>(); column.accessor('total', { header: 'المستحق', meta: { align: 'end' } })`.
 */
export function createColumnHelper<T>(): ColumnHelper<DataTableFeatures, T> {
    return createTanstackColumnHelper<DataTableFeatures, T>();
}

export type RowTone = 'ok' | 'warn' | 'bad' | 'info';

const RAIL_COLORS: Record<RowTone, string> = {
    ok: 'var(--ok-500)',
    warn: 'var(--warn-500)',
    bad: 'var(--bad-500)',
    info: 'var(--info-500)',
};

export type DataTableProps<T> = {
    data: T[];
    columns: DataColumnDef<T>[];
    getRowId: (row: T) => string;
    /** Table min width before it scrolls inside its panel (salaries 1080, attendance 880, invoices 760). */
    minWidth: number;
    /** Row min height 60 / 52. */
    density?: 'comfortable' | 'compact';
    /** 3px status rail at the row's inline-start edge. */
    rowTone?: (row: T) => RowTone | null;
    /** Click (outside buttons / inputs / links) or Enter / Space on a focused row. */
    onRowActivate?: (row: T) => void;
    /** aria-label for activatable rows. */
    rowLabel?: (row: T) => string;
    /** Persist the viewer's sort in localStorage under this key. */
    sortStorageKey?: string;
    /** The row stagger replays only when this changes (pass `month`). */
    animateKey?: string;
    /** Six skeleton rows. */
    loading?: boolean;
    /** Rendered instead of the table when there are no rows. */
    empty?: ReactNode;
    /** Roving row focus (↑ ↓ Home End). */
    rowNavigation?: boolean;
    onRowKeyDown?: (row: T, event: KeyboardEvent<HTMLTableRowElement>) => void;
    className?: string;
};

function isSortingState(value: unknown): value is SortingState {
    return (
        Array.isArray(value) &&
        value.every(
            (item) =>
                typeof item === 'object' &&
                item !== null &&
                typeof (item as { id?: unknown }).id === 'string' &&
                typeof (item as { desc?: unknown }).desc === 'boolean',
        )
    );
}

const INTERACTIVE_TARGET =
    'button, a, input, select, textarea, label, [role="button"], [role="radio"], [role="checkbox"], [role="combobox"], [data-no-row-activate]';

/**
 * Track sideways and vertical overflow of the scroll container for the edge fades,
 * the sticky column shadow and the header elevation.
 */
function useScrollState(): {
    ref: (element: HTMLDivElement | null) => void;
    overflowStart: boolean;
    overflowEnd: boolean;
    scrolledY: boolean;
} {
    const [element, setElement] = useState<HTMLDivElement | null>(null);
    const [state, setState] = useState({
        overflowStart: false,
        overflowEnd: false,
        scrolledY: false,
    });

    useLayoutEffect(() => {
        if (!element) {
            return;
        }

        const target = element;

        function measure(): void {
            // RTL: scrollLeft is 0 at the start and negative toward the end.
            const scrolled = Math.abs(target.scrollLeft);
            const next = {
                overflowStart: scrolled >= 2,
                overflowEnd:
                    scrolled + target.clientWidth < target.scrollWidth - 2,
                scrolledY: target.scrollTop > 0,
            };

            setState((previous) =>
                previous.overflowStart === next.overflowStart &&
                previous.overflowEnd === next.overflowEnd &&
                previous.scrolledY === next.scrolledY
                    ? previous
                    : next,
            );
        }

        measure();
        target.addEventListener('scroll', measure, { passive: true });
        const observer = new ResizeObserver(measure);
        observer.observe(target);

        if (target.firstElementChild) {
            observer.observe(target.firstElementChild);
        }

        return () => {
            target.removeEventListener('scroll', measure);
            observer.disconnect();
        };
    }, [element]);

    return { ref: setElement, ...state };
}

/**
 * Stagger is active on first mount and for a short window after `animateKey` changes,
 * never after a save or partial reload.
 */
function useStagger(animateKey: string | undefined): boolean {
    const reduced = useReducedMotion();
    const [lastKey, setLastKey] = useState(animateKey);
    const [active, setActive] = useState(true);

    if (animateKey !== lastKey) {
        setLastKey(animateKey);
        setActive(true);
    }

    useEffect(() => {
        if (!active) {
            return;
        }

        const timer = window.setTimeout(() => setActive(false), 700);

        return () => window.clearTimeout(timer);
    }, [active, lastKey]);

    return active && !reduced;
}

/**
 * Headless tanstack v9 table: sticky header / footer / first column (≥ 1024), RTL edge fades,
 * status rail, client sorting (optionally persisted), skeleton rows, empty slot, row activation
 * and an entrance stagger keyed by `animateKey`.
 */
export function DataTable<T>({
    data,
    columns,
    getRowId,
    minWidth,
    density = 'comfortable',
    rowTone,
    onRowActivate,
    rowLabel,
    sortStorageKey,
    animateKey,
    loading = false,
    empty,
    rowNavigation = false,
    onRowKeyDown,
    className,
}: DataTableProps<T>) {
    'use no memo';

    const [sorting, setSortingState] = useState<SortingState>(() =>
        sortStorageKey ? readStored(sortStorageKey, [], isSortingState) : [],
    );

    function setSorting(updater: Updater<SortingState>): void {
        setSortingState((previous) => {
            const next =
                typeof updater === 'function' ? updater(previous) : updater;

            if (sortStorageKey) {
                writeStored(sortStorageKey, next);
            }

            return next;
        });
    }

    const table = useTable({
        features: dataTableFeatures,
        columns,
        data,
        getRowId: (row: T) => getRowId(row),
        state: { sorting },
        onSortingChange: setSorting,
    });

    const scroll = useScrollState();
    const stagger = useStagger(animateKey);
    const rows = table.getRowModel().rows;
    const roving = useRovingRows(rows.length);
    const leafColumns = table.getAllLeafColumns();
    const hasFooter = leafColumns.some(
        (column) => column.columnDef.footer !== undefined,
    );
    const hasSticky = leafColumns.some(
        (column) => column.columnDef.meta?.sticky,
    );
    const rowHeight = density === 'compact' ? 'h-[52px]' : 'h-[60px]';
    const lastIndex = leafColumns.length - 1;

    if (!loading && rows.length === 0 && empty !== undefined) {
        return <>{empty}</>;
    }

    function cellPadding(index: number): string {
        return cn(
            'px-3',
            index === 0 && 'ps-5 max-sm:ps-4',
            index === lastIndex && 'pe-5 max-sm:pe-4',
        );
    }

    function activate(row: T, event: MouseEvent<HTMLTableRowElement>): void {
        if (!onRowActivate) {
            return;
        }

        const target = event.target as HTMLElement;

        if (
            target.closest(INTERACTIVE_TARGET) &&
            target.closest(INTERACTIVE_TARGET) !== event.currentTarget
        ) {
            return;
        }

        onRowActivate(row);
    }

    function handleRowKeyDown(
        row: T,
        index: number,
        event: KeyboardEvent<HTMLTableRowElement>,
    ): void {
        onRowKeyDown?.(row, event);

        if (event.defaultPrevented) {
            return;
        }

        if (rowNavigation) {
            roving.getRowProps(index).onKeyDown(event);
        }

        if (
            onRowActivate &&
            event.target === event.currentTarget &&
            (event.key === 'Enter' || event.key === ' ')
        ) {
            event.preventDefault();
            onRowActivate(row);
        }
    }

    return (
        <div
            className={cn('relative min-w-0', className)}
            data-overflow-start={scroll.overflowStart || undefined}
            data-overflow-end={scroll.overflowEnd || undefined}
            data-scrolled-y={scroll.scrolledY || undefined}
            aria-busy={loading || undefined}
        >
            <div ref={scroll.ref} className="data-table-scroller">
                <table
                    className="data-table w-full border-separate border-spacing-0 text-body-sm"
                    style={{ minWidth }}
                >
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header, index) => {
                                    const meta = header.column.columnDef.meta;
                                    const canSort = header.column.getCanSort();
                                    const sorted = header.column.getIsSorted();
                                    const label =
                                        header.isPlaceholder ? null : (
                                            <table.FlexRender header={header} />
                                        );

                                    return (
                                        <th
                                            key={header.id}
                                            colSpan={header.colSpan}
                                            scope="col"
                                            aria-sort={
                                                canSort
                                                    ? sorted === 'asc'
                                                        ? 'ascending'
                                                        : sorted === 'desc'
                                                          ? 'descending'
                                                          : 'none'
                                                    : undefined
                                            }
                                            style={{ width: meta?.width }}
                                            className={cn(
                                                'h-10 border-b border-line-2 bg-surface text-th whitespace-nowrap text-ink-3',
                                                cellPadding(index),
                                                meta?.align === 'end'
                                                    ? 'text-end'
                                                    : 'text-start',
                                                meta?.sticky &&
                                                    'data-table-sticky',
                                                meta?.headerClassName,
                                            )}
                                        >
                                            {canSort ? (
                                                <button
                                                    type="button"
                                                    onClick={header.column.getToggleSortingHandler()}
                                                    className={cn(
                                                        'inline-flex items-center gap-1 rounded-xs hover:text-ink-1',
                                                        sorted && 'text-ink-1',
                                                    )}
                                                >
                                                    {label}
                                                    {sorted === 'asc' ? (
                                                        <ArrowUp
                                                            aria-hidden
                                                            className="size-3.5 text-cyan-700"
                                                        />
                                                    ) : sorted === 'desc' ? (
                                                        <ArrowDown
                                                            aria-hidden
                                                            className="size-3.5 text-cyan-700"
                                                        />
                                                    ) : (
                                                        <ArrowUpDown
                                                            aria-hidden
                                                            className="size-3.5 text-ink-4"
                                                        />
                                                    )}
                                                </button>
                                            ) : (
                                                label
                                            )}
                                        </th>
                                    );
                                })}
                            </tr>
                        ))}
                    </thead>
                    <tbody key={animateKey}>
                        {loading
                            ? Array.from({ length: 6 }, (_, rowIndex) => (
                                  <tr key={`skeleton-${rowIndex}`}>
                                      {leafColumns.map((column, index) => (
                                          <td
                                              key={column.id}
                                              className={cn(
                                                  rowHeight,
                                                  'border-b border-line-1 bg-surface',
                                                  cellPadding(index),
                                                  column.columnDef.meta
                                                      ?.sticky &&
                                                      'data-table-sticky',
                                              )}
                                          >
                                              <Skeleton
                                                  className={cn(
                                                      'h-3.5',
                                                      index === 0
                                                          ? 'w-32'
                                                          : 'w-16',
                                                      column.columnDef.meta
                                                          ?.align === 'end' &&
                                                          'ms-auto',
                                                  )}
                                              />
                                          </td>
                                      ))}
                                  </tr>
                              ))
                            : rows.map((row, rowIndex) => {
                                  const tone = rowTone?.(row.original) ?? null;
                                  const activatable = Boolean(onRowActivate);
                                  const roveProps = rowNavigation
                                      ? roving.getRowProps(rowIndex)
                                      : null;

                                  return (
                                      <m.tr
                                          key={row.id}
                                          ref={roveProps?.ref}
                                          data-row
                                          data-row-index={rowIndex}
                                          tabIndex={
                                              roveProps
                                                  ? roveProps.tabIndex
                                                  : activatable
                                                    ? 0
                                                    : undefined
                                          }
                                          aria-label={
                                              activatable
                                                  ? rowLabel?.(row.original)
                                                  : undefined
                                          }
                                          onFocus={roveProps?.onFocus}
                                          onClick={(event) =>
                                              activate(row.original, event)
                                          }
                                          onKeyDown={(event) =>
                                              handleRowKeyDown(
                                                  row.original,
                                                  rowIndex,
                                                  event,
                                              )
                                          }
                                          initial={
                                              stagger
                                                  ? { opacity: 0, y: 4 }
                                                  : false
                                          }
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{
                                              duration: 0.22,
                                              ease: [0.22, 1, 0.36, 1],
                                              delay: stagger
                                                  ? staggerDelay(rowIndex)
                                                  : 0,
                                          }}
                                          className={cn(
                                              'group/row bg-surface outline-offset-[-2px] transition-colors duration-140 focus-within:bg-surface-hover hover:bg-surface-hover',
                                              activatable && 'cursor-pointer',
                                          )}
                                      >
                                          {row
                                              .getVisibleCells()
                                              .map((cell, index) => {
                                                  const meta =
                                                      cell.column.columnDef
                                                          .meta;

                                                  return (
                                                      <td
                                                          key={cell.id}
                                                          data-rail={
                                                              index === 0 &&
                                                              tone
                                                                  ? tone
                                                                  : undefined
                                                          }
                                                          style={
                                                              index === 0 &&
                                                              tone
                                                                  ? ({
                                                                        '--rail':
                                                                            RAIL_COLORS[
                                                                                tone
                                                                            ],
                                                                    } as CSSProperties)
                                                                  : undefined
                                                          }
                                                          className={cn(
                                                              rowHeight,
                                                              'border-b border-line-1 bg-inherit align-middle',
                                                              cellPadding(
                                                                  index,
                                                              ),
                                                              meta?.align ===
                                                                  'end'
                                                                  ? 'text-end'
                                                                  : 'text-start',
                                                              meta?.sticky &&
                                                                  'data-table-sticky',
                                                              meta?.cellClassName,
                                                          )}
                                                      >
                                                          <table.FlexRender
                                                              cell={cell}
                                                          />
                                                      </td>
                                                  );
                                              })}
                                      </m.tr>
                                  );
                              })}
                    </tbody>
                    {hasFooter && !loading && (
                        <tfoot>
                            {table.getFooterGroups().map((footerGroup) => (
                                <tr key={footerGroup.id}>
                                    {footerGroup.headers.map(
                                        (header, index) => {
                                            const meta =
                                                header.column.columnDef.meta;

                                            return (
                                                <td
                                                    key={header.id}
                                                    colSpan={header.colSpan}
                                                    className={cn(
                                                        'h-14 border-t border-line-2 bg-surface-2 whitespace-nowrap',
                                                        cellPadding(index),
                                                        index === 0 &&
                                                            'font-display text-[15px] font-semibold',
                                                        meta?.align === 'end'
                                                            ? 'text-end'
                                                            : 'text-start',
                                                        meta?.sticky &&
                                                            'data-table-sticky',
                                                        meta?.footerClassName,
                                                    )}
                                                >
                                                    {header.isPlaceholder ? null : (
                                                        <table.FlexRender
                                                            footer={header}
                                                        />
                                                    )}
                                                </td>
                                            );
                                        },
                                    )}
                                </tr>
                            ))}
                        </tfoot>
                    )}
                </table>
            </div>
            {!hasSticky && (
                <span
                    aria-hidden
                    className="data-table-fade"
                    data-side="start"
                />
            )}
            <span aria-hidden className="data-table-fade" data-side="end" />
        </div>
    );
}
