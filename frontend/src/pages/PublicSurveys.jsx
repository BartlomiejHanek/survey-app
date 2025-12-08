import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { fetchSurveys } from '../api/apiClient';
import { getSurveyId } from '../utils/surveys';

export default function PublicSurveys() {
  const [surveys, setSurveys] = useState([]);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const previewMode = params.get('preview') === '1' || params.get('p') === '1';

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchSurveys();
        setSurveys((data || []).filter(s => s.status === 'published'));
      } catch (err) {
        console.error(err);
        setSurveys([]);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Ankiety</h2>
      <div className="space-y-3">
        {surveys.map(s => (
          <div key={getSurveyId(s)} className="p-4 bg-white rounded shadow">
            <h3 className="font-semibold text-lg">{s.title}</h3>
            <p className="text-gray-600">{s.description}</p>
            <div className="mt-2">
              {previewMode ? (
                <Link to={`/survey/${getSurveyId(s)}?preview=1`} className="bg-white border border-gray-300 text-gray-800 px-3 py-1 rounded">Podgląd</Link>
              ) : (
                <Link to={`/survey/${getSurveyId(s)}`} className="bg-green-600 text-white py-1 px-3 rounded">Wypełnij ankietę</Link>
              )}
            </div>
          </div>
        ))}
        {surveys.length === 0 && <div>Brak opublikowanych ankiet.</div>}
      </div>
    </div>
  );
}
