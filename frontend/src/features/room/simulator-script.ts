/**
 * Scripted conversation used while no real media transport is connected.
 *
 * Every line exists in all four supported languages, so a turn spoken in any
 * language can be rendered in whatever language each participant asked for.
 * The UI always labels this content as simulated.
 */
export const SCRIPT: Record<string, string>[] = [
  {
    'ta-IN': 'வணக்கம்! எல்லோரும் என்னைக் கேட்க முடிகிறதா?',
    'hi-IN': 'नमस्ते! क्या सब लोग मुझे सुन पा रहे हैं?',
    'te-IN': 'నమస్కారం! అందరూ నన్ను వినగలరా?',
    'en-IN': 'Hello! Can everyone hear me?',
  },
  {
    'ta-IN': 'ஆம், தெளிவாகக் கேட்கிறது.',
    'hi-IN': 'हाँ, बिल्कुल साफ़ सुनाई दे रहा है।',
    'te-IN': 'అవును, స్పష్టంగా వినిపిస్తోంది.',
    'en-IN': "Yes, it's perfectly clear.",
  },
  {
    'ta-IN': 'இந்த வார இறுதிக்குள் திட்டத்தை முடிக்க வேண்டும்.',
    'hi-IN': 'हमें इस सप्ताह के अंत तक प्रोजेक्ट पूरा करना है।',
    'te-IN': 'ఈ వారాంతంలోపు ప్రాజెక్ట్ పూర్తి చేయాలి.',
    'en-IN': 'We need to finish the project by the end of this week.',
  },
  {
    'ta-IN': 'நாளை மதியம் கூடலாமா?',
    'hi-IN': 'क्या हम कल दोपहर मिल सकते हैं?',
    'te-IN': 'రేపు మధ్యాహ్నం కలవగలమా?',
    'en-IN': 'Shall we meet tomorrow afternoon?',
  },
  {
    'ta-IN': 'நன்றி, அனைவருக்கும் நன்றி.',
    'hi-IN': 'धन्यवाद, सभी को धन्यवाद।',
    'te-IN': 'ధన్యవాదాలు, అందరికీ ధన్యవాదాలు.',
    'en-IN': 'Thank you, thank you everyone.',
  },
  {
    'ta-IN': 'அடுத்த கூட்டம் எப்போது?',
    'hi-IN': 'अगली बैठक कब है?',
    'te-IN': 'తదుపరి సమావేశం ఎప్పుడు?',
    'en-IN': 'When is the next meeting?',
  },
  {
    'ta-IN': 'வெள்ளிக்கிழமை காலை பத்து மணிக்கு.',
    'hi-IN': 'शुक्रवार सुबह दस बजे।',
    'te-IN': 'శుక్రవారం ఉదయం పది గంటలకు.',
    'en-IN': 'Friday at ten in the morning.',
  },
  {
    'ta-IN': 'அருமை, அப்போது பார்க்கலாம்.',
    'hi-IN': 'बढ़िया, तब मिलते हैं।',
    'te-IN': 'అద్భుతం, అప్పుడు కలుద్దాం.',
    'en-IN': 'Great, see you all then.',
  },
  {
    'ta-IN': 'மொழிபெயர்ப்பு மிக விரைவாக வருகிறது.',
    'hi-IN': 'अनुवाद बहुत तेज़ी से आ रहा है।',
    'te-IN': 'అనువాదం చాలా వేగంగా వస్తోంది.',
    'en-IN': 'The translation is coming through very fast.',
  },
  {
    'ta-IN': 'என் ஒலி சற்று குறைவாக உள்ளதா?',
    'hi-IN': 'क्या मेरी आवाज़ थोड़ी कम आ रही है?',
    'te-IN': 'నా గొంతు కొంచెం తక్కువగా ఉందా?',
    'en-IN': 'Is my voice coming through a little quiet?',
  },
]

export interface SimulatedPeer {
  id: string
  name: string
  inputLanguage: string
  outputLanguage: string
}

/**
 * Remote participants that appear until a real LiveKit room is connected.
 * They are labelled “demo” everywhere they are rendered.
 */
export const SIMULATED_PEERS: SimulatedPeer[] = [
  {
    id: 'demo-rahul',
    name: 'Rahul Verma',
    inputLanguage: 'hi-IN',
    outputLanguage: 'ta-IN',
  },
  {
    id: 'demo-kiran',
    name: 'Kiran Rao',
    inputLanguage: 'te-IN',
    outputLanguage: 'en-IN',
  },
]
