"use client";

import { ReactNode } from "react";
import LeadCaptureModal from "@/components/forms/LeadCaptureModal";
import { ExperimentProvider } from "@/components/providers/ExperimentProvider";
import ExperimentDashboard from "@/components/experiments/ExperimentDashboard";

interface ClientWrapperProps {
  children: ReactNode;
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  return (
    <ExperimentProvider>
      {children}
      {/* Lead Capture Modal - time-based trigger after 30 seconds */}
      <LeadCaptureModal trigger="time-based" delay={30} />
      {/* A/B Testing Dashboard - Development only */}
      <ExperimentDashboard />
    </ExperimentProvider>
  );
}
