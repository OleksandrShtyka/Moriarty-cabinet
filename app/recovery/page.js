"use client";

import React, { useState, useEffect, useRef } from 'react';

export default function AccountRecovery() {
    // Wizard Steps: 1 (Identity), 2 (Verification OTP), 3 (Secure Reset)
    const [step, setStep] = useState(1);
    
    // Step 1: Identity Initiation
    const [identity, setIdentity] = useState('');
    const [recoveryMethod, setRecoveryMethod] = useState('email'); // 'email', 'sms', 'authenticator'
    
    // Step 2: Verification Protocol
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timerSeconds, setTimerSeconds] = useState(59);
    const [isTimerActive, setIsTimerActive] = useState(false);
    
    // Step 3: Secure Reset
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [strength, setStrength] = useState(''); // 'weak', 'medium', 'strong'
    
    // UX & Toasts
    const [loading, setLoading] = useState(false);
    const [toasts, setToasts] = useState([]);
    
    // Refs for OTP Autocomplete Focus Jumping
    const otpRefs = [
        useRef(null), useRef(null), useRef(null),
        useRef(null), useRef(null), useRef(null)
    ];

    // Helper: Add custom top-right glass notification
    const addToast = (msg, type = 'info') => {
        const id = 'toast-' + Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, msg, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4500);
    };

    // Countdown Timer logic for Step 2 Resend
    useEffect(() => {
        let interval = null;
        if (isTimerActive && timerSeconds > 0) {
            interval = setInterval(() => {
                setTimerSeconds(prev => prev - 1);
            }, 1000);
        } else if (timerSeconds === 0) {
            setIsTimerActive(false);
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isTimerActive, timerSeconds]);

    // Handle Identity Submission (Step 1)
    const handleIdentitySubmit = (e) => {
        e.preventDefault();
        if (!identity.trim()) {
            addToast("Пожалуйста, заполните поле идентификации!", "error");
            return;
        }

        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            addToast(`Код подтверждения отправлен на ${recoveryMethod === 'email' ? 'вашу почту' : recoveryMethod === 'sms' ? 'ваш номер телефона' : 'ваше приложение аутентификатора'}!`, "success");
            setStep(2);
            setTimerSeconds(59);
            setIsTimerActive(true);
            
            // Auto-focus first digit of OTP
            setTimeout(() => {
                otpRefs[0].current?.focus();
            }, 100);
        }, 1200);
    };

    // OTP Input Change Handlers with autofocus jumping
    const handleOtpChange = (value, index) => {
        // Only accept numbers
        if (value && isNaN(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1); // Only keep the last digit typed
        setOtp(newOtp);

        // Autofocus next digit input
        if (value && index < 5) {
            otpRefs[index + 1].current?.focus();
        }
    };

    // Keydown for backspace focus jumping
    const handleOtpKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs[index - 1].current?.focus();
        }
    };

    // Paste listener to parse 6-digit codes instantly
    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        
        if (pastedData.length === 6 && !isNaN(pastedData)) {
            const digitArray = pastedData.split('');
            setOtp(digitArray);
            addToast("Код успешно вставлен из буфера обмена!", "success");
            // Focus last input field
            otpRefs[5].current?.focus();
        } else {
            addToast("Неверный формат буфера! Скопируйте ровно 6 цифр.", "error");
        }
    };

    // Verification Submit Protocol (Step 2)
    const handleVerificationSubmit = (e) => {
        e.preventDefault();
        const code = otp.join('');
        
        if (code.length < 6) {
            addToast("Введите все 6 цифр кода подтверждения!", "error");
            return;
        }

        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            if (code === '123456') { // Mock correct OTP
                addToast("Код верификации успешно подтвержден в базах синдиката!", "success");
                setStep(3);
            } else {
                addToast("Неверный код подтверждения! Попробуйте ввести 123456 для симуляции.", "error");
            }
        }, 1200);
    };

    // Real-time password strength entropy calculation
    const evaluatePasswordStrength = (pass) => {
        setNewPassword(pass);
        if (!pass) {
            setStrength('');
            return;
        }

        let score = 0;
        if (pass.length >= 8) score++;
        if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;

        if (score <= 1) {
            setStrength('weak');
        } else if (score <= 3) {
            setStrength('medium');
        } else {
            setStrength('strong');
        }
    };

    // Final password reset submission
    const handlePasswordResetSubmit = (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            addToast("Пароли не совпадают!", "error");
            return;
        }
        if (strength === 'weak') {
            addToast("Пароль слишком простой! Добавьте цифры, заглавные буквы или символы.", "error");
            return;
        }

        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            addToast("Ваш мастер-пароль успешно изменен во всех шифрованных базах!", "success");
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        }, 1500);
    };

    // Resend OTP trigger
    const handleResendOtp = () => {
        if (isTimerActive) return;
        
        addToast("Новый код подтверждения успешно сгенерирован!", "success");
        setTimerSeconds(59);
        setIsTimerActive(true);
    };

    // Helper: translate strength values to dynamic specular classes
    const getStrengthClass = () => {
        if (step !== 3) return '';
        if (strength === 'weak') return 'strength-weak';
        if (strength === 'medium') return 'strength-medium';
        if (strength === 'strong') return 'strength-strong';
        return '';
    };

    return (
        <div className="auth-overlay">
            {/* Dynamic animated liquid background blobs */}
            <div className="auth-liquid-bg">
                <div className="auth-blob one"></div>
                <div className="auth-blob two"></div>
                <div className="auth-blob three"></div>
            </div>

            {/* Specular Floating Card */}
            <div className={`auth-card recovery-wizard-card ${getStrengthClass()} animate-fade-in`}>
                
                {/* Header */}
                <div className="auth-header">
                    <img 
                        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=280&q=80" 
                        alt="Moriarty Crest" 
                        className="auth-logo"
                    />
                    <h2 className="brand-text" style={{ fontSize: '1.6rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Восстановление
                    </h2>
                    <p className="auth-subtitle">Безопасный сброс мастер-шифра</p>
                </div>

                {/* Progress Indicators */}
                <div className="wizard-progress-bar">
                    <div className={`wizard-progress-segment ${step >= 1 ? 'active' : ''}`}></div>
                    <div className={`wizard-progress-segment ${step >= 2 ? 'active' : ''}`}></div>
                    <div className={`wizard-progress-segment ${step >= 3 ? 'active' : ''}`}></div>
                </div>

                {/* STEP 1: IDENTITY INITIATION */}
                {step === 1 && (
                    <form onSubmit={handleIdentitySubmit} className="auth-form animate-slide-down">
                        <div className="floating-label-group">
                            <input 
                                type="text"
                                className="input-glow"
                                placeholder=" "
                                value={identity}
                                onChange={(e) => setIdentity(e.target.value)}
                                required
                            />
                            <label>Email или никнейм синдиката</label>
                        </div>

                        <div style={{ margin: '1.2rem 0' }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                Способ получения кода:
                            </span>
                            <div className="alternative-methods-container">
                                <button 
                                    type="button" 
                                    className="btn-alternative-method"
                                    style={{ border: recoveryMethod === 'email' ? '1px solid var(--primary-neon)' : '', background: recoveryMethod === 'email' ? 'rgba(179,154,116,0.08)' : '' }}
                                    onClick={() => setRecoveryMethod('email')}
                                >
                                    <i className="fa-solid fa-envelope"></i> Email
                                </button>
                                <button 
                                    type="button" 
                                    className="btn-alternative-method"
                                    style={{ border: recoveryMethod === 'sms' ? '1px solid var(--primary-neon)' : '', background: recoveryMethod === 'sms' ? 'rgba(179,154,116,0.08)' : '' }}
                                    onClick={() => setRecoveryMethod('sms')}
                                >
                                    <i className="fa-solid fa-phone"></i> SMS-код
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? (
                                <i className="fa-solid fa-spinner fa-spin"></i>
                            ) : (
                                <>
                                    <i className="fa-solid fa-shield-halved"></i>
                                    <span>Запустить процедуру</span>
                                </>
                            )}
                        </button>
                        
                        <div style={{ textAlign: 'center', marginTop: '1.2rem' }}>
                            <a href="/" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: '600' }} className="brand-text">
                                Вернуться ко входу
                            </a>
                        </div>
                    </form>
                )}

                {/* STEP 2: VERIFICATION PROTOCOL */}
                {step === 2 && (
                    <form onSubmit={handleVerificationSubmit} className="auth-form animate-slide-down">
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.5', margin: '-0.5rem 0 1.2rem' }}>
                            Мы выслали код безопасности. Введите его ниже для аутентификации сессии.
                        </p>

                        <div className="form-group">
                            <label style={{ textAlign: 'center', display: 'block' }}>Введите 6-значный код</label>
                            
                            <div className="otp-inputs-row" onPaste={handleOtpPaste}>
                                {otp.map((digit, index) => (
                                    <input 
                                        key={index}
                                        ref={otpRefs[index]}
                                        type="text"
                                        maxLength="1"
                                        className="otp-digit-input"
                                        value={digit}
                                        onChange={(e) => handleOtpChange(e.target.value, index)}
                                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem 0' }}>
                            <button 
                                type="button" 
                                className="btn-alternative-method"
                                style={{ background: 'transparent', border: 'none', padding: 0 }}
                                onClick={() => setStep(1)}
                            >
                                <i className="fa-solid fa-arrow-left"></i> Назад
                            </button>

                            <button 
                                type="button"
                                className="btn-alternative-method"
                                style={{ background: 'transparent', border: 'none', padding: 0, color: isTimerActive ? 'var(--text-muted)' : 'var(--primary-neon)' }}
                                disabled={isTimerActive}
                                onClick={handleResendOtp}
                            >
                                {isTimerActive ? (
                                    <>Повтор через {timerSeconds}с</>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-rotate-right"></i> Выслать повторно
                                    </>
                                )}
                            </button>
                        </div>

                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? (
                                <i className="fa-solid fa-spinner fa-spin"></i>
                            ) : (
                                <>
                                    <i className="fa-solid fa-lock-open"></i>
                                    <span>Подтвердить код</span>
                                </>
                            )}
                        </button>
                    </form>
                )}

                {/* STEP 3: SECURE PASSWORD RESET */}
                {step === 3 && (
                    <form onSubmit={handlePasswordResetSubmit} className="auth-form animate-slide-down">
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.5', margin: '-0.5rem 0 1.2rem' }}>
                            Создайте новый сверхнадежный мастер-пароль для вашего сейфа и данных.
                        </p>

                        <div className="floating-label-group">
                            <input 
                                type="password"
                                className="input-glow"
                                placeholder=" "
                                value={newPassword}
                                onChange={(e) => evaluatePasswordStrength(e.target.value)}
                                required
                            />
                            <label>Новый пароль</label>
                            
                            {/* Live Specular password strength bar */}
                            {newPassword && (
                                <div className="password-strength-meter-bar">
                                    <div className={`password-strength-fill ${strength}`}></div>
                                </div>
                            )}
                            {newPassword && (
                                <span style={{ fontSize: '0.65rem', color: strength === 'weak' ? '#B93C3C' : strength === 'medium' ? '#D8B257' : '#1E6B3E', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '4px', display: 'block', letterSpacing: '0.5px' }}>
                                    Сложность: {strength === 'weak' ? 'Слабый пароль' : strength === 'medium' ? 'Средний пароль' : 'Сверхнадежный шифр'}
                                </span>
                            )}
                        </div>

                        <div className="floating-label-group">
                            <input 
                                type="password"
                                className="input-glow"
                                placeholder=" "
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <label>Подтвердите новый пароль</label>
                        </div>

                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? (
                                <i className="fa-solid fa-spinner fa-spin"></i>
                            ) : (
                                <>
                                    <i className="fa-solid fa-floppy-disk"></i>
                                    <span>Обновить шифр и войти</span>
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>

            {/* Top-Right Specific High-End Notification Viewport */}
            <div className="toast-container toast-top-right">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast-item ${toast.type}`}>
                        <i className={`fa-solid ${
                            toast.type === 'success' ? 'fa-circle-check' 
                            : toast.type === 'error' ? 'fa-circle-xmark' 
                            : 'fa-circle-info'
                        }`}></i>
                        <span>{toast.msg}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
