/**
 * Certificate Generator Service
 * Generates PDF certificates and digital badges
 */

/**
 * Certificate data
 */
export interface CertificateData {
  certificateNumber: string;
  coachName: string;
  programName: string;
  programLevel: string;
  certifiedAt: Date;
  expiresAt?: Date;
  verificationCode: string;
  verificationUrl: string;
  badgeImageUrl?: string;
}

/**
 * Badge data
 */
export interface BadgeData {
  programName: string;
  programLevel: string;
  coachName: string;
  certifiedAt: Date;
  verificationUrl: string;
  colorHex: string;
  iconName: string;
}

/**
 * Certificate template
 */
export interface CertificateTemplate {
  id: string;
  name: string;
  templateUrl: string;
  layout: 'portrait' | 'landscape';
  width: number;
  height: number;
  elements: TemplateElement[];
}

/**
 * Template element
 */
export interface TemplateElement {
  type: 'text' | 'image' | 'qrcode' | 'line' | 'rect';
  x: number;
  y: number;
  width?: number;
  height?: number;
  value?: string;
  placeholder?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  alignment?: 'left' | 'center' | 'right';
}

/**
 * Certificate Generator Service
 */
export class CertificateGenerator {
  private templates: Map<string, CertificateTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Initialize default templates
   */
  private initializeTemplates(): void {
    // Foundation level template
    this.templates.set('foundation', {
      id: 'foundation',
      name: 'Foundation Certificate',
      templateUrl: '/templates/foundation.pdf',
      layout: 'landscape',
      width: 842, // A4 landscape
      height: 595,
      elements: [
        {
          type: 'text',
          x: 421,
          y: 80,
          value: 'Certificate of Achievement',
          fontSize: 32,
          fontFamily: 'Serif',
          fontWeight: 'bold',
          color: '#1a365d',
          alignment: 'center',
        },
        {
          type: 'text',
          x: 421,
          y: 140,
          value: 'This is to certify that',
          fontSize: 14,
          color: '#4a5568',
          alignment: 'center',
        },
        {
          type: 'text',
          x: 421,
          y: 190,
          placeholder: '{{coachName}}',
          fontSize: 28,
          fontFamily: 'Serif',
          fontWeight: 'bold',
          color: '#2d3748',
          alignment: 'center',
        },
        {
          type: 'text',
          x: 421,
          y: 240,
          value: 'has successfully completed the',
          fontSize: 14,
          color: '#4a5568',
          alignment: 'center',
        },
        {
          type: 'text',
          x: 421,
          y: 280,
          placeholder: '{{programName}}',
          fontSize: 24,
          fontWeight: 'bold',
          color: '#2d3748',
          alignment: 'center',
        },
        {
          type: 'text',
          x: 421,
          y: 320,
          placeholder: '{{programLevel}} Level Certification',
          fontSize: 16,
          color: '#4a5568',
          alignment: 'center',
        },
        {
          type: 'line',
          x: 200,
          y: 360,
          width: 442,
          height: 1,
          color: '#e2e8f0',
        },
        {
          type: 'text',
          x: 150,
          y: 400,
          value: 'Certificate Number:',
          fontSize: 10,
          color: '#718096',
          alignment: 'left',
        },
        {
          type: 'text',
          x: 270,
          y: 400,
          placeholder: '{{certificateNumber}}',
          fontSize: 10,
          fontWeight: 'bold',
          color: '#2d3748',
          alignment: 'left',
        },
        {
          type: 'text',
          x: 150,
          y: 420,
          value: 'Issue Date:',
          fontSize: 10,
          color: '#718096',
          alignment: 'left',
        },
        {
          type: 'text',
          x: 270,
          y: 420,
          placeholder: '{{issueDate}}',
          fontSize: 10,
          color: '#2d3748',
          alignment: 'left',
        },
        {
          type: 'text',
          x: 500,
          y: 400,
          value: 'Verification Code:',
          fontSize: 10,
          color: '#718096',
          alignment: 'left',
        },
        {
          type: 'text',
          x: 620,
          y: 400,
          placeholder: '{{verificationCode}}',
          fontSize: 10,
          fontWeight: 'bold',
          color: '#2d3748',
          alignment: 'left',
        },
        {
          type: 'qrcode',
          x: 700,
          y: 440,
          width: 80,
          height: 80,
          placeholder: '{{verificationUrl}}',
        },
        {
          type: 'text',
          x: 421,
          y: 540,
          value: 'Verify at: upcoach.com/verify',
          fontSize: 9,
          color: '#a0aec0',
          alignment: 'center',
        },
      ],
    });

    // Professional level template
    this.templates.set('professional', {
      ...this.templates.get('foundation')!,
      id: 'professional',
      name: 'Professional Certificate',
      templateUrl: '/templates/professional.pdf',
    });

    // Master level template
    this.templates.set('master', {
      ...this.templates.get('foundation')!,
      id: 'master',
      name: 'Master Certificate',
      templateUrl: '/templates/master.pdf',
    });

    // Expert level template
    this.templates.set('expert', {
      ...this.templates.get('foundation')!,
      id: 'expert',
      name: 'Expert Certificate',
      templateUrl: '/templates/expert.pdf',
    });
  }

