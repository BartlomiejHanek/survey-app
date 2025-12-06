import React, { useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { isAdmin } from '../auth';
import { logout } from '../api/apiClient';

export default function AdminLayout() {
  const nav = useNavigate();
  useEffect(() => {
    if (!isAdmin()) {
      // not admin -> redirect to public surveys or login
      nav('/login');
    }
  }, []);
  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-white border-r">
        <div className="p-4 text-xl font-bold"><Link to="/admin">Panel Administratora</Link></div>
        <nav className="flex flex-col p-2">
          <Link to="/admin" className="p-2 rounded hover:bg-gray-100">Lista ankiet</Link>
          <Link to="/surveys?preview=1" className="p-2 rounded hover:bg-gray-100">Przegląd ankiet</Link>
          {isAdmin() && <Link to="/admin/edit/new" className="p-2 rounded hover:bg-gray-100">Nowa ankieta</Link>}
        </nav>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="h-12 bg-white shadow flex items-center px-4 justify-between">
          <span className="font-semibold">Panel Administratora</span>
          <div>
            <button onClick={() => { logout(); window.location.href = '/login'; }} className="text-sm text-red-600">Wyloguj</button>
          </div>
        </div>
        <main className="p-4 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}