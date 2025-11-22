/**
 * @upcoach/ui
 * UI Component Library
 */

// Core UI components
export { Button } from './components/Button';
export { Card, CardHeader, CardTitle, CardContent, CardFooter } from './components/Card';
export { Input } from './components/Input';
export { Select } from './components/Select';
export { Modal } from './components/Modal';
export { Textarea } from './components/Textarea';
export { Badge } from './components/Badge';
export { RadioGroup } from './components/RadioGroup';
export { Label } from './components/Label';
export { Progress } from './components/Progress';
export { Alert, AlertTitle, AlertDescription } from './components/Alert';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './components/Tabs';
export { Checkbox } from './components/Checkbox';
export { DatePicker } from './components/DatePicker';
export { Calendar } from './components/Calendar';

// CMS Components
export { UnifiedAdminLayout } from './components/UnifiedAdminLayout';
export { PageBuilder } from './components/PageBuilder';
export { AnalyticsDashboard } from './components/AnalyticsDashboard';
export { WorkflowManagement } from './components/WorkflowManagement';
export { RolePermissionManager } from './components/RolePermissionManager';

// Mobile Components
export {
  MobileResponsiveContainer,
  TouchCard,
  ResponsiveGrid,
  MobileNavigation,
  CollapsibleSection,
  FloatingActionButton,
  PullToRefresh,
} from './components/MobileResponsiveContainer';

// Theme
export * from './theme';

// Types
export type { ButtonProps } from './components/Button';
export type {
  UnifiedAdminLayoutProps,
  NavItem,
  User as AdminUser,
} from './components/UnifiedAdminLayout';
export type { PageBuilderProps } from './components/PageBuilder';
export type { AnalyticsDashboardProps } from './components/AnalyticsDashboard';
export type { WorkflowManagementProps, WorkflowItem } from './components/WorkflowManagement';
export type { RolePermissionManagerProps, Role, Permission } from './components/RolePermissionManager';
export type {
  MobileResponsiveContainerProps,
  TouchCardProps,
  ResponsiveGridProps,
  MobileNavigationProps,
  MobileNavItem,
  CollapsibleSectionProps,
  FloatingActionButtonProps,
  PullToRefreshProps,
} from './components/MobileResponsiveContainer';
