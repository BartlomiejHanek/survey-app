import { useState } from "react";
import axios from "axios";

export default function CreateSurvey() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [questions, setQuestions] = useState([]);

  const addQuestion = () => {
    setQuestions([...questions, { text: "", type: "text", options: [] }]);
  };

  const saveSurvey = async () => {
    const res = await axios.post(`${import.meta.env.VITE_API}/api/surveys`, {
      title,
      description: desc,
      questions,
    });

    alert("Survey link: http://localhost:5173/survey/" + res.data._id);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Create Survey</h1>

      <input placeholder="Title" onChange={(e) => setTitle(e.target.value)} />
      <br />

      <textarea
        placeholder="Description"
        onChange={(e) => setDesc(e.target.value)}
      />
      <br />

      <button onClick={addQuestion}>Add question</button>

      {questions.map((q, i) => (
        <div key={i}>
          <input
            placeholder="Question text"
            onChange={(e) => {
              const qs = [...questions];
              qs[i].text = e.target.value;
              setQuestions(qs);
            }}
          />
        </div>
      ))}

      <button onClick={saveSurvey}>Save</button>
    </div>
  );
}
