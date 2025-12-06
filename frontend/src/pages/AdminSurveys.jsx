// frontend/src/pages/AdminSurveys.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const STATUS_MAP = {
  draft: 'Robocza',
  published: 'Opublikowana',
  closed: 'Zamknięta'
};

export default function AdminSurveys(){
  const [list,setList] = useState([]);
  const [title,setTitle] = useState('');
  useEffect(()=>{ refresh(); },[]);
  const refresh = ()=> axios.get(`${import.meta.env.VITE_API}/api/surveys`).then(r=>setList(r.data));
  const create = async ()=>{
    const r = await axios.post(`${import.meta.env.VITE_API}/api/surveys`, { title, description: '' });
    setTitle(''); refresh();
  };

  const copyLink = async (id) => {
    const link = `${window.location.origin}/survey/${id}`;
    try { await navigator.clipboard.writeText(link); alert('Link skopiowany'); }
    catch (e) { prompt('Skopiuj ręcznie link:', link); }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-2xl font-bold">Lista ankiet</h2>
        <div className="ml-auto flex items-center gap-2">
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Nowy tytuł" className="p-2 border rounded"/>
          <button onClick={create} className="bg-green-600 text-white py-2 px-3 rounded">Utwórz</button>
        </div>
      </div>

      <ul className="space-y-3">
        {list.map(s=>(
          <li key={s._id || s.id} className="bg-white p-3 rounded shadow flex items-center gap-3">
            <div className="flex-1">
              <Link to={`/admin/edit/${s._id || s.id}`} className="font-semibold text-lg">{s.title || '(brak tytułu)'}</Link>
              <div className="text-sm text-gray-600">{s.description}</div>
            </div>
              <div className="text-sm text-gray-700">{STATUS_MAP[(s.status || '').toLowerCase()] || s.status}</div>
            <div className="flex gap-2">
              <button className="bg-white border border-gray-300 text-gray-800 px-3 py-1 rounded" onClick={() => window.open(`${window.location.origin}/survey/${s._id || s.id}?preview=1`)}>Podgląd</button>
              <button className="bg-white border border-gray-300 text-gray-800 px-3 py-1 rounded" onClick={() => copyLink(s._id || s.id)}>Kopiuj link</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
