import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';

import schema from '../../schemas/cms-blocks.schema.json';
import { ApiError } from '../../utils/apiError';
import { AllBlockTypes } from './types';

type SchemaDefinitions = typeof schema.definitions;

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// Add the main schema with all definitions to ajv first
// This makes the definitions available for $ref resolution
ajv.addSchema(schema);

// Create wrapper schemas that reference the main schema's definitions
const blockSchemaMap: Partial<Record<AllBlockTypes, Record<string, unknown>>> = {
  sections: {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $ref: `${schema.$id}#/definitions/LandingSectionContent`,
  },
  'cta-blocks': {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $ref: `${schema.$id}#/definitions/CtaBlockContent`,
  },
  'pricing-tiers': {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $ref: `${schema.$id}#/definitions/PricingTierContent`,
  },
  testimonials: {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $ref: `${schema.$id}#/definitions/TestimonialContent`,
  },
  'remote-copy': {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $ref: `${schema.$id}#/definitions/RemoteCopyEntry`,
  },
};

const validators: Partial<Record<AllBlockTypes, ValidateFunction>> = {};

Object.entries(blockSchemaMap).forEach(([key, wrapperSchema]) => {
  if (wrapperSchema) {
    // Compile wrapper schemas that reference the main schema
    // This allows nested $ref resolution to work correctly
    validators[key as AllBlockTypes] = ajv.compile(wrapperSchema);
  }
});

export function assertBlockSchema(blockType: AllBlockTypes, payload: unknown): void {
  const validator = validators[blockType];

  if (!validator) {
    return;
  }

  const isValid = validator(payload ?? {});
  if (!isValid) {
    throw new ApiError(400, `Invalid ${blockType} payload: ${ajv.errorsText(validator.errors)}`);
  }
}

