import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as d3 from 'd3';

const PlasmidVisualization = forwardRef(({ 
    data, 
    width, 
    height
}, ref) => {
    const svgRef = useRef(null);
    const containerRef = useRef(null);

    const handleDownload = () => {
        if (!svgRef.current || !data) return;

        const svgElement = svgRef.current;
        
        // Get the bounding box of all content
        const bbox = svgElement.getBBox();
        const padding = 20; // Small amount of whitespace
        
        // Create canvas with size based on content
        const canvasWidth = bbox.width + (padding * 2);
        const canvasHeight = bbox.height + (padding * 2);
        
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = function() {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            // Draw with offset to crop to content + padding
            ctx.drawImage(img, -bbox.x + padding, -bbox.y + padding);
            URL.revokeObjectURL(url);
            
            canvas.toBlob(function(blob) {
                const link = document.createElement('a');
                link.download = data.name + '_vector.png';
                link.href = URL.createObjectURL(blob);
                link.click();
            });
        };
        img.src = url;
    };

    // Expose handleDownload to parent component via ref
    useImperativeHandle(ref, () => ({
        handleDownload
    }));

    useEffect(() => {
        if (!data || !svgRef.current || !width || !height) return;

        // Clear previous visualization
        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3.select(svgRef.current);

        // Enforce a square-ish aspect ratio for the vector itself
        // Calculate effective dimensions based on aspect ratio
        const targetAspectRatio = 1; // width / height = 1
        let effectiveWidth, effectiveHeight;
        
        if (width / height > targetAspectRatio) {
            // Width is too large, constrain by height
            effectiveHeight = height;
            effectiveWidth = height * targetAspectRatio;
        } else {
            // Height is too large, constrain by width
            effectiveWidth = width;
            effectiveHeight = width / targetAspectRatio;
        }

        // Calculate scale factor based on effective dimensions
        const referenceSize = 800; // reference dimension
        const scaleFactor = Math.min(effectiveWidth, effectiveHeight) / referenceSize;

        // Center the visualization within the available space
        const offsetX = (width - effectiveWidth) / 2;
        const offsetY = (height - effectiveHeight) / 2;

        // Add a circle in the middle of the page
        const innerRadius = Math.min(effectiveWidth, effectiveHeight) * 0.30; // inner radius for features
        const radius = innerRadius + 15; // outer circle radius (same distance outside)
        const centerX = offsetX + effectiveWidth / 2;
        const centerY = offsetY + effectiveHeight / 2;
        
        svg.append('circle')
            .attr('cx', centerX)
            .attr('cy', centerY)
            .attr('r', radius)
            .attr('fill', 'none')
            .attr('stroke', '#000')
            .attr('stroke-width', 3);

        // Add second concentric circle
        svg.append('circle')
            .attr('cx', centerX)
            .attr('cy', centerY)
            .attr('r', radius + 15)
            .attr('fill', 'none')
            .attr('stroke', '#000')
            .attr('stroke-width', 3);

        // Add tick marks every 100bp between the two circles
        const tickInterval = 100; // bp
        const numTicks = Math.floor(data.length / tickInterval);
        for (let i = 0; i < numTicks; i++) {
            const bpPosition = i * tickInterval;
            const fraction = bpPosition / data.length;
            const angle = fraction * 2 * Math.PI - Math.PI / 2; // Starting from top
            
            const innerX = centerX + radius * Math.cos(angle);
            const innerY = centerY + radius * Math.sin(angle);
            const outerX = centerX + (radius + 15) * Math.cos(angle);
            const outerY = centerY + (radius + 15) * Math.sin(angle);
            
            svg.append('line')
                .attr('x1', innerX)
                .attr('y1', innerY)
                .attr('x2', outerX)
                .attr('y2', outerY)
                .attr('stroke', '#000')
                .attr('stroke-width', 1.5);
        }

        const textScale = 2.25;

        // Add name text
        svg.append('text')
            .attr('x', centerX)
            .attr('y', centerY + 20 * scaleFactor)
            .attr('text-anchor', 'middle')
            .attr('font-size', (20 * scaleFactor * textScale) + 'px')
            .attr('font-family', 'Arial, Helvetica, sans-serif')
            .text(data.name);

        // Add length text
        svg.append('text')
            .attr('x', centerX)
            .attr('y', centerY - 20 * scaleFactor)
            .attr('text-anchor', 'middle')
            .attr('font-size', (20 * scaleFactor * textScale) + 'px')
            .attr('font-family', 'Arial, Helvetica, sans-serif')
            .text(data.length + ' bp');

        // Draw features as arrows around the circle
        const arcRadius = innerRadius; // Position of the feature arrows (inside the circle now)
        
        // Find the longest label to scale font size appropriately
        const longestLabel = data.features.reduce((max, feature) => 
            feature.name.length > max.length ? feature.name : max, '');
        
        // Estimate available space for labels (horizontal space from circle edge to effective viewport edge)
        const availableLabelSpace = Math.min(
            centerX - radius - (80 * scaleFactor) - offsetX, // left side
            offsetX + effectiveWidth - centerX - radius - (80 * scaleFactor) // right side
        );
        
        // Estimate text width (rough approximation: 0.6 * fontSize * numCharacters)
        const baseLabelFontSize = 30 * scaleFactor;
        const estimatedTextWidth = baseLabelFontSize * 0.6 * longestLabel.length;
        
        // Calculate label font scale factor
        const labelFontScale = estimatedTextWidth > availableLabelSpace 
            ? availableLabelSpace / estimatedTextWidth 
            : 1;
        const labelFontSize = baseLabelFontSize * labelFontScale * textScale;

        // Match center text size to label text size
        svg.selectAll('text')
            .filter(function() {
                const textContent = d3.select(this).text();
                return textContent === data.name || textContent === data.length + ' bp';
            })
            .attr('font-size', labelFontSize + 'px')
            .attr('y', function() {
                const textContent = d3.select(this).text();
                const offset = labelFontSize;
                return textContent === data.name ? centerY + offset : centerY - offset;
            });
        
        const labelInfos = [];

        const labelAreaTop = 20 * scaleFactor;
        const labelAreaBottom = height - 20 * scaleFactor;
        const minLabelSpacing = Math.max(12 * scaleFactor, labelFontSize * 1.25);

        const resolveLabelCollisions = (labels) => {
            if (labels.length === 0) return;

            labels.sort((a, b) => a.desiredY - b.desiredY);

            labels[0].y = Math.max(labels[0].desiredY, labelAreaTop);
            for (let i = 1; i < labels.length; i++) {
                labels[i].y = Math.max(labels[i].desiredY, labels[i - 1].y + minLabelSpacing);
            }

            let overflow = labels[labels.length - 1].y - labelAreaBottom;
            if (overflow > 0) {
                for (let i = 0; i < labels.length; i++) {
                    labels[i].y -= overflow;
                }
                for (let i = labels.length - 2; i >= 0; i--) {
                    labels[i].y = Math.min(labels[i].y, labels[i + 1].y - minLabelSpacing);
                }
                const underflow = labelAreaTop - labels[0].y;
                if (underflow > 0) {
                    for (let i = 0; i < labels.length; i++) {
                        labels[i].y += underflow;
                    }
                }
            }
        };

        // Function to draw an arrow for a feature
        function drawFeatureArrow(feature, index) {
            // Calculate angles based on start and stop positions (starting from top, going counter-clockwise)
            const startFraction = feature.start / data.length;
            const stopFraction = feature.stop / data.length;
            const startAngleRaw = startFraction * 2 * Math.PI; // Counter-clockwise from top
            const stopAngleRaw = stopFraction * 2 * Math.PI;

            // Fixed arrowhead size for all features
            const arrowSize = 12;
            const arrowBaseDistance = arrowSize * 0.4;
            const arrowBaseDistanceWide = arrowBaseDistance * 1.5; // 50% wider for arrowhead and perpendicular line
            
            // Calculate how much angle the arrowhead takes up
            const arrowAngleDelta = arrowSize / (arcRadius * 2 * Math.PI) * 2 * Math.PI;

            // Arc needs to make room for arrowhead within feature span
            let arcStart, arcEnd;
            if (feature.orientation === 'antisense') {
                // Arrowhead at start, so arc starts after the arrowhead
                arcStart = startAngleRaw + arrowAngleDelta;
                arcEnd = stopAngleRaw;
            } else {
                // Arrowhead at end, so arc ends before the arrowhead
                arcStart = startAngleRaw;
                arcEnd = stopAngleRaw - arrowAngleDelta;
            }
            if (arcEnd <= arcStart) arcEnd += 2 * Math.PI; // ensure positive sweep

            // Create arc path for feature
            const featureArc = d3.arc()
                .innerRadius(arcRadius)
                .outerRadius(arcRadius)
                .startAngle(arcStart)
                .endAngle(arcEnd);

            svg.append('path')
                .attr('d', featureArc)
                .attr('transform', `translate(${centerX}, ${centerY})`)
                .attr('fill', 'none')
                .attr('stroke', '#000')
                .attr('stroke-width', 3);
            
            // Add arrowhead at start or end based on orientation
            // Arrowhead connects to the arc end (sense) or arc start (antisense)
            const arrowAngle = (feature.orientation === 'antisense' ? arcStart : arcEnd) - Math.PI / 2;
            const arcPointX = centerX + arcRadius * Math.cos(arrowAngle);
            const arcPointY = centerY + arcRadius * Math.sin(arrowAngle);
            
            // Tangent direction: sense -> clockwise, antisense -> counterclockwise
            const tangentAngle = arrowAngle + (feature.orientation === 'antisense' ? -Math.PI / 2 : Math.PI / 2);
            const arrowTipX = arcPointX + arrowSize * Math.cos(tangentAngle);
            const arrowTipY = arcPointY + arrowSize * Math.sin(tangentAngle);
            
            const arrowBase1X = arcPointX + arrowBaseDistanceWide * Math.cos(tangentAngle - Math.PI / 3);
            const arrowBase1Y = arcPointY + arrowBaseDistanceWide * Math.sin(tangentAngle - Math.PI / 3);
            const arrowBase2X = arcPointX + arrowBaseDistanceWide * Math.cos(tangentAngle + Math.PI / 3);
            const arrowBase2Y = arcPointY + arrowBaseDistanceWide * Math.sin(tangentAngle + Math.PI / 3);

            // Draw arrowhead lines
            svg.append('line')
                .attr('x1', arrowBase1X)
                .attr('y1', arrowBase1Y)
                .attr('x2', arrowTipX)
                .attr('y2', arrowTipY)
                .attr('stroke', '#000')
                .attr('stroke-width', 2.25);

            svg.append('line')
                .attr('x1', arrowBase2X)
                .attr('y1', arrowBase2Y)
                .attr('x2', arrowTipX)
                .attr('y2', arrowTipY)
                .attr('stroke', '#000')
                .attr('stroke-width', 2.25);
            
            // Connect arc to arrowhead
            svg.append('line')
                .attr('x1', arcPointX)
                .attr('y1', arcPointY)
                .attr('x2', arrowTipX)
                .attr('y2', arrowTipY)
                .attr('stroke', '#000')
                .attr('stroke-width', 2.25);
            
            // Add perpendicular line at the undecorated end
            const undecoratedAngle = (feature.orientation === 'antisense' ? arcEnd : arcStart) - Math.PI / 2;
            const undecoratedX = centerX + arcRadius * Math.cos(undecoratedAngle);
            const undecoratedY = centerY + arcRadius * Math.sin(undecoratedAngle);
            
            // Perpendicular to the arc is the radial direction
            // Make total length = 2 * arrowBaseDistanceWide to match arrowhead base width
            const perp1X = undecoratedX + arrowBaseDistanceWide * Math.cos(undecoratedAngle);
            const perp1Y = undecoratedY + arrowBaseDistanceWide * Math.sin(undecoratedAngle);
            const perp2X = undecoratedX - arrowBaseDistanceWide * Math.cos(undecoratedAngle);
            const perp2Y = undecoratedY - arrowBaseDistanceWide * Math.sin(undecoratedAngle);
            
            svg.append('line')
                .attr('x1', perp1X)
                .attr('y1', perp1Y)
                .attr('x2', perp2X)
                .attr('y2', perp2Y)
                .attr('stroke', '#000')
                .attr('stroke-width', 2.25);
            
            // Capture feature label placement details for collision resolution
            let startForMid = startAngleRaw;
            let stopForMid = stopAngleRaw;
            if (stopForMid < startForMid) stopForMid += 2 * Math.PI; // handle wrap
            const midAngle = ((startForMid + stopForMid) / 2) - Math.PI / 2;
            const labelDistance = radius + 80 * scaleFactor; // Distance from center to label

            // Determine label side based on feature center
            const isRightSide = Math.cos(midAngle) >= 0;

            // Position label with slight curvature-following offset
            const baseOffset = 80 * scaleFactor;
            const curvatureShift = Math.pow(Math.abs(Math.sin(midAngle)), 3) * (180 * scaleFactor);
            let labelX, textAnchor;
            if (isRightSide) {
                // Shift right-side labels slightly left near top/bottom
                labelX = centerX + radius + (baseOffset - curvatureShift);
                textAnchor = 'start';
            } else {
                // Shift left-side labels slightly right near top/bottom
                labelX = centerX - radius - (baseOffset - curvatureShift);
                textAnchor = 'end';
            }
            // Connection point at the middle of the arc (middle of feature)
            const arcMidX = centerX + arcRadius * Math.cos(midAngle);
            const arcMidY = centerY + arcRadius * Math.sin(midAngle);
            
            // First dogleg segment - perpendicular to feature (radial from center)
            const doglegRadius1 = radius + 50 * scaleFactor;
            const dogleg1Y = centerY + doglegRadius1 * Math.sin(midAngle);

            const desiredY = dogleg1Y;
            
            labelInfos.push({
                feature,
                arcMidX,
                arcMidY,
                midAngle,
                baseDoglegRadius: doglegRadius1,
                labelX,
                textAnchor,
                desiredY,
                side: isRightSide ? 'right' : 'left'
            });
        }
        
        // Draw all features
        data.features.forEach((feature, index) => {
            drawFeatureArrow(feature, index);
        });

        const leftLabels = labelInfos.filter(label => label.side === 'left');
        const rightLabels = labelInfos.filter(label => label.side === 'right');

        resolveLabelCollisions(leftLabels);
        resolveLabelCollisions(rightLabels);

        const adjustTopConnectorClearance = (labels) => {
            const minDoglegRadius = radius + 20 * scaleFactor;
            const labelHalfHeight = labelFontSize * 0.6;
            const minClearance = labelFontSize * 0.4;

            const sorted = labels
                .slice()
                .sort((a, b) => (a.y ?? a.desiredY) - (b.y ?? b.desiredY));

            for (let i = 1; i < sorted.length; i++) {
                const label = sorted[i];
                const labelY = label.y ?? label.desiredY;
                if (labelY >= centerY) continue; // only top half

                const above = sorted[i - 1];
                const aboveY = above.y ?? above.desiredY;
                const aboveBottom = aboveY + labelHalfHeight;
                const targetMinY = aboveBottom + minClearance;

                const baseRadius = label.baseDoglegRadius;
                const baseDoglegY = centerY + baseRadius * Math.sin(label.midAngle);

                if (baseDoglegY < targetMinY) {
                    const sinAngle = Math.sin(label.midAngle);
                    if (sinAngle !== 0) {
                        const desiredRadius = (targetMinY - centerY) / sinAngle;
                        const clampedRadius = Math.max(minDoglegRadius, Math.min(baseRadius, desiredRadius));
                        label.connectorRadius = clampedRadius;
                    }
                }
            }
        };

        adjustTopConnectorClearance(leftLabels);
        adjustTopConnectorClearance(rightLabels);

        const drawLabel = (label) => {
            const labelY = label.y ?? label.desiredY;
            const doglegRadius = label.connectorRadius ?? label.baseDoglegRadius;
            const dogleg1X = centerX + doglegRadius * Math.cos(label.midAngle);
            const dogleg1Y = centerY + doglegRadius * Math.sin(label.midAngle);
            const doglegMidX = dogleg1X;
            const verticalDelta = Math.abs(dogleg1Y - labelY);
            const verticalThreshold = Math.max(6 * scaleFactor, minLabelSpacing * 0.25);
            const effectiveLabelY = verticalDelta < verticalThreshold ? dogleg1Y : labelY;
            const doglegMidY = effectiveLabelY;

            // Draw dogleg connector lines
            svg.append('line')
                .attr('x1', label.arcMidX)
                .attr('y1', label.arcMidY)
                .attr('x2', dogleg1X)
                .attr('y2', dogleg1Y)
                .attr('stroke', '#000')
                .attr('stroke-width', 2.25);

            if (Math.abs(dogleg1Y - doglegMidY) > 0.5) {
                svg.append('line')
                    .attr('x1', dogleg1X)
                    .attr('y1', dogleg1Y)
                    .attr('x2', doglegMidX)
                    .attr('y2', doglegMidY)
                    .attr('stroke', '#000')
                    .attr('stroke-width', 2.25);
            }

            svg.append('line')
                .attr('x1', doglegMidX)
                .attr('y1', doglegMidY)
                .attr('x2', label.labelX)
                .attr('y2', doglegMidY)
                .attr('stroke', '#000')
                .attr('stroke-width', 2.25);

            // Add feature name text
            svg.append('text')
                .attr('x', label.labelX + (label.textAnchor === 'start' ? 5 : -5) * scaleFactor)
                .attr('y', doglegMidY)
                .attr('text-anchor', label.textAnchor)
                .attr('dominant-baseline', 'middle')
                .attr('font-size', labelFontSize + 'px')
                .attr('font-family', 'Arial, Helvetica, sans-serif')
                .attr('fill', '#000')
                .text(label.feature.name);
        };

        leftLabels.forEach(drawLabel);
        rightLabels.forEach(drawLabel);

    }, [data, width, height]);

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
            <svg 
                ref={svgRef} 
                width={width} 
                height={height}
            />
        </div>
    );
});

export default PlasmidVisualization;
