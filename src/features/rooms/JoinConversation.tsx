import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LiveKitParticipant, LiveKitRoom } from "livekit-client";

type Language = "en-US" | "ta-IN" | "hi-IN" | "te-IN" | "fr-FR" | "de-DE" | "ja-JP" | "es-ES";

interface JoinConversationProps {
  onJoin: (roomName: string, participantName: string, inputLanguage: Language, outputLanguage: Language) => void;
}

export const JoinConversation: React.FC<JoinConversationProps> = ({ onJoin }) => {
  const [roomId, setRoomId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [inputLanguage, setInputLanguage] = useState<Language>("en-US");
  const [outputLanguage, setOutputLanguage] = useState<Language>("en-US");
  const [micPermission, setMicPermission] = useState<string | null>(null);
  const navigate = useNavigate();

  const languages: Language[] = [
    "en-US",
    "ta-IN",
    "hi-IN",
    "te-IN",
    "fr-FR",
    "de-DE",
    "ja-JP",
    "es-ES",
  ];

  const handleJoin = async () => {
    if (!roomId.trim() || !displayName.trim()) {
      alert("Please fill in all fields");
      return;
    }

    // Request microphone permission
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setMicPermission("granted");
    } catch (err) {
      console.error("Microphone permission denied", err);
      setMicPermission("denied");
      alert("Microphone permission is required to join the conversation.");
      return;
    }

    // Cleanup stream on unmount or if needed
    useEffect(() => {
      return () => {
        stream?.getTracks().forEach((track) => track.stop());
      };
    }, [stream]);

    // Emit join event to parent (LiveKit room joining logic)
    onJoin(roomId, displayName, inputLanguage, outputLanguage);

    // Navigate away or show room view
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
          Join Conversation
        </h2>

        <form className="space-y-4">
          {/* Room ID */}
          <Input
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            disabled={micPermission === "pending"}
            className="w-full"
          />

          {/* Display Name */}
          <Input
            placeholder="Your Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={micPermission === "pending"}
            className="w-full"
          />

          {/* Input Language (Spoken) */}
          <Select
            value={inputLanguage}
            onValueChange={(val) => setInputLanguage(val as Language)}
            disabled={micPermission === "pending"}
          >
            {languages.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </Select>

          {/* Output Language (Listened) */}
          <Select
            value={outputLanguage}
            onValueChange={(val) => setOutputLanguage(val as Language)}
            disabled={micPermission === "pending"}
          >
            {languages.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </Select>

          {/* Join Button */}
          <Button
            type="submit"
            disabled={!roomId.trim() || !displayName.trim() || micPermission === "pending"}
            onClick={handleJoin}
            className="w-full"
          >
            {micPermission === "granted" ? "Join Conversation" : "Requesting Microphone..."}
          </Button>

          {/* Permission status hint */}
          {micPermission === "denied" && (
            <p className="text-sm text-red-600 text-center mt-2">
              Microphone access denied. Please allow permission in browser settings.
            </p>
          )}
        </form>
      </div>
    </div>
  );
};