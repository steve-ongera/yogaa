import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import SwipeCard from '../components/swipe/SwipeCard';
import ProfileFilters from '../components/profile/ProfileFilters';
import Loader from '../components/common/Loader';
import Navbar from '../components/common/Navbar';
import { profileService, matchService } from '../services';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const Discover = () => {
  const { user } = useAuth();
  const { profiles, loadProfiles, loading, hasMore, currentPage } = useProfile();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  useEffect(() => {
    if (profiles.length === 0 && !loading) {
      loadProfiles();
    }
  }, []);

  const handleSwipe = async (direction, profile) => {
    if (isSwiping) return;
    setIsSwiping(true);

    try {
      if (direction === 'right') {
        // Like
        const result = await matchService.like(profile.id);
        if (result.is_match) {
          toast.success(`It's a match! You and ${profile.username} liked each other!`);
        } else {
          toast.success(`You liked ${profile.username}`);
        }
      } else if (direction === 'left') {
        // Pass
        toast.info(`You passed on ${profile.username}`);
      }

      // Move to next profile
      setCurrentIndex(prev => prev + 1);

      // Load more if needed
      if (currentIndex >= profiles.length - 3 && hasMore) {
        await loadProfiles(currentPage + 1);
      }
    } catch (error) {
      toast.error('Failed to process swipe');
    } finally {
      setIsSwiping(false);
    }
  };

  const handleFilterChange = (filters) => {
    setCurrentIndex(0);
    loadProfiles(1, filters);
  };

  const currentProfile = profiles[currentIndex];

  if (loading && profiles.length === 0) {
    return (
      <>
        <Navbar />
        <div className="discover-container">
          <Loader />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="discover-container">
        <div className="discover-header">
          <h1>Discover</h1>
          <p>Find your perfect match in Kenya</p>
        </div>

        <ProfileFilters onFilterChange={handleFilterChange} />

        <div className="swipe-container">
          {currentProfile ? (
            <AnimatePresence>
              <motion.div
                key={currentProfile.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <SwipeCard
                  profile={currentProfile}
                  onSwipe={handleSwipe}
                  isSwiping={isSwiping}
                />
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="no-profiles">
              <h3>No more profiles</h3>
              <p>Check back later for new matches!</p>
              <button 
                className="btn-primary"
                onClick={() => {
                  setCurrentIndex(0);
                  loadProfiles(1);
                }}
              >
                Refresh
              </button>
            </div>
          )}

          {loading && <Loader size="small" />}
        </div>
      </div>
    </>
  );
};

export default Discover;