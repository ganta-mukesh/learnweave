import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaJs, FaPython, FaDatabase, FaCuttlefish, FaLeaf, FaRobot } from 'react-icons/fa';
import './LearningPage.css'; // CSS file for styling

const LearningPage = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);

  const languageCards = [
    {
      name: 'JavaScript',
      color: 'yellow',
      icon: <FaJs />,
      playlistUrl: 'https://youtube.com/playlist?list=PLlasXeu85E9cQ32gLCvAvr9vNaUccPVNP&si=yNzVDqJ9O_hA4V7M',
    },
    {
      name: 'Python',
      color: 'blue',
      icon: <FaPython />,
      playlistUrl: 'https://youtube.com/playlist?list=PLdo5W4Nhv31bZSiqiOL5ta39vSnBxpOPT&si=0PDlPTv6LrEkNid1',
    },
    {
      name: 'SQL',
      color: 'orange',
      icon: <FaDatabase />,
      playlistUrl: 'https://youtube.com/playlist?list=PLNcg_FV9n7qZY_2eAtUzEUulNjTJREhQe&si=HiAaGaG7J8sn0aGs',
    },
    {
      name: 'C',
      color: 'purple',
      icon: <FaCuttlefish />,
      playlistUrl: 'https://youtube.com/playlist?list=PLdo5W4Nhv31a8UcMN9-35ghv8qyFWD9_S&si=w5_xZkNV4kQYMOMK',
    },
    {
      name: 'MongoDB',
      color: 'green',
      icon: <FaLeaf />,
      playlistUrl: 'https://youtube.com/playlist?list=PLA3GkZPtsafZydhN4nP0h7hw7PQuLsBv1&si=eCO342ZBoZOBh9SC',
    },
    {
      name: 'AI/ML',
      color: 'red',
      icon: <FaRobot />,
      playlistUrl: 'https://youtube.com/playlist?list=PLKnIA16_Rmvbr7zKYQuBfsVkjoLcJgxHH&si=8w-b5RQlHcTFFhDk',
    },
  ];

  return (
    <div className="learning-container">
      <div className="learning-header">
        <h1>LEARNWEAVE'S LEARNING PLATFORM</h1>
        <p className="learning-caption">
          Code, Learn, Collaborate – Growing Together in Tech!
        </p>
      </div>

      <div className="main-container">
        <div className="content-wrapper">
          <main className="main-content">
            <div className="language-cards">
              {languageCards.map((card, index) => (
                <div
                  key={index}
                  className={`language-card ${card.color}`}
                  onMouseEnter={() => setHoveredCard(card.name)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="card-content">
                    <span className="card-icon">{card.icon}</span>
                    <h3>{card.name}</h3>
                  </div>
                  {hoveredCard === card.name && (
                    <div className="card-actions">
                      <a
                        href={card.playlistUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="learn-button"
                      >
                        Learn
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default LearningPage;
