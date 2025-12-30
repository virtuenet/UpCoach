import { EventEmitter } from 'events';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

export interface FoodClassification {
  itemId: string;
  name: string;
  category: string;
  confidence: number;
  nutritionalInfo: NutritionalInfo;
  servingSize: string;
  alternatives?: string[];
}

export interface NutritionalInfo {
  calories: number;
  protein: number; // grams
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number; // mg
  servingSize: string;
}

export interface ExerciseClassification {
  exerciseId: string;
  name: string;
  type: 'cardio' | 'strength' | 'flexibility' | 'balance' | 'sports';
  muscleGroups: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  confidence: number;
  estimatedCaloriesBurn: number; // per 30 minutes
  equipment?: string[];
}

export interface BatchClassificationResult {
  foodItems: FoodClassification[];
  exercises: ExerciseClassification[];
  processedCount: number;
  failedCount: number;
  processingTime: number;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number; // bytes
  timestamp?: Date;
}

// ============================================================================
// IMAGE CLASSIFICATION SERVICE
// ============================================================================

export class ImageClassificationService extends EventEmitter {
  private static instance: ImageClassificationService;

  // Food database with nutritional information
  private foodDatabase = new Map<string, FoodClassification>([
    ['apple', {
      itemId: 'food_001',
      name: 'Apple',
      category: 'fruit',
      confidence: 0.95,
      nutritionalInfo: {
        calories: 95,
        protein: 0.5,
        carbs: 25,
        fat: 0.3,
        fiber: 4,
        sugar: 19,
        sodium: 2,
        servingSize: '1 medium (182g)',
      },
      servingSize: '1 medium',
      alternatives: ['pear', 'peach'],
    }],
    ['banana', {
      itemId: 'food_002',
      name: 'Banana',
      category: 'fruit',
      confidence: 0.93,
      nutritionalInfo: {
        calories: 105,
        protein: 1.3,
        carbs: 27,
        fat: 0.4,
        fiber: 3,
        sugar: 14,
        sodium: 1,
        servingSize: '1 medium (118g)',
      },
      servingSize: '1 medium',
      alternatives: ['plantain'],
    }],
    ['chicken_breast', {
      itemId: 'food_003',
      name: 'Chicken Breast',
      category: 'protein',
      confidence: 0.88,
      nutritionalInfo: {
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        fiber: 0,
        sugar: 0,
        sodium: 74,
        servingSize: '100g cooked',
      },
      servingSize: '100g',
      alternatives: ['turkey_breast', 'tofu'],
    }],
    ['salad', {
      itemId: 'food_004',
      name: 'Garden Salad',
      category: 'vegetable',
      confidence: 0.85,
      nutritionalInfo: {
        calories: 45,
        protein: 2,
        carbs: 8,
        fat: 0.5,
        fiber: 3,
        sugar: 4,
        sodium: 35,
        servingSize: '1 cup (100g)',
      },
      servingSize: '1 cup',
      alternatives: ['caesar_salad', 'greek_salad'],
    }],
    ['rice', {
      itemId: 'food_005',
      name: 'White Rice',
      category: 'grain',
      confidence: 0.90,
      nutritionalInfo: {
        calories: 205,
        protein: 4.3,
        carbs: 45,
        fat: 0.4,
        fiber: 0.6,
        sugar: 0.1,
        sodium: 2,
        servingSize: '1 cup cooked (158g)',
      },
      servingSize: '1 cup',
      alternatives: ['brown_rice', 'quinoa'],
    }],
    ['salmon', {
      itemId: 'food_006',
      name: 'Salmon',
      category: 'protein',
      confidence: 0.87,
      nutritionalInfo: {
        calories: 206,
        protein: 22,
        carbs: 0,
        fat: 13,
        fiber: 0,
        sugar: 0,
        sodium: 59,
        servingSize: '100g cooked',
      },
      servingSize: '100g',
      alternatives: ['tuna', 'mackerel'],
    }],
    ['eggs', {
      itemId: 'food_007',
      name: 'Eggs',
      category: 'protein',
      confidence: 0.92,
      nutritionalInfo: {
        calories: 155,
        protein: 13,
        carbs: 1.1,
        fat: 11,
        fiber: 0,
        sugar: 1.1,
        sodium: 124,
        servingSize: '2 large eggs (100g)',
      },
      servingSize: '2 large',
      alternatives: ['egg_whites'],
    }],
    ['avocado', {
      itemId: 'food_008',
      name: 'Avocado',
      category: 'fruit',
      confidence: 0.89,
      nutritionalInfo: {
        calories: 234,
        protein: 3,
        carbs: 12,
        fat: 21,
        fiber: 10,
        sugar: 1,
        sodium: 10,
        servingSize: '1 medium (150g)',
      },
      servingSize: '1 medium',
      alternatives: [],
    }],
  ]);

