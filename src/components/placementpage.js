import React, { useState, useEffect } from 'react';
import './placementpage.css';

// Import components
import ResourcesSection from './ResourcesSection';
import CompaniesSection from './CompaniesSection';
import MockTestsSection from './MockTestsSection';
import RoadmapsSection from './RoadmapsSection';
import InterviewSection from './InterviewSection';
import Bask from './Bask';

// Mock data
const COMPANIES = ['All', 'TCS', 'Infosys', 'Amazon', 'Microsoft', 'Google', 'Facebook'];
const AI_TIPS = [
  "Practice regularly to improve your problem-solving speed.",
  "Focus on data structures and algorithms - they form the core of coding interviews.",
  "Don't just solve problems, understand the patterns and optimize your solutions.",
  "Communicate your thought process clearly during interviews.",
  "Prepare behavioral questions along with technical ones.",
  "Take mock tests under timed conditions to simulate real interview pressure.",
  "Review your mistakes and learn from them.",
  "Stay calm and confident during the actual interview."
];

const PlacementPage = () => {
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [activeTab, setActiveTab] = useState('resources');
  const [randomTip, setRandomTip] = useState('');

  // Initialize random tip
  useEffect(() => {
    setRandomTip(AI_TIPS[Math.floor(Math.random() * AI_TIPS.length)]);
  }, []);

  // Navigation items
  const navItems = [
    { id: 'resources', label: 'Resources' },
    { id: 'companies', label: 'Companies' },
    { id: 'roadmaps', label: 'Preparation Roadmaps' },
    { id: 'mocktests', label: 'Mock Test & Quiz' },
    { id: 'interview', label: 'Interview Section' },
    { id: 'bask', label: 'Bask' },
  ];

  return (
    <div className="placement-page">
      {/* Top Navigation Bar */}
      <nav className="placement-nav">
        <div className="nav-container">
          <h1 className="nav-logo">LearnWeave Placement</h1>
          <ul className="nav-menu">
            {navItems.map(item => (
              <li key={item.id}>
                <button 
                  className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="placement-container">
        <main className="placement-content">
          {/* Resources Section */}
          {activeTab === 'resources' && (
            <ResourcesSection />
          )}

          {/* Companies Section */}
          {activeTab === 'companies' && (
            <CompaniesSection 
              selectedCompany={selectedCompany}
              setSelectedCompany={setSelectedCompany}
              companies={COMPANIES}
            />
          )}

          {/* Mock Tests Section */}
          {activeTab === 'mocktests' && (
            <MockTestsSection />
          )}

          {/* Roadmaps Section */}
          {activeTab === 'roadmaps' && (
            <RoadmapsSection />
          )}

          {/* Interview Section */}
          {activeTab === 'interview' && (
            <InterviewSection />
          )}
          {/* Bask Section */}
          {activeTab === 'bask' && (
            <Bask />
          )}
        </main>
      </div>
    </div>
  );
};

export default PlacementPage;