"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  Copy,
  Check,
  Share2,
  Users,
  DollarSign,
  TrendingUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trackEvent } from "@/services/analytics";
import { api } from "@/services/api";

interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  referralCode?: string;
}

interface ReferralWidgetProps {
  isAuthenticated?: boolean;
  userId?: number;
}

export default function ReferralWidget({
  isAuthenticated = false,
  userId,
}: ReferralWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareEmails, setShareEmails] = useState("");
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchReferralStats();
    }
  }, [isAuthenticated, userId]);

  const fetchReferralStats = async () => {
    setLoading(true);
    try {
      const response = await api.get("/referrals/stats");
      setStats(response.data.data);
    } catch (error) {
      console.error("Failed to fetch referral stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = async () => {
    try {
      const response = await api.post("/referrals/code");
      const newCode = response.data.data.code;
      setStats((prev) => (prev ? { ...prev, referralCode: newCode } : null));
      trackEvent("Referral Code Generated", { source: "widget" });
    } catch (error) {
      console.error("Failed to generate referral code:", error);
    }
  };

  const copyReferralLink = () => {
    if (stats?.referralCode) {
      const link = `${window.location.origin}/signup?ref=${stats.referralCode}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      trackEvent("Referral Link Copied", { code: stats.referralCode });
    }
  };

  const shareViaEmail = async () => {
    if (!shareEmails || !stats?.referralCode) return;

    setSharing(true);
    try {
      const emails = shareEmails.split(",").map((e) => e.trim());
      await api.post("/referrals/share", { emails });
      setShareEmails("");
      trackEvent("Referral Shared", { method: "email", count: emails.length });
    } catch (error) {
      console.error("Failed to share referral:", error);
    } finally {
      setSharing(false);
    }
  };

  const shareOnSocial = (platform: string) => {
    if (!stats?.referralCode) return;

    const link = `${window.location.origin}/signup?ref=${stats.referralCode}`;
    const text = "Join me on UpCoach and get 20% off your first month! 🎉";

    let shareUrl = "";
    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
      trackEvent("Referral Shared", { method: platform });
    }
  };

  if (!isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-8 right-8 z-50"
      >
        <Card className="p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <Gift className="h-6 w-6 text-primary" />
            <div>
              <p className="font-semibold">Earn rewards!</p>
              <p className="text-sm text-gray-600">
                Sign up to start referring friends
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-40 bg-primary text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-shadow"
      >
        <Gift className="h-6 w-6" />
        {stats && stats.totalEarnings > 0 && (
          <Badge className="absolute -top-2 -right-2 bg-green-500">
            ${stats.totalEarnings}
          </Badge>
        )}
      </motion.button>

      {/* Referral Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-20 right-8 z-50 w-96 max-w-[calc(100vw-2rem)]"
            >
              <Card className="p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Referral Program</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  </div>
                ) : stats ? (
                  <div className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <Users className="h-5 w-5 text-primary mx-auto mb-1" />
                        <div className="text-2xl font-bold">
                          {stats.totalReferrals}
                        </div>
                        <div className="text-xs text-gray-600">
                          Total Referrals
                        </div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <DollarSign className="h-5 w-5 text-green-600 mx-auto mb-1" />
                        <div className="text-2xl font-bold">
                          ${stats.totalEarnings}
                        </div>
                        <div className="text-xs text-gray-600">
                          Total Earned
                        </div>
                      </div>
                    </div>

                    {stats.pendingEarnings > 0 && (
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-yellow-600" />
                          <span className="text-sm">Pending Earnings</span>
                        </div>
                        <span className="font-semibold">
                          ${stats.pendingEarnings}
                        </span>
                      </div>
                    )}

                    {/* Referral Code */}
                    {stats.referralCode ? (
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Your Referral Code
                        </label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            value={stats.referralCode}
                            readOnly
                            className="font-mono"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={copyReferralLink}
                          >
                            {copied ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Friends get 20% off, you earn 20% commission!
                        </p>
                      </div>
                    ) : (
                      <Button onClick={generateReferralCode} className="w-full">
                        Generate Referral Code
                      </Button>
                    )}

                    {/* Share Options */}
                    {stats.referralCode && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Share Your Code
                        </label>
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => shareOnSocial("twitter")}
                          >
                            Twitter
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => shareOnSocial("facebook")}
                          >
                            Facebook
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => shareOnSocial("linkedin")}
                          >
                            LinkedIn
                          </Button>
                        </div>

                        <div className="mt-3">
                          <Input
                            placeholder="Email addresses (comma separated)"
                            value={shareEmails}
                            onChange={(e) => setShareEmails(e.target.value)}
                            onKeyPress={(e) =>
                              e.key === "Enter" && shareViaEmail()
                            }
                          />
                          <Button
                            onClick={shareViaEmail}
                            disabled={!shareEmails || sharing}
                            className="w-full mt-2"
                            variant="outline"
                          >
                            <Share2 className="h-4 w-4 mr-2" />
                            {sharing ? "Sending..." : "Share via Email"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Terms */}
                    <p className="text-xs text-gray-500 text-center">
                      By participating, you agree to our{" "}
                      <a href="/terms#referral" className="underline">
                        referral terms
                      </a>
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">
                      Unable to load referral data
                    </p>
                    <Button onClick={fetchReferralStats} className="mt-4">
                      Retry
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
