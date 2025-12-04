"""
arXiv API client for fetching academic papers
"""
import re
import time
from typing import List, Optional
from datetime import datetime
import httpx

from app.core.config import settings
from app.core.logging import get_logger
from app.db.models import ArxivPaper

logger = get_logger(__name__)


class ArxivService:
    """Service for interacting with arXiv API"""

    def __init__(self):
        self.base_url = settings.arxiv_base_url
        self.rate_limit_seconds = settings.arxiv_rate_limit_seconds
        self.last_request_time = 0.0

    async def _rate_limited_fetch(self, url: str) -> str:
        """Fetch URL with rate limiting"""
        now = time.time()
        time_since_last = now - self.last_request_time

        if time_since_last < self.rate_limit_seconds:
            wait_time = self.rate_limit_seconds - time_since_last
            logger.debug(f"Rate limiting: waiting {wait_time:.2f}s")
            time.sleep(wait_time)

        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(url)
            response.raise_for_status()
            self.last_request_time = time.time()
            return response.text

    def _parse_atom_entry(self, entry_xml: str) -> Optional[ArxivPaper]:
        """Parse arXiv Atom XML entry to ArxivPaper"""
        try:
            # Extract ID
            id_match = re.search(r"<id>([^<]+)</id>", entry_xml)
            if not id_match:
                return None
            full_id = id_match.group(1)
            arxiv_id = re.sub(r"^.*/abs/", "", full_id)
            arxiv_id = re.sub(r"v\d+$", "", arxiv_id)

            # Extract title
            title_match = re.search(r"<title>([\s\S]*?)</title>", entry_xml)
            title = re.sub(r"\s+", " ", title_match.group(1)).strip() if title_match else "Untitled"

            # Extract abstract
            summary_match = re.search(r"<summary>([\s\S]*?)</summary>", entry_xml)
            abstract = re.sub(r"\s+", " ", summary_match.group(1)).strip() if summary_match else ""

            # Extract authors
            author_matches = re.finditer(r"<author>\s*<name>([^<]+)</name>", entry_xml)
            authors = [match.group(1).strip() for match in author_matches]

            # Extract categories
            category_matches = re.finditer(r'<category[^>]*term="([^"]+)"[^>]*/>', entry_xml)
            categories = [match.group(1) for match in category_matches]

            # Extract published date
            published_match = re.search(r"<published>([^<]+)</published>", entry_xml)
            published_at = datetime.fromisoformat(published_match.group(1).replace("Z", "+00:00")) if published_match else datetime.now()

            # Build PDF URL
            pdf_url = f"https://arxiv.org/pdf/{arxiv_id}.pdf"

            return ArxivPaper(
                arxiv_id=arxiv_id,
                title=title,
                abstract=abstract,
                authors=authors,
                categories=categories,
                published_at=published_at,
                pdf_url=pdf_url,
            )
        except Exception as e:
            logger.error(f"Error parsing arXiv entry: {e}")
            return None

    def _parse_atom_feed(self, xml: str) -> List[ArxivPaper]:
        """Parse full Atom feed to extract all entries"""
        papers: List[ArxivPaper] = []
        entry_matches = re.finditer(r"<entry>([\s\S]*?)</entry>", xml)

        for match in entry_matches:
            paper = self._parse_atom_entry(match.group(1))
            if paper:
                papers.append(paper)

        return papers

    def _build_query_url(self, arxiv_query: str, max_results: int = 50) -> str:
        """Build query URL for arXiv API"""
        params = {
            "search_query": arxiv_query,
            "sortBy": "submittedDate",
            "sortOrder": "descending",
            "max_results": str(max_results),
        }
        param_str = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{self.base_url}?{param_str}"

    async def fetch_papers(self, arxiv_query: str, max_results: int = 50) -> List[ArxivPaper]:
        """
        Fetch papers from arXiv for a given query

        Args:
            arxiv_query: arXiv search query (e.g., "cat:cs.LG")
            max_results: Maximum number of results to fetch

        Returns:
            List of ArxivPaper objects
        """
        url = self._build_query_url(arxiv_query, max_results)
        logger.info(f"Fetching papers from arXiv: {arxiv_query}")

        try:
            xml = await self._rate_limited_fetch(url)
            papers = self._parse_atom_feed(xml)
            logger.info(f"Fetched {len(papers)} papers from arXiv")
            return papers
        except Exception as e:
            logger.error(f"Error fetching from arXiv: {e}")
            raise

    def filter_unused_papers(self, papers: List[ArxivPaper], used_arxiv_ids: List[str]) -> List[ArxivPaper]:
        """Filter out papers that have already been used"""
        used_set = set(used_arxiv_ids)
        return [paper for paper in papers if paper.arxiv_id not in used_set]

    def select_newest_paper(self, papers: List[ArxivPaper]) -> Optional[ArxivPaper]:
        """Select the newest paper from a list"""
        if not papers:
            return None
        return max(papers, key=lambda p: p.published_at)


# Global arXiv service instance
arxiv_service = ArxivService()
