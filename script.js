// Interactive Timeline Script
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('event-form');
  const titleInput = document.getElementById('title');
  const startInput = document.getElementById('start-date');
  const endInput = document.getElementById('end-date');
  const colorInput = document.getElementById('color');
  const metadataInput = document.getElementById('metadata');
  const timelineDiv = document.getElementById('timeline');
  const tooltip = d3.select('#tooltip');

  let events = [];

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const start = new Date(startInput.value);
    const end = new Date(endInput.value);
    const color = colorInput.value;
    const metadata = metadataInput.value.trim();
    if (end < start) {
      alert('End date must be on or after start date.');
      return;
    }
    events.push({ title, start, end, color, metadata });
    form.reset();
    colorInput.value = '#1f77b4';
    update();
  });

  function update() {
    // Clear previous content
    d3.select(timelineDiv).selectAll('*').remove();
    if (events.length === 0) {
      return;
    }
    // Dimensions
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const containerWidth = timelineDiv.clientWidth || 800;
    const rowHeight = 30;
    const barHeight = 20;
    const gap = 10;
    const width = containerWidth;
    const height = margin.top + margin.bottom + events.length * rowHeight;

    // Time scale
    const minTime = d3.min(events, d => d.start);
    const maxTime = d3.max(events, d => d.end);
    const x = d3.scaleTime()
      .domain([minTime, maxTime])
      .range([margin.left, width - margin.right]);

    // SVG container
    const svg = d3.select(timelineDiv)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // X Axis
    const xAxis = d3.axisBottom(x)
      .ticks(Math.min(events.length * 5, 10))
      .tickSizeOuter(0);
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(xAxis);

    // Bars
    svg.selectAll('rect.bar')
      .data(events)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.start))
      .attr('y', (d, i) => margin.top + i * rowHeight)
      .attr('width', d => Math.max(1, x(d.end) - x(d.start)))
      .attr('height', barHeight)
      .attr('fill', d => d.color)
      .on('mouseover', function(event, d) {
        tooltip
          .style('display', 'block')
          .html(`<strong>${d.title}</strong><br>${d.metadata || ''}<br>${d.start.toDateString()} – ${d.end.toDateString()}`);
      })
      .on('mousemove', function(event) {
        tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY + 10) + 'px');
      })
      .on('mouseout', function() {
        tooltip.style('display', 'none');
      });

    // Labels
    svg.selectAll('text.label')
      .data(events)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', d => x(d.start) + 5)
      .attr('y', (d, i) => margin.top + i * rowHeight + barHeight / 2 + 4)
      .text(d => d.title)
      .attr('fill', '#fff')
      .attr('font-size', '12px')
      .attr('pointer-events', 'none');
  }
});