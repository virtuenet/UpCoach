import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  IconButton,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Image as ImageIcon,
  MicNone as MicIcon,
  AccountTree as GraphIcon,
  Assessment as AnalyticsIcon,
  BugReport as TestingIcon,
  Visibility as VisibilityIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
} from 'reactflow';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import useSWR from 'swr';
import 'reactflow/dist/style.css';

interface ServiceMetrics {
  serviceName: string;
  apiCalls: number;
  avgLatency: number;
  errorRate: number;
  cost: number;
}

interface UsageMetric {
  date: string;
  vision: number;
  speech: number;
  knowledgeGraph: number;
}

interface VisionAnalysis {
  objects: Array<{
    label: string;
    confidence: number;
    bbox: { x: number; y: number; width: number; height: number };
  }>;
  faces: Array<{
    bbox: { x: number; y: number; width: number; height: number };
    expressions: Record<string, number>;
    age?: number;
    gender?: string;
  }>;
  ocr: {
    text: string;
    confidence: number;
    words: Array<{
      text: string;
      confidence: number;
      bbox: { x: number; y: number; width: number; height: number };
    }>;
  };
  scene: {
    category: string;
    subcategory: string;
    confidence: number;
  };
  quality: {
    isBlurry: boolean;
    blurScore: number;
    brightness: number;
    contrast: number;
  };
  tags: Array<{ tag: string; confidence: number }>;
  nsfw: {
    isSafe: boolean;
    classification: string;
  };
}

interface SpeechAnalysis {
  transcript: string;
  language: string;
  duration: number;
  segments: Array<{
    text: string;
    startTime: number;
    endTime: number;
    speakerId?: number;
  }>;
  sentiment: {
    score: number;
    sentiment: string;
  };
  emotions: Array<{
    emotion: string;
    confidence: number;
  }>;
}

interface GraphEntity {
  id: string;
  label: string;
  type: string;
  properties: Record<string, any>;
}

