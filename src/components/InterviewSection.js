import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./InterviewSection.css";

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GEMINI_API_KEY = "AIzaSyC2Psvxy3aRne0-berI59WXCCPaKRW_5-g";

const InterviewSection = () => {
  const navigate = useNavigate();

  // State for Card 2 (AI Chat Assistant)
  const [role, setRole] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userAnswer, setUserAnswer] = useState("");
  const [questionCount, setQuestionCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  // Helper function to extract text from API response
  const extractTextFromResponse = (data) => {
    try {
      // Try multiple possible response structures
      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      } else if (data?.promptFeedback?.blockReason) {
        return `Request blocked: ${data.promptFeedback.blockReason}. Please try a different approach.`;
      } else if (data?.error?.message) {
        return `API Error: ${data.error.message}`;
      } else {
        console.warn("Unexpected API response structure:", data);
        return "I apologize, but I'm having trouble generating a response. Please try again.";
      }
    } catch (error) {
      console.error("Error parsing API response:", error);
      return "Error processing the response. Please try again.";
    }
  };

  // Start interview
  const startInterview = async () => {
    if (!role.trim()) return;

    setChatOpen(true);
    setMessages([]);
    setQuestionCount(0);
    setFeedbackGiven(false);
    setLoading(true);

    try {
      const res = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `You are an interviewer for the role: ${role}.
                         Ask only one short, clear interview question (max 20 words).
                         Be formal and professional.`
                }
              ]
            }
          ]
        })
      });

      if (!res.ok) {
        throw new Error(`API request failed with status ${res.status}`);
      }

      const data = await res.json();
      const firstQ = extractTextFromResponse(data);
      setMessages([{ role: "assistant", text: firstQ }]);
    } catch (err) {
      console.error("Error starting interview:", err);
      setMessages([{ 
        role: "assistant", 
        text: "Sorry, I'm having trouble connecting to the interview service. Please try again later." 
      }]);
    }
    setLoading(false);
  };

  // Send answer and get next question or feedback
  const handleAnswer = async () => {
    if (!userAnswer.trim()) return;

    const updatedMessages = [
      ...messages,
      { role: "user", text: userAnswer }
    ];
    setMessages(updatedMessages);
    setUserAnswer("");
    setLoading(true);

    // After 5 questions → ask for feedback (changed from 15 for better testing)
    if (questionCount >= 5) {
      try {
        const res = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `I've been interviewing for a ${role} position. 
                           Here are the questions and answers from our conversation:
                           ${updatedMessages.map(m => `${m.role}: ${m.text}`).join('\n')}
                           
                           As an HR professional, provide constructive feedback in this structured format:
                           
                           STRENGTHS:
                           - [List 2-3 key strengths with brief examples]
                           
                           AREAS FOR IMPROVEMENT:
                           - [List 2-3 specific areas to work on with suggestions]
                           
                           RECOMMENDATIONS:
                           - [Provide 2-3 actionable recommendations]
                           
                           FINAL THOUGHTS:
                           [A brief encouraging summary]
                           
                           Keep it professional, helpful, and specific to the role of ${role}.`
                  }
                ]
              }
            ]
          })
        });

        if (!res.ok) {
          throw new Error(`API request failed with status ${res.status}`);
        }

        const data = await res.json();
        const feedback = extractTextFromResponse(data);
        setMessages((prev) => [...prev, { role: "assistant", text: feedback }]);
        setFeedbackGiven(true);
      } catch (err) {
        console.error("Error getting feedback:", err);
        setMessages((prev) => [...prev, { 
          role: "assistant", 
          text: "I apologize, but I'm having trouble generating your feedback. Please try again." 
        }]);
        setFeedbackGiven(true);
      }
      setLoading(false);
      return;
    }

    // Otherwise → ask next short question
    try {
      const res = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Continue the interview for a ${role} position. 
                         The conversation so far:
                         ${updatedMessages.map(m => `${m.role}: ${m.text}`).join('\n')}
                         
                         Ask only one relevant, short interview question (max 20 words).
                         Be formal and professional.`
                }
              ]
            }
          ]
        })
      });

      if (!res.ok) {
        throw new Error(`API request failed with status ${res.status}`);
      }

      const data = await res.json();
      const reply = extractTextFromResponse(data);
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
      setQuestionCount((prev) => prev + 1);
    } catch (err) {
      console.error("Error getting next question:", err);
      setMessages((prev) => [...prev, { 
        role: "assistant", 
        text: "I'm having trouble generating the next question. Please try again." 
      }]);
    }
    setLoading(false);
  };

  // Exit early and ask for feedback
  const handleExit = async () => {
    if (feedbackGiven) return;

    setLoading(true);
    try {
      const res = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `I've been interviewing for a ${role} position but need to end early. 
                         Here are the questions and answers from our conversation:
                         ${messages.map(m => `${m.role}: ${m.text}`).join('\n')}
                         
                         As an HR professional, provide constructive feedback in this structured format:
                         
                         STRENGTHS:
                         - [List 2-3 key strengths with brief examples]
                         
                         AREAS FOR IMPROVEMENT:
                         - [List 2-3 specific areas to work on with suggestions]
                         
                         RECOMMENDATIONS:
                         - [Provide 2-3 actionable recommendations]
                         
                         FINAL THOUGHTS:
                         [A brief encouraging summary]
                         
                         Keep it professional, helpful, and specific to the role of ${role}.`
                }
              ]
            }
          ]
        })
      });

      if (!res.ok) {
        throw new Error(`API request failed with status ${res.status}`);
      }

      const data = await res.json();
      const feedback = extractTextFromResponse(data);
      setMessages((prev) => [...prev, { role: "assistant", text: feedback }]);
      setFeedbackGiven(true);
    } catch (err) {
      console.error("Error getting early feedback:", err);
      setMessages((prev) => [...prev, { 
        role: "assistant", 
        text: "I apologize, but I'm having trouble generating your feedback. Please try again." 
      }]);
      setFeedbackGiven(true);
    }
    setLoading(false);
  };

  return (
    <section className="interview-section">
      <h2 className="section-title">Interview Preparation</h2>

      <div className="cards-container">
        {/* Card 1 */}
        <div className="interview-card">
          <h3>📘 Company Interview Questions</h3>
          <p>Browse past interview questions asked by top companies.</p>
          <button
            className="card-button"
            onClick={() => navigate("/interview-questions")}
          >
            View Questions
          </button>
        </div>

        {/* Card 2 */}
        <div className="interview-card">
          <h3>🤖 AI Chat Assistant</h3>
          <p>Practice a full mock interview for your chosen role.</p>
          <input
            type="text"
            placeholder="Enter job role (e.g., Frontend Developer)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="role-input"
          />
          <button className="card-button" onClick={startInterview}>
            Start Interview
          </button>
        </div>

        {/* Card 3 */}
        <div className="interview-card">
          <h3>🎥 Live AI Interviewer</h3>
          <p>Simulate a real interview experience with AI (coming soon).</p>
          <button className="card-button disabled" disabled>
            Coming Soon
          </button>
        </div>
      </div>

      {/* Chat Section (separate area) */}
      {chatOpen && (
        <div className="chat-box">
          <div className="chat-header">
            <h3>AI Interviewer for {role}</h3>
          </div>

          <div className="chat-window">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={msg.role === "user" ? "user-msg" : "assistant-msg"}
              >
                {msg.text}
              </div>
            ))}
            {loading && <div className="loading">AI is thinking...</div>}
          </div>

          {!feedbackGiven ? (
            <>
              <div className="chat-input">
                <textarea
                  rows="3"
                  placeholder="Type your answer..."
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  disabled={loading}
                />
                <div className="chat-buttons">
                  <button
                    className="submit-button"
                    onClick={handleAnswer}
                    disabled={loading || !userAnswer.trim()}
                  >
                    {loading ? "Processing..." : "Submit Answer"}
                  </button>
                  <button
                    className="exit-button"
                    onClick={handleExit}
                    disabled={loading}
                  >
                    Exit & Get Feedback
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="feedback-complete">
              <h4>Interview Complete!</h4>
              <button 
                className="card-button"
                onClick={() => {
                  setChatOpen(false);
                  setRole("");
                }}
              >
                Start New Interview
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default InterviewSection;