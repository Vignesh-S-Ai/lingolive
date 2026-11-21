import React from 'react';
import { Container } from './styles';
import { LandingPage } from './pages';
import { CreateRoom } from './pages';
import { JoinRoom } from './pages';
import { ConversationRoom } from './pages';
import { ParticipantList } from './components';
import { Subtitles } from './components';
import { MicrophoneControl } from './components';
import { LanguageSelector } from './components';
import { useTranslation } from './hooks';

function App() {
  const { translation } = useTranslation();

  return (
    <Container>
      <h1>Real-time Translator</h1>
      <div>
        <LandingPage />
        <CreateRoom />
        <JoinRoom />
        <ConversationRoom />
        <ParticipantList />
        <Subtitles />
        <MicrophoneControl />
        <LanguageSelector />
        <p>Translation: {translation}</p>
      </div>
    </Container>
  );
}

export default App;