"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, ShieldAlert, Trash2, X, LoaderCircle } from "lucide-react";
import { useAuthGuard } from "../../auth-provider";
import { examQuestionsApi, type ExamQuestion } from "@/lib/exam-questions-api";
import styles from "./exam-questions.module.css";

const questionSchema = z.object({
  questionText: z.string().trim().min(1, "Question text is required.").max(2000),
  marks: z.coerce.number().int().positive("Marks must be positive.").max(1000),
  order: z.coerce.number().int().positive("Order must be positive."),
  options: z
    .array(
      z.object({
        optionText: z.string().trim().min(1).max(500),
        isCorrect: z.boolean(),
        order: z.coerce.number().int().positive(),
      }),
    )
    .min(2, "At least two options are required.")
    .refine(
      (items) => new Set(items.map((item) => item.order)).size === items.length,
      {
        message: "Option orders must be unique.",
      },
    )
    .refine(
      (items) => items.filter((item) => item.isCorrect).length === 1,
      {
        message: "Exactly one option must be correct.",
      },
    ),
});

type QuestionValues = z.infer<typeof questionSchema>;

export default function ExamQuestionsPage() {
  const { user, loading: checkingAccess } = useAuthGuard([
    "SUPER_ADMIN",
    "TEACHER",
  ]);
  const searchParams = useSearchParams();
  const examId = searchParams.get("examId");
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<ExamQuestion | "create" | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const canManage = user?.role === "SUPER_ADMIN" || user?.role === "TEACHER";

  async function loadQuestions() {
    if (!examId) return;
    setLoading(true);
    setError("");
    try {
      const data = await examQuestionsApi.list(examId);
      setQuestions(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load exam questions.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user || !examId) return;
    void loadQuestions();
  }, [user, examId]);

  const form = useForm<QuestionValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      questionText: "",
      marks: 1,
      order: 1,
      options: [
        { optionText: "", isCorrect: true, order: 1 },
        { optionText: "", isCorrect: false, order: 2 },
      ],
    },
  });

  async function submit(values: QuestionValues) {
    if (!examId) return;
    setError("");
    try {
      if (modal === "create") {
        await examQuestionsApi.create(examId, values);
      } else if (modal && "id" in modal) {
        await examQuestionsApi.update(examId, modal.id, values);
      }
      setModal(null);
      void loadQuestions();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save question.",
      );
    }
  }

  async function deleteQuestion(questionId: string) {
    if (!window.confirm("Delete this question?")) return;
    if (!examId) return;
    setActionLoading(questionId);
    setError("");
    try {
      await examQuestionsApi.remove(examId, questionId);
      void loadQuestions();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete question.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  if (checkingAccess || !user)
    return <main className={styles.loading}>Checking access...</main>;

  if (!examId) {
    return (
      <main className="admin-page">
        <h1>Exam questions</h1>
        <p className={styles.empty}>Select an exam to manage its questions.</p>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="eyebrow">Academics / Assessments</p>
          <h1>Exam questions</h1>
          <p className="subtitle">
            Create and manage questions for this exam.
          </p>
        </div>
        {canManage && (
          <button className="primary-button" onClick={() => setModal("create")}>
            <Plus size={17} /> New question
          </button>
        )}
      </header>

      {error && (
        <div className="inline-error">
          <ShieldAlert size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>
          <LoaderCircle className="spin" size={21} /> Loading questions...
        </div>
      ) : questions.length === 0 ? (
        <div className={styles.empty}>
          <ShieldAlert size={25} />
          <strong>No questions yet</strong>
          <span>Create the first question for this exam.</span>
        </div>
      ) : (
        <section className={styles.list}>
          {questions.map((question) => (
            <article className={styles.card} key={question.id}>
              <div className={styles.cardHeader}>
                <div>
                  <h3>Question {question.order}</h3>
                  <span>{question.marks} marks</span>
                </div>
                {canManage && (
                  <div className={styles.actions}>
                    <button onClick={() => setModal(question)}>Edit</button>
                    <button
                      className={styles.danger}
                      disabled={actionLoading === question.id}
                      onClick={() => deleteQuestion(question.id)}
                    >
                      {actionLoading === question.id ? (
                        <LoaderCircle className="spin" size={14} />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                )}
              </div>
              <p>{question.questionText}</p>
              <div className={styles.options}>
                {question.options.map((option) => (
                  <div
                    key={option.order}
                    className={`${styles.option} ${option.isCorrect ? styles.correct : ""}`}
                  >
                    <span>{option.order}.</span>
                    <span>{option.optionText}</span>
                    {option.isCorrect && <span className={styles.badge}>Correct</span>}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      )}

      {modal && (
        <div className="modal-backdrop">
          <section className="period-modal">
            <div className="modal-heading">
              <div>
                <p className="eyebrow">Exam questions</p>
                <h2>{modal === "create" ? "New question" : "Edit question"}</h2>
              </div>
              <button className="close-button" onClick={() => setModal(null)}>
                <X size={18} />
              </button>
            </div>
            <form className="period-form" onSubmit={form.handleSubmit(submit)}>
              <label>
                Question text
                <textarea
                  {...form.register("questionText")}
                  rows={3}
                />
                {form.formState.errors.questionText && (
                  <span className="field-error">
                    {form.formState.errors.questionText.message}
                  </span>
                )}
              </label>
              <div className={styles.two}>
                <label>
                  Marks
                  <input type="number" {...form.register("marks")} />
                  {form.formState.errors.marks && (
                    <span className="field-error">
                      {form.formState.errors.marks.message}
                    </span>
                  )}
                </label>
                <label>
                  Order
                  <input type="number" {...form.register("order")} />
                  {form.formState.errors.order && (
                    <span className="field-error">
                      {form.formState.errors.order.message}
                    </span>
                  )}
                </label>
              </div>
              <div className={styles.sectionLabel}>Options</div>
              {form.watch("options").map((option, index) => (
                <div className={styles.optionRow} key={index}>
                  <label className={styles.optionLabel}>
                    <input
                      type="checkbox"
                      checked={option.isCorrect}
                      onChange={(e) => {
                        const current = form.getValues("options");
                        current[index].isCorrect = e.target.checked;
                        form.setValue("options", current);
                      }}
                    />
                    Correct
                  </label>
                  <input
                    {...form.register(`options.${index}.optionText`)}
                    placeholder={`Option ${index + 1}`}
                  />
                  <input
                    type="number"
                    {...form.register(`options.${index}.order`)}
                    placeholder="Order"
                  />
                  {form.formState.errors.options?.[index]?.optionText && (
                    <span className="field-error">
                      {form.formState.errors.options[index]?.optionText?.message}
                    </span>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  form.setValue("options", [
                    ...form.getValues("options"),
                    { optionText: "", isCorrect: false, order: form.getValues("options").length + 1 },
                  ])
                }
              >
                Add option
              </button>
              {form.formState.errors.options && (
                <span className="field-error">
                  {form.formState.errors.options.message}
                </span>
              )}
              {error && <p className="form-error">{error}</p>}
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
