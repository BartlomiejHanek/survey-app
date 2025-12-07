import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchSurveys, publishSurvey, closeSurvey, deleteSurvey } from '../api/apiClient';

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

  

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Lista Ankiet</h2>
        <Link to="/admin/edit/new"><button className="bg-green-600 text-white py-1 px-3 rounded">Nowa Ankieta</button></Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {surveys.map(s => (
          <div key={s.id || s._id} className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold text-lg">{s.title}</h3>
            <p className="text-gray-600">Status: { (s.status && ({ draft: 'Robocza', published: 'Opublikowana', closed: 'Zamknięta' })[s.status]) || s.status }</p>
            <div className="mt-2 flex gap-2 flex-wrap items-center">
              <Link to={`/admin/edit/${s.id || s._id}`}><button className="bg-white border border-gray-300 text-gray-800 px-3 py-1 rounded">Edytuj</button></Link>
              <Link to={`/admin/stats/${s.id || s._id}`}><button className="bg-white border border-gray-300 text-gray-800 px-3 py-1 rounded">Statystyki</button></Link>
              {s.status !== 'published' && <button className="bg-white border border-gray-300 text-gray-800 px-3 py-1 rounded" onClick={async () => {
                try {
                  const result = await publishSurvey(s.id || s._id);
                  const returned = result && result.survey ? result.survey : result;
                  const targetId = (s.id || s._id);
                  setSurveys(prev => prev.map(x => ((x.id || x._id) === targetId ? { ...x, status: 'published', id: returned._id || returned.id || x.id, _id: returned._id || x._id } : x)));
                  const surveyId = returned._id || returned.id || targetId;
                  const link = `${window.location.origin}/survey/${surveyId}`;
                  try { await navigator.clipboard.writeText(link); } catch (e) {}
                  alert(`Ankieta opublikowana. Link skopiowany: ${link}`);
                } catch (err) { console.error(err); alert('Błąd publikacji'); }
              }}>Publikuj</button>}
              {s.status === 'published' && <button className="bg-white border border-gray-300 text-gray-800 px-3 py-1 rounded" onClick={async () => {
                try {
                  const result = await closeSurvey(s.id || s._id);
                  const targetId = (s.id || s._id);
                  setSurveys(prev => prev.map(x => ((x.id || x._id) === targetId ? { ...x, status: 'closed' } : x)));
                  alert('Ankieta zamknięta');
                } catch (err) { console.error(err); alert('Błąd zamknięcia'); }
              }}>Zamknij</button>}
              <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded" onClick={async () => {
                if (!confirm('Na pewno usunąć ankietę?')) return;
                try { await deleteSurvey(s.id || s._id); setSurveys(prev => prev.filter(x => (x.id || x._id) !== (s.id || s._id))); }
                catch (err) { console.error(err); alert('Błąd usuwania'); }
              }}>Usuń</button>
              <button className="bg-white border border-gray-300 text-gray-800 px-3 py-1 rounded" onClick={() => window.open(`${window.location.origin}/survey/${s.id || s._id}?preview=1`)}>Podgląd</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
