import React, { useState, useEffect } from 'react';
import { User, Code, Award, CheckCircle, Gift } from 'lucide-react';
import { Coins } from 'lucide-react';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('progress');
  const [progressValues, setProgressValues] = useState({});
  const [userStats, setUserStats] = useState({
    totalChallenges: 0,
    totalSolutions: 0,
    languages: []
  });
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({
    fullName: '',
    photo: null,
    email: '',
    supercoins: 0
  });
  const [showRedeemModal, setShowRedeemModal] = useState(false);

  // Constants for targets
  const TOTAL_CHALLENGES_TARGET = 300;
  const CHALLENGES_PER_LANGUAGE = TOTAL_CHALLENGES_TARGET / 6; // 50 per language

  // Language configuration
  const languageConfig = {
    'JAVASCRIPT': {
      displayName: 'JavaScript',
      color: 'blue'
    },
    'PYTHON': {
      displayName: 'Python',
      color: 'yellow'
    },
    'SQL': {
      displayName: 'SQL',
      color: 'pink'
    },
    'C': {
      displayName: 'C',
      color: 'green'
    },
    'MONGODB': {
      displayName: 'MongoDB',
      color: 'purple'
    },
    'AI/ML': {
      displayName: 'AI/ML',
      color: 'orange'
    }
  };

  const backendLanguages = Object.keys(languageConfig);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch profile data including supercoins
        const profileResponse = await axios.get('http://localhost:4000/get-profile', {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token')}` 
          }
        });

        if (profileResponse.data.user) {
          let photoUrl = profileResponse.data.user.photo;
          if (photoUrl && !photoUrl.startsWith('http')) {
            photoUrl = `http://localhost:4000${photoUrl}`;
          }
          
          setUserProfile({
            fullName: profileResponse.data.user.fullName,
            photo: photoUrl,
            email: profileResponse.data.user.email,
            supercoins: profileResponse.data.user.supercoins || 0
          });
        }

        // Fetch challenges and solutions counts
        const [challengesRes, solutionsRes] = await Promise.all([
          axios.get('http://localhost:4000/api/user-challenges', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }),
          axios.get('http://localhost:4000/api/user-solutions', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          })
        ]);

        // Calculate language stats
        const languageStats = backendLanguages.map(langKey => {
          const challengesCount = challengesRes.data[langKey] || 0;
          const solutionsCount = solutionsRes.data[langKey] || 0;

          const challengeProgress = Math.min(
            100, 
            Math.floor((challengesCount / CHALLENGES_PER_LANGUAGE) * 100)
          );
            
          const solutionProgress = challengesCount > 0
            ? Math.min(100, Math.floor((solutionsCount / challengesCount) * 100))
            : 0;

          return {
            backendName: langKey,
            displayName: languageConfig[langKey].displayName,
            challengesCount,
            solutionsCount,
            challengeProgress,
            solutionProgress,
            color: languageConfig[langKey].color,
            solutionColor: `${languageConfig[langKey].color}-sol`
          };
        });

        // Calculate totals
        const totalChallenges = Object.values(challengesRes.data).reduce((a, b) => a + b, 0);
        const totalSolutions = Object.values(solutionsRes.data).reduce((a, b) => a + b, 0);

        setUserStats({
          totalChallenges,
          totalSolutions,
          languages: languageStats,
          overallChallengeProgress: Math.min(
            100, 
            Math.floor((totalChallenges / TOTAL_CHALLENGES_TARGET) * 100)
          ),
          overallSolutionProgress: totalChallenges > 0
            ? Math.min(100, Math.floor((totalSolutions / totalChallenges) * 100))
            : 0,
          totalPostedChallenges: totalChallenges
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (!loading) {
      const animateProgress = () => {
        const duration = 1500;
        const startTime = Date.now();
        
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          const newValues = {};
          userStats.languages.forEach(lang => {
            newValues[`${lang.backendName}-challenge`] = Math.floor(progress * lang.challengeProgress);
            newValues[`${lang.backendName}-solution`] = Math.floor(progress * lang.solutionProgress);
          });
          
          newValues['overall-challenge'] = Math.floor(progress * userStats.overallChallengeProgress);
          newValues['overall-solution'] = Math.floor(progress * userStats.overallSolutionProgress);
          
          setProgressValues(newValues);
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        animate();
      };
      
      animateProgress();
    }
  }, [activeTab, loading, userStats]);

  const handleRedeemClick = () => {
    setShowRedeemModal(true);
  };

  const closeRedeemModal = () => {
    setShowRedeemModal(false);
  };

  const renderProgressBars = (type) => {
    if (loading) return <div className="loading">Loading...</div>;
    
    return (
      <div className="progress-group">
        <h4>{type === 'challenge' ? 'Challenges Progress' : 'Solutions Progress'}</h4>
        <div className="target-info">
          {type === 'challenge' 
            ? `Target: ${TOTAL_CHALLENGES_TARGET} challenges (50 per language)` 
            : `Solved: ${userStats.totalSolutions} of ${userStats.totalPostedChallenges} posted challenges`}
        </div>
        
        {/* Overall progress card */}
        <div className="stats-card">
          <h4>Overall {type === 'challenge' ? 'Challenges' : 'Solutions'}</h4>
          <div className="stat-value">
            {type === 'challenge' 
              ? `${userStats.totalChallenges}/${TOTAL_CHALLENGES_TARGET}`
              : `${userStats.totalSolutions}/${userStats.totalPostedChallenges}`}
          </div>
          <div className="progress-bar-horizontal">
            <div 
              className="progress-fill" 
              style={{
                width: `${progressValues[`overall-${type}`] || 0}%`,
                backgroundColor: type === 'challenge' ? '#3498db' : '#2ecc71'
              }}
            ></div>
          </div>
          <p>{type === 'challenge' ? 'Keep challenging yourself!' : 'Great problem-solving skills!'}</p>
        </div>
        
        <div className="progress-container">
          {userStats.languages.map((lang, index) => (
            <div key={`${type}-${index}`} className="progress-wrapper">
              <div className={`progress ${type === 'challenge' ? lang.color : lang.solutionColor}`}>
                <span className="progress-left">
                  <span className="progress-bar"></span>
                </span>
                <span className="progress-right">
                  <span className="progress-bar"></span>
                </span>
                <div className="inner-circle"></div>
                <div className="progress-value">
                  {progressValues[`${lang.backendName}-${type}`] || 0}%
                </div>
              </div>
              <p>{lang.displayName}</p>
              <div className="progress-details">
                {type === 'challenge' 
                  ? `${lang.challengesCount}/${CHALLENGES_PER_LANGUAGE}` 
                  : `${lang.solutionsCount}/${lang.challengesCount}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <div className="left-panel">
        <div className="panel-header">
          <h3>Dashboard Menu</h3>
        </div>
        <ul className="panel-menu">
          <li className={activeTab === 'progress' ? 'active' : ''} onClick={() => setActiveTab('progress')}>
            <Code size={18} /> Progress
          </li>
          <li className={activeTab === 'challenges' ? 'active' : ''} onClick={() => setActiveTab('challenges')}>
            <Award size={18} /> Challenges
          </li>
          <li className={activeTab === 'solutions' ? 'active' : ''} onClick={() => setActiveTab('solutions')}>
            <CheckCircle size={18} /> Solutions
          </li>
          <li onClick={handleRedeemClick}>
            <Gift size={18} /> Redeem
          </li>
        </ul>
      </div>

      <div className="right-content">
        <div className="user-profile-header">
          <div className="user-avatar">
            {userProfile.photo ? (
              <img 
                src={userProfile.photo} 
                alt={userProfile.fullName} 
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = '';
                }}
              />
            ) : (
              <User size={48} />
            )}
          </div>
          <div className="user-info">
            <h2>Welcome to LearnWeave Dashboard</h2>
            <div className="user-details">
              <span className="user-name">{userProfile.fullName || 'Guest User'}</span>
              <div className="supercoins-badge">
                <Coins size={18} className="coin-icon" />
                <span className="coin-count">{userProfile.supercoins} Supercoins</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          {activeTab === 'progress' && (
            <div className="progress-section">
              <h3>Language Proficiency</h3>
              {renderProgressBars('challenge')}
              {renderProgressBars('solution')}
            </div>
          )}

          {activeTab === 'challenges' && (
            <div className="challenges-section">
              <h3>Your Challenges</h3>
              <div className="stats-card">
                <h4>Total Challenges Posted</h4>
                <div className="stat-value">{userStats.totalChallenges}/{TOTAL_CHALLENGES_TARGET}</div>
                <div className="progress-bar-horizontal">
                  <div 
                    className="progress-fill" 
                    style={{
                      width: `${userStats.overallChallengeProgress}%`,
                      backgroundColor: '#3498db'
                    }}
                  ></div>
                </div>
                <p>Keep challenging yourself!</p>
              </div>
              {renderProgressBars('challenge')}
            </div>
          )}

          {activeTab === 'solutions' && (
            <div className="solutions-section">
              <h3>Your Solutions</h3>
              <div className="stats-card">
                <h4>Challenges Solved</h4>
                <div className="stat-value">{userStats.totalSolutions}/{userStats.totalPostedChallenges}</div>
                <div className="progress-bar-horizontal">
                  <div 
                    className="progress-fill" 
                    style={{
                      width: `${userStats.overallSolutionProgress}%`,
                      backgroundColor: '#2ecc71'
                    }}
                  ></div>
                </div>
                <p>Great problem-solving skills!</p>
              </div>
              {renderProgressBars('solution')}
            </div>
          )}
        </div>
      </div>

      {showRedeemModal && (
        <div className="redeem-modal">
          <div className="redeem-modal-content">
            <h3>Redeem Supercoins</h3>
            <p>You have {userProfile.supercoins} Supercoins available</p>
            <div className="redeem-options">
              <div className="redeem-option">
                <h4>Premium Course (100 Supercoins)</h4>
                <button disabled={userProfile.supercoins < 100}>Redeem</button>
              </div>
              <div className="redeem-option">
                <h4>Interview Prep Kit (50 Supercoins)</h4>
                <button disabled={userProfile.supercoins < 50}>Redeem</button>
              </div>
              <div className="redeem-option">
                <h4>Certificate (30 Supercoins)</h4>
                <button disabled={userProfile.supercoins < 30}>Redeem</button>
              </div>
            </div>
            <button className="close-button" onClick={closeRedeemModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;