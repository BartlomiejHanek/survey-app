// frontend/src/pages/AdminSurveys.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function AdminSurveys(){
  const [list,setList] = useState([]);
  const [title,setTitle] = useState('');
  useEffect(()=>{ refresh(); },[]);
  const refresh = ()=> axios.get(`${import.meta.env.VITE_API}/api/surveys`).then(r=>setList(r.data));
  const create = async ()=>{
    const r = await axios.post(`${import.meta.env.VITE_API}/api/surveys`, { title, description: '' });
    setTitle(''); refresh();
    // redirect to editor: e.g. /admin/edit/:id
  };
  return (
    <div>
      <h2>Twoje ankiety</h2>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Nowy tytuł"/>
      <button onClick={create}>Utwórz</button>
      <ul>
        {list.map(s=>(
          <li key={s._id}>
            <Link to={`/admin/edit/${s._id}`}>{s.title || '(brak tytułu)'}</Link> — {s.status} — <Link to={`/survey/${s._id}`}>podgląd (public)</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
