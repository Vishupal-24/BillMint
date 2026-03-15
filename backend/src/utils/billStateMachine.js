/**
 * Bill State Machine
 * Defines allowed status transitions for POS Bills to prevent illegal states.
 */

const ALLOWED_TRANSITIONS = {
  AWAITING_PAYMENT: ["PAID", "CANCELLED", "EXPIRED", "PENDING_KHATA"],
  PENDING_KHATA: ["PAID", "CANCELLED"], // Added CANCELLED to allow merchant/admin to cancel if needed
  PAID: [], // Terminal state
  CANCELLED: [], // Terminal state
  EXPIRED: [], // Terminal state
  // Legacy support if needed, but we should aim to use PENDING_KHATA
  PENDING: ["PAID", "CANCELLED"] 
};

/**
 * Asserts that a transition from currentStatus to nextStatus is allowed.
 * Throws an error if the transition is invalid.
 * 
 * @param {string} currentStatus 
 * @param {string} nextStatus 
 * @throws {Error} If transition is not allowed
 */
export const assertTransitionAllowed = (currentStatus, nextStatus) => {
  if (currentStatus === nextStatus) return; // Allow self-transitions (idempotency)
  
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    const error = new Error(`Invalid state transition: ${currentStatus} -> ${nextStatus}`);
    error.code = "INVALID_STATE_TRANSITION";
    error.statusCode = 400; // Hint for controller to send 400
    throw error;
  }
};
