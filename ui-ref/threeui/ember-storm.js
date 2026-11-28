(()=>{var Ku=Object.create;var $a=Object.defineProperty;var Xu=Object.getOwnPropertyDescriptor;var Ju=Object.getOwnPropertyNames;var Zu=Object.getPrototypeOf,$u=Object.prototype.hasOwnProperty;var Ie=(e,t)=>()=>{try{return t||e((t={exports:{}}).exports,t),t.exports}catch(n){throw t=0,n}};var ed=(e,t,n,r)=>{if(t&&typeof t=="object"||typeof t=="function")for(let o of Ju(t))!$u.call(e,o)&&o!==n&&$a(e,o,{get:()=>t[o],enumerable:!(r=Xu(t,o))||r.enumerable});return e};var Nt=(e,t,n)=>(n=e!=null?Ku(Zu(e)):{},ed(t||!e||!e.__esModule?$a(n,"default",{value:e,enumerable:!0}):n,e));var dl=Ie(C=>{"use strict";var dn=Symbol.for("react.element"),td=Symbol.for("react.portal"),nd=Symbol.for("react.fragment"),rd=Symbol.for("react.strict_mode"),od=Symbol.for("react.profiler"),id=Symbol.for("react.provider"),ad=Symbol.for("react.context"),ld=Symbol.for("react.forward_ref"),sd=Symbol.for("react.suspense"),cd=Symbol.for("react.memo"),ud=Symbol.for("react.lazy"),el=Symbol.iterator;function dd(e){return e===null||typeof e!="object"?null:(e=el&&e[el]||e["@@iterator"],typeof e=="function"?e:null)}var rl={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},ol=Object.assign,il={};function jt(e,t,n){this.props=e,this.context=t,this.refs=il,this.updater=n||rl}jt.prototype.isReactComponent={};jt.prototype.setState=function(e,t){if(typeof e!="object"&&typeof e!="function"&&e!=null)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,e,t,"setState")};jt.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,"forceUpdate")};function al(){}al.prototype=jt.prototype;function zo(e,t,n){this.props=e,this.context=t,this.refs=il,this.updater=n||rl}var Ro=zo.prototype=new al;Ro.constructor=zo;ol(Ro,jt.prototype);Ro.isPureReactComponent=!0;var tl=Array.isArray,ll=Object.prototype.hasOwnProperty,Mo={current:null},sl={key:!0,ref:!0,__self:!0,__source:!0};function cl(e,t,n){var r,o={},i=null,a=null;if(t!=null)for(r in t.ref!==void 0&&(a=t.ref),t.key!==void 0&&(i=""+t.key),t)ll.call(t,r)&&!sl.hasOwnProperty(r)&&(o[r]=t[r]);var l=arguments.length-2;if(l===1)o.children=n;else if(1<l){for(var s=Array(l),u=0;u<l;u++)s[u]=arguments[u+2];o.children=s}if(e&&e.defaultProps)for(r in l=e.defaultProps,l)o[r]===void 0&&(o[r]=l[r]);return{$$typeof:dn,type:e,key:i,ref:a,props:o,_owner:Mo.current}}function pd(e,t){return{$$typeof:dn,type:e.type,key:t,ref:e.ref,props:e.props,_owner:e._owner}}function No(e){return typeof e=="object"&&e!==null&&e.$$typeof===dn}function fd(e){var t={"=":"=0",":":"=2"};return"$"+e.replace(/[=:]/g,function(n){return t[n]})}var nl=/\/+/g;function Po(e,t){return typeof e=="object"&&e!==null&&e.key!=null?fd(""+e.key):t.toString(36)}function ir(e,t,n,r,o){var i=typeof e;(i==="undefined"||i==="boolean")&&(e=null);var a=!1;if(e===null)a=!0;else switch(i){case"string":case"number":a=!0;break;case"object":switch(e.$$typeof){case dn:case td:a=!0}}if(a)return a=e,o=o(a),e=r===""?"."+Po(a,0):r,tl(o)?(n="",e!=null&&(n=e.replace(nl,"$&/")+"/"),ir(o,t,n,"",function(u){return u})):o!=null&&(No(o)&&(o=pd(o,n+(!o.key||a&&a.key===o.key?"":(""+o.key).replace(nl,"$&/")+"/")+e)),t.push(o)),1;if(a=0,r=r===""?".":r+":",tl(e))for(var l=0;l<e.length;l++){i=e[l];var s=r+Po(i,l);a+=ir(i,t,n,s,o)}else if(s=dd(e),typeof s=="function")for(e=s.call(e),l=0;!(i=e.next()).done;)i=i.value,s=r+Po(i,l++),a+=ir(i,t,n,s,o);else if(i==="object")throw t=String(e),Error("Objects are not valid as a React child (found: "+(t==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":t)+"). If you meant to render a collection of children, use an array instead.");return a}function or(e,t,n){if(e==null)return e;var r=[],o=0;return ir(e,r,"","",function(i){return t.call(n,i,o++)}),r}function gd(e){if(e._status===-1){var t=e._result;t=t(),t.then(function(n){(e._status===0||e._status===-1)&&(e._status=1,e._result=n)},function(n){(e._status===0||e._status===-1)&&(e._status=2,e._result=n)}),e._status===-1&&(e._status=0,e._result=t)}if(e._status===1)return e._result.default;throw e._result}var te={current:null},ar={transition:null},md={ReactCurrentDispatcher:te,ReactCurrentBatchConfig:ar,ReactCurrentOwner:Mo};function ul(){throw Error("act(...) is not supported in production builds of React.")}C.Children={map:or,forEach:function(e,t,n){or(e,function(){t.apply(this,arguments)},n)},count:function(e){var t=0;return or(e,function(){t++}),t},toArray:function(e){return or(e,function(t){return t})||[]},only:function(e){if(!No(e))throw Error("React.Children.only expected to receive a single React element child.");return e}};C.Component=jt;C.Fragment=nd;C.Profiler=od;C.PureComponent=zo;C.StrictMode=rd;C.Suspense=sd;C.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=md;C.act=ul;C.cloneElement=function(e,t,n){if(e==null)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+e+".");var r=ol({},e.props),o=e.key,i=e.ref,a=e._owner;if(t!=null){if(t.ref!==void 0&&(i=t.ref,a=Mo.current),t.key!==void 0&&(o=""+t.key),e.type&&e.type.defaultProps)var l=e.type.defaultProps;for(s in t)ll.call(t,s)&&!sl.hasOwnProperty(s)&&(r[s]=t[s]===void 0&&l!==void 0?l[s]:t[s])}var s=arguments.length-2;if(s===1)r.children=n;else if(1<s){l=Array(s);for(var u=0;u<s;u++)l[u]=arguments[u+2];r.children=l}return{$$typeof:dn,type:e.type,key:o,ref:i,props:r,_owner:a}};C.createContext=function(e){return e={$$typeof:ad,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null},e.Provider={$$typeof:id,_context:e},e.Consumer=e};C.createElement=cl;C.createFactory=function(e){var t=cl.bind(null,e);return t.type=e,t};C.createRef=function(){return{current:null}};C.forwardRef=function(e){return{$$typeof:ld,render:e}};C.isValidElement=No;C.lazy=function(e){return{$$typeof:ud,_payload:{_status:-1,_result:e},_init:gd}};C.memo=function(e,t){return{$$typeof:cd,type:e,compare:t===void 0?null:t}};C.startTransition=function(e){var t=ar.transition;ar.transition={};try{e()}finally{ar.transition=t}};C.unstable_act=ul;C.useCallback=function(e,t){return te.current.useCallback(e,t)};C.useContext=function(e){return te.current.useContext(e)};C.useDebugValue=function(){};C.useDeferredValue=function(e){return te.current.useDeferredValue(e)};C.useEffect=function(e,t){return te.current.useEffect(e,t)};C.useId=function(){return te.current.useId()};C.useImperativeHandle=function(e,t,n){return te.current.useImperativeHandle(e,t,n)};C.useInsertionEffect=function(e,t){return te.current.useInsertionEffect(e,t)};C.useLayoutEffect=function(e,t){return te.current.useLayoutEffect(e,t)};C.useMemo=function(e,t){return te.current.useMemo(e,t)};C.useReducer=function(e,t,n){return te.current.useReducer(e,t,n)};C.useRef=function(e){return te.current.useRef(e)};C.useState=function(e){return te.current.useState(e)};C.useSyncExternalStore=function(e,t,n){return te.current.useSyncExternalStore(e,t,n)};C.useTransition=function(){return te.current.useTransition()};C.version="18.3.1"});var pn=Ie((Rf,pl)=>{"use strict";pl.exports=dl()});var kl=Ie(z=>{"use strict";function Io(e,t){var n=e.length;e.push(t);e:for(;0<n;){var r=n-1>>>1,o=e[r];if(0<lr(o,t))e[r]=t,e[n]=o,n=r;else break e}}function _e(e){return e.length===0?null:e[0]}function cr(e){if(e.length===0)return null;var t=e[0],n=e.pop();if(n!==t){e[0]=n;e:for(var r=0,o=e.length,i=o>>>1;r<i;){var a=2*(r+1)-1,l=e[a],s=a+1,u=e[s];if(0>lr(l,n))s<o&&0>lr(u,l)?(e[r]=u,e[s]=n,r=s):(e[r]=l,e[a]=n,r=a);else if(s<o&&0>lr(u,n))e[r]=u,e[s]=n,r=s;else break e}}return t}function lr(e,t){var n=e.sortIndex-t.sortIndex;return n!==0?n:e.id-t.id}typeof performance=="object"&&typeof performance.now=="function"?(fl=performance,z.unstable_now=function(){return fl.now()}):(jo=Date,gl=jo.now(),z.unstable_now=function(){return jo.now()-gl});var fl,jo,gl,Re=[],Ke=[],hd=1,he=null,X=3,ur=!1,ht=!1,gn=!1,xl=typeof setTimeout=="function"?setTimeout:null,vl=typeof clearTimeout=="function"?clearTimeout:null,ml=typeof setImmediate<"u"?setImmediate:null;typeof navigator<"u"&&navigator.scheduling!==void 0&&navigator.scheduling.isInputPending!==void 0&&navigator.scheduling.isInputPending.bind(navigator.scheduling);function Oo(e){for(var t=_e(Ke);t!==null;){if(t.callback===null)cr(Ke);else if(t.startTime<=e)cr(Ke),t.sortIndex=t.expirationTime,Io(Re,t);else break;t=_e(Ke)}}function Fo(e){if(gn=!1,Oo(e),!ht)if(_e(Re)!==null)ht=!0,Wo(Ho);else{var t=_e(Ke);t!==null&&Uo(Fo,t.startTime-e)}}function Ho(e,t){ht=!1,gn&&(gn=!1,vl(mn),mn=-1),ur=!0;var n=X;try{for(Oo(t),he=_e(Re);he!==null&&(!(he.expirationTime>t)||e&&!bl());){var r=he.callback;if(typeof r=="function"){he.callback=null,X=he.priorityLevel;var o=r(he.expirationTime<=t);t=z.unstable_now(),typeof o=="function"?he.callback=o:he===_e(Re)&&cr(Re),Oo(t)}else cr(Re);he=_e(Re)}if(he!==null)var i=!0;else{var a=_e(Ke);a!==null&&Uo(Fo,a.startTime-t),i=!1}return i}finally{he=null,X=n,ur=!1}}var dr=!1,sr=null,mn=-1,yl=5,wl=-1;function bl(){return!(z.unstable_now()-wl<yl)}function Lo(){if(sr!==null){var e=z.unstable_now();wl=e;var t=!0;try{t=sr(!0,e)}finally{t?fn():(dr=!1,sr=null)}}else dr=!1}var fn;typeof ml=="function"?fn=function(){ml(Lo)}:typeof MessageChannel<"u"?(Do=new MessageChannel,hl=Do.port2,Do.port1.onmessage=Lo,fn=function(){hl.postMessage(null)}):fn=function(){xl(Lo,0)};var Do,hl;function Wo(e){sr=e,dr||(dr=!0,fn())}function Uo(e,t){mn=xl(function(){e(z.unstable_now())},t)}z.unstable_IdlePriority=5;z.unstable_ImmediatePriority=1;z.unstable_LowPriority=4;z.unstable_NormalPriority=3;z.unstable_Profiling=null;z.unstable_UserBlockingPriority=2;z.unstable_cancelCallback=function(e){e.callback=null};z.unstable_continueExecution=function(){ht||ur||(ht=!0,Wo(Ho))};z.unstable_forceFrameRate=function(e){0>e||125<e?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):yl=0<e?Math.floor(1e3/e):5};z.unstable_getCurrentPriorityLevel=function(){return X};z.unstable_getFirstCallbackNode=function(){return _e(Re)};z.unstable_next=function(e){switch(X){case 1:case 2:case 3:var t=3;break;default:t=X}var n=X;X=t;try{return e()}finally{X=n}};z.unstable_pauseExecution=function(){};z.unstable_requestPaint=function(){};z.unstable_runWithPriority=function(e,t){switch(e){case 1:case 2:case 3:case 4:case 5:break;default:e=3}var n=X;X=e;try{return t()}finally{X=n}};z.unstable_scheduleCallback=function(e,t,n){var r=z.unstable_now();switch(typeof n=="object"&&n!==null?(n=n.delay,n=typeof n=="number"&&0<n?r+n:r):n=r,e){case 1:var o=-1;break;case 2:o=250;break;case 5:o=1073741823;break;case 4:o=1e4;break;default:o=5e3}return o=n+o,e={id:hd++,callback:t,priorityLevel:e,startTime:n,expirationTime:o,sortIndex:-1},n>r?(e.sortIndex=n,Io(Ke,e),_e(Re)===null&&e===_e(Ke)&&(gn?(vl(mn),mn=-1):gn=!0,Uo(Fo,n-r))):(e.sortIndex=o,Io(Re,e),ht||ur||(ht=!0,Wo(Ho))),e};z.unstable_shouldYield=bl;z.unstable_wrapCallback=function(e){var t=X;return function(){var n=X;X=t;try{return e.apply(this,arguments)}finally{X=n}}}});var Sl=Ie((Nf,_l)=>{"use strict";_l.exports=kl()});var Au=Ie(me=>{"use strict";var xd=pn(),fe=Sl();function h(e){for(var t="https://reactjs.org/docs/error-decoder.html?invariant="+e,n=1;n<arguments.length;n++)t+="&args[]="+encodeURIComponent(arguments[n]);return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}var Rs=new Set,In={};function Pt(e,t){tn(e,t),tn(e+"Capture",t)}function tn(e,t){for(In[e]=t,e=0;e<t.length;e++)Rs.add(t[e])}var Be=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),di=Object.prototype.hasOwnProperty,vd=/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,El={},Cl={};function yd(e){return di.call(Cl,e)?!0:di.call(El,e)?!1:vd.test(e)?Cl[e]=!0:(El[e]=!0,!1)}function wd(e,t,n,r){if(n!==null&&n.type===0)return!1;switch(typeof t){case"function":case"symbol":return!0;case"boolean":return r?!1:n!==null?!n.acceptsBooleans:(e=e.toLowerCase().slice(0,5),e!=="data-"&&e!=="aria-");default:return!1}}function bd(e,t,n,r){if(t===null||typeof t>"u"||wd(e,t,n,r))return!0;if(r)return!1;if(n!==null)switch(n.type){case 3:return!t;case 4:return t===!1;case 5:return isNaN(t);case 6:return isNaN(t)||1>t}return!1}function oe(e,t,n,r,o,i,a){this.acceptsBooleans=t===2||t===3||t===4,this.attributeName=r,this.attributeNamespace=o,this.mustUseProperty=n,this.propertyName=e,this.type=t,this.sanitizeURL=i,this.removeEmptyString=a}var K={};"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e){K[e]=new oe(e,0,!1,e,null,!1,!1)});[["acceptCharset","accept-charset"],["className","class"],["htmlFor","for"],["httpEquiv","http-equiv"]].forEach(function(e){var t=e[0];K[t]=new oe(t,1,!1,e[1],null,!1,!1)});["contentEditable","draggable","spellCheck","value"].forEach(function(e){K[e]=new oe(e,2,!1,e.toLowerCase(),null,!1,!1)});["autoReverse","externalResourcesRequired","focusable","preserveAlpha"].forEach(function(e){K[e]=new oe(e,2,!1,e,null,!1,!1)});"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e){K[e]=new oe(e,3,!1,e.toLowerCase(),null,!1,!1)});["checked","multiple","muted","selected"].forEach(function(e){K[e]=new oe(e,3,!0,e,null,!1,!1)});["capture","download"].forEach(function(e){K[e]=new oe(e,4,!1,e,null,!1,!1)});["cols","rows","size","span"].forEach(function(e){K[e]=new oe(e,6,!1,e,null,!1,!1)});["rowSpan","start"].forEach(function(e){K[e]=new oe(e,5,!1,e.toLowerCase(),null,!1,!1)});var ra=/[\-:]([a-z])/g;function oa(e){return e[1].toUpperCase()}"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e){var t=e.replace(ra,oa);K[t]=new oe(t,1,!1,e,null,!1,!1)});"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e){var t=e.replace(ra,oa);K[t]=new oe(t,1,!1,e,"http://www.w3.org/1999/xlink",!1,!1)});["xml:base","xml:lang","xml:space"].forEach(function(e){var t=e.replace(ra,oa);K[t]=new oe(t,1,!1,e,"http://www.w3.org/XML/1998/namespace",!1,!1)});["tabIndex","crossOrigin"].forEach(function(e){K[e]=new oe(e,1,!1,e.toLowerCase(),null,!1,!1)});K.xlinkHref=new oe("xlinkHref",1,!1,"xlink:href","http://www.w3.org/1999/xlink",!0,!1);["src","href","action","formAction"].forEach(function(e){K[e]=new oe(e,1,!1,e.toLowerCase(),null,!0,!0)});function ia(e,t,n,r){var o=K.hasOwnProperty(t)?K[t]:null;(o!==null?o.type!==0:r||!(2<t.length)||t[0]!=="o"&&t[0]!=="O"||t[1]!=="n"&&t[1]!=="N")&&(bd(t,n,o,r)&&(n=null),r||o===null?yd(t)&&(n===null?e.removeAttribute(t):e.setAttribute(t,""+n)):o.mustUseProperty?e[o.propertyName]=n===null?o.type===3?!1:"":n:(t=o.attributeName,r=o.attributeNamespace,n===null?e.removeAttribute(t):(o=o.type,n=o===3||o===4&&n===!0?"":""+n,r?e.setAttributeNS(r,t,n):e.setAttribute(t,n))))}var Qe=xd.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,pr=Symbol.for("react.element"),It=Symbol.for("react.portal"),Ot=Symbol.for("react.fragment"),aa=Symbol.for("react.strict_mode"),pi=Symbol.for("react.profiler"),Ms=Symbol.for("react.provider"),Ns=Symbol.for("react.context"),la=Symbol.for("react.forward_ref"),fi=Symbol.for("react.suspense"),gi=Symbol.for("react.suspense_list"),sa=Symbol.for("react.memo"),Je=Symbol.for("react.lazy"),js=Symbol.for("react.offscreen"),Tl=Symbol.iterator;function hn(e){return e===null||typeof e!="object"?null:(e=Tl&&e[Tl]||e["@@iterator"],typeof e=="function"?e:null)}var I=Object.assign,Bo;function Sn(e){if(Bo===void 0)try{throw Error()}catch(n){var t=n.stack.trim().match(/\n( *(at )?)/);Bo=t&&t[1]||""}return`
`+Bo+e}var Vo=!1;function qo(e,t){if(!e||Vo)return"";Vo=!0;var n=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{if(t)if(t=function(){throw Error()},Object.defineProperty(t.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(t,[])}catch(u){var r=u}Reflect.construct(e,[],t)}else{try{t.call()}catch(u){r=u}e.call(t.prototype)}else{try{throw Error()}catch(u){r=u}e()}}catch(u){if(u&&r&&typeof u.stack=="string"){for(var o=u.stack.split(`
`),i=r.stack.split(`
`),a=o.length-1,l=i.length-1;1<=a&&0<=l&&o[a]!==i[l];)l--;for(;1<=a&&0<=l;a--,l--)if(o[a]!==i[l]){if(a!==1||l!==1)do if(a--,l--,0>l||o[a]!==i[l]){var s=`
`+o[a].replace(" at new "," at ");return e.displayName&&s.includes("<anonymous>")&&(s=s.replace("<anonymous>",e.displayName)),s}while(1<=a&&0<=l);break}}}finally{Vo=!1,Error.prepareStackTrace=n}return(e=e?e.displayName||e.name:"")?Sn(e):""}function kd(e){switch(e.tag){case 5:return Sn(e.type);case 16:return Sn("Lazy");case 13:return Sn("Suspense");case 19:return Sn("SuspenseList");case 0:case 2:case 15:return e=qo(e.type,!1),e;case 11:return e=qo(e.type.render,!1),e;case 1:return e=qo(e.type,!0),e;default:return""}}function mi(e){if(e==null)return null;if(typeof e=="function")return e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case Ot:return"Fragment";case It:return"Portal";case pi:return"Profiler";case aa:return"StrictMode";case fi:return"Suspense";case gi:return"SuspenseList"}if(typeof e=="object")switch(e.$$typeof){case Ns:return(e.displayName||"Context")+".Consumer";case Ms:return(e._context.displayName||"Context")+".Provider";case la:var t=e.render;return e=e.displayName,e||(e=t.displayName||t.name||"",e=e!==""?"ForwardRef("+e+")":"ForwardRef"),e;case sa:return t=e.displayName||null,t!==null?t:mi(e.type)||"Memo";case Je:t=e._payload,e=e._init;try{return mi(e(t))}catch{}}return null}function _d(e){var t=e.type;switch(e.tag){case 24:return"Cache";case 9:return(t.displayName||"Context")+".Consumer";case 10:return(t._context.displayName||"Context")+".Provider";case 18:return"DehydratedFragment";case 11:return e=t.render,e=e.displayName||e.name||"",t.displayName||(e!==""?"ForwardRef("+e+")":"ForwardRef");case 7:return"Fragment";case 5:return t;case 4:return"Portal";case 3:return"Root";case 6:return"Text";case 16:return mi(t);case 8:return t===aa?"StrictMode":"Mode";case 22:return"Offscreen";case 12:return"Profiler";case 21:return"Scope";case 13:return"Suspense";case 19:return"SuspenseList";case 25:return"TracingMarker";case 1:case 0:case 17:case 2:case 14:case 15:if(typeof t=="function")return t.displayName||t.name||null;if(typeof t=="string")return t}return null}function dt(e){switch(typeof e){case"boolean":case"number":case"string":case"undefined":return e;case"object":return e;default:return""}}function Ls(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(t==="checkbox"||t==="radio")}function Sd(e){var t=Ls(e)?"checked":"value",n=Object.getOwnPropertyDescriptor(e.constructor.prototype,t),r=""+e[t];if(!e.hasOwnProperty(t)&&typeof n<"u"&&typeof n.get=="function"&&typeof n.set=="function"){var o=n.get,i=n.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return o.call(this)},set:function(a){r=""+a,i.call(this,a)}}),Object.defineProperty(e,t,{enumerable:n.enumerable}),{getValue:function(){return r},setValue:function(a){r=""+a},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}function fr(e){e._valueTracker||(e._valueTracker=Sd(e))}function Ds(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var n=t.getValue(),r="";return e&&(r=Ls(e)?e.checked?"true":"false":e.value),e=r,e!==n?(t.setValue(e),!0):!1}function Wr(e){if(e=e||(typeof document<"u"?document:void 0),typeof e>"u")return null;try{return e.activeElement||e.body}catch{return e.body}}function hi(e,t){var n=t.checked;return I({},t,{defaultChecked:void 0,defaultValue:void 0,value:void 0,checked:n??e._wrapperState.initialChecked})}function Al(e,t){var n=t.defaultValue==null?"":t.defaultValue,r=t.checked!=null?t.checked:t.defaultChecked;n=dt(t.value!=null?t.value:n),e._wrapperState={initialChecked:r,initialValue:n,controlled:t.type==="checkbox"||t.type==="radio"?t.checked!=null:t.value!=null}}function Is(e,t){t=t.checked,t!=null&&ia(e,"checked",t,!1)}function xi(e,t){Is(e,t);var n=dt(t.value),r=t.type;if(n!=null)r==="number"?(n===0&&e.value===""||e.value!=n)&&(e.value=""+n):e.value!==""+n&&(e.value=""+n);else if(r==="submit"||r==="reset"){e.removeAttribute("value");return}t.hasOwnProperty("value")?vi(e,t.type,n):t.hasOwnProperty("defaultValue")&&vi(e,t.type,dt(t.defaultValue)),t.checked==null&&t.defaultChecked!=null&&(e.defaultChecked=!!t.defaultChecked)}function Pl(e,t,n){if(t.hasOwnProperty("value")||t.hasOwnProperty("defaultValue")){var r=t.type;if(!(r!=="submit"&&r!=="reset"||t.value!==void 0&&t.value!==null))return;t=""+e._wrapperState.initialValue,n||t===e.value||(e.value=t),e.defaultValue=t}n=e.name,n!==""&&(e.name=""),e.defaultChecked=!!e._wrapperState.initialChecked,n!==""&&(e.name=n)}function vi(e,t,n){(t!=="number"||Wr(e.ownerDocument)!==e)&&(n==null?e.defaultValue=""+e._wrapperState.initialValue:e.defaultValue!==""+n&&(e.defaultValue=""+n))}var En=Array.isArray;function Kt(e,t,n,r){if(e=e.options,t){t={};for(var o=0;o<n.length;o++)t["$"+n[o]]=!0;for(n=0;n<e.length;n++)o=t.hasOwnProperty("$"+e[n].value),e[n].selected!==o&&(e[n].selected=o),o&&r&&(e[n].defaultSelected=!0)}else{for(n=""+dt(n),t=null,o=0;o<e.length;o++){if(e[o].value===n){e[o].selected=!0,r&&(e[o].defaultSelected=!0);return}t!==null||e[o].disabled||(t=e[o])}t!==null&&(t.selected=!0)}}function yi(e,t){if(t.dangerouslySetInnerHTML!=null)throw Error(h(91));return I({},t,{value:void 0,defaultValue:void 0,children:""+e._wrapperState.initialValue})}function zl(e,t){var n=t.value;if(n==null){if(n=t.children,t=t.defaultValue,n!=null){if(t!=null)throw Error(h(92));if(En(n)){if(1<n.length)throw Error(h(93));n=n[0]}t=n}t==null&&(t=""),n=t}e._wrapperState={initialValue:dt(n)}}function Os(e,t){var n=dt(t.value),r=dt(t.defaultValue);n!=null&&(n=""+n,n!==e.value&&(e.value=n),t.defaultValue==null&&e.defaultValue!==n&&(e.defaultValue=n)),r!=null&&(e.defaultValue=""+r)}function Rl(e){var t=e.textContent;t===e._wrapperState.initialValue&&t!==""&&t!==null&&(e.value=t)}function Fs(e){switch(e){case"svg":return"http://www.w3.org/2000/svg";case"math":return"http://www.w3.org/1998/Math/MathML";default:return"http://www.w3.org/1999/xhtml"}}function wi(e,t){return e==null||e==="http://www.w3.org/1999/xhtml"?Fs(t):e==="http://www.w3.org/2000/svg"&&t==="foreignObject"?"http://www.w3.org/1999/xhtml":e}var gr,Hs=(function(e){return typeof MSApp<"u"&&MSApp.execUnsafeLocalFunction?function(t,n,r,o){MSApp.execUnsafeLocalFunction(function(){return e(t,n,r,o)})}:e})(function(e,t){if(e.namespaceURI!=="http://www.w3.org/2000/svg"||"innerHTML"in e)e.innerHTML=t;else{for(gr=gr||document.createElement("div"),gr.innerHTML="<svg>"+t.valueOf().toString()+"</svg>",t=gr.firstChild;e.firstChild;)e.removeChild(e.firstChild);for(;t.firstChild;)e.appendChild(t.firstChild)}});function On(e,t){if(t){var n=e.firstChild;if(n&&n===e.lastChild&&n.nodeType===3){n.nodeValue=t;return}}e.textContent=t}var An={animationIterationCount:!0,aspectRatio:!0,borderImageOutset:!0,borderImageSlice:!0,borderImageWidth:!0,boxFlex:!0,boxFlexGroup:!0,boxOrdinalGroup:!0,columnCount:!0,columns:!0,flex:!0,flexGrow:!0,flexPositive:!0,flexShrink:!0,flexNegative:!0,flexOrder:!0,gridArea:!0,gridRow:!0,gridRowEnd:!0,gridRowSpan:!0,gridRowStart:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnSpan:!0,gridColumnStart:!0,fontWeight:!0,lineClamp:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,tabSize:!0,widows:!0,zIndex:!0,zoom:!0,fillOpacity:!0,floodOpacity:!0,stopOpacity:!0,strokeDasharray:!0,strokeDashoffset:!0,strokeMiterlimit:!0,strokeOpacity:!0,strokeWidth:!0},Ed=["Webkit","ms","Moz","O"];Object.keys(An).forEach(function(e){Ed.forEach(function(t){t=t+e.charAt(0).toUpperCase()+e.substring(1),An[t]=An[e]})});function Ws(e,t,n){return t==null||typeof t=="boolean"||t===""?"":n||typeof t!="number"||t===0||An.hasOwnProperty(e)&&An[e]?(""+t).trim():t+"px"}function Us(e,t){e=e.style;for(var n in t)if(t.hasOwnProperty(n)){var r=n.indexOf("--")===0,o=Ws(n,t[n],r);n==="float"&&(n="cssFloat"),r?e.setProperty(n,o):e[n]=o}}var Cd=I({menuitem:!0},{area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});function bi(e,t){if(t){if(Cd[e]&&(t.children!=null||t.dangerouslySetInnerHTML!=null))throw Error(h(137,e));if(t.dangerouslySetInnerHTML!=null){if(t.children!=null)throw Error(h(60));if(typeof t.dangerouslySetInnerHTML!="object"||!("__html"in t.dangerouslySetInnerHTML))throw Error(h(61))}if(t.style!=null&&typeof t.style!="object")throw Error(h(62))}}function ki(e,t){if(e.indexOf("-")===-1)return typeof t.is=="string";switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var _i=null;function ca(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var Si=null,Xt=null,Jt=null;function Ml(e){if(e=nr(e)){if(typeof Si!="function")throw Error(h(280));var t=e.stateNode;t&&(t=ho(t),Si(e.stateNode,e.type,t))}}function Bs(e){Xt?Jt?Jt.push(e):Jt=[e]:Xt=e}function Vs(){if(Xt){var e=Xt,t=Jt;if(Jt=Xt=null,Ml(e),t)for(e=0;e<t.length;e++)Ml(t[e])}}function qs(e,t){return e(t)}function Gs(){}var Go=!1;function Qs(e,t,n){if(Go)return e(t,n);Go=!0;try{return qs(e,t,n)}finally{Go=!1,(Xt!==null||Jt!==null)&&(Gs(),Vs())}}function Fn(e,t){var n=e.stateNode;if(n===null)return null;var r=ho(n);if(r===null)return null;n=r[t];e:switch(t){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(r=!r.disabled)||(e=e.type,r=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!r;break e;default:e=!1}if(e)return null;if(n&&typeof n!="function")throw Error(h(231,t,typeof n));return n}var Ei=!1;if(Be)try{Lt={},Object.defineProperty(Lt,"passive",{get:function(){Ei=!0}}),window.addEventListener("test",Lt,Lt),window.removeEventListener("test",Lt,Lt)}catch{Ei=!1}var Lt;function Td(e,t,n,r,o,i,a,l,s){var u=Array.prototype.slice.call(arguments,3);try{t.apply(n,u)}catch(g){this.onError(g)}}var Pn=!1,Ur=null,Br=!1,Ci=null,Ad={onError:function(e){Pn=!0,Ur=e}};function Pd(e,t,n,r,o,i,a,l,s){Pn=!1,Ur=null,Td.apply(Ad,arguments)}function zd(e,t,n,r,o,i,a,l,s){if(Pd.apply(this,arguments),Pn){if(Pn){var u=Ur;Pn=!1,Ur=null}else throw Error(h(198));Br||(Br=!0,Ci=u)}}function zt(e){var t=e,n=e;if(e.alternate)for(;t.return;)t=t.return;else{e=t;do t=e,(t.flags&4098)!==0&&(n=t.return),e=t.return;while(e)}return t.tag===3?n:null}function Ys(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function Nl(e){if(zt(e)!==e)throw Error(h(188))}function Rd(e){var t=e.alternate;if(!t){if(t=zt(e),t===null)throw Error(h(188));return t!==e?null:e}for(var n=e,r=t;;){var o=n.return;if(o===null)break;var i=o.alternate;if(i===null){if(r=o.return,r!==null){n=r;continue}break}if(o.child===i.child){for(i=o.child;i;){if(i===n)return Nl(o),e;if(i===r)return Nl(o),t;i=i.sibling}throw Error(h(188))}if(n.return!==r.return)n=o,r=i;else{for(var a=!1,l=o.child;l;){if(l===n){a=!0,n=o,r=i;break}if(l===r){a=!0,r=o,n=i;break}l=l.sibling}if(!a){for(l=i.child;l;){if(l===n){a=!0,n=i,r=o;break}if(l===r){a=!0,r=i,n=o;break}l=l.sibling}if(!a)throw Error(h(189))}}if(n.alternate!==r)throw Error(h(190))}if(n.tag!==3)throw Error(h(188));return n.stateNode.current===n?e:t}function Ks(e){return e=Rd(e),e!==null?Xs(e):null}function Xs(e){if(e.tag===5||e.tag===6)return e;for(e=e.child;e!==null;){var t=Xs(e);if(t!==null)return t;e=e.sibling}return null}var Js=fe.unstable_scheduleCallback,jl=fe.unstable_cancelCallback,Md=fe.unstable_shouldYield,Nd=fe.unstable_requestPaint,H=fe.unstable_now,jd=fe.unstable_getCurrentPriorityLevel,ua=fe.unstable_ImmediatePriority,Zs=fe.unstable_UserBlockingPriority,Vr=fe.unstable_NormalPriority,Ld=fe.unstable_LowPriority,$s=fe.unstable_IdlePriority,po=null,Le=null;function Dd(e){if(Le&&typeof Le.onCommitFiberRoot=="function")try{Le.onCommitFiberRoot(po,e,void 0,(e.current.flags&128)===128)}catch{}}var Ae=Math.clz32?Math.clz32:Fd,Id=Math.log,Od=Math.LN2;function Fd(e){return e>>>=0,e===0?32:31-(Id(e)/Od|0)|0}var mr=64,hr=4194304;function Cn(e){switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return e&4194240;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return e&130023424;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 1073741824;default:return e}}function qr(e,t){var n=e.pendingLanes;if(n===0)return 0;var r=0,o=e.suspendedLanes,i=e.pingedLanes,a=n&268435455;if(a!==0){var l=a&~o;l!==0?r=Cn(l):(i&=a,i!==0&&(r=Cn(i)))}else a=n&~o,a!==0?r=Cn(a):i!==0&&(r=Cn(i));if(r===0)return 0;if(t!==0&&t!==r&&(t&o)===0&&(o=r&-r,i=t&-t,o>=i||o===16&&(i&4194240)!==0))return t;if((r&4)!==0&&(r|=n&16),t=e.entangledLanes,t!==0)for(e=e.entanglements,t&=r;0<t;)n=31-Ae(t),o=1<<n,r|=e[n],t&=~o;return r}function Hd(e,t){switch(e){case 1:case 2:case 4:return t+250;case 8:case 16:case 32:case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t+5e3;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return-1;case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function Wd(e,t){for(var n=e.suspendedLanes,r=e.pingedLanes,o=e.expirationTimes,i=e.pendingLanes;0<i;){var a=31-Ae(i),l=1<<a,s=o[a];s===-1?((l&n)===0||(l&r)!==0)&&(o[a]=Hd(l,t)):s<=t&&(e.expiredLanes|=l),i&=~l}}function Ti(e){return e=e.pendingLanes&-1073741825,e!==0?e:e&1073741824?1073741824:0}function ec(){var e=mr;return mr<<=1,(mr&4194240)===0&&(mr=64),e}function Qo(e){for(var t=[],n=0;31>n;n++)t.push(e);return t}function er(e,t,n){e.pendingLanes|=t,t!==536870912&&(e.suspendedLanes=0,e.pingedLanes=0),e=e.eventTimes,t=31-Ae(t),e[t]=n}function Ud(e,t){var n=e.pendingLanes&~t;e.pendingLanes=t,e.suspendedLanes=0,e.pingedLanes=0,e.expiredLanes&=t,e.mutableReadLanes&=t,e.entangledLanes&=t,t=e.entanglements;var r=e.eventTimes;for(e=e.expirationTimes;0<n;){var o=31-Ae(n),i=1<<o;t[o]=0,r[o]=-1,e[o]=-1,n&=~i}}function da(e,t){var n=e.entangledLanes|=t;for(e=e.entanglements;n;){var r=31-Ae(n),o=1<<r;o&t|e[r]&t&&(e[r]|=t),n&=~o}}var P=0;function tc(e){return e&=-e,1<e?4<e?(e&268435455)!==0?16:536870912:4:1}var nc,pa,rc,oc,ic,Ai=!1,xr=[],rt=null,ot=null,it=null,Hn=new Map,Wn=new Map,$e=[],Bd="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");function Ll(e,t){switch(e){case"focusin":case"focusout":rt=null;break;case"dragenter":case"dragleave":ot=null;break;case"mouseover":case"mouseout":it=null;break;case"pointerover":case"pointerout":Hn.delete(t.pointerId);break;case"gotpointercapture":case"lostpointercapture":Wn.delete(t.pointerId)}}function xn(e,t,n,r,o,i){return e===null||e.nativeEvent!==i?(e={blockedOn:t,domEventName:n,eventSystemFlags:r,nativeEvent:i,targetContainers:[o]},t!==null&&(t=nr(t),t!==null&&pa(t)),e):(e.eventSystemFlags|=r,t=e.targetContainers,o!==null&&t.indexOf(o)===-1&&t.push(o),e)}function Vd(e,t,n,r,o){switch(t){case"focusin":return rt=xn(rt,e,t,n,r,o),!0;case"dragenter":return ot=xn(ot,e,t,n,r,o),!0;case"mouseover":return it=xn(it,e,t,n,r,o),!0;case"pointerover":var i=o.pointerId;return Hn.set(i,xn(Hn.get(i)||null,e,t,n,r,o)),!0;case"gotpointercapture":return i=o.pointerId,Wn.set(i,xn(Wn.get(i)||null,e,t,n,r,o)),!0}return!1}function ac(e){var t=yt(e.target);if(t!==null){var n=zt(t);if(n!==null){if(t=n.tag,t===13){if(t=Ys(n),t!==null){e.blockedOn=t,ic(e.priority,function(){rc(n)});return}}else if(t===3&&n.stateNode.current.memoizedState.isDehydrated){e.blockedOn=n.tag===3?n.stateNode.containerInfo:null;return}}}e.blockedOn=null}function Rr(e){if(e.blockedOn!==null)return!1;for(var t=e.targetContainers;0<t.length;){var n=Pi(e.domEventName,e.eventSystemFlags,t[0],e.nativeEvent);if(n===null){n=e.nativeEvent;var r=new n.constructor(n.type,n);_i=r,n.target.dispatchEvent(r),_i=null}else return t=nr(n),t!==null&&pa(t),e.blockedOn=n,!1;t.shift()}return!0}function Dl(e,t,n){Rr(e)&&n.delete(t)}function qd(){Ai=!1,rt!==null&&Rr(rt)&&(rt=null),ot!==null&&Rr(ot)&&(ot=null),it!==null&&Rr(it)&&(it=null),Hn.forEach(Dl),Wn.forEach(Dl)}function vn(e,t){e.blockedOn===t&&(e.blockedOn=null,Ai||(Ai=!0,fe.unstable_scheduleCallback(fe.unstable_NormalPriority,qd)))}function Un(e){function t(o){return vn(o,e)}if(0<xr.length){vn(xr[0],e);for(var n=1;n<xr.length;n++){var r=xr[n];r.blockedOn===e&&(r.blockedOn=null)}}for(rt!==null&&vn(rt,e),ot!==null&&vn(ot,e),it!==null&&vn(it,e),Hn.forEach(t),Wn.forEach(t),n=0;n<$e.length;n++)r=$e[n],r.blockedOn===e&&(r.blockedOn=null);for(;0<$e.length&&(n=$e[0],n.blockedOn===null);)ac(n),n.blockedOn===null&&$e.shift()}var Zt=Qe.ReactCurrentBatchConfig,Gr=!0;function Gd(e,t,n,r){var o=P,i=Zt.transition;Zt.transition=null;try{P=1,fa(e,t,n,r)}finally{P=o,Zt.transition=i}}function Qd(e,t,n,r){var o=P,i=Zt.transition;Zt.transition=null;try{P=4,fa(e,t,n,r)}finally{P=o,Zt.transition=i}}function fa(e,t,n,r){if(Gr){var o=Pi(e,t,n,r);if(o===null)ei(e,t,r,Qr,n),Ll(e,r);else if(Vd(o,e,t,n,r))r.stopPropagation();else if(Ll(e,r),t&4&&-1<Bd.indexOf(e)){for(;o!==null;){var i=nr(o);if(i!==null&&nc(i),i=Pi(e,t,n,r),i===null&&ei(e,t,r,Qr,n),i===o)break;o=i}o!==null&&r.stopPropagation()}else ei(e,t,r,null,n)}}var Qr=null;function Pi(e,t,n,r){if(Qr=null,e=ca(r),e=yt(e),e!==null)if(t=zt(e),t===null)e=null;else if(n=t.tag,n===13){if(e=Ys(t),e!==null)return e;e=null}else if(n===3){if(t.stateNode.current.memoizedState.isDehydrated)return t.tag===3?t.stateNode.containerInfo:null;e=null}else t!==e&&(e=null);return Qr=e,null}function lc(e){switch(e){case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 1;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"toggle":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 4;case"message":switch(jd()){case ua:return 1;case Zs:return 4;case Vr:case Ld:return 16;case $s:return 536870912;default:return 16}default:return 16}}var tt=null,ga=null,Mr=null;function sc(){if(Mr)return Mr;var e,t=ga,n=t.length,r,o="value"in tt?tt.value:tt.textContent,i=o.length;for(e=0;e<n&&t[e]===o[e];e++);var a=n-e;for(r=1;r<=a&&t[n-r]===o[i-r];r++);return Mr=o.slice(e,1<r?1-r:void 0)}function Nr(e){var t=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}function vr(){return!0}function Il(){return!1}function ge(e){function t(n,r,o,i,a){this._reactName=n,this._targetInst=o,this.type=r,this.nativeEvent=i,this.target=a,this.currentTarget=null;for(var l in e)e.hasOwnProperty(l)&&(n=e[l],this[l]=n?n(i):i[l]);return this.isDefaultPrevented=(i.defaultPrevented!=null?i.defaultPrevented:i.returnValue===!1)?vr:Il,this.isPropagationStopped=Il,this}return I(t.prototype,{preventDefault:function(){this.defaultPrevented=!0;var n=this.nativeEvent;n&&(n.preventDefault?n.preventDefault():typeof n.returnValue!="unknown"&&(n.returnValue=!1),this.isDefaultPrevented=vr)},stopPropagation:function(){var n=this.nativeEvent;n&&(n.stopPropagation?n.stopPropagation():typeof n.cancelBubble!="unknown"&&(n.cancelBubble=!0),this.isPropagationStopped=vr)},persist:function(){},isPersistent:vr}),t}var cn={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},ma=ge(cn),tr=I({},cn,{view:0,detail:0}),Yd=ge(tr),Yo,Ko,yn,fo=I({},tr,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:ha,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return"movementX"in e?e.movementX:(e!==yn&&(yn&&e.type==="mousemove"?(Yo=e.screenX-yn.screenX,Ko=e.screenY-yn.screenY):Ko=Yo=0,yn=e),Yo)},movementY:function(e){return"movementY"in e?e.movementY:Ko}}),Ol=ge(fo),Kd=I({},fo,{dataTransfer:0}),Xd=ge(Kd),Jd=I({},tr,{relatedTarget:0}),Xo=ge(Jd),Zd=I({},cn,{animationName:0,elapsedTime:0,pseudoElement:0}),$d=ge(Zd),ep=I({},cn,{clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),tp=ge(ep),np=I({},cn,{data:0}),Fl=ge(np),rp={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},op={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},ip={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function ap(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=ip[e])?!!t[e]:!1}function ha(){return ap}var lp=I({},tr,{key:function(e){if(e.key){var t=rp[e.key]||e.key;if(t!=="Unidentified")return t}return e.type==="keypress"?(e=Nr(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?op[e.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:ha,charCode:function(e){return e.type==="keypress"?Nr(e):0},keyCode:function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},which:function(e){return e.type==="keypress"?Nr(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0}}),sp=ge(lp),cp=I({},fo,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),Hl=ge(cp),up=I({},tr,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:ha}),dp=ge(up),pp=I({},cn,{propertyName:0,elapsedTime:0,pseudoElement:0}),fp=ge(pp),gp=I({},fo,{deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0}),mp=ge(gp),hp=[9,13,27,32],xa=Be&&"CompositionEvent"in window,zn=null;Be&&"documentMode"in document&&(zn=document.documentMode);var xp=Be&&"TextEvent"in window&&!zn,cc=Be&&(!xa||zn&&8<zn&&11>=zn),Wl=" ",Ul=!1;function uc(e,t){switch(e){case"keyup":return hp.indexOf(t.keyCode)!==-1;case"keydown":return t.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function dc(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}var Ft=!1;function vp(e,t){switch(e){case"compositionend":return dc(t);case"keypress":return t.which!==32?null:(Ul=!0,Wl);case"textInput":return e=t.data,e===Wl&&Ul?null:e;default:return null}}function yp(e,t){if(Ft)return e==="compositionend"||!xa&&uc(e,t)?(e=sc(),Mr=ga=tt=null,Ft=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case"compositionend":return cc&&t.locale!=="ko"?null:t.data;default:return null}}var wp={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function Bl(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t==="input"?!!wp[e.type]:t==="textarea"}function pc(e,t,n,r){Bs(r),t=Yr(t,"onChange"),0<t.length&&(n=new ma("onChange","change",null,n,r),e.push({event:n,listeners:t}))}var Rn=null,Bn=null;function bp(e){_c(e,0)}function go(e){var t=Ut(e);if(Ds(t))return e}function kp(e,t){if(e==="change")return t}var fc=!1;Be&&(Be?(wr="oninput"in document,wr||(Jo=document.createElement("div"),Jo.setAttribute("oninput","return;"),wr=typeof Jo.oninput=="function"),yr=wr):yr=!1,fc=yr&&(!document.documentMode||9<document.documentMode));var yr,wr,Jo;function Vl(){Rn&&(Rn.detachEvent("onpropertychange",gc),Bn=Rn=null)}function gc(e){if(e.propertyName==="value"&&go(Bn)){var t=[];pc(t,Bn,e,ca(e)),Qs(bp,t)}}function _p(e,t,n){e==="focusin"?(Vl(),Rn=t,Bn=n,Rn.attachEvent("onpropertychange",gc)):e==="focusout"&&Vl()}function Sp(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return go(Bn)}function Ep(e,t){if(e==="click")return go(t)}function Cp(e,t){if(e==="input"||e==="change")return go(t)}function Tp(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var ze=typeof Object.is=="function"?Object.is:Tp;function Vn(e,t){if(ze(e,t))return!0;if(typeof e!="object"||e===null||typeof t!="object"||t===null)return!1;var n=Object.keys(e),r=Object.keys(t);if(n.length!==r.length)return!1;for(r=0;r<n.length;r++){var o=n[r];if(!di.call(t,o)||!ze(e[o],t[o]))return!1}return!0}function ql(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function Gl(e,t){var n=ql(e);e=0;for(var r;n;){if(n.nodeType===3){if(r=e+n.textContent.length,e<=t&&r>=t)return{node:n,offset:t-e};e=r}e:{for(;n;){if(n.nextSibling){n=n.nextSibling;break e}n=n.parentNode}n=void 0}n=ql(n)}}function mc(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?mc(e,t.parentNode):"contains"in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}function hc(){for(var e=window,t=Wr();t instanceof e.HTMLIFrameElement;){try{var n=typeof t.contentWindow.location.href=="string"}catch{n=!1}if(n)e=t.contentWindow;else break;t=Wr(e.document)}return t}function va(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||t==="textarea"||e.contentEditable==="true")}function Ap(e){var t=hc(),n=e.focusedElem,r=e.selectionRange;if(t!==n&&n&&n.ownerDocument&&mc(n.ownerDocument.documentElement,n)){if(r!==null&&va(n)){if(t=r.start,e=r.end,e===void 0&&(e=t),"selectionStart"in n)n.selectionStart=t,n.selectionEnd=Math.min(e,n.value.length);else if(e=(t=n.ownerDocument||document)&&t.defaultView||window,e.getSelection){e=e.getSelection();var o=n.textContent.length,i=Math.min(r.start,o);r=r.end===void 0?i:Math.min(r.end,o),!e.extend&&i>r&&(o=r,r=i,i=o),o=Gl(n,i);var a=Gl(n,r);o&&a&&(e.rangeCount!==1||e.anchorNode!==o.node||e.anchorOffset!==o.offset||e.focusNode!==a.node||e.focusOffset!==a.offset)&&(t=t.createRange(),t.setStart(o.node,o.offset),e.removeAllRanges(),i>r?(e.addRange(t),e.extend(a.node,a.offset)):(t.setEnd(a.node,a.offset),e.addRange(t)))}}for(t=[],e=n;e=e.parentNode;)e.nodeType===1&&t.push({element:e,left:e.scrollLeft,top:e.scrollTop});for(typeof n.focus=="function"&&n.focus(),n=0;n<t.length;n++)e=t[n],e.element.scrollLeft=e.left,e.element.scrollTop=e.top}}var Pp=Be&&"documentMode"in document&&11>=document.documentMode,Ht=null,zi=null,Mn=null,Ri=!1;function Ql(e,t,n){var r=n.window===n?n.document:n.nodeType===9?n:n.ownerDocument;Ri||Ht==null||Ht!==Wr(r)||(r=Ht,"selectionStart"in r&&va(r)?r={start:r.selectionStart,end:r.selectionEnd}:(r=(r.ownerDocument&&r.ownerDocument.defaultView||window).getSelection(),r={anchorNode:r.anchorNode,anchorOffset:r.anchorOffset,focusNode:r.focusNode,focusOffset:r.focusOffset}),Mn&&Vn(Mn,r)||(Mn=r,r=Yr(zi,"onSelect"),0<r.length&&(t=new ma("onSelect","select",null,t,n),e.push({event:t,listeners:r}),t.target=Ht)))}function br(e,t){var n={};return n[e.toLowerCase()]=t.toLowerCase(),n["Webkit"+e]="webkit"+t,n["Moz"+e]="moz"+t,n}var Wt={animationend:br("Animation","AnimationEnd"),animationiteration:br("Animation","AnimationIteration"),animationstart:br("Animation","AnimationStart"),transitionend:br("Transition","TransitionEnd")},Zo={},xc={};Be&&(xc=document.createElement("div").style,"AnimationEvent"in window||(delete Wt.animationend.animation,delete Wt.animationiteration.animation,delete Wt.animationstart.animation),"TransitionEvent"in window||delete Wt.transitionend.transition);function mo(e){if(Zo[e])return Zo[e];if(!Wt[e])return e;var t=Wt[e],n;for(n in t)if(t.hasOwnProperty(n)&&n in xc)return Zo[e]=t[n];return e}var vc=mo("animationend"),yc=mo("animationiteration"),wc=mo("animationstart"),bc=mo("transitionend"),kc=new Map,Yl="abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");function ft(e,t){kc.set(e,t),Pt(t,[e])}for(kr=0;kr<Yl.length;kr++)_r=Yl[kr],Kl=_r.toLowerCase(),Xl=_r[0].toUpperCase()+_r.slice(1),ft(Kl,"on"+Xl);var _r,Kl,Xl,kr;ft(vc,"onAnimationEnd");ft(yc,"onAnimationIteration");ft(wc,"onAnimationStart");ft("dblclick","onDoubleClick");ft("focusin","onFocus");ft("focusout","onBlur");ft(bc,"onTransitionEnd");tn("onMouseEnter",["mouseout","mouseover"]);tn("onMouseLeave",["mouseout","mouseover"]);tn("onPointerEnter",["pointerout","pointerover"]);tn("onPointerLeave",["pointerout","pointerover"]);Pt("onChange","change click focusin focusout input keydown keyup selectionchange".split(" "));Pt("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));Pt("onBeforeInput",["compositionend","keypress","textInput","paste"]);Pt("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" "));Pt("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" "));Pt("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var Tn="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),zp=new Set("cancel close invalid load scroll toggle".split(" ").concat(Tn));function Jl(e,t,n){var r=e.type||"unknown-event";e.currentTarget=n,zd(r,t,void 0,e),e.currentTarget=null}function _c(e,t){t=(t&4)!==0;for(var n=0;n<e.length;n++){var r=e[n],o=r.event;r=r.listeners;e:{var i=void 0;if(t)for(var a=r.length-1;0<=a;a--){var l=r[a],s=l.instance,u=l.currentTarget;if(l=l.listener,s!==i&&o.isPropagationStopped())break e;Jl(o,l,u),i=s}else for(a=0;a<r.length;a++){if(l=r[a],s=l.instance,u=l.currentTarget,l=l.listener,s!==i&&o.isPropagationStopped())break e;Jl(o,l,u),i=s}}}if(Br)throw e=Ci,Br=!1,Ci=null,e}function M(e,t){var n=t[Di];n===void 0&&(n=t[Di]=new Set);var r=e+"__bubble";n.has(r)||(Sc(t,e,2,!1),n.add(r))}function $o(e,t,n){var r=0;t&&(r|=4),Sc(n,e,r,t)}var Sr="_reactListening"+Math.random().toString(36).slice(2);function qn(e){if(!e[Sr]){e[Sr]=!0,Rs.forEach(function(n){n!=="selectionchange"&&(zp.has(n)||$o(n,!1,e),$o(n,!0,e))});var t=e.nodeType===9?e:e.ownerDocument;t===null||t[Sr]||(t[Sr]=!0,$o("selectionchange",!1,t))}}function Sc(e,t,n,r){switch(lc(t)){case 1:var o=Gd;break;case 4:o=Qd;break;default:o=fa}n=o.bind(null,t,n,e),o=void 0,!Ei||t!=="touchstart"&&t!=="touchmove"&&t!=="wheel"||(o=!0),r?o!==void 0?e.addEventListener(t,n,{capture:!0,passive:o}):e.addEventListener(t,n,!0):o!==void 0?e.addEventListener(t,n,{passive:o}):e.addEventListener(t,n,!1)}function ei(e,t,n,r,o){var i=r;if((t&1)===0&&(t&2)===0&&r!==null)e:for(;;){if(r===null)return;var a=r.tag;if(a===3||a===4){var l=r.stateNode.containerInfo;if(l===o||l.nodeType===8&&l.parentNode===o)break;if(a===4)for(a=r.return;a!==null;){var s=a.tag;if((s===3||s===4)&&(s=a.stateNode.containerInfo,s===o||s.nodeType===8&&s.parentNode===o))return;a=a.return}for(;l!==null;){if(a=yt(l),a===null)return;if(s=a.tag,s===5||s===6){r=i=a;continue e}l=l.parentNode}}r=r.return}Qs(function(){var u=i,g=ca(n),m=[];e:{var f=kc.get(e);if(f!==void 0){var v=ma,w=e;switch(e){case"keypress":if(Nr(n)===0)break e;case"keydown":case"keyup":v=sp;break;case"focusin":w="focus",v=Xo;break;case"focusout":w="blur",v=Xo;break;case"beforeblur":case"afterblur":v=Xo;break;case"click":if(n.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":v=Ol;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":v=Xd;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":v=dp;break;case vc:case yc:case wc:v=$d;break;case bc:v=fp;break;case"scroll":v=Yd;break;case"wheel":v=mp;break;case"copy":case"cut":case"paste":v=tp;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":v=Hl}var b=(t&4)!==0,F=!b&&e==="scroll",d=b?f!==null?f+"Capture":null:f;b=[];for(var c=u,p;c!==null;){p=c;var x=p.stateNode;if(p.tag===5&&x!==null&&(p=x,d!==null&&(x=Fn(c,d),x!=null&&b.push(Gn(c,x,p)))),F)break;c=c.return}0<b.length&&(f=new v(f,w,null,n,g),m.push({event:f,listeners:b}))}}if((t&7)===0){e:{if(f=e==="mouseover"||e==="pointerover",v=e==="mouseout"||e==="pointerout",f&&n!==_i&&(w=n.relatedTarget||n.fromElement)&&(yt(w)||w[Ve]))break e;if((v||f)&&(f=g.window===g?g:(f=g.ownerDocument)?f.defaultView||f.parentWindow:window,v?(w=n.relatedTarget||n.toElement,v=u,w=w?yt(w):null,w!==null&&(F=zt(w),w!==F||w.tag!==5&&w.tag!==6)&&(w=null)):(v=null,w=u),v!==w)){if(b=Ol,x="onMouseLeave",d="onMouseEnter",c="mouse",(e==="pointerout"||e==="pointerover")&&(b=Hl,x="onPointerLeave",d="onPointerEnter",c="pointer"),F=v==null?f:Ut(v),p=w==null?f:Ut(w),f=new b(x,c+"leave",v,n,g),f.target=F,f.relatedTarget=p,x=null,yt(g)===u&&(b=new b(d,c+"enter",w,n,g),b.target=p,b.relatedTarget=F,x=b),F=x,v&&w)t:{for(b=v,d=w,c=0,p=b;p;p=Dt(p))c++;for(p=0,x=d;x;x=Dt(x))p++;for(;0<c-p;)b=Dt(b),c--;for(;0<p-c;)d=Dt(d),p--;for(;c--;){if(b===d||d!==null&&b===d.alternate)break t;b=Dt(b),d=Dt(d)}b=null}else b=null;v!==null&&Zl(m,f,v,b,!1),w!==null&&F!==null&&Zl(m,F,w,b,!0)}}e:{if(f=u?Ut(u):window,v=f.nodeName&&f.nodeName.toLowerCase(),v==="select"||v==="input"&&f.type==="file")var k=kp;else if(Bl(f))if(fc)k=Cp;else{k=Sp;var _=_p}else(v=f.nodeName)&&v.toLowerCase()==="input"&&(f.type==="checkbox"||f.type==="radio")&&(k=Ep);if(k&&(k=k(e,u))){pc(m,k,n,g);break e}_&&_(e,f,u),e==="focusout"&&(_=f._wrapperState)&&_.controlled&&f.type==="number"&&vi(f,"number",f.value)}switch(_=u?Ut(u):window,e){case"focusin":(Bl(_)||_.contentEditable==="true")&&(Ht=_,zi=u,Mn=null);break;case"focusout":Mn=zi=Ht=null;break;case"mousedown":Ri=!0;break;case"contextmenu":case"mouseup":case"dragend":Ri=!1,Ql(m,n,g);break;case"selectionchange":if(Pp)break;case"keydown":case"keyup":Ql(m,n,g)}var S;if(xa)e:{switch(e){case"compositionstart":var E="onCompositionStart";break e;case"compositionend":E="onCompositionEnd";break e;case"compositionupdate":E="onCompositionUpdate";break e}E=void 0}else Ft?uc(e,n)&&(E="onCompositionEnd"):e==="keydown"&&n.keyCode===229&&(E="onCompositionStart");E&&(cc&&n.locale!=="ko"&&(Ft||E!=="onCompositionStart"?E==="onCompositionEnd"&&Ft&&(S=sc()):(tt=g,ga="value"in tt?tt.value:tt.textContent,Ft=!0)),_=Yr(u,E),0<_.length&&(E=new Fl(E,e,null,n,g),m.push({event:E,listeners:_}),S?E.data=S:(S=dc(n),S!==null&&(E.data=S)))),(S=xp?vp(e,n):yp(e,n))&&(u=Yr(u,"onBeforeInput"),0<u.length&&(g=new Fl("onBeforeInput","beforeinput",null,n,g),m.push({event:g,listeners:u}),g.data=S))}_c(m,t)})}function Gn(e,t,n){return{instance:e,listener:t,currentTarget:n}}function Yr(e,t){for(var n=t+"Capture",r=[];e!==null;){var o=e,i=o.stateNode;o.tag===5&&i!==null&&(o=i,i=Fn(e,n),i!=null&&r.unshift(Gn(e,i,o)),i=Fn(e,t),i!=null&&r.push(Gn(e,i,o))),e=e.return}return r}function Dt(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5);return e||null}function Zl(e,t,n,r,o){for(var i=t._reactName,a=[];n!==null&&n!==r;){var l=n,s=l.alternate,u=l.stateNode;if(s!==null&&s===r)break;l.tag===5&&u!==null&&(l=u,o?(s=Fn(n,i),s!=null&&a.unshift(Gn(n,s,l))):o||(s=Fn(n,i),s!=null&&a.push(Gn(n,s,l)))),n=n.return}a.length!==0&&e.push({event:t,listeners:a})}var Rp=/\r\n?/g,Mp=/\u0000|\uFFFD/g;function $l(e){return(typeof e=="string"?e:""+e).replace(Rp,`
`).replace(Mp,"")}function Er(e,t,n){if(t=$l(t),$l(e)!==t&&n)throw Error(h(425))}function Kr(){}var Mi=null,Ni=null;function ji(e,t){return e==="textarea"||e==="noscript"||typeof t.children=="string"||typeof t.children=="number"||typeof t.dangerouslySetInnerHTML=="object"&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}var Li=typeof setTimeout=="function"?setTimeout:void 0,Np=typeof clearTimeout=="function"?clearTimeout:void 0,es=typeof Promise=="function"?Promise:void 0,jp=typeof queueMicrotask=="function"?queueMicrotask:typeof es<"u"?function(e){return es.resolve(null).then(e).catch(Lp)}:Li;function Lp(e){setTimeout(function(){throw e})}function ti(e,t){var n=t,r=0;do{var o=n.nextSibling;if(e.removeChild(n),o&&o.nodeType===8)if(n=o.data,n==="/$"){if(r===0){e.removeChild(o),Un(t);return}r--}else n!=="$"&&n!=="$?"&&n!=="$!"||r++;n=o}while(n);Un(t)}function at(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break;if(t===8){if(t=e.data,t==="$"||t==="$!"||t==="$?")break;if(t==="/$")return null}}return e}function ts(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n==="$"||n==="$!"||n==="$?"){if(t===0)return e;t--}else n==="/$"&&t++}e=e.previousSibling}return null}var un=Math.random().toString(36).slice(2),je="__reactFiber$"+un,Qn="__reactProps$"+un,Ve="__reactContainer$"+un,Di="__reactEvents$"+un,Dp="__reactListeners$"+un,Ip="__reactHandles$"+un;function yt(e){var t=e[je];if(t)return t;for(var n=e.parentNode;n;){if(t=n[Ve]||n[je]){if(n=t.alternate,t.child!==null||n!==null&&n.child!==null)for(e=ts(e);e!==null;){if(n=e[je])return n;e=ts(e)}return t}e=n,n=e.parentNode}return null}function nr(e){return e=e[je]||e[Ve],!e||e.tag!==5&&e.tag!==6&&e.tag!==13&&e.tag!==3?null:e}function Ut(e){if(e.tag===5||e.tag===6)return e.stateNode;throw Error(h(33))}function ho(e){return e[Qn]||null}var Ii=[],Bt=-1;function gt(e){return{current:e}}function N(e){0>Bt||(e.current=Ii[Bt],Ii[Bt]=null,Bt--)}function R(e,t){Bt++,Ii[Bt]=e.current,e.current=t}var pt={},ee=gt(pt),le=gt(!1),St=pt;function nn(e,t){var n=e.type.contextTypes;if(!n)return pt;var r=e.stateNode;if(r&&r.__reactInternalMemoizedUnmaskedChildContext===t)return r.__reactInternalMemoizedMaskedChildContext;var o={},i;for(i in n)o[i]=t[i];return r&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=t,e.__reactInternalMemoizedMaskedChildContext=o),o}function se(e){return e=e.childContextTypes,e!=null}function Xr(){N(le),N(ee)}function ns(e,t,n){if(ee.current!==pt)throw Error(h(168));R(ee,t),R(le,n)}function Ec(e,t,n){var r=e.stateNode;if(t=t.childContextTypes,typeof r.getChildContext!="function")return n;r=r.getChildContext();for(var o in r)if(!(o in t))throw Error(h(108,_d(e)||"Unknown",o));return I({},n,r)}function Jr(e){return e=(e=e.stateNode)&&e.__reactInternalMemoizedMergedChildContext||pt,St=ee.current,R(ee,e),R(le,le.current),!0}function rs(e,t,n){var r=e.stateNode;if(!r)throw Error(h(169));n?(e=Ec(e,t,St),r.__reactInternalMemoizedMergedChildContext=e,N(le),N(ee),R(ee,e)):N(le),R(le,n)}var Fe=null,xo=!1,ni=!1;function Cc(e){Fe===null?Fe=[e]:Fe.push(e)}function Op(e){xo=!0,Cc(e)}function mt(){if(!ni&&Fe!==null){ni=!0;var e=0,t=P;try{var n=Fe;for(P=1;e<n.length;e++){var r=n[e];do r=r(!0);while(r!==null)}Fe=null,xo=!1}catch(o){throw Fe!==null&&(Fe=Fe.slice(e+1)),Js(ua,mt),o}finally{P=t,ni=!1}}return null}var Vt=[],qt=0,Zr=null,$r=0,xe=[],ve=0,Et=null,He=1,We="";function xt(e,t){Vt[qt++]=$r,Vt[qt++]=Zr,Zr=e,$r=t}function Tc(e,t,n){xe[ve++]=He,xe[ve++]=We,xe[ve++]=Et,Et=e;var r=He;e=We;var o=32-Ae(r)-1;r&=~(1<<o),n+=1;var i=32-Ae(t)+o;if(30<i){var a=o-o%5;i=(r&(1<<a)-1).toString(32),r>>=a,o-=a,He=1<<32-Ae(t)+o|n<<o|r,We=i+e}else He=1<<i|n<<o|r,We=e}function ya(e){e.return!==null&&(xt(e,1),Tc(e,1,0))}function wa(e){for(;e===Zr;)Zr=Vt[--qt],Vt[qt]=null,$r=Vt[--qt],Vt[qt]=null;for(;e===Et;)Et=xe[--ve],xe[ve]=null,We=xe[--ve],xe[ve]=null,He=xe[--ve],xe[ve]=null}var pe=null,de=null,j=!1,Te=null;function Ac(e,t){var n=ye(5,null,null,0);n.elementType="DELETED",n.stateNode=t,n.return=e,t=e.deletions,t===null?(e.deletions=[n],e.flags|=16):t.push(n)}function os(e,t){switch(e.tag){case 5:var n=e.type;return t=t.nodeType!==1||n.toLowerCase()!==t.nodeName.toLowerCase()?null:t,t!==null?(e.stateNode=t,pe=e,de=at(t.firstChild),!0):!1;case 6:return t=e.pendingProps===""||t.nodeType!==3?null:t,t!==null?(e.stateNode=t,pe=e,de=null,!0):!1;case 13:return t=t.nodeType!==8?null:t,t!==null?(n=Et!==null?{id:He,overflow:We}:null,e.memoizedState={dehydrated:t,treeContext:n,retryLane:1073741824},n=ye(18,null,null,0),n.stateNode=t,n.return=e,e.child=n,pe=e,de=null,!0):!1;default:return!1}}function Oi(e){return(e.mode&1)!==0&&(e.flags&128)===0}function Fi(e){if(j){var t=de;if(t){var n=t;if(!os(e,t)){if(Oi(e))throw Error(h(418));t=at(n.nextSibling);var r=pe;t&&os(e,t)?Ac(r,n):(e.flags=e.flags&-4097|2,j=!1,pe=e)}}else{if(Oi(e))throw Error(h(418));e.flags=e.flags&-4097|2,j=!1,pe=e}}}function is(e){for(e=e.return;e!==null&&e.tag!==5&&e.tag!==3&&e.tag!==13;)e=e.return;pe=e}function Cr(e){if(e!==pe)return!1;if(!j)return is(e),j=!0,!1;var t;if((t=e.tag!==3)&&!(t=e.tag!==5)&&(t=e.type,t=t!=="head"&&t!=="body"&&!ji(e.type,e.memoizedProps)),t&&(t=de)){if(Oi(e))throw Pc(),Error(h(418));for(;t;)Ac(e,t),t=at(t.nextSibling)}if(is(e),e.tag===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(h(317));e:{for(e=e.nextSibling,t=0;e;){if(e.nodeType===8){var n=e.data;if(n==="/$"){if(t===0){de=at(e.nextSibling);break e}t--}else n!=="$"&&n!=="$!"&&n!=="$?"||t++}e=e.nextSibling}de=null}}else de=pe?at(e.stateNode.nextSibling):null;return!0}function Pc(){for(var e=de;e;)e=at(e.nextSibling)}function rn(){de=pe=null,j=!1}function ba(e){Te===null?Te=[e]:Te.push(e)}var Fp=Qe.ReactCurrentBatchConfig;function wn(e,t,n){if(e=n.ref,e!==null&&typeof e!="function"&&typeof e!="object"){if(n._owner){if(n=n._owner,n){if(n.tag!==1)throw Error(h(309));var r=n.stateNode}if(!r)throw Error(h(147,e));var o=r,i=""+e;return t!==null&&t.ref!==null&&typeof t.ref=="function"&&t.ref._stringRef===i?t.ref:(t=function(a){var l=o.refs;a===null?delete l[i]:l[i]=a},t._stringRef=i,t)}if(typeof e!="string")throw Error(h(284));if(!n._owner)throw Error(h(290,e))}return e}function Tr(e,t){throw e=Object.prototype.toString.call(t),Error(h(31,e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e))}function as(e){var t=e._init;return t(e._payload)}function zc(e){function t(d,c){if(e){var p=d.deletions;p===null?(d.deletions=[c],d.flags|=16):p.push(c)}}function n(d,c){if(!e)return null;for(;c!==null;)t(d,c),c=c.sibling;return null}function r(d,c){for(d=new Map;c!==null;)c.key!==null?d.set(c.key,c):d.set(c.index,c),c=c.sibling;return d}function o(d,c){return d=ut(d,c),d.index=0,d.sibling=null,d}function i(d,c,p){return d.index=p,e?(p=d.alternate,p!==null?(p=p.index,p<c?(d.flags|=2,c):p):(d.flags|=2,c)):(d.flags|=1048576,c)}function a(d){return e&&d.alternate===null&&(d.flags|=2),d}function l(d,c,p,x){return c===null||c.tag!==6?(c=ci(p,d.mode,x),c.return=d,c):(c=o(c,p),c.return=d,c)}function s(d,c,p,x){var k=p.type;return k===Ot?g(d,c,p.props.children,x,p.key):c!==null&&(c.elementType===k||typeof k=="object"&&k!==null&&k.$$typeof===Je&&as(k)===c.type)?(x=o(c,p.props),x.ref=wn(d,c,p),x.return=d,x):(x=Hr(p.type,p.key,p.props,null,d.mode,x),x.ref=wn(d,c,p),x.return=d,x)}function u(d,c,p,x){return c===null||c.tag!==4||c.stateNode.containerInfo!==p.containerInfo||c.stateNode.implementation!==p.implementation?(c=ui(p,d.mode,x),c.return=d,c):(c=o(c,p.children||[]),c.return=d,c)}function g(d,c,p,x,k){return c===null||c.tag!==7?(c=_t(p,d.mode,x,k),c.return=d,c):(c=o(c,p),c.return=d,c)}function m(d,c,p){if(typeof c=="string"&&c!==""||typeof c=="number")return c=ci(""+c,d.mode,p),c.return=d,c;if(typeof c=="object"&&c!==null){switch(c.$$typeof){case pr:return p=Hr(c.type,c.key,c.props,null,d.mode,p),p.ref=wn(d,null,c),p.return=d,p;case It:return c=ui(c,d.mode,p),c.return=d,c;case Je:var x=c._init;return m(d,x(c._payload),p)}if(En(c)||hn(c))return c=_t(c,d.mode,p,null),c.return=d,c;Tr(d,c)}return null}function f(d,c,p,x){var k=c!==null?c.key:null;if(typeof p=="string"&&p!==""||typeof p=="number")return k!==null?null:l(d,c,""+p,x);if(typeof p=="object"&&p!==null){switch(p.$$typeof){case pr:return p.key===k?s(d,c,p,x):null;case It:return p.key===k?u(d,c,p,x):null;case Je:return k=p._init,f(d,c,k(p._payload),x)}if(En(p)||hn(p))return k!==null?null:g(d,c,p,x,null);Tr(d,p)}return null}function v(d,c,p,x,k){if(typeof x=="string"&&x!==""||typeof x=="number")return d=d.get(p)||null,l(c,d,""+x,k);if(typeof x=="object"&&x!==null){switch(x.$$typeof){case pr:return d=d.get(x.key===null?p:x.key)||null,s(c,d,x,k);case It:return d=d.get(x.key===null?p:x.key)||null,u(c,d,x,k);case Je:var _=x._init;return v(d,c,p,_(x._payload),k)}if(En(x)||hn(x))return d=d.get(p)||null,g(c,d,x,k,null);Tr(c,x)}return null}function w(d,c,p,x){for(var k=null,_=null,S=c,E=c=0,V=null;S!==null&&E<p.length;E++){S.index>E?(V=S,S=null):V=S.sibling;var A=f(d,S,p[E],x);if(A===null){S===null&&(S=V);break}e&&S&&A.alternate===null&&t(d,S),c=i(A,c,E),_===null?k=A:_.sibling=A,_=A,S=V}if(E===p.length)return n(d,S),j&&xt(d,E),k;if(S===null){for(;E<p.length;E++)S=m(d,p[E],x),S!==null&&(c=i(S,c,E),_===null?k=S:_.sibling=S,_=S);return j&&xt(d,E),k}for(S=r(d,S);E<p.length;E++)V=v(S,d,E,p[E],x),V!==null&&(e&&V.alternate!==null&&S.delete(V.key===null?E:V.key),c=i(V,c,E),_===null?k=V:_.sibling=V,_=V);return e&&S.forEach(function(Ye){return t(d,Ye)}),j&&xt(d,E),k}function b(d,c,p,x){var k=hn(p);if(typeof k!="function")throw Error(h(150));if(p=k.call(p),p==null)throw Error(h(151));for(var _=k=null,S=c,E=c=0,V=null,A=p.next();S!==null&&!A.done;E++,A=p.next()){S.index>E?(V=S,S=null):V=S.sibling;var Ye=f(d,S,A.value,x);if(Ye===null){S===null&&(S=V);break}e&&S&&Ye.alternate===null&&t(d,S),c=i(Ye,c,E),_===null?k=Ye:_.sibling=Ye,_=Ye,S=V}if(A.done)return n(d,S),j&&xt(d,E),k;if(S===null){for(;!A.done;E++,A=p.next())A=m(d,A.value,x),A!==null&&(c=i(A,c,E),_===null?k=A:_.sibling=A,_=A);return j&&xt(d,E),k}for(S=r(d,S);!A.done;E++,A=p.next())A=v(S,d,E,A.value,x),A!==null&&(e&&A.alternate!==null&&S.delete(A.key===null?E:A.key),c=i(A,c,E),_===null?k=A:_.sibling=A,_=A);return e&&S.forEach(function(Yu){return t(d,Yu)}),j&&xt(d,E),k}function F(d,c,p,x){if(typeof p=="object"&&p!==null&&p.type===Ot&&p.key===null&&(p=p.props.children),typeof p=="object"&&p!==null){switch(p.$$typeof){case pr:e:{for(var k=p.key,_=c;_!==null;){if(_.key===k){if(k=p.type,k===Ot){if(_.tag===7){n(d,_.sibling),c=o(_,p.props.children),c.return=d,d=c;break e}}else if(_.elementType===k||typeof k=="object"&&k!==null&&k.$$typeof===Je&&as(k)===_.type){n(d,_.sibling),c=o(_,p.props),c.ref=wn(d,_,p),c.return=d,d=c;break e}n(d,_);break}else t(d,_);_=_.sibling}p.type===Ot?(c=_t(p.props.children,d.mode,x,p.key),c.return=d,d=c):(x=Hr(p.type,p.key,p.props,null,d.mode,x),x.ref=wn(d,c,p),x.return=d,d=x)}return a(d);case It:e:{for(_=p.key;c!==null;){if(c.key===_)if(c.tag===4&&c.stateNode.containerInfo===p.containerInfo&&c.stateNode.implementation===p.implementation){n(d,c.sibling),c=o(c,p.children||[]),c.return=d,d=c;break e}else{n(d,c);break}else t(d,c);c=c.sibling}c=ui(p,d.mode,x),c.return=d,d=c}return a(d);case Je:return _=p._init,F(d,c,_(p._payload),x)}if(En(p))return w(d,c,p,x);if(hn(p))return b(d,c,p,x);Tr(d,p)}return typeof p=="string"&&p!==""||typeof p=="number"?(p=""+p,c!==null&&c.tag===6?(n(d,c.sibling),c=o(c,p),c.return=d,d=c):(n(d,c),c=ci(p,d.mode,x),c.return=d,d=c),a(d)):n(d,c)}return F}var on=zc(!0),Rc=zc(!1),eo=gt(null),to=null,Gt=null,ka=null;function _a(){ka=Gt=to=null}function Sa(e){var t=eo.current;N(eo),e._currentValue=t}function Hi(e,t,n){for(;e!==null;){var r=e.alternate;if((e.childLanes&t)!==t?(e.childLanes|=t,r!==null&&(r.childLanes|=t)):r!==null&&(r.childLanes&t)!==t&&(r.childLanes|=t),e===n)break;e=e.return}}function $t(e,t){to=e,ka=Gt=null,e=e.dependencies,e!==null&&e.firstContext!==null&&((e.lanes&t)!==0&&(ae=!0),e.firstContext=null)}function be(e){var t=e._currentValue;if(ka!==e)if(e={context:e,memoizedValue:t,next:null},Gt===null){if(to===null)throw Error(h(308));Gt=e,to.dependencies={lanes:0,firstContext:e}}else Gt=Gt.next=e;return t}var wt=null;function Ea(e){wt===null?wt=[e]:wt.push(e)}function Mc(e,t,n,r){var o=t.interleaved;return o===null?(n.next=n,Ea(t)):(n.next=o.next,o.next=n),t.interleaved=n,qe(e,r)}function qe(e,t){e.lanes|=t;var n=e.alternate;for(n!==null&&(n.lanes|=t),n=e,e=e.return;e!==null;)e.childLanes|=t,n=e.alternate,n!==null&&(n.childLanes|=t),n=e,e=e.return;return n.tag===3?n.stateNode:null}var Ze=!1;function Ca(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,interleaved:null,lanes:0},effects:null}}function Nc(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,effects:e.effects})}function Ue(e,t){return{eventTime:e,lane:t,tag:0,payload:null,callback:null,next:null}}function lt(e,t,n){var r=e.updateQueue;if(r===null)return null;if(r=r.shared,(T&2)!==0){var o=r.pending;return o===null?t.next=t:(t.next=o.next,o.next=t),r.pending=t,qe(e,n)}return o=r.interleaved,o===null?(t.next=t,Ea(r)):(t.next=o.next,o.next=t),r.interleaved=t,qe(e,n)}function jr(e,t,n){if(t=t.updateQueue,t!==null&&(t=t.shared,(n&4194240)!==0)){var r=t.lanes;r&=e.pendingLanes,n|=r,t.lanes=n,da(e,n)}}function ls(e,t){var n=e.updateQueue,r=e.alternate;if(r!==null&&(r=r.updateQueue,n===r)){var o=null,i=null;if(n=n.firstBaseUpdate,n!==null){do{var a={eventTime:n.eventTime,lane:n.lane,tag:n.tag,payload:n.payload,callback:n.callback,next:null};i===null?o=i=a:i=i.next=a,n=n.next}while(n!==null);i===null?o=i=t:i=i.next=t}else o=i=t;n={baseState:r.baseState,firstBaseUpdate:o,lastBaseUpdate:i,shared:r.shared,effects:r.effects},e.updateQueue=n;return}e=n.lastBaseUpdate,e===null?n.firstBaseUpdate=t:e.next=t,n.lastBaseUpdate=t}function no(e,t,n,r){var o=e.updateQueue;Ze=!1;var i=o.firstBaseUpdate,a=o.lastBaseUpdate,l=o.shared.pending;if(l!==null){o.shared.pending=null;var s=l,u=s.next;s.next=null,a===null?i=u:a.next=u,a=s;var g=e.alternate;g!==null&&(g=g.updateQueue,l=g.lastBaseUpdate,l!==a&&(l===null?g.firstBaseUpdate=u:l.next=u,g.lastBaseUpdate=s))}if(i!==null){var m=o.baseState;a=0,g=u=s=null,l=i;do{var f=l.lane,v=l.eventTime;if((r&f)===f){g!==null&&(g=g.next={eventTime:v,lane:0,tag:l.tag,payload:l.payload,callback:l.callback,next:null});e:{var w=e,b=l;switch(f=t,v=n,b.tag){case 1:if(w=b.payload,typeof w=="function"){m=w.call(v,m,f);break e}m=w;break e;case 3:w.flags=w.flags&-65537|128;case 0:if(w=b.payload,f=typeof w=="function"?w.call(v,m,f):w,f==null)break e;m=I({},m,f);break e;case 2:Ze=!0}}l.callback!==null&&l.lane!==0&&(e.flags|=64,f=o.effects,f===null?o.effects=[l]:f.push(l))}else v={eventTime:v,lane:f,tag:l.tag,payload:l.payload,callback:l.callback,next:null},g===null?(u=g=v,s=m):g=g.next=v,a|=f;if(l=l.next,l===null){if(l=o.shared.pending,l===null)break;f=l,l=f.next,f.next=null,o.lastBaseUpdate=f,o.shared.pending=null}}while(!0);if(g===null&&(s=m),o.baseState=s,o.firstBaseUpdate=u,o.lastBaseUpdate=g,t=o.shared.interleaved,t!==null){o=t;do a|=o.lane,o=o.next;while(o!==t)}else i===null&&(o.shared.lanes=0);Tt|=a,e.lanes=a,e.memoizedState=m}}function ss(e,t,n){if(e=t.effects,t.effects=null,e!==null)for(t=0;t<e.length;t++){var r=e[t],o=r.callback;if(o!==null){if(r.callback=null,r=n,typeof o!="function")throw Error(h(191,o));o.call(r)}}}var rr={},De=gt(rr),Yn=gt(rr),Kn=gt(rr);function bt(e){if(e===rr)throw Error(h(174));return e}function Ta(e,t){switch(R(Kn,t),R(Yn,e),R(De,rr),e=t.nodeType,e){case 9:case 11:t=(t=t.documentElement)?t.namespaceURI:wi(null,"");break;default:e=e===8?t.parentNode:t,t=e.namespaceURI||null,e=e.tagName,t=wi(t,e)}N(De),R(De,t)}function an(){N(De),N(Yn),N(Kn)}function jc(e){bt(Kn.current);var t=bt(De.current),n=wi(t,e.type);t!==n&&(R(Yn,e),R(De,n))}function Aa(e){Yn.current===e&&(N(De),N(Yn))}var L=gt(0);function ro(e){for(var t=e;t!==null;){if(t.tag===13){var n=t.memoizedState;if(n!==null&&(n=n.dehydrated,n===null||n.data==="$?"||n.data==="$!"))return t}else if(t.tag===19&&t.memoizedProps.revealOrder!==void 0){if((t.flags&128)!==0)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}var ri=[];function Pa(){for(var e=0;e<ri.length;e++)ri[e]._workInProgressVersionPrimary=null;ri.length=0}var Lr=Qe.ReactCurrentDispatcher,oi=Qe.ReactCurrentBatchConfig,Ct=0,D=null,U=null,q=null,oo=!1,Nn=!1,Xn=0,Hp=0;function J(){throw Error(h(321))}function za(e,t){if(t===null)return!1;for(var n=0;n<t.length&&n<e.length;n++)if(!ze(e[n],t[n]))return!1;return!0}function Ra(e,t,n,r,o,i){if(Ct=i,D=t,t.memoizedState=null,t.updateQueue=null,t.lanes=0,Lr.current=e===null||e.memoizedState===null?Vp:qp,e=n(r,o),Nn){i=0;do{if(Nn=!1,Xn=0,25<=i)throw Error(h(301));i+=1,q=U=null,t.updateQueue=null,Lr.current=Gp,e=n(r,o)}while(Nn)}if(Lr.current=io,t=U!==null&&U.next!==null,Ct=0,q=U=D=null,oo=!1,t)throw Error(h(300));return e}function Ma(){var e=Xn!==0;return Xn=0,e}function Ne(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return q===null?D.memoizedState=q=e:q=q.next=e,q}function ke(){if(U===null){var e=D.alternate;e=e!==null?e.memoizedState:null}else e=U.next;var t=q===null?D.memoizedState:q.next;if(t!==null)q=t,U=e;else{if(e===null)throw Error(h(310));U=e,e={memoizedState:U.memoizedState,baseState:U.baseState,baseQueue:U.baseQueue,queue:U.queue,next:null},q===null?D.memoizedState=q=e:q=q.next=e}return q}function Jn(e,t){return typeof t=="function"?t(e):t}function ii(e){var t=ke(),n=t.queue;if(n===null)throw Error(h(311));n.lastRenderedReducer=e;var r=U,o=r.baseQueue,i=n.pending;if(i!==null){if(o!==null){var a=o.next;o.next=i.next,i.next=a}r.baseQueue=o=i,n.pending=null}if(o!==null){i=o.next,r=r.baseState;var l=a=null,s=null,u=i;do{var g=u.lane;if((Ct&g)===g)s!==null&&(s=s.next={lane:0,action:u.action,hasEagerState:u.hasEagerState,eagerState:u.eagerState,next:null}),r=u.hasEagerState?u.eagerState:e(r,u.action);else{var m={lane:g,action:u.action,hasEagerState:u.hasEagerState,eagerState:u.eagerState,next:null};s===null?(l=s=m,a=r):s=s.next=m,D.lanes|=g,Tt|=g}u=u.next}while(u!==null&&u!==i);s===null?a=r:s.next=l,ze(r,t.memoizedState)||(ae=!0),t.memoizedState=r,t.baseState=a,t.baseQueue=s,n.lastRenderedState=r}if(e=n.interleaved,e!==null){o=e;do i=o.lane,D.lanes|=i,Tt|=i,o=o.next;while(o!==e)}else o===null&&(n.lanes=0);return[t.memoizedState,n.dispatch]}function ai(e){var t=ke(),n=t.queue;if(n===null)throw Error(h(311));n.lastRenderedReducer=e;var r=n.dispatch,o=n.pending,i=t.memoizedState;if(o!==null){n.pending=null;var a=o=o.next;do i=e(i,a.action),a=a.next;while(a!==o);ze(i,t.memoizedState)||(ae=!0),t.memoizedState=i,t.baseQueue===null&&(t.baseState=i),n.lastRenderedState=i}return[i,r]}function Lc(){}function Dc(e,t){var n=D,r=ke(),o=t(),i=!ze(r.memoizedState,o);if(i&&(r.memoizedState=o,ae=!0),r=r.queue,Na(Fc.bind(null,n,r,e),[e]),r.getSnapshot!==t||i||q!==null&&q.memoizedState.tag&1){if(n.flags|=2048,Zn(9,Oc.bind(null,n,r,o,t),void 0,null),G===null)throw Error(h(349));(Ct&30)!==0||Ic(n,t,o)}return o}function Ic(e,t,n){e.flags|=16384,e={getSnapshot:t,value:n},t=D.updateQueue,t===null?(t={lastEffect:null,stores:null},D.updateQueue=t,t.stores=[e]):(n=t.stores,n===null?t.stores=[e]:n.push(e))}function Oc(e,t,n,r){t.value=n,t.getSnapshot=r,Hc(t)&&Wc(e)}function Fc(e,t,n){return n(function(){Hc(t)&&Wc(e)})}function Hc(e){var t=e.getSnapshot;e=e.value;try{var n=t();return!ze(e,n)}catch{return!0}}function Wc(e){var t=qe(e,1);t!==null&&Pe(t,e,1,-1)}function cs(e){var t=Ne();return typeof e=="function"&&(e=e()),t.memoizedState=t.baseState=e,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:Jn,lastRenderedState:e},t.queue=e,e=e.dispatch=Bp.bind(null,D,e),[t.memoizedState,e]}function Zn(e,t,n,r){return e={tag:e,create:t,destroy:n,deps:r,next:null},t=D.updateQueue,t===null?(t={lastEffect:null,stores:null},D.updateQueue=t,t.lastEffect=e.next=e):(n=t.lastEffect,n===null?t.lastEffect=e.next=e:(r=n.next,n.next=e,e.next=r,t.lastEffect=e)),e}function Uc(){return ke().memoizedState}function Dr(e,t,n,r){var o=Ne();D.flags|=e,o.memoizedState=Zn(1|t,n,void 0,r===void 0?null:r)}function vo(e,t,n,r){var o=ke();r=r===void 0?null:r;var i=void 0;if(U!==null){var a=U.memoizedState;if(i=a.destroy,r!==null&&za(r,a.deps)){o.memoizedState=Zn(t,n,i,r);return}}D.flags|=e,o.memoizedState=Zn(1|t,n,i,r)}function us(e,t){return Dr(8390656,8,e,t)}function Na(e,t){return vo(2048,8,e,t)}function Bc(e,t){return vo(4,2,e,t)}function Vc(e,t){return vo(4,4,e,t)}function qc(e,t){if(typeof t=="function")return e=e(),t(e),function(){t(null)};if(t!=null)return e=e(),t.current=e,function(){t.current=null}}function Gc(e,t,n){return n=n!=null?n.concat([e]):null,vo(4,4,qc.bind(null,t,e),n)}function ja(){}function Qc(e,t){var n=ke();t=t===void 0?null:t;var r=n.memoizedState;return r!==null&&t!==null&&za(t,r[1])?r[0]:(n.memoizedState=[e,t],e)}function Yc(e,t){var n=ke();t=t===void 0?null:t;var r=n.memoizedState;return r!==null&&t!==null&&za(t,r[1])?r[0]:(e=e(),n.memoizedState=[e,t],e)}function Kc(e,t,n){return(Ct&21)===0?(e.baseState&&(e.baseState=!1,ae=!0),e.memoizedState=n):(ze(n,t)||(n=ec(),D.lanes|=n,Tt|=n,e.baseState=!0),t)}function Wp(e,t){var n=P;P=n!==0&&4>n?n:4,e(!0);var r=oi.transition;oi.transition={};try{e(!1),t()}finally{P=n,oi.transition=r}}function Xc(){return ke().memoizedState}function Up(e,t,n){var r=ct(e);if(n={lane:r,action:n,hasEagerState:!1,eagerState:null,next:null},Jc(e))Zc(t,n);else if(n=Mc(e,t,n,r),n!==null){var o=re();Pe(n,e,r,o),$c(n,t,r)}}function Bp(e,t,n){var r=ct(e),o={lane:r,action:n,hasEagerState:!1,eagerState:null,next:null};if(Jc(e))Zc(t,o);else{var i=e.alternate;if(e.lanes===0&&(i===null||i.lanes===0)&&(i=t.lastRenderedReducer,i!==null))try{var a=t.lastRenderedState,l=i(a,n);if(o.hasEagerState=!0,o.eagerState=l,ze(l,a)){var s=t.interleaved;s===null?(o.next=o,Ea(t)):(o.next=s.next,s.next=o),t.interleaved=o;return}}catch{}n=Mc(e,t,o,r),n!==null&&(o=re(),Pe(n,e,r,o),$c(n,t,r))}}function Jc(e){var t=e.alternate;return e===D||t!==null&&t===D}function Zc(e,t){Nn=oo=!0;var n=e.pending;n===null?t.next=t:(t.next=n.next,n.next=t),e.pending=t}function $c(e,t,n){if((n&4194240)!==0){var r=t.lanes;r&=e.pendingLanes,n|=r,t.lanes=n,da(e,n)}}var io={readContext:be,useCallback:J,useContext:J,useEffect:J,useImperativeHandle:J,useInsertionEffect:J,useLayoutEffect:J,useMemo:J,useReducer:J,useRef:J,useState:J,useDebugValue:J,useDeferredValue:J,useTransition:J,useMutableSource:J,useSyncExternalStore:J,useId:J,unstable_isNewReconciler:!1},Vp={readContext:be,useCallback:function(e,t){return Ne().memoizedState=[e,t===void 0?null:t],e},useContext:be,useEffect:us,useImperativeHandle:function(e,t,n){return n=n!=null?n.concat([e]):null,Dr(4194308,4,qc.bind(null,t,e),n)},useLayoutEffect:function(e,t){return Dr(4194308,4,e,t)},useInsertionEffect:function(e,t){return Dr(4,2,e,t)},useMemo:function(e,t){var n=Ne();return t=t===void 0?null:t,e=e(),n.memoizedState=[e,t],e},useReducer:function(e,t,n){var r=Ne();return t=n!==void 0?n(t):t,r.memoizedState=r.baseState=t,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:t},r.queue=e,e=e.dispatch=Up.bind(null,D,e),[r.memoizedState,e]},useRef:function(e){var t=Ne();return e={current:e},t.memoizedState=e},useState:cs,useDebugValue:ja,useDeferredValue:function(e){return Ne().memoizedState=e},useTransition:function(){var e=cs(!1),t=e[0];return e=Wp.bind(null,e[1]),Ne().memoizedState=e,[t,e]},useMutableSource:function(){},useSyncExternalStore:function(e,t,n){var r=D,o=Ne();if(j){if(n===void 0)throw Error(h(407));n=n()}else{if(n=t(),G===null)throw Error(h(349));(Ct&30)!==0||Ic(r,t,n)}o.memoizedState=n;var i={value:n,getSnapshot:t};return o.queue=i,us(Fc.bind(null,r,i,e),[e]),r.flags|=2048,Zn(9,Oc.bind(null,r,i,n,t),void 0,null),n},useId:function(){var e=Ne(),t=G.identifierPrefix;if(j){var n=We,r=He;n=(r&~(1<<32-Ae(r)-1)).toString(32)+n,t=":"+t+"R"+n,n=Xn++,0<n&&(t+="H"+n.toString(32)),t+=":"}else n=Hp++,t=":"+t+"r"+n.toString(32)+":";return e.memoizedState=t},unstable_isNewReconciler:!1},qp={readContext:be,useCallback:Qc,useContext:be,useEffect:Na,useImperativeHandle:Gc,useInsertionEffect:Bc,useLayoutEffect:Vc,useMemo:Yc,useReducer:ii,useRef:Uc,useState:function(){return ii(Jn)},useDebugValue:ja,useDeferredValue:function(e){var t=ke();return Kc(t,U.memoizedState,e)},useTransition:function(){var e=ii(Jn)[0],t=ke().memoizedState;return[e,t]},useMutableSource:Lc,useSyncExternalStore:Dc,useId:Xc,unstable_isNewReconciler:!1},Gp={readContext:be,useCallback:Qc,useContext:be,useEffect:Na,useImperativeHandle:Gc,useInsertionEffect:Bc,useLayoutEffect:Vc,useMemo:Yc,useReducer:ai,useRef:Uc,useState:function(){return ai(Jn)},useDebugValue:ja,useDeferredValue:function(e){var t=ke();return U===null?t.memoizedState=e:Kc(t,U.memoizedState,e)},useTransition:function(){var e=ai(Jn)[0],t=ke().memoizedState;return[e,t]},useMutableSource:Lc,useSyncExternalStore:Dc,useId:Xc,unstable_isNewReconciler:!1};function Ee(e,t){if(e&&e.defaultProps){t=I({},t),e=e.defaultProps;for(var n in e)t[n]===void 0&&(t[n]=e[n]);return t}return t}function Wi(e,t,n,r){t=e.memoizedState,n=n(r,t),n=n==null?t:I({},t,n),e.memoizedState=n,e.lanes===0&&(e.updateQueue.baseState=n)}var yo={isMounted:function(e){return(e=e._reactInternals)?zt(e)===e:!1},enqueueSetState:function(e,t,n){e=e._reactInternals;var r=re(),o=ct(e),i=Ue(r,o);i.payload=t,n!=null&&(i.callback=n),t=lt(e,i,o),t!==null&&(Pe(t,e,o,r),jr(t,e,o))},enqueueReplaceState:function(e,t,n){e=e._reactInternals;var r=re(),o=ct(e),i=Ue(r,o);i.tag=1,i.payload=t,n!=null&&(i.callback=n),t=lt(e,i,o),t!==null&&(Pe(t,e,o,r),jr(t,e,o))},enqueueForceUpdate:function(e,t){e=e._reactInternals;var n=re(),r=ct(e),o=Ue(n,r);o.tag=2,t!=null&&(o.callback=t),t=lt(e,o,r),t!==null&&(Pe(t,e,r,n),jr(t,e,r))}};function ds(e,t,n,r,o,i,a){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(r,i,a):t.prototype&&t.prototype.isPureReactComponent?!Vn(n,r)||!Vn(o,i):!0}function eu(e,t,n){var r=!1,o=pt,i=t.contextType;return typeof i=="object"&&i!==null?i=be(i):(o=se(t)?St:ee.current,r=t.contextTypes,i=(r=r!=null)?nn(e,o):pt),t=new t(n,i),e.memoizedState=t.state!==null&&t.state!==void 0?t.state:null,t.updater=yo,e.stateNode=t,t._reactInternals=e,r&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=o,e.__reactInternalMemoizedMaskedChildContext=i),t}function ps(e,t,n,r){e=t.state,typeof t.componentWillReceiveProps=="function"&&t.componentWillReceiveProps(n,r),typeof t.UNSAFE_componentWillReceiveProps=="function"&&t.UNSAFE_componentWillReceiveProps(n,r),t.state!==e&&yo.enqueueReplaceState(t,t.state,null)}function Ui(e,t,n,r){var o=e.stateNode;o.props=n,o.state=e.memoizedState,o.refs={},Ca(e);var i=t.contextType;typeof i=="object"&&i!==null?o.context=be(i):(i=se(t)?St:ee.current,o.context=nn(e,i)),o.state=e.memoizedState,i=t.getDerivedStateFromProps,typeof i=="function"&&(Wi(e,t,i,n),o.state=e.memoizedState),typeof t.getDerivedStateFromProps=="function"||typeof o.getSnapshotBeforeUpdate=="function"||typeof o.UNSAFE_componentWillMount!="function"&&typeof o.componentWillMount!="function"||(t=o.state,typeof o.componentWillMount=="function"&&o.componentWillMount(),typeof o.UNSAFE_componentWillMount=="function"&&o.UNSAFE_componentWillMount(),t!==o.state&&yo.enqueueReplaceState(o,o.state,null),no(e,n,o,r),o.state=e.memoizedState),typeof o.componentDidMount=="function"&&(e.flags|=4194308)}function ln(e,t){try{var n="",r=t;do n+=kd(r),r=r.return;while(r);var o=n}catch(i){o=`
Error generating stack: `+i.message+`
`+i.stack}return{value:e,source:t,stack:o,digest:null}}function li(e,t,n){return{value:e,source:null,stack:n??null,digest:t??null}}function Bi(e,t){try{console.error(t.value)}catch(n){setTimeout(function(){throw n})}}var Qp=typeof WeakMap=="function"?WeakMap:Map;function tu(e,t,n){n=Ue(-1,n),n.tag=3,n.payload={element:null};var r=t.value;return n.callback=function(){lo||(lo=!0,$i=r),Bi(e,t)},n}function nu(e,t,n){n=Ue(-1,n),n.tag=3;var r=e.type.getDerivedStateFromError;if(typeof r=="function"){var o=t.value;n.payload=function(){return r(o)},n.callback=function(){Bi(e,t)}}var i=e.stateNode;return i!==null&&typeof i.componentDidCatch=="function"&&(n.callback=function(){Bi(e,t),typeof r!="function"&&(st===null?st=new Set([this]):st.add(this));var a=t.stack;this.componentDidCatch(t.value,{componentStack:a!==null?a:""})}),n}function fs(e,t,n){var r=e.pingCache;if(r===null){r=e.pingCache=new Qp;var o=new Set;r.set(t,o)}else o=r.get(t),o===void 0&&(o=new Set,r.set(t,o));o.has(n)||(o.add(n),e=sf.bind(null,e,t,n),t.then(e,e))}function gs(e){do{var t;if((t=e.tag===13)&&(t=e.memoizedState,t=t!==null?t.dehydrated!==null:!0),t)return e;e=e.return}while(e!==null);return null}function ms(e,t,n,r,o){return(e.mode&1)===0?(e===t?e.flags|=65536:(e.flags|=128,n.flags|=131072,n.flags&=-52805,n.tag===1&&(n.alternate===null?n.tag=17:(t=Ue(-1,1),t.tag=2,lt(n,t,1))),n.lanes|=1),e):(e.flags|=65536,e.lanes=o,e)}var Yp=Qe.ReactCurrentOwner,ae=!1;function ne(e,t,n,r){t.child=e===null?Rc(t,null,n,r):on(t,e.child,n,r)}function hs(e,t,n,r,o){n=n.render;var i=t.ref;return $t(t,o),r=Ra(e,t,n,r,i,o),n=Ma(),e!==null&&!ae?(t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~o,Ge(e,t,o)):(j&&n&&ya(t),t.flags|=1,ne(e,t,r,o),t.child)}function xs(e,t,n,r,o){if(e===null){var i=n.type;return typeof i=="function"&&!Ua(i)&&i.defaultProps===void 0&&n.compare===null&&n.defaultProps===void 0?(t.tag=15,t.type=i,ru(e,t,i,r,o)):(e=Hr(n.type,null,r,t,t.mode,o),e.ref=t.ref,e.return=t,t.child=e)}if(i=e.child,(e.lanes&o)===0){var a=i.memoizedProps;if(n=n.compare,n=n!==null?n:Vn,n(a,r)&&e.ref===t.ref)return Ge(e,t,o)}return t.flags|=1,e=ut(i,r),e.ref=t.ref,e.return=t,t.child=e}function ru(e,t,n,r,o){if(e!==null){var i=e.memoizedProps;if(Vn(i,r)&&e.ref===t.ref)if(ae=!1,t.pendingProps=r=i,(e.lanes&o)!==0)(e.flags&131072)!==0&&(ae=!0);else return t.lanes=e.lanes,Ge(e,t,o)}return Vi(e,t,n,r,o)}function ou(e,t,n){var r=t.pendingProps,o=r.children,i=e!==null?e.memoizedState:null;if(r.mode==="hidden")if((t.mode&1)===0)t.memoizedState={baseLanes:0,cachePool:null,transitions:null},R(Yt,ue),ue|=n;else{if((n&1073741824)===0)return e=i!==null?i.baseLanes|n:n,t.lanes=t.childLanes=1073741824,t.memoizedState={baseLanes:e,cachePool:null,transitions:null},t.updateQueue=null,R(Yt,ue),ue|=e,null;t.memoizedState={baseLanes:0,cachePool:null,transitions:null},r=i!==null?i.baseLanes:n,R(Yt,ue),ue|=r}else i!==null?(r=i.baseLanes|n,t.memoizedState=null):r=n,R(Yt,ue),ue|=r;return ne(e,t,o,n),t.child}function iu(e,t){var n=t.ref;(e===null&&n!==null||e!==null&&e.ref!==n)&&(t.flags|=512,t.flags|=2097152)}function Vi(e,t,n,r,o){var i=se(n)?St:ee.current;return i=nn(t,i),$t(t,o),n=Ra(e,t,n,r,i,o),r=Ma(),e!==null&&!ae?(t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~o,Ge(e,t,o)):(j&&r&&ya(t),t.flags|=1,ne(e,t,n,o),t.child)}function vs(e,t,n,r,o){if(se(n)){var i=!0;Jr(t)}else i=!1;if($t(t,o),t.stateNode===null)Ir(e,t),eu(t,n,r),Ui(t,n,r,o),r=!0;else if(e===null){var a=t.stateNode,l=t.memoizedProps;a.props=l;var s=a.context,u=n.contextType;typeof u=="object"&&u!==null?u=be(u):(u=se(n)?St:ee.current,u=nn(t,u));var g=n.getDerivedStateFromProps,m=typeof g=="function"||typeof a.getSnapshotBeforeUpdate=="function";m||typeof a.UNSAFE_componentWillReceiveProps!="function"&&typeof a.componentWillReceiveProps!="function"||(l!==r||s!==u)&&ps(t,a,r,u),Ze=!1;var f=t.memoizedState;a.state=f,no(t,r,a,o),s=t.memoizedState,l!==r||f!==s||le.current||Ze?(typeof g=="function"&&(Wi(t,n,g,r),s=t.memoizedState),(l=Ze||ds(t,n,l,r,f,s,u))?(m||typeof a.UNSAFE_componentWillMount!="function"&&typeof a.componentWillMount!="function"||(typeof a.componentWillMount=="function"&&a.componentWillMount(),typeof a.UNSAFE_componentWillMount=="function"&&a.UNSAFE_componentWillMount()),typeof a.componentDidMount=="function"&&(t.flags|=4194308)):(typeof a.componentDidMount=="function"&&(t.flags|=4194308),t.memoizedProps=r,t.memoizedState=s),a.props=r,a.state=s,a.context=u,r=l):(typeof a.componentDidMount=="function"&&(t.flags|=4194308),r=!1)}else{a=t.stateNode,Nc(e,t),l=t.memoizedProps,u=t.type===t.elementType?l:Ee(t.type,l),a.props=u,m=t.pendingProps,f=a.context,s=n.contextType,typeof s=="object"&&s!==null?s=be(s):(s=se(n)?St:ee.current,s=nn(t,s));var v=n.getDerivedStateFromProps;(g=typeof v=="function"||typeof a.getSnapshotBeforeUpdate=="function")||typeof a.UNSAFE_componentWillReceiveProps!="function"&&typeof a.componentWillReceiveProps!="function"||(l!==m||f!==s)&&ps(t,a,r,s),Ze=!1,f=t.memoizedState,a.state=f,no(t,r,a,o);var w=t.memoizedState;l!==m||f!==w||le.current||Ze?(typeof v=="function"&&(Wi(t,n,v,r),w=t.memoizedState),(u=Ze||ds(t,n,u,r,f,w,s)||!1)?(g||typeof a.UNSAFE_componentWillUpdate!="function"&&typeof a.componentWillUpdate!="function"||(typeof a.componentWillUpdate=="function"&&a.componentWillUpdate(r,w,s),typeof a.UNSAFE_componentWillUpdate=="function"&&a.UNSAFE_componentWillUpdate(r,w,s)),typeof a.componentDidUpdate=="function"&&(t.flags|=4),typeof a.getSnapshotBeforeUpdate=="function"&&(t.flags|=1024)):(typeof a.componentDidUpdate!="function"||l===e.memoizedProps&&f===e.memoizedState||(t.flags|=4),typeof a.getSnapshotBeforeUpdate!="function"||l===e.memoizedProps&&f===e.memoizedState||(t.flags|=1024),t.memoizedProps=r,t.memoizedState=w),a.props=r,a.state=w,a.context=s,r=u):(typeof a.componentDidUpdate!="function"||l===e.memoizedProps&&f===e.memoizedState||(t.flags|=4),typeof a.getSnapshotBeforeUpdate!="function"||l===e.memoizedProps&&f===e.memoizedState||(t.flags|=1024),r=!1)}return qi(e,t,n,r,i,o)}function qi(e,t,n,r,o,i){iu(e,t);var a=(t.flags&128)!==0;if(!r&&!a)return o&&rs(t,n,!1),Ge(e,t,i);r=t.stateNode,Yp.current=t;var l=a&&typeof n.getDerivedStateFromError!="function"?null:r.render();return t.flags|=1,e!==null&&a?(t.child=on(t,e.child,null,i),t.child=on(t,null,l,i)):ne(e,t,l,i),t.memoizedState=r.state,o&&rs(t,n,!0),t.child}function au(e){var t=e.stateNode;t.pendingContext?ns(e,t.pendingContext,t.pendingContext!==t.context):t.context&&ns(e,t.context,!1),Ta(e,t.containerInfo)}function ys(e,t,n,r,o){return rn(),ba(o),t.flags|=256,ne(e,t,n,r),t.child}var Gi={dehydrated:null,treeContext:null,retryLane:0};function Qi(e){return{baseLanes:e,cachePool:null,transitions:null}}function lu(e,t,n){var r=t.pendingProps,o=L.current,i=!1,a=(t.flags&128)!==0,l;if((l=a)||(l=e!==null&&e.memoizedState===null?!1:(o&2)!==0),l?(i=!0,t.flags&=-129):(e===null||e.memoizedState!==null)&&(o|=1),R(L,o&1),e===null)return Fi(t),e=t.memoizedState,e!==null&&(e=e.dehydrated,e!==null)?((t.mode&1)===0?t.lanes=1:e.data==="$!"?t.lanes=8:t.lanes=1073741824,null):(a=r.children,e=r.fallback,i?(r=t.mode,i=t.child,a={mode:"hidden",children:a},(r&1)===0&&i!==null?(i.childLanes=0,i.pendingProps=a):i=ko(a,r,0,null),e=_t(e,r,n,null),i.return=t,e.return=t,i.sibling=e,t.child=i,t.child.memoizedState=Qi(n),t.memoizedState=Gi,e):La(t,a));if(o=e.memoizedState,o!==null&&(l=o.dehydrated,l!==null))return Kp(e,t,a,r,l,o,n);if(i){i=r.fallback,a=t.mode,o=e.child,l=o.sibling;var s={mode:"hidden",children:r.children};return(a&1)===0&&t.child!==o?(r=t.child,r.childLanes=0,r.pendingProps=s,t.deletions=null):(r=ut(o,s),r.subtreeFlags=o.subtreeFlags&14680064),l!==null?i=ut(l,i):(i=_t(i,a,n,null),i.flags|=2),i.return=t,r.return=t,r.sibling=i,t.child=r,r=i,i=t.child,a=e.child.memoizedState,a=a===null?Qi(n):{baseLanes:a.baseLanes|n,cachePool:null,transitions:a.transitions},i.memoizedState=a,i.childLanes=e.childLanes&~n,t.memoizedState=Gi,r}return i=e.child,e=i.sibling,r=ut(i,{mode:"visible",children:r.children}),(t.mode&1)===0&&(r.lanes=n),r.return=t,r.sibling=null,e!==null&&(n=t.deletions,n===null?(t.deletions=[e],t.flags|=16):n.push(e)),t.child=r,t.memoizedState=null,r}function La(e,t){return t=ko({mode:"visible",children:t},e.mode,0,null),t.return=e,e.child=t}function Ar(e,t,n,r){return r!==null&&ba(r),on(t,e.child,null,n),e=La(t,t.pendingProps.children),e.flags|=2,t.memoizedState=null,e}function Kp(e,t,n,r,o,i,a){if(n)return t.flags&256?(t.flags&=-257,r=li(Error(h(422))),Ar(e,t,a,r)):t.memoizedState!==null?(t.child=e.child,t.flags|=128,null):(i=r.fallback,o=t.mode,r=ko({mode:"visible",children:r.children},o,0,null),i=_t(i,o,a,null),i.flags|=2,r.return=t,i.return=t,r.sibling=i,t.child=r,(t.mode&1)!==0&&on(t,e.child,null,a),t.child.memoizedState=Qi(a),t.memoizedState=Gi,i);if((t.mode&1)===0)return Ar(e,t,a,null);if(o.data==="$!"){if(r=o.nextSibling&&o.nextSibling.dataset,r)var l=r.dgst;return r=l,i=Error(h(419)),r=li(i,r,void 0),Ar(e,t,a,r)}if(l=(a&e.childLanes)!==0,ae||l){if(r=G,r!==null){switch(a&-a){case 4:o=2;break;case 16:o=8;break;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:o=32;break;case 536870912:o=268435456;break;default:o=0}o=(o&(r.suspendedLanes|a))!==0?0:o,o!==0&&o!==i.retryLane&&(i.retryLane=o,qe(e,o),Pe(r,e,o,-1))}return Wa(),r=li(Error(h(421))),Ar(e,t,a,r)}return o.data==="$?"?(t.flags|=128,t.child=e.child,t=cf.bind(null,e),o._reactRetry=t,null):(e=i.treeContext,de=at(o.nextSibling),pe=t,j=!0,Te=null,e!==null&&(xe[ve++]=He,xe[ve++]=We,xe[ve++]=Et,He=e.id,We=e.overflow,Et=t),t=La(t,r.children),t.flags|=4096,t)}function ws(e,t,n){e.lanes|=t;var r=e.alternate;r!==null&&(r.lanes|=t),Hi(e.return,t,n)}function si(e,t,n,r,o){var i=e.memoizedState;i===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:r,tail:n,tailMode:o}:(i.isBackwards=t,i.rendering=null,i.renderingStartTime=0,i.last=r,i.tail=n,i.tailMode=o)}function su(e,t,n){var r=t.pendingProps,o=r.revealOrder,i=r.tail;if(ne(e,t,r.children,n),r=L.current,(r&2)!==0)r=r&1|2,t.flags|=128;else{if(e!==null&&(e.flags&128)!==0)e:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&ws(e,n,t);else if(e.tag===19)ws(e,n,t);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break e;for(;e.sibling===null;){if(e.return===null||e.return===t)break e;e=e.return}e.sibling.return=e.return,e=e.sibling}r&=1}if(R(L,r),(t.mode&1)===0)t.memoizedState=null;else switch(o){case"forwards":for(n=t.child,o=null;n!==null;)e=n.alternate,e!==null&&ro(e)===null&&(o=n),n=n.sibling;n=o,n===null?(o=t.child,t.child=null):(o=n.sibling,n.sibling=null),si(t,!1,o,n,i);break;case"backwards":for(n=null,o=t.child,t.child=null;o!==null;){if(e=o.alternate,e!==null&&ro(e)===null){t.child=o;break}e=o.sibling,o.sibling=n,n=o,o=e}si(t,!0,n,null,i);break;case"together":si(t,!1,null,null,void 0);break;default:t.memoizedState=null}return t.child}function Ir(e,t){(t.mode&1)===0&&e!==null&&(e.alternate=null,t.alternate=null,t.flags|=2)}function Ge(e,t,n){if(e!==null&&(t.dependencies=e.dependencies),Tt|=t.lanes,(n&t.childLanes)===0)return null;if(e!==null&&t.child!==e.child)throw Error(h(153));if(t.child!==null){for(e=t.child,n=ut(e,e.pendingProps),t.child=n,n.return=t;e.sibling!==null;)e=e.sibling,n=n.sibling=ut(e,e.pendingProps),n.return=t;n.sibling=null}return t.child}function Xp(e,t,n){switch(t.tag){case 3:au(t),rn();break;case 5:jc(t);break;case 1:se(t.type)&&Jr(t);break;case 4:Ta(t,t.stateNode.containerInfo);break;case 10:var r=t.type._context,o=t.memoizedProps.value;R(eo,r._currentValue),r._currentValue=o;break;case 13:if(r=t.memoizedState,r!==null)return r.dehydrated!==null?(R(L,L.current&1),t.flags|=128,null):(n&t.child.childLanes)!==0?lu(e,t,n):(R(L,L.current&1),e=Ge(e,t,n),e!==null?e.sibling:null);R(L,L.current&1);break;case 19:if(r=(n&t.childLanes)!==0,(e.flags&128)!==0){if(r)return su(e,t,n);t.flags|=128}if(o=t.memoizedState,o!==null&&(o.rendering=null,o.tail=null,o.lastEffect=null),R(L,L.current),r)break;return null;case 22:case 23:return t.lanes=0,ou(e,t,n)}return Ge(e,t,n)}var cu,Yi,uu,du;cu=function(e,t){for(var n=t.child;n!==null;){if(n.tag===5||n.tag===6)e.appendChild(n.stateNode);else if(n.tag!==4&&n.child!==null){n.child.return=n,n=n.child;continue}if(n===t)break;for(;n.sibling===null;){if(n.return===null||n.return===t)return;n=n.return}n.sibling.return=n.return,n=n.sibling}};Yi=function(){};uu=function(e,t,n,r){var o=e.memoizedProps;if(o!==r){e=t.stateNode,bt(De.current);var i=null;switch(n){case"input":o=hi(e,o),r=hi(e,r),i=[];break;case"select":o=I({},o,{value:void 0}),r=I({},r,{value:void 0}),i=[];break;case"textarea":o=yi(e,o),r=yi(e,r),i=[];break;default:typeof o.onClick!="function"&&typeof r.onClick=="function"&&(e.onclick=Kr)}bi(n,r);var a;n=null;for(u in o)if(!r.hasOwnProperty(u)&&o.hasOwnProperty(u)&&o[u]!=null)if(u==="style"){var l=o[u];for(a in l)l.hasOwnProperty(a)&&(n||(n={}),n[a]="")}else u!=="dangerouslySetInnerHTML"&&u!=="children"&&u!=="suppressContentEditableWarning"&&u!=="suppressHydrationWarning"&&u!=="autoFocus"&&(In.hasOwnProperty(u)?i||(i=[]):(i=i||[]).push(u,null));for(u in r){var s=r[u];if(l=o?.[u],r.hasOwnProperty(u)&&s!==l&&(s!=null||l!=null))if(u==="style")if(l){for(a in l)!l.hasOwnProperty(a)||s&&s.hasOwnProperty(a)||(n||(n={}),n[a]="");for(a in s)s.hasOwnProperty(a)&&l[a]!==s[a]&&(n||(n={}),n[a]=s[a])}else n||(i||(i=[]),i.push(u,n)),n=s;else u==="dangerouslySetInnerHTML"?(s=s?s.__html:void 0,l=l?l.__html:void 0,s!=null&&l!==s&&(i=i||[]).push(u,s)):u==="children"?typeof s!="string"&&typeof s!="number"||(i=i||[]).push(u,""+s):u!=="suppressContentEditableWarning"&&u!=="suppressHydrationWarning"&&(In.hasOwnProperty(u)?(s!=null&&u==="onScroll"&&M("scroll",e),i||l===s||(i=[])):(i=i||[]).push(u,s))}n&&(i=i||[]).push("style",n);var u=i;(t.updateQueue=u)&&(t.flags|=4)}};du=function(e,t,n,r){n!==r&&(t.flags|=4)};function bn(e,t){if(!j)switch(e.tailMode){case"hidden":t=e.tail;for(var n=null;t!==null;)t.alternate!==null&&(n=t),t=t.sibling;n===null?e.tail=null:n.sibling=null;break;case"collapsed":n=e.tail;for(var r=null;n!==null;)n.alternate!==null&&(r=n),n=n.sibling;r===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:r.sibling=null}}function Z(e){var t=e.alternate!==null&&e.alternate.child===e.child,n=0,r=0;if(t)for(var o=e.child;o!==null;)n|=o.lanes|o.childLanes,r|=o.subtreeFlags&14680064,r|=o.flags&14680064,o.return=e,o=o.sibling;else for(o=e.child;o!==null;)n|=o.lanes|o.childLanes,r|=o.subtreeFlags,r|=o.flags,o.return=e,o=o.sibling;return e.subtreeFlags|=r,e.childLanes=n,t}function Jp(e,t,n){var r=t.pendingProps;switch(wa(t),t.tag){case 2:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return Z(t),null;case 1:return se(t.type)&&Xr(),Z(t),null;case 3:return r=t.stateNode,an(),N(le),N(ee),Pa(),r.pendingContext&&(r.context=r.pendingContext,r.pendingContext=null),(e===null||e.child===null)&&(Cr(t)?t.flags|=4:e===null||e.memoizedState.isDehydrated&&(t.flags&256)===0||(t.flags|=1024,Te!==null&&(na(Te),Te=null))),Yi(e,t),Z(t),null;case 5:Aa(t);var o=bt(Kn.current);if(n=t.type,e!==null&&t.stateNode!=null)uu(e,t,n,r,o),e.ref!==t.ref&&(t.flags|=512,t.flags|=2097152);else{if(!r){if(t.stateNode===null)throw Error(h(166));return Z(t),null}if(e=bt(De.current),Cr(t)){r=t.stateNode,n=t.type;var i=t.memoizedProps;switch(r[je]=t,r[Qn]=i,e=(t.mode&1)!==0,n){case"dialog":M("cancel",r),M("close",r);break;case"iframe":case"object":case"embed":M("load",r);break;case"video":case"audio":for(o=0;o<Tn.length;o++)M(Tn[o],r);break;case"source":M("error",r);break;case"img":case"image":case"link":M("error",r),M("load",r);break;case"details":M("toggle",r);break;case"input":Al(r,i),M("invalid",r);break;case"select":r._wrapperState={wasMultiple:!!i.multiple},M("invalid",r);break;case"textarea":zl(r,i),M("invalid",r)}bi(n,i),o=null;for(var a in i)if(i.hasOwnProperty(a)){var l=i[a];a==="children"?typeof l=="string"?r.textContent!==l&&(i.suppressHydrationWarning!==!0&&Er(r.textContent,l,e),o=["children",l]):typeof l=="number"&&r.textContent!==""+l&&(i.suppressHydrationWarning!==!0&&Er(r.textContent,l,e),o=["children",""+l]):In.hasOwnProperty(a)&&l!=null&&a==="onScroll"&&M("scroll",r)}switch(n){case"input":fr(r),Pl(r,i,!0);break;case"textarea":fr(r),Rl(r);break;case"select":case"option":break;default:typeof i.onClick=="function"&&(r.onclick=Kr)}r=o,t.updateQueue=r,r!==null&&(t.flags|=4)}else{a=o.nodeType===9?o:o.ownerDocument,e==="http://www.w3.org/1999/xhtml"&&(e=Fs(n)),e==="http://www.w3.org/1999/xhtml"?n==="script"?(e=a.createElement("div"),e.innerHTML="<script><\/script>",e=e.removeChild(e.firstChild)):typeof r.is=="string"?e=a.createElement(n,{is:r.is}):(e=a.createElement(n),n==="select"&&(a=e,r.multiple?a.multiple=!0:r.size&&(a.size=r.size))):e=a.createElementNS(e,n),e[je]=t,e[Qn]=r,cu(e,t,!1,!1),t.stateNode=e;e:{switch(a=ki(n,r),n){case"dialog":M("cancel",e),M("close",e),o=r;break;case"iframe":case"object":case"embed":M("load",e),o=r;break;case"video":case"audio":for(o=0;o<Tn.length;o++)M(Tn[o],e);o=r;break;case"source":M("error",e),o=r;break;case"img":case"image":case"link":M("error",e),M("load",e),o=r;break;case"details":M("toggle",e),o=r;break;case"input":Al(e,r),o=hi(e,r),M("invalid",e);break;case"option":o=r;break;case"select":e._wrapperState={wasMultiple:!!r.multiple},o=I({},r,{value:void 0}),M("invalid",e);break;case"textarea":zl(e,r),o=yi(e,r),M("invalid",e);break;default:o=r}bi(n,o),l=o;for(i in l)if(l.hasOwnProperty(i)){var s=l[i];i==="style"?Us(e,s):i==="dangerouslySetInnerHTML"?(s=s?s.__html:void 0,s!=null&&Hs(e,s)):i==="children"?typeof s=="string"?(n!=="textarea"||s!=="")&&On(e,s):typeof s=="number"&&On(e,""+s):i!=="suppressContentEditableWarning"&&i!=="suppressHydrationWarning"&&i!=="autoFocus"&&(In.hasOwnProperty(i)?s!=null&&i==="onScroll"&&M("scroll",e):s!=null&&ia(e,i,s,a))}switch(n){case"input":fr(e),Pl(e,r,!1);break;case"textarea":fr(e),Rl(e);break;case"option":r.value!=null&&e.setAttribute("value",""+dt(r.value));break;case"select":e.multiple=!!r.multiple,i=r.value,i!=null?Kt(e,!!r.multiple,i,!1):r.defaultValue!=null&&Kt(e,!!r.multiple,r.defaultValue,!0);break;default:typeof o.onClick=="function"&&(e.onclick=Kr)}switch(n){case"button":case"input":case"select":case"textarea":r=!!r.autoFocus;break e;case"img":r=!0;break e;default:r=!1}}r&&(t.flags|=4)}t.ref!==null&&(t.flags|=512,t.flags|=2097152)}return Z(t),null;case 6:if(e&&t.stateNode!=null)du(e,t,e.memoizedProps,r);else{if(typeof r!="string"&&t.stateNode===null)throw Error(h(166));if(n=bt(Kn.current),bt(De.current),Cr(t)){if(r=t.stateNode,n=t.memoizedProps,r[je]=t,(i=r.nodeValue!==n)&&(e=pe,e!==null))switch(e.tag){case 3:Er(r.nodeValue,n,(e.mode&1)!==0);break;case 5:e.memoizedProps.suppressHydrationWarning!==!0&&Er(r.nodeValue,n,(e.mode&1)!==0)}i&&(t.flags|=4)}else r=(n.nodeType===9?n:n.ownerDocument).createTextNode(r),r[je]=t,t.stateNode=r}return Z(t),null;case 13:if(N(L),r=t.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(j&&de!==null&&(t.mode&1)!==0&&(t.flags&128)===0)Pc(),rn(),t.flags|=98560,i=!1;else if(i=Cr(t),r!==null&&r.dehydrated!==null){if(e===null){if(!i)throw Error(h(318));if(i=t.memoizedState,i=i!==null?i.dehydrated:null,!i)throw Error(h(317));i[je]=t}else rn(),(t.flags&128)===0&&(t.memoizedState=null),t.flags|=4;Z(t),i=!1}else Te!==null&&(na(Te),Te=null),i=!0;if(!i)return t.flags&65536?t:null}return(t.flags&128)!==0?(t.lanes=n,t):(r=r!==null,r!==(e!==null&&e.memoizedState!==null)&&r&&(t.child.flags|=8192,(t.mode&1)!==0&&(e===null||(L.current&1)!==0?B===0&&(B=3):Wa())),t.updateQueue!==null&&(t.flags|=4),Z(t),null);case 4:return an(),Yi(e,t),e===null&&qn(t.stateNode.containerInfo),Z(t),null;case 10:return Sa(t.type._context),Z(t),null;case 17:return se(t.type)&&Xr(),Z(t),null;case 19:if(N(L),i=t.memoizedState,i===null)return Z(t),null;if(r=(t.flags&128)!==0,a=i.rendering,a===null)if(r)bn(i,!1);else{if(B!==0||e!==null&&(e.flags&128)!==0)for(e=t.child;e!==null;){if(a=ro(e),a!==null){for(t.flags|=128,bn(i,!1),r=a.updateQueue,r!==null&&(t.updateQueue=r,t.flags|=4),t.subtreeFlags=0,r=n,n=t.child;n!==null;)i=n,e=r,i.flags&=14680066,a=i.alternate,a===null?(i.childLanes=0,i.lanes=e,i.child=null,i.subtreeFlags=0,i.memoizedProps=null,i.memoizedState=null,i.updateQueue=null,i.dependencies=null,i.stateNode=null):(i.childLanes=a.childLanes,i.lanes=a.lanes,i.child=a.child,i.subtreeFlags=0,i.deletions=null,i.memoizedProps=a.memoizedProps,i.memoizedState=a.memoizedState,i.updateQueue=a.updateQueue,i.type=a.type,e=a.dependencies,i.dependencies=e===null?null:{lanes:e.lanes,firstContext:e.firstContext}),n=n.sibling;return R(L,L.current&1|2),t.child}e=e.sibling}i.tail!==null&&H()>sn&&(t.flags|=128,r=!0,bn(i,!1),t.lanes=4194304)}else{if(!r)if(e=ro(a),e!==null){if(t.flags|=128,r=!0,n=e.updateQueue,n!==null&&(t.updateQueue=n,t.flags|=4),bn(i,!0),i.tail===null&&i.tailMode==="hidden"&&!a.alternate&&!j)return Z(t),null}else 2*H()-i.renderingStartTime>sn&&n!==1073741824&&(t.flags|=128,r=!0,bn(i,!1),t.lanes=4194304);i.isBackwards?(a.sibling=t.child,t.child=a):(n=i.last,n!==null?n.sibling=a:t.child=a,i.last=a)}return i.tail!==null?(t=i.tail,i.rendering=t,i.tail=t.sibling,i.renderingStartTime=H(),t.sibling=null,n=L.current,R(L,r?n&1|2:n&1),t):(Z(t),null);case 22:case 23:return Ha(),r=t.memoizedState!==null,e!==null&&e.memoizedState!==null!==r&&(t.flags|=8192),r&&(t.mode&1)!==0?(ue&1073741824)!==0&&(Z(t),t.subtreeFlags&6&&(t.flags|=8192)):Z(t),null;case 24:return null;case 25:return null}throw Error(h(156,t.tag))}function Zp(e,t){switch(wa(t),t.tag){case 1:return se(t.type)&&Xr(),e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 3:return an(),N(le),N(ee),Pa(),e=t.flags,(e&65536)!==0&&(e&128)===0?(t.flags=e&-65537|128,t):null;case 5:return Aa(t),null;case 13:if(N(L),e=t.memoizedState,e!==null&&e.dehydrated!==null){if(t.alternate===null)throw Error(h(340));rn()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 19:return N(L),null;case 4:return an(),null;case 10:return Sa(t.type._context),null;case 22:case 23:return Ha(),null;case 24:return null;default:return null}}var Pr=!1,$=!1,$p=typeof WeakSet=="function"?WeakSet:Set,y=null;function Qt(e,t){var n=e.ref;if(n!==null)if(typeof n=="function")try{n(null)}catch(r){O(e,t,r)}else n.current=null}function Ki(e,t,n){try{n()}catch(r){O(e,t,r)}}var bs=!1;function ef(e,t){if(Mi=Gr,e=hc(),va(e)){if("selectionStart"in e)var n={start:e.selectionStart,end:e.selectionEnd};else e:{n=(n=e.ownerDocument)&&n.defaultView||window;var r=n.getSelection&&n.getSelection();if(r&&r.rangeCount!==0){n=r.anchorNode;var o=r.anchorOffset,i=r.focusNode;r=r.focusOffset;try{n.nodeType,i.nodeType}catch{n=null;break e}var a=0,l=-1,s=-1,u=0,g=0,m=e,f=null;t:for(;;){for(var v;m!==n||o!==0&&m.nodeType!==3||(l=a+o),m!==i||r!==0&&m.nodeType!==3||(s=a+r),m.nodeType===3&&(a+=m.nodeValue.length),(v=m.firstChild)!==null;)f=m,m=v;for(;;){if(m===e)break t;if(f===n&&++u===o&&(l=a),f===i&&++g===r&&(s=a),(v=m.nextSibling)!==null)break;m=f,f=m.parentNode}m=v}n=l===-1||s===-1?null:{start:l,end:s}}else n=null}n=n||{start:0,end:0}}else n=null;for(Ni={focusedElem:e,selectionRange:n},Gr=!1,y=t;y!==null;)if(t=y,e=t.child,(t.subtreeFlags&1028)!==0&&e!==null)e.return=t,y=e;else for(;y!==null;){t=y;try{var w=t.alternate;if((t.flags&1024)!==0)switch(t.tag){case 0:case 11:case 15:break;case 1:if(w!==null){var b=w.memoizedProps,F=w.memoizedState,d=t.stateNode,c=d.getSnapshotBeforeUpdate(t.elementType===t.type?b:Ee(t.type,b),F);d.__reactInternalSnapshotBeforeUpdate=c}break;case 3:var p=t.stateNode.containerInfo;p.nodeType===1?p.textContent="":p.nodeType===9&&p.documentElement&&p.removeChild(p.documentElement);break;case 5:case 6:case 4:case 17:break;default:throw Error(h(163))}}catch(x){O(t,t.return,x)}if(e=t.sibling,e!==null){e.return=t.return,y=e;break}y=t.return}return w=bs,bs=!1,w}function jn(e,t,n){var r=t.updateQueue;if(r=r!==null?r.lastEffect:null,r!==null){var o=r=r.next;do{if((o.tag&e)===e){var i=o.destroy;o.destroy=void 0,i!==void 0&&Ki(t,n,i)}o=o.next}while(o!==r)}}function wo(e,t){if(t=t.updateQueue,t=t!==null?t.lastEffect:null,t!==null){var n=t=t.next;do{if((n.tag&e)===e){var r=n.create;n.destroy=r()}n=n.next}while(n!==t)}}function Xi(e){var t=e.ref;if(t!==null){var n=e.stateNode;e.tag,e=n,typeof t=="function"?t(e):t.current=e}}function pu(e){var t=e.alternate;t!==null&&(e.alternate=null,pu(t)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(t=e.stateNode,t!==null&&(delete t[je],delete t[Qn],delete t[Di],delete t[Dp],delete t[Ip])),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}function fu(e){return e.tag===5||e.tag===3||e.tag===4}function ks(e){e:for(;;){for(;e.sibling===null;){if(e.return===null||fu(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.flags&2||e.child===null||e.tag===4)continue e;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function Ji(e,t,n){var r=e.tag;if(r===5||r===6)e=e.stateNode,t?n.nodeType===8?n.parentNode.insertBefore(e,t):n.insertBefore(e,t):(n.nodeType===8?(t=n.parentNode,t.insertBefore(e,n)):(t=n,t.appendChild(e)),n=n._reactRootContainer,n!=null||t.onclick!==null||(t.onclick=Kr));else if(r!==4&&(e=e.child,e!==null))for(Ji(e,t,n),e=e.sibling;e!==null;)Ji(e,t,n),e=e.sibling}function Zi(e,t,n){var r=e.tag;if(r===5||r===6)e=e.stateNode,t?n.insertBefore(e,t):n.appendChild(e);else if(r!==4&&(e=e.child,e!==null))for(Zi(e,t,n),e=e.sibling;e!==null;)Zi(e,t,n),e=e.sibling}var Q=null,Ce=!1;function Xe(e,t,n){for(n=n.child;n!==null;)gu(e,t,n),n=n.sibling}function gu(e,t,n){if(Le&&typeof Le.onCommitFiberUnmount=="function")try{Le.onCommitFiberUnmount(po,n)}catch{}switch(n.tag){case 5:$||Qt(n,t);case 6:var r=Q,o=Ce;Q=null,Xe(e,t,n),Q=r,Ce=o,Q!==null&&(Ce?(e=Q,n=n.stateNode,e.nodeType===8?e.parentNode.removeChild(n):e.removeChild(n)):Q.removeChild(n.stateNode));break;case 18:Q!==null&&(Ce?(e=Q,n=n.stateNode,e.nodeType===8?ti(e.parentNode,n):e.nodeType===1&&ti(e,n),Un(e)):ti(Q,n.stateNode));break;case 4:r=Q,o=Ce,Q=n.stateNode.containerInfo,Ce=!0,Xe(e,t,n),Q=r,Ce=o;break;case 0:case 11:case 14:case 15:if(!$&&(r=n.updateQueue,r!==null&&(r=r.lastEffect,r!==null))){o=r=r.next;do{var i=o,a=i.destroy;i=i.tag,a!==void 0&&((i&2)!==0||(i&4)!==0)&&Ki(n,t,a),o=o.next}while(o!==r)}Xe(e,t,n);break;case 1:if(!$&&(Qt(n,t),r=n.stateNode,typeof r.componentWillUnmount=="function"))try{r.props=n.memoizedProps,r.state=n.memoizedState,r.componentWillUnmount()}catch(l){O(n,t,l)}Xe(e,t,n);break;case 21:Xe(e,t,n);break;case 22:n.mode&1?($=(r=$)||n.memoizedState!==null,Xe(e,t,n),$=r):Xe(e,t,n);break;default:Xe(e,t,n)}}function _s(e){var t=e.updateQueue;if(t!==null){e.updateQueue=null;var n=e.stateNode;n===null&&(n=e.stateNode=new $p),t.forEach(function(r){var o=uf.bind(null,e,r);n.has(r)||(n.add(r),r.then(o,o))})}}function Se(e,t){var n=t.deletions;if(n!==null)for(var r=0;r<n.length;r++){var o=n[r];try{var i=e,a=t,l=a;e:for(;l!==null;){switch(l.tag){case 5:Q=l.stateNode,Ce=!1;break e;case 3:Q=l.stateNode.containerInfo,Ce=!0;break e;case 4:Q=l.stateNode.containerInfo,Ce=!0;break e}l=l.return}if(Q===null)throw Error(h(160));gu(i,a,o),Q=null,Ce=!1;var s=o.alternate;s!==null&&(s.return=null),o.return=null}catch(u){O(o,t,u)}}if(t.subtreeFlags&12854)for(t=t.child;t!==null;)mu(t,e),t=t.sibling}function mu(e,t){var n=e.alternate,r=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:if(Se(t,e),Me(e),r&4){try{jn(3,e,e.return),wo(3,e)}catch(b){O(e,e.return,b)}try{jn(5,e,e.return)}catch(b){O(e,e.return,b)}}break;case 1:Se(t,e),Me(e),r&512&&n!==null&&Qt(n,n.return);break;case 5:if(Se(t,e),Me(e),r&512&&n!==null&&Qt(n,n.return),e.flags&32){var o=e.stateNode;try{On(o,"")}catch(b){O(e,e.return,b)}}if(r&4&&(o=e.stateNode,o!=null)){var i=e.memoizedProps,a=n!==null?n.memoizedProps:i,l=e.type,s=e.updateQueue;if(e.updateQueue=null,s!==null)try{l==="input"&&i.type==="radio"&&i.name!=null&&Is(o,i),ki(l,a);var u=ki(l,i);for(a=0;a<s.length;a+=2){var g=s[a],m=s[a+1];g==="style"?Us(o,m):g==="dangerouslySetInnerHTML"?Hs(o,m):g==="children"?On(o,m):ia(o,g,m,u)}switch(l){case"input":xi(o,i);break;case"textarea":Os(o,i);break;case"select":var f=o._wrapperState.wasMultiple;o._wrapperState.wasMultiple=!!i.multiple;var v=i.value;v!=null?Kt(o,!!i.multiple,v,!1):f!==!!i.multiple&&(i.defaultValue!=null?Kt(o,!!i.multiple,i.defaultValue,!0):Kt(o,!!i.multiple,i.multiple?[]:"",!1))}o[Qn]=i}catch(b){O(e,e.return,b)}}break;case 6:if(Se(t,e),Me(e),r&4){if(e.stateNode===null)throw Error(h(162));o=e.stateNode,i=e.memoizedProps;try{o.nodeValue=i}catch(b){O(e,e.return,b)}}break;case 3:if(Se(t,e),Me(e),r&4&&n!==null&&n.memoizedState.isDehydrated)try{Un(t.containerInfo)}catch(b){O(e,e.return,b)}break;case 4:Se(t,e),Me(e);break;case 13:Se(t,e),Me(e),o=e.child,o.flags&8192&&(i=o.memoizedState!==null,o.stateNode.isHidden=i,!i||o.alternate!==null&&o.alternate.memoizedState!==null||(Oa=H())),r&4&&_s(e);break;case 22:if(g=n!==null&&n.memoizedState!==null,e.mode&1?($=(u=$)||g,Se(t,e),$=u):Se(t,e),Me(e),r&8192){if(u=e.memoizedState!==null,(e.stateNode.isHidden=u)&&!g&&(e.mode&1)!==0)for(y=e,g=e.child;g!==null;){for(m=y=g;y!==null;){switch(f=y,v=f.child,f.tag){case 0:case 11:case 14:case 15:jn(4,f,f.return);break;case 1:Qt(f,f.return);var w=f.stateNode;if(typeof w.componentWillUnmount=="function"){r=f,n=f.return;try{t=r,w.props=t.memoizedProps,w.state=t.memoizedState,w.componentWillUnmount()}catch(b){O(r,n,b)}}break;case 5:Qt(f,f.return);break;case 22:if(f.memoizedState!==null){Es(m);continue}}v!==null?(v.return=f,y=v):Es(m)}g=g.sibling}e:for(g=null,m=e;;){if(m.tag===5){if(g===null){g=m;try{o=m.stateNode,u?(i=o.style,typeof i.setProperty=="function"?i.setProperty("display","none","important"):i.display="none"):(l=m.stateNode,s=m.memoizedProps.style,a=s!=null&&s.hasOwnProperty("display")?s.display:null,l.style.display=Ws("display",a))}catch(b){O(e,e.return,b)}}}else if(m.tag===6){if(g===null)try{m.stateNode.nodeValue=u?"":m.memoizedProps}catch(b){O(e,e.return,b)}}else if((m.tag!==22&&m.tag!==23||m.memoizedState===null||m===e)&&m.child!==null){m.child.return=m,m=m.child;continue}if(m===e)break e;for(;m.sibling===null;){if(m.return===null||m.return===e)break e;g===m&&(g=null),m=m.return}g===m&&(g=null),m.sibling.return=m.return,m=m.sibling}}break;case 19:Se(t,e),Me(e),r&4&&_s(e);break;case 21:break;default:Se(t,e),Me(e)}}function Me(e){var t=e.flags;if(t&2){try{e:{for(var n=e.return;n!==null;){if(fu(n)){var r=n;break e}n=n.return}throw Error(h(160))}switch(r.tag){case 5:var o=r.stateNode;r.flags&32&&(On(o,""),r.flags&=-33);var i=ks(e);Zi(e,i,o);break;case 3:case 4:var a=r.stateNode.containerInfo,l=ks(e);Ji(e,l,a);break;default:throw Error(h(161))}}catch(s){O(e,e.return,s)}e.flags&=-3}t&4096&&(e.flags&=-4097)}function tf(e,t,n){y=e,hu(e,t,n)}function hu(e,t,n){for(var r=(e.mode&1)!==0;y!==null;){var o=y,i=o.child;if(o.tag===22&&r){var a=o.memoizedState!==null||Pr;if(!a){var l=o.alternate,s=l!==null&&l.memoizedState!==null||$;l=Pr;var u=$;if(Pr=a,($=s)&&!u)for(y=o;y!==null;)a=y,s=a.child,a.tag===22&&a.memoizedState!==null?Cs(o):s!==null?(s.return=a,y=s):Cs(o);for(;i!==null;)y=i,hu(i,t,n),i=i.sibling;y=o,Pr=l,$=u}Ss(e,t,n)}else(o.subtreeFlags&8772)!==0&&i!==null?(i.return=o,y=i):Ss(e,t,n)}}function Ss(e){for(;y!==null;){var t=y;if((t.flags&8772)!==0){var n=t.alternate;try{if((t.flags&8772)!==0)switch(t.tag){case 0:case 11:case 15:$||wo(5,t);break;case 1:var r=t.stateNode;if(t.flags&4&&!$)if(n===null)r.componentDidMount();else{var o=t.elementType===t.type?n.memoizedProps:Ee(t.type,n.memoizedProps);r.componentDidUpdate(o,n.memoizedState,r.__reactInternalSnapshotBeforeUpdate)}var i=t.updateQueue;i!==null&&ss(t,i,r);break;case 3:var a=t.updateQueue;if(a!==null){if(n=null,t.child!==null)switch(t.child.tag){case 5:n=t.child.stateNode;break;case 1:n=t.child.stateNode}ss(t,a,n)}break;case 5:var l=t.stateNode;if(n===null&&t.flags&4){n=l;var s=t.memoizedProps;switch(t.type){case"button":case"input":case"select":case"textarea":s.autoFocus&&n.focus();break;case"img":s.src&&(n.src=s.src)}}break;case 6:break;case 4:break;case 12:break;case 13:if(t.memoizedState===null){var u=t.alternate;if(u!==null){var g=u.memoizedState;if(g!==null){var m=g.dehydrated;m!==null&&Un(m)}}}break;case 19:case 17:case 21:case 22:case 23:case 25:break;default:throw Error(h(163))}$||t.flags&512&&Xi(t)}catch(f){O(t,t.return,f)}}if(t===e){y=null;break}if(n=t.sibling,n!==null){n.return=t.return,y=n;break}y=t.return}}function Es(e){for(;y!==null;){var t=y;if(t===e){y=null;break}var n=t.sibling;if(n!==null){n.return=t.return,y=n;break}y=t.return}}function Cs(e){for(;y!==null;){var t=y;try{switch(t.tag){case 0:case 11:case 15:var n=t.return;try{wo(4,t)}catch(s){O(t,n,s)}break;case 1:var r=t.stateNode;if(typeof r.componentDidMount=="function"){var o=t.return;try{r.componentDidMount()}catch(s){O(t,o,s)}}var i=t.return;try{Xi(t)}catch(s){O(t,i,s)}break;case 5:var a=t.return;try{Xi(t)}catch(s){O(t,a,s)}}}catch(s){O(t,t.return,s)}if(t===e){y=null;break}var l=t.sibling;if(l!==null){l.return=t.return,y=l;break}y=t.return}}var nf=Math.ceil,ao=Qe.ReactCurrentDispatcher,Da=Qe.ReactCurrentOwner,we=Qe.ReactCurrentBatchConfig,T=0,G=null,W=null,Y=0,ue=0,Yt=gt(0),B=0,$n=null,Tt=0,bo=0,Ia=0,Ln=null,ie=null,Oa=0,sn=1/0,Oe=null,lo=!1,$i=null,st=null,zr=!1,nt=null,so=0,Dn=0,ea=null,Or=-1,Fr=0;function re(){return(T&6)!==0?H():Or!==-1?Or:Or=H()}function ct(e){return(e.mode&1)===0?1:(T&2)!==0&&Y!==0?Y&-Y:Fp.transition!==null?(Fr===0&&(Fr=ec()),Fr):(e=P,e!==0||(e=window.event,e=e===void 0?16:lc(e.type)),e)}function Pe(e,t,n,r){if(50<Dn)throw Dn=0,ea=null,Error(h(185));er(e,n,r),((T&2)===0||e!==G)&&(e===G&&((T&2)===0&&(bo|=n),B===4&&et(e,Y)),ce(e,r),n===1&&T===0&&(t.mode&1)===0&&(sn=H()+500,xo&&mt()))}function ce(e,t){var n=e.callbackNode;Wd(e,t);var r=qr(e,e===G?Y:0);if(r===0)n!==null&&jl(n),e.callbackNode=null,e.callbackPriority=0;else if(t=r&-r,e.callbackPriority!==t){if(n!=null&&jl(n),t===1)e.tag===0?Op(Ts.bind(null,e)):Cc(Ts.bind(null,e)),jp(function(){(T&6)===0&&mt()}),n=null;else{switch(tc(r)){case 1:n=ua;break;case 4:n=Zs;break;case 16:n=Vr;break;case 536870912:n=$s;break;default:n=Vr}n=Su(n,xu.bind(null,e))}e.callbackPriority=t,e.callbackNode=n}}function xu(e,t){if(Or=-1,Fr=0,(T&6)!==0)throw Error(h(327));var n=e.callbackNode;if(en()&&e.callbackNode!==n)return null;var r=qr(e,e===G?Y:0);if(r===0)return null;if((r&30)!==0||(r&e.expiredLanes)!==0||t)t=co(e,r);else{t=r;var o=T;T|=2;var i=yu();(G!==e||Y!==t)&&(Oe=null,sn=H()+500,kt(e,t));do try{af();break}catch(l){vu(e,l)}while(!0);_a(),ao.current=i,T=o,W!==null?t=0:(G=null,Y=0,t=B)}if(t!==0){if(t===2&&(o=Ti(e),o!==0&&(r=o,t=ta(e,o))),t===1)throw n=$n,kt(e,0),et(e,r),ce(e,H()),n;if(t===6)et(e,r);else{if(o=e.current.alternate,(r&30)===0&&!rf(o)&&(t=co(e,r),t===2&&(i=Ti(e),i!==0&&(r=i,t=ta(e,i))),t===1))throw n=$n,kt(e,0),et(e,r),ce(e,H()),n;switch(e.finishedWork=o,e.finishedLanes=r,t){case 0:case 1:throw Error(h(345));case 2:vt(e,ie,Oe);break;case 3:if(et(e,r),(r&130023424)===r&&(t=Oa+500-H(),10<t)){if(qr(e,0)!==0)break;if(o=e.suspendedLanes,(o&r)!==r){re(),e.pingedLanes|=e.suspendedLanes&o;break}e.timeoutHandle=Li(vt.bind(null,e,ie,Oe),t);break}vt(e,ie,Oe);break;case 4:if(et(e,r),(r&4194240)===r)break;for(t=e.eventTimes,o=-1;0<r;){var a=31-Ae(r);i=1<<a,a=t[a],a>o&&(o=a),r&=~i}if(r=o,r=H()-r,r=(120>r?120:480>r?480:1080>r?1080:1920>r?1920:3e3>r?3e3:4320>r?4320:1960*nf(r/1960))-r,10<r){e.timeoutHandle=Li(vt.bind(null,e,ie,Oe),r);break}vt(e,ie,Oe);break;case 5:vt(e,ie,Oe);break;default:throw Error(h(329))}}}return ce(e,H()),e.callbackNode===n?xu.bind(null,e):null}function ta(e,t){var n=Ln;return e.current.memoizedState.isDehydrated&&(kt(e,t).flags|=256),e=co(e,t),e!==2&&(t=ie,ie=n,t!==null&&na(t)),e}function na(e){ie===null?ie=e:ie.push.apply(ie,e)}function rf(e){for(var t=e;;){if(t.flags&16384){var n=t.updateQueue;if(n!==null&&(n=n.stores,n!==null))for(var r=0;r<n.length;r++){var o=n[r],i=o.getSnapshot;o=o.value;try{if(!ze(i(),o))return!1}catch{return!1}}}if(n=t.child,t.subtreeFlags&16384&&n!==null)n.return=t,t=n;else{if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return!0;t=t.return}t.sibling.return=t.return,t=t.sibling}}return!0}function et(e,t){for(t&=~Ia,t&=~bo,e.suspendedLanes|=t,e.pingedLanes&=~t,e=e.expirationTimes;0<t;){var n=31-Ae(t),r=1<<n;e[n]=-1,t&=~r}}function Ts(e){if((T&6)!==0)throw Error(h(327));en();var t=qr(e,0);if((t&1)===0)return ce(e,H()),null;var n=co(e,t);if(e.tag!==0&&n===2){var r=Ti(e);r!==0&&(t=r,n=ta(e,r))}if(n===1)throw n=$n,kt(e,0),et(e,t),ce(e,H()),n;if(n===6)throw Error(h(345));return e.finishedWork=e.current.alternate,e.finishedLanes=t,vt(e,ie,Oe),ce(e,H()),null}function Fa(e,t){var n=T;T|=1;try{return e(t)}finally{T=n,T===0&&(sn=H()+500,xo&&mt())}}function At(e){nt!==null&&nt.tag===0&&(T&6)===0&&en();var t=T;T|=1;var n=we.transition,r=P;try{if(we.transition=null,P=1,e)return e()}finally{P=r,we.transition=n,T=t,(T&6)===0&&mt()}}function Ha(){ue=Yt.current,N(Yt)}function kt(e,t){e.finishedWork=null,e.finishedLanes=0;var n=e.timeoutHandle;if(n!==-1&&(e.timeoutHandle=-1,Np(n)),W!==null)for(n=W.return;n!==null;){var r=n;switch(wa(r),r.tag){case 1:r=r.type.childContextTypes,r!=null&&Xr();break;case 3:an(),N(le),N(ee),Pa();break;case 5:Aa(r);break;case 4:an();break;case 13:N(L);break;case 19:N(L);break;case 10:Sa(r.type._context);break;case 22:case 23:Ha()}n=n.return}if(G=e,W=e=ut(e.current,null),Y=ue=t,B=0,$n=null,Ia=bo=Tt=0,ie=Ln=null,wt!==null){for(t=0;t<wt.length;t++)if(n=wt[t],r=n.interleaved,r!==null){n.interleaved=null;var o=r.next,i=n.pending;if(i!==null){var a=i.next;i.next=o,r.next=a}n.pending=r}wt=null}return e}function vu(e,t){do{var n=W;try{if(_a(),Lr.current=io,oo){for(var r=D.memoizedState;r!==null;){var o=r.queue;o!==null&&(o.pending=null),r=r.next}oo=!1}if(Ct=0,q=U=D=null,Nn=!1,Xn=0,Da.current=null,n===null||n.return===null){B=1,$n=t,W=null;break}e:{var i=e,a=n.return,l=n,s=t;if(t=Y,l.flags|=32768,s!==null&&typeof s=="object"&&typeof s.then=="function"){var u=s,g=l,m=g.tag;if((g.mode&1)===0&&(m===0||m===11||m===15)){var f=g.alternate;f?(g.updateQueue=f.updateQueue,g.memoizedState=f.memoizedState,g.lanes=f.lanes):(g.updateQueue=null,g.memoizedState=null)}var v=gs(a);if(v!==null){v.flags&=-257,ms(v,a,l,i,t),v.mode&1&&fs(i,u,t),t=v,s=u;var w=t.updateQueue;if(w===null){var b=new Set;b.add(s),t.updateQueue=b}else w.add(s);break e}else{if((t&1)===0){fs(i,u,t),Wa();break e}s=Error(h(426))}}else if(j&&l.mode&1){var F=gs(a);if(F!==null){(F.flags&65536)===0&&(F.flags|=256),ms(F,a,l,i,t),ba(ln(s,l));break e}}i=s=ln(s,l),B!==4&&(B=2),Ln===null?Ln=[i]:Ln.push(i),i=a;do{switch(i.tag){case 3:i.flags|=65536,t&=-t,i.lanes|=t;var d=tu(i,s,t);ls(i,d);break e;case 1:l=s;var c=i.type,p=i.stateNode;if((i.flags&128)===0&&(typeof c.getDerivedStateFromError=="function"||p!==null&&typeof p.componentDidCatch=="function"&&(st===null||!st.has(p)))){i.flags|=65536,t&=-t,i.lanes|=t;var x=nu(i,l,t);ls(i,x);break e}}i=i.return}while(i!==null)}bu(n)}catch(k){t=k,W===n&&n!==null&&(W=n=n.return);continue}break}while(!0)}function yu(){var e=ao.current;return ao.current=io,e===null?io:e}function Wa(){(B===0||B===3||B===2)&&(B=4),G===null||(Tt&268435455)===0&&(bo&268435455)===0||et(G,Y)}function co(e,t){var n=T;T|=2;var r=yu();(G!==e||Y!==t)&&(Oe=null,kt(e,t));do try{of();break}catch(o){vu(e,o)}while(!0);if(_a(),T=n,ao.current=r,W!==null)throw Error(h(261));return G=null,Y=0,B}function of(){for(;W!==null;)wu(W)}function af(){for(;W!==null&&!Md();)wu(W)}function wu(e){var t=_u(e.alternate,e,ue);e.memoizedProps=e.pendingProps,t===null?bu(e):W=t,Da.current=null}function bu(e){var t=e;do{var n=t.alternate;if(e=t.return,(t.flags&32768)===0){if(n=Jp(n,t,ue),n!==null){W=n;return}}else{if(n=Zp(n,t),n!==null){n.flags&=32767,W=n;return}if(e!==null)e.flags|=32768,e.subtreeFlags=0,e.deletions=null;else{B=6,W=null;return}}if(t=t.sibling,t!==null){W=t;return}W=t=e}while(t!==null);B===0&&(B=5)}function vt(e,t,n){var r=P,o=we.transition;try{we.transition=null,P=1,lf(e,t,n,r)}finally{we.transition=o,P=r}return null}function lf(e,t,n,r){do en();while(nt!==null);if((T&6)!==0)throw Error(h(327));n=e.finishedWork;var o=e.finishedLanes;if(n===null)return null;if(e.finishedWork=null,e.finishedLanes=0,n===e.current)throw Error(h(177));e.callbackNode=null,e.callbackPriority=0;var i=n.lanes|n.childLanes;if(Ud(e,i),e===G&&(W=G=null,Y=0),(n.subtreeFlags&2064)===0&&(n.flags&2064)===0||zr||(zr=!0,Su(Vr,function(){return en(),null})),i=(n.flags&15990)!==0,(n.subtreeFlags&15990)!==0||i){i=we.transition,we.transition=null;var a=P;P=1;var l=T;T|=4,Da.current=null,ef(e,n),mu(n,e),Ap(Ni),Gr=!!Mi,Ni=Mi=null,e.current=n,tf(n,e,o),Nd(),T=l,P=a,we.transition=i}else e.current=n;if(zr&&(zr=!1,nt=e,so=o),i=e.pendingLanes,i===0&&(st=null),Dd(n.stateNode,r),ce(e,H()),t!==null)for(r=e.onRecoverableError,n=0;n<t.length;n++)o=t[n],r(o.value,{componentStack:o.stack,digest:o.digest});if(lo)throw lo=!1,e=$i,$i=null,e;return(so&1)!==0&&e.tag!==0&&en(),i=e.pendingLanes,(i&1)!==0?e===ea?Dn++:(Dn=0,ea=e):Dn=0,mt(),null}function en(){if(nt!==null){var e=tc(so),t=we.transition,n=P;try{if(we.transition=null,P=16>e?16:e,nt===null)var r=!1;else{if(e=nt,nt=null,so=0,(T&6)!==0)throw Error(h(331));var o=T;for(T|=4,y=e.current;y!==null;){var i=y,a=i.child;if((y.flags&16)!==0){var l=i.deletions;if(l!==null){for(var s=0;s<l.length;s++){var u=l[s];for(y=u;y!==null;){var g=y;switch(g.tag){case 0:case 11:case 15:jn(8,g,i)}var m=g.child;if(m!==null)m.return=g,y=m;else for(;y!==null;){g=y;var f=g.sibling,v=g.return;if(pu(g),g===u){y=null;break}if(f!==null){f.return=v,y=f;break}y=v}}}var w=i.alternate;if(w!==null){var b=w.child;if(b!==null){w.child=null;do{var F=b.sibling;b.sibling=null,b=F}while(b!==null)}}y=i}}if((i.subtreeFlags&2064)!==0&&a!==null)a.return=i,y=a;else e:for(;y!==null;){if(i=y,(i.flags&2048)!==0)switch(i.tag){case 0:case 11:case 15:jn(9,i,i.return)}var d=i.sibling;if(d!==null){d.return=i.return,y=d;break e}y=i.return}}var c=e.current;for(y=c;y!==null;){a=y;var p=a.child;if((a.subtreeFlags&2064)!==0&&p!==null)p.return=a,y=p;else e:for(a=c;y!==null;){if(l=y,(l.flags&2048)!==0)try{switch(l.tag){case 0:case 11:case 15:wo(9,l)}}catch(k){O(l,l.return,k)}if(l===a){y=null;break e}var x=l.sibling;if(x!==null){x.return=l.return,y=x;break e}y=l.return}}if(T=o,mt(),Le&&typeof Le.onPostCommitFiberRoot=="function")try{Le.onPostCommitFiberRoot(po,e)}catch{}r=!0}return r}finally{P=n,we.transition=t}}return!1}function As(e,t,n){t=ln(n,t),t=tu(e,t,1),e=lt(e,t,1),t=re(),e!==null&&(er(e,1,t),ce(e,t))}function O(e,t,n){if(e.tag===3)As(e,e,n);else for(;t!==null;){if(t.tag===3){As(t,e,n);break}else if(t.tag===1){var r=t.stateNode;if(typeof t.type.getDerivedStateFromError=="function"||typeof r.componentDidCatch=="function"&&(st===null||!st.has(r))){e=ln(n,e),e=nu(t,e,1),t=lt(t,e,1),e=re(),t!==null&&(er(t,1,e),ce(t,e));break}}t=t.return}}function sf(e,t,n){var r=e.pingCache;r!==null&&r.delete(t),t=re(),e.pingedLanes|=e.suspendedLanes&n,G===e&&(Y&n)===n&&(B===4||B===3&&(Y&130023424)===Y&&500>H()-Oa?kt(e,0):Ia|=n),ce(e,t)}function ku(e,t){t===0&&((e.mode&1)===0?t=1:(t=hr,hr<<=1,(hr&130023424)===0&&(hr=4194304)));var n=re();e=qe(e,t),e!==null&&(er(e,t,n),ce(e,n))}function cf(e){var t=e.memoizedState,n=0;t!==null&&(n=t.retryLane),ku(e,n)}function uf(e,t){var n=0;switch(e.tag){case 13:var r=e.stateNode,o=e.memoizedState;o!==null&&(n=o.retryLane);break;case 19:r=e.stateNode;break;default:throw Error(h(314))}r!==null&&r.delete(t),ku(e,n)}var _u;_u=function(e,t,n){if(e!==null)if(e.memoizedProps!==t.pendingProps||le.current)ae=!0;else{if((e.lanes&n)===0&&(t.flags&128)===0)return ae=!1,Xp(e,t,n);ae=(e.flags&131072)!==0}else ae=!1,j&&(t.flags&1048576)!==0&&Tc(t,$r,t.index);switch(t.lanes=0,t.tag){case 2:var r=t.type;Ir(e,t),e=t.pendingProps;var o=nn(t,ee.current);$t(t,n),o=Ra(null,t,r,e,o,n);var i=Ma();return t.flags|=1,typeof o=="object"&&o!==null&&typeof o.render=="function"&&o.$$typeof===void 0?(t.tag=1,t.memoizedState=null,t.updateQueue=null,se(r)?(i=!0,Jr(t)):i=!1,t.memoizedState=o.state!==null&&o.state!==void 0?o.state:null,Ca(t),o.updater=yo,t.stateNode=o,o._reactInternals=t,Ui(t,r,e,n),t=qi(null,t,r,!0,i,n)):(t.tag=0,j&&i&&ya(t),ne(null,t,o,n),t=t.child),t;case 16:r=t.elementType;e:{switch(Ir(e,t),e=t.pendingProps,o=r._init,r=o(r._payload),t.type=r,o=t.tag=pf(r),e=Ee(r,e),o){case 0:t=Vi(null,t,r,e,n);break e;case 1:t=vs(null,t,r,e,n);break e;case 11:t=hs(null,t,r,e,n);break e;case 14:t=xs(null,t,r,Ee(r.type,e),n);break e}throw Error(h(306,r,""))}return t;case 0:return r=t.type,o=t.pendingProps,o=t.elementType===r?o:Ee(r,o),Vi(e,t,r,o,n);case 1:return r=t.type,o=t.pendingProps,o=t.elementType===r?o:Ee(r,o),vs(e,t,r,o,n);case 3:e:{if(au(t),e===null)throw Error(h(387));r=t.pendingProps,i=t.memoizedState,o=i.element,Nc(e,t),no(t,r,null,n);var a=t.memoizedState;if(r=a.element,i.isDehydrated)if(i={element:r,isDehydrated:!1,cache:a.cache,pendingSuspenseBoundaries:a.pendingSuspenseBoundaries,transitions:a.transitions},t.updateQueue.baseState=i,t.memoizedState=i,t.flags&256){o=ln(Error(h(423)),t),t=ys(e,t,r,n,o);break e}else if(r!==o){o=ln(Error(h(424)),t),t=ys(e,t,r,n,o);break e}else for(de=at(t.stateNode.containerInfo.firstChild),pe=t,j=!0,Te=null,n=Rc(t,null,r,n),t.child=n;n;)n.flags=n.flags&-3|4096,n=n.sibling;else{if(rn(),r===o){t=Ge(e,t,n);break e}ne(e,t,r,n)}t=t.child}return t;case 5:return jc(t),e===null&&Fi(t),r=t.type,o=t.pendingProps,i=e!==null?e.memoizedProps:null,a=o.children,ji(r,o)?a=null:i!==null&&ji(r,i)&&(t.flags|=32),iu(e,t),ne(e,t,a,n),t.child;case 6:return e===null&&Fi(t),null;case 13:return lu(e,t,n);case 4:return Ta(t,t.stateNode.containerInfo),r=t.pendingProps,e===null?t.child=on(t,null,r,n):ne(e,t,r,n),t.child;case 11:return r=t.type,o=t.pendingProps,o=t.elementType===r?o:Ee(r,o),hs(e,t,r,o,n);case 7:return ne(e,t,t.pendingProps,n),t.child;case 8:return ne(e,t,t.pendingProps.children,n),t.child;case 12:return ne(e,t,t.pendingProps.children,n),t.child;case 10:e:{if(r=t.type._context,o=t.pendingProps,i=t.memoizedProps,a=o.value,R(eo,r._currentValue),r._currentValue=a,i!==null)if(ze(i.value,a)){if(i.children===o.children&&!le.current){t=Ge(e,t,n);break e}}else for(i=t.child,i!==null&&(i.return=t);i!==null;){var l=i.dependencies;if(l!==null){a=i.child;for(var s=l.firstContext;s!==null;){if(s.context===r){if(i.tag===1){s=Ue(-1,n&-n),s.tag=2;var u=i.updateQueue;if(u!==null){u=u.shared;var g=u.pending;g===null?s.next=s:(s.next=g.next,g.next=s),u.pending=s}}i.lanes|=n,s=i.alternate,s!==null&&(s.lanes|=n),Hi(i.return,n,t),l.lanes|=n;break}s=s.next}}else if(i.tag===10)a=i.type===t.type?null:i.child;else if(i.tag===18){if(a=i.return,a===null)throw Error(h(341));a.lanes|=n,l=a.alternate,l!==null&&(l.lanes|=n),Hi(a,n,t),a=i.sibling}else a=i.child;if(a!==null)a.return=i;else for(a=i;a!==null;){if(a===t){a=null;break}if(i=a.sibling,i!==null){i.return=a.return,a=i;break}a=a.return}i=a}ne(e,t,o.children,n),t=t.child}return t;case 9:return o=t.type,r=t.pendingProps.children,$t(t,n),o=be(o),r=r(o),t.flags|=1,ne(e,t,r,n),t.child;case 14:return r=t.type,o=Ee(r,t.pendingProps),o=Ee(r.type,o),xs(e,t,r,o,n);case 15:return ru(e,t,t.type,t.pendingProps,n);case 17:return r=t.type,o=t.pendingProps,o=t.elementType===r?o:Ee(r,o),Ir(e,t),t.tag=1,se(r)?(e=!0,Jr(t)):e=!1,$t(t,n),eu(t,r,o),Ui(t,r,o,n),qi(null,t,r,!0,e,n);case 19:return su(e,t,n);case 22:return ou(e,t,n)}throw Error(h(156,t.tag))};function Su(e,t){return Js(e,t)}function df(e,t,n,r){this.tag=e,this.key=n,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=r,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function ye(e,t,n,r){return new df(e,t,n,r)}function Ua(e){return e=e.prototype,!(!e||!e.isReactComponent)}function pf(e){if(typeof e=="function")return Ua(e)?1:0;if(e!=null){if(e=e.$$typeof,e===la)return 11;if(e===sa)return 14}return 2}function ut(e,t){var n=e.alternate;return n===null?(n=ye(e.tag,t,e.key,e.mode),n.elementType=e.elementType,n.type=e.type,n.stateNode=e.stateNode,n.alternate=e,e.alternate=n):(n.pendingProps=t,n.type=e.type,n.flags=0,n.subtreeFlags=0,n.deletions=null),n.flags=e.flags&14680064,n.childLanes=e.childLanes,n.lanes=e.lanes,n.child=e.child,n.memoizedProps=e.memoizedProps,n.memoizedState=e.memoizedState,n.updateQueue=e.updateQueue,t=e.dependencies,n.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext},n.sibling=e.sibling,n.index=e.index,n.ref=e.ref,n}function Hr(e,t,n,r,o,i){var a=2;if(r=e,typeof e=="function")Ua(e)&&(a=1);else if(typeof e=="string")a=5;else e:switch(e){case Ot:return _t(n.children,o,i,t);case aa:a=8,o|=8;break;case pi:return e=ye(12,n,t,o|2),e.elementType=pi,e.lanes=i,e;case fi:return e=ye(13,n,t,o),e.elementType=fi,e.lanes=i,e;case gi:return e=ye(19,n,t,o),e.elementType=gi,e.lanes=i,e;case js:return ko(n,o,i,t);default:if(typeof e=="object"&&e!==null)switch(e.$$typeof){case Ms:a=10;break e;case Ns:a=9;break e;case la:a=11;break e;case sa:a=14;break e;case Je:a=16,r=null;break e}throw Error(h(130,e==null?e:typeof e,""))}return t=ye(a,n,t,o),t.elementType=e,t.type=r,t.lanes=i,t}function _t(e,t,n,r){return e=ye(7,e,r,t),e.lanes=n,e}function ko(e,t,n,r){return e=ye(22,e,r,t),e.elementType=js,e.lanes=n,e.stateNode={isHidden:!1},e}function ci(e,t,n){return e=ye(6,e,null,t),e.lanes=n,e}function ui(e,t,n){return t=ye(4,e.children!==null?e.children:[],e.key,t),t.lanes=n,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}function ff(e,t,n,r,o){this.tag=t,this.containerInfo=e,this.finishedWork=this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.pendingContext=this.context=null,this.callbackPriority=0,this.eventTimes=Qo(0),this.expirationTimes=Qo(-1),this.entangledLanes=this.finishedLanes=this.mutableReadLanes=this.expiredLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=Qo(0),this.identifierPrefix=r,this.onRecoverableError=o,this.mutableSourceEagerHydrationData=null}function Ba(e,t,n,r,o,i,a,l,s){return e=new ff(e,t,n,l,s),t===1?(t=1,i===!0&&(t|=8)):t=0,i=ye(3,null,null,t),e.current=i,i.stateNode=e,i.memoizedState={element:r,isDehydrated:n,cache:null,transitions:null,pendingSuspenseBoundaries:null},Ca(i),e}function gf(e,t,n){var r=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:It,key:r==null?null:""+r,children:e,containerInfo:t,implementation:n}}function Eu(e){if(!e)return pt;e=e._reactInternals;e:{if(zt(e)!==e||e.tag!==1)throw Error(h(170));var t=e;do{switch(t.tag){case 3:t=t.stateNode.context;break e;case 1:if(se(t.type)){t=t.stateNode.__reactInternalMemoizedMergedChildContext;break e}}t=t.return}while(t!==null);throw Error(h(171))}if(e.tag===1){var n=e.type;if(se(n))return Ec(e,n,t)}return t}function Cu(e,t,n,r,o,i,a,l,s){return e=Ba(n,r,!0,e,o,i,a,l,s),e.context=Eu(null),n=e.current,r=re(),o=ct(n),i=Ue(r,o),i.callback=t??null,lt(n,i,o),e.current.lanes=o,er(e,o,r),ce(e,r),e}function _o(e,t,n,r){var o=t.current,i=re(),a=ct(o);return n=Eu(n),t.context===null?t.context=n:t.pendingContext=n,t=Ue(i,a),t.payload={element:e},r=r===void 0?null:r,r!==null&&(t.callback=r),e=lt(o,t,a),e!==null&&(Pe(e,o,a,i),jr(e,o,a)),a}function uo(e){return e=e.current,e.child?(e.child.tag===5,e.child.stateNode):null}function Ps(e,t){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var n=e.retryLane;e.retryLane=n!==0&&n<t?n:t}}function Va(e,t){Ps(e,t),(e=e.alternate)&&Ps(e,t)}function mf(){return null}var Tu=typeof reportError=="function"?reportError:function(e){console.error(e)};function qa(e){this._internalRoot=e}So.prototype.render=qa.prototype.render=function(e){var t=this._internalRoot;if(t===null)throw Error(h(409));_o(e,t,null,null)};So.prototype.unmount=qa.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var t=e.containerInfo;At(function(){_o(null,e,null,null)}),t[Ve]=null}};function So(e){this._internalRoot=e}So.prototype.unstable_scheduleHydration=function(e){if(e){var t=oc();e={blockedOn:null,target:e,priority:t};for(var n=0;n<$e.length&&t!==0&&t<$e[n].priority;n++);$e.splice(n,0,e),n===0&&ac(e)}};function Ga(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function Eo(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11&&(e.nodeType!==8||e.nodeValue!==" react-mount-point-unstable "))}function zs(){}function hf(e,t,n,r,o){if(o){if(typeof r=="function"){var i=r;r=function(){var u=uo(a);i.call(u)}}var a=Cu(t,r,e,0,null,!1,!1,"",zs);return e._reactRootContainer=a,e[Ve]=a.current,qn(e.nodeType===8?e.parentNode:e),At(),a}for(;o=e.lastChild;)e.removeChild(o);if(typeof r=="function"){var l=r;r=function(){var u=uo(s);l.call(u)}}var s=Ba(e,0,!1,null,null,!1,!1,"",zs);return e._reactRootContainer=s,e[Ve]=s.current,qn(e.nodeType===8?e.parentNode:e),At(function(){_o(t,s,n,r)}),s}function Co(e,t,n,r,o){var i=n._reactRootContainer;if(i){var a=i;if(typeof o=="function"){var l=o;o=function(){var s=uo(a);l.call(s)}}_o(t,a,e,o)}else a=hf(n,t,e,o,r);return uo(a)}nc=function(e){switch(e.tag){case 3:var t=e.stateNode;if(t.current.memoizedState.isDehydrated){var n=Cn(t.pendingLanes);n!==0&&(da(t,n|1),ce(t,H()),(T&6)===0&&(sn=H()+500,mt()))}break;case 13:At(function(){var r=qe(e,1);if(r!==null){var o=re();Pe(r,e,1,o)}}),Va(e,1)}};pa=function(e){if(e.tag===13){var t=qe(e,134217728);if(t!==null){var n=re();Pe(t,e,134217728,n)}Va(e,134217728)}};rc=function(e){if(e.tag===13){var t=ct(e),n=qe(e,t);if(n!==null){var r=re();Pe(n,e,t,r)}Va(e,t)}};oc=function(){return P};ic=function(e,t){var n=P;try{return P=e,t()}finally{P=n}};Si=function(e,t,n){switch(t){case"input":if(xi(e,n),t=n.name,n.type==="radio"&&t!=null){for(n=e;n.parentNode;)n=n.parentNode;for(n=n.querySelectorAll("input[name="+JSON.stringify(""+t)+'][type="radio"]'),t=0;t<n.length;t++){var r=n[t];if(r!==e&&r.form===e.form){var o=ho(r);if(!o)throw Error(h(90));Ds(r),xi(r,o)}}}break;case"textarea":Os(e,n);break;case"select":t=n.value,t!=null&&Kt(e,!!n.multiple,t,!1)}};qs=Fa;Gs=At;var xf={usingClientEntryPoint:!1,Events:[nr,Ut,ho,Bs,Vs,Fa]},kn={findFiberByHostInstance:yt,bundleType:0,version:"18.3.1",rendererPackageName:"react-dom"},vf={bundleType:kn.bundleType,version:kn.version,rendererPackageName:kn.rendererPackageName,rendererConfig:kn.rendererConfig,overrideHookState:null,overrideHookStateDeletePath:null,overrideHookStateRenamePath:null,overrideProps:null,overridePropsDeletePath:null,overridePropsRenamePath:null,setErrorHandler:null,setSuspenseHandler:null,scheduleUpdate:null,currentDispatcherRef:Qe.ReactCurrentDispatcher,findHostInstanceByFiber:function(e){return e=Ks(e),e===null?null:e.stateNode},findFiberByHostInstance:kn.findFiberByHostInstance||mf,findHostInstancesForRefresh:null,scheduleRefresh:null,scheduleRoot:null,setRefreshHandler:null,getCurrentFiber:null,reconcilerVersion:"18.3.1-next-f1338f8080-20240426"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"&&(_n=__REACT_DEVTOOLS_GLOBAL_HOOK__,!_n.isDisabled&&_n.supportsFiber))try{po=_n.inject(vf),Le=_n}catch{}var _n;me.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=xf;me.createPortal=function(e,t){var n=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!Ga(t))throw Error(h(200));return gf(e,t,null,n)};me.createRoot=function(e,t){if(!Ga(e))throw Error(h(299));var n=!1,r="",o=Tu;return t!=null&&(t.unstable_strictMode===!0&&(n=!0),t.identifierPrefix!==void 0&&(r=t.identifierPrefix),t.onRecoverableError!==void 0&&(o=t.onRecoverableError)),t=Ba(e,1,!1,null,null,n,!1,r,o),e[Ve]=t.current,qn(e.nodeType===8?e.parentNode:e),new qa(t)};me.findDOMNode=function(e){if(e==null)return null;if(e.nodeType===1)return e;var t=e._reactInternals;if(t===void 0)throw typeof e.render=="function"?Error(h(188)):(e=Object.keys(e).join(","),Error(h(268,e)));return e=Ks(t),e=e===null?null:e.stateNode,e};me.flushSync=function(e){return At(e)};me.hydrate=function(e,t,n){if(!Eo(t))throw Error(h(200));return Co(null,e,t,!0,n)};me.hydrateRoot=function(e,t,n){if(!Ga(e))throw Error(h(405));var r=n!=null&&n.hydratedSources||null,o=!1,i="",a=Tu;if(n!=null&&(n.unstable_strictMode===!0&&(o=!0),n.identifierPrefix!==void 0&&(i=n.identifierPrefix),n.onRecoverableError!==void 0&&(a=n.onRecoverableError)),t=Cu(t,null,e,1,n??null,o,!1,i,a),e[Ve]=t.current,qn(e),r)for(e=0;e<r.length;e++)n=r[e],o=n._getVersion,o=o(n._source),t.mutableSourceEagerHydrationData==null?t.mutableSourceEagerHydrationData=[n,o]:t.mutableSourceEagerHydrationData.push(n,o);return new So(t)};me.render=function(e,t,n){if(!Eo(t))throw Error(h(200));return Co(null,e,t,!1,n)};me.unmountComponentAtNode=function(e){if(!Eo(e))throw Error(h(40));return e._reactRootContainer?(At(function(){Co(null,null,e,!1,function(){e._reactRootContainer=null,e[Ve]=null})}),!0):!1};me.unstable_batchedUpdates=Fa;me.unstable_renderSubtreeIntoContainer=function(e,t,n,r){if(!Eo(n))throw Error(h(200));if(e==null||e._reactInternals===void 0)throw Error(h(38));return Co(e,t,n,!1,r)};me.version="18.3.1-next-f1338f8080-20240426"});var Ru=Ie((Lf,zu)=>{"use strict";function Pu(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(Pu)}catch(e){console.error(e)}}Pu(),zu.exports=Au()});var Nu=Ie(Qa=>{"use strict";var Mu=Ru();Qa.createRoot=Mu.createRoot,Qa.hydrateRoot=Mu.hydrateRoot;var Df});var Lu=Ie(To=>{"use strict";var yf=pn(),wf=Symbol.for("react.element"),bf=Symbol.for("react.fragment"),kf=Object.prototype.hasOwnProperty,_f=yf.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,Sf={key:!0,ref:!0,__self:!0,__source:!0};function ju(e,t,n){var r,o={},i=null,a=null;n!==void 0&&(i=""+n),t.key!==void 0&&(i=""+t.key),t.ref!==void 0&&(a=t.ref);for(r in t)kf.call(t,r)&&!Sf.hasOwnProperty(r)&&(o[r]=t[r]);if(e&&e.defaultProps)for(r in t=e.defaultProps,t)o[r]===void 0&&(o[r]=t[r]);return{$$typeof:wf,type:e,key:i,ref:a,props:o,_owner:_f.current}}To.Fragment=bf;To.jsx=ju;To.jsxs=ju});var Ao=Ie((Ff,Du)=>{"use strict";Du.exports=Lu()});var d0=Nt(pn()),Qu=Nt(Nu());var Xa=Nt(Ao(),1),Vu=Nt(pn(),1);var Iu=`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AEONIX \u2014 Compute scaled in the void</title>
    
    <!-- Fonts: Thinner weights as requested (Syncopate 600 instead of 700, Space Grotesk 400/500/600, Inter 400/500) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Space+Grotesk:wght@400;500;600&family=Syncopate:wght@400;600&display=swap" rel="stylesheet">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"><\/script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'system-ui', 'sans-serif'],
                        display: ['Space Grotesk', 'sans-serif'],
                        brand: ['Syncopate', 'sans-serif'],
                    },
                    colors: {
                        ink: '#080503',
                        ash: { DEFAULT: '#d2c3b4', dim: '#8c7d6f', faint: '#5d5249' },
                        ember: { DEFAULT: '#ff5a1e', hot: '#ff8a3a', gold: '#ffcf86' },
                        crimson: '#c11d12',
                    }
                }
            }
        }
    <\/script>
    
    <!-- Iconify -->
    <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"><\/script>
</head>
<body class="bg-ink font-sans text-ash overflow-hidden relative h-screen w-screen selection:bg-ember/30 selection:text-white">

    <!-- Deep Forge Ground Layer -->
    <div class="ground fixed inset-0 z-0 pointer-events-none" 
         style="background: radial-gradient(60% 60% at 60% 47%, rgba(255,80,24,0.30) 0%, rgba(200,40,12,0.10) 30%, rgba(8,5,3,0) 58%), radial-gradient(120% 90% at 14% 116%, rgba(255,90,26,0.22) 0%, rgba(8,5,3,0) 52%), radial-gradient(140% 130% at 50% 50%, rgba(20,10,6,0) 38%, rgba(4,2,1,0.74) 100%), linear-gradient(180deg,#0b0604 0%,#080403 100%);">
    </div>

    <!-- Aura Asset Image Layer -->
    <div class="fixed inset-0 z-[1] pointer-events-none opacity-[0.12] mix-blend-screen bg-cover bg-center" 
         style="background-image: url('https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/fa51902b-c2a4-4c33-a96e-a8f1ef67edc6_3840w.jpg');">
    </div>

    <!-- Breathing Core Overlay -->
    <div class="core fixed z-[1] left-[50%] lg:left-[60%] top-[38%] lg:top-[47%] w-[50vmax] lg:w-[34vmax] h-[50vmax] lg:h-[34vmax] -translate-x-1/2 -translate-y-1/2 pointer-events-none mix-blend-screen will-change-transform"
         style="background: radial-gradient(circle,rgba(255,150,70,0.42) 0%,rgba(255,70,20,0.16) 28%,rgba(190,30,10,0.05) 48%,rgba(8,5,3,0) 66%);">
    </div>

    <!-- Rotating Ember Ring -->
    <div class="ring fixed z-[1] left-[50%] lg:left-[60%] top-[38%] lg:top-[47%] w-[45vmax] lg:w-[30vmax] h-[45vmax] lg:h-[30vmax] -translate-x-1/2 -translate-y-1/2 pointer-events-none mix-blend-screen rounded-full will-change-transform opacity-0"
         style="background: conic-gradient(from 0deg,rgba(255,120,40,0) 0deg,rgba(255,140,55,0.18) 60deg,rgba(255,90,30,0) 130deg,rgba(255,150,70,0.12) 220deg,rgba(255,90,30,0) 300deg,rgba(255,120,40,0) 360deg); -webkit-mask: radial-gradient(circle,transparent 60%,#000 61%,#000 70%,transparent 72%); mask: radial-gradient(circle,transparent 60%,#000 61%,#000 70%,transparent 72%);">
    </div>

    <!-- WebGL Canvas for Particle Storm -->
    <canvas id="gl" class="fixed inset-0 z-[2] w-full h-full block pointer-events-none mix-blend-screen"></canvas>

    <!-- Grain Texture Overlay -->
    <div class="grain fixed inset-0 z-[3] pointer-events-none opacity-5"
         style="background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E&quot;);">
    </div>

    <!-- Readability Scrim -->
    <div class="scrim fixed inset-0 z-[3] pointer-events-none bg-gradient-to-b lg:bg-gradient-to-r from-ink/90 lg:from-ink/85 via-ink/40 lg:via-ink/55 to-ink/65 lg:to-transparent"
         style="background: linear-gradient(100deg,rgba(6,3,2,0.86) 0%,rgba(6,3,2,0.55) 28%,rgba(6,3,2,0) 56%);">
    </div>

    <!-- Frame Ticks (Crosshairs) -->
    <span class="frame-tick absolute z-[4] w-3.5 h-3.5 border border-ember/20 pointer-events-none opacity-0 top-[18px] left-[18px] border-r-0 border-b-0"></span>
    <span class="frame-tick absolute z-[4] w-3.5 h-3.5 border border-ember/20 pointer-events-none opacity-0 top-[18px] right-[18px] border-l-0 border-b-0"></span>
    <span class="frame-tick absolute z-[4] w-3.5 h-3.5 border border-ember/20 pointer-events-none opacity-0 bottom-[18px] left-[18px] border-r-0 border-t-0"></span>
    <span class="frame-tick absolute z-[4] w-3.5 h-3.5 border border-ember/20 pointer-events-none opacity-0 bottom-[18px] right-[18px] border-l-0 border-t-0"></span>

    <!-- Floating HUD Readout -->
    <div class="coretemp hidden lg:block fixed z-[4] right-[clamp(20px,9vw,140px)] top-[clamp(96px,21vh,200px)] text-right pointer-events-none opacity-0">
        <div class="k font-display text-[10px] tracking-[0.28em] uppercase text-ash-faint mb-1.5 flex items-center gap-2 justify-end">
            <span class="pip w-1.5 h-1.5 rounded-full bg-ember-hot" style="box-shadow: 0 0 10px 1px #ff5a1e;"></span>
            Core temp
        </div>
        <div class="v font-brand font-semibold text-[clamp(26px,3vw,40px)] leading-[0.9] text-[#fff2e2] tracking-[0.01em]">
            <span data-count="82" data-dec="0">0</span><small class="font-display text-[0.42em] text-ember-hot tracking-[0.06em] ml-1 font-medium">\xB0C</small>
        </div>
    </div>

    <!-- Main UI Shell -->
    <div class="shell relative z-[4] h-dvh h-screen flex flex-col w-full max-w-[1320px] mx-auto px-5 lg:px-[52px]">
        
        <!-- Navigation -->
        <nav class="pt-[clamp(20px,3.2vh,30px)]">
            <div class="nav-row flex items-center justify-between gap-5">
                <div class="brand flex items-center opacity-0">
                    <span class="wordmark font-brand font-semibold text-[15px] lg:text-[18px] tracking-[0.24em] lg:tracking-[0.30em] text-[#fff4e8] uppercase pl-[0.04em]">Aeonix</span>
                </div>
                <div class="nav-links hidden lg:flex items-center gap-[30px]">
                    <a href="#" class="text-[12.5px] tracking-[0.02em] text-ash-dim hover:text-[#fff1e2] relative transition-colors duration-300 opacity-0 after:absolute after:left-0 after:-bottom-1.5 after:h-px after:w-0 after:bg-ember-hot after:transition-all hover:after:w-full">Platform</a>
                    <a href="#" class="text-[12.5px] tracking-[0.02em] text-ash-dim hover:text-[#fff1e2] relative transition-colors duration-300 opacity-0 after:absolute after:left-0 after:-bottom-1.5 after:h-px after:w-0 after:bg-ember-hot after:transition-all hover:after:w-full">Infrastructure</a>
                    <a href="#" class="text-[12.5px] tracking-[0.02em] text-ash-dim hover:text-[#fff1e2] relative transition-colors duration-300 opacity-0 after:absolute after:left-0 after:-bottom-1.5 after:h-px after:w-0 after:bg-ember-hot after:transition-all hover:after:w-full">Models</a>
                    <a href="#" class="text-[12.5px] tracking-[0.02em] text-ash-dim hover:text-[#fff1e2] relative transition-colors duration-300 opacity-0 after:absolute after:left-0 after:-bottom-1.5 after:h-px after:w-0 after:bg-ember-hot after:transition-all hover:after:w-full">Security</a>
                    <a href="#" class="text-[12.5px] tracking-[0.02em] text-ash-dim hover:text-[#fff1e2] relative transition-colors duration-300 opacity-0 after:absolute after:left-0 after:-bottom-1.5 after:h-px after:w-0 after:bg-ember-hot after:transition-all hover:after:w-full">Contact</a>
                </div>
                <a href="#" class="nav-cta inline-flex items-center gap-[9px] text-[12.5px] font-medium tracking-[0.02em] text-[#1a0a04] px-[17px] py-2.5 rounded-full whitespace-nowrap opacity-0 transition-all duration-300 hover:-translate-y-[1px]"
                   style="background: linear-gradient(180deg,#ffcf86,#ff7a2a); box-shadow: 0 4px 22px -6px rgba(255,100,40,0.7);">
                    <b class="w-1.5 h-1.5 rounded-full bg-[#3a1202] inline-block"></b>Deploy cluster
                </a>
            </div>
        </nav>

        <!-- Main Content -->
        <main class="flex-1 flex items-end pb-5 lg:pb-[clamp(28px,5vh,58px)] min-h-0">
            <div class="grid w-full grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-6 lg:gap-[clamp(28px,5vw,72px)] items-end">
                
                <div class="lead max-w-[780px]">
                    <div class="eyebrow flex items-center gap-3.5 mb-[clamp(18px,3vh,30px)]">
                        <span class="rule h-px w-0" style="background: linear-gradient(90deg, #ff5a1e, rgba(255,120,50,0));"></span>
                        <span class="tag font-display text-[11px] tracking-[0.3em] uppercase text-ember-hot whitespace-nowrap opacity-0">Hyperscale Compute</span>
                        <span class="ver text-[11px] tracking-[0.18em] text-ash-faint opacity-0">/ cluster v2.4</span>
                    </div>
                    
                    <h1 class="font-display font-medium text-[clamp(34px,12vw,52px)] lg:text-[clamp(40px,7.4vw,100px)] leading-[0.95] tracking-tight text-[#fff6ec] text-balance">
                        <span class="block">
                            <span class="inline-block overflow-hidden"><span class="word-reveal inline-block will-change-transform pr-2 lg:pr-3">Compute</span></span>
                            <span class="inline-block overflow-hidden"><span class="word-reveal inline-block will-change-transform">scaled</span></span>
                        </span>
                        <span class="block">
                            <span class="inline-block overflow-hidden"><span class="word-reveal inline-block will-change-transform pr-2 lg:pr-3">in</span></span>
                            <span class="inline-block overflow-hidden"><span class="word-reveal inline-block will-change-transform pr-2 lg:pr-3">the</span></span>
                            <span class="inline-block overflow-hidden"><span class="word-reveal inline-block will-change-transform grad bg-clip-text text-transparent" style="background-image: linear-gradient(96deg,#ff7a2a 0%,#ffcf86 46%,#ff4d18 100%);">void.</span></span>
                        </span>
                    </h1>
                    
                    <p class="sub mt-[clamp(14px,3vh,26px)] max-w-[500px] text-[clamp(14px,1.15vw,16px)] leading-[1.62] text-ash-dim opacity-0">
                        <b class="text-[#ead9c8] font-medium">Aeonix</b> orchestrates the hyperscale infrastructure where neural networks are 
                        trained, deployed, and monitored under controlled precision. Distributed compute, 
                        live latency mapping, and parameter tuning traced down to the tensor.
                    </p>
                    
                    <div class="actions flex items-center gap-4 mt-[clamp(18px,3.6vh,36px)] flex-wrap">
                        <a href="#" class="btn btn-prime inline-flex items-center gap-2.5 rounded-full px-6 py-[13px] text-[13.5px] font-medium tracking-[0.01em] text-[#1a0a04] transition-all duration-300 hover:-translate-y-0.5 group"
                           style="background: linear-gradient(180deg,#ffcf86,#ff7322); box-shadow: 0 8px 30px -8px rgba(255,100,40,0.65);">
                            Start a cluster
                            <iconify-icon icon="solar:arrow-right-linear" class="text-lg transition-transform duration-300 group-hover:translate-x-1" style="stroke-width: 1.5;"></iconify-icon>
                        </a>
                        
                        <!-- Gradient Border Treatment -->
                        <div class="relative p-[1px] rounded-full bg-gradient-to-b from-ember/40 to-transparent group hover:from-ember/70 transition-colors duration-300 opacity-0 btn-ghost-wrap">
                            <a href="#" class="btn btn-ghost flex items-center gap-2.5 rounded-full px-6 py-[13px] text-[13.5px] font-medium tracking-[0.01em] text-ash bg-ink transition-colors duration-300 hover:text-[#fff1e2]">
                                Model registry
                            </a>
                        </div>
                    </div>
                </div>

                <aside class="rail relative w-full lg:w-[236px] flex flex-col grid grid-cols-2 lg:flex gap-x-[18px] gap-y-1.5 lg:gap-0 lg:pl-[22px] pt-[18px] lg:pt-0">
                    <!-- Gradient Border Treatments -->
                    <div class="absolute left-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-white/20 via-white/5 to-transparent hidden lg:block"></div>
                    <div class="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-white/20 via-white/5 to-transparent lg:hidden"></div>
                    
                    <div class="rail-head col-span-2 lg:col-span-1 flex items-center gap-2 mb-0.5 lg:mb-[18px] opacity-0">
                        <span class="dot w-1.5 h-1.5 rounded-full bg-ember-hot" style="box-shadow: 0 0 9px 1px #ff5a1e;"></span>
                        <span class="lbl font-display text-[10.5px] tracking-[0.26em] uppercase text-ash-faint">Cluster telemetry</span>
                    </div>
                    
                    <div class="metric py-2 lg:py-[13px] border-b-0 lg:border-b border-white/5 opacity-0">
                        <div class="k text-[10.5px] tracking-[0.16em] uppercase text-ash-faint mb-1.5">Peak latency</div>
                        <div class="v font-display text-[25px] font-medium text-[#fff2e2] leading-none flex items-baseline gap-1">
                            <span data-count="12" data-dec="0">0</span><small class="text-[12px] text-ember-hot font-medium tracking-[0.02em]">ms</small>
                        </div>
                    </div>
                    
                    <div class="metric py-2 lg:py-[13px] border-b-0 lg:border-b border-white/5 opacity-0">
                        <div class="k text-[10.5px] tracking-[0.16em] uppercase text-ash-faint mb-1.5">Daily requests</div>
                        <div class="v font-display text-[25px] font-medium text-[#fff2e2] leading-none flex items-baseline gap-1">
                            <span data-count="4.2" data-dec="1">0.0</span><small class="text-[12px] text-ember-hot font-medium tracking-[0.02em]">B</small>
                        </div>
                    </div>
                    
                    <div class="metric py-2 lg:py-[13px] border-b-0 lg:border-b border-white/5 opacity-0">
                        <div class="k text-[10.5px] tracking-[0.16em] uppercase text-ash-faint mb-1.5">Active nodes</div>
                        <div class="v font-display text-[25px] font-medium text-[#fff2e2] leading-none flex items-baseline gap-1">
                            <span data-count="1024" data-dec="0">0</span>
                        </div>
                    </div>
                    
                    <div class="metric py-2 lg:py-[13px] opacity-0">
                        <div class="k text-[10.5px] tracking-[0.16em] uppercase text-ash-faint mb-1.5">Uptime</div>
                        <div class="v font-display text-[25px] font-medium text-[#fff2e2] leading-none flex items-baseline gap-1">
                            <span data-count="99.99" data-dec="2">0.00</span><small class="text-[12px] text-ember-hot font-medium tracking-[0.02em]">%</small>
                        </div>
                    </div>
                    
                    <div class="meter hidden lg:block mt-[18px] opacity-0 col-span-2">
                        <div class="mlbl flex justify-between text-[10px] tracking-[0.14em] uppercase text-ash-faint mb-2">
                            <span>Compute load</span><span>stable</span>
                        </div>
                        <div class="bars flex gap-[3px] h-[30px] items-end" id="bars">
                            <!-- Bars injected by JS -->
                        </div>
                    </div>
                </aside>
            </div>
        </main>

        <!-- Footer Status -->
        <footer class="pb-[clamp(16px,2.6vh,24px)]">
            <div class="status relative flex items-center justify-between gap-[18px] pt-[14px] opacity-0">
                <!-- Gradient Border Treatment -->
                <div class="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-white/20 via-white/5 to-transparent"></div>
                
                <div class="left flex items-center gap-5 flex-wrap">
                    <span class="pill flex items-center gap-2 text-[11px] tracking-[0.04em] text-ash-dim">
                        <span class="gd w-1.5 h-1.5 rounded-full bg-[#ffb347]" style="box-shadow: 0 0 8px 1px rgba(255,150,60,0.7);"></span>
                        All clusters nominal
                    </span>
                    <span class="pill flex items-center gap-2 text-[11px] tracking-[0.04em] text-ash-dim">
                        3 regions \xB7 edge + hyperscale
                    </span>
                </div>
                <div class="right hidden md:block font-display text-[11px] tracking-[0.18em] uppercase text-ash-faint whitespace-nowrap">
                    Trained by data, proven by scale
                </div>
            </div>
        </footer>
    </div>

    <!-- Scripts -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"><\/script>
    
    <script>
        const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        gsap.registerPlugin(ScrollTrigger);

        /* ============ EMBER STORM VORTEX (WebGL / Three.js) ============ */
        (function(){
            const canvas = document.getElementById('gl');
            if(!window.THREE) return;
            const RES = 0.5;
            let renderer;
            try{
                renderer = new THREE.WebGLRenderer({canvas, antialias:false, alpha:true, powerPreference:'high-performance'});
            }catch(e){ return; }
            renderer.setPixelRatio(1);
            renderer.setClearColor(0x000000, 0);

            const scene = new THREE.Scene();
            const camera = new THREE.OrthographicCamera(-1,1,1,-1,0,1);

            const COUNT = 12000;
            const seeds = new Float32Array(COUNT);
            const angs  = new Float32Array(COUNT);
            const rads  = new Float32Array(COUNT);
            for(let i=0;i<COUNT;i++){
                seeds[i] = Math.random();
                angs[i]  = Math.random()*Math.PI*2.0;
                rads[i]  = Math.sqrt(Math.random());
            }
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT*3), 3));
            geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
            geo.setAttribute('aAng',  new THREE.BufferAttribute(angs, 1));
            geo.setAttribute('aRad',  new THREE.BufferAttribute(rads, 1));

            const uniforms = {
                uTime:   { value: 0 },
                uScale:  { value: 1 },
                uAspect: { value: 1.6 },
            };

            const mat = new THREE.ShaderMaterial({
                uniforms,
                transparent:true,
                depthTest:false,
                depthWrite:false,
                blending:THREE.AdditiveBlending,
                vertexShader:\`
                    attribute float aSeed;
                    attribute float aAng;
                    attribute float aRad;
                    uniform float uTime;
                    uniform float uScale;
                    uniform float uAspect;
                    varying float vHeat;
                    varying float vFlick;
                    varying float vCore;
                    float hash(float n){ return fract(sin(n*12.9898)*43758.5453); }
                    void main(){
                        float life = hash(aSeed*7.31);
                        float u = fract(uTime*(0.045 + life*0.06) + aSeed);
                        float rmax = 0.58 + aRad*0.48;
                        float r = max(rmax*(1.0 - u*0.82), 0.018);
                        float omega = (0.55 + life*0.55) / (r*0.9 + 0.12);
                        float spiral = (rmax - r)*5.2;
                        float theta = aAng + uTime*omega*0.34 + spiral;
                        float t1 = sin(theta*3.0 + aSeed*10.0 + uTime*0.8);
                        float t2 = sin(r*9.0 - uTime*1.1 + aSeed*4.0);
                        r += t1*0.022 + t2*0.016;
                        float cx = 0.20, cy = 0.06;
                        float x = cx + (cos(theta)*r)/uAspect;
                        float y = cy + sin(theta)*r;
                        y += u*0.11 + sin(uTime*5.0 + aSeed*30.0)*0.006;
                        x += sin(uTime*3.3 + aSeed*22.0)*0.004/uAspect;

                        vCore  = 1.0 - smoothstep(0.0, 0.17, r);
                        vHeat  = clamp(pow(1.0-u, 1.3) * (0.5 + 0.5*(1.0-r)), 0.0, 1.0);
                        vFlick = 0.55 + 0.45*sin(uTime*9.0 + aSeed*40.0);
                        float sz = (0.7 + hash(aSeed*12.3)*2.7) * (0.45 + vHeat*1.55 + vCore*1.4);
                        gl_Position = vec4(x, y, 0.0, 1.0);
                        gl_PointSize = sz * uScale;
                    }
                \`,
                fragmentShader:\`
                    precision mediump float;
                    varying float vHeat;
                    varying float vFlick;
                    varying float vCore;
                    void main(){
                        vec2 p = gl_PointCoord*2.0 - 1.0;
                        float d = dot(p,p);
                        if(d>1.0) discard;
                        float core = (1.0-d); core *= core;
                        vec3 crimson = vec3(0.72,0.10,0.03);
                        vec3 amber   = vec3(1.0,0.55,0.12);
                        vec3 white   = vec3(1.0,0.93,0.78);
                        vec3 c = mix(crimson, amber, vHeat);
                        c = mix(c, white, vCore*0.85);
                        float a = core*(0.28 + 0.85*vHeat)*vFlick + core*vCore*0.55;
                        gl_FragColor = vec4(c*(1.0 + vHeat*0.5 + vCore*0.7), a);
                    }
                \`
            });

            const points = new THREE.Points(geo, mat);
            points.frustumCulled = false;
            scene.add(points);

            function resize(){
                const w = window.innerWidth, h = window.innerHeight;
                renderer.setSize(Math.round(w*RES), Math.round(h*RES), false);
                canvas.style.width = w+'px';
                canvas.style.height = h+'px';
                uniforms.uAspect.value = Math.max(0.6, w/h);
                uniforms.uScale.value = Math.max(0.6, (h*RES)/900);
            }
            resize();
            window.addEventListener('resize', resize);

            let raf=0, running=true, last=performance.now();
            function frame(now){
                if(!running) return;
                const dt = Math.min(0.05,(now-last)/1000); last=now;
                uniforms.uTime.value += dt;
                renderer.render(scene,camera);
                raf=requestAnimationFrame(frame);
            }
            if(REDUCED){
                uniforms.uTime.value = 9.1;
                renderer.render(scene,camera);
            } else {
                raf=requestAnimationFrame(frame);
            }
            document.addEventListener('visibilitychange',()=>{
                if(document.hidden){ running=false; cancelAnimationFrame(raf); }
                else if(!REDUCED){ running=true; last=performance.now(); raf=requestAnimationFrame(frame); }
            });
        })();

        /* ============ LIVING COMPUTATIONAL-LOAD METER ============ */
        (function(){
            const host = document.getElementById('bars');
            if(!host) return;
            const N=22, bars=[];
            for(let i=0;i<N;i++){ 
                const b=document.createElement('i'); 
                b.className = "flex-1 rounded-sm opacity-85 origin-bottom";
                b.style.background = "linear-gradient(180deg, #ffcf86, #c11d12)";
                b.style.transform = "scaleY(0.3)";
                host.appendChild(b); 
                bars.push(b); 
            }
            if(REDUCED){ bars.forEach((b,i)=>b.style.transform='scaleY('+(0.35+Math.abs(Math.sin(i*0.7))*0.55).toFixed(2)+')'); return; }
            let t=0, acc=0, prev=performance.now();
            function tick(now){
                acc += now-prev; prev=now;
                if(acc>=110){
                    acc=0; t+=0.18;
                    for(let i=0;i<N;i++){
                        const v = 0.30 + 0.55*Math.abs(Math.sin(t + i*0.55) * Math.cos(t*0.6 - i*0.3));
                        bars[i].style.transform = 'scaleY('+v.toFixed(2)+')';
                    }
                }
                requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
        })();

        /* ============ COUNT-UP TELEMETRY ============ */
        function runCounters(){
            document.querySelectorAll('[data-count]').forEach(el=>{
                const target=parseFloat(el.dataset.count), dec=parseInt(el.dataset.dec||'0');
                if(REDUCED){ el.textContent=target.toFixed(dec); return; }
                const t0=performance.now(), dur=1500;
                function step(t){
                    const p=Math.min(1,(t-t0)/dur);
                    const e=1-Math.pow(1-p,3);
                    el.textContent=(target*e).toFixed(dec);
                    if(p<1) requestAnimationFrame(step);
                }
                requestAnimationFrame(step);
            });
        }

        /* ============ ENTRANCE CHOREOGRAPHY ============ */
        (function(){
            if(REDUCED || !window.gsap){
                document.querySelectorAll('.brand,.nav-links a,.nav-cta,.eyebrow .tag,.eyebrow .ver,.sub,.rail-head,.metric,.meter,.status,.frame-tick,.coretemp,.ring,.btn-prime,.btn-ghost-wrap')
                    .forEach(e=>{e.style.opacity=1; e.style.transform='none'});
                document.querySelectorAll('.word-reveal').forEach(e=>e.style.transform='none');
                document.querySelector('.eyebrow .rule').style.width='34px';
                runCounters();
                return;
            }
            
            const tl = gsap.timeline({defaults:{ease:'power3.out'}});
            tl.to('.frame-tick',{opacity:1,duration:.4,stagger:.05},0);
            tl.fromTo('.brand',{y:-12,opacity:0},{y:0,opacity:1,duration:.6},.1);
            
            // Masked staggered word reveal hooked to ScrollTrigger
            gsap.fromTo('.word-reveal', 
                {yPercent:115},
                {yPercent:0, duration:.9, ease:'power4.out', stagger:.08, scrollTrigger: { trigger: 'h1', start: "top 95%" }}
            );
            
            tl.to('.eyebrow .rule',{width:34,duration:.5},.3)
              .fromTo('.eyebrow .tag',{x:-10,opacity:0},{x:0,opacity:1,duration:.45},.42)
              .to('.eyebrow .ver',{opacity:1,duration:.45},.55);
              
            tl.fromTo('.nav-links a',{y:-8,opacity:0},{y:0,opacity:1,duration:.5,stagger:.06},.45)
              .fromTo('.nav-cta',{scale:.8,opacity:0},{scale:1,opacity:1,duration:.5,ease:'back.out(2)'},.5);
              
            tl.to('.ring',{opacity:1,duration:1.0},.4);
            tl.fromTo('.coretemp',{opacity:0,x:18},{opacity:1,x:0,duration:.7},.6);
            tl.fromTo('.sub',{opacity:0,y:14,filter:'blur(6px)'},{opacity:1,y:0,filter:'blur(0px)',duration:.7},.72);
            
            tl.fromTo(['.btn-prime','.btn-ghost-wrap'],{opacity:0,y:16},{opacity:1,y:0,duration:.55,stagger:.09},.84);
            
            tl.to('.rail-head',{opacity:1,duration:.45},.55)
              .fromTo('.metric',{x:18,opacity:0},{x:0,opacity:1,duration:.5,stagger:.09,onStart:runCounters},.62)
              .to('.meter',{opacity:1,duration:.45},1.0);
              
            tl.fromTo('.status',{y:10,opacity:0},{y:0,opacity:1,duration:.55},.95);

            // Ambient breathing animations
            gsap.to('.core',{filter:'brightness(1.35)',duration:2.4,repeat:-1,yoyo:true,ease:'sine.inOut'});
            gsap.to('.ring',{rotation:360,duration:46,repeat:-1,ease:'none',transformOrigin:'50% 50%'});
            gsap.to('.rail-head .dot',{opacity:.35,duration:.9,repeat:-1,yoyo:true,ease:'sine.inOut'});
            gsap.to('.coretemp .pip',{opacity:.3,duration:.7,repeat:-1,yoyo:true,ease:'sine.inOut'});
        })();
    <\/script>
</body>
</html>`;var Ou=`<!doctype html>
<html lang="en"><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aura UI Builder</title>
    
    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&amp;display=swap" rel="stylesheet">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"><\/script>
    
    <!-- Iconify -->
    <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"><\/script>
    
    <!-- GSAP -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"><\/script>
    
    <!-- Three.js -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\/script>
<link id="all-fonts-link-font-geist" rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&amp;display=swap"><style id="all-fonts-style-font-geist">.font-geist { font-family: 'Geist', sans-serif !important; }</style></head>
<body class="antialiased min-h-screen flex flex-col relative overflow-x-hidden bg-[#030305] text-white selection:bg-[#2640D9]/40 selection:text-white" style="font-family: 'Inter', sans-serif;">

    <!-- WebGL Background Canvas Layer -->
    <canvas id="bg-canvas" class="fixed inset-0 z-0 pointer-events-none w-full h-full"></canvas>
    
    <!-- Texture Layer: Grain Overlay -->
    <div class="fixed inset-0 z-0 pointer-events-none opacity-[0.08]" style="mix-blend-mode: overlay; background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');"></div>
    
    <!-- Texture Layer: Blueprint Grid -->
    <div class="fixed inset-0 z-0 pointer-events-none opacity-20" style="background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 12px);"></div>

    <!-- Navigation -->
    <nav class="w-full flex items-center justify-between py-6 px-8 relative z-10">
        <div class="flex items-center gap-8">
            <a href="#" class="flex items-center gap-2 text-[#EDEDED] font-normal font-geist">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 0H16V8H8L16 16H0V0Z" fill="white"></path>
                </svg>
                Aura
            </a>
            <div class="hidden md:flex items-center gap-6 text-sm text-[#A3A3A3] font-light">
                <a href="#" class="hover:text-[#EDEDED] transition-colors font-geist">Product</a>
                <a href="#" class="hover:text-[#EDEDED] transition-colors font-geist">Integrations</a>
                <a href="#" class="hover:text-[#EDEDED] transition-colors font-geist">Resources</a>
                <a href="#" class="hover:text-[#EDEDED] transition-colors font-geist">Enterprise</a>
                <a href="#" class="hover:text-[#EDEDED] transition-colors font-geist">Pricing</a>
            </div>
        </div>
        <div>
            <div class="w-8 h-8 rounded-full bg-[#2640D9] flex items-center justify-center text-xs text-white font-normal shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.2),0px_1px_0px_0px_rgba(25,28,33,0.04),0px_0px_0px_1px_rgba(25,28,33,0.12)] font-geist">
                AL
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main class="flex-grow flex flex-col items-center pt-24 px-4 relative z-10 w-full max-w-[1400px] mx-auto">
        
        <!-- Hero Text -->
        <div class="text-center mb-12 max-w-2xl">
            <h1 id="hero-title" class="text-5xl md:text-6xl font-normal tracking-tight leading-tight mb-4 flex flex-col items-center justify-center">
                <div class="flex flex-wrap justify-center gap-[0.25em]">
                    <span class="inline-block overflow-hidden align-bottom text-white"><span class="reveal-text inline-block translate-y-full font-geist font-light tracking-tighter">The</span></span>
                    <span class="inline-block overflow-hidden align-bottom text-white"><span class="reveal-text inline-block translate-y-full font-geist font-light tracking-tighter">intelligent</span></span>
                    <span class="inline-block overflow-hidden align-bottom text-white"><span class="reveal-text inline-block translate-y-full font-geist font-light tracking-tighter">design</span></span>
                    <span class="inline-block overflow-hidden align-bottom text-white"><span class="reveal-text inline-block translate-y-full font-geist font-light tracking-tighter">system</span></span>
                </div>
                <div class="flex flex-wrap justify-center gap-[0.25em] text-[#A3A3A3]">
                    <span class="inline-block overflow-hidden align-bottom"><span class="reveal-text inline-block translate-y-full font-geist font-light tracking-tighter">for</span></span>
                    <span class="inline-block overflow-hidden align-bottom"><span class="reveal-text inline-block translate-y-full font-geist font-light tracking-tighter">industry-leading</span></span>
                    <span class="inline-block overflow-hidden align-bottom"><span class="reveal-text inline-block translate-y-full font-geist font-light tracking-tighter">creators</span></span>
                </div>
            </h1>
            <p class="text-lg text-[#A3A3A3] font-light opacity-0 font-geist" id="hero-subtitle">
                Architect and scale beautiful digital experiences with absolute control.
            </p>
        </div>

        <!-- Glowing Prompt Box -->
        <div class="w-full max-w-3xl relative mb-8 group" id="prompt-container">
            <!-- Atmospheric Glow -->
            <div class="absolute -inset-1 bg-gradient-to-r from-[#2640D9] via-[#6633E6] to-[#2640D9] rounded-2xl blur-2xl opacity-50 group-hover:opacity-70 transition-opacity duration-700"></div>
            
            <!-- Premium Surface with Border Gradient -->
            <div class="relative p-[1px] rounded-[18px] bg-gradient-to-b from-[#6633E6] via-[#2640D9] to-[#030305] shadow-[0_2.8px_2.2px_rgba(0,_0,_0,_0.034),_0_6.7px_5.3px_rgba(0,_0,_0,_0.048),_0_12.5px_10px_rgba(0,_0,_0,_0.06),_0_22.3px_17.9px_rgba(0,_0,_0,_0.072),_0_41.8px_33.4px_rgba(0,_0,_0,_0.086),_0_100px_80px_rgba(0,_0,_0,_0.12)]">
                
                <div class="bg-gradient-to-b from-[#0A0A14] to-[#030305] rounded-[17px] flex flex-col overflow-hidden" style="box-shadow: inset 0 2px 10px rgba(102,51,230,0.1), inset 0 -4px 10px rgba(0,0,0,0.8);">
                    
                    <textarea class="w-full bg-transparent text-[#EDEDED] placeholder:text-[#A3A3A3]/50 p-6 min-h-[140px] resize-none outline-none text-lg font-light" placeholder="Create a minimalist dashboard for a next-gen crypto wallet..."></textarea>

                    <div class="flex items-center justify-between px-4 py-3 border-t border-[#2640D9]/30 bg-[#030305]/80 backdrop-blur-sm">
                        
                        <button class="flex items-center gap-2 text-sm text-[#A3A3A3] hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5 font-light font-geist">
                            Model v4
                            <iconify-icon icon="solar:alt-arrow-down-linear" width="16" height="16" stroke-width="1.5"></iconify-icon>
                        </button>

                        <button class="w-8 h-8 rounded-full bg-[#2640D9] flex items-center justify-center text-white hover:bg-[#3B54E6] transition-colors shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.2),0px_1px_0px_0px_rgba(25,28,33,0.04),0px_0px_0px_1px_rgba(25,28,33,0.12)]">
                            <iconify-icon icon="solar:arrow-up-linear" width="18" height="18" stroke-width="1.5"></iconify-icon>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Suggestion Pills -->
        <div class="flex flex-wrap justify-center gap-3 mb-16 opacity-0" id="suggestion-pills">
            <button class="px-4 py-2 rounded-full border border-[#262626] bg-[#161616]/50 text-sm text-[#A3A3A3] hover:text-white hover:border-[#A3A3A3]/50 transition-all backdrop-blur-md font-light font-geist">Build a SaaS landing page</button>
            <button class="px-4 py-2 rounded-full border border-[#262626] bg-[#161616]/50 text-sm text-[#A3A3A3] hover:text-white hover:border-[#A3A3A3]/50 transition-all backdrop-blur-md font-light font-geist">Draft a mobile app UI</button>
            <button class="px-4 py-2 rounded-full border border-[#262626] bg-[#161616]/50 text-sm text-[#A3A3A3] hover:text-white hover:border-[#A3A3A3]/50 transition-all backdrop-blur-md font-light font-geist">Design a newsletter template</button>
            <button class="px-4 py-2 rounded-full border border-[#262626] bg-[#161616]/50 text-sm text-[#A3A3A3] hover:text-white hover:border-[#A3A3A3]/50 transition-all backdrop-blur-md font-light font-geist">Write API documentation</button>
        </div>

        <a href="#mock-app" class="flex items-center gap-2 text-sm text-[#A3A3A3] hover:text-white transition-colors mb-12 opacity-0 font-light font-geist" id="explore-link">
            Explore the builder
            <iconify-icon icon="solar:arrow-down-linear" width="16" height="16" stroke-width="1.5"></iconify-icon>
        </a>

        <!-- Mock App Interface -->
        <div id="mock-app" class="w-full mt-8 rounded-t-2xl overflow-hidden flex flex-col shadow-[0_2.8px_2.2px_rgba(0,_0,_0,_0.034),_0_6.7px_5.3px_rgba(0,_0,_0,_0.048),_0_12.5px_10px_rgba(0,_0,_0,_0.06),_0_22.3px_17.9px_rgba(0,_0,_0,_0.072),_0_41.8px_33.4px_rgba(0,_0,_0,_0.086),_0_100px_80px_rgba(0,_0,_0,_0.12)] min-h-[600px] opacity-0 translate-y-12 bg-gradient-to-b from-[#161616cc] to-[#0c0c0ce6] backdrop-blur-[12px] border-t border-t-white/10 border-x border-x-white/5 border-b border-b-black/50" style="box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.05);">
            
            <header class="h-14 border-b border-[#262626] flex items-center justify-between px-4 bg-[#111111]">
                <div class="flex items-center gap-2">
                    <button class="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-white font-light bg-gradient-to-b from-[#262626] to-[#161616] border-t border-t-[#3a3a3a] border-b border-b-black border-x border-x-[#222] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_2px_rgba(0,0,0,0.5)] transition-all duration-100 active:bg-[#111] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] active:border-t-[#111] font-geist">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 0H16V8H8L16 16H0V0Z" fill="currentColor"></path>
                        </svg>
                        Environment
                        <iconify-icon icon="solar:alt-arrow-down-linear" width="14" height="14" stroke-width="1.5" class="text-[#A3A3A3]"></iconify-icon>
                    </button>
                    <div class="w-[1px] h-4 bg-[#262626] mx-2"></div>
                    <div class="flex items-center gap-1">
                        <button class="w-8 h-8 flex items-center justify-center text-[#A3A3A3] hover:text-white hover:bg-[#161616] rounded-md transition-colors"><iconify-icon icon="solar:add-circle-linear" width="20" height="20" stroke-width="1.5"></iconify-icon></button>
                        <button class="w-8 h-8 flex items-center justify-center text-[#A3A3A3] hover:text-white hover:bg-[#161616] rounded-md transition-colors"><iconify-icon icon="solar:maximize-square-linear" width="20" height="20" stroke-width="1.5"></iconify-icon></button>
                        <button class="w-8 h-8 flex items-center justify-center text-[#A3A3A3] hover:text-white hover:bg-[#161616] rounded-md transition-colors"><iconify-icon icon="solar:text-square-linear" width="20" height="20" stroke-width="1.5"></iconify-icon></button>
                        <button class="w-8 h-8 flex items-center justify-center text-[#A3A3A3] hover:text-white hover:bg-[#161616] rounded-md transition-colors"><iconify-icon icon="solar:pen-linear" width="20" height="20" stroke-width="1.5"></iconify-icon></button>
                    </div>
                </div>

                <div class="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-sm text-[#A3A3A3] font-light">
                    <span class="text-white font-geist">Draft</span>
                    <span class="font-geist">\xB7</span>
                    <span class="flex items-center gap-1 bg-[#222] px-2 py-0.5 rounded text-xs font-geist"><iconify-icon icon="solar:link-linear" width="12" height="12" stroke-width="1.5"></iconify-icon> main</span>
                </div>

                <div class="flex items-center gap-3">
                    <div class="flex items-center -space-x-2 mr-2">
                        <img src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/2f563338-39fa-47ea-9761-658d4f3f84db_1600w.jpg" alt="User" class="w-7 h-7 rounded-full border border-[#111] object-cover">
                        <img src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/4f5668c5-fc4a-44e0-bc5e-a664189d3c31_1600w.jpg" alt="User" class="w-7 h-7 rounded-full border border-[#111] object-cover">
                        <div class="w-7 h-7 rounded-full border border-[#111] bg-[#222] flex items-center justify-center text-xs text-[#A3A3A3] z-10 font-light font-geist">+12</div>
                    </div>
                    <button class="w-8 h-8 flex items-center justify-center text-[#A3A3A3] bg-[#222] rounded-md hover:text-white transition-colors shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)]"><iconify-icon icon="solar:play-linear" width="16" height="16" stroke-width="1.5"></iconify-icon></button>
                    <button class="px-3 py-1.5 rounded-md text-sm text-white font-light bg-gradient-to-b from-[#262626] to-[#161616] border-t border-t-[#3a3a3a] border-b border-b-black border-x border-x-[#222] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_2px_rgba(0,0,0,0.5)] transition-all duration-100 active:bg-[#111] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] active:border-t-[#111] font-geist">Export</button>
                    <button class="px-4 py-1.5 rounded-md bg-[#2640D9] hover:bg-[#3B54E6] text-sm text-white font-normal shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.2),0px_1px_0px_0px_rgba(25,28,33,0.04),0px_0px_0px_1px_rgba(25,28,33,0.12)] transition-colors font-geist">Publish</button>
                </div>
            </header>

            <div class="flex-grow flex bg-[#0A0A0A]">
                <aside class="w-64 border-r border-[#262626] flex flex-col bg-[#111111]">
                    <div class="flex items-center p-2 border-b border-[#262626] text-xs font-light">
                        <button class="px-3 py-1.5 bg-[#222] text-white rounded shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] font-geist">Pages</button>
                        <button class="px-3 py-1.5 text-[#A3A3A3] hover:text-white font-geist">Layers</button>
                        <button class="px-3 py-1.5 text-[#A3A3A3] hover:text-white font-geist">Assets</button>
                    </div>
                    <div class="p-3">
                        <div class="relative bg-[#0a0a0a] shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),inset_0_0_0_1px_#222] rounded-md flex items-center px-3 py-1.5 mb-4">
                            <iconify-icon icon="solar:magnifer-linear" width="14" height="14" stroke-width="1.5" class="text-[#A3A3A3] absolute"></iconify-icon>
                            <input type="text" placeholder="Search..." class="bg-transparent w-full pl-6 text-sm text-white placeholder:text-[#A3A3A3] outline-none font-light">
                        </div>
                        
                        <div class="flex items-center justify-between text-xs font-normal text-white mb-2 px-1 font-geist">
                            Pages
                            <button class="text-[#A3A3A3] hover:text-white"><iconify-icon icon="solar:add-square-linear" width="14" height="14" stroke-width="1.5"></iconify-icon></button>
                        </div>
                        
                        <div class="space-y-0.5">
                            <div class="flex items-center gap-2 px-2 py-1.5 bg-[#222] rounded-md text-sm text-white cursor-pointer shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] font-light font-geist">
                                <iconify-icon icon="solar:home-2-linear" width="16" height="16" stroke-width="1.5" class="text-[#A3A3A3]"></iconify-icon>
                                Home
                            </div>
                            <div class="flex items-center gap-2 px-2 py-1.5 text-sm text-[#A3A3A3] hover:text-white cursor-pointer font-light font-geist">
                                <iconify-icon icon="solar:alt-arrow-down-linear" width="12" height="12" stroke-width="1.5"></iconify-icon>
                                <iconify-icon icon="solar:document-linear" width="16" height="16" stroke-width="1.5"></iconify-icon>
                                /components
                            </div>
                            <div class="flex items-center gap-2 px-2 py-1.5 pl-8 text-sm text-[#A3A3A3] hover:text-white cursor-pointer font-light font-geist">
                                <iconify-icon icon="solar:database-linear" width="16" height="16" stroke-width="1.5"></iconify-icon>
                                Active Projects
                            </div>
                        </div>
                    </div>
                </aside>

                <div class="flex-grow flex flex-col items-center p-8 overflow-hidden relative">
                    <div class="w-full max-w-4xl flex items-center justify-between bg-[#161616] border border-[#262626] rounded-t-lg px-4 py-2 border-b-0 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06)] bg-gradient-to-b from-[#262626] to-[#161616] border-t-[#3a3a3a] border-x-[#222]">
                        <div class="flex items-center gap-2 text-xs text-[#A3A3A3] font-light">
                            <iconify-icon icon="solar:monitor-linear" width="14" height="14" stroke-width="1.5"></iconify-icon>
                            <span class="text-white font-geist">Desktop</span>
                            <span class="font-geist">1440</span>
                        </div>
                        <button class="w-6 h-6 flex items-center justify-center text-[#A3A3A3] hover:text-white bg-[#222] rounded shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]"><iconify-icon icon="solar:add-linear" width="14" height="14" stroke-width="1.5"></iconify-icon></button>
                    </div>

                    <div class="w-full max-w-4xl flex-grow border border-t-0 border-[#262626] bg-black relative overflow-hidden flex flex-col">
                        <div class="flex items-center justify-between p-6">
                            <div class="text-white font-normal text-sm tracking-tight font-geist">Aura\u2122</div>
                            <div class="flex gap-6 text-xs text-[#A3A3A3] font-light">
                                <span class="hover:text-white cursor-pointer font-geist">Product</span>
                                <span class="hover:text-white cursor-pointer font-geist">Services</span>
                                <span class="hover:text-white cursor-pointer font-geist">About</span>
                                <span class="hover:text-white cursor-pointer font-geist">Help</span>
                            </div>
                            <div class="text-xs text-white border-b border-white pb-0.5 cursor-pointer font-light font-geist">Contact</div>
                        </div>

                        <div class="flex-grow flex items-center justify-center relative">
                            <h2 class="text-[12vw] leading-none text-white absolute bottom-0 translate-y-1/4 font-geist font-light tracking-tighter">AURA</h2>
                        </div>
                    </div>
                </div>

                <aside class="w-80 border-l border-[#262626] flex flex-col bg-[#111111]">
                    <div class="flex items-center p-2 border-b border-[#262626] text-xs font-light">
                        <button class="px-3 py-1.5 bg-[#222] text-white rounded shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] font-geist">Copilot</button>
                        <button class="px-3 py-1.5 text-[#A3A3A3] hover:text-white font-geist">Properties</button>
                    </div>
                    
                    <div class="p-4 space-y-4">
                        <div class="flex items-center gap-2">
                            <div class="flex-grow flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm text-white shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06)] bg-gradient-to-b from-[#262626] to-[#161616] border-t border-t-[#3a3a3a] border-b border-b-black border-x border-x-[#222] font-light font-geist">
                                Add Navigation Bar
                                <iconify-icon icon="solar:alt-arrow-down-linear" width="14" height="14" stroke-width="1.5" class="text-[#A3A3A3]"></iconify-icon>
                            </div>
                            <button class="w-9 h-9 flex items-center justify-center rounded-md text-[#A3A3A3] hover:text-white shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06)] bg-gradient-to-b from-[#262626] to-[#161616] border-t border-t-[#3a3a3a] border-b border-b-black border-x border-x-[#222]"><iconify-icon icon="solar:add-linear" width="16" height="16" stroke-width="1.5"></iconify-icon></button>
                        </div>

                        <div class="bg-[#1A1A1A] rounded-xl border border-[#262626] p-4 flex flex-col gap-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_2.8px_2.2px_rgba(0,_0,_0,_0.034),_0_6.7px_5.3px_rgba(0,_0,_0,_0.048)]">
                            <p class="text-sm text-[#EDEDED] leading-relaxed font-light font-geist">
                                Generate an animated hero section and craft a short tagline for Aura.
                            </p>
                            
                            <div class="flex items-center justify-between mt-2">
                                <div class="flex items-center gap-2">
                                    <div class="w-10 h-10 rounded bg-[#222] border border-[#262626] overflow-hidden">
                                        <img src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/4734259a-bad7-422f-981e-ce01e79184f2_1600w.jpg" class="w-full h-full object-cover opacity-80 mix-blend-luminosity hover:mix-blend-normal transition-all" alt="thumb">
                                    </div>
                                    <div class="w-10 h-10 rounded bg-[#222] border border-[#262626] overflow-hidden">
                                        <img src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/e534354d-c5f2-4399-a1d9-2f50338e8c47_1600w.jpg" class="w-full h-full object-cover opacity-80 mix-blend-luminosity hover:mix-blend-normal transition-all" alt="thumb">
                                    </div>
                                    <div class="w-10 h-10 rounded bg-[#222] border border-[#262626] overflow-hidden">
                                        <img src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/d14dc069-558a-4c51-8aad-5cc237f9b61d_1600w.jpg" class="w-full h-full object-cover opacity-80 mix-blend-luminosity hover:mix-blend-normal transition-all" alt="thumb">
                                    </div>
                                </div>
                                <button class="w-7 h-7 flex items-center justify-center rounded-full bg-[#2A2A2A] text-[#A3A3A3] hover:text-white transition-colors">
                                    <iconify-icon icon="solar:reply-outline" width="14" height="14" stroke-width="1.5"></iconify-icon>
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    </main>

    <script>
        // GSAP Animations with ScrollTrigger for masked reveal
        document.addEventListener("DOMContentLoaded", () => {
            gsap.registerPlugin(ScrollTrigger);

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: '#hero-title',
                    start: 'top 85%'
                }
            });

            tl.to('.reveal-text', {
                y: '0%',
                duration: 1,
                ease: 'power4.out',
                stagger: 0.05
            });

            tl.to('#hero-subtitle', {
                opacity: 1,
                duration: 0.8,
                ease: 'power2.out'
            }, "-=0.6");

            tl.fromTo('#prompt-container', 
                { opacity: 0, scale: 0.95, y: 20 },
                { opacity: 1, scale: 1, y: 0, duration: 1, ease: 'back.out(1.2)' },
                "-=0.4"
            );

            tl.to('#suggestion-pills', {
                opacity: 1,
                duration: 0.5
            }, "-=0.2");
            
            tl.fromTo('#suggestion-pills button',
                { opacity: 0, y: 10 },
                { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: 'power2.out' },
                "-=0.5"
            );

            tl.to('#explore-link', {
                opacity: 1,
                duration: 0.5
            }, "-=0.2");

            gsap.to('#mock-app', {
                scrollTrigger: {
                    trigger: '#mock-app',
                    start: 'top 85%',
                    end: 'top 50%',
                    scrub: 1,
                },
                opacity: 1,
                y: 0,
                duration: 1,
                ease: 'power3.out'
            });
        });

        // WebGL Dynamic Fluid Fragment Shader Background
        const canvas = document.querySelector('#bg-canvas');
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);

        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const scene = new THREE.Scene();

        const geometry = new THREE.PlaneGeometry(2, 2);

        const vertexShader = \`
            void main() {
                gl_Position = vec4(position, 1.0);
            }
        \`;

        const fragmentShader = \`
            uniform float u_time;
            uniform vec2 u_resolution;

            // Compact 2D Simplex Noise
            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
            
            float snoise(vec2 v) {
                const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                vec2 i  = floor(v + dot(v, C.yy));
                vec2 x0 = v -   i + dot(i, C.xx);
                vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                vec4 x12 = x0.xyxy + C.xxzz;
                x12.xy -= i1;
                i = mod289(i);
                vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
                vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                m = m*m;
                m = m*m;
                vec3 x = 2.0 * fract(p * C.www) - 1.0;
                vec3 h = abs(x) - 0.5;
                vec3 ox = floor(x + 0.5);
                vec3 a0 = x - ox;
                m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
                vec3 g;
                g.x  = a0.x  * x0.x  + h.x  * x0.y;
                g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                return 130.0 * dot(m, g);
            }

            void main() {
                vec2 uv = gl_FragCoord.xy / u_resolution.xy;
                uv.x *= u_resolution.x / u_resolution.y;

                vec3 baseColor = vec3(0.012, 0.012, 0.02);
                vec2 st = uv * 0.7;
                st += vec2(snoise(st + u_time * 0.05), snoise(st - u_time * 0.05)) * 0.3;

                float beam = smoothstep(0.1, 0.8, snoise(vec2(st.x + st.y * 1.5 - u_time * 0.15, u_time * 0.02)));
                vec3 glow = mix(vec3(0.15, 0.25, 0.85), vec3(0.4, 0.2, 0.9), snoise(uv * 1.5 + u_time * 0.1) * 0.5 + 0.5);

                gl_FragColor = vec4(baseColor + (glow * beam * 0.7), 1.0);
            }
        \`;

        const uniforms = {
            u_time: { value: 0.0 },
            u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
        };

        const material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: uniforms
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        const clock = new THREE.Clock();
        function animate() {
            uniforms.u_time.value = clock.getElapsedTime();
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        }
        animate();

        window.addEventListener('resize', () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
        });
    <\/script>

</body></html>`;var Fu=`<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Glassblown neon</title>
  <style>
    html, body {
      margin: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: transparent;
    }
    #board {
      position: relative;
      width: min(100%, 1040px);
      aspect-ratio: 16 / 9;
      margin: 0 auto;
      background: transparent;
      border: 0;
      box-shadow: none;
    }
    #neon {
      display: block;
      width: 100%;
      height: 100%;
    }
    h1 {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  </style>
</head>
<body>
  <div id="board">
    <canvas id="neon" aria-hidden="true"></canvas>
    <h1>Glass blown</h1>
  </div>

  <script>
    (function () {
      'use strict';

      var board = document.getElementById('board');
      var cv = document.getElementById('neon');
      if (!board || !cv || !cv.getContext) return;
      var ctx = cv.getContext('2d');
      if (!ctx) return;

      var reduce = false;
      try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

      var P = Math.PI;
      var GLYPHS = {
        G: { w: 0.88, sub: [
          { c: [['M', 0.7946, 0.2320], ['E', 0.44, 0.50, 0.42, 0.50, -0.18 * P, -1.87 * P, 1], ['Q', 0.902, 0.606, 0.860, 0.492], ['L', 0.470, 0.492]] }
        ]},
        L: { w: 0.60, sub: [
          { c: [['M', 0.09, 0.00], ['L', 0.09, 0.66], ['R', 0.09, 1.00, 0.60, 1.00, 0.20], ['L', 0.575, 1.00]] }
        ]},
        A: { w: 0.90, sub: [
          { c: [['M', 0.040, 1.00], ['R', 0.450, 0.00, 0.860, 1.00, 0.105], ['L', 0.860, 1.00]] },
          { c: [['M', 0.174, 0.665], ['L', 0.726, 0.665]] }
        ]},
        S: { w: 0.74, sub: [
          { c: [['M', 0.5880, 0.0478], ['E', 0.40, 0.25, 0.32, 0.25, -0.30 * P, 0.50 * P, 1], ['E', 0.40, 0.75, 0.32, 0.25, -0.50 * P, 0.86 * P, 0]] }
        ]},
        B: { w: 0.74, sub: [
          { c: [['M', 0.09, 0.00], ['L', 0.09, 1.00]] },
          { c: [['M', 0.09, 0.00], ['L', 0.28, 0.00], ['E', 0.28, 0.25, 0.34, 0.25, -0.50 * P, 0.50 * P, 0], ['L', 0.09, 0.50]] },
          { c: [['M', 0.09, 0.50], ['L', 0.30, 0.50], ['E', 0.30, 0.75, 0.38, 0.25, -0.50 * P, 0.50 * P, 0], ['L', 0.09, 1.00]] }
        ]},
        O: { w: 0.90, sub: [
          { closed: 1, c: [['M', 0.46, 0.00], ['E', 0.46, 0.50, 0.42, 0.50, -0.50 * P, 1.50 * P, 0]] }
        ]},
        W: { w: 1.09, sub: [
          { c: [['M', 0.030, 0.00], ['R', 0.240, 1.00, 0.545, 0.30, 0.070], ['R', 0.545, 0.30, 0.850, 1.00, 0.070], ['R', 0.850, 1.00, 1.060, 0.00, 0.070], ['L', 1.060, 0.00]] }
        ]},
        N: { w: 0.88, sub: [
          { c: [['M', 0.08, 1.00], ['R', 0.08, 0.00, 0.84, 1.00, 0.075], ['R', 0.84, 1.00, 0.84, 0.00, 0.075], ['L', 0.84, 0.00]] }
        ]}
      };

      var LINES = ['GLASS', 'BLOWN'];
      var MINGAP = 0.17, LINEGAP = 0.46;
      var FLICK = { line: 1, i: 3 };
      var ELECTRODES = [
        { line: 0, i: 0, p: [0.7946, 0.2320], a: -0.95 },
        { line: 0, i: 4, p: [0.1100, 0.8560], a: 2.45 },
        { line: 1, i: 0, p: [0.0900, 1.0000], a: 2.60 },
        { line: 1, i: 4, p: [0.8400, 0.0000], a: -1.45 }
      ];

      function mk(w, h) {
        var c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(w));
        c.height = Math.max(1, Math.round(h));
        return c;
      }
      function emit(x, sp, ox, oy, s) {
        var cs = sp.c;
        for (var i = 0; i < cs.length; i++) {
          var c = cs[i], k = c[0];
          if (k === 'M') x.moveTo(ox + c[1] * s, oy + c[2] * s);
          else if (k === 'L') x.lineTo(ox + c[1] * s, oy + c[2] * s);
          else if (k === 'Q') x.quadraticCurveTo(ox + c[1] * s, oy + c[2] * s, ox + c[3] * s, oy + c[4] * s);
          else if (k === 'R') x.arcTo(ox + c[1] * s, oy + c[2] * s, ox + c[3] * s, oy + c[4] * s, c[5] * s);
          else if (k === 'E') x.ellipse(ox + c[1] * s, oy + c[2] * s, c[3] * s, c[4] * s, 0, c[5], c[6], !!c[7]);
        }
      }
      function trace(x, items) {
        x.beginPath();
        for (var i = 0; i < items.length; i++) {
          var it = items[i], sub = it.g.sub;
          for (var j = 0; j < sub.length; j++) emit(x, sub[j], it.ox, it.oy, it.s);
        }
      }
      function endsOf(sp) {
        if (sp.closed) return [];
        var a = sp.c[0], last = sp.c[sp.c.length - 1], b = null;
        if (last[0] === 'L' || last[0] === 'M') b = [last[1], last[2]];
        else if (last[0] === 'Q') b = [last[3], last[4]];
        else if (last[0] === 'E') b = [last[1] + last[3] * Math.cos(last[6]), last[2] + last[4] * Math.sin(last[6])];
        var out = [[a[1], a[2]]];
        if (b) out.push(b);
        return out;
      }
      function scaleItems(items, k) {
        return items.map(function (it) { return { g: it.g, ox: it.ox * k, oy: it.oy * k, s: it.s * k }; });
      }

      function strokePass(x, items, w, blur, col, alpha, additive) {
        x.save();
        x.lineCap = 'round'; x.lineJoin = 'round';
        if (blur > 0.25) { try { x.filter = 'blur(' + blur.toFixed(2) + 'px)'; } catch (e) {} }
        if (additive !== false) x.globalCompositeOperation = 'lighter';
        x.globalAlpha = (alpha == null) ? 1 : alpha;
        x.lineWidth = w; x.strokeStyle = col;
        trace(x, items); x.stroke();
        x.restore();
      }

      var SPILL_S = 0.34, BLOOM_S = 0.5;

      function buildSpill(items, cap, W, H) {
        var c = mk(W * SPILL_S, H * SPILL_S), x = c.getContext('2d');
        var it = scaleItems(items, SPILL_S), k = cap * SPILL_S;
        strokePass(x, it, k * 0.62, k * 0.30, 'rgba(255,22,118,1)', 0.115);
        strokePass(x, it, k * 0.42, k * 0.11, 'rgba(255,40,140,1)', 0.20);
        return c;
      }
      function buildBloom(items, tube, W, H) {
        var c = mk(W * BLOOM_S, H * BLOOM_S), x = c.getContext('2d');
        var it = scaleItems(items, BLOOM_S), t = tube * BLOOM_S;
        strokePass(x, it, t * 2.60, t * 1.75, 'rgba(255,40,146,1)', 0.30);
        strokePass(x, it, t * 1.34, t * 0.58, 'rgba(255,100,188,1)', 0.48);
        return c;
      }
      function paintCore(x, items, tube) {
        strokePass(x, items, tube * 0.88, tube * 0.10, '#ff2a96', 1);
        strokePass(x, items, tube * 0.54, tube * 0.06, '#ff8ed2', 1);
        strokePass(x, items, tube * 0.24, tube * 0.035, '#fff4fb', 1);
      }
      function buildSpec(items, tube, W, H) {
        var c = mk(W, H), x = c.getContext('2d');
        x.save();
        x.translate(-tube * 0.02, -tube * 0.25);
        x.lineCap = 'round'; x.lineJoin = 'round';
        x.lineWidth = tube * 0.17; x.strokeStyle = 'rgba(255,240,250,.52)';
        try { x.filter = 'blur(' + (tube * 0.11).toFixed(2) + 'px)'; } catch (e) {}
        trace(x, items); x.stroke();
        x.restore();
        x.globalCompositeOperation = 'destination-in';
        x.lineCap = 'round'; x.lineJoin = 'round';
        x.lineWidth = tube * 0.66; x.strokeStyle = '#fff';
        trace(x, items); x.stroke();
        return c;
      }

      function tips(x, items, tube) {
        x.save();
        x.globalCompositeOperation = 'source-over';
        for (var i = 0; i < items.length; i++) {
          var it = items[i], sub = it.g.sub;
          for (var j = 0; j < sub.length; j++) {
            var e = endsOf(sub[j]);
            for (var m = 0; m < e.length; m++) {
              var px = it.ox + e[m][0] * it.s, py = it.oy + e[m][1] * it.s;
              x.beginPath(); x.arc(px, py, tube * 0.47, 0, P * 2);
              x.fillStyle = '#33101f'; x.fill();
              x.beginPath(); x.arc(px, py, tube * 0.47, 0, P * 2);
              x.lineWidth = 1; x.strokeStyle = 'rgba(255,150,205,.20)'; x.stroke();
              x.beginPath(); x.arc(px - tube * 0.06, py - tube * 0.10, tube * 0.20, 0, P * 2);
              x.fillStyle = 'rgba(255,205,235,.14)'; x.fill();
            }
          }
        }
        x.restore();
      }

      function electrodes(x, list, tube) {
        x.save();
        for (var i = 0; i < list.length; i++) {
          var e = list[i], cx = e.x, cy = e.y, a = e.a;
          var sx = cx + Math.cos(a) * tube * 1.55, sy = cy + Math.sin(a) * tube * 1.55;
          x.beginPath(); x.moveTo(cx, cy); x.lineTo(sx, sy);
          x.lineCap = 'round'; x.lineWidth = tube * 0.46; x.strokeStyle = '#120a10'; x.stroke();
          x.beginPath(); x.arc(sx, sy, tube * 0.40, 0, P * 2);
          x.fillStyle = '#0b0509'; x.fill();
          x.beginPath(); x.arc(cx, cy, tube * 0.80, 0, P * 2);
          x.fillStyle = '#180a12'; x.fill();
          x.beginPath(); x.arc(cx, cy, tube * 0.80, 0, P * 2);
          x.lineWidth = 1.4; x.strokeStyle = 'rgba(214,120,164,.30)'; x.stroke();
          var g = x.createRadialGradient(cx, cy, 0, cx, cy, tube * 1.25);
          g.addColorStop(0, 'rgba(255,226,244,.95)');
          g.addColorStop(0.24, 'rgba(255,90,180,.62)');
          g.addColorStop(1, 'rgba(255,50,150,0)');
          x.globalCompositeOperation = 'lighter';
          x.beginPath(); x.arc(cx, cy, tube * 1.25, 0, P * 2);
          x.fillStyle = g; x.fill();
          x.globalCompositeOperation = 'source-over';
        }
        x.restore();
      }

      var W = 0, H = 0, cap = 0, tube = 0;
      var BASE = null, WLIT = null, dirty = { x: 0, y: 0, w: 0, h: 0 };

      function layout() {
        var lines = [], maxW = 0, i, j;
        for (i = 0; i < LINES.length; i++) {
          var s = LINES[i], sum = 0, gl = [];
          for (j = 0; j < s.length; j++) { var g = GLYPHS[s[j]]; gl.push(g); sum += g.w; }
          lines.push({ gl: gl, sum: sum });
          maxW = Math.max(maxW, sum + (gl.length - 1) * MINGAP);
        }
        var blockW = maxW, blockH = 2 + LINEGAP;
        cap = Math.min((W - W * 0.12) / blockW, (H - H * 0.18) / blockH);
        cap = Math.max(10, cap);
        tube = cap * 0.105;
        var x0 = (W - blockW * cap) / 2;
        var y0 = (H - blockH * cap) * 0.48;

        var items = [], flick = null, elec = [];
        for (i = 0; i < lines.length; i++) {
          var L = lines[i];
          var gap = (blockW - L.sum) / (L.gl.length - 1);
          var pen = x0, top = y0 + i * (1 + LINEGAP) * cap;
          for (j = 0; j < L.gl.length; j++) {
            var it = { g: L.gl[j], ox: pen, oy: top, s: cap, line: i, i: j };
            items.push(it);
            if (i === FLICK.line && j === FLICK.i) flick = it;
            for (var e = 0; e < ELECTRODES.length; e++) {
              var E = ELECTRODES[e];
              if (E.line === i && E.i === j) elec.push({ x: pen + E.p[0] * cap, y: top + E.p[1] * cap, a: E.a });
            }
            pen += L.gl[j].w * cap + gap;
          }
        }
        return { items: items, flick: flick, elec: elec };
      }

      function bake() {
        var L = layout();
        var items = L.items, flick = L.flick;
        var steady = items.filter(function (it) { return it !== flick; });
        var one = flick ? [flick] : [];

        var base = mk(W, H), b = base.getContext('2d');
        b.clearRect(0, 0, W, H);
        b.globalCompositeOperation = 'lighter';
        b.drawImage(buildSpill(steady, cap, W, H), 0, 0, W, H);
        b.drawImage(buildBloom(steady, tube, W, H), 0, 0, W, H);
        b.globalCompositeOperation = 'source-over';

        var tl = mk(W, H), t = tl.getContext('2d');
        strokePass(t, items, tube, 0, '#3d162a', 1, false);
        strokePass(t, items, tube * 0.70, 0, '#280c1a', 1, false);
        paintCore(t, steady, tube);
        t.globalCompositeOperation = 'lighter';
        t.drawImage(buildSpec(items, tube, W, H), 0, 0);
        t.globalCompositeOperation = 'source-over';
        tips(t, items, tube);
        electrodes(t, L.elec, tube);
        b.drawImage(tl, 0, 0);
        BASE = base;

        var lit = mk(W, H), w = lit.getContext('2d');
        if (one.length) {
          w.globalCompositeOperation = 'lighter';
          w.drawImage(buildSpill(one, cap, W, H), 0, 0, W, H);
          w.drawImage(buildBloom(one, tube, W, H), 0, 0, W, H);
          w.globalCompositeOperation = 'source-over';
          paintCore(w, one, tube);
          w.globalCompositeOperation = 'destination-out';
          var sub = one[0].g.sub;
          for (var j = 0; j < sub.length; j++) {
            var e = endsOf(sub[j]);
            for (var m = 0; m < e.length; m++) {
              w.beginPath();
              w.arc(one[0].ox + e[m][0] * one[0].s, one[0].oy + e[m][1] * one[0].s, tube * 0.47, 0, P * 2);
              w.fill();
            }
          }
          w.globalCompositeOperation = 'source-over';
          var pad = cap * 1.35;
          var bx = one[0].ox - pad, by = one[0].oy - pad;
          var bw2 = one[0].g.w * cap + pad * 2, bh2 = cap + pad * 2;
          dirty.x = Math.max(0, Math.floor(bx));
          dirty.y = Math.max(0, Math.floor(by));
          dirty.w = Math.min(W - dirty.x, Math.ceil(bw2));
          dirty.h = Math.min(H - dirty.y, Math.ceil(bh2));
        } else {
          dirty = { x: 0, y: 0, w: 0, h: 0 };
        }
        WLIT = lit;
      }

      function compose(f) {
        if (!BASE) return;
        if (dirty.w > 0 && composed) {
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1;
          ctx.clearRect(dirty.x, dirty.y, dirty.w, dirty.h);
          ctx.drawImage(BASE, dirty.x, dirty.y, dirty.w, dirty.h, dirty.x, dirty.y, dirty.w, dirty.h);
          if (f > 0.002) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = f;
            ctx.drawImage(WLIT, dirty.x, dirty.y, dirty.w, dirty.h, dirty.x, dirty.y, dirty.w, dirty.h);
          }
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1;
          ctx.clearRect(0, 0, W, H);
          ctx.drawImage(BASE, 0, 0);
          if (f > 0.002 && WLIT) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = f;
            ctx.drawImage(WLIT, 0, 0);
          }
          composed = true;
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        lastF = f;
      }
      var composed = false, lastF = -1;

      var fseed = 0x1981;
      function frnd() { fseed = (fseed * 1103515245 + 12345) >>> 0; return fseed / 4294967296; }
      var ev = null, clock = 0;

      function nextEvent(after) {
        var segs = [], n = 1 + (frnd() < 0.42 ? 1 : 0);
        for (var i = 0; i < n; i++) {
          segs.push({ d: 0.20 + frnd() * 0.26, v: 0.22 + frnd() * 0.40 });
          segs.push({ d: 0.24 + frnd() * 0.34, v: 1 });
        }
        var total = 0;
        for (var j = 0; j < segs.length; j++) total += segs[j].d;
        return { t0: after + 5.6 + frnd() * 7.2, dur: total, segs: segs };
      }
      function level(t) {
        if (!ev) ev = nextEvent(4.2);
        while (t > ev.t0 + ev.dur) ev = nextEvent(ev.t0 + ev.dur);
        if (t < ev.t0) return 1;
        var u = t - ev.t0, prev = 1;
        for (var i = 0; i < ev.segs.length; i++) {
          var s = ev.segs[i];
          if (u < s.d) {
            var p = u / s.d;
            p = p * p * (3 - 2 * p);
            return prev + (s.v - prev) * p;
          }
          u -= s.d; prev = s.v;
        }
        return 1;
      }

      function resize() {
        var w = Math.round(board.clientWidth), h = Math.round(board.clientHeight);
        if (!w || !h) return false;
        if (w === W && h === H) return false;
        W = w; H = h;
        cv.width = W; cv.height = H;
        bake();
        composed = false;
        compose(reduce ? 1 : level(clock));
        return true;
      }

      var raf = 0, last = 0, visible = true, shown = true;
      function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
      function tick(now) {
        raf = requestAnimationFrame(tick);
        var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
        last = now;
        clock += dt;
        var f = level(clock);
        if (Math.abs(f - lastF) > 0.008) compose(f);
      }
      function start() {
        if (reduce || raf || !visible || !shown) return;
        last = 0;
        raf = requestAnimationFrame(tick);
      }

      if (!resize()) {
        requestAnimationFrame(function () { resize(); });
      }

      var rt = 0;
      window.addEventListener('resize', function () {
        clearTimeout(rt);
        rt = setTimeout(function () { if (resize()) {} }, 180);
      });

      document.addEventListener('visibilitychange', function () {
        shown = !document.hidden;
        if (shown) start(); else stop();
      });

      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (es) {
          visible = es[0].isIntersecting;
          if (visible) start(); else stop();
        }, { threshold: 0.01 });
        io.observe(board);
      } else {
        start();
      }
      if (!reduce) start();
    })();
  <\/script>
</body>
</html>
`;var Hu=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Julian Vance \u2014 Digital Craftsman</title>
<script src="https://cdn.tailwindcss.com"><\/script>
<script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"><\/script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\/script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"><\/script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"><\/script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Newsreader:ital,opsz,wght@1,6..72,300;1,6..72,400&display=swap" rel="stylesheet">
</head>
<body class="bg-[#09090b] text-white antialiased bg-fixed" style="font-family:'Inter',ui-sans-serif,system-ui,sans-serif;">

  <!-- WebGL Nebula Background -->
  <canvas id="bg-canvas" class="fixed inset-0 w-full h-full pointer-events-none" style="z-index:0;"></canvas>

  <!-- Grain overlay -->
  <div class="fixed inset-0 pointer-events-none" style="z-index:1; opacity:0.08; mix-blend-mode:overlay; background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22/%3E%3C/filter%3E%3Crect width=%22200%22 height=%22200%22 filter=%22url(%23n)%22/%3E%3C/svg%3E');"></div>

  <!-- Soft readability vignette -->
  <div class="fixed inset-0 pointer-events-none" style="z-index:1; background:radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(9,9,11,0.65) 100%);"></div>

  <!-- Page -->
  <main class="relative flex flex-col justify-between" style="z-index:10; min-height:140vh;">

    <!-- Header containing Nav, CTA, Tagline, and Subheading -->
    <header class="px-6 sm:px-12 pt-8 sm:pt-10 flex flex-col gap-10 sm:gap-14">
      
      <!-- Header Navigation & CTA -->
      <div class="flex items-center justify-between w-full">
        <nav aria-label="Primary navigation" class="flex items-center gap-5 sm:gap-8 text-xs sm:text-sm font-medium uppercase tracking-widest text-neutral-300">
          <span class="inline-flex overflow-hidden"><a href="#" class="header-word inline-block will-change-transform hover:text-indigo-400 transition-colors" style="transition-duration:150ms;">Work</a></span>
          <span class="inline-flex overflow-hidden"><a href="#" class="header-word inline-block will-change-transform hover:text-indigo-400 transition-colors" style="transition-duration:150ms;">Experiments</a></span>
          <span class="inline-flex overflow-hidden"><a href="#" class="header-word inline-block will-change-transform hover:text-indigo-400 transition-colors" style="transition-duration:150ms;">Journal</a></span>
        </nav>

        <div class="inline-flex overflow-hidden rounded-full p-[1px] bg-gradient-to-r from-indigo-500/40 via-purple-500/40 to-indigo-500/40 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] header-word will-change-transform">
          <a href="#" class="px-4 py-1.5 sm:px-5 sm:py-2 rounded-full bg-gradient-to-b from-[#2a2a2e] to-[#09090b] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-1px_1px_rgba(0,0,0,0.6)] text-xs sm:text-sm font-medium text-white hover:from-[#323236] hover:to-[#121216] transition-colors flex items-center gap-1.5 sm:gap-2 drop-shadow-sm">
            Start Project
            <iconify-icon icon="solar:arrow-right-up-linear" width="16" height="16" stroke-width="1.5"></iconify-icon>
          </a>
        </div>
      </div>

      <!-- Tagline & Subheading -->
      <div class="flex flex-col gap-3">
        <p id="tagline-container" class="text-xs sm:text-sm font-light text-neutral-200 leading-relaxed max-w-xs">
          <span class="inline-flex overflow-hidden pb-0.5 -mb-0.5"><span class="tagline-word inline-block will-change-transform">Creative</span></span>
          <span class="inline-flex overflow-hidden pb-0.5 -mb-0.5"><span class="tagline-word inline-block will-change-transform">developer,</span></span>
          <br>
          <em style="font-family:'Newsreader',serif;" class="italic">
            <span class="inline-flex overflow-hidden pb-0.5 -mb-0.5"><span class="tagline-word inline-block will-change-transform">crafting</span></span>
            <span class="inline-flex overflow-hidden pb-0.5 -mb-0.5"><span class="tagline-word inline-block will-change-transform">digital</span></span>
            <span class="inline-flex overflow-hidden pb-0.5 -mb-0.5"><span class="tagline-word inline-block will-change-transform">spaces</span></span>
            <span class="inline-flex overflow-hidden pb-0.5 -mb-0.5"><span class="tagline-word inline-block will-change-transform">with</span></span>
            <span class="inline-flex overflow-hidden pb-0.5 -mb-0.5"><span class="tagline-word inline-block will-change-transform">intent,</span></span>
          </em>
          <br>
          <span class="inline-flex overflow-hidden pb-0.5 -mb-0.5"><span class="tagline-word inline-block will-change-transform">merging</span></span>
          <span class="inline-flex overflow-hidden pb-0.5 -mb-0.5"><span class="tagline-word inline-block will-change-transform">form</span></span>
          <span class="inline-flex overflow-hidden pb-0.5 -mb-0.5"><span class="tagline-word inline-block will-change-transform">and</span></span>
          <span class="inline-flex overflow-hidden pb-0.5 -mb-0.5"><span class="tagline-word inline-block will-change-transform">function.</span></span>
        </p>

        <p id="subheading-container" class="text-xs sm:text-sm font-light text-neutral-400 leading-relaxed max-w-sm mt-2">
          <span class="inline-flex overflow-hidden pb-0.5 -mb-0.5"><span class="subheading-word inline-block will-change-transform">Specializing</span></span>
          <span class="inline-flex overflow-hidden pb-0.5 -mb-0.5"><span class="subheading-word inline-block will-change-transform">in</span></span>
          <span class="inline-flex overflow-hidden pb-0.5 -mb-0.5"><span class="subheading-word inline-block will-change-transform">kinetic</span></span>
          <span class="inline-flex overflow-hidden pb-0.5 -mb-0.5"><span class="subheading-word inline-block will-change-transform">interfaces</span></span>
          <span class="inline-flex overflow-hidden pb-0.5 -mb-0.5"><span class="subheading-word inline-block will-change-transform">and</span></span>
          <span class="inline-flex overflow-hidden pb-0.5 -mb-0.5"><span class="subheading-word inline-block will-change-transform">highly</span></span>
          <span class="inline-flex overflow-hidden pb-0.5 -mb-0.5"><span class="subheading-word inline-block will-change-transform">interactive</span></span>
          <span class="inline-flex overflow-hidden pb-0.5 -mb-0.5"><span class="subheading-word inline-block will-change-transform">web</span></span>
          <span class="inline-flex overflow-hidden pb-0.5 -mb-0.5"><span class="subheading-word inline-block will-change-transform">experiences.</span></span>
        </p>
      </div>
    </header>

    <!-- Giant name -->
    <section aria-label="Introduction" class="flex-1 flex items-end sm:items-center">
      <h1 class="w-full flex flex-col lg:flex-row lg:items-baseline lg:justify-between px-6 sm:px-12 gap-2 lg:gap-8 select-none tracking-tight">
        <span class="block overflow-hidden pb-2 lg:pb-6">
          <span id="name-first" class="block font-normal text-neutral-100 will-change-transform" style="font-size:clamp(4rem,16vw,15rem); line-height:0.95;">Julian</span>
        </span>
        <span class="block overflow-visible">
          <span class="block overflow-hidden pb-4 lg:pb-8 -mb-4 lg:-mb-8">
            <span id="name-last" class="block italic pr-2 will-change-transform" style="font-family:'Newsreader',serif; font-weight:300; font-size:clamp(4.25rem,17vw,16rem); line-height:0.95; background:linear-gradient(100deg,#818cf8 0%,#c084fc 45%,#e2e8f0 80%); -webkit-background-clip:text; background-clip:text; color:transparent;">Vance<span style="background:linear-gradient(100deg,#cbd5e1,#f1f5f9); -webkit-background-clip:text; background-clip:text; color:transparent;">.</span></span>
          </span>
        </span>
      </h1>
    </section>

    <!-- Bottom bar with Gradient Border -->
    <footer class="relative before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
      <div class="flex flex-col sm:flex-row items-center sm:items-center justify-between px-6 sm:px-12 py-5 sm:py-6 gap-4 sm:gap-0">

        <div class="flex items-center gap-2 text-xs sm:text-sm font-medium uppercase" style="letter-spacing:0.1em;">
          <span class="inline-flex overflow-hidden"><iconify-icon icon="solar:arrow-right-linear" width="16" height="16" aria-hidden="true" class="footer-word block will-change-transform"></iconify-icon></span>
          <span class="inline-flex overflow-hidden"><span class="footer-word inline-block will-change-transform">V8.0</span></span>
        </div>

        <nav aria-label="Social links" class="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium uppercase text-neutral-200" style="letter-spacing:0.1em;">
          <a href="#" class="hover:text-indigo-400 transition-colors inline-flex overflow-hidden" style="transition-duration:150ms;">
            <span class="footer-word inline-block will-change-transform">Github</span>
          </a>
          <span class="text-neutral-600 font-light inline-flex overflow-hidden">
            <span class="footer-word inline-block will-change-transform">/</span>
          </span>
          <a href="#" class="hover:text-indigo-400 transition-colors inline-flex overflow-hidden" style="transition-duration:150ms;">
            <span class="footer-word inline-block will-change-transform">Twitter</span>
          </a>
          <span class="text-neutral-600 font-light inline-flex overflow-hidden">
            <span class="footer-word inline-block will-change-transform">/</span>
          </span>
          <a href="#" class="hover:text-indigo-400 transition-colors inline-flex overflow-hidden" style="transition-duration:150ms;">
            <span class="footer-word inline-block will-change-transform">LinkedIn</span>
          </a>
        </nav>

        <nav aria-label="Secondary links" class="flex items-center gap-5 sm:gap-8 text-xs sm:text-sm font-medium uppercase" style="letter-spacing:0.1em;">
          <a href="#" class="hover:text-indigo-400 transition-colors inline-flex overflow-hidden" style="transition-duration:150ms;">
            <span class="footer-word inline-block will-change-transform">Home</span>
          </a>
          <a href="#" class="hover:text-indigo-400 transition-colors inline-flex overflow-hidden" style="transition-duration:150ms;">
            <span class="footer-word inline-block will-change-transform">Archive</span>
          </a>
          <a href="#" class="hover:text-indigo-400 transition-colors inline-flex overflow-hidden" style="transition-duration:150ms;">
            <span class="footer-word inline-block will-change-transform">Contact</span>
          </a>
        </nav>

      </div>
    </footer>
  </main>

  <script>
    // ---------- WebGL indigo nebula background ----------
    (function () {
      const canvas = document.getElementById('bg-canvas');
      const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      const uniforms = {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        u_mouse: { value: new THREE.Vector2(0.5, 0.5) }
      };

      const fragmentShader = \`
        precision highp float;
        uniform float u_time;
        uniform vec2 u_resolution;
        uniform vec2 u_mouse;

        vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
        vec2 mod289(vec2 x){return x - floor(x*(1.0/289.0))*289.0;}
        vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
        float snoise(vec2 v){
          const vec4 C = vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
          vec2 i = floor(v + dot(v, C.yy));
          vec2 x0 = v - i + dot(i, C.xx);
          vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m; m = m*m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
          vec3 g;
          g.x = a0.x * x0.x + h.x * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }
        float fbm(vec2 p){
          float v = 0.0; float a = 0.55;
          for(int i=0;i<4;i++){ v += a*snoise(p); p *= 2.05; a *= 0.5; }
          return v;
        }

        void main(){
          vec2 uv = gl_FragCoord.xy / u_resolution.xy;
          vec2 p = uv;
          p.x *= u_resolution.x / u_resolution.y;

          float t = u_time * 0.05;
          vec2 drift = (u_mouse - 0.5) * 0.12;

          // warp coordinates for fluid motion
          vec2 st = p * 0.85 + drift;
          st += vec2(fbm(st + t), fbm(st - t)) * 0.35;

          vec3 col = vec3(0.005, 0.005, 0.012); // deep zinc base

          // main indigo mass, weighted to the right / upper-right
          vec2 c1 = vec2(u_resolution.x / u_resolution.y * 0.62, 0.85) + drift;
          float d1 = length(p - c1);
          float n1 = fbm(st * 1.4 + t * 2.0);
          float mass = smoothstep(1.15, 0.05, d1 + n1 * 0.32);

          // vertical sweeping tongue of light
          float tongue = smoothstep(0.55, 0.02, abs(p.x - (u_resolution.x/u_resolution.y*0.58) - n1*0.22)) * smoothstep(1.2, 0.1, abs(uv.y - 0.55));

          // secondary far-right glow
          vec2 c2 = vec2(u_resolution.x / u_resolution.y * 1.05, 0.5);
          float d2 = length(p - c2);
          float mass2 = smoothstep(0.9, 0.0, d2 + fbm(st*1.1 - t)*0.25);

          vec3 deepIndigo = vec3(0.05, 0.02, 0.15);
          vec3 purple = vec3(0.2, 0.1, 0.6);
          vec3 hotViolet = vec3(0.5, 0.3, 1.0);

          col = mix(col, deepIndigo, clamp(mass*0.9 + mass2*0.7, 0.0, 1.0));
          col = mix(col, purple, clamp(mass*mass*1.1 + mass2*0.55, 0.0, 1.0));
          col += hotViolet * tongue * mass * 0.85;

          // breathing pulse
          float pulse = 0.92 + 0.08 * sin(u_time * 0.4);
          col *= pulse;

          // vignette
          float vig = smoothstep(1.6, 0.35, length(uv - vec2(0.45, 0.5)));
          col *= mix(0.55, 1.0, vig);

          // keep left side dark for the sans name
          col *= mix(0.35, 1.0, smoothstep(0.0, 0.55, uv.x));

          gl_FragColor = vec4(col, 1.0);
        }
      \`;

      const material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: 'void main(){ gl_Position = vec4(position, 1.0); }',
        fragmentShader: fragmentShader
      });

      scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

      const mouseTarget = { x: 0.5, y: 0.5 };
      window.addEventListener('pointermove', function (e) {
        mouseTarget.x = e.clientX / window.innerWidth;
        mouseTarget.y = 1.0 - e.clientY / window.innerHeight;
      });

      window.addEventListener('resize', function () {
        renderer.setSize(window.innerWidth, window.innerHeight);
        uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
      });

      const clock = new THREE.Clock();
      (function animate() {
        requestAnimationFrame(animate);
        uniforms.u_time.value = clock.getElapsedTime();
        uniforms.u_mouse.value.x += (mouseTarget.x - uniforms.u_mouse.value.x) * 0.03;
        uniforms.u_mouse.value.y += (mouseTarget.y - uniforms.u_mouse.value.y) * 0.03;
        renderer.render(scene, camera);
      })();
    })();

    // ---------- GSAP entrance choreography & ScrollTrigger ----------
    (function () {
      gsap.registerPlugin(ScrollTrigger);

      gsap.set('#name-first, #name-last', { yPercent: 110 });
      gsap.set('.header-word, .tagline-word, .subheading-word, .footer-word', { yPercent: 110 });

      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

      // Header Navigation and CTA reveal immediately on load, followed by the Name
      tl.to('.header-word', { yPercent: 0, duration: 1.0, stagger: 0.04 }, 0.1)
        .to('#name-first', { yPercent: 0, duration: 1.4 }, 0.2)
        .to('#name-last', { yPercent: 0, duration: 1.4 }, 0.38);

      // Masked staggered word reveal on scroll (Tagline)
      gsap.to('.tagline-word', {
        scrollTrigger: {
          trigger: '#tagline-container',
          start: 'top 95%'
        },
        yPercent: 0,
        duration: 1.0,
        stagger: 0.04,
        ease: 'power4.out'
      });

      // Masked staggered word reveal on scroll (Subheading)
      gsap.to('.subheading-word', {
        scrollTrigger: {
          trigger: '#subheading-container',
          start: 'top 95%'
        },
        yPercent: 0,
        duration: 1.0,
        stagger: 0.03,
        ease: 'power4.out'
      });

      // Masked staggered word reveal on scroll (Footer)
      gsap.to('.footer-word', {
        scrollTrigger: {
          trigger: 'footer',
          start: 'top 95%'
        },
        yPercent: 0,
        duration: 0.9,
        stagger: 0.03,
        ease: 'power4.out'
      });
    })();
  <\/script>
</body>
</html>`;var Wu=`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Kinetic Lathe</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --ground: #ded6c2;
      --ground2: #d3cab3;
      --sheet: #f5efdf;
      --sheet2: #efe7d3;
      --ink: #1f3a30;
      --ink-6: rgba(31, 58, 48, 0.62);
      --ink-4: rgba(31, 58, 48, 0.44);
      --rule: rgba(31, 58, 48, 0.22);
    }

    * { box-sizing: border-box; }

    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      overflow: hidden;
      background:
        radial-gradient(118% 92% at 50% 0%, #e6dfcd 0%, var(--ground) 52%, var(--ground2) 100%);
      color: var(--ink);
      font-family: "Cormorant Garamond", Didot, "Times New Roman", serif;
      -webkit-font-smoothing: antialiased;
    }

    main {
      width: 100%;
      height: 100%;
      display: grid;
      place-items: center;
      padding: clamp(12px, 3vmin, 28px);
    }

    #cert {
      position: relative;
      width: min(100%, 720px);
      aspect-ratio: 1.08 / 1;
      max-height: min(100%, 720px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: clamp(10px, 2.4vmin, 18px);
      padding: clamp(16px, 4vmin, 36px);
      border-radius: 3px;
      background:
        repeating-linear-gradient(0deg, rgba(31, 58, 48, 0.045) 0 0.5px, transparent 0.5px 6px),
        linear-gradient(168deg, #f8f3e6 0%, var(--sheet) 40%, var(--sheet2) 100%);
      box-shadow:
        0 0 0 1px rgba(31, 58, 48, 0.13),
        0 1px 0 rgba(255, 255, 255, 0.55) inset,
        0 30px 60px -34px rgba(22, 38, 28, 0.62),
        0 3px 8px rgba(22, 38, 28, 0.09);
    }

    #plate {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
      border-radius: inherit;
      pointer-events: none;
    }

    .face {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: clamp(10px, 2.2vmin, 16px);
      width: min(100%, 420px);
      text-align: center;
    }

    .mark {
      font-family: "IBM Plex Mono", ui-monospace, monospace;
      font-size: clamp(9px, 1.7vmin, 11px);
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: var(--ink-4);
    }

    h1 {
      margin: 0;
      font-size: clamp(22px, 4.8vmin, 34px);
      font-weight: 500;
      letter-spacing: 0.02em;
      line-height: 1;
    }

    h1 em {
      font-style: normal;
      color: var(--ink-6);
    }

    #medal {
      position: relative;
      width: min(58vmin, 280px);
      height: min(58vmin, 280px);
      border-radius: 50%;
      flex: none;
    }

    #rosette,
    #drift {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
      pointer-events: none;
    }

    .caption {
      font-family: "IBM Plex Mono", ui-monospace, monospace;
      font-size: clamp(9px, 1.7vmin, 11px);
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: var(--ink-4);
    }

    @media (max-width: 520px), (max-height: 560px) {
      #cert {
        aspect-ratio: auto;
        height: 100%;
        max-height: none;
      }

      #medal {
        width: min(62vmin, 240px);
        height: min(62vmin, 240px);
      }
    }
  </style>
</head>
<body>
  <main>
    <article id="cert" aria-label="Kinetic Lathe certificate">
      <canvas id="plate" aria-hidden="true"></canvas>
      <div class="face">
        <div class="mark">Kinetic Lathe</div>
        <figure id="medal">
          <canvas id="rosette" aria-hidden="true"></canvas>
          <canvas id="drift" aria-hidden="true"></canvas>
        </figure>
        <h1>Matrix 92 \xB7 Cam <em id="barName">C</em></h1>
        <div class="caption">Primary cam \xB7 <span id="capBar">C</span></div>
      </div>
    </article>
  </main>
<script>
(() => {
  "use strict";
  const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const TAU = Math.PI * 2;
  const INK = "rgba(31,58,48,";
  const ink = (a) => INK + a + ")";
  const SUB = "#f5efdf";

  const cert = document.getElementById("cert");
  const medal = document.getElementById("medal");
  const cPlate = document.getElementById("plate");
  const cRose = document.getElementById("rosette");
  const cDrift = document.getElementById("drift");
  const ctxP = cPlate.getContext("2d");
  const ctxR = cRose.getContext("2d");
  const ctxD = cDrift.getContext("2d");
  if (!ctxP || !ctxR || !ctxD) return;

  const BARS = [
    { id: "A", m: 7, m2: 13, m3: 9 },
    { id: "B", m: 9, m2: 15, m3: 12 },
    { id: "C", m: 11, m2: 19, m3: 14 },
    { id: "D", m: 15, m2: 23, m3: 18 },
  ];
  let sel = 2;

  function fit(canvas, ctx, w, h) {
    const S = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.max(2, Math.round(w * S));
    const H = Math.max(2, Math.round(h * S));
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.clearRect(0, 0, w, h);
  }

  function circleOutline(cx, cy, r, samples) {
    const pts = new Array(samples);
    for (let i = 0; i < samples; i++) {
      const th = (i / samples) * TAU;
      pts[i] = [cx + Math.cos(th) * r, cy + Math.sin(th) * r];
    }
    return pts;
  }

  function rectOutline(x, y, w, h, r) {
    const pts = [];
    const push = (px, py) => {
      const l = pts[pts.length - 1];
      if (l && Math.abs(l[0] - px) < 1e-4 && Math.abs(l[1] - py) < 1e-4) return;
      pts.push([px, py]);
    };
    const seg = (x0, y0, xe, ye) => {
      const n = Math.max(2, Math.round(Math.hypot(xe - x0, ye - y0) / 4));
      for (let i = 0; i <= n; i++) push(x0 + ((xe - x0) * i) / n, y0 + ((ye - y0) * i) / n);
    };
    const arc = (cx, cy, a0, a1) => {
      const n = Math.max(7, Math.round((Math.abs(a1 - a0) * r) / 1.6));
      for (let i = 0; i <= n; i++) {
        const a = a0 + ((a1 - a0) * i) / n;
        push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
    };
    const x1 = x + w;
    const y1 = y + h;
    const HP = Math.PI / 2;
    seg(x + r, y, x1 - r, y);
    arc(x1 - r, y + r, -HP, 0);
    seg(x1, y + r, x1, y1 - r);
    arc(x1 - r, y1 - r, 0, HP);
    seg(x1 - r, y1, x + r, y1);
    arc(x + r, y1 - r, HP, Math.PI);
    seg(x, y1 - r, x, y + r);
    arc(x + r, y + r, Math.PI, Math.PI * 1.5);
    return pts;
  }

  function rail(pts, M) {
    const nP = pts.length;
    const cum = new Float64Array(nP + 1);
    for (let i = 1; i <= nP; i++) {
      const p = pts[i % nP];
      const q = pts[i - 1];
      cum[i] = cum[i - 1] + Math.hypot(p[0] - q[0], p[1] - q[1]);
    }
    const L = cum[nP];
    const out = new Array(M);
    let j = 0;
    for (let i = 0; i < M; i++) {
      const target = (i / M) * L;
      while (j < nP - 1 && cum[j + 1] < target) j++;
      const seg = cum[j + 1] - cum[j] || 1;
      const u = (target - cum[j]) / seg;
      const p = pts[j];
      const q = pts[(j + 1) % nP];
      out[i] = [
        p[0] + (q[0] - p[0]) * u,
        p[1] + (q[1] - p[1]) * u,
        (q[1] - p[1]) / seg,
        -(q[0] - p[0]) / seg,
      ];
    }
    return out;
  }

  function band(ctx, r, o) {
    const M = r.length;
    ctx.lineWidth = o.lw;
    ctx.strokeStyle = ink(o.alpha);
    ctx.beginPath();
    for (let k = 0; k < o.K; k++) {
      const ph = (o.phase || 0) + (k / o.K) * TAU;
      for (let i = 0; i <= M; i++) {
        const p = r[i % M];
        const u = (i % M) / M;
        const off = o.amp * Math.sin(o.waves * u * TAU + ph);
        const x = p[0] + p[2] * off;
        const y = p[1] + p[3] * off;
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
    }
    ctx.stroke();
  }

  function railLine(ctx, r, off, alpha, lw) {
    const M = r.length;
    ctx.lineWidth = lw;
    ctx.strokeStyle = ink(alpha);
    ctx.beginPath();
    for (let i = 0; i <= M; i++) {
      const p = r[i % M];
      const x = p[0] + p[2] * off;
      const y = p[1] + p[3] * off;
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.stroke();
  }

  function rosette(ctx, cx, cy, o) {
    const n = o.n;
    const pts = o.pts;
    const m = o.m;
    const d = o.d;
    const dir = o.dir || 1;
    const shrink = o.shrink === undefined ? 0.06 : o.shrink;
    ctx.lineWidth = o.lw;
    ctx.strokeStyle = ink(o.alpha);
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (let k = 0; k < n; k++) {
      const f = k / n;
      const phi = (o.phase || 0) + dir * f * TAU;
      const a = o.A * (1 - shrink * f);
      for (let i = 0; i <= pts; i++) {
        const t = (i / pts) * TAU;
        const x = cx + a * Math.cos(t) + d * Math.cos(m * t + phi);
        const y = cy + a * Math.sin(t) - d * Math.sin(m * t + phi);
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
    }
    ctx.stroke();
  }

  function waveField(ctx, w, h) {
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = ink(0.075);
    const pitch = 6.2;
    const N = Math.ceil(h / pitch) + 2;
    const step = 7;
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const y0 = i * pitch - 3;
      const ph = i * 0.44;
      for (let x = 0; x <= w; x += step) {
        const y =
          y0 +
          3.3 * Math.sin(x * 0.0139 + ph) +
          1.9 * Math.sin(x * 0.0327 - ph * 1.7) +
          0.9 * Math.sin(x * 0.0715 + ph * 0.6);
        if (x) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
    }
    ctx.stroke();
  }

  function rand32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function drawPlate() {
    const w = cert.clientWidth;
    const h = cert.clientHeight;
    if (!w || !h) return;
    fit(cPlate, ctxP, w, h);
    ctxP.fillStyle = SUB;
    ctxP.fillRect(0, 0, w, h);

    let g = ctxP.createRadialGradient(w * 0.28, h * 0.16, 8, w * 0.28, h * 0.16, Math.max(w, h) * 0.95);
    g.addColorStop(0, "rgba(255,252,240,.85)");
    g.addColorStop(1, "rgba(255,252,240,0)");
    ctxP.fillStyle = g;
    ctxP.fillRect(0, 0, w, h);
    g = ctxP.createRadialGradient(w * 0.88, h * 0.94, 8, w * 0.88, h * 0.94, Math.max(w, h) * 0.85);
    g.addColorStop(0, ink(0.06));
    g.addColorStop(1, ink(0));
    ctxP.fillStyle = g;
    ctxP.fillRect(0, 0, w, h);

    const rnd = rand32(4409);
    for (let i = 0; i < 1100; i++) {
      ctxP.fillStyle = ink(0.018 + rnd() * 0.05);
      ctxP.fillRect(rnd() * w, rnd() * h, 1, rnd() < 0.12 ? 2 : 1);
    }

    waveField(ctxP, w, h);

    const narrow = w < 520;
    const inset = narrow ? 7 : 10;
    const half = narrow ? 3.1 : 3.8;
    const br = rail(
      rectOutline(inset + half, inset + half, w - 2 * (inset + half), h - 2 * (inset + half), narrow ? 5 : 7),
      narrow ? 760 : 1240,
    );
    band(ctxP, br, { amp: half, waves: narrow ? 54 : 116, K: 9, alpha: 0.3, lw: 0.5 });
    railLine(ctxP, br, -half - 1.9, 0.34, 0.6);
    railLine(ctxP, br, half + 1.9, 0.3, 0.5);
    railLine(ctxP, br, half + 4.4, 0.13, 0.5);
  }

  function drawRosettes() {
    const w = medal.clientWidth;
    const h = medal.clientHeight;
    if (!w || !h) return;
    fit(cRose, ctxR, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) / 2;
    const bar = BARS[sel];
    const small = R < 130;

    const g = ctxR.createRadialGradient(cx, cy, R * 0.06, cx, cy, R);
    g.addColorStop(0, "rgba(249,245,234,.92)");
    g.addColorStop(0.76, "rgba(249,245,234,.84)");
    g.addColorStop(1, "rgba(249,245,234,0)");
    ctxR.fillStyle = g;
    ctxR.beginPath();
    ctxR.arc(cx, cy, R, 0, TAU);
    ctxR.fill();

    const ring = rail(circleOutline(cx, cy, R * 0.93, 640), small ? 460 : 620);
    band(ctxR, ring, { amp: R * 0.036, waves: (bar.m + 1) * 5, K: 7, alpha: 0.3, lw: 0.5 });
    railLine(ctxR, ring, -R * 0.036 - 1.8, 0.34, 0.6);
    railLine(ctxR, ring, R * 0.036 + 1.8, 0.28, 0.5);

    rosette(ctxR, cx, cy, {
      A: R * 0.655,
      d: R * 0.215,
      m: bar.m,
      n: small ? 44 : 58,
      pts: small ? 340 : 470,
      alpha: 0.42,
      lw: 0.5,
      shrink: 0.035,
      phase: 0.2,
    });
    rosette(ctxR, cx, cy, {
      A: R * 0.335,
      d: R * 0.115,
      m: bar.m2,
      n: small ? 34 : 44,
      pts: small ? 280 : 380,
      alpha: 0.38,
      lw: 0.5,
      dir: -1,
      shrink: 0.05,
      phase: 0.9,
    });

    ctxR.beginPath();
    ctxR.arc(cx, cy, R * 0.07, 0, TAU);
    ctxR.fillStyle = "rgba(249,245,234,.86)";
    ctxR.fill();
    ctxR.lineWidth = 0.6;
    ctxR.strokeStyle = ink(0.32);
    ctxR.stroke();
    ctxR.beginPath();
    ctxR.arc(cx, cy, R * 0.04, 0, TAU);
    ctxR.strokeStyle = ink(0.24);
    ctxR.lineWidth = 0.5;
    ctxR.stroke();
  }

  let phase = 0;
  function drawDrift() {
    const w = medal.clientWidth;
    const h = medal.clientHeight;
    if (!w || !h) return;
    fit(cDrift, ctxD, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) / 2;
    const bar = BARS[sel];
    const small = R < 130;
    rosette(ctxD, cx, cy, {
      A: R * 0.515,
      d: R * 0.165,
      m: bar.m3,
      n: small ? 26 : 34,
      pts: small ? 240 : 320,
      alpha: 0.3,
      lw: 0.5,
      shrink: 0.03,
      phase,
    });
  }

  const elBarName = document.getElementById("barName");
  const elCapBar = document.getElementById("capBar");

  function paintLabels() {
    const b = BARS[sel];
    elBarName.textContent = b.id;
    elCapBar.textContent = b.id;
  }

  function drawAll() {
    drawPlate();
    drawRosettes();
    drawDrift();
  }

  paintLabels();
  drawAll();

  let timer = 0;
  let onScreen = true;
  let camTimer = 0;

  function tick() {
    timer = 0;
    phase += 0.019;
    if (phase > TAU) phase -= TAU;
    drawDrift();
    schedule();
  }

  function schedule() {
    if (timer || reduce || !onScreen || document.hidden) return;
    timer = setTimeout(tick, 140);
  }

  function halt() {
    if (timer) {
      clearTimeout(timer);
      timer = 0;
    }
  }

  function cycleCam() {
    if (reduce || document.hidden || !onScreen) return;
    sel = (sel + 1) % BARS.length;
    paintLabels();
    drawRosettes();
    drawDrift();
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => {
        onScreen = entries[0].isIntersecting;
        if (onScreen) schedule();
        else halt();
      },
      { threshold: 0.02 },
    ).observe(cert);
  } else {
    schedule();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) halt();
    else schedule();
  });
  window.addEventListener("pagehide", halt);

  let rt = 0;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(drawAll, 120);
  });

  if (!reduce) camTimer = setInterval(cycleCam, 4200);
  schedule();

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(drawAll).catch(() => {});
  }
})();
<\/script>
</body>
</html>
`;var Uu=`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Lumina Weavers \xB7 Kinetic Textiles, Kyoto</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"><\/script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"><\/script>
    <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"><\/script>
</head>
<body class="text-[#e8dcc4] overflow-hidden antialiased selection:bg-[#b02330] selection:text-white font-serif" style="background: radial-gradient(120% 100% at 50% 30%, #2a1113 0%, #1a0a0c 55%, #0f0607 100%); height: 100dvh; width: 100vw;">

    <!-- Aura Asset Background -->
    <div class="fixed inset-0 pointer-events-none z-0 bg-cover bg-center opacity-[0.15] mix-blend-screen" style="background-image: url('https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/fa51902b-c2a4-4c33-a96e-a8f1ef67edc6_1600w.jpg');"></div>

    <!-- Stage / Background -->
    <div class="fixed inset-0 overflow-hidden z-0">
        <canvas id="cloth" class="absolute inset-0 w-full h-full block pointer-events-none"></canvas>
        <div class="absolute inset-0 pointer-events-none" style="background: radial-gradient(90% 80% at 50% 46%, transparent 55%, rgba(10,5,6,.72) 100%);"></div>
    </div>

    <!-- UI Overlay -->
    <div class="absolute inset-0 z-10 flex flex-col p-6 md:p-12 pointer-events-none font-sans">
        
        <!-- Header -->
        <header class="flex justify-between items-center w-full pointer-events-auto">
            <div class="overflow-hidden">
                <div class="reveal-item opacity-0 translate-y-8 text-xs tracking-[0.28em] uppercase text-[#b99a8f] font-medium">
                    Est. 2024 \xB7 Kyoto, Japan
                </div>
            </div>
            <nav class="hidden md:flex gap-8">
                <div class="overflow-hidden">
                    <a href="#library" class="reveal-item block opacity-0 translate-y-8 text-xs tracking-widest uppercase text-[#e8dcc4]/80 hover:text-white transition-colors duration-300">Material Library</a>
                </div>
                <div class="overflow-hidden">
                    <a href="#trade" class="reveal-item block opacity-0 translate-y-8 text-xs tracking-widest uppercase text-[#e8dcc4]/80 hover:text-white transition-colors duration-300">Partnerships</a>
                </div>
                <div class="overflow-hidden">
                    <a href="#mill" class="reveal-item block opacity-0 translate-y-8 text-xs tracking-widest uppercase text-[#e8dcc4]/80 hover:text-white transition-colors duration-300">The Studio</a>
                </div>
            </nav>
        </header>

        <!-- Footer / Content -->
        <div class="mt-auto flex flex-col sm:flex-row justify-between items-start sm:items-end gap-8 pointer-events-auto w-full">
            
            <div class="max-w-md space-y-6">
                <div>
                    <p class="word-reveal text-sm md:text-base leading-relaxed text-[#e8dcc4]/90">
                        <strong class="text-white font-semibold block mb-1 text-base md:text-lg tracking-tight font-serif">Kinetic textiles, rendered to order.</strong>
                        Every meter is simulated on bespoke kinetic engines. Digital threads, authentic physics, designed for infinite virtual environments.
                    </p>
                </div>
                
                <div class="overflow-hidden pt-2">
                    <div class="reveal-item opacity-0 translate-y-8 inline-block rounded-sm p-[1px] bg-gradient-to-b from-white/30 via-[#e03848]/30 to-[#7c1622]/10 shadow-[0_10px_30px_rgba(124,22,34,0.4)] transition-transform duration-300 hover:-translate-y-0.5 group">
                        <a href="#commission" class="flex items-center gap-3 bg-[#b02330] group-hover:bg-[#961c27] text-white px-6 py-3 rounded-[1px] text-sm font-semibold tracking-wide transition-colors relative overflow-hidden">
                            <span class="relative z-10">Commission a textile</span>
                            <iconify-icon icon="solar:arrow-right-linear" width="18" class="relative z-10 transition-transform group-hover:translate-x-1"></iconify-icon>
                            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                        </a>
                    </div>
                </div>
            </div>

            <div class="text-left sm:text-right mt-8 sm:mt-0">
                <div class="word-reveal text-xs tracking-[0.24em] uppercase text-[#b99a8f] leading-[1.9] font-medium">
                    Vector &amp; matrix<br>
                    No. 42 azure thread<br>
                    Node 7 \xB7 Grid 2024
                </div>
            </div>

        </div>
    </div>

    <script>
        // --- GSAP Animation ---
        document.addEventListener("DOMContentLoaded", () => {
            gsap.registerPlugin(ScrollTrigger);
            
            // Standard reveals
            gsap.to(".reveal-item", {
                y: 0,
                opacity: 1,
                duration: 1.2,
                stagger: 0.1,
                ease: "power3.out",
                delay: 0.2
            });

            // Masked Word Reveal implementation
            document.querySelectorAll('.word-reveal').forEach(node => {
                function wrapWords(el) {
                    const childNodes = Array.from(el.childNodes);
                    childNodes.forEach(child => {
                        if (child.nodeType === 3) {
                            const words = child.nodeValue.split(/(\\s+)/);
                            const fragment = document.createDocumentFragment();
                            words.forEach(word => {
                                if (word.trim().length > 0) {
                                    const wrapper = document.createElement('span');
                                    wrapper.className = 'inline-flex overflow-hidden pb-1 -mb-1';
                                    const inner = document.createElement('span');
                                    inner.className = 'word-anim translate-y-[110%] opacity-0 inline-block';
                                    inner.textContent = word;
                                    wrapper.appendChild(inner);
                                    fragment.appendChild(wrapper);
                                } else {
                                    fragment.appendChild(document.createTextNode(word));
                                }
                            });
                            el.replaceChild(fragment, child);
                        } else if (child.nodeType === 1) {
                            wrapWords(child);
                        }
                    });
                }
                wrapWords(node);

                // ScrollTrigger staggered reveal
                gsap.to(node.querySelectorAll('.word-anim'), {
                    y: 0,
                    opacity: 1,
                    duration: 0.9,
                    stagger: 0.02,
                    ease: "power4.out",
                    delay: 0.3,
                    scrollTrigger: {
                        trigger: node,
                        start: "top 95%",
                    }
                });
            });
        });

        // --- Three.js Cloth Simulation ---
        (() => {
            const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
            const canvas = document.getElementById('cloth');
            if (!window.THREE) return;

            // Generate Woven Texture
            function makeClothTexture() {
                const W = 1280, H = 800;
                const c = document.createElement('canvas'); 
                c.width = W; 
                c.height = H;
                const x = c.getContext('2d');
                
                // Ivory ground gradient
                const g = x.createLinearGradient(0, 0, 0, H);
                g.addColorStop(0, '#efe6d4'); 
                g.addColorStop(0.5, '#e9dfca'); 
                g.addColorStop(1, '#e3d7bf');
                x.fillStyle = g; 
                x.fillRect(0, 0, W, H);

                // Crimson hem border
                x.strokeStyle = '#a5202c'; 
                x.lineWidth = 10;
                x.strokeRect(46, 46, W-92, H-92);
                x.lineWidth = 3; 
                x.strokeStyle = '#7c1622';
                x.strokeRect(66, 66, W-132, H-132);

                // Typography
                x.fillStyle = '#a5202c';
                x.font = 'bold 78px Georgia, "Times New Roman", serif';
                x.textAlign = 'center'; 
                x.textBaseline = 'middle';
                x.fillText('L\u2009W', W/2, 190);
                
                x.font = 'normal 20px "Helvetica Neue", Arial, sans-serif';
                x.fillStyle = '#7c1622';
                x.fillText('\xB7 KYOTO \xB7', W/2, 246);

                x.fillStyle = '#9e1e2a';
                x.font = 'bold 118px Georgia, "Times New Roman", serif';
                x.fillText('LUMINA', W/2, 400);
                x.fillText('WEAVERS', W/2, 520);

                x.fillStyle = '#7c1622';
                x.font = '600 30px "Helvetica Neue", Arial, sans-serif';
                x.fillText('K I N E T I C   T E X T I L E S   \xB7   2 0 2 4', W/2, 626);

                // Weave overlay (Thread grid)
                x.globalAlpha = 1;
                for(let yy=0; yy<H; yy+=3){
                    x.strokeStyle = 'rgba(60,30,20,0.05)'; 
                    x.lineWidth = 1;
                    x.beginPath(); x.moveTo(0,yy+.5); x.lineTo(W,yy+.5); x.stroke();
                }
                for(let xx=0; xx<W; xx+=3){
                    x.strokeStyle = 'rgba(255,250,235,0.06)'; 
                    x.lineWidth = 1;
                    x.beginPath(); x.moveTo(xx+.5,0); x.lineTo(xx+.5,H); x.stroke();
                }

                // Fabric Slub Noise
                const id = x.getImageData(0, 0, W, H), d = id.data;
                for(let i=0; i<d.length; i+=4){
                    const n = (Math.random()*2-1)*10;
                    d[i]+=n; d[i+1]+=n; d[i+2]+=n;
                }
                x.putImageData(id, 0, 0);

                const tex = new THREE.CanvasTexture(c);
                tex.anisotropy = 4; 
                tex.colorSpace = THREE.SRGBColorSpace;
                return tex;
            }

            // Scene Setup
            const scene = new THREE.Scene();
            const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            let camera;

            const BW = 4.4, BH = 2.75; 
            const GX = 40, GY = 26;
            const geo = new THREE.PlaneGeometry(BW, BH, GX, GY);
            const mat = new THREE.MeshPhongMaterial({
                map: makeClothTexture(), 
                side: THREE.DoubleSide,
                shininess: 6, 
                specular: 0x2a1410, 
                color: 0xffffff
            });
            const mesh = new THREE.Mesh(geo, mat); 
            scene.add(mesh);

            // Lighting
            scene.add(new THREE.AmbientLight(0xffe9d0, 0.62));
            const key = new THREE.DirectionalLight(0xfff0dc, 1.15); 
            key.position.set(-3, 3.5, 3.2); 
            scene.add(key);
            const rim = new THREE.DirectionalLight(0xb02330, 0.42); 
            rim.position.set(3, -1.5, 2.0); 
            scene.add(rim);

            // Verlet Physics Data
            const pos = geo.attributes.position;
            const N = (GX + 1) * (GY + 1);
            const cur = new Float32Array(N * 3), prev = new Float32Array(N * 3), rest = new Float32Array(N * 3);
            const pinned = new Uint8Array(N);
            
            for(let i=0; i<N; i++){
                const ax = pos.getX(i), ay = pos.getY(i), az = 0;
                cur[i*3] = prev[i*3] = rest[i*3] = ax;
                cur[i*3+1] = prev[i*3+1] = rest[i*3+1] = ay;
                cur[i*3+2] = prev[i*3+2] = rest[i*3+2] = az;
            }
            
            for(let ix=0; ix<=GX; ix++){ pinned[ix] = 1; }
            const idx = (ix, iy) => ix + iy * (GX + 1);

            const restH = BW / GX, restV = BH / GY;
            const GRAV = -3.1, DAMP = 0.985, DT = 0.016;

            function wind(ix, iy, t) {
                const cx = ix / GX, cy = iy / GY;
                const travel = t * 1.7 - cy * 4.2;
                const gust = 0.6 + 0.42 * Math.sin(t * 0.6) + 0.18 * Math.sin(t * 1.9 + 1.3);
                const amp = 4.3 * cy;
                const fz = (Math.sin(travel + cx * 3.3) + 0.5 * Math.sin(travel * 1.7 + cx * 6.0)) * amp * gust;
                const fx = Math.sin(t * 0.9 + cy * 2.2) * 0.6 * cy;
                const fy = -0.4 * cy;
                return [fx, fy, fz];
            }

            function step(t) {
                for(let iy=0; iy<=GY; iy++){
                    for(let ix=0; ix<=GX; ix++){
                        const i = idx(ix, iy);
                        if(pinned[i]) continue;
                        const [fx, fy, fz] = wind(ix, iy, t);
                        for(let k=0; k<3; k++){
                            const j = i * 3 + k;
                            const a = (k===0 ? fx : k===1 ? (fy+GRAV) : fz);
                            const v = (cur[j] - prev[j]) * DAMP;
                            prev[j] = cur[j];
                            cur[j] = cur[j] + v + a * DT * DT;
                        }
                    }
                }
                
                for(let it=0; it<3; it++){
                    for(let iy=0; iy<=GY; iy++){
                        for(let ix=0; ix<GX; ix++){ solve(idx(ix,iy), idx(ix+1,iy), restH); }
                    }
                    for(let iy=0; iy<GY; iy++){
                        for(let ix=0; ix<=GX; ix++){ solve(idx(ix,iy), idx(ix,iy+1), restV); }
                    }
                }
                
                for(let ix=0; ix<=GX; ix++){
                    const i = ix;
                    cur[i*3] = rest[i*3]; cur[i*3+1] = rest[i*3+1]; cur[i*3+2] = rest[i*3+2];
                    prev[i*3] = rest[i*3]; prev[i*3+1] = rest[i*3+1]; prev[i*3+2] = rest[i*3+2];
                }
            }

            function solve(a, b, rl) {
                const ax = cur[a*3], ay = cur[a*3+1], az = cur[a*3+2];
                const bx = cur[b*3], by = cur[b*3+1], bz = cur[b*3+2];
                let dx = bx - ax, dy = by - ay, dz = bz - az;
                const d = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1e-6;
                const diff = (d - rl) / d * 0.5;
                dx *= diff; dy *= diff; dz *= diff;
                
                const pa = pinned[a], pb = pinned[b];
                if(!pa && !pb){ 
                    cur[a*3]+=dx; cur[a*3+1]+=dy; cur[a*3+2]+=dz; 
                    cur[b*3]-=dx; cur[b*3+1]-=dy; cur[b*3+2]-=dz; 
                }
                else if(pa && !pb){ cur[b*3]-=dx*2; cur[b*3+1]-=dy*2; cur[b*3+2]-=dz*2; }
                else if(!pa && pb){ cur[a*3]+=dx*2; cur[a*3+1]+=dy*2; cur[a*3+2]+=dz*2; }
            }

            function commit() {
                for(let i=0; i<N; i++){ pos.setXYZ(i, cur[i*3], cur[i*3+1], cur[i*3+2]); }
                pos.needsUpdate = true;
                geo.computeVertexNormals();
            }

            function fit() {
                const w = window.innerWidth, h = window.innerHeight;
                renderer.setSize(w, h, false);
                const aspect = w / h;
                camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 100);
                const vFit = (BH/2) / Math.tan(42 * Math.PI / 360);
                const hFit = (BW/2) / Math.tan(42 * Math.PI / 360) / aspect;
                camera.position.set(0, 0.05, Math.max(vFit, hFit) * 1.16 + 0.4);
                camera.lookAt(0, 0, 0);
            }
            
            window.addEventListener('resize', fit); 
            fit();

            let running = false, raf = 0, t = 0;
            function loop() {
                if(!running) return;
                t += DT; 
                step(t); 
                commit();
                renderer.render(scene, camera);
                raf = requestAnimationFrame(loop);
            }
            
            function start() { if(running)return; running=true; raf=requestAnimationFrame(loop); }
            function stop() { running=false; cancelAnimationFrame(raf); }

            if(reduce) {
                for(let s=0; s<220; s++) step(s*DT);
                commit(); 
                renderer.render(scene, camera);
            } else {
                for(let s=0; s<40; s++) step(s*DT);
                t = 40 * DT;
                start();
                document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
            }
        })();
    <\/script>
</body>
</html>`;var Bu=`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nexus - Unified Ecosystem</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"><\/script>
    <!-- GSAP for Animations -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"><\/script>
</head>
<body class="bg-black text-white font-sans min-h-screen overflow-x-hidden antialiased selection:bg-red-500/30 flex flex-col relative" style="font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">

    <!-- WebGL Background -->
    <canvas id="glcanvas" class="fixed inset-0 w-full h-full -z-20"></canvas>

    <!-- Overlay structural lines to match reference -->
    <div class="fixed inset-0 pointer-events-none -z-10 w-full h-full">
        <!-- Thin angled lines behind logo area -->
        <div class="absolute top-0 left-0 w-[600px] h-[600px] border-l border-t border-white/5 origin-top-left rotate-[15deg] translate-x-[-100px] translate-y-[-100px]"></div>
        <div class="absolute top-0 left-0 w-[800px] h-[800px] border-l border-white/5 origin-top-left rotate-[-25deg] translate-x-[200px] translate-y-[-50px]"></div>
        <!-- Horizontal grid line -->
        <div class="absolute top-[20%] w-full border-t border-white/5"></div>
    </div>

    <!-- Main Content Layout -->
    <div class="flex-1 flex flex-col relative z-10 w-full max-w-[1600px] mx-auto min-h-screen border-l border-r border-white/10">
        
        <!-- Hero Section -->
        <main class="flex-1 flex flex-col lg:flex-row items-center lg:items-center justify-between px-8 sm:px-16 lg:px-24 py-24 lg:py-0 relative">
            
            <!-- Left: Logo & Title -->
            <div class="flex items-center gap-6 group cursor-default w-full lg:w-1/2 mb-20 lg:mb-0">
                <!-- Abstract Geometric Icon -->
                <svg width="72" height="72" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-white transform group-hover:scale-105 transition-transform duration-500 ease-out" style="flex-shrink: 0;">
                    <path d="M10 20 L50 40 L90 10 L80 50 L95 85 L50 60 L15 90 L25 50 Z" fill="currentColor"/>
                    <path d="M50 40 L50 60" stroke="black" stroke-width="2"/>
                    <path d="M10 20 L50 60" stroke="black" stroke-width="2"/>
                </svg>
                
                <!-- Masked Reveal Title -->
                <h1 class="text-7xl sm:text-8xl lg:text-9xl font-semibold tracking-tighter lowercase leading-none flex flex-wrap gap-x-4 gap-y-2 reveal-text">
                    <span class="inline-block overflow-hidden pt-2">
                        <span class="reveal-word inline-block translate-y-[120%] pb-2">nexus</span>
                    </span>
                    <span class="inline-block overflow-hidden pt-2">
                        <span class="reveal-word inline-block translate-y-[120%] pb-2">flow</span>
                    </span>
                </h1>
            </div>

            <!-- Right: Input & Social Proof -->
            <div class="w-full lg:w-1/2 flex flex-col items-start lg:items-end relative">
                <!-- Offset Input Container -->
                <div class="relative group w-full max-w-md">
                    <!-- Stylized Shadow/Offset with subtle gradient -->
                    <div class="absolute inset-0 bg-gradient-to-br from-[#A63A29] to-[#732215] translate-x-3 translate-y-3 transition-transform duration-300 ease-out group-hover:translate-x-4 group-hover:translate-y-4"></div>
                    
                    <!-- Input Box with Premium Gradient Border Treatment -->
                    <div class="relative z-10 p-[1px] bg-gradient-to-r from-white/40 via-white/10 to-white/30">
                        <div class="bg-white flex items-center justify-between p-1 w-full h-[60px] sm:h-[72px]">
                            <input type="email" placeholder="Join the waitlist..." class="w-full h-full bg-transparent text-black outline-none px-6 text-base sm:text-lg font-medium placeholder:text-gray-500 placeholder:font-normal" />
                        </div>
                    </div>
                </div>

                <!-- Users Proof -->
                <div class="flex flex-row items-center gap-4 mt-10 mr-2">
                    <span class="text-sm font-medium tracking-wide">5,102+ early adopters</span>
                    <div class="flex -space-x-3">
                        <!-- Avatars with Gradient Borders -->
                        <div class="w-8 h-8 rounded-full p-[2px] bg-gradient-to-br from-white/50 to-white/10 bg-black shadow-sm">
                            <img class="w-full h-full rounded-full object-cover" src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/2f563338-39fa-47ea-9761-658d4f3f84db_1600w.jpg" alt="User avatar">
                        </div>
                        <div class="w-8 h-8 rounded-full p-[2px] bg-gradient-to-br from-white/50 to-white/10 bg-black shadow-sm">
                            <img class="w-full h-full rounded-full object-cover" src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/4f5668c5-fc4a-44e0-bc5e-a664189d3c31_1600w.jpg" alt="User avatar">
                        </div>
                        <div class="w-8 h-8 rounded-full p-[2px] bg-gradient-to-br from-white/50 to-white/10 bg-black shadow-sm">
                            <img class="w-full h-full rounded-full object-cover" src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/eca707cc-a5b7-439a-b4fd-247f6106c2e1_1600w.jpg" alt="User avatar">
                        </div>
                        <div class="w-8 h-8 rounded-full p-[2px] bg-gradient-to-br from-white/50 to-white/10 bg-black shadow-sm">
                            <img class="w-full h-full rounded-full object-cover" src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/77415a2e-dcbc-4748-a29d-fced4821881a_1600w.jpg" alt="User avatar">
                        </div>
                    </div>
                </div>
            </div>
            
        </main>

        <!-- Structural Horizontal Divider -->
        <div class="w-full border-t border-white/20"></div>

        <!-- Footer Section -->
        <footer class="w-full grid grid-cols-1 lg:grid-cols-12 min-h-[300px]">
            
            <!-- Footer Left: Brand & Desc -->
            <div class="lg:col-span-4 p-8 sm:p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-white/20 flex flex-col gap-6">
                <div class="flex items-center gap-3">
                    <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-white">
                        <path d="M10 20 L50 40 L90 10 L80 50 L95 85 L50 60 L15 90 L25 50 Z" fill="currentColor"/>
                    </svg>
                    <span class="text-base font-semibold tracking-tight">Nexus</span>
                </div>
                <p class="text-sm text-gray-400 leading-relaxed max-w-[280px]">
                    Your unified ecosystem to synchronize thoughts, maintain momentum, and build effortlessly.
                </p>
            </div>

            <!-- Footer Right: Links -->
            <div class="lg:col-span-8 p-8 sm:p-12 lg:p-16 grid grid-cols-2 sm:grid-cols-3 gap-12 sm:gap-8">
                <!-- Column 1 -->
                <div class="flex flex-col gap-5">
                    <h3 class="text-sm font-semibold tracking-tight text-white mb-1">Product</h3>
                    <a href="#" class="text-sm text-gray-400 hover:text-white transition-colors duration-200">Capabilities</a>
                    <a href="#" class="text-sm text-gray-400 hover:text-white transition-colors duration-200">Mechanism</a>
                    <a href="#" class="text-sm text-gray-400 hover:text-white transition-colors duration-200">Plans</a>
                </div>
                
                <!-- Column 2 -->
                <div class="flex flex-col gap-5">
                    <h3 class="text-sm font-semibold tracking-tight text-white mb-1">Company</h3>
                    <a href="#" class="text-sm text-gray-400 hover:text-white transition-colors duration-200">Our Story</a>
                    <a href="#" class="text-sm text-gray-400 hover:text-white transition-colors duration-200">Join Us</a>
                    <a href="#" class="text-sm text-gray-400 hover:text-white transition-colors duration-200">Get in Touch</a>
                    <a href="#" class="text-sm text-gray-400 hover:text-white transition-colors duration-200">Media</a>
                </div>

                <!-- Column 3 -->
                <div class="flex flex-col gap-5">
                    <h3 class="text-sm font-semibold tracking-tight text-white mb-1">Resources</h3>
                    <a href="#" class="text-sm text-gray-400 hover:text-white transition-colors duration-200">Support</a>
                    <a href="#" class="text-sm text-gray-400 hover:text-white transition-colors duration-200">Changelog</a>
                    <a href="#" class="text-sm text-gray-400 hover:text-white transition-colors duration-200">Documentation</a>
                </div>
            </div>

        </footer>
    </div>

    <!-- Scripts -->
    <script>
        // --- WebGL Background Animation ---
        const canvas = document.getElementById('glcanvas');
        const gl = canvas.getContext('webgl');

        if (!gl) {
            console.error('WebGL not supported');
        } else {
            // Resize handler
            function resize() {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                gl.viewport(0, 0, canvas.width, canvas.height);
            }
            window.addEventListener('resize', resize);
            resize();

            // Vertex Shader
            const vsSource = \`
                attribute vec4 aVertexPosition;
                void main() {
                    gl_Position = aVertexPosition;
                }
            \`;

            // Fragment Shader (Halftone Flow)
            const fsSource = \`
                precision highp float;
                uniform vec2 u_resolution;
                uniform float u_time;

                mat2 rot(float a) {
                    float s = sin(a), c = cos(a);
                    return mat2(c, -s, s, c);
                }

                void main() {
                    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
                    vec2 p = uv * 2.0 - 1.0;
                    p.x *= u_resolution.x / u_resolution.y;

                    vec2 flow_uv = p;
                    float time = u_time * 0.4;
                    
                    for(float i = 1.0; i < 4.0; i++) {
                        flow_uv *= rot(time * 0.1);
                        flow_uv.x += sin(flow_uv.y * 2.0 * i + time) * 0.5;
                        flow_uv.y += cos(flow_uv.x * 1.5 * i - time * 0.8) * 0.5;
                    }

                    float intensity = sin(flow_uv.x * 2.0 + flow_uv.y * 3.0) * 0.5 + 0.5;
                    
                    vec3 col_dark = vec3(0.02, 0.0, 0.0);
                    vec3 col_red = vec3(0.8, 0.1, 0.05);
                    vec3 col_bright = vec3(1.0, 0.6, 0.2);
                    
                    vec3 fluid_color = mix(col_dark, col_red, smoothstep(0.2, 0.6, intensity));
                    fluid_color = mix(fluid_color, col_bright, smoothstep(0.7, 1.0, intensity));

                    float gridSize = 6.0; 
                    vec2 grid_uv = gl_FragCoord.xy / gridSize;
                    vec2 cell_uv = fract(grid_uv) - 0.5;
                    
                    float dist = length(cell_uv);
                    float radius = intensity * 0.45; 
                    float dot_mask = smoothstep(radius, radius - 0.1, dist);
                    
                    vec3 final_color = mix(vec3(0.0), fluid_color, dot_mask);
                    final_color += fluid_color * 0.15;

                    gl_FragColor = vec4(final_color, 1.0);
                }
            \`;

            function compileShader(gl, type, source) {
                const shader = gl.createShader(type);
                gl.shaderSource(shader, source);
                gl.compileShader(shader);
                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                    console.error(gl.getShaderInfoLog(shader));
                    gl.deleteShader(shader);
                    return null;
                }
                return shader;
            }

            const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vsSource);
            const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);

            const program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            gl.useProgram(program);

            const positions = new Float32Array([
                -1.0,  1.0,
                 1.0,  1.0,
                -1.0, -1.0,
                 1.0, -1.0,
            ]);
            const positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

            const positionLocation = gl.getAttribLocation(program, "aVertexPosition");
            gl.enableVertexAttribArray(positionLocation);
            gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

            const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
            const timeLocation = gl.getUniformLocation(program, "u_time");

            let startTime = Date.now();
            function render() {
                gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
                gl.uniform1f(timeLocation, (Date.now() - startTime) / 1000.0);
                
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
                requestAnimationFrame(render);
            }
            render();
        }

        // --- GSAP ScrollTrigger Masked Word Reveal ---
        document.addEventListener("DOMContentLoaded", (event) => {
            gsap.registerPlugin(ScrollTrigger);

            gsap.to(".reveal-word", {
                y: "0%",
                duration: 1.2,
                stagger: 0.15,
                ease: "power4.out",
                scrollTrigger: {
                    trigger: ".reveal-text",
                    start: "top 90%",
                }
            });
        });
    <\/script>
</body>
</html>`;var Ya={hue:0,saturation:1,brightness:1},Rt={neon:{title:"Animated neon typography",source:Fu,background:e=>e==="light"?"#f4f4f2":"#090909",targets:[{selector:"#board",role:"ui",width:"1040px"}],presentation:"animated-typography"},luminaWeaversCloth:{title:"Woven Cloth kinetic textile",source:Uu,background:"#16090b",targets:[{selector:"body > div.fixed.inset-0.overflow-hidden.z-0",role:"background"}],presentation:"woven-cloth-label"},julianVanceNebula:{title:"Julian Vance nebula background",source:Hu,background:"#09090b",targets:[{selector:"#bg-canvas",role:"background"}]},fluid:{title:"Aura UI fluid background",source:Ou,background:"#030306",targets:[{selector:"#bg-canvas",role:"background"}]},nexusUnifiedFlow:{title:"Nexus unified halftone flow",source:Bu,background:"#000000",targets:[{selector:"#glcanvas",role:"background"}]},emberStorm:{title:"Aeonix ember storm",source:Iu,background:"#080503",targets:[{selector:"#gl",role:"background"}]},engravedCertificate:{title:"Kinetic Lathe certificate",source:Wu,background:"#ded6c2",targets:[{selector:"#cert",role:"ui",width:"720px"}]}};function Ka(e,t,n){return Math.min(n,Math.max(t,e))}function qu(e,t,n){if(!e.includes(t))throw new Error(`Neuform source adapter could not find: ${t}`);return e.replace(t,n)}function Ef(e){return[["return { t0: after + 5.6 + frnd() * 7.2, dur: total, segs: segs };","return { t0: after + 1.25 + frnd() * 1.75, dur: total, segs: segs };"],["if (!ev) ev = nextEvent(4.2);","if (!ev) ev = nextEvent(0.55);"],["cap = Math.min((W - W * 0.12) / blockW, (H - H * 0.18) / blockH);","cap = Math.min((W - W * 0.20) / blockW, (H - H * 0.28) / blockH);"],["var y0 = (H - blockH * cap) * 0.48;","var y0 = (H - blockH * cap) / 2;"]].reduce((t,[n,r])=>qu(t,n,r),e)}function Cf(e){return[["x.fillText('L\u2009W', W/2, 190);","x.fillText('W\u2009C', W/2, 190);"],["x.fillText('\xB7 KYOTO \xB7', W/2, 246);","x.fillText('\xB7 WOVEN CLOTH \xB7', W/2, 246);"],["x.fillText('LUMINA', W/2, 400);","x.fillText('WOVEN', W/2, 400);"],["x.fillText('WEAVERS', W/2, 520);","x.fillText('CLOTH', W/2, 520);"],["x.fillText('K I N E T I C   T E X T I L E S   \xB7   2 0 2 4', W/2, 626);","x.fillText('T E X T I L E   S I M U L A T I O N', W/2, 626);"]].reduce((t,[n,r])=>qu(t,n,r),e)}function Gu(e,t){return typeof e.background=="function"?e.background(t):e.background}function Tf(e,t){let n=JSON.stringify(e.targets).replace(/</g,"\\u003c"),r=Gu(e,t),o=t==="light"?"grayscale(1) invert(1) contrast(1.08)":"grayscale(1) contrast(1.08)",i=e.presentation==="animated-typography"?`
@keyframes sf-neon-type-breathe {
  0%, 100% { transform: translate3d(0, 3px, 0) scale(0.988); opacity: 0.88; }
  45% { transform: translate3d(0, -3px, 0) scale(1); opacity: 1; }
  68% { transform: translate3d(0, 0, 0) scale(0.996); opacity: 0.96; }
}
#board { overflow: visible !important; }
#neon {
  transform-origin: 50% 52%;
  animation: sf-neon-type-breathe 5.6s cubic-bezier(0.22, 1, 0.36, 1) infinite;
  filter: ${o};
  will-change: transform, opacity;
}
@media (prefers-reduced-motion: reduce) {
  #neon { animation: none !important; transform: none !important; opacity: 1 !important; }
}
`:"",a=`<style data-threeui-focus>
html, body { width: 100% !important; height: 100% !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: ${r} !important; }
body { position: relative !important; display: flex !important; align-items: center !important; justify-content: center !important; }
body > * { visibility: hidden !important; }
body[data-threeui-ready] > [data-threeui-role] { visibility: visible !important; }
[data-threeui-residual] { display: none !important; }
[data-threeui-role="background"] { position: fixed !important; inset: 0 !important; width: 100% !important; height: 100% !important; max-width: none !important; max-height: none !important; z-index: 0 !important; opacity: 1 !important; pointer-events: none !important; }
[data-threeui-role="ui"] { position: relative !important; z-index: 1 !important; width: min(calc(100% - 32px), var(--threeui-target-width, 1040px)) !important; max-width: none !important; max-height: calc(100% - 32px) !important; margin: auto !important; overflow: auto !important; opacity: 1 !important; transform: none !important; filter: none !important; flex: none !important; box-sizing: border-box !important; }
${i}
</style>`,l=`<script data-threeui-focus>
(function () {
  var isolated = false;
  function isolate() {
    if (isolated) return;
    var specs = ${n};
    var roots = [];
    specs.forEach(function (spec) {
      var element = document.querySelector(spec.selector);
      if (!element) return;
      element.setAttribute('data-threeui-role', spec.role);
      if (spec.width) element.style.setProperty('--threeui-target-width', spec.width);
      if (!roots.some(function (root) { return root.contains(element); })) roots.push(element);
    });
    if (!roots.length) return;
    isolated = true;
    roots.forEach(function (root) { document.body.appendChild(root); });
    Array.from(document.body.children).forEach(function (element) {
      if (roots.indexOf(element) !== -1) return;
      element.setAttribute('data-threeui-residual', '');
      element.setAttribute('aria-hidden', 'true');
      if ('inert' in element) element.inert = true;
    });
    document.body.setAttribute('data-threeui-ready', '');
    requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); });
  }
  function scheduleIsolation() { setTimeout(isolate, 100); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleIsolation, { once: true });
  else scheduleIsolation();
  window.addEventListener('load', isolate, { once: true });
})();
<\/script>`;return(e.presentation==="animated-typography"?Ef(e.source):e.presentation==="woven-cloth-label"?Cf(e.source):e.source).replace(/<\/head>/i,`${a}</head>`).replace(/<\/body>/i,`${l}</body>`)}function Af({definition:e,mode:t="dark",hue:n=Ya.hue,saturation:r=Ya.saturation,brightness:o=Ya.brightness,className:i,style:a}){let l=t==="light"?"light":"dark",s=Gu(e,l),u=(0,Vu.useMemo)(()=>Tf(e,l),[e,l]),g=Ka(n,-180,180),m=Ka(r,0,2),f=Ka(o,.35,1.65),v=g===0&&m===1&&f===1?void 0:`hue-rotate(${g}deg) saturate(${m}) brightness(${f})`;return(0,Xa.jsx)("iframe",{className:i,"data-mode":l,title:e.title,srcDoc:u,sandbox:"allow-scripts",loading:"eager",style:{display:"block",width:"100%",height:"100%",border:0,background:s,filter:v,...a}})}function Mt(e){return function(t){return(0,Xa.jsx)(Af,{...t,definition:e})}}var e0=Mt(Rt.neon),t0=Mt(Rt.luminaWeaversCloth),n0=Mt(Rt.julianVanceNebula),r0=Mt(Rt.fluid),o0=Mt(Rt.nexusUnifiedFlow),Ja=Mt(Rt.emberStorm),i0=Mt(Rt.engravedCertificate);var Za=Nt(Ao());(0,Qu.createRoot)(document.getElementById("root")).render((0,Za.jsx)("div",{style:{position:"fixed",inset:0,background:"#000"},children:(0,Za.jsx)(Ja,{style:{width:"100%",height:"100%"}})}));})();
/*! Bundled license information:

react/cjs/react.production.min.js:
  (**
   * @license React
   * react.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

scheduler/cjs/scheduler.production.min.js:
  (**
   * @license React
   * scheduler.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-dom/cjs/react-dom.production.min.js:
  (**
   * @license React
   * react-dom.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react/cjs/react-jsx-runtime.production.min.js:
  (**
   * @license React
   * react-jsx-runtime.production.min.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
