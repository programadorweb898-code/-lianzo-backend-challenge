import { Request, Response } from 'express';
import { getUsers, getUserById } from '../../controllers/user.controller';
import { AppDataSource } from '../../config/data-source';
import { User } from '../../entities/User';

const mockFind = jest.fn();
const mockFindOne = jest.fn();

jest.mock('../../config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => ({
      find: mockFind,
      findOne: mockFindOne,
    })),
  },
}));

describe('User Controller Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonSpy: jest.Mock;
  let statusSpy: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jsonSpy = jest.fn();
    statusSpy = jest.fn(() => ({ json: jsonSpy }));
    mockRequest = {};
    mockResponse = { status: statusSpy };
  });

  describe('getUsers', () => {
    it('should return a list of users', async () => {
      const users = [{ id: '1', name: 'User 1' }];
      mockFind.mockResolvedValue(users);

      await getUsers(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith(users);
      expect(mockFind).toHaveBeenCalledWith({ select: ['id', 'nombre', 'email', 'createdAt', 'updatedAt'] });
    });
  });

  describe('getUserById', () => {
    it('should return a single user by id', async () => {
      const user = { id: '1', name: 'User 1' };
      mockRequest.params = { id: '1' };
      mockFindOne.mockResolvedValue(user);

      await getUserById(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith(user);
      expect(mockFindOne).toHaveBeenCalledWith({ where: { id: '1' }, select: ['id', 'nombre', 'email', 'createdAt', 'updatedAt'] });
    });

    it('should return 404 if user not found', async () => {
      mockRequest.params = { id: '1' };
      mockFindOne.mockResolvedValue(null);

      await getUserById(mockRequest as Request, mockResponse as Response);

      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({ message: 'Usuario no encontrado' });
    });
  });
});
