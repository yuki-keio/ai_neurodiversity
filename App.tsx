
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from './hooks/useChat';
import ChatMessageItem from './components/ChatMessageItem';
import { ChatMessage, MessageSender } from './types';
import SettingsAccordion from './components/SettingsAccordion';
import SuggestedQuestions from './components/SuggestedQuestions'; // Import new component
import { PREDEFINED_SYSTEM_INSTRUCTION_OPTIONS, DEFAULT_SYSTEM_INSTRUCTION } from './constants';
import { generateQuestionSuggestions, RateLimitError } from './services/geminiService'; // Import new service and RateLimitError

const App: React.FC = () => {
  const [systemInstruction, setSystemInstruction] = useState<string>(DEFAULT_SYSTEM_INSTRUCTION);
  const [selectedInstructionOptions, setSelectedInstructionOptions] = useState<string[]>([]);
  const [customInstructionText, setCustomInstructionText] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  const getSystemInstruction = useCallback(() => systemInstruction, [systemInstruction]);
  const { messages, sendMessage, isLoading: chatIsLoading, addMessage } = useChat(getSystemInstruction);

  const [inputValue, setInputValue] = useState('');
  const chatHistoryRef = useRef<HTMLDivElement>(null);

  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState<boolean>(false);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const suggestionDebounceTimeoutRef = useRef<number | null>(null);
  const initialSuggestionsFetchedRef = useRef(false); // Ref to track initial fetch
  const isFetchingNonEmptySuggestionsRef = useRef(false); // Ref to manage "busy" state for non-empty input suggestion fetches

  const fetchSuggestions = useCallback(async (currentInput: string) => {
    if (chatIsLoading && currentInput.trim() !== "") return;

    // Guard for non-empty input fetches using a ref to prevent re-entrancy
    // and to avoid making fetchSuggestions dependent on isGeneratingSuggestions state.
    if (currentInput.trim() !== "") {
        if (isFetchingNonEmptySuggestionsRef.current) {
            // console.log("Suggestion fetch for non-empty input skipped; another non-empty fetch is in progress.");
            return;
        }
        isFetchingNonEmptySuggestionsRef.current = true;
    }

    setIsGeneratingSuggestions(true); // For global UI spinner
    try {
      const currentSysInstruction = getSystemInstruction();
      const newSuggestions = await generateQuestionSuggestions(
        messages,
        currentSysInstruction,
        currentInput
      );
      setSuggestedQuestions(newSuggestions);
    } catch (error) {
      if (error instanceof RateLimitError || (typeof error === 'object' && error !== null && 'name' in error && error.name === "RateLimitError")) {
        console.warn("Rate limit hit while fetching suggestions. Suggestions not updated.");
      } else {
        console.error("Error fetching suggestions:", error);
        setSuggestedQuestions([]);
      }
    } finally {
      setIsGeneratingSuggestions(false); // Clear global spinner
      if (currentInput.trim() !== "") {
        isFetchingNonEmptySuggestionsRef.current = false;
      }
    }
  }, [messages, getSystemInstruction, chatIsLoading /* REMOVED isGeneratingSuggestions */]);

  // Effect for loading settings from localStorage (runs once on mount)
  useEffect(() => {
    const savedInstruction = localStorage.getItem('customSystemInstruction');
    const savedOptions = localStorage.getItem('selectedInstructionOptions');
    const savedText = localStorage.getItem('customInstructionText');

    if (savedInstruction) {
      setSystemInstruction(savedInstruction);
    }
    if (savedOptions) {
      setSelectedInstructionOptions(JSON.parse(savedOptions));
    }
    if (savedText) {
      setCustomInstructionText(savedText);
    }
  }, []); 

  // Effect for initial automatic suggestions fetch (runs once if conditions met)
  useEffect(() => {
    if (
        !initialSuggestionsFetchedRef.current &&
        !chatIsLoading && // Ensure chat isn't loading for initial suggestions either
        !showSettings &&
        messages.length <= 1 && 
        inputValue === "" &&
        !hasInteracted
    ) {
        fetchSuggestions(""); 
        initialSuggestionsFetchedRef.current = true;
    }
  }, [chatIsLoading, showSettings, messages.length, inputValue, hasInteracted, fetchSuggestions]);


  // Effect for fetching suggestions when messages change, settings are closed, or input is cleared
  useEffect(() => {
    if (chatIsLoading || showSettings) {
        setSuggestedQuestions([]); 
        return;
    }

    // This effect handles fetching for EMPTY input.
    // If inputValue is non-empty, the debounced effect below handles it.
    if (inputValue.trim() === "") {
      // Fetch general suggestions if initial auto-suggestions were attempted
      // AND (there are more messages than just the greeting OR user has interacted)
      if (initialSuggestionsFetchedRef.current && (messages.length > 1 || hasInteracted)) {
        fetchSuggestions(""); 
      }
    }
  }, [messages, showSettings, chatIsLoading, fetchSuggestions, hasInteracted, inputValue]);


  // Debounced fetch for suggestions based on non-empty user input
  useEffect(() => {
    if (suggestionDebounceTimeoutRef.current) {
      clearTimeout(suggestionDebounceTimeoutRef.current);
      suggestionDebounceTimeoutRef.current = null;
    }

    // Do not proceed if settings are open, chat is loading, or input is empty
    if (showSettings || chatIsLoading || inputValue.trim().length === 0) {
      // If input became empty, the MC effect above handles fetching suggestions for empty input.
      // We ensure any pending timeout for non-empty input is cleared.
      return;
    }

    // Input is non-empty, settings closed, not loading: set timeout
    const currentInputVal = inputValue; // Capture inputValue for the timeout
    suggestionDebounceTimeoutRef.current = window.setTimeout(() => {
      // Re-check critical conditions at execution time
      if (!showSettings && !chatIsLoading) {
        fetchSuggestions(currentInputVal);
      }
    }, 1200);

    return () => { // Cleanup function
      if (suggestionDebounceTimeoutRef.current) {
        clearTimeout(suggestionDebounceTimeoutRef.current);
        suggestionDebounceTimeoutRef.current = null;
      }
    };
  }, [inputValue, showSettings, chatIsLoading, fetchSuggestions]);


  const handleSaveSettings = (newInstruction: string, newSelectedOptions: string[], newText: string) => {
    setSystemInstruction(newInstruction);
    setSelectedInstructionOptions(newSelectedOptions);
    setCustomInstructionText(newText);

    localStorage.setItem('customSystemInstruction', newInstruction);
    localStorage.setItem('selectedInstructionOptions', JSON.stringify(newSelectedOptions));
    localStorage.setItem('customInstructionText', newText);
    
    setShowSettings(false); 

    let systemMessageText = "AIの設定を更新しました。";
    if (newInstruction !== DEFAULT_SYSTEM_INSTRUCTION) {
        const diffText = newInstruction.replace(DEFAULT_SYSTEM_INSTRUCTION, '').trim();
        if (diffText) {
             systemMessageText += `\n新しい指示の要約: 「${diffText.substring(0, 100)}${diffText.length > 100 ? '...' : ''}」`;
        }
    }
    addMessage({
        id: `system-${Date.now()}`,
        sender: MessageSender.SYSTEM,
        text: systemMessageText,
        timestamp: new Date(),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      // hasInteracted would have been set by onChange if it wasn't already
      sendMessage(inputValue);
      setInputValue('');
      setSuggestedQuestions([]); 
    }
  };

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSuggestionClick = (question: string) => {
    setInputValue(question);
    // hasInteracted would have been set by onChange if it wasn't already
    const inputElement = document.querySelector('input[aria-label="チャットメッセージ入力"]') as HTMLInputElement;
    if (inputElement) {
      inputElement.focus();
    }
  };


  const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
    </svg>
  );
  
  const SettingsIcon = () => (
    <img src="./images/setting.png" alt="Settings" className="w-6 h-6" />
  );

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-slate-50 shadow-2xl">
      <header className="bg-sky-600 text-white p-4 shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold">発達当事者サポートAI</h1>
          <p className="text-xs text-sky-100">あなたの状況や特性に合わせた経験則を見つけ、AIがアドバイスします</p>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)} 
          className="p-2 rounded-full hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75"
          aria-label="AI設定を開く"
          aria-expanded={showSettings}
        >
          <SettingsIcon />
        </button>
      </header>

      {showSettings && (
         <SettingsAccordion
            initialSelectedOptions={selectedInstructionOptions}
            initialCustomText={customInstructionText}
            onSave={handleSaveSettings}
            predefinedOptions={PREDEFINED_SYSTEM_INSTRUCTION_OPTIONS}
        />
      )}

      <div ref={chatHistoryRef} className="flex-grow p-6 space-y-6 overflow-y-auto chat-history bg-slate-100">
        {messages.map((msg: ChatMessage) => (
          <ChatMessageItem key={msg.id} message={msg} />
        ))}
      </div>

      <footer className="bg-white p-4 border-t border-slate-200">
        {!showSettings && (
          <SuggestedQuestions
            suggestions={suggestedQuestions}
            isLoading={isGeneratingSuggestions}
            onSuggestionClick={handleSuggestionClick}
            onRefreshClick={() => fetchSuggestions(inputValue)} 
            hasInteracted={hasInteracted} 
          />
        )}
        <form onSubmit={handleSubmit} className={`flex items-center space-x-3 ${!showSettings ? 'mt-3' : ''}`}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              const newValue = e.target.value;
              setInputValue(newValue);
              if (!hasInteracted && newValue.trim().length > 0) {
                setHasInteracted(true);
              }
            }}
            placeholder="悩みごとや知りたいことなどを入力してください..."
            className="flex-grow p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-shadow duration-150"
            aria-label="チャットメッセージ入力"
          />
          <button
            type="submit"
            disabled={chatIsLoading || !inputValue.trim()}
            className="bg-sky-500 hover:bg-sky-600 text-white p-3 rounded-lg disabled:bg-slate-300 transition-colors duration-150 flex items-center justify-center aspect-square"
            aria-label="送信"
          >
            {chatIsLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" role="status" aria-label="読み込み中"></div>
            ) : (
              <SendIcon/>
            )}
          </button>
        </form>
        <p className="text-xs text-slate-500 mt-2 text-center">
          AIによるアドバイスは参考情報です。専門的な助言が必要な場合は医師やカウンセラーにご相談ください。
        </p>
      </footer>
    </div>
  );
};

export default App;
    