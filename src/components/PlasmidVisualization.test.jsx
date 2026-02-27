import React from 'react';
import { render } from '@testing-library/react';
import PlasmidVisualization from './PlasmidVisualization.jsx';

const sampleData = {
  name: 'TEST_PLASMID',
  length: 1000,
  features: [
    { name: 'Feature A', start: 0, stop: 200, orientation: 'sense' },
    { name: 'Feature B', start: 300, stop: 500, orientation: 'antisense' },
    { name: 'Feature C', start: 700, stop: 900, orientation: 'sense' }
  ]
};

describe('PlasmidVisualization', () => {
  it('renders an SVG with two concentric circles', () => {
    const { container } = render(
      <PlasmidVisualization data={sampleData} width={800} height={600} />
    );

    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThanOrEqual(2);
  });

  it('renders center text for name and length', () => {
    const { container } = render(
      <PlasmidVisualization data={sampleData} width={800} height={600} />
    );

    const texts = Array.from(container.querySelectorAll('text')).map(el => el.textContent);
    expect(texts).toContain('TEST_PLASMID');
    expect(texts).toContain('1000 bp');
  });

  it('renders connector lines and labels for features', () => {
    const { container } = render(
      <PlasmidVisualization data={sampleData} width={800} height={600} />
    );

    const labels = Array.from(container.querySelectorAll('text')).map(el => el.textContent);
    expect(labels).toContain('Feature A');
    expect(labels).toContain('Feature B');
    expect(labels).toContain('Feature C');

    const lines = container.querySelectorAll('line');
    expect(lines.length).toBeGreaterThan(0);
  });
});
