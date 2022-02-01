
jQuery(function($){
    const url = new URL(location.href), sp = url.searchParams;

    let shape = sp.get('shape');
    if (!shape){
        shape = 'a=2,c=3'
        sp.set('shape', shape)

        url.search = sp.toString()
        window.location.replace(url);
    }

    const $form = $('form'), params = {
        length: 4.5,
        frontWidth: 20,
        backWidth: 18,
        topWidth: 8
    }
        
    Object.keys(params)
        .map((k) => {
            const v = params[k];    
            return Fn.buildElem(
                'div', { class: 'form-group row' },
                    [ 'label', { class: "col-sm-2 col-form-label" }, k ],
                    [
                        'div', { class: 'col-sm-10' },
                            [ 'input', { type: 'text', class: 'form-control', value: v } ]
                    ]
            );
        })
        .forEach((e) => $form.append(e))
});
