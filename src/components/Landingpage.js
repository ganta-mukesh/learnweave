import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Landingpage.css';

const LandingPage = () => {
    const navigate = useNavigate();

    const handleGetStarted = async () => {
        const token = localStorage.getItem('token');
        const email = localStorage.getItem('email');

        if (token && email) {
            try {
                const response = await fetch('http://localhost:4000/check-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });
                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('token', data.token); // Update token
                    localStorage.setItem('fullName', data.user.fullName);
                    localStorage.setItem('email', data.user.email);
                    navigate('/home'); // Redirect to home page
                } else {
                    console.warn('Invalid token, redirecting to login.');
                    localStorage.clear();
                    navigate('/login'); // Redirect to login page
                }
            } catch (error) {
                console.error('Error checking user:', error);
                localStorage.clear();
                navigate('/signup'); // Redirect to signup page
            }
        } else {
            navigate('/signup'); // Redirect to signup page
        }
    };

    return (
        <div className="landing-container">
            <div className="background-image"></div>
            <div className="overlay"></div>
            <h1 className="title">LEARN WEAVE</h1>
            <p className="caption">We Learn, We Teach, We Grow</p>
            <button className="get-started-button" onClick={handleGetStarted}>Get Started</button>
        </div>
    );
};

export default LandingPage;
