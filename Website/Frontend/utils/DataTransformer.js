/**
 * Centralized Data Transformation Utilities
 * Provides consistent data formatting and transformation across the application
 */

import errorHandlingService, { ERROR_TYPES } from '../services/ErrorHandlingService';

/**
 * Date and Time Transformations
 */
class DateTimeTransformer {
  /**
   * Format date to various standard formats
   */
  static formatDate(date, format = 'YYYY-MM-DD', locale = 'en-US') {
    try {
      if (!date) return '';
      
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        throw new Error('Invalid date');
      }

      switch (format) {
        case 'YYYY-MM-DD':
          return dateObj.toISOString().split('T')[0];
        
        case 'MM/DD/YYYY':
          return dateObj.toLocaleDateString('en-US');
        
        case 'DD/MM/YYYY':
          return dateObj.toLocaleDateString('en-GB');
        
        case 'YYYY-MM-DD HH:mm:ss':
          return dateObj.toISOString().replace('T', ' ').split('.')[0];
        
        case 'relative':
          return DateTimeTransformer.getRelativeTime(dateObj);
        
        case 'long':
          return dateObj.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        
        case 'short':
          return dateObj.toLocaleDateString(locale, {
            month: 'short',
            day: 'numeric',
            year: '2-digit'
          });
        
        case 'time':
          return dateObj.toLocaleTimeString(locale, {
            hour: '2-digit',
            minute: '2-digit'
          });
        
        case 'datetime':
          return dateObj.toLocaleString(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        
        case 'iso':
          return dateObj.toISOString();
        
        case 'timestamp':
          return dateObj.getTime();
        
        default:
          return dateObj.toLocaleDateString(locale);
      }
    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.JAVASCRIPT_ERROR,
          'Date formatting failed',
          { date, format, locale, error }
        )
      );
      return '';
    }
  }

  /**
   * Get relative time (e.g., "2 hours ago", "in 3 days")
   */
  static getRelativeTime(date, baseDate = new Date()) {
    try {
      const dateObj = new Date(date);
      const baseDateObj = new Date(baseDate);
      
      if (isNaN(dateObj.getTime()) || isNaN(baseDateObj.getTime())) {
        throw new Error('Invalid date');
      }

      const diffMs = baseDateObj.getTime() - dateObj.getTime();
      const diffSec = Math.abs(diffMs) / 1000;
      const isPast = diffMs > 0;

      const units = [
        { name: 'year', seconds: 31536000 },
        { name: 'month', seconds: 2592000 },
        { name: 'week', seconds: 604800 },
        { name: 'day', seconds: 86400 },
        { name: 'hour', seconds: 3600 },
        { name: 'minute', seconds: 60 },
        { name: 'second', seconds: 1 }
      ];

      for (const unit of units) {
        const count = Math.floor(diffSec / unit.seconds);
        if (count >= 1) {
          const unitName = count === 1 ? unit.name : `${unit.name}s`;
          return isPast ? `${count} ${unitName} ago` : `in ${count} ${unitName}`;
        }
      }

      return 'just now';
    } catch (error) {
      return 'unknown time';
    }
  }

  /**
   * Parse various date formats into Date object
   */
  static parseDate(dateString, format = null) {
    try {
      if (!dateString) return null;

      // If format is specified, try to parse accordingly
      if (format) {
        switch (format) {
          case 'YYYY-MM-DD':
            return new Date(dateString + 'T00:00:00.000Z');
          case 'MM/DD/YYYY':
            const [month, day, year] = dateString.split('/');
            return new Date(year, month - 1, day);
          case 'DD/MM/YYYY':
            const [d, m, y] = dateString.split('/');
            return new Date(y, m - 1, d);
          case 'timestamp':
            return new Date(parseInt(dateString));
          default:
            return new Date(dateString);
        }
      }

      // Try various common formats
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date;
      }

      // Try timestamp
      if (/^\d+$/.test(dateString)) {
        const timestamp = parseInt(dateString);
        return new Date(timestamp > 10000000000 ? timestamp : timestamp * 1000);
      }

      throw new Error('Unable to parse date');
    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.JAVASCRIPT_ERROR,
          'Date parsing failed',
          { dateString, format, error }
        )
      );
      return null;
    }
  }

  /**
   * Calculate age from birth date
   */
  static calculateAge(birthDate) {
    try {
      const birth = new Date(birthDate);
      const now = new Date();
      
      if (isNaN(birth.getTime()) || birth > now) {
        throw new Error('Invalid birth date');
      }

      let age = now.getFullYear() - birth.getFullYear();
      const monthDiff = now.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
        age--;
      }

      return age;
    } catch (error) {
      return null;
    }
  }

  /**
   * Format duration in milliseconds to human readable format
   */
  static formatDuration(milliseconds, format = 'auto') {
    try {
      const seconds = Math.floor(milliseconds / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      switch (format) {
        case 'auto':
          if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
          if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
          if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
          return `${seconds}s`;

        case 'long':
          const parts = [];
          if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
          if (hours % 24 > 0) parts.push(`${hours % 24} hour${hours % 24 !== 1 ? 's' : ''}`);
          if (minutes % 60 > 0) parts.push(`${minutes % 60} minute${minutes % 60 !== 1 ? 's' : ''}`);
          if (seconds % 60 > 0) parts.push(`${seconds % 60} second${seconds % 60 !== 1 ? 's' : ''}`);
          return parts.join(', ');

        case 'short':
          if (days > 0) return `${days}d`;
          if (hours > 0) return `${hours}h`;
          if (minutes > 0) return `${minutes}m`;
          return `${seconds}s`;

        case 'precise':
          return `${String(hours % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

        default:
          return `${milliseconds}ms`;
      }
    } catch (error) {
      return '';
    }
  }
}

/**
 * Number and Currency Transformations
 */
class NumberTransformer {
  /**
   * Format number with various options
   */
  static formatNumber(number, options = {}) {
    try {
      if (number === null || number === undefined || isNaN(number)) {
        return options.fallback || '0';
      }

      const {
        decimals = 'auto',
        thousandsSeparator = ',',
        decimalSeparator = '.',
        prefix = '',
        suffix = '',
        locale = 'en-US',
        notation = 'standard'
      } = options;

      const num = parseFloat(number);
      
      if (notation === 'compact') {
        return new Intl.NumberFormat(locale, {
          notation: 'compact',
          compactDisplay: 'short'
        }).format(num);
      }

      if (notation === 'scientific') {
        return new Intl.NumberFormat(locale, {
          notation: 'scientific'
        }).format(num);
      }

      let decimalPlaces = decimals;
      if (decimals === 'auto') {
        decimalPlaces = num % 1 === 0 ? 0 : 2;
      }

      const formatted = new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces
      }).format(num);

      return prefix + formatted + suffix;
    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.JAVASCRIPT_ERROR,
          'Number formatting failed',
          { number, options, error }
        )
      );
      return options.fallback || '0';
    }
  }

  /**
   * Format currency
   */
  static formatCurrency(amount, currency = 'USD', locale = 'en-US', options = {}) {
    try {
      if (amount === null || amount === undefined || isNaN(amount)) {
        return options.fallback || '$0.00';
      }

      const {
        minimumFractionDigits = 2,
        maximumFractionDigits = 2,
        currencyDisplay = 'symbol'
      } = options;

      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        currencyDisplay,
        minimumFractionDigits,
        maximumFractionDigits
      }).format(amount);
    } catch (error) {
      return options.fallback || '$0.00';
    }
  }

  /**
   * Format percentage
   */
  static formatPercentage(value, decimals = 1, locale = 'en-US') {
    try {
      if (value === null || value === undefined || isNaN(value)) {
        return '0%';
      }

      return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(value);
    } catch (error) {
      return '0%';
    }
  }

  /**
   * Format file size
   */
  static formatFileSize(bytes, decimals = 2) {
    try {
      if (!bytes || bytes === 0) return '0 Bytes';

      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

      const i = Math.floor(Math.log(bytes) / Math.log(k));

      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    } catch (error) {
      return '0 Bytes';
    }
  }

  /**
   * Parse number from various formats
   */
  static parseNumber(value, locale = 'en-US') {
    try {
      if (typeof value === 'number') return value;
      if (!value) return 0;

      // Remove currency symbols and formatting
      const cleaned = String(value)
        .replace(/[$€£¥₹]/g, '')
        .replace(/[^\d.,-]/g, '')
        .replace(/,/g, '');

      const number = parseFloat(cleaned);
      return isNaN(number) ? 0 : number;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Round to specified decimal places
   */
  static round(number, decimals = 2) {
    try {
      const factor = Math.pow(10, decimals);
      return Math.round(number * factor) / factor;
    } catch (error) {
      return 0;
    }
  }
}

/**
 * Text and String Transformations
 */
class TextTransformer {
  /**
   * Convert string to various cases
   */
  static toCase(text, caseType = 'sentence') {
    try {
      if (!text) return '';

      const str = String(text);

      switch (caseType) {
        case 'upper':
          return str.toUpperCase();
        
        case 'lower':
          return str.toLowerCase();
        
        case 'title':
          return str.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
          );
        
        case 'sentence':
          return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        
        case 'camel':
          return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
            index === 0 ? word.toLowerCase() : word.toUpperCase()
          ).replace(/\s+/g, '');
        
        case 'pascal':
          return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => 
            word.toUpperCase()
          ).replace(/\s+/g, '');
        
        case 'kebab':
          return str.replace(/\s+/g, '-').toLowerCase();
        
        case 'snake':
          return str.replace(/\s+/g, '_').toLowerCase();
        
        case 'constant':
          return str.replace(/\s+/g, '_').toUpperCase();
        
        default:
          return str;
      }
    } catch (error) {
      return '';
    }
  }

  /**
   * Truncate text with ellipsis
   */
  static truncate(text, maxLength = 100, suffix = '...') {
    try {
      if (!text) return '';
      
      const str = String(text);
      if (str.length <= maxLength) return str;
      
      return str.substring(0, maxLength - suffix.length) + suffix;
    } catch (error) {
      return '';
    }
  }

  /**
   * Extract initials from name
   */
  static getInitials(name, maxInitials = 2) {
    try {
      if (!name) return '';
      
      const words = String(name).trim().split(/\s+/);
      const initials = words.slice(0, maxInitials).map(word => 
        word.charAt(0).toUpperCase()
      );
      
      return initials.join('');
    } catch (error) {
      return '';
    }
  }

  /**
   * Clean and normalize text
   */
  static normalize(text, options = {}) {
    try {
      if (!text) return '';
      
      let str = String(text);
      
      const {
        removeExtraSpaces = true,
        removeSpecialChars = false,
        removeAccents = false,
        trim = true
      } = options;

      if (trim) {
        str = str.trim();
      }

      if (removeExtraSpaces) {
        str = str.replace(/\s+/g, ' ');
      }

      if (removeAccents) {
        str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      }

      if (removeSpecialChars) {
        str = str.replace(/[^\w\s]/gi, '');
      }

      return str;
    } catch (error) {
      return '';
    }
  }

  /**
   * Generate slug from text
   */
  static toSlug(text, separator = '-') {
    try {
      if (!text) return '';
      
      return String(text)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, separator)
        .replace(/^-+|-+$/g, '');
    } catch (error) {
      return '';
    }
  }

  /**
   * Highlight search terms in text
   */
  static highlight(text, searchTerm, className = 'highlight') {
    try {
      if (!text || !searchTerm) return text;
      
      const regex = new RegExp(`(${searchTerm})`, 'gi');
      return String(text).replace(regex, `<span class="${className}">$1</span>`);
    } catch (error) {
      return text || '';
    }
  }

  /**
   * Extract readable text from HTML
   */
  static stripHTML(html) {
    try {
      if (!html) return '';
      
      // Remove HTML tags
      const stripped = String(html).replace(/<[^>]*>/g, '');
      
      // Decode HTML entities
      const textarea = document.createElement('textarea');
      textarea.innerHTML = stripped;
      
      return textarea.value;
    } catch (error) {
      return '';
    }
  }
}

/**
 * Array and Object Transformations
 */
class DataStructureTransformer {
  /**
   * Group array of objects by specified key
   */
  static groupBy(array, key) {
    try {
      if (!Array.isArray(array)) return {};
      
      return array.reduce((groups, item) => {
        const groupKey = typeof key === 'function' ? key(item) : item[key];
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(item);
        return groups;
      }, {});
    } catch (error) {
      return {};
    }
  }

  /**
   * Sort array by multiple criteria
   */
  static sortBy(array, criteria) {
    try {
      if (!Array.isArray(array)) return [];
      
      const sortCriteria = Array.isArray(criteria) ? criteria : [criteria];
      
      return [...array].sort((a, b) => {
        for (const criterion of sortCriteria) {
          const { key, direction = 'asc', type = 'auto' } = 
            typeof criterion === 'string' ? { key: criterion } : criterion;
          
          let aVal = typeof key === 'function' ? key(a) : a[key];
          let bVal = typeof key === 'function' ? key(b) : b[key];
          
          // Type conversion
          if (type === 'number') {
            aVal = parseFloat(aVal) || 0;
            bVal = parseFloat(bVal) || 0;
          } else if (type === 'date') {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
          }
          
          let comparison = 0;
          if (aVal > bVal) comparison = 1;
          if (aVal < bVal) comparison = -1;
          
          if (comparison !== 0) {
            return direction === 'desc' ? -comparison : comparison;
          }
        }
        return 0;
      });
    } catch (error) {
      return array || [];
    }
  }

  /**
   * Filter array with multiple conditions
   */
  static filter(array, filters) {
    try {
      if (!Array.isArray(array)) return [];
      
      return array.filter(item => {
        return Object.entries(filters).every(([key, condition]) => {
          const value = item[key];
          
          if (typeof condition === 'function') {
            return condition(value, item);
          }
          
          if (typeof condition === 'object') {
            const { operator = 'eq', value: condValue } = condition;
            
            switch (operator) {
              case 'eq': return value === condValue;
              case 'ne': return value !== condValue;
              case 'gt': return value > condValue;
              case 'gte': return value >= condValue;
              case 'lt': return value < condValue;
              case 'lte': return value <= condValue;
              case 'in': return Array.isArray(condValue) && condValue.includes(value);
              case 'nin': return Array.isArray(condValue) && !condValue.includes(value);
              case 'contains': return String(value).toLowerCase().includes(String(condValue).toLowerCase());
              case 'startsWith': return String(value).toLowerCase().startsWith(String(condValue).toLowerCase());
              case 'endsWith': return String(value).toLowerCase().endsWith(String(condValue).toLowerCase());
              default: return value === condValue;
            }
          }
          
          return value === condition;
        });
      });
    } catch (error) {
      return array || [];
    }
  }

  /**
   * Convert array to tree structure
   */
  static arrayToTree(array, options = {}) {
    try {
      if (!Array.isArray(array)) return [];
      
      const {
        idField = 'id',
        parentField = 'parentId',
        childrenField = 'children',
        rootValue = null
      } = options;
      
      const map = new Map();
      const roots = [];
      
      // Create map for quick lookup
      array.forEach(item => {
        map.set(item[idField], { ...item, [childrenField]: [] });
      });
      
      // Build tree structure
      array.forEach(item => {
        const node = map.get(item[idField]);
        const parentId = item[parentField];
        
        if (parentId === rootValue || !map.has(parentId)) {
          roots.push(node);
        } else {
          const parent = map.get(parentId);
          parent[childrenField].push(node);
        }
      });
      
      return roots;
    } catch (error) {
      return [];
    }
  }

  /**
   * Flatten tree structure to array
   */
  static treeToArray(tree, options = {}) {
    try {
      if (!Array.isArray(tree)) return [];
      
      const { childrenField = 'children', includeChildren = false } = options;
      const result = [];
      
      const traverse = (nodes, parent = null) => {
        nodes.forEach(node => {
          const item = { ...node };
          
          if (!includeChildren) {
            delete item[childrenField];
          }
          
          result.push(item);
          
          if (node[childrenField] && Array.isArray(node[childrenField])) {
            traverse(node[childrenField], node);
          }
        });
      };
      
      traverse(tree);
      return result;
    } catch (error) {
      return [];
    }
  }

  /**
   * Deep merge objects
   */
  static mergeDeep(target, ...sources) {
    try {
      if (!sources.length) return target;
      
      const source = sources.shift();
      
      if (this.isObject(target) && this.isObject(source)) {
        for (const key in source) {
          if (this.isObject(source[key])) {
            if (!target[key]) Object.assign(target, { [key]: {} });
            this.mergeDeep(target[key], source[key]);
          } else {
            Object.assign(target, { [key]: source[key] });
          }
        }
      }
      
      return this.mergeDeep(target, ...sources);
    } catch (error) {
      return target || {};
    }
  }

  /**
   * Check if value is object
   */
  static isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * Remove empty values from object
   */
  static removeEmpty(obj, options = {}) {
    try {
      const { removeNull = true, removeUndefined = true, removeEmptyStrings = true, removeEmptyArrays = true } = options;
      
      const cleaned = {};
      
      for (const [key, value] of Object.entries(obj)) {
        if (removeNull && value === null) continue;
        if (removeUndefined && value === undefined) continue;
        if (removeEmptyStrings && value === '') continue;
        if (removeEmptyArrays && Array.isArray(value) && value.length === 0) continue;
        
        if (this.isObject(value)) {
          const nestedCleaned = this.removeEmpty(value, options);
          if (Object.keys(nestedCleaned).length > 0) {
            cleaned[key] = nestedCleaned;
          }
        } else {
          cleaned[key] = value;
        }
      }
      
      return cleaned;
    } catch (error) {
      return obj || {};
    }
  }
}

/**
 * URL and Query Parameter Transformations
 */
class URLTransformer {
  /**
   * Parse query string to object
   */
  static parseQuery(queryString) {
    try {
      const params = new URLSearchParams(queryString);
      const result = {};
      
      for (const [key, value] of params.entries()) {
        // Handle array values (key[]=value1&key[]=value2)
        if (key.endsWith('[]')) {
          const arrayKey = key.slice(0, -2);
          if (!result[arrayKey]) result[arrayKey] = [];
          result[arrayKey].push(value);
        } else {
          result[key] = value;
        }
      }
      
      return result;
    } catch (error) {
      return {};
    }
  }

  /**
   * Convert object to query string
   */
  static buildQuery(params, options = {}) {
    try {
      const { encodeValues = true, arrayFormat = 'brackets' } = options;
      const searchParams = new URLSearchParams();
      
      const addParam = (key, value) => {
        const finalValue = encodeValues ? encodeURIComponent(value) : value;
        searchParams.append(key, finalValue);
      };
      
      for (const [key, value] of Object.entries(params)) {
        if (Array.isArray(value)) {
          value.forEach(item => {
            const arrayKey = arrayFormat === 'brackets' ? `${key}[]` : key;
            addParam(arrayKey, item);
          });
        } else if (value !== null && value !== undefined) {
          addParam(key, value);
        }
      }
      
      return searchParams.toString();
    } catch (error) {
      return '';
    }
  }

  /**
   * Normalize URL
   */
  static normalizeURL(url, options = {}) {
    try {
      if (!url) return '';
      
      const { addProtocol = true, removeTrailingSlash = true, toLowerCase = true } = options;
      
      let normalizedURL = String(url);
      
      // Add protocol if missing
      if (addProtocol && !normalizedURL.match(/^https?:\/\//)) {
        normalizedURL = 'https://' + normalizedURL;
      }
      
      // Convert to URL object for normalization
      const urlObj = new URL(normalizedURL);
      
      if (toLowerCase) {
        urlObj.hostname = urlObj.hostname.toLowerCase();
      }
      
      let result = urlObj.toString();
      
      if (removeTrailingSlash && result.endsWith('/') && result !== urlObj.origin + '/') {
        result = result.slice(0, -1);
      }
      
      return result;
    } catch (error) {
      return url || '';
    }
  }

  /**
   * Extract domain from URL
   */
  static extractDomain(url, includeSubdomain = false) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      if (includeSubdomain) {
        return hostname;
      }
      
      // Remove subdomain (keep last two parts)
      const parts = hostname.split('.');
      if (parts.length > 2) {
        return parts.slice(-2).join('.');
      }
      
      return hostname;
    } catch (error) {
      return '';
    }
  }
}

/**
 * Main Data Transformer Class
 */
class DataTransformer {
  static DateTime = DateTimeTransformer;
  static Number = NumberTransformer;
  static Text = TextTransformer;
  static DataStructure = DataStructureTransformer;
  static URL = URLTransformer;

  /**
   * Transform data based on schema
   */
  static transform(data, schema) {
    try {
      if (!data || !schema) return data;
      
      if (Array.isArray(data)) {
        return data.map(item => this.transformObject(item, schema));
      } else if (typeof data === 'object') {
        return this.transformObject(data, schema);
      }
      
      return data;
    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.JAVASCRIPT_ERROR,
          'Data transformation failed',
          { data, schema, error }
        )
      );
      return data;
    }
  }

  /**
   * Transform single object based on schema
   */
  static transformObject(obj, schema) {
    const result = {};
    
    for (const [key, transformer] of Object.entries(schema)) {
      try {
        if (typeof transformer === 'function') {
          result[key] = transformer(obj[key], obj);
        } else if (typeof transformer === 'object') {
          const { type, format, options = {}, defaultValue } = transformer;
          const value = obj[key] !== undefined ? obj[key] : defaultValue;
          
          switch (type) {
            case 'date':
              result[key] = DateTimeTransformer.formatDate(value, format);
              break;
            case 'number':
              result[key] = NumberTransformer.formatNumber(value, options);
              break;
            case 'currency':
              result[key] = NumberTransformer.formatCurrency(value, options.currency, options.locale, options);
              break;
            case 'text':
              result[key] = TextTransformer.toCase(value, format);
              break;
            case 'truncate':
              result[key] = TextTransformer.truncate(value, options.maxLength, options.suffix);
              break;
            default:
              result[key] = value;
          }
        } else {
          result[key] = obj[key];
        }
      } catch (error) {
        result[key] = obj[key];
      }
    }
    
    return result;
  }

  /**
   * Create reusable transformer function
   */
  static createTransformer(schema) {
    return (data) => this.transform(data, schema);
  }

  /**
   * Validate and transform data
   */
  static validateAndTransform(data, validationSchema, transformationSchema) {
    try {
      // First validate the data (you could integrate with your ValidationService here)
      // Then transform
      return this.transform(data, transformationSchema);
    } catch (error) {
      errorHandlingService.handleError(
        errorHandlingService.createError(
          ERROR_TYPES.VALIDATION_ERROR,
          'Data validation and transformation failed',
          { data, validationSchema, transformationSchema, error }
        )
      );
      return data;
    }
  }
}

export default DataTransformer;
export {
  DateTimeTransformer,
  NumberTransformer,
  TextTransformer,
  DataStructureTransformer,
  URLTransformer
};