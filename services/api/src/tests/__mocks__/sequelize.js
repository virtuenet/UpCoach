// Enhanced Sequelize mock
const mockInstance = {
  id: 1,
  email: 'test@test.com',
  name: 'Test User',
  createdAt: new Date(),
  updatedAt: new Date(),
  save: jest.fn().mockResolvedValue(this),
  update: jest.fn().mockResolvedValue(this),
  destroy: jest.fn().mockResolvedValue(1),
  reload: jest.fn().mockResolvedValue(this),
  toJSON: jest.fn(function() { return this }),
  get: jest.fn(function(key) { return this[key] }),
  set: jest.fn(function(key, value) { this[key] = value; return this }),
  setDataValue: jest.fn(function(key, value) { this[key] = value }),
  getDataValue: jest.fn(function(key) { return this[key] }),
};

class MockModel {
  constructor(data = {}) {
    Object.assign(this, mockInstance, data);
  }

  static init() {
    return this;
  }

  static associate() {}
  static hasMany() {}
  static hasOne() {}
  static belongsTo() {}
  static belongsToMany() {}

  // Instance methods
  save() { return Promise.resolve(this); }
  update(data) { Object.assign(this, data); return Promise.resolve(this); }
  destroy() { return Promise.resolve(1); }
  reload() { return Promise.resolve(this); }
  toJSON() { return { ...this }; }
  get(key) { return this[key]; }
  set(key, value) { this[key] = value; return this; }

  // Static methods
  static findAll = jest.fn().mockResolvedValue([mockInstance]);
  static findOne = jest.fn().mockResolvedValue(mockInstance);
  static findByPk = jest.fn().mockResolvedValue(mockInstance);
  static findOrCreate = jest.fn().mockResolvedValue([mockInstance, true]);
  static create = jest.fn((data) => Promise.resolve(new MockModel(data)));
  static update = jest.fn().mockResolvedValue([1, [mockInstance]]);
  static destroy = jest.fn().mockResolvedValue(1);
  static count = jest.fn().mockResolvedValue(0);
  static bulkCreate = jest.fn((items) => Promise.resolve(items.map(item => new MockModel(item))));
  static build = jest.fn((data) => new MockModel(data));
  static upsert = jest.fn().mockResolvedValue([mockInstance, true]);
  static findAndCountAll = jest.fn().mockResolvedValue({ rows: [mockInstance], count: 1 });
  static increment = jest.fn().mockResolvedValue([mockInstance, 1]);
  static decrement = jest.fn().mockResolvedValue([mockInstance, 1]);
  static max = jest.fn().mockResolvedValue(100);
  static min = jest.fn().mockResolvedValue(1);
  static sum = jest.fn().mockResolvedValue(500);

  // Sequelize model methods
  static getInstance = jest.fn(() => new MockModel());
  static getTableName = jest.fn(() => 'mock_table');
  static getAttributes = jest.fn(() => ({}));
  static rawAttributes = {};
  static tableName = 'mock_table';
  static primaryKeyAttribute = 'id';
  static primaryKeyAttributes = ['id'];
  static associations = {};
}

// Mock transaction object
const mockTransaction = {
  commit: jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined),
  LOCK: {
    UPDATE: 'UPDATE',
    SHARE: 'SHARE',
    KEY_SHARE: 'KEY_SHARE',
    NO_KEY_UPDATE: 'NO_KEY_UPDATE'
  }
};

// Mock Sequelize instance
const mockSequelizeInstance = {
  authenticate: jest.fn().mockResolvedValue(undefined),
  sync: jest.fn().mockResolvedValue(undefined),
  getDialect: jest.fn().mockReturnValue('postgres'),
  getDatabaseName: jest.fn().mockReturnValue('test_db'),
  query: jest.fn().mockResolvedValue([[], { rowCount: 0 }]),
  transaction: jest.fn((callback) => {
    if (callback) {
      return callback(mockTransaction).then(result => {
        mockTransaction.commit();
        return result;
      }).catch(error => {
        mockTransaction.rollback();
        throw error;
      });
    }
    return Promise.resolve(mockTransaction);
  }),
  close: jest.fn().mockResolvedValue(undefined),
  define: jest.fn((name, attributes, options) => {
    const model = class extends MockModel {};
    model.tableName = name;
    model.rawAttributes = attributes;
    return model;
  }),
  literal: jest.fn((val) => ({ val, [Symbol.for('literal')]: true })),
  fn: jest.fn((name, ...args) => ({ fn: name, args })),
  col: jest.fn((name) => ({ col: name })),
  cast: jest.fn((val, type) => ({ cast: val, type })),
  where: jest.fn((attr, comparator, value) => ({ attr, comparator, value })),
  and: jest.fn((...args) => ({ [Symbol.for('and')]: args })),
  or: jest.fn((...args) => ({ [Symbol.for('or')]: args })),
  json: jest.fn((path) => ({ json: path })),
  models: {},
  model: jest.fn((name) => MockModel),
  isDefined: jest.fn(() => true),
  import: jest.fn(),
};

// Create Sequelize constructor
const Sequelize = jest.fn().mockImplementation(() => mockSequelizeInstance);

