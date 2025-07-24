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
    <div className="bg-white/95 backdrop-blur-sm border border-pink-200 shadow-md rounded-xl py-2 px-3 mt-2 w-full">
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center">
          <span className="material-icons text-pink-600 mr-2 text-sm">edit_note</span>
          <h3 className="text-gray-800 font-semibold text-sm">Notes</h3>
        </div>
        <div className="flex gap-1">
          <button onClick={() => applyFormat('bold')} className="bg-pink-100 hover:bg-pink-200 text-pink-700 rounded p-0.5" title="Bold">
            <span className="material-icons text-xs">format_bold</span>
          </button>
          <button onClick={() => applyFormat('italic')} className="bg-pink-100 hover:bg-pink-200 text-pink-700 rounded p-0.5" title="Italic">
            <span className="material-icons text-xs">format_italic</span>
          </button>
        </div>
      </div>
      <textarea
        id="routineNotesTextarea"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full bg-white border border-pink-200 rounded-md p-2 text-gray-800 text-sm min-h-[45px] max-h-[80px] focus:ring-1 focus:ring-pink-500 focus:border-pink-500 resize-none"
        placeholder="Quick notes..."
      />
      
      {/* Action Buttons - Compact Layout */}
      <div className="flex justify-center space-x-2 mt-2 mb-1 flex-wrap gap-1">
        {isTestRunning ? (
          <button
            onClick={onStopTest}
            className="px-3 py-2 rounded-lg font-medium shadow-md flex items-center justify-center transition-colors text-xs bg-gradient-to-r from-orange-500 to-orange-400 text-white hover:from-orange-600 hover:to-orange-500 animate-pulse"
          >
            <span className="material-icons mr-1 text-sm">stop</span>
            Stop Test
          </button>
        ) : (
          <>
            {!isTracking ? (
              <button
                onClick={onStartRoutine}
                className="px-3 py-2 rounded-lg font-medium shadow-md flex items-center justify-center transition-colors text-xs bg-gradient-to-r from-pink-500 to-pink-400 text-white hover:from-pink-600 hover:to-pink-500"
              >
                <span className="material-icons mr-1 text-sm">play_arrow</span>
                Start
              </button>
            ) : (
              <button
                onClick={onStopRoutine}
                className="px-3 py-2 rounded-lg font-medium shadow-md flex items-center justify-center transition-colors text-xs bg-gradient-to-r from-orange-500 to-orange-400 text-white hover:from-orange-600 hover:to-orange-500"
              >
                <span className="material-icons mr-1 text-sm">stop</span>
                Stop
              </button>
            )}

            {/* Test Button - Prominent and Easy to Access */}
            <button
              onClick={onStartTest}
              className={`px-4 py-2 rounded-lg font-bold shadow-md flex items-center justify-center transition-colors text-xs ${
                !hasReferenceMedia
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-green-400 text-white hover:from-green-600 hover:to-green-500 border-2 border-green-300 transform hover:scale-105'
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
              <span className="material-icons mr-1 text-sm">fitness_center</span>
              TEST
            </button>

            {/* Record Button - Compact */}
            {onRecord && (
              <button
                onClick={onRecord}
                className={`px-2 py-2 rounded-lg font-medium shadow-md flex items-center justify-center transition-colors text-xs ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                }`}
                title={isRecording ? 'Stop Recording' : 'Record Camera'}
              >
                <span className="material-icons text-sm">{isRecording ? 'stop' : 'videocam'}</span>
              </button>
            )}

            {/* Screen Recording Button - Compact */}
            {onToggleScreenRecording && (
              <button
                onClick={onToggleScreenRecording}
                className={`px-2 py-2 rounded-lg font-medium shadow-md flex items-center justify-center transition-colors text-xs ${
                  isScreenRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
                title={isScreenRecording ? 'Stop Screen Recording' : 'Record Entire Screen'}
              >
                <span className="material-icons text-sm">{isScreenRecording ? 'stop_screen_share' : 'screen_share'}</span>
              </button>
            )}

            {hasCompletedTest && (
              <button
                onClick={onShowResults}
                className="px-3 py-2 rounded-lg font-medium shadow-md flex items-center justify-center transition-colors bg-gradient-to-r from-green-500 to-green-400 text-white hover:from-green-600 hover:to-green-500 text-xs"
                title="View your test results"
                disabled={isRecording || isScreenRecording}
              >
                <span className="material-icons mr-1 text-sm">analytics</span>
                Results
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
