import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function Survey() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API}/api/surveys/${id}`
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        setSurvey(data);
      } catch (err) {
        alert("nie udało sie wczytac ankiety");
      }
    };
    fetchSurvey();
  }, [id]);

  const handleChange = (i, value) => {
    setAnswers((prev) => ({ ...prev, [i]: value }));
  };

  const submit = async () => {
    const payload = {
      answers: Object.keys(answers).map((key) => ({
        questionId: Number(key),
        value: answers[key],
      })),
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_API}/api/responses/${id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error();
      alert("Dziękujemy za odpowiedzi.");
      navigate(`/responses/${id}`);
    } catch (err) {
      alert("Nie udało się przesłać odpowiedzi.");
    }
  };

  if (!survey) return <div>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>{survey.title}</h1>
      {survey.description && <p>{survey.description}</p>}

      {survey.questions.map((q, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 600 }}>{q.text}</div>

          {q.type === "text" && (
            <input
              type="text"
              value={answers[i] || ""}
              onChange={(e) => handleChange(i, e.target.value)}
            />
          )}

          {q.type === "radio" && q.options && q.options.length > 0 && (
            <div>
              {q.options.map((opt) => (
                <label key={opt} style={{ display: "block" }}>
                  <input
                    type="radio"
                    name={`q${i}`}
                    checked={answers[i] === opt}
                    onChange={() => handleChange(i, opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          )}
        </div>
      ))}

      <button onClick={submit}>Submit</button>
    </div>
  );
}