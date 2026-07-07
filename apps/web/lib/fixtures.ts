import { parseBlocks } from "@notes/blocks";
import { readingTime } from "@notes/core";
import type { NoteView, TopicView } from "./types";

// Mirrors supabase/seed.sql so the reader runs before Supabase is configured.

export const FIXTURE_TOPICS: TopicView[] = [
  {
    slug: "system-design",
    name: "System Design",
    icon: "🏗",
    parentSlug: null,
    sortOrder: 1,
    description: "Fundamentals, building blocks, case studies",
  },
  {
    slug: "databases",
    name: "Databases",
    icon: "🗄",
    parentSlug: null,
    sortOrder: 2,
    description: "Indexing, transactions, SQL vs NoSQL",
  },
  {
    slug: "distributed-systems",
    name: "Distributed Systems",
    icon: "🌐",
    parentSlug: null,
    sortOrder: 3,
    description: "Consensus, replication, partitioning",
  },
  {
    slug: "databases-indexing",
    name: "Indexing & Query Planning",
    icon: null,
    parentSlug: "databases",
    sortOrder: 1,
    description: "How indexes work and when to use them",
  },
];

const indexingBlocks = parseBlocks([
  { type: "heading", level: 1, content: "Database Indexing" },
  {
    type: "text",
    content:
      "An **index** is a data structure that speeds up lookups at the cost of extra writes and storage. Distributed stores add wrinkles — see [[consensus|how replicas agree]].",
  },
  {
    type: "callout",
    variant: "tip",
    title: "Rule of thumb",
    content: "Index the columns you filter and join on — not every column.",
  },
  { type: "heading", level: 2, content: "How a B-tree lookup works" },
  {
    type: "mermaid",
    title: "B-tree search path",
    layout: "tabs",
    content:
      "graph TD\n  Root --> A[10..40]\n  Root --> B[50..90]\n  A --> L1[(10,20,30)]\n  B --> L2[(50,60,70)]",
  },
  {
    type: "code",
    language: "sql",
    filename: "index.sql",
    content:
      "CREATE INDEX idx_users_email ON users (email);\nSELECT * FROM users WHERE email = 'a@b.com';",
  },
  { type: "text", content: "Lookup cost is logarithmic in the number of rows:" },
  { type: "math", display: true, content: "O(\\log_b n)" },
  {
    type: "list",
    ordered: false,
    items: [
      "Speeds up point and range queries",
      "Slows down INSERT / UPDATE / DELETE",
      "Consumes extra disk",
    ],
  },
]);

const consensusBlocks = parseBlocks([
  { type: "heading", level: 1, content: "Consensus" },
  {
    type: "text",
    content:
      "Consensus lets a set of replicas agree on a single value even when some fail. Quorums (majority overlap) are the core trick.",
  },
  {
    type: "callout",
    variant: "note",
    content:
      "A write + read quorum that overlap guarantees you read the latest committed value.",
  },
]);

export const FIXTURE_NOTES: NoteView[] = [
  {
    slug: "database-indexing",
    title: "Database Indexing",
    summary: "How B-tree indexes speed up reads and what they cost on writes.",
    topicSlug: "databases-indexing",
    tags: ["databases", "performance", "sql"],
    blocks: indexingBlocks,
    updatedAt: "2026-01-01T00:00:00Z",
    readingTime: readingTime(indexingBlocks),
  },
  {
    slug: "consensus",
    title: "Consensus",
    summary: "Why distributed replicas need to agree, and how quorums make that safe.",
    topicSlug: "distributed-systems",
    tags: ["distributed-systems", "replication"],
    blocks: consensusBlocks,
    updatedAt: "2026-01-01T00:00:00Z",
    readingTime: readingTime(consensusBlocks),
  },
];
