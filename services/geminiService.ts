
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Pattern, ChatMessage, MessageSender } from '../types'; // Added ChatMessage, MessageSender
import { patterns as allPatternsData, ALL_PATTERNS_TEXT_FOR_EXTRACTION } from '../data/patterns';
import { DEFAULT_SYSTEM_INSTRUCTION } from "../constants";


const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("FATAL: API_KEY environment variable is not set. The application cannot function.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! }); 

const MODEL_NAME = "gemini-2.5-flash-preview-04-17";

// Rate Limiting Configuration
const RATE_LIMIT_MAX_CALLS = 15; // Max calls allowed
const RATE_LIMIT_WINDOW_MS = 1000 * 60 * 60 * 24; // Time window in milliseconds (e.g., 60 seconds)
let apiCallTimestamps: number[] = [];

// Custom Error for Rate Limiting
export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

// Helper function to check and manage API call rate
function canMakeApiCall(callType: string): boolean {
  if (!API_KEY) return false; // Should not proceed if API key is not set

  const now = Date.now();
  // Remove timestamps older than the window
  apiCallTimestamps = apiCallTimestamps.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS);

  if (apiCallTimestamps.length >= RATE_LIMIT_MAX_CALLS) {
    console.warn(`Rate limit exceeded for ${callType}. Calls in window: ${apiCallTimestamps.length}/${RATE_LIMIT_MAX_CALLS} in last ${RATE_LIMIT_WINDOW_MS / 1000}s.`);
    return false;
  }
  apiCallTimestamps.push(now);
  return true;
}


export const MESSAGE_TEXT_NO_PATTERNS_FOUND = "関連性の高いパターンが見つかりませんでした。もう少し詳しく教えていただけますか？";
export const MESSAGE_TEXT_ERROR_GENERATING_ADVICE = "申し訳ありません。アドバイスの生成中にエラーが発生しました。";
export const MESSAGE_TEXT_ERROR_API_KEY_NOT_CONFIGURED = "申し訳ありませんが、現在アドバイスを生成できません。";
export const MESSAGE_TEXT_RATE_LIMIT_EXCEEDED = "AIの応答生成が混み合っています。しばらくしてからもう一度お試しください。";


export const getRelevantPatternNumbers = async (userQuery: string): Promise<number[]> => {
  if (!API_KEY) {
    console.error("Gemini API key is not configured. Cannot extract patterns.");
    return [];
  }
  if (!canMakeApiCall('getRelevantPatternNumbers')) {
    throw new RateLimitError(MESSAGE_TEXT_RATE_LIMIT_EXCEEDED);
  }

  try {
    const prompt = `
あなたはニューロダイバージェントをサポートするAIです。
以下の「パターン一覧」と「ユーザーの質問」を読み、ユーザーの質問に答える上で参考になるパターン（経験則）の番号を抽出してください。
結果は、関連するパターンの番号をカンマ区切りで返してください (例: "6, 11, 25")。
抽出するパターンは一個から三個ほどが望ましいですが、関連するパターンが全くない場合は "NONE" と返してください。

パターン一覧:
${ALL_PATTERNS_TEXT_FOR_EXTRACTION}

ユーザーの質問: "${userQuery}"

関連性の高いパターン番号:
`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    const textResponse = response.text.trim();
    if (textResponse.toUpperCase() === "NONE" || textResponse === "") {
      return [];
    }
    return textResponse.split(',').map(numStr => parseInt(numStr.trim(), 10)).filter(num => !isNaN(num));
  } catch (error) {
    if (error instanceof RateLimitError) throw error; // Re-throw if it's already our custom error
    console.error("Error extracting relevant patterns:", error);
    return []; // Or throw a more generic error to be caught by useChat
  }
};

