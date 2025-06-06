
import { useState, useCallback } from 'react';
import { ChatMessage, MessageSender, Pattern } from '../types';
import {
  getRelevantPatternNumbers,
  generateAdvice,
  MESSAGE_TEXT_ERROR_GENERATING_ADVICE,
  MESSAGE_TEXT_ERROR_API_KEY_NOT_CONFIGURED,
  MESSAGE_TEXT_RATE_LIMIT_EXCEEDED, // Import new message
  RateLimitError // Import custom error
} from '../services/geminiService';
import { patterns as allPatternsData } from '../data/patterns';

export const useChat = (getSystemInstruction: () => string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'initial-greeting',
      sender: MessageSender.BOT,
      text: 'こんにちは！発達特性に関するお悩みや、知りたいことについて話しかけてみてください。当事者の**1300個**の経験則を**2000時間**かけて研究したデータを踏まえてアドバイスを作成します。',
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false); // For global input disable

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prevMessages => [...prevMessages, message]);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (isLoading || text.trim() === "") return;

    setIsLoading(true); // Disable input globally
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: MessageSender.USER,
      text,
      timestamp: new Date(),
    };
    addMessage(userMessage);

    const loadingBotMessageId = `bot-loading-${Date.now()}`;
    addMessage({
      id: loadingBotMessageId,
      sender: MessageSender.BOT,
      text: "AIが応答を準備しています...", // Initial progress text
      timestamp: new Date(),
      isLoading: true, // This message is loading
    });

    try {
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === loadingBotMessageId ? { ...msg, text: "関連する知識を検索中です..." } : msg
        )
      );

      const relevantPatternNumbers = await getRelevantPatternNumbers(text);
      const relevantPatterns: Pattern[] = relevantPatternNumbers
        .map(num => allPatternsData.find(p => p.id === num))
        .filter((p): p is Pattern => p !== undefined);

      const currentSystemInstruction = getSystemInstruction();

      let adviceGenerationText = "";
      if (relevantPatternNumbers.length > 0 && relevantPatterns.length > 0) { // Check relevantPatterns too
        adviceGenerationText = "関連知識を元にアドバイスを作成中です...";
      } else if (relevantPatternNumbers.length === 0) { // No patterns found before advice generation
        adviceGenerationText = "応答を作成中です...";
      }

      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === loadingBotMessageId ? { ...msg, text: adviceGenerationText } : msg
        )
      );

      let accumulatedAdvice = "";
      let streamHasBegun = false;

      for await (const chunk of generateAdvice(text, relevantPatterns, currentSystemInstruction)) {
        if (!streamHasBegun) {
          accumulatedAdvice = chunk;
          streamHasBegun = true;
        } else {
          accumulatedAdvice += chunk;
        }

        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === loadingBotMessageId
              ? {
                ...msg,
                text: accumulatedAdvice,
                isLoading: true,
              }
              : msg
          )
        );
      }

      if (streamHasBegun && accumulatedAdvice.trim() === "") {
        accumulatedAdvice = MESSAGE_TEXT_ERROR_GENERATING_ADVICE;
      }


      const isErrorOrNoPatternMessage =
        accumulatedAdvice === MESSAGE_TEXT_ERROR_GENERATING_ADVICE ||
        accumulatedAdvice === MESSAGE_TEXT_ERROR_API_KEY_NOT_CONFIGURED ||
        accumulatedAdvice === MESSAGE_TEXT_RATE_LIMIT_EXCEEDED;

      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === loadingBotMessageId
            ? {
              ...msg,
              text: accumulatedAdvice,
              relevantPatterns: (relevantPatterns.length > 0 && !isErrorOrNoPatternMessage) ? relevantPatterns : undefined,
              isLoading: false,
            }
            : msg
        )
      );
    } catch (error) {
      // Check for RateLimitError specifically
      if (error instanceof RateLimitError || (typeof error === 'object' && error !== null && 'name' in error && error.name === "RateLimitError")) {
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === loadingBotMessageId
              ? {
                ...msg,
                text: (error as Error).message || MESSAGE_TEXT_RATE_LIMIT_EXCEEDED,
                isLoading: false,
              }
              : msg
          )
        );
      } else {
        console.error("Error processing message:", error);
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === loadingBotMessageId
              ? {
                ...msg,
                text: "申し訳ありません、エラーが発生しました。もう一度試してみてください。",
                isLoading: false,
              }
              : msg
          )
        );
      }
    } finally {
      setIsLoading(false); // Re-enable global input
    }
  }, [addMessage, isLoading, getSystemInstruction]);

  return { messages, sendMessage, isLoading, addMessage };
};
