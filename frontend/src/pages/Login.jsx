import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/apiClient';
import Notification from '../components/Notification';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await login(email, password, remember);
      const user = res && res.user;
      if (user) navigate('/admin');
      else navigate('/surveys');
    } catch (err) {
      console.error(err);
      setNotification({ message: 'Błąd logowania', type: 'error' });
    }
  };

  return (
    <>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Logowanie</h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input 
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all" 
                placeholder="Wpisz email" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                type="email"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hasło</label>
              <input 
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all" 
                placeholder="Wpisz hasło" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={remember} 
                onChange={e => setRemember(e.target.checked)}
                className="w-4 h-4 text-gray-900 focus:ring-gray-900"
              />
              <label className="text-sm text-gray-700">Zapamiętaj mnie</label>
            </div>
            
            <button 
              className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 px-4 rounded-lg font-medium transition-colors shadow-sm" 
              onClick={handleLogin}
            >
              Zaloguj
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
