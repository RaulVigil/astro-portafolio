import type { APIRoute } from 'astro';
import { blogConfig } from '../../data';
import { getPosts, postUrl } from '../../lib/blog';

const xmlEscapes: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' };
const escape = (value: string) => value.replace(/[<>&'"]/g, (char) => xmlEscapes[char]);

export const GET: APIRoute = async ({ site }) => {
  const posts = await getPosts();
  const blogUrl = new URL('/blog/', site).href;
  const feedUrl = new URL('/blog/rss.xml', site).href;

  const items = posts
    .map((post) => {
      const url = new URL(postUrl(post), site).href;
      return `    <item>
      <title>${escape(post.data.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escape(post.data.description)}</description>
      <pubDate>${post.data.pubDate.toUTCString()}</pubDate>
${post.data.tags.map((tag) => `      <category>${escape(tag)}</category>`).join('\n')}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(blogConfig.name)}</title>
    <link>${blogUrl}</link>
    <description>${escape(blogConfig.description)}</description>
    <language>es</language>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
${posts[0] ? `    <lastBuildDate>${posts[0].data.pubDate.toUTCString()}</lastBuildDate>\n` : ''}${items}
  </channel>
</rss>
`;

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
