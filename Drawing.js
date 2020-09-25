function Drawing(p){
    $.extend(this, { magnify: 1, o: [0,0]}, p );
}

Drawing.prototype.transform = function(p){
    return p.map((x,i) => this.magnify * x + this.o[i]);
};

Drawing.prototype.setViewbox = function(points, no_grid ){
    const margin = 1.5, 
        bounding = [ Math.min, Math.max ].map(
            f => points.reduce( (a,b) => a.map((x,i) => f(x, b[i]) ) )
        ).map( (p,i) => p.map( x => x + margin * (i == 0 ? -1: 1) ));
    
    const p1 = bounding[0].map(Math.floor), 
        p2 = bounding[1].map(Math.ceil),
        d = p1.map((x,i) => p2[i] - x),
        mag = this.magnify,
        $svg = $('svg');
    $svg.attr('viewBox', [ p1[0], p1[1], d[0], d[1] ].map(x => mag * x).join(' '));
    $svg.attr('width', d[0] + 'cm');
    $svg.attr('height', d[1] + 'cm');
    if (! (no_grid || false) ){
        [0,1].forEach(li => {
            for(lx = p1[li]; lx <= p2[li]; lx ++ ){
                this.polyline( 
                    [ p1, p2].map(p => p.map( (x,i) => i==li? lx: x )),
                    {
                        'stroke-dasharray': '1 4', 'stroke-width': 1 
                    }
                );
            }
        });
    }
};

Drawing.prototype.completeStyle = function(defaultStyle, style){
    const complete = $.extend({}, defaultStyle, style || {});
    return Object.keys(complete).map(k => k + ':' + complete[k]).join(';');
};

Drawing.prototype.polylinePolyline = function(points, style){
    const thePoints = points.map( p => this.transform(p).join(',')).join(' '),
        poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    $(poly).appendTo('svg').attr('points', thePoints).attr(
        'style', 
        this.completeStyle(
            {
                stroke: 'rgb(255,0,0)',
                'stroke-width': 2,
                fill: 'none'
            },
            style
        )
    );
};

Drawing.prototype.polylinePath = function(points, style){
    const d = points.map( 
            (p,i) => {
                const cmd = (i == 0? 'M':'L');
                return cmd + ' ' + this.transform(p).join(' ');
            }
        ).join(' '),
    path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    $(path).appendTo('svg').attr('d', d).attr(
        'style', 
        this.completeStyle(
            {
                stroke: 'rgb(255,0,0)',
                'stroke-width': 2,
                fill: 'none'
            },
            style
        )
    );
};

Drawing.prototype.polyline = Drawing.prototype.polylinePath;

Drawing.prototype.text = function(str, o){
    const oo = this.transform(o),
        elem = document.createElementNS("http://www.w3.org/2000/svg", "text");
    $(elem).appendTo('svg').attr('x', oo[0]).attr('y', oo[1]).attr('style', 'stroke:rgb(100,100,100);stroke-width:1;fill:none;');
    $(elem).append(str);
}

Drawing.prototype.circle = function(o, r){
    const oo = this.transform(o), 
        rr = r * this.magnify,
        elem = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    $(elem).appendTo('svg').attr('cx', oo[0]).attr('cy', oo[1]).attr('r', rr).attr('style', 'stroke:rgb(100,100,100);stroke-width:2;fill:none;');
};

/* building path */
Drawing.prototype.path = function(commands, style){
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    $(path).appendTo('svg').attr('d', commands.join(' ')).attr(
        'style', 
        this.completeStyle(
            {
                stroke: 'rgb(255,0,0)',
                'stroke-width': 2,
                fill: 'none'
            },
            style
        )
    );
};

Drawing.prototype.pathMoveTo = function(p){
    return 'M' + this.transform(p).join(',');
};

Drawing.prototype.pathLineTo = function(p){
    return 'L' + this.transform(p).join(',');
};

Drawing.prototype.pathBezierQ = function(p1, p2){
    return 'Q' + [p1,p2].map( (p) => this.transform(p).join(',') ).join(' ');
};



