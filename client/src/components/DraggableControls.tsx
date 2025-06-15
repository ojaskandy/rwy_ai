import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface DraggableControlsProps {
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
  className?: string;
  constrainToWindow?: boolean;
  zIndex?: number;
}

const DraggableControls: React.FC<DraggableControlsProps> = ({
  children,
  initialPosition = { x: 0, y: 0 },
  className = '',
  constrainToWindow = true,
  zIndex = 50
}) => {
  const [position, setPosition] = useState(initialPosition);
  const controlRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [bounds, setBounds] = useState({ left: 0, right: 0, top: 0, bottom: 0 });

  // Update bounds when window resizes
  useEffect(() => {
    const updateBounds = () => {
      if (controlRef.current && constrainToWindow) {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const rect = controlRef.current.getBoundingClientRect();
        
        setBounds({
          left: 0,
          right: windowWidth - rect.width,
          top: 0,
          bottom: windowHeight - rect.height
        });
      }
    };

    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, [constrainToWindow]);

  // Handle drag end to ensure position stays within bounds
  const handleDragEnd = () => {
    setIsDragging(false);
    if (constrainToWindow && controlRef.current) {
      setPosition(prevPos => ({
        x: Math.max(bounds.left, Math.min(bounds.right, prevPos.x)),
        y: Math.max(bounds.top, Math.min(bounds.bottom, prevPos.y))
      }));
    }
  };

  return (
    <motion.div
      ref={controlRef}
      drag
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={constrainToWindow ? bounds : false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      initial={{ x: position.x, y: position.y }}
      animate={{ x: position.x, y: position.y }}
      style={{ 
        position: 'absolute',
        zIndex,
        touchAction: 'none' // Prevents scrolling while dragging on touch devices
      }}
      className={`cursor-move ${isDragging ? 'select-none' : ''} ${className}`}
      whileDrag={{ scale: 1.05 }}
    >
      {children}
    </motion.div>
  );
};

export default DraggableControls; 