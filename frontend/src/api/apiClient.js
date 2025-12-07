import axios from 'axios';
import { getToken, setAuth, clearAuth } from '../auth';

const API = axios.create({ baseURL: import.meta.env.VITE_API || 'http://localhost:5000' });

const initialToken = getToken();
if (initialToken) API.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;

function mapSurveyFromServer(survey) {
  if (!survey) return survey;
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
    questions: Array.isArray(survey.questions) ? survey.questions.map(q => ({
        id: q.id || q._id || String(q._id),
        title: q.title || q.text || q.label || '',
        text: q.text || q.title || '',
        type: q.type,
        required: !!q.required,
        options: Array.isArray(q.options) ? q.options.map(o => (o.text || o)) : [],
        imageUrl: q.imageUrl || q.image || null,
        scale: q.scale || null,
        order: q.order
    })) : []
  };
}

export async function fetchSurveys() {
  const res = await API.get('/api/surveys');
  return Array.isArray(res.data) ? res.data.map(mapSurveyFromServer) : [];
}

export async function fetchSurveyById(id) {
  const res = await API.get(`/api/surveys/${id}`);
  return mapSurveyFromServer(res.data);
}

export async function fetchResponses(surveyId) {
  const res = await API.get(`/api/responses/${surveyId}`);
  return Array.isArray(res.data) ? res.data : [];
}

function mapQuestionsToServer(questions = []) {
  return questions.map((q, i) => ({
    text: q.title || q.text || `Pytanie ${i + 1}`,
    type: q.type || 'text',
    required: !!q.required,
    options: Array.isArray(q.options) ? q.options.map(o => (typeof o === 'string' ? o : (o.text || ''))) : [],
    imageUrl: q.imageUrl || q.image || null,
    scale: q.scale || undefined,
    order: typeof q.order === 'number' ? q.order : i
  }));
}

export async function saveSurvey(survey) {
  const payload = {
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

  if (survey.id) {
    const res = await API.put(`/api/surveys/${survey.id}`, payload);
    return res.data;
  } else {
    const res = await API.post('/api/surveys', payload);
    return res.data;
  }
}

export async function submitResponse(surveyId, answersObj) {
  
  const payload = {};
  if (answersObj && answersObj.answers) {
    payload.answers = answersObj.answers;
    if (answersObj.inviteToken) payload.inviteToken = answersObj.inviteToken;
  } else {
    payload.answers = answersObj;
  }
  const res = await API.post(`/api/responses/${surveyId}`, payload);
  return res.data;
}

 

export async function createInvite(surveyId, maxUses = 1, expiresAt = null) {
  const res = await API.post('/api/invites/create', { surveyId, maxUses, expiresAt });
  return res.data;
}

export async function publishSurvey(id) {
  const res = await API.post(`/api/surveys/${id}/publish`);
  return res.data;
}

export async function closeSurvey(id) {
  const res = await API.post(`/api/surveys/${id}/close`);
  return res.data;
}

export async function deleteSurvey(id) {
  const res = await API.delete(`/api/surveys/${id}`);
  return res.data;
}

export async function archiveSurvey(id) {
  const res = await API.post(`/api/surveys/${id}/archive`);
  return res.data;
}

export async function deleteSurveyResponses(id) {
  const res = await API.delete(`/api/surveys/${id}/responses`);
  return res.data;
}

export async function exportResponsesCsv(surveyId) {
  
  const res = await API.get(`/api/responses/${surveyId}/export`, { responseType: 'blob' });
  return res.data;
}

export async function login(email, password, remember = true) {
  const res = await API.post('/api/auth/login', { email, password });
  if (res.data && res.data.token) {
    setAuth(res.data.token, res.data.user, remember);
    API.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
  }
  return res.data;
}

export function logout() {
  clearAuth();
  delete API.defaults.headers.common['Authorization'];
}

export async function saveDraftResponse(surveyId, answersObj, resumeToken = null) {
  const payload = {};
  if (answersObj && answersObj.answers) payload.answers = answersObj.answers;
  else payload.answers = answersObj;
  if (resumeToken) payload.resumeToken = resumeToken;
  const res = await API.post(`/api/responses/${surveyId}/save`, payload);
  return res.data;
}

export async function resumeDraft(resumeToken) {
  const res = await API.get(`/api/responses/resume/${resumeToken}`);
  return res.data;
}

 

export default API;
