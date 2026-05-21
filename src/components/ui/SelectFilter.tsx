import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SelectOption {
    label: string;
    value: string;
}

interface SelectFilterProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    className?: string;
    placeholder?: string;
}

export const SelectFilter: React.FC<SelectFilterProps> = ({
    value,
    onChange,
    options,
    className,
    placeholder = '전체'
}) => {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={twMerge(clsx(
                "block w-full min-w-[140px] rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
            ), className)}
        >
            <option value="">{placeholder}</option>
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
};
