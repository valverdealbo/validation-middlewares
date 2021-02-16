# @valbo/validation-middlewares

Express middlewares to validate JSON request bodies.

![npm (scoped)](https://img.shields.io/npm/v/@valbo/validation-middlewares)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
![Build Status](https://img.shields.io/github/workflow/status/valverdealbo/validation-middlewares/CI)
[![Coverage Status](https://coveralls.io/repos/github/valverdealbo/validation-middlewares/badge.svg?branch=main)](https://coveralls.io/github/valverdealbo/validation-middlewares?branch=main)
[![Known Vulnerabilities](https://snyk.io/test/github/valverdealbo/validation-middlewares/badge.svg?targetFile=package.json)](https://snyk.io/test/github/valverdealbo/validation-middlewares?targetFile=package.json)

## Install

```bash
npm install @valbo/validation-middlewares
```

## Usage

This package exports functions to validate data against JSON Schemas using [Ajv](https://www.npmjs.com/package/ajv).

`validateSchema<SchemaId extends string>(ajv: Ajv, schemaId: SchemaId, data: unknown): void`

Validates some data against a JSON Schema loaded in an Ajv instance. The function is generic, so you can specify which schema ids are valid. It will throw a **400 BadRequestError** if the data is invalid.

`createParseJsonBodyMiddleware(options?: OptionsJson): RequestHandler`

A wrapper around the [body-parser](https://github.com/expressjs/body-parser) [json()](https://github.com/expressjs/body-parser#bodyparserjsonoptions) function. It returns a middleware that checks if the request has a **Content-Type: application/json** header and then parses the request body as a JSON.

The middleware throws a **415 Unsupported Media Type** error if the header is missing, and a **400 Bad Request Error** if it cannot parse the body. 

`configureValidateMiddleware<SchemaId extends string>(ajv: Ajv): (schemaId: Schema) => RequestHandler`

It receives an Ajv instance configured with all the required JSON schemas and returns a function that receives the id of the JSON schema to use for validation. That returned function then returns a middleware that validates the request body against the provided schema.

The middleware throws a **400 Bad Request Error** if the validation fails. 

## Example

```typescript
import express from 'express';
import Ajv from 'ajv';
import { createParseJsonBodyMiddleware, configureValidateMiddleware, CreateValidateMiddleware } from '@valbo/validation-middlewares';

const parseBody = createParseBody({ limit: '1Mb' });

const findUserSchema = {
  type: 'object',
  properties: { username: { type: 'string' } },
  required: ['username'],
  additionalProperties: false,
};

const ajv = new Ajv();
ajv.addSchema(schema, 'findUserRequest')

type SchemaIds = 'findUserRequest';

const validateMiddleware: CreateValidateMiddleware<SchemaIds> = configureValidateMiddleware<SchemasIds>(ajv);

const app = express()
  .use(parseBody)
  .use('/users/find', validateMiddleware('findUserRequest'));
```
