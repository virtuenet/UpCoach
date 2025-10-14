"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const os_1 = tslib_1.__importDefault(require("os"));
const util_1 = require("util");
const express_1 = require("express");
const models_1 = require("../models");
const redis_1 = require("../services/redis");
const router = (0, express_1.Router)();
const fsPromises = {
    access: (0, util_1.promisify)(fs_1.default.access),
    stat: (0, util_1.promisify)(fs_1.default.stat),
};
router.get('/', async (_req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
            api: 'up',
            database: 'checking',
            redis: 'checking',
        },
    };
    try {
        await models_1.sequelize.authenticate();
        health.services.database = 'up';
    }
    catch (error) {
        health.services.database = 'down';
        health.status = 'degraded';
    }
    try {
        await redis_1.redis.ping();
        health.services.redis = 'up';
    }
    catch (error) {
        health.services.redis = 'down';
        health.status = 'degraded';
    }
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
});
router.get('/live', async (_req, res) => {
    try {
        const liveness = {
            status: 'alive',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            pid: process.pid,
        };
        res.status(200).json(liveness);
    }
    catch (error) {
        res.status(503).json({ status: 'dead' });
    }
});
router.get('/ready', async (_req, res) => {
    const checks = {};
    let isReady = true;
    try {
        await models_1.sequelize.authenticate();
        checks.database = { status: 'pass', message: 'Connected' };
    }
    catch (error) {
        checks.database = { status: 'fail', message: error.message };
        isReady = false;
    }
    try {
        await redis_1.redis.ping();
        checks.redis = { status: 'pass', message: 'Connected' };
    }
    catch (error) {
        checks.redis = { status: 'fail', message: error.message };
        isReady = false;
    }
    const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
    const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
    if (missingEnvVars.length === 0) {
        checks.environment = { status: 'pass', message: 'All required variables set' };
    }
    else {
        checks.environment = {
            status: 'fail',
            message: `Missing: ${missingEnvVars.join(', ')}`
        };
        isReady = false;
    }
    const response = {
        ready: isReady,
        timestamp: new Date().toISOString(),
        checks,
    };
    const status = isReady ? 200 : 503;
    res.status(status).json(response);
});
router.get('/detailed', async (_req, res) => {
    const startTime = Date.now();
    const checks = {};
    let overallStatus = 'healthy';
    try {
        const dbStart = Date.now();
        await models_1.sequelize.authenticate();
        const [results] = await models_1.sequelize.query("SELECT COUNT(*) as count FROM pg_stat_activity WHERE state = 'active'");
        checks.database = {
            status: 'pass',
            duration: Date.now() - dbStart,
            metadata: {
                activeConnections: results[0].count,
                maxConnections: models_1.sequelize.config.pool?.max || 10,
            },
        };
    }
    catch (error) {
        checks.database = {
            status: 'fail',
            message: error.message,
        };
        overallStatus = 'unhealthy';
    }
    try {
        const redisStart = Date.now();
        const pong = await redis_1.redis.ping();
        const info = '';
        checks.redis = {
            status: 'pass',
            duration: Date.now() - redisStart,
            metadata: {
                response: pong,
                version: info.split('\n').find(l => l.startsWith('redis_version'))?.split(':')[1]?.trim(),
            },
        };
    }
    catch (error) {
        checks.redis = {
            status: 'fail',
            message: error.message,
        };
        overallStatus = overallStatus === 'healthy' ? 'degraded' : overallStatus;
    }
    const memUsage = process.memoryUsage();
    const totalMem = os_1.default.totalmem();
    const freeMem = os_1.default.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = (usedMem / totalMem) * 100;
    checks.memory = {
        status: memPercent > 90 ? 'warn' : 'pass',
        metadata: {
            usagePercent: memPercent.toFixed(2),
            processRSS: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`,
            processHeap: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
            systemFree: `${(freeMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
            systemTotal: `${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
        },
    };
    if (memPercent > 90) {
        overallStatus = overallStatus === 'healthy' ? 'degraded' : overallStatus;
    }
    const cpus = os_1.default.cpus();
    const loadAvg = os_1.default.loadavg();
    checks.cpu = {
        status: loadAvg[0] > cpus.length * 0.8 ? 'warn' : 'pass',
        metadata: {
            cores: cpus.length,
            loadAverage: {
                '1m': loadAvg[0].toFixed(2),
                '5m': loadAvg[1].toFixed(2),
                '15m': loadAvg[2].toFixed(2),
            },
        },
    };
    const responseTime = Date.now() - startTime;
    checks.responseTime = {
        status: responseTime > 1000 ? 'warn' : 'pass',
        duration: responseTime,
    };
    const healthResult = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        checks,
        metrics: {
            memory: {
                process: memUsage,
                system: {
                    total: totalMem,
                    free: freeMem,
                    used: usedMem,
                    percentUsed: memPercent,
                },
            },
            cpu: {
                cores: cpus.length,
                model: cpus[0]?.model,
                speed: cpus[0]?.speed,
                loadAverage: loadAvg,
            },
        },
    };
    let statusCode = 200;
    if (overallStatus === 'degraded')
        statusCode = 200;
    if (overallStatus === 'unhealthy')
        statusCode = 503;
    res.status(statusCode).json(healthResult);
});
router.get('/metrics', async (_req, res) => {
    try {
        const metrics = [];
        const memUsage = process.memoryUsage();
        metrics.push(`# HELP process_memory_rss_bytes Process RSS memory in bytes`);
        metrics.push(`# TYPE process_memory_rss_bytes gauge`);
        metrics.push(`process_memory_rss_bytes ${memUsage.rss}`);
        metrics.push(`# HELP process_memory_heap_used_bytes Process heap used in bytes`);
        metrics.push(`# TYPE process_memory_heap_used_bytes gauge`);
        metrics.push(`process_memory_heap_used_bytes ${memUsage.heapUsed}`);
        metrics.push(`# HELP process_memory_heap_total_bytes Process heap total in bytes`);
        metrics.push(`# TYPE process_memory_heap_total_bytes gauge`);
        metrics.push(`process_memory_heap_total_bytes ${memUsage.heapTotal}`);
        const cpuUsage = process.cpuUsage();
        metrics.push(`# HELP process_cpu_user_seconds_total Process CPU user time in seconds`);
        metrics.push(`# TYPE process_cpu_user_seconds_total counter`);
        metrics.push(`process_cpu_user_seconds_total ${cpuUsage.user / 1000000}`);
        metrics.push(`# HELP process_cpu_system_seconds_total Process CPU system time in seconds`);
        metrics.push(`# TYPE process_cpu_system_seconds_total counter`);
        metrics.push(`process_cpu_system_seconds_total ${cpuUsage.system / 1000000}`);
        metrics.push(`# HELP process_uptime_seconds Process uptime in seconds`);
        metrics.push(`# TYPE process_uptime_seconds gauge`);
        metrics.push(`process_uptime_seconds ${process.uptime()}`);
        metrics.push(`# HELP system_load_average System load average`);
        metrics.push(`# TYPE system_load_average gauge`);
        const loadAvg = os_1.default.loadavg();
        metrics.push(`system_load_average{period="1m"} ${loadAvg[0]}`);
        metrics.push(`system_load_average{period="5m"} ${loadAvg[1]}`);
        metrics.push(`system_load_average{period="15m"} ${loadAvg[2]}`);
        res.set('Content-Type', 'text/plain; version=0.0.4');
        res.send(metrics.join('\n'));
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate metrics' });
    }
});
router.get('/startup', async (_req, res) => {
    try {
        const checks = {
            database: false,
            redis: false,
            migrations: false,
        };
        try {
            await models_1.sequelize.authenticate();
            checks.database = true;
        }
        catch (error) {
        }
        try {
            await redis_1.redis.ping();
            checks.redis = true;
        }
        catch (error) {
        }
        try {
            const [results] = await models_1.sequelize.query("SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'");
            checks.migrations = results[0].count > 0;
        }
        catch (error) {
        }
        const allReady = Object.values(checks).every(v => v === true);
        if (allReady) {
            res.status(200).json({
                status: 'started',
                timestamp: new Date().toISOString(),
                checks,
            });
        }
        else {
            res.status(503).json({
                status: 'starting',
                timestamp: new Date().toISOString(),
                checks,
            });
        }
    }
    catch (error) {
        res.status(503).json({
            status: 'error',
            message: error.message,
        });
    }
});
exports.default = router;
