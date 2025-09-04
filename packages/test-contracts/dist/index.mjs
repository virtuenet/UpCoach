// src/schemas/user.schema.ts
import { z } from "zod";
var UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["user", "coach", "admin"]),
  avatar: z.string().url().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  isActive: z.boolean(),
  subscription: z.object({
    id: z.string().uuid(),
    status: z.enum(["active", "canceled", "past_due", "trialing"]),
    plan: z.enum(["free", "basic", "premium", "enterprise"]),
    expiresAt: z.string().datetime().optional()
  }).optional()
});
var UserListSchema = z.object({
  data: z.array(UserSchema),
  meta: z.object({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().nonnegative()
  })
});
var CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(["user", "coach", "admin"]).default("user")
});
var UpdateUserSchema = z.object({
  name: z.string().min(1).optional(),
  avatar: z.string().url().optional(),
  role: z.enum(["user", "coach", "admin"]).optional(),
  isActive: z.boolean().optional()
});
var LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string()
});
var LoginResponseSchema = z.object({
  success: z.boolean(),
  token: z.string(),
  refreshToken: z.string(),
  user: UserSchema,
  expiresIn: z.number()
});

// src/schemas/financial.schema.ts
import { z as z2 } from "zod";
var TransactionSchema = z2.object({
  id: z2.string().uuid(),
  userId: z2.string().uuid(),
  amount: z2.number().positive(),
  currency: z2.string().length(3),
  type: z2.enum(["payment", "refund", "subscription", "payout"]),
  status: z2.enum(["pending", "completed", "failed", "canceled"]),
  description: z2.string(),
  metadata: z2.record(z2.any()).optional(),
  stripePaymentIntentId: z2.string().optional(),
  createdAt: z2.string().datetime(),
  updatedAt: z2.string().datetime()
});
var SubscriptionSchema = z2.object({
  id: z2.string().uuid(),
  userId: z2.string().uuid(),
  stripeSubscriptionId: z2.string(),
  stripePriceId: z2.string(),
  status: z2.enum(["active", "canceled", "past_due", "trialing", "incomplete"]),
  currentPeriodStart: z2.string().datetime(),
  currentPeriodEnd: z2.string().datetime(),
  cancelAtPeriodEnd: z2.boolean(),
  trialEnd: z2.string().datetime().nullable(),
  metadata: z2.record(z2.any()).optional(),
  createdAt: z2.string().datetime(),
  updatedAt: z2.string().datetime()
});
var FinancialDashboardSchema = z2.object({
  revenue: z2.object({
    total: z2.number().nonnegative(),
    monthly: z2.number().nonnegative(),
    daily: z2.number().nonnegative(),
    growth: z2.number()
  }),
  mrr: z2.object({
    current: z2.number().nonnegative(),
    previous: z2.number().nonnegative(),
    growth: z2.number(),
    churn: z2.number()
  }),
  subscriptions: z2.object({
    active: z2.number().int().nonnegative(),
    new: z2.number().int().nonnegative(),
    canceled: z2.number().int().nonnegative(),
    trial: z2.number().int().nonnegative()
  }),
  customers: z2.object({
    total: z2.number().int().nonnegative(),
    paying: z2.number().int().nonnegative(),
    ltv: z2.number().nonnegative(),
    cac: z2.number().nonnegative()
  }),
  transactions: z2.array(TransactionSchema).max(10)
});
var CreateSubscriptionSchema = z2.object({
  userId: z2.string().uuid(),
  priceId: z2.string(),
  paymentMethodId: z2.string(),
  trialDays: z2.number().int().nonnegative().optional()
});
var CancelSubscriptionSchema = z2.object({
  subscriptionId: z2.string().uuid(),
  cancelAtPeriodEnd: z2.boolean().default(true),
  reason: z2.string().optional()
});
var RefundSchema = z2.object({
  transactionId: z2.string().uuid(),
  amount: z2.number().positive().optional(),
  reason: z2.enum(["duplicate", "fraudulent", "requested_by_customer"])
});

// src/pact/user-service.pact.ts
import { Pact, Matchers } from "@pact-foundation/pact";
var { like, term, eachLike, iso8601DateTimeWithMillis } = Matchers;
var userServicePact = new Pact({
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
export {
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
};
//# sourceMappingURL=index.mjs.map