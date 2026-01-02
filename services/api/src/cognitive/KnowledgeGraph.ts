import axios from 'axios';
import * as natural from 'natural';
import compromise from 'compromise';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

interface Entity {
  id: string;
  label: string;
  type: string;
  properties: Record<string, any>;
  aliases: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  properties: Record<string, any>;
  weight: number;
  createdAt: Date;
}

interface Triple {
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
}

interface GraphQuery {
  type: 'entity' | 'relationship' | 'path' | 'pattern';
  params: Record<string, any>;
}

interface QueryResult {
  entities: Entity[];
  relationships: Relationship[];
  paths?: Path[];
}

interface Path {
  entities: Entity[];
  relationships: Relationship[];
  length: number;
  weight: number;
}

interface InferenceRule {
  id: string;
  type: 'transitive' | 'symmetric' | 'inverse' | 'subsumption';
  pattern: string[];
  conclusion: string[];
}

interface GraphEmbedding {
  entityId: string;
  vector: number[];
  dimension: number;
}

interface Community {
  id: string;
  entities: string[];
  cohesion: number;
}

interface PageRankResult {
  entityId: string;
  score: number;
  rank: number;
}

interface CentralityResult {
  entityId: string;
  degreeCentrality: number;
  betweennessCentrality: number;
  closenessCentrality: number;
}

interface LinkPrediction {
  sourceId: string;
  targetId: string;
  probability: number;
  type: string;
}

interface OntologySchema {
  entityTypes: string[];
  relationshipTypes: string[];
  constraints: Array<{
    type: string;
    domain: string;
    range: string;
  }>;
}

interface ExportFormat {
  format: 'json' | 'graphml' | 'csv' | 'rdf';
  data: any;
}

interface KnowledgeGraphConfig {
  maxEntities: number;
  maxRelationships: number;
  similarityThreshold: number;
  pageRankIterations: number;
  pageRankDamping: number;
  embeddingDimension: number;
}

export class KnowledgeGraph extends EventEmitter {
  private entities: Map<string, Entity> = new Map();
  private relationships: Map<string, Relationship> = new Map();
  private adjacencyList: Map<string, Set<string>> = new Map();
  private reverseAdjacencyList: Map<string, Set<string>> = new Map();
  private inferenceRules: InferenceRule[] = [];
  private embeddings: Map<string, GraphEmbedding> = new Map();
  private config: KnowledgeGraphConfig;
  private logger: any;
  private tokenizer: any;
  private tfidf: any;

  constructor(config: Partial<KnowledgeGraphConfig> = {}) {
    super();
    this.config = {
      maxEntities: config.maxEntities || 100000,
      maxRelationships: config.maxRelationships || 500000,
      similarityThreshold: config.similarityThreshold || 0.8,
      pageRankIterations: config.pageRankIterations || 100,
      pageRankDamping: config.pageRankDamping || 0.85,
      embeddingDimension: config.embeddingDimension || 128,
    };
    this.logger = console;
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
    this.initializeInferenceRules();
  }

  private initializeInferenceRules(): void {
    // Transitive rules
    this.inferenceRules.push({
      id: 'transitive-parent',
      type: 'transitive',
      pattern: ['?a', 'parentOf', '?b', '?b', 'parentOf', '?c'],
      conclusion: ['?a', 'ancestorOf', '?c'],
    });

    // Symmetric rules
    this.inferenceRules.push({
      id: 'symmetric-colleague',
      type: 'symmetric',
      pattern: ['?a', 'colleagueOf', '?b'],
      conclusion: ['?b', 'colleagueOf', '?a'],
    });

    // Inverse rules
    this.inferenceRules.push({
      id: 'inverse-parent-child',
      type: 'inverse',
      pattern: ['?a', 'parentOf', '?b'],
      conclusion: ['?b', 'childOf', '?a'],
    });

    this.logger.info(`Initialized ${this.inferenceRules.length} inference rules`);
  }

  // ==================== Graph Construction ====================

  async extractEntitiesFromText(text: string): Promise<Entity[]> {
    try {
      const doc = compromise(text);
      const entities: Entity[] = [];

      // Extract people
      doc.people().forEach((person) => {
        const name = person.text();
        entities.push(this.createEntity(name, 'Person'));
      });

      // Extract places
      doc.places().forEach((place) => {
        const name = place.text();
        entities.push(this.createEntity(name, 'Place'));
      });

      // Extract organizations
      doc.organizations().forEach((org) => {
        const name = org.text();
        entities.push(this.createEntity(name, 'Organization'));
      });

      // Extract dates
      doc.dates().forEach((date) => {
        const name = date.text();
        entities.push(this.createEntity(name, 'Date'));
      });

      // Extract values/numbers
      doc.values().forEach((value) => {
        const name = value.text();
        entities.push(this.createEntity(name, 'Value'));
      });

      this.logger.info(`Extracted ${entities.length} entities from text`);
      return entities;
    } catch (error) {
      this.logger.error('Entity extraction failed:', error);
      throw new Error(`Entity extraction failed: ${error.message}`);
    }
  }

