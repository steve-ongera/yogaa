import React from 'react';

const Loader = ({ size = 'medium' }) => {
  return (
    <div className={`loader-container ${size}`}>
      <div className={`loader ${size}`}></div>
    </div>
  );
};

export default Loader;