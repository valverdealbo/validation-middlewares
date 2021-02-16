/* eslint-disable import/no-extraneous-dependencies,@typescript-eslint/no-explicit-any */
import Ajv from 'ajv';
import { json, Request, Response, NextFunction, RequestHandler } from 'express';
import type { OptionsJson } from 'body-parser';
import { BadRequestError, UnsupportedMediaTypeError } from '@valbo/http-errors';

export function validateSchema<SchemaId extends string>(ajv: Ajv, schemaId: SchemaId, data: unknown): void {
  ajv.validate(schemaId, data);
  if (ajv.errors === undefined || ajv.errors === null) {
    return;
  }
  throw new BadRequestError(ajv.errorsText(ajv.errors, { dataVar: '' }));
}

export type ValidateSchema<SchemaId extends string> = (ajv: Ajv, schemaId: SchemaId, data: unknown) => void;

export function createParseJsonBodyMiddleware(options?: OptionsJson): RequestHandler {
  const bodyParser = json(options);
  return function parseJsonBodyMiddleware(request: Request, response: Response, next: NextFunction): void {
    if (request.headers['content-type'] !== undefined && request.headers['content-type'].includes('application/json')) {
      bodyParser(request, response, (error: any) => {
        if (error === undefined) {
          next();
        } else {
          next(new BadRequestError(error.message));
        }
      });
    } else {
      next(new UnsupportedMediaTypeError('missing request header Content-Type: application/json'));
    }
  };
}

export function configureValidateMiddleware<SchemaId extends string>(ajv: Ajv): (schemaId: SchemaId) => RequestHandler {
  return function createValidateMiddleware(schemaId: SchemaId): RequestHandler {
    return function validateSchemaMiddleware(request: Request, response: Response, next: NextFunction): void {
      validateSchema(ajv, schemaId, request.body);
      next();
    };
  };
}

export type CreateValidateMiddleware<SchemaId extends string> = (schemaId: SchemaId) => RequestHandler;
