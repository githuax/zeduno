// Auth feature exports
export { default as ChangePasswordModal } from './components/ChangePasswordModal';

// Components sub-module for cleaner imports within feature
export * from './components';

// Hooks
export { useAuth } from './hooks/useAuth';

// Pages
export { default as Login } from './pages/Login';
export { default as UserProfile } from './pages/UserProfile';