import { getCollection, type CollectionEntry } from 'astro:content';
import { blogConfig } from '../data';

export type Post = CollectionEntry<'blog'>;
export type Tag = { name: string; slug: string; count: number };

const WORDS_PER_MINUTE = 200;
const MAX_META_TITLE = 60;

/** Artículos ordenados del más reciente al más antiguo. En dev incluye borradores. */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export const postUrl = (post: Post) => `/blog/${post.id}/`;
export const tagUrl = (tag: string) => `/blog/tags/${tagSlug(tag)}/`;

export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getTags(posts: Post[]): Tag[] {
  const tags = new Map<string, Tag>();
  for (const post of posts) {
    for (const name of post.data.tags) {
      const slug = tagSlug(name);
      const tag = tags.get(slug) ?? { name, slug, count: 0 };
      tag.count++;
      tags.set(slug, tag);
    }
  }
  return [...tags.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Artículos que comparten más tags con `post`; desempata por fecha. */
export function getRelatedPosts(post: Post, posts: Post[], limit = 3): Post[] {
  const tags = new Set(post.data.tags.map(tagSlug));
  return posts
    .filter((p) => p.id !== post.id)
    .map((p) => ({ p, score: p.data.tags.filter((t) => tags.has(tagSlug(t))).length }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.p.data.pubDate.valueOf() - a.p.data.pubDate.valueOf())
    .slice(0, limit)
    .map(({ p }) => p);
}

export function wordCount(markdown = ''): number {
  return markdown.split(/\s+/).filter(Boolean).length;
}

export function readingTime(markdown = ''): number {
  return Math.max(1, Math.round(wordCount(markdown) / WORDS_PER_MINUTE));
}

/** Añade la marca al <title> solo si cabe en el límite de la SERP. */
export function metaTitle(title: string): string {
  const branded = `${title} | ${blogConfig.name}`;
  return branded.length <= MAX_META_TITLE ? branded : title;
}

// `z.coerce.date()` interpreta "2026-10-21" como medianoche UTC: formatear en UTC
// evita que en America/El_Salvador (UTC-6) se muestre el día anterior.
const dateFormat = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const formatDate = (date: Date) => dateFormat.format(date);
export const isoDate = (date: Date) => date.toISOString().slice(0, 10);
