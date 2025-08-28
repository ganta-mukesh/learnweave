 import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { jwtDecode } from 'jwt-decode';
import "./SolvingPage.css";

const SolvingPage = () => {
  const location = useLocation();
  const { language } = location.state || {};

  // Mapping from language card names to compiler languages
  const languageToCompilerMap = {
    JAVASCRIPT: "javascript",
    PYTHON: "python",
    SQL: "sql",
    C: "c",
    MONGODB: "mongodb",
    "AI/ML": "python",
  };

  // Set the compiler language based on the selected language
  const [compilerLanguage, setCompilerLanguage] = useState(
    languageToCompilerMap[language] || "javascript"
  );

  const [questions, setQuestions] = useState([]);
  const [filters, setFilters] = useState({
    basic: false,
    intermediate: false,
    advanced: false,
  });
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showAllTestCases, setShowAllTestCases] = useState(false);
  const [code, setCode] = useState("// Write your code here...");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("code");
  const [isChallengeSolved, setIsChallengeSolved] = useState(false);
  const [helpLoading, setHelpLoading] = useState(false);
  const [solutions, setSolutions] = useState([]);
  

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(
          `http://localhost:4000/challenges?language=${encodeURIComponent(language)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const data = await response.json();
        if (response.ok) {
          setQuestions(data.challenges || []);
          setFilteredQuestions(data.challenges || []);
        } else {
          console.error("Failed to fetch challenges:", data.message);
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
      }
    };

    if (language) {
      fetchQuestions();
    }
  }, [language]);

  const handleFilterChange = (e) => {
    const { name, checked } = e.target;
    setFilters((prevFilters) => ({ ...prevFilters, [name]: checked }));
  };

  const applyFilters = () => {
    const newFilteredQuestions = questions.filter((question) => {
      if (filters.basic && question.difficulty === "Basic") return true;
      if (filters.intermediate && question.difficulty === "Intermediate") return true;
      if (filters.advanced && question.difficulty === "Advanced") return true;
      return !filters.basic && !filters.intermediate && !filters.advanced; // Show all if no filters are selected
    });
    setFilteredQuestions(newFilteredQuestions);
  };

  const handleSolveChallenge = async (challenge) => {
    console.log("Challenge selected:", challenge);
    setSelectedChallenge(challenge);
    setShowAllTestCases(false);
    setCode("// Write your code here...");

    const token = localStorage.getItem("token");
    if (!token) return;

    const decoded = jwtDecode(token);
    const userId = decoded?.userId;

    try {
        const response = await axios.get(
            `http://localhost:4000/solutions?challengeId=${challenge._id}&userId=${userId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (response.data.solution) {
            // User has already solved this challenge
            setIsChallengeSolved(true);
            setOutput("You already solved this challenge. Please try to solve other challenges.");
        } else {
            setIsChallengeSolved(false);
        }
    } catch (error) {
        console.error("Error checking solution:", error);
    }
};
  const handleBackToQuestions = () => {
    setSelectedChallenge(null);
  };

  const handleViewAllTestCases = () => {
    setShowAllTestCases(true);
  };

  const handleRun = async () => {
    console.log("Run button clicked");

    if (!selectedChallenge) {
        console.error("No challenge selected");
        return;
    }

    setLoading(true);
    setOutput("Running...");
    setActiveTab("output");

    try {
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error("Token not found in localStorage");
        }

        const decoded = jwtDecode(token);
        const userId = decoded?.userId;
        if (!userId) {
            throw new Error("User ID not found in token");
        }

        const response = await axios.post(
            "http://localhost:4000/compile",
            {
                language: compilerLanguage.toLowerCase(),
                code,
                challengeId: selectedChallenge._id,
                userId,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("Compile response:", response.data); // Debug log

        if (response.data.message) {
            // User has already solved this challenge
            setOutput(response.data.message);
        } else {
            const { results, allPassed } = response.data;

            let outputText = "";
            results.forEach((result, index) => {
                outputText += `Test Case ${index + 1}:\n`;
                outputText += `Input: ${result.input}\n`;
                outputText += `Expected Output: ${result.expectedOutput}\n`;
                outputText += `Actual Output: ${result.actualOutput}\n`;
                outputText += `Status: ${result.passed ? "✅ Passed" : "❌ Failed"}\n\n`;
            });

            if (allPassed) {
                outputText += "🎉 All test cases passed! Solution saved.\n";
                // Display the coins earned based on the difficulty level
                switch (selectedChallenge.difficulty.toLowerCase()) {
                    case 'basic':
                        outputText += "You earned 3 coins! 🪙\n";
                        break;
                    case 'intermediate':
                        outputText += "You earned 5 coins! 🪙\n";
                        break;
                    case 'advanced':
                        outputText += "You earned 7 coins! 🪙\n";
                        break;
                    default:
                        outputText += "You earned coins! 🪙\n";
                }
            } else {
                outputText += "❌ Some test cases failed. Solution not saved.\n";
            }

            setOutput(outputText);
        }
    } catch (error) {
        console.error("Error executing code:", error);

        // Handle the case where the user has already solved the challenge
        if (error.response && error.response.status === 400) {
            setOutput(error.response.data.message); // Display the message from the backend
        } else {
            setOutput("Error executing code: " + (error.response?.data?.details || error.message));
        }
    } finally {
        setLoading(false);
    }
};


const handleViewAnswers = async () => {
  if (!selectedChallenge) {
      console.error("No challenge selected");
      return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
      console.error("Token not found in localStorage");
      return;
  }

  try {
      const response = await axios.get(
          `http://localhost:4000/solutions?challengeId=${selectedChallenge._id}`,
          {
              headers: {
                  Authorization: `Bearer ${token}`,
              },
          }
      );

      if (response.data.solutions) {
          setSolutions(response.data.solutions);
          setActiveTab("answers"); // Switch to the answers tab
      } else {
          setSolutions([]);
          setOutput("No solutions found for this challenge.");
      }
  } catch (error) {
      console.error("Error fetching solutions:", error);
      setOutput("Error fetching solutions: " + (error.response?.data?.details || error.message));
  }
};

const handleHelp = async () => {
  console.log("Help button clicked");

  if (!selectedChallenge) {
    setOutput("No challenge selected. Please select a challenge first.");
    return;
  }

  setHelpLoading(true);
  setOutput("Generating step-by-step guide...");
  setActiveTab("output");

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Token not found in localStorage");
    }

    const response = await axios.post(
      "http://localhost:4000/get-help",
      {
        challengeId: selectedChallenge._id
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.guide) {
      setOutput(response.data.guide);
    } else {
      setOutput("No guide could be generated.");
    }
  } catch (error) {
    console.error("Error generating guide:", error);
    setOutput("Error generating guide: " + (error.response?.data?.message || error.message));
  } finally {
    setHelpLoading(false);
  }
};
  // Add ResizeObserver error suppression
  useEffect(() => {
    const errorHandler = (e) => {
      if (e.message.includes("ResizeObserver")) {
        e.preventDefault();
      }
    };
    window.addEventListener("error", errorHandler);
    return () => window.removeEventListener("error", errorHandler);
  }, []);

  return (
    <div className="slv-solving-page-container">
      {/* Left Panel (Questions and Filters or Selected Challenge) */}
      <div className="slv-question-section">
        {selectedChallenge ? (
          <div className="selected-challenge">
            <button className="back-button" onClick={handleBackToQuestions}>
              Back to Questions
            </button>
            <h2>Topic: {selectedChallenge.topic}</h2>
            <p><strong>Question:</strong> {selectedChallenge.question}</p>
            <div className="test-cases">
              <h3>Sample Input:</h3>
              <pre>{selectedChallenge.testCases[0]?.input}</pre>
              <h3>Sample Output:</h3>
              <pre>{selectedChallenge.testCases[0]?.output}</pre>
              {!showAllTestCases && (
                <button className="view-all-button" onClick={handleViewAllTestCases}>
                  View All Test Cases
                </button>
              )}
              {showAllTestCases && (
                <div className="all-test-cases">
                  {selectedChallenge.testCases.map((testCase, index) => (
                    <div key={index} className="test-case">
                      <h3>Sample Input {index + 1}:</h3>
                      <pre>{testCase.input}</pre>
                      <h3>Sample Output {index + 1}:</h3>
                      <pre>{testCase.output}</pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="slv-filter-container">
              <div className="slv-filter-section">
                <label>
                  <input
                    type="checkbox"
                    name="basic"
                    checked={filters.basic}
                    onChange={handleFilterChange}
                  />
                  Basic
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="intermediate"
                    checked={filters.intermediate}
                    onChange={handleFilterChange}
                  />
                  Intermediate
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="advanced"
                    checked={filters.advanced}
                    onChange={handleFilterChange}
                  />
                  Advanced
                </label>
                <button onClick={applyFilters} className="slv-filter-button">
                  Apply Filters
                </button>
              </div>
            </div>
            <div className="slv-questions-list">
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map((question) => (
                  <div key={question._id} className="slv-question-card">
                    <h3>{question.topic}</h3>
                    <p>{question.question}</p>
                    <button
                      className="solve-challenge-button"
                      onClick={() => handleSolveChallenge(question)}
                    >
                      Solve Challenge
                    </button>
                  </div>
                ))
              ) : (
                <p>No questions found for the selected filters.</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right Panel (Compiler) */}
      <div className="slv-compiler-section">
        <div className="compiler-tabs">
          <button
            className={`tab-button ${activeTab === "code" ? "active" : ""}`}
            onClick={() => setActiveTab("code")}
          >
            Code
          </button>
          <button
            className={`tab-button ${activeTab === "output" ? "active" : ""}`}
            onClick={() => setActiveTab("output")}
          >
            Output
          </button>
          <select
            className="language-select"
            value={compilerLanguage}
            disabled // Disable the dropdown to prevent changing the language
          >
            <option value={compilerLanguage}>
              {compilerLanguage.toUpperCase()}
            </option>
          </select>
          <button
    className="run-button"
    onClick={handleRun}
    disabled={loading || isChallengeSolved} // Disable if loading or challenge is solved
>
    {loading ? <div className="loading-spinner"></div> : "Run"}
</button>

<button
        className="help-button"
        onClick={handleHelp}
        disabled={helpLoading}
    >
        {helpLoading ? <div className="loading-spinner"></div> : "Help"}
    </button>
    <button
        className="view-answers-button"
        onClick={handleViewAnswers}
    >
        View Answers
    </button>
        </div>
        {activeTab === "code" ? (
          <>
            <Editor
              height="calc(100vh - 150px)"
              theme="vs-dark"
              language={compilerLanguage === "cpp" ? "cpp" : compilerLanguage}
              value={code}
              onChange={(value) => setCode(value)}
            />
            <div className="input-section">
              <textarea
                className="input-field"
                rows="3"
                placeholder="Optional Input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>
          </>
        ) : (
          <div className="output-section">
            <pre className="output-field">{output}</pre>
          </div>
        )}
      </div>
      {activeTab === "answers" && (
    <div className="answers-section">
        {/* Close Button */}
        <button
            className="close-solutions-button"
            onClick={() => setActiveTab("code")} // Switch back to the code tab
        >
            ×
        </button>

        <h3>Solutions for this Challenge:</h3>
        {solutions.length > 0 ? (
            solutions.map((solution, index) => (
                <div key={index} className="solution-card">
                    <h4>Solution {index + 1}</h4>
                    <pre>{solution.code}</pre>
                    <p>Submitted on: {new Date(solution.createdAt).toLocaleString()}</p>
                </div>
            ))
        ) : (
            <p>No solutions found for this challenge.</p>
        )}
    </div>
)}
    </div>
  );
};

export default SolvingPage;