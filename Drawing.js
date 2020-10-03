function Drawing(p){
    $.extend(this, 
        { magnify: 1, 
            o: [0,0],
            showGrid: false,
        }, 
        p 
    );
}

Drawing.prototype.transform = function(p){
    return p.map((x,i) => this.magnify * x + this.o[i]);
};

Drawing.prototype.setViewbox = function(points ){
    const margin = 1.5, 
        bounding = [ Math.min, Math.max ].map(
            f => points.reduce( (a,b) => a.map((x,i) => f(x, b[i]) ) )
        ).map( (p,i) => p.map( x => x + margin * (i == 0 ? -1: 1) ));
    
    const p1 = bounding[0].map(Math.floor), 
        p2 = bounding[1].map(Math.ceil),
        d = p1.map((x,i) => p2[i] - x),
        mag = this.magnify;

    this.svg = Fn.buildSVGElem(
        'svg',
        {
            viewBox: [ p1[0], p1[1], d[0], d[1] ].map(x => mag * x).join(' '),
            width:  d[0] + 'cm',
            height: d[1] + 'cm',
        }
    )
    $(this.svg).appendTo( $('#svg-cont') );

    if (this.showGrid){
        const path = [];

        [0,1].forEach(li => {
            for(let lx = p1[li]; lx <= p2[li]; lx ++ ){
                const line = [ p1, p2].map(p => p.map( (x,i) => i==li? lx: x ));
                path.push( SvgPath.MoveTo(line[0]), SvgPath.LineTo(line[1]))
            }
        });
        this.path(path, { 'stroke-dasharray': '1 4', 'stroke-width': 1 });
    }
    
};

Drawing.prototype.completeStyle = function(defaultStyle, style){
    const complete = $.extend({}, defaultStyle, style || {});
    return Object.keys(complete).map(k => k + ':' + complete[k]).join(';');
};

Drawing.prototype.polylinePolyline = function(points, style){
    const thePoints = points.map( p => this.transform(p).join(',')).join(' ');

    this.createElement('polyline').attr('points', thePoints).attr(
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

Drawing.prototype.getSvg  = function(){
    if (this.svg ){
        return this.svg;
    }
    return false;
}

Drawing.prototype.polyline = Drawing.prototype.polylinePath;

Drawing.prototype.text = function(str, o){
    const oo = this.transform(o);

    $(this.getSvg()).append(
        Fn.buildSVGElem(
            'text',
            {
                x: oo[0], 
                y: oo[1], 
                style:'stroke:rgb(100,100,100);stroke-width:1;fill:none;'
            },
            str
        )
    );
}

Drawing.prototype.circle = function(o, r){
    const oo = this.transform(o), 
        rr = r * this.magnify,
        elem = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    $(elem).appendTo('svg').attr('cx', oo[0]).attr('cy', oo[1]).attr('r', rr).attr('style', 'stroke:rgb(100,100,100);stroke-width:2;fill:none;');
};

/* building path */
Drawing.prototype.roundCorner = (p,r) => { 
    p['round'] = { r: r };
    return p;
}

Drawing.prototype.path = function(commands, style){
    const theCommands = commands.map(
        (command) => {
            var points = command.cmd == 'Q'? [command.p2, command.p]: [command.p]
            return command.cmd + points.map( (p) => this.transform(p).join(',') ).join(' ');
        }
    );
            
    const elem = Fn.buildSVGElem(
        'path',
        {
            d: theCommands.join(' '),
            style: this.completeStyle(
                {
                    stroke: 'rgb(255,0,0)',
                    'stroke-width': 2,
                    fill: 'none'
                },
                style
            )
        }
    );
    $( this.getSvg() ).append( elem );
};

Drawing.prototype.expandRoundCorners = function(commands_in) {
    const commands = [], g = Geometry;
    commands_in.forEach(
        (command, i) => {
            if (!command['p'] || !command.p['round']){
                /* no round corner */
                commands.push(command);
                return;
            }

            const plast = commands[ commands.length - 1 ].p,
                p = command.p,
                r = p.round.r,
                pnext = commands_in[ i + 1].p,
                p_b = g.add(p, g.unit( g.dir(p, plast), r )),
                p_n = g.add(p, g.unit( g.dir(p, pnext), r ));
            commands.push( { cmd: command.cmd, p: p_b });
            commands.push( this.BezierQ(p_n, p) );
        }
    );
    return commands;
};

Drawing.prototype.pathPoints = function(commands){
    const points = [];
    commands.forEach(
        (command) =>  {
            ['p', 'p2'].forEach((prop) => {
                if (command[prop]){
                    points.push(command[prop]);
                }
            })
        }
    );
    return points;
};

Drawing.prototype.transformPath = function(tr, commands) { 
    return commands.map(
        (command) => {
            const cp = {};
            for (const prop in command){
                cp[ prop ] = ( prop == 'p' || prop == 'p2')? tr( command[prop] ): command[prop]
            }
            return cp;
        }
    );
};

Drawing.prototype.roundPath = function(path, r){
    const g=Geometry, cnt=path.length, pp1=path[cnt - 3].p, pp2=path[cnt - 2].p, pp3=path[cnt - 1].p;
    const [p1, p2, p3] = g.roundPoints(pp1, pp2, pp3, r);

    const l = path.pop(), ll = path.pop();

    path.push( this.LineTo(p1) );
    path.push( this.BezierQ(p2, p3) );
    path.push( l );
};


