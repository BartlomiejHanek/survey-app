import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchSurveyById, submitResponse, saveDraftResponse, resumeDraft } from '../api/apiClient';
import { useLocation } from 'react-router-dom';

export default function SurveyForm() {
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const search = new URLSearchParams(location.search);
  const inviteTokenFromUrl = search.get('t') || search.get('token') || null;
  const resumeTokenFromUrl = search.get('r') || search.get('resume') || null;
  const previewMode = search.get('preview') === '1' || search.get('p') === '1';

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchSurveyById(id);
        setSurvey(data);
        // prefill answers if needed
        const initial = {};
        (data?.questions || []).forEach(q => {
          if (q.type === 'checkbox') initial[q.id] = [];
          else initial[q.id] = initial[q.id] || '';
        });
        setAnswers(initial);
        // if resume token present, try to load saved answers
        if (resumeTokenFromUrl) {
          try {
            const draft = await resumeDraft(resumeTokenFromUrl);
            if (draft && draft.answers) {
              const loaded = {};
              (draft.answers || []).forEach(a => {
                loaded[a.questionId] = a.value;
              });
              setAnswers(prev => ({ ...prev, ...loaded }));
            }
          } catch (err) { console.error('Nie można wczytać szkicu:', err); }
        }
        // no localStorage single-response enforcement — allow multiple respondents for same link
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) return <div>Ładowanie...</div>;
  if (!survey) return <div>Nie znaleziono ankiety.</div>;

  const updateAnswer = (qId, value) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const toggleCheckbox = (qId, option) => {
    setAnswers(prev => {
      const existing = Array.isArray(prev[qId]) ? [...prev[qId]] : [];
      const idx = existing.indexOf(option);
      if (idx === -1) existing.push(option);
      else existing.splice(idx, 1);
      return { ...prev, [qId]: existing };
    });
  };

  const validate = () => {
    const errs = {};
    (survey.questions || []).forEach(q => {
      if (q.required) {
        const val = answers[q.id];
        if (q.type === 'checkbox') {
          if (!Array.isArray(val) || val.length === 0) errs[q.id] = 'To pytanie jest wymagane';
        } else {
          if (val === undefined || val === null || String(val).trim() === '') errs[q.id] = 'To pytanie jest wymagane';
        }
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    // Do not block repeated submissions based on localStorage. Multiple people can submit the same survey link.

    if (!validate()) return;

    try {
      const payload = { answers };
      if (inviteTokenFromUrl) payload.inviteToken = inviteTokenFromUrl;
      await submitResponse(id, payload);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Wystąpił błąd podczas wysyłania odpowiedzi. Spróbuj ponownie.');
    }
  };

  const handleSaveDraft = async () => {
    try {
      const res = await saveDraftResponse(id, { answers }, resumeTokenFromUrl || null);
      const token = res && (res.resumeToken || res.resumeToken || res.resumeToken);
      const returned = res && (res.resumeToken || res.resumeToken || res.resumeToken) || (res && res.resumeToken) || (res && res.resumeToken);
      const resume = res && (res.resumeToken || res.resumeToken) || (res && res.resumeToken);
      const t = res && (res.resumeToken || res.resumeToken) || (res && res.resumeToken) || returned || resume;
      if (res && res.resumeToken) {
        try { await navigator.clipboard.writeText(window.location.origin + `/survey/${id}?r=${res.resumeToken}`); } catch (e) {}
        alert(`Szkic zapisany. Link do kontynuacji skopiowany: ${window.location.origin}/survey/${id}?r=${res.resumeToken}`);
      } else {
        alert('Szkic zapisany. Zachowaj link do kontynuacji (brak tokena w odpowiedzi).');
      }
    } catch (err) {
      console.error(err);
      alert('Błąd zapisu szkicu');
    }
  };

  if (submitted) return <div className="text-green-600 font-semibold">Dziękujemy, odpowiedź została przesłana!</div>;
  if (previewMode) {
    return (
      <div className="space-y-4 max-w-xl mx-auto p-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-2xl font-bold">Podgląd ankiety: {survey.title}</h2>
          <p className="text-gray-600 mt-1">{survey.description}</p>
        </div>
        {survey.questions.map(q => (
          <div key={q.id} className="border p-4 rounded bg-white shadow">
            {q.imageUrl ? <div className="mb-3"><img src={q.imageUrl} alt="question" style={{maxWidth:'100%', borderRadius:6}} /></div> : null}
            <label className="font-semibold block mb-2">{q.title || q.text} {q.required && <span className="text-red-600">*</span>}</label>
            {q.type === 'text' && (
              <input disabled className="border p-2 rounded w-full bg-gray-50" value={answers[q.id] || ''} />
            )}
            {q.type === 'textarea' && (
              <textarea disabled className="border p-1 rounded w-full bg-gray-50" value={answers[q.id] || ''} />
            )}
            {q.type === 'radio' && Array.isArray(q.options) && (
              <div className="space-y-2">
                {q.options.map((opt, i) => (
                  <label key={i} className="flex items-center gap-2">
                    <input disabled type="radio" name={q.id} />
                    <span>{opt.text || opt}</span>
                  </label>
                ))}
              </div>
            )}
            {q.type === 'checkbox' && Array.isArray(q.options) && (
              <div className="space-y-2">
                {q.options.map((opt, i) => (
                  <label key={i} className="flex items-center gap-2">
                    <input disabled type="checkbox" />
                    <span>{opt.text || opt}</span>
                  </label>
                ))}
              </div>
            )}
            {q.type === 'select' && Array.isArray(q.options) && (
              <select disabled className="border p-2 rounded w-full bg-gray-50">
                <option>-- opcje --</option>
                {q.options.map((opt, i) => <option key={i}>{opt.text || opt}</option>)}
              </select>
            )}
            {q.type === 'scale' && (
              <div className="flex gap-2 items-center">
                {(() => {
                  const min = (q.scale && q.scale.min) || 1;
                  const max = (q.scale && q.scale.max) || 5;
                  const arr = [];
                  for (let v = min; v <= max; v++) arr.push(v);
                  return arr.map(v => (
                    <label key={v} className="inline-flex items-center gap-1">
                      <input disabled type="radio" />
                      <span className="ml-1">{v}</span>
                    </label>
                  ));
                })()}
              </div>
            )}
          </div>
        ))}
        <div className="flex gap-2">
          <button className="bg-white border text-gray-800 py-2 px-4 rounded" onClick={() => window.location.href = '/admin'}>Powrót do panelu</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-xl mx-auto p-4">
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-2xl font-bold">{survey.title}</h2>
        <p className="text-gray-600 mt-1">{survey.description}</p>
      </div>
      {survey.questions.map(q => (
        <div key={q.id} className="border p-4 rounded bg-white shadow">
          {q.imageUrl ? <div className="mb-3"><img src={q.imageUrl} alt="question" style={{maxWidth:'100%', borderRadius:6}} /></div> : null}
          <label className="font-semibold block mb-2">{q.title || q.text} {q.required && <span className="text-red-600">*</span>}</label>

          {q.type === 'text' && (
            <input type="text" className="border p-2 rounded w-full" value={answers[q.id] || ''} onChange={e => updateAnswer(q.id, e.target.value)} />
          )}

          {q.type === 'textarea' && (
            <textarea className="border p-1 rounded w-full" value={answers[q.id] || ''} onChange={e => updateAnswer(q.id, e.target.value)} />
          )}

          {q.type === 'radio' && Array.isArray(q.options) && (
            <div className="space-y-2">
              {q.options.map((opt, i) => (
                <label key={i} className="flex items-center gap-2">
                  <input type="radio" name={q.id} checked={answers[q.id] === (opt.text || opt)} onChange={() => updateAnswer(q.id, opt.text || opt)} />
                  <span>{opt.text || opt}</span>
                </label>
              ))}
            </div>
          )}

          {q.type === 'checkbox' && Array.isArray(q.options) && (
            <div className="space-y-2">
              {q.options.map((opt, i) => (
                <label key={i} className="flex items-center gap-2">
                  <input type="checkbox" checked={Array.isArray(answers[q.id]) && answers[q.id].includes(opt.text || opt)} onChange={() => toggleCheckbox(q.id, opt.text || opt)} />
                  <span>{opt.text || opt}</span>
                </label>
              ))}
            </div>
          )}

          {q.type === 'select' && Array.isArray(q.options) && (
            <select value={answers[q.id] || ''} onChange={e => updateAnswer(q.id, e.target.value)} className="border p-2 rounded w-full">
              <option value="">-- wybierz --</option>
              {q.options.map((opt, i) => <option key={i} value={opt.text || opt}>{opt.text || opt}</option>)}
            </select>
          )}

          {q.type === 'scale' && (
            <div className="flex gap-2 items-center">
              {(() => {
                const min = (q.scale && q.scale.min) || 1;
                const max = (q.scale && q.scale.max) || 5;
                const arr = [];
                for (let v = min; v <= max; v++) arr.push(v);
                return arr.map(v => (
                  <label key={v} className="inline-flex items-center gap-1">
                    <input type="radio" name={q.id} checked={String(answers[q.id]) === String(v)} onChange={() => updateAnswer(q.id, v)} />
                    <span className="ml-1">{v}</span>
                  </label>
                ));
              })()}
            </div>
          )}

          {errors[q.id] && <div className="text-red-600 mt-1">{errors[q.id]}</div>}
        </div>
      ))}

      <div className="flex gap-2">
        <button onClick={handleSubmit} className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded">Wyślij</button>
      </div>
    </div>
  );
}