import { EventEmitter } from 'events';
import * as regression from 'regression';

/**
 * Forecasting Engine
 *
 * Predictive analytics for goal completion, revenue forecasting,
 * user growth, and engagement trends.
 *
 * Algorithms:
 * - ARIMA (AutoRegressive Integrated Moving Average)
 * - Exponential Smoothing (Holt-Winters)
 * - Linear Regression
 * - Seasonal Decomposition
 *
 * Features:
 * - 30-day, 90-day, 365-day forecasts
 * - Confidence intervals
 * - Trend decomposition (trend, seasonality, residual)
 * - What-if scenario analysis
 * - Anomaly detection integration
 */

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
}

export interface Forecast {
  metric: string;
  predictions: ForecastPoint[];
  confidence: number;
  algorithm: 'arima' | 'exponential_smoothing' | 'linear_regression' | 'seasonal';
  metadata: {
    mape: number;
    rmse: number;
    mae: number;
    r2: number;
    trainedAt: Date;
    trainSize: number;
  };
  decomposition?: SeasonalDecomposition;
}

export interface ForecastPoint {
  timestamp: Date;
  value: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

export interface SeasonalDecomposition {
  trend: number[];
  seasonal: number[];
  residual: number[];
  period: number;
}

export interface WhatIfScenario {
  name: string;
  parameters: Record<string, number>;
  forecast: Forecast;
}

export interface Anomaly {
  timestamp: Date;
  value: number;
  expected: number;
  deviation: number;
  zScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class ForecastingEngine extends EventEmitter {
  private forecasts: Map<string, Forecast> = new Map();

  /**
   * Generate forecast for metric
   */
  async forecast(
    metric: string,
    historicalData: TimeSeriesData[],
    horizon: number = 30,
    algorithm?: 'arima' | 'exponential_smoothing' | 'linear_regression'
  ): Promise<Forecast> {
    if (historicalData.length < 7) {
      throw new Error('Insufficient data for forecasting (minimum 7 data points required)');
    }

    const selectedAlgorithm = algorithm || this.selectBestAlgorithm(historicalData);

    let predictions: ForecastPoint[];
    let decomposition: SeasonalDecomposition | undefined;

    const values = historicalData.map(d => d.value);
    const timestamps = historicalData.map(d => d.timestamp);

    switch (selectedAlgorithm) {
      case 'exponential_smoothing':
        predictions = this.exponentialSmoothing(historicalData, horizon);
        decomposition = this.decomposeTimeSeries(values);
        break;
      case 'arima':
        predictions = this.arima(historicalData, horizon);
        break;
      case 'linear_regression':
        predictions = this.linearRegression(historicalData, horizon);
        break;
      default:
        predictions = this.exponentialSmoothing(historicalData, horizon);
    }

    predictions = predictions.map(p => ({
      ...p,
      confidenceInterval: this.calculateConfidenceInterval(
        p.value,
        historicalData,
        0.95
      ),
    }));

    const metrics = this.calculateAccuracyMetrics(historicalData, predictions);

    const forecast: Forecast = {
      metric,
      predictions,
      confidence: this.calculateForecastConfidence(metrics),
      algorithm: selectedAlgorithm,
      metadata: {
        ...metrics,
        trainedAt: new Date(),
        trainSize: historicalData.length,
      },
      decomposition,
    };

    this.forecasts.set(metric, forecast);
    this.emit('forecast:generated', { metric, algorithm: selectedAlgorithm });

    return forecast;
  }

  /**
   * Select best algorithm based on data characteristics
   */
  private selectBestAlgorithm(
    data: TimeSeriesData[]
  ): 'arima' | 'exponential_smoothing' | 'linear_regression' {
    const values = data.map(d => d.value);

    const hasTrend = this.detectTrend(values);
    const hasSeason = this.detectSeasonality(values);
    const volatility = this.calculateVolatility(values);

    if (hasSeason && hasTrend) {
      return 'exponential_smoothing';
    } else if (hasTrend && volatility < 0.3) {
      return 'linear_regression';
    } else {
      return 'arima';
    }
  }

  /**
   * Exponential Smoothing (Holt-Winters)
   */
  private exponentialSmoothing(
    data: TimeSeriesData[],
    horizon: number
  ): ForecastPoint[] {
    const alpha = 0.3;
    const beta = 0.1;
    const gamma = 0.1;

    const values = data.map(d => d.value);
    const timestamps = data.map(d => d.timestamp);

    let level = values[0];
    let trend = values.length > 1 ? values[1] - values[0] : 0;

    const seasonalPeriod = this.detectSeasonalPeriod(values);
    const seasonalComponents = new Array(seasonalPeriod).fill(1);

    for (let i = 0; i < values.length; i++) {
      const seasonalIndex = i % seasonalPeriod;
      const previousLevel = level;

      level = alpha * (values[i] / seasonalComponents[seasonalIndex]) +
              (1 - alpha) * (level + trend);
      trend = beta * (level - previousLevel) + (1 - beta) * trend;
      seasonalComponents[seasonalIndex] =
        gamma * (values[i] / level) +
        (1 - gamma) * seasonalComponents[seasonalIndex];
    }

    const predictions: ForecastPoint[] = [];
    const lastTimestamp = timestamps[timestamps.length - 1];
    const interval = this.calculateAverageInterval(timestamps);

    for (let i = 0; i < horizon; i++) {
      const seasonalIndex = (values.length + i) % seasonalPeriod;
      const forecast = (level + (i + 1) * trend) * seasonalComponents[seasonalIndex];

      predictions.push({
        timestamp: new Date(lastTimestamp.getTime() + (i + 1) * interval),
        value: Math.max(0, forecast),
        confidenceInterval: { lower: 0, upper: 0 },
      });
    }

    return predictions;
  }

  /**
   * ARIMA Implementation (Simplified)
   */
  private arima(data: TimeSeriesData[], horizon: number): ForecastPoint[] {
    const values = data.map(d => d.value);
    const timestamps = data.map(d => d.timestamp);

    const p = 2;
    const d = 1;
    const q = 2;

    let series = [...values];

    for (let diff = 0; diff < d; diff++) {
      series = this.difference(series);
    }

    const arCoefficients = this.calculateARCoefficients(series, p);
    const maCoefficients = this.calculateMACoefficients(series, q);

    const predictions: ForecastPoint[] = [];
    const lastTimestamp = timestamps[timestamps.length - 1];
    const interval = this.calculateAverageInterval(timestamps);

    let currentSeries = [...values];

    for (let i = 0; i < horizon; i++) {
      let forecast = 0;

      for (let j = 0; j < p && j < currentSeries.length; j++) {
        forecast += arCoefficients[j] * currentSeries[currentSeries.length - 1 - j];
      }

      forecast += this.calculateMAComponent(currentSeries, maCoefficients, q);

      currentSeries.push(forecast);

      predictions.push({
        timestamp: new Date(lastTimestamp.getTime() + (i + 1) * interval),
        value: Math.max(0, forecast),
        confidenceInterval: { lower: 0, upper: 0 },
      });
    }

    return predictions;
  }

  /**
   * Linear Regression Forecasting
   */
  private linearRegression(
    data: TimeSeriesData[],
    horizon: number
  ): ForecastPoint[] {
    const points: [number, number][] = data.map((d, i) => [i, d.value]);

    const result = regression.linear(points);
    const { equation } = result;

    const predictions: ForecastPoint[] = [];
    const lastTimestamp = data[data.length - 1].timestamp;
    const interval = this.calculateAverageInterval(data.map(d => d.timestamp));

    for (let i = 0; i < horizon; i++) {
      const x = data.length + i;
      const y = equation[0] * x + equation[1];

      predictions.push({
        timestamp: new Date(lastTimestamp.getTime() + (i + 1) * interval),
        value: Math.max(0, y),
        confidenceInterval: { lower: 0, upper: 0 },
      });
    }

    return predictions;
  }

  /**
   * Decompose time series into trend, seasonal, and residual components
   */
  private decomposeTimeSeries(values: number[]): SeasonalDecomposition {
    const period = this.detectSeasonalPeriod(values);

    const trend = this.calculateMovingAverage(values, period);

    const detrended = values.map((v, i) => v - (trend[i] || v));

    const seasonal = this.extractSeasonalComponent(detrended, period);

    const residual = values.map(
      (v, i) => v - (trend[i] || v) - (seasonal[i % period] || 0)
    );

    return { trend, seasonal, residual, period };
  }

  /**
   * Detect trend in data
   */
  private detectTrend(values: number[]): boolean {
    if (values.length < 3) return false;

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const change = Math.abs((secondAvg - firstAvg) / firstAvg);
    return change > 0.1;
  }

  /**
   * Detect seasonality in data
   */
  private detectSeasonality(values: number[]): boolean {
    if (values.length < 14) return false;

    const period = this.detectSeasonalPeriod(values);
    const acf = this.autocorrelation(values, period);

    return acf > 0.5;
  }

  /**
   * Detect seasonal period
   */
  private detectSeasonalPeriod(values: number[]): number {
    const maxPeriod = Math.min(Math.floor(values.length / 2), 30);
    let bestPeriod = 7;
    let maxAcf = 0;

    for (let period = 2; period <= maxPeriod; period++) {
      const acf = this.autocorrelation(values, period);
      if (acf > maxAcf) {
        maxAcf = acf;
        bestPeriod = period;
      }
    }

    return bestPeriod;
  }

  /**
   * Calculate autocorrelation
   */
  private autocorrelation(values: number[], lag: number): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < values.length - lag; i++) {
      numerator += (values[i] - mean) * (values[i + lag] - mean);
    }

