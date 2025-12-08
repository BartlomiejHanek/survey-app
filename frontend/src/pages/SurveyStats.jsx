import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { fetchSurveyById, fetchResponses, exportResponsesCsv, archiveSurvey, deleteSurveyResponses } from '../api/apiClient';

function BarChart({ data }) {
  
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div className="space-y-2">
      {data.map(d => (
        <div key={d.label} className="flex items-center gap-2">
          <div className="w-32 text-sm text-gray-700">{d.label}</div>
          <div className="flex-1 bg-gray-100 rounded overflow-hidden h-4">
            <div style={{ width: `${(d.value/total)*100}%` }} className="bg-indigo-500 h-4"></div>
          </div>
          <div className="w-16 text-sm text-gray-700 text-right">{d.value}</div>
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
    <div className="flex gap-4 items-center">
      <div style={{ width: 160, height: 160, borderRadius: 9999, background: `conic-gradient(${gradient})` }} />
      <div className="space-y-1">
        {data.map(d => (
          <div key={d.label} className="flex items-center gap-2"><span style={{ display: 'inline-block', width: 14, height: 14, background: getColorForLabel(d.label) }} /> <span className="text-sm">{d.label} — {d.value}</span></div>
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
    } catch (err) { console.error(err); alert('Błąd eksportu CSV'); }
  };

  const handleArchive = async () => {
    if (!confirm('Archiwizować ankietę?')) return;
    try { await archiveSurvey(id); alert('Ankieta zarchiwizowana'); } catch (err) { console.error(err); alert('Błąd archiwizacji'); }
  };

  const handleDeleteResponses = async () => {
    if (!confirm('Usunąć wszystkie odpowiedzi?')) return;
    try { await deleteSurveyResponses(id); setResponses([]); alert('Odpowiedzi usunięte'); } catch (err) { console.error(err); alert('Błąd usuwania'); }
  };


  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Statystyki: {survey.title}</h2>
      <div className="mb-4 flex items-center gap-3">
        <div>Liczba odpowiedzi: <strong>{total}</strong></div>
        <button onClick={handleExportCsv} className="bg-white border border-gray-300 text-gray-800 px-3 py-1 rounded">Eksportuj CSV</button>
        <button onClick={handleDeleteResponses} className="bg-white border border-red-400 text-red-600 px-3 py-1 rounded">Usuń odpowiedzi</button>
        <button onClick={handleArchive} className="bg-white border border-gray-300 text-gray-800 px-3 py-1 rounded">Archiwizuj</button>
      </div>

      {survey.questions.map(q => (
        <div key={q.id} className="mb-6 p-4 bg-white rounded shadow">
          <h3 className="font-semibold mb-2">{q.title || q.text}</h3>
          <div className="text-sm text-gray-600 mb-2">Typ: {q.type}</div>
          <div>
            {(() => {
              const agg = aggregate(q);
              const entries = Object.entries(agg).map(([k,v]) => ({ label: k, value: v })).sort((a,b) => b.value - a.value);
              if (entries.length === 0) return <div className="text-gray-600">Brak odpowiedzi</div>;
              if (['radio','checkbox','select'].includes(q.type)) {
                return (
                  <div className="flex gap-6">
                    <div className="flex-1"><BarChart data={entries} /></div>
                    <div><PieChart data={entries} /></div>
                  </div>
                );
              }
              return (
                <table className="w-full text-left table-auto">
                  <thead>
                    <tr><th>Wartość</th><th className="pl-4">Liczba</th><th className="pl-4">% z całości</th></tr>
                  </thead>
                  <tbody>
                    {entries.map(e => (
                      <tr key={e.label}>
                        <td>{e.label}</td>
                        <td className="pl-4">{e.value}</td>
                        <td className="pl-4">{((e.value/total)*100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </div>
      ))}

      <div className="mb-6 p-4 bg-white rounded shadow">
        <h3 className="font-semibold mb-2">Pojedyncze odpowiedzi</h3>
        {responses.length === 0 ? <div className="text-gray-600">Brak odpowiedzi</div> : (
          <div className="space-y-2">
            {responses.map(r => (
              <div key={r._id} className="border p-2 rounded">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">{new Date(r.createdAt).toLocaleString()}</div>
                  <div className="flex gap-2">
                    <button className="bg-white border border-gray-300 text-gray-800 px-2 py-1 rounded text-sm" onClick={() => setExpanded(expanded === r._id ? null : r._id)}>{expanded === r._id ? 'Zwiń' : 'Pokaż'}</button>
                  </div>
                </div>
                {expanded === r._id && (
                  <div className="mt-2 text-sm">
                    {survey.questions.map(q => {
                      const qid = q.id || q._id;
                      const ans = r.answers.find(a => String(a.questionId) === String(qid));
                      let val = '';
                      if (ans) {
                        if (Array.isArray(ans.value)) val = ans.value.join(', ');
                        else val = String(ans.value);
                      }
                      return (
                        <div key={qid} className="mb-1"><strong>{q.title || q.text}:</strong> {val}</div>
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
  );
}