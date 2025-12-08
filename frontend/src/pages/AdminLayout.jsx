import React, { useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { isLoggedIn, getUser } from '../auth';
import { logout } from '../api/apiClient';

export default function AdminLayout() {
  const nav = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    if (!isLoggedIn()) {
      nav('/login');
    }
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-semibold text-sm">A</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Panel Admin</h1>
              <p className="text-xs text-gray-500">System Ankiet</p>
            </div>
          </Link>
        </div>
        
        <nav className="flex-1 p-3 space-y-1">
          <Link 
            to="/admin" 
            className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all ${
              isActive('/admin') 
                ? 'bg-gray-100 text-gray-900 font-medium' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Lista ankiet</span>
          </Link>
          <Link 
            to="/admin/edit/new" 
            className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all ${
              location.pathname.includes('/admin/edit') 
                ? 'bg-gray-100 text-gray-900 font-medium' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Nowa ankieta</span>
          </Link>
        </nav>

        <div className="p-3 border-t border-gray-200">
          <div className="px-3 py-2 mb-2">
            <div className="text-xs text-gray-500 truncate">{getUser()?.email || 'Użytkownik'}</div>
          </div>
          <button 
            onClick={() => { logout(); window.location.href = '/login'; }} 
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Wyloguj</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-14 bg-white border-b border-gray-200 flex items-center px-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {location.pathname === '/admin' ? 'Lista ankiet' : 
             location.pathname.includes('/edit') ? 'Edytor ankiety' :
             location.pathname.includes('/stats') ? 'Statystyki' : 'Panel'}
          </h2>
        </div>
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}