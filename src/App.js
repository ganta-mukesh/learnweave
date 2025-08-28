import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom'; // Import useNavigate
import LandingPage from './components/Landingpage';
import AuthPage from './components/Authpage';
import HomePage from './components/Homepage';
import ChallengePage from './components/Challengepage';
import NotificationPage from './components/NotificationPage';
import SolvingPage from './components/SolvingPage';
import LearningPage from './components/Learningpage';
import InterviewQuestions from './components/InterviewPage';
import Dashboard from './components/Dashboardpage';
import PlacementPage from './components/placementpage'
// MainApp component that uses useNavigate
const MainApp = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const email = localStorage.getItem('email');
        const fullName = localStorage.getItem('fullName');
        if (token && email && fullName) {
            setIsAuthenticated(true);
            setUser({ fullName, email });
        } else {
            setIsAuthenticated(false);
            setUser(null);
        }
    }, []);

    const handleSignupSuccess = () => {
        console.log("Signup successful! Redirecting to login...");
        navigate('/login');
    };

    const handleLoginSuccess = async (token) => {
        console.log("Login successful! Token received:", token);
        localStorage.setItem("token", token);

        try {
            const response = await fetch('http://localhost:4000/get-profile', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch user profile');

            const data = await response.json();
            console.log("User details:", data.user);

            setIsAuthenticated(true);
            setUser(data.user);

            localStorage.setItem('fullName', data.user.fullName);
            localStorage.setItem('email', data.user.email);

            console.log("Redirecting to /home...");
            navigate('/home');
        } catch (error) {
            console.error("Error fetching user details:", error);
        }
    };

    const handleLogout = () => {
        console.log('Clearing localStorage...');
        localStorage.clear();
        setIsAuthenticated(false);
        setUser(null);
        navigate('/');
    };

    return (
        <Routes>
            <Route path="/" element={isAuthenticated ? <Navigate to="/home" /> : <LandingPage />} />
            <Route path="/signup" element={isAuthenticated ? <Navigate to="/home" /> : <AuthPage isSignup={true} onAuthSuccess={handleSignupSuccess} />} />
            <Route path="/login" element={isAuthenticated ? <Navigate to="/home" /> : <AuthPage isSignup={false} onAuthSuccess={handleLoginSuccess} />} />
            <Route path="/home" element={isAuthenticated ? <HomePage user={user} handleSignOut={handleLogout} /> : <Navigate to="/" />} />
            <Route path="/placement" element={<PlacementPage />} />
            <Route path="/challenge" element={isAuthenticated ? <ChallengePage /> : <Navigate to="/" />} />
            <Route path="/notifications" element={isAuthenticated ? <NotificationPage user={user} /> : <Navigate to="/" />} />
            <Route path="/solve" element={isAuthenticated ? <SolvingPage /> : <Navigate to="/" />} />
            <Route path="/learning" element={isAuthenticated ? <LearningPage /> : <Navigate to="/" />} />
            <Route path="/interview-questions" element={isAuthenticated ? <InterviewQuestions /> : <Navigate to="/" />} />
            <Route path="/dashboard" element={isAuthenticated ? <Dashboard user={user} /> : <Navigate to="/" />} />
        </Routes>
    );
};

// App component that wraps MainApp in a Router
const App = () => {
    return (
        <Router>
            <MainApp />
        </Router>
    );
};

export default App;