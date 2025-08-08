import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import LoadingSpinner from "../components/LoadingSpinner";
import { financialApi } from "../services/financialApi";
import { DollarSign, Users, TrendingUp, AlertCircle } from "lucide-react";

interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: "active" | "canceled" | "past_due" | "trialing" | "unpaid";
  plan: string;
  interval: "month" | "year";
  amount: number;
  currency: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  canceledAt?: Date;
  createdAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    canceled: 0,
    mrr: 0,
  });

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const data = await financialApi.getSubscriptions();
      setSubscriptions(data.subscriptions || []);
      setStats(
        data.stats || {
          total: 0,
          active: 0,
          canceled: 0,
          mrr: 0,
        },
      );
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { variant: any; label: string }> = {
      active: { variant: "success", label: "Active" },
      canceled: { variant: "destructive", label: "Canceled" },
      past_due: { variant: "warning", label: "Past Due" },
      trialing: { variant: "secondary", label: "Trialing" },
      unpaid: { variant: "destructive", label: "Unpaid" },
    };

    const badge = badges[status] || { variant: "secondary", label: status };
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <Button onClick={fetchSubscriptions}>Refresh</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Subscriptions</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.active}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Canceled</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.canceled}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">MRR</p>
              <p className="text-2xl font-bold">
                ${(stats.mrr / 100).toFixed(2)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((subscription) => (
              <TableRow key={subscription.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {subscription.user?.name || "Unknown"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {subscription.user?.email}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {subscription.plan} / {subscription.interval}
                  </Badge>
                </TableCell>
                <TableCell>${(subscription.amount / 100).toFixed(2)}</TableCell>
                <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>
                      {format(
                        new Date(subscription.currentPeriodStart),
                        "MMM d, yyyy",
                      )}
                    </p>
                    <p className="text-gray-500">
                      to{" "}
                      {format(
                        new Date(subscription.currentPeriodEnd),
                        "MMM d, yyyy",
                      )}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(subscription.createdAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