  async extractRelationshipsFromText(text: string): Promise<Triple[]> {
    try {
      const doc = compromise(text);
      const triples: Triple[] = [];

      // Extract subject-verb-object patterns
      const sentences = doc.sentences().out('array');

      sentences.forEach((sentence) => {
        const sentDoc = compromise(sentence);

        const subjects = sentDoc.match('#Noun+').out('array');
        const verbs = sentDoc.verbs().out('array');
        const objects = sentDoc.match('#Noun+').out('array');

        // Create triples
        subjects.forEach((subject) => {
          verbs.forEach((verb) => {
            objects.forEach((object) => {
              if (subject !== object) {
                triples.push({
                  subject,
                  predicate: verb,
                  object,
                  confidence: 0.7,
                });
              }
            });
          });
        });
      });

      // Deduplicate
      const uniqueTriples = this.deduplicateTriples(triples);

      this.logger.info(`Extracted ${uniqueTriples.length} relationship triples from text`);
      return uniqueTriples;
    } catch (error) {
      this.logger.error('Relationship extraction failed:', error);
      throw new Error(`Relationship extraction failed: ${error.message}`);
    }
  }

  addEntity(label: string, type: string, properties: Record<string, any> = {}): Entity {
    try {
      // Check for existing entity
      const existing = this.findEntityByLabel(label, type);
      if (existing) {
        // Update properties
        existing.properties = { ...existing.properties, ...properties };
        existing.updatedAt = new Date();
        this.entities.set(existing.id, existing);
        return existing;
      }

      // Create new entity
      const entity = this.createEntity(label, type, properties);
      this.entities.set(entity.id, entity);
      this.adjacencyList.set(entity.id, new Set());
      this.reverseAdjacencyList.set(entity.id, new Set());

      this.emit('entity-added', entity);
      this.logger.info(`Added entity: ${label} (${type})`);

      return entity;
    } catch (error) {
      this.logger.error('Entity addition failed:', error);
      throw new Error(`Entity addition failed: ${error.message}`);
    }
  }

  addRelationship(
    sourceLabel: string,
    targetLabel: string,
    type: string,
    properties: Record<string, any> = {}
  ): Relationship {
    try {
      // Get or create entities
      const source = this.findOrCreateEntity(sourceLabel);
      const target = this.findOrCreateEntity(targetLabel);

      // Create relationship
      const relationship: Relationship = {
        id: `${source.id}-${type}-${target.id}`,
        sourceId: source.id,
        targetId: target.id,
        type,
        properties,
        weight: properties.weight || 1.0,
        createdAt: new Date(),
      };

      this.relationships.set(relationship.id, relationship);

      // Update adjacency lists
      this.adjacencyList.get(source.id)!.add(target.id);
      this.reverseAdjacencyList.get(target.id)!.add(source.id);

      this.emit('relationship-added', relationship);
      this.logger.info(`Added relationship: ${sourceLabel} -[${type}]-> ${targetLabel}`);

      return relationship;
    } catch (error) {
      this.logger.error('Relationship addition failed:', error);
      throw new Error(`Relationship addition failed: ${error.message}`);
    }
  }

  async populateFromTriples(triples: Triple[]): Promise<void> {
    try {
      for (const triple of triples) {
        this.addRelationship(triple.subject, triple.object, triple.predicate, {
          confidence: triple.confidence,
        });
      }

      this.logger.info(`Populated graph with ${triples.length} triples`);
    } catch (error) {
      this.logger.error('Graph population failed:', error);
      throw new Error(`Graph population failed: ${error.message}`);
    }
  }

  async alignSchema(): Promise<void> {
    try {
      const entities = Array.from(this.entities.values());
      const merged: Set<string> = new Set();

      // Find and merge similar entities
      for (let i = 0; i < entities.length; i++) {
        if (merged.has(entities[i].id)) continue;

        for (let j = i + 1; j < entities.length; j++) {
          if (merged.has(entities[j].id)) continue;

          const similarity = this.calculateEntitySimilarity(entities[i], entities[j]);

          if (similarity > this.config.similarityThreshold) {
            this.mergeEntities(entities[i], entities[j]);
            merged.add(entities[j].id);
          }
        }
      }

      this.logger.info(`Merged ${merged.size} similar entities`);
    } catch (error) {
      this.logger.error('Schema alignment failed:', error);
      throw new Error(`Schema alignment failed: ${error.message}`);
    }
  }

  getVersion(): string {
    return `v${Date.now()}_${this.entities.size}_${this.relationships.size}`;
  }

  // ==================== Semantic Reasoning ====================

  async applyInferenceRules(): Promise<number> {
    try {
      let inferredCount = 0;

      for (const rule of this.inferenceRules) {
        switch (rule.type) {
          case 'transitive':
            inferredCount += this.applyTransitiveRule(rule);
            break;
          case 'symmetric':
            inferredCount += this.applySymmetricRule(rule);
            break;
          case 'inverse':
            inferredCount += this.applyInverseRule(rule);
            break;
        }
      }

      this.logger.info(`Applied inference rules, inferred ${inferredCount} new relationships`);
      return inferredCount;
    } catch (error) {
      this.logger.error('Inference failed:', error);
      throw new Error(`Inference failed: ${error.message}`);
    }
  }

