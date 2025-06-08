import React from 'react';

interface NoticeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const NoticeModal: React.FC<NoticeModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-semibold text-slate-800">注記</h2>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                            aria-label="閉じる"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="text-slate-700 leading-relaxed space-y-4">
                        <p>
                            このサポートAIが参照している経験則は、<a href="https://dioden.org/NeuroDiversityPattern.html" className="text-sky-500 hover:underline">一般社団法人ニューロダイバーシティ協会によるニューロダイバージェント当事者などへのインタビュー調査</a>から得られたものです。
                        </p>

                        <p>
                            本調査は、当事者知の共有を通じたニューロダイバージェントの当事者のエンパワーメントによって、ニューロダイバーシティに関する未来の社会づくりへの当事者参加の一助になることを目的としています。
                        </p>

                        <p className="font-medium text-slate-800 bg-orange-50 p-3 rounded-md">
                            生きづらさの解消のためには、適切な社会環境の構築・差別や偏見の解消・専門家のサポート等も重要です。本サービスはその一助として提供されており、すべての問題を解決するものではありません。
                        </p>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={onClose}
                            className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                            理解しました
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NoticeModal;