// Add static properties and methods to Sequelize
Sequelize.Sequelize = Sequelize;
Sequelize.Model = MockModel;
Sequelize.Transaction = mockTransaction;
Sequelize.literal = mockSequelizeInstance.literal;
Sequelize.fn = mockSequelizeInstance.fn;
Sequelize.col = mockSequelizeInstance.col;
Sequelize.cast = mockSequelizeInstance.cast;
Sequelize.where = mockSequelizeInstance.where;
Sequelize.and = mockSequelizeInstance.and;
Sequelize.or = mockSequelizeInstance.or;
Sequelize.json = mockSequelizeInstance.json;

// DataTypes
Sequelize.DataTypes = {
  STRING: jest.fn((length) => ({ type: 'STRING', length })),
  INTEGER: jest.fn(() => ({ type: 'INTEGER' })),
  BIGINT: jest.fn(() => ({ type: 'BIGINT' })),
  BOOLEAN: jest.fn(() => ({ type: 'BOOLEAN' })),
  DATE: jest.fn(() => ({ type: 'DATE' })),
  DATEONLY: jest.fn(() => ({ type: 'DATEONLY' })),
  TEXT: jest.fn((size) => ({ type: 'TEXT', size })),
  ENUM: jest.fn((...values) => ({ type: 'ENUM', values })),
  JSON: jest.fn(() => ({ type: 'JSON' })),
  JSONB: jest.fn(() => ({ type: 'JSONB' })),
  UUID: jest.fn(() => ({ type: 'UUID' })),
  UUIDV4: jest.fn(() => ({ type: 'UUIDV4' })),
  UUIDV1: jest.fn(() => ({ type: 'UUIDV1' })),
  DECIMAL: jest.fn((precision, scale) => ({ type: 'DECIMAL', precision, scale })),
  FLOAT: jest.fn(() => ({ type: 'FLOAT' })),
  DOUBLE: jest.fn(() => ({ type: 'DOUBLE' })),
  REAL: jest.fn(() => ({ type: 'REAL' })),
  ARRAY: jest.fn((type) => ({ type: 'ARRAY', arrayType: type })),
  BLOB: jest.fn((size) => ({ type: 'BLOB', size })),
  VIRTUAL: jest.fn((returnType, fields) => ({ type: 'VIRTUAL', returnType, fields })),
  GEOMETRY: jest.fn((type, srid) => ({ type: 'GEOMETRY', geometryType: type, srid })),
};

// Operators
Sequelize.Op = {
  eq: Symbol.for('eq'),
  ne: Symbol.for('ne'),
  gte: Symbol.for('gte'),
  gt: Symbol.for('gt'),
  lte: Symbol.for('lte'),
  lt: Symbol.for('lt'),
  not: Symbol.for('not'),
  is: Symbol.for('is'),
  in: Symbol.for('in'),
  notIn: Symbol.for('notIn'),
  like: Symbol.for('like'),
  notLike: Symbol.for('notLike'),
  iLike: Symbol.for('iLike'),
  notILike: Symbol.for('notILike'),
  startsWith: Symbol.for('startsWith'),
  endsWith: Symbol.for('endsWith'),
  substring: Symbol.for('substring'),
  regexp: Symbol.for('regexp'),
  notRegexp: Symbol.for('notRegexp'),
  iRegexp: Symbol.for('iRegexp'),
  notIRegexp: Symbol.for('notIRegexp'),
  between: Symbol.for('between'),
  notBetween: Symbol.for('notBetween'),
  overlap: Symbol.for('overlap'),
  contains: Symbol.for('contains'),
  contained: Symbol.for('contained'),
  adjacent: Symbol.for('adjacent'),
  strictLeft: Symbol.for('strictLeft'),
  strictRight: Symbol.for('strictRight'),
  noExtendRight: Symbol.for('noExtendRight'),
  noExtendLeft: Symbol.for('noExtendLeft'),
  and: Symbol.for('and'),
  or: Symbol.for('or'),
  any: Symbol.for('any'),
  all: Symbol.for('all'),
  values: Symbol.for('values'),
  col: Symbol.for('col'),
  placeholder: Symbol.for('placeholder'),
  join: Symbol.for('join'),
  match: Symbol.for('match'),
};

// Validation errors
Sequelize.ValidationError = class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'SequelizeValidationError';
    this.errors = errors;
  }
};

Sequelize.UniqueConstraintError = class UniqueConstraintError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SequelizeUniqueConstraintError';
  }
};

Sequelize.DatabaseError = class DatabaseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SequelizeDatabaseError';
  }
};

// Export everything
module.exports = Sequelize;
module.exports.Sequelize = Sequelize;
module.exports.Model = MockModel;
module.exports.DataTypes = Sequelize.DataTypes;
module.exports.Op = Sequelize.Op;
module.exports.literal = Sequelize.literal;
module.exports.fn = Sequelize.fn;
module.exports.col = Sequelize.col;
module.exports.cast = Sequelize.cast;
module.exports.where = Sequelize.where;
module.exports.and = Sequelize.and;
module.exports.or = Sequelize.or;
module.exports.json = Sequelize.json;
module.exports.Transaction = mockTransaction;
module.exports.ValidationError = Sequelize.ValidationError;
module.exports.UniqueConstraintError = Sequelize.UniqueConstraintError;
module.exports.DatabaseError = Sequelize.DatabaseError;
module.exports.default = Sequelize;