// frontend/src/pages/SurveyForm.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

export default function SurveyForm() {
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState('');

  useEffect(()=>{
    axios.get(`${import.meta.env.VITE_API}/api/surveys/${id}/public`)
      .then(r=>setSurvey(r.data))
      .catch(e=>setStatus(e.response?.data?.error || 'Błąd ładowania ankiety'));
  },[id]);

  if(status) return <div>{status}</div>;
  if(!survey) return <div>Ładowanie...</div>;

  const handleChange = (q, value) => {
    setAnswers(prev => ({ ...prev, [q]: value }));
  };

  const validate = () => {
    for(const q of survey.questions) {
      if(q.required && (answers[q._id] === undefined || answers[q._id] === '' || (Array.isArray(answers[q._id]) && answers[q._id].length===0))) {
        return `Pole wymagane: ${q.text}`;
      }
    }
    return null;
  };

  const submit = async () => {
    const err = validate();
    if(err){alert(err); return;}
    const payload = {
      answers: Object.entries(answers).map(([qid, val]) => ({ questionId: qid, value: val }))
    };
    try{
      await axios.post(`${import.meta.env.VITE_API}/api/surveys/${id}/response`, payload);
      setStatus('Dziękujemy — odpowiedź zapisana.');
    }catch(e){
      setStatus(e.response?.data?.error || 'Błąd wysyłania');
    }
  };

  return (
    <div>
      <h1>{survey.title}</h1>
      <p>{survey.description}</p>

      {survey.questions.sort((a,b)=>a.order-b.order).map(q => (
        <div key={q._id} style={{ marginBottom: 16 }}>
          <label><strong>{q.text}</strong> {q.required && '*'}</label>
          <div>
            {q.type === 'text' && <input value={answers[q._id]||''} onChange={e=>handleChange(q._id, e.target.value)} />}
            {q.type === 'textarea' && <textarea value={answers[q._id]||''} onChange={e=>handleChange(q._id, e.target.value)} />}
            {q.type === 'radio' && q.options.map((opt, i)=>(
              <div key={i}><label><input type="radio" name={q._id} checked={answers[q._id]===opt.text} onChange={()=>handleChange(q._id,opt.text)} /> {opt.text}</label></div>
            ))}
            {q.type === 'checkbox' && q.options.map((opt,i)=>(
              <div key={i}><label><input type="checkbox" checked={Array.isArray(answers[q._id]) && answers[q._id].includes(opt.text)} onChange={(e)=>{
                const prev = answers[q._id] || [];
                if(e.target.checked) handleChange(q._id, [...prev, opt.text]); else handleChange(q._id, prev.filter(x=>x!==opt.text));
              }} /> {opt.text}</label></div>
            ))}
            {q.type === 'scale' && <>
              <div>{Array.from({length: (q.scale?.max - q.scale?.min + 1) || 5}).map((_,i)=>{
                const val = (q.scale?.min || 1) + i;
                return <label key={i} style={{marginRight:8}}><input type="radio" name={q._id} checked={answers[q._id]===val} onChange={()=>handleChange(q._id,val)} /> {val}</label>;
              })}</div>
            </>}
            {q.type === 'select' && <select value={answers[q._id]||''} onChange={e=>handleChange(q._id,e.target.value)}>
              <option value="">-- wybierz --</option>
              {q.options.map((opt,i)=><option key={i} value={opt.text}>{opt.text}</option>)}
            </select>}
          </div>
        </div>
      ))}

      <button onClick={submit}>Wyślij</button>
      {status && <div style={{marginTop:16}}>{status}</div>}
    </div>
  );
}
