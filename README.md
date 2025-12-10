# D3 Vector - DNA Visualization

A D3.js-based circular DNA plasmid visualization tool that displays features with directional arrows and labels.

## Features

- Circular plasmid visualization
- Feature arrows with orientation (sense/antisense)
- Interactive labels with dogleg connectors
- Scalable coordinates based on plasmid length
- PNG export functionality

## Example

![pVEC123 Vector Visualization](pVEC123_vector.png)

*Example visualization of pVEC123 plasmid (12,500 bp) with various features including promoter, coding region, terminator, origin, and resistance markers.*

## Usage

1. Open `src/index.html` in a web browser
2. The visualization loads data from `src/data/example_circular.json`
3. Click "Download PNG" to export the visualization

## Data Format

The JSON data file should contain:
- `name`: Plasmid name
- `length`: Total plasmid length in base pairs
- `features`: Array of feature objects with:
  - `start`: Start coordinate
  - `stop`: End coordinate
  - `name`: Feature name
  - `orientation`: "sense" or "antisense"

## Technologies

- D3.js v7
- HTML5 Canvas for image export
