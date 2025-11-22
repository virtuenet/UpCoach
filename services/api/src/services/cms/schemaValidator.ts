import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';

import schema from '../../schemas/cms-blocks.schema.json';
import { ApiError } from '../../utils/apiError';
import { AllBlockTypes } from './types';

type SchemaDefinitions = typeof schema.definitions;

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const blockSchemaMap: Partial<Record<AllBlockTypes, unknown>> = {
  sections: schema.definitions?.LandingSectionContent,
  'cta-blocks': schema.definitions?.CtaBlockContent,
  'pricing-tiers': schema.definitions?.PricingTierContent,
  testimonials: schema.definitions?.TestimonialContent,
  'remote-copy': schema.definitions?.RemoteCopyEntry,
};

const validators: Partial<Record<AllBlockTypes, ValidateFunction>> = {};

Object.entries(blockSchemaMap).forEach(([key, definition]) => {
  if (definition) {
    validators[key as AllBlockTypes] = ajv.compile(definition as Record<string, unknown>);
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

