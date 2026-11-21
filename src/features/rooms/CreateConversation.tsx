// CreateConversation.tsx
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { LivekitRoomProvider, useParticipant } from "@livekit/components-react";
import { Room } from "@livekit/components-react";

interface CreateConversationProps {
  onRoomCreated: (roomId: string, userName: string, inputLanguage: string, outputLanguage: string) => void;
}

/**
 * CreateConversation - Allows users to create a new conversation room
 * with language preferences for the real-time multilingual translator.
 *
 * Features:
 * - Display name input
 * - Input language selection (spoken language)
 * - Output language selection (listening language)
 * - Room creation with shareable room ID
 * - Tailwind CSS styling, responsive, accessible
 * - LiveKit room integration
 */
export const CreateConversation: React.FC<CreateConversationProps> = ({
  onRoomCreated,
}) => {
  const [displayName, setDisplayName] = useState("");
  const [inputLanguage, setInputLanguage] = useState<Language>("en");
  const [outputLanguage, setOutputLanguage] = useState<Language>("es");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const languages: Language[] = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "zh", name: "Chinese (Mandarin)" },
    { code: "ja", name: "Japanese" },
    { code: "ar", name: "Arabic" },
  ];

  const handleCreateRoom = async () => {
    if (!displayName.trim()) return;

    setIsCreating(true);
    try {
      // Generate a room ID (in a real app, this would be via LiveKit API)
      const generatedRoomId = `room-${Math.random().toString(36).substring(2, 12)}`;
      setRoomId(generatedRoomId);

      // Call the parent callback to navigate/redirect
      onRoomCreated(generatedRoomId, displayName, inputLanguage, outputLanguage);
    } catch (err) {
      console.error("Failed to create room:", err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">
          Create Conversation
        </h2>

        {/* Display Name Section */}
        <div className="mb-4">
          <Label htmlFor="display-name">Your Name</Label>
          <Input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your display name"
            required
          />
        </div>

        {/* Input Language Section */}
        <div className="mb-4">
          <Label htmlFor="input-language">Spoken Language</Label>
          <Select
            value={inputLanguage}
            onValueChange={(value) => setInputLanguage(value)}
            id="input-language"
          >
            {languages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name}
              </SelectItem>
            ))}
          </Select>
        </div>

        {/* Output Language Section */}
        <div className="mb-6">
          <Label htmlFor="output-language">Listening Language</Label>
          <Select
            value={outputLanguage}
            onValueChange={(value) => setOutputLanguage(value)}
            id="output-language"
          >
            {languages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name}
              </SelectItem>
            ))}
          </Select>
        </div>

        {/* Room Creation Button */}
        <Button
          disabled={!displayName.trim() || isCreating}
          onClick={handleCreateRoom}
          className="w-full"
        >
          {isCreating ? "Creating..." : "Create Room"}
        </Button>

        {/* Room Result Section */}
        {roomId && (
          <div className="mt-8 p-4 bg-gray-100 rounded-xl text-center">
            <h3 className="font-semibold mb-2">Room Created!</h3>
            <p className="text-sm text-gray-600">
              Share this room ID with participants:{" "}
              <code className="font-mono text-sm">{roomId}</code>
            </p>
            <Button
              onClick={() => navigate("/")}
              className="mt-2 inline-flex gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.5 5.5a3.5 3.5 0 1 1 0 7H8v2h2v2H8v2h2v-2h-2v-2h2a3.5 3.5 0 0 1 0 7H5v-2H3v-2h2V8a1 1 0 0 1 2 0v2h2V5a1 1 0 0 1 2 0z" />
              </svg>
              Back Home
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

type Language = { code: string; name: string };