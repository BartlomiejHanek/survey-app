import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './pages/AdminLayout';
import SurveyList from './pages/SurveyList';
import SurveyEditor from './pages/SurveyEditor';
import SurveyStats from './pages/SurveyStats';
import SurveyForm from './pages/SurveyForm';
import Login from './pages/Login';
import PublicSurveys from './pages/PublicSurveys';
import SavedQuestions from './pages/SavedQuestions';
 
import { getToken, getUser, isRemembered } from './auth';

function HomeRedirect() {
  const remembered = isRemembered();
  const user = getUser();
  if (user) return <Navigate to="/admin" replace />;
  return <Navigate to="/login" replace />;
}

function NotFound() {
  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold">Strona nie znaleziona</h2>
      <p className="mt-2">Użyj <code>/admin</code> lub <code>/survey/&lt;id&gt;</code>.</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<SurveyList />} />
        <Route path="edit/:id" element={<SurveyEditor />} />
        <Route path="stats/:id" element={<SurveyStats />} />
        <Route path="questions" element={<SavedQuestions />} />
      </Route>
      <Route path="/surveys" element={<PublicSurveys />} />
      <Route path="/login" element={<Login />} />
      <Route path="/survey/:id" element={<SurveyForm />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
