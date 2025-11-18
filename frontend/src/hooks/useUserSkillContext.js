import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';

const UserSkillContext = createContext();

export const UserSkillProvider = ({ children }) => {
  const [skillLevel, setSkillLevel] = useState('standard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserSkillLevel();
  }, []);

  const loadUserSkillLevel = async () => {
    try {
      const response = await apiClient.get('/auth/me');
      if (response.data.success && response.data.data.skillLevel) {
        setSkillLevel(response.data.data.skillLevel);
      }
    } catch (error) {
      console.error('Error loading user skill level:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSkillLevel = async (newLevel) => {
    try {
      await apiClient.put('/auth/profile', { skillLevel: newLevel });
      setSkillLevel(newLevel);
    } catch (error) {
      console.error('Error updating skill level:', error);
      throw error;
    }
  };

  const isSimpleMode = () => skillLevel === 'simple';
  const isStandardMode = () => skillLevel === 'standard';
  const isProMode = () => skillLevel === 'pro';

  const value = {
    skillLevel,
    updateSkillLevel,
    isSimpleMode,
    isStandardMode,
    isProMode,
    loading
  };

  return (
    <UserSkillContext.Provider value={value}>
      {children}
    </UserSkillContext.Provider>
  );
};

export const useUserSkillContext = () => {
  const context = useContext(UserSkillContext);
  if (!context) {
    throw new Error('useUserSkillContext must be used within UserSkillProvider');
  }
  return context;
};

export default useUserSkillContext;
