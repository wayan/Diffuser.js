var DiffuserShape3 = function(diffuser){
    const shape = new diffuser();
    shape.defaults = {
        frontWidth: 20,
        backWidth: 18,
        length: 22,
        topWidth: 8,
        up: 4,
        down: 5,
        flapWidth: 1.5,
        flashWidth:  6.5,
        flashLength: 6,
        flashHeight: 3,
        backShift: 2 
    };
    shape.create = function(params, w){
        const D = $.extend({}, this.defaults, params),
            g = Geometry, 
            sp = SvgPath,
            y0 = 0,
            y1 = y0 + D.length,
            x0 = 0,
            x1 = D.topWidth / 2,
            x2 = D.backWidth / 2,
            x3 = D.frontWidth / 2,
            xf = D.flashWidth / 2,
            S0 = g.proj([x0, y0, D.up]),
            s1 = [x1, y0, D.up],
            S1 = g.proj(s1),
            S2 = g.unfold(S0, S1, [x3, y1, -D.down]),
            sb = [ x2, y0,  -D.down],
            Sb = g.unfold(S2, S1, sb),
            p4 = [ xf, y0 - D.backShift, 0 ],
            p1 = g.planeLineIntersect(
                    [s1, sb, p4],
                    [ [xf, 0, -D.flashHeight], [xf, 1000, -D.flashHeight] ]
                ),
            P4 = g.unfold(Sb, S1, p4),
            P1 = g.unfold(Sb, S1, p1),
            outline = [],
            foldInPath = [], 
            foldOutPath = [], 
            doAfter = [];

        foldInPath.push( 
            sp.MoveTo(Sb), sp.LineTo(S1), sp.LineTo(S2),
            sp.MoveTo(g.symY(Sb)), sp.LineTo(g.symY(S1)), sp.LineTo(g.symY(S2)) 
        );

        /* top lap close to the flash */
        {
            const xx = g.unfold(S1, S0, p4)
            const r  = g.rotator( xx, g.symY(xx))

            /* start of the outline */
            outline.push( sp.MoveTo( r( [0,D.flashLength])), sp.LineTo(xx), sp.LineTo(S1) )

            foldOutPath.push( sp.MoveTo(xx), sp.LineTo(g.symY(xx)))
        }

        foldInPath.push( sp.MoveTo(S1), sp.LineTo(g.symY(S1)) ) 

        /* flash hugging Lap */
        {
            const p2 = [xf, p4[1] - D.flashLength, - D.flashHeight ],
                P2 = g.unfold(P1, P4, p2),
                P3 = g.unfold(P1, P4, [xf, p4[1] - D.flashLength, 0 ]);
            const r = g.rotator(P3, P4)

            doAfter.push( () => {
                this.pointNote(w, P1, 'P1') 
                this.pointNote(w, P2, 'P2') 
                this.pointNote(w, P3, 'P3') 
                this.pointNote(w, P4, 'P4') 
            })

            outline.push( 
                sp.LineTo(S1), sp.LineTo(P4), 
                sp.LineTo(r([0, D.flashWidth / 2 ], true)),
                sp.LineTo( r([0, D.flashWidth/ 2]) ),
                sp.LineTo(P3),
                sp.LineTo(P2),
                sp.LineTo(P1)
            )

            foldOutPath.push( 
                sp.MoveTo(P1), sp.LineTo( P4 ), 
                sp.MoveTo(g.symY(P1)), sp.LineTo( g.symY(P4) ) 
            );
            foldInPath.push( 
                sp.MoveTo(P3), sp.LineTo(P4),
                sp.MoveTo(g.symY(P3)), sp.LineTo(g.symY(P4))
            );
        }


        /* right lap */
        {

            foldOutPath.push( 
                sp.MoveTo(Sb), sp.LineTo(S2),
                sp.MoveTo(g.symY(Sb)), sp.LineTo(g.symY(S2))
            )

            const r = g.rotator(Sb, S2), frot = g.rotator(S2, g.symY(S2))

            outline.push(
                sp.LineTo(Sb),
                sp.LineTo( r([0, -D.flapWidth]) ), 
                sp.LineTo( r([0, -D.flapWidth], true) ), 
                sp.LineTo(S2)
            );

        /* front lap */
            outline.push( sp.LineTo( frot([0, -D.flapWidth]) ))
            foldOutPath.push( sp.MoveTo(S2), sp.LineTo(g.symY(S2)) )
        }

        /* connecting outline */
        { 
            const outlineR = sp.reverse(sp.transform(g.symY, outline)), first = outlineR.shift()
            outline.push( sp.LineTo(first.p), ... outlineR)
            outline.push( sp.LineTo(outline[0].p) )
        }
        w.setViewbox( sp.pointsOf(outline) );

        this.pointNote(w, S0, 'S0');
        this.pointNote(w, S1, 'S1');
        this.pointNote(w, S2, 'S2');
        this.pointNote(w, Sb, 'Sb');

        doAfter.forEach(cmd => cmd())

        w.path(outline);
        w.path(foldInPath, this.foldInStyle);
        w.path(foldOutPath, this.foldOutStyle);

        const points = sp.pointsOf(outline), boundingBox = [Math.min, Math.max].map( (f) => points.reduce((a,p) => a.map((x,i) => f(x, p[i])))),
            [width,height] = [0,1].map((i) => Math.ceil( boundingBox[1][i] - boundingBox[0][i]))

console.log('w=' + width)
console.log('h=' + height)

        return {width, height};
    };

    shape.buildForm = function($paramsCont, params){
        const D = $.extend({}, this.defaults, params);

        function _row(...args){
            $paramsCont.append(Fn.buildElem('div', { class: 'form-group row' }, ...args )) 
        }

        function _dim(name, title=''){
            return ['div', { class: 'col-3'},
                [ 'label', { for: 'input-' + name }, name + ' (cm)' ],
                [ 'input', { id: 'input-' + name, name: name, type: 'text', class: 'form-control form-control-sm', value: D[name], title: title } ]
            ];
        }
        
        _row(
            _dim('frontWidth', 'Bottom width of the diffuser in the front (further from flash)'), 
            _dim('backWidth', 'Bottom width of diffuser in the back (closer to flash)'), 
            _dim('topWidth'), 
            _dim('length', 'Length of the diffuser')
        );
        _row(
            _dim('up', 'Maximum height of the diffuser up from the flash plane'), 
            _dim('down'), 
            _dim('backShift')
        );
        _row(_dim('flashWidth'), _dim('flashLength'), _dim('flashHeight')); 
        _row(_dim('flapWidth'));
    };

    return shape;
};
