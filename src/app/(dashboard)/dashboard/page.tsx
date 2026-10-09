"use client";

import {
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  CreditCard,
  LoaderCircle,
  MoreHorizontal,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth-provider";
import { dashboardApi } from "@/lib/dashboard-api";

export default function DashboardPage() {
  const { user: currentUser, loading: checkingSession } = useAuth();
  const statsQuery = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: dashboardApi.stats,
    enabled: !!currentUser,
  });
  const activityQuery = useQuery({
    queryKey: ["dashboard", "activity"],
    queryFn: dashboardApi.activity,
    enabled: !!currentUser,
  });
  const scheduleQuery = useQuery({
    queryKey: ["dashboard", "schedule"],
    queryFn: dashboardApi.schedule,
    enabled: !!currentUser,
  });

  if (checkingSession || !currentUser) return null;

  const role = currentUser.role;

  if (role === "SUPER_ADMIN") return <AdminDashboard stats={statsQuery.data} activity={activityQuery.data} schedule={scheduleQuery.data} statsLoading={statsQuery.isPending} activityLoading={activityQuery.isPending} scheduleLoading={scheduleQuery.isPending} />;
  if (role === "TEACHER") return <TeacherDashboard stats={statsQuery.data} activity={activityQuery.data} schedule={scheduleQuery.data} statsLoading={statsQuery.isPending} activityLoading={activityQuery.isPending} scheduleLoading={scheduleQuery.isPending} />;
  return <StudentDashboard stats={statsQuery.data} activity={activityQuery.data} schedule={scheduleQuery.data} statsLoading={statsQuery.isPending} activityLoading={activityQuery.isPending} scheduleLoading={scheduleQuery.isPending} user={currentUser} />;
}

function StatCard({ label, value, change, icon, tone }: { label: string; value: string | number; change: string; icon: React.ReactNode; tone: string }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {change !== "-" && <div className="stat-change"><span>↑ {change}</span> <small>vs last month</small></div>}
    </div>
  );
}

function PanelHeading({ title, action, dropdown }: { title: string; action: string; dropdown?: boolean }) {
  return (
    <div className="panel-heading">
      <h2>{title}</h2>
      <button>{action}{" "}{dropdown ? <ChevronDown size={15} /> : <ArrowUpRight size={15} />}</button>
    </div>
  );
}

function ScheduleItem({ time, period, title, detail, color }: { time: string; period: string; title: string; detail: string; color: string }) {
  return (
    <div className="schedule-item">
      <div className="schedule-time"><strong>{time}</strong> <span>{period}</span></div>
      <div className={`schedule-marker ${color}`} />
      <div className="schedule-copy"><strong>{title}</strong> <span>{detail}</span></div>
      <MoreHorizontal size={18} className="muted-icon" />
    </div>
  );
}

