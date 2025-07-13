import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share, Menu, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PWAInstallPromptProps {
  onClose?: () => void;
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onClose }) => {
  const [showModal, setShowModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [deviceType, setDeviceType] = useState<'android' | 'ios' | 'desktop'>('desktop');
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  // Detect device type and first visit
  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      if (/android/.test(userAgent)) {
        setDeviceType('android');
      } else if (/iphone|ipad|ipod/.test(userAgent)) {
        setDeviceType('ios');
      } else {
        setDeviceType('desktop');
      }
    };

    const checkFirstVisit = () => {
      const hasVisited = localStorage.getItem('coacht_has_visited');
      const isMobile = window.innerWidth <= 768;
      
      if (!hasVisited && isMobile) {
        setIsFirstVisit(true);
        setShowModal(true);
        localStorage.setItem('coacht_has_visited', 'true');
      }
    };

    detectDevice();
    checkFirstVisit();

    // Listen for beforeinstallprompt event (Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android - use native prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        handleClose();
      }
    } else {
      // iOS or other - show manual instructions
      // Modal will stay open to show instructions
    }
  };

  const handleClose = () => {
    setShowModal(false);
    onClose?.();
  };

  const getInstructions = () => {
    switch (deviceType) {
      case 'android':
        return {
          title: "Add CoachT to your home screen",
          steps: [
            "Tap the 'Install' button below, or",
            "Tap the menu (⋮) in your browser",
            "Select 'Add to Home screen' or 'Install app'"
          ],
          icon: <Download className="w-6 h-6" />
        };
      case 'ios':
        return {
          title: "Add CoachT to your home screen",
          steps: [
            "Tap the Share button (□↗) at the bottom",
            "Scroll and tap 'Add to Home Screen'",
            "Tap 'Add' to confirm"
          ],
          icon: <Share className="w-6 h-6" />
        };
      default:
        return {
          title: "Install CoachT",
          steps: [
            "Look for an install button in your browser",
            "Or check your browser's menu for 'Install' options"
          ],
          icon: <Download className="w-6 h-6" />
        };
    }
  };

  const instructions = getInstructions();

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
        >
          <motion.div
            initial={{ y: 100, scale: 0.9 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 100, scale: 0.9 }}
            className="bg-gradient-to-br from-gray-900 to-black border border-red-600/30 rounded-xl p-6 max-w-md w-full relative shadow-2xl"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                {instructions.title}
              </h2>
              <p className="text-gray-300 text-sm">
                Get instant access and a native app experience!
              </p>
            </div>

            {/* Instructions */}
            <div className="mb-6">
              <div className="space-y-3">
                {instructions.steps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-red-600/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-400 text-sm font-semibold">{index + 1}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3">
              {deviceType === 'android' && deferredPrompt && (
                <Button
                  onClick={handleInstallClick}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold py-3"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Install Now
                </Button>
              )}
              
              <Button
                onClick={handleClose}
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Maybe Later
              </Button>
            </div>

            {/* Benefits */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-gray-400 text-xs text-center">
                ✨ Faster loading • 📱 Works offline • 🎯 Native app feel
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Compact install button for homepage
export const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [deviceType, setDeviceType] = useState<'android' | 'ios' | 'desktop'>('desktop');

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      if (/android/.test(userAgent)) {
        setDeviceType('android');
      } else if (/iphone|ipad|ipod/.test(userAgent)) {
        setDeviceType('ios');
      } else {
        setDeviceType('desktop');
      }
    };

    detectDevice();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
    } else {
      setShowPrompt(true);
    }
  };

  // Only show if not already installed and on mobile
  const shouldShowButton = () => {
    const isMobile = window.innerWidth <= 768;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    return isMobile && !isStandalone;
  };

  if (!shouldShowButton()) return null;

  return (
    <>
      <Button
        onClick={handleInstallClick}
        variant="outline"
        size="sm"
        className="fixed bottom-20 right-4 bg-black/80 backdrop-blur-sm border-red-600/30 text-red-400 hover:bg-red-600/10 hover:text-red-300 shadow-lg z-40"
      >
        <Download className="w-4 h-4 mr-2" />
        Install App
      </Button>

      <PWAInstallPrompt 
        onClose={() => setShowPrompt(false)}
      />
    </>
  );
};