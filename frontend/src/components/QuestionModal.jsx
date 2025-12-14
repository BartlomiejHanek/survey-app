import React, { useState, useEffect } from 'react';

export default function QuestionModal({ question, onSave, onClose, isOpen }) {
  const [formData, setFormData] = useState({
    title: '',
    type: 'text',
    required: false,
    options: [],
    scale: { min: 1, max: 5 },
    imageUrl: '',
    isFavorite: false
  });

  useEffect(() => {
    if (question) {
      setFormData({
        title: question.title || '',
        type: question.type || 'text',
        required: question.required || false,
        options: question.options ? question.options.map(o => typeof o === 'string' ? o : o.text || '') : [],
        scale: question.scale || { min: 1, max: 5 },
        imageUrl: question.imageUrl || '',
        isFavorite: question.isFavorite || false
      });
    } else {
      setFormData({
        title: '',
        type: 'text',
        required: false,
        options: [],
        scale: { min: 1, max: 5 },
        imageUrl: '',
        isFavorite: false
      });
    }
  }, [question, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Tytuł pytania jest wymagany');
      return;
    }
    
    // Przygotuj dane do zapisu
    const cleanedData = {
      title: formData.title.trim(),
      type: formData.type,
      required: formData.required,
      isFavorite: formData.isFavorite
    };
    
    // Opcje - tylko dla typów, które ich wymagają
    if (['radio', 'checkbox', 'select'].includes(formData.type)) {
      cleanedData.options = formData.options.filter(opt => opt && opt.trim());
    }
    
    // Skala - tylko dla typu scale
    if (formData.type === 'scale' && formData.scale) {
      cleanedData.scale = {
        min: Number(formData.scale.min) || 1,
        max: Number(formData.scale.max) || 5
      };
    }
    
    // Obraz - tylko jeśli nie jest pusty
    if (formData.imageUrl && formData.imageUrl.trim()) {
      cleanedData.imageUrl = formData.imageUrl.trim();
    }
    
    onSave(cleanedData);
  };

  const addOption = () => {
    setFormData({ ...formData, options: [...formData.options, ''] });
  };

  const updateOption = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const removeOption = (index) => {
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  const needsOptions = ['radio', 'checkbox', 'select'].includes(formData.type);
  const needsScale = formData.type === 'scale';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {question ? 'Edytuj pytanie' : 'Dodaj nowe pytanie'}
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Treść pytania *
            </label>
            <textarea
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Wpisz treść pytania..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Typ pytania *
            </label>
            <select
              value={formData.type}
              onChange={e => {
                const newType = e.target.value;
                setFormData({
                  ...formData,
                  type: newType,
                  options: (newType === 'radio' || newType === 'checkbox' || newType === 'select') ? formData.options : []
                });
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all"
            >
              <option value="text">Odpowiedź krótka</option>
              <option value="textarea">Tekst długi</option>
              <option value="radio">Pojedynczy wybór</option>
              <option value="checkbox">Wielokrotny wybór</option>
              <option value="select">Lista rozwijana</option>
              <option value="scale">Skala</option>
            </select>
          </div>

          {needsOptions && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opcje odpowiedzi *
              </label>
              <div className="space-y-2">
                {formData.options.map((opt, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <span className="text-gray-500 text-sm w-6">{index + 1}.</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={e => updateOption(index, e.target.value)}
                      placeholder={`Opcja ${index + 1}...`}
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium px-2"
                    >
                      Usuń
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addOption}
                className="mt-2 text-sm text-gray-700 hover:text-gray-900 font-medium"
              >
                + Dodaj opcję
              </button>
            </div>
          )}

          {needsScale && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zakres skali
              </label>
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Min:</label>
                  <input
                    type="number"
                    value={formData.scale.min}
                    onChange={e => setFormData({
                      ...formData,
                      scale: { ...formData.scale, min: Number(e.target.value) }
                    })}
                    className="w-20 p-2 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Max:</label>
                  <input
                    type="number"
                    value={formData.scale.max}
                    onChange={e => setFormData({
                      ...formData,
                      scale: { ...formData.scale, max: Number(e.target.value) }
                    })}
                    className="w-20 p-2 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Obraz pytania (URL)
            </label>
            <input
              type="text"
              value={formData.imageUrl}
              onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              checked={formData.required}
              onChange={e => setFormData({ ...formData, required: e.target.checked })}
              className="w-4 h-4 text-gray-900 focus:ring-gray-900"
            />
            <label className="text-sm text-gray-700 font-medium">Pytanie obowiązkowe</label>
          </div>

          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              checked={formData.isFavorite}
              onChange={e => setFormData({ ...formData, isFavorite: e.target.checked })}
              className="w-4 h-4 text-gray-900 focus:ring-gray-900"
            />
            <label className="text-sm text-gray-700 font-medium">Oznacz jako ulubione</label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {question ? 'Zapisz zmiany' : 'Dodaj pytanie'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

