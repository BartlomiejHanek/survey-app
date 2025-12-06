import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/apiClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await login(email, password, remember);
      const user = res && res.user;
      if (user && (user.role === 'admin' || user.role === 'super_admin')) navigate('/admin');
      else navigate('/surveys');
    } catch (err) {
      console.error(err);
      alert('Błąd logowania');
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-bold mb-2">Logowanie</h2>
      <input className="w-full p-2 border rounded mb-2" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input className="w-full p-2 border rounded mb-2" placeholder="Hasło" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <label className="flex items-center gap-2 mb-2"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /> Zapamiętaj mnie</label>
      <div className="flex gap-2">
        <button className="bg-blue-600 text-white py-2 px-4 rounded" onClick={handleLogin}>Zaloguj</button>
      </div>
    </div>
  );
}