interface GraphRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const CognitiveDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  // Overview state
  const { data: metricsData, mutate: refreshMetrics } = useSWR<ServiceMetrics[]>(
    '/api/cognitive/metrics',
    fetcher,
    { refreshInterval: 10000 }
  );

  const { data: usageData } = useSWR<UsageMetric[]>('/api/cognitive/usage', fetcher, {
    refreshInterval: 10000,
  });

  // Vision state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [visionAnalysis, setVisionAnalysis] = useState<VisionAnalysis | null>(null);
  const [visionLoading, setVisionLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Speech state
  const [selectedAudio, setSelectedAudio] = useState<File | null>(null);
  const [speechAnalysis, setSpeechAnalysis] = useState<SpeechAnalysis | null>(null);
  const [speechLoading, setSpeechLoading] = useState(false);
  const [synthesisText, setSynthesisText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('en-US-female-1');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Knowledge Graph state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [graphEntities, setGraphEntities] = useState<GraphEntity[]>([]);
  const [graphRelationships, setGraphRelationships] = useState<GraphRelationship[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [addEntityDialog, setAddEntityDialog] = useState(false);
  const [newEntity, setNewEntity] = useState({ label: '', type: '' });
  const [addRelDialog, setAddRelDialog] = useState(false);
  const [newRel, setNewRel] = useState({ source: '', target: '', type: '' });
  const [pageRankResults, setPageRankResults] = useState<Array<{ entityId: string; score: number }>>([]);

  // Testing state
  const [testResults, setTestResults] = useState<any[]>([]);

  // Analytics state
  const { data: analyticsData } = useSWR('/api/cognitive/analytics', fetcher, {
    refreshInterval: 10000,
  });

  // Dropzone for image upload
  const imageDropzone = useDropzone({
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif'] },
    multiple: false,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    },
  });

  // Dropzone for audio upload
  const audioDropzone = useDropzone({
    accept: { 'audio/*': ['.wav', '.mp3', '.flac', '.ogg'] },
    multiple: false,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      setSelectedAudio(file);
    },
  });

  // Handle image analysis
  const analyzeImage = async () => {
    if (!selectedImage) return;

    setVisionLoading(true);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);

      const response = await fetch('/api/cognitive/vision/analyze', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setVisionAnalysis(result);

      // Draw bounding boxes on canvas
      drawBoundingBoxes(result);
    } catch (error) {
      console.error('Vision analysis failed:', error);
    } finally {
      setVisionLoading(false);
    }
  };

  // Draw bounding boxes on canvas
  const drawBoundingBoxes = (analysis: VisionAnalysis) => {
    if (!canvasRef.current || !imagePreview) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Draw object bounding boxes
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 3;
      ctx.font = '16px Arial';
      ctx.fillStyle = '#00FF00';

      analysis.objects.forEach((obj) => {
        ctx.strokeRect(obj.bbox.x, obj.bbox.y, obj.bbox.width, obj.bbox.height);
        ctx.fillText(
          `${obj.label} (${(obj.confidence * 100).toFixed(0)}%)`,
          obj.bbox.x,
          obj.bbox.y - 5
        );
      });

      // Draw face bounding boxes
      ctx.strokeStyle = '#FF0000';
      ctx.fillStyle = '#FF0000';

      analysis.faces.forEach((face) => {
        ctx.strokeRect(face.bbox.x, face.bbox.y, face.bbox.width, face.bbox.height);
        const label = `${face.gender || 'Unknown'}, ${face.age || '?'} years`;
        ctx.fillText(label, face.bbox.x, face.bbox.y - 5);
      });
    };

    img.src = imagePreview;
  };

  // Handle audio transcription
  const transcribeAudio = async () => {
    if (!selectedAudio) return;

    setSpeechLoading(true);

    try {
      const formData = new FormData();
      formData.append('audio', selectedAudio);

      const response = await fetch('/api/cognitive/speech/transcribe', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setSpeechAnalysis(result);
    } catch (error) {
      console.error('Speech transcription failed:', error);
    } finally {
      setSpeechLoading(false);
    }
  };

  // Handle text-to-speech
  const synthesizeSpeech = async () => {
    if (!synthesisText) return;

    setVisionLoading(true);

    try {
      const response = await fetch('/api/cognitive/speech/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: synthesisText,
          voiceId: selectedVoice,
        }),
      });

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Speech synthesis failed:', error);
    } finally {
      setVisionLoading(false);
    }
  };

  // Load knowledge graph
  const loadGraph = async () => {
    try {
      const response = await fetch('/api/cognitive/graph/entities');
      const entities = await response.json();
      setGraphEntities(entities);

      const relResponse = await fetch('/api/cognitive/graph/relationships');
      const relationships = await relResponse.json();
      setGraphRelationships(relationships);

      // Convert to React Flow format
      const flowNodes: Node[] = entities.map((entity: GraphEntity, index: number) => ({
        id: entity.id,
        data: { label: entity.label },
        position: {
          x: (index % 5) * 200,
          y: Math.floor(index / 5) * 150,
        },
        style: {
          background: getNodeColor(entity.type),
          color: '#fff',
          border: '1px solid #222',
          borderRadius: '8px',
          padding: '10px',
        },
      }));

      const flowEdges: Edge[] = relationships.map((rel: GraphRelationship) => ({
        id: rel.id,
        source: rel.sourceId,
        target: rel.targetId,
        label: rel.type,
        animated: true,
        style: { stroke: '#888' },
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (error) {
      console.error('Graph loading failed:', error);
    }
  };

  // Add entity to graph
  const addEntity = async () => {
    try {
      const response = await fetch('/api/cognitive/graph/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntity),
      });

      const entity = await response.json();
      setGraphEntities([...graphEntities, entity]);

      setAddEntityDialog(false);
      setNewEntity({ label: '', type: '' });

      loadGraph();
    } catch (error) {
      console.error('Entity addition failed:', error);
    }
  };

  // Add relationship to graph
  const addRelationship = async () => {
    try {
      const response = await fetch('/api/cognitive/graph/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRel),
      });

      const relationship = await response.json();
      setGraphRelationships([...graphRelationships, relationship]);

      setAddRelDialog(false);
      setNewRel({ source: '', target: '', type: '' });

      loadGraph();
    } catch (error) {
      console.error('Relationship addition failed:', error);
    }
  };

  // Calculate PageRank
  const calculatePageRank = async () => {
    try {
      const response = await fetch('/api/cognitive/graph/pagerank');
      const results = await response.json();
      setPageRankResults(results);
    } catch (error) {
      console.error('PageRank calculation failed:', error);
    }
  };

  // Get node color by type
  const getNodeColor = (type: string): string => {
    const colors: Record<string, string> = {
      Person: '#FF6B6B',
      Organization: '#4ECDC4',
      Place: '#45B7D1',
      Date: '#FFA07A',
      Thing: '#95E1D3',
    };
    return colors[type] || '#999';
  };

  // Search entities
  const searchEntities = async () => {
    if (!searchQuery) {
      loadGraph();
      return;
    }

    try {
      const response = await fetch(`/api/cognitive/graph/search?q=${encodeURIComponent(searchQuery)}`);
      const results = await response.json();

      const flowNodes: Node[] = results.map((entity: GraphEntity, index: number) => ({
        id: entity.id,
        data: { label: entity.label },
        position: {
          x: (index % 5) * 200,
          y: Math.floor(index / 5) * 150,
        },
        style: {
          background: getNodeColor(entity.type),
          color: '#fff',
          border: '1px solid #222',
          borderRadius: '8px',
          padding: '10px',
        },
      }));

      setNodes(flowNodes);
    } catch (error) {
      console.error('Entity search failed:', error);
    }
  };

  // On edge connect
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Load graph on mount
  useEffect(() => {
    if (activeTab === 3) {
      loadGraph();
    }
  }, [activeTab]);

  // Render overview tab
  const renderOverviewTab = () => {
    const serviceHealth = metricsData?.map((m) => ({
      name: m.serviceName,
      status: m.errorRate < 0.05 ? 'healthy' : m.errorRate < 0.1 ? 'warning' : 'error',
    }));

    const useCaseData = [
      { name: 'Object Detection', value: 450 },
      { name: 'Face Recognition', value: 320 },
      { name: 'OCR', value: 280 },
      { name: 'Speech-to-Text', value: 210 },
      { name: 'Text-to-Speech', value: 180 },
      { name: 'Knowledge Graph', value: 150 },
    ];

    const costData = metricsData?.map((m) => ({
      name: m.serviceName,
      cost: m.cost,
    }));

    const performanceData = metricsData?.map((m) => ({
      name: m.serviceName,
      latency: m.avgLatency,
    }));

    return (
      <Grid container spacing={3}>
        {/* Service Health */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Service Health Status
              </Typography>
              <Grid container spacing={2}>
                {serviceHealth?.map((service) => (
                  <Grid item xs={12} sm={4} key={service.name}>
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor:
                          service.status === 'healthy'
                            ? '#4CAF50'
                            : service.status === 'warning'
                            ? '#FF9800'
                            : '#F44336',
                        color: 'white',
                      }}
                    >
                      <Typography variant="h6">{service.name}</Typography>
                      <Typography>
                        {service.status === 'healthy'
                          ? 'Operational'
                          : service.status === 'warning'
                          ? 'Degraded'
                          : 'Down'}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Usage Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                API Calls by Service
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metricsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="serviceName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="apiCalls" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Use Cases */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Use Cases
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={useCaseData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {useCaseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Cost Analytics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Cost by Service
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cost" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Average Latency (ms)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="latency" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Render vision tab
  const renderVisionTab = () => {
    return (
      <Grid container spacing={3}>
        {/* Image Upload */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upload Image
              </Typography>
              <Box
                {...imageDropzone.getRootProps()}
                sx={{
                  border: '2px dashed #ccc',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': { borderColor: '#888' },
                }}
              >
                <input {...imageDropzone.getInputProps()} />
                <UploadIcon sx={{ fontSize: 48, color: '#888', mb: 2 }} />
                <Typography>Drag and drop an image, or click to select</Typography>
              </Box>

              {imagePreview && (
                <Box sx={{ mt: 2 }}>
                  <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 300 }} />
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={analyzeImage}
                    disabled={visionLoading}
                  >
                    {visionLoading ? <CircularProgress size={24} /> : 'Analyze Image'}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Analysis Results */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Analysis Results
              </Typography>

              {visionAnalysis && (
                <Box>
                  {/* Scene Classification */}
                  <Typography variant="subtitle2" gutterBottom>
                    Scene
                  </Typography>
                  <Chip
                    label={`${visionAnalysis.scene.category} - ${visionAnalysis.scene.subcategory}`}
                    color="primary"
                    sx={{ mb: 2 }}
                  />

                  {/* Detected Objects */}
                  <Typography variant="subtitle2" gutterBottom>
                    Detected Objects ({visionAnalysis.objects.length})
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {visionAnalysis.objects.slice(0, 5).map((obj, index) => (
                      <Chip
                        key={index}
                        label={`${obj.label} (${(obj.confidence * 100).toFixed(0)}%)`}
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>

                  {/* Tags */}
                  <Typography variant="subtitle2" gutterBottom>
                    Tags
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {visionAnalysis.tags.slice(0, 8).map((tag, index) => (
                      <Chip key={index} label={tag.tag} size="small" sx={{ mr: 1, mb: 1 }} />
                    ))}
                  </Box>

                  {/* Image Quality */}
                  <Typography variant="subtitle2" gutterBottom>
                    Image Quality
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Blur: {visionAnalysis.quality.isBlurry ? 'Yes' : 'No'} (Score:{' '}
                      {visionAnalysis.quality.blurScore.toFixed(2)})
                    </Typography>
                    <Typography variant="body2">
                      Brightness: {visionAnalysis.quality.brightness.toFixed(2)}
                    </Typography>
                    <Typography variant="body2">
                      Contrast: {visionAnalysis.quality.contrast.toFixed(2)}
                    </Typography>
                  </Box>

                  {/* NSFW */}
                  <Alert severity={visionAnalysis.nsfw.isSafe ? 'success' : 'error'}>
                    Content: {visionAnalysis.nsfw.classification}
                  </Alert>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Image with Bounding Boxes */}
        {imagePreview && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Image with Detections
                </Typography>
                <canvas ref={canvasRef} style={{ maxWidth: '100%', border: '1px solid #ccc' }} />
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* OCR Results */}
        {visionAnalysis?.ocr && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  OCR Results ({visionAnalysis.ocr.confidence.toFixed(0)}% confidence)
                </Typography>
                <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                  <Typography>{visionAnalysis.ocr.text}</Typography>
                </Paper>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    );
  };

  // Render speech tab
  const renderSpeechTab = () => {
    return (
      <Grid container spacing={3}>
        {/* Speech-to-Text */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Speech-to-Text
              </Typography>
              <Box
                {...audioDropzone.getRootProps()}
                sx={{
                  border: '2px dashed #ccc',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': { borderColor: '#888' },
                }}
              >
                <input {...audioDropzone.getInputProps()} />
                <MicIcon sx={{ fontSize: 48, color: '#888', mb: 2 }} />
                <Typography>Drag and drop audio, or click to select</Typography>
              </Box>

              {selectedAudio && (
                <Box sx={{ mt: 2 }}>
                  <Typography>File: {selectedAudio.name}</Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={transcribeAudio}
                    disabled={speechLoading}
                  >
                    {speechLoading ? <CircularProgress size={24} /> : 'Transcribe Audio'}
                  </Button>
                </Box>
              )}

              {speechAnalysis && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Transcript
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: '#f5f5f5', mb: 2 }}>
                    <Typography>{speechAnalysis.transcript}</Typography>
                  </Paper>

                  <Typography variant="subtitle2" gutterBottom>
                    Sentiment: {speechAnalysis.sentiment.sentiment} (Score:{' '}
                    {speechAnalysis.sentiment.score.toFixed(2)})
                  </Typography>

                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Emotions
                  </Typography>
                  <Box>
                    {speechAnalysis.emotions.map((emotion, index) => (
                      <Chip
                        key={index}
                        label={`${emotion.emotion} (${(emotion.confidence * 100).toFixed(0)}%)`}
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Text-to-Speech */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Text-to-Speech
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Text to synthesize"
                value={synthesisText}
                onChange={(e) => setSynthesisText(e.target.value)}
                sx={{ mb: 2 }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Voice</InputLabel>
                <Select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} label="Voice">
                  <MenuItem value="en-US-male-1">English (US) - Male</MenuItem>
                  <MenuItem value="en-US-female-1">English (US) - Female</MenuItem>
                  <MenuItem value="en-GB-male-1">English (UK) - Male</MenuItem>
                  <MenuItem value="en-GB-female-1">English (UK) - Female</MenuItem>
                  <MenuItem value="es-ES-male-1">Spanish - Male</MenuItem>
                  <MenuItem value="es-ES-female-1">Spanish - Female</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant="contained"
                fullWidth
                onClick={synthesizeSpeech}
                disabled={!synthesisText || visionLoading}
                startIcon={<PlayIcon />}
              >
                Synthesize Speech
              </Button>

              <audio
                ref={audioRef}
                controls
                style={{ width: '100%', marginTop: 16 }}
                onEnded={() => setIsPlaying(false)}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Speaker Diarization */}
        {speechAnalysis && speechAnalysis.segments.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Speaker Diarization
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Time</TableCell>
                        <TableCell>Speaker</TableCell>
                        <TableCell>Text</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {speechAnalysis.segments.map((segment, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {segment.startTime.toFixed(1)}s - {segment.endTime.toFixed(1)}s
                          </TableCell>
                          <TableCell>Speaker {segment.speakerId ?? 0}</TableCell>
                          <TableCell>{segment.text}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    );
  };

  // Render knowledge graph tab
  const renderKnowledgeGraphTab = () => {
    return (
      <Grid container spacing={3}>
        {/* Graph Controls */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Search entities"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchEntities()}
                    InputProps={{
                      endAdornment: (
                        <IconButton onClick={searchEntities}>
                          <SearchIcon />
                        </IconButton>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setAddEntityDialog(true)}
                    sx={{ mr: 1 }}
                  >
                    Add Entity
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setAddRelDialog(true)}
                    sx={{ mr: 1 }}
                  >
                    Add Relationship
                  </Button>
                  <Button variant="outlined" onClick={calculatePageRank} sx={{ mr: 1 }}>
                    Calculate PageRank
                  </Button>
                  <Button variant="outlined" onClick={loadGraph}>
                    Refresh
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Graph Visualization */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Knowledge Graph
              </Typography>
              <Box sx={{ height: 600, border: '1px solid #ccc' }}>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  fitView
                >
                  <Background />
                  <Controls />
                  <MiniMap />
                </ReactFlow>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Graph Stats */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Graph Statistics
              </Typography>
              <List>
                <ListItem>
                  <ListItemText primary="Entities" secondary={graphEntities.length} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Relationships" secondary={graphRelationships.length} />
                </ListItem>
                <Divider />
              </List>

              {pageRankResults.length > 0 && (
                <>
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Top Entities (PageRank)
                  </Typography>
                  <List dense>
                    {pageRankResults.slice(0, 5).map((result, index) => {
                      const entity = graphEntities.find((e) => e.id === result.entityId);
                      return (
                        <ListItem key={index}>
                          <ListItemText
                            primary={entity?.label || result.entityId}
                            secondary={`Score: ${result.score.toFixed(4)}`}
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Render testing tab
  const renderTestingTab = () => {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Service Testing
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Test all cognitive services with sample data
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <Button variant="outlined" fullWidth onClick={() => alert('Vision test')}>
                    Test Vision API
                  </Button>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Button variant="outlined" fullWidth onClick={() => alert('Speech test')}>
                    Test Speech API
                  </Button>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Button variant="outlined" fullWidth onClick={() => alert('NLP test')}>
                    Test NLP API
                  </Button>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Button variant="outlined" fullWidth onClick={() => alert('Graph test')}>
                    Test Graph API
                  </Button>
                </Grid>
              </Grid>

              {testResults.length > 0 && (
                <TableContainer sx={{ mt: 3 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Service</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Latency (ms)</TableCell>
                        <TableCell>Result</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {testResults.map((result, index) => (
                        <TableRow key={index}>
                          <TableCell>{result.service}</TableCell>
                          <TableCell>
                            <Chip
                              label={result.status}
                              color={result.status === 'success' ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{result.latency}</TableCell>
                          <TableCell>{result.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Render analytics tab
  const renderAnalyticsTab = () => {
    const accuracyData = [
      { subject: 'Vision', A: 95, fullMark: 100 },
      { subject: 'Speech', A: 92, fullMark: 100 },
      { subject: 'NLP', A: 88, fullMark: 100 },
      { subject: 'Graph', A: 90, fullMark: 100 },
    ];

    const errorData = [
      { name: 'Timeout', value: 15 },
      { name: 'Invalid Input', value: 25 },
      { name: 'Rate Limit', value: 10 },
      { name: 'Server Error', value: 5 },
    ];

    return (
      <Grid container spacing={3}>
        {/* Usage Trends */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Usage Trends (Last 30 Days)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="vision" stroke="#8884d8" />
                  <Line type="monotone" dataKey="speech" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="knowledgeGraph" stroke="#ffc658" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Accuracy Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Accuracy Metrics
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={accuracyData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Accuracy" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Error Analysis */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Error Analysis
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={errorData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {errorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Cost Optimization */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cost Optimization Recommendations
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Enable caching"
                    secondary="Save up to 30% on repeated API calls"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Use batch processing"
                    secondary="Reduce costs by 20% with batch operations"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Optimize image sizes"
                    secondary="Reduce processing time and costs by 15%"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Cognitive Services Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Monitor and test computer vision, speech, and knowledge graph services
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Overview" />
          <Tab label="Vision" icon={<ImageIcon />} iconPosition="start" />
          <Tab label="Speech" icon={<MicIcon />} iconPosition="start" />
          <Tab label="Knowledge Graph" icon={<GraphIcon />} iconPosition="start" />
          <Tab label="Testing" icon={<TestingIcon />} iconPosition="start" />
          <Tab label="Analytics" icon={<AnalyticsIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {activeTab === 0 && renderOverviewTab()}
      {activeTab === 1 && renderVisionTab()}
      {activeTab === 2 && renderSpeechTab()}
      {activeTab === 3 && renderKnowledgeGraphTab()}
      {activeTab === 4 && renderTestingTab()}
      {activeTab === 5 && renderAnalyticsTab()}

      {/* Add Entity Dialog */}
      <Dialog open={addEntityDialog} onClose={() => setAddEntityDialog(false)}>
        <DialogTitle>Add Entity</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Label"
            fullWidth
            value={newEntity.label}
            onChange={(e) => setNewEntity({ ...newEntity, label: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Type"
            fullWidth
            value={newEntity.type}
            onChange={(e) => setNewEntity({ ...newEntity, type: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddEntityDialog(false)}>Cancel</Button>
          <Button onClick={addEntity} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Relationship Dialog */}
      <Dialog open={addRelDialog} onClose={() => setAddRelDialog(false)}>
        <DialogTitle>Add Relationship</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={graphEntities}
            getOptionLabel={(option) => option.label}
            onChange={(_, value) => setNewRel({ ...newRel, source: value?.id || '' })}
            renderInput={(params) => <TextField {...params} label="Source Entity" margin="dense" />}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Relationship Type"
            fullWidth
            value={newRel.type}
            onChange={(e) => setNewRel({ ...newRel, type: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Autocomplete
            options={graphEntities}
            getOptionLabel={(option) => option.label}
            onChange={(_, value) => setNewRel({ ...newRel, target: value?.id || '' })}
            renderInput={(params) => <TextField {...params} label="Target Entity" margin="dense" />}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddRelDialog(false)}>Cancel</Button>
          <Button onClick={addRelationship} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CognitiveDashboard;
