import React, { useState, useEffect } from 'react';
import './Challengepage.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // 👈 install with npm install jwt-decode

const baseURL = process.env.REACT_APP_API_URL || "http://localhost:4000";
const ChallengePage = () => {
    const [testCases, setTestCases] = useState([{ input: '', output: '' }]);
    const [steps, setSteps] = useState(['']);
    const [language, setLanguage] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [topic, setTopic] = useState('');
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [challengeType, setChallengeType] = useState('normal'); // 👈 new
    const [isAdmin, setIsAdmin] = useState(false);

    const [showMessage, setShowMessage] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    // ✅ Check if logged-in user is admin
    useEffect(() => {
       const token = localStorage.getItem('token');
    if (token) {
        axios.get(`${baseURL}/check-admin`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            if (res.data.isAdmin) {
                setIsAdmin(true);
            }
        })
        .catch(err => {
            console.error("Error checking admin:", err);
        });
    }
}, []);

    const addTestCase = () => {
        setTestCases([...testCases, { input: '', output: '' }]);
    };

    const removeTestCase = (index) => {
        const newTestCases = [...testCases];
        newTestCases.splice(index, 1);
        setTestCases(newTestCases);
    };

    const addStep = () => {
        setSteps([...steps, '']);
    };

    const removeStep = (index) => {
        const newSteps = [...steps];
        newSteps.splice(index, 1);
        setSteps(newSteps);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // ✅ Validation
        if (!language) {
            setErrorMessage('Language is required');
            return;
        }
        if (!difficulty) {
            setErrorMessage('Difficulty is required');
            return;
        }
        if (!topic) {
            setErrorMessage('Topic is required');
            return;
        }
        if (!question) {
            setErrorMessage('Question is required');
            return;
        }
        for (const testCase of testCases) {
            if (!testCase.input || !testCase.output) {
                setErrorMessage('All test cases must have both input and output');
                return;
            }
        }
        for (const step of steps) {
            if (!step) {
                setErrorMessage('All steps must be filled');
                return;
            }
        }

        const challengeData = {
  language,
  difficulty,
  topic,
  question,
  testCases,
  steps,
  answer,
  challengeType: isAdmin ? challengeType : 'normal', // Make sure this is correct
};

// Debug what's being sent
console.log('Sending challenge data:', challengeData);

        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/submit-challenge`, challengeData, config);

            if (response.data.message.includes("not a valid coding challenge")) {
                setErrorMessage(response.data.message);
            } else {
                setShowMessage(true);
                // Reset after successful submit
                setLanguage('');
                setDifficulty('');
                setTopic('');
                setQuestion('');
                setTestCases([{ input: '', output: '' }]);
                setSteps(['']);
                setAnswer('');
                setErrorMessage('');
            }
        } catch (error) {
            console.error('Error submitting challenge:', error.response?.data || error.message);
            setErrorMessage(error.response?.data?.message || 'An error occurred while submitting the challenge.');
        }
    };

    const handleBack = () => {
        navigate('/');
    };

    const closeMessage = () => {
        setShowMessage(false);
    };

    return (
        <div className="clg-container">
            <h1>Challenge</h1>
            <form id="clg-form" onSubmit={handleSubmit}>

                {/* 👇 Challenge Type only for Admin */}
                {isAdmin && (
                    <div className="clg-form-group">
                        <label htmlFor="clg-type-select">Challenge Type:</label>
                        <select
                            id="clg-type-select"
                            value={challengeType}
                            onChange={(e) => setChallengeType(e.target.value)}
                        >
                            <option value="normal">Normal Challenge</option>
                            <option value="placement">Placement Challenge</option>
                        </select>
                    </div>
                )}

                <div className="clg-form-group">
                    <label htmlFor="clg-language-select">Select Language:</label>
                    <select id="clg-language-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
                        <option value="">Select Language</option>
                        <option value="JAVASCRIPT">JAVASCRIPT</option>
                        <option value="PYTHON">PYTHON</option>
                        <option value="SQL">SQL</option>
                        <option value="C++">C++</option>
                        <option value="AI-ML">AI-ML</option>
                        <option value="C">C</option>
                        <option value="JAVA">JAVA</option>
                        <option value="DSA">DSA</option>
                    </select>
                </div>

                <div className="clg-form-group">
                    <label htmlFor="clg-difficulty-select">Select Difficulty:</label>
                    <select id="clg-difficulty-select" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                        <option value="">Select Difficulty</option>
                        <option value="Basic">Basic</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                    </select>
                </div>

                <div className="clg-form-group">
                    <label htmlFor="clg-topic-input">Enter Topic:</label>
                    <input type="text" id="clg-topic-input" placeholder="Enter Topic" value={topic} onChange={(e) => setTopic(e.target.value)} />
                </div>

                <div className="clg-form-group">
                    <label htmlFor="clg-question-input">Enter Question:</label>
                    <textarea id="clg-question-input" placeholder="Enter Question" value={question} onChange={(e) => setQuestion(e.target.value)}></textarea>
                </div>

                <div id="clg-test-cases">
                    <h2>Test Cases</h2>
                    {testCases.map((testCase, index) => (
                        <div className="clg-test-case" key={index}>
                            <label>Input:</label>
                            <input type="text" className="clg-test-input" placeholder="Enter input here" value={testCase.input} onChange={(e) => {
                                const newTestCases = [...testCases];
                                newTestCases[index].input = e.target.value;
                                setTestCases(newTestCases);
                            }} />
                            <label>Output:</label>
                            <input type="text" className="clg-test-output" placeholder="Enter output here" value={testCase.output} onChange={(e) => {
                                const newTestCases = [...testCases];
                                newTestCases[index].output = e.target.value;
                                setTestCases(newTestCases);
                            }} />
                            {testCases.length > 1 && <button type="button" className="clg-remove-test-case" onClick={() => removeTestCase(index)}>-</button>}
                        </div>
                    ))}
                </div>
                <button type="button" id="clg-add-test-case" onClick={addTestCase}>Add Test Case +</button>

                <div id="clg-procedure">
                    <h2>Procedure</h2>
                    {steps.map((step, index) => (
                        <div className="clg-step" key={index}>
                            <label>Step {index + 1}:</label>
                            <input type="text" className="clg-step-input" placeholder="Enter step" value={step} onChange={(e) => {
                                const newSteps = [...steps];
                                newSteps[index] = e.target.value;
                                setSteps(newSteps);
                            }} />
                            {steps.length > 1 && <button type="button" className="clg-remove-step" onClick={() => removeStep(index)}>-</button>}
                        </div>
                    ))}
                </div>
                <button type="button" id="clg-add-step" onClick={addStep}>Add Step +</button>

                <div className="clg-form-group">
                    <label htmlFor="clg-answer-input">Enter Answer:</label>
                    <textarea id="clg-answer-input" placeholder="Enter Answer(Optional but add for reference if you can.)" value={answer} onChange={(e) => setAnswer(e.target.value)}></textarea>
                </div>

                {errorMessage && <div className="clg-error-message">{errorMessage}</div>}

                <div className="clg-submit-container">
                    <button type="submit" className="clg-submit-button">Submit Challenge</button>
                </div>

                <div className="clg-back-container">
                    <button type="button" className="clg-back-button" onClick={handleBack}>Back</button>
                </div>
            </form>

            {showMessage && (
                <div className="clg-message">
                    <button className="clg-close-button" onClick={closeMessage}>×</button>
                    <p>Greetings from Learnweave: Thanks for challenging, keep doing like that!</p>
                </div>
            )}
        </div>
    );
};

export default ChallengePage;
