import React, { useState, useEffect } from 'react';
import { SystemInstructionOption } from '../types';
import { DEFAULT_SYSTEM_INSTRUCTION } from '../constants';

interface SettingsAccordionProps {
  initialSelectedOptions: string[];
  initialCustomText: string;
  onSave: (newSystemInstruction: string, selectedOptions: string[], customText: string) => void;
  predefinedOptions: SystemInstructionOption[];
}

const SettingsAccordion: React.FC<SettingsAccordionProps> = ({
  initialSelectedOptions,
  initialCustomText,
  onSave,
  predefinedOptions,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>(initialSelectedOptions);
  const [customText, setCustomText] = useState<string>(initialCustomText);

  useEffect(() => {
    setSelectedOptions(initialSelectedOptions);
    setCustomText(initialCustomText);
  }, [initialSelectedOptions, initialCustomText]);

  const handleToggleOption = (optionId: string) => {
    setSelectedOptions(prev =>
      prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]
    );
  };

  const handleSave = () => {
    let combinedInstruction = DEFAULT_SYSTEM_INSTRUCTION;
    const chosenInstructions: string[] = [];

    predefinedOptions.forEach(option => {
      if (selectedOptions.includes(option.id)) {
        chosenInstructions.push(option.instruction);
      }
    });

    if (chosenInstructions.length > 0) {
      combinedInstruction += "\n\n加えて、以下の点に特に配慮してください：\n- " + chosenInstructions.join("\n- ");
    }

    if (customText.trim() !== "") {
      combinedInstruction += "\n\nさらに、ユーザーからの具体的な指示は次の通りです：\n" + customText.trim();
    }
    onSave(combinedInstruction, selectedOptions, customText);
  };

  return (
    <div className="bg-sky-50 border-y border-sky-200 p-4 shadow-inner">
      <h2 className="text-lg font-semibold text-sky-700 mb-3">AI設定</h2>
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-1">あなたに合わせてAIをカスタマイズ（複数選択可）:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {predefinedOptions.map(option => (
              <label key={option.id} className="flex items-center space-x-2 p-2 bg-white border border-slate-200 rounded-md hover:bg-sky-100 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(option.id)}
                  onChange={() => handleToggleOption(option.id)}
                  className="h-4 w-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                />
                <span className="text-sm text-slate-600">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="customInstruction" className="block text-sm font-medium text-slate-700 mb-1">
            その他、AIへの指示（あなたの詳細など）:
          </label>
          <textarea
            id="customInstruction"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            rows={3}
            className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm"
            placeholder="例: 私は大学生で、就職活動について悩んでいます。"
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            設定を保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsAccordion;
