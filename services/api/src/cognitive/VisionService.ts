import * as tf from '@tensorflow/tfjs-node';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as faceapi from 'face-api.js';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import Jimp from 'jimp';
import * as nsfw from 'nsfwjs';
import { createCanvas, loadImage, Image as CanvasImage } from 'canvas';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DetectedObject {
  label: string;
  confidence: number;
  bbox: BoundingBox;
}

interface DetectedFace {
  bbox: BoundingBox;
  landmarks: { x: number; y: number }[];
  expressions: {
    neutral: number;
    happy: number;
    sad: number;
    angry: number;
    fearful: number;
    disgusted: number;
    surprised: number;
  };
  ageApproximate?: number;
  gender?: 'male' | 'female';
  genderProbability?: number;
}

interface OCRResult {
  text: string;
  confidence: number;
  bbox: BoundingBox;
  words: Array<{
    text: string;
    confidence: number;
    bbox: BoundingBox;
  }>;
}

interface ImageTag {
  tag: string;
  confidence: number;
}

interface SceneClassification {
  category: 'indoor' | 'outdoor' | 'unknown';
  subcategory: string;
  confidence: number;
}

interface ColorInfo {
  rgb: { r: number; g: number; b: number };
  hex: string;
  percentage: number;
}

interface ImageQuality {
  isBlurry: boolean;
  blurScore: number;
  brightness: number;
  contrast: number;
  overallScore: number;
}

interface CompositionAnalysis {
  ruleOfThirds: boolean;
  symmetryScore: number;
  balanceScore: number;
  recommendations: string[];
}

interface NSFWAnalysis {
  isSafe: boolean;
  scores: {
    neutral: number;
    drawing: number;
    hentai: number;
    porn: number;
    sexy: number;
  };
  classification: 'safe' | 'suggestive' | 'nsfw';
}

interface DocumentLayout {
  type: 'table' | 'form' | 'header' | 'paragraph' | 'image';
  bbox: BoundingBox;
  content: string;
  confidence: number;
}

interface InvoiceData {
  vendorName: string;
  vendorAddress: string;
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  confidence: number;
}

interface ReceiptData {
  merchant: string;
  location: string;
  date: string;
  time: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod?: string;
  confidence: number;
}

interface IDCardData {
  type: 'drivers_license' | 'passport' | 'id_card' | 'unknown';
  name: string;
  dateOfBirth: string;
  idNumber: string;
  expiryDate?: string;
  address?: string;
  nationality?: string;
  confidence: number;
}

interface FormField {
  label: string;
  value: string;
  type: 'text' | 'checkbox' | 'number' | 'date';
  bbox: BoundingBox;
  confidence: number;
}

interface VideoFrame {
  timestamp: number;
  frameNumber: number;
  imagePath: string;
  detectedObjects?: DetectedObject[];
  detectedFaces?: DetectedFace[];
}

interface SceneChange {
  fromFrame: number;
  toFrame: number;
  timestamp: number;
  changeScore: number;
}

interface VisionServiceConfig {
  modelsPath: string;
  tempDir: string;
  maxImageSize: number;
  defaultLanguage: string;
  nsfwThreshold: number;
}

export class VisionService extends EventEmitter {
  private cocoSsdModel: cocoSsd.ObjectDetection | null = null;
  private nsfwModel: nsfw.NSFWJS | null = null;
  private config: VisionServiceConfig;
  private isInitialized = false;
  private logger: any;

  constructor(config: Partial<VisionServiceConfig> = {}) {
    super();
    this.config = {
      modelsPath: config.modelsPath || path.join(__dirname, '../../models'),
      tempDir: config.tempDir || path.join(__dirname, '../../temp'),
      maxImageSize: config.maxImageSize || 4096,
      defaultLanguage: config.defaultLanguage || 'eng',
      nsfwThreshold: config.nsfwThreshold || 0.7,
    };
    this.logger = console;
    this.ensureTempDir();
  }

  private ensureTempDir(): void {
    if (!fs.existsSync(this.config.tempDir)) {
      fs.mkdirSync(this.config.tempDir, { recursive: true });
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.logger.info('Initializing Vision Service...');

      // Load COCO-SSD model for object detection
      this.cocoSsdModel = await cocoSsd.load({
        base: 'mobilenet_v2',
      });
      this.logger.info('COCO-SSD model loaded');

      // Load face-api.js models
      const modelsPath = this.config.modelsPath;
      if (fs.existsSync(modelsPath)) {
        await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath);
        await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
        await faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath);
        await faceapi.nets.faceExpressionNet.loadFromDisk(modelsPath);
        await faceapi.nets.ageGenderNet.loadFromDisk(modelsPath);
        this.logger.info('Face-api.js models loaded');
      }

      // Load NSFW model
      this.nsfwModel = await nsfw.load();
      this.logger.info('NSFW model loaded');

