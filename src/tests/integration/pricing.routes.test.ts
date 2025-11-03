import request from 'supertest';
import express, { Application, Request } from 'express';
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

process.env.JWT_SECRET = 'test_jwt_secret';

describe('Pricing Routes Integration Tests', () => {
  let token: string;

  beforeAll(() => {
    token = jwt.sign({ userId: 'test-user-id' }, process.env.JWT_SECRET!, { expiresIn: '1h' });
  });

  describe('GET /pricing', () => {
    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/pricing');
      expect(res.statusCode).toEqual(401);
    });

    it('should return a list of pricing plans', async () => {
      const res = await request(app)
        .get('/pricing')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBe(3);
      expect(res.body[0].id).toBe('startup');
    });
  });

  describe('POST /pricing/select', () => {
    it('should return 401 if no token is provided', async () => {
      const res = await request(app).post('/pricing/select').send({ planId: 'startup' });
      expect(res.statusCode).toEqual(401);
    });

    it('should return a success message for a valid planId', async () => {
      const res = await request(app)
        .post('/pricing/select')
        .set('Authorization', `Bearer ${token}`)
        .send({ planId: 'business' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({ message: 'Plan seleccionado exitosamente: business' });
    });

    it('should return 400 if planId is missing', async () => {
      const res = await request(app)
        .post('/pricing/select')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ message: 'El planId es requerido' });
    });

    it('should return 404 if planId does not exist', async () => {
      const res = await request(app)
        .post('/pricing/select')
        .set('Authorization', `Bearer ${token}`)
        .send({ planId: 'non-existent-plan' });

      expect(res.statusCode).toEqual(404);
      expect(res.body).toEqual({ message: 'Plan no encontrado' });
    });
  });
});