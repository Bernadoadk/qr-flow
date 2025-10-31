import React, { useEffect, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';

interface StyledQRCodeProps {
  value: string;
  size: number;
  foregroundColor: string;
  backgroundColor: string;
  backgroundImage?: string;
  logo?: string;
  logoSize?: number;
  logoBackground?: {
    color: string;
    shape: 'circle' | 'square' | 'rounded' | 'diamond';
    padding?: number;
  };
  frameStyle?: {
    enabled: boolean;
    color: string;
    thickness: number;
    cornerRadius: number;
  };
  designOptions?: {
    pattern: string;
    marker: string;
    centerDotStyle: string;
    customMarkers?: {
      enabled: boolean;
      markerBorder: string;
      markerCenter: string;
    };
  };
}

export function StyledQRCode({
  value,
  size,
  foregroundColor,
  backgroundColor,
  backgroundImage,
  logo,
  logoSize = 50,
  logoBackground,
  frameStyle,
  designOptions
}: StyledQRCodeProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<QRCodeStyling | null>(null);
  const compositeLogoRef = useRef<string | null>(null);

  // Fonction pour créer une image composite avec fond
  const createCompositeLogo = async (logoUrl: string, bgColor: string, shape: string, padding: number = 10): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Calculer la taille du fond (logo + padding)
        const logoSizePx = size * (logoSize / 100);
        const bgSize = logoSizePx + (padding * 2);
        
        // Créer un canvas pour le fond
        const canvas = document.createElement('canvas');
        canvas.width = bgSize;
        canvas.height = bgSize;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Impossible de créer le contexte canvas'));
          return;
        }

        // Dessiner le fond selon la forme
        ctx.fillStyle = bgColor;
        
        const center = bgSize / 2;
        const radius = logoSizePx / 2 + padding;
        
        switch (shape) {
          case 'circle':
            ctx.beginPath();
            ctx.arc(center, center, radius, 0, Math.PI * 2);
            ctx.fill();
            break;
          
          case 'square':
            ctx.fillRect(0, 0, bgSize, bgSize);
            break;
          
          case 'rounded':
            const cornerRadius = radius * 0.2;
            ctx.beginPath();
            // Fonction pour dessiner un rectangle arrondi
            const drawRoundedRect = (x: number, y: number, width: number, height: number, radius: number) => {
              ctx.moveTo(x + radius, y);
              ctx.lineTo(x + width - radius, y);
              ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
              ctx.lineTo(x + width, y + height - radius);
              ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
              ctx.lineTo(x + radius, y + height);
              ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
              ctx.lineTo(x, y + radius);
              ctx.quadraticCurveTo(x, y, x + radius, y);
            };
            drawRoundedRect(0, 0, bgSize, bgSize, cornerRadius);
            ctx.closePath();
            ctx.fill();
            break;
          
          case 'diamond':
            ctx.beginPath();
            ctx.moveTo(center, 0);
            ctx.lineTo(bgSize, center);
            ctx.lineTo(center, bgSize);
            ctx.lineTo(0, center);
            ctx.closePath();
            ctx.fill();
            break;
          
          default:
            ctx.beginPath();
            ctx.arc(center, center, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Dessiner le logo centré
        const logoX = (bgSize - logoSizePx) / 2;
        const logoY = (bgSize - logoSizePx) / 2;
        ctx.drawImage(img, logoX, logoY, logoSizePx, logoSizePx);
        
        resolve(canvas.toDataURL('image/png'));
      };
      
      img.onerror = reject;
      img.src = logoUrl;
    });
  };

  useEffect(() => {
    if (!qrRef.current) return;

    // Fonction pour mapper les patterns
    const getDotsType = (pattern: string) => {
      switch (pattern) {
        case 'dots': return 'dots';
        case 'rounded': return 'rounded';
        case 'classy': return 'classy';
        case 'classy-rounded': return 'classy-rounded';
        case 'square': return 'square';
        case 'extra-rounded': return 'extra-rounded';
        default: return 'square';
      }
    };

    // Fonction pour mapper les markers
    const getMarkerType = (marker: string) => {
      switch (marker) {
        case 'dot': return 'dot';
        case 'square': return 'square';
        case 'extra-rounded': return 'extra-rounded';
        default: return 'square';
      }
    };

    // Fonction pour mapper les center dot styles
    const getCenterDotType = (centerDotStyle: string) => {
      switch (centerDotStyle) {
        case 'square': return 'square';
        case 'dot': return 'dot';
        default: return 'dot';
      }
    };

    // Fonction pour initialiser le QR code
    const initializeQRCode = async () => {
      let finalLogo = logo || '';
      
      // Si un logo et un fond sont configurés, créer l'image composite
      if (logo && logoBackground) {
        try {
          const composite = await createCompositeLogo(
            logo,
            logoBackground.color,
            logoBackground.shape,
            logoBackground.padding || 10
          );
          finalLogo = composite;
          compositeLogoRef.current = composite;
        } catch (error) {
          console.error('Erreur lors de la création du logo composite:', error);
          // Utiliser le logo original en cas d'erreur
          finalLogo = logo;
        }
      }

      // Configuration du QR code avec les options de design
      const qrCode = new QRCodeStyling({
        width: size,
        height: size,
        data: value,
        image: finalLogo,
        dotsOptions: {
          color: foregroundColor,
          type: getDotsType(designOptions?.pattern || 'default'),
          gradient: undefined,
        },
        backgroundOptions: {
          color: backgroundColor,
          image: backgroundImage || undefined,
        },
        cornersSquareOptions: {
          color: designOptions?.customMarkers?.enabled 
            ? designOptions.customMarkers.markerBorder 
            : foregroundColor,
          type: getMarkerType(designOptions?.marker || 'default'),
        },
        cornersDotOptions: {
          color: designOptions?.customMarkers?.enabled 
            ? designOptions.customMarkers.markerCenter 
            : foregroundColor,
          type: getCenterDotType(designOptions?.centerDotStyle || 'default'),
        },
        imageOptions: {
          crossOrigin: 'anonymous',
          margin: 4,
          imageSize: logoSize / 100,
        },
        qrOptions: {
          typeNumber: 0,
          mode: 'Byte',
          errorCorrectionLevel: 'M',
        },
      });

      // Nettoyer l'ancien QR code
      if (qrCodeRef.current && qrRef.current) {
        qrRef.current.innerHTML = '';
      }

      // Ajouter le nouveau QR code
      if (qrRef.current) {
        qrCode.append(qrRef.current);
        qrCodeRef.current = qrCode;
      }

      // S'assurer que le fond utilise bien backgroundColor et supprimer tout fond blanc indésirable
      setTimeout(() => {
        if (qrRef.current) {
          const canvas = qrRef.current.querySelector('canvas');
          const svg = qrRef.current.querySelector('svg');
          
          if (canvas) {
            // Pour canvas, le fond est géré par backgroundOptions, pas besoin de modifier
            canvas.style.background = 'transparent';
          }
          
          if (svg) {
            svg.style.background = 'transparent';
            svg.style.backgroundColor = 'transparent';
            
            // Trouver et modifier le rectangle de fond s'il existe
            const rects = svg.querySelectorAll('rect');
            rects.forEach((rect: SVGElement) => {
              const fill = rect.getAttribute('fill');
              const x = rect.getAttribute('x');
              const y = rect.getAttribute('y');
              
              // Si c'est le rectangle de fond (qui couvre tout le SVG) et qu'il est blanc
              if ((fill === '#ffffff' || fill === 'white' || fill === '#fff' || fill === 'rgb(255, 255, 255)') 
                  && (x === '0' || x === null || x === '') 
                  && (y === '0' || y === null || y === '')) {
                // Remplacer par backgroundColor ou transparent
                if (backgroundColor) {
                  rect.setAttribute('fill', backgroundColor);
                } else {
                  rect.setAttribute('fill', 'transparent');
                }
              }
            });
          }
        }
      }, 100);
    };

    initializeQRCode();

    return () => {
      if (qrRef.current) {
        qrRef.current.innerHTML = '';
      }
    };
  }, [value, size, foregroundColor, backgroundColor, backgroundImage, logo, logoSize, logoBackground, designOptions]);

  return (
    <div className="relative">
      <div ref={qrRef} style={{ background: 'transparent' }} />
      {frameStyle?.enabled && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            border: `${frameStyle.thickness}px solid ${frameStyle.color}`,
            borderRadius: `${frameStyle.cornerRadius}px`,
          }}
        />
      )}
    </div>
  );
}