      this.isInitialized = true;
      this.emit('initialized');
      this.logger.info('Vision Service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Vision Service:', error);
      throw new Error(`Vision Service initialization failed: ${error.message}`);
    }
  }

  // ==================== Image Recognition ====================

  async detectObjects(imagePath: string): Promise<DetectedObject[]> {
    await this.ensureInitialized();

    try {
      const image = await loadImage(imagePath);
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);

      const predictions = await this.cocoSsdModel!.detect(canvas as any);

      const objects: DetectedObject[] = predictions.map((pred) => ({
        label: pred.class,
        confidence: pred.score,
        bbox: {
          x: pred.bbox[0],
          y: pred.bbox[1],
          width: pred.bbox[2],
          height: pred.bbox[3],
        },
      }));

      this.logger.info(`Detected ${objects.length} objects in image`);
      return objects;
    } catch (error) {
      this.logger.error('Object detection failed:', error);
      throw new Error(`Object detection failed: ${error.message}`);
    }
  }

  async detectFaces(imagePath: string): Promise<DetectedFace[]> {
    await this.ensureInitialized();

    try {
      const image = await loadImage(imagePath);
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);

      const detections = await faceapi
        .detectAllFaces(canvas as any)
        .withFaceLandmarks()
        .withFaceExpressions()
        .withAgeAndGender();

      const faces: DetectedFace[] = detections.map((det) => ({
        bbox: {
          x: det.detection.box.x,
          y: det.detection.box.y,
          width: det.detection.box.width,
          height: det.detection.box.height,
        },
        landmarks: det.landmarks.positions.map((p) => ({ x: p.x, y: p.y })),
        expressions: det.expressions as any,
        ageApproximate: Math.round(det.age),
        gender: det.gender as 'male' | 'female',
        genderProbability: det.genderProbability,
      }));

      this.logger.info(`Detected ${faces.length} faces in image`);
      return faces;
    } catch (error) {
      this.logger.error('Face detection failed:', error);
      throw new Error(`Face detection failed: ${error.message}`);
    }
  }

  async extractTextOCR(imagePath: string, language?: string): Promise<OCRResult> {
    try {
      const lang = language || this.config.defaultLanguage;
      const result = await Tesseract.recognize(imagePath, lang, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            this.emit('ocr-progress', m.progress);
          }
        },
      });

      const words = result.data.words.map((word) => ({
        text: word.text,
        confidence: word.confidence,
        bbox: {
          x: word.bbox.x0,
          y: word.bbox.y0,
          width: word.bbox.x1 - word.bbox.x0,
          height: word.bbox.y1 - word.bbox.y0,
        },
      }));

      const ocrResult: OCRResult = {
        text: result.data.text,
        confidence: result.data.confidence,
        bbox: {
          x: result.data.bbox.x0,
          y: result.data.bbox.y0,
          width: result.data.bbox.x1 - result.data.bbox.x0,
          height: result.data.bbox.y1 - result.data.bbox.y0,
        },
        words,
      };

      this.logger.info(`OCR extracted ${words.length} words with ${ocrResult.confidence}% confidence`);
      return ocrResult;
    } catch (error) {
      this.logger.error('OCR extraction failed:', error);
      throw new Error(`OCR extraction failed: ${error.message}`);
    }
  }

  async detectLogos(imagePath: string): Promise<DetectedObject[]> {
    // Simple logo detection using object detection
    // In production, use specialized logo detection API or train custom model
    const objects = await this.detectObjects(imagePath);

    // Filter for potential logo areas (small objects with high contrast)
    const metadata = await sharp(imagePath).metadata();
    const imageArea = (metadata.width || 1) * (metadata.height || 1);

    const logos = objects.filter((obj) => {
      const objectArea = obj.bbox.width * obj.bbox.height;
      const areaRatio = objectArea / imageArea;
      return areaRatio < 0.1 && obj.confidence > 0.6;
    });

    this.logger.info(`Detected ${logos.length} potential logos`);
    return logos;
  }

  async generateImageTags(imagePath: string): Promise<ImageTag[]> {
    try {
      const objects = await this.detectObjects(imagePath);
      const scene = await this.classifyScene(imagePath);
      const colors = await this.analyzeColors(imagePath, 3);

      const tags: ImageTag[] = [
        ...objects.map((obj) => ({ tag: obj.label, confidence: obj.confidence })),
        { tag: scene.category, confidence: scene.confidence },
        { tag: scene.subcategory, confidence: scene.confidence * 0.8 },
        ...colors.map((color) => ({
          tag: `${this.getColorName(color.rgb)} color`,
          confidence: color.percentage / 100,
        })),
      ];

      // Deduplicate and sort by confidence
      const uniqueTags = tags.reduce((acc, tag) => {
        const existing = acc.find((t) => t.tag === tag.tag);
        if (!existing) {
          acc.push(tag);
        } else if (tag.confidence > existing.confidence) {
          existing.confidence = tag.confidence;
        }
        return acc;
      }, [] as ImageTag[]);

      uniqueTags.sort((a, b) => b.confidence - a.confidence);

      this.logger.info(`Generated ${uniqueTags.length} tags for image`);
      return uniqueTags.slice(0, 20);
    } catch (error) {
      this.logger.error('Tag generation failed:', error);
      throw new Error(`Tag generation failed: ${error.message}`);
    }
  }

  // ==================== Image Analysis ====================

  async classifyScene(imagePath: string): Promise<SceneClassification> {
    try {
      const objects = await this.detectObjects(imagePath);

      const indoorObjects = ['chair', 'couch', 'bed', 'dining table', 'tv', 'laptop', 'book'];
      const outdoorObjects = ['car', 'truck', 'bird', 'tree', 'bench', 'traffic light'];

      const indoorScore = objects.filter((obj) =>
        indoorObjects.some((indoor) => obj.label.toLowerCase().includes(indoor))
      ).length;
      const outdoorScore = objects.filter((obj) =>
        outdoorObjects.some((outdoor) => obj.label.toLowerCase().includes(outdoor))
      ).length;

      let category: 'indoor' | 'outdoor' | 'unknown' = 'unknown';
      let subcategory = 'general';
      let confidence = 0;

      if (indoorScore > outdoorScore) {
        category = 'indoor';
        confidence = Math.min(0.95, 0.6 + indoorScore * 0.1);

        if (objects.some((o) => ['bed', 'nightstand'].includes(o.label))) {
          subcategory = 'bedroom';
        } else if (objects.some((o) => ['dining table', 'chair'].includes(o.label))) {
          subcategory = 'dining_room';
        } else if (objects.some((o) => ['couch', 'tv'].includes(o.label))) {
          subcategory = 'living_room';
        } else if (objects.some((o) => ['refrigerator', 'oven', 'microwave'].includes(o.label))) {
          subcategory = 'kitchen';
        }
      } else if (outdoorScore > indoorScore) {
        category = 'outdoor';
        confidence = Math.min(0.95, 0.6 + outdoorScore * 0.1);

        if (objects.some((o) => ['car', 'truck', 'traffic light'].includes(o.label))) {
          subcategory = 'street';
        } else if (objects.some((o) => ['bird', 'tree', 'bench'].includes(o.label))) {
          subcategory = 'park';
        }
      } else {
        confidence = 0.3;
      }

      this.logger.info(`Scene classified as ${category}/${subcategory} with ${confidence} confidence`);
      return { category, subcategory, confidence };
    } catch (error) {
      this.logger.error('Scene classification failed:', error);
      throw new Error(`Scene classification failed: ${error.message}`);
    }
  }

  async assessImageQuality(imagePath: string): Promise<ImageQuality> {
    try {
      const image = await Jimp.read(imagePath);
      const bitmap = image.bitmap;

      // Blur detection using Laplacian variance
      const blurScore = this.calculateBlurScore(bitmap);
      const isBlurry = blurScore < 100;

      // Brightness calculation
      const brightness = this.calculateBrightness(bitmap);

      // Contrast calculation
      const contrast = this.calculateContrast(bitmap);

      // Overall quality score
      const overallScore = this.calculateOverallQuality(blurScore, brightness, contrast);

      this.logger.info(`Image quality: blur=${blurScore.toFixed(2)}, brightness=${brightness.toFixed(2)}, contrast=${contrast.toFixed(2)}, overall=${overallScore.toFixed(2)}`);

      return {
        isBlurry,
        blurScore,
        brightness,
        contrast,
        overallScore,
      };
    } catch (error) {
      this.logger.error('Quality assessment failed:', error);
      throw new Error(`Quality assessment failed: ${error.message}`);
    }
  }

  async analyzeColors(imagePath: string, numColors: number = 5): Promise<ColorInfo[]> {
    try {
      const image = await Jimp.read(imagePath);
      const width = image.bitmap.width;
      const height = image.bitmap.height;

      // Sample pixels and count colors
      const colorCounts = new Map<string, number>();
      const sampleRate = Math.max(1, Math.floor(Math.min(width, height) / 100));

      for (let y = 0; y < height; y += sampleRate) {
        for (let x = 0; x < width; x += sampleRate) {
          const color = image.getPixelColor(x, y);
          const rgba = Jimp.intToRGBA(color);
          const key = `${Math.floor(rgba.r / 16) * 16},${Math.floor(rgba.g / 16) * 16},${Math.floor(rgba.b / 16) * 16}`;
          colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
        }
      }

      // Get top colors
      const sorted = Array.from(colorCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, numColors);

      const totalSamples = Array.from(colorCounts.values()).reduce((sum, count) => sum + count, 0);

      const colors: ColorInfo[] = sorted.map(([key, count]) => {
        const [r, g, b] = key.split(',').map(Number);
        return {
          rgb: { r, g, b },
          hex: this.rgbToHex(r, g, b),
          percentage: (count / totalSamples) * 100,
        };
      });

      this.logger.info(`Analyzed ${numColors} dominant colors`);
      return colors;
    } catch (error) {
      this.logger.error('Color analysis failed:', error);
      throw new Error(`Color analysis failed: ${error.message}`);
    }
  }

  async analyzeComposition(imagePath: string): Promise<CompositionAnalysis> {
    try {
      const image = await Jimp.read(imagePath);
      const width = image.bitmap.width;
      const height = image.bitmap.height;

      // Rule of thirds analysis
      const ruleOfThirds = this.checkRuleOfThirds(image);

      // Symmetry analysis
      const symmetryScore = this.calculateSymmetry(image);

      // Balance analysis
      const balanceScore = this.calculateBalance(image);

      const recommendations: string[] = [];
      if (!ruleOfThirds) {
        recommendations.push('Consider positioning key elements along the rule of thirds lines');
      }
      if (symmetryScore < 0.5) {
        recommendations.push('Image lacks symmetry, consider reframing for better balance');
      }
      if (balanceScore < 0.6) {
        recommendations.push('Visual weight is unbalanced, adjust composition for better distribution');
      }

      this.logger.info(`Composition: ruleOfThirds=${ruleOfThirds}, symmetry=${symmetryScore.toFixed(2)}, balance=${balanceScore.toFixed(2)}`);

      return {
        ruleOfThirds,
        symmetryScore,
        balanceScore,
        recommendations,
      };
    } catch (error) {
      this.logger.error('Composition analysis failed:', error);
      throw new Error(`Composition analysis failed: ${error.message}`);
    }
  }

  async analyzeNSFW(imagePath: string): Promise<NSFWAnalysis> {
    await this.ensureInitialized();

    try {
      const image = await loadImage(imagePath);
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);

      const predictions = await this.nsfwModel!.classify(canvas as any);

      const scores = {
        neutral: 0,
        drawing: 0,
        hentai: 0,
        porn: 0,
        sexy: 0,
      };

      predictions.forEach((pred) => {
        scores[pred.className] = pred.probability;
      });

      const nsfwScore = scores.porn + scores.hentai;
      const isSafe = nsfwScore < 0.3 && scores.sexy < 0.6;

      let classification: 'safe' | 'suggestive' | 'nsfw' = 'safe';
      if (nsfwScore > this.config.nsfwThreshold) {
        classification = 'nsfw';
      } else if (scores.sexy > 0.5 || nsfwScore > 0.3) {
        classification = 'suggestive';
      }

      this.logger.info(`NSFW analysis: ${classification} (nsfw=${nsfwScore.toFixed(2)}, sexy=${scores.sexy.toFixed(2)})`);

      return {
        isSafe,
        scores,
        classification,
      };
    } catch (error) {
      this.logger.error('NSFW analysis failed:', error);
      throw new Error(`NSFW analysis failed: ${error.message}`);
    }
  }

  // ==================== Document Intelligence ====================

  async analyzeDocumentLayout(imagePath: string): Promise<DocumentLayout[]> {
    try {
      const ocrResult = await this.extractTextOCR(imagePath);
      const metadata = await sharp(imagePath).metadata();
      const width = metadata.width || 1;
      const height = metadata.height || 1;

      const layouts: DocumentLayout[] = [];

      // Detect headers (large text at top)
      const topWords = ocrResult.words.filter((w) => w.bbox.y < height * 0.15);
      if (topWords.length > 0) {
        const headerBbox = this.mergeBoundingBoxes(topWords.map((w) => w.bbox));
        layouts.push({
          type: 'header',
          bbox: headerBbox,
          content: topWords.map((w) => w.text).join(' '),
          confidence: topWords.reduce((sum, w) => sum + w.confidence, 0) / topWords.length,
        });
      }

      // Detect paragraphs (grouped text)
      const paragraphs = this.groupWordsToParagraphs(ocrResult.words, width, height);
      paragraphs.forEach((para) => {
        layouts.push({
          type: 'paragraph',
          bbox: para.bbox,
          content: para.content,
          confidence: para.confidence,
        });
      });

      // Detect potential tables (grid-like structure)
      const tables = this.detectTables(ocrResult.words, width, height);
      tables.forEach((table) => {
        layouts.push({
          type: 'table',
          bbox: table.bbox,
          content: table.content,
          confidence: table.confidence,
        });
      });

      this.logger.info(`Detected ${layouts.length} document layout elements`);
      return layouts;
    } catch (error) {
      this.logger.error('Document layout analysis failed:', error);
      throw new Error(`Document layout analysis failed: ${error.message}`);
    }
  }

  async parseInvoice(imagePath: string): Promise<InvoiceData> {
    try {
      const ocrResult = await this.extractTextOCR(imagePath);
      const text = ocrResult.text;
      const lines = text.split('\n').filter((line) => line.trim());

      // Extract vendor name (usually first non-empty line)
      const vendorName = lines[0] || 'Unknown Vendor';

      // Extract invoice number
      const invoiceMatch = text.match(/(?:invoice|inv)[#:\s]*([A-Z0-9-]+)/i);
      const invoiceNumber = invoiceMatch ? invoiceMatch[1] : 'N/A';

      // Extract dates
      const dateMatch = text.match(/(?:date|dated)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
      const date = dateMatch ? dateMatch[1] : 'N/A';

      const dueMatch = text.match(/(?:due|payment due)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
      const dueDate = dueMatch ? dueMatch[1] : undefined;

      // Extract amounts
      const totalMatch = text.match(/(?:total|amount due)[:\s]*\$?([0-9,]+\.\d{2})/i);
      const total = totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : 0;

      const taxMatch = text.match(/(?:tax|vat)[:\s]*\$?([0-9,]+\.\d{2})/i);
      const tax = taxMatch ? parseFloat(taxMatch[1].replace(/,/g, '')) : 0;

      const subtotal = total - tax;

      // Extract line items (simplified)
      const lineItems = this.extractLineItems(text);

      // Extract vendor address
      const addressMatch = text.match(/\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|blvd|boulevard)/i);
      const vendorAddress = addressMatch ? addressMatch[0] : 'N/A';

      this.logger.info(`Parsed invoice: ${invoiceNumber} from ${vendorName}, total $${total}`);

      return {
        vendorName,
        vendorAddress,
        invoiceNumber,
        date,
        dueDate,
        lineItems,
        subtotal,
        tax,
        total,
        confidence: ocrResult.confidence,
      };
    } catch (error) {
      this.logger.error('Invoice parsing failed:', error);
      throw new Error(`Invoice parsing failed: ${error.message}`);
    }
  }

  async parseReceipt(imagePath: string): Promise<ReceiptData> {
    try {
      const ocrResult = await this.extractTextOCR(imagePath);
      const text = ocrResult.text;
      const lines = text.split('\n').filter((line) => line.trim());

      // Extract merchant (first line)
      const merchant = lines[0] || 'Unknown Merchant';

      // Extract date and time
      const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
      const date = dateMatch ? dateMatch[1] : 'N/A';

      const timeMatch = text.match(/(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)/i);
      const time = timeMatch ? timeMatch[1] : 'N/A';

      // Extract amounts
      const totalMatch = text.match(/(?:total|amount)[:\s]*\$?([0-9,]+\.\d{2})/i);
      const total = totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : 0;

      const taxMatch = text.match(/(?:tax|vat)[:\s]*\$?([0-9,]+\.\d{2})/i);
      const tax = taxMatch ? parseFloat(taxMatch[1].replace(/,/g, '')) : 0;

      const subtotal = total - tax;

      // Extract items (simplified)
      const items = this.extractReceiptItems(text);

      // Extract location
      const locationMatch = text.match(/(?:store|location)[:\s]*(.+)/i);
      const location = locationMatch ? locationMatch[1].trim() : 'N/A';

      // Extract payment method
      const paymentMatch = text.match(/(?:card|visa|mastercard|amex|cash)/i);
      const paymentMethod = paymentMatch ? paymentMatch[0] : undefined;

      this.logger.info(`Parsed receipt: ${merchant}, total $${total}`);

      return {
        merchant,
        location,
        date,
        time,
        items,
        subtotal,
        tax,
        total,
        paymentMethod,
        confidence: ocrResult.confidence,
      };
    } catch (error) {
      this.logger.error('Receipt parsing failed:', error);
      throw new Error(`Receipt parsing failed: ${error.message}`);
    }
  }

  async parseIDCard(imagePath: string): Promise<IDCardData> {
    try {
      const ocrResult = await this.extractTextOCR(imagePath);
      const text = ocrResult.text;

      // Detect ID type
      let type: 'drivers_license' | 'passport' | 'id_card' | 'unknown' = 'unknown';
      if (text.match(/driver['\s]*license|DL/i)) type = 'drivers_license';
      else if (text.match(/passport/i)) type = 'passport';
      else if (text.match(/identification|id card/i)) type = 'id_card';

      // Extract name
      const nameMatch = text.match(/(?:name|lastname)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i);
      const name = nameMatch ? nameMatch[1].trim() : 'N/A';

      // Extract date of birth
      const dobMatch = text.match(/(?:DOB|birth|born)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
      const dateOfBirth = dobMatch ? dobMatch[1] : 'N/A';

      // Extract ID number
      const idMatch = text.match(/(?:ID|DL|number)[:\s]*([A-Z0-9]{6,})/i);
      const idNumber = idMatch ? idMatch[1] : 'N/A';

      // Extract expiry date
      const expiryMatch = text.match(/(?:exp|expiry|expires)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
      const expiryDate = expiryMatch ? expiryMatch[1] : undefined;

      // Extract address
      const addressMatch = text.match(/(?:address|addr)[:\s]*(.+?)(?=\n|$)/i);
      const address = addressMatch ? addressMatch[1].trim() : undefined;

      // Extract nationality (for passports)
      const nationalityMatch = text.match(/(?:nationality|citizen)[:\s]*([A-Z]{2,})/i);
      const nationality = nationalityMatch ? nationalityMatch[1] : undefined;

      this.logger.info(`Parsed ID card: ${type}, name=${name}`);

      return {
        type,
        name,
        dateOfBirth,
        idNumber,
        expiryDate,
        address,
        nationality,
        confidence: ocrResult.confidence,
      };
    } catch (error) {
      this.logger.error('ID card parsing failed:', error);
      throw new Error(`ID card parsing failed: ${error.message}`);
    }
  }

  async parseForm(imagePath: string): Promise<FormField[]> {
    try {
      const ocrResult = await this.extractTextOCR(imagePath);
      const words = ocrResult.words;

      const fields: FormField[] = [];

      // Group words into potential field pairs (label: value)
      for (let i = 0; i < words.length - 1; i++) {
        const word = words[i];
        const nextWord = words[i + 1];

        // Check if word ends with colon (likely a label)
        if (word.text.endsWith(':')) {
          const label = word.text.replace(':', '').trim();
          const value = nextWord.text;

          // Determine field type
          let type: 'text' | 'checkbox' | 'number' | 'date' = 'text';
          if (value.match(/^\d+$/)) type = 'number';
          else if (value.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)) type = 'date';
          else if (['☐', '☑', '□', '■', 'X'].includes(value)) type = 'checkbox';

          fields.push({
            label,
            value,
            type,
            bbox: nextWord.bbox,
            confidence: nextWord.confidence,
          });
        }
      }

      this.logger.info(`Parsed ${fields.length} form fields`);
      return fields;
    } catch (error) {
      this.logger.error('Form parsing failed:', error);
      throw new Error(`Form parsing failed: ${error.message}`);
    }
  }

  // ==================== Image Generation & Manipulation ====================

  async resizeImage(
    imagePath: string,
    width: number,
    height: number,
    fit: 'cover' | 'contain' | 'fill' = 'cover'
  ): Promise<string> {
    try {
      const outputPath = this.getTempPath(`resized_${uuidv4()}.jpg`);

      await sharp(imagePath)
        .resize(width, height, { fit })
        .toFile(outputPath);

      this.logger.info(`Resized image to ${width}x${height}`);
      return outputPath;
    } catch (error) {
      this.logger.error('Image resize failed:', error);
      throw new Error(`Image resize failed: ${error.message}`);
    }
  }

  async cropImage(imagePath: string, bbox: BoundingBox): Promise<string> {
    try {
      const outputPath = this.getTempPath(`cropped_${uuidv4()}.jpg`);

      await sharp(imagePath)
        .extract({
          left: Math.round(bbox.x),
          top: Math.round(bbox.y),
          width: Math.round(bbox.width),
          height: Math.round(bbox.height),
        })
        .toFile(outputPath);

      this.logger.info(`Cropped image to ${bbox.width}x${bbox.height}`);
      return outputPath;
    } catch (error) {
      this.logger.error('Image crop failed:', error);
      throw new Error(`Image crop failed: ${error.message}`);
    }
  }

  async rotateImage(imagePath: string, degrees: number): Promise<string> {
    try {
      const outputPath = this.getTempPath(`rotated_${uuidv4()}.jpg`);

      await sharp(imagePath)
        .rotate(degrees)
        .toFile(outputPath);

      this.logger.info(`Rotated image by ${degrees} degrees`);
      return outputPath;
    } catch (error) {
      this.logger.error('Image rotation failed:', error);
      throw new Error(`Image rotation failed: ${error.message}`);
    }
  }

  async applyFilter(
    imagePath: string,
    filter: 'grayscale' | 'blur' | 'sharpen' | 'sepia'
  ): Promise<string> {
    try {
      const outputPath = this.getTempPath(`filtered_${uuidv4()}.jpg`);
      let pipeline = sharp(imagePath);

      switch (filter) {
        case 'grayscale':
          pipeline = pipeline.grayscale();
          break;
        case 'blur':
          pipeline = pipeline.blur(5);
          break;
        case 'sharpen':
          pipeline = pipeline.sharpen();
          break;
        case 'sepia':
          pipeline = pipeline.tint({ r: 112, g: 66, b: 20 });
          break;
      }

      await pipeline.toFile(outputPath);

      this.logger.info(`Applied ${filter} filter to image`);
      return outputPath;
    } catch (error) {
      this.logger.error('Filter application failed:', error);
      throw new Error(`Filter application failed: ${error.message}`);
    }
  }

  async removeBackground(imagePath: string): Promise<string> {
    try {
      // Simple background removal using edge detection and flood fill
      const image = await Jimp.read(imagePath);
      const outputPath = this.getTempPath(`nobg_${uuidv4()}.png`);

      // Convert to grayscale and detect edges
      const edges = image.clone().grayscale().convolute([
        [-1, -1, -1],
        [-1, 8, -1],
        [-1, -1, -1],
      ]);

      // Simple threshold to separate foreground/background
      edges.scan(0, 0, edges.bitmap.width, edges.bitmap.height, function (x, y, idx) {
        const gray = this.bitmap.data[idx];
        if (gray < 128) {
          image.bitmap.data[idx + 3] = 0; // Make transparent
        }
      });

      await image.writeAsync(outputPath);

      this.logger.info('Removed background from image');
      return outputPath;
    } catch (error) {
      this.logger.error('Background removal failed:', error);
      throw new Error(`Background removal failed: ${error.message}`);
    }
  }

  async upscaleImage(imagePath: string, scale: number = 2): Promise<string> {
    try {
      const metadata = await sharp(imagePath).metadata();
      const newWidth = Math.round((metadata.width || 100) * scale);
      const newHeight = Math.round((metadata.height || 100) * scale);

      const outputPath = this.getTempPath(`upscaled_${uuidv4()}.jpg`);

      await sharp(imagePath)
        .resize(newWidth, newHeight, {
          kernel: sharp.kernel.cubic,
        })
        .toFile(outputPath);

      this.logger.info(`Upscaled image by ${scale}x to ${newWidth}x${newHeight}`);
      return outputPath;
    } catch (error) {
      this.logger.error('Image upscaling failed:', error);
      throw new Error(`Image upscaling failed: ${error.message}`);
    }
  }

  async generateThumbnail(
    imagePath: string,
    size: number = 200,
    smartCrop: boolean = true
  ): Promise<string> {
    try {
      const outputPath = this.getTempPath(`thumb_${uuidv4()}.jpg`);

      if (smartCrop) {
        // Smart crop to focus on detected faces or objects
        const faces = await this.detectFaces(imagePath).catch(() => []);
        if (faces.length > 0) {
          const face = faces[0];
          const centerX = face.bbox.x + face.bbox.width / 2;
          const centerY = face.bbox.y + face.bbox.height / 2;

          const metadata = await sharp(imagePath).metadata();
          const imgWidth = metadata.width || 100;
          const imgHeight = metadata.height || 100;

          const cropSize = Math.min(imgWidth, imgHeight);
          const left = Math.max(0, Math.min(centerX - cropSize / 2, imgWidth - cropSize));
          const top = Math.max(0, Math.min(centerY - cropSize / 2, imgHeight - cropSize));

          await sharp(imagePath)
            .extract({ left: Math.round(left), top: Math.round(top), width: cropSize, height: cropSize })
            .resize(size, size)
            .toFile(outputPath);
        } else {
          // No faces, use center crop
          await sharp(imagePath)
            .resize(size, size, { fit: 'cover', position: 'center' })
            .toFile(outputPath);
        }
      } else {
        await sharp(imagePath)
          .resize(size, size, { fit: 'cover' })
          .toFile(outputPath);
      }

      this.logger.info(`Generated ${size}x${size} thumbnail`);
      return outputPath;
    } catch (error) {
      this.logger.error('Thumbnail generation failed:', error);
      throw new Error(`Thumbnail generation failed: ${error.message}`);
    }
  }

  async addWatermark(
    imagePath: string,
    watermarkText: string,
    position: 'center' | 'bottom-right' | 'top-left' = 'bottom-right'
  ): Promise<string> {
    try {
      const image = await Jimp.read(imagePath);
      const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);

      const textWidth = Jimp.measureText(font, watermarkText);
      const textHeight = Jimp.measureTextHeight(font, watermarkText);

      let x: number, y: number;
      switch (position) {
        case 'center':
          x = (image.bitmap.width - textWidth) / 2;
          y = (image.bitmap.height - textHeight) / 2;
          break;
        case 'top-left':
          x = 10;
          y = 10;
          break;
        case 'bottom-right':
        default:
          x = image.bitmap.width - textWidth - 10;
          y = image.bitmap.height - textHeight - 10;
          break;
      }

      image.print(font, x, y, watermarkText);

      const outputPath = this.getTempPath(`watermarked_${uuidv4()}.jpg`);
      await image.writeAsync(outputPath);

      this.logger.info(`Added watermark: ${watermarkText}`);
      return outputPath;
    } catch (error) {
      this.logger.error('Watermark addition failed:', error);
      throw new Error(`Watermark addition failed: ${error.message}`);
    }
  }

  // ==================== Video Analysis ====================

  async extractVideoFrames(videoPath: string, intervalSeconds: number = 1): Promise<VideoFrame[]> {
    try {
      // Note: In production, use ffmpeg via child_process
      // For now, return simulated frames
      this.logger.warn('Video frame extraction requires ffmpeg - returning simulated data');

      const frames: VideoFrame[] = [];
      for (let i = 0; i < 10; i++) {
        frames.push({
          timestamp: i * intervalSeconds,
          frameNumber: i,
          imagePath: this.getTempPath(`frame_${i}.jpg`),
        });
      }

      return frames;
    } catch (error) {
      this.logger.error('Video frame extraction failed:', error);
      throw new Error(`Video frame extraction failed: ${error.message}`);
    }
  }

  async trackFacesInVideo(frames: VideoFrame[]): Promise<VideoFrame[]> {
    try {
      const trackedFrames = await Promise.all(
        frames.map(async (frame) => {
          try {
            const faces = await this.detectFaces(frame.imagePath);
            return { ...frame, detectedFaces: faces };
          } catch {
            return frame;
          }
        })
      );

      this.logger.info(`Tracked faces across ${trackedFrames.length} frames`);
      return trackedFrames;
    } catch (error) {
      this.logger.error('Face tracking failed:', error);
      throw new Error(`Face tracking failed: ${error.message}`);
    }
  }

  async detectSceneChanges(frames: VideoFrame[]): Promise<SceneChange[]> {
    try {
      const changes: SceneChange[] = [];

      for (let i = 1; i < frames.length; i++) {
        const diff = await this.compareImages(frames[i - 1].imagePath, frames[i].imagePath);
        if (diff > 0.3) {
          // Threshold for scene change
          changes.push({
            fromFrame: i - 1,
            toFrame: i,
            timestamp: frames[i].timestamp,
            changeScore: diff,
          });
        }
      }

      this.logger.info(`Detected ${changes.length} scene changes`);
      return changes;
    } catch (error) {
      this.logger.error('Scene change detection failed:', error);
      throw new Error(`Scene change detection failed: ${error.message}`);
    }
  }

  async generateVideoThumbnail(frames: VideoFrame[]): Promise<string> {
    try {
      // Select middle frame as thumbnail
      const middleFrame = frames[Math.floor(frames.length / 2)];
      const thumbnail = await this.generateThumbnail(middleFrame.imagePath);

      this.logger.info('Generated video thumbnail from middle frame');
      return thumbnail;
    } catch (error) {
      this.logger.error('Video thumbnail generation failed:', error);
      throw new Error(`Video thumbnail generation failed: ${error.message}`);
    }
  }

  // ==================== Helper Methods ====================

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  private getTempPath(filename: string): string {
    return path.join(this.config.tempDir, filename);
  }

  private calculateBlurScore(bitmap: any): number {
    // Simplified Laplacian variance for blur detection
    let variance = 0;
    let count = 0;

    for (let y = 1; y < bitmap.height - 1; y++) {
      for (let x = 1; x < bitmap.width - 1; x++) {
        const idx = (y * bitmap.width + x) * 4;
        const gray = (bitmap.data[idx] + bitmap.data[idx + 1] + bitmap.data[idx + 2]) / 3;

        // Simple Laplacian kernel
        const neighbors = [
          (((y - 1) * bitmap.width + x) * 4),
          (((y + 1) * bitmap.width + x) * 4),
          ((y * bitmap.width + (x - 1)) * 4),
          ((y * bitmap.width + (x + 1)) * 4),
        ];

        const laplacian = neighbors.reduce((sum, nIdx) => {
          const nGray = (bitmap.data[nIdx] + bitmap.data[nIdx + 1] + bitmap.data[nIdx + 2]) / 3;
          return sum + Math.abs(gray - nGray);
        }, 0);

        variance += laplacian;
        count++;
      }
    }

    return variance / count;
  }

  private calculateBrightness(bitmap: any): number {
    let sum = 0;
    for (let i = 0; i < bitmap.data.length; i += 4) {
      const r = bitmap.data[i];
      const g = bitmap.data[i + 1];
      const b = bitmap.data[i + 2];
      sum += (r + g + b) / 3;
    }
    return sum / (bitmap.width * bitmap.height);
  }

  private calculateContrast(bitmap: any): number {
    const brightness = this.calculateBrightness(bitmap);
    let variance = 0;

    for (let i = 0; i < bitmap.data.length; i += 4) {
      const r = bitmap.data[i];
      const g = bitmap.data[i + 1];
      const b = bitmap.data[i + 2];
      const gray = (r + g + b) / 3;
      variance += Math.pow(gray - brightness, 2);
    }

    return Math.sqrt(variance / (bitmap.width * bitmap.height));
  }

  private calculateOverallQuality(blurScore: number, brightness: number, contrast: number): number {
    const blurQuality = Math.min(1, blurScore / 200);
    const brightnessQuality = 1 - Math.abs(brightness - 128) / 128;
    const contrastQuality = Math.min(1, contrast / 50);

    return (blurQuality * 0.4 + brightnessQuality * 0.3 + contrastQuality * 0.3) * 100;
  }

  private checkRuleOfThirds(image: any): boolean {
    // Simplified check: detect if objects are near third lines
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    const thirdX1 = width / 3;
    const thirdX2 = (2 * width) / 3;
    const thirdY1 = height / 3;
    const thirdY2 = (2 * height) / 3;

    // In real implementation, check if detected objects align with these lines
    return Math.random() > 0.5; // Placeholder
  }

  private calculateSymmetry(image: any): number {
    // Simplified symmetry check: compare left and right halves
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const halfWidth = Math.floor(width / 2);

    let diff = 0;
    let count = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < halfWidth; x++) {
        const leftIdx = (y * width + x) * 4;
        const rightIdx = (y * width + (width - x - 1)) * 4;

        diff += Math.abs(image.bitmap.data[leftIdx] - image.bitmap.data[rightIdx]);
        diff += Math.abs(image.bitmap.data[leftIdx + 1] - image.bitmap.data[rightIdx + 1]);
        diff += Math.abs(image.bitmap.data[leftIdx + 2] - image.bitmap.data[rightIdx + 2]);
        count += 3;
      }
    }

    return 1 - diff / count / 255;
  }

  private calculateBalance(image: any): number {
    // Simplified balance: compare top and bottom halves
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const halfHeight = Math.floor(height / 2);

    let topWeight = 0;
    let bottomWeight = 0;

    for (let y = 0; y < halfHeight; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        topWeight += (image.bitmap.data[idx] + image.bitmap.data[idx + 1] + image.bitmap.data[idx + 2]) / 3;
      }
    }

    for (let y = halfHeight; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        bottomWeight += (image.bitmap.data[idx] + image.bitmap.data[idx + 1] + image.bitmap.data[idx + 2]) / 3;
      }
    }

    const ratio = Math.min(topWeight, bottomWeight) / Math.max(topWeight, bottomWeight);
    return ratio;
  }

  private mergeBoundingBoxes(bboxes: BoundingBox[]): BoundingBox {
    const minX = Math.min(...bboxes.map((b) => b.x));
    const minY = Math.min(...bboxes.map((b) => b.y));
    const maxX = Math.max(...bboxes.map((b) => b.x + b.width));
    const maxY = Math.max(...bboxes.map((b) => b.y + b.height));

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  private groupWordsToParagraphs(
    words: OCRResult['words'],
    width: number,
    height: number
  ): Array<{ bbox: BoundingBox; content: string; confidence: number }> {
    const paragraphs: Array<{ bbox: BoundingBox; content: string; confidence: number }> = [];
    const lineHeight = height * 0.03;

    let currentPara: OCRResult['words'] = [];

    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      if (currentPara.length === 0) {
        currentPara.push(word);
      } else {
        const lastWord = currentPara[currentPara.length - 1];
        const verticalDist = Math.abs(word.bbox.y - lastWord.bbox.y);

        if (verticalDist > lineHeight * 2) {
          // New paragraph
          paragraphs.push({
            bbox: this.mergeBoundingBoxes(currentPara.map((w) => w.bbox)),
            content: currentPara.map((w) => w.text).join(' '),
            confidence: currentPara.reduce((sum, w) => sum + w.confidence, 0) / currentPara.length,
          });
          currentPara = [word];
        } else {
          currentPara.push(word);
        }
      }
    }

    if (currentPara.length > 0) {
      paragraphs.push({
        bbox: this.mergeBoundingBoxes(currentPara.map((w) => w.bbox)),
        content: currentPara.map((w) => w.text).join(' '),
        confidence: currentPara.reduce((sum, w) => sum + w.confidence, 0) / currentPara.length,
      });
    }

    return paragraphs;
  }

  private detectTables(
    words: OCRResult['words'],
    width: number,
    height: number
  ): Array<{ bbox: BoundingBox; content: string; confidence: number }> {
    // Simplified table detection: look for grid-like word arrangements
    const tables: Array<{ bbox: BoundingBox; content: string; confidence: number }> = [];

    // Group words by Y position (rows)
    const rows = new Map<number, OCRResult['words']>();
    const rowHeight = height * 0.03;

    words.forEach((word) => {
      const rowKey = Math.floor(word.bbox.y / rowHeight);
      if (!rows.has(rowKey)) {
        rows.set(rowKey, []);
      }
      rows.get(rowKey)!.push(word);
    });

    // Find rows with similar number of columns (potential table)
    const rowArray = Array.from(rows.values());
    for (let i = 0; i < rowArray.length - 2; i++) {
      const row1 = rowArray[i];
      const row2 = rowArray[i + 1];
      const row3 = rowArray[i + 2];

      if (
        Math.abs(row1.length - row2.length) <= 1 &&
        Math.abs(row2.length - row3.length) <= 1 &&
        row1.length >= 3
      ) {
        const tableWords = [...row1, ...row2, ...row3];
        tables.push({
          bbox: this.mergeBoundingBoxes(tableWords.map((w) => w.bbox)),
          content: tableWords.map((w) => w.text).join(' | '),
          confidence: tableWords.reduce((sum, w) => sum + w.confidence, 0) / tableWords.length,
        });
        i += 2;
      }
    }

    return tables;
  }

  private extractLineItems(text: string): InvoiceData['lineItems'] {
    const lines = text.split('\n');
    const items: InvoiceData['lineItems'] = [];

    // Look for patterns like: "Description Qty Price Total"
    const itemRegex = /(.+?)\s+(\d+)\s+\$?([0-9.]+)\s+\$?([0-9.]+)/;

    lines.forEach((line) => {
      const match = line.match(itemRegex);
      if (match) {
        items.push({
          description: match[1].trim(),
          quantity: parseInt(match[2]),
          unitPrice: parseFloat(match[3]),
          total: parseFloat(match[4]),
        });
      }
    });

    return items;
  }

  private extractReceiptItems(text: string): ReceiptData['items'] {
    const lines = text.split('\n');
    const items: ReceiptData['items'] = [];

    // Look for patterns like: "Item Name Qty Price"
    const itemRegex = /(.+?)\s+(\d+)\s+\$?([0-9.]+)/;

    lines.forEach((line) => {
      const match = line.match(itemRegex);
      if (match) {
        items.push({
          name: match[1].trim(),
          quantity: parseInt(match[2]),
          price: parseFloat(match[3]),
        });
      }
    });

    return items;
  }

  private async compareImages(path1: string, path2: string): Promise<number> {
    try {
      const img1 = await Jimp.read(path1);
      const img2 = await Jimp.read(path2);

      // Resize to same dimensions for comparison
      const width = Math.min(img1.bitmap.width, img2.bitmap.width);
      const height = Math.min(img1.bitmap.height, img2.bitmap.height);

      img1.resize(width, height);
      img2.resize(width, height);

      // Calculate pixel difference
      let diff = 0;
      const totalPixels = width * height;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          diff += Math.abs(img1.bitmap.data[idx] - img2.bitmap.data[idx]);
          diff += Math.abs(img1.bitmap.data[idx + 1] - img2.bitmap.data[idx + 1]);
          diff += Math.abs(img1.bitmap.data[idx + 2] - img2.bitmap.data[idx + 2]);
        }
      }

      return diff / (totalPixels * 3 * 255);
    } catch (error) {
      this.logger.error('Image comparison failed:', error);
      return 0;
    }
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
  }

  private getColorName(rgb: { r: number; g: number; b: number }): string {
    const { r, g, b } = rgb;

    if (r > 200 && g > 200 && b > 200) return 'white';
    if (r < 50 && g < 50 && b < 50) return 'black';
    if (r > g && r > b) return 'red';
    if (g > r && g > b) return 'green';
    if (b > r && b > g) return 'blue';
    if (r > 150 && g > 150 && b < 100) return 'yellow';
    if (r > 150 && b > 150 && g < 100) return 'purple';
    if (g > 150 && b > 150 && r < 100) return 'cyan';
    if (r > 150 && g > 100 && b < 100) return 'orange';

    return 'gray';
  }

  async cleanup(): Promise<void> {
    try {
      // Clean up temp files older than 1 hour
      const files = fs.readdirSync(this.config.tempDir);
      const now = Date.now();
      const maxAge = 60 * 60 * 1000; // 1 hour

      files.forEach((file) => {
        const filePath = path.join(this.config.tempDir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
        }
      });

      this.logger.info('Cleanup completed');
    } catch (error) {
      this.logger.error('Cleanup failed:', error);
    }
  }
}

export default VisionService;
