// Import all method modules to register them with Meteor
import './crud';
import './sharing';
import './review';

// Re-export permissions for convenience
export { canAccessSession, canEditSession } from '../../shared/permissions';
