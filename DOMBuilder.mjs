/*
Svg/HTML DOM generation
*/
const SVGNamespaceURI = 'http://www.w3.org/2000/svg'

function _buildElem(createElement, subject, ... contents ){
    const elem = isNode(subject)? subject: createElement(subject)

    let first = true
    for( let c of contents ){
        if (! (c instanceof Object) ){  
            elem.appendChild( document.createTextNode(c) )
        }
        else if ( c instanceof Array ){
            elem.appendChild( _buildElem(createElement, ... c) )
        }
        else if (isNode(c)){
            elem.appendChild( c )
        }
        else if (first ){
            /* attributes */
            setAttr(elem, c)
        }
        first = false
    }

    return elem;
}

export function buildSvg(... args){
    return _buildElem(name => document.createElementNS(SVGNamespaceURI, name), ... args);
}

export function buildHtml(... args){
    return _buildElem(name => document.createElement(name), ... args);
}

function isNode(arg) {
    return arg instanceof Object && typeof arg.nodeType !== 'undefined'; 
}    

function createElement (localname) { 
    return document.createElementNS(SVGNamespaceURI, localname);
}

function attrValue(v, name){
    if (v instanceof Object && name == 'style'){
        return buildStyle(v)
    }
    return v
}

function setAttr(elem, c){
    /* style is special */
    for(const prop in c){
        const v = c[prop]
        if (v !== false ){
            elem.setAttribute(prop, attrValue(v,prop));
        }
    }
}

function buildElem(subject, ... contents){
    const elem = isNode(subject)? subject: createElement(subject)

    let first = true
    for( let c of contents ){
        if (! (c instanceof Object) ){  
            elem.appendChild( document.createTextNode(c) )
        }
        else if ( c instanceof Array ){
            elem.appendChild( buildElem(... c) )
        }
        else if (isNode(c)){
            elem.appendChild( c )
        }
        else if (first ){
            /* attributes */
            setAttr(elem, c)
        }
        first = false
    }

    return elem;
} 


function buildStyle(style){
    return Object.entries(style).map(([k,v]) => k + ':' + v).join(';');
}

function serialize(elem){
    const serializer = new XMLSerializer();
    return serializer.serializeToString(elem);
}

export default { buildSvg, buildHtml, serialize };