  findShortestPath(sourceLabel: string, targetLabel: string): Path | null {
    try {
      const source = this.findEntityByLabel(sourceLabel);
      const target = this.findEntityByLabel(targetLabel);

      if (!source || !target) return null;

      // BFS for shortest path
      const queue: Array<{ entityId: string; path: string[]; rels: string[] }> = [
        { entityId: source.id, path: [source.id], rels: [] },
      ];
      const visited = new Set<string>([source.id]);

      while (queue.length > 0) {
        const current = queue.shift()!;

        if (current.entityId === target.id) {
          // Found path
          return this.constructPath(current.path, current.rels);
        }

        const neighbors = this.adjacencyList.get(current.entityId) || new Set();

        for (const neighborId of neighbors) {
          if (!visited.has(neighborId)) {
            visited.add(neighborId);

            const rel = this.findRelationship(current.entityId, neighborId);

            queue.push({
              entityId: neighborId,
              path: [...current.path, neighborId],
              rels: [...current.rels, rel?.id || ''],
            });
          }
        }
      }

      return null;
    } catch (error) {
      this.logger.error('Path finding failed:', error);
      return null;
    }
  }

  calculateSimilarity(entity1Label: string, entity2Label: string): number {
    try {
      const entity1 = this.findEntityByLabel(entity1Label);
      const entity2 = this.findEntityByLabel(entity2Label);

      if (!entity1 || !entity2) return 0;

      return this.calculateEntitySimilarity(entity1, entity2);
    } catch (error) {
      this.logger.error('Similarity calculation failed:', error);
      return 0;
    }
  }

