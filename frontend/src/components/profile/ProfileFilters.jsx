import React, { useState } from 'react';
import { FiFilter, FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const ProfileFilters = ({ onFilterChange }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    gender: '',
    looking_for: user?.looking_for || '',
    age_min: 18,
    age_max: 50,
    location: '',
    interests: [],
    distance: 50,
    verified_only: false,
    has_verification_badge: false,
  });

  const [interestsInput, setInterestsInput] = useState('');
  const commonInterests = ['Music', 'Sports', 'Travel', 'Reading', 'Movies', 'Cooking', 'Dancing', 'Photography', 'Art', 'Gaming'];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const addInterest = (interest) => {
    if (!filters.interests.includes(interest)) {
      const newFilters = {
        ...filters,
        interests: [...filters.interests, interest]
      };
      setFilters(newFilters);
      onFilterChange(newFilters);
    }
    setInterestsInput('');
  };

  const removeInterest = (interest) => {
    const newFilters = {
      ...filters,
      interests: filters.interests.filter(i => i !== interest)
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const defaultFilters = {
      gender: '',
      looking_for: '',
      age_min: 18,
      age_max: 50,
      location: '',
      interests: [],
      distance: 50,
      verified_only: false,
      has_verification_badge: false,
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  return (
    <div className="profile-filters">
      <button className="filter-toggle" onClick={() => setIsOpen(!isOpen)}>
        <FiFilter /> {isOpen ? 'Hide Filters' : 'Show Filters'}
        {Object.keys(filters).some(key => {
          if (key === 'age_min' || key === 'age_max') return filters[key] !== (key === 'age_min' ? 18 : 50);
          if (key === 'distance') return filters[key] !== 50;
          if (key === 'verified_only' || key === 'has_verification_badge') return filters[key] !== false;
          if (key === 'interests') return filters[key].length > 0;
          return filters[key] !== '';
        }) && <span className="filter-dot">●</span>}
      </button>

      {isOpen && (
        <div className="filters-panel">
          <div className="filter-row">
            <div className="filter-group">
              <label>Looking For</label>
              <select
                value={filters.looking_for}
                onChange={(e) => handleFilterChange('looking_for', e.target.value)}
              >
                <option value="">Anyone</option>
                <option value="M">Men</option>
                <option value="F">Women</option>
                <option value="O">Other</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Gender</label>
              <select
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
              >
                <option value="">Any</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label>Age Range: {filters.age_min} - {filters.age_max}</label>
              <div className="range-slider">
                <input
                  type="range"
                  min="18"
                  max="80"
                  value={filters.age_min}
                  onChange={(e) => handleFilterChange('age_min', parseInt(e.target.value))}
                />
                <input
                  type="range"
                  min="18"
                  max="80"
                  value={filters.age_max}
                  onChange={(e) => handleFilterChange('age_max', parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label>Location</label>
              <input
                type="text"
                placeholder="Enter city or area"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>Distance: {filters.distance} km</label>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={filters.distance}
                onChange={(e) => handleFilterChange('distance', parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group interests-group">
              <label>Interests</label>
              <div className="interests-input">
                <input
                  type="text"
                  placeholder="Add an interest..."
                  value={interestsInput}
                  onChange={(e) => setInterestsInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addInterest(interestsInput)}
                />
                <button onClick={() => addInterest(interestsInput)}>Add</button>
              </div>
              <div className="interests-tags">
                {filters.interests.map((interest, index) => (
                  <span key={index} className="interest-tag">
                    {interest}
                    <button onClick={() => removeInterest(interest)}>
                      <FiX size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="suggested-interests">
                {commonInterests
                  .filter(i => !filters.interests.includes(i))
                  .slice(0, 6)
                  .map((interest, index) => (
                    <button
                      key={index}
                      className="suggested-interest"
                      onClick={() => addInterest(interest)}
                    >
                      + {interest}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          <div className="filter-row checkboxes">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.verified_only}
                onChange={(e) => handleFilterChange('verified_only', e.target.checked)}
              />
              Verified Users Only
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={filters.has_verification_badge}
                onChange={(e) => handleFilterChange('has_verification_badge', e.target.checked)}
              />
              With Verification Badge
            </label>
          </div>

          <div className="filter-actions">
            <button className="clear-filters" onClick={clearFilters}>
              Clear All
            </button>
            <button className="apply-filters" onClick={() => onFilterChange(filters)}>
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileFilters;