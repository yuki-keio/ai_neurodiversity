

import React from 'react';
import { marked } from 'marked';
import { ChatMessage, MessageSender, Pattern } from '../types';
import LoadingSpinner from './LoadingSpinner';
import PatternCard from './PatternCard';
import {
  MESSAGE_TEXT_ERROR_GENERATING_ADVICE,
  MESSAGE_TEXT_ERROR_API_KEY_NOT_CONFIGURED
} from '../services/geminiService';

// Configure marked once at the module level
marked.setOptions({
  gfm: true,        // Enable GitHub Flavored Markdown
  breaks: true,     // Convert GFM line breaks to <br>
  // sanitize: false, // DEPRECATED and REMOVED: Assuming output from Gemini is trusted. If not, consider DOMPurify.
  // smartypants: true // Removed as it's not a valid MarkedOption
});

interface ChatMessageItemProps {
  message: ChatMessage;
  onPatternClick?: (patternNumber: number) => void;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, onPatternClick }) => {
  const isUser = message.sender === MessageSender.USER;
  const isBot = message.sender === MessageSender.BOT;
  const isSystem = message.sender === MessageSender.SYSTEM;

  const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
    </svg>
  );

  const BotIcon = () => (
    <img src="./images/niuniu.png" alt="Botのアイコン" className="w-8 h-8" />
  );

  if (isSystem) {
    return (
      <div className="my-3 text-center">
        <span className="px-3 py-1.5 text-xs text-slate-600 bg-slate-200 rounded-full shadow-sm">
          {message.text.split('\n').map((line, index) => (
            <React.Fragment key={index}>{line}{index < message.text.split('\n').length - 1 && <br />}</React.Fragment>
          ))}
        </span>
      </div>
    );
  }

  // Function to safely render HTML from markdown
  const renderMarkdown = (markdownText: string) => {
    if (!markdownText) return { __html: '' };
    // The Gemini API guide mentions removing fences for JSON before parsing.
    // However, if responseMimeType is application/json, geminiService should handle JSON extraction.
    // This component expects text that is intended for markdown rendering.
    // If a JSON string *is* part of a markdown text (e.g. in a code block), marked handles it.
    const rawMarkup = marked.parse(markdownText.replace(/^```json\s*\n(.*)\n?```$/is, '$1')) as string;
    return { __html: rawMarkup };
  };

  const isSpecialBotMessage = isBot && (
    message.isLoading ||
    message.text === MESSAGE_TEXT_ERROR_GENERATING_ADVICE ||
    message.text === MESSAGE_TEXT_ERROR_API_KEY_NOT_CONFIGURED
  );

  return (
    <div className={`flex items-end mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start max-w-xl lg:max-w-2xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 ${isUser ? 'w-8 h-8' : 'w-14 h-14'} rounded-full flex items-center justify-center ${isUser ? 'bg-sky-500 ml-3' : 'mr-1'}`}>
          {isUser ? <UserIcon /> : <BotIcon />}
        </div>
        <div className={`p-4 rounded-xl shadow-md ${isUser ? 'bg-sky-500 text-white rounded-br-none' : 'bg-white text-slate-700 rounded-bl-none border border-slate-200'}`}>
          {isBot && !isSpecialBotMessage ? (
            <div className="prose" dangerouslySetInnerHTML={renderMarkdown(message.text)} />
          ) : (
            <p className="text-sm whitespace-pre-wrap">{message.text}</p>
          )}

          {isBot && message.isLoading && (
            <div className="mt-2 flex justify-start pt-1">
              <LoadingSpinner />
            </div>
          )}

          {isBot && !message.isLoading && message.relevantPatterns && message.relevantPatterns.length > 0 && (
            <div className="mt-4 space-y-3">
              <h4 className="text-xs font-semibold text-indigo-600">関連する可能性のあるパターン:</h4>
              {message.relevantPatterns.map((pattern: Pattern) => (
                <PatternCard key={pattern.id} pattern={pattern} onPatternClick={onPatternClick} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessageItem;