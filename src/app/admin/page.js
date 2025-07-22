"use client";

import { useState } from "react";
import UserListModal from "@/components/admin/UserListModal";
import TestListModal from "@/components/admin/TestListModal";
import RestrictedTestsModal from "@/components/admin/RestrictedTestsModal";
import TestAttemptsModal from "@/components/admin/TestAttemptsModal";
import AttemptDetailsModal from "@/components/admin/AttemptDetailsModal";
import DataCalculationManager from "@/components/admin/DataCalculationManager";
import LazyAdminStats from "@/components/admin/LazyAdminStats";

export default function AdminDashboardPage() {
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isRestrictedModalOpen, setIsRestrictedModalOpen] = useState(false);
  const [isAttemptsModalOpen, setIsAttemptsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAttemptDetails, setSelectedAttemptDetails] = useState(null);

  const handleAttemptRowClick = (details) => {
    setSelectedAttemptDetails(details);
    setIsAttemptsModalOpen(false);
    setIsDetailsModalOpen(true);
  };

  const handleDetailsModalClose = () => {
    setIsDetailsModalOpen(false);
    setSelectedAttemptDetails(null);
    setIsAttemptsModalOpen(true);
  };

  // This handler now correctly opens modals without interfering with analytics state
  const handleCardClick = (cardType) => {
    // These keys match the keys in STAT_CONFIG
    switch (cardType) {
      case "users":
        setIsUserModalOpen(true);
        break;
      case "tests":
        setIsTestModalOpen(true);
        break;
      case "restricted":
        setIsRestrictedModalOpen(true);
        break;
      case "attempts":
        setIsAttemptsModalOpen(true);
        break;
      default:
        // For cards that are not clickable, do nothing
        break;
    }
  };

  return (
    <>
      <UserListModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
      />
      <TestListModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />
      <RestrictedTestsModal
        isOpen={isRestrictedModalOpen}
        onClose={() => setIsRestrictedModalOpen(false)}
      />
      <TestAttemptsModal
        isOpen={isAttemptsModalOpen}
        onClose={() => setIsAttemptsModalOpen(false)}
        onRowClick={handleAttemptRowClick}
      />
      <AttemptDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleDetailsModalClose}
        details={selectedAttemptDetails}
      />

      <div>
        <h1 className='text-3xl font-bold text-slate-900 mb-6'>
          Admin Dashboard
        </h1>

        <LazyAdminStats onCardClick={handleCardClick} />

        <DataCalculationManager />

        <div className='mt-8 bg-white p-6 rounded-2xl shadow-lg'>
          <h2 className='text-xl font-semibold text-slate-900'>
            Welcome, Admin!
          </h2>
          <p className='mt-2 text-slate-700'>
            Use the sidebar navigation on the left to manage all website
            content.
          </p>
        </div>
      </div>
    </>
  );
}
