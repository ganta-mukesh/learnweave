import { useNavigate } from 'react-router-dom'; // Import useNavigate
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './NotificationPage.css'; // Import your CSS file
const NotificationPage = ({ user, setNotificationCount }) => {
    const [notifications, setNotifications] = useState([]);
    const navigate = useNavigate(); // Initialize navigate

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:4000/notifications', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setNotifications(response.data.notifications);
                // Update the count in the parent component
                const unseenCount = response.data.notifications.filter(
                    n => !n.seenBy.includes(user.email)
                ).length;
                setNotificationCount(unseenCount);
            } catch (error) {
                console.error('Error fetching notifications:', error);
            }
        };

        fetchNotifications();
    }, [setNotificationCount, user.email]);

    const markNotificationsAsSeen = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:4000/notifications/mark-seen', {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setNotifications([]);
            setNotificationCount(0); // Reset count in parent
        } catch (error) {
            console.error('Error marking notifications as seen:', error);
        }
    };

    /*const handleNotificationClick = async (challengeId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:4000/challenges/${challengeId}`, // Fetch the challenge by ID
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (response.data.challenge) {
                // Redirect to SolvingPage with the challenge details
                navigate('/solve', { state: { challenge: response.data.challenge } });
            } else {
                console.error('Challenge not found');
            }
        } catch (error) {
            console.error('Error fetching challenge:', error);
        }
    };*/
    const handleNotificationClick = async (challengeId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:4000/challenges/${challengeId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            if (response.data.challenge) {
                // Pass the entire challenge data to the SolvingPage
                navigate('/solve', { 
                    state: { 
                        challenge: response.data.challenge,
                        language: response.data.challenge.language 
                    } 
                });
            } else {
                console.error('Challenge not found');
            }
        } catch (error) {
            console.error('Error fetching challenge:', error);
        }
    };

    return (
        <div className="notifications-container">
            <h2 className="notifications-title">Notifications</h2>
            <div className="notifications-content">
                {notifications.length === 0 ? (
                    <p className="no-notifications">No new notifications</p>
                ) : (
                    notifications.map((notification, index) => (
                        <div
                            key={index}
                            className={`notification-card ${!notification.seenBy.includes(user.email) ? 'unseen' : ''}`}
                            onClick={() => handleNotificationClick(notification.challengeId)} // Add onClick handler
                        >
                            <p>{notification.message}</p>
                            <small className="notification-time">
                                {new Date(notification.createdAt).toLocaleString()}
                            </small>
                        </div>
                    ))
                )}
            </div>
            {notifications.length > 0 && (
                <button onClick={markNotificationsAsSeen} className="mark-seen-button">
                    Mark all as Read
                </button>
            )}
        </div>
    );
};

export default NotificationPage;