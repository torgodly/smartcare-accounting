import { ImageOff } from 'lucide-react';
import { Money } from '@/components/Money';
import { StatusPill } from '@/components/StatusPill';
import type { Invoice } from '@/types';

export function InvoiceCards({
    invoices,
    onOpen,
}: {
    invoices: Invoice[];
    onOpen: (invoice: Invoice) => void;
}) {
    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
            {invoices.map((invoice) => (
                <button
                    key={invoice.id}
                    type="button"
                    onClick={() => onOpen(invoice)}
                    className="panel flex flex-col overflow-hidden text-start transition-colors hover:border-accent"
                >
                    <div className="aspect-[4/3] w-full bg-sunk">
                        {invoice.receipt ? (
                            <img
                                src={invoice.receipt.url}
                                alt=""
                                loading="lazy"
                                className="size-full object-cover"
                            />
                        ) : (
                            <div className="flex size-full flex-col items-center justify-center gap-1.5 text-[13px] text-warn">
                                <ImageOff className="size-6" />
                                بانتظار صورة الإيصال
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-2 p-3">
                        <div className="flex items-start justify-between gap-2">
                            <span className="min-w-0 font-semibold">
                                {invoice.title}
                            </span>
                            <StatusPill kind={invoice.type} />
                        </div>
                        <div className="flex items-end justify-between gap-2">
                            <span className="serial">{invoice.serial}</span>
                            <Money value={invoice.price} size="card" />
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}
