/**
 * 📡 Simple Connection State Manager
 */

class ConnectionState {
  constructor() {
    this.components = new Map();
    this.isOnline = typeof window !== 'undefined' ? navigator.onLine : true;
    this.listeners = new Map();
    
    // Only add event listeners on client side
    if (typeof window !== 'undefined') {
      // Listen for network changes
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.emit('network', { online: true });
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.emit('network', { online: false });
      });
    }
    
    console.log('📡 Connection State initialized');
  }
  
  register(componentId, config = {}) {
    this.components.set(componentId, {
      id: componentId,
      connected: false,
      lastActivity: Date.now(),
      errors: 0,
      ...config
    });
    console.log(`📡 Registered: ${componentId}`);
  }
  
  update(componentId, data) {
    const component = this.components.get(componentId);
    if (component) {
      Object.assign(component, data, { lastActivity: Date.now() });
      this.emit('update', { componentId, data: component });
    }
  }
  
  recordError(componentId, error) {
    const component = this.components.get(componentId);
    if (component) {
      component.errors++;
      component.lastError = error.message || error;
      console.log(`📡 Error recorded for ${componentId}:`, component.lastError);
      this.emit('error', { componentId, error });
    }
  }
  
  getHealth() {
    const total = this.components.size;
    const connected = Array.from(this.components.values()).filter(c => c.connected).length;
    return {
      total,
      connected,
      healthScore: total > 0 ? Math.round((connected / total) * 100) : 100,
      isOnline: this.isOnline
    };
  }
  
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }
  
  off(event, callback) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) listeners.splice(index, 1);
    }
  }
  
  emit(event, data) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in connection state listener:`, error);
        }
      });
    }
  }
}

const connectionState = new ConnectionState();

if (typeof window !== 'undefined') {
  window.connectionState = connectionState;
}

export default connectionState;