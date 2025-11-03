import { Request, Response } from 'express';
import { register, login, refresh, logout, getProfile } from '../../controllers/auth.controller';
import { AppDataSource } from '../../config/data-source';
import { User } from '../../entities/User';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

const mockSave = jest.fn();
const mockFindOne = jest.fn();
const mockCreate = jest.fn();

jest.mock('../../config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => ({
      save: mockSave,
      findOne: mockFindOne,
      create: mockCreate,
    })),
  },
}));

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(() => Promise.resolve('mockSalt')),
  hash: jest.fn(() => Promise.resolve('mockHashedPassword')),
  compare: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mockAccessToken'),
  verify: jest.fn(() => ({ userId: 'mockUserId' })),
}));

process.env.JWT_SECRET = 'test_jwt_secret';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret';

describe('Auth Controller Unit Tests', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let statusSpy: jest.Mock;
  let jsonSpy: jest.Mock;
  let cookieSpy: jest.Mock;
  let clearCookieSpy: jest.Mock;
  let sendSpy: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {};
    
    mockResponse = {
      statusCode: 200,
      status: jest.fn(function(this: Response, code: number) {
        (mockResponse as any).statusCode = code;
        return mockResponse;
      }),
      json: jest.fn(function(this: Response, body?: any) { return mockResponse; }),
      cookie: jest.fn(function(this: Response, name: string, val: string, options?: any) { return mockResponse; }),
      clearCookie: jest.fn(function(this: Response, name: string, options?: any) { return mockResponse; }),
      send: jest.fn(function(this: Response, body?: any) { return mockResponse; }),
    } as Partial<Response>;

    statusSpy = mockResponse.status as jest.Mock;
    jsonSpy = mockResponse.json as jest.Mock;
    cookieSpy = mockResponse.cookie as jest.Mock;
    clearCookieSpy = mockResponse.clearCookie as jest.Mock;
    sendSpy = mockResponse.send as jest.Mock;
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockRequest.body = { nombre: 'Test User', email: 'test@example.com', password: 'Password123' };
      mockFindOne.mockResolvedValue(undefined);
      mockCreate.mockReturnValue({ id: 'newUserId', nombre: 'Test User', email: 'test@example.com' });
      mockSave.mockResolvedValue(true);

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockFindOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 'mockSalt');
      expect(mockCreate).toHaveBeenCalledWith({
        nombre: 'Test User',
        email: 'test@example.com',
        password: 'mockHashedPassword',
      });
      expect(mockSave).toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(jsonSpy).toHaveBeenCalledWith({ message: 'Usuario creado exitosamente' });
    });

    it('should return 400 if user already exists', async () => {
      mockRequest.body = { nombre: 'Test User', email: 'existing@example.com', password: 'Password123' };
      mockFindOne.mockResolvedValue({ id: 'existingUserId' });

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockFindOne).toHaveBeenCalledWith({ where: { email: 'existing@example.com' } });
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({ message: 'El email ya está en uso' });
    });
  });

  describe('login', () => {
    it('should log in a user successfully and return tokens', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'Password123' };
      const mockUser = { id: 'userId123', email: 'test@example.com', password: 'mockHashedPassword', refreshToken: undefined };
      mockFindOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValueOnce('mockAccessToken').mockReturnValueOnce('mockRefreshToken');
      mockSave.mockResolvedValue(true);

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockFindOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(bcrypt.compare).toHaveBeenCalledWith('Password123', 'mockHashedPassword');
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(mockUser.refreshToken).toBe('mockRefreshToken');
      expect(mockSave).toHaveBeenCalledWith(mockUser);
      expect(cookieSpy).toHaveBeenCalledWith('refreshToken', 'mockRefreshToken', expect.any(Object));
      expect(jsonSpy).toHaveBeenCalledWith({ accessToken: 'mockAccessToken' });
    });

    it('should return 400 for invalid credentials (user not found)', async () => {
      mockRequest.body = { email: 'nonexistent@example.com', password: 'Password123' };
      mockFindOne.mockResolvedValue(undefined);

      await login(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({ message: 'Credenciales inválidas' });
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      mockRequest.cookies = { refreshToken: 'oldRefreshToken' };
      const mockUser = { id: 'userId123', refreshToken: 'oldRefreshToken' };
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'userId123' });
      mockFindOne.mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValueOnce('newAccessToken').mockReturnValueOnce('newRefreshToken');
      mockSave.mockResolvedValue(true);

      await refresh(mockRequest as Request, mockResponse as Response);

      expect(jwt.verify).toHaveBeenCalledWith('oldRefreshToken', process.env.JWT_REFRESH_SECRET);
      expect(mockFindOne).toHaveBeenCalledWith({ where: { id: 'userId123' } });
      expect(mockUser.refreshToken).toBe('newRefreshToken');
      expect(mockSave).toHaveBeenCalledWith(mockUser);
      expect(cookieSpy).toHaveBeenCalledWith('refreshToken', 'newRefreshToken', expect.any(Object));
      expect(jsonSpy).toHaveBeenCalledWith({ accessToken: 'newAccessToken' });
    });
  });

  describe('logout', () => {
    it('should log out a user successfully', async () => {
      mockRequest.cookies = { refreshToken: 'validRefreshToken' };
      const mockUser = { id: 'userId123', refreshToken: 'validRefreshToken' };
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'userId123' });
      mockFindOne.mockResolvedValue(mockUser);
      mockSave.mockResolvedValue(true);

      await logout(mockRequest as Request, mockResponse as Response);

      expect(jwt.verify).toHaveBeenCalledWith('validRefreshToken', process.env.JWT_REFRESH_SECRET);
      expect(mockFindOne).toHaveBeenCalledWith({ where: { id: 'userId123' } });
      expect(mockUser.refreshToken).toBeUndefined();
      expect(mockSave).toHaveBeenCalledWith(mockUser);
      expect(clearCookieSpy).toHaveBeenCalledWith('refreshToken', expect.any(Object));
      expect(sendSpy).toHaveBeenCalledWith();
      expect(statusSpy).toHaveBeenCalledWith(204);
    });
  });

  describe('getProfile', () => {
    it('✅ should return user profile if authenticated', async () => {
      const mockUser = {
        id: 'authenticatedUserId',
        nombre: 'Auth User',
        email: 'auth@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.user = { userId: mockUser.id };
      mockFindOne.mockResolvedValue(mockUser);

      await getProfile(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(AppDataSource.getRepository).toHaveBeenCalledWith(User);
      expect(mockFindOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: ['id', 'nombre', 'email', 'createdAt', 'updatedAt'],
      });
      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
        id: mockUser.id,
        nombre: mockUser.nombre,
        email: mockUser.email,
      }));
    });

    it('🚫 should return 401 if user is not authenticated', async () => {
      mockRequest.user = undefined;

      await getProfile(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(401);
      expect(jsonSpy).toHaveBeenCalledWith({
        message: 'No autorizado: Usuario no autenticado',
      });
    });

    it('🔍 should return 404 if user not found in DB', async () => {
      mockRequest.user = { userId: 'nonExistentUser' };
      mockFindOne.mockResolvedValue(undefined);

      await getProfile(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({
        message: 'Usuario no encontrado',
      });
    });

    it('💥 should return 500 if DB throws error', async () => {
      mockRequest.user = { userId: 'errorUser' };
      mockFindOne.mockRejectedValue(new Error('DB error'));

      await getProfile(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        message: 'Error interno del servidor',
      });
    });
  });
});
