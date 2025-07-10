/**
 * SISTEMA DE MONITORAMENTO DE PRODUÇÃO
 * 
 * Este sistema monitora a saúde da aplicação em produção
 * e garante que nunca falhe completamente
 */

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  error?: string;
  timestamp: number;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'down';
  services: HealthCheck[];
  uptime: number;
  lastCheck: number;
}

class ProductionMonitor {
  private healthChecks: HealthCheck[] = [];
  private startTime = Date.now();
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring() {
    // Verificar saúde a cada 30 segundos
    this.checkInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000);

    // Verificação inicial
    this.performHealthChecks();
  }

  private async performHealthChecks() {
    const checks: Promise<HealthCheck>[] = [
      this.checkThirdweb(),
      this.checkMongoDB(),
      this.checkIPFS(),
      this.checkMarketplace()
    ];

    try {
      const results = await Promise.allSettled(checks);
      this.healthChecks = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            service: ['thirdweb', 'mongodb', 'ipfs', 'marketplace'][index],
            status: 'down' as const,
            responseTime: -1,
            error: result.reason?.message || 'Unknown error',
            timestamp: Date.now()
          };
        }
      });
    } catch (error) {
      console.error('❌ Health check failed:', error);
    }
  }

  private async checkThirdweb(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Timeout de 5 segundos para Thirdweb
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/debug-thirdweb', {
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        return {
          service: 'thirdweb',
          status: data.success ? 'healthy' : 'degraded',
          responseTime,
          error: data.success ? undefined : data.error,
          timestamp: Date.now()
        };
      } else {
        return {
          service: 'thirdweb',
          status: 'down',
          responseTime,
          error: `HTTP ${response.status}`,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      return {
        service: 'thirdweb',
        status: 'down',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  private async checkMongoDB(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch('/api/jerseys/minted?limit=1', {
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return {
          service: 'mongodb',
          status: 'healthy',
          responseTime,
          timestamp: Date.now()
        };
      } else {
        return {
          service: 'mongodb',
          status: 'down',
          responseTime,
          error: `HTTP ${response.status}`,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      return {
        service: 'mongodb',
        status: 'down',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  private async checkIPFS(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Testar um gateway IPFS
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://ipfs.io/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG', {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      return {
        service: 'ipfs',
        status: response.ok ? 'healthy' : 'degraded',
        responseTime,
        error: response.ok ? undefined : `HTTP ${response.status}`,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        service: 'ipfs',
        status: 'down',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  private async checkMarketplace(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      // Simular uma verificação do marketplace
      const response = await fetch('/api/marketplace/health', {
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      return {
        service: 'marketplace',
        status: response.ok ? 'healthy' : 'degraded',
        responseTime,
        error: response.ok ? undefined : `HTTP ${response.status}`,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        service: 'marketplace',
        status: 'down',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  public getSystemHealth(): SystemHealth {
    const healthyServices = this.healthChecks.filter(check => check.status === 'healthy').length;
    const totalServices = this.healthChecks.length;
    
    let overallStatus: 'healthy' | 'degraded' | 'down';
    
    if (healthyServices === totalServices) {
      overallStatus = 'healthy';
    } else if (healthyServices > totalServices / 2) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'down';
    }

    return {
      overall: overallStatus,
      services: this.healthChecks,
      uptime: Date.now() - this.startTime,
      lastCheck: Math.max(...this.healthChecks.map(check => check.timestamp))
    };
  }

  public getServiceStatus(serviceName: string): HealthCheck | null {
    return this.healthChecks.find(check => check.service === serviceName) || null;
  }

  public isServiceHealthy(serviceName: string): boolean {
    const service = this.getServiceStatus(serviceName);
    return service?.status === 'healthy';
  }

  public destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// Singleton instance
let monitorInstance: ProductionMonitor | null = null;

export function getProductionMonitor(): ProductionMonitor {
  if (!monitorInstance) {
    monitorInstance = new ProductionMonitor();
  }
  return monitorInstance;
}

export function destroyProductionMonitor() {
  if (monitorInstance) {
    monitorInstance.destroy();
    monitorInstance = null;
  }
}

// Hook para React
export function useProductionMonitor() {
  const monitor = getProductionMonitor();
  
  return {
    getSystemHealth: () => monitor.getSystemHealth(),
    getServiceStatus: (service: string) => monitor.getServiceStatus(service),
    isServiceHealthy: (service: string) => monitor.isServiceHealthy(service)
  };
}

// Utilitários para logs
export function logProductionError(error: Error, context: string) {
  console.error(`🚨 PRODUCTION ERROR [${context}]:`, {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
    url: typeof window !== 'undefined' ? window.location.href : 'Server'
  });
}

export function logProductionWarning(message: string, context: string) {
  console.warn(`⚠️ PRODUCTION WARNING [${context}]:`, {
    message,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : 'Server'
  });
}

export function logProductionInfo(message: string, context: string) {
  console.info(`ℹ️ PRODUCTION INFO [${context}]:`, {
    message,
    timestamp: new Date().toISOString()
  });
} 