  // Exercise database
  private exerciseDatabase = new Map<string, ExerciseClassification>([
    ['running', {
      exerciseId: 'ex_001',
      name: 'Running',
      type: 'cardio',
      muscleGroups: ['legs', 'core', 'glutes'],
      difficulty: 'beginner',
      confidence: 0.94,
      estimatedCaloriesBurn: 300,
      equipment: [],
    }],
    ['push_ups', {
      exerciseId: 'ex_002',
      name: 'Push-ups',
      type: 'strength',
      muscleGroups: ['chest', 'triceps', 'shoulders', 'core'],
      difficulty: 'beginner',
      confidence: 0.91,
      estimatedCaloriesBurn: 90,
      equipment: [],
    }],
    ['squats', {
      exerciseId: 'ex_003',
      name: 'Squats',
      type: 'strength',
      muscleGroups: ['quadriceps', 'glutes', 'hamstrings', 'core'],
      difficulty: 'beginner',
      confidence: 0.90,
      estimatedCaloriesBurn: 100,
      equipment: [],
    }],
    ['deadlift', {
      exerciseId: 'ex_004',
      name: 'Deadlift',
      type: 'strength',
      muscleGroups: ['back', 'glutes', 'hamstrings', 'core'],
      difficulty: 'intermediate',
      confidence: 0.86,
      estimatedCaloriesBurn: 150,
      equipment: ['barbell'],
    }],
    ['yoga', {
      exerciseId: 'ex_005',
      name: 'Yoga',
      type: 'flexibility',
      muscleGroups: ['full_body'],
      difficulty: 'beginner',
      confidence: 0.88,
      estimatedCaloriesBurn: 120,
      equipment: ['yoga_mat'],
    }],
    ['plank', {
      exerciseId: 'ex_006',
      name: 'Plank',
      type: 'strength',
      muscleGroups: ['core', 'shoulders', 'back'],
      difficulty: 'beginner',
      confidence: 0.92,
      estimatedCaloriesBurn: 60,
      equipment: [],
    }],
    ['burpees', {
      exerciseId: 'ex_007',
      name: 'Burpees',
      type: 'cardio',
      muscleGroups: ['full_body'],
      difficulty: 'intermediate',
      confidence: 0.87,
      estimatedCaloriesBurn: 200,
      equipment: [],
    }],
    ['cycling', {
      exerciseId: 'ex_008',
      name: 'Cycling',
      type: 'cardio',
      muscleGroups: ['legs', 'glutes', 'core'],
      difficulty: 'beginner',
      confidence: 0.93,
      estimatedCaloriesBurn: 250,
      equipment: ['bicycle'],
    }],
  ]);

  private constructor() {
    super();
  }

  static getInstance(): ImageClassificationService {
    if (!ImageClassificationService.instance) {
      ImageClassificationService.instance = new ImageClassificationService();
    }
    return ImageClassificationService.instance;
  }

  // ============================================================================
  // FOOD RECOGNITION
  // ============================================================================

  async classifyFood(imageBuffer: Buffer, metadata?: ImageMetadata): Promise<FoodClassification[]> {
    const startTime = Date.now();

    // Validate image
    this.validateImage(imageBuffer, metadata);

    // In production, this would use a trained ML model (TensorFlow.js, ONNX, etc.)
    // For now, we'll simulate classification
    const classifications = await this.performFoodClassification(imageBuffer);

    const processingTime = Date.now() - startTime;
    this.emit('classification:completed', {
      type: 'food',
      count: classifications.length,
      processingTime,
    });

    return classifications;
  }

  private async performFoodClassification(imageBuffer: Buffer): Promise<FoodClassification[]> {
    // Simulate ML inference time
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mock classification - in production, would use actual model
    const detectedFoods: FoodClassification[] = [];

    // Simulate detecting 1-3 food items
    const itemCount = 1 + Math.floor(Math.random() * 3);
    const foodKeys = Array.from(this.foodDatabase.keys());

    for (let i = 0; i < itemCount; i++) {
      const randomKey = foodKeys[Math.floor(Math.random() * foodKeys.length)];
      const food = this.foodDatabase.get(randomKey)!;

      // Add some confidence variation
      const confidence = 0.7 + Math.random() * 0.25;

      detectedFoods.push({
        ...food,
        confidence,
      });
    }

    return detectedFoods;
  }

  // ============================================================================
  // CALORIE ESTIMATION
  // ============================================================================

