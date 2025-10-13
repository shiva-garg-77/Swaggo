import mongoose from 'mongoose';
import { logger } from '../utils/SanitizedLogger.js';

/**
 * 📊 DATABASE QUERY ANALYZER
 * 
 * Utility for analyzing and optimizing database queries
 * Provides query execution plan analysis and performance metrics
 */

class DatabaseQueryAnalyzer {
  constructor() {
    this.slowQueryThreshold = parseInt(process.env.SLOW_QUERY_THRESHOLD) || 100; // ms
    this.queryLogs = [];
  }

  /**
   * Analyze a query execution plan
   * @param {Object} model - Mongoose model
   * @param {Object} query - Query conditions
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Query analysis results
   */
  async analyzeQuery(model, query, options = {}) {
    try {
      const startTime = Date.now();
      
      // Execute explain plan
      const explainResult = await model.find(query).explain('executionStats');
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      const analysis = {
        modelName: model.modelName,
        query: query,
        options: options,
        executionTime: executionTime,
        isSlow: executionTime > this.slowQueryThreshold,
        explain: explainResult,
        recommendations: this.generateRecommendations(explainResult)
      };
      
      // Log slow queries
      if (analysis.isSlow) {
        logger.warn(`Slow query detected in ${model.modelName}`, {
          executionTime,
          query,
          explain: explainResult
        });
      }
      
      // Store in query logs
      this.queryLogs.push(analysis);
      
      // Keep only last 100 query logs
      if (this.queryLogs.length > 100) {
        this.queryLogs.shift();
      }
      
      return analysis;
    } catch (error) {
      logger.error(`Error analyzing query in ${model.modelName}:`, { error: error.message, query, options });
      throw error;
    }
  }
  
  /**
   * Generate optimization recommendations based on explain plan
   * @param {Object} explainResult - MongoDB explain result
   * @returns {Array} Array of recommendations
   */
  generateRecommendations(explainResult) {
    const recommendations = [];
    
    if (!explainResult || !explainResult.queryPlanner) {
      return recommendations;
    }
    
    const winningPlan = explainResult.queryPlanner.winningPlan;
    
    // Check if query used an index
    if (winningPlan.inputStage.stage === 'COLLSCAN') {
      recommendations.push({
        type: 'warning',
        message: 'Query is performing a collection scan. Consider adding an index.',
        priority: 'high'
      });
    }
    
    // Check index usage
    if (winningPlan.inputStage.indexName) {
      const indexName = winningPlan.inputStage.indexName;
      
      // Check if it's the default index
      if (indexName === '_id_') {
        recommendations.push({
          type: 'info',
          message: 'Query is using the default _id index. Consider creating a more specific index.',
          priority: 'medium'
        });
      }
    }
    
    // Check for inefficient stages
    const checkStage = (stage) => {
      if (stage.stage === 'SORT') {
        recommendations.push({
          type: 'info',
          message: 'Query is performing an in-memory sort. Consider creating an index that supports the sort.',
          priority: 'medium'
        });
      }
      
      if (stage.stage === 'SKIP') {
        recommendations.push({
          type: 'info',
          message: 'Query is using skip, which can be inefficient for large offsets. Consider cursor-based pagination.',
          priority: 'medium'
        });
      }
      
      // Recursively check child stages
      if (stage.inputStage) {
        checkStage(stage.inputStage);
      }
      
      if (stage.thenStage) {
        checkStage(stage.thenStage);
      }
      
      if (stage.elseStage) {
        checkStage(stage.elseStage);
      }
    };
    
    checkStage(winningPlan.inputStage);
    
    return recommendations;
  }
  
  /**
   * Get slow query statistics
   * @returns {Object} Slow query statistics
   */
  getSlowQueryStats() {
    const slowQueries = this.queryLogs.filter(log => log.isSlow);
    
    return {
      totalQueries: this.queryLogs.length,
      slowQueries: slowQueries.length,
      slowQueryPercentage: this.queryLogs.length > 0 ? (slowQueries.length / this.queryLogs.length) * 100 : 0,
      averageExecutionTime: this.queryLogs.length > 0 ? 
        this.queryLogs.reduce((sum, log) => sum + log.executionTime, 0) / this.queryLogs.length : 0,
      slowQueriesByModel: this.groupSlowQueriesByModel(slowQueries)
    };
  }
  
  /**
   * Group slow queries by model
   * @param {Array} slowQueries - Array of slow queries
   * @returns {Object} Grouped slow queries
   */
  groupSlowQueriesByModel(slowQueries) {
    const grouped = {};
    
    slowQueries.forEach(query => {
      if (!grouped[query.modelName]) {
        grouped[query.modelName] = [];
      }
      grouped[query.modelName].push(query);
    });
    
    return grouped;
  }
  
  /**
   * Get query performance report
   * @returns {Object} Performance report
   */
  getPerformanceReport() {
    const stats = this.getSlowQueryStats();
    
    return {
      timestamp: new Date(),
      stats: stats,
      recommendations: this.generateGeneralRecommendations(stats)
    };
  }
  
  /**
   * Generate general optimization recommendations
   * @param {Object} stats - Performance statistics
   * @returns {Array} Array of recommendations
   */
  generateGeneralRecommendations(stats) {
    const recommendations = [];
    
    if (stats.slowQueryPercentage > 10) {
      recommendations.push({
        type: 'warning',
        message: `High percentage of slow queries (${stats.slowQueryPercentage.toFixed(2)}%). Consider query optimization.`,
        priority: 'high'
      });
    }
    
    if (stats.averageExecutionTime > 200) {
      recommendations.push({
        type: 'warning',
        message: `Average query execution time is high (${stats.averageExecutionTime.toFixed(2)}ms). Consider query optimization.`,
        priority: 'high'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Clear query logs
   */
  clearLogs() {
    this.queryLogs = [];
  }
  
  /**
   * Get recent query logs
   * @param {number} limit - Number of logs to return
   * @returns {Array} Recent query logs
   */
  getRecentLogs(limit = 50) {
    return this.queryLogs.slice(-limit);
  }
}

// Export singleton instance
export default new DatabaseQueryAnalyzer();