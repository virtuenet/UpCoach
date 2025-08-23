import Grid from "@mui/material/Grid";
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import {
  Security,
  Add,
  Edit,
  Delete,
  ExpandMore,
  Lock,
  VpnKey,
  Timer,
  Block,
  CheckCircle,
  Warning,
  Info,
  Policy,
  Shield,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import api from "../../services/api";
import { formatDate } from "../../utils/dateUtils";

interface SecurityPolicy {
  id: number;
  name: string;
  type: "security" | "data_retention" | "access_control" | "compliance";
  rules: any;
  enforcementLevel: "soft" | "hard";
  appliesTo: any;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const SecurityPolicies: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [policies, setPolicies] = useState<SecurityPolicy[]>([]);
  const [policyDialog, setPolicyDialog] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<SecurityPolicy | null>(
    null,
  );
  const { enqueueSnackbar } = useSnackbar();

  const [policyForm, setPolicyForm] = useState({
    name: "",
    type: "security" as const,
    enforcementLevel: "soft" as const,
    rules: {
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        expiryDays: 90,
        preventReuse: 5,
      },
      sessionPolicy: {
        maxSessionDuration: 480, // minutes
        idleTimeout: 30, // minutes
        concurrentSessions: 3,
        requireMFA: false,
      },
      accessPolicy: {
        ipWhitelist: [],
        requireVPN: false,
        allowedCountries: [],
        blockedCountries: [],
      },
      dataPolicy: {
        retentionDays: 365,
        allowDataExport: true,
        encryptionRequired: true,
        auditLogRetention: 730, // days
      },
    },
    appliesTo: {
      allUsers: true,
      roles: [],
      teams: [],
      excludedUsers: [],
    },
  });

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const orgId = localStorage.getItem("organizationId");
      const response = await api.get(
        `/enterprise/organizations/${orgId}/policies`,
      );
      setPolicies(response.data.data.policies);
    } catch (error) {
      console.error("Failed to load policies:", error);
      enqueueSnackbar("Failed to load security policies", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePolicy = async () => {
    try {
      const orgId = localStorage.getItem("organizationId");
      await api.post(`/enterprise/organizations/${orgId}/policies`, policyForm);

      enqueueSnackbar("Policy created successfully", { variant: "success" });
      setPolicyDialog(false);
      resetForm();
      loadPolicies();
    } catch (error) {
      enqueueSnackbar(
        error.response?.data?.message || "Failed to create policy",
        {
          variant: "error",
        },
      );
    }
  };

  const handleUpdatePolicy = async () => {
    if (!editingPolicy) return;

    try {
      await api.put(`/enterprise/policies/${editingPolicy.id}`, policyForm);

      enqueueSnackbar("Policy updated successfully", { variant: "success" });
      setPolicyDialog(false);
      setEditingPolicy(null);
      resetForm();
      loadPolicies();
    } catch (error) {
      enqueueSnackbar(
        error.response?.data?.message || "Failed to update policy",
        {
          variant: "error",
        },
      );
    }
  };

  const handleDeletePolicy = async (policyId: number) => {
    if (!window.confirm("Are you sure you want to delete this policy?")) return;

    try {
      await api.delete(`/enterprise/policies/${policyId}`);
      enqueueSnackbar("Policy deleted successfully", { variant: "success" });
      loadPolicies();
    } catch (error) {
      enqueueSnackbar(
        error.response?.data?.message || "Failed to delete policy",
        {
          variant: "error",
        },
      );
    }
  };

  const handleTogglePolicy = async (policy: SecurityPolicy) => {
    try {
      await api.patch(`/enterprise/policies/${policy.id}/toggle`, {
        isActive: !policy.isActive,
      });

      enqueueSnackbar(
        `Policy ${!policy.isActive ? "activated" : "deactivated"} successfully`,
        { variant: "success" },
      );
      loadPolicies();
    } catch (error) {
      enqueueSnackbar(
        error.response?.data?.message || "Failed to toggle policy",
        {
          variant: "error",
        },
      );
    }
  };

  const resetForm = () => {
    setPolicyForm({
      name: "",
      type: "security",
      enforcementLevel: "soft",
      rules: {
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          expiryDays: 90,
          preventReuse: 5,
        },
        sessionPolicy: {
          maxSessionDuration: 480,
          idleTimeout: 30,
          concurrentSessions: 3,
          requireMFA: false,
        },
        accessPolicy: {
          ipWhitelist: [],
          requireVPN: false,
          allowedCountries: [],
          blockedCountries: [],
        },
        dataPolicy: {
          retentionDays: 365,
          allowDataExport: true,
          encryptionRequired: true,
          auditLogRetention: 730,
        },
      },
      appliesTo: {
        allUsers: true,
        roles: [],
        teams: [],
        excludedUsers: [],
      },
    });
  };

  const openEditDialog = (policy: SecurityPolicy) => {
    setEditingPolicy(policy);
    setPolicyForm({
      name: policy.name,
      type: policy.type,
      enforcementLevel: policy.enforcementLevel,
      rules: policy.rules,
      appliesTo: policy.appliesTo,
    });
    setPolicyDialog(true);
  };

  const getPolicyIcon = (type: string) => {
    switch (type) {
      case "security":
        return <Lock />;
      case "data_retention":
        return <Timer />;
      case "access_control":
        return <VpnKey />;
      case "compliance":
        return <Policy />;
      default:
        return <Security />;
    }
  };

  const getPolicyColor = (type: string) => {
    switch (type) {
      case "security":
        return "primary";
      case "data_retention":
        return "warning";
      case "access_control":
        return "info";
      case "compliance":
        return "secondary";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: "100%" }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h4">Security Policies</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setPolicyDialog(true)}
        >
          Create Policy
        </Button>
      </Box>

      {policies.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 8 }}>
            <Shield sx={{ fontSize: 80, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Security Policies Configured
            </Typography>
            <Typography color="textSecondary" paragraph>
              Create security policies to enforce organizational compliance and
              security standards.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setPolicyDialog(true)}
            >
              Create Your First Policy
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {policies.map((policy) => (
            <Grid xs={12} key={policy.id}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {getPolicyIcon(policy.type)}
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="h6">{policy.name}</Typography>
                        <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                          <Chip
                            label={policy.type.replace("_", " ")}
                            size="small"
                            color={getPolicyColor(policy.type) as any}
                          />
                          <Chip
                            label={policy.enforcementLevel}
                            size="small"
                            variant={
                              policy.enforcementLevel === "hard"
                                ? "filled"
                                : "outlined"
                            }
                            color={
                              policy.enforcementLevel === "hard"
                                ? "error"
                                : "default"
                            }
                          />
                          <Chip
                            label={policy.isActive ? "Active" : "Inactive"}
                            size="small"
                            color={policy.isActive ? "success" : "default"}
                            icon={policy.isActive ? <CheckCircle /> : <Block />}
                          />
                        </Box>
                      </Box>
                    </Box>
                    <Box>
                      <Switch
                        checked={policy.isActive}
                        onChange={() => handleTogglePolicy(policy)}
                      />
                      <IconButton onClick={() => openEditDialog(policy)}>
                        <Edit />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeletePolicy(policy.id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography>Policy Details</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid xs={12} md={6}>
                          <Typography variant="subtitle2" gutterBottom>
                            Rules Configuration
                          </Typography>
                          <pre
                            style={{
                              background: "#f5f5f5",
                              padding: 12,
                              borderRadius: 4,
                              overflow: "auto",
                              fontSize: 12,
                            }}
                          >
                            {JSON.stringify(policy.rules, null, 2)}
                          </pre>
                        </Grid>
                        <Grid xs={12} md={6}>
                          <Typography variant="subtitle2" gutterBottom>
                            Applies To
                          </Typography>
                          <pre
                            style={{
                              background: "#f5f5f5",
                              padding: 12,
                              borderRadius: 4,
                              overflow: "auto",
                              fontSize: 12,
                            }}
                          >
                            {JSON.stringify(policy.appliesTo, null, 2)}
                          </pre>
                        </Grid>
                        <Grid xs={12}>
                          <Typography variant="caption" color="textSecondary">
                            Created by {policy.createdBy} on{" "}
                            {formatDate(policy.createdAt)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Policy Dialog */}
      <Dialog
        open={policyDialog}
        onClose={() => {
          setPolicyDialog(false);
          setEditingPolicy(null);
          resetForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingPolicy ? "Edit Security Policy" : "Create Security Policy"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid xs={12}>
                <TextField
                  fullWidth
                  label="Policy Name"
                  value={policyForm.name}
                  onChange={(e) =>
                    setPolicyForm({ ...policyForm, name: e.target.value })
                  }
                />
              </Grid>

              <Grid xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Policy Type</InputLabel>
                  <Select
                    value={policyForm.type}
                    onChange={(e) =>
                      setPolicyForm({
                        ...policyForm,
                        type: e.target.value as any,
                      })
                    }
                  >
                    <MenuItem value="security">Security</MenuItem>
                    <MenuItem value="data_retention">Data Retention</MenuItem>
                    <MenuItem value="access_control">Access Control</MenuItem>
                    <MenuItem value="compliance">Compliance</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Enforcement Level</InputLabel>
                  <Select
                    value={policyForm.enforcementLevel}
                    onChange={(e) =>
                      setPolicyForm({
                        ...policyForm,
                        enforcementLevel: e.target.value as any,
                      })
                    }
                  >
                    <MenuItem value="soft">
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Info sx={{ mr: 1, fontSize: 20 }} />
                        Soft (Warning only)
                      </Box>
                    </MenuItem>
                    <MenuItem value="hard">
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Warning
                          sx={{ mr: 1, fontSize: 20, color: "error.main" }}
                        />
                        Hard (Enforced)
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Policy Type Specific Rules */}
              {policyForm.type === "security" && (
                <Grid xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Password Policy
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Minimum Length"
                        value={policyForm.rules.passwordPolicy.minLength}
                        onChange={(e) =>
                          setPolicyForm({
                            ...policyForm,
                            rules: {
                              ...policyForm.rules,
                              passwordPolicy: {
                                ...policyForm.rules.passwordPolicy,
                                minLength: parseInt(e.target.value),
                              },
                            },
                          })
                        }
                      />
                    </Grid>
                    <Grid xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Password Expiry (days)"
                        value={policyForm.rules.passwordPolicy.expiryDays}
                        onChange={(e) =>
                          setPolicyForm({
                            ...policyForm,
                            rules: {
                              ...policyForm.rules,
                              passwordPolicy: {
                                ...policyForm.rules.passwordPolicy,
                                expiryDays: parseInt(e.target.value),
                              },
                            },
                          })
                        }
                      />
                    </Grid>
                    <Grid xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={
                              policyForm.rules.passwordPolicy.requireUppercase
                            }
                            onChange={(e) =>
                              setPolicyForm({
                                ...policyForm,
                                rules: {
                                  ...policyForm.rules,
                                  passwordPolicy: {
                                    ...policyForm.rules.passwordPolicy,
                                    requireUppercase: e.target.checked,
                                  },
                                },
                              })
                            }
                          />
                        }
                        label="Require uppercase letters"
                      />
                    </Grid>
                    <Grid xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={
                              policyForm.rules.passwordPolicy.requireNumbers
                            }
                            onChange={(e) =>
                              setPolicyForm({
                                ...policyForm,
                                rules: {
                                  ...policyForm.rules,
                                  passwordPolicy: {
                                    ...policyForm.rules.passwordPolicy,
                                    requireNumbers: e.target.checked,
                                  },
                                },
                              })
                            }
                          />
                        }
                        label="Require numbers"
                      />
                    </Grid>
                    <Grid xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={
                              policyForm.rules.passwordPolicy
                                .requireSpecialChars
                            }
                            onChange={(e) =>
                              setPolicyForm({
                                ...policyForm,
                                rules: {
                                  ...policyForm.rules,
                                  passwordPolicy: {
                                    ...policyForm.rules.passwordPolicy,
                                    requireSpecialChars: e.target.checked,
                                  },
                                },
                              })
                            }
                          />
                        }
                        label="Require special characters"
                      />
                    </Grid>
                  </Grid>

                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    Session Policy
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Max Session Duration (minutes)"
                        value={
                          policyForm.rules.sessionPolicy.maxSessionDuration
                        }
                        onChange={(e) =>
                          setPolicyForm({
                            ...policyForm,
                            rules: {
                              ...policyForm.rules,
                              sessionPolicy: {
                                ...policyForm.rules.sessionPolicy,
                                maxSessionDuration: parseInt(e.target.value),
                              },
                            },
                          })
                        }
                      />
                    </Grid>
                    <Grid xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Idle Timeout (minutes)"
                        value={policyForm.rules.sessionPolicy.idleTimeout}
                        onChange={(e) =>
                          setPolicyForm({
                            ...policyForm,
                            rules: {
                              ...policyForm.rules,
                              sessionPolicy: {
                                ...policyForm.rules.sessionPolicy,
                                idleTimeout: parseInt(e.target.value),
                              },
                            },
                          })
                        }
                      />
                    </Grid>
                    <Grid xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={policyForm.rules.sessionPolicy.requireMFA}
                            onChange={(e) =>
                              setPolicyForm({
                                ...policyForm,
                                rules: {
                                  ...policyForm.rules,
                                  sessionPolicy: {
                                    ...policyForm.rules.sessionPolicy,
                                    requireMFA: e.target.checked,
                                  },
                                },
                              })
                            }
                          />
                        }
                        label="Require Multi-Factor Authentication"
                      />
                    </Grid>
                  </Grid>
                </Grid>
              )}

              {policyForm.type === "data_retention" && (
                <Grid xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Data Retention Settings
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Data Retention Period (days)"
                        value={policyForm.rules.dataPolicy.retentionDays}
                        onChange={(e) =>
                          setPolicyForm({
                            ...policyForm,
                            rules: {
                              ...policyForm.rules,
                              dataPolicy: {
                                ...policyForm.rules.dataPolicy,
                                retentionDays: parseInt(e.target.value),
                              },
                            },
                          })
                        }
                      />
                    </Grid>
                    <Grid xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Audit Log Retention (days)"
                        value={policyForm.rules.dataPolicy.auditLogRetention}
                        onChange={(e) =>
                          setPolicyForm({
                            ...policyForm,
                            rules: {
                              ...policyForm.rules,
                              dataPolicy: {
                                ...policyForm.rules.dataPolicy,
                                auditLogRetention: parseInt(e.target.value),
                              },
                            },
                          })
                        }
                      />
                    </Grid>
                    <Grid xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={
                              policyForm.rules.dataPolicy.allowDataExport
                            }
                            onChange={(e) =>
                              setPolicyForm({
                                ...policyForm,
                                rules: {
                                  ...policyForm.rules,
                                  dataPolicy: {
                                    ...policyForm.rules.dataPolicy,
                                    allowDataExport: e.target.checked,
                                  },
                                },
                              })
                            }
                          />
                        }
                        label="Allow data export"
                      />
                    </Grid>
                    <Grid xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={
                              policyForm.rules.dataPolicy.encryptionRequired
                            }
                            onChange={(e) =>
                              setPolicyForm({
                                ...policyForm,
                                rules: {
                                  ...policyForm.rules,
                                  dataPolicy: {
                                    ...policyForm.rules.dataPolicy,
                                    encryptionRequired: e.target.checked,
                                  },
                                },
                              })
                            }
                          />
                        }
                        label="Require encryption at rest"
                      />
                    </Grid>
                  </Grid>
                </Grid>
              )}

              {/* Applies To Section */}
              <Grid xs={12}>
                <Typography variant="h6" gutterBottom>
                  Policy Scope
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={policyForm.appliesTo.allUsers}
                      onChange={(e) =>
                        setPolicyForm({
                          ...policyForm,
                          appliesTo: {
                            ...policyForm.appliesTo,
                            allUsers: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label="Apply to all users"
                />
                {!policyForm.appliesTo.allUsers && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Specific role and team targeting will be available in the
                    next update.
                  </Alert>
                )}
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setPolicyDialog(false);
              setEditingPolicy(null);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={editingPolicy ? handleUpdatePolicy : handleCreatePolicy}
            variant="contained"
          >
            {editingPolicy ? "Update Policy" : "Create Policy"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecurityPolicies;
