import React from 'react';

const Blob = ({ color, size, position, delay }) => (
  <div 
    className={`absolute blur-[100px] z-[-1] opacity-40 rounded-full animate-float ${color} ${size} ${position}`}
    style={{ animationDelay: delay }}
  ></div>
);

export default Blob;