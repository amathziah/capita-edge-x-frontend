import { useState, useRef } from 'react';
import { Mic, MicOff, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { dataService } from '@/shared/services/dataService';
import { useToast } from '@/app/providers/ToastContext';

interface VoiceAssistantProps {
    onCommand: (action: any) => void;
}

export default function VoiceAssistant({ onCommand }: VoiceAssistantProps) {
    const { showToast } = useToast();
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [processing, setProcessing] = useState(false);
    const recognitionRef = useRef<any>(null);

    const startListening = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            showToast("Voice input is not supported in this browser.", 'error');
            return;
        }

        const rec = new SpeechRecognition();
        rec.lang = 'en-US';
        rec.continuous = false;

        rec.onstart = () => {
            setIsListening(true);
            setTranscript("Listening...");
        };

        rec.onresult = async (ev: any) => {
            const text = ev.results[0][0].transcript;
            setTranscript(text);
            setProcessing(true);
            setIsListening(false);

            try {
                const action = await dataService.sendCommand(text);
                onCommand(action);
                setTranscript(""); // Clear on success
            } catch (err) {
                setTranscript("Error processing command.");
            } finally {
                setProcessing(false);
            }
        };

        rec.onerror = () => {
            setIsListening(false);
            setTranscript("Try again.");
        };

        rec.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = rec;
        rec.start();
    };

    const stopListening = () => {
        recognitionRef.current?.stop();
        setIsListening(false);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 pointer-events-none">
            {/* Transcript Bubble */}
            <AnimatePresence>
                {(transcript || processing) && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        className="bg-black/80 backdrop-blur text-white px-4 py-2 rounded-2xl text-sm font-medium shadow-xl mb-2 pointer-events-auto"
                    >
                        {processing ? (
                            <span className="flex items-center gap-2">
                                <Command className="w-3 h-3 animate-spin" /> Processing...
                            </span>
                        ) : (
                            transcript
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mic Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={isListening ? stopListening : startListening}
                className={`pointer-events-auto w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${isListening
                    ? "bg-rose-500 text-white ring-4 ring-rose-200"
                    : "bg-violet-600 text-white hover:bg-violet-700"
                    }`}
            >
                {isListening ? (
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                        <MicOff className="w-6 h-6" />
                    </motion.div>
                ) : (
                    <Mic className="w-6 h-6" />
                )}
            </motion.button>
        </div>
    );
}
