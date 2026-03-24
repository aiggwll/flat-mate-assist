import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Video, Square, X, Check } from "lucide-react";

interface CameraRecorderProps {
  onRecorded: (file: File) => void;
  onClose: () => void;
  roomName: string;
}

const CameraRecorder = ({ onRecorded, onClose, roomName }: CameraRecorderProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      alert("Kamera konnte nicht geöffnet werden. Bitte erlauben Sie den Zugriff.");
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, []);

  const handleStart = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(streamRef.current, { mimeType: "video/webm" });
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedBlob(blob);
      setRecordedUrl(URL.createObjectURL(blob));
    };
    mr.start();
    mediaRecorderRef.current = mr;
    setRecording(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  };

  const handleStop = () => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleConfirm = () => {
    if (!recordedBlob) return;
    const file = new File([recordedBlob], `${roomName}-${Date.now()}.webm`, { type: "video/webm" });
    onRecorded(file);
  };

  const handleRetake = () => {
    setRecordedBlob(null);
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    setElapsed(0);
    startCamera();
  };

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 text-white">
        <button onClick={() => { streamRef.current?.getTracks().forEach((t) => t.stop()); onClose(); }}>
          <X className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium">{roomName}</span>
        {recording ? (
          <span className="text-sm font-mono text-red-400">{fmt(elapsed)}</span>
        ) : (
          <span className="text-sm text-white/50">{fmt(elapsed)}</span>
        )}
      </div>

      {/* Video */}
      <div className="flex-1 relative overflow-hidden">
        {!recordedUrl ? (
          <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <video src={recordedUrl} controls playsInline className="absolute inset-0 w-full h-full object-contain bg-black" />
        )}
        {recording && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-white font-medium">Aufnahme läuft</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 px-4 py-6 bg-black/80">
        {!recordedUrl ? (
          !recording ? (
            <button
              onClick={handleStart}
              className="h-16 w-16 rounded-full border-4 border-white flex items-center justify-center transition-transform active:scale-95"
            >
              <div className="h-12 w-12 rounded-full bg-red-500" />
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="h-16 w-16 rounded-full border-4 border-white flex items-center justify-center transition-transform active:scale-95"
            >
              <Square className="h-6 w-6 text-white fill-white" />
            </button>
          )
        ) : (
          <>
            <Button variant="outline" size="lg" onClick={handleRetake} className="border-white/30 text-white bg-transparent hover:bg-white/10">
              Nochmal
            </Button>
            <Button size="lg" onClick={handleConfirm} className="gap-2">
              <Check className="h-4 w-4" /> Verwenden
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default CameraRecorder;
