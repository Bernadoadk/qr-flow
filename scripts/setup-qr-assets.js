import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer quelques assets d'exemple pour les frames
const framesDir = path.join(__dirname, '..', 'public', 'qr-styles', 'frames');
const logosDir = path.join(__dirname, '..', 'public', 'qr-styles', 'logos');

// Créer des SVG d'exemple pour les frames
const frameExamples = [
  {
    name: 'border-simple.svg',
    content: `<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="5" y="5" width="90" height="90" rx="10" ry="10" stroke="#333333" stroke-width="2" fill="none"/>
</svg>`
  },
  {
    name: 'border-thick.svg',
    content: `<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="10" y="10" width="80" height="80" rx="15" ry="15" stroke="#333333" stroke-width="8" fill="none"/>
</svg>`
  },
  {
    name: 'gradient-border.svg',
    content: `<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
<stop offset="0%" style="stop-color:#6666FF;stop-opacity:1" />
<stop offset="100%" style="stop-color:#FF66FF;stop-opacity:1" />
</linearGradient>
</defs>
<rect x="5" y="5" width="90" height="90" rx="10" ry="10" stroke="url(#grad)" stroke-width="4" fill="none"/>
</svg>`
  }
];

// Créer des logos d'exemple
const logoExamples = [
  {
    name: 'logo-example.svg',
    content: `<svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="25" cy="25" r="20" fill="#3B82F6"/>
<text x="25" y="30" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">QR</text>
</svg>`
  }
];

// Créer les dossiers s'ils n'existent pas
if (!fs.existsSync(framesDir)) {
  fs.mkdirSync(framesDir, { recursive: true });
}

if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

// Écrire les fichiers d'exemple
frameExamples.forEach(frame => {
  const filePath = path.join(framesDir, frame.name);
  fs.writeFileSync(filePath, frame.content);
  console.log(`Créé: ${filePath}`);
});

logoExamples.forEach(logo => {
  const filePath = path.join(logosDir, logo.name);
  fs.writeFileSync(filePath, logo.content);
  console.log(`Créé: ${filePath}`);
});

console.log('Assets QR créés avec succès !');
