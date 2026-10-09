"use client";

import {
    Bell,
    BookOpen,
    CalendarDays,
    CalendarCheck,
    ClipboardCheck,
    ClipboardList,
    CreditCard,
    BookMarked,
    FileText,
    GraduationCap,
    LayoutDashboard,
    LogOut,
    Menu,
    Search,
    Settings,
    ShieldCheck,
    Sparkles,
    Users,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth-provider";
import { GuideDialog } from "../_components/guide-dialog";
import type { User } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { notificationsApi } from "@/lib/notifications-api";

const navItems = [
    { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Students", icon: Users, roles: ["SUPER_ADMIN"] as User["role"][], href: "/students" },
    { label: "Programs", icon: GraduationCap, roles: ["SUPER_ADMIN", "TEACHER"] as User["role"][], href: "/programs" },
    { label: "Courses", icon: BookOpen, roles: ["SUPER_ADMIN", "TEACHER"] as User["role"][], href: "/courses" },
    { label: "Calendar", icon: CalendarDays, roles: ["TEACHER", "STUDENT"] as User["role"][], href: "/calendar" },
    { label: "Payments", icon: CreditCard, href: "/payments", roles: ["STUDENT"] as User["role"][] },
    { label: "Admissions", icon: FileText, href: "/admissions", roles: ["STUDENT"] as User["role"][] },
    { label: "Semester registration", icon: CalendarCheck, href: "/semester-registration", roles: ["STUDENT"] as User["role"][] },
    { label: "Course registration", icon: BookMarked, href: "/course-registration", roles: ["STUDENT"] as User["role"][] },
    { label: "Exams", icon: ClipboardList, href: "/exams", roles: ["STUDENT"] as User["role"][] },
    { label: "Attendance", icon: CalendarDays, href: "/attendance", roles: ["TEACHER", "STUDENT"] as User["role"][] },
    { label: "Exam attempts", icon: ClipboardList, href: "/exam-attempts", roles: ["STUDENT"] as User["role"][] },
    { label: "Notifications", icon: Bell, href: "/notifications" },
    { label: "Admission review", icon: ClipboardCheck, href: "/admission-review", roles: ["SUPER_ADMIN", "TEACHER"] as User["role"][] },
    { label: "Exam management", icon: ClipboardCheck, href: "/exam-management", roles: ["TEACHER"] as User["role"][] },
    { label: "Exam questions", icon: ClipboardList, href: "/exam-questions", roles: ["TEACHER"] as User["role"][] },
    { label: "Teachers", icon: Users, href: "/teachers", roles: ["SUPER_ADMIN"] as User["role"][] },
];

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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
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
                    <Link href="/" className="brand-mark">
                        <GraduationCap size={22} />
                    </Link>
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
                        .map(({ label, icon: Icon, href }) => {
                            const isActive = pathname === href || (pathname.startsWith(href + "/") && href !== "/dashboard") || (href === "/dashboard" && pathname.startsWith("/dashboard/"));
                            return (
                                <Link
                                    className={`nav-item ${isActive ? "active" : ""}`}
                                    href={href}
                                    key={label}
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <Icon size={19} strokeWidth={isActive ? 2.4 : 2} />
                                    <span>{label}</span>
                                </Link>
                            );
                        })}
                </nav>
                <div className="workspace-label secondary-label">Manage</div>
                <nav className="main-nav">
                    {(["SUPER_ADMIN", "TEACHER"] as User["role"][]).includes(
                        currentUser.role,
                    ) && (
                            <Link className="nav-item" href="/curriculum-courses" onClick={() => setMobileOpen(false)}>
                                <BookOpen size={19} />
                                <span>Curriculum</span>
                            </Link>
                        )}
                    {(["SUPER_ADMIN", "TEACHER"] as User["role"][]).includes(
                        currentUser.role,
                    ) && (
                            <Link className="nav-item" href="/teachers" onClick={() => setMobileOpen(false)}>
                                <Users size={19} />
                                <span>Teachers</span>
                            </Link>
                        )}
                    {currentUser.role === "SUPER_ADMIN" && (
                        <>
                            <Link className="nav-item" href="/academic-periods" onClick={() => setMobileOpen(false)}>
                                <ShieldCheck size={19} />
                                <span>Academic periods</span>
                                <span className="nav-dot" />
                            </Link>
                            <Link className="nav-item" href="/departments" onClick={() => setMobileOpen(false)}>
                                <Settings size={19} />
                                <span>Departments</span>
                            </Link>
                            <Link className="nav-item" href="/semester-fees" onClick={() => setMobileOpen(false)}>
                                <CreditCard size={19} />
                                <span>Semester fees</span>
                            </Link>
                            <Link className="nav-item" href="/credit-fees" onClick={() => setMobileOpen(false)}>
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
                {children}
            </section>
        </main>
    );
}
