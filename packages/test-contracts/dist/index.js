"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  CancelSubscriptionSchema: () => CancelSubscriptionSchema,
  CreateSubscriptionSchema: () => CreateSubscriptionSchema,
  CreateUserSchema: () => CreateUserSchema,
  FinancialDashboardSchema: () => FinancialDashboardSchema,
  LoginRequestSchema: () => LoginRequestSchema,
  LoginResponseSchema: () => LoginResponseSchema,
  RefundSchema: () => RefundSchema,
  SubscriptionSchema: () => SubscriptionSchema,
  TransactionSchema: () => TransactionSchema,
  UpdateUserSchema: () => UpdateUserSchema,
  UserListSchema: () => UserListSchema,
  UserSchema: () => UserSchema,
  userInteractions: () => userInteractions,
  userServicePact: () => userServicePact,
  validateLoginResponse: () => validateLoginResponse,
  validateUserResponse: () => validateUserResponse
});
module.exports = __toCommonJS(index_exports);

// src/schemas/user.schema.ts
var import_zod = require("zod");
var UserSchema = import_zod.z.object({
  id: import_zod.z.string().uuid(),
  email: import_zod.z.string().email(),
  name: import_zod.z.string().min(1),
  role: import_zod.z.enum(["user", "coach", "admin"]),
  avatar: import_zod.z.string().url().optional(),
  createdAt: import_zod.z.string().datetime(),
  updatedAt: import_zod.z.string().datetime(),
  isActive: import_zod.z.boolean(),
  subscription: import_zod.z.object({
    id: import_zod.z.string().uuid(),
    status: import_zod.z.enum(["active", "canceled", "past_due", "trialing"]),
    plan: import_zod.z.enum(["free", "basic", "premium", "enterprise"]),
    expiresAt: import_zod.z.string().datetime().optional()
  }).optional()
});
var UserListSchema = import_zod.z.object({
  data: import_zod.z.array(UserSchema),
  meta: import_zod.z.object({
    total: import_zod.z.number().int().nonnegative(),
    page: import_zod.z.number().int().positive(),
    limit: import_zod.z.number().int().positive(),
    totalPages: import_zod.z.number().int().nonnegative()
  })
});
var CreateUserSchema = import_zod.z.object({
  email: import_zod.z.string().email(),
  password: import_zod.z.string().min(8),
  name: import_zod.z.string().min(1),
  role: import_zod.z.enum(["user", "coach", "admin"]).default("user")
});
var UpdateUserSchema = import_zod.z.object({
  name: import_zod.z.string().min(1).optional(),
  avatar: import_zod.z.string().url().optional(),
  role: import_zod.z.enum(["user", "coach", "admin"]).optional(),
  isActive: import_zod.z.boolean().optional()
});
var LoginRequestSchema = import_zod.z.object({
  email: import_zod.z.string().email(),
  password: import_zod.z.string()
});
var LoginResponseSchema = import_zod.z.object({
  success: import_zod.z.boolean(),
  token: import_zod.z.string(),
  refreshToken: import_zod.z.string(),
  user: UserSchema,
  expiresIn: import_zod.z.number()
});

// src/schemas/financial.schema.ts
var import_zod2 = require("zod");
var TransactionSchema = import_zod2.z.object({
  id: import_zod2.z.string().uuid(),
  userId: import_zod2.z.string().uuid(),
  amount: import_zod2.z.number().positive(),
  currency: import_zod2.z.string().length(3),
  type: import_zod2.z.enum(["payment", "refund", "subscription", "payout"]),
  status: import_zod2.z.enum(["pending", "completed", "failed", "canceled"]),
  description: import_zod2.z.string(),
  metadata: import_zod2.z.record(import_zod2.z.any()).optional(),
  stripePaymentIntentId: import_zod2.z.string().optional(),
  createdAt: import_zod2.z.string().datetime(),
  updatedAt: import_zod2.z.string().datetime()
});
var SubscriptionSchema = import_zod2.z.object({
  id: import_zod2.z.string().uuid(),
  userId: import_zod2.z.string().uuid(),
  stripeSubscriptionId: import_zod2.z.string(),
  stripePriceId: import_zod2.z.string(),
  status: import_zod2.z.enum(["active", "canceled", "past_due", "trialing", "incomplete"]),
  currentPeriodStart: import_zod2.z.string().datetime(),
  currentPeriodEnd: import_zod2.z.string().datetime(),
  cancelAtPeriodEnd: import_zod2.z.boolean(),
  trialEnd: import_zod2.z.string().datetime().nullable(),
  metadata: import_zod2.z.record(import_zod2.z.any()).optional(),
  createdAt: import_zod2.z.string().datetime(),
  updatedAt: import_zod2.z.string().datetime()
});
var FinancialDashboardSchema = import_zod2.z.object({
  revenue: import_zod2.z.object({
    total: import_zod2.z.number().nonnegative(),
    monthly: import_zod2.z.number().nonnegative(),
    daily: import_zod2.z.number().nonnegative(),
    growth: import_zod2.z.number()
  }),
  mrr: import_zod2.z.object({
    current: import_zod2.z.number().nonnegative(),
    previous: import_zod2.z.number().nonnegative(),
    growth: import_zod2.z.number(),
    churn: import_zod2.z.number()
  }),
  subscriptions: import_zod2.z.object({
    active: import_zod2.z.number().int().nonnegative(),
    new: import_zod2.z.number().int().nonnegative(),
    canceled: import_zod2.z.number().int().nonnegative(),
    trial: import_zod2.z.number().int().nonnegative()
  }),
  customers: import_zod2.z.object({
    total: import_zod2.z.number().int().nonnegative(),
    paying: import_zod2.z.number().int().nonnegative(),
    ltv: import_zod2.z.number().nonnegative(),
    cac: import_zod2.z.number().nonnegative()
  }),
  transactions: import_zod2.z.array(TransactionSchema).max(10)
});
var CreateSubscriptionSchema = import_zod2.z.object({
  userId: import_zod2.z.string().uuid(),
  priceId: import_zod2.z.string(),
  paymentMethodId: import_zod2.z.string(),
  trialDays: import_zod2.z.number().int().nonnegative().optional()
});
var CancelSubscriptionSchema = import_zod2.z.object({
  subscriptionId: import_zod2.z.string().uuid(),
  cancelAtPeriodEnd: import_zod2.z.boolean().default(true),
  reason: import_zod2.z.string().optional()
});
var RefundSchema = import_zod2.z.object({
  transactionId: import_zod2.z.string().uuid(),
  amount: import_zod2.z.number().positive().optional(),
  reason: import_zod2.z.enum(["duplicate", "fraudulent", "requested_by_customer"])
});

