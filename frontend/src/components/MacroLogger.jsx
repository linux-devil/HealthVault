import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Square, Play, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';

const MacroLogger = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcribedText, setTranscribedText] = useState('');
  const [macroData, setMacroData] = useState(null);
  const [error, setError] = useState('');
  const [hasPermission, setHasPermission] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      setError('Microphone permission denied. Please allow microphone access to use voice logging.');
      setHasPermission(false);
    }
  };

  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
    } catch (err) {
      setError('Failed to start recording: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);
    setError('');

    try {
      // Convert audio blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onload = async () => {
        const audioData = reader.result;
        
        const response = await fetch('/api/process-macro-speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audio: audioData,
            timestamp: new Date().toISOString()
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to process audio');
        }

        const result = await response.json();
        setTranscribedText(result.transcribed_text);
        setMacroData(result.macro_data);
      };
    } catch (err) {
      setError('Failed to process audio: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearRecording = () => {
    setAudioBlob(null);
    setTranscribedText('');
    setMacroData(null);
    setError('');
  };

  if (!hasPermission) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Macro Voice Logger</CardTitle>
          <CardDescription>
            Log your daily food intake using voice commands
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Microphone access is required for voice logging. Please refresh the page and allow microphone permission.
            </AlertDescription>
          </Alert>
          <Button onClick={checkMicrophonePermission} className="mt-4">
            Request Microphone Permission
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Macro Voice Logger
        </CardTitle>
        <CardDescription>
          Tell me what you ate today and I'll calculate your macros
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Recording Controls */}
        <div className="flex items-center justify-center gap-4">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              size="lg"
              className="flex items-center gap-2"
              disabled={isProcessing}
            >
              <Mic className="h-5 w-5" />
              Start Recording
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              variant="destructive"
              size="lg"
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Stop Recording
            </Button>
          )}

          {audioBlob && !isRecording && (
            <>
              <Button
                onClick={processAudio}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isProcessing ? 'Processing...' : 'Process Audio'}
              </Button>

              <Button
                onClick={clearRecording}
                variant="outline"
                disabled={isProcessing}
              >
                Clear
              </Button>
            </>
          )}
        </div>

        {/* Recording Status */}
        {isRecording && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-red-600">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
              Recording... Speak clearly about what you ate today
            </div>
          </div>
        )}

        {/* Transcribed Text */}
        {transcribedText && (
          <div className="space-y-2">
            <h3 className="font-semibold">What you said:</h3>
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-gray-700">{transcribedText}</p>
            </div>
          </div>
        )}

        {/* Macro Results */}
        {macroData && (
          <div className="space-y-4">
            <h3 className="font-semibold">Nutritional Analysis:</h3>
            
            {macroData.foods && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-600">Foods Identified:</h4>
                <div className="grid grid-cols-1 gap-2">
                  {macroData.foods.map((food, index) => (
                    <div key={index} className="p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                      <div className="font-medium">{food.name}</div>
                      {food.quantity && (
                        <div className="text-sm text-gray-600">Quantity: {food.quantity}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border">
                <div className="text-2xl font-bold text-green-700">
                  {Math.round(macroData.total_calories || 0)}
                </div>
                <div className="text-sm text-green-600">Calories</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg border">
                <div className="text-2xl font-bold text-blue-700">
                  {Math.round(macroData.total_protein || 0)}g
                </div>
                <div className="text-sm text-blue-600">Protein</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg border">
                <div className="text-2xl font-bold text-yellow-700">
                  {Math.round(macroData.total_carbs || 0)}g
                </div>
                <div className="text-sm text-yellow-600">Carbs</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg border">
                <div className="text-2xl font-bold text-purple-700">
                  {Math.round(macroData.total_fat || 0)}g
                </div>
                <div className="text-sm text-purple-600">Fat</div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>Instructions:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Click "Start Recording" and describe what you ate today</li>
            <li>Include quantities when possible (e.g., "two slices of bread", "one cup of rice")</li>
            <li>Speak clearly and mention specific foods</li>
            <li>Click "Stop Recording" when finished, then "Process Audio"</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default MacroLogger;