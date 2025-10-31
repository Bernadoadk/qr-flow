declare module 'qr-code-styling' {
  interface QRCodeStylingOptions {
    width?: number;
    height?: number;
    data: string;
    margin?: number;
    qrOptions?: {
      typeNumber?: number;
      mode?: 'Byte' | 'Numeric' | 'Alphanumeric' | 'Kanji';
      errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    };
    imageOptions?: {
      hideBackgroundDots?: boolean;
      imageSize?: number;
      margin?: number;
      crossOrigin?: string;
    };
    dotsOptions?: {
      color?: string;
      type?: 'rounded' | 'square' | 'dots' | 'classy' | 'classy-rounded' | 'extra-rounded';
      gradient?: unknown;
    };
    backgroundOptions?: {
      color?: string;
      image?: string;
      size?: string;
    };
    cornersSquareOptions?: {
      color?: string;
      type?: 'square' | 'extra-rounded' | 'dot' | 'classy' | 'classy-rounded';
    };
    cornersDotOptions?: {
      color?: string;
      type?: 'dot' | 'square' | 'extra-rounded' | 'classy' | 'classy-rounded';
    };
    image?: string;
  }

  class QRCodeStyling {
    constructor(options: QRCodeStylingOptions);
    append(container: HTMLElement): void;
    update(options: Partial<QRCodeStylingOptions>): void;
    getOptions(): QRCodeStylingOptions;
  }

  export default QRCodeStyling;
}
