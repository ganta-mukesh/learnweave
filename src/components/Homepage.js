import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Coins,
  LogOut,
  Menu,
  MessageSquare,
  User,
  LayoutDashboard,
  ChevronRight,
  ChevronDown,
  Users,
  Code,
  Languages
} from 'lucide-react';
import { FaJs, FaPython, FaDatabase, FaCuttlefish, FaJava, FaRobot } from 'react-icons/fa';
import { SiCplusplus } from 'react-icons/si';
import './Homepage.css';

const HomePage = ({ user, handleSignOut }) => {
  const navigate = useNavigate();
  const [totalSupercoins, setTotalSupercoins] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: user.fullName,
    email: user.email,
    photo: user.photo,
    supercoins: user.supercoins || 0,
  });
  const [updatedProfile, setUpdatedProfile] = useState({
    fullName: user.fullName,
    photo: null,
  });
  const [notificationCount, setNotificationCount] = useState(0);
  const [statsData, setStatsData] = useState({
    totalUsers: 0,
    totalChallenges: 0,
    supportedLanguages: 6 // Default value
  });

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const response = await fetch('http://localhost:4000/get-profile', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setProfileData(data.user);
        setTotalSupercoins(data.user.supercoins);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:4000/notifications', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        const unseenCount = data.notifications.filter(
          notification => !notification.seenBy.includes(user.email)
        ).length;
        setNotificationCount(unseenCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user.email]);

  // Fetch stats data
  const fetchStatsData = async () => {
    try {
      // Fetch total users
      const usersResponse = await fetch('http://localhost:4000/total-users', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const usersData = await usersResponse.json();
      
      // Fetch total challenges
      const challengesResponse = await fetch('http://localhost:4000/total-challenges', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const challengesData = await challengesResponse.json();
      
      // Fetch supported languages (though it's fixed at 6)
      const languagesResponse = await fetch('http://localhost:4000/supported-languages', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const languagesData = await languagesResponse.json();
      
      setStatsData({
        totalUsers: usersData.totalUsers || 0,
        totalChallenges: challengesData.totalChallenges || 0,
        supportedLanguages: languagesData.supportedLanguages || 6
      });
    } catch (error) {
      console.error('Error fetching stats data:', error);
    }
  };

  // Fetch profile, notifications and stats on component mount
  useEffect(() => {
    fetchUserProfile();
    fetchNotifications();
    fetchStatsData();
  }, [fetchNotifications]);

  const handleSignOutClick = () => {
    console.log('Signing out...');
    handleSignOut();
    setTimeout(() => {
      console.log('Redirecting to landing page...');
      navigate('/');
    }, 100);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setIsProfileOpen(false);
  };

  const handleSaveClick = async () => {
    const formData = new FormData();
    formData.append('email', profileData.email);
    formData.append('fullName', updatedProfile.fullName);
    if (updatedProfile.photo) {
      formData.append('photo', updatedProfile.photo);
    }

    try {
      const response = await fetch('http://localhost:4000/update-profile', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setProfileData({
          ...profileData,
          fullName: data.user.fullName,
          photo: data.user.photo,
        });
        setIsEditing(false);
      } else {
        console.error('Failed to update profile:', data.message);
      }
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedProfile({ ...updatedProfile, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const photoURL = URL.createObjectURL(file);
      setUpdatedProfile({ ...updatedProfile, photo: file, photoURL });
    }
  };

  const handleNotificationClick = async () => {
    try {
      const response = await fetch('http://localhost:4000/notifications/mark-seen', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        setNotificationCount(0);
        navigate('/notifications');
      }
    } catch (error) {
      console.error('Error marking notifications as seen:', error);
    }
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return `Good morning, ${profileData.fullName}`;
    if (hour < 16) return `Good afternoon, ${profileData.fullName}`;
    return `Good evening, ${profileData.fullName}`;
  };

  const languageCards = [
    { name: 'JavaScript', color: 'yellow', icon: <FaJs /> },
    { name: 'Python', color: 'blue', icon: <FaPython /> },
    { name: 'Java', color: 'red', icon: <FaJava /> },
    { name: 'SQL', color: 'orange', icon: <FaDatabase /> },
    { name: 'C', color: 'purple', icon: <FaCuttlefish /> },
    { name: 'C++', color: 'green', icon: <SiCplusplus /> },
    { name: 'AI/ML', color: 'red', icon: <FaRobot /> },
    { name: 'DSA', color: 'purple', icon: <SiCplusplus /> },
  ];

  const statsCards = [
    { 
      title: "Total Users", 
      count: statsData.totalUsers, 
      icon: <Users className="stats-icon" />,
      color: 'blue'
    },
    { 
      title: 'Total Challenges', 
      count: statsData.totalChallenges, 
      icon: <Code className="stats-icon" />,
      color: 'green'
    },
    { 
      title: 'Supported Languages', 
      count: statsData.supportedLanguages, 
      icon: <Languages className="stats-icon" />,
      color: 'purple'
    },
  ];

  const navigateToSolvingPage = (language) => {
    const uppercaseLanguage = language.toUpperCase();
    console.log('Navigating to Solving Page with language:', uppercaseLanguage);
    navigate('/solve', { state: { language: uppercaseLanguage } });
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          <div className="header-left">
            <Menu className="menu-icon mobile-only" />
            <h1>LEARN WEAVE</h1>
          </div>
          <div className="header-right">
            <div className="supercoins">
              <Coins className="coin-icon" />
              <span>{totalSupercoins}</span>
            </div>
            <button className="challenge-button-header" onClick={() => navigate('/challenge')}>
              <span>Challenge</span>
            </button>
            <button className="learning-button" onClick={() => navigate('/learning')}>
              <span>Learning</span>
            </button>
            <button className="interview-button" onClick={() => navigate('/interview-questions')}>
              <MessageSquare className="message-icon" />
              <span>Interview Questions</span>
            </button>  
            <button className="placement-button" onClick={() => navigate('/placement')}>
                <span>Placement Prep</span>
            </button>
            <div className="notification-icon-container" onClick={handleNotificationClick}>
              <Bell className="notification-icon" />
              {notificationCount > 0 && (
                <span className="notification-badge">{notificationCount}</span>
              )}
            </div>
            <div className="profile-dropdown">
              <div className="profile-icon" onClick={toggleProfile}>
                {profileData.photo ? (
                  <img src={`http://localhost:4000${profileData.photo}`} alt="Profile" className="avatar-icon rounded-icon" />
                ) : (
                  <User className="avatar-icon rounded-icon" />
                )}
                <ChevronDown className="dropdown-arrow" />
              </div>

              {isProfileOpen && (
                <div className="profile-dropdown-menu">
                  <button className="dropdown-item" onClick={handleEditClick}>
                    <User className="dropdown-icon" />
                    <span>Profile</span>
                  </button>
                  <button className="dropdown-item" onClick={() => navigate('/dashboard')}>
                    <LayoutDashboard className="dropdown-icon" />
                    <span>Dashboard</span>
                  </button>
                  <hr className="dropdown-divider" />
                  <button className="dropdown-item logout-button" onClick={handleSignOutClick}>
                    <LogOut className="dropdown-icon" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="welcome-message">
        <h2>{getWelcomeMessage()}</h2>
      </div>

      <div className="main-container">
        <div className="content-wrapper">
          <main className="main-content">
            <div className="stats-cards">
              {statsCards.map((card, index) => (
                <div key={index} className={`stats-card ${card.color}`}>
                  <div className="stats-card-content">
                    <div className="stats-icon-container">
                      {card.icon}
                    </div>
                    <div className="stats-text">
                      <h3>{card.title}</h3>
                      <span className="stats-count">{card.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

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
                      <button className="solve-button" onClick={() => navigateToSolvingPage(card.name)}>
                        Solve
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>

      {isEditing && (
        <div className="edit-profile-modal">
          <div className="edit-profile-content">
            <h2>Edit Profile</h2>
            <input
              type="text"
              name="fullName"
              value={updatedProfile.fullName}
              onChange={handleInputChange}
              placeholder="Full Name"
              className="edit-input"
            />
            <input
              type="file"
              name="photo"
              onChange={handleFileChange}
              className="edit-input"
            />
            <button className="save-button" onClick={handleSaveClick}>
              Save
            </button>
            <button className="cancel-button" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;