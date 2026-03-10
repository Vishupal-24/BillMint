import { useEffect } from 'react';

const useForceLightMode = () => {
  useEffect(() => {
    // Store the current state of the dark class
    const wasDark = document.documentElement.classList.contains('dark');
    
    // Force remove dark class
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';

    // Cleanup: Restore dark class if it was present
    return () => {
      if (wasDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.colorScheme = 'dark';
      }
    };
  }, []);
};

export default useForceLightMode;
