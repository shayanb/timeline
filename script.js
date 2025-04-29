// Interactive Timeline Script
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Semantic UI components
  if (window.$ && $.fn.dropdown) {
    $('.ui.dropdown').dropdown();
  }
  const form = document.getElementById('event-form');
  const titleInput = document.getElementById('title');
  const startInput = document.getElementById('start-date');
  const endInput = document.getElementById('end-date');
  const typeInput = document.getElementById('event-type');
  const colorInput = document.getElementById('color');
  const metadataInput = document.getElementById('metadata');
  const importFile = document.getElementById('import-file');
  const importBtn = document.getElementById('import-btn');
  importBtn.addEventListener('click', () => importFile.click());
  const exportButton = document.getElementById('export-yaml');
  const timelineDiv = document.getElementById('timeline');
  const tooltip = d3.select('#tooltip');

  let events = [];
  let nextId = 1;

  // Generate a random hex color for new entries
  function randomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  }

  // Toggle end-date field based on event type
  typeInput.addEventListener('change', () => {
    if (typeInput.value === 'range') {
      endInput.disabled = false;
      endInput.setAttribute('required', '');
    } else {
      endInput.disabled = true;
      endInput.removeAttribute('required');
    }
  });

  // Import events via YAML file input
  importFile.addEventListener('change', e => {
    const file = importFile.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = jsyaml.load(reader.result);
        events = data.map(ev => {
          const type = ev.type || (ev.life_event ? 'life' : 'range');
          const start = new Date(ev.start);
          const end = (type === 'range') ? new Date(ev.end) : new Date(ev.start);
          const color = ev.color || randomColor();
          const metadata = ev.metadata || '';
          return { id: nextId++, title: ev.title, start, end, type, color, metadata };
        });
        update();
        colorInput.value = randomColor();
      } catch (err) {
        alert('Error parsing YAML: ' + err);
      }
    };
    reader.readAsText(file);
    importFile.value = '';
  });

  // Export current events to YAML file download
  exportButton.addEventListener('click', () => {
    const exportData = events.map(d => {
      const ev = { title: d.title, start: d.start.toISOString().slice(0, 10) };
      if (d.type === 'range') ev.end = d.end.toISOString().slice(0, 10);
      ev.type = d.type;
      if (d.color) ev.color = d.color;
      if (d.metadata) ev.metadata = d.metadata;
      return ev;
    });
    const yamlStr = jsyaml.dump(exportData);
    const blob = new Blob([yamlStr], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'events_export.yaml';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  // Load predefined events from data/events.yaml
  fetch('data/events.yaml')
    .then(res => res.text())
    .then(text => {
      const data = jsyaml.load(text);
      data.forEach(ev => {
        const type = ev.type || (ev.life_event ? 'life' : 'range');
        const start = new Date(ev.start);
        const end = (type === 'range') ? new Date(ev.end) : new Date(ev.start);
        const color = ev.color || randomColor();
        const metadata = ev.metadata || '';
        events.push({ id: nextId++, title: ev.title, start, end, type, color, metadata });
      });
      update();
      colorInput.value = randomColor();
    })
    .catch(err => console.error('Error loading events.yaml:', err));

  // Handle manual event submissions
  form.addEventListener('submit', e => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const start = new Date(startInput.value);
    const type = typeInput.value;
    const end = (type === 'range') ? new Date(endInput.value) : new Date(startInput.value);
    const color = colorInput.value;
    const metadata = metadataInput.value.trim();
    if (type === 'range' && end < start) {
      alert('End date must be on or after start date.');
      return;
    }
    events.push({ title, start, end, type, color, metadata });
    form.reset();
    colorInput.value = randomColor();
    update();
  });

  // Main rendering function
  function update() {
    d3.select(timelineDiv).selectAll('*').remove();
    if (!events.length) return;

    const margin = { top: 40, right: 20, bottom: 30, left: 50 };
    const width = timelineDiv.clientWidth || 800;
    const rowHeight = 30;
    const barHeight = 20;

    const bars = events.filter(d => d.type === 'range');
    const lines = events.filter(d => d.type === 'life');
    const milestones = events.filter(d => d.type === 'milestone');
    const height = margin.top + margin.bottom + bars.length * rowHeight;

    const minTime = d3.min(events, d => d.start);
    const maxTime = d3.max(events, d => d.end);

    const x = d3.scaleTime()
      .domain([minTime, maxTime])
      .range([margin.left, width - margin.right]);

    const svg = d3.select(timelineDiv)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    // Row background stripes
    svg.selectAll('rect.row-bg')
      .data(bars)
      .enter()
      .append('rect')
      .attr('class', 'row-bg')
      .attr('x', margin.left)
      .attr('y', (d, i) => margin.top + i * rowHeight)
      .attr('width', width - margin.left - margin.right)
      .attr('height', rowHeight)
      .attr('fill', (d, i) => (i % 2 ? '#f9f9f9' : '#e9e9e9'));

    // X Axis
    const xAxis = d3.axisBottom(x)
      .ticks(Math.min(events.length * 5, 10))
      .tickSizeOuter(0);
    const xAxisG = svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(xAxis);

    // Range bars with transitions
    const barSel = svg.selectAll('rect.bar')
      .data(bars, d => d.id);
    // Exit
    barSel.exit()
      .transition().duration(300)
      .attr('width', 0)
      .remove();
    // Enter
    const barEnter = barSel.enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('rx', barHeight / 2)
      .attr('ry', barHeight / 2)
      .attr('x', d => x(d.start))
      .attr('y', (d, i) => margin.top + i * rowHeight)
      .attr('height', barHeight)
      .attr('width', 0)
      .attr('fill', d => d.color)
      .on('mouseover', (event, d) => {
        tooltip.style('opacity', 1)
          .html(`<strong>${d.title}</strong><br>${d.metadata || ''}` +
                `<br>${d.start.toDateString()} – ${d.end.toDateString()}`);
      })
      .on('mousemove', event => {
        tooltip.style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY + 10}px`);
      })
      .on('mouseout', () => tooltip.style('opacity', 0));
    barEnter.transition().duration(600)
      .attr('width', d => Math.max(1, x(d.end) - x(d.start)));
    // Update
    barSel.transition().duration(600)
      .attr('x', d => x(d.start))
      .attr('y', (d, i) => margin.top + i * rowHeight)
      .attr('width', d => Math.max(1, x(d.end) - x(d.start)))
      .attr('fill', d => d.color);

    // Bar labels
    svg.selectAll('text.label')
      .data(bars)
      .join('text')
      .attr('class', 'label')
      .attr('x', d => x(d.start) + 5)
      .attr('y', (d, i) => margin.top + i * rowHeight + barHeight / 2 + 4)
      .text(d => d.title)
      .attr('fill', '#fff')
      .attr('font-size', '12px')
      .attr('pointer-events', 'none');

    // Life event lines
    svg.selectAll('line.life-line')
      .data(lines)
      .join('line')
      .attr('class', 'life-line')
      .attr('stroke-linecap', 'round')
      .attr('x1', d => x(d.start))
      .attr('x2', d => x(d.start))
      .attr('y1', margin.top - 5)
      .attr('y2', height - margin.bottom)
      .attr('stroke', d => d.color)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,2');

    // Life labels
    svg.selectAll('text.life-label')
      .data(lines)
      .join('text')
      .attr('class', 'life-label')
      .attr('x', d => x(d.start) + 5)
      .attr('y', margin.top - 10)
      .text(d => d.title)
      .attr('fill', d => d.color)
      .attr('font-size', '12px')
      .attr('pointer-events', 'none');

    // Milestones
    const axisY = height - margin.bottom;
    svg.selectAll('circle.milestone-marker')
      .data(milestones)
      .join('circle')
      .attr('class', 'milestone-marker')
      .attr('cx', d => x(d.start))
      .attr('cy', axisY)
      .attr('r', 6)
      .attr('fill', d => d.color)
      .on('mouseover', (event, d) => {
        tooltip.style('display', 'block')
          .html(`<strong>${d.title}</strong><br>${d.metadata || ''}<br>${d.start.toDateString()}`);
      })
      .on('mousemove', event => {
        tooltip.style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY + 10}px`);
      })
      .on('mouseout', () => tooltip.style('display', 'none'));

    svg.selectAll('text.milestone-label')
      .data(milestones)
      .join('text')
      .attr('class', 'milestone-label')
      .attr('x', d => x(d.start) + 5)
      .attr('y', axisY - 10)
      .text(d => d.title)
      .attr('fill', d => d.color)
      .attr('font-size', '12px')
      .attr('pointer-events', 'none');

    // Zoom & Pan
    const zoom = d3.zoom()
      .scaleExtent([0.5, 10])
      .translateExtent([[margin.left, 0], [width - margin.right, height]])
      .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
      .on('zoom', ({ transform }) => {
        const zx = transform.rescaleX(x);
        xAxisG.call(d3.axisBottom(zx).ticks(Math.min(events.length * 5, 10)));
        svg.selectAll('rect.bar')
          .attr('x', d => zx(d.start))
          .attr('width', d => Math.max(1, zx(d.end) - zx(d.start)));
        svg.selectAll('text.label')
          .attr('x', d => zx(d.start) + 5);
        svg.selectAll('line.life-line')
          .attr('x1', d => zx(d.start))
          .attr('x2', d => zx(d.start));
        svg.selectAll('text.life-label')
          .attr('x', d => zx(d.start) + 5);
        svg.selectAll('circle.milestone-marker')
          .attr('cx', d => zx(d.start));
        svg.selectAll('text.milestone-label')
          .attr('x', d => zx(d.start) + 5);
      });
    svg.call(zoom);
  }
});