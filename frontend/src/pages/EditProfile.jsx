import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Navbar from '../components/common/Navbar';
import Loader from '../components/common/Loader';
import { profileService } from '../services';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().max(255, 'Location must be less than 255 characters').optional(),
  gender: z.enum(['M', 'F', 'O']).optional(),
  looking_for: z.enum(['M', 'F', 'O']).optional(),
  date_of_birth: z.string().optional(),
  interests: z.array(z.string()).optional(),
});

const EditProfile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [interestsInput, setInterestsInput] = useState('');
  const [interests, setInterests] = useState(user?.interests || []);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      bio: user?.bio || '',
      location: user?.location || '',
      gender: user?.gender || '',
      looking_for: user?.looking_for || '',
      date_of_birth: user?.date_of_birth || '',
    }
  });

  useEffect(() => {
    if (user) {
      setValue('bio', user.bio || '');
      setValue('location', user.location || '');
      setValue('gender', user.gender || '');
      setValue('looking_for', user.looking_for || '');
      setValue('date_of_birth', user.date_of_birth || '');
      setInterests(user.interests || []);
    }
  }, [user, setValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = {
        ...data,
        interests: interests,
      };
      
      const updatedUser = await profileService.updateProfile(formData);
      updateUser(updatedUser);
      toast.success('Profile updated successfully!');
      navigate('/profile');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const addInterest = () => {
    if (interestsInput.trim() && !interests.includes(interestsInput.trim())) {
      setInterests([...interests, interestsInput.trim()]);
      setInterestsInput('');
    }
  };

  const removeInterest = (index) => {
    setInterests(interests.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addInterest();
    }
  };

  return (
    <>
      <Navbar />
      <div className="edit-profile-page">
        <div className="edit-profile-container">
          <div className="edit-profile-header">
            <h1>Edit Profile</h1>
            <p>Update your information to get better matches</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="edit-profile-form">
            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                {...register('bio')}
                placeholder="Tell others about yourself..."
                rows={4}
                className={errors.bio ? 'error' : ''}
              />
              {errors.bio && <span className="error-message">{errors.bio.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                {...register('location')}
                placeholder="City, Country"
                className={errors.location ? 'error' : ''}
              />
              {errors.location && <span className="error-message">{errors.location.message}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select id="gender" {...register('gender')}>
                  <option value="">Select Gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
                {errors.gender && <span className="error-message">{errors.gender.message}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="looking_for">Looking For</label>
                <select id="looking_for" {...register('looking_for')}>
                  <option value="">Select</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
                {errors.looking_for && <span className="error-message">{errors.looking_for.message}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="date_of_birth">Date of Birth</label>
              <input
                id="date_of_birth"
                type="date"
                {...register('date_of_birth')}
                className={errors.date_of_birth ? 'error' : ''}
              />
              {errors.date_of_birth && <span className="error-message">{errors.date_of_birth.message}</span>}
            </div>

            <div className="form-group">
              <label>Interests</label>
              <div className="interests-input-wrapper">
                <input
                  type="text"
                  value={interestsInput}
                  onChange={(e) => setInterestsInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add an interest..."
                  className="interests-input"
                />
                <button type="button" onClick={addInterest} className="add-interest-btn">
                  Add
                </button>
              </div>
              <div className="interests-container">
                {interests.map((interest, index) => (
                  <span key={index} className="interest-chip">
                    {interest}
                    <button 
                      type="button" 
                      onClick={() => removeInterest(index)}
                      className="remove-interest"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <small className="input-hint">Press Enter or click Add to add interests</small>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => navigate('/profile')}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? <Loader size="small" /> : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditProfile;