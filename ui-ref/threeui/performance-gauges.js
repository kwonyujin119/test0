(()=>{var v0=Object.create;var ts=Object.defineProperty;var x0=Object.getOwnPropertyDescriptor;var w0=Object.getOwnPropertyNames;var b0=Object.getPrototypeOf,y0=Object.prototype.hasOwnProperty;var Ne=(e,t)=>()=>{try{return t||e((t={exports:{}}).exports,t),t.exports}catch(r){throw t=0,r}};var k0=(e,t,r,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let i of w0(t))!y0.call(e,i)&&i!==r&&ts(e,i,{get:()=>t[i],enumerable:!(n=x0(t,i))||n.enumerable});return e};var Ft=(e,t,r)=>(r=e!=null?v0(b0(e)):{},k0(t||!e||!e.__esModule?ts(r,"default",{value:e,enumerable:!0}):r,e));var fs=Ne(C=>{"use strict";var pr=Symbol.for("react.element"),S0=Symbol.for("react.portal"),_0=Symbol.for("react.fragment"),E0=Symbol.for("react.strict_mode"),C0=Symbol.for("react.profiler"),T0=Symbol.for("react.provider"),A0=Symbol.for("react.context"),M0=Symbol.for("react.forward_ref"),R0=Symbol.for("react.suspense"),z0=Symbol.for("react.memo"),P0=Symbol.for("react.lazy"),rs=Symbol.iterator;function L0(e){return e===null||typeof e!="object"?null:(e=rs&&e[rs]||e["@@iterator"],typeof e=="function"?e:null)}var as={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},os=Object.assign,ss={};function It(e,t,r){this.props=e,this.context=t,this.refs=ss,this.updater=r||as}It.prototype.isReactComponent={};It.prototype.setState=function(e,t){if(typeof e!="object"&&typeof e!="function"&&e!=null)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,e,t,"setState")};It.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,"forceUpdate")};function ls(){}ls.prototype=It.prototype;function Li(e,t,r){this.props=e,this.context=t,this.refs=ss,this.updater=r||as}var Fi=Li.prototype=new ls;Fi.constructor=Li;os(Fi,It.prototype);Fi.isPureReactComponent=!0;var ns=Array.isArray,cs=Object.prototype.hasOwnProperty,Ii={current:null},ds={key:!0,ref:!0,__self:!0,__source:!0};function ps(e,t,r){var n,i={},a=null,o=null;if(t!=null)for(n in t.ref!==void 0&&(o=t.ref),t.key!==void 0&&(a=""+t.key),t)cs.call(t,n)&&!ds.hasOwnProperty(n)&&(i[n]=t[n]);var s=arguments.length-2;if(s===1)i.children=r;else if(1<s){for(var l=Array(s),d=0;d<s;d++)l[d]=arguments[d+2];i.children=l}if(e&&e.defaultProps)for(n in s=e.defaultProps,s)i[n]===void 0&&(i[n]=s[n]);return{$$typeof:pr,type:e,key:a,ref:o,props:i,_owner:Ii.current}}function F0(e,t){return{$$typeof:pr,type:e.type,key:t,ref:e.ref,props:e.props,_owner:e._owner}}function Di(e){return typeof e=="object"&&e!==null&&e.$$typeof===pr}function I0(e){var t={"=":"=0",":":"=2"};return"$"+e.replace(/[=:]/g,function(r){return t[r]})}var is=/\/+/g;function Pi(e,t){return typeof e=="object"&&e!==null&&e.key!=null?I0(""+e.key):t.toString(36)}function sn(e,t,r,n,i){var a=typeof e;(a==="undefined"||a==="boolean")&&(e=null);var o=!1;if(e===null)o=!0;else switch(a){case"string":case"number":o=!0;break;case"object":switch(e.$$typeof){case pr:case S0:o=!0}}if(o)return o=e,i=i(o),e=n===""?"."+Pi(o,0):n,ns(i)?(r="",e!=null&&(r=e.replace(is,"$&/")+"/"),sn(i,t,r,"",function(d){return d})):i!=null&&(Di(i)&&(i=F0(i,r+(!i.key||o&&o.key===i.key?"":(""+i.key).replace(is,"$&/")+"/")+e)),t.push(i)),1;if(o=0,n=n===""?".":n+":",ns(e))for(var s=0;s<e.length;s++){a=e[s];var l=n+Pi(a,s);o+=sn(a,t,r,l,i)}else if(l=L0(e),typeof l=="function")for(e=l.call(e),s=0;!(a=e.next()).done;)a=a.value,l=n+Pi(a,s++),o+=sn(a,t,r,l,i);else if(a==="object")throw t=String(e),Error("Objects are not valid as a React child (found: "+(t==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":t)+"). If you meant to render a collection of children, use an array instead.");return o}function on(e,t,r){if(e==null)return e;var n=[],i=0;return sn(e,n,"","",function(a){return t.call(r,a,i++)}),n}function D0(e){if(e._status===-1){var t=e._result;t=t(),t.then(function(r){(e._status===0||e._status===-1)&&(e._status=1,e._result=r)},function(r){(e._status===0||e._status===-1)&&(e._status=2,e._result=r)}),e._status===-1&&(e._status=0,e._result=t)}if(e._status===1)return e._result.default;throw e._result}var ne={current:null},ln={transition:null},B0={ReactCurrentDispatcher:ne,ReactCurrentBatchConfig:ln,ReactCurrentOwner:Ii};function us(){throw Error("act(...) is not supported in production builds of React.")}C.Children={map:on,forEach:function(e,t,r){on(e,function(){t.apply(this,arguments)},r)},count:function(e){var t=0;return on(e,function(){t++}),t},toArray:function(e){return on(e,function(t){return t})||[]},only:function(e){if(!Di(e))throw Error("React.Children.only expected to receive a single React element child.");return e}};C.Component=It;C.Fragment=_0;C.Profiler=C0;C.PureComponent=Li;C.StrictMode=E0;C.Suspense=R0;C.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=B0;C.act=us;C.cloneElement=function(e,t,r){if(e==null)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+e+".");var n=os({},e.props),i=e.key,a=e.ref,o=e._owner;if(t!=null){if(t.ref!==void 0&&(a=t.ref,o=Ii.current),t.key!==void 0&&(i=""+t.key),e.type&&e.type.defaultProps)var s=e.type.defaultProps;for(l in t)cs.call(t,l)&&!ds.hasOwnProperty(l)&&(n[l]=t[l]===void 0&&s!==void 0?s[l]:t[l])}var l=arguments.length-2;if(l===1)n.children=r;else if(1<l){s=Array(l);for(var d=0;d<l;d++)s[d]=arguments[d+2];n.children=s}return{$$typeof:pr,type:e.type,key:i,ref:a,props:n,_owner:o}};C.createContext=function(e){return e={$$typeof:A0,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null},e.Provider={$$typeof:T0,_context:e},e.Consumer=e};C.createElement=ps;C.createFactory=function(e){var t=ps.bind(null,e);return t.type=e,t};C.createRef=function(){return{current:null}};C.forwardRef=function(e){return{$$typeof:M0,render:e}};C.isValidElement=Di;C.lazy=function(e){return{$$typeof:P0,_payload:{_status:-1,_result:e},_init:D0}};C.memo=function(e,t){return{$$typeof:z0,type:e,compare:t===void 0?null:t}};C.startTransition=function(e){var t=ln.transition;ln.transition={};try{e()}finally{ln.transition=t}};C.unstable_act=us;C.useCallback=function(e,t){return ne.current.useCallback(e,t)};C.useContext=function(e){return ne.current.useContext(e)};C.useDebugValue=function(){};C.useDeferredValue=function(e){return ne.current.useDeferredValue(e)};C.useEffect=function(e,t){return ne.current.useEffect(e,t)};C.useId=function(){return ne.current.useId()};C.useImperativeHandle=function(e,t,r){return ne.current.useImperativeHandle(e,t,r)};C.useInsertionEffect=function(e,t){return ne.current.useInsertionEffect(e,t)};C.useLayoutEffect=function(e,t){return ne.current.useLayoutEffect(e,t)};C.useMemo=function(e,t){return ne.current.useMemo(e,t)};C.useReducer=function(e,t,r){return ne.current.useReducer(e,t,r)};C.useRef=function(e){return ne.current.useRef(e)};C.useState=function(e){return ne.current.useState(e)};C.useSyncExternalStore=function(e,t,r){return ne.current.useSyncExternalStore(e,t,r)};C.useTransition=function(){return ne.current.useTransition()};C.version="18.3.1"});var ur=Ne((mf,gs)=>{"use strict";gs.exports=fs()});var _s=Ne(z=>{"use strict";function Oi(e,t){var r=e.length;e.push(t);e:for(;0<r;){var n=r-1>>>1,i=e[n];if(0<cn(i,t))e[n]=t,e[r]=i,r=n;else break e}}function Ee(e){return e.length===0?null:e[0]}function pn(e){if(e.length===0)return null;var t=e[0],r=e.pop();if(r!==t){e[0]=r;e:for(var n=0,i=e.length,a=i>>>1;n<a;){var o=2*(n+1)-1,s=e[o],l=o+1,d=e[l];if(0>cn(s,r))l<i&&0>cn(d,s)?(e[n]=d,e[l]=r,n=l):(e[n]=s,e[o]=r,n=o);else if(l<i&&0>cn(d,r))e[n]=d,e[l]=r,n=l;else break e}}return t}function cn(e,t){var r=e.sortIndex-t.sortIndex;return r!==0?r:e.id-t.id}typeof performance=="object"&&typeof performance.now=="function"?(hs=performance,z.unstable_now=function(){return hs.now()}):(Bi=Date,ms=Bi.now(),z.unstable_now=function(){return Bi.now()-ms});var hs,Bi,ms,Le=[],Ze=[],H0=1,xe=null,J=3,un=!1,xt=!1,gr=!1,ws=typeof setTimeout=="function"?setTimeout:null,bs=typeof clearTimeout=="function"?clearTimeout:null,vs=typeof setImmediate<"u"?setImmediate:null;typeof navigator<"u"&&navigator.scheduling!==void 0&&navigator.scheduling.isInputPending!==void 0&&navigator.scheduling.isInputPending.bind(navigator.scheduling);function qi(e){for(var t=Ee(Ze);t!==null;){if(t.callback===null)pn(Ze);else if(t.startTime<=e)pn(Ze),t.sortIndex=t.expirationTime,Oi(Le,t);else break;t=Ee(Ze)}}function ji(e){if(gr=!1,qi(e),!xt)if(Ee(Le)!==null)xt=!0,Ui(Wi);else{var t=Ee(Ze);t!==null&&Gi(ji,t.startTime-e)}}function Wi(e,t){xt=!1,gr&&(gr=!1,bs(hr),hr=-1),un=!0;var r=J;try{for(qi(t),xe=Ee(Le);xe!==null&&(!(xe.expirationTime>t)||e&&!Ss());){var n=xe.callback;if(typeof n=="function"){xe.callback=null,J=xe.priorityLevel;var i=n(xe.expirationTime<=t);t=z.unstable_now(),typeof i=="function"?xe.callback=i:xe===Ee(Le)&&pn(Le),qi(t)}else pn(Le);xe=Ee(Le)}if(xe!==null)var a=!0;else{var o=Ee(Ze);o!==null&&Gi(ji,o.startTime-t),a=!1}return a}finally{xe=null,J=r,un=!1}}var fn=!1,dn=null,hr=-1,ys=5,ks=-1;function Ss(){return!(z.unstable_now()-ks<ys)}function Hi(){if(dn!==null){var e=z.unstable_now();ks=e;var t=!0;try{t=dn(!0,e)}finally{t?fr():(fn=!1,dn=null)}}else fn=!1}var fr;typeof vs=="function"?fr=function(){vs(Hi)}:typeof MessageChannel<"u"?(Ni=new MessageChannel,xs=Ni.port2,Ni.port1.onmessage=Hi,fr=function(){xs.postMessage(null)}):fr=function(){ws(Hi,0)};var Ni,xs;function Ui(e){dn=e,fn||(fn=!0,fr())}function Gi(e,t){hr=ws(function(){e(z.unstable_now())},t)}z.unstable_IdlePriority=5;z.unstable_ImmediatePriority=1;z.unstable_LowPriority=4;z.unstable_NormalPriority=3;z.unstable_Profiling=null;z.unstable_UserBlockingPriority=2;z.unstable_cancelCallback=function(e){e.callback=null};z.unstable_continueExecution=function(){xt||un||(xt=!0,Ui(Wi))};z.unstable_forceFrameRate=function(e){0>e||125<e?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):ys=0<e?Math.floor(1e3/e):5};z.unstable_getCurrentPriorityLevel=function(){return J};z.unstable_getFirstCallbackNode=function(){return Ee(Le)};z.unstable_next=function(e){switch(J){case 1:case 2:case 3:var t=3;break;default:t=J}var r=J;J=t;try{return e()}finally{J=r}};z.unstable_pauseExecution=function(){};z.unstable_requestPaint=function(){};z.unstable_runWithPriority=function(e,t){switch(e){case 1:case 2:case 3:case 4:case 5:break;default:e=3}var r=J;J=e;try{return t()}finally{J=r}};z.unstable_scheduleCallback=function(e,t,r){var n=z.unstable_now();switch(typeof r=="object"&&r!==null?(r=r.delay,r=typeof r=="number"&&0<r?n+r:n):r=n,e){case 1:var i=-1;break;case 2:i=250;break;case 5:i=1073741823;break;case 4:i=1e4;break;default:i=5e3}return i=r+i,e={id:H0++,callback:t,priorityLevel:e,startTime:r,expirationTime:i,sortIndex:-1},r>n?(e.sortIndex=r,Oi(Ze,e),Ee(Le)===null&&e===Ee(Ze)&&(gr?(bs(hr),hr=-1):gr=!0,Gi(ji,r-n))):(e.sortIndex=i,Oi(Le,e),xt||un||(xt=!0,Ui(Wi))),e};z.unstable_shouldYield=Ss;z.unstable_wrapCallback=function(e){var t=J;return function(){var r=J;J=t;try{return e.apply(this,arguments)}finally{J=r}}}});var Cs=Ne((xf,Es)=>{"use strict";Es.exports=_s()});var Rd=Ne(ve=>{"use strict";var N0=ur(),he=Cs();function v(e){for(var t="https://reactjs.org/docs/error-decoder.html?invariant="+e,r=1;r<arguments.length;r++)t+="&args[]="+encodeURIComponent(arguments[r]);return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}var Ll=new Set,Br={};function zt(e,t){rr(e,t),rr(e+"Capture",t)}function rr(e,t){for(Br[e]=t,e=0;e<t.length;e++)Ll.add(t[e])}var Ge=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),ga=Object.prototype.hasOwnProperty,O0=/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,Ts={},As={};function q0(e){return ga.call(As,e)?!0:ga.call(Ts,e)?!1:O0.test(e)?As[e]=!0:(Ts[e]=!0,!1)}function j0(e,t,r,n){if(r!==null&&r.type===0)return!1;switch(typeof t){case"function":case"symbol":return!0;case"boolean":return n?!1:r!==null?!r.acceptsBooleans:(e=e.toLowerCase().slice(0,5),e!=="data-"&&e!=="aria-");default:return!1}}function W0(e,t,r,n){if(t===null||typeof t>"u"||j0(e,t,r,n))return!0;if(n)return!1;if(r!==null)switch(r.type){case 3:return!t;case 4:return t===!1;case 5:return isNaN(t);case 6:return isNaN(t)||1>t}return!1}function oe(e,t,r,n,i,a,o){this.acceptsBooleans=t===2||t===3||t===4,this.attributeName=n,this.attributeNamespace=i,this.mustUseProperty=r,this.propertyName=e,this.type=t,this.sanitizeURL=a,this.removeEmptyString=o}var Z={};"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e){Z[e]=new oe(e,0,!1,e,null,!1,!1)});[["acceptCharset","accept-charset"],["className","class"],["htmlFor","for"],["httpEquiv","http-equiv"]].forEach(function(e){var t=e[0];Z[t]=new oe(t,1,!1,e[1],null,!1,!1)});["contentEditable","draggable","spellCheck","value"].forEach(function(e){Z[e]=new oe(e,2,!1,e.toLowerCase(),null,!1,!1)});["autoReverse","externalResourcesRequired","focusable","preserveAlpha"].forEach(function(e){Z[e]=new oe(e,2,!1,e,null,!1,!1)});"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e){Z[e]=new oe(e,3,!1,e.toLowerCase(),null,!1,!1)});["checked","multiple","muted","selected"].forEach(function(e){Z[e]=new oe(e,3,!0,e,null,!1,!1)});["capture","download"].forEach(function(e){Z[e]=new oe(e,4,!1,e,null,!1,!1)});["cols","rows","size","span"].forEach(function(e){Z[e]=new oe(e,6,!1,e,null,!1,!1)});["rowSpan","start"].forEach(function(e){Z[e]=new oe(e,5,!1,e.toLowerCase(),null,!1,!1)});var oo=/[\-:]([a-z])/g;function so(e){return e[1].toUpperCase()}"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e){var t=e.replace(oo,so);Z[t]=new oe(t,1,!1,e,null,!1,!1)});"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e){var t=e.replace(oo,so);Z[t]=new oe(t,1,!1,e,"http://www.w3.org/1999/xlink",!1,!1)});["xml:base","xml:lang","xml:space"].forEach(function(e){var t=e.replace(oo,so);Z[t]=new oe(t,1,!1,e,"http://www.w3.org/XML/1998/namespace",!1,!1)});["tabIndex","crossOrigin"].forEach(function(e){Z[e]=new oe(e,1,!1,e.toLowerCase(),null,!1,!1)});Z.xlinkHref=new oe("xlinkHref",1,!1,"xlink:href","http://www.w3.org/1999/xlink",!0,!1);["src","href","action","formAction"].forEach(function(e){Z[e]=new oe(e,1,!1,e.toLowerCase(),null,!0,!0)});function lo(e,t,r,n){var i=Z.hasOwnProperty(t)?Z[t]:null;(i!==null?i.type!==0:n||!(2<t.length)||t[0]!=="o"&&t[0]!=="O"||t[1]!=="n"&&t[1]!=="N")&&(W0(t,r,i,n)&&(r=null),n||i===null?q0(t)&&(r===null?e.removeAttribute(t):e.setAttribute(t,""+r)):i.mustUseProperty?e[i.propertyName]=r===null?i.type===3?!1:"":r:(t=i.attributeName,n=i.attributeNamespace,r===null?e.removeAttribute(t):(i=i.type,r=i===3||i===4&&r===!0?"":""+r,n?e.setAttributeNS(n,t,r):e.setAttribute(t,r))))}var Qe=N0.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,gn=Symbol.for("react.element"),Ht=Symbol.for("react.portal"),Nt=Symbol.for("react.fragment"),co=Symbol.for("react.strict_mode"),ha=Symbol.for("react.profiler"),Fl=Symbol.for("react.provider"),Il=Symbol.for("react.context"),po=Symbol.for("react.forward_ref"),ma=Symbol.for("react.suspense"),va=Symbol.for("react.suspense_list"),uo=Symbol.for("react.memo"),$e=Symbol.for("react.lazy"),Dl=Symbol.for("react.offscreen"),Ms=Symbol.iterator;function mr(e){return e===null||typeof e!="object"?null:(e=Ms&&e[Ms]||e["@@iterator"],typeof e=="function"?e:null)}var O=Object.assign,Vi;function _r(e){if(Vi===void 0)try{throw Error()}catch(r){var t=r.stack.trim().match(/\n( *(at )?)/);Vi=t&&t[1]||""}return`
`+Vi+e}var Yi=!1;function Xi(e,t){if(!e||Yi)return"";Yi=!0;var r=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{if(t)if(t=function(){throw Error()},Object.defineProperty(t.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(t,[])}catch(d){var n=d}Reflect.construct(e,[],t)}else{try{t.call()}catch(d){n=d}e.call(t.prototype)}else{try{throw Error()}catch(d){n=d}e()}}catch(d){if(d&&n&&typeof d.stack=="string"){for(var i=d.stack.split(`
`),a=n.stack.split(`
`),o=i.length-1,s=a.length-1;1<=o&&0<=s&&i[o]!==a[s];)s--;for(;1<=o&&0<=s;o--,s--)if(i[o]!==a[s]){if(o!==1||s!==1)do if(o--,s--,0>s||i[o]!==a[s]){var l=`
`+i[o].replace(" at new "," at ");return e.displayName&&l.includes("<anonymous>")&&(l=l.replace("<anonymous>",e.displayName)),l}while(1<=o&&0<=s);break}}}finally{Yi=!1,Error.prepareStackTrace=r}return(e=e?e.displayName||e.name:"")?_r(e):""}function U0(e){switch(e.tag){case 5:return _r(e.type);case 16:return _r("Lazy");case 13:return _r("Suspense");case 19:return _r("SuspenseList");case 0:case 2:case 15:return e=Xi(e.type,!1),e;case 11:return e=Xi(e.type.render,!1),e;case 1:return e=Xi(e.type,!0),e;default:return""}}function xa(e){if(e==null)return null;if(typeof e=="function")return e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case Nt:return"Fragment";case Ht:return"Portal";case ha:return"Profiler";case co:return"StrictMode";case ma:return"Suspense";case va:return"SuspenseList"}if(typeof e=="object")switch(e.$$typeof){case Il:return(e.displayName||"Context")+".Consumer";case Fl:return(e._context.displayName||"Context")+".Provider";case po:var t=e.render;return e=e.displayName,e||(e=t.displayName||t.name||"",e=e!==""?"ForwardRef("+e+")":"ForwardRef"),e;case uo:return t=e.displayName||null,t!==null?t:xa(e.type)||"Memo";case $e:t=e._payload,e=e._init;try{return xa(e(t))}catch{}}return null}function G0(e){var t=e.type;switch(e.tag){case 24:return"Cache";case 9:return(t.displayName||"Context")+".Consumer";case 10:return(t._context.displayName||"Context")+".Provider";case 18:return"DehydratedFragment";case 11:return e=t.render,e=e.displayName||e.name||"",t.displayName||(e!==""?"ForwardRef("+e+")":"ForwardRef");case 7:return"Fragment";case 5:return t;case 4:return"Portal";case 3:return"Root";case 6:return"Text";case 16:return xa(t);case 8:return t===co?"StrictMode":"Mode";case 22:return"Offscreen";case 12:return"Profiler";case 21:return"Scope";case 13:return"Suspense";case 19:return"SuspenseList";case 25:return"TracingMarker";case 1:case 0:case 17:case 2:case 14:case 15:if(typeof t=="function")return t.displayName||t.name||null;if(typeof t=="string")return t}return null}function ft(e){switch(typeof e){case"boolean":case"number":case"string":case"undefined":return e;case"object":return e;default:return""}}function Bl(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(t==="checkbox"||t==="radio")}function V0(e){var t=Bl(e)?"checked":"value",r=Object.getOwnPropertyDescriptor(e.constructor.prototype,t),n=""+e[t];if(!e.hasOwnProperty(t)&&typeof r<"u"&&typeof r.get=="function"&&typeof r.set=="function"){var i=r.get,a=r.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return i.call(this)},set:function(o){n=""+o,a.call(this,o)}}),Object.defineProperty(e,t,{enumerable:r.enumerable}),{getValue:function(){return n},setValue:function(o){n=""+o},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}function hn(e){e._valueTracker||(e._valueTracker=V0(e))}function Hl(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var r=t.getValue(),n="";return e&&(n=Bl(e)?e.checked?"true":"false":e.value),e=n,e!==r?(t.setValue(e),!0):!1}function Wn(e){if(e=e||(typeof document<"u"?document:void 0),typeof e>"u")return null;try{return e.activeElement||e.body}catch{return e.body}}function wa(e,t){var r=t.checked;return O({},t,{defaultChecked:void 0,defaultValue:void 0,value:void 0,checked:r??e._wrapperState.initialChecked})}function Rs(e,t){var r=t.defaultValue==null?"":t.defaultValue,n=t.checked!=null?t.checked:t.defaultChecked;r=ft(t.value!=null?t.value:r),e._wrapperState={initialChecked:n,initialValue:r,controlled:t.type==="checkbox"||t.type==="radio"?t.checked!=null:t.value!=null}}function Nl(e,t){t=t.checked,t!=null&&lo(e,"checked",t,!1)}function ba(e,t){Nl(e,t);var r=ft(t.value),n=t.type;if(r!=null)n==="number"?(r===0&&e.value===""||e.value!=r)&&(e.value=""+r):e.value!==""+r&&(e.value=""+r);else if(n==="submit"||n==="reset"){e.removeAttribute("value");return}t.hasOwnProperty("value")?ya(e,t.type,r):t.hasOwnProperty("defaultValue")&&ya(e,t.type,ft(t.defaultValue)),t.checked==null&&t.defaultChecked!=null&&(e.defaultChecked=!!t.defaultChecked)}function zs(e,t,r){if(t.hasOwnProperty("value")||t.hasOwnProperty("defaultValue")){var n=t.type;if(!(n!=="submit"&&n!=="reset"||t.value!==void 0&&t.value!==null))return;t=""+e._wrapperState.initialValue,r||t===e.value||(e.value=t),e.defaultValue=t}r=e.name,r!==""&&(e.name=""),e.defaultChecked=!!e._wrapperState.initialChecked,r!==""&&(e.name=r)}function ya(e,t,r){(t!=="number"||Wn(e.ownerDocument)!==e)&&(r==null?e.defaultValue=""+e._wrapperState.initialValue:e.defaultValue!==""+r&&(e.defaultValue=""+r))}var Er=Array.isArray;function Kt(e,t,r,n){if(e=e.options,t){t={};for(var i=0;i<r.length;i++)t["$"+r[i]]=!0;for(r=0;r<e.length;r++)i=t.hasOwnProperty("$"+e[r].value),e[r].selected!==i&&(e[r].selected=i),i&&n&&(e[r].defaultSelected=!0)}else{for(r=""+ft(r),t=null,i=0;i<e.length;i++){if(e[i].value===r){e[i].selected=!0,n&&(e[i].defaultSelected=!0);return}t!==null||e[i].disabled||(t=e[i])}t!==null&&(t.selected=!0)}}function ka(e,t){if(t.dangerouslySetInnerHTML!=null)throw Error(v(91));return O({},t,{value:void 0,defaultValue:void 0,children:""+e._wrapperState.initialValue})}function Ps(e,t){var r=t.value;if(r==null){if(r=t.children,t=t.defaultValue,r!=null){if(t!=null)throw Error(v(92));if(Er(r)){if(1<r.length)throw Error(v(93));r=r[0]}t=r}t==null&&(t=""),r=t}e._wrapperState={initialValue:ft(r)}}function Ol(e,t){var r=ft(t.value),n=ft(t.defaultValue);r!=null&&(r=""+r,r!==e.value&&(e.value=r),t.defaultValue==null&&e.defaultValue!==r&&(e.defaultValue=r)),n!=null&&(e.defaultValue=""+n)}function Ls(e){var t=e.textContent;t===e._wrapperState.initialValue&&t!==""&&t!==null&&(e.value=t)}function ql(e){switch(e){case"svg":return"http://www.w3.org/2000/svg";case"math":return"http://www.w3.org/1998/Math/MathML";default:return"http://www.w3.org/1999/xhtml"}}function Sa(e,t){return e==null||e==="http://www.w3.org/1999/xhtml"?ql(t):e==="http://www.w3.org/2000/svg"&&t==="foreignObject"?"http://www.w3.org/1999/xhtml":e}var mn,jl=(function(e){return typeof MSApp<"u"&&MSApp.execUnsafeLocalFunction?function(t,r,n,i){MSApp.execUnsafeLocalFunction(function(){return e(t,r,n,i)})}:e})(function(e,t){if(e.namespaceURI!=="http://www.w3.org/2000/svg"||"innerHTML"in e)e.innerHTML=t;else{for(mn=mn||document.createElement("div"),mn.innerHTML="<svg>"+t.valueOf().toString()+"</svg>",t=mn.firstChild;e.firstChild;)e.removeChild(e.firstChild);for(;t.firstChild;)e.appendChild(t.firstChild)}});function Hr(e,t){if(t){var r=e.firstChild;if(r&&r===e.lastChild&&r.nodeType===3){r.nodeValue=t;return}}e.textContent=t}var Ar={animationIterationCount:!0,aspectRatio:!0,borderImageOutset:!0,borderImageSlice:!0,borderImageWidth:!0,boxFlex:!0,boxFlexGroup:!0,boxOrdinalGroup:!0,columnCount:!0,columns:!0,flex:!0,flexGrow:!0,flexPositive:!0,flexShrink:!0,flexNegative:!0,flexOrder:!0,gridArea:!0,gridRow:!0,gridRowEnd:!0,gridRowSpan:!0,gridRowStart:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnSpan:!0,gridColumnStart:!0,fontWeight:!0,lineClamp:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,tabSize:!0,widows:!0,zIndex:!0,zoom:!0,fillOpacity:!0,floodOpacity:!0,stopOpacity:!0,strokeDasharray:!0,strokeDashoffset:!0,strokeMiterlimit:!0,strokeOpacity:!0,strokeWidth:!0},Y0=["Webkit","ms","Moz","O"];Object.keys(Ar).forEach(function(e){Y0.forEach(function(t){t=t+e.charAt(0).toUpperCase()+e.substring(1),Ar[t]=Ar[e]})});function Wl(e,t,r){return t==null||typeof t=="boolean"||t===""?"":r||typeof t!="number"||t===0||Ar.hasOwnProperty(e)&&Ar[e]?(""+t).trim():t+"px"}function Ul(e,t){e=e.style;for(var r in t)if(t.hasOwnProperty(r)){var n=r.indexOf("--")===0,i=Wl(r,t[r],n);r==="float"&&(r="cssFloat"),n?e.setProperty(r,i):e[r]=i}}var X0=O({menuitem:!0},{area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});function _a(e,t){if(t){if(X0[e]&&(t.children!=null||t.dangerouslySetInnerHTML!=null))throw Error(v(137,e));if(t.dangerouslySetInnerHTML!=null){if(t.children!=null)throw Error(v(60));if(typeof t.dangerouslySetInnerHTML!="object"||!("__html"in t.dangerouslySetInnerHTML))throw Error(v(61))}if(t.style!=null&&typeof t.style!="object")throw Error(v(62))}}function Ea(e,t){if(e.indexOf("-")===-1)return typeof t.is=="string";switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var Ca=null;function fo(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var Ta=null,Zt=null,Jt=null;function Fs(e){if(e=rn(e)){if(typeof Ta!="function")throw Error(v(280));var t=e.stateNode;t&&(t=vi(t),Ta(e.stateNode,e.type,t))}}function Gl(e){Zt?Jt?Jt.push(e):Jt=[e]:Zt=e}function Vl(){if(Zt){var e=Zt,t=Jt;if(Jt=Zt=null,Fs(e),t)for(e=0;e<t.length;e++)Fs(t[e])}}function Yl(e,t){return e(t)}function Xl(){}var Qi=!1;function Ql(e,t,r){if(Qi)return e(t,r);Qi=!0;try{return Yl(e,t,r)}finally{Qi=!1,(Zt!==null||Jt!==null)&&(Xl(),Vl())}}function Nr(e,t){var r=e.stateNode;if(r===null)return null;var n=vi(r);if(n===null)return null;r=n[t];e:switch(t){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(n=!n.disabled)||(e=e.type,n=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!n;break e;default:e=!1}if(e)return null;if(r&&typeof r!="function")throw Error(v(231,t,typeof r));return r}var Aa=!1;if(Ge)try{Dt={},Object.defineProperty(Dt,"passive",{get:function(){Aa=!0}}),window.addEventListener("test",Dt,Dt),window.removeEventListener("test",Dt,Dt)}catch{Aa=!1}var Dt;function Q0(e,t,r,n,i,a,o,s,l){var d=Array.prototype.slice.call(arguments,3);try{t.apply(r,d)}catch(f){this.onError(f)}}var Mr=!1,Un=null,Gn=!1,Ma=null,K0={onError:function(e){Mr=!0,Un=e}};function Z0(e,t,r,n,i,a,o,s,l){Mr=!1,Un=null,Q0.apply(K0,arguments)}function J0(e,t,r,n,i,a,o,s,l){if(Z0.apply(this,arguments),Mr){if(Mr){var d=Un;Mr=!1,Un=null}else throw Error(v(198));Gn||(Gn=!0,Ma=d)}}function Pt(e){var t=e,r=e;if(e.alternate)for(;t.return;)t=t.return;else{e=t;do t=e,(t.flags&4098)!==0&&(r=t.return),e=t.return;while(e)}return t.tag===3?r:null}function Kl(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function Is(e){if(Pt(e)!==e)throw Error(v(188))}function $0(e){var t=e.alternate;if(!t){if(t=Pt(e),t===null)throw Error(v(188));return t!==e?null:e}for(var r=e,n=t;;){var i=r.return;if(i===null)break;var a=i.alternate;if(a===null){if(n=i.return,n!==null){r=n;continue}break}if(i.child===a.child){for(a=i.child;a;){if(a===r)return Is(i),e;if(a===n)return Is(i),t;a=a.sibling}throw Error(v(188))}if(r.return!==n.return)r=i,n=a;else{for(var o=!1,s=i.child;s;){if(s===r){o=!0,r=i,n=a;break}if(s===n){o=!0,n=i,r=a;break}s=s.sibling}if(!o){for(s=a.child;s;){if(s===r){o=!0,r=a,n=i;break}if(s===n){o=!0,n=a,r=i;break}s=s.sibling}if(!o)throw Error(v(189))}}if(r.alternate!==n)throw Error(v(190))}if(r.tag!==3)throw Error(v(188));return r.stateNode.current===r?e:t}function Zl(e){return e=$0(e),e!==null?Jl(e):null}function Jl(e){if(e.tag===5||e.tag===6)return e;for(e=e.child;e!==null;){var t=Jl(e);if(t!==null)return t;e=e.sibling}return null}var $l=he.unstable_scheduleCallback,Ds=he.unstable_cancelCallback,ep=he.unstable_shouldYield,tp=he.unstable_requestPaint,j=he.unstable_now,rp=he.unstable_getCurrentPriorityLevel,go=he.unstable_ImmediatePriority,ec=he.unstable_UserBlockingPriority,Vn=he.unstable_NormalPriority,np=he.unstable_LowPriority,tc=he.unstable_IdlePriority,fi=null,Be=null;function ip(e){if(Be&&typeof Be.onCommitFiberRoot=="function")try{Be.onCommitFiberRoot(fi,e,void 0,(e.current.flags&128)===128)}catch{}}var Re=Math.clz32?Math.clz32:sp,ap=Math.log,op=Math.LN2;function sp(e){return e>>>=0,e===0?32:31-(ap(e)/op|0)|0}var vn=64,xn=4194304;function Cr(e){switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return e&4194240;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return e&130023424;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 1073741824;default:return e}}function Yn(e,t){var r=e.pendingLanes;if(r===0)return 0;var n=0,i=e.suspendedLanes,a=e.pingedLanes,o=r&268435455;if(o!==0){var s=o&~i;s!==0?n=Cr(s):(a&=o,a!==0&&(n=Cr(a)))}else o=r&~i,o!==0?n=Cr(o):a!==0&&(n=Cr(a));if(n===0)return 0;if(t!==0&&t!==n&&(t&i)===0&&(i=n&-n,a=t&-t,i>=a||i===16&&(a&4194240)!==0))return t;if((n&4)!==0&&(n|=r&16),t=e.entangledLanes,t!==0)for(e=e.entanglements,t&=n;0<t;)r=31-Re(t),i=1<<r,n|=e[r],t&=~i;return n}function lp(e,t){switch(e){case 1:case 2:case 4:return t+250;case 8:case 16:case 32:case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t+5e3;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return-1;case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function cp(e,t){for(var r=e.suspendedLanes,n=e.pingedLanes,i=e.expirationTimes,a=e.pendingLanes;0<a;){var o=31-Re(a),s=1<<o,l=i[o];l===-1?((s&r)===0||(s&n)!==0)&&(i[o]=lp(s,t)):l<=t&&(e.expiredLanes|=s),a&=~s}}function Ra(e){return e=e.pendingLanes&-1073741825,e!==0?e:e&1073741824?1073741824:0}function rc(){var e=vn;return vn<<=1,(vn&4194240)===0&&(vn=64),e}function Ki(e){for(var t=[],r=0;31>r;r++)t.push(e);return t}function en(e,t,r){e.pendingLanes|=t,t!==536870912&&(e.suspendedLanes=0,e.pingedLanes=0),e=e.eventTimes,t=31-Re(t),e[t]=r}function dp(e,t){var r=e.pendingLanes&~t;e.pendingLanes=t,e.suspendedLanes=0,e.pingedLanes=0,e.expiredLanes&=t,e.mutableReadLanes&=t,e.entangledLanes&=t,t=e.entanglements;var n=e.eventTimes;for(e=e.expirationTimes;0<r;){var i=31-Re(r),a=1<<i;t[i]=0,n[i]=-1,e[i]=-1,r&=~a}}function ho(e,t){var r=e.entangledLanes|=t;for(e=e.entanglements;r;){var n=31-Re(r),i=1<<n;i&t|e[n]&t&&(e[n]|=t),r&=~i}}var R=0;function nc(e){return e&=-e,1<e?4<e?(e&268435455)!==0?16:536870912:4:1}var ic,mo,ac,oc,sc,za=!1,wn=[],at=null,ot=null,st=null,Or=new Map,qr=new Map,tt=[],pp="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");function Bs(e,t){switch(e){case"focusin":case"focusout":at=null;break;case"dragenter":case"dragleave":ot=null;break;case"mouseover":case"mouseout":st=null;break;case"pointerover":case"pointerout":Or.delete(t.pointerId);break;case"gotpointercapture":case"lostpointercapture":qr.delete(t.pointerId)}}function vr(e,t,r,n,i,a){return e===null||e.nativeEvent!==a?(e={blockedOn:t,domEventName:r,eventSystemFlags:n,nativeEvent:a,targetContainers:[i]},t!==null&&(t=rn(t),t!==null&&mo(t)),e):(e.eventSystemFlags|=n,t=e.targetContainers,i!==null&&t.indexOf(i)===-1&&t.push(i),e)}function up(e,t,r,n,i){switch(t){case"focusin":return at=vr(at,e,t,r,n,i),!0;case"dragenter":return ot=vr(ot,e,t,r,n,i),!0;case"mouseover":return st=vr(st,e,t,r,n,i),!0;case"pointerover":var a=i.pointerId;return Or.set(a,vr(Or.get(a)||null,e,t,r,n,i)),!0;case"gotpointercapture":return a=i.pointerId,qr.set(a,vr(qr.get(a)||null,e,t,r,n,i)),!0}return!1}function lc(e){var t=yt(e.target);if(t!==null){var r=Pt(t);if(r!==null){if(t=r.tag,t===13){if(t=Kl(r),t!==null){e.blockedOn=t,sc(e.priority,function(){ac(r)});return}}else if(t===3&&r.stateNode.current.memoizedState.isDehydrated){e.blockedOn=r.tag===3?r.stateNode.containerInfo:null;return}}}e.blockedOn=null}function Ln(e){if(e.blockedOn!==null)return!1;for(var t=e.targetContainers;0<t.length;){var r=Pa(e.domEventName,e.eventSystemFlags,t[0],e.nativeEvent);if(r===null){r=e.nativeEvent;var n=new r.constructor(r.type,r);Ca=n,r.target.dispatchEvent(n),Ca=null}else return t=rn(r),t!==null&&mo(t),e.blockedOn=r,!1;t.shift()}return!0}function Hs(e,t,r){Ln(e)&&r.delete(t)}function fp(){za=!1,at!==null&&Ln(at)&&(at=null),ot!==null&&Ln(ot)&&(ot=null),st!==null&&Ln(st)&&(st=null),Or.forEach(Hs),qr.forEach(Hs)}function xr(e,t){e.blockedOn===t&&(e.blockedOn=null,za||(za=!0,he.unstable_scheduleCallback(he.unstable_NormalPriority,fp)))}function jr(e){function t(i){return xr(i,e)}if(0<wn.length){xr(wn[0],e);for(var r=1;r<wn.length;r++){var n=wn[r];n.blockedOn===e&&(n.blockedOn=null)}}for(at!==null&&xr(at,e),ot!==null&&xr(ot,e),st!==null&&xr(st,e),Or.forEach(t),qr.forEach(t),r=0;r<tt.length;r++)n=tt[r],n.blockedOn===e&&(n.blockedOn=null);for(;0<tt.length&&(r=tt[0],r.blockedOn===null);)lc(r),r.blockedOn===null&&tt.shift()}var $t=Qe.ReactCurrentBatchConfig,Xn=!0;function gp(e,t,r,n){var i=R,a=$t.transition;$t.transition=null;try{R=1,vo(e,t,r,n)}finally{R=i,$t.transition=a}}function hp(e,t,r,n){var i=R,a=$t.transition;$t.transition=null;try{R=4,vo(e,t,r,n)}finally{R=i,$t.transition=a}}function vo(e,t,r,n){if(Xn){var i=Pa(e,t,r,n);if(i===null)na(e,t,n,Qn,r),Bs(e,n);else if(up(i,e,t,r,n))n.stopPropagation();else if(Bs(e,n),t&4&&-1<pp.indexOf(e)){for(;i!==null;){var a=rn(i);if(a!==null&&ic(a),a=Pa(e,t,r,n),a===null&&na(e,t,n,Qn,r),a===i)break;i=a}i!==null&&n.stopPropagation()}else na(e,t,n,null,r)}}var Qn=null;function Pa(e,t,r,n){if(Qn=null,e=fo(n),e=yt(e),e!==null)if(t=Pt(e),t===null)e=null;else if(r=t.tag,r===13){if(e=Kl(t),e!==null)return e;e=null}else if(r===3){if(t.stateNode.current.memoizedState.isDehydrated)return t.tag===3?t.stateNode.containerInfo:null;e=null}else t!==e&&(e=null);return Qn=e,null}function cc(e){switch(e){case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 1;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"toggle":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 4;case"message":switch(rp()){case go:return 1;case ec:return 4;case Vn:case np:return 16;case tc:return 536870912;default:return 16}default:return 16}}var nt=null,xo=null,Fn=null;function dc(){if(Fn)return Fn;var e,t=xo,r=t.length,n,i="value"in nt?nt.value:nt.textContent,a=i.length;for(e=0;e<r&&t[e]===i[e];e++);var o=r-e;for(n=1;n<=o&&t[r-n]===i[a-n];n++);return Fn=i.slice(e,1<n?1-n:void 0)}function In(e){var t=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}function bn(){return!0}function Ns(){return!1}function me(e){function t(r,n,i,a,o){this._reactName=r,this._targetInst=i,this.type=n,this.nativeEvent=a,this.target=o,this.currentTarget=null;for(var s in e)e.hasOwnProperty(s)&&(r=e[s],this[s]=r?r(a):a[s]);return this.isDefaultPrevented=(a.defaultPrevented!=null?a.defaultPrevented:a.returnValue===!1)?bn:Ns,this.isPropagationStopped=Ns,this}return O(t.prototype,{preventDefault:function(){this.defaultPrevented=!0;var r=this.nativeEvent;r&&(r.preventDefault?r.preventDefault():typeof r.returnValue!="unknown"&&(r.returnValue=!1),this.isDefaultPrevented=bn)},stopPropagation:function(){var r=this.nativeEvent;r&&(r.stopPropagation?r.stopPropagation():typeof r.cancelBubble!="unknown"&&(r.cancelBubble=!0),this.isPropagationStopped=bn)},persist:function(){},isPersistent:bn}),t}var cr={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},wo=me(cr),tn=O({},cr,{view:0,detail:0}),mp=me(tn),Zi,Ji,wr,gi=O({},tn,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:bo,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return"movementX"in e?e.movementX:(e!==wr&&(wr&&e.type==="mousemove"?(Zi=e.screenX-wr.screenX,Ji=e.screenY-wr.screenY):Ji=Zi=0,wr=e),Zi)},movementY:function(e){return"movementY"in e?e.movementY:Ji}}),Os=me(gi),vp=O({},gi,{dataTransfer:0}),xp=me(vp),wp=O({},tn,{relatedTarget:0}),$i=me(wp),bp=O({},cr,{animationName:0,elapsedTime:0,pseudoElement:0}),yp=me(bp),kp=O({},cr,{clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),Sp=me(kp),_p=O({},cr,{data:0}),qs=me(_p),Ep={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},Cp={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},Tp={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function Ap(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=Tp[e])?!!t[e]:!1}function bo(){return Ap}var Mp=O({},tn,{key:function(e){if(e.key){var t=Ep[e.key]||e.key;if(t!=="Unidentified")return t}return e.type==="keypress"?(e=In(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?Cp[e.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:bo,charCode:function(e){return e.type==="keypress"?In(e):0},keyCode:function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},which:function(e){return e.type==="keypress"?In(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0}}),Rp=me(Mp),zp=O({},gi,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),js=me(zp),Pp=O({},tn,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:bo}),Lp=me(Pp),Fp=O({},cr,{propertyName:0,elapsedTime:0,pseudoElement:0}),Ip=me(Fp),Dp=O({},gi,{deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0}),Bp=me(Dp),Hp=[9,13,27,32],yo=Ge&&"CompositionEvent"in window,Rr=null;Ge&&"documentMode"in document&&(Rr=document.documentMode);var Np=Ge&&"TextEvent"in window&&!Rr,pc=Ge&&(!yo||Rr&&8<Rr&&11>=Rr),Ws=" ",Us=!1;function uc(e,t){switch(e){case"keyup":return Hp.indexOf(t.keyCode)!==-1;case"keydown":return t.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function fc(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}var Ot=!1;function Op(e,t){switch(e){case"compositionend":return fc(t);case"keypress":return t.which!==32?null:(Us=!0,Ws);case"textInput":return e=t.data,e===Ws&&Us?null:e;default:return null}}function qp(e,t){if(Ot)return e==="compositionend"||!yo&&uc(e,t)?(e=dc(),Fn=xo=nt=null,Ot=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case"compositionend":return pc&&t.locale!=="ko"?null:t.data;default:return null}}var jp={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function Gs(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t==="input"?!!jp[e.type]:t==="textarea"}function gc(e,t,r,n){Gl(n),t=Kn(t,"onChange"),0<t.length&&(r=new wo("onChange","change",null,r,n),e.push({event:r,listeners:t}))}var zr=null,Wr=null;function Wp(e){Ec(e,0)}function hi(e){var t=Wt(e);if(Hl(t))return e}function Up(e,t){if(e==="change")return t}var hc=!1;Ge&&(Ge?(kn="oninput"in document,kn||(ea=document.createElement("div"),ea.setAttribute("oninput","return;"),kn=typeof ea.oninput=="function"),yn=kn):yn=!1,hc=yn&&(!document.documentMode||9<document.documentMode));var yn,kn,ea;function Vs(){zr&&(zr.detachEvent("onpropertychange",mc),Wr=zr=null)}function mc(e){if(e.propertyName==="value"&&hi(Wr)){var t=[];gc(t,Wr,e,fo(e)),Ql(Wp,t)}}function Gp(e,t,r){e==="focusin"?(Vs(),zr=t,Wr=r,zr.attachEvent("onpropertychange",mc)):e==="focusout"&&Vs()}function Vp(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return hi(Wr)}function Yp(e,t){if(e==="click")return hi(t)}function Xp(e,t){if(e==="input"||e==="change")return hi(t)}function Qp(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var Pe=typeof Object.is=="function"?Object.is:Qp;function Ur(e,t){if(Pe(e,t))return!0;if(typeof e!="object"||e===null||typeof t!="object"||t===null)return!1;var r=Object.keys(e),n=Object.keys(t);if(r.length!==n.length)return!1;for(n=0;n<r.length;n++){var i=r[n];if(!ga.call(t,i)||!Pe(e[i],t[i]))return!1}return!0}function Ys(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function Xs(e,t){var r=Ys(e);e=0;for(var n;r;){if(r.nodeType===3){if(n=e+r.textContent.length,e<=t&&n>=t)return{node:r,offset:t-e};e=n}e:{for(;r;){if(r.nextSibling){r=r.nextSibling;break e}r=r.parentNode}r=void 0}r=Ys(r)}}function vc(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?vc(e,t.parentNode):"contains"in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}function xc(){for(var e=window,t=Wn();t instanceof e.HTMLIFrameElement;){try{var r=typeof t.contentWindow.location.href=="string"}catch{r=!1}if(r)e=t.contentWindow;else break;t=Wn(e.document)}return t}function ko(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||t==="textarea"||e.contentEditable==="true")}function Kp(e){var t=xc(),r=e.focusedElem,n=e.selectionRange;if(t!==r&&r&&r.ownerDocument&&vc(r.ownerDocument.documentElement,r)){if(n!==null&&ko(r)){if(t=n.start,e=n.end,e===void 0&&(e=t),"selectionStart"in r)r.selectionStart=t,r.selectionEnd=Math.min(e,r.value.length);else if(e=(t=r.ownerDocument||document)&&t.defaultView||window,e.getSelection){e=e.getSelection();var i=r.textContent.length,a=Math.min(n.start,i);n=n.end===void 0?a:Math.min(n.end,i),!e.extend&&a>n&&(i=n,n=a,a=i),i=Xs(r,a);var o=Xs(r,n);i&&o&&(e.rangeCount!==1||e.anchorNode!==i.node||e.anchorOffset!==i.offset||e.focusNode!==o.node||e.focusOffset!==o.offset)&&(t=t.createRange(),t.setStart(i.node,i.offset),e.removeAllRanges(),a>n?(e.addRange(t),e.extend(o.node,o.offset)):(t.setEnd(o.node,o.offset),e.addRange(t)))}}for(t=[],e=r;e=e.parentNode;)e.nodeType===1&&t.push({element:e,left:e.scrollLeft,top:e.scrollTop});for(typeof r.focus=="function"&&r.focus(),r=0;r<t.length;r++)e=t[r],e.element.scrollLeft=e.left,e.element.scrollTop=e.top}}var Zp=Ge&&"documentMode"in document&&11>=document.documentMode,qt=null,La=null,Pr=null,Fa=!1;function Qs(e,t,r){var n=r.window===r?r.document:r.nodeType===9?r:r.ownerDocument;Fa||qt==null||qt!==Wn(n)||(n=qt,"selectionStart"in n&&ko(n)?n={start:n.selectionStart,end:n.selectionEnd}:(n=(n.ownerDocument&&n.ownerDocument.defaultView||window).getSelection(),n={anchorNode:n.anchorNode,anchorOffset:n.anchorOffset,focusNode:n.focusNode,focusOffset:n.focusOffset}),Pr&&Ur(Pr,n)||(Pr=n,n=Kn(La,"onSelect"),0<n.length&&(t=new wo("onSelect","select",null,t,r),e.push({event:t,listeners:n}),t.target=qt)))}function Sn(e,t){var r={};return r[e.toLowerCase()]=t.toLowerCase(),r["Webkit"+e]="webkit"+t,r["Moz"+e]="moz"+t,r}var jt={animationend:Sn("Animation","AnimationEnd"),animationiteration:Sn("Animation","AnimationIteration"),animationstart:Sn("Animation","AnimationStart"),transitionend:Sn("Transition","TransitionEnd")},ta={},wc={};Ge&&(wc=document.createElement("div").style,"AnimationEvent"in window||(delete jt.animationend.animation,delete jt.animationiteration.animation,delete jt.animationstart.animation),"TransitionEvent"in window||delete jt.transitionend.transition);function mi(e){if(ta[e])return ta[e];if(!jt[e])return e;var t=jt[e],r;for(r in t)if(t.hasOwnProperty(r)&&r in wc)return ta[e]=t[r];return e}var bc=mi("animationend"),yc=mi("animationiteration"),kc=mi("animationstart"),Sc=mi("transitionend"),_c=new Map,Ks="abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");function ht(e,t){_c.set(e,t),zt(t,[e])}for(_n=0;_n<Ks.length;_n++)En=Ks[_n],Zs=En.toLowerCase(),Js=En[0].toUpperCase()+En.slice(1),ht(Zs,"on"+Js);var En,Zs,Js,_n;ht(bc,"onAnimationEnd");ht(yc,"onAnimationIteration");ht(kc,"onAnimationStart");ht("dblclick","onDoubleClick");ht("focusin","onFocus");ht("focusout","onBlur");ht(Sc,"onTransitionEnd");rr("onMouseEnter",["mouseout","mouseover"]);rr("onMouseLeave",["mouseout","mouseover"]);rr("onPointerEnter",["pointerout","pointerover"]);rr("onPointerLeave",["pointerout","pointerover"]);zt("onChange","change click focusin focusout input keydown keyup selectionchange".split(" "));zt("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));zt("onBeforeInput",["compositionend","keypress","textInput","paste"]);zt("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" "));zt("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" "));zt("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var Tr="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),Jp=new Set("cancel close invalid load scroll toggle".split(" ").concat(Tr));function $s(e,t,r){var n=e.type||"unknown-event";e.currentTarget=r,J0(n,t,void 0,e),e.currentTarget=null}function Ec(e,t){t=(t&4)!==0;for(var r=0;r<e.length;r++){var n=e[r],i=n.event;n=n.listeners;e:{var a=void 0;if(t)for(var o=n.length-1;0<=o;o--){var s=n[o],l=s.instance,d=s.currentTarget;if(s=s.listener,l!==a&&i.isPropagationStopped())break e;$s(i,s,d),a=l}else for(o=0;o<n.length;o++){if(s=n[o],l=s.instance,d=s.currentTarget,s=s.listener,l!==a&&i.isPropagationStopped())break e;$s(i,s,d),a=l}}}if(Gn)throw e=Ma,Gn=!1,Ma=null,e}function F(e,t){var r=t[Na];r===void 0&&(r=t[Na]=new Set);var n=e+"__bubble";r.has(n)||(Cc(t,e,2,!1),r.add(n))}function ra(e,t,r){var n=0;t&&(n|=4),Cc(r,e,n,t)}var Cn="_reactListening"+Math.random().toString(36).slice(2);function Gr(e){if(!e[Cn]){e[Cn]=!0,Ll.forEach(function(r){r!=="selectionchange"&&(Jp.has(r)||ra(r,!1,e),ra(r,!0,e))});var t=e.nodeType===9?e:e.ownerDocument;t===null||t[Cn]||(t[Cn]=!0,ra("selectionchange",!1,t))}}function Cc(e,t,r,n){switch(cc(t)){case 1:var i=gp;break;case 4:i=hp;break;default:i=vo}r=i.bind(null,t,r,e),i=void 0,!Aa||t!=="touchstart"&&t!=="touchmove"&&t!=="wheel"||(i=!0),n?i!==void 0?e.addEventListener(t,r,{capture:!0,passive:i}):e.addEventListener(t,r,!0):i!==void 0?e.addEventListener(t,r,{passive:i}):e.addEventListener(t,r,!1)}function na(e,t,r,n,i){var a=n;if((t&1)===0&&(t&2)===0&&n!==null)e:for(;;){if(n===null)return;var o=n.tag;if(o===3||o===4){var s=n.stateNode.containerInfo;if(s===i||s.nodeType===8&&s.parentNode===i)break;if(o===4)for(o=n.return;o!==null;){var l=o.tag;if((l===3||l===4)&&(l=o.stateNode.containerInfo,l===i||l.nodeType===8&&l.parentNode===i))return;o=o.return}for(;s!==null;){if(o=yt(s),o===null)return;if(l=o.tag,l===5||l===6){n=a=o;continue e}s=s.parentNode}}n=n.return}Ql(function(){var d=a,f=fo(r),h=[];e:{var g=_c.get(e);if(g!==void 0){var x=wo,w=e;switch(e){case"keypress":if(In(r)===0)break e;case"keydown":case"keyup":x=Rp;break;case"focusin":w="focus",x=$i;break;case"focusout":w="blur",x=$i;break;case"beforeblur":case"afterblur":x=$i;break;case"click":if(r.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":x=Os;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":x=xp;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":x=Lp;break;case bc:case yc:case kc:x=yp;break;case Sc:x=Ip;break;case"scroll":x=mp;break;case"wheel":x=Bp;break;case"copy":case"cut":case"paste":x=Sp;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":x=js}var y=(t&4)!==0,B=!y&&e==="scroll",p=y?g!==null?g+"Capture":null:g;y=[];for(var c=d,u;c!==null;){u=c;var m=u.stateNode;if(u.tag===5&&m!==null&&(u=m,p!==null&&(m=Nr(c,p),m!=null&&y.push(Vr(c,m,u)))),B)break;c=c.return}0<y.length&&(g=new x(g,w,null,r,f),h.push({event:g,listeners:y}))}}if((t&7)===0){e:{if(g=e==="mouseover"||e==="pointerover",x=e==="mouseout"||e==="pointerout",g&&r!==Ca&&(w=r.relatedTarget||r.fromElement)&&(yt(w)||w[Ve]))break e;if((x||g)&&(g=f.window===f?f:(g=f.ownerDocument)?g.defaultView||g.parentWindow:window,x?(w=r.relatedTarget||r.toElement,x=d,w=w?yt(w):null,w!==null&&(B=Pt(w),w!==B||w.tag!==5&&w.tag!==6)&&(w=null)):(x=null,w=d),x!==w)){if(y=Os,m="onMouseLeave",p="onMouseEnter",c="mouse",(e==="pointerout"||e==="pointerover")&&(y=js,m="onPointerLeave",p="onPointerEnter",c="pointer"),B=x==null?g:Wt(x),u=w==null?g:Wt(w),g=new y(m,c+"leave",x,r,f),g.target=B,g.relatedTarget=u,m=null,yt(f)===d&&(y=new y(p,c+"enter",w,r,f),y.target=u,y.relatedTarget=B,m=y),B=m,x&&w)t:{for(y=x,p=w,c=0,u=y;u;u=Bt(u))c++;for(u=0,m=p;m;m=Bt(m))u++;for(;0<c-u;)y=Bt(y),c--;for(;0<u-c;)p=Bt(p),u--;for(;c--;){if(y===p||p!==null&&y===p.alternate)break t;y=Bt(y),p=Bt(p)}y=null}else y=null;x!==null&&el(h,g,x,y,!1),w!==null&&B!==null&&el(h,B,w,y,!0)}}e:{if(g=d?Wt(d):window,x=g.nodeName&&g.nodeName.toLowerCase(),x==="select"||x==="input"&&g.type==="file")var k=Up;else if(Gs(g))if(hc)k=Xp;else{k=Vp;var _=Gp}else(x=g.nodeName)&&x.toLowerCase()==="input"&&(g.type==="checkbox"||g.type==="radio")&&(k=Yp);if(k&&(k=k(e,d))){gc(h,k,r,f);break e}_&&_(e,g,d),e==="focusout"&&(_=g._wrapperState)&&_.controlled&&g.type==="number"&&ya(g,"number",g.value)}switch(_=d?Wt(d):window,e){case"focusin":(Gs(_)||_.contentEditable==="true")&&(qt=_,La=d,Pr=null);break;case"focusout":Pr=La=qt=null;break;case"mousedown":Fa=!0;break;case"contextmenu":case"mouseup":case"dragend":Fa=!1,Qs(h,r,f);break;case"selectionchange":if(Zp)break;case"keydown":case"keyup":Qs(h,r,f)}var S;if(yo)e:{switch(e){case"compositionstart":var E="onCompositionStart";break e;case"compositionend":E="onCompositionEnd";break e;case"compositionupdate":E="onCompositionUpdate";break e}E=void 0}else Ot?uc(e,r)&&(E="onCompositionEnd"):e==="keydown"&&r.keyCode===229&&(E="onCompositionStart");E&&(pc&&r.locale!=="ko"&&(Ot||E!=="onCompositionStart"?E==="onCompositionEnd"&&Ot&&(S=dc()):(nt=f,xo="value"in nt?nt.value:nt.textContent,Ot=!0)),_=Kn(d,E),0<_.length&&(E=new qs(E,e,null,r,f),h.push({event:E,listeners:_}),S?E.data=S:(S=fc(r),S!==null&&(E.data=S)))),(S=Np?Op(e,r):qp(e,r))&&(d=Kn(d,"onBeforeInput"),0<d.length&&(f=new qs("onBeforeInput","beforeinput",null,r,f),h.push({event:f,listeners:d}),f.data=S))}Ec(h,t)})}function Vr(e,t,r){return{instance:e,listener:t,currentTarget:r}}function Kn(e,t){for(var r=t+"Capture",n=[];e!==null;){var i=e,a=i.stateNode;i.tag===5&&a!==null&&(i=a,a=Nr(e,r),a!=null&&n.unshift(Vr(e,a,i)),a=Nr(e,t),a!=null&&n.push(Vr(e,a,i))),e=e.return}return n}function Bt(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5);return e||null}function el(e,t,r,n,i){for(var a=t._reactName,o=[];r!==null&&r!==n;){var s=r,l=s.alternate,d=s.stateNode;if(l!==null&&l===n)break;s.tag===5&&d!==null&&(s=d,i?(l=Nr(r,a),l!=null&&o.unshift(Vr(r,l,s))):i||(l=Nr(r,a),l!=null&&o.push(Vr(r,l,s)))),r=r.return}o.length!==0&&e.push({event:t,listeners:o})}var $p=/\r\n?/g,eu=/\u0000|\uFFFD/g;function tl(e){return(typeof e=="string"?e:""+e).replace($p,`
`).replace(eu,"")}function Tn(e,t,r){if(t=tl(t),tl(e)!==t&&r)throw Error(v(425))}function Zn(){}var Ia=null,Da=null;function Ba(e,t){return e==="textarea"||e==="noscript"||typeof t.children=="string"||typeof t.children=="number"||typeof t.dangerouslySetInnerHTML=="object"&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}var Ha=typeof setTimeout=="function"?setTimeout:void 0,tu=typeof clearTimeout=="function"?clearTimeout:void 0,rl=typeof Promise=="function"?Promise:void 0,ru=typeof queueMicrotask=="function"?queueMicrotask:typeof rl<"u"?function(e){return rl.resolve(null).then(e).catch(nu)}:Ha;function nu(e){setTimeout(function(){throw e})}function ia(e,t){var r=t,n=0;do{var i=r.nextSibling;if(e.removeChild(r),i&&i.nodeType===8)if(r=i.data,r==="/$"){if(n===0){e.removeChild(i),jr(t);return}n--}else r!=="$"&&r!=="$?"&&r!=="$!"||n++;r=i}while(r);jr(t)}function lt(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break;if(t===8){if(t=e.data,t==="$"||t==="$!"||t==="$?")break;if(t==="/$")return null}}return e}function nl(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var r=e.data;if(r==="$"||r==="$!"||r==="$?"){if(t===0)return e;t--}else r==="/$"&&t++}e=e.previousSibling}return null}var dr=Math.random().toString(36).slice(2),De="__reactFiber$"+dr,Yr="__reactProps$"+dr,Ve="__reactContainer$"+dr,Na="__reactEvents$"+dr,iu="__reactListeners$"+dr,au="__reactHandles$"+dr;function yt(e){var t=e[De];if(t)return t;for(var r=e.parentNode;r;){if(t=r[Ve]||r[De]){if(r=t.alternate,t.child!==null||r!==null&&r.child!==null)for(e=nl(e);e!==null;){if(r=e[De])return r;e=nl(e)}return t}e=r,r=e.parentNode}return null}function rn(e){return e=e[De]||e[Ve],!e||e.tag!==5&&e.tag!==6&&e.tag!==13&&e.tag!==3?null:e}function Wt(e){if(e.tag===5||e.tag===6)return e.stateNode;throw Error(v(33))}function vi(e){return e[Yr]||null}var Oa=[],Ut=-1;function mt(e){return{current:e}}function I(e){0>Ut||(e.current=Oa[Ut],Oa[Ut]=null,Ut--)}function P(e,t){Ut++,Oa[Ut]=e.current,e.current=t}var gt={},re=mt(gt),ce=mt(!1),Ct=gt;function nr(e,t){var r=e.type.contextTypes;if(!r)return gt;var n=e.stateNode;if(n&&n.__reactInternalMemoizedUnmaskedChildContext===t)return n.__reactInternalMemoizedMaskedChildContext;var i={},a;for(a in r)i[a]=t[a];return n&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=t,e.__reactInternalMemoizedMaskedChildContext=i),i}function de(e){return e=e.childContextTypes,e!=null}function Jn(){I(ce),I(re)}function il(e,t,r){if(re.current!==gt)throw Error(v(168));P(re,t),P(ce,r)}function Tc(e,t,r){var n=e.stateNode;if(t=t.childContextTypes,typeof n.getChildContext!="function")return r;n=n.getChildContext();for(var i in n)if(!(i in t))throw Error(v(108,G0(e)||"Unknown",i));return O({},r,n)}function $n(e){return e=(e=e.stateNode)&&e.__reactInternalMemoizedMergedChildContext||gt,Ct=re.current,P(re,e),P(ce,ce.current),!0}function al(e,t,r){var n=e.stateNode;if(!n)throw Error(v(169));r?(e=Tc(e,t,Ct),n.__reactInternalMemoizedMergedChildContext=e,I(ce),I(re),P(re,e)):I(ce),P(ce,r)}var qe=null,xi=!1,aa=!1;function Ac(e){qe===null?qe=[e]:qe.push(e)}function ou(e){xi=!0,Ac(e)}function vt(){if(!aa&&qe!==null){aa=!0;var e=0,t=R;try{var r=qe;for(R=1;e<r.length;e++){var n=r[e];do n=n(!0);while(n!==null)}qe=null,xi=!1}catch(i){throw qe!==null&&(qe=qe.slice(e+1)),$l(go,vt),i}finally{R=t,aa=!1}}return null}var Gt=[],Vt=0,ei=null,ti=0,we=[],be=0,Tt=null,je=1,We="";function wt(e,t){Gt[Vt++]=ti,Gt[Vt++]=ei,ei=e,ti=t}function Mc(e,t,r){we[be++]=je,we[be++]=We,we[be++]=Tt,Tt=e;var n=je;e=We;var i=32-Re(n)-1;n&=~(1<<i),r+=1;var a=32-Re(t)+i;if(30<a){var o=i-i%5;a=(n&(1<<o)-1).toString(32),n>>=o,i-=o,je=1<<32-Re(t)+i|r<<i|n,We=a+e}else je=1<<a|r<<i|n,We=e}function So(e){e.return!==null&&(wt(e,1),Mc(e,1,0))}function _o(e){for(;e===ei;)ei=Gt[--Vt],Gt[Vt]=null,ti=Gt[--Vt],Gt[Vt]=null;for(;e===Tt;)Tt=we[--be],we[be]=null,We=we[--be],we[be]=null,je=we[--be],we[be]=null}var ge=null,fe=null,D=!1,Me=null;function Rc(e,t){var r=ye(5,null,null,0);r.elementType="DELETED",r.stateNode=t,r.return=e,t=e.deletions,t===null?(e.deletions=[r],e.flags|=16):t.push(r)}function ol(e,t){switch(e.tag){case 5:var r=e.type;return t=t.nodeType!==1||r.toLowerCase()!==t.nodeName.toLowerCase()?null:t,t!==null?(e.stateNode=t,ge=e,fe=lt(t.firstChild),!0):!1;case 6:return t=e.pendingProps===""||t.nodeType!==3?null:t,t!==null?(e.stateNode=t,ge=e,fe=null,!0):!1;case 13:return t=t.nodeType!==8?null:t,t!==null?(r=Tt!==null?{id:je,overflow:We}:null,e.memoizedState={dehydrated:t,treeContext:r,retryLane:1073741824},r=ye(18,null,null,0),r.stateNode=t,r.return=e,e.child=r,ge=e,fe=null,!0):!1;default:return!1}}function qa(e){return(e.mode&1)!==0&&(e.flags&128)===0}function ja(e){if(D){var t=fe;if(t){var r=t;if(!ol(e,t)){if(qa(e))throw Error(v(418));t=lt(r.nextSibling);var n=ge;t&&ol(e,t)?Rc(n,r):(e.flags=e.flags&-4097|2,D=!1,ge=e)}}else{if(qa(e))throw Error(v(418));e.flags=e.flags&-4097|2,D=!1,ge=e}}}function sl(e){for(e=e.return;e!==null&&e.tag!==5&&e.tag!==3&&e.tag!==13;)e=e.return;ge=e}function An(e){if(e!==ge)return!1;if(!D)return sl(e),D=!0,!1;var t;if((t=e.tag!==3)&&!(t=e.tag!==5)&&(t=e.type,t=t!=="head"&&t!=="body"&&!Ba(e.type,e.memoizedProps)),t&&(t=fe)){if(qa(e))throw zc(),Error(v(418));for(;t;)Rc(e,t),t=lt(t.nextSibling)}if(sl(e),e.tag===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(v(317));e:{for(e=e.nextSibling,t=0;e;){if(e.nodeType===8){var r=e.data;if(r==="/$"){if(t===0){fe=lt(e.nextSibling);break e}t--}else r!=="$"&&r!=="$!"&&r!=="$?"||t++}e=e.nextSibling}fe=null}}else fe=ge?lt(e.stateNode.nextSibling):null;return!0}function zc(){for(var e=fe;e;)e=lt(e.nextSibling)}function ir(){fe=ge=null,D=!1}function Eo(e){Me===null?Me=[e]:Me.push(e)}var su=Qe.ReactCurrentBatchConfig;function br(e,t,r){if(e=r.ref,e!==null&&typeof e!="function"&&typeof e!="object"){if(r._owner){if(r=r._owner,r){if(r.tag!==1)throw Error(v(309));var n=r.stateNode}if(!n)throw Error(v(147,e));var i=n,a=""+e;return t!==null&&t.ref!==null&&typeof t.ref=="function"&&t.ref._stringRef===a?t.ref:(t=function(o){var s=i.refs;o===null?delete s[a]:s[a]=o},t._stringRef=a,t)}if(typeof e!="string")throw Error(v(284));if(!r._owner)throw Error(v(290,e))}return e}function Mn(e,t){throw e=Object.prototype.toString.call(t),Error(v(31,e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e))}function ll(e){var t=e._init;return t(e._payload)}function Pc(e){function t(p,c){if(e){var u=p.deletions;u===null?(p.deletions=[c],p.flags|=16):u.push(c)}}function r(p,c){if(!e)return null;for(;c!==null;)t(p,c),c=c.sibling;return null}function n(p,c){for(p=new Map;c!==null;)c.key!==null?p.set(c.key,c):p.set(c.index,c),c=c.sibling;return p}function i(p,c){return p=ut(p,c),p.index=0,p.sibling=null,p}function a(p,c,u){return p.index=u,e?(u=p.alternate,u!==null?(u=u.index,u<c?(p.flags|=2,c):u):(p.flags|=2,c)):(p.flags|=1048576,c)}function o(p){return e&&p.alternate===null&&(p.flags|=2),p}function s(p,c,u,m){return c===null||c.tag!==6?(c=ua(u,p.mode,m),c.return=p,c):(c=i(c,u),c.return=p,c)}function l(p,c,u,m){var k=u.type;return k===Nt?f(p,c,u.props.children,m,u.key):c!==null&&(c.elementType===k||typeof k=="object"&&k!==null&&k.$$typeof===$e&&ll(k)===c.type)?(m=i(c,u.props),m.ref=br(p,c,u),m.return=p,m):(m=jn(u.type,u.key,u.props,null,p.mode,m),m.ref=br(p,c,u),m.return=p,m)}function d(p,c,u,m){return c===null||c.tag!==4||c.stateNode.containerInfo!==u.containerInfo||c.stateNode.implementation!==u.implementation?(c=fa(u,p.mode,m),c.return=p,c):(c=i(c,u.children||[]),c.return=p,c)}function f(p,c,u,m,k){return c===null||c.tag!==7?(c=Et(u,p.mode,m,k),c.return=p,c):(c=i(c,u),c.return=p,c)}function h(p,c,u){if(typeof c=="string"&&c!==""||typeof c=="number")return c=ua(""+c,p.mode,u),c.return=p,c;if(typeof c=="object"&&c!==null){switch(c.$$typeof){case gn:return u=jn(c.type,c.key,c.props,null,p.mode,u),u.ref=br(p,null,c),u.return=p,u;case Ht:return c=fa(c,p.mode,u),c.return=p,c;case $e:var m=c._init;return h(p,m(c._payload),u)}if(Er(c)||mr(c))return c=Et(c,p.mode,u,null),c.return=p,c;Mn(p,c)}return null}function g(p,c,u,m){var k=c!==null?c.key:null;if(typeof u=="string"&&u!==""||typeof u=="number")return k!==null?null:s(p,c,""+u,m);if(typeof u=="object"&&u!==null){switch(u.$$typeof){case gn:return u.key===k?l(p,c,u,m):null;case Ht:return u.key===k?d(p,c,u,m):null;case $e:return k=u._init,g(p,c,k(u._payload),m)}if(Er(u)||mr(u))return k!==null?null:f(p,c,u,m,null);Mn(p,u)}return null}function x(p,c,u,m,k){if(typeof m=="string"&&m!==""||typeof m=="number")return p=p.get(u)||null,s(c,p,""+m,k);if(typeof m=="object"&&m!==null){switch(m.$$typeof){case gn:return p=p.get(m.key===null?u:m.key)||null,l(c,p,m,k);case Ht:return p=p.get(m.key===null?u:m.key)||null,d(c,p,m,k);case $e:var _=m._init;return x(p,c,u,_(m._payload),k)}if(Er(m)||mr(m))return p=p.get(u)||null,f(c,p,m,k,null);Mn(c,m)}return null}function w(p,c,u,m){for(var k=null,_=null,S=c,E=c=0,V=null;S!==null&&E<u.length;E++){S.index>E?(V=S,S=null):V=S.sibling;var A=g(p,S,u[E],m);if(A===null){S===null&&(S=V);break}e&&S&&A.alternate===null&&t(p,S),c=a(A,c,E),_===null?k=A:_.sibling=A,_=A,S=V}if(E===u.length)return r(p,S),D&&wt(p,E),k;if(S===null){for(;E<u.length;E++)S=h(p,u[E],m),S!==null&&(c=a(S,c,E),_===null?k=S:_.sibling=S,_=S);return D&&wt(p,E),k}for(S=n(p,S);E<u.length;E++)V=x(S,p,E,u[E],m),V!==null&&(e&&V.alternate!==null&&S.delete(V.key===null?E:V.key),c=a(V,c,E),_===null?k=V:_.sibling=V,_=V);return e&&S.forEach(function(Ke){return t(p,Ke)}),D&&wt(p,E),k}function y(p,c,u,m){var k=mr(u);if(typeof k!="function")throw Error(v(150));if(u=k.call(u),u==null)throw Error(v(151));for(var _=k=null,S=c,E=c=0,V=null,A=u.next();S!==null&&!A.done;E++,A=u.next()){S.index>E?(V=S,S=null):V=S.sibling;var Ke=g(p,S,A.value,m);if(Ke===null){S===null&&(S=V);break}e&&S&&Ke.alternate===null&&t(p,S),c=a(Ke,c,E),_===null?k=Ke:_.sibling=Ke,_=Ke,S=V}if(A.done)return r(p,S),D&&wt(p,E),k;if(S===null){for(;!A.done;E++,A=u.next())A=h(p,A.value,m),A!==null&&(c=a(A,c,E),_===null?k=A:_.sibling=A,_=A);return D&&wt(p,E),k}for(S=n(p,S);!A.done;E++,A=u.next())A=x(S,p,E,A.value,m),A!==null&&(e&&A.alternate!==null&&S.delete(A.key===null?E:A.key),c=a(A,c,E),_===null?k=A:_.sibling=A,_=A);return e&&S.forEach(function(m0){return t(p,m0)}),D&&wt(p,E),k}function B(p,c,u,m){if(typeof u=="object"&&u!==null&&u.type===Nt&&u.key===null&&(u=u.props.children),typeof u=="object"&&u!==null){switch(u.$$typeof){case gn:e:{for(var k=u.key,_=c;_!==null;){if(_.key===k){if(k=u.type,k===Nt){if(_.tag===7){r(p,_.sibling),c=i(_,u.props.children),c.return=p,p=c;break e}}else if(_.elementType===k||typeof k=="object"&&k!==null&&k.$$typeof===$e&&ll(k)===_.type){r(p,_.sibling),c=i(_,u.props),c.ref=br(p,_,u),c.return=p,p=c;break e}r(p,_);break}else t(p,_);_=_.sibling}u.type===Nt?(c=Et(u.props.children,p.mode,m,u.key),c.return=p,p=c):(m=jn(u.type,u.key,u.props,null,p.mode,m),m.ref=br(p,c,u),m.return=p,p=m)}return o(p);case Ht:e:{for(_=u.key;c!==null;){if(c.key===_)if(c.tag===4&&c.stateNode.containerInfo===u.containerInfo&&c.stateNode.implementation===u.implementation){r(p,c.sibling),c=i(c,u.children||[]),c.return=p,p=c;break e}else{r(p,c);break}else t(p,c);c=c.sibling}c=fa(u,p.mode,m),c.return=p,p=c}return o(p);case $e:return _=u._init,B(p,c,_(u._payload),m)}if(Er(u))return w(p,c,u,m);if(mr(u))return y(p,c,u,m);Mn(p,u)}return typeof u=="string"&&u!==""||typeof u=="number"?(u=""+u,c!==null&&c.tag===6?(r(p,c.sibling),c=i(c,u),c.return=p,p=c):(r(p,c),c=ua(u,p.mode,m),c.return=p,p=c),o(p)):r(p,c)}return B}var ar=Pc(!0),Lc=Pc(!1),ri=mt(null),ni=null,Yt=null,Co=null;function To(){Co=Yt=ni=null}function Ao(e){var t=ri.current;I(ri),e._currentValue=t}function Wa(e,t,r){for(;e!==null;){var n=e.alternate;if((e.childLanes&t)!==t?(e.childLanes|=t,n!==null&&(n.childLanes|=t)):n!==null&&(n.childLanes&t)!==t&&(n.childLanes|=t),e===r)break;e=e.return}}function er(e,t){ni=e,Co=Yt=null,e=e.dependencies,e!==null&&e.firstContext!==null&&((e.lanes&t)!==0&&(le=!0),e.firstContext=null)}function Se(e){var t=e._currentValue;if(Co!==e)if(e={context:e,memoizedValue:t,next:null},Yt===null){if(ni===null)throw Error(v(308));Yt=e,ni.dependencies={lanes:0,firstContext:e}}else Yt=Yt.next=e;return t}var kt=null;function Mo(e){kt===null?kt=[e]:kt.push(e)}function Fc(e,t,r,n){var i=t.interleaved;return i===null?(r.next=r,Mo(t)):(r.next=i.next,i.next=r),t.interleaved=r,Ye(e,n)}function Ye(e,t){e.lanes|=t;var r=e.alternate;for(r!==null&&(r.lanes|=t),r=e,e=e.return;e!==null;)e.childLanes|=t,r=e.alternate,r!==null&&(r.childLanes|=t),r=e,e=e.return;return r.tag===3?r.stateNode:null}var et=!1;function Ro(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,interleaved:null,lanes:0},effects:null}}function Ic(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,effects:e.effects})}function Ue(e,t){return{eventTime:e,lane:t,tag:0,payload:null,callback:null,next:null}}function ct(e,t,r){var n=e.updateQueue;if(n===null)return null;if(n=n.shared,(T&2)!==0){var i=n.pending;return i===null?t.next=t:(t.next=i.next,i.next=t),n.pending=t,Ye(e,r)}return i=n.interleaved,i===null?(t.next=t,Mo(n)):(t.next=i.next,i.next=t),n.interleaved=t,Ye(e,r)}function Dn(e,t,r){if(t=t.updateQueue,t!==null&&(t=t.shared,(r&4194240)!==0)){var n=t.lanes;n&=e.pendingLanes,r|=n,t.lanes=r,ho(e,r)}}function cl(e,t){var r=e.updateQueue,n=e.alternate;if(n!==null&&(n=n.updateQueue,r===n)){var i=null,a=null;if(r=r.firstBaseUpdate,r!==null){do{var o={eventTime:r.eventTime,lane:r.lane,tag:r.tag,payload:r.payload,callback:r.callback,next:null};a===null?i=a=o:a=a.next=o,r=r.next}while(r!==null);a===null?i=a=t:a=a.next=t}else i=a=t;r={baseState:n.baseState,firstBaseUpdate:i,lastBaseUpdate:a,shared:n.shared,effects:n.effects},e.updateQueue=r;return}e=r.lastBaseUpdate,e===null?r.firstBaseUpdate=t:e.next=t,r.lastBaseUpdate=t}function ii(e,t,r,n){var i=e.updateQueue;et=!1;var a=i.firstBaseUpdate,o=i.lastBaseUpdate,s=i.shared.pending;if(s!==null){i.shared.pending=null;var l=s,d=l.next;l.next=null,o===null?a=d:o.next=d,o=l;var f=e.alternate;f!==null&&(f=f.updateQueue,s=f.lastBaseUpdate,s!==o&&(s===null?f.firstBaseUpdate=d:s.next=d,f.lastBaseUpdate=l))}if(a!==null){var h=i.baseState;o=0,f=d=l=null,s=a;do{var g=s.lane,x=s.eventTime;if((n&g)===g){f!==null&&(f=f.next={eventTime:x,lane:0,tag:s.tag,payload:s.payload,callback:s.callback,next:null});e:{var w=e,y=s;switch(g=t,x=r,y.tag){case 1:if(w=y.payload,typeof w=="function"){h=w.call(x,h,g);break e}h=w;break e;case 3:w.flags=w.flags&-65537|128;case 0:if(w=y.payload,g=typeof w=="function"?w.call(x,h,g):w,g==null)break e;h=O({},h,g);break e;case 2:et=!0}}s.callback!==null&&s.lane!==0&&(e.flags|=64,g=i.effects,g===null?i.effects=[s]:g.push(s))}else x={eventTime:x,lane:g,tag:s.tag,payload:s.payload,callback:s.callback,next:null},f===null?(d=f=x,l=h):f=f.next=x,o|=g;if(s=s.next,s===null){if(s=i.shared.pending,s===null)break;g=s,s=g.next,g.next=null,i.lastBaseUpdate=g,i.shared.pending=null}}while(!0);if(f===null&&(l=h),i.baseState=l,i.firstBaseUpdate=d,i.lastBaseUpdate=f,t=i.shared.interleaved,t!==null){i=t;do o|=i.lane,i=i.next;while(i!==t)}else a===null&&(i.shared.lanes=0);Mt|=o,e.lanes=o,e.memoizedState=h}}function dl(e,t,r){if(e=t.effects,t.effects=null,e!==null)for(t=0;t<e.length;t++){var n=e[t],i=n.callback;if(i!==null){if(n.callback=null,n=r,typeof i!="function")throw Error(v(191,i));i.call(n)}}}var nn={},He=mt(nn),Xr=mt(nn),Qr=mt(nn);function St(e){if(e===nn)throw Error(v(174));return e}function zo(e,t){switch(P(Qr,t),P(Xr,e),P(He,nn),e=t.nodeType,e){case 9:case 11:t=(t=t.documentElement)?t.namespaceURI:Sa(null,"");break;default:e=e===8?t.parentNode:t,t=e.namespaceURI||null,e=e.tagName,t=Sa(t,e)}I(He),P(He,t)}function or(){I(He),I(Xr),I(Qr)}function Dc(e){St(Qr.current);var t=St(He.current),r=Sa(t,e.type);t!==r&&(P(Xr,e),P(He,r))}function Po(e){Xr.current===e&&(I(He),I(Xr))}var H=mt(0);function ai(e){for(var t=e;t!==null;){if(t.tag===13){var r=t.memoizedState;if(r!==null&&(r=r.dehydrated,r===null||r.data==="$?"||r.data==="$!"))return t}else if(t.tag===19&&t.memoizedProps.revealOrder!==void 0){if((t.flags&128)!==0)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}var oa=[];function Lo(){for(var e=0;e<oa.length;e++)oa[e]._workInProgressVersionPrimary=null;oa.length=0}var Bn=Qe.ReactCurrentDispatcher,sa=Qe.ReactCurrentBatchConfig,At=0,N=null,U=null,Y=null,oi=!1,Lr=!1,Kr=0,lu=0;function $(){throw Error(v(321))}function Fo(e,t){if(t===null)return!1;for(var r=0;r<t.length&&r<e.length;r++)if(!Pe(e[r],t[r]))return!1;return!0}function Io(e,t,r,n,i,a){if(At=a,N=t,t.memoizedState=null,t.updateQueue=null,t.lanes=0,Bn.current=e===null||e.memoizedState===null?uu:fu,e=r(n,i),Lr){a=0;do{if(Lr=!1,Kr=0,25<=a)throw Error(v(301));a+=1,Y=U=null,t.updateQueue=null,Bn.current=gu,e=r(n,i)}while(Lr)}if(Bn.current=si,t=U!==null&&U.next!==null,At=0,Y=U=N=null,oi=!1,t)throw Error(v(300));return e}function Do(){var e=Kr!==0;return Kr=0,e}function Ie(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return Y===null?N.memoizedState=Y=e:Y=Y.next=e,Y}function _e(){if(U===null){var e=N.alternate;e=e!==null?e.memoizedState:null}else e=U.next;var t=Y===null?N.memoizedState:Y.next;if(t!==null)Y=t,U=e;else{if(e===null)throw Error(v(310));U=e,e={memoizedState:U.memoizedState,baseState:U.baseState,baseQueue:U.baseQueue,queue:U.queue,next:null},Y===null?N.memoizedState=Y=e:Y=Y.next=e}return Y}function Zr(e,t){return typeof t=="function"?t(e):t}function la(e){var t=_e(),r=t.queue;if(r===null)throw Error(v(311));r.lastRenderedReducer=e;var n=U,i=n.baseQueue,a=r.pending;if(a!==null){if(i!==null){var o=i.next;i.next=a.next,a.next=o}n.baseQueue=i=a,r.pending=null}if(i!==null){a=i.next,n=n.baseState;var s=o=null,l=null,d=a;do{var f=d.lane;if((At&f)===f)l!==null&&(l=l.next={lane:0,action:d.action,hasEagerState:d.hasEagerState,eagerState:d.eagerState,next:null}),n=d.hasEagerState?d.eagerState:e(n,d.action);else{var h={lane:f,action:d.action,hasEagerState:d.hasEagerState,eagerState:d.eagerState,next:null};l===null?(s=l=h,o=n):l=l.next=h,N.lanes|=f,Mt|=f}d=d.next}while(d!==null&&d!==a);l===null?o=n:l.next=s,Pe(n,t.memoizedState)||(le=!0),t.memoizedState=n,t.baseState=o,t.baseQueue=l,r.lastRenderedState=n}if(e=r.interleaved,e!==null){i=e;do a=i.lane,N.lanes|=a,Mt|=a,i=i.next;while(i!==e)}else i===null&&(r.lanes=0);return[t.memoizedState,r.dispatch]}function ca(e){var t=_e(),r=t.queue;if(r===null)throw Error(v(311));r.lastRenderedReducer=e;var n=r.dispatch,i=r.pending,a=t.memoizedState;if(i!==null){r.pending=null;var o=i=i.next;do a=e(a,o.action),o=o.next;while(o!==i);Pe(a,t.memoizedState)||(le=!0),t.memoizedState=a,t.baseQueue===null&&(t.baseState=a),r.lastRenderedState=a}return[a,n]}function Bc(){}function Hc(e,t){var r=N,n=_e(),i=t(),a=!Pe(n.memoizedState,i);if(a&&(n.memoizedState=i,le=!0),n=n.queue,Bo(qc.bind(null,r,n,e),[e]),n.getSnapshot!==t||a||Y!==null&&Y.memoizedState.tag&1){if(r.flags|=2048,Jr(9,Oc.bind(null,r,n,i,t),void 0,null),X===null)throw Error(v(349));(At&30)!==0||Nc(r,t,i)}return i}function Nc(e,t,r){e.flags|=16384,e={getSnapshot:t,value:r},t=N.updateQueue,t===null?(t={lastEffect:null,stores:null},N.updateQueue=t,t.stores=[e]):(r=t.stores,r===null?t.stores=[e]:r.push(e))}function Oc(e,t,r,n){t.value=r,t.getSnapshot=n,jc(t)&&Wc(e)}function qc(e,t,r){return r(function(){jc(t)&&Wc(e)})}function jc(e){var t=e.getSnapshot;e=e.value;try{var r=t();return!Pe(e,r)}catch{return!0}}function Wc(e){var t=Ye(e,1);t!==null&&ze(t,e,1,-1)}function pl(e){var t=Ie();return typeof e=="function"&&(e=e()),t.memoizedState=t.baseState=e,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:Zr,lastRenderedState:e},t.queue=e,e=e.dispatch=pu.bind(null,N,e),[t.memoizedState,e]}function Jr(e,t,r,n){return e={tag:e,create:t,destroy:r,deps:n,next:null},t=N.updateQueue,t===null?(t={lastEffect:null,stores:null},N.updateQueue=t,t.lastEffect=e.next=e):(r=t.lastEffect,r===null?t.lastEffect=e.next=e:(n=r.next,r.next=e,e.next=n,t.lastEffect=e)),e}function Uc(){return _e().memoizedState}function Hn(e,t,r,n){var i=Ie();N.flags|=e,i.memoizedState=Jr(1|t,r,void 0,n===void 0?null:n)}function wi(e,t,r,n){var i=_e();n=n===void 0?null:n;var a=void 0;if(U!==null){var o=U.memoizedState;if(a=o.destroy,n!==null&&Fo(n,o.deps)){i.memoizedState=Jr(t,r,a,n);return}}N.flags|=e,i.memoizedState=Jr(1|t,r,a,n)}function ul(e,t){return Hn(8390656,8,e,t)}function Bo(e,t){return wi(2048,8,e,t)}function Gc(e,t){return wi(4,2,e,t)}function Vc(e,t){return wi(4,4,e,t)}function Yc(e,t){if(typeof t=="function")return e=e(),t(e),function(){t(null)};if(t!=null)return e=e(),t.current=e,function(){t.current=null}}function Xc(e,t,r){return r=r!=null?r.concat([e]):null,wi(4,4,Yc.bind(null,t,e),r)}function Ho(){}function Qc(e,t){var r=_e();t=t===void 0?null:t;var n=r.memoizedState;return n!==null&&t!==null&&Fo(t,n[1])?n[0]:(r.memoizedState=[e,t],e)}function Kc(e,t){var r=_e();t=t===void 0?null:t;var n=r.memoizedState;return n!==null&&t!==null&&Fo(t,n[1])?n[0]:(e=e(),r.memoizedState=[e,t],e)}function Zc(e,t,r){return(At&21)===0?(e.baseState&&(e.baseState=!1,le=!0),e.memoizedState=r):(Pe(r,t)||(r=rc(),N.lanes|=r,Mt|=r,e.baseState=!0),t)}function cu(e,t){var r=R;R=r!==0&&4>r?r:4,e(!0);var n=sa.transition;sa.transition={};try{e(!1),t()}finally{R=r,sa.transition=n}}function Jc(){return _e().memoizedState}function du(e,t,r){var n=pt(e);if(r={lane:n,action:r,hasEagerState:!1,eagerState:null,next:null},$c(e))ed(t,r);else if(r=Fc(e,t,r,n),r!==null){var i=ae();ze(r,e,n,i),td(r,t,n)}}function pu(e,t,r){var n=pt(e),i={lane:n,action:r,hasEagerState:!1,eagerState:null,next:null};if($c(e))ed(t,i);else{var a=e.alternate;if(e.lanes===0&&(a===null||a.lanes===0)&&(a=t.lastRenderedReducer,a!==null))try{var o=t.lastRenderedState,s=a(o,r);if(i.hasEagerState=!0,i.eagerState=s,Pe(s,o)){var l=t.interleaved;l===null?(i.next=i,Mo(t)):(i.next=l.next,l.next=i),t.interleaved=i;return}}catch{}r=Fc(e,t,i,n),r!==null&&(i=ae(),ze(r,e,n,i),td(r,t,n))}}function $c(e){var t=e.alternate;return e===N||t!==null&&t===N}function ed(e,t){Lr=oi=!0;var r=e.pending;r===null?t.next=t:(t.next=r.next,r.next=t),e.pending=t}function td(e,t,r){if((r&4194240)!==0){var n=t.lanes;n&=e.pendingLanes,r|=n,t.lanes=r,ho(e,r)}}var si={readContext:Se,useCallback:$,useContext:$,useEffect:$,useImperativeHandle:$,useInsertionEffect:$,useLayoutEffect:$,useMemo:$,useReducer:$,useRef:$,useState:$,useDebugValue:$,useDeferredValue:$,useTransition:$,useMutableSource:$,useSyncExternalStore:$,useId:$,unstable_isNewReconciler:!1},uu={readContext:Se,useCallback:function(e,t){return Ie().memoizedState=[e,t===void 0?null:t],e},useContext:Se,useEffect:ul,useImperativeHandle:function(e,t,r){return r=r!=null?r.concat([e]):null,Hn(4194308,4,Yc.bind(null,t,e),r)},useLayoutEffect:function(e,t){return Hn(4194308,4,e,t)},useInsertionEffect:function(e,t){return Hn(4,2,e,t)},useMemo:function(e,t){var r=Ie();return t=t===void 0?null:t,e=e(),r.memoizedState=[e,t],e},useReducer:function(e,t,r){var n=Ie();return t=r!==void 0?r(t):t,n.memoizedState=n.baseState=t,e={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:t},n.queue=e,e=e.dispatch=du.bind(null,N,e),[n.memoizedState,e]},useRef:function(e){var t=Ie();return e={current:e},t.memoizedState=e},useState:pl,useDebugValue:Ho,useDeferredValue:function(e){return Ie().memoizedState=e},useTransition:function(){var e=pl(!1),t=e[0];return e=cu.bind(null,e[1]),Ie().memoizedState=e,[t,e]},useMutableSource:function(){},useSyncExternalStore:function(e,t,r){var n=N,i=Ie();if(D){if(r===void 0)throw Error(v(407));r=r()}else{if(r=t(),X===null)throw Error(v(349));(At&30)!==0||Nc(n,t,r)}i.memoizedState=r;var a={value:r,getSnapshot:t};return i.queue=a,ul(qc.bind(null,n,a,e),[e]),n.flags|=2048,Jr(9,Oc.bind(null,n,a,r,t),void 0,null),r},useId:function(){var e=Ie(),t=X.identifierPrefix;if(D){var r=We,n=je;r=(n&~(1<<32-Re(n)-1)).toString(32)+r,t=":"+t+"R"+r,r=Kr++,0<r&&(t+="H"+r.toString(32)),t+=":"}else r=lu++,t=":"+t+"r"+r.toString(32)+":";return e.memoizedState=t},unstable_isNewReconciler:!1},fu={readContext:Se,useCallback:Qc,useContext:Se,useEffect:Bo,useImperativeHandle:Xc,useInsertionEffect:Gc,useLayoutEffect:Vc,useMemo:Kc,useReducer:la,useRef:Uc,useState:function(){return la(Zr)},useDebugValue:Ho,useDeferredValue:function(e){var t=_e();return Zc(t,U.memoizedState,e)},useTransition:function(){var e=la(Zr)[0],t=_e().memoizedState;return[e,t]},useMutableSource:Bc,useSyncExternalStore:Hc,useId:Jc,unstable_isNewReconciler:!1},gu={readContext:Se,useCallback:Qc,useContext:Se,useEffect:Bo,useImperativeHandle:Xc,useInsertionEffect:Gc,useLayoutEffect:Vc,useMemo:Kc,useReducer:ca,useRef:Uc,useState:function(){return ca(Zr)},useDebugValue:Ho,useDeferredValue:function(e){var t=_e();return U===null?t.memoizedState=e:Zc(t,U.memoizedState,e)},useTransition:function(){var e=ca(Zr)[0],t=_e().memoizedState;return[e,t]},useMutableSource:Bc,useSyncExternalStore:Hc,useId:Jc,unstable_isNewReconciler:!1};function Te(e,t){if(e&&e.defaultProps){t=O({},t),e=e.defaultProps;for(var r in e)t[r]===void 0&&(t[r]=e[r]);return t}return t}function Ua(e,t,r,n){t=e.memoizedState,r=r(n,t),r=r==null?t:O({},t,r),e.memoizedState=r,e.lanes===0&&(e.updateQueue.baseState=r)}var bi={isMounted:function(e){return(e=e._reactInternals)?Pt(e)===e:!1},enqueueSetState:function(e,t,r){e=e._reactInternals;var n=ae(),i=pt(e),a=Ue(n,i);a.payload=t,r!=null&&(a.callback=r),t=ct(e,a,i),t!==null&&(ze(t,e,i,n),Dn(t,e,i))},enqueueReplaceState:function(e,t,r){e=e._reactInternals;var n=ae(),i=pt(e),a=Ue(n,i);a.tag=1,a.payload=t,r!=null&&(a.callback=r),t=ct(e,a,i),t!==null&&(ze(t,e,i,n),Dn(t,e,i))},enqueueForceUpdate:function(e,t){e=e._reactInternals;var r=ae(),n=pt(e),i=Ue(r,n);i.tag=2,t!=null&&(i.callback=t),t=ct(e,i,n),t!==null&&(ze(t,e,n,r),Dn(t,e,n))}};function fl(e,t,r,n,i,a,o){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(n,a,o):t.prototype&&t.prototype.isPureReactComponent?!Ur(r,n)||!Ur(i,a):!0}function rd(e,t,r){var n=!1,i=gt,a=t.contextType;return typeof a=="object"&&a!==null?a=Se(a):(i=de(t)?Ct:re.current,n=t.contextTypes,a=(n=n!=null)?nr(e,i):gt),t=new t(r,a),e.memoizedState=t.state!==null&&t.state!==void 0?t.state:null,t.updater=bi,e.stateNode=t,t._reactInternals=e,n&&(e=e.stateNode,e.__reactInternalMemoizedUnmaskedChildContext=i,e.__reactInternalMemoizedMaskedChildContext=a),t}function gl(e,t,r,n){e=t.state,typeof t.componentWillReceiveProps=="function"&&t.componentWillReceiveProps(r,n),typeof t.UNSAFE_componentWillReceiveProps=="function"&&t.UNSAFE_componentWillReceiveProps(r,n),t.state!==e&&bi.enqueueReplaceState(t,t.state,null)}function Ga(e,t,r,n){var i=e.stateNode;i.props=r,i.state=e.memoizedState,i.refs={},Ro(e);var a=t.contextType;typeof a=="object"&&a!==null?i.context=Se(a):(a=de(t)?Ct:re.current,i.context=nr(e,a)),i.state=e.memoizedState,a=t.getDerivedStateFromProps,typeof a=="function"&&(Ua(e,t,a,r),i.state=e.memoizedState),typeof t.getDerivedStateFromProps=="function"||typeof i.getSnapshotBeforeUpdate=="function"||typeof i.UNSAFE_componentWillMount!="function"&&typeof i.componentWillMount!="function"||(t=i.state,typeof i.componentWillMount=="function"&&i.componentWillMount(),typeof i.UNSAFE_componentWillMount=="function"&&i.UNSAFE_componentWillMount(),t!==i.state&&bi.enqueueReplaceState(i,i.state,null),ii(e,r,i,n),i.state=e.memoizedState),typeof i.componentDidMount=="function"&&(e.flags|=4194308)}function sr(e,t){try{var r="",n=t;do r+=U0(n),n=n.return;while(n);var i=r}catch(a){i=`
Error generating stack: `+a.message+`
`+a.stack}return{value:e,source:t,stack:i,digest:null}}function da(e,t,r){return{value:e,source:null,stack:r??null,digest:t??null}}function Va(e,t){try{console.error(t.value)}catch(r){setTimeout(function(){throw r})}}var hu=typeof WeakMap=="function"?WeakMap:Map;function nd(e,t,r){r=Ue(-1,r),r.tag=3,r.payload={element:null};var n=t.value;return r.callback=function(){ci||(ci=!0,ro=n),Va(e,t)},r}function id(e,t,r){r=Ue(-1,r),r.tag=3;var n=e.type.getDerivedStateFromError;if(typeof n=="function"){var i=t.value;r.payload=function(){return n(i)},r.callback=function(){Va(e,t)}}var a=e.stateNode;return a!==null&&typeof a.componentDidCatch=="function"&&(r.callback=function(){Va(e,t),typeof n!="function"&&(dt===null?dt=new Set([this]):dt.add(this));var o=t.stack;this.componentDidCatch(t.value,{componentStack:o!==null?o:""})}),r}function hl(e,t,r){var n=e.pingCache;if(n===null){n=e.pingCache=new hu;var i=new Set;n.set(t,i)}else i=n.get(t),i===void 0&&(i=new Set,n.set(t,i));i.has(r)||(i.add(r),e=Mu.bind(null,e,t,r),t.then(e,e))}function ml(e){do{var t;if((t=e.tag===13)&&(t=e.memoizedState,t=t!==null?t.dehydrated!==null:!0),t)return e;e=e.return}while(e!==null);return null}function vl(e,t,r,n,i){return(e.mode&1)===0?(e===t?e.flags|=65536:(e.flags|=128,r.flags|=131072,r.flags&=-52805,r.tag===1&&(r.alternate===null?r.tag=17:(t=Ue(-1,1),t.tag=2,ct(r,t,1))),r.lanes|=1),e):(e.flags|=65536,e.lanes=i,e)}var mu=Qe.ReactCurrentOwner,le=!1;function ie(e,t,r,n){t.child=e===null?Lc(t,null,r,n):ar(t,e.child,r,n)}function xl(e,t,r,n,i){r=r.render;var a=t.ref;return er(t,i),n=Io(e,t,r,n,a,i),r=Do(),e!==null&&!le?(t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~i,Xe(e,t,i)):(D&&r&&So(t),t.flags|=1,ie(e,t,n,i),t.child)}function wl(e,t,r,n,i){if(e===null){var a=r.type;return typeof a=="function"&&!Vo(a)&&a.defaultProps===void 0&&r.compare===null&&r.defaultProps===void 0?(t.tag=15,t.type=a,ad(e,t,a,n,i)):(e=jn(r.type,null,n,t,t.mode,i),e.ref=t.ref,e.return=t,t.child=e)}if(a=e.child,(e.lanes&i)===0){var o=a.memoizedProps;if(r=r.compare,r=r!==null?r:Ur,r(o,n)&&e.ref===t.ref)return Xe(e,t,i)}return t.flags|=1,e=ut(a,n),e.ref=t.ref,e.return=t,t.child=e}function ad(e,t,r,n,i){if(e!==null){var a=e.memoizedProps;if(Ur(a,n)&&e.ref===t.ref)if(le=!1,t.pendingProps=n=a,(e.lanes&i)!==0)(e.flags&131072)!==0&&(le=!0);else return t.lanes=e.lanes,Xe(e,t,i)}return Ya(e,t,r,n,i)}function od(e,t,r){var n=t.pendingProps,i=n.children,a=e!==null?e.memoizedState:null;if(n.mode==="hidden")if((t.mode&1)===0)t.memoizedState={baseLanes:0,cachePool:null,transitions:null},P(Qt,ue),ue|=r;else{if((r&1073741824)===0)return e=a!==null?a.baseLanes|r:r,t.lanes=t.childLanes=1073741824,t.memoizedState={baseLanes:e,cachePool:null,transitions:null},t.updateQueue=null,P(Qt,ue),ue|=e,null;t.memoizedState={baseLanes:0,cachePool:null,transitions:null},n=a!==null?a.baseLanes:r,P(Qt,ue),ue|=n}else a!==null?(n=a.baseLanes|r,t.memoizedState=null):n=r,P(Qt,ue),ue|=n;return ie(e,t,i,r),t.child}function sd(e,t){var r=t.ref;(e===null&&r!==null||e!==null&&e.ref!==r)&&(t.flags|=512,t.flags|=2097152)}function Ya(e,t,r,n,i){var a=de(r)?Ct:re.current;return a=nr(t,a),er(t,i),r=Io(e,t,r,n,a,i),n=Do(),e!==null&&!le?(t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~i,Xe(e,t,i)):(D&&n&&So(t),t.flags|=1,ie(e,t,r,i),t.child)}function bl(e,t,r,n,i){if(de(r)){var a=!0;$n(t)}else a=!1;if(er(t,i),t.stateNode===null)Nn(e,t),rd(t,r,n),Ga(t,r,n,i),n=!0;else if(e===null){var o=t.stateNode,s=t.memoizedProps;o.props=s;var l=o.context,d=r.contextType;typeof d=="object"&&d!==null?d=Se(d):(d=de(r)?Ct:re.current,d=nr(t,d));var f=r.getDerivedStateFromProps,h=typeof f=="function"||typeof o.getSnapshotBeforeUpdate=="function";h||typeof o.UNSAFE_componentWillReceiveProps!="function"&&typeof o.componentWillReceiveProps!="function"||(s!==n||l!==d)&&gl(t,o,n,d),et=!1;var g=t.memoizedState;o.state=g,ii(t,n,o,i),l=t.memoizedState,s!==n||g!==l||ce.current||et?(typeof f=="function"&&(Ua(t,r,f,n),l=t.memoizedState),(s=et||fl(t,r,s,n,g,l,d))?(h||typeof o.UNSAFE_componentWillMount!="function"&&typeof o.componentWillMount!="function"||(typeof o.componentWillMount=="function"&&o.componentWillMount(),typeof o.UNSAFE_componentWillMount=="function"&&o.UNSAFE_componentWillMount()),typeof o.componentDidMount=="function"&&(t.flags|=4194308)):(typeof o.componentDidMount=="function"&&(t.flags|=4194308),t.memoizedProps=n,t.memoizedState=l),o.props=n,o.state=l,o.context=d,n=s):(typeof o.componentDidMount=="function"&&(t.flags|=4194308),n=!1)}else{o=t.stateNode,Ic(e,t),s=t.memoizedProps,d=t.type===t.elementType?s:Te(t.type,s),o.props=d,h=t.pendingProps,g=o.context,l=r.contextType,typeof l=="object"&&l!==null?l=Se(l):(l=de(r)?Ct:re.current,l=nr(t,l));var x=r.getDerivedStateFromProps;(f=typeof x=="function"||typeof o.getSnapshotBeforeUpdate=="function")||typeof o.UNSAFE_componentWillReceiveProps!="function"&&typeof o.componentWillReceiveProps!="function"||(s!==h||g!==l)&&gl(t,o,n,l),et=!1,g=t.memoizedState,o.state=g,ii(t,n,o,i);var w=t.memoizedState;s!==h||g!==w||ce.current||et?(typeof x=="function"&&(Ua(t,r,x,n),w=t.memoizedState),(d=et||fl(t,r,d,n,g,w,l)||!1)?(f||typeof o.UNSAFE_componentWillUpdate!="function"&&typeof o.componentWillUpdate!="function"||(typeof o.componentWillUpdate=="function"&&o.componentWillUpdate(n,w,l),typeof o.UNSAFE_componentWillUpdate=="function"&&o.UNSAFE_componentWillUpdate(n,w,l)),typeof o.componentDidUpdate=="function"&&(t.flags|=4),typeof o.getSnapshotBeforeUpdate=="function"&&(t.flags|=1024)):(typeof o.componentDidUpdate!="function"||s===e.memoizedProps&&g===e.memoizedState||(t.flags|=4),typeof o.getSnapshotBeforeUpdate!="function"||s===e.memoizedProps&&g===e.memoizedState||(t.flags|=1024),t.memoizedProps=n,t.memoizedState=w),o.props=n,o.state=w,o.context=l,n=d):(typeof o.componentDidUpdate!="function"||s===e.memoizedProps&&g===e.memoizedState||(t.flags|=4),typeof o.getSnapshotBeforeUpdate!="function"||s===e.memoizedProps&&g===e.memoizedState||(t.flags|=1024),n=!1)}return Xa(e,t,r,n,a,i)}function Xa(e,t,r,n,i,a){sd(e,t);var o=(t.flags&128)!==0;if(!n&&!o)return i&&al(t,r,!1),Xe(e,t,a);n=t.stateNode,mu.current=t;var s=o&&typeof r.getDerivedStateFromError!="function"?null:n.render();return t.flags|=1,e!==null&&o?(t.child=ar(t,e.child,null,a),t.child=ar(t,null,s,a)):ie(e,t,s,a),t.memoizedState=n.state,i&&al(t,r,!0),t.child}function ld(e){var t=e.stateNode;t.pendingContext?il(e,t.pendingContext,t.pendingContext!==t.context):t.context&&il(e,t.context,!1),zo(e,t.containerInfo)}function yl(e,t,r,n,i){return ir(),Eo(i),t.flags|=256,ie(e,t,r,n),t.child}var Qa={dehydrated:null,treeContext:null,retryLane:0};function Ka(e){return{baseLanes:e,cachePool:null,transitions:null}}function cd(e,t,r){var n=t.pendingProps,i=H.current,a=!1,o=(t.flags&128)!==0,s;if((s=o)||(s=e!==null&&e.memoizedState===null?!1:(i&2)!==0),s?(a=!0,t.flags&=-129):(e===null||e.memoizedState!==null)&&(i|=1),P(H,i&1),e===null)return ja(t),e=t.memoizedState,e!==null&&(e=e.dehydrated,e!==null)?((t.mode&1)===0?t.lanes=1:e.data==="$!"?t.lanes=8:t.lanes=1073741824,null):(o=n.children,e=n.fallback,a?(n=t.mode,a=t.child,o={mode:"hidden",children:o},(n&1)===0&&a!==null?(a.childLanes=0,a.pendingProps=o):a=Si(o,n,0,null),e=Et(e,n,r,null),a.return=t,e.return=t,a.sibling=e,t.child=a,t.child.memoizedState=Ka(r),t.memoizedState=Qa,e):No(t,o));if(i=e.memoizedState,i!==null&&(s=i.dehydrated,s!==null))return vu(e,t,o,n,s,i,r);if(a){a=n.fallback,o=t.mode,i=e.child,s=i.sibling;var l={mode:"hidden",children:n.children};return(o&1)===0&&t.child!==i?(n=t.child,n.childLanes=0,n.pendingProps=l,t.deletions=null):(n=ut(i,l),n.subtreeFlags=i.subtreeFlags&14680064),s!==null?a=ut(s,a):(a=Et(a,o,r,null),a.flags|=2),a.return=t,n.return=t,n.sibling=a,t.child=n,n=a,a=t.child,o=e.child.memoizedState,o=o===null?Ka(r):{baseLanes:o.baseLanes|r,cachePool:null,transitions:o.transitions},a.memoizedState=o,a.childLanes=e.childLanes&~r,t.memoizedState=Qa,n}return a=e.child,e=a.sibling,n=ut(a,{mode:"visible",children:n.children}),(t.mode&1)===0&&(n.lanes=r),n.return=t,n.sibling=null,e!==null&&(r=t.deletions,r===null?(t.deletions=[e],t.flags|=16):r.push(e)),t.child=n,t.memoizedState=null,n}function No(e,t){return t=Si({mode:"visible",children:t},e.mode,0,null),t.return=e,e.child=t}function Rn(e,t,r,n){return n!==null&&Eo(n),ar(t,e.child,null,r),e=No(t,t.pendingProps.children),e.flags|=2,t.memoizedState=null,e}function vu(e,t,r,n,i,a,o){if(r)return t.flags&256?(t.flags&=-257,n=da(Error(v(422))),Rn(e,t,o,n)):t.memoizedState!==null?(t.child=e.child,t.flags|=128,null):(a=n.fallback,i=t.mode,n=Si({mode:"visible",children:n.children},i,0,null),a=Et(a,i,o,null),a.flags|=2,n.return=t,a.return=t,n.sibling=a,t.child=n,(t.mode&1)!==0&&ar(t,e.child,null,o),t.child.memoizedState=Ka(o),t.memoizedState=Qa,a);if((t.mode&1)===0)return Rn(e,t,o,null);if(i.data==="$!"){if(n=i.nextSibling&&i.nextSibling.dataset,n)var s=n.dgst;return n=s,a=Error(v(419)),n=da(a,n,void 0),Rn(e,t,o,n)}if(s=(o&e.childLanes)!==0,le||s){if(n=X,n!==null){switch(o&-o){case 4:i=2;break;case 16:i=8;break;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:i=32;break;case 536870912:i=268435456;break;default:i=0}i=(i&(n.suspendedLanes|o))!==0?0:i,i!==0&&i!==a.retryLane&&(a.retryLane=i,Ye(e,i),ze(n,e,i,-1))}return Go(),n=da(Error(v(421))),Rn(e,t,o,n)}return i.data==="$?"?(t.flags|=128,t.child=e.child,t=Ru.bind(null,e),i._reactRetry=t,null):(e=a.treeContext,fe=lt(i.nextSibling),ge=t,D=!0,Me=null,e!==null&&(we[be++]=je,we[be++]=We,we[be++]=Tt,je=e.id,We=e.overflow,Tt=t),t=No(t,n.children),t.flags|=4096,t)}function kl(e,t,r){e.lanes|=t;var n=e.alternate;n!==null&&(n.lanes|=t),Wa(e.return,t,r)}function pa(e,t,r,n,i){var a=e.memoizedState;a===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:n,tail:r,tailMode:i}:(a.isBackwards=t,a.rendering=null,a.renderingStartTime=0,a.last=n,a.tail=r,a.tailMode=i)}function dd(e,t,r){var n=t.pendingProps,i=n.revealOrder,a=n.tail;if(ie(e,t,n.children,r),n=H.current,(n&2)!==0)n=n&1|2,t.flags|=128;else{if(e!==null&&(e.flags&128)!==0)e:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&kl(e,r,t);else if(e.tag===19)kl(e,r,t);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break e;for(;e.sibling===null;){if(e.return===null||e.return===t)break e;e=e.return}e.sibling.return=e.return,e=e.sibling}n&=1}if(P(H,n),(t.mode&1)===0)t.memoizedState=null;else switch(i){case"forwards":for(r=t.child,i=null;r!==null;)e=r.alternate,e!==null&&ai(e)===null&&(i=r),r=r.sibling;r=i,r===null?(i=t.child,t.child=null):(i=r.sibling,r.sibling=null),pa(t,!1,i,r,a);break;case"backwards":for(r=null,i=t.child,t.child=null;i!==null;){if(e=i.alternate,e!==null&&ai(e)===null){t.child=i;break}e=i.sibling,i.sibling=r,r=i,i=e}pa(t,!0,r,null,a);break;case"together":pa(t,!1,null,null,void 0);break;default:t.memoizedState=null}return t.child}function Nn(e,t){(t.mode&1)===0&&e!==null&&(e.alternate=null,t.alternate=null,t.flags|=2)}function Xe(e,t,r){if(e!==null&&(t.dependencies=e.dependencies),Mt|=t.lanes,(r&t.childLanes)===0)return null;if(e!==null&&t.child!==e.child)throw Error(v(153));if(t.child!==null){for(e=t.child,r=ut(e,e.pendingProps),t.child=r,r.return=t;e.sibling!==null;)e=e.sibling,r=r.sibling=ut(e,e.pendingProps),r.return=t;r.sibling=null}return t.child}function xu(e,t,r){switch(t.tag){case 3:ld(t),ir();break;case 5:Dc(t);break;case 1:de(t.type)&&$n(t);break;case 4:zo(t,t.stateNode.containerInfo);break;case 10:var n=t.type._context,i=t.memoizedProps.value;P(ri,n._currentValue),n._currentValue=i;break;case 13:if(n=t.memoizedState,n!==null)return n.dehydrated!==null?(P(H,H.current&1),t.flags|=128,null):(r&t.child.childLanes)!==0?cd(e,t,r):(P(H,H.current&1),e=Xe(e,t,r),e!==null?e.sibling:null);P(H,H.current&1);break;case 19:if(n=(r&t.childLanes)!==0,(e.flags&128)!==0){if(n)return dd(e,t,r);t.flags|=128}if(i=t.memoizedState,i!==null&&(i.rendering=null,i.tail=null,i.lastEffect=null),P(H,H.current),n)break;return null;case 22:case 23:return t.lanes=0,od(e,t,r)}return Xe(e,t,r)}var pd,Za,ud,fd;pd=function(e,t){for(var r=t.child;r!==null;){if(r.tag===5||r.tag===6)e.appendChild(r.stateNode);else if(r.tag!==4&&r.child!==null){r.child.return=r,r=r.child;continue}if(r===t)break;for(;r.sibling===null;){if(r.return===null||r.return===t)return;r=r.return}r.sibling.return=r.return,r=r.sibling}};Za=function(){};ud=function(e,t,r,n){var i=e.memoizedProps;if(i!==n){e=t.stateNode,St(He.current);var a=null;switch(r){case"input":i=wa(e,i),n=wa(e,n),a=[];break;case"select":i=O({},i,{value:void 0}),n=O({},n,{value:void 0}),a=[];break;case"textarea":i=ka(e,i),n=ka(e,n),a=[];break;default:typeof i.onClick!="function"&&typeof n.onClick=="function"&&(e.onclick=Zn)}_a(r,n);var o;r=null;for(d in i)if(!n.hasOwnProperty(d)&&i.hasOwnProperty(d)&&i[d]!=null)if(d==="style"){var s=i[d];for(o in s)s.hasOwnProperty(o)&&(r||(r={}),r[o]="")}else d!=="dangerouslySetInnerHTML"&&d!=="children"&&d!=="suppressContentEditableWarning"&&d!=="suppressHydrationWarning"&&d!=="autoFocus"&&(Br.hasOwnProperty(d)?a||(a=[]):(a=a||[]).push(d,null));for(d in n){var l=n[d];if(s=i?.[d],n.hasOwnProperty(d)&&l!==s&&(l!=null||s!=null))if(d==="style")if(s){for(o in s)!s.hasOwnProperty(o)||l&&l.hasOwnProperty(o)||(r||(r={}),r[o]="");for(o in l)l.hasOwnProperty(o)&&s[o]!==l[o]&&(r||(r={}),r[o]=l[o])}else r||(a||(a=[]),a.push(d,r)),r=l;else d==="dangerouslySetInnerHTML"?(l=l?l.__html:void 0,s=s?s.__html:void 0,l!=null&&s!==l&&(a=a||[]).push(d,l)):d==="children"?typeof l!="string"&&typeof l!="number"||(a=a||[]).push(d,""+l):d!=="suppressContentEditableWarning"&&d!=="suppressHydrationWarning"&&(Br.hasOwnProperty(d)?(l!=null&&d==="onScroll"&&F("scroll",e),a||s===l||(a=[])):(a=a||[]).push(d,l))}r&&(a=a||[]).push("style",r);var d=a;(t.updateQueue=d)&&(t.flags|=4)}};fd=function(e,t,r,n){r!==n&&(t.flags|=4)};function yr(e,t){if(!D)switch(e.tailMode){case"hidden":t=e.tail;for(var r=null;t!==null;)t.alternate!==null&&(r=t),t=t.sibling;r===null?e.tail=null:r.sibling=null;break;case"collapsed":r=e.tail;for(var n=null;r!==null;)r.alternate!==null&&(n=r),r=r.sibling;n===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:n.sibling=null}}function ee(e){var t=e.alternate!==null&&e.alternate.child===e.child,r=0,n=0;if(t)for(var i=e.child;i!==null;)r|=i.lanes|i.childLanes,n|=i.subtreeFlags&14680064,n|=i.flags&14680064,i.return=e,i=i.sibling;else for(i=e.child;i!==null;)r|=i.lanes|i.childLanes,n|=i.subtreeFlags,n|=i.flags,i.return=e,i=i.sibling;return e.subtreeFlags|=n,e.childLanes=r,t}function wu(e,t,r){var n=t.pendingProps;switch(_o(t),t.tag){case 2:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return ee(t),null;case 1:return de(t.type)&&Jn(),ee(t),null;case 3:return n=t.stateNode,or(),I(ce),I(re),Lo(),n.pendingContext&&(n.context=n.pendingContext,n.pendingContext=null),(e===null||e.child===null)&&(An(t)?t.flags|=4:e===null||e.memoizedState.isDehydrated&&(t.flags&256)===0||(t.flags|=1024,Me!==null&&(ao(Me),Me=null))),Za(e,t),ee(t),null;case 5:Po(t);var i=St(Qr.current);if(r=t.type,e!==null&&t.stateNode!=null)ud(e,t,r,n,i),e.ref!==t.ref&&(t.flags|=512,t.flags|=2097152);else{if(!n){if(t.stateNode===null)throw Error(v(166));return ee(t),null}if(e=St(He.current),An(t)){n=t.stateNode,r=t.type;var a=t.memoizedProps;switch(n[De]=t,n[Yr]=a,e=(t.mode&1)!==0,r){case"dialog":F("cancel",n),F("close",n);break;case"iframe":case"object":case"embed":F("load",n);break;case"video":case"audio":for(i=0;i<Tr.length;i++)F(Tr[i],n);break;case"source":F("error",n);break;case"img":case"image":case"link":F("error",n),F("load",n);break;case"details":F("toggle",n);break;case"input":Rs(n,a),F("invalid",n);break;case"select":n._wrapperState={wasMultiple:!!a.multiple},F("invalid",n);break;case"textarea":Ps(n,a),F("invalid",n)}_a(r,a),i=null;for(var o in a)if(a.hasOwnProperty(o)){var s=a[o];o==="children"?typeof s=="string"?n.textContent!==s&&(a.suppressHydrationWarning!==!0&&Tn(n.textContent,s,e),i=["children",s]):typeof s=="number"&&n.textContent!==""+s&&(a.suppressHydrationWarning!==!0&&Tn(n.textContent,s,e),i=["children",""+s]):Br.hasOwnProperty(o)&&s!=null&&o==="onScroll"&&F("scroll",n)}switch(r){case"input":hn(n),zs(n,a,!0);break;case"textarea":hn(n),Ls(n);break;case"select":case"option":break;default:typeof a.onClick=="function"&&(n.onclick=Zn)}n=i,t.updateQueue=n,n!==null&&(t.flags|=4)}else{o=i.nodeType===9?i:i.ownerDocument,e==="http://www.w3.org/1999/xhtml"&&(e=ql(r)),e==="http://www.w3.org/1999/xhtml"?r==="script"?(e=o.createElement("div"),e.innerHTML="<script><\/script>",e=e.removeChild(e.firstChild)):typeof n.is=="string"?e=o.createElement(r,{is:n.is}):(e=o.createElement(r),r==="select"&&(o=e,n.multiple?o.multiple=!0:n.size&&(o.size=n.size))):e=o.createElementNS(e,r),e[De]=t,e[Yr]=n,pd(e,t,!1,!1),t.stateNode=e;e:{switch(o=Ea(r,n),r){case"dialog":F("cancel",e),F("close",e),i=n;break;case"iframe":case"object":case"embed":F("load",e),i=n;break;case"video":case"audio":for(i=0;i<Tr.length;i++)F(Tr[i],e);i=n;break;case"source":F("error",e),i=n;break;case"img":case"image":case"link":F("error",e),F("load",e),i=n;break;case"details":F("toggle",e),i=n;break;case"input":Rs(e,n),i=wa(e,n),F("invalid",e);break;case"option":i=n;break;case"select":e._wrapperState={wasMultiple:!!n.multiple},i=O({},n,{value:void 0}),F("invalid",e);break;case"textarea":Ps(e,n),i=ka(e,n),F("invalid",e);break;default:i=n}_a(r,i),s=i;for(a in s)if(s.hasOwnProperty(a)){var l=s[a];a==="style"?Ul(e,l):a==="dangerouslySetInnerHTML"?(l=l?l.__html:void 0,l!=null&&jl(e,l)):a==="children"?typeof l=="string"?(r!=="textarea"||l!=="")&&Hr(e,l):typeof l=="number"&&Hr(e,""+l):a!=="suppressContentEditableWarning"&&a!=="suppressHydrationWarning"&&a!=="autoFocus"&&(Br.hasOwnProperty(a)?l!=null&&a==="onScroll"&&F("scroll",e):l!=null&&lo(e,a,l,o))}switch(r){case"input":hn(e),zs(e,n,!1);break;case"textarea":hn(e),Ls(e);break;case"option":n.value!=null&&e.setAttribute("value",""+ft(n.value));break;case"select":e.multiple=!!n.multiple,a=n.value,a!=null?Kt(e,!!n.multiple,a,!1):n.defaultValue!=null&&Kt(e,!!n.multiple,n.defaultValue,!0);break;default:typeof i.onClick=="function"&&(e.onclick=Zn)}switch(r){case"button":case"input":case"select":case"textarea":n=!!n.autoFocus;break e;case"img":n=!0;break e;default:n=!1}}n&&(t.flags|=4)}t.ref!==null&&(t.flags|=512,t.flags|=2097152)}return ee(t),null;case 6:if(e&&t.stateNode!=null)fd(e,t,e.memoizedProps,n);else{if(typeof n!="string"&&t.stateNode===null)throw Error(v(166));if(r=St(Qr.current),St(He.current),An(t)){if(n=t.stateNode,r=t.memoizedProps,n[De]=t,(a=n.nodeValue!==r)&&(e=ge,e!==null))switch(e.tag){case 3:Tn(n.nodeValue,r,(e.mode&1)!==0);break;case 5:e.memoizedProps.suppressHydrationWarning!==!0&&Tn(n.nodeValue,r,(e.mode&1)!==0)}a&&(t.flags|=4)}else n=(r.nodeType===9?r:r.ownerDocument).createTextNode(n),n[De]=t,t.stateNode=n}return ee(t),null;case 13:if(I(H),n=t.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(D&&fe!==null&&(t.mode&1)!==0&&(t.flags&128)===0)zc(),ir(),t.flags|=98560,a=!1;else if(a=An(t),n!==null&&n.dehydrated!==null){if(e===null){if(!a)throw Error(v(318));if(a=t.memoizedState,a=a!==null?a.dehydrated:null,!a)throw Error(v(317));a[De]=t}else ir(),(t.flags&128)===0&&(t.memoizedState=null),t.flags|=4;ee(t),a=!1}else Me!==null&&(ao(Me),Me=null),a=!0;if(!a)return t.flags&65536?t:null}return(t.flags&128)!==0?(t.lanes=r,t):(n=n!==null,n!==(e!==null&&e.memoizedState!==null)&&n&&(t.child.flags|=8192,(t.mode&1)!==0&&(e===null||(H.current&1)!==0?G===0&&(G=3):Go())),t.updateQueue!==null&&(t.flags|=4),ee(t),null);case 4:return or(),Za(e,t),e===null&&Gr(t.stateNode.containerInfo),ee(t),null;case 10:return Ao(t.type._context),ee(t),null;case 17:return de(t.type)&&Jn(),ee(t),null;case 19:if(I(H),a=t.memoizedState,a===null)return ee(t),null;if(n=(t.flags&128)!==0,o=a.rendering,o===null)if(n)yr(a,!1);else{if(G!==0||e!==null&&(e.flags&128)!==0)for(e=t.child;e!==null;){if(o=ai(e),o!==null){for(t.flags|=128,yr(a,!1),n=o.updateQueue,n!==null&&(t.updateQueue=n,t.flags|=4),t.subtreeFlags=0,n=r,r=t.child;r!==null;)a=r,e=n,a.flags&=14680066,o=a.alternate,o===null?(a.childLanes=0,a.lanes=e,a.child=null,a.subtreeFlags=0,a.memoizedProps=null,a.memoizedState=null,a.updateQueue=null,a.dependencies=null,a.stateNode=null):(a.childLanes=o.childLanes,a.lanes=o.lanes,a.child=o.child,a.subtreeFlags=0,a.deletions=null,a.memoizedProps=o.memoizedProps,a.memoizedState=o.memoizedState,a.updateQueue=o.updateQueue,a.type=o.type,e=o.dependencies,a.dependencies=e===null?null:{lanes:e.lanes,firstContext:e.firstContext}),r=r.sibling;return P(H,H.current&1|2),t.child}e=e.sibling}a.tail!==null&&j()>lr&&(t.flags|=128,n=!0,yr(a,!1),t.lanes=4194304)}else{if(!n)if(e=ai(o),e!==null){if(t.flags|=128,n=!0,r=e.updateQueue,r!==null&&(t.updateQueue=r,t.flags|=4),yr(a,!0),a.tail===null&&a.tailMode==="hidden"&&!o.alternate&&!D)return ee(t),null}else 2*j()-a.renderingStartTime>lr&&r!==1073741824&&(t.flags|=128,n=!0,yr(a,!1),t.lanes=4194304);a.isBackwards?(o.sibling=t.child,t.child=o):(r=a.last,r!==null?r.sibling=o:t.child=o,a.last=o)}return a.tail!==null?(t=a.tail,a.rendering=t,a.tail=t.sibling,a.renderingStartTime=j(),t.sibling=null,r=H.current,P(H,n?r&1|2:r&1),t):(ee(t),null);case 22:case 23:return Uo(),n=t.memoizedState!==null,e!==null&&e.memoizedState!==null!==n&&(t.flags|=8192),n&&(t.mode&1)!==0?(ue&1073741824)!==0&&(ee(t),t.subtreeFlags&6&&(t.flags|=8192)):ee(t),null;case 24:return null;case 25:return null}throw Error(v(156,t.tag))}function bu(e,t){switch(_o(t),t.tag){case 1:return de(t.type)&&Jn(),e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 3:return or(),I(ce),I(re),Lo(),e=t.flags,(e&65536)!==0&&(e&128)===0?(t.flags=e&-65537|128,t):null;case 5:return Po(t),null;case 13:if(I(H),e=t.memoizedState,e!==null&&e.dehydrated!==null){if(t.alternate===null)throw Error(v(340));ir()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 19:return I(H),null;case 4:return or(),null;case 10:return Ao(t.type._context),null;case 22:case 23:return Uo(),null;case 24:return null;default:return null}}var zn=!1,te=!1,yu=typeof WeakSet=="function"?WeakSet:Set,b=null;function Xt(e,t){var r=e.ref;if(r!==null)if(typeof r=="function")try{r(null)}catch(n){q(e,t,n)}else r.current=null}function Ja(e,t,r){try{r()}catch(n){q(e,t,n)}}var Sl=!1;function ku(e,t){if(Ia=Xn,e=xc(),ko(e)){if("selectionStart"in e)var r={start:e.selectionStart,end:e.selectionEnd};else e:{r=(r=e.ownerDocument)&&r.defaultView||window;var n=r.getSelection&&r.getSelection();if(n&&n.rangeCount!==0){r=n.anchorNode;var i=n.anchorOffset,a=n.focusNode;n=n.focusOffset;try{r.nodeType,a.nodeType}catch{r=null;break e}var o=0,s=-1,l=-1,d=0,f=0,h=e,g=null;t:for(;;){for(var x;h!==r||i!==0&&h.nodeType!==3||(s=o+i),h!==a||n!==0&&h.nodeType!==3||(l=o+n),h.nodeType===3&&(o+=h.nodeValue.length),(x=h.firstChild)!==null;)g=h,h=x;for(;;){if(h===e)break t;if(g===r&&++d===i&&(s=o),g===a&&++f===n&&(l=o),(x=h.nextSibling)!==null)break;h=g,g=h.parentNode}h=x}r=s===-1||l===-1?null:{start:s,end:l}}else r=null}r=r||{start:0,end:0}}else r=null;for(Da={focusedElem:e,selectionRange:r},Xn=!1,b=t;b!==null;)if(t=b,e=t.child,(t.subtreeFlags&1028)!==0&&e!==null)e.return=t,b=e;else for(;b!==null;){t=b;try{var w=t.alternate;if((t.flags&1024)!==0)switch(t.tag){case 0:case 11:case 15:break;case 1:if(w!==null){var y=w.memoizedProps,B=w.memoizedState,p=t.stateNode,c=p.getSnapshotBeforeUpdate(t.elementType===t.type?y:Te(t.type,y),B);p.__reactInternalSnapshotBeforeUpdate=c}break;case 3:var u=t.stateNode.containerInfo;u.nodeType===1?u.textContent="":u.nodeType===9&&u.documentElement&&u.removeChild(u.documentElement);break;case 5:case 6:case 4:case 17:break;default:throw Error(v(163))}}catch(m){q(t,t.return,m)}if(e=t.sibling,e!==null){e.return=t.return,b=e;break}b=t.return}return w=Sl,Sl=!1,w}function Fr(e,t,r){var n=t.updateQueue;if(n=n!==null?n.lastEffect:null,n!==null){var i=n=n.next;do{if((i.tag&e)===e){var a=i.destroy;i.destroy=void 0,a!==void 0&&Ja(t,r,a)}i=i.next}while(i!==n)}}function yi(e,t){if(t=t.updateQueue,t=t!==null?t.lastEffect:null,t!==null){var r=t=t.next;do{if((r.tag&e)===e){var n=r.create;r.destroy=n()}r=r.next}while(r!==t)}}function $a(e){var t=e.ref;if(t!==null){var r=e.stateNode;e.tag,e=r,typeof t=="function"?t(e):t.current=e}}function gd(e){var t=e.alternate;t!==null&&(e.alternate=null,gd(t)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(t=e.stateNode,t!==null&&(delete t[De],delete t[Yr],delete t[Na],delete t[iu],delete t[au])),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}function hd(e){return e.tag===5||e.tag===3||e.tag===4}function _l(e){e:for(;;){for(;e.sibling===null;){if(e.return===null||hd(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.flags&2||e.child===null||e.tag===4)continue e;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function eo(e,t,r){var n=e.tag;if(n===5||n===6)e=e.stateNode,t?r.nodeType===8?r.parentNode.insertBefore(e,t):r.insertBefore(e,t):(r.nodeType===8?(t=r.parentNode,t.insertBefore(e,r)):(t=r,t.appendChild(e)),r=r._reactRootContainer,r!=null||t.onclick!==null||(t.onclick=Zn));else if(n!==4&&(e=e.child,e!==null))for(eo(e,t,r),e=e.sibling;e!==null;)eo(e,t,r),e=e.sibling}function to(e,t,r){var n=e.tag;if(n===5||n===6)e=e.stateNode,t?r.insertBefore(e,t):r.appendChild(e);else if(n!==4&&(e=e.child,e!==null))for(to(e,t,r),e=e.sibling;e!==null;)to(e,t,r),e=e.sibling}var Q=null,Ae=!1;function Je(e,t,r){for(r=r.child;r!==null;)md(e,t,r),r=r.sibling}function md(e,t,r){if(Be&&typeof Be.onCommitFiberUnmount=="function")try{Be.onCommitFiberUnmount(fi,r)}catch{}switch(r.tag){case 5:te||Xt(r,t);case 6:var n=Q,i=Ae;Q=null,Je(e,t,r),Q=n,Ae=i,Q!==null&&(Ae?(e=Q,r=r.stateNode,e.nodeType===8?e.parentNode.removeChild(r):e.removeChild(r)):Q.removeChild(r.stateNode));break;case 18:Q!==null&&(Ae?(e=Q,r=r.stateNode,e.nodeType===8?ia(e.parentNode,r):e.nodeType===1&&ia(e,r),jr(e)):ia(Q,r.stateNode));break;case 4:n=Q,i=Ae,Q=r.stateNode.containerInfo,Ae=!0,Je(e,t,r),Q=n,Ae=i;break;case 0:case 11:case 14:case 15:if(!te&&(n=r.updateQueue,n!==null&&(n=n.lastEffect,n!==null))){i=n=n.next;do{var a=i,o=a.destroy;a=a.tag,o!==void 0&&((a&2)!==0||(a&4)!==0)&&Ja(r,t,o),i=i.next}while(i!==n)}Je(e,t,r);break;case 1:if(!te&&(Xt(r,t),n=r.stateNode,typeof n.componentWillUnmount=="function"))try{n.props=r.memoizedProps,n.state=r.memoizedState,n.componentWillUnmount()}catch(s){q(r,t,s)}Je(e,t,r);break;case 21:Je(e,t,r);break;case 22:r.mode&1?(te=(n=te)||r.memoizedState!==null,Je(e,t,r),te=n):Je(e,t,r);break;default:Je(e,t,r)}}function El(e){var t=e.updateQueue;if(t!==null){e.updateQueue=null;var r=e.stateNode;r===null&&(r=e.stateNode=new yu),t.forEach(function(n){var i=zu.bind(null,e,n);r.has(n)||(r.add(n),n.then(i,i))})}}function Ce(e,t){var r=t.deletions;if(r!==null)for(var n=0;n<r.length;n++){var i=r[n];try{var a=e,o=t,s=o;e:for(;s!==null;){switch(s.tag){case 5:Q=s.stateNode,Ae=!1;break e;case 3:Q=s.stateNode.containerInfo,Ae=!0;break e;case 4:Q=s.stateNode.containerInfo,Ae=!0;break e}s=s.return}if(Q===null)throw Error(v(160));md(a,o,i),Q=null,Ae=!1;var l=i.alternate;l!==null&&(l.return=null),i.return=null}catch(d){q(i,t,d)}}if(t.subtreeFlags&12854)for(t=t.child;t!==null;)vd(t,e),t=t.sibling}function vd(e,t){var r=e.alternate,n=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:if(Ce(t,e),Fe(e),n&4){try{Fr(3,e,e.return),yi(3,e)}catch(y){q(e,e.return,y)}try{Fr(5,e,e.return)}catch(y){q(e,e.return,y)}}break;case 1:Ce(t,e),Fe(e),n&512&&r!==null&&Xt(r,r.return);break;case 5:if(Ce(t,e),Fe(e),n&512&&r!==null&&Xt(r,r.return),e.flags&32){var i=e.stateNode;try{Hr(i,"")}catch(y){q(e,e.return,y)}}if(n&4&&(i=e.stateNode,i!=null)){var a=e.memoizedProps,o=r!==null?r.memoizedProps:a,s=e.type,l=e.updateQueue;if(e.updateQueue=null,l!==null)try{s==="input"&&a.type==="radio"&&a.name!=null&&Nl(i,a),Ea(s,o);var d=Ea(s,a);for(o=0;o<l.length;o+=2){var f=l[o],h=l[o+1];f==="style"?Ul(i,h):f==="dangerouslySetInnerHTML"?jl(i,h):f==="children"?Hr(i,h):lo(i,f,h,d)}switch(s){case"input":ba(i,a);break;case"textarea":Ol(i,a);break;case"select":var g=i._wrapperState.wasMultiple;i._wrapperState.wasMultiple=!!a.multiple;var x=a.value;x!=null?Kt(i,!!a.multiple,x,!1):g!==!!a.multiple&&(a.defaultValue!=null?Kt(i,!!a.multiple,a.defaultValue,!0):Kt(i,!!a.multiple,a.multiple?[]:"",!1))}i[Yr]=a}catch(y){q(e,e.return,y)}}break;case 6:if(Ce(t,e),Fe(e),n&4){if(e.stateNode===null)throw Error(v(162));i=e.stateNode,a=e.memoizedProps;try{i.nodeValue=a}catch(y){q(e,e.return,y)}}break;case 3:if(Ce(t,e),Fe(e),n&4&&r!==null&&r.memoizedState.isDehydrated)try{jr(t.containerInfo)}catch(y){q(e,e.return,y)}break;case 4:Ce(t,e),Fe(e);break;case 13:Ce(t,e),Fe(e),i=e.child,i.flags&8192&&(a=i.memoizedState!==null,i.stateNode.isHidden=a,!a||i.alternate!==null&&i.alternate.memoizedState!==null||(jo=j())),n&4&&El(e);break;case 22:if(f=r!==null&&r.memoizedState!==null,e.mode&1?(te=(d=te)||f,Ce(t,e),te=d):Ce(t,e),Fe(e),n&8192){if(d=e.memoizedState!==null,(e.stateNode.isHidden=d)&&!f&&(e.mode&1)!==0)for(b=e,f=e.child;f!==null;){for(h=b=f;b!==null;){switch(g=b,x=g.child,g.tag){case 0:case 11:case 14:case 15:Fr(4,g,g.return);break;case 1:Xt(g,g.return);var w=g.stateNode;if(typeof w.componentWillUnmount=="function"){n=g,r=g.return;try{t=n,w.props=t.memoizedProps,w.state=t.memoizedState,w.componentWillUnmount()}catch(y){q(n,r,y)}}break;case 5:Xt(g,g.return);break;case 22:if(g.memoizedState!==null){Tl(h);continue}}x!==null?(x.return=g,b=x):Tl(h)}f=f.sibling}e:for(f=null,h=e;;){if(h.tag===5){if(f===null){f=h;try{i=h.stateNode,d?(a=i.style,typeof a.setProperty=="function"?a.setProperty("display","none","important"):a.display="none"):(s=h.stateNode,l=h.memoizedProps.style,o=l!=null&&l.hasOwnProperty("display")?l.display:null,s.style.display=Wl("display",o))}catch(y){q(e,e.return,y)}}}else if(h.tag===6){if(f===null)try{h.stateNode.nodeValue=d?"":h.memoizedProps}catch(y){q(e,e.return,y)}}else if((h.tag!==22&&h.tag!==23||h.memoizedState===null||h===e)&&h.child!==null){h.child.return=h,h=h.child;continue}if(h===e)break e;for(;h.sibling===null;){if(h.return===null||h.return===e)break e;f===h&&(f=null),h=h.return}f===h&&(f=null),h.sibling.return=h.return,h=h.sibling}}break;case 19:Ce(t,e),Fe(e),n&4&&El(e);break;case 21:break;default:Ce(t,e),Fe(e)}}function Fe(e){var t=e.flags;if(t&2){try{e:{for(var r=e.return;r!==null;){if(hd(r)){var n=r;break e}r=r.return}throw Error(v(160))}switch(n.tag){case 5:var i=n.stateNode;n.flags&32&&(Hr(i,""),n.flags&=-33);var a=_l(e);to(e,a,i);break;case 3:case 4:var o=n.stateNode.containerInfo,s=_l(e);eo(e,s,o);break;default:throw Error(v(161))}}catch(l){q(e,e.return,l)}e.flags&=-3}t&4096&&(e.flags&=-4097)}function Su(e,t,r){b=e,xd(e,t,r)}function xd(e,t,r){for(var n=(e.mode&1)!==0;b!==null;){var i=b,a=i.child;if(i.tag===22&&n){var o=i.memoizedState!==null||zn;if(!o){var s=i.alternate,l=s!==null&&s.memoizedState!==null||te;s=zn;var d=te;if(zn=o,(te=l)&&!d)for(b=i;b!==null;)o=b,l=o.child,o.tag===22&&o.memoizedState!==null?Al(i):l!==null?(l.return=o,b=l):Al(i);for(;a!==null;)b=a,xd(a,t,r),a=a.sibling;b=i,zn=s,te=d}Cl(e,t,r)}else(i.subtreeFlags&8772)!==0&&a!==null?(a.return=i,b=a):Cl(e,t,r)}}function Cl(e){for(;b!==null;){var t=b;if((t.flags&8772)!==0){var r=t.alternate;try{if((t.flags&8772)!==0)switch(t.tag){case 0:case 11:case 15:te||yi(5,t);break;case 1:var n=t.stateNode;if(t.flags&4&&!te)if(r===null)n.componentDidMount();else{var i=t.elementType===t.type?r.memoizedProps:Te(t.type,r.memoizedProps);n.componentDidUpdate(i,r.memoizedState,n.__reactInternalSnapshotBeforeUpdate)}var a=t.updateQueue;a!==null&&dl(t,a,n);break;case 3:var o=t.updateQueue;if(o!==null){if(r=null,t.child!==null)switch(t.child.tag){case 5:r=t.child.stateNode;break;case 1:r=t.child.stateNode}dl(t,o,r)}break;case 5:var s=t.stateNode;if(r===null&&t.flags&4){r=s;var l=t.memoizedProps;switch(t.type){case"button":case"input":case"select":case"textarea":l.autoFocus&&r.focus();break;case"img":l.src&&(r.src=l.src)}}break;case 6:break;case 4:break;case 12:break;case 13:if(t.memoizedState===null){var d=t.alternate;if(d!==null){var f=d.memoizedState;if(f!==null){var h=f.dehydrated;h!==null&&jr(h)}}}break;case 19:case 17:case 21:case 22:case 23:case 25:break;default:throw Error(v(163))}te||t.flags&512&&$a(t)}catch(g){q(t,t.return,g)}}if(t===e){b=null;break}if(r=t.sibling,r!==null){r.return=t.return,b=r;break}b=t.return}}function Tl(e){for(;b!==null;){var t=b;if(t===e){b=null;break}var r=t.sibling;if(r!==null){r.return=t.return,b=r;break}b=t.return}}function Al(e){for(;b!==null;){var t=b;try{switch(t.tag){case 0:case 11:case 15:var r=t.return;try{yi(4,t)}catch(l){q(t,r,l)}break;case 1:var n=t.stateNode;if(typeof n.componentDidMount=="function"){var i=t.return;try{n.componentDidMount()}catch(l){q(t,i,l)}}var a=t.return;try{$a(t)}catch(l){q(t,a,l)}break;case 5:var o=t.return;try{$a(t)}catch(l){q(t,o,l)}}}catch(l){q(t,t.return,l)}if(t===e){b=null;break}var s=t.sibling;if(s!==null){s.return=t.return,b=s;break}b=t.return}}var _u=Math.ceil,li=Qe.ReactCurrentDispatcher,Oo=Qe.ReactCurrentOwner,ke=Qe.ReactCurrentBatchConfig,T=0,X=null,W=null,K=0,ue=0,Qt=mt(0),G=0,$r=null,Mt=0,ki=0,qo=0,Ir=null,se=null,jo=0,lr=1/0,Oe=null,ci=!1,ro=null,dt=null,Pn=!1,it=null,di=0,Dr=0,no=null,On=-1,qn=0;function ae(){return(T&6)!==0?j():On!==-1?On:On=j()}function pt(e){return(e.mode&1)===0?1:(T&2)!==0&&K!==0?K&-K:su.transition!==null?(qn===0&&(qn=rc()),qn):(e=R,e!==0||(e=window.event,e=e===void 0?16:cc(e.type)),e)}function ze(e,t,r,n){if(50<Dr)throw Dr=0,no=null,Error(v(185));en(e,r,n),((T&2)===0||e!==X)&&(e===X&&((T&2)===0&&(ki|=r),G===4&&rt(e,K)),pe(e,n),r===1&&T===0&&(t.mode&1)===0&&(lr=j()+500,xi&&vt()))}function pe(e,t){var r=e.callbackNode;cp(e,t);var n=Yn(e,e===X?K:0);if(n===0)r!==null&&Ds(r),e.callbackNode=null,e.callbackPriority=0;else if(t=n&-n,e.callbackPriority!==t){if(r!=null&&Ds(r),t===1)e.tag===0?ou(Ml.bind(null,e)):Ac(Ml.bind(null,e)),ru(function(){(T&6)===0&&vt()}),r=null;else{switch(nc(n)){case 1:r=go;break;case 4:r=ec;break;case 16:r=Vn;break;case 536870912:r=tc;break;default:r=Vn}r=Cd(r,wd.bind(null,e))}e.callbackPriority=t,e.callbackNode=r}}function wd(e,t){if(On=-1,qn=0,(T&6)!==0)throw Error(v(327));var r=e.callbackNode;if(tr()&&e.callbackNode!==r)return null;var n=Yn(e,e===X?K:0);if(n===0)return null;if((n&30)!==0||(n&e.expiredLanes)!==0||t)t=pi(e,n);else{t=n;var i=T;T|=2;var a=yd();(X!==e||K!==t)&&(Oe=null,lr=j()+500,_t(e,t));do try{Tu();break}catch(s){bd(e,s)}while(!0);To(),li.current=a,T=i,W!==null?t=0:(X=null,K=0,t=G)}if(t!==0){if(t===2&&(i=Ra(e),i!==0&&(n=i,t=io(e,i))),t===1)throw r=$r,_t(e,0),rt(e,n),pe(e,j()),r;if(t===6)rt(e,n);else{if(i=e.current.alternate,(n&30)===0&&!Eu(i)&&(t=pi(e,n),t===2&&(a=Ra(e),a!==0&&(n=a,t=io(e,a))),t===1))throw r=$r,_t(e,0),rt(e,n),pe(e,j()),r;switch(e.finishedWork=i,e.finishedLanes=n,t){case 0:case 1:throw Error(v(345));case 2:bt(e,se,Oe);break;case 3:if(rt(e,n),(n&130023424)===n&&(t=jo+500-j(),10<t)){if(Yn(e,0)!==0)break;if(i=e.suspendedLanes,(i&n)!==n){ae(),e.pingedLanes|=e.suspendedLanes&i;break}e.timeoutHandle=Ha(bt.bind(null,e,se,Oe),t);break}bt(e,se,Oe);break;case 4:if(rt(e,n),(n&4194240)===n)break;for(t=e.eventTimes,i=-1;0<n;){var o=31-Re(n);a=1<<o,o=t[o],o>i&&(i=o),n&=~a}if(n=i,n=j()-n,n=(120>n?120:480>n?480:1080>n?1080:1920>n?1920:3e3>n?3e3:4320>n?4320:1960*_u(n/1960))-n,10<n){e.timeoutHandle=Ha(bt.bind(null,e,se,Oe),n);break}bt(e,se,Oe);break;case 5:bt(e,se,Oe);break;default:throw Error(v(329))}}}return pe(e,j()),e.callbackNode===r?wd.bind(null,e):null}function io(e,t){var r=Ir;return e.current.memoizedState.isDehydrated&&(_t(e,t).flags|=256),e=pi(e,t),e!==2&&(t=se,se=r,t!==null&&ao(t)),e}function ao(e){se===null?se=e:se.push.apply(se,e)}function Eu(e){for(var t=e;;){if(t.flags&16384){var r=t.updateQueue;if(r!==null&&(r=r.stores,r!==null))for(var n=0;n<r.length;n++){var i=r[n],a=i.getSnapshot;i=i.value;try{if(!Pe(a(),i))return!1}catch{return!1}}}if(r=t.child,t.subtreeFlags&16384&&r!==null)r.return=t,t=r;else{if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return!0;t=t.return}t.sibling.return=t.return,t=t.sibling}}return!0}function rt(e,t){for(t&=~qo,t&=~ki,e.suspendedLanes|=t,e.pingedLanes&=~t,e=e.expirationTimes;0<t;){var r=31-Re(t),n=1<<r;e[r]=-1,t&=~n}}function Ml(e){if((T&6)!==0)throw Error(v(327));tr();var t=Yn(e,0);if((t&1)===0)return pe(e,j()),null;var r=pi(e,t);if(e.tag!==0&&r===2){var n=Ra(e);n!==0&&(t=n,r=io(e,n))}if(r===1)throw r=$r,_t(e,0),rt(e,t),pe(e,j()),r;if(r===6)throw Error(v(345));return e.finishedWork=e.current.alternate,e.finishedLanes=t,bt(e,se,Oe),pe(e,j()),null}function Wo(e,t){var r=T;T|=1;try{return e(t)}finally{T=r,T===0&&(lr=j()+500,xi&&vt())}}function Rt(e){it!==null&&it.tag===0&&(T&6)===0&&tr();var t=T;T|=1;var r=ke.transition,n=R;try{if(ke.transition=null,R=1,e)return e()}finally{R=n,ke.transition=r,T=t,(T&6)===0&&vt()}}function Uo(){ue=Qt.current,I(Qt)}function _t(e,t){e.finishedWork=null,e.finishedLanes=0;var r=e.timeoutHandle;if(r!==-1&&(e.timeoutHandle=-1,tu(r)),W!==null)for(r=W.return;r!==null;){var n=r;switch(_o(n),n.tag){case 1:n=n.type.childContextTypes,n!=null&&Jn();break;case 3:or(),I(ce),I(re),Lo();break;case 5:Po(n);break;case 4:or();break;case 13:I(H);break;case 19:I(H);break;case 10:Ao(n.type._context);break;case 22:case 23:Uo()}r=r.return}if(X=e,W=e=ut(e.current,null),K=ue=t,G=0,$r=null,qo=ki=Mt=0,se=Ir=null,kt!==null){for(t=0;t<kt.length;t++)if(r=kt[t],n=r.interleaved,n!==null){r.interleaved=null;var i=n.next,a=r.pending;if(a!==null){var o=a.next;a.next=i,n.next=o}r.pending=n}kt=null}return e}function bd(e,t){do{var r=W;try{if(To(),Bn.current=si,oi){for(var n=N.memoizedState;n!==null;){var i=n.queue;i!==null&&(i.pending=null),n=n.next}oi=!1}if(At=0,Y=U=N=null,Lr=!1,Kr=0,Oo.current=null,r===null||r.return===null){G=1,$r=t,W=null;break}e:{var a=e,o=r.return,s=r,l=t;if(t=K,s.flags|=32768,l!==null&&typeof l=="object"&&typeof l.then=="function"){var d=l,f=s,h=f.tag;if((f.mode&1)===0&&(h===0||h===11||h===15)){var g=f.alternate;g?(f.updateQueue=g.updateQueue,f.memoizedState=g.memoizedState,f.lanes=g.lanes):(f.updateQueue=null,f.memoizedState=null)}var x=ml(o);if(x!==null){x.flags&=-257,vl(x,o,s,a,t),x.mode&1&&hl(a,d,t),t=x,l=d;var w=t.updateQueue;if(w===null){var y=new Set;y.add(l),t.updateQueue=y}else w.add(l);break e}else{if((t&1)===0){hl(a,d,t),Go();break e}l=Error(v(426))}}else if(D&&s.mode&1){var B=ml(o);if(B!==null){(B.flags&65536)===0&&(B.flags|=256),vl(B,o,s,a,t),Eo(sr(l,s));break e}}a=l=sr(l,s),G!==4&&(G=2),Ir===null?Ir=[a]:Ir.push(a),a=o;do{switch(a.tag){case 3:a.flags|=65536,t&=-t,a.lanes|=t;var p=nd(a,l,t);cl(a,p);break e;case 1:s=l;var c=a.type,u=a.stateNode;if((a.flags&128)===0&&(typeof c.getDerivedStateFromError=="function"||u!==null&&typeof u.componentDidCatch=="function"&&(dt===null||!dt.has(u)))){a.flags|=65536,t&=-t,a.lanes|=t;var m=id(a,s,t);cl(a,m);break e}}a=a.return}while(a!==null)}Sd(r)}catch(k){t=k,W===r&&r!==null&&(W=r=r.return);continue}break}while(!0)}function yd(){var e=li.current;return li.current=si,e===null?si:e}function Go(){(G===0||G===3||G===2)&&(G=4),X===null||(Mt&268435455)===0&&(ki&268435455)===0||rt(X,K)}function pi(e,t){var r=T;T|=2;var n=yd();(X!==e||K!==t)&&(Oe=null,_t(e,t));do try{Cu();break}catch(i){bd(e,i)}while(!0);if(To(),T=r,li.current=n,W!==null)throw Error(v(261));return X=null,K=0,G}function Cu(){for(;W!==null;)kd(W)}function Tu(){for(;W!==null&&!ep();)kd(W)}function kd(e){var t=Ed(e.alternate,e,ue);e.memoizedProps=e.pendingProps,t===null?Sd(e):W=t,Oo.current=null}function Sd(e){var t=e;do{var r=t.alternate;if(e=t.return,(t.flags&32768)===0){if(r=wu(r,t,ue),r!==null){W=r;return}}else{if(r=bu(r,t),r!==null){r.flags&=32767,W=r;return}if(e!==null)e.flags|=32768,e.subtreeFlags=0,e.deletions=null;else{G=6,W=null;return}}if(t=t.sibling,t!==null){W=t;return}W=t=e}while(t!==null);G===0&&(G=5)}function bt(e,t,r){var n=R,i=ke.transition;try{ke.transition=null,R=1,Au(e,t,r,n)}finally{ke.transition=i,R=n}return null}function Au(e,t,r,n){do tr();while(it!==null);if((T&6)!==0)throw Error(v(327));r=e.finishedWork;var i=e.finishedLanes;if(r===null)return null;if(e.finishedWork=null,e.finishedLanes=0,r===e.current)throw Error(v(177));e.callbackNode=null,e.callbackPriority=0;var a=r.lanes|r.childLanes;if(dp(e,a),e===X&&(W=X=null,K=0),(r.subtreeFlags&2064)===0&&(r.flags&2064)===0||Pn||(Pn=!0,Cd(Vn,function(){return tr(),null})),a=(r.flags&15990)!==0,(r.subtreeFlags&15990)!==0||a){a=ke.transition,ke.transition=null;var o=R;R=1;var s=T;T|=4,Oo.current=null,ku(e,r),vd(r,e),Kp(Da),Xn=!!Ia,Da=Ia=null,e.current=r,Su(r,e,i),tp(),T=s,R=o,ke.transition=a}else e.current=r;if(Pn&&(Pn=!1,it=e,di=i),a=e.pendingLanes,a===0&&(dt=null),ip(r.stateNode,n),pe(e,j()),t!==null)for(n=e.onRecoverableError,r=0;r<t.length;r++)i=t[r],n(i.value,{componentStack:i.stack,digest:i.digest});if(ci)throw ci=!1,e=ro,ro=null,e;return(di&1)!==0&&e.tag!==0&&tr(),a=e.pendingLanes,(a&1)!==0?e===no?Dr++:(Dr=0,no=e):Dr=0,vt(),null}function tr(){if(it!==null){var e=nc(di),t=ke.transition,r=R;try{if(ke.transition=null,R=16>e?16:e,it===null)var n=!1;else{if(e=it,it=null,di=0,(T&6)!==0)throw Error(v(331));var i=T;for(T|=4,b=e.current;b!==null;){var a=b,o=a.child;if((b.flags&16)!==0){var s=a.deletions;if(s!==null){for(var l=0;l<s.length;l++){var d=s[l];for(b=d;b!==null;){var f=b;switch(f.tag){case 0:case 11:case 15:Fr(8,f,a)}var h=f.child;if(h!==null)h.return=f,b=h;else for(;b!==null;){f=b;var g=f.sibling,x=f.return;if(gd(f),f===d){b=null;break}if(g!==null){g.return=x,b=g;break}b=x}}}var w=a.alternate;if(w!==null){var y=w.child;if(y!==null){w.child=null;do{var B=y.sibling;y.sibling=null,y=B}while(y!==null)}}b=a}}if((a.subtreeFlags&2064)!==0&&o!==null)o.return=a,b=o;else e:for(;b!==null;){if(a=b,(a.flags&2048)!==0)switch(a.tag){case 0:case 11:case 15:Fr(9,a,a.return)}var p=a.sibling;if(p!==null){p.return=a.return,b=p;break e}b=a.return}}var c=e.current;for(b=c;b!==null;){o=b;var u=o.child;if((o.subtreeFlags&2064)!==0&&u!==null)u.return=o,b=u;else e:for(o=c;b!==null;){if(s=b,(s.flags&2048)!==0)try{switch(s.tag){case 0:case 11:case 15:yi(9,s)}}catch(k){q(s,s.return,k)}if(s===o){b=null;break e}var m=s.sibling;if(m!==null){m.return=s.return,b=m;break e}b=s.return}}if(T=i,vt(),Be&&typeof Be.onPostCommitFiberRoot=="function")try{Be.onPostCommitFiberRoot(fi,e)}catch{}n=!0}return n}finally{R=r,ke.transition=t}}return!1}function Rl(e,t,r){t=sr(r,t),t=nd(e,t,1),e=ct(e,t,1),t=ae(),e!==null&&(en(e,1,t),pe(e,t))}function q(e,t,r){if(e.tag===3)Rl(e,e,r);else for(;t!==null;){if(t.tag===3){Rl(t,e,r);break}else if(t.tag===1){var n=t.stateNode;if(typeof t.type.getDerivedStateFromError=="function"||typeof n.componentDidCatch=="function"&&(dt===null||!dt.has(n))){e=sr(r,e),e=id(t,e,1),t=ct(t,e,1),e=ae(),t!==null&&(en(t,1,e),pe(t,e));break}}t=t.return}}function Mu(e,t,r){var n=e.pingCache;n!==null&&n.delete(t),t=ae(),e.pingedLanes|=e.suspendedLanes&r,X===e&&(K&r)===r&&(G===4||G===3&&(K&130023424)===K&&500>j()-jo?_t(e,0):qo|=r),pe(e,t)}function _d(e,t){t===0&&((e.mode&1)===0?t=1:(t=xn,xn<<=1,(xn&130023424)===0&&(xn=4194304)));var r=ae();e=Ye(e,t),e!==null&&(en(e,t,r),pe(e,r))}function Ru(e){var t=e.memoizedState,r=0;t!==null&&(r=t.retryLane),_d(e,r)}function zu(e,t){var r=0;switch(e.tag){case 13:var n=e.stateNode,i=e.memoizedState;i!==null&&(r=i.retryLane);break;case 19:n=e.stateNode;break;default:throw Error(v(314))}n!==null&&n.delete(t),_d(e,r)}var Ed;Ed=function(e,t,r){if(e!==null)if(e.memoizedProps!==t.pendingProps||ce.current)le=!0;else{if((e.lanes&r)===0&&(t.flags&128)===0)return le=!1,xu(e,t,r);le=(e.flags&131072)!==0}else le=!1,D&&(t.flags&1048576)!==0&&Mc(t,ti,t.index);switch(t.lanes=0,t.tag){case 2:var n=t.type;Nn(e,t),e=t.pendingProps;var i=nr(t,re.current);er(t,r),i=Io(null,t,n,e,i,r);var a=Do();return t.flags|=1,typeof i=="object"&&i!==null&&typeof i.render=="function"&&i.$$typeof===void 0?(t.tag=1,t.memoizedState=null,t.updateQueue=null,de(n)?(a=!0,$n(t)):a=!1,t.memoizedState=i.state!==null&&i.state!==void 0?i.state:null,Ro(t),i.updater=bi,t.stateNode=i,i._reactInternals=t,Ga(t,n,e,r),t=Xa(null,t,n,!0,a,r)):(t.tag=0,D&&a&&So(t),ie(null,t,i,r),t=t.child),t;case 16:n=t.elementType;e:{switch(Nn(e,t),e=t.pendingProps,i=n._init,n=i(n._payload),t.type=n,i=t.tag=Lu(n),e=Te(n,e),i){case 0:t=Ya(null,t,n,e,r);break e;case 1:t=bl(null,t,n,e,r);break e;case 11:t=xl(null,t,n,e,r);break e;case 14:t=wl(null,t,n,Te(n.type,e),r);break e}throw Error(v(306,n,""))}return t;case 0:return n=t.type,i=t.pendingProps,i=t.elementType===n?i:Te(n,i),Ya(e,t,n,i,r);case 1:return n=t.type,i=t.pendingProps,i=t.elementType===n?i:Te(n,i),bl(e,t,n,i,r);case 3:e:{if(ld(t),e===null)throw Error(v(387));n=t.pendingProps,a=t.memoizedState,i=a.element,Ic(e,t),ii(t,n,null,r);var o=t.memoizedState;if(n=o.element,a.isDehydrated)if(a={element:n,isDehydrated:!1,cache:o.cache,pendingSuspenseBoundaries:o.pendingSuspenseBoundaries,transitions:o.transitions},t.updateQueue.baseState=a,t.memoizedState=a,t.flags&256){i=sr(Error(v(423)),t),t=yl(e,t,n,r,i);break e}else if(n!==i){i=sr(Error(v(424)),t),t=yl(e,t,n,r,i);break e}else for(fe=lt(t.stateNode.containerInfo.firstChild),ge=t,D=!0,Me=null,r=Lc(t,null,n,r),t.child=r;r;)r.flags=r.flags&-3|4096,r=r.sibling;else{if(ir(),n===i){t=Xe(e,t,r);break e}ie(e,t,n,r)}t=t.child}return t;case 5:return Dc(t),e===null&&ja(t),n=t.type,i=t.pendingProps,a=e!==null?e.memoizedProps:null,o=i.children,Ba(n,i)?o=null:a!==null&&Ba(n,a)&&(t.flags|=32),sd(e,t),ie(e,t,o,r),t.child;case 6:return e===null&&ja(t),null;case 13:return cd(e,t,r);case 4:return zo(t,t.stateNode.containerInfo),n=t.pendingProps,e===null?t.child=ar(t,null,n,r):ie(e,t,n,r),t.child;case 11:return n=t.type,i=t.pendingProps,i=t.elementType===n?i:Te(n,i),xl(e,t,n,i,r);case 7:return ie(e,t,t.pendingProps,r),t.child;case 8:return ie(e,t,t.pendingProps.children,r),t.child;case 12:return ie(e,t,t.pendingProps.children,r),t.child;case 10:e:{if(n=t.type._context,i=t.pendingProps,a=t.memoizedProps,o=i.value,P(ri,n._currentValue),n._currentValue=o,a!==null)if(Pe(a.value,o)){if(a.children===i.children&&!ce.current){t=Xe(e,t,r);break e}}else for(a=t.child,a!==null&&(a.return=t);a!==null;){var s=a.dependencies;if(s!==null){o=a.child;for(var l=s.firstContext;l!==null;){if(l.context===n){if(a.tag===1){l=Ue(-1,r&-r),l.tag=2;var d=a.updateQueue;if(d!==null){d=d.shared;var f=d.pending;f===null?l.next=l:(l.next=f.next,f.next=l),d.pending=l}}a.lanes|=r,l=a.alternate,l!==null&&(l.lanes|=r),Wa(a.return,r,t),s.lanes|=r;break}l=l.next}}else if(a.tag===10)o=a.type===t.type?null:a.child;else if(a.tag===18){if(o=a.return,o===null)throw Error(v(341));o.lanes|=r,s=o.alternate,s!==null&&(s.lanes|=r),Wa(o,r,t),o=a.sibling}else o=a.child;if(o!==null)o.return=a;else for(o=a;o!==null;){if(o===t){o=null;break}if(a=o.sibling,a!==null){a.return=o.return,o=a;break}o=o.return}a=o}ie(e,t,i.children,r),t=t.child}return t;case 9:return i=t.type,n=t.pendingProps.children,er(t,r),i=Se(i),n=n(i),t.flags|=1,ie(e,t,n,r),t.child;case 14:return n=t.type,i=Te(n,t.pendingProps),i=Te(n.type,i),wl(e,t,n,i,r);case 15:return ad(e,t,t.type,t.pendingProps,r);case 17:return n=t.type,i=t.pendingProps,i=t.elementType===n?i:Te(n,i),Nn(e,t),t.tag=1,de(n)?(e=!0,$n(t)):e=!1,er(t,r),rd(t,n,i),Ga(t,n,i,r),Xa(null,t,n,!0,e,r);case 19:return dd(e,t,r);case 22:return od(e,t,r)}throw Error(v(156,t.tag))};function Cd(e,t){return $l(e,t)}function Pu(e,t,r,n){this.tag=e,this.key=r,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=n,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function ye(e,t,r,n){return new Pu(e,t,r,n)}function Vo(e){return e=e.prototype,!(!e||!e.isReactComponent)}function Lu(e){if(typeof e=="function")return Vo(e)?1:0;if(e!=null){if(e=e.$$typeof,e===po)return 11;if(e===uo)return 14}return 2}function ut(e,t){var r=e.alternate;return r===null?(r=ye(e.tag,t,e.key,e.mode),r.elementType=e.elementType,r.type=e.type,r.stateNode=e.stateNode,r.alternate=e,e.alternate=r):(r.pendingProps=t,r.type=e.type,r.flags=0,r.subtreeFlags=0,r.deletions=null),r.flags=e.flags&14680064,r.childLanes=e.childLanes,r.lanes=e.lanes,r.child=e.child,r.memoizedProps=e.memoizedProps,r.memoizedState=e.memoizedState,r.updateQueue=e.updateQueue,t=e.dependencies,r.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext},r.sibling=e.sibling,r.index=e.index,r.ref=e.ref,r}function jn(e,t,r,n,i,a){var o=2;if(n=e,typeof e=="function")Vo(e)&&(o=1);else if(typeof e=="string")o=5;else e:switch(e){case Nt:return Et(r.children,i,a,t);case co:o=8,i|=8;break;case ha:return e=ye(12,r,t,i|2),e.elementType=ha,e.lanes=a,e;case ma:return e=ye(13,r,t,i),e.elementType=ma,e.lanes=a,e;case va:return e=ye(19,r,t,i),e.elementType=va,e.lanes=a,e;case Dl:return Si(r,i,a,t);default:if(typeof e=="object"&&e!==null)switch(e.$$typeof){case Fl:o=10;break e;case Il:o=9;break e;case po:o=11;break e;case uo:o=14;break e;case $e:o=16,n=null;break e}throw Error(v(130,e==null?e:typeof e,""))}return t=ye(o,r,t,i),t.elementType=e,t.type=n,t.lanes=a,t}function Et(e,t,r,n){return e=ye(7,e,n,t),e.lanes=r,e}function Si(e,t,r,n){return e=ye(22,e,n,t),e.elementType=Dl,e.lanes=r,e.stateNode={isHidden:!1},e}function ua(e,t,r){return e=ye(6,e,null,t),e.lanes=r,e}function fa(e,t,r){return t=ye(4,e.children!==null?e.children:[],e.key,t),t.lanes=r,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}function Fu(e,t,r,n,i){this.tag=t,this.containerInfo=e,this.finishedWork=this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.pendingContext=this.context=null,this.callbackPriority=0,this.eventTimes=Ki(0),this.expirationTimes=Ki(-1),this.entangledLanes=this.finishedLanes=this.mutableReadLanes=this.expiredLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=Ki(0),this.identifierPrefix=n,this.onRecoverableError=i,this.mutableSourceEagerHydrationData=null}function Yo(e,t,r,n,i,a,o,s,l){return e=new Fu(e,t,r,s,l),t===1?(t=1,a===!0&&(t|=8)):t=0,a=ye(3,null,null,t),e.current=a,a.stateNode=e,a.memoizedState={element:n,isDehydrated:r,cache:null,transitions:null,pendingSuspenseBoundaries:null},Ro(a),e}function Iu(e,t,r){var n=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:Ht,key:n==null?null:""+n,children:e,containerInfo:t,implementation:r}}function Td(e){if(!e)return gt;e=e._reactInternals;e:{if(Pt(e)!==e||e.tag!==1)throw Error(v(170));var t=e;do{switch(t.tag){case 3:t=t.stateNode.context;break e;case 1:if(de(t.type)){t=t.stateNode.__reactInternalMemoizedMergedChildContext;break e}}t=t.return}while(t!==null);throw Error(v(171))}if(e.tag===1){var r=e.type;if(de(r))return Tc(e,r,t)}return t}function Ad(e,t,r,n,i,a,o,s,l){return e=Yo(r,n,!0,e,i,a,o,s,l),e.context=Td(null),r=e.current,n=ae(),i=pt(r),a=Ue(n,i),a.callback=t??null,ct(r,a,i),e.current.lanes=i,en(e,i,n),pe(e,n),e}function _i(e,t,r,n){var i=t.current,a=ae(),o=pt(i);return r=Td(r),t.context===null?t.context=r:t.pendingContext=r,t=Ue(a,o),t.payload={element:e},n=n===void 0?null:n,n!==null&&(t.callback=n),e=ct(i,t,o),e!==null&&(ze(e,i,o,a),Dn(e,i,o)),o}function ui(e){return e=e.current,e.child?(e.child.tag===5,e.child.stateNode):null}function zl(e,t){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var r=e.retryLane;e.retryLane=r!==0&&r<t?r:t}}function Xo(e,t){zl(e,t),(e=e.alternate)&&zl(e,t)}function Du(){return null}var Md=typeof reportError=="function"?reportError:function(e){console.error(e)};function Qo(e){this._internalRoot=e}Ei.prototype.render=Qo.prototype.render=function(e){var t=this._internalRoot;if(t===null)throw Error(v(409));_i(e,t,null,null)};Ei.prototype.unmount=Qo.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var t=e.containerInfo;Rt(function(){_i(null,e,null,null)}),t[Ve]=null}};function Ei(e){this._internalRoot=e}Ei.prototype.unstable_scheduleHydration=function(e){if(e){var t=oc();e={blockedOn:null,target:e,priority:t};for(var r=0;r<tt.length&&t!==0&&t<tt[r].priority;r++);tt.splice(r,0,e),r===0&&lc(e)}};function Ko(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function Ci(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11&&(e.nodeType!==8||e.nodeValue!==" react-mount-point-unstable "))}function Pl(){}function Bu(e,t,r,n,i){if(i){if(typeof n=="function"){var a=n;n=function(){var d=ui(o);a.call(d)}}var o=Ad(t,n,e,0,null,!1,!1,"",Pl);return e._reactRootContainer=o,e[Ve]=o.current,Gr(e.nodeType===8?e.parentNode:e),Rt(),o}for(;i=e.lastChild;)e.removeChild(i);if(typeof n=="function"){var s=n;n=function(){var d=ui(l);s.call(d)}}var l=Yo(e,0,!1,null,null,!1,!1,"",Pl);return e._reactRootContainer=l,e[Ve]=l.current,Gr(e.nodeType===8?e.parentNode:e),Rt(function(){_i(t,l,r,n)}),l}function Ti(e,t,r,n,i){var a=r._reactRootContainer;if(a){var o=a;if(typeof i=="function"){var s=i;i=function(){var l=ui(o);s.call(l)}}_i(t,o,e,i)}else o=Bu(r,t,e,i,n);return ui(o)}ic=function(e){switch(e.tag){case 3:var t=e.stateNode;if(t.current.memoizedState.isDehydrated){var r=Cr(t.pendingLanes);r!==0&&(ho(t,r|1),pe(t,j()),(T&6)===0&&(lr=j()+500,vt()))}break;case 13:Rt(function(){var n=Ye(e,1);if(n!==null){var i=ae();ze(n,e,1,i)}}),Xo(e,1)}};mo=function(e){if(e.tag===13){var t=Ye(e,134217728);if(t!==null){var r=ae();ze(t,e,134217728,r)}Xo(e,134217728)}};ac=function(e){if(e.tag===13){var t=pt(e),r=Ye(e,t);if(r!==null){var n=ae();ze(r,e,t,n)}Xo(e,t)}};oc=function(){return R};sc=function(e,t){var r=R;try{return R=e,t()}finally{R=r}};Ta=function(e,t,r){switch(t){case"input":if(ba(e,r),t=r.name,r.type==="radio"&&t!=null){for(r=e;r.parentNode;)r=r.parentNode;for(r=r.querySelectorAll("input[name="+JSON.stringify(""+t)+'][type="radio"]'),t=0;t<r.length;t++){var n=r[t];if(n!==e&&n.form===e.form){var i=vi(n);if(!i)throw Error(v(90));Hl(n),ba(n,i)}}}break;case"textarea":Ol(e,r);break;case"select":t=r.value,t!=null&&Kt(e,!!r.multiple,t,!1)}};Yl=Wo;Xl=Rt;var Hu={usingClientEntryPoint:!1,Events:[rn,Wt,vi,Gl,Vl,Wo]},kr={findFiberByHostInstance:yt,bundleType:0,version:"18.3.1",rendererPackageName:"react-dom"},Nu={bundleType:kr.bundleType,version:kr.version,rendererPackageName:kr.rendererPackageName,rendererConfig:kr.rendererConfig,overrideHookState:null,overrideHookStateDeletePath:null,overrideHookStateRenamePath:null,overrideProps:null,overridePropsDeletePath:null,overridePropsRenamePath:null,setErrorHandler:null,setSuspenseHandler:null,scheduleUpdate:null,currentDispatcherRef:Qe.ReactCurrentDispatcher,findHostInstanceByFiber:function(e){return e=Zl(e),e===null?null:e.stateNode},findFiberByHostInstance:kr.findFiberByHostInstance||Du,findHostInstancesForRefresh:null,scheduleRefresh:null,scheduleRoot:null,setRefreshHandler:null,getCurrentFiber:null,reconcilerVersion:"18.3.1-next-f1338f8080-20240426"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"&&(Sr=__REACT_DEVTOOLS_GLOBAL_HOOK__,!Sr.isDisabled&&Sr.supportsFiber))try{fi=Sr.inject(Nu),Be=Sr}catch{}var Sr;ve.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=Hu;ve.createPortal=function(e,t){var r=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!Ko(t))throw Error(v(200));return Iu(e,t,null,r)};ve.createRoot=function(e,t){if(!Ko(e))throw Error(v(299));var r=!1,n="",i=Md;return t!=null&&(t.unstable_strictMode===!0&&(r=!0),t.identifierPrefix!==void 0&&(n=t.identifierPrefix),t.onRecoverableError!==void 0&&(i=t.onRecoverableError)),t=Yo(e,1,!1,null,null,r,!1,n,i),e[Ve]=t.current,Gr(e.nodeType===8?e.parentNode:e),new Qo(t)};ve.findDOMNode=function(e){if(e==null)return null;if(e.nodeType===1)return e;var t=e._reactInternals;if(t===void 0)throw typeof e.render=="function"?Error(v(188)):(e=Object.keys(e).join(","),Error(v(268,e)));return e=Zl(t),e=e===null?null:e.stateNode,e};ve.flushSync=function(e){return Rt(e)};ve.hydrate=function(e,t,r){if(!Ci(t))throw Error(v(200));return Ti(null,e,t,!0,r)};ve.hydrateRoot=function(e,t,r){if(!Ko(e))throw Error(v(405));var n=r!=null&&r.hydratedSources||null,i=!1,a="",o=Md;if(r!=null&&(r.unstable_strictMode===!0&&(i=!0),r.identifierPrefix!==void 0&&(a=r.identifierPrefix),r.onRecoverableError!==void 0&&(o=r.onRecoverableError)),t=Ad(t,null,e,1,r??null,i,!1,a,o),e[Ve]=t.current,Gr(e),n)for(e=0;e<n.length;e++)r=n[e],i=r._getVersion,i=i(r._source),t.mutableSourceEagerHydrationData==null?t.mutableSourceEagerHydrationData=[r,i]:t.mutableSourceEagerHydrationData.push(r,i);return new Ei(t)};ve.render=function(e,t,r){if(!Ci(t))throw Error(v(200));return Ti(null,e,t,!1,r)};ve.unmountComponentAtNode=function(e){if(!Ci(e))throw Error(v(40));return e._reactRootContainer?(Rt(function(){Ti(null,null,e,!1,function(){e._reactRootContainer=null,e[Ve]=null})}),!0):!1};ve.unstable_batchedUpdates=Wo;ve.unstable_renderSubtreeIntoContainer=function(e,t,r,n){if(!Ci(r))throw Error(v(200));if(e==null||e._reactInternals===void 0)throw Error(v(38));return Ti(e,t,r,!1,n)};ve.version="18.3.1-next-f1338f8080-20240426"});var Ld=Ne((bf,Pd)=>{"use strict";function zd(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(zd)}catch(e){console.error(e)}}zd(),Pd.exports=Rd()});var Id=Ne(Zo=>{"use strict";var Fd=Ld();Zo.createRoot=Fd.createRoot,Zo.hydrateRoot=Fd.hydrateRoot;var yf});var Bd=Ne(Ai=>{"use strict";var Ou=ur(),qu=Symbol.for("react.element"),ju=Symbol.for("react.fragment"),Wu=Object.prototype.hasOwnProperty,Uu=Ou.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,Gu={key:!0,ref:!0,__self:!0,__source:!0};function Dd(e,t,r){var n,i={},a=null,o=null;r!==void 0&&(a=""+r),t.key!==void 0&&(a=""+t.key),t.ref!==void 0&&(o=t.ref);for(n in t)Wu.call(t,n)&&!Gu.hasOwnProperty(n)&&(i[n]=t[n]);if(e&&e.defaultProps)for(n in t=e.defaultProps,t)i[n]===void 0&&(i[n]=t[n]);return{$$typeof:qu,type:e,key:a,ref:o,props:i,_owner:Uu.current}}Ai.Fragment=ju;Ai.jsx=Dd;Ai.jsxs=Dd});var Mi=Ne((_f,Hd)=>{"use strict";Hd.exports=Bd()});var ih=Ft(ur()),h0=Ft(Id());var zi=Ft(Mi(),1),Lt=Ft(ur(),1);var Nd=`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Aetheris Labs</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital@1&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"><\/script>
    <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"><\/script>
</head>
<body class="bg-[#020208] text-white h-[100dvh] w-screen overflow-hidden font-['Inter'] relative flex flex-col justify-between selection:bg-[#00d2ff]/30 select-none antialiased" style="font-family: 'Inter', sans-serif;">
    
    <!-- Ambient Background WebGL -->
    <canvas id="bg-gl" class="absolute inset-0 w-full h-full z-0 opacity-0 transition-opacity duration-1000 ease-in" aria-hidden="true"></canvas>
    
    <!-- Vignette / Gradient Overlay -->
    <div class="absolute inset-0 z-0 pointer-events-none" style="background: radial-gradient(circle at 50% 50%, transparent 0%, #020208 100%); mix-blend-mode: multiply;"></div>

    <!-- Navigation -->
    <nav class="relative z-10 w-full px-8 py-6 flex justify-between items-center gs-fade">
        <div class="font-['Playfair_Display'] italic text-xl tracking-tight text-[#e2f1ff]">Aetheris.</div>
        
        <!-- Premium Gradient Border Pill -->
        <div style="padding: 1px; background: linear-gradient(180deg, rgba(226,241,255,0.15) 0%, rgba(226,241,255,0) 100%); border-radius: 9999px;">
            <div class="bg-[#080a14]/80 backdrop-blur-md rounded-full px-4 py-1.5 flex items-center gap-2" style="box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.05);">
                <div class="w-1.5 h-1.5 rounded-full bg-[#00d2ff]" style="animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
                <span class="text-xs font-normal text-[#e2f1ff]/60 tracking-widest uppercase">Drive Engaged</span>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main class="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4">
        
        <div class="gs-fade font-mono text-xs tracking-[0.3em] text-[#00d2ff] uppercase mb-8" style="font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;">
            SYS 09 / Cosmic Void
        </div>

        <!-- Masked Reveal Title -->
        <h1 class="text-5xl md:text-7xl font-medium tracking-tighter text-[#e2f1ff] mb-14 flex flex-col items-center gap-1 md:gap-3 drop-shadow-2xl">
            <div class="overflow-hidden pb-2"><span class="block translate-y-full gs-word">Access</span></div>
            <div class="overflow-hidden pb-2"><span class="block translate-y-full gs-word text-white/90">The Cosmos.</span></div>
        </h1>

        <div class="gs-scale-up">
            <!-- Quantum Aether Button -->
            <button id="btn" type="button" class="group relative flex items-center justify-center w-[250px] h-[70px] border-0 p-0 rounded-2xl overflow-hidden cursor-pointer bg-[#050b1a] outline-none transition-all duration-[220ms] ease-[cubic-bezier(0.34,1.4,0.5,1)] hover:-translate-y-[2px] active:translate-y-[1px] active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00d2ff] focus-visible:outline-offset-[5px]" style="box-shadow: 0 24px 48px rgba(4, 98, 126, 0.2), 0 3px 10px rgba(2, 6, 20, 0.35);">
                <canvas id="gl" class="absolute inset-0 w-full h-full block group-[.nogl]:hidden" aria-hidden="true"></canvas>
                <div class="absolute inset-0 hidden group-[.nogl]:block" style="background: radial-gradient(130% 170% at 50% 118%, #61d3ff 0%, #33a7ff 24%, #084c8e 56%, #050a19 88%);"></div>
                <span class="relative z-10 pointer-events-none font-semibold text-sm tracking-[.26em] indent-[.26em] text-[#e2f1ff]" style="text-shadow: 0 1px 12px rgba(0, 16, 40, .85);">AETHER DRIVE</span>
            </button>
        </div>

        <p class="gs-fade text-sm text-[#e2f1ff]/40 tracking-wide mt-10 max-w-sm" style="line-height: 1.6;">
            Hover to accelerate the drive, press to initiate hyper jump.
        </p>
    </main>

    <!-- Footer -->
    <footer class="relative z-10 w-full px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4 gs-fade text-xs text-[#e2f1ff]/30 tracking-wider">
        <span>\xA9 2025 Aetheris Labs</span>
        <div class="flex items-center gap-6">
            <a href="#" class="hover:text-[#e2f1ff]/70 transition-colors flex items-center gap-1.5">
                <iconify-icon icon="solar:document-text-linear" stroke-width="1.5" class="text-sm"></iconify-icon>
                Terms
            </a>
            <a href="#" class="hover:text-[#e2f1ff]/70 transition-colors flex items-center gap-1.5">
                <iconify-icon icon="solar:lock-keyhole-linear" stroke-width="1.5" class="text-sm"></iconify-icon>
                Privacy
            </a>
        </div>
    </footer>

    <!-- GSAP Animations -->
    <script>
        document.addEventListener("DOMContentLoaded", () => {
            gsap.set(".gs-word", { y: "100%" });
            gsap.set(".gs-fade", { opacity: 0, y: 15 });
            gsap.set(".gs-scale-up", { opacity: 0, scale: 0.85, y: 20 });

            const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

            // Reveal words
            tl.to(".gs-word", {
                y: "0%",
                duration: 1.2,
                stagger: 0.15,
                delay: 0.2
            })
            // Fade in nav and tag
            .to(".gs-fade", {
                opacity: 1,
                y: 0,
                duration: 1,
                stagger: 0.1
            }, "-=0.8")
            // Pop in the button
            .to(".gs-scale-up", {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 1.2,
                ease: "back.out(1.2)"
            }, "-=0.6");

            // Fade in ambient background
            document.getElementById('bg-gl').style.opacity = '0.45';
        });
    <\/script>

    <!-- WebGL Ambient Cosmic Background -->
    <script>
    (function () {
        var canvas = document.getElementById('bg-gl');
        var gl = canvas.getContext('webgl');
        if (!gl) return;

        var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
        var FS = [
            'precision highp float;',
            'uniform vec2 u_res;',
            'uniform float u_time;',
            'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}',
            'float noise(vec2 p){',
            '  vec2 i=floor(p), f=fract(p);',
            '  vec2 u=f*f*(3.0-2.0*f);',
            '  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),',
            '             mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);',
            '}',
            'float fbm(vec2 p){',
            '  float v=0.0; float a=0.5;',
            '  for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.02+vec2(17.3,9.1); a*=0.5; }',
            '  return v;',
            '}',
            'void main(){',
            '  vec2 uv = gl_FragCoord.xy / u_res;',
            '  vec2 p = uv * vec2(u_res.x/u_res.y, 1.0) * 1.5;',
            '  float t = u_time * 0.12;',
            '  vec2 q = vec2(fbm(p + vec2(0.0, t*0.28)), fbm(p + vec2(4.1, t*0.23)));',
            '  vec2 r = vec2(fbm(p + 1.5*q + vec2(2.1, 7.2) + t*0.1),',
            '                fbm(p + 1.4*q + vec2(5.3, 3.1) + t*0.07));',
            '  float v = fbm(p + 1.9*r);',
            '  float m = v*1.3;',
            '  vec3 c1 = vec3(0.002, 0.004, 0.015);',
            '  vec3 c2 = vec3(0.006, 0.018, 0.05);',
            '  vec3 c3 = vec3(0.02, 0.07, 0.18);',
            '  vec3 col = mix(c1, c2, smoothstep(0.1, 0.6, m));',
            '  col = mix(col, c3, smoothstep(0.6, 1.0, m));',
            '  float vein = exp(-abs(q.x - q.y) * 5.0);',
            '  col += c3 * vein * 0.12;',
            '  gl_FragColor = vec4(col, 1.0);',
            '}'
        ].join('\\n');

        function compile(type, src) {
            var s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            return s;
        }
        var prog = gl.createProgram();
        gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
        gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
        gl.linkProgram(prog);
        gl.useProgram(prog);

        var buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        var locP = gl.getAttribLocation(prog, 'p');
        gl.enableVertexAttribArray(locP);
        gl.vertexAttribPointer(locP, 2, gl.FLOAT, false, 0, 0);

        var uRes = gl.getUniformLocation(prog, 'u_res');
        var uTime = gl.getUniformLocation(prog, 'u_time');

        function resize() {
            var w = canvas.clientWidth;
            var h = canvas.clientHeight;
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
                gl.viewport(0, 0, w, h);
            }
        }
        window.addEventListener('resize', resize);
        resize();

        function frame(now) {
            resize();
            gl.uniform2f(uRes, canvas.width, canvas.height);
            gl.uniform1f(uTime, now / 1000);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    })();
    <\/script>

    <!-- WebGL Aether Engine Button -->
    <script>
    (function () {
        var btn = document.getElementById('btn');
        var canvas = document.getElementById('gl');
        var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var gl = canvas.getContext('webgl');
        if (!gl) { btn.classList.add('nogl'); return; }

        var hoverStyles = "0 30px 60px rgba(0, 150, 220, 0.35), 0 4px 12px rgba(2, 6, 20, 0.4)";
        var defaultStyles = "0 24px 48px rgba(4, 98, 126, 0.2), 0 3px 10px rgba(2, 6, 20, 0.35)";
        
        btn.addEventListener('mouseenter', () => { if(!reduced) btn.style.boxShadow = hoverStyles; });
        btn.addEventListener('mouseleave', () => { if(!reduced) btn.style.boxShadow = defaultStyles; });
        btn.addEventListener('focus', () => { if(!reduced) btn.style.boxShadow = hoverStyles; });
        btn.addEventListener('blur', () => { if(!reduced) btn.style.boxShadow = defaultStyles; });

        var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
        var FS = [
            'precision highp float;',
            'uniform vec2 u_res;',
            'uniform float u_time;',
            'uniform float u_heat;',
            'uniform float u_flash;',
            'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}',
            'float noise(vec2 p){',
            '  vec2 i=floor(p), f=fract(p);',
            '  vec2 u=f*f*(3.0-2.0*f);',
            '  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),',
            '             mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);',
            '}',
            'float fbm(vec2 p){',
            '  float v=0.0; float a=0.5;',
            '  for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.02+vec2(17.3,9.1); a*=0.5; }',
            '  return v;',
            '}',
            'void main(){',
            '  vec2 uv = gl_FragCoord.xy / u_res;',
            '  vec2 p = uv * vec2(u_res.x/u_res.y, 1.0) * 2.1;',
            '  float t = u_time;',
            '  float heat = u_heat + u_flash * 1.3;',
            '  vec2 q = vec2(fbm(p + vec2(0.0, t*0.32)), fbm(p + vec2(5.2, t*0.27)));',
            '  vec2 r = vec2(fbm(p + 1.7*q + vec2(1.7, 9.2) + t*0.12),',
            '                fbm(p + 1.6*q + vec2(8.3, 2.8) + t*0.09));',
            '  float v = fbm(p + 2.1*r);',
            '  float m = v*1.4 + heat*0.22;',
            '  vec3 c1 = vec3(0.004, 0.008, 0.035);',
            '  vec3 c2 = vec3(0.04, 0.08, 0.35);',
            '  vec3 c3 = vec3(0.0, 0.6, 1.0);',
            '  vec3 c4 = vec3(0.7, 0.9, 1.0);',
            '  vec3 col = mix(c1, c2, smoothstep(0.2, 0.52, m));',
            '  col = mix(col, c3, smoothstep(0.52, 0.8, m));',
            '  col = mix(col, c4, smoothstep(0.82, 1.02, m));',
            '  float vein = exp(-abs(q.x - q.y) * 9.0);',
            '  col += c3 * vein * (0.12 + heat * 0.25);',
            '  vec2 e = uv * (1.0 - uv);',
            '  float vig = pow(e.x * e.y * 16.0, 0.28);',
            '  col *= mix(0.5, 1.0, vig);',
            '  col *= 0.78 + heat * 0.5;',
            '  col += vec3(0.82, 0.94, 1.0) * u_flash * 0.4 * (0.3 + v);',
            '  gl_FragColor = vec4(col, 1.0);',
            '}'
        ].join('\\n');

        function compile(type, src) {
            var s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            return s;
        }
        var prog = gl.createProgram();
        gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
        gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
        gl.linkProgram(prog);
        gl.useProgram(prog);

        var buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        var locP = gl.getAttribLocation(prog, 'p');
        gl.enableVertexAttribArray(locP);
        gl.vertexAttribPointer(locP, 2, gl.FLOAT, false, 0, 0);

        var uRes = gl.getUniformLocation(prog, 'u_res');
        var uTime = gl.getUniformLocation(prog, 'u_time');
        var uHeat = gl.getUniformLocation(prog, 'u_heat');
        var uFlash = gl.getUniformLocation(prog, 'u_flash');

        function resize() {
            var dpr = Math.min(window.devicePixelRatio || 1, 2);
            var w = Math.max(1, Math.round(canvas.clientWidth * dpr));
            var h = Math.max(1, Math.round(canvas.clientHeight * dpr));
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
                gl.viewport(0, 0, w, h);
            }
        }
        window.addEventListener('resize', resize);
        resize();

        var heat = 0, heatTarget = 0, erupt = 0;
        var churn = 0;
        var last = performance.now();

        btn.addEventListener('mouseenter', function () { heatTarget = 1; });
        btn.addEventListener('mouseleave', function () { heatTarget = 0; });
        btn.addEventListener('focus', function () { heatTarget = 1; });
        btn.addEventListener('blur', function () { heatTarget = 0; });
        btn.addEventListener('mousedown', function () { erupt = 1; });
        btn.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') erupt = 1;
        });

        function frame(now) {
            var dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            heat += (heatTarget - heat) * Math.min(1, dt * 6);
            erupt *= Math.exp(-3.2 * dt);
            churn += dt * (0.35 + heat * 1.1 + erupt * 2.2);
            resize();
            gl.uniform2f(uRes, canvas.width, canvas.height);
            gl.uniform1f(uTime, reduced ? 6.0 : churn);
            gl.uniform1f(uHeat, heat);
            gl.uniform1f(uFlash, erupt);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    })();
    <\/script>
</body>
</html>`;var Od=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Supreme Radio \u2014 Graphic Identity</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%;background:#000;overflow:hidden}
  body{font-family:"Helvetica Neue",Helvetica,Arial,"Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic",sans-serif;-webkit-font-smoothing:antialiased}
  #stage{
    position:fixed;left:50%;top:50%;width:1080px;height:1350px;
    transform:translate(-50%,-50%);transform-origin:center;
    background:#000;overflow:hidden;color:#E8EEE9;
  }
  .scene{position:absolute;inset:0;opacity:0;pointer-events:none;will-change:opacity}
  .scene.on{pointer-events:auto}
  canvas#viz{position:absolute;inset:0}
  .overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:2}
  .sr{
    font-weight:800;font-size:54px;letter-spacing:-.045em;line-height:1;
    display:flex;align-items:center;gap:14px;white-space:nowrap;
  }
  .sr .word{display:flex;align-items:baseline;gap:12px}
  .icons{display:flex;align-items:center;gap:10px;margin-left:4px}
  .icons svg{display:block}

  #reelWrap{position:absolute;left:50%;top:50%;width:860px;height:860px;margin:-430px 0 0 -430px}
  #reel{width:860px;height:860px;transform-origin:430px 430px;will-change:transform}

  .lock{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0}
  .lock .top-icons{display:flex;gap:18px;margin-bottom:36px}
  .cat{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:15px;letter-spacing:.18em;margin-bottom:18px;font-weight:500}
  .bpm{
    font-weight:900;font-size:210px;letter-spacing:-.06em;line-height:.82;
    transform:scaleX(.78);font-stretch:condensed;position:relative;
    color:#E3EDE5;
  }
  .bpm sup{font-size:28px;position:absolute;right:-28px;top:18px;transform:scaleX(1.28);font-weight:700}
  .meta{
    margin-top:28px;text-align:center;
    font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
    font-size:15px;letter-spacing:.12em;line-height:1.7;font-weight:500;
  }
  .marks{display:flex;align-items:flex-end;justify-content:center;gap:54px;margin-top:64px}
  .jp{margin-top:48px;font-size:18px;letter-spacing:.12em;font-weight:500}

  .venn-wrap{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
  .venn{position:relative;width:560px;height:340px;margin:8px 0 28px}
  .ring{
    position:absolute;top:10px;width:320px;height:320px;border-radius:50%;
    border:7px solid #EA3927;box-sizing:border-box;
  }
  .ring.l{left:0}
  .ring.r{right:0}
  .letters{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:0;pointer-events:none}
  .letters span{
    width:186px;text-align:center;font-weight:800;font-size:92px;letter-spacing:-.04em;color:#E8EEE9;
  }
  .foot{text-align:center}
  .foot .sr2{font-weight:800;font-size:52px;letter-spacing:-.045em;margin-bottom:18px}
  .foot .sub{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:13px;letter-spacing:.22em;color:#c9d4cc;line-height:1.7}
  .ww{margin-top:36px}

  .grain{
    position:absolute;inset:0;pointer-events:none;z-index:8;opacity:.045;mix-blend-mode:overlay;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  }
</style>
</head>
<body>
<div id="stage">
  <svg width="0" height="0" style="position:absolute">
    <defs>
      <g id="i3">
        <path d="M3 3.2h18.5a1.6 1.6 0 0 1 0 3.2H6.4v4.2h13.2a1.6 1.6 0 0 1 0 3.2H6.4v4.2h15.1a1.6 1.6 0 0 1 0 3.2H3.2A1.6 1.6 0 0 1 1.6 19V4.8A1.6 1.6 0 0 1 3.2 3.2Z" fill="currentColor"/>
      </g>
      <g id="iP">
        <circle cx="12" cy="12" r="10.2" fill="none" stroke="currentColor" stroke-width="1.6"/>
        <text x="12" y="16.2" text-anchor="middle" font-size="12" font-weight="700" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" fill="currentColor">P</text>
      </g>
      <g id="iG">
        <circle cx="12" cy="12" r="10.2" fill="none" stroke="currentColor" stroke-width="1.5"/>
        <ellipse cx="12" cy="12" rx="4.2" ry="10.2" fill="none" stroke="currentColor" stroke-width="1.3"/>
        <path d="M2 12h20M4.2 7.2h15.6M4.2 16.8h15.6" fill="none" stroke="currentColor" stroke-width="1.2"/>
      </g>
      <g id="i1">
        <circle cx="12" cy="12" r="10.4" fill="currentColor"/>
        <text x="12" y="16.4" text-anchor="middle" font-size="12" font-weight="800" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" fill="#000">1</text>
      </g>
    </defs>
  </svg>

  <section class="scene" id="s1">
    <canvas id="viz" width="1080" height="1350"></canvas>
    <div class="overlay">
      <div class="sr" id="sr1">
        <span class="word">supreme radio</span>
        <span class="icons">
          <svg width="22" height="22" viewBox="0 0 24 24"><use href="#i3"/></svg>
          <svg width="22" height="22" viewBox="0 0 24 24"><use href="#iP"/></svg>
          <svg width="22" height="22" viewBox="0 0 24 24"><use href="#iG"/></svg>
          <svg width="22" height="22" viewBox="0 0 24 24"><use href="#i1"/></svg>
        </span>
      </div>
    </div>
  </section>

  <section class="scene" id="s2">
    <div id="reelWrap">
      <svg id="reel" viewBox="-430 -430 860 860">
        <defs>
          <mask id="rmask">
            <circle r="418" fill="#fff"/>
            <circle r="82" fill="#000"/>
            <g id="win">
              <path fill="#000" d="M-48 -148
                C -48 -168 -28 -176 0 -176
                C 28 -176 48 -168 48 -148
                L 70 -312
                C 70 -342 38 -358 0 -358
                C -38 -358 -70 -342 -70 -312 Z"/>
            </g>
            <use href="#win" transform="rotate(120)"/>
            <use href="#win" transform="rotate(240)"/>
            <circle cx="0" cy="-178" r="10" fill="#000"/>
            <circle cx="154" cy="89" r="10" fill="#000"/>
            <circle cx="-154" cy="89" r="10" fill="#000"/>
          </mask>
        </defs>
        <circle r="418" fill="#E3EDE5" mask="url(#rmask)"/>
        <g fill="#000">
          <rect x="-9" y="-98" width="18" height="16" rx="3"/>
          <rect x="-9" y="-98" width="18" height="16" rx="3" transform="rotate(120)"/>
          <rect x="-9" y="-98" width="18" height="16" rx="3" transform="rotate(240)"/>
        </g>
        <g fill="#000" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" text-anchor="middle">
          <g transform="translate(0,-250)">
            <g fill="none" stroke="#000" stroke-width="1.6">
              <circle r="22"/>
              <circle cx="16" r="22"/>
            </g>
            <text y="5" font-size="9" font-weight="800" fill="#000">BPM</text>
            <text y="38" font-size="8" font-weight="700" letter-spacing="1.6">WORLDWIDE</text>
            <text y="78" font-size="28" font-weight="800" letter-spacing="-1.2">supreme radio</text>
            <text y="102" font-size="9" font-weight="500">\xA92023 bpm supreme</text>
            <text y="124" font-size="13" font-weight="700" fill="#EA3927" font-family="Hiragino Sans, Yu Gothic, sans-serif">\u6BCE\u9031\u306E\u97F3\u697D</text>
          </g>
          <g transform="translate(-210,210)" text-anchor="start">
            <text font-size="11" font-weight="500">Catalogue No.</text>
            <text y="22" font-size="15" font-weight="800">\u2117BPM154\u2014LP2023</text>
            <g transform="translate(0,42)" fill="#EA3927">
              <use href="#i3" transform="scale(.9)"/>
              <use href="#iP" transform="translate(28,0) scale(.9)"/>
              <use href="#iG" transform="translate(56,0) scale(.9)"/>
              <use href="#i1" transform="translate(84,0) scale(.9)"/>
            </g>
          </g>
          <g transform="translate(168,188)" text-anchor="start">
            <g fill="#000" transform="scale(1.35)"><use href="#i3"/></g>
            <text y="48" font-size="12" font-weight="500">Episode No.</text>
            <text y="108" font-size="72" font-weight="800" letter-spacing="-2">154</text>
          </g>
        </g>
      </svg>
    </div>
  </section>

  <section class="scene" id="s3">
    <div class="lock" id="lock">
      <div class="top-icons">
        <svg width="26" height="26" viewBox="0 0 24 24"><use href="#i3"/></svg>
        <svg width="26" height="26" viewBox="0 0 24 24"><use href="#iP"/></svg>
        <svg width="26" height="26" viewBox="0 0 24 24"><use href="#iG"/></svg>
        <svg width="26" height="26" viewBox="0 0 24 24"><use href="#i1"/></svg>
      </div>
      <div class="cat">CATALOGUE SR/1.0</div>
      <div class="bpm">BPM<sup>\xAE</sup></div>
      <div class="meta">HERE FOR THE MUSIC.<br>LOS ANGELES, CALIFORNIA<br>WWW.BPMMUSIC.IO<br>WORLDWIDE \xA9 2023<br>MADE IN USA</div>
      <div class="marks">
        <svg width="120" height="78" viewBox="0 0 120 78">
          <g fill="none" stroke="#E3EDE5" stroke-width="1.7">
            <circle cx="48" cy="28" r="26"/>
            <circle cx="72" cy="28" r="26"/>
            <ellipse cx="60" cy="28" rx="10" ry="26"/>
          </g>
          <text x="60" y="32" text-anchor="middle" fill="#E3EDE5" font-size="11" font-weight="800" font-family="Helvetica Neue, Helvetica, Arial, sans-serif">BPM</text>
          <text x="60" y="72" text-anchor="middle" fill="#E3EDE5" font-size="9" font-weight="700" letter-spacing="2.2" font-family="ui-monospace, Menlo, monospace">WORLDWIDE</text>
        </svg>
        <svg width="44" height="44" viewBox="0 0 24 24"><use href="#i3"/></svg>
        <svg width="148" height="64" viewBox="0 0 148 64">
          <rect x="1" y="1" width="146" height="50" rx="6" fill="none" stroke="#E3EDE5" stroke-width="1.6"/>
          <g transform="translate(10,8)" fill="#E3EDE5"><use href="#i3"/></g>
          <g transform="translate(38,8)" fill="#E3EDE5"><use href="#iP"/></g>
          <g transform="translate(108,6)" fill="#E3EDE5" stroke="#E3EDE5"><use href="#iG"/></g>
          <rect x="10" y="34" width="72" height="14" rx="2" fill="#E3EDE5"/>
          <text x="46" y="45" text-anchor="middle" font-size="9" font-weight="700" fill="#000" font-family="Helvetica Neue, Helvetica, Arial, sans-serif">bpm radio</text>
          <text x="142" y="12" font-size="10" fill="#E3EDE5">\xAE</text>
        </svg>
      </div>
      <div class="jp">\u6BCE\u9031\u306E\u97F3\u697D</div>
    </div>
  </section>

  <section class="scene" id="s4">
    <div class="venn-wrap">
      <div class="top-icons" style="display:flex;gap:18px;margin-bottom:28px">
        <svg width="24" height="24" viewBox="0 0 24 24"><use href="#i3"/></svg>
        <svg width="24" height="24" viewBox="0 0 24 24"><use href="#iP"/></svg>
        <svg width="24" height="24" viewBox="0 0 24 24"><use href="#iG"/></svg>
        <svg width="24" height="24" viewBox="0 0 24 24"><use href="#i1"/></svg>
      </div>
      <div class="venn">
        <div class="ring l" id="ringL"></div>
        <div class="ring r" id="ringR"></div>
        <div class="letters" id="bpmLetters"><span>B</span><span>P</span><span>M</span></div>
      </div>
      <div class="foot">
        <div class="sr2" id="sr2">supreme radio</div>
        <div class="sub">ANALOGOUS SOUNDS<br>SR/1.0</div>
        <svg class="ww" width="110" height="70" viewBox="0 0 120 78">
          <g fill="none" stroke="#E3EDE5" stroke-width="1.7">
            <circle cx="48" cy="28" r="26"/>
            <circle cx="72" cy="28" r="26"/>
            <ellipse cx="60" cy="28" rx="10" ry="26"/>
          </g>
          <text x="60" y="32" text-anchor="middle" fill="#E3EDE5" font-size="11" font-weight="800" font-family="Helvetica Neue, Helvetica, Arial, sans-serif">BPM</text>
          <text x="60" y="72" text-anchor="middle" fill="#E3EDE5" font-size="9" font-weight="700" letter-spacing="2.2" font-family="ui-monospace, Menlo, monospace">WORLDWIDE</text>
        </svg>
      </div>
    </div>
  </section>
  <div class="grain"></div>
</div>
<script>
(function(){
  var DUR = 20;
  var HOLD = 4.7;
  var FADE = 0.3;
  var stage = document.getElementById("stage");
  var scenes = [document.getElementById("s1"), document.getElementById("s2"), document.getElementById("s3"), document.getElementById("s4")];
  var canvas = document.getElementById("viz");
  var ctx = canvas.getContext("2d");
  var reel = document.getElementById("reel");
  var lock = document.getElementById("lock");
  var ringL = document.getElementById("ringL");
  var ringR = document.getElementById("ringR");
  var letters = document.getElementById("bpmLetters");
  var sr1 = document.getElementById("sr1");
  var sr2 = document.getElementById("sr2");

  function sat(x){ return x<0?0:x>1?1:x; }
  function lerp(a,b,t){ return a+(b-a)*t; }
  function easeOut(t){ t=sat(t); return 1-Math.pow(1-t,3); }
  function easeInOut(t){ t=sat(t); return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2; }
  function backOut(t){ t=sat(t); var c1=1.70158,c3=c1+1; return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2); }

  function fit(){
    var s = Math.min(innerWidth/1080, innerHeight/1350);
    stage.style.transform = "translate(-50%,-50%) scale("+s+")";
  }

  function drawViz(t){
    var w=1080,h=1350;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle="#000";
    ctx.fillRect(0,0,w,h);
    var cx=540, cy=675, r=156, gap=148;
    drawBars(cx-gap, cy, r, t, false);
    drawBars(cx+gap, cy, r, t+1.7, true);
  }

  function drawBars(cx, cy, r, t, inverse){
    var n = inverse ? 16 : 22;
    var pitch = (r*2) / n;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.clip();
    if (inverse){
      ctx.fillStyle="#EA3927";
      ctx.fill();
      ctx.globalCompositeOperation="destination-out";
      ctx.fillStyle="#000";
    } else {
      ctx.fillStyle="#EA3927";
    }
    for (var i=0;i<n;i++){
      var x = -r + (i+0.5)*pitch;
      var maxH = Math.sqrt(Math.max(0, r*r - x*x)) * 2;
      if (maxH < 6) continue;
      var pulse = 0.78 + 0.22*Math.sin(t*6.4 + i*0.62)*Math.sin(t*2.4 + i*0.17);
      var hh = inverse ? maxH : maxH;
      var bw = (inverse ? pitch*0.38 : pitch*0.62) * (inverse ? 1 : pulse);
      var px = cx + x - bw/2;
      var py = cy - hh/2;
      roundRect(px, py, Math.max(2,bw), hh, Math.min(bw, hh)*0.45);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalCompositeOperation="source-over";
  }

  function roundRect(x,y,w,h,r){
    r=Math.min(r,w/2,h/2);
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }

  function sceneAt(t){
    var slot = HOLD + FADE;
    var i = Math.floor(t / slot) % 4;
    var local = t - i*slot;
    var fadeOut = sat((local - HOLD)/FADE);
    var fadeIn = local < FADE ? sat(local/FADE) : 1;
    return {i:i, local:local, fadeIn:fadeIn, fadeOut:fadeOut, op: fadeIn*(1-fadeOut)};
  }

  function apply(t){
    t = ((t % DUR)+DUR)%DUR;
    var s = sceneAt(t);
    for (var k=0;k<4;k++){
      scenes[k].style.opacity = k===s.i ? String(s.op) : "0";
      scenes[k].classList.toggle("on", k===s.i && s.op>0.02);
    }
    var lt = s.local;

    if (s.i===0){
      drawViz(t);
      var p = easeOut(sat(lt/0.7));
      sr1.style.opacity = String(p);
      sr1.style.letterSpacing = lerp(0.18, -0.045, p) + "em";
    }
    if (s.i===1){
      reel.style.transform = "rotate(" + (lt*36) + "deg)";
    }
    if (s.i===2){
      var kids = lock.children;
      for (var k=0;k<kids.length;k++){
        var u = easeOut(sat((lt - k*0.09)/0.45));
        kids[k].style.opacity = String(u);
        kids[k].style.transform = "translateY(" + ((1-u)*14) + "px)";
      }
    }
    if (s.i===3){
      var u = easeInOut(sat(lt/0.9));
      ringL.style.transform = "translateX(" + lerp(-70,0,u) + "px)";
      ringR.style.transform = "translateX(" + lerp(70,0,u) + "px)";
      var lp = backOut(sat((lt-0.45)/0.5));
      letters.style.opacity = String(lp);
      letters.style.transform = "scale(" + lerp(0.72,1,lp) + ")";
      var tp = easeOut(sat((lt-0.7)/0.5));
      sr2.style.opacity = String(tp);
      sr2.style.letterSpacing = lerp(0.22, -0.045, tp) + "em";
    }
  }

  var tNow=0, playing=true, t0=performance.now();
  var params=new URLSearchParams(location.search);
  if (params.has("t")){ tNow=parseFloat(params.get("t"))||0; playing=false; }
  if (matchMedia("(prefers-reduced-motion: reduce)").matches){ playing=false; tNow=16.2; }

  function frame(now){
    if (playing && !document.hidden){
      tNow = ((now-t0)/1000) % DUR;
      apply(tNow);
    }
    requestAnimationFrame(frame);
  }
  window.addEventListener("resize", fit);
  document.addEventListener("visibilitychange", function(){
    if (!document.hidden && playing) t0=performance.now()-tNow*1000;
  });
  fit(); apply(tNow); requestAnimationFrame(frame);

  window.__DUR = DUR;
  window.__seek = function(t){ tNow=((t%DUR)+DUR)%DUR; playing=false; apply(tNow); };
  window.__play = function(){ t0=performance.now()-tNow*1000; playing=true; };
  window.__pause = function(){ playing=false; };
  window.__time = function(){ return tNow; };
})();
<\/script>
</body>
</html>
`;var qd=`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Component Preview</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
    }
    body {
      height: 100%;
      overflow: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #000000;
      color: #ffffff;
    }
    .component-wrapper {
      width: 100%;
      height: 100%;
      padding: 0;
      box-sizing: border-box;
      overflow: auto;
    }
  </style>
</head>
<body>
  <div class="component-wrapper">
    <html><head></head><body><div style="
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #000; /* optional, just for visibility */
"><a href="#" class="btn-wrapper" style="--dot-size: 8px; --line-weight: 1px; --line-distance: 0.8rem 1rem; --animation-speed: 0.35s; --dot-color: #fffa; --line-color: #fffa; --grid-color: #fff3; position: relative; display: inline-flex; justify-content: center; align-items: center; width: auto; height: auto; padding: var(--line-distance); background-color: rgba(0, 0, 0, 0); user-select: none">
  <style>
    .btn-wrapper::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border-radius: inherit;
      pointer-events: none;
      background-color: #0000;
      background-image: repeating-linear-gradient(45deg, var(--grid-color) 0 1px, transparent 2px 5px);
      opacity: 0;
      z-index: -1;
    }

    .btn-wrapper:has(.btn:hover)::after {
      animation: opacity-anim calc(var(--animation-speed) * 4) ease-in-out forwards;
    }

    @keyframes opacity-anim {
      80% {
        opacity: 0;
      }

      100% {
        opacity: 1;
      }
    }

    .btn-wrapper .btn {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0.8rem 1.25rem;
      background-color: #fff0;
      border: 1px solid var(--grid-color);
      color: #fffd;
      font-family: "Inter", sans-serif;
      letter-spacing: -0.01em;
      font-size: 1rem;
      font-weight: 600;
      text-transform: capitalize;
      border-radius: 6px;
      cursor: pointer;
      transition: transform .2s ease-in-out, letter-spacing .2s ease-in-out;
    }

    .btn-wrapper .btn:hover {
      background-color: #25358b;
      color: #fff;
      transform: scale(1.05);
      letter-spacing: .06em;
    }

    .btn-wrapper .btn:active {
      background-color: #25358b;
      transform: scale(.98);
      letter-spacing: .02em;
    }

    .btn-wrapper .btn-svg {
      margin-left: .5rem;
      height: 24px;
      stroke-width: 1;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke: #fff4;
      fill: #fff2;
      transition: all .2s ease-in-out;
    }

    .btn-wrapper .btn:hover .btn-svg {
      stroke: #fffa;
      fill: #fff3;
    }

    .btn-wrapper .dot {
      position: absolute;
      width: var(--dot-size);
      aspect-ratio: 1;
      border-radius: 2px;
      background-color: var(--dot-color);
      transition: all .3s ease-in-out;
      opacity: 0;
    }

    .btn-wrapper:has(.btn:hover) .dot.top.left {
      top: 50%;
      left: 20%;
      animation: move-top-left var(--animation-speed) ease-in-out forwards;
    }

    @keyframes move-top-left {
      90% {
        opacity: .6;
      }

      100% {
        top: calc(var(--dot-size) * -0.5);
        left: calc(var(--dot-size) * -0.5);
        opacity: 1;
      }
    }

    .btn-wrapper:has(.btn:hover) .dot.top.right {
      top: 50%;
      right: 20%;
      animation: move-top-right var(--animation-speed) ease-in-out forwards;
      animation-delay: calc(var(--animation-speed)*.6);
    }

    @keyframes move-top-right {
      80% {
        opacity: .6;
      }

      100% {
        top: calc(var(--dot-size) * -0.5);
        right: calc(var(--dot-size) * -0.5);
        opacity: 1;
      }
    }

    .btn-wrapper:has(.btn:hover) .dot.bottom.right {
      bottom: 50%;
      right: 20%;
      animation: move-bottom-right var(--animation-speed) ease-in-out forwards;
      animation-delay: calc(var(--animation-speed)*1.2);
    }

    @keyframes move-bottom-right {
      80% {
        opacity: .6;
      }

      100% {
        bottom: calc(var(--dot-size) * -0.5);
        right: calc(var(--dot-size) * -0.5);
        opacity: 1;
      }
    }

    .btn-wrapper:has(.btn:hover) .dot.bottom.left {
      bottom: 50%;
      left: 20%;
      animation: move-bottom-left var(--animation-speed) ease-in-out forwards;
      animation-delay: calc(var(--animation-speed)*1.8);
    }

    @keyframes move-bottom-left {
      80% {
        opacity: .6;
      }

      100% {
        bottom: calc(var(--dot-size) * -0.5);
        left: calc(var(--dot-size) * -0.5);
        opacity: 1;
      }
    }

    .btn-wrapper .line {
      position: absolute;
      transition: all .3s ease-in-out;
    }

    .btn-wrapper .line.horizontal {
      height: var(--line-weight);
      width: 100%;
      background-image: repeating-linear-gradient(90deg, #0000 0 calc(var(--line-weight)*2), var(--line-color) calc(var(--line-weight)*2) calc(var(--line-weight)*4));
    }

    .btn-wrapper .line.top {
      top: calc(var(--line-weight)*-0.5);
      transform-origin: top left;
      transform: rotate(5deg) scaleX(0);
    }

    .btn-wrapper:has(.btn:hover) .line.top {
      animation: draw-top var(--animation-speed) ease-in-out forwards;
      animation-delay: calc(var(--animation-speed)*.8);
    }

    @keyframes draw-top {
      100% {
        transform: rotate(0deg) scaleX(1);
      }
    }

    .btn-wrapper .line.bottom {
      bottom: calc(var(--line-weight)*-0.5);
      transform-origin: bottom right;
      transform: rotate(5deg) scaleX(0);
    }

    .btn-wrapper:has(.btn:hover) .line.bottom {
      animation: draw-bottom var(--animation-speed) ease-in-out forwards;
      animation-delay: calc(var(--animation-speed)*2);
    }

    @keyframes draw-bottom {
      100% {
        transform: rotate(0deg) scaleX(1);
      }
    }

    .btn-wrapper .line.vertical {
      width: var(--line-weight);
      height: 100%;
      background-image: repeating-linear-gradient(0deg, #0000 0 calc(var(--line-weight)*2), var(--line-color) calc(var(--line-weight)*2) calc(var(--line-weight)*4));
    }

    .btn-wrapper .line.left {
      left: calc(var(--line-weight)*-0.5);
      transform-origin: bottom left;
      transform: rotate(0deg) scaleY(0);
    }

    .btn-wrapper:has(.btn:hover) .line.left {
      animation: draw-left var(--animation-speed) ease-in-out forwards;
      animation-delay: calc(var(--animation-speed)*2.4);
    }

    @keyframes draw-left {
      100% {
        transform: rotate(0deg) scaleY(1);
      }
    }

    .btn-wrapper .line.right {
      right: calc(var(--line-weight)*-0.5);
      transform-origin: top right;
      transform: rotate(5deg) scaleY(0);
    }

    .btn-wrapper:has(.btn:hover) .line.right {
      animation: draw-right var(--animation-speed) ease-in-out forwards;
      animation-delay: calc(var(--animation-speed)*1.4);
    }

    @keyframes draw-right {
      100% {
        transform: rotate(0deg) scaleY(1);
      }
    }
  </style>

  <div class="line horizontal top"></div>
  <div class="line vertical right"></div>
  <div class="line horizontal bottom"></div>
  <div class="line vertical left"></div>

  <div class="dot top left"></div>
  <div class="dot top right"></div>
  <div class="dot bottom right"></div>
  <div class="dot bottom left"></div>

  <button class="btn bg-[#ffffff]">
            <span class="btn-text">Start Creating</span>
            <svg class="btn-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.6744 11.4075L15.7691 17.1233C15.7072 17.309 15.5586 17.4529 15.3709 17.5087L3.69348 20.9803C3.22819 21.1186 2.79978 20.676 2.95328 20.2155L6.74467 8.84131C6.79981 8.67588 6.92419 8.54263 7.08543 8.47624L12.472 6.25822C12.696 6.166 12.9535 6.21749 13.1248 6.38876L17.5294 10.7935C17.6901 10.9542 17.7463 11.1919 17.6744 11.4075Z" class=""></path>
              <path d="M3.2959 20.6016L9.65986 14.2376" class=""></path>
              <path d="M17.7917 11.0557L20.6202 8.22724C21.4012 7.44619 21.4012 6.17986 20.6202 5.39881L18.4989 3.27749C17.7178 2.49645 16.4515 2.49645 15.6704 3.27749L12.842 6.10592" class=""></path>
              <path d="M11.7814 12.1163C11.1956 11.5305 10.2458 11.5305 9.66004 12.1163C9.07426 12.7021 9.07426 13.6519 9.66004 14.2376C10.2458 14.8234 11.1956 14.8234 11.7814 14.2376C12.3671 13.6519 12.3671 12.7021 11.7814 12.1163Z" class=""></path>
            </svg>
          </button>
</a></div></body></html>
  </div>
  
    <script>
      (function() {
        function checkAndCenter() {
          // Use double requestAnimationFrame to ensure DOM is fully painted and layout is stable
          requestAnimationFrame(function() {
            requestAnimationFrame(function() {
              const wrapper = document.querySelector('.component-wrapper');
              if (!wrapper) return;
              
              // Get all child elements
              const children = Array.from(wrapper.children);
              if (children.length === 0) return;
              
              // Temporarily override wrapper styles to shrink-wrap for measurement
              // Set inline styles to shrink-wrap (inline styles override CSS)
              wrapper.style.display = 'inline-block';
              wrapper.style.width = 'auto';
              wrapper.style.height = 'auto';
              wrapper.style.overflow = 'visible';
              wrapper.style.boxSizing = 'content-box';
              
              // Force multiple reflows to ensure styles are fully applied
              void wrapper.offsetHeight;
              void wrapper.offsetWidth;
              void wrapper.offsetHeight;
              
              // Measure the wrapper's content size
              const contentWidth = wrapper.offsetWidth;
              const contentHeight = wrapper.offsetHeight;
              
              // Restore original styles by removing inline styles we added
              wrapper.style.removeProperty('display');
              wrapper.style.removeProperty('width');
              wrapper.style.removeProperty('height');
              wrapper.style.removeProperty('overflow');
              wrapper.style.removeProperty('box-sizing');
              
              // If content is less than 500x500, center it
              if (contentWidth > 0 && contentHeight > 0 && contentWidth < 500 && contentHeight < 500) {
                wrapper.style.display = 'flex';
                wrapper.style.alignItems = 'center';
                wrapper.style.justifyContent = 'center';
              }
            });
          });
        }
        
        // Check immediately and after delays to ensure content is rendered and styled
        function runChecks() {
          checkAndCenter();
          setTimeout(checkAndCenter, 50);
          setTimeout(checkAndCenter, 150);
          setTimeout(checkAndCenter, 300);
          setTimeout(checkAndCenter, 500);
          setTimeout(checkAndCenter, 1000);
        }
        
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', runChecks);
        } else {
          runChecks();
        }
        
        // Also check when images or other resources load
        window.addEventListener('load', () => {
          setTimeout(checkAndCenter, 100);
          setTimeout(checkAndCenter, 300);
        });
        
        // Use ResizeObserver to detect size changes
        if (window.ResizeObserver) {
          setTimeout(() => {
            const wrapper = document.querySelector('.component-wrapper');
            if (wrapper) {
              const observer = new ResizeObserver(() => {
                setTimeout(checkAndCenter, 50);
              });
              observer.observe(wrapper);
            }
          }, 500);
        }
      })();
    <\/script>
  
</body>
</html>
`;var jd=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Creator Studio \u2014 Keynote Motion Study</title>
<meta name="description" content="Self-contained 30-second keynote-style motion study: twenty-one beats of kinetic type, device mockups and app props on black.">
<style>
  :root{
    --ink:#f5f5f7;
    --font:-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text","Helvetica Neue",Helvetica,Arial,sans-serif;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%;overflow:hidden;background:#000}
  body{display:grid;place-items:center;font-family:var(--font);color:var(--ink)}
  .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
  #stage{position:relative;width:min(100vw,177.78vh);aspect-ratio:16/9;overflow:hidden;background:#000}
  #comp{position:absolute;left:50%;top:50%;width:1280px;height:720px;margin:-360px 0 0 -640px;transform-origin:50% 50%}
  .scene{position:absolute;inset:0;display:none}
  .scene.on{display:block}

  /* ---------- type ---------- */
  .line{position:absolute;inset:0;pointer-events:none}
  .tx{position:absolute;left:0;right:0;top:50%;text-align:center;white-space:nowrap;
      font-weight:600;letter-spacing:-.012em;line-height:1;transform:translateY(-50%);
      will-change:transform,opacity,filter}
  .tx span{display:inline-block;will-change:transform,opacity,filter}
  #ruler{position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre;
         font-weight:600;letter-spacing:-.012em;line-height:1;font-size:100px}

  .mark{display:inline-block;vertical-align:-.07em;margin-right:.14em}
  .mark svg{display:block;width:.8em;height:.8em}

  /* ---------- window wall ---------- */
  .win{position:absolute;border-radius:10px;overflow:hidden;background:#0b0b0f;
       box-shadow:0 22px 54px rgba(0,0,0,.72);will-change:transform,opacity}
  .win:after{content:"";position:absolute;inset:0;background:rgba(0,0,0,.34);pointer-events:none}
  .win .pane{position:absolute;left:7%;right:7%;top:14%;bottom:12%;border-radius:4px;overflow:hidden}
  .win .bar{height:15px;background:#26262b;display:flex;align-items:center;gap:4px;padding:0 6px}
  .win .bar i{width:5px;height:5px;border-radius:50%;background:#4a4a52;display:block}
  .win .body{position:absolute;left:0;right:0;top:15px;bottom:0}
  .win .side{position:absolute;left:0;top:0;bottom:0;width:21%;background:#1b1b20}
  .win .side u{display:block;height:6px;margin:6px 5px;border-radius:2px;background:#31313a}
  .win .strip{position:absolute;left:0;right:0;bottom:0;background:#131318}
  .win .strip u{position:absolute;bottom:5px;border-radius:2px}
  .win .bars{position:absolute;left:26%;right:7%;bottom:13%;top:18%;display:flex;align-items:flex-end;gap:6%}
  .win .bars u{flex:1;border-radius:1px}
  .win .txt{position:absolute;left:8%;right:8%;top:12%}
  .win .txt u{display:block;height:5px;border-radius:2px;background:#3c3c46;margin-bottom:7px}
  .win .tiles{position:absolute;inset:6%;display:grid;grid-template-columns:repeat(4,1fr);gap:4px}
  .win .tiles u{border-radius:2px}

  /* ---------- dock ---------- */
  #dockBar{position:absolute;left:125px;top:306px;width:1025px;height:106px;border-radius:26px;
           background:rgba(36,36,42,.74);border:1px solid rgba(255,255,255,.07);
           transform-origin:50% 50%;will-change:transform,opacity}
  .ico{position:absolute;width:65px;height:65px;border-radius:16px;
       background:linear-gradient(180deg,#3a3a43,#1d1d24);border:1px solid rgba(255,255,255,.13);
       box-shadow:inset 0 1px 0 rgba(255,255,255,.14);
       display:grid;place-items:center;will-change:transform,opacity}
  .ico svg{width:58px;height:58px;display:block;filter:saturate(1.15)}

  /* ---------- audio tracks ---------- */
  .track{position:absolute;left:340px;width:600px;border-radius:11px;overflow:hidden;
         transform-origin:50% 100%;will-change:transform,opacity}
  .track b{position:absolute;left:9px;top:5px;font-size:11px;font-weight:500;letter-spacing:.02em;color:rgba(255,255,255,.95)}
  .track .art{position:absolute;left:0;right:0;top:19px;bottom:0}
  .track .art u{position:absolute;background:rgba(255,255,255,.9);border-radius:1px}

  /* ---------- devices ---------- */
  .mac{position:absolute;left:50%;top:123px;width:648px;margin-left:-324px;will-change:transform,opacity}
  .mac .lid{position:relative;border:10px solid #1b1b1f;border-radius:20px;background:#000;
            box-shadow:0 0 0 1px #3d3d44,0 34px 70px rgba(0,0,0,.75)}
  .mac .scr{position:relative;width:100%;padding-top:64%;overflow:hidden;border-radius:9px;background:#000}
  .mac .notch{position:absolute;left:50%;top:-8px;width:78px;height:8px;margin-left:-39px;background:#1b1b1f;border-radius:0 0 6px 6px}
  .mac .base{position:relative;left:50%;width:746px;height:15px;margin-left:-373px;border-radius:0 0 14px 14px;
             background:linear-gradient(180deg,#2c2c33,#0d0d10);box-shadow:0 8px 22px rgba(0,0,0,.75)}
  .mac .base:after{content:"";position:absolute;left:50%;bottom:0;width:96px;height:5px;margin-left:-48px;
                   border-radius:0 0 5px 5px;background:#3a3a42}
  .pad{position:absolute;left:50%;top:157px;width:557px;margin-left:-278.5px;padding:12px;border-radius:26px;
       background:linear-gradient(160deg,#63676f,#2b2d33);box-shadow:0 30px 70px rgba(0,0,0,.75);
       transform-origin:50% 46%;will-change:transform,opacity}
  .pad .scr{position:relative;width:100%;padding-top:73.5%;overflow:hidden;border-radius:15px;background:#000}
  .scrIn{position:absolute;inset:0}

  .grad{position:absolute;inset:0}
  .grad b{position:absolute;border-radius:50%;display:block}
  .canvasType{position:absolute;inset:0;font-weight:600;letter-spacing:-.022em;line-height:.94}
  .canvasType div{position:absolute;white-space:nowrap;will-change:transform,opacity}

  .tbox{position:absolute;border:1px solid rgba(255,255,255,.55);will-change:transform,opacity}
  .tbox i{position:absolute;width:6px;height:6px;background:#fff;border:1px solid #75757c}
  .tbox i:nth-child(1){left:-3px;top:-3px}.tbox i:nth-child(2){right:-3px;top:-3px}
  .tbox i:nth-child(3){left:-3px;bottom:-3px}.tbox i:nth-child(4){right:-3px;bottom:-3px}
  .tbox span{position:absolute;left:10px;top:50%;transform:translateY(-52%);font-weight:600;white-space:nowrap;letter-spacing:-.02em}

  .palette{position:absolute;right:9px;top:9px;bottom:9px;width:28px;border-radius:14px;
           background:rgba(42,42,48,.9);display:flex;flex-direction:column;align-items:center;gap:9px;padding:9px 0}
  .palette u{display:block;width:11px;height:11px;border-radius:3px;background:#71717b}
  .guide{position:absolute;left:0;right:0;height:1px;background:#3ad462;opacity:.75}
  .hand{position:absolute;will-change:transform,opacity}

  /* ---------- edit clip ---------- */
  #clip{position:absolute;border-radius:5px;overflow:hidden;background:#0e1430;
        border:2px solid #6a3af0;box-shadow:0 0 34px rgba(120,60,255,.75),inset 0 0 0 1px rgba(180,150,255,.4);
        will-change:transform,opacity}
  #clip .thumbs{position:absolute;left:0;right:0;top:0;height:74%;display:flex}
  #clip .thumbs u{flex:1;border-right:1px solid rgba(0,0,0,.4);position:relative;overflow:hidden;
                  background:linear-gradient(180deg,#8e9aa8 0%,#c3c9cf 42%,#6d757f 43%,#3c4249 100%)}
  #clip .thumbs u:after{content:"";position:absolute;left:34%;top:26%;width:32%;height:62%;border-radius:44% 44% 12% 12%;background:#14161c}
  #clip .wave{position:absolute;left:0;right:0;bottom:0;height:26%;background:#232a55;display:flex;align-items:flex-end;gap:1px;padding:0 2px}
  #clip .wave u{flex:1;background:rgba(190,200,255,.55);border-radius:1px 1px 0 0}

  /* ---------- prompt ---------- */
  #daisyC{position:absolute;left:0;top:0}
  #liquid{filter:url(#goo);position:absolute;inset:0}
  #liquid .drop{position:absolute;border-radius:50%;background:#8ecfee}
  .gloss{position:absolute;left:0;right:0;top:50%;text-align:center;white-space:nowrap;
         font-weight:700;letter-spacing:-.02em;line-height:1;transform:translateY(-50%);
         color:transparent;background:linear-gradient(180deg,#ffffff 4%,#c8ebfb 32%,#5aa6cf 76%);
         -webkit-background-clip:text;background-clip:text;mix-blend-mode:screen}

  /* ---------- props ---------- */
  .keys{position:absolute;left:351px;top:421px;width:580px;height:123px;display:flex;gap:6px;will-change:opacity}
  .keys u{flex:1;border-radius:9px;background:linear-gradient(180deg,#3c3c43,#26262c);
          box-shadow:inset 0 1px 0 rgba(255,255,255,.1)}
  .bin{position:absolute;left:531px;top:444px;width:219px;height:219px;will-change:transform,opacity}
  .bin .cup{position:absolute;left:0;right:0;top:12px;bottom:0;
    clip-path:polygon(5% 0,95% 0,83% 100%,17% 100%);
    background:linear-gradient(180deg,rgba(206,210,216,.9),rgba(228,232,238,.94) 34%,rgba(244,246,249,.98));
    border-radius:10px 10px 30px 30px}
  .bin .rim{position:absolute;left:0;right:0;top:0;height:36px;border-radius:16px/18px;
    background:linear-gradient(180deg,rgba(250,251,253,.98),rgba(198,203,212,.8));
    box-shadow:inset 0 -7px 12px rgba(255,255,255,.5)}
  .bin .hole{position:absolute;left:16px;right:16px;top:6px;height:22px;border-radius:14px/11px;
    background:linear-gradient(180deg,rgba(90,96,106,.9),rgba(150,156,166,.7))}
  .wad{position:absolute;width:46px;height:46px;will-change:transform,opacity}
  .frag{position:absolute;left:0;right:0;top:50%;text-align:center;white-space:nowrap;font-weight:600;
         letter-spacing:-.012em;line-height:1;color:#9b22f0;transform:translateY(-50%);
         text-shadow:0 0 34px rgba(150,40,255,.95),0 0 70px rgba(150,40,255,.5);will-change:transform,opacity}
  .cursor{position:absolute;width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.9);
          background:radial-gradient(circle at 34% 28%,rgba(255,255,255,.55),rgba(0,0,0,.5));will-change:transform,opacity}
  .glowdot{position:absolute;width:16px;height:16px;border-radius:50%;
           background:radial-gradient(circle,#ffe27a,#f0a020 55%,rgba(240,160,32,0) 72%);
           box-shadow:0 0 18px rgba(255,200,80,.9);will-change:transform,opacity}
  .appRow{position:absolute;left:0;right:0;text-align:center;white-space:nowrap;font-weight:600;
          letter-spacing:-.015em;line-height:1;will-change:transform,opacity}
  .appRow em{font-style:normal;display:inline-block;width:.92em;height:.92em;border-radius:.2em;
             vertical-align:-.16em;margin-right:.22em;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}
</style>
</head>
<body>
<p class="sr">A thirty-second keynote-style motion study on black. A chromatic wordmark assembles, a wall of creative app windows drifts past, then twenty short type beats follow \u2014 one subscription, endless creativity, a dock of apps, a three-track beat, editing a video, taking your design anywhere, and quick verbs from Prompt it to Share it \u2014 closing on a price, a scrolling list of app names, and the Creator Studio wordmark.</p>
<div id="stage">
  <div id="comp"></div>
  <svg width="0" height="0" style="position:absolute" aria-hidden="true">
    <filter id="goo">
      <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="b"/>
      <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" result="g"/>
      <feComposite in="SourceGraphic" in2="g" operator="atop"/>
    </filter>
  </svg>
</div>
<span id="ruler" aria-hidden="true"></span>
<script>
(function(){
  "use strict";
  var DUR=30.122, W=1280, H=720;
  var comp=document.getElementById('comp'), stage=document.getElementById('stage'), ruler=document.getElementById('ruler');

  /* ---------- math ---------- */
  var clamp=function(v,a,b){return v<a?a:(v>b?b:v)};
  var lerp=function(a,b,t){return a+(b-a)*t};
  var seg=function(t,a,b){return clamp((t-a)/(b-a||1e-6),0,1)};
  var smooth=function(t){return t*t*(3-2*t)};
  var eOut=function(t){return 1-Math.pow(1-t,3)};
  var eIn=function(t){return t*t*t};
  var back=function(t){var c=1.6;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)};
  function rng(s){var a=s>>>0;return function(){a+=0x6D2B79F5;var t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}

  /* ---------- dom ---------- */
  function el(tag,cls,parent,html){
    var n=document.createElement(tag);
    if(cls)n.className=cls;
    if(html!=null)n.innerHTML=html;
    (parent||comp).appendChild(n);
    return n;
  }
  function setT(n,v){if(n._t!==v){n._t=v;n.style.transform=v}}
  function setO(n,v){var r=clamp(v,0,1).toFixed(3);if(n._o!==r){n._o=r;n.style.opacity=r}}
  function setF(n,v){if(n._f!==v){n._f=v;n.style.filter=v}}
  function setC(n,v){if(n._c!==v){n._c=v;n.style.color=v}}
  var TXY='translateY(-50%) ';

  /* fit a string to a pixel width so every beat matches the reference measurements */
  function fitPx(str,target,weight){
    ruler.style.fontWeight=weight||600;
    ruler.style.fontSize='100px';
    ruler.textContent=str;
    return 100*target/ruler.getBoundingClientRect().width;
  }
  function advances(str,fs,weight){
    ruler.style.fontWeight=weight||600;
    ruler.style.fontSize=fs+'px';
    var out=[];
    for(var i=0;i<str.length;i++){
      ruler.textContent=str[i];
      out.push(ruler.getBoundingClientRect().width);
    }
    return out;
  }
  function letters(node,str){
    node.textContent='';
    var out=[];
    for(var i=0;i<str.length;i++){
      var s=document.createElement('span');
      s.textContent=str[i]===' '?'\\u00a0':str[i];
      node.appendChild(s); out.push(s);
    }
    return out;
  }
  /* one centred line, auto-sized to a reference width */
  function textLine(scene,str,targetW){
    var wrap=el('div','line',scene);
    var tx=el('div','tx',wrap);
    var fs=fitPx(str,targetW);
    tx.style.fontSize=fs.toFixed(2)+'px';
    return {wrap:wrap, tx:tx, chars:letters(tx,str), fs:fs};
  }

  var APPLE='<svg viewBox="0 0 24 24" aria-hidden="true">'+
    '<path fill="currentColor" d="M17.1 12.7c0-2.6 2.1-3.9 2.2-4-1.2-1.8-3.1-2-3.7-2.1-1.7-.1-3.3 1-4.1 1-.8 0-2.1-1-3.5-1-1.8 0-3.6 1.1-4.5 2.8-1.9 3.4-.5 8.4 1.4 11.2 1 1.3 2.1 2.8 3.6 2.7 1.4 0 1.9-.9 3.6-.9s2.1.9 3.6.9c1.5 0 2.4-1.3 3.3-2.7 1.1-1.5 1.5-3 1.5-3.1-.1 0-3.4-1.3-3.4-4.8z"/>'+
    '<path fill="currentColor" d="M14.6 4.9c.8-.9 1.3-2.2 1.1-3.5-1.1.1-2.5.8-3.3 1.7-.7.9-1.3 2.2-1.1 3.4 1.2.1 2.5-.6 3.3-1.6z"/></svg>';

  /* =====================================================================
     1 + 21 \xB7 wordmark, chromatic assemble
     ===================================================================== */
  function makeWordmark(){
    var s=el('div','scene');
    var wrap=el('div','line',s);
    var tx=el('div','tx',wrap);
    var fs=fitPx('Creator Studio',678);
    tx.style.fontSize=fs.toFixed(2)+'px';
    var mk=el('span','mark',tx,APPLE);
    var chars=[], str='Creator Studio';
    for(var i=0;i<str.length;i++){
      var sp=document.createElement('span');
      sp.textContent=str[i]===' '?'\\u00a0':str[i];
      tx.appendChild(sp); chars.push(sp);
    }
    var R=rng(7719), jit=chars.map(function(){return [R()*2-1,R()*2-1,R()]});
    return {node:s, update:function(t,p){
      setO(mk,smooth(seg(p,.26,.5)));
      setT(mk,'scale('+lerp(.55,1,eOut(seg(p,.26,.56))).toFixed(3)+')');
      for(var i=0;i<chars.length;i++){
        var j=jit[i];
        var a=eOut(clamp(seg(p,.02,.5)*1.5-j[2]*.5,0,1));
        setT(chars[i],'translate('+(j[0]*62*(1-a)).toFixed(1)+'px,'+(j[1]*34*(1-a)).toFixed(1)+'px) scale('+lerp(1.24,1,a).toFixed(3)+')');
        setO(chars[i],Math.min(1,a*1.6));
        var sep=(1-a)*11;
        chars[i].style.textShadow=sep>.4
          ? (-sep).toFixed(1)+'px 0 rgba(255,64,72,.85),'+sep.toFixed(1)+'px 0 rgba(64,255,190,.8),0 '+(sep*.55).toFixed(1)+'px rgba(96,124,255,.8)'
          : 'none';
        setF(chars[i],sep>.7?'blur('+(sep*.3).toFixed(2)+'px)':'none');
      }
    }};
  }

  /* =====================================================================
     2 \xB7 wall of creative app windows
     ===================================================================== */
  var WALLPAL=[
    ['#1c6b47','#93d46b'],['#8a1d3c','#f05a6d'],['#123c70','#4aa8f0'],
    ['#572a86','#c07af0'],['#7d4a12','#f0b45a'],['#0e4f54','#4fd6c8'],
    ['#6b1050','#f05ac0'],['#24406b','#7aa8f0'],['#3a5f10','#b0e05a'],
    ['#6b2a10','#f08a5a'],['#28286b','#8a8af0'],['#0d5a2c','#5ad68a']
  ];
  function makeWall(){
    var s=el('div','scene'), R=rng(4242), wins=[];
    for(var i=0;i<34;i++){
      var w=el('div','win',s);
      var pal=WALLPAL[Math.floor(R()*WALLPAL.length)];
      var variant=i%6;
      var bw=lerp(160,330,R()), bh=bw*lerp(.6,.68,R());
      w.style.width=bw.toFixed(0)+'px'; w.style.height=bh.toFixed(0)+'px';
      el('div','bar',w,'<i></i><i></i><i></i>');
      var body=el('div','body',w);
      body.style.background='#0d0d12';
      var pane=el('div','pane',body);
      pane.style.background='linear-gradient(150deg,'+pal[0]+','+pal[1]+')';
      pane.style.opacity='.82';
      var k;
      if(variant===0){
        el('div','side',body,'<u></u><u></u><u></u><u></u><u></u>');
        var st=el('div','strip',body); st.style.height='26%';
        for(k=0;k<5;k++){var u=el('u','',st);u.style.left=(6+k*18)+'%';u.style.width='15%';u.style.height='11px';u.style.background=k%2?pal[1]:'#3f4a6a'}
      } else if(variant===1){
        pane.style.display='none';
        var st2=el('div','strip',body); st2.style.height='56%';
        for(k=0;k<7;k++){var u2=el('u','',st2);u2.style.left=(3+k*13.6)+'%';u2.style.width='12%';
          u2.style.height=(10+(k%3)*8)+'px';u2.style.bottom=(7+(k%3)*15)+'px';u2.style.background=k%2?pal[1]:pal[0]}
        var th=el('div','',body);
        th.style.cssText='position:absolute;left:6%;top:6%;width:54%;height:34%;border-radius:5px;background:linear-gradient(140deg,'+pal[0]+','+pal[1]+')';
      } else if(variant===2){
        pane.style.display='none';
        body.style.background='#e9e9ee';
        var bars=el('div','bars',body);
        for(k=0;k<6;k++){var b=el('u','',bars);b.style.height=(24+((k*37)%70))+'%';b.style.background=k%2?pal[1]:pal[0]}
        var tx2=el('div','txt',body);
        for(k=0;k<3;k++){var l3=el('u','',tx2);l3.style.background='#cbcbd2';l3.style.width=(80-k*18)+'%'}
      } else if(variant===3){
        pane.style.display='none';
        var ti=el('div','tiles',body);
        for(k=0;k<12;k++){var t4=el('u','',ti);t4.style.background='linear-gradient('+(k*30)+'deg,'+pal[0]+','+pal[1]+')'}
      } else if(variant===4){
        pane.style.display='none';
        for(k=0;k<3;k++){
          var tr=el('div','',body);
          tr.style.cssText='position:absolute;left:6%;right:6%;top:'+(11+k*29)+'%;height:21%;border-radius:4px;background:'+
            (k===0?pal[1]:k===1?pal[0]:'#7a3ad6')+';opacity:.92';
        }
      } else {
        var sh=el('div','',body);
        sh.style.cssText='position:absolute;left:20%;top:16%;width:60%;height:76%;border-radius:42% 42% 28% 28%;background:rgba(0,0,0,.4);filter:blur(7px)';
      }
      wins.push({n:w,rot:(R()*2-1)*2.6,ph:R()*6.283,w:bw,h:bh,d:R()});
      void i;
    }
    return {node:s, update:function(t,p){
      var phase=t<.5?0:(t<1.06?1:2);
      var pp=phase===0?seg(t,0,.5):phase===1?seg(t,.5,1.06):seg(t,1.06,1.92);
      var zoom=lerp(.9,1.16,pp)*(1+phase*.08);
      for(var i=0;i<wins.length;i++){
        var o=wins[i], k=(i+phase*11)%wins.length;
        var gx=((k*137)%13)/12, gy=((k*71)%9)/8;
        var depth=.62+((k*53)%100)/100*.6;
        var x=lerp(-120,1400,gx)+Math.sin(t*.7+o.ph)*18;
        var y=lerp(-80,800,gy)+Math.cos(t*.55+o.ph)*15;
        var sc=depth*zoom;
        var cx=(x-W/2)*lerp(1,1.16,pp)+W/2, cy=(y-H/2)*lerp(1,1.16,pp)+H/2;
        o.n.style.left=(cx-o.w/2).toFixed(1)+'px';
        o.n.style.top=(cy-o.h/2).toFixed(1)+'px';
        setT(o.n,'scale('+sc.toFixed(3)+') rotate('+o.rot.toFixed(2)+'deg)');
        setO(o.n,Math.min(1,smooth(seg(t,0,.24))*1.2)*(1-seg(t,1.8,1.92))*clamp(.5+depth*.5,.4,1));
      }
    }};
  }

  /* =====================================================================
     3 \xB7 one subscription / endless creativity
     ===================================================================== */
  function makeLines(){
    var s=el('div','scene');
    function build(str,target){
      var wrap=el('div','line',s), tx=el('div','tx',wrap);
      tx.style.fontSize=fitPx(str,target).toFixed(2)+'px';
      var out=[];
      str.split(' ').forEach(function(word,i){
        var sp=document.createElement('span');
        sp.textContent=(i?'\\u00a0':'')+word;
        tx.appendChild(sp); out.push(sp);
      });
      return {tx:tx,words:out};
    }
    var A=build('One subscription.',705), B=build('Endless creativity.',702);
    function play(o,p,a0,out0){
      var vis=1-smooth(seg(p,out0,out0+.07));
      setO(o.tx,vis);
      for(var i=0;i<o.words.length;i++){
        var q=eOut(clamp(seg(p,a0+i*.135,a0+.2+i*.135),0,1));
        setO(o.words[i],q*vis);
        setT(o.words[i],'translateY('+((1-q)*24).toFixed(1)+'px)');
        setF(o.words[i],q<.97?'blur('+((1-q)*6).toFixed(2)+'px)':'none');
      }
    }
    return {node:s, update:function(t,p){ play(A,p,.02,.44); play(B,p,.5,.94) }};
  }

  /* =====================================================================
     4 \xB7 dock
     ===================================================================== */
  var ICONS=[
    '<svg viewBox="0 0 32 32"><rect x="7" y="16" width="4.4" height="10" rx="1" fill="#7fd44a"/><rect x="13.8" y="9" width="4.4" height="17" rx="1" fill="#a6e86a"/><rect x="20.6" y="13" width="4.4" height="13" rx="1" fill="#5fbe32"/><rect x="6" y="27" width="20" height="1.8" fill="#c9f2a0"/></svg>',
    '<svg viewBox="0 0 32 32"><path d="M6 20h20l-4-9H10z" fill="#6fb6f0"/><rect x="15" y="20" width="2" height="7" fill="#8fd0f7"/><rect x="10" y="26" width="12" height="2" rx="1" fill="#4a90d0"/></svg>',
    '<svg viewBox="0 0 32 32"><path d="M8 25c0-10 3-14 6-14s3 7 5 7 3-4 5-4" stroke="#f05ad0" stroke-width="3.2" fill="none" stroke-linecap="round"/><circle cx="23.4" cy="14.6" r="2.6" fill="#f7a0e4"/></svg>',
    '<svg viewBox="0 0 32 32"><rect x="5" y="12" width="22" height="13" rx="3" fill="#a15ff0"/><path d="M5 12l6-4 16 2-4 3z" fill="#c79af7"/></svg>',
    '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12.5" fill="#dce1e9"/><circle cx="16" cy="16" r="7" fill="#9aa3b0"/><circle cx="16" cy="16" r="2" fill="#33373f"/></svg>',
    '<svg viewBox="0 0 32 32"><path d="M16 8l9.5 5-9.5 5-9.5-5z" fill="#e0324a"/><path d="M16 18l9.5 5-9.5 5-9.5-5z" fill="#a81d2c" opacity=".9"/></svg>',
    '<svg viewBox="0 0 32 32"><path d="M8 25l16-17 2.4 3.4-14.4 15z" fill="#f0863a"/><path d="M8 25.6h18.4" stroke="#f0b45a" stroke-width="2.2"/></svg>',
    '<svg viewBox="0 0 32 32"><path d="M16 6v20" stroke="#4fd6b8" stroke-width="2"/><circle cx="16" cy="9.5" r="3.2" fill="#4fd6b8"/><circle cx="21.5" cy="18" r="3.2" fill="#4fd6b8"/><circle cx="10.5" cy="22.5" r="3.2" fill="#4fd6b8"/></svg>',
    '<svg viewBox="0 0 32 32"><path d="M8 9h16l-8 7 8 7H8l8-7z" fill="none" stroke="#f0d05a" stroke-width="2.6"/></svg>',
    '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="11.5" fill="#2f7fb8"/><path d="M7.5 17c2-4.4 3 4.4 5 0s3 4.4 5 0 3 3.4 5-1" stroke="#c8eafa" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>'
  ];
  function makeDock(){
    var s=el('div','scene');
    var bar=el('div','',s); bar.id='dockBar';
    var icos=[];
    for(var i=0;i<ICONS.length;i++){
      var n=el('div','ico',s,ICONS[i]);
      n.style.left=(148+i*101)+'px'; n.style.top='326px';
      icos.push(n);
    }
    return {node:s, update:function(t,p){
      var q0=eOut(seg(p,0,.24));
      setO(bar,q0);
      setT(bar,'scaleX('+lerp(.7,1,q0).toFixed(3)+')');
      for(var i=0;i<icos.length;i++){
        var q=clamp(seg(p,.08+i*.03,.36+i*.03),0,1);
        var lift=(i===4)?eOut(seg(p,.5,.76)):0;
        setO(icos[i],Math.min(1,q*1.7));
        setT(icos[i],'translateY('+((1-back(q))*30-lift*52).toFixed(1)+'px) scale('+(lerp(.6,1,back(q))*(1+lift*.58)).toFixed(3)+')');
        icos[i].style.boxShadow=lift>.02
          ? '0 0 '+(46*lift).toFixed(0)+'px rgba(216,234,255,'+(.85*lift).toFixed(2)+'),inset 0 1px 0 rgba(255,255,255,.2)'
          : 'inset 0 1px 0 rgba(255,255,255,.14)';
        icos[i].style.zIndex=i===4?5:1;
      }
    }};
  }

  /* =====================================================================
     5 \xB7 make a beat
     ===================================================================== */
  function makeBeatText(){
    var s=el('div','scene');
    var L=textLine(s,'Make a beat.',469);
    var R=rng(551), jit=L.chars.map(function(){return [R()*2-1,R()*2-1]});
    return {node:s, update:function(t,p){
      setO(L.tx,smooth(seg(p,.02,.14))*(1-smooth(seg(p,.88,1))));
      for(var i=0;i<L.chars.length;i++){
        var q=eOut(clamp(seg(p,.04+i*.028,.34+i*.028),0,1));
        setT(L.chars[i],'translate('+(jit[i][0]*34*(1-q)).toFixed(1)+'px,'+
          (jit[i][1]*18*(1-q)+Math.sin(t*5.4+i)*(1-q)*5).toFixed(1)+'px)');
        setO(L.chars[i],Math.min(1,q*1.5));
      }
    }};
  }

  /* =====================================================================
     6 \xB7 three-track beat
     ===================================================================== */
  function makeTracks(){
    var s=el('div','scene'), R=rng(9051);
    var specs=[
      {name:'DRUMS_137BPM', top:112,h:138,g:'linear-gradient(180deg,#84e44e,#5cc832)',glow:'#7fe04a',kind:'roll'},
      {name:'BASS_137BPM',  top:259,h:132,g:'linear-gradient(180deg,#a850f0,#8b2ce0)',glow:'#a24ef0',kind:'ticks'},
      {name:'HARMONY_137BPM',top:400,h:140,g:'linear-gradient(180deg,#d431c2,#6f0d58)',glow:'#d02fc0',kind:'wave'}
    ];
    var tr=specs.map(function(sp){
      var n=el('div','track',s);
      n.style.top=sp.top+'px'; n.style.height=sp.h+'px'; n.style.background=sp.g;
      n.style.boxShadow='0 0 30px '+sp.glow+'70,0 0 5px '+sp.glow+'bb';
      el('b','',n).textContent=sp.name;
      var art=el('div','art',n), i, j;
      if(sp.kind==='roll'){
        for(i=0;i<52;i++){
          var u=el('u','',art);
          u.style.left=(8+i*11.4)+'px'; u.style.width='6px';
          u.style.height=(R()<.3?15:9)+'px'; u.style.top=(34+R()*58)+'px';
        }
      } else if(sp.kind==='ticks'){
        for(i=0;i<28;i++){
          var y=24+R()*54;
          var g=el('u','',art); g.style.left=(16+i*20.4)+'px'; g.style.width='15px'; g.style.height='2px'; g.style.top=y+'px';
          var v=el('u','',art); v.style.left=(16+i*20.4)+'px'; v.style.width='2px'; v.style.height='11px'; v.style.top=(y-4)+'px';
        }
      } else {
        for(i=0;i<2;i++){
          for(j=0;j<126;j++){
            var amp=(Math.sin(j*.2)*.4+Math.sin(j*.06)*.4+.62)*16;
            var wv=el('u','',art);
            wv.style.left=(7+j*4.7)+'px'; wv.style.width='2px';
            wv.style.height=Math.max(2,amp*(.5+R()*.7)).toFixed(1)+'px';
            wv.style.top=(16+i*40+(20-amp/2)).toFixed(1)+'px';
            wv.style.background='rgba(255,255,255,.6)';
          }
        }
      }
      return n;
    });
    var head=el('div','',s);
    head.style.cssText='position:absolute;top:75px;width:6px;height:30px;background:#fff;border-radius:1px';
    return {node:s, update:function(t,p){
      for(var i=0;i<tr.length;i++){
        var q=eOut(clamp(seg(p,.06+i*.2,.32+i*.2),0,1));
        setO(tr[i],q);
        setT(tr[i],'translateY('+((1-q)*30).toFixed(1)+'px) scaleY('+lerp(.68,1,q).toFixed(3)+')');
      }
      setO(head,smooth(seg(p,.02,.12)));
      head.style.left=(516+Math.sin(t*2.4)*7).toFixed(1)+'px';
    }};
  }

  /* =====================================================================
     7 \xB7 edit a video
     ===================================================================== */
  function makeEditVideo(){
    var s=el('div','scene');
    var fs=fitPx('Edit a',237);
    // staggered intro pair
    var pre=el('div','line',s);
    var p1=el('div','tx',pre), p2=el('div','tx',pre);
    p1.style.fontSize=p2.style.fontSize=fs.toFixed(2)+'px';
    p1.textContent='Edit a'; p2.textContent='video.';
    p1.style.color='#c98ff5'; p1.style.textShadow='0 0 30px rgba(160,80,255,.8)';
    p2.style.color='#6e6e75';
    // resolved single line with the clip in the middle
    var main=el('div','line',s);
    var mt=el('div','tx',main); mt.style.fontSize=fs.toFixed(2)+'px';
    var a=el('span','',mt); a.textContent='Edit\\u00a0a\\u00a0';
    var gap=el('span','',mt); gap.style.display='inline-block';
    var b=el('span','',mt); b.textContent='\\u00a0video.';
    var clip=el('div','',s); clip.id='clip';
    var th=el('div','thumbs',clip);
    for(var i=0;i<3;i++)el('u','',th);
    var wv=el('div','wave',clip);
    for(i=0;i<64;i++){
      var u=el('u','',wv);
      u.style.height=(22+Math.abs(Math.sin(i*.7))*58+((i*37)%20))+'%';
    }
    return {node:s, update:function(t,p){
      var swap=seg(p,.58,.7);
      // intro pair
      var pv=1-smooth(swap);
      setO(pre,pv);
      var q1=eOut(seg(p,.02,.24)), q2=eOut(seg(p,.14,.42));
      setT(p1,TXY+'translate('+lerp(-40,-118,q1).toFixed(0)+'px,'+lerp(-30,-46,q1).toFixed(0)+'px)');
      setO(p1,q1);
      setT(p2,TXY+'translate('+lerp(160,118,q2).toFixed(0)+'px,'+lerp(58,42,q2).toFixed(0)+'px)');
      setO(p2,q2);
      // resolved line + clip
      var mv=smooth(swap);
      setO(main,mv);
      var open=eOut(seg(p,.66,.84));
      var gw=lerp(0,575,open);
      gap.style.width=gw.toFixed(0)+'px';
      clip.style.width=Math.max(2,gw-6).toFixed(0)+'px';
      clip.style.height='200px';
      clip.style.left=(W/2-gw/2+3).toFixed(0)+'px';
      clip.style.top='262px';
      setO(clip,mv*Math.min(1,open*2.4)*(1-seg(p,.93,1)));
      setT(clip,'scaleY('+lerp(.5,1,eOut(seg(p,.64,.82))).toFixed(3)+')');
    }};
  }

  /* =====================================================================
     8 \xB7 macbook, text boxes
     ===================================================================== */
  function macFrame(parent){
    var m=el('div','mac',parent);
    var lid=el('div','lid',m);
    var scr=el('div','scr',lid);
    el('div','notch',lid);
    var inn=el('div','scrIn',scr);
    el('div','base',m);
    return {root:m, screen:inn};
  }
  function makeMac(){
    var s=el('div','scene');
    var mac=macFrame(s);
    var clip=el('div','',mac.screen);
    clip.style.cssText='position:absolute;inset:0;background:linear-gradient(150deg,#2f2118,#c08a5a)';
    var subj=el('div','',clip);
    subj.style.cssText='position:absolute;left:24%;top:26%;width:52%;height:62%;border-radius:44% 44% 28% 28%;background:rgba(18,10,6,.55);filter:blur(4px)';
    var pal=el('div','palette',mac.screen);
    for(var i=0;i<11;i++)el('u','',pal);
    var guide=el('div','guide',mac.screen);
    var b1=el('div','tbox',mac.screen,'<i></i><i></i><i></i><i></i><span>Take</span>');
    var b2=el('div','tbox',mac.screen,'<i></i><i></i><i></i><i></i><span>your</span>');
    b1.querySelector('span').style.fontSize='132px';
    b2.querySelector('span').style.fontSize='86px';
    return {node:s, update:function(t,p){
      setO(mac.root,smooth(seg(p,0,.09)));
      setT(mac.root,'scale('+lerp(.95,1,eOut(seg(p,0,.3))).toFixed(3)+')');
      setO(clip,1-seg(p,.18,.32));
      setO(pal,smooth(seg(p,.22,.4)));
      guide.style.top='64%';
      setO(guide,smooth(seg(p,.34,.48))*(1-seg(p,.92,1)));
      var i1=seg(p,.28,.44);
      b1.style.left='16%'; b1.style.top='30%'; b1.style.width='52%'; b1.style.height='34%';
      setO(b1,smooth(i1));
      setT(b1,'scale('+lerp(.9,1,eOut(i1)).toFixed(3)+')');
      var i2=seg(p,.64,.8);
      b2.style.left='54%'; b2.style.top='36%'; b2.style.width='30%'; b2.style.height='24%';
      setO(b2,smooth(i2));
      setT(b2,'translateX('+((1-eOut(i2))*26).toFixed(1)+'px)');
    }};
  }

  /* =====================================================================
     9 \xB7 take your design anywhere
     ===================================================================== */
  var GRADS=[
    {bg:'#3c0a1a', blobs:['#8e1436','#cc1f4c','#f2567c']},
    {bg:'#2a0742', blobs:['#6d1baa','#a92ee2','#da6af2']},
    {bg:'#0f3a10', blobs:['#3f7a18','#82c62c','#dcf24c']}
  ];
  function gradientCanvas(parent){
    var g=el('div','grad',parent), blobs=[];
    for(var i=0;i<3;i++)blobs.push(el('b','',g));
    return {set:function(idx,t){
      var sp=GRADS[idx];
      g.style.background=sp.bg;
      for(var i=0;i<blobs.length;i++){
        var b=blobs[i], sz=lerp(152,112,i/2);
        b.style.width=sz+'%'; b.style.height=(sz*1.35)+'%';
        b.style.left=lerp(-26,6,i/2)+'%';
        b.style.top=(lerp(-8,26,i/2)+Math.sin(t*.7+i)*2)+'%';
        b.style.background='radial-gradient(circle at 42% 36%,'+sp.blobs[i]+',rgba(0,0,0,0) 70%)';
        b.style.opacity=(.96-i*.08).toFixed(2);
      }
    }};
  }
  function makeCanvasScene(){
    var s=el('div','scene');
    var mac=macFrame(s);
    var pad=el('div','pad',s);
    var padIn=el('div','scrIn',el('div','scr',pad));
    var gMac=gradientCanvas(mac.screen), gPad=gradientCanvas(padIn);
    function typeBlock(parent,unit){
      var w=el('div','canvasType',parent);
      var rows=[
        {txt:'Take',     x:'5%',  y:'3%',  s:1.0},
        {txt:'your',     x:'43%', y:'25%', s:1.0},
        {txt:'design',   x:'4%',  y:'47%', s:1.0},
        {txt:'anywhere.',x:'2%',  y:'69%', s:1.0}
      ];
      return {root:w, rows:rows.map(function(r){
        var d=el('div','',w);
        d.textContent=r.txt;
        d.style.left=r.x; d.style.top=r.y;
        d.style.fontSize=(unit*r.s)+'px';
        d.style.color='rgba(255,255,255,.94)';
        return d;
      })};
    }
    var tMac=typeBlock(mac.screen,114), tPad=typeBlock(padIn,110);
    var pencil=el('div','',s);
    pencil.style.cssText='position:absolute;height:8px;border-radius:4px;background:linear-gradient(90deg,#8f939b,#d6dae0);will-change:transform,opacity';
    var hand=el('div','hand',s);
    hand.innerHTML='<svg viewBox="0 0 260 340" aria-hidden="true"><path fill="#b07f5e" d="M124 340V206c0-17-11-30-11-45 0-10 8-14 15-9 8 6 13 19 15 32l4 24 7-95c1-13 6-19 14-18 9 1 12 9 12 20l1 79 9-69c2-12 9-17 16-15 8 2 11 10 10 21l-9 71 15-47c4-12 12-15 19-12 7 4 9 12 5 23l-19 67c-7 24-11 42-11 59v54z"/></svg>';
    return {node:s, update:function(t,p){
      var onPad=p>.42;
      mac.root.style.display=onPad?'none':'block';
      pad.style.display=onPad?'block':'none';
      var idx=p<.18?0:(p<.38?1:2);
      var g=onPad?gPad:gMac, tb=onPad?tPad:tMac;
      g.set(idx,t);
      var host=onPad?pad:mac.root;
      setO(host,smooth(seg(p,0,.08)));
      var grow=eOut(seg(p,.42,1));
      setT(host,onPad
        ? 'scale('+lerp(1,1.44,grow).toFixed(3)+') translate('+lerp(0,-16,grow).toFixed(0)+'px,'+lerp(0,26,grow).toFixed(0)+'px)'
        : 'scale('+lerp(.96,1,eOut(seg(p,0,.3))).toFixed(3)+')');
      setF(host,onPad&&grow>.5?'blur('+((grow-.5)*5.2).toFixed(2)+'px)':'none');
      for(var i=0;i<tb.rows.length;i++){
        var q=eOut(clamp(seg(p,.01+i*.045,.11+i*.045),0,1));
        setO(tb.rows[i],q);
        setT(tb.rows[i],'translateY('+((1-q)*20).toFixed(1)+'px)');
      }
      var pen=smooth(seg(p,.56,.72));
      pencil.style.left='430px'; pencil.style.top='104px'; pencil.style.width='420px';
      setO(pencil,pen*(1-seg(p,.94,1)));
      var hi=seg(p,.72,.98);
      hand.style.left='700px'; hand.style.top='300px';
      setO(hand,Math.min(1,hi*2.4));
      setT(hand,'translate('+lerp(230,26,eOut(hi)).toFixed(0)+'px,'+lerp(120,30,eOut(hi)).toFixed(0)+'px) rotate('+lerp(20,6,eOut(hi)).toFixed(1)+'deg)');
    }};
  }

  /* =====================================================================
     10 \xB7 prompt it \u2014 clean, daisies, liquid
     ===================================================================== */
  function makePrompt(){
    var s=el('div','scene');
    var L=textLine(s,'Prompt it.',600);
    var cv=document.createElement('canvas');
    cv.id='daisyC'; cv.width=W; cv.height=H; s.appendChild(cv);
    var g2=cv.getContext('2d');
    var liquid=el('div','',s); liquid.id='liquid';
    var lt=el('div','tx',liquid);
    lt.style.fontSize=L.fs.toFixed(2)+'px'; lt.style.fontWeight='700'; lt.style.color='#8ecfee';
    lt.textContent='Prompt it.';
    var gl=el('div','gloss',s); gl.style.fontSize=L.fs.toFixed(2)+'px'; gl.textContent='Prompt it.';
    var R=rng(3131), drops=[];
    for(var i=0;i<28;i++){
      var d=el('div','drop',liquid);
      var sz=lerp(8,26,R());
      d.style.width=sz+'px'; d.style.height=sz+'px';
      drops.push({n:d,x:lerp(340,940,R()),y:lerp(240,470,R()),sz:sz,ph:R()*6.283,sp:.4+R()*.9});
    }
    var pts=null;
    function samplePts(){
      var m=document.createElement('canvas'), mc=m.getContext('2d');
      m.width=W; m.height=200;
      mc.font='700 '+L.fs.toFixed(0)+'px -apple-system,"SF Pro Display",Helvetica,Arial,sans-serif';
      mc.textAlign='center'; mc.textBaseline='middle';
      mc.fillText('Prompt it.',W/2,100);
      var data=mc.getImageData(0,0,W,200).data, out=[];
      for(var y=0;y<200;y+=13){
        for(var x=0;x<W;x+=13){
          if(data[(y*W+x)*4+3]>110) out.push([x,y]);
        }
      }
      return out;
    }
    function daisy(x,y,r,rot,a){
      g2.save(); g2.translate(x,y); g2.rotate(rot); g2.globalAlpha=a;
      g2.fillStyle='#f4f3ef';
      for(var i=0;i<9;i++){
        g2.save(); g2.rotate(i/9*6.2832);
        g2.beginPath(); g2.ellipse(0,-r*.6,r*.25,r*.6,0,0,6.2832); g2.fill();
        g2.restore();
      }
      g2.fillStyle='#e6b229';
      g2.beginPath(); g2.arc(0,0,r*.3,0,6.2832); g2.fill();
      g2.restore();
    }
    return {node:s, update:function(t,p){
      var cq=smooth(seg(p,.01,.07))*(1-smooth(seg(p,.13,.19)));
      var gq=smooth(seg(p,.68,.76))*(1-smooth(seg(p,.92,1)));
      setO(L.tx,Math.max(cq,gq*.6));
      setT(L.tx,TXY+'scale('+lerp(1.04,1,eOut(seg(p,.02,.24))).toFixed(3)+')');
      if(gq>.01){ setC(L.tx,'rgba(198,126,112,1)'); setF(L.tx,'blur('+(3+gq*5).toFixed(1)+'px)') }
      else { setC(L.tx,'#f5f5f7'); setF(L.tx,'none') }

      var dq=smooth(seg(p,.15,.23))*(1-smooth(seg(p,.40,.46)));
      cv.style.opacity=dq.toFixed(3);
      if(dq>.004){
        if(!pts) pts=samplePts();
        g2.clearRect(0,0,W,H);
        var grow=eOut(seg(p,.15,.38));
        for(var i=0;i<pts.length;i++){
          var q=clamp(grow*1.4-((i*37)%100)/100*.4,0,1);
          if(q<=.02) continue;
          daisy(pts[i][0],pts[i][1]+260,lerp(4,15,q)+Math.sin(t*2+i)*.8,(i*1.7)%6.283,q);
        }
      }
      var lq=smooth(seg(p,.4,.48))*(1-smooth(seg(p,.6,.68)));
      setO(liquid,lq); setO(gl,lq*.9);
      var wob=Math.sin(t*2.2)*2.4;
      setT(lt,TXY+'translateY('+wob.toFixed(2)+'px)');
      setT(gl,TXY+'translateY('+wob.toFixed(2)+'px)');
      var burst=eOut(seg(p,.46,.74));
      for(i=0;i<drops.length;i++){
        var d=drops[i];
        d.n.style.left=(d.x+Math.cos(d.ph)*burst*lerp(30,170,d.sp*.7)-d.sz/2).toFixed(1)+'px';
        d.n.style.top=(d.y+Math.sin(d.ph)*burst*lerp(20,120,d.sp*.7)+Math.sin(t*1.6+d.ph)*3-d.sz/2).toFixed(1)+'px';
      }
    }};
  }

  /* =====================================================================
     11 \xB7 perform it
     ===================================================================== */
  function makePerform(){
    var s=el('div','scene');
    var keys=el('div','keys',s);
    for(var i=0;i<4;i++)el('u','',keys);
    var L=textLine(s,'Perform it.',575);
    var TINT=['#ffffff','#ffffff','#d8f0ff','#bfe6fb','#cfe8fb','#c46ff5','#a83af0','#ffffff','#f7d79a','#f2c37a','#f0bb6a'];
    var hands=el('div','',s);
    hands.innerHTML='<svg viewBox="0 0 1280 340" aria-hidden="true">'+
      '<g fill="#6f4a32">'+
      '<path d="M196 340V186c0-22 15-38 34-38 18 0 30 16 30 38v78l52-12c22-5 38 6 38 24 0 40-44 64-92 64z"/>'+
      '<path d="M262 340v-96c0-14 9-24 20-24s20 10 20 24v96z" fill="#7d5237"/>'+
      '<path d="M604 340V162c0-24 17-42 37-42 20 0 33 18 33 42v88l58-14c24-5 41 7 41 27 0 44-48 70-100 70z"/>'+
      '<path d="M676 340v-104c0-15 10-26 22-26s22 11 22 26v104z" fill="#7d5237"/>'+
      '</g></svg>';
    hands.style.cssText='position:absolute;left:0;right:0;bottom:0;height:340px;will-change:opacity,transform';
    return {node:s, update:function(t,p){
      var env=smooth(seg(p,.02,.16))*(1-smooth(seg(p,.84,1)));
      setO(L.tx,env);
      L.tx.style.textShadow='0 0 34px rgba(255,255,255,.45)';
      for(var i=0;i<L.chars.length;i++){
        setC(L.chars[i],TINT[i]||'#ffffff');
        setO(L.chars[i],1);
        setT(L.chars[i],'translateY('+(Math.sin(t*9+i*.7)*1.4).toFixed(2)+'px)');
      }
      setO(keys,env*smooth(seg(p,.06,.28)));
      setO(hands,env*smooth(seg(p,.1,.4)));
      setT(hands,'translateY('+((1-eOut(seg(p,.1,.5)))*60).toFixed(0)+'px)');
    }};
  }

  /* =====================================================================
     12 \xB7 loop it
     ===================================================================== */
  function makeLoop(){
    var s=el('div','scene');
    var L=textLine(s,'Loop it.',375);
    return {node:s, update:function(t,p){
      setO(L.tx,smooth(seg(p,.02,.14))*(1-smooth(seg(p,.9,1))));
      for(var i=0;i<L.chars.length;i++){
        var q=eOut(clamp(seg(p,.03+i*.03,.3+i*.03),0,1));
        var spin=(i===1||i===2)?Math.sin(t*4.6+i*.7)*140*(1-seg(p,.1,.34)):0;
        setT(L.chars[i],'translateY('+((1-q)*20).toFixed(1)+'px) rotateY('+spin.toFixed(0)+'deg)');
        setO(L.chars[i],q);
      }
    }};
  }

  /* =====================================================================
     13 \xB7 select it
     ===================================================================== */
  function makeSelect(){
    var s=el('div','scene');
    var L=textLine(s,'Select it.',499);
    L.chars.forEach(function(c){setC(c,'#48484d')});
    var lime=el('div','line',s);
    var lt=el('div','tx',lime);
    lt.style.fontSize=L.fs.toFixed(2)+'px'; lt.style.color='#a6f024';
    lt.style.textShadow='0 0 34px rgba(160,240,40,.6)';
    lt.innerHTML='<span>S</span><span style="opacity:0">elect it.</span>';
    var first=lt.firstChild;
    var cur=el('div','cursor',s);
    return {node:s, update:function(t,p){
      var env=smooth(seg(p,.02,.14))*(1-smooth(seg(p,.88,1)));
      setO(L.tx,env); setO(lt,env);
      var trace=eOut(seg(p,.08,.44));
      first.style.clipPath='inset('+((1-trace)*100).toFixed(1)+'% 0 0 0)';
      cur.style.left=(400+Math.sin(trace*3.4)*22).toFixed(1)+'px';
      cur.style.top=lerp(300,382,trace).toFixed(1)+'px';
      setO(cur,env*smooth(seg(p,.04,.14))*(1-seg(p,.5,.66)));
    }};
  }

  /* =====================================================================
     14 \xB7 write it \u2014 letters riding an s-curve
     ===================================================================== */
  function makeWrite(){
    var s=el('div','scene');
    var str='Write it.', fs=fitPx(str,620);
    var adv=advances(str,fs), total=adv.reduce(function(a,b){return a+b},0);
    var wrap=el('div','line',s);
    var svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 1280 720');
    svg.setAttribute('width','1280'); svg.setAttribute('height','720');
    svg.style.cssText='position:absolute;left:0;top:0;overflow:visible';
    var path=document.createElementNS('http://www.w3.org/2000/svg','path');
    /* steep, flat, steep \u2014 the reference baseline is a stepped S */
    function P(u){
      var y=468+(378-468)*smooth(seg(u,0,.32))+(276-378)*smooth(seg(u,.6,1));
      return [336+700*u, y];
    }
    /* arc-length table so letters space evenly along the curve, not along x */
    var N=240, LUT=[0], prev=P(0), arc=0;
    for(var i=1;i<=N;i++){
      var pt=P(i/N);
      arc+=Math.hypot(pt[0]-prev[0],pt[1]-prev[1]);
      LUT.push(arc); prev=pt;
    }
    function uAt(dist){
      var d=clamp(dist,0,arc), lo=0, hi=N;
      while(hi-lo>1){var mid=(lo+hi)>>1; if(LUT[mid]<d)lo=mid; else hi=mid}
      var span=LUT[hi]-LUT[lo]||1;
      return (lo+(d-LUT[lo])/span)/N;
    }
    var dstr='M';
    for(i=0;i<=60;i++){ var q=P(i/60); dstr+=(i?' L':'')+q[0].toFixed(1)+' '+q[1].toFixed(1) }
    path.setAttribute('d',dstr);
    path.setAttribute('fill','none');
    path.setAttribute('stroke','#e0872a');
    path.setAttribute('stroke-width','2.4');
    path.setAttribute('stroke-linecap','round');
    svg.appendChild(path); wrap.appendChild(svg);
    var len=0;
    var glyphs=[];
    for(i=0;i<str.length;i++){
      var g=document.createElement('span');
      g.textContent=str[i]===' '?'\\u00a0':str[i];
      g.style.cssText='position:absolute;font-weight:600;letter-spacing:-.012em;line-height:1;white-space:pre;'+
        'font-size:'+fs.toFixed(2)+'px;transform-origin:0% 100%;will-change:transform,opacity';
      wrap.appendChild(g);
      glyphs.push({n:g, run:len});
      len+=adv[i];
    }
    var pad=(arc-total)/2;
    var dot=el('div','glowdot',s);
    return {node:s, update:function(t,p){
      var env=1-smooth(seg(p,.86,1));
      var draw=eOut(seg(p,.04,.72));
      var pl=path.getTotalLength?path.getTotalLength():1400;
      path.style.strokeDasharray=pl.toFixed(0);
      path.style.strokeDashoffset=(pl*(1-draw)).toFixed(0);
      path.style.opacity=(env*.95).toFixed(2);
      for(var i=0;i<glyphs.length;i++){
        var g=glyphs[i];
        var u=uAt(pad+g.run);
        var a=P(u), b=P(Math.min(1,u+.012));
        var ang=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI;
        var q=clamp(seg(p,.06+i*.055,.2+i*.055),0,1);
        g.n.style.left=a[0].toFixed(1)+'px';
        g.n.style.top=a[1].toFixed(1)+'px';
        setT(g.n,'rotate('+ang.toFixed(2)+'deg) translate(0,-'+(fs*.78).toFixed(1)+'px) scale('+lerp(.86,1,eOut(q)).toFixed(3)+')');
        setO(g.n,q*env);
      }
      var hp=P(clamp(draw,0,1));
      dot.style.left=(hp[0]-8).toFixed(1)+'px';
      dot.style.top=(hp[1]-8).toFixed(1)+'px';
      setO(dot,env*smooth(seg(p,.04,.14))*(1-seg(p,.78,.9)));
    }};
  }

  /* =====================================================================
     15 \xB7 scrap it
     ===================================================================== */
  function makeScrap(){
    var s=el('div','scene');
    var L=textLine(s,'Scrap it.',469);
    var bin=el('div','bin',s);
    el('div','cup',bin); el('div','rim',bin); el('div','hole',bin);
    var bits=el('div','',bin);
    bits.style.cssText='position:absolute;left:22px;right:22px;top:2px;height:18px;overflow:hidden';
    ['#e8e9ec','#f0d24a','#4fb8e0','#e05a8a'].forEach(function(c,i){
      var q=el('div','',bits);
      q.style.cssText='position:absolute;left:'+(i*26+4)+'px;top:'+(3+(i%2)*4)+'px;width:22px;height:14px;'+
        'border-radius:4px;background:'+c+';opacity:.9';
    });
    var wad=el('div','wad',s);
    wad.innerHTML='<svg viewBox="0 0 46 46" aria-hidden="true"><path fill="#eceef2" d="M7 16l10-11 15 4 7 11-5 14-15 7-11-7z"/>'+
      '<path fill="#c8ccd4" d="M17 5l6 15-16-4zM39 20l-5 14-11-14z"/></svg>';
    return {node:s, update:function(t,p){
      var env=smooth(seg(p,.01,.06))*(1-smooth(seg(p,.5,.62)));
      setO(L.tx,env);
      for(var i=0;i<L.chars.length;i++){
        var q=eOut(clamp(seg(p,.01+i*.008,.07+i*.008),0,1));
        setO(L.chars[i],q);
        setT(L.chars[i],'translateY('+((1-q)*16).toFixed(1)+'px)');
      }
      setO(bin,smooth(seg(p,.04,.16))*(1-smooth(seg(p,.92,1))));
      setT(bin,'scale('+lerp(.9,1,eOut(seg(p,.04,.26))).toFixed(3)+')');
      setO(bits,smooth(seg(p,.56,.68)));
      var drop=seg(p,.28,.56);
      wad.style.left=lerp(760,614,drop).toFixed(0)+'px';
      wad.style.top=lerp(300,444,eIn(drop)+drop*.25).toFixed(0)+'px';
      setO(wad,drop>0&&drop<.95?1:0);
      setT(wad,'rotate('+(drop*540).toFixed(0)+'deg) scale('+lerp(1.15,.72,drop).toFixed(2)+')');
    }};
  }

  /* =====================================================================
     16 \xB7 move it
     ===================================================================== */
  function makeMove(){
    var s=el('div','scene');
    var L=textLine(s,'Move it.',462);
    return {node:s, update:function(t,p){
      setO(L.tx,smooth(seg(p,.02,.14))*(1-smooth(seg(p,.9,1))));
      for(var i=0;i<L.chars.length;i++){
        var q=eOut(clamp(seg(p,.06+i*.06,.5+i*.06),0,1));
        var dir=i%2?1:-1;
        setT(L.chars[i],'translate('+(dir*86*(1-q)).toFixed(1)+'px,'+(dir*-14*(1-q)).toFixed(1)+'px)');
        setO(L.chars[i],Math.min(1,q*1.6));
      }
    }};
  }

  /* =====================================================================
     17 \xB7 upscale it \u2014 sharp lime left, pixellated right
     ===================================================================== */
  function makeUpscale(){
    var s=el('div','scene');
    var L=textLine(s,'Upscale it.',598);
    var lime=el('div','line',s);
    var lt=el('div','tx',lime);
    lt.style.fontSize=L.fs.toFixed(2)+'px';
    lt.style.color='#a6f024';
    lt.style.textShadow='0 0 40px rgba(150,240,40,.55)';
    lt.textContent='Upscale it.';
    var cv=document.createElement('canvas');
    cv.width=W; cv.height=H;
    cv.style.cssText='position:absolute;left:0;top:0;image-rendering:pixelated';
    s.appendChild(cv);
    var g2=cv.getContext('2d');
    var lo=document.createElement('canvas');
    var SC=12;
    lo.width=Math.ceil(W/SC); lo.height=Math.ceil(H/SC);
    var lg=lo.getContext('2d');
    lg.font='600 '+(L.fs/SC).toFixed(2)+'px -apple-system,"SF Pro Display",Helvetica,Arial,sans-serif';
    lg.textAlign='center'; lg.textBaseline='middle';
    lg.fillStyle='#f5f5f7';
    lg.fillText('Upscale it.',W/2/SC,H/2/SC);
    var divider=el('div','',s);
    divider.style.cssText='position:absolute;top:177px;width:1.5px;height:365px;background:rgba(255,255,255,.85)';
    return {node:s, update:function(t,p){
      var env=smooth(seg(p,.02,.14))*(1-smooth(seg(p,.86,1)));
      var sweep=seg(p,.04,.96);
      var x=lerp(320,920,sweep*sweep*.6+sweep*.4);
      setO(L.tx,0);
      setO(lt,env);
      lt.style.clipPath='inset(0 '+(W-x).toFixed(0)+'px 0 0)';
      g2.clearRect(0,0,W,H);
      g2.save();
      g2.beginPath(); g2.rect(x,0,W-x,H); g2.clip();
      g2.imageSmoothingEnabled=false;
      g2.globalAlpha=env;
      g2.drawImage(lo,0,0,lo.width,lo.height,0,0,W,H);
      g2.restore();
      divider.style.left=x.toFixed(1)+'px';
      setO(divider,env*(1-seg(p,.8,.94)));
    }};
  }

  /* =====================================================================
     18 \xB7 share it \u2014 shatters into glowing shards
     ===================================================================== */
  function makeShare(){
    var s=el('div','scene');
    var L=textLine(s,'Share it.',421);
    var TINT=['#eaf4ff','#eaf4ff','#4da6f0','#4da6f0','#4da6f0','#ffffff','#ffffff','#ffffff','#ffffff'];
    /* slice inside the word's own bounds so each shard reads as a fragment */
    var R=rng(8123), frags=[], TW=421, x00=(W-TW)/2;
    for(var i=0;i<9;i++){
      var f=el('div','frag',s);
      f.style.fontSize=L.fs.toFixed(2)+'px';
      f.textContent='Share it.';
      var xa=(x00+i*TW/9)/W*100, xb=(x00+(i+1)*TW/9)/W*100, sk=R()*16-8;
      f.style.clipPath='polygon('+xa.toFixed(2)+'% '+(R()*22).toFixed(0)+'%,'+xb.toFixed(2)+'% 0%,'+
        xb.toFixed(2)+'% '+(78+R()*22).toFixed(0)+'%,'+xa.toFixed(2)+'% 100%)';
      frags.push({n:f,a:(i/8-.5)*2.2+(R()*.5-.25),sp:.5+R()*.9,rot:(R()*2-1)*70,sk:sk});
    }
    return {node:s, update:function(t,p){
      var shat=seg(p,.62,1);
      setO(L.tx,smooth(seg(p,.02,.14))*(1-smooth(seg(p,.6,.7))));
      L.tx.style.textShadow='0 0 46px rgba(190,225,255,.5)';
      for(var i=0;i<L.chars.length;i++){
        var q=eOut(clamp(seg(p,.03+i*.03,.3+i*.03),0,1));
        setC(L.chars[i],TINT[i]||'#ffffff');
        setO(L.chars[i],q);
        setT(L.chars[i],'translateY('+((1-q)*18).toFixed(1)+'px)');
      }
      for(i=0;i<frags.length;i++){
        var f=frags[i], e=eOut(shat);
        setO(f.n,shat>0?smooth(seg(p,.62,.67))*(1-seg(p,.94,1)):0);
        setT(f.n,TXY+'translate('+(f.a*430*e).toFixed(0)+'px,'+((f.sp-.9)*470*e).toFixed(0)+'px) '+
          'rotate('+(f.rot*1.5*e).toFixed(1)+'deg) skewY('+(f.sk*e).toFixed(1)+'deg) scale('+lerp(1,1.9,e).toFixed(2)+')');
      }
    }};
  }

  /* =====================================================================
     19 \xB7 price
     ===================================================================== */
  function makePrice(){
    var s=el('div','scene');
    var str='Get it for $12.99/mo.';
    var wrap=el('div','line',s), tx=el('div','tx',wrap);
    tx.style.fontSize=fitPx(str,811).toFixed(2)+'px';
    var chars=letters(tx,str);
    for(var i=11;i<chars.length;i++) chars[i].style.textShadow='0 0 30px rgba(255,255,255,.6)';
    return {node:s, update:function(t,p){
      setO(tx,smooth(seg(p,.02,.14))*(1-smooth(seg(p,.9,1))));
      for(var i=0;i<chars.length;i++){
        var q=i<11?eOut(seg(p,.04,.2)):clamp(seg(p,.16+(i-11)*.028,.24+(i-11)*.028),0,1);
        setO(chars[i],q);
        setT(chars[i],'translateY('+((1-eOut(q))*12).toFixed(1)+'px)');
      }
    }};
  }

  /* =====================================================================
     20 \xB7 scrolling app picker
     ===================================================================== */
  function makeApps(){
    var s=el('div','scene');
    var APPS=[
      ['Final Cut Pro','#a24ef0','linear-gradient(160deg,#5b2ba8,#2a1050)'],
      ['Motion','#f04ad0','linear-gradient(160deg,#f07ad8,#7a1060)'],
      ['Pixelmator Pro','#e0324a','linear-gradient(160deg,#c02038,#4a0a14)'],
      ['Compressor','#f0d05a','linear-gradient(160deg,#f0c24a,#5a4210)'],
      ['Numbers','#7fd44a','linear-gradient(160deg,#7fd44a,#1f5a14)'],
      ['Keynote','#5ab4f0','linear-gradient(160deg,#5ab4f0,#12456b)'],
      ['Logic Pro','#d8dde6','linear-gradient(160deg,#d8dde6,#5a5f68)'],
      ['GarageBand','#f0863a','linear-gradient(160deg,#f0a04a,#6b3a10)']
    ];
    var rows=APPS.map(function(a){
      var d=el('div','appRow',s);
      d.innerHTML='<em style="background:'+a[2]+'"></em>'+a[0];
      d.style.color=a[1];
      d.style.fontSize='80px';
      return d;
    });
    return {node:s, update:function(t,p){
      var pos=.2+6*Math.pow(p,2.2);
      var fade=1-smooth(seg(p,.96,1));
      for(var i=0;i<rows.length;i++){
        var d=i-pos;
        var near=clamp(1-Math.abs(d),0,1);
        var sc=lerp(.86,1.42,Math.pow(near,1.5));
        rows[i].style.top='0px';
        rows[i].style.transform='translateY('+(360+d*132-48).toFixed(1)+'px) scale('+sc.toFixed(3)+')';
        setO(rows[i],clamp(1.3-Math.abs(d)*.92,0,1)*fade);
        setF(rows[i],near<.6?'brightness(.6)':'none');
      }
    }};
  }

  /* =====================================================================
     timeline
     ===================================================================== */
  var SCENES=[
    {a:0.00,  b:1.72,  s:makeWordmark()},
    {a:1.72,  b:3.42,  s:makeWall()},
    {a:3.42,  b:5.62,  s:makeLines()},
    {a:5.62,  b:6.92,  s:makeDock()},
    {a:6.92,  b:7.72,  s:makeBeatText()},
    {a:7.72,  b:9.52,  s:makeTracks()},
    {a:9.52,  b:11.42, s:makeEditVideo()},
    {a:11.42, b:13.32, s:makeMac()},
    {a:13.32, b:16.10, s:makeCanvasScene()},
    {a:16.10, b:18.02, s:makePrompt()},
    {a:18.02, b:18.56, s:makePerform()},
    {a:18.56, b:19.42, s:makeLoop()},
    {a:19.42, b:20.26, s:makeSelect()},
    {a:20.26, b:21.34, s:makeWrite()},
    {a:21.34, b:23.10, s:makeScrap()},
    {a:23.10, b:24.20, s:makeMove()},
    {a:24.20, b:24.86, s:makeUpscale()},
    {a:24.86, b:25.82, s:makeShare()},
    {a:25.82, b:27.32, s:makePrice()},
    {a:27.32, b:28.52, s:makeApps()},
    {a:28.52, b:DUR,   s:makeWordmark()}
  ];

  var active=null;
  function render(t){
    var k=Math.min((stage.clientWidth||W)/W,(stage.clientHeight||H)/H);
    comp.style.transform='scale('+k.toFixed(4)+')';
    for(var i=0;i<SCENES.length;i++){
      var sc=SCENES[i];
      if(t>=sc.a && t<sc.b){
        if(active!==sc){
          if(active) active.s.node.classList.remove('on');
          sc.s.node.classList.add('on');
          active=sc;
        }
        sc.s.update(t-sc.a, seg(t,sc.a,sc.b));
        return;
      }
    }
  }

  /* ---------- driver ---------- */
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var start=null, raf=0, playing=!reduce, held=false, at=0;
  function seek(t){at=((t%DUR)+DUR)%DUR;render(at);return at}
  function play(){if(playing&&raf)return;playing=true;start=performance.now()-at*1000;if(!raf)raf=requestAnimationFrame(tick)}
  function pause(){playing=false;if(raf){cancelAnimationFrame(raf);raf=0}}
  function tick(now){
    if(!playing){raf=0;return}
    raf=requestAnimationFrame(tick);
    if(start===null)start=now;
    at=((now-start)/1000)%DUR;
    render(at);
  }
  window.addEventListener('resize',function(){render(at)});
  if(reduce){ seek(29.6) } else {
    raf=requestAnimationFrame(tick);
    document.addEventListener('visibilitychange',function(){
      if(document.hidden){ if(playing){held=true;pause()} }
      else if(held){ held=false; play() }
    });
  }
  window.__DUR=DUR;
  window.__seek=function(t){pause();return seek(t)};
  window.__play=play; window.__pause=pause; window.__time=function(){return at};
})();
<\/script>
</body>
</html>
`;var Wd=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Epilude \u2014 Footer</title>
<style>
  :root {
    --olive-400: #a9a9ac;
    --olive-500: #7a7a7d;
    --olive-950: #0c0c0d;
    --white: #fff;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    background: var(--olive-950);
    color: var(--white);
    min-height: 100%;
  }
  body {
    font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
  }
  a { color: inherit; text-decoration: none; }
  ul { list-style: none; }
  h3 { font-size: inherit; font-weight: 400; }

  footer {
    background: var(--olive-950);
    color: var(--white);
    padding-top: 4rem;
  }
  .inner { padding: 4rem 0 2rem; }
  .wrap {
    width: 100%;
    max-width: 42rem;
    margin: 0 auto;
    padding: 0 1.5rem;
  }
  .cols {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.5rem;
    font-size: .875rem;
    line-height: 1.75rem;
  }
  .cols h3 { color: var(--white); }
  .cols ul {
    margin-top: .5rem;
    display: flex;
    flex-direction: column;
    gap: .5rem;
  }
  .cols a { color: var(--olive-400); }
  .cols a:hover { color: #d7d7d9; }

  .storm-wrap {
    margin-top: 4rem;
    user-select: none;
    -webkit-user-select: none;
  }
  .storm {
    position: relative;
    overflow: hidden;
    width: 100%;
    aspect-ratio: 8.541554959785524;
  }
  .storm canvas { display: block; width: 100%; height: 100%; }

  .legal {
    margin-top: 1.5rem;
    font-size: .875rem;
    line-height: 1.75rem;
    color: var(--olive-500);
  }
  .legal-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  .legal-left {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: .75rem;
    text-align: center;
  }
  .legal nav {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: .25rem 1rem;
    color: var(--olive-400);
  }
  .legal nav a:hover { color: #d7d7d9; }

  @media (min-width: 640px) {
    .legal-row {
      flex-direction: row;
      justify-content: space-between;
    }
    .legal-left {
      flex-direction: row;
      align-items: center;
      gap: 1rem;
      text-align: left;
    }
    .legal nav { justify-content: flex-start; }
  }
  @media (min-width: 768px) {
    .wrap { max-width: 48rem; }
    .cols { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  }
  @media (min-width: 1024px) {
    .wrap { max-width: 80rem; padding: 0 2.5rem; }
  }
</style>
</head>
<body>
<footer id="footer">
  <div class="inner">
    <div class="wrap">
      <nav class="cols" aria-label="Footer">
        <div>
          <h3>Product</h3>
          <ul>
            <li><a href="https://app.epilude.com">Download</a></li>
            <li><a href="https://www.epilude.com/features/ai-smart-edits">AI Smart Edits</a></li>
            <li><a href="https://www.epilude.com/features/tone-match">Tone Match</a></li>
            <li><a href="https://www.epilude.com/features/vocabulary">Vocabulary</a></li>
            <li><a href="https://www.epilude.com/features/shortcuts">Shortcuts</a></li>
            <li><a href="https://www.epilude.com/features/actions">Actions</a></li>
            <li><a href="https://www.epilude.com/features/privacy">Local Mode</a></li>
            <li><a href="https://www.epilude.com/features/meetings">Meeting Notes</a></li>
          </ul>
        </div>
        <div>
          <h3>Solutions</h3>
          <ul>
            <li><a href="https://www.epilude.com/leaders">For Leaders</a></li>
            <li><a href="https://www.epilude.com/lawyers">For Lawyers</a></li>
            <li><a href="https://www.epilude.com/creators">For Content Creators</a></li>
            <li><a href="https://www.epilude.com/developers">For Developers</a></li>
            <li><a href="https://www.epilude.com/sales">For Sales</a></li>
            <li><a href="https://www.epilude.com/students">For Students</a></li>
            <li><a href="https://www.epilude.com/customer-support">For Customer Support</a></li>
          </ul>
        </div>
        <div>
          <h3>Compare</h3>
          <ul>
            <li><a href="https://www.epilude.com/best-dictation-app-for-mac">Best dictation app for Mac</a></li>
            <li><a href="https://www.epilude.com/compare/wispr-flow">Epilude vs Wispr Flow</a></li>
            <li><a href="https://www.epilude.com/compare/superwhisper">Epilude vs Superwhisper</a></li>
            <li><a href="https://www.epilude.com/compare/macwhisper">Epilude vs MacWhisper</a></li>
            <li><a href="https://www.epilude.com/compare/aqua-voice">Epilude vs Aqua Voice</a></li>
          </ul>
        </div>
        <div>
          <h3>Resources</h3>
          <ul>
            <li><a href="https://www.epilude.com/pricing">Pricing</a></li>
            <li><a href="https://www.epilude.com/news">News</a></li>
            <li><a href="https://www.epilude.com/help">Help Center</a></li>
            <li><a href="https://www.epilude.com/help/changelog">Changelog</a></li>
            <li><a href="https://www.epilude.com/trust">Trust &amp; Security</a></li>
          </ul>
        </div>
      </nav>
    </div>

    <div class="wrap storm-wrap" aria-hidden="true">
      <div class="storm" id="storm">
        <canvas id="storm-canvas"></canvas>
      </div>
    </div>

    <div class="wrap legal">
      <div class="legal-row">
        <div class="legal-left">
          <p>\xA9 2026 Epilude. All rights reserved.</p>
          <nav aria-label="Legal">
            <a href="https://www.epilude.com/terms">Terms</a>
            <a href="https://www.epilude.com/privacy">Privacy</a>
            <a href="https://www.epilude.com/cookie-policy">Cookies</a>
            <a href="https://www.epilude.com/refund">Refund</a>
          </nav>
        </div>
      </div>
    </div>
  </div>
</footer>

<script>
(function () {
  var WORDMARK =
    '<svg width="3186" height="373" viewBox="0 0 3186 373" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M442.967 0.00610352H769.252L702.801 372.082H376.459L442.967 0.00610352ZM367.675 0.00610352H417.869L351.361 372.082H301.168L367.675 0.00610352ZM225.878 372.08L292.388 0.00708008H254.739L188.232 372.082H150.589L217.094 0.00610352H336.306L269.799 372.081L280.255 372.082H200.781L225.878 372.08ZM141.804 0.00610352H173.176L106.666 372.082H75.2949L141.804 0.00610352ZM66.2705 0.00610352H91.6074L25.1006 372.082H0L66.2705 0.00610352Z" fill="#F4F4F0"/>' +
    '<path d="M2797.67 372.078L2863.05 0H3185.69L3171.87 76.5417H2935.34L2923.11 144.047H3144.23L3130.94 220.057H2909.82L2896.54 295.536H3133.6L3120.31 372.078H2797.67Z" fill="#F4F4F0"/>' +
    '<path d="M2385.62 372.078L2451 0H2630.66C2740.69 0 2795.97 46.244 2795.97 138.732C2795.97 155.21 2794.38 172.75 2790.66 191.886C2769.39 314.14 2699.23 372.078 2570.07 372.078H2385.62ZM2484.49 295.004H2580.7C2656.18 295.004 2692.85 263.112 2706.67 186.039C2709.33 173.282 2709.86 161.056 2709.86 150.957C2709.86 99.3979 2682.22 77.0733 2619.5 77.0733H2523.29L2484.49 295.004Z" fill="#F4F4F0"/>' +
    '<path d="M2154.34 372.112C2045.37 372.112 1990.62 333.807 1990.62 243.445C1990.62 228.03 1991.68 212.084 1994.87 194.543L2028.89 0H2114.47L2079.92 197.733C2077.26 209.958 2076.2 220.589 2076.2 230.688C2076.2 280.653 2103.84 295.039 2162.31 295.039C2232.47 295.039 2268.62 271.085 2281.9 197.733L2316.45 0H2402.03L2366.95 200.39C2345.69 322.113 2274.99 372.112 2154.34 372.112Z" fill="#F4F4F0"/>' +
    '<path d="M1641.99 372.078L1707.36 0H1792.94L1740.85 295.004H1961.97L1948.68 372.078H1641.99Z" fill="#F4F4F0"/>' +
    '<path d="M1498.82 372.078L1564.2 0H1649.78L1584.4 372.078H1498.82Z" fill="#F4F4F0"/>' +
    '<path d="M1113.77 372.078L1179.15 0H1403.99C1477.87 0 1510.83 30.8293 1510.83 91.4249C1510.83 103.119 1509.77 116.407 1507.11 130.227C1492.76 209.958 1453.96 248.761 1365.72 248.761H1221.14L1199.35 372.078H1113.77ZM1234.43 172.75H1362.53C1397.08 172.75 1416.75 156.804 1422.59 123.849C1423.13 119.065 1423.66 114.813 1423.66 111.092C1423.66 87.1725 1408.77 76.0102 1379.54 76.0102H1251.44L1234.43 172.75Z" fill="#F4F4F0"/>' +
    '<path d="M746.362 372.078L811.742 0H1134.39L1120.57 76.5417H884.031L871.806 144.047H1092.93L1079.64 220.057H858.517L845.229 295.536H1082.3L1069.01 372.078H746.362Z" fill="#F4F4F0"/>' +
    "</svg>";

  var PALETTE = [[255, 255, 255], [226, 232, 240], [191, 205, 225]];
  var FORMATS = ["dot", "dot", "square"];
  var SIZE_SMALL = [1.4, 2.8];
  var SIZE_BIG = [3, 4.2];
  var BIG_CHANCE = 0.07;
  var GAP = 6;
  var SPEED = 2;
  var SEED = 1337;
  var GAMMA = 0.8;
  var DUR = 8;
  var TAU = Math.PI * 2;

  function noise(x, y, t) {
    var a = x + 0.7 * Math.sin(1.2 * y + t);
    var r = y + 0.7 * Math.cos(1.1 * x - t);
    return (Math.sin(1.3 * a + 0.6 * t) + Math.cos(1.5 * r - 0.5 * t) + Math.sin((a + r) * 0.9 + 0.3 * t)) / 3;
  }

  function snowfall(p, t, n) {
    var swirl = n.swirl ? n.swirl * noise(3 * p.nx, 3 * p.ny, 0.5 * t) : 0;
    var sway = (n.sway || 0) * Math.sin(0.8 * t + p.offset * TAU + 4 * p.ny) + swirl;
    var i = n.axis === "x" ? p.nx : p.ny;
    var l = n.axis === "x" ? p.ny : p.nx;
    var o = i * n.freq - t * n.fall + p.offset * n.freq + sway + (n.wind || 0) * l;
    var s = o - Math.floor(o);
    return s < n.trail ? 1 - s / n.trail : 0;
  }

  function squall(p, t) {
    var band = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(3 * p.nx - 0.5 * t), 2);
    var flake = snowfall(p, t, { fall: 0.26, freq: 5, trail: 0.4, sway: 0.14, wind: 0.8 });
    return {
      a: 0.04 + 0.95 * band * Math.pow(flake, 1.8),
      p: 0.7 * p.offset
    };
  }

  function lerpRGB(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }

  function mixPalette(p) {
    var e = Math.max(0, Math.min(1, p)) * (PALETTE.length - 1);
    var r = Math.floor(e);
    var s = e - r;
    return lerpRGB(PALETTE[r], PALETTE[Math.min(PALETTE.length - 1, r + 1)], s);
  }

  var canvas = document.getElementById("storm-canvas");
  var host = document.getElementById("storm");
  var ctx = canvas.getContext("2d");
  var particles = [];
  var maskImg = null;
  var maskReady = false;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var playing = !reduced;
  var tNow = 0;
  var t0 = performance.now();
  var raf = 0;
  var visible = true;

  function lcg(seed) {
    var e = seed >>> 0;
    return function () {
      e = (1664525 * e + 0x3c6ef35f) >>> 0;
      return e / 0xffffffff;
    };
  }

  function makeMask(w, h) {
    if (!maskImg || !maskReady || !maskImg.width || !maskImg.height) return null;
    var off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    var g = off.getContext("2d");
    if (!g) return null;
    var scale = Math.min(w / maskImg.width, h / maskImg.height);
    var dw = maskImg.width * scale;
    var dh = maskImg.height * scale;
    g.drawImage(maskImg, (w - dw) / 2, (h - dh) / 2, dw, dh);
    var data;
    try { data = g.getImageData(0, 0, w, h).data; }
    catch (e) { return null; }
    return function (x, y) {
      var ix = Math.min(w - 1, Math.max(0, Math.round(x)));
      var iy = Math.min(h - 1, Math.max(0, Math.round(y)));
      var i = (iy * w + ix) * 4;
      var lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
      return Math.pow(lum * (data[i + 3] / 255), GAMMA);
    };
  }

  function rebuild() {
    var w = host.clientWidth;
    var h = host.clientHeight;
    if (!w || !h) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var sample = makeMask(w, h);
    var rand = lcg(SEED);
    var cols = Math.ceil(w / GAP);
    var rows = Math.ceil(h / GAP);
    var ox = (w - (cols - 1) * GAP) / 2;
    var oy = (h - (rows - 1) * GAP) / 2;
    var cx = (cols - 1) / 2;
    var cy = (rows - 1) / 2;
    var maxd = Math.hypot(cx, cy) || 1;
    particles = [];
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var format = FORMATS[Math.floor(rand() * FORMATS.length)];
        var range = rand() < BIG_CHANCE ? SIZE_BIG : SIZE_SMALL;
        var size = range[0] + rand() * (range[1] - range[0]);
        var px = ox + x * GAP;
        var py = oy + y * GAP;
        particles.push({
          cx: px,
          cy: py,
          nx: cols > 1 ? x / (cols - 1) : 0.5,
          ny: rows > 1 ? y / (rows - 1) : 0.5,
          dist: Math.hypot(x - cx, y - cy) / maxd,
          format: format,
          size: size,
          phase: rand() * Math.PI * 2,
          speed: 0.6 + 2.6 * rand(),
          offset: rand(),
          mask: sample ? sample(px, py) : 1
        });
      }
    }
  }

  function drawParticle(p, t) {
    var field = squall(p, t);
    var alpha = field.a;
    var rgb = mixPalette(field.p);
    alpha = Math.max(0, Math.min(1, alpha));
    if (p.mask < 1) alpha = p.mask * (0.3 + 0.7 * alpha);
    if (alpha <= 0.005) return;
    ctx.fillStyle = "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + alpha + ")";
    var hx = p.cx, hy = p.cy, d = p.size, r = d / 2;
    if (p.format === "square") ctx.fillRect(hx - r, hy - r, d, d);
    else {
      ctx.beginPath();
      ctx.arc(hx, hy, r, 0, TAU);
      ctx.fill();
    }
  }

  function render(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < particles.length; i++) drawParticle(particles[i], t);
  }

  function apply(t) {
    tNow = ((t % DUR) + DUR) % DUR;
    render(tNow * SPEED);
  }

  function tick(now) {
    if (playing && visible) {
      tNow = ((now - t0) / 1000) % DUR;
      render(tNow * SPEED);
    }
    raf = requestAnimationFrame(tick);
  }

  function play() {
    playing = true;
    t0 = performance.now() - tNow * 1000;
  }

  function pause() {
    playing = false;
  }

  var img = new Image();
  img.onload = function () {
    maskImg = img;
    maskReady = true;
    rebuild();
    apply(tNow);
  };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(WORDMARK);

  rebuild();
  apply(0);
  raf = requestAnimationFrame(tick);

  window.addEventListener("resize", function () {
    rebuild();
    apply(tNow);
  });

  if (typeof ResizeObserver !== "undefined") {
    var lastW = host.clientWidth, lastH = host.clientHeight;
    new ResizeObserver(function () {
      if (host.clientWidth !== lastW || host.clientHeight !== lastH) {
        lastW = host.clientWidth;
        lastH = host.clientHeight;
        rebuild();
        apply(tNow);
      }
    }).observe(host);
  }

  if (typeof IntersectionObserver !== "undefined") {
    new IntersectionObserver(function (entries) {
      var on = entries[0] && entries[0].isIntersecting;
      if (on === visible) return;
      visible = !!on;
      if (visible) t0 = performance.now() - tNow * 1000;
    }, { rootMargin: "120px" }).observe(canvas);
  }

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && playing) t0 = performance.now() - tNow * 1000;
  });

  window.__DUR = DUR;
  window.__seek = function (t) { pause(); apply(t); };
  window.__play = play;
  window.__pause = pause;
  window.__time = function () { return tNow; };
})();
<\/script>
</body>
</html>
`;var Ud=`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Issue 01 \u2014 Expanse Field</title>
    
    <!-- Frameworks & Animations -->
    <script src="https://cdn.tailwindcss.com"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\/script>
    <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"><\/script>
</head>
<body class="bg-[#f6f5f4] text-neutral-900 antialiased selection:bg-neutral-900 selection:text-white" 
      style="font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">

    <!-- WebGL Background Context -->
    <canvas id="glcanvas" class="fixed inset-0 w-full h-full -z-10 pointer-events-none"></canvas>

    <!-- Subtle Diagonal Texture Overlay -->
    <div class="fixed inset-0 pointer-events-none -z-10" 
         style="background-image: repeating-linear-gradient(45deg, rgba(0,0,0,0.015) 0, rgba(0,0,0,0.015) 1px, transparent 1px, transparent 6px);">
    </div>

    <!-- Global Framed Grid System -->
    <div class="fixed inset-4 md:inset-6 pointer-events-none z-50 flex flex-col justify-between mix-blend-difference text-white/50"
         style="border: 1px solid rgba(255,255,255,0.15); border-image: linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0.3), rgba(255,255,255,0.1)) 1;">
        
        <!-- Corner Brackets -->
        <div class="absolute -top-[1px] -left-[1px] w-5 h-5 border-t border-l border-white/60"></div>
        <div class="absolute -top-[1px] -right-[1px] w-5 h-5 border-t border-r border-white/60"></div>
        <div class="absolute -bottom-[1px] -left-[1px] w-5 h-5 border-b border-l border-white/60"></div>
        <div class="absolute -bottom-[1px] -right-[1px] w-5 h-5 border-b border-r border-white/60"></div>

        <!-- Structural Guide Lines -->
        <div class="absolute left-[33.33%] top-0 bottom-0 w-[1px] bg-white/10 hidden md:block"></div>
        <div class="absolute right-[33.33%] top-0 bottom-0 w-[1px] bg-white/10 hidden md:block"></div>
    </div>

    <!-- Document Content -->
    <main class="w-full relative z-10">

        <!-- PAGE 01: COVER -->
        <section id="cover" class="relative min-h-screen p-6 md:p-12 flex flex-col pt-16 md:pt-24 pb-12">
            
            <!-- Masthead -->
            <header class="flex justify-between items-start mb-16 md:mb-24 relative z-20 mix-blend-difference text-white">
                <div class="text-xs uppercase tracking-widest font-medium">Issue N\xBA 01</div>
                <div class="text-xs uppercase tracking-widest font-medium text-right leading-tight">
                    Vol. 1 <br>
                    <span class="text-white/60">Aura Asset Library</span>
                </div>
            </header>

            <!-- Cover Layout Grid -->
            <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8 relative z-20 h-full items-end pb-12 md:pb-0">
                
                <!-- Left: Typography -->
                <div class="col-span-1 md:col-span-2 flex flex-col justify-end order-2 md:order-1">
                    <h1 class="text-6xl md:text-[9vw] leading-[0.8] tracking-tight font-semibold mix-blend-difference text-white uppercase" 
                        style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                        Digital<br>Artifacts
                    </h1>
                    <div class="mt-8 md:mt-12 max-w-sm mix-blend-difference text-white/70">
                        <p class="text-sm font-normal leading-relaxed">
                            Exploring the intersection of generative environments, raw computational textures, and structured grid systems to establish physical presence in the void.
                        </p>
                    </div>
                </div>

                <!-- Right: Featured Asset -->
                <div class="col-span-1 flex items-center justify-center md:justify-end order-1 md:order-2 h-full pb-8 md:pb-0">
                    <div class="relative w-full max-w-sm aspect-[4/5] p-2 bg-black/5 backdrop-blur-md"
                         style="border: 1px solid rgba(255,255,255,0.1); border-image: linear-gradient(to bottom right, rgba(255,255,255,0.4), rgba(255,255,255,0.05)) 1;">
                         <img src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/4f5668c5-fc4a-44e0-bc5e-a664189d3c31_1600w.jpg" 
                              class="w-full h-full object-cover filter grayscale contrast-125 opacity-90 mix-blend-luminosity" 
                              alt="Cover Feature Portrait">
                         
                         <!-- Image Container Corner Details -->
                         <div class="absolute top-2 left-2 w-3 h-3 border-t border-l border-white/60 mix-blend-difference"></div>
                         <div class="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-white/60 mix-blend-difference"></div>
                    </div>
                </div>
            </div>

            <!-- Footer Barcode -->
            <div class="mt-auto flex justify-between items-end relative z-20 mix-blend-difference text-white">
                <div class="text-xs font-mono uppercase tracking-widest flex items-center gap-3">
                    <iconify-icon icon="solar:barcode-line" class="text-3xl opacity-80" stroke-width="1.5"></iconify-icon>
                    <span>978-1-2345-678-0</span>
                </div>
                <div class="text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-2">
                    Scroll <iconify-icon icon="solar:arrow-down-linear" class="text-sm"></iconify-icon>
                </div>
            </div>
        </section>

        <!-- PAGE 02: ARTICLE SPREAD -->
        <section id="page-2" class="relative min-h-screen bg-[#f6f5f4] p-6 md:p-12 flex flex-col justify-center shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
             <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 h-full items-center">
                
                <!-- Left Figure -->
                <div id="figure-img" class="md:col-span-4 flex flex-col justify-between h-full py-12 md:py-24">
                    <div class="text-[10px] uppercase tracking-widest font-medium text-neutral-400 mb-6 border-b border-neutral-300 pb-2 inline-block max-w-fit">
                        [ Fig. 01 ]
                    </div>
                    <div class="relative overflow-hidden aspect-[3/4]">
                        <img src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/724142aa-44a6-48d3-9cf3-761e00d05b78_1600w.jpg" 
                             class="w-full h-full object-cover filter grayscale contrast-125" 
                             alt="Deconstructed Pyramid Architecture">
                    </div>
                    <div class="text-[10px] uppercase tracking-widest mt-6 text-neutral-500 flex justify-between">
                        <span>Architecture</span>
                        <span>001</span>
                    </div>
                </div>

                <!-- Right Editorial Text -->
                <div class="md:col-span-8 md:pl-12 pt-8 md:pt-0">
                    <div class="text-xs uppercase tracking-widest font-medium text-neutral-400 mb-8 flex items-center gap-2">
                        <iconify-icon icon="solar:document-text-linear" class="text-base"></iconify-icon> Index Introduction
                    </div>
                    
                    <!-- GSAP Stagger Reveal Target -->
                    <div id="stagger-text" class="text-3xl md:text-5xl lg:text-[3.5vw] leading-[1.05] tracking-tight font-medium text-neutral-900">
                        The evolution of surface interfaces demands a departure from sterile environments. We look towards raw noise and structured grids to ground logic in physical realism.
                    </div>

                    <div class="mt-12 md:mt-20 flex flex-col md:flex-row gap-8 md:gap-12 text-sm font-normal text-neutral-600 leading-relaxed border-t border-neutral-200 pt-8">
                        <p class="flex-1">
                            By manipulating fragments of light through mathematical shaders, we simulate the imperfections of analog film. The resulting grain breathes life into rigid columns, oscillating to mimic a natural rhythm within strict constraints.
                        </p>
                        <p class="flex-1">
                            This intersection of organic distortion and rigid geometry creates a meditative atmosphere. It is not merely a background, but a dynamic environment that continuously responds to time and structure.
                        </p>
                    </div>
                </div>
             </div>
        </section>

    </main>

    <!-- Logic & Shaders -->
    <script>
        document.addEventListener("DOMContentLoaded", () => {
            
            // -----------------------------------------------------
            // 1. WebGL Background Setup (Three.js)
            // -----------------------------------------------------
            const initWebGL = () => {
                const canvas = document.getElementById('glcanvas');
                const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

                const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
                const scene = new THREE.Scene();
                const geometry = new THREE.PlaneGeometry(2, 2);

                const uniforms = {
                    u_time: { value: 0.0 },
                    u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
                };

                const material = new THREE.ShaderMaterial({
                    uniforms: uniforms,
                    vertexShader: \`
                        void main() {
                            gl_Position = vec4(position, 1.0);
                        }
                    \`,
                    fragmentShader: \`
                        uniform vec2 u_resolution;
                        uniform float u_time;

                        float random(vec2 st) {
                            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                        }

                        void main() {
                            vec2 st = gl_FragCoord.xy / u_resolution.xy;
                            float numBars = 11.0;
                            float barIndex = floor(st.x * numBars);
                            float t = barIndex / (numBars - 1.0);

                            // Breathing pulse animation
                            float anim = sin(u_time * 0.5 + t * 3.0) * 0.025;

                            // Curve for horizon line
                            float targetHeight = 0.15 + pow(t, 1.3) * 0.5 + anim;

                            // Color gradient: Dark base -> Blue/Pink mid -> Cutoff
                            vec3 colorBase = vec3(0.04, 0.04, 0.06);
                            vec3 colorMid = mix(vec3(0.1, 0.3, 0.8), vec3(0.8, 0.2, 0.5), st.x);
                            vec3 color = mix(colorBase, colorMid, smoothstep(0.1, 0.7, st.y));

                            // Stepped horizon cutoff matching body background
                            if (st.y > targetHeight) {
                                gl_FragColor = vec4(0.965, 0.961, 0.957, 1.0); // #f6f5f4
                                return;
                            }

                            // High-frequency film grain
                            float noise = random(st * (u_time * 0.1)) * 0.15;
                            gl_FragColor = vec4(color + noise, 1.0);
                        }
                    \`,
                    transparent: true
                });

                const mesh = new THREE.Mesh(geometry, material);
                scene.add(mesh);

                const animate = (time) => {
                    uniforms.u_time.value = time * 0.001;
                    renderer.render(scene, camera);
                    requestAnimationFrame(animate);
                };
                requestAnimationFrame(animate);

                window.addEventListener('resize', () => {
                    renderer.setSize(window.innerWidth, window.innerHeight);
                    uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
                });
            };

            // -----------------------------------------------------
            // 2. GSAP Interactions & Masked Text Reveal
            // -----------------------------------------------------
            const initGSAP = () => {
                gsap.registerPlugin(ScrollTrigger);

                // Entry Animation for Cover
                const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
                tl.fromTo("#cover h1", { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 2, delay: 0.2 })
                  .fromTo("#cover p", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1.5 }, "-=1.5")
                  .fromTo("#cover img", { scale: 1.1, filter: "blur(10px)", opacity: 0 }, { scale: 1, filter: "blur(0px)", opacity: 0.9, duration: 2.5 }, "-=1.8");

                // Text Splitter Utility for Masked Reveal
                const textElement = document.getElementById('stagger-text');
                const words = textElement.innerText.trim().split(' ');
                textElement.innerHTML = '';

                words.forEach(word => {
                    const wordWrap = document.createElement('span');
                    // Style inline to avoid external CSS
                    wordWrap.style.display = 'inline-block';
                    wordWrap.style.overflow = 'hidden';
                    wordWrap.style.marginRight = '0.2em';
                    wordWrap.style.paddingBottom = '0.1em'; // Prevent clipping bottom of letters
                    wordWrap.style.verticalAlign = 'top';

                    const innerSpan = document.createElement('span');
                    innerSpan.innerText = word;
                    innerSpan.style.display = 'inline-block';
                    innerSpan.classList.add('reveal-word');

                    wordWrap.appendChild(innerSpan);
                    textElement.appendChild(wordWrap);
                });

                // ScrollTrigger: Masked Stagger Reveal
                gsap.fromTo('.reveal-word', 
                    { y: '110%', rotationZ: 4 }, 
                    {
                        y: '0%',
                        rotationZ: 0,
                        duration: 1.2,
                        ease: "power4.out",
                        stagger: 0.03,
                        scrollTrigger: {
                            trigger: '#stagger-text',
                            start: "top 85%",
                            toggleActions: "play none none reverse"
                        }
                    }
                );

                // Subtle Image Parallax on Page 2
                gsap.fromTo('#figure-img img', 
                    { yPercent: -15, scale: 1.1 },
                    {
                        yPercent: 15,
                        scale: 1,
                        ease: "none",
                        scrollTrigger: {
                            trigger: '#page-2',
                            start: "top bottom",
                            end: "bottom top",
                            scrub: true
                        }
                    }
                );
            };

            // Initialize
            initWebGL();
            initGSAP();
        });
    <\/script>
</body>
</html>`;var Gd=`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Component Preview</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
    }
    body {
      height: 100%;
      overflow: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #ffffff;
      color: #000000;
    }
    .component-wrapper {
      width: 100%;
      height: 100%;
      padding: 0;
      box-sizing: border-box;
      overflow: auto;
    }
  </style>
</head>
<body>
  <div class="component-wrapper">
    <html><head></head><body><button type="button" class="button">
  <div class="points_wrapper">
    <i class="point"></i>
    <i class="point"></i>
    <i class="point"></i>
    <i class="point"></i>
    <i class="point"></i>
    <i class="point"></i>
    <i class="point"></i>
    <i class="point"></i>
    <i class="point"></i>
    <i class="point"></i>
  </div>

  <span class="inner">
    Sign Up
    <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
      <path d="M5 12h14"></path>
      <path d="m12 5 7 7-7 7"></path>
    </svg>
  </span>
  <style>
    .button {
      cursor: pointer;
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      transition: all 0.25s ease;
      background: radial-gradient(65.28% 65.28% at 50% 100%,
          rgba(34, 211, 238, 0.8) 0%,
          rgba(34, 211, 238, 0) 100%),
        linear-gradient(0deg, #2563eb, #2563eb);
      border-radius: 0.75rem;
      border: none;
      outline: none;
      padding: 12px 18px;
      min-height: 48px;
      min-width: 102px;
    }
  
    .button::before,
    .button::after {
      content: "";
      position: absolute;
      transition: all 0.5s ease-in-out;
      z-index: 0;
    }
  
    .button::before {
      inset: 1px;
      background: linear-gradient(177.95deg,
          rgba(255, 255, 255, 0.19) 0%,
          rgba(255, 255, 255, 0) 100%);
      border-radius: calc(0.75rem - 1px);
    }
  
    .button::after {
      inset: 2px;
      background: radial-gradient(65.28% 65.28% at 50% 100%,
          rgba(34, 211, 238, 0.8) 0%,
          rgba(34, 211, 238, 0) 100%),
        linear-gradient(0deg, #2563eb, #2563eb);
      border-radius: calc(0.75rem - 2px);
    }
  
    .button:active {
      transform: scale(0.95);
    }
  
    .points_wrapper {
      overflow: hidden;
      width: 100%;
      height: 100%;
      pointer-events: none;
      position: absolute;
      z-index: 1;
    }
  
    .points_wrapper .point {
      bottom: -10px;
      position: absolute;
      animation: floating-points infinite ease-in-out;
      pointer-events: none;
      width: 2px;
      height: 2px;
      background-color: #fff;
      border-radius: 9999px;
    }
  
    @keyframes floating-points {
      0% {
        transform: translateY(0);
      }
  
      85% {
        opacity: 0;
      }
  
      100% {
        transform: translateY(-55px);
        opacity: 0;
      }
    }
  
    .points_wrapper .point:nth-child(1) {
      left: 10%;
      opacity: 1;
      animation-duration: 2.35s;
      animation-delay: 0.2s;
    }
  
    .points_wrapper .point:nth-child(2) {
      left: 30%;
      opacity: 0.7;
      animation-duration: 2.5s;
      animation-delay: 0.5s;
    }
  
    .points_wrapper .point:nth-child(3) {
      left: 25%;
      opacity: 0.8;
      animation-duration: 2.2s;
      animation-delay: 0.1s;
    }
  
    .points_wrapper .point:nth-child(4) {
      left: 44%;
      opacity: 0.6;
      animation-duration: 2.05s;
    }
  
    .points_wrapper .point:nth-child(5) {
      left: 50%;
      opacity: 1;
      animation-duration: 1.9s;
    }
  
    .points_wrapper .point:nth-child(6) {
      left: 75%;
      opacity: 0.5;
      animation-duration: 1.5s;
      animation-delay: 1.5s;
    }
  
    .points_wrapper .point:nth-child(7) {
      left: 88%;
      opacity: 0.9;
      animation-duration: 2.2s;
      animation-delay: 0.2s;
    }
  
    .points_wrapper .point:nth-child(8) {
      left: 58%;
      opacity: 0.8;
      animation-duration: 2.25s;
      animation-delay: 0.2s;
    }
  
    .points_wrapper .point:nth-child(9) {
      left: 98%;
      opacity: 0.6;
      animation-duration: 2.6s;
      animation-delay: 0.1s;
    }
  
    .points_wrapper .point:nth-child(10) {
      left: 65%;
      opacity: 1;
      animation-duration: 2.5s;
      animation-delay: 0.2s;
    }
  
    .inner {
      z-index: 2;
      gap: 6px;
      position: relative;
      width: 100%;
      color: white;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 500;
      line-height: 1.5;
      transition: color 0.2s ease-in-out;
    }
  
    .inner svg.icon {
      width: 18px;
      height: 18px;
      transition: transform 0.3s ease;
      stroke: white;
      fill: none;
    }
  
    .button:hover svg.icon {
      transform: translateX(2px);
    }
  
    .button:hover svg.icon path {
      animation: dash 0.8s linear forwards;
    }
  
    @keyframes dash {
      0% {
        stroke-dasharray: 0, 20;
        stroke-dashoffset: 0;
      }
  
      50% {
        stroke-dasharray: 10, 10;
        stroke-dashoffset: -5;
      }
  
      100% {
        stroke-dasharray: 20, 0;
        stroke-dashoffset: -10;
      }
    }
  </style>
</button></body></html>
  </div>
  
    <script>
      (function() {
        function checkAndCenter() {
          // Use double requestAnimationFrame to ensure DOM is fully painted and layout is stable
          requestAnimationFrame(function() {
            requestAnimationFrame(function() {
              const wrapper = document.querySelector('.component-wrapper');
              if (!wrapper) return;
              
              // Get all child elements
              const children = Array.from(wrapper.children);
              if (children.length === 0) return;
              
              // Temporarily override wrapper styles to shrink-wrap for measurement
              // Set inline styles to shrink-wrap (inline styles override CSS)
              wrapper.style.display = 'inline-block';
              wrapper.style.width = 'auto';
              wrapper.style.height = 'auto';
              wrapper.style.overflow = 'visible';
              wrapper.style.boxSizing = 'content-box';
              
              // Force multiple reflows to ensure styles are fully applied
              void wrapper.offsetHeight;
              void wrapper.offsetWidth;
              void wrapper.offsetHeight;
              
              // Measure the wrapper's content size
              const contentWidth = wrapper.offsetWidth;
              const contentHeight = wrapper.offsetHeight;
              
              // Restore original styles by removing inline styles we added
              wrapper.style.removeProperty('display');
              wrapper.style.removeProperty('width');
              wrapper.style.removeProperty('height');
              wrapper.style.removeProperty('overflow');
              wrapper.style.removeProperty('box-sizing');
              
              // If content is less than 500x500, center it
              if (contentWidth > 0 && contentHeight > 0 && contentWidth < 500 && contentHeight < 500) {
                wrapper.style.display = 'flex';
                wrapper.style.alignItems = 'center';
                wrapper.style.justifyContent = 'center';
              }
            });
          });
        }
        
        // Check immediately and after delays to ensure content is rendered and styled
        function runChecks() {
          checkAndCenter();
          setTimeout(checkAndCenter, 50);
          setTimeout(checkAndCenter, 150);
          setTimeout(checkAndCenter, 300);
          setTimeout(checkAndCenter, 500);
          setTimeout(checkAndCenter, 1000);
        }
        
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', runChecks);
        } else {
          runChecks();
        }
        
        // Also check when images or other resources load
        window.addEventListener('load', () => {
          setTimeout(checkAndCenter, 100);
          setTimeout(checkAndCenter, 300);
        });
        
        // Use ResizeObserver to detect size changes
        if (window.ResizeObserver) {
          setTimeout(() => {
            const wrapper = document.querySelector('.component-wrapper');
            if (wrapper) {
              const observer = new ResizeObserver(() => {
                setTimeout(checkAndCenter, 50);
              });
              observer.observe(wrapper);
            }
          }, 500);
        }
      })();
    <\/script>
  
</body>
</html>
`;var Vd=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>New Grainient Collection Added \u2014 motion</title>
<style>
  html,body{margin:0;height:100%;background:#000;overflow:hidden}
  body{-webkit-font-smoothing:antialiased}
  canvas{display:block;width:100vw;height:100vh}
</style>
</head>
<body>
<canvas id="stage"></canvas>
<script>
(function(){
'use strict';

/* ------------------------------------------------------------------ *
 * Design frame: 2962 x 2160.  Every length below is in that space.
 * ------------------------------------------------------------------ */
var DW = 2962, DH = 2160, DASP = DW / DH;

var RING = {
  cx: 1484, cy: 1108,   /* projected ring centre                        */
  a: 712,               /* projected semi-major axis (px)               */
  ratio: 0.492,         /* semi-minor / semi-major -> plane tilt 60.5deg */
  axis: 25.5,           /* screen angle of the major axis (deg, y down)  */
  n: 12,                /* tiles                                         */
  tile: 346,            /* tile side in ring units (R = a)               */
  radius: 0.22,         /* corner radius as a fraction of the side       */
  dist: 13,             /* camera distance in ring radii                 */
  phase: 93             /* psi of tile 0 at t = 0 (deg)                  */
};

var DUR = 15.015;       /* one full revolution = a seamless loop */

var HEAD = [
  { s:'NEW GRAINIENT',    top:930,  w:1370, fill:'#d0d0d0' },
  { s:'COLLECTION ADDED', top:1114, w:1775, fill:'#ffffff' }
];
var CAP = 142;          /* headline cap height */
var SMALL = 22;         /* small-label cap height */

var SANS = '"Helvetica Neue",Helvetica,"Inter",Arial,system-ui,sans-serif';

/* ------------------------------------------------------------------ *
 * Deterministic noise
 * ------------------------------------------------------------------ */
function rng(seed){
  var s = seed >>> 0;
  return function(){
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

function mkc(w,h){
  var c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

/* ------------------------------------------------------------------ *
 * Tile artwork \u2014 eleven grainy gradient "wallpapers"
 * ------------------------------------------------------------------ */
var TS = 512;                       /* texture resolution */
var grainTile = (function(){
  var c = mkc(160,160), x = c.getContext('2d'), d = x.createImageData(160,160), r = rng(0x51F3);
  for (var i = 0; i < d.data.length; i += 4){
    var v = 128 + (r() - 0.5) * 116;
    d.data[i] = d.data[i+1] = d.data[i+2] = v;
    d.data[i+3] = 255;
  }
  x.putImageData(d,0,0);
  return c;
})();

function lin(x,x0,y0,x1,y1,stops){
  var g = x.createLinearGradient(x0*TS,y0*TS,x1*TS,y1*TS);
  for (var i=0;i<stops.length;i++) g.addColorStop(stops[i][0],stops[i][1]);
  return g;
}
function rad(x,cx,cy,r,stops,r0){
  var g = x.createRadialGradient(cx*TS,cy*TS,(r0||0)*TS,cx*TS,cy*TS,r*TS);
  for (var i=0;i<stops.length;i++) g.addColorStop(stops[i][0],stops[i][1]);
  return g;
}
function fill(x,style){ x.fillStyle = style; x.fillRect(0,0,TS,TS); }

/* soft blurred stroke: draw off-canvas and keep only its shadow */
function band(x,pts,color,width,blur,passes){
  x.save();
  x.translate(-2*TS,0);
  x.shadowOffsetX = 2*TS; x.shadowBlur = blur*TS; x.shadowColor = color;
  x.strokeStyle = color; x.lineWidth = width*TS; x.lineCap='round'; x.lineJoin='round';
  x.beginPath();
  x.moveTo(pts[0][0]*TS,pts[0][1]*TS);
  for (var i=1;i<pts.length-1;i+=2){
    x.quadraticCurveTo(pts[i][0]*TS,pts[i][1]*TS,pts[i+1][0]*TS,pts[i+1][1]*TS);
  }
  for (var p=0;p<(passes||1);p++) x.stroke();
  x.restore();
}
function glow(x,cx,cy,r,color,mode){
  x.save();
  x.globalCompositeOperation = mode || 'lighter';
  x.fillStyle = rad(x,cx,cy,r,[[0,color],[1,'rgba(0,0,0,0)']]);
  x.fillRect(0,0,TS,TS);
  x.restore();
}

/* a wavy spine across the tile, used for silk bands and chrome folds */
function spine(y0,amp,ph,tilt){
  var p = [], i, u;
  for (i=0;i<5;i++){ u = -0.12 + i*0.31; p.push([u, y0 + amp*Math.sin(ph + u*4.2) + tilt*u]); }
  return p;
}
/* one wavy edge across the tile */
function wavy(x,y0,ph,amp,freq,tilt){
  var i,u,y;
  x.beginPath();
  for (i=0;i<=10;i++){
    u = -0.12 + i*0.124; y = y0 + amp*Math.sin(ph + u*freq) + (tilt||0)*u;
    if (i===0) x.moveTo(u*TS,y*TS); else x.lineTo(u*TS,y*TS);
  }
}
function wavyStroke(x,y0,ph,amp,freq,tilt,color,w,blur){
  x.save();
  x.translate(-2*TS,0);
  x.shadowOffsetX = 2*TS; x.shadowBlur = blur*TS; x.shadowColor = color;
  x.strokeStyle = color; x.lineWidth = w*TS; x.lineCap = 'round';
  wavy(x,y0,ph,amp,freq,tilt); x.stroke(); x.stroke();
  x.restore();
}
/* closed band between two wavy edges */
function bandPath(x,y0,h,ph,amp,freq,tilt){
  var i,u;
  x.beginPath();
  for (i=0;i<=10;i++){
    u = -0.12 + i*0.124;
    x.lineTo(u*TS, (y0 + amp*Math.sin(ph+u*freq) + tilt*u)*TS);
  }
  for (i=10;i>=0;i--){
    u = -0.12 + i*0.124;
    x.lineTo(u*TS, (y0 + h + amp*0.62*Math.sin(ph+1.9+u*freq*0.86) + tilt*u)*TS);
  }
  x.closePath();
}
/* folded liquid-chrome sheet: dark body, hot crest, iridescent underside */
function chrome(x,y0,h,ph,amp,freq,tilt,hot){
  x.save();
  x.translate(-2*TS,0);
  x.shadowOffsetX = 2*TS; x.shadowBlur = 0.06*TS; x.shadowColor = 'rgba(132,12,0,0.9)';
  x.fillStyle = '#000';
  bandPath(x,y0-0.018,h+0.036,ph,amp,freq,tilt); x.fill(); x.fill();
  x.restore();

  x.save();
  bandPath(x,y0,h,ph,amp,freq,tilt); x.clip();
  var g = x.createLinearGradient(0,(y0-0.03)*TS,0,(y0+h+0.03)*TS);
  g.addColorStop(0,   'rgba(8,0,2,1)');
  g.addColorStop(0.12,'rgba(58,2,6,1)');
  g.addColorStop(0.3, 'rgba(146,10,8,1)');
  g.addColorStop(0.43,'rgba(220,42,16,1)');
  g.addColorStop(0.49, hot || 'rgba(255,206,132,1)');
  g.addColorStop(0.56,'rgba(206,28,12,1)');
  g.addColorStop(0.72,'rgba(90,4,6,1)');
  g.addColorStop(0.88,'rgba(26,0,4,1)');
  g.addColorStop(1,   'rgba(5,0,2,1)');
  x.fillStyle = g; x.fillRect(0,0,TS,TS);
  x.restore();

  wavyStroke(x,y0+0.004,ph,amp,freq,tilt,'rgba(255,238,214,0.55)',0.005,0.004);
  wavyStroke(x,y0+h-0.006,ph+1.9,amp*0.62,freq*0.86,tilt,'rgba(40,220,200,0.42)',0.008,0.009);
  wavyStroke(x,y0+h+0.012,ph+1.9,amp*0.62,freq*0.86,tilt,'rgba(170,230,80,0.28)',0.006,0.008);
}
/* sink one side of the tile back into shadow so the mass reads as a fold, not a ribbon */
function shade(x,x0,x1,strength){
  x.save();
  var g = x.createLinearGradient(x0*TS,0,x1*TS,0);
  g.addColorStop(0,'rgba(0,0,0,0)');
  g.addColorStop(0.55,'rgba(0,0,0,'+(strength*0.7).toFixed(2)+')');
  g.addColorStop(1,'rgba(0,0,0,'+strength.toFixed(2)+')');
  x.fillStyle = g; x.fillRect(0,0,TS,TS);
  x.restore();
}

var ART = [
/* 0 \u2014 violet field with a dark torus punched through it */
function(x){
  fill(x, rad(x,0.5,0.48,0.82,[
    [0,'#020105'],[0.3,'#030106'],[0.37,'#1d0a48'],[0.46,'#4f2c94'],
    [0.54,'#38167e'],[0.66,'#22084e'],[0.86,'#0a0218'],[1,'#04010a']]));
  glow(x,0.3,0.24,0.4,'rgba(96,66,180,0.4)');
  glow(x,0.76,0.8,0.3,'rgba(52,18,110,0.35)');
},
/* 1 \u2014 white silk, magenta + orange flow */
function(x){
  fill(x,'#fbf9fb');
  band(x,spine(0.52,0.09,0.6,-0.18),'rgba(236,44,140,0.92)',0.19,0.055,2);
  band(x,spine(0.66,0.07,2.2,-0.14),'rgba(255,96,26,0.9)',0.16,0.05,2);
  band(x,spine(0.4,0.06,3.4,-0.1),'rgba(70,120,255,0.55)',0.09,0.05,1);
  band(x,spine(0.58,0.08,1.2,-0.16),'rgba(255,255,255,0.9)',0.05,0.03,2);
  band(x,spine(0.86,0.05,0.2,-0.05),'rgba(150,40,200,0.5)',0.1,0.06,1);
  glow(x,0.22,0.14,0.46,'rgba(255,255,255,0.85)');
},
/* 2 \u2014 deep blue, near-black in the far corner */
function(x){
  fill(x, lin(x,0.98,0,0.06,1,[
    [0,'#01020e'],[0.3,'#03082e'],[0.56,'#0820c4'],[0.76,'#1a4dff'],[0.95,'#7ea8ff'],[1,'#b6ccff']]));
  glow(x,0.2,0.86,0.3,'rgba(176,206,255,0.8)');
  glow(x,0.06,0.98,0.22,'rgba(226,120,220,0.55)');
  glow(x,0.92,0.06,0.44,'rgba(0,0,8,0.75)','source-over');
},
/* 3 \u2014 pale blue horizon crossed by a coral band */
function(x){
  fill(x, lin(x,0.08,0,0,1,[
    [0,'#9dbccd'],[0.14,'#5b87ad'],[0.26,'#245693'],[0.36,'#7793a8'],
    [0.45,'#e2523a'],[0.52,'#e07a5e'],[0.58,'#82aec8'],[0.68,'#2467a8'],
    [0.8,'#0e3970'],[0.92,'#081c40'],[1,'#051026']]));
  band(x,spine(0.42,0.02,1.0,0.03),'rgba(240,140,105,0.45)',0.05,0.03,1);
  band(x,spine(0.63,0.02,2.4,-0.03),'rgba(150,200,235,0.4)',0.05,0.03,1);
},
/* 4 \u2014 navy rising into violet-blue */
function(x){
  fill(x, lin(x,0.88,0.04,0.14,0.96,[
    [0,'#010103'],[0.34,'#030316'],[0.58,'#0d066a'],[0.78,'#2a10b8'],[0.93,'#5a38e0'],[1,'#8464f4']]));
  glow(x,0.14,0.92,0.3,'rgba(110,86,210,0.55)');
  glow(x,0.9,0.08,0.42,'rgba(0,0,4,0.75)','source-over');
},
/* 5 \u2014 nearly black, a dim red-brown smear */
function(x){
  fill(x,'#020104');
  band(x,spine(0.46,0.07,1.4,-0.1),'rgba(88,30,18,0.7)',0.24,0.13,2);
  band(x,spine(0.44,0.07,1.4,-0.1),'rgba(168,64,36,0.45)',0.08,0.07,1);
  glow(x,0.16,0.2,0.32,'rgba(20,30,64,0.35)');
  glow(x,0.9,0.88,0.22,'rgba(70,64,110,0.3)');
},
/* 6 \u2014 pale silk, lavender + amber flow */
function(x){
  fill(x,'#e3dcec');
  band(x,spine(0.42,0.1,2.6,0.16),'rgba(132,58,220,0.9)',0.18,0.055,2);
  band(x,spine(0.6,0.09,1.1,0.2),'rgba(240,104,20,0.92)',0.16,0.05,2);
  band(x,spine(0.5,0.09,2.0,0.18),'rgba(245,40,140,0.65)',0.1,0.045,1);
  band(x,spine(0.55,0.09,1.6,0.18),'rgba(255,255,255,0.8)',0.04,0.03,2);
  glow(x,0.82,0.94,0.36,'rgba(255,255,255,0.7)');
  glow(x,0.08,0.08,0.26,'rgba(60,40,110,0.4)','source-over');
},
/* 7 \u2014 amber corner, red chrome fold with cyan fringe */
function(x){
  fill(x,'#12030a');
  glow(x,0.02,0.04,0.42,'rgba(255,142,36,0.85)');
  glow(x,0.5,0.5,0.62,'rgba(178,26,14,0.8)');
  chrome(x,0.18,0.58,1.1,0.07,4.2,-0.1,'rgba(255,216,158,1)');
  shade(x,0.55,1.2,0.45);
  glow(x,0.94,0.94,0.3,'rgba(60,14,96,0.45)');
},
/* 8 \u2014 red chrome, cyan and lime fringes, purple shadow */
function(x){
  fill(x,'#040103');
  glow(x,0.4,0.46,0.5,'rgba(48,14,10,0.8)');
  chrome(x,0.3,0.44,2.4,0.06,4.8,0.1,'rgba(255,190,110,1)');
  shade(x,0.3,1.15,0.72);
  band(x,spine(0.9,0.05,0.4,0.1),'rgba(70,16,110,0.45)',0.12,0.08,1);
},
/* 9 \u2014 dark navy above, red chrome band below */
function(x){
  fill(x, lin(x,0.4,0,0.6,1,[[0,'#03040e'],[0.42,'#060a22'],[0.72,'#070412'],[1,'#030106']]));
  glow(x,0.28,0.14,0.42,'rgba(18,32,84,0.55)');
  chrome(x,0.6,0.3,0.9,0.05,3.8,-0.08,'rgba(255,198,120,1)');
  shade(x,0.3,1.1,0.8);
},
/* 10 \u2014 chrome fold above, blue-pink streaks over a pale plate */
function(x){
  fill(x,'#050208');
  chrome(x,0.02,0.34,2.0,0.045,4.4,-0.07,'rgba(255,206,132,1)');
  shade(x,0.45,1.1,0.7);
  x.save();
  x.beginPath(); x.moveTo(0,TS*0.72); x.lineTo(TS,TS*0.56); x.lineTo(TS,TS); x.lineTo(0,TS); x.closePath();
  x.clip();
  fill(x, lin(x,0,0.5,0.4,1,[[0,'#cfd6dc'],[0.6,'#e8eaee'],[1,'#f4f5f7']]));
  band(x,spine(0.7,0.03,1.0,-0.1),'rgba(245,44,96,0.8)',0.055,0.03,2);
  band(x,spine(0.76,0.03,1.6,-0.1),'rgba(30,146,245,0.75)',0.045,0.026,2);
  band(x,spine(0.82,0.03,2.2,-0.08),'rgba(245,130,54,0.5)',0.035,0.026,1);
  x.restore();
},
/* 11 \u2014 pale plate lit by streaks of pink light */
function(x){
  fill(x,'#08050a');
  var i;
  for (i=0;i<9;i++){
    var y0 = 0.06 + i*0.045, a = 0.8 - i*0.06;
    band(x,spine(y0,0.02,0.4+i*0.5,-0.2),
         'rgba('+(250-i*3)+','+(30+i*15)+','+(80+i*5)+','+a.toFixed(2)+')',0.032,0.018,2);
  }
  band(x,spine(0.28,0.02,1.2,-0.18),'rgba(255,120,72,0.55)',0.05,0.035,1);
  band(x,spine(0.14,0.02,2.4,-0.2),'rgba(120,190,255,0.4)',0.03,0.02,1);
  x.save();
  x.beginPath(); x.moveTo(0,TS*0.72); x.lineTo(TS,TS*0.4); x.lineTo(TS,TS); x.lineTo(0,TS); x.closePath();
  x.clip();
  fill(x, lin(x,0.1,0.4,0.6,1,[[0,'#c6c7cd'],[0.5,'#e2e2e6'],[1,'#f2f2f4']]));
  x.restore();
}
];

function roundRectPath(x,w,h,r){
  x.beginPath();
  x.moveTo(-w/2+r,-h/2);
  x.lineTo(w/2-r,-h/2); x.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);
  x.lineTo(w/2,h/2-r);  x.quadraticCurveTo(w/2,h/2,w/2-r,h/2);
  x.lineTo(-w/2+r,h/2); x.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);
  x.lineTo(-w/2,-h/2+r);x.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
  x.closePath();
}

function buildTextures(){
  var front = [], back = [];
  for (var i=0;i<ART.length;i++){
    var c = mkc(TS,TS), x = c.getContext('2d');
    ART[i](x);
    /* film grain */
    x.save();
    x.globalCompositeOperation = 'overlay';
    x.globalAlpha = 0.15;
    var p = x.createPattern(grainTile,'repeat');
    x.fillStyle = p; x.fillRect(0,0,TS,TS);
    x.restore();
    front.push(c);

    /* reverse side: darker and washed out */
    var d = mkc(TS,TS), y = d.getContext('2d');
    y.drawImage(c,0,0);
    y.globalCompositeOperation = 'saturation';
    y.fillStyle = 'rgba(128,128,128,0.2)'; y.fillRect(0,0,TS,TS);
    y.globalCompositeOperation = 'multiply';
    y.fillStyle = 'rgba(6,8,18,0.75)'; y.fillRect(0,0,TS,TS);
    back.push(d);
  }
  return { front: front, back: back };
}
var TEX = buildTextures();

/* ------------------------------------------------------------------ *
 * Ring geometry.  u / v span the ring plane; z points at the viewer.
 * ------------------------------------------------------------------ */
var ax = RING.axis * Math.PI/180, cf = RING.ratio, sf = Math.sqrt(1-cf*cf);
var U = [Math.cos(ax), Math.sin(ax), 0];
var V = [-Math.sin(ax)*cf, Math.cos(ax)*cf, sf];
var AXIS = [                                    /* U x V \u2014 the ring's own axis */
  U[1]*V[2]-U[2]*V[1],
  U[2]*V[0]-U[0]*V[2],
  U[0]*V[1]-U[1]*V[0]
];

/* ------------------------------------------------------------------ *
 * Canvas + layout
 * ------------------------------------------------------------------ */
var cv = document.getElementById('stage'), ctx = cv.getContext('2d');
var W = 0, H = 0, K = 1, OX = 0, OY = 0, headLayer = null, labelLayer = null;

function d2sx(x){ return OX + x*K; }
function d2sy(y){ return OY + y*K; }

/* draw text whose inked box matches a target: capHeight and (optional) width */
function fitText(x,str,font,weight,cap,cx,capTop,targetW,color,align){
  var probe = 100;
  x.font = weight+' '+probe+'px '+font;
  var m = x.measureText('H');
  var capUnit = (m.actualBoundingBoxAscent||71) / probe;
  var size = cap / capUnit;
  x.font = weight+' '+size+'px '+font;
  var mm = x.measureText(str);
  var inkW = (mm.actualBoundingBoxRight||mm.width) + (mm.actualBoundingBoxLeft||0);
  var sx = targetW ? targetW / inkW : 1;
  x.save();
  x.fillStyle = color;
  x.textBaseline = 'alphabetic';
  x.translate(cx, capTop + cap);
  x.scale(sx,1);
  x.textAlign = align || 'center';
  var left = (mm.actualBoundingBoxLeft||0);
  x.fillText(str, align === 'left' ? left : 0, 0);
  x.restore();
  return inkW*sx;
}

function buildHead(){
  headLayer = mkc(Math.max(1,W), Math.max(1,H));
  var x = headLayer.getContext('2d');
  for (var i=0;i<HEAD.length;i++){
    var h = HEAD[i];
    fitText(x, h.s, SANS, '700', CAP*K, d2sx(1481), d2sy(h.top), h.w*K, h.fill);
  }
}

function buildLabels(){
  labelLayer = mkc(Math.max(1,W), Math.max(1,H));
  var x = labelLayer.getContext('2d');
  var cap = SMALL*K, dim = '#b0b0b0', pad = 88*K;
  /* corner marks hug the viewport so the frame reads at any aspect */
  x.save();
  x.fillStyle = dim; x.textBaseline = 'alphabetic'; x.textAlign = 'left';
  var f = '400 ' + (cap/0.717) + 'px ' + SANS;
  x.font = f;
  if (x.letterSpacing !== undefined) x.letterSpacing = (0.03*cap)+'px';
  x.fillText('VOID BLUE   /   GRADIENT STRIPS   /   RED AURA', pad, pad + cap);
  x.fillText('2026', pad, H - pad);
  x.textAlign = 'right';
  x.fillText('GRAINIENT.SUPPLY', W - pad, H - pad);
  x.restore();

  /* the two notes flanking the headline sit with the ring */
  var pitch = 33*K;
  var L = ['(50+) Gradients','Backgrounds','Added,'];
  for (var i=0;i<L.length;i++)
    fitText(x, L[i], SANS, '500', cap, d2sx(344), d2sy(1148) + i*pitch, 0, '#ffffff', 'left');
  var Rt = ['Gradients &','AI-Generated','Backgrounds'];
  for (var j=0;j<Rt.length;j++)
    fitText(x, Rt[j], SANS, '500', cap, d2sx(2310), d2sy(932) + j*32.5*K, 0, '#ffffff', 'left');
}

function resize(){
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = Math.round(window.innerWidth * dpr);
  H = Math.round(window.innerHeight * dpr);
  cv.width = W; cv.height = H;
  var S = Math.min(W, H*DASP);           /* effective design width */
  K = S / DW;
  OX = (W - DW*K)/2;
  OY = (H - DH*K)/2;
  buildHead();
  buildLabels();
}

/* ------------------------------------------------------------------ *
 * Frame
 * ------------------------------------------------------------------ */
function project(p){
  var k = RING.a*K*RING.dist / (RING.dist - p[2]);
  return [ d2sx(RING.cx) + k*p[0], d2sy(RING.cy) + k*p[1], k ];
}

function drawTile(i, psi){
  var c = Math.cos(psi), s = Math.sin(psi);
  var C  = [c*U[0]+s*V[0], c*U[1]+s*V[1], c*U[2]+s*V[2]];      /* centre, |C| = 1 */
  var T  = [-s*U[0]+c*V[0], -s*U[1]+c*V[1], -s*U[2]+c*V[2]];   /* tangent          */
  var h  = RING.tile/(2*RING.a);                               /* half side, ring units */
  var p0 = project(C);
  var pT = project([C[0]+T[0]*h, C[1]+T[1]*h, C[2]+T[2]*h]);
  var pA = project([C[0]+AXIS[0]*h, C[1]+AXIS[1]*h, C[2]+AXIS[2]*h]);
  var ex = pT[0]-p0[0], ey = pT[1]-p0[1];
  var fx = pA[0]-p0[0], fy = pA[1]-p0[1];
  if (Math.abs(ex*fy - ey*fx) < 0.4) return;                   /* edge on */

  var facing = C[2] > 0;                                       /* radial normal ~ C */
  var img = (facing ? TEX.front : TEX.back)[i % TEX.front.length];
  ctx.save();
  ctx.setTransform(ex*2/TS, ey*2/TS, fx*2/TS, fy*2/TS, p0[0], p0[1]);
  roundRectPath(ctx, TS, TS, TS*RING.radius);
  ctx.clip();
  ctx.drawImage(img, -TS/2, -TS/2, TS, TS);
  ctx.restore();
  ctx.setTransform(1,0,0,1,0,0);
}

function render(t){
  ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,W,H);
  ctx.imageSmoothingQuality = 'high';

  var spin = (t/DUR)*Math.PI*2;
  var list = [], i;
  for (i=0;i<RING.n;i++){
    var psi = RING.phase*Math.PI/180 - i*2*Math.PI/RING.n + spin;
    var c = Math.cos(psi), s = Math.sin(psi);
    list.push({ i:i, psi:psi, z: c*U[2] + s*V[2] });
  }
  list.sort(function(a,b){ return a.z - b.z; });

  var drawnText = false;
  for (i=0;i<list.length;i++){
    if (!drawnText && list[i].z > 0){ ctx.drawImage(headLayer,0,0); drawnText = true; }
    drawTile(list[i].i, list[i].psi);
  }
  if (!drawnText) ctx.drawImage(headLayer,0,0);
  ctx.drawImage(labelLayer,0,0);
}

/* ------------------------------------------------------------------ *
 * Clock + public controls
 * ------------------------------------------------------------------ */
var t0 = performance.now(), tNow = 0, playing = true;

function frame(now){
  if (playing){
    tNow = ((now - t0)/1000) % DUR;
    render(tNow);
  }
  requestAnimationFrame(frame);
}

window.addEventListener('resize', function(){ resize(); render(tNow); });
resize();
requestAnimationFrame(frame);

window.__DUR = DUR;
window.__seek = function(t){
  tNow = ((t % DUR) + DUR) % DUR;
  playing = false;
  render(tNow);
};
window.__play = function(){ t0 = performance.now() - tNow*1000; playing = true; };
window.__pause = function(){ playing = false; };
window.__time = function(){ return tNow; };
})();
<\/script>
</body>
</html>
`;var Yd=`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Component Preview</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
    }
    body {
      height: 100%;
      overflow: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #000000;
      color: #ffffff;
    }
    .component-wrapper {
      width: 100%;
      height: 100%;
      padding: 0;
      box-sizing: border-box;
      overflow: auto;
    }
  </style>
</head>
<body>
  <div class="component-wrapper">
    <html lang="en"><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- Tailwind (CDN build is fine for quick paste) -->
  <script src="https://cdn.tailwindcss.com"><\/script>

  <!-- Optional font to match the original -->
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&amp;display=swap" rel="stylesheet">



  <style>
    /* ---------- Core styles that Tailwind can\u2019t express (pseudo-elements, keyframes, multi-shadows) ---------- */
    .btn-wrapper {
      position: relative;
      display: inline-block;
    }

    .btn {
      --border-radius: 24px;
      --padding: 4px;
      --transition: 0.4s;
      --button-color: #101010;
      --highlight-color-hue: 210deg;
      /* Change this hue to recolor the glow */

      user-select: none;
      display: flex;
      justify-content: center;

      background-color: var(--button-color);

      /* Complex layered shadows */
      box-shadow:
        inset 0px 1px 1px rgba(255, 255, 255, 0.2),
        inset 0px 2px 2px rgba(255, 255, 255, 0.15),
        inset 0px 4px 4px rgba(255, 255, 255, 0.1),
        inset 0px 8px 8px rgba(255, 255, 255, 0.05),
        inset 0px 16px 16px rgba(255, 255, 255, 0.05),
        0px -1px 1px rgba(0, 0, 0, 0.02),
        0px -2px 2px rgba(0, 0, 0, 0.03),
        0px -4px 4px rgba(0, 0, 0, 0.05),
        0px -8px 8px rgba(0, 0, 0, 0.06),
        0px -16px 16px rgba(0, 0, 0, 0.08);

      border: solid 1px #ffffff22;
      border-radius: var(--border-radius);
      cursor: pointer;

      transition:
        box-shadow var(--transition),
        border var(--transition),
        background-color var(--transition);
    }

    .btn::before {
      content: "";
      position: absolute;
      top: calc(0px - var(--padding));
      left: calc(0px - var(--padding));
      width: calc(100% + var(--padding) * 2);
      height: calc(100% + var(--padding) * 2);
      border-radius: calc(var(--border-radius) + var(--padding));
      pointer-events: none;
      background-image: linear-gradient(0deg, #0004, #000a);
      z-index: -1;
      transition:
        box-shadow var(--transition),
        filter var(--transition);
      box-shadow:
        0 -8px 8px -6px #0000 inset,
        0 -16px 16px -8px #00000000 inset,
        1px 1px 1px #fff2,
        2px 2px 2px #fff1,
        -1px -1px 1px #0002,
        -2px -2px 2px #0001;
    }

    .btn::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      pointer-events: none;
      background-image: linear-gradient(0deg,
          #fff,
          hsl(var(--highlight-color-hue), 100%, 70%),
          hsla(var(--highlight-color-hue), 100%, 70%, 50%),
          8%,
          transparent);
      background-position: 0 0;
      opacity: 0;
      transition: opacity var(--transition), filter var(--transition);
    }

    .btn-letter {
      position: relative;
      display: inline-block;
      color: #ffffff55;
      animation: letter-anim 2s ease-in-out infinite;
      transition: color var(--transition), text-shadow var(--transition), opacity var(--transition);
    }

    @keyframes letter-anim {
      50% {
        text-shadow: 0 0 3px #ffffff88;
        color: #fff;
      }
    }

    .btn-svg {
      flex-grow: 1;
      height: 24px;
      margin-right: 0.5rem;
      fill: #e8e8e8;
      animation: flicker 2s linear infinite;
      animation-delay: 0.5s;
      filter: drop-shadow(0 0 2px #ffffff99);
      transition: fill var(--transition), filter var(--transition), opacity var(--transition);
    }

    @keyframes flicker {
      50% {
        opacity: 0.3;
      }
    }

    .txt-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      min-width: 6.4em;
    }

    .txt-1,
    .txt-2 {
      position: absolute;
      word-spacing: -1em;
    }

    .txt-1 {
      animation: appear-anim 1s ease-in-out forwards;
    }

    .txt-2 {
      opacity: 0;
    }

    @keyframes appear-anim {
      0% {
        opacity: 0;
      }

      100% {
        opacity: 1;
      }
    }

    .btn:focus .txt-1,
    .btn:focus-visible .txt-1 {
      animation: opacity-anim 0.3s ease-in-out forwards;
      animation-delay: 1s;
    }

    .btn:focus .txt-2,
    .btn:focus-visible .txt-2 {
      animation: opacity-anim 0.3s ease-in-out reverse forwards;
      animation-delay: 1s;
    }

    @keyframes opacity-anim {
      0% {
        opacity: 1;
      }

      100% {
        opacity: 0;
      }
    }

    .btn:focus .btn-letter,
    .btn:focus-visible .btn-letter {
      animation:
        focused-letter-anim 1s ease-in-out forwards,
        letter-anim 1.2s ease-in-out infinite;
      animation-delay: 0s, 1s;
    }

    @keyframes focused-letter-anim {

      0%,
      100% {
        filter: blur(0px);
      }

      50% {
        transform: scale(2);
        filter: blur(10px) brightness(150%) drop-shadow(-36px 12px 12px hsl(var(--highlight-color-hue), 100%, 70%));
      }
    }

    .btn:focus .btn-svg,
    .btn:focus-visible .btn-svg {
      animation-duration: 1.2s;
      animation-delay: 0.2s;
    }

    .btn:focus::before,
    .btn:focus-visible::before {
      box-shadow:
        0 -8px 12px -6px #fff3 inset,
        0 -16px 16px -8px hsla(var(--highlight-color-hue), 100%, 70%, 20%) inset,
        1px 1px 1px #fff3,
        2px 2px 2px #fff1,
        -1px -1px 1px #0002,
        -2px -2px 2px #0001;
    }

    .btn:focus::after,
    .btn:focus-visible::after {
      opacity: 0.6;
      -webkit-mask-image: linear-gradient(0deg, #fff, transparent);
      mask-image: linear-gradient(0deg, #fff, transparent);
      filter: brightness(100%);
    }

    /* Staggered delays for each letter */
    .btn-letter:nth-child(1),
    .btn:focus .btn-letter:nth-child(1),
    .btn:focus-visible .btn-letter:nth-child(1) {
      animation-delay: 0s;
    }

    .btn-letter:nth-child(2),
    .btn:focus .btn-letter:nth-child(2),
    .btn:focus-visible .btn-letter:nth-child(2) {
      animation-delay: 0.08s;
    }

    .btn-letter:nth-child(3),
    .btn:focus .btn-letter:nth-child(3),
    .btn:focus-visible .btn-letter:nth-child(3) {
      animation-delay: 0.16s;
    }

    .btn-letter:nth-child(4),
    .btn:focus .btn-letter:nth-child(4),
    .btn:focus-visible .btn-letter:nth-child(4) {
      animation-delay: 0.24s;
    }

    .btn-letter:nth-child(5),
    .btn:focus .btn-letter:nth-child(5),
    .btn:focus-visible .btn-letter:nth-child(5) {
      animation-delay: 0.32s;
    }

    .btn-letter:nth-child(6),
    .btn:focus .btn-letter:nth-child(6),
    .btn:focus-visible .btn-letter:nth-child(6) {
      animation-delay: 0.40s;
    }

    .btn-letter:nth-child(7),
    .btn:focus .btn-letter:nth-child(7),
    .btn:focus-visible .btn-letter:nth-child(7) {
      animation-delay: 0.48s;
    }

    .btn-letter:nth-child(8),
    .btn:focus .btn-letter:nth-child(8),
    .btn:focus-visible .btn-letter:nth-child(8) {
      animation-delay: 0.56s;
    }

    .btn-letter:nth-child(9),
    .btn:focus .btn-letter:nth-child(9),
    .btn:focus-visible .btn-letter:nth-child(9) {
      animation-delay: 0.64s;
    }

    .btn-letter:nth-child(10),
    .btn:focus .btn-letter:nth-child(10),
    .btn:focus-visible .btn-letter:nth-child(10) {
      animation-delay: 0.72s;
    }

    .btn-letter:nth-child(11),
    .btn:focus .btn-letter:nth-child(11),
    .btn:focus-visible .btn-letter:nth-child(11) {
      animation-delay: 0.80s;
    }

    .btn-letter:nth-child(12),
    .btn:focus .btn-letter:nth-child(12),
    .btn:focus-visible .btn-letter:nth-child(12) {
      animation-delay: 0.88s;
    }

    .btn-letter:nth-child(13),
    .btn:focus .btn-letter:nth-child(13),
    .btn:focus-visible .btn-letter:nth-child(13) {
      animation-delay: 0.96s;
    }

    /* Active state */
    .btn:active {
      border: solid 1px hsla(var(--highlight-color-hue), 100%, 80%, 0.7);
      background-color: hsla(var(--highlight-color-hue), 50%, 20%, 0.5);
    }

    .btn:active::before {
      box-shadow:
        0 -8px 12px -6px #fffa inset,
        0 -16px 16px -8px hsla(var(--highlight-color-hue), 100%, 70%, 0.8) inset,
        1px 1px 1px #fff4,
        2px 2px 2px #fff2,
        -1px -1px 1px #0002,
        -2px -2px 2px #0001;
    }

    .btn:active::after {
      opacity: 1;
      -webkit-mask-image: linear-gradient(0deg, #fff, transparent);
      mask-image: linear-gradient(0deg, #fff, transparent);
      filter: brightness(200%);
    }

    .btn:active .btn-letter {
      text-shadow: 0 0 1px hsla(var(--highlight-color-hue), 100%, 90%, 0.9);
      animation: none;
    }

    /* Hover state */
    .btn:hover {
      border: solid 1px hsla(var(--highlight-color-hue), 100%, 80%, 0.4);
    }

    .btn:hover::before {
      box-shadow:
        0 -8px 8px -6px #fffa inset,
        0 -16px 16px -8px hsla(var(--highlight-color-hue), 100%, 70%, 0.3) inset,
        1px 1px 1px #fff2,
        2px 2px 2px #fff1,
        -1px -1px 1px #0002,
        -2px -2px 2px #0001;
    }

    .btn:hover::after {
      opacity: 1;
      -webkit-mask-image: linear-gradient(0deg, #fff, transparent);
      mask-image: linear-gradient(0deg, #fff, transparent);
    }

    .btn:hover .btn-svg {
      fill: #fff;
      filter:
        drop-shadow(0 0 3px hsl(var(--highlight-color-hue), 100%, 70%)) drop-shadow(0 -4px 6px #0009);
      animation: none;
    }
  </style>
</head>



<!-- Button -->
<body><div class="btn-wrapper">
  <button class="btn px-3 py-2 md:px-4 md:py-2 focus:outline-none" type="button" aria-label="Generate" title="Generate">
        <svg class="btn-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z">
          </path>
        </svg>

        <div class="txt-wrapper">
          <div class="txt-1">
            <span class="btn-letter">G</span>
            <span class="btn-letter">e</span>
            <span class="btn-letter">n</span>
            <span class="btn-letter">e</span>
            <span class="btn-letter">r</span>
            <span class="btn-letter">a</span>
            <span class="btn-letter">t</span>
            <span class="btn-letter">e</span>
          </div>
          <div class="txt-2">
            <span class="btn-letter">G</span>
            <span class="btn-letter">e</span>
            <span class="btn-letter">n</span>
            <span class="btn-letter">e</span>
            <span class="btn-letter">r</span>
            <span class="btn-letter">a</span>
            <span class="btn-letter">t</span>
            <span class="btn-letter">i</span>
            <span class="btn-letter">n</span>
            <span class="btn-letter">g</span>
          </div>
        </div>
      </button>
</div>





</body></html>
  </div>
  
    <script>
      (function() {
        function checkAndCenter() {
          // Use double requestAnimationFrame to ensure DOM is fully painted and layout is stable
          requestAnimationFrame(function() {
            requestAnimationFrame(function() {
              const wrapper = document.querySelector('.component-wrapper');
              if (!wrapper) return;
              
              // Get all child elements
              const children = Array.from(wrapper.children);
              if (children.length === 0) return;
              
              // Temporarily override wrapper styles to shrink-wrap for measurement
              // Set inline styles to shrink-wrap (inline styles override CSS)
              wrapper.style.display = 'inline-block';
              wrapper.style.width = 'auto';
              wrapper.style.height = 'auto';
              wrapper.style.overflow = 'visible';
              wrapper.style.boxSizing = 'content-box';
              
              // Force multiple reflows to ensure styles are fully applied
              void wrapper.offsetHeight;
              void wrapper.offsetWidth;
              void wrapper.offsetHeight;
              
              // Measure the wrapper's content size
              const contentWidth = wrapper.offsetWidth;
              const contentHeight = wrapper.offsetHeight;
              
              // Restore original styles by removing inline styles we added
              wrapper.style.removeProperty('display');
              wrapper.style.removeProperty('width');
              wrapper.style.removeProperty('height');
              wrapper.style.removeProperty('overflow');
              wrapper.style.removeProperty('box-sizing');
              
              // If content is less than 500x500, center it
              if (contentWidth > 0 && contentHeight > 0 && contentWidth < 500 && contentHeight < 500) {
                wrapper.style.display = 'flex';
                wrapper.style.alignItems = 'center';
                wrapper.style.justifyContent = 'center';
              }
            });
          });
        }
        
        // Check immediately and after delays to ensure content is rendered and styled
        function runChecks() {
          checkAndCenter();
          setTimeout(checkAndCenter, 50);
          setTimeout(checkAndCenter, 150);
          setTimeout(checkAndCenter, 300);
          setTimeout(checkAndCenter, 500);
          setTimeout(checkAndCenter, 1000);
        }
        
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', runChecks);
        } else {
          runChecks();
        }
        
        // Also check when images or other resources load
        window.addEventListener('load', () => {
          setTimeout(checkAndCenter, 100);
          setTimeout(checkAndCenter, 300);
        });
        
        // Use ResizeObserver to detect size changes
        if (window.ResizeObserver) {
          setTimeout(() => {
            const wrapper = document.querySelector('.component-wrapper');
            if (wrapper) {
              const observer = new ResizeObserver(() => {
                setTimeout(checkAndCenter, 50);
              });
              observer.observe(wrapper);
            }
          }, 500);
        }
      })();
    <\/script>
  
</body>
</html>
`;var Xd=`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Component Preview</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
    }
    body {
      height: 100%;
      overflow: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #000000;
      color: #ffffff;
    }
    .component-wrapper {
      width: 100%;
      height: 100%;
      padding: 0;
      box-sizing: border-box;
      overflow: auto;
    }
  </style>
</head>
<body>
  <div class="component-wrapper">
    <html><head></head><body><a href="#" class="group isolate inline-flex cursor-pointer overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_8px_rgba(129,140,248,0.35)] rounded-full relative shadow-[0_8px_40px_rgba(129,140,248,0.25)]" style="--spread: 90deg; --shimmer-color: rgba(255,255,255,0.6); --radius: 9999px; --speed: 4s; --cut: 1px; --bg: rgba(255, 255, 255, 0.05);" data-element-locator="html &gt; body:nth-of-type(1) &gt; section:nth-of-type(1) &gt; div:nth-of-type(1) &gt; div:nth-of-type(1) &gt; div:nth-of-type(1) &gt; a:nth-of-type(1)">
  <div class="absolute inset-0">
    <div class="absolute inset-[-200%] w-[400%] h-[400%] [animation:rotate-gradient_var(--speed)_linear_infinite]">
      <div class="absolute inset-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))]">
      </div>
    </div>
  </div>
  <div class="absolute rounded-full [background:var(--bg)] [inset:var(--cut)] backdrop-blur"></div>
  <div class="z-10 flex gap-3 sm:w-auto overflow-hidden text-base font-medium text-white w-full pt-3 pr-4 pb-3 pl-4 relative gap-x-3 gap-y-3 items-center" style="border-radius: 9999px;" data-element-locator="html &gt; body:nth-of-type(1) &gt; section:nth-of-type(1) &gt; div:nth-of-type(1) &gt; div:nth-of-type(1) &gt; div:nth-of-type(1) &gt; a:nth-of-type(1) &gt; div:nth-of-type(3)">
    <div style="position: absolute; content: ' '; display: block; width: 200%; height: 200%; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2), transparent); animation: borderBeamRotation 4s infinite linear; top: 50%; left: 50%; transform: translate(-50%, -50%);" class=""></div>
    <div style="position: absolute; inset: 1px; background: rgba(10, 11, 20, 0.8); border-radius: 9999px; backdrop-filter: blur(8px);" class="" data-element-locator="html &gt; body:nth-of-type(1) &gt; section:nth-of-type(1) &gt; div:nth-of-type(1) &gt; div:nth-of-type(1) &gt; div:nth-of-type(1) &gt; a:nth-of-type(1) &gt; div:nth-of-type(3) &gt; div:nth-of-type(2)">
    </div>
    <img src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/3f6038cb-af1c-4483-97bc-dd58d89c36ef_320w.jpg" alt="Advisor headshot" class="ring-2 ring-white/10 z-10 w-8 h-8 object-cover rounded-full relative">
    <span class="whitespace-nowrap relative z-10 font-sans">
                  Generate My Site
                </span>
    <span class="inline-flex items-center justify-center z-10 bg-white/10 w-7 h-7 rounded-full ml-1 relative" data-element-locator="html &gt; body:nth-of-type(1) &gt; section:nth-of-type(1) &gt; div:nth-of-type(1) &gt; div:nth-of-type(1) &gt; div:nth-of-type(1) &gt; a:nth-of-type(1) &gt; div:nth-of-type(3) &gt; span:nth-of-type(2)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" data-lucide="wand-sparkles" class="lucide lucide-wand-sparkles lucide-arrow-right w-[24px] h-[16px]" data-icon-replaced="true" style="width: 24px; height: 16px; color: rgb(255, 255, 255);"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72" class=""></path><path d="m14 7 3 3" class=""></path><path d="M5 6v4" class=""></path><path d="M19 14v4" class=""></path><path d="M10 2v2" class=""></path><path d="M7 8H3" class=""></path><path d="M21 16h-4" class=""></path><path d="M11 3H9" class=""></path></svg>
                </span>
    <style>
      @keyframes borderBeamRotation {
        0% {
          transform: translate(-50%, -50%) rotate(0deg);
        }

        100% {
          transform: translate(-50%, -50%) rotate(360deg);
        }
      }
    </style>
  </div>
</a></body></html>
  </div>
  
    <script>
      (function() {
        function checkAndCenter() {
          // Use double requestAnimationFrame to ensure DOM is fully painted and layout is stable
          requestAnimationFrame(function() {
            requestAnimationFrame(function() {
              const wrapper = document.querySelector('.component-wrapper');
              if (!wrapper) return;
              
              // Get all child elements
              const children = Array.from(wrapper.children);
              if (children.length === 0) return;
              
              // Temporarily override wrapper styles to shrink-wrap for measurement
              // Set inline styles to shrink-wrap (inline styles override CSS)
              wrapper.style.display = 'inline-block';
              wrapper.style.width = 'auto';
              wrapper.style.height = 'auto';
              wrapper.style.overflow = 'visible';
              wrapper.style.boxSizing = 'content-box';
              
              // Force multiple reflows to ensure styles are fully applied
              void wrapper.offsetHeight;
              void wrapper.offsetWidth;
              void wrapper.offsetHeight;
              
              // Measure the wrapper's content size
              const contentWidth = wrapper.offsetWidth;
              const contentHeight = wrapper.offsetHeight;
              
              // Restore original styles by removing inline styles we added
              wrapper.style.removeProperty('display');
              wrapper.style.removeProperty('width');
              wrapper.style.removeProperty('height');
              wrapper.style.removeProperty('overflow');
              wrapper.style.removeProperty('box-sizing');
              
              // If content is less than 500x500, center it
              if (contentWidth > 0 && contentHeight > 0 && contentWidth < 500 && contentHeight < 500) {
                wrapper.style.display = 'flex';
                wrapper.style.alignItems = 'center';
                wrapper.style.justifyContent = 'center';
              }
            });
          });
        }
        
        // Check immediately and after delays to ensure content is rendered and styled
        function runChecks() {
          checkAndCenter();
          setTimeout(checkAndCenter, 50);
          setTimeout(checkAndCenter, 150);
          setTimeout(checkAndCenter, 300);
          setTimeout(checkAndCenter, 500);
          setTimeout(checkAndCenter, 1000);
        }
        
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', runChecks);
        } else {
          runChecks();
        }
        
        // Also check when images or other resources load
        window.addEventListener('load', () => {
          setTimeout(checkAndCenter, 100);
          setTimeout(checkAndCenter, 300);
        });
        
        // Use ResizeObserver to detect size changes
        if (window.ResizeObserver) {
          setTimeout(() => {
            const wrapper = document.querySelector('.component-wrapper');
            if (wrapper) {
              const observer = new ResizeObserver(() => {
                setTimeout(checkAndCenter, 50);
              });
              observer.observe(wrapper);
            }
          }, 500);
        }
      })();
    <\/script>
  
</body>
</html>
`;var Qd=`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Component Preview</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
    }
    body {
      height: 100%;
      overflow: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #000000;
      color: #ffffff;
    }
    .component-wrapper {
      width: 100%;
      height: 100%;
      padding: 0;
      box-sizing: border-box;
      overflow: auto;
    }
  </style>
</head>
<body>
  <div class="component-wrapper">
    <html><head></head><body><button class="group flex overflow-hidden uppercase transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_40px_-10px_rgba(234,88,12,0.5)] focus:outline-none text-sm font-medium text-white tracking-widest font-geist rounded-full pt-5 pr-12 pb-5 pl-12 relative items-center justify-center">
    <style>
        @keyframes beam-spin { to { transform: rotate(360deg); } }
        @keyframes dots-move { 
            0% { background-position: 0 0; } 
            100% { background-position: 24px 24px; } 
        }
    </style>
    
    <!-- Full Border Beam (Single Beam) -->
    <div class="absolute inset-0 -z-20 rounded-full overflow-hidden p-[1px]">
        <div class="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_0_300deg,#ea580c_360deg)]" style="animation: beam-spin 3s linear infinite;"></div>
        <div class="absolute inset-[1px] rounded-full bg-black"></div>
    </div>

    <!-- Inner Background & Effects -->
    <div class="-z-10 overflow-hidden bg-zinc-950 rounded-full absolute top-[2px] right-[2px] bottom-[2px] left-[2px]">
        <!-- Light Monotone Gradient Background -->
        <div class="absolute inset-0 bg-gradient-to-b from-zinc-800/60 to-transparent"></div>
        
        <!-- Animated Dots Pattern -->
        <div class="opacity-30 mix-blend-overlay absolute top-0 right-0 bottom-0 left-0" style="background-image: radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px); background-size: 12px 12px; animation: dots-move 8s linear infinite"></div>
        
        <!-- Orange Glow on Hover -->
        <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-1/2 bg-orange-500/10 blur-2xl rounded-full pointer-events-none transition-colors duration-500 group-hover:bg-orange-500/30"></div>
    </div>

    <!-- Content -->
    <span class="relative z-10 text-white/90 transition-colors group-hover:text-white">Start Building</span>
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right relative z-10 ml-2 transition-transform duration-300 group-hover:translate-x-1"><path d="M5 12h14" class=""></path><path d="m12 5 7 7-7 7" class=""></path></svg>
</button></body></html>
  </div>
  
    <script>
      (function() {
        function checkAndCenter() {
          // Use double requestAnimationFrame to ensure DOM is fully painted and layout is stable
          requestAnimationFrame(function() {
            requestAnimationFrame(function() {
              const wrapper = document.querySelector('.component-wrapper');
              if (!wrapper) return;
              
              // Get all child elements
              const children = Array.from(wrapper.children);
              if (children.length === 0) return;
              
              // Temporarily override wrapper styles to shrink-wrap for measurement
              // Set inline styles to shrink-wrap (inline styles override CSS)
              wrapper.style.display = 'inline-block';
              wrapper.style.width = 'auto';
              wrapper.style.height = 'auto';
              wrapper.style.overflow = 'visible';
              wrapper.style.boxSizing = 'content-box';
              
              // Force multiple reflows to ensure styles are fully applied
              void wrapper.offsetHeight;
              void wrapper.offsetWidth;
              void wrapper.offsetHeight;
              
              // Measure the wrapper's content size
              const contentWidth = wrapper.offsetWidth;
              const contentHeight = wrapper.offsetHeight;
              
              // Restore original styles by removing inline styles we added
              wrapper.style.removeProperty('display');
              wrapper.style.removeProperty('width');
              wrapper.style.removeProperty('height');
              wrapper.style.removeProperty('overflow');
              wrapper.style.removeProperty('box-sizing');
              
              // If content is less than 500x500, center it
              if (contentWidth > 0 && contentHeight > 0 && contentWidth < 500 && contentHeight < 500) {
                wrapper.style.display = 'flex';
                wrapper.style.alignItems = 'center';
                wrapper.style.justifyContent = 'center';
              }
            });
          });
        }
        
        // Check immediately and after delays to ensure content is rendered and styled
        function runChecks() {
          checkAndCenter();
          setTimeout(checkAndCenter, 50);
          setTimeout(checkAndCenter, 150);
          setTimeout(checkAndCenter, 300);
          setTimeout(checkAndCenter, 500);
          setTimeout(checkAndCenter, 1000);
        }
        
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', runChecks);
        } else {
          runChecks();
        }
        
        // Also check when images or other resources load
        window.addEventListener('load', () => {
          setTimeout(checkAndCenter, 100);
          setTimeout(checkAndCenter, 300);
        });
        
        // Use ResizeObserver to detect size changes
        if (window.ResizeObserver) {
          setTimeout(() => {
            const wrapper = document.querySelector('.component-wrapper');
            if (wrapper) {
              const observer = new ResizeObserver(() => {
                setTimeout(checkAndCenter, 50);
              });
              observer.observe(wrapper);
            }
          }, 500);
        }
      })();
    <\/script>
  
</body>
</html>
`;var Kd=`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Component Preview</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
    }
    body {
      height: 100%;
      overflow: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #ffffff;
      color: #000000;
    }
    .component-wrapper {
      width: 100%;
      height: 100%;
      padding: 0;
      box-sizing: border-box;
      overflow: auto;
    }
  </style>
</head>
<body>
  <div class="component-wrapper">
    <html><head></head><body><button class="group shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 overflow-hidden font-medium text-orange-900 bg-gradient-to-r from-[#FFEBB1] to-[#FFC438] rounded-xl pt-4 pr-8 pb-4 pl-8 relative shadow-lg" style="box-shadow:0 15px 33px -12px rgba(255,162,42,0.9), inset 0 4px 6.3px rgba(252,220,134,1), inset 0 -5px 6.3px rgba(255,162,38,1); border-radius:9999px">
                        <div class="group-hover:translate-y-0 transition-transform duration-300 bg-white/20 absolute top-0 right-0 bottom-0 left-0 translate-y-full"></div>
                        <span class="relative flex items-center gap-2">
                            Start Free Pilot
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" data-lucide="send" class="lucide lucide-send w-4 h-4"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" class=""></path><path d="m21.854 2.147-10.94 10.939" class=""></path></svg>
                        </span>
                    </button></body></html>
  </div>
  
    <script>
      (function() {
        function checkAndCenter() {
          // Use double requestAnimationFrame to ensure DOM is fully painted and layout is stable
          requestAnimationFrame(function() {
            requestAnimationFrame(function() {
              const wrapper = document.querySelector('.component-wrapper');
              if (!wrapper) return;
              
              // Get all child elements
              const children = Array.from(wrapper.children);
              if (children.length === 0) return;
              
              // Temporarily override wrapper styles to shrink-wrap for measurement
              // Set inline styles to shrink-wrap (inline styles override CSS)
              wrapper.style.display = 'inline-block';
              wrapper.style.width = 'auto';
              wrapper.style.height = 'auto';
              wrapper.style.overflow = 'visible';
              wrapper.style.boxSizing = 'content-box';
              
              // Force multiple reflows to ensure styles are fully applied
              void wrapper.offsetHeight;
              void wrapper.offsetWidth;
              void wrapper.offsetHeight;
              
              // Measure the wrapper's content size
              const contentWidth = wrapper.offsetWidth;
              const contentHeight = wrapper.offsetHeight;
              
              // Restore original styles by removing inline styles we added
              wrapper.style.removeProperty('display');
              wrapper.style.removeProperty('width');
              wrapper.style.removeProperty('height');
              wrapper.style.removeProperty('overflow');
              wrapper.style.removeProperty('box-sizing');
              
              // If content is less than 500x500, center it
              if (contentWidth > 0 && contentHeight > 0 && contentWidth < 500 && contentHeight < 500) {
                wrapper.style.display = 'flex';
                wrapper.style.alignItems = 'center';
                wrapper.style.justifyContent = 'center';
              }
            });
          });
        }
        
        // Check immediately and after delays to ensure content is rendered and styled
        function runChecks() {
          checkAndCenter();
          setTimeout(checkAndCenter, 50);
          setTimeout(checkAndCenter, 150);
          setTimeout(checkAndCenter, 300);
          setTimeout(checkAndCenter, 500);
          setTimeout(checkAndCenter, 1000);
        }
        
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', runChecks);
        } else {
          runChecks();
        }
        
        // Also check when images or other resources load
        window.addEventListener('load', () => {
          setTimeout(checkAndCenter, 100);
          setTimeout(checkAndCenter, 300);
        });
        
        // Use ResizeObserver to detect size changes
        if (window.ResizeObserver) {
          setTimeout(() => {
            const wrapper = document.querySelector('.component-wrapper');
            if (wrapper) {
              const observer = new ResizeObserver(() => {
                setTimeout(checkAndCenter, 50);
              });
              observer.observe(wrapper);
            }
          }, 500);
        }
      })();
    <\/script>
  
</body>
</html>
`;var Zd=`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Component Preview</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
    }
    body {
      height: 100%;
      overflow: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #ffffff;
      color: #000000;
    }
    .component-wrapper {
      width: 100%;
      height: 100%;
      padding: 0;
      box-sizing: border-box;
      overflow: auto;
    }
  </style>
</head>
<body>
  <div class="component-wrapper">
    <html><head></head><body><button class="hover:bg-slate-50 hover:text-slate- transition-all flex text-sm font-medium text-slate-600 bg-gradient-to-b from-black/10 via-black/20 to-black/10 rounded-full pt-3 pr-6 pb-3 pl-6 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] gap-x-2 gap-y-2 items-center" style="box-shadow: 0 18px 35px rgba(31, 41, 55, 0.25), 0 0 0 1px rgba(209, 213, 219, 0.3);                  color: #e5e7eb; position: relative; --border-gradient: linear-gradient(180deg, rgba(255, 255, 255, 0.8), rgba(0, 0, 0, 0.4), rgba(255, 255, 255, 0.8)); --border-radius-before: 9999px">

  <span class="text-sm font-medium text-black/60 tracking-tight">
    Demo Lesson
  </span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-[16px] h-[16px]" data-lucide="arrow-right" data-icon-set="lucide" data-icon-replaced="true" style="color: rgb(229, 231, 235); width: 16px; height: 16px;"><path d="M5 12h14" class=""></path><path d="m12 5 7 7-7 7"></path></svg>
  <style id="border-gradient-shared-style">
  [style*="--border-gradient"]::before {
    content: "";
    position: absolute;
    inset: 0;
    padding: 1px;
    border-radius: var(--border-radius-before, inherit);
    -webkit-mask: linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    background: var(--border-gradient);
    pointer-events: none;
  }</style>
</button></body></html>
  </div>
  
    <script>
      (function() {
        function checkAndCenter() {
          // Use double requestAnimationFrame to ensure DOM is fully painted and layout is stable
          requestAnimationFrame(function() {
            requestAnimationFrame(function() {
              const wrapper = document.querySelector('.component-wrapper');
              if (!wrapper) return;
              
              // Get all child elements
              const children = Array.from(wrapper.children);
              if (children.length === 0) return;
              
              // Temporarily override wrapper styles to shrink-wrap for measurement
              // Set inline styles to shrink-wrap (inline styles override CSS)
              wrapper.style.display = 'inline-block';
              wrapper.style.width = 'auto';
              wrapper.style.height = 'auto';
              wrapper.style.overflow = 'visible';
              wrapper.style.boxSizing = 'content-box';
              
              // Force multiple reflows to ensure styles are fully applied
              void wrapper.offsetHeight;
              void wrapper.offsetWidth;
              void wrapper.offsetHeight;
              
              // Measure the wrapper's content size
              const contentWidth = wrapper.offsetWidth;
              const contentHeight = wrapper.offsetHeight;
              
              // Restore original styles by removing inline styles we added
              wrapper.style.removeProperty('display');
              wrapper.style.removeProperty('width');
              wrapper.style.removeProperty('height');
              wrapper.style.removeProperty('overflow');
              wrapper.style.removeProperty('box-sizing');
              
              // If content is less than 500x500, center it
              if (contentWidth > 0 && contentHeight > 0 && contentWidth < 500 && contentHeight < 500) {
                wrapper.style.display = 'flex';
                wrapper.style.alignItems = 'center';
                wrapper.style.justifyContent = 'center';
              }
            });
          });
        }
        
        // Check immediately and after delays to ensure content is rendered and styled
        function runChecks() {
          checkAndCenter();
          setTimeout(checkAndCenter, 50);
          setTimeout(checkAndCenter, 150);
          setTimeout(checkAndCenter, 300);
          setTimeout(checkAndCenter, 500);
          setTimeout(checkAndCenter, 1000);
        }
        
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', runChecks);
        } else {
          runChecks();
        }
        
        // Also check when images or other resources load
        window.addEventListener('load', () => {
          setTimeout(checkAndCenter, 100);
          setTimeout(checkAndCenter, 300);
        });
        
        // Use ResizeObserver to detect size changes
        if (window.ResizeObserver) {
          setTimeout(() => {
            const wrapper = document.querySelector('.component-wrapper');
            if (wrapper) {
              const observer = new ResizeObserver(() => {
                setTimeout(checkAndCenter, 50);
              });
              observer.observe(wrapper);
            }
          }, 500);
        }
      })();
    <\/script>
  
</body>
</html>
`;var Jd=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ignition Button</title>
<script src="https://cdn.tailwindcss.com"><\/script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"><\/script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"><\/script>
<script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"><\/script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
</head>
<body class="h-screen w-screen flex items-center justify-center overflow-hidden text-stone-800 bg-[#f4f1ea] selection:bg-[#d43d17] selection:text-white" style="font-family: 'Inter', sans-serif;">

  <!-- Ambient WebGL Background -->
  <canvas id="bg-gl" class="absolute inset-0 w-full h-full -z-10 block pointer-events-none" aria-hidden="true"></canvas>

  <main class="relative z-10 flex flex-col items-center text-center w-full max-w-md px-6">
    
    <!-- Company Header -->
    <div class="mb-16 overflow-hidden">
      <div class="reveal-element text-sm font-normal tracking-tight text-stone-700 opacity-0 translate-y-full">
        AETHER SYSTEMS
      </div>
    </div>

    <!-- Component Area -->
    <div class="mb-8 stagger-word text-xs font-mono tracking-[0.3em] uppercase text-[#d43d17] font-normal">
      SYS 07 / IGNITE
    </div>

    <div class="intro-wrapper opacity-0 scale-[0.55] blur-[8px]">
      <button id="btn" type="button" class="group relative block w-[264px] h-[78px] border-0 p-[7px] rounded-[24px] cursor-pointer outline-none transition-all duration-300 ease-[cubic-bezier(.34,1.4,.5,1)] hover:-translate-y-[2px] active:translate-y-[1px] active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-[#d43d17] focus-visible:outline-offset-[5px] bg-[linear-gradient(180deg,#3c3f46_0%,#15171b_55%,#2a2d33_100%)] shadow-[0_26px_52px_rgba(15,12,10,.35),0_3px_10px_rgba(0,0,0,.35),inset_0_1px_0_rgba(255,255,255,.14)] hover:shadow-[0_32px_64px_rgba(160,60,12,.3),0_4px_12px_rgba(0,0,0,.4),inset_0_1px_0_rgba(255,255,255,.16)]">
        <span class="relative block w-full h-full rounded-[17px] overflow-hidden bg-[#06050a] flex items-center justify-center shadow-[inset_0_2px_8px_rgba(0,0,0,.9)]">
          <canvas id="gl" class="absolute inset-0 w-full h-full block" aria-hidden="true"></canvas>
          <span class="relative z-10 pointer-events-none font-medium text-sm tracking-[0.34em] indent-[0.34em] text-[#fdf6ee]" style="text-shadow: 0 0 14px rgba(255, 170, 100, .55), 0 1px 6px rgba(0, 0, 0, .9);">LAUNCH</span>
        </span>
      </button>
    </div>

    <div class="mt-8 stagger-word text-xs text-stone-500 tracking-wide font-light leading-relaxed max-w-[280px]">
      Hover to prime the core accelerator, click to execute initialization.
    </div>

  </main>

  <script>
    // --- GSAP Animations ---
    gsap.registerPlugin(ScrollTrigger);

    // Prepare text for masked staggered reveal
    document.querySelectorAll('.stagger-word').forEach(el => {
      const words = el.innerText.trim().split(' ');
      el.innerHTML = words.map(w => \`<span class="inline-block overflow-hidden align-top"><span class="reveal-word inline-block translate-y-full opacity-0">\${w}&nbsp;</span></span>\`).join('');
    });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    // Header reveal
    tl.to(".reveal-element", {
      y: "0%",
      opacity: 1,
      duration: 1,
      ease: "expo.out"
    }, "+=0.2");

    // Masked staggered word reveal
    tl.to(".reveal-word", {
      y: "0%",
      opacity: 1,
      duration: 0.8,
      stagger: 0.04,
      ease: "power4.out"
    }, "-=0.6");

    // Intro Button Sequence
    tl.to(".intro-wrapper", {
      scale: 1.05,
      opacity: 1,
      duration: 0.8,
      ease: "back.out(1.5)",
      onUpdate: function() {
        let progress = this.progress();
        let blurAmount = Math.max(0, 8 * (1 - progress * 1.5));
        gsap.set(".intro-wrapper", { filter: \`blur(\${blurAmount}px)\` });
      }
    }, "-=0.8");

    tl.to(".intro-wrapper", {
      scale: 1,
      duration: 0.4,
      ease: "power2.out"
    });

    // Subtle Ambient Parallax
    document.addEventListener("mousemove", (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 12;
      const y = (e.clientY / window.innerHeight - 0.5) * 12;
      gsap.to(".intro-wrapper", {
        x: x,
        y: y,
        duration: 2,
        ease: "power2.out"
      });
    });


    // --- Ambient Background WebGL ---
    (function() {
      var canvas = document.getElementById('bg-gl');
      var gl = canvas.getContext('webgl');
      if (!gl) return;

      var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
      var FS = \`
        precision highp float;
        uniform vec2 u_res;
        uniform float u_time;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
        float noise(vec2 p){
          vec2 i=floor(p), f=fract(p);
          vec2 u=f*f*(3.0-2.0*f);
          return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),
                     mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);
        }
        void main(){
          vec2 uv = gl_FragCoord.xy / u_res;
          float n = noise(uv * 2.5 + vec2(u_time * 0.015, u_time * 0.025));
          n += noise(uv * 5.0 - vec2(u_time * 0.01, u_time * 0.02)) * 0.5;
          // Soft ambient cream tones
          vec3 col1 = vec3(0.957, 0.945, 0.918);
          vec3 col2 = vec3(0.925, 0.910, 0.880);
          vec3 finalCol = mix(col1, col2, n * 0.6 + 0.2);
          gl_FragColor = vec4(finalCol, 1.0);
        }
      \`;

      function compile(type, src) {
        var s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
      }
      var prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      gl.useProgram(prog);

      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var locP = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(locP);
      gl.vertexAttribPointer(locP, 2, gl.FLOAT, false, 0, 0);

      var uRes = gl.getUniformLocation(prog, 'u_res');
      var uTime = gl.getUniformLocation(prog, 'u_time');

      function resize() {
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var w = window.innerWidth * dpr;
        var h = window.innerHeight * dpr;
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
          gl.viewport(0, 0, w, h);
        }
      }
      window.addEventListener('resize', resize);
      resize();

      function frame(now) {
        resize();
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform1f(uTime, now / 1000);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    })();


    // --- Portal Button WebGL ---
    (function () {
      var btn = document.getElementById('btn');
      var canvas = document.getElementById('gl');
      var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var gl = canvas.getContext('webgl');
      if (!gl) { document.body.classList.add('nogl'); return; }

      var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
      var FS = [
        'precision highp float;',
        'uniform vec2 u_res;',
        'uniform float u_time;',
        'uniform float u_warp;',
        'uniform float u_flash;',
        'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}',
        'float noise(vec2 p){',
        '  vec2 i=floor(p), f=fract(p);',
        '  vec2 u=f*f*(3.0-2.0*f);',
        '  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),',
        '             mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);',
        '}',
        'float fbm(vec2 p){',
        '  float v=0.0; float a=0.5;',
        '  for(int i=0;i<4;i++){ v+=a*noise(p); p=p*2.07+vec2(13.1,5.7); a*=0.5; }',
        '  return v;',
        '}',
        'void main(){',
        '  vec2 sc = gl_FragCoord.xy / u_res;',
        '  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;',
        '  float r = length(uv);',
        '  float rr = max(r, 0.08);',
        '  float a = atan(uv.y, uv.x);',
        '  float t = u_time;',
        '  vec3 col = vec3(0.012, 0.011, 0.014);',
        '  float hz = fbm(uv * 2.6 + vec2(t * 0.35, 1.7));',
        '  col += vec3(0.13, 0.06, 0.032) * hz * (0.7 + 0.6 * u_warp);',
        '  for (int i = 0; i < 3; i++) {',
        '    float fi = float(i);',
        '    float ringN = 26.0 + fi * 9.0;',
        '    vec2 sp = vec2((a / 6.28318 + 0.5) * ringN,',
        '                   (0.3 + fi * 0.22) / rr + t * (2.0 + fi * 1.2));',
        '    vec2 cell = floor(sp);',
        '    vec2 f = fract(sp);',
        '    float h = hash(cell + fi * 17.31);',
        '    float on = step(0.68, h);',
        '    vec2 c = vec2(0.2 + 0.6 * hash(cell + 4.7), 0.5);',
        '    vec2 dlt = f - c;',
        '    float sy = mix(130.0, 8.0, u_warp);',
        '    float star = on * exp(-(dlt.x * dlt.x * 150.0 + dlt.y * dlt.y * sy));',
        '    float tw = 0.7 + 0.3 * sin(h * 81.0 + t * 9.0);',
        '    tw = mix(tw, 1.0, u_warp);',
        '    vec3 sCol = mix(vec3(1.0, 0.94, 0.85), vec3(1.0, 0.6, 0.33), step(0.9, h));',
        '    float fade = smoothstep(0.02, 0.25, r);',
        '    col += sCol * star * tw * fade * (1.1 + 0.7 * u_warp);',
        '  }',
        '  col += vec3(1.0, 0.8, 0.58) * u_warp * 0.32 * exp(-r * 4.0);',
        '  vec2 e = sc * (1.0 - sc);',
        '  col *= 0.3 + 0.7 * pow(e.x * e.y * 16.0, 0.3);',
        '  col = mix(col, vec3(1.0, 0.97, 0.92), clamp(u_flash, 0.0, 1.0));',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
      ].join('\\n');

      function compile(type, src) {
        var s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          console.error('shader compile failed:', gl.getShaderInfoLog(s));
        }
        return s;
      }
      var prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      gl.useProgram(prog);

      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var locP = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(locP);
      gl.vertexAttribPointer(locP, 2, gl.FLOAT, false, 0, 0);

      var uRes = gl.getUniformLocation(prog, 'u_res');
      var uTime = gl.getUniformLocation(prog, 'u_time');
      var uWarp = gl.getUniformLocation(prog, 'u_warp');
      var uFlash = gl.getUniformLocation(prog, 'u_flash');

      function resize() {
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var w = Math.max(1, Math.round(canvas.clientWidth * dpr));
        var h = Math.max(1, Math.round(canvas.clientHeight * dpr));
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
          gl.viewport(0, 0, w, h);
        }
      }
      window.addEventListener('resize', resize);
      resize();

      var warp = 0, warpTarget = 0, flash = 0, z = 0;
      var last = performance.now();

      btn.addEventListener('mouseenter', function () { warpTarget = 1; });
      btn.addEventListener('mouseleave', function () { warpTarget = 0; });
      btn.addEventListener('focus', function () { warpTarget = 1; });
      btn.addEventListener('blur', function () { warpTarget = 0; });
      btn.addEventListener('click', function () {
        flash = 1;
        warp = 0;
        z = 0;
      });

      function frame(now) {
        var dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        warp += (warpTarget - warp) * Math.min(1, dt * 2.6);
        flash *= Math.exp(-4.5 * dt);
        z += dt * (0.05 + warp * 1.35);
        resize();
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform1f(uTime, reduced ? 4.0 : z);
        gl.uniform1f(uWarp, warp);
        gl.uniform1f(uFlash, flash);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    })();
  <\/script>
</body>
</html>`;var $d=`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Component Preview</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
    }
    body {
      height: 100%;
      overflow: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #000000;
      color: #ffffff;
    }
    .component-wrapper {
      width: 100%;
      height: 100%;
      padding: 0;
      box-sizing: border-box;
      overflow: auto;
    }
  </style>
</head>
<body>
  <div class="component-wrapper">
    <html><head></head><body><button class="group/btn relative">
                <div class="-inset-1 group-hover/btn:opacity-75 transition duration-500 bg-amber-500/40 opacity-40 rounded-xl absolute blur"></div>
                <div class="relative bg-gradient-to-b from-amber-200 via-amber-300 to-amber-500 text-amber-950 rounded-xl px-8 py-4 flex items-center gap-3 shadow-[0_0_0_1px_rgba(251,191,36,0.5),0_4px_0_#b45309,0_10px_15px_-3px_rgba(0,0,0,0.5)] active:translate-y-[2px] active:shadow-[0_0_0_1px_rgba(251,191,36,0.5),0_2px_0_#b45309] transition-all duration-150">
                    <span class="text-lg font-medium tracking-tight">Initialize Launch</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="zap" class="lucide lucide-zap w-5 h-5 fill-amber-950/20 stroke-[1.5]"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" class=""></path></svg>
                </div>
            </button></body></html>
  </div>
  
    <script>
      (function() {
        function checkAndCenter() {
          // Use double requestAnimationFrame to ensure DOM is fully painted and layout is stable
          requestAnimationFrame(function() {
            requestAnimationFrame(function() {
              const wrapper = document.querySelector('.component-wrapper');
              if (!wrapper) return;
              
              // Get all child elements
              const children = Array.from(wrapper.children);
              if (children.length === 0) return;
              
              // Temporarily override wrapper styles to shrink-wrap for measurement
              // Set inline styles to shrink-wrap (inline styles override CSS)
              wrapper.style.display = 'inline-block';
              wrapper.style.width = 'auto';
              wrapper.style.height = 'auto';
              wrapper.style.overflow = 'visible';
              wrapper.style.boxSizing = 'content-box';
              
              // Force multiple reflows to ensure styles are fully applied
              void wrapper.offsetHeight;
              void wrapper.offsetWidth;
              void wrapper.offsetHeight;
              
              // Measure the wrapper's content size
              const contentWidth = wrapper.offsetWidth;
              const contentHeight = wrapper.offsetHeight;
              
              // Restore original styles by removing inline styles we added
              wrapper.style.removeProperty('display');
              wrapper.style.removeProperty('width');
              wrapper.style.removeProperty('height');
              wrapper.style.removeProperty('overflow');
              wrapper.style.removeProperty('box-sizing');
              
              // If content is less than 500x500, center it
              if (contentWidth > 0 && contentHeight > 0 && contentWidth < 500 && contentHeight < 500) {
                wrapper.style.display = 'flex';
                wrapper.style.alignItems = 'center';
                wrapper.style.justifyContent = 'center';
              }
            });
          });
        }
        
        // Check immediately and after delays to ensure content is rendered and styled
        function runChecks() {
          checkAndCenter();
          setTimeout(checkAndCenter, 50);
          setTimeout(checkAndCenter, 150);
          setTimeout(checkAndCenter, 300);
          setTimeout(checkAndCenter, 500);
          setTimeout(checkAndCenter, 1000);
        }
        
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', runChecks);
        } else {
          runChecks();
        }
        
        // Also check when images or other resources load
        window.addEventListener('load', () => {
          setTimeout(checkAndCenter, 100);
          setTimeout(checkAndCenter, 300);
        });
        
        // Use ResizeObserver to detect size changes
        if (window.ResizeObserver) {
          setTimeout(() => {
            const wrapper = document.querySelector('.component-wrapper');
            if (wrapper) {
              const observer = new ResizeObserver(() => {
                setTimeout(checkAndCenter, 50);
              });
              observer.observe(wrapper);
            }
          }, 500);
        }
      })();
    <\/script>
  
</body>
</html>
`;var e0=`<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Imaginie \u2014 Stay close to your imagination.</title>
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"><\/script>
  <!-- Iconify Icons -->
  <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"><\/script>
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&amp;family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&amp;display=swap" rel="stylesheet">
  <style>
    .font-serif {
      font-family: 'Playfair Display', Georgia, serif;
    }
    .font-sans {
      font-family: 'Inter', sans-serif;
    }
    /* Smooth custom animations */
    .word-span {
      display: inline-block;
      opacity: 0;
      transform: translateY(12px) translateZ(0);
      filter: blur(4px);
      transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .word-span.visible {
      opacity: 1;
      transform: translateY(0) translateZ(0);
      filter: blur(0);
    }
    /* Holographic button glow */
    .holo-btn {
      position: relative;
      background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,220,205,0.9) 50%, rgba(220,240,255,0.9) 100%);
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6);
      transition: all 0.4s ease;
    }
    .holo-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 0 30px rgba(255, 220, 180, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.8);
    }
  </style>
</head>
<body class="bg-[#030303] text-[#f4f4f6] font-sans antialiased overflow-x-hidden min-h-screen flex flex-col justify-between" style="background-image: radial-gradient(circle at 10% 20%, rgba(15, 11, 28, 0.6) 0%, rgba(3, 3, 3, 1) 80%);">

  <!-- Interactive Background Canvas (WebGL/Nebula simulation) -->
  <canvas id="ambient-starfield" class="absolute inset-0 pointer-events-none z-0" style="opacity: 0.45;"></canvas>

  <!-- Header Navigation -->
  <header class="relative z-50 w-full max-w-7xl mx-auto px-6 md:px-12 py-6 flex items-center justify-between">
    <div class="flex items-center gap-12">
      <!-- Logo -->
      <a href="#" class="text-xl font-semibold tracking-tight text-white hover:opacity-90 transition-opacity">
        Imaginie
      </a>
      <!-- Nav Links -->
      <nav class="hidden md:flex items-center gap-8">
        <a href="#" class="text-[13px] text-[#9a9a9f] hover:text-white transition-colors duration-200">How it works</a>
        <a href="#" class="text-[13px] text-[#9a9a9f] hover:text-white transition-colors duration-200">Features</a>
        <a href="#" class="text-[13px] text-[#9a9a9f] hover:text-white transition-colors duration-200">Pricing</a>
      </nav>
    </div>
    <!-- Log In CTA -->
    <div>
      <a href="#" class="px-5 py-2 text-[13px] font-medium text-white bg-[#ffffff0a] border border-[#ffffff10] rounded-full hover:bg-[#ffffff15] transition-all duration-300">
        Log in
      </a>
    </div>
  </header>

  <!-- Main Hero Workspace Section -->
  <main class="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center my-auto py-8">
    
    <!-- Left Copy Column -->
    <div class="lg:col-span-5 flex flex-col space-y-8 text-left max-w-xl lg:max-w-none">
      
      <!-- High-fidelity Headline (Letter/Word animated) -->
      <h1 id="hero-title" class="text-5xl md:text-6xl lg:text-[64px] font-serif leading-[1.08] tracking-tight text-white py-1">
        Stay close to your imagination.
      </h1>

      <!-- Description Subhead -->
      <p id="hero-desc" class="text-[14px] md:text-[15px] text-[#94949a] leading-relaxed max-w-[430px] opacity-0 translate-y-4 transition-all duration-1000 ease-out delay-500">
        Where ideas begin as sparks and emerge as living experiences through the power of AI. We transform what doesn't exist yet into something unforgettable.
      </p>

      <!-- Action Buttons -->
      <div id="hero-actions" class="flex flex-wrap items-center gap-4 pt-2 opacity-0 translate-y-4 transition-all duration-1000 ease-out delay-700">
        <a href="#" class="px-5 py-3 text-[13px] font-medium text-white bg-[#0e0e11] border border-[#ffffff12] rounded-full hover:bg-[#16161b] hover:border-[#ffffff1c] transition-all duration-300 flex items-center gap-2">
          See how it works
        </a>
        <a href="#" class="holo-btn px-6 py-3 text-[13px] font-semibold text-[#0d0a12] rounded-full flex items-center gap-1.5 transition-transform duration-300">
          Begin the journey
          <iconify-icon icon="solar:arrow-right-linear" class="text-base font-semibold" style="stroke-width: 2;"></iconify-icon>
        </a>
      </div>

      <!-- Social Proof / Creators Indicator -->
      <div id="hero-proof" class="flex items-center gap-3.5 pt-8 opacity-0 translate-y-4 transition-all duration-1000 ease-out delay-900">
        <!-- Avatars Stack -->
        <div class="flex -space-x-3.5">
          <img class="w-7 h-7 rounded-full border border-black object-cover filter brightness-95" src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/2f563338-39fa-47ea-9761-658d4f3f84db_1600w.jpg" alt="Creator">
          <img class="w-7 h-7 rounded-full border border-black object-cover filter brightness-95" src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/4f5668c5-fc4a-44e0-bc5e-a664189d3c31_1600w.jpg" alt="Creator">
          <img class="w-7 h-7 rounded-full border border-black object-cover filter brightness-95" src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/eca707cc-a5b7-439a-b4fd-247f6106c2e1_1600w.jpg" alt="Creator">
          <img class="w-7 h-7 rounded-full border border-black object-cover filter brightness-95" src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/77415a2e-dcbc-4748-a29d-fced4821881a_1600w.jpg" alt="Creator">
        </div>
        <!-- Copy text -->
        <p class="text-[12px] text-[#86868b] tracking-normal">
          Used by <span class="text-white font-medium">12,000+</span> builders, creators, and professionals
        </p>
      </div>

    </div>

    <!-- Right Artistic Cosmic Portal Column -->
    <div class="lg:col-span-7 flex justify-center lg:justify-end relative w-full h-[480px] md:h-[620px] lg:h-[680px]">
      
      <!-- Outer glowing bronze border frame (Portal Container) -->
      <div class="relative w-full max-w-[500px] h-full rounded-t-[180px] rounded-b-[40px] p-[5px] bg-gradient-to-tr from-[#1b120f] via-[#a3704c] to-[#e6c29e] shadow-[0_0_80px_rgba(163,112,76,0.15)] overflow-hidden flex items-center justify-center transition-transform duration-700 hover:scale-[1.01]">
        
        <!-- Inner shadow & ambient overlay wrapper -->
        <div class="relative w-full h-full rounded-t-[176px] rounded-b-[36px] overflow-hidden bg-black flex items-center justify-center">
          
          <!-- Background Cosmic Dust Image (Aura Asset) -->
          <video src="https://wypspaektjjiccarxrgy.supabase.co/storage/v1/object/public/generated-page-media/302e86e0-80d8-4ba5-82e8-004220675655/2026-05-20/1779252781481-eabde810-981e-4ee8-a143-4bee829a788c.mp4" poster="https://wypspaektjjiccarxrgy.supabase.co/storage/v1/object/public/generated-page-media/302e86e0-80d8-4ba5-82e8-004220675655/2026-05-20/1779245193658-07a4020a-dced-499d-ac91-36b6037f907e.png" data-neuform-generated-video="true" data-neuform-video-preset="loop-in-view" muted="" playsinline="" preload="metadata" loop="" aria-label="Cosmic Window" class="absolute inset-0 w-full h-full object-cover opacity-85 mix-blend-lighten filter brightness-110 saturate-[1.1]"></video>

          <!-- Interactive Star/Nebula Field Canvas inside the window -->
          <canvas id="portal-stars" class="absolute inset-0 w-full h-full z-10 mix-blend-screen pointer-events-none"></canvas>

          <!-- Cosmic Horizon Layer Glow -->
          <div class="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-[#0e0c15] via-transparent to-transparent z-20"></div>

          <!-- Futuristic Figure Silhouette sitting in deep observation -->
          <div class="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
            
            <!-- Glow around head / focal aura -->
            <div class="absolute -top-3 w-10 h-10 rounded-full bg-orange-400 opacity-40 blur-md animate-pulse"></div>
            <div class="absolute -top-1 w-6 h-6 rounded-full bg-yellow-100 opacity-60 blur-sm"></div>

            <!-- Sleek SVG silhouette (Person in circular ergonomic egg-chair) -->
            <svg class="w-24 h-24 text-black filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]" viewBox="0 0 100 100" fill="currentColor">
              <!-- Pod / Chair -->
              <path d="M50,15 C30,15 20,30 20,55 C20,75 32,85 50,85 C68,85 80,75 80,55 C80,30 70,15 50,15 Z" fill="#060608"></path>
              <!-- Inner Cushion Cutout -->
              <path d="M50,22 C35,22 26,33 26,55 C26,70 34,78 50,78 C66,78 74,70 74,55 C74,33 65,22 50,22 Z" fill="#010102"></path>
              <!-- Person Silhouette inside -->
              <!-- Torso & Arms -->
              <path d="M46,68 L54,68 L54,58 L52,50 L48,50 L46,58 Z" fill="#08080c"></path>
              <!-- Head -->
              <circle cx="50" cy="45" r="4.5" fill="#08080c"></circle>
              <!-- Glow back rim on seat -->
              <path d="M26,55 C26,62 30,70 38,74" stroke="#e6c29e" stroke-width="1" fill="none" opacity="0.4"></path>
              <path d="M74,55 C74,62 70,70 62,74" stroke="#a3704c" stroke-width="1" fill="none" opacity="0.3"></path>
            </svg>

          </div>

          <!-- Glass reflection light glare on the screen -->
          <div class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none z-20" style="mix-blend-mode: overlay;"></div>

        </div>
      </div>

      <!-- Left Bottom soft dark gradient blend for natural shadow -->
      <div class="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#030303] to-transparent z-40 pointer-events-none"></div>

    </div>

  </main>

  <!-- Fine Footer Branding -->
  <footer class="relative z-50 w-full max-w-7xl mx-auto px-6 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between border-t border-[#ffffff05] text-[11px] text-[#636366] gap-4">
    <div class="flex items-center gap-1.5">
      <span>\xA9 2026 Imaginie Inc. All rights reserved.</span>
    </div>
    <div class="flex items-center gap-6">
      <a href="#" class="hover:text-white transition-colors duration-200">Terms of Service</a>
      <a href="#" class="hover:text-white transition-colors duration-200">Privacy Policy</a>
      <a href="#" class="hover:text-white transition-colors duration-200">System Status</a>
    </div>
  </footer>

  <!-- Script for Animations & Live Cosmic Canvas Simulation (WebGL Quality 2D Context) -->
  <script>
    // 1. Text Animation: Splitting the header words cleanly and fading in one by one.
    const title = document.getElementById('hero-title');
    const titleText = title.textContent.trim();
    title.innerHTML = '';
    
    // Split text into words safely
    const words = titleText.split(/\\s+/);
    words.forEach((word, index) => {
      const span = document.createElement('span');
      span.className = 'word-span';
      span.innerHTML = word + '&nbsp;';
      span.style.transitionDelay = \`\${index * 80}ms\`;
      title.appendChild(span);
    });

    // Trigger animations when content loaded
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        const spans = document.querySelectorAll('.word-span');
        spans.forEach(span => span.classList.add('visible'));
      }, 100);

      setTimeout(() => {
        document.getElementById('hero-desc').style.opacity = '1';
        document.getElementById('hero-desc').style.transform = 'translateY(0)';
      }, 400);

      setTimeout(() => {
        document.getElementById('hero-actions').style.opacity = '1';
        document.getElementById('hero-actions').style.transform = 'translateY(0)';
      }, 650);

      setTimeout(() => {
        document.getElementById('hero-proof').style.opacity = '1';
        document.getElementById('hero-proof').style.transform = 'translateY(0)';
      }, 850);
    });

    // 2. Interactive Starfield Canvas inside the Portal Frame
    const portalCanvas = document.getElementById('portal-stars');
    const ctxPortal = portalCanvas.getContext('2d');
    
    let stars = [];
    let portalWidth = 0;
    let portalHeight = 0;

    function resizePortalCanvas() {
      const rect = portalCanvas.getBoundingClientRect();
      portalWidth = rect.width;
      portalHeight = rect.height;
      portalCanvas.width = portalWidth;
      portalCanvas.height = portalHeight;
      initStars();
    }

    function initStars() {
      stars = [];
      const count = 45;
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * portalWidth,
          y: Math.random() * portalHeight,
          radius: Math.random() * 1.5 + 0.5,
          color: getRandomColor(),
          speed: Math.random() * 0.15 + 0.05,
          angle: Math.random() * Math.PI * 2,
          pulse: Math.random() * 0.02
        });
      }
    }

    function getRandomColor() {
      const colors = [
        'rgba(230, 194, 158, ', // Bronze/gold matches frame
        'rgba(244, 244, 246, ', // Pure soft white
        'rgba(173, 140, 255, ', // Purple starlight
        'rgba(135, 206, 250, '  // Cool space blue
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    }

    function drawStars() {
      ctxPortal.clearRect(0, 0, portalWidth, portalHeight);
      
      stars.forEach(s => {
        // Drift movement
        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        
        // Bounce bounds inside space window
        if (s.x < 0 || s.x > portalWidth) s.angle = Math.PI - s.angle;
        if (s.y < 0 || s.y > portalHeight) s.angle = -s.angle;

        // Sparkle fade
        s.speed += (Math.random() - 0.5) * 0.01;
        s.speed = Math.max(0.02, Math.min(s.speed, 0.25));

        // Pulsing glow alpha
        const alpha = 0.3 + Math.abs(Math.sin(Date.now() * s.pulse)) * 0.7;
        ctxPortal.beginPath();
        ctxPortal.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctxPortal.fillStyle = s.color + alpha + ')';
        ctxPortal.shadowBlur = s.radius * 4;
        ctxPortal.shadowColor = s.color + '0.8)';
        ctxPortal.fill();
      });

      requestAnimationFrame(drawStars);
    }

    // 3. Ambient Starfield on Page Background
    const ambientCanvas = document.getElementById('ambient-starfield');
    const ctxAmbient = ambientCanvas.getContext('2d');
    let ambientStars = [];

    function resizeAmbientCanvas() {
      ambientCanvas.width = window.innerWidth;
      ambientCanvas.height = window.innerHeight;
      initAmbientStars();
    }

    function initAmbientStars() {
      ambientStars = [];
      const count = 70;
      for (let i = 0; i < count; i++) {
        ambientStars.push({
          x: Math.random() * ambientCanvas.width,
          y: Math.random() * ambientCanvas.height,
          size: Math.random() * 0.8 + 0.2,
          opacity: Math.random() * 0.6 + 0.1,
          drift: Math.random() * 0.02 + 0.01
        });
      }
    }

    function drawAmbientStars() {
      ctxAmbient.clearRect(0, 0, ambientCanvas.width, ambientCanvas.height);
      ambientStars.forEach(s => {
        s.y -= s.drift;
        if (s.y < 0) s.y = ambientCanvas.height;
        ctxAmbient.fillStyle = \`rgba(255, 255, 255, \${s.opacity})\`;
        ctxAmbient.fillRect(s.x, s.y, s.size, s.size);
      });
      requestAnimationFrame(drawAmbientStars);
    }

    window.addEventListener('resize', () => {
      resizePortalCanvas();
      resizeAmbientCanvas();
    });

    // Initial setups
    resizePortalCanvas();
    resizeAmbientCanvas();
    drawStars();
    drawAmbientStars();
  <\/script>

<script data-neuform-video-controller="true">
(function () {
  function playVideo(video) {
    var promise = video.play();
    if (promise && typeof promise.catch === "function") {
      promise.catch(function () {});
    }
  }
  function setupVideo(video) {
    if (video.__neuformVideoReady === true) return;
    video.__neuformVideoReady = true;
    video.muted = true;
    video.playsInline = true;
    var preset = video.dataset.neuformVideoPreset || "loop-in-view";
    if (preset === "hover") {
      video.addEventListener("mouseenter", function () { playVideo(video); });
      video.addEventListener("mouseleave", function () {
        video.pause();
        video.currentTime = 0;
      });
      return;
    }
    if (!("IntersectionObserver" in window)) {
      playVideo(video);
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          if (preset === "play-once" && video.__neuformVideoPlayed === true) return;
          playVideo(video);
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.35 });
    if (preset === "play-once") {
      video.addEventListener("ended", function () {
        video.__neuformVideoPlayed = true;
      }, { once: true });
    }
    observer.observe(video);
  }
  function setupVideos() {
    document.querySelectorAll("video[data-neuform-video-preset]").forEach(setupVideo);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupVideos);
  } else {
    setupVideos();
  }
})();<\/script></body></html>`;var t0=`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>N E X U S &mdash; Tactile Fluidics</title>
    
    <script src="https://cdn.tailwindcss.com"><\/script>
    <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"><\/script>
    
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
</head>
<body class="bg-[#02040a] text-neutral-200 h-screen w-screen overflow-hidden font-['Inter',sans-serif] selection:bg-[#06b6d4] selection:text-black relative">

    <!-- Ambient WebGL Background -->
    <canvas id="bg-canvas" class="absolute inset-0 w-full h-full block pointer-events-none z-0 opacity-0" aria-hidden="true"></canvas>

    <!-- Top Navigation / Logo -->
    <header class="absolute top-0 left-0 w-full p-6 sm:p-10 z-20 flex justify-between items-center opacity-0 nav-reveal">
        <div class="font-light text-sm tracking-[0.4em] uppercase text-neutral-400">
            N E X U S
        </div>
        <div class="flex gap-4">
            <div class="w-2 h-2 rounded-full bg-[#06b6d4] animate-pulse" style="animation-duration: 3s;"></div>
        </div>
    </header>

    <!-- Main Content Layer -->
    <main class="content-layer relative z-10 w-full h-full flex flex-col items-center justify-center px-4">
        
        <div class="tag font-mono text-xs tracking-[0.3em] uppercase text-[#06b6d4] mb-8 sm:mb-12 opacity-0 transform translate-y-4">
            System 07 / Viscosity
        </div>

        <h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight font-normal text-neutral-100 flex flex-wrap justify-center gap-x-3 gap-y-2 max-w-4xl text-center mb-6 overflow-hidden">
            <span class="overflow-hidden inline-block"><span class="reveal-word inline-block translate-y-full will-change-transform">Viscous</span></span>
            <span class="overflow-hidden inline-block"><span class="reveal-word inline-block translate-y-full will-change-transform text-neutral-400">Fields.</span></span>
            <span class="overflow-hidden inline-block"><span class="reveal-word inline-block translate-y-full will-change-transform">Reengineered.</span></span>
        </h1>

        <p class="subhead text-sm sm:text-base text-neutral-400 font-light tracking-wide max-w-md text-center mb-12 sm:mb-16 opacity-0 transform translate-y-4">
            Delve into high-fidelity tactile feedback arrays. Engineered for continuous adaptive state manipulation.
        </p>

        <!-- CTA Component -->
        <div class="intro opacity-0 transform translate-y-[-20px] scale-95 will-change-transform">
            <!-- Subtle Cyan Gradient Border Wrapper -->
            <div class="p-[1px] rounded-[19px] bg-gradient-to-b from-cyan-500/30 via-neutral-800/20 to-cyan-950/40 shadow-2xl">
                <button class="relative flex items-center justify-center w-[250px] h-[70px] border-0 p-0 rounded-[18px] overflow-hidden cursor-pointer bg-[#050b11] transition-all duration-300 ease-out shadow-[0_22px_44px_rgba(4,24,36,0.35),0_3px_9px_rgba(5,10,15,0.4),inset_0_0_0_1px_rgba(255,255,255,0.05)] hover:-translate-y-[2px] hover:shadow-[0_28px_56px_rgba(6,182,212,0.25),0_4px_11px_rgba(5,10,15,0.45)] active:translate-y-[1px] active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#06b6d4] focus-visible:outline-offset-[5px]" id="btn" type="button">
                    <canvas id="gl" aria-hidden="true" class="absolute inset-0 w-full h-full block"></canvas>
                    <span class="relative z-10 pointer-events-none font-normal text-sm tracking-[0.3em] indent-[0.3em] text-[#e0faff] drop-shadow-[0_1px_10px_rgba(0,18,25,0.85)] flex items-center gap-2">
                        SURGE
                        <iconify-icon icon="solar:arrow-right-linear" width="18" height="18" stroke-width="1.5" class="ml-1 opacity-80"></iconify-icon>
                    </span>
                </button>
            </div>
        </div>

        <p class="note font-light text-xs text-neutral-500 tracking-wide mt-8 sm:mt-10 opacity-0 transform translate-y-4">
            Sweep the cursor to generate turbulence, click to discharge.
        </p>
    </main>

    <script>
        // --------------------------------------------------------
        // GSAP Animations & Parallax
        // --------------------------------------------------------
        document.addEventListener("DOMContentLoaded", () => {
            const tl = gsap.timeline();

            // Background Fade In
            tl.to("#bg-canvas", { opacity: 1, duration: 2, ease: "power2.inOut" }, 0);
            
            // Nav Reveal
            tl.to(".nav-reveal", { opacity: 1, duration: 1, ease: "power2.out" }, 0.5);

            // Tag Reveal
            tl.to(".tag", { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, 0.8);

            // Masked Word Stagger
            tl.to(".reveal-word", {
                y: "0%",
                duration: 1,
                stagger: 0.12,
                ease: "power4.out"
            }, 0.9);

            // Subhead Reveal
            tl.to(".subhead", { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, 1.4);

            // Button Drop/Bounce Effect (Replicating CSS Keyframes)
            tl.to(".intro", {
                y: 0,
                scale: 1,
                opacity: 1,
                duration: 1.2,
                ease: "elastic.out(1, 0.6)"
            }, 1.6);

            // Note Reveal
            tl.to(".note", { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, 1.8);

            // Subtle Mouse Parallax
            document.addEventListener("mousemove", (e) => {
                const x = (e.clientX / window.innerWidth - 0.5) * 15;
                const y = (e.clientY / window.innerHeight - 0.5) * 15;
                
                gsap.to(".content-layer", {
                    x: x,
                    y: y,
                    duration: 1.5,
                    ease: "power2.out",
                    overwrite: "auto"
                });
            });
        });

        // --------------------------------------------------------
        // Ambient Background WebGL
        // --------------------------------------------------------
        (function initAmbientBG() {
            const canvas = document.getElementById('bg-canvas');
            const gl = canvas.getContext('webgl');
            if (!gl) return;

            const vs = 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }';
            const fs = \`
                precision mediump float;
                uniform vec2 u_res;
                uniform float u_time;

                float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
                float noise(vec2 p) {
                    vec2 i = floor(p);
                    vec2 f = fract(p);
                    vec2 u = f * f * (3.0 - 2.0 * f);
                    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
                }
                float fbm(vec2 p) {
                    float v = 0.0, a = 0.5;
                    for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.0; a *= 0.5; }
                    return v;
                }

                void main() {
                    vec2 uv = gl_FragCoord.xy / u_res;
                    uv.x *= u_res.x / u_res.y;
                    
                    float t = u_time * 0.15;
                    
                    // Slow moving dark liquid
                    vec2 q = vec2(fbm(uv + t), fbm(uv + vec2(1.0) + t));
                    vec2 r = vec2(fbm(uv + 1.0*q + vec2(1.7, 9.2) + 0.15*t),
                                  fbm(uv + 1.0*q + vec2(8.3, 2.8) + 0.126*t));
                    
                    float f = fbm(uv + r);
                    
                    // Core dark colors, subtle icy/cyan hints replacing fiery shades
                    vec3 col = mix(vec3(0.01, 0.02, 0.03), vec3(0.01, 0.04, 0.07), f);
                    col = mix(col, vec3(0.02, 0.07, 0.12), clamp(length(q) * 0.5, 0.0, 1.0));
                    
                    // Vignette
                    vec2 e = gl_FragCoord.xy / u_res * (1.0 - gl_FragCoord.xy / u_res);
                    col *= 0.5 + 0.5 * pow(e.x * e.y * 15.0, 0.3);
                    
                    gl_FragColor = vec4(col, 1.0);
                }
            \`;

            function compile(type, src) {
                const s = gl.createShader(type);
                gl.shaderSource(s, src);
                gl.compileShader(s);
                return s;
            }

            const prog = gl.createProgram();
            gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
            gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
            gl.linkProgram(prog);
            gl.useProgram(prog);

            const buf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
            
            const locP = gl.getAttribLocation(prog, 'p');
            gl.enableVertexAttribArray(locP);
            gl.vertexAttribPointer(locP, 2, gl.FLOAT, false, 0, 0);

            const uRes = gl.getUniformLocation(prog, 'u_res');
            const uTime = gl.getUniformLocation(prog, 'u_time');

            function resize() {
                const dpr = Math.min(window.devicePixelRatio || 1, 2);
                canvas.width = window.innerWidth * dpr;
                canvas.height = window.innerHeight * dpr;
                gl.viewport(0, 0, canvas.width, canvas.height);
            }
            window.addEventListener('resize', resize);
            resize();

            const start = performance.now();
            function render(now) {
                gl.uniform2f(uRes, canvas.width, canvas.height);
                gl.uniform1f(uTime, (now - start) / 1000);
                gl.drawArrays(gl.TRIANGLES, 0, 3);
                requestAnimationFrame(render);
            }
            requestAnimationFrame(render);
        })();

        // --------------------------------------------------------
        // Interactive Liquid Button WebGL (from reference)
        // --------------------------------------------------------
        (function initButtonWebGL() {
            var btn = document.getElementById('btn');
            var canvas = document.getElementById('gl');
            var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            var gl = canvas.getContext('webgl');
            
            if (!gl) { 
                btn.style.background = 'linear-gradient(to top, #0284c7 0%, #06b6d4 52%, #a5f3fc 55%, #050b11 56%)';
                canvas.style.display = 'none';
                return; 
            }

            var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
            var FS = [
                'precision highp float;',
                'uniform vec2 u_res;',
                'uniform float u_time;',
                'uniform float u_level;',
                'uniform float u_tilt;',
                'uniform float u_slosh;',
                'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}',
                'float noise(vec2 p){',
                '  vec2 i=floor(p), f=fract(p);',
                '  vec2 u=f*f*(3.0-2.0*f);',
                '  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),',
                '             mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);',
                '}',
                'float fbm(vec2 p){',
                '  float v=0.0; float a=0.5;',
                '  for(int i=0;i<4;i++){ v+=a*noise(p); p=p*2.04+vec2(11.3,7.1); a*=0.5; }',
                '  return v;',
                '}',
                'void main(){',
                '  vec2 uv = gl_FragCoord.xy / u_res;',
                '  float ar = u_res.x / u_res.y;',
                '  float x = uv.x * ar;',
                '  float t = u_time;',
                '  float amp = 0.012 + u_slosh * 0.045;',
                '  float surf = u_level',
                '    + u_tilt * (uv.x - 0.5) * 0.34',
                '    + amp * sin(x * 5.1 + t * 4.6)',
                '    + amp * 0.62 * sin(x * 9.7 + t * (-6.8) + 1.7)',
                '    + amp * 0.38 * sin(x * 14.3 + t * 8.9 + 4.2);',
                '  float d = surf - uv.y;',
                '  vec3 col = mix(vec3(0.03, 0.06, 0.1), vec3(0.05, 0.09, 0.15), uv.y);',
                '  col += vec3(0.02, 0.05, 0.1) * pow(max(0.0, 1.0 - abs(uv.y - 0.88) * 6.0), 2.0);',
                '  float inside = smoothstep(0.0, 0.012, d);',
                '  float depth = clamp(d / max(u_level, 0.001), 0.0, 1.0);',
                '  vec3 liq = mix(vec3(0.0, 0.9, 1.0), vec3(0.02, 0.15, 0.45), depth);',
                '  float caust = fbm(vec2(x * 4.2, (uv.y + t * 0.14) * 4.2));',
                '  liq *= 0.8 + 0.42 * caust;',
                '  liq += vec3(0.02, 0.25, 0.35) * pow(max(0.0, d * 3.0), 1.5) * u_slosh;',
                '  col = mix(col, liq, inside);',
                '  col += vec3(0.4, 0.9, 1.0) * exp(-abs(d) * 80.0) * 0.85;',
                '  col += vec3(0.8, 0.98, 1.0) * exp(-abs(d) * 220.0) * 0.5;',
                '  vec2 e = uv * (1.0 - uv);',
                '  col *= 0.55 + 0.45 * pow(e.x * e.y * 16.0, 0.22);',
                '  gl_FragColor = vec4(col, 1.0);',
                '}'
            ].join('\\n');

            function compile(type, src) {
                var s = gl.createShader(type);
                gl.shaderSource(s, src);
                gl.compileShader(s);
                return s;
            }
            
            var prog = gl.createProgram();
            gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
            gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
            gl.linkProgram(prog);
            gl.useProgram(prog);

            var buf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
            var locP = gl.getAttribLocation(prog, 'p');
            gl.enableVertexAttribArray(locP);
            gl.vertexAttribPointer(locP, 2, gl.FLOAT, false, 0, 0);

            var uRes = gl.getUniformLocation(prog, 'u_res');
            var uTime = gl.getUniformLocation(prog, 'u_time');
            var uLevel = gl.getUniformLocation(prog, 'u_level');
            var uTilt = gl.getUniformLocation(prog, 'u_tilt');
            var uSlosh = gl.getUniformLocation(prog, 'u_slosh');

            function resize() {
                var dpr = Math.min(window.devicePixelRatio || 1, 2);
                var w = Math.max(1, Math.round(canvas.clientWidth * dpr));
                var h = Math.max(1, Math.round(canvas.clientHeight * dpr));
                if (canvas.width !== w || canvas.height !== h) {
                    canvas.width = w;
                    canvas.height = h;
                    gl.viewport(0, 0, w, h);
                }
            }
            window.addEventListener('resize', resize);
            resize();

            var BASE = 0.56;
            var level = BASE, gulp = 0;
            var slosh = 0.4, tilt = 0, tiltTarget = 0;
            var lastX = null;
            var last = performance.now();

            btn.addEventListener('mousemove', function (e) {
                var rect = btn.getBoundingClientRect();
                var x = (e.clientX - rect.left) / Math.max(1, rect.width);
                if (lastX !== null) {
                    slosh = Math.min(1.4, slosh + Math.abs(x - lastX) * 2.6);
                }
                lastX = x;
                tiltTarget = Math.max(-1, Math.min(1, (x - 0.5) * 2));
            });
            btn.addEventListener('mouseleave', function () { lastX = null; tiltTarget = 0; });
            btn.addEventListener('focus', function () { slosh = Math.min(1.4, slosh + 0.5); });
            btn.addEventListener('click', function () {
                gulp = 1;
                slosh = Math.min(1.4, slosh + 0.7);
            });

            function frame(now) {
                var dt = Math.min(0.05, (now - last) / 1000);
                last = now;
                slosh *= Math.exp(-1.5 * dt);
                gulp *= Math.exp(-1.1 * dt);
                tilt += (tiltTarget - tilt) * Math.min(1, dt * 5);
                var levelTarget = BASE - 0.36 * gulp;
                level += (levelTarget - level) * Math.min(1, dt * 5.5);
                
                resize();
                gl.uniform2f(uRes, canvas.width, canvas.height);
                gl.uniform1f(uTime, reduced ? 2.0 : now / 1000);
                gl.uniform1f(uLevel, level);
                gl.uniform1f(uTilt, tilt);
                gl.uniform1f(uSlosh, reduced ? 0.25 : slosh);
                gl.drawArrays(gl.TRIANGLES, 0, 3);
                requestAnimationFrame(frame);
            }
            requestAnimationFrame(frame);
        })();
    <\/script>
</body>
</html>`;var r0=`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nexus Architecture - Topology</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\/script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400&display=swap" rel="stylesheet">
</head>
<body class="text-gray-100 antialiased selection:bg-zinc-800 selection:text-white" style="font-family: 'Inter', sans-serif; background: radial-gradient(circle at bottom right, #18181b 0%, #000000 50%, #000000 100%); overflow: hidden; margin: 0; padding: 0; height: 100vh; width: 100vw;">

    <div id="canvasGlow" class="absolute pointer-events-none rounded-full blur-[120px] opacity-[0.15] bg-white transition-all duration-1000" style="z-index: 0; transform: translate(-50%, -50%);"></div>
    <canvas id="animationCanvas" class="absolute inset-0 w-full h-full z-0 pointer-events-none"></canvas>

    <header class="absolute top-10 left-12 right-12 z-50 flex justify-between items-center pointer-events-auto">
        <div class="flex items-center gap-3">
            <iconify-icon icon="solar:globus-linear" class="text-3xl text-white"></iconify-icon>
            <span class="text-xl tracking-tighter font-light text-white">Nexus Architecture</span>
        </div>
        <div class="text-xs tracking-widest uppercase text-gray-500 font-normal">System Topology</div>
    </header>

    <main class="relative z-10 w-full h-full flex items-center">
        
        <div class="pl-12 md:pl-20 max-w-[55vw] z-20 pointer-events-none">
            <h1 class="text-[clamp(4rem,8vw,10rem)] tracking-tighter font-light text-white leading-[0.85] mb-10">
                Expand vs<br>Refine
            </h1>
            <div class="text-xl md:text-2xl text-gray-400 font-light max-w-[42vw] leading-snug flex flex-col gap-8">
                <ul class="list-disc pl-6 text-gray-200 flex flex-col gap-3 marker:text-gray-500">
                    <li>Refinement sharpens focus.</li>
                    <li>Expansion broadens scope.</li>
                </ul>
                <p>
                    Understanding this duality is crucial for system architects. When the core logic holds, refine the parameters. When the constraints limit potential, expand the boundaries. Suboptimal scaling often results from misapplying these principles during rapid deployment.
                </p>
            </div>
        </div>

        <div class="absolute inset-0 pointer-events-none hidden md:block z-20">
            
            <div class="absolute top-[28%] left-[58%] pointer-events-auto transition-transform duration-75" data-float data-float-offset="0">
                <div class="relative bg-black/40 backdrop-blur-md shadow-2xl rounded-full px-4 py-1.5 flex items-center justify-center">
                    <div class="absolute inset-0 rounded-full p-[1px] bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none" style="-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude;"></div>
                    <span class="text-xs font-light text-gray-200">48.2 TB/s</span>
                </div>
                <div class="absolute -right-3 top-1/2 -mt-1 w-2 h-2 bg-white rounded-full">
                    <div class="absolute inset-0 rounded-full animate-ping bg-white opacity-75" style="animation-duration: 2s;"></div>
                </div>
            </div>

            <div class="absolute top-[18%] left-[72%] pointer-events-auto transition-transform duration-75" data-float data-float-offset="3">
                <div class="relative bg-black/40 backdrop-blur-md shadow-2xl rounded-full px-4 py-1.5 flex items-center gap-1.5 justify-center">
                    <div class="absolute inset-0 rounded-full p-[1px] bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none" style="-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude;"></div>
                    <iconify-icon icon="solar:users-group-rounded-linear" class="text-gray-300 text-sm"></iconify-icon>
                    <span class="text-xs font-light text-gray-200">+3,420</span>
                </div>
                <div class="absolute -bottom-3 left-1/2 -ml-1 w-2 h-2 bg-white rounded-full">
                    <div class="absolute inset-0 rounded-full animate-ping bg-white opacity-75" style="animation-duration: 2s; animation-delay: 0.5s;"></div>
                </div>
            </div>

            <div class="absolute top-[35%] left-[82%] pointer-events-auto transition-transform duration-75" data-float data-float-offset="0">
                <div class="relative bg-black/40 backdrop-blur-md shadow-2xl rounded-full px-4 py-1.5 flex items-center justify-center">
                    <div class="absolute inset-0 rounded-full p-[1px] bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none" style="-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude;"></div>
                    <span class="text-xs font-light text-gray-200">2.8 TB/s</span>
                </div>
            </div>

            <div class="absolute top-[45%] left-[52%] pointer-events-auto transition-transform duration-75" data-float data-float-offset="0">
                <div class="absolute -top-12 -right-8 bg-black/40 backdrop-blur-md shadow-2xl rounded-2xl px-4 py-2 w-max">
                    <div class="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none" style="-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude;"></div>
                    <span class="text-xs font-light text-gray-300">Ledger synced.</span>
                    <div class="absolute -bottom-2 left-4 w-4 h-4 bg-zinc-900/80 border-b border-r border-white/5 transform rotate-45 backdrop-blur-md"></div>
                </div>
                <div class="bg-black/40 backdrop-blur-md shadow-2xl rounded-full p-1.5 relative z-10">
                    <div class="absolute inset-0 rounded-full p-[1px] bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none" style="-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude;"></div>
                    <img src="https://i.pravatar.cc/150?img=47" alt="Node Operator" class="w-12 h-12 rounded-full object-cover grayscale opacity-80">
                </div>
                <div class="absolute -bottom-4 left-1/2 -ml-1 w-2 h-2 bg-white rounded-full">
                    <div class="absolute inset-0 rounded-full animate-ping bg-white opacity-75" style="animation-duration: 2s; animation-delay: 1s;"></div>
                </div>
            </div>

            <div class="absolute top-[58%] left-[62%] pointer-events-auto transition-transform duration-75" data-float data-float-offset="3">
                <div class="relative bg-black/40 backdrop-blur-md shadow-2xl rounded-2xl p-3 shadow-lg">
                    <div class="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none" style="-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude;"></div>
                    <iconify-icon icon="solar:user-circle-linear" class="text-gray-400 text-3xl"></iconify-icon>
                </div>
                <div class="absolute -bottom-4 left-1/2 -ml-1 w-2 h-2 bg-white rounded-full">
                    <div class="absolute inset-0 rounded-full animate-ping bg-white opacity-75" style="animation-duration: 2s; animation-delay: 0.2s;"></div>
                </div>
            </div>

            <div class="absolute top-[55%] left-[88%] pointer-events-auto transition-transform duration-75" data-float data-float-offset="0">
                <div class="relative bg-black/40 backdrop-blur-md shadow-2xl rounded-full px-4 py-1.5 flex items-center justify-center">
                    <div class="absolute inset-0 rounded-full p-[1px] bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none" style="-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude;"></div>
                    <span class="text-xs font-light text-gray-200">9.12 PB/s</span>
                </div>
            </div>

            <div class="absolute top-[72%] left-[55%] pointer-events-auto transition-transform duration-75" data-float data-float-offset="3">
                <div class="relative bg-black/40 backdrop-blur-md shadow-2xl rounded-2xl px-4 py-3 flex items-center gap-3">
                    <div class="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none" style="-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude;"></div>
                    <div class="rounded-full border border-zinc-700 p-0.5">
                        <iconify-icon icon="solar:user-circle-linear" class="text-gray-300 text-2xl"></iconify-icon>
                    </div>
                    <div>
                        <div class="text-xs font-light text-gray-200">AP-South-2</div>
                        <div class="text-xs font-light text-gray-500">Replicating</div>
                    </div>
                </div>
            </div>

            <div class="absolute top-[80%] left-[75%] pointer-events-auto transition-transform duration-75" data-float data-float-offset="0">
                <div class="relative bg-black/40 backdrop-blur-md shadow-2xl rounded-2xl px-4 py-3 flex items-center gap-3">
                    <div class="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none" style="-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude;"></div>
                    <div class="rounded-full border border-zinc-700 p-0.5">
                        <iconify-icon icon="solar:user-circle-linear" class="text-gray-300 text-2xl"></iconify-icon>
                    </div>
                    <div>
                        <div class="text-xs font-light text-gray-200">EU-North-1</div>
                        <div class="text-xs font-light text-gray-500">Validating</div>
                    </div>
                </div>
                <div class="absolute -bottom-4 left-12 w-2 h-2 bg-white rounded-full">
                    <div class="absolute inset-0 rounded-full animate-ping bg-white opacity-75" style="animation-duration: 2s; animation-delay: 0.8s;"></div>
                </div>
            </div>

            <div class="absolute top-[40%] left-[72%] pointer-events-auto transition-transform duration-75" data-float data-float-offset="0">
                <div class="absolute -top-10 -right-6 bg-black/40 backdrop-blur-md shadow-2xl rounded-2xl px-4 py-2 w-max z-10">
                    <div class="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none" style="-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude;"></div>
                    <span class="text-xs font-light text-gray-300">Payload secured.</span>
                </div>
                <div class="bg-black/40 backdrop-blur-md shadow-2xl rounded-full p-2 relative z-0">
                    <div class="absolute inset-0 rounded-full p-[1px] bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none" style="-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude;"></div>
                    <div class="w-10 h-10 bg-zinc-800/80 rounded-full flex items-center justify-center shadow-inner">
                        <iconify-icon icon="solar:rocket-linear" class="text-white text-xl"></iconify-icon>
                    </div>
                </div>
                <div class="absolute top-12 left-6 w-2 h-2 bg-white rounded-full">
                    <div class="absolute inset-0 rounded-full animate-ping bg-white opacity-75" style="animation-duration: 2s; animation-delay: 1.5s;"></div>
                </div>
            </div>

            <div class="absolute top-[68%] left-[82%] pointer-events-auto transition-transform duration-75" data-float data-float-offset="0">
                <div class="absolute -top-10 -left-12 bg-black/40 backdrop-blur-md shadow-2xl rounded-2xl px-4 py-2 w-max">
                    <div class="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none" style="-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude;"></div>
                    <span class="text-xs font-light text-gray-300">Channel encrypted.</span>
                </div>
                <div class="relative bg-black/40 backdrop-blur-md shadow-2xl rounded-full p-2">
                    <div class="absolute inset-0 rounded-full p-[1px] bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none" style="-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude;"></div>
                    <div class="w-8 h-8 bg-zinc-800/80 border border-zinc-600/50 rounded-full flex items-center justify-center shadow-sm">
                        <iconify-icon icon="solar:bolt-linear" class="text-gray-200 text-lg"></iconify-icon>
                    </div>
                </div>
                <div class="absolute -bottom-3 left-5 w-2 h-2 bg-white rounded-full">
                    <div class="absolute inset-0 rounded-full animate-ping bg-white opacity-75" style="animation-duration: 2s; animation-delay: 1.1s;"></div>
                </div>
            </div>

        </div>

    </main>

    <footer class="absolute bottom-10 left-12 right-12 z-50 flex justify-between items-center pointer-events-auto">
        <div class="text-xs tracking-widest uppercase text-gray-500 font-normal">Internal Draft & Restricted</div>
        <div class="text-xs tracking-widest uppercase text-gray-500 font-normal">01</div>
    </footer>

    <script>
        const canvas = document.getElementById('animationCanvas');
        const floaters = document.querySelectorAll('[data-float]');
        
        let width = window.innerWidth;
        let height = window.innerHeight;

        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x0a0a0a, 300, 950);

        const camera = new THREE.PerspectiveCamera(60, width / height, 1, 2000);
        camera.position.z = 650;

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const group = new THREE.Group();
        scene.add(group);

        const numNodes = 120;
        const nodes = [];
        const nodeGeo = new THREE.SphereGeometry(1, 16, 16);
        
        for(let i = 0; i < numNodes; i++) {
            let phi = Math.acos(-1 + (2 * i) / numNodes);
            let theta = Math.sqrt(numNodes * Math.PI) * phi;
            let x = Math.cos(theta) * Math.sin(phi);
            let y = Math.sin(theta) * Math.sin(phi);
            let z = Math.cos(phi);

            let mesh = new THREE.Mesh(
                nodeGeo,
                new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })
            );
            mesh.position.set(x, y, z);
            mesh.userData = {
                baseSize: Math.random() * 1.5 + 1.0,
                pulseSpeed: Math.random() * 0.02 + 0.015,
                pulseOffset: Math.random() * Math.PI * 2
            };
            group.add(mesh);
            nodes.push(mesh);
        }

        const linePos = [];
        const lineColors = [];
        for(let i = 0; i < numNodes; i++) {
            for(let j = i + 1; j < numNodes; j++) {
                let dist = nodes[i].position.distanceTo(nodes[j].position);
                const threshold = 0.45;
                if(dist < threshold) {
                    linePos.push(nodes[i].position.x, nodes[i].position.y, nodes[i].position.z);
                    linePos.push(nodes[j].position.x, nodes[j].position.y, nodes[j].position.z);
                    
                    let alpha = (1 - dist / threshold) * 0.8;
                    lineColors.push(alpha, alpha, alpha);
                    lineColors.push(alpha, alpha, alpha);
                }
            }
        }
        
        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
        lineGeo.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));
        const lineMat = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            opacity: 0.65
        });
        const lines = new THREE.LineSegments(lineGeo, lineMat);
        group.add(lines);

        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
            
            const R = width > 768 ? 380 : 200;
            group.scale.set(R, R, R);
            
            const centerX = width > 768 ? width * 0.2 : 0; 
            const centerY = width > 768 ? -height * 0.05 : -height * 0.2;
            group.position.set(centerX, centerY, 0);

            const glow = document.getElementById('canvasGlow');
            if (glow) {
                glow.style.left = \`\${(width / 2) + centerX}px\`;
                glow.style.top = \`\${(height / 2) - centerY}px\`;
                glow.style.width = \`\${R * 2.8}px\`;
                glow.style.height = \`\${R * 2.8}px\`;
            }
        }

        window.addEventListener('resize', resize);
        resize();

        let time = 0;
        function animate() {
            requestAnimationFrame(animate);
            time += 1;
            
            group.rotation.y = time * 0.0018;
            group.rotation.x = 0.2;
            group.rotation.z = time * 0.0006;

            nodes.forEach(mesh => {
                let p = mesh.userData;
                let pulse = (Math.sin((time * p.pulseSpeed) + p.pulseOffset) + 1) / 2;
                
                let targetRadius = p.baseSize + pulse * 1.8;
                let scale = targetRadius / group.scale.x;
                
                mesh.scale.set(scale, scale, scale);
                mesh.material.opacity = 0.4 + (pulse * 0.6);
            });

            floaters.forEach(el => {
                const offset = Number(el.getAttribute('data-float-offset'));
                const y = Math.sin((time * 0.02) + offset) * 12;
                const rot = Math.cos((time * 0.015) + offset) * 1.5;
                el.style.transform = \`translateY(\${y}px) rotate(\${rot}deg)\`;
            });

            renderer.render(scene, camera);
        }
        
        animate();
    <\/script>
</body>
</html>`;var n0=`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Component Preview</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
    }
    body {
      height: 100%;
      overflow: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #000000;
      color: #ffffff;
    }
    .component-wrapper {
      width: 100%;
      height: 100%;
      padding: 0;
      box-sizing: border-box;
      overflow: auto;
    }
  </style>
</head>
<body>
  <div class="component-wrapper">
    <html><head></head><body><button class="group relative inline-flex min-w-[120px] cursor-pointer transition-all duration-[1000ms] ease-[cubic-bezier(0.15,0.83,0.66,1)] hover:-translate-y-[3px] hover:text-white shadow-[0_2.8px_2.2px_rgba(0,0,0,0.3),_0_6.7px_5.3px_rgba(0,0,0,0.35),_0_12.5px_10px_rgba(0,0,0,0.4)] overflow-hidden font-semibold text-neutral-400 tracking-tight bg-neutral-800 border-neutral-600 border rounded-full pt-[12px] pr-[20px] pb-[12px] pl-[20px] items-center justify-center">
  <!-- Original text (slides down on hover) -->
  <span class="relative z-10 font-medium rounded-full transition-all duration-500 ease-out group-hover:transform group-hover:translate-y-8 group-hover:opacity-0 group-hover:blur-md">Download Mac app</span>
  
  <!-- Clone text (slides in from top on hover) -->
  <span class="absolute inset-0 z-10 flex items-center justify-center transition-all duration-300 ease-in-out transform -translate-y-8 group-hover:translate-y-0 group-hover:opacity-100 group-hover:blur-none font-medium opacity-0 rounded-full blur-md">Download Mac app</span>

  <!-- replaces the old ::before underline -->
  <span aria-hidden="true" class="absolute bottom-0 left-1/2 h-[1px] w-[70%] -translate-x-1/2 transition-all duration-[1000ms] ease-[cubic-bezier(0.15,0.83,0.66,1)] group-hover:opacity-80 bg-gradient-to-r from-transparent via-neutral-200 to-transparent rounded-full blur-[2px]"></span>
  
  <!-- bottom light gradient on hover -->
  <span aria-hidden="true" class="absolute bottom-0 left-0 right-0 h-[100%] group-hover:opacity-60 transition-all duration-[1000ms] ease-[cubic-bezier(0.15,0.83,0.66,1)] pointer-events-none bg-gradient-to-t from-white/20 via-white/10 to-transparent rounded-full"></span>
</button></body></html>
  </div>
  
    <script>
      (function() {
        function checkAndCenter() {
          // Use double requestAnimationFrame to ensure DOM is fully painted and layout is stable
          requestAnimationFrame(function() {
            requestAnimationFrame(function() {
              const wrapper = document.querySelector('.component-wrapper');
              if (!wrapper) return;
              
              // Get all child elements
              const children = Array.from(wrapper.children);
              if (children.length === 0) return;
              
              // Temporarily override wrapper styles to shrink-wrap for measurement
              // Set inline styles to shrink-wrap (inline styles override CSS)
              wrapper.style.display = 'inline-block';
              wrapper.style.width = 'auto';
              wrapper.style.height = 'auto';
              wrapper.style.overflow = 'visible';
              wrapper.style.boxSizing = 'content-box';
              
              // Force multiple reflows to ensure styles are fully applied
              void wrapper.offsetHeight;
              void wrapper.offsetWidth;
              void wrapper.offsetHeight;
              
              // Measure the wrapper's content size
              const contentWidth = wrapper.offsetWidth;
              const contentHeight = wrapper.offsetHeight;
              
              // Restore original styles by removing inline styles we added
              wrapper.style.removeProperty('display');
              wrapper.style.removeProperty('width');
              wrapper.style.removeProperty('height');
              wrapper.style.removeProperty('overflow');
              wrapper.style.removeProperty('box-sizing');
              
              // If content is less than 500x500, center it
              if (contentWidth > 0 && contentHeight > 0 && contentWidth < 500 && contentHeight < 500) {
                wrapper.style.display = 'flex';
                wrapper.style.alignItems = 'center';
                wrapper.style.justifyContent = 'center';
              }
            });
          });
        }
        
        // Check immediately and after delays to ensure content is rendered and styled
        function runChecks() {
          checkAndCenter();
          setTimeout(checkAndCenter, 50);
          setTimeout(checkAndCenter, 150);
          setTimeout(checkAndCenter, 300);
          setTimeout(checkAndCenter, 500);
          setTimeout(checkAndCenter, 1000);
        }
        
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', runChecks);
        } else {
          runChecks();
        }
        
        // Also check when images or other resources load
        window.addEventListener('load', () => {
          setTimeout(checkAndCenter, 100);
          setTimeout(checkAndCenter, 300);
        });
        
        // Use ResizeObserver to detect size changes
        if (window.ResizeObserver) {
          setTimeout(() => {
            const wrapper = document.querySelector('.component-wrapper');
            if (wrapper) {
              const observer = new ResizeObserver(() => {
                setTimeout(checkAndCenter, 50);
              });
              observer.observe(wrapper);
            }
          }, 500);
        }
      })();
    <\/script>
  
</body>
</html>
`;var i0=`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Component Preview</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    html, body {
      height: 100%;
      margin: 0;
      padding: 0;
    }
    body {
      height: 100%;
      overflow: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #000000;
      color: #ffffff;
    }
    .component-wrapper {
      width: 100%;
      height: 100%;
      padding: 0;
      box-sizing: border-box;
      overflow: auto;
    }
  </style>
</head>
<body>
  <div class="component-wrapper">
    <html><head></head><body><button class="group inline-flex overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(255,255,255,0.1)] rounded-full pt-[1px] pr-[1px] pb-[1px] pl-[1px] relative items-center justify-center">
  <!-- Spinning Border Beam (Visible on Hover) -->
  <span class="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_75%,#ffffff_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
  
  <!-- Default Static Border -->
  <span class="absolute inset-0 rounded-full bg-zinc-800 transition-opacity duration-300 group-hover:opacity-0"></span>
  
  <!-- 3D Button Surface & Content -->
  <span class="flex items-center justify-center gap-2 uppercase transition-colors duration-300 group-hover:text-white text-xs font-medium text-zinc-400 tracking-widest bg-gradient-to-b from-zinc-800 to-zinc-950 w-full h-full rounded-full pt-2.5 pr-6 pb-2.5 pl-6 relative shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
    <span class="relative z-10">Request Demo</span>
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="relative z-10 transition-transform duration-300 group-hover:translate-x-0.5">
      <path d="M5 12h14" class=""></path>
      <path d="m12 5 7 7-7 7" class=""></path>
    </svg>
  </span>
</button></body></html>
  </div>
  
    <script>
      (function() {
        function checkAndCenter() {
          // Use double requestAnimationFrame to ensure DOM is fully painted and layout is stable
          requestAnimationFrame(function() {
            requestAnimationFrame(function() {
              const wrapper = document.querySelector('.component-wrapper');
              if (!wrapper) return;
              
              // Get all child elements
              const children = Array.from(wrapper.children);
              if (children.length === 0) return;
              
              // Temporarily override wrapper styles to shrink-wrap for measurement
              // Set inline styles to shrink-wrap (inline styles override CSS)
              wrapper.style.display = 'inline-block';
              wrapper.style.width = 'auto';
              wrapper.style.height = 'auto';
              wrapper.style.overflow = 'visible';
              wrapper.style.boxSizing = 'content-box';
              
              // Force multiple reflows to ensure styles are fully applied
              void wrapper.offsetHeight;
              void wrapper.offsetWidth;
              void wrapper.offsetHeight;
              
              // Measure the wrapper's content size
              const contentWidth = wrapper.offsetWidth;
              const contentHeight = wrapper.offsetHeight;
              
              // Restore original styles by removing inline styles we added
              wrapper.style.removeProperty('display');
              wrapper.style.removeProperty('width');
              wrapper.style.removeProperty('height');
              wrapper.style.removeProperty('overflow');
              wrapper.style.removeProperty('box-sizing');
              
              // If content is less than 500x500, center it
              if (contentWidth > 0 && contentHeight > 0 && contentWidth < 500 && contentHeight < 500) {
                wrapper.style.display = 'flex';
                wrapper.style.alignItems = 'center';
                wrapper.style.justifyContent = 'center';
              }
            });
          });
        }
        
        // Check immediately and after delays to ensure content is rendered and styled
        function runChecks() {
          checkAndCenter();
          setTimeout(checkAndCenter, 50);
          setTimeout(checkAndCenter, 150);
          setTimeout(checkAndCenter, 300);
          setTimeout(checkAndCenter, 500);
          setTimeout(checkAndCenter, 1000);
        }
        
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', runChecks);
        } else {
          runChecks();
        }
        
        // Also check when images or other resources load
        window.addEventListener('load', () => {
          setTimeout(checkAndCenter, 100);
          setTimeout(checkAndCenter, 300);
        });
        
        // Use ResizeObserver to detect size changes
        if (window.ResizeObserver) {
          setTimeout(() => {
            const wrapper = document.querySelector('.component-wrapper');
            if (wrapper) {
              const observer = new ResizeObserver(() => {
                setTimeout(checkAndCenter, 50);
              });
              observer.observe(wrapper);
            }
          }, 500);
        }
      })();
    <\/script>
  
</body>
</html>
`;var a0=`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Uploading \u2014 glowing border microinteraction</title>
<style>
  :root{ color-scheme: dark; }
  html,body{ margin:0; height:100%; background:#1d1d1d; }
  body{
    display:flex; align-items:center; justify-content:center;
    overflow:hidden; -webkit-font-smoothing:antialiased;
  }
  #stage{
    position:relative;
    width:min(100vw,100svh); height:min(100vw,100svh);
    background:#1d1d1d;
  }
  #c{ position:absolute; inset:0; width:100%; height:100%; display:block; }
</style>
</head>
<body>
<div id="stage"><canvas id="c"></canvas></div>
<script>
(function(){
  'use strict';

  /* ---------- reference frame: everything authored in a 2048px square ---------- */
  var REF = 2048;
  var CX = 1024 - 22, CY = 1024 + 11.5;   /* button centre in the source recording */
  var PW = 976, PH = 345, PR = 100;       /* plate */
  var GAP = 50;                            /* plate edge -> track centre */
  var TW = PW + 2*GAP, TH = PH + 2*GAP, TR = PR + GAP;
  var TRACK_W = 13, CORE_W = 14, GLOW_W = 12;

  var DUR = 2.70;                          /* one lap of the trace = one loop */
  var TAIL = 0.389;                        /* comet length, in laps */
  var SHIM_OFF = 0.898;                    /* lap phase where the text sweep turns at the left */
  var TXT_W = 778, TXT_CAP = 120, TXT_BASE = 1093;
  var FONT = '300 100px -apple-system, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Inter, system-ui, "Segoe UI", Roboto, sans-serif';

  var cv = document.getElementById('c'), ctx = cv.getContext('2d');
  var gl = document.createElement('canvas'), gx = gl.getContext('2d');   /* comet, glow tint */
  var co = document.createElement('canvas'), cox = co.getContext('2d');  /* comet, core tint */
  var S = 0, k = 1, dpr = 1;
  var canFilter = (function(){ var t=document.createElement('canvas').getContext('2d'); t.filter='blur(2px)'; return t.filter!=='none'; })();

  /* ---------- geometry: rounded rect sampled by arc length ---------- */
  function rrPath(c, cx, cy, w, h, r){
    var x = cx - w/2, y = cy - h/2;
    c.beginPath();
    c.moveTo(x+r, y);
    c.lineTo(x+w-r, y);   c.arcTo(x+w, y,     x+w, y+r,     r);
    c.lineTo(x+w, y+h-r); c.arcTo(x+w, y+h,   x+w-r, y+h,   r);
    c.lineTo(x+r, y+h);   c.arcTo(x,   y+h,   x,   y+h-r,   r);
    c.lineTo(x, y+r);     c.arcTo(x,   y,     x+r, y,       r);
    c.closePath();
  }

  /* point on the track outline at arc length s, starting at the top-left corner
     tangent point and running clockwise */
  var SW = TW - 2*TR, SH = TH - 2*TR, ARC = Math.PI*TR/2;
  var PERIM = 2*SW + 2*SH + 4*ARC;
  var L = CX - TW/2, T = CY - TH/2, R = CX + TW/2, B = CY + TH/2;
  function ptAt(s){
    s = s - Math.floor(s/PERIM)*PERIM;
    var a;
    if(s < SW)  return [L+TR+s, T];
    s -= SW;
    if(s < ARC){ a = s/TR; return [R-TR+TR*Math.sin(a), T+TR-TR*Math.cos(a)]; }
    s -= ARC;
    if(s < SH)  return [R, T+TR+s];
    s -= SH;
    if(s < ARC){ a = s/TR; return [R-TR+TR*Math.cos(a), B-TR+TR*Math.sin(a)]; }
    s -= ARC;
    if(s < SW)  return [R-TR-s, B];
    s -= SW;
    if(s < ARC){ a = s/TR; return [L+TR-TR*Math.sin(a), B-TR+TR*Math.cos(a)]; }
    s -= ARC;
    if(s < SH)  return [L, B-TR-s];
    s -= SH;
    a = s/TR; return [L+TR-TR*Math.cos(a), T+TR-TR*Math.sin(a)];
  }

  /* brightness along the comet, sampled off the source clip every 0.0139 lap:
     a hot head, a flat core, then a long uneven fade */
  var TAPER = [1.16,1.09,1.03,1.00,1.02,1.00,1.00,1.00,1.00,0.98,0.97,0.94,0.91,0.89,
               0.84,0.77,0.74,0.65,0.61,0.52,0.43,0.40,0.27,0.23,0.17,0.12,0.075,0.02,0];
  var TSTEP = TAIL/(TAPER.length-1);
  function taper(u){                        /* u = laps behind the head */
    if(u < 0 || u >= TAIL) return 0;
    var f = u/TSTEP, i = Math.floor(f);
    return TAPER[i] + (TAPER[i+1]-TAPER[i])*(f-i);
  }

  /* ---------- sizing ---------- */
  function resize(){
    var st = document.getElementById('stage');
    S = st.clientWidth || 1;
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    cv.width = gl.width = co.width = Math.round(S*dpr);
    cv.height = gl.height = co.height = Math.round(S*dpr);
    k = S*dpr/REF;
    fitText();
    render(now);
  }

  /* ---------- text: fit cap-height and total width to the recording ---------- */
  var glyphs = [], fontPx = 169, tracking = 0, textX = 0;
  function fitText(){
    var word = 'Uploading', n = word.length, probe = 200;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.font = FONT.replace('100px', probe+'px');
    var cap = ctx.measureText('U').actualBoundingBoxAscent || probe*0.7;
    fontPx = probe * (TXT_CAP*k) / cap;                 /* cap height matches the source */
    ctx.font = FONT.replace('100px', fontPx+'px');
    glyphs = [];
    var advSum = 0, m;
    for(var i=0;i<n;i++){
      m = ctx.measureText(word[i]);
      glyphs.push({ch:word[i], w:m.width});
      if(i < n-1) advSum += m.width;
    }
    /* the source was measured as ink extents, so lay out to ink, not to advances */
    var lead = ctx.measureText(word[0]).actualBoundingBoxLeft;
    var trail = ctx.measureText(word[n-1]).actualBoundingBoxRight;
    tracking = (TXT_W*k - trail - lead - advSum) / (n-1);
    textX = (CX + 4)*k - TXT_W*k/2 + lead;
  }

  /* ---------- painting ---------- */
  /* the comet is painted opaque into its own layer, then added over the scene, so
     overlapping segments never double-blend */
  function paintComet(c, head, col, hot, width){
    c.setTransform(1,0,0,1,0,0);
    c.clearRect(0,0,c.canvas.width,c.canvas.height);
    c.lineCap = 'round';
    c.lineWidth = width*k;
    var step = 6;                                   /* ref px per segment */
    var n = Math.ceil(TAIL*PERIM/step);
    for(var i=n;i>=1;i--){
      var s1 = head - i*step, s0 = head - (i-1)*step;
      var a = taper((i*step)/PERIM);
      if(a <= 0.002) continue;
      var f = Math.min(a, 1.30), x = Math.max(0, f-1);
      var r = Math.round(Math.min(255, col[0]*f + hot[0]*x));
      var g = Math.round(Math.min(255, col[1]*f + hot[1]*x));
      var b = Math.round(Math.min(255, col[2]*f + hot[2]*x));
      var p1 = ptAt(s1), mid = ptAt((s1+s0)/2), p0 = ptAt(s0);
      c.strokeStyle = 'rgb('+r+','+g+','+b+')';
      c.beginPath();
      c.moveTo(p1[0]*k, p1[1]*k);
      c.lineTo(mid[0]*k, mid[1]*k);
      c.lineTo(p0[0]*k, p0[1]*k);
      c.stroke();
    }
  }

  function plate(c){
    var x = CX - PW/2, y = CY - PH/2;
    var grd = c.createLinearGradient(0, y*k, 0, (y+PH)*k);
    grd.addColorStop(0, '#2e3242');
    grd.addColorStop(0.55, '#2b2f3c');
    grd.addColorStop(1, '#272c36');
    rrPath(c, CX*k, CY*k, PW*k, PH*k, PR*k);
    c.fillStyle = grd;
    c.fill();

    /* neumorphic edges: a hairline of white light just inside the top, a cool
       bounce just inside the bottom */
    c.lineWidth = 5*k;
    var hg = c.createLinearGradient(0, y*k, 0, (y+PH)*k);
    hg.addColorStop(0,    'rgba(226,233,255,0.125)');
    hg.addColorStop(0.10, 'rgba(226,233,255,0)');
    hg.addColorStop(0.90, 'rgba(80,100,255,0)');
    hg.addColorStop(1,    'rgba(80,100,255,0.22)');
    rrPath(c, CX*k, CY*k, (PW-13)*k, (PH-13)*k, (PR-6.5)*k);
    c.strokeStyle = hg;
    c.stroke();
  }

  function label(c, ph){
    /* shimmer: a soft band ping-pongs across the word, twice per lap */
    var q = ph - SHIM_OFF; q -= Math.floor(q);
    var u = q < 0.5 ? q/0.5 : (1-q)/0.5;
    var x0 = textX, w = TXT_W*k;
    var bc = x0 + w*(-0.2375 + 1.475*u);   /* sweeps clear of both ends before turning */
    var bw = w*0.22;
    var g = c.createLinearGradient(bc-bw, 0, bc+bw, 0);
    g.addColorStop(0,    'rgb(83,92,135)');
    g.addColorStop(0.30, 'rgb(97,106,150)');
    g.addColorStop(0.5,  'rgb(133,141,189)');
    g.addColorStop(0.70, 'rgb(97,106,150)');
    g.addColorStop(1,    'rgb(83,92,135)');
    c.fillStyle = g;
    c.strokeStyle = g;
    c.font = FONT.replace('100px', fontPx+'px');
    c.textBaseline = 'alphabetic';
    var x = textX;
    for(var i=0;i<glyphs.length;i++){
      if(glyphs[i].ch === 'g') doubleStoreyG(c);
      else{
        /* the source face sits between Light and Regular, so nudge the stems out */
        c.fillText(glyphs[i].ch, x, TXT_BASE*k);
        c.lineWidth = 1.9*k;
        c.strokeText(glyphs[i].ch, x, TXT_BASE*k);
      }
      x += glyphs[i].w + tracking;
    }
  }

  /* the source sets a double-storey g, which no system face here carries, so it is
     drawn as a monoline: upper bowl, ear, link, lower loop */
  function doubleStoreyG(c){
    c.save();
    c.lineWidth = 11.5*k;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(1327*k, 1050*k); c.lineTo(1319*k, 1084*k);              /* link down the left */
    c.stroke();
    c.beginPath();
    c.ellipse(1351.5*k, 1035*k, 30*k, 21*k, 0, 0, Math.PI*2);        /* bowl */
    c.stroke();
    c.beginPath();
    c.ellipse(1353*k, 1100*k, 35*k, 16*k, 0, 0, Math.PI*2);          /* descending loop */
    c.stroke();
    c.beginPath();
    c.moveTo(1352*k, 1011*k);                                        /* ear */
    c.quadraticCurveTo(1382*k, 1003*k, 1390*k, 1017*k);
    c.stroke();
    c.restore();
  }

  function render(t){
    if(!S) return;
    var ph = (t/DUR) % 1; if(ph < 0) ph += 1;
    var head = ph*PERIM;

    ctx.setTransform(1,0,0,1,0,0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.filter = 'none';
    ctx.fillStyle = '#1d1d1d';
    ctx.fillRect(0,0,cv.width,cv.height);

    /* the faint track the light runs on */
    rrPath(ctx, CX*k, CY*k, TW*k, TH*k, TR*k);
    ctx.lineWidth = TRACK_W*k;
    ctx.strokeStyle = 'rgba(120,140,255,0.048)';
    ctx.stroke();

    /* the travelling light: a blue bloom under a pale core */
    paintComet(gx,  head, [95,125,242], [50,70,120], GLOW_W);
    paintComet(cox, head, [82,90,110],  [70,60,40],  CORE_W);
    ctx.globalCompositeOperation = 'lighter';
    if(canFilter){
      ctx.filter = 'blur('+(28*k)+'px)'; ctx.globalAlpha = 0.62; ctx.drawImage(gl,0,0);
      ctx.filter = 'blur('+(8*k)+'px)';  ctx.globalAlpha = 0.45; ctx.drawImage(gl,0,0);
      ctx.filter = 'blur('+(1.8*k)+'px)';ctx.globalAlpha = 1;    ctx.drawImage(co,0,0);
      ctx.filter = 'none';
    }else{
      ctx.shadowColor = 'rgba(88,122,255,0.9)';
      ctx.shadowBlur = 26*k; ctx.globalAlpha = 0.7; ctx.drawImage(gl,0,0);
      ctx.shadowBlur = 8*k;  ctx.globalAlpha = 0.8; ctx.drawImage(gl,0,0);
      ctx.shadowBlur = 0;    ctx.globalAlpha = 1;   ctx.drawImage(co,0,0);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    /* the button sits over the light, so the inner half of the glow is hidden */
    plate(ctx);
    label(ctx, ph);
  }

  /* ---------- clock ---------- */
  var now = 0, playing = true, last = null;
  function frame(ts){
    if(playing){
      if(last != null) now = (now + (ts-last)/1000) % DUR;
      last = ts;
      render(now);
    }else last = ts;
    requestAnimationFrame(frame);
  }

  window.__DUR = DUR;
  window.__seek = function(t){ playing = false; now = ((t % DUR) + DUR) % DUR; render(now); };
  window.__play = function(){ playing = true; last = null; };
  window.__pause = function(){ playing = false; };
  window.__time = function(){ return now; };

  window.addEventListener('resize', resize);
  if(window.ResizeObserver) new ResizeObserver(resize).observe(document.getElementById('stage'));
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ fitText(); render(now); });
  resize();
  requestAnimationFrame(frame);
})();
<\/script>
</body>
</html>
`;var an=`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Diagnostics</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"><\/script>
    <style>
        :root {
            color-scheme: dark;

            /* procedural noise fields, generated inline so the document stays self-contained.
               fractal noise for print grain, anisotropic noise for brushed metal,
               and a low-frequency field for smudge and dust on the cover glass. */
            --tex-grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23g)'/%3E%3C/svg%3E");
            --tex-metal: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.008 1.5' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23m)'/%3E%3C/svg%3E");
            --tex-dust: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='d'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.014' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='0.6'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23d)'/%3E%3C/svg%3E");
        }

        /* every dimension inside a gauge is expressed against the card width,
           so one instrument reads identically at 300px and at 900px */
        .gauge-card { container-type: inline-size; }

        /* ---------- mounting plate ---------- */
        .plate {
            position: absolute;
            inset: 0;
            border-radius: 11.5cqw;
            background: radial-gradient(120% 100% at 30% 0%, #121215 0%, #09090A 55%, #060607 100%);
            border: 1px solid rgba(255,255,255,.03);
            box-shadow:
                0px 1px 1px -0.5px rgba(0,0,0,.5),
                0px 3px 3px -1.5px rgba(0,0,0,.4),
                0px 6px 6px -3px rgba(0,0,0,.35),
                0px 12px 12px -6px rgba(0,0,0,.3),
                0px 24px 24px -12px rgba(0,0,0,.25);
            transition: border-color .5s;
        }
        /* fine anodised tooth so the plate is not a flat fill */
        .plate::before {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            background-image: var(--tex-grain), var(--tex-dust);
            background-size: 34cqw 34cqw, 170% 170%;
            background-blend-mode: soft-light, normal;
            mix-blend-mode: screen;
            opacity: .07;
            pointer-events: none;
        }
        .gauge-card:hover .plate { border-color: rgba(255,255,255,.08); }

        /* ---------- instrument shell ---------- */
        .shell {
            position: absolute;
            inset: 13cqw;
            border-radius: 50%;
            padding: 2.2%;
            background:
                var(--tex-metal),
                conic-gradient(from 210deg, #3a3a3d 0deg, #17171a 60deg, #2c2c30 130deg, #0d0d0f 200deg, #313135 280deg, #131316 340deg, #3a3a3d 360deg);
            background-size: 100% 100%, auto;
            background-blend-mode: overlay, normal;
            box-shadow:
                0 18px 40px -12px rgba(0,0,0,.9),
                0 2px 0 rgba(255,255,255,.05),
                inset 0 2px 6px rgba(255,255,255,.10),
                inset 0 -6px 14px rgba(0,0,0,.65);
        }
        .bezel {
            position: relative;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            padding: 3.4%;
            background: radial-gradient(closest-side, #0b0b0d 76%, #212125 92%, #08080a 100%);
            box-shadow: inset 0 1px 1px rgba(255,255,255,.10), inset 0 -3px 8px rgba(0,0,0,.8);
        }
        /* knurled grip ring milled into the bezel edge */
        .bezel::before {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: repeating-conic-gradient(from 0deg, rgba(255,255,255,.16) 0deg 0.5deg, rgba(0,0,0,0) 0.5deg 2.2deg);
            -webkit-mask-image: radial-gradient(closest-side, transparent 92%, #000 93.5%, #000 99%, transparent 100%);
            mask-image: radial-gradient(closest-side, transparent 92%, #000 93.5%, #000 99%, transparent 100%);
            opacity: .45;
            pointer-events: none;
        }
        /* brushed tooling marks across the bezel ring */
        .bezel::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background-image: var(--tex-metal);
            background-size: 100% 100%;
            -webkit-mask-image: radial-gradient(closest-side, transparent 95%, #000 96.5%, #000 100%);
            mask-image: radial-gradient(closest-side, transparent 95%, #000 96.5%, #000 100%);
            mix-blend-mode: overlay;
            opacity: .55;
            pointer-events: none;
        }
        /* a turned stainless pan head sunk into a counterbored well */
        .screw {
            position: absolute;
            width: 5cqw;
            aspect-ratio: 1;
            border-radius: 50%;
            background:
                radial-gradient(circle at 34% 26%, rgba(255,255,255,.55) 0%, rgba(255,255,255,.08) 26%, rgba(255,255,255,0) 46%),
                radial-gradient(closest-side, rgba(0,0,0,0) 58%, rgba(0,0,0,.45) 84%, rgba(0,0,0,.7) 100%),
                conic-gradient(from calc(var(--a, 0deg) - 52deg),
                    #9a9ba1 0deg, #43444a 34deg, #c3c4ca 74deg, #4d4e55 118deg,
                    #a7a8ae 168deg, #37383d 214deg, #b2b3b9 262deg, #45464c 312deg, #9a9ba1 360deg);
            box-shadow:
                0 0 0 .16cqw rgba(0,0,0,.6),
                0 .12cqw 0 .16cqw rgba(255,255,255,.05),
                0 .3cqw .6cqw rgba(0,0,0,.75),
                inset 0 -.16cqw .32cqw rgba(0,0,0,.6),
                inset 0 .12cqw .24cqw rgba(255,255,255,.4);
        }
        /* cross drive: dark recess with a lit lower lip so it reads as cut, not printed */
        .screw::before {
            content: "";
            position: absolute;
            inset: 22%;
            transform: rotate(var(--a, 0deg));
            background:
                linear-gradient(#050506, #1e1e23) center / 100% 20% no-repeat,
                linear-gradient(#050506, #1e1e23) center / 20% 100% no-repeat,
                linear-gradient(rgba(255,255,255,.62), rgba(255,255,255,.62)) center calc(50% + .11cqw) / 100% 20% no-repeat,
                linear-gradient(rgba(255,255,255,.62), rgba(255,255,255,.62)) calc(50% + .11cqw) center / 20% 100% no-repeat;
        }
        /* turning marks on the head */
        .screw::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background-image: var(--tex-metal);
            background-size: 100% 100%;
            mix-blend-mode: overlay;
            opacity: .45;
        }

        /* ---------- dial face ---------- */
        .face {
            container-type: inline-size;
            position: relative;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            overflow: hidden;
            box-shadow: inset 0 5px 16px rgba(0,0,0,.5), inset 0 -2px 9px rgba(0,0,0,.4);
        }
        .layer { position: absolute; inset: 0; pointer-events: none; }

        /* a full-bleed square rotated about its centre carries its child around the dial */
        .spoke { position: absolute; inset: 0; }

        .tick {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            border-radius: 1px;
        }
        .tick.minor { top: 9%; width: 0.9%; height: 2.8%; opacity: .5; }
        .tick.major { top: 8%; width: 1.8%; height: 6.4%; }

        .numeral {
            position: absolute;
            left: 50%;
            top: 17.5%;
            line-height: 1;
            white-space: nowrap;
            font-variant-numeric: tabular-nums;
        }

        /* ---------- needle ---------- */
        .needle {
            position: absolute;
            inset: 0;
            transform: rotate(var(--angle, 0deg));
            transition: transform var(--needle-duration, 1200ms) var(--needle-ease, cubic-bezier(.2,.9,.25,1));
            will-change: transform;
        }
        .flutter { position: absolute; inset: 0; }
        .blade {
            position: absolute;
            left: 50%;
            top: 11.5%;
            bottom: 50%;
            width: 3.2%;
            transform: translateX(-50%);
            clip-path: polygon(41% 0, 59% 0, 100% 97%, 100% 100%, 0 100%, 0 97%);
            filter: drop-shadow(0 3px 6px rgba(0,0,0,.55));
        }
        .blade::after {
            content: "";
            position: absolute;
            inset: 7% 40% 20% 40%;
            border-radius: 999px;
            background: linear-gradient(rgba(255,255,255,.34), rgba(255,255,255,0));
        }
        .tail {
            position: absolute;
            left: 50%;
            top: 50%;
            width: 2%;
            height: 9.5%;
            transform: translateX(-50%);
            border-radius: 0 0 999px 999px;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,.5));
        }
        .hub {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            border-radius: 50%;
            background: radial-gradient(circle at 34% 30%, #5c5c63, #1b1b1f 60%, #050506);
            box-shadow: 0 3px 8px rgba(0,0,0,.75), inset 0 1px 2px rgba(255,255,255,.35);
            display: grid;
            place-items: center;
        }

        /* ---------- glass ---------- */
        .glass {
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background:
                radial-gradient(120% 78% at 22% 6%, rgba(255,255,255,.20) 0%, rgba(255,255,255,.05) 32%, rgba(255,255,255,0) 56%),
                linear-gradient(148deg, rgba(255,255,255,.12) 0%, rgba(255,255,255,0) 40%);
            mix-blend-mode: screen;
            pointer-events: none;
        }
        .glass::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: 50%;
            box-shadow: inset 0 0 20px rgba(0,0,0,.5), inset 0 1px 1px rgba(255,255,255,.2);
        }
        /* smudge and settled dust caught by the raking highlight */
        .glass-dust {
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background-image: var(--tex-dust), var(--tex-grain);
            background-size: 130% 130%, 30.03cqw 30.03cqw;
            mix-blend-mode: soft-light;
            opacity: .3;
            pointer-events: none;
        }

        /* printed-dial tooth, held under the ticks and numerals */
        .face-grain {
            position: absolute;
            inset: 0;
            background-image: var(--tex-grain);
            background-size: 25.4cqw 25.4cqw;
            mix-blend-mode: overlay;
            opacity: .13;
            pointer-events: none;
        }

        /* ---------- centre stack typography ---------- */
        .stack { position: absolute; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; }
        .cap { font-size: 2.89cqw; letter-spacing: .42em; text-indent: .42em; line-height: 1; }
        .cap-sm { font-size: 2.43cqw; letter-spacing: .3em; text-indent: .3em; line-height: 1; }
        .readout { font-size: 8.55cqw; font-weight: 300; line-height: 1; font-variant-numeric: tabular-nums; }

        /* ---------- motion ---------- */
        @keyframes flutter { 0%, 100% { transform: rotate(-.4deg); } 50% { transform: rotate(.4deg); } }
        .flutter[data-live] { animation: flutter 2.6s ease-in-out infinite; }

        @keyframes pulse-soft { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
        .pulse { animation: pulse-soft 1.4s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
            .needle, [data-peak], [data-soc] { transition: none !important; }
            .flutter[data-live], .pulse { animation: none !important; }
            [data-anim] { transition: none !important; }
        }
    </style>
</head>
<body class="bg-black min-h-screen text-white font-sans flex flex-col items-center justify-center p-6 sm:p-12 selection:bg-[#E26226] selection:text-white">

    <!-- Header Section -->
    <div data-anim="true" class="max-w-4xl w-full mb-16 text-center" style="opacity: 0; transform: translateY(20px); filter: blur(4px); transition: all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);">
        <h1 class="text-3xl sm:text-5xl font-extralight tracking-tight mb-4 text-white/90" id="hero-title">
            Performance Diagnostics
        </h1>
        <p class="text-white/40 text-sm sm:text-base max-w-xl mx-auto font-extralight" id="hero-subtitle">
            Advanced tracking interfaces engineered for extreme conditions. Analyze vital statistics instantly with unmatched precision.
        </p>
    </div>

    <!-- Dashboard Container -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 w-full max-w-5xl justify-items-center">

        <!-- Card 1: Tachometer -->
        <div id="gauge-tachometer" data-anim="true" data-gauge="tachometer" class="gauge-card w-full max-w-[340px] aspect-square relative group" style="opacity: 0; transform: translateY(20px); filter: blur(4px); transition: all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1); transition-delay: 100ms;">
            <div class="plate">
                <span class="screw" style="--a:26deg;top:6.4cqw;left:6.4cqw"></span>
                <span class="screw" style="--a:-15deg;top:6.4cqw;right:6.4cqw"></span>
                <span class="screw" style="--a:42deg;bottom:6.4cqw;left:6.4cqw"></span>
                <span class="screw" style="--a:7deg;bottom:6.4cqw;right:6.4cqw"></span>
                <div class="shell">
                    <div class="bezel">
                        <div class="face" style="background: radial-gradient(closest-side at 50% 32%, #F58135 0%, #E76A2A 44%, #D0541B 74%, #B94512 100%);">
                            <!-- machined sunburst -->
                            <div class="layer" style="background: repeating-conic-gradient(from 0deg, rgba(255,255,255,.055) 0deg 1.2deg, rgba(0,0,0,.05) 1.2deg 2.4deg); -webkit-mask-image: radial-gradient(closest-side, #000 0%, #000 58%, transparent 66%); mask-image: radial-gradient(closest-side, #000 0%, #000 58%, transparent 66%); opacity:.6;"></div>
                            <!-- scale band with redline -->
                            <div class="layer" data-zone-band style="-webkit-mask-image: radial-gradient(closest-side, transparent 88%, #000 89%, #000 95.5%, transparent 96.5%); mask-image: radial-gradient(closest-side, transparent 88%, #000 89%, #000 95.5%, transparent 96.5%);"></div>

                            <div class="layer" data-ticks></div>
                            <div class="layer" data-numerals></div>

                            <div class="stack" style="top:31%">
                                <span class="cap-sm text-black/55 font-medium">r/min</span>
                                <span class="cap-sm text-black/40" style="margin-top:0.81cqw">&times;1000</span>
                            </div>

                            <!-- oil-temperature sub-dial -->
                            <div class="absolute left-1/2 top-[69%] -translate-x-1/2 -translate-y-1/2 w-[24%] aspect-square rounded-full overflow-hidden border border-black/45 shadow-[inset_0_3px_8px_rgba(0,0,0,.55)]" style="background: radial-gradient(closest-side at 50% 30%, #8C3A11, #6E2A08);">
                                <div class="layer" data-subticks></div>
                                <span class="absolute left-1/2 bottom-[15%] -translate-x-1/2 text-white/55 whitespace-nowrap" style="font-size:1.96cqw;letter-spacing:.2em;text-indent:.2em">TEMP &deg;C</span>
                                <div class="needle" data-subneedle style="--needle-duration:1700ms">
                                    <i class="blade" style="top:19%;width:5.5%;background:linear-gradient(#FCA5A5,#B91C1C)"></i>
                                </div>
                                <div class="hub" style="width:15%"></div>
                            </div>

                            <div class="needle" data-needle style="--needle-ease:cubic-bezier(.16,1.28,.4,1)">
                                <div class="flutter">
                                    <i class="blade" style="background:linear-gradient(#F87171,#DC2626 50%,#991B1B)"></i>
                                    <i class="tail" style="background:linear-gradient(#7F1D1D,#450A0A)"></i>
                                </div>
                            </div>
                            <div class="hub" style="width:9%">
                                <span class="block w-[40%] aspect-square rounded-full bg-[#DC2626] shadow-[0_0_6px_rgba(220,38,38,.85)]"></span>
                            </div>
                            <div class="face-grain"></div>
                            <div class="glass"></div>
                            <div class="glass-dust"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Card 2: Speedometer -->
        <div id="gauge-speedometer" data-anim="true" data-gauge="speedometer" class="gauge-card w-full max-w-[340px] aspect-square relative group" style="opacity: 0; transform: translateY(20px); filter: blur(4px); transition: all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1); transition-delay: 300ms;">
            <div class="plate">
                <span class="screw" style="--a:-33deg;top:6.4cqw;left:6.4cqw"></span>
                <span class="screw" style="--a:18deg;top:6.4cqw;right:6.4cqw"></span>
                <span class="screw" style="--a:5deg;bottom:6.4cqw;left:6.4cqw"></span>
                <span class="screw" style="--a:-48deg;bottom:6.4cqw;right:6.4cqw"></span>
                <div class="shell">
                    <div class="bezel">
                        <div class="face" style="background: radial-gradient(closest-side at 50% 28%, #1d1d21 0%, #141416 50%, #0a0a0b 100%);">
                            <!-- filled travel: a soft inner wash plus a bright rim arc -->
                            <div class="layer" data-progress-wash style="-webkit-mask-image: radial-gradient(closest-side, transparent 66%, #000 80%, #000 86%, transparent 89%); mask-image: radial-gradient(closest-side, transparent 66%, #000 80%, #000 86%, transparent 89%); opacity:.11;"></div>
                            <div class="layer" data-zone-band style="-webkit-mask-image: radial-gradient(closest-side, transparent 88%, #000 89%, #000 95.5%, transparent 96.5%); mask-image: radial-gradient(closest-side, transparent 88%, #000 89%, #000 95.5%, transparent 96.5%);"></div>
                            <div class="layer" data-progress-arc style="-webkit-mask-image: radial-gradient(closest-side, transparent 88%, #000 89%, #000 95.5%, transparent 96.5%); mask-image: radial-gradient(closest-side, transparent 88%, #000 89%, #000 95.5%, transparent 96.5%);"></div>

                            <div class="layer" data-ticks></div>
                            <div class="layer" data-numerals></div>

                            <!-- peak-hold marker -->
                            <div class="spoke" data-peak style="transition: transform 900ms cubic-bezier(.2,.9,.25,1)">
                                <i class="absolute left-1/2 top-[7.4%] -translate-x-1/2 w-[1.3%] h-[4%] bg-white/85 rounded-[1px] shadow-[0_0_7px_rgba(255,255,255,.7)]"></i>
                            </div>

                            <div class="stack" style="top:29%">
                                <iconify-icon icon="solar:shield-star-linear" class="text-white/25" style="font-size:6.24cqw"></iconify-icon>
                                <span class="cap-sm text-white/30" style="margin-top:1.39cqw">km/h</span>
                            </div>

                            <div class="stack" style="top:58%">
                                <span data-readout class="readout text-[#E26226]" style="text-shadow:0 0 12px rgba(226,98,38,.45)">0</span>
                            </div>

                            <!-- odometer -->
                            <div class="stack items-center" style="top:77%">
                                <div class="bg-black/85 border border-white/10 rounded shadow-[inset_0_1px_3px_rgba(0,0,0,.9)] flex flex-col items-center" style="padding:0.92cqw 1.85cqw">
                                    <div class="text-[#E26226] font-mono flex items-center" style="font-size:3.93cqw;letter-spacing:.14em;gap:0.58cqw">
                                        <span>3</span><span>1</span><span>5</span><span>9</span><span class="bg-[#E26226] text-black rounded-[2px]" style="padding:0 0.81cqw">5</span>
                                    </div>
                                    <span class="text-white/30 uppercase" style="font-size:2.08cqw;letter-spacing:.28em;margin-top:0.81cqw">km total</span>
                                </div>
                            </div>

                            <div class="needle" data-needle style="--needle-ease:cubic-bezier(.16,1.28,.4,1)">
                                <div class="flutter">
                                    <i class="blade" style="background:linear-gradient(#6EE7A0,#22C55E 50%,#15803D); filter: drop-shadow(0 0 7px rgba(74,222,128,.6))"></i>
                                    <i class="tail" style="background:linear-gradient(#166534,#052E16)"></i>
                                </div>
                            </div>
                            <div class="hub" style="width:8.5%">
                                <span class="block w-[38%] aspect-square rounded-full bg-[#4ADE80]/85 shadow-[0_0_6px_rgba(74,222,128,.75)]"></span>
                            </div>
                            <div class="face-grain"></div>
                            <div class="glass"></div>
                            <div class="glass-dust"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Card 3: Turbo Boost -->
        <div id="gauge-boost" data-anim="true" data-gauge="boost" class="gauge-card w-full max-w-[340px] aspect-square relative group" style="opacity: 0; transform: translateY(20px); filter: blur(4px); transition: all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1); transition-delay: 500ms;">
            <div class="plate">
                <span class="screw" style="--a:12deg;top:6.4cqw;left:6.4cqw"></span>
                <span class="screw" style="--a:-40deg;top:6.4cqw;right:6.4cqw"></span>
                <span class="screw" style="--a:29deg;bottom:6.4cqw;left:6.4cqw"></span>
                <span class="screw" style="--a:-6deg;bottom:6.4cqw;right:6.4cqw"></span>
                <div class="shell">
                    <div class="bezel">
                        <div class="face" style="background: radial-gradient(closest-side at 50% 26%, #17324F 0%, #0F172A 48%, #030816 100%);">
                            <div class="layer" style="background: repeating-conic-gradient(from 0deg, rgba(56,189,248,.06) 0deg 1.4deg, rgba(0,0,0,0) 1.4deg 2.8deg); -webkit-mask-image: radial-gradient(closest-side, #000 0%, #000 56%, transparent 64%); mask-image: radial-gradient(closest-side, #000 0%, #000 56%, transparent 64%);"></div>
                            <div class="layer" data-zone-band style="-webkit-mask-image: radial-gradient(closest-side, transparent 88%, #000 89%, #000 95.5%, transparent 96.5%); mask-image: radial-gradient(closest-side, transparent 88%, #000 89%, #000 95.5%, transparent 96.5%);"></div>

                            <div class="layer" data-ticks></div>
                            <div class="layer" data-numerals></div>

                            <div class="stack" style="top:30%">
                                <iconify-icon icon="solar:wind-linear" class="text-cyan-400/80" style="font-size:6.47cqw"></iconify-icon>
                                <span class="cap text-white/45" style="margin-top:1.62cqw">BOOST</span>
                            </div>

                            <div class="stack" style="top:57%">
                                <span data-readout class="readout text-cyan-300" style="text-shadow:0 0 12px rgba(34,211,238,.5)">0.00</span>
                                <span class="cap text-cyan-500/70" style="margin-top:1.85cqw">BAR</span>
                            </div>

                            <div class="stack" style="top:79%">
                                <div class="flex items-center text-white/35" style="gap:1.62cqw;font-size:2.19cqw;letter-spacing:.26em">
                                    <span class="rounded-full bg-red-500 pulse" style="width:1.85cqw;height:1.85cqw" data-overboost hidden></span>
                                    <span>WASTEGATE 1.20</span>
                                </div>
                            </div>

                            <div class="needle" data-needle style="--needle-ease:cubic-bezier(.16,1.32,.4,1)">
                                <div class="flutter">
                                    <i class="blade" style="background:linear-gradient(#4DD9F0,#0EB8D7 50%,#0E7490); filter: drop-shadow(0 0 8px rgba(34,211,238,.65))"></i>
                                    <i class="tail" style="background:linear-gradient(#155E75,#083344)"></i>
                                </div>
                            </div>
                            <div class="hub" style="width:9%">
                                <span class="block w-[38%] aspect-square rounded-full bg-cyan-400/85 shadow-[0_0_6px_rgba(34,211,238,.85)]"></span>
                            </div>
                            <div class="face-grain"></div>
                            <div class="glass"></div>
                            <div class="glass-dust"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Card 4: EV Power / Charge -->
        <div id="gauge-power" data-anim="true" data-gauge="power" class="gauge-card w-full max-w-[340px] aspect-square relative group" style="opacity: 0; transform: translateY(20px); filter: blur(4px); transition: all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1); transition-delay: 700ms;">
            <div class="plate">
                <span class="screw" style="--a:47deg;top:6.4cqw;left:6.4cqw"></span>
                <span class="screw" style="--a:3deg;top:6.4cqw;right:6.4cqw"></span>
                <span class="screw" style="--a:-21deg;bottom:6.4cqw;left:6.4cqw"></span>
                <span class="screw" style="--a:35deg;bottom:6.4cqw;right:6.4cqw"></span>
                <div class="shell">
                    <div class="bezel">
                        <div class="face" style="background: radial-gradient(closest-side at 50% 28%, #191624 0%, #111016 50%, #08070B 100%);">
                            <div class="layer" data-zone-band style="-webkit-mask-image: radial-gradient(closest-side, transparent 88%, #000 89%, #000 95.5%, transparent 96.5%); mask-image: radial-gradient(closest-side, transparent 88%, #000 89%, #000 95.5%, transparent 96.5%);"></div>
                            <div class="layer" data-progress-arc style="-webkit-mask-image: radial-gradient(closest-side, transparent 88%, #000 89%, #000 95.5%, transparent 96.5%); mask-image: radial-gradient(closest-side, transparent 88%, #000 89%, #000 95.5%, transparent 96.5%);"></div>

                            <div class="layer" data-ticks></div>
                            <div class="layer" data-numerals></div>

                            <div class="stack" style="top:29%">
                                <iconify-icon icon="solar:bolt-linear" class="text-purple-400/90" style="font-size:6.47cqw"></iconify-icon>
                                <span class="cap text-white/45" style="margin-top:1.62cqw">POWER</span>
                            </div>

                            <div class="stack" style="top:57%">
                                <span data-readout class="readout text-purple-200" style="text-shadow:0 0 12px rgba(192,132,252,.45)">0</span>
                                <span class="cap text-purple-400/70" style="margin-top:1.85cqw">KW</span>
                            </div>

                            <!-- battery state of charge -->
                            <div class="stack" style="top:76%">
                                <div class="rounded-full bg-white/10 overflow-hidden border border-white/10" style="width:23.1cqw;height:1.96cqw">
                                    <div data-soc class="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300 transition-[width] duration-[1400ms] ease-out" style="width:0%"></div>
                                </div>
                                <span class="text-white/35" style="font-size:2.19cqw;letter-spacing:.28em;margin-top:1.39cqw">SOC 72%</span>
                            </div>

                            <div class="needle" data-needle style="--needle-ease:cubic-bezier(.16,1.28,.4,1)">
                                <div class="flutter">
                                    <i class="blade" style="background:linear-gradient(#C88CFA,#9333EA 50%,#6B21A8); filter: drop-shadow(0 0 8px rgba(168,85,247,.6))"></i>
                                    <i class="tail" style="background:linear-gradient(#581C87,#2E1065)"></i>
                                </div>
                            </div>
                            <div class="hub" style="width:9%">
                                <span class="block w-[38%] aspect-square rounded-full bg-purple-400/85 shadow-[0_0_6px_rgba(168,85,247,.85)]"></span>
                            </div>
                            <div class="face-grain"></div>
                            <div class="glass"></div>
                            <div class="glass-dust"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>

    <!-- Script for dial construction, reveal, and instrument motion -->
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            /* ---------- dial specifications ---------- */
            const SPECS = {
                tachometer: {
                    start: -135, sweep: 270, min: 0, max: 7,
                    majorStep: 1, minorPerMajor: 5,
                    numeral: (v) => String(v),
                    numeralStyle: 'font-size:7.39cqw;font-weight:300;color:rgba(0,0,0,.78)',
                    tickColor: (v) => (v >= 5.5 ? '#7F1D1D' : 'rgba(0,0,0,.7)'),
                    zones: [
                        { from: 0, to: 5.5, color: 'rgba(0,0,0,.22)' },
                        { from: 5.5, to: 7, color: 'rgba(185,28,28,.95)' },
                    ],
                    idle: 0, value: 5.2,
                    sub: { start: -110, sweep: 220, min: 40, max: 130, majorStep: 30, minorPerMajor: 3, value: 92 },
                },
                speedometer: {
                    start: -135, sweep: 270, min: 0, max: 160,
                    majorStep: 20, minorPerMajor: 4,
                    numeral: (v) => String(v),
                    numeralStyle: 'font-size:5.31cqw;font-weight:300;color:rgba(255,255,255,.72)',
                    tickColor: (v) => (v >= 140 ? 'rgba(248,113,113,.95)' : 'rgba(255,255,255,.6)'),
                    zones: [
                        { from: 0, to: 140, color: 'rgba(255,255,255,.09)' },
                        { from: 140, to: 160, color: 'rgba(220,38,38,.6)' },
                    ],
                    progress: '#E26226', wash: '#E26226',
                    idle: 0, value: 118, peak: 143,
                    readout: (v) => String(Math.round(v)),
                },
                boost: {
                    start: -135, sweep: 270, min: -1, max: 1.5,
                    majorStep: 0.5, minorPerMajor: 5,
                    numeral: (v) => v.toFixed(1),
                    numeralStyle: 'font-size:4.85cqw;font-weight:300;color:rgba(255,255,255,.7)',
                    tickColor: (v) => (v >= 1.2 ? 'rgba(248,113,113,.95)' : v < 0 ? 'rgba(148,163,184,.65)' : 'rgba(103,232,249,.85)'),
                    zones: [
                        { from: -1, to: 0, color: 'rgba(148,163,184,.55)' },
                        { from: 0, to: 1.2, color: 'rgba(34,211,238,.6)' },
                        { from: 1.2, to: 1.5, color: 'rgba(220,38,38,.9)' },
                    ],
                    idle: -0.85, value: 0.92,
                    readout: (v) => (v >= 0 ? '+' : '\u2212') + Math.abs(v).toFixed(2),
                },
                power: {
                    start: -135, sweep: 270, min: -30, max: 120,
                    majorStep: 30, minorPerMajor: 3,
                    numeral: (v) => (v === -30 ? 'CHG' : String(v)),
                    numeralStyle: 'font-size:4.85cqw;font-weight:300;color:rgba(255,255,255,.68)',
                    tickColor: (v) => (v < 0 ? 'rgba(52,211,153,.85)' : 'rgba(216,180,254,.75)'),
                    zones: [
                        { from: -30, to: 0, color: 'rgba(16,185,129,.7)' },
                        { from: 0, to: 120, color: 'rgba(168,85,247,.3)' },
                    ],
                    progress: '#C084FC', progressFrom: 0,
                    idle: -22, value: 78, soc: 72,
                    readout: (v) => String(Math.round(v)),
                },
            };

            /* ---------- polar helpers ---------- */
            const angleFor = (spec, value) => spec.start + ((value - spec.min) / (spec.max - spec.min)) * spec.sweep;

            const spoke = (angle) => {
                const wrap = document.createElement('div');
                wrap.className = 'spoke';
                wrap.style.transform = \`rotate(\${angle}deg)\`;
                return wrap;
            };

            const arcGradient = (spec, segments) => segments.map((segment) => {
                const from = angleFor(spec, segment.from);
                const span = ((segment.to - segment.from) / (spec.max - spec.min)) * spec.sweep;
                return \`conic-gradient(from \${from}deg, \${segment.color} 0deg, \${segment.color} \${span}deg, transparent \${span}deg)\`;
            }).join(', ');

            function buildTicks(host, spec, options) {
                if (!host) return;
                const settings = options || {};
                const step = spec.majorStep / spec.minorPerMajor;
                const count = Math.round((spec.max - spec.min) / step);
                for (let index = 0; index <= count; index += 1) {
                    const value = spec.min + index * step;
                    const isMajor = index % spec.minorPerMajor === 0;
                    const wrap = spoke(angleFor(spec, value));
                    const tick = document.createElement('i');
                    tick.className = \`tick \${isMajor ? 'major' : 'minor'}\`;
                    tick.style.background = (settings.color || spec.tickColor)(value);
                    if (settings.scale) {
                        tick.style.top = isMajor ? '9%' : '10.5%';
                        tick.style.height = isMajor ? '10%' : '5%';
                        tick.style.width = isMajor ? '3.6%' : '2.2%';
                    }
                    wrap.appendChild(tick);
                    host.appendChild(wrap);
                }
            }

            function buildNumerals(host, spec) {
                if (!host) return;
                const count = Math.round((spec.max - spec.min) / spec.majorStep);
                for (let index = 0; index <= count; index += 1) {
                    const value = Math.round((spec.min + index * spec.majorStep) * 1000) / 1000;
                    const angle = angleFor(spec, value);
                    const wrap = spoke(angle);
                    const numeral = document.createElement('span');
                    numeral.className = 'numeral';
                    numeral.setAttribute('style', spec.numeralStyle);
                    numeral.textContent = spec.numeral(value);
                    numeral.style.transform = \`translateX(-50%) rotate(\${-angle}deg)\`;
                    wrap.appendChild(numeral);
                    host.appendChild(wrap);
                }
            }

            /* ---------- build every dial ---------- */
            document.querySelectorAll('[data-gauge]').forEach((card) => {
                const spec = SPECS[card.dataset.gauge];
                if (!spec) return;

                buildTicks(card.querySelector('[data-ticks]'), spec);
                buildNumerals(card.querySelector('[data-numerals]'), spec);

                const band = card.querySelector('[data-zone-band]');
                if (band && spec.zones) band.style.background = arcGradient(spec, spec.zones);

                if (spec.sub) {
                    buildTicks(card.querySelector('[data-subticks]'), spec.sub, {
                        scale: true,
                        color: (value) => (value >= 115 ? 'rgba(248,113,113,.95)' : 'rgba(255,255,255,.55)'),
                    });
                    const subNeedle = card.querySelector('[data-subneedle]');
                    if (subNeedle) subNeedle.style.setProperty('--angle', \`\${angleFor(spec.sub, spec.sub.min)}deg\`);
                }

                const needle = card.querySelector('[data-needle]');
                if (needle) needle.style.setProperty('--angle', \`\${angleFor(spec, spec.idle)}deg\`);
            });

            /* ---------- instrument sequence ---------- */
            function setArc(card, selector, spec, value, color) {
                const arc = card.querySelector(selector);
                if (!arc || !color) return;
                const from = spec.progressFrom != null ? spec.progressFrom : spec.min;
                arc.style.background = arcGradient(spec, [{ from, to: Math.max(from, value), color }]);
            }

            function countTo(element, spec, from, to, duration) {
                if (!element || !spec.readout) return;
                if (reduceMotion || duration === 0) { element.textContent = spec.readout(to); return; }
                const started = performance.now();
                const step = (now) => {
                    const progress = Math.min(1, (now - started) / duration);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    element.textContent = spec.readout(from + (to - from) * eased);
                    if (progress < 1) requestAnimationFrame(step);
                };
                requestAnimationFrame(step);
            }

            function sweepTo(card, spec, value, duration) {
                const needle = card.querySelector('[data-needle]');
                if (needle) {
                    needle.style.setProperty('--needle-duration', \`\${duration}ms\`);
                    needle.style.setProperty('--angle', \`\${angleFor(spec, value)}deg\`);
                }
                setArc(card, '[data-progress-arc]', spec, value, spec.progress);
                setArc(card, '[data-progress-wash]', spec, value, spec.wash);

                const overboost = card.querySelector('[data-overboost]');
                if (overboost) overboost.hidden = value < 1.2;
            }

            function runInstrument(card) {
                const spec = SPECS[card.dataset.gauge];
                if (!spec) return;
                const readout = card.querySelector('[data-readout]');
                const flutter = card.querySelector('[data-needle] .flutter');
                const peak = card.querySelector('[data-peak]');
                const soc = card.querySelector('[data-soc]');
                const subNeedle = card.querySelector('[data-subneedle]');
                const peakTo = (value) => { if (peak && spec.peak != null) peak.style.transform = \`rotate(\${angleFor(spec, value)}deg)\`; };

                if (soc && spec.soc != null) soc.style.width = \`\${spec.soc}%\`;
                if (subNeedle && spec.sub) subNeedle.style.setProperty('--angle', \`\${angleFor(spec.sub, spec.sub.value)}deg\`);

                if (reduceMotion) {
                    sweepTo(card, spec, spec.value, 0);
                    countTo(readout, spec, spec.value, spec.value, 0);
                    peakTo(spec.peak);
                    return;
                }

                const cycle = () => {
                    if (flutter) flutter.removeAttribute('data-live');

                    /* instrument self-test: full-scale sweep, fall back to rest, settle on the live reading */
                    sweepTo(card, spec, spec.max, 1100);
                    countTo(readout, spec, spec.idle, spec.max, 1100);
                    peakTo(spec.max);

                    setTimeout(() => {
                        sweepTo(card, spec, spec.idle, 900);
                        countTo(readout, spec, spec.max, spec.idle, 900);
                        peakTo(spec.idle);
                    }, 1350);

                    setTimeout(() => {
                        sweepTo(card, spec, spec.value, 1200);
                        countTo(readout, spec, spec.idle, spec.value, 1200);
                        peakTo(spec.peak);
                    }, 2500);

                    setTimeout(() => { if (flutter) flutter.setAttribute('data-live', ''); }, 3900);
                };

                cycle();
                setInterval(cycle, 8000);
            }

            /* ---------- heading word reveal ---------- */
            const wrapWords = (elementId) => {
                const el = document.getElementById(elementId);
                if (!el) return;
                const text = el.innerText.trim().replace(/\\s+/g, ' ');
                el.innerHTML = '';
                const words = text.split(' ');
                words.forEach((word, index) => {
                    const wordWrap = document.createElement('span');
                    wordWrap.style.display = 'inline-block';
                    wordWrap.style.overflow = 'hidden';
                    wordWrap.style.paddingBottom = '4px';

                    const wordSpan = document.createElement('span');
                    wordSpan.className = 'word';
                    wordSpan.style.display = 'inline-block';
                    wordSpan.style.opacity = '0';
                    wordSpan.style.transform = 'translateY(100%)';
                    wordSpan.style.filter = 'blur(4px)';
                    wordSpan.style.transition = 'all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)';
                    wordSpan.style.transitionDelay = \`\${index * 40}ms\`;
                    wordSpan.innerHTML = word + '&nbsp;';

                    wordWrap.appendChild(wordSpan);
                    el.appendChild(wordWrap);
                });
            };

            wrapWords('hero-title');
            wrapWords('hero-subtitle');

            const observer = new IntersectionObserver((entries, self) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;

                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    entry.target.style.filter = 'blur(0)';

                    entry.target.querySelectorAll('.word').forEach((word) => {
                        word.style.opacity = '1';
                        word.style.transform = 'translateY(0)';
                        word.style.filter = 'blur(0)';
                    });

                    if (entry.target.dataset.gauge) setTimeout(() => runInstrument(entry.target), 500);

                    self.unobserve(entry.target);
                });
            }, { root: null, rootMargin: '0px', threshold: 0.1 });

            document.querySelectorAll('[data-anim="true"]').forEach((el) => observer.observe(el));
        });
    <\/script>
</body>
</html>
`;var o0=`<!DOCTYPE html>
<html lang="en" class="antialiased selection:bg-cyan-500/30 selection:text-cyan-50">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Logic Core</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"><\/script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
</head>
<body class="bg-[#050505] text-zinc-300 min-h-screen flex items-center justify-center font-['Inter',sans-serif] overflow-x-hidden m-0 p-0" style="background-color: #050505;">

    <!-- Faint Ambient Grid Background -->
    <div class="fixed inset-0 pointer-events-none flex justify-center items-center overflow-hidden z-0" style="opacity: 0.04;">
        <svg class="absolute w-[200vw] h-[200vh]" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="bg-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" stroke-width="1"/>
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#bg-grid)" />
        </svg>
    </div>

    <!-- Main Content Layout -->
    <main class="relative z-10 w-full max-w-5xl mx-auto p-6 md:p-12 flex flex-col md:flex-row gap-6 lg:gap-8 items-stretch justify-center pt-24 pb-24">
        
        <!-- Left Card: Visual Interface (Design) -->
        <article class="flex-1 rounded-[24px] bg-gradient-to-b from-white/10 to-transparent p-[1px] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] group/card">
            <div class="bg-[#0A0A0A] rounded-[23px] overflow-hidden flex flex-col h-full w-full">
                
                <!-- Visual Area -->
                <div class="relative w-full h-64 sm:h-72 border-b border-white/5 flex items-center justify-center overflow-hidden bg-[#0A0A0A]" id="svg-container">
                    
                    <!-- SVG Interactive Scene -->
                    <svg width="100%" height="100%" viewBox="0 0 400 300" class="absolute inset-0 pointer-events-none">
                        <!-- Orbiting Rings -->
                        <g class="origin-center" style="transform-origin: 200px 150px;">
                            <circle cx="200" cy="150" r="130" fill="none" stroke="#ffffff" stroke-width="1" stroke-opacity="0.03" stroke-dasharray="4 4" id="ring-outer"/>
                            <circle cx="200" cy="150" r="90" fill="none" stroke="#ffffff" stroke-width="1" stroke-opacity="0.05" />
                            <circle cx="200" cy="150" r="50" fill="none" stroke="#ffffff" stroke-width="1" stroke-opacity="0.08" />
                        </g>

                        <!-- Central Bounding Box -->
                        <rect x="140" y="120" width="120" height="60" fill="none" stroke="#4F46E5" stroke-width="1" stroke-opacity="0.8" stroke-dasharray="2 2"/>
                        <rect x="138" y="118" width="4" height="4" fill="#4F46E5" />
                        <rect x="258" y="118" width="4" height="4" fill="#4F46E5" />
                        <rect x="138" y="178" width="4" height="4" fill="#4F46E5" />
                        <rect x="258" y="178" width="4" height="4" fill="#4F46E5" />

                        <!-- Animated SVG Cursors -->
                        <g id="cursor-alex" style="transform: translate(110px, 90px);">
                            <g>
                                <animateTransform attributeName="transform" type="translate" values="0,0; 0,-6; 0,0" dur="2s" repeatCount="indefinite" />
                                <path d="M0,0 L12,12 L5,12 L0,18 Z" fill="#F97316" />
                                <rect x="10" y="-8" width="42" height="18" rx="9" fill="#F97316" />
                                <text x="31" y="4" font-family="sans-serif" font-size="9" font-weight="500" fill="white" text-anchor="middle" style="letter-spacing: 0.5px;">Alex</text>
                            </g>
                        </g>

                        <g id="cursor-sam" style="transform: translate(130px, 200px);">
                            <g>
                                <animateTransform attributeName="transform" type="translate" values="0,0; 0,-6; 0,0" dur="2.5s" repeatCount="indefinite" />
                                <path d="M0,0 L12,12 L5,12 L0,18 Z" fill="#EC4899" transform="rotate(-30)" />
                                <rect x="12" y="8" width="40" height="18" rx="9" fill="#EC4899" />
                                <text x="32" y="20" font-family="sans-serif" font-size="9" font-weight="500" fill="white" text-anchor="middle" style="letter-spacing: 0.5px;">Sam</text>
                            </g>
                        </g>

                        <g id="cursor-me" style="transform: translate(270px, 180px);">
                            <g>
                                <animateTransform attributeName="transform" type="translate" values="0,0; 0,-6; 0,0" dur="2.2s" repeatCount="indefinite" />
                                <path d="M0,0 L12,12 L5,12 L0,18 Z" fill="#10B981" transform="rotate(-70)" />
                                <rect x="-4" y="14" width="34" height="18" rx="9" fill="#10B981" />
                                <text x="13" y="26" font-family="sans-serif" font-size="9" font-weight="500" fill="white" text-anchor="middle" style="letter-spacing: 0.5px;">Me</text>
                            </g>
                        </g>
                    </svg>

                    <!-- Avatar Nodes -->
                    <div class="absolute w-5 h-5 rounded-full bg-zinc-800 border border-white/10 overflow-hidden shadow-sm" style="top: 25%; left: 30%;">
                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&q=80" class="w-full h-full object-cover" alt="Avatar">
                    </div>
                    <div class="absolute w-6 h-6 rounded-full bg-zinc-800 border border-white/10 overflow-hidden shadow-sm" style="top: 60%; right: 20%;">
                        <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&q=80" class="w-full h-full object-cover" alt="Avatar">
                    </div>
                    <div class="absolute w-5 h-5 rounded-full bg-zinc-800 border border-white/10 overflow-hidden shadow-sm" style="bottom: 20%; left: 20%;">
                        <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&q=80" class="w-full h-full object-cover" alt="Avatar">
                    </div>
                </div>

                <!-- Text Content -->
                <div class="p-6 md:p-8 flex-1 flex flex-col justify-start">
                    <h2 class="text-xl tracking-tight font-medium text-zinc-100 mb-3 animate-text">Visual Interface</h2>
                    <p class="text-sm text-zinc-400 leading-relaxed animate-text">Construct dynamic layouts using our intuitive node-based system. Collaborate in real-time with your team across unified environments.</p>
                </div>
            </div>
        </article>

        <!-- Right Card: Core Logic (Develop / ThreeJS) -->
        <article class="flex-1 rounded-[24px] bg-gradient-to-b from-white/10 to-transparent p-[1px] shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)] group/card">
            <div class="bg-[#0A0A0A] rounded-[23px] overflow-hidden flex flex-col h-full w-full">
                
                <!-- Visual Area -->
                <div class="relative w-full h-64 sm:h-72 border-b border-white/5 bg-[#050505] overflow-hidden">
                    
                    <!-- ThreeJS Canvas Container -->
                    <div id="three-canvas-container" class="absolute inset-0"></div>

                    <!-- Overlay Terminal Icon -->
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#0F0F0F]/90 backdrop-blur-md border border-white/10 flex items-center justify-center" style="box-shadow: 0 8px 32px -8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05);">
                            <div class="text-cyan-400 font-mono text-2xl sm:text-3xl font-light tracking-widest flex items-center gap-1">
                                <span>></span><span id="terminal-cursor" class="block w-3 sm:w-4 h-[2px] bg-cyan-400 mt-2" style="transition: opacity 0.2s;"></span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Text Content -->
                <div class="p-6 md:p-8 flex-1 flex flex-col justify-start relative">
                    <div class="flex items-center gap-2 mb-3">
                        <h2 class="text-xl tracking-tight font-medium text-zinc-100 animate-text">Core Logic</h2>
                        <iconify-icon icon="solar:code-circle-linear" style="stroke-width: 1.5;" class="text-zinc-500 text-lg opacity-0 animate-text-icon"></iconify-icon>
                    </div>
                    <p class="text-sm text-zinc-400 leading-relaxed animate-text">Access the underlying isometric data structures directly. Deploy scalable microservices instantly via our high-performance runtime.</p>
                </div>
            </div>
        </article>

    </main>

    <!-- Application Logic -->
    <script type="module">
        import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';

        // --- 1. ThreeJS Isometric Terminal-Modernism Scene ---
        const initThreeJS = () => {
            const container = document.getElementById('three-canvas-container');
            if (!container) return;

            const scene = new THREE.Scene();
            
            // Isometric Orthographic Camera Configuration
            const aspect = container.clientWidth / container.clientHeight;
            const d = 12; // Camera frustum size
            const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
            camera.position.set(20, 20, 20); // Isometric angle
            camera.lookAt(0, 0, 0);

            const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            container.appendChild(renderer.domElement);

            const group = new THREE.Group();
            scene.add(group);

            // Material Definitions
            const basePlatformMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9, metalness: 0.1 });
            const coreEmissiveMat = new THREE.MeshStandardMaterial({ color: 0x00E5FF, emissive: 0x00E5FF, emissiveIntensity: 0.5, roughness: 0.2 });
            const wireframeMat = new THREE.LineBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.4 });

            // Geometry Build: Base Platform
            const platformGeo = new THREE.BoxGeometry(16, 0.5, 16);
            const platform = new THREE.Mesh(platformGeo, basePlatformMat);
            platform.position.y = -2;
            group.add(platform);

            const platformEdges = new THREE.LineSegments(new THREE.EdgesGeometry(platformGeo), wireframeMat);
            platform.add(platformEdges);

            // Geometry Build: Central Logic Core
            const coreGeo = new THREE.BoxGeometry(2, 4, 2);
            const core = new THREE.Mesh(coreGeo, coreEmissiveMat);
            core.position.y = 0.25;
            group.add(core);

            // Geometry Build: Orbiting Data Nodes
            const nodes = [];
            const nodeCount = 12;
            for(let i = 0; i < nodeCount; i++) {
                const isAccent = Math.random() > 0.7;
                const nodeMat = isAccent ? coreEmissiveMat : new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
                const size = 0.4 + Math.random() * 0.4;
                const nodeGeo = new THREE.BoxGeometry(size, size, size);
                const node = new THREE.Mesh(nodeGeo, nodeMat);
                
                const angle = (i / nodeCount) * Math.PI * 2;
                const radius = 4 + Math.random() * 4;
                
                node.position.set(Math.cos(angle) * radius, -1 + Math.random() * 4, Math.sin(angle) * radius);
                
                // Add tiny wireframe to nodes for technical look
                node.add(new THREE.LineSegments(new THREE.EdgesGeometry(nodeGeo), new THREE.LineBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.3 })));

                node.userData = { 
                    angle, 
                    radius, 
                    speed: 0.005 + Math.random() * 0.015, 
                    yBase: node.position.y,
                    yOffset: Math.random() * Math.PI * 2 
                };
                group.add(node);
                nodes.push({ mesh: node, isAccent });
            }

            // Lighting Setup
            scene.add(new THREE.AmbientLight(0xffffff, 0.3));
            
            const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
            dirLight.position.set(10, 20, 5);
            scene.add(dirLight);
            
            const pointLight = new THREE.PointLight(0x00E5FF, 1.5, 25);
            pointLight.position.set(0, 1, 0);
            scene.add(pointLight);

            // Animation Loop
            let time = 0;
            const animate3D = () => {
                requestAnimationFrame(animate3D);
                time += 0.016;

                // Subtle environmental drift
                group.rotation.y = Math.sin(time * 0.1) * 0.15;
                group.position.y = Math.sin(time * 0.5) * 0.2;

                // Emissive pulsing logic
                const pulse = (Math.sin(time * 2.5) + 1) * 0.5;
                coreEmissiveMat.emissiveIntensity = 0.4 + pulse * 0.6;
                pointLight.intensity = 1.0 + pulse * 1.5;

                // Node orbital mechanics
                nodes.forEach(nodeObj => {
                    const data = nodeObj.mesh.userData;
                    data.angle += data.speed;
                    nodeObj.mesh.position.x = Math.cos(data.angle) * data.radius;
                    nodeObj.mesh.position.z = Math.sin(data.angle) * data.radius;
                    nodeObj.mesh.position.y = data.yBase + Math.sin(time * 1.5 + data.yOffset) * 0.5;
                    nodeObj.mesh.rotation.x += 0.01;
                    nodeObj.mesh.rotation.y += 0.02;
                });

                renderer.render(scene, camera);
            };
            animate3D();

            // Responsive Handling
            window.addEventListener('resize', () => {
                if(!container) return;
                const newAspect = container.clientWidth / container.clientHeight;
                camera.left = -d * newAspect;
                camera.right = d * newAspect;
                camera.top = d;
                camera.bottom = -d;
                camera.updateProjectionMatrix();
                renderer.setSize(container.clientWidth, container.clientHeight);
            });
        };

        // --- 2. 2D SVG & DOM Animations ---
        
        // Terminal Cursor Blink
        const terminalCursor = document.getElementById('terminal-cursor');
        setInterval(() => {
            if(terminalCursor) {
                terminalCursor.style.opacity = terminalCursor.style.opacity === '0' ? '1' : '0';
            }
        }, 500);

        // SVG Cursor Organic Float
        const cursorAlex = document.getElementById('cursor-alex');
        const cursorSam = document.getElementById('cursor-sam');
        const cursorMe = document.getElementById('cursor-me');
        const outerRing = document.getElementById('ring-outer');
        let svgTime = 0;

        const animateSVG = () => {
            svgTime += 0.015;
            
            // Organic cursor movement formulas
            if(cursorAlex) cursorAlex.setAttribute('transform', \`translate(\${110 + Math.sin(svgTime * 1.2) * 6}, \${90 + Math.cos(svgTime * 0.8) * 6})\`);
            if(cursorSam) cursorSam.setAttribute('transform', \`translate(\${130 + Math.cos(svgTime * 0.9) * 5}, \${200 + Math.sin(svgTime * 1.1) * 5})\`);
            if(cursorMe) cursorMe.setAttribute('transform', \`translate(\${270 + Math.sin(svgTime * 1.5) * 4}, \${180 + Math.cos(svgTime * 1.3) * 7})\`);
            
            // Subtle ring rotation
            if(outerRing) outerRing.style.transform = \`rotate(\${svgTime * 5}deg)\`;

            requestAnimationFrame(animateSVG);
        };

        // --- 3. Staggered Word-by-Word Scroll Reveal ---
        const initTextAnimations = () => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Reveal spans
                        const spans = entry.target.querySelectorAll('span');
                        spans.forEach(span => {
                            span.style.opacity = '1';
                            span.style.transform = 'translateY(0) scale(1)';
                            span.style.filter = 'blur(0px)';
                        });
                        
                        // Handle potential icon siblings
                        const icon = entry.target.parentElement?.querySelector('iconify-icon');
                        if(icon) {
                            setTimeout(() => {
                                icon.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
                                icon.style.opacity = '1';
                                icon.style.transform = 'translateY(0) scale(1)';
                            }, 300);
                        }

                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

            document.querySelectorAll('.animate-text').forEach(el => {
                const text = el.textContent;
                el.innerHTML = ''; // Clear original text
                const words = text.split(' ');
                
                words.forEach((word, index) => {
                    const span = document.createElement('span');
                    span.textContent = word + ' '; // Re-add space
                    
                    // Initial hidden state applied inline to respect constraints
                    span.style.opacity = '0';
                    span.style.transform = 'translateY(12px) scale(0.98)';
                    span.style.filter = 'blur(4px)';
                    span.style.display = 'inline-block';
                    span.style.whiteSpace = 'pre-wrap';
                    
                    // Complex transition physics
                    span.style.transition = 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), filter 0.7s cubic-bezier(0.16, 1, 0.3, 1)';
                    span.style.transitionDelay = \`\${index * 35}ms\`;
                    
                    el.appendChild(span);
                });

                // Initial setup for sibling icons
                const icon = el.parentElement?.querySelector('iconify-icon');
                if(icon) {
                    icon.style.opacity = '0';
                    icon.style.transform = 'translateY(10px) scale(0.8)';
                }

                observer.observe(el);
            });
        };

        // Bootstrap
        window.addEventListener('DOMContentLoaded', () => {
            initThreeJS();
            animateSVG();
            initTextAnimations();
        });

    <\/script>
</body>
</html>`;var s0=`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Strata \u2014 Cloud Migration Platform</title>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500&display=swap" rel="stylesheet">
    
    <script src="https://cdn.tailwindcss.com"><\/script>
    <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"><\/script>
</head>
<body class="bg-[#050510] text-white font-['Inter',system-ui,sans-serif] overflow-x-hidden antialiased selection:bg-violet-500/30 selection:text-violet-200">

    <!-- WebGL Background Canvas -->
    <canvas id="c" class="fixed inset-0 w-full h-full z-0 pointer-events-none"></canvas>

    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-4 px-6 md:px-10 bg-[#050510]/50 backdrop-blur-xl border-b border-violet-600/10">
        <div class="w-full max-w-[1200px] flex items-center justify-between">
            <div class="flex items-center gap-3 font-medium text-sm tracking-wide">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center shadow-[0_0_16px_rgba(124,58,237,0.3)]">
                    <iconify-icon icon="solar:layers-linear" class="text-white text-lg"></iconify-icon>
                </div>
                Strata
            </div>
            
            <div class="hidden md:flex items-center gap-8">
                <a href="#" class="text-white/50 hover:text-white/90 text-sm font-light tracking-wide transition-colors">Platform</a>
                <a href="#" class="text-white/50 hover:text-white/90 text-sm font-light tracking-wide transition-colors">Solutions</a>
                <a href="#" class="text-white/50 hover:text-white/90 text-sm font-light tracking-wide transition-colors">Pricing</a>
                <a href="#" class="text-white/50 hover:text-white/90 text-sm font-light tracking-wide transition-colors">Docs</a>
            </div>
            
            <button class="px-5 py-2.5 rounded-full text-xs font-normal bg-gradient-to-br from-violet-600/20 to-violet-500/10 border border-violet-600/30 text-violet-400 hover:from-violet-600/30 hover:to-violet-500/20 transition-all shadow-[0_0_20px_rgba(124,58,237,0.1)] hover:shadow-[0_0_28px_rgba(124,58,237,0.2)] tracking-wide">
                Start Migration
            </button>
        </div>
    </nav>

    <!-- Hero Section -->
    <main class="relative z-10 flex flex-col items-center justify-center text-center min-h-[100svh] px-6 pt-20">
        <!-- Radial shadow overlay to help text readability over canvas -->
        <div class="absolute inset-0 pointer-events-none z-[-1]" style="background: radial-gradient(ellipse 70% 50% at 50% 55%, rgba(5,5,16,0.6) 0%, transparent 70%);"></div>

        <div class="relative z-1 max-w-3xl mx-auto w-full flex flex-col items-center">
            
            <div class="inline-flex items-center gap-2 px-4 py-1.5 mb-8 bg-violet-600/5 border border-violet-600/20 rounded-full text-xs font-medium tracking-[0.1em] uppercase text-violet-400 backdrop-blur-sm">
                <span class="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_#8b5cf6] animate-pulse"></span>
                Now in General Availability
            </div>
            
            <h1 class="text-[clamp(2.4rem,6vw,4rem)] font-thin tracking-tight leading-[1.08] text-white mb-6">
                Migrate to the cloud<br>with <em class="not-italic bg-gradient-to-br from-violet-500 via-violet-400 to-violet-200 bg-clip-text text-transparent">confidence</em>
            </h1>
            
            <p class="text-sm md:text-base font-light leading-relaxed text-white/40 max-w-xl mx-auto mb-10">
                Automated discovery, dependency mapping, and zero-downtime migration for enterprise workloads. Move faster with less risk.
            </p>
            
            <div class="flex flex-wrap justify-center gap-4 mb-16 w-full">
                <button class="relative overflow-hidden px-8 py-3.5 rounded-xl text-sm font-medium border-none text-white tracking-wide bg-gradient-to-br from-violet-700 to-violet-500 shadow-[0_0_30px_rgba(124,58,237,0.3),0_4px_16px_rgba(0,0,0,0.4)] hover:shadow-[0_0_40px_rgba(124,58,237,0.45),0_6px_20px_rgba(0,0,0,0.5)] transition-all hover:-translate-y-[1px] group">
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                    Start Free Assessment
                </button>
                <button class="px-8 py-3.5 rounded-xl text-sm font-normal border border-white/10 bg-white/5 text-white/70 backdrop-blur-md hover:border-white/20 hover:text-white hover:bg-white/10 transition-all tracking-wide">
                    Watch Demo
                </button>
            </div>
            
            <div class="flex flex-wrap justify-center gap-8 md:gap-14 w-full">
                <div class="text-center">
                    <div class="text-2xl md:text-3xl font-thin tracking-tight bg-gradient-to-br from-violet-400 to-violet-200 bg-clip-text text-transparent">99.99%</div>
                    <div class="text-xs font-light text-white/30 tracking-[0.08em] uppercase mt-1.5">Uptime SLA</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl md:text-3xl font-thin tracking-tight bg-gradient-to-br from-violet-400 to-violet-200 bg-clip-text text-transparent">8.5M</div>
                    <div class="text-xs font-light text-white/30 tracking-[0.08em] uppercase mt-1.5">Workloads Migrated</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl md:text-3xl font-thin tracking-tight bg-gradient-to-br from-violet-400 to-violet-200 bg-clip-text text-transparent">75%</div>
                    <div class="text-xs font-light text-white/30 tracking-[0.08em] uppercase mt-1.5">Faster Migrations</div>
                </div>
                <div class="hidden sm:block text-center">
                    <div class="text-2xl md:text-3xl font-thin tracking-tight bg-gradient-to-br from-violet-400 to-violet-200 bg-clip-text text-transparent">500+</div>
                    <div class="text-xs font-light text-white/30 tracking-[0.08em] uppercase mt-1.5">Enterprise Clients</div>
                </div>
            </div>

        </div>

        <div class="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40 pointer-events-none">
            <div class="w-5 h-[30px] rounded-full border-[1.5px] border-white/40 relative">
                <div id="scroll-dot" class="w-[2px] h-1.5 bg-white/60 rounded-full absolute top-1.5 left-1/2 -translate-x-1/2"></div>
            </div>
            <span class="text-[0.6rem] tracking-[0.14em] uppercase text-white/40">Scroll</span>
        </div>
    </main>

    <!-- Scroll Reveal Section (GSAP Masked Stagger) -->
    <section class="relative z-10 py-32 px-6 min-h-[70svh] flex items-center justify-center bg-[#050510]">
        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-[#050510] to-[#050510] pointer-events-none z-[-1]"></div>
        <div class="max-w-4xl mx-auto w-full text-center">
            <p class="text-xs font-medium tracking-[0.15em] uppercase text-violet-500 mb-8">Intelligent Infrastructure</p>
            <h2 id="reveal-text" class="text-2xl md:text-5xl font-thin tracking-tight leading-[1.3] text-white/90">
                Discover untethered scalability. The platform built to dynamically map, migrate, and optimize your entire infrastructure without lifting a finger.
            </h2>
        </div>
    </section>

    <!-- Feature Section with Premium Gradient Borders & Aura Images -->
    <section class="relative z-10 py-24 px-6 bg-[#050510]">
        <div class="max-w-[1200px] mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <!-- Card 1 -->
            <div class="p-[1px] rounded-3xl bg-gradient-to-b from-white/10 via-white/5 to-transparent relative group overflow-hidden">
                <div class="absolute inset-0 bg-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl rounded-3xl pointer-events-none"></div>
                <div class="bg-[#080814] rounded-[23px] h-full p-2 relative z-10 flex flex-col">
                    <div class="w-full h-56 md:h-72 rounded-[18px] overflow-hidden mb-6 relative">
                        <img src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/724142aa-44a6-48d3-9cf3-761e00d05b78_1600w.jpg" alt="Architecture" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out opacity-80" loading="lazy">
                        <div class="absolute inset-0 bg-gradient-to-t from-[#080814] to-transparent"></div>
                    </div>
                    <div class="px-6 pb-8">
                        <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 text-white/70">
                            <iconify-icon icon="solar:box-minimalistic-linear" class="text-xl"></iconify-icon>
                        </div>
                        <h3 class="text-xl font-light tracking-tight text-white mb-3">Architectural Clarity</h3>
                        <p class="text-sm font-light text-white/40 leading-relaxed">
                            Automatically visualize dependencies across microservices and legacy monolithic structures before execution.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Card 2 -->
            <div class="p-[1px] rounded-3xl bg-gradient-to-b from-white/10 via-white/5 to-transparent relative group overflow-hidden">
                <div class="absolute inset-0 bg-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl rounded-3xl pointer-events-none"></div>
                <div class="bg-[#080814] rounded-[23px] h-full p-2 relative z-10 flex flex-col">
                    <div class="w-full h-56 md:h-72 rounded-[18px] overflow-hidden mb-6 relative">
                        <img src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/4734259a-bad7-422f-981e-ce01e79184f2_1600w.jpg" alt="Abstract" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out opacity-80" loading="lazy">
                        <div class="absolute inset-0 bg-gradient-to-t from-[#080814] to-transparent"></div>
                    </div>
                    <div class="px-6 pb-8">
                        <div class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 text-white/70">
                            <iconify-icon icon="solar:graph-linear" class="text-xl"></iconify-icon>
                        </div>
                        <h3 class="text-xl font-light tracking-tight text-white mb-3">Dynamic Scaling</h3>
                        <p class="text-sm font-light text-white/40 leading-relaxed">
                            Leverage predictive models to right-size compute resources dynamically as your user traffic shifts.
                        </p>
                    </div>
                </div>
            </div>

        </div>
    </section>

    <!-- Footer Spacer -->
    <footer class="relative z-10 bg-[#050510] border-t border-white/5 py-10 text-center">
        <p class="text-xs font-light text-white/30 tracking-wide">\xA9 Strata Technologies. All rights reserved.</p>
    </footer>

    <!-- Logic & Animations -->
    <script>
        // --- GSAP Animations ---
        gsap.registerPlugin(ScrollTrigger);

        // Scroll Mouse Dot Animation
        gsap.to("#scroll-dot", {
            y: 8,
            opacity: 0.2,
            duration: 1.2,
            repeat: -1,
            yoyo: true,
            ease: "power1.inOut"
        });

        // Masked Staggered Text Reveal
        const revealEl = document.getElementById('reveal-text');
        const textContent = revealEl.innerText;
        revealEl.innerHTML = '';
        
        // Wrap words in masked spans
        const words = textContent.split(' ');
        words.forEach(word => {
            const wrapper = document.createElement('span');
            // Using inline styles for structural mask requirements (avoids \`<style>\`)
            wrapper.style.display = 'inline-block';
            wrapper.style.overflow = 'hidden';
            wrapper.style.verticalAlign = 'bottom';
            wrapper.style.marginRight = '0.25em';
            wrapper.style.paddingBottom = '0.1em'; // Prevent clipping of descenders
            
            const inner = document.createElement('span');
            inner.className = 'reveal-word';
            inner.style.display = 'inline-block';
            inner.style.transform = 'translateY(110%)';
            inner.style.transformOrigin = 'top left';
            inner.innerText = word;
            
            wrapper.appendChild(inner);
            revealEl.appendChild(wrapper);
        });

        // Trigger animation
        gsap.to('.reveal-word', {
            y: 0,
            duration: 1.2,
            stagger: 0.03,
            ease: "power4.out",
            scrollTrigger: {
                trigger: revealEl,
                start: "top 85%",
                toggleActions: "play none none reverse"
            }
        });


        // --- WebGL Background Canvas ---
        const canvas = document.getElementById('c');
        const gl = canvas.getContext('webgl', { antialias: true, alpha: false, preserveDrawingBuffer: true });

        let W, H, dpr;
        function resize() {
            dpr = Math.min(window.devicePixelRatio, 2);
            W = window.innerWidth;
            H = window.innerHeight;
            canvas.width = W * dpr;
            canvas.height = H * dpr;
            gl.viewport(0, 0, canvas.width, canvas.height);
        }
        window.addEventListener('resize', resize);
        resize();

        const VS = \`
        attribute vec2 a_pos;
        void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
        \`;

        const FS = \`
        precision highp float;
        uniform vec2 u_res;
        uniform float u_time;
        uniform vec2 u_mouse;

        float hash(float n){ return fract(sin(n)*43758.5453123); }
        float hash2(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }

        float noise(float x){
            float i = floor(x);
            float f = fract(x);
            f = f*f*(3.0-2.0*f);
            return mix(hash(i), hash(i+1.0), f);
        }

        float fbm(float x, float octaves){
            float val = 0.0;
            float amp = 0.5;
            float freq = 1.0;
            for(int i = 0; i < 6; i++){
                if(float(i) >= octaves) break;
                val += amp * noise(x * freq);
                freq *= 2.17;
                amp *= 0.48;
            }
            return val;
        }

        float meteor(vec2 uv, float t){
            float cycle = mod(t * 0.15, 1.0);
            float seed = floor(t * 0.15);
            float h = hash(seed * 7.31);
            float h2 = hash(seed * 13.17);
            if(h > 0.30) return 0.0;
            vec2 start = vec2(0.2 + h2 * 0.6, 0.7 + h * 0.25);
            vec2 dir = normalize(vec2(1.0, -0.6 - h * 0.3));
            float progress = smoothstep(0.0, 0.7, cycle);
            vec2 pos = start + dir * progress * 0.5;
            vec2 toP = uv - pos;
            float along = dot(toP, dir);
            float perp = length(toP - dir * along);
            float trail = smoothstep(0.0, -0.12, along) * smoothstep(-0.18, -0.04, along);
            float core = smoothstep(0.003, 0.0, perp) * trail;
            float glow = smoothstep(0.012, 0.0, perp) * trail * 0.3;
            float fade = smoothstep(0.0, 0.1, cycle) * smoothstep(0.8, 0.55, cycle);
            return (core + glow) * fade;
        }

        float stars(vec2 uv, float density){
            vec2 cell = floor(uv * density);
            vec2 sub = fract(uv * density);
            float h = hash2(cell);
            float brightness = step(0.975, h);
            float size = 0.025 + h * 0.045;
            float d = length(sub - vec2(hash2(cell + 100.0), hash2(cell + 200.0)));
            float star = brightness * smoothstep(size, 0.0, d);
            star *= 0.5 + 0.5 * sin(u_time * (1.0 + h * 3.0) + h * 6.28);
            return star;
        }

        void main(){
            vec2 uv = gl_FragCoord.xy / u_res;
            float aspect = u_res.x / u_res.y;

            vec2 mouse = u_mouse * 2.0 - 1.0;

            vec3 skyTop    = vec3(0.015, 0.012, 0.045);
            vec3 skyMid    = vec3(0.035, 0.025, 0.085);
            vec3 skyBottom = vec3(0.065, 0.045, 0.14);

            float skyGrad = uv.y;
            vec3 col = mix(skyBottom, skyMid, smoothstep(0.3, 0.6, skyGrad));
            col = mix(col, skyTop, smoothstep(0.6, 1.0, skyGrad));

            float horizonY = 0.35;
            float horizonGlow = exp(-pow((uv.y - horizonY) * 3.8, 2.0));
            col += vec3(0.15, 0.07, 0.26) * horizonGlow * 0.8;

            float centerGlow = exp(-pow((uv.x - 0.5) * 1.5, 2.0)) * exp(-pow((uv.y - horizonY) * 4.0, 2.0));
            col += vec3(0.14, 0.10, 0.24) * centerGlow * 0.6;

            float starField = stars(uv * vec2(aspect, 1.0), 60.0)
                            + stars(uv * vec2(aspect, 1.0) + 500.0, 100.0) * 0.7
                            + stars(uv * vec2(aspect, 1.0) + 900.0, 160.0) * 0.4;

            float starMask = 1.0;
            float xC, yS, prof, mTop, mtn, rDist, rGlow, rAmb;
            vec3 lC;

            // Layer 0
            lC = vec3(0.14, 0.10, 0.24);
            xC = uv.x * aspect * 1.6 + u_time * 0.006 + mouse.x * 0.010;
            yS = mouse.y * 0.003;
            prof = fbm(xC, 5.0) * 0.10 + fbm(xC * 0.3 + 17.0, 3.0) * 0.07;
            mTop = 0.40 + prof + yS;
            mtn = smoothstep(mTop + 0.003, mTop - 0.001, uv.y);
            rDist = abs(uv.y - mTop);
            rGlow = smoothstep(0.012, 0.0, rDist) * 0.18;
            rAmb = smoothstep(0.04, 0.0, rDist) * 0.06;
            col = mix(col, lC, mtn);
            col += vec3(0.20, 0.10, 0.35) * rGlow;
            col += vec3(0.12, 0.06, 0.22) * rAmb;
            starMask *= (1.0 - mtn);

            // Layer 1
            lC = vec3(0.11, 0.07, 0.19);
            xC = uv.x * aspect * 2.0 + u_time * 0.012 + mouse.x * 0.020;
            yS = mouse.y * 0.006;
            prof = fbm(xC, 5.0) * 0.13 + fbm(xC * 0.3 + 34.0, 3.0) * 0.091;
            mTop = 0.33 + prof + yS;
            mtn = smoothstep(mTop + 0.003, mTop - 0.001, uv.y);
            rDist = abs(uv.y - mTop);
            rGlow = smoothstep(0.012, 0.0, rDist) * 0.15;
            rAmb = smoothstep(0.04, 0.0, rDist) * 0.045;
            col = mix(col, lC, mtn);
            col += vec3(0.20, 0.10, 0.35) * rGlow;
            col += vec3(0.12, 0.06, 0.22) * rAmb;
            starMask *= (1.0 - mtn);

            // Layer 2
            lC = vec3(0.08, 0.05, 0.14);
            xC = uv.x * aspect * 2.6 + u_time * 0.020 + mouse.x * 0.034;
            yS = mouse.y * 0.010;
            prof = fbm(xC, 5.0) * 0.16 + fbm(xC * 0.3 + 51.0, 3.0) * 0.112;
            mTop = 0.26 + prof + yS;
            mtn = smoothstep(mTop + 0.003, mTop - 0.001, uv.y);
            rDist = abs(uv.y - mTop);
            rGlow = smoothstep(0.012, 0.0, rDist) * 0.12;
            rAmb = smoothstep(0.04, 0.0, rDist) * 0.03;
            col = mix(col, lC, mtn);
            col += vec3(0.20, 0.10, 0.35) * rGlow;
            col += vec3(0.12, 0.06, 0.22) * rAmb;
            starMask *= (1.0 - mtn);

            // Layer 3
            lC = vec3(0.05, 0.03, 0.09);
            xC = uv.x * aspect * 3.2 + u_time * 0.030 + mouse.x * 0.050;
            yS = mouse.y * 0.015;
            prof = fbm(xC, 5.0) * 0.14 + fbm(xC * 0.3 + 68.0, 3.0) * 0.098;
            mTop = 0.18 + prof + yS;
            mtn = smoothstep(mTop + 0.003, mTop - 0.001, uv.y);
            rDist = abs(uv.y - mTop);
            rGlow = smoothstep(0.012, 0.0, rDist) * 0.09;
            col = mix(col, lC, mtn);
            col += vec3(0.20, 0.10, 0.35) * rGlow;
            starMask *= (1.0 - mtn);

            // Layer 4
            lC = vec3(0.03, 0.018, 0.055);
            xC = uv.x * aspect * 4.0 + u_time * 0.044 + mouse.x * 0.070;
            yS = mouse.y * 0.021;
            prof = fbm(xC, 5.0) * 0.11 + fbm(xC * 0.3 + 85.0, 3.0) * 0.077;
            mTop = 0.09 + prof + yS;
            mtn = smoothstep(mTop + 0.003, mTop - 0.001, uv.y);
            rDist = abs(uv.y - mTop);
            rGlow = smoothstep(0.012, 0.0, rDist) * 0.06;
            col = mix(col, lC, mtn);
            col += vec3(0.20, 0.10, 0.35) * rGlow;
            starMask *= (1.0 - mtn);

            col += vec3(0.9, 0.8, 1.0) * starField * starMask;
            float met = meteor(uv * vec2(aspect, 1.0), u_time);
            col += vec3(0.8, 0.6, 1.0) * met * starMask;

            float vig = 1.0 - 0.3 * pow(length((uv - 0.5) * vec2(1.1, 1.6)), 2.0);
            col *= vig;

            float haze = exp(-pow((uv.y - 0.33) * 5.0, 2.0)) * 0.05;
            col += vec3(0.15, 0.10, 0.30) * haze;

            col = pow(col, vec3(0.95));

            gl_FragColor = vec4(col, 1.0);
        }
        \`;

        function createShader(src, type) {
            const s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
            return s;
        }

        const vs = createShader(VS, gl.VERTEX_SHADER);
        const fs = createShader(FS, gl.FRAGMENT_SHADER);
        const prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        gl.useProgram(prog);

        const quad = new Float32Array([-1,-1, 1,-1, -1,1, 1,1]);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
        const aPos = gl.getAttribLocation(prog, 'a_pos');
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

        const uRes = gl.getUniformLocation(prog, 'u_res');
        const uTime = gl.getUniformLocation(prog, 'u_time');
        const uMouse = gl.getUniformLocation(prog, 'u_mouse');

        let mx = 0.5, my = 0.5;
        let smx = 0.5, smy = 0.5;
        document.addEventListener('mousemove', e => {
            mx = e.clientX / window.innerWidth;
            my = 1.0 - e.clientY / window.innerHeight;
        });

        function frame(t) {
            t *= 0.001;
            smx += (mx - smx) * 0.04;
            smy += (my - smy) * 0.04;

            gl.uniform2f(uRes, canvas.width, canvas.height);
            gl.uniform1f(uTime, t);
            gl.uniform2f(uMouse, smx, smy);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    <\/script>
</body>
</html>`;var l0=`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VALENCE CORE | Kinetic Induction</title>
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"><\/script>

    <!-- Scripts -->
    <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"><\/script>
</head>
<body class="bg-neutral-950 text-neutral-50 h-screen w-screen overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-50 flex flex-col relative antialiased">

    <!-- Ambient WebGL Background -->
    <canvas id="bg-canvas" class="absolute inset-0 w-full h-full z-0 opacity-60 pointer-events-none" aria-hidden="true"></canvas>

    <!-- Overlay Vignette for depth -->
    <div class="absolute inset-0 z-0 pointer-events-none" style="background: radial-gradient(circle at center, transparent 0%, rgba(10,10,10,0.8) 100%);"></div>

    <!-- Navigation -->
    <nav class="absolute top-0 w-full flex justify-between items-center px-6 py-6 z-20" style="opacity: 0; transform: translateY(-20px);" id="main-nav">
        <div class="flex items-center gap-2">
            <iconify-icon icon="solar:atom-linear" class="text-cyan-500 text-xl" style="stroke-width: 1.5px;"></iconify-icon>
            <span class="font-medium text-sm tracking-tight text-neutral-200">VALENCE SYSTEM</span>
        </div>
        
        <!-- Premium Border Gradient Pill -->
        <div class="hidden sm:flex relative p-[1px] rounded-full overflow-hidden items-center justify-center cursor-pointer group transition-transform duration-300 hover:scale-105">
            <div class="absolute inset-0 bg-gradient-to-r from-cyan-500/50 via-neutral-500/10 to-transparent rounded-full group-hover:from-cyan-500/80 transition-colors duration-500"></div>
            <div class="relative bg-neutral-950 rounded-full px-5 py-2 flex items-center gap-2">
                <div class="w-1.5 h-1.5 rounded-full bg-cyan-500" style="box-shadow: 0 0 8px rgba(6, 182, 212, 0.8);"></div>
                <span class="text-xs font-medium tracking-wide text-neutral-300">Induction Active</span>
            </div>
        </div>
    </nav>

    <!-- Main Content Stage -->
    <main class="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 w-full h-full max-w-4xl mx-auto">
        
        <div class="mb-8 flex flex-col items-center" id="intro-tags">
            <div class="font-mono font-medium text-xs tracking-[0.3em] uppercase text-cyan-500 mb-6" style="opacity: 0; transform: translateY(12px);" id="tag-text">
                SYS 12 // Kinetic Pulse
            </div>
            
            <h1 class="text-4xl sm:text-6xl md:text-7xl font-medium tracking-tight leading-[1.1] text-neutral-50" data-split>
                Command the momentum.
            </h1>
            <p class="mt-6 text-sm sm:text-base text-neutral-400 max-w-md font-normal leading-relaxed" data-split>
                Initialize the valence induction loop. The kinetic perimeter is optimized and standing by for sequence execution.
            </p>
        </div>

        <!-- WebGL Button Component -->
        <div class="mt-10 relative flex justify-center w-full" id="btn-container" style="opacity: 0; transform: scale(0.92);">
            <button class="relative flex items-center justify-center w-[280px] h-[96px] bg-transparent cursor-pointer rounded-[18px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 group" id="btn" type="button" style="transition: transform .22s cubic-bezier(.34, 1.4, .5, 1);" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'" onmousedown="this.style.transform='translateY(1px) scale(.99)'" onmouseup="this.style.transform='translateY(-2px)'">
                <canvas id="btn-gl" aria-hidden="true" class="absolute inset-0 w-full h-full block rounded-[18px]"></canvas>
                <span class="relative z-10 pointer-events-none font-medium text-sm tracking-[0.3em] indent-[0.3em] text-[#e0f7f8]" style="text-shadow: 0 0 12px rgba(0, 210, 255, .6), 0 1px 4px rgba(0, 0, 0, .8);">VALENCE CORE</span>
            </button>
        </div>

        <p class="mt-8 text-xs text-neutral-500 tracking-wide font-normal" style="opacity: 0; transform: translateY(12px);" id="note-text">
            Hover to trigger neural arcs, click to unleash a synchronized valence discharge.
        </p>

    </main>

    <script>
        // --- GSAP Animations ---
        document.addEventListener("DOMContentLoaded", () => {
            // Masked Text Splitter
            document.querySelectorAll('[data-split]').forEach(el => {
                const text = el.innerText;
                el.innerHTML = '';
                text.split(' ').forEach(word => {
                    if (word.trim() === '') return;
                    const wrapper = document.createElement('span');
                    wrapper.style.display = 'inline-block';
                    wrapper.style.overflow = 'hidden';
                    wrapper.style.verticalAlign = 'top';
                    wrapper.style.marginRight = '0.25em';
                    wrapper.style.paddingBottom = '0.1em';

                    const inner = document.createElement('span');
                    inner.style.display = 'inline-block';
                    inner.style.transform = 'translateY(100%)';
                    inner.style.opacity = '0';
                    inner.className = 'mask-target';
                    inner.innerText = word;

                    wrapper.appendChild(inner);
                    el.appendChild(wrapper);
                });
            });

            const tl = gsap.timeline();

            // Nav Entrance
            tl.to("#main-nav", { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.2 });

            // Tag Entrance
            tl.to("#tag-text", { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, "-=0.6");

            // Text Reveal
            tl.to(".mask-target", {
                y: "0%",
                opacity: 1,
                duration: 0.8,
                stagger: 0.04,
                ease: "power3.out"
            }, "-=0.4");

            // Button Flicker Entrance
            tl.to("#btn-container", {
                keyframes: {
                    "0%":   { opacity: 0, scale: 0.92 },
                    "9%":   { opacity: 0.85 },
                    "15%":  { opacity: 0.12 },
                    "24%":  { opacity: 0.92 },
                    "31%":  { opacity: 0.35 },
                    "44%":  { opacity: 1, scale: 1.015 },
                    "100%": { opacity: 1, scale: 1 }
                },
                duration: 1.15,
                ease: "none"
            }, "-=0.2");

            // Note Entrance
            tl.to("#note-text", { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }, "-=0.5");
        });

        // --- Core WebGL Logic ---
        (function () {
            const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            
            function compileShader(gl, type, src) {
                const s = gl.createShader(type);
                gl.shaderSource(s, src);
                gl.compileShader(s);
                if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                    console.error('shader compile failed:', gl.getShaderInfoLog(s));
                }
                return s;
            }

            function createProgram(gl, vsSrc, fsSrc) {
                const prog = gl.createProgram();
                gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER, vsSrc));
                gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, fsSrc));
                gl.linkProgram(prog);
                if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
                    console.error('program link failed:', gl.getProgramInfoLog(prog));
                }
                return prog;
            }

            const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';

            // --- 1. Ambient Background Canvas ---
            function initBackgroundGL() {
                const canvas = document.getElementById('bg-canvas');
                const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
                if (!gl) return;

                const FS_BG = \`
                    precision highp float;
                    uniform vec2 u_res;
                    uniform float u_time;
                    
                    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
                    float noise(vec2 p){
                        vec2 i=floor(p), f=fract(p);
                        vec2 u=f*f*(3.0-2.0*f);
                        return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),
                                   mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);
                    }
                    float fbm(vec2 p){
                        float v=0.0; float a=0.5;
                        for(int i=0;i<4;i++){ v+=a*noise(p); p=p*2.05+vec2(9.7,3.1); a*=0.5; }
                        return v;
                    }
                    void main(){
                        vec2 uv = gl_FragCoord.xy / u_res.y;
                        float t = u_time * 0.1;
                        
                        float n1 = fbm(uv * 1.5 + vec2(t * 0.2, t * 0.1));
                        float n2 = fbm(uv * 2.0 - vec2(t * 0.15, -t * 0.2) + n1);
                        
                        vec3 baseCol = vec3(0.039, 0.039, 0.039);
                        // Restyled to Deep Cyan Highlight
                        vec3 highlightCol = vec3(0.01, 0.08, 0.12);
                        
                        vec3 col = mix(baseCol, highlightCol, n2 * 0.4);
                        
                        vec2 grid = fract(uv * 20.0);
                        float line = smoothstep(0.95, 1.0, max(grid.x, grid.y));
                        col += vec3(0.015) * line * (1.0 - n1);
                        
                        gl_FragColor = vec4(col, 1.0);
                    }
                \`;

                const prog = createProgram(gl, VS, FS_BG);
                gl.useProgram(prog);

                const buf = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, buf);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
                const locP = gl.getAttribLocation(prog, 'p');
                gl.enableVertexAttribArray(locP);
                gl.vertexAttribPointer(locP, 2, gl.FLOAT, false, 0, 0);

                const uRes = gl.getUniformLocation(prog, 'u_res');
                const uTime = gl.getUniformLocation(prog, 'u_time');

                function resize() {
                    const dpr = Math.min(window.devicePixelRatio || 1, 2);
                    const w = Math.round(canvas.clientWidth * dpr);
                    const h = Math.round(canvas.clientHeight * dpr);
                    if (canvas.width !== w || canvas.height !== h) {
                        canvas.width = w; canvas.height = h;
                        gl.viewport(0, 0, w, h);
                    }
                }
                window.addEventListener('resize', resize);
                resize();

                function render(now) {
                    resize();
                    gl.uniform2f(uRes, canvas.width, canvas.height);
                    gl.uniform1f(uTime, reduced ? 0 : now / 1000);
                    gl.drawArrays(gl.TRIANGLES, 0, 3);
                    requestAnimationFrame(render);
                }
                requestAnimationFrame(render);
            }

            // --- 2. Button WebGL (Remixed to Electric Cyan & Emerald) ---
            function initButtonGL() {
                const btn = document.getElementById('btn');
                const canvas = document.getElementById('btn-gl');
                const gl = canvas.getContext('webgl', { alpha: false, antialias: true });
                if (!gl) { 
                    btn.style.background = '#062630';
                    btn.style.boxShadow = '0 0 0 2px #00f2fe, 0 0 24px rgba(0, 242, 254, .5)';
                    return; 
                }

                const FS_BTN = [
                    'precision highp float;',
                    'uniform vec2 u_res;',
                    'uniform float u_time;',
                    'uniform float u_arcs;',
                    'uniform float u_flash;',
                    'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}',
                    'float noise(vec2 p){',
                    '  vec2 i=floor(p), f=fract(p);',
                    '  vec2 u=f*f*(3.0-2.0*f);',
                    '  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),',
                    '             mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);',
                    '}',
                    'float fbm(vec2 p){',
                    '  float v=0.0; float a=0.5;',
                    '  for(int i=0;i<4;i++){ v+=a*noise(p); p=p*2.05+vec2(9.7,3.1); a*=0.5; }',
                    '  return v;',
                    '}',
                    'float sdRBox(vec2 p, vec2 b, float r){',
                    '  vec2 q = abs(p) - b + r;',
                    '  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;',
                    '}',
                    'void main(){',
                    '  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;',
                    '  float ar = u_res.x / u_res.y;',
                    '  vec2 hs = vec2(ar * 0.5 - 0.2, 0.5 - 0.2);',
                    '  float d = sdRBox(p, hs, 0.14);',
                    '  float t = u_time;',
                    '  float hover = clamp(u_arcs / 6.0, 0.0, 1.0);',
                    '  vec3 col = vec3(0.039, 0.039, 0.039);',
                    '  float plate = 1.0 - smoothstep(-0.004, 0.004, d);',
                    '  vec3 plateCol = vec3(0.04, 0.05, 0.055);',
                    '  plateCol += vec3(0.014, 0.022, 0.035) * fbm(p * 9.0);',
                    '  plateCol += vec3(0.0, 0.25, 0.3) * exp(d * 9.0) * (0.25 + hover * 0.6);',
                    '  col = mix(col, plateCol, plate);',
                    '  col *= 1.0 + 0.5 * exp(-max(d, 0.0) * 16.0) * (1.0 - plate);',
                    '  float a = atan(p.y, p.x);',
                    '  vec3 arcCol = vec3(0.0);',
                    '  for (int i = 0; i < 6; i++) {',
                    '    float fi = float(i);',
                    '    float w = clamp(u_arcs - fi, 0.0, 1.0);',
                    '    float n1 = fbm(vec2(a * 2.4 + fi * 11.3, t * (1.6 + fi * 0.27) + fi * 53.1));',
                    '    float off = (n1 - 0.5) * (0.11 + u_flash * 0.1);',
                    '    float seg = smoothstep(0.35, 0.75, noise(vec2(a * 1.8 + fi * 7.7, t * (0.9 + fi * 0.13) + fi * 19.0)));',
                    '    seg = 0.3 + 0.7 * seg;',
                    '    float g = 0.0042 / (abs(d + off) + 0.006);',
                    // Remixed with bright cyan/teal and emerald glow profile
                    '    arcCol += (vec3(0.0, 0.75, 0.9) * g + vec3(0.6, 1.0, 0.95) * g * g * 0.55) * w * seg;',
                    '  }',
                    '  float outerMask = 1.0 - smoothstep(0.04, 0.15, d);',
                    '  col += arcCol * (0.6 + 0.4 * hover) * outerMask;',
                    '  float ring = 0.006 / (abs(d) + 0.006);',
                    '  col += vec3(0.8, 0.98, 1.0) * ring * u_flash * 1.5 * outerMask;',
                    '  col += vec3(0.7, 0.95, 1.0) * u_flash * 0.16 * outerMask;',
                    '  gl_FragColor = vec4(col, 1.0);',
                    '}'
                ].join('\\n');

                const prog = createProgram(gl, VS, FS_BTN);
                gl.useProgram(prog);

                const buf = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, buf);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
                const locP = gl.getAttribLocation(prog, 'p');
                gl.enableVertexAttribArray(locP);
                gl.vertexAttribPointer(locP, 2, gl.FLOAT, false, 0, 0);

                const uRes = gl.getUniformLocation(prog, 'u_res');
                const uTime = gl.getUniformLocation(prog, 'u_time');
                const uArcs = gl.getUniformLocation(prog, 'u_arcs');
                const uFlash = gl.getUniformLocation(prog, 'u_flash');

                function resize() {
                    const dpr = Math.min(window.devicePixelRatio || 1, 2);
                    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
                    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
                    if (canvas.width !== w || canvas.height !== h) {
                        canvas.width = w; canvas.height = h;
                        gl.viewport(0, 0, w, h);
                    }
                }
                window.addEventListener('resize', resize);
                resize();

                let arcs = 2.4, arcsTarget = 2.4, flash = 0, crawl = 0;
                let last = performance.now();

                btn.addEventListener('mouseenter', () => arcsTarget = 5.8);
                btn.addEventListener('mouseleave', () => arcsTarget = 2.4);
                btn.addEventListener('focus', () => arcsTarget = 5.8);
                btn.addEventListener('blur', () => arcsTarget = 2.4);
                btn.addEventListener('click', () => flash = 1);

                function frame(now) {
                    const dt = Math.min(0.05, (now - last) / 1000);
                    last = now;
                    arcs += (arcsTarget - arcs) * Math.min(1, dt * 5);
                    flash *= Math.exp(-3.6 * dt);
                    crawl += dt * (0.6 + (arcs / 6) * 1.1 + flash * 2.0);
                    resize();
                    gl.uniform2f(uRes, canvas.width, canvas.height);
                    gl.uniform1f(uTime, reduced ? 3.0 : crawl);
                    gl.uniform1f(uArcs, arcs);
                    gl.uniform1f(uFlash, flash);
                    gl.drawArrays(gl.TRIANGLES, 0, 3);
                    requestAnimationFrame(frame);
                }
                requestAnimationFrame(frame);
            }

            initBackgroundGL();
            initButtonGL();
        })();
    <\/script>
</body>
</html>`;var c0=`<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vanguard Labs \u2014 Dimensional Architecture</title>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600&display=swap" rel="stylesheet">
    
    <script src="https://cdn.tailwindcss.com"><\/script>
    <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"><\/script>
</head>
<body class="bg-[#050505] text-gray-100 font-sans antialiased overflow-hidden selection:bg-cyan-500/20 selection:text-cyan-100" style="font-family: 'Inter', sans-serif;">

    <!-- WebGL Canvas Container -->
    <canvas id="webgl-canvas" class="fixed inset-0 w-full h-full pointer-events-none z-[-30]"></canvas>

    <!-- Technical Grid Overlay (Dark Mode) -->
    <div class="fixed inset-0 w-full h-full pointer-events-none z-[-20] opacity-[0.06]" style="background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.8) 0, rgba(255,255,255,0.8) 1px, transparent 1px, transparent 56px);"></div>

    <!-- Cinematic Grain Overlay (Dark Mode) -->
    <div class="fixed inset-0 w-full h-full pointer-events-none z-[-10] mix-blend-overlay opacity-[0.15]" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');"></div>

    <!-- Navigation -->
    <nav class="fixed top-0 w-full z-50 px-6 py-6 flex justify-between items-center bg-[#050505]/40 backdrop-blur-lg border-b border-white/5 gsap-reveal">
        <a href="#" class="text-sm font-light tracking-wide text-gray-200 hover:text-white transition-colors duration-300 flex items-center gap-3">
            <span class="w-1.5 h-1.5 rounded-full bg-[#00FFCC] shadow-[0_0_12px_#00FFCC]"></span>
            Vanguard Labs
        </a>
        
        <div class="hidden md:flex gap-8 text-sm font-extralight text-gray-400">
            <a href="#" class="hover:text-cyan-400 transition-colors duration-300">Framework</a>
            <a href="#" class="hover:text-cyan-400 transition-colors duration-300">Architecture</a>
            <a href="#" class="hover:text-cyan-400 transition-colors duration-300">Modules</a>
            <a href="#" class="hover:text-cyan-400 transition-colors duration-300">Transmission</a>
        </div>

        <button class="md:hidden text-gray-400 hover:text-white transition-colors" aria-label="Menu">
            <iconify-icon icon="solar:hamburger-menu-linear" class="text-2xl" stroke-width="1.5"></iconify-icon>
        </button>
    </nav>

    <!-- Main Content -->
    <main class="relative h-screen flex flex-col justify-center px-6 md:px-12 lg:px-24 z-10 pointer-events-none">
        <div class="max-w-2xl pointer-events-auto">
            
            <div class="overflow-hidden mb-6 flex items-center gap-3">
                <span class="relative inline-flex items-center px-3 py-1.5 text-xs font-light text-cyan-300 gsap-reveal-text group z-0">
                    <span class="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 -z-20"></span>
                    <span class="absolute inset-[1px] rounded-full bg-[#0A0A0A]/90 -z-10 backdrop-blur-sm"></span>
                    <iconify-icon icon="solar:augmented-reality-linear" class="mr-2 text-sm" stroke-width="1.5"></iconify-icon>
                    Dimensional Core v4.5
                </span>
            </div>
            
            <h1 class="text-5xl md:text-6xl lg:text-7xl font-light tracking-tight leading-tight text-white mb-8">
                <span class="inline-block overflow-hidden align-top pb-1"><span class="inline-block masked-word font-semibold">Immersive</span></span>
                <span class="inline-block overflow-hidden align-top pb-1"><span class="inline-block masked-word font-semibold">environments,</span></span>
                <br class="hidden md:block">
                <span class="inline-block overflow-hidden align-top pb-1"><span class="inline-block masked-word font-semibold">engineered</span></span>
                <span class="inline-block overflow-hidden align-top pb-1"><span class="inline-block masked-word font-semibold">with</span></span>
                <br class="hidden md:block">
                <span class="inline-block overflow-hidden align-top pb-1">
                    <span class="inline-block masked-word text-transparent bg-clip-text font-semibold" style="background-image: linear-gradient(120deg, #F3F4F6, #9CA3AF); -webkit-background-clip: text;">absolute</span>
                </span>
                <span class="inline-block overflow-hidden align-top pb-1">
                    <span class="inline-block masked-word text-transparent bg-clip-text font-semibold" style="background-image: linear-gradient(120deg, #00FFCC, #7000FF); -webkit-background-clip: text;">precision.</span>
                </span>
            </h1>

            <p class="text-sm md:text-base text-gray-400 max-w-md font-extralight leading-relaxed mb-10 gsap-reveal-text">
                We build boundary-pushing, physics-enabled digital topologies that merge advanced WebGL with sleek brutalism, crafting the next frontier of immersive computing.
            </p>

            <div class="flex flex-col sm:flex-row gap-5 gsap-reveal-text">
                <a href="#" class="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-[#050505] bg-white rounded-full hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                    Initialize Directory
                    <iconify-icon icon="solar:arrow-right-linear" class="ml-2 text-lg group-hover:translate-x-1 transition-transform" stroke-width="1.5"></iconify-icon>
                </a>
                <a href="#" class="group relative inline-flex items-center justify-center px-6 py-3 text-sm font-light text-gray-300 rounded-full transition-all duration-300 hover:scale-[1.02] hover:text-white active:scale-[0.98] z-0">
                    <span class="absolute inset-0 rounded-full bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 group-hover:from-gray-700 group-hover:via-gray-600 group-hover:to-gray-800 transition-colors -z-20"></span>
                    <span class="absolute inset-[1px] rounded-full bg-[#050505]/80 backdrop-blur-md -z-10"></span>
                    Launch Environment
                </a>
            </div>
        </div>
    </main>

    <!-- UI Controls & Indicators -->
    <div class="absolute bottom-0 w-full px-6 py-8 flex justify-between items-end z-10 pointer-events-none gsap-reveal">
        <div class="flex flex-col gap-2">
            <div class="text-xs text-gray-500 font-light tracking-widest uppercase">
                Vector // <span id="coord-display" class="text-cyan-400/80 font-medium tracking-wider">0.0000, 0.0000</span>
            </div>
            
            <!-- Custom Theme Toggle -->
            <div class="flex items-center gap-4 mt-5 pointer-events-auto group cursor-pointer" id="theme-toggle" role="switch" aria-checked="false">
                <span class="text-xs font-light text-gray-500 uppercase tracking-widest group-hover:text-gray-300 transition-colors">Void</span>
                <div class="w-10 h-5 rounded-full bg-gray-800 border border-gray-700 relative transition-all duration-300 flex items-center p-0.5 group-hover:border-gray-500 shadow-inner" id="toggle-track">
                    <div class="w-3.5 h-3.5 rounded-full bg-cyan-400 transform transition-transform duration-300 translate-x-0 shadow-[0_0_8px_#00FFCC]" id="toggle-thumb"></div>
                </div>
                <span class="text-xs font-light text-gray-500 uppercase tracking-widest group-hover:text-gray-300 transition-colors">Aurora</span>
            </div>
        </div>

        <div class="flex flex-col items-center gap-4">
            <span class="text-xs text-gray-500 uppercase tracking-widest font-light" style="writing-mode: vertical-rl;">Descend</span>
            <div class="w-[1px] h-14 bg-gray-800 relative overflow-hidden">
                <div class="scroll-line absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-cyan-400 to-transparent"></div>
            </div>
        </div>
    </div>

    <script>
        // --- Dark WebGL Architecture ---
        const initWebGL = () => {
            const canvas = document.getElementById('webgl-canvas');
            if (!canvas) return;

            const renderer = new THREE.WebGLRenderer({ 
                canvas, 
                alpha: true, 
                antialias: false 
            });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
            camera.position.z = 12;

            const uniforms = {
                u_time: { value: 0 },
                u_resolution: { value: new THREE.Vector2() },
                u_color1: { value: new THREE.Color(0.0, 0.8, 0.7) }, // Cyan
                u_color2: { value: new THREE.Color(0.4, 0.0, 0.9) }  // Deep Purple
            };

            const snoiseLogic = \`
                vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
                float snoise(vec2 v){
                    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                    vec2 i  = floor(v + dot(v, C.yy) );
                    vec2 x0 = v -   i + dot(i, C.xx);
                    vec2 i1;
                    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                    vec4 x12 = x0.xyxy + C.xxzz;
                    x12.xy -= i1;
                    i = mod(i, 289.0);
                    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
                    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                    m = m*m ; m = m*m ;
                    vec3 x = 2.0 * fract(p * C.www) - 1.0;
                    vec3 h = abs(x) - 0.5;
                    vec3 ox = floor(x + 0.5);
                    vec3 a0 = x - ox;
                    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                    vec3 g;
                    g.x  = a0.x  * x0.x  + h.x  * x0.y;
                    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                    return 130.0 * dot(m, g);
                }
            \`;

            // --- Dark Background Shader Plane ---
            const bgMaterial = new THREE.ShaderMaterial({
                vertexShader: \`void main() { gl_Position = vec4(position, 1.0); }\`,
                fragmentShader: \`
                    uniform float u_time;
                    uniform vec2 u_resolution;
                    uniform vec3 u_color1;
                    uniform vec3 u_color2;
                    \${snoiseLogic}
                    void main() {
                        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
                        uv.x *= u_resolution.x / u_resolution.y;

                        vec3 baseColor = vec3(0.02, 0.02, 0.03);
                        vec2 st = uv * 0.5;
                        st += vec2(snoise(st + u_time * 0.04), snoise(st - u_time * 0.04)) * 0.4;

                        float beam = smoothstep(0.2, 0.9, snoise(vec2(st.x + st.y * 2.0 - u_time * 0.1, u_time * 0.03)));
                        vec3 glow = mix(u_color1, u_color2, snoise(uv * 2.0 + u_time * 0.15) * 0.5 + 0.5);

                        float dist = distance(gl_FragCoord.xy / u_resolution.xy, vec2(0.5));
                        float vignette = smoothstep(1.5, 0.1, dist);
                        
                        vec3 edgeColor = vec3(0.01, 0.01, 0.015);
                        vec3 colorGlow = mix(baseColor, glow, beam * 0.6);

                        gl_FragColor = vec4(mix(edgeColor, colorGlow, vignette), 1.0);
                    }
                \`,
                uniforms,
                depthWrite: false,
                depthTest: false
            });

            const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMaterial);
            bgMesh.position.z = -15;
            scene.add(bgMesh);

            // --- Dark Glass Sphere Shader ---
            const glassMaterial = new THREE.ShaderMaterial({
                vertexShader: \`
                    varying vec3 vNormal;
                    void main() {
                        vNormal = normalize(normalMatrix * normal);
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                \`,
                fragmentShader: \`
                    uniform float u_time;
                    uniform vec2 u_resolution;
                    uniform vec3 u_color1;
                    uniform vec3 u_color2;
                    varying vec3 vNormal;
                    \${snoiseLogic}
                    void main() {
                        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
                        uv += vNormal.xy * 0.2; 
                        uv.x *= u_resolution.x / u_resolution.y;

                        vec3 baseColor = vec3(0.04, 0.04, 0.06);
                        vec2 st = uv * 0.6;
                        st += vec2(snoise(st + u_time * 0.06), snoise(st - u_time * 0.06)) * 0.35;

                        float beam = smoothstep(0.1, 0.9, snoise(vec2(st.x + st.y * 1.8 - u_time * 0.12, u_time * 0.02)));
                        vec3 glow = mix(u_color1, u_color2, snoise(uv * 1.8 + u_time * 0.12) * 0.5 + 0.5);

                        float fresnel = dot(vec3(0.0, 0.0, 1.0), vNormal);
                        fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
                        fresnel = pow(fresnel, 2.5);

                        vec3 finalColor = mix(baseColor, glow, clamp((beam * 0.5) + (fresnel * 0.8), 0.0, 1.0));
                        gl_FragColor = vec4(finalColor, 0.95);
                    }
                \`,
                uniforms,
                transparent: true
            });

            const sphereGeo = new THREE.SphereGeometry(1, 64, 64);
            const spheres = [];

            // Remixed Coordinates and scales
            const sphereData = [
                { scale: 4.2, x: 6.5, y: -1.2, z: -1.5, speed: 0.002 },   
                { scale: 1.8, x: -6.0, y: -4.0, z: 2.5, speed: 0.004 },  
                { scale: 1.1, x: -4.5, y: 4.2, z: -2.0, speed: 0.005 },  
                { scale: 0.75, x: 3.0, y: 5.5, z: 4.0, speed: 0.008 }      
            ];

            sphereData.forEach(data => {
                const mesh = new THREE.Mesh(sphereGeo, glassMaterial);
                mesh.scale.set(data.scale, data.scale, data.scale);
                mesh.position.set(data.x, data.y, data.z);
                scene.add(mesh);
                spheres.push({
                    mesh,
                    baseY: data.y,
                    speed: data.speed,
                    offset: Math.random() * Math.PI * 2
                });
            });

            // --- Viewport Dynamics ---
            let mouseX = 0, mouseY = 0;
            const windowHalfX = window.innerWidth / 2;
            const windowHalfY = window.innerHeight / 2;
            const coordDisplay = document.getElementById('coord-display');

            document.addEventListener('mousemove', (event) => {
                mouseX = (event.clientX - windowHalfX);
                mouseY = (event.clientY - windowHalfY);
                if(coordDisplay) {
                    // Updating coordinates display format
                    coordDisplay.innerText = \`\${(event.clientX / window.innerWidth).toFixed(4)}, \${(event.clientY / window.innerHeight).toFixed(4)}\`;
                }
            });

            const resize = () => {
                const width = window.innerWidth;
                const height = window.innerHeight;
                renderer.setSize(width, height);
                camera.aspect = width / height;
                camera.updateProjectionMatrix();

                const dist = camera.position.z - bgMesh.position.z;
                const vFov = camera.fov * Math.PI / 180;
                const planeHeight = 2 * Math.tan(vFov / 2) * dist;
                bgMesh.scale.set(planeHeight * camera.aspect / 2, planeHeight / 2, 1);
                
                uniforms.u_resolution.value.set(width, height);
            };

            window.addEventListener('resize', resize);
            resize();

            let isAurora = false;
            const themeToggle = document.getElementById('theme-toggle');
            
            themeToggle.addEventListener('click', () => {
                isAurora = !isAurora;
                themeToggle.setAttribute('aria-checked', isAurora.toString());
                const thumb = document.getElementById('toggle-thumb');
                
                if(isAurora) {
                    thumb.style.transform = 'translateX(20px)';
                    thumb.style.backgroundColor = '#FF007F'; // Neon Pink
                    thumb.style.boxShadow = '0 0 8px #FF007F';
                    gsap.to(uniforms.u_color1.value, { r: 1.0, g: 0.0, b: 0.5, duration: 1.5 });
                    gsap.to(uniforms.u_color2.value, { r: 1.0, g: 0.3, b: 0.0, duration: 1.5 });
                } else {
                    thumb.style.transform = 'translateX(0px)';
                    thumb.style.backgroundColor = '#00FFCC'; // Cyan
                    thumb.style.boxShadow = '0 0 8px #00FFCC';
                    gsap.to(uniforms.u_color1.value, { r: 0.0, g: 0.8, b: 0.7, duration: 1.5 });
                    gsap.to(uniforms.u_color2.value, { r: 0.4, g: 0.0, b: 0.9, duration: 1.5 });
                }
            });

            const clock = new THREE.Clock();
            const animate = () => {
                requestAnimationFrame(animate);
                const time = clock.getElapsedTime();
                
                uniforms.u_time.value = time;

                camera.position.x += (mouseX * 0.005 - camera.position.x) * 0.05;
                camera.position.y += (-mouseY * 0.005 - camera.position.y) * 0.05;
                camera.lookAt(scene.position);

                spheres.forEach(s => {
                    s.mesh.position.y = s.baseY + Math.sin(time * s.speed * 120 + s.offset) * 0.5;
                    s.mesh.rotation.x = time * s.speed * 18;
                    s.mesh.rotation.y = time * s.speed * 24;
                });

                renderer.render(scene, camera);
            };

            animate();
        };

        const initUI = () => {
            gsap.registerPlugin(ScrollTrigger);

            const tl = gsap.timeline({ 
                scrollTrigger: {
                    trigger: "main",
                    start: "top 80%",
                },
                defaults: { ease: "power3.out" } 
            });

            gsap.set('.gsap-reveal-text', { y: 24, opacity: 0 });
            gsap.set('.gsap-reveal', { opacity: 0 });
            gsap.set('.masked-word', { y: "110%" });

            tl.to('.gsap-reveal', { opacity: 1, duration: 1.2, delay: 0.2 })
              .to('.gsap-reveal-text', { y: 0, opacity: 1, duration: 1.0, stagger: 0.12 }, "-=1.0")
              .to('.masked-word', { y: "0%", duration: 1.0, stagger: 0.05 }, "-=0.8");

            gsap.to('.scroll-line', {
                yPercent: 150,
                opacity: 0,
                repeat: -1,
                duration: 2.2,
                ease: "power2.inOut",
                onRepeat: function() { gsap.set(this.targets()[0], { yPercent: -100, opacity: 1 }); }
            });
        };

        document.addEventListener('DOMContentLoaded', () => {
            initWebGL();
            initUI();
        });
    <\/script>

</body>
</html>`;var d0=`<!doctype html>
<html lang="en"><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vertex 9 Global Data</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\/script>
    <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"><\/script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&amp;display=swap" rel="stylesheet">
</head>
<body style="font-family: 'Inter', sans-serif; background-color: #0E100F; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem;" class="antialiased selection:bg-white/20 text-white">

    <!-- Border Gradient Wrapper -->
    <div class="relative w-full max-w-[1440px] p-[1px] rounded-sm" style="background: linear-gradient(145deg, rgba(200,185,160,0.2) 0%, rgba(200,185,160,0.02) 40%, rgba(255,255,255,0) 100%);">
        
        <!-- Main Container -->
        <div class="relative w-full bg-[#0E100F] grid grid-cols-1 lg:grid-cols-3 min-h-[90vh] lg:min-h-[850px] border overflow-hidden border-white/5">
            
            <!-- Global Subtle Grain/Texture Overlay -->
            <div class="absolute inset-0 pointer-events-none z-40 mix-blend-overlay opacity-30" style="background-image: repeating-linear-gradient(45deg, rgba(200,185,160,0.05) 0px, rgba(200,185,160,0.05) 1px, transparent 1px, transparent 12px);"></div>

            <!-- Corner Accents -->
            <div class="absolute -top-[1px] -left-[1px] w-5 h-5 border-t border-l border-[#C8B9A0]/40 z-50 pointer-events-none"></div>
            <div class="absolute -top-[1px] -right-[1px] w-5 h-5 border-t border-r border-[#C8B9A0]/40 z-50 pointer-events-none"></div>
            <div class="absolute -bottom-[1px] -left-[1px] w-5 h-5 border-b border-l border-[#C8B9A0]/40 z-50 pointer-events-none"></div>
            <div class="absolute -bottom-[1px] -right-[1px] w-5 h-5 border-b border-r border-[#C8B9A0]/40 z-50 pointer-events-none"></div>

            <!-- Panel 1: Elegant Cream -->
            <div class="relative p-8 lg:p-12 flex flex-col justify-between overflow-hidden" style="background-color: #F4F1EB;">
                <div class="relative z-10">
                    <h1 class="text-3xl lg:text-4xl tracking-tight font-normal uppercase text-[#1C1F1D] leading-[1.15] mask-reveal pr-4">
                        REDEFINING THE SCALE OF MODERN CLOUD COMPUTING
                    </h1>
                    <div class="mt-8 flex items-start gap-3 text-[#1C1F1D]/80">
                        <iconify-icon icon="solar:monitor-linear" style="stroke-width: 1.5;" class="text-lg mt-0.5"></iconify-icon>
                        <p class="text-sm font-light max-w-[240px] leading-relaxed">
                            A network designed to elevate your stack, offering 99.99% uptime and 24/7 unwavering security.
                        </p>
                    </div>
                </div>
                
                <!-- Geometric Motif Grid -->
                <div id="motif-container" class="grid grid-cols-4 gap-6 mt-24 text-[#C8B9A0] opacity-40">
                    <!-- Populated by JS -->
                </div>
            </div>

            <!-- Panel 2: Ambient Dark Canvas -->
            <div class="relative min-h-[450px] lg:min-h-full border-y lg:border-y-0 lg:border-x border-[#C8B9A0]/10" style="background-color: #121413;">
                <!-- WebGL Canvas for flowing water/silk effect -->
                <div id="webgl-canvas" class="absolute inset-0 w-full h-full"></div>
                
                <!-- Inner Depth Shadows -->
                <div class="absolute inset-0 pointer-events-none" style="box-shadow: inset 0 0 120px rgba(14, 16, 15, 0.9);"></div>
                
                <!-- Center Emblem -->
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-20 mix-blend-plus-lighter">
                    <svg viewBox="0 0 100 100" class="w-28 h-28 text-[#D1C5B4] fill-current drop-shadow-[0_0_20px_rgba(200,185,160,0.15)]">
                        <path d="M50 5 L95 50 L50 95 L5 50 Z" fill="none" stroke="currentColor" stroke-width="2"></path>
                        <path d="M50 20 L80 50 L50 80 L20 50 Z" class="opacity-40"></path>
                        <circle cx="50" cy="50" r="6"></circle>
                    </svg>
                </div>
                
                <!-- Bottom Indicator -->
                <div class="absolute bottom-8 left-8 text-[#D1C5B4]/50 flex items-center gap-3 z-20">
                     <iconify-icon icon="solar:shield-check-line-duotone" style="stroke-width: 1.5;" class="text-base"></iconify-icon>
                     <span class="text-xs tracking-widest uppercase font-light">Tier-4 Datacenters</span>
                </div>
            </div>

            <!-- Panel 3: Warm Sand -->
            <div class="relative p-8 lg:p-12 flex flex-col justify-between" style="background-color: #B5AFA2;">
                <div>
                    <div class="flex items-start gap-4 text-[#1C1F1D]">
                        <svg viewBox="0 0 100 100" class="w-8 h-8 flex-shrink-0 fill-current mt-1">
                            <path d="M50 5 L95 50 L50 95 L5 50 Z" fill="none" stroke="currentColor" stroke-width="4"></path>
                            <circle cx="50" cy="50" r="15" class="opacity-60"></circle>
                        </svg>
                        <h2 class="text-3xl lg:text-4xl tracking-tight font-normal uppercase leading-[1.15] mask-reveal">
                            SCALABLE SYSTEMS WITH SUB-MILLISECOND DETAIL
                        </h2>
                    </div>
                    <p class="mt-8 text-sm text-[#1C1F1D]/80 font-light max-w-[240px] leading-relaxed">
                        Every element of our 300-node clusters is crafted to process 50 petabytes without a single fault.
                    </p>
                </div>
                
                <div class="mt-24 text-[#1C1F1D]">
                    <p class="text-xs mb-5 font-normal uppercase tracking-widest text-[#1C1F1D]/70 flex items-center gap-2">
                        <iconify-icon icon="solar:database-linear" style="stroke-width: 1.5;" class="text-base"></iconify-icon>
                        Analytics, storage, and computing
                    </p>
                    <h3 class="text-3xl lg:text-4xl tracking-tight font-normal uppercase leading-[1.15] mask-reveal">
                        AN ENGINE OF GROWTH ACROSS 12 GLOBAL REGIONS
                    </h3>
                </div>
            </div>

        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            // 1. Generate SVG Motif Grid for Panel 1
            const motifContainer = document.getElementById('motif-container');
            const svgMarkup = \`
                <svg viewBox="0 0 100 100" class="w-full aspect-square fill-current">
                    <polygon points="50,15 65,40 90,50 65,60 50,85 35,60 10,50 35,40" />
                    <circle cx="50" cy="50" r="8" class="opacity-30" />
                </svg>
            \`;
            // Add 12 instances for a 4x3 grid look
            for(let i=0; i<12; i++) {
                motifContainer.innerHTML += svgMarkup;
            }

            // 2. GSAP Masked Reveal for Elegant Typography
            gsap.registerPlugin(ScrollTrigger);
            const revealElements = document.querySelectorAll('.mask-reveal');
            
            revealElements.forEach(el => {
                const text = el.innerText;
                el.innerHTML = '';
                const words = text.split(' ');
                
                words.forEach(word => {
                    if(word.trim() === '') return;
                    
                    const outer = document.createElement('span');
                    outer.className = 'inline-block overflow-hidden align-bottom mr-[0.25em] pb-1';
                    
                    const inner = document.createElement('span');
                    inner.className = 'inline-block translate-y-[110%] will-change-transform';
                    inner.innerText = word;
                    
                    outer.appendChild(inner);
                    el.appendChild(outer);
                });

                gsap.to(el.querySelectorAll('span > span'), {
                    y: '0%',
                    duration: 1.4,
                    ease: 'power3.out',
                    stagger: 0.05,
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 95%'
                    }
                });
            });

            // 3. Three.js Gentle Flowing Silk/Water Animation
            function initThree() {
                const container = document.getElementById('webgl-canvas');
                if(!container || typeof THREE === 'undefined') return;

                const scene = new THREE.Scene();
                const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 100);
                camera.position.set(0, -2, 9);

                const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
                renderer.setSize(container.clientWidth, container.clientHeight);
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                container.appendChild(renderer.domElement);

                const group = new THREE.Group();
                scene.add(group);

                const numLines = 60;
                const pointsPerLine = 100;
                
                // Elegant warm neutrals
                const colorStart = new THREE.Color('#D1C5B4'); 
                const colorEnd = new THREE.Color('#7A7B76');

                for (let i = 0; i < numLines; i++) {
                    const points = [];
                    const xPos = (i - numLines / 2) * 0.22;
                    for (let j = 0; j < pointsPerLine; j++) {
                        const yPos = (j - pointsPerLine / 2) * 0.2;
                        points.push(new THREE.Vector3(xPos, yPos, 0));
                    }
                    const geometry = new THREE.BufferGeometry().setFromPoints(points);
                    
                    const color = new THREE.Color().lerpColors(colorStart, colorEnd, i / numLines);

                    const material = new THREE.LineBasicMaterial({
                        color: color,
                        transparent: true,
                        opacity: 0.1 + (Math.random() * 0.25),
                        blending: THREE.AdditiveBlending
                    });
                    
                    const line = new THREE.Line(geometry, material);
                    group.add(line);
                }

                // Tilt to create a flowing plane
                group.rotation.x = Math.PI / 3;
                group.rotation.z = -Math.PI / 8;

                const clock = new THREE.Clock();

                function animate() {
                    requestAnimationFrame(animate);
                    const time = clock.getElapsedTime() * 0.4; // Slower, more relaxed pace

                    group.children.forEach((line, i) => {
                        const positions = line.geometry.attributes.position.array;
                        for (let j = 0; j < pointsPerLine; j++) {
                            const idx = j * 3;
                            const x = positions[idx];
                            const y = positions[idx + 1];
                            
                            // Smooth, rolling, gentle waves reminiscent of water or silk
                            const wave1 = Math.sin(y * 1.2 + time + x * 0.8) * 0.8;
                            const wave2 = Math.cos(x * 1.5 - time * 0.8 + y * 0.5) * 0.6;
                            
                            positions[idx + 2] = wave1 + wave2;
                        }
                        line.geometry.attributes.position.needsUpdate = true;
                    });

                    renderer.render(scene, camera);
                }
                animate();

                window.addEventListener('resize', () => {
                    if(container) {
                        camera.aspect = container.clientWidth / container.clientHeight;
                        camera.updateProjectionMatrix();
                        renderer.setSize(container.clientWidth, container.clientHeight);
                    }
                });
            }
            
            initThree();
        });
    <\/script>

</body></html>`;var p0=`<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Void Field</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"><\/script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;400&display=swap" rel="stylesheet">
</head>
<body class="antialiased text-purple-200 bg-[#08030c] min-h-screen relative overflow-x-hidden flex items-center justify-center p-4 lg:p-12" style="font-family: 'Inter', sans-serif;">

    <!-- Background decorative text -->
    <div class="fixed top-[-5vh] left-[-10vw] text-[40vw] font-extralight tracking-tight text-purple-400/[0.03] select-none z-0 leading-none">
        042
    </div>

    <!-- Container Lines Directive -->
    <div class="relative w-full max-w-[1100px] mx-auto z-10">
        <!-- Infinite Container Vertical Lines -->
        <div class="absolute top-[-100vh] bottom-[-100vh] left-0 w-px bg-purple-400/10 hidden md:block z-0"></div>
        <div class="absolute top-[-100vh] bottom-[-100vh] right-0 w-px bg-purple-400/10 hidden md:block z-0"></div>
        
        <!-- Container Corner Nodes (6px square) -->
        <div class="absolute top-0 left-[-2.5px] w-[6px] h-[6px] bg-purple-300 border border-purple-800 z-20 hidden md:block"></div>
        <div class="absolute top-0 right-[-2.5px] w-[6px] h-[6px] bg-purple-300 border border-purple-800 z-20 hidden md:block"></div>
        <div class="absolute bottom-0 left-[-2.5px] w-[6px] h-[6px] bg-purple-300 border border-purple-800 z-20 hidden md:block"></div>
        <div class="absolute bottom-0 right-[-2.5px] w-[6px] h-[6px] bg-purple-300 border border-purple-800 z-20 hidden md:block"></div>

        <!-- Thin 16px Frame Brackets -->
        <div class="absolute top-[-16px] left-[-16px] w-[16px] h-[16px] border-t border-l border-purple-400/30 hidden md:block z-20"></div>
        <div class="absolute top-[-16px] right-[-16px] w-[16px] h-[16px] border-t border-r border-purple-400/30 hidden md:block z-20"></div>
        <div class="absolute bottom-[-16px] left-[-16px] w-[16px] h-[16px] border-b border-l border-purple-400/30 hidden md:block z-20"></div>
        <div class="absolute bottom-[-16px] right-[-16px] w-[16px] h-[16px] border-b border-r border-purple-400/30 hidden md:block z-20"></div>

        <div class="py-12 lg:py-24 flex justify-center w-full">
            
            <!-- Main Hardware Housing (2.3:1 Aspect Ratio on lg) -->
            <div class="relative w-full lg:aspect-[2.3/1] rounded-[3rem] bg-[#130a1c] shadow-[0_10px_40px_rgba(0,0,0,0.8),_0_20px_80px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(216,180,254,0.15)] p-3 lg:p-5 flex flex-col">
                
                <!-- Premium Gradient Bezel Edge -->
                <div class="absolute inset-0 rounded-[3rem] shadow-[inset_0_2px_4px_rgba(216,180,254,0.05)] pointer-events-none z-10 border border-transparent" style="background: linear-gradient(135deg, rgba(216,180,254,0.15) 0%, rgba(216,180,254,0.02) 40%, transparent 100%) border-box; -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0); -webkit-mask-composite: destination-out; mask-composite: exclude;"></div>

                <!-- Hardware Details (Screws/Rivets top/bottom) -->
                <div class="absolute top-3 left-1/4 w-3 h-3 rounded-full bg-black/90 shadow-[inset_0_1px_1px_rgba(216,180,254,0.2)] z-20"></div>
                <div class="absolute top-3 right-1/4 w-3 h-3 rounded-full bg-black/90 shadow-[inset_0_1px_1px_rgba(216,180,254,0.2)] z-20"></div>
                <div class="absolute bottom-3 left-1/4 w-3 h-3 rounded-full bg-black/90 shadow-[inset_0_1px_1px_rgba(216,180,254,0.2)] z-20"></div>
                <div class="absolute bottom-3 right-1/4 w-3 h-3 rounded-full bg-black/90 shadow-[inset_0_1px_1px_rgba(216,180,254,0.2)] z-20"></div>

                <!-- Inner Housing / Shadow Box -->
                <div class="relative rounded-[2.5rem] bg-[#0a0510] overflow-hidden shadow-[inset_0_20px_50px_rgba(0,0,0,0.9)] border border-purple-400/5 z-10 flex-grow flex flex-col" style="background-image: repeating-linear-gradient(to right, #0a0510, #0a0510 6px, #10081a 6px, #10081a 10px);">
                    
                    <!-- Screen Area -->
                    <div class="relative m-4 lg:m-8 rounded-xl bg-[#0a0510] shadow-[inset_0_5px_20px_rgba(0,0,0,1)] overflow-hidden flex flex-col flex-grow min-h-[400px] lg:min-h-0">
                        
                        <!-- Premium Gradient Screen Border -->
                        <div class="absolute inset-0 rounded-xl pointer-events-none border border-transparent z-30" style="background: linear-gradient(180deg, rgba(216,180,254,0.15) 0%, rgba(216,180,254,0.02) 25%, rgba(0,0,0,0.8) 100%) border-box; -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0); -webkit-mask-composite: destination-out; mask-composite: exclude;"></div>

                        <!-- WebGL Dot Matrix Layer -->
                        <canvas id="webgl-canvas" class="absolute inset-0 w-full h-full opacity-80 mix-blend-screen pointer-events-none z-0"></canvas>

                        <!-- Screen Horizontal Corrugation Overlay -->
                        <div class="absolute inset-0 pointer-events-none z-10 opacity-40" style="background-image: repeating-linear-gradient(to bottom, transparent, transparent 18px, rgba(0,0,0,0.9) 18px, rgba(0,0,0,0.9) 20px);"></div>

                        <!-- Faint Geometric Wireframe -->
                        <svg class="absolute right-0 top-0 h-full w-2/3 opacity-10 pointer-events-none z-10 stroke-purple-500" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M400 50 L550 150 L550 350 L400 450 L250 350 L250 150 Z" stroke-width="2"></path>
                            <path d="M400 50 L400 250 M250 150 L400 250 M550 150 L400 250 M400 450 L400 250 M250 350 L400 250 M550 350 L400 250" stroke-width="1"></path>
                            <circle cx="550" cy="150" r="40" stroke-width="2"></circle>
                        </svg>

                        <!-- Content Container -->
                        <div class="relative z-20 flex flex-col h-full text-purple-100 w-full">
                            
                            <!-- Top Section -->
                            <div class="flex items-center px-6 lg:px-12 py-6 border-b border-purple-400/10 bg-gradient-to-r from-transparent to-black/60">
                                <div class="flex items-center gap-4 border-r border-purple-400/20 pr-8">
                                    <iconify-icon icon="solar:arrow-right-up-linear" class="text-4xl text-purple-400" style="stroke-width: 1.5px;"></iconify-icon>
                                    <div class="flex items-center gap-2">
                                        <div class="w-1 h-6 bg-purple-400/50"></div>
                                        <span class="text-3xl font-extralight tracking-tight">V-72</span>
                                    </div>
                                </div>
                                <div class="pl-8 text-xs font-normal uppercase tracking-widest opacity-70 leading-tight">
                                    Void<br>Protocol
                                </div>
                            </div>

                            <!-- Middle Section (Data Band) -->
                            <div class="bg-purple-500/[0.03] text-purple-100 border-b border-purple-400/10 flex flex-col lg:flex-row relative backdrop-blur-sm">
                                
                                <!-- Inner layout grid -->
                                <div class="grid grid-cols-1 lg:grid-cols-12 w-full">
                                    <!-- Column 1: Core Telemetry -->
                                    <div class="lg:col-span-3 px-6 lg:px-12 py-6 flex items-center border-b lg:border-b-0 lg:border-r border-purple-400/10">
                                        <h2 class="text-3xl lg:text-4xl font-extralight tracking-tight leading-none masked-reveal">
                                            Quantum<br>Metric
                                        </h2>
                                    </div>

                                    <!-- Column 2: Date -->
                                    <div class="lg:col-span-3 px-6 lg:px-8 py-6 flex items-center border-b lg:border-b-0 lg:border-r border-purple-400/10">
                                        <div class="flex items-start gap-1">
                                            <span class="text-4xl lg:text-5xl font-extralight tracking-tight">NET.42</span>
                                            <span class="text-sm font-extralight mt-1 opacity-70">.8192</span>
                                        </div>
                                        <iconify-icon icon="solar:double-alt-arrow-right-linear" class="ml-auto text-2xl opacity-40" style="stroke-width: 1.5px;"></iconify-icon>
                                    </div>

                                    <!-- Column 3: Data Uplink -->
                                    <div class="lg:col-span-3 px-6 lg:px-8 py-6 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-purple-400/10">
                                        <div class="text-4xl lg:text-5xl font-extralight tracking-tight masked-reveal">72</div>
                                        <div class="text-xs font-normal uppercase tracking-widest mt-1 opacity-70">Link Status</div>
                                    </div>

                                    <!-- Column 4: Cycles -->
                                    <div class="lg:col-span-3 px-6 lg:px-8 py-6 flex flex-col justify-center relative">
                                        <div class="flex items-center gap-3">
                                            <iconify-icon icon="solar:atom-linear" class="text-2xl opacity-40" style="stroke-width: 1.5px;"></iconify-icon>
                                            <div class="text-4xl lg:text-5xl font-extralight tracking-tight masked-reveal">1.059</div>
                                        </div>
                                        <div class="text-xs font-normal uppercase tracking-widest mt-1 ml-9 opacity-70">Phases</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Bottom Section -->
                            <div class="flex-grow flex items-end px-6 lg:px-12 py-8 lg:py-12 bg-gradient-to-t from-black/80 to-transparent relative">
                                <div class="flex items-end gap-8 w-full">
                                    <div class="text-8xl lg:text-9xl leading-none font-extralight tracking-tight opacity-90 masked-reveal text-purple-100" style="text-shadow: 0px 0px 20px rgba(216,180,254,0.2);">
                                        99
                                    </div>
                                    <div class="mb-4 lg:mb-8 flex flex-col gap-2">
                                        <div class="text-xs font-normal uppercase tracking-widest leading-tight opacity-70">
                                            System<br>Override
                                        </div>
                                        <iconify-icon icon="solar:target-linear" class="text-2xl opacity-50 text-purple-200" style="stroke-width: 1.5px;"></iconify-icon>
                                    </div>
                                </div>

                                <!-- Bottom Edge Detailing -->
                                <div class="absolute bottom-0 left-0 w-full h-4 flex border-t border-purple-400/10">
                                    <div class="w-16 h-full bg-[#0e0716] border-r border-purple-400/10 flex items-center justify-center gap-1">
                                        <div class="w-1 h-1 bg-purple-400/30 rounded-full"></div>
                                        <div class="w-1 h-1 bg-purple-400/30 rounded-full"></div>
                                    </div>
                                    <div class="w-32 h-full bg-purple-400/5 border-r border-purple-400/10"></div>
                                    <!-- Striped hazard area -->
                                    <div class="w-48 h-full border-r border-purple-400/10" style="background-image: repeating-linear-gradient(45deg, rgba(216,180,254,0.05) 0, rgba(216,180,254,0.05) 4px, transparent 4px, transparent 8px);"></div>
                                    <div class="w-16 h-full bg-[#0e0716] border-r border-purple-400/10 flex items-center justify-center gap-1">
                                        <div class="w-1 h-1 bg-purple-400/30 rounded-full"></div>
                                        <div class="w-1 h-1 bg-purple-400/30 rounded-full"></div>
                                    </div>
                                    <div class="flex-grow h-full bg-purple-400/[0.02]"></div>
                                    <div class="w-16 h-full bg-[#0e0716] border-l border-purple-400/10 flex items-center justify-center gap-1">
                                        <div class="w-1 h-1 bg-purple-400/30 rounded-full"></div>
                                        <div class="w-1 h-1 bg-purple-400/30 rounded-full"></div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts for WebGL and GSAP -->
    <script>
        // 1. Masked Reveal via GSAP (TranslateY 100% to 0% with power4.out)
        document.addEventListener("DOMContentLoaded", () => {
            gsap.registerPlugin(ScrollTrigger);

            const revealElements = document.querySelectorAll('.masked-reveal');
            
            revealElements.forEach(el => {
                const text = el.innerHTML;
                const words = text.split(/<br>|\\s+/).filter(w => w.trim() !== '');
                el.innerHTML = '';
                
                words.forEach((word) => {
                    const wrapper = document.createElement('span');
                    wrapper.className = 'inline-block overflow-hidden align-bottom pb-1 -mb-1 mr-2';
                    
                    const inner = document.createElement('span');
                    inner.className = 'inline-block translate-y-[100%] opacity-0';
                    inner.innerHTML = word;
                    
                    if(text.includes(word + '<br>')) {
                        wrapper.appendChild(inner);
                        el.appendChild(wrapper);
                        el.appendChild(document.createElement('br'));
                    } else {
                        wrapper.appendChild(inner);
                        el.appendChild(wrapper);
                    }
                });

                gsap.to(el.querySelectorAll('span > span'), {
                    y: "0%",
                    opacity: 1,
                    duration: 1.2,
                    ease: "power4.out",
                    stagger: 0.1,
                    scrollTrigger: {
                        trigger: el,
                        start: "top 90%",
                    }
                });
            });
        });

        // 2. WebGL Dot-Matrix Terminal Shader
        const canvas = document.getElementById('webgl-canvas');
        const gl = canvas.getContext('webgl', { alpha: true, antialias: false });

        if (gl) {
            const resize = () => {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
                gl.viewport(0, 0, canvas.width, canvas.height);
            };
            window.addEventListener('resize', resize);
            resize();

            const vertexShaderSource = \`
                attribute vec2 position;
                void main() {
                    gl_Position = vec4(position, 0.0, 1.0);
                }
            \`;

            const fragmentShaderSource = \`
                precision highp float;
                uniform vec2 iResolution;
                uniform float iTime;
                uniform vec2 uMouse;

                vec2 barrel(vec2 uv, float amt) {
                    vec2 cc = uv - 0.5;
                    float r = dot(cc, cc);
                    return uv + cc * r * amt;
                }

                float rand(vec2 co) {
                    return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453);
                }

                void main() {
                    vec2 uv = gl_FragCoord.xy / iResolution.xy;
                    
                    // Parallax drift based on uMouse
                    vec2 mouseOffset = (uMouse - 0.5) * 0.05;
                    uv += mouseOffset;

                    // Barrel distortion curvature
                    uv = barrel(uv, 0.2);

                    // Clamp edges
                    if(uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
                        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                        return;
                    }

                    // Dot matrix resolution
                    vec2 gridCount = vec2(100.0, 100.0 * (iResolution.y / iResolution.x));
                    vec2 gridUv = fract(uv * gridCount);
                    vec2 id = floor(uv * gridCount);

                    // Radial symmetry distance
                    vec2 cc = id / gridCount - 0.5;
                    float dist = length(cc);
                    
                    // Slow breathing pulse
                    float pulse = sin(iTime * 1.5 - dist * 10.0) * 0.5 + 0.5;

                    // Dot formulation
                    float dotSize = 0.35 * pulse;
                    float d = length(gridUv - 0.5);
                    float circle = smoothstep(dotSize, dotSize - 0.05, d);

                    // Digital scanlines
                    float scanline = sin(uv.y * 800.0) * 0.03;

                    // Randomized flicker
                    float flicker = rand(vec2(iTime, id.y)) > 0.98 ? 0.4 : 1.0;

                    // Base color compilation (Tinted Monotone Purple)
                    vec3 col = vec3(circle * pulse * flicker);
                    col -= scanline;
                    col *= vec3(0.7, 0.3, 1.0); // Purple tint
                    
                    // Vignette edge masking
                    col *= smoothstep(0.8, 0.2, dist);

                    gl_FragColor = vec4(col, 1.0);
                }
            \`;

            const compileShader = (type, source) => {
                const shader = gl.createShader(type);
                gl.shaderSource(shader, source);
                gl.compileShader(shader);
                return shader;
            };

            const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource);
            const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

            const program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            gl.useProgram(program);

            const positionBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                -1.0, -1.0,  1.0, -1.0, -1.0,  1.0,
                -1.0,  1.0,  1.0, -1.0,  1.0,  1.0
            ]), gl.STATIC_DRAW);

            const positionLocation = gl.getAttribLocation(program, "position");
            gl.enableVertexAttribArray(positionLocation);
            gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

            const iResLoc = gl.getUniformLocation(program, "iResolution");
            const iTimeLoc = gl.getUniformLocation(program, "iTime");
            const uMouseLoc = gl.getUniformLocation(program, "uMouse");

            // Interactive pointer drift tracking
            let mouseX = 0.5, mouseY = 0.5;
            document.addEventListener('mousemove', (e) => {
                mouseX = e.clientX / window.innerWidth;
                mouseY = 1.0 - (e.clientY / window.innerHeight);
            });

            const startTime = performance.now();
            const render = (time) => {
                const elapsedTime = (time - startTime) / 1000.0;
                
                gl.uniform2f(iResLoc, canvas.width, canvas.height);
                gl.uniform1f(iTimeLoc, elapsedTime);
                gl.uniform2f(uMouseLoc, mouseX, mouseY);

                gl.drawArrays(gl.TRIANGLES, 0, 6);
                requestAnimationFrame(render);
            };
            requestAnimationFrame(render);
        }
    <\/script>
</body>
</html>`;var Vu=`<svg viewBox="0 0 512 512" aria-hidden="true">
  <defs>
    <mask id="threeui-intro-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">
      <rect width="512" height="512" fill="#000"/>
      <circle cx="256" cy="256" r="208" fill="#fff"/>
      <g fill="none" stroke="#000" stroke-linecap="round" stroke-width="28">
        <path d="M36 178C112 252 184 264 260 196C336 128 404 114 482 180"/>
        <path d="M36 292C112 366 184 378 260 310C336 242 404 228 482 294"/>
      </g>
    </mask>
  </defs>
  <rect width="512" height="512" fill="#f5f5f7" mask="url(#threeui-intro-cut)"/>
</svg>`,Yu=`<svg width="1600" height="300" viewBox="0 0 1600 300" fill="none" xmlns="http://www.w3.org/2000/svg">
  <text x="800" y="235" text-anchor="middle" fill="#F4F4F0" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="240" font-weight="900" letter-spacing="-8">SHADERS</text>
</svg>`,Ri={mode:"dark",hue:0,saturation:1,brightness:1},Xu={"rising-diagonal":{title:"Twelve Works in Slow Orbit",headline:["TWELVE WORKS","IN SLOW ORBIT"],headlineWidths:[1846,2e3],axis:25.5,phase:93,direction:1,field:"matte",palette:["#e9e5dd","#20232a","#c25a43","#2f5b4e","#d6cfc2","#3a4763","#dda45c","#14161a","#a7b3a4","#f3f1ec","#5a6670","#8c4b3f"],ink:{dark:["#8d949c","#ffffff","#20232a"],light:["#6b7280","#111827","#e9e5dd"]},type:{font:"sans",weight:"400",headlineSize:1.15,tracking:.1},motion:{spring:!0,ease:.42}},"falling-diagonal":{title:"Signal Lost, Image Holding",headline:["SIGNAL LOST","IMAGE HOLDING"],headlineWidths:[1622,1917],axis:-25.5,phase:87,direction:-1,field:"glitch",palette:["#0b0b12","#ff2f6d","#00e6ff","#13f28a","#f2f2f8","#7a1bff","#101018","#ff7a1a","#141a2e","#e01f52","#1a1a26","#0ac2d8"],ink:{dark:["#ff2f6d","#f2f2f8","#0b0b12"],light:["#c81049","#111827","#f2f2f8"]},type:{font:"sans",weight:"700",headlineSize:1.2,tracking:0},motion:{spring:!1,ease:.12}},"horizontal-sweep":{title:"Prints from the Flat Files",headline:["PRINTS FROM","THE FLAT FILES"],headlineWidths:[1506,1917],axis:0,phase:90,direction:1,field:"riso",palette:["#e0b64a","#b1512a","#6d7638","#ecdfc2","#2f6b66","#8a3a2b","#d69b3e","#3c4630","#c06e3a","#e6d3a8","#546d76","#7a4726"],ink:{dark:["#e0b64a","#f4e9d2","#6d2a16"],light:["#8a3a2b","#2b2018","#e0b64a"]},type:{font:"oldstyle",weight:"700",headlineSize:1.2,tracking:.03},motion:{spring:!1,ease:.9}},"vertical-loop":{title:"One Wall, Twelve Plates",headline:["ONE WALL","TWELVE PLATES"],headlineWidths:[1132,1840],axis:90,phase:0,direction:-1,field:"halftone",palette:["#12110f","#f2efe8","#1c1b18","#e4e0d7","#2b2a26","#d6d1c6","#0a0a09","#faf8f3","#1f1e1a","#eae6dd","#161513","#c0402c"],ink:{dark:["#c0402c","#f2efe8","#12110f"],light:["#c0402c","#12110f","#e4e0d7"]},type:{font:"didone",weight:"400",headlineSize:1.25,tracking:.06},motion:{spring:!1,ease:.55}}},Qu={serif:'"Times New Roman",Times,"Liberation Serif","Nimbus Roman",serif',didone:'Didot,"Bodoni 72","Bodoni MT","Playfair Display",Georgia,serif',oldstyle:'"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif',sans:'"Helvetica Neue",Helvetica,"Inter",Arial,system-ui,sans-serif'};var Ku={variant:"rising-diagonal"};function Zu(e,t){let r=t==="light"?"#f4f7fb":"#111318",n=t==="light"?["#60a5fa","#3b82f6","#2563eb"]:["#2563eb","#1d4ed8","#1e40af"];return e.replace("<title>Uploading \u2014 glowing border microinteraction</title>","<title>Thinking \u2014 glowing border microinteraction</title>").replace("<style>",`<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300&display=swap" rel="stylesheet">
<style>`).replaceAll("#1d1d1d",r).replace("var word = 'Uploading'","var word = 'Thinking'").replace(`var FONT = '300 100px -apple-system, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Inter, system-ui, "Segoe UI", Roboto, sans-serif';`,`var FONT = '300 100px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';`).replace(`      if(glyphs[i].ch === 'g') doubleStoreyG(c);
      else{`,"      {").replace("grd.addColorStop(0, '#2e3242');",`grd.addColorStop(0, '${n[0]}');`).replace("grd.addColorStop(0.55, '#2b2f3c');",`grd.addColorStop(0.55, '${n[1]}');`).replace("grd.addColorStop(1, '#272c36');",`grd.addColorStop(1, '${n[2]}');`).replaceAll("rgb(83,92,135)","rgb(219,234,254)").replaceAll("rgb(97,106,150)","rgb(239,246,255)").replace("rgb(133,141,189)","rgb(255,255,255)").replace("  var CX = 1024 - 22, CY = 1024 + 11.5;   /* button centre in the source recording */",`  var SCL = 0.49;                          /* hero button -> normal button */
  var CX = (1024 - 22)/SCL, CY = (1024 + 11.5)/SCL;`).replace("    k = S*dpr/REF;","    k = S*dpr/REF*SCL;").replace("  var PW = 976, PH = 345, PR = 100;","  var PW = 1010, PH = 345, PR = 100;").replace("  var TXT_W = 778, TXT_CAP = 120, TXT_BASE = 1093;",`  var TXT_W = 450, TXT_CAP = 79, TXT_BASE = CY + 38;
  var BR_R = 13, BR_SP = 40, BR_GAP = 78;   /* braille dot radius, cell pitch, gap to label */
  var BR_W = BR_SP + 2*BR_R, BR_SHIFT = (BR_W + BR_GAP)/2;
  /* the terminal 'dots' spinner, as raised-dot masks: bit 0..2 = left column top->bottom, 3..5 = right */
  var BRAILLE = [0x0B,0x19,0x39,0x38,0x3C,0x34,0x26,0x27,0x07,0x0F];
  var BR_STEPS = 30;                        /* three full spinner cycles per lap, so the loop still joins */`).replace("  var glyphs = [], fontPx = 169, tracking = 0, textX = 0;","  var glyphs = [], fontPx = 169, tracking = 0, textX = 0, brailleX = 0;").replace("    textX = (CX + 4)*k - TXT_W*k/2 + lead;",`    textX = (CX + 4)*k - TXT_W*k/2 + lead + BR_SHIFT*k;
    brailleX = (CX + 4)*k - (BR_W + BR_GAP + TXT_W)*k/2 + BR_R*k;`).replace("  function label(c, ph){",`  /* the spinner is drawn as dots rather than braille glyphs, so it never depends
     on a system face carrying the U+28xx block */
  function braille(c, ph){
    var mask = BRAILLE[Math.floor(ph*BR_STEPS) % BRAILLE.length];
    var cy = (CY - 1.5)*k, r = BR_R*k, sp = BR_SP*k;
    for(var b=0;b<6;b++){
      var on = (mask >> b) & 1;
      c.beginPath();
      c.arc(brailleX + (b < 3 ? 0 : sp), cy + ((b % 3) - 1)*sp, on ? r : r*0.7, 0, Math.PI*2);
      c.fillStyle = on ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.16)';
      c.fill();
    }
  }

  function label(c, ph){`).replace(`    plate(ctx);
    label(ctx, ph);`,`    plate(ctx);
    braille(ctx, ph);
    label(ctx, ph);`)}function Ju(e,t){return t!=="dark"?e:e.replace("from-black/10 via-black/20 to-black/10","from-white/[0.16] via-white/[0.07] to-white/[0.16]").replace("text-black/60","text-white/70").replace("text-slate-600","text-slate-200").replace('stroke="#666"','stroke="#e5e7eb"').replace("hover:bg-slate-50","hover:bg-white/10")}function $u(e,t){return t!=="light"?e:e.replaceAll("#fffa","#111a").replaceAll("#fffd","#111d").replaceAll("#fff4","#1114").replaceAll("#fff3","#1113").replaceAll("#fff2","#1112")}var ef=/function buildLabels\(\)\{[\s\S]*?\n\}\n\nfunction resize/,tf=/function buildHead\(\)\{[\s\S]*?\n\}\n\nfunction buildLabels/,rf=/function lin\(x,x0,y0,x1,y1,stops\)\{[\s\S]*?\n\];\n\nfunction roundRectPath/,nf=/    \/\* film grain \*\/\n[\s\S]*?\n    x\.restore\(\);\n    front\.push\(c\);/,af=/var t0 = performance\.now\(\), tNow = 0, playing = true;[\s\S]*?window\.__play = function\(\)\{ t0 = performance\.now\(\) - tNow\*1000; playing = true; \};/,of=`function buildHead(){
  headLayer = mkc(Math.max(1,W), Math.max(1,H));
  var x = headLayer.getContext('2d');
  if (x.letterSpacing !== undefined) x.letterSpacing = (HEAD_TRACK*HEAD_CAP*HEAD_SIZE*K).toFixed(2)+'px';
  if (HEAD_STYLE === 'riso'){
    var off = 0.055*HEAD_CAP*HEAD_SIZE*K;
    headPass(x, off, off, HEAD_SHADOW);
  }
  headPass(x, 0, 0, null);
  if (HEAD_STYLE === 'glitch') headGlitch(x);
}

/* one setting of the two headline lines, optionally displaced and forced to
   a single colour, so a style can stack passes into its treatment */
function headPass(x, dx, dy, tint){
  for (var i=0;i<HEAD.length;i++){
    var h = HEAD[i];
    fitText(x, h.s, SANS, HEAD_WEIGHT, HEAD_CAP*HEAD_SIZE*K, d2sx(1481) + dx,
            d2sy(HEAD_MID + (h.top - HEAD_MID)*HEAD_SIZE) + dy, h.w*HEAD_SIZE*K, tint || h.fill);
  }
}

/* the headline as a picture that lost its signal: a few rows slip sideways
   and two colour channels sit out of register behind the letterforms */
function headGlitch(x){
  var w = headLayer.width, h = headLayer.height, i;
  var snap = mkc(w,h);
  snap.getContext('2d').drawImage(headLayer,0,0);
  var r = rng(0x2E51);
  var top = d2sy(HEAD_MID) - HEAD_CAP*HEAD_SIZE*K*2.1, span = HEAD_CAP*HEAD_SIZE*K*4.2;
  for (i=0;i<7;i++){
    var sy = Math.round(top + r()*span);
    var sh = Math.round((0.03 + r()*0.11)*HEAD_CAP*HEAD_SIZE*K);
    var dx = Math.round((r()-0.5)*0.08*w);
    x.clearRect(0,sy,w,sh);
    x.drawImage(snap, 0,sy,w,sh, dx,sy,w,sh);
  }
  var ghost = function(color){
    var g = mkc(w,h), gx = g.getContext('2d');
    gx.drawImage(snap,0,0);
    gx.globalCompositeOperation = 'source-in';
    gx.fillStyle = color; gx.fillRect(0,0,w,h);
    return g;
  };
  var off = 0.05*HEAD_CAP*HEAD_SIZE*K;
  x.save();
  /* the ghosts go under the letterforms, so the headline stays readable */
  x.globalCompositeOperation = 'destination-over';
  x.globalAlpha = 0.9;
  x.drawImage(ghost(HEAD_GHOST[0]), -off, 0);
  x.drawImage(ghost(HEAD_GHOST[1]), off, 0);
  x.restore();
}

function buildLabels`,sf=`function fill(x,style){ x.fillStyle = style; x.fillRect(0,0,TS,TS); }

function rgbOf(hex){
  var v = parseInt(hex.slice(1),16);
  return [(v>>16)&255,(v>>8)&255,v&255];
}
function mixRGB(a,b,t){
  return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
}
function cssRGB(c){
  return 'rgb('+(c[0]|0)+','+(c[1]|0)+','+(c[2]|0)+')';
}
function luma(c){ return (c[0]*0.299 + c[1]*0.587 + c[2]*0.114)/255; }

/* value noise on a 64x64 lattice, smoothstep-interpolated and wrapped */
function noiseField(seed){
  var g = new Float32Array(4096), r = rng(seed), i;
  for (i=0;i<4096;i++) g[i] = r();
  return function(x,y){
    var x0 = Math.floor(x), y0 = Math.floor(y);
    var fx = x - x0, fy = y - y0;
    fx = fx*fx*(3-2*fx); fy = fy*fy*(3-2*fy);
    var ra = (y0 & 63)*64, rb = ((y0+1) & 63)*64, ca = x0 & 63, cb = (x0+1) & 63;
    var a = g[ra+ca], b = g[ra+cb], c = g[rb+ca], d = g[rb+cb];
    return a + (b-a)*fx + (c-a)*fy + (a-b-c+d)*fx*fy;
  };
}
function fbm(n,x,y,oct){
  var v = 0, amp = 0.5, f = 1, tot = 0, i;
  for (i=0;i<oct;i++){ v += amp*n(x*f,y*f); tot += amp; amp *= 0.5; f *= 2; }
  return v/tot;
}
function grain(x, alpha){
  x.save();
  x.globalCompositeOperation = 'overlay';
  x.globalAlpha = alpha;
  x.fillStyle = x.createPattern(grainTile,'repeat');
  x.fillRect(0,0,TS,TS);
  x.restore();
}

/* paint a low-resolution field, then blow it up over the whole tile: smooth
   for a matte plate, nearest wherever the noise has to keep its edges */
function fieldBuffer(N, shade){
  var buf = mkc(N,N), bx = buf.getContext('2d'), d = bx.createImageData(N,N), px, py, o, c;
  for (py=0;py<N;py++){
    for (px=0;px<N;px++){
      c = shade((px+0.5)/N, (py+0.5)/N, px, py);
      o = (py*N+px)*4;
      d.data[o] = c[0]|0; d.data[o+1] = c[1]|0; d.data[o+2] = c[2]|0;
      d.data[o+3] = c.length > 3 ? c[3]|0 : 255;
    }
  }
  bx.putImageData(d,0,0);
  return buf;
}
function blowUp(x, buf, smooth, alpha){
  x.save();
  x.imageSmoothingEnabled = smooth;
  if (alpha !== undefined) x.globalAlpha = alpha;
  x.drawImage(buf, 0, 0, TS, TS);
  x.restore();
}

/* matte \u2014 a museum plate: flat colour, one slow rise of noise across it,
   and grain fine enough to read as the surface rather than as an effect */
function paintMatte(x, base, i){
  var n = noiseField(0x2C41 + i*9176);
  var hi = mixRGB(base,[255,255,255],0.13), lo = mixRGB(base,[0,0,0],0.15);
  blowUp(x, fieldBuffer(160, function(u,v){
    var s = 0.5 + (fbm(n, u*6.5, v*6.5, 5) - 0.5)*1.9 + (v - 0.5)*0.07;
    s = s < 0 ? 0 : s > 1 ? 1 : s;
    return s < 0.5 ? mixRGB(lo, base, s*2) : mixRGB(base, hi, (s-0.5)*2);
  }), true);
  grain(x, 0.1);
}

/* glitch \u2014 a plate that lost the signal: flat blocks torn out of the
   neighbouring colours, rows slipped sideways, two channels off register */
function paintGlitch(x, base, i){
  var r = rng(0x51B7 + i*30011), k;
  fill(x, cssRGB(base));
  for (k=0;k<4;k++){
    x.fillStyle = cssRGB(rgbOf(PLATES[(i + 1 + ((r()*5)|0)) % PLATES.length]));
    x.fillRect(Math.round((r()-0.2)*TS), Math.round(r()*TS),
               Math.round((0.2 + r()*0.55)*TS), Math.round((0.04 + r()*0.2)*TS));
  }
  blowUp(x, fieldBuffer(64, function(){
    var w = r() < 0.5 ? 250 : 6;
    return [w,w,w, r() < 0.2 ? 200 : 0];
  }), false, 0.5);
  /* rows slip sideways, each one wrapped so no edge is ever left empty */
  var snap = mkc(TS,TS);
  snap.getContext('2d').drawImage(x.canvas,0,0);
  for (k=0;k<11;k++){
    var y0 = Math.round(r()*TS), h = Math.round((0.01 + r()*0.06)*TS);
    var dx = Math.round((r()-0.5)*0.36*TS);
    x.clearRect(0,y0,TS,h);
    x.drawImage(snap, 0,y0,TS,h, dx,y0,TS,h);
    x.drawImage(snap, 0,y0,TS,h, dx + (dx < 0 ? TS : -TS),y0,TS,h);
  }
  var channel = function(color){
    var g = mkc(TS,TS), gx = g.getContext('2d');
    gx.drawImage(x.canvas,0,0);
    gx.globalCompositeOperation = 'multiply';
    gx.fillStyle = color; gx.fillRect(0,0,TS,TS);
    return g;
  };
  var red = channel('#ff3050'), cyan = channel('#30e0ff');
  x.save();
  x.globalCompositeOperation = 'lighter';
  x.globalAlpha = 0.3;
  x.drawImage(red, -0.022*TS, 0);
  x.drawImage(cyan, 0.022*TS, 0);
  x.restore();
  x.save();
  x.fillStyle = 'rgba(0,0,0,0.22)';
  for (k=0;k<TS;k+=4) x.fillRect(0,k,TS,1);
  x.restore();
  grain(x, 0.24);
}

/* riso \u2014 the printed plate: a lit corner and a noise field quantised to
   three tones through an ordered dither, then scanlines and heavy grain */
var BAYER = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
function paintRiso(x, base, i){
  var n = noiseField(0x77A3 + i*15731), k;
  var lo = mixRGB(base,[24,14,6],0.66), hi = mixRGB(base,[255,238,196],0.5);
  var cx = 0.22 + (i % 3)*0.28, cy = 0.2 + ((i/3)|0)*0.2;
  blowUp(x, fieldBuffer(100, function(u,v,px,py){
    var d = Math.sqrt((u-cx)*(u-cx) + (v-cy)*(v-cy));
    var s = (1 - d*1.25)*0.72 + fbm(n, u*3.2, v*3.2, 3)*0.52 - 0.1;
    var band = Math.floor(s*2.4 + (BAYER[(py & 3)*4 + (px & 3)] + 0.5)/16);
    return band <= 0 ? lo : band === 1 ? base : hi;
  }), false);
  x.save();
  x.fillStyle = 'rgba(28,14,4,0.18)';
  for (k=0;k<TS;k+=6) x.fillRect(0,k,TS,2);
  x.restore();
  grain(x, 0.22);
}

/* halftone \u2014 one ink on one stock, shaded only by the size of the dots on
   a screen rotated a few degrees further for every tile */
function paintHalftone(x, base, i){
  var n = noiseField(0x3F19 + i*21467), gx, gy;
  fill(x, cssRGB(base));
  var dot = luma(base) > 0.5 ? mixRGB(base,[0,0,0],0.88) : mixRGB(base,[255,255,255],0.9);
  var pitch = TS/30, a = (17 + (i % 4)*9)*Math.PI/180;
  var ca = Math.cos(a), sa = Math.sin(a), span = Math.ceil(TS/pitch);
  x.save();
  x.fillStyle = cssRGB(dot);
  x.translate(TS/2, TS/2);
  x.rotate(a);
  for (gy=-span;gy<=span;gy++){
    for (gx=-span;gx<=span;gx++){
      var wx = gx*pitch, wy = gy*pitch;
      var u = (wx*ca - wy*sa)/TS + 0.5, v = (wx*sa + wy*ca)/TS + 0.5;
      if (u < -0.1 || u > 1.1 || v < -0.1 || v > 1.1) continue;
      var s = fbm(n, u*2.7, v*2.7, 4)*0.95 + (0.55 - v)*0.5;
      var rad = pitch*0.66*(s < 0 ? 0 : s > 1 ? 1 : s);
      if (rad < 0.4) continue;
      x.beginPath(); x.arc(wx, wy, rad, 0, Math.PI*2); x.fill();
    }
  }
  x.restore();
  grain(x, 0.12);
}

var PAINTERS = { matte: paintMatte, glitch: paintGlitch, riso: paintRiso, halftone: paintHalftone };
var ART = (function(){
  var painter = PAINTERS[FIELD] || paintMatte, list = [], i;
  for (i=0;i<PLATES.length;i++){
    list.push((function(index){
      return function(x){ painter(x, rgbOf(PLATES[index]), index); };
    })(i));
  }
  return list;
})();

function roundRectPath`,lf=`var tNow = 0, playing = true, hovering = false, rate = 0, vel = 0, settled = false, last = performance.now();

function setHover(state){
  if (hovering === state) return;
  hovering = state; settled = false;
  /* the host cannot see the pointer arrive over this frame, so tell it \u2014 it is
     the one that will see the pointer leave again */
  if (state && window.parent !== window){
    try { window.parent.postMessage({ threeuiPointerOver: true }, '*'); } catch (error) {}
  }
}
var root = document.documentElement;
root.addEventListener('pointerenter', function(){ setHover(true); });
root.addEventListener('pointermove',  function(){ setHover(true); });
root.addEventListener('pointerdown',  function(){ setHover(true); });
root.addEventListener('pointerleave', function(){ setHover(false); });
root.addEventListener('pointercancel',function(){ setHover(false); });
window.addEventListener('blur', function(){ setHover(false); });

function frame(now){
  var dt = Math.min(0.05, Math.max(0, (now - last)/1000));
  last = now;
  if (playing){
    if (SPRING){
      vel += (((hovering ? 1 : 0) - rate)*SPRING_K - vel*SPRING_D)*dt;
      rate += vel*dt;
    } else {
      rate += ((hovering ? 1 : 0) - rate) * (1 - Math.exp(-dt/EASE));
    }
    if (Math.abs(rate) > 0.0004 || Math.abs(vel) > 0.0004){
      tNow = ((tNow + dt*rate) % DUR + DUR) % DUR;
      render(tNow); settled = false;
    } else if (!settled){
      rate = 0; vel = 0; render(tNow); settled = true;
    }
  }
  requestAnimationFrame(frame);
}

/* font family, weight, and headline size arrive live so a control tick never
   rebuilds the document and repaints the twelve tile textures */
window.addEventListener('message', function(event){
  var runtime = event.data && event.data.threeuiRuntime;
  if (!runtime) return;
  if (typeof runtime.font === 'string') SANS = runtime.font;
  if (typeof runtime.weight === 'string') HEAD_WEIGHT = runtime.weight;
  if (typeof runtime.headlineSize === 'number' && runtime.headlineSize > 0){
    HEAD_SIZE = Math.max(0.6, Math.min(1.8, runtime.headlineSize));
  }
  if (typeof runtime.hover === 'number') setHover(runtime.hover > 0);
  buildHead(); settled = false; render(tNow);
});

window.addEventListener('resize', function(){ resize(); settled = false; render(tNow); });
resize();
render(tNow);
requestAnimationFrame(frame);

window.__DUR = DUR;
window.__seek = function(t){
  tNow = ((t % DUR) + DUR) % DUR;
  playing = false;
  render(tNow);
};
window.__play = function(){ last = performance.now(); playing = true; settled = false; };`;function cf(e,t,r){let n=t==="light"?"#f4f7fb":"#000000",i=t==="light"?r.ink.light:r.ink.dark,a=Qu[r.type.font];return e.replace("<title>New Grainient Collection Added \u2014 motion</title>",`<title>${r.title} \u2014 motion</title>`).replace("html,body{margin:0;height:100%;background:#000;overflow:hidden}",`html,body{margin:0;height:100%;background:${n};overflow:hidden}`).replace("axis: 25.5,",`axis: ${r.axis},`).replace("phase: 93",`phase: ${r.phase}`).replace("  tile: 346,            /* tile side in ring units (R = a)               */",`  tile: 346,            /* tile width in ring units (R = a)              */
  aspect: 0.75,         /* tile height / width \u2014 a 4:3 landscape crop    */`).replace("  roundRectPath(ctx, TS, TS, TS*RING.radius);","  roundRectPath(ctx, TS, TS*RING.aspect, TS*RING.aspect*RING.radius);").replace(`var CAP = 142;          /* headline cap height */
var SMALL = 22;         /* small-label cap height */`,`var HEAD_CAP = 142;     /* authored headline cap height */
var HEAD_MID = 1093;    /* authored vertical centre of the two-line block */
var HEAD_SIZE = ${r.type.headlineSize};   /* headline size multiplier */
var HEAD_WEIGHT = '${r.type.weight}'; /* headline weight */
var HEAD_TRACK = ${r.type.tracking};   /* headline tracking, in cap heights */
var HEAD_STYLE = '${r.field}';
var HEAD_SHADOW = '${i[2]}';  /* riso: the plate under the ink */
var HEAD_GHOST = ['#ff2f6d','#00e6ff'];  /* glitch: the two channel ghosts */
var PLATES = ${JSON.stringify(r.palette)};
var FIELD = '${r.field}';       /* which painter shades the plates */
var EASE = ${r.motion.ease};        /* seconds for the orbit to reach hover speed */
var SPRING = ${r.motion.spring?1:0}, SPRING_K = 26, SPRING_D = 5.7;`).replace(`var SANS = '"Helvetica Neue",Helvetica,"Inter",Arial,system-ui,sans-serif';`,`var SANS = '${a}';`).replace("{ s:'NEW GRAINIENT',    top:930,  w:1370, fill:'#d0d0d0' }",`{ s:'${r.headline[0]}', top:930,  w:${r.headlineWidths[0]}, fill:'${i[0]}' }`).replace("{ s:'COLLECTION ADDED', top:1114, w:1775, fill:'#ffffff' }",`{ s:'${r.headline[1]}', top:1114, w:${r.headlineWidths[1]}, fill:'${i[1]}' }`).replace(' * Tile artwork \u2014 eleven grainy gradient "wallpapers"'," * Tile artwork \u2014 twelve flat plates under a procedural noise field").replace(rf,sf).replace(nf,`    /* each field painter lays its own grain, at the weight its style wants */
    front.push(c);`).replace("y.fillStyle = 'rgba(6,8,18,0.75)';","y.fillStyle = 'rgba(10,12,24,0.45)';").replace(tf,of).replace(ef,`function buildLabels(){
  /* the launch poster's corner marks and flanking notes are dropped; the
     layer stays so the compositing order below is untouched */
  labelLayer = mkc(1,1);
}

function resize`).replace("var spin = (t/DUR)*Math.PI*2;",`var spin = (t/DUR)*Math.PI*2*${r.direction};`).replace(`ctx.fillStyle = '#000';
  ctx.fillRect(0,0,W,H);`,`ctx.fillStyle = '${n}';
  ctx.fillRect(0,0,W,H);`).replace(af,lf)}function df(e,t){let r=t==="light"?"[[8, 10, 15], [40, 48, 62], [85, 96, 116]]":"[[255, 255, 255], [226, 232, 240], [191, 205, 225]]";return e.replace("<title>Epilude \u2014 Footer</title>","<title>Shaders Particle Wordmark</title>").replace("aspect-ratio: 8.541554959785524;","aspect-ratio: 5.333333333333333;").replace(/var WORDMARK =[\s\S]*?"<\/svg>";/,`var WORDMARK = ${JSON.stringify(Yu)};`).replace("var PALETTE = [[255, 255, 255], [226, 232, 240], [191, 205, 225]];",`var PALETTE = ${r};`).replace("a: 0.04 + 0.95 * band * Math.pow(flake, 1.8)","a: 0.14 + 0.86 * band * Math.pow(flake, 1.8)")}function pf(e,t){let r=t==="light"?"#f4f7fb":"#000",n=t==="light"?"#172033":"#E8EEE9",i=t==="light"?"#536076":"#c9d4cc",a=t==="light"?"#315efb":"#7080ff";return e.replace("<title>Supreme Radio \u2014 Graphic Identity</title>","<title>ThreeUI \u2014 Audio Wordmark</title>").replaceAll("supreme radio","ThreeUI").replaceAll("#EA3927",a).replaceAll("#E8EEE9",n).replaceAll("#E3EDE5",n).replaceAll("#c9d4cc",i).replaceAll("#000",r).replace("var DUR = 20;","var DUR = 4.7;")}var M={expanse:{title:"Expanse Field shader background",source:Ud,background:"#07080b",targets:[{selector:"#glcanvas",role:"background"}]},starfield:{title:"Imaginie star portal",source:e0,background:"#0d0a12",theme:{nativeMode:"dark",lightBackground:"#f4f7fb",darkBackground:"#0d0a12",invertBackground:!0},targets:[{selector:"#ambient-starfield",role:"background"},{selector:"#portal-stars",role:"background"},{selector:".holo-btn",role:"button"}]},performanceGaugesTachometer:{title:"Tachometer diagnostic gauge",source:an,background:"#000000",targets:[{selector:"#gauge-tachometer",role:"visual",fit:"contain-square"}]},performanceGaugesSpeedometer:{title:"Speedometer diagnostic gauge",source:an,background:"#000000",targets:[{selector:"#gauge-speedometer",role:"visual",fit:"contain-square"}]},performanceGaugesBoost:{title:"Turbo boost diagnostic gauge",source:an,background:"#000000",targets:[{selector:"#gauge-boost",role:"visual",fit:"contain-square"}]},performanceGaugesPower:{title:"EV power diagnostic gauge",source:an,background:"#000000",targets:[{selector:"#gauge-power",role:"visual",fit:"contain-square"}]},logicCore:{title:"Logic Core isometric field",source:o0,background:"#050505",targets:[{selector:"#three-canvas-container",role:"background"}]},ignition:{title:"Ignition Button shader button",source:Jd,background:"#f0ede7",theme:{nativeMode:"light",lightBackground:"#f0ede7",darkBackground:"#121316",invertBackground:!0},targets:[{selector:"#bg-gl",role:"background"},{selector:"#btn",role:"button"}]},induction:{title:"Induction Button kinetic button",source:l0,background:"#050505",theme:{nativeMode:"dark",lightBackground:"#f4f7fb",darkBackground:"#050505",invertBackground:!0},targets:[{selector:"#bg-canvas",role:"background"},{selector:"#btn",role:"button"}]},aetherisLabs:{title:"Aetheris Labs plasma button",source:Nd,background:"#020614",theme:{nativeMode:"dark",lightBackground:"#f4f7fb",darkBackground:"#020614",invertBackground:!0},targets:[{selector:"#bg-gl",role:"background"},{selector:"#btn",role:"button"}]},tactile:{title:"Nexus tactile fluidics button",source:t0,background:"#03090d",theme:{nativeMode:"dark",lightBackground:"#f4f7fb",darkBackground:"#03090d",invertBackground:!0},targets:[{selector:"#bg-canvas",role:"background"},{selector:"#btn",role:"button"}]},thinking:{title:"Thinking Button canvas animation",source:a0,background:"#111318",theme:{lightBackground:"#f4f7fb",darkBackground:"#111318"},transformSource:Zu,targets:[{selector:"#stage",role:"button"}]},slidingTextCta:{title:"Sliding Text CTA button",source:n0,background:"#111318",theme:{lightBackground:"#f4f7fb",darkBackground:"#111318"},targets:[{selector:".component-wrapper button",role:"button",preserveTransform:!0}]},floatingDotsCta:{title:"Floating Dots CTA button",source:Gd,background:"#111318",theme:{lightBackground:"#f4f7fb",darkBackground:"#111318"},targets:[{selector:".component-wrapper button",role:"button",preserveTransform:!0}]},launchButton:{title:"Gradient Launch button",source:$d,background:"#111318",theme:{lightBackground:"#f4f7fb",darkBackground:"#111318"},targets:[{selector:".component-wrapper button",role:"button",preserveTransform:!0}]},dotBorderButton:{title:"Dot Border button",source:qd,background:"#111318",theme:{lightBackground:"#f4f7fb",darkBackground:"#111318"},transformSource:$u,targets:[{selector:".component-wrapper .btn-wrapper",role:"button",preserveTransform:!0}]},gradientCta:{title:"Gradient CTA button",source:Kd,background:"#111318",theme:{lightBackground:"#f4f7fb",darkBackground:"#111318"},targets:[{selector:".component-wrapper button",role:"button",preserveTransform:!0}]},spinningBorderButton:{title:"Spinning Border button",source:i0,background:"#111318",theme:{lightBackground:"#f4f7fb",darkBackground:"#111318"},targets:[{selector:".component-wrapper button",role:"button",preserveTransform:!0}]},glassmorphismCta:{title:"Glassmorphism CTA button",source:Xd,background:"#111318",theme:{lightBackground:"#f4f7fb",darkBackground:"#111318"},targets:[{selector:".component-wrapper a",role:"button",preserveTransform:!0}]},generateButton:{title:"Generate button",source:Yd,background:"#111318",theme:{lightBackground:"#f4f7fb",darkBackground:"#111318"},targets:[{selector:".component-wrapper .btn-wrapper",role:"button",preserveTransform:!0}]},gradientPillButton:{title:"Gradient Pill button",source:Zd,background:"#111318",theme:{lightBackground:"#f4f7fb",darkBackground:"#111318"},transformSource:Ju,targets:[{selector:".component-wrapper button",role:"button",preserveTransform:!0}]},gradientBeamCta:{title:"Gradient Beam CTA button",source:Qd,background:"#111318",theme:{lightBackground:"#f4f7fb",darkBackground:"#111318"},targets:[{selector:".component-wrapper button",role:"button",preserveTransform:!0}]},threeUIIntro:{title:"ThreeUI chromatic wordmark intro",source:jd,background:"#000000",theme:{nativeMode:"dark",lightBackground:"#f4f7fb",darkBackground:"#000000",invertBackground:!0},targets:[{selector:"#stage",role:"background"}],hiddenTargets:[".sr"],introWordmark:{sceneSelector:"#comp .scene:first-child",text:"ThreeUI",fontSize:130,endTime:1.7,holdTime:1.1,logoSvg:Vu}},particleWordmark:{title:"Shaders particle wordmark",source:Wd,background:"#0c0c0d",theme:{lightBackground:"#f4f7fb",darkBackground:"#0c0c0d"},transformSource:df,targets:[{selector:"#storm",role:"visual",fit:"wide-wordmark"}]},audioWordmark:{title:"ThreeUI audio wordmark",source:Od,background:"#000000",theme:{lightBackground:"#f4f7fb",darkBackground:"#000000"},transformSource:pf,targets:[{selector:"#stage",role:"visual",fit:"portrait-stage",preserveTransform:!0}]},galleryHeading:{title:"Gallery Heading canvas animation",source:Vd,background:"#000000",theme:{lightBackground:"#f4f7fb",darkBackground:"#000000"},transformSource:(e,t)=>cf(e,t,Xu[Ku.variant]),targets:[{selector:"#stage",role:"background"}]},dimensional:{title:"Vanguard dimensional architecture",source:c0,background:"#050608",targets:[{selector:"#webgl-canvas",role:"background"}]},cloud:{title:"Strata cloud migration field",source:s0,background:"#071010",targets:[{selector:"#c",role:"background"}]},vertex9:{title:"Vertex 9 global data field",source:d0,background:"#050505",targets:[{selector:"#webgl-canvas",role:"background"}]},topology:{title:"Nexus topology field",source:r0,background:"#070707",targets:[{selector:"#animationCanvas",role:"background"}]},voidField:{title:"Void Field shader background",source:p0,background:"#030305",targets:[{selector:"#webgl-canvas",role:"background"}]}};function Jo(e,t,r){return Math.min(r,Math.max(t,e))}function f0(e,t){return e.theme?.[`${t}Background`]??e.background}function uf(e,t){let r=f0(e,t),n=e.theme?.invertBackground===!0&&e.theme.nativeMode!==t,i=e.transformSource?.(e.source,t)??e.source,a=JSON.stringify(e.targets).replace(/</g,"\\u003c"),o=JSON.stringify(e.hiddenTargets??[]).replace(/</g,"\\u003c"),s=JSON.stringify(e.introWordmark??null).replace(/</g,"\\u003c"),l=JSON.stringify(t),d=n?"filter: invert(1) hue-rotate(180deg) saturate(.92) brightness(1.02) !important;":"",f=e.introWordmark?`${e.introWordmark.sceneSelector} .tx { font-size: ${e.introWordmark.fontSize}px !important; }`:"",h=`<style data-threeui-focus>
html, body { width: 100% !important; height: 100% !important; min-height: 0 !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: ${r} !important; color-scheme: ${t} !important; }
body { position: relative !important; display: flex !important; align-items: center !important; justify-content: center !important; }
body > * { visibility: hidden !important; }
body[data-threeui-ready] > [data-threeui-role] { visibility: visible !important; }
[data-threeui-residual] { display: none !important; }
[data-threeui-hidden] { display: none !important; }
[data-threeui-role="background"] { position: fixed !important; inset: 0 !important; width: 100% !important; height: 100% !important; max-width: none !important; max-height: none !important; z-index: 0 !important; opacity: 1 !important; pointer-events: none !important; ${d} }
[data-threeui-role="background"][data-threeui-fit="contain-square"] { position: absolute !important; top: 50% !important; right: auto !important; bottom: auto !important; left: 50% !important; width: min(100vw, 100vh) !important; height: min(100vw, 100vh) !important; aspect-ratio: 1 / 1 !important; transform: translate(-50%, -50%) !important; }
[data-threeui-role="button"] { position: relative !important; z-index: 2 !important; opacity: 1 !important; flex: none !important; }
[data-threeui-role="button"]:not([data-threeui-preserve-transform]) { transform: none !important; }
[data-threeui-role="visual"] { position: relative !important; z-index: 1 !important; width: min(100%, 1040px) !important; max-width: 1040px !important; max-height: 100% !important; margin: auto !important; padding: 24px !important; overflow: auto !important; opacity: 1 !important; filter: none !important; }
[data-threeui-role="visual"]:not([data-threeui-preserve-transform]) { transform: none !important; }
[data-threeui-role="visual"][data-threeui-fit="contain-square"] { flex: none !important; width: min(calc(100vw - 32px), calc(100vh - 32px)) !important; max-width: none !important; height: min(calc(100vw - 32px), calc(100vh - 32px)) !important; max-height: none !important; aspect-ratio: 1 / 1 !important; padding: 0 !important; overflow: hidden !important; }
[data-threeui-role="visual"][data-threeui-fit="wide-wordmark"] { width: min(calc(100vw - 48px), 1180px) !important; max-width: calc(100vw - 48px) !important; height: auto !important; max-height: none !important; aspect-ratio: 16 / 3 !important; padding: 0 !important; overflow: hidden !important; }
[data-threeui-role="visual"][data-threeui-fit="portrait-stage"] { position: absolute !important; top: 50% !important; right: auto !important; bottom: auto !important; left: 50% !important; width: 1080px !important; max-width: none !important; height: 1350px !important; max-height: none !important; padding: 0 !important; overflow: hidden !important; transform-origin: center !important; }
${f}
</style>`,g=`<script data-threeui-focus>
(function () {
  document.documentElement.dataset.sfMode = ${l};
  var isolated = false;
  function isolate() {
    if (isolated) return;
    var specs = ${a};
    var hiddenSelectors = ${o};
    var introWordmark = ${s};
    var roots = [];
    hiddenSelectors.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (element) {
        element.setAttribute('data-threeui-hidden', '');
        element.setAttribute('aria-hidden', 'true');
        if ('inert' in element) element.inert = true;
      });
    });
    specs.forEach(function (spec) {
      var element = document.querySelector(spec.selector);
      if (!element) return;
      element.setAttribute('data-threeui-role', spec.role);
      if (spec.fit) element.setAttribute('data-threeui-fit', spec.fit);
      if (spec.preserveTransform) element.setAttribute('data-threeui-preserve-transform', '');
      if (!roots.some(function (root) { return root.contains(element); })) roots.push(element);
    });
    if (introWordmark) {
      var introScene = document.querySelector(introWordmark.sceneSelector);
      var introText = introScene && introScene.querySelector('.tx');
      var introMark = introText && introText.querySelector('.mark');
      if (introText && introMark) {
        introMark.innerHTML = introWordmark.logoSvg;
        var introCharacters = Array.from(introText.children).filter(function (element) { return element !== introMark; });
        introCharacters.forEach(function (element, index) {
          element.textContent = introWordmark.text[index] === ' ' ? '\xA0' : (introWordmark.text[index] || '');
          element.style.display = index < introWordmark.text.length ? 'inline-block' : 'none';
        });
      }
      var introReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var introStartedAt = performance.now();
      function renderIntroWordmark(now) {
        if (typeof window.__seek !== 'function') return;
        if (introReducedMotion) {
          window.__seek(introWordmark.endTime);
          return;
        }
        var introCycle = introWordmark.endTime + introWordmark.holdTime;
        var introTime = ((now - introStartedAt) / 1000) % introCycle;
        window.__seek(Math.min(introTime, introWordmark.endTime));
        requestAnimationFrame(renderIntroWordmark);
      }
      requestAnimationFrame(renderIntroWordmark);
    }
    if (!roots.length) return;
    isolated = true;
    roots.forEach(function (root) {
      var placeholderLink = root.matches('a[href="#"]') ? root : root.querySelector('a[href="#"]');
      if (placeholderLink) placeholderLink.addEventListener('click', function (event) { event.preventDefault(); });
      document.body.appendChild(root);
    });
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
<\/script>`;return i.replace(/<\/head>/i,`${h}</head>`).replace(/<\/body>/i,`${g}</body>`)}function g0({definition:e,mode:t=Ri.mode,hue:r=Ri.hue,saturation:n=Ri.saturation,brightness:i=Ri.brightness,runtime:a,trackPointerHover:o,className:s,style:l}){let d=(0,Lt.useRef)(null),f=t==="light"?"light":"dark",h=f0(e,f),g=(0,Lt.useMemo)(()=>uf(e,f),[e,f]),x=Jo(r,-180,180),w=Jo(n,0,2),y=Jo(i,.35,1.65),B=x===0&&w===1&&y===1?void 0:`hue-rotate(${x}deg) saturate(${w}) brightness(${y})`;(0,Lt.useEffect)(()=>{let c=d.current;if(!o||!c)return;let u=!1,m=()=>{u&&(u=!1,c.contentWindow?.postMessage({threeuiRuntime:{hover:0}},"*"))},k=S=>{S.source===c.contentWindow&&S.data?.threeuiPointerOver&&(u=!0)},_=S=>{if(!u)return;let E=c.getBoundingClientRect();(S.clientX<E.left||S.clientX>E.right||S.clientY<E.top||S.clientY>E.bottom)&&m()};return window.addEventListener("message",k),window.addEventListener("pointermove",_,!0),c.addEventListener("pointerleave",m),document.addEventListener("mouseleave",m),window.addEventListener("blur",m),()=>{window.removeEventListener("message",k),window.removeEventListener("pointermove",_,!0),c.removeEventListener("pointerleave",m),document.removeEventListener("mouseleave",m),window.removeEventListener("blur",m)}},[o]);let p=a?JSON.stringify(a):null;return(0,Lt.useEffect)(()=>{let c=d.current;if(!c||!p)return;let u=()=>c.contentWindow?.postMessage({threeuiRuntime:JSON.parse(p)},"*");return u(),c.addEventListener("load",u),()=>c.removeEventListener("load",u)},[p,g]),(0,zi.jsx)("iframe",{ref:d,className:s,"data-mode":f,title:e.title,srcDoc:g,sandbox:"allow-scripts",loading:"eager",style:{display:"block",width:"100%",height:"100%",border:0,background:h,filter:B,...l}})}function L(e){return function(t){return(0,zi.jsx)(g0,{...t,definition:e})}}var Tg=L(M.expanse),Ag=L(M.starfield),u0={tachometer:M.performanceGaugesTachometer,speedometer:M.performanceGaugesSpeedometer,boost:M.performanceGaugesBoost,power:M.performanceGaugesPower},ff={variant:"tachometer"};function $o({variant:e=ff.variant,...t}){let r=u0[e]??u0.tachometer;return(0,zi.jsx)(g0,{...t,definition:r})}var Mg=L(M.logicCore),Rg=L(M.ignition),zg=L(M.induction),Pg=L(M.aetherisLabs),Lg=L(M.tactile),Fg=L(M.thinking),Ig=L(M.slidingTextCta),Dg=L(M.floatingDotsCta),Bg=L(M.launchButton),Hg=L(M.dotBorderButton),Ng=L(M.gradientCta),Og=L(M.spinningBorderButton),qg=L(M.glassmorphismCta),jg=L(M.generateButton),Wg=L(M.gradientPillButton),Ug=L(M.gradientBeamCta),Gg=L(M.threeUIIntro),Vg=L(M.particleWordmark),Yg=L(M.audioWordmark);var Xg=L(M.dimensional),Qg=L(M.cloud),Kg=L(M.vertex9),Zg=L(M.topology),Jg=L(M.voidField);var es=Ft(Mi());(0,h0.createRoot)(document.getElementById("root")).render((0,es.jsx)("div",{style:{position:"fixed",inset:0,background:"#000"},children:(0,es.jsx)($o,{style:{width:"100%",height:"100%"}})}));})();
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
