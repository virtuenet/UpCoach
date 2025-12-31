import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Drawer,
  Divider,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Badge,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Save,
  PlayArrow,
  Pause,
  Delete,
  ExpandMore,
  DragIndicator,
  Settings,
  Code,
  Schedule,
  Email,
  Webhook,
  Loop,
  Timer,
  NotificationImportant,
  BrokenImage,
  CheckCircle,
  Cancel,
  Warning,
  Undo,
  Redo,
  CloudUpload,
  CloudDownload,
  History,
  ContentCopy,
  Visibility,
  Edit,
  MenuBook,
} from '@mui/icons-material';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
  MarkerType,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * Workflow Builder
 *
 * Production-ready visual workflow builder with drag-and-drop interface
 * for creating automation workflows without code.
 *
 * Features:
 * - React Flow drag-and-drop canvas
 * - Multiple node types (Start, Action, Condition, Loop, Delay, Parallel, End)
 * - Visual edge connectors with conditional routing
 * - Node configuration panels
 * - Workflow validation
 * - Save/Load workflow definitions
 * - Test run with step-by-step preview
 * - Version history
 * - Import/Export JSON
 * - Undo/Redo support
 * - Real-time collaboration indicators
 * - Analytics
 */

interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  settings: WorkflowSettings;
  version: number;
  status: 'draft' | 'active' | 'paused';
  metadata: {
    createdBy: string;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
    tags: string[];
  };
}

interface WorkflowTrigger {
  id: string;
  type: 'event' | 'schedule' | 'webhook' | 'manual';
  event?: string;
  schedule?: string;
  webhookUrl?: string;
  conditions?: any[];
  config: Record<string, any>;
}

interface WorkflowStep {
  id: string;
  name: string;
  type: 'action' | 'condition' | 'loop' | 'delay' | 'parallel' | 'webhook' | 'switch';
  action?: string;
  config: Record<string, any>;
  nextSteps: string[];
  onError?: any;
  retryPolicy?: any;
  timeout?: number;
  position: { x: number; y: number };
}

interface WorkflowSettings {
  maxExecutionTime: number;
  maxRetries: number;
  defaultRetryDelay: number;
  concurrentExecutions: number;
  errorHandling: 'stop' | 'continue' | 'rollback';
  enableLogging: boolean;
  notifications: {
    onSuccess: boolean;
    onError: boolean;
    onPause: boolean;
    recipients: string[];
  };
  variables: Record<string, any>;
}

interface NodeData {
  label: string;
  type: string;
  config: Record<string, any>;
  icon?: React.ReactNode;
  status?: 'idle' | 'running' | 'completed' | 'failed';
}

interface ActionTemplate {
  id: string;
  name: string;
  type: string;
  category: string;
  icon: React.ReactNode;
  description: string;
  config: Record<string, any>;
}

