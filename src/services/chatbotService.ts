// src/services/chatbotService.ts
import { type ChatbotContextData } from '../hooks/useModulePermissions';
import {
  ERP_ENDPOINTS,
  matchEndpoint,
  fetchErpData,
  askAi,                 // ← ADD
  askAiWithErpContext,   // ← ADD
  type ErpEndpoint,
  type ChatMessage,      // ← ADD (AI chat message type)
} from './erpApi';
import {
  findPage,
  getPagesByModule,
  getPageCountByModule,
  getTotalPageCount,
  getAllModules,
} from './pageRegistry';
// ============================================================
// TYPES
// ============================================================
export interface ChatbotRequest {
  message: string;
  userContext: ChatbotContextData;
  currentModule?: string;
  currentPage?: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
}

export interface ChatbotResponse {
  reply: string;
  source: 'api' | 'local' | 'page';
  error?: string;
}

// ============================================================
// HELPERS
// ============================================================
const normalize = (s: string) => s.toLowerCase().trim();

function formatApiReply(ep: ErpEndpoint, count: number | undefined, data: any): string {
  const label = ep.label;

  if (count === undefined) {
    return `✅ Fetched **${label}** successfully, but couldn't detect a count in the response.`;
  }

  let reply = `📊 You have **${count}** ${label.toLowerCase()}.`;

  const list: any[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.items)
        ? data.items
        : [];

  if (list.length > 0) {
    const preview = list.slice(0, 5).map((row) => {
      const name =
        row.name ||
        row.title ||
        row.item_name ||
        row.item_code ||
        row.customer_name ||
        row.supplier_name ||
        row.id;
      return `• ${name ?? JSON.stringify(row).slice(0, 60)}`;
    });
    reply += `\n\nLatest ${Math.min(5, list.length)}:\n${preview.join('\n')}`;
    if (list.length > 5) reply += `\n…and ${list.length - 5} more.`;
  }

  return reply;
}

// ============================================================
// PAGE QUESTIONS
// ============================================================
function answerPageQuestion(question: string): string | null {
  const q = normalize(question);

  // Total page count
  if (
    (q.includes('how many') && q.includes('page')) ||
    q.includes('total page') ||
    q.includes('page count') ||
    q.includes('number of page')
  ) {
    const total = getTotalPageCount();
    const counts = getPageCountByModule();
    const breakdown = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([mod, n]) => `• ${mod}: ${n}`)
      .join('\n');
    return `📄 Total **${total}** pages across your app.\n\nBy module:\n${breakdown}`;
  }

  // List all modules
  if (
    q.includes('list all module') ||
    q.includes('what modules') ||
    q.includes('how many module')
  ) {
    const mods = getAllModules();
    return `There are **${mods.length}** modules:\n${mods.map((m) => `• ${m}`).join('\n')}`;
  }

  // List pages of a module
  if (
    (q.includes('list') || q.includes('show') || q.includes('what')) &&
    q.includes('page')
  ) {
    const mods = getAllModules();
    const found = mods.find((m) => q.includes(m));
    if (found) {
      const pages = getPagesByModule(found);
      if (pages.length === 0) return `No pages found for the **${found}** module.`;
      return `**${found}** has ${pages.length} pages:\n${pages
        .map((p) => `• ${p.name} — \`${p.path}\``)
        .join('\n')}`;
    }
  }

  // Where is X?
  if (
    q.includes('is there') ||
    q.includes('where is') ||
    q.includes('find') ||
    q.includes('navigate') ||
    q.includes('go to') ||
    (q.includes('show me') && q.includes('page'))
  ) {
    const page = findPage(question);
    if (page) {
      return `✅ Yes — **${page.name}** exists.\nPath: \`${page.path}\`\nModule: ${page.module}`;
    }
  }

  // Which module has X?
  const page = findPage(question);
  if (page && (q.includes('which module') || q.includes('what module'))) {
    return `**${page.name}** belongs to the **${page.module}** module.`;
  }

  // Generic lookup
  if (page && (q.includes('page') || q.includes('form'))) {
    return `**${page.name}**\nPath: \`${page.path}\`\nModule: ${page.module}`;
  }

  return null;
}

