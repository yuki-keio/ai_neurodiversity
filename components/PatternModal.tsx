import React, { useEffect } from 'react';
import { Pattern } from '../types';
import PatternCard from './PatternCard';

interface PatternModalProps {
    pattern: Pattern | null;
    isOpen: boolean;
    onClose: () => void;
    onPatternClick?: (patternNumber: number) => void;
}

const PatternModal: React.FC<PatternModalProps> = ({ pattern, isOpen, onClose, onPatternClick }) => {
    useEffect(() => {
        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscapeKey);
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }

        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
            document.body.style.overflow = ''; // Restore scrolling
        };
    }, [isOpen, onClose]);

    if (!isOpen || !pattern) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-slate-800">パターン詳細</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                        aria-label="閉じる"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-slate-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-4">
                    <PatternCard pattern={pattern} onPatternClick={onPatternClick} forceExpanded={true} />
                </div>
            </div>
        </div>
    );
};

export default PatternModal;
