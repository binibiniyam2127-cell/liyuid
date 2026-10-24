import {
  AnswerVerificationResponse,
  ChatMessageResponse,
  FinderRequestResponse,
  PhotoVerificationResponse,
  ProofVerificationResponse,
  QuestionResponse,
  ReviewRequestResponse,
  VerificationStateResponse,
} from "@/lib/types";
import { request } from "./client";

export const matchesApi = {
  // Verification Pipeline (Asymmetric / Blind Verification)
  async getVerificationState(matchId: string): Promise<VerificationStateResponse> {
    return request<VerificationStateResponse>(`/matches/${matchId}/verification`, {
      method: "GET",
    });
  },

  async submitVerificationPhoto(matchId: string, file: File): Promise<PhotoVerificationResponse> {
    const formData = new FormData();
    formData.append("file", file);

    return request<PhotoVerificationResponse>(`/matches/${matchId}/verification/photo`, {
      method: "POST",
      body: formData,
    });
  },

  async submitVerificationProof(matchId: string, proofAttempt: string): Promise<ProofVerificationResponse> {
    return request<ProofVerificationResponse>(`/matches/${matchId}/verification/proof`, {
      method: "POST",
      body: JSON.stringify({ proof_attempt: proofAttempt }),
    });
  },

  async getVerificationQuestion(matchId: string): Promise<QuestionResponse> {
    return request<QuestionResponse>(`/matches/${matchId}/verification/question`, {
      method: "GET",
    });
  },

  async submitVerificationAnswer(matchId: string, optionId: string): Promise<AnswerVerificationResponse> {
    return request<AnswerVerificationResponse>(`/matches/${matchId}/verification/answer`, {
      method: "POST",
      body: JSON.stringify({ option_id: optionId }),
    });
  },

  async requestReview(matchId: string, reason: string): Promise<ReviewRequestResponse> {
    return request<ReviewRequestResponse>(`/matches/${matchId}/verification/request-review`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  // Finder Requests & Anonymous Chat
  async getFinderRequests(): Promise<FinderRequestResponse[]> {
    return request<FinderRequestResponse[]>("/finder/requests", {
      method: "GET",
    });
  },

  async acceptFinderRequest(reqId: string): Promise<{ status: string }> {
    return request<{ status: string }>(`/finder/requests/${reqId}/accept`, {
      method: "POST",
    });
  },

  async deferFinderRequest(reqId: string): Promise<{ status: string }> {
    return request<{ status: string }>(`/finder/requests/${reqId}/defer`, {
      method: "POST",
    });
  },

  async getChatMessages(matchId: string): Promise<ChatMessageResponse[]> {
    return request<ChatMessageResponse[]>(`/matches/${matchId}/chat`, {
      method: "GET",
    });
  },

  async sendChatMessage(matchId: string, text: string): Promise<ChatMessageResponse> {
    return request<ChatMessageResponse>(`/matches/${matchId}/chat`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  },
};
