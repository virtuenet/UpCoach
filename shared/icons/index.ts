/**
 * Unified Icon System for UpCoach Platform
 * 
 * This module provides a consistent icon set across all platforms
 * using Lucide React icons as the standard.
 */

// Import all required Lucide icons
import {
  // Navigation
  Home,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  
  // Dashboard
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  
  // User & Auth
  User,
  Users,
  UserPlus,
  UserCheck,
  LogIn,
  LogOut,
  Lock,
  Shield,
  Key,
  
  // Content
  FileText,
  File,
  FolderOpen,
  Folder,
  BookOpen,
  PenTool,
  Edit,
  Save,
  Trash2,
  
  // Media
  Image,
  Camera,
  Video,
  Mic,
  Volume2,
  
  // Communication
  Mail,
  MessageSquare,
  Send,
  Bell,
  BellOff,
  
  // Settings
  Settings,
  Sliders,
  ToggleLeft,
  ToggleRight,
  
  // Actions
  Plus,
  Minus,
  Check,
  Copy,
  Download,
  Upload,
  RefreshCw,
  Search,
  Filter,
  
  // Status
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  AlertTriangle,
  
  // Finance
  DollarSign,
  CreditCard,
  Receipt,
  
  // Misc
  Calendar,
  Clock,
  Globe,
  MapPin,
  Phone,
  Smartphone,
  Monitor,
  Palette,
  Database,
  Cloud,
  Wifi,
  Heart,
  Star,
  Flag,
  Tag,
  Hash,
  Link,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  MoreHorizontal,
  MoreVertical,
  
  // Build icon (keeping for backward compatibility)
  Wrench as Build,
} from 'lucide-react';

// Icon mapping for consistent usage across platforms
export const Icons = {
  // Navigation
  Home,
  Menu,
  Close: X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  Back: ArrowLeft,
  Forward: ArrowRight,
  
  // Dashboard & Analytics
  Dashboard: LayoutDashboard,
  Analytics: BarChart3,
  Chart: BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  
  // User & Authentication
  User,
  Users,
  UserAdd: UserPlus,
  UserCheck,
  Login: LogIn,
  Logout: LogOut,
  Lock,
  Shield,
  Security: Shield,
  Key,
  Password: Key,
  
  // Content Management
  Content: FileText,
  Document: FileText,
  File,
  FolderOpen,
  Folder,
  Courses: BookOpen,
  Book: BookOpen,
  Edit: PenTool,
  EditAlt: Edit,
  Save,
  Delete: Trash2,
  Trash: Trash2,
  
  // Media
  Media: Image,
  Image,
  Camera,
  Video,
  Audio: Mic,
  Microphone: Mic,
  Volume: Volume2,
  
  // Communication
  Email: Mail,
  Mail,
  Message: MessageSquare,
  Chat: MessageSquare,
  Send,
  Notifications: Bell,
  NotificationsOff: BellOff,
  
  // Settings & Configuration
  Settings,
  Configuration: Sliders,
  Preferences: Sliders,
  ToggleOff: ToggleLeft,
  ToggleOn: ToggleRight,
  
  // Common Actions
  Add: Plus,
  Plus,
  Remove: Minus,
  Minus,
  Check,
  Success: CheckCircle,
  Copy,
  Download,
  Upload,
  Refresh: RefreshCw,
  Sync: RefreshCw,
  Search,
  Filter,
  
  // Status & Alerts
  Alert: AlertCircle,
  Info,
  Success: CheckCircle,
  Error: XCircle,
  Warning: AlertTriangle,
  
  // Finance & Billing
  Billing: DollarSign,
  Payment: CreditCard,
  CreditCard,
  Receipt,
  Invoice: Receipt,
  
  // Common UI Elements
  Calendar,
  Clock,
  Time: Clock,
  Globe,
  Location: MapPin,
  Phone,
  Mobile: Smartphone,
  Desktop: Monitor,
  Theme: Palette,
  Database,
  Cloud,
  Connection: Wifi,
  Favorite: Heart,
  Star,
  Rating: Star,
  Flag,
  Tag,
  Label: Tag,
  Hash,
  Link,
  ExternalLink,
  View: Eye,
  Hide: EyeOff,
  Loading: Loader2,
  MoreHorizontal,
  MoreVertical,
  
  // Legacy (for backward compatibility)
  Build,
};

// Helper function to get icon by name
export function getIcon(name: keyof typeof Icons) {
  return Icons[name] || null;
}

// Icon props type for consistent styling
export interface IconProps {
  size?: number | string;
  color?: string;
  className?: string;
  strokeWidth?: number;
}

// Default icon props
export const defaultIconProps: IconProps = {
  size: 24,
  strokeWidth: 2,
};

// Export all icons for direct import
export * from 'lucide-react';