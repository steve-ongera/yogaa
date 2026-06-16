import React, { createContext, useState, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { profileService } from '../services';
import toast from 'react-hot-toast';

const ProfileContext = createContext();

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export const ProfileProvider = ({ children }) => {
  const { user, updateUser } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({});

  const loadProfiles = useCallback(async (page = 1, newFilters = null) => {
    setLoading(true);
    try {
      const filterParams = newFilters || filters;
      const data = await profileService.getDiscoverProfiles(page, filterParams);
      
      if (page === 1) {
        setProfiles(data.results || data);
      } else {
        setProfiles(prev => [...prev, ...(data.results || data)]);
      }
      
      setCurrentPage(page);
      setHasMore(data.next !== null);
      if (newFilters) {
        setFilters(newFilters);
      }
      
      return data;
    } catch (error) {
      console.error('Failed to load profiles:', error);
      toast.error('Failed to load profiles');
      return null;
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const uploadProfileImages = useCallback(async (files) => {
    setUploading(true);
    try {
      const uploaded = await profileService.uploadImages(files);
      // Update user with new images
      if (updateUser && user) {
        const updatedUser = {
          ...user,
          profile_images: [...(user.profile_images || []), ...uploaded]
        };
        updateUser(updatedUser);
      }
      toast.success('Images uploaded successfully!');
      return uploaded;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to upload images';
      toast.error(message);
      throw error;
    } finally {
      setUploading(false);
    }
  }, [user, updateUser]);

  const deleteProfileImage = useCallback(async (imageId) => {
    setProcessing(true);
    try {
      await profileService.deleteImage(imageId);
      // Update user
      if (updateUser && user) {
        const updatedUser = {
          ...user,
          profile_images: user.profile_images.filter(img => img.id !== imageId)
        };
        updateUser(updatedUser);
      }
      toast.success('Image deleted successfully');
      return true;
    } catch (error) {
      toast.error('Failed to delete image');
      throw error;
    } finally {
      setProcessing(false);
    }
  }, [user, updateUser]);

  const updateProfile = useCallback(async (profileData) => {
    setProcessing(true);
    try {
      const updated = await profileService.updateProfile(profileData);
      if (updateUser) {
        updateUser(updated);
      }
      toast.success('Profile updated successfully!');
      return updated;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update profile';
      toast.error(message);
      throw error;
    } finally {
      setProcessing(false);
    }
  }, [updateUser]);

  const getProfile = useCallback(async (userId) => {
    setLoading(true);
    try {
      const data = await profileService.getProfile(userId);
      return data;
    } catch (error) {
      console.error('Failed to get profile:', error);
      toast.error('Failed to load profile');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getVerificationStatus = useCallback(async () => {
    try {
      const data = await profileService.getVerificationStatus();
      return data;
    } catch (error) {
      console.error('Failed to get verification status:', error);
      return null;
    }
  }, []);

  const submitVerification = useCallback(async (formData) => {
    setProcessing(true);
    try {
      const data = await profileService.submitVerification(formData);
      toast.success('Verification submitted successfully!');
      return data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to submit verification';
      toast.error(message);
      throw error;
    } finally {
      setProcessing(false);
    }
  }, []);

  const value = {
    profiles,
    loading,
    uploading,
    processing,
    currentPage,
    hasMore,
    filters,
    loadProfiles,
    uploadProfileImages,
    deleteProfileImage,
    updateProfile,
    getProfile,
    getVerificationStatus,
    submitVerification,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};