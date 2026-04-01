'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ZoomIn, ZoomOut, Maximize2, Upload, StickyNote, Magnet,
  FileText, Link as LinkIcon, MoreHorizontal,
  Loader2, Settings, Users, Sparkles, Map, History,
  Filter, Grid3X3, Layers, Copy, GitBranch,
  Undo2, Redo2, Keyboard, Search, X,
  Eye, Trash2, Pin, Star, MessageSquare,
  Plus, ChevronDown, ArrowRight,
  // Strategy & Planning
  Presentation, ClipboardList, LayoutGrid, Target, Compass,
  // Financial
  DollarSign, PieChart, Receipt, Landmark, TrendingUp, Calculator,
  // Legal
  Scale, ShieldCheck, FileCheck, Stamp, Copyright, ShieldAlert,
  // Product & Tech
  PenTool, Code, Blocks, Server, Bug, Rocket,
  // Marketing & Sales
  BarChart3, UserCircle, Megaphone, Funnel,
  // Team & Operations
  Network, Calendar, CheckSquare, GanttChart, Gauge, UserPlus, GraduationCap,
  // Communication
  Mail, Newspaper, Send, Inbox,
  // Data & Metrics
  Database, Award, ClipboardCheck, FileBarChart,
  // Investor Relations
  Briefcase, FolderOpen, CircleDollarSign,
  // Task Management
  ListTodo, Flag, Repeat,
  // Research
  Lightbulb, FlaskConical, HelpCircle, BookOpen,
  // Shapes & Export
  Square, Circle, Diamond, Triangle, Minus, MoveRight, Type, Spline, Download,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/layout/SidebarContext';
import { SideNav } from '@/components/layout/SideNav';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import {
  getResearchBoard,
  updateResearchBoard,
  createResearchNode,
  updateResearchNode,
  deleteResearchNode,
  batchUpdateResearchNodes,
  uploadResearchAsset,
  createResearchConnector,
  deleteResearchConnector,
  type ResearchNode,
  type ResearchBoardFull,
} from '@/lib/api';
import { ResearchNodeCard } from '@/components/research/ResearchNodeCard';
import { ResearchNodeViewer } from '@/components/research/ResearchNodeViewer';
import { ResearchConnectorLines } from '@/components/research/ResearchConnectorLines';
import { ResearchGroupFrame, type ResearchGroup } from '@/components/research/ResearchGroupFrame';
import { BoardExport } from '@/components/research/BoardExport';
import { EntityReferenceSelector } from '@/components/research/EntityReferenceSelector';
import { NodeFilterBar } from '@/components/research/NodeTagsEditor';
import { CanvasCopilotPanel } from '@/components/research/CanvasCopilotPanel';
import { CanvasDrawToolbar, type DrawTool } from '@/components/research/CanvasDrawToolbar';
import { MERMAID_STARTERS } from '@/components/research/MermaidDiagramNode';
import { getTemplateDefaultContent } from '@/components/research/VisualTemplateNode';
import { computeLayout, type LayoutAlgorithm } from '@/lib/autoLayout';
import { ShapeLibraryPanel, type ShapeTemplate } from '@/components/research/ShapeLibraryPanel';
import { toPng } from 'html-to-image';
import { BoardSettingsPanel } from '@/components/research/BoardSettingsPanel';
import { BoardSummaryPanel } from '@/components/research/BoardSummaryPanel';
import { CommentsPanel } from '@/components/research/CommentsPanel';
import { BoardMiniMap } from '@/components/research/BoardMiniMap';
import { CanvasVersionPanel } from '@/components/research/CanvasVersionPanel';
import { CanvasBranchSelector } from '@/components/research/CanvasBranchSelector';
import { CollaboratorsBar, LiveCursors } from '@/components/research/CollaboratorsBar';
import { useResearchCollaboration } from '@/hooks/useResearchCollaboration';
import { useCurrentUser } from '@/hooks/useCurrentUser';

type Tool = DrawTool;

const MAX_HISTORY = 50;