// src/pact/user-service.pact.ts
var import_pact = require("@pact-foundation/pact");
var { like, term, eachLike, iso8601DateTimeWithMillis } = import_pact.Matchers;
var userServicePact = new import_pact.Pact({
  consumer: "AdminPanel",
  provider: "UserService",
  port: 8080,
  dir: "./pacts",
  logLevel: "info"
});
var userInteractions = {
  getUserById: {
    state: "user with id 123 exists",
    uponReceiving: "a request for user details",
    withRequest: {
      method: "GET",
      path: "/api/users/123",
      headers: {
        Authorization: term({
          matcher: "Bearer [A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+",
          generate: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        })
      }
    },
    willRespondWith: {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: {
        id: "123",
        email: like("user@example.com"),
        firstName: like("John"),
        lastName: like("Doe"),
        role: term({
          matcher: "user|coach|admin",
          generate: "user"
        }),
        status: term({
          matcher: "active|inactive|suspended|pending",
          generate: "active"
        }),
        createdAt: iso8601DateTimeWithMillis(),
        updatedAt: iso8601DateTimeWithMillis(),
        subscription: like({
          id: like("sub_123"),
          status: term({
            matcher: "active|trialing|canceled|past_due",
            generate: "active"
          }),
          plan: like("premium"),
          currentPeriodEnd: iso8601DateTimeWithMillis()
        })
      }
    }
  },
  createUser: {
    state: "provider is ready to create users",
    uponReceiving: "a request to create a new user",
    withRequest: {
      method: "POST",
      path: "/api/users",
      headers: {
        "Content-Type": "application/json"
      },
      body: {
        email: like("newuser@example.com"),
        password: like("SecurePass123!"),
        firstName: like("Jane"),
        lastName: like("Smith"),
        role: term({
          matcher: "user|coach",
          generate: "user"
        })
      }
    },
    willRespondWith: {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        Location: term({
          matcher: "/api/users/[a-f0-9-]+",
          generate: "/api/users/456"
        })
      },
      body: {
        id: like("456"),
        email: like("newuser@example.com"),
        firstName: like("Jane"),
        lastName: like("Smith"),
        role: like("user"),
        status: like("pending"),
        createdAt: iso8601DateTimeWithMillis(),
        updatedAt: iso8601DateTimeWithMillis()
      }
    }
  },
  listUsers: {
    state: "multiple users exist",
    uponReceiving: "a request to list users",
    withRequest: {
      method: "GET",
      path: "/api/users",
      query: {
        page: "1",
        limit: "10",
        role: "user"
      },
      headers: {
        Authorization: term({
          matcher: "Bearer [A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+",
          generate: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        })
      }
    },
    willRespondWith: {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: {
        data: eachLike({
          id: like("123"),
          email: like("user@example.com"),
          firstName: like("John"),
          lastName: like("Doe"),
          role: like("user"),
          status: like("active"),
          createdAt: iso8601DateTimeWithMillis(),
          updatedAt: iso8601DateTimeWithMillis()
        }),
        pagination: {
          page: like(1),
          limit: like(10),
          total: like(100),
          totalPages: like(10)
        }
      }
    }
  },
  login: {
    state: "user credentials are valid",
    uponReceiving: "a login request",
    withRequest: {
      method: "POST",
      path: "/api/auth/login",
      headers: {
        "Content-Type": "application/json"
      },
      body: {
        email: like("user@example.com"),
        password: like("password123"),
        rememberMe: like(false)
      }
    },
    willRespondWith: {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: {
        token: term({
          matcher: "[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+",
          generate: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        }),
        refreshToken: like("refresh_token_123"),
        user: {
          id: like("123"),
          email: like("user@example.com"),
          firstName: like("John"),
          lastName: like("Doe"),
          role: like("user"),
          status: like("active"),
          createdAt: iso8601DateTimeWithMillis(),
          updatedAt: iso8601DateTimeWithMillis()
        },
        expiresIn: like(3600)
      }
    }
  }
};
function validateUserResponse(response) {
  try {
    UserSchema.parse(response);
    return true;
  } catch (error) {
    console.error("User response validation failed:", error);
    return false;
  }
}
function validateLoginResponse(response) {
  try {
    LoginResponseSchema.parse(response);
    return true;
  } catch (error) {
    console.error("Login response validation failed:", error);
    return false;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CancelSubscriptionSchema,
  CreateSubscriptionSchema,
  CreateUserSchema,
  FinancialDashboardSchema,
  LoginRequestSchema,
  LoginResponseSchema,
  RefundSchema,
  SubscriptionSchema,
  TransactionSchema,
  UpdateUserSchema,
  UserListSchema,
  UserSchema,
  userInteractions,
  userServicePact,
  validateLoginResponse,
  validateUserResponse
});
//# sourceMappingURL=index.js.map