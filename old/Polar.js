if (typeof wayan == 'undefined'){
    var wayan = {};
}
wayan.Polar = function(){
    const polar = {}, pi =  Math.PI;

    polar.circlePoint = (r, angle) => [ r*Math.cos(angle), r*Math.sin(angle) ];

    polar.elipsisRadius = (a, b, angle) =>  {
        const a2 = a*a, b2 = b * b, sin = Math.sin(angle);

        return Math.sqrt( a2 *  b2 / ( b2 + (a2 - b2)*sin*sin)); 
    };

    polar.elipsisPoint = (a,b,angle) => polar.circlePoint( polar.elipsisRadius(a, b ,angle) , angle );

    polar.deg = (angle) => 180 * angle / pi;

    return polar;

};

