import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { requestCameraPermission, isMobileDevice } from '@/lib/cameraUtils';

interface PermissionDialogProps {
  onRequestPermission: () => void;
}

export default function PermissionDialog({ onRequestPermission }: PermissionDialogProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mobile = isMobileDevice();

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    setError(null);
    
    try {
      console.log('Requesting camera permission...');
      const granted = await requestCameraPermission();
      
      if (granted) {
        console.log('Camera permission granted, calling onRequestPermission');
        onRequestPermission();
      } else {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
      }
    } catch (err: any) {
      console.error('Error requesting camera permission:', err);
      setError(err.message || 'Failed to access camera');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="p-6 rounded-xl text-center relative overflow-hidden bg-gray-900 border border-red-900/30 shadow-lg">
      {/* Camera icon */}
      <div className="mb-5 text-center z-10 relative">
        <div className={`w-16 h-16 rounded-full bg-gradient-to-r from-red-700 to-red-600 flex items-center justify-center mx-auto ${isRequesting ? 'animate-spin' : 'animate-pulse'}`}>
          <span className="material-icons text-white text-3xl">
            {isRequesting ? 'hourglass_empty' : 'camera_alt'}
          </span>
        </div>
      </div>
      
      {/* Heading with gradient text */}
      <h2 className="text-xl font-medium mb-3 text-red-500">
        Camera Access Required
      </h2>
      
      <div className="max-w-md mx-auto z-10 relative">
        <p className="text-sm text-gray-400 mb-5">
          {mobile 
            ? 'Tap "Enable Camera" and allow access when prompted by your browser.'
            : 'Click "Enable Camera" to allow access when prompted by your browser.'
          }
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
            <p className="text-sm text-red-300">{error}</p>
            {mobile && (
              <p className="text-xs text-red-400 mt-2">
                On mobile, you may need to refresh the page and try again.
              </p>
            )}
          </div>
        )}
        
        <Button 
          onClick={handleRequestPermission}
          disabled={isRequesting}
          className="bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700 px-6 py-4 w-full disabled:opacity-50"
          size="lg"
        >
          <span className="material-icons mr-2">
            {isRequesting ? 'hourglass_empty' : 'videocam'}
          </span>
          {isRequesting ? 'Requesting Access...' : 'Enable Camera'}
        </Button>
        
        {mobile && (
          <p className="text-xs text-gray-500 mt-3">
            Make sure your browser has camera permissions enabled for this site.
          </p>
        )}
      </div>
    </div>
  );
}
