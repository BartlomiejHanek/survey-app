import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { fetchSurveyById, saveSurvey, publishSurvey, closeSurvey, deleteSurvey, createInvite, archiveSurvey, deleteSurveyResponses } from '../api/apiClient';
import { useRef } from 'react';
import { isLoggedIn } from '../auth';
import { useNavigate } from 'react-router-dom';
import { getSurveyId } from '../utils/surveys';

export default function SurveyEditor() {
  const { id } = useParams();
  const [survey, setSurvey] = useState({ title: '', description: '', status: 'draft', questions: [] });
  const [lastInvite, setLastInvite] = useState(null);

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
      alert('Ankieta zapisana!');
    } catch (err) {
      console.error(err);
      alert('Błąd zapisu ankiety');
    }
  };

  const handlePublish = async () => {
    const sid = getSurveyId(survey);
    if (!sid) return alert('Zapisz najpierw ankietę przed publikacją');
    try {
      const res = await publishSurvey(sid);
      const returned = res?.survey || res || {};
      const finalId = getSurveyId(returned) || sid;
      setSurvey(prev => ({ ...prev, status: 'published', id: finalId, _id: finalId }));
      const link = `${window.location.origin}/survey/${finalId}`;
      try { await navigator.clipboard.writeText(link); } catch (e) {}
      alert(`Ankieta opublikowana. Link skopiowany: ${link}`);
    } catch (err) { console.error(err); alert('Błąd publikacji'); }
  };

  const handleClose = async () => {
    const sid = getSurveyId(survey);
    if (!sid) return;
    try {
      await closeSurvey(sid);
      setSurvey(prev => ({ ...prev, status: 'closed' }));
      alert('Ankieta zamknięta');
    } catch (err) { console.error(err); alert('Błąd zamknięcia'); }
  };

  const handleArchive = async () => {
    const sid = getSurveyId(survey);
    if (!sid) return;
    if (!confirm('Archiwizować ankietę?')) return;
    try {
      await archiveSurvey(sid);
      setSurvey(prev => ({ ...prev, status: 'archived' }));
      alert('Ankieta zarchiwizowana');
    } catch (err) { console.error(err); alert('Błąd archiwizacji'); }
  };

  const handleDeleteResponses = async () => {
    const sid = getSurveyId(survey);
    if (!sid) return;
    if (!confirm('Usunąć wszystkie odpowiedzi tej ankiety?')) return;
    try {
      await deleteSurveyResponses(sid);
      alert('Wszystkie odpowiedzi zostały usunięte');
    } catch (err) { console.error(err); alert('Błąd usuwania odpowiedzi'); }
  };

  const handleDelete = async () => {
    const sid = getSurveyId(survey);
    if (!sid) return navigate('/admin');
    if (!confirm('Na pewno usunąć ankietę?')) return;
    try {
      await deleteSurvey(sid);
      navigate('/admin');
    } catch (err) { console.error(err); alert('Błąd usuwania'); }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white p-4 rounded shadow mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex-1">
          <input type="text" value={survey.title || ''} onChange={e => setSurvey({...survey, title: e.target.value})} placeholder="Tytuł ankiety" className="w-full text-xl font-semibold p-2 border rounded" style={{width: '100%'}} />
          <input type="text" value={survey.description || ''} onChange={e => setSurvey({...survey, description: e.target.value})} placeholder="Krótki opis ankiety" className="w-full mt-2 p-2 border rounded text-sm text-gray-600" style={{width: '100%'}} />
          <label className="flex items-center gap-2 mt-2 text-sm"><input type="checkbox" checked={!!survey.singleResponse} onChange={e => setSurvey({...survey, singleResponse: !!e.target.checked})} /> Tylko jedno wypełnienie (wymaga tokena)</label>
          <div className="mt-2 flex gap-2 items-center">
            <label className="text-sm">Aktywna od: <input type="datetime-local" value={formatLocalDatetime(survey.validFrom)} onChange={e => setSurvey({...survey, validFrom: e.target.value ? parseLocalDatetimeToISO(e.target.value) : null})} className="ml-2 p-1 border rounded" /></label>
              <label className="text-sm">Ważna do: <input type="datetime-local" value={formatLocalDatetime(survey.validUntil)} onChange={e => setSurvey({...survey, validUntil: e.target.value ? parseLocalDatetimeToISO(e.target.value) : null})} className="ml-2 p-1 border rounded" /></label>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button onClick={save} className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded">Zapisz</button>
          <button onClick={async () => {
              try {
                if (!getSurveyId(survey)) {
                  const res = await saveSurvey(survey);
                  const sid = getSurveyId(res);
                  if (sid) setSurvey(prev => ({ ...prev, id: sid, _id: sid }));
                }
                const sid = getSurveyId(survey) || getSurveyId(await saveSurvey(survey));
                window.open(`${window.location.origin}/survey/${sid}?preview=1`, '_blank');
              } catch (err) { console.error(err); alert('Błąd podglądu'); }
          }} className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded">Podgląd</button>
          {survey && (survey.status !== 'published') && (
            <button onClick={handlePublish} className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700">Publikuj</button>
          )}
          {survey && (survey.status === 'published') && (
            <button onClick={handleClose} className="bg-white border border-gray-300 text-gray-800 px-3 py-1 rounded">Zamknij</button>
          )}
          {(survey && getSurveyId(survey)) && (survey.status !== 'archived') && (
            <button onClick={handleArchive} className="bg-white border border-gray-300 text-gray-800 px-3 py-1 rounded">Archiwizuj</button>
          )}
          {(survey && getSurveyId(survey)) && (
            <button onClick={handleDeleteResponses} className="bg-white border border-red-400 text-red-600 px-3 py-1 rounded">Usuń odpowiedzi</button>
          )}
          <button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded">Usuń</button>
          <button onClick={async () => {
            const sid = getSurveyId(survey);
            if (!sid) return alert('Zapisz najpierw ankietę');
            try {
              const res = await createInvite(sid, 1, null);
              const token = res && res.invite && res.invite.token;
              const link = `${window.location.origin}/survey/${sid}?t=${token}`;
              try { await navigator.clipboard.writeText(link); } catch (e) {}
              setLastInvite({ token, link });
              alert(`Utworzono zaproszenie. Link skopiowany: ${link}`);
            } catch (err) { console.error(err); alert('Błąd tworzenia zaproszenia'); }
          }} className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded">Utwórz zaproszenie</button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="questions">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
              {survey.questions.map((q, index) => (
                <Draggable key={q.id} draggableId={q.id} index={index}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.draggableProps} className={`bg-white p-4 rounded shadow ${snapshot.isDragging ? 'ring-2 ring-blue-300' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:items-center gap-2">
                            <div {...provided.dragHandleProps} className="cursor-grab text-gray-500" style={{minWidth: 28, textAlign: 'center'}}>☰</div>
                            <input type="text" value={q.title || ''} onChange={e => updateQuestion(index, 'title', e.target.value)} placeholder="Tytuł pytania" className="p-2 border rounded flex-1 min-w-0" />
                            <select value={q.type} onChange={e => updateQuestion(index, 'type', e.target.value)} className="ml-0 md:ml-2 p-2 border rounded text-sm" style={{minWidth: 140}}>
                              <option value="text">Odpowiedź krótka</option>
                              <option value="textarea">Tekst długi</option>
                              <option value="radio">Pojedynczy wybór</option>
                              <option value="checkbox">Wielokrotny wybór</option>
                              <option value="scale">Skala</option>
                              <option value="select">Lista rozwijana</option>
                            </select>
                          </div>
                          <label className="flex items-center gap-2 mt-2"><input type="checkbox" checked={q.required} onChange={e => updateQuestion(index, 'required', e.target.checked)} /> Obowiązkowe</label>
                        </div>
                      </div>

                          {(q.type === 'radio' || q.type === 'checkbox' || q.type === 'select') && (
                        <div className="mt-3">
                          <div className="font-semibold mb-2">Opcje</div>
                          <div className="space-y-2">
                            {(q.options || []).map((opt, oi) => (
                              <div key={oi} className="flex gap-2 items-center">
                                <input className="border p-2 rounded flex-1" style={{minWidth:0, width: '100%'}} value={opt.text || opt} onChange={e => {
                                  const qs = [...survey.questions];
                                  qs[index].options = qs[index].options || [];
                                  if (typeof qs[index].options[oi] === 'object') qs[index].options[oi].text = e.target.value;
                                  else qs[index].options[oi] = e.target.value;
                                  setSurvey({ ...survey, questions: qs });
                                }}/>
                                <button className="text-sm text-red-600" onClick={() => {
                                  const qs = [...survey.questions];
                                  qs[index].options = qs[index].options || [];
                                  qs[index].options.splice(oi,1);
                                  setSurvey({ ...survey, questions: qs });
                                }}>Usuń</button>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2">
                            <button className="bg-gray-100 py-1 px-3 rounded text-sm" onClick={() => {
                              const qs = [...survey.questions];
                              qs[index].options = qs[index].options || [];
                              qs[index].options.push('');
                              setSurvey({ ...survey, questions: qs });
                            }}>Dodaj opcję</button>
                          </div>
                        </div>
                      )}

                      <div className="mt-3">
                        <label className="block font-semibold mb-1">Obraz (URL)</label>
                          <div className="flex gap-2 items-center">
                            
                            {q.imageUrl ? (
                              <div className="flex items-center gap-2">
                                <img src={q.imageUrl} alt="preview" style={{maxWidth:200, maxHeight:120, objectFit:'cover', borderRadius:6}} />
                                <button className="text-sm text-red-600" onClick={() => {
                                  const qs = [...survey.questions]; qs[index].imageUrl = undefined; setSurvey({ ...survey, questions: qs });
                                }}>Usuń obraz</button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button className="bg-gray-100 text-gray-800 border py-1 px-3 rounded text-sm" onClick={() => {
                                  const url = prompt('Wklej adres obrazu (URL):');
                                  if (url) {
                                    const qs = [...survey.questions]; qs[index].imageUrl = url; setSurvey({ ...survey, questions: qs });
                                  }
                                }}>Dodaj przez link</button>
                                <button className="bg-gray-100 text-gray-800 border py-1 px-3 rounded text-sm" onClick={() => handleUploadForQuestion(index)}>Wybierz z komputera</button>
                              </div>
                            )}
                          </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        {q.type === 'scale' && (
                        <div className="mt-3 flex gap-4 items-center">
                          <label className="flex items-center gap-2">Min: <input type="number" value={(q.scale && q.scale.min) || 1} onChange={e => {
                            const qs = [...survey.questions];
                            qs[index].scale = { ...(qs[index].scale||{}), min: Number(e.target.value) };
                            setSurvey({ ...survey, questions: qs });
                          }} className="p-1 border rounded w-20" /></label>
                          <label className="flex items-center gap-2">Max: <input type="number" value={(q.scale && q.scale.max) || 5} onChange={e => {
                            const qs = [...survey.questions];
                            qs[index].scale = { ...(qs[index].scale||{}), max: Number(e.target.value) };
                            setSurvey({ ...survey, questions: qs });
                          }} className="p-1 border rounded w-20" /></label>
                        </div>
                        )}

                        <div>
                          <button className="text-sm text-red-600" onClick={() => removeQuestion(index)}>Usuń pytanie</button>
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

      <div className="mt-4 flex gap-2">
          <button onClick={addQuestion} className="bg-gray-100 text-gray-800 border py-1 px-3 rounded text-sm">Dodaj pytanie</button>
      </div>
    </div>
  );
}