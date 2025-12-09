import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { fetchSurveyById, saveSurvey, publishSurvey, closeSurvey, deleteSurvey, createInvite, archiveSurvey, unarchiveSurvey, deleteSurveyResponses } from '../api/apiClient';
import { useRef } from 'react';
import { isLoggedIn } from '../auth';
import { useNavigate } from 'react-router-dom';
import { getSurveyId } from '../utils/surveys';
import Notification from '../components/Notification';

export default function SurveyEditor() {
  const { id } = useParams();
  const [survey, setSurvey] = useState({ title: '', description: '', status: 'draft', questions: [] });
  const [lastInvite, setLastInvite] = useState(null);
  const [notification, setNotification] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      if (id && id !== 'new') {
        const data = await fetchSurveyById(id);
        setSurvey(data);
      }
    }
    load();
  }, [id]);

  // czas zimowy
  const formatLocalDatetime = (val) => {
    if (!val) return '';
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const parseLocalDatetimeToISO = (localValue) => {
    if (!localValue) return null;
    const [datePart, timePart] = localValue.split('T');
    if (!datePart || !timePart) return null;
    const [y, m, d] = datePart.split('-').map(n => parseInt(n, 10));
    const [hh, mm] = timePart.split(':').map(n => parseInt(n, 10));
    const dt = new Date(y, m - 1, d, hh, mm);
    return dt.toISOString();
  };

  useEffect(() => {
    if (!(isLoggedIn())) {
      window.location.href = '/login';
    }
  }, []);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(survey.questions);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setSurvey({ ...survey, questions: items });
  };

  

  const fileInputRef = useRef();

  const addQuestion = () => {
    const newQuestion = { id: Date.now().toString(), type: 'text', title: '', required: false, options: [] };
    setSurvey({ ...survey, questions: [...survey.questions, newQuestion] });
  };

  const removeQuestion = (index) => {
    if (!confirm('Czy na pewno usunąć to pytanie?')) return;
    const qs = [...survey.questions];
    qs.splice(index, 1);
    setSurvey({ ...survey, questions: qs });
  };

  const handleUploadForQuestion = (index) => {
    fileInputRef.current && fileInputRef.current.click();
    fileInputRef.current._targetQuestion = index;
  };

  const onFileSelected = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const idx = e.target._targetQuestion;
      if (typeof idx === 'number') {
        const qs = [...survey.questions];
        qs[idx].imageUrl = dataUrl;
        setSurvey({ ...survey, questions: qs });
      }
    };
    reader.readAsDataURL(f);
    e.target.value = '';
  };

  const updateQuestion = (index, field, value) => {
    const questions = [...survey.questions];
    questions[index][field] = value;
    setSurvey({ ...survey, questions });
  };

  const save = async () => {
    try {
      const res = await saveSurvey(survey);
      const savedId = getSurveyId(res);
      if (savedId) setSurvey(prev => ({ ...prev, id: savedId, _id: savedId }));
      setNotification({ message: 'Ankieta zapisana!', type: 'success' });
    } catch (err) {
      console.error(err);
      setNotification({ message: 'Błąd zapisu ankiety', type: 'error' });
    }
  };

  const handlePublish = async () => {
    const sid = getSurveyId(survey);
    if (!sid) {
      setNotification({ message: 'Zapisz najpierw ankietę przed publikacją', type: 'error' });
      return;
    }
    try {
      const res = await publishSurvey(sid);
      const returned = res?.survey || res || {};
      const finalId = getSurveyId(returned) || sid;
      setSurvey(prev => ({ ...prev, status: 'published', id: finalId, _id: finalId }));
      const link = `${window.location.origin}/survey/${finalId}`;
      setNotification({ message: `Ankieta opublikowana. Link: ${link}`, type: 'success', copyText: link });
    } catch (err) { 
      console.error(err); 
      setNotification({ message: 'Błąd publikacji', type: 'error' });
    }
  };

  const handleClose = async () => {
    const sid = getSurveyId(survey);
    if (!sid) return;
    try {
      await closeSurvey(sid);
      setSurvey(prev => ({ ...prev, status: 'closed' }));
      setNotification({ message: 'Ankieta zamknięta', type: 'success' });
    } catch (err) { 
      console.error(err); 
      setNotification({ message: 'Błąd zamknięcia', type: 'error' });
    }
  };

  const handleArchive = async () => {
    const sid = getSurveyId(survey);
    if (!sid) return;
    if (!confirm('Archiwizować ankietę?')) return;
    try {
      await archiveSurvey(sid);
      setSurvey(prev => ({ ...prev, status: 'archived' }));
      setNotification({ message: 'Ankieta zarchiwizowana', type: 'success' });
    } catch (err) { 
      console.error(err); 
      setNotification({ message: 'Błąd archiwizacji', type: 'error' });
    }
  };

  const handleUnarchive = async () => {
    const sid = getSurveyId(survey);
    if (!sid) return;
    if (!confirm('Przywrócić ankietę?')) return;
    try {
      const res = await unarchiveSurvey(sid);
      const returned = res?.survey || res || {};
      setSurvey(prev => ({ ...prev, status: returned.status || 'draft' }));
      setNotification({ message: 'Ankieta przywrócona', type: 'success' });
    } catch (err) { 
      console.error(err); 
      setNotification({ message: 'Błąd przywracania', type: 'error' });
    }
  };

  const handleDeleteResponses = async () => {
    const sid = getSurveyId(survey);
    if (!sid) return;
    if (!confirm('Usunąć wszystkie odpowiedzi tej ankiety?')) return;
    try {
      await deleteSurveyResponses(sid);
      setNotification({ message: 'Wszystkie odpowiedzi zostały usunięte', type: 'success' });
    } catch (err) { 
      console.error(err); 
      setNotification({ message: 'Błąd usuwania odpowiedzi', type: 'error' });
    }
  };

  const handleDelete = async () => {
    const sid = getSurveyId(survey);
    if (!sid) return navigate('/admin');
    if (!confirm('Na pewno usunąć ankietę?')) return;
    try {
      await deleteSurvey(sid);
      navigate('/admin');
    } catch (err) { 
      console.error(err); 
      setNotification({ message: 'Błąd usuwania', type: 'error' });
    }
  };

  const isArchived = survey.status === 'archived';

  return (
    <>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
          actionLabel={notification.copyText ? 'Skopiuj link' : undefined}
          onAction={
            notification.copyText
              ? async () => {
                  try {
                    await navigator.clipboard.writeText(notification.copyText);
                  } catch (e) {
                    console.error(e);
                  }
                }
              : undefined
          }
        />
      )}
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-semibold text-gray-900">
              {id === 'new' ? 'Nowa ankieta' : 'Edytuj ankietę'}
            </h1>
            <button
              onClick={() => navigate('/admin')}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Powrót do listy
            </button>
          </div>
        </div>

        {/* Survey Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="space-y-5">
            {isArchived && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">Ankieta jest zarchiwizowana. Możesz przeglądać wyniki, ale nie możesz edytować ani przyjmować nowych odpowiedzi.</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tytuł ankiety</label>
              <input 
                type="text" 
                value={survey.title || ''} 
                onChange={e => setSurvey({...survey, title: e.target.value})} 
                placeholder="Wpisz tytuł ankiety..." 
                disabled={isArchived}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Opis ankiety</label>
              <input 
                type="text" 
                value={survey.description || ''} 
                onChange={e => setSurvey({...survey, description: e.target.value})} 
                placeholder="Krótki opis ankiety..." 
                disabled={isArchived}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed" 
              />
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <input 
                type="checkbox" 
                checked={!!survey.singleResponse} 
                onChange={e => setSurvey({...survey, singleResponse: !!e.target.checked})}
                disabled={isArchived}
                className="w-4 h-4 text-gray-900 focus:ring-gray-900 disabled:cursor-not-allowed"
              />
              <label className="text-sm text-gray-700">Tylko jedno wypełnienie (wymaga tokena)</label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Aktywna od:</label>
                <input 
                  type="datetime-local" 
                  value={formatLocalDatetime(survey.validFrom)} 
                  onChange={e => setSurvey({...survey, validFrom: e.target.value ? parseLocalDatetimeToISO(e.target.value) : null})} 
                  disabled={isArchived}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ważna do:</label>
                <input 
                  type="datetime-local" 
                  value={formatLocalDatetime(survey.validUntil)} 
                  onChange={e => setSurvey({...survey, validUntil: e.target.value ? parseLocalDatetimeToISO(e.target.value) : null})} 
                  disabled={isArchived}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed" 
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {!isArchived && (
                <>
                  <button 
                    onClick={save} 
                    className="bg-gray-900 hover:bg-gray-800 text-white py-2.5 px-5 text-sm font-medium rounded-lg transition-colors shadow-sm"
                  >
                    Zapisz
                  </button>
                  {survey && (survey.status !== 'published') && (
                    <button 
                      onClick={handlePublish} 
                      className="bg-gray-900 hover:bg-gray-800 text-white py-2.5 px-5 text-sm font-medium rounded-lg transition-colors shadow-sm"
                    >
                      Publikuj
                    </button>
                  )}
                  {survey && (survey.status === 'published') && (
                    <button 
                      onClick={handleClose} 
                      className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2.5 px-5 text-sm font-medium rounded-lg transition-colors shadow-sm"
                    >
                      Zamknij
                    </button>
                  )}
                  {(survey && getSurveyId(survey)) && (
                    <button 
                      onClick={handleArchive} 
                      className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2.5 px-5 text-sm font-medium rounded-lg transition-colors shadow-sm"
                    >
                      Archiwizuj
                    </button>
                  )}
                  {(survey && getSurveyId(survey)) && (
                    <button 
                        onClick={async () => {
                          const sid = getSurveyId(survey);
                          if (!sid) {
                            setNotification({ message: 'Zapisz najpierw ankietę', type: 'error' });
                            return;
                          }

                          // Jeśli nie jest zaznaczone jednorazowe wypełnienie,
                          // pokaż zwykły link bez tokena i nielimitowaną liczbą odpowiedzi.
                          if (!survey.singleResponse) {
                            const link = `${window.location.origin}/survey/${sid}`;
                            setNotification({
                              message: `Link do ankiety: ${link}`,
                              type: 'success',
                              copyText: link
                            });
                            return;
                          }

                          // Dla ankiet z jednorazowym wypełnieniem generujemy token.
                          try {
                            const res = await createInvite(sid, 1, null);
                            const token = res && res.invite && res.invite.token;
                            const link = `${window.location.origin}/survey/${sid}?t=${token}`;
                            setLastInvite({ token, link });
                            setNotification({
                              message: `Utworzono zaproszenie (jednorazowy link): ${link}`,
                              type: 'success',
                              copyText: link
                            });
                          } catch (err) { 
                            console.error(err); 
                            setNotification({ message: 'Błąd tworzenia zaproszenia', type: 'error' });
                          }
                        }}
                      className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2.5 px-5 text-sm font-medium rounded-lg transition-colors shadow-sm"
                    >
                      Utwórz zaproszenie
                    </button>
                  )}
                  {(survey && getSurveyId(survey)) && (
                    <button 
                      onClick={handleDeleteResponses} 
                      className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2.5 px-5 text-sm font-medium rounded-lg transition-colors shadow-sm"
                    >
                      Usuń odpowiedzi
                    </button>
                  )}
                </>
              )}
              {isArchived && (
                <button 
                  onClick={handleUnarchive} 
                  className="bg-gray-900 hover:bg-gray-800 text-white py-2.5 px-5 text-sm font-medium rounded-lg transition-colors shadow-sm"
                >
                  Przywróć ankietę
                </button>
              )}
              <button 
                onClick={async () => {
                  try {
                    if (!getSurveyId(survey)) {
                      const res = await saveSurvey(survey);
                      const sid = getSurveyId(res);
                      if (sid) setSurvey(prev => ({ ...prev, id: sid, _id: sid }));
                    }
                    const sid = getSurveyId(survey) || getSurveyId(await saveSurvey(survey));
                    window.open(`${window.location.origin}/survey/${sid}?preview=1`, '_blank');
                  } catch (err) { 
                    console.error(err); 
                    setNotification({ message: 'Błąd podglądu', type: 'error' });
                  }
                }} 
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2.5 px-5 text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                Podgląd
              </button>
              <button 
                onClick={handleDelete} 
                className="bg-white border border-red-300 hover:bg-red-50 text-red-700 py-2.5 px-5 text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                Usuń ankietę
              </button>
            </div>
          </div>
        </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="questions">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
              {survey.questions.map((q, index) => (
                <Draggable key={q.id} draggableId={q.id} index={index} isDragDisabled={isArchived}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.draggableProps} className={`bg-white border border-gray-200 rounded-lg shadow-sm ${snapshot.isDragging ? 'opacity-50 shadow-md' : 'hover:shadow-md'} transition-all`}>
                      <div className="p-5">
                        <div className="flex items-start gap-4 mb-4">
                          {!isArchived && (
                            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 flex items-center justify-center w-8 h-8 mt-1 rounded hover:bg-gray-100 transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-end gap-3 mb-4">
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Pytanie {index + 1}</label>
                                <input 
                                  type="text" 
                                  value={q.title || ''} 
                                  onChange={e => updateQuestion(index, 'title', e.target.value)} 
                                  placeholder="Wpisz treść pytania..." 
                                  disabled={isArchived}
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed" 
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Typ</label>
                                <select 
                                  value={q.type} 
                                  onChange={e => updateQuestion(index, 'type', e.target.value)} 
                                  disabled={isArchived}
                                  className="p-3 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all bg-white font-medium disabled:bg-gray-100 disabled:cursor-not-allowed"
                                  style={{minWidth: 180}}
                                >
                                  <option value="text">Odpowiedź krótka</option>
                                  <option value="textarea">Tekst długi</option>
                                  <option value="radio">Pojedynczy wybór</option>
                                  <option value="checkbox">Wielokrotny wybór</option>
                                  <option value="scale">Skala</option>
                                  <option value="select">Lista rozwijana</option>
                                </select>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg w-fit">
                              <input 
                                type="checkbox" 
                                checked={q.required} 
                                onChange={e => updateQuestion(index, 'required', e.target.checked)}
                                disabled={isArchived}
                                className="w-4 h-4 text-gray-900 focus:ring-gray-900 disabled:cursor-not-allowed"
                              />
                              <label className="text-sm text-gray-700 font-medium">Pytanie obowiązkowe</label>
                            </div>
                          </div>
                        </div>

                          {(q.type === 'radio' || q.type === 'checkbox' || q.type === 'select') && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="text-sm font-medium text-gray-700 mb-3">Opcje odpowiedzi</div>
                          <div className="space-y-2">
                            {(q.options || []).map((opt, oi) => (
                              <div key={oi} className="flex gap-3 items-center p-2 bg-gray-50 rounded-lg">
                                <span className="text-gray-500 text-sm font-medium w-6">{oi + 1}.</span>
                                <input 
                                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all bg-white disabled:bg-gray-100 disabled:cursor-not-allowed" 
                                  value={opt.text || opt} 
                                  onChange={e => {
                                    const qs = [...survey.questions];
                                    qs[index].options = qs[index].options || [];
                                    if (typeof qs[index].options[oi] === 'object') qs[index].options[oi].text = e.target.value;
                                    else qs[index].options[oi] = e.target.value;
                                    setSurvey({ ...survey, questions: qs });
                                  }}
                                  disabled={isArchived}
                                  placeholder={`Opcja ${oi + 1}...`}
                                />
                                <button 
                                  className="text-sm text-red-600 hover:text-red-700 font-medium px-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                                  onClick={() => {
                                    const qs = [...survey.questions];
                                    qs[index].options = qs[index].options || [];
                                    qs[index].options.splice(oi,1);
                                    setSurvey({ ...survey, questions: qs });
                                  }}
                                  disabled={isArchived}
                                >
                                  Usuń
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3">
                            <button 
                              className="text-sm text-gray-700 hover:text-gray-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed" 
                              onClick={() => {
                                const qs = [...survey.questions];
                                qs[index].options = qs[index].options || [];
                                qs[index].options.push('');
                                setSurvey({ ...survey, questions: qs });
                              }}
                              disabled={isArchived}
                            >
                              + Dodaj opcję
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Obraz pytania</label>
                        <div className="flex gap-3 items-center">
                          {q.imageUrl ? (
                            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                              <img 
                                src={q.imageUrl} 
                                alt="preview" 
                                className="max-w-[200px] max-h-[120px] object-cover rounded-lg border border-gray-300"
                              />
                              <button 
                                className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed" 
                                onClick={() => {
                                  const qs = [...survey.questions]; 
                                  qs[index].imageUrl = undefined; 
                                  setSurvey({ ...survey, questions: qs });
                                }}
                                disabled={isArchived}
                              >
                                Usuń obraz
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button 
                                className="text-sm text-gray-700 hover:text-gray-900 font-medium px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                                onClick={() => {
                                  const url = prompt('Wklej adres obrazu (URL):');
                                  if (url) {
                                    const qs = [...survey.questions]; 
                                    qs[index].imageUrl = url; 
                                    setSurvey({ ...survey, questions: qs });
                                  }
                                }}
                                disabled={isArchived}
                              >
                                Dodaj przez link
                              </button>
                              <button 
                                className="text-sm text-gray-700 hover:text-gray-900 font-medium px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                                onClick={() => handleUploadForQuestion(index)}
                                disabled={isArchived}
                              >
                                Wybierz z komputera
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                        {q.type === 'scale' && (
                          <div className="flex gap-4 items-center p-3 bg-gray-50 rounded-lg">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                              Min: 
                              <input 
                                type="number" 
                                value={(q.scale && q.scale.min) || 1} 
                                onChange={e => {
                                  const qs = [...survey.questions];
                                  qs[index].scale = { ...(qs[index].scale||{}), min: Number(e.target.value) };
                                  setSurvey({ ...survey, questions: qs });
                                }} 
                                disabled={isArchived}
                                className="w-20 p-2 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed" 
                              />
                            </label>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                              Max: 
                              <input 
                                type="number" 
                                value={(q.scale && q.scale.max) || 5} 
                                onChange={e => {
                                  const qs = [...survey.questions];
                                  qs[index].scale = { ...(qs[index].scale||{}), max: Number(e.target.value) };
                                  setSurvey({ ...survey, questions: qs });
                                }} 
                                disabled={isArchived}
                                className="w-20 p-2 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed" 
                              />
                            </label>
                            <span className="text-sm text-gray-600">
                              (Skala: {(q.scale && q.scale.min) || 1} - {(q.scale && q.scale.max) || 5})
                            </span>
                          </div>
                        )}

                        <div>
                          <button 
                            className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1.5 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                            onClick={() => removeQuestion(index)}
                            disabled={isArchived}
                          >
                            Usuń pytanie
                          </button>
                        </div>
                      </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

        <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={onFileSelected} />

        {!isArchived && (
          <>
            <div className="mt-6">
              <button 
                onClick={addQuestion} 
                className="bg-gray-900 hover:bg-gray-800 text-white py-3 px-6 text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                + Dodaj nowe pytanie
              </button>
            </div>

            {/* Dolny pasek akcji – żeby nie trzeba było scrollować do góry */}
            <div className="mt-8 pt-5 border-t border-gray-200 flex flex-wrap gap-2 justify-end items-center">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={save}
                  className="bg-gray-900 hover:bg-gray-800 text-white py-2.5 px-5 text-sm font-medium rounded-lg transition-colors shadow-sm"
                >
                  Zapisz
                </button>
                <button
                  onClick={async () => {
                    try {
                      if (!getSurveyId(survey)) {
                        const res = await saveSurvey(survey);
                        const sid = getSurveyId(res);
                        if (sid) setSurvey(prev => ({ ...prev, id: sid, _id: sid }));
                      }
                      const sid = getSurveyId(survey) || getSurveyId(await saveSurvey(survey));
                      window.open(`${window.location.origin}/survey/${sid}?preview=1`, '_blank');
                    } catch (err) {
                      console.error(err);
                      setNotification({ message: 'Błąd podglądu', type: 'error' });
                    }
                  }}
                  className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2.5 px-5 text-sm font-medium rounded-lg transition-colors shadow-sm"
                >
                  Podgląd
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
    </>
  );
}