export const jwtVerify = jest.fn().mockResolvedValue({
  payload: {},
  protectedHeader: {},
});
export const importJWK = jest.fn().mockResolvedValue({});
export const createRemoteJWKSet = jest.fn(() => jest.fn().mockResolvedValue({}));
export const SignJWT = jest.fn().mockImplementation(() => ({
  setProtectedHeader: jest.fn().mockReturnThis(),
  setIssuedAt: jest.fn().mockReturnThis(),
  setExpirationTime: jest.fn().mockReturnThis(),
  sign: jest.fn().mockResolvedValue('mock-token'),
}));
export const importPKCS8 = jest.fn().mockResolvedValue('mock-key');