  async estimateCalories(
    foodItems: FoodClassification[],
    servingSizeMultiplier: number = 1
  ): Promise<number> {
    let totalCalories = 0;

    for (const item of foodItems) {
      totalCalories += item.nutritionalInfo.calories * servingSizeMultiplier;
    }

    return Math.round(totalCalories);
  }

  async estimateMealCalories(imageBuffer: Buffer): Promise<{
    totalCalories: number;
    breakdown: Array<{ item: string; calories: number }>;
    macros: { protein: number; carbs: number; fat: number };
  }> {
    const foodItems = await this.classifyFood(imageBuffer);

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    const breakdown = foodItems.map(item => {
      const calories = item.nutritionalInfo.calories;
      totalCalories += calories;
      totalProtein += item.nutritionalInfo.protein;
      totalCarbs += item.nutritionalInfo.carbs;
      totalFat += item.nutritionalInfo.fat;

      return {
        item: item.name,
        calories,
      };
    });

    return {
      totalCalories: Math.round(totalCalories),
      breakdown,
      macros: {
        protein: Math.round(totalProtein),
        carbs: Math.round(totalCarbs),
        fat: Math.round(totalFat),
      },
    };
  }

  // ============================================================================
  // EXERCISE DETECTION
  // ============================================================================

  async classifyExercise(imageBuffer: Buffer, metadata?: ImageMetadata): Promise<ExerciseClassification[]> {
    const startTime = Date.now();

    this.validateImage(imageBuffer, metadata);

    const classifications = await this.performExerciseClassification(imageBuffer);

    const processingTime = Date.now() - startTime;
    this.emit('classification:completed', {
      type: 'exercise',
      count: classifications.length,
      processingTime,
    });

    return classifications;
  }

  private async performExerciseClassification(imageBuffer: Buffer): Promise<ExerciseClassification[]> {
    // Simulate ML inference time
    await new Promise(resolve => setTimeout(resolve, 400));

    // Mock classification
    const exerciseKeys = Array.from(this.exerciseDatabase.keys());
    const randomKey = exerciseKeys[Math.floor(Math.random() * exerciseKeys.length)];
    const exercise = this.exerciseDatabase.get(randomKey)!;

    // Add confidence variation
    const confidence = 0.75 + Math.random() * 0.2;

    return [{
      ...exercise,
      confidence,
    }];
  }

  // ============================================================================
  // NUTRITIONAL INFORMATION LOOKUP
  // ============================================================================

  async getNutritionalInfo(foodName: string): Promise<NutritionalInfo | null> {
    const normalizedName = foodName.toLowerCase().replace(/\s+/g, '_');

    const food = this.foodDatabase.get(normalizedName);
    if (food) {
      return food.nutritionalInfo;
    }

    // Try fuzzy matching
    for (const [key, value] of this.foodDatabase.entries()) {
      if (key.includes(normalizedName) || normalizedName.includes(key)) {
        return value.nutritionalInfo;
      }
    }

    return null;
  }

  searchFoodDatabase(query: string, limit: number = 10): FoodClassification[] {
    const results: FoodClassification[] = [];
    const normalizedQuery = query.toLowerCase();

    for (const food of this.foodDatabase.values()) {
      if (
        food.name.toLowerCase().includes(normalizedQuery) ||
        food.category.toLowerCase().includes(normalizedQuery)
      ) {
        results.push(food);
      }

      if (results.length >= limit) break;
    }

    return results;
  }

  // ============================================================================
  // BATCH PROCESSING
  // ============================================================================

  async batchClassify(images: Array<{ buffer: Buffer; type: 'food' | 'exercise' }>): Promise<BatchClassificationResult> {
    const startTime = Date.now();

    const foodItems: FoodClassification[] = [];
    const exercises: ExerciseClassification[] = [];
    let processedCount = 0;
    let failedCount = 0;

    for (const image of images) {
      try {
        if (image.type === 'food') {
          const results = await this.classifyFood(image.buffer);
          foodItems.push(...results);
        } else {
          const results = await this.classifyExercise(image.buffer);
          exercises.push(...results);
        }
        processedCount++;
      } catch (error) {
        failedCount++;
        this.emit('classification:error', { error, type: image.type });
      }
    }

    const processingTime = Date.now() - startTime;

    return {
      foodItems,
      exercises,
      processedCount,
      failedCount,
      processingTime,
    };
  }

  // ============================================================================
  // MEAL SUGGESTIONS
  // ============================================================================

