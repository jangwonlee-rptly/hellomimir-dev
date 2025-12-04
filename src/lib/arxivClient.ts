import type { ArxivPaper } from "@/types";

const ARXIV_BASE_URL =
  process.env.ARXIV_BASE_URL || "http://export.arxiv.org/api/query";

// Rate limiting: track last request time
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 3000; // 3 seconds between requests

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();
  return fetch(url);
}

// Parse arXiv Atom XML entry to ArxivPaper
function parseAtomEntry(entryXml: string): ArxivPaper | null {
  try {
    // Extract ID (e.g., http://arxiv.org/abs/2301.01234v1 -> 2301.01234)
    const idMatch = entryXml.match(/<id>([^<]+)<\/id>/);
    if (!idMatch) return null;
    const fullId = idMatch[1];
    const arxivId = fullId.replace(/^.*\/abs\//, "").replace(/v\d+$/, "");

    // Extract title ([\s\S] matches any character including newlines)
    const titleMatch = entryXml.match(/<title>([\s\S]*?)<\/title>/);
    const title = titleMatch
      ? titleMatch[1].replace(/\s+/g, " ").trim()
      : "Untitled";

    // Extract abstract (summary)
    const summaryMatch = entryXml.match(/<summary>([\s\S]*?)<\/summary>/);
    const abstract = summaryMatch
      ? summaryMatch[1].replace(/\s+/g, " ").trim()
      : "";

    // Extract authors
    const authorMatches = entryXml.matchAll(/<author>\s*<name>([^<]+)<\/name>/g);
    const authors: string[] = [];
    for (const match of authorMatches) {
      authors.push(match[1].trim());
    }

    // Extract categories
    const categoryMatches = entryXml.matchAll(
      /<category[^>]*term="([^"]+)"[^>]*\/>/g
    );
    const categories: string[] = [];
    for (const match of categoryMatches) {
      categories.push(match[1]);
    }

    // Extract published date
    const publishedMatch = entryXml.match(/<published>([^<]+)<\/published>/);
    const publishedAt = publishedMatch
      ? new Date(publishedMatch[1])
      : new Date();

    // Build PDF URL
    const pdfUrl = `https://arxiv.org/pdf/${arxivId}.pdf`;

    return {
      arxivId,
      title,
      abstract,
      authors,
      categories,
      publishedAt,
      pdfUrl,
    };
  } catch (error) {
    console.error("Error parsing arXiv entry:", error);
    return null;
  }
}

// Parse full Atom feed to extract all entries
function parseAtomFeed(xml: string): ArxivPaper[] {
  const papers: ArxivPaper[] = [];

  // Split by entry tags
  const entryMatches = xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g);

  for (const match of entryMatches) {
    const paper = parseAtomEntry(match[1]);
    if (paper) {
      papers.push(paper);
    }
  }

  return papers;
}

// Build query URL for arXiv API
function buildQueryUrl(arxivQuery: string, maxResults: number = 40): string {
  const params = new URLSearchParams({
    search_query: arxivQuery,
    sortBy: "submittedDate",
    sortOrder: "descending",
    max_results: maxResults.toString(),
  });

  return `${ARXIV_BASE_URL}?${params.toString()}`;
}

// Fetch papers from arXiv for a given query
export async function fetchArxivPapers(
  arxivQuery: string,
  maxResults: number = 40
): Promise<ArxivPaper[]> {
  const url = buildQueryUrl(arxivQuery, maxResults);

  try {
    const response = await rateLimitedFetch(url);

    if (!response.ok) {
      throw new Error(`arXiv API error: ${response.status} ${response.statusText}`);
    }

    const xml = await response.text();
    const papers = parseAtomFeed(xml);

    console.log(`Fetched ${papers.length} papers from arXiv for query: ${arxivQuery}`);

    return papers;
  } catch (error) {
    console.error("Error fetching from arXiv:", error);
    throw error;
  }
}

// Filter out papers that have already been used
export function filterUnusedPapers(
  papers: ArxivPaper[],
  usedArxivIds: string[]
): ArxivPaper[] {
  const usedSet = new Set(usedArxivIds);
  return papers.filter((paper) => !usedSet.has(paper.arxivId));
}

// Select the newest paper from a list
export function selectNewestPaper(papers: ArxivPaper[]): ArxivPaper | null {
  if (papers.length === 0) return null;

  // Papers should already be sorted by date descending from arXiv
  // But let's ensure we get the newest one
  return papers.reduce((newest, current) =>
    current.publishedAt > newest.publishedAt ? current : newest
  );
}