  async generateEmbeddings(method: 'random-walk' | 'adjacency' = 'random-walk'): Promise<void> {
    try {
      const entities = Array.from(this.entities.keys());

      for (const entityId of entities) {
        let vector: number[];

        if (method === 'random-walk') {
          vector = this.generateRandomWalkEmbedding(entityId);
        } else {
          vector = this.generateAdjacencyEmbedding(entityId);
        }

        this.embeddings.set(entityId, {
          entityId,
          vector,
          dimension: this.config.embeddingDimension,
        });
      }

      this.logger.info(`Generated embeddings for ${entities.length} entities using ${method}`);
    } catch (error) {
      this.logger.error('Embedding generation failed:', error);
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  async detectCommunities(): Promise<Community[]> {
    try {
      // Label propagation algorithm for community detection
      const labels = new Map<string, string>();
      const entities = Array.from(this.entities.keys());

      // Initialize each node with unique label
      entities.forEach((id) => labels.set(id, id));

      // Iterate until convergence or max iterations
      let changed = true;
      let iterations = 0;
      const maxIterations = 100;

      while (changed && iterations < maxIterations) {
        changed = false;
        iterations++;

        // Shuffle entities for randomness
        const shuffled = this.shuffle([...entities]);

        for (const entityId of shuffled) {
          const neighbors = this.adjacencyList.get(entityId) || new Set();

          if (neighbors.size === 0) continue;

          // Count neighbor labels
          const labelCounts = new Map<string, number>();

          for (const neighborId of neighbors) {
            const label = labels.get(neighborId)!;
            labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
          }

          // Find most common label
          let maxCount = 0;
          let maxLabel = labels.get(entityId)!;

          for (const [label, count] of labelCounts.entries()) {
            if (count > maxCount) {
              maxCount = count;
              maxLabel = label;
            }
          }

          // Update if changed
          if (maxLabel !== labels.get(entityId)) {
            labels.set(entityId, maxLabel);
            changed = true;
          }
        }
      }

      // Group entities by label
      const communities = new Map<string, string[]>();

      for (const [entityId, label] of labels.entries()) {
        if (!communities.has(label)) {
          communities.set(label, []);
        }
        communities.get(label)!.push(entityId);
      }

      // Create community objects
      const result: Community[] = [];

      for (const [id, entityIds] of communities.entries()) {
        if (entityIds.length > 1) {
          result.push({
            id,
            entities: entityIds,
            cohesion: this.calculateCohesion(entityIds),
          });
        }
      }

      this.logger.info(`Detected ${result.length} communities in ${iterations} iterations`);
      return result;
    } catch (error) {
      this.logger.error('Community detection failed:', error);
      throw new Error(`Community detection failed: ${error.message}`);
    }
  }

  // ==================== Knowledge Retrieval ====================

  query(query: GraphQuery): QueryResult {
    try {
      switch (query.type) {
        case 'entity':
          return this.queryEntities(query.params);
        case 'relationship':
          return this.queryRelationships(query.params);
        case 'path':
          return this.queryPaths(query.params);
        case 'pattern':
          return this.queryPattern(query.params);
        default:
          throw new Error(`Unknown query type: ${query.type}`);
      }
    } catch (error) {
      this.logger.error('Query execution failed:', error);
      throw new Error(`Query execution failed: ${error.message}`);
    }
  }

  findPattern(pattern: Triple[]): QueryResult {
    try {
      const results: QueryResult = { entities: [], relationships: [] };

      // Simple pattern matching
      for (const triple of pattern) {
        const rels = Array.from(this.relationships.values()).filter((rel) => {
          const source = this.entities.get(rel.sourceId);
          const target = this.entities.get(rel.targetId);

          if (!source || !target) return false;

          const subjectMatch = triple.subject === '*' || source.label === triple.subject;
          const predicateMatch = triple.predicate === '*' || rel.type === triple.predicate;
          const objectMatch = triple.object === '*' || target.label === triple.object;

          return subjectMatch && predicateMatch && objectMatch;
        });

        results.relationships.push(...rels);

        rels.forEach((rel) => {
          const source = this.entities.get(rel.sourceId)!;
          const target = this.entities.get(rel.targetId)!;

          if (!results.entities.find((e) => e.id === source.id)) {
            results.entities.push(source);
          }
          if (!results.entities.find((e) => e.id === target.id)) {
            results.entities.push(target);
          }
        });
      }

      this.logger.info(`Found ${results.entities.length} entities matching pattern`);
      return results;
    } catch (error) {
      this.logger.error('Pattern matching failed:', error);
      throw new Error(`Pattern matching failed: ${error.message}`);
    }
  }

  getKHopNeighbors(entityLabel: string, k: number): Entity[] {
    try {
      const entity = this.findEntityByLabel(entityLabel);
      if (!entity) return [];

      const neighbors = new Set<string>();
      const queue: Array<{ id: string; depth: number }> = [{ id: entity.id, depth: 0 }];
      const visited = new Set<string>([entity.id]);

      while (queue.length > 0) {
        const current = queue.shift()!;

        if (current.depth >= k) continue;

        const adjacent = this.adjacencyList.get(current.id) || new Set();

        for (const neighborId of adjacent) {
          if (!visited.has(neighborId)) {
            visited.add(neighborId);
            neighbors.add(neighborId);
            queue.push({ id: neighborId, depth: current.depth + 1 });
          }
        }
      }

      const result = Array.from(neighbors)
        .map((id) => this.entities.get(id)!)
        .filter(Boolean);

      this.logger.info(`Found ${result.length} ${k}-hop neighbors of ${entityLabel}`);
      return result;
    } catch (error) {
      this.logger.error('K-hop neighbor search failed:', error);
      return [];
    }
  }

  semanticSearch(query: string, limit: number = 10): Entity[] {
    try {
      const queryTokens = this.tokenizer.tokenize(query.toLowerCase());
      const entities = Array.from(this.entities.values());

      const scores = entities.map((entity) => {
        const labelTokens = this.tokenizer.tokenize(entity.label.toLowerCase());
        const typeTokens = this.tokenizer.tokenize(entity.type.toLowerCase());

        // Calculate TF-IDF similarity
        const labelScore = this.calculateTokenOverlap(queryTokens, labelTokens);
        const typeScore = this.calculateTokenOverlap(queryTokens, typeTokens);

        return {
          entity,
          score: labelScore * 0.7 + typeScore * 0.3,
        };
      });

      scores.sort((a, b) => b.score - a.score);

      const result = scores.slice(0, limit).map((s) => s.entity);

      this.logger.info(`Semantic search returned ${result.length} results for "${query}"`);
      return result;
    } catch (error) {
      this.logger.error('Semantic search failed:', error);
      return [];
    }
  }

  // ==================== Graph Analytics ====================

  calculatePageRank(): PageRankResult[] {
    try {
      const entities = Array.from(this.entities.keys());
      const n = entities.length;

      if (n === 0) return [];

      const d = this.config.pageRankDamping;
      const scores = new Map<string, number>();

      // Initialize scores
      entities.forEach((id) => scores.set(id, 1.0 / n));

      // Iterate
      for (let i = 0; i < this.config.pageRankIterations; i++) {
        const newScores = new Map<string, number>();

        for (const entityId of entities) {
          let score = (1 - d) / n;

          const incomingEdges = this.reverseAdjacencyList.get(entityId) || new Set();

          for (const sourceId of incomingEdges) {
            const sourceOutDegree = (this.adjacencyList.get(sourceId) || new Set()).size;
            if (sourceOutDegree > 0) {
              score += (d * scores.get(sourceId)!) / sourceOutDegree;
            }
          }

          newScores.set(entityId, score);
        }

        // Update scores
        newScores.forEach((score, id) => scores.set(id, score));
      }

      // Create results
      const results: PageRankResult[] = Array.from(scores.entries()).map(([entityId, score]) => ({
        entityId,
        score,
        rank: 0,
      }));

      // Sort and assign ranks
      results.sort((a, b) => b.score - a.score);
      results.forEach((result, index) => {
        result.rank = index + 1;
      });

      this.logger.info(`Calculated PageRank for ${results.length} entities`);
      return results;
    } catch (error) {
      this.logger.error('PageRank calculation failed:', error);
      throw new Error(`PageRank calculation failed: ${error.message}`);
    }
  }

  calculateCentrality(entityLabel: string): CentralityResult | null {
    try {
      const entity = this.findEntityByLabel(entityLabel);
      if (!entity) return null;

      // Degree centrality
      const outDegree = (this.adjacencyList.get(entity.id) || new Set()).size;
      const inDegree = (this.reverseAdjacencyList.get(entity.id) || new Set()).size;
      const totalDegree = outDegree + inDegree;
      const n = this.entities.size;
      const degreeCentrality = n > 1 ? totalDegree / (n - 1) : 0;

      // Betweenness centrality (simplified)
      const betweennessCentrality = this.calculateBetweennessCentrality(entity.id);

      // Closeness centrality
      const closenessCentrality = this.calculateClosenessCentrality(entity.id);

      this.logger.info(`Calculated centrality for ${entityLabel}`);

      return {
        entityId: entity.id,
        degreeCentrality,
        betweennessCentrality,
        closenessCentrality,
      };
    } catch (error) {
      this.logger.error('Centrality calculation failed:', error);
      return null;
    }
  }

  predictLinks(limit: number = 10): LinkPrediction[] {
    try {
      const predictions: LinkPrediction[] = [];
      const entities = Array.from(this.entities.keys());

      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          const sourceId = entities[i];
          const targetId = entities[j];

          // Skip if relationship exists
          if (this.findRelationship(sourceId, targetId)) continue;

          // Calculate probability using common neighbors
          const probability = this.calculateLinkProbability(sourceId, targetId);

          if (probability > 0.5) {
            predictions.push({
              sourceId,
              targetId,
              probability,
              type: 'related_to',
            });
          }
        }
      }

      predictions.sort((a, b) => b.probability - a.probability);

      const result = predictions.slice(0, limit);
      this.logger.info(`Predicted ${result.length} potential links`);

      return result;
    } catch (error) {
      this.logger.error('Link prediction failed:', error);
      return [];
    }
  }

