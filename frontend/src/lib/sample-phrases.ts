/** Short, human sample lines used in previews. Not a translation engine. */
const PHRASES: Record<string, { text: string; gloss: string }> = {
  'ta-IN': { text: 'வணக்கம்! நீங்கள் எப்படி இருக்கிறீர்கள்?', gloss: 'Hello! How are you?' },
  'hi-IN': { text: 'नमस्ते! आप कैसे हैं?', gloss: 'Hello! How are you?' },
  'te-IN': { text: 'నమస్కారం! మీరు ఎలా ఉన్నారు?', gloss: 'Hello! How are you?' },
  'en-IN': { text: 'Hello! How are you doing today?', gloss: 'Hello! How are you doing today?' },
}

export function samplePhrase(code: string | null | undefined): { text: string; gloss: string } {
  return (code && PHRASES[code]) || PHRASES['en-IN']!
}
