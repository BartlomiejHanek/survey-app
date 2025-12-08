import axios from 'axios';
import { getToken, setAuth, clearAuth } from '../auth';
import {
  buildAnswersPayload,
  buildSurveyPayload,
  getSurveyId,
  normalizeSurvey
} from '../utils/surveys';

const API = axios.create({ baseURL: import.meta.env.VITE_API || 'http://localhost:5000' });

const initialToken = getToken();
if (initialToken) API.defaults.headers.common.Authorization = `Bearer ${initialToken}`;

const request = async (method, url, data, config) => {
  const res = await API[method](url, data, config);
  return res.data;
};

export async function fetchSurveys() {
  const data = await request('get', '/api/surveys');
  return Array.isArray(data) ? data.map(normalizeSurvey) : [];
}

export async function fetchSurveyById(id) {
  const data = await request('get', `/api/surveys/${id}`);
  return normalizeSurvey(data);
}

export async function fetchResponses(surveyId) {
  const data = await request('get', `/api/responses/${surveyId}`);
  return Array.isArray(data) ? data : [];
}

export async function saveSurvey(survey) {
  const payload = buildSurveyPayload(survey);
  const id = getSurveyId(survey);
  if (id) return request('put', `/api/surveys/${id}`, payload);
  return request('post', '/api/surveys', payload);
}

export async function submitResponse(surveyId, answersObj) {
  const payload = buildAnswersPayload(answersObj);
  return request('post', `/api/responses/${surveyId}`, payload);
}

 

export async function createInvite(surveyId, maxUses = 1, expiresAt = null) {
  return request('post', '/api/invites/create', { surveyId, maxUses, expiresAt });
}

export async function publishSurvey(id) {
  return request('post', `/api/surveys/${id}/publish`);
}

export async function closeSurvey(id) {
  return request('post', `/api/surveys/${id}/close`);
}

export async function deleteSurvey(id) {
  return request('delete', `/api/surveys/${id}`);
}

export async function archiveSurvey(id) {
  return request('post', `/api/surveys/${id}/archive`);
}

export async function deleteSurveyResponses(id) {
  return request('delete', `/api/surveys/${id}/responses`);
}

export async function exportResponsesCsv(surveyId) {
  
  const res = await API.get(`/api/responses/${surveyId}/export`, { responseType: 'blob' });
  return res.data;
}

export async function login(email, password, remember = true) {
  const data = await request('post', '/api/auth/login', { email, password });
  if (data?.token) {
    setAuth(data.token, data.user, remember);
    API.defaults.headers.common.Authorization = `Bearer ${data.token}`;
  }
  return data;
}

export function logout() {
  clearAuth();
  delete API.defaults.headers.common.Authorization;
}

export async function saveDraftResponse(surveyId, answersObj, resumeToken = null) {
  const payload = {
    ...buildAnswersPayload(answersObj),
    ...(resumeToken ? { resumeToken } : {})
  };
  return request('post', `/api/responses/${surveyId}/save`, payload);
}

export async function resumeDraft(resumeToken) {
  return request('get', `/api/responses/resume/${resumeToken}`);
}

 

export default API;
