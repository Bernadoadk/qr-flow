# QR Code Designer

Un configurateur de style complet pour générer des QR codes personnalisés avec la librairie `qr-code-styling`.

## Composants

### QRPreview

Composant principal qui affiche le QR code avec les styles appliqués.

```tsx
import { QRPreview } from "./components/qr";

<QRPreview
  data="https://example.com"
  pattern="rounded"
  marker="extra-rounded"
  center="dot"
  frame="border-simple"
  logo="/path/to/logo.png"
  size={300}
/>;
```

### PatternPicker

Sélecteur pour choisir la forme des points du QR code.

```tsx
import { PatternPicker } from "./components/qr";

<PatternPicker
  onSelect={(pattern) => setPattern(pattern)}
  selectedPattern="rounded"
/>;
```

### MarkerPicker

Sélecteur pour choisir la forme des yeux (markers) du QR code.

```tsx
import { MarkerPicker } from "./components/qr";

<MarkerPicker
  onSelect={(marker) => setMarker(marker)}
  selectedMarker="extra-rounded"
/>;
```

### CenterPicker

Sélecteur pour choisir la forme du centre des yeux.

```tsx
import { CenterPicker } from "./components/qr";

<CenterPicker onSelect={(center) => setCenter(center)} selectedCenter="dot" />;
```

### FramePicker

Sélecteur pour choisir un frame autour du QR code.

```tsx
import { FramePicker } from "./components/qr";

<FramePicker
  onSelect={(frame) => setFrame(frame)}
  selectedFrame="border-simple"
/>;
```

### ImagePicker

Sélecteur d'image (logo) avec upload et images prédéfinies.

```tsx
import { ImagePicker } from "./components/qr";

<ImagePicker onSelect={(img) => setImage(img)} selectedImage={image} />;
```

### LogoUploader

Composant pour uploader un logo central.

```tsx
import { LogoUploader } from "./components/qr";

<LogoUploader onChange={(logo) => setLogo(logo)} currentLogo={logo} />;
```

### QRDesigner

Composant principal qui assemble tous les autres composants.

```tsx
import { QRDesigner } from "./components/qr";

<QRDesigner
  initialData="https://example.com"
  onConfigChange={(config) => console.log(config)}
/>;
```

## Utilisation complète

```tsx
import React from "react";
import { QRDesigner } from "./components/qr";

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <QRDesigner
        initialData="https://example.com"
        onConfigChange={(config) => {
          console.log("Configuration mise à jour:", config);
        }}
      />
    </div>
  );
}
```

## Configuration

Le composant `QRDesigner` accepte les props suivantes :

- `initialData`: URL ou texte initial à encoder
- `onConfigChange`: Callback appelé à chaque changement de configuration
- `className`: Classes CSS additionnelles

## Structure des assets

Les assets sont organisés dans les dossiers suivants :

```
public/qr-styles/
├── patterns/     # Patterns de points
├── markers/      # Formes des yeux
├── centers/      # Centres des yeux
├── frames/       # Frames autour du QR
├── backgrounds/  # Images prédéfinies (utilisées comme logos)
└── logos/        # Logos centraux
```

## Styles disponibles

### Patterns

- `rounded`: Points arrondis
- `square`: Points carrés
- `dots`: Points simples
- `classy`: Style classique
- `classy-rounded`: Classique arrondi
- `extra-rounded`: Très arrondi

### Markers

- `square`: Carré simple
- `extra-rounded`: Carré très arrondi
- `dot`: Point simple
- `classy`: Style classique
- `classy-rounded`: Classique arrondi

### Centers

- `dot`: Point simple
- `square`: Carré simple
- `extra-rounded`: Point très arrondi
- `classy`: Style classique
- `classy-rounded`: Classique arrondi

### Couleurs

- **Couleur du QR** et **couleur du fond** via deux pickers

## Fonctionnalités

- ✅ Aperçu en temps réel
- ✅ Animations de transition
- ✅ Upload de logos avec drag & drop
- ✅ Téléchargement du QR code
- ✅ Copie de la configuration
- ✅ Interface responsive
- ✅ Styles Tailwind CSS
