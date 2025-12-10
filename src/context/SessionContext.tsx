import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { RobotCoordinates, RGBColor, CVResult, ChatMessage } from '@/lib/api';

export interface SessionState {
  studentId: string;
  robotCoordinates: RobotCoordinates;
  uploadedImage: string | null;
  cvResult: CVResult | null;
  studentCoordinates: RobotCoordinates | null;
  studentRgb: RGBColor;
  aiRgb: RGBColor | null;
  chatHistory: ChatMessage[];
  completedSteps: string[];
  currentStep: string;
}

type SessionAction =
  | { type: 'SET_STUDENT_ID'; payload: string }
  | { type: 'SET_ROBOT_COORDINATES'; payload: RobotCoordinates }
  | { type: 'SET_UPLOADED_IMAGE'; payload: string }
  | { type: 'SET_CV_RESULT'; payload: CVResult }
  | { type: 'SET_STUDENT_COORDINATES'; payload: RobotCoordinates }
  | { type: 'SET_STUDENT_RGB'; payload: RGBColor }
  | { type: 'SET_AI_RGB'; payload: RGBColor }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'COMPLETE_STEP'; payload: string }
  | { type: 'SET_CURRENT_STEP'; payload: string }
  | { type: 'RESET_SESSION' };

const initialState: SessionState = {
  studentId: `student_${Date.now()}`,
  robotCoordinates: { x: 128, y: 128, z: 128 },
  uploadedImage: null,
  cvResult: null,
  studentCoordinates: null,
  studentRgb: { r: 128, g: 128, b: 128 },
  aiRgb: null,
  chatHistory: [],
  completedSteps: [],
  currentStep: 'placement',
};

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'SET_STUDENT_ID':
      return { ...state, studentId: action.payload };
    case 'SET_ROBOT_COORDINATES':
      return { ...state, robotCoordinates: action.payload };
    case 'SET_UPLOADED_IMAGE':
      return { ...state, uploadedImage: action.payload };
    case 'SET_CV_RESULT':
      return { ...state, cvResult: action.payload };
    case 'SET_STUDENT_COORDINATES':
      return { ...state, studentCoordinates: action.payload };
    case 'SET_STUDENT_RGB':
      return { ...state, studentRgb: action.payload };
    case 'SET_AI_RGB':
      return { ...state, aiRgb: action.payload };
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatHistory: [...state.chatHistory, action.payload] };
    case 'COMPLETE_STEP':
      if (state.completedSteps.includes(action.payload)) {
        return state;
      }
      return { ...state, completedSteps: [...state.completedSteps, action.payload] };
    case 'SET_CURRENT_STEP':
      return { ...state, currentStep: action.payload };
    case 'RESET_SESSION':
      return { ...initialState, studentId: `student_${Date.now()}` };
    default:
      return state;
  }
}

interface SessionContextType {
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
  setRobotCoordinates: (coords: RobotCoordinates) => void;
  setUploadedImage: (url: string) => void;
  setCvResult: (result: CVResult) => void;
  setStudentCoordinates: (coords: RobotCoordinates) => void;
  setStudentRgb: (rgb: RGBColor) => void;
  setAiRgb: (rgb: RGBColor) => void;
  addChatMessage: (message: ChatMessage) => void;
  completeStep: (stepId: string) => void;
  setCurrentStep: (stepId: string) => void;
  resetSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const STORAGE_KEY = 'tangible-ai-session';

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, initialState, (initial) => {
    if (typeof window === 'undefined') return initial;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Restore dates for chat messages
        if (parsed.chatHistory) {
          parsed.chatHistory = parsed.chatHistory.map((msg: ChatMessage) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
        }
        return { ...initial, ...parsed };
      } catch {
        return initial;
      }
    }
    return initial;
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const contextValue: SessionContextType = {
    state,
    dispatch,
    setRobotCoordinates: (coords) => dispatch({ type: 'SET_ROBOT_COORDINATES', payload: coords }),
    setUploadedImage: (url) => dispatch({ type: 'SET_UPLOADED_IMAGE', payload: url }),
    setCvResult: (result) => dispatch({ type: 'SET_CV_RESULT', payload: result }),
    setStudentCoordinates: (coords) => dispatch({ type: 'SET_STUDENT_COORDINATES', payload: coords }),
    setStudentRgb: (rgb) => dispatch({ type: 'SET_STUDENT_RGB', payload: rgb }),
    setAiRgb: (rgb) => dispatch({ type: 'SET_AI_RGB', payload: rgb }),
    addChatMessage: (message) => dispatch({ type: 'ADD_CHAT_MESSAGE', payload: message }),
    completeStep: (stepId) => dispatch({ type: 'COMPLETE_STEP', payload: stepId }),
    setCurrentStep: (stepId) => dispatch({ type: 'SET_CURRENT_STEP', payload: stepId }),
    resetSession: () => dispatch({ type: 'RESET_SESSION' }),
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
