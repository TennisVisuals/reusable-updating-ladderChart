function ladderChart() {

    var data;
    var dom_parent;
    var plot_width;
    var plot_height;
    var update;

    var options = {
        width: window.innerWidth,
        height: window.innerHeight,
        margins: {
           top:    30, bottom: 20, 
           left:   10, right:  10
        },
        data: {
           calculateDomain:   true,
           oneYearMinimum:    false,
           fullYearsOnly:     false
        },
        plot: {
           title: {
              x:        40,
              y:        15,
              fill:     '#74736c', 
              fontSize: '20px',
              text:     undefined
           },
           source: {
              text:     undefined,
           },
           footnote: {
              fill:     '#74736c', 
              fontSize: '12px' 
           },
           margins: {
              top:     0, bottom: 12, 
              left:   25, right:  10
           },
           dateDomain: {
              start:  new Date(new Date().getFullYear(), 0, 1),
              end:    new Date(new Date().getFullYear(), 11, 31)
           },
           content: {
              rows: []
           },
           color: {
              default: '#235dba'
           },
           xAxis: {
              ticks:       4,
              fontSize:    "16px",
              fontWeight:  400
           },
           connector: {
              fill:     'none',
              stroke:   '#a7a59b',
              opacity:  0.7,
              width:    2
           },
           shape: {
              opacity:        0.7,
              dateKey:        'date',
              rungKey:        'rung',

              colorKey:       undefined, // value attribute to determine color
              sizeKey:        undefined, // value attribute to determine shape size
              shapeSizeBase:  undefined, // divisor for value given by sizeKey attribute

              typeKey:        undefined, // values attribute to determine shape type
              typeRange:      [],
              typeDomain:     []
           }
        },
       display: {
          transition_time: 0,
          sizeToFit: true
       },
    };

    var superShapes = [
       "asterisk","bean","butterfly","circle","clover", "cloverFour",
       "cross","diamond","drop","ellipse", "gear","heart","heptagon",
       "hexagon","malteseCross", "pentagon","rectangle","roundedStar",
       "square","star","triangle"
    ];
 
    var default_colors = { default: "#235dba" };
    var colors = JSON.parse(JSON.stringify(default_colors));

    var events = {
       'update':  { 'begin': null, 'end': null },
       'item':    { 'mouseover': null, 'mouseout': null, 'click': null }
    };

    function chart(selection) {
        selection.each(function () {
            dom_parent = d3.select(this);

            var root = dom_parent.append('svg')
                .attr('class', 'itemCalendar');

            var frame = root.append('rect');
            var chartHolder = root.append('g')
               .attr({
                  'class':'chartHolder',
                  'transform':'translate(0,0)'
               });

            var calendarPlot = chartHolder.append("g")
                  .attr("class", "calendarPlot");
            var connector = calendarPlot.append('path.connector');

            var xAxis = calendarPlot.append('g.axis.x');
            var yAxis = calendarPlot.append('g.axis.y');
            var xLine = calendarPlot.append("line")
            var yLine = calendarPlot.append("line")
            var legends = chartHolder.append('g.legends');
            var title = legends.append('text.title');
            var footnote = legends.append('text.footnote');

            update = function(opts) {

               if (options.display.sizeToFit || (opts && opts.sizeToFit)) {
                  var dims = dom_parent.node().getBoundingClientRect();
                  options.width = Math.max(dims.width, 300);
                  options.height = Math.min(Math.max(options.width / 3, 100), 200);
               }

               if (!options.data.calculateDomain) {
                  var dateDomain = [options.plot.dateDomain.start, options.plot.dateDomain.end];
               } else {
                  var dateDomain = d3.extent(data.values.map(function(m) { return m[options.plot.shape.dateKey]; }));
                  var total_days = daysBetween(dateDomain[0], dateDomain[1]);
                  var new_start = new Date(dateDomain[0].getFullYear(), 0, 1);
                  var new_end   = new Date(dateDomain[1].getFullYear(), 11, 31);
                  if (options.data.fullYearsOnly) {
                     dateDomain = [new_start, new_end];
                  } else if (options.data.oneYearMinimum && total_days < 365) {
                     var start_distance = daysBetween(new_start, dateDomain[0]);
                     var end_distance   = daysBetween(dateDomain[1], new_end);
                     if (start_distance < end_distance && total_days + start_distance >= 365) {
                        dateDomain = [new_start, dateDomain[1]];
                     } else if (total_days + end_distance >= 365) {
                        dateDomain = [dateDomain[0], new_end];
                     } else {
                        dateDomain = [new_start, new_end];
                     }
                  }
               }

               plot_width  = options.width  - (options.margins.left + options.margins.right);
               plot_height = options.height - (options.margins.top + options.margins.bottom);

               var ladderScale = d3.scale.ordinal()
                  .range(options.plot.content.rows)
                  .domain(d3.range(0, options.plot.content.rows.length, 1));

               var xScale = d3.time.scale()
                    .range([options.plot.margins.left, plot_width - options.plot.margins.right])
                    .domain(dateDomain);

               var axisX = d3.svg.axis()
                   .orient("bottom")
                   .ticks(options.plot.xAxis.ticks)
                   .tickSize(-plot_height)
                   .tickFormat(d3.time.format("%b"))
                   .scale(xScale);

               var yScale = d3.scale.linear()
                   .range([plot_height - options.plot.margins.bottom, options.plot.margins.top])
                   .domain([0,options.plot.content.rows.length - 1]);

               var axisY = d3.svg.axis()
                   .orient("left")
                   .ticks(options.plot.content.rows.length)
                   .tickSize(-plot_width, 0, 0)
                   .tickFormat(ladderScale)
                   .scale(yScale);

               root
                  .attr({
                     'width':    options.width  + 'px',
                     'height':   options.height + 'px'
                  });

               frame
                  .attr({
                      'class': 'frame',
                      x:      options.margins.left,
                      y:      0,
                      width:  options.width - (options.margins.left + options.margins.right) + 'px',
                      height: options.height + 'px'
                  })
                  .style({ fill: 'white' });

               footnote
                  .style({ 
                     'fill':        options.plot.footnote.fill, 
                     'font-size':   options.plot.footnote.fontSize
                  })
                  .html(function() { if (options.plot.source.text) return 'Source: ' + options.plot.source.text; })
                  .attr({
                     'class': 'footnote',
                     'x':     function() {
                                 return options.width - options.margins.right - this.getComputedTextLength();
                              },
                     'y':     options.height
                  })

               calendarPlot
                  .attr({
                      "transform":  'translate(' + options.margins.left + ',' + options.margins.top + ')'
                  });

               xAxis
                   .translate([0, plot_height - options.plot.margins.bottom])
                   .style({
                       stroke: '#cec6b9',
                       'stroke-dasharray': '2 2'
                   })
                   .call(axisX);

               xLine
                   .attr('stroke', 'black')
                   .attr('x1', 0)
                   .attr('x2', plot_width)
                   .attr('y1', plot_height - options.plot.margins.bottom)
                   .attr('y2', plot_height - options.plot.margins.bottom)

               yAxis
                   .translate([options.plot.margins.left, 0])
                   .style({
                       stroke: '#cec6b9',
                       'stroke-dasharray': '2 2'
                   })
                   .call(axisY);

               yLine
                   .attr('stroke', 'black')
                   .attr('x1', options.plot.margins.left)
                   .attr('x2', options.plot.margins.left)
                   .attr('y1', plot_height - options.plot.margins.bottom)
                   .attr('y2', options.plot.margins.top)

               d3.selectAll('.axis.y .tick text')
                  .attr({ dy:'-2' })
                  .style({
                     'font-size':   '12px',
                     'fill':        '#74736c'
                  });
               d3.selectAll('.axis.x .tick text')
                  .attr({ dx:'1' })
                  .style({
                     'font-size':   '12px',
                     'fill':        '#74736c'
                  });

               d3.selectAll('.axis.y .tick line')
                  .translate([-(options.plot.margins.left), 0]);
               d3.selectAll('.axis.x .tick line')
                  .translate([0, options.plot.margins.right]);

               d3.selectAll('g.axis path.domain')
                  .style('display', 'none');

               title
                  .attr({ 
                     x: options.plot.title.x, 
                     y: options.plot.title.y
                  })
                  .style({ 
                     'fill':        options.plot.title.fill, 
                     'font-size':   options.plot.title.fontSize
                  })
                  .html(function(d) { 
                     var years = [dateDomain[0].getFullYear(), dateDomain[1].getFullYear()]
                        .filter(function(item, i, self) { return self.lastIndexOf(item) == i; })
                        .join(' - ');
                     if (options.plot.title.text) return options.plot.title.text + ' ' + years;
                  });

               var line = d3.svg.line()
                  .interpolate("step-before")
                  .x(function(d) { return xScale(d[options.plot.shape.dateKey]); })
                  .y(function(d) { return yScale(d[options.plot.shape.rungKey]); });

               connector
                  .transition().duration(options.display.transition_time)
                  .attr({ d: line(data.values) })
                  .style({
                    fill:              options.plot.connector.fill,
                    stroke:            options.plot.connector.stroke,
                    'stroke-opacity':  options.plot.connector.opacity,
                    'stroke-width':    options.plot.connector.width
                  });

               if (d3 && d3.superformula) {
                  var shapeSelector = d3.scale.ordinal()
                     .range(options.plot.shape.typeRange)
                     .domain(options.plot.shape.typeDomain);

                  var shape = d3.superformula()
                     .type(function(d) { 
                        var item_shape = shapeSelector(d[options.plot.shape.typeKey]); 
                        return item_shape && superShapes.indexOf(item_shape) >= 0 ? item_shape : 'circle';
                     })
                     .size(shapeSize)
                     .segments(360);
               }

               var item_shapes = calendarPlot.selectAll('.itemDate')
                  .data(data.values);

               item_shapes.enter()
                  .append(shape ? 'path' : 'circle')
                  .translate(function(d) { return [xScale(d[options.plot.shape.dateKey]), 0]; })
                  .style({
                    'opacity':      0,
                    'fill-opacity': 0,
                    'stroke':       shapeColor,
                    'stroke-width': 1
                  })
                  .attr({
                    fill:  shapeColor,
                    class: 'itemDate',
                    r:     circleRadius,
                    d:     shape
                  })

               item_shapes.exit()
                  .transition().duration(options.display.transition_time)
                  .style({
                     'opacity': 0,
                     'fill-opacity': 0
                  })
                  .remove();

               item_shapes
                  .on('mouseover', events.item.mouseover)
                  .on('mouseout', events.item.mouseout)
                  .on('click', events.item.click)
                  .transition().duration(options.display.transition_time)
                  .translate(function(d) { return [xScale(d[options.plot.shape.dateKey]), yScale(d[options.plot.shape.rungKey])]; })
                  .attr({
                    id:    function(d) { return 'itemDate' + d.context; },
                    r:     circleRadius,
                    d:     shape
                  })
                  .style({
                    'fill':         shapeColor,
                    'opacity':      options.plot.shape.opacity,
                    'fill-opacity': options.plot.shape.opacity,
                    'stroke':       shapeColor,
                    'stroke-width': 1
                  })

               calendarPlot.select('.axis.x').selectAll('text')
                  .style( {'font-size': options.plot.xAxis.fontSize, 'font-weight': options.plot.xAxis.fontWeight })

            }
        });
    }

    function circleRadius(d) {
       var sizeFactor = d[options.plot.shape.sizeKey];
       var sizeBase = options.plot.shape.shapeSizeBase * 2;
       return sizeFactor && sizeBase ? Math.sqrt(sizeFactor * plot_width / sizeBase) : 10;
    }

    function shapeSize(d) {
       var sizeFactor = d[options.plot.shape.sizeKey];
       var sizeBase = options.plot.shape.shapeSizeBase;
       return sizeFactor && sizeBase ? sizeFactor * plot_width / sizeBase : plot_width / 3;
    }

    function shapeColor(d) {
       var color = d[options.plot.shape.colorKey];
       return color && colors[color] ? colors[color] : options.plot.color.default;
    }

    // ACCESSORS

    chart.exports = function() {
       return { circleRadius: circleRadius, shapeSize: shapeSize, shapeColor: shapeColor }
    }

    // allows updating individual options and suboptions
    // while preserving state of other options
    chart.options = function(values) {
        if (!arguments.length) return options;
        keyWalk(values, options);
        return chart;
    }

    function keyWalk(valuesObject, optionsObject) {
        if (!valuesObject || !optionsObject) return;
        var vKeys = Object.keys(valuesObject);
        var oKeys = Object.keys(optionsObject);
        for (var k=0; k < vKeys.length; k++) {
           if (oKeys.indexOf(vKeys[k]) >= 0) {
              var oo = optionsObject[vKeys[k]];
              var vo = valuesObject[vKeys[k]];
              if (typeof oo == 'object' && typeof vo !== 'function' && oo.constructor !== Array) {
                 keyWalk(valuesObject[vKeys[k]], optionsObject[vKeys[k]]);
              } else {
                 optionsObject[vKeys[k]] = valuesObject[vKeys[k]];
              }
           }
        }
    }

    chart.events = function(functions) {
         if (!arguments.length) return events;
         keyWalk(functions, events);
         return chart;
    }

    chart.width = function(value) {
        if (!arguments.length) return options.width;
        options.width = value;
        return chart;
    };

    chart.height = function(value) {
        if (!arguments.length) return options.height;
        options.height = value;
        return chart;
    };

    chart.data = function(value) {
        if (!arguments.length) return data;
        data = value;
        return chart;
    };

    chart.update = function(opts) {
      if (events.update.begin) events.update.begin(); 
      if (typeof update === 'function' && data) update(opts);
       setTimeout(function() { 
         if (events.update.end) events.update.end(); 
       }, options.display.transition_time);
    }

    chart.colors = function(color3s) {
        if (!arguments.length) return colors;
        if (typeof color3s !== 'object') return false;
        var keys = Object.keys(color3s);        
        if (!keys.length) return false;
        // remove all properties that are not colors
        keys.forEach(function(f) { if (! /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(color3s[f])) delete color3s[f]; })
        if (Object.keys(color3s).length) {
           colors = color3s;
        } else {
           colors = JSON.parse(JSON.stringify(default_colors));
        }
        return chart;
    }

    function daysBetween(one, another) {
       return Math.round(Math.abs((+one) - (+another))/8.64e7);
    }

   return chart;
}
