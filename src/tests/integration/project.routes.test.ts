import request from 'supertest';
import express, { Application, Request } from 'express';
import { AppDataSource } from '../../config/data-source';
import { User } from '../../entities/User';
import { Project } from '../../entities/Project';
import routes from '../../routes/index';
import * as jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

const app: Application = express();
app.use(express.json());
app.use(cookieParser());
app.use(routes);

const mockUserRepository = {
  findOneBy: jest.fn(),
};
const mockProjectRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

jest.mock('../../config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity) => {
      if (entity === User) {
        return mockUserRepository;
      }
      if (entity === Project) {
        return mockProjectRepository;
      }
    }),
  },
}));

process.env.JWT_SECRET = 'test_jwt_secret';

describe('Project Routes Integration Tests', () => {
  let token: string;

  beforeAll(() => {
    token = jwt.sign({ userId: 'test-user-id' }, process.env.JWT_SECRET!, { expiresIn: '1h' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /projects', () => {
    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/projects');
      expect(res.statusCode).toEqual(401);
    });

    it('should return a list of projects for the authenticated user', async () => {
      const projects = [{ id: '1', name: 'Project 1' }];
      mockProjectRepository.find.mockResolvedValue(projects);

      const res = await request(app)
        .get('/projects')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(projects);
      expect(mockProjectRepository.find).toHaveBeenCalledWith({ where: { user: { id: 'test-user-id' } } });
    });
  });

  describe('GET /projects/:id', () => {
    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/projects/1');
      expect(res.statusCode).toEqual(401);
    });

    it('should return a single project if it belongs to the user', async () => {
      const project = { id: '1', name: 'Project 1' };
      mockProjectRepository.findOne.mockResolvedValue(project);

      const res = await request(app)
        .get('/projects/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(project);
      expect(mockProjectRepository.findOne).toHaveBeenCalledWith({ where: { id: '1', user: { id: 'test-user-id' } } });
    });

    it('should return 404 if project not found', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);

      const res = await request(app)
        .get('/projects/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(404);
    });
  });

  describe('POST /projects', () => {
    it('should return 401 if no token is provided', async () => {
      const res = await request(app).post('/projects').send({ name: 'New Project' });
      expect(res.statusCode).toEqual(401);
    });

    it('should create a new project', async () => {
      const user = { id: 'test-user-id', name: 'Test User' };
      const project = { id: '1', name: 'New Project' };
      mockUserRepository.findOneBy.mockResolvedValue(user);
      mockProjectRepository.create.mockReturnValue(project);
      mockProjectRepository.save.mockResolvedValue(project);

      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Project' });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toEqual(project);
      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id: 'test-user-id' });
      expect(mockProjectRepository.create).toHaveBeenCalledWith({ name: 'New Project', description: undefined, user });
      expect(mockProjectRepository.save).toHaveBeenCalledWith(project);
    });
  });

  describe('PATCH /projects/:id', () => {
    it('should return 401 if no token is provided', async () => {
      const res = await request(app).patch('/projects/1').send({ name: 'Updated Project' });
      expect(res.statusCode).toEqual(401);
    });

    it('should update a project', async () => {
      const project = { id: '1', name: 'Old Project', save: jest.fn() };
      mockProjectRepository.findOne.mockResolvedValue(project);
      mockProjectRepository.save.mockResolvedValue({ ...project, name: 'Updated Project' });

      const res = await request(app)
        .patch('/projects/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Project' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toEqual('Updated Project');
      expect(mockProjectRepository.findOne).toHaveBeenCalledWith({ where: { id: '1', user: { id: 'test-user-id' } } });
      expect(mockProjectRepository.save).toHaveBeenCalled();
    });

    it('should return 404 if project not found', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);

      const res = await request(app)
        .patch('/projects/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Project' });

      expect(res.statusCode).toEqual(404);
    });
  });
});