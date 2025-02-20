import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PhotoUpload from './ui/PhotoUpload';
import PhotoComparison from './PhotoComparison';

export default function Dashboard({ hideNav = false }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upload');

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch {
      console.error('Failed to log out');
    }
  }

  return (
    <div className="min-h-full bg-gray-100">
      {!hideNav && (
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">FixMyHinge</h1>
              </div>
              <div className="flex items-center">
                <span className="text-gray-700 mr-4">{currentUser.phoneNumber}</span>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('upload')}
              className={`${
                activeTab === 'upload'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              Upload Photos
            </button>
            <button
              onClick={() => setActiveTab('rate')}
              className={`${
                activeTab === 'rate'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              Rate Photos
            </button>
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === 'upload' ? <PhotoUpload /> : <PhotoComparison />}
        </div>
      </div>
    </div>
  );
} 