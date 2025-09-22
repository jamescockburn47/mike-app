import { Controller, Get, Query } from '@nestjs/common';
import Parser from 'rss-parser';

const parser = new Parser();

const DEFAULT_FEEDS: Record<string, string[]> = {
  tech: [
    'https://www.theverge.com/rss/index.xml',
    'https://www.wired.com/feed/rss',
  ],
  world: [
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
  ],
  business: [
    'https://feeds.bbci.co.uk/news/business/rss.xml',
    'https://www.ft.com/rss/home',
  ],
};

async function fetchFeeds(topics: string[]) {
  const urls = topics.flatMap((t) => DEFAULT_FEEDS[t] || []);
  const items: any[] = [];
  for (const url of urls) {
    try {
      const feed = await parser.parseURL(url);
      items.push(
        ...feed.items.slice(0, 5).map((i) => ({
          title: i.title,
          link: i.link,
          isoDate: i.isoDate,
          source: feed.title,
        }))
      );
    } catch {
      // ignore feed errors
    }
  }
  // simple de-dupe by title
  const seen = new Set<string>();
  const deduped = items.filter((i) => {
    const key = (i.title || '') as string;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return deduped.slice(0, 10);
}

@Controller('news')
export class NewsController {
  @Get('headlines')
  async headlines(@Query('topics') topics?: string) {
    const topicList = (topics ? topics.split(',') : ['world']).map((t) => t.trim());
    const items = await fetchFeeds(topicList);
    return { topics: topicList, items };
  }

  @Get('summaries')
  async summaries(@Query('topics') topics?: string) {
    const topicList = (topics ? topics.split(',') : ['world']).map((t) => t.trim());
    const items = await fetchFeeds(topicList);
    // placeholder summaries (no LLM yet)
    const summaries = items.map((i) => ({
      title: i.title,
      summary: `Headline: ${i.title}`,
      link: i.link,
      source: i.source,
    }));
    return { topics: topicList, summaries };
  }
}