  // ==================== Integration ====================

  async queryDBpedia(query: string): Promise<Entity[]> {
    try {
      const sparqlQuery = `
        SELECT ?subject ?label ?type WHERE {
          ?subject rdfs:label ?label .
          ?subject rdf:type ?type .
          FILTER (CONTAINS(LCASE(?label), "${query.toLowerCase()}"))
        }
        LIMIT 10
      `;

      const url = `http://dbpedia.org/sparql?query=${encodeURIComponent(sparqlQuery)}&format=json`;

      const response = await axios.get(url, { timeout: 5000 });
      const bindings = response.data.results.bindings;

      const entities: Entity[] = bindings.map((binding: any) => {
        const type = binding.type?.value.split('/').pop() || 'Thing';
        return this.createEntity(binding.label.value, type, {
          dbpediaUri: binding.subject.value,
        });
      });

      this.logger.info(`Retrieved ${entities.length} entities from DBpedia`);
      return entities;
    } catch (error) {
      this.logger.warn('DBpedia query failed:', error.message);
      return [];
    }
  }

  async queryWikidata(query: string): Promise<Entity[]> {
    try {
      const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&format=json&limit=10`;

      const response = await axios.get(url, { timeout: 5000 });
      const results = response.data.search || [];

      const entities: Entity[] = results.map((result: any) => {
        return this.createEntity(result.label, result.description || 'Thing', {
          wikidataId: result.id,
          wikidataUri: result.concepturi,
        });
      });

      this.logger.info(`Retrieved ${entities.length} entities from Wikidata`);
      return entities;
    } catch (error) {
      this.logger.warn('Wikidata query failed:', error.message);
      return [];
    }
  }

  setOntology(schema: OntologySchema): void {
    try {
      // Validate entities against ontology
      for (const entity of this.entities.values()) {
        if (!schema.entityTypes.includes(entity.type)) {
          this.logger.warn(`Entity type ${entity.type} not in ontology`);
        }
      }

      // Validate relationships against ontology
      for (const rel of this.relationships.values()) {
        if (!schema.relationshipTypes.includes(rel.type)) {
          this.logger.warn(`Relationship type ${rel.type} not in ontology`);
        }

        // Check constraints
        const source = this.entities.get(rel.sourceId);
        const target = this.entities.get(rel.targetId);

        if (source && target) {
          const constraint = schema.constraints.find(
            (c) => c.type === rel.type && c.domain === source.type && c.range === target.type
          );

          if (!constraint) {
            this.logger.warn(
              `Relationship ${rel.type} violates ontology constraints: ${source.type} -> ${target.type}`
            );
          }
        }
      }

      this.logger.info('Ontology validation completed');
    } catch (error) {
      this.logger.error('Ontology setting failed:', error);
      throw new Error(`Ontology setting failed: ${error.message}`);
    }
  }

  export(format: 'json' | 'graphml' | 'csv' | 'rdf'): ExportFormat {
    try {
      let data: any;

      switch (format) {
        case 'json':
          data = this.exportJSON();
          break;
        case 'graphml':
          data = this.exportGraphML();
          break;
        case 'csv':
          data = this.exportCSV();
          break;
        case 'rdf':
          data = this.exportRDF();
          break;
        default:
          throw new Error(`Unknown export format: ${format}`);
      }

      this.logger.info(`Exported graph as ${format}`);
      return { format, data };
    } catch (error) {
      this.logger.error('Graph export failed:', error);
      throw new Error(`Graph export failed: ${error.message}`);
    }
  }

  import(data: any, format: 'json' | 'csv'): void {
    try {
      switch (format) {
        case 'json':
          this.importJSON(data);
          break;
        case 'csv':
          this.importCSV(data);
          break;
        default:
          throw new Error(`Unknown import format: ${format}`);
      }

      this.logger.info(`Imported graph from ${format}`);
    } catch (error) {
      this.logger.error('Graph import failed:', error);
      throw new Error(`Graph import failed: ${error.message}`);
    }
  }

  // ==================== Helper Methods ====================

  private createEntity(
    label: string,
    type: string,
    properties: Record<string, any> = {}
  ): Entity {
    return {
      id: this.generateId(label),
      label,
      type,
      properties,
      aliases: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private findEntityByLabel(label: string, type?: string): Entity | undefined {
    for (const entity of this.entities.values()) {
      if (entity.label === label && (!type || entity.type === type)) {
        return entity;
      }
    }
    return undefined;
  }

  private findOrCreateEntity(label: string, type: string = 'Thing'): Entity {
    const existing = this.findEntityByLabel(label);
    if (existing) return existing;

    return this.addEntity(label, type);
  }

  private findRelationship(sourceId: string, targetId: string): Relationship | undefined {
    for (const rel of this.relationships.values()) {
      if (rel.sourceId === sourceId && rel.targetId === targetId) {
        return rel;
      }
    }
    return undefined;
  }

  private calculateEntitySimilarity(entity1: Entity, entity2: Entity): number {
    // Label similarity
    const labelSim = this.calculateStringSimilarity(entity1.label, entity2.label);

    // Type similarity
    const typeSim = entity1.type === entity2.type ? 1 : 0;

    // Property similarity
    const propSim = this.calculatePropertySimilarity(entity1.properties, entity2.properties);

    return labelSim * 0.5 + typeSim * 0.3 + propSim * 0.2;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const distance = natural.LevenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
    const maxLen = Math.max(str1.length, str2.length);
    return maxLen > 0 ? 1 - distance / maxLen : 1;
  }

  private calculatePropertySimilarity(props1: Record<string, any>, props2: Record<string, any>): number {
    const keys1 = Object.keys(props1);
    const keys2 = Object.keys(props2);

    if (keys1.length === 0 && keys2.length === 0) return 1;
    if (keys1.length === 0 || keys2.length === 0) return 0;

    const commonKeys = keys1.filter((k) => keys2.includes(k));
    return commonKeys.length / Math.max(keys1.length, keys2.length);
  }

  private mergeEntities(entity1: Entity, entity2: Entity): void {
    // Merge properties
    entity1.properties = { ...entity1.properties, ...entity2.properties };

    // Merge aliases
    entity1.aliases.push(entity2.label, ...entity2.aliases);

    // Redirect relationships
    for (const rel of this.relationships.values()) {
      if (rel.sourceId === entity2.id) {
        rel.sourceId = entity1.id;
      }
      if (rel.targetId === entity2.id) {
        rel.targetId = entity1.id;
      }
    }

    // Update adjacency lists
    const entity2Neighbors = this.adjacencyList.get(entity2.id) || new Set();
    const entity1Neighbors = this.adjacencyList.get(entity1.id)!;

    entity2Neighbors.forEach((n) => entity1Neighbors.add(n));

    // Remove entity2
    this.entities.delete(entity2.id);
    this.adjacencyList.delete(entity2.id);
    this.reverseAdjacencyList.delete(entity2.id);
  }

  private applyTransitiveRule(rule: InferenceRule): number {
    let count = 0;

    const relationships = Array.from(this.relationships.values());

    for (let i = 0; i < relationships.length; i++) {
      for (let j = 0; j < relationships.length; j++) {
        if (relationships[i].targetId === relationships[j].sourceId) {
          // Check if relationship already exists
          const existing = this.findRelationship(
            relationships[i].sourceId,
            relationships[j].targetId
          );

          if (!existing) {
            const source = this.entities.get(relationships[i].sourceId)!;
            const target = this.entities.get(relationships[j].targetId)!;

            this.addRelationship(source.label, target.label, 'inferred_relation', {
              inferredFrom: rule.id,
            });

            count++;
          }
        }
      }
    }

    return count;
  }

  private applySymmetricRule(rule: InferenceRule): number {
    let count = 0;

    for (const rel of this.relationships.values()) {
      // Check if reverse relationship exists
      const reverse = this.findRelationship(rel.targetId, rel.sourceId);

      if (!reverse) {
        const source = this.entities.get(rel.targetId)!;
        const target = this.entities.get(rel.sourceId)!;

        this.addRelationship(source.label, target.label, rel.type, {
          inferredFrom: rule.id,
        });

        count++;
      }
    }

    return count;
  }

  private applyInverseRule(rule: InferenceRule): number {
    let count = 0;

    for (const rel of this.relationships.values()) {
      const source = this.entities.get(rel.sourceId)!;
      const target = this.entities.get(rel.targetId)!;

      // Create inverse relationship
      const inverseType = this.getInverseRelationType(rel.type);

      const existing = this.findRelationship(rel.targetId, rel.sourceId);

      if (!existing) {
        this.addRelationship(target.label, source.label, inverseType, {
          inferredFrom: rule.id,
        });

        count++;
      }
    }

    return count;
  }

  private getInverseRelationType(type: string): string {
    const inverses: Record<string, string> = {
      parentOf: 'childOf',
      childOf: 'parentOf',
      manages: 'managedBy',
      managedBy: 'manages',
      owns: 'ownedBy',
      ownedBy: 'owns',
    };

    return inverses[type] || `inverseOf_${type}`;
  }

  private constructPath(entityIds: string[], relationshipIds: string[]): Path {
    const entities = entityIds.map((id) => this.entities.get(id)!).filter(Boolean);
    const relationships = relationshipIds.map((id) => this.relationships.get(id)!).filter(Boolean);

    const weight = relationships.reduce((sum, rel) => sum + rel.weight, 0);

    return {
      entities,
      relationships,
      length: relationships.length,
      weight,
    };
  }

  private generateRandomWalkEmbedding(entityId: string): number[] {
    const vector: number[] = [];
    const walkLength = 10;
    const numWalks = 5;

    const walks: string[][] = [];

    // Generate random walks
    for (let i = 0; i < numWalks; i++) {
      const walk = [entityId];
      let currentId = entityId;

      for (let j = 0; j < walkLength; j++) {
        const neighbors = Array.from(this.adjacencyList.get(currentId) || []);

        if (neighbors.length === 0) break;

        currentId = neighbors[Math.floor(Math.random() * neighbors.length)];
        walk.push(currentId);
      }

      walks.push(walk);
    }

    // Convert walks to embedding (simplified)
    const allEntities = Array.from(this.entities.keys());

    for (let i = 0; i < this.config.embeddingDimension; i++) {
      let value = 0;

      for (const walk of walks) {
        if (walk.includes(allEntities[i % allEntities.length])) {
          value += 1;
        }
      }

      vector.push(value / numWalks);
    }

    return vector;
  }

  private generateAdjacencyEmbedding(entityId: string): number[] {
    const vector: number[] = [];
    const neighbors = this.adjacencyList.get(entityId) || new Set();
    const allEntities = Array.from(this.entities.keys());

    for (let i = 0; i < this.config.embeddingDimension; i++) {
      const neighborId = allEntities[i % allEntities.length];
      vector.push(neighbors.has(neighborId) ? 1 : 0);
    }

    return vector;
  }

  private calculateCohesion(entityIds: string[]): number {
    let internalEdges = 0;
    let possibleEdges = 0;

    for (let i = 0; i < entityIds.length; i++) {
      for (let j = i + 1; j < entityIds.length; j++) {
        possibleEdges++;

        if (this.findRelationship(entityIds[i], entityIds[j])) {
          internalEdges++;
        }
      }
    }

    return possibleEdges > 0 ? internalEdges / possibleEdges : 0;
  }

  private queryEntities(params: Record<string, any>): QueryResult {
    let entities = Array.from(this.entities.values());

    if (params.type) {
      entities = entities.filter((e) => e.type === params.type);
    }

    if (params.label) {
      entities = entities.filter((e) => e.label.includes(params.label));
    }

    return { entities, relationships: [] };
  }

  private queryRelationships(params: Record<string, any>): QueryResult {
    let relationships = Array.from(this.relationships.values());

    if (params.type) {
      relationships = relationships.filter((r) => r.type === params.type);
    }

    const entities = new Set<Entity>();

    relationships.forEach((rel) => {
      const source = this.entities.get(rel.sourceId);
      const target = this.entities.get(rel.targetId);

      if (source) entities.add(source);
      if (target) entities.add(target);
    });

    return { entities: Array.from(entities), relationships };
  }

  private queryPaths(params: Record<string, any>): QueryResult {
    const path = this.findShortestPath(params.source, params.target);

    if (!path) {
      return { entities: [], relationships: [], paths: [] };
    }

    return {
      entities: path.entities,
      relationships: path.relationships,
      paths: [path],
    };
  }

  private queryPattern(params: Record<string, any>): QueryResult {
    return this.findPattern(params.pattern);
  }

  private calculateBetweennessCentrality(entityId: string): number {
    // Simplified betweenness centrality
    let betweenness = 0;
    const entities = Array.from(this.entities.keys()).filter((id) => id !== entityId);

    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const path = this.findShortestPath(
          this.entities.get(entities[i])!.label,
          this.entities.get(entities[j])!.label
        );

        if (path && path.entities.some((e) => e.id === entityId)) {
          betweenness += 1;
        }
      }
    }

    return betweenness;
  }

  private calculateClosenessCentrality(entityId: string): number {
    const entities = Array.from(this.entities.keys()).filter((id) => id !== entityId);
    let totalDistance = 0;

    for (const targetId of entities) {
      const path = this.findShortestPath(
        this.entities.get(entityId)!.label,
        this.entities.get(targetId)!.label
      );

      totalDistance += path ? path.length : entities.length;
    }

    return entities.length > 0 ? entities.length / totalDistance : 0;
  }

  private calculateLinkProbability(sourceId: string, targetId: string): number {
    // Common neighbors approach
    const sourceNeighbors = this.adjacencyList.get(sourceId) || new Set();
    const targetNeighbors = this.adjacencyList.get(targetId) || new Set();

    const commonNeighbors = Array.from(sourceNeighbors).filter((n) => targetNeighbors.has(n));

    const totalNeighbors = sourceNeighbors.size + targetNeighbors.size;

    return totalNeighbors > 0 ? commonNeighbors.length / totalNeighbors : 0;
  }

  private calculateTokenOverlap(tokens1: string[], tokens2: string[]): number {
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);

    const intersection = Array.from(set1).filter((t) => set2.has(t));

    return intersection.length / Math.max(set1.size, set2.size);
  }

  private deduplicateTriples(triples: Triple[]): Triple[] {
    const seen = new Set<string>();
    return triples.filter((triple) => {
      const key = `${triple.subject}|${triple.predicate}|${triple.object}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  private generateId(label: string): string {
    return label.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
  }

  private exportJSON(): any {
    return {
      entities: Array.from(this.entities.values()),
      relationships: Array.from(this.relationships.values()),
    };
  }

  private exportGraphML(): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<graphml xmlns="http://graphml.graphdrawing.org/xmlns">\n';
    xml += '  <graph edgedefault="directed">\n';

    for (const entity of this.entities.values()) {
      xml += `    <node id="${entity.id}">\n`;
      xml += `      <data key="label">${entity.label}</data>\n`;
      xml += `      <data key="type">${entity.type}</data>\n`;
      xml += '    </node>\n';
    }

    for (const rel of this.relationships.values()) {
      xml += `    <edge source="${rel.sourceId}" target="${rel.targetId}">\n`;
      xml += `      <data key="type">${rel.type}</data>\n`;
      xml += '    </edge>\n';
    }

    xml += '  </graph>\n';
    xml += '</graphml>';

    return xml;
  }

  private exportCSV(): { entities: string; relationships: string } {
    let entitiesCsv = 'id,label,type\n';
    for (const entity of this.entities.values()) {
      entitiesCsv += `${entity.id},"${entity.label}",${entity.type}\n`;
    }

    let relationshipsCsv = 'id,source,target,type\n';
    for (const rel of this.relationships.values()) {
      relationshipsCsv += `${rel.id},${rel.sourceId},${rel.targetId},${rel.type}\n`;
    }

    return { entities: entitiesCsv, relationships: relationshipsCsv };
  }

  private exportRDF(): string {
    let rdf = '<?xml version="1.0"?>\n';
    rdf += '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n';

    for (const rel of this.relationships.values()) {
      const source = this.entities.get(rel.sourceId)!;
      const target = this.entities.get(rel.targetId)!;

      rdf += `  <rdf:Description rdf:about="${source.label}">\n`;
      rdf += `    <${rel.type} rdf:resource="${target.label}"/>\n`;
      rdf += '  </rdf:Description>\n';
    }

    rdf += '</rdf:RDF>';

    return rdf;
  }

  private importJSON(data: any): void {
    // Import entities
    if (data.entities) {
      data.entities.forEach((entity: Entity) => {
        this.entities.set(entity.id, entity);
        this.adjacencyList.set(entity.id, new Set());
        this.reverseAdjacencyList.set(entity.id, new Set());
      });
    }

    // Import relationships
    if (data.relationships) {
      data.relationships.forEach((rel: Relationship) => {
        this.relationships.set(rel.id, rel);
        this.adjacencyList.get(rel.sourceId)?.add(rel.targetId);
        this.reverseAdjacencyList.get(rel.targetId)?.add(rel.sourceId);
      });
    }
  }

  private importCSV(data: { entities: string; relationships: string }): void {
    // Parse entities CSV
    const entityLines = data.entities.split('\n').slice(1);
    entityLines.forEach((line) => {
      const [id, label, type] = line.split(',');
      if (id && label && type) {
        const entity = this.createEntity(label.replace(/"/g, ''), type);
        this.entities.set(id, entity);
        this.adjacencyList.set(id, new Set());
        this.reverseAdjacencyList.set(id, new Set());
      }
    });

    // Parse relationships CSV
    const relLines = data.relationships.split('\n').slice(1);
    relLines.forEach((line) => {
      const [id, source, target, type] = line.split(',');
      if (id && source && target && type) {
        const rel: Relationship = {
          id,
          sourceId: source,
          targetId: target,
          type,
          properties: {},
          weight: 1.0,
          createdAt: new Date(),
        };
        this.relationships.set(id, rel);
        this.adjacencyList.get(source)?.add(target);
        this.reverseAdjacencyList.get(target)?.add(source);
      }
    });
  }

  getStats(): any {
    return {
      entities: this.entities.size,
      relationships: this.relationships.size,
      averageDegree:
        Array.from(this.adjacencyList.values()).reduce((sum, set) => sum + set.size, 0) /
        this.entities.size,
      types: new Set(Array.from(this.entities.values()).map((e) => e.type)).size,
      relationshipTypes: new Set(Array.from(this.relationships.values()).map((r) => r.type)).size,
    };
  }
}

export default KnowledgeGraph;
