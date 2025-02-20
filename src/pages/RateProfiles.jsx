import React from 'react';
import { useProfiles } from '../hooks/useProfiles';

export default function RateProfiles() {
  const { profiles, loading, error } = useProfiles();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            Loading profiles...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center text-red-600">
            Error loading profiles: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 sm:px-0">
        <h1 className="text-2xl font-semibold text-gray-900">Rate Profiles</h1>
        <p className="mt-1 text-sm text-gray-600">
          Help others improve their dating profiles by rating their photos.
        </p>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <h3 className="text-lg font-medium text-gray-900">{profile.name}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {profile.photoCount} photos to rate
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 