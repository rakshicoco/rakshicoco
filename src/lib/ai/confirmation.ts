import { createFarm } from "@/lib/actions/farm";
import { moveToTrash } from "@/lib/actions/recycle_bin";
import { logAudit } from "@/lib/actions/utils";

export interface PendingAction {
  id: string;
  userId: string;
  toolName: string;
  parameters: Record<string, any>;
  summary: string;
  createdAt: number;
  expiresAt: number;
}

// In-memory server pending action cache with 10-minute TTL
const pendingActionsMap = new Map<string, PendingAction>();

export function createPendingAction(
  userId: string,
  toolName: string,
  parameters: Record<string, any>,
  summary: string
): PendingAction {
  const id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = Date.now();
  const expiresAt = now + 10 * 60 * 1000; // 10 minutes

  const action: PendingAction = {
    id,
    userId,
    toolName,
    parameters,
    summary,
    createdAt: now,
    expiresAt,
  };

  pendingActionsMap.set(id, action);
  return action;
}

export function getPendingAction(userId: string, actionId: string): PendingAction | null {
  const action = pendingActionsMap.get(actionId);
  if (!action) return null;
  if (action.userId !== userId) return null;
  if (Date.now() > action.expiresAt) {
    pendingActionsMap.delete(actionId);
    return null;
  }
  return action;
}

export async function executePendingAction(userId: string, actionId: string) {
  const action = getPendingAction(userId, actionId);
  if (!action) {
    throw new Error("Pending action expired or invalid. Please re-initiate through Rakshi AI.");
  }

  // Remove from map to prevent double-execution
  pendingActionsMap.delete(actionId);

  let result: any = null;

  switch (action.toolName) {
    case "propose_create_farm": {
      result = await createFarm(action.parameters as any);
      break;
    }
    case "propose_move_to_trash": {
      result = await moveToTrash(
        action.parameters.entityType,
        action.parameters.entityId,
        action.parameters.reason || "Moved via confirmed Rakshi AI action"
      );
      break;
    }
    default:
      throw new Error(`Unsupported mutation tool: ${action.toolName}`);
  }

  await logAudit(null, userId, "AI_MUTATION_EXECUTED", action.toolName, actionId, {
    parameters: action.parameters,
    summary: action.summary,
    result,
  });

  return {
    success: true,
    message: `Successfully executed: ${action.summary}`,
    result,
  };
}

export function cancelPendingAction(userId: string, actionId: string) {
  const action = getPendingAction(userId, actionId);
  if (action) {
    pendingActionsMap.delete(actionId);
  }
  return { success: true, message: "Action cancelled" };
}
