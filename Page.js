jQuery(function($){
    function getParams(){
        const url = new URL(location.href),
            searchParams = new URLSearchParams(url.search), params = {};

        searchParams.forEach((v,k) => {
            const vv = v.replace(/^\s+/, '').replace(/\s+$/,'');
            if (vv.length > 0){
                params[k] = v 
            }
        })
        return params;
    }
    const params = getParams(),
        ppi = ('ppi' in params? parseFloat(params.ppi): 157), 
        showGrid = ('showGrid' in params),
        w = new Drawing({ 
            magnify: ppi / 2.54, 
            showGrid: showGrid
        }),
        shape = params['shape'] || 3,
        diffuser = Diffuser(shape),
        D = diffuser.parseParams(params);

    $('#download-svg-button').click((e) => {
        const content = Fn.serializeSvg( $('svg') ),
        blob = new Blob([content], {type: "image/svg+xml;charset=utf-8"});
        saveAs(blob, "diffuser.svg");
        return false;
    });

    const $paramsCont = $('#diffuser-params-body')
    $paramsCont.append(Fn.buildElem(
        'div', { class: 'form-group row' },
            ['div', { class: 'col-3'},
                [ 'label', { for: 'input-ppi' }, 'PPI' ],
                [ 'input', { id: 'input-ppi', name: 'ppi', type: 'text', class: 'form-control', value: ppi } ]
            ],
            ['div', { class: 'col-3'},
                [ 'label', { for: 'input-showGrid' }, 'Show grid?' ],
                [ 'input', { id: 'input-showGrid', name: 'showGrid', type: 'checkbox', class: 'form-control', value: 1, checked: showGrid } ]
            ],
            ['div', { class: 'col-6'}, ['input', {type:'hidden', value:1, name:'sent'}  ]]
    ));
    $paramsCont.append(Fn.buildElem('hr'));

    $('#diffuser-params-toggle').click(function(){
        $('#diffuser-params-form-cont').toggleClass('d-none');
    });

    if ('sent' in params){
        $('#diffuser-params-form-cont').removeClass('d-none');
    }

    diffuser.buildForm($paramsCont, D)
    diffuser.create(D, w);
});
