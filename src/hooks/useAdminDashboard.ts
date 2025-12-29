import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, format } from "date-fns";

export type PeriodType = "today" | "7days" | "30days" | "this_month" | "3months" | "this_year" | "custom";

interface DateRange {
  start: Date;
  end: Date;
}

interface KPIData {
  value: number;
  previousValue: number;
  variation: number;
}

interface DashboardData {
  activeUsers: KPIData;
  totalUsers: KPIData;
  delinquentUsers: KPIData;
  revenue: KPIData;
  mrr: KPIData;
  totalPatients: KPIData;
  documentsGenerated: KPIData;
  articlesPublished: KPIData;
  articlesAwaitingCuration: number;
  articlesInReview: number;
  partnerClicks: KPIData;
  patientPartnerClicks: KPIData;
  openTickets: number;
  resolvedTickets: number;
  premiumUsersNearLimit: number;
}

interface ChartDataPoint {
  date: string;
  value: number;
}

interface PlanDistribution {
  plan: string;
  count: number;
  revenue: number;
}

interface DelinquentUser {
  id: string;
  email: string;
  plan: string;
  status: string;
  daysOverdue: number;
}

interface PremiumUserNearLimit {
  userId: string;
  email: string;
  patientsCount: number;
  limit: number;
}

interface CurationQueueItem {
  id: string;
  title: string;
  interest: string;
  status: string;
  requestedAt: string;
}

interface TopPartner {
  id: string;
  name: string;
  category: string;
  clicks: number;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  userId: string;
}

export interface Alert {
  id: string;
  type: string;
  message: string;
  severity: "info" | "warning" | "error" | "critical";
  action?: string;
}

