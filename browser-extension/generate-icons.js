// Generate simple placeholder icons for the browser extension

// This is a simple HTML file that can be used to generate placeholder icons
// Open this in a browser and use browser developer tools to create the icon files

const createIcon = (size) => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#4F46E5');
  gradient.addColorStop(1, '#7C3AED');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Add "P" for Pump
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('P', size/2, size/2);
  
  return canvas.toDataURL('image/png');
};

console.log('Icon generation script ready. Run the following commands in browser console:');
console.log('For 16px: createIcon(16)');
console.log('For 48px: createIcon(48)');  
console.log('For 128px: createIcon(128)');