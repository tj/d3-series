'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _d2 = require('d3');

var _d3 = _interopRequireDefault(_d2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Default config.
 */

var defaults = {
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
  timeFormat: _d3.default.time.format("%B %d %I:%M %p"),

  // value formatter
  valueFormat: _d3.default.format('0,000'),

  // custom point width
  pointWidth: null,

  // easing function for transitions
  ease: 'linear'
};

/**
 * LineChart.
 */

var LineChart = function () {

  /**
   * Construct with the given `config`.
   */

  function LineChart(config) {
    _classCallCheck(this, LineChart);

    this.set(config);
    this.init();
  }

  /**
   * Set configuration options.
   */

  _createClass(LineChart, [{
    key: 'set',
    value: function set(config) {
      Object.assign(this, defaults, config);
    }

    /**
     * Dimensions without margin.
     */

  }, {
    key: 'dimensions',
    value: function dimensions() {
      var width = this.width;
      var height = this.height;
      var margin = this.margin;

      var w = width - margin.left - margin.right;
      var h = height - margin.top - margin.bottom;
      return [w, h];
    }

    /**
     * Initialize the chart.
     */

  }, {
    key: 'init',
    value: function init() {
      var _this = this;

      var target = this.target;
      var width = this.width;
      var height = this.height;
      var margin = this.margin;
      var axis = this.axis;
      var xTicks = this.xTicks;
      var yTicks = this.yTicks;
      var yRange = this.yRange;

      var _dimensions = this.dimensions();

      var _dimensions2 = _slicedToArray(_dimensions, 2);

      var w = _dimensions2[0];
      var h = _dimensions2[1];


      this.chart = _d3.default.select(target).attr('width', width).attr('height', height).append('g').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

      this.x = _d3.default.time.scale().range([0, w]);

      this.y = _d3.default.scale.linear().range(yRange);

      this.xAxis = _d3.default.svg.axis().orient('bottom').scale(this.x).ticks(xTicks).tickPadding(8).tickSize(-h);

      if (axis) {
        this.chart.append('g').attr('class', 'x axis').attr('transform', 'translate(0, ' + h + ')').call(this.xAxis);
      }

      this.details = this.chart.append('g').attr('class', 'details').style('display', 'none');

      this.details.append('line').attr('class', 'x').attr('y1', 0).attr('y1', h);

      this.details.append('text').attr('class', 'time');

      this.details.append('g').attr('class', 'data');

      this.overlay = this.chart.append('rect').attr('class', 'overlay').attr('width', w).attr('height', h).style('fill-opacity', 0).on('mousemove', function (_) {
        return _this.onMouseOver();
      }).on('mouseleave', function (_) {
        return _this.onMouseLeave();
      });

      this.xBisect = _d3.default.bisector(function (d) {
        return d.time;
      }).left;
    }

    /**
     * Handle mouseover.
     */

  }, {
    key: 'onMouseOver',
    value: function onMouseOver() {
      var _this2 = this;

      var firstSeries = this.data[0];
      var m = _d3.default.mouse(this.chart.node());
      var x = this.x.invert(m[0]);

      var data = this.data.map(function (d) {
        var i = _this2.xBisect(d.data, x, 1);
        var point = d.data[i - 1];
        return {
          name: d.name,
          type: d.type,
          time: point ? point.time : 0,
          value: point ? point.value : 0
        };
      });

      this.renderDetails(x, data, true);
    }

    /**
     * Handle mouseleave.
     */

  }, {
    key: 'onMouseLeave',
    value: function onMouseLeave() {
      var chart = this.chart;


      chart.select('.details').style('display', 'none');

      // force render for mouse blur, otherwise
      // the .values will not be correct
      this.render(this.data);
    }

    /**
     * Render the point width.
     */

  }, {
    key: 'getPointWidth',
    value: function getPointWidth(data) {
      var pointWidth = this.pointWidth;

      if (pointWidth) return pointWidth;

      var _dimensions3 = this.dimensions();

      var _dimensions4 = _slicedToArray(_dimensions3, 2);

      var w = _dimensions4[0];
      var h = _dimensions4[1];

      var seriesPoints = _d3.default.max(data, function (d) {
        return d.data.length;
      });
      return w / seriesPoints;
    }

    /**
     * Render hover details.
     */

  }, {
    key: 'renderDetails',
    value: function renderDetails(time, data, hover) {
      var _this3 = this;

      var chart = this.chart;
      var x = this.x;
      var timeFormat = this.timeFormat;
      var valueFormat = this.valueFormat;

      var _dimensions5 = this.dimensions();

      var _dimensions6 = _slicedToArray(_dimensions5, 2);

      var w = _dimensions6[0];
      var h = _dimensions6[1];

      var pointWidth = this.getPointWidth(this.data);
      var mx = x(time);
      var deltaRight = w - mx;

      chart.selectAll('.value').data(data).text(function (d) {
        return valueFormat(d.value, _this3.data, hover);
      });

      chart.select('.details').style('display', null);

      chart.select('.details .x').attr('x1', mx).attr('x2', mx);

      chart.select('.details .time').attr('x', mx).attr('y', h + 5).text(timeFormat(time));
    }

    /**
     * Prepare domains.
     */

  }, {
    key: 'prepare',
    value: function prepare(data) {
      var x = this.x;
      var y = this.y;
      var xDomain = this.xDomain;


      var xMin = xDomain[0] || _d3.default.min(data, function (d) {
        return _d3.default.min(d.data, function (d) {
          return d.time;
        });
      });
      var xMax = xDomain[1] || _d3.default.max(data, function (d) {
        return _d3.default.max(d.data, function (d) {
          return d.time;
        });
      });
      x.domain([xMin, xMax]);

      var yMin = _d3.default.min(data, function (d) {
        return _d3.default.min(d.data, function (d) {
          return d.value;
        });
      });
      var yMax = _d3.default.max(data, function (d) {
        return _d3.default.max(d.data, function (d) {
          return d.value;
        });
      });
      y.domain([yMin, yMax]);
    }

    /**
     * Render axis.
     */

  }, {
    key: 'renderAxis',
    value: function renderAxis(data) {
      var chart = this.chart;
      var xAxis = this.xAxis;

      chart.select('.x.axis').call(xAxis);
    }

    /**
     * Render series.
     */

  }, {
    key: 'renderSeries',
    value: function renderSeries(data) {
      var chart = this.chart;
      var x = this.x;
      var y = this.y;
      var ease = this.ease;
      var margin = this.margin;
      var valueFormat = this.valueFormat;

      var _dimensions7 = this.dimensions();

      var _dimensions8 = _slicedToArray(_dimensions7, 2);

      var w = _dimensions8[0];
      var h = _dimensions8[1];


      var seriesHeight = h / data.length;
      var pointWidth = this.getPointWidth(data);

      var label = chart.selectAll('.label').data(data, function (d) {
        return d.name;
      });

      // update
      label.transition().ease(ease).attr('transform', function (d, i) {
        return 'translate(0, ' + (i * seriesHeight + seriesHeight / 2 - 8) + ')';
      });

      // enter
      label.enter().append('text').attr('class', 'label').text(function (d) {
        return d.name;
      }).attr('transform', function (d, i) {
        return 'translate(0, ' + (i * seriesHeight + seriesHeight / 2 - 8) + ')';
      });

      // exit
      label.exit().remove();

      var value = chart.selectAll('.value').data(data);

      // update
      value.transition().ease(ease).attr('transform', function (d, i) {
        return 'translate(' + (w + 12) + ', ' + (i * seriesHeight + seriesHeight / 2) + ')';
      }).text(function (d) {
        return valueFormat(_d3.default.sum(d.data, function (d) {
          return d.value;
        }), data);
      });

      // enter
      value.enter().append('text').attr('class', 'value').attr('transform', function (d, i) {
        return 'translate(' + (w + 12) + ', ' + (i * seriesHeight + seriesHeight / 2) + ')';
      }).text(function (d) {
        return valueFormat(_d3.default.sum(d.data, function (d) {
          return d.value;
        }), data);
      });

      // exit
      value.exit().remove();

      var series = chart.selectAll('.series').data(data);

      // update
      series.transition().ease(ease).attr('transform', function (d, i) {
        return 'translate(0, ' + i * seriesHeight + ')';
      }).select('line').attr('y1', seriesHeight / 2).attr('y2', seriesHeight / 2);

      // enter
      series.enter().append('g').attr('transform', function (d, i) {
        return 'translate(0, ' + i * seriesHeight + ')';
      }).attr('class', function (d) {
        return 'series ' + d.type;
      }).append('line').attr('class', 'bg').attr('x1', 0).attr('x2', w).attr('y1', seriesHeight / 2).attr('y2', seriesHeight / 2);

      // exit
      series.exit().remove();

      var point = series.selectAll('.point').data(function (d) {
        return d.data;
      });

      // update
      point.transition().ease(ease).attr('x1', function (d) {
        return x(d.time);
      }).attr('x2', function (d) {
        return x(d.time) + pointWidth;
      }).style('stroke-opacity', function (d) {
        return y(d.value);
      });

      // enter
      point.enter().append('line').attr('class', 'point').attr('x1', function (d) {
        return x(d.time);
      }).attr('x2', function (d) {
        return x(d.time) + pointWidth;
      });

      // update
      point.attr('y1', seriesHeight / 2).attr('y2', seriesHeight / 2).style('stroke-opacity', function (d) {
        return y(d.value);
      });

      // exit
      point.exit().remove();

      // re-append overlay
      var overlay = this.overlay.node();
      overlay.parentNode.appendChild(overlay);
    }

    /**
     * Render the chart against the given `data`.
     */

  }, {
    key: 'render',
    value: function render(data) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      this.data = data;
      this.prepare(data, options);
      this.renderAxis(data, options);
      this.renderSeries(data, options);
    }

    /**
     * Update the chart against the given `data`.
     */

  }, {
    key: 'update',
    value: function update(data) {
      this.render(data);
    }
  }]);

  return LineChart;
}();

exports.default = LineChart;