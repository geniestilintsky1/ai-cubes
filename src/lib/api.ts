// API Integration Stubs
// Replace these with actual backend URLs when available

const API_BASE = 'http://localhost:3001/api';

export interface RobotCoordinates {
  x: number;
  y: number;
  z: number;
}

export interface CVResult {
  accuracy: number;
  detectedObjects: string[];
  boundingBoxes: { x: number; y: number; width: number; height: number }[];
  confidence: number;
}

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface SessionResult {
  studentId: string;
  date: Date;
  robotCoordinates: RobotCoordinates;
  cvAccuracy: number;
  studentRgb: RGBColor;
  aiRgb: RGBColor;
  rgbDelta: number;
}

// Mock delay to simulate network
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function sendRobotCoordinates(coords: RobotCoordinates): Promise<{ success: boolean }> {
  await delay(500);
  console.log('API: Sending robot coordinates', coords);
  // TODO: Replace with actual API call
  // return fetch(`${API_BASE}/robot/coordinates`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(coords),
  // }).then(res => res.json());
  return { success: true };
}

export async function uploadDrawing(file: File): Promise<{ success: boolean; imageUrl: string }> {
  await delay(1000);
  console.log('API: Uploading drawing', file.name);
  // TODO: Replace with actual API call
  // const formData = new FormData();
  // formData.append('drawing', file);
  // return fetch(`${API_BASE}/upload/drawing`, {
  //   method: 'POST',
  //   body: formData,
  // }).then(res => res.json());
  return { 
    success: true, 
    imageUrl: URL.createObjectURL(file) 
  };
}

export async function fetchCvResult(imageUrl: string): Promise<CVResult> {
  await delay(1500);
  console.log('API: Fetching CV result for', imageUrl);
  // TODO: Replace with actual API call
  // return fetch(`${API_BASE}/cv/analyze`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ imageUrl }),
  // }).then(res => res.json());
  return {
    accuracy: Math.random() * 30 + 70, // 70-100%
    detectedObjects: ['robot', 'cube', 'grid'],
    boundingBoxes: [
      { x: 100, y: 100, width: 200, height: 200 },
    ],
    confidence: Math.random() * 20 + 80,
  };
}

export async function submitCoordinates(coords: RobotCoordinates): Promise<{ success: boolean }> {
  await delay(500);
  console.log('API: Submitting student coordinates', coords);
  // TODO: Replace with actual API call
  return { success: true };
}

export async function submitStudentRgb(rgb: RGBColor): Promise<{ success: boolean }> {
  await delay(500);
  console.log('API: Submitting student RGB', rgb);
  // TODO: Replace with actual API call
  return { success: true };
}

export async function fetchAiRgb(coords: RobotCoordinates): Promise<RGBColor> {
  await delay(800);
  console.log('API: Fetching AI RGB for coordinates', coords);
  // TODO: Replace with actual API call
  // The AI predicts RGB based on position in the 3D space
  return {
    r: Math.round(coords.x),
    g: Math.round(coords.y),
    b: Math.round(coords.z),
  };
}

export async function sendChatMessage(
  message: string, 
  context: { coords: RobotCoordinates; studentRgb: RGBColor; aiRgb: RGBColor }
): Promise<string> {
  await delay(1200);
  console.log('API: Sending chat message', message);
  // TODO: Replace with actual API call
  // Simulated tutor responses
  const responses = [
    "Great question! The RGB values correspond to the robot's position in 3D space, where X maps to Red, Y to Green, and Z to Blue.",
    "You're on the right track! Remember, each axis (X, Y, Z) can have values from 0-255, just like RGB color components.",
    "Excellent thinking! The Cartesian coordinate system directly maps to the RGB color space in this exercise.",
    "Let me explain further. When the robot is at position (128, 64, 255), it would correspond to RGB color (128, 64, 255) - a bright purple!",
    "That's a thoughtful observation. The relationship between spatial position and color helps visualize abstract coordinate concepts.",
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

export async function saveSessionResults(result: SessionResult): Promise<{ success: boolean }> {
  await delay(500);
  console.log('API: Saving session results', result);
  // TODO: Replace with actual API call
  return { success: true };
}

export async function fetchDashboardData(): Promise<SessionResult[]> {
  await delay(800);
  console.log('API: Fetching dashboard data');
  // TODO: Replace with actual API call
  // Mock data for teacher dashboard
  const mockStudents = ['Alice', 'Bob', 'Charlie', 'Diana', 'Edward'];
  return mockStudents.map((name, i) => ({
    studentId: name,
    date: new Date(Date.now() - i * 86400000),
    robotCoordinates: { 
      x: Math.round(Math.random() * 255), 
      y: Math.round(Math.random() * 255), 
      z: Math.round(Math.random() * 255) 
    },
    cvAccuracy: Math.random() * 30 + 70,
    studentRgb: { 
      r: Math.round(Math.random() * 255), 
      g: Math.round(Math.random() * 255), 
      b: Math.round(Math.random() * 255) 
    },
    aiRgb: { 
      r: Math.round(Math.random() * 255), 
      g: Math.round(Math.random() * 255), 
      b: Math.round(Math.random() * 255) 
    },
    rgbDelta: Math.random() * 50,
  }));
}

export function calculateRgbDelta(rgb1: RGBColor, rgb2: RGBColor): number {
  const dr = rgb1.r - rgb2.r;
  const dg = rgb1.g - rgb2.g;
  const db = rgb1.b - rgb2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

export function rgbToHex(rgb: RGBColor): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

export function hexToRgb(hex: string): RGBColor {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 0, g: 0, b: 0 };
}
