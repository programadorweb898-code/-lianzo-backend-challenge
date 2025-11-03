import request from 'supertest';
import express, { Application, Request } from 'express';
import routes from '../../routes/index';
import * as jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { AppDataSource } from '../../config/data-source';
import { User } from '../../entities/User';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

const app: Application = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api', routes);

const mockUserRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
};

jest.mock('../../config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity) => {
      if (entity === User) {
        return mockUserRepository;
      }
      return {}; 
    }),
  },
}));

process.env.JWT_SECRET = 'test_jwt_secret';

describe('User Routes Integration Tests', () => {
  let token: string;

  beforeAll(() => {
    token = jwt.sign({ userId: 'test-user-id' }, process.env.JWT_SECRET!, { expiresIn: '1h' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /users', () => {
    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/api/users');
      expect(res.statusCode).toEqual(401);
    });

    it('should return a list of users', async () => {
      const users = [{ id: '1', name: 'User 1' }];
      mockUserRepository.find.mockResolvedValue(users);

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(users);
    });
  });

  describe('GET /users/:id', () => {
    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/api/users/1');
      expect(res.statusCode).toEqual(401);
    });

    it('should return a single user by id', async () => {
      const user = { id: '1', name: 'User 1' };
      mockUserRepository.findOne.mockResolvedValue(user);

      const res = await request(app)
        .get('/api/users/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(user);
    });

    it('should return 404 if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/users/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(404);
    });
  });
});