import { parse } from 'parse5';
import type { DefaultTreeAdapterTypes } from 'parse5';

type Element = DefaultTreeAdapterTypes.Element;
type Node = DefaultTreeAdapterTypes.Node;
type ParentNode = DefaultTreeAdapterTypes.ParentNode;
type TextNode = DefaultTreeAdapterTypes.TextNode;

export type MapLanguage = 'he' | 'en' | 'yi';

export type ExtractedMapMetadata = {
  title?: string;
  blurb?: string;
  sefariaRef?: string;
  sugyaCount?: number;
  language?: MapLanguage;
  /** True when any of the required fields (title, blurb, sefariaRef, language) is missing. */
  incomplete: boolean;
  /** Names of required fields that could not be extracted. */
  missing: string[];
};

const REQUIRED_FIELDS = ['title', 'blurb', 'sefariaRef', 'language'] as const;

export function extractMapMetadata(input: string | Buffer | Uint8Array): ExtractedMapMetadata {
  const html = typeof input === 'string' ? input : Buffer.from(input).toString('utf8');

  const doc = parse(html);
  const htmlEl = findElement(doc, (el) => el.tagName === 'html');

  const titleEl = findElement(doc, (el) => el.tagName === 'title');
  const title = titleEl ? textOf(titleEl).trim() || undefined : undefined;

  const descMeta = findElement(
    doc,
    (el) => el.tagName === 'meta' && attr(el, 'name')?.toLowerCase() === 'description',
  );
  const refMeta = findElement(
    doc,
    (el) => el.tagName === 'meta' && attr(el, 'name')?.toLowerCase() === 'chazarah:sefaria-ref',
  );
  const takeawayEl = findElement(
    doc,
    (el) => hasClass(el, 'takeaway') || attr(el, 'data-takeaway') != null,
  );

  const blurb =
    nonEmpty(attr(descMeta, 'content')?.trim()) ??
    (takeawayEl ? nonEmpty(textOf(takeawayEl).trim()) : undefined);

  const sefariaRef = nonEmpty(attr(refMeta, 'content')?.trim());

  const sugyaEls = findAllElements(
    doc,
    (el) => attr(el, 'data-sugya') != null || hasClass(el, 'sugya'),
  );
  const sugyaCount = sugyaEls.length > 0 ? sugyaEls.length : undefined;

  const langAttr = attr(htmlEl, 'lang')?.trim().toLowerCase();
  const language = normalizeLanguage(langAttr) ?? inferLanguageFromText(title);

  const missing = REQUIRED_FIELDS.filter((field) => {
    const value = { title, blurb, sefariaRef, language }[field];
    return value == null || value === '';
  });

  return {
    title,
    blurb,
    sefariaRef,
    sugyaCount,
    language,
    incomplete: missing.length > 0,
    missing,
  };
}

function normalizeLanguage(raw: string | undefined): MapLanguage | undefined {
  if (!raw) return undefined;
  const base = raw.split('-')[0];
  if (base === 'he' || base === 'iw') return 'he';
  if (base === 'en') return 'en';
  if (base === 'yi' || base === 'ji') return 'yi';
  return undefined;
}

function inferLanguageFromText(text: string | undefined): MapLanguage | undefined {
  if (!text) return undefined;
  if (/[֐-׿]/.test(text)) return 'he';
  if (/[A-Za-z]/.test(text)) return 'en';
  return undefined;
}

function nonEmpty(s: string | undefined): string | undefined {
  return s == null || s === '' ? undefined : s;
}

function isElement(node: Node): node is Element {
  return 'tagName' in node && typeof (node as Element).tagName === 'string';
}

function isParent(node: Node): node is ParentNode {
  return 'childNodes' in node && Array.isArray((node as ParentNode).childNodes);
}

function attr(el: Element | undefined, name: string): string | undefined {
  if (!el || !el.attrs) return undefined;
  const found = el.attrs.find((a) => a.name === name);
  return found?.value;
}

function hasClass(el: Element, cls: string): boolean {
  const classAttr = attr(el, 'class');
  if (!classAttr) return false;
  return classAttr.split(/\s+/).includes(cls);
}

function findElement(root: Node, predicate: (el: Element) => boolean): Element | undefined {
  if (isElement(root) && predicate(root)) return root;
  if (isParent(root)) {
    for (const child of root.childNodes) {
      const found = findElement(child, predicate);
      if (found) return found;
    }
  }
  return undefined;
}

function findAllElements(root: Node, predicate: (el: Element) => boolean): Element[] {
  const out: Element[] = [];
  const walk = (node: Node) => {
    if (isElement(node) && predicate(node)) out.push(node);
    if (isParent(node)) {
      for (const child of node.childNodes) walk(child);
    }
  };
  walk(root);
  return out;
}

function textOf(node: Node): string {
  if (isTextNode(node)) return node.value;
  if (isParent(node)) {
    return node.childNodes.map(textOf).join('');
  }
  return '';
}

function isTextNode(node: Node): node is TextNode {
  return (node as TextNode).nodeName === '#text';
}
