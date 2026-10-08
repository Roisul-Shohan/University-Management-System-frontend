"use client";

import {
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  CalendarCheck,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  BookMarked,
  FileText,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./auth-provider";
import { GuideDialog } from "./_components/guide-dialog";
import type { User } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { notificationsApi } from "@/lib/notifications-api";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, active: true, href: "/" },
  {
    label: "Students",
    icon: Users,
    roles: ["SUPER_ADMIN", "TEACHER"] as User["role"][],
  },
  { label: "Courses", icon: BookOpen, href: "/courses" },
  {
    label: "Calendar",
    icon: CalendarDays,
    roles: ["TEACHER", "STUDENT"] as User["role"][],
  },
  {
    label: "Payments",
    icon: CreditCard,
    href: "/payments",
    roles: ["STUDENT"] as User["role"][],
  },
  {
    label: "Admissions",
    icon: FileText,
    href: "/admissions",
    roles: ["STUDENT"] as User["role"][],
  },
  {
    label: "Semester registration",
    icon: CalendarCheck,
    href: "/semester-registration",
    roles: ["STUDENT"] as User["role"][],
  },
  {
    label: "Course registration",
    icon: BookMarked,
    href: "/course-registration",
    roles: ["STUDENT"] as User["role"][],
  },
  {
    label: "Exams",
    icon: ClipboardList,
    href: "/exams",
    roles: ["STUDENT"] as User["role"][],
  },
  {
    label: "Exam attempts",
    icon: ClipboardList,
    href: "/exam-attempts",
    roles: ["STUDENT"] as User["role"][],
  },
  { label: "Notifications", icon: Bell, href: "/notifications" },
  {
    label: "Admission review",
    icon: ClipboardCheck,
    href: "/admission-review",
    roles: ["SUPER_ADMIN", "TEACHER"] as User["role"][],
  },
  {
    label: "Exam management",
    icon: ClipboardCheck,
    href: "/exam-management",
    roles: ["SUPER_ADMIN", "TEACHER"] as User["role"][],
  },
  {
    label: "Exam questions",
    icon: ClipboardList,
    href: "/exam-questions",
    roles: ["SUPER_ADMIN", "TEACHER"] as User["role"][],
  },
  {
    label: "Teachers",
    icon: Users,
    href: "/teachers",
    roles: ["SUPER_ADMIN", "TEACHER"] as User["role"][],
  },
];

const activity = [
  {
    title: "New admission application",
    detail: "Sarah Williams · BSc Computer Science",
    time: "12 min ago",
    tone: "violet",
  },
  {
    title: "Payment received",
    detail: "James Anderson · Semester fee",
    time: "48 min ago",
    tone: "emerald",
  },
  {
    title: "Course updated",
    detail: "Advanced Database Systems · CSE 402",
    time: "2 hrs ago",
    tone: "amber",
  },
];

