import React from 'react';
import PhotoUpload from '../components/ui/PhotoUpload';

export default function GetFixed() {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 sm:px-0">
        <h1 className="text-2xl font-semibold text-gray-900">Upload Your Photos</h1>
        <p className="mt-1 text-sm text-gray-600">
          Share 10-20 of your favorite photos, and we'll help you pick the perfect 6 for your profile.
        </p>
      </div>

      <div className="mt-6">
        <PhotoUpload 
          minPhotos={10}
          maxPhotos={20}
        />
      </div>
    </div>
  );
} 