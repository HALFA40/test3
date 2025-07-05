import { useEffect, useRef } from 'react';
import { useDebounce } from 'use-debounce';

interface AutoSaveOptions {
  key: string;
  data: any;
  onSave?: (data: any) => void;
  delay?: number;
  enabled?: boolean;
}

export function useAutoSave({ key, data, onSave, delay = 2000, enabled = true }: AutoSaveOptions) {
  const [debouncedData] = useDebounce(data, delay);
  const previousDataRef = useRef<any>();
  const hasLoadedRef = useRef(false);

  // Load saved data on mount
  useEffect(() => {
    if (!enabled || hasLoadedRef.current) return;
    
    try {
      const saved = localStorage.getItem(`autosave_${key}`);
      if (saved) {
        const parsedData = JSON.parse(saved);
        onSave?.(parsedData);
      }
    } catch (error) {
      console.warn('Failed to load auto-saved data:', error);
    }
    
    hasLoadedRef.current = true;
  }, [key, enabled, onSave]);

  // Save data when it changes
  useEffect(() => {
    if (!enabled || !hasLoadedRef.current) return;
    
    // Skip if data hasn't actually changed
    const dataString = JSON.stringify(debouncedData);
    const prevString = JSON.stringify(previousDataRef.current);
    
    if (dataString === prevString) return;
    
    // Skip if data is empty/default
    if (!debouncedData || Object.keys(debouncedData).length === 0) return;
    
    try {
      localStorage.setItem(`autosave_${key}`, dataString);
      previousDataRef.current = debouncedData;
    } catch (error) {
      console.warn('Failed to auto-save data:', error);
    }
  }, [debouncedData, key, enabled]);

  // Clear saved data
  const clearSavedData = () => {
    try {
      localStorage.removeItem(`autosave_${key}`);
      previousDataRef.current = undefined;
    } catch (error) {
      console.warn('Failed to clear auto-saved data:', error);
    }
  };

  // Check if saved data exists
  const hasSavedData = () => {
    try {
      return localStorage.getItem(`autosave_${key}`) !== null;
    } catch {
      return false;
    }
  };

  return { clearSavedData, hasSavedData };
}