import Handlebars from 'handlebars';
import fs from 'fs-extra';
import path from 'path';
import prettier from 'prettier';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import pluralize from 'pluralize';
import {
  camelCase,
  pascalCase,
  snakeCase,
  kebabCase,
  constantCase,
} from 'change-case';
import Joi from 'joi';

interface Field {
  name: string;
  type: string;
  required?: boolean;
  defaultValue?: string;
  description?: string;
}

interface GeneratorOptions {
  name: string;
  fields?: Field[];
  description?: string;
  author?: string;
  outputPath?: string;
  templatePath?: string;
  customTemplate?: string;
}

interface ModelGeneratorOptions extends GeneratorOptions {
  tableName?: string;
  timestamps?: boolean;
  softDelete?: boolean;
  indexes?: string[];
}

interface APIGeneratorOptions extends GeneratorOptions {
  method: string;
  path: string;
  type: 'rest' | 'graphql' | 'trpc';
  middleware?: string[];
  authentication?: boolean;
  validation?: boolean;
}

interface ComponentGeneratorOptions extends GeneratorOptions {
  props?: Field[];
  hooks?: string[];
  stateVariables?: string[];
  materialUI?: boolean;
}

interface TestGeneratorOptions extends GeneratorOptions {
  testType: 'unit' | 'integration' | 'e2e';
  targetFile: string;
  framework?: 'jest' | 'mocha' | 'playwright';
}

class CodeGenerators {
  private templatesPath: string;
  private prettierConfig: prettier.Options;

  constructor(templatesPath?: string) {
    this.templatesPath = templatesPath || path.join(__dirname, '../../templates');
    this.prettierConfig = this.loadPrettierConfig();
    this.registerHandlebarsHelpers();
  }

  private loadPrettierConfig(): prettier.Options {
    const configPath = path.join(process.cwd(), '.prettierrc');

    if (fs.existsSync(configPath)) {
      try {
        return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      } catch (error) {
        console.warn('Failed to load prettier config, using defaults');
      }
    }

    return {
      parser: 'typescript',
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: 'es5',
      printWidth: 100,
    };
  }

  private registerHandlebarsHelpers(): void {
    Handlebars.registerHelper('camelCase', (str: string) => camelCase(str));
    Handlebars.registerHelper('pascalCase', (str: string) => pascalCase(str));
    Handlebars.registerHelper('snakeCase', (str: string) => snakeCase(str));
    Handlebars.registerHelper('kebabCase', (str: string) => kebabCase(str));
    Handlebars.registerHelper('constantCase', (str: string) => constantCase(str));
    Handlebars.registerHelper('pluralize', (str: string) => pluralize(str));
    Handlebars.registerHelper('singular', (str: string) => pluralize.singular(str));

    Handlebars.registerHelper('typeToSequelize', (type: string) => {
      const typeMap: Record<string, string> = {
        string: 'DataTypes.STRING',
        text: 'DataTypes.TEXT',
        number: 'DataTypes.INTEGER',
        float: 'DataTypes.FLOAT',
        boolean: 'DataTypes.BOOLEAN',
        date: 'DataTypes.DATE',
        uuid: 'DataTypes.UUID',
        json: 'DataTypes.JSON',
        array: 'DataTypes.ARRAY',
      };
      return typeMap[type.toLowerCase()] || 'DataTypes.STRING';
    });

    Handlebars.registerHelper('typeToGraphQL', (type: string) => {
      const typeMap: Record<string, string> = {
        string: 'String',
        text: 'String',
        number: 'Int',
        float: 'Float',
        boolean: 'Boolean',
        date: 'DateTime',
        uuid: 'ID',
        json: 'JSON',
        array: '[String]',
      };
      return typeMap[type.toLowerCase()] || 'String';
    });

    Handlebars.registerHelper('typeToJoi', (type: string) => {
      const typeMap: Record<string, string> = {
        string: 'Joi.string()',
        text: 'Joi.string()',
        number: 'Joi.number()',
        float: 'Joi.number()',
        boolean: 'Joi.boolean()',
        date: 'Joi.date()',
        uuid: 'Joi.string().uuid()',
        email: 'Joi.string().email()',
        json: 'Joi.object()',
        array: 'Joi.array()',
      };
      return typeMap[type.toLowerCase()] || 'Joi.string()';
    });

    Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    Handlebars.registerHelper('ne', (a: any, b: any) => a !== b);
    Handlebars.registerHelper('and', (a: any, b: any) => a && b);
    Handlebars.registerHelper('or', (a: any, b: any) => a || b);

    Handlebars.registerHelper('timestamp', () => new Date().toISOString());
    Handlebars.registerHelper('year', () => new Date().getFullYear());
  }

