import React, { useState } from 'react';
import CodingPractice from './CodingPractice';
import ResumeAnalyzer from './ResumeAnalyzer';

const RESOURCES = {
  coding: [
    { id: 1, title: "LeetCode", description: "Practice coding problems", url: "https://leetcode.com" },
    { id: 2, title: "HackerRank", description: "Code challenges and competitions", url: "https://hackerrank.com" },
    { id: 3, title: "CodeChef", description: "Competitive programming platform", url: "https://codechef.com" }
  ],
  aptitude: [
    { 
      id: 1, 
      title: "Aptitude Preparation", 
      description: "Quantitative aptitude practice", 
      resources: [
        { type: "Documentation", url: "https://www.indiabix.com/aptitude/questions-and-answers/" },
        { type: "YouTube", url: "https://youtu.be/hlyal4sR0m8?si=dFhi7pYhLVMM8hY2" }
      ]
    },
    { 
      id: 2, 
      title: "Logical Reasoning", 
      description: "Practice logical reasoning questions", 
      resources: [
        { type: "Documentation", url: "https://www.indiabix.com/logical-reasoning/questions-and-answers/" },
        { type: "YouTube", url: "https://youtu.be/x0WkptLF6oE?si=eKQ4413YeH8YdhqU" }
      ]
    },
    { 
      id: 3, 
      title: "Verbal Ability", 
      description: "Improve your verbal skills", 
      resources: [
        { type: "Documentation", url: "https://www.indiabix.com/verbal-ability/questions-and-answers/" },
        { type: "YouTube", url: "https://youtu.be/TNkq01wrqUg?si=73GSl9BKy617fKlo" }
      ]
    }
  ],
  communication: [
    { 
      id: 1, 
      title: "Soft Skills Guide", 
      description: "Improve communication skills", 
      resources: [
        { type: "Documentation", url: "https://www.skillsyouneed.com/ips/communication-skills.html" },
        { type: "YouTube", url: "https://www.youtube.com/@TEDx" }
      ]
    },
    { 
      id: 2, 
      title: "Interview Communication", 
      description: "How to communicate effectively in interviews", 
      resources: [
        { type: "Documentation", url: "https://www.interviewbit.com/interview-communication-tips/" },
        { type: "YouTube", url: "https://youtu.be/NxKDHq4ts5A?si=hNnZpm1Y_NoTPyBA" }
      ]
    },
    { 
      id: 3, 
      title: "Body Language Tips", 
      description: "Non-verbal communication matters", 
      resources: [
        { type: "Documentation", url: "https://www.mindtools.com/pages/article/newLDR_75.htm" },
        { type: "YouTube", url: "https://youtu.be/PCWVi5pAa30?si=cJU2zGpsdrFma_6K" }
      ]
    }
  ],
  resume: [
    { id: 1, title: "ResumeTemplates", description: "Professional Resume templates", url: "https://www.overleaf.com/latex/templates/tagged/cv" },
    { id: 2, title: "LaTeX Resume Examples", description: "Professional LaTeX Resume examples", url: "https://www.overleaf.com/gallery/tagged/cv" },
    { id: 3, title: "LinkedIn Profile Optimization", description: "Optimize your LinkedIn profile to stand out and attract recruiters.", url: "https://www.youtube.com/@andylacivita" }
  ]
};

const ResourcesSection = () => {
  const [activeResourceTab, setActiveResourceTab] = useState('coding');

  return (
    <section className="resources-section">
      <h2>Placement Preparation Resources</h2>
      
      <div className="resources-tabs">
        <button 
          className={`resource-tab ${activeResourceTab === 'coding' ? 'active' : ''}`}
          onClick={() => setActiveResourceTab('coding')}
        >
          Coding Practice
        </button>
        <button 
          className={`resource-tab ${activeResourceTab === 'aptitude' ? 'active' : ''}`}
          onClick={() => setActiveResourceTab('aptitude')}
        >
          Aptitude & Reasoning
        </button>
        <button 
          className={`resource-tab ${activeResourceTab === 'communication' ? 'active' : ''}`}
          onClick={() => setActiveResourceTab('communication')}
        >
          Communication Skills
        </button>
        <button 
          className={`resource-tab ${activeResourceTab === 'resume' ? 'active' : ''}`}
          onClick={() => setActiveResourceTab('resume')}
        >
          CV & Resume
        </button>
      </div>

      {/* Coding Practice */}
      {activeResourceTab === 'coding' && (
        <CodingPractice resources={RESOURCES.coding} />
      )}

      {/* Aptitude & Reasoning */}
      {activeResourceTab === 'aptitude' && (
        <div className="resource-content">
          <h3>Aptitude & Reasoning Practice</h3>
          <div className="resources-grid">
            {RESOURCES.aptitude.map(resource => (
              <div key={resource.id} className="resource-card">
                <h4>{resource.title}</h4>
                <p>{resource.description}</p>
                {resource.resources.map((res, idx) => (
                  <a key={idx} href={res.url} target="_blank" rel="noopener noreferrer" className="resource-link">
                    {res.type} → 
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Communication Skills */}
      {activeResourceTab === 'communication' && (
        <div className="resource-content">
          <h3>Communication & Soft Skills Resources</h3>
          <div className="resources-grid">
            {RESOURCES.communication.map(resource => (
              <div key={resource.id} className="resource-card">
                <h4>{resource.title}</h4>
                <p>{resource.description}</p>
                {resource.resources.map((res, idx) => (
                  <a key={idx} href={res.url} target="_blank" rel="noopener noreferrer" className="resource-link">
                    {res.type} → 
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resume Section */}
      {activeResourceTab === 'resume' && (
        <ResumeAnalyzer resources={RESOURCES.resume} />
      )}
    </section>
  );
};

export default ResourcesSection;
