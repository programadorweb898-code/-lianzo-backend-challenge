import request from 'supertest';
import express, { Application, Request } from 'express';
import { AppDataSource } from '../../config/data-source';
import { User } from '../../entities/User';
import authRoutes from '../../routes/auth';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

const mockUserRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

jest.mock('../../config/data-source', () => ({
  AppDataSource: {
    initialize: jest.fn(() => Promise.resolve()),
    getRepository: jest.fn(() => mockUserRepository),
  },
}));

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(() => Promise.resolve('mockSalt')),
  hash: jest.fn(() => Promise.resolve('hashedPassword')),
  compare: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mockAccessToken'),
  verify: jest.fn((token, secret, callback) => {
    if (token === 'validAccessToken' && secret === process.env.JWT_SECRET) {
      callback(null, { userId: 'mockUserId' });
    } else if (token === 'invalidAccessToken') {
      callback(new Error('invalid token'), undefined);
    } else {
      callback(new Error('unknown token'), undefined);
    }
  }),
}));

process.env.JWT_SECRET = 'test_jwt_secret';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret';


const app: Application = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/auth', authRoutes);

describe('Auth Routes Integration Tests', () => {
  beforeAll(async () => {
    await AppDataSource.initialize();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRepository.findOne.mockReset();
    mockUserRepository.create.mockReset();
    mockUserRepository.save.mockReset();
    (bcrypt.genSalt as jest.Mock).mockClear();
    (bcrypt.hash as jest.Mock).mockClear();
    (bcrypt.compare as jest.Mock).mockClear();
    (jwt.sign as jest.Mock).mockClear();
    (jwt.verify as jest.Mock).mockClear();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(undefined);
      const newUserMock = {
        id: 'newUserId',
        nombre: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUserRepository.create.mockReturnValue(newUserMock);
      mockUserRepository.save.mockImplementation((user) => Promise.resolve(user));

      const res = await request(app)
        .post('/auth/register')
        .send({
          nombre: 'Test User',
          email: 'test@example.com',
          password: 'Password123',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toEqual({ message: 'Usuario creado exitosamente' });
      expect(mockUserRepository.save).toHaveBeenCalledWith(newUserMock);
    });

    it('should return 400 if email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: 'existingUserId' });

      const res = await request(app)
        .post('/auth/register')
        .send({
          nombre: 'Test User',
          email: 'existing@example.com',
          password: 'Password123',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ message: 'El email ya está en uso' });
    });

    it('should return 400 for invalid password format', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          nombre: 'Test User',
          email: 'test@example.com',
          password: 'short',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].msg).toContain('La contraseña debe tener entre 8 y 20 caracteres');
    });
  });

  describe('POST /auth/login', () => {
    it('should log in a user successfully and return access token', async () => {
      const mockUser = { id: 'userId123', email: 'test@example.com', password: 'hashedPassword', refreshToken: 'mockRefreshToken' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockUserRepository.save.mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValueOnce('mockAccessToken').mockReturnValueOnce('mockRefreshToken');


      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.headers['set-cookie'][0]).toContain('refreshToken');
    });

    it('should return 400 for invalid credentials', async () => {
      mockUserRepository.findOne.mockResolvedValue(undefined);

      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'WrongPassword',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ message: 'Credenciales inválidas' });
    });
  });

  describe('GET /auth/profile', () => {
    it('should return user profile if authenticated', async () => {
      const mockUser = { id: 'authenticatedUserId', nombre: 'Auth User', email: 'auth@example.com', createdAt: new Date(), updatedAt: new Date() };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      
      mockUserRepository.findOne.mockResolvedValueOnce(mockUser);

      const res = await request(app)
        .get('/auth/profile')
        .set('Authorization', 'Bearer validAccessToken');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(expect.objectContaining({
        id: 'authenticatedUserId',
        nombre: 'Auth User',
        email: 'auth@example.com',
      }));
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'mockUserId' },
        select: ['id', 'nombre', 'email', 'createdAt', 'updatedAt'],
      });
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/auth/profile');

      expect(res.statusCode).toEqual(401);
      expect(res.body).toEqual({ message: 'No autorizado: Token no proporcionado' });
    });

    it('should return 403 if token is invalid', async () => {
      const res = await request(app)
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalidAccessToken');

      expect(res.statusCode).toEqual(403);
      expect(res.body).toEqual({ message: 'No autorizado: Token inválido o expirado' });
    });

    it('should return 404 if user not found in DB', async () => {
      (jwt.verify as jest.Mock).mockImplementationOnce((token, secret, callback) => {
        if (token === 'validAccessToken' && secret === process.env.JWT_SECRET) {
          callback(null, { userId: 'nonExistentUser' });
        } else {
          callback(new Error('unknown token'), undefined);
        }
      });
      mockUserRepository.findOne.mockResolvedValue(undefined);

      const res = await request(app)
        .get('/auth/profile')
        .set('Authorization', 'Bearer validAccessToken');

      expect(res.statusCode).toEqual(404);
      expect(res.body).toEqual({ message: 'Usuario no encontrado' });
    });
  });
});
