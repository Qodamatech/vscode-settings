(function() {
  'use strict';

  console.log('[IntelliJ Colors] Simple approach loaded');

  const folderColors = {
    'test': 'rgba(6, 224, 108, 0.13)',
    'native-test': 'rgba(4, 223, 106, 0.13)',
    'main': 'rgba(4, 160, 243, 0.1)',
    'src': 'rgba(4, 159, 243, 0.03)',
    'build': 'rgba(255, 204, 0, 0.08)',
    'target': '#ffcc0012',
    'resources': '#06def218'
  };

  function getRowName(row) {
    const ariaLabel = row.getAttribute('aria-label');
    return ariaLabel ? ariaLabel.split(',')[0].trim() : null;
  }

  function getIndentLevel(row) {
    const ariaLevel = row.getAttribute('aria-level');
    if (ariaLevel) return parseInt(ariaLevel, 10);
    
    const indent = row.querySelector('.monaco-tl-indent');
    if (indent) {
      const style = indent.getAttribute('style') || '';
      const match = style.match(/width:\s*(\d+)px/);
      if (match) return Math.floor(parseInt(match[1], 10) / 20);
    }
    return 0;
  }

  function applyColors() {
    const rows = document.querySelectorAll('.monaco-list-row');
    if (rows.length === 0) return;

    let activeColors = new Map(); // level -> color
    
    rows.forEach((row) => {
      const name = getRowName(row);
      const level = getIndentLevel(row);
      if (!name) return;

      // Clear deeper levels
      for (const [lvl] of activeColors) {
        if (lvl >= level) activeColors.delete(lvl);
      }

      let color = null;

      // Check if this is a special folder
      for (const [folderName, folderColor] of Object.entries(folderColors)) {
        if (name === folderName) {
          color = folderColor;
          activeColors.set(level, color);
          break;
        }
      }

      // Inherit from parent level
      if (!color) {
        for (let parentLevel = level - 1; parentLevel >= 0; parentLevel--) {
          if (activeColors.has(parentLevel)) {
            color = activeColors.get(parentLevel);
            activeColors.set(level, color);
            break;
          }
        }
      }

      // Apply color
      if (color) {
        row.style.setProperty('background-color', color, 'important');
      } else {
        row.style.removeProperty('background-color');
      }
    });
  }

  function initialize() {
    applyColors();

    const observer = new MutationObserver(applyColors);
    const workbench = document.querySelector('.monaco-workbench');
    
    if (workbench) {
      observer.observe(workbench, { childList: true, subtree: true });
    }

    setInterval(applyColors, 50); // Apply very frequently
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initialize, 2000));
  } else {
    setTimeout(initialize, 2000);
  }
})();
