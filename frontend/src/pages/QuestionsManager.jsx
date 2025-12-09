import React from 'react';

export default function QuestionsManager() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Zarządzanie pytaniami
          </h1>
        </div>

        <div className="grid gap-6">
          <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Lista pytań</h2>
          </section>
        </div>
      </div>
    </div>
  );
}