export async function* generateAdvice(userQuery: string, relevantPatterns: Pattern[], systemInstruction?: string): AsyncGenerator<string, void, undefined> {
  if (!API_KEY) {
    console.error("Gemini API key is not configured. Cannot generate advice stream.");
    yield MESSAGE_TEXT_ERROR_API_KEY_NOT_CONFIGURED;
    return;
  }
  if (!canMakeApiCall('generateAdvice')) {
    // This throw will be caught by the try...catch in useChat's sendMessage
    throw new RateLimitError(MESSAGE_TEXT_RATE_LIMIT_EXCEEDED);
  }
  
  if (relevantPatterns.length === 0) {
    yield MESSAGE_TEXT_NO_PATTERNS_FOUND;
    return;
  }

  try {
    const patternContext = relevantPatterns.map(p => 
      `${p.mainText}`
    ).join('\n\n');

    const prompt = `
あなたはニューロダイバージェントのためにコーチングを行うプロフェッショナルです。
下記のユーザーの質問と関連パターン情報を踏まえて、指示に従いアドバイスを作成してください。ただし、関連パターン情報自体はあなたの回答と別に表示されるので、単なる繰り返しは避けて。

特に指定がない限り回答は700字以内でごく簡潔に、具体的でユーザーの生活に役立つ実践可能なものにしてください。
ユーザーの質問: "${userQuery}"

関連パターン情報:
${patternContext}
`;
    
    const effectiveSystemInstruction = systemInstruction || DEFAULT_SYSTEM_INSTRUCTION;

    const responseStream = await ai.models.generateContentStream({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: effectiveSystemInstruction,
      }
    });
    
    let hasYielded = false;
    for await (const chunk of responseStream) {
      if (chunk.text) {
        yield chunk.text;
        hasYielded = true;
      }
    }
    if (!hasYielded) {
        yield ""; 
    }

  } catch (error) {
    if (error instanceof RateLimitError) throw error; // Re-throw if it's already our custom error
    console.error("Error generating advice stream:", error);
    yield MESSAGE_TEXT_ERROR_GENERATING_ADVICE;
  }
}

export const generateQuestionSuggestions = async (
  conversationHistory: ChatMessage[],
  systemInstruction: string,
  currentUserInput: string
): Promise<string[]> => {
  if (!API_KEY) {
    console.error("Gemini API key is not configured. Cannot generate question suggestions.");
    return [];
  }
  if (!canMakeApiCall('generateQuestionSuggestions')) {
    throw new RateLimitError(MESSAGE_TEXT_RATE_LIMIT_EXCEEDED);
  }

  const historyLimit = 5;
  const recentHistory = conversationHistory.slice(-historyLimit);
  const formattedHistory = recentHistory.map(msg => {
    const prefix = msg.sender === MessageSender.USER ? "ユーザー" : "AIアシスタント";
    return `${prefix}: ${msg.text.substring(0, 150)}${msg.text.length > 150 ? '...' : ''}`; // Limit length of each message
  }).join('\n');

  const prompt = `
あなたは、ユーザーがニューロダイバージェント支援チャットボットにどのような質問をすれば良いか、質問のアイデアを提案するAIです。
チャットボットは、他のニューロダイバージェントの当事者の経験則に基づいてアドバイスを提供します。

以下の情報を参考にして、ユーザーがニューロダイバージェント支援チャットボットに対して次に尋ねそうな、または尋ねると良さそうな質問の候補を2個ほど提案してください。
質問は具体的で、簡潔なものにしてください。チャットボットが直接答えやすい形が望ましいです。
出力は、提案する質問の文字列だけを含むJSON配列の形式でお願いします。例: ["具体的な工夫はありますか？", "〇〇についてもっと知りたいです。"]
もし適切な質問候補が思いつかない場合は、空の配列 [] を返してください。

参考情報（ユーザーが設定したシステムインストラクション）：
---
${systemInstruction}
---

直近の会話履歴:
---
${formattedHistory || "まだ会話はありません。"}
---

ユーザーが現在入力中の内容:
---
${currentUserInput || "入力なし"}
---

質問候補のJSON配列:
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // thinkingConfig: { thinkingBudget: 0 } // Potentially use for lower latency if needed
      }
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    try {
      const parsedData = JSON.parse(jsonStr);
      if (Array.isArray(parsedData) && parsedData.every(item => typeof item === 'string')) {
        return parsedData.filter(q => q.trim().length > 0); // Ensure no empty strings
      }
      console.warn("Generated suggestions are not in the expected format (array of strings):", parsedData);
      return [];
    } catch (e) {
      console.error("Failed to parse suggestions JSON response:", e, "Raw text:", response.text);
      return [];
    }
  } catch (error) {
    if (error instanceof RateLimitError) throw error; // Re-throw
    console.error("Error generating question suggestions:", error);
    return [];
  }
};
