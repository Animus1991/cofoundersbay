import { describe, expect, it } from 'vitest';
import { demoLibrary } from '../demo/learning-world';
import { LEARNING_STRINGS, learningCategoryEl } from './strings-learning';

const GREEK = /[Ͱ-Ͽ]/;

describe('the learning hub strings', () => {
  it('give every key both languages', () => {
    for (const [key, pair] of Object.entries(LEARNING_STRINGS)) {
      expect(pair.en.trim(), `${key} (en)`).not.toBe('');
      expect(pair.el.trim(), `${key} (el)`).not.toBe('');
    }
  });

  it('name every format a resource can have, the page-only guide included', () => {
    for (const type of ['article', 'video', 'course', 'podcast', 'book', 'tool', 'template', 'guide']) {
      expect(LEARNING_STRINGS[`type_${type}`], type).toBeDefined();
    }
  });
});

describe('learningCategoryEl', () => {
  it('names each topic of the sample library in Greek, so no chip in a Greek row stays English', () => {
    const topics = [...new Set(demoLibrary().flatMap((resource) => (resource.category ? [resource.category] : [])))];
    expect(topics.length).toBeGreaterThan(3);
    for (const topic of topics) expect(learningCategoryEl(topic), topic).toMatch(GREEK);
  });

  it('leaves a topic the library invents as it was written', () => {
    expect(learningCategoryEl('Quantum Gardening')).toBe('Quantum Gardening');
  });
});
