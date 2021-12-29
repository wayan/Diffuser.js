import db from './DOMBuilder.mjs'

function parseBoolean(v){
    return v != '0' && v != '' && v != 'false' && v != 'no';
}

/* parses dimension - float */
function parseDim(str){
    str = str.replaceAll( /[\s_]/g, '')
    str = str.replace( /,/, '.')
    return parseFloat(str);
}

function extractDim(name, query, def_value){
    if (name in query && query[name].length > 0 ){
        const dim = parseDim(query[name])
        if (!isNaN(dim) && dim >= 0){
            return dim
        }
    }
    return def_value
}

const defaultDims = {
    /* basic dimensions */
    depth: 18, 
    width: 24, 
    height: 9, 
    lensRadius: 3, 
    lensAroundWidth: 2.5,

    /* flash position */
    flashWidth:  6.0,
    flashHeight: 3.6,
    flashBottomHeight: 11.5,
    flashBackShift: 5,
    flashFlapDepth: 3,

    reflectorThickness: 0.1,    
    flashCoverDepth: 3.0,

    frontFlapWidth: 1.2, 
    frontFlapDepth: 2.0, 
    frontFlapThickness: 0.8, 
    frontFlapSocketThickness: 0.6
}

/* parsing params */
function parseParams(query, defaultsIn = {}){
    const defaults = { 
        ... defaultDims,
        /* deaults in overrides defaults but are overridden by query */
        ... defaultsIn
    }, 
    sent = 'sent' in query,
    C = { sent };

    Object.entries(defaults).forEach(
        ([k, def_value]) => {
            /* everything other is a dimension */
            C[k] = extractDim( k, query, def_value)
        }
    );
    return C;
}

function buildForm(C){

    //const $paramsCont = $('#concave-params-body');
    function _row(...args){
        return [ 'div', { class: 'form-group row' }, ...args ] 
    }

    function _xdim(name, title=''){
        return ['div', { class: 'col-3'},
            [ 'label', { for: 'input-' + name }, (title || name) + ' (cm)' ],
            [ 'input', { id: 'input-' + name, name, type: 'text', class: 'form-control form-control-sm form-control-inline', value: C[name], title: title } ]
        ];
    }

    function _dim(name, title=''){
        return [
            [ 'label', { for: 'input-' + name, class: 'text-right col-sm-2 col-form label' }, (title || name) + ' (cm)' ],
            [ 'input', { id: 'input-' + name, name, type: 'text', class: 'col-sm-1 form-control form-control-sm form-control-inline', value: C[name], title: title } ]
        ];
    }


    const $container = $(
  '<div class="container">'
+ '    <h2>Dimensions'
+ '        <button class="btn btn-link d-none" type="button" id="concave-params-show">show</button>'
+ '        <button class="btn btn-link d-none" type="button" id="concave-params-hide">hide</button>'
+ '    </h2>'
+ ''
+ '    <div id="concave-params-form-cont">'
+ '            <div class="concave-params-body"></div>'
+ '            <div class="form-group row">'
+ '                <div class="col-sm-12 col-12">'
+ '                    <button type="submit" class="btn btn-primary">Redraw the diffuser</button>'
+ '                </div>'
+ '            </div>'
+ '    </div>'
+ '</div>'
),
    $body = $('.concave-params-body', $container)

    const rows = [ 
        ['input', {type:'hidden', value:1, name:'sent'}  ],
        _row(
            ... _dim('width',  'Width'), 
            ... _dim('height', 'Height'), 
            ... _dim('depth',  'Depth'), 
            ... _dim('lensRadius', 'Lens tube radius')
        ),
        _row(
           ... _dim('flashWidth',  'Flash head width'),
           ... _dim('flashHeight', 'Flash head height'),
           ... _dim('flashBottomHeight', 'Flash bottom height'),
           ... _dim('flashBackShift', 'Flash back shift')
        ),

        _row(
            ... _dim('flashCoverDepth', 'Flash flap depth'),
            ... _dim('lensAroundWidth', 'Width around lens')
        ),

        _row(
            ... _dim('frontFlapWidth', 'Diffuser flap width'),
            ... _dim('frontFlapDepth', 'Diffuser flap depth'),
            ... _dim('frontFlapThickness', 'Diffuser flap thickness'),
            ... _dim('frontFlapSocketThickness', 'Reflector flap thickness')
        )

/*
        _row(
    ...        _dim('reflectorThickness',  'Reflector thickness'),
        )
*/
    ]
    rows.forEach(e => $body.append(db.buildHtml(... e)))

    return $container
}

export default { parseParams, buildForm, parseDim, extractDim }