function AdminDashboard({ stats, activity, schedule, statsLoading, activityLoading, scheduleLoading }: any) {
  return (
    <div className="content-wrap">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
          <h1>Good morning, Admin <span>👋</span></h1>
          <p className="subtitle">University overview and key metrics.</p>
        </div>
        <button className="period-button">Fall 2026 <ChevronDown size={16} /></button>
      </div>
      <div className="stats-grid">
        <StatCard label="Total students" value={statsLoading ? "..." : stats?.totalStudents?.toLocaleString() ?? "0"} change={stats?.studentsChange ?? "-"} icon={<Users size={20} />} tone="blue" />
        <StatCard label="Active courses" value={statsLoading ? "..." : stats?.activeCourses?.toLocaleString() ?? "0"} change={stats?.coursesChange ?? "-"} icon={<BookOpen size={20} />} tone="violet" />
        <StatCard label="Pending admissions" value={statsLoading ? "..." : stats?.pendingAdmissions?.toLocaleString() ?? "0"} change={stats?.admissionsChange ?? "-"} icon={<ShieldCheck size={20} />} tone="amber" />
        <StatCard label="Fee collection" value={statsLoading ? "..." : `$${(stats?.feeCollection ?? 0).toLocaleString()}`} change={stats?.feeCollectionChange ?? "-"} icon={<Sparkles size={20} />} tone="emerald" />
        <StatCard label="Total teachers" value={statsLoading ? "..." : stats?.totalTeachers?.toLocaleString() ?? "0"} change="-" icon={<Users size={20} />} tone="blue" />
        <StatCard label="Total programs" value={statsLoading ? "..." : stats?.totalPrograms?.toLocaleString() ?? "0"} change="-" icon={<BookOpen size={20} />} tone="violet" />
      </div>
      <div className="dashboard-grid">
        <section className="panel schedule-panel">
          <PanelHeading title="Today's schedule" action="View calendar" />
          <div className="schedule-list">
            {scheduleLoading ? <div className="loading-state"><LoaderCircle className="spin" size={20} /></div> : (schedule?.length ?? 0) === 0 ? <div className="empty-state">No schedule</div> : schedule?.map((item: any, idx: number) => <ScheduleItem key={idx} time={item.time} period={item.period} title={item.title} detail={item.detail} color={item.color} />)}
          </div>
        </section>
        <section className="panel activity-panel">
          <PanelHeading title="Recent activity" action="View all" />
          <div className="activity-list">
            {activityLoading ? <div className="loading-state"><LoaderCircle className="spin" size={20} /></div> : (activity?.length ?? 0) === 0 ? <div className="empty-state">No recent activity</div> : activity?.map((item: any, idx: number) => (
              <div className="activity-item" key={idx}>
                <div className={`activity-icon ${item.tone}`}><Sparkles size={16} /></div>
                <div className="activity-copy"><strong>{item.title}</strong> <span>{item.detail}</span></div>
                <time>{new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function TeacherDashboard({ stats, activity, schedule, statsLoading, activityLoading, scheduleLoading }: any) {
  return (
    <div className="content-wrap">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
          <h1>Good morning, Teacher <span>👋</span></h1>
          <p className="subtitle">Your teaching overview.</p>
        </div>
      </div>
      <div className="stats-grid">
        <StatCard label="My courses" value={statsLoading ? "..." : stats?.myCourses?.toLocaleString() ?? "0"} change="-" icon={<BookOpen size={20} />} tone="blue" />
        <StatCard label="My students" value={statsLoading ? "..." : stats?.myStudents?.toLocaleString() ?? "0"} change="-" icon={<Users size={20} />} tone="violet" />
        <StatCard label="Published exams" value={statsLoading ? "..." : stats?.myExams?.toLocaleString() ?? "0"} change="-" icon={<ShieldCheck size={20} />} tone="amber" />
        <StatCard label="Pending grades" value={statsLoading ? "..." : stats?.pendingGrades?.toLocaleString() ?? "0"} change="-" icon={<Sparkles size={20} />} tone="emerald" />
      </div>
      <div className="dashboard-grid">
        <section className="panel schedule-panel">
          <PanelHeading title="Upcoming classes" action="View calendar" />
          <div className="schedule-list">
            {scheduleLoading ? <div className="loading-state"><LoaderCircle className="spin" size={20} /></div> : (schedule?.length ?? 0) === 0 ? <div className="empty-state">No upcoming classes</div> : schedule?.map((item: any, idx: number) => <ScheduleItem key={idx} time={item.time} period={item.period} title={item.title} detail={item.detail} color={item.color} />)}
          </div>
        </section>
        <section className="panel activity-panel">
          <PanelHeading title="Recent activity" action="View all" />
          <div className="activity-list">
            {activityLoading ? <div className="loading-state"><LoaderCircle className="spin" size={20} /></div> : (activity?.length ?? 0) === 0 ? <div className="empty-state">No recent activity</div> : activity?.map((item: any, idx: number) => (
              <div className="activity-item" key={idx}>
                <div className={`activity-icon ${item.tone}`}><Sparkles size={16} /></div>
                <div className="activity-copy"><strong>{item.title}</strong> <span>{item.detail}</span></div>
                <time>{new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function StudentDashboard({ stats, activity, schedule, statsLoading, activityLoading, scheduleLoading, user }: any) {
  return (
    <div className="content-wrap">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
          <h1>Good morning, {user.name.split(" ")[0]} <span>👋</span></h1>
          <p className="subtitle">Your academic overview.</p>
        </div>
      </div>
      <div className="stats-grid">
        <StatCard label="Enrolled courses" value={statsLoading ? "..." : stats?.enrolledCourses?.toLocaleString() ?? "0"} change="-" icon={<BookOpen size={20} />} tone="blue" />
        <StatCard label="Completed credits" value={statsLoading ? "..." : stats?.completedCredits?.toLocaleString() ?? "0"} change="-" icon={<Sparkles size={20} />} tone="violet" />
        <StatCard label="Upcoming exams" value={statsLoading ? "..." : stats?.upcomingExams?.toLocaleString() ?? "0"} change="-" icon={<ShieldCheck size={20} />} tone="amber" />
        <StatCard label="Pending payments" value={statsLoading ? "..." : stats?.pendingPayments?.toLocaleString() ?? "0"} change="-" icon={<CreditCard size={20} />} tone="emerald" />
      </div>
      <div className="dashboard-grid">
        <section className="panel schedule-panel">
          <PanelHeading title="Today's classes" action="View calendar" />
          <div className="schedule-list">
            {scheduleLoading ? <div className="loading-state"><LoaderCircle className="spin" size={20} /></div> : (schedule?.length ?? 0) === 0 ? <div className="empty-state">No classes today</div> : schedule?.map((item: any, idx: number) => <ScheduleItem key={idx} time={item.time} period={item.period} title={item.title} detail={item.detail} color={item.color} />)}
          </div>
        </section>
        <section className="panel activity-panel">
          <PanelHeading title="Recent activity" action="View all" />
          <div className="activity-list">
            {activityLoading ? <div className="loading-state"><LoaderCircle className="spin" size={20} /></div> : (activity?.length ?? 0) === 0 ? <div className="empty-state">No recent activity</div> : activity?.map((item: any, idx: number) => (
              <div className="activity-item" key={idx}>
                <div className={`activity-icon ${item.tone}`}><Sparkles size={16} /></div>
                <div className="activity-copy"><strong>{item.title}</strong> <span>{item.detail}</span></div>
                <time>{new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}