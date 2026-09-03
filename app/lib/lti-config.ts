import { JWK } from 'jose';

export interface LTIConfig {
  issuer: string;
  clientId: string;
  deploymentId: string;
  keySetUrl: string;
  authTokenUrl: string;
  authLoginUrl: string;
  toolPrivateKey: string;
  toolPublicKey: string;
}

export interface LTIClaims {
  iss: string;
  aud: string;
  sub: string;
  exp: number;
  iat: number;
  nonce: string;
  'https://purl.imsglobal.org/spec/lti/claim/message_type': string;
  'https://purl.imsglobal.org/spec/lti/claim/version': string;
  'https://purl.imsglobal.org/spec/lti/claim/deployment_id': string;
  'https://purl.imsglobal.org/spec/lti/claim/target_link_uri': string;
  'https://purl.imsglobal.org/spec/lti/claim/resource_link': {
    id: string;
    title?: string;
    description?: string;
  };
  'https://purl.imsglobal.org/spec/lti/claim/roles': string[];
  'https://purl.imsglobal.org/spec/lti/claim/context'?: {
    id: string;
    label?: string;
    title?: string;
    type?: string[];
  };
  'https://purl.imsglobal.org/spec/lti/claim/tool_platform'?: {
    name?: string;
    contact_email?: string;
    description?: string;
    url?: string;
    product_family_code?: string;
    version?: string;
  };
  'https://purl.imsglobal.org/spec/lti/claim/launch_presentation'?: {
    document_target?: string;
    height?: number;
    width?: number;
    return_url?: string;
    locale?: string;
  };
  'https://purl.imsglobal.org/spec/lti/claim/custom'?: Record<string, string>;
  'https://purl.imsglobal.org/spec/lti-ags/claim/endpoint'?: {
    scope: string[];
    lineitems: string;
    lineitem?: string;
  };
  'https://purl.imsglobal.org/spec/lti-nrps/claim/namesroleservice'?: {
    context_memberships_url: string;
    service_versions: string[];
  };
  'https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings'?: {
    deep_link_return_url: string;
    accept_types: string[];
    accept_presentation_document_targets: string[];
    accept_multiple?: boolean;
    auto_create?: boolean;
    title?: string;
    text?: string;
    data?: string;
  };
  name?: string;
  given_name?: string;
  family_name?: string;
  middle_name?: string;
  picture?: string;
  email?: string;
  locale?: string;
}

export const LTI_ROLES = {
  STUDENT: 'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner',
  TEACHER: 'http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor',
  ADMIN: 'http://purl.imsglobal.org/vocab/lis/v2/membership#Administrator',
} as const;

export const LTI_MESSAGE_TYPES = {
  RESOURCE_LINK_REQUEST: 'LtiResourceLinkRequest',
  DEEP_LINKING_REQUEST: 'LtiDeepLinkingRequest',
  DEEP_LINKING_RESPONSE: 'LtiDeepLinkingResponse',
} as const;

export function getLTIConfig(): LTIConfig {
  const config: LTIConfig = {
    issuer: process.env.LTI_ISSUER || 'https://canvas.instructure.com',
    clientId: process.env.LTI_CLIENT_ID || '',
    deploymentId: process.env.LTI_DEPLOYMENT_ID || '',
    keySetUrl: process.env.LTI_KEY_SET_URL || 'https://canvas.instructure.com/api/lti/security/jwks',
    authTokenUrl: process.env.LTI_AUTH_TOKEN_URL || 'https://canvas.instructure.com/login/oauth2/token',
    authLoginUrl: process.env.LTI_AUTH_LOGIN_URL || 'https://canvas.instructure.com/api/lti/authorize_redirect',
    toolPrivateKey: process.env.LTI_TOOL_PRIVATE_KEY || '',
    toolPublicKey: process.env.LTI_TOOL_PUBLIC_KEY || '',
  };

  if (!config.clientId || !config.toolPrivateKey) {
    throw new Error('LTI configuration incomplete. Check environment variables.');
  }

  return config;
}

/**
 * Map Canvas roles onto this app's two roles. Students are `"user"` here,
 * the same value sign-up writes and every teacher check compares against;
 * any other spelling would be an account that is neither.
 */
export function getUserRoleFromLTI(roles: string[]): 'user' | 'teacher' {
  const hasTeacherRole = roles.some(role => 
    role.includes('Instructor') || 
    role.includes('Teacher') || 
    role.includes('Administrator')
  );
  
  return hasTeacherRole ? 'teacher' : 'user';
}
/**
 * Every OAuth2 scope the tool needs from Canvas, in one place. Requested when
 * minting a service token and advertised in the developer-key config, so the two
 * can never drift apart — a scope granted on the key but not requested (or vice
 * versa) fails at runtime with an opaque 401.
 *
 * The NRPS scope is what lets us read a course roster without every student
 * having launched the tool first. It is the difference between "we can push a
 * grade for students who happened to click through from Canvas" and "we can push
 * a grade for everyone enrolled".
 */
export const LTI_SCOPES = [
  'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem',
  'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem.readonly',
  'https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly',
  'https://purl.imsglobal.org/spec/lti-ags/scope/score',
  'https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly',
] as const;

/**
 * Absolute public origin of this tool, no trailing slash.
 *
 * Canvas fetches the developer-key config and the JWKS from the open internet,
 * so every URL handed to it must be absolute and reachable — a relative path or
 * a localhost origin silently produces a key that can never launch.
 *
 * Deliberately does NOT go through `getLTIConfig()`: the config endpoint has to
 * serve correctly *before* a client ID exists, which is the whole point of
 * handing Canvas admins a URL to paste.
 */
export function getToolBaseUrl(): string {
  const explicit = process.env.LTI_TOOL_URL || process.env.NEXTAUTH_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;

  const raw = explicit || (vercel ? `https://${vercel}` : '');
  if (!raw) {
    throw new Error(
      'Tool base URL not configured. Set LTI_TOOL_URL (or NEXTAUTH_URL) to the ' +
        'public https origin of this deployment.'
    );
  }

  return raw.replace(/\/+$/, '');
}