/* ─── Default content templates for new nodes ───────────────────────── */
function getDefaultContent(type: string): string {
  switch (type) {
    case 'pitch_deck':      return '<h2>Pitch Deck</h2><h3>1. Problem</h3><p>What problem are you solving?</p><h3>2. Solution</h3><p>How does your product solve it?</p><h3>3. Market Size</h3><p>Total addressable market...</p><h3>4. Business Model</h3><p>How do you make money?</p><h3>5. Traction</h3><p>Key metrics and milestones...</p><h3>6. Team</h3><p>Founders and key team members...</p><h3>7. The Ask</h3><p>How much are you raising and why?</p>';
    case 'business_plan':   return '<h2>Business Plan</h2><h3>Executive Summary</h3><p></p><h3>Market Analysis</h3><p></p><h3>Products &amp; Services</h3><p></p><h3>Marketing &amp; Sales Strategy</h3><p></p><h3>Operational Plan</h3><p></p><h3>Financial Projections</h3><p></p>';
    case 'business_model':  return '<h2>Business Model Canvas</h2><h3>Value Propositions</h3><p></p><h3>Customer Segments</h3><p></p><h3>Channels</h3><p></p><h3>Revenue Streams</h3><p></p><h3>Key Resources</h3><p></p><h3>Key Partners</h3><p></p><h3>Cost Structure</h3><p></p>';
    case 'lean_canvas':     return '<h2>Lean Canvas</h2><h3>Problem</h3><p>Top 3 problems</p><h3>Solution</h3><p>Top 3 features</p><h3>Unique Value Proposition</h3><p>Clear compelling message</p><h3>Channels</h3><p>Path to customers</p><h3>Customer Segments</h3><p>Target customers</p><h3>Key Metrics</h3><p>Key activities you measure</p><h3>Revenue Streams</h3><p></p><h3>Cost Structure</h3><p></p>';
    case 'swot':            return '<h2>SWOT Analysis</h2><p>Use the interactive grid above to fill in each quadrant.</p>';
    case 'roadmap':         return '<h2>Product Roadmap</h2><h3>Q1</h3><ul><li></li></ul><h3>Q2</h3><ul><li></li></ul><h3>Q3</h3><ul><li></li></ul><h3>Q4</h3><ul><li></li></ul>';
    case 'okr':             return '<h2>OKRs</h2><h3>Objective 1</h3><p></p><ul><li>KR1: </li><li>KR2: </li><li>KR3: </li></ul><h3>Objective 2</h3><p></p><ul><li>KR1: </li><li>KR2: </li><li>KR3: </li></ul>';
    case 'vision':          return '<h2>Vision Statement</h2><p></p><h3>Mission</h3><p></p><h3>Core Values</h3><ul><li></li></ul><h3>3-Year Goals</h3><p></p>';
    case 'financial_model': return '<h2>Financial Model</h2><h3>Revenue Projections</h3><p></p><h3>Cost Structure</h3><p></p><h3>Unit Economics</h3><p>LTV: <br/>CAC: <br/>Payback: </p><h3>Burn Rate</h3><p></p><h3>Runway</h3><p></p>';
    case 'budget':          return '<h2>Budget</h2><h3>Revenue</h3><p></p><h3>Operating Expenses</h3><ul><li>Salaries: </li><li>Marketing: </li><li>Infrastructure: </li><li>Office: </li></ul><h3>Total</h3><p></p>';
    case 'cap_table':       return '<h2>Cap Table</h2><h3>Founders</h3><p></p><h3>Employees (ESOP)</h3><p></p><h3>Investors</h3><p></p><h3>Total Shares</h3><p></p>';
    case 'term_sheet':      return '<h2>Term Sheet</h2><h3>Investment Amount</h3><p></p><h3>Valuation</h3><p>Pre-money: <br/>Post-money: </p><h3>Security Type</h3><p></p><h3>Investor Rights</h3><p></p>';
    case 'invoice':         return '<h2>Invoice</h2><p>Invoice #: <br/>Date: <br/>Due: </p><h3>Bill To</h3><p></p><h3>Services</h3><ul><li></li></ul><h3>Total</h3><p></p>';
    case 'revenue_model':   return '<h2>Revenue Model</h2><h3>Revenue Streams</h3><ul><li></li></ul><h3>Pricing Strategy</h3><p></p><h3>Unit Economics</h3><p></p>';
    case 'contract':        return '<h2>Contract</h2><h3>Parties</h3><p></p><h3>Scope of Work</h3><p></p><h3>Compensation</h3><p></p><h3>Term</h3><p></p><h3>Termination</h3><p></p>';
    case 'nda':             return '<h2>Non-Disclosure Agreement</h2><h3>Parties</h3><p></p><h3>Confidential Information</h3><p></p><h3>Obligations</h3><p></p><h3>Term</h3><p></p>';
    case 'legal':           return '<h2>Legal Document</h2><h3>Overview</h3><p></p><h3>Terms</h3><p></p><h3>Obligations</h3><p></p>';
    case 'incorporation':   return '<h2>Incorporation</h2><h3>Company Name</h3><p></p><h3>Entity Type</h3><p></p><h3>Registered Agent</h3><p></p><h3>Directors</h3><p></p>';
    case 'ip_filing':       return '<h2>IP / Patent Filing</h2><h3>Title</h3><p></p><h3>Inventors</h3><p></p><h3>Abstract</h3><p></p><h3>Claims</h3><ol><li></li></ol>';
    case 'compliance':      return '<h2>Compliance Document</h2><h3>Regulation</h3><p></p><h3>Requirements</h3><ul><li></li></ul><h3>Status</h3><p></p>';
    case 'spec':            return '<h2>Technical Specification</h2><h3>Overview</h3><p></p><h3>Requirements</h3><p></p><h3>Architecture</h3><p></p><h3>API Endpoints</h3><p></p><h3>Security</h3><p></p>';
    case 'user_story':      return '<h2>User Story</h2><p><strong>As a</strong> [type of user],<br/><strong>I want</strong> [an action],<br/><strong>So that</strong> [a benefit].</p><h3>Acceptance Criteria</h3><ul><li>Given... When... Then...</li></ul>';
    case 'api_doc':         return '<h2>API Documentation</h2><h3>Base URL</h3><p></p><h3>Authentication</h3><p></p><h3>Endpoints</h3><h4>GET /endpoint</h4><p>Description: <br/>Response: </p>';
    case 'architecture':    return '<h2>Architecture</h2><h3>Overview</h3><p></p><h3>Components</h3><ul><li></li></ul><h3>Data Flow</h3><p></p><h3>Tech Stack</h3><p></p>';
    case 'bug_report':      return '<h2>Bug Report</h2><h3>Summary</h3><p></p><h3>Severity</h3><p>Critical / High / Medium / Low</p><h3>Steps to Reproduce</h3><ol><li></li></ol><h3>Expected</h3><p></p><h3>Actual</h3><p></p>';
    case 'feature_request': return '<h2>Feature Request</h2><h3>Description</h3><p></p><h3>Business Value</h3><p></p><h3>User Impact</h3><p></p><h3>Proposed Solution</h3><p></p>';
    case 'wireframe':       return '<h2>Wireframe Notes</h2><h3>Screen / Page</h3><p></p><h3>Key Elements</h3><ul><li></li></ul><h3>User Flow</h3><p></p><h3>Notes</h3><p></p>';
    case 'competitor':      return '<h2>Competitor Analysis</h2><h3>Company</h3><p></p><h3>Products &amp; Pricing</h3><p></p><h3>Strengths</h3><ul><li></li></ul><h3>Weaknesses</h3><ul><li></li></ul>';
    case 'market_research': return '<h2>Market Research</h2><h3>Market Size</h3><p>TAM: <br/>SAM: <br/>SOM: </p><h3>Key Trends</h3><ul><li></li></ul><h3>Target Segments</h3><p></p>';
    case 'persona':         return '<h2>Customer Persona</h2><h3>Demographics</h3><p>Age: <br/>Location: <br/>Occupation: </p><h3>Goals</h3><ul><li></li></ul><h3>Pain Points</h3><ul><li></li></ul>';
    case 'go_to_market':    return '<h2>Go-to-Market Strategy</h2><h3>Target Market</h3><p></p><h3>Value Proposition</h3><p></p><h3>Channels</h3><ul><li></li></ul><h3>Launch Timeline</h3><p></p>';
    case 'branding':        return '<h2>Brand Guidelines</h2><h3>Mission</h3><p></p><h3>Voice &amp; Tone</h3><p></p><h3>Visual Identity</h3><p>Colors: <br/>Fonts: </p>';
    case 'funnel':          return '<h2>Marketing Funnel</h2><h3>Awareness</h3><p></p><h3>Interest</h3><p></p><h3>Consideration</h3><p></p><h3>Purchase</h3><p></p><h3>Retention</h3><p></p>';
    case 'meeting_notes':   return '<h2>Meeting Notes</h2><p><strong>Date:</strong> <br/><strong>Attendees:</strong> </p><h3>Agenda</h3><ol><li></li></ol><h3>Discussion</h3><p></p><h3>Action Items</h3><ul><li>[ ] </li></ul>';
    case 'org_chart':       return '<h2>Org Chart</h2><h3>Leadership</h3><ul><li>CEO: </li><li>CTO: </li><li>COO: </li></ul><h3>Departments</h3><ul><li></li></ul>';
    case 'timeline':        return '<h2>Timeline</h2><h3>Phase 1</h3><p>Dates: </p><h3>Phase 2</h3><p>Dates: </p><h3>Phase 3</h3><p>Dates: </p><h3>Milestones</h3><ul><li></li></ul>';
    case 'kpi':             return '<h2>KPI Dashboard</h2><h3>Key Metrics</h3><ul><li>MRR: </li><li>Churn: </li><li>CAC: </li><li>LTV: </li><li>NPS: </li></ul><h3>Goals</h3><p></p>';
    case 'hiring_plan':     return '<h2>Hiring Plan</h2><h3>Open Positions</h3><ul><li></li></ul><h3>Timeline</h3><p></p><h3>Budget</h3><p></p><h3>Sourcing Strategy</h3><p></p>';
    case 'onboarding':      return '<h2>Onboarding Plan</h2><h3>Week 1</h3><ul><li></li></ul><h3>Week 2</h3><ul><li></li></ul><h3>Month 1</h3><ul><li></li></ul>';
    case 'email_draft':     return '<h2>Email Draft</h2><p><strong>To:</strong> <br/><strong>Subject:</strong> </p><h3>Body</h3><p>Hi [Name],</p><p></p><p>Best regards,<br/>[Your Name]</p>';
    case 'press_release':   return '<h2>Press Release</h2><p><strong>FOR IMMEDIATE RELEASE</strong></p><h3>Headline</h3><p></p><h3>Subheading</h3><p></p><h3>Body</h3><p></p><h3>About</h3><p></p>';
    case 'proposal':        return '<h2>Proposal</h2><h3>Executive Summary</h3><p></p><h3>Scope</h3><p></p><h3>Timeline</h3><p></p><h3>Investment</h3><p></p><h3>Next Steps</h3><p></p>';
    case 'newsletter':      return '<h2>Newsletter</h2><p><strong>Issue #: </strong></p><h3>Highlights</h3><ul><li></li></ul><h3>Feature Story</h3><p></p><h3>Updates</h3><p></p>';
    case 'whitepaper':      return '<h2>White Paper</h2><h3>Abstract</h3><p></p><h3>Introduction</h3><p></p><h3>Problem Statement</h3><p></p><h3>Solution</h3><p></p><h3>Conclusion</h3><p></p>';
    case 'case_study':      return '<h2>Case Study</h2><h3>Overview</h3><p></p><h3>Challenge</h3><p></p><h3>Solution</h3><p></p><h3>Results</h3><p></p><h3>Key Takeaways</h3><p></p>';
    case 'survey':          return '<h2>Survey</h2><h3>Q1</h3><p></p><h3>Q2</h3><p></p><h3>Q3</h3><p></p><h3>Q4</h3><p></p><h3>Q5</h3><p></p>';
    case 'report':          return '<h2>Report</h2><h3>Executive Summary</h3><p></p><h3>Findings</h3><p></p><h3>Analysis</h3><p></p><h3>Recommendations</h3><p></p>';
    case 'due_diligence':   return '<h2>Due Diligence Checklist</h2><h3>Corporate</h3><ul><li>[ ] Certificate of Incorporation</li><li>[ ] Cap Table</li></ul><h3>Financial</h3><ul><li>[ ] Financial statements</li><li>[ ] Tax returns</li></ul><h3>Legal</h3><ul><li>[ ] IP assignments</li><li>[ ] Key contracts</li></ul>';
    case 'investor_update': return '<h2>Investor Update</h2><p><strong>Period:</strong> </p><h3>Highlights</h3><ul><li></li></ul><h3>Key Metrics</h3><p>MRR: <br/>Growth: <br/>Users: </p><h3>Challenges</h3><p></p><h3>Asks</h3><p></p>';
    case 'data_room':       return '<h2>Data Room Index</h2><h3>Corporate</h3><ul><li></li></ul><h3>Financial</h3><ul><li></li></ul><h3>Legal</h3><ul><li></li></ul><h3>Product</h3><ul><li></li></ul>';
    case 'valuation':       return '<h2>Valuation</h2><h3>Methodology</h3><p>DCF / Comparable / Scorecard</p><h3>Assumptions</h3><p></p><h3>Conclusion</h3><p>Pre-money: <br/>Post-money: </p>';
    case 'insight':         return '<h2>Insight</h2><h3>Finding</h3><p></p><h3>Implication</h3><p></p><h3>Evidence</h3><p></p>';
    case 'hypothesis':      return '<h2>Hypothesis</h2><p><strong>We believe</strong> [action]<br/><strong>will result in</strong> [outcome]<br/><strong>because</strong> [rationale].</p><h3>Validation Method</h3><p></p>';
    case 'question':        return '<h2>Research Question</h2><p></p><h3>Context</h3><p></p><h3>Possible Approaches</h3><ul><li></li></ul>';
    case 'evidence':        return '<h2>Evidence</h2><h3>Finding</h3><p></p><h3>Source</h3><p></p><h3>Relevance</h3><p></p>';
    case 'citation':        return '<h2>Citation</h2><p></p><h3>Authors</h3><p></p><h3>Publication</h3><p></p><h3>Key Points</h3><ul><li></li></ul>';
    case 'retrospective':   return '<h2>Retrospective</h2><h3>What Went Well</h3><ul><li></li></ul><h3>What Could Improve</h3><ul><li></li></ul><h3>Action Items</h3><ul><li>[ ] </li></ul>';
    case 'sprint':          return '<h2>Sprint Plan</h2><p><strong>Sprint #:</strong> <br/><strong>Dates:</strong> <br/><strong>Goal:</strong> </p><h3>Stories</h3><ul><li></li></ul>';
    case 'milestone':       return '<h2>Milestone</h2><p><strong>Target Date:</strong> </p><h3>Objectives</h3><ul><li></li></ul><h3>Dependencies</h3><p></p>';
    case 'task':            return '';
    case 'checklist':       return '';
    // Mermaid starter diagram
    case 'mermaid_diagram': return MERMAID_STARTERS.flowchart;
    // Visual structured templates
    case 'visual_bmc':  return getTemplateDefaultContent('visual_bmc');
    case 'visual_lean': return getTemplateDefaultContent('visual_lean');
    case 'visual_swot': return getTemplateDefaultContent('visual_swot');
    // Embedded interactive
    case 'flow_diagram': return '';
    case 'whiteboard':   return '';
    default:                return '';
  }
}

/* ─── Categorised node types for the "Add Node" mega-menu ───────────── */
import type { ResearchNodeType } from '@/lib/api';
import type { LucideIcon } from 'lucide-react';

interface NodeTypeItem { type: ResearchNodeType; label: string; icon: LucideIcon; color: string }
interface NodeCategory { category: string; items: NodeTypeItem[] }

