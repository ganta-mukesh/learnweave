import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Authpage.css';
import LEARNWEAVE from './LEARNWEAVE.png';

const AuthPage = ({ onAuthSuccess, isSignup }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const isLogin = location.pathname === '/login';
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        otp: ['', '', '', ''],
        newPassword: '',
        confirmPassword: '',
    });
    const [isLoginState, setIsLoginState] = useState(isLogin);
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [forgotPassword, setForgotPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('otp')) {
            const index = parseInt(name.split('-')[1], 10);
            const updatedOtp = [...formData.otp];
            updatedOtp[index] = value.slice(0, 1);
            setFormData({ ...formData, otp: updatedOtp });

            if (value && index < 3) {
                document.querySelector(`input[name=otp-${index + 1}]`).focus();
            }
            if (!value && index > 0) {
                document.querySelector(`input[name=otp-${index - 1}]`).focus();
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');
        setIsLoading(true);

        const url = isLoginState ? 'http://localhost:4000/login' : 'http://localhost:4000/signup';
        const body = isLoginState
            ? { email: formData.email, password: formData.password }
            : { fullName: formData.fullName, email: formData.email, password: formData.password };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (response.ok) {
                if (isLoginState) {
                    onAuthSuccess(data.token);
                    setSuccessMessage("Login successful!");
                } else {
                    setSuccessMessage("Signup successful! Redirecting to login...");
                    setTimeout(() => {
                        setIsLoginState(true); // Switch to login form
                        setFormData({ ...formData, fullName: '', password: '' }); // Clear signup fields
                    }, 2000);
                }
            } else {
                setErrorMessage(data.message || (isLoginState ? 'Login failed' : 'Signup failed'));
            }
        } catch (error) {
            setErrorMessage('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const sendOtp = async () => {
        try {
            const response = await fetch('http://localhost:4000/sendotp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email }),
            });

            if (response.ok) {
                setOtpSent(true);
                setSuccessMessage('OTP sent to your email!');
            } else {
                setErrorMessage('Failed to send OTP. Please try again.');
            }
        } catch (error) {
            setErrorMessage('An error occurred while sending OTP.');
        }
    };

    const verifyOtp = async () => {
        try {
            const otpValue = formData.otp.join('');
            const response = await fetch('http://localhost:4000/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, otp: otpValue }),
            });

            if (response.ok) {
                setOtpVerified(true);
                setSuccessMessage('OTP verified successfully!');
            } else {
                setErrorMessage('Invalid OTP. Please try again.');
            }
        } catch (error) {
            setErrorMessage('An error occurred while verifying OTP.');
        }
    };

    const handleForgotPassword = async () => {
        try {
            const response = await fetch('http://localhost:4000/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, newPassword: formData.newPassword }),
            });

            if (response.ok) {
                setSuccessMessage('Password reset successfully!');
                setForgotPassword(false);
            } else {
                setErrorMessage('Failed to reset password. Please try again.');
            }
        } catch (error) {
            setErrorMessage('An error occurred while resetting password.');
        }
    };
    const handleToggle = () => {
        setIsLoginState(!isLoginState);
    };

    return (
        <div className="auth-container">
            <div className="overlay"></div>
            <div className="auth-card">
                <div className="auth-message">
                    <img src={LEARNWEAVE} alt="Auth Illustration" className="auth-image" />
                    <h2>{isLoginState ? 'Welcome Back!' : 'Welcome!'}</h2>
                    <p>
                        {isLoginState ? "Don't have an account? " : 'Already have an account? '}
                        <span onClick={() => setIsLoginState(!isLoginState)} className="auth-toggle">
                            {isLoginState ? 'Sign Up' : 'Sign In'}
                        </span>
                    </p>
                </div>
                <div className="auth-form">
                    {errorMessage && <p className="error-message">{errorMessage}</p>}
                    {successMessage && <p className="success-message">{successMessage}</p>}
                    <form onSubmit={handleSubmit}>
                        {!isLoginState && (
                            <>
                                <input
                                    type="text"
                                    name="fullName"
                                    placeholder="Full Name"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                    className="auth-input"
                                />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="auth-input"
                                />
                                {!otpVerified && otpSent && (
                                    <div className="otp-container">
                                        {formData.otp.map((digit, index) => (
                                            <input
                                                key={index}
                                                type="text"
                                                name={`otp-${index}`}
                                                value={digit}
                                                onChange={handleChange}
                                                maxLength="1"
                                                required
                                                className="otp-input"
                                            />
                                        ))}
                                    </div>
                                )}
                                {!otpVerified && (
                                    <button type="button" onClick={sendOtp} className="auth-button">
                                        {otpSent ? 'Resend OTP' : 'Send OTP'}
                                    </button>
                                )}
                                {otpSent && !otpVerified && (
                                    <button type="button" onClick={verifyOtp} className="auth-button">
                                        Verify OTP
                                    </button>
                                )}
                                {otpVerified && (
                                    <>
                                        <div className="password-container">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                placeholder="Create Password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                required
                                                className="auth-input"
                                            />
                                            <button
                                                type="button"
                                                className="eye-button"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? '👁️' : '👁️‍🗨️'}
                                            </button>
                                        </div>
                                        <button type="submit" className="auth-button">
                                            Sign Up
                                        </button>
                                    </>
                                )}
                            </>
                        )}
                        {isLoginState && (
                            <>
                                {!forgotPassword ? (
                                    <>
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="Email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="auth-input"
                                        />
                                        <div className="password-container">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                placeholder="Password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                required
                                                className="auth-input"
                                            />
                                            <button
                                                type="button"
                                                className="eye-button"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? '👁️' : '👁️‍🗨️'}
                                            </button>
                                        </div>
                                        <button type="submit" className="auth-button">
                                            Login
                                        </button>
                                        <p onClick={() => setForgotPassword(true)} className="auth-toggle">
                                            Forgot Password?
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="Email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="auth-input"
                                        />
                                        {!otpVerified && otpSent && (
                                            <div className="otp-container">
                                                {formData.otp.map((digit, index) => (
                                                    <input
                                                        key={index}
                                                        type="text"
                                                        name={`otp-${index}`}
                                                        value={digit}
                                                        onChange={handleChange}
                                                        maxLength="1"
                                                        required
                                                        className="otp-input"
                                                    />
                                                ))}
                                            </div>
                                        )}
                                        {!otpVerified && (
                                            <button type="button" onClick={sendOtp} className="auth-button">
                                                {otpSent ? 'Resend OTP' : 'Send OTP'}
                                            </button>
                                        )}
                                        {otpSent && !otpVerified && (
                                            <button type="button" onClick={verifyOtp} className="auth-button">
                                                Verify OTP
                                            </button>
                                        )}
                                        {otpVerified && (
                                            <>
                                                <div className="password-container">
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        name="newPassword"
                                                        placeholder="New Password"
                                                        value={formData.newPassword}
                                                        onChange={handleChange}
                                                        required
                                                        className="auth-input"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="eye-button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    >
                                                        {showPassword ? '👁️' : '👁️‍🗨️'}
                                                    </button>
                                                </div>
                                                <div className="password-container">
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        name="confirmPassword"
                                                        placeholder="Confirm New Password"
                                                        value={formData.confirmPassword}
                                                        onChange={handleChange}
                                                        required
                                                        className="auth-input"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="eye-button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    >
                                                        {showPassword ? '👁️' : '👁️‍🗨️'}
                                                    </button>
                                                </div>
                                                <button type="button" onClick={handleForgotPassword} className="auth-button">
                                                    Change Password
                                                </button>
                                            </>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;