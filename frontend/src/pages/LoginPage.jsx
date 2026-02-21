import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    HiOutlineMail,
    HiOutlineLockClosed,
    HiOutlineUser,
    HiOutlineEye,
    HiOutlineEyeOff,
    HiOutlineShieldCheck,
    HiOutlineChartBar,
    HiOutlineMap,
    HiOutlineCurrencyDollar
} from 'react-icons/hi';
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
        role: 'dispatcher',
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
        <div className="login">
            <div className="login__left">
                <div className="login__branding">
                    <div className="login__logo">
                        <HiOutlineShieldCheck className="login__logo-icon" />
                        <h1 className="login__logo-text">FleetFlow</h1>
                    </div>
                    <p className="login__tagline">
                        Intelligent fleet management for modern logistics operations
                    </p>
                    <div className="login__features">
                        <div className="login__feature">
                            <HiOutlineChartBar className="login__feature-icon" />
                            <div>
                                <h3>Real-time Analytics</h3>
                                <p>Monitor your entire fleet at a glance</p>
                            </div>
                        </div>
                        <div className="login__feature">
                            <HiOutlineMap className="login__feature-icon" />
                            <div>
                                <h3>Trip Management</h3>
                                <p>Plan and track routes efficiently</p>
                            </div>
                        </div>
                        <div className="login__feature">
                            <HiOutlineCurrencyDollar className="login__feature-icon" />
                            <div>
                                <h3>Financial Tracking</h3>
                                <p>Invoices, expenses, and revenue reports</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="login__right">
                <form className="login__form" onSubmit={handleSubmit}>
                    <div className="login__form-header">
                        <h2>{isLogin ? 'Welcome back' : 'Create account'}</h2>
                        <p>{isLogin ? 'Sign in to your FleetFlow account' : 'Get started with FleetFlow'}</p>
                    </div>

                    {error && <div className="login__error">{error}</div>}

                    {!isLogin && (
                        <div className="login__field">
                            <label htmlFor="name">Full Name</label>
                            <div className="login__input-wrap">
                                <HiOutlineUser className="login__input-icon" />
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

                    <div className="login__field">
                        <label htmlFor="email">Email</label>
                        <div className="login__input-wrap">
                            <HiOutlineMail className="login__input-icon" />
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

                    <div className="login__field">
                        <label htmlFor="password">Password</label>
                        <div className="login__input-wrap">
                            <HiOutlineLockClosed className="login__input-icon" />
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
                                className="login__eye-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                            </button>
                        </div>
                    </div>

                    {!isLogin && (
                        <div className="login__field">
                            <label htmlFor="role">Role</label>
                            <select
                                id="role"
                                name="role"
                                value={form.role}
                                onChange={handleChange}
                                className="login__select"
                            >
                                <option value="fleet_manager">Fleet Manager</option>
                                <option value="dispatcher">Dispatcher</option>
                                <option value="safety_officer">Safety Officer</option>
                                <option value="financial_analyst">Financial Analyst</option>
                            </select>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="login__submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="login__spinner"></span>
                        ) : (
                            isLogin ? 'Sign In' : 'Create Account'
                        )}
                    </button>

                    <p className="login__switch">
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
