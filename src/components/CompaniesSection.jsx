import React, { useEffect, useState } from 'react';

const baseURL = process.env.REACT_APP_API_URL || "http://localhost:4000";
const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GEMINI_API_KEY = "AIzaSyC2Psvxy3aRne0-berI59WXCCPaKRW_5-g";

const COMPANIES = ['All', 'TCS', 'Infosys', 'Amazon', 'Microsoft', 'Google', 'Facebook'];

// Default templates (minimum 6 points)
const DEFAULT_INTERVIEW_PROCESS = {
  TCS: [
    "Online Aptitude Test",
    "Technical Test (Programming/Domain Knowledge)",
    "Technical Interview 1",
    "Technical Interview 2",
    "HR Interview",
    "Offer Letter"
  ],
  Infosys: [
    "Aptitude Test",
    "Technical Test / Coding Round",
    "Technical Interview",
    "Managerial Round",
    "HR Interview",
    "Offer"
  ],
  Amazon: [
    "Online Assessment (Coding & Aptitude)",
    "Technical Phone Interview",
    "Onsite Technical Interview",
    "Leadership Principles Interview",
    "HR Interview",
    "Offer"
  ],
  Microsoft: [
    "Online Coding Test",
    "Technical Phone Interview",
    "Onsite Interviews (Technical & Behavioral)",
    "Coding Challenges",
    "Managerial Round",
    "HR Interview & Offer"
  ],
  Google: [
    "Online Assessment / Coding Test",
    "Phone/Google Meet Technical Interview",
    "Onsite Interviews",
    "System Design Interview",
    "Behavioral Interview",
    "Offer"
  ],
  Facebook: [
    "Online Assessment / Coding Challenge",
    "Technical Phone Interview",
    "Onsite Technical Interviews",
    "System Design Interview",
    "Behavioral / Leadership Interview",
    "HR Discussion & Offer"
  ]
};

const DEFAULT_COMPANY_CULTURE = {
  TCS: [
    "Collaborative environment",
    "Emphasis on learning and growth",
    "Diversity and inclusion",
    "Structured work processes",
    "Global exposure",
    "Employee-friendly policies"
  ],
  Infosys: [
    "Focus on innovation",
    "Learning-oriented culture",
    "Professional work environment",
    "Team collaboration",
    "Corporate social responsibility",
    "Employee development programs"
  ],
  Amazon: [
    "Customer-first mindset",
    "Data-driven decision making",
    "Ownership and accountability",
    "Fast-paced environment",
    "Innovation encouraged",
    "Diversity and inclusion"
  ],
  Microsoft: [
    "Inclusive culture",
    "Growth opportunities",
    "Innovation-driven",
    "Collaborative work environment",
    "Focus on employee well-being",
    "Global exposure"
  ],
  Google: [
    "Open and transparent culture",
    "Innovation and creativity",
    "Work-life balance",
    "Collaboration across teams",
    "Learning and development",
    "Employee-friendly benefits"
  ],
  Facebook: [
    "Fast-paced innovation",
    "Team collaboration",
    "Open communication",
    "Focus on impact",
    "Diversity and inclusion",
    "Employee development programs"
  ]
};

const CompaniesSection = ({ selectedCompany, setSelectedCompany }) => {
  const [interviewProcess, setInterviewProcess] = useState([]);
  const [companyCulture, setCompanyCulture] = useState([]);
  const [loadingProcess, setLoadingProcess] = useState(false);
  const [loadingCulture, setLoadingCulture] = useState(false);

  useEffect(() => {
    if (!selectedCompany || selectedCompany === "All") {
      setInterviewProcess([]);
      setCompanyCulture([]);
      return;
    }

    // Fetch AI content (optional)
    const fetchAIContent = async (topic, setContent, setLoading, defaultData) => {
      setLoading(true);
      try {
        const response = await fetch(GEMINI_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GEMINI_API_KEY}`,
          },
          body: JSON.stringify({
            prompt: [
              {
                content: `List 6 concise points for ${topic} at ${selectedCompany}.`,
                type: "text"
              }
            ],
            temperature: 0.7,
            maxOutputTokens: 200,
            candidateCount: 1
          }),
        });

        const data = await response.json();
        const text =
          data.candidates?.[0]?.content?.[0]?.text ||
          data.candidates?.[0]?.content ||
          null;

        if (text) {
          // Split into points
          const points = text.split(/\n|•|-/).filter(p => p.trim()).slice(0, 6);
          setContent(points.length ? points : defaultData[selectedCompany]);
        } else {
          setContent(defaultData[selectedCompany]);
        }
      } catch (error) {
        console.error(error);
        setContent(defaultData[selectedCompany]);
      } finally {
        setLoading(false);
      }
    };

    fetchAIContent("Interview Process", setInterviewProcess, setLoadingProcess, DEFAULT_INTERVIEW_PROCESS);
    fetchAIContent("Company Culture", setCompanyCulture, setLoadingCulture, DEFAULT_COMPANY_CULTURE);
  }, [selectedCompany]);

  const navigateToGFG = () => {
    if (!selectedCompany || selectedCompany === "All") return;
    const companySlug = selectedCompany
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const url = `https://www.geeksforgeeks.org/companies/${companySlug}/articles/`;
    window.open(url, "_blank");
  };

  return (
    <section className="companies-section">
      <h2>Company Preparation</h2>

      {/* Company Filter */}
      <div className="company-filter">
        <h3>Filter by Company</h3>
        <div className="company-tags">
          {COMPANIES.map(company => (
            <button
              key={company}
              className={`company-tag ${selectedCompany === company ? 'active' : ''}`}
              onClick={() => setSelectedCompany(company)}
            >
              {company}
            </button>
          ))}
        </div>
      </div>

      {/* Company-specific resources */}
      <div className="company-resources">
        <h3>Resources for {selectedCompany}</h3>
        <div className="resources-grid">
          {/* Interview Process */}
          <div className="resource-card">
            <h4>{selectedCompany} Interview Process</h4>
            {loadingProcess ? <p>Loading...</p> : (
              <ol>
                {interviewProcess.map((item, idx) => <li key={idx}>{item}</li>)}
              </ol>
            )}
          </div>

          {/* Technical Questions */}
          <div className="resource-card">
            <h4>{selectedCompany} Technical Questions</h4>
            <p>Commonly asked technical questions at {selectedCompany}</p>
            {selectedCompany !== "All" ? (
              <button
                className="practice-company-button"
                onClick={navigateToGFG}
              >
                Go to GeeksforGeeks
              </button>
            ) : <p>Select a specific company for GeeksforGeeks link.</p>}
          </div>

          {/* Company Culture */}
          <div className="resource-card">
            <h4>{selectedCompany} Company Culture</h4>
            {loadingCulture ? <p>Loading...</p> : (
              <ul>
                {companyCulture.map((item, idx) => <li key={idx}>{item}</li>)}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompaniesSection;
