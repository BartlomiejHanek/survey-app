import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { fetchSurveyById, fetchResponses, exportResponsesCsv, archiveSurvey, deleteSurveyResponses } from '../api/apiClient';
import Notification from '../components/Notification';

function BarChart({ data }) {
  
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div className="space-y-3">
      {data.map(d => (
        <div key={d.label} className="flex items-center gap-3">
          <div className="w-32 text-sm font-medium text-gray-800">{d.label}</div>
          <div className="flex-1 bg-gray-200 rounded-full overflow-hidden h-6 shadow-inner">
            <div 
              style={{ width: `${(d.value/total)*100}%` }} 
              className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-6 rounded-full transition-all duration-300 flex items-center justify-end pr-2"
            >
              {d.value > 0 && (
                <span className="text-xs font-semibold text-white">{d.value}</span>
              )}
            </div>
          </div>
          <div className="w-20 text-sm font-semibold text-gray-700 text-right">
            {d.value} ({((d.value/total)*100).toFixed(1)}%)
          </div>
        </div>
      ))}
    </div>
  );
}

function PieChart({ data }) {
  
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let offset = 0;
  const slices = data.map(d => {
    const perc = (d.value / total) * 100;
    const from = offset;
    offset += perc;
    return { label: d.label, perc, from };
  });
  const gradient = slices.map(s => `${getColorForLabel(s.label)} ${s.from}% ${s.from + s.perc}%`).join(', ');
  return (
    <div className="flex gap-6 items-center">
      <div style={{ width: 180, height: 180, borderRadius: 9999, background: `conic-gradient(${gradient})`, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
      <div className="space-y-2">
        {data.map(d => (
          <div key={d.label} className="flex items-center gap-3">
            <span style={{ display: 'inline-block', width: 16, height: 16, background: getColorForLabel(d.label), borderRadius: '4px' }} />
            <span className="text-sm font-medium text-gray-700">{d.label}</span>
            <span className="text-sm font-semibold text-gray-900">{d.value}</span>
            <span className="text-xs text-gray-500">({((d.value/total)*100).toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getColorForLabel(label) {
  
  let h = 0;
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) % 360;
  return `hsl(${h},60%,50%)`;
}

export default function SurveyStats() {
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const s = await fetchSurveyById(id);
        const r = await fetchResponses(id);
        setSurvey(s);
        setResponses(r);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
    return undefined;
  }, [id]);

  if (loading) return <div className="p-4">Ładowanie...</div>;
  if (!survey) return <div className="p-4">Nie znaleziono ankiety</div>;

  const total = responses.length;

  const aggregate = (question) => {
    const qId = question.id || question._id;
    const map = {};
    const qIndex = (survey.questions || []).findIndex(q => String(q.id || q._id) === String(qId));
    responses.forEach(resp => {
      let ans = Array.isArray(resp.answers) ? resp.answers.find(a => String(a.questionId) === String(qId)) : null;
      if (!ans && Array.isArray(resp.answers) && qIndex !== -1 && resp.answers.length === (survey.questions || []).length) {
        const maybe = resp.answers[qIndex];
        if (maybe) ans = maybe;
      }
      if (!ans) return;
      const v = ans.value;
      if (Array.isArray(v)) {
        v.forEach(x => map[x] = (map[x]||0) + 1);
      } else {
        const key = v == null ? 'Brak' : String(v);
        map[key] = (map[key]||0) + 1;
      }
    });
    return map;
  };

  const handleExportCsv = async () => {
    try {
      const blob = await exportResponsesCsv(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `survey_${id}_responses.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setNotification({ message: 'CSV wyeksportowany', type: 'success' });
    } catch (err) { 
      console.error(err); 
      setNotification({ message: 'Błąd eksportu CSV', type: 'error' });
    }
  };

  const handleArchive = async () => {
    if (!confirm('Archiwizować ankietę?')) return;
    try { 
      await archiveSurvey(id); 
      setNotification({ message: 'Ankieta zarchiwizowana', type: 'success' });
    } catch (err) { 
      console.error(err); 
      setNotification({ message: 'Błąd archiwizacji', type: 'error' });
    }
  };

  const handleDeleteResponses = async () => {
    if (!confirm('Usunąć wszystkie odpowiedzi?')) return;
    try { 
      await deleteSurveyResponses(id); 
      setResponses([]); 
      setNotification({ message: 'Odpowiedzi usunięte', type: 'success' });
    } catch (err) { 
      console.error(err); 
      setNotification({ message: 'Błąd usuwania', type: 'error' });
    }
  };


  return (
    <>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <div className="p-6 max-w-5xl mx-auto bg-gray-50 min-h-screen">
      <div className="mb-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-3xl font-bold mb-2 text-gray-900">Statystyki: {survey.title}</h2>
        <div className="mb-4 flex items-center gap-4 flex-wrap">
          <div className="px-4 py-2 bg-indigo-50 rounded-lg border border-indigo-200">
            <span className="text-sm text-gray-600">Liczba odpowiedzi: </span>
            <strong className="text-lg text-indigo-700">{total}</strong>
          </div>
          <button onClick={handleExportCsv} className="bg-white border border-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">Eksportuj CSV</button>
          <button onClick={handleDeleteResponses} className="bg-white border border-red-400 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors shadow-sm">Usuń odpowiedzi</button>
          <button onClick={handleArchive} className="bg-white border border-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">Archiwizuj</button>
        </div>
      </div>

      {survey.questions.map((q, qIndex) => (
        <div key={q.id || q._id} className="mb-6 bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="mb-4 pb-3 border-b border-gray-200">
            <h3 className="text-xl font-semibold mb-1 text-gray-900">{q.title || q.text}</h3>
            <div className="text-sm text-gray-500">
              <span className="inline-block px-2 py-1 bg-gray-100 rounded text-gray-700 font-medium">Typ: {q.type}</span>
              {q.type === 'scale' && q.scale && (
                <span className="ml-2 inline-block px-2 py-1 bg-blue-100 rounded text-blue-700">
                  Skala: {q.scale.min || 1} - {q.scale.max || 5}
                </span>
              )}
            </div>
          </div>
          <div>
            {(() => {
              const agg = aggregate(q);
              let entries = Object.entries(agg).map(([k,v]) => ({ label: k, value: v }));
              
              // Dla pytań typu scale: sortuj numerycznie i pokaż wszystkie wartości od min do max
              if (q.type === 'scale') {
                const min = (q.scale && q.scale.min) || 1;
                const max = (q.scale && q.scale.max) || 5;
                
                // Utwórz mapę istniejących wartości
                const valueMap = {};
                entries.forEach(e => {
                  valueMap[String(e.label)] = e.value;
                });
                
                // Utwórz pełną listę wartości od min do max
                entries = [];
                for (let v = min; v <= max; v++) {
                  entries.push({
                    label: String(v),
                    value: valueMap[String(v)] || 0
                  });
                }
              } else {
                // Dla innych typów sortuj po liczbie odpowiedzi (malejąco)
                entries.sort((a,b) => b.value - a.value);
              }
              
              if (entries.length === 0 || entries.every(e => e.value === 0)) {
                return <div className="text-gray-500 italic py-4">Brak odpowiedzi</div>;
              }
              
              if (['radio','checkbox','select'].includes(q.type)) {
                return (
                  <div className="flex gap-8 flex-wrap">
                    <div className="flex-1 min-w-[300px]"><BarChart data={entries} /></div>
                    <div><PieChart data={entries} /></div>
                  </div>
                );
              }
              
              if (q.type === 'scale') {
                return <BarChart data={entries} />;
              }
              
              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="pb-3 text-sm font-semibold text-gray-700">Wartość</th>
                        <th className="pb-3 text-sm font-semibold text-gray-700 text-right">Liczba</th>
                        <th className="pb-3 text-sm font-semibold text-gray-700 text-right">% z całości</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map(e => (
                        <tr key={e.label} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 font-medium text-gray-800">{e.label}</td>
                          <td className="py-3 text-right font-semibold text-gray-700">{e.value}</td>
                          <td className="py-3 text-right text-gray-600">{total > 0 ? ((e.value/total)*100).toFixed(1) : '0.0'}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      ))}

      <div className="mb-6 bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-xl font-semibold mb-4 text-gray-900 pb-3 border-b border-gray-200">Pojedyncze odpowiedzi</h3>
        {responses.length === 0 ? (
          <div className="text-gray-500 italic py-4">Brak odpowiedzi</div>
        ) : (
          <div className="space-y-3">
            {responses.map(r => (
              <div key={r._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600 font-medium">
                    {new Date(r.createdAt).toLocaleString('pl-PL')}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors" 
                      onClick={() => setExpanded(expanded === r._id ? null : r._id)}
                    >
                      {expanded === r._id ? 'Zwiń' : 'Rozwiń'}
                    </button>
                  </div>
                </div>
                {expanded === r._id && (
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                    {survey.questions.map(q => {
                      const qid = q.id || q._id;
                      const ans = r.answers.find(a => String(a.questionId) === String(qid));
                      let val = '';
                      if (ans) {
                        if (Array.isArray(ans.value)) val = ans.value.join(', ');
                        else val = String(ans.value);
                      } else {
                        val = <span className="text-gray-400 italic">Brak odpowiedzi</span>;
                      }
                      return (
                        <div key={qid} className="py-2 border-b border-gray-100 last:border-0">
                          <strong className="text-gray-800 block mb-1">{q.title || q.text}:</strong>
                          <span className="text-gray-700">{val}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}