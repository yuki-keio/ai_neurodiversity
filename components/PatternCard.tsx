import React, { useState } from 'react';
import { Pattern, RelatedPatternInfo } from '../types';

interface PatternCardProps {
  pattern: Pattern;
  onPatternClick?: (patternNumber: number) => void;
  onOpenModal?: (pattern: Pattern) => void;
  forceExpanded?: boolean;
}

const PatternCard: React.FC<PatternCardProps> = ({ pattern, onPatternClick, onOpenModal, forceExpanded = false }) => {
  const [imageError, setImageError] = useState(false);
  // Modal表示時は常に展開状態として扱う
  const isExpanded = forceExpanded;

  const handleImageError = () => {
    console.error(`Image failed to load: ${pattern.imageUrl}`);
    setImageError(true);
  };

  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenModal) {
      onOpenModal(pattern);
    }
  };

  const DetailSection: React.FC<{ title?: string; content?: string; centeredTitle?: boolean; bold?: boolean }> = ({ title, content, centeredTitle = false, bold = false }) => {
    return (
      <div className="mt-3">
        {title && <h4 className={`text-slate-700 ${centeredTitle ? 'text-center' : ''}`}>{title}</h4>}
        <p className={`text-sm text-slate-600 whitespace-pre-wrap mt-2 ${bold ? 'font-bold' : ''}`}>{content}</p>
      </div>
    );
  };

  const handleRelatedPatternClick = (e: React.MouseEvent, patternNumber: number) => {
    e.stopPropagation();
    if (onPatternClick) {
      onPatternClick(patternNumber);
    }
  };

  return (
    <div className={`bg-white p-4 rounded-lg shadow border border-slate-200 ${forceExpanded ? '' : 'cursor-pointer w-[215px] md:w-[400px]'}`} onClick={forceExpanded ? undefined : handleOpenModal} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') !forceExpanded && handleOpenModal(e as any); }} aria-expanded={isExpanded}>
      <h3 className={`${isExpanded ? 'text-lg' : 'text-base'} font-semibold text-sky-700 mb-2`}>
        {pattern.numberText}: {pattern.name}
      </h3>
      {isExpanded && (
        <p className="text-xs text-slate-500 mb-2">
          {pattern.category} &gt; {pattern.group}
        </p>
      )}
      {isExpanded && (
        <div className="text-sm">
          <DetailSection content={pattern.introduction} />
        </div>
      )}

      {imageError ? (
        <div className="w-full h-40 bg-slate-200 flex items-center justify-center rounded mb-3">
          <span className="text-slate-500 text-sm">画像準備中</span>
        </div>
      ) : (
        <img
          src={pattern.imageUrl}
          alt={pattern.name}
          className="w-full object-cover rounded mb-3"
          onError={handleImageError}
        />
      )}

      {pattern.exampleQuote &&  (window.innerWidth > 768 || isExpanded) && (
        <div className="mb-3 p-3 bg-sky-50 rounded border-l-4 border-sky-500">
          <p className="text-sm text-slate-700 italic">"{pattern.exampleQuote.quote}"</p>
          <p className="text-xs text-slate-500 mt-1 text-right">- {pattern.exampleQuote.person}</p>
        </div>
      )}

      {isExpanded ? (
        <div className="space-y-2 text-sm mt-2">
          <DetailSection content={pattern.context} />
          <DetailSection title="▼ その状況において" content={pattern.problem} centeredTitle bold />
          <DetailSection content={pattern.forces} />
          <DetailSection title="▼ そこで" content={pattern.solution} centeredTitle bold />
          <DetailSection content={pattern.actions} />
          <DetailSection title="▼その結果" content={pattern.consequences} centeredTitle />
        </div>
      ) : (window.innerWidth > 768) ? (
        <div className="space-y-2 text-sm mt-2">
          <DetailSection content={pattern.context} />
          <DetailSection title="▼ その状況において" content={pattern.problem} centeredTitle />
          <DetailSection title="▼ そこで" content={pattern.solution} centeredTitle />
        </div>
      ) : (<div className="space-y-2 text-sm mt-2">
        <DetailSection content={pattern.solution} centeredTitle />
      </div>
    )}

      {pattern.relatedPatterns && pattern.relatedPatterns.length > 0 && isExpanded && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-1">関連パターン:</h4>
          <ul className="list-disc list-inside space-y-1">
            {pattern.relatedPatterns.map((rp: RelatedPatternInfo) => (
              <li
                key={rp.number}
                className="text-xs text-sky-600 hover:underline cursor-pointer"
                onClick={(e) => handleRelatedPatternClick(e, rp.number)}
              >
                No.{rp.number} {rp.text}
              </li>
            ))}
          </ul>
        </div>
      )}
      {!forceExpanded && (
        <div className="mt-4 text-right">
          <button
            onClick={handleOpenModal}
            className="text-sm text-sky-600 hover:text-sky-700 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 rounded-md px-2 py-1"
          >
            全文を見る
            <span aria-hidden="true" className="ml-1">
              ▼
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PatternCard;