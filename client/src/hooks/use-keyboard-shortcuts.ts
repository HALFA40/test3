import { useEffect } from 'react';

interface KeyboardShortcuts {
  onNewItem?: () => void;
  onSave?: () => void;
  onEscape?: () => void;
  onSearch?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onHelp?: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore shortcuts when typing in inputs or textareas
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        // Only allow Escape in form inputs
        if (event.key === 'Escape' && shortcuts.onEscape) {
          shortcuts.onEscape();
        }
        return;
      }

      const isCtrl = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;

      // Handle keyboard shortcuts
      if (isCtrl && !isShift) {
        switch (event.key.toLowerCase()) {
          case 'n':
            event.preventDefault();
            shortcuts.onNewItem?.();
            break;
          case 's':
            event.preventDefault();
            shortcuts.onSave?.();
            break;
          case 'e':
            event.preventDefault();
            shortcuts.onExport?.();
            break;
          case 'i':
            event.preventDefault();
            shortcuts.onImport?.();
            break;
          case 'f':
            event.preventDefault();
            shortcuts.onSearch?.();
            break;
        }
      }

      // Handle non-Ctrl shortcuts
      switch (event.key) {
        case 'Escape':
          shortcuts.onEscape?.();
          break;
        case 'F1':
          event.preventDefault();
          shortcuts.onHelp?.();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Hook for displaying shortcut hints
export function useShortcutHints() {
  return {
    newItem: 'Ctrl+N',
    save: 'Ctrl+S',
    export: 'Ctrl+E',
    import: 'Ctrl+I',
    search: 'Ctrl+F',
    escape: 'Esc',
    help: 'F1',
  };
}