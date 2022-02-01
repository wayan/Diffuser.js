if (typeof wayan == 'undefined'){
    var wayan = {};
}
wayan.ConcaveParams = function(){
    const cp = {}, Fn = wayan.Fn();

    function parseBoolean(v){
        return v != '0' && v != '' && v != 'false' && v != 'no';
    }

    /* parsing params */
    cp.parseParams = function(query, defaultsIn = {}){
        const defaultDims = {
            lensRadius: 2.7, 
            depth: 18, 
            width: 24, 
            height: 9, 
            complete: 0,
            wrapWidth: 2.5,
            wrapDeg : 120,
            complete: true,
            angles: 360,
            reflectorThickness: 0.1,    
            flashTop: 11.2,
            flashWidth: 6.0,
            flashCoverDepth: 3.0,
            flashCoverHeight: 4.0, 
            sliceAt: 2.0,
            frontFlapDepth: 1.5, 
            frontFlapWidth: 1.5 ,
            flashHeight: 3
        },
        defaults = { 
            ... defaultDims,
            ppi : 157,
            showGrid: true,
            frontShape: '1',
            sideShape: '1',
            showFrontFlaps: true,
            raysPrecision: 1.5,
            /* deaults in overrides defaults but are overridden by query */
            ... defaultsIn
        }, 
        sent = 'sent' in query,
        defaultViews = [ 'unfold' ],
        defaultCuts = [ 'diffuser' ],
        C = { sent };

        Object.keys(defaults).forEach(k => {
            if ( ['complete', 'showGrid', 'sent'].includes(k) ){
                C[k] = k in query? parseBoolean(query[k]): sent? false: defaults[k];
                return;
            }

            if (! (k in query) ){
                C[k] = defaults[k];
                return;
            }

            const v = query[k];
            C[k] = [ ... Object.keys(defaultDims), 'ppi'].includes(k)
                ? parseFloat(v) 
                : ['angles'].includes(k)
                ? parseInt(v)
                : ['frontShape', 'sideShape'].includes(k)
                ? (['1','2','3', '4'].includes(v)? v: defaults[k])
                : v;
        });
        C.views = ['unfold', 'front', 'side', 'top', 'slice'].filter(v => {
            const k = 'view_' + v;
            return k in query? parseBoolean(query[k]): sent? false: defaultViews.includes(v);
        });

        const cuts = ['diffuser', 'reflector'].filter(v => {
            const k = 'view_' + v;
            return k in query? parseBoolean(query[k]): sent? false: defaultCuts.includes(v);
        });

        C.cuts = cuts.length ? cuts: defaultCuts
        return C;
    };

    cp.buildForm = function(C){
        const $paramsCont = $('#concave-params-body');

        function _row(...args){
            $paramsCont.append(Fn.buildElem('div', { class: 'form-group row' }, ...args )) 
        }

        function _dim(name, title=''){
            return ['div', { class: 'col-3'},
                [ 'label', { for: 'input-' + name }, name + ' (cm)' ],
                [ 'input', { id: 'input-' + name, name: name, type: 'text', class: 'form-control form-control-sm', value: C[name], title: title } ]
            ];
        }

        $paramsCont.append(Fn.buildElem(
            'div', { class: 'form-group row' },
            ['div', { class: 'col-3'},
                [ 'label', { for: 'input-ppi' }, 'PPI' ],
                [ 'input', { id: 'input-ppi', name: 'ppi', type: 'text', class: 'form-control', value: C.ppi } ]
            ],
            ['div', { class: 'col-3'},
                [ 'label', { for: 'input-showGrid' }, 'Show grid?' ],
                [ 'input', { id: 'input-showGrid', name: 'showGrid', type: 'checkbox', class: 'form-control', value: 1, checked: C.showGrid } ]
            ],
            ['div', { class: 'col-6'}, ['input', {type:'hidden', value:1, name:'sent'}  ]]
        ));
        $paramsCont.append(Fn.buildElem('hr'));
        _row(
            _dim('width',  'Width'), 
            _dim('height', 'Height'), 
            _dim('depth',  'Depth'), 
            _dim('lensRadius', 'Lens radius')
        );
        _row(
            _dim('wrapWidth',  'Wrap width'), 
            _dim('wrapDeg',  'Wrap angle'),
            _dim('reflectorThickness',  'Reflector thickness'),
        );
        _row(
            _dim('flashTop',  'Flash top'),
            _dim('flashWidth',  'Flash width'),
            _dim('flashCoverDepth', 'Flash cover depth'),
            _dim('flashCoverHeight', 'Flash cover height'),
        );
        _row(
            ... [ 'diffuser', 'reflector' ].map(v => {
                const name = 'view_' + v;
                return ['div', { class: 'col-3'},
                    [ 'label', { for: 'input-' + name  }, 'View ' + v + '?' ],
                    [ 'input', { id: 'input-' + name, name: name, type: 'checkbox', class: 'form-control', value: 1, checked: C.cuts.includes(v) } ]
                ];
            })
        );
        _row(
            ... [ 'unfold', 'front', 'top', 'side', 'slice' ].map(v => {
                const name = 'view_' + v;
                return ['div', { class: 'col-2'},
                    [ 'label', { for: 'input-' + name  }, 'View ' + v + '?' ],
                    [ 'input', { id: 'input-' + name, name: name, type: 'checkbox', class: 'form-control', value: 1, checked: C.views.includes(v) } ]
                ];
            })
        );
        _row(
            ['div', { class: 'col-3'},
                [ 'label', { for: 'input-complete' }, 'Complete sketch (both halves)' ],
                [ 'input', { id: 'input-complete', name: 'complete', type: 'checkbox', class: 'form-control', value: 1, checked: C.complete } ]
            ],
            ['div', { class: 'col-3'},
                [ 'label', { for: 'input-frontShape' }, 'Front shape' ],
                [ 'select', { id: 'input-frontShape', name: 'frontShape', class: 'form-control'},
                    ... [ ['1', 'Shape 1'], ['2', 'Shape 2']  ].map(
                        ([value,descr]) => [ 'option', { value, selected: C.frontShape == value }, descr ]
                    )
                ]
            ],
            ['div', { class: 'col-3'},
                [ 'label', { for: 'input-sideShape' }, 'Side shape' ],
                [ 'select', { id: 'input-sideShape', name: 'sideShape', class: 'form-control'},
                    ... [ ['1', 'Shape 1'], ['2', 'Shape 2']  ].map(
                        ([value,descr]) => [ 'option', { value, selected: C.sideShape == value }, descr ]
                    )
                ]
            ]
        );
        $('#concave-params-toggle').click(function(){
            $('#concave-params-form-cont').toggleClass('d-none');
        });

        if (C.sent){
            $('#concave-params-form-cont').removeClass('d-none');
        }
    };
    return cp;
};
