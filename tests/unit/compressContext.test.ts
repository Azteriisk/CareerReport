import { describe, it, expect } from 'vitest';
import { compressContext } from '../../src/app/api/ai/generate/route';

describe('compressContext algorithm', () => {
  it('strips images, ids, and urls correctly', () => {
    const input = {
      basics: {
        name: 'Alec',
        image: 'data:image/jpeg;base64,....',
        url: 'https://alec.com'
      },
      work: [{ id: '123', position: 'Dev' }]
    };
    
    const output = compressContext(input);
    expect(output.basics.name).toBe('Alec');
    expect(output.basics.image).toBeUndefined();
    expect(output.basics.url).toBeUndefined();
    expect(output.work[0].id).toBeUndefined();
    expect(output.work[0].position).toBe('Dev');
  });

  it('removes empty strings, arrays, and objects recursively', () => {
    const input = {
      valid: 'hello',
      emptyString: '   ',
      emptyArray: [],
      emptyObject: {},
      nestedEmpty: {
        deeper: {
          empty: ''
        }
      }
    };
    
    const output = compressContext(input);
    expect(output).toEqual({ valid: 'hello' });
  });

  it('preserves text fidelity without stripping grammatical stop words', () => {
    const input = {
      short: 'Hello world',
      long: 'This is a long string that has the words and or but in it for testing purposes.'
    };
    
    const output = compressContext(input);
    expect(output.short).toBe('Hello world');
    expect(output.long).toBe('This is a long string that has the words and or but in it for testing purposes.');
  });
});
