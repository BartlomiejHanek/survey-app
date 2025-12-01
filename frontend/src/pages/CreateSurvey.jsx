import { useState } from "react";

export default function CreateSurvey() {
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [questions, setQuestions] = useState([]);
    
    const addQuestion = () => {
        setQuestions([...questions, { text: "", type: "text", options: [] }]);
    };
    
    const updateQuestion = (index, patch) => {
      const qs = [...questions];
      qs[index] = { ...qs[index], ...patch };
      setQuestions(qs);
    };
    
    const addOption = (qIndex) => {
      const qs = [...questions];
      qs[qIndex].options = qs[qIndex].options ? [...qs[qIndex].options, ""] : [""];
      setQuestions(qs);
    };
    
    const updateOption = (qIndex, optIndex, value) => {
      const qs = [...questions];
      qs[qIndex].options = qs[qIndex].options || [];
      qs[qIndex].options[optIndex] = value;
      setQuestions(qs);
    };
    
    const removeOption = (qIndex, optIndex) => {
      const qs = [...questions];
      qs[qIndex].options = qs[qIndex].options || [];
      qs[qIndex].options.splice(optIndex, 1);
      setQuestions(qs);
    };

    const saveSurvey = async () => {
        try {
        const res = await fetch(`${import.meta.env.VITE_API}/api/surveys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: desc, questions }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      alert("Link do ankiety: http://localhost:5173/survey/" + data._id);
    } catch (err) {
      alert("Nie udało się zapisać ankiety");
    }
  };


  return (
    <div style={{ padding: 20 }}>
      <h1>Tworzenie ankiety</h1>

      <input 
        placeholder="Tytuł" 
        value={title} 
        onChange={(e) => setTitle(e.target.value)} 
      />
      <br />

      <textarea
        placeholder="Opis ankiety"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />
      <br />

      <button onClick={addQuestion}>Dodaj pytanie</button>

      {questions.map((q, i) => (
        <div key={i} style={{ marginTop: 10 }}>
          <input
            style={{ width: "40%" }}
            placeholder="Treść pytania"
            value={q.text}
            onChange={(e) => updateQuestion(i, { text: e.target.value })}
          />

          <select
            value={q.type}
            onChange={(e) => updateQuestion(i, { type: e.target.value })}
            style={{ marginLeft: 8 }}
          >
            <option value="text">Pole tekstowe</option>
            <option value="radio">Pole jednokrotnego wyboru (radio)</option>
          </select>

          {q.type === "radio" && (
            <div style={{ marginTop: 6 }}>
              {q.options.map((opcja, indexOpcji) => (
                <div key={indexOpcji} style={{ display: "flex", marginBottom: 4 }}>
                  <input
                    style={{ width: "50%" }}
                    placeholder={`Opcja ${indexOpcji + 1}`}
                    value={opcja}
                    onChange={(e) => updateOption(i, indexOpcji, e.target.value)}
                  />
                  <button onClick={() => removeOption(i, oi)} style={{ marginLeft: 8 }}>
                    Usuń
                  </button>
                </div>
              ))}
              <button onClick={() => addOption(i)}>Dodaj opcję</button>
            </div>
          )}
        </div>
      ))}

      <button onClick={saveSurvey}>Zapisz ankiete</button>
    </div>
  );
}
