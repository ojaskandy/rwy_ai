import { useState, useEffect } from 'react';

interface NotesEditorProps {
  initialNotes?: string;
  onChange: (notes: string) => void;
  onStartRoutine?: () => void;
  onStopRoutine?: () => void;
  onStartTest?: () => void;
  onStopTest?: () => void;
  onShowResults?: () => void;
  isTracking?: boolean;
  hasReferenceMedia?: boolean;
  hasCompletedTest?: boolean;
  onRecord?: () => void;
  isRecording?: boolean;
  onToggleScreenRecording?: () => void;
  isScreenRecording?: boolean;
  isTestRunning?: boolean;
}

export default function NotesEditor({ 
  initialNotes = '', 
  onChange, 
  onStartRoutine, 
  onStopRoutine,
  onStartTest,
  onStopTest,
  onShowResults,
  isTracking = false,
  hasReferenceMedia = false,
  hasCompletedTest = false,
  onRecord,
  isRecording = false,
  onToggleScreenRecording,
  isScreenRecording = false,
  isTestRunning = false
}: NotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes);

  useEffect(() => {
    onChange(notes);
  }, [notes, onChange]);

  const applyFormat = (format: 'bold' | 'italic' | 'heading' | 'subheading') => {
    const textarea = document.getElementById('routineNotesTextarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = notes.substring(start, end);

    let newText = notes;
    switch (format) {
      case 'bold':
        newText = notes.substring(0, start) + `**${selectedText}**` + notes.substring(end);
        break;
      case 'italic':
        newText = notes.substring(0, start) + `*${selectedText}*` + notes.substring(end);
        break;
      case 'heading':
        newText = notes.substring(0, start) + `# ${selectedText}` + notes.substring(end);
        break;
      case 'subheading':
        newText = notes.substring(0, start) + `### ${selectedText}` + notes.substring(end);
        break;
    }

    setNotes(newText);
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl py-4 px-4 mt-4 w-full">
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center">
          <span className="material-icons text-pink-600 mr-2">edit_note</span>
          <h3 className="text-gray-800 font-semibold">Routine Notes</h3>
        </div>
        <div className="flex gap-1">
          <button onClick={() => applyFormat('bold')} className="bg-pink-100 hover:bg-pink-200 text-pink-700 rounded p-1">
            <span className="material-icons text-xs">format_bold</span>
          </button>
          <button onClick={() => applyFormat('italic')} className="bg-pink-100 hover:bg-pink-200 text-pink-700 rounded p-1">
            <span className="material-icons text-xs">format_italic</span>
          </button>
          <button onClick={() => applyFormat('heading')} className="bg-pink-100 hover:bg-pink-200 text-pink-700 rounded p-1">
            <span className="material-icons text-xs">format_size</span>
          </button>
          <button onClick={() => applyFormat('subheading')} className="bg-pink-100 hover:bg-pink-200 text-pink-700 rounded p-1">
            <span className="material-icons text-xs">text_fields</span>
          </button>
        </div>
      </div>
      <textarea
        id="routineNotesTextarea"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full bg-white border border-pink-200 rounded-md p-3 text-gray-800 min-h-[70px] focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
        placeholder="Enter your notes about this routine here..."
      />
      
      {/* Action Buttons */}
      <div className="flex justify-center space-x-2 sm:space-x-4 mt-4 mb-2 flex-wrap gap-2">
        {isTestRunning ? (
          <button
            onClick={onStopTest}
            className="px-5 sm:px-6 py-3 rounded-lg font-medium shadow-lg flex items-center justify-center transition-colors text-sm sm:text-base bg-gradient-to-r from-orange-500 to-orange-400 text-white hover:from-orange-600 hover:to-orange-500 animate-pulse"
          >
            <span className="material-icons mr-1 sm:mr-2 text-base sm:text-lg">stop</span>
            Stop Test
          </button>
        ) : (
          <>
            {!isTracking ? (
              <button
                onClick={onStartRoutine}
                className="px-4 sm:px-5 py-2.5 rounded-lg font-medium shadow-lg flex items-center justify-center transition-colors text-xs sm:text-sm bg-gradient-to-r from-pink-500 to-pink-400 text-white hover:from-pink-600 hover:to-pink-500"
              >
                <span className="material-icons mr-1 sm:mr-2 text-sm sm:text-base">play_arrow</span>
                Start Routine
              </button>
            ) : (
              <button
                onClick={onStopRoutine}
                className="px-4 sm:px-5 py-2.5 rounded-lg font-medium shadow-lg flex items-center justify-center transition-colors text-xs sm:text-sm bg-gradient-to-r from-orange-500 to-orange-400 text-white hover:from-orange-600 hover:to-orange-500"
              >
                <span className="material-icons mr-1 sm:mr-2 text-sm sm:text-base">stop</span>
                Stop Routine
              </button>
            )}

            {/* Record Button */}
            {onRecord && (
              <button
                onClick={onRecord}
                className={`px-4 sm:px-5 py-2.5 rounded-lg font-medium shadow-lg flex items-center justify-center transition-colors text-xs sm:text-sm ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                }`}
                title={isRecording ? 'Stop Recording' : 'Record Camera'}
              >
                <span className="material-icons mr-1 sm:mr-2 text-sm sm:text-base">{isRecording ? 'stop' : 'videocam'}</span>
                {isRecording ? 'Stop' : 'Record Camera'}
              </button>
            )}

            {/* Screen Recording Button */}
            {onToggleScreenRecording && (
              <button
                onClick={onToggleScreenRecording}
                className={`px-4 sm:px-5 py-2.5 rounded-lg font-medium shadow-lg flex items-center justify-center transition-colors text-xs sm:text-sm ${
                  isScreenRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
                title={isScreenRecording ? 'Stop Screen Recording' : 'Record Entire Screen'}
              >
                <span className="material-icons mr-1 sm:mr-2 text-sm sm:text-base">{isScreenRecording ? 'stop_screen_share' : 'screen_share'}</span>
                {isScreenRecording ? 'Stop Record' : 'Record Screen'}
              </button>
            )}
            
            {/* Test Button - Light up when media is available */}
            <button
              onClick={onStartTest}
              className={`px-4 sm:px-5 py-2.5 rounded-lg font-medium shadow-lg flex items-center justify-center transition-colors text-xs sm:text-sm ${
                !hasReferenceMedia
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-green-400 text-white hover:from-green-600 hover:to-green-500 border-2 border-green-300'
              }`}
              disabled={!hasReferenceMedia || isRecording || isScreenRecording}
              title={
                !hasReferenceMedia 
                  ? 'Add reference media first' 
                  : isRecording || isScreenRecording 
                    ? 'Recording in progress' 
                    : 'Start test against reference media'
              }
            >
              <span className="material-icons mr-1 sm:mr-2 text-sm sm:text-base">fitness_center</span>
              Test
            </button>

            {hasCompletedTest && (
              <button
                onClick={onShowResults}
                className="px-4 sm:px-5 py-2.5 rounded-lg font-medium shadow-lg flex items-center justify-center transition-colors bg-gradient-to-r from-green-500 to-green-400 text-white hover:from-green-600 hover:to-green-500 text-xs sm:text-sm"
                title="View your test results"
                disabled={isRecording || isScreenRecording}
              >
                <span className="material-icons mr-1 sm:mr-2 text-sm sm:text-base">analytics</span>
                Test Results
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