    for (let i = 0; i < values.length; i++) {
      denominator += Math.pow(values[i] - mean, 2);
    }

    return numerator / denominator;
  }

  /**
   * Calculate volatility
   */
  private calculateVolatility(values: number[]): number {
    const returns = [];
    for (let i = 1; i < values.length; i++) {
      if (values[i - 1] !== 0) {
        returns.push((values[i] - values[i - 1]) / values[i - 1]);
      }
    }

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;

    return Math.sqrt(variance);
  }

  /**
   * Calculate confidence interval
   */
  private calculateConfidenceInterval(
    forecast: number,
    historicalData: TimeSeriesData[],
    confidenceLevel: number
  ): { lower: number; upper: number } {
    const values = historicalData.map(d => d.value);
    const stdDev = this.standardDeviation(values);

    const zScore = confidenceLevel === 0.95 ? 1.96 : 2.576;
    const margin = zScore * stdDev;

    return {
      lower: Math.max(0, forecast - margin),
      upper: forecast + margin,
    };
  }

  /**
   * Calculate standard deviation
   */
  private standardDeviation(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate accuracy metrics
   */
  private calculateAccuracyMetrics(
    actual: TimeSeriesData[],
    predicted: ForecastPoint[]
  ): {
    mape: number;
    rmse: number;
    mae: number;
    r2: number;
  } {
    const n = Math.min(actual.length, predicted.length);
    if (n === 0) {
      return { mape: 0, rmse: 0, mae: 0, r2: 0 };
    }

    let mape = 0;
    let mse = 0;
    let mae = 0;

    for (let i = 0; i < n; i++) {
      const actualValue = actual[i].value;
      const predictedValue = predicted[i].value;

      mape += Math.abs((actualValue - predictedValue) / actualValue);
      mse += Math.pow(actualValue - predictedValue, 2);
      mae += Math.abs(actualValue - predictedValue);
    }

    mape = (mape / n) * 100;
    const rmse = Math.sqrt(mse / n);
    mae = mae / n;

    const actualValues = actual.slice(0, n).map(d => d.value);
    const predictedValues = predicted.slice(0, n).map(p => p.value);
    const r2 = this.calculateR2(actualValues, predictedValues);

    return { mape, rmse, mae, r2 };
  }

  /**
   * Calculate R-squared
   */
  private calculateR2(actual: number[], predicted: number[]): number {
    const mean = actual.reduce((a, b) => a + b, 0) / actual.length;

    const ssTotal = actual.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0);
    const ssResidual = actual.reduce(
      (sum, v, i) => sum + Math.pow(v - predicted[i], 2),
      0
    );

    return 1 - ssResidual / ssTotal;
  }

