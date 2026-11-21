import React from "react";

const ErrorPage = () => {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sax p-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-red-500 mb-4">Error</h1>
        <p className="text-lg text-gray-400 mb-8">An unexpected error occurred.</p>
        <button
          onClick={() => window.history.back()}
          className="inline-block px-4 py-2 bg-primary text-white rounded hover:bg-primary-200 transition-colors">
          Go Back
        </button>
      </div>
    </div>
  );
};

export default ErrorPage;