// ============================================================
// MODULE PERMISSIONS SUMMARY
// ============================================================
function answerAboutModules(ctx: ChatbotContextData): string | null {
  if (ctx.totalModules === 0) return null;
  const list = ctx.modules
    .map(
      (m) =>
        `• ${m.moduleName} — ${m.submodules.length} submodule${
          m.submodules.length === 1 ? '' : 's'
        }`
    )
    .join('\n');
  return `You have access to **${ctx.totalModules}** modules:\n${list}`;
}

// ============================================================
// MAIN ASK
// ============================================================
async function ask(req: ChatbotRequest): Promise<ChatbotResponse> {
  const q = normalize(req.message);

  // Greeting
  if (/^(hi|hello|hey|hii)\b/.test(q)) {
    return {
      source: 'local',
      reply:
        `Hello ${req.userContext.user.name || 'there'}! 👋\n` +
        `I can answer about **pages**, **modules**, and fetch **live ERP data**.\n\n` +
        `Try:\n• "How many pages do I have?"\n• "List sales pages"\n• "Where is Work Order?"\n• "How many sales orders?"`,
    };
  }

  // Help
  if (q === 'help' || q.includes('what can you do')) {
    return {
      source: 'local',
      reply:
        `I can help with:\n` +
        `• **Pages** — "How many pages?", "List sales pages", "Where is BOM?"\n` +
        `• **Modules** — "How many modules do I have?"\n` +
        `• **Live ERP data** — "How many sales orders?", "Show items", "Lead count"\n` +
        `• **Anything else** — general questions, explanations, writing help, etc. (powered by AI)`,
    };
  }

  // PAGE QUESTIONS
  const pageAnswer = answerPageQuestion(req.message);
  if (pageAnswer) return { source: 'page', reply: pageAnswer };

  // MODULE permissions
  if (
    (q.includes('how many') && q.includes('module')) ||
    q.includes('list my module')
  ) {
    const reply = answerAboutModules(req.userContext);
    if (reply) return { source: 'local', reply };
  }

  // Who am I
  if (q.includes('my role') || q.includes('who am i')) {
    const { name, role, email } = req.userContext.user;
    return {
      source: 'local',
      reply: `You are **${name || 'User'}**${
        role ? `, role: **${role}**` : ''
      }${email ? `\nEmail: ${email}` : ''}.`,
    };
  }

  // LIVE API DATA
  const endpoint = matchEndpoint(req.message);
  if (endpoint) {
    const result = await fetchErpData(endpoint.url);

    if (!result.ok) {
      if (result.status === 401) {
        return {
          source: 'api',
          reply: `⚠️ I couldn't fetch ${endpoint.label} because your session expired. Please log in again.`,
          error: result.error,
        };
      }
      return {
        source: 'api',
        reply: `❌ I tried to fetch **${endpoint.label}** but ran into a problem:\n_${result.error}_`,
        error: result.error,
      };
    }

    return {
      source: 'api',
      reply: formatApiReply(endpoint, result.count, result.data),
    };
  }

  // ============================================================
  // AI FALLBACK — for anything not covered above
  // This is where the chatbot can now answer ANY question.
  // ============================================================
  console.log('🤖 Falling back to AI for:', req.message);

  const history: ChatMessage[] = (req.history ?? []).map((h) => ({
    role: h.role === 'assistant' ? 'assistant' : 'user',
    content: h.content,
  }));

  // If the question mentions an ERP module, askAiWithErpContext will
  // also pull live data first and pass it to the AI as context.
  const aiResult = await askAiWithErpContext(req.message, history);

  if (aiResult.ok && aiResult.reply) {
    return { source: 'api', reply: aiResult.reply };
  }

  // AI failed — give a helpful fallback message
  return {
    source: 'api',
    reply:
      `🤖 I couldn't reach the AI service. ${aiResult.error ?? ''}\n\n` +
      `Try asking:\n` +
      `• "How many sales orders?"\n` +
      `• "What is a BOM?"\n` +
      `• "Write a short email to a supplier"`,
    error: aiResult.error,
  };
}

// ============================================================
// SUGGESTIONS
// ============================================================
function getSuggestions(_currentModule?: string): string[] {
  return [
    'How many pages do I have?',
    'List sales pages',
    'Where is Work Order?',
    'How many sales orders?',
  ];
}

export const chatbotService = { ask, getSuggestions };