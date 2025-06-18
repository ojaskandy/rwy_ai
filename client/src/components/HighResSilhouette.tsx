export default function HighResSilhouette() {
  return (
    <div className="relative">
      {/* Red circle background with glow effect */}
      <div className="absolute inset-0 w-32 h-32 md:w-48 md:h-48 bg-red-600 rounded-full shadow-[0_0_50px_rgba(220,38,38,0.6)] transform scale-110"></div>
      
      {/* High-resolution kicking figure silhouette - matching your reference */}
      <svg
        width="192"
        height="192"
        viewBox="0 0 192 192"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-32 h-32 md:w-48 md:h-48"
      >
        {/* Head */}
        <circle cx="96" cy="45" r="12" fill="white" />
        
        {/* Body/torso */}
        <path
          d="M96 57C102 57 107 62 107 68V95C107 101 102 106 96 106C90 106 85 101 85 95V68C85 62 90 57 96 57Z"
          fill="white"
        />
        
        {/* Left arm (defensive position) */}
        <path
          d="M85 72C82 70 78 69 75 70C72 71 70 74 70 77V85C70 88 72 91 75 92C78 93 82 92 85 90V72Z"
          fill="white"
        />
        
        {/* Right arm (extended/blocking) */}
        <path
          d="M107 72C110 70 114 69 117 70C120 71 122 74 122 77V85C122 88 120 91 117 92C114 93 110 92 107 90V72Z"
          fill="white"
        />
        
        {/* Supporting leg (left) */}
        <path
          d="M85 106V130C85 133 82 136 79 136C76 136 73 133 73 130V106C73 103 76 100 79 100C82 100 85 103 85 106Z"
          fill="white"
        />
        
        {/* Left foot */}
        <ellipse cx="79" cy="145" rx="8" ry="4" fill="white" />
        
        {/* Kicking leg (right) - extended horizontally */}
        <path
          d="M107 106C107 103 110 100 113 100C116 100 119 103 119 106V115C119 118 122 121 125 121H140C143 121 146 118 146 115C146 112 149 109 152 109C155 109 158 112 158 115C158 118 155 121 152 121H140C137 121 134 124 134 127V130C134 133 131 136 128 136C125 136 122 133 122 130V127C122 124 119 121 116 121H113C110 121 107 118 107 115V106Z"
          fill="white"
        />
        
        {/* Kicking foot */}
        <ellipse cx="158" cy="115" rx="4" ry="8" fill="white" />
      </svg>
    </div>
  );
}