  async suggestMealImprovements(foodItems: FoodClassification[]): Promise<{
    score: number; // 0-100
    suggestions: string[];
    alternatives: Array<{ replace: string; with: string; reason: string }>;
  }> {
    let score = 80; // Base score
    const suggestions: string[] = [];
    const alternatives: Array<{ replace: string; with: string; reason: string }> = [];

    // Calculate nutritional balance
    const totalCalories = foodItems.reduce((sum, item) => sum + item.nutritionalInfo.calories, 0);
    const totalProtein = foodItems.reduce((sum, item) => sum + item.nutritionalInfo.protein, 0);
    const totalCarbs = foodItems.reduce((sum, item) => sum + item.nutritionalInfo.carbs, 0);
    const totalFat = foodItems.reduce((sum, item) => sum + item.nutritionalInfo.fat, 0);

    // Check protein intake
    const proteinCalories = totalProtein * 4;
    const proteinPercentage = (proteinCalories / totalCalories) * 100;

    if (proteinPercentage < 15) {
      score -= 10;
      suggestions.push('Consider adding more protein sources');

      // Suggest protein alternatives
      for (const item of foodItems) {
        if (item.category !== 'protein' && item.alternatives && item.alternatives.length > 0) {
          const proteinAlt = this.foodDatabase.get(item.alternatives[0]);
          if (proteinAlt && proteinAlt.category === 'protein') {
            alternatives.push({
              replace: item.name,
              with: proteinAlt.name,
              reason: 'Increase protein intake',
            });
          }
        }
      }
    }

    // Check fiber
    const totalFiber = foodItems.reduce((sum, item) => sum + item.nutritionalInfo.fiber, 0);
    if (totalFiber < 10) {
      score -= 5;
      suggestions.push('Add more fiber-rich foods');
    }

    // Check sugar
    const totalSugar = foodItems.reduce((sum, item) => sum + item.nutritionalInfo.sugar, 0);
    if (totalSugar > 50) {
      score -= 10;
      suggestions.push('Reduce sugar intake');
    }

    // Check sodium
    const totalSodium = foodItems.reduce((sum, item) => sum + item.nutritionalInfo.sodium, 0);
    if (totalSodium > 2000) {
      score -= 5;
      suggestions.push('Watch sodium levels');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      suggestions,
      alternatives,
    };
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  private validateImage(buffer: Buffer, metadata?: ImageMetadata): void {
    if (!buffer || buffer.length === 0) {
      throw new Error('Invalid image buffer');
    }

    // Check file size (max 10MB)
    if (buffer.length > 10 * 1024 * 1024) {
      throw new Error('Image file too large (max 10MB)');
    }

    if (metadata) {
      // Validate dimensions
      if (metadata.width < 100 || metadata.height < 100) {
        throw new Error('Image resolution too low (minimum 100x100)');
      }
    }
  }

  // ============================================================================
  // ANALYTICS & INSIGHTS
  // ============================================================================

  async analyzeEatingPatterns(
    meals: Array<{ timestamp: Date; foodItems: FoodClassification[] }>
  ): Promise<{
    averageCalories: number;
    macroBalance: { protein: number; carbs: number; fat: number };
    topCategories: Array<{ category: string; count: number }>;
    insights: string[];
  }> {
    if (meals.length === 0) {
      return {
        averageCalories: 0,
        macroBalance: { protein: 0, carbs: 0, fat: 0 },
        topCategories: [],
        insights: [],
      };
    }

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    const categoryCount = new Map<string, number>();

    for (const meal of meals) {
      for (const item of meal.foodItems) {
        totalCalories += item.nutritionalInfo.calories;
        totalProtein += item.nutritionalInfo.protein;
        totalCarbs += item.nutritionalInfo.carbs;
        totalFat += item.nutritionalInfo.fat;

        categoryCount.set(item.category, (categoryCount.get(item.category) || 0) + 1);
      }
    }

    const avgCalories = totalCalories / meals.length;
    const avgProtein = totalProtein / meals.length;
    const avgCarbs = totalCarbs / meals.length;
    const avgFat = totalFat / meals.length;

    const topCategories = Array.from(categoryCount.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const insights: string[] = [];

    if (avgCalories < 1500) {
      insights.push('Your average calorie intake is low. Consider eating more to meet your energy needs.');
    } else if (avgCalories > 2500) {
      insights.push('Your average calorie intake is high. Consider portion control if weight loss is your goal.');
    }

    if (avgProtein < 50) {
      insights.push('Low protein intake detected. Aim for more protein-rich foods.');
    }

    return {
      averageCalories: Math.round(avgCalories),
      macroBalance: {
        protein: Math.round(avgProtein),
        carbs: Math.round(avgCarbs),
        fat: Math.round(avgFat),
      },
      topCategories,
      insights,
    };
  }
}

export const imageClassificationService = ImageClassificationService.getInstance();
