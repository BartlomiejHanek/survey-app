import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  fetchSavedQuestions, 
  saveQuestion, 
  updateQuestion, 
  deleteQuestion, 
  toggleFavorite,
  reorderQuestions 
} from '../api/apiClient';
import QuestionModal from '../components/QuestionModal';
import Notification from '../components/Notification';

export default function SavedQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    favorite: false,
    sort: 'favorite'
  });

  useEffect(() => {
    loadQuestions();
  }, [filters]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await fetchSavedQuestions(filters);
      setQuestions(data || []);
    } catch (err) {
      console.error('Error loading questions:', err);
      setNotification({ message: 'Błąd ładowania pytań', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (questionData) => {
    try {
      console.log('Saving question data:', questionData);
      if (editingQuestion) {
        await updateQuestion(editingQuestion._id || editingQuestion.id, questionData);
        setNotification({ message: 'Pytanie zaktualizowane', type: 'success' });
      } else {
        const result = await saveQuestion(questionData);
        console.log('Question saved successfully:', result);
        setNotification({ message: 'Pytanie dodane', type: 'success' });
      }
      setShowAddModal(false);
      setEditingQuestion(null);
      loadQuestions();
    } catch (err) {
      console.error('Error saving question:', err);
      console.error('Error response:', err.response?.data);
      const errorMsg = err.response?.data?.details || err.response?.data?.error || 'Błąd zapisu pytania';
      setNotification({ message: errorMsg, type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Czy na pewno usunąć to pytanie?')) return;
    try {
      await deleteQuestion(id);
      setNotification({ message: 'Pytanie usunięte', type: 'success' });
      loadQuestions();
    } catch (err) {
      console.error('Error deleting question:', err);
      setNotification({ message: 'Błąd usuwania pytania', type: 'error' });
    }
  };

  const handleToggleFavorite = async (id) => {
    try {
      await toggleFavorite(id);
      loadQuestions();
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setNotification({ message: 'Błąd aktualizacji ulubionego', type: 'error' });
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const items = Array.from(questions);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    
    setQuestions(items);
    
    // Zapisz kolejność do backendu
    try {
      const questionIds = items.map(q => q._id || q.id);
      await reorderQuestions(questionIds);
    } catch (err) {
      console.error('Error reordering questions:', err);
      loadQuestions(); // Przywróć poprzednią kolejność
    }
  };

  const typeLabels = {
    text: 'Odpowiedź krótka',
    textarea: 'Tekst długi',
    radio: 'Pojedynczy wybór',
    checkbox: 'Wielokrotny wybór',
    select: 'Lista rozwijana',
    scale: 'Skala'
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
      <div className="max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Zapisane pytania</h1>
            <p className="text-sm text-gray-600 mt-1">Zarządzaj bazą pytań do wykorzystania w ankietach</p>
          </div>
          <button
            onClick={() => {
              setEditingQuestion(null);
              setShowAddModal(true);
            }}
            className="bg-gray-900 hover:bg-gray-800 text-white py-2.5 px-5 text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            + Dodaj pytanie
          </button>
        </div>

        {/* Filtry */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              placeholder="🔍 Wyszukaj pytania..."
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              className="flex-1 min-w-[200px] p-2.5 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all"
            />
            <select
              value={filters.type}
              onChange={e => setFilters({ ...filters, type: e.target.value })}
              className="p-2.5 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all"
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
              className="p-2.5 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all"
            >
              <option value="favorite">Ulubione</option>
              <option value="newest">Najnowsze</option>
              <option value="oldest">Najstarsze</option>
              <option value="alphabetical">Alfabetycznie A-Z</option>
              <option value="alphabetical-desc">Alfabetycznie Z-A</option>
            </select>
            <button
              onClick={() => setFilters({ ...filters, favorite: !filters.favorite })}
              className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
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
        {loading ? (
          <div className="text-center py-12 text-gray-500">Ładowanie...</div>
        ) : questions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500 mb-4">Brak zapisanych pytań</p>
            <button
              onClick={() => {
                setEditingQuestion(null);
                setShowAddModal(true);
              }}
              className="bg-gray-900 hover:bg-gray-800 text-white py-2.5 px-5 text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              Dodaj pierwsze pytanie
            </button>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="questions">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                  {questions.map((q, index) => {
                    const qId = q._id || q.id;
                    return (
                      <Draggable key={qId} draggableId={String(qId)} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`bg-white border rounded-lg shadow-sm p-5 transition-all ${
                              snapshot.isDragging ? 'opacity-50 shadow-md' : 'hover:shadow-md'
                            } ${q.isFavorite ? 'bg-yellow-50 border-yellow-200' : 'border-gray-200'}`}
                          >
                            <div className="flex items-start gap-4">
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 flex items-center justify-center w-8 h-8 mt-1 rounded hover:bg-gray-100 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  {q.isFavorite && (
                                    <span className="text-yellow-500">⭐</span>
                                  )}
                                  <span className="text-xs font-medium text-gray-500 uppercase">
                                    {typeLabels[q.type] || q.type}
                                  </span>
                                </div>
                                <h3 className="text-base font-medium text-gray-900 mb-2">
                                  {q.title}
                                </h3>
                                {q.options && q.options.length > 0 && (
                                  <div className="text-sm text-gray-600 mb-2">
                                    <span className="font-medium">{q.options.length}</span> {q.options.length === 1 ? 'opcja' : 'opcji'}
                                    {q.options.length <= 5 && (
                                      <span className="ml-2 text-gray-500">
                                        ({q.options.map(o => typeof o === 'string' ? o : o.text).join(', ')})
                                      </span>
                                    )}
                                  </div>
                                )}
                                {q.scale && (
                                  <div className="text-sm text-gray-600">
                                    Skala: {q.scale.min || 1} - {q.scale.max || 5}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleToggleFavorite(qId)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    q.isFavorite
                                      ? 'text-yellow-500 hover:bg-yellow-100'
                                      : 'text-gray-400 hover:bg-gray-100 hover:text-yellow-500'
                                  }`}
                                  title={q.isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
                                >
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingQuestion(q);
                                    setShowAddModal(true);
                                  }}
                                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="Edytuj"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDelete(qId)}
                                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Usuń"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        {/* Modal dodawania/edycji */}
        <QuestionModal
          question={editingQuestion}
          onSave={handleSave}
          onClose={() => {
            setShowAddModal(false);
            setEditingQuestion(null);
          }}
          isOpen={showAddModal}
        />
      </div>
    </>
  );
}

