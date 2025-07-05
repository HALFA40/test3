import { useState, useEffect, useCallback, useRef } from 'react';
import { useNotifications } from '@/lib/toast-notifications';

interface VoiceInputOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export function useVoiceInput(options: VoiceInputOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { showError, showInfo } = useNotifications();

  const {
    lang = 'fr-FR',
    continuous = false,
    interimResults = true,
    maxAlternatives = 1
  } = options;

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;
      
      recognition.lang = lang;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.maxAlternatives = maxAlternatives;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        showInfo('Écoute activée - Parlez maintenant');
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
        }
        setInterimTranscript(interimTranscript);
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        setError(event.error);
        
        const errorMessages = {
          'network': 'Erreur réseau - Vérifiez votre connexion',
          'not-allowed': 'Accès au microphone refusé',
          'no-speech': 'Aucune parole détectée',
          'audio-capture': 'Erreur de capture audio',
          'service-not-allowed': 'Service de reconnaissance vocale non autorisé',
          'bad-grammar': 'Erreur de grammaire',
          'language-not-supported': 'Langue non supportée'
        };
        
        const message = errorMessages[event.error as keyof typeof errorMessages] || 
                       `Erreur de reconnaissance vocale: ${event.error}`;
        showError(message);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [lang, continuous, interimResults, maxAlternatives, showError, showInfo]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      showError('Reconnaissance vocale non supportée par ce navigateur');
      return;
    }

    if (!recognitionRef.current) return;

    try {
      setTranscript('');
      setInterimTranscript('');
      setError(null);
      recognitionRef.current.start();
    } catch (error) {
      showError('Impossible de démarrer la reconnaissance vocale');
    }
  }, [isSupported, showError]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // Voice commands processing
  const processVoiceCommand = useCallback((text: string) => {
    const cleanText = text.toLowerCase().trim();
    
    // Common voice commands for inventory
    const commands = {
      // Navigation
      'aller à inventaire': () => ({ action: 'navigate', target: 'inventory' }),
      'aller à recherche': () => ({ action: 'navigate', target: 'search' }),
      'aller à historique': () => ({ action: 'navigate', target: 'history' }),
      
      // Actions
      'nouveau article': () => ({ action: 'create', target: 'item' }),
      'scanner': () => ({ action: 'scan', target: 'barcode' }),
      'exporter': () => ({ action: 'export', target: 'excel' }),
      
      // Search
      'rechercher': () => ({ action: 'search', query: text.replace(/^rechercher\s*/i, '') }),
      'chercher': () => ({ action: 'search', query: text.replace(/^chercher\s*/i, '') }),
      
      // Clear/Reset
      'effacer': () => ({ action: 'clear', target: 'input' }),
      'vider': () => ({ action: 'clear', target: 'all' }),
      'annuler': () => ({ action: 'cancel', target: 'current' }),
    };

    // Check for exact command matches
    for (const [command, handler] of Object.entries(commands)) {
      if (cleanText.startsWith(command)) {
        return handler();
      }
    }

    // If no command found, treat as search input
    if (cleanText.length > 2) {
      return { action: 'input', value: text.trim() };
    }

    return null;
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    processVoiceCommand,
  };
}