  public async generateModel(options: ModelGeneratorOptions): Promise<string> {
    const schema = Joi.object({
      name: Joi.string().required(),
      tableName: Joi.string().optional(),
      fields: Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          type: Joi.string().required(),
          required: Joi.boolean().optional(),
          defaultValue: Joi.string().optional(),
          description: Joi.string().optional(),
        })
      ).optional(),
      timestamps: Joi.boolean().optional().default(true),
      softDelete: Joi.boolean().optional().default(false),
      indexes: Joi.array().items(Joi.string()).optional(),
    });

    const { error, value } = schema.validate(options);
    if (error) {
      throw new Error(`Invalid options: ${error.message}`);
    }

    const templateData = {
      name: pascalCase(value.name),
      nameLower: camelCase(value.name),
      nameSnake: snakeCase(value.name),
      tableName: value.tableName || snakeCase(pluralize(value.name)),
      fields: value.fields || [],
      timestamps: value.timestamps,
      softDelete: value.softDelete,
      indexes: value.indexes || [],
      author: value.author || 'Unknown',
      timestamp: new Date().toISOString(),
    };

    const templatePath = path.join(this.templatesPath, 'model.hbs');
    const template = await this.loadTemplate(templatePath, this.getDefaultModelTemplate());
    const code = template(templateData);

    const formattedCode = await prettier.format(code, this.prettierConfig);

    const outputPath = value.outputPath || path.join(
      process.cwd(),
      'src/models',
      `${pascalCase(value.name)}.ts`
    );

    await this.writeFile(outputPath, formattedCode);

    await this.generateModelIndex(outputPath);
    await this.generateModelType(value.name, value.fields);

    return outputPath;
  }

  public async generateAPI(options: APIGeneratorOptions): Promise<string> {
    const schema = Joi.object({
      name: Joi.string().required(),
      method: Joi.string().valid('GET', 'POST', 'PUT', 'PATCH', 'DELETE').required(),
      path: Joi.string().required(),
      type: Joi.string().valid('rest', 'graphql', 'trpc').required(),
      middleware: Joi.array().items(Joi.string()).optional(),
      authentication: Joi.boolean().optional().default(true),
      validation: Joi.boolean().optional().default(true),
      fields: Joi.array().optional(),
    });

    const { error, value } = schema.validate(options);
    if (error) {
      throw new Error(`Invalid options: ${error.message}`);
    }

    let templateName: string;
    let outputDir: string;

    switch (value.type) {
      case 'rest':
        templateName = 'api-rest.hbs';
        outputDir = 'src/routes';
        break;
      case 'graphql':
        templateName = 'api-graphql.hbs';
        outputDir = 'src/graphql/resolvers';
        break;
      case 'trpc':
        templateName = 'api-trpc.hbs';
        outputDir = 'src/trpc/routers';
        break;
    }

    const routeName = value.path.split('/').filter(Boolean).join('-');
    const templateData = {
      name: pascalCase(value.name),
      nameLower: camelCase(value.name),
      method: value.method.toUpperCase(),
      path: value.path,
      routeName,
      middleware: value.middleware || [],
      authentication: value.authentication,
      validation: value.validation,
      fields: value.fields || [],
      author: value.author || 'Unknown',
      timestamp: new Date().toISOString(),
    };

    const templatePath = path.join(this.templatesPath, templateName);
    const template = await this.loadTemplate(
      templatePath,
      this.getDefaultAPITemplate(value.type)
    );
    const code = template(templateData);

    const formattedCode = await prettier.format(code, this.prettierConfig);

    const outputPath = value.outputPath || path.join(
      process.cwd(),
      outputDir,
      `${routeName}.ts`
    );

    await this.writeFile(outputPath, formattedCode);

    if (value.validation) {
      await this.generateValidationSchema(value.name, value.fields);
    }

    return outputPath;
  }

  public async generateService(options: GeneratorOptions): Promise<string> {
    const schema = Joi.object({
      name: Joi.string().required(),
      fields: Joi.array().optional(),
    });

    const { error, value } = schema.validate(options);
    if (error) {
      throw new Error(`Invalid options: ${error.message}`);
    }

    const templateData = {
      name: pascalCase(value.name),
      nameLower: camelCase(value.name),
      nameSnake: snakeCase(value.name),
      fields: value.fields || [],
      author: value.author || 'Unknown',
      timestamp: new Date().toISOString(),
    };

    const templatePath = path.join(this.templatesPath, 'service.hbs');
    const template = await this.loadTemplate(templatePath, this.getDefaultServiceTemplate());
    const code = template(templateData);

    const formattedCode = await prettier.format(code, this.prettierConfig);

    const outputPath = value.outputPath || path.join(
      process.cwd(),
      'src/services',
      `${pascalCase(value.name)}Service.ts`
    );

    await this.writeFile(outputPath, formattedCode);

    return outputPath;
  }

  public async generateRepository(options: GeneratorOptions): Promise<string> {
    const schema = Joi.object({
      name: Joi.string().required(),
      fields: Joi.array().optional(),
    });

    const { error, value } = schema.validate(options);
    if (error) {
      throw new Error(`Invalid options: ${error.message}`);
    }

    const templateData = {
      name: pascalCase(value.name),
      nameLower: camelCase(value.name),
      nameSnake: snakeCase(value.name),
      fields: value.fields || [],
      author: value.author || 'Unknown',
      timestamp: new Date().toISOString(),
    };

    const templatePath = path.join(this.templatesPath, 'repository.hbs');
    const template = await this.loadTemplate(templatePath, this.getDefaultRepositoryTemplate());
    const code = template(templateData);

    const formattedCode = await prettier.format(code, this.prettierConfig);

    const outputPath = value.outputPath || path.join(
      process.cwd(),
      'src/repositories',
      `${pascalCase(value.name)}Repository.ts`
    );

    await this.writeFile(outputPath, formattedCode);

    return outputPath;
  }

  public async generateComponent(options: ComponentGeneratorOptions): Promise<string> {
    const schema = Joi.object({
      name: Joi.string().required(),
      props: Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          type: Joi.string().required(),
          required: Joi.boolean().optional(),
          defaultValue: Joi.string().optional(),
        })
      ).optional(),
      hooks: Joi.array().items(Joi.string()).optional(),
      stateVariables: Joi.array().items(Joi.string()).optional(),
      materialUI: Joi.boolean().optional().default(true),
    });

    const { error, value } = schema.validate(options);
    if (error) {
      throw new Error(`Invalid options: ${error.message}`);
    }

    const templateData = {
      name: pascalCase(value.name),
      nameLower: camelCase(value.name),
      props: value.props || [],
      hooks: value.hooks || ['useState', 'useEffect'],
      stateVariables: value.stateVariables || [],
      materialUI: value.materialUI,
      author: value.author || 'Unknown',
      timestamp: new Date().toISOString(),
    };

    const templatePath = path.join(this.templatesPath, 'component.hbs');
    const template = await this.loadTemplate(templatePath, this.getDefaultComponentTemplate());
    const code = template(templateData);

    const formattedCode = await prettier.format(code, this.prettierConfig);

    const outputPath = value.outputPath || path.join(
      process.cwd(),
      'src/components',
      `${pascalCase(value.name)}.tsx`
    );

    await this.writeFile(outputPath, formattedCode);

    await this.generateComponentStorybook(value.name, value.props);

    return outputPath;
  }

  public async generateTest(options: TestGeneratorOptions): Promise<string> {
    const schema = Joi.object({
      name: Joi.string().required(),
      testType: Joi.string().valid('unit', 'integration', 'e2e').required(),
      targetFile: Joi.string().required(),
      framework: Joi.string().valid('jest', 'mocha', 'playwright').optional().default('jest'),
    });

    const { error, value } = schema.validate(options);
    if (error) {
      throw new Error(`Invalid options: ${error.message}`);
    }

    const baseName = path.basename(value.targetFile, path.extname(value.targetFile));
    const importPath = path.relative(
      path.join(path.dirname(value.targetFile), '__tests__'),
      value.targetFile
    ).replace(/\\/g, '/').replace(/\.ts$/, '');

    const templateData = {
      name: pascalCase(baseName),
      nameLower: camelCase(baseName),
      testType: value.testType,
      framework: value.framework,
      importPath: importPath.startsWith('.') ? importPath : `./${importPath}`,
      author: value.author || 'Unknown',
      timestamp: new Date().toISOString(),
    };

    const templatePath = path.join(this.templatesPath, `test-${value.testType}.hbs`);
    const template = await this.loadTemplate(
      templatePath,
      this.getDefaultTestTemplate(value.testType, value.framework)
    );
    const code = template(templateData);

    const formattedCode = await prettier.format(code, this.prettierConfig);

    const outputPath = value.outputPath || path.join(
      path.dirname(value.targetFile),
      '__tests__',
      `${baseName}.${value.testType}.test.ts`
    );

    await this.writeFile(outputPath, formattedCode);

    return outputPath;
  }

  public async generateMigration(name: string, fields?: Field[]): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const migrationName = `${timestamp}-${kebabCase(name)}`;

    const templateData = {
      name: pascalCase(name),
      nameLower: camelCase(name),
      nameSnake: snakeCase(name),
      tableName: snakeCase(pluralize(name)),
      fields: fields || [],
      timestamp: new Date().toISOString(),
    };

    const templatePath = path.join(this.templatesPath, 'migration.hbs');
    const template = await this.loadTemplate(templatePath, this.getDefaultMigrationTemplate());
    const code = template(templateData);

    const formattedCode = await prettier.format(code, this.prettierConfig);

    const outputPath = path.join(
      process.cwd(),
      'migrations',
      `${migrationName}.ts`
    );

    await this.writeFile(outputPath, formattedCode);

    return outputPath;
  }

  public async generateGraphQL(
    type: 'type' | 'query' | 'mutation',
    name: string,
    fields?: Field[]
  ): Promise<string> {
    const templateData = {
      type,
      name: pascalCase(name),
      nameLower: camelCase(name),
      fields: fields || [],
      timestamp: new Date().toISOString(),
    };

    const templatePath = path.join(this.templatesPath, `graphql-${type}.hbs`);
    const template = await this.loadTemplate(templatePath, this.getDefaultGraphQLTemplate(type));
    const code = template(templateData);

    const formattedCode = await prettier.format(code, {
      ...this.prettierConfig,
      parser: 'graphql',
    });

    const outputPath = path.join(
      process.cwd(),
      'src/graphql',
      `${kebabCase(name)}.graphql`
    );

    await this.writeFile(outputPath, formattedCode);

    if (type === 'type') {
      await this.generateGraphQLResolver(name, fields);
    }

    return outputPath;
  }

  public async generateTRPC(name: string, procedures: string[]): Promise<string> {
    const templateData = {
      name: pascalCase(name),
      nameLower: camelCase(name),
      procedures: procedures || [],
      timestamp: new Date().toISOString(),
    };

    const templatePath = path.join(this.templatesPath, 'trpc-router.hbs');
    const template = await this.loadTemplate(templatePath, this.getDefaultTRPCTemplate());
    const code = template(templateData);

    const formattedCode = await prettier.format(code, this.prettierConfig);

    const outputPath = path.join(
      process.cwd(),
      'src/trpc/routers',
      `${camelCase(name)}.ts`
    );

    await this.writeFile(outputPath, formattedCode);

    return outputPath;
  }

  public async generateFactory(name: string, fields?: Field[]): Promise<string> {
    const templateData = {
      name: pascalCase(name),
      nameLower: camelCase(name),
      fields: fields || [],
      timestamp: new Date().toISOString(),
    };

    const templatePath = path.join(this.templatesPath, 'factory.hbs');
    const template = await this.loadTemplate(templatePath, this.getDefaultFactoryTemplate());
    const code = template(templateData);

    const formattedCode = await prettier.format(code, this.prettierConfig);

    const outputPath = path.join(
      process.cwd(),
      'src/tests/factories',
      `${pascalCase(name)}Factory.ts`
    );

    await this.writeFile(outputPath, formattedCode);

    return outputPath;
  }

  public async generateFlutterScreen(name: string, stateful: boolean = true): Promise<string> {
    const templateData = {
      name: pascalCase(name),
      nameLower: camelCase(name),
      nameSnake: snakeCase(name),
      stateful,
      timestamp: new Date().toISOString(),
    };

    const templatePath = path.join(
      this.templatesPath,
      stateful ? 'flutter-screen-stateful.hbs' : 'flutter-screen-stateless.hbs'
    );
    const template = await this.loadTemplate(templatePath, this.getDefaultFlutterScreenTemplate(stateful));
    const code = template(templateData);

    const outputPath = path.join(
      process.cwd(),
      'lib/screens',
      `${snakeCase(name)}_screen.dart`
    );

    await this.writeFile(outputPath, code);

    return outputPath;
  }

  public async generateFromCustomTemplate(
    templatePath: string,
    outputPath: string,
    data: Record<string, any>
  ): Promise<string> {
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = Handlebars.compile(templateSource);
    const code = template(data);

    const formattedCode = await prettier.format(code, this.prettierConfig);

    await this.writeFile(outputPath, formattedCode);

    return outputPath;
  }

  public async injectCodeIntoAST(
    filePath: string,
    injectionPoint: string,
    code: string
  ): Promise<void> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const sourceCode = fs.readFileSync(filePath, 'utf-8');
    const ast = parser.parse(sourceCode, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });

    const codeAst = parser.parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });

    let injected = false;

    traverse(ast, {
      Program(path) {
        if (injectionPoint === 'imports') {
          const lastImport = path.node.body.findIndex(
            (node) => !t.isImportDeclaration(node)
          );
          if (lastImport !== -1) {
            path.node.body.splice(lastImport, 0, ...codeAst.program.body);
            injected = true;
          }
        } else if (injectionPoint === 'exports') {
          path.node.body.push(...codeAst.program.body);
          injected = true;
        }
      },
      ClassDeclaration(path) {
        if (injectionPoint === 'class-methods') {
          path.node.body.body.push(...(codeAst.program.body[0] as any).body.body);
          injected = true;
        }
      },
    });

    if (!injected) {
      throw new Error(`Could not find injection point: ${injectionPoint}`);
    }

    const output = generate(ast, {}, sourceCode);
    const formattedCode = await prettier.format(output.code, this.prettierConfig);

    await this.writeFile(filePath, formattedCode);
  }

  private async loadTemplate(
    templatePath: string,
    defaultTemplate: string
  ): Promise<HandlebarsTemplateDelegate> {
    let templateSource: string;

    if (fs.existsSync(templatePath)) {
      templateSource = fs.readFileSync(templatePath, 'utf-8');
    } else {
      templateSource = defaultTemplate;
    }

    return Handlebars.compile(templateSource);
  }

  private async writeFile(filePath: string, content: string): Promise<void> {
    await fs.ensureFile(filePath);
    await fs.writeFile(filePath, content, 'utf-8');
  }

  private async generateModelIndex(modelPath: string): Promise<void> {
    const indexPath = path.join(path.dirname(modelPath), 'index.ts');
    const modelName = path.basename(modelPath, '.ts');

    let indexContent = '';

    if (fs.existsSync(indexPath)) {
      indexContent = fs.readFileSync(indexPath, 'utf-8');
    }

    const exportStatement = `export { default as ${modelName} } from './${modelName}';\n`;

    if (!indexContent.includes(exportStatement)) {
      indexContent += exportStatement;
      const formattedContent = await prettier.format(indexContent, this.prettierConfig);
      await this.writeFile(indexPath, formattedContent);
    }
  }

  private async generateModelType(name: string, fields?: Field[]): Promise<void> {
    const typePath = path.join(process.cwd(), 'src/types', `${pascalCase(name)}.ts`);

    const typeContent = `
export interface ${pascalCase(name)} {
  id: number;
${(fields || []).map((f) => `  ${f.name}${f.required ? '' : '?'}: ${f.type};`).join('\n')}
  createdAt: Date;
  updatedAt: Date;
}

export interface ${pascalCase(name)}CreateInput {
${(fields || []).map((f) => `  ${f.name}${f.required ? '' : '?'}: ${f.type};`).join('\n')}
}

export interface ${pascalCase(name)}UpdateInput {
${(fields || []).map((f) => `  ${f.name}?: ${f.type};`).join('\n')}
}
`;

    const formattedContent = await prettier.format(typeContent, this.prettierConfig);
    await this.writeFile(typePath, formattedContent);
  }

  private async generateValidationSchema(name: string, fields?: Field[]): Promise<void> {
    const schemaPath = path.join(
      process.cwd(),
      'src/validation',
      `${camelCase(name)}Schema.ts`
    );

    const schemaContent = `
import Joi from 'joi';

export const ${camelCase(name)}CreateSchema = Joi.object({
${(fields || [])
  .map((f) => {
    const joiType = this.fieldTypeToJoi(f.type);
    const required = f.required ? '.required()' : '.optional()';
    return `  ${f.name}: ${joiType}${required},`;
  })
  .join('\n')}
});

export const ${camelCase(name)}UpdateSchema = Joi.object({
${(fields || [])
  .map((f) => {
    const joiType = this.fieldTypeToJoi(f.type);
    return `  ${f.name}: ${joiType}.optional(),`;
  })
  .join('\n')}
});
`;

    const formattedContent = await prettier.format(schemaContent, this.prettierConfig);
    await this.writeFile(schemaPath, formattedContent);
  }

  private async generateGraphQLResolver(name: string, fields?: Field[]): Promise<void> {
    const resolverPath = path.join(
      process.cwd(),
      'src/graphql/resolvers',
      `${camelCase(name)}.ts`
    );

    const resolverContent = `
import { ${pascalCase(name)} } from '../../models';

export const ${camelCase(name)}Resolvers = {
  Query: {
    ${camelCase(name)}: async (_: any, { id }: { id: number }) => {
      return await ${pascalCase(name)}.findByPk(id);
    },
    ${camelCase(pluralize(name))}: async () => {
      return await ${pascalCase(name)}.findAll();
    },
  },
  Mutation: {
    create${pascalCase(name)}: async (_: any, { input }: any) => {
      return await ${pascalCase(name)}.create(input);
    },
    update${pascalCase(name)}: async (_: any, { id, input }: any) => {
      const ${camelCase(name)} = await ${pascalCase(name)}.findByPk(id);
      if (!${camelCase(name)}) throw new Error('Not found');
      return await ${camelCase(name)}.update(input);
    },
    delete${pascalCase(name)}: async (_: any, { id }: { id: number }) => {
      const ${camelCase(name)} = await ${pascalCase(name)}.findByPk(id);
      if (!${camelCase(name)}) throw new Error('Not found');
      await ${camelCase(name)}.destroy();
      return true;
    },
  },
};
`;

    const formattedContent = await prettier.format(resolverContent, this.prettierConfig);
    await this.writeFile(resolverPath, formattedContent);
  }

  private async generateComponentStorybook(name: string, props?: Field[]): Promise<void> {
    const storyPath = path.join(
      process.cwd(),
      'src/components',
      `${pascalCase(name)}.stories.tsx`
    );

    const storyContent = `
import type { Meta, StoryObj } from '@storybook/react';
import ${pascalCase(name)} from './${pascalCase(name)}';

const meta: Meta<typeof ${pascalCase(name)}> = {
  title: 'Components/${pascalCase(name)}',
  component: ${pascalCase(name)},
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ${pascalCase(name)}>;

export const Default: Story = {
  args: {
${(props || []).map((p) => `    ${p.name}: ${p.defaultValue || "''"},`).join('\n')}
  },
};
`;

    const formattedContent = await prettier.format(storyContent, this.prettierConfig);
    await this.writeFile(storyPath, formattedContent);
  }

  private fieldTypeToJoi(type: string): string {
    const typeMap: Record<string, string> = {
      string: 'Joi.string()',
      text: 'Joi.string()',
      number: 'Joi.number()',
      float: 'Joi.number()',
      boolean: 'Joi.boolean()',
      date: 'Joi.date()',
      uuid: 'Joi.string().uuid()',
      email: 'Joi.string().email()',
      json: 'Joi.object()',
      array: 'Joi.array()',
    };
    return typeMap[type.toLowerCase()] || 'Joi.string()';
  }

  private getDefaultModelTemplate(): string {
    return `import { Model, DataTypes, Sequelize } from 'sequelize';

export interface {{pascalCase name}}Attributes {
  id?: number;
{{#each fields}}
  {{name}}{{#unless required}}?{{/unless}}: {{type}};
{{/each}}
  createdAt?: Date;
  updatedAt?: Date;
{{#if softDelete}}
  deletedAt?: Date;
{{/if}}
}

export class {{pascalCase name}} extends Model<{{pascalCase name}}Attributes> implements {{pascalCase name}}Attributes {
  public id!: number;
{{#each fields}}
  public {{name}}!: {{type}};
{{/each}}
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
{{#if softDelete}}
  public readonly deletedAt!: Date;
{{/if}}
}

export const init{{pascalCase name}} = (sequelize: Sequelize): typeof {{pascalCase name}} => {
  {{pascalCase name}}.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
{{#each fields}}
      {{name}}: {
        type: {{typeToSequelize type}},
        allowNull: {{#unless required}}true{{else}}false{{/unless}},
{{#if defaultValue}}
        defaultValue: {{defaultValue}},
{{/if}}
      },
{{/each}}
    },
    {
      sequelize,
      tableName: '{{tableName}}',
      timestamps: {{timestamps}},
{{#if softDelete}}
      paranoid: true,
{{/if}}
{{#if indexes}}
      indexes: [
{{#each indexes}}
        { fields: [{{this}}] },
{{/each}}
      ],
{{/if}}
    }
  );

  return {{pascalCase name}};
};

export default {{pascalCase name}};
`;
  }

  private getDefaultAPITemplate(type: string): string {
    if (type === 'rest') {
      return `import { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
{{#if authentication}}
import { authenticate } from '../middleware/auth';
{{/if}}
{{#if validation}}
import { validate } from '../middleware/validation';
import { {{nameLower}}CreateSchema } from '../validation/{{nameLower}}Schema';
{{/if}}

const router = Router();

router.{{method toLowerCase}}('{{path}}'{{#if authentication}}, authenticate{{/if}}{{#if validation}}, validate({{nameLower}}CreateSchema){{/if}}, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // TODO: Implement {{method}} {{path}}
    res.json({ message: 'Success' });
  } catch (error) {
    next(error);
  }
});

export default router;
`;
    } else if (type === 'graphql') {
      return `export const {{nameLower}}Resolvers = {
  Query: {
    {{nameLower}}: async (_: any, { id }: { id: number }) => {
      // TODO: Implement query
    },
  },
  Mutation: {
    create{{pascalCase name}}: async (_: any, { input }: any) => {
      // TODO: Implement mutation
    },
  },
};
`;
    } else {
      return `import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const {{nameLower}}Router = router({
  {{nameLower}}: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      // TODO: Implement procedure
    }),
});
`;
    }
  }

  private getDefaultServiceTemplate(): string {
    return `import { {{pascalCase name}} } from '../models';
import { {{pascalCase name}}CreateInput, {{pascalCase name}}UpdateInput } from '../types/{{pascalCase name}}';

export class {{pascalCase name}}Service {
  public async getAll(): Promise<{{pascalCase name}}[]> {
    return await {{pascalCase name}}.findAll();
  }

  public async getById(id: number): Promise<{{pascalCase name}} | null> {
    return await {{pascalCase name}}.findByPk(id);
  }

  public async create(data: {{pascalCase name}}CreateInput): Promise<{{pascalCase name}}> {
    return await {{pascalCase name}}.create(data);
  }

  public async update(id: number, data: {{pascalCase name}}UpdateInput): Promise<{{pascalCase name}}> {
    const {{nameLower}} = await this.getById(id);
    if (!{{nameLower}}) {
      throw new Error('{{pascalCase name}} not found');
    }
    return await {{nameLower}}.update(data);
  }

  public async delete(id: number): Promise<void> {
    const {{nameLower}} = await this.getById(id);
    if (!{{nameLower}}) {
      throw new Error('{{pascalCase name}} not found');
    }
    await {{nameLower}}.destroy();
  }
}

export default new {{pascalCase name}}Service();
`;
  }

  private getDefaultRepositoryTemplate(): string {
    return `import { {{pascalCase name}} } from '../models';

export class {{pascalCase name}}Repository {
  public async findAll(): Promise<{{pascalCase name}}[]> {
    return await {{pascalCase name}}.findAll();
  }

  public async findById(id: number): Promise<{{pascalCase name}} | null> {
    return await {{pascalCase name}}.findByPk(id);
  }

  public async findByCondition(condition: any): Promise<{{pascalCase name}}[]> {
    return await {{pascalCase name}}.findAll({ where: condition });
  }

  public async create(data: any): Promise<{{pascalCase name}}> {
    return await {{pascalCase name}}.create(data);
  }

  public async update(id: number, data: any): Promise<{{pascalCase name}} | null> {
    const {{nameLower}} = await this.findById(id);
    if (!{{nameLower}}) return null;
    return await {{nameLower}}.update(data);
  }

  public async delete(id: number): Promise<boolean> {
    const {{nameLower}} = await this.findById(id);
    if (!{{nameLower}}) return false;
    await {{nameLower}}.destroy();
    return true;
  }
}

export default new {{pascalCase name}}Repository();
`;
  }

  private getDefaultComponentTemplate(): string {
    return `import React{{#if hooks}}, { {{#each hooks}}{{this}}{{#unless @last}}, {{/unless}}{{/each}} }{{/if}} from 'react';
{{#if materialUI}}
import { Box, Typography } from '@mui/material';
{{/if}}

export interface {{pascalCase name}}Props {
{{#each props}}
  {{name}}{{#unless required}}?{{/unless}}: {{type}};
{{/each}}
}

export const {{pascalCase name}}: React.FC<{{pascalCase name}}Props> = ({{#if props}}{ {{#each props}}{{name}}{{#unless @last}}, {{/unless}}{{/each}} }{{/if}}) => {
{{#each stateVariables}}
  const [{{this}}, set{{pascalCase this}}] = useState();
{{/each}}

  return (
{{#if materialUI}}
    <Box>
      <Typography variant="h4">{{pascalCase name}}</Typography>
    </Box>
{{else}}
    <div>
      <h1>{{pascalCase name}}</h1>
    </div>
{{/if}}
  );
};

export default {{pascalCase name}};
`;
  }

  private getDefaultTestTemplate(testType: string, framework: string): string {
    if (framework === 'jest') {
      return `import { {{pascalCase name}} } from '{{importPath}}';

describe('{{pascalCase name}}', () => {
  it('should be defined', () => {
    expect({{pascalCase name}}).toBeDefined();
  });

  // TODO: Add more tests
});
`;
    } else if (framework === 'playwright') {
      return `import { test, expect } from '@playwright/test';

test.describe('{{pascalCase name}}', () => {
  test('should work', async ({ page }) => {
    // TODO: Implement e2e test
  });
});
`;
    }
    return '';
  }

  private getDefaultMigrationTemplate(): string {
    return `import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('{{tableName}}', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
{{#each fields}}
    {{nameSnake name}}: {
      type: {{typeToSequelize type}},
      allowNull: {{#unless required}}true{{else}}false{{/unless}},
    },
{{/each}}
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('{{tableName}}');
}
`;
  }

  private getDefaultGraphQLTemplate(type: string): string {
    if (type === 'type') {
      return `type {{pascalCase name}} {
  id: ID!
{{#each fields}}
  {{name}}: {{typeToGraphQL type}}{{#if required}}!{{/if}}
{{/each}}
  createdAt: DateTime!
  updatedAt: DateTime!
}
`;
    } else if (type === 'query') {
      return `extend type Query {
  {{nameLower}}(id: ID!): {{pascalCase name}}
  {{pluralize nameLower}}: [{{pascalCase name}}!]!
}
`;
    } else {
      return `extend type Mutation {
  create{{pascalCase name}}(input: {{pascalCase name}}Input!): {{pascalCase name}}!
  update{{pascalCase name}}(id: ID!, input: {{pascalCase name}}Input!): {{pascalCase name}}!
  delete{{pascalCase name}}(id: ID!): Boolean!
}
`;
    }
  }

  private getDefaultTRPCTemplate(): string {
    return `import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const {{nameLower}}Router = router({
{{#each procedures}}
  {{this}}: publicProcedure
    .input(z.object({}))
    .query(async ({ input }) => {
      // TODO: Implement procedure
    }),
{{/each}}
});
`;
  }

  private getDefaultFactoryTemplate(): string {
    return `import { faker } from '@faker-js/faker';
import { {{pascalCase name}} } from '../../models';
import { {{pascalCase name}}CreateInput } from '../../types/{{pascalCase name}}';

export class {{pascalCase name}}Factory {
  public static build(overrides?: Partial<{{pascalCase name}}CreateInput>): {{pascalCase name}}CreateInput {
    return {
{{#each fields}}
      {{name}}: faker.{{this.fakerMethod}}(),
{{/each}}
      ...overrides,
    };
  }

  public static async create(overrides?: Partial<{{pascalCase name}}CreateInput>): Promise<{{pascalCase name}}> {
    const data = this.build(overrides);
    return await {{pascalCase name}}.create(data);
  }

  public static async createMany(count: number, overrides?: Partial<{{pascalCase name}}CreateInput>): Promise<{{pascalCase name}}[]> {
    const promises = Array.from({ length: count }, () => this.create(overrides));
    return await Promise.all(promises);
  }
}

export default {{pascalCase name}}Factory;
`;
  }

  private getDefaultFlutterScreenTemplate(stateful: boolean): string {
    if (stateful) {
      return `import 'package:flutter/material.dart';

class {{pascalCase name}}Screen extends StatefulWidget {
  const {{pascalCase name}}Screen({Key? key}) : super(key: key);

  @override
  State<{{pascalCase name}}Screen> createState() => _{{pascalCase name}}ScreenState();
}

class _{{pascalCase name}}ScreenState extends State<{{pascalCase name}}Screen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('{{pascalCase name}}'),
      ),
      body: Center(
        child: Text('{{pascalCase name}} Screen'),
      ),
    );
  }
}
`;
    } else {
      return `import 'package:flutter/material.dart';

class {{pascalCase name}}Screen extends StatelessWidget {
  const {{pascalCase name}}Screen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('{{pascalCase name}}'),
      ),
      body: Center(
        child: Text('{{pascalCase name}} Screen'),
      ),
    );
  }
}
`;
    }
  }
}

export default CodeGenerators;
export {
  GeneratorOptions,
  ModelGeneratorOptions,
  APIGeneratorOptions,
  ComponentGeneratorOptions,
  TestGeneratorOptions,
  Field,
};
