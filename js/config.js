// App Configuration and Constants
// This module contains global configuration, constants, and application state

// App version and metadata
export const APP_VERSION = '1.6.8';
export const COPYRIGHT = '© 2025 Timeline App';

// Milestone default emoji
export const DEFAULT_MILESTONE_EMOJI = '📍';

// Global application state
let hasUnsavedChanges = false;

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

// Function to get unsaved changes flag
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