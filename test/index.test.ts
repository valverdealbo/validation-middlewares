/* eslint-disable import/no-extraneous-dependencies */
import Ajv from 'ajv';
import express, { json, ErrorRequestHandler, RequestHandler } from 'express';
import supertest from 'supertest';
import { InternalServerErrorError } from '@valbo/http-errors';
import { validateSchema, createParseJsonBodyMiddleware, configureValidateMiddleware } from '../src';

const schema = {
  type: 'object',
  properties: { name: { type: 'string' } },
  required: ['name'],
  additionalProperties: false,
};
const ajv = new Ajv();
ajv.addSchema(schema, 'schema');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sendError: ErrorRequestHandler = (error, request, response, next) => {
  const httpError = {
    status: error.status || 500,
    name: error.name || InternalServerErrorError.name,
    message: error.message || '',
  };
  response.status(httpError.status).json({ error: httpError });
};

const sendEmpty: RequestHandler = (request, response) => {
  response.json({});
};

describe('validateSchema()', () => {
  test('should return when the data is valid', () => {
    expect(() => validateSchema(ajv, 'schema', { name: 'bob' })).not.toThrow();
  });

  test('should throw a bad request error when the data is invalid', () => {
    expect(() => validateSchema(ajv, 'schema', { username: 'bob' })).toThrow();
  });
});

describe('createParseJsonBodyMiddleware()', () => {
  const app = express()
    .use(createParseJsonBodyMiddleware({ limit: '1Mb' }))
    .use(sendEmpty)
    .use(sendError);

  test('should next an unsupported media type error when the content-type header is missing', async () => {
    const response = await supertest(app).post('/');
    expect(response.status).toBe(415);
  });

  test('should next an unsupported media type error when the content-type header value is not application/json', async () => {
    const response = await supertest(app).post('/').type('html');
    expect(response.status).toBe(415);
  });

  test('should next a bad request error when body parser cannot parse the request body', async () => {
    const response = await supertest(app).post('/').type('json').send('jldjlka}sds');
    expect(response.status).toBe(400);
  });

  test('should next when the request body is a valid json', async () => {
    const response = await supertest(app).post('/').send({ name: 'bob' });
    expect(response.status).toBe(200);
  });
});

describe('configureValidateMiddleware()', () => {
  const validate = configureValidateMiddleware(ajv);
  const app = express().use(json()).use(validate('schema')).use(sendEmpty).use(sendError);

  test('should next a bad request error when the schema validation fails', async () => {
    const response = await supertest(app).post('/').send({ username: 'bob' });
    expect(response.status).toBe(400);
  });

  test('should next when the request is valid', async () => {
    const response = await supertest(app).post('/').send({ name: 'bob' });
    expect(response.status).toBe(200);
  });
});
