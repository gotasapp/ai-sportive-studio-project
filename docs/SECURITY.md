# Security Documentation

This document outlines the security measures implemented in the CHZ Fantoken Studio project and provides guidelines for secure production deployment.

## Table of Contents

1. [Security Overview](#security-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [API Security](#api-security)
4. [Smart Contract Security](#smart-contract-security)
5. [Data Protection](#data-protection)
6. [Infrastructure Security](#infrastructure-security)
7. [Environment Security](#environment-security)
8. [Monitoring & Logging](#monitoring--logging)
9. [Incident Response](#incident-response)
10. [Security Checklist](#security-checklist)

## Security Overview

The project implements a multi-layered security approach covering:
- **Frontend Security**: Input validation, XSS protection, secure routing
- **Backend Security**: API rate limiting, authentication, authorization
- **Blockchain Security**: Wallet integration, contract permissions, transaction validation
- **Infrastructure Security**: Environment isolation, secure deployments
- **Data Security**: Encryption, secure storage, privacy protection

## Authentication & Authorization

### 1. Wallet-Based Authentication

#### Implementation
```typescript
// Secure wallet signature verification
export async function verifyWalletSignature(
  address: string,
  signature: string,
  message: string
): Promise<boolean> {
  try {
    const recoveredAddress = verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
    
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}
```

#### Security Features
- **Message Signing**: Uses EIP-191 standard message signing
- **Replay Protection**: Includes timestamp and nonce in signed messages
- **Address Verification**: Ensures signature matches claimed wallet address
- **Session Management**: Secure session tokens with expiration

### 2. Role-Based Access Control (RBAC)

#### User Roles
```typescript
enum UserRole {
  USER = 'user',           // Basic user permissions
  CREATOR = 'creator',     // Can create collections
  MODERATOR = 'moderator', // Can moderate content
  ADMIN = 'admin'          // Full system access
}
```

#### Permission Matrix
| Feature | User | Creator | Moderator | Admin |
|---------|------|---------|-----------|-------|
| View Content | ✅ | ✅ | ✅ | ✅ |
| Create NFTs | ✅ | ✅ | ✅ | ✅ |
| Create Collections | ❌ | ✅ | ✅ | ✅ |
| Moderate Content | ❌ | ❌ | ✅ | ✅ |
| Admin Dashboard | ❌ | ❌ | ❌ | ✅ |
| System Settings | ❌ | ❌ | ❌ | ✅ |

#### Admin Protection
```typescript
// Multi-layer admin verification
export function isAdmin(request: NextRequest): boolean {
  const adminHeader = request.headers.get('x-user-admin');
  const adminWallet = request.headers.get('x-user-wallet');
  
  return adminHeader === 'true' && 
         ADMIN_WALLETS.includes(adminWallet?.toLowerCase() || '');
}
```

## API Security

### 1. Input Validation & Sanitization

#### Request Validation
```typescript
// Comprehensive input validation
export function validateGenerateRequest(body: any): ValidationResult {
  const schema = z.object({
    prompt: z.string()
      .min(1, 'Prompt required')
      .max(500, 'Prompt too long')
      .refine(val => !containsXSS(val), 'Invalid characters'),
    teamName: z.string()
      .min(1, 'Team name required')
      .regex(/^[a-zA-Z\s-]+$/, 'Invalid team name format'),
    playerName: z.string()
      .optional()
      .refine(val => !val || !containsXSS(val), 'Invalid characters'),
    playerNumber: z.string()
      .optional()
      .regex(/^\d{1,2}$/, 'Invalid player number')
  });

  return schema.safeParse(body);
}
```

#### XSS Protection
```typescript
// HTML sanitization for user input
import DOMPurify from 'dompurify';

export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}

// Content Security Policy headers
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;
```

### 2. Rate Limiting

#### API Rate Limits
```typescript
// Rate limiting configuration
const rateLimits = {
  '/api/generate': { requests: 10, window: '1h' },
  '/api/upload': { requests: 50, window: '1h' },
  '/api/mint': { requests: 20, window: '1h' },
  '/api/marketplace/*': { requests: 100, window: '1h' },
  default: { requests: 60, window: '1h' }
};

// Rate limit implementation
export async function rateLimit(
  identifier: string, 
  endpoint: string
): Promise<boolean> {
  const limit = rateLimits[endpoint] || rateLimits.default;
  const key = `ratelimit:${identifier}:${endpoint}`;
  
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, 3600); // 1 hour
  }
  
  return current <= limit.requests;
}
```

#### DDoS Protection
- **Cloudflare Integration**: DDoS protection and traffic filtering
- **Request Throttling**: Per-IP request limiting
- **Resource Limits**: Memory and CPU usage monitoring
- **Graceful Degradation**: Service continues with reduced functionality

### 3. CORS Configuration

```typescript
// Secure CORS setup
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com', 'https://www.yourdomain.com']
    : ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-wallet'],
  credentials: true,
  maxAge: 86400 // 24 hours
};
```

## Smart Contract Security

### 1. Contract Access Controls

#### Ownership Pattern
```solidity
// OpenZeppelin Ownable implementation
contract NFTContract is ERC721, Ownable {
    modifier onlyMinter() {
        require(hasRole(MINTER_ROLE, msg.sender), "Not authorized to mint");
        _;
    }
    
    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Admin only");
        _;
    }
}
```

#### Role-Based Permissions
```solidity
// Access control roles
bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

// Role assignment (admin only)
function grantMinterRole(address account) external onlyAdmin {
    grantRole(MINTER_ROLE, account);
}
```

### 2. Reentrancy Protection

```solidity
// ReentrancyGuard usage
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Marketplace is ReentrancyGuard {
    function buyNFT(uint256 listingId) external payable nonReentrant {
        // Safe execution with reentrancy protection
        _executeTransfer(listingId);
    }
}
```

### 3. Input Validation

```solidity
// Comprehensive input validation
function createListing(
    address nftContract,
    uint256 tokenId,
    uint256 price
) external {
    require(nftContract != address(0), "Invalid contract");
    require(price > 0, "Price must be positive");
    require(
        IERC721(nftContract).ownerOf(tokenId) == msg.sender,
        "Not token owner"
    );
    require(
        IERC721(nftContract).isApprovedForAll(msg.sender, address(this)),
        "Contract not approved"
    );
    
    _createListing(nftContract, tokenId, price);
}
```

### 4. Economic Security

#### Slippage Protection
```solidity
// Price slippage protection
function buyWithSlippage(
    uint256 listingId,
    uint256 maxPrice
) external payable {
    Listing memory listing = listings[listingId];
    require(listing.price <= maxPrice, "Price too high");
    
    _executePurchase(listingId);
}
```

#### MEV Protection
- **Private Mempool**: Sensitive transactions through private pools
- **Commit-Reveal**: For auction mechanisms
- **Time Locks**: Delays for critical operations

## Data Protection

### 1. Personal Data Handling

#### Data Classification
- **Public Data**: NFT metadata, marketplace listings
- **Sensitive Data**: User profiles, email addresses
- **Critical Data**: Private keys, API keys, signatures

#### Privacy Controls
```typescript
// User data anonymization
export function anonymizeUserData(userData: UserProfile): PublicProfile {
  return {
    wallet: userData.wallet,
    displayName: userData.displayName || 'Anonymous',
    avatar: userData.avatar,
    // Remove sensitive data
    // email, phone, etc. excluded
  };
}
```

### 2. Data Encryption

#### At Rest
```typescript
// Environment variable encryption
const crypto = require('crypto');

function encryptSensitiveData(data: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}
```

#### In Transit
- **HTTPS Everywhere**: All API communications encrypted
- **TLS 1.3**: Latest encryption standards
- **Certificate Pinning**: Prevent man-in-the-middle attacks

### 3. Database Security

#### MongoDB Security
```typescript
// Secure database connection
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true,
  sslValidate: true,
  authSource: 'admin',
  retryWrites: true,
  // Connection encryption
  tlsCAFile: path.join(__dirname, 'certs/ca-certificate.crt'),
};
```

#### Query Security
```typescript
// NoSQL injection prevention
export function sanitizeMongoQuery(query: any): any {
  return JSON.parse(JSON.stringify(query).replace(/\$where|\$ne|\$gt|\$lt/g, ''));
}

// Parameterized queries
const safeQuery = {
  owner: { $eq: userWallet },
  status: { $eq: 'active' }
};
```

## Infrastructure Security

### 1. Deployment Security

#### Vercel Configuration
```typescript
// Security headers in vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

#### Render Configuration
```yaml
# render.yaml security settings
services:
  - type: web
    name: chz-backend
    runtime: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: TRUST_PROXY
        value: true
    healthCheckPath: /health
    autoDeploy: false # Manual deployment for security review
```

### 2. Network Security

#### Firewall Rules
```bash
# Only allow necessary ports
- Port 80/443: HTTPS traffic
- Port 22: SSH (admin only, key-based auth)
- All other ports: Blocked

# IP Allowlisting for admin functions
ADMIN_IP_ALLOWLIST=[
  "203.0.113.0/24",  # Office network
  "198.51.100.0/24"  # VPN network
]
```

#### SSL/TLS Configuration
- **SSL Certificate**: Let's Encrypt or commercial CA
- **HSTS Headers**: Strict transport security
- **Certificate Transparency**: Monitoring for rogue certificates

## Environment Security

### 1. Secret Management

#### Environment Variables
```bash
# Production environment variables
NODE_ENV=production
TRUST_PROXY=true

# Encrypted secrets (never in plain text)
MONGODB_URI=mongodb+srv://encrypted_connection_string
THIRDWEB_SECRET_KEY=encrypted_api_key
OPENAI_API_KEY=encrypted_openai_key

# Rotation schedule
API_KEY_ROTATION_DAYS=90
SECRET_ROTATION_DAYS=180
```

#### Key Rotation
```typescript
// Automated key rotation
export async function rotateAPIKeys(): Promise<void> {
  const services = ['openai', 'cloudinary', 'thirdweb'];
  
  for (const service of services) {
    const lastRotation = await getLastRotation(service);
    const daysSince = Math.floor((Date.now() - lastRotation) / (1000 * 60 * 60 * 24));
    
    if (daysSince >= 90) {
      await rotateServiceKey(service);
      await updateRotationLog(service, Date.now());
    }
  }
}
```

### 2. Wallet Security

#### Backend Wallet Protection
```typescript
// Secure wallet management
export class SecureWalletManager {
  private static instance: SecureWalletManager;
  private wallet: PrivateKeyWallet;
  
  private constructor() {
    // Initialize with encrypted private key
    const encryptedKey = process.env.BACKEND_WALLET_PRIVATE_KEY_ENCRYPTED;
    const decryptedKey = this.decryptPrivateKey(encryptedKey);
    this.wallet = new PrivateKeyWallet(decryptedKey);
  }
  
  public static getInstance(): SecureWalletManager {
    if (!SecureWalletManager.instance) {
      SecureWalletManager.instance = new SecureWalletManager();
    }
    return SecureWalletManager.instance;
  }
  
  private decryptPrivateKey(encrypted: string): string {
    // Decrypt using hardware security module or secure enclave
    return decrypt(encrypted, process.env.WALLET_ENCRYPTION_KEY);
  }
}
```

#### Multi-Signature Setup
```typescript
// Multi-sig wallet for critical operations
const multiSigConfig = {
  owners: [
    '0xOwner1Address',
    '0xOwner2Address', 
    '0xOwner3Address'
  ],
  threshold: 2, // 2 of 3 signatures required
  criticalOperations: [
    'contract-upgrade',
    'admin-role-change',
    'emergency-pause'
  ]
};
```

## Monitoring & Logging

### 1. Security Monitoring

#### Intrusion Detection
```typescript
// Security event monitoring
export class SecurityMonitor {
  static async logSecurityEvent(event: SecurityEvent): Promise<void> {
    const timestamp = new Date().toISOString();
    
    // Log to secure audit trail
    await auditLogger.log({
      timestamp,
      type: event.type,
      severity: event.severity,
      source: event.source,
      details: event.details,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent
    });
    
    // Alert on critical events
    if (event.severity === 'critical') {
      await sendSecurityAlert(event);
    }
  }
}
```

#### Suspicious Activity Detection
```typescript
// Pattern-based threat detection
const suspiciousPatterns = {
  rapidRequests: { threshold: 100, window: 60000 }, // 100 requests per minute
  failedAuth: { threshold: 5, window: 300000 },     // 5 failures in 5 minutes
  largeUploads: { threshold: 50 * 1024 * 1024 },   // 50MB uploads
  unusualGeo: { allowedCountries: ['US', 'BR', 'EU'] }
};

export async function detectSuspiciousActivity(
  request: SecurityRequest
): Promise<ThreatLevel> {
  // Implement detection logic
  return analyzeThreatLevel(request);
}
```

### 2. Audit Logging

#### Comprehensive Logging
```typescript
// Security audit log structure
interface AuditLog {
  timestamp: string;
  eventType: 'auth' | 'admin' | 'transaction' | 'data_access';
  userId?: string;
  wallet?: string;
  action: string;
  resource: string;
  outcome: 'success' | 'failure' | 'blocked';
  ipAddress: string;
  userAgent: string;
  additionalData?: Record<string, any>;
}

// Critical event logging
export async function logCriticalEvent(
  action: string,
  details: any
): Promise<void> {
  await auditLogger.critical({
    action,
    details,
    timestamp: new Date().toISOString(),
    severity: 'critical'
  });
  
  // Immediate alert for critical events
  await alertSecurityTeam({
    level: 'critical',
    action,
    timestamp: new Date()
  });
}
```

## Incident Response

### 1. Incident Classification

#### Severity Levels
- **Critical**: Data breach, system compromise, fund loss
- **High**: Service disruption, unauthorized access attempt
- **Medium**: Performance issues, minor security events
- **Low**: Routine security alerts, maintenance events

### 2. Response Procedures

#### Incident Response Plan
```typescript
// Automated incident response
export class IncidentResponse {
  static async handleSecurityIncident(incident: SecurityIncident): Promise<void> {
    // 1. Immediate containment
    if (incident.severity === 'critical') {
      await this.emergencyShutdown();
    }
    
    // 2. Assessment
    const assessment = await this.assessThreat(incident);
    
    // 3. Notification
    await this.notifyStakeholders(incident, assessment);
    
    // 4. Mitigation
    await this.implementMitigation(incident);
    
    // 5. Recovery
    await this.recoverServices(incident);
    
    // 6. Post-incident review
    await this.schedulePostIncidentReview(incident);
  }
  
  private static async emergencyShutdown(): Promise<void> {
    // Pause smart contracts
    // Block API access
    // Isolate affected systems
  }
}
```

#### Emergency Contacts
```typescript
const emergencyContacts = {
  securityTeam: 'security@company.com',
  devOps: 'devops@company.com',
  legal: 'legal@company.com',
  management: 'exec@company.com'
};

const escalationMatrix = {
  critical: ['securityTeam', 'devOps', 'management'],
  high: ['securityTeam', 'devOps'],
  medium: ['securityTeam'],
  low: ['devOps']
};
```

## Security Checklist

### Pre-Deployment Checklist

#### Code Security
- [ ] Input validation on all endpoints
- [ ] XSS protection implemented
- [ ] SQL/NoSQL injection prevention
- [ ] Authentication & authorization in place
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers set
- [ ] Error handling without information leakage

#### Infrastructure Security
- [ ] HTTPS enforced everywhere
- [ ] SSL certificates valid and up-to-date
- [ ] Firewall rules configured
- [ ] Admin access restricted
- [ ] Backup systems secured
- [ ] Monitoring and alerting active
- [ ] Incident response plan ready

#### Smart Contract Security
- [ ] Access controls implemented
- [ ] Reentrancy protection in place
- [ ] Input validation on all functions
- [ ] Economic attack vectors considered
- [ ] Upgrade mechanisms secured
- [ ] Emergency pause functionality
- [ ] Multi-signature for critical operations

#### Data Security
- [ ] Sensitive data encrypted
- [ ] Personal data anonymized where possible
- [ ] Database access restricted
- [ ] API keys rotated regularly
- [ ] Secure backup procedures
- [ ] Data retention policies defined

### Ongoing Security Maintenance

#### Monthly Tasks
- [ ] Review access logs
- [ ] Update dependencies
- [ ] Rotate API keys
- [ ] Security patch updates
- [ ] Backup verification
- [ ] Incident response drill

#### Quarterly Tasks
- [ ] Security audit
- [ ] Penetration testing
- [ ] Access review
- [ ] Emergency procedure updates
- [ ] Security training
- [ ] Compliance review

---

**Emergency Contact**: For security incidents, contact security@company.com immediately.

**Last Updated**: [Current Date]
**Next Review**: [90 days from last update]
