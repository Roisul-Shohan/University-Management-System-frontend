export default function PaymentsLoading() {
  return (
    <main className="loading-screen" aria-live="polite">
      <div className="loading-mark" aria-hidden="true">৳</div>
      <p>Loading payment details...</p>
    </main>
  );
}