const NODE_CATEGORIES: NodeCategory[] = [
  { category: 'Core', items: [
    { type: 'note',      label: 'Note',         icon: StickyNote,  color: '#F59E0B' },
    { type: 'document',  label: 'Document',      icon: FileText,    color: '#3B82F6' },
    { type: 'link',      label: 'Link / URL',    icon: LinkIcon,    color: '#A855F7' },
  ]},
  { category: 'Research & Analysis', items: [
    { type: 'insight',    label: 'Insight',       icon: Lightbulb,    color: '#10B981' },
    { type: 'hypothesis', label: 'Hypothesis',    icon: FlaskConical, color: '#8B5CF6' },
    { type: 'question',   label: 'Question',      icon: HelpCircle,   color: '#6366F1' },
    { type: 'evidence',   label: 'Evidence',      icon: GitBranch,    color: '#14B8A6' },
    { type: 'citation',   label: 'Citation',      icon: BookOpen,     color: '#0EA5E9' },
  ]},
  { category: 'Strategy & Planning', items: [
    { type: 'pitch_deck',     label: 'Pitch Deck',       icon: Presentation,  color: '#EC4899' },
    { type: 'business_plan',  label: 'Business Plan',    icon: ClipboardList, color: '#7C3AED' },
    { type: 'business_model', label: 'Business Model',   icon: LayoutGrid,    color: '#8B5CF6' },
    { type: 'lean_canvas',    label: 'Lean Canvas',      icon: LayoutGrid,    color: '#A78BFA' },
    { type: 'swot',           label: 'SWOT Analysis',    icon: Target,        color: '#C084FC' },
    { type: 'roadmap',        label: 'Roadmap',          icon: Map,           color: '#2563EB' },
    { type: 'okr',            label: 'OKRs / Goals',     icon: Target,        color: '#059669' },
    { type: 'vision',         label: 'Vision Statement',  icon: Compass,       color: '#7C3AED' },
  ]},
  { category: 'Financial', items: [
    { type: 'financial_model', label: 'Financial Model',  icon: Calculator,  color: '#16A34A' },
    { type: 'budget',          label: 'Budget',           icon: DollarSign,  color: '#15803D' },
    { type: 'cap_table',       label: 'Cap Table',        icon: PieChart,    color: '#047857' },
    { type: 'invoice',         label: 'Invoice',          icon: Receipt,     color: '#059669' },
    { type: 'term_sheet',      label: 'Term Sheet',       icon: Landmark,    color: '#0D9488' },
    { type: 'revenue_model',   label: 'Revenue Model',    icon: TrendingUp,  color: '#10B981' },
  ]},
  { category: 'Legal', items: [
    { type: 'contract',      label: 'Contract',          icon: Scale,        color: '#DC2626' },
    { type: 'nda',           label: 'NDA',               icon: ShieldCheck,  color: '#B91C1C' },
    { type: 'legal',         label: 'Legal Document',    icon: FileCheck,    color: '#991B1B' },
    { type: 'incorporation', label: 'Incorporation',     icon: Stamp,        color: '#9F1239' },
    { type: 'ip_filing',     label: 'IP / Patent',       icon: Copyright,    color: '#BE123C' },
    { type: 'compliance',    label: 'Compliance',        icon: ShieldAlert,  color: '#E11D48' },
  ]},
  { category: 'Product & Tech', items: [
    { type: 'wireframe',       label: 'Wireframe',        icon: PenTool,  color: '#2563EB' },
    { type: 'spec',            label: 'Tech Spec',        icon: Code,     color: '#1D4ED8' },
    { type: 'user_story',      label: 'User Story',       icon: Blocks,   color: '#3B82F6' },
    { type: 'api_doc',         label: 'API Doc',          icon: Server,   color: '#1E40AF' },
    { type: 'architecture',    label: 'Architecture',     icon: Network,  color: '#1E3A8A' },
    { type: 'bug_report',      label: 'Bug Report',       icon: Bug,      color: '#DC2626' },
    { type: 'feature_request', label: 'Feature Request',  icon: Rocket,   color: '#7C3AED' },
  ]},
  { category: 'Marketing & Sales', items: [
    { type: 'competitor',      label: 'Competitor Analysis', icon: BarChart3,  color: '#EA580C' },
    { type: 'market_research', label: 'Market Research',    icon: Search,     color: '#D97706' },
    { type: 'persona',         label: 'User Persona',       icon: UserCircle, color: '#CA8A04' },
    { type: 'branding',        label: 'Branding',           icon: Megaphone,  color: '#DB2777' },
    { type: 'go_to_market',    label: 'Go-to-Market',       icon: Megaphone,  color: '#E11D48' },
    { type: 'funnel',          label: 'Sales Funnel',       icon: Filter,     color: '#F97316' },
  ]},
  { category: 'Team & Operations', items: [
    { type: 'org_chart',     label: 'Org Chart',       icon: Network,       color: '#0891B2' },
    { type: 'meeting_notes', label: 'Meeting Notes',   icon: Calendar,      color: '#0E7490' },
    { type: 'checklist',     label: 'Checklist',       icon: CheckSquare,   color: '#0D9488' },
    { type: 'timeline',      label: 'Timeline',        icon: GanttChart,    color: '#0284C7' },
    { type: 'kpi',           label: 'KPI Dashboard',   icon: Gauge,         color: '#0369A1' },
    { type: 'hiring_plan',   label: 'Hiring Plan',     icon: UserPlus,      color: '#075985' },
    { type: 'onboarding',    label: 'Onboarding',      icon: GraduationCap, color: '#0C4A6E' },
  ]},
  { category: 'Communication', items: [
    { type: 'email_draft',   label: 'Email Draft',     icon: Mail,       color: '#6D28D9' },
    { type: 'press_release', label: 'Press Release',   icon: Newspaper,  color: '#7E22CE' },
    { type: 'presentation',  label: 'Presentation',    icon: Presentation, color: '#9333EA' },
    { type: 'proposal',      label: 'Proposal / RFP',  icon: Send,       color: '#A855F7' },
    { type: 'newsletter',    label: 'Newsletter',      icon: Inbox,      color: '#C026D3' },
  ]},
  { category: 'Data & Reports', items: [
    { type: 'whitepaper',  label: 'Whitepaper',    icon: FileBarChart,   color: '#475569' },
    { type: 'case_study',  label: 'Case Study',    icon: Award,          color: '#64748B' },
    { type: 'survey',      label: 'Survey',        icon: ClipboardCheck, color: '#94A3B8' },
    { type: 'data',        label: 'Data / Sheet',  icon: Database,       color: '#334155' },
    { type: 'report',      label: 'Report',        icon: FileBarChart,   color: '#1E293B' },
  ]},
  { category: 'Investor Relations', items: [
    { type: 'due_diligence',   label: 'Due Diligence',    icon: Briefcase,        color: '#B45309' },
    { type: 'investor_update', label: 'Investor Update',  icon: TrendingUp,       color: '#92400E' },
    { type: 'data_room',       label: 'Data Room',        icon: FolderOpen,       color: '#78350F' },
    { type: 'valuation',       label: 'Valuation',        icon: CircleDollarSign, color: '#451A03' },
  ]},
  { category: 'Task Management', items: [
    { type: 'task',          label: 'Task',          icon: ListTodo,      color: '#F97316' },
    { type: 'milestone',     label: 'Milestone',     icon: Flag,          color: '#EF4444' },
    { type: 'sprint',        label: 'Sprint',        icon: Repeat,        color: '#F59E0B' },
    { type: 'retrospective', label: 'Retrospective', icon: MessageSquare, color: '#84CC16' },
  ]},
  { category: 'Shapes & Diagrams', items: [
    { type: 'shape_rect',     label: 'Rectangle',      icon: Square,    color: '#3B82F6' },
    { type: 'shape_circle',   label: 'Circle',         icon: Circle,    color: '#8B5CF6' },
    { type: 'shape_diamond',  label: 'Diamond',        icon: Diamond,   color: '#F59E0B' },
    { type: 'shape_triangle', label: 'Triangle',       icon: Triangle,  color: '#10B981' },
    { type: 'shape_line',     label: 'Line',           icon: Minus,     color: '#94A3B8' },
    { type: 'shape_arrow',    label: 'Arrow',          icon: MoveRight, color: '#6366F1' },
    { type: 'shape_text',     label: 'Text Label',     icon: Type,      color: '#475569' },
    { type: 'mermaid_diagram',label: 'Mermaid Diagram',icon: Spline,    color: '#EC4899' },
  ]},
  { category: 'Visual Templates', items: [
    { type: 'visual_bmc',  label: 'Business Model Canvas', icon: LayoutGrid, color: '#3B82F6' },
    { type: 'visual_lean', label: 'Lean Canvas',            icon: Target,     color: '#8B5CF6' },
    { type: 'visual_swot', label: 'SWOT Analysis',          icon: Target,     color: '#10B981' },
  ]},
  { category: 'Interactive', items: [
    { type: 'flow_diagram', label: 'Flow Diagram',  icon: GitBranch, color: '#6366F1' },
    { type: 'whiteboard',   label: 'Whiteboard',    icon: PenTool,   color: '#06B6D4' },
  ]},
];

interface CanvasSnapshot {
  nodes: Array<{ id: string; posX: number; posY: number; width: number; height: number }>;
  action: string;
}

interface SelectionBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

type NodeUpdateData = {
  title?: string;
  content?: string;
  url?: string;
  posX?: number;
  posY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
  color?: string;
  collapsed?: boolean;
  locked?: boolean;
  tags?: string[];
  metadata?: unknown;
  builderDocumentId?: string | null;
};

