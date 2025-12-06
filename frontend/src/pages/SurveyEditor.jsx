import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function SurveyEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const API = import.meta.env.VITE_API || '';

  useEffect(() => {
    async function load() {
      try {
        const r = await axios.get(`${API}/api/surveys/${id}`);
        // Ensure questions have _id and order
        const s = r.data;
        s.questions = (s.questions || []).map((q, i) => ({ ...q, order: q.order ?? i }));
        setSurvey(s);
      } catch (e) {
        alert('Błąd ładowania ankiety');
      } finally { setLoading(false); }
    }
    load();
  }, [id]);

  const addQuestion = (type = 'text') => {
    const q = {
      _id: 'new-' + Date.now(),
      type,
      text: 'Nowe pytanie',
      required: false,
      options: type === 'radio' || type === 'checkbox' || type === 'select' ? [{ text: 'Opcja 1' }] : [],
      scale: type === 'scale' ? { min: 1, max: 5 } : undefined,
      order: (survey.questions?.length || 0)
    };
    setSurvey(prev => ({ ...prev, questions: [...(prev.questions||[]), q] }));
  };

  const updateQuestion = (qid, patch) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.map(q => q._id === qid ? { ...q, ...patch } : q)
    }));
  };

  const removeQuestion = (qid) => {
    if (!window.confirm('Usunąć pytanie?')) return;
    setSurvey(prev => ({ ...prev, questions: prev.questions.filter(q => q._id !== qid) }));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const src = result.source.index;
    const dest = result.destination.index;

    const items = Array.from(survey.questions);
    const [moved] = items.splice(src, 1);
    items.splice(dest, 0, moved);
    // normalize order
    const normalized = items.map((q, i) => ({ ...q, order: i }));
    setSurvey(prev => ({ ...prev, questions: normalized }));
  };

  const save = async (publish=false) => {
    setSaving(true);
    try {
      const payload = { ...survey };
      // Remove client-only temporary _id for new items (server will assign new ObjectIds)
      payload.questions = payload.questions.map(q => {
        const copy = { ...q };
        if (String(copy._id).startsWith('new-')) delete copy._id;
        return copy;
      });
      await axios.put(`${API}/api/surveys/${id}`, payload);
      if (publish) {
        await axios.post(`${API}/api/surveys/${id}/publish`, { status: 'published' });
      }
      alert('Zapisano');
      // reload
      const r = await axios.get(`${API}/api/surveys/${id}`);
      setSurvey(r.data);
    } catch (e) {
      console.error(e);
      alert('Błąd zapisu: ' + (e.response?.data?.error || e.message));
    } finally { setSaving(false); }
  };

  const exportCSV = () => {
    // triggers browser download
    const url = `${API}/api/surveys/${id}/export`;
    window.open(url, '_blank');
  };

  if (loading) return <div>Ładowanie...</div>;
  if (!survey) return <div>Nie znaleziono ankiety</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Edytor ankiety</h1>
      <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
        <input style={{ flex: 1 }} value={survey.title || ''} onChange={e=>setSurvey({...survey, title: e.target.value})} placeholder="Tytuł ankiety" />
        <button onClick={()=>addQuestion('text')}>Dodaj tekst</button>
        <button onClick={()=>addQuestion('textarea')}>Dodaj textarea</button>
        <button onClick={()=>addQuestion('radio')}>Dodaj radio</button>
        <button onClick={()=>addQuestion('checkbox')}>Dodaj checkbox</button>
        <button onClick={()=>addQuestion('select')}>Dodaj select</button>
        <button onClick={()=>addQuestion('scale')}>Dodaj scale</button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>Opis:</label>
        <textarea value={survey.description||''} onChange={e=>setSurvey({...survey, description: e.target.value})} rows={3} style={{ width: '100%' }} />
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="questions">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {survey.questions.map((q, index) => (
                <Draggable key={q._id} draggableId={String(q._id)} index={index}>
                  {(prov) => (
                    <div ref={prov.innerRef} {...prov.draggableProps} style={{ border: '1px solid #ddd', padding: 12, marginBottom:8, borderRadius:6, background:'#fff', ...prov.draggableProps.style }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <div {...prov.dragHandleProps} style={{ cursor: 'grab' }}>☰</div>
                        <div style={{ flex: 1, marginLeft: 8 }}>
                          <input value={q.text} onChange={e=>updateQuestion(q._id, { text: e.target.value })} style={{ width: '100%' }} />
                          <div style={{ marginTop:6 }}>
                            <label>Typ: </label>
                            <select value={q.type} onChange={e=>updateQuestion(q._id, { type: e.target.value, options: (e.target.value==='radio' || e.target.value==='checkbox' || e.target.value==='select') ? (q.options && q.options.length ? q.options : [{ text: 'Opcja 1' }]) : [] })}>
                              <option value="text">Krótka odpowiedź</option>
                              <option value="textarea">Dłuższa odpowiedź</option>
                              <option value="radio">Pojedynczy wybór (radio)</option>
                              <option value="checkbox">Wielokrotny wybór (checkbox)</option>
                              <option value="select">Lista rozwijana</option>
                              <option value="scale">Skala (1-5)</option>
                            </select>
                            <label style={{ marginLeft: 12 }}><input type="checkbox" checked={q.required||false} onChange={e=>updateQuestion(q._id, { required: e.target.checked })} /> Wymagane</label>
                          </div>

                          {/* options editor */}
                          {(q.type === 'radio' || q.type === 'checkbox' || q.type === 'select') && (
                            <div style={{ marginTop:8 }}>
                              <strong>Opcje:</strong>
                              {(q.options||[]).map((opt, i) => (
                                <div key={i} style={{ display:'flex', gap:8, marginTop:6 }}>
                                  <input value={opt.text} onChange={e=>{
                                    const newOpts = (q.options||[]).map((o, idx) => idx===i ? { ...o, text: e.target.value } : o);
                                    updateQuestion(q._id, { options: newOpts });
                                  }} />
                                  <button onClick={()=>{
                                    const newOpts = (q.options||[]).filter((_, idx) => idx !== i);
                                    updateQuestion(q._id, { options: newOpts });
                                  }}>Usuń</button>
                                </div>
                              ))}
                              <button style={{ marginTop:8 }} onClick={()=>{
                                updateQuestion(q._id, { options: [...(q.options||[]), { text: `Opcja ${ (q.options||[]).length + 1 }` }] });
                              }}>Dodaj opcję</button>
                            </div>
                          )}

                          {q.type === 'scale' && (
                            <div style={{ marginTop:8 }}>
                              <label>Min: <input type="number" value={q.scale?.min||1} onChange={e=>updateQuestion(q._id, { scale: {...(q.scale||{}), min: Number(e.target.value)} })} /></label>
                              <label style={{ marginLeft:8 }}>Max: <input type="number" value={q.scale?.max||5} onChange={e=>updateQuestion(q._id, { scale: {...(q.scale||{}), max: Number(e.target.value)} })} /></label>
                            </div>
                          )}

                        </div>
                        <div style={{ marginLeft: 12 }}>
                          <button onClick={()=>removeQuestion(q._id)}>Usuń</button>
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

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <button disabled={saving} onClick={()=>save(false)}>{saving ? 'Zapis...' : 'Zapisz'}</button>
        <button disabled={saving} onClick={()=>save(true)}>Zapisz i Publikuj</button>
        <button onClick={exportCSV}>Eksport CSV</button>
        <button onClick={()=>nav(-1)}>Powrót</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <small>Uwaga: po pierwszym zapisie nowe pytania otrzymają _id generowane przez serwer.</small>
      </div>
    </div>
  );
}
