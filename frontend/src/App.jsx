import { BrowserRouter, Routes, Route } from "react-router-dom";
import CreateSurvey from "./pages/CreateSurvey";
import Survey from "./pages/Survey";
import Responses from "./pages/Responses";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CreateSurvey />} />
        <Route path="/survey/:id" element={<Survey />} />
        <Route path="/responses/:id" element={<Responses />} />
      </Routes>
    </BrowserRouter>
  );
}
