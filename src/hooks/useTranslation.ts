import { useState } from 'react';

export const useTranslation = () => {
  const [translation, setTranslation] = useState<string>('');
  return { translation, setTranslation };
};