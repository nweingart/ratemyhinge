import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase';

const AUTH_STEPS = {
  PHONE: 'PHONE',
  CODE: 'CODE',
  NAME: 'NAME'
};

const COUNTRY_CODES = [
  { code: '+1', country: 'US', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
];

export default function Login() {
  const [step, setStep] = useState(AUTH_STEPS.PHONE);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [verificationCode, setVerificationCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const navigate = useNavigate();

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });

      const formattedPhone = `${countryCode.code}${phoneNumber}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      setConfirmationResult(confirmation);
      setStep(AUTH_STEPS.CODE);
    } catch (err) {
      console.error('Error sending code:', err);
      setError('Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await confirmationResult.confirm(verificationCode);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        setStep(AUTH_STEPS.NAME);
      } else {
        await setDoc(doc(db, 'users', result.user.uid), {
          lastLoginAt: serverTimestamp()
        }, { merge: true });
        navigate('/');
      }
    } catch (err) {
      console.error('Error verifying code:', err);
      setError('Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNameSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = auth.currentUser;
      await setDoc(doc(db, 'users', user.uid), {
        name,
        phoneNumber: user.phoneNumber,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });
      navigate('/');
    } catch (err) {
      console.error('Error saving user data:', err);
      setError('Failed to complete signup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-white">
      <h1 className="text-4xl font-bold text-gray-900 mb-16">
        Sign in to FixMyHinge
      </h1>

      <div className="w-full max-w-[400px]">
        {error && (
          <div className="mb-6 text-red-600 text-sm text-center">{error}</div>
        )}

        {step === AUTH_STEPS.PHONE && (
          <form onSubmit={handlePhoneSubmit} className="space-y-8">
            <div>
              <label htmlFor="phone" className="block text-2xl font-medium text-gray-900 mb-4">
                Phone Number
              </label>
              <div className="flex space-x-3">
                <div className="relative">
                  <select
                    value={countryCode.code}
                    onChange={(e) => setCountryCode(
                      COUNTRY_CODES.find(c => c.code === e.target.value)
                    )}
                    className="rounded-lg border-2 border-gray-400 shadow-sm text-2xl py-3 pl-2 pr-6 w-[72px] appearance-none"
                  >
                    {COUNTRY_CODES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <input
                  type="tel"
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="block w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-lg py-3 px-4"
                  placeholder="123 456 7890"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full max-w-xs mx-auto flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Code'}
            </button>
          </form>
        )}

        {step === AUTH_STEPS.CODE && (
          <form onSubmit={handleCodeSubmit} className="space-y-8">
            <div>
              <label htmlFor="code" className="block text-2xl font-medium text-gray-900 mb-4">
                Verification Code
              </label>
              <div className="flex justify-between space-x-2">
                {[...Array(6)].map((_, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    value={verificationCode[index] || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value || value === '') {
                        const newCode = verificationCode.split('');
                        newCode[index] = value;
                        setVerificationCode(newCode.join(''));
                        
                        if (value && index < 5) {
                          const nextInput = e.target.nextElementSibling;
                          if (nextInput) {
                            nextInput.focus();
                          }
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
                        const prevInput = e.target.previousElementSibling;
                        if (prevInput) {
                          prevInput.focus();
                        }
                      }
                    }}
                    className="w-12 h-12 text-center text-xl font-semibold rounded-lg border-2 border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="w-full max-w-[120px] mx-auto flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        )}

        {step === AUTH_STEPS.NAME && (
          <form onSubmit={handleNameSubmit} className="space-y-8">
            <div>
              <label htmlFor="name" className="block text-2xl font-medium text-gray-900 mb-4">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-lg border-2 border-gray-400 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-lg py-3 px-4"
                placeholder="John Doe"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full max-w-[120px] mx-auto flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </form>
        )}

        <div id="recaptcha-container" />
      </div>
    </div>
  );
} 