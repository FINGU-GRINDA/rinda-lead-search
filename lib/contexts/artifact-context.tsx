'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Lead } from '@/lib/schemas/lead';

export type ArtifactType = 'leads' | 'chart' | 'table' | null;

export interface AgenticStep {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  message: string;
  timestamp: Date;
}

interface ArtifactContextType {
  // Artifact state
  artifactType: ArtifactType;
  artifactData: Lead[] | null;
  isArtifactVisible: boolean;

  // Agentic status
  agenticSteps: AgenticStep[];
  currentStep: string | null;

  // Actions
  setArtifact: (type: ArtifactType, data: any) => void;
  clearArtifact: () => void;
  toggleArtifactVisibility: () => void;
  addAgenticStep: (step: Omit<AgenticStep, 'id' | 'timestamp'>) => void;
  updateAgenticStep: (id: string, updates: Partial<AgenticStep>) => void;
  clearAgenticSteps: () => void;
}

const ArtifactContext = createContext<ArtifactContextType | undefined>(undefined);

export function ArtifactProvider({ children }: { children: ReactNode }) {
  const [artifactType, setArtifactType] = useState<ArtifactType>(null);
  const [artifactData, setArtifactData] = useState<Lead[] | null>(null);
  const [isArtifactVisible, setIsArtifactVisible] = useState(false);
  const [agenticSteps, setAgenticSteps] = useState<AgenticStep[]>([]);
  const [currentStep, setCurrentStep] = useState<string | null>(null);

  const setArtifact = (type: ArtifactType, data: any) => {
    setArtifactType(type);
    setArtifactData(data);
    setIsArtifactVisible(true);
  };

  const clearArtifact = () => {
    setArtifactType(null);
    setArtifactData(null);
    setIsArtifactVisible(false);
  };

  const toggleArtifactVisibility = () => {
    setIsArtifactVisible(!isArtifactVisible);
  };

  const addAgenticStep = (step: Omit<AgenticStep, 'id' | 'timestamp'>) => {
    const newStep: AgenticStep = {
      ...step,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
    };
    setAgenticSteps((prev) => [...prev, newStep]);
    if (step.status === 'in_progress') {
      setCurrentStep(newStep.id);
    }
  };

  const updateAgenticStep = (id: string, updates: Partial<AgenticStep>) => {
    setAgenticSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, ...updates } : step))
    );
    if (updates.status === 'completed' || updates.status === 'error') {
      setCurrentStep(null);
    }
  };

  const clearAgenticSteps = () => {
    setAgenticSteps([]);
    setCurrentStep(null);
  };

  return (
    <ArtifactContext.Provider
      value={{
        artifactType,
        artifactData,
        isArtifactVisible,
        agenticSteps,
        currentStep,
        setArtifact,
        clearArtifact,
        toggleArtifactVisibility,
        addAgenticStep,
        updateAgenticStep,
        clearAgenticSteps,
      }}
    >
      {children}
    </ArtifactContext.Provider>
  );
}

export function useArtifact() {
  const context = useContext(ArtifactContext);
  if (context === undefined) {
    throw new Error('useArtifact must be used within an ArtifactProvider');
  }
  return context;
}
