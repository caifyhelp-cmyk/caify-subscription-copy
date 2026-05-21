import React from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="relative z-50 pointer-events-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-gray-900/80 transition-opacity" onClick={onClose} />

            {/* Panel */}
            <div className="fixed inset-0 overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                        <div className="pointer-events-auto w-screen max-w-2xl transform transition-transform bg-white shadow-xl flex flex-col h-full">
                            <div className="px-4 py-6 sm:px-6 bg-gray-50 border-b border-gray-200">
                                <div className="flex items-start justify-between">
                                    <h2 className="text-xl font-semibold leading-6 text-gray-900">{title}</h2>
                                    <div className="ml-3 flex h-7 items-center">
                                        <button
                                            type="button"
                                            className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                            onClick={onClose}
                                        >
                                            <span className="sr-only">닫기</span>
                                            <X className="h-6 w-6" aria-hidden="true" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="relative flex-1 px-4 py-6 sm:px-6 overflow-y-auto">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
