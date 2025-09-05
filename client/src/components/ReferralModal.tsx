import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';

interface Creator {
  creatorCode: string;
  displayName: string;
}

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (creatorCode: string | null) => void;
}

export default function ReferralModal({ isOpen, onClose, onSelect }: ReferralModalProps) {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch active creators from the API
  useEffect(() => {
    if (isOpen) {
      fetchCreators();
    }
  }, [isOpen]);

  const fetchCreators = async () => {
    try {
      const response = await fetch('/api/referral/creators');
      if (response.ok) {
        const data = await response.json();
        setCreators(data.creators);
      }
    } catch (error) {
      console.error('Failed to fetch creators:', error);
      // Fallback to some default creators if API fails
      setCreators([
        { creatorCode: 'ojaskandy', displayName: 'Ojas Kandy' },
        { creatorCode: 'sarahsmith', displayName: 'Sarah Smith' },
        { creatorCode: 'mikejones', displayName: 'Mike Jones' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatorSelect = (creatorCode: string) => {
    onSelect(creatorCode);
    onClose();
  };

  const handleSkip = () => {
    onSelect(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && handleSkip()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            {/* Header */}
            <div className="mb-6">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-500 flex-shrink-0" />
                  <span>Who told you about Runway&nbsp;AI?</span>
                </h3>
                <button
                  onClick={handleSkip}
                  className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0 ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-600 mt-2 text-sm">
                Help us thank the creator who brought you here
              </p>
            </div>

            {/* Creator List */}
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {creators.map((creator) => (
                  <button
                    key={creator.creatorCode}
                    onClick={() => handleCreatorSelect(creator.creatorCode)}
                    className="w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between border-gray-200 hover:border-pink-400 hover:bg-pink-50 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="font-medium text-gray-800">
                      {creator.displayName}
                    </span>
                  </button>
                ))}
                
                {/* "Other" option */}
                <button
                  onClick={() => handleCreatorSelect('other')}
                  className="w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between border-gray-200 hover:border-pink-400 hover:bg-pink-50 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="font-medium text-gray-800">
                    Someone else / I found it myself
                  </span>
                </button>
              </div>
            )}

            <p className="text-center text-gray-500 text-xs mt-6">
              This helps us support the creators who spread the word about Runway AI
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