  /**
   * Generate certificate PDF
   */
  async generateCertificate(data: CertificateData): Promise<{
    pdfBuffer: Buffer;
    pdfUrl: string;
  }> {
    // Get template based on level
    const templateId = data.programLevel.toLowerCase();
    const template = this.templates.get(templateId) || this.templates.get('foundation')!;

    // Replace placeholders
    const replacements: Record<string, string> = {
      '{{coachName}}': data.coachName,
      '{{programName}}': data.programName,
      '{{programLevel}}': data.programLevel,
      '{{certificateNumber}}': data.certificateNumber,
      '{{issueDate}}': this.formatDate(data.certifiedAt),
      '{{expiryDate}}': data.expiresAt ? this.formatDate(data.expiresAt) : 'No Expiration',
      '{{verificationCode}}': data.verificationCode,
      '{{verificationUrl}}': data.verificationUrl,
    };

    // Generate PDF using template
    const pdfBuffer = await this.renderPDF(template, replacements);

    // Upload to storage and get URL
    const pdfUrl = await this.uploadPDF(pdfBuffer, data.certificateNumber);

    return { pdfBuffer, pdfUrl };
  }

  /**
   * Generate digital badge (SVG)
   */
  generateBadge(data: BadgeData): string {
    const levelColors: Record<string, { primary: string; secondary: string; gradient: string }> = {
      foundation: {
        primary: '#48BB78',
        secondary: '#38A169',
        gradient: 'url(#foundationGrad)',
      },
      professional: {
        primary: '#4299E1',
        secondary: '#3182CE',
        gradient: 'url(#professionalGrad)',
      },
      master: {
        primary: '#9F7AEA',
        secondary: '#805AD5',
        gradient: 'url(#masterGrad)',
      },
      expert: {
        primary: '#ECC94B',
        secondary: '#D69E2E',
        gradient: 'url(#expertGrad)',
      },
    };

    const colors = levelColors[data.programLevel.toLowerCase()] || levelColors.foundation;

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="foundationGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#48BB78"/>
      <stop offset="100%" style="stop-color:#38A169"/>
    </linearGradient>
    <linearGradient id="professionalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4299E1"/>
      <stop offset="100%" style="stop-color:#3182CE"/>
    </linearGradient>
    <linearGradient id="masterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#9F7AEA"/>
      <stop offset="100%" style="stop-color:#805AD5"/>
    </linearGradient>
    <linearGradient id="expertGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ECC94B"/>
      <stop offset="100%" style="stop-color:#D69E2E"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="rgba(0,0,0,0.25)"/>
    </filter>
  </defs>

  <!-- Badge background -->
  <circle cx="100" cy="100" r="90" fill="${colors.gradient}" filter="url(#shadow)"/>
  <circle cx="100" cy="100" r="80" fill="white"/>
  <circle cx="100" cy="100" r="75" fill="${colors.gradient}"/>

  <!-- UpCoach logo/icon -->
  <path d="M100 35 L115 60 L145 60 L120 80 L130 110 L100 90 L70 110 L80 80 L55 60 L85 60 Z"
        fill="white" opacity="0.9"/>

  <!-- Level text -->
  <text x="100" y="130" text-anchor="middle" fill="white" font-family="Arial, sans-serif"
        font-size="14" font-weight="bold">${data.programLevel.toUpperCase()}</text>

  <!-- Certified text -->
  <text x="100" y="148" text-anchor="middle" fill="white" font-family="Arial, sans-serif"
        font-size="10">CERTIFIED</text>

  <!-- Year -->
  <text x="100" y="165" text-anchor="middle" fill="white" font-family="Arial, sans-serif"
        font-size="9" opacity="0.8">${data.certifiedAt.getFullYear()}</text>

  <!-- Ribbon -->
  <path d="M75 185 L75 200 L85 195 L95 200 L95 185 Z" fill="${colors.secondary}"/>
  <path d="M105 185 L105 200 L115 195 L125 200 L125 185 Z" fill="${colors.secondary}"/>
</svg>`.trim();

    return svg;
  }

  /**
   * Generate badge PNG from SVG
   */
  async generateBadgePNG(data: BadgeData, size: number = 200): Promise<Buffer> {
    const svg = this.generateBadge(data);

    // In production, use a library like sharp or canvas to convert SVG to PNG
    // For now, return the SVG as a buffer
    return Buffer.from(svg, 'utf-8');
  }

  /**
   * Generate Open Badge (for LinkedIn, etc.)
   */
  generateOpenBadgeAssertion(
    data: CertificateData,
    recipientEmail: string
  ): {
    '@context': string;
    type: string;
    id: string;
    recipient: {
      type: string;
      identity: string;
      hashed: boolean;
    };
    badge: {
      type: string;
      id: string;
      name: string;
      description: string;
      image: string;
      criteria: { narrative: string };
      issuer: {
        type: string;
        id: string;
        name: string;
        url: string;
        email: string;
      };
    };
    issuedOn: string;
    expires?: string;
    verification: {
      type: string;
      verificationProperty: string;
    };
  } {
    const badgeClass = {
      '@context': 'https://w3id.org/openbadges/v2',
      type: 'Assertion',
      id: data.verificationUrl,
      recipient: {
        type: 'email',
        identity: this.hashEmail(recipientEmail),
        hashed: true,
      },
      badge: {
        type: 'BadgeClass',
        id: `https://upcoach.com/badges/${data.programLevel.toLowerCase()}`,
        name: `${data.programName} - ${data.programLevel} Level`,
        description: `Certified ${data.programLevel} level coach through the UpCoach platform.`,
        image: data.badgeImageUrl || 'https://upcoach.com/badges/default.png',
        criteria: {
          narrative: `To earn this badge, the recipient completed all requirements for the ${data.programName} certification program at the ${data.programLevel} level.`,
        },
        issuer: {
          type: 'Issuer',
          id: 'https://upcoach.com',
          name: 'UpCoach',
          url: 'https://upcoach.com',
          email: 'certifications@upcoach.com',
        },
      },
      issuedOn: data.certifiedAt.toISOString(),
      expires: data.expiresAt?.toISOString(),
      verification: {
        type: 'HostedBadge',
        verificationProperty: 'id',
      },
    };

    return badgeClass;
  }

  /**
   * Render PDF from template
   */
  private async renderPDF(
    template: CertificateTemplate,
    replacements: Record<string, string>
  ): Promise<Buffer> {
    // In production, use a library like PDFKit, puppeteer, or a PDF API service
    // This is a placeholder that returns an empty buffer

    // Example with PDFKit (would need to be implemented):
    // const doc = new PDFDocument({ size: [template.width, template.height] });
    // template.elements.forEach(element => {
    //   if (element.type === 'text') {
    //     let text = element.value || element.placeholder || '';
    //     Object.entries(replacements).forEach(([key, value]) => {
    //       text = text.replace(key, value);
    //     });
    //     doc.text(text, element.x, element.y, { align: element.alignment });
    //   }
    // });
    // return doc.pipe(stream);

    console.log('Generating PDF with template:', template.id);
    console.log('Replacements:', replacements);

    // Return placeholder buffer
    return Buffer.from('PDF_PLACEHOLDER', 'utf-8');
  }

  /**
   * Upload PDF to storage
   */
  private async uploadPDF(buffer: Buffer, certificateNumber: string): Promise<string> {
    // In production, upload to S3, GCS, or similar storage
    // Return the public URL

    const filename = `certificates/${certificateNumber}.pdf`;
    console.log('Uploading PDF:', filename);

    // Return placeholder URL
    return `https://storage.upcoach.com/${filename}`;
  }

  /**
   * Format date for certificate
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Hash email for Open Badge
   */
  private hashEmail(email: string): string {
    // In production, use SHA256 hash with salt
    // sha256('salt' + email.toLowerCase())
    return `sha256$${Buffer.from(email.toLowerCase()).toString('base64')}`;
  }
}

/**
 * Create certificate generator instance
 */
export function createCertificateGenerator(): CertificateGenerator {
  return new CertificateGenerator();
}

export default CertificateGenerator;
