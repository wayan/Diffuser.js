var Diffuser = (function(){
    const g = Geometry,
        pSymY = ( line => [].concat(line, line.map(g.symY).reverse())),
        diffuser = function(){};

    diffuser.prototype.parseParams = function(p){
        return Object.keys(this.defaults)
            .filter(k => k in p)
            .reduce((acc,k) => {
                acc[k] = parseFloat(p[k]);
                return acc;
            }, {});
    };

    diffuser.prototype.pointNote = function(w, p, title){
        w.text(title, p);
    }

    diffuser.prototype.foldInStyle  = { 'stroke-dasharray': '10 10', 'stroke-width': 1 };
    diffuser.prototype.foldOutStyle = { 'stroke-dasharray': '8 5 3 5', 'stroke-width': 1 }; 

    const shape1 = new diffuser(); 
    shape1.defaults = {
        flashWidth:  6.5,
        flashLength:  6,
        flashHeight:  3,
        frontLength: 12,
        backLength:  8,
        middleWidth: 18,
        middleLength: 8,
        frontWidth: 22,
        middleMargin:  2.5,
        up: 2,
        down: 5,
        diffuserFlapWidth: 1.5 
    };
    shape1.create = function(params, w){
        const 
            D = $.extend({}, this.defaults, params),
            g = Geometry,
            y0 = 0,
            y1 = D.flashLength,
            y2 = y1 + D.backLength,
            y3 = y2 + D.frontLength,
            y2_b = y2 - D.middleLength / 2,
            y2_f = y2 + D.middleLength / 2,
            x0 = 0,
            x1 = D.flashWidth / 2,
            x2 = D.middleWidth / 2,
            x3 = D.frontWidth / 2,
            x2_b = x2 + D.middleMargin,
            S0 = g.proj([0, 0, 0]),
            S1 = g.proj([0, y1, 0]),
            M0 = g.proj([x1, 0, 0]),
            M1 = g.proj([x1, y1, 0]),
            S2 = g.unfold(S1, M1, [0, y2, D.up ]),
            M2 = g.unfold(S1, M1, [x2, y2, D.up]),
            M3 = g.unfold(S2, M2, [x3, y3, -D.down]),
            B2f = g.unfold(M3, M2, [x2_b, y2_f, -D.down]),
            B2b = g.unfold(B2f, M2, [x2_b, y2_b, -D.down]),
            M1_1 = g.unfold(B2b, M2, g.d3(M1)),
            B1   = g.unfold(B2b, M1_1, [x1, y1, -D.down]),
            M0_1 = g.unfold(B1, M1_1, g.d3(M0)),
            B0   = g.unfold(B1, M1_1, [x1, 0, -D.down]);

        const outline = [], pushLines = (points) => points.forEach( (p) => outline.push(w.LineTo(p)) );

        outline.push( w.LineTo(M0), w.LineTo(M1));

        const connectionFlap = function(M1, M2, dx1, dx2){
            const l = g.rotator(M1, M2), r = g.rotator(M2, M1), dy = 1.5, ww = 0.5;
            pushLines([ 
                l( [dx1 + ww , 0] ), 
                l( [ dx1 + ww, - ww] ),
            ]);

            w.roundPath(outline, 0.2);

            pushLines([ l( [ dx1 , - ww ]) ]);

            w.roundPath(outline, 0.2);

            pushLines([
                l([dx1, - dy]), 
                r( [dx2, dy]) 
            ])

            w.roundPath(outline, 0.3)

            pushLines([
                r( [ dx2 , ww ]),
            ])

            w.roundPath(outline, 0.3)

            pushLines([
                r( [ dx2 + ww, ww ]),
                //r( [ dx + dy / 3, dy / 3 ]),
                // r( [ dx,  dy / 3] ),
                r([dx2 + ww, 0]) 
            ])

            w.roundPath(outline, 0.2)
            pushLines([M2]);
            w.roundPath(outline, 0.2)
        }

        connectionFlap(M1, M2, 1.5, 2.2);
        connectionFlap(M2, M1_1, 2.2, 1.5);

        { 
            const fp1 = g.flapPoint(M1_1, M0_1, - D.diffuserFlapWidth),
                fp2 = g.flapPoint(M0_1, M1_1,  D.diffuserFlapWidth);

            const [p1, p2, p3 ] = g.roundPoints(M1_1, fp1, fp2, 0.5);
            outline.push( w.LineTo(fp1) )

            //outline.push( w.LineTo( p1 ) )
            //outline.push( w.BezierQ(p2, p3) )
            outline.push( w.LineTo(fp2)  )
            w.roundPath( outline, 0.4 )
            outline.push( w.LineTo(M0_1) )
        }

        pushLines([
            B0,
            B1,
            g.flapPoint(B1, B2b, - D.diffuserFlapWidth),
            g.flapPoint(B2b, B1,  D.diffuserFlapWidth),
            B2b,
            g.flapPoint(B2b, B2f, - D.diffuserFlapWidth),
            g.flapPoint(B2f, B2b,  D.diffuserFlapWidth),
            B2f,
            g.flapPoint(B2f, M3, - D.diffuserFlapWidth),
            g.flapPoint(M3, B2f,  D.diffuserFlapWidth),
            M3,
            g.flapPoint(M3, g.symY(M3), - D.diffuserFlapWidth)
        ])


        w.transformPath(g.symY, outline).reverse().forEach( (command) => outline.push(command));
        outline.push(w.LineTo(M0));
        outline.unshift(w.MoveTo(M0));

        w.setViewbox(w.pathPoints(outline))

        this.pointNote(w, S0, 'S0');
        this.pointNote(w, S1, 'S1');
        this.pointNote(w, M0, 'M0');
        this.pointNote(w, M1, 'M1');
        this.pointNote(w, S2, 'S2');
        this.pointNote(w, M2, 'M2');
        this.pointNote(w, M3, 'M3');
        this.pointNote(w, B2f, 'B2f');
        this.pointNote(w, B2b, 'B2b');
        this.pointNote(w, M1_1, 'M1_1');
        this.pointNote(w, B1, 'B1');
        this.pointNote(w, M0_1, 'M0_1');
        this.pointNote(w, B0, 'B0');

        const foldInPath = [], foldOutPath = [];

        [ (l => l), g.symY ].forEach( (t) => {
            foldOutPath.push(
                w.MoveTo(t(B1)),
                w.LineTo(t(B2b)),
                w.LineTo(t(B2f)),
                w.LineTo(t(M3)),

                w.MoveTo(t(M1)),
                w.LineTo(t(M2)),
                w.LineTo(t(M1_1)),

                w.LineTo(t(B1))
            );

            foldInPath.push(
                w.MoveTo(t(M0_1)),
                w.LineTo(t(M1_1)),
                w.MoveTo(t(B2b)),
                w.LineTo(t(M2 )),
                w.LineTo(t(B2f)),
                w.MoveTo(t(M2 )),
                w.LineTo(t(M3))
            );
        });

        foldOutPath.push(
            w.MoveTo(M1), w.LineTo(g.symY(M1)),
            w.MoveTo(M3), w.LineTo(g.symY(M3))
        );
        foldInPath.push(w.MoveTo(M2), w.LineTo(g.symY(M2)));

        w.path2( outline );
        w.path2( foldOutPath, this.foldOutStyle );
        w.path2( foldInPath, this.foldInStyle );

        return;
    };

    const shape2 = new diffuser();
    shape2.defaults = {
        strapWidth: 2,
        flashWidth:  6.5,
        flashLength: 6,
        flashHeight: 4,
        length: 22,
        backWidth: 6.5,
        backMargin: 1.5,
        frontWidth: 18,
        maxWidth:   24,
        up: 3.5,
        down: 5,
        diffuserFlapWidth: 1.5 
    };
    shape2.create = function(params, w){
        const D = $.extend({}, this.defaults, params),
            g = Geometry,
            y0 = 0,
            y1 = y0 + D.length,
            x0 = 0,
            x1 = D.backWidth / 2,
            x2 = x1 + D.backMargin,
            x3 = D.frontWidth / 2,
            xf = D.flashWidth / 2,
            S0 = g.proj([x0, y0, D.up]),
            S1 = g.proj([x1, y0, D.up]),
            S2 = g.unfold(S0, S1, [x3, y1, -D.down]),
            S3 = g.unfold(S2, S1, [x2, y0, -D.down]);
            Sout = g.unfold(S2, S1, g.intersect(g.d3(S2), g.d3(S3), 0, xf)),
            Sin = g.unfold(S3, S2, g.intersect(g.d3(S1), g.d3(S2), 0, xf)),
            Ft = g.unfold(S2, Sin, g.intersect(g.d3(Sin), g.d3(Sout), 2, 0)),
            Fb = g.unfold(S2, Sin, g.intersect(g.d3(Sin), g.d3(Sout), 2, -D.flashHeight)),
            yfb = g.d3(Fb)[1] - D.flashLength,
            yft = g.d3(Ft)[1] - D.flashLength,
            ffb = (p => p.map( (x,i) => i == 1? yft: x )),
            Ftb = g.unfold(Fb, Ft, ffb( g.d3(Ft))),
            Fbb = g.unfold(Fb, Ft, ffb( g.d3(Fb))),
            outline = [];

            [
                S1, Ft,
                g.unfold(Ftb, Ft, [x0,  g.d3(Ft)[1],  g.d3(Ft)[2]]),
                g.unfold(Ftb, Ft, [x0,  g.d3(Ftb)[1], g.d3(Ftb)[2]]),
                Fbb, Fb, S3,
                g.flapPoint(S3, S2, - D.diffuserFlapWidth),
                g.flapPoint(S2, S3,  D.diffuserFlapWidth),
                S2,
                g.flapPoint(S2, g.symY(S2), - D.diffuserFlapWidth)   
            ].forEach( p => outline.push(w.LineTo(p)));
                
            
            /* bounding box */
            //var points = (l => [].concat(l, l.map(g.symY)))([S0, S1, S2, S3, Ft, Fb, Ftb, Fbb].map(g.d2));

        w.transformPath(g.symY, outline).reverse().forEach(command => outline.push(command))
        outline.unshift( w.MoveTo(S0) );
        outline.push(w.LineTo(S0));
        w.setViewbox( w.pathPoints(outline) );

        this.pointNote(w, S0, 'S0');
        this.pointNote(w, S1, 'S1');
        this.pointNote(w, S2, 'S2');
        this.pointNote(w, S3, 'S3');
        this.pointNote(w, Ft, 'Ft');
        this.pointNote(w, Fb, 'Fb');
        this.pointNote(w, Ftb, 'Ftb');
        this.pointNote(w, Fbb, 'Fbb');

        const foldInPath = [], foldOutPath = [];

        for(var sym of [false,true]){
            var trp = (sym? g.symY: (l=>l) );

            foldInPath.push(
                w.MoveTo( trp(Ft) ),
                w.LineTo( trp(Ftb) ),
                w.MoveTo( trp(S1) ),
                w.LineTo( trp(S2) )
            );

            foldOutPath.push(
                w.MoveTo(trp(Ft)),
                w.LineTo(trp(Fb)),
                w.MoveTo(trp(S3)),
                w.LineTo(trp(S2))
            );
        }

        foldOutPath.push(w.MoveTo(S2),w.LineTo(g.symY(S2)));

        w.path2(outline);
        w.path2(foldInPath, this.foldInStyle);
        w.path2(foldOutPath, this.foldOutStyle);

        return;
    };

    const shapes = {
        '1' : ()=>shape1,
        '2' : ()=>shape2,
        '3' : ()=>DiffuserShape3(diffuser),
        '4' : ()=>DiffuserShort(diffuser)
    }
    return ((shape) => shapes[ shapes[shape] ? shape: 1 ]() );
})();
