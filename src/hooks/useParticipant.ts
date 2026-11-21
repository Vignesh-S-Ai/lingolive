import { useState } from 'react';

export const useParticipant = () => {
  const [participants, setParticipants] = useState<any[]>([]);
  return { participants, setParticipants };
};