export default function ResearchBoardPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const boardId = params?.boardId as string;

  // Canvas state
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const GRID_SIZE = 32;

  // Snap coordinate to grid
  const snap = useCallback((val: number) => {
    if (!snapToGrid) return val;
    return Math.round(val / GRID_SIZE) * GRID_SIZE;
  }, [snapToGrid]);

  // Multi-selection state (replaces single selectedNodeId)
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [viewingNode, setViewingNode] = useState<ResearchNode | null>(null);

  // Undo/Redo history
  const [history, setHistory] = useState<CanvasSnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Box selection (Shift+Drag)
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [isBoxSelecting, setIsBoxSelecting] = useState(false);
  const [boxSelectStart, setBoxSelectStart] = useState({ x: 0, y: 0 });

  // Connection drawing mode
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [tempConnectionEnd, setTempConnectionEnd] = useState<{ x: number; y: number } | null>(null);

  // Keyboard shortcuts help dialog
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Right-click context menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId?: string } | null>(null);

  // Drag state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Resize state
  const [resizingNodeId, setResizingNodeId] = useState<string | null>(null);
  const [resizeDir, setResizeDir] = useState<'right' | 'bottom' | 'corner' | null>(null);
  const [resizeStart, setResizeStart] = useState({ mouseX: 0, mouseY: 0, origW: 0, origH: 0 });

  // Group frames state (persisted in canvasState)
  const [groups, setGroups] = useState<ResearchGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [draggingGroupId, setDraggingGroupId] = useState<string | null>(null);
  const [resizingGroupId, setResizingGroupId] = useState<string | null>(null);
  const [groupResizeDir, setGroupResizeDir] = useState<'right' | 'bottom' | 'corner' | null>(null);
  const [groupResizeStart, setGroupResizeStart] = useState({ mouseX: 0, mouseY: 0, origW: 0, origH: 0 });

  // Sticky notes quick-create mode
  const [stickyNoteMode, setStickyNoteMode] = useState(false);

  // Board summary
  const [showBoardSummary, setShowBoardSummary] = useState(false);

  // Canvas → Builder synthesis prompt (dismissed per board, persisted in localStorage)
  const synthDismissKey = `cfb_synth_dismissed_${boardId}`;
  const [synthDismissed, setSynthDismissed] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(synthDismissKey) === 'true') {
      setSynthDismissed(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  // Entity reference selector
  const [showEntitySelector, setShowEntitySelector] = useState(false);

  // Filtering state
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterSearch, setFilterSearch] = useState('');
  const [showFilterBar, setShowFilterBar] = useState(false);

  // Panel states
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showBoardSettings, setShowBoardSettings] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [commentsNodeId, setCommentsNodeId] = useState<string | null>(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [showShapeLibrary, setShowShapeLibrary] = useState(false);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [activeBranchName, setActiveBranchName] = useState<string | null>(null);

  const currentUser = useCurrentUser();

  const { isConnected, collaborators, emitCursor, emitNodeMove, emitNodeUpdate } = useResearchCollaboration({
    boardId: boardId ?? null,
    enabled: !!boardId,
  });

  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['research-board', boardId],
    queryFn: () => getResearchBoard(boardId),
  });

  const board = data?.board;

  // Filtered nodes derived from board data
  const filteredNodes = useMemo(() => {
    const nodes = board?.nodes ?? [];
    if (!filterSearch && filterTags.length === 0) return nodes;
    return nodes.filter((n) => {
      const matchesSearch = !filterSearch ||
        (n.title ?? '').toLowerCase().includes(filterSearch.toLowerCase()) ||
        (n.content ?? '').toLowerCase().includes(filterSearch.toLowerCase());
      const matchesTags = filterTags.length === 0 ||
        filterTags.every((t) => n.tags.includes(t));
      return matchesSearch && matchesTags;
    });
  }, [board?.nodes, filterSearch, filterTags]);

  const updateBoardMutation = useMutation({
    mutationFn: (data: Parameters<typeof updateResearchBoard>[1]) => updateResearchBoard(boardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research-board', boardId] });
    },
  });

  const createNodeMutation = useMutation({
    mutationFn: (data: Parameters<typeof createResearchNode>[1]) => createResearchNode(boardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research-board', boardId] });
    },
  });

  const updateNodeMutation = useMutation({
    mutationFn: ({ nodeId, data }: { nodeId: string; data: NodeUpdateData }) =>
      updateResearchNode(nodeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research-board', boardId] });
    },
  });

  const deleteNodeMutation = useMutation({
    mutationFn: deleteResearchNode,
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['research-board', boardId] });
      setSelectedNodeIds((prev) => { const next = new Set(prev); next.delete(deletedId); return next; });
    },
  });

  const createConnectorMutation = useMutation({
    mutationFn: (data: Parameters<typeof createResearchConnector>[1]) => createResearchConnector(boardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research-board', boardId] });
    },
  });

  const deleteConnectorMutation = useMutation({
    mutationFn: deleteResearchConnector,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research-board', boardId] });
      success('Connection deleted');
    },
  });

  const batchUpdateMutation = useMutation({
    mutationFn: (updates: Parameters<typeof batchUpdateResearchNodes>[1]) =>
      batchUpdateResearchNodes(boardId, updates),
  });

  // Save canvas state periodically (includes groups)
  useEffect(() => {
    if (!board) return;
    const timeout = setTimeout(() => {
      updateBoardMutation.mutate({ canvasState: { zoom, pan, groups } });
    }, 2000);
    return () => clearTimeout(timeout);
  }, [zoom, pan, groups]);

  // Restore canvas state on load
  useEffect(() => {
    if (board?.canvasState && typeof board.canvasState === 'object') {
      const state = board.canvasState as { zoom?: number; pan?: { x: number; y: number }; groups?: ResearchGroup[] };
      if (state.zoom) setZoom(state.zoom);
      if (state.pan) setPan(state.pan);
      if (state.groups && Array.isArray(state.groups)) setGroups(state.groups);
    }
  }, [board?.id]);

  // Zoom handlers
  const handleZoom = useCallback((delta: number, centerX?: number, centerY?: number) => {
    setZoom((prev) => {
      const next = Math.min(Math.max(prev + delta, 0.25), 3);
      // Zoom centered on cursor: keep the point under the mouse fixed
      if (centerX !== undefined && centerY !== undefined && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = centerX - rect.left;
        const mouseY = centerY - rect.top;
        const factor = next / prev;
        setPan((p) => ({
          x: mouseX - (mouseX - p.x) * factor,
          y: mouseY - (mouseY - p.y) * factor,
        }));
      }
      return next;
    });
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey || !e.shiftKey) {
      // Scroll = zoom centered on cursor
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      handleZoom(delta, e.clientX, e.clientY);
    } else {
      // Shift+scroll = horizontal pan
      setPan((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  }, [handleZoom]);

  // Attach wheel handler with { passive: false } so preventDefault() works.
  // React's synthetic onWheel is passive by default in React 17+ which prevents
  // calling preventDefault() and triggers a console warning.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Fit-to-content: auto-zoom and center to show all nodes
  const fitToContent = useCallback(() => {
    if (!board || board.nodes.length === 0 || !canvasRef.current) return;
    const PADDING = 80;
    const rect = canvasRef.current.getBoundingClientRect();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of board.nodes) {
      minX = Math.min(minX, n.posX);
      minY = Math.min(minY, n.posY);
      maxX = Math.max(maxX, n.posX + n.width);
      maxY = Math.max(maxY, n.posY + (n.height || 200));
    }
    const contentW = maxX - minX + PADDING * 2;
    const contentH = maxY - minY + PADDING * 2;
    const newZoom = Math.min(Math.max(Math.min(rect.width / contentW, rect.height / contentH), 0.25), 2);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    setZoom(newZoom);
    setPan({
      x: rect.width / 2 - centerX * newZoom,
      y: rect.height / 2 - centerY * newZoom,
    });
  }, [board]);

  // --- Undo/Redo helpers ---
  const pushHistory = useCallback((action: string) => {
    if (!board) return;
    const snap: CanvasSnapshot = {
      nodes: board.nodes.map((n) => ({ id: n.id, posX: n.posX, posY: n.posY, width: n.width, height: n.height })),
      action,
    };
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      trimmed.push(snap);
      if (trimmed.length > MAX_HISTORY) trimmed.shift();
      return trimmed;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [board, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0 || !board) return;
    const prev = history[historyIndex - 1];
    const updates = prev.nodes.map((s) => ({ id: s.id, posX: s.posX, posY: s.posY }));
    batchUpdateMutation.mutate(updates);
    setHistoryIndex((i) => i - 1);
    queryClient.invalidateQueries({ queryKey: ['research-board', boardId] });
  }, [historyIndex, history, board, batchUpdateMutation, boardId, queryClient]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1 || !board) return;
    const next = history[historyIndex + 1];
    const updates = next.nodes.map((s) => ({ id: s.id, posX: s.posX, posY: s.posY }));
    batchUpdateMutation.mutate(updates);
    setHistoryIndex((i) => i + 1);
    queryClient.invalidateQueries({ queryKey: ['research-board', boardId] });
  }, [historyIndex, history, board, batchUpdateMutation, boardId, queryClient]);

  // --- Connection drawing ---
  const handleCompleteConnection = useCallback((toId: string) => {
    if (!connectionStart || connectionStart === toId) {
      setConnectionStart(null);
      setTempConnectionEnd(null);
      return;
    }
    createConnectorMutation.mutate({ fromNodeId: connectionStart, toNodeId: toId });
    setConnectionStart(null);
    setTempConnectionEnd(null);
    setActiveTool('select');
    success('Connection created');
  }, [connectionStart, createConnectorMutation, success]);

  // --- Duplicate selected nodes ---
  const duplicateSelected = useCallback(() => {
    if (!board || selectedNodeIds.size === 0) return;
    const toDup = board.nodes.filter((n) => selectedNodeIds.has(n.id));
    toDup.forEach((n, i) => {
      createNodeMutation.mutate({
        type: n.type,
        title: n.title ?? 'Copy',
        content: n.content ?? '',
        posX: n.posX + 30,
        posY: n.posY + 30 + i * 20,
        width: n.width,
        height: n.height,
      });
    });
    success(`Duplicated ${toDup.length} node(s)`);
  }, [board, selectedNodeIds, createNodeMutation, success]);

  // Pan / box-select / note-create handlers
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target !== canvasRef.current) return;
    
    // Cancel connection drawing on canvas click
    if (connectionStart) {
      setConnectionStart(null);
      setActiveTool('select');
      return;
    }

    if (activeTool === 'note') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - pan.x) / zoom;
        const y = (e.clientY - rect.top - pan.y) / zoom;
        createNodeMutation.mutate({
          type: 'note',
          title: 'New Note',
          content: '',
          posX: x,
          posY: y,
          width: 280,
          height: 200,
        });
        setActiveTool('select');
      }
    } else if (activeTool === 'mermaid') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - pan.x) / zoom;
        const y = (e.clientY - rect.top - pan.y) / zoom;
        createNodeMutation.mutate({
          type: 'mermaid_diagram' as ResearchNodeType,
          title: 'Diagram',
          content: MERMAID_STARTERS.flowchart,
          posX: x,
          posY: y,
          width: 420,
          height: 320,
        });
        setActiveTool('select');
      }
    } else if (['shape_rect','shape_circle','shape_diamond','shape_triangle','shape_line','shape_arrow','shape_text'].includes(activeTool)) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - pan.x) / zoom;
        const y = (e.clientY - rect.top - pan.y) / zoom;
        const isLine = activeTool === 'shape_line' || activeTool === 'shape_arrow';
        createNodeMutation.mutate({
          type: activeTool as ResearchNodeType,
          title: '',
          content: '',
          posX: x,
          posY: y,
          width: isLine ? 200 : 160,
          height: isLine ? 50 : 120,
        });
        setActiveTool('select');
      }
    } else if (activeTool === 'hand') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    } else if (e.shiftKey) {
      // Shift+Drag → box selection
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const cx = (e.clientX - rect.left - pan.x) / zoom;
        const cy = (e.clientY - rect.top - pan.y) / zoom;
        setIsBoxSelecting(true);
        setBoxSelectStart({ x: e.clientX, y: e.clientY });
        setSelectionBox({ startX: cx, startY: cy, currentX: cx, currentY: cy });
      }
    } else {
      // Normal canvas drag → pan
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelectedNodeIds(new Set());
    }
  }, [activeTool, pan, zoom, createNodeMutation, connectionStart]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (isBoxSelecting && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const cx = (e.clientX - rect.left - pan.x) / zoom;
      const cy = (e.clientY - rect.top - pan.y) / zoom;
      setSelectionBox((prev) => prev ? { ...prev, currentX: cx, currentY: cy } : null);
    } else if (resizingNodeId && canvasRef.current) {
      // Resize logic
      const dx = (e.clientX - resizeStart.mouseX) / zoom;
      const dy = (e.clientY - resizeStart.mouseY) / zoom;
      const MIN_W = 160, MIN_H = 100;
      let newW = resizeStart.origW;
      let newH = resizeStart.origH;
      if (resizeDir === 'right' || resizeDir === 'corner') newW = Math.max(MIN_W, resizeStart.origW + dx);
      if (resizeDir === 'bottom' || resizeDir === 'corner') newH = Math.max(MIN_H, resizeStart.origH + dy);
      queryClient.setQueryData(['research-board', boardId], (old: { board: ResearchBoardFull } | undefined) => {
        if (!old) return old;
        return { ...old, board: { ...old.board, nodes: old.board.nodes.map((n) =>
          n.id === resizingNodeId ? { ...n, width: newW, height: newH } : n
        )}};
      });
    } else if (resizingGroupId) {
      // Group resize logic
      const dx = (e.clientX - groupResizeStart.mouseX) / zoom;
      const dy = (e.clientY - groupResizeStart.mouseY) / zoom;
      let newW = groupResizeStart.origW, newH = groupResizeStart.origH;
      if (groupResizeDir === 'right' || groupResizeDir === 'corner') newW = Math.max(200, groupResizeStart.origW + dx);
      if (groupResizeDir === 'bottom' || groupResizeDir === 'corner') newH = Math.max(120, groupResizeStart.origH + dy);
      setGroups((prev) => prev.map((g) => g.id === resizingGroupId ? { ...g, width: newW, height: newH } : g));
    } else if (draggingGroupId && canvasRef.current) {
      // Group drag logic
      const rect = canvasRef.current.getBoundingClientRect();
      const x = snap((e.clientX - rect.left - pan.x) / zoom - dragOffset.x);
      const y = snap((e.clientY - rect.top - pan.y) / zoom - dragOffset.y);
      setGroups((prev) => prev.map((g) => g.id === draggingGroupId ? { ...g, posX: x, posY: y } : g));
    } else if (draggingNodeId && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const rawX = (e.clientX - rect.left - pan.x) / zoom - dragOffset.x;
      const rawY = (e.clientY - rect.top - pan.y) / zoom - dragOffset.y;
      const x = snap(rawX);
      const y = snap(rawY);
      
      // Move all selected nodes together if dragging one of the selection
      if (selectedNodeIds.size > 1 && selectedNodeIds.has(draggingNodeId)) {
        const draggedNode = board?.nodes.find((n) => n.id === draggingNodeId);
        if (draggedNode) {
          const dx = x - draggedNode.posX;
          const dy = y - draggedNode.posY;
          queryClient.setQueryData(['research-board', boardId], (old: { board: ResearchBoardFull } | undefined) => {
            if (!old) return old;
            return {
              ...old,
              board: {
                ...old.board,
                nodes: old.board.nodes.map((n) =>
                  selectedNodeIds.has(n.id) ? { ...n, posX: n.posX + dx, posY: n.posY + dy } : n
                ),
              },
            };
          });
        }
      } else {
        queryClient.setQueryData(['research-board', boardId], (old: { board: ResearchBoardFull } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            board: {
              ...old.board,
              nodes: old.board.nodes.map((n) =>
                n.id === draggingNodeId ? { ...n, posX: x, posY: y } : n
              ),
            },
          };
        });
      }
    }
  }, [isPanning, panStart, isBoxSelecting, draggingNodeId, dragOffset, pan, zoom, boardId, queryClient, selectedNodeIds, board, snap, resizingNodeId, resizeDir, resizeStart, resizingGroupId, groupResizeDir, groupResizeStart, draggingGroupId]);

  const handleCanvasMouseUp = useCallback(() => {
    // Finalize box selection
    if (isBoxSelecting && selectionBox && board) {
      const minX = Math.min(selectionBox.startX, selectionBox.currentX);
      const maxX = Math.max(selectionBox.startX, selectionBox.currentX);
      const minY = Math.min(selectionBox.startY, selectionBox.currentY);
      const maxY = Math.max(selectionBox.startY, selectionBox.currentY);
      const inBox = board.nodes.filter((n) =>
        n.posX >= minX && n.posX + n.width <= maxX &&
        n.posY >= minY && n.posY + n.height <= maxY
      ).map((n) => n.id);
      setSelectedNodeIds(new Set(inBox));
      setSelectionBox(null);
      setIsBoxSelecting(false);
    }

    // Finalize node drag
    if (draggingNodeId && board) {
      pushHistory('Move nodes');
      if (selectedNodeIds.size > 1 && selectedNodeIds.has(draggingNodeId)) {
        const updates = board.nodes
          .filter((n) => selectedNodeIds.has(n.id))
          .map((n) => ({ id: n.id, posX: n.posX, posY: n.posY }));
        batchUpdateMutation.mutate(updates);
      } else {
        const node = board.nodes.find((n) => n.id === draggingNodeId);
        if (node) {
          updateNodeMutation.mutate({
            nodeId: draggingNodeId,
            data: { posX: node.posX, posY: node.posY },
          });
        }
      }
    }
    // Finalize node resize
    if (resizingNodeId && board) {
      pushHistory('Resize node');
      const node = board.nodes.find((n) => n.id === resizingNodeId);
      if (node) {
        updateNodeMutation.mutate({
          nodeId: resizingNodeId,
          data: { width: node.width, height: node.height },
        });
      }
    }
    // Group drag/resize finalization is automatic (state-based, persisted via canvasState debounce)
    setIsPanning(false);
    setDraggingNodeId(null);
    setResizingNodeId(null);
    setResizeDir(null);
    setDraggingGroupId(null);
    setResizingGroupId(null);
    setGroupResizeDir(null);
  }, [draggingNodeId, board, updateNodeMutation, isBoxSelecting, selectionBox, selectedNodeIds, batchUpdateMutation, pushHistory, resizingNodeId]);

  // Node drag handlers
  const handleNodeDragStart = useCallback((nodeId: string, e: React.MouseEvent) => {
    if (activeTool !== 'select') return;
    
    const node = board?.nodes.find((n) => n.id === nodeId);
    if (!node || node.locked) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    setDraggingNodeId(nodeId);
    setDragOffset({ x: mouseX - node.posX, y: mouseY - node.posY });
    // Multi-select: if not already in selection, replace selection with just this node
    if (!selectedNodeIds.has(nodeId)) {
      setSelectedNodeIds(new Set([nodeId]));
    }
  }, [activeTool, board, pan, zoom, selectedNodeIds]);

  // Node resize handler
  const handleNodeResizeStart = useCallback((nodeId: string, e: React.MouseEvent, direction: 'right' | 'bottom' | 'corner') => {
    const node = board?.nodes.find((n) => n.id === nodeId);
    if (!node || node.locked) return;
    e.preventDefault();
    setResizingNodeId(nodeId);
    setResizeDir(direction);
    setResizeStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      origW: node.width,
      origH: node.height || 200,
    });
  }, [board]);

  // ─── Group frame handlers ───────────────────────────────────────────────
  const createGroup = useCallback((posX: number, posY: number) => {
    const id = crypto.randomUUID();
    setGroups((prev) => [...prev, {
      id, label: 'New Group', color: '#3B82F6',
      posX, posY, width: 400, height: 300,
      collapsed: false, locked: false, zIndex: 0,
    }]);
    setSelectedGroupId(id);
  }, []);

  const updateGroup = useCallback((id: string, data: Partial<ResearchGroup>) => {
    setGroups((prev) => prev.map((g) => g.id === id ? { ...g, ...data } : g));
  }, []);

  const deleteGroup = useCallback((id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
    if (selectedGroupId === id) setSelectedGroupId(null);
  }, [selectedGroupId]);

  const handleGroupDragStart = useCallback((groupId: string, e: React.MouseEvent) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group || group.locked) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;
    setDraggingGroupId(groupId);
    setDragOffset({ x: mouseX - group.posX, y: mouseY - group.posY });
    setSelectedGroupId(groupId);
    setSelectedNodeIds(new Set());
  }, [groups, pan, zoom]);

  const handleGroupResizeStart = useCallback((groupId: string, e: React.MouseEvent, direction: 'right' | 'bottom' | 'corner') => {
    const group = groups.find((g) => g.id === groupId);
    if (!group || group.locked) return;
    e.preventDefault();
    setResizingGroupId(groupId);
    setGroupResizeDir(direction);
    setGroupResizeStart({ mouseX: e.clientX, mouseY: e.clientY, origW: group.width, origH: group.height });
  }, [groups]);

  // File upload handler
  const handleFileUpload = async (files: FileList) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    let offsetX = 0;
    for (const file of Array.from(files)) {
      try {
        const { upload } = await uploadResearchAsset(file);
        
        // Determine node type based on file MIME type
        let type: ResearchNodeType = 'document';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type === 'application/pdf') type = 'pdf';
        else if (file.type.includes('word') || file.type.includes('text')) type = 'document';

        await createNodeMutation.mutateAsync({
          type: type as any, // Cast to satisfy type checking
          title: file.name,
          uploadId: upload.id,
          url: upload.url,
          posX: (rect.width / 2 - pan.x) / zoom + offsetX,
          posY: (rect.height / 2 - pan.y) / zoom,
          width: type === 'image' ? 320 : 280,
          height: type === 'image' ? 240 : 200,
          metadata: {
            mimeType: upload.mimeType,
            sizeBytes: upload.sizeBytes,
            originalName: upload.originalName,
          },
        });

        offsetX += 300;
      } catch (err) {
        showError('Upload failed', err instanceof Error ? err.message : 'Please try again');
      }
    }
    
    queryClient.invalidateQueries({ queryKey: ['research-board', boardId] });
    success('Files uploaded', `${files.length} file(s) added to board`);
  };

  // Keyboard shortcuts — full set from Codebase B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLDivElement && (e.target as HTMLDivElement).contentEditable === 'true') return;

      // Delete selected nodes
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeIds.size > 0) {
          const toDelete = board?.nodes.filter((n) => selectedNodeIds.has(n.id) && !n.locked) ?? [];
          toDelete.forEach((n) => deleteNodeMutation.mutate(n.id));
        }
      }
      // Escape — clear selection + cancel connection
      else if (e.key === 'Escape') {
        setSelectedNodeIds(new Set());
        setViewingNode(null);
        setActiveTool('select');
        setConnectionStart(null);
        setTempConnectionEnd(null);
        setShowShortcuts(false);
      }
      // Undo (Ctrl+Z)
      else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Redo (Ctrl+Y or Ctrl+Shift+Z)
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      // Duplicate (Ctrl+D)
      else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        duplicateSelected();
      }
      // Select all (Ctrl+A)
      else if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        if (board) setSelectedNodeIds(new Set(board.nodes.map((n) => n.id)));
      }
      // Arrow key movement
      else if (selectedNodeIds.size > 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        if (board) {
          const updates = board.nodes
            .filter((n) => selectedNodeIds.has(n.id))
            .map((n) => ({ id: n.id, posX: n.posX + dx, posY: n.posY + dy }));
          // Optimistic local update
          queryClient.setQueryData(['research-board', boardId], (old: { board: ResearchBoardFull } | undefined) => {
            if (!old) return old;
            return { ...old, board: { ...old.board, nodes: old.board.nodes.map((n) => selectedNodeIds.has(n.id) ? { ...n, posX: n.posX + dx, posY: n.posY + dy } : n) } };
          });
          batchUpdateMutation.mutate(updates);
        }
      }
      // Tool shortcuts
      else if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
      } else if (e.key === 'n' || e.key === 'N') {
        setActiveTool('note');
      } else if (e.key === 'c' || e.key === 'C') {
        if (!e.ctrlKey && !e.metaKey) setActiveTool('connect');
      }
      // Reset view (Ctrl+0)
      else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
      // Create group frame (Shift+G) — must check before plain G
      else if (e.key === 'G' && e.shiftKey && !e.ctrlKey && !e.metaKey) {
        const cx = (window.innerWidth / 2 - pan.x) / zoom;
        const cy = (window.innerHeight / 2 - pan.y) / zoom;
        createGroup(cx - 200, cy - 150);
      }
      // Toggle snap-to-grid (G, no modifiers)
      else if (e.key === 'g' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        setSnapToGrid((v) => !v);
      }
      // Fit-to-content (F)
      else if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey) {
        fitToContent();
      }
      // Add sticky note (S, no modifiers)
      else if (e.key === 's' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const cx = (window.innerWidth / 2 - pan.x) / zoom;
        const cy = (window.innerHeight / 2 - pan.y) / zoom;
        createNodeMutation.mutate({ type: 'note' as any, title: '', content: '', posX: cx - 100, posY: cy - 100, width: 200, height: 200, color: '#F59E0B', metadata: { isSticky: true } });
      }
      // Show shortcuts (?)
      else if (e.key === '?' && e.shiftKey) {
        setShowShortcuts((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds, board, deleteNodeMutation, undo, redo, duplicateSelected, boardId, queryClient, batchUpdateMutation, fitToContent]);

  // Right-click context menu handler
  const handleContextMenu = useCallback((e: React.MouseEvent, nodeId?: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
  }, []);

  // Close context menu on any click
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [contextMenu]);

  // Drag and drop files
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    dragCounterRef.current = 0;
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) { setIsDragOver(false); dragCounterRef.current = 0; }
  }, []);

  const { expanded, toggle, setExpanded } = useSidebar();

  // Mounted guard: prevents hydration mismatch by ensuring SSR and first
  // client render both show the same loading placeholder. The real query
  // state is only evaluated after the component mounts on the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Auto-collapse sidebar for immersive canvas mode; restore on leave
  useEffect(() => {
    setExpanded(false);
    return () => { setExpanded(true); };
  }, [setExpanded]);

  // PNG export handler
  const handleExportPng = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = await toPng(canvasRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `${board?.title ?? 'canvas'}-export.png`;
      link.href = dataUrl;
      link.click();
      success('Canvas exported as PNG');
    } catch {
      showError('Export failed. Try zooming to fit first.');
    }
  }, [board?.title, success, showError]);

  // Auto-layout handler
  const handleAutoLayout = useCallback(async (algorithm: LayoutAlgorithm) => {
    const nodes = board?.nodes ?? [];
    const connectors = board?.connectors ?? [];
    if (nodes.length === 0) { showError('No nodes to layout'); return; }
    const results = computeLayout(algorithm, nodes, connectors);
    try {
      await batchUpdateResearchNodes(
        boardId,
        results.map((r) => ({ id: r.id, posX: r.posX, posY: r.posY }))
      );
      queryClient.invalidateQueries({ queryKey: ['research-board', boardId] });
      success(`Auto-layout applied (${algorithm.replace('dagre-', '').toUpperCase()})`);
    } catch {
      showError('Layout failed — please try again');
    }
  }, [board?.nodes, board?.connectors, boardId, queryClient, success, showError]);

  // Show a stable loading spinner until mounted + query resolves
  const showLoading = !mounted || isLoading;

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <SideNav />

      {/* Main content area - offset by sidebar */}
      <div
        className={cn(
          'h-screen flex flex-col overflow-hidden transition-[margin-left] duration-200 ease-out',
          expanded ? 'lg:ml-[240px]' : 'lg:ml-[68px]',
        )}
      >
        {/* Loading state — also rendered during SSR for consistent HTML */}
        {showLoading && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error state — only after mount to avoid hydration mismatch */}
        {!showLoading && (error || !board) && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <p className="text-destructive mb-4">Failed to load board</p>
            <Button onClick={() => router.push('/research')}>Back to Boards</Button>
          </div>
        )}

        {/* Board content */}
        {!showLoading && board && <>
        {/* Toolbar — clean minimal design */}
        <div className="h-12 border-b bg-card/95 backdrop-blur-sm flex items-center px-4 shrink-0 z-50 gap-3">
          {/* Left: Brand + node count */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href="/research" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Layers className="h-5 w-5 text-primary shrink-0" />
              <span className="font-semibold text-sm text-foreground hidden sm:inline">Research Canvas</span>
            </Link>
            <span className="text-[11px] text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full tabular-nums shrink-0">
              {board.nodes.length} node{board.nodes.length !== 1 ? 's' : ''}
            </span>
            <CollaboratorsBar collaborators={collaborators} isConnected={isConnected} className="ml-1" />
          </div>

          <div className="h-5 w-px bg-border/60" />

          {/* Quick Note tool */}
          <Button
            variant={activeTool === 'note' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTool(activeTool === 'note' ? 'select' : 'note')}
            className="gap-1.5 h-8 text-xs"
            title="Click canvas to place note (N)"
          >
            <StickyNote className="h-3.5 w-3.5 text-amber-500" />
            <span className="hidden md:inline">Note</span>
          </Button>

          {/* Categorised Add Node mega-dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 h-8 text-xs">
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Add Node</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 max-h-[70vh] overflow-y-auto">
              {NODE_CATEGORIES.map((cat, ci) => (
                <div key={cat.category}>
                  {ci > 0 && <DropdownMenuSeparator />}
                  <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {cat.category}
                  </div>
                  {cat.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem
                        key={item.type}
                        onClick={() => {
                          if (item.type === 'link') {
                            const url = prompt('Enter URL:');
                            if (url) {
                              createNodeMutation.mutate({
                                type: 'link',
                                title: url,
                                url,
                                posX: (window.innerWidth / 2 - pan.x) / zoom,
                                posY: (window.innerHeight / 2 - pan.y) / zoom,
                              });
                            }
                          } else {
                            const isTemplate  = ['visual_bmc','visual_lean'].includes(item.type);
                            const isSwot      = item.type === 'visual_swot';
                            const isMermaid2  = item.type === 'mermaid_diagram';
                            const isFlow      = item.type === 'flow_diagram';
                            const isBoard     = item.type === 'whiteboard';
                            const isShapeType = item.type.startsWith('shape_');
                            const isLineShape = item.type === 'shape_line' || item.type === 'shape_arrow';
                            const w = isTemplate ? 880 : isSwot ? 400 : isMermaid2 ? 420 : isFlow ? 560 : isBoard ? 600 : isLineShape ? 200 : isShapeType ? 160 : (item.type === 'checklist' || item.type === 'task' || item.type === 'milestone' ? 300 : 280);
                            const h = isTemplate ? 400 : isSwot ? 320 : isMermaid2 ? 320 : isFlow ? 360 : isBoard ? 420 : isLineShape ? 50 : isShapeType ? 120 : (item.type === 'pitch_deck' || item.type === 'business_plan' ? 240 : 200);
                            createNodeMutation.mutate({
                              type: item.type,
                              title: isShapeType ? '' : `New ${item.label}`,
                              content: getDefaultContent(item.type),
                              posX: (window.innerWidth / 2 - pan.x) / zoom - w / 2,
                              posY: (window.innerHeight / 2 - pan.y) / zoom - h / 2,
                              width: w,
                              height: h,
                            });
                          }
                        }}
                        className="gap-2"
                      >
                        <Icon className="h-4 w-4 shrink-0" style={{ color: item.color }} />
                        {item.label}
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Upload */}
          <Button
            variant="default"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-1.5 h-8 text-xs"
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Upload</span>
          </Button>

          {/* Connect tool */}
          <Button
            variant={activeTool === 'connect' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTool(activeTool === 'connect' ? 'select' : 'connect')}
            className="gap-1.5 h-8 text-xs"
            title="Draw connection (C)"
          >
            <GitBranch className="h-3.5 w-3.5 text-emerald-500" />
            <span className="hidden md:inline">Connect</span>
          </Button>

          <div className="h-5 w-px bg-border/60" />

          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={undo} disabled={historyIndex <= 0} title="Undo (Ctrl+Z)">
              <Undo2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo (Ctrl+Y)">
              <Redo2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Zoom controls */}
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleZoom(-0.25)} title="Zoom out">
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[11px] text-muted-foreground w-10 text-center tabular-nums select-none">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleZoom(0.25)} title="Zoom in">
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              title="Reset view (1:1)"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={fitToContent}
              title="Fit all nodes in view"
            >
              <Layers className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="h-5 w-px bg-border/60" />

          {/* Snap-to-grid toggle */}
          <Button
            variant={snapToGrid ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setSnapToGrid((v) => !v)}
            title={snapToGrid ? 'Snap to grid ON' : 'Snap to grid OFF'}
          >
            <Magnet className="h-3.5 w-3.5" />
          </Button>

          <div className="h-5 w-px bg-border/60" />

          {/* AI Analysis toggle */}
          <Button
            variant={showAIPanel ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => { setShowAIPanel((v) => !v); setShowBoardSummary(false); }}
            title="AI Analysis"
          >
            <Sparkles className="h-3.5 w-3.5" />
          </Button>

          {/* Board Summary toggle */}
          <Button
            variant={showBoardSummary ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => { setShowBoardSummary((v) => !v); setShowAIPanel(false); }}
            title="Board Summary & Health"
          >
            <BarChart3 className="h-3.5 w-3.5" />
          </Button>

          {/* Branch Selector */}
          <CanvasBranchSelector
            boardId={boardId}
            activeBranchId={activeBranchId}
            onBranchSelect={(id, name) => { setActiveBranchId(id); setActiveBranchName(name); }}
            onCreateBranch={() => setShowHistoryDrawer(true)}
          />

          {/* Board History */}
          <Button
            variant={showHistoryDrawer ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setShowHistoryDrawer((v) => !v)}
            title="Canvas History, Versions & Branches"
          >
            <History className="h-3.5 w-3.5" />
          </Button>

          {/* More menu — houses all secondary actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => {
                const url = prompt('Enter URL:');
                if (url) {
                  createNodeMutation.mutate({
                    type: 'link',
                    title: url,
                    url,
                    posX: (window.innerWidth / 2 - pan.x) / zoom,
                    posY: (window.innerHeight / 2 - pan.y) / zoom,
                  });
                }
              }}>
                <LinkIcon className="h-4 w-4 mr-2" />
                Add Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowEntitySelector(true)}>
                <Users className="h-4 w-4 mr-2" />
                Reference Entity
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowGrid(!showGrid)}>
                <Grid3X3 className="h-4 w-4 mr-2" />
                {showGrid ? 'Hide' : 'Show'} Grid
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSnapToGrid((v) => !v)}>
                <Magnet className="h-4 w-4 mr-2" />
                {snapToGrid ? 'Disable' : 'Enable'} Snap to Grid
              </DropdownMenuItem>
              <DropdownMenuItem onClick={fitToContent}>
                <Layers className="h-4 w-4 mr-2" />
                Fit All Nodes in View
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                const cx = (window.innerWidth / 2 - pan.x) / zoom;
                const cy = (window.innerHeight / 2 - pan.y) / zoom;
                createGroup(cx - 200, cy - 150);
              }}>
                <Grid3X3 className="h-4 w-4 mr-2 text-blue-500" />
                Create Group Frame
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const cx = (window.innerWidth / 2 - pan.x) / zoom;
                const cy = (window.innerHeight / 2 - pan.y) / zoom;
                createNodeMutation.mutate({ type: 'note' as any, title: '', content: '', posX: cx - 100, posY: cy - 100, width: 200, height: 200, color: '#F59E0B', metadata: { isSticky: true } });
              }}>
                <StickyNote className="h-4 w-4 mr-2 text-amber-500" />
                Add Sticky Note
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowFilterBar((v) => !v)}>
                <Filter className="h-4 w-4 mr-2" />
                {showFilterBar ? 'Hide' : 'Show'} Filters
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowMiniMap((v) => !v)}>
                <Map className="h-4 w-4 mr-2" />
                {showMiniMap ? 'Hide' : 'Show'} Mini-Map
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowBoardSettings(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Board Settings
              </DropdownMenuItem>
              {board && (
                <DropdownMenuItem asChild>
                  <div className="p-0">
                    <BoardExport board={board} canvasRef={canvasRef as React.RefObject<HTMLDivElement>} />
                  </div>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleExportPng}>
                <Download className="h-4 w-4 mr-2 text-blue-500" />
                Export as PNG
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* Auto Layout */}
              <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Auto Layout
              </div>
              {([
                { alg: 'dagre-tb' as LayoutAlgorithm, label: '↓ Top → Bottom', icon: '↓' },
                { alg: 'dagre-lr' as LayoutAlgorithm, label: '→ Left → Right', icon: '→' },
                { alg: 'dagre-bt' as LayoutAlgorithm, label: '↑ Bottom → Top', icon: '↑' },
                { alg: 'dagre-rl' as LayoutAlgorithm, label: '← Right → Left', icon: '←' },
                { alg: 'grid'     as LayoutAlgorithm, label: '⊞ Grid',          icon: '⊞' },
                { alg: 'radial'   as LayoutAlgorithm, label: '◎ Radial',        icon: '◎' },
              ]).map(({ alg, label }) => (
                <DropdownMenuItem key={alg} onClick={() => handleAutoLayout(alg)} className="gap-2 text-xs">
                  <Network className="h-3.5 w-3.5 text-violet-500" />
                  {label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowShortcuts(true)}>
                <Keyboard className="h-4 w-4 mr-2" />
                Keyboard Shortcuts
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      {/* Filter Bar */}
      {showFilterBar && board && (
        <div className="px-4 py-2 border-b bg-card/80 backdrop-blur shrink-0 z-40">
          <NodeFilterBar
            availableTags={Array.from(new Set(board.nodes.flatMap((n) => n.tags)))}
            selectedTags={filterTags}
            onTagsChange={setFilterTags}
            searchQuery={filterSearch}
            onSearchChange={setFilterSearch}
          />
        </div>
      )}

      {/* Canvas → Builder synthesis prompt banner */}
      {!synthDismissed && board.nodes.length >= 10 && (
        <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-violet-500/5 border-violet-500/20 shrink-0 z-40">
          <Sparkles className="h-4 w-4 shrink-0 text-violet-600" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-foreground">
              {board.nodes.length} research nodes — ready to synthesise?
            </span>
            <span className="text-xs text-muted-foreground ml-1.5">
              Turn your canvas insights into a fundable startup artifact.
            </span>
          </div>
          <Link href="/builder">
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs font-semibold text-violet-600 hover:bg-violet-500/10 shrink-0">
              Open Builder <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
          <button
            onClick={() => { setSynthDismissed(true); localStorage.setItem(synthDismissKey, 'true'); }}
            className="p-1 rounded-md hover:bg-muted/60 text-muted-foreground/50 hover:text-muted-foreground transition-colors shrink-0"
            title="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Canvas + AI sidebar row */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
      {/* Canvas */}
      <div
        ref={canvasRef}
        className={cn(
          'flex-1 relative overflow-hidden cursor-grab',
          isPanning && 'cursor-grabbing',
          activeTool === 'hand' && 'cursor-grab',
          (activeTool === 'note' || activeTool === 'connect') && 'cursor-crosshair',
          (['shape_rect','shape_circle','shape_diamond','shape_triangle','shape_line','shape_arrow','shape_text','mermaid'] as Tool[]).includes(activeTool) && 'cursor-crosshair',
          connectionStart && 'cursor-crosshair',
        )}
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--foreground) / ${showGrid ? '0.12' : '0.06'}) 1px, transparent 1px)`,
          backgroundSize: `${32 * zoom}px ${32 * zoom}px`,
          backgroundPosition: `${pan.x % (32 * zoom)}px ${pan.y % (32 * zoom)}px`,
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={(e) => {
          handleCanvasMouseMove(e);
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) {
            const worldX = (e.clientX - rect.left - pan.x) / zoom;
            const worldY = (e.clientY - rect.top - pan.y) / zoom;
            emitCursor(worldX, worldY);
            // Track temp connection endpoint
            if (connectionStart) {
              setTempConnectionEnd({ x: worldX, y: worldY });
            }
          }
        }}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onContextMenu={(e) => handleContextMenu(e)}
      >
        {/* ─── Canvas Draw Toolbar (floating, left side — fixed to viewport) ── */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-40 pointer-events-auto">
          <CanvasDrawToolbar
            activeTool={activeTool}
            onToolChange={(t) => setActiveTool(t as Tool)}
            onToggleLibrary={() => setShowShapeLibrary((p) => !p)}
            libraryOpen={showShapeLibrary}
          />
        </div>

        {/* ─── Shape Library Panel ──────────────────────────────────────── */}
        {showShapeLibrary && (
          <ShapeLibraryPanel
            onClose={() => setShowShapeLibrary(false)}
            onAddShape={(tpl: ShapeTemplate) => {
              const cx = (window.innerWidth / 2 - pan.x) / zoom;
              const cy = (window.innerHeight / 2 - pan.y) / zoom;
              createNodeMutation.mutate({
                type: tpl.type,
                title: tpl.defaultTitle,
                content: '',
                posX: cx - tpl.defaultWidth / 2,
                posY: cy - tpl.defaultHeight / 2,
                width: tpl.defaultWidth,
                height: tpl.defaultHeight,
                metadata: tpl.meta as Record<string, unknown>,
              });
            }}
          />
        )}

        {/* Transform container */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          {/* Connector lines */}
          <ResearchConnectorLines
            connectors={board.connectors}
            nodes={board.nodes}
            onDeleteConnector={(id) => deleteConnectorMutation.mutate(id)}
          />

          {/* Temp connection line while drawing */}
          {connectionStart && tempConnectionEnd && (() => {
            const fromNode = board.nodes.find((n) => n.id === connectionStart);
            if (!fromNode) return null;
            const fx = fromNode.posX + fromNode.width / 2;
            const fy = fromNode.posY + (fromNode.height || 200) / 2;
            const tx = tempConnectionEnd.x;
            const ty = tempConnectionEnd.y;
            return (
              <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
                <line
                  x1={fx} y1={fy} x2={tx} y2={ty}
                  stroke="#10B981"
                  strokeWidth="2"
                  strokeDasharray="6,4"
                  opacity="0.7"
                />
                <circle cx={tx} cy={ty} r="5" fill="#10B981" opacity="0.5" />
              </svg>
            );
          })()}

          {/* Group frames (render below nodes) */}
          {groups.map((group) => (
            <ResearchGroupFrame
              key={group.id}
              group={group}
              isSelected={selectedGroupId === group.id}
              onSelect={() => { setSelectedGroupId(group.id); setSelectedNodeIds(new Set()); }}
              onDragStart={(e) => handleGroupDragStart(group.id, e)}
              onResizeStart={(e, dir) => handleGroupResizeStart(group.id, e, dir)}
              onUpdate={(data) => updateGroup(group.id, data)}
              onDelete={() => deleteGroup(group.id)}
            />
          ))}

          {/* Nodes */}
          {filteredNodes.map((node) => (
            <ResearchNodeCard
              key={node.id}
              node={node}
              isSelected={selectedNodeIds.has(node.id)}
              isDragging={draggingNodeId === node.id}
              onSelect={(e?: React.MouseEvent) => {
                if (connectionStart) {
                  handleCompleteConnection(node.id);
                } else if (e?.shiftKey) {
                  setSelectedNodeIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(node.id)) next.delete(node.id); else next.add(node.id);
                    return next;
                  });
                } else {
                  setSelectedNodeIds(new Set([node.id]));
                }
              }}
              onDragStart={(e) => handleNodeDragStart(node.id, e)}
              onDoubleClick={() => setViewingNode(node)}
              onUpdate={(data) => updateNodeMutation.mutate({ nodeId: node.id, data })}
              onResizeStart={(e, dir) => handleNodeResizeStart(node.id, e, dir)}
              onDelete={() => deleteNodeMutation.mutate(node.id)}
              onCommentClick={() => setCommentsNodeId(node.id)}
              onContextMenu={(e) => { e.stopPropagation(); handleContextMenu(e, node.id); }}
            />
          ))}
        </div>

        {/* Box selection rectangle */}
        {selectionBox && (
          <div
            className="absolute border-2 border-dashed border-primary bg-primary/10 pointer-events-none z-20"
            style={{
              left: `${Math.min(selectionBox.startX, selectionBox.currentX) * zoom + pan.x}px`,
              top: `${Math.min(selectionBox.startY, selectionBox.currentY) * zoom + pan.y}px`,
              width: `${Math.abs(selectionBox.currentX - selectionBox.startX) * zoom}px`,
              height: `${Math.abs(selectionBox.currentY - selectionBox.startY) * zoom}px`,
            }}
          />
        )}

        {/* Connection mode indicator */}
        {connectionStart && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/90 text-white text-xs font-medium shadow-lg backdrop-blur-sm">
              <GitBranch className="h-3.5 w-3.5" />
              Click a node to connect · Press Esc to cancel
            </div>
          </div>
        )}

        {/* Live cursors */}
        <LiveCursors collaborators={collaborators} pan={pan} zoom={zoom} />

        {/* MiniMap */}
        {showMiniMap && board && (
          <div className="absolute bottom-4 right-4 pointer-events-auto z-40">
            <BoardMiniMap
              nodes={board.nodes}
              pan={pan}
              zoom={zoom}
              viewportWidth={canvasRef.current?.clientWidth ?? window.innerWidth}
              viewportHeight={canvasRef.current?.clientHeight ?? window.innerHeight}
              onNavigate={setPan}
            />
          </div>
        )}

        {/* Comments Panel */}
        {commentsNodeId && currentUser && (
          <div className="absolute top-4 left-4 z-40 pointer-events-auto" style={{ width: 340 }}>
            <CommentsPanel
              nodeId={commentsNodeId}
              nodeTitle={board?.nodes.find((n) => n.id === commentsNodeId)?.title}
              currentUserId={currentUser.id}
              onClose={() => setCommentsNodeId(null)}
            />
          </div>
        )}

        {/* Drop zone overlay */}
        {isDragOver && (
          <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center bg-primary/5 backdrop-blur-[2px] transition-all duration-200">
            <div className="bg-card/95 border-2 border-dashed border-primary rounded-2xl p-10 text-center shadow-2xl">
              <Upload className="h-14 w-14 text-primary mx-auto mb-4 animate-bounce" />
              <p className="text-lg font-semibold">Drop files here</p>
              <p className="text-sm text-muted-foreground mt-1">PDFs, images, documents, screenshots</p>
            </div>
          </div>
        )}

        {/* Bottom status bar */}
        <div className="absolute bottom-0 inset-x-0 h-7 bg-card/80 backdrop-blur-sm border-t border-border/50 flex items-center justify-between px-3 z-30 pointer-events-none select-none">
          <span className="text-[10px] text-muted-foreground/70 tabular-nums">
            {Math.round(zoom * 100)}% · {board.nodes.length} node{board.nodes.length !== 1 ? 's' : ''}
            {board.connectors.length > 0 && ` · ${board.connectors.length} connection${board.connectors.length !== 1 ? 's' : ''}`}
            {selectedNodeIds.size > 0 && ` · ${selectedNodeIds.size} selected`}
            {connectionStart && ' · Drawing connection…'}
            {groups.length > 0 && ` · ${groups.length} group${groups.length !== 1 ? 's' : ''}`}
            {snapToGrid && ' · ⊞ Snap'}
          </span>
          <span className="text-[10px] text-muted-foreground/50 tabular-nums">
            {history.length > 0 && `History: ${historyIndex + 1}/${history.length} · `}
            Scroll to zoom · Drag to pan · ? for shortcuts
          </span>
        </div>
      </div>

      {/* Canvas Copilot Panel — sidebar */}
      {showAIPanel && (
        <CanvasCopilotPanel
          boardId={boardId}
          nodes={board.nodes}
          selectedNodeIds={Array.from(selectedNodeIds)}
          onClose={() => setShowAIPanel(false)}
          onCreateNodes={(newNodes) => {
            for (const n of newNodes) {
              const isMermaidNode = n.type === 'mermaid_diagram';
              const isFlowNode    = n.type === 'flow_diagram';
              const isBoard       = n.type === 'whiteboard';
              createNodeMutation.mutate({
                type: n.type as ResearchNodeType,
                title: n.title,
                content: n.content,
                posX: n.posX,
                posY: n.posY,
                width:  isMermaidNode ? 420 : isFlowNode ? 560 : isBoard ? 600 : 280,
                height: isMermaidNode ? 320 : isFlowNode ? 360 : isBoard ? 420 : 200,
              });
            }
          }}
        />
      )}

      {/* Board Summary Panel — sidebar */}
      {showBoardSummary && (
        <BoardSummaryPanel
          boardId={boardId}
          boardTitle={board.title}
          nodes={board.nodes}
          onClose={() => setShowBoardSummary(false)}
        />
      )}
      </div>{/* end flex row */}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt,.md"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            handleFileUpload(e.target.files);
            e.target.value = '';
          }
        }}
      />

      {/* Node viewer popup */}
      {viewingNode && (
        <ResearchNodeViewer
          node={viewingNode}
          onClose={() => setViewingNode(null)}
          onUpdate={(data) => {
            updateNodeMutation.mutate({ nodeId: viewingNode.id, data });
            setViewingNode({ ...viewingNode, ...data });
          }}
        />
      )}

      {/* Entity reference selector */}
      <EntityReferenceSelector
        open={showEntitySelector}
        onClose={() => setShowEntitySelector(false)}
        onSelect={(entity) => {
          createNodeMutation.mutate({
            type: 'reference',
            title: entity.title,
            content: JSON.stringify({
              entityType: entity.type,
              entityId: entity.id,
              subtitle: entity.subtitle,
              avatarUrl: entity.avatarUrl,
            }),
            posX: (window.innerWidth / 2 - pan.x) / zoom,
            posY: (window.innerHeight / 2 - pan.y) / zoom,
          });
        }}
      />

      {/* Board settings dialog */}
      {currentUser && (
        <BoardSettingsPanel
          board={board}
          open={showBoardSettings}
          onClose={() => setShowBoardSettings(false)}
          currentUserId={currentUser.id}
        />
      )}
      {/* Right-click Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-[70] w-52 bg-card border border-border rounded-lg shadow-xl overflow-hidden py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.nodeId ? (
            <>
              <button
                onClick={() => { const n = board?.nodes.find((nd) => nd.id === contextMenu.nodeId); if (n) setViewingNode(n); setContextMenu(null); }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-secondary transition-colors flex items-center gap-2"
              >
                <Eye className="w-4 h-4" /> Open
              </button>
              <button
                onClick={() => { if (contextMenu.nodeId) { setSelectedNodeIds(new Set([contextMenu.nodeId])); duplicateSelected(); } setContextMenu(null); }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-secondary transition-colors flex items-center gap-2"
              >
                <Copy className="w-4 h-4" /> Duplicate
              </button>
              <button
                onClick={() => { if (contextMenu.nodeId) { setConnectionStart(contextMenu.nodeId); setActiveTool('connect'); } setContextMenu(null); }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-secondary transition-colors flex items-center gap-2"
              >
                <GitBranch className="w-4 h-4" /> Connect from here
              </button>
              <button
                onClick={() => { if (contextMenu.nodeId) setCommentsNodeId(contextMenu.nodeId); setContextMenu(null); }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-secondary transition-colors flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> Comments
              </button>
              <div className="h-px bg-border my-1" />
              <button
                onClick={() => { if (contextMenu.nodeId) { const n = board?.nodes.find((nd) => nd.id === contextMenu.nodeId); if (n && !n.locked) deleteNodeMutation.mutate(contextMenu.nodeId); } setContextMenu(null); }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </>
          ) : (
            <>
              {/* Quick-access node types for right-click */}
              {[
                { type: 'note' as ResearchNodeType, label: 'Note', icon: StickyNote, color: '#F59E0B' },
                { type: 'document' as ResearchNodeType, label: 'Document', icon: FileText, color: '#3B82F6' },
                { type: 'pitch_deck' as ResearchNodeType, label: 'Pitch Deck', icon: Presentation, color: '#EC4899' },
                { type: 'business_plan' as ResearchNodeType, label: 'Business Plan', icon: ClipboardList, color: '#7C3AED' },
                { type: 'financial_model' as ResearchNodeType, label: 'Financial Model', icon: Calculator, color: '#16A34A' },
                { type: 'meeting_notes' as ResearchNodeType, label: 'Meeting Notes', icon: Calendar, color: '#0E7490' },
                { type: 'checklist' as ResearchNodeType, label: 'Checklist', icon: CheckSquare, color: '#0D9488' },
                { type: 'task' as ResearchNodeType, label: 'Task', icon: ListTodo, color: '#F97316' },
                { type: 'contract' as ResearchNodeType, label: 'Contract', icon: Scale, color: '#DC2626' },
                { type: 'wireframe' as ResearchNodeType, label: 'Wireframe', icon: PenTool, color: '#2563EB' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    onClick={() => {
                      const rect = canvasRef.current?.getBoundingClientRect();
                      if (rect) {
                        const x = (contextMenu.x - rect.left - pan.x) / zoom;
                        const y = (contextMenu.y - rect.top - pan.y) / zoom;
                        createNodeMutation.mutate({ type: item.type, title: `New ${item.label}`, content: getDefaultContent(item.type), posX: x, posY: y, width: 280, height: 200 });
                      }
                      setContextMenu(null);
                    }}
                    className="w-full px-3 py-1.5 text-sm text-left hover:bg-secondary transition-colors flex items-center gap-2"
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: item.color }} /> {item.label}
                  </button>
                );
              })}
              <div className="h-px bg-border my-1" />
              <button
                onClick={() => { fileInputRef.current?.click(); setContextMenu(null); }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-secondary transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> Upload File
              </button>
              <div className="h-px bg-border my-1" />
              <button
                onClick={() => {
                  const rect = canvasRef.current?.getBoundingClientRect();
                  if (rect) {
                    const x = (contextMenu.x - rect.left - pan.x) / zoom;
                    const y = (contextMenu.y - rect.top - pan.y) / zoom;
                    createGroup(x, y);
                  }
                  setContextMenu(null);
                }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-secondary transition-colors flex items-center gap-2"
              >
                <Grid3X3 className="w-4 h-4 text-blue-500" /> Create Group Frame
              </button>
              <button
                onClick={() => {
                  const rect = canvasRef.current?.getBoundingClientRect();
                  if (rect) {
                    const x = (contextMenu.x - rect.left - pan.x) / zoom;
                    const y = (contextMenu.y - rect.top - pan.y) / zoom;
                    createNodeMutation.mutate({ type: 'note' as ResearchNodeType, title: '', content: '', posX: x, posY: y, width: 200, height: 200, color: '#F59E0B', metadata: { isSticky: true } });
                  }
                  setContextMenu(null);
                }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-secondary transition-colors flex items-center gap-2"
              >
                <StickyNote className="w-4 h-4 text-amber-500" /> Add Sticky Note
              </button>
              <div className="h-px bg-border my-1" />
              <button
                onClick={() => { if (board) setSelectedNodeIds(new Set(board.nodes.map((n) => n.id))); setContextMenu(null); }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-secondary transition-colors flex items-center gap-2"
              >
                <Layers className="w-4 h-4" /> Select All
              </button>
              <button
                onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); setContextMenu(null); }}
                className="w-full px-3 py-2 text-sm text-left hover:bg-secondary transition-colors flex items-center gap-2"
              >
                <Maximize2 className="w-4 h-4" /> Reset View
              </button>
            </>
          )}
        </div>
      )}

      {/* Keyboard Shortcuts Dialog */}
      {showShortcuts && (
        <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-primary" />
                Keyboard Shortcuts
              </h2>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowShortcuts(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
              {[
                { keys: ['Ctrl/⌘', 'Z'], desc: 'Undo' },
                { keys: ['Ctrl/⌘', 'Y'], desc: 'Redo' },
                { keys: ['Ctrl/⌘', 'A'], desc: 'Select all' },
                { keys: ['Ctrl/⌘', 'D'], desc: 'Duplicate selection' },
                { keys: ['Delete'], desc: 'Delete selection' },
                { keys: ['Shift', 'Click'], desc: 'Multi-select' },
                { keys: ['Shift', 'Drag'], desc: 'Box select' },
                { keys: ['Arrow keys'], desc: 'Move selected (1px)' },
                { keys: ['Shift', 'Arrow'], desc: 'Move selected (10px)' },
                { keys: ['Scroll'], desc: 'Zoom in/out' },
                { keys: ['Ctrl/⌘', '0'], desc: 'Reset view' },
                { keys: ['Esc'], desc: 'Clear selection' },
                { keys: ['V'], desc: 'Select tool' },
                { keys: ['N'], desc: 'Note tool' },
                { keys: ['C'], desc: 'Connect tool' },
                { keys: ['G'], desc: 'Toggle snap-to-grid' },
                { keys: ['F'], desc: 'Fit all nodes in view' },
                { keys: ['Shift', 'G'], desc: 'Create group frame' },
                { keys: ['S'], desc: 'Add sticky note' },
                { keys: ['?'], desc: 'Show shortcuts' },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                  <span className="text-sm text-muted-foreground">{s.desc}</span>
                  <div className="flex items-center gap-1">
                    {s.keys.map((k, j) => (
                      <kbd key={j} className="px-2 py-1 text-[11px] font-mono bg-secondary border border-border rounded">
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </>}

      {/* Canvas Version Panel (Snapshots + Versions + Branches) */}
      <CanvasVersionPanel
        open={showHistoryDrawer}
        onClose={() => setShowHistoryDrawer(false)}
        boardId={boardId}
        boardTitle={board?.title}
      />
      </div>
    </div>
  );
}
