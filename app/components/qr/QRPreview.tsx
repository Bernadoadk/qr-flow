import React, { useEffect, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';
import './QRPreview.css';

interface QRPreviewProps {
  data: string;
  pattern?: string;
  marker?: string;
  center?: string;
  frame?: string;
  logo?: string;
  foregroundColor?: string; // color of QR dots/markers
  backgroundColor?: string; // plain background color only
  size?: number;
  className?: string;
}

const QRPreview: React.FC<QRPreviewProps> = ({
  data,
  pattern,
  marker,
  center,
  frame,
  logo,
  foregroundColor,
  backgroundColor,
  size = 300,
  className = ''
}) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<QRCodeStyling | null>(null);

  // Fonction d'animation
  const animate = () => {
    const el = qrRef.current;
    if (!el) return;
    
    el.classList.add('qr-animate');
    setTimeout(() => {
      el.classList.remove('qr-animate');
    }, 250);
  };

  // Effet pour initialiser le QR code
  useEffect(() => {
    if (!qrRef.current || !data) return;

    // Configuration de base du QR code
    const qrCode = new QRCodeStyling({
      width: size,
      height: size,
      data: data,
      margin: 10,
      qrOptions: {
        typeNumber: 0,
        mode: 'Byte',
        errorCorrectionLevel: 'M'
      },
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: 0.4,
        margin: 10
      },
      dotsOptions: {
        color: foregroundColor ?? '#000000',
        type: 'rounded'
      },
      backgroundOptions: {
        color: backgroundColor ?? '#ffffff',
      },
      cornersSquareOptions: {
        color: foregroundColor ?? '#000000',
        type: 'extra-rounded'
      },
      cornersDotOptions: {
        color: foregroundColor ?? '#000000',
        type: 'dot'
      }
    });

    // Nettoyer l'ancien QR code
    if (qrCodeRef.current) {
      qrRef.current.innerHTML = '';
    }

    // Afficher le nouveau QR code
    qrCode.append(qrRef.current);
    qrCodeRef.current = qrCode;

    // Debug: forcer la transparence du canvas généré
    setTimeout(() => {
      if (qrRef.current) {
        const canvas = qrRef.current.querySelector('canvas');
        const svg = qrRef.current.querySelector('svg');
        
        if (canvas) {
          canvas.style.background = 'transparent';
          canvas.style.backgroundColor = 'transparent';
        }
        if (svg) {
          svg.style.background = 'transparent';
          svg.style.backgroundColor = 'transparent';
        }
      }
    }, 100);

    return () => {
      if (qrRef.current) {
        qrRef.current.innerHTML = '';
      }
    };
  }, [data, size, foregroundColor, backgroundColor]);

  // Effet pour mettre à jour les styles
  useEffect(() => {
    if (!qrCodeRef.current) return;

    const updates: any = {};

    if (pattern) {
      updates.dotsOptions = {
        ...qrCodeRef.current.getOptions().dotsOptions,
        type: pattern as any
      };
    }

    if (marker) {
      updates.cornersSquareOptions = {
        ...qrCodeRef.current.getOptions().cornersSquareOptions,
        type: marker as any
      };
    }

    if (center) {
      updates.cornersDotOptions = {
        ...qrCodeRef.current.getOptions().cornersDotOptions,
        type: center as any
      };
    }

    if (logo !== undefined) {
      updates.image = logo;
    }

    if (foregroundColor) {
      updates.dotsOptions = {
        ...(updates.dotsOptions ?? qrCodeRef.current.getOptions().dotsOptions),
        color: foregroundColor
      } as any;
      updates.cornersSquareOptions = {
        ...(updates.cornersSquareOptions ?? qrCodeRef.current.getOptions().cornersSquareOptions),
        color: foregroundColor
      } as any;
      updates.cornersDotOptions = {
        ...(updates.cornersDotOptions ?? qrCodeRef.current.getOptions().cornersDotOptions),
        color: foregroundColor
      } as any;
    }

    if (backgroundColor) {
      updates.backgroundOptions = {
        color: backgroundColor
      };
    }

    // Appliquer les mises à jour si il y en a
    if (Object.keys(updates).length > 0) {
      qrCodeRef.current.update(updates);
      // Déclencher l'animation après la mise à jour
      setTimeout(() => animate(), 10);
    }

  }, [pattern, marker, center, logo, foregroundColor, backgroundColor]);

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <div
        ref={qrRef}
        className="qr-preview-container relative"
        style={{ 
          width: size, 
          height: size
        }}
      />
      {frame && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${frame})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }}
        />
      )}
    </div>
  );
};

export default QRPreview;
