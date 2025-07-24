import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MediaUploaderProps {
  onImageUpload: (image: HTMLImageElement, url: string) => void;
  onVideoUpload: (video: HTMLVideoElement, url: string) => void;
  onCancel: () => void;
}

export default function MediaUploader({ onImageUpload, onVideoUpload, onCancel }: MediaUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File types we accept
  const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const acceptedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    setError(null);
    setLoading(true);
    
    const fileType = file.type;
    const fileURL = URL.createObjectURL(file);
    
    // Check if file is an accepted image
    if (acceptedImageTypes.includes(fileType)) {
      const img = new Image();
      img.onload = () => {
        setLoading(false);
        onImageUpload(img, fileURL);
      };
      img.onerror = () => {
        setLoading(false);
        setError('Failed to load image. Please try another file.');
        URL.revokeObjectURL(fileURL);
      };
      img.src = fileURL;
    } 
    // Check if file is an accepted video
    else if (acceptedVideoTypes.includes(fileType)) {
      const video = document.createElement('video');
      video.onloadeddata = () => {
        setLoading(false);
        onVideoUpload(video, fileURL);
      };
      video.onerror = () => {
        setLoading(false);
        setError('Failed to load video. Please try another file.');
        URL.revokeObjectURL(fileURL);
      };
      video.src = fileURL;
      video.load();
    } 
    // File type not accepted
    else {
      setLoading(false);
      setError('Please upload an image (JPG, PNG, WEBP) or video (MP4, WEBM).');
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl max-w-md w-full border border-pink-200 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-serif bg-gradient-to-r from-pink-500 to-pink-600 text-transparent bg-clip-text">
          Upload Media
        </h3>
        <button 
          onClick={onCancel}
          className="text-gray-500 hover:text-pink-600"
        >
          <span className="material-icons">close</span>
        </button>
      </div>
      
      <div 
        className={`upload-zone p-8 mb-4 flex flex-col items-center justify-center bg-pink-50 border border-dashed border-pink-300 rounded-lg ${isDragging ? 'bg-pink-100 border-pink-500' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <span className="material-icons text-4xl text-pink-500 mb-3">
          {loading ? "hourglass_top" : "cloud_upload"}
        </span>
        
        <p className="text-center text-gray-700 mb-3">
          {loading 
            ? "Processing your file..." 
            : "Drag & drop your image or video here"}
        </p>
        
        <p className="text-xs text-gray-500 mb-4 text-center">
          Supported formats: JPG, PNG, WEBP, MP4, WEBM
        </p>
        
        {!loading && (
          <Button 
            onClick={handleBrowseClick}
            className="bg-gradient-to-r from-pink-500 to-pink-400 hover:from-pink-600 hover:to-pink-500 text-white"
          >
            Browse Files
          </Button>
        )}
        
        {loading && <div className="loader mt-2"></div>}
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov"
          className="hidden"
        />
      </div>
      
      <div className="text-center">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="border-pink-200 text-gray-600 hover:bg-pink-50 hover:text-pink-600"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}