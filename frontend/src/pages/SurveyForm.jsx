import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchSurveyById, submitResponse, saveDraftResponse, resumeDraft } from '../api/apiClient';
import { useLocation } from 'react-router-dom';
import Notification from '../components/Notification';

export default function SurveyForm() {
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
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
        
        const initial = {};
        (data?.questions || []).forEach(q => {
          if (q.type === 'checkbox') initial[q.id] = [];
          else initial[q.id] = initial[q.id] || '';
        });
        setAnswers(initial);
        
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
        
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-gray-900 mb-4"></div>
        <p className="text-gray-600">Ładowanie ankiety...</p>
      </div>
    </div>
  );
  if (!survey) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Nie znaleziono ankiety</h2>
        <p className="text-gray-600 text-sm">Ankieta o podanym ID nie istnieje lub została usunięta.</p>
      </div>
    </div>
  );

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
    

    if (!validate()) return;

    try {
      const payload = { answers };
      if (inviteTokenFromUrl) payload.inviteToken = inviteTokenFromUrl;
      if (previewMode) payload.preview = true;
      await submitResponse(id, payload);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      const serverMsg = err && err.response && err.response.data && err.response.data.error;
      setNotification({ message: serverMsg || 'Wystąpił błąd podczas wysyłania odpowiedzi. Spróbuj ponownie.', type: 'error' });
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
        setNotification({ message: `Szkic zapisany. Link do kontynuacji skopiowany: ${window.location.origin}/survey/${id}?r=${res.resumeToken}`, type: 'success' });
      } else {
        setNotification({ message: 'Szkic zapisany. Zachowaj link do kontynuacji (brak tokena w odpowiedzi).', type: 'success' });
      }
    } catch (err) {
      console.error(err);
      setNotification({ message: 'Błąd zapisu szkicu', type: 'error' });
    }
  };

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10 max-w-md text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-900 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">Dziękujemy!</h2>
        <p className="text-gray-600">Twoja odpowiedź została pomyślnie przesłana.</p>
      </div>
    </div>
  );
  
  if (survey.status === 'archived') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10 max-w-md text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Ankieta zarchiwizowana</h2>
          <p className="text-gray-600">Ta ankieta jest zarchiwizowana i nie przyjmuje nowych odpowiedzi.</p>
        </div>
      </div>
    );
  }
  
  if (previewMode) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-semibold text-gray-900">Podgląd ankiety</h2>
              <button 
                className="text-sm text-gray-600 hover:text-gray-900 font-medium" 
                onClick={() => window.location.href = '/admin'}
              >
                ← Powrót do panelu
              </button>
            </div>
            <h3 className="text-lg text-gray-700 mb-1">{survey.title}</h3>
            {survey.description && (
              <p className="text-gray-600">{survey.description}</p>
            )}
          </div>
          <div className="space-y-5">
            {survey.questions.map((q, index) => (
              <div key={q.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {q.imageUrl && (
                  <div className="mb-5 -mx-6 -mt-6">
                    <img src={q.imageUrl} alt="question" className="w-full rounded-t-lg object-cover max-h-80" />
                  </div>
                )}
                <label className="block mb-4">
                  <span className="text-lg font-medium text-gray-900">
                    {index + 1}. {q.title || q.text}
                  </span>
                  {q.required && <span className="text-red-500 ml-1.5">*</span>}
                </label>
                {q.type === 'text' && (
                  <input disabled className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50" value={answers[q.id] || ''} />
                )}
                {q.type === 'textarea' && (
                  <textarea disabled className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 min-h-[120px]" value={answers[q.id] || ''} />
                )}
                {q.type === 'radio' && Array.isArray(q.options) && (
                  <div className="space-y-2">
                    {q.options.map((opt, i) => (
                      <label key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                        <input disabled type="radio" name={q.id} />
                        <span className="text-gray-700">{opt.text || opt}</span>
                      </label>
                    ))}
                  </div>
                )}
                {q.type === 'checkbox' && Array.isArray(q.options) && (
                  <div className="space-y-2">
                    {q.options.map((opt, i) => (
                      <label key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                        <input disabled type="checkbox" />
                        <span className="text-gray-700">{opt.text || opt}</span>
                      </label>
                    ))}
                  </div>
                )}
                {q.type === 'select' && Array.isArray(q.options) && (
                  <select disabled className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50">
                    <option>-- opcje --</option>
                    {q.options.map((opt, i) => <option key={i}>{opt.text || opt}</option>)}
                  </select>
                )}
                {q.type === 'scale' && (
                  <div className="flex flex-wrap gap-2 py-2">
                    {(() => {
                      const min = (q.scale && q.scale.min) || 1;
                      const max = (q.scale && q.scale.max) || 5;
                      const arr = [];
                      for (let v = min; v <= max; v++) arr.push(v);
                      return arr.map(v => (
                        <label key={v} className="inline-flex items-center justify-center min-w-[48px] h-12 px-4 rounded-lg border border-gray-300 bg-gray-50 cursor-not-allowed">
                          <input disabled type="radio" className="sr-only" />
                          <span className="text-base font-medium text-gray-600">{v}</span>
                        </label>
                      ));
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">{survey.title}</h2>
          {survey.description && (
            <p className="text-gray-600">{survey.description}</p>
          )}
        </div>
        
        {/* Questions */}
        <div className="space-y-5">
          {survey.questions.map((q, index) => (
            <div key={q.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {q.imageUrl && (
                <div className="mb-5 -mx-6 -mt-6">
                  <img 
                    src={q.imageUrl} 
                    alt="question" 
                    className="w-full rounded-t-lg object-cover max-h-80"
                  />
                </div>
              )}
              
              <label className="block mb-4">
                <span className="text-lg font-medium text-gray-900">
                  {index + 1}. {q.title || q.text}
                </span>
                {q.required && (
                  <span className="text-red-500 ml-1.5">*</span>
                )}
              </label>

              {q.type === 'text' && (
                <input 
                  type="text" 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all" 
                  value={answers[q.id] || ''} 
                  onChange={e => updateAnswer(q.id, e.target.value)}
                  placeholder="Wpisz odpowiedź..."
                />
              )}

              {q.type === 'textarea' && (
                <textarea 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all min-h-[120px] resize-y" 
                  value={answers[q.id] || ''} 
                  onChange={e => updateAnswer(q.id, e.target.value)}
                  placeholder="Wpisz odpowiedź..."
                />
              )}

              {q.type === 'radio' && Array.isArray(q.options) && (
                <div className="space-y-2">
                  {q.options.map((opt, i) => (
                    <label 
                      key={i} 
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        answers[q.id] === (opt.text || opt)
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name={q.id} 
                        checked={answers[q.id] === (opt.text || opt)} 
                        onChange={() => updateAnswer(q.id, opt.text || opt)}
                        className="w-4 h-4 text-gray-900 focus:ring-gray-900"
                      />
                      <span className="text-gray-700 flex-1">{opt.text || opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'checkbox' && Array.isArray(q.options) && (
                <div className="space-y-2">
                  {q.options.map((opt, i) => (
                    <label 
                      key={i} 
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        Array.isArray(answers[q.id]) && answers[q.id].includes(opt.text || opt)
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={Array.isArray(answers[q.id]) && answers[q.id].includes(opt.text || opt)} 
                        onChange={() => toggleCheckbox(q.id, opt.text || opt)}
                        className="w-4 h-4 text-gray-900 focus:ring-gray-900 rounded"
                      />
                      <span className="text-gray-700 flex-1">{opt.text || opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'select' && Array.isArray(q.options) && (
                <select 
                  value={answers[q.id] || ''} 
                  onChange={e => updateAnswer(q.id, e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all bg-white"
                >
                  <option value="">-- wybierz opcję --</option>
                  {q.options.map((opt, i) => (
                    <option key={i} value={opt.text || opt}>{opt.text || opt}</option>
                  ))}
                </select>
              )}

              {q.type === 'scale' && (
                <div className="flex flex-wrap gap-2 py-2">
                  {(() => {
                    const min = (q.scale && q.scale.min) || 1;
                    const max = (q.scale && q.scale.max) || 5;
                    const arr = [];
                    for (let v = min; v <= max; v++) arr.push(v);
                    return arr.map(v => (
                      <label 
                        key={v} 
                        className={`inline-flex items-center justify-center min-w-[48px] h-12 px-4 rounded-lg border cursor-pointer transition-all ${
                          String(answers[q.id]) === String(v)
                            ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name={q.id} 
                          checked={String(answers[q.id]) === String(v)} 
                          onChange={() => updateAnswer(q.id, v)}
                          className="sr-only"
                        />
                        <span className="text-base font-medium">{v}</span>
                      </label>
                    ));
                  })()}
                </div>
              )}

              {errors[q.id] && (
                <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {errors[q.id]}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <button 
            onClick={handleSubmit} 
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3.5 px-6 rounded-lg transition-colors shadow-sm"
          >
            Wyślij ankietę
          </button>
        </div>
      </div>
    </div>
    </>
  );
}