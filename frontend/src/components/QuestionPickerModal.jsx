import React, { useState, useEffect } from 'react';
import { fetchSavedQuestions } from '../api/apiClient';

export default function QuestionPickerModal({ onSelect, onClose, isOpen }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    favorite: false,
    sort: 'favorite'
  });

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        loadQuestions();
      }, filters.search ? 300 : 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, filters]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await fetchSavedQuestions(filters);
      setQuestions(data || []);
    } catch (err) {
      console.error('Error loading questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleAdd = () => {
    const selectedQuestions = questions.filter(q => selectedIds.has(q._id || q.id));
    onSelect(selectedQuestions);
    setSelectedIds(new Set());
  };

  if (!isOpen) return null;

  const typeLabels = {
    text: 'Odpowiedź krótka',
    textarea: 'Tekst długi',
    radio: 'Pojedynczy wybór',
    checkbox: 'Wielokrotny wybór',
    select: 'Lista rozwijana',
    scale: 'Skala'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Wybierz pytania do dodania
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filtry */}
        <div className="mb-4 space-y-3">
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              placeholder="🔍 Wyszukaj..."
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              className="flex-1 min-w-[200px] p-2 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all"
            />
            <select
              value={filters.type}
              onChange={e => setFilters({ ...filters, type: e.target.value })}
              className="p-2 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all"
            >
              <option value="">Wszystkie typy</option>
              <option value="text">Tekstowe</option>
              <option value="radio">Pojedynczy wybór</option>
              <option value="checkbox">Wielokrotny wybór</option>
              <option value="select">Lista rozwijana</option>
              <option value="scale">Skala</option>
            </select>
            <select
              value={filters.sort}
              onChange={e => setFilters({ ...filters, sort: e.target.value })}
              className="p-2 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all"
            >
              <option value="favorite">Ulubione</option>
              <option value="newest">Najnowsze</option>
              <option value="oldest">Najstarsze</option>
              <option value="alphabetical">Alfabetycznie A-Z</option>
              <option value="alphabetical-desc">Alfabetycznie Z-A</option>
            </select>
            <button
              onClick={() => setFilters({ ...filters, favorite: !filters.favorite })}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                filters.favorite
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              ⭐ Tylko ulubione
            </button>
          </div>
        </div>

        {/* Lista pytań */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Ładowanie...</div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Brak pytań do wyświetlenia</div>
          ) : (
            questions.map((q) => {
              const qId = q._id || q.id;
              const isSelected = selectedIds.has(qId);
              return (
                <div
                  key={qId}
                  onClick={() => toggleSelect(qId)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  } ${q.isFavorite ? 'bg-yellow-50 border-yellow-200' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(qId)}
                      onClick={e => e.stopPropagation()}
                      className="mt-1 w-4 h-4 text-gray-900 focus:ring-gray-900"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {q.isFavorite && (
                          <span className="text-yellow-500">⭐</span>
                        )}
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          {typeLabels[q.type] || q.type}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {q.title}
                      </p>
                      {q.options && q.options.length > 0 && (
                        <p className="text-xs text-gray-500">
                          {q.options.length} {q.options.length === 1 ? 'opcja' : 'opcji'}
                        </p>
                      )}
                      {q.scale && (
                        <p className="text-xs text-gray-500">
                          Skala: {q.scale.min || 1} - {q.scale.max || 5}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Stopka */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Wybrano: {selectedIds.size} {selectedIds.size === 1 ? 'pytanie' : 'pytań'}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Anuluj
            </button>
            <button
              onClick={handleAdd}
              disabled={selectedIds.size === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Dodaj wybrane ({selectedIds.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

