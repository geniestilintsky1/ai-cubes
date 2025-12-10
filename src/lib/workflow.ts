export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: string;
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'placement',
    title: 'Place Robot',
    description: 'Position the robot in 3D space',
    path: '/3d',
    icon: 'Box',
  },
  {
    id: 'upload',
    title: 'Draw & Upload',
    description: 'Draw the scene and upload your drawing',
    path: '/upload',
    icon: 'Upload',
  },
  {
    id: 'verify',
    title: 'CV Verification',
    description: 'Review computer vision analysis',
    path: '/verify',
    icon: 'Eye',
  },
  {
    id: 'coords',
    title: 'Input Coordinates',
    description: 'Enter your coordinate predictions',
    path: '/coords',
    icon: 'Target',
  },
  {
    id: 'predict',
    title: 'Predict RGB',
    description: 'Predict the RGB color values',
    path: '/predict',
    icon: 'Palette',
  },
  {
    id: 'compare',
    title: 'Compare Results',
    description: 'Compare your prediction with AI',
    path: '/compare',
    icon: 'GitCompare',
  },
  {
    id: 'chat',
    title: 'Tutor Chat',
    description: 'Discuss with the AI tutor',
    path: '/chat',
    icon: 'MessageCircle',
  },
];

export function getStepIndex(stepId: string): number {
  return WORKFLOW_STEPS.findIndex((s) => s.id === stepId);
}

export function getStepById(stepId: string): WorkflowStep | undefined {
  return WORKFLOW_STEPS.find((s) => s.id === stepId);
}

export function getNextStep(currentStepId: string): WorkflowStep | null {
  const currentIndex = getStepIndex(currentStepId);
  if (currentIndex === -1 || currentIndex >= WORKFLOW_STEPS.length - 1) {
    return null;
  }
  return WORKFLOW_STEPS[currentIndex + 1];
}

export function getPrevStep(currentStepId: string): WorkflowStep | null {
  const currentIndex = getStepIndex(currentStepId);
  if (currentIndex <= 0) {
    return null;
  }
  return WORKFLOW_STEPS[currentIndex - 1];
}

export function isStepAccessible(targetStepId: string, completedSteps: string[]): boolean {
  const targetIndex = getStepIndex(targetStepId);
  if (targetIndex === 0) return true;
  
  // Check if all previous steps are completed
  for (let i = 0; i < targetIndex; i++) {
    if (!completedSteps.includes(WORKFLOW_STEPS[i].id)) {
      return false;
    }
  }
  return true;
}

export function getProgress(completedSteps: string[]): number {
  return (completedSteps.length / WORKFLOW_STEPS.length) * 100;
}
