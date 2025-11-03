import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'gomito7',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'challenge',
  synchronize: true,
  logging: true,
  entities: ["src/entities/**/*.ts"],
});