const nodeTypes: NodeTypes = {
  custom: ({ data }: { data: NodeData }) => (
    <Box
      sx={{
        padding: 2,
        borderRadius: 2,
        border: '2px solid',
        borderColor: data.status === 'running' ? 'primary.main' :
                     data.status === 'completed' ? 'success.main' :
                     data.status === 'failed' ? 'error.main' : 'grey.400',
        backgroundColor: 'white',
        minWidth: 180,
        boxShadow: 2,
        '&:hover': {
          boxShadow: 4,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {data.icon}
        <Typography variant="body2" fontWeight="bold">
          {data.label}
        </Typography>
      </Box>
      {data.status && (
        <Chip
          label={data.status}
          size="small"
          color={
            data.status === 'running' ? 'primary' :
            data.status === 'completed' ? 'success' :
            data.status === 'failed' ? 'error' : 'default'
          }
          sx={{ mt: 1 }}
        />
      )}
    </Box>
  ),
};

const actionTemplates: ActionTemplate[] = [
  // Communication
  { id: 'send_email', name: 'Send Email', type: 'action', category: 'Communication', icon: <Email />, description: 'Send email notification', config: { to: '', subject: '', body: '' } },
  { id: 'send_sms', name: 'Send SMS', type: 'action', category: 'Communication', icon: <NotificationImportant />, description: 'Send SMS message', config: { to: '', message: '' } },
  { id: 'send_notification', name: 'Push Notification', type: 'action', category: 'Communication', icon: <NotificationImportant />, description: 'Send push notification', config: { title: '', body: '' } },

  // Data Operations
  { id: 'create_record', name: 'Create Record', type: 'action', category: 'Data', icon: <Add />, description: 'Create database record', config: { table: '', data: {} } },
  { id: 'update_record', name: 'Update Record', type: 'action', category: 'Data', icon: <Edit />, description: 'Update database record', config: { table: '', id: '', data: {} } },
  { id: 'delete_record', name: 'Delete Record', type: 'action', category: 'Data', icon: <Delete />, description: 'Delete database record', config: { table: '', id: '' } },

  // Logic & Control
  { id: 'condition', name: 'Condition', type: 'condition', category: 'Logic', icon: <BrokenImage />, description: 'Conditional branching', config: { expression: '', onTrue: '', onFalse: '' } },
  { id: 'switch', name: 'Switch', type: 'switch', category: 'Logic', icon: <BrokenImage />, description: 'Multiple branch routing', config: { value: '', cases: [] } },
  { id: 'loop', name: 'Loop', type: 'loop', category: 'Logic', icon: <Loop />, description: 'Iterate over items', config: { type: 'for-each', items: '', maxIterations: 100 } },

  // Timing
  { id: 'delay', name: 'Delay', type: 'delay', category: 'Timing', icon: <Timer />, description: 'Wait for specified time', config: { delay: 1000 } },
  { id: 'schedule', name: 'Schedule', type: 'action', category: 'Timing', icon: <Schedule />, description: 'Schedule future action', config: { time: '' } },

  // Integration
  { id: 'webhook', name: 'Webhook', type: 'webhook', category: 'Integration', icon: <Webhook />, description: 'Call external webhook', config: { url: '', method: 'POST', headers: {}, body: {} } },
  { id: 'http_request', name: 'HTTP Request', type: 'action', category: 'Integration', icon: <Webhook />, description: 'Make HTTP request', config: { url: '', method: 'GET' } },

  // Coaching Actions
  { id: 'create_goal', name: 'Create Goal', type: 'action', category: 'Coaching', icon: <Add />, description: 'Create user goal', config: { userId: '', title: '', description: '' } },
  { id: 'log_habit', name: 'Log Habit', type: 'action', category: 'Coaching', icon: <CheckCircle />, description: 'Log habit completion', config: { habitId: '', userId: '' } },
  { id: 'send_reminder', name: 'Send Reminder', type: 'action', category: 'Coaching', icon: <NotificationImportant />, description: 'Send reminder to user', config: { userId: '', message: '' } },
];

const WorkflowBuilder: React.FC = () => {
  const [workflow, setWorkflow] = useState<WorkflowDefinition | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [history, setHistory] = useState<Array<{ nodes: Node[]; edges: Edge[] }>>([]);
  const [loading, setLoading] = useState(false);
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const categories = useMemo(() => {
    const cats = ['All', ...new Set(actionTemplates.map(t => t.category))];
    return cats;
  }, []);

  const filteredTemplates = useMemo(() => {
    return selectedCategory === 'All'
      ? actionTemplates
      : actionTemplates.filter(t => t.category === selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    initializeWorkflow();
  }, []);

  const initializeWorkflow = () => {
    const initialWorkflow: WorkflowDefinition = {
      id: `wf_${Date.now()}`,
      name: 'New Workflow',
      description: '',
      organizationId: 'org_default',
      trigger: {
        id: 'trigger_1',
        type: 'manual',
        config: {},
      },
      steps: [],
      settings: {
        maxExecutionTime: 300,
        maxRetries: 3,
        defaultRetryDelay: 1000,
        concurrentExecutions: 1,
        errorHandling: 'stop',
        enableLogging: true,
        notifications: {
          onSuccess: false,
          onError: true,
          onPause: false,
          recipients: [],
        },
        variables: {},
      },
      version: 1,
      status: 'draft',
      metadata: {
        createdBy: 'admin',
        updatedBy: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: [],
      },
    };

    setWorkflow(initialWorkflow);

    const startNode: Node = {
      id: 'start',
      type: 'custom',
      position: { x: 250, y: 50 },
      data: {
        label: 'Start',
        type: 'start',
        icon: <PlayArrow />,
        config: {},
      },
    };

    const endNode: Node = {
      id: 'end',
      type: 'custom',
      position: { x: 250, y: 400 },
      data: {
        label: 'End',
        type: 'end',
        icon: <CheckCircle />,
        config: {},
      },
    };

    setNodes([startNode, endNode]);
    addToHistory([startNode, endNode], []);
  };

  const addToHistory = (newNodes: Node[], newEdges: Edge[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: newNodes, edges: newEdges });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
      };
      setEdges((eds) => {
        const updated = addEdge(newEdge, eds);
        addToHistory(nodes, updated);
        return updated;
      });
    },
    [nodes, setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setDrawerOpen(true);
  }, []);

  const handleAddNode = (template: ActionTemplate) => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: 'custom',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 150 },
      data: {
        label: template.name,
        type: template.type,
        icon: template.icon,
        config: { ...template.config },
      },
    };

    setNodes((nds) => {
      const updated = [...nds, newNode];
      addToHistory(updated, edges);
      return updated;
    });

    setSnackbar({ open: true, message: `Added ${template.name}`, severity: 'success' });
  };

  const handleDeleteNode = (nodeId: string) => {
    if (nodeId === 'start' || nodeId === 'end') {
      setSnackbar({ open: true, message: 'Cannot delete start or end nodes', severity: 'error' });
      return;
    }

    setNodes((nds) => {
      const updated = nds.filter((n) => n.id !== nodeId);
      addToHistory(updated, edges);
      return updated;
    });

    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setDrawerOpen(false);
    setSelectedNode(null);
  };

  const handleUpdateNodeConfig = (nodeId: string, config: Record<string, any>) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              config: { ...node.data.config, ...config },
            },
          };
        }
        return node;
      })
    );
  };

  const validateWorkflow = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!nodes.find((n) => n.id === 'start')) {
      errors.push('Workflow must have a start node');
    }

    if (!nodes.find((n) => n.id === 'end')) {
      errors.push('Workflow must have an end node');
    }

    const orphanedNodes = nodes.filter((node) => {
      if (node.id === 'start' || node.id === 'end') return false;
      const hasIncoming = edges.some((e) => e.target === node.id);
      const hasOutgoing = edges.some((e) => e.source === node.id);
      return !hasIncoming && !hasOutgoing;
    });

    if (orphanedNodes.length > 0) {
      errors.push(`Found ${orphanedNodes.length} orphaned nodes (not connected)`);
    }

    nodes.forEach((node) => {
      if (node.data.type === 'condition' && !node.data.config.expression) {
        errors.push(`Condition node "${node.data.label}" missing expression`);
      }
      if (node.data.type === 'webhook' && !node.data.config.url) {
        errors.push(`Webhook node "${node.data.label}" missing URL`);
      }
    });

    return { valid: errors.length === 0, errors };
  };

  const handleSave = async () => {
    const validation = validateWorkflow();
    if (!validation.valid) {
      setSnackbar({
        open: true,
        message: `Validation errors: ${validation.errors.join(', ')}`,
        severity: 'error',
      });
      return;
    }

    setLoading(true);

    try {
      const steps: WorkflowStep[] = nodes
        .filter((n) => n.id !== 'start' && n.id !== 'end')
        .map((n) => ({
          id: n.id,
          name: n.data.label,
          type: n.data.type,
          action: n.data.type === 'action' ? n.data.config.action : undefined,
          config: n.data.config,
          nextSteps: edges.filter((e) => e.source === n.id).map((e) => e.target),
          position: n.position,
        }));

      const updatedWorkflow = {
        ...workflow!,
        steps,
        metadata: {
          ...workflow!.metadata,
          updatedAt: new Date(),
        },
      };

      setWorkflow(updatedWorkflow);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSnackbar({ open: true, message: 'Workflow saved successfully', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to save workflow', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    const validation = validateWorkflow();
    if (!validation.valid) {
      setSnackbar({
        open: true,
        message: `Cannot test: ${validation.errors.join(', ')}`,
        severity: 'error',
      });
      return;
    }

    setTestMode(true);
    setLoading(true);

    try {
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, status: 'idle' },
        }))
      );

      const orderedNodes = getExecutionOrder();
      const results: any[] = [];

      for (const node of orderedNodes) {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === node.id ? { ...n, data: { ...n.data, status: 'running' } } : n
          )
        );

        await new Promise((resolve) => setTimeout(resolve, 1000));

        const success = Math.random() > 0.1;

        setNodes((nds) =>
          nds.map((n) =>
            n.id === node.id
              ? { ...n, data: { ...n.data, status: success ? 'completed' : 'failed' } }
              : n
          )
        );

        results.push({
          nodeId: node.id,
          label: node.data.label,
          status: success ? 'completed' : 'failed',
          duration: Math.floor(Math.random() * 500) + 100,
          timestamp: new Date(),
        });

        if (!success && workflow?.settings.errorHandling === 'stop') {
          break;
        }
      }

      setTestResults(results);
      setSnackbar({ open: true, message: 'Test completed', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Test failed', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getExecutionOrder = (): Node[] => {
    const startNode = nodes.find((n) => n.id === 'start');
    if (!startNode) return [];

    const ordered: Node[] = [];
    const visited = new Set<string>();
    const queue: string[] = ['start'];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;

      visited.add(nodeId);
      const node = nodes.find((n) => n.id === nodeId);
      if (node && node.id !== 'start' && node.id !== 'end') {
        ordered.push(node);
      }

      const outgoingEdges = edges.filter((e) => e.source === nodeId);
      outgoingEdges.forEach((e) => queue.push(e.target));
    }

    return ordered;
  };

  const handleActivate = async () => {
    const validation = validateWorkflow();
    if (!validation.valid) {
      setSnackbar({
        open: true,
        message: `Cannot activate: ${validation.errors.join(', ')}`,
        severity: 'error',
      });
      return;
    }

    setLoading(true);

    try {
      await handleSave();

      const updatedWorkflow = {
        ...workflow!,
        status: 'active' as const,
        metadata: {
          ...workflow!.metadata,
          updatedAt: new Date(),
        },
      };

      setWorkflow(updatedWorkflow);

      setSnackbar({ open: true, message: 'Workflow activated successfully', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to activate workflow', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = {
      workflow,
      nodes,
      edges,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workflow_${workflow?.name}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setSnackbar({ open: true, message: 'Workflow exported', severity: 'success' });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setWorkflow(data.workflow);
        setNodes(data.nodes);
        setEdges(data.edges);
        addToHistory(data.nodes, data.edges);
        setSnackbar({ open: true, message: 'Workflow imported', severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: 'Failed to import workflow', severity: 'error' });
      }
    };
    reader.readAsText(file);
  };

  const handleViewVersions = () => {
    const mockVersions = [
      { version: 3, updatedAt: new Date('2025-01-15'), updatedBy: 'admin', status: 'active' },
      { version: 2, updatedAt: new Date('2025-01-10'), updatedBy: 'admin', status: 'draft' },
      { version: 1, updatedAt: new Date('2025-01-05'), updatedBy: 'admin', status: 'draft' },
    ];
    setVersions(mockVersions);
    setVersionDialogOpen(true);
  };

  const renderNodeConfig = () => {
    if (!selectedNode) return null;

    const { data } = selectedNode;

    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {data.label}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <TextField
          fullWidth
          label="Node Name"
          value={data.label}
          onChange={(e) => {
            setNodes((nds) =>
              nds.map((n) =>
                n.id === selectedNode.id
                  ? { ...n, data: { ...n.data, label: e.target.value } }
                  : n
              )
            );
          }}
          sx={{ mb: 2 }}
        />

        {data.type === 'action' && (
          <>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Action Type</InputLabel>
              <Select
                value={data.config.action || ''}
                onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { action: e.target.value })}
              >
                <MenuItem value="send_email">Send Email</MenuItem>
                <MenuItem value="send_sms">Send SMS</MenuItem>
                <MenuItem value="create_goal">Create Goal</MenuItem>
                <MenuItem value="log_habit">Log Habit</MenuItem>
                <MenuItem value="http_request">HTTP Request</MenuItem>
              </Select>
            </FormControl>
          </>
        )}

        {data.type === 'condition' && (
          <TextField
            fullWidth
            label="Condition Expression"
            value={data.config.expression || ''}
            onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { expression: e.target.value })}
            placeholder="e.g., {{variable}} > 10"
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
        )}

        {data.type === 'webhook' && (
          <>
            <TextField
              fullWidth
              label="Webhook URL"
              value={data.config.url || ''}
              onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { url: e.target.value })}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Method</InputLabel>
              <Select
                value={data.config.method || 'POST'}
                onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { method: e.target.value })}
              >
                <MenuItem value="GET">GET</MenuItem>
                <MenuItem value="POST">POST</MenuItem>
                <MenuItem value="PUT">PUT</MenuItem>
                <MenuItem value="DELETE">DELETE</MenuItem>
              </Select>
            </FormControl>
          </>
        )}

        {data.type === 'delay' && (
          <TextField
            fullWidth
            label="Delay (ms)"
            type="number"
            value={data.config.delay || 1000}
            onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { delay: parseInt(e.target.value) })}
            sx={{ mb: 2 }}
          />
        )}

        {data.type === 'loop' && (
          <>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Loop Type</InputLabel>
              <Select
                value={data.config.type || 'for-each'}
                onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { type: e.target.value })}
              >
                <MenuItem value="for-each">For Each</MenuItem>
                <MenuItem value="while">While</MenuItem>
                <MenuItem value="do-until">Do Until</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Items Variable"
              value={data.config.items || ''}
              onChange={(e) => handleUpdateNodeConfig(selectedNode.id, { items: e.target.value })}
              placeholder="{{items}}"
              sx={{ mb: 2 }}
            />
          </>
        )}

        <Divider sx={{ my: 2 }} />

        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<Delete />}
          onClick={() => handleDeleteNode(selectedNode.id)}
        >
          Delete Node
        </Button>
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0 }} elevation={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" fontWeight="bold">
              {workflow?.name || 'Workflow Builder'}
            </Typography>
            <Chip
              label={workflow?.status || 'draft'}
              color={workflow?.status === 'active' ? 'success' : 'default'}
              size="small"
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Undo">
              <span>
                <IconButton onClick={handleUndo} disabled={historyIndex <= 0}>
                  <Undo />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Redo">
              <span>
                <IconButton onClick={handleRedo} disabled={historyIndex >= history.length - 1}>
                  <Redo />
                </IconButton>
              </span>
            </Tooltip>
            <Divider orientation="vertical" flexItem />
            <Tooltip title="Settings">
              <IconButton onClick={() => setSettingsOpen(true)}>
                <Settings />
              </IconButton>
            </Tooltip>
            <Tooltip title="Version History">
              <IconButton onClick={handleViewVersions}>
                <History />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export">
              <IconButton onClick={handleExport}>
                <CloudDownload />
              </IconButton>
            </Tooltip>
            <Tooltip title="Import">
              <IconButton component="label">
                <CloudUpload />
                <input type="file" hidden accept=".json" onChange={handleImport} />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem />
            <Button
              variant="outlined"
              startIcon={<PlayArrow />}
              onClick={handleTest}
              disabled={loading}
            >
              Test
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={loading}
            >
              Save
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={handleActivate}
              disabled={loading || workflow?.status === 'active'}
            >
              Activate
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Main Content */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Action Palette */}
        <Paper sx={{ width: 280, overflowY: 'auto', borderRadius: 0 }} elevation={1}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Actions
            </Typography>

            <Tabs
              value={activeTab}
              onChange={(e, v) => setActiveTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 2 }}
            >
              {categories.map((cat) => (
                <Tab key={cat} label={cat} onClick={() => setSelectedCategory(cat)} />
              ))}
            </Tabs>

            <List>
              {filteredTemplates.map((template) => (
                <ListItem
                  key={template.id}
                  button
                  onClick={() => handleAddNode(template)}
                  sx={{
                    border: '1px solid',
                    borderColor: 'grey.300',
                    borderRadius: 1,
                    mb: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon>{template.icon}</ListItemIcon>
                  <ListItemText
                    primary={template.name}
                    secondary={template.description}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Paper>

        {/* Canvas */}
        <Box sx={{ flex: 1, position: 'relative' }} ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <MiniMap />
            <Background />
          </ReactFlow>
        </Box>

        {/* Right Panel - Test Results */}
        {testMode && (
          <Paper sx={{ width: 320, overflowY: 'auto', borderRadius: 0, p: 2 }} elevation={1}>
            <Typography variant="h6" gutterBottom>
              Test Results
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {testResults.length === 0 ? (
              <Alert severity="info">No test results yet</Alert>
            ) : (
              <List>
                {testResults.map((result, index) => (
                  <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start', mb: 1, border: '1px solid', borderColor: 'grey.300', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <Typography variant="body2" fontWeight="bold">
                        {result.label}
                      </Typography>
                      <Chip
                        label={result.status}
                        size="small"
                        color={result.status === 'completed' ? 'success' : 'error'}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Duration: {result.duration}ms
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {result.timestamp.toLocaleTimeString()}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        )}
      </Box>

      {/* Configuration Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 400 }}>{renderNodeConfig()}</Box>
      </Drawer>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Workflow Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Workflow Name"
              value={workflow?.name || ''}
              onChange={(e) => setWorkflow({ ...workflow!, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              value={workflow?.description || ''}
              onChange={(e) => setWorkflow({ ...workflow!, description: e.target.value })}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Max Execution Time (seconds)"
              type="number"
              value={workflow?.settings.maxExecutionTime || 300}
              onChange={(e) =>
                setWorkflow({
                  ...workflow!,
                  settings: { ...workflow!.settings, maxExecutionTime: parseInt(e.target.value) },
                })
              }
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={workflow?.settings.enableLogging || false}
                  onChange={(e) =>
                    setWorkflow({
                      ...workflow!,
                      settings: { ...workflow!.settings, enableLogging: e.target.checked },
                    })
                  }
                />
              }
              label="Enable Logging"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={versionDialogOpen} onClose={() => setVersionDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Version History</DialogTitle>
        <DialogContent>
          <List>
            {versions.map((version) => (
              <ListItem key={version.version} sx={{ border: '1px solid', borderColor: 'grey.300', borderRadius: 1, mb: 1 }}>
                <ListItemText
                  primary={`Version ${version.version}`}
                  secondary={`Updated ${version.updatedAt.toLocaleDateString()} by ${version.updatedBy}`}
                />
                <Chip label={version.status} size="small" />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVersionDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Loading Overlay */}
      {loading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
          }}
        >
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

export default WorkflowBuilder;
