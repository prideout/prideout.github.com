var CreateParg = function(Module) {
  Module = Module || {};

var Module;
if (!Module) Module = (typeof CreateParg !== "undefined" ? CreateParg : null) || {};
var moduleOverrides = {};
for (var key in Module) {
 if (Module.hasOwnProperty(key)) {
  moduleOverrides[key] = Module[key];
 }
}
var ENVIRONMENT_IS_WEB = typeof window === "object";
var ENVIRONMENT_IS_NODE = typeof process === "object" && typeof require === "function" && !ENVIRONMENT_IS_WEB;
var ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
 if (!Module["print"]) Module["print"] = function print(x) {
  process["stdout"].write(x + "\n");
 };
 if (!Module["printErr"]) Module["printErr"] = function printErr(x) {
  process["stderr"].write(x + "\n");
 };
 var nodeFS = require("fs");
 var nodePath = require("path");
 Module["read"] = function read(filename, binary) {
  filename = nodePath["normalize"](filename);
  var ret = nodeFS["readFileSync"](filename);
  if (!ret && filename != nodePath["resolve"](filename)) {
   filename = path.join(__dirname, "..", "src", filename);
   ret = nodeFS["readFileSync"](filename);
  }
  if (ret && !binary) ret = ret.toString();
  return ret;
 };
 Module["readBinary"] = function readBinary(filename) {
  return Module["read"](filename, true);
 };
 Module["load"] = function load(f) {
  globalEval(read(f));
 };
 if (!Module["thisProgram"]) {
  if (process["argv"].length > 1) {
   Module["thisProgram"] = process["argv"][1].replace(/\\/g, "/");
  } else {
   Module["thisProgram"] = "unknown-program";
  }
 }
 Module["arguments"] = process["argv"].slice(2);
 if (typeof module !== "undefined") {
  module["exports"] = Module;
 }
 process["on"]("uncaughtException", (function(ex) {
  if (!(ex instanceof ExitStatus)) {
   throw ex;
  }
 }));
 Module["inspect"] = (function() {
  return "[Emscripten Module object]";
 });
} else if (ENVIRONMENT_IS_SHELL) {
 if (!Module["print"]) Module["print"] = print;
 if (typeof printErr != "undefined") Module["printErr"] = printErr;
 if (typeof read != "undefined") {
  Module["read"] = read;
 } else {
  Module["read"] = function read() {
   throw "no read() available (jsc?)";
  };
 }
 Module["readBinary"] = function readBinary(f) {
  if (typeof readbuffer === "function") {
   return new Uint8Array(readbuffer(f));
  }
  var data = read(f, "binary");
  assert(typeof data === "object");
  return data;
 };
 if (typeof scriptArgs != "undefined") {
  Module["arguments"] = scriptArgs;
 } else if (typeof arguments != "undefined") {
  Module["arguments"] = arguments;
 }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
 Module["read"] = function read(url) {
  var xhr = new XMLHttpRequest;
  xhr.open("GET", url, false);
  xhr.send(null);
  return xhr.responseText;
 };
 if (typeof arguments != "undefined") {
  Module["arguments"] = arguments;
 }
 if (typeof console !== "undefined") {
  if (!Module["print"]) Module["print"] = function print(x) {
   console.log(x);
  };
  if (!Module["printErr"]) Module["printErr"] = function printErr(x) {
   console.log(x);
  };
 } else {
  var TRY_USE_DUMP = false;
  if (!Module["print"]) Module["print"] = TRY_USE_DUMP && typeof dump !== "undefined" ? (function(x) {
   dump(x);
  }) : (function(x) {});
 }
 if (ENVIRONMENT_IS_WORKER) {
  Module["load"] = importScripts;
 }
 if (typeof Module["setWindowTitle"] === "undefined") {
  Module["setWindowTitle"] = (function(title) {
   document.title = title;
  });
 }
} else {
 throw "Unknown runtime environment. Where are we?";
}
function globalEval(x) {
 eval.call(null, x);
}
if (!Module["load"] && Module["read"]) {
 Module["load"] = function load(f) {
  globalEval(Module["read"](f));
 };
}
if (!Module["print"]) {
 Module["print"] = (function() {});
}
if (!Module["printErr"]) {
 Module["printErr"] = Module["print"];
}
if (!Module["arguments"]) {
 Module["arguments"] = [];
}
if (!Module["thisProgram"]) {
 Module["thisProgram"] = "./this.program";
}
Module.print = Module["print"];
Module.printErr = Module["printErr"];
Module["preRun"] = [];
Module["postRun"] = [];
for (var key in moduleOverrides) {
 if (moduleOverrides.hasOwnProperty(key)) {
  Module[key] = moduleOverrides[key];
 }
}
var Runtime = {
 setTempRet0: (function(value) {
  tempRet0 = value;
 }),
 getTempRet0: (function() {
  return tempRet0;
 }),
 stackSave: (function() {
  return STACKTOP;
 }),
 stackRestore: (function(stackTop) {
  STACKTOP = stackTop;
 }),
 getNativeTypeSize: (function(type) {
  switch (type) {
  case "i1":
  case "i8":
   return 1;
  case "i16":
   return 2;
  case "i32":
   return 4;
  case "i64":
   return 8;
  case "float":
   return 4;
  case "double":
   return 8;
  default:
   {
    if (type[type.length - 1] === "*") {
     return Runtime.QUANTUM_SIZE;
    } else if (type[0] === "i") {
     var bits = parseInt(type.substr(1));
     assert(bits % 8 === 0);
     return bits / 8;
    } else {
     return 0;
    }
   }
  }
 }),
 getNativeFieldSize: (function(type) {
  return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
 }),
 STACK_ALIGN: 16,
 prepVararg: (function(ptr, type) {
  if (type === "double" || type === "i64") {
   if (ptr & 7) {
    assert((ptr & 7) === 4);
    ptr += 4;
   }
  } else {
   assert((ptr & 3) === 0);
  }
  return ptr;
 }),
 getAlignSize: (function(type, size, vararg) {
  if (!vararg && (type == "i64" || type == "double")) return 8;
  if (!type) return Math.min(size, 8);
  return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
 }),
 dynCall: (function(sig, ptr, args) {
  if (args && args.length) {
   if (!args.splice) args = Array.prototype.slice.call(args);
   args.splice(0, 0, ptr);
   return Module["dynCall_" + sig].apply(null, args);
  } else {
   return Module["dynCall_" + sig].call(null, ptr);
  }
 }),
 functionPointers: [],
 addFunction: (function(func) {
  for (var i = 0; i < Runtime.functionPointers.length; i++) {
   if (!Runtime.functionPointers[i]) {
    Runtime.functionPointers[i] = func;
    return 2 * (1 + i);
   }
  }
  throw "Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.";
 }),
 removeFunction: (function(index) {
  Runtime.functionPointers[(index - 2) / 2] = null;
 }),
 warnOnce: (function(text) {
  if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
  if (!Runtime.warnOnce.shown[text]) {
   Runtime.warnOnce.shown[text] = 1;
   Module.printErr(text);
  }
 }),
 funcWrappers: {},
 getFuncWrapper: (function(func, sig) {
  assert(sig);
  if (!Runtime.funcWrappers[sig]) {
   Runtime.funcWrappers[sig] = {};
  }
  var sigCache = Runtime.funcWrappers[sig];
  if (!sigCache[func]) {
   sigCache[func] = function dynCall_wrapper() {
    return Runtime.dynCall(sig, func, arguments);
   };
  }
  return sigCache[func];
 }),
 getCompilerSetting: (function(name) {
  throw "You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work";
 }),
 stackAlloc: (function(size) {
  var ret = STACKTOP;
  STACKTOP = STACKTOP + size | 0;
  STACKTOP = STACKTOP + 15 & -16;
  return ret;
 }),
 staticAlloc: (function(size) {
  var ret = STATICTOP;
  STATICTOP = STATICTOP + size | 0;
  STATICTOP = STATICTOP + 15 & -16;
  return ret;
 }),
 dynamicAlloc: (function(size) {
  var ret = DYNAMICTOP;
  DYNAMICTOP = DYNAMICTOP + size | 0;
  DYNAMICTOP = DYNAMICTOP + 15 & -16;
  if (DYNAMICTOP >= TOTAL_MEMORY) {
   var success = enlargeMemory();
   if (!success) {
    DYNAMICTOP = ret;
    return 0;
   }
  }
  return ret;
 }),
 alignMemory: (function(size, quantum) {
  var ret = size = Math.ceil(size / (quantum ? quantum : 16)) * (quantum ? quantum : 16);
  return ret;
 }),
 makeBigInt: (function(low, high, unsigned) {
  var ret = unsigned ? +(low >>> 0) + +(high >>> 0) * +4294967296 : +(low >>> 0) + +(high | 0) * +4294967296;
  return ret;
 }),
 GLOBAL_BASE: 8,
 QUANTUM_SIZE: 4,
 __dummy__: 0
};
Module["Runtime"] = Runtime;
var __THREW__ = 0;
var ABORT = false;
var EXITSTATUS = 0;
var undef = 0;
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function assert(condition, text) {
 if (!condition) {
  abort("Assertion failed: " + text);
 }
}
var globalScope = this;
function getCFunc(ident) {
 var func = Module["_" + ident];
 if (!func) {
  try {
   func = eval("_" + ident);
  } catch (e) {}
 }
 assert(func, "Cannot call unknown function " + ident + " (perhaps LLVM optimizations or closure removed it?)");
 return func;
}
var cwrap, ccall;
((function() {
 var JSfuncs = {
  "stackSave": (function() {
   Runtime.stackSave();
  }),
  "stackRestore": (function() {
   Runtime.stackRestore();
  }),
  "arrayToC": (function(arr) {
   var ret = Runtime.stackAlloc(arr.length);
   writeArrayToMemory(arr, ret);
   return ret;
  }),
  "stringToC": (function(str) {
   var ret = 0;
   if (str !== null && str !== undefined && str !== 0) {
    ret = Runtime.stackAlloc((str.length << 2) + 1);
    writeStringToMemory(str, ret);
   }
   return ret;
  })
 };
 var toC = {
  "string": JSfuncs["stringToC"],
  "array": JSfuncs["arrayToC"]
 };
 ccall = function ccallFunc(ident, returnType, argTypes, args, opts) {
  var func = getCFunc(ident);
  var cArgs = [];
  var stack = 0;
  if (args) {
   for (var i = 0; i < args.length; i++) {
    var converter = toC[argTypes[i]];
    if (converter) {
     if (stack === 0) stack = Runtime.stackSave();
     cArgs[i] = converter(args[i]);
    } else {
     cArgs[i] = args[i];
    }
   }
  }
  var ret = func.apply(null, cArgs);
  if (returnType === "string") ret = Pointer_stringify(ret);
  if (stack !== 0) {
   if (opts && opts.async) {
    EmterpreterAsync.asyncFinalizers.push((function() {
     Runtime.stackRestore(stack);
    }));
    return;
   }
   Runtime.stackRestore(stack);
  }
  return ret;
 };
 var sourceRegex = /^function\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/;
 function parseJSFunc(jsfunc) {
  var parsed = jsfunc.toString().match(sourceRegex).slice(1);
  return {
   arguments: parsed[0],
   body: parsed[1],
   returnValue: parsed[2]
  };
 }
 var JSsource = {};
 for (var fun in JSfuncs) {
  if (JSfuncs.hasOwnProperty(fun)) {
   JSsource[fun] = parseJSFunc(JSfuncs[fun]);
  }
 }
 cwrap = function cwrap(ident, returnType, argTypes) {
  argTypes = argTypes || [];
  var cfunc = getCFunc(ident);
  var numericArgs = argTypes.every((function(type) {
   return type === "number";
  }));
  var numericRet = returnType !== "string";
  if (numericRet && numericArgs) {
   return cfunc;
  }
  var argNames = argTypes.map((function(x, i) {
   return "$" + i;
  }));
  var funcstr = "(function(" + argNames.join(",") + ") {";
  var nargs = argTypes.length;
  if (!numericArgs) {
   funcstr += "var stack = " + JSsource["stackSave"].body + ";";
   for (var i = 0; i < nargs; i++) {
    var arg = argNames[i], type = argTypes[i];
    if (type === "number") continue;
    var convertCode = JSsource[type + "ToC"];
    funcstr += "var " + convertCode.arguments + " = " + arg + ";";
    funcstr += convertCode.body + ";";
    funcstr += arg + "=" + convertCode.returnValue + ";";
   }
  }
  var cfuncname = parseJSFunc((function() {
   return cfunc;
  })).returnValue;
  funcstr += "var ret = " + cfuncname + "(" + argNames.join(",") + ");";
  if (!numericRet) {
   var strgfy = parseJSFunc((function() {
    return Pointer_stringify;
   })).returnValue;
   funcstr += "ret = " + strgfy + "(ret);";
  }
  if (!numericArgs) {
   funcstr += JSsource["stackRestore"].body.replace("()", "(stack)") + ";";
  }
  funcstr += "return ret})";
  return eval(funcstr);
 };
}))();
Module["cwrap"] = cwrap;
Module["ccall"] = ccall;
function setValue(ptr, value, type, noSafe) {
 type = type || "i8";
 if (type.charAt(type.length - 1) === "*") type = "i32";
 switch (type) {
 case "i1":
  HEAP8[ptr >> 0] = value;
  break;
 case "i8":
  HEAP8[ptr >> 0] = value;
  break;
 case "i16":
  HEAP16[ptr >> 1] = value;
  break;
 case "i32":
  HEAP32[ptr >> 2] = value;
  break;
 case "i64":
  tempI64 = [ value >>> 0, (tempDouble = value, +Math_abs(tempDouble) >= +1 ? tempDouble > +0 ? (Math_min(+Math_floor(tempDouble / +4294967296), +4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / +4294967296) >>> 0 : 0) ], HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
  break;
 case "float":
  HEAPF32[ptr >> 2] = value;
  break;
 case "double":
  HEAPF64[ptr >> 3] = value;
  break;
 default:
  abort("invalid type for setValue: " + type);
 }
}
Module["setValue"] = setValue;
function getValue(ptr, type, noSafe) {
 type = type || "i8";
 if (type.charAt(type.length - 1) === "*") type = "i32";
 switch (type) {
 case "i1":
  return HEAP8[ptr >> 0];
 case "i8":
  return HEAP8[ptr >> 0];
 case "i16":
  return HEAP16[ptr >> 1];
 case "i32":
  return HEAP32[ptr >> 2];
 case "i64":
  return HEAP32[ptr >> 2];
 case "float":
  return HEAPF32[ptr >> 2];
 case "double":
  return HEAPF64[ptr >> 3];
 default:
  abort("invalid type for setValue: " + type);
 }
 return null;
}
Module["getValue"] = getValue;
var ALLOC_NORMAL = 0;
var ALLOC_STACK = 1;
var ALLOC_STATIC = 2;
var ALLOC_DYNAMIC = 3;
var ALLOC_NONE = 4;
Module["ALLOC_NORMAL"] = ALLOC_NORMAL;
Module["ALLOC_STACK"] = ALLOC_STACK;
Module["ALLOC_STATIC"] = ALLOC_STATIC;
Module["ALLOC_DYNAMIC"] = ALLOC_DYNAMIC;
Module["ALLOC_NONE"] = ALLOC_NONE;
function allocate(slab, types, allocator, ptr) {
 var zeroinit, size;
 if (typeof slab === "number") {
  zeroinit = true;
  size = slab;
 } else {
  zeroinit = false;
  size = slab.length;
 }
 var singleType = typeof types === "string" ? types : null;
 var ret;
 if (allocator == ALLOC_NONE) {
  ret = ptr;
 } else {
  ret = [ _malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc ][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
 }
 if (zeroinit) {
  var ptr = ret, stop;
  assert((ret & 3) == 0);
  stop = ret + (size & ~3);
  for (; ptr < stop; ptr += 4) {
   HEAP32[ptr >> 2] = 0;
  }
  stop = ret + size;
  while (ptr < stop) {
   HEAP8[ptr++ >> 0] = 0;
  }
  return ret;
 }
 if (singleType === "i8") {
  if (slab.subarray || slab.slice) {
   HEAPU8.set(slab, ret);
  } else {
   HEAPU8.set(new Uint8Array(slab), ret);
  }
  return ret;
 }
 var i = 0, type, typeSize, previousType;
 while (i < size) {
  var curr = slab[i];
  if (typeof curr === "function") {
   curr = Runtime.getFunctionIndex(curr);
  }
  type = singleType || types[i];
  if (type === 0) {
   i++;
   continue;
  }
  if (type == "i64") type = "i32";
  setValue(ret + i, curr, type);
  if (previousType !== type) {
   typeSize = Runtime.getNativeTypeSize(type);
   previousType = type;
  }
  i += typeSize;
 }
 return ret;
}
Module["allocate"] = allocate;
function getMemory(size) {
 if (!staticSealed) return Runtime.staticAlloc(size);
 if (typeof _sbrk !== "undefined" && !_sbrk.called) return Runtime.dynamicAlloc(size);
 return _malloc(size);
}
function Pointer_stringify(ptr, length) {
 if (length === 0 || !ptr) return "";
 var hasUtf = 0;
 var t;
 var i = 0;
 while (1) {
  t = HEAPU8[ptr + i >> 0];
  hasUtf |= t;
  if (t == 0 && !length) break;
  i++;
  if (length && i == length) break;
 }
 if (!length) length = i;
 var ret = "";
 if (hasUtf < 128) {
  var MAX_CHUNK = 1024;
  var curr;
  while (length > 0) {
   curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
   ret = ret ? ret + curr : curr;
   ptr += MAX_CHUNK;
   length -= MAX_CHUNK;
  }
  return ret;
 }
 return Module["UTF8ToString"](ptr);
}
Module["Pointer_stringify"] = Pointer_stringify;
function AsciiToString(ptr) {
 var str = "";
 while (1) {
  var ch = HEAP8[ptr++ >> 0];
  if (!ch) return str;
  str += String.fromCharCode(ch);
 }
}
Module["AsciiToString"] = AsciiToString;
function stringToAscii(str, outPtr) {
 return writeAsciiToMemory(str, outPtr, false);
}
Module["stringToAscii"] = stringToAscii;
function UTF8ArrayToString(u8Array, idx) {
 var u0, u1, u2, u3, u4, u5;
 var str = "";
 while (1) {
  u0 = u8Array[idx++];
  if (!u0) return str;
  if (!(u0 & 128)) {
   str += String.fromCharCode(u0);
   continue;
  }
  u1 = u8Array[idx++] & 63;
  if ((u0 & 224) == 192) {
   str += String.fromCharCode((u0 & 31) << 6 | u1);
   continue;
  }
  u2 = u8Array[idx++] & 63;
  if ((u0 & 240) == 224) {
   u0 = (u0 & 15) << 12 | u1 << 6 | u2;
  } else {
   u3 = u8Array[idx++] & 63;
   if ((u0 & 248) == 240) {
    u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | u3;
   } else {
    u4 = u8Array[idx++] & 63;
    if ((u0 & 252) == 248) {
     u0 = (u0 & 3) << 24 | u1 << 18 | u2 << 12 | u3 << 6 | u4;
    } else {
     u5 = u8Array[idx++] & 63;
     u0 = (u0 & 1) << 30 | u1 << 24 | u2 << 18 | u3 << 12 | u4 << 6 | u5;
    }
   }
  }
  if (u0 < 65536) {
   str += String.fromCharCode(u0);
  } else {
   var ch = u0 - 65536;
   str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
  }
 }
}
Module["UTF8ArrayToString"] = UTF8ArrayToString;
function UTF8ToString(ptr) {
 return UTF8ArrayToString(HEAPU8, ptr);
}
Module["UTF8ToString"] = UTF8ToString;
function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
 if (!(maxBytesToWrite > 0)) return 0;
 var startIdx = outIdx;
 var endIdx = outIdx + maxBytesToWrite - 1;
 for (var i = 0; i < str.length; ++i) {
  var u = str.charCodeAt(i);
  if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
  if (u <= 127) {
   if (outIdx >= endIdx) break;
   outU8Array[outIdx++] = u;
  } else if (u <= 2047) {
   if (outIdx + 1 >= endIdx) break;
   outU8Array[outIdx++] = 192 | u >> 6;
   outU8Array[outIdx++] = 128 | u & 63;
  } else if (u <= 65535) {
   if (outIdx + 2 >= endIdx) break;
   outU8Array[outIdx++] = 224 | u >> 12;
   outU8Array[outIdx++] = 128 | u >> 6 & 63;
   outU8Array[outIdx++] = 128 | u & 63;
  } else if (u <= 2097151) {
   if (outIdx + 3 >= endIdx) break;
   outU8Array[outIdx++] = 240 | u >> 18;
   outU8Array[outIdx++] = 128 | u >> 12 & 63;
   outU8Array[outIdx++] = 128 | u >> 6 & 63;
   outU8Array[outIdx++] = 128 | u & 63;
  } else if (u <= 67108863) {
   if (outIdx + 4 >= endIdx) break;
   outU8Array[outIdx++] = 248 | u >> 24;
   outU8Array[outIdx++] = 128 | u >> 18 & 63;
   outU8Array[outIdx++] = 128 | u >> 12 & 63;
   outU8Array[outIdx++] = 128 | u >> 6 & 63;
   outU8Array[outIdx++] = 128 | u & 63;
  } else {
   if (outIdx + 5 >= endIdx) break;
   outU8Array[outIdx++] = 252 | u >> 30;
   outU8Array[outIdx++] = 128 | u >> 24 & 63;
   outU8Array[outIdx++] = 128 | u >> 18 & 63;
   outU8Array[outIdx++] = 128 | u >> 12 & 63;
   outU8Array[outIdx++] = 128 | u >> 6 & 63;
   outU8Array[outIdx++] = 128 | u & 63;
  }
 }
 outU8Array[outIdx] = 0;
 return outIdx - startIdx;
}
Module["stringToUTF8Array"] = stringToUTF8Array;
function stringToUTF8(str, outPtr, maxBytesToWrite) {
 return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}
Module["stringToUTF8"] = stringToUTF8;
function lengthBytesUTF8(str) {
 var len = 0;
 for (var i = 0; i < str.length; ++i) {
  var u = str.charCodeAt(i);
  if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
  if (u <= 127) {
   ++len;
  } else if (u <= 2047) {
   len += 2;
  } else if (u <= 65535) {
   len += 3;
  } else if (u <= 2097151) {
   len += 4;
  } else if (u <= 67108863) {
   len += 5;
  } else {
   len += 6;
  }
 }
 return len;
}
Module["lengthBytesUTF8"] = lengthBytesUTF8;
function UTF16ToString(ptr) {
 var i = 0;
 var str = "";
 while (1) {
  var codeUnit = HEAP16[ptr + i * 2 >> 1];
  if (codeUnit == 0) return str;
  ++i;
  str += String.fromCharCode(codeUnit);
 }
}
Module["UTF16ToString"] = UTF16ToString;
function stringToUTF16(str, outPtr, maxBytesToWrite) {
 if (maxBytesToWrite === undefined) {
  maxBytesToWrite = 2147483647;
 }
 if (maxBytesToWrite < 2) return 0;
 maxBytesToWrite -= 2;
 var startPtr = outPtr;
 var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
 for (var i = 0; i < numCharsToWrite; ++i) {
  var codeUnit = str.charCodeAt(i);
  HEAP16[outPtr >> 1] = codeUnit;
  outPtr += 2;
 }
 HEAP16[outPtr >> 1] = 0;
 return outPtr - startPtr;
}
Module["stringToUTF16"] = stringToUTF16;
function lengthBytesUTF16(str) {
 return str.length * 2;
}
Module["lengthBytesUTF16"] = lengthBytesUTF16;
function UTF32ToString(ptr) {
 var i = 0;
 var str = "";
 while (1) {
  var utf32 = HEAP32[ptr + i * 4 >> 2];
  if (utf32 == 0) return str;
  ++i;
  if (utf32 >= 65536) {
   var ch = utf32 - 65536;
   str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
  } else {
   str += String.fromCharCode(utf32);
  }
 }
}
Module["UTF32ToString"] = UTF32ToString;
function stringToUTF32(str, outPtr, maxBytesToWrite) {
 if (maxBytesToWrite === undefined) {
  maxBytesToWrite = 2147483647;
 }
 if (maxBytesToWrite < 4) return 0;
 var startPtr = outPtr;
 var endPtr = startPtr + maxBytesToWrite - 4;
 for (var i = 0; i < str.length; ++i) {
  var codeUnit = str.charCodeAt(i);
  if (codeUnit >= 55296 && codeUnit <= 57343) {
   var trailSurrogate = str.charCodeAt(++i);
   codeUnit = 65536 + ((codeUnit & 1023) << 10) | trailSurrogate & 1023;
  }
  HEAP32[outPtr >> 2] = codeUnit;
  outPtr += 4;
  if (outPtr + 4 > endPtr) break;
 }
 HEAP32[outPtr >> 2] = 0;
 return outPtr - startPtr;
}
Module["stringToUTF32"] = stringToUTF32;
function lengthBytesUTF32(str) {
 var len = 0;
 for (var i = 0; i < str.length; ++i) {
  var codeUnit = str.charCodeAt(i);
  if (codeUnit >= 55296 && codeUnit <= 57343) ++i;
  len += 4;
 }
 return len;
}
Module["lengthBytesUTF32"] = lengthBytesUTF32;
function demangle(func) {
 var hasLibcxxabi = !!Module["___cxa_demangle"];
 if (hasLibcxxabi) {
  try {
   var buf = _malloc(func.length);
   writeStringToMemory(func.substr(1), buf);
   var status = _malloc(4);
   var ret = Module["___cxa_demangle"](buf, 0, 0, status);
   if (getValue(status, "i32") === 0 && ret) {
    return Pointer_stringify(ret);
   }
  } catch (e) {} finally {
   if (buf) _free(buf);
   if (status) _free(status);
   if (ret) _free(ret);
  }
 }
 var i = 3;
 var basicTypes = {
  "v": "void",
  "b": "bool",
  "c": "char",
  "s": "short",
  "i": "int",
  "l": "long",
  "f": "float",
  "d": "double",
  "w": "wchar_t",
  "a": "signed char",
  "h": "unsigned char",
  "t": "unsigned short",
  "j": "unsigned int",
  "m": "unsigned long",
  "x": "long long",
  "y": "unsigned long long",
  "z": "..."
 };
 var subs = [];
 var first = true;
 function dump(x) {
  if (x) Module.print(x);
  Module.print(func);
  var pre = "";
  for (var a = 0; a < i; a++) pre += " ";
  Module.print(pre + "^");
 }
 function parseNested() {
  i++;
  if (func[i] === "K") i++;
  var parts = [];
  while (func[i] !== "E") {
   if (func[i] === "S") {
    i++;
    var next = func.indexOf("_", i);
    var num = func.substring(i, next) || 0;
    parts.push(subs[num] || "?");
    i = next + 1;
    continue;
   }
   if (func[i] === "C") {
    parts.push(parts[parts.length - 1]);
    i += 2;
    continue;
   }
   var size = parseInt(func.substr(i));
   var pre = size.toString().length;
   if (!size || !pre) {
    i--;
    break;
   }
   var curr = func.substr(i + pre, size);
   parts.push(curr);
   subs.push(curr);
   i += pre + size;
  }
  i++;
  return parts;
 }
 function parse(rawList, limit, allowVoid) {
  limit = limit || Infinity;
  var ret = "", list = [];
  function flushList() {
   return "(" + list.join(", ") + ")";
  }
  var name;
  if (func[i] === "N") {
   name = parseNested().join("::");
   limit--;
   if (limit === 0) return rawList ? [ name ] : name;
  } else {
   if (func[i] === "K" || first && func[i] === "L") i++;
   var size = parseInt(func.substr(i));
   if (size) {
    var pre = size.toString().length;
    name = func.substr(i + pre, size);
    i += pre + size;
   }
  }
  first = false;
  if (func[i] === "I") {
   i++;
   var iList = parse(true);
   var iRet = parse(true, 1, true);
   ret += iRet[0] + " " + name + "<" + iList.join(", ") + ">";
  } else {
   ret = name;
  }
  paramLoop : while (i < func.length && limit-- > 0) {
   var c = func[i++];
   if (c in basicTypes) {
    list.push(basicTypes[c]);
   } else {
    switch (c) {
    case "P":
     list.push(parse(true, 1, true)[0] + "*");
     break;
    case "R":
     list.push(parse(true, 1, true)[0] + "&");
     break;
    case "L":
     {
      i++;
      var end = func.indexOf("E", i);
      var size = end - i;
      list.push(func.substr(i, size));
      i += size + 2;
      break;
     }
    case "A":
     {
      var size = parseInt(func.substr(i));
      i += size.toString().length;
      if (func[i] !== "_") throw "?";
      i++;
      list.push(parse(true, 1, true)[0] + " [" + size + "]");
      break;
     }
    case "E":
     break paramLoop;
    default:
     ret += "?" + c;
     break paramLoop;
    }
   }
  }
  if (!allowVoid && list.length === 1 && list[0] === "void") list = [];
  if (rawList) {
   if (ret) {
    list.push(ret + "?");
   }
   return list;
  } else {
   return ret + flushList();
  }
 }
 var parsed = func;
 try {
  if (func == "Object._main" || func == "_main") {
   return "main()";
  }
  if (typeof func === "number") func = Pointer_stringify(func);
  if (func[0] !== "_") return func;
  if (func[1] !== "_") return func;
  if (func[2] !== "Z") return func;
  switch (func[3]) {
  case "n":
   return "operator new()";
  case "d":
   return "operator delete()";
  }
  parsed = parse();
 } catch (e) {
  parsed += "?";
 }
 if (parsed.indexOf("?") >= 0 && !hasLibcxxabi) {
  Runtime.warnOnce("warning: a problem occurred in builtin C++ name demangling; build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling");
 }
 return parsed;
}
function demangleAll(text) {
 return text.replace(/__Z[\w\d_]+/g, (function(x) {
  var y = demangle(x);
  return x === y ? x : x + " [" + y + "]";
 }));
}
function jsStackTrace() {
 var err = new Error;
 if (!err.stack) {
  try {
   throw new Error(0);
  } catch (e) {
   err = e;
  }
  if (!err.stack) {
   return "(no stack trace available)";
  }
 }
 return err.stack.toString();
}
function stackTrace() {
 return demangleAll(jsStackTrace());
}
Module["stackTrace"] = stackTrace;
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
 if (x % 4096 > 0) {
  x += 4096 - x % 4096;
 }
 return x;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false;
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0;
var DYNAMIC_BASE = 0, DYNAMICTOP = 0;
function enlargeMemory() {
 var OLD_TOTAL_MEMORY = TOTAL_MEMORY;
 var LIMIT = Math.pow(2, 31);
 if (DYNAMICTOP >= LIMIT) return false;
 while (TOTAL_MEMORY <= DYNAMICTOP) {
  if (TOTAL_MEMORY < LIMIT / 2) {
   TOTAL_MEMORY = alignMemoryPage(2 * TOTAL_MEMORY);
  } else {
   var last = TOTAL_MEMORY;
   TOTAL_MEMORY = alignMemoryPage((3 * TOTAL_MEMORY + LIMIT) / 4);
   if (TOTAL_MEMORY <= last) return false;
  }
 }
 TOTAL_MEMORY = Math.max(TOTAL_MEMORY, 16 * 1024 * 1024);
 if (TOTAL_MEMORY >= LIMIT) return false;
 try {
  if (ArrayBuffer.transfer) {
   buffer = ArrayBuffer.transfer(buffer, TOTAL_MEMORY);
  } else {
   var oldHEAP8 = HEAP8;
   buffer = new ArrayBuffer(TOTAL_MEMORY);
  }
 } catch (e) {
  return false;
 }
 var success = _emscripten_replace_memory(buffer);
 if (!success) return false;
 Module["buffer"] = buffer;
 Module["HEAP8"] = HEAP8 = new Int8Array(buffer);
 Module["HEAP16"] = HEAP16 = new Int16Array(buffer);
 Module["HEAP32"] = HEAP32 = new Int32Array(buffer);
 Module["HEAPU8"] = HEAPU8 = new Uint8Array(buffer);
 Module["HEAPU16"] = HEAPU16 = new Uint16Array(buffer);
 Module["HEAPU32"] = HEAPU32 = new Uint32Array(buffer);
 Module["HEAPF32"] = HEAPF32 = new Float32Array(buffer);
 Module["HEAPF64"] = HEAPF64 = new Float64Array(buffer);
 if (!ArrayBuffer.transfer) {
  HEAP8.set(oldHEAP8);
 }
 return true;
}
var byteLength;
try {
 byteLength = Function.prototype.call.bind(Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, "byteLength").get);
 byteLength(new ArrayBuffer(4));
} catch (e) {
 byteLength = (function(buffer) {
  return buffer.byteLength;
 });
}
var TOTAL_STACK = Module["TOTAL_STACK"] || 5242880;
var TOTAL_MEMORY = Module["TOTAL_MEMORY"] || 16777216;
var totalMemory = 64 * 1024;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2 * TOTAL_STACK) {
 if (totalMemory < 16 * 1024 * 1024) {
  totalMemory *= 2;
 } else {
  totalMemory += 16 * 1024 * 1024;
 }
}
totalMemory = Math.max(totalMemory, 16 * 1024 * 1024);
if (totalMemory !== TOTAL_MEMORY) {
 Module.printErr("increasing TOTAL_MEMORY to " + totalMemory + " to be compliant with the asm.js spec (and given that TOTAL_STACK=" + TOTAL_STACK + ")");
 TOTAL_MEMORY = totalMemory;
}
assert(typeof Int32Array !== "undefined" && typeof Float64Array !== "undefined" && !!(new Int32Array(1))["subarray"] && !!(new Int32Array(1))["set"], "JS engine does not provide full typed array support");
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, "Typed arrays 2 must be run on a little-endian system");
Module["HEAP"] = HEAP;
Module["buffer"] = buffer;
Module["HEAP8"] = HEAP8;
Module["HEAP16"] = HEAP16;
Module["HEAP32"] = HEAP32;
Module["HEAPU8"] = HEAPU8;
Module["HEAPU16"] = HEAPU16;
Module["HEAPU32"] = HEAPU32;
Module["HEAPF32"] = HEAPF32;
Module["HEAPF64"] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
 while (callbacks.length > 0) {
  var callback = callbacks.shift();
  if (typeof callback == "function") {
   callback();
   continue;
  }
  var func = callback.func;
  if (typeof func === "number") {
   if (callback.arg === undefined) {
    Runtime.dynCall("v", func);
   } else {
    Runtime.dynCall("vi", func, [ callback.arg ]);
   }
  } else {
   func(callback.arg === undefined ? null : callback.arg);
  }
 }
}
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATEXIT__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
var runtimeExited = false;
function preRun() {
 if (Module["preRun"]) {
  if (typeof Module["preRun"] == "function") Module["preRun"] = [ Module["preRun"] ];
  while (Module["preRun"].length) {
   addOnPreRun(Module["preRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
 if (runtimeInitialized) return;
 runtimeInitialized = true;
 callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
 callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
 callRuntimeCallbacks(__ATEXIT__);
 runtimeExited = true;
}
function postRun() {
 if (Module["postRun"]) {
  if (typeof Module["postRun"] == "function") Module["postRun"] = [ Module["postRun"] ];
  while (Module["postRun"].length) {
   addOnPostRun(Module["postRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
 __ATPRERUN__.unshift(cb);
}
Module["addOnPreRun"] = Module.addOnPreRun = addOnPreRun;
function addOnInit(cb) {
 __ATINIT__.unshift(cb);
}
Module["addOnInit"] = Module.addOnInit = addOnInit;
function addOnPreMain(cb) {
 __ATMAIN__.unshift(cb);
}
Module["addOnPreMain"] = Module.addOnPreMain = addOnPreMain;
function addOnExit(cb) {
 __ATEXIT__.unshift(cb);
}
Module["addOnExit"] = Module.addOnExit = addOnExit;
function addOnPostRun(cb) {
 __ATPOSTRUN__.unshift(cb);
}
Module["addOnPostRun"] = Module.addOnPostRun = addOnPostRun;
function intArrayFromString(stringy, dontAddNull, length) {
 var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
 var u8array = new Array(len);
 var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
 if (dontAddNull) u8array.length = numBytesWritten;
 return u8array;
}
Module["intArrayFromString"] = intArrayFromString;
function intArrayToString(array) {
 var ret = [];
 for (var i = 0; i < array.length; i++) {
  var chr = array[i];
  if (chr > 255) {
   chr &= 255;
  }
  ret.push(String.fromCharCode(chr));
 }
 return ret.join("");
}
Module["intArrayToString"] = intArrayToString;
function writeStringToMemory(string, buffer, dontAddNull) {
 var array = intArrayFromString(string, dontAddNull);
 var i = 0;
 while (i < array.length) {
  var chr = array[i];
  HEAP8[buffer + i >> 0] = chr;
  i = i + 1;
 }
}
Module["writeStringToMemory"] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
 for (var i = 0; i < array.length; i++) {
  HEAP8[buffer++ >> 0] = array[i];
 }
}
Module["writeArrayToMemory"] = writeArrayToMemory;
function writeAsciiToMemory(str, buffer, dontAddNull) {
 for (var i = 0; i < str.length; ++i) {
  HEAP8[buffer++ >> 0] = str.charCodeAt(i);
 }
 if (!dontAddNull) HEAP8[buffer >> 0] = 0;
}
Module["writeAsciiToMemory"] = writeAsciiToMemory;
function unSign(value, bits, ignore) {
 if (value >= 0) {
  return value;
 }
 return bits <= 32 ? 2 * Math.abs(1 << bits - 1) + value : Math.pow(2, bits) + value;
}
function reSign(value, bits, ignore) {
 if (value <= 0) {
  return value;
 }
 var half = bits <= 32 ? Math.abs(1 << bits - 1) : Math.pow(2, bits - 1);
 if (value >= half && (bits <= 32 || value > half)) {
  value = -2 * half + value;
 }
 return value;
}
if (!Math["imul"] || Math["imul"](4294967295, 5) !== -5) Math["imul"] = function imul(a, b) {
 var ah = a >>> 16;
 var al = a & 65535;
 var bh = b >>> 16;
 var bl = b & 65535;
 return al * bl + (ah * bl + al * bh << 16) | 0;
};
Math.imul = Math["imul"];
if (!Math["fround"]) {
 var froundBuffer = new Float32Array(1);
 Math["fround"] = (function(x) {
  froundBuffer[0] = x;
  return froundBuffer[0];
 });
}
Math.fround = Math["fround"];
if (!Math["clz32"]) Math["clz32"] = (function(x) {
 x = x >>> 0;
 for (var i = 0; i < 32; i++) {
  if (x & 1 << 31 - i) return i;
 }
 return 32;
});
Math.clz32 = Math["clz32"];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;
var Math_clz32 = Math.clz32;
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;
function getUniqueRunDependency(id) {
 return id;
}
function addRunDependency(id) {
 runDependencies++;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
}
Module["addRunDependency"] = addRunDependency;
function removeRunDependency(id) {
 runDependencies--;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
 if (runDependencies == 0) {
  if (runDependencyWatcher !== null) {
   clearInterval(runDependencyWatcher);
   runDependencyWatcher = null;
  }
  if (dependenciesFulfilled) {
   var callback = dependenciesFulfilled;
   dependenciesFulfilled = null;
   callback();
  }
 }
}
Module["removeRunDependency"] = removeRunDependency;
Module["preloadedImages"] = {};
Module["preloadedAudios"] = {};
var memoryInitializer = null;
var ASM_CONSTS = [ (function($0, $1) {
 {
  Module.parg_window_dims = [];
  Module.parg_window_dims[0] = $0;
  Module.parg_window_dims[1] = $1;
 }
}) ];
function _emscripten_asm_const_2(code, a0, a1) {
 return ASM_CONSTS[code](a0, a1) | 0;
}
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 7296;
__ATINIT__.push({
 func: (function() {
  __GLOBAL__sub_I_bindings_cpp();
 })
}, {
 func: (function() {
  __GLOBAL__sub_I_bind_cpp();
 })
});
allocate([ 85, 110, 97, 98, 108, 101, 32, 116, 111, 32, 108, 111, 97, 100, 32, 97, 115, 115, 101, 116, 0, 0, 0, 0, 47, 85, 115, 101, 114, 115, 47, 112, 114, 105, 100, 101, 111, 117, 116, 47, 103, 105, 116, 47, 112, 97, 114, 103, 47, 115, 114, 99, 47, 97, 115, 115, 101, 116, 46, 99, 0, 0, 0, 0, 112, 97, 114, 103, 95, 97, 115, 115, 101, 116, 95, 111, 110, 108, 111, 97, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 85, 110, 105, 110, 105, 116, 105, 97, 108, 105, 122, 101, 100, 32, 97, 115, 115, 101, 116, 32, 114, 101, 103, 105, 115, 116, 114, 121, 0, 0, 0, 0, 95, 97, 115, 115, 101, 116, 95, 114, 101, 103, 105, 115, 116, 114, 121, 0, 112, 97, 114, 103, 95, 97, 115, 115, 101, 116, 95, 116, 111, 95, 98, 117, 102, 102, 101, 114, 0, 0, 0, 0, 105, 116, 101, 114, 32, 33, 61, 32, 40, 40, 95, 97, 115, 115, 101, 116, 95, 114, 101, 103, 105, 115, 116, 114, 121, 41, 45, 62, 110, 95, 98, 117, 99, 107, 101, 116, 115, 41, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 78, 117, 108, 108, 32, 98, 117, 102, 102, 101, 114, 0, 0, 0, 0, 0, 98, 117, 102, 0, 0, 0, 0, 0, 47, 85, 115, 101, 114, 115, 47, 112, 114, 105, 100, 101, 111, 117, 116, 47, 103, 105, 116, 47, 112, 97, 114, 103, 47, 115, 114, 99, 47, 98, 117, 102, 102, 101, 114, 46, 99, 0, 0, 0, 112, 97, 114, 103, 95, 98, 117, 102, 102, 101, 114, 95, 108, 101, 110, 103, 116, 104, 0, 0, 0, 0, 0, 0, 71, 80, 85, 32, 98, 117, 102, 102, 101, 114, 32, 114, 101, 113, 117, 105, 114, 101, 100, 0, 0, 0, 0, 0, 112, 97, 114, 103, 95, 98, 117, 102, 102, 101, 114, 95, 103, 112, 117, 95, 99, 104, 101, 99, 107, 40, 98, 117, 102, 41, 0, 0, 0, 0, 0, 0, 112, 97, 114, 103, 95, 98, 117, 102, 102, 101, 114, 95, 103, 112, 117, 95, 98, 105, 110, 100, 0, 0, 0, 0, 70, 97, 105, 108, 101, 100, 32, 116, 111, 32, 99, 114, 101, 97, 116, 101, 32, 70, 66, 79, 46, 0, 0, 0, 97, 45, 62, 119, 105, 100, 116, 104, 32, 61, 61, 32, 98, 45, 62, 119, 105, 100, 116, 104, 32, 38, 38, 32, 97, 45, 62, 104, 101, 105, 103, 104, 116, 32, 61, 61, 32, 98, 45, 62, 104, 101, 105, 103, 104, 116, 0, 0, 47, 85, 115, 101, 114, 115, 47, 112, 114, 105, 100, 101, 111, 117, 116, 47, 103, 105, 116, 47, 112, 97, 114, 103, 47, 115, 114, 99, 47, 102, 114, 97, 109, 101, 98, 117, 102, 102, 101, 114, 46, 99, 0, 0, 0, 0, 0, 0, 112, 97, 114, 103, 95, 102, 114, 97, 109, 101, 98, 117, 102, 102, 101, 114, 95, 115, 119, 97, 112, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 116, 116, 114, 105, 98, 117, 116, 101, 32, 0, 0, 0, 0, 0, 0, 64, 112, 114, 111, 103, 114, 97, 109, 32, 0, 0, 0, 0, 0, 0, 0, 95, 112, 114, 101, 102, 105, 120, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 0, 0, 0, 0, 0, 0, 0, 32, 9, 0, 0, 0, 0, 0, 0, 35, 108, 105, 110, 101, 32, 37, 100, 10, 0, 0, 0, 0, 0, 0, 0, 59, 32, 9, 0, 0, 0, 0, 0, 44, 0, 0, 0, 0, 0, 0, 0, 64, 112, 114, 111, 103, 114, 97, 109, 32, 115, 104, 111, 117, 108, 100, 32, 104, 97, 118, 101, 32, 51, 32, 97, 114, 103, 115, 0, 0, 0, 0, 0, 110, 97, 114, 103, 115, 32, 61, 61, 32, 51, 0, 0, 0, 0, 0, 0, 47, 85, 115, 101, 114, 115, 47, 112, 114, 105, 100, 101, 111, 117, 116, 47, 103, 105, 116, 47, 112, 97, 114, 103, 47, 115, 114, 99, 47, 115, 104, 97, 100, 101, 114, 46, 99, 0, 0, 0, 112, 97, 114, 103, 95, 115, 104, 97, 100, 101, 114, 95, 108, 111, 97, 100, 95, 102, 114, 111, 109, 95, 98, 117, 102, 102, 101, 114, 0, 0, 0, 0, 37, 115, 58, 32, 37, 115, 10, 0, 78, 111, 32, 115, 117, 99, 104, 32, 118, 115, 104, 97, 100, 101, 114, 0, 118, 115, 104, 97, 100, 101, 114, 95, 105, 110, 100, 101, 120, 32, 62, 32, 48, 0, 0, 0, 0, 0, 0, 0, 78, 111, 32, 115, 117, 99, 104, 32, 102, 115, 104, 97, 100, 101, 114, 0, 102, 115, 104, 97, 100, 101, 114, 95, 105, 110, 100, 101, 120, 32, 62, 32, 48, 0, 0, 0, 0, 0, 0, 0, 112, 114, 101, 99, 105, 115, 105, 111, 110, 32, 104, 105, 103, 104, 112, 32, 102, 108, 111, 97, 116, 59, 10, 0, 85, 110, 107, 110, 111, 119, 110, 32, 97, 116, 116, 114, 105, 98, 117, 116, 101, 0, 0, 0, 0, 0, 0, 0, 105, 116, 101, 114, 32, 33, 61, 32, 40, 40, 95, 97, 116, 116, 114, 95, 114, 101, 103, 105, 115, 116, 114, 121, 41, 45, 62, 110, 95, 98, 117, 99, 107, 101, 116, 115, 41, 0, 0, 0, 112, 97, 114, 103, 95, 115, 104, 97, 100, 101, 114, 95, 97, 116, 116, 114, 105, 98, 95, 103, 101, 116, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 78, 111, 32, 118, 115, 104, 97, 100, 101, 114, 0, 0, 0, 0, 0, 0, 105, 116, 101, 114, 32, 33, 61, 32, 40, 40, 95, 118, 115, 104, 97, 100, 101, 114, 95, 114, 101, 103, 105, 115, 116, 114, 121, 41, 45, 62, 110, 95, 98, 117, 99, 107, 101, 116, 115, 41, 0, 0, 0, 0, 0, 0, 0, 0, 99, 111, 109, 112, 105, 108, 101, 95, 112, 114, 111, 103, 114, 97, 109, 0, 78, 111, 32, 102, 115, 104, 97, 100, 101, 114, 0, 0, 0, 0, 0, 0, 105, 116, 101, 114, 32, 33, 61, 32, 40, 40, 95, 102, 115, 104, 97, 100, 101, 114, 95, 114, 101, 103, 105, 115, 116, 114, 121, 41, 45, 62, 110, 95, 98, 117, 99, 107, 101, 116, 115, 41, 0, 0, 0, 0, 0, 0, 0, 0, 99, 111, 109, 112, 105, 108, 101, 95, 115, 117, 99, 99, 101, 115, 115, 0, 108, 105, 110, 107, 95, 115, 117, 99, 99, 101, 115, 115, 0, 0, 0, 0, 78, 111, 32, 112, 114, 111, 103, 114, 97, 109, 0, 0, 0, 0, 0, 0, 112, 114, 111, 103, 114, 97, 109, 0, 112, 97, 114, 103, 95, 115, 104, 97, 100, 101, 114, 95, 98, 105, 110, 100, 0, 0, 0, 0, 0, 0, 0, 0, 110, 99, 111, 109, 112, 115, 32, 61, 61, 32, 52, 0, 0, 0, 0, 0, 47, 85, 115, 101, 114, 115, 47, 112, 114, 105, 100, 101, 111, 117, 116, 47, 103, 105, 116, 47, 112, 97, 114, 103, 47, 115, 114, 99, 47, 116, 101, 120, 116, 117, 114, 101, 46, 99, 0, 0, 112, 97, 114, 103, 95, 116, 101, 120, 116, 117, 114, 101, 95, 102, 114, 111, 109, 95, 97, 115, 115, 101, 116, 0, 0, 0, 0, 0, 0, 0, 0, 0, 85, 110, 105, 110, 105, 116, 105, 97, 108, 105, 122, 101, 100, 32, 116, 111, 107, 101, 110, 32, 114, 101, 103, 105, 115, 116, 114, 121, 0, 0, 0, 0, 95, 116, 111, 107, 101, 110, 95, 114, 101, 103, 105, 115, 116, 114, 121, 0, 47, 85, 115, 101, 114, 115, 47, 112, 114, 105, 100, 101, 111, 117, 116, 47, 103, 105, 116, 47, 112, 97, 114, 103, 47, 115, 114, 99, 47, 116, 111, 107, 101, 110, 46, 99, 0, 0, 0, 0, 112, 97, 114, 103, 95, 116, 111, 107, 101, 110, 95, 116, 111, 95, 115, 100, 115, 0, 0, 0, 0, 0, 0, 0, 85, 110, 107, 110, 111, 119, 110, 32, 116, 111, 107, 101, 110, 0, 0, 0, 105, 116, 101, 114, 32, 33, 61, 32, 40, 40, 95, 116, 111, 107, 101, 110, 95, 114, 101, 103, 105, 115, 116, 114, 121, 41, 45, 62, 110, 95, 98, 117, 99, 107, 101, 116, 115, 41, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 123, 32, 77, 111, 100, 117, 108, 101, 46, 112, 97, 114, 103, 95, 119, 105, 110, 100, 111, 119, 95, 100, 105, 109, 115, 32, 61, 32, 91, 93, 59, 32, 77, 111, 100, 117, 108, 101, 46, 112, 97, 114, 103, 95, 119, 105, 110, 100, 111, 119, 95, 100, 105, 109, 115, 91, 48, 93, 32, 61, 32, 36, 48, 59, 32, 77, 111, 100, 117, 108, 101, 46, 112, 97, 114, 103, 95, 119, 105, 110, 100, 111, 119, 95, 100, 105, 109, 115, 91, 49, 93, 32, 61, 32, 36, 49, 59, 32, 125, 0, 0, 0, 0, 0, 112, 97, 114, 103, 0, 0, 0, 0, 97, 115, 115, 101, 116, 95, 112, 114, 101, 108, 111, 97, 100, 0, 0, 0, 192, 20, 0, 0, 216, 9, 0, 0, 168, 21, 0, 0, 160, 9, 0, 0, 0, 0, 0, 0, 168, 6, 0, 0, 168, 21, 0, 0, 104, 9, 0, 0, 1, 0, 0, 0, 168, 6, 0, 0, 105, 105, 0, 0, 0, 0, 0, 0, 118, 0, 0, 0, 0, 0, 0, 0, 87, 105, 110, 100, 111, 119, 0, 0, 118, 105, 0, 0, 0, 0, 0, 0, 105, 110, 105, 116, 0, 0, 0, 0, 224, 19, 0, 0, 72, 9, 0, 0, 118, 105, 105, 0, 0, 0, 0, 0, 100, 114, 97, 119, 0, 0, 0, 0, 224, 19, 0, 0, 0, 0, 0, 0, 118, 105, 0, 0, 0, 0, 0, 0, 116, 105, 99, 107, 0, 0, 0, 0, 96, 20, 0, 0, 160, 20, 0, 0, 160, 20, 0, 0, 0, 0, 0, 0, 105, 105, 102, 102, 0, 0, 0, 0, 105, 110, 112, 117, 116, 0, 0, 0, 224, 19, 0, 0, 96, 20, 0, 0, 160, 20, 0, 0, 160, 20, 0, 0, 160, 20, 0, 0, 0, 0, 0, 0, 118, 105, 105, 102, 102, 102, 0, 0, 109, 101, 115, 115, 97, 103, 101, 0, 192, 20, 0, 0, 16, 9, 0, 0, 168, 21, 0, 0, 216, 8, 0, 0, 0, 0, 0, 0, 112, 7, 0, 0, 168, 21, 0, 0, 160, 8, 0, 0, 1, 0, 0, 0, 112, 7, 0, 0, 105, 105, 0, 0, 0, 0, 0, 0, 65, 115, 115, 101, 116, 0, 0, 0, 118, 105, 0, 0, 0, 0, 0, 0, 97, 108, 108, 111, 99, 0, 0, 0, 96, 20, 0, 0, 248, 7, 0, 0, 96, 20, 0, 0, 0, 0, 0, 0, 105, 105, 105, 105, 0, 0, 0, 0, 99, 111, 109, 109, 105, 116, 0, 0, 224, 19, 0, 0, 248, 7, 0, 0, 118, 105, 105, 0, 0, 0, 0, 0, 112, 97, 114, 103, 47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 72, 21, 0, 0, 16, 8, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 80, 8, 0, 0, 0, 0, 0, 0, 78, 83, 116, 51, 95, 95, 49, 49, 50, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 73, 99, 78, 83, 95, 49, 49, 99, 104, 97, 114, 95, 116, 114, 97, 105, 116, 115, 73, 99, 69, 69, 78, 83, 95, 57, 97, 108, 108, 111, 99, 97, 116, 111, 114, 73, 99, 69, 69, 69, 69, 0, 0, 192, 20, 0, 0, 88, 8, 0, 0, 78, 83, 116, 51, 95, 95, 49, 50, 49, 95, 95, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 95, 99, 111, 109, 109, 111, 110, 73, 76, 98, 49, 69, 69, 69, 0, 0, 0, 65, 108, 108, 111, 99, 97, 116, 105, 110, 103, 32, 37, 100, 32, 98, 121, 116, 101, 115, 32, 102, 111, 114, 32, 37, 115, 10, 0, 0, 0, 0, 0, 80, 75, 90, 78, 51, 50, 69, 109, 115, 99, 114, 105, 112, 116, 101, 110, 66, 105, 110, 100, 105, 110, 103, 73, 110, 105, 116, 105, 97, 108, 105, 122, 101, 114, 95, 112, 97, 114, 67, 49, 69, 118, 69, 53, 65, 115, 115, 101, 116, 0, 0, 0, 0, 0, 0, 0, 80, 90, 78, 51, 50, 69, 109, 115, 99, 114, 105, 112, 116, 101, 110, 66, 105, 110, 100, 105, 110, 103, 73, 110, 105, 116, 105, 97, 108, 105, 122, 101, 114, 95, 112, 97, 114, 67, 49, 69, 118, 69, 53, 65, 115, 115, 101, 116, 0, 0, 0, 0, 0, 0, 0, 0, 90, 78, 51, 50, 69, 109, 115, 99, 114, 105, 112, 116, 101, 110, 66, 105, 110, 100, 105, 110, 103, 73, 110, 105, 116, 105, 97, 108, 105, 122, 101, 114, 95, 112, 97, 114, 67, 49, 69, 118, 69, 53, 65, 115, 115, 101, 116, 0, 0, 0, 128, 63, 0, 0, 0, 0, 192, 20, 0, 0, 80, 9, 0, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 51, 118, 97, 108, 69, 0, 0, 0, 0, 0, 0, 80, 75, 90, 78, 51, 50, 69, 109, 115, 99, 114, 105, 112, 116, 101, 110, 66, 105, 110, 100, 105, 110, 103, 73, 110, 105, 116, 105, 97, 108, 105, 122, 101, 114, 95, 112, 97, 114, 67, 49, 69, 118, 69, 54, 87, 105, 110, 100, 111, 119, 0, 0, 0, 0, 0, 0, 80, 90, 78, 51, 50, 69, 109, 115, 99, 114, 105, 112, 116, 101, 110, 66, 105, 110, 100, 105, 110, 103, 73, 110, 105, 116, 105, 97, 108, 105, 122, 101, 114, 95, 112, 97, 114, 67, 49, 69, 118, 69, 54, 87, 105, 110, 100, 111, 119, 0, 0, 0, 0, 0, 0, 0, 90, 78, 51, 50, 69, 109, 115, 99, 114, 105, 112, 116, 101, 110, 66, 105, 110, 100, 105, 110, 103, 73, 110, 105, 116, 105, 97, 108, 105, 122, 101, 114, 95, 112, 97, 114, 67, 49, 69, 118, 69, 54, 87, 105, 110, 100, 111, 119, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 224, 19, 0, 0, 248, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 112, 95, 98, 97, 99, 107, 103, 114, 111, 117, 110, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 112, 95, 97, 115, 116, 101, 114, 111, 105, 100, 115, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 112, 95, 112, 97, 114, 116, 105, 99, 108, 101, 115, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 112, 95, 112, 104, 121, 115, 105, 99, 115, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 95, 112, 111, 115, 105, 116, 105, 111, 110, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 95, 116, 101, 120, 99, 111, 111, 114, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 95, 105, 110, 100, 101, 120, 0, 117, 95, 110, 112, 111, 105, 110, 116, 115, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 117, 95, 112, 111, 115, 105, 116, 105, 111, 110, 115, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 117, 95, 112, 114, 111, 112, 101, 114, 116, 105, 101, 115, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 117, 95, 100, 101, 108, 116, 97, 115, 113, 114, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 117, 95, 98, 117, 102, 115, 105, 122, 101, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 117, 95, 116, 105, 109, 101, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 98, 108, 117, 114, 114, 121, 99, 111, 108, 111, 114, 115, 46, 112, 110, 103, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 115, 116, 101, 114, 111, 105, 100, 115, 46, 112, 110, 103, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 111, 114, 98, 105, 116, 115, 46, 103, 108, 115, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 112, 108, 97, 121, 0, 0, 0, 0, 112, 97, 117, 115, 101, 0, 0, 0, 83, 119, 105, 116, 99, 104, 105, 110, 103, 32, 116, 111, 32, 37, 100, 120, 37, 100, 32, 40, 37, 100, 41, 10, 0, 0, 0, 0, 0, 0, 0, 0, 53, 49, 50, 0, 0, 0, 0, 0, 49, 48, 50, 52, 0, 0, 0, 0, 50, 53, 54, 0, 0, 0, 0, 0, 118, 111, 105, 100, 0, 0, 0, 0, 98, 111, 111, 108, 0, 0, 0, 0, 99, 104, 97, 114, 0, 0, 0, 0, 115, 105, 103, 110, 101, 100, 32, 99, 104, 97, 114, 0, 0, 0, 0, 0, 117, 110, 115, 105, 103, 110, 101, 100, 32, 99, 104, 97, 114, 0, 0, 0, 115, 104, 111, 114, 116, 0, 0, 0, 117, 110, 115, 105, 103, 110, 101, 100, 32, 115, 104, 111, 114, 116, 0, 0, 105, 110, 116, 0, 0, 0, 0, 0, 117, 110, 115, 105, 103, 110, 101, 100, 32, 105, 110, 116, 0, 0, 0, 0, 108, 111, 110, 103, 0, 0, 0, 0, 117, 110, 115, 105, 103, 110, 101, 100, 32, 108, 111, 110, 103, 0, 0, 0, 102, 108, 111, 97, 116, 0, 0, 0, 100, 111, 117, 98, 108, 101, 0, 0, 115, 116, 100, 58, 58, 115, 116, 114, 105, 110, 103, 0, 0, 0, 0, 0, 72, 21, 0, 0, 232, 17, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 80, 8, 0, 0, 0, 0, 0, 0, 115, 116, 100, 58, 58, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 60, 117, 110, 115, 105, 103, 110, 101, 100, 32, 99, 104, 97, 114, 62, 0, 0, 0, 0, 0, 0, 0, 0, 72, 21, 0, 0, 168, 17, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 80, 8, 0, 0, 0, 0, 0, 0, 115, 116, 100, 58, 58, 119, 115, 116, 114, 105, 110, 103, 0, 0, 0, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 118, 97, 108, 0, 192, 20, 0, 0, 136, 17, 0, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 99, 104, 97, 114, 62, 0, 0, 0, 192, 20, 0, 0, 104, 17, 0, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 115, 105, 103, 110, 101, 100, 32, 99, 104, 97, 114, 62, 0, 0, 0, 0, 192, 20, 0, 0, 72, 17, 0, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 110, 115, 105, 103, 110, 101, 100, 32, 99, 104, 97, 114, 62, 0, 0, 192, 20, 0, 0, 40, 17, 0, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 115, 104, 111, 114, 116, 62, 0, 0, 192, 20, 0, 0, 8, 17, 0, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 110, 115, 105, 103, 110, 101, 100, 32, 115, 104, 111, 114, 116, 62, 0, 192, 20, 0, 0, 232, 16, 0, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 105, 110, 116, 62, 0, 0, 0, 0, 192, 20, 0, 0, 200, 16, 0, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 110, 115, 105, 103, 110, 101, 100, 32, 105, 110, 116, 62, 0, 0, 0, 192, 20, 0, 0, 168, 16, 0, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 108, 111, 110, 103, 62, 0, 0, 0, 192, 20, 0, 0, 136, 16, 0, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 110, 115, 105, 103, 110, 101, 100, 32, 108, 111, 110, 103, 62, 0, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 105, 110, 116, 56, 95, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 105, 110, 116, 56, 95, 116, 62, 0, 0, 0, 0, 0, 0, 0, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 105, 110, 116, 49, 54, 95, 116, 62, 0, 0, 0, 0, 0, 0, 0, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 105, 110, 116, 49, 54, 95, 116, 62, 0, 0, 0, 0, 0, 0, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 105, 110, 116, 51, 50, 95, 116, 62, 0, 0, 0, 0, 0, 0, 0, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 105, 110, 116, 51, 50, 95, 116, 62, 0, 0, 0, 0, 0, 0, 0, 192, 20, 0, 0, 104, 16, 0, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 102, 108, 111, 97, 116, 62, 0, 0, 192, 20, 0, 0, 72, 16, 0, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 100, 111, 117, 98, 108, 101, 62, 0, 192, 20, 0, 0, 40, 16, 0, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 108, 111, 110, 103, 32, 100, 111, 117, 98, 108, 101, 62, 0, 0, 0, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 101, 69, 69, 0, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 100, 69, 69, 0, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 102, 69, 69, 0, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 109, 69, 69, 0, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 108, 69, 69, 0, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 106, 69, 69, 0, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 105, 69, 69, 0, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 116, 69, 69, 0, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 115, 69, 69, 0, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 104, 69, 69, 0, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 97, 69, 69, 0, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 99, 69, 69, 0, 0, 78, 83, 116, 51, 95, 95, 49, 49, 50, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 73, 119, 78, 83, 95, 49, 49, 99, 104, 97, 114, 95, 116, 114, 97, 105, 116, 115, 73, 119, 69, 69, 78, 83, 95, 57, 97, 108, 108, 111, 99, 97, 116, 111, 114, 73, 119, 69, 69, 69, 69, 0, 0, 78, 83, 116, 51, 95, 95, 49, 49, 50, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 73, 104, 78, 83, 95, 49, 49, 99, 104, 97, 114, 95, 116, 114, 97, 105, 116, 115, 73, 104, 69, 69, 78, 83, 95, 57, 97, 108, 108, 111, 99, 97, 116, 111, 114, 73, 104, 69, 69, 69, 69, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 88, 18, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 83, 116, 57, 98, 97, 100, 95, 97, 108, 108, 111, 99, 0, 0, 0, 0, 232, 20, 0, 0, 72, 18, 0, 0, 128, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 83, 116, 57, 101, 120, 99, 101, 112, 116, 105, 111, 110, 0, 0, 0, 0, 192, 20, 0, 0, 112, 18, 0, 0, 83, 116, 57, 116, 121, 112, 101, 95, 105, 110, 102, 111, 0, 0, 0, 0, 192, 20, 0, 0, 136, 18, 0, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 49, 54, 95, 95, 115, 104, 105, 109, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 0, 0, 0, 0, 0, 0, 0, 232, 20, 0, 0, 160, 18, 0, 0, 152, 18, 0, 0, 0, 0, 0, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 49, 55, 95, 95, 99, 108, 97, 115, 115, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 0, 0, 0, 0, 0, 0, 232, 20, 0, 0, 216, 18, 0, 0, 200, 18, 0, 0, 0, 0, 0, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 49, 57, 95, 95, 112, 111, 105, 110, 116, 101, 114, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 0, 0, 0, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 49, 55, 95, 95, 112, 98, 97, 115, 101, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 0, 0, 0, 0, 0, 0, 232, 20, 0, 0, 56, 19, 0, 0, 200, 18, 0, 0, 0, 0, 0, 0, 232, 20, 0, 0, 16, 19, 0, 0, 96, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 200, 19, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 50, 51, 95, 95, 102, 117, 110, 100, 97, 109, 101, 110, 116, 97, 108, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 232, 20, 0, 0, 160, 19, 0, 0, 200, 18, 0, 0, 0, 0, 0, 0, 118, 0, 0, 0, 0, 0, 0, 0, 136, 19, 0, 0, 216, 19, 0, 0, 68, 110, 0, 0, 0, 0, 0, 0, 136, 19, 0, 0, 232, 19, 0, 0, 98, 0, 0, 0, 0, 0, 0, 0, 136, 19, 0, 0, 248, 19, 0, 0, 99, 0, 0, 0, 0, 0, 0, 0, 136, 19, 0, 0, 8, 20, 0, 0, 104, 0, 0, 0, 0, 0, 0, 0, 136, 19, 0, 0, 24, 20, 0, 0, 97, 0, 0, 0, 0, 0, 0, 0, 136, 19, 0, 0, 40, 20, 0, 0, 115, 0, 0, 0, 0, 0, 0, 0, 136, 19, 0, 0, 56, 20, 0, 0, 116, 0, 0, 0, 0, 0, 0, 0, 136, 19, 0, 0, 72, 20, 0, 0, 105, 0, 0, 0, 0, 0, 0, 0, 136, 19, 0, 0, 88, 20, 0, 0, 106, 0, 0, 0, 0, 0, 0, 0, 136, 19, 0, 0, 104, 20, 0, 0, 108, 0, 0, 0, 0, 0, 0, 0, 136, 19, 0, 0, 120, 20, 0, 0, 109, 0, 0, 0, 0, 0, 0, 0, 136, 19, 0, 0, 136, 20, 0, 0, 102, 0, 0, 0, 0, 0, 0, 0, 136, 19, 0, 0, 152, 20, 0, 0, 100, 0, 0, 0, 0, 0, 0, 0, 136, 19, 0, 0, 168, 20, 0, 0, 0, 0, 0, 0, 0, 19, 0, 0, 4, 0, 0, 0, 8, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 48, 21, 0, 0, 4, 0, 0, 0, 9, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 50, 48, 95, 95, 115, 105, 95, 99, 108, 97, 115, 115, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 0, 0, 0, 232, 20, 0, 0, 8, 21, 0, 0, 0, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 144, 21, 0, 0, 4, 0, 0, 0, 10, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 50, 49, 95, 95, 118, 109, 105, 95, 99, 108, 97, 115, 115, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 0, 0, 232, 20, 0, 0, 104, 21, 0, 0, 0, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 112, 19, 0, 0, 4, 0, 0, 0, 11, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 112, 116, 104, 114, 101, 97, 100, 95, 111, 110, 99, 101, 32, 102, 97, 105, 108, 117, 114, 101, 32, 105, 110, 32, 95, 95, 99, 120, 97, 95, 103, 101, 116, 95, 103, 108, 111, 98, 97, 108, 115, 95, 102, 97, 115, 116, 40, 41, 0, 0, 0, 0, 0, 0, 0, 0, 115, 116, 100, 58, 58, 98, 97, 100, 95, 97, 108, 108, 111, 99, 0, 0, 116, 101, 114, 109, 105, 110, 97, 116, 101, 95, 104, 97, 110, 100, 108, 101, 114, 32, 117, 110, 101, 120, 112, 101, 99, 116, 101, 100, 108, 121, 32, 114, 101, 116, 117, 114, 110, 101, 100, 0, 99, 97, 110, 110, 111, 116, 32, 99, 114, 101, 97, 116, 101, 32, 112, 116, 104, 114, 101, 97, 100, 32, 107, 101, 121, 32, 102, 111, 114, 32, 95, 95, 99, 120, 97, 95, 103, 101, 116, 95, 103, 108, 111, 98, 97, 108, 115, 40, 41, 0, 0, 0, 0, 0, 0, 0, 99, 97, 110, 110, 111, 116, 32, 122, 101, 114, 111, 32, 111, 117, 116, 32, 116, 104, 114, 101, 97, 100, 32, 118, 97, 108, 117, 101, 32, 102, 111, 114, 32, 95, 95, 99, 120, 97, 95, 103, 101, 116, 95, 103, 108, 111, 98, 97, 108, 115, 40, 41, 0, 0, 0, 0, 33, 34, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 32, 108, 101, 110, 103, 116, 104, 95, 101, 114, 114, 111, 114, 34, 0, 0, 0, 0, 47, 117, 115, 114, 47, 108, 111, 99, 97, 108, 47, 67, 101, 108, 108, 97, 114, 47, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 47, 49, 46, 51, 51, 46, 48, 47, 108, 105, 98, 101, 120, 101, 99, 47, 115, 121, 115, 116, 101, 109, 47, 105, 110, 99, 108, 117, 100, 101, 47, 108, 105, 98, 99, 120, 120, 47, 115, 116, 114, 105, 110, 103, 0, 0, 0, 0, 0, 0, 0, 0, 95, 95, 116, 104, 114, 111, 119, 95, 108, 101, 110, 103, 116, 104, 95, 101, 114, 114, 111, 114, 0, 0, 0, 0, 216, 23, 0, 0, 0, 0, 0, 0, 116, 101, 114, 109, 105, 110, 97, 116, 105, 110, 103, 32, 119, 105, 116, 104, 32, 37, 115, 32, 101, 120, 99, 101, 112, 116, 105, 111, 110, 32, 111, 102, 32, 116, 121, 112, 101, 32, 37, 115, 58, 32, 37, 115, 0, 0, 0, 0, 116, 101, 114, 109, 105, 110, 97, 116, 105, 110, 103, 32, 119, 105, 116, 104, 32, 37, 115, 32, 101, 120, 99, 101, 112, 116, 105, 111, 110, 32, 111, 102, 32, 116, 121, 112, 101, 32, 37, 115, 0, 0, 0, 0, 0, 0, 0, 0, 116, 101, 114, 109, 105, 110, 97, 116, 105, 110, 103, 32, 119, 105, 116, 104, 32, 37, 115, 32, 102, 111, 114, 101, 105, 103, 110, 32, 101, 120, 99, 101, 112, 116, 105, 111, 110, 0, 0, 0, 116, 101, 114, 109, 105, 110, 97, 116, 105, 110, 103, 0, 0, 0, 0, 0, 117, 110, 99, 97, 117, 103, 104, 116, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 10, 0, 17, 17, 17, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 15, 10, 17, 17, 17, 3, 10, 7, 0, 1, 19, 9, 11, 11, 0, 0, 9, 6, 11, 0, 0, 11, 0, 6, 17, 0, 0, 0, 17, 17, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 10, 10, 17, 17, 17, 0, 10, 0, 0, 2, 0, 9, 11, 0, 0, 0, 9, 0, 11, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 12, 0, 0, 0, 0, 9, 12, 0, 0, 0, 0, 0, 12, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 0, 0, 0, 4, 13, 0, 0, 0, 0, 9, 14, 0, 0, 0, 0, 0, 14, 0, 0, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 9, 16, 0, 0, 0, 0, 0, 16, 0, 0, 16, 0, 0, 18, 0, 0, 0, 18, 18, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 18, 18, 18, 0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 0, 0, 0, 0, 10, 0, 0, 0, 0, 9, 11, 0, 0, 0, 0, 0, 11, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 12, 0, 0, 0, 0, 9, 12, 0, 0, 0, 0, 0, 12, 0, 0, 12, 0, 0, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 65, 66, 67, 68, 69, 70, 45, 43, 32, 32, 32, 48, 88, 48, 120, 0, 0, 0, 0, 0, 0, 0, 40, 110, 117, 108, 108, 41, 0, 0, 45, 48, 88, 43, 48, 88, 32, 48, 88, 45, 48, 120, 43, 48, 120, 32, 48, 120, 0, 0, 0, 0, 0, 0, 105, 110, 102, 0, 0, 0, 0, 0, 73, 78, 70, 0, 0, 0, 0, 0, 110, 97, 110, 0, 0, 0, 0, 0, 78, 65, 78, 0, 0, 0, 0, 0, 46, 0 ], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) {
 HEAP8[tempDoublePtr] = HEAP8[ptr];
 HEAP8[tempDoublePtr + 1] = HEAP8[ptr + 1];
 HEAP8[tempDoublePtr + 2] = HEAP8[ptr + 2];
 HEAP8[tempDoublePtr + 3] = HEAP8[ptr + 3];
}
function copyTempDouble(ptr) {
 HEAP8[tempDoublePtr] = HEAP8[ptr];
 HEAP8[tempDoublePtr + 1] = HEAP8[ptr + 1];
 HEAP8[tempDoublePtr + 2] = HEAP8[ptr + 2];
 HEAP8[tempDoublePtr + 3] = HEAP8[ptr + 3];
 HEAP8[tempDoublePtr + 4] = HEAP8[ptr + 4];
 HEAP8[tempDoublePtr + 5] = HEAP8[ptr + 5];
 HEAP8[tempDoublePtr + 6] = HEAP8[ptr + 6];
 HEAP8[tempDoublePtr + 7] = HEAP8[ptr + 7];
}
Module["_i64Subtract"] = _i64Subtract;
Module["_i64Add"] = _i64Add;
var emval_methodCallers = [];
function __emval_addMethodCaller(caller) {
 var id = emval_methodCallers.length;
 emval_methodCallers.push(caller);
 return id;
}
var registeredTypes = {};
function _free() {}
Module["_free"] = _free;
function embind_init_charCodes() {
 var codes = new Array(256);
 for (var i = 0; i < 256; ++i) {
  codes[i] = String.fromCharCode(i);
 }
 embind_charCodes = codes;
}
var embind_charCodes = undefined;
function readLatin1String(ptr) {
 var ret = "";
 var c = ptr;
 while (HEAPU8[c]) {
  ret += embind_charCodes[HEAPU8[c++]];
 }
 return ret;
}
function getTypeName(type) {
 var ptr = ___getTypeName(type);
 var rv = readLatin1String(ptr);
 _free(ptr);
 return rv;
}
var char_0 = 48;
var char_9 = 57;
function makeLegalFunctionName(name) {
 if (undefined === name) {
  return "_unknown";
 }
 name = name.replace(/[^a-zA-Z0-9_]/g, "$");
 var f = name.charCodeAt(0);
 if (f >= char_0 && f <= char_9) {
  return "_" + name;
 } else {
  return name;
 }
}
function createNamedFunction(name, body) {
 name = makeLegalFunctionName(name);
 return (new Function("body", "return function " + name + "() {\n" + '    "use strict";' + "    return body.apply(this, arguments);\n" + "};\n"))(body);
}
function extendError(baseErrorType, errorName) {
 var errorClass = createNamedFunction(errorName, (function(message) {
  this.name = errorName;
  this.message = message;
  var stack = (new Error(message)).stack;
  if (stack !== undefined) {
   this.stack = this.toString() + "\n" + stack.replace(/^Error(:[^\n]*)?\n/, "");
  }
 }));
 errorClass.prototype = Object.create(baseErrorType.prototype);
 errorClass.prototype.constructor = errorClass;
 errorClass.prototype.toString = (function() {
  if (this.message === undefined) {
   return this.name;
  } else {
   return this.name + ": " + this.message;
  }
 });
 return errorClass;
}
var BindingError = undefined;
function throwBindingError(message) {
 throw new BindingError(message);
}
function requireRegisteredType(rawType, humanName) {
 var impl = registeredTypes[rawType];
 if (undefined === impl) {
  throwBindingError(humanName + " has unknown type " + getTypeName(rawType));
 }
 return impl;
}
function __emval_lookupTypes(argCount, argTypes, argWireTypes) {
 var a = new Array(argCount);
 for (var i = 0; i < argCount; ++i) {
  a[i] = requireRegisteredType(HEAP32[(argTypes >> 2) + i], "parameter " + i);
 }
 return a;
}
function new_(constructor, argumentList) {
 if (!(constructor instanceof Function)) {
  throw new TypeError("new_ called with constructor type " + typeof constructor + " which is not a function");
 }
 var dummy = createNamedFunction(constructor.name || "unknownFunctionName", (function() {}));
 dummy.prototype = constructor.prototype;
 var obj = new dummy;
 var r = constructor.apply(obj, argumentList);
 return r instanceof Object ? r : obj;
}
function __emval_get_method_caller(argCount, argTypes) {
 var types = __emval_lookupTypes(argCount, argTypes);
 var retType = types[0];
 var signatureName = retType.name + "_$" + types.slice(1).map((function(t) {
  return t.name;
 })).join("_") + "$";
 var params = [ "retType" ];
 var args = [ retType ];
 var argsList = "";
 for (var i = 0; i < argCount - 1; ++i) {
  argsList += (i !== 0 ? ", " : "") + "arg" + i;
  params.push("argType" + i);
  args.push(types[1 + i]);
 }
 var functionName = makeLegalFunctionName("methodCaller_" + signatureName);
 var functionBody = "return function " + functionName + "(handle, name, destructors, args) {\n";
 var offset = 0;
 for (var i = 0; i < argCount - 1; ++i) {
  functionBody += "    var arg" + i + " = argType" + i + ".readValueFromPointer(args" + (offset ? "+" + offset : "") + ");\n";
  offset += types[i + 1]["argPackAdvance"];
 }
 functionBody += "    var rv = handle[name](" + argsList + ");\n";
 for (var i = 0; i < argCount - 1; ++i) {
  if (types[i + 1]["deleteObject"]) {
   functionBody += "    argType" + i + ".deleteObject(arg" + i + ");\n";
  }
 }
 if (!retType.isVoid) {
  functionBody += "    return retType.toWireType(destructors, rv);\n";
 }
 functionBody += "};\n";
 params.push(functionBody);
 var invokerFunction = new_(Function, params).apply(null, args);
 return __emval_addMethodCaller(invokerFunction);
}
function __ZSt18uncaught_exceptionv() {
 return !!__ZSt18uncaught_exceptionv.uncaught_exception;
}
var EXCEPTIONS = {
 last: 0,
 caught: [],
 infos: {},
 deAdjust: (function(adjusted) {
  if (!adjusted || EXCEPTIONS.infos[adjusted]) return adjusted;
  for (var ptr in EXCEPTIONS.infos) {
   var info = EXCEPTIONS.infos[ptr];
   if (info.adjusted === adjusted) {
    return ptr;
   }
  }
  return adjusted;
 }),
 addRef: (function(ptr) {
  if (!ptr) return;
  var info = EXCEPTIONS.infos[ptr];
  info.refcount++;
 }),
 decRef: (function(ptr) {
  if (!ptr) return;
  var info = EXCEPTIONS.infos[ptr];
  assert(info.refcount > 0);
  info.refcount--;
  if (info.refcount === 0) {
   if (info.destructor) {
    Runtime.dynCall("vi", info.destructor, [ ptr ]);
   }
   delete EXCEPTIONS.infos[ptr];
   ___cxa_free_exception(ptr);
  }
 }),
 clearRef: (function(ptr) {
  if (!ptr) return;
  var info = EXCEPTIONS.infos[ptr];
  info.refcount = 0;
 })
};
function ___resumeException(ptr) {
 if (!EXCEPTIONS.last) {
  EXCEPTIONS.last = ptr;
 }
 EXCEPTIONS.clearRef(EXCEPTIONS.deAdjust(ptr));
 throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";
}
function ___cxa_find_matching_catch() {
 var thrown = EXCEPTIONS.last;
 if (!thrown) {
  return (asm["setTempRet0"](0), 0) | 0;
 }
 var info = EXCEPTIONS.infos[thrown];
 var throwntype = info.type;
 if (!throwntype) {
  return (asm["setTempRet0"](0), thrown) | 0;
 }
 var typeArray = Array.prototype.slice.call(arguments);
 var pointer = Module["___cxa_is_pointer_type"](throwntype);
 if (!___cxa_find_matching_catch.buffer) ___cxa_find_matching_catch.buffer = _malloc(4);
 HEAP32[___cxa_find_matching_catch.buffer >> 2] = thrown;
 thrown = ___cxa_find_matching_catch.buffer;
 for (var i = 0; i < typeArray.length; i++) {
  if (typeArray[i] && Module["___cxa_can_catch"](typeArray[i], throwntype, thrown)) {
   thrown = HEAP32[thrown >> 2];
   info.adjusted = thrown;
   return (asm["setTempRet0"](typeArray[i]), thrown) | 0;
  }
 }
 thrown = HEAP32[thrown >> 2];
 return (asm["setTempRet0"](throwntype), thrown) | 0;
}
function ___cxa_throw(ptr, type, destructor) {
 EXCEPTIONS.infos[ptr] = {
  ptr: ptr,
  adjusted: ptr,
  type: type,
  destructor: destructor,
  refcount: 0
 };
 EXCEPTIONS.last = ptr;
 if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
  __ZSt18uncaught_exceptionv.uncaught_exception = 1;
 } else {
  __ZSt18uncaught_exceptionv.uncaught_exception++;
 }
 throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";
}
var GL = {
 counter: 1,
 lastError: 0,
 buffers: [],
 mappedBuffers: {},
 programs: [],
 framebuffers: [],
 renderbuffers: [],
 textures: [],
 uniforms: [],
 shaders: [],
 vaos: [],
 contexts: [],
 currentContext: null,
 byteSizeByTypeRoot: 5120,
 byteSizeByType: [ 1, 1, 2, 2, 4, 4, 4, 2, 3, 4, 8 ],
 programInfos: {},
 stringCache: {},
 packAlignment: 4,
 unpackAlignment: 4,
 init: (function() {
  GL.miniTempBuffer = new Float32Array(GL.MINI_TEMP_BUFFER_SIZE);
  for (var i = 0; i < GL.MINI_TEMP_BUFFER_SIZE; i++) {
   GL.miniTempBufferViews[i] = GL.miniTempBuffer.subarray(0, i + 1);
  }
 }),
 recordError: function recordError(errorCode) {
  if (!GL.lastError) {
   GL.lastError = errorCode;
  }
 },
 getNewId: (function(table) {
  var ret = GL.counter++;
  for (var i = table.length; i < ret; i++) {
   table[i] = null;
  }
  return ret;
 }),
 MINI_TEMP_BUFFER_SIZE: 16,
 miniTempBuffer: null,
 miniTempBufferViews: [ 0 ],
 getSource: (function(shader, count, string, length) {
  var source = "";
  for (var i = 0; i < count; ++i) {
   var frag;
   if (length) {
    var len = HEAP32[length + i * 4 >> 2];
    if (len < 0) {
     frag = Pointer_stringify(HEAP32[string + i * 4 >> 2]);
    } else {
     frag = Pointer_stringify(HEAP32[string + i * 4 >> 2], len);
    }
   } else {
    frag = Pointer_stringify(HEAP32[string + i * 4 >> 2]);
   }
   source += frag;
  }
  return source;
 }),
 computeImageSize: (function(width, height, sizePerPixel, alignment) {
  function roundedToNextMultipleOf(x, y) {
   return Math.floor((x + y - 1) / y) * y;
  }
  var plainRowSize = width * sizePerPixel;
  var alignedRowSize = roundedToNextMultipleOf(plainRowSize, alignment);
  return height <= 0 ? 0 : (height - 1) * alignedRowSize + plainRowSize;
 }),
 get: (function(name_, p, type) {
  if (!p) {
   GL.recordError(1281);
   return;
  }
  var ret = undefined;
  switch (name_) {
  case 36346:
   ret = 1;
   break;
  case 36344:
   if (type !== "Integer") {
    GL.recordError(1280);
   }
   return;
  case 36345:
   ret = 0;
   break;
  case 34466:
   var formats = GLctx.getParameter(34467);
   ret = formats.length;
   break;
  case 35738:
   ret = 5121;
   break;
  case 35739:
   ret = 6408;
   break;
  }
  if (ret === undefined) {
   var result = GLctx.getParameter(name_);
   switch (typeof result) {
   case "number":
    ret = result;
    break;
   case "boolean":
    ret = result ? 1 : 0;
    break;
   case "string":
    GL.recordError(1280);
    return;
   case "object":
    if (result === null) {
     switch (name_) {
     case 34964:
     case 35725:
     case 34965:
     case 36006:
     case 36007:
     case 32873:
     case 34068:
      {
       ret = 0;
       break;
      }
     default:
      {
       GL.recordError(1280);
       return;
      }
     }
    } else if (result instanceof Float32Array || result instanceof Uint32Array || result instanceof Int32Array || result instanceof Array) {
     for (var i = 0; i < result.length; ++i) {
      switch (type) {
      case "Integer":
       HEAP32[p + i * 4 >> 2] = result[i];
       break;
      case "Float":
       HEAPF32[p + i * 4 >> 2] = result[i];
       break;
      case "Boolean":
       HEAP8[p + i >> 0] = result[i] ? 1 : 0;
       break;
      default:
       throw "internal glGet error, bad type: " + type;
      }
     }
     return;
    } else if (result instanceof WebGLBuffer || result instanceof WebGLProgram || result instanceof WebGLFramebuffer || result instanceof WebGLRenderbuffer || result instanceof WebGLTexture) {
     ret = result.name | 0;
    } else {
     GL.recordError(1280);
     return;
    }
    break;
   default:
    GL.recordError(1280);
    return;
   }
  }
  switch (type) {
  case "Integer":
   HEAP32[p >> 2] = ret;
   break;
  case "Float":
   HEAPF32[p >> 2] = ret;
   break;
  case "Boolean":
   HEAP8[p >> 0] = ret ? 1 : 0;
   break;
  default:
   throw "internal glGet error, bad type: " + type;
  }
 }),
 getTexPixelData: (function(type, format, width, height, pixels, internalFormat) {
  var sizePerPixel;
  var numChannels;
  switch (format) {
  case 6406:
  case 6409:
  case 6402:
  case 6403:
   numChannels = 1;
   break;
  case 6410:
  case 33319:
   numChannels = 2;
   break;
  case 6407:
   numChannels = 3;
   break;
  case 6408:
   numChannels = 4;
   break;
  default:
   GL.recordError(1280);
   return {
    pixels: null,
    internalFormat: 0
   };
  }
  switch (type) {
  case 5121:
   sizePerPixel = numChannels * 1;
   break;
  case 5123:
  case 36193:
   sizePerPixel = numChannels * 2;
   break;
  case 5125:
  case 5126:
   sizePerPixel = numChannels * 4;
   break;
  case 34042:
   sizePerPixel = 4;
   break;
  case 33635:
  case 32819:
  case 32820:
   sizePerPixel = 2;
   break;
  default:
   GL.recordError(1280);
   return {
    pixels: null,
    internalFormat: 0
   };
  }
  var bytes = GL.computeImageSize(width, height, sizePerPixel, GL.unpackAlignment);
  if (type == 5121) {
   pixels = HEAPU8.subarray(pixels, pixels + bytes);
  } else if (type == 5126) {
   pixels = HEAPF32.subarray(pixels >> 2, pixels + bytes >> 2);
  } else if (type == 5125 || type == 34042) {
   pixels = HEAPU32.subarray(pixels >> 2, pixels + bytes >> 2);
  } else {
   pixels = HEAPU16.subarray(pixels >> 1, pixels + bytes >> 1);
  }
  return {
   pixels: pixels,
   internalFormat: internalFormat
  };
 }),
 validateBufferTarget: (function(target) {
  switch (target) {
  case 34962:
  case 34963:
  case 36662:
  case 36663:
  case 35051:
  case 35052:
  case 35882:
  case 35982:
  case 35345:
   return true;
  default:
   return false;
  }
 }),
 createContext: (function(canvas, webGLContextAttributes) {
  if (typeof webGLContextAttributes.majorVersion === "undefined" && typeof webGLContextAttributes.minorVersion === "undefined") {
   webGLContextAttributes.majorVersion = 1;
   webGLContextAttributes.minorVersion = 0;
  }
  var ctx;
  var errorInfo = "?";
  function onContextCreationError(event) {
   errorInfo = event.statusMessage || errorInfo;
  }
  try {
   canvas.addEventListener("webglcontextcreationerror", onContextCreationError, false);
   try {
    if (webGLContextAttributes.majorVersion == 1 && webGLContextAttributes.minorVersion == 0) {
     ctx = canvas.getContext("webgl", webGLContextAttributes) || canvas.getContext("experimental-webgl", webGLContextAttributes);
    } else if (webGLContextAttributes.majorVersion == 2 && webGLContextAttributes.minorVersion == 0) {
     ctx = canvas.getContext("webgl2", webGLContextAttributes) || canvas.getContext("experimental-webgl2", webGLContextAttributes);
    } else {
     throw "Unsupported WebGL context version " + majorVersion + "." + minorVersion + "!";
    }
   } finally {
    canvas.removeEventListener("webglcontextcreationerror", onContextCreationError, false);
   }
   if (!ctx) throw ":(";
  } catch (e) {
   Module.print("Could not create canvas: " + [ errorInfo, e, JSON.stringify(webGLContextAttributes) ]);
   return 0;
  }
  if (!ctx) return 0;
  return GL.registerContext(ctx, webGLContextAttributes);
 }),
 registerContext: (function(ctx, webGLContextAttributes) {
  var handle = GL.getNewId(GL.contexts);
  var context = {
   handle: handle,
   version: webGLContextAttributes.majorVersion,
   GLctx: ctx
  };
  if (ctx.canvas) ctx.canvas.GLctxObject = context;
  GL.contexts[handle] = context;
  if (typeof webGLContextAttributes["enableExtensionsByDefault"] === "undefined" || webGLContextAttributes.enableExtensionsByDefault) {
   GL.initExtensions(context);
  }
  return handle;
 }),
 makeContextCurrent: (function(contextHandle) {
  var context = GL.contexts[contextHandle];
  if (!context) return false;
  GLctx = Module.ctx = context.GLctx;
  GL.currentContext = context;
  return true;
 }),
 getContext: (function(contextHandle) {
  return GL.contexts[contextHandle];
 }),
 deleteContext: (function(contextHandle) {
  if (GL.currentContext === GL.contexts[contextHandle]) GL.currentContext = null;
  if (typeof JSEvents === "object") JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas);
  if (GL.contexts[contextHandle] && GL.contexts[contextHandle].GLctx.canvas) GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined;
  GL.contexts[contextHandle] = null;
 }),
 initExtensions: (function(context) {
  if (!context) context = GL.currentContext;
  if (context.initExtensionsDone) return;
  context.initExtensionsDone = true;
  var GLctx = context.GLctx;
  context.maxVertexAttribs = GLctx.getParameter(GLctx.MAX_VERTEX_ATTRIBS);
  context.compressionExt = GLctx.getExtension("WEBGL_compressed_texture_s3tc");
  context.anisotropicExt = GLctx.getExtension("EXT_texture_filter_anisotropic");
  context.floatExt = GLctx.getExtension("OES_texture_float");
  context.instancedArraysExt = GLctx.getExtension("ANGLE_instanced_arrays");
  context.vaoExt = GLctx.getExtension("OES_vertex_array_object");
  if (context.version === 2) {
   context.drawBuffersExt = (function(n, bufs) {
    GLctx.drawBuffers(n, bufs);
   });
  } else {
   var ext = GLctx.getExtension("WEBGL_draw_buffers");
   if (ext) {
    context.drawBuffersExt = (function(n, bufs) {
     ext.drawBuffersWEBGL(n, bufs);
    });
   }
  }
  var automaticallyEnabledExtensions = [ "OES_texture_float", "OES_texture_half_float", "OES_standard_derivatives", "OES_vertex_array_object", "WEBGL_compressed_texture_s3tc", "WEBGL_depth_texture", "OES_element_index_uint", "EXT_texture_filter_anisotropic", "ANGLE_instanced_arrays", "OES_texture_float_linear", "OES_texture_half_float_linear", "WEBGL_compressed_texture_atc", "WEBGL_compressed_texture_pvrtc", "EXT_color_buffer_half_float", "WEBGL_color_buffer_float", "EXT_frag_depth", "EXT_sRGB", "WEBGL_draw_buffers", "WEBGL_shared_resources", "EXT_shader_texture_lod" ];
  function shouldEnableAutomatically(extension) {
   var ret = false;
   automaticallyEnabledExtensions.forEach((function(include) {
    if (ext.indexOf(include) != -1) {
     ret = true;
    }
   }));
   return ret;
  }
  var exts = GLctx.getSupportedExtensions();
  if (exts && exts.length > 0) {
   GLctx.getSupportedExtensions().forEach((function(ext) {
    if (automaticallyEnabledExtensions.indexOf(ext) != -1) {
     GLctx.getExtension(ext);
    }
   }));
  }
 }),
 populateUniformTable: (function(program) {
  var p = GL.programs[program];
  GL.programInfos[program] = {
   uniforms: {},
   maxUniformLength: 0,
   maxAttributeLength: -1
  };
  var ptable = GL.programInfos[program];
  var utable = ptable.uniforms;
  var numUniforms = GLctx.getProgramParameter(p, GLctx.ACTIVE_UNIFORMS);
  for (var i = 0; i < numUniforms; ++i) {
   var u = GLctx.getActiveUniform(p, i);
   var name = u.name;
   ptable.maxUniformLength = Math.max(ptable.maxUniformLength, name.length + 1);
   if (name.indexOf("]", name.length - 1) !== -1) {
    var ls = name.lastIndexOf("[");
    name = name.slice(0, ls);
   }
   var loc = GLctx.getUniformLocation(p, name);
   var id = GL.getNewId(GL.uniforms);
   utable[name] = [ u.size, id ];
   GL.uniforms[id] = loc;
   for (var j = 1; j < u.size; ++j) {
    var n = name + "[" + j + "]";
    loc = GLctx.getUniformLocation(p, n);
    id = GL.getNewId(GL.uniforms);
    GL.uniforms[id] = loc;
   }
  }
 })
};
function _glUseProgram(program) {
 GLctx.useProgram(program ? GL.programs[program] : null);
}
function _glDisableVertexAttribArray(index) {
 GLctx.disableVertexAttribArray(index);
}
function _malloc(bytes) {
 var ptr = Runtime.dynamicAlloc(bytes + 8);
 return ptr + 8 & 4294967288;
}
Module["_malloc"] = _malloc;
var awaitingDependencies = {};
var typeDependencies = {};
var InternalError = undefined;
function throwInternalError(message) {
 throw new InternalError(message);
}
function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
 myTypes.forEach((function(type) {
  typeDependencies[type] = dependentTypes;
 }));
 function onComplete(typeConverters) {
  var myTypeConverters = getTypeConverters(typeConverters);
  if (myTypeConverters.length !== myTypes.length) {
   throwInternalError("Mismatched type converter count");
  }
  for (var i = 0; i < myTypes.length; ++i) {
   registerType(myTypes[i], myTypeConverters[i]);
  }
 }
 var typeConverters = new Array(dependentTypes.length);
 var unregisteredTypes = [];
 var registered = 0;
 dependentTypes.forEach((function(dt, i) {
  if (registeredTypes.hasOwnProperty(dt)) {
   typeConverters[i] = registeredTypes[dt];
  } else {
   unregisteredTypes.push(dt);
   if (!awaitingDependencies.hasOwnProperty(dt)) {
    awaitingDependencies[dt] = [];
   }
   awaitingDependencies[dt].push((function() {
    typeConverters[i] = registeredTypes[dt];
    ++registered;
    if (registered === unregisteredTypes.length) {
     onComplete(typeConverters);
    }
   }));
  }
 }));
 if (0 === unregisteredTypes.length) {
  onComplete(typeConverters);
 }
}
function registerType(rawType, registeredInstance, options) {
 options = options || {};
 if (!("argPackAdvance" in registeredInstance)) {
  throw new TypeError("registerType registeredInstance requires argPackAdvance");
 }
 var name = registeredInstance.name;
 if (!rawType) {
  throwBindingError('type "' + name + '" must have a positive integer typeid pointer');
 }
 if (registeredTypes.hasOwnProperty(rawType)) {
  if (options.ignoreDuplicateRegistrations) {
   return;
  } else {
   throwBindingError("Cannot register type '" + name + "' twice");
  }
 }
 registeredTypes[rawType] = registeredInstance;
 delete typeDependencies[rawType];
 if (awaitingDependencies.hasOwnProperty(rawType)) {
  var callbacks = awaitingDependencies[rawType];
  delete awaitingDependencies[rawType];
  callbacks.forEach((function(cb) {
   cb();
  }));
 }
}
function simpleReadValueFromPointer(pointer) {
 return this["fromWireType"](HEAPU32[pointer >> 2]);
}
function __embind_register_std_string(rawType, name) {
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": (function(value) {
   var length = HEAPU32[value >> 2];
   var a = new Array(length);
   for (var i = 0; i < length; ++i) {
    a[i] = String.fromCharCode(HEAPU8[value + 4 + i]);
   }
   _free(value);
   return a.join("");
  }),
  "toWireType": (function(destructors, value) {
   if (value instanceof ArrayBuffer) {
    value = new Uint8Array(value);
   }
   function getTAElement(ta, index) {
    return ta[index];
   }
   function getStringElement(string, index) {
    return string.charCodeAt(index);
   }
   var getElement;
   if (value instanceof Uint8Array) {
    getElement = getTAElement;
   } else if (value instanceof Int8Array) {
    getElement = getTAElement;
   } else if (typeof value === "string") {
    getElement = getStringElement;
   } else {
    throwBindingError("Cannot pass non-string to std::string");
   }
   var length = value.length;
   var ptr = _malloc(4 + length);
   HEAPU32[ptr >> 2] = length;
   for (var i = 0; i < length; ++i) {
    var charCode = getElement(value, i);
    if (charCode > 255) {
     _free(ptr);
     throwBindingError("String has UTF-16 code units that do not fit in 8 bits");
    }
    HEAPU8[ptr + 4 + i] = charCode;
   }
   if (destructors !== null) {
    destructors.push(_free, ptr);
   }
   return ptr;
  }),
  "argPackAdvance": 8,
  "readValueFromPointer": simpleReadValueFromPointer,
  destructorFunction: (function(ptr) {
   _free(ptr);
  })
 });
}
function _glLinkProgram(program) {
 GLctx.linkProgram(GL.programs[program]);
 GL.programInfos[program] = null;
 GL.populateUniformTable(program);
}
function __embind_register_std_wstring(rawType, charSize, name) {
 name = readLatin1String(name);
 var getHeap, shift;
 if (charSize === 2) {
  getHeap = (function() {
   return HEAPU16;
  });
  shift = 1;
 } else if (charSize === 4) {
  getHeap = (function() {
   return HEAPU32;
  });
  shift = 2;
 }
 registerType(rawType, {
  name: name,
  "fromWireType": (function(value) {
   var HEAP = getHeap();
   var length = HEAPU32[value >> 2];
   var a = new Array(length);
   var start = value + 4 >> shift;
   for (var i = 0; i < length; ++i) {
    a[i] = String.fromCharCode(HEAP[start + i]);
   }
   _free(value);
   return a.join("");
  }),
  "toWireType": (function(destructors, value) {
   var HEAP = getHeap();
   var length = value.length;
   var ptr = _malloc(4 + length * charSize);
   HEAPU32[ptr >> 2] = length;
   var start = ptr + 4 >> shift;
   for (var i = 0; i < length; ++i) {
    HEAP[start + i] = value.charCodeAt(i);
   }
   if (destructors !== null) {
    destructors.push(_free, ptr);
   }
   return ptr;
  }),
  "argPackAdvance": 8,
  "readValueFromPointer": simpleReadValueFromPointer,
  destructorFunction: (function(ptr) {
   _free(ptr);
  })
 });
}
function _glBindTexture(target, texture) {
 GLctx.bindTexture(target, texture ? GL.textures[texture] : null);
}
function _glDeleteFramebuffers(n, framebuffers) {
 for (var i = 0; i < n; ++i) {
  var id = HEAP32[framebuffers + i * 4 >> 2];
  var framebuffer = GL.framebuffers[id];
  if (!framebuffer) continue;
  GLctx.deleteFramebuffer(framebuffer);
  framebuffer.name = 0;
  GL.framebuffers[id] = null;
 }
}
function _glDrawArrays(mode, first, count) {
 GLctx.drawArrays(mode, first, count);
}
var emval_free_list = [];
var emval_handle_array = [ {}, {
 value: undefined
}, {
 value: null
}, {
 value: true
}, {
 value: false
} ];
function __emval_decref(handle) {
 if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
  emval_handle_array[handle] = undefined;
  emval_free_list.push(handle);
 }
}
function _glFramebufferRenderbuffer(target, attachment, renderbuffertarget, renderbuffer) {
 GLctx.framebufferRenderbuffer(target, attachment, renderbuffertarget, GL.renderbuffers[renderbuffer]);
}
function _glDisable(x0) {
 GLctx.disable(x0);
}
var FS = undefined;
var ___errno_state = 0;
function ___setErrNo(value) {
 HEAP32[___errno_state >> 2] = value;
 return value;
}
var ERRNO_CODES = {
 EPERM: 1,
 ENOENT: 2,
 ESRCH: 3,
 EINTR: 4,
 EIO: 5,
 ENXIO: 6,
 E2BIG: 7,
 ENOEXEC: 8,
 EBADF: 9,
 ECHILD: 10,
 EAGAIN: 11,
 EWOULDBLOCK: 11,
 ENOMEM: 12,
 EACCES: 13,
 EFAULT: 14,
 ENOTBLK: 15,
 EBUSY: 16,
 EEXIST: 17,
 EXDEV: 18,
 ENODEV: 19,
 ENOTDIR: 20,
 EISDIR: 21,
 EINVAL: 22,
 ENFILE: 23,
 EMFILE: 24,
 ENOTTY: 25,
 ETXTBSY: 26,
 EFBIG: 27,
 ENOSPC: 28,
 ESPIPE: 29,
 EROFS: 30,
 EMLINK: 31,
 EPIPE: 32,
 EDOM: 33,
 ERANGE: 34,
 ENOMSG: 42,
 EIDRM: 43,
 ECHRNG: 44,
 EL2NSYNC: 45,
 EL3HLT: 46,
 EL3RST: 47,
 ELNRNG: 48,
 EUNATCH: 49,
 ENOCSI: 50,
 EL2HLT: 51,
 EDEADLK: 35,
 ENOLCK: 37,
 EBADE: 52,
 EBADR: 53,
 EXFULL: 54,
 ENOANO: 55,
 EBADRQC: 56,
 EBADSLT: 57,
 EDEADLOCK: 35,
 EBFONT: 59,
 ENOSTR: 60,
 ENODATA: 61,
 ETIME: 62,
 ENOSR: 63,
 ENONET: 64,
 ENOPKG: 65,
 EREMOTE: 66,
 ENOLINK: 67,
 EADV: 68,
 ESRMNT: 69,
 ECOMM: 70,
 EPROTO: 71,
 EMULTIHOP: 72,
 EDOTDOT: 73,
 EBADMSG: 74,
 ENOTUNIQ: 76,
 EBADFD: 77,
 EREMCHG: 78,
 ELIBACC: 79,
 ELIBBAD: 80,
 ELIBSCN: 81,
 ELIBMAX: 82,
 ELIBEXEC: 83,
 ENOSYS: 38,
 ENOTEMPTY: 39,
 ENAMETOOLONG: 36,
 ELOOP: 40,
 EOPNOTSUPP: 95,
 EPFNOSUPPORT: 96,
 ECONNRESET: 104,
 ENOBUFS: 105,
 EAFNOSUPPORT: 97,
 EPROTOTYPE: 91,
 ENOTSOCK: 88,
 ENOPROTOOPT: 92,
 ESHUTDOWN: 108,
 ECONNREFUSED: 111,
 EADDRINUSE: 98,
 ECONNABORTED: 103,
 ENETUNREACH: 101,
 ENETDOWN: 100,
 ETIMEDOUT: 110,
 EHOSTDOWN: 112,
 EHOSTUNREACH: 113,
 EINPROGRESS: 115,
 EALREADY: 114,
 EDESTADDRREQ: 89,
 EMSGSIZE: 90,
 EPROTONOSUPPORT: 93,
 ESOCKTNOSUPPORT: 94,
 EADDRNOTAVAIL: 99,
 ENETRESET: 102,
 EISCONN: 106,
 ENOTCONN: 107,
 ETOOMANYREFS: 109,
 EUSERS: 87,
 EDQUOT: 122,
 ESTALE: 116,
 ENOTSUP: 95,
 ENOMEDIUM: 123,
 EILSEQ: 84,
 EOVERFLOW: 75,
 ECANCELED: 125,
 ENOTRECOVERABLE: 131,
 EOWNERDEAD: 130,
 ESTRPIPE: 86
};
var SOCKFS = undefined;
function _send(fd, buf, len, flags) {
 var sock = SOCKFS.getSocket(fd);
 if (!sock) {
  ___setErrNo(ERRNO_CODES.EBADF);
  return -1;
 }
 return _write(fd, buf, len);
}
function _pwrite(fildes, buf, nbyte, offset) {
 var stream = FS.getStream(fildes);
 if (!stream) {
  ___setErrNo(ERRNO_CODES.EBADF);
  return -1;
 }
 try {
  var slab = HEAP8;
  return FS.write(stream, slab, buf, nbyte, offset);
 } catch (e) {
  FS.handleFSError(e);
  return -1;
 }
}
function _write(fildes, buf, nbyte) {
 var stream = FS.getStream(fildes);
 if (!stream) {
  ___setErrNo(ERRNO_CODES.EBADF);
  return -1;
 }
 try {
  var slab = HEAP8;
  return FS.write(stream, slab, buf, nbyte);
 } catch (e) {
  FS.handleFSError(e);
  return -1;
 }
}
Module["_strlen"] = _strlen;
function _fileno(stream) {
 stream = FS.getStreamFromPtr(stream);
 if (!stream) return -1;
 return stream.fd;
}
function _fputs(s, stream) {
 var fd = _fileno(stream);
 return _write(fd, s, _strlen(s));
}
function _fputc(c, stream) {
 var chr = unSign(c & 255);
 HEAP8[_fputc.ret >> 0] = chr;
 var fd = _fileno(stream);
 var ret = _write(fd, _fputc.ret, 1);
 if (ret == -1) {
  var streamObj = FS.getStreamFromPtr(stream);
  if (streamObj) streamObj.error = true;
  return -1;
 } else {
  return chr;
 }
}
var _stdout = allocate(1, "i32*", ALLOC_STATIC);
function _puts(s) {
 var result = Pointer_stringify(s);
 var string = result.substr(0);
 if (string[string.length - 1] === "\n") string = string.substr(0, string.length - 1);
 Module.print(string);
 return result.length;
}
var PTHREAD_SPECIFIC = {};
var PTHREAD_SPECIFIC_NEXT_KEY = 1;
function _pthread_key_create(key, destructor) {
 if (key == 0) {
  return ERRNO_CODES.EINVAL;
 }
 HEAP32[key >> 2] = PTHREAD_SPECIFIC_NEXT_KEY;
 PTHREAD_SPECIFIC[PTHREAD_SPECIFIC_NEXT_KEY] = 0;
 PTHREAD_SPECIFIC_NEXT_KEY++;
 return 0;
}
function _glActiveTexture(x0) {
 GLctx.activeTexture(x0);
}
function _glEnableVertexAttribArray(index) {
 GLctx.enableVertexAttribArray(index);
}
function _glBindBuffer(target, buffer) {
 var bufferObj = buffer ? GL.buffers[buffer] : null;
 GLctx.bindBuffer(target, bufferObj);
}
var PATH = undefined;
function _emscripten_set_main_loop_timing(mode, value) {
 Browser.mainLoop.timingMode = mode;
 Browser.mainLoop.timingValue = value;
 if (!Browser.mainLoop.func) {
  return 1;
 }
 if (mode == 0) {
  Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler() {
   setTimeout(Browser.mainLoop.runner, value);
  };
  Browser.mainLoop.method = "timeout";
 } else if (mode == 1) {
  Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler() {
   Browser.requestAnimationFrame(Browser.mainLoop.runner);
  };
  Browser.mainLoop.method = "rAF";
 }
 return 0;
}
function _emscripten_set_main_loop(func, fps, simulateInfiniteLoop, arg, noSetTiming) {
 Module["noExitRuntime"] = true;
 assert(!Browser.mainLoop.func, "emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.");
 Browser.mainLoop.func = func;
 Browser.mainLoop.arg = arg;
 var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
 Browser.mainLoop.runner = function Browser_mainLoop_runner() {
  if (ABORT) return;
  if (Browser.mainLoop.queue.length > 0) {
   var start = Date.now();
   var blocker = Browser.mainLoop.queue.shift();
   blocker.func(blocker.arg);
   if (Browser.mainLoop.remainingBlockers) {
    var remaining = Browser.mainLoop.remainingBlockers;
    var next = remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
    if (blocker.counted) {
     Browser.mainLoop.remainingBlockers = next;
    } else {
     next = next + .5;
     Browser.mainLoop.remainingBlockers = (8 * remaining + next) / 9;
    }
   }
   console.log('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + " ms");
   Browser.mainLoop.updateStatus();
   setTimeout(Browser.mainLoop.runner, 0);
   return;
  }
  if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;
  if (Browser.mainLoop.timingMode == 1 && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
   Browser.mainLoop.scheduler();
   return;
  }
  if (Browser.mainLoop.method === "timeout" && Module.ctx) {
   Module.printErr("Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!");
   Browser.mainLoop.method = "";
  }
  Browser.mainLoop.runIter((function() {
   if (typeof arg !== "undefined") {
    Runtime.dynCall("vi", func, [ arg ]);
   } else {
    Runtime.dynCall("v", func);
   }
  }));
  if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  if (typeof SDL === "object" && SDL.audio && SDL.audio.queueNewAudioData) SDL.audio.queueNewAudioData();
  Browser.mainLoop.scheduler();
 };
 if (!noSetTiming) {
  if (fps && fps > 0) _emscripten_set_main_loop_timing(0, 1e3 / fps); else _emscripten_set_main_loop_timing(1, 1);
  Browser.mainLoop.scheduler();
 }
 if (simulateInfiniteLoop) {
  throw "SimulateInfiniteLoop";
 }
}
var Browser = {
 mainLoop: {
  scheduler: null,
  method: "",
  currentlyRunningMainloop: 0,
  func: null,
  arg: 0,
  timingMode: 0,
  timingValue: 0,
  currentFrameNumber: 0,
  queue: [],
  pause: (function() {
   Browser.mainLoop.scheduler = null;
   Browser.mainLoop.currentlyRunningMainloop++;
  }),
  resume: (function() {
   Browser.mainLoop.currentlyRunningMainloop++;
   var timingMode = Browser.mainLoop.timingMode;
   var timingValue = Browser.mainLoop.timingValue;
   var func = Browser.mainLoop.func;
   Browser.mainLoop.func = null;
   _emscripten_set_main_loop(func, 0, false, Browser.mainLoop.arg, true);
   _emscripten_set_main_loop_timing(timingMode, timingValue);
   Browser.mainLoop.scheduler();
  }),
  updateStatus: (function() {
   if (Module["setStatus"]) {
    var message = Module["statusMessage"] || "Please wait...";
    var remaining = Browser.mainLoop.remainingBlockers;
    var expected = Browser.mainLoop.expectedBlockers;
    if (remaining) {
     if (remaining < expected) {
      Module["setStatus"](message + " (" + (expected - remaining) + "/" + expected + ")");
     } else {
      Module["setStatus"](message);
     }
    } else {
     Module["setStatus"]("");
    }
   }
  }),
  runIter: (function(func) {
   if (ABORT) return;
   if (Module["preMainLoop"]) {
    var preRet = Module["preMainLoop"]();
    if (preRet === false) {
     return;
    }
   }
   try {
    func();
   } catch (e) {
    if (e instanceof ExitStatus) {
     return;
    } else {
     if (e && typeof e === "object" && e.stack) Module.printErr("exception thrown: " + [ e, e.stack ]);
     throw e;
    }
   }
   if (Module["postMainLoop"]) Module["postMainLoop"]();
  })
 },
 isFullScreen: false,
 pointerLock: false,
 moduleContextCreatedCallbacks: [],
 workers: [],
 init: (function() {
  if (!Module["preloadPlugins"]) Module["preloadPlugins"] = [];
  if (Browser.initted) return;
  Browser.initted = true;
  try {
   new Blob;
   Browser.hasBlobConstructor = true;
  } catch (e) {
   Browser.hasBlobConstructor = false;
   console.log("warning: no blob constructor, cannot create blobs with mimetypes");
  }
  Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : !Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null;
  Browser.URLObject = typeof window != "undefined" ? window.URL ? window.URL : window.webkitURL : undefined;
  if (!Module.noImageDecoding && typeof Browser.URLObject === "undefined") {
   console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
   Module.noImageDecoding = true;
  }
  var imagePlugin = {};
  imagePlugin["canHandle"] = function imagePlugin_canHandle(name) {
   return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
  };
  imagePlugin["handle"] = function imagePlugin_handle(byteArray, name, onload, onerror) {
   var b = null;
   if (Browser.hasBlobConstructor) {
    try {
     b = new Blob([ byteArray ], {
      type: Browser.getMimetype(name)
     });
     if (b.size !== byteArray.length) {
      b = new Blob([ (new Uint8Array(byteArray)).buffer ], {
       type: Browser.getMimetype(name)
      });
     }
    } catch (e) {
     Runtime.warnOnce("Blob constructor present but fails: " + e + "; falling back to blob builder");
    }
   }
   if (!b) {
    var bb = new Browser.BlobBuilder;
    bb.append((new Uint8Array(byteArray)).buffer);
    b = bb.getBlob();
   }
   var url = Browser.URLObject.createObjectURL(b);
   var img = new Image;
   img.onload = function img_onload() {
    assert(img.complete, "Image " + name + " could not be decoded");
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    Module["preloadedImages"][name] = canvas;
    Browser.URLObject.revokeObjectURL(url);
    if (onload) onload(byteArray);
   };
   img.onerror = function img_onerror(event) {
    console.log("Image " + url + " could not be decoded");
    if (onerror) onerror();
   };
   img.src = url;
  };
  Module["preloadPlugins"].push(imagePlugin);
  var audioPlugin = {};
  audioPlugin["canHandle"] = function audioPlugin_canHandle(name) {
   return !Module.noAudioDecoding && name.substr(-4) in {
    ".ogg": 1,
    ".wav": 1,
    ".mp3": 1
   };
  };
  audioPlugin["handle"] = function audioPlugin_handle(byteArray, name, onload, onerror) {
   var done = false;
   function finish(audio) {
    if (done) return;
    done = true;
    Module["preloadedAudios"][name] = audio;
    if (onload) onload(byteArray);
   }
   function fail() {
    if (done) return;
    done = true;
    Module["preloadedAudios"][name] = new Audio;
    if (onerror) onerror();
   }
   if (Browser.hasBlobConstructor) {
    try {
     var b = new Blob([ byteArray ], {
      type: Browser.getMimetype(name)
     });
    } catch (e) {
     return fail();
    }
    var url = Browser.URLObject.createObjectURL(b);
    var audio = new Audio;
    audio.addEventListener("canplaythrough", (function() {
     finish(audio);
    }), false);
    audio.onerror = function audio_onerror(event) {
     if (done) return;
     console.log("warning: browser could not fully decode audio " + name + ", trying slower base64 approach");
     function encode64(data) {
      var BASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      var PAD = "=";
      var ret = "";
      var leftchar = 0;
      var leftbits = 0;
      for (var i = 0; i < data.length; i++) {
       leftchar = leftchar << 8 | data[i];
       leftbits += 8;
       while (leftbits >= 6) {
        var curr = leftchar >> leftbits - 6 & 63;
        leftbits -= 6;
        ret += BASE[curr];
       }
      }
      if (leftbits == 2) {
       ret += BASE[(leftchar & 3) << 4];
       ret += PAD + PAD;
      } else if (leftbits == 4) {
       ret += BASE[(leftchar & 15) << 2];
       ret += PAD;
      }
      return ret;
     }
     audio.src = "data:audio/x-" + name.substr(-3) + ";base64," + encode64(byteArray);
     finish(audio);
    };
    audio.src = url;
    Browser.safeSetTimeout((function() {
     finish(audio);
    }), 1e4);
   } else {
    return fail();
   }
  };
  Module["preloadPlugins"].push(audioPlugin);
  var canvas = Module["canvas"];
  function pointerLockChange() {
   Browser.pointerLock = document["pointerLockElement"] === canvas || document["mozPointerLockElement"] === canvas || document["webkitPointerLockElement"] === canvas || document["msPointerLockElement"] === canvas;
  }
  if (canvas) {
   canvas.requestPointerLock = canvas["requestPointerLock"] || canvas["mozRequestPointerLock"] || canvas["webkitRequestPointerLock"] || canvas["msRequestPointerLock"] || (function() {});
   canvas.exitPointerLock = document["exitPointerLock"] || document["mozExitPointerLock"] || document["webkitExitPointerLock"] || document["msExitPointerLock"] || (function() {});
   canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
   document.addEventListener("pointerlockchange", pointerLockChange, false);
   document.addEventListener("mozpointerlockchange", pointerLockChange, false);
   document.addEventListener("webkitpointerlockchange", pointerLockChange, false);
   document.addEventListener("mspointerlockchange", pointerLockChange, false);
   if (Module["elementPointerLock"]) {
    canvas.addEventListener("click", (function(ev) {
     if (!Browser.pointerLock && canvas.requestPointerLock) {
      canvas.requestPointerLock();
      ev.preventDefault();
     }
    }), false);
   }
  }
 }),
 createContext: (function(canvas, useWebGL, setInModule, webGLContextAttributes) {
  if (useWebGL && Module.ctx && canvas == Module.canvas) return Module.ctx;
  var ctx;
  var contextHandle;
  if (useWebGL) {
   var contextAttributes = {
    antialias: false,
    alpha: false
   };
   if (webGLContextAttributes) {
    for (var attribute in webGLContextAttributes) {
     contextAttributes[attribute] = webGLContextAttributes[attribute];
    }
   }
   contextHandle = GL.createContext(canvas, contextAttributes);
   if (contextHandle) {
    ctx = GL.getContext(contextHandle).GLctx;
   }
   canvas.style.backgroundColor = "black";
  } else {
   ctx = canvas.getContext("2d");
  }
  if (!ctx) return null;
  if (setInModule) {
   if (!useWebGL) assert(typeof GLctx === "undefined", "cannot set in module if GLctx is used, but we are a non-GL context that would replace it");
   Module.ctx = ctx;
   if (useWebGL) GL.makeContextCurrent(contextHandle);
   Module.useWebGL = useWebGL;
   Browser.moduleContextCreatedCallbacks.forEach((function(callback) {
    callback();
   }));
   Browser.init();
  }
  return ctx;
 }),
 destroyContext: (function(canvas, useWebGL, setInModule) {}),
 fullScreenHandlersInstalled: false,
 lockPointer: undefined,
 resizeCanvas: undefined,
 requestFullScreen: (function(lockPointer, resizeCanvas, vrDevice) {
  Browser.lockPointer = lockPointer;
  Browser.resizeCanvas = resizeCanvas;
  Browser.vrDevice = vrDevice;
  if (typeof Browser.lockPointer === "undefined") Browser.lockPointer = true;
  if (typeof Browser.resizeCanvas === "undefined") Browser.resizeCanvas = false;
  if (typeof Browser.vrDevice === "undefined") Browser.vrDevice = null;
  var canvas = Module["canvas"];
  function fullScreenChange() {
   Browser.isFullScreen = false;
   var canvasContainer = canvas.parentNode;
   if ((document["webkitFullScreenElement"] || document["webkitFullscreenElement"] || document["mozFullScreenElement"] || document["mozFullscreenElement"] || document["fullScreenElement"] || document["fullscreenElement"] || document["msFullScreenElement"] || document["msFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvasContainer) {
    canvas.cancelFullScreen = document["cancelFullScreen"] || document["mozCancelFullScreen"] || document["webkitCancelFullScreen"] || document["msExitFullscreen"] || document["exitFullscreen"] || (function() {});
    canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
    if (Browser.lockPointer) canvas.requestPointerLock();
    Browser.isFullScreen = true;
    if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
   } else {
    canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
    canvasContainer.parentNode.removeChild(canvasContainer);
    if (Browser.resizeCanvas) Browser.setWindowedCanvasSize();
   }
   if (Module["onFullScreen"]) Module["onFullScreen"](Browser.isFullScreen);
   Browser.updateCanvasDimensions(canvas);
  }
  if (!Browser.fullScreenHandlersInstalled) {
   Browser.fullScreenHandlersInstalled = true;
   document.addEventListener("fullscreenchange", fullScreenChange, false);
   document.addEventListener("mozfullscreenchange", fullScreenChange, false);
   document.addEventListener("webkitfullscreenchange", fullScreenChange, false);
   document.addEventListener("MSFullscreenChange", fullScreenChange, false);
  }
  var canvasContainer = document.createElement("div");
  canvas.parentNode.insertBefore(canvasContainer, canvas);
  canvasContainer.appendChild(canvas);
  canvasContainer.requestFullScreen = canvasContainer["requestFullScreen"] || canvasContainer["mozRequestFullScreen"] || canvasContainer["msRequestFullscreen"] || (canvasContainer["webkitRequestFullScreen"] ? (function() {
   canvasContainer["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"]);
  }) : null);
  if (vrDevice) {
   canvasContainer.requestFullScreen({
    vrDisplay: vrDevice
   });
  } else {
   canvasContainer.requestFullScreen();
  }
 }),
 nextRAF: 0,
 fakeRequestAnimationFrame: (function(func) {
  var now = Date.now();
  if (Browser.nextRAF === 0) {
   Browser.nextRAF = now + 1e3 / 60;
  } else {
   while (now + 2 >= Browser.nextRAF) {
    Browser.nextRAF += 1e3 / 60;
   }
  }
  var delay = Math.max(Browser.nextRAF - now, 0);
  setTimeout(func, delay);
 }),
 requestAnimationFrame: function requestAnimationFrame(func) {
  if (typeof window === "undefined") {
   Browser.fakeRequestAnimationFrame(func);
  } else {
   if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = window["requestAnimationFrame"] || window["mozRequestAnimationFrame"] || window["webkitRequestAnimationFrame"] || window["msRequestAnimationFrame"] || window["oRequestAnimationFrame"] || Browser.fakeRequestAnimationFrame;
   }
   window.requestAnimationFrame(func);
  }
 },
 safeCallback: (function(func) {
  return (function() {
   if (!ABORT) return func.apply(null, arguments);
  });
 }),
 allowAsyncCallbacks: true,
 queuedAsyncCallbacks: [],
 pauseAsyncCallbacks: (function() {
  Browser.allowAsyncCallbacks = false;
 }),
 resumeAsyncCallbacks: (function() {
  Browser.allowAsyncCallbacks = true;
  if (Browser.queuedAsyncCallbacks.length > 0) {
   var callbacks = Browser.queuedAsyncCallbacks;
   Browser.queuedAsyncCallbacks = [];
   callbacks.forEach((function(func) {
    func();
   }));
  }
 }),
 safeRequestAnimationFrame: (function(func) {
  return Browser.requestAnimationFrame((function() {
   if (ABORT) return;
   if (Browser.allowAsyncCallbacks) {
    func();
   } else {
    Browser.queuedAsyncCallbacks.push(func);
   }
  }));
 }),
 safeSetTimeout: (function(func, timeout) {
  Module["noExitRuntime"] = true;
  return setTimeout((function() {
   if (ABORT) return;
   if (Browser.allowAsyncCallbacks) {
    func();
   } else {
    Browser.queuedAsyncCallbacks.push(func);
   }
  }), timeout);
 }),
 safeSetInterval: (function(func, timeout) {
  Module["noExitRuntime"] = true;
  return setInterval((function() {
   if (ABORT) return;
   if (Browser.allowAsyncCallbacks) {
    func();
   }
  }), timeout);
 }),
 getMimetype: (function(name) {
  return {
   "jpg": "image/jpeg",
   "jpeg": "image/jpeg",
   "png": "image/png",
   "bmp": "image/bmp",
   "ogg": "audio/ogg",
   "wav": "audio/wav",
   "mp3": "audio/mpeg"
  }[name.substr(name.lastIndexOf(".") + 1)];
 }),
 getUserMedia: (function(func) {
  if (!window.getUserMedia) {
   window.getUserMedia = navigator["getUserMedia"] || navigator["mozGetUserMedia"];
  }
  window.getUserMedia(func);
 }),
 getMovementX: (function(event) {
  return event["movementX"] || event["mozMovementX"] || event["webkitMovementX"] || 0;
 }),
 getMovementY: (function(event) {
  return event["movementY"] || event["mozMovementY"] || event["webkitMovementY"] || 0;
 }),
 getMouseWheelDelta: (function(event) {
  var delta = 0;
  switch (event.type) {
  case "DOMMouseScroll":
   delta = event.detail;
   break;
  case "mousewheel":
   delta = event.wheelDelta;
   break;
  case "wheel":
   delta = event["deltaY"];
   break;
  default:
   throw "unrecognized mouse wheel event: " + event.type;
  }
  return delta;
 }),
 mouseX: 0,
 mouseY: 0,
 mouseMovementX: 0,
 mouseMovementY: 0,
 touches: {},
 lastTouches: {},
 calculateMouseEvent: (function(event) {
  if (Browser.pointerLock) {
   if (event.type != "mousemove" && "mozMovementX" in event) {
    Browser.mouseMovementX = Browser.mouseMovementY = 0;
   } else {
    Browser.mouseMovementX = Browser.getMovementX(event);
    Browser.mouseMovementY = Browser.getMovementY(event);
   }
   if (typeof SDL != "undefined") {
    Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
    Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
   } else {
    Browser.mouseX += Browser.mouseMovementX;
    Browser.mouseY += Browser.mouseMovementY;
   }
  } else {
   var rect = Module["canvas"].getBoundingClientRect();
   var cw = Module["canvas"].width;
   var ch = Module["canvas"].height;
   var scrollX = typeof window.scrollX !== "undefined" ? window.scrollX : window.pageXOffset;
   var scrollY = typeof window.scrollY !== "undefined" ? window.scrollY : window.pageYOffset;
   if (event.type === "touchstart" || event.type === "touchend" || event.type === "touchmove") {
    var touch = event.touch;
    if (touch === undefined) {
     return;
    }
    var adjustedX = touch.pageX - (scrollX + rect.left);
    var adjustedY = touch.pageY - (scrollY + rect.top);
    adjustedX = adjustedX * (cw / rect.width);
    adjustedY = adjustedY * (ch / rect.height);
    var coords = {
     x: adjustedX,
     y: adjustedY
    };
    if (event.type === "touchstart") {
     Browser.lastTouches[touch.identifier] = coords;
     Browser.touches[touch.identifier] = coords;
    } else if (event.type === "touchend" || event.type === "touchmove") {
     var last = Browser.touches[touch.identifier];
     if (!last) last = coords;
     Browser.lastTouches[touch.identifier] = last;
     Browser.touches[touch.identifier] = coords;
    }
    return;
   }
   var x = event.pageX - (scrollX + rect.left);
   var y = event.pageY - (scrollY + rect.top);
   x = x * (cw / rect.width);
   y = y * (ch / rect.height);
   Browser.mouseMovementX = x - Browser.mouseX;
   Browser.mouseMovementY = y - Browser.mouseY;
   Browser.mouseX = x;
   Browser.mouseY = y;
  }
 }),
 xhrLoad: (function(url, onload, onerror) {
  var xhr = new XMLHttpRequest;
  xhr.open("GET", url, true);
  xhr.responseType = "arraybuffer";
  xhr.onload = function xhr_onload() {
   if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
    onload(xhr.response);
   } else {
    onerror();
   }
  };
  xhr.onerror = onerror;
  xhr.send(null);
 }),
 asyncLoad: (function(url, onload, onerror, noRunDep) {
  Browser.xhrLoad(url, (function(arrayBuffer) {
   assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
   onload(new Uint8Array(arrayBuffer));
   if (!noRunDep) removeRunDependency("al " + url);
  }), (function(event) {
   if (onerror) {
    onerror();
   } else {
    throw 'Loading data file "' + url + '" failed.';
   }
  }));
  if (!noRunDep) addRunDependency("al " + url);
 }),
 resizeListeners: [],
 updateResizeListeners: (function() {
  var canvas = Module["canvas"];
  Browser.resizeListeners.forEach((function(listener) {
   listener(canvas.width, canvas.height);
  }));
 }),
 setCanvasSize: (function(width, height, noUpdates) {
  var canvas = Module["canvas"];
  Browser.updateCanvasDimensions(canvas, width, height);
  if (!noUpdates) Browser.updateResizeListeners();
 }),
 windowedWidth: 0,
 windowedHeight: 0,
 setFullScreenCanvasSize: (function() {
  if (typeof SDL != "undefined") {
   var flags = HEAPU32[SDL.screen + Runtime.QUANTUM_SIZE * 0 >> 2];
   flags = flags | 8388608;
   HEAP32[SDL.screen + Runtime.QUANTUM_SIZE * 0 >> 2] = flags;
  }
  Browser.updateResizeListeners();
 }),
 setWindowedCanvasSize: (function() {
  if (typeof SDL != "undefined") {
   var flags = HEAPU32[SDL.screen + Runtime.QUANTUM_SIZE * 0 >> 2];
   flags = flags & ~8388608;
   HEAP32[SDL.screen + Runtime.QUANTUM_SIZE * 0 >> 2] = flags;
  }
  Browser.updateResizeListeners();
 }),
 updateCanvasDimensions: (function(canvas, wNative, hNative) {
  if (wNative && hNative) {
   canvas.widthNative = wNative;
   canvas.heightNative = hNative;
  } else {
   wNative = canvas.widthNative;
   hNative = canvas.heightNative;
  }
  var w = wNative;
  var h = hNative;
  if (Module["forcedAspectRatio"] && Module["forcedAspectRatio"] > 0) {
   if (w / h < Module["forcedAspectRatio"]) {
    w = Math.round(h * Module["forcedAspectRatio"]);
   } else {
    h = Math.round(w / Module["forcedAspectRatio"]);
   }
  }
  if ((document["webkitFullScreenElement"] || document["webkitFullscreenElement"] || document["mozFullScreenElement"] || document["mozFullscreenElement"] || document["fullScreenElement"] || document["fullscreenElement"] || document["msFullScreenElement"] || document["msFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvas.parentNode && typeof screen != "undefined") {
   var factor = Math.min(screen.width / w, screen.height / h);
   w = Math.round(w * factor);
   h = Math.round(h * factor);
  }
  if (Browser.resizeCanvas) {
   if (canvas.width != w) canvas.width = w;
   if (canvas.height != h) canvas.height = h;
   if (typeof canvas.style != "undefined") {
    canvas.style.removeProperty("width");
    canvas.style.removeProperty("height");
   }
  } else {
   if (canvas.width != wNative) canvas.width = wNative;
   if (canvas.height != hNative) canvas.height = hNative;
   if (typeof canvas.style != "undefined") {
    if (w != wNative || h != hNative) {
     canvas.style.setProperty("width", w + "px", "important");
     canvas.style.setProperty("height", h + "px", "important");
    } else {
     canvas.style.removeProperty("width");
     canvas.style.removeProperty("height");
    }
   }
  }
 }),
 wgetRequests: {},
 nextWgetRequestHandle: 0,
 getNextWgetRequestHandle: (function() {
  var handle = Browser.nextWgetRequestHandle;
  Browser.nextWgetRequestHandle++;
  return handle;
 })
};
function _glCompileShader(shader) {
 GLctx.compileShader(GL.shaders[shader]);
}
function _glFramebufferTexture2D(target, attachment, textarget, texture, level) {
 GLctx.framebufferTexture2D(target, attachment, textarget, GL.textures[texture], level);
}
function _glDeleteTextures(n, textures) {
 for (var i = 0; i < n; i++) {
  var id = HEAP32[textures + i * 4 >> 2];
  var texture = GL.textures[id];
  if (!texture) continue;
  GLctx.deleteTexture(texture);
  texture.name = 0;
  GL.textures[id] = null;
 }
}
Module["_bitshift64Lshr"] = _bitshift64Lshr;
function _glBufferData(target, size, data, usage) {
 switch (usage) {
 case 35041:
 case 35042:
  usage = 35040;
  break;
 case 35045:
 case 35046:
  usage = 35044;
  break;
 case 35049:
 case 35050:
  usage = 35048;
  break;
 }
 if (!data) {
  GLctx.bufferData(target, size, usage);
 } else {
  GLctx.bufferData(target, HEAPU8.subarray(data, data + size), usage);
 }
}
var _BDtoIHigh = true;
function _glBindRenderbuffer(target, renderbuffer) {
 GLctx.bindRenderbuffer(target, renderbuffer ? GL.renderbuffers[renderbuffer] : null);
}
function runDestructors(destructors) {
 while (destructors.length) {
  var ptr = destructors.pop();
  var del = destructors.pop();
  del(ptr);
 }
}
function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
 var argCount = argTypes.length;
 if (argCount < 2) {
  throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
 }
 var isClassMethodFunc = argTypes[1] !== null && classType !== null;
 var argsList = "";
 var argsListWired = "";
 for (var i = 0; i < argCount - 2; ++i) {
  argsList += (i !== 0 ? ", " : "") + "arg" + i;
  argsListWired += (i !== 0 ? ", " : "") + "arg" + i + "Wired";
 }
 var invokerFnBody = "return function " + makeLegalFunctionName(humanName) + "(" + argsList + ") {\n" + "if (arguments.length !== " + (argCount - 2) + ") {\n" + "throwBindingError('function " + humanName + " called with ' + arguments.length + ' arguments, expected " + (argCount - 2) + " args!');\n" + "}\n";
 var needsDestructorStack = false;
 for (var i = 1; i < argTypes.length; ++i) {
  if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) {
   needsDestructorStack = true;
   break;
  }
 }
 if (needsDestructorStack) {
  invokerFnBody += "var destructors = [];\n";
 }
 var dtorStack = needsDestructorStack ? "destructors" : "null";
 var args1 = [ "throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam" ];
 var args2 = [ throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1] ];
 if (isClassMethodFunc) {
  invokerFnBody += "var thisWired = classParam.toWireType(" + dtorStack + ", this);\n";
 }
 for (var i = 0; i < argCount - 2; ++i) {
  invokerFnBody += "var arg" + i + "Wired = argType" + i + ".toWireType(" + dtorStack + ", arg" + i + "); // " + argTypes[i + 2].name + "\n";
  args1.push("argType" + i);
  args2.push(argTypes[i + 2]);
 }
 if (isClassMethodFunc) {
  argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired;
 }
 var returns = argTypes[0].name !== "void";
 invokerFnBody += (returns ? "var rv = " : "") + "invoker(fn" + (argsListWired.length > 0 ? ", " : "") + argsListWired + ");\n";
 if (needsDestructorStack) {
  invokerFnBody += "runDestructors(destructors);\n";
 } else {
  for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
   var paramName = i === 1 ? "thisWired" : "arg" + (i - 2) + "Wired";
   if (argTypes[i].destructorFunction !== null) {
    invokerFnBody += paramName + "_dtor(" + paramName + "); // " + argTypes[i].name + "\n";
    args1.push(paramName + "_dtor");
    args2.push(argTypes[i].destructorFunction);
   }
  }
 }
 if (returns) {
  invokerFnBody += "var ret = retType.fromWireType(rv);\n" + "return ret;\n";
 } else {}
 invokerFnBody += "}\n";
 args1.push(invokerFnBody);
 var invokerFunction = new_(Function, args1).apply(null, args2);
 return invokerFunction;
}
function ensureOverloadTable(proto, methodName, humanName) {
 if (undefined === proto[methodName].overloadTable) {
  var prevFunc = proto[methodName];
  proto[methodName] = (function() {
   if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
    throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!");
   }
   return proto[methodName].overloadTable[arguments.length].apply(this, arguments);
  });
  proto[methodName].overloadTable = [];
  proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
 }
}
function heap32VectorToArray(count, firstElement) {
 var array = [];
 for (var i = 0; i < count; i++) {
  array.push(HEAP32[(firstElement >> 2) + i]);
 }
 return array;
}
function requireFunction(signature, rawFunction) {
 signature = readLatin1String(signature);
 function makeDynCaller(dynCall) {
  var args = [];
  for (var i = 1; i < signature.length; ++i) {
   args.push("a" + i);
  }
  var name = "dynCall_" + signature + "_" + rawFunction;
  var body = "return function " + name + "(" + args.join(", ") + ") {\n";
  body += "    return dynCall(rawFunction" + (args.length ? ", " : "") + args.join(", ") + ");\n";
  body += "};\n";
  return (new Function("dynCall", "rawFunction", body))(dynCall, rawFunction);
 }
 var fp;
 if (Module["FUNCTION_TABLE_" + signature] !== undefined) {
  fp = Module["FUNCTION_TABLE_" + signature][rawFunction];
 } else if (typeof FUNCTION_TABLE !== "undefined") {
  fp = FUNCTION_TABLE[rawFunction];
 } else {
  var dc = asm["dynCall_" + signature];
  if (dc === undefined) {
   dc = asm["dynCall_" + signature.replace(/f/g, "d")];
   if (dc === undefined) {
    throwBindingError("No dynCall invoker for signature: " + signature);
   }
  }
  fp = makeDynCaller(dc);
 }
 if (typeof fp !== "function") {
  throwBindingError("unknown function pointer with signature " + signature + ": " + rawFunction);
 }
 return fp;
}
var UnboundTypeError = undefined;
function throwUnboundTypeError(message, types) {
 var unboundTypes = [];
 var seen = {};
 function visit(type) {
  if (seen[type]) {
   return;
  }
  if (registeredTypes[type]) {
   return;
  }
  if (typeDependencies[type]) {
   typeDependencies[type].forEach(visit);
   return;
  }
  unboundTypes.push(type);
  seen[type] = true;
 }
 types.forEach(visit);
 throw new UnboundTypeError(message + ": " + unboundTypes.map(getTypeName).join([ ", " ]));
}
function __embind_register_class_class_function(rawClassType, methodName, argCount, rawArgTypesAddr, invokerSignature, rawInvoker, fn) {
 var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
 methodName = readLatin1String(methodName);
 rawInvoker = requireFunction(invokerSignature, rawInvoker);
 whenDependentTypesAreResolved([], [ rawClassType ], (function(classType) {
  classType = classType[0];
  var humanName = classType.name + "." + methodName;
  function unboundTypesHandler() {
   throwUnboundTypeError("Cannot call " + humanName + " due to unbound types", rawArgTypes);
  }
  var proto = classType.registeredClass.constructor;
  if (undefined === proto[methodName]) {
   unboundTypesHandler.argCount = argCount - 1;
   proto[methodName] = unboundTypesHandler;
  } else {
   ensureOverloadTable(proto, methodName, humanName);
   proto[methodName].overloadTable[argCount - 1] = unboundTypesHandler;
  }
  whenDependentTypesAreResolved([], rawArgTypes, (function(argTypes) {
   var invokerArgsArray = [ argTypes[0], null ].concat(argTypes.slice(1));
   var func = craftInvokerFunction(humanName, invokerArgsArray, null, rawInvoker, fn);
   if (undefined === proto[methodName].overloadTable) {
    proto[methodName] = func;
   } else {
    proto[methodName].overloadTable[argCount - 1] = func;
   }
   return [];
  }));
  return [];
 }));
}
var emval_symbols = {};
function getStringOrSymbol(address) {
 var symbol = emval_symbols[address];
 if (symbol === undefined) {
  return readLatin1String(address);
 } else {
  return symbol;
 }
}
function count_emval_handles() {
 var count = 0;
 for (var i = 5; i < emval_handle_array.length; ++i) {
  if (emval_handle_array[i] !== undefined) {
   ++count;
  }
 }
 return count;
}
function get_first_emval() {
 for (var i = 1; i < emval_handle_array.length; ++i) {
  if (emval_handle_array[i] !== undefined) {
   return emval_handle_array[i];
  }
 }
 return null;
}
function init_emval() {
 Module["count_emval_handles"] = count_emval_handles;
 Module["get_first_emval"] = get_first_emval;
}
function __emval_register(value) {
 switch (value) {
 case undefined:
  {
   return 1;
  }
 case null:
  {
   return 2;
  }
 case true:
  {
   return 3;
  }
 case false:
  {
   return 4;
  }
 default:
  {
   var handle = emval_free_list.length ? emval_free_list.pop() : emval_handle_array.length;
   emval_handle_array[handle] = {
    refcount: 1,
    value: value
   };
   return handle;
  }
 }
}
function __emval_get_module_property(name) {
 name = getStringOrSymbol(name);
 return __emval_register(Module[name]);
}
function __emval_allocateDestructors(destructorsRef) {
 var destructors = [];
 HEAP32[destructorsRef >> 2] = __emval_register(destructors);
 return destructors;
}
function requireHandle(handle) {
 if (!handle) {
  throwBindingError("Cannot use deleted val. handle = " + handle);
 }
 return emval_handle_array[handle].value;
}
function __emval_call_void_method(caller, handle, methodName, args) {
 caller = emval_methodCallers[caller];
 handle = requireHandle(handle);
 methodName = getStringOrSymbol(methodName);
 caller(handle, methodName, null, args);
}
var _emscripten_asm_const_int = true;
function _fwrite(ptr, size, nitems, stream) {
 var bytesToWrite = nitems * size;
 if (bytesToWrite == 0) return 0;
 var fd = _fileno(stream);
 var bytesWritten = _write(fd, ptr, bytesToWrite);
 if (bytesWritten == -1) {
  var streamObj = FS.getStreamFromPtr(stream);
  if (streamObj) streamObj.error = true;
  return 0;
 } else {
  return bytesWritten / size | 0;
 }
}
function __reallyNegative(x) {
 return x < 0 || x === 0 && 1 / x === -Infinity;
}
function __formatString(format, varargs) {
 assert((varargs & 7) === 0);
 var textIndex = format;
 var argIndex = 0;
 function getNextArg(type) {
  var ret;
  argIndex = Runtime.prepVararg(argIndex, type);
  if (type === "double") {
   ret = (HEAP32[tempDoublePtr >> 2] = HEAP32[varargs + argIndex >> 2], HEAP32[tempDoublePtr + 4 >> 2] = HEAP32[varargs + (argIndex + 4) >> 2], +HEAPF64[tempDoublePtr >> 3]);
   argIndex += 8;
  } else if (type == "i64") {
   ret = [ HEAP32[varargs + argIndex >> 2], HEAP32[varargs + (argIndex + 4) >> 2] ];
   argIndex += 8;
  } else {
   assert((argIndex & 3) === 0);
   type = "i32";
   ret = HEAP32[varargs + argIndex >> 2];
   argIndex += 4;
  }
  return ret;
 }
 var ret = [];
 var curr, next, currArg;
 while (1) {
  var startTextIndex = textIndex;
  curr = HEAP8[textIndex >> 0];
  if (curr === 0) break;
  next = HEAP8[textIndex + 1 >> 0];
  if (curr == 37) {
   var flagAlwaysSigned = false;
   var flagLeftAlign = false;
   var flagAlternative = false;
   var flagZeroPad = false;
   var flagPadSign = false;
   flagsLoop : while (1) {
    switch (next) {
    case 43:
     flagAlwaysSigned = true;
     break;
    case 45:
     flagLeftAlign = true;
     break;
    case 35:
     flagAlternative = true;
     break;
    case 48:
     if (flagZeroPad) {
      break flagsLoop;
     } else {
      flagZeroPad = true;
      break;
     }
    case 32:
     flagPadSign = true;
     break;
    default:
     break flagsLoop;
    }
    textIndex++;
    next = HEAP8[textIndex + 1 >> 0];
   }
   var width = 0;
   if (next == 42) {
    width = getNextArg("i32");
    textIndex++;
    next = HEAP8[textIndex + 1 >> 0];
   } else {
    while (next >= 48 && next <= 57) {
     width = width * 10 + (next - 48);
     textIndex++;
     next = HEAP8[textIndex + 1 >> 0];
    }
   }
   var precisionSet = false, precision = -1;
   if (next == 46) {
    precision = 0;
    precisionSet = true;
    textIndex++;
    next = HEAP8[textIndex + 1 >> 0];
    if (next == 42) {
     precision = getNextArg("i32");
     textIndex++;
    } else {
     while (1) {
      var precisionChr = HEAP8[textIndex + 1 >> 0];
      if (precisionChr < 48 || precisionChr > 57) break;
      precision = precision * 10 + (precisionChr - 48);
      textIndex++;
     }
    }
    next = HEAP8[textIndex + 1 >> 0];
   }
   if (precision < 0) {
    precision = 6;
    precisionSet = false;
   }
   var argSize;
   switch (String.fromCharCode(next)) {
   case "h":
    var nextNext = HEAP8[textIndex + 2 >> 0];
    if (nextNext == 104) {
     textIndex++;
     argSize = 1;
    } else {
     argSize = 2;
    }
    break;
   case "l":
    var nextNext = HEAP8[textIndex + 2 >> 0];
    if (nextNext == 108) {
     textIndex++;
     argSize = 8;
    } else {
     argSize = 4;
    }
    break;
   case "L":
   case "q":
   case "j":
    argSize = 8;
    break;
   case "z":
   case "t":
   case "I":
    argSize = 4;
    break;
   default:
    argSize = null;
   }
   if (argSize) textIndex++;
   next = HEAP8[textIndex + 1 >> 0];
   switch (String.fromCharCode(next)) {
   case "d":
   case "i":
   case "u":
   case "o":
   case "x":
   case "X":
   case "p":
    {
     var signed = next == 100 || next == 105;
     argSize = argSize || 4;
     var currArg = getNextArg("i" + argSize * 8);
     var origArg = currArg;
     var argText;
     if (argSize == 8) {
      currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
     }
     if (argSize <= 4) {
      var limit = Math.pow(256, argSize) - 1;
      currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
     }
     var currAbsArg = Math.abs(currArg);
     var prefix = "";
     if (next == 100 || next == 105) {
      if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else argText = reSign(currArg, 8 * argSize, 1).toString(10);
     } else if (next == 117) {
      if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else argText = unSign(currArg, 8 * argSize, 1).toString(10);
      currArg = Math.abs(currArg);
     } else if (next == 111) {
      argText = (flagAlternative ? "0" : "") + currAbsArg.toString(8);
     } else if (next == 120 || next == 88) {
      prefix = flagAlternative && currArg != 0 ? "0x" : "";
      if (argSize == 8 && i64Math) {
       if (origArg[1]) {
        argText = (origArg[1] >>> 0).toString(16);
        var lower = (origArg[0] >>> 0).toString(16);
        while (lower.length < 8) lower = "0" + lower;
        argText += lower;
       } else {
        argText = (origArg[0] >>> 0).toString(16);
       }
      } else if (currArg < 0) {
       currArg = -currArg;
       argText = (currAbsArg - 1).toString(16);
       var buffer = [];
       for (var i = 0; i < argText.length; i++) {
        buffer.push((15 - parseInt(argText[i], 16)).toString(16));
       }
       argText = buffer.join("");
       while (argText.length < argSize * 2) argText = "f" + argText;
      } else {
       argText = currAbsArg.toString(16);
      }
      if (next == 88) {
       prefix = prefix.toUpperCase();
       argText = argText.toUpperCase();
      }
     } else if (next == 112) {
      if (currAbsArg === 0) {
       argText = "(nil)";
      } else {
       prefix = "0x";
       argText = currAbsArg.toString(16);
      }
     }
     if (precisionSet) {
      while (argText.length < precision) {
       argText = "0" + argText;
      }
     }
     if (currArg >= 0) {
      if (flagAlwaysSigned) {
       prefix = "+" + prefix;
      } else if (flagPadSign) {
       prefix = " " + prefix;
      }
     }
     if (argText.charAt(0) == "-") {
      prefix = "-" + prefix;
      argText = argText.substr(1);
     }
     while (prefix.length + argText.length < width) {
      if (flagLeftAlign) {
       argText += " ";
      } else {
       if (flagZeroPad) {
        argText = "0" + argText;
       } else {
        prefix = " " + prefix;
       }
      }
     }
     argText = prefix + argText;
     argText.split("").forEach((function(chr) {
      ret.push(chr.charCodeAt(0));
     }));
     break;
    }
   case "f":
   case "F":
   case "e":
   case "E":
   case "g":
   case "G":
    {
     var currArg = getNextArg("double");
     var argText;
     if (isNaN(currArg)) {
      argText = "nan";
      flagZeroPad = false;
     } else if (!isFinite(currArg)) {
      argText = (currArg < 0 ? "-" : "") + "inf";
      flagZeroPad = false;
     } else {
      var isGeneral = false;
      var effectivePrecision = Math.min(precision, 20);
      if (next == 103 || next == 71) {
       isGeneral = true;
       precision = precision || 1;
       var exponent = parseInt(currArg.toExponential(effectivePrecision).split("e")[1], 10);
       if (precision > exponent && exponent >= -4) {
        next = (next == 103 ? "f" : "F").charCodeAt(0);
        precision -= exponent + 1;
       } else {
        next = (next == 103 ? "e" : "E").charCodeAt(0);
        precision--;
       }
       effectivePrecision = Math.min(precision, 20);
      }
      if (next == 101 || next == 69) {
       argText = currArg.toExponential(effectivePrecision);
       if (/[eE][-+]\d$/.test(argText)) {
        argText = argText.slice(0, -1) + "0" + argText.slice(-1);
       }
      } else if (next == 102 || next == 70) {
       argText = currArg.toFixed(effectivePrecision);
       if (currArg === 0 && __reallyNegative(currArg)) {
        argText = "-" + argText;
       }
      }
      var parts = argText.split("e");
      if (isGeneral && !flagAlternative) {
       while (parts[0].length > 1 && parts[0].indexOf(".") != -1 && (parts[0].slice(-1) == "0" || parts[0].slice(-1) == ".")) {
        parts[0] = parts[0].slice(0, -1);
       }
      } else {
       if (flagAlternative && argText.indexOf(".") == -1) parts[0] += ".";
       while (precision > effectivePrecision++) parts[0] += "0";
      }
      argText = parts[0] + (parts.length > 1 ? "e" + parts[1] : "");
      if (next == 69) argText = argText.toUpperCase();
      if (currArg >= 0) {
       if (flagAlwaysSigned) {
        argText = "+" + argText;
       } else if (flagPadSign) {
        argText = " " + argText;
       }
      }
     }
     while (argText.length < width) {
      if (flagLeftAlign) {
       argText += " ";
      } else {
       if (flagZeroPad && (argText[0] == "-" || argText[0] == "+")) {
        argText = argText[0] + "0" + argText.slice(1);
       } else {
        argText = (flagZeroPad ? "0" : " ") + argText;
       }
      }
     }
     if (next < 97) argText = argText.toUpperCase();
     argText.split("").forEach((function(chr) {
      ret.push(chr.charCodeAt(0));
     }));
     break;
    }
   case "s":
    {
     var arg = getNextArg("i8*");
     var argLength = arg ? _strlen(arg) : "(null)".length;
     if (precisionSet) argLength = Math.min(argLength, precision);
     if (!flagLeftAlign) {
      while (argLength < width--) {
       ret.push(32);
      }
     }
     if (arg) {
      for (var i = 0; i < argLength; i++) {
       ret.push(HEAPU8[arg++ >> 0]);
      }
     } else {
      ret = ret.concat(intArrayFromString("(null)".substr(0, argLength), true));
     }
     if (flagLeftAlign) {
      while (argLength < width--) {
       ret.push(32);
      }
     }
     break;
    }
   case "c":
    {
     if (flagLeftAlign) ret.push(getNextArg("i8"));
     while (--width > 0) {
      ret.push(32);
     }
     if (!flagLeftAlign) ret.push(getNextArg("i8"));
     break;
    }
   case "n":
    {
     var ptr = getNextArg("i32*");
     HEAP32[ptr >> 2] = ret.length;
     break;
    }
   case "%":
    {
     ret.push(curr);
     break;
    }
   default:
    {
     for (var i = startTextIndex; i < textIndex + 2; i++) {
      ret.push(HEAP8[i >> 0]);
     }
    }
   }
   textIndex += 2;
  } else {
   ret.push(curr);
   textIndex += 1;
  }
 }
 return ret;
}
function _fprintf(stream, format, varargs) {
 var result = __formatString(format, varargs);
 var stack = Runtime.stackSave();
 var ret = _fwrite(allocate(result, "i8", ALLOC_STACK), 1, result.length, stream);
 Runtime.stackRestore(stack);
 return ret;
}
function _vfprintf(s, f, va_arg) {
 return _fprintf(s, f, HEAP32[va_arg >> 2]);
}
function __emval_run_destructors(handle) {
 var destructors = emval_handle_array[handle].value;
 runDestructors(destructors);
 __emval_decref(handle);
}
function _emscripten_memcpy_big(dest, src, num) {
 HEAPU8.set(HEAPU8.subarray(src, src + num), dest);
 return dest;
}
Module["_memcpy"] = _memcpy;
function _glGenFramebuffers(n, ids) {
 for (var i = 0; i < n; ++i) {
  var framebuffer = GLctx.createFramebuffer();
  if (!framebuffer) {
   GL.recordError(1282);
   while (i < n) HEAP32[ids + i++ * 4 >> 2] = 0;
   return;
  }
  var id = GL.getNewId(GL.framebuffers);
  framebuffer.name = id;
  GL.framebuffers[id] = framebuffer;
  HEAP32[ids + i * 4 >> 2] = id;
 }
}
function _sbrk(bytes) {
 var self = _sbrk;
 if (!self.called) {
  DYNAMICTOP = alignMemoryPage(DYNAMICTOP);
  self.called = true;
  assert(Runtime.dynamicAlloc);
  self.alloc = Runtime.dynamicAlloc;
  Runtime.dynamicAlloc = (function() {
   abort("cannot dynamically allocate, sbrk now has control");
  });
 }
 var ret = DYNAMICTOP;
 if (bytes != 0) {
  var success = self.alloc(bytes);
  if (!success) return -1 >>> 0;
 }
 return ret;
}
Module["_memmove"] = _memmove;
function _glGenTextures(n, textures) {
 for (var i = 0; i < n; i++) {
  var texture = GLctx.createTexture();
  if (!texture) {
   GL.recordError(1282);
   while (i < n) HEAP32[textures + i++ * 4 >> 2] = 0;
   return;
  }
  var id = GL.getNewId(GL.textures);
  texture.name = id;
  GL.textures[id] = texture;
  HEAP32[textures + i * 4 >> 2] = id;
 }
}
function ___errno_location() {
 return ___errno_state;
}
var ERRNO_MESSAGES = {
 0: "Success",
 1: "Not super-user",
 2: "No such file or directory",
 3: "No such process",
 4: "Interrupted system call",
 5: "I/O error",
 6: "No such device or address",
 7: "Arg list too long",
 8: "Exec format error",
 9: "Bad file number",
 10: "No children",
 11: "No more processes",
 12: "Not enough core",
 13: "Permission denied",
 14: "Bad address",
 15: "Block device required",
 16: "Mount device busy",
 17: "File exists",
 18: "Cross-device link",
 19: "No such device",
 20: "Not a directory",
 21: "Is a directory",
 22: "Invalid argument",
 23: "Too many open files in system",
 24: "Too many open files",
 25: "Not a typewriter",
 26: "Text file busy",
 27: "File too large",
 28: "No space left on device",
 29: "Illegal seek",
 30: "Read only file system",
 31: "Too many links",
 32: "Broken pipe",
 33: "Math arg out of domain of func",
 34: "Math result not representable",
 35: "File locking deadlock error",
 36: "File or path name too long",
 37: "No record locks available",
 38: "Function not implemented",
 39: "Directory not empty",
 40: "Too many symbolic links",
 42: "No message of desired type",
 43: "Identifier removed",
 44: "Channel number out of range",
 45: "Level 2 not synchronized",
 46: "Level 3 halted",
 47: "Level 3 reset",
 48: "Link number out of range",
 49: "Protocol driver not attached",
 50: "No CSI structure available",
 51: "Level 2 halted",
 52: "Invalid exchange",
 53: "Invalid request descriptor",
 54: "Exchange full",
 55: "No anode",
 56: "Invalid request code",
 57: "Invalid slot",
 59: "Bad font file fmt",
 60: "Device not a stream",
 61: "No data (for no delay io)",
 62: "Timer expired",
 63: "Out of streams resources",
 64: "Machine is not on the network",
 65: "Package not installed",
 66: "The object is remote",
 67: "The link has been severed",
 68: "Advertise error",
 69: "Srmount error",
 70: "Communication error on send",
 71: "Protocol error",
 72: "Multihop attempted",
 73: "Cross mount point (not really error)",
 74: "Trying to read unreadable message",
 75: "Value too large for defined data type",
 76: "Given log. name not unique",
 77: "f.d. invalid for this operation",
 78: "Remote address changed",
 79: "Can   access a needed shared lib",
 80: "Accessing a corrupted shared lib",
 81: ".lib section in a.out corrupted",
 82: "Attempting to link in too many libs",
 83: "Attempting to exec a shared library",
 84: "Illegal byte sequence",
 86: "Streams pipe error",
 87: "Too many users",
 88: "Socket operation on non-socket",
 89: "Destination address required",
 90: "Message too long",
 91: "Protocol wrong type for socket",
 92: "Protocol not available",
 93: "Unknown protocol",
 94: "Socket type not supported",
 95: "Not supported",
 96: "Protocol family not supported",
 97: "Address family not supported by protocol family",
 98: "Address already in use",
 99: "Address not available",
 100: "Network interface is not configured",
 101: "Network is unreachable",
 102: "Connection reset by network",
 103: "Connection aborted",
 104: "Connection reset by peer",
 105: "No buffer space available",
 106: "Socket is already connected",
 107: "Socket is not connected",
 108: "Can't send after socket shutdown",
 109: "Too many references",
 110: "Connection timed out",
 111: "Connection refused",
 112: "Host is down",
 113: "Host is unreachable",
 114: "Socket already connected",
 115: "Connection already in progress",
 116: "Stale file handle",
 122: "Quota exceeded",
 123: "No medium (in tape drive)",
 125: "Operation canceled",
 130: "Previous owner died",
 131: "State not recoverable"
};
function _strerror_r(errnum, strerrbuf, buflen) {
 if (errnum in ERRNO_MESSAGES) {
  if (ERRNO_MESSAGES[errnum].length > buflen - 1) {
   return ___setErrNo(ERRNO_CODES.ERANGE);
  } else {
   var msg = ERRNO_MESSAGES[errnum];
   writeAsciiToMemory(msg, strerrbuf);
   return 0;
  }
 } else {
  return ___setErrNo(ERRNO_CODES.EINVAL);
 }
}
function _strerror(errnum) {
 if (!_strerror.buffer) _strerror.buffer = _malloc(256);
 _strerror_r(errnum, _strerror.buffer, 256);
 return _strerror.buffer;
}
function _glGetIntegerv(name_, p) {
 return GL.get(name_, p, "Integer");
}
function _glUniform1f(location, v0) {
 location = GL.uniforms[location];
 GLctx.uniform1f(location, v0);
}
function __embind_register_memory_view(rawType, dataTypeIndex, name) {
 var typeMapping = [ Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array ];
 var TA = typeMapping[dataTypeIndex];
 function decodeMemoryView(handle) {
  handle = handle >> 2;
  var heap = HEAPU32;
  var size = heap[handle];
  var data = heap[handle + 1];
  return new TA(heap["buffer"], data, size);
 }
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": decodeMemoryView,
  "argPackAdvance": 8,
  "readValueFromPointer": decodeMemoryView
 }, {
  ignoreDuplicateRegistrations: true
 });
}
function ___cxa_guard_release() {}
function _glCreateShader(shaderType) {
 var id = GL.getNewId(GL.shaders);
 GL.shaders[id] = GLctx.createShader(shaderType);
 return id;
}
function _glUniform1i(location, v0) {
 location = GL.uniforms[location];
 GLctx.uniform1i(location, v0);
}
function __emval_incref(handle) {
 if (handle > 4) {
  emval_handle_array[handle].refcount += 1;
 }
}
function _glGenRenderbuffers(n, renderbuffers) {
 for (var i = 0; i < n; i++) {
  var renderbuffer = GLctx.createRenderbuffer();
  if (!renderbuffer) {
   GL.recordError(1282);
   while (i < n) HEAP32[renderbuffers + i++ * 4 >> 2] = 0;
   return;
  }
  var id = GL.getNewId(GL.renderbuffers);
  renderbuffer.name = id;
  GL.renderbuffers[id] = renderbuffer;
  HEAP32[renderbuffers + i * 4 >> 2] = id;
 }
}
function _glCreateProgram() {
 var id = GL.getNewId(GL.programs);
 var program = GLctx.createProgram();
 program.name = id;
 GL.programs[id] = program;
 return id;
}
function getShiftFromSize(size) {
 switch (size) {
 case 1:
  return 0;
 case 2:
  return 1;
 case 4:
  return 2;
 case 8:
  return 3;
 default:
  throw new TypeError("Unknown type size: " + size);
 }
}
function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
 var shift = getShiftFromSize(size);
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": (function(wt) {
   return !!wt;
  }),
  "toWireType": (function(destructors, o) {
   return o ? trueValue : falseValue;
  }),
  "argPackAdvance": 8,
  "readValueFromPointer": (function(pointer) {
   var heap;
   if (size === 1) {
    heap = HEAP8;
   } else if (size === 2) {
    heap = HEAP16;
   } else if (size === 4) {
    heap = HEAP32;
   } else {
    throw new TypeError("Unknown boolean type size: " + name);
   }
   return this["fromWireType"](heap[pointer >> shift]);
  }),
  destructorFunction: null
 });
}
function _glTexImage2D(target, level, internalFormat, width, height, border, format, type, pixels) {
 if (pixels) {
  var data = GL.getTexPixelData(type, format, width, height, pixels, internalFormat);
  pixels = data.pixels;
  internalFormat = data.internalFormat;
 } else {
  pixels = null;
 }
 GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels);
}
function _sysconf(name) {
 switch (name) {
 case 30:
  return PAGE_SIZE;
 case 85:
  return totalMemory / PAGE_SIZE;
 case 132:
 case 133:
 case 12:
 case 137:
 case 138:
 case 15:
 case 235:
 case 16:
 case 17:
 case 18:
 case 19:
 case 20:
 case 149:
 case 13:
 case 10:
 case 236:
 case 153:
 case 9:
 case 21:
 case 22:
 case 159:
 case 154:
 case 14:
 case 77:
 case 78:
 case 139:
 case 80:
 case 81:
 case 79:
 case 82:
 case 68:
 case 67:
 case 164:
 case 11:
 case 29:
 case 47:
 case 48:
 case 95:
 case 52:
 case 51:
 case 46:
  return 200809;
 case 27:
 case 246:
 case 127:
 case 128:
 case 23:
 case 24:
 case 160:
 case 161:
 case 181:
 case 182:
 case 242:
 case 183:
 case 184:
 case 243:
 case 244:
 case 245:
 case 165:
 case 178:
 case 179:
 case 49:
 case 50:
 case 168:
 case 169:
 case 175:
 case 170:
 case 171:
 case 172:
 case 97:
 case 76:
 case 32:
 case 173:
 case 35:
  return -1;
 case 176:
 case 177:
 case 7:
 case 155:
 case 8:
 case 157:
 case 125:
 case 126:
 case 92:
 case 93:
 case 129:
 case 130:
 case 131:
 case 94:
 case 91:
  return 1;
 case 74:
 case 60:
 case 69:
 case 70:
 case 4:
  return 1024;
 case 31:
 case 42:
 case 72:
  return 32;
 case 87:
 case 26:
 case 33:
  return 2147483647;
 case 34:
 case 1:
  return 47839;
 case 38:
 case 36:
  return 99;
 case 43:
 case 37:
  return 2048;
 case 0:
  return 2097152;
 case 3:
  return 65536;
 case 28:
  return 32768;
 case 44:
  return 32767;
 case 75:
  return 16384;
 case 39:
  return 1e3;
 case 89:
  return 700;
 case 71:
  return 256;
 case 40:
  return 255;
 case 2:
  return 100;
 case 180:
  return 64;
 case 25:
  return 20;
 case 5:
  return 16;
 case 6:
  return 6;
 case 73:
  return 4;
 case 84:
  {
   if (typeof navigator === "object") return navigator["hardwareConcurrency"] || 1;
   return 1;
  }
 }
 ___setErrNo(ERRNO_CODES.EINVAL);
 return -1;
}
function __embind_register_void(rawType, name) {
 name = readLatin1String(name);
 registerType(rawType, {
  isVoid: true,
  name: name,
  "argPackAdvance": 0,
  "fromWireType": (function() {
   return undefined;
  }),
  "toWireType": (function(destructors, o) {
   return undefined;
  })
 });
}
Module["_memset"] = _memset;
var _BDtoILow = true;
function _glGetProgramiv(program, pname, p) {
 if (pname == 35716) {
  HEAP32[p >> 2] = GLctx.getProgramInfoLog(GL.programs[program]).length + 1;
 } else if (pname == 35719) {
  var ptable = GL.programInfos[program];
  if (ptable) {
   HEAP32[p >> 2] = ptable.maxUniformLength;
   return;
  } else if (program < GL.counter) {
   GL.recordError(1282);
  } else {
   GL.recordError(1281);
  }
 } else if (pname == 35722) {
  var ptable = GL.programInfos[program];
  if (ptable) {
   if (ptable.maxAttributeLength == -1) {
    var program = GL.programs[program];
    var numAttribs = GLctx.getProgramParameter(program, GLctx.ACTIVE_ATTRIBUTES);
    ptable.maxAttributeLength = 0;
    for (var i = 0; i < numAttribs; ++i) {
     var activeAttrib = GLctx.getActiveAttrib(program, i);
     ptable.maxAttributeLength = Math.max(ptable.maxAttributeLength, activeAttrib.name.length + 1);
    }
   }
   HEAP32[p >> 2] = ptable.maxAttributeLength;
   return;
  } else if (program < GL.counter) {
   GL.recordError(1282);
  } else {
   GL.recordError(1281);
  }
 } else {
  HEAP32[p >> 2] = GLctx.getProgramParameter(GL.programs[program], pname);
 }
}
function _glVertexAttribPointer(index, size, type, normalized, stride, ptr) {
 GLctx.vertexAttribPointer(index, size, type, normalized, stride, ptr);
}
function _glGetShaderInfoLog(shader, maxLength, length, infoLog) {
 var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
 if (!log) log = "(unknown error)";
 log = log.substr(0, maxLength - 1);
 if (maxLength > 0 && infoLog) {
  writeStringToMemory(log, infoLog);
  if (length) HEAP32[length >> 2] = log.length;
 } else {
  if (length) HEAP32[length >> 2] = 0;
 }
}
Module["_bitshift64Shl"] = _bitshift64Shl;
function _abort() {
 Module["abort"]();
}
function __emval_as(handle, returnType, destructorsRef) {
 handle = requireHandle(handle);
 returnType = requireRegisteredType(returnType, "emval::as");
 var destructors = [];
 var rd = __emval_register(destructors);
 HEAP32[destructorsRef >> 2] = rd;
 return returnType["toWireType"](destructors, handle);
}
function _glDeleteBuffers(n, buffers) {
 for (var i = 0; i < n; i++) {
  var id = HEAP32[buffers + i * 4 >> 2];
  var buffer = GL.buffers[id];
  if (!buffer) continue;
  GLctx.deleteBuffer(buffer);
  buffer.name = 0;
  GL.buffers[id] = null;
  if (id == GL.currArrayBuffer) GL.currArrayBuffer = 0;
  if (id == GL.currElementArrayBuffer) GL.currElementArrayBuffer = 0;
 }
}
function ___assert_fail(condition, filename, line, func) {
 ABORT = true;
 throw "Assertion failed: " + Pointer_stringify(condition) + ", at: " + [ filename ? Pointer_stringify(filename) : "unknown filename", line, func ? Pointer_stringify(func) : "unknown function" ] + " at " + stackTrace();
}
function _glGetUniformLocation(program, name) {
 name = Pointer_stringify(name);
 var arrayOffset = 0;
 if (name.indexOf("]", name.length - 1) !== -1) {
  var ls = name.lastIndexOf("[");
  var arrayIndex = name.slice(ls + 1, -1);
  if (arrayIndex.length > 0) {
   arrayOffset = parseInt(arrayIndex);
   if (arrayOffset < 0) {
    return -1;
   }
  }
  name = name.slice(0, ls);
 }
 var ptable = GL.programInfos[program];
 if (!ptable) {
  return -1;
 }
 var utable = ptable.uniforms;
 var uniformInfo = utable[name];
 if (uniformInfo && arrayOffset < uniformInfo[0]) {
  return uniformInfo[1] + arrayOffset;
 } else {
  return -1;
 }
}
function ClassHandle_isAliasOf(other) {
 if (!(this instanceof ClassHandle)) {
  return false;
 }
 if (!(other instanceof ClassHandle)) {
  return false;
 }
 var leftClass = this.$$.ptrType.registeredClass;
 var left = this.$$.ptr;
 var rightClass = other.$$.ptrType.registeredClass;
 var right = other.$$.ptr;
 while (leftClass.baseClass) {
  left = leftClass.upcast(left);
  leftClass = leftClass.baseClass;
 }
 while (rightClass.baseClass) {
  right = rightClass.upcast(right);
  rightClass = rightClass.baseClass;
 }
 return leftClass === rightClass && left === right;
}
function shallowCopyInternalPointer(o) {
 return {
  count: o.count,
  deleteScheduled: o.deleteScheduled,
  preservePointerOnDelete: o.preservePointerOnDelete,
  ptr: o.ptr,
  ptrType: o.ptrType,
  smartPtr: o.smartPtr,
  smartPtrType: o.smartPtrType
 };
}
function throwInstanceAlreadyDeleted(obj) {
 function getInstanceTypeName(handle) {
  return handle.$$.ptrType.registeredClass.name;
 }
 throwBindingError(getInstanceTypeName(obj) + " instance already deleted");
}
function ClassHandle_clone() {
 if (!this.$$.ptr) {
  throwInstanceAlreadyDeleted(this);
 }
 if (this.$$.preservePointerOnDelete) {
  this.$$.count.value += 1;
  return this;
 } else {
  var clone = Object.create(Object.getPrototypeOf(this), {
   $$: {
    value: shallowCopyInternalPointer(this.$$)
   }
  });
  clone.$$.count.value += 1;
  clone.$$.deleteScheduled = false;
  return clone;
 }
}
function runDestructor(handle) {
 var $$ = handle.$$;
 if ($$.smartPtr) {
  $$.smartPtrType.rawDestructor($$.smartPtr);
 } else {
  $$.ptrType.registeredClass.rawDestructor($$.ptr);
 }
}
function ClassHandle_delete() {
 if (!this.$$.ptr) {
  throwInstanceAlreadyDeleted(this);
 }
 if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
  throwBindingError("Object already scheduled for deletion");
 }
 this.$$.count.value -= 1;
 var toDelete = 0 === this.$$.count.value;
 if (toDelete) {
  runDestructor(this);
 }
 if (!this.$$.preservePointerOnDelete) {
  this.$$.smartPtr = undefined;
  this.$$.ptr = undefined;
 }
}
function ClassHandle_isDeleted() {
 return !this.$$.ptr;
}
var delayFunction = undefined;
var deletionQueue = [];
function flushPendingDeletes() {
 while (deletionQueue.length) {
  var obj = deletionQueue.pop();
  obj.$$.deleteScheduled = false;
  obj["delete"]();
 }
}
function ClassHandle_deleteLater() {
 if (!this.$$.ptr) {
  throwInstanceAlreadyDeleted(this);
 }
 if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
  throwBindingError("Object already scheduled for deletion");
 }
 deletionQueue.push(this);
 if (deletionQueue.length === 1 && delayFunction) {
  delayFunction(flushPendingDeletes);
 }
 this.$$.deleteScheduled = true;
 return this;
}
function init_ClassHandle() {
 ClassHandle.prototype["isAliasOf"] = ClassHandle_isAliasOf;
 ClassHandle.prototype["clone"] = ClassHandle_clone;
 ClassHandle.prototype["delete"] = ClassHandle_delete;
 ClassHandle.prototype["isDeleted"] = ClassHandle_isDeleted;
 ClassHandle.prototype["deleteLater"] = ClassHandle_deleteLater;
}
function ClassHandle() {}
var registeredPointers = {};
function exposePublicSymbol(name, value, numArguments) {
 if (Module.hasOwnProperty(name)) {
  if (undefined === numArguments || undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments]) {
   throwBindingError("Cannot register public name '" + name + "' twice");
  }
  ensureOverloadTable(Module, name, name);
  if (Module.hasOwnProperty(numArguments)) {
   throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!");
  }
  Module[name].overloadTable[numArguments] = value;
 } else {
  Module[name] = value;
  if (undefined !== numArguments) {
   Module[name].numArguments = numArguments;
  }
 }
}
function RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast) {
 this.name = name;
 this.constructor = constructor;
 this.instancePrototype = instancePrototype;
 this.rawDestructor = rawDestructor;
 this.baseClass = baseClass;
 this.getActualType = getActualType;
 this.upcast = upcast;
 this.downcast = downcast;
 this.pureVirtualFunctions = [];
}
function upcastPointer(ptr, ptrClass, desiredClass) {
 while (ptrClass !== desiredClass) {
  if (!ptrClass.upcast) {
   throwBindingError("Expected null or instance of " + desiredClass.name + ", got an instance of " + ptrClass.name);
  }
  ptr = ptrClass.upcast(ptr);
  ptrClass = ptrClass.baseClass;
 }
 return ptr;
}
function constNoSmartPtrRawPointerToWireType(destructors, handle) {
 if (handle === null) {
  if (this.isReference) {
   throwBindingError("null is not a valid " + this.name);
  }
  return 0;
 }
 if (!handle.$$) {
  throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
 }
 if (!handle.$$.ptr) {
  throwBindingError("Cannot pass deleted object as a pointer of type " + this.name);
 }
 var handleClass = handle.$$.ptrType.registeredClass;
 var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
 return ptr;
}
function genericPointerToWireType(destructors, handle) {
 if (handle === null) {
  if (this.isReference) {
   throwBindingError("null is not a valid " + this.name);
  }
  if (this.isSmartPointer) {
   var ptr = this.rawConstructor();
   if (destructors !== null) {
    destructors.push(this.rawDestructor, ptr);
   }
   return ptr;
  } else {
   return 0;
  }
 }
 if (!handle.$$) {
  throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
 }
 if (!handle.$$.ptr) {
  throwBindingError("Cannot pass deleted object as a pointer of type " + this.name);
 }
 if (!this.isConst && handle.$$.ptrType.isConst) {
  throwBindingError("Cannot convert argument of type " + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + " to parameter type " + this.name);
 }
 var handleClass = handle.$$.ptrType.registeredClass;
 var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
 if (this.isSmartPointer) {
  if (undefined === handle.$$.smartPtr) {
   throwBindingError("Passing raw pointer to smart pointer is illegal");
  }
  switch (this.sharingPolicy) {
  case 0:
   if (handle.$$.smartPtrType === this) {
    ptr = handle.$$.smartPtr;
   } else {
    throwBindingError("Cannot convert argument of type " + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + " to parameter type " + this.name);
   }
   break;
  case 1:
   ptr = handle.$$.smartPtr;
   break;
  case 2:
   if (handle.$$.smartPtrType === this) {
    ptr = handle.$$.smartPtr;
   } else {
    var clonedHandle = handle["clone"]();
    ptr = this.rawShare(ptr, __emval_register((function() {
     clonedHandle["delete"]();
    })));
    if (destructors !== null) {
     destructors.push(this.rawDestructor, ptr);
    }
   }
   break;
  default:
   throwBindingError("Unsupporting sharing policy");
  }
 }
 return ptr;
}
function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
 if (handle === null) {
  if (this.isReference) {
   throwBindingError("null is not a valid " + this.name);
  }
  return 0;
 }
 if (!handle.$$) {
  throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
 }
 if (!handle.$$.ptr) {
  throwBindingError("Cannot pass deleted object as a pointer of type " + this.name);
 }
 if (handle.$$.ptrType.isConst) {
  throwBindingError("Cannot convert argument of type " + handle.$$.ptrType.name + " to parameter type " + this.name);
 }
 var handleClass = handle.$$.ptrType.registeredClass;
 var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
 return ptr;
}
function RegisteredPointer_getPointee(ptr) {
 if (this.rawGetPointee) {
  ptr = this.rawGetPointee(ptr);
 }
 return ptr;
}
function RegisteredPointer_destructor(ptr) {
 if (this.rawDestructor) {
  this.rawDestructor(ptr);
 }
}
function RegisteredPointer_deleteObject(handle) {
 if (handle !== null) {
  handle["delete"]();
 }
}
function downcastPointer(ptr, ptrClass, desiredClass) {
 if (ptrClass === desiredClass) {
  return ptr;
 }
 if (undefined === desiredClass.baseClass) {
  return null;
 }
 var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
 if (rv === null) {
  return null;
 }
 return desiredClass.downcast(rv);
}
function getInheritedInstanceCount() {
 return Object.keys(registeredInstances).length;
}
function getLiveInheritedInstances() {
 var rv = [];
 for (var k in registeredInstances) {
  if (registeredInstances.hasOwnProperty(k)) {
   rv.push(registeredInstances[k]);
  }
 }
 return rv;
}
function setDelayFunction(fn) {
 delayFunction = fn;
 if (deletionQueue.length && delayFunction) {
  delayFunction(flushPendingDeletes);
 }
}
function init_embind() {
 Module["getInheritedInstanceCount"] = getInheritedInstanceCount;
 Module["getLiveInheritedInstances"] = getLiveInheritedInstances;
 Module["flushPendingDeletes"] = flushPendingDeletes;
 Module["setDelayFunction"] = setDelayFunction;
}
var registeredInstances = {};
function getBasestPointer(class_, ptr) {
 if (ptr === undefined) {
  throwBindingError("ptr should not be undefined");
 }
 while (class_.baseClass) {
  ptr = class_.upcast(ptr);
  class_ = class_.baseClass;
 }
 return ptr;
}
function getInheritedInstance(class_, ptr) {
 ptr = getBasestPointer(class_, ptr);
 return registeredInstances[ptr];
}
var _throwInternalError = undefined;
function makeClassHandle(prototype, record) {
 if (!record.ptrType || !record.ptr) {
  throwInternalError("makeClassHandle requires ptr and ptrType");
 }
 var hasSmartPtrType = !!record.smartPtrType;
 var hasSmartPtr = !!record.smartPtr;
 if (hasSmartPtrType !== hasSmartPtr) {
  throwInternalError("Both smartPtrType and smartPtr must be specified");
 }
 record.count = {
  value: 1
 };
 return Object.create(prototype, {
  $$: {
   value: record
  }
 });
}
function RegisteredPointer_fromWireType(ptr) {
 var rawPointer = this.getPointee(ptr);
 if (!rawPointer) {
  this.destructor(ptr);
  return null;
 }
 var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);
 if (undefined !== registeredInstance) {
  if (0 === registeredInstance.$$.count.value) {
   registeredInstance.$$.ptr = rawPointer;
   registeredInstance.$$.smartPtr = ptr;
   return registeredInstance["clone"]();
  } else {
   var rv = registeredInstance["clone"]();
   this.destructor(ptr);
   return rv;
  }
 }
 function makeDefaultHandle() {
  if (this.isSmartPointer) {
   return makeClassHandle(this.registeredClass.instancePrototype, {
    ptrType: this.pointeeType,
    ptr: rawPointer,
    smartPtrType: this,
    smartPtr: ptr
   });
  } else {
   return makeClassHandle(this.registeredClass.instancePrototype, {
    ptrType: this,
    ptr: ptr
   });
  }
 }
 var actualType = this.registeredClass.getActualType(rawPointer);
 var registeredPointerRecord = registeredPointers[actualType];
 if (!registeredPointerRecord) {
  return makeDefaultHandle.call(this);
 }
 var toType;
 if (this.isConst) {
  toType = registeredPointerRecord.constPointerType;
 } else {
  toType = registeredPointerRecord.pointerType;
 }
 var dp = downcastPointer(rawPointer, this.registeredClass, toType.registeredClass);
 if (dp === null) {
  return makeDefaultHandle.call(this);
 }
 if (this.isSmartPointer) {
  return makeClassHandle(toType.registeredClass.instancePrototype, {
   ptrType: toType,
   ptr: dp,
   smartPtrType: this,
   smartPtr: ptr
  });
 } else {
  return makeClassHandle(toType.registeredClass.instancePrototype, {
   ptrType: toType,
   ptr: dp
  });
 }
}
function init_RegisteredPointer() {
 RegisteredPointer.prototype.getPointee = RegisteredPointer_getPointee;
 RegisteredPointer.prototype.destructor = RegisteredPointer_destructor;
 RegisteredPointer.prototype["argPackAdvance"] = 8;
 RegisteredPointer.prototype["readValueFromPointer"] = simpleReadValueFromPointer;
 RegisteredPointer.prototype["deleteObject"] = RegisteredPointer_deleteObject;
 RegisteredPointer.prototype["fromWireType"] = RegisteredPointer_fromWireType;
}
function RegisteredPointer(name, registeredClass, isReference, isConst, isSmartPointer, pointeeType, sharingPolicy, rawGetPointee, rawConstructor, rawShare, rawDestructor) {
 this.name = name;
 this.registeredClass = registeredClass;
 this.isReference = isReference;
 this.isConst = isConst;
 this.isSmartPointer = isSmartPointer;
 this.pointeeType = pointeeType;
 this.sharingPolicy = sharingPolicy;
 this.rawGetPointee = rawGetPointee;
 this.rawConstructor = rawConstructor;
 this.rawShare = rawShare;
 this.rawDestructor = rawDestructor;
 if (!isSmartPointer && registeredClass.baseClass === undefined) {
  if (isConst) {
   this["toWireType"] = constNoSmartPtrRawPointerToWireType;
   this.destructorFunction = null;
  } else {
   this["toWireType"] = nonConstNoSmartPtrRawPointerToWireType;
   this.destructorFunction = null;
  }
 } else {
  this["toWireType"] = genericPointerToWireType;
 }
}
function replacePublicSymbol(name, value, numArguments) {
 if (!Module.hasOwnProperty(name)) {
  throwInternalError("Replacing nonexistant public symbol");
 }
 if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
  Module[name].overloadTable[numArguments] = value;
 } else {
  Module[name] = value;
 }
}
function __embind_register_class(rawType, rawPointerType, rawConstPointerType, baseClassRawType, getActualTypeSignature, getActualType, upcastSignature, upcast, downcastSignature, downcast, name, destructorSignature, rawDestructor) {
 name = readLatin1String(name);
 getActualType = requireFunction(getActualTypeSignature, getActualType);
 if (upcast) {
  upcast = requireFunction(upcastSignature, upcast);
 }
 if (downcast) {
  downcast = requireFunction(downcastSignature, downcast);
 }
 rawDestructor = requireFunction(destructorSignature, rawDestructor);
 var legalFunctionName = makeLegalFunctionName(name);
 exposePublicSymbol(legalFunctionName, (function() {
  throwUnboundTypeError("Cannot construct " + name + " due to unbound types", [ baseClassRawType ]);
 }));
 whenDependentTypesAreResolved([ rawType, rawPointerType, rawConstPointerType ], baseClassRawType ? [ baseClassRawType ] : [], (function(base) {
  base = base[0];
  var baseClass;
  var basePrototype;
  if (baseClassRawType) {
   baseClass = base.registeredClass;
   basePrototype = baseClass.instancePrototype;
  } else {
   basePrototype = ClassHandle.prototype;
  }
  var constructor = createNamedFunction(legalFunctionName, (function() {
   if (Object.getPrototypeOf(this) !== instancePrototype) {
    throw new BindingError("Use 'new' to construct " + name);
   }
   if (undefined === registeredClass.constructor_body) {
    throw new BindingError(name + " has no accessible constructor");
   }
   var body = registeredClass.constructor_body[arguments.length];
   if (undefined === body) {
    throw new BindingError("Tried to invoke ctor of " + name + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(registeredClass.constructor_body).toString() + ") parameters instead!");
   }
   return body.apply(this, arguments);
  }));
  var instancePrototype = Object.create(basePrototype, {
   constructor: {
    value: constructor
   }
  });
  constructor.prototype = instancePrototype;
  var registeredClass = new RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast);
  var referenceConverter = new RegisteredPointer(name, registeredClass, true, false, false);
  var pointerConverter = new RegisteredPointer(name + "*", registeredClass, false, false, false);
  var constPointerConverter = new RegisteredPointer(name + " const*", registeredClass, false, true, false);
  registeredPointers[rawType] = {
   pointerType: pointerConverter,
   constPointerType: constPointerConverter
  };
  replacePublicSymbol(legalFunctionName, constructor);
  return [ referenceConverter, pointerConverter, constPointerConverter ];
 }));
}
function _glBindFramebuffer(target, framebuffer) {
 GLctx.bindFramebuffer(target, framebuffer ? GL.framebuffers[framebuffer] : null);
}
function _pthread_getspecific(key) {
 return PTHREAD_SPECIFIC[key] || 0;
}
function _glEnable(x0) {
 GLctx.enable(x0);
}
function _embind_repr(v) {
 if (v === null) {
  return "null";
 }
 var t = typeof v;
 if (t === "object" || t === "array" || t === "function") {
  return v.toString();
 } else {
  return "" + v;
 }
}
function integerReadValueFromPointer(name, shift, signed) {
 switch (shift) {
 case 0:
  return signed ? function readS8FromPointer(pointer) {
   return HEAP8[pointer];
  } : function readU8FromPointer(pointer) {
   return HEAPU8[pointer];
  };
 case 1:
  return signed ? function readS16FromPointer(pointer) {
   return HEAP16[pointer >> 1];
  } : function readU16FromPointer(pointer) {
   return HEAPU16[pointer >> 1];
  };
 case 2:
  return signed ? function readS32FromPointer(pointer) {
   return HEAP32[pointer >> 2];
  } : function readU32FromPointer(pointer) {
   return HEAPU32[pointer >> 2];
  };
 default:
  throw new TypeError("Unknown integer type: " + name);
 }
}
function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
 name = readLatin1String(name);
 if (maxRange === -1) {
  maxRange = 4294967295;
 }
 var shift = getShiftFromSize(size);
 var fromWireType = (function(value) {
  return value;
 });
 if (minRange === 0) {
  var bitshift = 32 - 8 * size;
  fromWireType = (function(value) {
   return value << bitshift >>> bitshift;
  });
 }
 registerType(primitiveType, {
  name: name,
  "fromWireType": fromWireType,
  "toWireType": (function(destructors, value) {
   if (typeof value !== "number" && typeof value !== "boolean") {
    throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
   }
   if (value < minRange || value > maxRange) {
    throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ", " + maxRange + "]!");
   }
   return value | 0;
  }),
  "argPackAdvance": 8,
  "readValueFromPointer": integerReadValueFromPointer(name, shift, minRange !== 0),
  destructorFunction: null
 });
}
function _glGenBuffers(n, buffers) {
 for (var i = 0; i < n; i++) {
  var buffer = GLctx.createBuffer();
  if (!buffer) {
   GL.recordError(1282);
   while (i < n) HEAP32[buffers + i++ * 4 >> 2] = 0;
   return;
  }
  var id = GL.getNewId(GL.buffers);
  buffer.name = id;
  GL.buffers[id] = buffer;
  HEAP32[buffers + i * 4 >> 2] = id;
 }
}
function __embind_register_emval(rawType, name) {
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": (function(handle) {
   var rv = emval_handle_array[handle].value;
   __emval_decref(handle);
   return rv;
  }),
  "toWireType": (function(destructors, value) {
   return __emval_register(value);
  }),
  "argPackAdvance": 8,
  "readValueFromPointer": simpleReadValueFromPointer,
  destructorFunction: null
 });
}
function _glViewport(x0, x1, x2, x3) {
 GLctx.viewport(x0, x1, x2, x3);
}
function _pthread_setspecific(key, value) {
 if (!(key in PTHREAD_SPECIFIC)) {
  return ERRNO_CODES.EINVAL;
 }
 PTHREAD_SPECIFIC[key] = value;
 return 0;
}
function _glRenderbufferStorage(x0, x1, x2, x3) {
 GLctx.renderbufferStorage(x0, x1, x2, x3);
}
function _glAttachShader(program, shader) {
 GLctx.attachShader(GL.programs[program], GL.shaders[shader]);
}
function ___cxa_allocate_exception(size) {
 return _malloc(size);
}
function _glBlendFunc(x0, x1) {
 GLctx.blendFunc(x0, x1);
}
function _printf(format, varargs) {
 var result = __formatString(format, varargs);
 var string = intArrayToString(result);
 if (string[string.length - 1] === "\n") string = string.substr(0, string.length - 1);
 Module.print(string);
 return result.length;
}
function _glCheckFramebufferStatus(x0) {
 return GLctx.checkFramebufferStatus(x0);
}
function floatReadValueFromPointer(name, shift) {
 switch (shift) {
 case 2:
  return (function(pointer) {
   return this["fromWireType"](HEAPF32[pointer >> 2]);
  });
 case 3:
  return (function(pointer) {
   return this["fromWireType"](HEAPF64[pointer >> 3]);
  });
 default:
  throw new TypeError("Unknown float type: " + name);
 }
}
function __embind_register_float(rawType, name, size) {
 var shift = getShiftFromSize(size);
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": (function(value) {
   return value;
  }),
  "toWireType": (function(destructors, value) {
   if (typeof value !== "number" && typeof value !== "boolean") {
    throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
   }
   return value;
  }),
  "argPackAdvance": 8,
  "readValueFromPointer": floatReadValueFromPointer(name, shift),
  destructorFunction: null
 });
}
function ___cxa_guard_acquire(variable) {
 if (!HEAP8[variable >> 0]) {
  HEAP8[variable >> 0] = 1;
  return 1;
 }
 return 0;
}
function _glBindAttribLocation(program, index, name) {
 name = Pointer_stringify(name);
 GLctx.bindAttribLocation(GL.programs[program], index, name);
}
function _glGetProgramInfoLog(program, maxLength, length, infoLog) {
 var log = GLctx.getProgramInfoLog(GL.programs[program]);
 if (!log) log = "";
 log = log.substr(0, maxLength - 1);
 if (maxLength > 0 && infoLog) {
  writeStringToMemory(log, infoLog);
  if (length) HEAP32[length >> 2] = log.length;
 } else {
  if (length) HEAP32[length >> 2] = 0;
 }
}
function ___cxa_begin_catch(ptr) {
 __ZSt18uncaught_exceptionv.uncaught_exception--;
 EXCEPTIONS.caught.push(ptr);
 EXCEPTIONS.addRef(EXCEPTIONS.deAdjust(ptr));
 return ptr;
}
function _glShaderSource(shader, count, string, length) {
 var source = GL.getSource(shader, count, string, length);
 GLctx.shaderSource(GL.shaders[shader], source);
}
function _glGetActiveUniform(program, index, bufSize, length, size, type, name) {
 program = GL.programs[program];
 var info = GLctx.getActiveUniform(program, index);
 if (!info) return;
 var infoname = info.name.slice(0, Math.max(0, bufSize - 1));
 if (bufSize > 0 && name) {
  writeStringToMemory(infoname, name);
  if (length) HEAP32[length >> 2] = infoname.length;
 } else {
  if (length) HEAP32[length >> 2] = 0;
 }
 if (size) HEAP32[size >> 2] = info.size;
 if (type) HEAP32[type >> 2] = info.type;
}
var _BItoD = true;
function _glTexParameteri(x0, x1, x2) {
 GLctx.texParameteri(x0, x1, x2);
}
function _pthread_once(ptr, func) {
 if (!_pthread_once.seen) _pthread_once.seen = {};
 if (ptr in _pthread_once.seen) return;
 Runtime.dynCall("v", func);
 _pthread_once.seen[ptr] = 1;
}
function _glGenerateMipmap(x0) {
 GLctx.generateMipmap(x0);
}
function _time(ptr) {
 var ret = Date.now() / 1e3 | 0;
 if (ptr) {
  HEAP32[ptr >> 2] = ret;
 }
 return ret;
}
function _glGetShaderiv(shader, pname, p) {
 if (pname == 35716) {
  var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
  if (!log) log = "(unknown error)";
  HEAP32[p >> 2] = log.length + 1;
 } else {
  HEAP32[p >> 2] = GLctx.getShaderParameter(GL.shaders[shader], pname);
 }
}
var _stderr = allocate(1, "i32*", ALLOC_STATIC);
embind_init_charCodes();
BindingError = Module["BindingError"] = extendError(Error, "BindingError");
var GLctx;
GL.init();
InternalError = Module["InternalError"] = extendError(Error, "InternalError");
___errno_state = Runtime.staticAlloc(4);
HEAP32[___errno_state >> 2] = 0;
_fputc.ret = allocate([ 0 ], "i8", ALLOC_STATIC);
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas, vrDevice) {
 Browser.requestFullScreen(lockPointer, resizeCanvas, vrDevice);
};
Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) {
 Browser.requestAnimationFrame(func);
};
Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) {
 Browser.setCanvasSize(width, height, noUpdates);
};
Module["pauseMainLoop"] = function Module_pauseMainLoop() {
 Browser.mainLoop.pause();
};
Module["resumeMainLoop"] = function Module_resumeMainLoop() {
 Browser.mainLoop.resume();
};
Module["getUserMedia"] = function Module_getUserMedia() {
 Browser.getUserMedia();
};
Module["createContext"] = function Module_createContext(canvas, useWebGL, setInModule, webGLContextAttributes) {
 return Browser.createContext(canvas, useWebGL, setInModule, webGLContextAttributes);
};
UnboundTypeError = Module["UnboundTypeError"] = extendError(Error, "UnboundTypeError");
init_emval();
init_ClassHandle();
init_RegisteredPointer();
init_embind();
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true;
STACK_MAX = STACK_BASE + TOTAL_STACK;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");
var cttz_i8 = allocate([ 8, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 6, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 7, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 6, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0 ], "i8", ALLOC_DYNAMIC);
function invoke_vi(index, a1) {
 try {
  Module["dynCall_vi"](index, a1);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_iiii(index, a1, a2, a3) {
 try {
  return Module["dynCall_iiii"](index, a1, a2, a3);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_viiiii(index, a1, a2, a3, a4, a5) {
 try {
  Module["dynCall_viiiii"](index, a1, a2, a3, a4, a5);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_iffff(index, a1, a2, a3, a4) {
 try {
  return Module["dynCall_iffff"](index, a1, a2, a3, a4);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_vii(index, a1, a2) {
 try {
  Module["dynCall_vii"](index, a1, a2);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_iiff(index, a1, a2, a3) {
 try {
  return Module["dynCall_iiff"](index, a1, a2, a3);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_ii(index, a1) {
 try {
  return Module["dynCall_ii"](index, a1);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_iff(index, a1, a2) {
 try {
  return Module["dynCall_iff"](index, a1, a2);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_viifff(index, a1, a2, a3, a4, a5) {
 try {
  Module["dynCall_viifff"](index, a1, a2, a3, a4, a5);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_vfff(index, a1, a2, a3) {
 try {
  Module["dynCall_vfff"](index, a1, a2, a3);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_v(index) {
 try {
  Module["dynCall_v"](index);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_vifff(index, a1, a2, a3, a4) {
 try {
  Module["dynCall_vifff"](index, a1, a2, a3, a4);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_viiiiii(index, a1, a2, a3, a4, a5, a6) {
 try {
  Module["dynCall_viiiiii"](index, a1, a2, a3, a4, a5, a6);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_iii(index, a1, a2) {
 try {
  return Module["dynCall_iii"](index, a1, a2);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_viiii(index, a1, a2, a3, a4) {
 try {
  Module["dynCall_viiii"](index, a1, a2, a3, a4);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
Module.asmGlobalArg = {
 "Math": Math,
 "Int8Array": Int8Array,
 "Int16Array": Int16Array,
 "Int32Array": Int32Array,
 "Uint8Array": Uint8Array,
 "Uint16Array": Uint16Array,
 "Uint32Array": Uint32Array,
 "Float32Array": Float32Array,
 "Float64Array": Float64Array,
 "NaN": NaN,
 "Infinity": Infinity,
 "byteLength": byteLength
};
Module.asmLibraryArg = {
 "abort": abort,
 "assert": assert,
 "invoke_vi": invoke_vi,
 "invoke_iiii": invoke_iiii,
 "invoke_viiiii": invoke_viiiii,
 "invoke_iffff": invoke_iffff,
 "invoke_vii": invoke_vii,
 "invoke_iiff": invoke_iiff,
 "invoke_ii": invoke_ii,
 "invoke_iff": invoke_iff,
 "invoke_viifff": invoke_viifff,
 "invoke_vfff": invoke_vfff,
 "invoke_v": invoke_v,
 "invoke_vifff": invoke_vifff,
 "invoke_viiiiii": invoke_viiiiii,
 "invoke_iii": invoke_iii,
 "invoke_viiii": invoke_viiii,
 "_glUseProgram": _glUseProgram,
 "floatReadValueFromPointer": floatReadValueFromPointer,
 "simpleReadValueFromPointer": simpleReadValueFromPointer,
 "__emval_call_void_method": __emval_call_void_method,
 "_pthread_key_create": _pthread_key_create,
 "throwInternalError": throwInternalError,
 "get_first_emval": get_first_emval,
 "___cxa_guard_acquire": ___cxa_guard_acquire,
 "getLiveInheritedInstances": getLiveInheritedInstances,
 "___assert_fail": ___assert_fail,
 "__ZSt18uncaught_exceptionv": __ZSt18uncaught_exceptionv,
 "ClassHandle": ClassHandle,
 "getShiftFromSize": getShiftFromSize,
 "_glBindBuffer": _glBindBuffer,
 "_glGetShaderInfoLog": _glGetShaderInfoLog,
 "_emscripten_set_main_loop_timing": _emscripten_set_main_loop_timing,
 "_sbrk": _sbrk,
 "_glBlendFunc": _glBlendFunc,
 "_glDisableVertexAttribArray": _glDisableVertexAttribArray,
 "___cxa_begin_catch": ___cxa_begin_catch,
 "_emscripten_memcpy_big": _emscripten_memcpy_big,
 "runDestructor": runDestructor,
 "_sysconf": _sysconf,
 "throwInstanceAlreadyDeleted": throwInstanceAlreadyDeleted,
 "__embind_register_std_string": __embind_register_std_string,
 "init_RegisteredPointer": init_RegisteredPointer,
 "ClassHandle_isAliasOf": ClassHandle_isAliasOf,
 "_fileno": _fileno,
 "flushPendingDeletes": flushPendingDeletes,
 "_puts": _puts,
 "makeClassHandle": makeClassHandle,
 "_write": _write,
 "whenDependentTypesAreResolved": whenDependentTypesAreResolved,
 "_glGenBuffers": _glGenBuffers,
 "_glShaderSource": _glShaderSource,
 "_glFramebufferRenderbuffer": _glFramebufferRenderbuffer,
 "__emval_allocateDestructors": __emval_allocateDestructors,
 "init_ClassHandle": init_ClassHandle,
 "constNoSmartPtrRawPointerToWireType": constNoSmartPtrRawPointerToWireType,
 "_glGenerateMipmap": _glGenerateMipmap,
 "_glVertexAttribPointer": _glVertexAttribPointer,
 "__reallyNegative": __reallyNegative,
 "_send": _send,
 "_glGetProgramInfoLog": _glGetProgramInfoLog,
 "requireHandle": requireHandle,
 "RegisteredClass": RegisteredClass,
 "___cxa_find_matching_catch": ___cxa_find_matching_catch,
 "_glBindRenderbuffer": _glBindRenderbuffer,
 "___cxa_guard_release": ___cxa_guard_release,
 "__emval_as": __emval_as,
 "_strerror_r": _strerror_r,
 "_glViewport": _glViewport,
 "___setErrNo": ___setErrNo,
 "__embind_register_class_class_function": __embind_register_class_class_function,
 "_glDeleteTextures": _glDeleteTextures,
 "__embind_register_bool": __embind_register_bool,
 "___resumeException": ___resumeException,
 "createNamedFunction": createNamedFunction,
 "embind_init_charCodes": embind_init_charCodes,
 "__emval_decref": __emval_decref,
 "_glEnable": _glEnable,
 "_printf": _printf,
 "_glGenTextures": _glGenTextures,
 "_glGetIntegerv": _glGetIntegerv,
 "__embind_register_class": __embind_register_class,
 "ClassHandle_clone": ClassHandle_clone,
 "__emval_addMethodCaller": __emval_addMethodCaller,
 "heap32VectorToArray": heap32VectorToArray,
 "__emval_lookupTypes": __emval_lookupTypes,
 "__emval_run_destructors": __emval_run_destructors,
 "ClassHandle_delete": ClassHandle_delete,
 "_glCreateProgram": _glCreateProgram,
 "RegisteredPointer_destructor": RegisteredPointer_destructor,
 "_fwrite": _fwrite,
 "__embind_register_emval": __embind_register_emval,
 "_time": _time,
 "_fprintf": _fprintf,
 "new_": new_,
 "_glGenFramebuffers": _glGenFramebuffers,
 "downcastPointer": downcastPointer,
 "replacePublicSymbol": replacePublicSymbol,
 "_emscripten_asm_const_2": _emscripten_asm_const_2,
 "init_embind": init_embind,
 "ClassHandle_deleteLater": ClassHandle_deleteLater,
 "_glDeleteFramebuffers": _glDeleteFramebuffers,
 "RegisteredPointer_deleteObject": RegisteredPointer_deleteObject,
 "_glCheckFramebufferStatus": _glCheckFramebufferStatus,
 "ClassHandle_isDeleted": ClassHandle_isDeleted,
 "_vfprintf": _vfprintf,
 "__embind_register_integer": __embind_register_integer,
 "___cxa_allocate_exception": ___cxa_allocate_exception,
 "_pwrite": _pwrite,
 "_pthread_once": _pthread_once,
 "_glBindTexture": _glBindTexture,
 "_glUniform1f": _glUniform1f,
 "_glUniform1i": _glUniform1i,
 "getTypeName": getTypeName,
 "_pthread_getspecific": _pthread_getspecific,
 "_glDrawArrays": _glDrawArrays,
 "_glCreateShader": _glCreateShader,
 "_glAttachShader": _glAttachShader,
 "throwUnboundTypeError": throwUnboundTypeError,
 "craftInvokerFunction": craftInvokerFunction,
 "__emval_get_module_property": __emval_get_module_property,
 "runDestructors": runDestructors,
 "requireRegisteredType": requireRegisteredType,
 "makeLegalFunctionName": makeLegalFunctionName,
 "_glGetActiveUniform": _glGetActiveUniform,
 "upcastPointer": upcastPointer,
 "_glActiveTexture": _glActiveTexture,
 "init_emval": init_emval,
 "shallowCopyInternalPointer": shallowCopyInternalPointer,
 "nonConstNoSmartPtrRawPointerToWireType": nonConstNoSmartPtrRawPointerToWireType,
 "_glCompileShader": _glCompileShader,
 "_glEnableVertexAttribArray": _glEnableVertexAttribArray,
 "registerType": registerType,
 "_abort": _abort,
 "throwBindingError": throwBindingError,
 "_glDeleteBuffers": _glDeleteBuffers,
 "_glBufferData": _glBufferData,
 "_glTexImage2D": _glTexImage2D,
 "exposePublicSymbol": exposePublicSymbol,
 "RegisteredPointer_fromWireType": RegisteredPointer_fromWireType,
 "__emval_get_method_caller": __emval_get_method_caller,
 "_glGetProgramiv": _glGetProgramiv,
 "__embind_register_memory_view": __embind_register_memory_view,
 "getInheritedInstance": getInheritedInstance,
 "setDelayFunction": setDelayFunction,
 "extendError": extendError,
 "ensureOverloadTable": ensureOverloadTable,
 "__embind_register_void": __embind_register_void,
 "_glDisable": _glDisable,
 "_glLinkProgram": _glLinkProgram,
 "_glBindFramebuffer": _glBindFramebuffer,
 "_glGenRenderbuffers": _glGenRenderbuffers,
 "__emval_register": __emval_register,
 "RegisteredPointer_getPointee": RegisteredPointer_getPointee,
 "_glGetUniformLocation": _glGetUniformLocation,
 "_strerror": _strerror,
 "__embind_register_std_wstring": __embind_register_std_wstring,
 "getStringOrSymbol": getStringOrSymbol,
 "_embind_repr": _embind_repr,
 "_glRenderbufferStorage": _glRenderbufferStorage,
 "__emval_incref": __emval_incref,
 "RegisteredPointer": RegisteredPointer,
 "_glBindAttribLocation": _glBindAttribLocation,
 "_glGetShaderiv": _glGetShaderiv,
 "readLatin1String": readLatin1String,
 "getBasestPointer": getBasestPointer,
 "getInheritedInstanceCount": getInheritedInstanceCount,
 "__embind_register_float": __embind_register_float,
 "integerReadValueFromPointer": integerReadValueFromPointer,
 "_glFramebufferTexture2D": _glFramebufferTexture2D,
 "_emscripten_set_main_loop": _emscripten_set_main_loop,
 "___errno_location": ___errno_location,
 "_pthread_setspecific": _pthread_setspecific,
 "genericPointerToWireType": genericPointerToWireType,
 "_fputc": _fputc,
 "___cxa_throw": ___cxa_throw,
 "count_emval_handles": count_emval_handles,
 "requireFunction": requireFunction,
 "_glTexParameteri": _glTexParameteri,
 "__formatString": __formatString,
 "_fputs": _fputs,
 "STACKTOP": STACKTOP,
 "STACK_MAX": STACK_MAX,
 "tempDoublePtr": tempDoublePtr,
 "ABORT": ABORT,
 "cttz_i8": cttz_i8,
 "_stderr": _stderr
};
// EMSCRIPTEN_START_ASM

var asm = (function(global,env,buffer) {

  'use asm';
  
  var Int8View = global.Int8Array;
  var Int16View = global.Int16Array;
  var Int32View = global.Int32Array;
  var Uint8View = global.Uint8Array;
  var Uint16View = global.Uint16Array;
  var Uint32View = global.Uint32Array;
  var Float32View = global.Float32Array;
  var Float64View = global.Float64Array;
  var HEAP8 = new Int8View(buffer);
  var HEAP16 = new Int16View(buffer);
  var HEAP32 = new Int32View(buffer);
  var HEAPU8 = new Uint8View(buffer);
  var HEAPU16 = new Uint16View(buffer);
  var HEAPU32 = new Uint32View(buffer);
  var HEAPF32 = new Float32View(buffer);
  var HEAPF64 = new Float64View(buffer);
  var byteLength = global.byteLength;


  var STACKTOP=env.STACKTOP|0;
  var STACK_MAX=env.STACK_MAX|0;
  var tempDoublePtr=env.tempDoublePtr|0;
  var ABORT=env.ABORT|0;
  var cttz_i8=env.cttz_i8|0;
  var _stderr=env._stderr|0;

  var __THREW__ = 0;
  var threwValue = 0;
  var setjmpId = 0;
  var undef = 0;
  var nan = global.NaN, inf = global.Infinity;
  var tempInt = 0, tempBigInt = 0, tempBigIntP = 0, tempBigIntS = 0, tempBigIntR = 0.0, tempBigIntI = 0, tempBigIntD = 0, tempValue = 0, tempDouble = 0.0;

  var tempRet0 = 0;
  var tempRet1 = 0;
  var tempRet2 = 0;
  var tempRet3 = 0;
  var tempRet4 = 0;
  var tempRet5 = 0;
  var tempRet6 = 0;
  var tempRet7 = 0;
  var tempRet8 = 0;
  var tempRet9 = 0;
  var Math_floor=global.Math.floor;
  var Math_abs=global.Math.abs;
  var Math_sqrt=global.Math.sqrt;
  var Math_pow=global.Math.pow;
  var Math_cos=global.Math.cos;
  var Math_sin=global.Math.sin;
  var Math_tan=global.Math.tan;
  var Math_acos=global.Math.acos;
  var Math_asin=global.Math.asin;
  var Math_atan=global.Math.atan;
  var Math_atan2=global.Math.atan2;
  var Math_exp=global.Math.exp;
  var Math_log=global.Math.log;
  var Math_ceil=global.Math.ceil;
  var Math_imul=global.Math.imul;
  var Math_min=global.Math.min;
  var Math_clz32=global.Math.clz32;
  var Math_fround=global.Math.fround;
  var abort=env.abort;
  var assert=env.assert;
  var invoke_vi=env.invoke_vi;
  var invoke_iiii=env.invoke_iiii;
  var invoke_viiiii=env.invoke_viiiii;
  var invoke_iffff=env.invoke_iffff;
  var invoke_vii=env.invoke_vii;
  var invoke_iiff=env.invoke_iiff;
  var invoke_ii=env.invoke_ii;
  var invoke_iff=env.invoke_iff;
  var invoke_viifff=env.invoke_viifff;
  var invoke_vfff=env.invoke_vfff;
  var invoke_v=env.invoke_v;
  var invoke_vifff=env.invoke_vifff;
  var invoke_viiiiii=env.invoke_viiiiii;
  var invoke_iii=env.invoke_iii;
  var invoke_viiii=env.invoke_viiii;
  var _glUseProgram=env._glUseProgram;
  var floatReadValueFromPointer=env.floatReadValueFromPointer;
  var simpleReadValueFromPointer=env.simpleReadValueFromPointer;
  var __emval_call_void_method=env.__emval_call_void_method;
  var _pthread_key_create=env._pthread_key_create;
  var throwInternalError=env.throwInternalError;
  var get_first_emval=env.get_first_emval;
  var ___cxa_guard_acquire=env.___cxa_guard_acquire;
  var getLiveInheritedInstances=env.getLiveInheritedInstances;
  var ___assert_fail=env.___assert_fail;
  var __ZSt18uncaught_exceptionv=env.__ZSt18uncaught_exceptionv;
  var ClassHandle=env.ClassHandle;
  var getShiftFromSize=env.getShiftFromSize;
  var _glBindBuffer=env._glBindBuffer;
  var _glGetShaderInfoLog=env._glGetShaderInfoLog;
  var _emscripten_set_main_loop_timing=env._emscripten_set_main_loop_timing;
  var _sbrk=env._sbrk;
  var _glBlendFunc=env._glBlendFunc;
  var _glDisableVertexAttribArray=env._glDisableVertexAttribArray;
  var ___cxa_begin_catch=env.___cxa_begin_catch;
  var _emscripten_memcpy_big=env._emscripten_memcpy_big;
  var runDestructor=env.runDestructor;
  var _sysconf=env._sysconf;
  var throwInstanceAlreadyDeleted=env.throwInstanceAlreadyDeleted;
  var __embind_register_std_string=env.__embind_register_std_string;
  var init_RegisteredPointer=env.init_RegisteredPointer;
  var ClassHandle_isAliasOf=env.ClassHandle_isAliasOf;
  var _fileno=env._fileno;
  var flushPendingDeletes=env.flushPendingDeletes;
  var _puts=env._puts;
  var makeClassHandle=env.makeClassHandle;
  var _write=env._write;
  var whenDependentTypesAreResolved=env.whenDependentTypesAreResolved;
  var _glGenBuffers=env._glGenBuffers;
  var _glShaderSource=env._glShaderSource;
  var _glFramebufferRenderbuffer=env._glFramebufferRenderbuffer;
  var __emval_allocateDestructors=env.__emval_allocateDestructors;
  var init_ClassHandle=env.init_ClassHandle;
  var constNoSmartPtrRawPointerToWireType=env.constNoSmartPtrRawPointerToWireType;
  var _glGenerateMipmap=env._glGenerateMipmap;
  var _glVertexAttribPointer=env._glVertexAttribPointer;
  var __reallyNegative=env.__reallyNegative;
  var _send=env._send;
  var _glGetProgramInfoLog=env._glGetProgramInfoLog;
  var requireHandle=env.requireHandle;
  var RegisteredClass=env.RegisteredClass;
  var ___cxa_find_matching_catch=env.___cxa_find_matching_catch;
  var _glBindRenderbuffer=env._glBindRenderbuffer;
  var ___cxa_guard_release=env.___cxa_guard_release;
  var __emval_as=env.__emval_as;
  var _strerror_r=env._strerror_r;
  var _glViewport=env._glViewport;
  var ___setErrNo=env.___setErrNo;
  var __embind_register_class_class_function=env.__embind_register_class_class_function;
  var _glDeleteTextures=env._glDeleteTextures;
  var __embind_register_bool=env.__embind_register_bool;
  var ___resumeException=env.___resumeException;
  var createNamedFunction=env.createNamedFunction;
  var embind_init_charCodes=env.embind_init_charCodes;
  var __emval_decref=env.__emval_decref;
  var _glEnable=env._glEnable;
  var _printf=env._printf;
  var _glGenTextures=env._glGenTextures;
  var _glGetIntegerv=env._glGetIntegerv;
  var __embind_register_class=env.__embind_register_class;
  var ClassHandle_clone=env.ClassHandle_clone;
  var __emval_addMethodCaller=env.__emval_addMethodCaller;
  var heap32VectorToArray=env.heap32VectorToArray;
  var __emval_lookupTypes=env.__emval_lookupTypes;
  var __emval_run_destructors=env.__emval_run_destructors;
  var ClassHandle_delete=env.ClassHandle_delete;
  var _glCreateProgram=env._glCreateProgram;
  var RegisteredPointer_destructor=env.RegisteredPointer_destructor;
  var _fwrite=env._fwrite;
  var __embind_register_emval=env.__embind_register_emval;
  var _time=env._time;
  var _fprintf=env._fprintf;
  var new_=env.new_;
  var _glGenFramebuffers=env._glGenFramebuffers;
  var downcastPointer=env.downcastPointer;
  var replacePublicSymbol=env.replacePublicSymbol;
  var _emscripten_asm_const_2=env._emscripten_asm_const_2;
  var init_embind=env.init_embind;
  var ClassHandle_deleteLater=env.ClassHandle_deleteLater;
  var _glDeleteFramebuffers=env._glDeleteFramebuffers;
  var RegisteredPointer_deleteObject=env.RegisteredPointer_deleteObject;
  var _glCheckFramebufferStatus=env._glCheckFramebufferStatus;
  var ClassHandle_isDeleted=env.ClassHandle_isDeleted;
  var _vfprintf=env._vfprintf;
  var __embind_register_integer=env.__embind_register_integer;
  var ___cxa_allocate_exception=env.___cxa_allocate_exception;
  var _pwrite=env._pwrite;
  var _pthread_once=env._pthread_once;
  var _glBindTexture=env._glBindTexture;
  var _glUniform1f=env._glUniform1f;
  var _glUniform1i=env._glUniform1i;
  var getTypeName=env.getTypeName;
  var _pthread_getspecific=env._pthread_getspecific;
  var _glDrawArrays=env._glDrawArrays;
  var _glCreateShader=env._glCreateShader;
  var _glAttachShader=env._glAttachShader;
  var throwUnboundTypeError=env.throwUnboundTypeError;
  var craftInvokerFunction=env.craftInvokerFunction;
  var __emval_get_module_property=env.__emval_get_module_property;
  var runDestructors=env.runDestructors;
  var requireRegisteredType=env.requireRegisteredType;
  var makeLegalFunctionName=env.makeLegalFunctionName;
  var _glGetActiveUniform=env._glGetActiveUniform;
  var upcastPointer=env.upcastPointer;
  var _glActiveTexture=env._glActiveTexture;
  var init_emval=env.init_emval;
  var shallowCopyInternalPointer=env.shallowCopyInternalPointer;
  var nonConstNoSmartPtrRawPointerToWireType=env.nonConstNoSmartPtrRawPointerToWireType;
  var _glCompileShader=env._glCompileShader;
  var _glEnableVertexAttribArray=env._glEnableVertexAttribArray;
  var registerType=env.registerType;
  var _abort=env._abort;
  var throwBindingError=env.throwBindingError;
  var _glDeleteBuffers=env._glDeleteBuffers;
  var _glBufferData=env._glBufferData;
  var _glTexImage2D=env._glTexImage2D;
  var exposePublicSymbol=env.exposePublicSymbol;
  var RegisteredPointer_fromWireType=env.RegisteredPointer_fromWireType;
  var __emval_get_method_caller=env.__emval_get_method_caller;
  var _glGetProgramiv=env._glGetProgramiv;
  var __embind_register_memory_view=env.__embind_register_memory_view;
  var getInheritedInstance=env.getInheritedInstance;
  var setDelayFunction=env.setDelayFunction;
  var extendError=env.extendError;
  var ensureOverloadTable=env.ensureOverloadTable;
  var __embind_register_void=env.__embind_register_void;
  var _glDisable=env._glDisable;
  var _glLinkProgram=env._glLinkProgram;
  var _glBindFramebuffer=env._glBindFramebuffer;
  var _glGenRenderbuffers=env._glGenRenderbuffers;
  var __emval_register=env.__emval_register;
  var RegisteredPointer_getPointee=env.RegisteredPointer_getPointee;
  var _glGetUniformLocation=env._glGetUniformLocation;
  var _strerror=env._strerror;
  var __embind_register_std_wstring=env.__embind_register_std_wstring;
  var getStringOrSymbol=env.getStringOrSymbol;
  var _embind_repr=env._embind_repr;
  var _glRenderbufferStorage=env._glRenderbufferStorage;
  var __emval_incref=env.__emval_incref;
  var RegisteredPointer=env.RegisteredPointer;
  var _glBindAttribLocation=env._glBindAttribLocation;
  var _glGetShaderiv=env._glGetShaderiv;
  var readLatin1String=env.readLatin1String;
  var getBasestPointer=env.getBasestPointer;
  var getInheritedInstanceCount=env.getInheritedInstanceCount;
  var __embind_register_float=env.__embind_register_float;
  var integerReadValueFromPointer=env.integerReadValueFromPointer;
  var _glFramebufferTexture2D=env._glFramebufferTexture2D;
  var _emscripten_set_main_loop=env._emscripten_set_main_loop;
  var ___errno_location=env.___errno_location;
  var _pthread_setspecific=env._pthread_setspecific;
  var genericPointerToWireType=env.genericPointerToWireType;
  var _fputc=env._fputc;
  var ___cxa_throw=env.___cxa_throw;
  var count_emval_handles=env.count_emval_handles;
  var requireFunction=env.requireFunction;
  var _glTexParameteri=env._glTexParameteri;
  var __formatString=env.__formatString;
  var _fputs=env._fputs;
  var tempFloat = Math_fround(0);
  const f0 = Math_fround(0);

function _emscripten_replace_memory(newBuffer) {
  if ((byteLength(newBuffer) & 0xffffff || byteLength(newBuffer) <= 0xffffff) || byteLength(newBuffer) > 0x80000000) return false;
  HEAP8 = new Int8View(newBuffer);
  HEAP16 = new Int16View(newBuffer);
  HEAP32 = new Int32View(newBuffer);
  HEAPU8 = new Uint8View(newBuffer);
  HEAPU16 = new Uint16View(newBuffer);
  HEAPU32 = new Uint32View(newBuffer);
  HEAPF32 = new Float32View(newBuffer);
  HEAPF64 = new Float64View(newBuffer);
  buffer = newBuffer;
  return true;
}

// EMSCRIPTEN_START_FUNCS

function _printf_core(i85, i6, i101, i102, i103) {
 i85 = i85 | 0;
 i6 = i6 | 0;
 i101 = i101 | 0;
 i102 = i102 | 0;
 i103 = i103 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i7 = 0, d8 = 0.0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, d14 = 0.0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, i42 = 0, i43 = 0, i44 = 0, i45 = 0, i46 = 0, i47 = 0, i48 = 0, i49 = 0, i50 = 0, i51 = 0, i52 = 0, i53 = 0, i54 = 0, i55 = 0, i56 = 0, i57 = 0, i58 = 0, i59 = 0, i60 = 0, i61 = 0, i62 = 0, i63 = 0, i64 = 0, i65 = 0, i66 = 0, i67 = 0, i68 = 0, i69 = 0, i70 = 0, i71 = 0, i72 = 0, i73 = 0, i74 = 0, i75 = 0, i76 = 0, i77 = 0, i78 = 0, i79 = 0, i80 = 0, i81 = 0, i82 = 0, i83 = 0, i84 = 0, i86 = 0, i87 = 0, i88 = 0, i89 = 0, i90 = 0, i91 = 0, i92 = 0, i93 = 0, i94 = 0, i95 = 0, i96 = 0, i97 = 0, i98 = 0, i99 = 0, i100 = 0, i104 = 0;
 i104 = STACKTOP;
 STACKTOP = STACKTOP + 864 | 0;
 i81 = i104 + 16 | 0;
 i84 = i104 + 8 | 0;
 i82 = i104 + 560 | 0;
 i54 = i82;
 i78 = i104 + 840 | 0;
 i92 = i104 + 584 | 0;
 i74 = i104 + 520 | 0;
 i98 = i104;
 i89 = i104 + 852 | 0;
 i55 = (i85 | 0) != 0;
 i68 = i74 + 40 | 0;
 i71 = i68;
 i74 = i74 + 39 | 0;
 i75 = i98 + 4 | 0;
 i76 = i98;
 i77 = i78 + 12 | 0;
 i78 = i78 + 11 | 0;
 i79 = i77;
 i56 = i79 - i54 | 0;
 i57 = -2 - i54 | 0;
 i63 = i79 + 2 | 0;
 i64 = i81 + 288 | 0;
 i65 = i82 + 9 | 0;
 i66 = i65;
 i67 = i82 + 8 | 0;
 i22 = 0;
 i20 = 0;
 i10 = 0;
 i5 = 0;
 i11 = 0;
 L1 : while (1) {
  do if ((i10 | 0) > -1) if ((i5 | 0) > (2147483647 - i10 | 0)) {
   i43 = ___errno_location() | 0;
   HEAP32[i43 >> 2] = 75;
   i43 = -1;
   break;
  } else {
   i43 = i5 + i10 | 0;
   break;
  } else i43 = i10; while (0);
  i5 = HEAP8[i6 >> 0] | 0;
  if (!(i5 << 24 >> 24)) {
   i83 = i43;
   i88 = i11;
   i30 = 344;
   break;
  } else i4 = i6;
  while (1) {
   if (!(i5 << 24 >> 24)) {
    i52 = i4;
    i47 = i4;
    break;
   } else if (i5 << 24 >> 24 == 37) {
    i87 = i4;
    i99 = i4;
    i30 = 9;
    break;
   }
   i29 = i4 + 1 | 0;
   i5 = HEAP8[i29 >> 0] | 0;
   i4 = i29;
  }
  L12 : do if ((i30 | 0) == 9) while (1) {
   i30 = 0;
   if ((HEAP8[i87 + 1 >> 0] | 0) != 37) {
    i52 = i87;
    i47 = i99;
    break L12;
   }
   i4 = i99 + 1 | 0;
   i5 = i87 + 2 | 0;
   if ((HEAP8[i5 >> 0] | 0) == 37) {
    i87 = i5;
    i99 = i4;
   } else {
    i52 = i5;
    i47 = i4;
    break;
   }
  } while (0);
  i5 = i47 - i6 | 0;
  if (i55) ___fwritex(i6, i5, i85) | 0;
  if ((i47 | 0) != (i6 | 0)) {
   i10 = i43;
   i6 = i52;
   continue;
  }
  i9 = i52 + 1 | 0;
  i7 = HEAP8[i9 >> 0] | 0;
  i4 = (i7 << 24 >> 24) + -48 | 0;
  if (i4 >>> 0 < 10) {
   i29 = (HEAP8[i52 + 2 >> 0] | 0) == 36;
   i9 = i29 ? i52 + 3 | 0 : i9;
   i7 = HEAP8[i9 >> 0] | 0;
   i21 = i29 ? i4 : -1;
   i11 = i29 ? 1 : i11;
  } else i21 = -1;
  i4 = i7 << 24 >> 24;
  L24 : do if ((i4 & -32 | 0) == 32) {
   i10 = 0;
   do {
    if (!(1 << i4 + -32 & 75913)) break L24;
    i10 = 1 << (i7 << 24 >> 24) + -32 | i10;
    i9 = i9 + 1 | 0;
    i7 = HEAP8[i9 >> 0] | 0;
    i4 = i7 << 24 >> 24;
   } while ((i4 & -32 | 0) == 32);
  } else i10 = 0; while (0);
  do if (i7 << 24 >> 24 == 42) {
   i4 = i9 + 1 | 0;
   i7 = (HEAP8[i4 >> 0] | 0) + -48 | 0;
   if (i7 >>> 0 < 10 ? (HEAP8[i9 + 2 >> 0] | 0) == 36 : 0) {
    HEAP32[i103 + (i7 << 2) >> 2] = 10;
    i11 = 1;
    i7 = i9 + 3 | 0;
    i9 = HEAP32[i102 + ((HEAP8[i4 >> 0] | 0) + -48 << 3) >> 2] | 0;
   } else {
    if (i11) {
     i100 = -1;
     i30 = 363;
     break L1;
    }
    if (!i55) {
     i7 = i4;
     i11 = 0;
     i28 = 0;
     break;
    }
    i11 = (HEAP32[i101 >> 2] | 0) + (4 - 1) & ~(4 - 1);
    i9 = HEAP32[i11 >> 2] | 0;
    HEAP32[i101 >> 2] = i11 + 4;
    i11 = 0;
    i7 = i4;
   }
   if ((i9 | 0) < 0) {
    i10 = i10 | 8192;
    i28 = 0 - i9 | 0;
   } else i28 = i9;
  } else {
   i4 = (i7 << 24 >> 24) + -48 | 0;
   if (i4 >>> 0 < 10) {
    i7 = i9;
    i9 = 0;
    do {
     i9 = (i9 * 10 | 0) + i4 | 0;
     i7 = i7 + 1 | 0;
     i4 = (HEAP8[i7 >> 0] | 0) + -48 | 0;
    } while (i4 >>> 0 < 10);
    if ((i9 | 0) < 0) {
     i100 = -1;
     i30 = 363;
     break L1;
    } else i28 = i9;
   } else {
    i7 = i9;
    i28 = 0;
   }
  } while (0);
  L45 : do if ((HEAP8[i7 >> 0] | 0) == 46) {
   i9 = i7 + 1 | 0;
   i4 = HEAP8[i9 >> 0] | 0;
   if (i4 << 24 >> 24 != 42) {
    i4 = (i4 << 24 >> 24) + -48 | 0;
    if (i4 >>> 0 < 10) {
     i7 = i9;
     i9 = 0;
    } else {
     i7 = i9;
     i15 = 0;
     break;
    }
    while (1) {
     i9 = (i9 * 10 | 0) + i4 | 0;
     i7 = i7 + 1 | 0;
     i4 = (HEAP8[i7 >> 0] | 0) + -48 | 0;
     if (i4 >>> 0 >= 10) {
      i15 = i9;
      break L45;
     }
    }
   }
   i4 = i7 + 2 | 0;
   i9 = (HEAP8[i4 >> 0] | 0) + -48 | 0;
   if (i9 >>> 0 < 10 ? (HEAP8[i7 + 3 >> 0] | 0) == 36 : 0) {
    HEAP32[i103 + (i9 << 2) >> 2] = 10;
    i7 = i7 + 4 | 0;
    i15 = HEAP32[i102 + ((HEAP8[i4 >> 0] | 0) + -48 << 3) >> 2] | 0;
    break;
   }
   if (i11) {
    i100 = -1;
    i30 = 363;
    break L1;
   }
   if (i55) {
    i7 = (HEAP32[i101 >> 2] | 0) + (4 - 1) & ~(4 - 1);
    i15 = HEAP32[i7 >> 2] | 0;
    HEAP32[i101 >> 2] = i7 + 4;
    i7 = i4;
   } else {
    i7 = i4;
    i15 = 0;
   }
  } else i15 = -1; while (0);
  i13 = 0;
  while (1) {
   i9 = (HEAP8[i7 >> 0] | 0) + -65 | 0;
   if (i9 >>> 0 > 57) {
    i100 = -1;
    i30 = 363;
    break L1;
   }
   i4 = i7 + 1 | 0;
   i9 = HEAP8[6728 + (i13 * 58 | 0) + i9 >> 0] | 0;
   i12 = i9 & 255;
   if ((i12 + -1 | 0) >>> 0 < 8) {
    i7 = i4;
    i13 = i12;
   } else {
    i29 = i4;
    break;
   }
  }
  if (!(i9 << 24 >> 24)) {
   i100 = -1;
   i30 = 363;
   break;
  }
  i4 = (i21 | 0) > -1;
  L64 : do if (i9 << 24 >> 24 == 19) if (i4) {
   i100 = -1;
   i30 = 363;
   break L1;
  } else {
   i58 = i22;
   i59 = i20;
   i30 = 62;
  } else {
   if (i4) {
    HEAP32[i103 + (i21 << 2) >> 2] = i12;
    i59 = i102 + (i21 << 3) | 0;
    i58 = HEAP32[i59 + 4 >> 2] | 0;
    i59 = HEAP32[i59 >> 2] | 0;
    i30 = 62;
    break;
   }
   if (!i55) {
    i100 = 0;
    i30 = 363;
    break L1;
   }
   if ((i9 & 255) > 20) {
    i69 = i20;
    i70 = i22;
   } else do switch (i12 | 0) {
   case 13:
    {
     i69 = (HEAP32[i101 >> 2] | 0) + (4 - 1) & ~(4 - 1);
     i70 = HEAP32[i69 >> 2] | 0;
     HEAP32[i101 >> 2] = i69 + 4;
     i69 = i70 << 16 >> 16;
     i70 = (((i70 & 65535) << 16 >> 16 | 0) < 0) << 31 >> 31;
     break L64;
    }
   case 15:
    {
     i69 = (HEAP32[i101 >> 2] | 0) + (4 - 1) & ~(4 - 1);
     i70 = HEAP32[i69 >> 2] | 0;
     HEAP32[i101 >> 2] = i69 + 4;
     i69 = i70 << 24 >> 24;
     i70 = (((i70 & 255) << 24 >> 24 | 0) < 0) << 31 >> 31;
     break L64;
    }
   case 18:
    {
     i69 = (HEAP32[i101 >> 2] | 0) + (8 - 1) & ~(8 - 1);
     d14 = +HEAPF64[i69 >> 3];
     HEAP32[i101 >> 2] = i69 + 8;
     HEAPF64[tempDoublePtr >> 3] = d14;
     i69 = HEAP32[tempDoublePtr >> 2] | 0;
     i70 = HEAP32[tempDoublePtr + 4 >> 2] | 0;
     break L64;
    }
   case 17:
    {
     i69 = (HEAP32[i101 >> 2] | 0) + (8 - 1) & ~(8 - 1);
     d14 = +HEAPF64[i69 >> 3];
     HEAP32[i101 >> 2] = i69 + 8;
     HEAPF64[tempDoublePtr >> 3] = d14;
     i69 = HEAP32[tempDoublePtr >> 2] | 0;
     i70 = HEAP32[tempDoublePtr + 4 >> 2] | 0;
     break L64;
    }
   case 11:
    {
     i70 = (HEAP32[i101 >> 2] | 0) + (4 - 1) & ~(4 - 1);
     i69 = HEAP32[i70 >> 2] | 0;
     HEAP32[i101 >> 2] = i70 + 4;
     i70 = 0;
     break L64;
    }
   case 9:
    {
     i70 = (HEAP32[i101 >> 2] | 0) + (4 - 1) & ~(4 - 1);
     i69 = HEAP32[i70 >> 2] | 0;
     HEAP32[i101 >> 2] = i70 + 4;
     i70 = i22;
     break L64;
    }
   case 10:
    {
     i69 = (HEAP32[i101 >> 2] | 0) + (4 - 1) & ~(4 - 1);
     i70 = HEAP32[i69 >> 2] | 0;
     HEAP32[i101 >> 2] = i69 + 4;
     i69 = i70;
     i70 = ((i70 | 0) < 0) << 31 >> 31;
     break L64;
    }
   case 14:
    {
     i70 = (HEAP32[i101 >> 2] | 0) + (4 - 1) & ~(4 - 1);
     i69 = HEAP32[i70 >> 2] | 0;
     HEAP32[i101 >> 2] = i70 + 4;
     i69 = i69 & 65535;
     i70 = 0;
     break L64;
    }
   case 16:
    {
     i70 = (HEAP32[i101 >> 2] | 0) + (4 - 1) & ~(4 - 1);
     i69 = HEAP32[i70 >> 2] | 0;
     HEAP32[i101 >> 2] = i70 + 4;
     i69 = i69 & 255;
     i70 = 0;
     break L64;
    }
   case 12:
    {
     i27 = (HEAP32[i101 >> 2] | 0) + (8 - 1) & ~(8 - 1);
     i70 = i27;
     i69 = HEAP32[i70 >> 2] | 0;
     i70 = HEAP32[i70 + 4 >> 2] | 0;
     HEAP32[i101 >> 2] = i27 + 8;
     break L64;
    }
   default:
    {
     i69 = i20;
     i70 = i22;
     break L64;
    }
   } while (0);
  } while (0);
  if ((i30 | 0) == 62) {
   i30 = 0;
   if (i55) {
    i69 = i59;
    i70 = i58;
   } else {
    i22 = i58;
    i20 = i59;
    i10 = i43;
    i6 = i29;
    continue;
   }
  }
  i23 = HEAP8[i7 >> 0] | 0;
  i23 = (i13 | 0) != 0 & (i23 & 15 | 0) == 3 ? i23 & -33 : i23;
  i9 = i10 & -65537;
  i27 = (i10 & 8192 | 0) == 0 ? i10 : i9;
  L86 : do switch (i23 | 0) {
  case 112:
   {
    i86 = i27 | 8;
    i90 = i15 >>> 0 > 8 ? i15 : 8;
    i97 = 120;
    i30 = 73;
    break;
   }
  case 88:
  case 120:
   {
    i86 = i27;
    i90 = i15;
    i97 = i23;
    i30 = 73;
    break;
   }
  case 99:
   {
    HEAP8[i74 >> 0] = i69;
    i49 = i70;
    i50 = i69;
    i51 = i74;
    i2 = i9;
    i44 = 1;
    i45 = 0;
    i46 = 7208;
    i48 = i68;
    break;
   }
  case 109:
   {
    i80 = ___errno_location() | 0;
    i80 = _strerror(HEAP32[i80 >> 2] | 0) | 0;
    i30 = 94;
    break;
   }
  case 115:
   {
    i80 = (i69 | 0) != 0 ? i69 : 7224;
    i30 = 94;
    break;
   }
  case 67:
   {
    HEAP32[i98 >> 2] = i69;
    HEAP32[i75 >> 2] = 0;
    i60 = i98;
    i61 = i76;
    i91 = -1;
    i30 = 97;
    break;
   }
  case 83:
   {
    i6 = i69;
    if (!i15) {
     i41 = i69;
     i42 = i6;
     i40 = 0;
     i30 = 102;
    } else {
     i60 = i6;
     i61 = i69;
     i91 = i15;
     i30 = 97;
    }
    break;
   }
  case 65:
  case 71:
  case 70:
  case 69:
  case 97:
  case 103:
  case 102:
  case 101:
   {
    HEAP32[tempDoublePtr >> 2] = i69;
    HEAP32[tempDoublePtr + 4 >> 2] = i70;
    d8 = +HEAPF64[tempDoublePtr >> 3];
    HEAP32[i84 >> 2] = 0;
    if ((i70 | 0) >= 0) if (!(i27 & 2048)) {
     i25 = i27 & 1;
     i24 = i25;
     i25 = (i25 | 0) == 0 ? 7233 : 7238;
    } else {
     i24 = 1;
     i25 = 7235;
    } else {
     d8 = -d8;
     i24 = 1;
     i25 = 7232;
    }
    HEAPF64[tempDoublePtr >> 3] = d8;
    i26 = HEAP32[tempDoublePtr + 4 >> 2] & 2146435072;
    do if (i26 >>> 0 < 2146435072 | (i26 | 0) == 2146435072 & 0 < 0) {
     d14 = +_frexpl(d8, i84) * 2.0;
     i9 = d14 != 0.0;
     if (i9) HEAP32[i84 >> 2] = (HEAP32[i84 >> 2] | 0) + -1;
     i22 = i23 | 32;
     if ((i22 | 0) == 97) {
      i16 = i23 & 32;
      i18 = (i16 | 0) == 0 ? i25 : i25 + 9 | 0;
      i19 = i24 | 2;
      i9 = 12 - i15 | 0;
      do if (!(i15 >>> 0 > 11 | (i9 | 0) == 0)) {
       d8 = 8.0;
       do {
        i9 = i9 + -1 | 0;
        d8 = d8 * 16.0;
       } while ((i9 | 0) != 0);
       if ((HEAP8[i18 >> 0] | 0) == 45) {
        d8 = -(d8 + (-d14 - d8));
        break;
       } else {
        d8 = d14 + d8 - d8;
        break;
       }
      } else d8 = d14; while (0);
      i9 = HEAP32[i84 >> 2] | 0;
      i9 = (i9 | 0) < 0 ? 0 - i9 | 0 : i9;
      if ((i9 | 0) < 0) {
       i7 = i77;
       i6 = i9;
       i10 = ((i9 | 0) < 0) << 31 >> 31;
       while (1) {
        i9 = ___uremdi3(i6 | 0, i10 | 0, 10, 0) | 0;
        i7 = i7 + -1 | 0;
        HEAP8[i7 >> 0] = i9 | 48;
        i9 = ___udivdi3(i6 | 0, i10 | 0, 10, 0) | 0;
        if (i10 >>> 0 > 9 | (i10 | 0) == 9 & i6 >>> 0 > 4294967295) {
         i6 = i9;
         i10 = tempRet0;
        } else break;
       }
      } else i7 = i77;
      if (i9) while (1) {
       i7 = i7 + -1 | 0;
       HEAP8[i7 >> 0] = (i9 >>> 0) % 10 | 0 | 48;
       if (i9 >>> 0 < 10) break; else i9 = (i9 >>> 0) / 10 | 0;
      }
      if ((i7 | 0) == (i77 | 0)) {
       HEAP8[i78 >> 0] = 48;
       i7 = i78;
      }
      HEAP8[i7 + -1 >> 0] = (HEAP32[i84 >> 2] >> 31 & 2) + 43;
      i17 = i7 + -2 | 0;
      HEAP8[i17 >> 0] = i23 + 15;
      if (!(i27 & 8)) if ((i15 | 0) < 1) {
       i7 = i82;
       do {
        i26 = ~~d8;
        i9 = i7 + 1 | 0;
        HEAP8[i7 >> 0] = HEAPU8[7192 + i26 >> 0] | i16;
        d8 = (d8 - +(i26 | 0)) * 16.0;
        if ((i9 - i54 | 0) != 1 | d8 == 0.0) i7 = i9; else {
         HEAP8[i9 >> 0] = 46;
         i7 = i7 + 2 | 0;
        }
       } while (d8 != 0.0);
      } else {
       i7 = i82;
       do {
        i26 = ~~d8;
        i9 = i7 + 1 | 0;
        HEAP8[i7 >> 0] = HEAPU8[7192 + i26 >> 0] | i16;
        d8 = (d8 - +(i26 | 0)) * 16.0;
        if ((i9 - i54 | 0) == 1) {
         HEAP8[i9 >> 0] = 46;
         i7 = i7 + 2 | 0;
        } else i7 = i9;
       } while (d8 != 0.0);
      } else {
       i7 = i82;
       do {
        i26 = ~~d8;
        i9 = i7 + 1 | 0;
        HEAP8[i7 >> 0] = HEAPU8[7192 + i26 >> 0] | i16;
        d8 = (d8 - +(i26 | 0)) * 16.0;
        if ((i9 - i54 | 0) == 1) {
         HEAP8[i9 >> 0] = 46;
         i7 = i7 + 2 | 0;
        } else i7 = i9;
       } while (d8 != 0.0);
      }
      i13 = (i15 | 0) != 0 & (i57 + i7 | 0) < (i15 | 0) ? i63 + i15 - i17 | 0 : i56 - i17 + i7 | 0;
      i12 = i13 + i19 | 0;
      i10 = i27 & 73728;
      i4 = (i28 | 0) > (i12 | 0);
      if ((i10 | 0) == 0 & i4) {
       i9 = i28 - i12 | 0;
       _memset(i92 | 0, 32, (i9 >>> 0 > 256 ? 256 : i9) | 0) | 0;
       if (i9 >>> 0 > 255) {
        i6 = i9;
        do {
         ___fwritex(i92, 256, i85) | 0;
         i6 = i6 + -256 | 0;
        } while (i6 >>> 0 > 255);
        i9 = i9 & 255;
       }
       ___fwritex(i92, i9, i85) | 0;
      }
      ___fwritex(i18, i19, i85) | 0;
      if ((i10 | 0) == 65536 & i4) {
       i6 = i28 - i12 | 0;
       _memset(i92 | 0, 48, (i6 >>> 0 > 256 ? 256 : i6) | 0) | 0;
       if (i6 >>> 0 > 255) {
        i5 = i6;
        do {
         ___fwritex(i92, 256, i85) | 0;
         i5 = i5 + -256 | 0;
        } while (i5 >>> 0 > 255);
        i6 = i6 & 255;
       }
       ___fwritex(i92, i6, i85) | 0;
      }
      i7 = i7 - i54 | 0;
      ___fwritex(i82, i7, i85) | 0;
      i9 = i79 - i17 | 0;
      i7 = i13 - i9 - i7 | 0;
      if ((i7 | 0) > 0) {
       _memset(i92 | 0, 48, (i7 >>> 0 > 256 ? 256 : i7) | 0) | 0;
       if (i7 >>> 0 > 255) {
        i6 = i7;
        do {
         ___fwritex(i92, 256, i85) | 0;
         i6 = i6 + -256 | 0;
        } while (i6 >>> 0 > 255);
        i7 = i7 & 255;
       }
       ___fwritex(i92, i7, i85) | 0;
      }
      ___fwritex(i17, i9, i85) | 0;
      if ((i10 | 0) == 8192 & i4) {
       i6 = i28 - i12 | 0;
       _memset(i92 | 0, 32, (i6 >>> 0 > 256 ? 256 : i6) | 0) | 0;
       if (i6 >>> 0 > 255) {
        i7 = i6;
        do {
         ___fwritex(i92, 256, i85) | 0;
         i7 = i7 + -256 | 0;
        } while (i7 >>> 0 > 255);
        i6 = i6 & 255;
       }
       ___fwritex(i92, i6, i85) | 0;
      }
      i5 = i4 ? i28 : i12;
      break;
     }
     i7 = (i15 | 0) < 0 ? 6 : i15;
     if (i9) {
      i9 = (HEAP32[i84 >> 2] | 0) + -28 | 0;
      HEAP32[i84 >> 2] = i9;
      d8 = d14 * 268435456.0;
     } else {
      d8 = d14;
      i9 = HEAP32[i84 >> 2] | 0;
     }
     i26 = (i9 | 0) < 0 ? i81 : i64;
     i20 = i26;
     i10 = i26;
     do {
      i21 = ~~d8 >>> 0;
      HEAP32[i10 >> 2] = i21;
      i10 = i10 + 4 | 0;
      d8 = (d8 - +(i21 >>> 0)) * 1.0e9;
     } while (d8 != 0.0);
     i9 = HEAP32[i84 >> 2] | 0;
     if ((i9 | 0) > 0) {
      i6 = i9;
      i9 = i26;
      do {
       i13 = (i6 | 0) > 29 ? 29 : i6;
       i5 = i10 + -4 | 0;
       do if (i5 >>> 0 >= i9 >>> 0) {
        i6 = 0;
        do {
         i21 = _bitshift64Shl(HEAP32[i5 >> 2] | 0, 0, i13 | 0) | 0;
         i21 = _i64Add(i21 | 0, tempRet0 | 0, i6 | 0, 0) | 0;
         i6 = tempRet0;
         i19 = ___uremdi3(i21 | 0, i6 | 0, 1e9, 0) | 0;
         HEAP32[i5 >> 2] = i19;
         i6 = ___udivdi3(i21 | 0, i6 | 0, 1e9, 0) | 0;
         i5 = i5 + -4 | 0;
        } while (i5 >>> 0 >= i9 >>> 0);
        if (!i6) break;
        i9 = i9 + -4 | 0;
        HEAP32[i9 >> 2] = i6;
       } while (0);
       while (1) {
        if (i10 >>> 0 <= i9 >>> 0) break;
        i6 = i10 + -4 | 0;
        if (!(HEAP32[i6 >> 2] | 0)) i10 = i6; else break;
       }
       i6 = (HEAP32[i84 >> 2] | 0) - i13 | 0;
       HEAP32[i84 >> 2] = i6;
      } while ((i6 | 0) > 0);
     } else {
      i6 = i9;
      i9 = i26;
     }
     L218 : do if ((i6 | 0) < 0) {
      i17 = ((i7 + 25 | 0) / 9 | 0) + 1 | 0;
      if ((i22 | 0) != 102) while (1) {
       i12 = 0 - i6 | 0;
       i12 = (i12 | 0) > 9 ? 9 : i12;
       do if (i9 >>> 0 < i10 >>> 0) {
        i13 = (1 << i12) + -1 | 0;
        i5 = 1e9 >>> i12;
        i6 = 0;
        i4 = i9;
        do {
         i21 = HEAP32[i4 >> 2] | 0;
         HEAP32[i4 >> 2] = (i21 >>> i12) + i6;
         i6 = Math_imul(i21 & i13, i5) | 0;
         i4 = i4 + 4 | 0;
        } while (i4 >>> 0 < i10 >>> 0);
        i9 = (HEAP32[i9 >> 2] | 0) == 0 ? i9 + 4 | 0 : i9;
        if (!i6) break;
        HEAP32[i10 >> 2] = i6;
        i10 = i10 + 4 | 0;
       } else i9 = (HEAP32[i9 >> 2] | 0) == 0 ? i9 + 4 | 0 : i9; while (0);
       i10 = (i10 - i9 >> 2 | 0) > (i17 | 0) ? i9 + (i17 << 2) | 0 : i10;
       i6 = (HEAP32[i84 >> 2] | 0) + i12 | 0;
       HEAP32[i84 >> 2] = i6;
       if ((i6 | 0) >= 0) break L218;
      }
      i15 = i26 + (i17 << 2) | 0;
      do {
       i12 = 0 - i6 | 0;
       i12 = (i12 | 0) > 9 ? 9 : i12;
       do if (i9 >>> 0 < i10 >>> 0) {
        i13 = (1 << i12) + -1 | 0;
        i5 = 1e9 >>> i12;
        i6 = 0;
        i4 = i9;
        do {
         i21 = HEAP32[i4 >> 2] | 0;
         HEAP32[i4 >> 2] = (i21 >>> i12) + i6;
         i6 = Math_imul(i21 & i13, i5) | 0;
         i4 = i4 + 4 | 0;
        } while (i4 >>> 0 < i10 >>> 0);
        i9 = (HEAP32[i9 >> 2] | 0) == 0 ? i9 + 4 | 0 : i9;
        if (!i6) break;
        HEAP32[i10 >> 2] = i6;
        i10 = i10 + 4 | 0;
       } else i9 = (HEAP32[i9 >> 2] | 0) == 0 ? i9 + 4 | 0 : i9; while (0);
       i10 = (i10 - i20 >> 2 | 0) > (i17 | 0) ? i15 : i10;
       i6 = (HEAP32[i84 >> 2] | 0) + i12 | 0;
       HEAP32[i84 >> 2] = i6;
      } while ((i6 | 0) < 0);
     } while (0);
     do if (i9 >>> 0 < i10 >>> 0) {
      i6 = (i20 - i9 >> 2) * 9 | 0;
      i4 = HEAP32[i9 >> 2] | 0;
      if (i4 >>> 0 < 10) {
       i16 = i6;
       break;
      } else i5 = 10;
      do {
       i5 = i5 * 10 | 0;
       i6 = i6 + 1 | 0;
      } while (i4 >>> 0 >= i5 >>> 0);
      i16 = i6;
     } else i16 = 0; while (0);
     i19 = (i22 | 0) == 103;
     i18 = (i7 | 0) != 0;
     i6 = i7 - ((i22 | 0) != 102 ? i16 : 0) + ((i18 & i19) << 31 >> 31) | 0;
     if ((i6 | 0) < (((i10 - i20 >> 2) * 9 | 0) + -9 | 0)) {
      i5 = i6 + 9216 | 0;
      i15 = (i5 | 0) / 9 | 0;
      i6 = i26 + (i15 + -1023 << 2) | 0;
      i5 = ((i5 | 0) % 9 | 0) + 1 | 0;
      if ((i5 | 0) < 9) {
       i13 = 10;
       do {
        i13 = i13 * 10 | 0;
        i5 = i5 + 1 | 0;
       } while ((i5 | 0) != 9);
      } else i13 = 10;
      i4 = HEAP32[i6 >> 2] | 0;
      i12 = (i4 >>> 0) % (i13 >>> 0) | 0;
      if ((i12 | 0) == 0 ? (i26 + (i15 + -1022 << 2) | 0) == (i10 | 0) : 0) {
       i39 = i9;
       i38 = i6;
       i37 = i16;
      } else i30 = 221;
      do if ((i30 | 0) == 221) {
       i30 = 0;
       d14 = (((i4 >>> 0) / (i13 >>> 0) | 0) & 1 | 0) == 0 ? 9007199254740992.0 : 9007199254740994.0;
       i5 = (i13 | 0) / 2 | 0;
       do if (i12 >>> 0 < i5 >>> 0) d8 = .5; else {
        if ((i12 | 0) == (i5 | 0) ? (i26 + (i15 + -1022 << 2) | 0) == (i10 | 0) : 0) {
         d8 = 1.0;
         break;
        }
        d8 = 1.5;
       } while (0);
       do if (i24) {
        if ((HEAP8[i25 >> 0] | 0) != 45) break;
        d14 = -d14;
        d8 = -d8;
       } while (0);
       i5 = i4 - i12 | 0;
       HEAP32[i6 >> 2] = i5;
       if (!(d14 + d8 != d14)) {
        i39 = i9;
        i38 = i6;
        i37 = i16;
        break;
       }
       i39 = i5 + i13 | 0;
       HEAP32[i6 >> 2] = i39;
       if (i39 >>> 0 > 999999999) while (1) {
        i5 = i6 + -4 | 0;
        HEAP32[i6 >> 2] = 0;
        if (i5 >>> 0 < i9 >>> 0) {
         i9 = i9 + -4 | 0;
         HEAP32[i9 >> 2] = 0;
        }
        i39 = (HEAP32[i5 >> 2] | 0) + 1 | 0;
        HEAP32[i5 >> 2] = i39;
        if (i39 >>> 0 > 999999999) i6 = i5; else {
         i6 = i5;
         break;
        }
       }
       i5 = (i20 - i9 >> 2) * 9 | 0;
       i12 = HEAP32[i9 >> 2] | 0;
       if (i12 >>> 0 < 10) {
        i39 = i9;
        i38 = i6;
        i37 = i5;
        break;
       } else i4 = 10;
       do {
        i4 = i4 * 10 | 0;
        i5 = i5 + 1 | 0;
       } while (i12 >>> 0 >= i4 >>> 0);
       i39 = i9;
       i38 = i6;
       i37 = i5;
      } while (0);
      i22 = i38 + 4 | 0;
      i9 = i39;
      i16 = i37;
      i10 = i10 >>> 0 > i22 >>> 0 ? i22 : i10;
     }
     i15 = 0 - i16 | 0;
     while (1) {
      if (i10 >>> 0 <= i9 >>> 0) {
       i21 = 0;
       break;
      }
      i6 = i10 + -4 | 0;
      if (!(HEAP32[i6 >> 2] | 0)) i10 = i6; else {
       i21 = 1;
       break;
      }
     }
     do if (i19) {
      i7 = (i18 & 1 ^ 1) + i7 | 0;
      if ((i7 | 0) > (i16 | 0) & (i16 | 0) > -5) {
       i4 = i23 + -1 | 0;
       i7 = i7 + -1 - i16 | 0;
      } else {
       i4 = i23 + -2 | 0;
       i7 = i7 + -1 | 0;
      }
      i6 = i27 & 8;
      if (i6) {
       i19 = i6;
       break;
      }
      do if (i21) {
       i13 = HEAP32[i10 + -4 >> 2] | 0;
       if (!i13) {
        i5 = 9;
        break;
       }
       if (!((i13 >>> 0) % 10 | 0)) {
        i6 = 10;
        i5 = 0;
       } else {
        i5 = 0;
        break;
       }
       do {
        i6 = i6 * 10 | 0;
        i5 = i5 + 1 | 0;
       } while (((i13 >>> 0) % (i6 >>> 0) | 0 | 0) == 0);
      } else i5 = 9; while (0);
      i6 = ((i10 - i20 >> 2) * 9 | 0) + -9 | 0;
      if ((i4 | 32 | 0) == 102) {
       i19 = i6 - i5 | 0;
       i19 = (i19 | 0) < 0 ? 0 : i19;
       i7 = (i7 | 0) < (i19 | 0) ? i7 : i19;
       i19 = 0;
       break;
      } else {
       i19 = i6 + i16 - i5 | 0;
       i19 = (i19 | 0) < 0 ? 0 : i19;
       i7 = (i7 | 0) < (i19 | 0) ? i7 : i19;
       i19 = 0;
       break;
      }
     } else {
      i4 = i23;
      i19 = i27 & 8;
     } while (0);
     i20 = i7 | i19;
     i17 = (i20 | 0) != 0 & 1;
     i18 = (i4 | 32 | 0) == 102;
     if (i18) {
      i6 = (i16 | 0) > 0 ? i16 : 0;
      i16 = 0;
     } else {
      i13 = (i16 | 0) < 0 ? i15 : i16;
      if ((i13 | 0) < 0) {
       i6 = i77;
       i12 = i13;
       i5 = ((i13 | 0) < 0) << 31 >> 31;
       while (1) {
        i13 = ___uremdi3(i12 | 0, i5 | 0, 10, 0) | 0;
        i6 = i6 + -1 | 0;
        HEAP8[i6 >> 0] = i13 | 48;
        i13 = ___udivdi3(i12 | 0, i5 | 0, 10, 0) | 0;
        if (i5 >>> 0 > 9 | (i5 | 0) == 9 & i12 >>> 0 > 4294967295) {
         i12 = i13;
         i5 = tempRet0;
        } else break;
       }
      } else i6 = i77;
      if (i13) while (1) {
       i6 = i6 + -1 | 0;
       HEAP8[i6 >> 0] = (i13 >>> 0) % 10 | 0 | 48;
       if (i13 >>> 0 < 10) break; else i13 = (i13 >>> 0) / 10 | 0;
      }
      if ((i79 - i6 | 0) < 2) do {
       i6 = i6 + -1 | 0;
       HEAP8[i6 >> 0] = 48;
      } while ((i79 - i6 | 0) < 2);
      HEAP8[i6 + -1 >> 0] = (i16 >> 31 & 2) + 43;
      i16 = i6 + -2 | 0;
      HEAP8[i16 >> 0] = i4;
      i6 = i79 - i16 | 0;
     }
     i22 = i24 + 1 + i7 + i17 + i6 | 0;
     i17 = i27 & 73728;
     i15 = (i28 | 0) > (i22 | 0);
     if ((i17 | 0) == 0 & i15) {
      i6 = i28 - i22 | 0;
      _memset(i92 | 0, 32, (i6 >>> 0 > 256 ? 256 : i6) | 0) | 0;
      if (i6 >>> 0 > 255) {
       i13 = i6;
       do {
        ___fwritex(i92, 256, i85) | 0;
        i13 = i13 + -256 | 0;
       } while (i13 >>> 0 > 255);
       i6 = i6 & 255;
      }
      ___fwritex(i92, i6, i85) | 0;
     }
     ___fwritex(i25, i24, i85) | 0;
     if ((i17 | 0) == 65536 & i15) {
      i6 = i28 - i22 | 0;
      _memset(i92 | 0, 48, (i6 >>> 0 > 256 ? 256 : i6) | 0) | 0;
      if (i6 >>> 0 > 255) {
       i5 = i6;
       do {
        ___fwritex(i92, 256, i85) | 0;
        i5 = i5 + -256 | 0;
       } while (i5 >>> 0 > 255);
       i6 = i6 & 255;
      }
      ___fwritex(i92, i6, i85) | 0;
     }
     if (i18) {
      i13 = i9 >>> 0 > i26 >>> 0 ? i26 : i9;
      i6 = i13;
      do {
       i5 = HEAP32[i6 >> 2] | 0;
       if (!i5) i9 = i65; else {
        i9 = i65;
        while (1) {
         i9 = i9 + -1 | 0;
         HEAP8[i9 >> 0] = (i5 >>> 0) % 10 | 0 | 48;
         if (i5 >>> 0 < 10) break; else i5 = (i5 >>> 0) / 10 | 0;
        }
       }
       do if ((i6 | 0) == (i13 | 0)) {
        if ((i9 | 0) != (i65 | 0)) break;
        HEAP8[i67 >> 0] = 48;
        i9 = i67;
       } else {
        if (i9 >>> 0 <= i82 >>> 0) break;
        do {
         i9 = i9 + -1 | 0;
         HEAP8[i9 >> 0] = 48;
        } while (i9 >>> 0 > i82 >>> 0);
       } while (0);
       ___fwritex(i9, i66 - i9 | 0, i85) | 0;
       i6 = i6 + 4 | 0;
      } while (i6 >>> 0 <= i26 >>> 0);
      if (i20) ___fwritex(7288, 1, i85) | 0;
      if ((i7 | 0) > 0 & i6 >>> 0 < i10 >>> 0) {
       i5 = i6;
       do {
        i9 = HEAP32[i5 >> 2] | 0;
        if (i9) {
         i6 = i65;
         while (1) {
          i6 = i6 + -1 | 0;
          HEAP8[i6 >> 0] = (i9 >>> 0) % 10 | 0 | 48;
          if (i9 >>> 0 < 10) break; else i9 = (i9 >>> 0) / 10 | 0;
         }
         if (i6 >>> 0 > i82 >>> 0) {
          i95 = i6;
          i30 = 289;
         } else i53 = i6;
        } else {
         i95 = i65;
         i30 = 289;
        }
        if ((i30 | 0) == 289) while (1) {
         i30 = 0;
         i6 = i95 + -1 | 0;
         HEAP8[i6 >> 0] = 48;
         if (i6 >>> 0 > i82 >>> 0) i95 = i6; else {
          i53 = i6;
          break;
         }
        }
        i27 = (i7 | 0) > 9;
        ___fwritex(i53, i27 ? 9 : i7, i85) | 0;
        i5 = i5 + 4 | 0;
        i7 = i7 + -9 | 0;
       } while (i27 & i5 >>> 0 < i10 >>> 0);
      }
      if ((i7 | 0) > 0) {
       _memset(i92 | 0, 48, (i7 >>> 0 > 256 ? 256 : i7) | 0) | 0;
       if (i7 >>> 0 > 255) {
        i6 = i7;
        do {
         ___fwritex(i92, 256, i85) | 0;
         i6 = i6 + -256 | 0;
        } while (i6 >>> 0 > 255);
        i7 = i7 & 255;
       }
       ___fwritex(i92, i7, i85) | 0;
      }
     } else {
      i12 = i21 ? i10 : i9 + 4 | 0;
      do if ((i7 | 0) > -1) {
       i4 = (i19 | 0) == 0;
       i13 = i9;
       do {
        i10 = HEAP32[i13 >> 2] | 0;
        if (i10) {
         i6 = i65;
         i5 = i10;
         while (1) {
          i10 = i6 + -1 | 0;
          HEAP8[i10 >> 0] = (i5 >>> 0) % 10 | 0 | 48;
          if (i5 >>> 0 < 10) break; else {
           i6 = i10;
           i5 = (i5 >>> 0) / 10 | 0;
          }
         }
         if ((i10 | 0) != (i65 | 0)) {
          i62 = i6;
          i96 = i10;
         } else i30 = 303;
        } else i30 = 303;
        if ((i30 | 0) == 303) {
         i30 = 0;
         HEAP8[i67 >> 0] = 48;
         i62 = i65;
         i96 = i67;
        }
        do if ((i13 | 0) == (i9 | 0)) {
         ___fwritex(i96, 1, i85) | 0;
         if (i4 & (i7 | 0) < 1) {
          i10 = i62;
          break;
         }
         ___fwritex(7288, 1, i85) | 0;
         i10 = i62;
        } else {
         if (i96 >>> 0 > i82 >>> 0) i10 = i96; else {
          i10 = i96;
          break;
         }
         do {
          i10 = i10 + -1 | 0;
          HEAP8[i10 >> 0] = 48;
         } while (i10 >>> 0 > i82 >>> 0);
        } while (0);
        i27 = i66 - i10 | 0;
        ___fwritex(i10, (i7 | 0) > (i27 | 0) ? i27 : i7, i85) | 0;
        i7 = i7 - i27 | 0;
        i13 = i13 + 4 | 0;
       } while (i13 >>> 0 < i12 >>> 0 & (i7 | 0) > -1);
       if ((i7 | 0) <= 0) break;
       _memset(i92 | 0, 48, (i7 >>> 0 > 256 ? 256 : i7) | 0) | 0;
       if (i7 >>> 0 > 255) {
        i6 = i7;
        do {
         ___fwritex(i92, 256, i85) | 0;
         i6 = i6 + -256 | 0;
        } while (i6 >>> 0 > 255);
        i7 = i7 & 255;
       }
       ___fwritex(i92, i7, i85) | 0;
      } while (0);
      ___fwritex(i16, i79 - i16 | 0, i85) | 0;
     }
     if ((i17 | 0) == 8192 & i15) {
      i6 = i28 - i22 | 0;
      _memset(i92 | 0, 32, (i6 >>> 0 > 256 ? 256 : i6) | 0) | 0;
      if (i6 >>> 0 > 255) {
       i7 = i6;
       do {
        ___fwritex(i92, 256, i85) | 0;
        i7 = i7 + -256 | 0;
       } while (i7 >>> 0 > 255);
       i6 = i6 & 255;
      }
      ___fwritex(i92, i6, i85) | 0;
     }
     i5 = i15 ? i28 : i22;
    } else {
     i5 = (i23 & 32 | 0) != 0;
     i10 = d8 != d8 | 0.0 != 0.0;
     i9 = i10 ? 0 : i24;
     i5 = i10 ? (i5 ? 7272 : 7280) : i5 ? 7256 : 7264;
     i10 = i9 + 3 | 0;
     i4 = (i28 | 0) > (i10 | 0);
     if ((i27 & 8192 | 0) == 0 & i4) {
      i7 = i28 - i10 | 0;
      _memset(i92 | 0, 32, (i7 >>> 0 > 256 ? 256 : i7) | 0) | 0;
      if (i7 >>> 0 > 255) {
       i6 = i7;
       do {
        ___fwritex(i92, 256, i85) | 0;
        i6 = i6 + -256 | 0;
       } while (i6 >>> 0 > 255);
       i7 = i7 & 255;
      }
      ___fwritex(i92, i7, i85) | 0;
     }
     ___fwritex(i25, i9, i85) | 0;
     ___fwritex(i5, 3, i85) | 0;
     if ((i27 & 73728 | 0) == 8192 & i4) {
      i6 = i28 - i10 | 0;
      _memset(i92 | 0, 32, (i6 >>> 0 > 256 ? 256 : i6) | 0) | 0;
      if (i6 >>> 0 > 255) {
       i7 = i6;
       do {
        ___fwritex(i92, 256, i85) | 0;
        i7 = i7 + -256 | 0;
       } while (i7 >>> 0 > 255);
       i6 = i6 & 255;
      }
      ___fwritex(i92, i6, i85) | 0;
     }
     i5 = i4 ? i28 : i10;
    } while (0);
    i22 = i70;
    i20 = i69;
    i10 = i43;
    i6 = i29;
    continue L1;
   }
  case 111:
   {
    i4 = (i69 | 0) == 0 & (i70 | 0) == 0;
    if (i4) i3 = i68; else {
     i3 = i68;
     i6 = i69;
     i5 = i70;
     do {
      i3 = i3 + -1 | 0;
      HEAP8[i3 >> 0] = i6 & 7 | 48;
      i6 = _bitshift64Lshr(i6 | 0, i5 | 0, 3) | 0;
      i5 = tempRet0;
     } while (!((i6 | 0) == 0 & (i5 | 0) == 0));
    }
    i34 = (i27 & 8 | 0) == 0 | i4;
    i35 = i69;
    i36 = i70;
    i31 = i27;
    i32 = i15;
    i33 = i34 & 1 ^ 1;
    i34 = i34 ? 7208 : 7213;
    i30 = 89;
    break;
   }
  case 110:
   switch (i13 | 0) {
   case 0:
    {
     HEAP32[i69 >> 2] = i43;
     i22 = i70;
     i20 = i69;
     i10 = i43;
     i6 = i29;
     continue L1;
    }
   case 1:
    {
     HEAP32[i69 >> 2] = i43;
     i22 = i70;
     i20 = i69;
     i10 = i43;
     i6 = i29;
     continue L1;
    }
   case 2:
    {
     i22 = i69;
     HEAP32[i22 >> 2] = i43;
     HEAP32[i22 + 4 >> 2] = ((i43 | 0) < 0) << 31 >> 31;
     i22 = i70;
     i20 = i69;
     i10 = i43;
     i6 = i29;
     continue L1;
    }
   case 3:
    {
     HEAP16[i69 >> 1] = i43;
     i22 = i70;
     i20 = i69;
     i10 = i43;
     i6 = i29;
     continue L1;
    }
   case 4:
    {
     HEAP8[i69 >> 0] = i43;
     i22 = i70;
     i20 = i69;
     i10 = i43;
     i6 = i29;
     continue L1;
    }
   case 6:
    {
     HEAP32[i69 >> 2] = i43;
     i22 = i70;
     i20 = i69;
     i10 = i43;
     i6 = i29;
     continue L1;
    }
   case 7:
    {
     i22 = i69;
     HEAP32[i22 >> 2] = i43;
     HEAP32[i22 + 4 >> 2] = ((i43 | 0) < 0) << 31 >> 31;
     i22 = i70;
     i20 = i69;
     i10 = i43;
     i6 = i29;
     continue L1;
    }
   default:
    {
     i22 = i70;
     i20 = i69;
     i10 = i43;
     i6 = i29;
     continue L1;
    }
   }
  case 117:
   {
    i72 = i70;
    i73 = i69;
    i93 = 0;
    i94 = 7208;
    i30 = 84;
    break;
   }
  case 105:
  case 100:
   {
    if ((i70 | 0) < 0) {
     i73 = _i64Subtract(0, 0, i69 | 0, i70 | 0) | 0;
     i72 = tempRet0;
     i93 = 1;
     i94 = 7208;
     i30 = 84;
     break L86;
    }
    if (!(i27 & 2048)) {
     i94 = i27 & 1;
     i72 = i70;
     i73 = i69;
     i93 = i94;
     i94 = (i94 | 0) == 0 ? 7208 : 7210;
     i30 = 84;
    } else {
     i72 = i70;
     i73 = i69;
     i93 = 1;
     i94 = 7209;
     i30 = 84;
    }
    break;
   }
  default:
   {
    i49 = i70;
    i50 = i69;
    i51 = i6;
    i2 = i27;
    i44 = i15;
    i45 = 0;
    i46 = 7208;
    i48 = i68;
   }
  } while (0);
  if ((i30 | 0) == 73) {
   i3 = i97 & 32;
   if (!((i69 | 0) == 0 & (i70 | 0) == 0)) {
    i4 = i68;
    i5 = i69;
    i6 = i70;
    do {
     i4 = i4 + -1 | 0;
     HEAP8[i4 >> 0] = HEAPU8[7192 + (i5 & 15) >> 0] | i3;
     i5 = _bitshift64Lshr(i5 | 0, i6 | 0, 4) | 0;
     i6 = tempRet0;
    } while (!((i5 | 0) == 0 & (i6 | 0) == 0));
    if (!(i86 & 8)) {
     i35 = i69;
     i36 = i70;
     i3 = i4;
     i31 = i86;
     i32 = i90;
     i33 = 0;
     i34 = 7208;
     i30 = 89;
    } else {
     i35 = i69;
     i36 = i70;
     i3 = i4;
     i31 = i86;
     i32 = i90;
     i33 = 2;
     i34 = 7208 + (i97 >> 4) | 0;
     i30 = 89;
    }
   } else {
    i35 = i69;
    i36 = i70;
    i3 = i68;
    i31 = i86;
    i32 = i90;
    i33 = 0;
    i34 = 7208;
    i30 = 89;
   }
  } else if ((i30 | 0) == 84) {
   if (i72 >>> 0 > 0 | (i72 | 0) == 0 & i73 >>> 0 > 4294967295) {
    i3 = i68;
    i6 = i73;
    i5 = i72;
    while (1) {
     i4 = ___uremdi3(i6 | 0, i5 | 0, 10, 0) | 0;
     i3 = i3 + -1 | 0;
     HEAP8[i3 >> 0] = i4 | 48;
     i4 = ___udivdi3(i6 | 0, i5 | 0, 10, 0) | 0;
     if (i5 >>> 0 > 9 | (i5 | 0) == 9 & i6 >>> 0 > 4294967295) {
      i6 = i4;
      i5 = tempRet0;
     } else break;
    }
   } else {
    i3 = i68;
    i4 = i73;
   }
   if (!i4) {
    i35 = i73;
    i36 = i72;
    i31 = i27;
    i32 = i15;
    i33 = i93;
    i34 = i94;
    i30 = 89;
   } else while (1) {
    i3 = i3 + -1 | 0;
    HEAP8[i3 >> 0] = (i4 >>> 0) % 10 | 0 | 48;
    if (i4 >>> 0 < 10) {
     i35 = i73;
     i36 = i72;
     i31 = i27;
     i32 = i15;
     i33 = i93;
     i34 = i94;
     i30 = 89;
     break;
    } else i4 = (i4 >>> 0) / 10 | 0;
   }
  } else if ((i30 | 0) == 94) {
   i30 = 0;
   i48 = _memchr(i80, 0, i15) | 0;
   i26 = (i48 | 0) == 0;
   i49 = i70;
   i50 = i69;
   i51 = i80;
   i2 = i9;
   i44 = i26 ? i15 : i48 - i80 | 0;
   i45 = 0;
   i46 = 7208;
   i48 = i26 ? i80 + i15 | 0 : i48;
  } else if ((i30 | 0) == 97) {
   i5 = 0;
   i6 = 0;
   i7 = i60;
   while (1) {
    i4 = HEAP32[i7 >> 2] | 0;
    if (!i4) break;
    i6 = _wctomb(i89, i4) | 0;
    if ((i6 | 0) < 0 | i6 >>> 0 > (i91 - i5 | 0) >>> 0) break;
    i5 = i6 + i5 | 0;
    if (i91 >>> 0 > i5 >>> 0) i7 = i7 + 4 | 0; else break;
   }
   if ((i6 | 0) < 0) {
    i100 = -1;
    i30 = 363;
    break;
   } else {
    i41 = i61;
    i42 = i60;
    i40 = i5;
    i30 = 102;
   }
  }
  if ((i30 | 0) == 89) {
   i30 = 0;
   i2 = (i32 | 0) > -1 ? i31 & -65537 : i31;
   i4 = (i35 | 0) != 0 | (i36 | 0) != 0;
   if (i4 | (i32 | 0) != 0) {
    i44 = (i4 & 1 ^ 1) + (i71 - i3) | 0;
    i49 = i36;
    i50 = i35;
    i51 = i3;
    i44 = (i32 | 0) > (i44 | 0) ? i32 : i44;
    i45 = i33;
    i46 = i34;
    i48 = i68;
   } else {
    i49 = i36;
    i50 = i35;
    i51 = i68;
    i44 = 0;
    i45 = i33;
    i46 = i34;
    i48 = i68;
   }
  } else if ((i30 | 0) == 102) {
   i30 = 0;
   i9 = i27 & 73728;
   i13 = (i28 | 0) > (i40 | 0);
   if ((i9 | 0) == 0 & i13) {
    i6 = i28 - i40 | 0;
    _memset(i92 | 0, 32, (i6 >>> 0 > 256 ? 256 : i6) | 0) | 0;
    if (i6 >>> 0 > 255) {
     i7 = i6;
     do {
      ___fwritex(i92, 256, i85) | 0;
      i7 = i7 + -256 | 0;
     } while (i7 >>> 0 > 255);
     i6 = i6 & 255;
    }
    ___fwritex(i92, i6, i85) | 0;
   }
   L463 : do if (i40) {
    i6 = 0;
    i5 = i42;
    while (1) {
     i7 = HEAP32[i5 >> 2] | 0;
     if (!i7) break L463;
     i7 = _wctomb(i89, i7) | 0;
     i6 = i7 + i6 | 0;
     if ((i6 | 0) > (i40 | 0)) break L463;
     ___fwritex(i89, i7, i85) | 0;
     if (i6 >>> 0 >= i40 >>> 0) break; else i5 = i5 + 4 | 0;
    }
   } while (0);
   if ((i9 | 0) == 8192 & i13) {
    i6 = i28 - i40 | 0;
    _memset(i92 | 0, 32, (i6 >>> 0 > 256 ? 256 : i6) | 0) | 0;
    if (i6 >>> 0 > 255) {
     i5 = i6;
     do {
      ___fwritex(i92, 256, i85) | 0;
      i5 = i5 + -256 | 0;
     } while (i5 >>> 0 > 255);
     i6 = i6 & 255;
    }
    ___fwritex(i92, i6, i85) | 0;
   }
   i22 = i70;
   i20 = i41;
   i10 = i43;
   i6 = i29;
   i5 = i13 ? i28 : i40;
   continue;
  }
  i12 = i48 - i51 | 0;
  i10 = (i44 | 0) < (i12 | 0) ? i12 : i44;
  i4 = i45 + i10 | 0;
  i13 = (i28 | 0) < (i4 | 0) ? i4 : i28;
  i9 = i2 & 73728;
  i5 = (i13 | 0) > (i4 | 0);
  if ((i9 | 0) == 0 & i5) {
   i7 = i13 - i4 | 0;
   _memset(i92 | 0, 32, (i7 >>> 0 > 256 ? 256 : i7) | 0) | 0;
   if (i7 >>> 0 > 255) {
    i6 = i7;
    do {
     ___fwritex(i92, 256, i85) | 0;
     i6 = i6 + -256 | 0;
    } while (i6 >>> 0 > 255);
    i7 = i7 & 255;
   }
   ___fwritex(i92, i7, i85) | 0;
  }
  ___fwritex(i46, i45, i85) | 0;
  if ((i9 | 0) == 65536 & i5) {
   i7 = i13 - i4 | 0;
   _memset(i92 | 0, 48, (i7 >>> 0 > 256 ? 256 : i7) | 0) | 0;
   if (i7 >>> 0 > 255) {
    i6 = i7;
    do {
     ___fwritex(i92, 256, i85) | 0;
     i6 = i6 + -256 | 0;
    } while (i6 >>> 0 > 255);
    i7 = i7 & 255;
   }
   ___fwritex(i92, i7, i85) | 0;
  }
  if ((i10 | 0) > (i12 | 0)) {
   i7 = i10 - i12 | 0;
   _memset(i92 | 0, 48, (i7 >>> 0 > 256 ? 256 : i7) | 0) | 0;
   if (i7 >>> 0 > 255) {
    i6 = i7;
    do {
     ___fwritex(i92, 256, i85) | 0;
     i6 = i6 + -256 | 0;
    } while (i6 >>> 0 > 255);
    i7 = i7 & 255;
   }
   ___fwritex(i92, i7, i85) | 0;
  }
  ___fwritex(i51, i12, i85) | 0;
  if ((i9 | 0) == 8192 & i5) {
   i6 = i13 - i4 | 0;
   _memset(i92 | 0, 32, (i6 >>> 0 > 256 ? 256 : i6) | 0) | 0;
   if (i6 >>> 0 > 255) {
    i5 = i6;
    do {
     ___fwritex(i92, 256, i85) | 0;
     i5 = i5 + -256 | 0;
    } while (i5 >>> 0 > 255);
    i6 = i6 & 255;
   }
   ___fwritex(i92, i6, i85) | 0;
  }
  i22 = i49;
  i20 = i50;
  i10 = i43;
  i6 = i29;
  i5 = i13;
 }
 if ((i30 | 0) == 344) {
  if (i85) {
   i103 = i83;
   STACKTOP = i104;
   return i103 | 0;
  }
  if (!i88) {
   i103 = 0;
   STACKTOP = i104;
   return i103 | 0;
  } else i4 = 1;
  while (1) {
   i2 = HEAP32[i103 + (i4 << 2) >> 2] | 0;
   if (!i2) {
    i1 = i4;
    break;
   }
   i3 = i102 + (i4 << 3) | 0;
   L522 : do if (i2 >>> 0 <= 20) do switch (i2 | 0) {
   case 9:
    {
     i96 = (HEAP32[i101 >> 2] | 0) + (4 - 1) & ~(4 - 1);
     i97 = HEAP32[i96 >> 2] | 0;
     HEAP32[i101 >> 2] = i96 + 4;
     HEAP32[i3 >> 2] = i97;
     break L522;
    }
   case 10:
    {
     i97 = (HEAP32[i101 >> 2] | 0) + (4 - 1) & ~(4 - 1);
     i96 = HEAP32[i97 >> 2] | 0;
     HEAP32[i101 >> 2] = i97 + 4;
     i97 = i3;
     HEAP32[i97 >> 2] = i96;
     HEAP32[i97 + 4 >> 2] = ((i96 | 0) < 0) << 31 >> 31;
     break L522;
    }
   case 11:
    {
     i97 = (HEAP32[i101 >> 2] | 0) + (4 - 1) & ~(4 - 1);
     i96 = HEAP32[i97 >> 2] | 0;
     HEAP32[i101 >> 2] = i97 + 4;
     i97 = i3;
     HEAP32[i97 >> 2] = i96;
     HEAP32[i97 + 4 >> 2] = 0;
     break L522;
    }
   case 12:
    {
     i97 = (HEAP32[i101 >> 2] | 0) + (8 - 1) & ~(8 - 1);
     i96 = i97;
     i95 = HEAP32[i96 >> 2] | 0;
     i96 = HEAP32[i96 + 4 >> 2] | 0;
     HEAP32[i101 >> 2] = i97 + 8;
     i97 = i3;
     HEAP32[i97 >> 2] = i95;
     HEAP32[i97 + 4 >> 2] = i96;
     break L522;
    }
   case 13:
    {
     i97 = (HEAP32[i101 >> 2] | 0) + (4 - 1) & ~(4 - 1);
     i96 = HEAP32[i97 >> 2] | 0;
     HEAP32[i101 >> 2] = i97 + 4;
     i96 = (i96 & 65535) << 16 >> 16;
     i97 = i3;
     HEAP32[i97 >> 2] = i96;
     HEAP32[i97 + 4 >> 2] = ((i96 | 0) < 0) << 31 >> 31;
     break L522;
    }
   case 14:
    {
     i97 = (HEAP32[i101 >> 2] | 0) + (4 - 1) & ~(4 - 1);
     i96 = HEAP32[i97 >> 2] | 0;
     HEAP32[i101 >> 2] = i97 + 4;
     i97 = i3;
     HEAP32[i97 >> 2] = i96 & 65535;
     HEAP32[i97 + 4 >> 2] = 0;
     break L522;
    }
   case 15:
    {
     i97 = (HEAP32[i101 >> 2] | 0) + (4 - 1) & ~(4 - 1);
     i96 = HEAP32[i97 >> 2] | 0;
     HEAP32[i101 >> 2] = i97 + 4;
     i96 = (i96 & 255) << 24 >> 24;
     i97 = i3;
     HEAP32[i97 >> 2] = i96;
     HEAP32[i97 + 4 >> 2] = ((i96 | 0) < 0) << 31 >> 31;
     break L522;
    }
   case 16:
    {
     i97 = (HEAP32[i101 >> 2] | 0) + (4 - 1) & ~(4 - 1);
     i96 = HEAP32[i97 >> 2] | 0;
     HEAP32[i101 >> 2] = i97 + 4;
     i97 = i3;
     HEAP32[i97 >> 2] = i96 & 255;
     HEAP32[i97 + 4 >> 2] = 0;
     break L522;
    }
   case 17:
    {
     i97 = (HEAP32[i101 >> 2] | 0) + (8 - 1) & ~(8 - 1);
     d14 = +HEAPF64[i97 >> 3];
     HEAP32[i101 >> 2] = i97 + 8;
     HEAPF64[i3 >> 3] = d14;
     break L522;
    }
   case 18:
    {
     i97 = (HEAP32[i101 >> 2] | 0) + (8 - 1) & ~(8 - 1);
     d14 = +HEAPF64[i97 >> 3];
     HEAP32[i101 >> 2] = i97 + 8;
     HEAPF64[i3 >> 3] = d14;
     break L522;
    }
   default:
    break L522;
   } while (0); while (0);
   i4 = i4 + 1 | 0;
   if ((i4 | 0) >= 10) {
    i100 = 1;
    i30 = 363;
    break;
   }
  }
  if ((i30 | 0) == 363) {
   STACKTOP = i104;
   return i100 | 0;
  }
  if ((i1 | 0) >= 10) {
   i103 = 1;
   STACKTOP = i104;
   return i103 | 0;
  }
  while (1) {
   if (HEAP32[i103 + (i1 << 2) >> 2] | 0) {
    i100 = -1;
    i30 = 363;
    break;
   }
   i1 = i1 + 1 | 0;
   if ((i1 | 0) >= 10) {
    i100 = 1;
    i30 = 363;
    break;
   }
  }
  if ((i30 | 0) == 363) {
   STACKTOP = i104;
   return i100 | 0;
  }
 } else if ((i30 | 0) == 363) {
  STACKTOP = i104;
  return i100 | 0;
 }
 return 0;
}

function _malloc(i9) {
 i9 = i9 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0;
 do if (i9 >>> 0 < 245) {
  i16 = i9 >>> 0 < 11 ? 16 : i9 + 11 & -8;
  i9 = i16 >>> 3;
  i11 = HEAP32[1530] | 0;
  i8 = i11 >>> i9;
  if (i8 & 3) {
   i3 = (i8 & 1 ^ 1) + i9 | 0;
   i4 = i3 << 1;
   i1 = 6160 + (i4 << 2) | 0;
   i4 = 6160 + (i4 + 2 << 2) | 0;
   i5 = HEAP32[i4 >> 2] | 0;
   i6 = i5 + 8 | 0;
   i7 = HEAP32[i6 >> 2] | 0;
   do if ((i1 | 0) != (i7 | 0)) {
    if (i7 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort();
    i2 = i7 + 12 | 0;
    if ((HEAP32[i2 >> 2] | 0) == (i5 | 0)) {
     HEAP32[i2 >> 2] = i1;
     HEAP32[i4 >> 2] = i7;
     break;
    } else _abort();
   } else HEAP32[1530] = i11 & ~(1 << i3); while (0);
   i39 = i3 << 3;
   HEAP32[i5 + 4 >> 2] = i39 | 3;
   i39 = i5 + (i39 | 4) | 0;
   HEAP32[i39 >> 2] = HEAP32[i39 >> 2] | 1;
   i39 = i6;
   return i39 | 0;
  }
  i1 = HEAP32[1532] | 0;
  if (i16 >>> 0 > i1 >>> 0) {
   if (i8) {
    i4 = 2 << i9;
    i4 = i8 << i9 & (i4 | 0 - i4);
    i4 = (i4 & 0 - i4) + -1 | 0;
    i9 = i4 >>> 12 & 16;
    i4 = i4 >>> i9;
    i3 = i4 >>> 5 & 8;
    i4 = i4 >>> i3;
    i2 = i4 >>> 2 & 4;
    i4 = i4 >>> i2;
    i5 = i4 >>> 1 & 2;
    i4 = i4 >>> i5;
    i6 = i4 >>> 1 & 1;
    i6 = (i3 | i9 | i2 | i5 | i6) + (i4 >>> i6) | 0;
    i4 = i6 << 1;
    i5 = 6160 + (i4 << 2) | 0;
    i4 = 6160 + (i4 + 2 << 2) | 0;
    i2 = HEAP32[i4 >> 2] | 0;
    i9 = i2 + 8 | 0;
    i3 = HEAP32[i9 >> 2] | 0;
    do if ((i5 | 0) != (i3 | 0)) {
     if (i3 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort();
     i7 = i3 + 12 | 0;
     if ((HEAP32[i7 >> 2] | 0) == (i2 | 0)) {
      HEAP32[i7 >> 2] = i5;
      HEAP32[i4 >> 2] = i3;
      i10 = HEAP32[1532] | 0;
      break;
     } else _abort();
    } else {
     HEAP32[1530] = i11 & ~(1 << i6);
     i10 = i1;
    } while (0);
    i39 = i6 << 3;
    i1 = i39 - i16 | 0;
    HEAP32[i2 + 4 >> 2] = i16 | 3;
    i8 = i2 + i16 | 0;
    HEAP32[i2 + (i16 | 4) >> 2] = i1 | 1;
    HEAP32[i2 + i39 >> 2] = i1;
    if (i10) {
     i3 = HEAP32[1535] | 0;
     i5 = i10 >>> 3;
     i7 = i5 << 1;
     i4 = 6160 + (i7 << 2) | 0;
     i6 = HEAP32[1530] | 0;
     i5 = 1 << i5;
     if (i6 & i5) {
      i6 = 6160 + (i7 + 2 << 2) | 0;
      i7 = HEAP32[i6 >> 2] | 0;
      if (i7 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort(); else {
       i12 = i6;
       i13 = i7;
      }
     } else {
      HEAP32[1530] = i6 | i5;
      i12 = 6160 + (i7 + 2 << 2) | 0;
      i13 = i4;
     }
     HEAP32[i12 >> 2] = i3;
     HEAP32[i13 + 12 >> 2] = i3;
     HEAP32[i3 + 8 >> 2] = i13;
     HEAP32[i3 + 12 >> 2] = i4;
    }
    HEAP32[1532] = i1;
    HEAP32[1535] = i8;
    i39 = i9;
    return i39 | 0;
   }
   i9 = HEAP32[1531] | 0;
   if (i9) {
    i6 = (i9 & 0 - i9) + -1 | 0;
    i38 = i6 >>> 12 & 16;
    i6 = i6 >>> i38;
    i37 = i6 >>> 5 & 8;
    i6 = i6 >>> i37;
    i39 = i6 >>> 2 & 4;
    i6 = i6 >>> i39;
    i7 = i6 >>> 1 & 2;
    i6 = i6 >>> i7;
    i5 = i6 >>> 1 & 1;
    i5 = HEAP32[6424 + ((i37 | i38 | i39 | i7 | i5) + (i6 >>> i5) << 2) >> 2] | 0;
    i6 = (HEAP32[i5 + 4 >> 2] & -8) - i16 | 0;
    i7 = i5;
    while (1) {
     i2 = HEAP32[i7 + 16 >> 2] | 0;
     if (!i2) {
      i2 = HEAP32[i7 + 20 >> 2] | 0;
      if (!i2) {
       i11 = i6;
       i10 = i5;
       break;
      }
     }
     i7 = (HEAP32[i2 + 4 >> 2] & -8) - i16 | 0;
     i39 = i7 >>> 0 < i6 >>> 0;
     i6 = i39 ? i7 : i6;
     i7 = i2;
     i5 = i39 ? i2 : i5;
    }
    i9 = HEAP32[1534] | 0;
    if (i10 >>> 0 < i9 >>> 0) _abort();
    i1 = i10 + i16 | 0;
    if (i10 >>> 0 >= i1 >>> 0) _abort();
    i8 = HEAP32[i10 + 24 >> 2] | 0;
    i5 = HEAP32[i10 + 12 >> 2] | 0;
    do if ((i5 | 0) == (i10 | 0)) {
     i6 = i10 + 20 | 0;
     i7 = HEAP32[i6 >> 2] | 0;
     if (!i7) {
      i6 = i10 + 16 | 0;
      i7 = HEAP32[i6 >> 2] | 0;
      if (!i7) {
       i3 = 0;
       break;
      }
     }
     while (1) {
      i5 = i7 + 20 | 0;
      i4 = HEAP32[i5 >> 2] | 0;
      if (i4) {
       i7 = i4;
       i6 = i5;
       continue;
      }
      i5 = i7 + 16 | 0;
      i4 = HEAP32[i5 >> 2] | 0;
      if (!i4) break; else {
       i7 = i4;
       i6 = i5;
      }
     }
     if (i6 >>> 0 < i9 >>> 0) _abort(); else {
      HEAP32[i6 >> 2] = 0;
      i3 = i7;
      break;
     }
    } else {
     i4 = HEAP32[i10 + 8 >> 2] | 0;
     if (i4 >>> 0 < i9 >>> 0) _abort();
     i7 = i4 + 12 | 0;
     if ((HEAP32[i7 >> 2] | 0) != (i10 | 0)) _abort();
     i6 = i5 + 8 | 0;
     if ((HEAP32[i6 >> 2] | 0) == (i10 | 0)) {
      HEAP32[i7 >> 2] = i5;
      HEAP32[i6 >> 2] = i4;
      i3 = i5;
      break;
     } else _abort();
    } while (0);
    do if (i8) {
     i7 = HEAP32[i10 + 28 >> 2] | 0;
     i6 = 6424 + (i7 << 2) | 0;
     if ((i10 | 0) == (HEAP32[i6 >> 2] | 0)) {
      HEAP32[i6 >> 2] = i3;
      if (!i3) {
       HEAP32[1531] = HEAP32[1531] & ~(1 << i7);
       break;
      }
     } else {
      if (i8 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort();
      i7 = i8 + 16 | 0;
      if ((HEAP32[i7 >> 2] | 0) == (i10 | 0)) HEAP32[i7 >> 2] = i3; else HEAP32[i8 + 20 >> 2] = i3;
      if (!i3) break;
     }
     i6 = HEAP32[1534] | 0;
     if (i3 >>> 0 < i6 >>> 0) _abort();
     HEAP32[i3 + 24 >> 2] = i8;
     i7 = HEAP32[i10 + 16 >> 2] | 0;
     do if (i7) if (i7 >>> 0 < i6 >>> 0) _abort(); else {
      HEAP32[i3 + 16 >> 2] = i7;
      HEAP32[i7 + 24 >> 2] = i3;
      break;
     } while (0);
     i7 = HEAP32[i10 + 20 >> 2] | 0;
     if (i7) if (i7 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort(); else {
      HEAP32[i3 + 20 >> 2] = i7;
      HEAP32[i7 + 24 >> 2] = i3;
      break;
     }
    } while (0);
    if (i11 >>> 0 < 16) {
     i39 = i11 + i16 | 0;
     HEAP32[i10 + 4 >> 2] = i39 | 3;
     i39 = i10 + (i39 + 4) | 0;
     HEAP32[i39 >> 2] = HEAP32[i39 >> 2] | 1;
    } else {
     HEAP32[i10 + 4 >> 2] = i16 | 3;
     HEAP32[i10 + (i16 | 4) >> 2] = i11 | 1;
     HEAP32[i10 + (i11 + i16) >> 2] = i11;
     i2 = HEAP32[1532] | 0;
     if (i2) {
      i3 = HEAP32[1535] | 0;
      i5 = i2 >>> 3;
      i7 = i5 << 1;
      i4 = 6160 + (i7 << 2) | 0;
      i6 = HEAP32[1530] | 0;
      i5 = 1 << i5;
      if (i6 & i5) {
       i7 = 6160 + (i7 + 2 << 2) | 0;
       i6 = HEAP32[i7 >> 2] | 0;
       if (i6 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort(); else {
        i15 = i7;
        i14 = i6;
       }
      } else {
       HEAP32[1530] = i6 | i5;
       i15 = 6160 + (i7 + 2 << 2) | 0;
       i14 = i4;
      }
      HEAP32[i15 >> 2] = i3;
      HEAP32[i14 + 12 >> 2] = i3;
      HEAP32[i3 + 8 >> 2] = i14;
      HEAP32[i3 + 12 >> 2] = i4;
     }
     HEAP32[1532] = i11;
     HEAP32[1535] = i1;
    }
    i39 = i10 + 8 | 0;
    return i39 | 0;
   } else i25 = i16;
  } else i25 = i16;
 } else if (i9 >>> 0 <= 4294967231) {
  i9 = i9 + 11 | 0;
  i15 = i9 & -8;
  i10 = HEAP32[1531] | 0;
  if (i10) {
   i8 = 0 - i15 | 0;
   i9 = i9 >>> 8;
   if (i9) if (i15 >>> 0 > 16777215) i11 = 31; else {
    i16 = (i9 + 1048320 | 0) >>> 16 & 8;
    i22 = i9 << i16;
    i14 = (i22 + 520192 | 0) >>> 16 & 4;
    i22 = i22 << i14;
    i11 = (i22 + 245760 | 0) >>> 16 & 2;
    i11 = 14 - (i14 | i16 | i11) + (i22 << i11 >>> 15) | 0;
    i11 = i15 >>> (i11 + 7 | 0) & 1 | i11 << 1;
   } else i11 = 0;
   i9 = HEAP32[6424 + (i11 << 2) >> 2] | 0;
   L123 : do if (!i9) {
    i6 = 0;
    i9 = 0;
    i22 = 86;
   } else {
    i3 = i8;
    i6 = 0;
    i2 = i15 << ((i11 | 0) == 31 ? 0 : 25 - (i11 >>> 1) | 0);
    i1 = i9;
    i9 = 0;
    while (1) {
     i5 = HEAP32[i1 + 4 >> 2] & -8;
     i8 = i5 - i15 | 0;
     if (i8 >>> 0 < i3 >>> 0) if ((i5 | 0) == (i15 | 0)) {
      i5 = i1;
      i9 = i1;
      i22 = 90;
      break L123;
     } else i9 = i1; else i8 = i3;
     i22 = HEAP32[i1 + 20 >> 2] | 0;
     i1 = HEAP32[i1 + 16 + (i2 >>> 31 << 2) >> 2] | 0;
     i6 = (i22 | 0) == 0 | (i22 | 0) == (i1 | 0) ? i6 : i22;
     if (!i1) {
      i22 = 86;
      break;
     } else {
      i3 = i8;
      i2 = i2 << 1;
     }
    }
   } while (0);
   if ((i22 | 0) == 86) {
    if ((i6 | 0) == 0 & (i9 | 0) == 0) {
     i9 = 2 << i11;
     i9 = i10 & (i9 | 0 - i9);
     if (!i9) {
      i25 = i15;
      break;
     }
     i9 = (i9 & 0 - i9) + -1 | 0;
     i13 = i9 >>> 12 & 16;
     i9 = i9 >>> i13;
     i12 = i9 >>> 5 & 8;
     i9 = i9 >>> i12;
     i14 = i9 >>> 2 & 4;
     i9 = i9 >>> i14;
     i16 = i9 >>> 1 & 2;
     i9 = i9 >>> i16;
     i6 = i9 >>> 1 & 1;
     i6 = HEAP32[6424 + ((i12 | i13 | i14 | i16 | i6) + (i9 >>> i6) << 2) >> 2] | 0;
     i9 = 0;
    }
    if (!i6) {
     i13 = i8;
     i16 = i9;
    } else {
     i5 = i6;
     i22 = 90;
    }
   }
   if ((i22 | 0) == 90) while (1) {
    i22 = 0;
    i16 = (HEAP32[i5 + 4 >> 2] & -8) - i15 | 0;
    i6 = i16 >>> 0 < i8 >>> 0;
    i8 = i6 ? i16 : i8;
    i9 = i6 ? i5 : i9;
    i6 = HEAP32[i5 + 16 >> 2] | 0;
    if (i6) {
     i5 = i6;
     i22 = 90;
     continue;
    }
    i5 = HEAP32[i5 + 20 >> 2] | 0;
    if (!i5) {
     i13 = i8;
     i16 = i9;
     break;
    } else i22 = 90;
   }
   if ((i16 | 0) != 0 ? i13 >>> 0 < ((HEAP32[1532] | 0) - i15 | 0) >>> 0 : 0) {
    i9 = HEAP32[1534] | 0;
    if (i16 >>> 0 < i9 >>> 0) _abort();
    i12 = i16 + i15 | 0;
    if (i16 >>> 0 >= i12 >>> 0) _abort();
    i8 = HEAP32[i16 + 24 >> 2] | 0;
    i5 = HEAP32[i16 + 12 >> 2] | 0;
    do if ((i5 | 0) == (i16 | 0)) {
     i6 = i16 + 20 | 0;
     i7 = HEAP32[i6 >> 2] | 0;
     if (!i7) {
      i6 = i16 + 16 | 0;
      i7 = HEAP32[i6 >> 2] | 0;
      if (!i7) {
       i18 = 0;
       break;
      }
     }
     while (1) {
      i5 = i7 + 20 | 0;
      i4 = HEAP32[i5 >> 2] | 0;
      if (i4) {
       i7 = i4;
       i6 = i5;
       continue;
      }
      i5 = i7 + 16 | 0;
      i4 = HEAP32[i5 >> 2] | 0;
      if (!i4) break; else {
       i7 = i4;
       i6 = i5;
      }
     }
     if (i6 >>> 0 < i9 >>> 0) _abort(); else {
      HEAP32[i6 >> 2] = 0;
      i18 = i7;
      break;
     }
    } else {
     i4 = HEAP32[i16 + 8 >> 2] | 0;
     if (i4 >>> 0 < i9 >>> 0) _abort();
     i7 = i4 + 12 | 0;
     if ((HEAP32[i7 >> 2] | 0) != (i16 | 0)) _abort();
     i6 = i5 + 8 | 0;
     if ((HEAP32[i6 >> 2] | 0) == (i16 | 0)) {
      HEAP32[i7 >> 2] = i5;
      HEAP32[i6 >> 2] = i4;
      i18 = i5;
      break;
     } else _abort();
    } while (0);
    do if (i8) {
     i7 = HEAP32[i16 + 28 >> 2] | 0;
     i6 = 6424 + (i7 << 2) | 0;
     if ((i16 | 0) == (HEAP32[i6 >> 2] | 0)) {
      HEAP32[i6 >> 2] = i18;
      if (!i18) {
       HEAP32[1531] = HEAP32[1531] & ~(1 << i7);
       break;
      }
     } else {
      if (i8 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort();
      i7 = i8 + 16 | 0;
      if ((HEAP32[i7 >> 2] | 0) == (i16 | 0)) HEAP32[i7 >> 2] = i18; else HEAP32[i8 + 20 >> 2] = i18;
      if (!i18) break;
     }
     i6 = HEAP32[1534] | 0;
     if (i18 >>> 0 < i6 >>> 0) _abort();
     HEAP32[i18 + 24 >> 2] = i8;
     i7 = HEAP32[i16 + 16 >> 2] | 0;
     do if (i7) if (i7 >>> 0 < i6 >>> 0) _abort(); else {
      HEAP32[i18 + 16 >> 2] = i7;
      HEAP32[i7 + 24 >> 2] = i18;
      break;
     } while (0);
     i7 = HEAP32[i16 + 20 >> 2] | 0;
     if (i7) if (i7 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort(); else {
      HEAP32[i18 + 20 >> 2] = i7;
      HEAP32[i7 + 24 >> 2] = i18;
      break;
     }
    } while (0);
    L199 : do if (i13 >>> 0 >= 16) {
     HEAP32[i16 + 4 >> 2] = i15 | 3;
     HEAP32[i16 + (i15 | 4) >> 2] = i13 | 1;
     HEAP32[i16 + (i13 + i15) >> 2] = i13;
     i7 = i13 >>> 3;
     if (i13 >>> 0 < 256) {
      i6 = i7 << 1;
      i4 = 6160 + (i6 << 2) | 0;
      i5 = HEAP32[1530] | 0;
      i7 = 1 << i7;
      if (i5 & i7) {
       i7 = 6160 + (i6 + 2 << 2) | 0;
       i6 = HEAP32[i7 >> 2] | 0;
       if (i6 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort(); else {
        i19 = i7;
        i20 = i6;
       }
      } else {
       HEAP32[1530] = i5 | i7;
       i19 = 6160 + (i6 + 2 << 2) | 0;
       i20 = i4;
      }
      HEAP32[i19 >> 2] = i12;
      HEAP32[i20 + 12 >> 2] = i12;
      HEAP32[i16 + (i15 + 8) >> 2] = i20;
      HEAP32[i16 + (i15 + 12) >> 2] = i4;
      break;
     }
     i2 = i13 >>> 8;
     if (i2) if (i13 >>> 0 > 16777215) i4 = 31; else {
      i38 = (i2 + 1048320 | 0) >>> 16 & 8;
      i39 = i2 << i38;
      i37 = (i39 + 520192 | 0) >>> 16 & 4;
      i39 = i39 << i37;
      i4 = (i39 + 245760 | 0) >>> 16 & 2;
      i4 = 14 - (i37 | i38 | i4) + (i39 << i4 >>> 15) | 0;
      i4 = i13 >>> (i4 + 7 | 0) & 1 | i4 << 1;
     } else i4 = 0;
     i7 = 6424 + (i4 << 2) | 0;
     HEAP32[i16 + (i15 + 28) >> 2] = i4;
     HEAP32[i16 + (i15 + 20) >> 2] = 0;
     HEAP32[i16 + (i15 + 16) >> 2] = 0;
     i6 = HEAP32[1531] | 0;
     i5 = 1 << i4;
     if (!(i6 & i5)) {
      HEAP32[1531] = i6 | i5;
      HEAP32[i7 >> 2] = i12;
      HEAP32[i16 + (i15 + 24) >> 2] = i7;
      HEAP32[i16 + (i15 + 12) >> 2] = i12;
      HEAP32[i16 + (i15 + 8) >> 2] = i12;
      break;
     }
     i2 = HEAP32[i7 >> 2] | 0;
     L217 : do if ((HEAP32[i2 + 4 >> 2] & -8 | 0) != (i13 | 0)) {
      i6 = i13 << ((i4 | 0) == 31 ? 0 : 25 - (i4 >>> 1) | 0);
      while (1) {
       i1 = i2 + 16 + (i6 >>> 31 << 2) | 0;
       i7 = HEAP32[i1 >> 2] | 0;
       if (!i7) break;
       if ((HEAP32[i7 + 4 >> 2] & -8 | 0) == (i13 | 0)) {
        i25 = i7;
        break L217;
       } else {
        i6 = i6 << 1;
        i2 = i7;
       }
      }
      if (i1 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort(); else {
       HEAP32[i1 >> 2] = i12;
       HEAP32[i16 + (i15 + 24) >> 2] = i2;
       HEAP32[i16 + (i15 + 12) >> 2] = i12;
       HEAP32[i16 + (i15 + 8) >> 2] = i12;
       break L199;
      }
     } else i25 = i2; while (0);
     i2 = i25 + 8 | 0;
     i1 = HEAP32[i2 >> 2] | 0;
     i39 = HEAP32[1534] | 0;
     if (i1 >>> 0 >= i39 >>> 0 & i25 >>> 0 >= i39 >>> 0) {
      HEAP32[i1 + 12 >> 2] = i12;
      HEAP32[i2 >> 2] = i12;
      HEAP32[i16 + (i15 + 8) >> 2] = i1;
      HEAP32[i16 + (i15 + 12) >> 2] = i25;
      HEAP32[i16 + (i15 + 24) >> 2] = 0;
      break;
     } else _abort();
    } else {
     i39 = i13 + i15 | 0;
     HEAP32[i16 + 4 >> 2] = i39 | 3;
     i39 = i16 + (i39 + 4) | 0;
     HEAP32[i39 >> 2] = HEAP32[i39 >> 2] | 1;
    } while (0);
    i39 = i16 + 8 | 0;
    return i39 | 0;
   } else i25 = i15;
  } else i25 = i15;
 } else i25 = -1; while (0);
 i9 = HEAP32[1532] | 0;
 if (i9 >>> 0 >= i25 >>> 0) {
  i1 = i9 - i25 | 0;
  i2 = HEAP32[1535] | 0;
  if (i1 >>> 0 > 15) {
   HEAP32[1535] = i2 + i25;
   HEAP32[1532] = i1;
   HEAP32[i2 + (i25 + 4) >> 2] = i1 | 1;
   HEAP32[i2 + i9 >> 2] = i1;
   HEAP32[i2 + 4 >> 2] = i25 | 3;
  } else {
   HEAP32[1532] = 0;
   HEAP32[1535] = 0;
   HEAP32[i2 + 4 >> 2] = i9 | 3;
   i39 = i2 + (i9 + 4) | 0;
   HEAP32[i39 >> 2] = HEAP32[i39 >> 2] | 1;
  }
  i39 = i2 + 8 | 0;
  return i39 | 0;
 }
 i9 = HEAP32[1533] | 0;
 if (i9 >>> 0 > i25 >>> 0) {
  i38 = i9 - i25 | 0;
  HEAP32[1533] = i38;
  i39 = HEAP32[1536] | 0;
  HEAP32[1536] = i39 + i25;
  HEAP32[i39 + (i25 + 4) >> 2] = i38 | 1;
  HEAP32[i39 + 4 >> 2] = i25 | 3;
  i39 = i39 + 8 | 0;
  return i39 | 0;
 }
 do if (!(HEAP32[1648] | 0)) {
  i9 = _sysconf(30) | 0;
  if (!(i9 + -1 & i9)) {
   HEAP32[1650] = i9;
   HEAP32[1649] = i9;
   HEAP32[1651] = -1;
   HEAP32[1652] = -1;
   HEAP32[1653] = 0;
   HEAP32[1641] = 0;
   i20 = (_time(0) | 0) & -16 ^ 1431655768;
   HEAP32[1648] = i20;
   break;
  } else _abort();
 } while (0);
 i11 = i25 + 48 | 0;
 i2 = HEAP32[1650] | 0;
 i10 = i25 + 47 | 0;
 i3 = i2 + i10 | 0;
 i2 = 0 - i2 | 0;
 i12 = i3 & i2;
 if (i12 >>> 0 <= i25 >>> 0) {
  i39 = 0;
  return i39 | 0;
 }
 i9 = HEAP32[1640] | 0;
 if ((i9 | 0) != 0 ? (i19 = HEAP32[1638] | 0, i20 = i19 + i12 | 0, i20 >>> 0 <= i19 >>> 0 | i20 >>> 0 > i9 >>> 0) : 0) {
  i39 = 0;
  return i39 | 0;
 }
 L258 : do if (!(HEAP32[1641] & 4)) {
  i9 = HEAP32[1536] | 0;
  L260 : do if (i9) {
   i6 = 6568;
   while (1) {
    i8 = HEAP32[i6 >> 2] | 0;
    if (i8 >>> 0 <= i9 >>> 0 ? (i17 = i6 + 4 | 0, (i8 + (HEAP32[i17 >> 2] | 0) | 0) >>> 0 > i9 >>> 0) : 0) {
     i5 = i6;
     i9 = i17;
     break;
    }
    i6 = HEAP32[i6 + 8 >> 2] | 0;
    if (!i6) {
     i22 = 174;
     break L260;
    }
   }
   i8 = i3 - (HEAP32[1533] | 0) & i2;
   if (i8 >>> 0 < 2147483647) {
    i6 = _sbrk(i8 | 0) | 0;
    i20 = (i6 | 0) == ((HEAP32[i5 >> 2] | 0) + (HEAP32[i9 >> 2] | 0) | 0);
    i9 = i20 ? i8 : 0;
    if (i20) {
     if ((i6 | 0) != (-1 | 0)) {
      i23 = i6;
      i22 = 194;
      break L258;
     }
    } else i22 = 184;
   } else i9 = 0;
  } else i22 = 174; while (0);
  do if ((i22 | 0) == 174) {
   i5 = _sbrk(0) | 0;
   if ((i5 | 0) != (-1 | 0)) {
    i9 = i5;
    i8 = HEAP32[1649] | 0;
    i6 = i8 + -1 | 0;
    if (!(i6 & i9)) i8 = i12; else i8 = i12 - i9 + (i6 + i9 & 0 - i8) | 0;
    i9 = HEAP32[1638] | 0;
    i6 = i9 + i8 | 0;
    if (i8 >>> 0 > i25 >>> 0 & i8 >>> 0 < 2147483647) {
     i20 = HEAP32[1640] | 0;
     if ((i20 | 0) != 0 ? i6 >>> 0 <= i9 >>> 0 | i6 >>> 0 > i20 >>> 0 : 0) {
      i9 = 0;
      break;
     }
     i6 = _sbrk(i8 | 0) | 0;
     i22 = (i6 | 0) == (i5 | 0);
     i9 = i22 ? i8 : 0;
     if (i22) {
      i23 = i5;
      i22 = 194;
      break L258;
     } else i22 = 184;
    } else i9 = 0;
   } else i9 = 0;
  } while (0);
  L280 : do if ((i22 | 0) == 184) {
   i5 = 0 - i8 | 0;
   do if (i11 >>> 0 > i8 >>> 0 & (i8 >>> 0 < 2147483647 & (i6 | 0) != (-1 | 0)) ? (i21 = HEAP32[1650] | 0, i21 = i10 - i8 + i21 & 0 - i21, i21 >>> 0 < 2147483647) : 0) if ((_sbrk(i21 | 0) | 0) == (-1 | 0)) {
    _sbrk(i5 | 0) | 0;
    break L280;
   } else {
    i8 = i21 + i8 | 0;
    break;
   } while (0);
   if ((i6 | 0) != (-1 | 0)) {
    i23 = i6;
    i9 = i8;
    i22 = 194;
    break L258;
   }
  } while (0);
  HEAP32[1641] = HEAP32[1641] | 4;
  i22 = 191;
 } else {
  i9 = 0;
  i22 = 191;
 } while (0);
 if ((((i22 | 0) == 191 ? i12 >>> 0 < 2147483647 : 0) ? (i23 = _sbrk(i12 | 0) | 0, i24 = _sbrk(0) | 0, i23 >>> 0 < i24 >>> 0 & ((i23 | 0) != (-1 | 0) & (i24 | 0) != (-1 | 0))) : 0) ? (i26 = i24 - i23 | 0, i27 = i26 >>> 0 > (i25 + 40 | 0) >>> 0, i27) : 0) {
  i9 = i27 ? i26 : i9;
  i22 = 194;
 }
 if ((i22 | 0) == 194) {
  i8 = (HEAP32[1638] | 0) + i9 | 0;
  HEAP32[1638] = i8;
  if (i8 >>> 0 > (HEAP32[1639] | 0) >>> 0) HEAP32[1639] = i8;
  i13 = HEAP32[1536] | 0;
  L299 : do if (i13) {
   i3 = 6568;
   do {
    i8 = HEAP32[i3 >> 2] | 0;
    i6 = i3 + 4 | 0;
    i5 = HEAP32[i6 >> 2] | 0;
    if ((i23 | 0) == (i8 + i5 | 0)) {
     i28 = i8;
     i29 = i6;
     i30 = i5;
     i31 = i3;
     i22 = 204;
     break;
    }
    i3 = HEAP32[i3 + 8 >> 2] | 0;
   } while ((i3 | 0) != 0);
   if (((i22 | 0) == 204 ? (HEAP32[i31 + 12 >> 2] & 8 | 0) == 0 : 0) ? i13 >>> 0 < i23 >>> 0 & i13 >>> 0 >= i28 >>> 0 : 0) {
    HEAP32[i29 >> 2] = i30 + i9;
    i39 = (HEAP32[1533] | 0) + i9 | 0;
    i38 = i13 + 8 | 0;
    i38 = (i38 & 7 | 0) == 0 ? 0 : 0 - i38 & 7;
    i37 = i39 - i38 | 0;
    HEAP32[1536] = i13 + i38;
    HEAP32[1533] = i37;
    HEAP32[i13 + (i38 + 4) >> 2] = i37 | 1;
    HEAP32[i13 + (i39 + 4) >> 2] = 40;
    HEAP32[1537] = HEAP32[1652];
    break;
   }
   i8 = HEAP32[1534] | 0;
   if (i23 >>> 0 < i8 >>> 0) {
    HEAP32[1534] = i23;
    i8 = i23;
   }
   i6 = i23 + i9 | 0;
   i3 = 6568;
   while (1) {
    if ((HEAP32[i3 >> 2] | 0) == (i6 | 0)) {
     i5 = i3;
     i6 = i3;
     i22 = 212;
     break;
    }
    i3 = HEAP32[i3 + 8 >> 2] | 0;
    if (!i3) {
     i5 = 6568;
     break;
    }
   }
   if ((i22 | 0) == 212) if (!(HEAP32[i6 + 12 >> 2] & 8)) {
    HEAP32[i5 >> 2] = i23;
    i15 = i6 + 4 | 0;
    HEAP32[i15 >> 2] = (HEAP32[i15 >> 2] | 0) + i9;
    i15 = i23 + 8 | 0;
    i15 = (i15 & 7 | 0) == 0 ? 0 : 0 - i15 & 7;
    i1 = i23 + (i9 + 8) | 0;
    i1 = (i1 & 7 | 0) == 0 ? 0 : 0 - i1 & 7;
    i7 = i23 + (i1 + i9) | 0;
    i14 = i15 + i25 | 0;
    i16 = i23 + i14 | 0;
    i12 = i7 - (i23 + i15) - i25 | 0;
    HEAP32[i23 + (i15 + 4) >> 2] = i25 | 3;
    L324 : do if ((i7 | 0) != (i13 | 0)) {
     if ((i7 | 0) == (HEAP32[1535] | 0)) {
      i39 = (HEAP32[1532] | 0) + i12 | 0;
      HEAP32[1532] = i39;
      HEAP32[1535] = i16;
      HEAP32[i23 + (i14 + 4) >> 2] = i39 | 1;
      HEAP32[i23 + (i39 + i14) >> 2] = i39;
      break;
     }
     i11 = i9 + 4 | 0;
     i6 = HEAP32[i23 + (i11 + i1) >> 2] | 0;
     if ((i6 & 3 | 0) == 1) {
      i10 = i6 & -8;
      i3 = i6 >>> 3;
      L332 : do if (i6 >>> 0 >= 256) {
       i2 = HEAP32[i23 + ((i1 | 24) + i9) >> 2] | 0;
       i5 = HEAP32[i23 + (i9 + 12 + i1) >> 2] | 0;
       do if ((i5 | 0) == (i7 | 0)) {
        i4 = i1 | 16;
        i5 = i23 + (i11 + i4) | 0;
        i6 = HEAP32[i5 >> 2] | 0;
        if (!i6) {
         i5 = i23 + (i4 + i9) | 0;
         i6 = HEAP32[i5 >> 2] | 0;
         if (!i6) {
          i36 = 0;
          break;
         }
        }
        while (1) {
         i4 = i6 + 20 | 0;
         i3 = HEAP32[i4 >> 2] | 0;
         if (i3) {
          i6 = i3;
          i5 = i4;
          continue;
         }
         i4 = i6 + 16 | 0;
         i3 = HEAP32[i4 >> 2] | 0;
         if (!i3) break; else {
          i6 = i3;
          i5 = i4;
         }
        }
        if (i5 >>> 0 < i8 >>> 0) _abort(); else {
         HEAP32[i5 >> 2] = 0;
         i36 = i6;
         break;
        }
       } else {
        i4 = HEAP32[i23 + ((i1 | 8) + i9) >> 2] | 0;
        if (i4 >>> 0 < i8 >>> 0) _abort();
        i8 = i4 + 12 | 0;
        if ((HEAP32[i8 >> 2] | 0) != (i7 | 0)) _abort();
        i6 = i5 + 8 | 0;
        if ((HEAP32[i6 >> 2] | 0) == (i7 | 0)) {
         HEAP32[i8 >> 2] = i5;
         HEAP32[i6 >> 2] = i4;
         i36 = i5;
         break;
        } else _abort();
       } while (0);
       if (!i2) break;
       i8 = HEAP32[i23 + (i9 + 28 + i1) >> 2] | 0;
       i6 = 6424 + (i8 << 2) | 0;
       do if ((i7 | 0) != (HEAP32[i6 >> 2] | 0)) {
        if (i2 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort();
        i8 = i2 + 16 | 0;
        if ((HEAP32[i8 >> 2] | 0) == (i7 | 0)) HEAP32[i8 >> 2] = i36; else HEAP32[i2 + 20 >> 2] = i36;
        if (!i36) break L332;
       } else {
        HEAP32[i6 >> 2] = i36;
        if (i36) break;
        HEAP32[1531] = HEAP32[1531] & ~(1 << i8);
        break L332;
       } while (0);
       i6 = HEAP32[1534] | 0;
       if (i36 >>> 0 < i6 >>> 0) _abort();
       HEAP32[i36 + 24 >> 2] = i2;
       i8 = i1 | 16;
       i7 = HEAP32[i23 + (i8 + i9) >> 2] | 0;
       do if (i7) if (i7 >>> 0 < i6 >>> 0) _abort(); else {
        HEAP32[i36 + 16 >> 2] = i7;
        HEAP32[i7 + 24 >> 2] = i36;
        break;
       } while (0);
       i7 = HEAP32[i23 + (i11 + i8) >> 2] | 0;
       if (!i7) break;
       if (i7 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort(); else {
        HEAP32[i36 + 20 >> 2] = i7;
        HEAP32[i7 + 24 >> 2] = i36;
        break;
       }
      } else {
       i5 = HEAP32[i23 + ((i1 | 8) + i9) >> 2] | 0;
       i4 = HEAP32[i23 + (i9 + 12 + i1) >> 2] | 0;
       i6 = 6160 + (i3 << 1 << 2) | 0;
       do if ((i5 | 0) != (i6 | 0)) {
        if (i5 >>> 0 < i8 >>> 0) _abort();
        if ((HEAP32[i5 + 12 >> 2] | 0) == (i7 | 0)) break;
        _abort();
       } while (0);
       if ((i4 | 0) == (i5 | 0)) {
        HEAP32[1530] = HEAP32[1530] & ~(1 << i3);
        break;
       }
       do if ((i4 | 0) == (i6 | 0)) i32 = i4 + 8 | 0; else {
        if (i4 >>> 0 < i8 >>> 0) _abort();
        i8 = i4 + 8 | 0;
        if ((HEAP32[i8 >> 2] | 0) == (i7 | 0)) {
         i32 = i8;
         break;
        }
        _abort();
       } while (0);
       HEAP32[i5 + 12 >> 2] = i4;
       HEAP32[i32 >> 2] = i5;
      } while (0);
      i7 = i23 + ((i10 | i1) + i9) | 0;
      i8 = i10 + i12 | 0;
     } else i8 = i12;
     i7 = i7 + 4 | 0;
     HEAP32[i7 >> 2] = HEAP32[i7 >> 2] & -2;
     HEAP32[i23 + (i14 + 4) >> 2] = i8 | 1;
     HEAP32[i23 + (i8 + i14) >> 2] = i8;
     i7 = i8 >>> 3;
     if (i8 >>> 0 < 256) {
      i6 = i7 << 1;
      i4 = 6160 + (i6 << 2) | 0;
      i5 = HEAP32[1530] | 0;
      i7 = 1 << i7;
      do if (!(i5 & i7)) {
       HEAP32[1530] = i5 | i7;
       i37 = 6160 + (i6 + 2 << 2) | 0;
       i38 = i4;
      } else {
       i7 = 6160 + (i6 + 2 << 2) | 0;
       i6 = HEAP32[i7 >> 2] | 0;
       if (i6 >>> 0 >= (HEAP32[1534] | 0) >>> 0) {
        i37 = i7;
        i38 = i6;
        break;
       }
       _abort();
      } while (0);
      HEAP32[i37 >> 2] = i16;
      HEAP32[i38 + 12 >> 2] = i16;
      HEAP32[i23 + (i14 + 8) >> 2] = i38;
      HEAP32[i23 + (i14 + 12) >> 2] = i4;
      break;
     }
     i2 = i8 >>> 8;
     do if (!i2) i4 = 0; else {
      if (i8 >>> 0 > 16777215) {
       i4 = 31;
       break;
      }
      i37 = (i2 + 1048320 | 0) >>> 16 & 8;
      i38 = i2 << i37;
      i36 = (i38 + 520192 | 0) >>> 16 & 4;
      i38 = i38 << i36;
      i4 = (i38 + 245760 | 0) >>> 16 & 2;
      i4 = 14 - (i36 | i37 | i4) + (i38 << i4 >>> 15) | 0;
      i4 = i8 >>> (i4 + 7 | 0) & 1 | i4 << 1;
     } while (0);
     i7 = 6424 + (i4 << 2) | 0;
     HEAP32[i23 + (i14 + 28) >> 2] = i4;
     HEAP32[i23 + (i14 + 20) >> 2] = 0;
     HEAP32[i23 + (i14 + 16) >> 2] = 0;
     i6 = HEAP32[1531] | 0;
     i5 = 1 << i4;
     if (!(i6 & i5)) {
      HEAP32[1531] = i6 | i5;
      HEAP32[i7 >> 2] = i16;
      HEAP32[i23 + (i14 + 24) >> 2] = i7;
      HEAP32[i23 + (i14 + 12) >> 2] = i16;
      HEAP32[i23 + (i14 + 8) >> 2] = i16;
      break;
     }
     i2 = HEAP32[i7 >> 2] | 0;
     L418 : do if ((HEAP32[i2 + 4 >> 2] & -8 | 0) != (i8 | 0)) {
      i6 = i8 << ((i4 | 0) == 31 ? 0 : 25 - (i4 >>> 1) | 0);
      while (1) {
       i1 = i2 + 16 + (i6 >>> 31 << 2) | 0;
       i7 = HEAP32[i1 >> 2] | 0;
       if (!i7) break;
       if ((HEAP32[i7 + 4 >> 2] & -8 | 0) == (i8 | 0)) {
        i39 = i7;
        break L418;
       } else {
        i6 = i6 << 1;
        i2 = i7;
       }
      }
      if (i1 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort(); else {
       HEAP32[i1 >> 2] = i16;
       HEAP32[i23 + (i14 + 24) >> 2] = i2;
       HEAP32[i23 + (i14 + 12) >> 2] = i16;
       HEAP32[i23 + (i14 + 8) >> 2] = i16;
       break L324;
      }
     } else i39 = i2; while (0);
     i2 = i39 + 8 | 0;
     i1 = HEAP32[i2 >> 2] | 0;
     i38 = HEAP32[1534] | 0;
     if (i1 >>> 0 >= i38 >>> 0 & i39 >>> 0 >= i38 >>> 0) {
      HEAP32[i1 + 12 >> 2] = i16;
      HEAP32[i2 >> 2] = i16;
      HEAP32[i23 + (i14 + 8) >> 2] = i1;
      HEAP32[i23 + (i14 + 12) >> 2] = i39;
      HEAP32[i23 + (i14 + 24) >> 2] = 0;
      break;
     } else _abort();
    } else {
     i39 = (HEAP32[1533] | 0) + i12 | 0;
     HEAP32[1533] = i39;
     HEAP32[1536] = i16;
     HEAP32[i23 + (i14 + 4) >> 2] = i39 | 1;
    } while (0);
    i39 = i23 + (i15 | 8) | 0;
    return i39 | 0;
   } else i5 = 6568;
   while (1) {
    i6 = HEAP32[i5 >> 2] | 0;
    if (i6 >>> 0 <= i13 >>> 0 ? (i7 = HEAP32[i5 + 4 >> 2] | 0, i4 = i6 + i7 | 0, i4 >>> 0 > i13 >>> 0) : 0) break;
    i5 = HEAP32[i5 + 8 >> 2] | 0;
   }
   i8 = i6 + (i7 + -39) | 0;
   i6 = i6 + (i7 + -47 + ((i8 & 7 | 0) == 0 ? 0 : 0 - i8 & 7)) | 0;
   i8 = i13 + 16 | 0;
   i6 = i6 >>> 0 < i8 >>> 0 ? i13 : i6;
   i7 = i6 + 8 | 0;
   i5 = i23 + 8 | 0;
   i5 = (i5 & 7 | 0) == 0 ? 0 : 0 - i5 & 7;
   i39 = i9 + -40 - i5 | 0;
   HEAP32[1536] = i23 + i5;
   HEAP32[1533] = i39;
   HEAP32[i23 + (i5 + 4) >> 2] = i39 | 1;
   HEAP32[i23 + (i9 + -36) >> 2] = 40;
   HEAP32[1537] = HEAP32[1652];
   i5 = i6 + 4 | 0;
   HEAP32[i5 >> 2] = 27;
   HEAP32[i7 >> 2] = HEAP32[1642];
   HEAP32[i7 + 4 >> 2] = HEAP32[1643];
   HEAP32[i7 + 8 >> 2] = HEAP32[1644];
   HEAP32[i7 + 12 >> 2] = HEAP32[1645];
   HEAP32[1642] = i23;
   HEAP32[1643] = i9;
   HEAP32[1645] = 0;
   HEAP32[1644] = i7;
   i7 = i6 + 28 | 0;
   HEAP32[i7 >> 2] = 7;
   if ((i6 + 32 | 0) >>> 0 < i4 >>> 0) do {
    i39 = i7;
    i7 = i7 + 4 | 0;
    HEAP32[i7 >> 2] = 7;
   } while ((i39 + 8 | 0) >>> 0 < i4 >>> 0);
   if ((i6 | 0) != (i13 | 0)) {
    i4 = i6 - i13 | 0;
    HEAP32[i5 >> 2] = HEAP32[i5 >> 2] & -2;
    HEAP32[i13 + 4 >> 2] = i4 | 1;
    HEAP32[i6 >> 2] = i4;
    i7 = i4 >>> 3;
    if (i4 >>> 0 < 256) {
     i6 = i7 << 1;
     i4 = 6160 + (i6 << 2) | 0;
     i5 = HEAP32[1530] | 0;
     i7 = 1 << i7;
     if (i5 & i7) {
      i2 = 6160 + (i6 + 2 << 2) | 0;
      i1 = HEAP32[i2 >> 2] | 0;
      if (i1 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort(); else {
       i33 = i2;
       i34 = i1;
      }
     } else {
      HEAP32[1530] = i5 | i7;
      i33 = 6160 + (i6 + 2 << 2) | 0;
      i34 = i4;
     }
     HEAP32[i33 >> 2] = i13;
     HEAP32[i34 + 12 >> 2] = i13;
     HEAP32[i13 + 8 >> 2] = i34;
     HEAP32[i13 + 12 >> 2] = i4;
     break;
    }
    i2 = i4 >>> 8;
    if (i2) if (i4 >>> 0 > 16777215) i6 = 31; else {
     i38 = (i2 + 1048320 | 0) >>> 16 & 8;
     i39 = i2 << i38;
     i37 = (i39 + 520192 | 0) >>> 16 & 4;
     i39 = i39 << i37;
     i6 = (i39 + 245760 | 0) >>> 16 & 2;
     i6 = 14 - (i37 | i38 | i6) + (i39 << i6 >>> 15) | 0;
     i6 = i4 >>> (i6 + 7 | 0) & 1 | i6 << 1;
    } else i6 = 0;
    i7 = 6424 + (i6 << 2) | 0;
    HEAP32[i13 + 28 >> 2] = i6;
    HEAP32[i13 + 20 >> 2] = 0;
    HEAP32[i8 >> 2] = 0;
    i2 = HEAP32[1531] | 0;
    i1 = 1 << i6;
    if (!(i2 & i1)) {
     HEAP32[1531] = i2 | i1;
     HEAP32[i7 >> 2] = i13;
     HEAP32[i13 + 24 >> 2] = i7;
     HEAP32[i13 + 12 >> 2] = i13;
     HEAP32[i13 + 8 >> 2] = i13;
     break;
    }
    i2 = HEAP32[i7 >> 2] | 0;
    L459 : do if ((HEAP32[i2 + 4 >> 2] & -8 | 0) != (i4 | 0)) {
     i7 = i4 << ((i6 | 0) == 31 ? 0 : 25 - (i6 >>> 1) | 0);
     while (1) {
      i1 = i2 + 16 + (i7 >>> 31 << 2) | 0;
      i3 = HEAP32[i1 >> 2] | 0;
      if (!i3) break;
      if ((HEAP32[i3 + 4 >> 2] & -8 | 0) == (i4 | 0)) {
       i35 = i3;
       break L459;
      } else {
       i7 = i7 << 1;
       i2 = i3;
      }
     }
     if (i1 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort(); else {
      HEAP32[i1 >> 2] = i13;
      HEAP32[i13 + 24 >> 2] = i2;
      HEAP32[i13 + 12 >> 2] = i13;
      HEAP32[i13 + 8 >> 2] = i13;
      break L299;
     }
    } else i35 = i2; while (0);
    i2 = i35 + 8 | 0;
    i1 = HEAP32[i2 >> 2] | 0;
    i39 = HEAP32[1534] | 0;
    if (i1 >>> 0 >= i39 >>> 0 & i35 >>> 0 >= i39 >>> 0) {
     HEAP32[i1 + 12 >> 2] = i13;
     HEAP32[i2 >> 2] = i13;
     HEAP32[i13 + 8 >> 2] = i1;
     HEAP32[i13 + 12 >> 2] = i35;
     HEAP32[i13 + 24 >> 2] = 0;
     break;
    } else _abort();
   }
  } else {
   i39 = HEAP32[1534] | 0;
   if ((i39 | 0) == 0 | i23 >>> 0 < i39 >>> 0) HEAP32[1534] = i23;
   HEAP32[1642] = i23;
   HEAP32[1643] = i9;
   HEAP32[1645] = 0;
   HEAP32[1539] = HEAP32[1648];
   HEAP32[1538] = -1;
   i2 = 0;
   do {
    i39 = i2 << 1;
    i38 = 6160 + (i39 << 2) | 0;
    HEAP32[6160 + (i39 + 3 << 2) >> 2] = i38;
    HEAP32[6160 + (i39 + 2 << 2) >> 2] = i38;
    i2 = i2 + 1 | 0;
   } while ((i2 | 0) != 32);
   i39 = i23 + 8 | 0;
   i39 = (i39 & 7 | 0) == 0 ? 0 : 0 - i39 & 7;
   i38 = i9 + -40 - i39 | 0;
   HEAP32[1536] = i23 + i39;
   HEAP32[1533] = i38;
   HEAP32[i23 + (i39 + 4) >> 2] = i38 | 1;
   HEAP32[i23 + (i9 + -36) >> 2] = 40;
   HEAP32[1537] = HEAP32[1652];
  } while (0);
  i1 = HEAP32[1533] | 0;
  if (i1 >>> 0 > i25 >>> 0) {
   i38 = i1 - i25 | 0;
   HEAP32[1533] = i38;
   i39 = HEAP32[1536] | 0;
   HEAP32[1536] = i39 + i25;
   HEAP32[i39 + (i25 + 4) >> 2] = i38 | 1;
   HEAP32[i39 + 4 >> 2] = i25 | 3;
   i39 = i39 + 8 | 0;
   return i39 | 0;
  }
 }
 i39 = ___errno_location() | 0;
 HEAP32[i39 >> 2] = 12;
 i39 = 0;
 return i39 | 0;
}

function _parg_shader_load_from_buffer(i3) {
 i3 = i3 | 0;
 var i1 = 0, i2 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, i42 = 0, i43 = 0, i44 = 0, i45 = 0, i46 = 0, i47 = 0;
 i47 = STACKTOP;
 STACKTOP = STACKTOP + 48 | 0;
 i43 = i47 + 16 | 0;
 i42 = i47 + 8 | 0;
 i37 = i47;
 i34 = i47 + 28 | 0;
 i35 = i47 + 36 | 0;
 i36 = i47 + 24 | 0;
 i40 = i47 + 32 | 0;
 i41 = i47 + 40 | 0;
 i44 = _sdsnew(560) | 0;
 i45 = _sdsnew(576) | 0;
 i46 = _sdsnew(592) | 0;
 if (!(HEAP32[150] | 0)) {
  i39 = _calloc(1, 28) | 0;
  HEAP32[150] = i39;
  i39 = _calloc(1, 28) | 0;
  HEAP32[152] = i39;
  i39 = _calloc(1, 28) | 0;
  HEAP32[154] = i39;
  i39 = _calloc(1, 28) | 0;
  HEAP32[156] = i39;
 }
 i39 = _parg_buffer_length(i3) | 0;
 i39 = _sdssplitlen(_parg_buffer_lock(i3, 0) | 0, i39, 632, 1, i34) | 0;
 _parg_buffer_unlock(i3);
 i3 = _realloc(0, 8) | 0;
 i2 = _sdsdup(i46) | 0;
 HEAP32[i3 >> 2] = i2;
 i2 = _realloc(0, 8) | 0;
 i1 = _sdsempty() | 0;
 HEAP32[i2 >> 2] = i1;
 i1 = HEAP32[i34 >> 2] | 0;
 if ((i1 | 0) <= 0) {
  _sdsfreesplitres(i39, i1);
  i43 = i3;
  i42 = i2;
  i41 = 0;
  _free(i41);
  _free(i42);
  _free(i43);
  _sdsfree(i44);
  _sdsfree(i45);
  _sdsfree(i46);
  STACKTOP = i47;
  return;
 }
 i24 = i44 + -1 | 0;
 i25 = i44 + -3 | 0;
 i26 = i44 + -5 | 0;
 i27 = i44 + -9 | 0;
 i28 = i44 + -17 | 0;
 i29 = i45 + -1 | 0;
 i30 = i45 + -3 | 0;
 i31 = i45 + -5 | 0;
 i32 = i45 + -9 | 0;
 i33 = i45 + -17 | 0;
 i14 = 1;
 i20 = 2;
 i22 = 1;
 i21 = 2;
 i23 = 0;
 i12 = 0;
 i13 = 0;
 i9 = 0;
 while (1) {
  i15 = HEAP32[i39 + (i23 << 2) >> 2] | 0;
  i11 = HEAPU8[i15 + -1 >> 0] | 0;
  switch (i11 & 7 | 0) {
  case 0:
   {
    i11 = i11 >>> 3;
    i38 = 12;
    break;
   }
  case 1:
   {
    i11 = HEAPU8[i15 + -3 >> 0] | 0;
    i38 = 12;
    break;
   }
  case 2:
   {
    i11 = i15 + -5 | 0;
    i11 = (HEAPU8[i11 >> 0] | HEAPU8[i11 + 1 >> 0] << 8) & 65535;
    i38 = 12;
    break;
   }
  case 3:
   {
    i11 = i15 + -9 | 0;
    i11 = HEAPU8[i11 >> 0] | HEAPU8[i11 + 1 >> 0] << 8 | HEAPU8[i11 + 2 >> 0] << 16 | HEAPU8[i11 + 3 >> 0] << 24;
    i38 = 12;
    break;
   }
  case 4:
   {
    i11 = i15 + -17 | 0;
    i11 = HEAPU8[i11 >> 0] | HEAPU8[i11 + 1 >> 0] << 8 | HEAPU8[i11 + 2 >> 0] << 16 | HEAPU8[i11 + 3 >> 0] << 24;
    i38 = 12;
    break;
   }
  default:
   i38 = 20;
  }
  if ((i38 | 0) == 12) {
   i38 = 0;
   if ((i11 >>> 0 > 2 ? (HEAP8[i15 >> 0] | 0) == 45 : 0) ? (HEAP8[i15 + 1 >> 0] | 0) == 45 : 0) {
    i11 = _sdsdup(i15) | 0;
    _sdsrange(i11, 2, -1);
    i11 = _sdstrim(i11, 640) | 0;
    if ((i14 | 0) == (i20 | 0)) {
     i20 = (i14 | 0) != 0 ? i14 << 1 : 2;
     i10 = i20;
     i3 = _realloc(i3, i20 << 2) | 0;
    } else i10 = i20;
    HEAP32[i3 + (i14 << 2) >> 2] = i11;
    if ((i22 | 0) == (i21 | 0)) {
     i21 = (i21 | 0) != 0 ? i21 << 1 : 2;
     i11 = i21;
     i2 = _realloc(i2, i21 << 2) | 0;
    } else i11 = i21;
    i21 = _sdsempty() | 0;
    i15 = i2 + (i22 << 2) | 0;
    HEAP32[i15 >> 2] = i21;
    HEAP32[i37 >> 2] = i23 + 1;
    i21 = _sdscatprintf(i21, 648, i37) | 0;
    HEAP32[i15 >> 2] = i21;
    i14 = i14 + 1 | 0;
    i15 = i22 + 1 | 0;
   } else i38 = 20;
  }
  if ((i38 | 0) == 20) {
   i38 = 0;
   i10 = i2 + (i22 + -1 << 2) | 0;
   i19 = _sdscatsds(HEAP32[i10 >> 2] | 0, i15) | 0;
   HEAP32[i10 >> 2] = i19;
   i19 = _sdscat(i19, 632) | 0;
   HEAP32[i10 >> 2] = i19;
   i10 = _strstr(i15, i45) | 0;
   if (i10) {
    if ((i12 | 0) == (i9 | 0)) {
     i9 = (i9 | 0) != 0 ? i9 << 1 : 2;
     i13 = _realloc(i13, i9 << 2) | 0;
    }
    i11 = HEAPU8[i29 >> 0] | 0;
    switch (i11 & 7 | 0) {
    case 0:
     {
      i11 = i11 >>> 3;
      break;
     }
    case 1:
     {
      i11 = HEAPU8[i30 >> 0] | 0;
      break;
     }
    case 2:
     {
      i11 = (HEAPU8[i31 >> 0] | HEAPU8[i31 + 1 >> 0] << 8) & 65535;
      break;
     }
    case 3:
     {
      i11 = HEAPU8[i32 >> 0] | HEAPU8[i32 + 1 >> 0] << 8 | HEAPU8[i32 + 2 >> 0] << 16 | HEAPU8[i32 + 3 >> 0] << 24;
      break;
     }
    case 4:
     {
      i11 = i33;
      i11 = HEAPU8[i11 >> 0] | HEAPU8[i11 + 1 >> 0] << 8 | HEAPU8[i11 + 2 >> 0] << 16 | HEAPU8[i11 + 3 >> 0] << 24;
      break;
     }
    default:
     i11 = 0;
    }
    i19 = _sdsnew(i10 + i11 | 0) | 0;
    HEAP32[i13 + (i12 << 2) >> 2] = i19;
    i12 = i12 + 1 | 0;
   }
   if (!(_strncmp(i15, i44, _strlen(i44 | 0) | 0) | 0)) {
    i11 = HEAPU8[i24 >> 0] | 0;
    switch (i11 & 7 | 0) {
    case 0:
     {
      i11 = i11 >>> 3;
      break;
     }
    case 1:
     {
      i11 = HEAPU8[i25 >> 0] | 0;
      break;
     }
    case 2:
     {
      i11 = (HEAPU8[i26 >> 0] | HEAPU8[i26 + 1 >> 0] << 8) & 65535;
      break;
     }
    case 3:
     {
      i11 = HEAPU8[i27 >> 0] | HEAPU8[i27 + 1 >> 0] << 8 | HEAPU8[i27 + 2 >> 0] << 16 | HEAPU8[i27 + 3 >> 0] << 24;
      break;
     }
    case 4:
     {
      i11 = i28;
      i11 = HEAPU8[i11 >> 0] | HEAPU8[i11 + 1 >> 0] << 8 | HEAPU8[i11 + 2 >> 0] << 16 | HEAPU8[i11 + 3 >> 0] << 24;
      break;
     }
    default:
     i11 = 0;
    }
    i10 = _sdstrim(_sdsnew(i15 + i11 | 0) | 0, 664) | 0;
    i11 = HEAPU8[i10 + -1 >> 0] | 0;
    switch (i11 & 7 | 0) {
    case 0:
     {
      i11 = i11 >>> 3;
      break;
     }
    case 1:
     {
      i11 = HEAPU8[i10 + -3 >> 0] | 0;
      break;
     }
    case 2:
     {
      i11 = i10 + -5 | 0;
      i11 = (HEAPU8[i11 >> 0] | HEAPU8[i11 + 1 >> 0] << 8) & 65535;
      break;
     }
    case 3:
     {
      i11 = i10 + -9 | 0;
      i11 = HEAPU8[i11 >> 0] | HEAPU8[i11 + 1 >> 0] << 8 | HEAPU8[i11 + 2 >> 0] << 16 | HEAPU8[i11 + 3 >> 0] << 24;
      break;
     }
    case 4:
     {
      i11 = i10 + -17 | 0;
      i11 = HEAPU8[i11 >> 0] | HEAPU8[i11 + 1 >> 0] << 8 | HEAPU8[i11 + 2 >> 0] << 16 | HEAPU8[i11 + 3 >> 0] << 24;
      break;
     }
    default:
     i11 = 0;
    }
    i16 = _sdssplitlen(i10, i11, 640, 1, i35) | 0;
    i19 = _sdsdup(HEAP32[i16 + ((HEAP32[i35 >> 2] | 0) + -1 << 2) >> 2] | 0) | 0;
    _sdsfreesplitres(i16, HEAP32[i35 >> 2] | 0);
    _sdsfree(i10);
    i16 = _parg_token_from_string(i19) | 0;
    i17 = HEAP32[154] | 0;
    i18 = HEAP32[i17 >> 2] | 0;
    L57 : do if (!i18) {
     i11 = 0;
     i38 = 50;
    } else {
     i7 = i18 + -1 | 0;
     i6 = i7 & i16;
     i5 = HEAP32[i17 + 16 >> 2] | 0;
     i4 = i17 + 20 | 0;
     i11 = i6;
     i15 = 0;
     while (1) {
      i8 = HEAP32[i5 + (i11 >>> 4 << 2) >> 2] | 0;
      i10 = i11 << 1 & 30;
      i1 = i8 >>> i10;
      if (i1 & 2) break;
      if ((i1 & 1 | 0) == 0 ? (HEAP32[(HEAP32[i4 >> 2] | 0) + (i11 << 2) >> 2] | 0) == (i16 | 0) : 0) break;
      i15 = i15 + 1 | 0;
      i11 = i15 + i11 & i7;
      if ((i11 | 0) == (i6 | 0)) {
       i38 = 51;
       break L57;
      }
     }
     i11 = (3 << i10 & i8 | 0) == 0 ? i11 : i18;
     i38 = 50;
    } while (0);
    if ((i38 | 0) == 50 ? (i38 = 0, (i11 | 0) == (i18 | 0)) : 0) i38 = 51;
    if ((i38 | 0) == 51) {
     i38 = 0;
     i15 = HEAP32[i17 + 4 >> 2] | 0;
     i18 = _kh_put_imap(i17, i16, i36) | 0;
     HEAP32[(HEAP32[(HEAP32[154] | 0) + 24 >> 2] | 0) + (i18 << 2) >> 2] = i15;
    }
    _sdsfree(i19);
    i10 = i20;
    i15 = i22;
    i11 = i21;
   } else {
    i10 = i20;
    i15 = i22;
    i11 = i21;
   }
  }
  i23 = i23 + 1 | 0;
  i1 = HEAP32[i34 >> 2] | 0;
  if ((i23 | 0) >= (i1 | 0)) break; else {
   i20 = i10;
   i22 = i15;
   i21 = i11;
  }
 }
 _sdsfreesplitres(i39, i1);
 i8 = HEAP32[i2 >> 2] | 0;
 if (!i12) {
  i43 = i3;
  i42 = i2;
  i41 = i13;
  _free(i41);
  _free(i42);
  _free(i43);
  _sdsfree(i44);
  _sdsfree(i45);
  _sdsfree(i46);
  STACKTOP = i47;
  return;
 }
 i9 = (i14 | 0) == 0;
 i11 = 0;
 while (1) {
  i10 = HEAP32[i13 + (i11 << 2) >> 2] | 0;
  i1 = HEAPU8[i10 + -1 >> 0] | 0;
  switch (i1 & 7 | 0) {
  case 0:
   {
    i1 = i1 >>> 3;
    break;
   }
  case 1:
   {
    i1 = HEAPU8[i10 + -3 >> 0] | 0;
    break;
   }
  case 2:
   {
    i1 = i10 + -5 | 0;
    i1 = (HEAPU8[i1 >> 0] | HEAPU8[i1 + 1 >> 0] << 8) & 65535;
    break;
   }
  case 3:
   {
    i1 = i10 + -9 | 0;
    i1 = HEAPU8[i1 >> 0] | HEAPU8[i1 + 1 >> 0] << 8 | HEAPU8[i1 + 2 >> 0] << 16 | HEAPU8[i1 + 3 >> 0] << 24;
    break;
   }
  case 4:
   {
    i1 = i10 + -17 | 0;
    i1 = HEAPU8[i1 >> 0] | HEAPU8[i1 + 1 >> 0] << 8 | HEAPU8[i1 + 2 >> 0] << 16 | HEAPU8[i1 + 3 >> 0] << 24;
    break;
   }
  default:
   i1 = 0;
  }
  HEAP32[i40 >> 2] = i1;
  i7 = _sdssplitlen(i10, i1, 672, 1, i40) | 0;
  if ((HEAP32[i40 >> 2] | 0) > 0) {
   i4 = 0;
   do {
    _sdstrim(HEAP32[i7 + (i4 << 2) >> 2] | 0, 640) | 0;
    i4 = i4 + 1 | 0;
    i1 = HEAP32[i40 >> 2] | 0;
   } while ((i4 | 0) < (i1 | 0));
   if ((i1 | 0) != 3) i38 = 65;
  } else i38 = 65;
  if ((i38 | 0) == 65 ? (i38 = 0, _puts(680) | 0, (HEAP32[i40 >> 2] | 0) != 3) : 0) {
   i38 = 66;
   break;
  }
  i1 = HEAP32[i7 + 4 >> 2] | 0;
  if (i9) {
   i38 = 74;
   break;
  } else i4 = 0;
  while (1) {
   if (!(_strcmp(HEAP32[i3 + (i4 << 2) >> 2] | 0, i1) | 0)) break;
   i4 = i4 + 1 | 0;
   if (i4 >>> 0 >= i14 >>> 0) {
    i4 = -1;
    break;
   }
  }
  i6 = HEAP32[i7 + 8 >> 2] | 0;
  i5 = 0;
  while (1) {
   if (!(_strcmp(HEAP32[i3 + (i5 << 2) >> 2] | 0, i6) | 0)) break;
   i5 = i5 + 1 | 0;
   if (i5 >>> 0 >= i14 >>> 0) {
    i5 = -1;
    break;
   }
  }
  if ((i4 | 0) <= 0) {
   i38 = 74;
   break;
  }
  if ((i5 | 0) <= 0) {
   i1 = i6;
   i38 = 76;
   break;
  }
  i35 = HEAP32[i2 + (i4 << 2) >> 2] | 0;
  i37 = HEAP32[i2 + (i5 << 2) >> 2] | 0;
  i35 = _sdscat(_sdsdup(i8) | 0, i35) | 0;
  i37 = _sdscat(_sdscatsds(_sdsnew(888) | 0, i8) | 0, i37) | 0;
  i39 = _parg_token_from_string(HEAP32[i7 >> 2] | 0) | 0;
  _sdsfreesplitres(i7, HEAP32[i40 >> 2] | 0);
  _sdsfree(i10);
  i36 = _kh_put_smap(HEAP32[150] | 0, i39, i41) | 0;
  HEAP32[(HEAP32[(HEAP32[150] | 0) + 24 >> 2] | 0) + (i36 << 2) >> 2] = i35;
  i39 = _kh_put_smap(HEAP32[152] | 0, i39, i41) | 0;
  HEAP32[(HEAP32[(HEAP32[152] | 0) + 24 >> 2] | 0) + (i39 << 2) >> 2] = i37;
  i11 = i11 + 1 | 0;
  if (i11 >>> 0 >= i12 >>> 0) {
   i1 = i13;
   i38 = 78;
   break;
  }
 }
 if ((i38 | 0) == 66) ___assert_fail(712, 728, 125, 768); else if ((i38 | 0) == 74) {
  HEAP32[i42 >> 2] = 808;
  HEAP32[i42 + 4 >> 2] = i1;
  _printf(800, i42 | 0) | 0;
  ___assert_fail(824, 728, 130, 768);
 } else if ((i38 | 0) == 76) {
  HEAP32[i43 >> 2] = 848;
  HEAP32[i43 + 4 >> 2] = i1;
  _printf(800, i43 | 0) | 0;
  ___assert_fail(864, 728, 131, 768);
 } else if ((i38 | 0) == 78) {
  _free(i1);
  _free(i2);
  _free(i3);
  _sdsfree(i44);
  _sdsfree(i45);
  _sdsfree(i46);
  STACKTOP = i47;
  return;
 }
}

function _free(i15) {
 i15 = i15 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0;
 if (!i15) return;
 i5 = i15 + -8 | 0;
 i6 = HEAP32[1534] | 0;
 if (i5 >>> 0 < i6 >>> 0) _abort();
 i4 = HEAP32[i15 + -4 >> 2] | 0;
 i3 = i4 & 3;
 if ((i3 | 0) == 1) _abort();
 i13 = i4 & -8;
 i16 = i15 + (i13 + -8) | 0;
 do if (!(i4 & 1)) {
  i5 = HEAP32[i5 >> 2] | 0;
  if (!i3) return;
  i7 = -8 - i5 | 0;
  i10 = i15 + i7 | 0;
  i11 = i5 + i13 | 0;
  if (i10 >>> 0 < i6 >>> 0) _abort();
  if ((i10 | 0) == (HEAP32[1535] | 0)) {
   i5 = i15 + (i13 + -4) | 0;
   i4 = HEAP32[i5 >> 2] | 0;
   if ((i4 & 3 | 0) != 3) {
    i20 = i10;
    i9 = i11;
    break;
   }
   HEAP32[1532] = i11;
   HEAP32[i5 >> 2] = i4 & -2;
   HEAP32[i15 + (i7 + 4) >> 2] = i11 | 1;
   HEAP32[i16 >> 2] = i11;
   return;
  }
  i2 = i5 >>> 3;
  if (i5 >>> 0 < 256) {
   i3 = HEAP32[i15 + (i7 + 8) >> 2] | 0;
   i4 = HEAP32[i15 + (i7 + 12) >> 2] | 0;
   i5 = 6160 + (i2 << 1 << 2) | 0;
   if ((i3 | 0) != (i5 | 0)) {
    if (i3 >>> 0 < i6 >>> 0) _abort();
    if ((HEAP32[i3 + 12 >> 2] | 0) != (i10 | 0)) _abort();
   }
   if ((i4 | 0) == (i3 | 0)) {
    HEAP32[1530] = HEAP32[1530] & ~(1 << i2);
    i20 = i10;
    i9 = i11;
    break;
   }
   if ((i4 | 0) != (i5 | 0)) {
    if (i4 >>> 0 < i6 >>> 0) _abort();
    i5 = i4 + 8 | 0;
    if ((HEAP32[i5 >> 2] | 0) == (i10 | 0)) i1 = i5; else _abort();
   } else i1 = i4 + 8 | 0;
   HEAP32[i3 + 12 >> 2] = i4;
   HEAP32[i1 >> 2] = i3;
   i20 = i10;
   i9 = i11;
   break;
  }
  i1 = HEAP32[i15 + (i7 + 24) >> 2] | 0;
  i3 = HEAP32[i15 + (i7 + 12) >> 2] | 0;
  do if ((i3 | 0) == (i10 | 0)) {
   i4 = i15 + (i7 + 20) | 0;
   i5 = HEAP32[i4 >> 2] | 0;
   if (!i5) {
    i4 = i15 + (i7 + 16) | 0;
    i5 = HEAP32[i4 >> 2] | 0;
    if (!i5) {
     i8 = 0;
     break;
    }
   }
   while (1) {
    i3 = i5 + 20 | 0;
    i2 = HEAP32[i3 >> 2] | 0;
    if (i2) {
     i5 = i2;
     i4 = i3;
     continue;
    }
    i3 = i5 + 16 | 0;
    i2 = HEAP32[i3 >> 2] | 0;
    if (!i2) break; else {
     i5 = i2;
     i4 = i3;
    }
   }
   if (i4 >>> 0 < i6 >>> 0) _abort(); else {
    HEAP32[i4 >> 2] = 0;
    i8 = i5;
    break;
   }
  } else {
   i2 = HEAP32[i15 + (i7 + 8) >> 2] | 0;
   if (i2 >>> 0 < i6 >>> 0) _abort();
   i5 = i2 + 12 | 0;
   if ((HEAP32[i5 >> 2] | 0) != (i10 | 0)) _abort();
   i4 = i3 + 8 | 0;
   if ((HEAP32[i4 >> 2] | 0) == (i10 | 0)) {
    HEAP32[i5 >> 2] = i3;
    HEAP32[i4 >> 2] = i2;
    i8 = i3;
    break;
   } else _abort();
  } while (0);
  if (i1) {
   i5 = HEAP32[i15 + (i7 + 28) >> 2] | 0;
   i4 = 6424 + (i5 << 2) | 0;
   if ((i10 | 0) == (HEAP32[i4 >> 2] | 0)) {
    HEAP32[i4 >> 2] = i8;
    if (!i8) {
     HEAP32[1531] = HEAP32[1531] & ~(1 << i5);
     i20 = i10;
     i9 = i11;
     break;
    }
   } else {
    if (i1 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort();
    i5 = i1 + 16 | 0;
    if ((HEAP32[i5 >> 2] | 0) == (i10 | 0)) HEAP32[i5 >> 2] = i8; else HEAP32[i1 + 20 >> 2] = i8;
    if (!i8) {
     i20 = i10;
     i9 = i11;
     break;
    }
   }
   i4 = HEAP32[1534] | 0;
   if (i8 >>> 0 < i4 >>> 0) _abort();
   HEAP32[i8 + 24 >> 2] = i1;
   i5 = HEAP32[i15 + (i7 + 16) >> 2] | 0;
   do if (i5) if (i5 >>> 0 < i4 >>> 0) _abort(); else {
    HEAP32[i8 + 16 >> 2] = i5;
    HEAP32[i5 + 24 >> 2] = i8;
    break;
   } while (0);
   i5 = HEAP32[i15 + (i7 + 20) >> 2] | 0;
   if (i5) if (i5 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort(); else {
    HEAP32[i8 + 20 >> 2] = i5;
    HEAP32[i5 + 24 >> 2] = i8;
    i20 = i10;
    i9 = i11;
    break;
   } else {
    i20 = i10;
    i9 = i11;
   }
  } else {
   i20 = i10;
   i9 = i11;
  }
 } else {
  i20 = i5;
  i9 = i13;
 } while (0);
 if (i20 >>> 0 >= i16 >>> 0) _abort();
 i5 = i15 + (i13 + -4) | 0;
 i4 = HEAP32[i5 >> 2] | 0;
 if (!(i4 & 1)) _abort();
 if (!(i4 & 2)) {
  if ((i16 | 0) == (HEAP32[1536] | 0)) {
   i19 = (HEAP32[1533] | 0) + i9 | 0;
   HEAP32[1533] = i19;
   HEAP32[1536] = i20;
   HEAP32[i20 + 4 >> 2] = i19 | 1;
   if ((i20 | 0) != (HEAP32[1535] | 0)) return;
   HEAP32[1535] = 0;
   HEAP32[1532] = 0;
   return;
  }
  if ((i16 | 0) == (HEAP32[1535] | 0)) {
   i19 = (HEAP32[1532] | 0) + i9 | 0;
   HEAP32[1532] = i19;
   HEAP32[1535] = i20;
   HEAP32[i20 + 4 >> 2] = i19 | 1;
   HEAP32[i20 + i19 >> 2] = i19;
   return;
  }
  i6 = (i4 & -8) + i9 | 0;
  i1 = i4 >>> 3;
  do if (i4 >>> 0 >= 256) {
   i1 = HEAP32[i15 + (i13 + 16) >> 2] | 0;
   i5 = HEAP32[i15 + (i13 | 4) >> 2] | 0;
   do if ((i5 | 0) == (i16 | 0)) {
    i4 = i15 + (i13 + 12) | 0;
    i5 = HEAP32[i4 >> 2] | 0;
    if (!i5) {
     i4 = i15 + (i13 + 8) | 0;
     i5 = HEAP32[i4 >> 2] | 0;
     if (!i5) {
      i14 = 0;
      break;
     }
    }
    while (1) {
     i3 = i5 + 20 | 0;
     i2 = HEAP32[i3 >> 2] | 0;
     if (i2) {
      i5 = i2;
      i4 = i3;
      continue;
     }
     i3 = i5 + 16 | 0;
     i2 = HEAP32[i3 >> 2] | 0;
     if (!i2) break; else {
      i5 = i2;
      i4 = i3;
     }
    }
    if (i4 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort(); else {
     HEAP32[i4 >> 2] = 0;
     i14 = i5;
     break;
    }
   } else {
    i4 = HEAP32[i15 + i13 >> 2] | 0;
    if (i4 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort();
    i3 = i4 + 12 | 0;
    if ((HEAP32[i3 >> 2] | 0) != (i16 | 0)) _abort();
    i2 = i5 + 8 | 0;
    if ((HEAP32[i2 >> 2] | 0) == (i16 | 0)) {
     HEAP32[i3 >> 2] = i5;
     HEAP32[i2 >> 2] = i4;
     i14 = i5;
     break;
    } else _abort();
   } while (0);
   if (i1) {
    i5 = HEAP32[i15 + (i13 + 20) >> 2] | 0;
    i4 = 6424 + (i5 << 2) | 0;
    if ((i16 | 0) == (HEAP32[i4 >> 2] | 0)) {
     HEAP32[i4 >> 2] = i14;
     if (!i14) {
      HEAP32[1531] = HEAP32[1531] & ~(1 << i5);
      break;
     }
    } else {
     if (i1 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort();
     i5 = i1 + 16 | 0;
     if ((HEAP32[i5 >> 2] | 0) == (i16 | 0)) HEAP32[i5 >> 2] = i14; else HEAP32[i1 + 20 >> 2] = i14;
     if (!i14) break;
    }
    i5 = HEAP32[1534] | 0;
    if (i14 >>> 0 < i5 >>> 0) _abort();
    HEAP32[i14 + 24 >> 2] = i1;
    i4 = HEAP32[i15 + (i13 + 8) >> 2] | 0;
    do if (i4) if (i4 >>> 0 < i5 >>> 0) _abort(); else {
     HEAP32[i14 + 16 >> 2] = i4;
     HEAP32[i4 + 24 >> 2] = i14;
     break;
    } while (0);
    i2 = HEAP32[i15 + (i13 + 12) >> 2] | 0;
    if (i2) if (i2 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort(); else {
     HEAP32[i14 + 20 >> 2] = i2;
     HEAP32[i2 + 24 >> 2] = i14;
     break;
    }
   }
  } else {
   i2 = HEAP32[i15 + i13 >> 2] | 0;
   i3 = HEAP32[i15 + (i13 | 4) >> 2] | 0;
   i5 = 6160 + (i1 << 1 << 2) | 0;
   if ((i2 | 0) != (i5 | 0)) {
    if (i2 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort();
    if ((HEAP32[i2 + 12 >> 2] | 0) != (i16 | 0)) _abort();
   }
   if ((i3 | 0) == (i2 | 0)) {
    HEAP32[1530] = HEAP32[1530] & ~(1 << i1);
    break;
   }
   if ((i3 | 0) != (i5 | 0)) {
    if (i3 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort();
    i4 = i3 + 8 | 0;
    if ((HEAP32[i4 >> 2] | 0) == (i16 | 0)) i12 = i4; else _abort();
   } else i12 = i3 + 8 | 0;
   HEAP32[i2 + 12 >> 2] = i3;
   HEAP32[i12 >> 2] = i2;
  } while (0);
  HEAP32[i20 + 4 >> 2] = i6 | 1;
  HEAP32[i20 + i6 >> 2] = i6;
  if ((i20 | 0) == (HEAP32[1535] | 0)) {
   HEAP32[1532] = i6;
   return;
  } else i5 = i6;
 } else {
  HEAP32[i5 >> 2] = i4 & -2;
  HEAP32[i20 + 4 >> 2] = i9 | 1;
  HEAP32[i20 + i9 >> 2] = i9;
  i5 = i9;
 }
 i4 = i5 >>> 3;
 if (i5 >>> 0 < 256) {
  i3 = i4 << 1;
  i5 = 6160 + (i3 << 2) | 0;
  i1 = HEAP32[1530] | 0;
  i2 = 1 << i4;
  if (i1 & i2) {
   i2 = 6160 + (i3 + 2 << 2) | 0;
   i1 = HEAP32[i2 >> 2] | 0;
   if (i1 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort(); else {
    i17 = i2;
    i18 = i1;
   }
  } else {
   HEAP32[1530] = i1 | i2;
   i17 = 6160 + (i3 + 2 << 2) | 0;
   i18 = i5;
  }
  HEAP32[i17 >> 2] = i20;
  HEAP32[i18 + 12 >> 2] = i20;
  HEAP32[i20 + 8 >> 2] = i18;
  HEAP32[i20 + 12 >> 2] = i5;
  return;
 }
 i1 = i5 >>> 8;
 if (i1) if (i5 >>> 0 > 16777215) i4 = 31; else {
  i17 = (i1 + 1048320 | 0) >>> 16 & 8;
  i18 = i1 << i17;
  i16 = (i18 + 520192 | 0) >>> 16 & 4;
  i18 = i18 << i16;
  i4 = (i18 + 245760 | 0) >>> 16 & 2;
  i4 = 14 - (i16 | i17 | i4) + (i18 << i4 >>> 15) | 0;
  i4 = i5 >>> (i4 + 7 | 0) & 1 | i4 << 1;
 } else i4 = 0;
 i2 = 6424 + (i4 << 2) | 0;
 HEAP32[i20 + 28 >> 2] = i4;
 HEAP32[i20 + 20 >> 2] = 0;
 HEAP32[i20 + 16 >> 2] = 0;
 i1 = HEAP32[1531] | 0;
 i3 = 1 << i4;
 L199 : do if (i1 & i3) {
  i2 = HEAP32[i2 >> 2] | 0;
  L202 : do if ((HEAP32[i2 + 4 >> 2] & -8 | 0) != (i5 | 0)) {
   i4 = i5 << ((i4 | 0) == 31 ? 0 : 25 - (i4 >>> 1) | 0);
   while (1) {
    i1 = i2 + 16 + (i4 >>> 31 << 2) | 0;
    i3 = HEAP32[i1 >> 2] | 0;
    if (!i3) break;
    if ((HEAP32[i3 + 4 >> 2] & -8 | 0) == (i5 | 0)) {
     i19 = i3;
     break L202;
    } else {
     i4 = i4 << 1;
     i2 = i3;
    }
   }
   if (i1 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort(); else {
    HEAP32[i1 >> 2] = i20;
    HEAP32[i20 + 24 >> 2] = i2;
    HEAP32[i20 + 12 >> 2] = i20;
    HEAP32[i20 + 8 >> 2] = i20;
    break L199;
   }
  } else i19 = i2; while (0);
  i1 = i19 + 8 | 0;
  i2 = HEAP32[i1 >> 2] | 0;
  i18 = HEAP32[1534] | 0;
  if (i2 >>> 0 >= i18 >>> 0 & i19 >>> 0 >= i18 >>> 0) {
   HEAP32[i2 + 12 >> 2] = i20;
   HEAP32[i1 >> 2] = i20;
   HEAP32[i20 + 8 >> 2] = i2;
   HEAP32[i20 + 12 >> 2] = i19;
   HEAP32[i20 + 24 >> 2] = 0;
   break;
  } else _abort();
 } else {
  HEAP32[1531] = i1 | i3;
  HEAP32[i2 >> 2] = i20;
  HEAP32[i20 + 24 >> 2] = i2;
  HEAP32[i20 + 12 >> 2] = i20;
  HEAP32[i20 + 8 >> 2] = i20;
 } while (0);
 i20 = (HEAP32[1538] | 0) + -1 | 0;
 HEAP32[1538] = i20;
 if (!i20) i1 = 6576; else return;
 while (1) {
  i1 = HEAP32[i1 >> 2] | 0;
  if (!i1) break; else i1 = i1 + 8 | 0;
 }
 HEAP32[1538] = -1;
 return;
}

function _dispose_chunk(i14, i15) {
 i14 = i14 | 0;
 i15 = i15 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0;
 i16 = i14 + i15 | 0;
 i5 = HEAP32[i14 + 4 >> 2] | 0;
 do if (!(i5 & 1)) {
  i7 = HEAP32[i14 >> 2] | 0;
  if (!(i5 & 3)) return;
  i11 = i14 + (0 - i7) | 0;
  i10 = i7 + i15 | 0;
  i6 = HEAP32[1534] | 0;
  if (i11 >>> 0 < i6 >>> 0) _abort();
  if ((i11 | 0) == (HEAP32[1535] | 0)) {
   i4 = i14 + (i15 + 4) | 0;
   i5 = HEAP32[i4 >> 2] | 0;
   if ((i5 & 3 | 0) != 3) {
    i19 = i11;
    i9 = i10;
    break;
   }
   HEAP32[1532] = i10;
   HEAP32[i4 >> 2] = i5 & -2;
   HEAP32[i14 + (4 - i7) >> 2] = i10 | 1;
   HEAP32[i16 >> 2] = i10;
   return;
  }
  i2 = i7 >>> 3;
  if (i7 >>> 0 < 256) {
   i3 = HEAP32[i14 + (8 - i7) >> 2] | 0;
   i4 = HEAP32[i14 + (12 - i7) >> 2] | 0;
   i5 = 6160 + (i2 << 1 << 2) | 0;
   if ((i3 | 0) != (i5 | 0)) {
    if (i3 >>> 0 < i6 >>> 0) _abort();
    if ((HEAP32[i3 + 12 >> 2] | 0) != (i11 | 0)) _abort();
   }
   if ((i4 | 0) == (i3 | 0)) {
    HEAP32[1530] = HEAP32[1530] & ~(1 << i2);
    i19 = i11;
    i9 = i10;
    break;
   }
   if ((i4 | 0) != (i5 | 0)) {
    if (i4 >>> 0 < i6 >>> 0) _abort();
    i5 = i4 + 8 | 0;
    if ((HEAP32[i5 >> 2] | 0) == (i11 | 0)) i1 = i5; else _abort();
   } else i1 = i4 + 8 | 0;
   HEAP32[i3 + 12 >> 2] = i4;
   HEAP32[i1 >> 2] = i3;
   i19 = i11;
   i9 = i10;
   break;
  }
  i1 = HEAP32[i14 + (24 - i7) >> 2] | 0;
  i3 = HEAP32[i14 + (12 - i7) >> 2] | 0;
  do if ((i3 | 0) == (i11 | 0)) {
   i3 = 16 - i7 | 0;
   i4 = i14 + (i3 + 4) | 0;
   i5 = HEAP32[i4 >> 2] | 0;
   if (!i5) {
    i4 = i14 + i3 | 0;
    i5 = HEAP32[i4 >> 2] | 0;
    if (!i5) {
     i8 = 0;
     break;
    }
   }
   while (1) {
    i3 = i5 + 20 | 0;
    i2 = HEAP32[i3 >> 2] | 0;
    if (i2) {
     i5 = i2;
     i4 = i3;
     continue;
    }
    i3 = i5 + 16 | 0;
    i2 = HEAP32[i3 >> 2] | 0;
    if (!i2) break; else {
     i5 = i2;
     i4 = i3;
    }
   }
   if (i4 >>> 0 < i6 >>> 0) _abort(); else {
    HEAP32[i4 >> 2] = 0;
    i8 = i5;
    break;
   }
  } else {
   i2 = HEAP32[i14 + (8 - i7) >> 2] | 0;
   if (i2 >>> 0 < i6 >>> 0) _abort();
   i5 = i2 + 12 | 0;
   if ((HEAP32[i5 >> 2] | 0) != (i11 | 0)) _abort();
   i4 = i3 + 8 | 0;
   if ((HEAP32[i4 >> 2] | 0) == (i11 | 0)) {
    HEAP32[i5 >> 2] = i3;
    HEAP32[i4 >> 2] = i2;
    i8 = i3;
    break;
   } else _abort();
  } while (0);
  if (i1) {
   i5 = HEAP32[i14 + (28 - i7) >> 2] | 0;
   i4 = 6424 + (i5 << 2) | 0;
   if ((i11 | 0) == (HEAP32[i4 >> 2] | 0)) {
    HEAP32[i4 >> 2] = i8;
    if (!i8) {
     HEAP32[1531] = HEAP32[1531] & ~(1 << i5);
     i19 = i11;
     i9 = i10;
     break;
    }
   } else {
    if (i1 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort();
    i5 = i1 + 16 | 0;
    if ((HEAP32[i5 >> 2] | 0) == (i11 | 0)) HEAP32[i5 >> 2] = i8; else HEAP32[i1 + 20 >> 2] = i8;
    if (!i8) {
     i19 = i11;
     i9 = i10;
     break;
    }
   }
   i3 = HEAP32[1534] | 0;
   if (i8 >>> 0 < i3 >>> 0) _abort();
   HEAP32[i8 + 24 >> 2] = i1;
   i5 = 16 - i7 | 0;
   i4 = HEAP32[i14 + i5 >> 2] | 0;
   do if (i4) if (i4 >>> 0 < i3 >>> 0) _abort(); else {
    HEAP32[i8 + 16 >> 2] = i4;
    HEAP32[i4 + 24 >> 2] = i8;
    break;
   } while (0);
   i5 = HEAP32[i14 + (i5 + 4) >> 2] | 0;
   if (i5) if (i5 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort(); else {
    HEAP32[i8 + 20 >> 2] = i5;
    HEAP32[i5 + 24 >> 2] = i8;
    i19 = i11;
    i9 = i10;
    break;
   } else {
    i19 = i11;
    i9 = i10;
   }
  } else {
   i19 = i11;
   i9 = i10;
  }
 } else {
  i19 = i14;
  i9 = i15;
 } while (0);
 i6 = HEAP32[1534] | 0;
 if (i16 >>> 0 < i6 >>> 0) _abort();
 i5 = i14 + (i15 + 4) | 0;
 i4 = HEAP32[i5 >> 2] | 0;
 if (!(i4 & 2)) {
  if ((i16 | 0) == (HEAP32[1536] | 0)) {
   i18 = (HEAP32[1533] | 0) + i9 | 0;
   HEAP32[1533] = i18;
   HEAP32[1536] = i19;
   HEAP32[i19 + 4 >> 2] = i18 | 1;
   if ((i19 | 0) != (HEAP32[1535] | 0)) return;
   HEAP32[1535] = 0;
   HEAP32[1532] = 0;
   return;
  }
  if ((i16 | 0) == (HEAP32[1535] | 0)) {
   i18 = (HEAP32[1532] | 0) + i9 | 0;
   HEAP32[1532] = i18;
   HEAP32[1535] = i19;
   HEAP32[i19 + 4 >> 2] = i18 | 1;
   HEAP32[i19 + i18 >> 2] = i18;
   return;
  }
  i7 = (i4 & -8) + i9 | 0;
  i1 = i4 >>> 3;
  do if (i4 >>> 0 >= 256) {
   i1 = HEAP32[i14 + (i15 + 24) >> 2] | 0;
   i3 = HEAP32[i14 + (i15 + 12) >> 2] | 0;
   do if ((i3 | 0) == (i16 | 0)) {
    i4 = i14 + (i15 + 20) | 0;
    i5 = HEAP32[i4 >> 2] | 0;
    if (!i5) {
     i4 = i14 + (i15 + 16) | 0;
     i5 = HEAP32[i4 >> 2] | 0;
     if (!i5) {
      i13 = 0;
      break;
     }
    }
    while (1) {
     i3 = i5 + 20 | 0;
     i2 = HEAP32[i3 >> 2] | 0;
     if (i2) {
      i5 = i2;
      i4 = i3;
      continue;
     }
     i3 = i5 + 16 | 0;
     i2 = HEAP32[i3 >> 2] | 0;
     if (!i2) break; else {
      i5 = i2;
      i4 = i3;
     }
    }
    if (i4 >>> 0 < i6 >>> 0) _abort(); else {
     HEAP32[i4 >> 2] = 0;
     i13 = i5;
     break;
    }
   } else {
    i2 = HEAP32[i14 + (i15 + 8) >> 2] | 0;
    if (i2 >>> 0 < i6 >>> 0) _abort();
    i5 = i2 + 12 | 0;
    if ((HEAP32[i5 >> 2] | 0) != (i16 | 0)) _abort();
    i4 = i3 + 8 | 0;
    if ((HEAP32[i4 >> 2] | 0) == (i16 | 0)) {
     HEAP32[i5 >> 2] = i3;
     HEAP32[i4 >> 2] = i2;
     i13 = i3;
     break;
    } else _abort();
   } while (0);
   if (i1) {
    i5 = HEAP32[i14 + (i15 + 28) >> 2] | 0;
    i4 = 6424 + (i5 << 2) | 0;
    if ((i16 | 0) == (HEAP32[i4 >> 2] | 0)) {
     HEAP32[i4 >> 2] = i13;
     if (!i13) {
      HEAP32[1531] = HEAP32[1531] & ~(1 << i5);
      break;
     }
    } else {
     if (i1 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort();
     i4 = i1 + 16 | 0;
     if ((HEAP32[i4 >> 2] | 0) == (i16 | 0)) HEAP32[i4 >> 2] = i13; else HEAP32[i1 + 20 >> 2] = i13;
     if (!i13) break;
    }
    i3 = HEAP32[1534] | 0;
    if (i13 >>> 0 < i3 >>> 0) _abort();
    HEAP32[i13 + 24 >> 2] = i1;
    i4 = HEAP32[i14 + (i15 + 16) >> 2] | 0;
    do if (i4) if (i4 >>> 0 < i3 >>> 0) _abort(); else {
     HEAP32[i13 + 16 >> 2] = i4;
     HEAP32[i4 + 24 >> 2] = i13;
     break;
    } while (0);
    i3 = HEAP32[i14 + (i15 + 20) >> 2] | 0;
    if (i3) if (i3 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort(); else {
     HEAP32[i13 + 20 >> 2] = i3;
     HEAP32[i3 + 24 >> 2] = i13;
     break;
    }
   }
  } else {
   i2 = HEAP32[i14 + (i15 + 8) >> 2] | 0;
   i3 = HEAP32[i14 + (i15 + 12) >> 2] | 0;
   i5 = 6160 + (i1 << 1 << 2) | 0;
   if ((i2 | 0) != (i5 | 0)) {
    if (i2 >>> 0 < i6 >>> 0) _abort();
    if ((HEAP32[i2 + 12 >> 2] | 0) != (i16 | 0)) _abort();
   }
   if ((i3 | 0) == (i2 | 0)) {
    HEAP32[1530] = HEAP32[1530] & ~(1 << i1);
    break;
   }
   if ((i3 | 0) != (i5 | 0)) {
    if (i3 >>> 0 < i6 >>> 0) _abort();
    i4 = i3 + 8 | 0;
    if ((HEAP32[i4 >> 2] | 0) == (i16 | 0)) i12 = i4; else _abort();
   } else i12 = i3 + 8 | 0;
   HEAP32[i2 + 12 >> 2] = i3;
   HEAP32[i12 >> 2] = i2;
  } while (0);
  HEAP32[i19 + 4 >> 2] = i7 | 1;
  HEAP32[i19 + i7 >> 2] = i7;
  if ((i19 | 0) == (HEAP32[1535] | 0)) {
   HEAP32[1532] = i7;
   return;
  } else i5 = i7;
 } else {
  HEAP32[i5 >> 2] = i4 & -2;
  HEAP32[i19 + 4 >> 2] = i9 | 1;
  HEAP32[i19 + i9 >> 2] = i9;
  i5 = i9;
 }
 i4 = i5 >>> 3;
 if (i5 >>> 0 < 256) {
  i2 = i4 << 1;
  i5 = 6160 + (i2 << 2) | 0;
  i1 = HEAP32[1530] | 0;
  i3 = 1 << i4;
  if (i1 & i3) {
   i3 = 6160 + (i2 + 2 << 2) | 0;
   i2 = HEAP32[i3 >> 2] | 0;
   if (i2 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort(); else {
    i17 = i3;
    i18 = i2;
   }
  } else {
   HEAP32[1530] = i1 | i3;
   i17 = 6160 + (i2 + 2 << 2) | 0;
   i18 = i5;
  }
  HEAP32[i17 >> 2] = i19;
  HEAP32[i18 + 12 >> 2] = i19;
  HEAP32[i19 + 8 >> 2] = i18;
  HEAP32[i19 + 12 >> 2] = i5;
  return;
 }
 i1 = i5 >>> 8;
 if (i1) if (i5 >>> 0 > 16777215) i4 = 31; else {
  i17 = (i1 + 1048320 | 0) >>> 16 & 8;
  i18 = i1 << i17;
  i16 = (i18 + 520192 | 0) >>> 16 & 4;
  i18 = i18 << i16;
  i4 = (i18 + 245760 | 0) >>> 16 & 2;
  i4 = 14 - (i16 | i17 | i4) + (i18 << i4 >>> 15) | 0;
  i4 = i5 >>> (i4 + 7 | 0) & 1 | i4 << 1;
 } else i4 = 0;
 i3 = 6424 + (i4 << 2) | 0;
 HEAP32[i19 + 28 >> 2] = i4;
 HEAP32[i19 + 20 >> 2] = 0;
 HEAP32[i19 + 16 >> 2] = 0;
 i2 = HEAP32[1531] | 0;
 i1 = 1 << i4;
 if (!(i2 & i1)) {
  HEAP32[1531] = i2 | i1;
  HEAP32[i3 >> 2] = i19;
  HEAP32[i19 + 24 >> 2] = i3;
  HEAP32[i19 + 12 >> 2] = i19;
  HEAP32[i19 + 8 >> 2] = i19;
  return;
 }
 i1 = HEAP32[i3 >> 2] | 0;
 L191 : do if ((HEAP32[i1 + 4 >> 2] & -8 | 0) != (i5 | 0)) {
  i4 = i5 << ((i4 | 0) == 31 ? 0 : 25 - (i4 >>> 1) | 0);
  while (1) {
   i2 = i1 + 16 + (i4 >>> 31 << 2) | 0;
   i3 = HEAP32[i2 >> 2] | 0;
   if (!i3) break;
   if ((HEAP32[i3 + 4 >> 2] & -8 | 0) == (i5 | 0)) {
    i1 = i3;
    break L191;
   } else {
    i4 = i4 << 1;
    i1 = i3;
   }
  }
  if (i2 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort();
  HEAP32[i2 >> 2] = i19;
  HEAP32[i19 + 24 >> 2] = i1;
  HEAP32[i19 + 12 >> 2] = i19;
  HEAP32[i19 + 8 >> 2] = i19;
  return;
 } while (0);
 i2 = i1 + 8 | 0;
 i3 = HEAP32[i2 >> 2] | 0;
 i18 = HEAP32[1534] | 0;
 if (!(i3 >>> 0 >= i18 >>> 0 & i1 >>> 0 >= i18 >>> 0)) _abort();
 HEAP32[i3 + 12 >> 2] = i19;
 HEAP32[i2 >> 2] = i19;
 HEAP32[i19 + 8 >> 2] = i3;
 HEAP32[i19 + 12 >> 2] = i1;
 HEAP32[i19 + 24 >> 2] = 0;
 return;
}

function _strstr(i3, i15) {
 i3 = i3 | 0;
 i15 = i15 | 0;
 var i1 = 0, i2 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i16 = 0, i17 = 0;
 i17 = STACKTOP;
 STACKTOP = STACKTOP + 1056 | 0;
 i14 = i17 + 1024 | 0;
 i16 = i17;
 i4 = HEAP8[i15 >> 0] | 0;
 if (!(i4 << 24 >> 24)) {
  i16 = i3;
  STACKTOP = i17;
  return i16 | 0;
 }
 i12 = _strchr(i3, i4 << 24 >> 24) | 0;
 if (!i12) {
  i16 = 0;
  STACKTOP = i17;
  return i16 | 0;
 }
 i5 = HEAP8[i15 + 1 >> 0] | 0;
 if (!(i5 << 24 >> 24)) {
  i16 = i12;
  STACKTOP = i17;
  return i16 | 0;
 }
 i2 = i12 + 1 | 0;
 i9 = HEAP8[i2 >> 0] | 0;
 if (!(i9 << 24 >> 24)) {
  i16 = 0;
  STACKTOP = i17;
  return i16 | 0;
 }
 i7 = HEAP8[i15 + 2 >> 0] | 0;
 if (!(i7 << 24 >> 24)) {
  i6 = i5 & 255 | (i4 & 255) << 8;
  i1 = i9;
  i5 = i12;
  i3 = HEAPU8[i12 >> 0] << 8 | i9 & 255;
  while (1) {
   i4 = i3 & 65535;
   if ((i4 | 0) == (i6 | 0)) {
    i2 = i5;
    break;
   }
   i1 = i2 + 1 | 0;
   i3 = HEAP8[i1 >> 0] | 0;
   if (!(i3 << 24 >> 24)) {
    i1 = 0;
    break;
   } else {
    i5 = i2;
    i2 = i1;
    i1 = i3;
    i3 = i3 & 255 | i4 << 8;
   }
  }
  i16 = i1 << 24 >> 24 != 0 ? i2 : 0;
  STACKTOP = i17;
  return i16 | 0;
 }
 i2 = i12 + 2 | 0;
 i8 = HEAP8[i2 >> 0] | 0;
 if (!(i8 << 24 >> 24)) {
  i16 = 0;
  STACKTOP = i17;
  return i16 | 0;
 }
 i6 = HEAP8[i15 + 3 >> 0] | 0;
 if (!(i6 << 24 >> 24)) {
  i5 = (i5 & 255) << 16 | (i4 & 255) << 24 | (i7 & 255) << 8;
  i1 = (i8 & 255) << 8 | (i9 & 255) << 16 | HEAPU8[i12 >> 0] << 24;
  if ((i1 | 0) == (i5 | 0)) i1 = i8; else {
   i3 = i1;
   do {
    i2 = i2 + 1 | 0;
    i1 = HEAP8[i2 >> 0] | 0;
    i3 = (i1 & 255 | i3) << 8;
   } while (!(i1 << 24 >> 24 == 0 | (i3 | 0) == (i5 | 0)));
  }
  i16 = i1 << 24 >> 24 != 0 ? i2 + -2 | 0 : 0;
  STACKTOP = i17;
  return i16 | 0;
 }
 i2 = i12 + 3 | 0;
 i1 = HEAP8[i2 >> 0] | 0;
 if (!(i1 << 24 >> 24)) {
  i16 = 0;
  STACKTOP = i17;
  return i16 | 0;
 }
 if (!(HEAP8[i15 + 4 >> 0] | 0)) {
  i6 = (i5 & 255) << 16 | (i4 & 255) << 24 | (i7 & 255) << 8 | i6 & 255;
  i3 = (i8 & 255) << 8 | (i9 & 255) << 16 | i1 & 255 | HEAPU8[i12 >> 0] << 24;
  if ((i3 | 0) != (i6 | 0)) do {
   i2 = i2 + 1 | 0;
   i1 = HEAP8[i2 >> 0] | 0;
   i3 = i1 & 255 | i3 << 8;
  } while (!(i1 << 24 >> 24 == 0 | (i3 | 0) == (i6 | 0)));
  i16 = i1 << 24 >> 24 != 0 ? i2 + -3 | 0 : 0;
  STACKTOP = i17;
  return i16 | 0;
 };
 HEAP32[i14 >> 2] = 0;
 HEAP32[i14 + 4 >> 2] = 0;
 HEAP32[i14 + 8 >> 2] = 0;
 HEAP32[i14 + 12 >> 2] = 0;
 HEAP32[i14 + 16 >> 2] = 0;
 HEAP32[i14 + 20 >> 2] = 0;
 HEAP32[i14 + 24 >> 2] = 0;
 HEAP32[i14 + 28 >> 2] = 0;
 i5 = 0;
 while (1) {
  if (!(HEAP8[i12 + i5 >> 0] | 0)) {
   i1 = 0;
   break;
  }
  i3 = i14 + (((i4 & 255) >>> 5 & 255) << 2) | 0;
  HEAP32[i3 >> 2] = HEAP32[i3 >> 2] | 1 << (i4 & 31);
  i3 = i5 + 1 | 0;
  HEAP32[i16 + ((i4 & 255) << 2) >> 2] = i3;
  i4 = HEAP8[i15 + i3 >> 0] | 0;
  if (!(i4 << 24 >> 24)) {
   i13 = i5;
   i10 = 23;
   break;
  } else i5 = i3;
 }
 L46 : do if ((i10 | 0) == 23) {
  L48 : do if (i3 >>> 0 > 1) {
   i4 = 1;
   i10 = -1;
   i5 = 0;
   L49 : while (1) {
    i8 = 1;
    while (1) {
     L53 : while (1) {
      i2 = 1;
      while (1) {
       i1 = HEAP8[i15 + (i2 + i10) >> 0] | 0;
       i6 = HEAP8[i15 + i4 >> 0] | 0;
       if (i1 << 24 >> 24 != i6 << 24 >> 24) {
        i7 = i4;
        i4 = i1;
        break L53;
       }
       if ((i2 | 0) == (i8 | 0)) break;
       i2 = i2 + 1 | 0;
       i4 = i2 + i5 | 0;
       if (i4 >>> 0 >= i3 >>> 0) {
        i5 = i10;
        i10 = i8;
        break L49;
       }
      }
      i5 = i5 + i8 | 0;
      i4 = i5 + 1 | 0;
      if (i4 >>> 0 >= i3 >>> 0) {
       i5 = i10;
       i10 = i8;
       break L49;
      }
     }
     i8 = i7 - i10 | 0;
     if ((i4 & 255) <= (i6 & 255)) break;
     i5 = i7 + 1 | 0;
     if (i5 >>> 0 < i3 >>> 0) {
      i4 = i5;
      i5 = i7;
     } else {
      i5 = i10;
      i10 = i8;
      break L49;
     }
    }
    i4 = i5 + 2 | 0;
    if (i4 >>> 0 >= i3 >>> 0) {
     i10 = 1;
     break;
    } else {
     i10 = i5;
     i5 = i5 + 1 | 0;
    }
   }
   i6 = 1;
   i2 = -1;
   i4 = 0;
   while (1) {
    i1 = i4;
    i4 = 1;
    while (1) {
     i9 = i1;
     L68 : while (1) {
      i1 = 1;
      while (1) {
       i8 = HEAP8[i15 + (i1 + i2) >> 0] | 0;
       i7 = HEAP8[i15 + i6 >> 0] | 0;
       if (i8 << 24 >> 24 != i7 << 24 >> 24) {
        i1 = i6;
        i6 = i9;
        break L68;
       }
       if ((i1 | 0) == (i4 | 0)) break;
       i1 = i1 + 1 | 0;
       i6 = i1 + i9 | 0;
       if (i6 >>> 0 >= i3 >>> 0) {
        i6 = i10;
        break L48;
       }
      }
      i9 = i9 + i4 | 0;
      i6 = i9 + 1 | 0;
      if (i6 >>> 0 >= i3 >>> 0) {
       i6 = i10;
       break L48;
      }
     }
     i4 = i1 - i2 | 0;
     if ((i8 & 255) >= (i7 & 255)) {
      i4 = i6;
      break;
     }
     i6 = i1 + 1 | 0;
     if (i6 >>> 0 >= i3 >>> 0) {
      i6 = i10;
      break L48;
     }
    }
    i6 = i4 + 2 | 0;
    if (i6 >>> 0 >= i3 >>> 0) {
     i2 = i4;
     i6 = i10;
     i4 = 1;
     break;
    } else {
     i2 = i4;
     i4 = i4 + 1 | 0;
    }
   }
  } else {
   i5 = -1;
   i2 = -1;
   i6 = 1;
   i4 = 1;
  } while (0);
  i11 = (i2 + 1 | 0) >>> 0 > (i5 + 1 | 0) >>> 0;
  i4 = i11 ? i4 : i6;
  i11 = i11 ? i2 : i5;
  i2 = i11 + 1 | 0;
  if (!(_memcmp(i15, i15 + i4 | 0, i2) | 0)) {
   i8 = i3 - i4 | 0;
   i9 = i3 | 63;
   if ((i3 | 0) == (i4 | 0)) i8 = i3; else {
    i1 = i12;
    i10 = 0;
    i5 = i12;
    L82 : while (1) {
     i7 = i1;
     do if ((i5 - i7 | 0) >>> 0 < i3 >>> 0) {
      i6 = _memchr(i5, 0, i9) | 0;
      if (i6) if ((i6 - i7 | 0) >>> 0 < i3 >>> 0) {
       i1 = 0;
       break L46;
      } else {
       i5 = i6;
       break;
      } else {
       i5 = i5 + i9 | 0;
       break;
      }
     } while (0);
     i6 = HEAP8[i1 + i13 >> 0] | 0;
     if (!(1 << (i6 & 31) & HEAP32[i14 + (((i6 & 255) >>> 5 & 255) << 2) >> 2])) {
      i1 = i1 + i3 | 0;
      i10 = 0;
      continue;
     }
     i12 = HEAP32[i16 + ((i6 & 255) << 2) >> 2] | 0;
     i6 = i3 - i12 | 0;
     if ((i3 | 0) != (i12 | 0)) {
      i1 = i1 + ((i10 | 0) != 0 & i6 >>> 0 < i4 >>> 0 ? i8 : i6) | 0;
      i10 = 0;
      continue;
     }
     i6 = i2 >>> 0 > i10 >>> 0 ? i2 : i10;
     i7 = HEAP8[i15 + i6 >> 0] | 0;
     L96 : do if (!(i7 << 24 >> 24)) i6 = i2; else {
      while (1) {
       if (i7 << 24 >> 24 != (HEAP8[i1 + i6 >> 0] | 0)) break;
       i6 = i6 + 1 | 0;
       i7 = HEAP8[i15 + i6 >> 0] | 0;
       if (!(i7 << 24 >> 24)) {
        i6 = i2;
        break L96;
       }
      }
      i1 = i1 + (i6 - i11) | 0;
      i10 = 0;
      continue L82;
     } while (0);
     do {
      if (i6 >>> 0 <= i10 >>> 0) break L46;
      i6 = i6 + -1 | 0;
     } while ((HEAP8[i15 + i6 >> 0] | 0) == (HEAP8[i1 + i6 >> 0] | 0));
     i1 = i1 + i4 | 0;
     i10 = i8;
    }
   }
  } else {
   i8 = i3 - i11 + -1 | 0;
   i9 = i3 | 63;
   i8 = (i11 >>> 0 > i8 >>> 0 ? i11 : i8) + 1 | 0;
  }
  i10 = i15 + i2 | 0;
  i1 = i12;
  i4 = i12;
  L106 : while (1) {
   i6 = i1;
   do if ((i4 - i6 | 0) >>> 0 < i3 >>> 0) {
    i5 = _memchr(i4, 0, i9) | 0;
    if (i5) if ((i5 - i6 | 0) >>> 0 < i3 >>> 0) {
     i1 = 0;
     break L46;
    } else break; else {
     i5 = i4 + i9 | 0;
     break;
    }
   } else i5 = i4; while (0);
   i6 = HEAP8[i1 + i13 >> 0] | 0;
   if (!(1 << (i6 & 31) & HEAP32[i14 + (((i6 & 255) >>> 5 & 255) << 2) >> 2])) {
    i1 = i1 + i3 | 0;
    i4 = i5;
    continue;
   }
   i6 = HEAP32[i16 + ((i6 & 255) << 2) >> 2] | 0;
   if ((i3 | 0) != (i6 | 0)) {
    i1 = i1 + (i3 - i6) | 0;
    i4 = i5;
    continue;
   }
   i6 = HEAP8[i10 >> 0] | 0;
   L120 : do if (!(i6 << 24 >> 24)) i6 = i2; else {
    i4 = i2;
    while (1) {
     if (i6 << 24 >> 24 != (HEAP8[i1 + i4 >> 0] | 0)) {
      i6 = i4;
      break;
     }
     i4 = i4 + 1 | 0;
     i6 = HEAP8[i15 + i4 >> 0] | 0;
     if (!(i6 << 24 >> 24)) {
      i6 = i2;
      break L120;
     }
    }
    i1 = i1 + (i6 - i11) | 0;
    i4 = i5;
    continue L106;
   } while (0);
   do {
    if (!i6) break L46;
    i6 = i6 + -1 | 0;
   } while ((HEAP8[i15 + i6 >> 0] | 0) == (HEAP8[i1 + i6 >> 0] | 0));
   i1 = i1 + i8 | 0;
   i4 = i5;
  }
 } while (0);
 i16 = i1;
 STACKTOP = i17;
 return i16 | 0;
}

function _parg_shader_bind(i23) {
 i23 = i23 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i24 = 0, i25 = 0;
 i25 = STACKTOP;
 STACKTOP = STACKTOP + 1216 | 0;
 i24 = i25 + 40 | 0;
 i17 = i25 + 24 | 0;
 i16 = i25 + 32 | 0;
 i12 = i25 + 16 | 0;
 i13 = i25;
 i14 = i25 + 8 | 0;
 i22 = i25 + 1208 | 0;
 i19 = i25 + 1080 | 0;
 i21 = i25 + 56 | 0;
 i18 = i25 + 52 | 0;
 i20 = i25 + 48 | 0;
 i2 = HEAP32[252] | 0;
 if (!i2) {
  i2 = _calloc(1, 28) | 0;
  HEAP32[252] = i2;
 }
 i5 = HEAP32[i2 >> 2] | 0;
 L4 : do if (!i5) i5 = 0; else {
  i9 = i5 + -1 | 0;
  i8 = i9 & i23;
  i7 = HEAP32[i2 + 16 >> 2] | 0;
  i11 = i2 + 20 | 0;
  i4 = i8;
  i6 = 0;
  while (1) {
   i1 = HEAP32[i7 + (i4 >>> 4 << 2) >> 2] | 0;
   i3 = i4 << 1 & 30;
   i10 = i1 >>> i3;
   if (i10 & 2) break;
   if ((i10 & 1 | 0) == 0 ? (HEAP32[(HEAP32[i11 >> 2] | 0) + (i4 << 2) >> 2] | 0) == (i23 | 0) : 0) break;
   i6 = i6 + 1 | 0;
   i4 = i6 + i4 & i9;
   if ((i4 | 0) == (i8 | 0)) break L4;
  }
  i5 = (3 << i3 & i1 | 0) == 0 ? i4 : i5;
 } while (0);
 if ((i5 | 0) == (HEAP32[i2 >> 2] | 0)) {
  i5 = HEAP32[150] | 0;
  i3 = HEAP32[i5 >> 2] | 0;
  L17 : do if (!i3) {
   i4 = 0;
   i15 = 18;
  } else {
   i11 = i3 + -1 | 0;
   i10 = i11 & i23;
   i9 = HEAP32[i5 + 16 >> 2] | 0;
   i8 = i5 + 20 | 0;
   i4 = i10;
   i6 = 0;
   while (1) {
    i1 = HEAP32[i9 + (i4 >>> 4 << 2) >> 2] | 0;
    i2 = i4 << 1 & 30;
    i7 = i1 >>> i2;
    if (i7 & 2) break;
    if ((i7 & 1 | 0) == 0 ? (HEAP32[(HEAP32[i8 >> 2] | 0) + (i4 << 2) >> 2] | 0) == (i23 | 0) : 0) break;
    i6 = i6 + 1 | 0;
    i4 = i6 + i4 & i11;
    if ((i4 | 0) == (i10 | 0)) {
     i15 = 19;
     break L17;
    }
   }
   i4 = (3 << i2 & i1 | 0) == 0 ? i4 : i3;
   i15 = 18;
  } while (0);
  if ((i15 | 0) == 18) if ((i4 | 0) == (i3 | 0)) i15 = 19;
  if ((i15 | 0) == 19) {
   i5 = _parg_token_to_string(i23) | 0;
   HEAP32[i14 >> 2] = 1016;
   HEAP32[i14 + 4 >> 2] = i5;
   _printf(800, i14 | 0) | 0;
   i5 = HEAP32[150] | 0;
   i4 = i3;
   i3 = HEAP32[i5 >> 2] | 0;
  }
  if ((i4 | 0) == (i3 | 0)) ___assert_fail(1032, 728, 184, 1080);
  HEAP32[i22 >> 2] = HEAP32[(HEAP32[i5 + 24 >> 2] | 0) + (i4 << 2) >> 2];
  i3 = HEAP32[152] | 0;
  i4 = HEAP32[i3 >> 2] | 0;
  L34 : do if (!i4) {
   i5 = 0;
   i15 = 29;
  } else {
   i6 = i4 + -1 | 0;
   i7 = i6 & i23;
   i8 = HEAP32[i3 + 16 >> 2] | 0;
   i9 = i3 + 20 | 0;
   i5 = i7;
   i11 = 0;
   while (1) {
    i1 = HEAP32[i8 + (i5 >>> 4 << 2) >> 2] | 0;
    i2 = i5 << 1 & 30;
    i10 = i1 >>> i2;
    if (i10 & 2) break;
    if ((i10 & 1 | 0) == 0 ? (HEAP32[(HEAP32[i9 >> 2] | 0) + (i5 << 2) >> 2] | 0) == (i23 | 0) : 0) break;
    i11 = i11 + 1 | 0;
    i5 = i11 + i5 & i6;
    if ((i5 | 0) == (i7 | 0)) {
     i15 = 30;
     break L34;
    }
   }
   i5 = (3 << i2 & i1 | 0) == 0 ? i5 : i4;
   i15 = 29;
  } while (0);
  if ((i15 | 0) == 29) if ((i5 | 0) == (i4 | 0)) i15 = 30;
  if ((i15 | 0) == 30) {
   i3 = _parg_token_to_string(i23) | 0;
   HEAP32[i13 >> 2] = 1096;
   HEAP32[i13 + 4 >> 2] = i3;
   _printf(800, i13 | 0) | 0;
   i3 = HEAP32[152] | 0;
   i5 = i4;
   i4 = HEAP32[i3 >> 2] | 0;
  }
  if ((i5 | 0) == (i4 | 0)) ___assert_fail(1112, 728, 190, 1080);
  HEAP32[i19 >> 2] = HEAP32[(HEAP32[i3 + 24 >> 2] | 0) + (i5 << 2) >> 2];
  HEAP32[i18 >> 2] = 0;
  i3 = _glCreateShader(35633) | 0;
  _glShaderSource(i3 | 0, 1, i22 | 0, 0);
  _glCompileShader(i3 | 0);
  _glGetShaderiv(i3 | 0, 35713, i18 | 0);
  _glGetShaderInfoLog(i3 | 0, 1024, 0, i21 | 0);
  if ((HEAP32[i18 >> 2] | 0) == 0 ? (i14 = _parg_token_to_string(i23) | 0, HEAP32[i12 >> 2] = i14, HEAP32[i12 + 4 >> 2] = i21, _printf(800, i12 | 0) | 0, (HEAP32[i18 >> 2] | 0) == 0) : 0) ___assert_fail(1160, 728, 202, 1080);
  i2 = _glCreateShader(35632) | 0;
  _glShaderSource(i2 | 0, 1, i19 | 0, 0);
  _glCompileShader(i2 | 0);
  _glGetShaderiv(i2 | 0, 35713, i18 | 0);
  _glGetShaderInfoLog(i2 | 0, 1024, 0, i21 | 0);
  if ((HEAP32[i18 >> 2] | 0) == 0 ? (i14 = _parg_token_to_string(i23) | 0, HEAP32[i16 >> 2] = i14, HEAP32[i16 + 4 >> 2] = i21, _printf(800, i16 | 0) | 0, (HEAP32[i18 >> 2] | 0) == 0) : 0) ___assert_fail(1160, 728, 209, 1080);
  i1 = _glCreateProgram() | 0;
  _glAttachShader(i1 | 0, i3 | 0);
  _glAttachShader(i1 | 0, i2 | 0);
  i2 = HEAP32[154] | 0;
  if (HEAP32[i2 >> 2] | 0) {
   i3 = 0;
   do {
    if (!(3 << (i3 << 1 & 30) & HEAP32[(HEAP32[i2 + 16 >> 2] | 0) + (i3 >>> 4 << 2) >> 2])) {
     i16 = HEAP32[(HEAP32[i2 + 24 >> 2] | 0) + (i3 << 2) >> 2] | 0;
     _glBindAttribLocation(i1 | 0, i16 | 0, _parg_token_to_string(HEAP32[(HEAP32[i2 + 20 >> 2] | 0) + (i3 << 2) >> 2] | 0) | 0);
     i2 = HEAP32[154] | 0;
    }
    i3 = i3 + 1 | 0;
   } while ((i3 | 0) != (HEAP32[i2 >> 2] | 0));
  }
  _glLinkProgram(i1 | 0);
  _glGetProgramiv(i1 | 0, 35714, i20 | 0);
  _glGetProgramInfoLog(i1 | 0, 1024, 0, i21 | 0);
  if ((HEAP32[i20 >> 2] | 0) == 0 ? (i16 = _parg_token_to_string(i23) | 0, HEAP32[i17 >> 2] = i16, HEAP32[i17 + 4 >> 2] = i21, _printf(800, i17 | 0) | 0, (HEAP32[i20 >> 2] | 0) == 0) : 0) ___assert_fail(1176, 728, 230, 1080);
  i13 = HEAP32[252] | 0;
  i14 = i13 + 8 | 0;
  do if ((HEAP32[i14 >> 2] | 0) >>> 0 >= (HEAP32[i13 + 12 >> 2] | 0) >>> 0) {
   i2 = HEAP32[i13 >> 2] | 0;
   if (i2 >>> 0 > HEAP32[i13 + 4 >> 2] << 1 >>> 0) {
    if ((_kh_resize_glmap(i13, i2 + -1 | 0) | 0) >= 0) {
     i15 = 52;
     break;
    }
    i2 = HEAP32[i13 >> 2] | 0;
    break;
   } else {
    if ((_kh_resize_glmap(i13, i2 + 1 | 0) | 0) >= 0) {
     i15 = 52;
     break;
    }
    i2 = HEAP32[i13 >> 2] | 0;
    break;
   }
  } else i15 = 52; while (0);
  do if ((i15 | 0) == 52) {
   i7 = HEAP32[i13 >> 2] | 0;
   i11 = i7 + -1 | 0;
   i5 = i11 & i23;
   i12 = HEAP32[i13 + 16 >> 2] | 0;
   do if (!(2 << (i5 << 1 & 30) & HEAP32[i12 + (i5 >>> 4 << 2) >> 2])) {
    i10 = i13 + 20 | 0;
    i9 = i5;
    i2 = i7;
    i8 = 0;
    while (1) {
     i4 = HEAP32[i12 + (i9 >>> 4 << 2) >> 2] | 0;
     i3 = i9 << 1 & 30;
     i6 = i4 >>> i3;
     if (i6 & 2) {
      i5 = i9;
      break;
     }
     if ((i6 & 1 | 0) == 0 ? (HEAP32[(HEAP32[i10 >> 2] | 0) + (i9 << 2) >> 2] | 0) == (i23 | 0) : 0) {
      i5 = i9;
      break;
     }
     i2 = (i4 & 1 << i3 | 0) == 0 ? i2 : i9;
     i8 = i8 + 1 | 0;
     i9 = i8 + i9 & i11;
     if ((i9 | 0) == (i5 | 0)) {
      i15 = 58;
      break;
     }
    }
    if ((i15 | 0) == 58) if ((i2 | 0) == (i7 | 0)) i2 = i7; else break;
    i2 = ((i2 | 0) == (i7 | 0) ? 1 : (2 << (i5 << 1 & 30) & HEAP32[i12 + (i5 >>> 4 << 2) >> 2] | 0) == 0) ? i5 : i2;
   } else i2 = i5; while (0);
   i3 = i12 + (i2 >>> 4 << 2) | 0;
   i4 = i2 << 1 & 30;
   i5 = (HEAP32[i3 >> 2] | 0) >>> i4;
   if (i5 & 2) {
    HEAP32[(HEAP32[i13 + 20 >> 2] | 0) + (i2 << 2) >> 2] = i23;
    HEAP32[i3 >> 2] = HEAP32[i3 >> 2] & ~(3 << i4);
    i17 = i13 + 4 | 0;
    HEAP32[i17 >> 2] = (HEAP32[i17 >> 2] | 0) + 1;
    HEAP32[i14 >> 2] = (HEAP32[i14 >> 2] | 0) + 1;
    break;
   }
   if (i5 & 1) {
    HEAP32[(HEAP32[i13 + 20 >> 2] | 0) + (i2 << 2) >> 2] = i23;
    HEAP32[i3 >> 2] = HEAP32[i3 >> 2] & ~(3 << i4);
    i17 = i13 + 4 | 0;
    HEAP32[i17 >> 2] = (HEAP32[i17 >> 2] | 0) + 1;
   }
  } while (0);
  HEAP32[(HEAP32[(HEAP32[252] | 0) + 24 >> 2] | 0) + (i2 << 2) >> 2] = i1;
  _glGetProgramiv(i1 | 0, 35718, i22 | 0);
  i17 = HEAP32[i22 >> 2] | 0;
  i2 = i17 + -1 | 0;
  HEAP32[i22 >> 2] = i2;
  if (i17) do {
   _glGetActiveUniform(i1 | 0, i2 | 0, 128, 0, i21 | 0, i18 | 0, i19 | 0);
   i16 = _glGetUniformLocation(i1 | 0, i19 | 0) | 0;
   i17 = (_parg_token_from_string(i19) | 0) ^ i23;
   i17 = _kh_put_imap(HEAP32[156] | 0, i17, i20) | 0;
   HEAP32[(HEAP32[(HEAP32[156] | 0) + 24 >> 2] | 0) + (i17 << 2) >> 2] = i16;
   i17 = HEAP32[i22 >> 2] | 0;
   i2 = i17 + -1 | 0;
   HEAP32[i22 >> 2] = i2;
  } while ((i17 | 0) != 0);
 } else i1 = HEAP32[(HEAP32[i2 + 24 >> 2] | 0) + (i5 << 2) >> 2] | 0;
 if (!i1) {
  i25 = _parg_token_to_string(i23) | 0;
  HEAP32[i24 >> 2] = 1192;
  HEAP32[i24 + 4 >> 2] = i25;
  _printf(800, i24 | 0) | 0;
  ___assert_fail(1208, 728, 289, 1216);
 } else {
  _glUseProgram(i1 | 0);
  HEAP32[250] = i23;
  STACKTOP = i25;
  return;
 }
}

function _try_realloc_chunk(i15, i14) {
 i15 = i15 | 0;
 i14 = i14 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0;
 i12 = i15 + 4 | 0;
 i13 = HEAP32[i12 >> 2] | 0;
 i7 = i13 & -8;
 i9 = i15 + i7 | 0;
 i6 = HEAP32[1534] | 0;
 i2 = i13 & 3;
 if (!((i2 | 0) != 1 & i15 >>> 0 >= i6 >>> 0 & i15 >>> 0 < i9 >>> 0)) _abort();
 i1 = i15 + (i7 | 4) | 0;
 i4 = HEAP32[i1 >> 2] | 0;
 if (!(i4 & 1)) _abort();
 if (!i2) {
  if (i14 >>> 0 < 256) {
   i15 = 0;
   return i15 | 0;
  }
  if (i7 >>> 0 >= (i14 + 4 | 0) >>> 0 ? (i7 - i14 | 0) >>> 0 <= HEAP32[1650] << 1 >>> 0 : 0) return i15 | 0;
  i15 = 0;
  return i15 | 0;
 }
 if (i7 >>> 0 >= i14 >>> 0) {
  i2 = i7 - i14 | 0;
  if (i2 >>> 0 <= 15) return i15 | 0;
  HEAP32[i12 >> 2] = i13 & 1 | i14 | 2;
  HEAP32[i15 + (i14 + 4) >> 2] = i2 | 3;
  HEAP32[i1 >> 2] = HEAP32[i1 >> 2] | 1;
  _dispose_chunk(i15 + i14 | 0, i2);
  return i15 | 0;
 }
 if ((i9 | 0) == (HEAP32[1536] | 0)) {
  i2 = (HEAP32[1533] | 0) + i7 | 0;
  if (i2 >>> 0 <= i14 >>> 0) {
   i15 = 0;
   return i15 | 0;
  }
  i11 = i2 - i14 | 0;
  HEAP32[i12 >> 2] = i13 & 1 | i14 | 2;
  HEAP32[i15 + (i14 + 4) >> 2] = i11 | 1;
  HEAP32[1536] = i15 + i14;
  HEAP32[1533] = i11;
  return i15 | 0;
 }
 if ((i9 | 0) == (HEAP32[1535] | 0)) {
  i2 = (HEAP32[1532] | 0) + i7 | 0;
  if (i2 >>> 0 < i14 >>> 0) {
   i15 = 0;
   return i15 | 0;
  }
  i1 = i2 - i14 | 0;
  if (i1 >>> 0 > 15) {
   HEAP32[i12 >> 2] = i13 & 1 | i14 | 2;
   HEAP32[i15 + (i14 + 4) >> 2] = i1 | 1;
   HEAP32[i15 + i2 >> 2] = i1;
   i2 = i15 + (i2 + 4) | 0;
   HEAP32[i2 >> 2] = HEAP32[i2 >> 2] & -2;
   i2 = i15 + i14 | 0;
  } else {
   HEAP32[i12 >> 2] = i13 & 1 | i2 | 2;
   i2 = i15 + (i2 + 4) | 0;
   HEAP32[i2 >> 2] = HEAP32[i2 >> 2] | 1;
   i2 = 0;
   i1 = 0;
  }
  HEAP32[1532] = i1;
  HEAP32[1535] = i2;
  return i15 | 0;
 }
 if (i4 & 2) {
  i15 = 0;
  return i15 | 0;
 }
 i10 = (i4 & -8) + i7 | 0;
 if (i10 >>> 0 < i14 >>> 0) {
  i15 = 0;
  return i15 | 0;
 }
 i11 = i10 - i14 | 0;
 i3 = i4 >>> 3;
 do if (i4 >>> 0 >= 256) {
  i5 = HEAP32[i15 + (i7 + 24) >> 2] | 0;
  i4 = HEAP32[i15 + (i7 + 12) >> 2] | 0;
  do if ((i4 | 0) == (i9 | 0)) {
   i1 = i15 + (i7 + 20) | 0;
   i2 = HEAP32[i1 >> 2] | 0;
   if (!i2) {
    i1 = i15 + (i7 + 16) | 0;
    i2 = HEAP32[i1 >> 2] | 0;
    if (!i2) {
     i8 = 0;
     break;
    }
   }
   while (1) {
    i3 = i2 + 20 | 0;
    i4 = HEAP32[i3 >> 2] | 0;
    if (i4) {
     i2 = i4;
     i1 = i3;
     continue;
    }
    i4 = i2 + 16 | 0;
    i3 = HEAP32[i4 >> 2] | 0;
    if (!i3) break; else {
     i2 = i3;
     i1 = i4;
    }
   }
   if (i1 >>> 0 < i6 >>> 0) _abort(); else {
    HEAP32[i1 >> 2] = 0;
    i8 = i2;
    break;
   }
  } else {
   i3 = HEAP32[i15 + (i7 + 8) >> 2] | 0;
   if (i3 >>> 0 < i6 >>> 0) _abort();
   i2 = i3 + 12 | 0;
   if ((HEAP32[i2 >> 2] | 0) != (i9 | 0)) _abort();
   i1 = i4 + 8 | 0;
   if ((HEAP32[i1 >> 2] | 0) == (i9 | 0)) {
    HEAP32[i2 >> 2] = i4;
    HEAP32[i1 >> 2] = i3;
    i8 = i4;
    break;
   } else _abort();
  } while (0);
  if (i5) {
   i2 = HEAP32[i15 + (i7 + 28) >> 2] | 0;
   i1 = 6424 + (i2 << 2) | 0;
   if ((i9 | 0) == (HEAP32[i1 >> 2] | 0)) {
    HEAP32[i1 >> 2] = i8;
    if (!i8) {
     HEAP32[1531] = HEAP32[1531] & ~(1 << i2);
     break;
    }
   } else {
    if (i5 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort();
    i2 = i5 + 16 | 0;
    if ((HEAP32[i2 >> 2] | 0) == (i9 | 0)) HEAP32[i2 >> 2] = i8; else HEAP32[i5 + 20 >> 2] = i8;
    if (!i8) break;
   }
   i1 = HEAP32[1534] | 0;
   if (i8 >>> 0 < i1 >>> 0) _abort();
   HEAP32[i8 + 24 >> 2] = i5;
   i2 = HEAP32[i15 + (i7 + 16) >> 2] | 0;
   do if (i2) if (i2 >>> 0 < i1 >>> 0) _abort(); else {
    HEAP32[i8 + 16 >> 2] = i2;
    HEAP32[i2 + 24 >> 2] = i8;
    break;
   } while (0);
   i2 = HEAP32[i15 + (i7 + 20) >> 2] | 0;
   if (i2) if (i2 >>> 0 < (HEAP32[1534] | 0) >>> 0) _abort(); else {
    HEAP32[i8 + 20 >> 2] = i2;
    HEAP32[i2 + 24 >> 2] = i8;
    break;
   }
  }
 } else {
  i4 = HEAP32[i15 + (i7 + 8) >> 2] | 0;
  i1 = HEAP32[i15 + (i7 + 12) >> 2] | 0;
  i2 = 6160 + (i3 << 1 << 2) | 0;
  if ((i4 | 0) != (i2 | 0)) {
   if (i4 >>> 0 < i6 >>> 0) _abort();
   if ((HEAP32[i4 + 12 >> 2] | 0) != (i9 | 0)) _abort();
  }
  if ((i1 | 0) == (i4 | 0)) {
   HEAP32[1530] = HEAP32[1530] & ~(1 << i3);
   break;
  }
  if ((i1 | 0) != (i2 | 0)) {
   if (i1 >>> 0 < i6 >>> 0) _abort();
   i2 = i1 + 8 | 0;
   if ((HEAP32[i2 >> 2] | 0) == (i9 | 0)) i5 = i2; else _abort();
  } else i5 = i1 + 8 | 0;
  HEAP32[i4 + 12 >> 2] = i1;
  HEAP32[i5 >> 2] = i4;
 } while (0);
 if (i11 >>> 0 < 16) {
  HEAP32[i12 >> 2] = i10 | i13 & 1 | 2;
  i14 = i15 + (i10 | 4) | 0;
  HEAP32[i14 >> 2] = HEAP32[i14 >> 2] | 1;
  return i15 | 0;
 } else {
  HEAP32[i12 >> 2] = i13 & 1 | i14 | 2;
  HEAP32[i15 + (i14 + 4) >> 2] = i11 | 3;
  i13 = i15 + (i10 | 4) | 0;
  HEAP32[i13 >> 2] = HEAP32[i13 >> 2] | 1;
  _dispose_chunk(i15 + i14 | 0, i11);
  return i15 | 0;
 }
 return 0;
}

function _sdsMakeRoomFor(i11, i3) {
 i11 = i11 | 0;
 i3 = i3 | 0;
 var i1 = 0, i2 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0;
 i1 = HEAPU8[i11 + -1 >> 0] | 0;
 i8 = i1 & 7;
 if ((i8 | 0) == 1) i2 = (HEAPU8[i11 + -2 >> 0] | 0) - (HEAPU8[i11 + -3 >> 0] | 0) | 0; else if ((i8 | 0) == 2) {
  i2 = i11 + -5 | 0;
  i10 = i11 + -3 | 0;
  i2 = ((HEAPU8[i10 >> 0] | HEAPU8[i10 + 1 >> 0] << 8) & 65535) - ((HEAPU8[i2 >> 0] | HEAPU8[i2 + 1 >> 0] << 8) & 65535) | 0;
 } else if ((i8 | 0) == 3) {
  i2 = i11 + -9 | 0;
  i10 = i11 + -5 | 0;
  i2 = (HEAPU8[i10 >> 0] | HEAPU8[i10 + 1 >> 0] << 8 | HEAPU8[i10 + 2 >> 0] << 16 | HEAPU8[i10 + 3 >> 0] << 24) - (HEAPU8[i2 >> 0] | HEAPU8[i2 + 1 >> 0] << 8 | HEAPU8[i2 + 2 >> 0] << 16 | HEAPU8[i2 + 3 >> 0] << 24) | 0;
 } else if ((i8 | 0) == 4) {
  i9 = i11 + -9 | 0;
  i7 = i9;
  i9 = i9 + 4 | 0;
  i2 = i11 + -17 | 0;
  i10 = i2;
  i2 = i2 + 4 | 0;
  i2 = _i64Subtract(HEAPU8[i7 >> 0] | HEAPU8[i7 + 1 >> 0] << 8 | HEAPU8[i7 + 2 >> 0] << 16 | HEAPU8[i7 + 3 >> 0] << 24 | 0, HEAPU8[i9 >> 0] | HEAPU8[i9 + 1 >> 0] << 8 | HEAPU8[i9 + 2 >> 0] << 16 | HEAPU8[i9 + 3 >> 0] << 24 | 0, HEAPU8[i10 >> 0] | HEAPU8[i10 + 1 >> 0] << 8 | HEAPU8[i10 + 2 >> 0] << 16 | HEAPU8[i10 + 3 >> 0] << 24 | 0, HEAPU8[i2 >> 0] | HEAPU8[i2 + 1 >> 0] << 8 | HEAPU8[i2 + 2 >> 0] << 16 | HEAPU8[i2 + 3 >> 0] << 24 | 0) | 0;
 } else i2 = 0;
 if (i2 >>> 0 >= i3 >>> 0) return i11 | 0;
 switch (i8 | 0) {
 case 0:
  {
   i2 = 1;
   i9 = i1 >>> 3;
   break;
  }
 case 1:
  {
   i2 = 3;
   i9 = HEAPU8[i11 + -3 >> 0] | 0;
   break;
  }
 case 2:
  {
   i9 = i11 + -5 | 0;
   i2 = 5;
   i9 = (HEAPU8[i9 >> 0] | HEAPU8[i9 + 1 >> 0] << 8) & 65535;
   break;
  }
 case 3:
  {
   i9 = i11 + -9 | 0;
   i2 = 9;
   i9 = HEAPU8[i9 >> 0] | HEAPU8[i9 + 1 >> 0] << 8 | HEAPU8[i9 + 2 >> 0] << 16 | HEAPU8[i9 + 3 >> 0] << 24;
   break;
  }
 case 4:
  {
   i9 = i11 + -17 | 0;
   i2 = 17;
   i9 = HEAPU8[i9 >> 0] | HEAPU8[i9 + 1 >> 0] << 8 | HEAPU8[i9 + 2 >> 0] << 16 | HEAPU8[i9 + 3 >> 0] << 24;
   break;
  }
 default:
  {
   i2 = 0;
   i9 = 0;
  }
 }
 i7 = i11 + (0 - i2) | 0;
 i10 = i9 + i3 | 0;
 i10 = i10 >>> 0 < 1048576 ? i10 << 1 : i10 + 1048576 | 0;
 if (i10 >>> 0 >= 32) if (i10 >>> 0 >= 255) if (i10 >>> 0 < 65535) i2 = 2; else i2 = (i10 | 0) == -1 ? 4 : 3; else i2 = 1; else i2 = 0;
 i4 = i2 << 24 >> 24 == 0 ? 1 : i2;
 i5 = i4 & 255;
 switch (i5 | 0) {
 case 1:
  {
   i6 = 3;
   break;
  }
 case 2:
  {
   i6 = 5;
   break;
  }
 case 3:
  {
   i6 = 9;
   break;
  }
 case 4:
  {
   i6 = 17;
   break;
  }
 case 0:
  {
   i6 = 1;
   break;
  }
 default:
  i6 = 0;
 }
 i3 = i10 + 1 + i6 | 0;
 L29 : do if ((i8 | 0) == (i5 | 0)) {
  i1 = _realloc(i7, i3) | 0;
  if (!i1) {
   i11 = 0;
   return i11 | 0;
  } else {
   i1 = i1 + i6 | 0;
   break;
  }
 } else {
  i3 = _malloc(i3) | 0;
  if (!i3) {
   i11 = 0;
   return i11 | 0;
  }
  i1 = i3 + i6 | 0;
  _memcpy(i1 | 0, i11 | 0, i9 + 1 | 0) | 0;
  _free(i7);
  i2 = i3 + (i6 + -1) | 0;
  HEAP8[i2 >> 0] = i4;
  switch (i5 | 0) {
  case 0:
   {
    HEAP8[i2 >> 0] = i9 << 3;
    break L29;
   }
  case 1:
   {
    HEAP8[i3 + (i6 + -3) >> 0] = i9;
    break L29;
   }
  case 2:
   {
    i9 = i9 & 65535;
    i11 = i3 + (i6 + -5) | 0;
    HEAP8[i11 >> 0] = i9;
    HEAP8[i11 + 1 >> 0] = i9 >> 8;
    break L29;
   }
  case 3:
   {
    i11 = i3 + (i6 + -9) | 0;
    HEAP8[i11 >> 0] = i9;
    HEAP8[i11 + 1 >> 0] = i9 >> 8;
    HEAP8[i11 + 2 >> 0] = i9 >> 16;
    HEAP8[i11 + 3 >> 0] = i9 >> 24;
    break L29;
   }
  case 4:
   {
    i11 = i3 + (i6 + -17) | 0;
    i8 = i11;
    HEAP8[i8 >> 0] = i9;
    HEAP8[i8 + 1 >> 0] = i9 >> 8;
    HEAP8[i8 + 2 >> 0] = i9 >> 16;
    HEAP8[i8 + 3 >> 0] = i9 >> 24;
    i11 = i11 + 4 | 0;
    HEAP8[i11 >> 0] = 0;
    HEAP8[i11 + 1 >> 0] = 0;
    HEAP8[i11 + 2 >> 0] = 0;
    HEAP8[i11 + 3 >> 0] = 0;
    break L29;
   }
  default:
   break L29;
  }
 } while (0);
 i2 = (HEAPU8[i1 + -1 >> 0] | 0) & 7;
 if ((i2 | 0) == 1) {
  HEAP8[i1 + -2 >> 0] = i10;
  i11 = i1;
  return i11 | 0;
 } else if ((i2 | 0) == 2) {
  i10 = i10 & 65535;
  i11 = i1 + -3 | 0;
  HEAP8[i11 >> 0] = i10;
  HEAP8[i11 + 1 >> 0] = i10 >> 8;
  i11 = i1;
  return i11 | 0;
 } else if ((i2 | 0) == 3) {
  i11 = i1 + -5 | 0;
  HEAP8[i11 >> 0] = i10;
  HEAP8[i11 + 1 >> 0] = i10 >> 8;
  HEAP8[i11 + 2 >> 0] = i10 >> 16;
  HEAP8[i11 + 3 >> 0] = i10 >> 24;
  i11 = i1;
  return i11 | 0;
 } else if ((i2 | 0) == 4) {
  i11 = i1 + -9 | 0;
  i9 = i11;
  HEAP8[i9 >> 0] = i10;
  HEAP8[i9 + 1 >> 0] = i10 >> 8;
  HEAP8[i9 + 2 >> 0] = i10 >> 16;
  HEAP8[i9 + 3 >> 0] = i10 >> 24;
  i11 = i11 + 4 | 0;
  HEAP8[i11 >> 0] = 0;
  HEAP8[i11 + 1 >> 0] = 0;
  HEAP8[i11 + 2 >> 0] = 0;
  HEAP8[i11 + 3 >> 0] = 0;
  i11 = i1;
  return i11 | 0;
 } else {
  i11 = i1;
  return i11 | 0;
 }
 return 0;
}

function ___udivmoddi4(i8, i7, i2, i12, i14) {
 i8 = i8 | 0;
 i7 = i7 | 0;
 i2 = i2 | 0;
 i12 = i12 | 0;
 i14 = i14 | 0;
 var i1 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i9 = 0, i10 = 0, i11 = 0, i13 = 0, i15 = 0;
 i11 = i8;
 i9 = i7;
 i10 = i9;
 i6 = i2;
 i13 = i12;
 i4 = i13;
 if (!i10) {
  i1 = (i14 | 0) != 0;
  if (!i4) {
   if (i1) {
    HEAP32[i14 >> 2] = (i11 >>> 0) % (i6 >>> 0);
    HEAP32[i14 + 4 >> 2] = 0;
   }
   i13 = 0;
   i14 = (i11 >>> 0) / (i6 >>> 0) >>> 0;
   return (tempRet0 = i13, i14) | 0;
  } else {
   if (!i1) {
    i13 = 0;
    i14 = 0;
    return (tempRet0 = i13, i14) | 0;
   }
   HEAP32[i14 >> 2] = i8 | 0;
   HEAP32[i14 + 4 >> 2] = i7 & 0;
   i13 = 0;
   i14 = 0;
   return (tempRet0 = i13, i14) | 0;
  }
 }
 i5 = (i4 | 0) == 0;
 do if (i6) {
  if (!i5) {
   i3 = (Math_clz32(i4 | 0) | 0) - (Math_clz32(i10 | 0) | 0) | 0;
   if (i3 >>> 0 <= 31) {
    i1 = i3 + 1 | 0;
    i9 = 31 - i3 | 0;
    i6 = i3 - 31 >> 31;
    i4 = i1;
    i5 = i11 >>> (i1 >>> 0) & i6 | i10 << i9;
    i6 = i10 >>> (i1 >>> 0) & i6;
    i1 = 0;
    i3 = i11 << i9;
    break;
   }
   if (!i14) {
    i13 = 0;
    i14 = 0;
    return (tempRet0 = i13, i14) | 0;
   }
   HEAP32[i14 >> 2] = i8 | 0;
   HEAP32[i14 + 4 >> 2] = i9 | i7 & 0;
   i13 = 0;
   i14 = 0;
   return (tempRet0 = i13, i14) | 0;
  }
  i5 = i6 - 1 | 0;
  if (i5 & i6) {
   i3 = (Math_clz32(i6 | 0) | 0) + 33 - (Math_clz32(i10 | 0) | 0) | 0;
   i15 = 64 - i3 | 0;
   i9 = 32 - i3 | 0;
   i8 = i9 >> 31;
   i7 = i3 - 32 | 0;
   i6 = i7 >> 31;
   i4 = i3;
   i5 = i9 - 1 >> 31 & i10 >>> (i7 >>> 0) | (i10 << i9 | i11 >>> (i3 >>> 0)) & i6;
   i6 = i6 & i10 >>> (i3 >>> 0);
   i1 = i11 << i15 & i8;
   i3 = (i10 << i15 | i11 >>> (i7 >>> 0)) & i8 | i11 << i9 & i3 - 33 >> 31;
   break;
  }
  if (i14) {
   HEAP32[i14 >> 2] = i5 & i11;
   HEAP32[i14 + 4 >> 2] = 0;
  }
  if ((i6 | 0) == 1) {
   i14 = i9 | i7 & 0;
   i15 = i8 | 0 | 0;
   return (tempRet0 = i14, i15) | 0;
  } else {
   i15 = _llvm_cttz_i32(i6 | 0) | 0;
   i14 = i10 >>> (i15 >>> 0) | 0;
   i15 = i10 << 32 - i15 | i11 >>> (i15 >>> 0) | 0;
   return (tempRet0 = i14, i15) | 0;
  }
 } else {
  if (i5) {
   if (i14) {
    HEAP32[i14 >> 2] = (i10 >>> 0) % (i6 >>> 0);
    HEAP32[i14 + 4 >> 2] = 0;
   }
   i14 = 0;
   i15 = (i10 >>> 0) / (i6 >>> 0) >>> 0;
   return (tempRet0 = i14, i15) | 0;
  }
  if (!i11) {
   if (i14) {
    HEAP32[i14 >> 2] = 0;
    HEAP32[i14 + 4 >> 2] = (i10 >>> 0) % (i4 >>> 0);
   }
   i14 = 0;
   i15 = (i10 >>> 0) / (i4 >>> 0) >>> 0;
   return (tempRet0 = i14, i15) | 0;
  }
  i5 = i4 - 1 | 0;
  if (!(i5 & i4)) {
   if (i14) {
    HEAP32[i14 >> 2] = i8 | 0;
    HEAP32[i14 + 4 >> 2] = i5 & i10 | i7 & 0;
   }
   i14 = 0;
   i15 = i10 >>> ((_llvm_cttz_i32(i4 | 0) | 0) >>> 0);
   return (tempRet0 = i14, i15) | 0;
  }
  i3 = (Math_clz32(i4 | 0) | 0) - (Math_clz32(i10 | 0) | 0) | 0;
  if (i3 >>> 0 <= 30) {
   i6 = i3 + 1 | 0;
   i3 = 31 - i3 | 0;
   i4 = i6;
   i5 = i10 << i3 | i11 >>> (i6 >>> 0);
   i6 = i10 >>> (i6 >>> 0);
   i1 = 0;
   i3 = i11 << i3;
   break;
  }
  if (!i14) {
   i14 = 0;
   i15 = 0;
   return (tempRet0 = i14, i15) | 0;
  }
  HEAP32[i14 >> 2] = i8 | 0;
  HEAP32[i14 + 4 >> 2] = i9 | i7 & 0;
  i14 = 0;
  i15 = 0;
  return (tempRet0 = i14, i15) | 0;
 } while (0);
 if (!i4) {
  i9 = i3;
  i4 = 0;
  i3 = 0;
 } else {
  i10 = i2 | 0 | 0;
  i9 = i13 | i12 & 0;
  i7 = _i64Add(i10 | 0, i9 | 0, -1, -1) | 0;
  i8 = tempRet0;
  i2 = i3;
  i3 = 0;
  do {
   i11 = i2;
   i2 = i1 >>> 31 | i2 << 1;
   i1 = i3 | i1 << 1;
   i11 = i5 << 1 | i11 >>> 31 | 0;
   i12 = i5 >>> 31 | i6 << 1 | 0;
   _i64Subtract(i7, i8, i11, i12) | 0;
   i15 = tempRet0;
   i13 = i15 >> 31 | ((i15 | 0) < 0 ? -1 : 0) << 1;
   i3 = i13 & 1;
   i5 = _i64Subtract(i11, i12, i13 & i10, (((i15 | 0) < 0 ? -1 : 0) >> 31 | ((i15 | 0) < 0 ? -1 : 0) << 1) & i9) | 0;
   i6 = tempRet0;
   i4 = i4 - 1 | 0;
  } while ((i4 | 0) != 0);
  i9 = i2;
  i4 = 0;
 }
 i2 = 0;
 if (i14) {
  HEAP32[i14 >> 2] = i5;
  HEAP32[i14 + 4 >> 2] = i6;
 }
 i14 = (i1 | 0) >>> 31 | (i9 | i2) << 1 | (i2 << 1 | i1 >>> 31) & 0 | i4;
 i15 = (i1 << 1 | 0 >>> 31) & -2 | i3;
 return (tempRet0 = i14, i15) | 0;
}

function __ZNK10__cxxabiv121__vmi_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib(i11, i16, i15, i7, i14) {
 i11 = i11 | 0;
 i16 = i16 | 0;
 i15 = i15 | 0;
 i7 = i7 | 0;
 i14 = i14 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i8 = 0, i9 = 0, i10 = 0, i12 = 0, i13 = 0;
 L1 : do if ((i11 | 0) == (HEAP32[i16 + 8 >> 2] | 0)) {
  if ((HEAP32[i16 + 4 >> 2] | 0) == (i15 | 0) ? (i2 = i16 + 28 | 0, (HEAP32[i2 >> 2] | 0) != 1) : 0) HEAP32[i2 >> 2] = i7;
 } else {
  if ((i11 | 0) != (HEAP32[i16 >> 2] | 0)) {
   i13 = HEAP32[i11 + 12 >> 2] | 0;
   i4 = i11 + 16 + (i13 << 3) | 0;
   __ZNK10__cxxabiv122__base_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib(i11 + 16 | 0, i16, i15, i7, i14);
   i1 = i11 + 24 | 0;
   if ((i13 | 0) <= 1) break;
   i2 = HEAP32[i11 + 8 >> 2] | 0;
   if ((i2 & 2 | 0) == 0 ? (i5 = i16 + 36 | 0, (HEAP32[i5 >> 2] | 0) != 1) : 0) {
    if (!(i2 & 1)) {
     i2 = i16 + 54 | 0;
     while (1) {
      if (HEAP8[i2 >> 0] | 0) break L1;
      if ((HEAP32[i5 >> 2] | 0) == 1) break L1;
      __ZNK10__cxxabiv122__base_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib(i1, i16, i15, i7, i14);
      i1 = i1 + 8 | 0;
      if (i1 >>> 0 >= i4 >>> 0) break L1;
     }
    }
    i2 = i16 + 24 | 0;
    i3 = i16 + 54 | 0;
    while (1) {
     if (HEAP8[i3 >> 0] | 0) break L1;
     if ((HEAP32[i5 >> 2] | 0) == 1 ? (HEAP32[i2 >> 2] | 0) == 1 : 0) break L1;
     __ZNK10__cxxabiv122__base_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib(i1, i16, i15, i7, i14);
     i1 = i1 + 8 | 0;
     if (i1 >>> 0 >= i4 >>> 0) break L1;
    }
   }
   i2 = i16 + 54 | 0;
   while (1) {
    if (HEAP8[i2 >> 0] | 0) break L1;
    __ZNK10__cxxabiv122__base_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib(i1, i16, i15, i7, i14);
    i1 = i1 + 8 | 0;
    if (i1 >>> 0 >= i4 >>> 0) break L1;
   }
  }
  if ((HEAP32[i16 + 16 >> 2] | 0) != (i15 | 0) ? (i12 = i16 + 20 | 0, (HEAP32[i12 >> 2] | 0) != (i15 | 0)) : 0) {
   HEAP32[i16 + 32 >> 2] = i7;
   i8 = i16 + 44 | 0;
   if ((HEAP32[i8 >> 2] | 0) == 4) break;
   i5 = HEAP32[i11 + 12 >> 2] | 0;
   i4 = i11 + 16 + (i5 << 3) | 0;
   i1 = i16 + 52 | 0;
   i6 = i16 + 53 | 0;
   i9 = i16 + 54 | 0;
   i7 = i11 + 8 | 0;
   i10 = i16 + 24 | 0;
   L34 : do if ((i5 | 0) > 0) {
    i3 = 0;
    i2 = 0;
    i5 = i11 + 16 | 0;
    while (1) {
     HEAP8[i1 >> 0] = 0;
     HEAP8[i6 >> 0] = 0;
     __ZNK10__cxxabiv122__base_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib(i5, i16, i15, i15, 1, i14);
     if (HEAP8[i9 >> 0] | 0) {
      i13 = 20;
      break L34;
     }
     do if (HEAP8[i6 >> 0] | 0) {
      if (!(HEAP8[i1 >> 0] | 0)) if (!(HEAP32[i7 >> 2] & 1)) {
       i2 = 1;
       i13 = 20;
       break L34;
      } else {
       i2 = 1;
       break;
      }
      if ((HEAP32[i10 >> 2] | 0) == 1) break L34;
      if (!(HEAP32[i7 >> 2] & 2)) break L34; else {
       i3 = 1;
       i2 = 1;
      }
     } while (0);
     i5 = i5 + 8 | 0;
     if (i5 >>> 0 >= i4 >>> 0) {
      i13 = 20;
      break;
     }
    }
   } else {
    i3 = 0;
    i2 = 0;
    i13 = 20;
   } while (0);
   do if ((i13 | 0) == 20) {
    if ((!i3 ? (HEAP32[i12 >> 2] = i15, i15 = i16 + 40 | 0, HEAP32[i15 >> 2] = (HEAP32[i15 >> 2] | 0) + 1, (HEAP32[i16 + 36 >> 2] | 0) == 1) : 0) ? (HEAP32[i10 >> 2] | 0) == 2 : 0) {
     HEAP8[i9 >> 0] = 1;
     if (i2) break;
    } else i13 = 24;
    if ((i13 | 0) == 24 ? i2 : 0) break;
    HEAP32[i8 >> 2] = 4;
    break L1;
   } while (0);
   HEAP32[i8 >> 2] = 3;
   break;
  }
  if ((i7 | 0) == 1) HEAP32[i16 + 32 >> 2] = 1;
 } while (0);
 return;
}

function _kh_resize_parstr(i20, i1) {
 i20 = i20 | 0;
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0;
 i16 = i1 + -1 | 0;
 i16 = i16 >>> 1 | i16;
 i16 = i16 >>> 2 | i16;
 i16 = i16 >>> 4 | i16;
 i16 = i16 >>> 8 | i16;
 i16 = (i16 >>> 16 | i16) + 1 | 0;
 i16 = i16 >>> 0 < 4 ? 4 : i16;
 i17 = i20 + 4 | 0;
 i18 = ~~(+(i16 >>> 0) * .77 + .5) >>> 0;
 if ((HEAP32[i17 >> 2] | 0) >>> 0 >= i18 >>> 0) {
  i20 = 0;
  return i20 | 0;
 }
 i1 = i16 >>> 0 < 16 ? 4 : i16 >>> 4 << 2;
 i19 = _malloc(i1) | 0;
 if (!i19) {
  i20 = -1;
  return i20 | 0;
 }
 _memset(i19 | 0, -86, i1 | 0) | 0;
 i1 = HEAP32[i20 >> 2] | 0;
 do if (i1 >>> 0 < i16 >>> 0) {
  i1 = i20 + 20 | 0;
  i3 = i16 << 2;
  i2 = _realloc(HEAP32[i1 >> 2] | 0, i3) | 0;
  if (!i2) {
   _free(i19);
   i20 = -1;
   return i20 | 0;
  }
  HEAP32[i1 >> 2] = i2;
  i2 = i20 + 24 | 0;
  i1 = _realloc(HEAP32[i2 >> 2] | 0, i3) | 0;
  if (i1) {
   HEAP32[i2 >> 2] = i1;
   i1 = HEAP32[i20 >> 2] | 0;
   break;
  }
  _free(i19);
  i20 = -1;
  return i20 | 0;
 } while (0);
 if (i1) {
  i12 = i20 + 16 | 0;
  i13 = i20 + 20 | 0;
  i14 = i16 + -1 | 0;
  i15 = i20 + 24 | 0;
  i11 = 0;
  do {
   i3 = HEAP32[i12 >> 2] | 0;
   i2 = i3 + (i11 >>> 4 << 2) | 0;
   i4 = HEAP32[i2 >> 2] | 0;
   i5 = i11 << 1 & 30;
   if (!(i4 & 3 << i5)) {
    i8 = HEAP32[(HEAP32[i13 >> 2] | 0) + (i11 << 2) >> 2] | 0;
    i9 = HEAP32[(HEAP32[i15 >> 2] | 0) + (i11 << 2) >> 2] | 0;
    HEAP32[i2 >> 2] = i4 | 1 << i5;
    i10 = i3;
    i2 = i8;
    i3 = i9;
    while (1) {
     i5 = i2 & i14;
     i4 = i5 >>> 4;
     i1 = i19 + (i4 << 2) | 0;
     i7 = HEAP32[i1 >> 2] | 0;
     i8 = i5 << 1 & 30;
     i6 = 2 << i8;
     if (!(i6 & i7)) {
      i8 = 0;
      do {
       i8 = i8 + 1 | 0;
       i5 = i8 + i5 & i14;
       i4 = i5 >>> 4;
       i1 = i19 + (i4 << 2) | 0;
       i7 = HEAP32[i1 >> 2] | 0;
       i9 = i5 << 1 & 30;
       i6 = 2 << i9;
      } while ((i6 & i7 | 0) == 0);
      i8 = i9;
     }
     HEAP32[i1 >> 2] = i7 & ~i6;
     if (i5 >>> 0 >= (HEAP32[i20 >> 2] | 0) >>> 0) break;
     if (HEAP32[i10 + (i4 << 2) >> 2] & 3 << i8) break;
     i10 = (HEAP32[i13 >> 2] | 0) + (i5 << 2) | 0;
     i7 = HEAP32[i10 >> 2] | 0;
     HEAP32[i10 >> 2] = i2;
     i10 = (HEAP32[i15 >> 2] | 0) + (i5 << 2) | 0;
     i9 = HEAP32[i10 >> 2] | 0;
     HEAP32[i10 >> 2] = i3;
     i10 = HEAP32[i12 >> 2] | 0;
     i6 = i10 + (i4 << 2) | 0;
     HEAP32[i6 >> 2] = HEAP32[i6 >> 2] | 1 << i8;
     i2 = i7;
     i3 = i9;
    }
    HEAP32[(HEAP32[i13 >> 2] | 0) + (i5 << 2) >> 2] = i2;
    HEAP32[(HEAP32[i15 >> 2] | 0) + (i5 << 2) >> 2] = i3;
    i1 = HEAP32[i20 >> 2] | 0;
   }
   i11 = i11 + 1 | 0;
  } while ((i11 | 0) != (i1 | 0));
  if (i1 >>> 0 > i16 >>> 0) {
   i15 = i20 + 20 | 0;
   i14 = i16 << 2;
   i13 = _realloc(HEAP32[i15 >> 2] | 0, i14) | 0;
   HEAP32[i15 >> 2] = i13;
   i15 = i20 + 24 | 0;
   i14 = _realloc(HEAP32[i15 >> 2] | 0, i14) | 0;
   HEAP32[i15 >> 2] = i14;
  }
 }
 i15 = i20 + 16 | 0;
 _free(HEAP32[i15 >> 2] | 0);
 HEAP32[i15 >> 2] = i19;
 HEAP32[i20 >> 2] = i16;
 HEAP32[i20 + 8 >> 2] = HEAP32[i17 >> 2];
 HEAP32[i20 + 12 >> 2] = i18;
 i20 = 0;
 return i20 | 0;
}

function _kh_resize_assmap(i20, i1) {
 i20 = i20 | 0;
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0;
 i16 = i1 + -1 | 0;
 i16 = i16 >>> 1 | i16;
 i16 = i16 >>> 2 | i16;
 i16 = i16 >>> 4 | i16;
 i16 = i16 >>> 8 | i16;
 i16 = (i16 >>> 16 | i16) + 1 | 0;
 i16 = i16 >>> 0 < 4 ? 4 : i16;
 i17 = i20 + 4 | 0;
 i18 = ~~(+(i16 >>> 0) * .77 + .5) >>> 0;
 if ((HEAP32[i17 >> 2] | 0) >>> 0 >= i18 >>> 0) {
  i20 = 0;
  return i20 | 0;
 }
 i1 = i16 >>> 0 < 16 ? 4 : i16 >>> 4 << 2;
 i19 = _malloc(i1) | 0;
 if (!i19) {
  i20 = -1;
  return i20 | 0;
 }
 _memset(i19 | 0, -86, i1 | 0) | 0;
 i1 = HEAP32[i20 >> 2] | 0;
 do if (i1 >>> 0 < i16 >>> 0) {
  i1 = i20 + 20 | 0;
  i3 = i16 << 2;
  i2 = _realloc(HEAP32[i1 >> 2] | 0, i3) | 0;
  if (!i2) {
   _free(i19);
   i20 = -1;
   return i20 | 0;
  }
  HEAP32[i1 >> 2] = i2;
  i2 = i20 + 24 | 0;
  i1 = _realloc(HEAP32[i2 >> 2] | 0, i3) | 0;
  if (i1) {
   HEAP32[i2 >> 2] = i1;
   i1 = HEAP32[i20 >> 2] | 0;
   break;
  }
  _free(i19);
  i20 = -1;
  return i20 | 0;
 } while (0);
 if (i1) {
  i12 = i20 + 16 | 0;
  i13 = i20 + 20 | 0;
  i14 = i16 + -1 | 0;
  i15 = i20 + 24 | 0;
  i11 = 0;
  do {
   i3 = HEAP32[i12 >> 2] | 0;
   i2 = i3 + (i11 >>> 4 << 2) | 0;
   i4 = HEAP32[i2 >> 2] | 0;
   i5 = i11 << 1 & 30;
   if (!(i4 & 3 << i5)) {
    i8 = HEAP32[(HEAP32[i13 >> 2] | 0) + (i11 << 2) >> 2] | 0;
    i9 = HEAP32[(HEAP32[i15 >> 2] | 0) + (i11 << 2) >> 2] | 0;
    HEAP32[i2 >> 2] = i4 | 1 << i5;
    i10 = i3;
    i2 = i8;
    i3 = i9;
    while (1) {
     i5 = i2 & i14;
     i4 = i5 >>> 4;
     i1 = i19 + (i4 << 2) | 0;
     i7 = HEAP32[i1 >> 2] | 0;
     i8 = i5 << 1 & 30;
     i6 = 2 << i8;
     if (!(i6 & i7)) {
      i8 = 0;
      do {
       i8 = i8 + 1 | 0;
       i5 = i8 + i5 & i14;
       i4 = i5 >>> 4;
       i1 = i19 + (i4 << 2) | 0;
       i7 = HEAP32[i1 >> 2] | 0;
       i9 = i5 << 1 & 30;
       i6 = 2 << i9;
      } while ((i6 & i7 | 0) == 0);
      i8 = i9;
     }
     HEAP32[i1 >> 2] = i7 & ~i6;
     if (i5 >>> 0 >= (HEAP32[i20 >> 2] | 0) >>> 0) break;
     if (HEAP32[i10 + (i4 << 2) >> 2] & 3 << i8) break;
     i10 = (HEAP32[i13 >> 2] | 0) + (i5 << 2) | 0;
     i7 = HEAP32[i10 >> 2] | 0;
     HEAP32[i10 >> 2] = i2;
     i10 = (HEAP32[i15 >> 2] | 0) + (i5 << 2) | 0;
     i9 = HEAP32[i10 >> 2] | 0;
     HEAP32[i10 >> 2] = i3;
     i10 = HEAP32[i12 >> 2] | 0;
     i6 = i10 + (i4 << 2) | 0;
     HEAP32[i6 >> 2] = HEAP32[i6 >> 2] | 1 << i8;
     i2 = i7;
     i3 = i9;
    }
    HEAP32[(HEAP32[i13 >> 2] | 0) + (i5 << 2) >> 2] = i2;
    HEAP32[(HEAP32[i15 >> 2] | 0) + (i5 << 2) >> 2] = i3;
    i1 = HEAP32[i20 >> 2] | 0;
   }
   i11 = i11 + 1 | 0;
  } while ((i11 | 0) != (i1 | 0));
  if (i1 >>> 0 > i16 >>> 0) {
   i15 = i20 + 20 | 0;
   i14 = i16 << 2;
   i13 = _realloc(HEAP32[i15 >> 2] | 0, i14) | 0;
   HEAP32[i15 >> 2] = i13;
   i15 = i20 + 24 | 0;
   i14 = _realloc(HEAP32[i15 >> 2] | 0, i14) | 0;
   HEAP32[i15 >> 2] = i14;
  }
 }
 i15 = i20 + 16 | 0;
 _free(HEAP32[i15 >> 2] | 0);
 HEAP32[i15 >> 2] = i19;
 HEAP32[i20 >> 2] = i16;
 HEAP32[i20 + 8 >> 2] = HEAP32[i17 >> 2];
 HEAP32[i20 + 12 >> 2] = i18;
 i20 = 0;
 return i20 | 0;
}

function _kh_resize_smap(i20, i1) {
 i20 = i20 | 0;
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0;
 i16 = i1 + -1 | 0;
 i16 = i16 >>> 1 | i16;
 i16 = i16 >>> 2 | i16;
 i16 = i16 >>> 4 | i16;
 i16 = i16 >>> 8 | i16;
 i16 = (i16 >>> 16 | i16) + 1 | 0;
 i16 = i16 >>> 0 < 4 ? 4 : i16;
 i17 = i20 + 4 | 0;
 i18 = ~~(+(i16 >>> 0) * .77 + .5) >>> 0;
 if ((HEAP32[i17 >> 2] | 0) >>> 0 >= i18 >>> 0) {
  i20 = 0;
  return i20 | 0;
 }
 i1 = i16 >>> 0 < 16 ? 4 : i16 >>> 4 << 2;
 i19 = _malloc(i1) | 0;
 if (!i19) {
  i20 = -1;
  return i20 | 0;
 }
 _memset(i19 | 0, -86, i1 | 0) | 0;
 i1 = HEAP32[i20 >> 2] | 0;
 do if (i1 >>> 0 < i16 >>> 0) {
  i1 = i20 + 20 | 0;
  i3 = i16 << 2;
  i2 = _realloc(HEAP32[i1 >> 2] | 0, i3) | 0;
  if (!i2) {
   _free(i19);
   i20 = -1;
   return i20 | 0;
  }
  HEAP32[i1 >> 2] = i2;
  i2 = i20 + 24 | 0;
  i1 = _realloc(HEAP32[i2 >> 2] | 0, i3) | 0;
  if (i1) {
   HEAP32[i2 >> 2] = i1;
   i1 = HEAP32[i20 >> 2] | 0;
   break;
  }
  _free(i19);
  i20 = -1;
  return i20 | 0;
 } while (0);
 if (i1) {
  i12 = i20 + 16 | 0;
  i13 = i20 + 20 | 0;
  i14 = i16 + -1 | 0;
  i15 = i20 + 24 | 0;
  i11 = 0;
  do {
   i3 = HEAP32[i12 >> 2] | 0;
   i2 = i3 + (i11 >>> 4 << 2) | 0;
   i4 = HEAP32[i2 >> 2] | 0;
   i5 = i11 << 1 & 30;
   if (!(i4 & 3 << i5)) {
    i8 = HEAP32[(HEAP32[i13 >> 2] | 0) + (i11 << 2) >> 2] | 0;
    i9 = HEAP32[(HEAP32[i15 >> 2] | 0) + (i11 << 2) >> 2] | 0;
    HEAP32[i2 >> 2] = i4 | 1 << i5;
    i10 = i3;
    i2 = i8;
    i3 = i9;
    while (1) {
     i5 = i2 & i14;
     i4 = i5 >>> 4;
     i1 = i19 + (i4 << 2) | 0;
     i7 = HEAP32[i1 >> 2] | 0;
     i8 = i5 << 1 & 30;
     i6 = 2 << i8;
     if (!(i6 & i7)) {
      i8 = 0;
      do {
       i8 = i8 + 1 | 0;
       i5 = i8 + i5 & i14;
       i4 = i5 >>> 4;
       i1 = i19 + (i4 << 2) | 0;
       i7 = HEAP32[i1 >> 2] | 0;
       i9 = i5 << 1 & 30;
       i6 = 2 << i9;
      } while ((i6 & i7 | 0) == 0);
      i8 = i9;
     }
     HEAP32[i1 >> 2] = i7 & ~i6;
     if (i5 >>> 0 >= (HEAP32[i20 >> 2] | 0) >>> 0) break;
     if (HEAP32[i10 + (i4 << 2) >> 2] & 3 << i8) break;
     i10 = (HEAP32[i13 >> 2] | 0) + (i5 << 2) | 0;
     i7 = HEAP32[i10 >> 2] | 0;
     HEAP32[i10 >> 2] = i2;
     i10 = (HEAP32[i15 >> 2] | 0) + (i5 << 2) | 0;
     i9 = HEAP32[i10 >> 2] | 0;
     HEAP32[i10 >> 2] = i3;
     i10 = HEAP32[i12 >> 2] | 0;
     i6 = i10 + (i4 << 2) | 0;
     HEAP32[i6 >> 2] = HEAP32[i6 >> 2] | 1 << i8;
     i2 = i7;
     i3 = i9;
    }
    HEAP32[(HEAP32[i13 >> 2] | 0) + (i5 << 2) >> 2] = i2;
    HEAP32[(HEAP32[i15 >> 2] | 0) + (i5 << 2) >> 2] = i3;
    i1 = HEAP32[i20 >> 2] | 0;
   }
   i11 = i11 + 1 | 0;
  } while ((i11 | 0) != (i1 | 0));
  if (i1 >>> 0 > i16 >>> 0) {
   i15 = i20 + 20 | 0;
   i14 = i16 << 2;
   i13 = _realloc(HEAP32[i15 >> 2] | 0, i14) | 0;
   HEAP32[i15 >> 2] = i13;
   i15 = i20 + 24 | 0;
   i14 = _realloc(HEAP32[i15 >> 2] | 0, i14) | 0;
   HEAP32[i15 >> 2] = i14;
  }
 }
 i15 = i20 + 16 | 0;
 _free(HEAP32[i15 >> 2] | 0);
 HEAP32[i15 >> 2] = i19;
 HEAP32[i20 >> 2] = i16;
 HEAP32[i20 + 8 >> 2] = HEAP32[i17 >> 2];
 HEAP32[i20 + 12 >> 2] = i18;
 i20 = 0;
 return i20 | 0;
}

function _kh_resize_glmap(i21, i1) {
 i21 = i21 | 0;
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0;
 i17 = i1 + -1 | 0;
 i17 = i17 >>> 1 | i17;
 i17 = i17 >>> 2 | i17;
 i17 = i17 >>> 4 | i17;
 i17 = i17 >>> 8 | i17;
 i17 = (i17 >>> 16 | i17) + 1 | 0;
 i17 = i17 >>> 0 < 4 ? 4 : i17;
 i18 = i21 + 4 | 0;
 i19 = ~~(+(i17 >>> 0) * .77 + .5) >>> 0;
 if ((HEAP32[i18 >> 2] | 0) >>> 0 >= i19 >>> 0) {
  i21 = 0;
  return i21 | 0;
 }
 i1 = i17 >>> 0 < 16 ? 4 : i17 >>> 4 << 2;
 i20 = _malloc(i1) | 0;
 if (!i20) {
  i21 = -1;
  return i21 | 0;
 }
 _memset(i20 | 0, -86, i1 | 0) | 0;
 i1 = HEAP32[i21 >> 2] | 0;
 do if (i1 >>> 0 < i17 >>> 0) {
  i1 = i21 + 20 | 0;
  i3 = i17 << 2;
  i2 = _realloc(HEAP32[i1 >> 2] | 0, i3) | 0;
  if (!i2) {
   _free(i20);
   i21 = -1;
   return i21 | 0;
  }
  HEAP32[i1 >> 2] = i2;
  i2 = i21 + 24 | 0;
  i1 = _realloc(HEAP32[i2 >> 2] | 0, i3) | 0;
  if (i1) {
   HEAP32[i2 >> 2] = i1;
   i1 = HEAP32[i21 >> 2] | 0;
   break;
  }
  _free(i20);
  i21 = -1;
  return i21 | 0;
 } while (0);
 if (i1) {
  i13 = HEAP32[i21 + 16 >> 2] | 0;
  i14 = i21 + 20 | 0;
  i15 = i17 + -1 | 0;
  i16 = i21 + 24 | 0;
  i12 = 0;
  do {
   i3 = i13 + (i12 >>> 4 << 2) | 0;
   i2 = HEAP32[i3 >> 2] | 0;
   i4 = i12 << 1 & 30;
   if (!(i2 & 3 << i4)) {
    i10 = HEAP32[i14 >> 2] | 0;
    i8 = HEAP32[i10 + (i12 << 2) >> 2] | 0;
    i11 = HEAP32[i16 >> 2] | 0;
    i9 = HEAP32[i11 + (i12 << 2) >> 2] | 0;
    HEAP32[i3 >> 2] = i2 | 1 << i4;
    i2 = i8;
    i3 = i9;
    while (1) {
     i4 = i2 & i15;
     i1 = i4 >>> 4;
     i5 = i20 + (i1 << 2) | 0;
     i7 = HEAP32[i5 >> 2] | 0;
     i8 = i4 << 1 & 30;
     i6 = 2 << i8;
     if (!(i6 & i7)) {
      i8 = 0;
      do {
       i8 = i8 + 1 | 0;
       i4 = i8 + i4 & i15;
       i1 = i4 >>> 4;
       i5 = i20 + (i1 << 2) | 0;
       i7 = HEAP32[i5 >> 2] | 0;
       i9 = i4 << 1 & 30;
       i6 = 2 << i9;
      } while ((i6 & i7 | 0) == 0);
      i8 = i9;
     }
     HEAP32[i5 >> 2] = i7 & ~i6;
     if (i4 >>> 0 >= (HEAP32[i21 >> 2] | 0) >>> 0) break;
     i1 = i13 + (i1 << 2) | 0;
     if (HEAP32[i1 >> 2] & 3 << i8) break;
     i6 = i10 + (i4 << 2) | 0;
     i7 = HEAP32[i6 >> 2] | 0;
     HEAP32[i6 >> 2] = i2;
     i6 = i11 + (i4 << 2) | 0;
     i9 = HEAP32[i6 >> 2] | 0;
     HEAP32[i6 >> 2] = i3;
     HEAP32[i1 >> 2] = HEAP32[i1 >> 2] | 1 << i8;
     i2 = i7;
     i3 = i9;
    }
    HEAP32[i10 + (i4 << 2) >> 2] = i2;
    HEAP32[i11 + (i4 << 2) >> 2] = i3;
    i1 = HEAP32[i21 >> 2] | 0;
   }
   i12 = i12 + 1 | 0;
  } while ((i12 | 0) != (i1 | 0));
  if (i1 >>> 0 > i17 >>> 0) {
   i16 = i21 + 20 | 0;
   i15 = i17 << 2;
   i14 = _realloc(HEAP32[i16 >> 2] | 0, i15) | 0;
   HEAP32[i16 >> 2] = i14;
   i16 = i21 + 24 | 0;
   i15 = _realloc(HEAP32[i16 >> 2] | 0, i15) | 0;
   HEAP32[i16 >> 2] = i15;
  }
 }
 i16 = i21 + 16 | 0;
 _free(HEAP32[i16 >> 2] | 0);
 HEAP32[i16 >> 2] = i20;
 HEAP32[i21 >> 2] = i17;
 HEAP32[i21 + 8 >> 2] = HEAP32[i18 >> 2];
 HEAP32[i21 + 12 >> 2] = i19;
 i21 = 0;
 return i21 | 0;
}

function _kh_resize_imap(i21, i1) {
 i21 = i21 | 0;
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0;
 i17 = i1 + -1 | 0;
 i17 = i17 >>> 1 | i17;
 i17 = i17 >>> 2 | i17;
 i17 = i17 >>> 4 | i17;
 i17 = i17 >>> 8 | i17;
 i17 = (i17 >>> 16 | i17) + 1 | 0;
 i17 = i17 >>> 0 < 4 ? 4 : i17;
 i18 = i21 + 4 | 0;
 i19 = ~~(+(i17 >>> 0) * .77 + .5) >>> 0;
 if ((HEAP32[i18 >> 2] | 0) >>> 0 >= i19 >>> 0) {
  i21 = 0;
  return i21 | 0;
 }
 i1 = i17 >>> 0 < 16 ? 4 : i17 >>> 4 << 2;
 i20 = _malloc(i1) | 0;
 if (!i20) {
  i21 = -1;
  return i21 | 0;
 }
 _memset(i20 | 0, -86, i1 | 0) | 0;
 i1 = HEAP32[i21 >> 2] | 0;
 do if (i1 >>> 0 < i17 >>> 0) {
  i1 = i21 + 20 | 0;
  i3 = i17 << 2;
  i2 = _realloc(HEAP32[i1 >> 2] | 0, i3) | 0;
  if (!i2) {
   _free(i20);
   i21 = -1;
   return i21 | 0;
  }
  HEAP32[i1 >> 2] = i2;
  i2 = i21 + 24 | 0;
  i1 = _realloc(HEAP32[i2 >> 2] | 0, i3) | 0;
  if (i1) {
   HEAP32[i2 >> 2] = i1;
   i1 = HEAP32[i21 >> 2] | 0;
   break;
  }
  _free(i20);
  i21 = -1;
  return i21 | 0;
 } while (0);
 if (i1) {
  i13 = HEAP32[i21 + 16 >> 2] | 0;
  i14 = i21 + 20 | 0;
  i15 = i17 + -1 | 0;
  i16 = i21 + 24 | 0;
  i12 = 0;
  do {
   i3 = i13 + (i12 >>> 4 << 2) | 0;
   i2 = HEAP32[i3 >> 2] | 0;
   i4 = i12 << 1 & 30;
   if (!(i2 & 3 << i4)) {
    i10 = HEAP32[i14 >> 2] | 0;
    i8 = HEAP32[i10 + (i12 << 2) >> 2] | 0;
    i11 = HEAP32[i16 >> 2] | 0;
    i9 = HEAP32[i11 + (i12 << 2) >> 2] | 0;
    HEAP32[i3 >> 2] = i2 | 1 << i4;
    i2 = i8;
    i3 = i9;
    while (1) {
     i4 = i2 & i15;
     i1 = i4 >>> 4;
     i5 = i20 + (i1 << 2) | 0;
     i7 = HEAP32[i5 >> 2] | 0;
     i8 = i4 << 1 & 30;
     i6 = 2 << i8;
     if (!(i6 & i7)) {
      i8 = 0;
      do {
       i8 = i8 + 1 | 0;
       i4 = i8 + i4 & i15;
       i1 = i4 >>> 4;
       i5 = i20 + (i1 << 2) | 0;
       i7 = HEAP32[i5 >> 2] | 0;
       i9 = i4 << 1 & 30;
       i6 = 2 << i9;
      } while ((i6 & i7 | 0) == 0);
      i8 = i9;
     }
     HEAP32[i5 >> 2] = i7 & ~i6;
     if (i4 >>> 0 >= (HEAP32[i21 >> 2] | 0) >>> 0) break;
     i1 = i13 + (i1 << 2) | 0;
     if (HEAP32[i1 >> 2] & 3 << i8) break;
     i6 = i10 + (i4 << 2) | 0;
     i7 = HEAP32[i6 >> 2] | 0;
     HEAP32[i6 >> 2] = i2;
     i6 = i11 + (i4 << 2) | 0;
     i9 = HEAP32[i6 >> 2] | 0;
     HEAP32[i6 >> 2] = i3;
     HEAP32[i1 >> 2] = HEAP32[i1 >> 2] | 1 << i8;
     i2 = i7;
     i3 = i9;
    }
    HEAP32[i10 + (i4 << 2) >> 2] = i2;
    HEAP32[i11 + (i4 << 2) >> 2] = i3;
    i1 = HEAP32[i21 >> 2] | 0;
   }
   i12 = i12 + 1 | 0;
  } while ((i12 | 0) != (i1 | 0));
  if (i1 >>> 0 > i17 >>> 0) {
   i16 = i21 + 20 | 0;
   i15 = i17 << 2;
   i14 = _realloc(HEAP32[i16 >> 2] | 0, i15) | 0;
   HEAP32[i16 >> 2] = i14;
   i16 = i21 + 24 | 0;
   i15 = _realloc(HEAP32[i16 >> 2] | 0, i15) | 0;
   HEAP32[i16 >> 2] = i15;
  }
 }
 i16 = i21 + 16 | 0;
 _free(HEAP32[i16 >> 2] | 0);
 HEAP32[i16 >> 2] = i20;
 HEAP32[i21 >> 2] = i17;
 HEAP32[i21 + 8 >> 2] = HEAP32[i18 >> 2];
 HEAP32[i21 + 12 >> 2] = i19;
 i21 = 0;
 return i21 | 0;
}

function _parg_token_from_string(i16) {
 i16 = i16 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0;
 i14 = HEAP8[i16 >> 0] | 0;
 i2 = i14 << 24 >> 24;
 if (i14 << 24 >> 24 != 0 ? (i1 = i16 + 1 | 0, i3 = HEAP8[i1 >> 0] | 0, i3 << 24 >> 24 != 0) : 0) do {
  i2 = (i2 * 31 | 0) + (i3 << 24 >> 24) | 0;
  i1 = i1 + 1 | 0;
  i3 = HEAP8[i1 >> 0] | 0;
 } while (i3 << 24 >> 24 != 0);
 i1 = HEAP32[330] | 0;
 if (!i1) {
  i14 = _calloc(1, 28) | 0;
  HEAP32[330] = i14;
 } else i14 = i1;
 i13 = i14 + 8 | 0;
 do if ((HEAP32[i13 >> 2] | 0) >>> 0 >= (HEAP32[i14 + 12 >> 2] | 0) >>> 0) {
  i1 = HEAP32[i14 >> 2] | 0;
  if (i1 >>> 0 > HEAP32[i14 + 4 >> 2] << 1 >>> 0) {
   if ((_kh_resize_parstr(i14, i1 + -1 | 0) | 0) >= 0) {
    i15 = 12;
    break;
   }
   i1 = HEAP32[i14 >> 2] | 0;
   break;
  } else {
   if ((_kh_resize_parstr(i14, i1 + 1 | 0) | 0) >= 0) {
    i15 = 12;
    break;
   }
   i1 = HEAP32[i14 >> 2] | 0;
   break;
  }
 } else i15 = 12; while (0);
 do if ((i15 | 0) == 12) {
  i11 = HEAP32[i14 >> 2] | 0;
  i7 = i11 + -1 | 0;
  i5 = i7 & i2;
  i12 = HEAP32[i14 + 16 >> 2] | 0;
  do if (!(2 << (i5 << 1 & 30) & HEAP32[i12 + (i5 >>> 4 << 2) >> 2])) {
   i8 = i14 + 20 | 0;
   i9 = i5;
   i1 = i11;
   i10 = 0;
   while (1) {
    i4 = HEAP32[i12 + (i9 >>> 4 << 2) >> 2] | 0;
    i3 = i9 << 1 & 30;
    i6 = i4 >>> i3;
    if (i6 & 2) {
     i5 = i9;
     break;
    }
    if ((i6 & 1 | 0) == 0 ? (HEAP32[(HEAP32[i8 >> 2] | 0) + (i9 << 2) >> 2] | 0) == (i2 | 0) : 0) {
     i5 = i9;
     break;
    }
    i1 = (i4 & 1 << i3 | 0) == 0 ? i1 : i9;
    i10 = i10 + 1 | 0;
    i9 = i10 + i9 & i7;
    if ((i9 | 0) == (i5 | 0)) {
     i15 = 18;
     break;
    }
   }
   if ((i15 | 0) == 18) if ((i1 | 0) == (i11 | 0)) i1 = i11; else break;
   i1 = ((i1 | 0) == (i11 | 0) ? 1 : (2 << (i5 << 1 & 30) & HEAP32[i12 + (i5 >>> 4 << 2) >> 2] | 0) == 0) ? i5 : i1;
  } else i1 = i5; while (0);
  i3 = i12 + (i1 >>> 4 << 2) | 0;
  i4 = i1 << 1 & 30;
  i5 = (HEAP32[i3 >> 2] | 0) >>> i4;
  if (i5 & 2) {
   HEAP32[(HEAP32[i14 + 20 >> 2] | 0) + (i1 << 2) >> 2] = i2;
   HEAP32[i3 >> 2] = HEAP32[i3 >> 2] & ~(3 << i4);
   i15 = i14 + 4 | 0;
   HEAP32[i15 >> 2] = (HEAP32[i15 >> 2] | 0) + 1;
   HEAP32[i13 >> 2] = (HEAP32[i13 >> 2] | 0) + 1;
   break;
  }
  if (i5 & 1) {
   HEAP32[(HEAP32[i14 + 20 >> 2] | 0) + (i1 << 2) >> 2] = i2;
   HEAP32[i3 >> 2] = HEAP32[i3 >> 2] & ~(3 << i4);
   i15 = i14 + 4 | 0;
   HEAP32[i15 >> 2] = (HEAP32[i15 >> 2] | 0) + 1;
  }
 } while (0);
 i16 = _sdsnew(i16) | 0;
 HEAP32[(HEAP32[(HEAP32[330] | 0) + 24 >> 2] | 0) + (i1 << 2) >> 2] = i16;
 return i2 | 0;
}

function _sdssplitlen(i11, i10, i9, i7, i13) {
 i11 = i11 | 0;
 i10 = i10 | 0;
 i9 = i9 | 0;
 i7 = i7 | 0;
 i13 = i13 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i8 = 0, i12 = 0;
 if ((i10 | 0) < 0 | (i7 | 0) < 1) {
  i13 = 0;
  return i13 | 0;
 }
 i4 = _malloc(20) | 0;
 if (!i4) {
  i13 = 0;
  return i13 | 0;
 }
 if (!i10) {
  HEAP32[i13 >> 2] = 0;
  i13 = i4;
  return i13 | 0;
 }
 i8 = i10 + 1 - i7 | 0;
 L11 : do if ((i8 | 0) > 0) {
  if ((i7 | 0) == 1) {
   i2 = 0;
   i5 = 0;
   i6 = 5;
   i3 = 0;
   i1 = i4;
  } else {
   i2 = 0;
   i5 = 0;
   i1 = 5;
   i3 = 0;
   i6 = i4;
   while (1) {
    if ((i1 | 0) < (i2 + 2 | 0)) {
     i4 = _realloc(i6, i1 << 3) | 0;
     if (!i4) {
      i5 = i2;
      i4 = i6;
      break L11;
     }
     i1 = i1 << 1;
    } else i4 = i6;
    if (!(_memcmp(i11 + i5 | 0, i9, i7) | 0)) {
     i6 = _sdsnewlen(i11 + i3 | 0, i5 - i3 | 0) | 0;
     HEAP32[i4 + (i2 << 2) >> 2] = i6;
     if (!i6) {
      i5 = i2;
      break L11;
     }
     i3 = i5 + i7 | 0;
     i2 = i2 + 1 | 0;
     i5 = i3 + -1 | 0;
    }
    i5 = i5 + 1 | 0;
    if ((i5 | 0) >= (i8 | 0)) {
     i12 = 23;
     break L11;
    } else i6 = i4;
   }
  }
  while (1) {
   if ((i6 | 0) < (i2 + 2 | 0)) {
    i4 = _realloc(i1, i6 << 3) | 0;
    if (!i4) {
     i5 = i2;
     i4 = i1;
     break L11;
    }
    i6 = i6 << 1;
   } else i4 = i1;
   i7 = i11 + i5 | 0;
   if ((HEAP8[i7 >> 0] | 0) != (HEAP8[i9 >> 0] | 0) ? (HEAP8[i7 >> 0] | 0) != (HEAP8[i9 >> 0] | 0) : 0) i5 = i5 + 1 | 0; else {
    i7 = _sdsnewlen(i11 + i3 | 0, i5 - i3 | 0) | 0;
    HEAP32[i4 + (i2 << 2) >> 2] = i7;
    if (!i7) {
     i5 = i2;
     break L11;
    }
    i3 = i5 + 1 | 0;
    i5 = i3;
    i2 = i2 + 1 | 0;
   }
   if ((i5 | 0) < (i8 | 0)) i1 = i4; else {
    i12 = 23;
    break;
   }
  }
 } else {
  i2 = 0;
  i3 = 0;
  i12 = 23;
 } while (0);
 if ((i12 | 0) == 23) {
  i12 = _sdsnewlen(i11 + i3 | 0, i10 - i3 | 0) | 0;
  HEAP32[i4 + (i2 << 2) >> 2] = i12;
  if (!i12) i5 = i2; else {
   HEAP32[i13 >> 2] = i2 + 1;
   i13 = i4;
   return i13 | 0;
  }
 }
 if ((i5 | 0) > 0) {
  i3 = 0;
  do {
   i2 = HEAP32[i4 + (i3 << 2) >> 2] | 0;
   if (i2) {
    switch (HEAPU8[i2 + -1 >> 0] & 7 | 0) {
    case 1:
     {
      i1 = 3;
      break;
     }
    case 2:
     {
      i1 = 5;
      break;
     }
    case 3:
     {
      i1 = 9;
      break;
     }
    case 4:
     {
      i1 = 17;
      break;
     }
    case 0:
     {
      i1 = 1;
      break;
     }
    default:
     i1 = 0;
    }
    _free(i2 + (0 - i1) | 0);
   }
   i3 = i3 + 1 | 0;
  } while ((i3 | 0) != (i5 | 0));
 }
 _free(i4);
 HEAP32[i13 >> 2] = 0;
 i13 = 0;
 return i13 | 0;
}

function _parg_asset_onload(i1, i16) {
 i1 = i1 | 0;
 i16 = i16 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0;
 i15 = _parg_token_from_string(i1) | 0;
 if (!i16) {
  _puts(8) | 0;
  ___assert_fail(240, 32, 19, 72);
 }
 i1 = HEAP32[24] | 0;
 if (!i1) {
  i14 = _calloc(1, 28) | 0;
  HEAP32[24] = i14;
 } else i14 = i1;
 i13 = i14 + 8 | 0;
 do if ((HEAP32[i13 >> 2] | 0) >>> 0 >= (HEAP32[i14 + 12 >> 2] | 0) >>> 0) {
  i1 = HEAP32[i14 >> 2] | 0;
  if (i1 >>> 0 > HEAP32[i14 + 4 >> 2] << 1 >>> 0) {
   if ((_kh_resize_assmap(i14, i1 + -1 | 0) | 0) >= 0) {
    i12 = 11;
    break;
   }
   i1 = HEAP32[i14 >> 2] | 0;
   break;
  } else {
   if ((_kh_resize_assmap(i14, i1 + 1 | 0) | 0) >= 0) {
    i12 = 11;
    break;
   }
   i1 = HEAP32[i14 >> 2] | 0;
   break;
  }
 } else i12 = 11; while (0);
 do if ((i12 | 0) == 11) {
  i10 = HEAP32[i14 >> 2] | 0;
  i6 = i10 + -1 | 0;
  i4 = i6 & i15;
  i11 = HEAP32[i14 + 16 >> 2] | 0;
  do if (!(2 << (i4 << 1 & 30) & HEAP32[i11 + (i4 >>> 4 << 2) >> 2])) {
   i7 = i14 + 20 | 0;
   i8 = i4;
   i1 = i10;
   i9 = 0;
   while (1) {
    i3 = HEAP32[i11 + (i8 >>> 4 << 2) >> 2] | 0;
    i2 = i8 << 1 & 30;
    i5 = i3 >>> i2;
    if (i5 & 2) {
     i4 = i8;
     break;
    }
    if ((i5 & 1 | 0) == 0 ? (HEAP32[(HEAP32[i7 >> 2] | 0) + (i8 << 2) >> 2] | 0) == (i15 | 0) : 0) {
     i4 = i8;
     break;
    }
    i1 = (i3 & 1 << i2 | 0) == 0 ? i1 : i8;
    i9 = i9 + 1 | 0;
    i8 = i9 + i8 & i6;
    if ((i8 | 0) == (i4 | 0)) {
     i12 = 17;
     break;
    }
   }
   if ((i12 | 0) == 17) if ((i1 | 0) == (i10 | 0)) i1 = i10; else break;
   i1 = ((i1 | 0) == (i10 | 0) ? 1 : (2 << (i4 << 1 & 30) & HEAP32[i11 + (i4 >>> 4 << 2) >> 2] | 0) == 0) ? i4 : i1;
  } else i1 = i4; while (0);
  i2 = i11 + (i1 >>> 4 << 2) | 0;
  i3 = i1 << 1 & 30;
  i4 = (HEAP32[i2 >> 2] | 0) >>> i3;
  if (i4 & 2) {
   HEAP32[(HEAP32[i14 + 20 >> 2] | 0) + (i1 << 2) >> 2] = i15;
   HEAP32[i2 >> 2] = HEAP32[i2 >> 2] & ~(3 << i3);
   i15 = i14 + 4 | 0;
   HEAP32[i15 >> 2] = (HEAP32[i15 >> 2] | 0) + 1;
   HEAP32[i13 >> 2] = (HEAP32[i13 >> 2] | 0) + 1;
   break;
  }
  if (i4 & 1) {
   HEAP32[(HEAP32[i14 + 20 >> 2] | 0) + (i1 << 2) >> 2] = i15;
   HEAP32[i2 >> 2] = HEAP32[i2 >> 2] & ~(3 << i3);
   i15 = i14 + 4 | 0;
   HEAP32[i15 >> 2] = (HEAP32[i15 >> 2] | 0) + 1;
  }
 } while (0);
 HEAP32[(HEAP32[(HEAP32[24] | 0) + 24 >> 2] | 0) + (i1 << 2) >> 2] = i16;
 return;
}

function _sdsnewlen(i9, i10) {
 i9 = i9 | 0;
 i10 = i10 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i11 = 0;
 if (i10 >>> 0 >= 32) if (i10 >>> 0 >= 255) if (i10 >>> 0 < 65535) i1 = 2; else i1 = (i10 | 0) == -1 ? 4 : 3; else i1 = 1; else i1 = 0;
 i3 = (i10 | 0) == 0 & i1 << 24 >> 24 == 0 ? 1 : i1;
 i6 = i3 & 255;
 switch (i6 | 0) {
 case 2:
  {
   i4 = 5;
   break;
  }
 case 3:
  {
   i4 = 9;
   break;
  }
 case 4:
  {
   i4 = 17;
   break;
  }
 case 1:
  {
   i4 = 3;
   break;
  }
 case 0:
  {
   i4 = 1;
   break;
  }
 default:
  i4 = 0;
 }
 i7 = i4 + i10 | 0;
 i1 = i7 + 1 | 0;
 i8 = _malloc(i1) | 0;
 i5 = (i9 | 0) != 0;
 if (!i5) _memset(i8 | 0, 0, i1 | 0) | 0;
 if (!i8) {
  i10 = 0;
  return i10 | 0;
 }
 i1 = i8 + i4 | 0;
 i2 = i8 + (i4 + -1) | 0;
 switch (i6 | 0) {
 case 0:
  {
   HEAP8[i2 >> 0] = i10 << 3;
   break;
  }
 case 1:
  {
   i6 = i10 & 255;
   HEAP8[i8 + (i4 + -3) >> 0] = i6;
   HEAP8[i8 + (i4 + -2) >> 0] = i6;
   HEAP8[i2 >> 0] = i3;
   break;
  }
 case 2:
  {
   i6 = i8 + (i4 + -5) | 0;
   i11 = i10 & 65535;
   HEAP8[i6 >> 0] = i11;
   HEAP8[i6 + 1 >> 0] = i11 >> 8;
   i6 = i8 + (i4 + -3) | 0;
   HEAP8[i6 >> 0] = i11;
   HEAP8[i6 + 1 >> 0] = i11 >> 8;
   HEAP8[i2 >> 0] = i3;
   break;
  }
 case 3:
  {
   i11 = i8 + (i4 + -9) | 0;
   HEAP8[i11 >> 0] = i10;
   HEAP8[i11 + 1 >> 0] = i10 >> 8;
   HEAP8[i11 + 2 >> 0] = i10 >> 16;
   HEAP8[i11 + 3 >> 0] = i10 >> 24;
   i11 = i8 + (i4 + -5) | 0;
   HEAP8[i11 >> 0] = i10;
   HEAP8[i11 + 1 >> 0] = i10 >> 8;
   HEAP8[i11 + 2 >> 0] = i10 >> 16;
   HEAP8[i11 + 3 >> 0] = i10 >> 24;
   HEAP8[i2 >> 0] = i3;
   break;
  }
 case 4:
  {
   i11 = i8 + (i4 + -17) | 0;
   i6 = i11;
   HEAP8[i6 >> 0] = i10;
   HEAP8[i6 + 1 >> 0] = i10 >> 8;
   HEAP8[i6 + 2 >> 0] = i10 >> 16;
   HEAP8[i6 + 3 >> 0] = i10 >> 24;
   i11 = i11 + 4 | 0;
   HEAP8[i11 >> 0] = 0;
   HEAP8[i11 + 1 >> 0] = 0;
   HEAP8[i11 + 2 >> 0] = 0;
   HEAP8[i11 + 3 >> 0] = 0;
   i11 = i8 + (i4 + -9) | 0;
   i6 = i11;
   HEAP8[i6 >> 0] = i10;
   HEAP8[i6 + 1 >> 0] = i10 >> 8;
   HEAP8[i6 + 2 >> 0] = i10 >> 16;
   HEAP8[i6 + 3 >> 0] = i10 >> 24;
   i11 = i11 + 4 | 0;
   HEAP8[i11 >> 0] = 0;
   HEAP8[i11 + 1 >> 0] = 0;
   HEAP8[i11 + 2 >> 0] = 0;
   HEAP8[i11 + 3 >> 0] = 0;
   HEAP8[i2 >> 0] = i3;
   break;
  }
 default:
  {}
 }
 if (i5 & (i10 | 0) != 0) _memcpy(i1 | 0, i9 | 0, i10 | 0) | 0;
 HEAP8[i8 + i7 >> 0] = 0;
 i11 = i1;
 return i11 | 0;
}

function _sdscatsds(i3, i4) {
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i1 = 0, i2 = 0;
 i1 = HEAPU8[i4 + -1 >> 0] | 0;
 switch (i1 & 7 | 0) {
 case 1:
  {
   i1 = HEAPU8[i4 + -3 >> 0] | 0;
   break;
  }
 case 3:
  {
   i1 = i4 + -9 | 0;
   i1 = HEAPU8[i1 >> 0] | HEAPU8[i1 + 1 >> 0] << 8 | HEAPU8[i1 + 2 >> 0] << 16 | HEAPU8[i1 + 3 >> 0] << 24;
   break;
  }
 case 4:
  {
   i1 = i4 + -17 | 0;
   i1 = HEAPU8[i1 >> 0] | HEAPU8[i1 + 1 >> 0] << 8 | HEAPU8[i1 + 2 >> 0] << 16 | HEAPU8[i1 + 3 >> 0] << 24;
   break;
  }
 case 0:
  {
   i1 = i1 >>> 3;
   break;
  }
 case 2:
  {
   i1 = i4 + -5 | 0;
   i1 = (HEAPU8[i1 >> 0] | HEAPU8[i1 + 1 >> 0] << 8) & 65535;
   break;
  }
 default:
  i1 = 0;
 }
 i2 = HEAPU8[i3 + -1 >> 0] | 0;
 switch (i2 & 7 | 0) {
 case 0:
  {
   i2 = i2 >>> 3;
   break;
  }
 case 4:
  {
   i2 = i3 + -17 | 0;
   i2 = HEAPU8[i2 >> 0] | HEAPU8[i2 + 1 >> 0] << 8 | HEAPU8[i2 + 2 >> 0] << 16 | HEAPU8[i2 + 3 >> 0] << 24;
   break;
  }
 case 1:
  {
   i2 = HEAPU8[i3 + -3 >> 0] | 0;
   break;
  }
 case 2:
  {
   i2 = i3 + -5 | 0;
   i2 = (HEAPU8[i2 >> 0] | HEAPU8[i2 + 1 >> 0] << 8) & 65535;
   break;
  }
 case 3:
  {
   i2 = i3 + -9 | 0;
   i2 = HEAPU8[i2 >> 0] | HEAPU8[i2 + 1 >> 0] << 8 | HEAPU8[i2 + 2 >> 0] << 16 | HEAPU8[i2 + 3 >> 0] << 24;
   break;
  }
 default:
  i2 = 0;
 }
 i3 = _sdsMakeRoomFor(i3, i1) | 0;
 if (!i3) {
  i4 = 0;
  return i4 | 0;
 }
 _memcpy(i3 + i2 | 0, i4 | 0, i1 | 0) | 0;
 i1 = i2 + i1 | 0;
 i2 = i3 + -1 | 0;
 switch ((HEAPU8[i2 >> 0] | 0) & 7 | 0) {
 case 1:
  {
   HEAP8[i3 + -3 >> 0] = i1;
   break;
  }
 case 2:
  {
   i2 = i1 & 65535;
   i4 = i3 + -5 | 0;
   HEAP8[i4 >> 0] = i2;
   HEAP8[i4 + 1 >> 0] = i2 >> 8;
   break;
  }
 case 0:
  {
   HEAP8[i2 >> 0] = i1 << 3;
   break;
  }
 case 3:
  {
   i4 = i3 + -9 | 0;
   HEAP8[i4 >> 0] = i1;
   HEAP8[i4 + 1 >> 0] = i1 >> 8;
   HEAP8[i4 + 2 >> 0] = i1 >> 16;
   HEAP8[i4 + 3 >> 0] = i1 >> 24;
   break;
  }
 case 4:
  {
   i4 = i3 + -17 | 0;
   i2 = i4;
   HEAP8[i2 >> 0] = i1;
   HEAP8[i2 + 1 >> 0] = i1 >> 8;
   HEAP8[i2 + 2 >> 0] = i1 >> 16;
   HEAP8[i2 + 3 >> 0] = i1 >> 24;
   i4 = i4 + 4 | 0;
   HEAP8[i4 >> 0] = 0;
   HEAP8[i4 + 1 >> 0] = 0;
   HEAP8[i4 + 2 >> 0] = 0;
   HEAP8[i4 + 3 >> 0] = 0;
   break;
  }
 default:
  {}
 }
 HEAP8[i3 + i1 >> 0] = 0;
 i4 = i3;
 return i4 | 0;
}

function _sdstrim(i6, i3) {
 i6 = i6 | 0;
 i3 = i3 | 0;
 var i1 = 0, i2 = 0, i4 = 0, i5 = 0;
 i5 = i6 + -1 | 0;
 i1 = HEAPU8[i5 >> 0] | 0;
 switch (i1 & 7 | 0) {
 case 0:
  {
   i1 = i1 >>> 3;
   i4 = 8;
   break;
  }
 case 4:
  {
   i1 = i6 + -17 | 0;
   i1 = HEAPU8[i1 >> 0] | HEAPU8[i1 + 1 >> 0] << 8 | HEAPU8[i1 + 2 >> 0] << 16 | HEAPU8[i1 + 3 >> 0] << 24;
   i4 = 8;
   break;
  }
 case 2:
  {
   i1 = i6 + -5 | 0;
   i1 = (HEAPU8[i1 >> 0] | HEAPU8[i1 + 1 >> 0] << 8) & 65535;
   i4 = 8;
   break;
  }
 case 3:
  {
   i1 = i6 + -9 | 0;
   i1 = HEAPU8[i1 >> 0] | HEAPU8[i1 + 1 >> 0] << 8 | HEAPU8[i1 + 2 >> 0] << 16 | HEAPU8[i1 + 3 >> 0] << 24;
   i4 = 8;
   break;
  }
 case 1:
  {
   i1 = HEAPU8[i6 + -3 >> 0] | 0;
   i4 = 8;
   break;
  }
 default:
  {
   i2 = i6 + -1 | 0;
   i3 = i6;
  }
 }
 L8 : do if ((i4 | 0) == 8) {
  i4 = i1 + -1 | 0;
  i2 = i6 + i4 | 0;
  L10 : do if ((i4 | 0) < 0) i1 = i6; else {
   i1 = i6;
   do {
    if (!(_strchr(i3, HEAP8[i1 >> 0] | 0) | 0)) break L10;
    i1 = i1 + 1 | 0;
   } while (i1 >>> 0 <= i2 >>> 0);
  } while (0);
  if (i2 >>> 0 > i1 >>> 0) while (1) {
   if (!(_strchr(i3, HEAP8[i2 >> 0] | 0) | 0)) {
    i3 = i1;
    break L8;
   }
   i2 = i2 + -1 | 0;
   if (i2 >>> 0 <= i1 >>> 0) {
    i3 = i1;
    break;
   }
  } else i3 = i1;
 } while (0);
 i1 = i3 >>> 0 > i2 >>> 0 ? 0 : 1 - i3 + i2 | 0;
 if ((i3 | 0) != (i6 | 0)) _memmove(i6 | 0, i3 | 0, i1 | 0) | 0;
 HEAP8[i6 + i1 >> 0] = 0;
 switch (HEAPU8[i5 >> 0] & 7 | 0) {
 case 0:
  {
   HEAP8[i5 >> 0] = i1 << 3;
   return i6 | 0;
  }
 case 3:
  {
   i5 = i6 + -9 | 0;
   HEAP8[i5 >> 0] = i1;
   HEAP8[i5 + 1 >> 0] = i1 >> 8;
   HEAP8[i5 + 2 >> 0] = i1 >> 16;
   HEAP8[i5 + 3 >> 0] = i1 >> 24;
   return i6 | 0;
  }
 case 4:
  {
   i5 = i6 + -17 | 0;
   i4 = i5;
   HEAP8[i4 >> 0] = i1;
   HEAP8[i4 + 1 >> 0] = i1 >> 8;
   HEAP8[i4 + 2 >> 0] = i1 >> 16;
   HEAP8[i4 + 3 >> 0] = i1 >> 24;
   i5 = i5 + 4 | 0;
   HEAP8[i5 >> 0] = 0;
   HEAP8[i5 + 1 >> 0] = 0;
   HEAP8[i5 + 2 >> 0] = 0;
   HEAP8[i5 + 3 >> 0] = 0;
   return i6 | 0;
  }
 case 1:
  {
   HEAP8[i6 + -3 >> 0] = i1;
   return i6 | 0;
  }
 case 2:
  {
   i4 = i1 & 65535;
   i5 = i6 + -5 | 0;
   HEAP8[i5 >> 0] = i4;
   HEAP8[i5 + 1 >> 0] = i4 >> 8;
   return i6 | 0;
  }
 default:
  return i6 | 0;
 }
 return 0;
}

function _kh_put_smap(i14, i15, i16) {
 i14 = i14 | 0;
 i15 = i15 | 0;
 i16 = i16 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0;
 i13 = i14 + 8 | 0;
 do if ((HEAP32[i13 >> 2] | 0) >>> 0 >= (HEAP32[i14 + 12 >> 2] | 0) >>> 0) {
  i1 = HEAP32[i14 >> 2] | 0;
  if (i1 >>> 0 > HEAP32[i14 + 4 >> 2] << 1 >>> 0) {
   if ((_kh_resize_smap(i14, i1 + -1 | 0) | 0) >= 0) break;
   HEAP32[i16 >> 2] = -1;
   i16 = HEAP32[i14 >> 2] | 0;
   return i16 | 0;
  } else {
   if ((_kh_resize_smap(i14, i1 + 1 | 0) | 0) >= 0) break;
   HEAP32[i16 >> 2] = -1;
   i16 = HEAP32[i14 >> 2] | 0;
   return i16 | 0;
  }
 } while (0);
 i10 = HEAP32[i14 >> 2] | 0;
 i6 = i10 + -1 | 0;
 i4 = i6 & i15;
 i11 = HEAP32[i14 + 16 >> 2] | 0;
 do if (!(2 << (i4 << 1 & 30) & HEAP32[i11 + (i4 >>> 4 << 2) >> 2])) {
  i7 = i14 + 20 | 0;
  i8 = i4;
  i3 = i10;
  i9 = 0;
  while (1) {
   i2 = HEAP32[i11 + (i8 >>> 4 << 2) >> 2] | 0;
   i1 = i8 << 1 & 30;
   i5 = i2 >>> i1;
   if (i5 & 2) {
    i4 = i8;
    break;
   }
   if ((i5 & 1 | 0) == 0 ? (HEAP32[(HEAP32[i7 >> 2] | 0) + (i8 << 2) >> 2] | 0) == (i15 | 0) : 0) {
    i4 = i8;
    break;
   }
   i3 = (i2 & 1 << i1 | 0) == 0 ? i3 : i8;
   i9 = i9 + 1 | 0;
   i8 = i9 + i8 & i6;
   if ((i8 | 0) == (i4 | 0)) {
    i12 = 13;
    break;
   }
  }
  if ((i12 | 0) == 13) if ((i3 | 0) != (i10 | 0)) {
   i4 = i3;
   break;
  }
  i4 = ((i3 | 0) == (i10 | 0) ? 1 : (HEAP32[i11 + (i4 >>> 4 << 2) >> 2] & 2 << (i4 << 1 & 30) | 0) == 0) ? i4 : i3;
 } while (0);
 i1 = i11 + (i4 >>> 4 << 2) | 0;
 i2 = i4 << 1 & 30;
 i3 = (HEAP32[i1 >> 2] | 0) >>> i2;
 if (i3 & 2) {
  HEAP32[(HEAP32[i14 + 20 >> 2] | 0) + (i4 << 2) >> 2] = i15;
  HEAP32[i1 >> 2] = HEAP32[i1 >> 2] & ~(3 << i2);
  i15 = i14 + 4 | 0;
  HEAP32[i15 >> 2] = (HEAP32[i15 >> 2] | 0) + 1;
  HEAP32[i13 >> 2] = (HEAP32[i13 >> 2] | 0) + 1;
  HEAP32[i16 >> 2] = 1;
  i16 = i4;
  return i16 | 0;
 }
 if (!(i3 & 1)) {
  HEAP32[i16 >> 2] = 0;
  i16 = i4;
  return i16 | 0;
 } else {
  HEAP32[(HEAP32[i14 + 20 >> 2] | 0) + (i4 << 2) >> 2] = i15;
  HEAP32[i1 >> 2] = HEAP32[i1 >> 2] & ~(3 << i2);
  i15 = i14 + 4 | 0;
  HEAP32[i15 >> 2] = (HEAP32[i15 >> 2] | 0) + 1;
  HEAP32[i16 >> 2] = 2;
  i16 = i4;
  return i16 | 0;
 }
 return 0;
}

function _kh_put_imap(i14, i15, i16) {
 i14 = i14 | 0;
 i15 = i15 | 0;
 i16 = i16 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0;
 i13 = i14 + 8 | 0;
 do if ((HEAP32[i13 >> 2] | 0) >>> 0 >= (HEAP32[i14 + 12 >> 2] | 0) >>> 0) {
  i1 = HEAP32[i14 >> 2] | 0;
  if (i1 >>> 0 > HEAP32[i14 + 4 >> 2] << 1 >>> 0) {
   if ((_kh_resize_imap(i14, i1 + -1 | 0) | 0) >= 0) break;
   HEAP32[i16 >> 2] = -1;
   i16 = HEAP32[i14 >> 2] | 0;
   return i16 | 0;
  } else {
   if ((_kh_resize_imap(i14, i1 + 1 | 0) | 0) >= 0) break;
   HEAP32[i16 >> 2] = -1;
   i16 = HEAP32[i14 >> 2] | 0;
   return i16 | 0;
  }
 } while (0);
 i10 = HEAP32[i14 >> 2] | 0;
 i6 = i10 + -1 | 0;
 i4 = i6 & i15;
 i11 = HEAP32[i14 + 16 >> 2] | 0;
 do if (!(2 << (i4 << 1 & 30) & HEAP32[i11 + (i4 >>> 4 << 2) >> 2])) {
  i7 = i14 + 20 | 0;
  i8 = i4;
  i3 = i10;
  i9 = 0;
  while (1) {
   i2 = HEAP32[i11 + (i8 >>> 4 << 2) >> 2] | 0;
   i1 = i8 << 1 & 30;
   i5 = i2 >>> i1;
   if (i5 & 2) {
    i4 = i8;
    break;
   }
   if ((i5 & 1 | 0) == 0 ? (HEAP32[(HEAP32[i7 >> 2] | 0) + (i8 << 2) >> 2] | 0) == (i15 | 0) : 0) {
    i4 = i8;
    break;
   }
   i3 = (i2 & 1 << i1 | 0) == 0 ? i3 : i8;
   i9 = i9 + 1 | 0;
   i8 = i9 + i8 & i6;
   if ((i8 | 0) == (i4 | 0)) {
    i12 = 13;
    break;
   }
  }
  if ((i12 | 0) == 13) if ((i3 | 0) != (i10 | 0)) {
   i4 = i3;
   break;
  }
  i4 = ((i3 | 0) == (i10 | 0) ? 1 : (HEAP32[i11 + (i4 >>> 4 << 2) >> 2] & 2 << (i4 << 1 & 30) | 0) == 0) ? i4 : i3;
 } while (0);
 i1 = i11 + (i4 >>> 4 << 2) | 0;
 i2 = i4 << 1 & 30;
 i3 = (HEAP32[i1 >> 2] | 0) >>> i2;
 if (i3 & 2) {
  HEAP32[(HEAP32[i14 + 20 >> 2] | 0) + (i4 << 2) >> 2] = i15;
  HEAP32[i1 >> 2] = HEAP32[i1 >> 2] & ~(3 << i2);
  i15 = i14 + 4 | 0;
  HEAP32[i15 >> 2] = (HEAP32[i15 >> 2] | 0) + 1;
  HEAP32[i13 >> 2] = (HEAP32[i13 >> 2] | 0) + 1;
  HEAP32[i16 >> 2] = 1;
  i16 = i4;
  return i16 | 0;
 }
 if (!(i3 & 1)) {
  HEAP32[i16 >> 2] = 0;
  i16 = i4;
  return i16 | 0;
 } else {
  HEAP32[(HEAP32[i14 + 20 >> 2] | 0) + (i4 << 2) >> 2] = i15;
  HEAP32[i1 >> 2] = HEAP32[i1 >> 2] & ~(3 << i2);
  i15 = i14 + 4 | 0;
  HEAP32[i15 >> 2] = (HEAP32[i15 >> 2] | 0) + 1;
  HEAP32[i16 >> 2] = 2;
  i16 = i4;
  return i16 | 0;
 }
 return 0;
}

function _sdsrange(i6, i3, i2) {
 i6 = i6 | 0;
 i3 = i3 | 0;
 i2 = i2 | 0;
 var i1 = 0, i4 = 0, i5 = 0;
 i5 = i6 + -1 | 0;
 i1 = HEAPU8[i5 >> 0] | 0;
 switch (i1 & 7 | 0) {
 case 2:
  {
   i4 = i6 + -5 | 0;
   i4 = (HEAPU8[i4 >> 0] | HEAPU8[i4 + 1 >> 0] << 8) & 65535;
   break;
  }
 case 0:
  {
   i4 = i1 >>> 3;
   break;
  }
 case 3:
  {
   i4 = i6 + -9 | 0;
   i4 = HEAPU8[i4 >> 0] | HEAPU8[i4 + 1 >> 0] << 8 | HEAPU8[i4 + 2 >> 0] << 16 | HEAPU8[i4 + 3 >> 0] << 24;
   break;
  }
 case 4:
  {
   i4 = i6 + -17 | 0;
   i4 = HEAPU8[i4 >> 0] | HEAPU8[i4 + 1 >> 0] << 8 | HEAPU8[i4 + 2 >> 0] << 16 | HEAPU8[i4 + 3 >> 0] << 24;
   break;
  }
 case 1:
  {
   i4 = HEAPU8[i6 + -3 >> 0] | 0;
   break;
  }
 default:
  return;
 }
 if (!i4) return;
 if ((i3 | 0) < 0) {
  i3 = i4 + i3 | 0;
  i3 = (i3 | 0) < 0 ? 0 : i3;
 }
 if ((i2 | 0) < 0) {
  i2 = i4 + i2 | 0;
  i2 = (i2 | 0) < 0 ? 0 : i2;
 }
 i1 = (i2 | 0) < (i3 | 0) ? 0 : 1 - i3 + i2 | 0;
 if ((i4 | 0) > (i3 | 0) & (i1 | 0) != 0) {
  if ((i2 | 0) >= (i4 | 0)) i1 = (i4 + -1 | 0) < (i3 | 0) ? 0 : i4 - i3 | 0;
  if ((i3 | 0) != 0 & (i1 | 0) != 0) _memmove(i6 | 0, i6 + i3 | 0, i1 | 0) | 0;
 } else i1 = 0;
 HEAP8[i6 + i1 >> 0] = 0;
 switch ((HEAPU8[i5 >> 0] | 0) & 7 | 0) {
 case 0:
  {
   HEAP8[i5 >> 0] = i1 << 3;
   return;
  }
 case 3:
  {
   i6 = i6 + -9 | 0;
   HEAP8[i6 >> 0] = i1;
   HEAP8[i6 + 1 >> 0] = i1 >> 8;
   HEAP8[i6 + 2 >> 0] = i1 >> 16;
   HEAP8[i6 + 3 >> 0] = i1 >> 24;
   return;
  }
 case 4:
  {
   i6 = i6 + -17 | 0;
   i5 = i6;
   HEAP8[i5 >> 0] = i1;
   HEAP8[i5 + 1 >> 0] = i1 >> 8;
   HEAP8[i5 + 2 >> 0] = i1 >> 16;
   HEAP8[i5 + 3 >> 0] = i1 >> 24;
   i6 = i6 + 4 | 0;
   HEAP8[i6 >> 0] = 0;
   HEAP8[i6 + 1 >> 0] = 0;
   HEAP8[i6 + 2 >> 0] = 0;
   HEAP8[i6 + 3 >> 0] = 0;
   return;
  }
 case 1:
  {
   HEAP8[i6 + -3 >> 0] = i1;
   return;
  }
 case 2:
  {
   i5 = i1 & 65535;
   i6 = i6 + -5 | 0;
   HEAP8[i6 >> 0] = i5;
   HEAP8[i6 + 1 >> 0] = i5 >> 8;
   return;
  }
 default:
  return;
 }
}

function _draw() {
 var i1 = 0, i2 = 0;
 i1 = HEAP32[662] | 0;
 if ((HEAP32[663] | 0) != (Math_imul(i1, i1) | 0)) {
  _parg_buffer_free(HEAP32[654] | 0);
  _parg_framebuffer_free(HEAP32[655] | 0);
  _parg_framebuffer_free(HEAP32[656] | 0);
  _parg_framebuffer_free(HEAP32[657] | 0);
  _create_particles();
 }
 i2 = _parg_mesh_coord(HEAP32[652] | 0) | 0;
 i1 = _parg_mesh_uv(HEAP32[652] | 0) | 0;
 _parg_shader_bind(HEAP32[668] | 0);
 _parg_varray_enable(i2, HEAP32[692] | 0, 2, 5126, 0, 0);
 _parg_varray_enable(i1, HEAP32[698] | 0, 2, 5126, 0, 0);
 _parg_texture_bind(HEAP32[650] | 0, 0);
 _parg_draw_one_quad();
 _parg_shader_bind(HEAP32[686] | 0);
 _parg_uniform1i(HEAP32[712] | 0, 0);
 _parg_uniform1i(HEAP32[718] | 0, 1);
 _parg_uniform1f(HEAP32[724] | 0, Math_fround(.000277555577));
 _parg_framebuffer_bindtex(HEAP32[655] | 0, 0);
 _parg_framebuffer_bindtex(HEAP32[657] | 0, 1);
 _parg_framebuffer_pushfbo(HEAP32[656] | 0, 0);
 _parg_draw_one_quad();
 _parg_framebuffer_popfbo();
 _parg_framebuffer_swap(HEAP32[655] | 0, HEAP32[656] | 0);
 _parg_varray_disable(HEAP32[698] | 0);
 _parg_shader_bind(HEAP32[674] | 0);
 _parg_state_blending(1);
 _parg_uniform1f(HEAP32[734] | 0, Math_fround(HEAPF32[658]));
 _parg_uniform1f(HEAP32[706] | 0, Math_fround(3.0));
 _parg_varray_enable(HEAP32[653] | 0, HEAP32[692] | 0, 3, 5126, 0, 0);
 _parg_texture_bind(HEAP32[651] | 0, 0);
 _parg_draw_points(3);
 _parg_shader_bind(HEAP32[680] | 0);
 _parg_state_blending(2);
 _parg_uniform1f(HEAP32[734] | 0, Math_fround(HEAPF32[658]));
 _parg_uniform1f(HEAP32[706] | 0, Math_fround(HEAP32[663] | 0));
 _parg_varray_enable(HEAP32[654] | 0, HEAP32[692] | 0, 1, 5126, 0, 0);
 _parg_framebuffer_bindtex(HEAP32[655] | 0, 0);
 _parg_uniform1i(HEAP32[712] | 0, 0);
 _parg_uniform1f(HEAP32[730] | 0, Math_fround(HEAP32[662] | 0));
 _parg_draw_points(HEAP32[663] | 0);
 _parg_state_blending(0);
 return;
}

function _create_particles() {
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, f6 = f0, i7 = 0, i8 = 0, f9 = f0, i10 = 0;
 i1 = HEAP32[662] | 0;
 i1 = Math_imul(i1, i1) | 0;
 HEAP32[663] = i1;
 i2 = i1 << 2;
 i3 = _malloc(i2) | 0;
 if (i1) {
  i4 = 0;
  i5 = i3;
  while (1) {
   f6 = Math_fround(i4 | 0);
   HEAPF32[i5 >> 2] = f6;
   i4 = i4 + 1 | 0;
   if ((i4 | 0) >= (i1 | 0)) break; else i5 = i5 + 4 | 0;
  }
 }
 i5 = _parg_buffer_create(i3, i2, 2) | 0;
 HEAP32[654] = i5;
 _free(i3);
 i5 = HEAP32[663] | 0;
 i7 = i5 << 4;
 i8 = _malloc(i7) | 0;
 f6 = Math_fround(2.0 / +(i5 + -1 | 0));
 if ((i5 | 0) > 0) {
  i4 = 0;
  i3 = i8;
  while (1) {
   f9 = Math_fround(Math_fround(f6 * Math_fround(i4 | 0)) + Math_fround(-1.0));
   HEAPF32[i3 >> 2] = f9;
   HEAPF32[i3 + 4 >> 2] = Math_fround(1.0);
   f9 = Math_fround(f9 + Math_fround(.00249999994));
   HEAPF32[i3 + 8 >> 2] = f9;
   HEAPF32[i3 + 12 >> 2] = Math_fround(1.0);
   i4 = i4 + 1 | 0;
   if ((i4 | 0) >= (i5 | 0)) break; else i3 = i3 + 16 | 0;
  }
 }
 i5 = HEAP32[662] | 0;
 i4 = _parg_framebuffer_create(i5, i5, i8, i7, 3) | 0;
 HEAP32[655] = i4;
 i4 = _parg_framebuffer_create_empty(i5, i5, 3) | 0;
 HEAP32[656] = i4;
 i4 = HEAP32[663] | 0;
 if ((i4 | 0) <= 0) {
  i7 = _parg_framebuffer_create(i5, i5, i8, i7, 3) | 0;
  HEAP32[657] = i7;
  _free(i8);
  return;
 }
 i3 = HEAP32[661] | 0;
 i2 = 0;
 i1 = i8;
 while (1) {
  i10 = ((i2 | 0) % 3 | 0) * 3 | 0;
  HEAP32[i1 >> 2] = HEAP32[i3 + (i10 << 2) >> 2];
  HEAP32[i1 + 4 >> 2] = HEAP32[i3 + (i10 + 1 << 2) >> 2];
  HEAP32[i1 + 8 >> 2] = HEAP32[i3 + (i10 + 2 << 2) >> 2];
  HEAPF32[i1 + 12 >> 2] = Math_fround(0.0);
  i2 = i2 + 1 | 0;
  if ((i2 | 0) >= (i4 | 0)) break; else i1 = i1 + 16 | 0;
 }
 i10 = _parg_framebuffer_create(i5, i5, i8, i7, 3) | 0;
 HEAP32[657] = i10;
 _free(i8);
 return;
}

function __ZN53EmscriptenBindingInitializer_native_and_builtin_typesC2Ev(i1) {
 i1 = i1 | 0;
 __embind_register_void(5088, 3096);
 __embind_register_bool(5120, 3104, 1, 1, 0);
 __embind_register_integer(5136, 3112, 1, -128, 127);
 __embind_register_integer(5168, 3120, 1, -128, 127);
 __embind_register_integer(5152, 3136, 1, 0, 255);
 __embind_register_integer(5184, 3152, 2, -32768, 32767);
 __embind_register_integer(5200, 3160, 2, 0, 65535);
 __embind_register_integer(5216, 3176, 4, -2147483648, 2147483647);
 __embind_register_integer(5232, 3184, 4, 0, -1);
 __embind_register_integer(5248, 3200, 4, -2147483648, 2147483647);
 __embind_register_integer(5264, 3208, 4, 0, -1);
 __embind_register_float(5280, 3224, 4);
 __embind_register_float(5296, 3232, 8);
 __embind_register_std_string(2040, 3240);
 __embind_register_std_string(3256, 3280);
 __embind_register_std_wstring(3320, 4, 3344);
 __embind_register_emval(2376, 3360);
 __embind_register_memory_view(3376, 0, 3384);
 __embind_register_memory_view(3416, 0, 3424);
 __embind_register_memory_view(3464, 1, 3472);
 __embind_register_memory_view(3512, 2, 3520);
 __embind_register_memory_view(3552, 3, 3560);
 __embind_register_memory_view(3600, 4, 3608);
 __embind_register_memory_view(3640, 5, 3648);
 __embind_register_memory_view(3688, 4, 3696);
 __embind_register_memory_view(3728, 5, 3736);
 __embind_register_memory_view(3416, 0, 3776);
 __embind_register_memory_view(3464, 1, 3808);
 __embind_register_memory_view(3512, 2, 3848);
 __embind_register_memory_view(3552, 3, 3888);
 __embind_register_memory_view(3600, 4, 3928);
 __embind_register_memory_view(3640, 5, 3968);
 __embind_register_memory_view(4008, 6, 4016);
 __embind_register_memory_view(4048, 7, 4056);
 __embind_register_memory_view(4088, 7, 4096);
 return;
}

function _sdscat(i1, i5) {
 i1 = i1 | 0;
 i5 = i5 | 0;
 var i2 = 0, i3 = 0, i4 = 0;
 i3 = _strlen(i5 | 0) | 0;
 i2 = HEAPU8[i1 + -1 >> 0] | 0;
 switch (i2 & 7 | 0) {
 case 0:
  {
   i2 = i2 >>> 3;
   break;
  }
 case 4:
  {
   i2 = i1 + -17 | 0;
   i2 = HEAPU8[i2 >> 0] | HEAPU8[i2 + 1 >> 0] << 8 | HEAPU8[i2 + 2 >> 0] << 16 | HEAPU8[i2 + 3 >> 0] << 24;
   break;
  }
 case 3:
  {
   i2 = i1 + -9 | 0;
   i2 = HEAPU8[i2 >> 0] | HEAPU8[i2 + 1 >> 0] << 8 | HEAPU8[i2 + 2 >> 0] << 16 | HEAPU8[i2 + 3 >> 0] << 24;
   break;
  }
 case 1:
  {
   i2 = HEAPU8[i1 + -3 >> 0] | 0;
   break;
  }
 case 2:
  {
   i2 = i1 + -5 | 0;
   i2 = (HEAPU8[i2 >> 0] | HEAPU8[i2 + 1 >> 0] << 8) & 65535;
   break;
  }
 default:
  i2 = 0;
 }
 i4 = _sdsMakeRoomFor(i1, i3) | 0;
 if (!i4) {
  i5 = 0;
  return i5 | 0;
 }
 _memcpy(i4 + i2 | 0, i5 | 0, i3 | 0) | 0;
 i1 = i2 + i3 | 0;
 i2 = i4 + -1 | 0;
 switch ((HEAPU8[i2 >> 0] | 0) & 7 | 0) {
 case 0:
  {
   HEAP8[i2 >> 0] = i1 << 3;
   break;
  }
 case 1:
  {
   HEAP8[i4 + -3 >> 0] = i1;
   break;
  }
 case 2:
  {
   i3 = i1 & 65535;
   i5 = i4 + -5 | 0;
   HEAP8[i5 >> 0] = i3;
   HEAP8[i5 + 1 >> 0] = i3 >> 8;
   break;
  }
 case 3:
  {
   i5 = i4 + -9 | 0;
   HEAP8[i5 >> 0] = i1;
   HEAP8[i5 + 1 >> 0] = i1 >> 8;
   HEAP8[i5 + 2 >> 0] = i1 >> 16;
   HEAP8[i5 + 3 >> 0] = i1 >> 24;
   break;
  }
 case 4:
  {
   i5 = i4 + -17 | 0;
   i3 = i5;
   HEAP8[i3 >> 0] = i1;
   HEAP8[i3 + 1 >> 0] = i1 >> 8;
   HEAP8[i3 + 2 >> 0] = i1 >> 16;
   HEAP8[i3 + 3 >> 0] = i1 >> 24;
   i5 = i5 + 4 | 0;
   HEAP8[i5 >> 0] = 0;
   HEAP8[i5 + 1 >> 0] = 0;
   HEAP8[i5 + 2 >> 0] = 0;
   HEAP8[i5 + 3 >> 0] = 0;
   break;
  }
 default:
  {}
 }
 HEAP8[i4 + i1 >> 0] = 0;
 i5 = i4;
 return i5 | 0;
}

function __ZNK10__cxxabiv120__si_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib(i3, i7, i6, i2, i4) {
 i3 = i3 | 0;
 i7 = i7 | 0;
 i6 = i6 | 0;
 i2 = i2 | 0;
 i4 = i4 | 0;
 var i1 = 0, i5 = 0, i8 = 0, i9 = 0;
 L1 : do if ((i3 | 0) == (HEAP32[i7 + 8 >> 2] | 0)) {
  if ((HEAP32[i7 + 4 >> 2] | 0) == (i6 | 0) ? (i1 = i7 + 28 | 0, (HEAP32[i1 >> 2] | 0) != 1) : 0) HEAP32[i1 >> 2] = i2;
 } else {
  if ((i3 | 0) != (HEAP32[i7 >> 2] | 0)) {
   i8 = HEAP32[i3 + 8 >> 2] | 0;
   FUNCTION_TABLE_viiiii[HEAP32[(HEAP32[i8 >> 2] | 0) + 24 >> 2] & 3](i8, i7, i6, i2, i4);
   break;
  }
  if ((HEAP32[i7 + 16 >> 2] | 0) != (i6 | 0) ? (i5 = i7 + 20 | 0, (HEAP32[i5 >> 2] | 0) != (i6 | 0)) : 0) {
   HEAP32[i7 + 32 >> 2] = i2;
   i2 = i7 + 44 | 0;
   if ((HEAP32[i2 >> 2] | 0) == 4) break;
   i1 = i7 + 52 | 0;
   HEAP8[i1 >> 0] = 0;
   i9 = i7 + 53 | 0;
   HEAP8[i9 >> 0] = 0;
   i3 = HEAP32[i3 + 8 >> 2] | 0;
   FUNCTION_TABLE_viiiiii[HEAP32[(HEAP32[i3 >> 2] | 0) + 20 >> 2] & 3](i3, i7, i6, i6, 1, i4);
   if (HEAP8[i9 >> 0] | 0) {
    if (!(HEAP8[i1 >> 0] | 0)) {
     i1 = 1;
     i8 = 13;
    }
   } else {
    i1 = 0;
    i8 = 13;
   }
   do if ((i8 | 0) == 13) {
    HEAP32[i5 >> 2] = i6;
    i9 = i7 + 40 | 0;
    HEAP32[i9 >> 2] = (HEAP32[i9 >> 2] | 0) + 1;
    if ((HEAP32[i7 + 36 >> 2] | 0) == 1 ? (HEAP32[i7 + 24 >> 2] | 0) == 2 : 0) {
     HEAP8[i7 + 54 >> 0] = 1;
     if (i1) break;
    } else i8 = 16;
    if ((i8 | 0) == 16 ? i1 : 0) break;
    HEAP32[i2 >> 2] = 4;
    break L1;
   } while (0);
   HEAP32[i2 >> 2] = 3;
   break;
  }
  if ((i2 | 0) == 1) HEAP32[i7 + 32 >> 2] = 1;
 } while (0);
 return;
}

function ___dynamic_cast(i2, i3, i12, i1) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i12 = i12 | 0;
 i1 = i1 | 0;
 var i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i13 = 0, i14 = 0;
 i14 = STACKTOP;
 STACKTOP = STACKTOP + 64 | 0;
 i13 = i14;
 i11 = HEAP32[i2 >> 2] | 0;
 i10 = i2 + (HEAP32[i11 + -8 >> 2] | 0) | 0;
 i11 = HEAP32[i11 + -4 >> 2] | 0;
 HEAP32[i13 >> 2] = i12;
 HEAP32[i13 + 4 >> 2] = i2;
 HEAP32[i13 + 8 >> 2] = i3;
 HEAP32[i13 + 12 >> 2] = i1;
 i4 = i13 + 16 | 0;
 i5 = i13 + 20 | 0;
 i6 = i13 + 24 | 0;
 i7 = i13 + 28 | 0;
 i8 = i13 + 32 | 0;
 i9 = i13 + 40 | 0;
 i3 = (i11 | 0) == (i12 | 0);
 i2 = i4;
 i1 = i2 + 36 | 0;
 do {
  HEAP32[i2 >> 2] = 0;
  i2 = i2 + 4 | 0;
 } while ((i2 | 0) < (i1 | 0));
 HEAP16[i4 + 36 >> 1] = 0;
 HEAP8[i4 + 38 >> 0] = 0;
 do if (i3) {
  HEAP32[i13 + 48 >> 2] = 1;
  FUNCTION_TABLE_viiiiii[HEAP32[(HEAP32[i12 >> 2] | 0) + 20 >> 2] & 3](i12, i13, i10, i10, 1, 0);
  i1 = (HEAP32[i6 >> 2] | 0) == 1 ? i10 : 0;
 } else {
  FUNCTION_TABLE_viiiii[HEAP32[(HEAP32[i11 >> 2] | 0) + 24 >> 2] & 3](i11, i13, i10, 1, 0);
  i1 = HEAP32[i13 + 36 >> 2] | 0;
  if (!i1) {
   i1 = (HEAP32[i9 >> 2] | 0) == 1 & (HEAP32[i7 >> 2] | 0) == 1 & (HEAP32[i8 >> 2] | 0) == 1 ? HEAP32[i5 >> 2] | 0 : 0;
   break;
  } else if ((i1 | 0) != 1) {
   i1 = 0;
   break;
  }
  if ((HEAP32[i6 >> 2] | 0) != 1 ? !((HEAP32[i9 >> 2] | 0) == 0 & (HEAP32[i7 >> 2] | 0) == 1 & (HEAP32[i8 >> 2] | 0) == 1) : 0) {
   i1 = 0;
   break;
  }
  i1 = HEAP32[i4 >> 2] | 0;
 } while (0);
 STACKTOP = i14;
 return i1 | 0;
}

function __ZNK10__cxxabiv121__vmi_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib(i1, i12, i11, i10, i13, i14) {
 i1 = i1 | 0;
 i12 = i12 | 0;
 i11 = i11 | 0;
 i10 = i10 | 0;
 i13 = i13 | 0;
 i14 = i14 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0;
 if ((i1 | 0) == (HEAP32[i12 + 8 >> 2] | 0)) __ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i(0, i12, i11, i10, i13); else {
  i6 = i12 + 52 | 0;
  i7 = HEAP8[i6 >> 0] | 0;
  i8 = i12 + 53 | 0;
  i9 = HEAP8[i8 >> 0] | 0;
  i5 = HEAP32[i1 + 12 >> 2] | 0;
  i2 = i1 + 16 + (i5 << 3) | 0;
  HEAP8[i6 >> 0] = 0;
  HEAP8[i8 >> 0] = 0;
  __ZNK10__cxxabiv122__base_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib(i1 + 16 | 0, i12, i11, i10, i13, i14);
  L4 : do if ((i5 | 0) > 1) {
   i3 = i12 + 24 | 0;
   i4 = i1 + 8 | 0;
   i5 = i12 + 54 | 0;
   i1 = i1 + 24 | 0;
   do {
    if (HEAP8[i5 >> 0] | 0) break L4;
    if (!(HEAP8[i6 >> 0] | 0)) {
     if ((HEAP8[i8 >> 0] | 0) != 0 ? (HEAP32[i4 >> 2] & 1 | 0) == 0 : 0) break L4;
    } else {
     if ((HEAP32[i3 >> 2] | 0) == 1) break L4;
     if (!(HEAP32[i4 >> 2] & 2)) break L4;
    }
    HEAP8[i6 >> 0] = 0;
    HEAP8[i8 >> 0] = 0;
    __ZNK10__cxxabiv122__base_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib(i1, i12, i11, i10, i13, i14);
    i1 = i1 + 8 | 0;
   } while (i1 >>> 0 < i2 >>> 0);
  } while (0);
  HEAP8[i6 >> 0] = i7;
  HEAP8[i8 >> 0] = i9;
 }
 return;
}

function _parg_framebuffer_create_empty(i10, i7, i1) {
 i10 = i10 | 0;
 i7 = i7 | 0;
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i8 = 0, i9 = 0, i11 = 0;
 i11 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i9 = i11 + 12 | 0;
 i6 = i11 + 8 | 0;
 i5 = i11 + 4 | 0;
 i8 = i11;
 HEAP32[i5 >> 2] = 0;
 i2 = i1 & 8;
 i3 = i2 >>> 3 | 9728;
 i4 = (i1 >>> 1 & 1) + 6407 | 0;
 if (!(i1 & 1)) i1 = (i1 & 4 | 0) == 0 ? 5121 : 36193; else i1 = 5126;
 _glGenTextures(1, i9 | 0);
 _glBindTexture(3553, HEAP32[i9 >> 2] | 0);
 _glTexParameteri(3553, 10241, i3 | 0);
 _glTexParameteri(3553, 10240, i3 | 0);
 _glTexImage2D(3553, 0, i4 | 0, i10 | 0, i7 | 0, 0, i4 | 0, i1 | 0, 0);
 _glGetIntegerv(36006, i8 | 0);
 _glGenFramebuffers(1, i6 | 0);
 _glBindFramebuffer(36160, HEAP32[i6 >> 2] | 0);
 _glFramebufferTexture2D(36160, 36064, 3553, HEAP32[i9 >> 2] | 0, 0);
 if (i2) {
  _glGenRenderbuffers(1, i5 | 0);
  _glBindRenderbuffer(36161, HEAP32[i5 >> 2] | 0);
  _glRenderbufferStorage(36161, 33189, i10 | 0, i7 | 0);
  _glFramebufferRenderbuffer(36160, 36096, 36161, HEAP32[i5 >> 2] | 0);
 }
 if ((_glCheckFramebufferStatus(36160) | 0) != 36053) _puts(392) | 0;
 _glBindFramebuffer(36160, HEAP32[i8 >> 2] | 0);
 i8 = _malloc(20) | 0;
 HEAP32[i8 >> 2] = i10;
 HEAP32[i8 + 4 >> 2] = i7;
 HEAP32[i8 + 8 >> 2] = HEAP32[i9 >> 2];
 HEAP32[i8 + 12 >> 2] = HEAP32[i6 >> 2];
 HEAP32[i8 + 16 >> 2] = HEAP32[i5 >> 2];
 STACKTOP = i11;
 return i8 | 0;
}

function _main(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0;
 HEAP32[662] = 512;
 HEAP32[660] = 1;
 i3 = _parg_token_from_string(2656) | 0;
 HEAP32[668] = i3;
 i3 = _parg_token_from_string(2680) | 0;
 HEAP32[674] = i3;
 i3 = _parg_token_from_string(2704) | 0;
 HEAP32[680] = i3;
 i3 = _parg_token_from_string(2728) | 0;
 HEAP32[686] = i3;
 i3 = _parg_token_from_string(2752) | 0;
 HEAP32[692] = i3;
 i3 = _parg_token_from_string(2776) | 0;
 HEAP32[698] = i3;
 _parg_token_from_string(2800) | 0;
 i3 = _parg_token_from_string(2808) | 0;
 HEAP32[706] = i3;
 i3 = _parg_token_from_string(2832) | 0;
 HEAP32[712] = i3;
 i3 = _parg_token_from_string(2856) | 0;
 HEAP32[718] = i3;
 i3 = _parg_token_from_string(2880) | 0;
 HEAP32[724] = i3;
 i3 = _parg_token_from_string(2904) | 0;
 HEAP32[730] = i3;
 i3 = _parg_token_from_string(2928) | 0;
 HEAP32[734] = i3;
 i3 = _parg_token_from_string(2944) | 0;
 HEAP32[742] = i3;
 _parg_asset_preload(i3);
 i3 = _parg_token_from_string(2976) | 0;
 HEAP32[748] = i3;
 _parg_asset_preload(i3);
 i3 = _parg_token_from_string(3e3) | 0;
 HEAP32[754] = i3;
 _parg_asset_preload(i3);
 _parg_window_setargs(i1, i2);
 _parg_window_oninit(2);
 _parg_window_ontick(2);
 _parg_window_ondraw(5);
 _parg_window_onexit(6);
 _parg_window_oninput(3);
 _parg_window_onmessage(20);
 return _parg_window_exec(Math_fround(256.0), Math_fround(256.0), 1, 0) | 0;
}

function __ZNK10__cxxabiv119__pointer_type_info9can_catchEPKNS_16__shim_type_infoERPv(i2, i1, i7) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 i7 = i7 | 0;
 var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i8 = 0, i9 = 0;
 i9 = STACKTOP;
 STACKTOP = STACKTOP + 64 | 0;
 i8 = i9;
 HEAP32[i7 >> 2] = HEAP32[HEAP32[i7 >> 2] >> 2];
 if (!((i2 | 0) == (i1 | 0) | (i1 | 0) == 5104)) if (((i1 | 0) != 0 ? (i3 = ___dynamic_cast(i1, 4808, 4976, 0) | 0, (i3 | 0) != 0) : 0) ? (HEAP32[i3 + 8 >> 2] & ~HEAP32[i2 + 8 >> 2] | 0) == 0 : 0) {
  i1 = HEAP32[i2 + 12 >> 2] | 0;
  i2 = i3 + 12 | 0;
  if (!((i1 | 0) == 5088 ? 1 : (i1 | 0) == (HEAP32[i2 >> 2] | 0))) if ((((i1 | 0) != 0 ? (i5 = ___dynamic_cast(i1, 4808, 4864, 0) | 0, (i5 | 0) != 0) : 0) ? (i4 = HEAP32[i2 >> 2] | 0, (i4 | 0) != 0) : 0) ? (i6 = ___dynamic_cast(i4, 4808, 4864, 0) | 0, (i6 | 0) != 0) : 0) {
   i1 = i8;
   i2 = i1 + 56 | 0;
   do {
    HEAP32[i1 >> 2] = 0;
    i1 = i1 + 4 | 0;
   } while ((i1 | 0) < (i2 | 0));
   HEAP32[i8 >> 2] = i6;
   HEAP32[i8 + 8 >> 2] = i5;
   HEAP32[i8 + 12 >> 2] = -1;
   HEAP32[i8 + 48 >> 2] = 1;
   FUNCTION_TABLE_viiii[HEAP32[(HEAP32[i6 >> 2] | 0) + 28 >> 2] & 3](i6, i8, HEAP32[i7 >> 2] | 0, 1);
   if ((HEAP32[i8 + 24 >> 2] | 0) == 1) {
    HEAP32[i7 >> 2] = HEAP32[i8 + 16 >> 2];
    i1 = 1;
   } else i1 = 0;
  } else i1 = 0; else i1 = 1;
 } else i1 = 0; else i1 = 1;
 STACKTOP = i9;
 return i1 | 0;
}

function _parg_texture_from_asset(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0;
 i13 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i12 = i13;
 i11 = _malloc(12) | 0;
 i5 = _parg_buffer_slurp_asset(i1, i12) | 0;
 i9 = HEAP32[i12 >> 2] | 0;
 HEAP32[i11 >> 2] = HEAP32[i9 >> 2];
 i10 = i11 + 4 | 0;
 HEAP32[i10 >> 2] = HEAP32[i9 + 4 >> 2];
 HEAP32[i12 >> 2] = i9 + 12;
 if ((HEAP32[i9 + 8 >> 2] | 0) != 4) ___assert_fail(1240, 1256, 21, 1296);
 i2 = i11 + 8 | 0;
 _glGenTextures(1, i2 | 0);
 _glBindTexture(3553, HEAP32[i2 >> 2] | 0);
 i2 = HEAP32[i12 >> 2] | 0;
 i6 = HEAP32[i11 >> 2] << 2;
 i1 = HEAP32[i10 >> 2] | 0;
 i7 = _malloc(i6) | 0;
 i8 = (i1 | 0) / 2 | 0;
 if ((i1 | 0) > 1) {
  i9 = 0 - i6 | 0;
  i3 = i2 + (Math_imul(i1, i6) | 0) | 0;
  i4 = 0;
  i1 = i2;
  while (1) {
   i3 = i3 + i9 | 0;
   _memcpy(i7 | 0, i1 | 0, i6 | 0) | 0;
   _memcpy(i1 | 0, i3 | 0, i6 | 0) | 0;
   _memcpy(i3 | 0, i7 | 0, i6 | 0) | 0;
   i4 = i4 + 1 | 0;
   if ((i4 | 0) >= (i8 | 0)) break; else i1 = i1 + i6 | 0;
  }
 }
 _free(i7);
 _glTexImage2D(3553, 0, 6408, HEAP32[i11 >> 2] | 0, HEAP32[i10 >> 2] | 0, 0, 6408, 5121, HEAP32[i12 >> 2] | 0);
 _parg_buffer_free(i5);
 _glTexParameteri(3553, 10240, 9729);
 _glTexParameteri(3553, 10241, 9987);
 _glGenerateMipmap(3553);
 STACKTOP = i13;
 return i11 | 0;
}

function _parg_shader_attrib_get(i12) {
 i12 = i12 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i13 = 0, i14 = 0;
 i14 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i13 = i14;
 i1 = HEAP32[154] | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 L1 : do if (!i2) {
  i3 = 0;
  i5 = 8;
 } else {
  i7 = i2 + -1 | 0;
  i8 = i7 & i12;
  i9 = HEAP32[i1 + 16 >> 2] | 0;
  i10 = i1 + 20 | 0;
  i3 = i8;
  i11 = 0;
  while (1) {
   i5 = HEAP32[i9 + (i3 >>> 4 << 2) >> 2] | 0;
   i4 = i3 << 1 & 30;
   i6 = i5 >>> i4;
   if (i6 & 2) break;
   if ((i6 & 1 | 0) == 0 ? (HEAP32[(HEAP32[i10 >> 2] | 0) + (i3 << 2) >> 2] | 0) == (i12 | 0) : 0) break;
   i11 = i11 + 1 | 0;
   i3 = i11 + i3 & i7;
   if ((i3 | 0) == (i8 | 0)) {
    i1 = i2;
    i5 = 9;
    break L1;
   }
  }
  i3 = (3 << i4 & i5 | 0) == 0 ? i3 : i2;
  i5 = 8;
 } while (0);
 if ((i5 | 0) == 8) if ((i3 | 0) == (i2 | 0)) {
  i1 = i3;
  i5 = 9;
 }
 if ((i5 | 0) == 9) {
  i3 = _parg_token_to_string(i12) | 0;
  HEAP32[i13 >> 2] = 912;
  HEAP32[i13 + 4 >> 2] = i3;
  _printf(800, i13 | 0) | 0;
  i13 = HEAP32[154] | 0;
  i3 = i1;
  i2 = HEAP32[i13 >> 2] | 0;
  i1 = i13;
 }
 if ((i3 | 0) == (i2 | 0)) ___assert_fail(936, 728, 258, 976); else {
  STACKTOP = i14;
  return HEAP32[(HEAP32[i1 + 24 >> 2] | 0) + (i3 << 2) >> 2] | 0;
 }
 return 0;
}

function _MUSL_vfprintf(i13, i9, i1) {
 i13 = i13 | 0;
 i9 = i9 | 0;
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i10 = 0, i11 = 0, i12 = 0, i14 = 0;
 i14 = STACKTOP;
 STACKTOP = STACKTOP + 224 | 0;
 i8 = i14 + 120 | 0;
 i12 = i14 + 80 | 0;
 i11 = i14;
 i10 = i14 + 136 | 0;
 i2 = i12;
 i3 = i2 + 40 | 0;
 do {
  HEAP32[i2 >> 2] = 0;
  i2 = i2 + 4 | 0;
 } while ((i2 | 0) < (i3 | 0));
 HEAP32[i8 >> 2] = HEAP32[i1 >> 2];
 if ((_printf_core(0, i9, i8, i11, i12) | 0) < 0) {
  i13 = -1;
  STACKTOP = i14;
  return i13 | 0;
 }
 i2 = i13 + 48 | 0;
 if (!(HEAP32[i2 >> 2] | 0)) {
  i4 = i13 + 44 | 0;
  i5 = HEAP32[i4 >> 2] | 0;
  HEAP32[i4 >> 2] = i10;
  i6 = i13 + 28 | 0;
  HEAP32[i6 >> 2] = i10;
  i7 = i13 + 20 | 0;
  HEAP32[i7 >> 2] = i10;
  HEAP32[i2 >> 2] = 80;
  i3 = i13 + 16 | 0;
  HEAP32[i3 >> 2] = i10 + 80;
  i1 = _printf_core(i13, i9, i8, i11, i12) | 0;
  if (i5) {
   FUNCTION_TABLE_iiii[HEAP32[i13 + 36 >> 2] & 7](i13, 0, 0) | 0;
   i1 = (HEAP32[i7 >> 2] | 0) == 0 ? -1 : i1;
   HEAP32[i4 >> 2] = i5;
   HEAP32[i2 >> 2] = 0;
   HEAP32[i3 >> 2] = 0;
   HEAP32[i6 >> 2] = 0;
   HEAP32[i7 >> 2] = 0;
  }
 } else i1 = _printf_core(i13, i9, i8, i11, i12) | 0;
 i13 = i1;
 STACKTOP = i14;
 return i13 | 0;
}

function __ZL25default_terminate_handlerv() {
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 48 | 0;
 i7 = i5 + 32 | 0;
 i3 = i5 + 24 | 0;
 i8 = i5 + 16 | 0;
 i6 = i5;
 i5 = i5 + 36 | 0;
 i1 = ___cxa_get_globals_fast() | 0;
 if ((i1 | 0) != 0 ? (i4 = HEAP32[i1 >> 2] | 0, (i4 | 0) != 0) : 0) {
  i1 = i4 + 48 | 0;
  i2 = HEAP32[i1 >> 2] | 0;
  i1 = HEAP32[i1 + 4 >> 2] | 0;
  if (!((i2 & -256 | 0) == 1126902528 & (i1 | 0) == 1129074247)) {
   HEAP32[i3 >> 2] = HEAP32[1486];
   _abort_message(6048, i3);
  }
  if ((i2 | 0) == 1126902529 & (i1 | 0) == 1129074247) i1 = HEAP32[i4 + 44 >> 2] | 0; else i1 = i4 + 80 | 0;
  HEAP32[i5 >> 2] = i1;
  i4 = HEAP32[i4 >> 2] | 0;
  i1 = HEAP32[i4 + 4 >> 2] | 0;
  if (FUNCTION_TABLE_iiii[HEAP32[(HEAP32[4736 >> 2] | 0) + 16 >> 2] & 7](4736, i4, i5) | 0) {
   i8 = HEAP32[i5 >> 2] | 0;
   i5 = HEAP32[1486] | 0;
   i8 = FUNCTION_TABLE_ii[HEAP32[(HEAP32[i8 >> 2] | 0) + 8 >> 2] & 3](i8) | 0;
   HEAP32[i6 >> 2] = i5;
   HEAP32[i6 + 4 >> 2] = i1;
   HEAP32[i6 + 8 >> 2] = i8;
   _abort_message(5952, i6);
  } else {
   HEAP32[i8 >> 2] = HEAP32[1486];
   HEAP32[i8 + 4 >> 2] = i1;
   _abort_message(6e3, i8);
  }
 }
 _abort_message(6088, i7);
}

function _parg_token_to_sds(i12) {
 i12 = i12 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0;
 i1 = HEAP32[330] | 0;
 if (!i1) {
  _puts(1328) | 0;
  i1 = HEAP32[330] | 0;
  if (!i1) ___assert_fail(1360, 1376, 13, 1416); else i2 = i1;
 } else i2 = i1;
 i3 = HEAP32[i2 >> 2] | 0;
 L5 : do if (!i3) {
  i1 = 0;
  i5 = 11;
 } else {
  i8 = i3 + -1 | 0;
  i9 = i8 & i12;
  i10 = HEAP32[i2 + 16 >> 2] | 0;
  i6 = i2 + 20 | 0;
  i1 = i9;
  i11 = 0;
  while (1) {
   i5 = HEAP32[i10 + (i1 >>> 4 << 2) >> 2] | 0;
   i4 = i1 << 1 & 30;
   i7 = i5 >>> i4;
   if (i7 & 2) break;
   if ((i7 & 1 | 0) == 0 ? (HEAP32[(HEAP32[i6 >> 2] | 0) + (i1 << 2) >> 2] | 0) == (i12 | 0) : 0) break;
   i11 = i11 + 1 | 0;
   i1 = i11 + i1 & i8;
   if ((i1 | 0) == (i9 | 0)) {
    i1 = i3;
    i5 = 12;
    break L5;
   }
  }
  i1 = (3 << i4 & i5 | 0) == 0 ? i1 : i3;
  i5 = 11;
 } while (0);
 if ((i5 | 0) == 11) if ((i1 | 0) == (i3 | 0)) i5 = 12;
 if ((i5 | 0) == 12) {
  _puts(1440) | 0;
  i2 = HEAP32[330] | 0;
  i3 = HEAP32[i2 >> 2] | 0;
 }
 if ((i1 | 0) == (i3 | 0)) ___assert_fail(1456, 1376, 15, 1416); else return HEAP32[(HEAP32[i2 + 24 >> 2] | 0) + (i1 << 2) >> 2] | 0;
 return 0;
}

function _parg_asset_to_buffer(i12) {
 i12 = i12 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0;
 i1 = HEAP32[24] | 0;
 if (!i1) {
  _puts(104) | 0;
  i1 = HEAP32[24] | 0;
  if (!i1) ___assert_fail(136, 32, 75, 152); else i2 = i1;
 } else i2 = i1;
 i3 = HEAP32[i2 >> 2] | 0;
 L5 : do if (!i3) {
  i1 = 0;
  i5 = 11;
 } else {
  i8 = i3 + -1 | 0;
  i9 = i8 & i12;
  i10 = HEAP32[i2 + 16 >> 2] | 0;
  i6 = i2 + 20 | 0;
  i1 = i9;
  i11 = 0;
  while (1) {
   i5 = HEAP32[i10 + (i1 >>> 4 << 2) >> 2] | 0;
   i4 = i1 << 1 & 30;
   i7 = i5 >>> i4;
   if (i7 & 2) break;
   if ((i7 & 1 | 0) == 0 ? (HEAP32[(HEAP32[i6 >> 2] | 0) + (i1 << 2) >> 2] | 0) == (i12 | 0) : 0) break;
   i11 = i11 + 1 | 0;
   i1 = i11 + i1 & i8;
   if ((i1 | 0) == (i9 | 0)) {
    i1 = i3;
    i5 = 12;
    break L5;
   }
  }
  i1 = (3 << i4 & i5 | 0) == 0 ? i1 : i3;
  i5 = 11;
 } while (0);
 if ((i5 | 0) == 11) if ((i1 | 0) == (i3 | 0)) i5 = 12;
 if ((i5 | 0) == 12) {
  _puts(1440) | 0;
  i2 = HEAP32[24] | 0;
  i3 = HEAP32[i2 >> 2] | 0;
 }
 if ((i1 | 0) == (i3 | 0)) ___assert_fail(176, 32, 77, 152); else return HEAP32[(HEAP32[i2 + 24 >> 2] | 0) + (i1 << 2) >> 2] | 0;
 return 0;
}

function _memchr(i1, i5, i2) {
 i1 = i1 | 0;
 i5 = i5 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0, i6 = 0, i7 = 0;
 i6 = i5 & 255;
 i3 = (i2 | 0) != 0;
 L1 : do if (i3 & (i1 & 3 | 0) != 0) {
  i4 = i5 & 255;
  while (1) {
   if ((HEAP8[i1 >> 0] | 0) == i4 << 24 >> 24) {
    i7 = 6;
    break L1;
   }
   i1 = i1 + 1 | 0;
   i2 = i2 + -1 | 0;
   i3 = (i2 | 0) != 0;
   if (!(i3 & (i1 & 3 | 0) != 0)) {
    i7 = 5;
    break;
   }
  }
 } else i7 = 5; while (0);
 if ((i7 | 0) == 5) if (i3) i7 = 6; else i2 = 0;
 L8 : do if ((i7 | 0) == 6) {
  i4 = i5 & 255;
  if ((HEAP8[i1 >> 0] | 0) != i4 << 24 >> 24) {
   i3 = Math_imul(i6, 16843009) | 0;
   L11 : do if (i2 >>> 0 > 3) while (1) {
    i6 = HEAP32[i1 >> 2] ^ i3;
    if ((i6 & -2139062144 ^ -2139062144) & i6 + -16843009) break;
    i1 = i1 + 4 | 0;
    i2 = i2 + -4 | 0;
    if (i2 >>> 0 <= 3) {
     i7 = 11;
     break L11;
    }
   } else i7 = 11; while (0);
   if ((i7 | 0) == 11) if (!i2) {
    i2 = 0;
    break;
   }
   while (1) {
    if ((HEAP8[i1 >> 0] | 0) == i4 << 24 >> 24) break L8;
    i1 = i1 + 1 | 0;
    i2 = i2 + -1 | 0;
    if (!i2) {
     i2 = 0;
     break;
    }
   }
  }
 } while (0);
 return ((i2 | 0) != 0 ? i1 : 0) | 0;
}

function _parg_mesh_rectangle(f2, f1) {
 f2 = Math_fround(f2);
 f1 = Math_fround(f1);
 var i3 = 0, i4 = 0, i5 = 0, f6 = f0, f7 = f0;
 f6 = Math_fround(f2 * Math_fround(.5));
 f2 = Math_fround(f1 * Math_fround(.5));
 f1 = Math_fround(-f6);
 f7 = Math_fround(-f2);
 i3 = _malloc(20) | 0;
 HEAP32[i3 + 8 >> 2] = 0;
 HEAP32[i3 + 12 >> 2] = 0;
 HEAP32[i3 + 16 >> 2] = 2;
 i4 = _parg_buffer_alloc(32, 2) | 0;
 HEAP32[i3 >> 2] = i4;
 i5 = _parg_buffer_lock(i4, 1) | 0;
 HEAPF32[i5 >> 2] = f1;
 HEAPF32[i5 + 4 >> 2] = f7;
 HEAPF32[i5 + 8 >> 2] = f6;
 HEAPF32[i5 + 12 >> 2] = f7;
 HEAPF32[i5 + 16 >> 2] = f1;
 HEAPF32[i5 + 20 >> 2] = f2;
 HEAPF32[i5 + 24 >> 2] = f6;
 HEAPF32[i5 + 28 >> 2] = f2;
 _parg_buffer_unlock(i4);
 i4 = _parg_buffer_alloc(32, 2) | 0;
 HEAP32[i3 + 4 >> 2] = i4;
 i5 = _parg_buffer_lock(i4, 1) | 0;
 HEAPF32[i5 >> 2] = Math_fround(0.0);
 HEAPF32[i5 + 4 >> 2] = Math_fround(0.0);
 HEAPF32[i5 + 8 >> 2] = Math_fround(1.0);
 HEAPF32[i5 + 12 >> 2] = Math_fround(0.0);
 HEAPF32[i5 + 16 >> 2] = Math_fround(0.0);
 HEAPF32[i5 + 20 >> 2] = Math_fround(1.0);
 HEAPF32[i5 + 24 >> 2] = Math_fround(1.0);
 HEAPF32[i5 + 28 >> 2] = Math_fround(1.0);
 _parg_buffer_unlock(i4);
 return i3 | 0;
}

function _input(i3, f8, f1, f2) {
 i3 = i3 | 0;
 f8 = Math_fround(f8);
 f1 = Math_fround(f1);
 f2 = Math_fround(f2);
 var i4 = 0, i5 = 0, i6 = 0, i7 = 0;
 i7 = STACKTOP;
 STACKTOP = STACKTOP + 48 | 0;
 i6 = i7 + 32 | 0;
 i5 = i7 + 16 | 0;
 i4 = i7;
 if (!((i3 | 0) == 3 & ~~f8 << 24 >> 24 == 32)) {
  STACKTOP = i7;
  return;
 }
 i3 = HEAP32[662] | 0;
 if ((i3 | 0) == 1024) {
  i4 = _atoi(3088) | 0;
  HEAP32[662] = i4;
  i5 = HEAP32[663] | 0;
  HEAP32[i6 >> 2] = i4;
  HEAP32[i6 + 4 >> 2] = i4;
  HEAP32[i6 + 8 >> 2] = i5;
  _printf(3040, i6 | 0) | 0;
  STACKTOP = i7;
  return;
 } else if ((i3 | 0) == 512) {
  i4 = _atoi(3080) | 0;
  HEAP32[662] = i4;
  i6 = HEAP32[663] | 0;
  HEAP32[i5 >> 2] = i4;
  HEAP32[i5 + 4 >> 2] = i4;
  HEAP32[i5 + 8 >> 2] = i6;
  _printf(3040, i5 | 0) | 0;
  STACKTOP = i7;
  return;
 } else if ((i3 | 0) == 256) {
  i5 = _atoi(3072) | 0;
  HEAP32[662] = i5;
  i6 = HEAP32[663] | 0;
  HEAP32[i4 >> 2] = i5;
  HEAP32[i4 + 4 >> 2] = i5;
  HEAP32[i4 + 8 >> 2] = i6;
  _printf(3040, i4 | 0) | 0;
  STACKTOP = i7;
  return;
 } else {
  STACKTOP = i7;
  return;
 }
}

function ___fwritex(i3, i6, i5) {
 i3 = i3 | 0;
 i6 = i6 | 0;
 i5 = i5 | 0;
 var i1 = 0, i2 = 0, i4 = 0, i7 = 0;
 i1 = i5 + 16 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 do if (!i2) if (!(___towrite(i5) | 0)) {
  i2 = HEAP32[i1 >> 2] | 0;
  break;
 } else {
  i7 = 0;
  return i7 | 0;
 } while (0);
 i7 = i5 + 20 | 0;
 i1 = HEAP32[i7 >> 2] | 0;
 if ((i2 - i1 | 0) >>> 0 < i6 >>> 0) {
  i7 = FUNCTION_TABLE_iiii[HEAP32[i5 + 36 >> 2] & 7](i5, i3, i6) | 0;
  return i7 | 0;
 }
 L11 : do if ((HEAP8[i5 + 75 >> 0] | 0) > -1) {
  i2 = i6;
  while (1) {
   if (!i2) {
    i4 = i6;
    i2 = 0;
    break L11;
   }
   i4 = i2 + -1 | 0;
   if ((HEAP8[i3 + i4 >> 0] | 0) == 10) break; else i2 = i4;
  }
  if ((FUNCTION_TABLE_iiii[HEAP32[i5 + 36 >> 2] & 7](i5, i3, i2) | 0) >>> 0 < i2 >>> 0) {
   i7 = i2;
   return i7 | 0;
  } else {
   i4 = i6 - i2 | 0;
   i3 = i3 + i2 | 0;
   i1 = HEAP32[i7 >> 2] | 0;
   break;
  }
 } else {
  i4 = i6;
  i2 = 0;
 } while (0);
 _memcpy(i1 | 0, i3 | 0, i4 | 0) | 0;
 HEAP32[i7 >> 2] = (HEAP32[i7 >> 2] | 0) + i4;
 i7 = i2 + i4 | 0;
 return i7 | 0;
}

function _vsnprintf(i3, i1, i9, i7) {
 i3 = i3 | 0;
 i1 = i1 | 0;
 i9 = i9 | 0;
 i7 = i7 | 0;
 var i2 = 0, i4 = 0, i5 = 0, i6 = 0, i8 = 0, i10 = 0;
 i10 = STACKTOP;
 STACKTOP = STACKTOP + 128 | 0;
 i2 = i10 + 112 | 0;
 i8 = i10;
 i4 = i8;
 i5 = 6616;
 i6 = i4 + 112 | 0;
 do {
  HEAP32[i4 >> 2] = HEAP32[i5 >> 2];
  i4 = i4 + 4 | 0;
  i5 = i5 + 4 | 0;
 } while ((i4 | 0) < (i6 | 0));
 if ((i1 + -1 | 0) >>> 0 > 2147483646) if (!i1) i1 = 1; else {
  i9 = ___errno_location() | 0;
  HEAP32[i9 >> 2] = 75;
  i9 = -1;
  STACKTOP = i10;
  return i9 | 0;
 } else i2 = i3;
 i6 = -2 - i2 | 0;
 i6 = i1 >>> 0 > i6 >>> 0 ? i6 : i1;
 HEAP32[i8 + 48 >> 2] = i6;
 i3 = i8 + 20 | 0;
 HEAP32[i3 >> 2] = i2;
 HEAP32[i8 + 44 >> 2] = i2;
 i1 = i2 + i6 | 0;
 i2 = i8 + 16 | 0;
 HEAP32[i2 >> 2] = i1;
 HEAP32[i8 + 28 >> 2] = i1;
 i1 = _MUSL_vfprintf(i8, i9, i7) | 0;
 if (!i6) {
  i9 = i1;
  STACKTOP = i10;
  return i9 | 0;
 }
 i9 = HEAP32[i3 >> 2] | 0;
 HEAP8[i9 + (((i9 | 0) == (HEAP32[i2 >> 2] | 0)) << 31 >> 31) >> 0] = 0;
 i9 = i1;
 STACKTOP = i10;
 return i9 | 0;
}

function _parg_shader_uniform_get(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0;
 i4 = HEAP32[250] ^ i1;
 i11 = HEAP32[156] | 0;
 i12 = HEAP32[i11 >> 2] | 0;
 do if (i12) {
  i6 = i12 + -1 | 0;
  i7 = i6 & i4;
  i8 = HEAP32[i11 + 16 >> 2] | 0;
  i9 = i11 + 20 | 0;
  i1 = i7;
  i10 = 0;
  while (1) {
   i3 = HEAP32[i8 + (i1 >>> 4 << 2) >> 2] | 0;
   i2 = i1 << 1 & 30;
   i5 = i3 >>> i2;
   if (i5 & 2) {
    i4 = 7;
    break;
   }
   if ((i5 & 1 | 0) == 0 ? (HEAP32[(HEAP32[i9 >> 2] | 0) + (i1 << 2) >> 2] | 0) == (i4 | 0) : 0) {
    i4 = 7;
    break;
   }
   i10 = i10 + 1 | 0;
   i1 = i10 + i1 & i6;
   if ((i1 | 0) == (i7 | 0)) {
    i1 = -1;
    i4 = 10;
    break;
   }
  }
  if ((i4 | 0) == 7) {
   i1 = (3 << i2 & i3 | 0) == 0 ? i1 : i12;
   break;
  } else if ((i4 | 0) == 10) return i1 | 0;
 } else i1 = 0; while (0);
 if ((i1 | 0) == (i12 | 0)) {
  i12 = -1;
  return i12 | 0;
 }
 i12 = HEAP32[(HEAP32[i11 + 24 >> 2] | 0) + (i1 << 2) >> 2] | 0;
 return i12 | 0;
}

function _init(f3, f2, f1) {
 f3 = Math_fround(f3);
 f2 = Math_fround(f2);
 f1 = Math_fround(f1);
 var i4 = 0;
 _parg_shader_load_from_asset(HEAP32[754] | 0);
 i4 = _parg_mesh_rectangle(Math_fround(2.0), Math_fround(2.0)) | 0;
 HEAP32[652] = i4;
 i4 = _parg_texture_from_asset(HEAP32[742] | 0) | 0;
 HEAP32[650] = i4;
 i4 = _parg_texture_from_asset(HEAP32[748] | 0) | 0;
 HEAP32[651] = i4;
 i4 = _malloc(36) | 0;
 HEAP32[661] = i4;
 HEAPF32[i4 >> 2] = Math_fround(.5);
 HEAPF32[i4 + 4 >> 2] = Math_fround(0.0);
 HEAPF32[i4 + 8 >> 2] = Math_fround(0.0);
 HEAPF32[i4 + 12 >> 2] = Math_fround(-.25000003);
 HEAPF32[i4 + 16 >> 2] = Math_fround(.433012694);
 HEAPF32[i4 + 20 >> 2] = Math_fround(1.0);
 HEAPF32[i4 + 24 >> 2] = Math_fround(-.249999955);
 HEAPF32[i4 + 28 >> 2] = Math_fround(-.433012724);
 HEAPF32[i4 + 32 >> 2] = Math_fround(2.0);
 i4 = _parg_buffer_create(i4, 36, 2) | 0;
 HEAP32[653] = i4;
 _create_particles();
 _draw();
 return;
}

function ___strchrnul(i1, i4) {
 i1 = i1 | 0;
 i4 = i4 | 0;
 var i2 = 0, i3 = 0, i5 = 0;
 i3 = i4 & 255;
 if (!i3) {
  i4 = i1 + (_strlen(i1 | 0) | 0) | 0;
  return i4 | 0;
 }
 L5 : do if (i1 & 3) {
  i2 = i4 & 255;
  while (1) {
   i5 = HEAP8[i1 >> 0] | 0;
   if (i5 << 24 >> 24 == 0 ? 1 : i5 << 24 >> 24 == i2 << 24 >> 24) break;
   i1 = i1 + 1 | 0;
   if (!(i1 & 3)) break L5;
  }
  return i1 | 0;
 } while (0);
 i3 = Math_imul(i3, 16843009) | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 L12 : do if (!((i2 & -2139062144 ^ -2139062144) & i2 + -16843009)) do {
  i5 = i2 ^ i3;
  if ((i5 & -2139062144 ^ -2139062144) & i5 + -16843009) break L12;
  i1 = i1 + 4 | 0;
  i2 = HEAP32[i1 >> 2] | 0;
 } while (((i2 & -2139062144 ^ -2139062144) & i2 + -16843009 | 0) == 0); while (0);
 i2 = i4 & 255;
 while (1) {
  i5 = HEAP8[i1 >> 0] | 0;
  if (i5 << 24 >> 24 == 0 ? 1 : i5 << 24 >> 24 == i2 << 24 >> 24) break; else i1 = i1 + 1 | 0;
 }
 return i1 | 0;
}

function _sdscatvprintf(i6, i5, i3) {
 i6 = i6 | 0;
 i5 = i5 | 0;
 i3 = i3 | 0;
 var i1 = 0, i2 = 0, i4 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0;
 i9 = STACKTOP;
 STACKTOP = STACKTOP + 1040 | 0;
 i4 = i9;
 i7 = i9 + 16 | 0;
 i1 = (_strlen(i5 | 0) | 0) << 1;
 if (i1 >>> 0 > 1024) {
  i2 = _malloc(i1) | 0;
  if (!i2) {
   i8 = 0;
   STACKTOP = i9;
   return i8 | 0;
  }
 } else {
  i2 = i7;
  i1 = 1024;
 }
 while (1) {
  i10 = i2 + (i1 + -2) | 0;
  HEAP8[i10 >> 0] = 0;
  HEAP32[i4 >> 2] = HEAP32[i3 >> 2];
  _vsnprintf(i2, i1, i5, i4) | 0;
  if (!(HEAP8[i10 >> 0] | 0)) break;
  if ((i2 | 0) != (i7 | 0)) _free(i2);
  i1 = i1 << 1;
  i2 = _malloc(i1) | 0;
  if (!i2) {
   i1 = 0;
   i8 = 10;
   break;
  }
 }
 if ((i8 | 0) == 10) {
  STACKTOP = i9;
  return i1 | 0;
 }
 i1 = _sdscat(i6, i2) | 0;
 if ((i2 | 0) == (i7 | 0)) {
  i10 = i1;
  STACKTOP = i9;
  return i10 | 0;
 }
 _free(i2);
 i10 = i1;
 STACKTOP = i9;
 return i10 | 0;
}

function __ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i(i2, i5, i4, i3, i1) {
 i2 = i2 | 0;
 i5 = i5 | 0;
 i4 = i4 | 0;
 i3 = i3 | 0;
 i1 = i1 | 0;
 HEAP8[i5 + 53 >> 0] = 1;
 do if ((HEAP32[i5 + 4 >> 2] | 0) == (i3 | 0)) {
  HEAP8[i5 + 52 >> 0] = 1;
  i3 = i5 + 16 | 0;
  i2 = HEAP32[i3 >> 2] | 0;
  if (!i2) {
   HEAP32[i3 >> 2] = i4;
   HEAP32[i5 + 24 >> 2] = i1;
   HEAP32[i5 + 36 >> 2] = 1;
   if (!((i1 | 0) == 1 ? (HEAP32[i5 + 48 >> 2] | 0) == 1 : 0)) break;
   HEAP8[i5 + 54 >> 0] = 1;
   break;
  }
  if ((i2 | 0) != (i4 | 0)) {
   i4 = i5 + 36 | 0;
   HEAP32[i4 >> 2] = (HEAP32[i4 >> 2] | 0) + 1;
   HEAP8[i5 + 54 >> 0] = 1;
   break;
  }
  i2 = i5 + 24 | 0;
  i3 = HEAP32[i2 >> 2] | 0;
  if ((i3 | 0) == 2) HEAP32[i2 >> 2] = i1; else i1 = i3;
  if ((i1 | 0) == 1 ? (HEAP32[i5 + 48 >> 2] | 0) == 1 : 0) HEAP8[i5 + 54 >> 0] = 1;
 } while (0);
 return;
}

function __ZL4initN10emscripten3valE(i1) {
 i1 = i1 | 0;
 var i2 = 0, f3 = f0, f4 = f0, f5 = f0, i6 = 0, i7 = 0, i8 = 0, d9 = 0.0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i7 = i2 + 12 | 0;
 i6 = i2;
 i1 = HEAP32[i1 >> 2] | 0;
 __emval_incref(i1 | 0);
 d9 = +__emval_as(i1 | 0, 2040, i7 | 0);
 i7 = HEAP32[i7 >> 2] | 0;
 i8 = ~~d9 >>> 0;
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcj(i6, i8 + 4 | 0, HEAP32[i8 >> 2] | 0);
 __emval_run_destructors(i7 | 0);
 FUNCTION_TABLE_vi[HEAP32[1552 >> 2] & 31]((HEAP8[i6 >> 0] & 1) == 0 ? i6 + 1 | 0 : HEAP32[i6 + 8 >> 2] | 0);
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i6);
 __emval_decref(i1 | 0);
 f5 = Math_fround(HEAP32[390] | 0);
 f4 = Math_fround(HEAP32[392] | 0);
 f3 = Math_fround(HEAPF32[592]);
 FUNCTION_TABLE_vfff[HEAP32[1512 >> 2] & 3](f5, f4, f3);
 STACKTOP = i2;
 return;
}

function __ZNK10__cxxabiv121__vmi_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi(i1, i5, i4, i6) {
 i1 = i1 | 0;
 i5 = i5 | 0;
 i4 = i4 | 0;
 i6 = i6 | 0;
 var i2 = 0, i3 = 0;
 L1 : do if ((i1 | 0) != (HEAP32[i5 + 8 >> 2] | 0)) {
  i3 = HEAP32[i1 + 12 >> 2] | 0;
  i2 = i1 + 16 + (i3 << 3) | 0;
  __ZNK10__cxxabiv122__base_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi(i1 + 16 | 0, i5, i4, i6);
  if ((i3 | 0) > 1) {
   i3 = i5 + 54 | 0;
   i1 = i1 + 24 | 0;
   do {
    __ZNK10__cxxabiv122__base_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi(i1, i5, i4, i6);
    if (HEAP8[i3 >> 0] | 0) break L1;
    i1 = i1 + 8 | 0;
   } while (i1 >>> 0 < i2 >>> 0);
  }
 } else __ZNK10__cxxabiv117__class_type_info24process_found_base_classEPNS_19__dynamic_cast_infoEPvi(0, i5, i4, i6); while (0);
 return;
}

function __ZNK10__cxxabiv117__class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib(i6, i4, i3, i5, i7) {
 i6 = i6 | 0;
 i4 = i4 | 0;
 i3 = i3 | 0;
 i5 = i5 | 0;
 i7 = i7 | 0;
 var i1 = 0, i2 = 0;
 do if ((i6 | 0) == (HEAP32[i4 + 8 >> 2] | 0)) {
  if ((HEAP32[i4 + 4 >> 2] | 0) == (i3 | 0) ? (i2 = i4 + 28 | 0, (HEAP32[i2 >> 2] | 0) != 1) : 0) HEAP32[i2 >> 2] = i5;
 } else if ((i6 | 0) == (HEAP32[i4 >> 2] | 0)) {
  if ((HEAP32[i4 + 16 >> 2] | 0) != (i3 | 0) ? (i1 = i4 + 20 | 0, (HEAP32[i1 >> 2] | 0) != (i3 | 0)) : 0) {
   HEAP32[i4 + 32 >> 2] = i5;
   HEAP32[i1 >> 2] = i3;
   i7 = i4 + 40 | 0;
   HEAP32[i7 >> 2] = (HEAP32[i7 >> 2] | 0) + 1;
   if ((HEAP32[i4 + 36 >> 2] | 0) == 1 ? (HEAP32[i4 + 24 >> 2] | 0) == 2 : 0) HEAP8[i4 + 54 >> 0] = 1;
   HEAP32[i4 + 44 >> 2] = 4;
   break;
  }
  if ((i5 | 0) == 1) HEAP32[i4 + 32 >> 2] = 1;
 } while (0);
 return;
}

function _wcrtomb(i1, i3, i2) {
 i1 = i1 | 0;
 i3 = i3 | 0;
 i2 = i2 | 0;
 if (!i1) {
  i3 = 1;
  return i3 | 0;
 }
 if (i3 >>> 0 < 128) {
  HEAP8[i1 >> 0] = i3;
  i3 = 1;
  return i3 | 0;
 }
 if (i3 >>> 0 < 2048) {
  HEAP8[i1 >> 0] = i3 >>> 6 | 192;
  HEAP8[i1 + 1 >> 0] = i3 & 63 | 128;
  i3 = 2;
  return i3 | 0;
 }
 if (i3 >>> 0 < 55296 | (i3 & -8192 | 0) == 57344) {
  HEAP8[i1 >> 0] = i3 >>> 12 | 224;
  HEAP8[i1 + 1 >> 0] = i3 >>> 6 & 63 | 128;
  HEAP8[i1 + 2 >> 0] = i3 & 63 | 128;
  i3 = 3;
  return i3 | 0;
 }
 if ((i3 + -65536 | 0) >>> 0 < 1048576) {
  HEAP8[i1 >> 0] = i3 >>> 18 | 240;
  HEAP8[i1 + 1 >> 0] = i3 >>> 12 & 63 | 128;
  HEAP8[i1 + 2 >> 0] = i3 >>> 6 & 63 | 128;
  HEAP8[i1 + 3 >> 0] = i3 & 63 | 128;
  i3 = 4;
  return i3 | 0;
 } else {
  i3 = ___errno_location() | 0;
  HEAP32[i3 >> 2] = 84;
  i3 = -1;
  return i3 | 0;
 }
 return 0;
}

function __ZN10emscripten8internal12MethodCallerIvJRNSt3__112basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEEEE4callEPNS0_7_EM_VALEPKcS9_(i3, i4, i1) {
 i3 = i3 | 0;
 i4 = i4 | 0;
 i1 = i1 | 0;
 var i2 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i2 = i5;
 if ((HEAP8[2576] | 0) == 0 ? (___cxa_guard_acquire(2576) | 0) != 0 : 0) {
  i6 = __emval_get_method_caller(2, 2584) | 0;
  HEAP32[648] = i6;
  ___cxa_guard_release(2576);
 }
 i6 = HEAP32[648] | 0;
 i8 = HEAP8[i1 >> 0] | 0;
 i9 = (i8 & 1) == 0;
 i8 = i9 ? (i8 & 255) >>> 1 : HEAP32[i1 + 4 >> 2] | 0;
 i7 = _malloc(i8 + 4 | 0) | 0;
 HEAP32[i7 >> 2] = i8;
 _memcpy(i7 + 4 | 0, (i9 ? i1 + 1 | 0 : HEAP32[i1 + 8 >> 2] | 0) | 0, i8 | 0) | 0;
 HEAP32[i2 >> 2] = i7;
 __emval_call_void_method(i6 | 0, i3 | 0, i4 | 0, i2 | 0);
 STACKTOP = i5;
 return;
}

function __ZNK10__cxxabiv117__class_type_info9can_catchEPKNS_16__shim_type_infoERPv(i6, i1, i4) {
 i6 = i6 | 0;
 i1 = i1 | 0;
 i4 = i4 | 0;
 var i2 = 0, i3 = 0, i5 = 0, i7 = 0;
 i7 = STACKTOP;
 STACKTOP = STACKTOP + 64 | 0;
 i5 = i7;
 if ((i6 | 0) != (i1 | 0)) if ((i1 | 0) != 0 ? (i3 = ___dynamic_cast(i1, 4808, 4864, 0) | 0, (i3 | 0) != 0) : 0) {
  i1 = i5;
  i2 = i1 + 56 | 0;
  do {
   HEAP32[i1 >> 2] = 0;
   i1 = i1 + 4 | 0;
  } while ((i1 | 0) < (i2 | 0));
  HEAP32[i5 >> 2] = i3;
  HEAP32[i5 + 8 >> 2] = i6;
  HEAP32[i5 + 12 >> 2] = -1;
  HEAP32[i5 + 48 >> 2] = 1;
  FUNCTION_TABLE_viiii[HEAP32[(HEAP32[i3 >> 2] | 0) + 28 >> 2] & 3](i3, i5, HEAP32[i4 >> 2] | 0, 1);
  if ((HEAP32[i5 + 24 >> 2] | 0) == 1) {
   HEAP32[i4 >> 2] = HEAP32[i5 + 16 >> 2];
   i1 = 1;
  } else i1 = 0;
 } else i1 = 0; else i1 = 1;
 STACKTOP = i7;
 return i1 | 0;
}

function __ZN32EmscriptenBindingInitializer_parC2Ev(i1) {
 i1 = i1 | 0;
 __embind_register_class(1704, 1712, 1728, 0, 1744, 2, 1752, 0, 1752, 0, 1760, 1768, 14);
 __embind_register_class_class_function(1704, 1776, 2, 1784, 1792, 1, 15);
 __embind_register_class_class_function(1704, 1800, 1, 1808, 1816, 16, 4);
 __embind_register_class_class_function(1704, 1824, 3, 1832, 1848, 1, 1);
 __embind_register_class_class_function(1704, 1856, 5, 1864, 1888, 1, 2);
 __embind_register_class_class_function(1704, 1896, 2, 1784, 1792, 1, 17);
 __embind_register_class(1904, 1912, 1928, 0, 1944, 3, 1752, 0, 1752, 0, 1952, 1960, 18);
 __embind_register_class_class_function(1904, 1968, 3, 1976, 1992, 5, 1);
 __embind_register_class_class_function(1904, 2e3, 2, 2008, 2016, 2, 19);
 _parg_asset_set_baseurl(2024);
 return;
}

function _atoi(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0;
 while (1) {
  i2 = i1 + 1 | 0;
  if (!(_isspace(HEAP8[i1 >> 0] | 0) | 0)) break; else i1 = i2;
 }
 i4 = HEAP8[i1 >> 0] | 0;
 i3 = i4 << 24 >> 24;
 if ((i3 | 0) == 45) {
  i4 = 1;
  i5 = 5;
 } else if ((i3 | 0) == 43) {
  i4 = 0;
  i5 = 5;
 } else {
  i3 = i4;
  i4 = 0;
 }
 if ((i5 | 0) == 5) {
  i1 = i2;
  i3 = HEAP8[i2 >> 0] | 0;
 }
 i2 = (i3 << 24 >> 24) + -48 | 0;
 if (i2 >>> 0 < 10) {
  i3 = i1;
  i1 = 0;
 } else {
  i3 = 0;
  i4 = (i4 | 0) != 0;
  i5 = 0 - i3 | 0;
  i5 = i4 ? i3 : i5;
  return i5 | 0;
 }
 do {
  i3 = i3 + 1 | 0;
  i1 = (i1 * 10 | 0) - i2 | 0;
  i2 = (HEAP8[i3 >> 0] | 0) + -48 | 0;
 } while (i2 >>> 0 < 10);
 i4 = (i4 | 0) != 0;
 i5 = 0 - i1 | 0;
 i5 = i4 ? i1 : i5;
 return i5 | 0;
}

function ___remdi3(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 8 | 0;
 i8 = i5 | 0;
 i7 = i2 >> 31 | ((i2 | 0) < 0 ? -1 : 0) << 1;
 i6 = ((i2 | 0) < 0 ? -1 : 0) >> 31 | ((i2 | 0) < 0 ? -1 : 0) << 1;
 i10 = i4 >> 31 | ((i4 | 0) < 0 ? -1 : 0) << 1;
 i9 = ((i4 | 0) < 0 ? -1 : 0) >> 31 | ((i4 | 0) < 0 ? -1 : 0) << 1;
 i1 = _i64Subtract(i7 ^ i1, i6 ^ i2, i7, i6) | 0;
 i2 = tempRet0;
 ___udivmoddi4(i1, i2, _i64Subtract(i10 ^ i3, i9 ^ i4, i10, i9) | 0, tempRet0, i8) | 0;
 i4 = _i64Subtract(HEAP32[i8 >> 2] ^ i7, HEAP32[i8 + 4 >> 2] ^ i6, i7, i6) | 0;
 i3 = tempRet0;
 STACKTOP = i5;
 return (tempRet0 = i3, i4) | 0;
}

function _parg_framebuffer_swap(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0, i5 = 0;
 if ((HEAP32[i1 >> 2] | 0) != (HEAP32[i2 >> 2] | 0)) ___assert_fail(416, 464, 112, 512);
 if ((HEAP32[i1 + 4 >> 2] | 0) == (HEAP32[i2 + 4 >> 2] | 0)) {
  i4 = i2 + 8 | 0;
  i3 = HEAP32[i4 >> 2] | 0;
  i5 = i1 + 8 | 0;
  HEAP32[i4 >> 2] = HEAP32[i5 >> 2];
  HEAP32[i5 >> 2] = i3;
  i5 = i2 + 12 | 0;
  i3 = HEAP32[i5 >> 2] | 0;
  i4 = i1 + 12 | 0;
  HEAP32[i5 >> 2] = HEAP32[i4 >> 2];
  HEAP32[i4 >> 2] = i3;
  i4 = i2 + 16 | 0;
  i3 = HEAP32[i4 >> 2] | 0;
  i2 = i1 + 16 | 0;
  HEAP32[i4 >> 2] = HEAP32[i2 >> 2];
  HEAP32[i2 >> 2] = i3;
  return;
 } else ___assert_fail(416, 464, 112, 512);
}

function _sdsdup(i2) {
 i2 = i2 | 0;
 var i1 = 0;
 i1 = HEAPU8[i2 + -1 >> 0] | 0;
 switch (i1 & 7 | 0) {
 case 3:
  {
   i1 = i2 + -9 | 0;
   i1 = HEAPU8[i1 >> 0] | HEAPU8[i1 + 1 >> 0] << 8 | HEAPU8[i1 + 2 >> 0] << 16 | HEAPU8[i1 + 3 >> 0] << 24;
   break;
  }
 case 1:
  {
   i1 = HEAPU8[i2 + -3 >> 0] | 0;
   break;
  }
 case 2:
  {
   i1 = i2 + -5 | 0;
   i1 = (HEAPU8[i1 >> 0] | HEAPU8[i1 + 1 >> 0] << 8) & 65535;
   break;
  }
 case 4:
  {
   i1 = i2 + -17 | 0;
   i1 = HEAPU8[i1 >> 0] | HEAPU8[i1 + 1 >> 0] << 8 | HEAPU8[i1 + 2 >> 0] << 16 | HEAPU8[i1 + 3 >> 0] << 24;
   break;
  }
 case 0:
  {
   i1 = i1 >>> 3;
   break;
  }
 default:
  i1 = 0;
 }
 return _sdsnewlen(i2, i1) | 0;
}

function _frexp(d1, i5) {
 d1 = +d1;
 i5 = i5 | 0;
 var i2 = 0, i3 = 0, i4 = 0;
 HEAPF64[tempDoublePtr >> 3] = d1;
 i2 = HEAP32[tempDoublePtr >> 2] | 0;
 i3 = HEAP32[tempDoublePtr + 4 >> 2] | 0;
 i4 = _bitshift64Lshr(i2 | 0, i3 | 0, 52) | 0;
 i4 = i4 & 2047;
 if (!i4) {
  if (d1 != 0.0) {
   d1 = +_frexp(d1 * 18446744073709551616.0, i5);
   i2 = (HEAP32[i5 >> 2] | 0) + -64 | 0;
  } else i2 = 0;
  HEAP32[i5 >> 2] = i2;
  return +d1;
 } else if ((i4 | 0) == 2047) return +d1; else {
  HEAP32[i5 >> 2] = i4 + -1022;
  HEAP32[tempDoublePtr >> 2] = i2;
  HEAP32[tempDoublePtr + 4 >> 2] = i3 & -2146435073 | 1071644672;
  d1 = +HEAPF64[tempDoublePtr >> 3];
  return +d1;
 }
 return 0.0;
}

function _memcpy(i1, i4, i2) {
 i1 = i1 | 0;
 i4 = i4 | 0;
 i2 = i2 | 0;
 var i3 = 0;
 if ((i2 | 0) >= 4096) return _emscripten_memcpy_big(i1 | 0, i4 | 0, i2 | 0) | 0;
 i3 = i1 | 0;
 if ((i1 & 3) == (i4 & 3)) {
  while (i1 & 3) {
   if (!i2) return i3 | 0;
   HEAP8[i1 >> 0] = HEAP8[i4 >> 0] | 0;
   i1 = i1 + 1 | 0;
   i4 = i4 + 1 | 0;
   i2 = i2 - 1 | 0;
  }
  while ((i2 | 0) >= 4) {
   HEAP32[i1 >> 2] = HEAP32[i4 >> 2];
   i1 = i1 + 4 | 0;
   i4 = i4 + 4 | 0;
   i2 = i2 - 4 | 0;
  }
 }
 while ((i2 | 0) > 0) {
  HEAP8[i1 >> 0] = HEAP8[i4 >> 0] | 0;
  i1 = i1 + 1 | 0;
  i4 = i4 + 1 | 0;
  i2 = i2 - 1 | 0;
 }
 return i3 | 0;
}

function _realloc(i3, i2) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 var i1 = 0, i4 = 0;
 if (!i3) {
  i3 = _malloc(i2) | 0;
  return i3 | 0;
 }
 if (i2 >>> 0 > 4294967231) {
  i3 = ___errno_location() | 0;
  HEAP32[i3 >> 2] = 12;
  i3 = 0;
  return i3 | 0;
 }
 i1 = _try_realloc_chunk(i3 + -8 | 0, i2 >>> 0 < 11 ? 16 : i2 + 11 & -8) | 0;
 if (i1) {
  i3 = i1 + 8 | 0;
  return i3 | 0;
 }
 i1 = _malloc(i2) | 0;
 if (!i1) {
  i3 = 0;
  return i3 | 0;
 }
 i4 = HEAP32[i3 + -4 >> 2] | 0;
 i4 = (i4 & -8) - ((i4 & 3 | 0) == 0 ? 8 : 4) | 0;
 _memcpy(i1 | 0, i3 | 0, (i4 >>> 0 < i2 >>> 0 ? i4 : i2) | 0) | 0;
 _free(i3);
 i3 = i1;
 return i3 | 0;
}

function ___divdi3(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0;
 i10 = i2 >> 31 | ((i2 | 0) < 0 ? -1 : 0) << 1;
 i9 = ((i2 | 0) < 0 ? -1 : 0) >> 31 | ((i2 | 0) < 0 ? -1 : 0) << 1;
 i6 = i4 >> 31 | ((i4 | 0) < 0 ? -1 : 0) << 1;
 i5 = ((i4 | 0) < 0 ? -1 : 0) >> 31 | ((i4 | 0) < 0 ? -1 : 0) << 1;
 i8 = _i64Subtract(i10 ^ i1, i9 ^ i2, i10, i9) | 0;
 i7 = tempRet0;
 i1 = i6 ^ i10;
 i2 = i5 ^ i9;
 return _i64Subtract((___udivmoddi4(i8, i7, _i64Subtract(i6 ^ i3, i5 ^ i4, i6, i5) | 0, tempRet0, 0) | 0) ^ i1, tempRet0 ^ i2, i1, i2) | 0;
}

function __ZNK10__cxxabiv117__class_type_info24process_found_base_classEPNS_19__dynamic_cast_infoEPvi(i1, i4, i3, i5) {
 i1 = i1 | 0;
 i4 = i4 | 0;
 i3 = i3 | 0;
 i5 = i5 | 0;
 var i2 = 0;
 i1 = i4 + 16 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 do if (i2) {
  if ((i2 | 0) != (i3 | 0)) {
   i5 = i4 + 36 | 0;
   HEAP32[i5 >> 2] = (HEAP32[i5 >> 2] | 0) + 1;
   HEAP32[i4 + 24 >> 2] = 2;
   HEAP8[i4 + 54 >> 0] = 1;
   break;
  }
  i1 = i4 + 24 | 0;
  if ((HEAP32[i1 >> 2] | 0) == 2) HEAP32[i1 >> 2] = i5;
 } else {
  HEAP32[i1 >> 2] = i3;
  HEAP32[i4 + 24 >> 2] = i5;
  HEAP32[i4 + 36 >> 2] = 1;
 } while (0);
 return;
}

function _parg_asset_preload(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i4 = i2;
 i3 = __emval_get_module_property(1680) | 0;
 i1 = _parg_token_to_string(i1) | 0;
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcj(i4, i1, _strlen(i1 | 0) | 0);
 __ZN10emscripten8internal12MethodCallerIvJRNSt3__112basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEEEE4callEPNS0_7_EM_VALEPKcS9_(i3, 1688, i4);
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i4);
 __emval_decref(i3 | 0);
 STACKTOP = i2;
 return;
}

function _sdsfreesplitres(i4, i1) {
 i4 = i4 | 0;
 i1 = i1 | 0;
 var i2 = 0, i3 = 0;
 if (!i4) return;
 if (i1) do {
  i1 = i1 + -1 | 0;
  i3 = HEAP32[i4 + (i1 << 2) >> 2] | 0;
  if (i3) {
   switch ((HEAPU8[i3 + -1 >> 0] | 0) & 7 | 0) {
   case 1:
    {
     i2 = 3;
     break;
    }
   case 4:
    {
     i2 = 17;
     break;
    }
   case 3:
    {
     i2 = 9;
     break;
    }
   case 0:
    {
     i2 = 1;
     break;
    }
   case 2:
    {
     i2 = 5;
     break;
    }
   default:
    i2 = 0;
   }
   _free(i3 + (0 - i2) | 0);
  }
 } while ((i1 | 0) != 0);
 _free(i4);
 return;
}

function _parg_buffer_create(i5, i4, i3) {
 i5 = i5 | 0;
 i4 = i4 | 0;
 i3 = i3 | 0;
 var i1 = 0, i2 = 0;
 i1 = _malloc(20) | 0;
 HEAP32[i1 + 4 >> 2] = i4;
 HEAP32[i1 + 8 >> 2] = i3;
 i2 = i1 + 12 | 0;
 HEAP32[i2 >> 2] = 0;
 HEAP32[i1 + 16 >> 2] = 0;
 if ((i3 & -2 | 0) == 2) {
  _glGenBuffers(1, i2 | 0);
  i3 = (i3 | 0) == 2 ? 34962 : 34963;
  _glBindBuffer(i3 | 0, HEAP32[i2 >> 2] | 0);
  _glBufferData(i3 | 0, i4 | 0, i5 | 0, 35044);
  return i1 | 0;
 } else {
  i3 = _malloc(i4) | 0;
  HEAP32[i1 >> 2] = i3;
  _memcpy(i3 | 0, i5 | 0, i4 | 0) | 0;
  return i1 | 0;
 }
 return 0;
}

function __ZN10emscripten8internal7InvokerIiJNSt3__112basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEEiEE6invokeEPFiS8_iEPNS0_11BindingTypeIS8_EUt_Ei(i3, i1, i2) {
 i3 = i3 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i4 = 0, i5 = 0;
 i4 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i5 = i4;
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcj(i5, i1 + 4 | 0, HEAP32[i1 >> 2] | 0);
 i3 = FUNCTION_TABLE_iii[i3 & 1](i5, i2) | 0;
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i5);
 STACKTOP = i4;
 return i3 | 0;
}

function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcj(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 var i4 = 0, i5 = 0;
 if (i3 >>> 0 > 4294967279) __ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv(i1);
 if (i3 >>> 0 < 11) {
  HEAP8[i1 >> 0] = i3 << 1;
  i1 = i1 + 1 | 0;
 } else {
  i5 = i3 + 16 & -16;
  i4 = __Znwj(i5) | 0;
  HEAP32[i1 + 8 >> 2] = i4;
  HEAP32[i1 >> 2] = i5 | 1;
  HEAP32[i1 + 4 >> 2] = i3;
  i1 = i4;
 }
 _memcpy(i1 | 0, i2 | 0, i3 | 0) | 0;
 HEAP8[i1 + i3 >> 0] = 0;
 return;
}

function _strncmp(i4, i1, i2) {
 i4 = i4 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i5 = 0;
 if (!i2) {
  i4 = 0;
  return i4 | 0;
 }
 i3 = HEAP8[i4 >> 0] | 0;
 L4 : do if (!(i3 << 24 >> 24)) i3 = 0; else while (1) {
  i2 = i2 + -1 | 0;
  i5 = HEAP8[i1 >> 0] | 0;
  if (!(i3 << 24 >> 24 == i5 << 24 >> 24 & ((i2 | 0) != 0 & i5 << 24 >> 24 != 0))) break L4;
  i4 = i4 + 1 | 0;
  i1 = i1 + 1 | 0;
  i3 = HEAP8[i4 >> 0] | 0;
  if (!(i3 << 24 >> 24)) {
   i3 = 0;
   break;
  }
 } while (0);
 i5 = (i3 & 255) - (HEAPU8[i1 >> 0] | 0) | 0;
 return i5 | 0;
}

function __ZL5allocNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEi(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0;
 i4 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i3 = i4;
 if (!(HEAP8[i1 >> 0] & 1)) i1 = i1 + 1 | 0; else i1 = HEAP32[i1 + 8 >> 2] | 0;
 HEAP32[i3 >> 2] = i2;
 HEAP32[i3 + 4 >> 2] = i1;
 _printf(2176, i3 | 0) | 0;
 i1 = __emval_get_module_property(1680) | 0;
 i3 = _parg_buffer_alloc(i2, 0) | 0;
 HEAP32[508] = i3;
 i3 = _parg_buffer_lock(i3, 1) | 0;
 __emval_decref(i1 | 0);
 STACKTOP = i4;
 return i3 | 0;
}

function _memset(i2, i6, i1) {
 i2 = i2 | 0;
 i6 = i6 | 0;
 i1 = i1 | 0;
 var i3 = 0, i4 = 0, i5 = 0, i7 = 0;
 i3 = i2 + i1 | 0;
 if ((i1 | 0) >= 20) {
  i6 = i6 & 255;
  i5 = i2 & 3;
  i7 = i6 | i6 << 8 | i6 << 16 | i6 << 24;
  i4 = i3 & ~3;
  if (i5) {
   i5 = i2 + 4 - i5 | 0;
   while ((i2 | 0) < (i5 | 0)) {
    HEAP8[i2 >> 0] = i6;
    i2 = i2 + 1 | 0;
   }
  }
  while ((i2 | 0) < (i4 | 0)) {
   HEAP32[i2 >> 2] = i7;
   i2 = i2 + 4 | 0;
  }
 }
 while ((i2 | 0) < (i3 | 0)) {
  HEAP8[i2 >> 0] = i6;
  i2 = i2 + 1 | 0;
 }
 return i2 - i1 | 0;
}

function __ZNK10__cxxabiv120__si_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib(i5, i3, i2, i1, i4, i6) {
 i5 = i5 | 0;
 i3 = i3 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 i4 = i4 | 0;
 i6 = i6 | 0;
 if ((i5 | 0) == (HEAP32[i3 + 8 >> 2] | 0)) __ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i(0, i3, i2, i1, i4); else {
  i5 = HEAP32[i5 + 8 >> 2] | 0;
  FUNCTION_TABLE_viiiiii[HEAP32[(HEAP32[i5 >> 2] | 0) + 20 >> 2] & 3](i5, i3, i2, i1, i4, i6);
 }
 return;
}

function __ZN10emscripten8internal7InvokerIvJNSt3__112basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEEEE6invokeEPFvS8_EPNS0_11BindingTypeIS8_EUt_E(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 var i3 = 0, i4 = 0;
 i3 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i4 = i3;
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcj(i4, i1 + 4 | 0, HEAP32[i1 >> 2] | 0);
 FUNCTION_TABLE_vi[i2 & 31](i4);
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i4);
 STACKTOP = i3;
 return;
}

function __ZNK10__cxxabiv122__base_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib(i7, i5, i4, i3, i6, i8) {
 i7 = i7 | 0;
 i5 = i5 | 0;
 i4 = i4 | 0;
 i3 = i3 | 0;
 i6 = i6 | 0;
 i8 = i8 | 0;
 var i1 = 0, i2 = 0;
 i2 = HEAP32[i7 + 4 >> 2] | 0;
 i1 = i2 >> 8;
 if (i2 & 1) i1 = HEAP32[(HEAP32[i3 >> 2] | 0) + i1 >> 2] | 0;
 i7 = HEAP32[i7 >> 2] | 0;
 FUNCTION_TABLE_viiiiii[HEAP32[(HEAP32[i7 >> 2] | 0) + 20 >> 2] & 3](i7, i5, i4, i3 + i1 | 0, (i2 & 2 | 0) != 0 ? i6 : 2, i8);
 return;
}

function __ZNK10emscripten3val2asINSt3__112basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEEEET_v(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0, d5 = 0.0;
 i3 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i4 = i3;
 d5 = +__emval_as(HEAP32[i2 >> 2] | 0, 2040, i4 | 0);
 i2 = HEAP32[i4 >> 2] | 0;
 i4 = ~~d5 >>> 0;
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcj(i1, i4 + 4 | 0, HEAP32[i4 >> 2] | 0);
 __emval_run_destructors(i2 | 0);
 STACKTOP = i3;
 return;
}

function _message(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0;
 i3 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i2 = i3;
 if (!(_strcmp(i1, 3024) | 0)) {
  HEAP32[660] = 1;
  STACKTOP = i3;
  return;
 }
 if (!(_strcmp(i1, 3032) | 0)) {
  HEAP32[660] = 0;
  STACKTOP = i3;
  return;
 } else {
  i4 = _atoi(i1) | 0;
  HEAP32[662] = i4;
  i1 = HEAP32[663] | 0;
  HEAP32[i2 >> 2] = i4;
  HEAP32[i2 + 4 >> 2] = i4;
  HEAP32[i2 + 8 >> 2] = i1;
  _printf(3040, i2 | 0) | 0;
  STACKTOP = i3;
  return;
 }
}

function _memcmp(i1, i3, i2) {
 i1 = i1 | 0;
 i3 = i3 | 0;
 i2 = i2 | 0;
 var i4 = 0, i5 = 0, i6 = 0;
 if (!i2) {
  i6 = 0;
  return i6 | 0;
 } else {
  i5 = i2;
  i4 = i1;
 }
 while (1) {
  i2 = HEAP8[i4 >> 0] | 0;
  i1 = HEAP8[i3 >> 0] | 0;
  if (i2 << 24 >> 24 != i1 << 24 >> 24) break;
  i5 = i5 + -1 | 0;
  if (!i5) {
   i1 = 0;
   i6 = 5;
   break;
  } else {
   i4 = i4 + 1 | 0;
   i3 = i3 + 1 | 0;
  }
 }
 if ((i6 | 0) == 5) return i1 | 0;
 i6 = (i2 & 255) - (i1 & 255) | 0;
 return i6 | 0;
}

function ___towrite(i2) {
 i2 = i2 | 0;
 var i1 = 0, i3 = 0;
 i1 = i2 + 74 | 0;
 i3 = HEAP8[i1 >> 0] | 0;
 HEAP8[i1 >> 0] = i3 + 255 | i3;
 i1 = HEAP32[i2 >> 2] | 0;
 if (!(i1 & 8)) {
  HEAP32[i2 + 8 >> 2] = 0;
  HEAP32[i2 + 4 >> 2] = 0;
  i3 = HEAP32[i2 + 44 >> 2] | 0;
  HEAP32[i2 + 28 >> 2] = i3;
  HEAP32[i2 + 20 >> 2] = i3;
  HEAP32[i2 + 16 >> 2] = i3 + (HEAP32[i2 + 48 >> 2] | 0);
  i3 = 0;
  return i3 | 0;
 } else {
  HEAP32[i2 >> 2] = i1 | 32;
  i3 = -1;
  return i3 | 0;
 }
 return 0;
}

function __ZNK10__cxxabiv122__base_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib(i6, i4, i3, i5, i7) {
 i6 = i6 | 0;
 i4 = i4 | 0;
 i3 = i3 | 0;
 i5 = i5 | 0;
 i7 = i7 | 0;
 var i1 = 0, i2 = 0;
 i2 = HEAP32[i6 + 4 >> 2] | 0;
 i1 = i2 >> 8;
 if (i2 & 1) i1 = HEAP32[(HEAP32[i3 >> 2] | 0) + i1 >> 2] | 0;
 i6 = HEAP32[i6 >> 2] | 0;
 FUNCTION_TABLE_viiiii[HEAP32[(HEAP32[i6 >> 2] | 0) + 24 >> 2] & 3](i6, i4, i3 + i1 | 0, (i2 & 2 | 0) != 0 ? i5 : 2, i7);
 return;
}

function __ZNK10__cxxabiv120__si_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi(i4, i2, i1, i3) {
 i4 = i4 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 i3 = i3 | 0;
 if ((i4 | 0) == (HEAP32[i2 + 8 >> 2] | 0)) __ZNK10__cxxabiv117__class_type_info24process_found_base_classEPNS_19__dynamic_cast_infoEPvi(0, i2, i1, i3); else {
  i4 = HEAP32[i4 + 8 >> 2] | 0;
  FUNCTION_TABLE_viiii[HEAP32[(HEAP32[i4 >> 2] | 0) + 28 >> 2] & 3](i4, i2, i1, i3);
 }
 return;
}

function __ZNK10__cxxabiv122__base_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi(i6, i4, i3, i5) {
 i6 = i6 | 0;
 i4 = i4 | 0;
 i3 = i3 | 0;
 i5 = i5 | 0;
 var i1 = 0, i2 = 0;
 i2 = HEAP32[i6 + 4 >> 2] | 0;
 i1 = i2 >> 8;
 if (i2 & 1) i1 = HEAP32[(HEAP32[i3 >> 2] | 0) + i1 >> 2] | 0;
 i6 = HEAP32[i6 >> 2] | 0;
 FUNCTION_TABLE_viiii[HEAP32[(HEAP32[i6 >> 2] | 0) + 28 >> 2] & 3](i6, i4, i3 + i1 | 0, (i2 & 2 | 0) != 0 ? i5 : 2);
 return;
}

function copyTempDouble(i1) {
 i1 = i1 | 0;
 HEAP8[tempDoublePtr >> 0] = HEAP8[i1 >> 0];
 HEAP8[tempDoublePtr + 1 >> 0] = HEAP8[i1 + 1 >> 0];
 HEAP8[tempDoublePtr + 2 >> 0] = HEAP8[i1 + 2 >> 0];
 HEAP8[tempDoublePtr + 3 >> 0] = HEAP8[i1 + 3 >> 0];
 HEAP8[tempDoublePtr + 4 >> 0] = HEAP8[i1 + 4 >> 0];
 HEAP8[tempDoublePtr + 5 >> 0] = HEAP8[i1 + 5 >> 0];
 HEAP8[tempDoublePtr + 6 >> 0] = HEAP8[i1 + 6 >> 0];
 HEAP8[tempDoublePtr + 7 >> 0] = HEAP8[i1 + 7 >> 0];
}

function __ZL7messageN10emscripten3valE(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i3 = i2;
 __ZNK10emscripten3val2asINSt3__112basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEEEET_v(i3, i1);
 FUNCTION_TABLE_vi[HEAP32[1552 >> 2] & 31]((HEAP8[i3 >> 0] & 1) == 0 ? i3 + 1 | 0 : HEAP32[i3 + 8 >> 2] | 0);
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i3);
 STACKTOP = i2;
 return;
}

function _strcmp(i4, i2) {
 i4 = i4 | 0;
 i2 = i2 | 0;
 var i1 = 0, i3 = 0;
 i3 = HEAP8[i4 >> 0] | 0;
 i1 = HEAP8[i2 >> 0] | 0;
 if (i3 << 24 >> 24 == 0 ? 1 : i3 << 24 >> 24 != i1 << 24 >> 24) i2 = i3; else {
  do {
   i4 = i4 + 1 | 0;
   i2 = i2 + 1 | 0;
   i3 = HEAP8[i4 >> 0] | 0;
   i1 = HEAP8[i2 >> 0] | 0;
  } while (!(i3 << 24 >> 24 == 0 ? 1 : i3 << 24 >> 24 != i1 << 24 >> 24));
  i2 = i3;
 }
 return (i2 & 255) - (i1 & 255) | 0;
}

function ___muldsi3(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0, i5 = 0, i6 = 0;
 i6 = i1 & 65535;
 i5 = i2 & 65535;
 i3 = Math_imul(i5, i6) | 0;
 i4 = i1 >>> 16;
 i1 = (i3 >>> 16) + (Math_imul(i5, i4) | 0) | 0;
 i5 = i2 >>> 16;
 i2 = Math_imul(i5, i6) | 0;
 return (tempRet0 = (i1 >>> 16) + (Math_imul(i5, i4) | 0) + (((i1 & 65535) + i2 | 0) >>> 16) | 0, i1 + i2 << 16 | i3 & 65535 | 0) | 0;
}

function __Znwj(i1) {
 i1 = i1 | 0;
 var i2 = 0;
 i2 = (i1 | 0) == 0 ? 1 : i1;
 i1 = _malloc(i2) | 0;
 L1 : do if (!i1) {
  while (1) {
   i1 = __ZSt15get_new_handlerv() | 0;
   if (!i1) break;
   FUNCTION_TABLE_v[i1 & 7]();
   i1 = _malloc(i2) | 0;
   if (i1) break L1;
  }
  i2 = ___cxa_allocate_exception(4) | 0;
  HEAP32[i2 >> 2] = 4664;
  ___cxa_throw(i2 | 0, 4696, 2);
 } while (0);
 return i1 | 0;
}

function __ZSt9terminatev() {
 var i1 = 0, i2 = 0;
 i1 = ___cxa_get_globals_fast() | 0;
 if (((i1 | 0) != 0 ? (i2 = HEAP32[i1 >> 2] | 0, (i2 | 0) != 0) : 0) ? (i1 = i2 + 48 | 0, (HEAP32[i1 >> 2] & -256 | 0) == 1126902528 ? (HEAP32[i1 + 4 >> 2] | 0) == 1129074247 : 0) : 0) __ZSt11__terminatePFvvE(HEAP32[i2 + 12 >> 2] | 0);
 i2 = HEAP32[1162] | 0;
 HEAP32[1162] = i2 + 0;
 __ZSt11__terminatePFvvE(i2);
}

function _parg_framebuffer_create(i6, i4, i5, i1, i3) {
 i6 = i6 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 i1 = i1 | 0;
 i3 = i3 | 0;
 var i2 = 0;
 i1 = (i3 >>> 1 & 1) + 6407 | 0;
 if (!(i3 & 1)) i2 = (i3 & 4 | 0) == 0 ? 5121 : 36193; else i2 = 5126;
 i3 = _parg_framebuffer_create_empty(i6, i4, i3) | 0;
 _glTexImage2D(3553, 0, i1 | 0, i6 | 0, i4 | 0, 0, i1 | 0, i2 | 0, i5 | 0);
 return i3 | 0;
}

function __ZNK10__cxxabiv117__class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib(i5, i3, i2, i1, i4, i6) {
 i5 = i5 | 0;
 i3 = i3 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 i4 = i4 | 0;
 i6 = i6 | 0;
 if ((i5 | 0) == (HEAP32[i3 + 8 >> 2] | 0)) __ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i(0, i3, i2, i1, i4);
 return;
}

function _parg_buffer_alloc(i2, i4) {
 i2 = i2 | 0;
 i4 = i4 | 0;
 var i1 = 0, i3 = 0;
 i3 = _malloc(20) | 0;
 if (!i4) i1 = _malloc(i2) | 0; else i1 = 0;
 HEAP32[i3 >> 2] = i1;
 HEAP32[i3 + 4 >> 2] = i2;
 HEAP32[i3 + 8 >> 2] = i4;
 i1 = i3 + 12 | 0;
 HEAP32[i1 >> 2] = 0;
 HEAP32[i3 + 16 >> 2] = 0;
 if ((i4 & -2 | 0) != 2) return i3 | 0;
 _glGenBuffers(1, i1 | 0);
 return i3 | 0;
}

function _memmove(i1, i4, i2) {
 i1 = i1 | 0;
 i4 = i4 | 0;
 i2 = i2 | 0;
 var i3 = 0;
 if ((i4 | 0) < (i1 | 0) & (i1 | 0) < (i4 + i2 | 0)) {
  i3 = i1;
  i4 = i4 + i2 | 0;
  i1 = i1 + i2 | 0;
  while ((i2 | 0) > 0) {
   i1 = i1 - 1 | 0;
   i4 = i4 - 1 | 0;
   i2 = i2 - 1 | 0;
   HEAP8[i1 >> 0] = HEAP8[i4 >> 0] | 0;
  }
  i1 = i3;
 } else _memcpy(i1, i4, i2) | 0;
 return i1 | 0;
}

function _llvm_cttz_i32(i2) {
 i2 = i2 | 0;
 var i1 = 0;
 i1 = HEAP8[cttz_i8 + (i2 & 255) >> 0] | 0;
 if ((i1 | 0) < 8) return i1 | 0;
 i1 = HEAP8[cttz_i8 + (i2 >> 8 & 255) >> 0] | 0;
 if ((i1 | 0) < 8) return i1 + 8 | 0;
 i1 = HEAP8[cttz_i8 + (i2 >> 16 & 255) >> 0] | 0;
 if ((i1 | 0) < 8) return i1 + 16 | 0;
 return (HEAP8[cttz_i8 + (i2 >>> 24) >> 0] | 0) + 24 | 0;
}

function _parg_buffer_unlock(i2) {
 i2 = i2 | 0;
 var i1 = 0, i3 = 0;
 i1 = i2 + 16 | 0;
 if (!(HEAP32[i1 >> 2] | 0)) return;
 i3 = (HEAP32[i2 + 8 >> 2] | 0) == 2 ? 34962 : 34963;
 _glBindBuffer(i3 | 0, HEAP32[i2 + 12 >> 2] | 0);
 _glBufferData(i3 | 0, HEAP32[i2 + 4 >> 2] | 0, HEAP32[i1 >> 2] | 0, 35044);
 _free(HEAP32[i1 >> 2] | 0);
 HEAP32[i1 >> 2] = 0;
 return;
}

function _dispose() {
 _parg_mesh_free(HEAP32[652] | 0);
 _parg_texture_free(HEAP32[650] | 0);
 _parg_texture_free(HEAP32[651] | 0);
 _parg_buffer_free(HEAP32[653] | 0);
 _parg_buffer_free(HEAP32[654] | 0);
 _parg_framebuffer_free(HEAP32[655] | 0);
 _parg_framebuffer_free(HEAP32[656] | 0);
 _parg_framebuffer_free(HEAP32[657] | 0);
 _free(HEAP32[661] | 0);
 return;
}

function _sdsfree(i2) {
 i2 = i2 | 0;
 var i1 = 0;
 if (!i2) return;
 switch ((HEAPU8[i2 + -1 >> 0] | 0) & 7 | 0) {
 case 3:
  {
   i1 = 9;
   break;
  }
 case 4:
  {
   i1 = 17;
   break;
  }
 case 0:
  {
   i1 = 1;
   break;
  }
 case 1:
  {
   i1 = 3;
   break;
  }
 case 2:
  {
   i1 = 5;
   break;
  }
 default:
  i1 = 0;
 }
 _free(i2 + (0 - i1) | 0);
 return;
}

function _calloc(i3, i1) {
 i3 = i3 | 0;
 i1 = i1 | 0;
 var i2 = 0;
 if (i3) {
  i2 = Math_imul(i1, i3) | 0;
  if ((i1 | i3) >>> 0 > 65535) i2 = ((i2 >>> 0) / (i3 >>> 0) | 0 | 0) == (i1 | 0) ? i2 : -1;
 } else i2 = 0;
 i1 = _malloc(i2) | 0;
 if (!i1) return i1 | 0;
 if (!(HEAP32[i1 + -4 >> 2] & 3)) return i1 | 0;
 _memset(i1 | 0, 0, i2 | 0) | 0;
 return i1 | 0;
}

function ___cxa_can_catch(i1, i2, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i4 = i4 | 0;
 var i3 = 0, i5 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i3 = i5;
 HEAP32[i3 >> 2] = HEAP32[i4 >> 2];
 i1 = FUNCTION_TABLE_iiii[HEAP32[(HEAP32[i1 >> 2] | 0) + 16 >> 2] & 7](i1, i2, i3) | 0;
 if (i1) HEAP32[i4 >> 2] = HEAP32[i3 >> 2];
 STACKTOP = i5;
 return i1 & 1 | 0;
}

function _parg_buffer_gpu_bind(i3) {
 i3 = i3 | 0;
 var i1 = 0, i2 = 0;
 i2 = i3 + 8 | 0;
 i1 = HEAP32[i2 >> 2] | 0;
 if ((i1 & -2 | 0) != 2) {
  _puts(312) | 0;
  i1 = HEAP32[i2 >> 2] | 0;
 }
 if ((i1 & -2 | 0) == 2) {
  _glBindBuffer(((i1 | 0) == 2 ? 34962 : 34963) | 0, HEAP32[i3 + 12 >> 2] | 0);
  return;
 } else ___assert_fail(336, 248, 169, 368);
}

function __ZNK10__cxxabiv117__class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi(i4, i2, i1, i3) {
 i4 = i4 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 i3 = i3 | 0;
 if ((i4 | 0) == (HEAP32[i2 + 8 >> 2] | 0)) __ZNK10__cxxabiv117__class_type_info24process_found_base_classEPNS_19__dynamic_cast_infoEPvi(0, i2, i1, i3);
 return;
}

function _sn_write(i1, i3, i2) {
 i1 = i1 | 0;
 i3 = i3 | 0;
 i2 = i2 | 0;
 var i4 = 0, i5 = 0;
 i4 = i1 + 20 | 0;
 i5 = HEAP32[i4 >> 2] | 0;
 i1 = (HEAP32[i1 + 16 >> 2] | 0) - i5 | 0;
 i1 = i1 >>> 0 > i2 >>> 0 ? i2 : i1;
 _memcpy(i5 | 0, i3 | 0, i1 | 0) | 0;
 HEAP32[i4 >> 2] = (HEAP32[i4 >> 2] | 0) + i1;
 return i2 | 0;
}

function _parg_varray_enable(i2, i1, i3, i6, i5, i4) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 i3 = i3 | 0;
 i6 = i6 | 0;
 i5 = i5 | 0;
 i4 = i4 | 0;
 _parg_buffer_gpu_bind(i2);
 i2 = _parg_shader_attrib_get(i1) | 0;
 _glEnableVertexAttribArray(i2 | 0);
 _glVertexAttribPointer(i2 | 0, i3 | 0, i6 | 0, 0, i5 | 0, i4 | 0);
 return;
}

function __ZN10emscripten8internal7InvokerIvJNS_3valEEE6invokeEPFvS2_EPNS0_7_EM_VALE(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 var i3 = 0, i4 = 0;
 i3 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i4 = i3;
 HEAP32[i4 >> 2] = i1;
 FUNCTION_TABLE_vi[i2 & 31](i4);
 __emval_decref(HEAP32[i4 >> 2] | 0);
 STACKTOP = i3;
 return;
}

function ___uremdi3(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i5 = 0, i6 = 0;
 i6 = STACKTOP;
 STACKTOP = STACKTOP + 8 | 0;
 i5 = i6 | 0;
 ___udivmoddi4(i1, i2, i3, i4, i5) | 0;
 STACKTOP = i6;
 return (tempRet0 = HEAP32[i5 + 4 >> 2] | 0, HEAP32[i5 >> 2] | 0) | 0;
}

function ___muldi3(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i5 = 0, i6 = 0;
 i5 = i1;
 i6 = i3;
 i3 = ___muldsi3(i5, i6) | 0;
 i1 = tempRet0;
 return (tempRet0 = (Math_imul(i2, i6) | 0) + (Math_imul(i4, i5) | 0) + i1 | i1 & 0, i3 | 0 | 0) | 0;
}

function _parg_buffer_lock(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 if ((i1 | 0) == 1 ? (HEAP32[i2 + 8 >> 2] & -2 | 0) == 2 : 0) {
  i1 = _malloc(HEAP32[i2 + 4 >> 2] | 0) | 0;
  HEAP32[i2 + 16 >> 2] = i1;
  i2 = i1;
  return i2 | 0;
 }
 i2 = HEAP32[i2 >> 2] | 0;
 return i2 | 0;
}

function ___cxa_get_globals_fast() {
 var i1 = 0, i2 = 0;
 i1 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if (!(_pthread_once(5576, 7) | 0)) {
  i2 = _pthread_getspecific(HEAP32[1392] | 0) | 0;
  STACKTOP = i1;
  return i2 | 0;
 } else _abort_message(5584, i1);
 return 0;
}

function __ZL6commitNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE(i1) {
 i1 = i1 | 0;
 _parg_buffer_unlock(HEAP32[508] | 0);
 if (!(HEAP8[i1 >> 0] & 1)) i1 = i1 + 1 | 0; else i1 = HEAP32[i1 + 8 >> 2] | 0;
 _parg_asset_onload(i1, HEAP32[508] | 0);
 return;
}

function __ZL4tickff(f2, f1) {
 f2 = Math_fround(f2);
 f1 = Math_fround(f1);
 var f3 = f0, f4 = f0;
 HEAPF32[592] = f1;
 f4 = Math_fround(HEAP32[390] | 0);
 f3 = Math_fround(HEAP32[392] | 0);
 return FUNCTION_TABLE_iffff[HEAP32[1520 >> 2] & 3](f4, f3, f1, f2) | 0;
}

function __ZN10__cxxabiv112_GLOBAL__N_19destruct_EPv(i1) {
 i1 = i1 | 0;
 var i2 = 0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 _free(i1);
 if (!(_pthread_setspecific(HEAP32[1392] | 0, 0) | 0)) {
  STACKTOP = i2;
  return;
 } else _abort_message(5752, i2);
}

function dynCall_iffff(i5, f1, f2, f3, f4) {
 i5 = i5 | 0;
 f1 = Math_fround(f1);
 f2 = Math_fround(f2);
 f3 = Math_fround(f3);
 f4 = Math_fround(f4);
 return FUNCTION_TABLE_iffff[i5 & 3](Math_fround(f1), Math_fround(f2), Math_fround(f3), Math_fround(f4)) | 0;
}

function _parg_mesh_free(i1) {
 i1 = i1 | 0;
 if (!i1) return;
 _parg_buffer_free(HEAP32[i1 >> 2] | 0);
 _parg_buffer_free(HEAP32[i1 + 12 >> 2] | 0);
 _parg_buffer_free(HEAP32[i1 + 8 >> 2] | 0);
 _parg_buffer_free(HEAP32[i1 + 4 >> 2] | 0);
 _free(i1);
 return;
}

function dynCall_viifff(i6, i1, i2, f3, f4, f5) {
 i6 = i6 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 f3 = Math_fround(f3);
 f4 = Math_fround(f4);
 f5 = Math_fround(f5);
 FUNCTION_TABLE_viifff[i6 & 1](i1 | 0, i2 | 0, Math_fround(f3), Math_fround(f4), Math_fround(f5));
}

function _parg_framebuffer_pushfbo(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 _glGetIntegerv(36006, 536);
 _glGetIntegerv(2978, 544);
 _glViewport(0, 0, HEAP32[i1 >> 2] | 0, HEAP32[i1 + 4 >> 2] | 0);
 _glBindFramebuffer(36160, HEAP32[i1 + 12 >> 2] | 0);
 return;
}

function _abort_message(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0;
 i3 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 HEAP32[i3 >> 2] = i2;
 i2 = HEAP32[_stderr >> 2] | 0;
 _vfprintf(i2 | 0, i1 | 0, i3 | 0) | 0;
 _fputc(10, i2 | 0) | 0;
 _abort();
}

function _sdscatprintf(i2, i1, i3) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 i3 = i3 | 0;
 var i4 = 0, i5 = 0;
 i4 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i5 = i4;
 HEAP32[i5 >> 2] = i3;
 i3 = _sdscatvprintf(i2, i1, i5) | 0;
 STACKTOP = i4;
 return i3 | 0;
}

function copyTempFloat(i1) {
 i1 = i1 | 0;
 HEAP8[tempDoublePtr >> 0] = HEAP8[i1 >> 0];
 HEAP8[tempDoublePtr + 1 >> 0] = HEAP8[i1 + 1 >> 0];
 HEAP8[tempDoublePtr + 2 >> 0] = HEAP8[i1 + 2 >> 0];
 HEAP8[tempDoublePtr + 3 >> 0] = HEAP8[i1 + 3 >> 0];
}

function __ZN10emscripten8internal7InvokerIvJifffEE6invokeEPFvifffEifff(i5, i1, f2, f3, f4) {
 i5 = i5 | 0;
 i1 = i1 | 0;
 f2 = Math_fround(f2);
 f3 = Math_fround(f3);
 f4 = Math_fround(f4);
 FUNCTION_TABLE_vifff[i5 & 3](i1, f2, f3, f4);
 return;
}

function _bitshift64Ashr(i3, i2, i1) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 if ((i1 | 0) < 32) {
  tempRet0 = i2 >> i1;
  return i3 >>> i1 | (i2 & (1 << i1) - 1) << 32 - i1;
 }
 tempRet0 = (i2 | 0) < 0 ? -1 : 0;
 return i2 >> i1 - 32 | 0;
}

function dynCall_viiiiii(i7, i1, i2, i3, i4, i5, i6) {
 i7 = i7 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 FUNCTION_TABLE_viiiiii[i7 & 3](i1 | 0, i2 | 0, i3 | 0, i4 | 0, i5 | 0, i6 | 0);
}

function dynCall_vifff(i5, i1, f2, f3, f4) {
 i5 = i5 | 0;
 i1 = i1 | 0;
 f2 = Math_fround(f2);
 f3 = Math_fround(f3);
 f4 = Math_fround(f4);
 FUNCTION_TABLE_vifff[i5 & 3](i1 | 0, Math_fround(f2), Math_fround(f3), Math_fround(f4));
}

function _bitshift64Shl(i3, i2, i1) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 if ((i1 | 0) < 32) {
  tempRet0 = i2 << i1 | (i3 & (1 << i1) - 1 << 32 - i1) >>> 32 - i1;
  return i3 << i1;
 }
 tempRet0 = i3 << i1 - 32;
 return 0;
}
function _bitshift64Lshr(i3, i2, i1) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 if ((i1 | 0) < 32) {
  tempRet0 = i2 >>> i1;
  return i3 >>> i1 | (i2 & (1 << i1) - 1) << 32 - i1;
 }
 tempRet0 = 0;
 return i2 >>> i1 - 32 | 0;
}

function ___strdup(i3) {
 i3 = i3 | 0;
 var i1 = 0, i2 = 0;
 i1 = (_strlen(i3 | 0) | 0) + 1 | 0;
 i2 = _malloc(i1) | 0;
 if (!i2) {
  i3 = 0;
  return i3 | 0;
 }
 _memcpy(i2 | 0, i3 | 0, i1 | 0) | 0;
 i3 = i2;
 return i3 | 0;
}

function __ZN10__cxxabiv112_GLOBAL__N_110construct_Ev() {
 var i1 = 0;
 i1 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if (!(_pthread_key_create(5568, 21) | 0)) {
  STACKTOP = i1;
  return;
 } else _abort_message(5696, i1);
}

function _parg_window_exec(f4, f3, i2, i1) {
 f4 = Math_fround(f4);
 f3 = Math_fround(f3);
 i2 = i2 | 0;
 i1 = i1 | 0;
 HEAP32[390] = ~~f4;
 HEAP32[392] = ~~f3;
 _emscripten_asm_const_2(0, +(+f4), +(+f3)) | 0;
 return 0;
}

function runPostSets() {}
function _i64Subtract(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i4 = i2 - i4 - (i3 >>> 0 > i1 >>> 0 | 0) >>> 0;
 return (tempRet0 = i4, i1 - i3 >>> 0 | 0) | 0;
}

function dynCall_viiiii(i6, i1, i2, i3, i4, i5) {
 i6 = i6 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 FUNCTION_TABLE_viiiii[i6 & 3](i1 | 0, i2 | 0, i3 | 0, i4 | 0, i5 | 0);
}

function _parg_state_blending(i1) {
 i1 = i1 | 0;
 if ((i1 | 0) == 1) _glBlendFunc(770, 771); else if ((i1 | 0) == 2) _glBlendFunc(1, 1);
 FUNCTION_TABLE_vi[((i1 | 0) != 0 ? 12 : 13) & 31](3042);
 return;
}

function dynCall_vfff(i4, f1, f2, f3) {
 i4 = i4 | 0;
 f1 = Math_fround(f1);
 f2 = Math_fround(f2);
 f3 = Math_fround(f3);
 FUNCTION_TABLE_vfff[i4 & 3](Math_fround(f1), Math_fround(f2), Math_fround(f3));
}

function dynCall_iiff(i4, i1, f2, f3) {
 i4 = i4 | 0;
 i1 = i1 | 0;
 f2 = Math_fround(f2);
 f3 = Math_fround(f3);
 return FUNCTION_TABLE_iiff[i4 & 1](i1 | 0, Math_fround(f2), Math_fround(f3)) | 0;
}

function __ZL5inputifff(i1, f2, f3, f4) {
 i1 = i1 | 0;
 f2 = Math_fround(f2);
 f3 = Math_fround(f3);
 f4 = Math_fround(f4);
 FUNCTION_TABLE_vifff[HEAP32[1544 >> 2] & 3](i1, f2, f3, f4);
 return;
}

function _parg_buffer_free(i1) {
 i1 = i1 | 0;
 if (!i1) return;
 if ((HEAP32[i1 + 8 >> 2] & -2 | 0) == 2) _glDeleteBuffers(1, i1 + 12 | 0); else _free(HEAP32[i1 >> 2] | 0);
 _free(i1);
 return;
}

function _i64Add(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i3 = i1 + i3 >>> 0;
 return (tempRet0 = i2 + i4 + (i3 >>> 0 < i1 >>> 0 | 0) >>> 0, i3 | 0) | 0;
}

function __ZN10emscripten8internal7InvokerIiJffEE6invokeEPFiffEff(i3, f1, f2) {
 i3 = i3 | 0;
 f1 = Math_fround(f1);
 f2 = Math_fround(f2);
 return FUNCTION_TABLE_iff[i3 & 1](f1, f2) | 0;
}

function __ZNK10__cxxabiv123__fundamental_type_info9can_catchEPKNS_16__shim_type_infoERPv(i2, i3, i1) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i1 = i1 | 0;
 return (i2 | 0) == (i3 | 0) | 0;
}

function dynCall_viiii(i5, i1, i2, i3, i4) {
 i5 = i5 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 FUNCTION_TABLE_viiii[i5 & 3](i1 | 0, i2 | 0, i3 | 0, i4 | 0);
}

function _parg_uniform1f(i1, f2) {
 i1 = i1 | 0;
 f2 = Math_fround(f2);
 i1 = _parg_shader_uniform_get(i1) | 0;
 if ((i1 | 0) <= -1) return;
 _glUniform1f(i1 | 0, +f2);
 return;
}

function _parg_framebuffer_popfbo() {
 _glBindFramebuffer(36160, HEAP32[134] | 0);
 _glViewport(HEAP32[136] | 0, HEAP32[137] | 0, HEAP32[138] | 0, HEAP32[139] | 0);
 return;
}

function _parg_uniform1i(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i1 = _parg_shader_uniform_get(i1) | 0;
 if ((i1 | 0) <= -1) return;
 _glUniform1i(i1 | 0, i2 | 0);
 return;
}

function _tick(f4, f3, f1, f2) {
 f4 = Math_fround(f4);
 f3 = Math_fround(f3);
 f1 = Math_fround(f1);
 f2 = Math_fround(f2);
 HEAPF32[658] = f2;
 return HEAP32[660] | 0;
}

function dynCall_iff(i3, f1, f2) {
 i3 = i3 | 0;
 f1 = Math_fround(f1);
 f2 = Math_fround(f2);
 return FUNCTION_TABLE_iff[i3 & 1](Math_fround(f1), Math_fround(f2)) | 0;
}

function __ZSt11__terminatePFvvE(i1) {
 i1 = i1 | 0;
 var i2 = 0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 FUNCTION_TABLE_v[i1 & 7]();
 _abort_message(5656, i2);
}

function _parg_buffer_length(i1) {
 i1 = i1 | 0;
 if (!i1) {
  _puts(224) | 0;
  ___assert_fail(240, 248, 83, 288);
 } else return HEAP32[i1 + 4 >> 2] | 0;
 return 0;
}

function __ZN10emscripten8internal14raw_destructorIZN32EmscriptenBindingInitializer_parC1EvE6WindowEEvPT_(i1) {
 i1 = i1 | 0;
 if (!i1) return;
 __ZdlPv(i1);
 return;
}

function _parg_shader_load_from_asset(i1) {
 i1 = i1 | 0;
 i1 = _parg_buffer_from_asset(i1) | 0;
 _parg_shader_load_from_buffer(i1);
 _parg_buffer_free(i1);
 return;
}

function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i1) {
 i1 = i1 | 0;
 if (HEAP8[i1 >> 0] & 1) __ZdlPv(HEAP32[i1 + 8 >> 2] | 0);
 return;
}

function __ZN10emscripten8internal14raw_destructorIZN32EmscriptenBindingInitializer_parC1EvE5AssetEEvPT_(i1) {
 i1 = i1 | 0;
 if (!i1) return;
 __ZdlPv(i1);
 return;
}

function _parg_framebuffer_bindtex(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 _glActiveTexture(i2 + 33984 | 0);
 _glBindTexture(3553, HEAP32[i1 + 8 >> 2] | 0);
 return;
}

function dynCall_iiii(i4, i1, i2, i3) {
 i4 = i4 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 return FUNCTION_TABLE_iiii[i4 & 7](i1 | 0, i2 | 0, i3 | 0) | 0;
}

function _parg_buffer_slurp_asset(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i1 = _parg_asset_to_buffer(i1) | 0;
 HEAP32[i2 >> 2] = HEAP32[i1 >> 2];
 return i1 | 0;
}

function _strchr(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 i2 = ___strchrnul(i2, i1) | 0;
 return ((HEAP8[i2 >> 0] | 0) == (i1 & 255) << 24 >> 24 ? i2 : 0) | 0;
}

function _parg_texture_bind(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 _glActiveTexture(i1 + 33984 | 0);
 _glBindTexture(3553, HEAP32[i2 + 8 >> 2] | 0);
 return;
}

function __ZL10null_input10parg_eventfff(i1, f2, f3, f4) {
 i1 = i1 | 0;
 f2 = Math_fround(f2);
 f3 = Math_fround(f3);
 f4 = Math_fround(f4);
 return;
}

function __ZL9null_tickffff(f1, f2, f3, f4) {
 f1 = Math_fround(f1);
 f2 = Math_fround(f2);
 f3 = Math_fround(f3);
 f4 = Math_fround(f4);
 return 0;
}
function stackAlloc(i1) {
 i1 = i1 | 0;
 var i2 = 0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + i1 | 0;
 STACKTOP = STACKTOP + 15 & -16;
 return i2 | 0;
}

function _parg_framebuffer_free(i1) {
 i1 = i1 | 0;
 _glDeleteTextures(1, i1 + 8 | 0);
 _glDeleteFramebuffers(1, i1 + 12 | 0);
 _free(i1);
 return;
}

function ___cxa_is_pointer_type(i1) {
 i1 = i1 | 0;
 if (!i1) i1 = 0; else i1 = (___dynamic_cast(i1, 4808, 4976, 0) | 0) != 0;
 return i1 & 1 | 0;
}

function b3(f1, f2, f3, f4) {
 f1 = Math_fround(f1);
 f2 = Math_fround(f2);
 f3 = Math_fround(f3);
 f4 = Math_fround(f4);
 abort(3);
 return 0;
}

function b8(i1, i2, f3, f4, f5) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 f3 = Math_fround(f3);
 f4 = Math_fround(f4);
 f5 = Math_fround(f5);
 abort(8);
}

function __ZN10emscripten8internal13getActualTypeIZN32EmscriptenBindingInitializer_parC1EvE6WindowEEPKvPT_(i1) {
 i1 = i1 | 0;
 return 1704;
}

function ___udivdi3(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 return ___udivmoddi4(i1, i2, i3, i4, 0) | 0;
}

function __ZN10emscripten8internal13getActualTypeIZN32EmscriptenBindingInitializer_parC1EvE5AssetEEPKvPT_(i1) {
 i1 = i1 | 0;
 return 1904;
}

function b12(i1, i2, i3, i4, i5, i6) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 abort(12);
}

function __ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv(i1) {
 i1 = i1 | 0;
 ___assert_fail(5808, 5840, 1164, 5920);
}

function dynCall_iii(i3, i1, i2) {
 i3 = i3 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 return FUNCTION_TABLE_iii[i3 & 1](i1 | 0, i2 | 0) | 0;
}

function _sdsnew(i2) {
 i2 = i2 | 0;
 var i1 = 0;
 if (!i2) i1 = 0; else i1 = _strlen(i2 | 0) | 0;
 return _sdsnewlen(i2, i1) | 0;
}

function b11(i1, f2, f3, f4) {
 i1 = i1 | 0;
 f2 = Math_fround(f2);
 f3 = Math_fround(f3);
 f4 = Math_fround(f4);
 abort(11);
}

function _strlen(i2) {
 i2 = i2 | 0;
 var i1 = 0;
 i1 = i2;
 while (HEAP8[i1 >> 0] | 0) i1 = i1 + 1 | 0;
 return i1 - i2 | 0;
}

function _wctomb(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 if (!i1) i1 = 0; else i1 = _wcrtomb(i1, i2, 0) | 0;
 return i1 | 0;
}

function dynCall_vii(i3, i1, i2) {
 i3 = i3 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 FUNCTION_TABLE_vii[i3 & 3](i1 | 0, i2 | 0);
}

function _parg_varray_disable(i1) {
 i1 = i1 | 0;
 _glDisableVertexAttribArray(_parg_shader_attrib_get(i1) | 0);
 return;
}

function __ZN10emscripten8internal7InvokerIvJEE6invokeEPFvvE(i1) {
 i1 = i1 | 0;
 FUNCTION_TABLE_v[i1 & 7]();
 return;
}

function __ZL9null_initfff(f1, f2, f3) {
 f1 = Math_fround(f1);
 f2 = Math_fround(f2);
 f3 = Math_fround(f3);
 return;
}

function __GLOBAL__sub_I_bind_cpp() {
 __ZN53EmscriptenBindingInitializer_native_and_builtin_typesC2Ev(0);
 return;
}

function setThrew(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 if (!__THREW__) {
  __THREW__ = i1;
  threwValue = i2;
 }
}

function b2(i1, i2, i3, i4, i5) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 abort(2);
}

function __ZSt15get_new_handlerv() {
 var i1 = 0;
 i1 = HEAP32[1178] | 0;
 HEAP32[1178] = i1 + 0;
 return i1 | 0;
}

function b5(i1, f2, f3) {
 i1 = i1 | 0;
 f2 = Math_fround(f2);
 f3 = Math_fround(f3);
 abort(5);
 return 0;
}

function ___clang_call_terminate(i1) {
 i1 = i1 | 0;
 ___cxa_begin_catch(i1 | 0) | 0;
 __ZSt9terminatev();
}

function b9(f1, f2, f3) {
 f1 = Math_fround(f1);
 f2 = Math_fround(f2);
 f3 = Math_fround(f3);
 abort(9);
}

function dynCall_ii(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 return FUNCTION_TABLE_ii[i2 & 3](i1 | 0) | 0;
}

function _parg_texture_free(i1) {
 i1 = i1 | 0;
 _glDeleteTextures(1, i1 + 8 | 0);
 _free(i1);
 return;
}

function _parg_asset_set_baseurl(i1) {
 i1 = i1 | 0;
 i1 = _sdsnew(i1) | 0;
 HEAP32[54] = i1;
 return;
}

function b14(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 abort(14);
}

function __GLOBAL__sub_I_bindings_cpp() {
 __ZN32EmscriptenBindingInitializer_parC2Ev(0);
 return;
}

function _isspace(i1) {
 i1 = i1 | 0;
 return ((i1 | 0) == 32 | (i1 + -9 | 0) >>> 0 < 5) & 1 | 0;
}

function __ZN10__cxxabiv123__fundamental_type_infoD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function _parg_window_setargs(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 HEAP32[376] = i2;
 return;
}

function __ZN10__cxxabiv121__vmi_class_type_infoD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function dynCall_vi(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 FUNCTION_TABLE_vi[i2 & 31](i1 | 0);
}

function __ZN10__cxxabiv120__si_class_type_infoD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function __ZN10__cxxabiv119__pointer_type_infoD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function _parg_buffer_from_asset(i1) {
 i1 = i1 | 0;
 return _parg_asset_to_buffer(i1) | 0;
}

function ___getTypeName(i1) {
 i1 = i1 | 0;
 return ___strdup(HEAP32[i1 + 4 >> 2] | 0) | 0;
}

function __ZN10__cxxabiv117__class_type_infoD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function b7(f1, f2) {
 f1 = Math_fround(f1);
 f2 = Math_fround(f2);
 abort(7);
 return 0;
}

function b1(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 abort(1);
 return 0;
}

function _parg_token_to_string(i1) {
 i1 = i1 | 0;
 return _parg_token_to_sds(i1) | 0;
}

function _parg_draw_points(i1) {
 i1 = i1 | 0;
 _glDrawArrays(0, 0, i1 | 0);
 return;
}

function __ZNK10__cxxabiv116__shim_type_info5noop2Ev(i1) {
 i1 = i1 | 0;
 return;
}

function __ZNK10__cxxabiv116__shim_type_info5noop1Ev(i1) {
 i1 = i1 | 0;
 return;
}

function _parg_window_onmessage(i1) {
 i1 = i1 | 0;
 HEAP32[388] = i1;
 return;
}

function _frexpl(d2, i1) {
 d2 = +d2;
 i1 = i1 | 0;
 return +(+_frexp(d2, i1));
}

function _parg_window_oninput(i1) {
 i1 = i1 | 0;
 HEAP32[386] = i1;
 return;
}

function _parg_window_ontick(i1) {
 i1 = i1 | 0;
 HEAP32[380] = i1;
 return;
}

function _parg_window_oninit(i1) {
 i1 = i1 | 0;
 HEAP32[378] = i1;
 return;
}

function _parg_window_onexit(i1) {
 i1 = i1 | 0;
 HEAP32[384] = i1;
 return;
}

function _parg_window_ondraw(i1) {
 i1 = i1 | 0;
 HEAP32[382] = i1;
 return;
}

function __ZN10__cxxabiv116__shim_type_infoD2Ev(i1) {
 i1 = i1 | 0;
 return;
}

function __ZL4drawv() {
 FUNCTION_TABLE_v[HEAP32[1528 >> 2] & 7]();
 return;
}

function _parg_mesh_uv(i1) {
 i1 = i1 | 0;
 return HEAP32[i1 + 4 >> 2] | 0;
}

function _parg_mesh_coord(i1) {
 i1 = i1 | 0;
 return HEAP32[i1 >> 2] | 0;
}

function b13(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 abort(13);
 return 0;
}

function __ZNSt9bad_allocD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function _glDisable__wrapper(i1) {
 i1 = i1 | 0;
 _glDisable(i1 | 0);
}

function dynCall_v(i1) {
 i1 = i1 | 0;
 FUNCTION_TABLE_v[i1 & 7]();
}

function _glEnable__wrapper(i1) {
 i1 = i1 | 0;
 _glEnable(i1 | 0);
}

function __ZNKSt9bad_alloc4whatEv(i1) {
 i1 = i1 | 0;
 return 5640;
}

function _parg_draw_one_quad() {
 _glDrawArrays(5, 0, 4);
 return;
}

function b4(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 abort(4);
}

function __ZL12null_messagePKc(i1) {
 i1 = i1 | 0;
 return;
}

function __ZNSt9type_infoD2Ev(i1) {
 i1 = i1 | 0;
 return;
}

function __ZNSt9exceptionD2Ev(i1) {
 i1 = i1 | 0;
 return;
}

function __ZNSt9bad_allocD2Ev(i1) {
 i1 = i1 | 0;
 return;
}

function stackRestore(i1) {
 i1 = i1 | 0;
 STACKTOP = i1;
}

function __ZdlPv(i1) {
 i1 = i1 | 0;
 _free(i1);
 return;
}

function setTempRet0(i1) {
 i1 = i1 | 0;
 tempRet0 = i1;
}

function _sdsempty() {
 return _sdsnewlen(1496, 0) | 0;
}

function b6(i1) {
 i1 = i1 | 0;
 abort(6);
 return 0;
}

function getTempRet0() {
 return tempRet0 | 0;
}

function stackSave() {
 return STACKTOP | 0;
}

function b0(i1) {
 i1 = i1 | 0;
 abort(0);
}

function __ZL12null_disposev() {
 return;
}

function __ZL9null_drawv() {
 return;
}

function b10() {
 abort(10);
}

// EMSCRIPTEN_END_FUNCS
var FUNCTION_TABLE_vi = [b0,__ZL12null_messagePKc,__ZNSt9bad_allocD2Ev,__ZNSt9bad_allocD0Ev,__ZN10__cxxabiv116__shim_type_infoD2Ev,__ZN10__cxxabiv123__fundamental_type_infoD0Ev,__ZNK10__cxxabiv116__shim_type_info5noop1Ev,__ZNK10__cxxabiv116__shim_type_info5noop2Ev,__ZN10__cxxabiv117__class_type_infoD0Ev,__ZN10__cxxabiv120__si_class_type_infoD0Ev,__ZN10__cxxabiv121__vmi_class_type_infoD0Ev,__ZN10__cxxabiv119__pointer_type_infoD0Ev,_glEnable__wrapper,_glDisable__wrapper,__ZN10emscripten8internal14raw_destructorIZN32EmscriptenBindingInitializer_parC1EvE6WindowEEvPT_,__ZL4initN10emscripten3valE,__ZN10emscripten8internal7InvokerIvJEE6invokeEPFvvE,__ZL7messageN10emscripten3valE,__ZN10emscripten8internal14raw_destructorIZN32EmscriptenBindingInitializer_parC1EvE5AssetEEvPT_,__ZL6commitNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE,_message,__ZN10__cxxabiv112_GLOBAL__N_19destruct_EPv,b0,b0,b0,b0,b0,b0,b0
,b0,b0,b0];
var FUNCTION_TABLE_iiii = [b1,__ZNK10__cxxabiv123__fundamental_type_info9can_catchEPKNS_16__shim_type_infoERPv,__ZNK10__cxxabiv117__class_type_info9can_catchEPKNS_16__shim_type_infoERPv,__ZNK10__cxxabiv119__pointer_type_info9can_catchEPKNS_16__shim_type_infoERPv,_sn_write,__ZN10emscripten8internal7InvokerIiJNSt3__112basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEEiEE6invokeEPFiS8_iEPNS0_11BindingTypeIS8_EUt_Ei,b1,b1];
var FUNCTION_TABLE_viiiii = [b2,__ZNK10__cxxabiv117__class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,__ZNK10__cxxabiv120__si_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,__ZNK10__cxxabiv121__vmi_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib];
var FUNCTION_TABLE_iffff = [b3,__ZL9null_tickffff,_tick,b3];
var FUNCTION_TABLE_vii = [b4,__ZN10emscripten8internal7InvokerIvJNS_3valEEE6invokeEPFvS2_EPNS0_7_EM_VALE,__ZN10emscripten8internal7InvokerIvJNSt3__112basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEEEE6invokeEPFvS8_EPNS0_11BindingTypeIS8_EUt_E,b4];
var FUNCTION_TABLE_iiff = [b5,__ZN10emscripten8internal7InvokerIiJffEE6invokeEPFiffEff];
var FUNCTION_TABLE_ii = [b6,__ZNKSt9bad_alloc4whatEv,__ZN10emscripten8internal13getActualTypeIZN32EmscriptenBindingInitializer_parC1EvE6WindowEEPKvPT_,__ZN10emscripten8internal13getActualTypeIZN32EmscriptenBindingInitializer_parC1EvE5AssetEEPKvPT_];
var FUNCTION_TABLE_iff = [b7,__ZL4tickff];
var FUNCTION_TABLE_viifff = [b8,__ZN10emscripten8internal7InvokerIvJifffEE6invokeEPFvifffEifff];
var FUNCTION_TABLE_vfff = [b9,__ZL9null_initfff,_init,b9];
var FUNCTION_TABLE_v = [b10,__ZL9null_drawv,__ZL12null_disposev,__ZL25default_terminate_handlerv,__ZL4drawv,_draw,_dispose,__ZN10__cxxabiv112_GLOBAL__N_110construct_Ev];
var FUNCTION_TABLE_vifff = [b11,__ZL10null_input10parg_eventfff,__ZL5inputifff,_input];
var FUNCTION_TABLE_viiiiii = [b12,__ZNK10__cxxabiv117__class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,__ZNK10__cxxabiv120__si_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,__ZNK10__cxxabiv121__vmi_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib];
var FUNCTION_TABLE_iii = [b13,__ZL5allocNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEi];
var FUNCTION_TABLE_viiii = [b14,__ZNK10__cxxabiv117__class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,__ZNK10__cxxabiv120__si_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,__ZNK10__cxxabiv121__vmi_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi];

  return { _memset: _memset, ___cxa_can_catch: ___cxa_can_catch, _free: _free, _main: _main, ___cxa_is_pointer_type: ___cxa_is_pointer_type, _i64Add: _i64Add, _memmove: _memmove, _i64Subtract: _i64Subtract, _strlen: _strlen, _malloc: _malloc, _memcpy: _memcpy, ___getTypeName: ___getTypeName, _bitshift64Lshr: _bitshift64Lshr, _bitshift64Shl: _bitshift64Shl, __GLOBAL__sub_I_bindings_cpp: __GLOBAL__sub_I_bindings_cpp, __GLOBAL__sub_I_bind_cpp: __GLOBAL__sub_I_bind_cpp, runPostSets: runPostSets, _emscripten_replace_memory: _emscripten_replace_memory, stackAlloc: stackAlloc, stackSave: stackSave, stackRestore: stackRestore, setThrew: setThrew, setTempRet0: setTempRet0, getTempRet0: getTempRet0, dynCall_vi: dynCall_vi, dynCall_iiii: dynCall_iiii, dynCall_viiiii: dynCall_viiiii, dynCall_iffff: dynCall_iffff, dynCall_vii: dynCall_vii, dynCall_iiff: dynCall_iiff, dynCall_ii: dynCall_ii, dynCall_iff: dynCall_iff, dynCall_viifff: dynCall_viifff, dynCall_vfff: dynCall_vfff, dynCall_v: dynCall_v, dynCall_vifff: dynCall_vifff, dynCall_viiiiii: dynCall_viiiiii, dynCall_iii: dynCall_iii, dynCall_viiii: dynCall_viiii };
})
// EMSCRIPTEN_END_ASM
(Module.asmGlobalArg, Module.asmLibraryArg, buffer);
var _emscripten_replace_memory = Module["_emscripten_replace_memory"] = asm["_emscripten_replace_memory"];
var ___cxa_can_catch = Module["___cxa_can_catch"] = asm["___cxa_can_catch"];
var __GLOBAL__sub_I_bind_cpp = Module["__GLOBAL__sub_I_bind_cpp"] = asm["__GLOBAL__sub_I_bind_cpp"];
var _free = Module["_free"] = asm["_free"];
var _main = Module["_main"] = asm["_main"];
var ___cxa_is_pointer_type = Module["___cxa_is_pointer_type"] = asm["___cxa_is_pointer_type"];
var _i64Add = Module["_i64Add"] = asm["_i64Add"];
var _memmove = Module["_memmove"] = asm["_memmove"];
var __GLOBAL__sub_I_bindings_cpp = Module["__GLOBAL__sub_I_bindings_cpp"] = asm["__GLOBAL__sub_I_bindings_cpp"];
var _memset = Module["_memset"] = asm["_memset"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _strlen = Module["_strlen"] = asm["_strlen"];
var _bitshift64Lshr = Module["_bitshift64Lshr"] = asm["_bitshift64Lshr"];
var ___getTypeName = Module["___getTypeName"] = asm["___getTypeName"];
var _i64Subtract = Module["_i64Subtract"] = asm["_i64Subtract"];
var _bitshift64Shl = Module["_bitshift64Shl"] = asm["_bitshift64Shl"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_iffff = Module["dynCall_iffff"] = asm["dynCall_iffff"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_iiff = Module["dynCall_iiff"] = asm["dynCall_iiff"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_iff = Module["dynCall_iff"] = asm["dynCall_iff"];
var dynCall_viifff = Module["dynCall_viifff"] = asm["dynCall_viifff"];
var dynCall_vfff = Module["dynCall_vfff"] = asm["dynCall_vfff"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_vifff = Module["dynCall_vifff"] = asm["dynCall_vifff"];
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm["dynCall_viiiiii"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];
Runtime.stackAlloc = asm["stackAlloc"];
Runtime.stackSave = asm["stackSave"];
Runtime.stackRestore = asm["stackRestore"];
Runtime.setTempRet0 = asm["setTempRet0"];
Runtime.getTempRet0 = asm["getTempRet0"];
var i64Math = (function() {
 var goog = {
  math: {}
 };
 goog.math.Long = (function(low, high) {
  this.low_ = low | 0;
  this.high_ = high | 0;
 });
 goog.math.Long.IntCache_ = {};
 goog.math.Long.fromInt = (function(value) {
  if (-128 <= value && value < 128) {
   var cachedObj = goog.math.Long.IntCache_[value];
   if (cachedObj) {
    return cachedObj;
   }
  }
  var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
  if (-128 <= value && value < 128) {
   goog.math.Long.IntCache_[value] = obj;
  }
  return obj;
 });
 goog.math.Long.fromNumber = (function(value) {
  if (isNaN(value) || !isFinite(value)) {
   return goog.math.Long.ZERO;
  } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
   return goog.math.Long.MIN_VALUE;
  } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
   return goog.math.Long.MAX_VALUE;
  } else if (value < 0) {
   return goog.math.Long.fromNumber(-value).negate();
  } else {
   return new goog.math.Long(value % goog.math.Long.TWO_PWR_32_DBL_ | 0, value / goog.math.Long.TWO_PWR_32_DBL_ | 0);
  }
 });
 goog.math.Long.fromBits = (function(lowBits, highBits) {
  return new goog.math.Long(lowBits, highBits);
 });
 goog.math.Long.fromString = (function(str, opt_radix) {
  if (str.length == 0) {
   throw Error("number format error: empty string");
  }
  var radix = opt_radix || 10;
  if (radix < 2 || 36 < radix) {
   throw Error("radix out of range: " + radix);
  }
  if (str.charAt(0) == "-") {
   return goog.math.Long.fromString(str.substring(1), radix).negate();
  } else if (str.indexOf("-") >= 0) {
   throw Error('number format error: interior "-" character: ' + str);
  }
  var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));
  var result = goog.math.Long.ZERO;
  for (var i = 0; i < str.length; i += 8) {
   var size = Math.min(8, str.length - i);
   var value = parseInt(str.substring(i, i + size), radix);
   if (size < 8) {
    var power = goog.math.Long.fromNumber(Math.pow(radix, size));
    result = result.multiply(power).add(goog.math.Long.fromNumber(value));
   } else {
    result = result.multiply(radixToPower);
    result = result.add(goog.math.Long.fromNumber(value));
   }
  }
  return result;
 });
 goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;
 goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;
 goog.math.Long.TWO_PWR_32_DBL_ = goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
 goog.math.Long.TWO_PWR_31_DBL_ = goog.math.Long.TWO_PWR_32_DBL_ / 2;
 goog.math.Long.TWO_PWR_48_DBL_ = goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
 goog.math.Long.TWO_PWR_64_DBL_ = goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;
 goog.math.Long.TWO_PWR_63_DBL_ = goog.math.Long.TWO_PWR_64_DBL_ / 2;
 goog.math.Long.ZERO = goog.math.Long.fromInt(0);
 goog.math.Long.ONE = goog.math.Long.fromInt(1);
 goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);
 goog.math.Long.MAX_VALUE = goog.math.Long.fromBits(4294967295 | 0, 2147483647 | 0);
 goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 2147483648 | 0);
 goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);
 goog.math.Long.prototype.toInt = (function() {
  return this.low_;
 });
 goog.math.Long.prototype.toNumber = (function() {
  return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ + this.getLowBitsUnsigned();
 });
 goog.math.Long.prototype.toString = (function(opt_radix) {
  var radix = opt_radix || 10;
  if (radix < 2 || 36 < radix) {
   throw Error("radix out of range: " + radix);
  }
  if (this.isZero()) {
   return "0";
  }
  if (this.isNegative()) {
   if (this.equals(goog.math.Long.MIN_VALUE)) {
    var radixLong = goog.math.Long.fromNumber(radix);
    var div = this.div(radixLong);
    var rem = div.multiply(radixLong).subtract(this);
    return div.toString(radix) + rem.toInt().toString(radix);
   } else {
    return "-" + this.negate().toString(radix);
   }
  }
  var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));
  var rem = this;
  var result = "";
  while (true) {
   var remDiv = rem.div(radixToPower);
   var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
   var digits = intval.toString(radix);
   rem = remDiv;
   if (rem.isZero()) {
    return digits + result;
   } else {
    while (digits.length < 6) {
     digits = "0" + digits;
    }
    result = "" + digits + result;
   }
  }
 });
 goog.math.Long.prototype.getHighBits = (function() {
  return this.high_;
 });
 goog.math.Long.prototype.getLowBits = (function() {
  return this.low_;
 });
 goog.math.Long.prototype.getLowBitsUnsigned = (function() {
  return this.low_ >= 0 ? this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
 });
 goog.math.Long.prototype.getNumBitsAbs = (function() {
  if (this.isNegative()) {
   if (this.equals(goog.math.Long.MIN_VALUE)) {
    return 64;
   } else {
    return this.negate().getNumBitsAbs();
   }
  } else {
   var val = this.high_ != 0 ? this.high_ : this.low_;
   for (var bit = 31; bit > 0; bit--) {
    if ((val & 1 << bit) != 0) {
     break;
    }
   }
   return this.high_ != 0 ? bit + 33 : bit + 1;
  }
 });
 goog.math.Long.prototype.isZero = (function() {
  return this.high_ == 0 && this.low_ == 0;
 });
 goog.math.Long.prototype.isNegative = (function() {
  return this.high_ < 0;
 });
 goog.math.Long.prototype.isOdd = (function() {
  return (this.low_ & 1) == 1;
 });
 goog.math.Long.prototype.equals = (function(other) {
  return this.high_ == other.high_ && this.low_ == other.low_;
 });
 goog.math.Long.prototype.notEquals = (function(other) {
  return this.high_ != other.high_ || this.low_ != other.low_;
 });
 goog.math.Long.prototype.lessThan = (function(other) {
  return this.compare(other) < 0;
 });
 goog.math.Long.prototype.lessThanOrEqual = (function(other) {
  return this.compare(other) <= 0;
 });
 goog.math.Long.prototype.greaterThan = (function(other) {
  return this.compare(other) > 0;
 });
 goog.math.Long.prototype.greaterThanOrEqual = (function(other) {
  return this.compare(other) >= 0;
 });
 goog.math.Long.prototype.compare = (function(other) {
  if (this.equals(other)) {
   return 0;
  }
  var thisNeg = this.isNegative();
  var otherNeg = other.isNegative();
  if (thisNeg && !otherNeg) {
   return -1;
  }
  if (!thisNeg && otherNeg) {
   return 1;
  }
  if (this.subtract(other).isNegative()) {
   return -1;
  } else {
   return 1;
  }
 });
 goog.math.Long.prototype.negate = (function() {
  if (this.equals(goog.math.Long.MIN_VALUE)) {
   return goog.math.Long.MIN_VALUE;
  } else {
   return this.not().add(goog.math.Long.ONE);
  }
 });
 goog.math.Long.prototype.add = (function(other) {
  var a48 = this.high_ >>> 16;
  var a32 = this.high_ & 65535;
  var a16 = this.low_ >>> 16;
  var a00 = this.low_ & 65535;
  var b48 = other.high_ >>> 16;
  var b32 = other.high_ & 65535;
  var b16 = other.low_ >>> 16;
  var b00 = other.low_ & 65535;
  var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
  c00 += a00 + b00;
  c16 += c00 >>> 16;
  c00 &= 65535;
  c16 += a16 + b16;
  c32 += c16 >>> 16;
  c16 &= 65535;
  c32 += a32 + b32;
  c48 += c32 >>> 16;
  c32 &= 65535;
  c48 += a48 + b48;
  c48 &= 65535;
  return goog.math.Long.fromBits(c16 << 16 | c00, c48 << 16 | c32);
 });
 goog.math.Long.prototype.subtract = (function(other) {
  return this.add(other.negate());
 });
 goog.math.Long.prototype.multiply = (function(other) {
  if (this.isZero()) {
   return goog.math.Long.ZERO;
  } else if (other.isZero()) {
   return goog.math.Long.ZERO;
  }
  if (this.equals(goog.math.Long.MIN_VALUE)) {
   return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
  } else if (other.equals(goog.math.Long.MIN_VALUE)) {
   return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
  }
  if (this.isNegative()) {
   if (other.isNegative()) {
    return this.negate().multiply(other.negate());
   } else {
    return this.negate().multiply(other).negate();
   }
  } else if (other.isNegative()) {
   return this.multiply(other.negate()).negate();
  }
  if (this.lessThan(goog.math.Long.TWO_PWR_24_) && other.lessThan(goog.math.Long.TWO_PWR_24_)) {
   return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
  }
  var a48 = this.high_ >>> 16;
  var a32 = this.high_ & 65535;
  var a16 = this.low_ >>> 16;
  var a00 = this.low_ & 65535;
  var b48 = other.high_ >>> 16;
  var b32 = other.high_ & 65535;
  var b16 = other.low_ >>> 16;
  var b00 = other.low_ & 65535;
  var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
  c00 += a00 * b00;
  c16 += c00 >>> 16;
  c00 &= 65535;
  c16 += a16 * b00;
  c32 += c16 >>> 16;
  c16 &= 65535;
  c16 += a00 * b16;
  c32 += c16 >>> 16;
  c16 &= 65535;
  c32 += a32 * b00;
  c48 += c32 >>> 16;
  c32 &= 65535;
  c32 += a16 * b16;
  c48 += c32 >>> 16;
  c32 &= 65535;
  c32 += a00 * b32;
  c48 += c32 >>> 16;
  c32 &= 65535;
  c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
  c48 &= 65535;
  return goog.math.Long.fromBits(c16 << 16 | c00, c48 << 16 | c32);
 });
 goog.math.Long.prototype.div = (function(other) {
  if (other.isZero()) {
   throw Error("division by zero");
  } else if (this.isZero()) {
   return goog.math.Long.ZERO;
  }
  if (this.equals(goog.math.Long.MIN_VALUE)) {
   if (other.equals(goog.math.Long.ONE) || other.equals(goog.math.Long.NEG_ONE)) {
    return goog.math.Long.MIN_VALUE;
   } else if (other.equals(goog.math.Long.MIN_VALUE)) {
    return goog.math.Long.ONE;
   } else {
    var halfThis = this.shiftRight(1);
    var approx = halfThis.div(other).shiftLeft(1);
    if (approx.equals(goog.math.Long.ZERO)) {
     return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
    } else {
     var rem = this.subtract(other.multiply(approx));
     var result = approx.add(rem.div(other));
     return result;
    }
   }
  } else if (other.equals(goog.math.Long.MIN_VALUE)) {
   return goog.math.Long.ZERO;
  }
  if (this.isNegative()) {
   if (other.isNegative()) {
    return this.negate().div(other.negate());
   } else {
    return this.negate().div(other).negate();
   }
  } else if (other.isNegative()) {
   return this.div(other.negate()).negate();
  }
  var res = goog.math.Long.ZERO;
  var rem = this;
  while (rem.greaterThanOrEqual(other)) {
   var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));
   var log2 = Math.ceil(Math.log(approx) / Math.LN2);
   var delta = log2 <= 48 ? 1 : Math.pow(2, log2 - 48);
   var approxRes = goog.math.Long.fromNumber(approx);
   var approxRem = approxRes.multiply(other);
   while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
    approx -= delta;
    approxRes = goog.math.Long.fromNumber(approx);
    approxRem = approxRes.multiply(other);
   }
   if (approxRes.isZero()) {
    approxRes = goog.math.Long.ONE;
   }
   res = res.add(approxRes);
   rem = rem.subtract(approxRem);
  }
  return res;
 });
 goog.math.Long.prototype.modulo = (function(other) {
  return this.subtract(this.div(other).multiply(other));
 });
 goog.math.Long.prototype.not = (function() {
  return goog.math.Long.fromBits(~this.low_, ~this.high_);
 });
 goog.math.Long.prototype.and = (function(other) {
  return goog.math.Long.fromBits(this.low_ & other.low_, this.high_ & other.high_);
 });
 goog.math.Long.prototype.or = (function(other) {
  return goog.math.Long.fromBits(this.low_ | other.low_, this.high_ | other.high_);
 });
 goog.math.Long.prototype.xor = (function(other) {
  return goog.math.Long.fromBits(this.low_ ^ other.low_, this.high_ ^ other.high_);
 });
 goog.math.Long.prototype.shiftLeft = (function(numBits) {
  numBits &= 63;
  if (numBits == 0) {
   return this;
  } else {
   var low = this.low_;
   if (numBits < 32) {
    var high = this.high_;
    return goog.math.Long.fromBits(low << numBits, high << numBits | low >>> 32 - numBits);
   } else {
    return goog.math.Long.fromBits(0, low << numBits - 32);
   }
  }
 });
 goog.math.Long.prototype.shiftRight = (function(numBits) {
  numBits &= 63;
  if (numBits == 0) {
   return this;
  } else {
   var high = this.high_;
   if (numBits < 32) {
    var low = this.low_;
    return goog.math.Long.fromBits(low >>> numBits | high << 32 - numBits, high >> numBits);
   } else {
    return goog.math.Long.fromBits(high >> numBits - 32, high >= 0 ? 0 : -1);
   }
  }
 });
 goog.math.Long.prototype.shiftRightUnsigned = (function(numBits) {
  numBits &= 63;
  if (numBits == 0) {
   return this;
  } else {
   var high = this.high_;
   if (numBits < 32) {
    var low = this.low_;
    return goog.math.Long.fromBits(low >>> numBits | high << 32 - numBits, high >>> numBits);
   } else if (numBits == 32) {
    return goog.math.Long.fromBits(high, 0);
   } else {
    return goog.math.Long.fromBits(high >>> numBits - 32, 0);
   }
  }
 });
 var navigator = {
  appName: "Modern Browser"
 };
 var dbits;
 var canary = 0xdeadbeefcafe;
 var j_lm = (canary & 16777215) == 15715070;
 function BigInteger(a, b, c) {
  if (a != null) if ("number" == typeof a) this.fromNumber(a, b, c); else if (b == null && "string" != typeof a) this.fromString(a, 256); else this.fromString(a, b);
 }
 function nbi() {
  return new BigInteger(null);
 }
 function am1(i, x, w, j, c, n) {
  while (--n >= 0) {
   var v = x * this[i++] + w[j] + c;
   c = Math.floor(v / 67108864);
   w[j++] = v & 67108863;
  }
  return c;
 }
 function am2(i, x, w, j, c, n) {
  var xl = x & 32767, xh = x >> 15;
  while (--n >= 0) {
   var l = this[i] & 32767;
   var h = this[i++] >> 15;
   var m = xh * l + h * xl;
   l = xl * l + ((m & 32767) << 15) + w[j] + (c & 1073741823);
   c = (l >>> 30) + (m >>> 15) + xh * h + (c >>> 30);
   w[j++] = l & 1073741823;
  }
  return c;
 }
 function am3(i, x, w, j, c, n) {
  var xl = x & 16383, xh = x >> 14;
  while (--n >= 0) {
   var l = this[i] & 16383;
   var h = this[i++] >> 14;
   var m = xh * l + h * xl;
   l = xl * l + ((m & 16383) << 14) + w[j] + c;
   c = (l >> 28) + (m >> 14) + xh * h;
   w[j++] = l & 268435455;
  }
  return c;
 }
 if (j_lm && navigator.appName == "Microsoft Internet Explorer") {
  BigInteger.prototype.am = am2;
  dbits = 30;
 } else if (j_lm && navigator.appName != "Netscape") {
  BigInteger.prototype.am = am1;
  dbits = 26;
 } else {
  BigInteger.prototype.am = am3;
  dbits = 28;
 }
 BigInteger.prototype.DB = dbits;
 BigInteger.prototype.DM = (1 << dbits) - 1;
 BigInteger.prototype.DV = 1 << dbits;
 var BI_FP = 52;
 BigInteger.prototype.FV = Math.pow(2, BI_FP);
 BigInteger.prototype.F1 = BI_FP - dbits;
 BigInteger.prototype.F2 = 2 * dbits - BI_FP;
 var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
 var BI_RC = new Array;
 var rr, vv;
 rr = "0".charCodeAt(0);
 for (vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
 rr = "a".charCodeAt(0);
 for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
 rr = "A".charCodeAt(0);
 for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
 function int2char(n) {
  return BI_RM.charAt(n);
 }
 function intAt(s, i) {
  var c = BI_RC[s.charCodeAt(i)];
  return c == null ? -1 : c;
 }
 function bnpCopyTo(r) {
  for (var i = this.t - 1; i >= 0; --i) r[i] = this[i];
  r.t = this.t;
  r.s = this.s;
 }
 function bnpFromInt(x) {
  this.t = 1;
  this.s = x < 0 ? -1 : 0;
  if (x > 0) this[0] = x; else if (x < -1) this[0] = x + DV; else this.t = 0;
 }
 function nbv(i) {
  var r = nbi();
  r.fromInt(i);
  return r;
 }
 function bnpFromString(s, b) {
  var k;
  if (b == 16) k = 4; else if (b == 8) k = 3; else if (b == 256) k = 8; else if (b == 2) k = 1; else if (b == 32) k = 5; else if (b == 4) k = 2; else {
   this.fromRadix(s, b);
   return;
  }
  this.t = 0;
  this.s = 0;
  var i = s.length, mi = false, sh = 0;
  while (--i >= 0) {
   var x = k == 8 ? s[i] & 255 : intAt(s, i);
   if (x < 0) {
    if (s.charAt(i) == "-") mi = true;
    continue;
   }
   mi = false;
   if (sh == 0) this[this.t++] = x; else if (sh + k > this.DB) {
    this[this.t - 1] |= (x & (1 << this.DB - sh) - 1) << sh;
    this[this.t++] = x >> this.DB - sh;
   } else this[this.t - 1] |= x << sh;
   sh += k;
   if (sh >= this.DB) sh -= this.DB;
  }
  if (k == 8 && (s[0] & 128) != 0) {
   this.s = -1;
   if (sh > 0) this[this.t - 1] |= (1 << this.DB - sh) - 1 << sh;
  }
  this.clamp();
  if (mi) BigInteger.ZERO.subTo(this, this);
 }
 function bnpClamp() {
  var c = this.s & this.DM;
  while (this.t > 0 && this[this.t - 1] == c) --this.t;
 }
 function bnToString(b) {
  if (this.s < 0) return "-" + this.negate().toString(b);
  var k;
  if (b == 16) k = 4; else if (b == 8) k = 3; else if (b == 2) k = 1; else if (b == 32) k = 5; else if (b == 4) k = 2; else return this.toRadix(b);
  var km = (1 << k) - 1, d, m = false, r = "", i = this.t;
  var p = this.DB - i * this.DB % k;
  if (i-- > 0) {
   if (p < this.DB && (d = this[i] >> p) > 0) {
    m = true;
    r = int2char(d);
   }
   while (i >= 0) {
    if (p < k) {
     d = (this[i] & (1 << p) - 1) << k - p;
     d |= this[--i] >> (p += this.DB - k);
    } else {
     d = this[i] >> (p -= k) & km;
     if (p <= 0) {
      p += this.DB;
      --i;
     }
    }
    if (d > 0) m = true;
    if (m) r += int2char(d);
   }
  }
  return m ? r : "0";
 }
 function bnNegate() {
  var r = nbi();
  BigInteger.ZERO.subTo(this, r);
  return r;
 }
 function bnAbs() {
  return this.s < 0 ? this.negate() : this;
 }
 function bnCompareTo(a) {
  var r = this.s - a.s;
  if (r != 0) return r;
  var i = this.t;
  r = i - a.t;
  if (r != 0) return this.s < 0 ? -r : r;
  while (--i >= 0) if ((r = this[i] - a[i]) != 0) return r;
  return 0;
 }
 function nbits(x) {
  var r = 1, t;
  if ((t = x >>> 16) != 0) {
   x = t;
   r += 16;
  }
  if ((t = x >> 8) != 0) {
   x = t;
   r += 8;
  }
  if ((t = x >> 4) != 0) {
   x = t;
   r += 4;
  }
  if ((t = x >> 2) != 0) {
   x = t;
   r += 2;
  }
  if ((t = x >> 1) != 0) {
   x = t;
   r += 1;
  }
  return r;
 }
 function bnBitLength() {
  if (this.t <= 0) return 0;
  return this.DB * (this.t - 1) + nbits(this[this.t - 1] ^ this.s & this.DM);
 }
 function bnpDLShiftTo(n, r) {
  var i;
  for (i = this.t - 1; i >= 0; --i) r[i + n] = this[i];
  for (i = n - 1; i >= 0; --i) r[i] = 0;
  r.t = this.t + n;
  r.s = this.s;
 }
 function bnpDRShiftTo(n, r) {
  for (var i = n; i < this.t; ++i) r[i - n] = this[i];
  r.t = Math.max(this.t - n, 0);
  r.s = this.s;
 }
 function bnpLShiftTo(n, r) {
  var bs = n % this.DB;
  var cbs = this.DB - bs;
  var bm = (1 << cbs) - 1;
  var ds = Math.floor(n / this.DB), c = this.s << bs & this.DM, i;
  for (i = this.t - 1; i >= 0; --i) {
   r[i + ds + 1] = this[i] >> cbs | c;
   c = (this[i] & bm) << bs;
  }
  for (i = ds - 1; i >= 0; --i) r[i] = 0;
  r[ds] = c;
  r.t = this.t + ds + 1;
  r.s = this.s;
  r.clamp();
 }
 function bnpRShiftTo(n, r) {
  r.s = this.s;
  var ds = Math.floor(n / this.DB);
  if (ds >= this.t) {
   r.t = 0;
   return;
  }
  var bs = n % this.DB;
  var cbs = this.DB - bs;
  var bm = (1 << bs) - 1;
  r[0] = this[ds] >> bs;
  for (var i = ds + 1; i < this.t; ++i) {
   r[i - ds - 1] |= (this[i] & bm) << cbs;
   r[i - ds] = this[i] >> bs;
  }
  if (bs > 0) r[this.t - ds - 1] |= (this.s & bm) << cbs;
  r.t = this.t - ds;
  r.clamp();
 }
 function bnpSubTo(a, r) {
  var i = 0, c = 0, m = Math.min(a.t, this.t);
  while (i < m) {
   c += this[i] - a[i];
   r[i++] = c & this.DM;
   c >>= this.DB;
  }
  if (a.t < this.t) {
   c -= a.s;
   while (i < this.t) {
    c += this[i];
    r[i++] = c & this.DM;
    c >>= this.DB;
   }
   c += this.s;
  } else {
   c += this.s;
   while (i < a.t) {
    c -= a[i];
    r[i++] = c & this.DM;
    c >>= this.DB;
   }
   c -= a.s;
  }
  r.s = c < 0 ? -1 : 0;
  if (c < -1) r[i++] = this.DV + c; else if (c > 0) r[i++] = c;
  r.t = i;
  r.clamp();
 }
 function bnpMultiplyTo(a, r) {
  var x = this.abs(), y = a.abs();
  var i = x.t;
  r.t = i + y.t;
  while (--i >= 0) r[i] = 0;
  for (i = 0; i < y.t; ++i) r[i + x.t] = x.am(0, y[i], r, i, 0, x.t);
  r.s = 0;
  r.clamp();
  if (this.s != a.s) BigInteger.ZERO.subTo(r, r);
 }
 function bnpSquareTo(r) {
  var x = this.abs();
  var i = r.t = 2 * x.t;
  while (--i >= 0) r[i] = 0;
  for (i = 0; i < x.t - 1; ++i) {
   var c = x.am(i, x[i], r, 2 * i, 0, 1);
   if ((r[i + x.t] += x.am(i + 1, 2 * x[i], r, 2 * i + 1, c, x.t - i - 1)) >= x.DV) {
    r[i + x.t] -= x.DV;
    r[i + x.t + 1] = 1;
   }
  }
  if (r.t > 0) r[r.t - 1] += x.am(i, x[i], r, 2 * i, 0, 1);
  r.s = 0;
  r.clamp();
 }
 function bnpDivRemTo(m, q, r) {
  var pm = m.abs();
  if (pm.t <= 0) return;
  var pt = this.abs();
  if (pt.t < pm.t) {
   if (q != null) q.fromInt(0);
   if (r != null) this.copyTo(r);
   return;
  }
  if (r == null) r = nbi();
  var y = nbi(), ts = this.s, ms = m.s;
  var nsh = this.DB - nbits(pm[pm.t - 1]);
  if (nsh > 0) {
   pm.lShiftTo(nsh, y);
   pt.lShiftTo(nsh, r);
  } else {
   pm.copyTo(y);
   pt.copyTo(r);
  }
  var ys = y.t;
  var y0 = y[ys - 1];
  if (y0 == 0) return;
  var yt = y0 * (1 << this.F1) + (ys > 1 ? y[ys - 2] >> this.F2 : 0);
  var d1 = this.FV / yt, d2 = (1 << this.F1) / yt, e = 1 << this.F2;
  var i = r.t, j = i - ys, t = q == null ? nbi() : q;
  y.dlShiftTo(j, t);
  if (r.compareTo(t) >= 0) {
   r[r.t++] = 1;
   r.subTo(t, r);
  }
  BigInteger.ONE.dlShiftTo(ys, t);
  t.subTo(y, y);
  while (y.t < ys) y[y.t++] = 0;
  while (--j >= 0) {
   var qd = r[--i] == y0 ? this.DM : Math.floor(r[i] * d1 + (r[i - 1] + e) * d2);
   if ((r[i] += y.am(0, qd, r, j, 0, ys)) < qd) {
    y.dlShiftTo(j, t);
    r.subTo(t, r);
    while (r[i] < --qd) r.subTo(t, r);
   }
  }
  if (q != null) {
   r.drShiftTo(ys, q);
   if (ts != ms) BigInteger.ZERO.subTo(q, q);
  }
  r.t = ys;
  r.clamp();
  if (nsh > 0) r.rShiftTo(nsh, r);
  if (ts < 0) BigInteger.ZERO.subTo(r, r);
 }
 function bnMod(a) {
  var r = nbi();
  this.abs().divRemTo(a, null, r);
  if (this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r, r);
  return r;
 }
 function Classic(m) {
  this.m = m;
 }
 function cConvert(x) {
  if (x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m); else return x;
 }
 function cRevert(x) {
  return x;
 }
 function cReduce(x) {
  x.divRemTo(this.m, null, x);
 }
 function cMulTo(x, y, r) {
  x.multiplyTo(y, r);
  this.reduce(r);
 }
 function cSqrTo(x, r) {
  x.squareTo(r);
  this.reduce(r);
 }
 Classic.prototype.convert = cConvert;
 Classic.prototype.revert = cRevert;
 Classic.prototype.reduce = cReduce;
 Classic.prototype.mulTo = cMulTo;
 Classic.prototype.sqrTo = cSqrTo;
 function bnpInvDigit() {
  if (this.t < 1) return 0;
  var x = this[0];
  if ((x & 1) == 0) return 0;
  var y = x & 3;
  y = y * (2 - (x & 15) * y) & 15;
  y = y * (2 - (x & 255) * y) & 255;
  y = y * (2 - ((x & 65535) * y & 65535)) & 65535;
  y = y * (2 - x * y % this.DV) % this.DV;
  return y > 0 ? this.DV - y : -y;
 }
 function Montgomery(m) {
  this.m = m;
  this.mp = m.invDigit();
  this.mpl = this.mp & 32767;
  this.mph = this.mp >> 15;
  this.um = (1 << m.DB - 15) - 1;
  this.mt2 = 2 * m.t;
 }
 function montConvert(x) {
  var r = nbi();
  x.abs().dlShiftTo(this.m.t, r);
  r.divRemTo(this.m, null, r);
  if (x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r, r);
  return r;
 }
 function montRevert(x) {
  var r = nbi();
  x.copyTo(r);
  this.reduce(r);
  return r;
 }
 function montReduce(x) {
  while (x.t <= this.mt2) x[x.t++] = 0;
  for (var i = 0; i < this.m.t; ++i) {
   var j = x[i] & 32767;
   var u0 = j * this.mpl + ((j * this.mph + (x[i] >> 15) * this.mpl & this.um) << 15) & x.DM;
   j = i + this.m.t;
   x[j] += this.m.am(0, u0, x, i, 0, this.m.t);
   while (x[j] >= x.DV) {
    x[j] -= x.DV;
    x[++j]++;
   }
  }
  x.clamp();
  x.drShiftTo(this.m.t, x);
  if (x.compareTo(this.m) >= 0) x.subTo(this.m, x);
 }
 function montSqrTo(x, r) {
  x.squareTo(r);
  this.reduce(r);
 }
 function montMulTo(x, y, r) {
  x.multiplyTo(y, r);
  this.reduce(r);
 }
 Montgomery.prototype.convert = montConvert;
 Montgomery.prototype.revert = montRevert;
 Montgomery.prototype.reduce = montReduce;
 Montgomery.prototype.mulTo = montMulTo;
 Montgomery.prototype.sqrTo = montSqrTo;
 function bnpIsEven() {
  return (this.t > 0 ? this[0] & 1 : this.s) == 0;
 }
 function bnpExp(e, z) {
  if (e > 4294967295 || e < 1) return BigInteger.ONE;
  var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e) - 1;
  g.copyTo(r);
  while (--i >= 0) {
   z.sqrTo(r, r2);
   if ((e & 1 << i) > 0) z.mulTo(r2, g, r); else {
    var t = r;
    r = r2;
    r2 = t;
   }
  }
  return z.revert(r);
 }
 function bnModPowInt(e, m) {
  var z;
  if (e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
  return this.exp(e, z);
 }
 BigInteger.prototype.copyTo = bnpCopyTo;
 BigInteger.prototype.fromInt = bnpFromInt;
 BigInteger.prototype.fromString = bnpFromString;
 BigInteger.prototype.clamp = bnpClamp;
 BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
 BigInteger.prototype.drShiftTo = bnpDRShiftTo;
 BigInteger.prototype.lShiftTo = bnpLShiftTo;
 BigInteger.prototype.rShiftTo = bnpRShiftTo;
 BigInteger.prototype.subTo = bnpSubTo;
 BigInteger.prototype.multiplyTo = bnpMultiplyTo;
 BigInteger.prototype.squareTo = bnpSquareTo;
 BigInteger.prototype.divRemTo = bnpDivRemTo;
 BigInteger.prototype.invDigit = bnpInvDigit;
 BigInteger.prototype.isEven = bnpIsEven;
 BigInteger.prototype.exp = bnpExp;
 BigInteger.prototype.toString = bnToString;
 BigInteger.prototype.negate = bnNegate;
 BigInteger.prototype.abs = bnAbs;
 BigInteger.prototype.compareTo = bnCompareTo;
 BigInteger.prototype.bitLength = bnBitLength;
 BigInteger.prototype.mod = bnMod;
 BigInteger.prototype.modPowInt = bnModPowInt;
 BigInteger.ZERO = nbv(0);
 BigInteger.ONE = nbv(1);
 function bnpFromRadix(s, b) {
  this.fromInt(0);
  if (b == null) b = 10;
  var cs = this.chunkSize(b);
  var d = Math.pow(b, cs), mi = false, j = 0, w = 0;
  for (var i = 0; i < s.length; ++i) {
   var x = intAt(s, i);
   if (x < 0) {
    if (s.charAt(i) == "-" && this.signum() == 0) mi = true;
    continue;
   }
   w = b * w + x;
   if (++j >= cs) {
    this.dMultiply(d);
    this.dAddOffset(w, 0);
    j = 0;
    w = 0;
   }
  }
  if (j > 0) {
   this.dMultiply(Math.pow(b, j));
   this.dAddOffset(w, 0);
  }
  if (mi) BigInteger.ZERO.subTo(this, this);
 }
 function bnpChunkSize(r) {
  return Math.floor(Math.LN2 * this.DB / Math.log(r));
 }
 function bnSigNum() {
  if (this.s < 0) return -1; else if (this.t <= 0 || this.t == 1 && this[0] <= 0) return 0; else return 1;
 }
 function bnpDMultiply(n) {
  this[this.t] = this.am(0, n - 1, this, 0, 0, this.t);
  ++this.t;
  this.clamp();
 }
 function bnpDAddOffset(n, w) {
  if (n == 0) return;
  while (this.t <= w) this[this.t++] = 0;
  this[w] += n;
  while (this[w] >= this.DV) {
   this[w] -= this.DV;
   if (++w >= this.t) this[this.t++] = 0;
   ++this[w];
  }
 }
 function bnpToRadix(b) {
  if (b == null) b = 10;
  if (this.signum() == 0 || b < 2 || b > 36) return "0";
  var cs = this.chunkSize(b);
  var a = Math.pow(b, cs);
  var d = nbv(a), y = nbi(), z = nbi(), r = "";
  this.divRemTo(d, y, z);
  while (y.signum() > 0) {
   r = (a + z.intValue()).toString(b).substr(1) + r;
   y.divRemTo(d, y, z);
  }
  return z.intValue().toString(b) + r;
 }
 function bnIntValue() {
  if (this.s < 0) {
   if (this.t == 1) return this[0] - this.DV; else if (this.t == 0) return -1;
  } else if (this.t == 1) return this[0]; else if (this.t == 0) return 0;
  return (this[1] & (1 << 32 - this.DB) - 1) << this.DB | this[0];
 }
 function bnpAddTo(a, r) {
  var i = 0, c = 0, m = Math.min(a.t, this.t);
  while (i < m) {
   c += this[i] + a[i];
   r[i++] = c & this.DM;
   c >>= this.DB;
  }
  if (a.t < this.t) {
   c += a.s;
   while (i < this.t) {
    c += this[i];
    r[i++] = c & this.DM;
    c >>= this.DB;
   }
   c += this.s;
  } else {
   c += this.s;
   while (i < a.t) {
    c += a[i];
    r[i++] = c & this.DM;
    c >>= this.DB;
   }
   c += a.s;
  }
  r.s = c < 0 ? -1 : 0;
  if (c > 0) r[i++] = c; else if (c < -1) r[i++] = this.DV + c;
  r.t = i;
  r.clamp();
 }
 BigInteger.prototype.fromRadix = bnpFromRadix;
 BigInteger.prototype.chunkSize = bnpChunkSize;
 BigInteger.prototype.signum = bnSigNum;
 BigInteger.prototype.dMultiply = bnpDMultiply;
 BigInteger.prototype.dAddOffset = bnpDAddOffset;
 BigInteger.prototype.toRadix = bnpToRadix;
 BigInteger.prototype.intValue = bnIntValue;
 BigInteger.prototype.addTo = bnpAddTo;
 var Wrapper = {
  abs: (function(l, h) {
   var x = new goog.math.Long(l, h);
   var ret;
   if (x.isNegative()) {
    ret = x.negate();
   } else {
    ret = x;
   }
   HEAP32[tempDoublePtr >> 2] = ret.low_;
   HEAP32[tempDoublePtr + 4 >> 2] = ret.high_;
  }),
  ensureTemps: (function() {
   if (Wrapper.ensuredTemps) return;
   Wrapper.ensuredTemps = true;
   Wrapper.two32 = new BigInteger;
   Wrapper.two32.fromString("4294967296", 10);
   Wrapper.two64 = new BigInteger;
   Wrapper.two64.fromString("18446744073709551616", 10);
   Wrapper.temp1 = new BigInteger;
   Wrapper.temp2 = new BigInteger;
  }),
  lh2bignum: (function(l, h) {
   var a = new BigInteger;
   a.fromString(h.toString(), 10);
   var b = new BigInteger;
   a.multiplyTo(Wrapper.two32, b);
   var c = new BigInteger;
   c.fromString(l.toString(), 10);
   var d = new BigInteger;
   c.addTo(b, d);
   return d;
  }),
  stringify: (function(l, h, unsigned) {
   var ret = (new goog.math.Long(l, h)).toString();
   if (unsigned && ret[0] == "-") {
    Wrapper.ensureTemps();
    var bignum = new BigInteger;
    bignum.fromString(ret, 10);
    ret = new BigInteger;
    Wrapper.two64.addTo(bignum, ret);
    ret = ret.toString(10);
   }
   return ret;
  }),
  fromString: (function(str, base, min, max, unsigned) {
   Wrapper.ensureTemps();
   var bignum = new BigInteger;
   bignum.fromString(str, base);
   var bigmin = new BigInteger;
   bigmin.fromString(min, 10);
   var bigmax = new BigInteger;
   bigmax.fromString(max, 10);
   if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
    var temp = new BigInteger;
    bignum.addTo(Wrapper.two64, temp);
    bignum = temp;
   }
   var error = false;
   if (bignum.compareTo(bigmin) < 0) {
    bignum = bigmin;
    error = true;
   } else if (bignum.compareTo(bigmax) > 0) {
    bignum = bigmax;
    error = true;
   }
   var ret = goog.math.Long.fromString(bignum.toString());
   HEAP32[tempDoublePtr >> 2] = ret.low_;
   HEAP32[tempDoublePtr + 4 >> 2] = ret.high_;
   if (error) throw "range error";
  })
 };
 return Wrapper;
})();
if (memoryInitializer) {
 if (typeof Module["locateFile"] === "function") {
  memoryInitializer = Module["locateFile"](memoryInitializer);
 } else if (Module["memoryInitializerPrefixURL"]) {
  memoryInitializer = Module["memoryInitializerPrefixURL"] + memoryInitializer;
 }
 if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
  var data = Module["readBinary"](memoryInitializer);
  HEAPU8.set(data, STATIC_BASE);
 } else {
  addRunDependency("memory initializer");
  var applyMemoryInitializer = (function(data) {
   if (data.byteLength) data = new Uint8Array(data);
   HEAPU8.set(data, STATIC_BASE);
   removeRunDependency("memory initializer");
  });
  var request = Module["memoryInitializerRequest"];
  if (request) {
   if (request.response) {
    setTimeout((function() {
     applyMemoryInitializer(request.response);
    }), 0);
   } else {
    request.addEventListener("load", (function() {
     if (request.status !== 200 && request.status !== 0) {
      console.warn("a problem seems to have happened with Module.memoryInitializerRequest, status: " + request.status);
     }
     if (!request.response || typeof request.response !== "object" || !request.response.byteLength) {
      console.warn("a problem seems to have happened with Module.memoryInitializerRequest response (expected ArrayBuffer): " + request.response);
     }
     applyMemoryInitializer(request.response);
    }));
   }
  } else {
   Browser.asyncLoad(memoryInitializer, applyMemoryInitializer, (function() {
    throw "could not load memory initializer " + memoryInitializer;
   }));
  }
 }
}
function ExitStatus(status) {
 this.name = "ExitStatus";
 this.message = "Program terminated with exit(" + status + ")";
 this.status = status;
}
ExitStatus.prototype = new Error;
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
dependenciesFulfilled = function runCaller() {
 if (!Module["calledRun"]) run();
 if (!Module["calledRun"]) dependenciesFulfilled = runCaller;
};
Module["callMain"] = Module.callMain = function callMain(args) {
 assert(runDependencies == 0, "cannot call main when async dependencies remain! (listen on __ATMAIN__)");
 assert(__ATPRERUN__.length == 0, "cannot call main when preRun functions remain to be called");
 args = args || [];
 ensureInitRuntime();
 var argc = args.length + 1;
 function pad() {
  for (var i = 0; i < 4 - 1; i++) {
   argv.push(0);
  }
 }
 var argv = [ allocate(intArrayFromString(Module["thisProgram"]), "i8", ALLOC_NORMAL) ];
 pad();
 for (var i = 0; i < argc - 1; i = i + 1) {
  argv.push(allocate(intArrayFromString(args[i]), "i8", ALLOC_NORMAL));
  pad();
 }
 argv.push(0);
 argv = allocate(argv, "i32", ALLOC_NORMAL);
 initialStackTop = STACKTOP;
 try {
  var ret = Module["_main"](argc, argv, 0);
  exit(ret, true);
 } catch (e) {
  if (e instanceof ExitStatus) {
   return;
  } else if (e == "SimulateInfiniteLoop") {
   Module["noExitRuntime"] = true;
   return;
  } else {
   if (e && typeof e === "object" && e.stack) Module.printErr("exception thrown: " + [ e, e.stack ]);
   throw e;
  }
 } finally {
  calledMain = true;
 }
};
function run(args) {
 args = args || Module["arguments"];
 if (preloadStartTime === null) preloadStartTime = Date.now();
 if (runDependencies > 0) {
  return;
 }
 preRun();
 if (runDependencies > 0) return;
 if (Module["calledRun"]) return;
 function doRun() {
  if (Module["calledRun"]) return;
  Module["calledRun"] = true;
  if (ABORT) return;
  ensureInitRuntime();
  preMain();
  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
   Module.printErr("pre-main prep time: " + (Date.now() - preloadStartTime) + " ms");
  }
  if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
  if (Module["_main"] && shouldRunNow) Module["callMain"](args);
  postRun();
 }
 if (Module["setStatus"]) {
  Module["setStatus"]("Running...");
  setTimeout((function() {
   setTimeout((function() {
    Module["setStatus"]("");
   }), 1);
   doRun();
  }), 1);
 } else {
  doRun();
 }
}
Module["run"] = Module.run = run;
function exit(status, implicit) {
 if (implicit && Module["noExitRuntime"]) {
  return;
 }
 if (Module["noExitRuntime"]) {} else {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;
  exitRuntime();
  if (Module["onExit"]) Module["onExit"](status);
 }
 if (ENVIRONMENT_IS_NODE) {
  process["stdout"]["once"]("drain", (function() {
   process["exit"](status);
  }));
  console.log(" ");
  setTimeout((function() {
   process["exit"](status);
  }), 500);
 } else if (ENVIRONMENT_IS_SHELL && typeof quit === "function") {
  quit(status);
 }
 throw new ExitStatus(status);
}
Module["exit"] = Module.exit = exit;
var abortDecorators = [];
function abort(what) {
 if (what !== undefined) {
  Module.print(what);
  Module.printErr(what);
  what = JSON.stringify(what);
 } else {
  what = "";
 }
 ABORT = true;
 EXITSTATUS = 1;
 var extra = "\nIf this abort() is unexpected, build with -s ASSERTIONS=1 which can give more information.";
 var output = "abort(" + what + ") at " + stackTrace() + extra;
 if (abortDecorators) {
  abortDecorators.forEach((function(decorator) {
   output = decorator(output, what);
  }));
 }
 throw output;
}
Module["abort"] = Module.abort = abort;
if (Module["preInit"]) {
 if (typeof Module["preInit"] == "function") Module["preInit"] = [ Module["preInit"] ];
 while (Module["preInit"].length > 0) {
  Module["preInit"].pop()();
 }
}
var shouldRunNow = true;
if (Module["noInitialRun"]) {
 shouldRunNow = false;
}
run();





  return Module;
};
