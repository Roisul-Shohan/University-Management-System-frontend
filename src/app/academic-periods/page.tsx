"use client";

import {
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  LoaderCircle,
  Plus,
  ShieldAlert,
  ToggleLeft,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  academicPeriodsApi,
  academicPeriodTypes,
  type AcademicPeriod,
  type AcademicPeriodType,
  authApi,
  type User,
} from "@/lib/api";

const labels: Record<AcademicPeriodType, string> = {
  ADMISSION: "Admissions",
  SEMESTER_REGISTRATION: "Semester registration",
  COURSE_REGISTRATION: "Course registration",
  MIDTERM_EXAM: "Midterm exams",
  FINAL_EXAM: "Final exams",
  RESULT_PUBLICATION: "Result publication",
};

export default function AcademicPeriodsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [type, setType] = useState<AcademicPeriodType | "">("");
  const [activeFilter, setActiveFilter] = useState<"" | "true" | "false">("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const loadPeriods = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await academicPeriodsApi.list({
        page,
        type: type || undefined,
        isActive: activeFilter === "" ? undefined : activeFilter === "true",
      });
      setPeriods(result.data);
      setTotal(result.meta?.total ?? 0);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load academic periods.",
      );
    } finally {
      setLoading(false);
    }
  }, [activeFilter, page, type]);

  useEffect(() => {
    authApi
      .me()
      .then((currentUser) => {
        if (currentUser.role !== "SUPER_ADMIN") {
          router.replace("/");
          return;
        }
        setUser(currentUser);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(() => void loadPeriods(), 0);
    return () => window.clearTimeout(timer);
  }, [loadPeriods, user]);

  async function togglePeriod(period: AcademicPeriod) {
    setActionId(period.id);
    setError("");
    try {
      await academicPeriodsApi.setActive(period.id, !period.isActive);
      await loadPeriods();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update this period.",
      );
    } finally {
      setActionId(null);
    }
  }

  if (!user)
    return (
      <main className="loading-screen">
        <div className="loading-mark">
          <CalendarClock size={22} />
        </div>
        <p>Checking administrator access...</p>
      </main>
    );

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="eyebrow">Administration / Academic calendar</p>
          <h1>Academic periods</h1>
          <p className="subtitle">
            Control the windows that open registration, examinations, and
            results.
          </p>
        </div>
        <button className="primary-button" onClick={() => setShowCreate(true)}>
          <Plus size={17} /> New period
        </button>
      </header>
      <div className="period-toolbar">
        <div className="toolbar-title">
          <CalendarClock size={18} />
          <span>{total} scheduled periods</span>
        </div>
        <div className="filter-group">
          <Filter size={15} />
          <select
            value={type}
            onChange={(event) => {
              setType(event.target.value as AcademicPeriodType | "");
              setPage(1);
            }}
          >
            <option value="">All types</option>
            {academicPeriodTypes.map((periodType) => (
              <option key={periodType} value={periodType}>
                {labels[periodType]}
              </option>
            ))}
          </select>
          <select
            value={activeFilter}
            onChange={(event) => {
              setActiveFilter(event.target.value as "" | "true" | "false");
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="true">Active only</option>
            <option value="false">Inactive only</option>
          </select>
        </div>
      </div>
      {error && (
        <div className="inline-error">
          <ShieldAlert size={16} />
          {error}
        </div>
      )}
      <section className="period-table-card">
        <div className="period-table-head">
          <span>Period</span>
          <span>Schedule</span>
          <span>Status</span>
          <span>Action</span>
        </div>
        {loading ? (
          <div className="table-state">
            <LoaderCircle className="spin" size={21} />
            Loading periods...
          </div>
        ) : periods.length === 0 ? (
          <div className="table-state">
            <CalendarClock size={24} />
            <strong>No academic periods found</strong>
            <span>Try changing your filters or create a new period.</span>
          </div>
        ) : (
          periods.map((period) => (
            <div className="period-row" key={period.id}>
              <div className="period-name">
                <div
                  className={`period-icon ${period.isActive ? "active" : ""}`}
                >
                  <CalendarClock size={17} />
                </div>
                <div>
                  <strong>{labels[period.type]}</strong>
                  <small>{period.type.replaceAll("_", " ")}</small>
                </div>
              </div>
              <div className="period-dates">
                <strong>{formatDate(period.startDate)}</strong>
                <span>to</span>
                <strong>{formatDate(period.endDate)}</strong>
              </div>
              <div>
                <span
                  className={`status-pill ${period.isActive ? "active" : "inactive"}`}
                >
                  <i />
                  {period.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <button
                className={`toggle-button ${period.isActive ? "enabled" : ""}`}
                disabled={actionId === period.id}
                onClick={() => togglePeriod(period)}
              >
                {actionId === period.id ? (
                  <LoaderCircle className="spin" size={16} />
                ) : period.isActive ? (
                  <Check size={16} />
                ) : (
                  <ToggleLeft size={17} />
                )}
                <span>{period.isActive ? "Active" : "Activate"}</span>
              </button>
            </div>
          ))
        )}
      </section>
      <div className="pagination">
        <span>
          Showing {periods.length ? (page - 1) * 8 + 1 : 0}–
          {Math.min((page - 1) * 8 + periods.length, total)} of {total}
        </span>
        <div>
          <button
            disabled={page === 1 || loading}
            onClick={() => setPage((current) => current - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="page-number">{page}</span>
          <button
            disabled={page * 8 >= total || loading}
            onClick={() => setPage((current) => current + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      {showCreate && (
        <CreatePeriodModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            setPage(1);
            loadPeriods();
          }}
        />
      )}
    </main>
  );
}

function CreatePeriodModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [type, setType] = useState<AcademicPeriodType>("ADMISSION");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await academicPeriodsApi.create({ type, startDate, endDate });
      onCreated();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create this period.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <section className="period-modal">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Academic calendar</p>
            <h2>Create a period</h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form className="period-form" onSubmit={handleSubmit}>
          <label>
            Period type
            <select
              value={type}
              onChange={(event) =>
                setType(event.target.value as AcademicPeriodType)
              }
            >
              {academicPeriodTypes.map((periodType) => (
                <option key={periodType} value={periodType}>
                  {labels[periodType]}
                </option>
              ))}
            </select>
          </label>
          <div className="date-fields">
            <label>
              Starts
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                required
              />
            </label>
            <label>
              Ends
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                required
              />
            </label>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Creating..." : "Create period"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
