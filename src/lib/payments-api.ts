import { apiRequest } from "./api";

export type AdmissionStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CONFIRMED"
  | "CANCELLED";

export type PaymentTransaction = {
  id: string;
  amount: string | number;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  bkashPaymentId?: string | null;
  bkashTrxId?: string | null;
  paidAt?: string | null;
  createdAt: string;
};

export type Admission = {
  id: string;
  admissionYear: number;
  admissionFee: string | number;
  status: AdmissionStatus;
  createdAt: string;
  program?: {
    degreeType: string;
    department?: { name: string };
  };
  transactions?: PaymentTransaction[];
};

export type AdmissionPayment = {
  transaction: PaymentTransaction;
  bkash: {
    paymentID: string;
    bkashURL: string;
    transactionStatus?: string;
  };
};

export type PaymentStatus = {
  transaction: PaymentTransaction;
  bkash?: {
    paymentID: string;
    trxID?: string | null;
    transactionStatus?: string;
  } | null;
  message?: string;
};

export const admissionsApi = {
  mine: () => apiRequest<Admission[]>("/admissions/my"),
};

export const paymentsApi = {
  initiateAdmission: (admissionId: string) =>
    apiRequest<AdmissionPayment>(`/api/payments/admission/${admissionId}`, {
      method: "POST",
    }),
  status: (transactionId: string) =>
    apiRequest<PaymentStatus>(`/api/payments/${transactionId}/status`),
};
