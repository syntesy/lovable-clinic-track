import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, Square } from "lucide-react";
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
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const maxDurationSeconds = maxDurationMinutes * 60;

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : 'audio/mp4'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        
        if (chunksRef.current.length > 0) {
          const audioBlob = new Blob(chunksRef.current, { 
            type: mediaRecorder.mimeType 
          });
          await transcribeAudio(audioBlob);
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxDurationSeconds - 1) {
            stopRecording();
            toast.info("Tempo máximo de gravação atingido");
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      toast.success("Gravação iniciada");
    } catch (error) {
      console.error("Erro ao iniciar gravação:", error);
      toast.error("Não foi possível acessar o microfone. Verifique as permissões.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );

      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { 
          audio: base64Audio,
          mimeType: audioBlob.type
        }
      });

      if (error) throw error;

      if (data?.text) {
        onTranscription(data.text);
        toast.success("Transcrição concluída!");
      } else {
        toast.error("Nenhum texto foi transcrito");
      }
    } catch (error) {
      console.error("Erro na transcrição:", error);
      toast.error("Erro ao transcrever áudio. Tente novamente.");
    } finally {
      setIsTranscribing(false);
      setRecordingTime(0);
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
            <Square className="h-4 w-4" />
            Parar ({formatTime(recordingTime)})
          </Button>
          <div className="flex items-center gap-2 text-destructive animate-pulse">
            <Mic className="h-4 w-4" />
            <span className="text-xs">Gravando...</span>
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
          className="gap-2"
          title={`Gravar áudio (máx. ${maxDurationMinutes} min)`}
        >
          <Mic className="h-4 w-4" />
          Gravar Áudio
        </Button>
      )}
    </div>
  );
}
