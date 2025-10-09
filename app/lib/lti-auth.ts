import { jwtVerify, importJWK, createRemoteJWKSet } from 'jose';
import { LTIClaims, getLTIConfig } from './lti-config';

export class LTIAuthError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'LTIAuthError';
  }
}

export async function validateLTIToken(token: string): Promise<LTIClaims> {
  try {
    const config = getLTIConfig();
    
    // Create remote JWK Set for verifying tokens from Canvas
    const JWKS = createRemoteJWKSet(new URL(config.keySetUrl));
    
    // Verify the JWT token with max age of 5 minutes
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: config.issuer,
      audience: config.clientId,
      maxTokenAge: '5m', // Token must not be older than 5 minutes
      clockTolerance: '30s', // Allow 30 seconds clock skew
    });

    // Validate required LTI claims
    const claims = payload as unknown as LTIClaims;
    
    // Validate iat (issued at) is not in the future
    // jwtVerify already checks exp and iat with clockTolerance, but let's be explicit
    const now = Math.floor(Date.now() / 1000);
    if (claims.iat > now + 30) { // 30 seconds clock skew tolerance
      throw new LTIAuthError('Token issued in the future', 'INVALID_IAT');
    }
    
    if (!claims['https://purl.imsglobal.org/spec/lti/claim/message_type']) {
      throw new LTIAuthError('Missing message_type claim', 'INVALID_MESSAGE_TYPE');
    }
    
    if (!claims['https://purl.imsglobal.org/spec/lti/claim/version']) {
      throw new LTIAuthError('Missing version claim', 'INVALID_VERSION');
    }
    
    if (!claims['https://purl.imsglobal.org/spec/lti/claim/deployment_id']) {
      throw new LTIAuthError('Missing deployment_id claim', 'INVALID_DEPLOYMENT');
    }

    // Validate deployment ID matches our configuration
    const deploymentId = claims['https://purl.imsglobal.org/spec/lti/claim/deployment_id'];
    if (deploymentId !== config.deploymentId) {
      throw new LTIAuthError('Invalid deployment ID', 'INVALID_DEPLOYMENT');
    }
    
    return claims;
  } catch (error) {
    if (error instanceof LTIAuthError) {
      throw error;
    }
    
    console.error('LTI token validation error:', error);
    throw new LTIAuthError('Token validation failed', 'TOKEN_VALIDATION_FAILED');
  }
}

export function extractUserInfo(claims: LTIClaims) {
  return {
    id: claims.sub,
    name: claims.name || claims.given_name || 'Unknown User',
    email: claims.email || `${claims.sub}@lti.local`,
    givenName: claims.given_name,
    familyName: claims.family_name,
    picture: claims.picture,
    roles: claims['https://purl.imsglobal.org/spec/lti/claim/roles'] || [],
  };
}

export function extractContextInfo(claims: LTIClaims) {
  const context = claims['https://purl.imsglobal.org/spec/lti/claim/context'];
  const resourceLink = claims['https://purl.imsglobal.org/spec/lti/claim/resource_link'];
  
  return {
    contextId: context?.id,
    contextTitle: context?.title,
    contextLabel: context?.label,
    resourceLinkId: resourceLink?.id,
    resourceLinkTitle: resourceLink?.title,
    resourceLinkDescription: resourceLink?.description,
  };
}

export function extractGradingInfo(claims: LTIClaims) {
  const ags = claims['https://purl.imsglobal.org/spec/lti-ags/claim/endpoint'];
  
  return {
    hasGrading: !!ags,
    lineitemsUrl: ags?.lineitems,
    lineitemUrl: ags?.lineitem,
    scopes: ags?.scope || [],
  };
}