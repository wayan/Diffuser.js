if (typeof wayan == 'undefined'){
    var wayan = {};
}
wayan.SvgPath = function(){
    var sp = {}; 

    sp.MoveTo = (p) => { return { cmd: 'M', p: p } };
    sp.LineTo = (p) => { return { cmd: 'L', p: p } };
    sp.BezierQ = (p2, p) => { return { cmd: 'Q', p: p, p2: p2 } }

    sp.polyline = (points, closed = false) => 
        [ ... points.map((p,i) => i? sp.LineTo(p): sp.MoveTo(p)),
            ... ( closed? [ sp.LineTo(points[0]) ]: [] )
        ];

    sp.pointsOf = function(commands){
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

    sp.transform = function(tr, commands) { 
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

    sp._clone = function(command){
        const cp = {};
        for (const prop in command){
            cp[ prop ] = command[prop];
        }
        return cp;
    }

    sp.reverse = function(commands){
        const ret = [];
        let lcommand = sp.MoveTo([0,0]);
        commands.map(l => l).reverse().forEach(
            (command) => {
                lcommand.p = command.p;
                ret.push(lcommand);
                lcommand = sp._clone(command);
            }
        );
        return ret;
    };

    return sp;
};
