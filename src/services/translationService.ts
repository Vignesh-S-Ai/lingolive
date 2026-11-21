export const translationService = {
  translate: async (text: string, targetLang: string) => {
    console.log(`Translating to ${targetLang}: ${text}`);
    return text;
  },
};