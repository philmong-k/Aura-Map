import { useEffect } from 'react';

export const useHotkeys = (undo, redo) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Meta + Z (Undo), Ctrl/Meta + Y (Redo)
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          undo();
        } else if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);
};
