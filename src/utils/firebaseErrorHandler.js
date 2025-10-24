/**
 * Firebase Error Handler Utility
 * Provides user-friendly error messages for Firebase Authentication and Firestore errors
 */

/**
 * Get user-friendly error message for Firebase Authentication errors
 * @param {Error} error - Firebase error object
 * @returns {string} User-friendly error message
 */
export const getAuthErrorMessage = (error) => {
  if (!error || !error.code) {
    return 'Authentication failed. Please try again.';
  }

  switch (error.code) {
    // Authentication errors
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid credentials. Please check your username and password.';
    
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    
    case 'auth/email-already-in-use':
      return 'This account already exists.';
    
    case 'auth/weak-password':
      return 'Password is too weak. Please use a stronger password.';
    
    case 'auth/invalid-email':
      return 'Invalid email format.';
    
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    
    case 'auth/operation-not-allowed':
      return 'This operation is not allowed. Please contact support.';
    
    case 'auth/requires-recent-login':
      return 'Please log in again to complete this action.';
    
    default:
      return 'Authentication failed. Please try again.';
  }
};

/**
 * Get user-friendly error message for Firestore errors
 * @param {Error} error - Firebase error object
 * @returns {string} User-friendly error message
 */
export const getFirestoreErrorMessage = (error) => {
  if (!error || !error.code) {
    return 'Database operation failed. Please try again.';
  }

  switch (error.code) {
    // Permission errors
    case 'permission-denied':
      return 'Access denied. You do not have permission to perform this action.';
    
    // Network errors
    case 'unavailable':
      return 'Service temporarily unavailable. Please try again in a moment.';
    
    case 'deadline-exceeded':
      return 'Request timed out. Please try again.';
    
    // Data errors
    case 'not-found':
      return 'The requested data was not found.';
    
    case 'already-exists':
      return 'This data already exists.';
    
    case 'failed-precondition':
      return 'Operation cannot be completed. Please refresh and try again.';
    
    case 'aborted':
      return 'Operation was aborted. Please try again.';
    
    case 'out-of-range':
      return 'Invalid data range provided.';
    
    case 'data-loss':
      return 'Data loss detected. Please contact support.';
    
    // Resource errors
    case 'resource-exhausted':
      return 'Resource limit exceeded. Please try again later.';
    
    case 'cancelled':
      return 'Operation was cancelled.';
    
    // Validation errors
    case 'invalid-argument':
      return 'Invalid data provided. Please check your input.';
    
    case 'unauthenticated':
      return 'You must be logged in to perform this action.';
    
    default:
      return 'Database operation failed. Please try again.';
  }
};

/**
 * Handle Firebase error and return appropriate message
 * Automatically detects error type and returns user-friendly message
 * @param {Error} error - Firebase error object
 * @returns {string} User-friendly error message
 */
export const handleFirebaseError = (error) => {
  if (!error) {
    return 'An unknown error occurred. Please try again.';
  }

  // Check if it's an auth error
  if (error.code && error.code.startsWith('auth/')) {
    return getAuthErrorMessage(error);
  }

  // Check if it's a Firestore error
  if (error.code && (
    error.code.startsWith('permission-') ||
    error.code === 'unavailable' ||
    error.code === 'not-found' ||
    error.code === 'already-exists' ||
    error.code === 'failed-precondition' ||
    error.code === 'aborted' ||
    error.code === 'out-of-range' ||
    error.code === 'data-loss' ||
    error.code === 'resource-exhausted' ||
    error.code === 'cancelled' ||
    error.code === 'invalid-argument' ||
    error.code === 'unauthenticated' ||
    error.code === 'deadline-exceeded'
  )) {
    return getFirestoreErrorMessage(error);
  }

  // Default error message
  return error.message || 'An error occurred. Please try again.';
};

/**
 * Log error to console with additional context
 * @param {string} context - Context where error occurred
 * @param {Error} error - Error object
 */
export const logFirebaseError = (context, error) => {
  console.error(`[Firebase Error - ${context}]:`, {
    code: error.code,
    message: error.message,
    stack: error.stack
  });
};