export default function Home() {
  const router = useRouter();
  const { user: currentUser, loading: checkingSession, logout } = useAuth();
  const unreadNotifications = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: notificationsApi.unreadCount,
    enabled: !!currentUser,
    refetchInterval: 60_000,
    retry: false,
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!checkingSession && !currentUser) {
      router.replace("/login");
    }
  }, [checkingSession, currentUser, router]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="loading-screen">
        <div className="loading-mark">
          <GraduationCap size={22} />
        </div>
        <p>Loading your workspace...</p>
      </main>
    );
  }

  if (!currentUser) return null;

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <GraduationCap size={22} />
          </div>
          <div>
            <strong>Northstar</strong>
            <span>University</span>
          </div>
          <button
            className="mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace-label">Workspace</div>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems
            .filter(({ roles }) => !roles || roles.includes(currentUser.role))
            .map(({ label, icon: Icon, active, href }) =>
              href ? (
                <Link
                  className={`nav-item ${active ? "active" : ""}`}
                  href={href}
                  key={label}
                >
                  <Icon size={19} strokeWidth={active ? 2.4 : 2} />
                  <span>{label}</span>
                </Link>
              ) : (
                <button
                  className={`nav-item ${active ? "active" : ""}`}
                  key={label}
                >
                  <Icon size={19} strokeWidth={active ? 2.4 : 2} />
                  <span>{label}</span>
                  {label === "Students" && (
                    <span className="nav-count">1,248</span>
                  )}
                </button>
              ),
            )}
        </nav>
        <div className="workspace-label secondary-label">Manage</div>
        <nav className="main-nav">
          {(["SUPER_ADMIN", "TEACHER"] as User["role"][]).includes(
            currentUser.role,
          ) && (
            <Link className="nav-item" href="/curriculum-courses">
              <BookOpen size={19} />
              <span>Curriculum</span>
            </Link>
          )}
          {(["SUPER_ADMIN", "TEACHER"] as User["role"][]).includes(
            currentUser.role,
          ) && (
            <Link className="nav-item" href="/teachers">
              <Users size={19} />
              <span>Teachers</span>
            </Link>
          )}
          {currentUser.role === "SUPER_ADMIN" && (
            <>
              <Link className="nav-item" href="/academic-periods">
                <ShieldCheck size={19} />
                <span>Academic periods</span>
                <span className="nav-dot" />
              </Link>
              <Link className="nav-item" href="/departments">
                <Settings size={19} />
                <span>Departments</span>
              </Link>
              <Link className="nav-item" href="/semester-fees">
                <CreditCard size={19} />
                <span>Semester fees</span>
              </Link>
              <Link className="nav-item" href="/credit-fees">
                <CreditCard size={19} />
                <span>Credit fees</span>
              </Link>
            </>
          )}
          <button className="nav-item">
            <Settings size={19} />
            <span>Settings</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="help-card">
            <Sparkles size={19} />
            <strong>Need a hand?</strong>
            <p>Explore the admin guide to get started.</p>
            <GuideDialog />
          </div>
          <button
            className="profile-chip"
            onClick={handleLogout}
            disabled={loggingOut}
            title="Sign out"
          >
            <div className="avatar avatar-small">
              {getInitials(currentUser.name)}
            </div>
            <div>
              <strong>
                {loggingOut ? "Signing out..." : currentUser.name}
              </strong>
              <span>{formatRole(currentUser.role)}</span>
            </div>
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <button
          className="mobile-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <section className="main-content">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <div className="breadcrumb">
            <span>Workspace</span>
            <span>/</span>
            <strong>Overview</strong>
          </div>
          <div className="topbar-actions">
            <button className="icon-button search-button" aria-label="Search">
              <Search size={19} />
            </button>
            <Link
              href="/notifications"
              className="icon-button notification-button"
              aria-label="Notifications"
            >
              <Bell size={19} />
              {(unreadNotifications.data?.count ?? 0) > 0 && (
                <span className="notification-count">
                  {unreadNotifications.data?.count}
                </span>
              )}
            </Link>
            <div className="top-avatar">{getInitials(currentUser.name)}</div>
          </div>
        </header>

        <div className="content-wrap">
          <div className="welcome-row">
            <div>
              <p className="eyebrow">Wednesday, September 24, 2026</p>
              <h1>
                Good morning, {currentUser.name.split(" ")[0]} <span>👋</span>
              </h1>
              <p className="subtitle">
                Here&apos;s what&apos;s happening across your university today.
              </p>
            </div>
            <button className="period-button">
              Fall 2026 <ChevronDown size={16} />
            </button>
          </div>

          <div className="stats-grid">
            <StatCard
              label="Total students"
              value="1,248"
              change="12.8%"
              icon={<Users size={20} />}
              tone="blue"
            />
            <StatCard
              label="Active courses"
              value="86"
              change="4.6%"
              icon={<BookOpen size={20} />}
              tone="violet"
            />
            <StatCard
              label="Pending admissions"
              value="24"
              change="8.2%"
              icon={<ShieldCheck size={20} />}
              tone="amber"
            />
            <StatCard
              label="Fee collection"
              value="$84,620"
              change="18.4%"
              icon={<Sparkles size={20} />}
              tone="emerald"
            />
          </div>

          <div className="dashboard-grid">
            <section className="panel schedule-panel">
              <PanelHeading title="Today's schedule" action="View calendar" />
              <div className="schedule-list">
                <ScheduleItem
                  time="09:00"
                  period="AM"
                  title="Faculty meeting"
                  detail="Senate Room · Main Building"
                  color="blue"
                />
                <ScheduleItem
                  time="11:30"
                  period="AM"
                  title="Admissions review"
                  detail="3 applications awaiting review"
                  color="violet"
                />
                <ScheduleItem
                  time="02:00"
                  period="PM"
                  title="CSE Department sync"
                  detail="Innovation Hub · Room 204"
                  color="amber"
                />
              </div>
            </section>
            <section className="panel activity-panel">
              <PanelHeading title="Recent activity" action="View all" />
              <div className="activity-list">
                {activity.map((item) => (
                  <div className="activity-item" key={item.title}>
                    <div className={`activity-icon ${item.tone}`}>
                      <Sparkles size={16} />
                    </div>
                    <div className="activity-copy">
                      <strong>{item.title}</strong>
                      <span>{item.detail}</span>
                    </div>
                    <time>{item.time}</time>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="panel enrollment-panel">
            <PanelHeading
              title="Enrollment overview"
              action="Last 6 months"
              dropdown
            />
            <div className="chart-wrap">
              <div className="chart-y">
                <span>1,300</span>
                <span>1,000</span>
                <span>700</span>
                <span>400</span>
                <span>100</span>
              </div>
              <div className="chart">
                <div className="grid-lines">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <svg
                  viewBox="0 0 700 170"
                  preserveAspectRatio="none"
                  aria-label="Enrollment trend chart"
                >
                  <defs>
                    <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#6d5dfc" stopOpacity=".22" />
                      <stop offset="100%" stopColor="#6d5dfc" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 142 C45 138 58 114 105 121 S165 99 210 108 S267 74 315 91 S365 54 420 70 S475 50 525 57 S580 20 620 39 S668 24 700 12 V170 H0Z"
                    fill="url(#chartFill)"
                  />
                  <path
                    d="M0 142 C45 138 58 114 105 121 S165 99 210 108 S267 74 315 91 S365 54 420 70 S475 50 525 57 S580 20 620 39 S668 24 700 12"
                    fill="none"
                    stroke="#6d5dfc"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="chart-x">
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Aug</span>
                  <span>Sep</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  change,
  icon,
  tone,
}: {
  label: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-change">
        <span>↑ {change}</span> <small>vs last month</small>
      </div>
    </div>
  );
}

function PanelHeading({
  title,
  action,
  dropdown,
}: {
  title: string;
  action: string;
  dropdown?: boolean;
}) {
  return (
    <div className="panel-heading">
      <h2>{title}</h2>
      <button>
        {action}{" "}
        {dropdown ? <ChevronDown size={15} /> : <ArrowUpRight size={15} />}
      </button>
    </div>
  );
}

function ScheduleItem({
  time,
  period,
  title,
  detail,
  color,
}: {
  time: string;
  period: string;
  title: string;
  detail: string;
  color: string;
}) {
  return (
    <div className="schedule-item">
      <div className="schedule-time">
        <strong>{time}</strong>
        <span>{period}</span>
      </div>
      <div className={`schedule-marker ${color}`} />
      <div className="schedule-copy">
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      <MoreHorizontal size={18} className="muted-icon" />
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatRole(role: User["role"]) {
  return role === "SUPER_ADMIN" ? "Super administrator" : role.toLowerCase();
}
