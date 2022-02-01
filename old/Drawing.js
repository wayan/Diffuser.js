if (typeof wayan == 'undefined'){
    var wayan = {};
}

wayan.Drawing = function(){
    const SvgPath = wayan.SvgPath(), 
        Fn = wayan.Fn(), 
        Geometry = wayan.Geometry(),
        drawing = function(p){
            $.extend(this, 
                { magnify: 1,
                   svgNs : 'http://www.w3.org/2000/svg'
                }, 
                p
            );
        };


    drawing.prototype.setViewbox = function(boundingBox ){
        const [from, to] = boundingBox,
            size = from.map((x,i) => to[i] - x ),
            translate = from.map(x => this.magnify * -x),
            scale = [ this.magnify, this.magnify ];

        // where to place your objects
        /*
        this.container = Fn.buildSVGElem(
            'g',
            { transform: "translate(" + translate.join(' ') +  ") scale(" + scale.join(' ') + ')' }
        );
        */

        this.svg = Fn.buildSVGElem(
            'svg',
            {
                 viewBox: [ ... from, ... size ].join(' '),
                 width:  size[0] + 'cm',
                height: size[1] + 'cm',
                //width:  Math.ceil(size[0] * this.magnify),
                ///height: Math.ceil(size[1] * this.magnify)
            },
        );
        this.container = this.svg;
        
       // $(this.svg).append(this.container);
        
    };


    drawing.prototype.completeStyle = function(defaultStyle, style){
        const complete = { ... defaultStyle, ... (style || {}) };
        return Object.keys(complete).map(k => k + ':' + complete[k]).join(';');
    };

    drawing.prototype.polylinePolyline = function(points, style){
        const thePoints = points.map( p => p.join(',')).join(' ');

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

    drawing.prototype.polylinePath = function(points, style){
        const d = points.map( 
                (p,i) => {
                    const cmd = (i == 0? 'M':'L');
                    return cmd + ' ' + p.join(' ');
                }
            ).join(' '),
            path = document.createElementNS(this.svgNs, "path");
        $(path).appendTo('svg').attr('d', d).attr(
            'style', 
            this.completeStyle(
                {
                    fill: 'none'
                },
                style
            )
        );
    };

    drawing.prototype.polyline = drawing.prototype.polylinePath;

    drawing.prototype.text = function(str, oo){

        $(this.container).append(
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

    drawing.prototype.circle = function(oo, rr){
        const 
            elem = document.createElementNS(this.svgNs, "circle");
        $(elem).appendTo('svg').attr('cx', oo[0]).attr('cy', oo[1]).attr('r', rr).attr('style', 'stroke:rgb(100,100,100);stroke-width:2;fill:none;');
    };

    /* building path */
    drawing.prototype.roundCorner = (p,r) => { 
        p['round'] = { r: r };
        return p;
    };

    drawing.prototype.path = function(commands, style){
        const theCommands = commands.map(
            (command) => {
                var points = command.cmd == 'Q'? [command.p2, command.p]: [command.p]
                return command.cmd + points.map( (p) => p.join(',') ).join(' ');
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
        $( this.container ).append( elem );
    };

    drawing.prototype.expandRoundCorners = function(commands_in) {
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

    drawing.prototype.pathPoints = function(commands){
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

    drawing.prototype.transformPath = function(tr, commands) { 
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

    drawing.prototype.roundPath = function(path, r){
        const g=Geometry, cnt=path.length, pp1=path[cnt - 3].p, pp2=path[cnt - 2].p, pp3=path[cnt - 1].p;
        const [p1, p2, p3] = g.roundPoints(pp1, pp2, pp3, r);

        const l = path.pop(), ll = path.pop();

        path.push( this.LineTo(p1) );
        path.push( this.BezierQ(p2, p3) );
        path.push( l );
    };

    return drawing;
};

