import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import api from '../utils/api';
import './LoginPage.css';

function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'viewer',
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/register';
            const payload = isLogin
                ? { email: form.email, password: form.password }
                : form;

            const res = await api.post(endpoint, payload);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-page__left">
                <div className="login-page__branding">
                    <div className="login-page__logo">
                        <span className="login-page__logo-emoji">🚛</span>
                        <h1 className="login-page__logo-text">FleetFlow</h1>
                    </div>
                    <p className="login-page__tagline">
                        Smart fleet management for modern logistics
                    </p>
                    <div className="login-page__features">
                        <div className="login-page__feature">
                            <span className="login-page__feature-icon">📊</span>
                            <div>
                                <h3>Real-time Dashboard</h3>
                                <p>Monitor your entire fleet at a glance</p>
                            </div>
                        </div>
                        <div className="login-page__feature">
                            <span className="login-page__feature-icon">🗺️</span>
                            <div>
                                <h3>Trip Management</h3>
                                <p>Plan and track routes efficiently</p>
                            </div>
                        </div>
                        <div className="login-page__feature">
                            <span className="login-page__feature-icon">💰</span>
                            <div>
                                <h3>Financial Tracking</h3>
                                <p>Invoices, expenses, and revenue reports</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="login-page__glow login-page__glow--1"></div>
                <div className="login-page__glow login-page__glow--2"></div>
            </div>

            <div className="login-page__right">
                <form className="login-page__form" onSubmit={handleSubmit}>
                    <div className="login-page__form-header">
                        <h2>{isLogin ? 'Welcome back' : 'Create account'}</h2>
                        <p>{isLogin ? 'Sign in to your FleetFlow account' : 'Get started with FleetFlow'}</p>
                    </div>

                    {error && <div className="login-page__error">{error}</div>}

                    {!isLogin && (
                        <div className="login-page__field">
                            <label htmlFor="name">Full Name</label>
                            <div className="login-page__input-wrap">
                                <HiOutlineUser className="login-page__input-icon" />
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder="Enter your name"
                                    value={form.name}
                                    onChange={handleChange}
                                    required={!isLogin}
                                />
                            </div>
                        </div>
                    )}

                    <div className="login-page__field">
                        <label htmlFor="email">Email</label>
                        <div className="login-page__input-wrap">
                            <HiOutlineMail className="login-page__input-icon" />
                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="login-page__field">
                        <label htmlFor="password">Password</label>
                        <div className="login-page__input-wrap">
                            <HiOutlineLockClosed className="login-page__input-icon" />
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={form.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                className="login-page__eye-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                            </button>
                        </div>
                    </div>

                    {!isLogin && (
                        <div className="login-page__field">
                            <label htmlFor="role">Role</label>
                            <select
                                id="role"
                                name="role"
                                value={form.role}
                                onChange={handleChange}
                                className="login-page__select"
                            >
                                <option value="viewer">Viewer</option>
                                <option value="driver">Driver</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="login-page__submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="login-page__spinner"></span>
                        ) : (
                            isLogin ? 'Sign In' : 'Create Account'
                        )}
                    </button>

                    <p className="login-page__switch">
                        {isLogin ? "Don't have an account? " : 'Already have an account? '}
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                            }}
                        >
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;
