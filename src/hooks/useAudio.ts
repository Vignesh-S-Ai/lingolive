import { useState } from 'react';

export const useAudio = () => {
  const [isRecording, setIsRecording] = useState(false);
  return { isRecording, setIsRecording };
};