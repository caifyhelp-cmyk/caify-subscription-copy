import { useState, useEffect, useMemo } from 'react';

interface UseTableDataProps<T> {
    data: T[];
    searchQuery?: string;
    searchFields?: (keyof T)[];
    filterConfig?: { key: keyof T; value: any }[];
    initialSortKey?: keyof T;
    initialSortDirection?: 'asc' | 'desc';
    itemsPerPage?: number;
}

export function useTableData<T>({
    data,
    searchQuery = '',
    searchFields = [],
    filterConfig = [],
    initialSortKey,
    initialSortDirection = 'desc',
    itemsPerPage = 10
}: UseTableDataProps<T>) {
    const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(
        initialSortKey ? { key: initialSortKey, direction: initialSortDirection } : null
    );
    const [currentPage, setCurrentPage] = useState(1);

    const processedData = useMemo(() => {
        let result = [...data];

        // 1. Search
        if (searchQuery && searchFields.length > 0) {
            const lowerQ = searchQuery.toLowerCase();
            result = result.filter(item => {
                return searchFields.some(field => {
                    const value = item[field];
                    if (typeof value === 'string') {
                        return value.toLowerCase().includes(lowerQ);
                    }
                    return false;
                });
            });
        }

        // 2. Filter
        if (filterConfig.length > 0) {
            result = result.filter(item => {
                return filterConfig.every(filter => {
                    if (filter.value === '' || filter.value === null || filter.value === undefined) return true;
                    return item[filter.key] === filter.value;
                });
            });
        }

        // 3. Sort
        if (sortConfig) {
            result.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [data, searchQuery, searchFields, filterConfig, sortConfig]);

    const totalItems = processedData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Page reset on filter/search change
    const filterConfigStr = JSON.stringify(filterConfig);

    useEffect(() => {
        // useMemo was causing state setter calls during render, which causes infinite loop in React 18+.
        // We use stringified dependency to prevent unnecessary resets if filterConfig is passed as inline array.
        setCurrentPage(1);
    }, [searchQuery, filterConfigStr]);

    // Handle out of bounds safely during calculation, defer state update
    const activePage = Math.max(1, Math.min(currentPage, totalPages || 1));

    const paginatedData = processedData.slice(
        (activePage - 1) * itemsPerPage,
        activePage * itemsPerPage
    );

    const handleSort = (key: keyof T) => {
        setSortConfig(prev => {
            if (prev && prev.key === key) {
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    return {
        paginatedData,
        totalItems,
        totalPages,
        currentPage,
        setCurrentPage,
        sortConfig,
        handleSort,
        itemsPerPage
    };
}
