import React from 'react';
import { clsx } from 'clsx';

export const Table: React.FC<React.HTMLAttributes<HTMLTableElement>> = ({ className, children, ...props }) => (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <table className={clsx("min-w-full divide-y divide-gray-300", className)} {...props}>
            {children}
        </table>
    </div>
);

export const Thead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, children, ...props }) => (
    <thead className={clsx("bg-gray-50", className)} {...props}>
        {children}
    </thead>
);

export const Tbody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, children, ...props }) => (
    <tbody className={clsx("divide-y divide-gray-200 bg-white", className)} {...props}>
        {children}
    </tbody>
);

export const Tr: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className, children, ...props }) => (
    <tr className={clsx("hover:bg-gray-50", className)} {...props}>
        {children}
    </tr>
);

export const Th: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className, children, ...props }) => (
    <th scope="col" className={clsx("py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6", className)} {...props}>
        {children}
    </th>
);

export const Td: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, children, ...props }) => (
    <td className={clsx("whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6", className)} {...props}>
        {children}
    </td>
);
