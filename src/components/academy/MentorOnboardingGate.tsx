import { ReactNode, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMyMentorProfile, useOnboardingChecklist } from '@/hooks/useMentorOnboarding';

interface MentorOnboardingGateProps {
  children: ReactNode;
}

// Routes that should NOT trigger redirect
const EXCLUDED_ROUTES = [
  '/academy/mentor/onboarding',
  '/academy/mentores/candidatar',
  '/academy/aprovacoes/mentores',
];

/**
 * Gate component for Academy routes.
 * Redirects mentors with pending_review status or incomplete onboarding
 * to the onboarding page.
 */
export function MentorOnboardingGate({ children }: MentorOnboardingGateProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: mentorProfile, isLoading: profileLoading } = useMyMentorProfile();
  const { checklist, isLoading: checklistLoading } = useOnboardingChecklist();

  const isLoading = profileLoading || checklistLoading;
  const currentPath = location.pathname;

  useEffect(() => {
    // Skip if still loading
    if (isLoading) return;

    // Skip if current route is excluded
    if (EXCLUDED_ROUTES.some(route => currentPath.startsWith(route))) return;

    // Skip if user is not a mentor (no mentor profile)
    if (!mentorProfile) return;

    // Skip if mentor is approved
    if (mentorProfile.status === 'approved') return;

    // Redirect if mentor is pending_review and onboarding incomplete
    if (mentorProfile.status === 'pending_review') {
      // If checklist is incomplete, redirect
      if (!checklist?.isComplete) {
        navigate('/academy/mentor/onboarding', { replace: true });
        return;
      }
      // Even with complete checklist, redirect to onboarding if pending_review
      // so they can see their status
      navigate('/academy/mentor/onboarding', { replace: true });
    }
  }, [isLoading, mentorProfile, checklist, currentPath, navigate]);

  return <>{children}</>;
}

export default MentorOnboardingGate;
