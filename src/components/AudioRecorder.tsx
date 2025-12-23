import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Loader2, Square } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AudioRecorderProps {
  onTranscription: (text: string) => void;
  maxDurationMinutes?: number;
}

export default function AudioRecorder({ 
  onTranscription, 
  maxDurationMinutes = 45 
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  
  const maxDurationSeconds = maxDurationMinutes * 60;

  // Cleanup function
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    
    try {
      console.log('Starting transcription...');
      console.log('Audio blob size:', audioBlob.size, 'bytes');
      console.log('Audio blob type:', audioBlob.type);

      // Check file size (25MB limit for OpenAI Whisper)
      const maxSizeMB = 25;
      if (audioBlob.size > maxSizeMB * 1024 * 1024) {
        toast.error(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`);
        return;
      }

      // Convert blob to base64 using FileReader (more reliable)
      const base64Audio = await blobToBase64(audioBlob);
      console.log('Base64 length:', base64Audio.length);

      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { 
          audio: base64Audio,
          mimeType: audioBlob.type
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Erro ao chamar função de transcrição');
      }

      if (data?.error) {
        console.error('Transcription API error:', data.error);
        toast.error(data.error);
        return;
      }

      if (data?.text && data.text.trim()) {
        onTranscription(data.text.trim());
        toast.success("Transcrição concluída!");
      } else {
        toast.warning("Nenhum texto foi detectado no áudio");
      }
    } catch (error) {
      console.error("Erro na transcrição:", error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao transcrever: ${message}`);
    } finally {
      setIsTranscribing(false);
      setRecordingTime(0);
    }
  };

  const stopRecording = useCallback(() => {
    console.log('Stopping recording...');
    
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    
    setIsRecording(false);
  }, []);

  const startRecording = async () => {
    try {
      console.log('Requesting microphone access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      console.log('Microphone access granted');
      
      // Determine supported MIME type
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }
      
      console.log('Using MIME type:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('MediaRecorder stopped, processing audio...');
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        if (chunksRef.current.length > 0) {
          const audioBlob = new Blob(chunksRef.current, { type: mimeType });
          console.log('Created audio blob:', audioBlob.size, 'bytes');
          chunksRef.current = [];
          await transcribeAudio(audioBlob);
        } else {
          console.log('No audio chunks recorded');
          toast.warning("Nenhum áudio foi gravado");
          setIsTranscribing(false);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        toast.error("Erro durante a gravação");
        cleanup();
        setIsRecording(false);
      };

      // Start recording with timeslice to collect data periodically
      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxDurationSeconds) {
            toast.info("Tempo máximo de gravação atingido");
            stopRecording();
            return prev;
          }
          return newTime;
        });
      }, 1000);

      toast.success("Gravação iniciada");
      
    } catch (error) {
      console.error("Erro ao iniciar gravação:", error);
      cleanup();
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          toast.error("Acesso ao microfone negado. Verifique as permissões do navegador.");
        } else if (error.name === 'NotFoundError') {
          toast.error("Nenhum microfone encontrado.");
        } else {
          toast.error(`Erro de microfone: ${error.message}`);
        }
      } else {
        toast.error("Não foi possível iniciar a gravação");
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isRecording ? (
        <>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={stopRecording}
            className="gap-2"
          >
            <Square className="h-4 w-4 fill-current" />
            Parar ({formatTime(recordingTime)})
          </Button>
          <div className="flex items-center gap-2 text-destructive">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
            </span>
            <span className="text-xs font-medium">Gravando...</span>
          </div>
        </>
      ) : isTranscribing ? (
        <Button type="button" variant="outline" size="sm" disabled className="gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Transcrevendo...
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={startRecording}
          className="gap-2 hover:bg-primary/10"
          title={`Gravar áudio (máx. ${maxDurationMinutes} min)`}
        >
          <Mic className="h-4 w-4" />
          Gravar Áudio
        </Button>
      )}
    </div>
  );
}
