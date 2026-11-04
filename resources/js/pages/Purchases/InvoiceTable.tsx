import { Money } from '@/components/Money';
import { StatusPill } from '@/components/StatusPill';
import { formatDate } from '@/lib/months';
import type { Invoice } from '@/types';

export function InvoiceTable({
    invoices,
    total,
    onOpen,
}: {
    invoices: Invoice[];
    total: number;
    onOpen: (invoice: Invoice) => void;
}) {
    return (
        <div className="panel overflow-x-auto">
            <table className="w-full min-w-[640px] text-[14px]">
                <thead>
                    <tr className="bg-sunk text-[13px] text-muted">
                        <th className="w-[64px] px-3 py-2.5 ps-4 text-start font-semibold">
                            الإيصال
                        </th>
                        <th className="px-3 py-2.5 text-start font-semibold">
                            الرقم
                        </th>
                        <th className="px-3 py-2.5 text-start font-semibold">
                            العنوان
                        </th>
                        <th className="hidden px-3 py-2.5 text-start font-semibold sm:table-cell">
                            السبب
                        </th>
                        <th className="px-3 py-2.5 text-start font-semibold">
                            النوع
                        </th>
                        <th className="px-3 py-2.5 text-start font-semibold">
                            التاريخ
                        </th>
                        <th className="px-3 py-2.5 pe-4 text-start font-semibold">
                            السعر
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {invoices.map((invoice) => (
                        <tr
                            key={invoice.id}
                            tabIndex={0}
                            onClick={() => onOpen(invoice)}
                            onKeyDown={(event) =>
                                (event.key === 'Enter' || event.key === ' ') &&
                                onOpen(invoice)
                            }
                            className="cursor-pointer border-t border-line hover:bg-accent-soft/40 focus-visible:bg-accent-soft/40"
                        >
                            <td className="px-3 py-2.5 ps-4">
                                {invoice.receipt ? (
                                    <img
                                        src={invoice.receipt.url}
                                        alt=""
                                        loading="lazy"
                                        className="size-10 rounded-md border border-line object-cover"
                                    />
                                ) : (
                                    <span className="flex size-10 items-center justify-center rounded-md bg-sunk text-muted">
                                        —
                                    </span>
                                )}
                            </td>
                            <td className="px-3 py-2.5">
                                <span className="serial">{invoice.serial}</span>
                            </td>
                            <td className="px-3 py-2.5">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-semibold">
                                        {invoice.title}
                                    </span>
                                    {!invoice.receipt && (
                                        <StatusPill kind="no_receipt" />
                                    )}
                                </div>
                            </td>
                            <td className="hidden max-w-[240px] truncate px-3 py-2.5 text-muted sm:table-cell">
                                {invoice.reason || '—'}
                            </td>
                            <td className="px-3 py-2.5">
                                <StatusPill kind={invoice.type} />
                            </td>
                            <td className="num px-3 py-2.5 text-[13px] text-muted">
                                {formatDate(invoice.created_at)}
                            </td>
                            <td className="px-3 py-2.5 pe-4">
                                <Money value={invoice.price} />
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="border-t-2 border-line bg-sunk/60">
                        <td
                            colSpan={6}
                            className="px-3 py-3 ps-4 font-display text-[15px] font-semibold sm:hidden"
                        >
                            الإجمالي
                        </td>
                        <td
                            colSpan={6}
                            className="hidden px-3 py-3 ps-4 font-display text-[15px] font-semibold sm:table-cell"
                        >
                            الإجمالي
                        </td>
                        <td className="px-3 py-3 pe-4">
                            <Money value={total} size="footer" />
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}
