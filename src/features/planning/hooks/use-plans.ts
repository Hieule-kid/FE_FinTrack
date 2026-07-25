"use client";

import { useCallback, useEffect, useReducer } from "react";
import {
  createPlanOfflineFirst,
  deletePlanOfflineFirst,
  fetchPlansOfflineFirst,
  updatePlanOfflineFirst,
} from "@/features/planning/offline/planning-client";
import type { Plan, CreatePlanPayload, UpdatePlanPayload } from "@/features/planning/types";
import { DATA_CHANGED_EVENT } from "@/lib/offline/types";

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

export function usePlans(): UsePlansResult {
  const [state, dispatch] = useReducer(reducer, {
    plans: [],
    isLoading: false,
    error: "",
    tick: 0,
  });

  const loadPlans = useCallback(async () => {
    dispatch({ type: "fetch" });
    try {
      const plans = await fetchPlansOfflineFirst();
      dispatch({ type: "success", plans });
    } catch {
      dispatch({ type: "error", message: "Failed to load plans." });
    }
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [state.tick, loadPlans]);

  useEffect(() => {
    function onDataChanged() {
      void loadPlans();
    }
    window.addEventListener(DATA_CHANGED_EVENT, onDataChanged);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, onDataChanged);
  }, [loadPlans]);

  const refetch = useCallback(() => dispatch({ type: "refetch" }), []);

  const createPlan = useCallback(async (payload: CreatePlanPayload) => {
    const plan = await createPlanOfflineFirst(payload);
    if (plan) dispatch({ type: "append", plan });
    else dispatch({ type: "error", message: "Failed to create plan." });
    return plan;
  }, []);

  const updatePlan = useCallback(async (id: string, payload: UpdatePlanPayload) => {
    const plan = await updatePlanOfflineFirst(id, payload);
    if (plan) dispatch({ type: "update", plan });
    else dispatch({ type: "error", message: "Failed to update plan." });
    return plan;
  }, []);

  const deletePlan = useCallback(async (id: string) => {
    const ok = await deletePlanOfflineFirst(id);
    if (ok) dispatch({ type: "remove", id });
    else dispatch({ type: "error", message: "Failed to delete plan." });
    return ok;
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
