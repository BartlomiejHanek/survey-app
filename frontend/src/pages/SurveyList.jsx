import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchSurveys, publishSurvey, closeSurvey, deleteSurvey } from '../api/apiClient';
import { getSurveyId, statusLabel } from '../utils/surveys';

export default function SurveyList() {
  const [surveys, setSurveys] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchSurveys();
        setSurveys(data);
      } catch (err) {
        console.error('Błąd pobierania ankiet', err);
        setSurveys([]);
      }
    }
    load();
  }, []);

  const updateSurvey = (id, updater) =>
    setSurveys((prev) =>
      prev.map((item) => (getSurveyId(item) === id ? { ...item, ...updater(item) } : item))
    );

  const removeSurvey = (id) =>
    setSurveys((prev) => prev.filter((item) => getSurveyId(item) !== id));

  const handlePublish = async (survey) => {
    try {
      const result = await publishSurvey(getSurveyId(survey));
      const returned = result?.survey || result || {};
      const targetId = getSurveyId(survey);
      const savedId = getSurveyId(returned) || targetId;
      updateSurvey(targetId, () => ({ status: 'published', id: savedId, _id: savedId }));
      const link = `${window.location.origin}/survey/${savedId}`;
      try {
        await navigator.clipboard.writeText(link);
      } catch (e) {}
      alert(`Ankieta opublikowana. Link skopiowany: ${link}`);
    } catch (err) {
      console.error(err);
      alert('Błąd publikacji');
    }
  };

  const handleClose = async (survey) => {
    try {
      await closeSurvey(getSurveyId(survey));
      updateSurvey(getSurveyId(survey), () => ({ status: 'closed' }));
      alert('Ankieta zamknięta');
    } catch (err) {
      console.error(err);
      alert('Błąd zamknięcia');
    }
  };

  const handleDelete = async (survey) => {
    if (!confirm('Na pewno usunąć ankietę?')) return;
    try {
      await deleteSurvey(getSurveyId(survey));
      removeSurvey(getSurveyId(survey));
    } catch (err) {
      console.error(err);
      alert('Błąd usuwania');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Lista Ankiet</h2>
        <Link to="/admin/edit/new"><button className="bg-green-600 text-white py-1 px-3 rounded">Nowa Ankieta</button></Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {surveys.map(s => (
          <div key={getSurveyId(s)} className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold text-lg">{s.title}</h3>
            <p className="text-gray-600">Status: {statusLabel(s.status)}</p>
            <div className="mt-2 flex gap-2 flex-wrap items-center">
              <Link to={`/admin/edit/${getSurveyId(s)}`}><button className="bg-white border border-gray-300 text-gray-800 px-3 py-1 rounded">Edytuj</button></Link>
              <Link to={`/admin/stats/${getSurveyId(s)}`}><button className="bg-white border border-gray-300 text-gray-800 px-3 py-1 rounded">Statystyki</button></Link>
              {s.status !== 'published' && (
                <button className="bg-white border border-gray-300 text-gray-800 px-3 py-1 rounded" onClick={() => handlePublish(s)}>Publikuj</button>
              )}
              {s.status === 'published' && (
                <button className="bg-white border border-gray-300 text-gray-800 px-3 py-1 rounded" onClick={() => handleClose(s)}>Zamknij</button>
              )}
              <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded" onClick={() => handleDelete(s)}>Usuń</button>
              <button className="bg-white border border-gray-300 text-gray-800 px-3 py-1 rounded" onClick={() => window.open(`${window.location.origin}/survey/${getSurveyId(s)}?preview=1`)}>Podgląd</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
