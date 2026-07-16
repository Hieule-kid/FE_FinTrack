"use client";

import { useCallback, useEffect, useReducer } from "react";
import { http, HttpError } from "@/services/http";
import type { Plan, ResponsePlanning, CreatePlanPayload, UpdatePlanPayload } from "@/features/planning/types";

const PLANS_PATH = "/api/planning/api/v1/plans";

interface UsePlansResult {
  plans: Plan[];
  isLoading: boolean;
  error: string;
  refetch: () => void;
  createPlan: (payload: CreatePlanPayload) => Promise<Plan | null>;
  updatePlan: (id: string, payload: UpdatePlanPayload) => Promise<Plan | null>;
  deletePlan: (id: string) => Promise<boolean>;
}

type State = { plans: Plan[]; isLoading: boolean; error: string; tick: number };
type Action =
  | { type: "fetch" }
  | { type: "success"; plans: Plan[] }
  | { type: "error"; message: string }
  | { type: "append"; plan: Plan }
  | { type: "update"; plan: Plan }
  | { type: "remove"; id: string }
  | { type: "refetch" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "fetch":
      return { ...state, isLoading: true, error: "" };
    case "success":
      return { ...state, plans: action.plans, isLoading: false };
    case "error":
      return { ...state, isLoading: false, error: action.message };
    case "append":
      return { ...state, plans: [...state.plans, action.plan] };
    case "update":
      return { ...state, plans: state.plans.map((p) => (p.id === action.plan.id ? action.plan : p)) };
    case "remove":
      return { ...state, plans: state.plans.filter((p) => p.id !== action.id) };
    case "refetch":
      return { ...state, tick: state.tick + 1 };
    default:
      return state;
  }
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpError) {
    const data = error.data as { message?: string } | null;
    if (data?.message) return data.message;
  }
  return fallback;
}

export function usePlans(): UsePlansResult {
  const [state, dispatch] = useReducer(reducer, {
    plans: [],
    isLoading: false,
    error: "",
    tick: 0,
  });

  useEffect(() => {
    dispatch({ type: "fetch" });
    http
      .get<ResponsePlanning<Plan[]>>(PLANS_PATH, { useBaseUrl: false })
      .then((res) => dispatch({ type: "success", plans: res.data ?? [] }))
      .catch((err) =>
        dispatch({ type: "error", message: extractErrorMessage(err, "Failed to load plans.") }),
      );
  }, [state.tick]);

  const refetch = useCallback(() => dispatch({ type: "refetch" }), []);

  const createPlan = useCallback(async (payload: CreatePlanPayload) => {
    try {
      const res = await http.post<ResponsePlanning<Plan>>(PLANS_PATH, payload, { useBaseUrl: false });
      const plan = res.data ?? null;
      if (plan) dispatch({ type: "append", plan });
      return plan;
    } catch (err) {
      dispatch({ type: "error", message: extractErrorMessage(err, "Failed to create plan.") });
      return null;
    }
  }, []);

  const updatePlan = useCallback(async (id: string, payload: UpdatePlanPayload) => {
    try {
      const res = await http.put<ResponsePlanning<Plan>>(`${PLANS_PATH}/${id}`, payload, { useBaseUrl: false });
      const plan = res.data ?? null;
      if (plan) dispatch({ type: "update", plan });
      return plan;
    } catch (err) {
      dispatch({ type: "error", message: extractErrorMessage(err, "Failed to update plan.") });
      return null;
    }
  }, []);

  const deletePlan = useCallback(async (id: string) => {
    try {
      await http.delete<ResponsePlanning<null>>(`${PLANS_PATH}/${id}`, { useBaseUrl: false });
      dispatch({ type: "remove", id });
      return true;
    } catch (err) {
      dispatch({ type: "error", message: extractErrorMessage(err, "Failed to delete plan.") });
      return false;
    }
  }, []);

  return {
    plans: state.plans,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
    createPlan,
    updatePlan,
    deletePlan,
  };
}
