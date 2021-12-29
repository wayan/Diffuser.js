
    import curve from './Curve.mjs'
    import svg   from './Svg.mjs'
    const from = [0,0], size = [20, 20]
    const lineStyle = svg.buildStyle({fill: 'none', stroke: 'red', 'stroke-width': 0.02})
    const viewbox = svg.build(
        'svg',
        {
            viewBox: [ ... from, ... size ].join(' '),
            width:  size[0] + 'cm',
            height: size[1] + 'cm'
       });
