// This file is kept for backward compatibility
// All methods are now in the methods/ subdirectory
import './methods/crud';
import './methods/sharing';
import './methods/review';

// Re-export permissions
export { canAccessSession, canEditSession } from '../shared/permissions';
