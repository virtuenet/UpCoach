import React, { useState, useEffect, useCallback, useMemo, useRef, useContext } from 'react';
import {
  Box,
  TextField,
  Typography,
  Chip,
  LinearProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Button,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface SEOHelperProps {
  title: string;
  description: string;
  content: string;
  onUpdate: (data: { title?: string; description?: string; keywords?: string[] }) => void;
}

interface SEOAnalysis {
  score: number;
  issues: SEOIssue[];
  suggestions: string[];
  keywords: string[];
}

interface SEOIssue {
  type: 'error' | 'warning' | 'success';
  message: string;
  field?: string;
}

const SEOHelper: React.FC<SEOHelperProps> = ({ title, description, content, onUpdate }) => {
  const [seoTitle, setSeoTitle] = useState(title || '');
  const [seoDescription, setSeoDescription] = useState(description || '');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    setSeoTitle(title || '');
    setSeoDescription(description || '');
  }, [title, description]);

  useEffect(() => {
    const timer = setTimeout(() => {
      analyzeSEO();
    }, 500);

    return () => clearTimeout(timer);
  }, [seoTitle, seoDescription, content, keywords]);

  const analyzeSEO = () => {
    setAnalyzing(true);

    const issues: SEOIssue[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Title analysis
    if (!seoTitle) {
      issues.push({
        type: 'error',
        message: 'SEO title is missing',
        field: 'title',
      });
      score -= 20;
    } else {
      if (seoTitle.length < 30) {
        issues.push({
          type: 'warning',
          message: 'SEO title is too short (min 30 chars)',
          field: 'title',
        });
        score -= 10;
      } else if (seoTitle.length > 60) {
        issues.push({
          type: 'warning',
          message: 'SEO title is too long (max 60 chars)',
          field: 'title',
        });
        score -= 5;
      } else {
        issues.push({
          type: 'success',
          message: 'SEO title length is optimal',
          field: 'title',
        });
      }
    }

    // Description analysis
    if (!seoDescription) {
      issues.push({
        type: 'error',
        message: 'SEO description is missing',
        field: 'description',
      });
      score -= 20;
    } else {
      if (seoDescription.length < 120) {
        issues.push({
          type: 'warning',
          message: 'SEO description is too short (min 120 chars)',
          field: 'description',
        });
        score -= 10;
      } else if (seoDescription.length > 160) {
        issues.push({
          type: 'warning',
          message: 'SEO description is too long (max 160 chars)',
          field: 'description',
        });
        score -= 5;
      } else {
        issues.push({
          type: 'success',
          message: 'SEO description length is optimal',
          field: 'description',
        });
      }
    }

    // Content analysis
    const plainContent = content.replace(/<[^>]*>/g, '');
    const wordCount = plainContent.split(/\s+/).filter(word => word.length > 0).length;

    if (wordCount < 300) {
      issues.push({
        type: 'warning',
        message: 'Content is too short for good SEO (min 300 words)',
      });
      score -= 15;
    } else if (wordCount > 300 && wordCount < 1000) {
      issues.push({ type: 'success', message: 'Content length is good' });
    } else if (wordCount >= 1000) {
      issues.push({
        type: 'success',
        message: 'Content length is excellent for SEO',
      });
    }

    // Keyword analysis
    if (keywords.length === 0) {
      issues.push({ type: 'warning', message: 'No keywords added' });
      score -= 10;
    } else {
      // Check keyword density
      keywords.forEach(keyword => {
        const regex = new RegExp(keyword, 'gi');
        const matches = plainContent.match(regex);
        const density = matches ? (matches.length / wordCount) * 100 : 0;

        if (density === 0) {
          issues.push({
            type: 'warning',
            message: `Keyword "${keyword}" not found in content`,
          });
          score -= 5;
        } else if (density > 3) {
          issues.push({
            type: 'warning',
            message: `Keyword "${keyword}" might be overused (${density.toFixed(1)}%)`,
          });
          score -= 3;
        }
      });
    }

    // Headings analysis
    const h1Count = (content.match(/<h1/gi) || []).length;
    const h2Count = (content.match(/<h2/gi) || []).length;

    if (h1Count === 0) {
      issues.push({
        type: 'warning',
        message: 'No H1 heading found in content',
      });
      score -= 10;
    }

    if (h2Count === 0) {
      issues.push({
        type: 'warning',
        message: 'Consider adding H2 headings for better structure',
      });
      score -= 5;
    }

    // Images analysis
    const imgCount = (content.match(/<img/gi) || []).length;
    const altMissing = (content.match(/<img(?![^>]*alt=)[^>]*>/gi) || []).length;

    if (imgCount > 0 && altMissing > 0) {
      issues.push({
        type: 'warning',
        message: `${altMissing} image(s) missing alt text`,
      });
      score -= 5;
    }

    // Generate suggestions
    if (score < 80) {
      suggestions.push('Focus on fixing error issues first');
    }
    if (wordCount < 1000) {
      suggestions.push('Consider expanding your content for better SEO performance');
    }
    if (keywords.length < 3) {
      suggestions.push('Add more relevant keywords (3-5 recommended)');
    }
    suggestions.push('Include internal and external links in your content');
    suggestions.push('Ensure your content is unique and provides value');

    setAnalysis({
      score: Math.max(0, score),
      issues,
      suggestions,
      keywords: extractKeywords(plainContent),
    });

    setAnalyzing(false);
  };

  const extractKeywords = (text: string): string[] => {
    // Simple keyword extraction - in production, use NLP library
    const words = text.toLowerCase().split(/\s+/);
    const wordFreq: { [key: string]: number } = {};

    words.forEach(word => {
      word = word.replace(/[^a-z0-9]/g, '');
      if (word.length > 4 && !commonWords.includes(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    return Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  };

  const handleAddKeyword = () => {
    if (keywordInput && !keywords.includes(keywordInput)) {
      const newKeywords = [...keywords, keywordInput];
      setKeywords(newKeywords);
      setKeywordInput('');
      onUpdate({ keywords: newKeywords });
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    const newKeywords = keywords.filter(k => k !== keyword);
    setKeywords(newKeywords);
    onUpdate({ keywords: newKeywords });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getIssueIcon = (type: SEOIssue['type']) => {
    switch (type) {
      case 'success':
        return <CheckIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <WarningIcon color="error" />;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 45%' }}>
          <TextField
            fullWidth
            label="SEO Title"
            value={seoTitle}
            onChange={e => {
              setSeoTitle(e.target.value);
              onUpdate({ title: e.target.value });
            }}
            helperText={`${seoTitle.length}/60 characters`}
            sx={{ mb: 3 }}
            error={seoTitle.length > 60}
          />

          <TextField
            fullWidth
            label="SEO Description"
            value={seoDescription}
            onChange={e => {
              setSeoDescription(e.target.value);
              onUpdate({ description: e.target.value });
            }}
            multiline
            rows={3}
            helperText={`${seoDescription.length}/160 characters`}
            sx={{ mb: 3 }}
            error={seoDescription.length > 160}
          />

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Focus Keywords
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                size="small"
                placeholder="Add keyword"
                value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
              />
              <Button size="small" onClick={handleAddKeyword} disabled={!keywordInput}>
                Add
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {keywords.map(keyword => (
                <Chip
                  key={keyword}
                  label={keyword}
                  onDelete={() => handleRemoveKeyword(keyword)}
                  size="small"
                />
              ))}
            </Box>
          </Box>

          {analysis?.keywords && analysis.keywords.length > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Suggested keywords from your content:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {analysis.keywords.map(keyword => (
                  <Chip
                    key={keyword}
                    label={keyword}
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      if (!keywords.includes(keyword)) {
                        const newKeywords = [...keywords, keyword];
                        setKeywords(newKeywords);
                        onUpdate({ keywords: newKeywords });
                      }
                    }}
                  />
                ))}
              </Box>
            </Alert>
          )}
        </Box>

        <Box sx={{ flex: '1 1 45%' }}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                SEO Analysis
              </Typography>
              <IconButton size="small" onClick={analyzeSEO}>
                <RefreshIcon />
              </IconButton>
            </Box>

            {analyzing ? (
              <LinearProgress />
            ) : analysis ? (
              <>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    SEO Score
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h3" color={`${getScoreColor(analysis.score)}.main`}>
                      {analysis.score}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      / 100
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={analysis.score}
                    color={getScoreColor(analysis.score)}
                    sx={{ mt: 1, height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Typography variant="subtitle2" gutterBottom>
                  Issues & Recommendations
                </Typography>
                <List dense>
                  {analysis.issues.map((issue, index) => (
                    <ListItem key={index}>
                      <ListItemIcon sx={{ minWidth: 36 }}>{getIssueIcon(issue.type)}</ListItemIcon>
                      <ListItemText
                        primary={issue.message}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>

                {analysis.suggestions.length > 0 && (
                  <>
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      Tips for Improvement
                    </Typography>
                    <List dense>
                      {analysis.suggestions.map((suggestion, index) => (
                        <ListItem key={index}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <InfoIcon color="info" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={suggestion}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
              </>
            ) : null}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

// Common words to exclude from keyword extraction
const commonWords = [
  'the',
  'be',
  'to',
  'of',
  'and',
  'a',
  'in',
  'that',
  'have',
  'i',
  'it',
  'for',
  'not',
  'on',
  'with',
  'he',
  'as',
  'you',
  'do',
  'at',
  'this',
  'but',
  'his',
  'by',
  'from',
  'they',
  'we',
  'say',
  'her',
  'she',
  'or',
  'an',
  'will',
  'my',
  'one',
  'all',
  'would',
  'there',
  'their',
  'what',
  'so',
  'up',
  'out',
  'if',
  'about',
  'who',
  'get',
  'which',
  'go',
  'me',
  'when',
  'make',
  'can',
  'like',
  'time',
  'no',
  'just',
  'him',
  'know',
  'take',
  'people',
  'into',
  'year',
  'your',
  'good',
  'some',
  'could',
  'them',
  'see',
  'other',
  'than',
  'then',
  'now',
  'look',
  'only',
  'come',
  'its',
  'over',
  'think',
  'also',
  'back',
  'after',
  'use',
  'two',
  'how',
  'our',
  'work',
  'first',
  'well',
  'way',
  'even',
  'new',
  'want',
  'because',
  'any',
  'these',
  'give',
  'day',
  'most',
  'us',
  'is',
  'was',
  'are',
  'been',
  'has',
  'had',
  'were',
  'said',
  'did',
  'getting',
  'made',
  'being',
  'where',
  'much',
  'too',
  'very',
  'still',
  'being',
  'going',
];

export default SEOHelper;
