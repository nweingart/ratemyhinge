import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  doc, 
  deleteDoc, 
  collection, 
  getDocs 
} from 'firebase/firestore';
import { 
  ref, 
  listAll, 
  deleteObject 
} from 'firebase/storage';
import { 
  PhoneAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier
} from 'firebase/auth';
import { db, storage, auth } from '../firebase';

export default function AccountSettings() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [step, setStep] = useState('INITIAL'); // INITIAL, VERIFY_PHONE, VERIFY_CODE
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const initiatePhoneVerification = async () => {
    setError('');
    setStep('VERIFY_PHONE');
    
    try {
      // Create RecaptchaVerifier if it doesn't exist
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'normal',
          'callback': async () => {
            try {
              const phoneNumber = currentUser.phoneNumber;
              const confirmationResult = await signInWithPhoneNumber(
                auth,
                phoneNumber,
                window.recaptchaVerifier
              );
              setVerificationId(confirmationResult.verificationId);
              setStep('VERIFY_CODE');
            } catch (error) {
              console.error('Error sending verification code:', error);
              setError('Failed to send verification code. Please try again.');
              setStep('INITIAL');
            }
          }
        });
      }

      // Render the reCAPTCHA widget
      window.recaptchaVerifier.render();
    } catch (error) {
      console.error('Error setting up verification:', error);
      setError('Failed to initialize verification. Please try again.');
      setStep('INITIAL');
    }
  };

  const handleDeleteAccount = async (e) => {
    if (e) e.preventDefault();
    
    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    if (step === 'INITIAL') {
      await initiatePhoneVerification();
      return;
    }

    if (step === 'VERIFY_CODE') {
      if (!verificationCode) {
        setError('Please enter the verification code');
        return;
      }

      setIsDeleting(true);
      setError('');

      try {
        // Verify the code
        const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
        await currentUser.reauthenticateWithCredential(credential);

        // Delete Storage
        const storageRef = ref(storage, `users/${currentUser.uid}/photos`);
        try {
          const photosList = await listAll(storageRef);
          await Promise.all(photosList.items.map(item => deleteObject(item)));
        } catch (error) {
          console.log('Storage deletion error or no files exist:', error);
        }

        // Delete Firestore Data
        try {
          const photosRef = collection(db, 'users', currentUser.uid, 'photos');
          const photosSnapshot = await getDocs(photosRef);
          await Promise.all(photosSnapshot.docs.map(doc => deleteDoc(doc.ref)));
          await deleteDoc(doc(db, 'users', currentUser.uid));
        } catch (error) {
          console.log('Firestore deletion error or no documents exist:', error);
        }

        // Delete Auth Account
        await currentUser.delete();
        
        // Redirect to login
        navigate('/login', { replace: true });
        window.location.reload();
      } catch (error) {
        console.error('Account deletion error:', error);
        setError('Failed to delete account. Please try again.');
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Account Settings
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Manage your account preferences and settings
            </p>
          </div>

          <div className="px-4 py-5 sm:px-6">
            <div className="mb-8">
              <h4 className="text-sm font-medium text-gray-500">Account Information</h4>
              <p className="mt-1 text-sm text-gray-900">{currentUser.phoneNumber}</p>
            </div>

            <div className="border-t border-gray-200 pt-8">
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Danger Zone</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>
                        Deleting your account will permanently remove all your data, including photos and ratings.
                        This action cannot be undone.
                      </p>
                    </div>
                    {error && (
                      <div className="mt-2 text-sm text-red-800 font-medium">
                        {error}
                      </div>
                    )}
                    <div className="mt-4">
                      {step === 'VERIFY_CODE' ? (
                        <form onSubmit={handleDeleteAccount} className="space-y-4">
                          <div>
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                              Enter verification code
                            </label>
                            <input
                              type="text"
                              id="code"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value)}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                              required
                            />
                          </div>
                          <div className="flex space-x-3">
                            <button
                              type="submit"
                              disabled={isDeleting}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                            >
                              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setStep('INITIAL');
                                setShowConfirmation(false);
                                setVerificationCode('');
                                setError('');
                              }}
                              disabled={isDeleting}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : step === 'VERIFY_PHONE' ? (
                        <div className="space-y-4">
                          <div id="recaptcha-container"></div>
                          <button
                            type="button"
                            onClick={() => {
                              setStep('INITIAL');
                              setShowConfirmation(false);
                              setError('');
                            }}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleDeleteAccount}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Delete Account
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 