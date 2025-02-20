import { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export function useProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const db = getFirestore();

  useEffect(() => {
    async function fetchProfiles() {
      try {
        // Get profiles that have photos
        const profilesRef = collection(db, 'users');
        const q = query(
          profilesRef,
          where('profile.hasPhotos', '==', true),
          where('profile.photoCount', '>', 0)
        );

        const querySnapshot = await getDocs(q);
        const fetchedProfiles = [];

        for (const doc of querySnapshot.docs) {
          // Skip current user's profile if they're logged in
          if (currentUser && doc.id === currentUser.uid) continue;

          const userData = doc.data();
          if (userData.profile) {
            fetchedProfiles.push({
              id: doc.id,
              name: userData.profile.name || 'Anonymous',
              photoCount: userData.profile.photoCount || 0
            });
          }
        }

        setProfiles(fetchedProfiles);
      } catch (err) {
        console.error('Error fetching profiles:', err);
        setError('Missing or insufficient permissions.');
      } finally {
        setLoading(false);
      }
    }

    fetchProfiles();
  }, [currentUser, db]);

  return { profiles, loading, error };
} 