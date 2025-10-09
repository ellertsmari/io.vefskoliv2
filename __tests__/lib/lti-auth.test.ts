import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { LTIClaims } from '../../app/lib/lti-config';

// Mock jose before importing lti-auth
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
  importJWK: jest.fn(),
  createRemoteJWKSet: jest.fn(() => jest.fn()),
  SignJWT: jest.fn(),
  importPKCS8: jest.fn(),
}));

// Import after mocking
import { validateLTIToken, extractUserInfo, extractContextInfo, extractGradingInfo, LTIAuthError } from '../../app/lib/lti-auth';

// Get the mocked functions
import * as jose from 'jose';

describe('LTI Authentication', () => {
  const mockJwtVerify = jose.jwtVerify as jest.MockedFunction<typeof jose.jwtVerify>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env.LTI_ISSUER = 'https://canvas.instructure.com';
    process.env.LTI_CLIENT_ID = 'test-client-id';
    process.env.LTI_DEPLOYMENT_ID = 'test-deployment-id';
    process.env.LTI_KEY_SET_URL = 'https://canvas.instructure.com/api/lti/security/jwks';
    process.env.LTI_TOOL_PRIVATE_KEY = 'test-private-key';
    process.env.LTI_TOOL_PUBLIC_KEY = 'test-public-key';
  });

  describe('validateLTIToken', () => {
    it('should validate a valid LTI token', async () => {
      const mockClaims: Partial<LTIClaims> = {
        iss: 'https://canvas.instructure.com',
        aud: 'test-client-id',
        sub: 'user-123',
        'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiResourceLinkRequest',
        'https://purl.imsglobal.org/spec/lti/claim/version': '1.3.0',
        'https://purl.imsglobal.org/spec/lti/claim/deployment_id': 'test-deployment-id',
      };

      mockJwtVerify.mockResolvedValue({
        payload: mockClaims,
        protectedHeader: { alg: 'RS256' },
      } as any);

      const result = await validateLTIToken('test-token');

      expect(result).toEqual(mockClaims);
      expect(mockJwtVerify).toHaveBeenCalledWith(
        'test-token',
        expect.any(Function),
        expect.objectContaining({
          issuer: 'https://canvas.instructure.com',
          audience: 'test-client-id',
        })
      );
    });

    it('should throw error when message_type is missing', async () => {
      const mockClaims: Partial<LTIClaims> = {
        iss: 'https://canvas.instructure.com',
        aud: 'test-client-id',
        sub: 'user-123',
        'https://purl.imsglobal.org/spec/lti/claim/version': '1.3.0',
        'https://purl.imsglobal.org/spec/lti/claim/deployment_id': 'test-deployment-id',
      };

      mockJwtVerify.mockResolvedValue({
        payload: mockClaims,
        protectedHeader: { alg: 'RS256' },
      } as any);

      await expect(validateLTIToken('test-token')).rejects.toThrow(LTIAuthError);
      await expect(validateLTIToken('test-token')).rejects.toThrow('Missing message_type claim');
    });

    it('should throw error when version is missing', async () => {
      const mockClaims: Partial<LTIClaims> = {
        iss: 'https://canvas.instructure.com',
        aud: 'test-client-id',
        sub: 'user-123',
        'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiResourceLinkRequest',
        'https://purl.imsglobal.org/spec/lti/claim/deployment_id': 'test-deployment-id',
      };

      mockJwtVerify.mockResolvedValue({
        payload: mockClaims,
        protectedHeader: { alg: 'RS256' },
      } as any);

      await expect(validateLTIToken('test-token')).rejects.toThrow(LTIAuthError);
      await expect(validateLTIToken('test-token')).rejects.toThrow('Missing version claim');
    });

    it('should throw error when deployment_id is invalid', async () => {
      const mockClaims: Partial<LTIClaims> = {
        iss: 'https://canvas.instructure.com',
        aud: 'test-client-id',
        sub: 'user-123',
        'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiResourceLinkRequest',
        'https://purl.imsglobal.org/spec/lti/claim/version': '1.3.0',
        'https://purl.imsglobal.org/spec/lti/claim/deployment_id': 'wrong-deployment-id',
      };

      mockJwtVerify.mockResolvedValue({
        payload: mockClaims,
        protectedHeader: { alg: 'RS256' },
      } as any);

      await expect(validateLTIToken('test-token')).rejects.toThrow(LTIAuthError);
      await expect(validateLTIToken('test-token')).rejects.toThrow('Invalid deployment ID');
    });
  });

  describe('extractUserInfo', () => {
    it('should extract user information from claims', () => {
      const claims = {
        sub: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        given_name: 'John',
        family_name: 'Doe',
        picture: 'https://example.com/avatar.jpg',
        'https://purl.imsglobal.org/spec/lti/claim/roles': [
          'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner',
        ],
      } as LTIClaims;

      const userInfo = extractUserInfo(claims);

      expect(userInfo).toEqual({
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        givenName: 'John',
        familyName: 'Doe',
        picture: 'https://example.com/avatar.jpg',
        roles: ['http://purl.imsglobal.org/vocab/lis/v2/membership#Learner'],
      });
    });

    it('should use given_name as fallback when name is missing', () => {
      const claims = {
        sub: 'user-123',
        given_name: 'John',
        email: 'john@example.com',
        'https://purl.imsglobal.org/spec/lti/claim/roles': [],
      } as unknown as LTIClaims;

      const userInfo = extractUserInfo(claims);

      expect(userInfo.name).toBe('John');
    });

    it('should create local email when email is missing', () => {
      const claims = {
        sub: 'user-123',
        name: 'John Doe',
        'https://purl.imsglobal.org/spec/lti/claim/roles': [],
      } as unknown as LTIClaims;

      const userInfo = extractUserInfo(claims);

      expect(userInfo.email).toBe('user-123@lti.local');
    });
  });

  describe('extractContextInfo', () => {
    it('should extract context information from claims', () => {
      const claims = {
        'https://purl.imsglobal.org/spec/lti/claim/context': {
          id: 'course-123',
          title: 'Introduction to Programming',
          label: 'CS101',
        },
        'https://purl.imsglobal.org/spec/lti/claim/resource_link': {
          id: 'link-456',
          title: 'Assignment 1',
          description: 'First coding assignment',
        },
      } as LTIClaims;

      const contextInfo = extractContextInfo(claims);

      expect(contextInfo).toEqual({
        contextId: 'course-123',
        contextTitle: 'Introduction to Programming',
        contextLabel: 'CS101',
        resourceLinkId: 'link-456',
        resourceLinkTitle: 'Assignment 1',
        resourceLinkDescription: 'First coding assignment',
      });
    });

    it('should handle missing context data', () => {
      const claims = {
        'https://purl.imsglobal.org/spec/lti/claim/resource_link': {
          id: 'link-456',
        },
      } as LTIClaims;

      const contextInfo = extractContextInfo(claims);

      expect(contextInfo.contextId).toBeUndefined();
      expect(contextInfo.resourceLinkId).toBe('link-456');
    });
  });

  describe('extractGradingInfo', () => {
    it('should extract grading information when present', () => {
      const claims = {
        'https://purl.imsglobal.org/spec/lti-ags/claim/endpoint': {
          scope: [
            'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem',
            'https://purl.imsglobal.org/spec/lti-ags/scope/score',
          ],
          lineitems: 'https://canvas.instructure.com/api/lti/courses/1/line_items',
          lineitem: 'https://canvas.instructure.com/api/lti/courses/1/line_items/1',
        },
      } as LTIClaims;

      const gradingInfo = extractGradingInfo(claims);

      expect(gradingInfo).toEqual({
        hasGrading: true,
        lineitemsUrl: 'https://canvas.instructure.com/api/lti/courses/1/line_items',
        lineitemUrl: 'https://canvas.instructure.com/api/lti/courses/1/line_items/1',
        scopes: [
          'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem',
          'https://purl.imsglobal.org/spec/lti-ags/scope/score',
        ],
      });
    });

    it('should indicate no grading when endpoint is missing', () => {
      const claims = {} as LTIClaims;

      const gradingInfo = extractGradingInfo(claims);

      expect(gradingInfo).toEqual({
        hasGrading: false,
        lineitemsUrl: undefined,
        lineitemUrl: undefined,
        scopes: [],
      });
    });
  });
});
