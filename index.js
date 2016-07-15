
import d3 from 'd3'

/**
 * Default config.
 */

const defaults = {
  // target element or selector to contain the svg
  target: '#chart',

  // width of chart
  width: 550,

  // height of chart
  height: 175,

  // margin
  margin: { top: 25, right: 60, bottom: 50, left: 60 },

  // axis enabled
  axis: true,

  // x axis tick count
  xTicks: 6,

  // y range (opacity)
  yRange: [0, 1],

  // x domain (time)
  xDomain: [],

  // time formatter
  timeFormat:  d3.time.format("%B %d %I:%M %p"),

  // value formatter
  valueFormat: d3.format('0,000'),

  // custom point width
  pointWidth: null,

  // easing function for transitions
  ease: 'linear'
}

/**
 * LineChart.
 */

export default class LineChart {

  /**
   * Construct with the given `config`.
   */

  constructor(config) {
    this.set(config)
    this.init()
  }

  /**
   * Set configuration options.
   */

  set(config) {
    Object.assign(this, defaults, config)
  }

  /**
   * Dimensions without margin.
   */

  dimensions() {
    const { width, height, margin } = this
    const w = width - margin.left - margin.right
    const h = height - margin.top - margin.bottom
    return [w, h]
  }

  /**
   * Initialize the chart.
   */

  init() {
    const { target, width, height, margin } = this
    const { axis, xTicks, yTicks, yRange } = this
    const [w, h] = this.dimensions()

    this.chart = d3.select(target)
        .attr('width', width)
        .attr('height', height)
      .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)

    this.x = d3.time.scale()
      .range([0, w])

    this.y = d3.scale.linear()
      .range(yRange)

    this.xAxis = d3.svg.axis()
      .orient('bottom')
      .scale(this.x)
      .ticks(xTicks)
      .tickPadding(8)
      .tickSize(-h)

    if (axis) {
      this.chart.append('g')
        .attr('class', 'x axis')
        .attr('transform', `translate(0, ${h})`)
        .call(this.xAxis)
    }

    this.details = this.chart.append('g')
      .attr('class', 'details')
      .style('display', 'none')

    this.details.append('line')
      .attr('class', 'x')
      .attr('y1', 0)
      .attr('y1', h)

    this.details.append('text')
      .attr('class', 'time')

    this.details.append('g')
      .attr('class', 'data')

    this.overlay = this.chart.append('rect')
      .attr('class', 'overlay')
      .attr('width', w)
      .attr('height', h)
      .style('fill-opacity', 0)
      .on('mousemove', _ => this.onMouseOver())
      .on('mouseleave', _ => this.onMouseLeave())

