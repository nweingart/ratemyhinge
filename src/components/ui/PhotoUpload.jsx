import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

export default function PhotoUpload({ minPhotos = 10, maxPhotos = 20 }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const { currentUser } = useAuth();

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Check if adding new files would exceed maximum
    if (files.length + selectedFiles.length > maxPhotos) {
      alert(`You can only upload up to ${maxPhotos} photos. Please select fewer photos.`);
      return;
    }
    
    setFiles([...files, ...selectedFiles]);
  };

  const handleUpload = async () => {
    if (files.length < minPhotos) {
      alert(`Please select at least ${minPhotos} photos`);
      return;
    }

    if (files.length > maxPhotos) {
      alert(`You can only upload up to ${maxPhotos} photos`);
      return;
    }

    setUploading(true);
    const totalFiles = files.length;
    let completedUploads = 0;
    
    try {
      for (const file of files) {
        const filename = `${Date.now()}-${file.name}`;
        const storageRef = ref(storage, `users/${currentUser.uid}/photos/${filename}`);
        
        await uploadBytes(storageRef, file);
        completedUploads++;
        setUploadProgress((completedUploads / totalFiles) * 100);
      }

      // Clear files after successful upload
      setFiles([]);
      alert('Photos uploaded successfully!');

    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Error uploading photos');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {/* File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        accept="image/*"
        className="hidden"
      />

      {/* Upload Area */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400"
      >
        <div className="space-y-2">
          <div className="text-gray-600">Click to upload photos</div>
          <div className="text-sm text-gray-500">
            {files.length === 0 ? (
              `Upload ${minPhotos}-${maxPhotos} photos`
            ) : (
              `${files.length} ${files.length === 1 ? 'photo' : 'photos'} selected`
            )}
          </div>
        </div>
      </div>

      {/* Selected Files Preview */}
      {files.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {files.map((file, index) => (
            <div key={index} className="relative group">
              <img
                src={URL.createObjectURL(file)}
                alt={`Preview ${index + 1}`}
                className="h-40 w-full object-cover rounded-lg"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {files.length >= minPhotos && (
        <div className="mt-6">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
          >
            {uploading ? `Uploading... ${Math.round(uploadProgress)}%` : 'Upload Photos'}
          </button>
        </div>
      )}
    </div>
  );
} 