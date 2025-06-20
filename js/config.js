// App Configuration and Constants
// This module contains global configuration, constants, and application state

// App version and metadata
export const APP_VERSION = '1.7.3';
export const COPYRIGHT = '© 2025 Pangana Inc.';

// Milestone default emoji
export const DEFAULT_MILESTONE_EMOJI = '📍';

// Global application state
let hasUnsavedChanges = false;
let debugMode = false;

// Function to update modification status
export function updateModificationStatus() {
  const statusElement = document.getElementById('modification-status');
  if (statusElement) {
    if (hasUnsavedChanges) {
      statusElement.style.display = 'inline-block';
    } else {
      statusElement.style.display = 'none';
    }
  }
}

// Function to set unsaved changes flag
export function setUnsavedChanges(status) {
  hasUnsavedChanges = status;
  updateModificationStatus();
}

// Function to get unsaved changes status
export function getUnsavedChanges() {
  return hasUnsavedChanges;
}

// PNG export initialization check
export function initializePNGExport() {
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      if (window.html2canvas) {
        console.log('html2canvas loaded successfully');
      } else {
        console.warn('html2canvas not detected - PNG export may not be available');
      }
    });
  }
}

// Initialize app metadata in the DOM
export function initializeAppMetadata() {
  const versionElement = document.getElementById('app-version');
  const copyrightElement = document.getElementById('app-copyright');
  
  if (versionElement) {
    versionElement.textContent = `Version ${APP_VERSION}`;
  }
  
  if (copyrightElement) {
    copyrightElement.textContent = COPYRIGHT;
  }
}

// Check if app is in development mode
export function isDevelopmentMode() {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.search.includes('debug=true');
}

// Debug mode controls
export function setDebugMode(enabled) {
  debugMode = enabled;
  if (enabled) {
    console.log('🐛 Debug mode enabled - detailed console logging active');
  }
}

export function isDebugMode() {
  return debugMode || isDevelopmentMode();
}

// Enhanced console logging functions
export function debugLog(...args) {
  if (isDebugMode()) {
    console.log(...args);
  }
}

export function infoLog(...args) {
  // Always log important events
  console.log(...args);
}