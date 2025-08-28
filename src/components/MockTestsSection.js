import React, { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";

// ====== CONFIG ======
const COMPILER_API = "http://localhost:4000/compile";
const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GEMINI_API_KEY = "AIzaSyC2Psvxy3aRne0-berI59WXCCPaKRW_5-g";

// Company presets
const COMPANY_TESTS = [
  { id: 1, name: "TCS", title: "TCS NQT Mock Test", questions: 25, durationMin: 50 },
  { id: 2, name: "Infosys", title: "Infosys Specialist Programmer", questions: 20, durationMin: 45 },
  { id: 3, name: "Amazon", title: "Amazon SDE 1", questions: 30, durationMin: 70 },
  { id: 4, name: "Microsoft", title: "Microsoft SWE", questions: 35, durationMin: 75 },
  { id: 5, name: "Google", title: "Google Coding Challenge", questions: 20, durationMin: 50 },
  { id: 6, name: "Facebook", title: "Facebook Hackercup Practice", questions: 25, durationMin: 60 },
];

// Language options
const LANG_OPTIONS = [
  { label: "Python", value: "python", editor: "python" },
  { label: "JavaScript", value: "javascript", editor: "javascript" },
  { label: "C", value: "c", editor: "c" },
  { label: "C++", value: "cpp", editor: "cpp" },
  { label: "Java", value: "java", editor: "java" },
];

// ====== HELPERS ======
function extractFirstJson(text) {
  if (!text) return null;
  const fence = /```json[\s\S]*?```/i.exec(text);
  if (fence) {
    const inner = fence[0].replace(/```json/i, "").replace(/```/, "").trim();
    try { return JSON.parse(inner); } catch (_) {}
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    const possible = text.slice(start, end + 1);
    try { return JSON.parse(possible); } catch (_) {}
  }
  return null;
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// Auth helpers
function getAuthToken() {
  return localStorage.getItem("token") || null;
}

async function getLoggedUser() {
  const cached = localStorage.getItem("user");
  if (cached) return JSON.parse(cached);
  
  const token = getAuthToken();
  if (!token) return null;
  
  try {
    const res = await fetch("http://localhost:4000/get-profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    localStorage.setItem("user", JSON.stringify(data.user));
    return data.user;
  } catch (err) {
    console.error("Failed to fetch user profile", err);
    return null;
  }
}

// ====== COMPONENT ======
export default function MockTestsSection() {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Quiz state
  const [quiz, setQuiz] = useState([]);
  const [answers, setAnswers] = useState([]);

  // Coding state
  const [challenge, setChallenge] = useState(null);
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("# Write your code here\n");
  const [runLoading, setRunLoading] = useState(false);
  const [runResults, setRunResults] = useState(null);

  // Test lifecycle
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [final, setFinal] = useState(null);
  const timerRef = useRef(null);

  const [showHistory, setShowHistory] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [history, setHistory] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  // Picked company meta
  const selectedMeta = useMemo(
    () => COMPANY_TESTS.find((c) => c.name === company) || null,
    [company]
  );

  useEffect(() => {
    if (!started) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => timerRef.current && clearInterval(timerRef.current);
  }, [started]);

  async function startCompanyTest(name) {
    setCompany(name);
    setLoading(true);
    setError("");
    setFinal(null);

    try {
      const prompt = `You are generating a daily mock test for ${name} campus placements.\n\nReturn STRICT JSON ONLY (no markdown, no commentary), with this exact shape:\n{\n  "quiz": [\n    {"id": 1, "question": "...", "options": ["A","B","C","D"], "answerIndex": 2},\n    {"id": 2, "question": "...", "options": ["A","B","C","D"], "answerIndex": 0},\n    {"id": 3, "question": "...", "options": ["A","B","C","D"], "answerIndex": 1},\n    {"id": 4, "question": "...", "options": ["A","B","C","D"], "answerIndex": 3},\n    {"id": 5, "question": "...", "options": ["A","B","C","D"], "answerIndex": 2}\n  ],\n  "coding": {\n    "title": "...",\n    "description": "...",\n    "difficulty": "Basic|Intermediate|Advanced",\n    "testCases": [\n      {"input": "<stdin input>", "output": "<expected stdout>"},\n      {"input": "...", "output": "..."},\n      {"input": "...", "output": "..."}\n    ]\n  }\n}\n\nGuidelines:\n- Quiz: blend aptitude + CS fundamentals suitable for ${name}.\n- Coding: single function style, standard input/output, deterministic.\n- Test cases must be minimal but cover edge cases.\n- DO NOT include backticks. DO NOT include any text outside JSON.`;

      const res = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      });

      const json = await res.json();
      const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      let parsed = null;
      try {
        parsed = JSON.parse(raw);
      } catch (_) {
        parsed = extractFirstJson(raw);
      }

      if (!parsed || !Array.isArray(parsed.quiz) || !parsed.coding) {
        throw new Error("AI did not return valid JSON. Try again.");
      }

      // Normalize quiz
      const normalizedQuiz = parsed.quiz
        .filter((q) => q && q.question && Array.isArray(q.options) && q.options.length === 4)
        .map((q, idx) => ({
          id: q.id ?? idx + 1,
          question: String(q.question),
          options: q.options.map(String),
          answerIndex: Number(q.answerIndex),
        }));

      // Normalize coding
      const coding = {
        title: String(parsed.coding.title || "Coding Challenge"),
        description: String(parsed.coding.description || ""),
        difficulty: String(parsed.coding.difficulty || "Basic"),
        testCases: (parsed.coding.testCases || [])
          .filter((t) => typeof t?.input === "string" && typeof t?.output === "string")
          .map((t) => ({ input: t.input, output: t.output })),
      };

      if (normalizedQuiz.length === 0 || coding.testCases.length === 0) {
        throw new Error("AI response incomplete (no quiz or test cases).");
      }

      setQuiz(normalizedQuiz);
      setAnswers(new Array(normalizedQuiz.length).fill(null));
      setChallenge(coding);

      // Start timer
      const duration = (COMPANY_TESTS.find((c) => c.name === name)?.durationMin || 50) * 60;
      setTimeLeft(duration);
      setStarted(true);
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to generate test.");
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(qIndex, optIndex) {
    const next = [...answers];
    next[qIndex] = optIndex;
    setAnswers(next);
  }

  async function handleRun() {
    if (!challenge) return;
    setRunLoading(true);
    setRunResults(null);
    setError("");
    try {
      const res = await fetch("http://localhost:4000/geminicompiler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code, testCases: challenge.testCases }),
      });
      const data = await res.json();
      const results = data?.results || data || [];
      const allPassed = data?.allPassed ?? results.every((r) => r?.passed);
      setRunResults({ results, allPassed });
    } catch (e) {
      console.error(e);
      setError("Running code failed. Ensure backend supports testCases mode.");
    } finally {
      setRunLoading(false);
    }
  }

  async function handleFinish() {
    const quizCorrect = quiz.reduce(
      (acc, q, i) => (answers[i] === q.answerIndex ? acc + 1 : acc),
      0
    );
    const codingPts = runResults?.allPassed ? 5 : 0;
    const total = quizCorrect + codingPts;
    const durationSec =
      (COMPANY_TESTS.find((c) => c.name === company)?.durationMin || 50) * 60;
    const timeTakenSec = durationSec - timeLeft;

    // Get logged user
    const user = await getLoggedUser();
    if (!user) {
      alert("You must be logged in to save attempts.");
      const summaryLocal = { 
        company, 
        date: new Date().toLocaleString(), 
        quizCorrect, 
        quizTotal: quiz.length, 
        codingPts, 
        total 
      };
      setFinal(summaryLocal);
      setStarted(false);
      return;
    }

    const payload = {
      company,
      quizCorrect,
      quizTotal: quiz.length,
      codingPts,
      total,
      timeTakenSec,
      durationSec
    };

    setFinal({ 
      company, 
      date: new Date().toLocaleString(), 
      quizCorrect, 
      quizTotal: quiz.length, 
      codingPts, 
      total 
    });

    setStarted(false);

    try {
      const token = getAuthToken();
      const res = await fetch("http://localhost:4000/attempts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("Attempt saved to DB:", data);
    } catch (err) {
      console.error("Error saving attempt to backend:", err);
    }

    // Keep local copy too
    const historyLocal = JSON.parse(localStorage.getItem("mockAttempts") || "[]");
    localStorage.setItem("mockAttempts", JSON.stringify([{ 
      company, 
      quizCorrect, 
      quizTotal: quiz.length, 
      codingPts, 
      total, 
      date: new Date().toISOString() 
    }, ...historyLocal]));
  }

  async function loadHistory() {
    try {
      const token = getAuthToken();
      if (!token) {
        alert("Please login to view history.");
        return;
      }
      const res = await fetch(`http://localhost:4000/attempts/history?page=1&limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setHistory(data.items || []);
      setShowHistory(true);
      setShowLeaderboard(false);
    } catch (err) {
      console.error("History fetch failed:", err);
    }
  }

  async function loadLeaderboard() {
    try {
      const token = getAuthToken();
      let url = "http://localhost:4000/attempts/leaderboard?limit=50";
      if (company) url += `&company=${encodeURIComponent(company)}`;
      
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      setLeaderboard(data.items || []);
      setShowLeaderboard(true);
      setShowHistory(false);
    } catch (err) {
      console.error("Leaderboard fetch failed:", err);
    }
  }

  function resetAll() {
    setCompany(null);
    setQuiz([]);
    setAnswers([]);
    setChallenge(null);
    setLanguage("python");
    setCode("# Write your code here\n");
    setRunResults(null);
    setFinal(null);
    setStarted(false);
    setTimeLeft(0);
    setError("");
  }

  return (
    <section className="mock-section">
      <h2 className="mock-title">AI‑Powered Company Mock Tests</h2>

      {/* Header with History & Leaderboard */}
      <header className="mock-header">
        <div className="mock-actions">
          <button className="mock-btn" onClick={loadHistory}>History</button>
          <button className="mock-btn" onClick={loadLeaderboard}>Leaderboard</button>
        </div>
      </header>
      
      {showHistory && (
        <div className="history-card">
          <h3>Your Past Attempts</h3>
          {history.length === 0 ? (
            <p className="muted">No attempts yet.</p>
          ) : (
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Company</th>
                  <th>Quiz</th>
                  <th>Coding</th>
                  <th>Total</th>
                  <th>Time Taken</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i}>
                    <td>{new Date(h.createdAt).toLocaleString()}</td>
                    <td>{h.company}</td>
                    <td>{h.quizCorrect}/{h.quizTotal}</td>
                    <td>{h.codingPts}</td>
                    <td><b>{h.total}</b></td>
                    <td>{Math.floor(h.timeTakenSec/60)}m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showLeaderboard && (
        <div className="leaderboard-card">
          <h3>Leaderboard {company ? `– ${company}` : ""}</h3>
          {leaderboard.length === 0 ? (
            <p className="muted">No leaderboard data yet.</p>
          ) : (
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>User</th>
                  <th>Company</th>
                  <th>Score</th>
                  <th>Time Taken</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((l, i) => (
                  <tr key={i}>
                    <td>#{i + 1}</td>
                    <td>{l.userName}</td>
                    <td>{l.company}</td>
                    <td><b>{l.totalScore}</b></td>
                    <td>{Math.floor(l.timeTakenSec/60)}m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {!started && !final && (
        <>
          <p className="muted">Pick a company to auto‑generate today's quiz + coding challenge.</p>
          {error && <div className="error-banner">{error}</div>}
          <div className="company-grid">
            {COMPANY_TESTS.map((c) => (
              <div key={c.id} className="company-card">
                <h3>{c.title}</h3>
                <p className="company-sub">{c.name} • {c.durationMin} mins</p>
                <button className="primary" disabled={loading} onClick={() => startCompanyTest(c.name)}>
                  {loading && company === c.name ? "Generating…" : `Start ${c.name} Test`}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {started && (
        <div className="test-wrap">
          <div className="test-header">
            <div>
              <h3>{selectedMeta?.title || `${company} Mock Test`}</h3>
              <span className="badge">Time Left: {formatTime(timeLeft)}</span>
            </div>
            <div className="controls">
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                {LANG_OPTIONS.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
              <button className="danger" onClick={handleFinish}>Finish Now</button>
            </div>
          </div>

          {/* Quiz */}
          <div className="panel">
            <h4>Section A · MCQ ({quiz.length} questions)</h4>
            {quiz.map((q, idx) => (
              <div key={q.id} className="quiz-item">
                <div className="qline"><b>{idx + 1}.</b> {q.question}</div>
                <div className="opts">
                  {q.options.map((opt, j) => (
                    <label key={j} className={`opt ${answers[idx] === j ? "sel" : ""}`}>
                      <input
                        type="radio"
                        name={`q-${idx}`}
                        checked={answers[idx] === j}
                        onChange={() => selectAnswer(idx, j)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Coding */}
          {challenge && (
            <div className="panel">
              <h4>Section B · Coding: {challenge.title} <span className="pill">{challenge.difficulty}</span></h4>
              <p className="desc">{challenge.description}</p>

              <div className="editor-wrap">
                <Editor
                  height="320px"
                  theme="vs-dark"
                  language={LANG_OPTIONS.find((l) => l.value === language)?.editor || "python"}
                  value={code}
                  onChange={(val) => setCode(val || "")}
                />
              </div>

              <div className="row">
                <button className="secondary" disabled={runLoading} onClick={handleRun}>
                  {runLoading ? "Running…" : "Run Code against Test Cases"}
                </button>
              </div>

              <div className="tests">
                <h5>Sample / Hidden Test Cases</h5>
                <div className="tests-grid">
                  {challenge.testCases.map((t, i) => (
                    <div key={i} className="testcard">
                      <div className="tin">Input</div>
                      <pre>{t.input}</pre>
                      <div className="tout">Expected</div>
                      <pre>{t.output}</pre>
                    </div>
                  ))}
                </div>

                {runResults && (
                  <div className="results">
                    <h5>Run Results</h5>
                    {runResults.results?.map((r, i) => (
                      <div key={i} className={`res ${r.passed ? "ok" : "bad"}`}>
                        <div><b>Test {i + 1}</b></div>
                        <div>Passed: {String(!!r.passed)}</div>
                        {r.actualOutput && <div><small>Output: {r.actualOutput}</small></div>}
                      </div>
                    ))}
                    <div className={`summary ${runResults.allPassed ? "ok" : "bad"}`}>
                      {runResults.allPassed ? "✅ All test cases passed!" : "❌ Some test cases failed."}
                    </div>
                  </div>
                )}
              </div>

              {error && <div className="error-banner mt">{error}</div>}
            </div>
          )}
        </div>
      )}

      {final && (
        <div className="result-card">
          <h3>Test Results – {final.company}</h3>
          <div className="grid2">
            <div>
              <p><b>Date:</b> {final.date}</p>
              <p><b>Quiz:</b> {final.quizCorrect} / {final.quizTotal}</p>
              <p><b>Coding Points:</b> {final.codingPts}</p>
            </div>
            <div className="bigscore">{final.total}</div>
          </div>
          <div className="row gap">
            <button className="secondary" onClick={() => setFinal(null)}>Try Another Test</button>
            <button className="ghost" onClick={resetAll}>Back to Companies</button>
          </div>
        </div>
      )}
    </section>
  );
}