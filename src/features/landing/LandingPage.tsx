import React from "react";
import { Link } from "react-router-dom";

const LandingPage: React.FC = () => {
  return (
    <section className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
            LingoLive
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Real-time multilingual translation breaking language barriers instantly.
          </p>
        </header>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12 md:mb-16">
          <Link
            to="/create-conversation"
            className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-6 py-3 text-lg font-medium shadow-sm hover:opacity-90 transition-opacity"
          >
            Start Conversation
          </Link>
          <Link
            to="/join-conversation"
            className="inline-flex items-center justify-center rounded-lg border border-input px-6 py-3 text-lg font-medium shadow-sm hover:opacity-90 transition-opacity"
          >
            Join Conversation
          </Link>
        </div>

        {/* Supported Languages */}
        <section className="mb-12">
          <h2 className="text-xl font-medium mb-4">Supported Languages</h2>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="px-3 py-1 rounded bg-primary/10 text-primary text-sm">Tamil</span>
            <span className="px-3 py-1 rounded bg-primary/10 text-primary text-sm">Hindi</span>
            <span className="px-3 py-1 rounded bg-primary/10 text-primary text-sm">Telugu</span>
          </div>
        </section>

        {/* Feature Highlights */}
        <section>
          <h2 className="text-xl font-medium mb-6">Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Live transcription</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Low latency</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Speaker identification</p>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
};

export default LandingPage;