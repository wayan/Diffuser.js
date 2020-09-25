var Diffuser = (function(){
    function pointNote(w, p, title){
        const d2 = p['d2']? p.d2: p;
        w.text(title, d2);
    }

    const g = Geometry,
        pSymY = ( lines => [].concat(lines.map(g.d2),lines.reverse().map(g.d2).map(g.symY))),
        diffuser = function(){};

    diffuser.prototype.parseParams = function(p){
        return Object.keys(this.defaults)
            .filter(k => k in p)
            .reduce((acc,k) => {
                acc[k] = parseFloat(p[k]);
                return acc;
            }, {});
    };

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
            M1_1 = g.unfold(B2b, M2, M1.d3),
            B1   = g.unfold(B2b, M1_1, [x1, y1, -D.down]),
            M0_1 = g.unfold(B1, M1_1, M0.d3),
            B0   = g.unfold(B1, M1_1, [x1, 0, -D.down]),
            outline = pSymY([
                S0, 
                M0, 
                M1,
                g.flapPoint(M1.d2, M2.d2, -1, 1),
                g.flapPoint(M2.d2, M1.d2, 1, 2.5),
                M2.d2,
                g.flapPoint(M2.d2, M1_1.d2, -1, 2.5),
                g.flapPoint(M1_1.d2, M2.d2, 1, 1),
                M1_1.d2,
                g.flapPoint(M1_1.d2, M0_1.d2, - D.diffuserFlapWidth),
                g.flapPoint(M0_1.d2, M1_1.d2,  D.diffuserFlapWidth),
                M0_1.d2,
                B0,
                B1,
                g.flapPoint(B1.d2, B2b.d2, - D.diffuserFlapWidth),
                g.flapPoint(B2b.d2, B1.d2,  D.diffuserFlapWidth),
                B2b,
                g.flapPoint(B2b.d2, B2f.d2, - D.diffuserFlapWidth),
                g.flapPoint(B2f.d2, B2b.d2,  D.diffuserFlapWidth),
                B2f,
                g.flapPoint(B2f.d2, M3.d2, - D.diffuserFlapWidth),
                g.flapPoint(M3.d2, B2f.d2,  D.diffuserFlapWidth),
                M3,
                g.flapPoint(M3.d2, g.symY(M3.d2), - D.diffuserFlapWidth )
            ]);


        //console.log(JSON.stringify(['t2', v0, v1, [x2, y2, D.up]]));
		//w.setViewbox([ B0, B1, B2b, B2f, M0, M0_1, M1, M1_1, M2, M3, S0, S1, S2 ].map(g.d2).map(
			//p => [p, g.symY(p)] ).reduce( (a,pp) => a.concat(pp) ));

        w.setViewbox(outline);

        pointNote(w, S0, 'S0');
        pointNote(w, S1, 'S1');
        pointNote(w, M0, 'M0');
        pointNote(w, M1, 'M1');
        pointNote(w, S2, 'S2');
        pointNote(w, M2, 'M2');
        pointNote(w, M3, 'M3');
        pointNote(w, B2f, 'B2f');
        pointNote(w, B2b, 'B2b');
        pointNote(w, M1_1, 'M1_1');
        pointNote(w, B1, 'B1');
        pointNote(w, M0_1, 'M0_1');
        pointNote(w, B0, 'B0');

        w.polyline( outline.map(g.d2) );
        for(var sym of [false,true]){
            var t = sym? ( l => l.map(g.symY).reverse()): ( l => l );

            w.polyline(
                t([ B1, B2b, B2f, M3].map(g.d2)),
                this.foldOutStyle
            );
            w.polyline(
                t([ M3.d2, g.symY(M3.d2)]),
                this.foldOutStyle
            ),
            w.polyline(
                t([ M0_1, M1_1].map(g.d2)),
                this.foldInStyle
            );
            w.polyline(
                t([ M1, M2, M1_1].map(g.d2)),
                this.foldOutStyle
            );
            w.polyline(
                t([ M1_1, B1].map(g.d2)),
                this.foldOutStyle
            );
            w.polyline(
                t([ M2, B2b].map(g.d2)),
                this.foldInStyle
            );
            w.polyline( 
                t([ M2.d2, g.symY(M2.d2) ] ),
                this.foldInStyle
            );
            w.polyline( 
                t([ M1.d2, g.symY(M1.d2) ] ),
                this.foldOutStyle
            );
            w.polyline( 
                t([ M2.d2, B2f.d2 ] ),
                this.foldInStyle
            );
            w.polyline( 
                t([ M2.d2, M3.d2 ] ),
                this.foldInStyle
            );
        }
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
            Sout = g.unfold(S2, S1, g.intersect(S2.d3, S3.d3, 0, xf)),
            Sin = g.unfold(S3, S2, g.intersect(S1.d3, S2.d3, 0, xf)),
            Ft = g.unfold(S2, Sin, g.intersect(Sin.d3, Sout.d3, 2, 0)),
            Fb = g.unfold(S2, Sin, g.intersect(Sin.d3, Sout.d3, 2, -D.flashHeight)),
            yfb = Fb.d3[1] - D.flashLength,
            yft = Ft.d3[1] - D.flashLength,
            ffb = (p => p.map( (x,i) => i == 1? yft: x )),
            Ftb = g.unfold(Fb, Ft, ffb(Ft.d3)),
            Fbb = g.unfold(Fb, Ft, ffb(Fb.d3)),
            outline = pSymY([
                S0, S1, Ft,
                g.unfold(Ftb, Ft, [x0, Ft.d3[1], Ft.d3[2]]),
                g.unfold(Ftb, Ft, [x0, Ftb.d3[1], Ftb.d3[2]]),
                Fbb, Fb, S3,
                g.flapPoint(S3.d2, S2.d2, - D.diffuserFlapWidth),
                g.flapPoint(S2.d2, S3.d2,  D.diffuserFlapWidth),
                S2,
                g.flapPoint(S2.d2, g.symY(S2.d2), - D.diffuserFlapWidth)   
            ]),
            nothing = null;
            
        /* bounding box */
        //var points = (l => [].concat(l, l.map(g.symY)))([S0, S1, S2, S3, Ft, Fb, Ftb, Fbb].map(g.d2));
        w.setViewbox(outline);

        pointNote(w, S0, 'S0');
        pointNote(w, S1, 'S1');
        pointNote(w, S2, 'S2');
        pointNote(w, S3, 'S3');
        pointNote(w, Ft, 'Ft');
        pointNote(w, Fb, 'Fb');
        pointNote(w, Ftb, 'Ftb');
        pointNote(w, Fbb, 'Fbb');

        w.polyline(outline);

        for(var sym of [false,true]){
            var d2 = (l => l.map(g.d2)), tr = sym? ( l => d2(l).map(g.symY).reverse()): d2; 

            w.polyline(tr([Ft,Ftb]), this.foldInStyle);
            w.polyline(tr([Ft,Fb]), this.foldOutStyle);
            w.polyline(tr([S3,S2]), this.foldOutStyle);
            w.polyline(tr([S2.d2,g.symY(S2.d2)]), this.foldOutStyle);
            w.polyline(tr([S1,S2]), this.foldInStyle);
        }

        w.path(
            [
                w.pathMoveTo(Ftb.d2),
                w.pathBezierQ(Fb.d2, Fbb.d2)
            ]
        );

        return;
    };
    return ((shape) => shape == 1? shape1:shape2);
})();
