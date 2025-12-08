export const statusLabels = {
  draft: 'Robocza',
  published: 'Opublikowana',
  closed: 'Zamknięta',
  archived: 'Zarchiwizowana'
};

export const statusLabel = (status) => statusLabels[status] || status || '—';

export const getSurveyId = (survey) => (survey && (survey.id || survey._id)) || null;

export function normalizeSurvey(survey) {
  if (!survey) return survey;
  const normalizeQuestion = (q, idx) => ({
    id: q.id || q._id || String(idx),
    title: q.title || q.text || q.label || '',
    text: q.text || q.title || '',
    type: q.type || 'text',
    required: !!q.required,
    options: Array.isArray(q.options)
      ? q.options.map((o) => (typeof o === 'string' ? o : o.text || ''))
      : [],
    imageUrl: q.imageUrl || q.image || null,
    scale: q.scale || null,
    order: typeof q.order === 'number' ? q.order : idx
  });

  return {
    id: survey._id || survey.id,
    title: survey.title,
    description: survey.description,
    status: survey.status,
    allowAnonymous: survey.allowAnonymous,
    singleResponse: survey.singleResponse,
    maxResponses: survey.maxResponses,
    validFrom: survey.validFrom,
    validUntil: survey.validUntil,
    questions: Array.isArray(survey.questions)
      ? survey.questions.map(normalizeQuestion)
      : []
  };
}

export function buildSurveyPayload(survey = {}) {
  const mapQuestionsToServer = (questions = []) =>
    questions.map((q, index) => ({
      ...(q._id && { _id: String(q._id) }),
      ...(q.id && /^[a-fA-F0-9]{24}$/.test(String(q.id)) ? { _id: String(q.id) } : {}),
      text: q.title || q.text || `Pytanie ${index + 1}`,
      type: q.type || 'text',
      required: !!q.required,
      options: Array.isArray(q.options)
        ? q.options.map((o) => (typeof o === 'string' ? o : o.text || ''))
        : [],
      imageUrl: q.imageUrl || q.image || null,
      scale: q.scale || undefined,
      order: typeof q.order === 'number' ? q.order : index
    }));

  return {
    title: survey.title,
    description: survey.description,
    status: survey.status,
    allowAnonymous: survey.allowAnonymous,
    singleResponse: survey.singleResponse,
    maxResponses: survey.maxResponses,
    validFrom: survey.validFrom,
    validUntil: survey.validUntil,
    questions: mapQuestionsToServer(survey.questions)
  };
}

export function buildAnswersPayload(answersObj) {
  if (!answersObj) return { answers: [] };
  if (answersObj.answers) {
    return {
      answers: answersObj.answers,
      ...(answersObj.inviteToken ? { inviteToken: answersObj.inviteToken } : {}),
      ...(answersObj.resumeToken ? { resumeToken: answersObj.resumeToken } : {})
    };
  }
  return { answers: answersObj };
}