    this.xBisect = d3.bisector(d => d.time).left
  }

  /**
   * Handle mouseover.
   */

  onMouseOver() {
    const firstSeries = this.data[0]
    const m = d3.mouse(this.chart.node())
    const x = this.x.invert(m[0])

    const data = this.data.map(d => {
      const i = this.xBisect(d.data, x, 1)
      const point = d.data[i - 1]
      return {
        name: d.name,
        type: d.type,
        time: point ? point.time : 0,
        value: point ? point.value : 0
      }
    })

    this.renderDetails(x, data, true)
  }

  /**
   * Handle mouseleave.
   */

  onMouseLeave() {
    const { chart } = this

    chart.select('.details')
      .style('display', 'none')

    // force render for mouse blur, otherwise
    // the .values will not be correct
    this.render(this.data)
  }

  /**
   * Render the point width.
   */

  getPointWidth(data) {
    const { pointWidth } = this
    if (pointWidth) return pointWidth
    const [w, h] = this.dimensions()
    const seriesPoints = d3.max(data, d => d.data.length)
    return w / seriesPoints
  }

  /**
   * Render hover details.
   */

  renderDetails(time, data, hover) {
    const { chart, x, timeFormat, valueFormat } = this
    const [w, h] = this.dimensions()
    const pointWidth = this.getPointWidth(this.data)
    const mx = x(time)
    const deltaRight = w - mx

    chart.selectAll('.value')
      .data(data)
      .text(d => valueFormat(d.value, this.data, hover))

    chart.select('.details')
      .style('display', null)

    chart.select('.details .x')
      .attr('x1', mx)
      .attr('x2', mx)

    chart.select('.details .time')
      .attr('x', mx)
      .attr('y', h + 5)
      .text(timeFormat(time))
  }

  /**
   * Prepare domains.
   */

  prepare(data) {
    const { x, y, xDomain } = this

    const xMin = xDomain[0] || d3.min(data, d => d3.min(d.data, d => d.time))
    const xMax = xDomain[1] || d3.max(data, d => d3.max(d.data, d => d.time))
    x.domain([xMin, xMax])

    const yMin = d3.min(data, d => d3.min(d.data, d => d.value))
    const yMax = d3.max(data, d => d3.max(d.data, d => d.value))
    y.domain([yMin, yMax])
  }

  /**
   * Render axis.
   */

  renderAxis(data) {
    const { chart, xAxis } = this
    chart.select('.x.axis').call(xAxis)
  }

  /**
   * Render series.
   */

  renderSeries(data) {
    const { chart, x, y, ease, margin, valueFormat } = this
    const [w, h] = this.dimensions()

    const seriesHeight = h / data.length
    const pointWidth = this.getPointWidth(data)

    const label = chart.selectAll('.label')
      .data(data, d => d.name)

    // update
    label.transition().ease(ease)
      .attr('transform', (d, i) => `translate(0, ${((i * seriesHeight) + seriesHeight / 2) - 8})`)

    // enter
    label.enter().append('text')
      .attr('class', 'label')
      .text(d => d.name)
      .attr('transform', (d, i) => `translate(0, ${((i * seriesHeight) + seriesHeight / 2) - 8})`)

    // exit
    label.exit().remove()

    const value = chart.selectAll('.value')
      .data(data)

    // update
    value.transition().ease(ease)
      .attr('transform', (d, i) => `translate(${w + 12}, ${(i * seriesHeight) + seriesHeight / 2})`)
      .text(d => valueFormat(d3.sum(d.data, d => d.value), data))

    // enter
    value.enter().append('text')
      .attr('class', 'value')
      .attr('transform', (d, i) => `translate(${w + 12}, ${(i * seriesHeight) + seriesHeight / 2})`)
      .text(d => valueFormat(d3.sum(d.data, d => d.value), data))

    // exit
    value.exit().remove()

    const series = chart.selectAll('.series')
      .data(data)

    // update
    series.transition().ease(ease).attr('transform', (d, i) => `translate(0, ${i * seriesHeight})`)
      .select('line')
        .attr('y1', seriesHeight / 2)
        .attr('y2', seriesHeight / 2)

    // enter
    series.enter().append('g')
      .attr('transform', (d, i) => `translate(0, ${i * seriesHeight})`)
      .attr('class', d => `series ${d.type}`)
      .append('line')
        .attr('class', 'bg')
        .attr('x1', 0)
        .attr('x2', w)
        .attr('y1', seriesHeight / 2)
        .attr('y2', seriesHeight / 2)

    // exit
    series.exit().remove()

    const point = series.selectAll('.point')
      .data(d => d.data)

    // update
    point.transition().ease(ease)
      .attr('x1', d => x(d.time))
      .attr('x2', d => x(d.time) + pointWidth)
      .style('stroke-opacity', d => y(d.value))


    // enter
    point.enter().append('line')
      .attr('class', 'point')
      .attr('x1', d => x(d.time))
      .attr('x2', d => x(d.time) + pointWidth)

    // update
    point
      .attr('y1', seriesHeight / 2)
      .attr('y2', seriesHeight / 2)
      .style('stroke-opacity', d => y(d.value))

    // exit
    point.exit().remove()

    // re-append overlay
    const overlay = this.overlay.node()
    overlay.parentNode.appendChild(overlay)
  }

  /**
   * Render the chart against the given `data`.
   */

  render(data, options = {}) {
    this.data = data
    this.prepare(data, options)
    this.renderAxis(data, options)
    this.renderSeries(data, options)
  }

  /**
   * Update the chart against the given `data`.
   */

  update(data) {
    this.render(data)
  }
}
