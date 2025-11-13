(function() {
  'use strict';

  console.log('[IntelliJ Colors] Script loaded');

  // Color configuration matching IntelliJ classpath coloring
  const folderColors = {
    'test': 'rgba(6, 224, 108, 0.13)',      // Green for test
    'native-test': 'rgba(4, 223, 106, 0.13)', // Green for native-test
    'main': 'rgba(4, 160, 243, 0.1)',       // Blue for main
    'src': 'rgba(4, 159, 243, 0.03)',        // Blue for src
    'build': 'rgba(255, 204, 0, 0.08)',      // Yellow for build
    'target': '#ffcc0012'      // Yellow for build
  };

  // Track which rows are under which parent folders
  const rowParentMap = new Map();

  function getIndentLevel(row) {
    // Get indent level from aria-level attribute or by checking the indent style
    const ariaLevel = row.getAttribute('aria-level');
    if (ariaLevel) return parseInt(ariaLevel, 10);
    
    // Fallback: check for indent div
    const indent = row.querySelector('.monaco-tl-indent');
    if (indent) {
      const style = indent.getAttribute('style') || '';
      const match = style.match(/width:\s*(\d+)px/);
      if (match) return Math.floor(parseInt(match[1], 10) / 20);
    }
    
    return 0;
  }

  function getRowName(row) {
    const ariaLabel = row.getAttribute('aria-label');
    if (!ariaLabel) return null;
    
    // Extract just the folder/file name from aria-label
    // Format is usually "foldername" or "filename, details"
    return ariaLabel.split(',')[0].trim();
  }

  function applyColorsToTree() {
    const rows = document.querySelectorAll('.monaco-list-row');
    
    if (rows.length === 0) {
      return;
    }

    let coloredCount = 0;
    let parentStack = []; // Stack to track parent folders: [{name, color, level}]
    
    rows.forEach((row) => {
      const level = getIndentLevel(row);
      const name = getRowName(row);
      
      if (!name) return;

      // Pop parents that are not ancestors (same or higher level)
      while (parentStack.length > 0 && parentStack[parentStack.length - 1].level >= level) {
        parentStack.pop();
      }

      // Check if this row is a classpath folder
      let currentColor = null;
      for (const [folderName, color] of Object.entries(folderColors)) {
        if (name === folderName) {
          currentColor = color;
          break;
        }
      }

      // If this is a classpath folder, add to stack
      if (currentColor) {
        parentStack.push({ name, color: currentColor, level });
        row.style.backgroundColor = currentColor;
        coloredCount++;
      }
      // If under a classpath folder, inherit its color
      else if (parentStack.length > 0) {
        const parentColor = parentStack[parentStack.length - 1].color;
        row.style.backgroundColor = parentColor;
        coloredCount++;
      }
      // Otherwise, clear any existing color
      else {
        row.style.backgroundColor = '';
      }
    });

    console.log(`[IntelliJ Colors] Colored ${coloredCount} rows out of ${rows.length}`);
  }

  // Apply colors on load and when explorer updates
  function initialize() {
    console.log('[IntelliJ Colors] Initializing...');
    applyColorsToTree();

    // Watch for DOM changes in the explorer
    const observer = new MutationObserver(() => {
      applyColorsToTree();
    });

    // Target the entire workbench
    const workbench = document.querySelector('.monaco-workbench');
    
    if (workbench) {
      console.log('[IntelliJ Colors] Observer attached to workbench');
      observer.observe(workbench, {
        childList: true,
        subtree: true
      });
    }

    // Re-apply periodically
    setInterval(applyColorsToTree, 2000);
  }

  // Wait for VSCode to fully load
  const startInitialization = () => {
    setTimeout(initialize, 2000);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startInitialization);
  } else {
    startInitialization();
  }
})();
