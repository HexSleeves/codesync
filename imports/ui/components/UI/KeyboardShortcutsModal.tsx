import React from 'react';
import { Modal } from './Modal';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { category: 'Navigation', items: [
    { keys: ['j', '↓'], description: 'Next file' },
    { keys: ['k', '↑'], description: 'Previous file' },
    { keys: ['/'], description: 'Search files' },
    { keys: ['n'], description: 'Next comment' },
    { keys: ['p'], description: 'Previous comment' },
  ]},
  { category: 'Actions', items: [
    { keys: ['r'], description: 'Mark file as reviewed' },
    { keys: ['d'], description: 'Toggle diff mode (unified/split)' },
    { keys: ['c'], description: 'Focus chat input' },
    { keys: ['b'], description: 'Toggle right sidebar' },
  ]},
  { category: 'General', items: [
    { keys: ['?'], description: 'Show this help' },
    { keys: ['Esc'], description: 'Close modal/panel' },
  ]},
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" size="md">
      <div className="space-y-6">
        {shortcuts.map(section => (
          <div key={section.category}>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {section.category}
            </h3>
            <div className="space-y-2">
              {section.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-300">{item.description}</span>
                  <div className="flex gap-1">
                    {item.keys.map((key, keyIndex) => (
                      <React.Fragment key={keyIndex}>
                        {keyIndex > 0 && <span className="text-gray-500 mx-1">or</span>}
                        <kbd className="px-2 py-1 text-xs font-mono bg-gray-700 border border-gray-600 rounded text-gray-300">
                          {key}
                        </kbd>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-4 border-t border-gray-700 text-center">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Got it
        </button>
      </div>
    </Modal>
  );
};
