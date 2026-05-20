import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { defaultResume } from '../../src/lib/default-resume';
import { TemplateModern } from '../../src/components/TemplateModern';
import { TemplateClassic } from '../../src/components/TemplateClassic';
import { TemplateMinimal } from '../../src/components/TemplateMinimal';
import { TemplateModernSplit } from '../../src/components/TemplateModernSplit';

/** Assert that core resume fields appear in the rendered output. */
function assertCoreContent(container: HTMLElement) {
  expect(container.textContent).toContain(defaultResume.basics.name);
  expect(container.textContent).toContain(defaultResume.basics.label);
  expect(container.textContent).toContain(defaultResume.work[0].name);
  expect(container.textContent).toContain(defaultResume.work[0].position);
  expect(container.textContent).toContain(defaultResume.education[0].institution);
}

describe('TemplateModern', () => {
  it('renders without crashing', () => {
    expect(() => render(<TemplateModern data={defaultResume} />)).not.toThrow();
  });

  it('renders core resume content', () => {
    const { container } = render(<TemplateModern data={defaultResume} />);
    assertCoreContent(container);
  });

  it('renders skills section', () => {
    const { container } = render(<TemplateModern data={defaultResume} />);
    expect(container.textContent).toContain(defaultResume.skills[0].name);
  });

  it('does not render headshot img when image is empty', () => {
    const data = { ...defaultResume, basics: { ...defaultResume.basics, image: '' } };
    render(<TemplateModern data={data} />);
    const imgs = document.querySelectorAll('img[alt="Headshot"]');
    expect(imgs.length).toBe(0);
  });
});

describe('TemplateClassic', () => {
  it('renders without crashing', () => {
    expect(() => render(<TemplateClassic data={defaultResume} />)).not.toThrow();
  });

  it('renders core resume content including label', () => {
    const { container } = render(<TemplateClassic data={defaultResume} />);
    assertCoreContent(container);
  });
});

describe('TemplateMinimal', () => {
  it('renders without crashing', () => {
    expect(() => render(<TemplateMinimal data={defaultResume} />)).not.toThrow();
  });

  it('renders core resume content with full name', () => {
    const { container } = render(<TemplateMinimal data={defaultResume} />);
    assertCoreContent(container);
  });
});

describe('TemplateModernSplit', () => {
  it('renders without crashing', () => {
    expect(() => render(<TemplateModernSplit data={defaultResume} />)).not.toThrow();
  });

  it('renders core resume content', () => {
    const { container } = render(<TemplateModernSplit data={defaultResume} />);
    assertCoreContent(container);
  });
});
