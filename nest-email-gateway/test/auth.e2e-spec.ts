import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import bcrypt from 'bcrypt';

describe('Auth E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get(DataSource);
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM "user";');
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/login (POST) should login default admin', async () => {
    const password = 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);

    await dataSource.query(`
      INSERT INTO "user" ("email", "passwordHash", "role")
      VALUES ('admin@example.com', '${passwordHash}', 'admin');
    `);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password });

    expect(response.status).toBe(201);
    expect(response.body.access_token).toBeDefined();
  });
});
