
import React from 'react';

interface SuggestedQuestionsProps {
  suggestions: string[];
  isLoading: boolean;
  onSuggestionClick: (question: string) => void;
  onRefreshClick: () => void;
  onCloseClick: () => void;
  hasInteracted: boolean;
}

const RefreshIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-slate-500 group-hover:text-sky-600 transition-colors">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-slate-500 group-hover:text-red-600 transition-colors">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);


const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({ suggestions, isLoading, onSuggestionClick, onRefreshClick, onCloseClick, hasInteracted }) => {
  return (
    <div className="px-1 pt-2 pb-1">
      <div className="flex justify-between items-center mb-1">
        <h4 className="text-xs font-semibold text-slate-500">おすすめの質問:</h4>
        <div className="flex items-center space-x-1">
          <button
            onClick={onRefreshClick}
            disabled={isLoading}
            className="p-1 rounded-full hover:bg-slate-200 disabled:opacity-50 group"
            aria-label="候補を再読み込み"
          >
            {isLoading ? <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div> : <RefreshIcon />}
          </button>
          <button
            onClick={onCloseClick}
            className="p-1 rounded-full hover:bg-slate-200 group"
            aria-label="おすすめの質問を閉じる"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto"> {/* Increased max-h and min-h */}
        {isLoading && suggestions.length === 0 ? (
          <div className="flex items-center justify-center text-xs text-slate-400">
            {/* Placeholder while loading, spinner is on refresh button */}
          </div>
        ) : suggestions.length > 0 ? (
          <div className="flex flex-wrap gap-2 py-1">
            {suggestions.map((q, index) => (
              <button
                key={index}
                onClick={() => onSuggestionClick(q)}
                className="text-xs text-left bg-sky-50 text-sky-700 px-2.5 py-1.5 rounded-lg hover:bg-sky-100 border border-sky-200 transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-1 shadow-sm hover:shadow-md"
                title={q}
              >
                {q.length > 35 ? q.substring(0, 32) + "..." : q}
              </button>
            ))}
          </div>
        ) : !hasInteracted ? (
          <div className="flex items-center justify-center">
            <p className="text-xs text-slate-400 text-center px-2">メッセージを入力し始めると、質問の候補が表示されます。</p>
          </div>
        ) : ( // hasInteracted, no suggestions, not loading
          <div className="flex items-center justify-center">
            <p className="text-xs text-slate-400 text-center px-2">関連する質問の候補はありません。お気軽に質問してください。</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuggestedQuestions;
