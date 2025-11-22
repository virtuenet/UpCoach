#!/bin/bash

# Fix logger error messages containing _error
echo "Fixing logger messages with _error..."

# Fix in redis.ts
find src/ -name "*.ts" -type f -exec sed -i '' 's/Redis GET _error/Redis GET error/g' {} +
find src/ -name "*.ts" -type f -exec sed -i '' 's/Redis SET _error/Redis SET error/g' {} +
find src/ -name "*.ts" -type f -exec sed -i '' 's/Redis SETEX _error/Redis SETEX error/g' {} +
find src/ -name "*.ts" -type f -exec sed -i '' 's/Redis DEL _error/Redis DEL error/g' {} +
find src/ -name "*.ts" -type f -exec sed -i '' 's/Redis EXISTS _error/Redis EXISTS error/g' {} +
find src/ -name "*.ts" -type f -exec sed -i '' 's/Redis INCR _error/Redis INCR error/g' {} +
find src/ -name "*.ts" -type f -exec sed -i '' 's/Redis PING _error/Redis PING error/g' {} +
find src/ -name "*.ts" -type f -exec sed -i '' 's/Redis QUIT _error/Redis QUIT error/g' {} +
find src/ -name "*.ts" -type f -exec sed -i '' 's/Redis HGET _error/Redis HGET error/g' {} +
find src/ -name "*.ts" -type f -exec sed -i '' 's/Redis HSET _error/Redis HSET error/g' {} +
find src/ -name "*.ts" -type f -exec sed -i '' 's/Redis HDEL _error/Redis HDEL error/g' {} +
find src/ -name "*.ts" -type f -exec sed -i '' 's/Redis LPUSH _error/Redis LPUSH error/g' {} +
find src/ -name "*.ts" -type f -exec sed -i '' 's/Redis RPOP _error/Redis RPOP error/g' {} +

# Fix other _error in strings
find src/ -name "*.ts" -type f -exec sed -i '' 's/check _error/check error/g' {} +
find src/ -name "*.ts" -type f -exec sed -i '' 's/"_error"/"error"/g' {} +

# Fix specific error response fields
find src/ -name "*.ts" -type f -exec sed -i '' "s/_error: '/_error: '/g" {} +
find src/ -name "*.ts" -type f -exec sed -i '' "s/_error: (/_error: (/g" {} +

echo "Fixed logger messages"