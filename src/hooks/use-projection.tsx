
import React, { createContext, useContext, useState, useEffect } from 'react';

export type ProjectionTimeUnit = 'days' | 'weeks' | 'months' | 'years';

interface ProjectionConfig {
  projectionTimeUnit: ProjectionTimeUnit;
  projectionTimeAmount: number;
  setProjectionTimeUnit: (unit: ProjectionTimeUnit) => void;
  setProjectionTimeAmount: (amount: number) => void;
}

const defaultConfig: ProjectionConfig = {
  projectionTimeUnit: 'months',
  projectionTimeAmount: 12,
  setProjectionTimeUnit: () => {},
  setProjectionTimeAmount: () => {}
};

const ProjectionContext = createContext<ProjectionConfig>(defaultConfig);

export const useProjection = () => {
  const context = useContext(ProjectionContext);
  if (!context) {
    throw new Error('useProjection must be used within a ProjectionProvider');
  }
  return context;
};

export const ProjectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projectionTimeUnit, setProjectionTimeUnit] = useState<ProjectionTimeUnit>('months');
  const [projectionTimeAmount, setProjectionTimeAmount] = useState(12);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedTimeUnit = localStorage.getItem('projectionTimeUnit');
    if (savedTimeUnit) {
      setProjectionTimeUnit(savedTimeUnit as ProjectionTimeUnit);
    }

    const savedTimeAmount = localStorage.getItem('projectionTimeAmount');
    if (savedTimeAmount) {
      setProjectionTimeAmount(parseInt(savedTimeAmount));
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('projectionTimeUnit', projectionTimeUnit);
  }, [projectionTimeUnit]);

  useEffect(() => {
    localStorage.setItem('projectionTimeAmount', projectionTimeAmount.toString());
  }, [projectionTimeAmount]);

  return (
    <ProjectionContext.Provider
      value={{
        projectionTimeUnit,
        setProjectionTimeUnit,
        projectionTimeAmount,
        setProjectionTimeAmount
      }}
    >
      {children}
    </ProjectionContext.Provider>
  );
};
