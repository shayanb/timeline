// Template Loader Module
// This module handles loading and inserting HTML templates

/**
 * Load HTML template from file
 * @param {string} templatePath - Path to the template file
 * @returns {Promise<string>} Template HTML content
 */
export async function loadTemplate(templatePath) {
  try {
    const response = await fetch(templatePath);
    if (!response.ok) {
      throw new Error(`Failed to load template: ${templatePath}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Template loading error:', error);
    throw error;
  }
}

/**
 * Insert template into a container element
 * @param {string} containerId - ID of the container element
 * @param {string} templatePath - Path to the template file
 * @returns {Promise<HTMLElement>} The container element
 */
export async function insertTemplate(containerId, templatePath) {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container element not found: ${containerId}`);
  }
  
  const templateHtml = await loadTemplate(templatePath);
  container.innerHTML = templateHtml;
  
  return container;
}

/**
 * Load multiple templates into their respective containers
 * @param {Array<{containerId: string, templatePath: string}>} templates - Array of template configurations
 * @returns {Promise<void>}
 */
export async function loadMultipleTemplates(templates) {
  const promises = templates.map(({ containerId, templatePath }) => 
    insertTemplate(containerId, templatePath)
  );
  
  await Promise.all(promises);
}

/**
 * Initialize all templates for the timeline application
 * @returns {Promise<void>}
 */
export async function initializeTemplates() {
  // We don't need this for the current refactor since we're keeping templates inline
  // This is here for future enhancements if needed
  console.log('Template system ready (inline templates in use)');
}