var DiffuserShort = function(diffuser){
    const shape = new diffuser();
    shape.defaults = {
        frontWidth: 22,
        middleWidth: 22,
        backWidth:  9,
        frontLength: 12,
        backLength: 6,
        flapWidth: 1.5,
        flashWidth:  6.5,
        flashLength: 6,
        flashHeight: 3,
        frontDown: 0,
        backDown:  10,
        backSkew:  2 
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
            _dim('middleWidth'),
            _dim('backSkew') 
        );
        _row(
            _dim('frontLength', 'Length of the diffuser'),
            _dim('backLength'), 
            _dim('frontDown'), 
            _dim('backShift')
        );
        _row(_dim('flashWidth'), _dim('flashLength'), _dim('flashHeight')); 
        _row(_dim('flapWidth'));
    };
    shape.create = function(params, w){
        const D = $.extend({}, this.defaults, params),
            show = 'f',
            g = Geometry, 
            sp = SvgPath,
            y0 = 0,
            y1 = y0 + D.backLength,
            y2 = y1 + D.frontLength,
            x0 = 0,
            x1 = x0 + D.backWidth / 2,
            x2 = x0 + D.middleWidth / 2 ,
            x3 = x0 + D.frontWidth / 2, 
            S0 = g.proj([x0, y0, 0]),
            S1 = g.proj([x1, y0,0]),
            S2 = g.proj([x2, y1, 0]),
            S3 = g.proj([x3, y2, 0]),
            backSkew = g.unit(
                g.vectorMulti( g.dir(g.d3(S2), g.d3(S1)), [ 0, 0, 10] ),
                D.backSkew
            ),
            b1 = g.add( g.add(g.d3(S1),[0,0, D.backDown]), backSkew),
            _b2 = g.add( g.add(g.d3(S2), [0,0,D.backDown]), backSkew),
            b2  = g.planeLineIntersect( [g.d3(S2), g.d3(S3), g.add(g.d3(S3), [0,0,10])], [b1, _b2]),
            b3 = g.add(g.d3(S3), [0,0,D.frontDown]),
            B3 = g.unfold(S3, S2, b3),
            B2 = g.unfold(S3, S2, b2),
            B1 = g.unfold( B2, S2, b1),
            S1_1 = g.unfold(B2, S2, g.d3(S1)),
            foldInPath = [], 
            foldOutPath = [], 
            doAfter = [],
            outline = [];

        console.log(backSkew);

        if (show == 'c'){
            const left = [S1, S2, S1_1, B1, B2, B3, S3];
            //const left = [S1, S2, S3];
            outline.push( ... sp.polyline([
                ... left,
                ... left.map(g.symY).reverse()
            ], true) );

            foldInPath.push(
                ... sp.polyline([S3,S2,B2]),
                ... sp.polyline([S3,S2,B2].map(g.symY))
            );
        }
        if (show == 'm'){
            const left = [S1, S2, S3];
            outline.push( ... sp.polyline([
                ... left,
                ... left.map(g.symY).reverse()
            ], true) );
        }

        if (show == 'f'){
            outline.push(
                ... sp.polyline([S2, S1_1, B1, B2, B3], true)
            );
            foldInPath.push(... sp.polyline([S2,B2]));
        }

        w.setViewbox( [ ... sp.pointsOf(outline)  ] );
        w.path(outline);
        if (foldInPath.length > 0){
            w.path(foldInPath, this.foldInStyle);
        }
        if (foldOutPath.length > 0){
            w.path(foldOutPath, this.foldOutStyle);
        }

    };


    return shape;
};
