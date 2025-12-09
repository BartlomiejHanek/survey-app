import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchSurveys, publishSurvey, closeSurvey, deleteSurvey } from '../api/apiClient';
import { getSurveyId, statusLabel } from '../utils/surveys';
import Notification from '../components/Notification';

export default function SurveyList() {
  const [surveys, setSurveys] = useState([]);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchSurveys();
        setSurveys(data);
      } catch (err) {
        console.error('Błąd pobierania ankiet', err);
        setSurveys([]);
      }
    }
    load();
  }, []);

  const updateSurvey = (id, updater) =>
    setSurveys((prev) =>
      prev.map((item) => (getSurveyId(item) === id ? { ...item, ...updater(item) } : item))
    );

  const removeSurvey = (id) =>
    setSurveys((prev) => prev.filter((item) => getSurveyId(item) !== id));

  const handlePublish = async (survey) => {
    try {
      const result = await publishSurvey(getSurveyId(survey));
      const returned = result?.survey || result || {};
      const targetId = getSurveyId(survey);
      const savedId = getSurveyId(returned) || targetId;
      updateSurvey(targetId, () => ({ status: 'published', id: savedId, _id: savedId }));
      const link = `${window.location.origin}/survey/${savedId}`;
      setNotification({ message: `Ankieta opublikowana. Link: ${link}`, type: 'success', copyText: link });
    } catch (err) {
      console.error(err);
      setNotification({ message: 'Błąd publikacji', type: 'error' });
    }
  };

  const handleClose = async (survey) => {
    try {
      await closeSurvey(getSurveyId(survey));
      updateSurvey(getSurveyId(survey), () => ({ status: 'closed' }));
      setNotification({ message: 'Ankieta zamknięta', type: 'success' });
    } catch (err) {
      console.error(err);
      setNotification({ message: 'Błąd zamknięcia', type: 'error' });
    }
  };

  const handleDelete = async (survey) => {
    if (!confirm('Na pewno usunąć ankietę?')) return;
    try {
      await deleteSurvey(getSurveyId(survey));
      removeSurvey(getSurveyId(survey));
    } catch (err) {
      console.error(err);
      setNotification({ message: 'Błąd usuwania', type: 'error' });
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'published': return 'bg-green-100 text-green-700 border-green-200';
      case 'draft': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'closed': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'archived': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

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
      <div className="max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">Ankiety</h2>
          <p className="text-sm text-gray-500">Zarządzaj swoimi ankietami</p>
        </div>
        <Link to="/admin/edit/new">
          <button className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium py-2.5 px-5 rounded-lg transition-colors shadow-sm">
            Nowa ankieta
          </button>
        </Link>
      </div>

      {surveys.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">Brak ankiet</p>
          <Link to="/admin/edit/new">
            <button className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium py-2 px-5 rounded-lg transition-colors">
              Utwórz ankietę
            </button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {surveys.filter(s => s.status !== 'archived').map(s => (
            <div 
              key={getSurveyId(s)} 
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
            >
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{s.title || 'Bez tytułu'}</h3>
                {s.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{s.description}</p>
                )}
                <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-md border ${getStatusColor(s.status)}`}>
                  {statusLabel(s.status)}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                <Link 
                  to={`/admin/edit/${getSurveyId(s)}`}
                  className="text-sm text-gray-700 hover:text-gray-900 font-medium"
                >
                  Edytuj
                </Link>
                <span className="text-gray-300">•</span>
                <Link 
                  to={`/admin/stats/${getSurveyId(s)}`}
                  className="text-sm text-gray-700 hover:text-gray-900 font-medium"
                >
                  Statystyki
                </Link>
                {s.status !== 'published' && (
                  <>
                    <span className="text-gray-300">•</span>
                    <button 
                      className="text-sm text-gray-700 hover:text-gray-900 font-medium"
                      onClick={() => handlePublish(s)}
                    >
                      Publikuj
                    </button>
                  </>
                )}
                {s.status === 'published' && (
                  <>
                    <span className="text-gray-300">•</span>
                    <button 
                      className="text-sm text-gray-700 hover:text-gray-900 font-medium"
                      onClick={() => handleClose(s)}
                    >
                      Zamknij
                    </button>
                    <span className="text-gray-300">•</span>
                    <button
                      className="text-sm text-gray-700 hover:text-gray-900 font-medium"
                      onClick={() => {
                        const link = `${window.location.origin}/survey/${getSurveyId(s)}`;
                        setNotification({
                          message: `Link do ankiety: ${link}`,
                          type: 'success',
                          copyText: link
                        });
                      }}
                    >
                      Link
                    </button>
                  </>
                )}
                <span className="text-gray-300">•</span>
                <button 
                  className="text-sm text-gray-700 hover:text-gray-900 font-medium"
                  onClick={() => window.open(`${window.location.origin}/survey/${getSurveyId(s)}?preview=1`, '_blank')}
                >
                  Podgląd
                </button>
                <span className="text-gray-300">•</span>
                <button 
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                  onClick={() => handleDelete(s)}
                >
                  Usuń
                </button>
              </div>
            </div>
          ))}
          </div>
          {surveys.filter(s => s.status === 'archived').length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Zarchiwizowane ankiety</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {surveys.filter(s => s.status === 'archived').map(s => (
                  <div 
                    key={getSurveyId(s)} 
                    className="bg-white border border-gray-200 rounded-lg p-5 opacity-75"
                  >
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{s.title || 'Bez tytułu'}</h3>
                      {s.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{s.description}</p>
                      )}
                      <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-md border ${getStatusColor(s.status)}`}>
                        {statusLabel(s.status)}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                      <Link 
                        to={`/admin/stats/${getSurveyId(s)}`}
                        className="text-sm text-gray-700 hover:text-gray-900 font-medium"
                      >
                        Statystyki
                      </Link>
                      <span className="text-gray-300">•</span>
                      <Link 
                        to={`/admin/edit/${getSurveyId(s)}`}
                        className="text-sm text-gray-700 hover:text-gray-900 font-medium"
                      >
                        Podgląd
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
    </>
  );
}