  /**
   * Calculate forecast confidence
   */
  private calculateForecastConfidence(metrics: {
    mape: number;
    rmse: number;
    mae: number;
    r2: number;
  }): number {
    const mapeScore = Math.max(0, 1 - metrics.mape / 100);
    const r2Score = Math.max(0, metrics.r2);

    return (mapeScore * 0.6 + r2Score * 0.4) * 100;
  }

  /**
   * Calculate average interval between timestamps
   */
  private calculateAverageInterval(timestamps: Date[]): number {
    if (timestamps.length < 2) return 24 * 60 * 60 * 1000;

    let totalInterval = 0;
    for (let i = 1; i < timestamps.length; i++) {
      totalInterval += timestamps[i].getTime() - timestamps[i - 1].getTime();
    }

    return totalInterval / (timestamps.length - 1);
  }

  /**
   * Calculate moving average
   */
  private calculateMovingAverage(values: number[], window: number): number[] {
    const result: number[] = [];

    for (let i = 0; i < values.length; i++) {
      if (i < window - 1) {
        result.push(values[i]);
      } else {
        const sum = values.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / window);
      }
    }

    return result;
  }

  /**
   * Extract seasonal component
   */
  private extractSeasonalComponent(values: number[], period: number): number[] {
    const seasonal: number[] = new Array(period).fill(0);
    const counts: number[] = new Array(period).fill(0);

    for (let i = 0; i < values.length; i++) {
      const index = i % period;
      seasonal[index] += values[i];
      counts[index]++;
    }

    return seasonal.map((sum, i) => (counts[i] > 0 ? sum / counts[i] : 0));
  }

  /**
   * Difference operation for ARIMA
   */
  private difference(values: number[]): number[] {
    const result: number[] = [];
    for (let i = 1; i < values.length; i++) {
      result.push(values[i] - values[i - 1]);
    }
    return result;
  }

  /**
   * Calculate AR coefficients
   */
  private calculateARCoefficients(series: number[], order: number): number[] {
    const coefficients: number[] = [];

    for (let i = 0; i < order; i++) {
      const lag = i + 1;
      coefficients.push(this.autocorrelation(series, lag) * 0.5);
    }

    return coefficients;
  }

  /**
   * Calculate MA coefficients
   */
  private calculateMACoefficients(series: number[], order: number): number[] {
    const coefficients: number[] = [];

    for (let i = 0; i < order; i++) {
      coefficients.push(0.3 / (i + 1));
    }

    return coefficients;
  }

  /**
   * Calculate MA component
   */
  private calculateMAComponent(
    series: number[],
    coefficients: number[],
    order: number
  ): number {
    let component = 0;
    const errors = this.calculateErrors(series);

    for (let i = 0; i < order && i < errors.length; i++) {
      component += coefficients[i] * errors[errors.length - 1 - i];
    }

    return component;
  }

  /**
   * Calculate forecast errors
   */
  private calculateErrors(series: number[]): number[] {
    const errors: number[] = [];
    const mean = series.reduce((a, b) => a + b, 0) / series.length;

    for (let i = 1; i < series.length; i++) {
      errors.push(series[i] - mean);
    }

    return errors;
  }

  /**
   * What-if scenario analysis
   */
  async whatIfAnalysis(
    metric: string,
    historicalData: TimeSeriesData[],
    scenarios: WhatIfScenario[]
  ): Promise<WhatIfScenario[]> {
    const results: WhatIfScenario[] = [];

    for (const scenario of scenarios) {
      const adjustedData = this.applyScenarioParameters(
        historicalData,
        scenario.parameters
      );

      const forecast = await this.forecast(metric, adjustedData, 30);

      results.push({
        ...scenario,
        forecast,
      });
    }

    return results;
  }

  /**
   * Apply scenario parameters to data
   */
  private applyScenarioParameters(
    data: TimeSeriesData[],
    parameters: Record<string, number>
  ): TimeSeriesData[] {
    const growthRate = parameters.growthRate || 0;
    const seasonalityFactor = parameters.seasonalityFactor || 1;

    return data.map((point, index) => ({
      timestamp: point.timestamp,
      value: point.value * (1 + growthRate * index / data.length) * seasonalityFactor,
    }));
  }
}

export default ForecastingEngine;