export function useAdminDashboard() {
  const [period, setPeriod] = useState<PeriodType>("30days");
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Data states
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [revenueChart, setRevenueChart] = useState<ChartDataPoint[]>([]);
  const [planDistribution, setPlanDistribution] = useState<PlanDistribution[]>([]);
  const [delinquentUsers, setDelinquentUsers] = useState<DelinquentUser[]>([]);
  const [premiumUsersNearLimit, setPremiumUsersNearLimit] = useState<PremiumUserNearLimit[]>([]);
  const [curationQueue, setCurationQueue] = useState<CurationQueueItem[]>([]);
  const [topPartners, setTopPartners] = useState<TopPartner[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const dateRange = useMemo((): DateRange => {
    const now = new Date();
    switch (period) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "7days":
        return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
      case "30days":
        return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
      case "this_month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "3months":
        return { start: startOfDay(subMonths(now, 3)), end: endOfDay(now) };
      case "this_year":
        return { start: startOfYear(now), end: endOfYear(now) };
      case "custom":
        return customRange || { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
      default:
        return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
    }
  }, [period, customRange]);

  const previousDateRange = useMemo((): DateRange => {
    const diff = dateRange.end.getTime() - dateRange.start.getTime();
    return {
      start: new Date(dateRange.start.getTime() - diff),
      end: new Date(dateRange.start.getTime() - 1)
    };
  }, [dateRange]);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    return Boolean(roleData);
  };

  const calculateVariation = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const startDate = dateRange.start.toISOString();
      const endDate = dateRange.end.toISOString();
      const prevStartDate = previousDateRange.start.toISOString();
      const prevEndDate = previousDateRange.end.toISOString();

      // Fetch subscriptions data
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("*");

      const activeUsers = subscriptions?.filter(s => s.status === "active").length || 0;
      const delinquent = subscriptions?.filter(s => s.status === "past_due" || s.status === "unpaid") || [];

      // Fetch total users (using user_profiles as proxy)
      const { count: totalUsersCount } = await supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true });

      // Fetch patients count
      const { count: patientsInPeriod } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      const { count: patientsPrevious } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true })
        .gte("created_at", prevStartDate)
        .lte("created_at", prevEndDate);

      const { count: totalPatients } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true });

      // Fetch documents (reports + prescriptions)
      const { count: reportsCount } = await supabase
        .from("patient_evaluation_reports")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      const { count: prescriptionsCount } = await supabase
        .from("patient_prescriptions")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      const { count: reportsPrev } = await supabase
        .from("patient_evaluation_reports")
        .select("*", { count: "exact", head: true })
        .gte("created_at", prevStartDate)
        .lte("created_at", prevEndDate);

      const { count: prescriptionsPrev } = await supabase
        .from("patient_prescriptions")
        .select("*", { count: "exact", head: true })
        .gte("created_at", prevStartDate)
        .lte("created_at", prevEndDate);

      const docsInPeriod = (reportsCount || 0) + (prescriptionsCount || 0);
      const docsPrevious = (reportsPrev || 0) + (prescriptionsPrev || 0);

      // Fetch articles
      const { count: publishedArticles } = await supabase
        .from("curadoria_articles")
        .select("*", { count: "exact", head: true })
        .eq("status", "disponivel");

      const { count: awaitingCuration } = await supabase
        .from("curadoria_articles")
        .select("*", { count: "exact", head: true })
        .eq("status", "solicitada");

      const { count: inReview } = await supabase
        .from("curations")
        .select("*", { count: "exact", head: true })
        .eq("status", "em_revisao");

      // Fetch partner events
      const { count: partnerClicksCount } = await supabase
        .from("partner_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "professional_click")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      const { count: patientClicksCount } = await supabase
        .from("partner_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "patient_click")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      // Fetch support tickets
      const { count: openTicketsCount } = await supabase
        .from("support_tickets")
        .select("*", { count: "exact", head: true })
        .in("status", ["open", "pending", "in_progress"]);

      const { count: resolvedTicketsCount } = await supabase
        .from("support_tickets")
        .select("*", { count: "exact", head: true })
        .in("status", ["resolved", "closed"])
        .gte("resolved_at", startDate)
        .lte("resolved_at", endDate);

      // Fetch billing history for revenue
      const { data: payments } = await supabase
        .from("billing_history")
        .select("*")
        .eq("status", "paid")
        .gte("billing_date", startDate)
        .lte("billing_date", endDate);

      const { data: prevPayments } = await supabase
        .from("billing_history")
        .select("*")
        .eq("status", "paid")
        .gte("billing_date", prevStartDate)
        .lte("billing_date", prevEndDate);

      const currentRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const previousRevenue = prevPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      // Calculate MRR (active subscriptions * plan value)
      const planPrices: Record<string, number> = { basic: 0, premium: 197, pro: 497 };
      const mrr = subscriptions?.filter(s => s.status === "active")
        .reduce((sum, s) => sum + (planPrices[s.current_plan] || 0), 0) || 0;

      // Plan distribution
      const planCounts: Record<string, number> = { basic: 0, premium: 0, pro: 0 };
      subscriptions?.forEach(s => {
        if (s.status === "active" && planCounts[s.current_plan] !== undefined) {
          planCounts[s.current_plan]++;
        }
      });
      
      setPlanDistribution([
        { plan: "Básico", count: planCounts.basic, revenue: 0 },
        { plan: "Premium", count: planCounts.premium, revenue: planCounts.premium * 197 },
        { plan: "Pro", count: planCounts.pro, revenue: planCounts.pro * 497 },
      ]);

      // Count premium users near limit (need to check patient_portal_access)
      const { data: portalAccess } = await supabase
        .from("patient_portal_access")
        .select("professional_id")
        .eq("is_active", true);

      const professionalPatientCounts: Record<string, number> = {};
      portalAccess?.forEach(pa => {
        professionalPatientCounts[pa.professional_id] = (professionalPatientCounts[pa.professional_id] || 0) + 1;
      });

      const premiumSubs = subscriptions?.filter(s => s.current_plan === "premium" && s.status === "active") || [];
      const nearLimitUsers = premiumSubs.filter(s => {
        const count = professionalPatientCounts[s.user_id] || 0;
        return count >= 90;
      });

      setDashboardData({
        activeUsers: {
          value: activeUsers,
          previousValue: 0,
          variation: 0
        },
        totalUsers: {
          value: totalUsersCount || 0,
          previousValue: 0,
          variation: 0
        },
        delinquentUsers: {
          value: delinquent.length,
          previousValue: 0,
          variation: 0
        },
        revenue: {
          value: currentRevenue,
          previousValue: previousRevenue,
          variation: calculateVariation(currentRevenue, previousRevenue)
        },
        mrr: {
          value: mrr,
          previousValue: 0,
          variation: 0
        },
        totalPatients: {
          value: totalPatients || 0,
          previousValue: 0,
          variation: 0
        },
        documentsGenerated: {
          value: docsInPeriod,
          previousValue: docsPrevious,
          variation: calculateVariation(docsInPeriod, docsPrevious)
        },
        articlesPublished: {
          value: publishedArticles || 0,
          previousValue: 0,
          variation: 0
        },
        articlesAwaitingCuration: awaitingCuration || 0,
        articlesInReview: inReview || 0,
        partnerClicks: {
          value: partnerClicksCount || 0,
          previousValue: 0,
          variation: 0
        },
        patientPartnerClicks: {
          value: patientClicksCount || 0,
          previousValue: 0,
          variation: 0
        },
        openTickets: openTicketsCount || 0,
        resolvedTickets: resolvedTicketsCount || 0,
        premiumUsersNearLimit: nearLimitUsers.length
      });

      // Generate alerts
      const generatedAlerts: Alert[] = [];

      if (delinquent.length > 0) {
        generatedAlerts.push({
          id: "delinquent",
          type: "payment",
          message: `${delinquent.length} usuário(s) inadimplente(s)`,
          severity: delinquent.length > 5 ? "error" : "warning",
          action: "delinquent"
        });
      }

      if (nearLimitUsers.length > 0) {
        generatedAlerts.push({
          id: "premium_limit",
          type: "capacity",
          message: `${nearLimitUsers.length} usuário(s) Premium perto do limite`,
          severity: "warning",
          action: "premium_limit"
        });
      }

      if ((awaitingCuration || 0) > 5) {
        generatedAlerts.push({
          id: "curation_queue",
          type: "content",
          message: `${awaitingCuration} artigo(s) aguardando curadoria`,
          severity: "info",
          action: "curation"
        });
      }

      if (currentRevenue < previousRevenue * 0.9 && previousRevenue > 0) {
        generatedAlerts.push({
          id: "revenue_drop",
          type: "financial",
          message: `Queda de ${calculateVariation(currentRevenue, previousRevenue)}% na receita`,
          severity: "error",
          action: "revenue"
        });
      }

      setAlerts(generatedAlerts);

      // Fetch curation queue
      const { data: curationData } = await supabase
        .from("curadoria_articles")
        .select("id, title, interest, status, created_at")
        .in("status", ["solicitada", "em_analise", "em_producao"])
        .order("created_at", { ascending: true })
        .limit(10);

      setCurationQueue(curationData?.map(c => ({
        id: c.id,
        title: c.title,
        interest: c.interest,
        status: c.status,
        requestedAt: c.created_at
      })) || []);

      // Fetch top partners
      const { data: partnerEventsData } = await supabase
        .from("partner_events")
        .select("partner_id")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      const partnerClickCounts: Record<string, number> = {};
      partnerEventsData?.forEach(e => {
        partnerClickCounts[e.partner_id] = (partnerClickCounts[e.partner_id] || 0) + 1;
      });

      const { data: partnersData } = await supabase
        .from("partners")
        .select("id, name, product_type")
        .eq("is_active", true);

      const topPartnersResult = partnersData
        ?.map(p => ({
          id: p.id,
          name: p.name,
          category: p.product_type,
          clicks: partnerClickCounts[p.id] || 0
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5) || [];

      setTopPartners(topPartnersResult);

      // Fetch recent support tickets
      const { data: ticketsData } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      setSupportTickets(ticketsData?.map(t => ({
        id: t.id,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        createdAt: t.created_at,
        userId: t.user_id
      })) || []);

      // Generate revenue chart data
      const chartData: ChartDataPoint[] = [];
      const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 31) {
        // Daily data
        for (let i = 0; i <= daysDiff; i++) {
          const date = new Date(dateRange.start);
          date.setDate(date.getDate() + i);
          const dateStr = format(date, "yyyy-MM-dd");
          const dayRevenue = payments
            ?.filter(p => p.billing_date?.startsWith(dateStr))
            .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
          chartData.push({
            date: format(date, "dd/MM"),
            value: dayRevenue
          });
        }
      } else {
        // Weekly/monthly data
        let currentDate = new Date(dateRange.start);
        while (currentDate <= dateRange.end) {
          const weekEnd = new Date(currentDate);
          weekEnd.setDate(weekEnd.getDate() + 7);
          const weekRevenue = payments
            ?.filter(p => {
              const pDate = new Date(p.billing_date);
              return pDate >= currentDate && pDate < weekEnd;
            })
            .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
          chartData.push({
            date: format(currentDate, "dd/MM"),
            value: weekRevenue
          });
          currentDate = weekEnd;
        }
      }
      setRevenueChart(chartData);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const admin = await checkAdminAccess();
      setIsAdmin(admin);
      if (admin) {
        fetchDashboardData();
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    }
  }, [period, customRange]);

  return {
    period,
    setPeriod,
    customRange,
    setCustomRange,
    dateRange,
    isLoading,
    isAdmin,
    dashboardData,
    revenueChart,
    planDistribution,
    delinquentUsers,
    premiumUsersNearLimit,
    curationQueue,
    topPartners,
    supportTickets,
    alerts,
    refresh: fetchDashboardData
  };
}