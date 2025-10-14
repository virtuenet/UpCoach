"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.count = exports.scope = exports.destroy = exports.update = exports.bulkCreate = exports.create = exports.findAndCountAll = exports.findAll = exports.findOne = exports.findByPk = exports.ModelHelpers = void 0;
exports.ModelHelpers = {
    findByPk: async (model, id, options) => {
        return model.findByPk(id, options);
    },
    findOne: async (model, options) => {
        return model.findOne(options);
    },
    findAll: async (model, options) => {
        return model.findAll(options);
    },
    findAndCountAll: async (model, options) => {
        return model.findAndCountAll(options);
    },
    create: async (model, values, options) => {
        return model.create(values, options);
    },
    bulkCreate: async (model, records, options) => {
        return model.bulkCreate(records, options);
    },
    update: async (model, values, options) => {
        return model.update(values, options);
    },
    destroy: async (model, options) => {
        return model.destroy(options);
    },
    scope: (model, scopes) => {
        return model.scope(scopes);
    },
    count: async (model, options) => {
        return model.count(options);
    }
};
exports.findByPk = exports.ModelHelpers.findByPk, exports.findOne = exports.ModelHelpers.findOne, exports.findAll = exports.ModelHelpers.findAll, exports.findAndCountAll = exports.ModelHelpers.findAndCountAll, exports.create = exports.ModelHelpers.create, exports.bulkCreate = exports.ModelHelpers.bulkCreate, exports.update = exports.ModelHelpers.update, exports.destroy = exports.ModelHelpers.destroy, exports.scope = exports.ModelHelpers.scope, exports.count = exports.ModelHelpers.count;
