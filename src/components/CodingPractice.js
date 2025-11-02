import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', icon: 'JS', color: '#f0db4f' },
  { id: 'python', name: 'Python', icon: 'Py', color: '#306998' },
  { id: 'java', name: 'Java', icon: 'Jv', color: '#ed8b00' },
  { id: 'cpp', name: 'C++', icon: 'C++', color: '#00599c' },
  { id: 'c', name: 'C', icon: 'C', color: '#283593' }
];

const baseURL = process.env.REACT_APP_API_URL || "http://localhost:4000";
const CodingPractice = ({ resources }) => {
  const [selectedPracticeLang, setSelectedPracticeLang] = useState(null);
  const navigate = useNavigate();

  const navigateToSolvingPage = (language = "All") => {
    navigate('/solve', { 
      state: { 
        language: language ? language.toUpperCase() : "ALL", 
        challenge: null,
        challengeType: "placement"
      } 
    });
  };

  return (
    <div className="resource-content">
      <h3>Coding Practice</h3>
      <p>Sharpen your coding skills with placement-specific challenges</p>
      
      <div className="coding-practice-container">
        <div className="coding-cards-grid">
          <div className="coding-resource-card">
            <h4>Coding Resources</h4>
            <p>Access curated resources to improve your coding skills</p>
            <div className="resources-list">
              {resources.map(resource => (
                <a key={resource.id} href={resource.url} className="resource-link" target="_blank" rel="noopener noreferrer">
                  {resource.title} - {resource.description}
                </a>
              ))}
            </div>
          </div>
          
          <div className="coding-practice-card">
            <h4>Practice Coding Challenges</h4>
            <p>Solve real coding problems with our interactive code editor</p>
            <div className="practice-features">
              <div className="feature">
                <span className="feature-icon">💻</span>
                <span>Multiple Languages</span>
              </div>
              <div className="feature">
                <span className="feature-icon">⚡</span>
                <span>Real-time Execution</span>
              </div>
              <div className="feature">
                <span className="feature-icon">📊</span>
                <span>Progress Tracking</span>
              </div>
            </div>

            <div className="practice-language-select">
              <h5>Select Programming Language</h5>
              <div className="language-buttons-grid">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.id}
                    className={`lang-button ${selectedPracticeLang === lang.id ? 'active' : ''}`}
                    onClick={() => setSelectedPracticeLang(lang.id)}
                    style={{ '--lang-color': lang.color }}
                  >
                    <span className="lang-icon">
                      {lang.icon}
                    </span>
                    <span className="lang-label">{lang.name}</span>
                  </button>
                ))}
              </div>

              <p className="select-message">
                {selectedPracticeLang 
                  ? `Selected: ${LANGUAGES.find(l => l.id === selectedPracticeLang)?.name}` 
                  : 'Select a language and start practicing.'}
              </p>

              <div className="practice-action-row">
                <button
                  className="start-practice-button"
                  onClick={() => navigateToSolvingPage(selectedPracticeLang || "All")}
                  disabled={!selectedPracticeLang}
                >
                  {selectedPracticeLang 
                    ? `Start Practicing ${LANGUAGES.find(l => l.id === selectedPracticeLang)?.name}` 
                    : 'Select language to start'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingPractice;