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
var ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
var ENVIRONMENT_IS_NODE = typeof process === "object" && typeof require === "function" && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
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
Module["ccall"] = ccall;
Module["cwrap"] = cwrap;
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
 if (typeof _sbrk !== "undefined" && !_sbrk.called || !runtimeInitialized) return Runtime.dynamicAlloc(size);
 return _malloc(size);
}
Module["getMemory"] = getMemory;
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
var buffer;
buffer = new ArrayBuffer(TOTAL_MEMORY);
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
Module["addOnPreRun"] = addOnPreRun;
function addOnInit(cb) {
 __ATINIT__.unshift(cb);
}
Module["addOnInit"] = addOnInit;
function addOnPreMain(cb) {
 __ATMAIN__.unshift(cb);
}
Module["addOnPreMain"] = addOnPreMain;
function addOnExit(cb) {
 __ATEXIT__.unshift(cb);
}
Module["addOnExit"] = addOnExit;
function addOnPostRun(cb) {
 __ATPOSTRUN__.unshift(cb);
}
Module["addOnPostRun"] = addOnPostRun;
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
  Module.par_window_dims = [];
  Module.par_window_dims[0] = $0;
  Module.par_window_dims[1] = $1;
 }
}) ];
function _emscripten_asm_const_2(code, a0, a1) {
 return ASM_CONSTS[code](a0, a1) | 0;
}
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 11440;
__ATINIT__.push({
 func: (function() {
  __GLOBAL__sub_I_bindings_cpp();
 })
}, {
 func: (function() {
  __GLOBAL__sub_I_bind_cpp();
 })
});
allocate([ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 228, 10, 0, 0, 217, 21, 0, 0, 92, 11, 0, 0, 167, 21, 0, 0, 0, 0, 0, 0, 232, 0, 0, 0, 92, 11, 0, 0, 116, 21, 0, 0, 1, 0, 0, 0, 232, 0, 0, 0, 228, 10, 0, 0, 35, 21, 0, 0, 92, 11, 0, 0, 242, 20, 0, 0, 0, 0, 0, 0, 16, 1, 0, 0, 92, 11, 0, 0, 192, 20, 0, 0, 1, 0, 0, 0, 16, 1, 0, 0, 52, 11, 0, 0, 63, 20, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 80, 1, 0, 0, 0, 0, 0, 0, 228, 10, 0, 0, 126, 20, 0, 0, 228, 10, 0, 0, 97, 21, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 52, 11, 0, 0, 206, 27, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 80, 1, 0, 0, 0, 0, 0, 0, 52, 11, 0, 0, 143, 27, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 80, 1, 0, 0, 0, 0, 0, 0, 228, 10, 0, 0, 112, 27, 0, 0, 228, 10, 0, 0, 81, 27, 0, 0, 228, 10, 0, 0, 50, 27, 0, 0, 228, 10, 0, 0, 19, 27, 0, 0, 228, 10, 0, 0, 244, 26, 0, 0, 228, 10, 0, 0, 213, 26, 0, 0, 228, 10, 0, 0, 182, 26, 0, 0, 228, 10, 0, 0, 151, 26, 0, 0, 228, 10, 0, 0, 120, 26, 0, 0, 228, 10, 0, 0, 89, 26, 0, 0, 228, 10, 0, 0, 58, 26, 0, 0, 228, 10, 0, 0, 27, 26, 0, 0, 12, 11, 0, 0, 13, 28, 0, 0, 32, 2, 0, 0, 0, 0, 0, 0, 228, 10, 0, 0, 26, 28, 0, 0, 228, 10, 0, 0, 39, 28, 0, 0, 12, 11, 0, 0, 52, 28, 0, 0, 40, 2, 0, 0, 0, 0, 0, 0, 12, 11, 0, 0, 85, 28, 0, 0, 48, 2, 0, 0, 0, 0, 0, 0, 12, 11, 0, 0, 155, 28, 0, 0, 48, 2, 0, 0, 0, 0, 0, 0, 12, 11, 0, 0, 119, 28, 0, 0, 80, 2, 0, 0, 0, 0, 0, 0, 12, 11, 0, 0, 189, 28, 0, 0, 48, 2, 0, 0, 0, 0, 0, 0, 200, 10, 0, 0, 229, 28, 0, 0, 200, 10, 0, 0, 231, 28, 0, 0, 200, 10, 0, 0, 234, 28, 0, 0, 200, 10, 0, 0, 236, 28, 0, 0, 200, 10, 0, 0, 238, 28, 0, 0, 200, 10, 0, 0, 240, 28, 0, 0, 200, 10, 0, 0, 242, 28, 0, 0, 200, 10, 0, 0, 244, 28, 0, 0, 200, 10, 0, 0, 246, 28, 0, 0, 200, 10, 0, 0, 248, 28, 0, 0, 200, 10, 0, 0, 250, 28, 0, 0, 200, 10, 0, 0, 252, 28, 0, 0, 200, 10, 0, 0, 254, 28, 0, 0, 200, 10, 0, 0, 0, 29, 0, 0, 12, 11, 0, 0, 2, 29, 0, 0, 64, 2, 0, 0, 0, 0, 0, 0, 12, 11, 0, 0, 39, 29, 0, 0, 64, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 17, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 7, 0, 0, 0, 9, 0, 0, 0, 6, 0, 0, 0, 10, 0, 0, 0, 5, 0, 0, 0, 11, 0, 0, 0, 4, 0, 0, 0, 12, 0, 0, 0, 3, 0, 0, 0, 13, 0, 0, 0, 2, 0, 0, 0, 14, 0, 0, 0, 1, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 8, 0, 0, 0, 9, 0, 0, 0, 10, 0, 0, 0, 11, 0, 0, 0, 13, 0, 0, 0, 15, 0, 0, 0, 17, 0, 0, 0, 19, 0, 0, 0, 23, 0, 0, 0, 27, 0, 0, 0, 31, 0, 0, 0, 35, 0, 0, 0, 43, 0, 0, 0, 51, 0, 0, 0, 59, 0, 0, 0, 67, 0, 0, 0, 83, 0, 0, 0, 99, 0, 0, 0, 115, 0, 0, 0, 131, 0, 0, 0, 163, 0, 0, 0, 195, 0, 0, 0, 227, 0, 0, 0, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 5, 0, 0, 0, 6, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 7, 0, 0, 0, 8, 0, 0, 0, 8, 0, 0, 0, 9, 0, 0, 0, 9, 0, 0, 0, 10, 0, 0, 0, 10, 0, 0, 0, 11, 0, 0, 0, 11, 0, 0, 0, 12, 0, 0, 0, 12, 0, 0, 0, 13, 0, 0, 0, 13, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 7, 0, 0, 0, 9, 0, 0, 0, 13, 0, 0, 0, 17, 0, 0, 0, 25, 0, 0, 0, 33, 0, 0, 0, 49, 0, 0, 0, 65, 0, 0, 0, 97, 0, 0, 0, 129, 0, 0, 0, 193, 0, 0, 0, 1, 1, 0, 0, 129, 1, 0, 0, 1, 2, 0, 0, 1, 3, 0, 0, 1, 4, 0, 0, 1, 6, 0, 0, 1, 8, 0, 0, 1, 12, 0, 0, 1, 16, 0, 0, 1, 24, 0, 0, 1, 32, 0, 0, 1, 48, 0, 0, 1, 64, 0, 0, 1, 96, 0, 0, 0, 0, 0, 0, 150, 48, 7, 119, 44, 97, 14, 238, 186, 81, 9, 153, 25, 196, 109, 7, 143, 244, 106, 112, 53, 165, 99, 233, 163, 149, 100, 158, 50, 136, 219, 14, 164, 184, 220, 121, 30, 233, 213, 224, 136, 217, 210, 151, 43, 76, 182, 9, 189, 124, 177, 126, 7, 45, 184, 231, 145, 29, 191, 144, 100, 16, 183, 29, 242, 32, 176, 106, 72, 113, 185, 243, 222, 65, 190, 132, 125, 212, 218, 26, 235, 228, 221, 109, 81, 181, 212, 244, 199, 133, 211, 131, 86, 152, 108, 19, 192, 168, 107, 100, 122, 249, 98, 253, 236, 201, 101, 138, 79, 92, 1, 20, 217, 108, 6, 99, 99, 61, 15, 250, 245, 13, 8, 141, 200, 32, 110, 59, 94, 16, 105, 76, 228, 65, 96, 213, 114, 113, 103, 162, 209, 228, 3, 60, 71, 212, 4, 75, 253, 133, 13, 210, 107, 181, 10, 165, 250, 168, 181, 53, 108, 152, 178, 66, 214, 201, 187, 219, 64, 249, 188, 172, 227, 108, 216, 50, 117, 92, 223, 69, 207, 13, 214, 220, 89, 61, 209, 171, 172, 48, 217, 38, 58, 0, 222, 81, 128, 81, 215, 200, 22, 97, 208, 191, 181, 244, 180, 33, 35, 196, 179, 86, 153, 149, 186, 207, 15, 165, 189, 184, 158, 184, 2, 40, 8, 136, 5, 95, 178, 217, 12, 198, 36, 233, 11, 177, 135, 124, 111, 47, 17, 76, 104, 88, 171, 29, 97, 193, 61, 45, 102, 182, 144, 65, 220, 118, 6, 113, 219, 1, 188, 32, 210, 152, 42, 16, 213, 239, 137, 133, 177, 113, 31, 181, 182, 6, 165, 228, 191, 159, 51, 212, 184, 232, 162, 201, 7, 120, 52, 249, 0, 15, 142, 168, 9, 150, 24, 152, 14, 225, 187, 13, 106, 127, 45, 61, 109, 8, 151, 108, 100, 145, 1, 92, 99, 230, 244, 81, 107, 107, 98, 97, 108, 28, 216, 48, 101, 133, 78, 0, 98, 242, 237, 149, 6, 108, 123, 165, 1, 27, 193, 244, 8, 130, 87, 196, 15, 245, 198, 217, 176, 101, 80, 233, 183, 18, 234, 184, 190, 139, 124, 136, 185, 252, 223, 29, 221, 98, 73, 45, 218, 21, 243, 124, 211, 140, 101, 76, 212, 251, 88, 97, 178, 77, 206, 81, 181, 58, 116, 0, 188, 163, 226, 48, 187, 212, 65, 165, 223, 74, 215, 149, 216, 61, 109, 196, 209, 164, 251, 244, 214, 211, 106, 233, 105, 67, 252, 217, 110, 52, 70, 136, 103, 173, 208, 184, 96, 218, 115, 45, 4, 68, 229, 29, 3, 51, 95, 76, 10, 170, 201, 124, 13, 221, 60, 113, 5, 80, 170, 65, 2, 39, 16, 16, 11, 190, 134, 32, 12, 201, 37, 181, 104, 87, 179, 133, 111, 32, 9, 212, 102, 185, 159, 228, 97, 206, 14, 249, 222, 94, 152, 201, 217, 41, 34, 152, 208, 176, 180, 168, 215, 199, 23, 61, 179, 89, 129, 13, 180, 46, 59, 92, 189, 183, 173, 108, 186, 192, 32, 131, 184, 237, 182, 179, 191, 154, 12, 226, 182, 3, 154, 210, 177, 116, 57, 71, 213, 234, 175, 119, 210, 157, 21, 38, 219, 4, 131, 22, 220, 115, 18, 11, 99, 227, 132, 59, 100, 148, 62, 106, 109, 13, 168, 90, 106, 122, 11, 207, 14, 228, 157, 255, 9, 147, 39, 174, 0, 10, 177, 158, 7, 125, 68, 147, 15, 240, 210, 163, 8, 135, 104, 242, 1, 30, 254, 194, 6, 105, 93, 87, 98, 247, 203, 103, 101, 128, 113, 54, 108, 25, 231, 6, 107, 110, 118, 27, 212, 254, 224, 43, 211, 137, 90, 122, 218, 16, 204, 74, 221, 103, 111, 223, 185, 249, 249, 239, 190, 142, 67, 190, 183, 23, 213, 142, 176, 96, 232, 163, 214, 214, 126, 147, 209, 161, 196, 194, 216, 56, 82, 242, 223, 79, 241, 103, 187, 209, 103, 87, 188, 166, 221, 6, 181, 63, 75, 54, 178, 72, 218, 43, 13, 216, 76, 27, 10, 175, 246, 74, 3, 54, 96, 122, 4, 65, 195, 239, 96, 223, 85, 223, 103, 168, 239, 142, 110, 49, 121, 190, 105, 70, 140, 179, 97, 203, 26, 131, 102, 188, 160, 210, 111, 37, 54, 226, 104, 82, 149, 119, 12, 204, 3, 71, 11, 187, 185, 22, 2, 34, 47, 38, 5, 85, 190, 59, 186, 197, 40, 11, 189, 178, 146, 90, 180, 43, 4, 106, 179, 92, 167, 255, 215, 194, 49, 207, 208, 181, 139, 158, 217, 44, 29, 174, 222, 91, 176, 194, 100, 155, 38, 242, 99, 236, 156, 163, 106, 117, 10, 147, 109, 2, 169, 6, 9, 156, 63, 54, 14, 235, 133, 103, 7, 114, 19, 87, 0, 5, 130, 74, 191, 149, 20, 122, 184, 226, 174, 43, 177, 123, 56, 27, 182, 12, 155, 142, 210, 146, 13, 190, 213, 229, 183, 239, 220, 124, 33, 223, 219, 11, 212, 210, 211, 134, 66, 226, 212, 241, 248, 179, 221, 104, 110, 131, 218, 31, 205, 22, 190, 129, 91, 38, 185, 246, 225, 119, 176, 111, 119, 71, 183, 24, 230, 90, 8, 136, 112, 106, 15, 255, 202, 59, 6, 102, 92, 11, 1, 17, 255, 158, 101, 143, 105, 174, 98, 248, 211, 255, 107, 97, 69, 207, 108, 22, 120, 226, 10, 160, 238, 210, 13, 215, 84, 131, 4, 78, 194, 179, 3, 57, 97, 38, 103, 167, 247, 22, 96, 208, 77, 71, 105, 73, 219, 119, 110, 62, 74, 106, 209, 174, 220, 90, 214, 217, 102, 11, 223, 64, 240, 59, 216, 55, 83, 174, 188, 169, 197, 158, 187, 222, 127, 207, 178, 71, 233, 255, 181, 48, 28, 242, 189, 189, 138, 194, 186, 202, 48, 147, 179, 83, 166, 163, 180, 36, 5, 54, 208, 186, 147, 6, 215, 205, 41, 87, 222, 84, 191, 103, 217, 35, 46, 122, 102, 179, 184, 74, 97, 196, 2, 27, 104, 93, 148, 43, 111, 42, 55, 190, 11, 180, 161, 142, 12, 195, 27, 223, 5, 90, 141, 239, 2, 45, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 8, 0, 0, 0, 8, 0, 0, 0, 8, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 8, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 128, 2, 0, 0, 88, 1, 0, 0, 128, 2, 0, 0, 128, 2, 0, 0, 224, 2, 0, 0, 128, 2, 0, 0, 192, 2, 0, 0, 224, 2, 0, 0, 224, 2, 0, 0, 224, 2, 0, 0, 192, 2, 0, 0, 56, 1, 0, 0, 192, 2, 0, 0, 128, 2, 0, 0, 56, 1, 0, 0, 0, 0, 0, 0, 128, 2, 0, 0, 56, 1, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 10, 0, 0, 0, 15, 0, 0, 0, 20, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 16, 2, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 112, 2, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 64, 2, 0, 0, 4, 0, 0, 0, 8, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 240, 2, 0, 0, 4, 0, 0, 0, 9, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 4, 0, 0, 0, 10, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 96, 2, 0, 0, 4, 0, 0, 0, 11, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 31, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 14, 0, 0, 132, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 6, 0, 0, 0, 156, 42, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 6, 0, 0, 0, 148, 38, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 255, 255, 255, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 85, 110, 97, 98, 108, 101, 32, 116, 111, 32, 108, 111, 97, 100, 32, 97, 115, 115, 101, 116, 0, 47, 85, 115, 101, 114, 115, 47, 112, 114, 105, 100, 101, 111, 117, 116, 47, 103, 105, 116, 47, 112, 97, 114, 103, 47, 115, 114, 99, 47, 97, 115, 115, 101, 116, 46, 99, 0, 112, 97, 114, 95, 97, 115, 115, 101, 116, 95, 111, 110, 108, 111, 97, 100, 0, 85, 110, 105, 110, 105, 116, 105, 97, 108, 105, 122, 101, 100, 32, 97, 115, 115, 101, 116, 32, 114, 101, 103, 105, 115, 116, 114, 121, 0, 95, 97, 115, 115, 101, 116, 95, 114, 101, 103, 105, 115, 116, 114, 121, 0, 112, 97, 114, 95, 97, 115, 115, 101, 116, 95, 116, 111, 95, 98, 117, 102, 102, 101, 114, 0, 105, 116, 101, 114, 32, 33, 61, 32, 40, 40, 95, 97, 115, 115, 101, 116, 95, 114, 101, 103, 105, 115, 116, 114, 121, 41, 45, 62, 110, 95, 98, 117, 99, 107, 101, 116, 115, 41, 0, 78, 117, 108, 108, 32, 98, 117, 102, 102, 101, 114, 0, 98, 117, 102, 0, 47, 85, 115, 101, 114, 115, 47, 112, 114, 105, 100, 101, 111, 117, 116, 47, 103, 105, 116, 47, 112, 97, 114, 103, 47, 115, 114, 99, 47, 98, 117, 102, 102, 101, 114, 46, 99, 0, 112, 97, 114, 95, 98, 117, 102, 102, 101, 114, 95, 108, 101, 110, 103, 116, 104, 0, 71, 80, 85, 32, 98, 117, 102, 102, 101, 114, 32, 114, 101, 113, 117, 105, 114, 101, 100, 0, 112, 97, 114, 95, 98, 117, 102, 102, 101, 114, 95, 103, 112, 117, 95, 99, 104, 101, 99, 107, 40, 98, 117, 102, 41, 0, 112, 97, 114, 95, 98, 117, 102, 102, 101, 114, 95, 103, 112, 117, 95, 98, 105, 110, 100, 0, 97, 116, 116, 114, 105, 98, 117, 116, 101, 32, 0, 64, 112, 114, 111, 103, 114, 97, 109, 32, 0, 95, 112, 114, 101, 102, 105, 120, 0, 10, 0, 32, 9, 0, 35, 108, 105, 110, 101, 32, 37, 100, 10, 0, 59, 32, 9, 0, 44, 0, 64, 112, 114, 111, 103, 114, 97, 109, 32, 115, 104, 111, 117, 108, 100, 32, 104, 97, 118, 101, 32, 51, 32, 97, 114, 103, 115, 0, 110, 97, 114, 103, 115, 32, 61, 61, 32, 51, 0, 47, 85, 115, 101, 114, 115, 47, 112, 114, 105, 100, 101, 111, 117, 116, 47, 103, 105, 116, 47, 112, 97, 114, 103, 47, 115, 114, 99, 47, 115, 104, 97, 100, 101, 114, 46, 99, 0, 112, 97, 114, 95, 115, 104, 97, 100, 101, 114, 95, 108, 111, 97, 100, 95, 102, 114, 111, 109, 95, 98, 117, 102, 102, 101, 114, 0, 37, 115, 58, 32, 37, 115, 10, 0, 78, 111, 32, 115, 117, 99, 104, 32, 118, 115, 104, 97, 100, 101, 114, 0, 118, 115, 104, 97, 100, 101, 114, 95, 105, 110, 100, 101, 120, 32, 62, 32, 48, 0, 78, 111, 32, 115, 117, 99, 104, 32, 102, 115, 104, 97, 100, 101, 114, 0, 102, 115, 104, 97, 100, 101, 114, 95, 105, 110, 100, 101, 120, 32, 62, 32, 48, 0, 112, 114, 101, 99, 105, 115, 105, 111, 110, 32, 104, 105, 103, 104, 112, 32, 102, 108, 111, 97, 116, 59, 10, 0, 85, 110, 107, 110, 111, 119, 110, 32, 97, 116, 116, 114, 105, 98, 117, 116, 101, 0, 105, 116, 101, 114, 32, 33, 61, 32, 40, 40, 95, 97, 116, 116, 114, 95, 114, 101, 103, 105, 115, 116, 114, 121, 41, 45, 62, 110, 95, 98, 117, 99, 107, 101, 116, 115, 41, 0, 112, 97, 114, 95, 115, 104, 97, 100, 101, 114, 95, 97, 116, 116, 114, 105, 98, 95, 103, 101, 116, 0, 73, 110, 97, 99, 116, 105, 118, 101, 32, 117, 110, 105, 102, 111, 114, 109, 0, 105, 116, 101, 114, 32, 33, 61, 32, 40, 40, 95, 117, 110, 105, 102, 95, 114, 101, 103, 105, 115, 116, 114, 121, 41, 45, 62, 110, 95, 98, 117, 99, 107, 101, 116, 115, 41, 0, 112, 97, 114, 95, 115, 104, 97, 100, 101, 114, 95, 117, 110, 105, 102, 111, 114, 109, 95, 103, 101, 116, 0, 78, 111, 32, 118, 115, 104, 97, 100, 101, 114, 0, 105, 116, 101, 114, 32, 33, 61, 32, 40, 40, 95, 118, 115, 104, 97, 100, 101, 114, 95, 114, 101, 103, 105, 115, 116, 114, 121, 41, 45, 62, 110, 95, 98, 117, 99, 107, 101, 116, 115, 41, 0, 99, 111, 109, 112, 105, 108, 101, 95, 112, 114, 111, 103, 114, 97, 109, 0, 78, 111, 32, 102, 115, 104, 97, 100, 101, 114, 0, 105, 116, 101, 114, 32, 33, 61, 32, 40, 40, 95, 102, 115, 104, 97, 100, 101, 114, 95, 114, 101, 103, 105, 115, 116, 114, 121, 41, 45, 62, 110, 95, 98, 117, 99, 107, 101, 116, 115, 41, 0, 99, 111, 109, 112, 105, 108, 101, 95, 115, 117, 99, 99, 101, 115, 115, 0, 108, 105, 110, 107, 95, 115, 117, 99, 99, 101, 115, 115, 0, 78, 111, 32, 112, 114, 111, 103, 114, 97, 109, 0, 112, 114, 111, 103, 114, 97, 109, 0, 112, 97, 114, 95, 115, 104, 97, 100, 101, 114, 95, 98, 105, 110, 100, 0, 80, 78, 71, 32, 100, 101, 99, 111, 100, 105, 110, 103, 32, 101, 114, 114, 111, 114, 0, 101, 114, 114, 32, 61, 61, 32, 48, 0, 47, 85, 115, 101, 114, 115, 47, 112, 114, 105, 100, 101, 111, 117, 116, 47, 103, 105, 116, 47, 112, 97, 114, 103, 47, 115, 114, 99, 47, 116, 101, 120, 116, 117, 114, 101, 46, 99, 0, 112, 97, 114, 95, 116, 101, 120, 116, 117, 114, 101, 95, 102, 114, 111, 109, 95, 97, 115, 115, 101, 116, 0, 85, 110, 105, 110, 105, 116, 105, 97, 108, 105, 122, 101, 100, 32, 116, 111, 107, 101, 110, 32, 114, 101, 103, 105, 115, 116, 114, 121, 0, 95, 116, 111, 107, 101, 110, 95, 114, 101, 103, 105, 115, 116, 114, 121, 0, 47, 85, 115, 101, 114, 115, 47, 112, 114, 105, 100, 101, 111, 117, 116, 47, 103, 105, 116, 47, 112, 97, 114, 103, 47, 115, 114, 99, 47, 116, 111, 107, 101, 110, 46, 99, 0, 112, 97, 114, 95, 116, 111, 107, 101, 110, 95, 116, 111, 95, 115, 100, 115, 0, 85, 110, 107, 110, 111, 119, 110, 32, 116, 111, 107, 101, 110, 0, 105, 116, 101, 114, 32, 33, 61, 32, 40, 40, 95, 116, 111, 107, 101, 110, 95, 114, 101, 103, 105, 115, 116, 114, 121, 41, 45, 62, 110, 95, 98, 117, 99, 107, 101, 116, 115, 41, 0, 0, 123, 32, 77, 111, 100, 117, 108, 101, 46, 112, 97, 114, 95, 119, 105, 110, 100, 111, 119, 95, 100, 105, 109, 115, 32, 61, 32, 91, 93, 59, 32, 77, 111, 100, 117, 108, 101, 46, 112, 97, 114, 95, 119, 105, 110, 100, 111, 119, 95, 100, 105, 109, 115, 91, 48, 93, 32, 61, 32, 36, 48, 59, 32, 77, 111, 100, 117, 108, 101, 46, 112, 97, 114, 95, 119, 105, 110, 100, 111, 119, 95, 100, 105, 109, 115, 91, 49, 93, 32, 61, 32, 36, 49, 59, 32, 125, 0, 112, 97, 114, 103, 0, 97, 115, 115, 101, 116, 95, 112, 114, 101, 108, 111, 97, 100, 0, 105, 105, 0, 118, 0, 87, 105, 110, 100, 111, 119, 0, 118, 105, 0, 118, 105, 105, 0, 100, 114, 97, 119, 0, 116, 105, 99, 107, 0, 118, 105, 102, 0, 105, 110, 112, 117, 116, 0, 118, 105, 105, 102, 102, 102, 0, 109, 101, 115, 115, 97, 103, 101, 0, 65, 115, 115, 101, 116, 0, 97, 108, 108, 111, 99, 0, 105, 105, 105, 105, 0, 99, 111, 109, 109, 105, 116, 0, 112, 97, 114, 103, 47, 0, 78, 83, 116, 51, 95, 95, 49, 49, 50, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 73, 99, 78, 83, 95, 49, 49, 99, 104, 97, 114, 95, 116, 114, 97, 105, 116, 115, 73, 99, 69, 69, 78, 83, 95, 57, 97, 108, 108, 111, 99, 97, 116, 111, 114, 73, 99, 69, 69, 69, 69, 0, 78, 83, 116, 51, 95, 95, 49, 50, 49, 95, 95, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 95, 99, 111, 109, 109, 111, 110, 73, 76, 98, 49, 69, 69, 69, 0, 65, 108, 108, 111, 99, 97, 116, 105, 110, 103, 32, 37, 100, 32, 98, 121, 116, 101, 115, 32, 102, 111, 114, 32, 37, 115, 10, 0, 80, 75, 90, 78, 51, 50, 69, 109, 115, 99, 114, 105, 112, 116, 101, 110, 66, 105, 110, 100, 105, 110, 103, 73, 110, 105, 116, 105, 97, 108, 105, 122, 101, 114, 95, 112, 97, 114, 67, 49, 69, 118, 69, 53, 65, 115, 115, 101, 116, 0, 80, 90, 78, 51, 50, 69, 109, 115, 99, 114, 105, 112, 116, 101, 110, 66, 105, 110, 100, 105, 110, 103, 73, 110, 105, 116, 105, 97, 108, 105, 122, 101, 114, 95, 112, 97, 114, 67, 49, 69, 118, 69, 53, 65, 115, 115, 101, 116, 0, 90, 78, 51, 50, 69, 109, 115, 99, 114, 105, 112, 116, 101, 110, 66, 105, 110, 100, 105, 110, 103, 73, 110, 105, 116, 105, 97, 108, 105, 122, 101, 114, 95, 112, 97, 114, 67, 49, 69, 118, 69, 53, 65, 115, 115, 101, 116, 0, 79, 112, 101, 110, 71, 76, 32, 69, 114, 114, 111, 114, 10, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 51, 118, 97, 108, 69, 0, 80, 75, 90, 78, 51, 50, 69, 109, 115, 99, 114, 105, 112, 116, 101, 110, 66, 105, 110, 100, 105, 110, 103, 73, 110, 105, 116, 105, 97, 108, 105, 122, 101, 114, 95, 112, 97, 114, 67, 49, 69, 118, 69, 54, 87, 105, 110, 100, 111, 119, 0, 80, 90, 78, 51, 50, 69, 109, 115, 99, 114, 105, 112, 116, 101, 110, 66, 105, 110, 100, 105, 110, 103, 73, 110, 105, 116, 105, 97, 108, 105, 122, 101, 114, 95, 112, 97, 114, 67, 49, 69, 118, 69, 54, 87, 105, 110, 100, 111, 119, 0, 90, 78, 51, 50, 69, 109, 115, 99, 114, 105, 112, 116, 101, 110, 66, 105, 110, 100, 105, 110, 103, 73, 110, 105, 116, 105, 97, 108, 105, 122, 101, 114, 95, 112, 97, 114, 67, 49, 69, 118, 69, 54, 87, 105, 110, 100, 111, 119, 0, 105, 109, 103, 119, 105, 100, 116, 104, 32, 61, 61, 32, 105, 109, 103, 104, 101, 105, 103, 104, 116, 0, 46, 46, 47, 100, 101, 109, 111, 115, 47, 109, 97, 114, 105, 110, 97, 46, 99, 0, 105, 110, 105, 116, 0, 109, 97, 114, 105, 110, 97, 95, 122, 0, 37, 48, 50, 100, 46, 112, 110, 103, 0, 104, 105, 103, 104, 0, 108, 111, 119, 0, 112, 95, 116, 101, 120, 116, 117, 114, 101, 100, 0, 112, 95, 104, 105, 103, 104, 112, 0, 97, 95, 112, 111, 115, 105, 116, 105, 111, 110, 0, 97, 95, 116, 101, 120, 99, 111, 111, 114, 100, 0, 117, 95, 109, 118, 112, 0, 117, 95, 101, 121, 101, 112, 111, 115, 0, 117, 95, 101, 121, 101, 112, 111, 115, 95, 108, 111, 119, 112, 97, 114, 116, 0, 109, 97, 114, 105, 110, 97, 46, 103, 108, 115, 108, 0, 100, 111, 103, 103, 105, 101, 115, 46, 112, 110, 103, 0, 111, 114, 105, 103, 105, 110, 95, 122, 48, 50, 46, 112, 110, 103, 0, 109, 97, 114, 105, 110, 97, 95, 122, 48, 53, 46, 112, 110, 103, 0, 109, 97, 114, 105, 110, 97, 95, 122, 49, 48, 46, 112, 110, 103, 0, 109, 97, 114, 105, 110, 97, 95, 122, 49, 53, 46, 112, 110, 103, 0, 109, 97, 114, 105, 110, 97, 95, 122, 50, 48, 46, 112, 110, 103, 0, 118, 111, 105, 100, 0, 98, 111, 111, 108, 0, 99, 104, 97, 114, 0, 115, 105, 103, 110, 101, 100, 32, 99, 104, 97, 114, 0, 117, 110, 115, 105, 103, 110, 101, 100, 32, 99, 104, 97, 114, 0, 115, 104, 111, 114, 116, 0, 117, 110, 115, 105, 103, 110, 101, 100, 32, 115, 104, 111, 114, 116, 0, 105, 110, 116, 0, 117, 110, 115, 105, 103, 110, 101, 100, 32, 105, 110, 116, 0, 108, 111, 110, 103, 0, 117, 110, 115, 105, 103, 110, 101, 100, 32, 108, 111, 110, 103, 0, 102, 108, 111, 97, 116, 0, 100, 111, 117, 98, 108, 101, 0, 115, 116, 100, 58, 58, 115, 116, 114, 105, 110, 103, 0, 115, 116, 100, 58, 58, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 60, 117, 110, 115, 105, 103, 110, 101, 100, 32, 99, 104, 97, 114, 62, 0, 115, 116, 100, 58, 58, 119, 115, 116, 114, 105, 110, 103, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 118, 97, 108, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 99, 104, 97, 114, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 115, 105, 103, 110, 101, 100, 32, 99, 104, 97, 114, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 110, 115, 105, 103, 110, 101, 100, 32, 99, 104, 97, 114, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 115, 104, 111, 114, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 110, 115, 105, 103, 110, 101, 100, 32, 115, 104, 111, 114, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 105, 110, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 110, 115, 105, 103, 110, 101, 100, 32, 105, 110, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 108, 111, 110, 103, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 110, 115, 105, 103, 110, 101, 100, 32, 108, 111, 110, 103, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 105, 110, 116, 56, 95, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 105, 110, 116, 56, 95, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 105, 110, 116, 49, 54, 95, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 105, 110, 116, 49, 54, 95, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 105, 110, 116, 51, 50, 95, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 105, 110, 116, 51, 50, 95, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 102, 108, 111, 97, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 100, 111, 117, 98, 108, 101, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 108, 111, 110, 103, 32, 100, 111, 117, 98, 108, 101, 62, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 101, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 100, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 102, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 109, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 108, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 106, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 105, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 116, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 115, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 104, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 97, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 99, 69, 69, 0, 78, 83, 116, 51, 95, 95, 49, 49, 50, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 73, 119, 78, 83, 95, 49, 49, 99, 104, 97, 114, 95, 116, 114, 97, 105, 116, 115, 73, 119, 69, 69, 78, 83, 95, 57, 97, 108, 108, 111, 99, 97, 116, 111, 114, 73, 119, 69, 69, 69, 69, 0, 78, 83, 116, 51, 95, 95, 49, 49, 50, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 73, 104, 78, 83, 95, 49, 49, 99, 104, 97, 114, 95, 116, 114, 97, 105, 116, 115, 73, 104, 69, 69, 78, 83, 95, 57, 97, 108, 108, 111, 99, 97, 116, 111, 114, 73, 104, 69, 69, 69, 69, 0, 83, 116, 57, 98, 97, 100, 95, 97, 108, 108, 111, 99, 0, 83, 116, 57, 101, 120, 99, 101, 112, 116, 105, 111, 110, 0, 83, 116, 57, 116, 121, 112, 101, 95, 105, 110, 102, 111, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 49, 54, 95, 95, 115, 104, 105, 109, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 49, 55, 95, 95, 99, 108, 97, 115, 115, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 49, 57, 95, 95, 112, 111, 105, 110, 116, 101, 114, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 49, 55, 95, 95, 112, 98, 97, 115, 101, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 50, 51, 95, 95, 102, 117, 110, 100, 97, 109, 101, 110, 116, 97, 108, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 118, 0, 68, 110, 0, 98, 0, 99, 0, 104, 0, 97, 0, 115, 0, 116, 0, 105, 0, 106, 0, 108, 0, 109, 0, 102, 0, 100, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 50, 48, 95, 95, 115, 105, 95, 99, 108, 97, 115, 115, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 50, 49, 95, 95, 118, 109, 105, 95, 99, 108, 97, 115, 115, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 112, 116, 104, 114, 101, 97, 100, 95, 111, 110, 99, 101, 32, 102, 97, 105, 108, 117, 114, 101, 32, 105, 110, 32, 95, 95, 99, 120, 97, 95, 103, 101, 116, 95, 103, 108, 111, 98, 97, 108, 115, 95, 102, 97, 115, 116, 40, 41, 0, 115, 116, 100, 58, 58, 98, 97, 100, 95, 97, 108, 108, 111, 99, 0, 116, 101, 114, 109, 105, 110, 97, 116, 101, 95, 104, 97, 110, 100, 108, 101, 114, 32, 117, 110, 101, 120, 112, 101, 99, 116, 101, 100, 108, 121, 32, 114, 101, 116, 117, 114, 110, 101, 100, 0, 99, 97, 110, 110, 111, 116, 32, 99, 114, 101, 97, 116, 101, 32, 112, 116, 104, 114, 101, 97, 100, 32, 107, 101, 121, 32, 102, 111, 114, 32, 95, 95, 99, 120, 97, 95, 103, 101, 116, 95, 103, 108, 111, 98, 97, 108, 115, 40, 41, 0, 99, 97, 110, 110, 111, 116, 32, 122, 101, 114, 111, 32, 111, 117, 116, 32, 116, 104, 114, 101, 97, 100, 32, 118, 97, 108, 117, 101, 32, 102, 111, 114, 32, 95, 95, 99, 120, 97, 95, 103, 101, 116, 95, 103, 108, 111, 98, 97, 108, 115, 40, 41, 0, 33, 34, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 32, 108, 101, 110, 103, 116, 104, 95, 101, 114, 114, 111, 114, 34, 0, 47, 117, 115, 114, 47, 108, 111, 99, 97, 108, 47, 67, 101, 108, 108, 97, 114, 47, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 47, 49, 46, 51, 52, 46, 54, 47, 108, 105, 98, 101, 120, 101, 99, 47, 115, 121, 115, 116, 101, 109, 47, 105, 110, 99, 108, 117, 100, 101, 47, 108, 105, 98, 99, 120, 120, 47, 115, 116, 114, 105, 110, 103, 0, 95, 95, 116, 104, 114, 111, 119, 95, 108, 101, 110, 103, 116, 104, 95, 101, 114, 114, 111, 114, 0, 116, 101, 114, 109, 105, 110, 97, 116, 105, 110, 103, 32, 119, 105, 116, 104, 32, 37, 115, 32, 101, 120, 99, 101, 112, 116, 105, 111, 110, 32, 111, 102, 32, 116, 121, 112, 101, 32, 37, 115, 58, 32, 37, 115, 0, 116, 101, 114, 109, 105, 110, 97, 116, 105, 110, 103, 32, 119, 105, 116, 104, 32, 37, 115, 32, 101, 120, 99, 101, 112, 116, 105, 111, 110, 32, 111, 102, 32, 116, 121, 112, 101, 32, 37, 115, 0, 116, 101, 114, 109, 105, 110, 97, 116, 105, 110, 103, 32, 119, 105, 116, 104, 32, 37, 115, 32, 102, 111, 114, 101, 105, 103, 110, 32, 101, 120, 99, 101, 112, 116, 105, 111, 110, 0, 116, 101, 114, 109, 105, 110, 97, 116, 105, 110, 103, 0, 117, 110, 99, 97, 117, 103, 104, 116, 0, 84, 33, 34, 25, 13, 1, 2, 3, 17, 75, 28, 12, 16, 4, 11, 29, 18, 30, 39, 104, 110, 111, 112, 113, 98, 32, 5, 6, 15, 19, 20, 21, 26, 8, 22, 7, 40, 36, 23, 24, 9, 10, 14, 27, 31, 37, 35, 131, 130, 125, 38, 42, 43, 60, 61, 62, 63, 67, 71, 74, 77, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 99, 100, 101, 102, 103, 105, 106, 107, 108, 114, 115, 116, 121, 122, 123, 124, 0, 73, 108, 108, 101, 103, 97, 108, 32, 98, 121, 116, 101, 32, 115, 101, 113, 117, 101, 110, 99, 101, 0, 68, 111, 109, 97, 105, 110, 32, 101, 114, 114, 111, 114, 0, 82, 101, 115, 117, 108, 116, 32, 110, 111, 116, 32, 114, 101, 112, 114, 101, 115, 101, 110, 116, 97, 98, 108, 101, 0, 78, 111, 116, 32, 97, 32, 116, 116, 121, 0, 80, 101, 114, 109, 105, 115, 115, 105, 111, 110, 32, 100, 101, 110, 105, 101, 100, 0, 79, 112, 101, 114, 97, 116, 105, 111, 110, 32, 110, 111, 116, 32, 112, 101, 114, 109, 105, 116, 116, 101, 100, 0, 78, 111, 32, 115, 117, 99, 104, 32, 102, 105, 108, 101, 32, 111, 114, 32, 100, 105, 114, 101, 99, 116, 111, 114, 121, 0, 78, 111, 32, 115, 117, 99, 104, 32, 112, 114, 111, 99, 101, 115, 115, 0, 70, 105, 108, 101, 32, 101, 120, 105, 115, 116, 115, 0, 86, 97, 108, 117, 101, 32, 116, 111, 111, 32, 108, 97, 114, 103, 101, 32, 102, 111, 114, 32, 100, 97, 116, 97, 32, 116, 121, 112, 101, 0, 78, 111, 32, 115, 112, 97, 99, 101, 32, 108, 101, 102, 116, 32, 111, 110, 32, 100, 101, 118, 105, 99, 101, 0, 79, 117, 116, 32, 111, 102, 32, 109, 101, 109, 111, 114, 121, 0, 82, 101, 115, 111, 117, 114, 99, 101, 32, 98, 117, 115, 121, 0, 73, 110, 116, 101, 114, 114, 117, 112, 116, 101, 100, 32, 115, 121, 115, 116, 101, 109, 32, 99, 97, 108, 108, 0, 82, 101, 115, 111, 117, 114, 99, 101, 32, 116, 101, 109, 112, 111, 114, 97, 114, 105, 108, 121, 32, 117, 110, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 73, 110, 118, 97, 108, 105, 100, 32, 115, 101, 101, 107, 0, 67, 114, 111, 115, 115, 45, 100, 101, 118, 105, 99, 101, 32, 108, 105, 110, 107, 0, 82, 101, 97, 100, 45, 111, 110, 108, 121, 32, 102, 105, 108, 101, 32, 115, 121, 115, 116, 101, 109, 0, 68, 105, 114, 101, 99, 116, 111, 114, 121, 32, 110, 111, 116, 32, 101, 109, 112, 116, 121, 0, 67, 111, 110, 110, 101, 99, 116, 105, 111, 110, 32, 114, 101, 115, 101, 116, 32, 98, 121, 32, 112, 101, 101, 114, 0, 79, 112, 101, 114, 97, 116, 105, 111, 110, 32, 116, 105, 109, 101, 100, 32, 111, 117, 116, 0, 67, 111, 110, 110, 101, 99, 116, 105, 111, 110, 32, 114, 101, 102, 117, 115, 101, 100, 0, 72, 111, 115, 116, 32, 105, 115, 32, 100, 111, 119, 110, 0, 72, 111, 115, 116, 32, 105, 115, 32, 117, 110, 114, 101, 97, 99, 104, 97, 98, 108, 101, 0, 65, 100, 100, 114, 101, 115, 115, 32, 105, 110, 32, 117, 115, 101, 0, 66, 114, 111, 107, 101, 110, 32, 112, 105, 112, 101, 0, 73, 47, 79, 32, 101, 114, 114, 111, 114, 0, 78, 111, 32, 115, 117, 99, 104, 32, 100, 101, 118, 105, 99, 101, 32, 111, 114, 32, 97, 100, 100, 114, 101, 115, 115, 0, 66, 108, 111, 99, 107, 32, 100, 101, 118, 105, 99, 101, 32, 114, 101, 113, 117, 105, 114, 101, 100, 0, 78, 111, 32, 115, 117, 99, 104, 32, 100, 101, 118, 105, 99, 101, 0, 78, 111, 116, 32, 97, 32, 100, 105, 114, 101, 99, 116, 111, 114, 121, 0, 73, 115, 32, 97, 32, 100, 105, 114, 101, 99, 116, 111, 114, 121, 0, 84, 101, 120, 116, 32, 102, 105, 108, 101, 32, 98, 117, 115, 121, 0, 69, 120, 101, 99, 32, 102, 111, 114, 109, 97, 116, 32, 101, 114, 114, 111, 114, 0, 73, 110, 118, 97, 108, 105, 100, 32, 97, 114, 103, 117, 109, 101, 110, 116, 0, 65, 114, 103, 117, 109, 101, 110, 116, 32, 108, 105, 115, 116, 32, 116, 111, 111, 32, 108, 111, 110, 103, 0, 83, 121, 109, 98, 111, 108, 105, 99, 32, 108, 105, 110, 107, 32, 108, 111, 111, 112, 0, 70, 105, 108, 101, 110, 97, 109, 101, 32, 116, 111, 111, 32, 108, 111, 110, 103, 0, 84, 111, 111, 32, 109, 97, 110, 121, 32, 111, 112, 101, 110, 32, 102, 105, 108, 101, 115, 32, 105, 110, 32, 115, 121, 115, 116, 101, 109, 0, 78, 111, 32, 102, 105, 108, 101, 32, 100, 101, 115, 99, 114, 105, 112, 116, 111, 114, 115, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 66, 97, 100, 32, 102, 105, 108, 101, 32, 100, 101, 115, 99, 114, 105, 112, 116, 111, 114, 0, 78, 111, 32, 99, 104, 105, 108, 100, 32, 112, 114, 111, 99, 101, 115, 115, 0, 66, 97, 100, 32, 97, 100, 100, 114, 101, 115, 115, 0, 70, 105, 108, 101, 32, 116, 111, 111, 32, 108, 97, 114, 103, 101, 0, 84, 111, 111, 32, 109, 97, 110, 121, 32, 108, 105, 110, 107, 115, 0, 78, 111, 32, 108, 111, 99, 107, 115, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 82, 101, 115, 111, 117, 114, 99, 101, 32, 100, 101, 97, 100, 108, 111, 99, 107, 32, 119, 111, 117, 108, 100, 32, 111, 99, 99, 117, 114, 0, 83, 116, 97, 116, 101, 32, 110, 111, 116, 32, 114, 101, 99, 111, 118, 101, 114, 97, 98, 108, 101, 0, 80, 114, 101, 118, 105, 111, 117, 115, 32, 111, 119, 110, 101, 114, 32, 100, 105, 101, 100, 0, 79, 112, 101, 114, 97, 116, 105, 111, 110, 32, 99, 97, 110, 99, 101, 108, 101, 100, 0, 70, 117, 110, 99, 116, 105, 111, 110, 32, 110, 111, 116, 32, 105, 109, 112, 108, 101, 109, 101, 110, 116, 101, 100, 0, 78, 111, 32, 109, 101, 115, 115, 97, 103, 101, 32, 111, 102, 32, 100, 101, 115, 105, 114, 101, 100, 32, 116, 121, 112, 101, 0, 73, 100, 101, 110, 116, 105, 102, 105, 101, 114, 32, 114, 101, 109, 111, 118, 101, 100, 0, 68, 101, 118, 105, 99, 101, 32, 110, 111, 116, 32, 97, 32, 115, 116, 114, 101, 97, 109, 0, 78, 111, 32, 100, 97, 116, 97, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 68, 101, 118, 105, 99, 101, 32, 116, 105, 109, 101, 111, 117, 116, 0, 79, 117, 116, 32, 111, 102, 32, 115, 116, 114, 101, 97, 109, 115, 32, 114, 101, 115, 111, 117, 114, 99, 101, 115, 0, 76, 105, 110, 107, 32, 104, 97, 115, 32, 98, 101, 101, 110, 32, 115, 101, 118, 101, 114, 101, 100, 0, 80, 114, 111, 116, 111, 99, 111, 108, 32, 101, 114, 114, 111, 114, 0, 66, 97, 100, 32, 109, 101, 115, 115, 97, 103, 101, 0, 70, 105, 108, 101, 32, 100, 101, 115, 99, 114, 105, 112, 116, 111, 114, 32, 105, 110, 32, 98, 97, 100, 32, 115, 116, 97, 116, 101, 0, 78, 111, 116, 32, 97, 32, 115, 111, 99, 107, 101, 116, 0, 68, 101, 115, 116, 105, 110, 97, 116, 105, 111, 110, 32, 97, 100, 100, 114, 101, 115, 115, 32, 114, 101, 113, 117, 105, 114, 101, 100, 0, 77, 101, 115, 115, 97, 103, 101, 32, 116, 111, 111, 32, 108, 97, 114, 103, 101, 0, 80, 114, 111, 116, 111, 99, 111, 108, 32, 119, 114, 111, 110, 103, 32, 116, 121, 112, 101, 32, 102, 111, 114, 32, 115, 111, 99, 107, 101, 116, 0, 80, 114, 111, 116, 111, 99, 111, 108, 32, 110, 111, 116, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 80, 114, 111, 116, 111, 99, 111, 108, 32, 110, 111, 116, 32, 115, 117, 112, 112, 111, 114, 116, 101, 100, 0, 83, 111, 99, 107, 101, 116, 32, 116, 121, 112, 101, 32, 110, 111, 116, 32, 115, 117, 112, 112, 111, 114, 116, 101, 100, 0, 78, 111, 116, 32, 115, 117, 112, 112, 111, 114, 116, 101, 100, 0, 80, 114, 111, 116, 111, 99, 111, 108, 32, 102, 97, 109, 105, 108, 121, 32, 110, 111, 116, 32, 115, 117, 112, 112, 111, 114, 116, 101, 100, 0, 65, 100, 100, 114, 101, 115, 115, 32, 102, 97, 109, 105, 108, 121, 32, 110, 111, 116, 32, 115, 117, 112, 112, 111, 114, 116, 101, 100, 32, 98, 121, 32, 112, 114, 111, 116, 111, 99, 111, 108, 0, 65, 100, 100, 114, 101, 115, 115, 32, 110, 111, 116, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 78, 101, 116, 119, 111, 114, 107, 32, 105, 115, 32, 100, 111, 119, 110, 0, 78, 101, 116, 119, 111, 114, 107, 32, 117, 110, 114, 101, 97, 99, 104, 97, 98, 108, 101, 0, 67, 111, 110, 110, 101, 99, 116, 105, 111, 110, 32, 114, 101, 115, 101, 116, 32, 98, 121, 32, 110, 101, 116, 119, 111, 114, 107, 0, 67, 111, 110, 110, 101, 99, 116, 105, 111, 110, 32, 97, 98, 111, 114, 116, 101, 100, 0, 78, 111, 32, 98, 117, 102, 102, 101, 114, 32, 115, 112, 97, 99, 101, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 83, 111, 99, 107, 101, 116, 32, 105, 115, 32, 99, 111, 110, 110, 101, 99, 116, 101, 100, 0, 83, 111, 99, 107, 101, 116, 32, 110, 111, 116, 32, 99, 111, 110, 110, 101, 99, 116, 101, 100, 0, 67, 97, 110, 110, 111, 116, 32, 115, 101, 110, 100, 32, 97, 102, 116, 101, 114, 32, 115, 111, 99, 107, 101, 116, 32, 115, 104, 117, 116, 100, 111, 119, 110, 0, 79, 112, 101, 114, 97, 116, 105, 111, 110, 32, 97, 108, 114, 101, 97, 100, 121, 32, 105, 110, 32, 112, 114, 111, 103, 114, 101, 115, 115, 0, 79, 112, 101, 114, 97, 116, 105, 111, 110, 32, 105, 110, 32, 112, 114, 111, 103, 114, 101, 115, 115, 0, 83, 116, 97, 108, 101, 32, 102, 105, 108, 101, 32, 104, 97, 110, 100, 108, 101, 0, 82, 101, 109, 111, 116, 101, 32, 73, 47, 79, 32, 101, 114, 114, 111, 114, 0, 81, 117, 111, 116, 97, 32, 101, 120, 99, 101, 101, 100, 101, 100, 0, 78, 111, 32, 109, 101, 100, 105, 117, 109, 32, 102, 111, 117, 110, 100, 0, 87, 114, 111, 110, 103, 32, 109, 101, 100, 105, 117, 109, 32, 116, 121, 112, 101, 0, 78, 111, 32, 101, 114, 114, 111, 114, 32, 105, 110, 102, 111, 114, 109, 97, 116, 105, 111, 110 ], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);
allocate([ 17, 0, 10, 0, 17, 17, 17, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 15, 10, 17, 17, 17, 3, 10, 7, 0, 1, 19, 9, 11, 11, 0, 0, 9, 6, 11, 0, 0, 11, 0, 6, 17, 0, 0, 0, 17, 17, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 10, 10, 17, 17, 17, 0, 10, 0, 0, 2, 0, 9, 11, 0, 0, 0, 9, 0, 11, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 12, 0, 0, 0, 0, 9, 12, 0, 0, 0, 0, 0, 12, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 0, 0, 0, 4, 13, 0, 0, 0, 0, 9, 14, 0, 0, 0, 0, 0, 14, 0, 0, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 9, 16, 0, 0, 0, 0, 0, 16, 0, 0, 16, 0, 0, 18, 0, 0, 0, 18, 18, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 18, 18, 18, 0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 0, 0, 0, 0, 10, 0, 0, 0, 0, 9, 11, 0, 0, 0, 0, 0, 11, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 12, 0, 0, 0, 0, 9, 12, 0, 0, 0, 0, 0, 12, 0, 0, 12, 0, 0, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 65, 66, 67, 68, 69, 70, 45, 43, 32, 32, 32, 48, 88, 48, 120, 0, 40, 110, 117, 108, 108, 41, 0, 45, 48, 88, 43, 48, 88, 32, 48, 88, 45, 48, 120, 43, 48, 120, 32, 48, 120, 0, 105, 110, 102, 0, 73, 78, 70, 0, 110, 97, 110, 0, 78, 65, 78, 0, 46, 0 ], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE + 10900);
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
    GLctx["drawBuffers"](n, bufs);
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
function _glClearColor(x0, x1, x2, x3) {
 GLctx.clearColor(x0, x1, x2, x3);
}
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
function _glUseProgram(program) {
 GLctx.useProgram(program ? GL.programs[program] : null);
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
var _emscripten_asm_const_int = true;
function _glGetProgramInfoLog(program, maxLength, length, infoLog) {
 var log = GLctx.getProgramInfoLog(GL.programs[program]);
 if (log === null) log = "(unknown error)";
 log = log.substr(0, maxLength - 1);
 if (maxLength > 0 && infoLog) {
  writeStringToMemory(log, infoLog);
  if (length) HEAP32[length >> 2] = log.length;
 } else {
  if (length) HEAP32[length >> 2] = 0;
 }
}
var PTHREAD_SPECIFIC = {};
var PTHREAD_SPECIFIC_NEXT_KEY = 1;
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
function _pthread_key_create(key, destructor) {
 if (key == 0) {
  return ERRNO_CODES.EINVAL;
 }
 HEAP32[key >> 2] = PTHREAD_SPECIFIC_NEXT_KEY;
 PTHREAD_SPECIFIC[PTHREAD_SPECIFIC_NEXT_KEY] = 0;
 PTHREAD_SPECIFIC_NEXT_KEY++;
 return 0;
}
function _glClear(x0) {
 GLctx.clear(x0);
}
function _glLineWidth(x0) {
 GLctx.lineWidth(x0);
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
var SYSCALLS = {
 varargs: 0,
 get: (function(varargs) {
  SYSCALLS.varargs += 4;
  var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
  return ret;
 }),
 getStr: (function() {
  var ret = Pointer_stringify(SYSCALLS.get());
  return ret;
 }),
 get64: (function() {
  var low = SYSCALLS.get(), high = SYSCALLS.get();
  if (low >= 0) assert(high === 0); else assert(high === -1);
  return low;
 }),
 getZero: (function() {
  assert(SYSCALLS.get() === 0);
 })
};
function ___syscall54(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  return 0;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
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
function _glUniform3fv(location, count, value) {
 location = GL.uniforms[location];
 var view;
 if (count === 1) {
  view = GL.miniTempBufferViews[2];
  view[0] = HEAPF32[value >> 2];
  view[1] = HEAPF32[value + 4 >> 2];
  view[2] = HEAPF32[value + 8 >> 2];
 } else {
  view = HEAPF32.subarray(value >> 2, value + count * 12 >> 2);
 }
 GLctx.uniform3fv(location, view);
}
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
function _pthread_cleanup_push(routine, arg) {
 __ATEXIT__.push((function() {
  Runtime.dynCall("vi", routine, [ arg ]);
 }));
 _pthread_cleanup_push.level = __ATEXIT__.length;
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
 for (var i = 5; i < emval_handle_array.length; ++i) {
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
function _pthread_cleanup_pop() {
 assert(_pthread_cleanup_push.level == __ATEXIT__.length, "cannot pop if something else added meanwhile!");
 __ATEXIT__.pop();
 _pthread_cleanup_push.level = __ATEXIT__.length;
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
var _tanf = Math_tan;
var _BItoD = true;
Module["_llvm_bswap_i32"] = _llvm_bswap_i32;
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
function __emval_incref(handle) {
 if (handle > 4) {
  emval_handle_array[handle].refcount += 1;
 }
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
function ___setErrNo(value) {
 if (Module["___errno_location"]) HEAP32[Module["___errno_location"]() >> 2] = value;
 return value;
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
 case 79:
  return 0;
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
  var log = GLctx.getProgramInfoLog(GL.programs[program]);
  if (log === null) log = "(unknown error)";
  HEAP32[p >> 2] = log.length + 1;
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
 if (log === null) log = "(unknown error)";
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
var _tan = Math_tan;
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
function _pthread_getspecific(key) {
 return PTHREAD_SPECIFIC[key] || 0;
}
var _sqrtf = Math_sqrt;
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
function _pthread_setspecific(key, value) {
 if (!(key in PTHREAD_SPECIFIC)) {
  return ERRNO_CODES.EINVAL;
 }
 PTHREAD_SPECIFIC[key] = value;
 return 0;
}
function _glAttachShader(program, shader) {
 GLctx.attachShader(GL.programs[program], GL.shaders[shader]);
}
function ___cxa_allocate_exception(size) {
 return _malloc(size);
}
function _glCreateProgram() {
 var id = GL.getNewId(GL.programs);
 var program = GLctx.createProgram();
 program.name = id;
 GL.programs[id] = program;
 return id;
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
function _glUniformMatrix4fv(location, count, transpose, value) {
 location = GL.uniforms[location];
 var view;
 if (count === 1) {
  view = GL.miniTempBufferViews[15];
  for (var i = 0; i < 16; i++) {
   view[i] = HEAPF32[value + i * 4 >> 2];
  }
 } else {
  view = HEAPF32.subarray(value >> 2, value + count * 64 >> 2);
 }
 GLctx.uniformMatrix4fv(location, transpose, view);
}
function ___syscall6(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD();
  FS.close(stream);
  return 0;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
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
function _glGetError() {
 if (GL.lastError) {
  var error = GL.lastError;
  GL.lastError = 0;
  return error;
 } else {
  return GLctx.getError();
 }
}
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
  if (log === null) log = "(unknown error)";
  HEAP32[p >> 2] = log.length + 1;
 } else {
  HEAP32[p >> 2] = GLctx.getShaderParameter(GL.shaders[shader], pname);
 }
}
function _pthread_self() {
 return 0;
}
function ___syscall140(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD(), offset_high = SYSCALLS.get(), offset_low = SYSCALLS.get(), result = SYSCALLS.get(), whence = SYSCALLS.get();
  var offset = offset_low;
  assert(offset_high === 0);
  FS.llseek(stream, offset, whence);
  HEAP32[result >> 2] = stream.position;
  if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
  return 0;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}
function ___syscall146(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.get(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
  var ret = 0;
  if (!___syscall146.buffer) ___syscall146.buffer = [];
  var buffer = ___syscall146.buffer;
  for (var i = 0; i < iovcnt; i++) {
   var ptr = HEAP32[iov + i * 8 >> 2];
   var len = HEAP32[iov + (i * 8 + 4) >> 2];
   for (var j = 0; j < len; j++) {
    var curr = HEAPU8[ptr + j];
    if (curr === 0 || curr === 10) {
     Module["print"](UTF8ArrayToString(buffer, 0));
     buffer.length = 0;
    } else {
     buffer.push(curr);
    }
   }
   ret += len;
  }
  return ret;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}
var GLctx;
GL.init();
embind_init_charCodes();
BindingError = Module["BindingError"] = extendError(Error, "BindingError");
InternalError = Module["InternalError"] = extendError(Error, "InternalError");
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
function invoke_vii(index, a1, a2) {
 try {
  Module["dynCall_vii"](index, a1, a2);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_vif(index, a1, a2) {
 try {
  Module["dynCall_vif"](index, a1, a2);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_vf(index, a1) {
 try {
  Module["dynCall_vf"](index, a1);
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
function invoke_i(index) {
 try {
  return Module["dynCall_i"](index);
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
function invoke_vffff(index, a1, a2, a3, a4) {
 try {
  Module["dynCall_vffff"](index, a1, a2, a3, a4);
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
function invoke_viifff(index, a1, a2, a3, a4, a5) {
 try {
  Module["dynCall_viifff"](index, a1, a2, a3, a4, a5);
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
function invoke_iiiiii(index, a1, a2, a3, a4, a5) {
 try {
  return Module["dynCall_iiiiii"](index, a1, a2, a3, a4, a5);
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
 "invoke_vii": invoke_vii,
 "invoke_vif": invoke_vif,
 "invoke_vf": invoke_vf,
 "invoke_viiiii": invoke_viiiii,
 "invoke_i": invoke_i,
 "invoke_vfff": invoke_vfff,
 "invoke_vffff": invoke_vffff,
 "invoke_ii": invoke_ii,
 "invoke_viifff": invoke_viifff,
 "invoke_v": invoke_v,
 "invoke_vifff": invoke_vifff,
 "invoke_viiiiii": invoke_viiiiii,
 "invoke_iii": invoke_iii,
 "invoke_iiiiii": invoke_iiiiii,
 "invoke_viiii": invoke_viiii,
 "_glUseProgram": _glUseProgram,
 "floatReadValueFromPointer": floatReadValueFromPointer,
 "simpleReadValueFromPointer": simpleReadValueFromPointer,
 "__emval_call_void_method": __emval_call_void_method,
 "_pthread_key_create": _pthread_key_create,
 "throwInternalError": throwInternalError,
 "get_first_emval": get_first_emval,
 "_glUniformMatrix4fv": _glUniformMatrix4fv,
 "___cxa_guard_acquire": ___cxa_guard_acquire,
 "_glLineWidth": _glLineWidth,
 "getLiveInheritedInstances": getLiveInheritedInstances,
 "___assert_fail": ___assert_fail,
 "__ZSt18uncaught_exceptionv": __ZSt18uncaught_exceptionv,
 "ClassHandle": ClassHandle,
 "getShiftFromSize": getShiftFromSize,
 "_glBindBuffer": _glBindBuffer,
 "_glGetShaderInfoLog": _glGetShaderInfoLog,
 "_emscripten_set_main_loop_timing": _emscripten_set_main_loop_timing,
 "_sbrk": _sbrk,
 "___cxa_begin_catch": ___cxa_begin_catch,
 "_emscripten_memcpy_big": _emscripten_memcpy_big,
 "runDestructor": runDestructor,
 "_sysconf": _sysconf,
 "throwInstanceAlreadyDeleted": throwInstanceAlreadyDeleted,
 "RegisteredPointer_fromWireType": RegisteredPointer_fromWireType,
 "_tanf": _tanf,
 "init_RegisteredPointer": init_RegisteredPointer,
 "getStringOrSymbol": getStringOrSymbol,
 "flushPendingDeletes": flushPendingDeletes,
 "makeClassHandle": makeClassHandle,
 "whenDependentTypesAreResolved": whenDependentTypesAreResolved,
 "_glGenBuffers": _glGenBuffers,
 "_glShaderSource": _glShaderSource,
 "__emval_allocateDestructors": __emval_allocateDestructors,
 "init_ClassHandle": init_ClassHandle,
 "_pthread_cleanup_push": _pthread_cleanup_push,
 "___syscall140": ___syscall140,
 "constNoSmartPtrRawPointerToWireType": constNoSmartPtrRawPointerToWireType,
 "___syscall146": ___syscall146,
 "_pthread_cleanup_pop": _pthread_cleanup_pop,
 "_glGenerateMipmap": _glGenerateMipmap,
 "_glVertexAttribPointer": _glVertexAttribPointer,
 "_glGetProgramInfoLog": _glGetProgramInfoLog,
 "requireHandle": requireHandle,
 "RegisteredClass": RegisteredClass,
 "___cxa_find_matching_catch": ___cxa_find_matching_catch,
 "___cxa_guard_release": ___cxa_guard_release,
 "__emval_as": __emval_as,
 "___setErrNo": ___setErrNo,
 "readLatin1String": readLatin1String,
 "_glDeleteTextures": _glDeleteTextures,
 "__embind_register_bool": __embind_register_bool,
 "___resumeException": ___resumeException,
 "createNamedFunction": createNamedFunction,
 "embind_init_charCodes": embind_init_charCodes,
 "__emval_decref": __emval_decref,
 "_pthread_once": _pthread_once,
 "_glGenTextures": _glGenTextures,
 "init_embind": init_embind,
 "ClassHandle_clone": ClassHandle_clone,
 "__emval_addMethodCaller": __emval_addMethodCaller,
 "heap32VectorToArray": heap32VectorToArray,
 "__emval_lookupTypes": __emval_lookupTypes,
 "__emval_run_destructors": __emval_run_destructors,
 "ClassHandle_delete": ClassHandle_delete,
 "_glCreateProgram": _glCreateProgram,
 "RegisteredPointer_destructor": RegisteredPointer_destructor,
 "___syscall6": ___syscall6,
 "ensureOverloadTable": ensureOverloadTable,
 "__embind_register_emval": __embind_register_emval,
 "_time": _time,
 "new_": new_,
 "downcastPointer": downcastPointer,
 "replacePublicSymbol": replacePublicSymbol,
 "_emscripten_asm_const_2": _emscripten_asm_const_2,
 "__embind_register_class": __embind_register_class,
 "ClassHandle_deleteLater": ClassHandle_deleteLater,
 "___syscall54": ___syscall54,
 "RegisteredPointer_deleteObject": RegisteredPointer_deleteObject,
 "ClassHandle_isDeleted": ClassHandle_isDeleted,
 "__embind_register_integer": __embind_register_integer,
 "___cxa_allocate_exception": ___cxa_allocate_exception,
 "_glUniform3fv": _glUniform3fv,
 "_glClearColor": _glClearColor,
 "_glBindTexture": _glBindTexture,
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
 "_sqrtf": _sqrtf,
 "upcastPointer": upcastPointer,
 "_glActiveTexture": _glActiveTexture,
 "init_emval": init_emval,
 "shallowCopyInternalPointer": shallowCopyInternalPointer,
 "nonConstNoSmartPtrRawPointerToWireType": nonConstNoSmartPtrRawPointerToWireType,
 "_tan": _tan,
 "_glCompileShader": _glCompileShader,
 "_glEnableVertexAttribArray": _glEnableVertexAttribArray,
 "_abort": _abort,
 "throwBindingError": throwBindingError,
 "_glDeleteBuffers": _glDeleteBuffers,
 "_glBufferData": _glBufferData,
 "_glTexImage2D": _glTexImage2D,
 "exposePublicSymbol": exposePublicSymbol,
 "__embind_register_std_string": __embind_register_std_string,
 "__emval_get_method_caller": __emval_get_method_caller,
 "_glGetProgramiv": _glGetProgramiv,
 "__embind_register_memory_view": __embind_register_memory_view,
 "getInheritedInstance": getInheritedInstance,
 "_glGetActiveUniform": _glGetActiveUniform,
 "setDelayFunction": setDelayFunction,
 "extendError": extendError,
 "__embind_register_void": __embind_register_void,
 "_glLinkProgram": _glLinkProgram,
 "_glGetError": _glGetError,
 "RegisteredPointer_getPointee": RegisteredPointer_getPointee,
 "__emval_register": __emval_register,
 "_glGetUniformLocation": _glGetUniformLocation,
 "_glClear": _glClear,
 "ClassHandle_isAliasOf": ClassHandle_isAliasOf,
 "_embind_repr": _embind_repr,
 "__emval_incref": __emval_incref,
 "RegisteredPointer": RegisteredPointer,
 "_glBindAttribLocation": _glBindAttribLocation,
 "_glGetShaderiv": _glGetShaderiv,
 "__embind_register_class_class_function": __embind_register_class_class_function,
 "_pthread_self": _pthread_self,
 "getBasestPointer": getBasestPointer,
 "getInheritedInstanceCount": getInheritedInstanceCount,
 "__embind_register_float": __embind_register_float,
 "integerReadValueFromPointer": integerReadValueFromPointer,
 "__embind_register_std_wstring": __embind_register_std_wstring,
 "_emscripten_set_main_loop": _emscripten_set_main_loop,
 "_pthread_setspecific": _pthread_setspecific,
 "genericPointerToWireType": genericPointerToWireType,
 "registerType": registerType,
 "___cxa_throw": ___cxa_throw,
 "count_emval_handles": count_emval_handles,
 "requireFunction": requireFunction,
 "_glTexParameteri": _glTexParameteri,
 "STACKTOP": STACKTOP,
 "STACK_MAX": STACK_MAX,
 "tempDoublePtr": tempDoublePtr,
 "ABORT": ABORT,
 "cttz_i8": cttz_i8
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
  var invoke_vii=env.invoke_vii;
  var invoke_vif=env.invoke_vif;
  var invoke_vf=env.invoke_vf;
  var invoke_viiiii=env.invoke_viiiii;
  var invoke_i=env.invoke_i;
  var invoke_vfff=env.invoke_vfff;
  var invoke_vffff=env.invoke_vffff;
  var invoke_ii=env.invoke_ii;
  var invoke_viifff=env.invoke_viifff;
  var invoke_v=env.invoke_v;
  var invoke_vifff=env.invoke_vifff;
  var invoke_viiiiii=env.invoke_viiiiii;
  var invoke_iii=env.invoke_iii;
  var invoke_iiiiii=env.invoke_iiiiii;
  var invoke_viiii=env.invoke_viiii;
  var _glUseProgram=env._glUseProgram;
  var floatReadValueFromPointer=env.floatReadValueFromPointer;
  var simpleReadValueFromPointer=env.simpleReadValueFromPointer;
  var __emval_call_void_method=env.__emval_call_void_method;
  var _pthread_key_create=env._pthread_key_create;
  var throwInternalError=env.throwInternalError;
  var get_first_emval=env.get_first_emval;
  var _glUniformMatrix4fv=env._glUniformMatrix4fv;
  var ___cxa_guard_acquire=env.___cxa_guard_acquire;
  var _glLineWidth=env._glLineWidth;
  var getLiveInheritedInstances=env.getLiveInheritedInstances;
  var ___assert_fail=env.___assert_fail;
  var __ZSt18uncaught_exceptionv=env.__ZSt18uncaught_exceptionv;
  var ClassHandle=env.ClassHandle;
  var getShiftFromSize=env.getShiftFromSize;
  var _glBindBuffer=env._glBindBuffer;
  var _glGetShaderInfoLog=env._glGetShaderInfoLog;
  var _emscripten_set_main_loop_timing=env._emscripten_set_main_loop_timing;
  var _sbrk=env._sbrk;
  var ___cxa_begin_catch=env.___cxa_begin_catch;
  var _emscripten_memcpy_big=env._emscripten_memcpy_big;
  var runDestructor=env.runDestructor;
  var _sysconf=env._sysconf;
  var throwInstanceAlreadyDeleted=env.throwInstanceAlreadyDeleted;
  var RegisteredPointer_fromWireType=env.RegisteredPointer_fromWireType;
  var _tanf=env._tanf;
  var init_RegisteredPointer=env.init_RegisteredPointer;
  var getStringOrSymbol=env.getStringOrSymbol;
  var flushPendingDeletes=env.flushPendingDeletes;
  var makeClassHandle=env.makeClassHandle;
  var whenDependentTypesAreResolved=env.whenDependentTypesAreResolved;
  var _glGenBuffers=env._glGenBuffers;
  var _glShaderSource=env._glShaderSource;
  var __emval_allocateDestructors=env.__emval_allocateDestructors;
  var init_ClassHandle=env.init_ClassHandle;
  var _pthread_cleanup_push=env._pthread_cleanup_push;
  var ___syscall140=env.___syscall140;
  var constNoSmartPtrRawPointerToWireType=env.constNoSmartPtrRawPointerToWireType;
  var ___syscall146=env.___syscall146;
  var _pthread_cleanup_pop=env._pthread_cleanup_pop;
  var _glGenerateMipmap=env._glGenerateMipmap;
  var _glVertexAttribPointer=env._glVertexAttribPointer;
  var _glGetProgramInfoLog=env._glGetProgramInfoLog;
  var requireHandle=env.requireHandle;
  var RegisteredClass=env.RegisteredClass;
  var ___cxa_find_matching_catch=env.___cxa_find_matching_catch;
  var ___cxa_guard_release=env.___cxa_guard_release;
  var __emval_as=env.__emval_as;
  var ___setErrNo=env.___setErrNo;
  var readLatin1String=env.readLatin1String;
  var _glDeleteTextures=env._glDeleteTextures;
  var __embind_register_bool=env.__embind_register_bool;
  var ___resumeException=env.___resumeException;
  var createNamedFunction=env.createNamedFunction;
  var embind_init_charCodes=env.embind_init_charCodes;
  var __emval_decref=env.__emval_decref;
  var _pthread_once=env._pthread_once;
  var _glGenTextures=env._glGenTextures;
  var init_embind=env.init_embind;
  var ClassHandle_clone=env.ClassHandle_clone;
  var __emval_addMethodCaller=env.__emval_addMethodCaller;
  var heap32VectorToArray=env.heap32VectorToArray;
  var __emval_lookupTypes=env.__emval_lookupTypes;
  var __emval_run_destructors=env.__emval_run_destructors;
  var ClassHandle_delete=env.ClassHandle_delete;
  var _glCreateProgram=env._glCreateProgram;
  var RegisteredPointer_destructor=env.RegisteredPointer_destructor;
  var ___syscall6=env.___syscall6;
  var ensureOverloadTable=env.ensureOverloadTable;
  var __embind_register_emval=env.__embind_register_emval;
  var _time=env._time;
  var new_=env.new_;
  var downcastPointer=env.downcastPointer;
  var replacePublicSymbol=env.replacePublicSymbol;
  var _emscripten_asm_const_2=env._emscripten_asm_const_2;
  var __embind_register_class=env.__embind_register_class;
  var ClassHandle_deleteLater=env.ClassHandle_deleteLater;
  var ___syscall54=env.___syscall54;
  var RegisteredPointer_deleteObject=env.RegisteredPointer_deleteObject;
  var ClassHandle_isDeleted=env.ClassHandle_isDeleted;
  var __embind_register_integer=env.__embind_register_integer;
  var ___cxa_allocate_exception=env.___cxa_allocate_exception;
  var _glUniform3fv=env._glUniform3fv;
  var _glClearColor=env._glClearColor;
  var _glBindTexture=env._glBindTexture;
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
  var _sqrtf=env._sqrtf;
  var upcastPointer=env.upcastPointer;
  var _glActiveTexture=env._glActiveTexture;
  var init_emval=env.init_emval;
  var shallowCopyInternalPointer=env.shallowCopyInternalPointer;
  var nonConstNoSmartPtrRawPointerToWireType=env.nonConstNoSmartPtrRawPointerToWireType;
  var _tan=env._tan;
  var _glCompileShader=env._glCompileShader;
  var _glEnableVertexAttribArray=env._glEnableVertexAttribArray;
  var _abort=env._abort;
  var throwBindingError=env.throwBindingError;
  var _glDeleteBuffers=env._glDeleteBuffers;
  var _glBufferData=env._glBufferData;
  var _glTexImage2D=env._glTexImage2D;
  var exposePublicSymbol=env.exposePublicSymbol;
  var __embind_register_std_string=env.__embind_register_std_string;
  var __emval_get_method_caller=env.__emval_get_method_caller;
  var _glGetProgramiv=env._glGetProgramiv;
  var __embind_register_memory_view=env.__embind_register_memory_view;
  var getInheritedInstance=env.getInheritedInstance;
  var _glGetActiveUniform=env._glGetActiveUniform;
  var setDelayFunction=env.setDelayFunction;
  var extendError=env.extendError;
  var __embind_register_void=env.__embind_register_void;
  var _glLinkProgram=env._glLinkProgram;
  var _glGetError=env._glGetError;
  var RegisteredPointer_getPointee=env.RegisteredPointer_getPointee;
  var __emval_register=env.__emval_register;
  var _glGetUniformLocation=env._glGetUniformLocation;
  var _glClear=env._glClear;
  var ClassHandle_isAliasOf=env.ClassHandle_isAliasOf;
  var _embind_repr=env._embind_repr;
  var __emval_incref=env.__emval_incref;
  var RegisteredPointer=env.RegisteredPointer;
  var _glBindAttribLocation=env._glBindAttribLocation;
  var _glGetShaderiv=env._glGetShaderiv;
  var __embind_register_class_class_function=env.__embind_register_class_class_function;
  var _pthread_self=env._pthread_self;
  var getBasestPointer=env.getBasestPointer;
  var getInheritedInstanceCount=env.getInheritedInstanceCount;
  var __embind_register_float=env.__embind_register_float;
  var integerReadValueFromPointer=env.integerReadValueFromPointer;
  var __embind_register_std_wstring=env.__embind_register_std_wstring;
  var _emscripten_set_main_loop=env._emscripten_set_main_loop;
  var _pthread_setspecific=env._pthread_setspecific;
  var genericPointerToWireType=env.genericPointerToWireType;
  var registerType=env.registerType;
  var ___cxa_throw=env.___cxa_throw;
  var count_emval_handles=env.count_emval_handles;
  var requireFunction=env.requireFunction;
  var _glTexParameteri=env._glTexParameteri;
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

function _lodepng_decode(i90, i88, i89, i91, i66, i67) {
 i90 = i90 | 0;
 i88 = i88 | 0;
 i89 = i89 | 0;
 i91 = i91 | 0;
 i66 = i66 | 0;
 i67 = i67 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, i42 = 0, i43 = 0, i44 = 0, i45 = 0, i46 = 0, i47 = 0, i48 = 0, i49 = 0, i50 = 0, i51 = 0, i52 = 0, i53 = 0, i54 = 0, i55 = 0, i56 = 0, i57 = 0, i58 = 0, i59 = 0, i60 = 0, i61 = 0, i62 = 0, i63 = 0, i64 = 0, i65 = 0, i68 = 0, i69 = 0, i70 = 0, i71 = 0, i72 = 0, i73 = 0, i74 = 0, i75 = 0, i76 = 0, i77 = 0, i78 = 0, i79 = 0, i80 = 0, i81 = 0, i82 = 0, i83 = 0, i84 = 0, i85 = 0, i86 = 0, i87 = 0, i92 = 0, i93 = 0;
 i93 = STACKTOP;
 STACKTOP = STACKTOP + 320 | 0;
 i83 = i93 + 292 | 0;
 i84 = i93 + 264 | 0;
 i77 = i93 + 232 | 0;
 i79 = i93 + 200 | 0;
 i85 = i93 + 168 | 0;
 i82 = i93 + 140 | 0;
 i80 = i93 + 112 | 0;
 i76 = i93 + 80 | 0;
 i78 = i93 + 48 | 0;
 i81 = i93 + 16 | 0;
 i86 = i93;
 HEAP32[i90 >> 2] = 0;
 i1 = _lodepng_inspect(i88, i89, i91, i66, i67) | 0;
 i92 = i91 + 288 | 0;
 HEAP32[i92 >> 2] = i1;
 do if (!i1) {
  i69 = HEAP32[i88 >> 2] | 0;
  i68 = HEAP32[i89 >> 2] | 0;
  i9 = Math_imul(i68, i69) | 0;
  if ((i68 | 0) != 0 ? ((i9 >>> 0) / (i68 >>> 0) | 0 | 0) != (i69 | 0) : 0) {
   HEAP32[i92 >> 2] = 92;
   i1 = 92;
   break;
  }
  if (i9 >>> 0 > 268435455) {
   HEAP32[i92 >> 2] = 92;
   i1 = 92;
   break;
  }
  i32 = i66;
  i33 = i91 + 16 | 0;
  i34 = i91 + 148 | 0;
  i65 = i91 + 152 | 0;
  i69 = i91 + 140 | 0;
  i35 = i91 + 156 | 0;
  i36 = i91 + 168 | 0;
  i37 = i91 + 164 | 0;
  i38 = i91 + 160 | 0;
  i39 = i91 + 172 | 0;
  i40 = i91 + 184 | 0;
  i41 = i91 + 180 | 0;
  i42 = i91 + 176 | 0;
  i43 = i91 + 24 | 0;
  i44 = i91 + 128 | 0;
  i45 = i83 + 8 | 0;
  i46 = i83 + 4 | 0;
  i68 = i91 + 4 | 0;
  i47 = i83 + 8 | 0;
  i48 = i83 + 4 | 0;
  i49 = i91 + 220 | 0;
  i50 = i91 + 224 | 0;
  i51 = i91 + 228 | 0;
  i52 = i91 + 232 | 0;
  i53 = i91 + 236 | 0;
  i54 = i91 + 240 | 0;
  i55 = i91 + 244 | 0;
  i56 = i91 + 248 | 0;
  i57 = i91 + 252 | 0;
  i58 = i91 + 256 | 0;
  i59 = i91 + 260 | 0;
  i60 = i91 + 28 | 0;
  i20 = 0;
  i8 = 0;
  i9 = 0;
  i64 = i66 + 33 | 0;
  i19 = 1;
  i18 = 0;
  L10 : while (1) {
   i26 = i64 - i32 + 12 | 0;
   i31 = i64 >>> 0 < i66 >>> 0 | i26 >>> 0 > i67 >>> 0;
   i61 = i64 + 1 | 0;
   i62 = i64 + 2 | 0;
   i63 = i64 + 3 | 0;
   i25 = i64 + 8 | 0;
   i10 = i64 + 4 | 0;
   i7 = i64 + 5 | 0;
   i6 = i64 + 6 | 0;
   i5 = i64 + 7 | 0;
   i4 = i64 + 9 | 0;
   i3 = i64 + 10 | 0;
   i2 = i64 + 11 | 0;
   i1 = i64 + 12 | 0;
   i27 = i64 + 13 | 0;
   i28 = i64 + 14 | 0;
   i29 = i64 + 15 | 0;
   i30 = i64 + 16 | 0;
   i17 = 0;
   while (1) {
    if (i17 << 24 >> 24) break L10;
    if (HEAP32[i92 >> 2] | 0) break L10;
    if (i31) {
     i70 = 12;
     break L10;
    }
    i22 = HEAPU8[i61 >> 0] << 16 | HEAPU8[i64 >> 0] << 24 | HEAPU8[i62 >> 0] << 8 | HEAPU8[i63 >> 0];
    if ((i22 | 0) < 0) {
     i70 = 14;
     break L10;
    }
    if ((i22 + i26 | 0) >>> 0 > i67 >>> 0) {
     i70 = 17;
     break L10;
    }
    i13 = i22 + 12 | 0;
    if ((i64 + i13 | 0) >>> 0 < i66 >>> 0) {
     i70 = 17;
     break L10;
    }
    i17 = HEAP8[i10 >> 0] | 0;
    L20 : do switch (i17 << 24 >> 24) {
    case 73:
     {
      switch (HEAP8[i7 >> 0] | 0) {
      case 68:
       break;
      case 69:
       {
        if ((HEAP8[i6 >> 0] | 0) != 78) {
         i70 = 168;
         break L10;
        }
        if ((HEAP8[i5 >> 0] | 0) == 68) {
         i21 = 1;
         break L20;
        } else {
         i70 = 168;
         break L10;
        }
       }
      default:
       {
        i70 = 168;
        break L10;
       }
      }
      if ((HEAP8[i6 >> 0] | 0) != 65) {
       i70 = 168;
       break L10;
      }
      if ((HEAP8[i5 >> 0] | 0) != 84) {
       i70 = 168;
       break L10;
      }
      i17 = i22 + i8 | 0;
      if (i20 >>> 0 < i17 >>> 0) {
       i20 = i20 << 1 >>> 0 < i17 >>> 0 ? i17 : (i17 * 3 | 0) >>> 1;
       i19 = _realloc(i9, i20) | 0;
       if (!i19) {
        i70 = 25;
        break L10;
       } else i9 = i19;
      }
      if (!i22) {
       i8 = i17;
       i21 = 0;
       i19 = 3;
      } else {
       i19 = 0;
       do {
        HEAP8[i9 + (i19 + i8) >> 0] = HEAP8[i64 + (i19 + 8) >> 0] | 0;
        i19 = i19 + 1 | 0;
       } while ((i19 | 0) != (i22 | 0));
       i8 = i17;
       i21 = 0;
       i19 = 3;
      }
      break;
     }
    case 80:
     {
      if ((HEAP8[i7 >> 0] | 0) != 76) {
       i70 = 168;
       break L10;
      }
      if ((HEAP8[i6 >> 0] | 0) != 84) {
       i70 = 168;
       break L10;
      }
      if ((HEAP8[i5 >> 0] | 0) != 69) {
       i70 = 168;
       break L10;
      }
      i19 = HEAP32[i34 >> 2] | 0;
      if (i19) _free(i19);
      i19 = (i22 >>> 0) / 3 | 0;
      HEAP32[i65 >> 2] = i19;
      i19 = _malloc(i19 << 2) | 0;
      HEAP32[i34 >> 2] = i19;
      L40 : do if (!i19) {
       if (i22 >>> 0 >= 3) {
        i70 = 36;
        break L10;
       }
      } else {
       if (i22 >>> 0 > 770) {
        i7 = 38;
        i70 = 42;
        break L10;
       }
       if (i22 >>> 0 < 3) break; else {
        i17 = 0;
        i16 = 0;
       }
       while (1) {
        i24 = i17 << 2;
        HEAP8[i19 + i24 >> 0] = HEAP8[i64 + (i16 + 8) >> 0] | 0;
        HEAP8[(HEAP32[i34 >> 2] | 0) + (i24 | 1) >> 0] = HEAP8[i64 + (i16 + 9) >> 0] | 0;
        HEAP8[(HEAP32[i34 >> 2] | 0) + (i24 | 2) >> 0] = HEAP8[i64 + (i16 + 10) >> 0] | 0;
        HEAP8[(HEAP32[i34 >> 2] | 0) + (i24 | 3) >> 0] = -1;
        i17 = i17 + 1 | 0;
        if ((i17 | 0) == (HEAP32[i65 >> 2] | 0)) break L40;
        i19 = HEAP32[i34 >> 2] | 0;
        i16 = i16 + 3 | 0;
       }
      } while (0);
      HEAP32[i92 >> 2] = 0;
      i21 = 0;
      i19 = 2;
      break;
     }
    case 116:
     switch (HEAP8[i7 >> 0] | 0) {
     case 82:
      {
       if ((HEAP8[i6 >> 0] | 0) != 78) {
        i70 = 169;
        break L20;
       }
       if ((HEAP8[i5 >> 0] | 0) != 83) {
        i70 = 167;
        break L20;
       }
       switch (HEAP32[i69 >> 2] | 0) {
       case 3:
        {
         if ((HEAP32[i65 >> 2] | 0) >>> 0 < i22 >>> 0) {
          i7 = 38;
          i70 = 55;
          break L10;
         }
         if (i22) {
          i17 = 0;
          do {
           HEAP8[(HEAP32[i34 >> 2] | 0) + (i17 << 2 | 3) >> 0] = HEAP8[i64 + (i17 + 8) >> 0] | 0;
           i17 = i17 + 1 | 0;
          } while ((i17 | 0) != (i22 | 0));
         }
         break;
        }
       case 0:
        {
         if ((i22 | 0) != 2) {
          i7 = 30;
          i70 = 55;
          break L10;
         }
         HEAP32[i35 >> 2] = 1;
         i24 = HEAPU8[i25 >> 0] << 8 | HEAPU8[i4 >> 0];
         HEAP32[i36 >> 2] = i24;
         HEAP32[i37 >> 2] = i24;
         HEAP32[i38 >> 2] = i24;
         break;
        }
       case 2:
        {
         if ((i22 | 0) != 6) {
          i7 = 41;
          i70 = 55;
          break L10;
         }
         HEAP32[i35 >> 2] = 1;
         HEAP32[i38 >> 2] = HEAPU8[i25 >> 0] << 8 | HEAPU8[i4 >> 0];
         HEAP32[i37 >> 2] = HEAPU8[i3 >> 0] << 8 | HEAPU8[i2 >> 0];
         HEAP32[i36 >> 2] = HEAPU8[i1 >> 0] << 8 | HEAPU8[i27 >> 0];
         break;
        }
       default:
        {
         i7 = 42;
         i70 = 55;
         break L10;
        }
       }
       HEAP32[i92 >> 2] = 0;
       i21 = 0;
       break L20;
      }
     case 69:
      {
       if ((HEAP8[i6 >> 0] | 0) != 88) {
        i70 = 169;
        break L20;
       }
       if ((HEAP8[i5 >> 0] | 0) != 116) {
        i70 = 167;
        break L20;
       }
       if (!(HEAP32[i43 >> 2] | 0)) {
        i21 = 0;
        break L20;
       }
       do if (i22) {
        i17 = 0;
        do {
         if (!(HEAP8[i64 + (i17 + 8) >> 0] | 0)) break;
         i17 = i17 + 1 | 0;
        } while (i17 >>> 0 < i22 >>> 0);
        if ((i17 + -1 | 0) >>> 0 <= 78) {
         i14 = i17 + 1 | 0;
         i16 = _malloc(i14) | 0;
         if (!i16) {
          i15 = 83;
          i16 = 0;
          i17 = 0;
          break;
         }
         HEAP8[i16 + i17 >> 0] = 0;
         if (i17) _memcpy(i16 | 0, i25 | 0, i17 | 0) | 0;
         i15 = i22 >>> 0 < i14 >>> 0 ? 0 : i22 - i14 | 0;
         i13 = _malloc(i15 + 1 | 0) | 0;
         if (!i13) {
          i15 = 83;
          i17 = 0;
          break;
         }
         HEAP8[i13 + i15 >> 0] = 0;
         if (i15) _memcpy(i13 | 0, i64 + (i17 + 9) | 0, (i22 >>> 0 > i14 >>> 0 ? i22 : i14) + ~i17 | 0) | 0;
         i15 = _lodepng_add_text(i44, i16, i13) | 0;
         i17 = i13;
        } else {
         i15 = 89;
         i16 = 0;
         i17 = 0;
        }
       } else {
        i15 = 89;
        i16 = 0;
        i17 = 0;
       } while (0);
       _free(i16);
       _free(i17);
       HEAP32[i92 >> 2] = i15;
       if (!i15) {
        i21 = 0;
        break L20;
       } else break L10;
      }
     case 73:
      {
       if ((HEAP8[i6 >> 0] | 0) != 77) {
        i70 = 169;
        break L20;
       }
       if ((HEAP8[i5 >> 0] | 0) != 69) {
        i70 = 169;
        break L20;
       }
       if ((i22 | 0) != 7) {
        i70 = 159;
        break L10;
       }
       HEAP32[i49 >> 2] = 1;
       HEAP32[i50 >> 2] = HEAPU8[i25 >> 0] << 8 | HEAPU8[i4 >> 0];
       HEAP32[i51 >> 2] = HEAPU8[i3 >> 0];
       HEAP32[i52 >> 2] = HEAPU8[i2 >> 0];
       HEAP32[i53 >> 2] = HEAPU8[i1 >> 0];
       HEAP32[i54 >> 2] = HEAPU8[i27 >> 0];
       HEAP32[i55 >> 2] = HEAPU8[i28 >> 0];
       HEAP32[i92 >> 2] = 0;
       i21 = 0;
       break L20;
      }
     default:
      {
       i70 = 169;
       break L20;
      }
     }
    case 98:
     {
      if (((HEAP8[i7 >> 0] | 0) == 75 ? (HEAP8[i6 >> 0] | 0) == 71 : 0) ? (HEAP8[i5 >> 0] | 0) == 68 : 0) {
       switch (HEAP32[i69 >> 2] | 0) {
       case 3:
        {
         if ((i22 | 0) != 1) {
          i7 = 43;
          i70 = 67;
          break L10;
         }
         HEAP32[i39 >> 2] = 1;
         i24 = HEAPU8[i25 >> 0] | 0;
         HEAP32[i40 >> 2] = i24;
         HEAP32[i41 >> 2] = i24;
         HEAP32[i42 >> 2] = i24;
         break;
        }
       case 4:
       case 0:
        {
         if ((i22 | 0) != 2) {
          i7 = 44;
          i70 = 67;
          break L10;
         }
         HEAP32[i39 >> 2] = 1;
         i24 = HEAPU8[i25 >> 0] << 8 | HEAPU8[i4 >> 0];
         HEAP32[i40 >> 2] = i24;
         HEAP32[i41 >> 2] = i24;
         HEAP32[i42 >> 2] = i24;
         break;
        }
       case 6:
       case 2:
        {
         if ((i22 | 0) != 6) {
          i7 = 45;
          i70 = 67;
          break L10;
         }
         HEAP32[i39 >> 2] = 1;
         HEAP32[i42 >> 2] = HEAPU8[i25 >> 0] << 8 | HEAPU8[i4 >> 0];
         HEAP32[i41 >> 2] = HEAPU8[i3 >> 0] << 8 | HEAPU8[i2 >> 0];
         HEAP32[i40 >> 2] = HEAPU8[i1 >> 0] << 8 | HEAPU8[i27 >> 0];
         break;
        }
       default:
        {}
       }
       HEAP32[i92 >> 2] = 0;
       i21 = 0;
      } else i70 = 169;
      break;
     }
    case 122:
     {
      if (((HEAP8[i7 >> 0] | 0) == 84 ? (HEAP8[i6 >> 0] | 0) == 88 : 0) ? (HEAP8[i5 >> 0] | 0) == 116 : 0) if (HEAP32[i43 >> 2] | 0) {
       HEAP32[i83 >> 2] = 0;
       HEAP32[i45 >> 2] = 0;
       HEAP32[i46 >> 2] = 0;
       L103 : do if (!i22) i17 = 0; else {
        i17 = 0;
        do {
         if (!(HEAP8[i64 + (i17 + 8) >> 0] | 0)) break L103;
         i17 = i17 + 1 | 0;
        } while (i17 >>> 0 < i22 >>> 0);
       } while (0);
       i15 = i17 + 2 | 0;
       do if (i22 >>> 0 > i15 >>> 0) {
        if ((i17 + -1 | 0) >>> 0 > 78) {
         i17 = 89;
         i16 = 0;
         break;
        }
        i16 = _malloc(i17 + 1 | 0) | 0;
        if (!i16) {
         i17 = 83;
         i16 = 0;
         break;
        }
        HEAP8[i16 + i17 >> 0] = 0;
        if (i17) _memcpy(i16 | 0, i25 | 0, i17 | 0) | 0;
        if (HEAP8[i64 + (i17 + 9) >> 0] | 0) {
         i17 = 72;
         break;
        }
        if (i22 >>> 0 < i15 >>> 0) {
         i17 = 75;
         break;
        }
        i14 = i22 - i15 | 0;
        i17 = i64 + (i17 + 10) | 0;
        i15 = HEAP32[i68 >> 2] | 0;
        if (!i15) i17 = _lodepng_zlib_decompress(i83, i46, i17, i14, i91) | 0; else i17 = FUNCTION_TABLE_iiiiii[i15 & 0](i83, i46, i17, i14, i91) | 0;
        if (i17) break;
        i14 = HEAP32[i46 >> 2] | 0;
        i13 = i14 + 1 | 0;
        i17 = HEAP32[i45 >> 2] | 0;
        do if (i17 >>> 0 < i13 >>> 0) {
         i15 = i17 << 1 >>> 0 < i13 >>> 0 ? i13 : (i13 * 3 | 0) >>> 1;
         i17 = _realloc(HEAP32[i83 >> 2] | 0, i15) | 0;
         if (!i17) break;
         HEAP32[i45 >> 2] = i15;
         HEAP32[i83 >> 2] = i17;
         i70 = 105;
        } else {
         i17 = HEAP32[i83 >> 2] | 0;
         i70 = 105;
        } while (0);
        if ((i70 | 0) == 105) {
         i70 = 0;
         HEAP32[i46 >> 2] = i13;
         HEAP8[i17 + i14 >> 0] = 0;
        }
        i17 = _lodepng_add_text(i44, i16, HEAP32[i83 >> 2] | 0) | 0;
       } else {
        i17 = 75;
        i16 = 0;
       } while (0);
       _free(i16);
       HEAP32[i45 >> 2] = 0;
       HEAP32[i46 >> 2] = 0;
       _free(HEAP32[i83 >> 2] | 0);
       HEAP32[i92 >> 2] = i17;
       if (i17) break L10; else i21 = 0;
      } else i21 = 0; else i70 = 169;
      break;
     }
    case 105:
     {
      if (((HEAP8[i7 >> 0] | 0) == 84 ? (HEAP8[i6 >> 0] | 0) == 88 : 0) ? (HEAP8[i5 >> 0] | 0) == 116 : 0) if (HEAP32[i43 >> 2] | 0) {
       HEAP32[i83 >> 2] = 0;
       HEAP32[i47 >> 2] = 0;
       HEAP32[i48 >> 2] = 0;
       L135 : do if (i22 >>> 0 >= 5) {
        i17 = 0;
        do {
         if (!(HEAP8[i64 + (i17 + 8) >> 0] | 0)) break;
         i17 = i17 + 1 | 0;
        } while (i17 >>> 0 < i22 >>> 0);
        i21 = i17 + 3 | 0;
        if (i21 >>> 0 < i22 >>> 0) {
         if ((i17 + -1 | 0) >>> 0 > 78) {
          i17 = 89;
          i14 = 0;
          i15 = 0;
          i16 = 0;
          break;
         }
         i24 = _malloc(i17 + 1 | 0) | 0;
         if (!i24) {
          i17 = 83;
          i14 = 0;
          i15 = 0;
          i16 = 0;
          break;
         }
         HEAP8[i24 + i17 >> 0] = 0;
         if (i17) _memcpy(i24 | 0, i25 | 0, i17 | 0) | 0;
         i23 = HEAP8[i64 + (i17 + 9) >> 0] | 0;
         if (!(HEAP8[i64 + (i17 + 10) >> 0] | 0)) {
          i14 = i21;
          i16 = 0;
         } else {
          i17 = 72;
          i14 = i24;
          i15 = 0;
          i16 = 0;
          break;
         }
         while (1) {
          i15 = i16 + 1 | 0;
          if (!(HEAP8[i64 + (i14 + 8) >> 0] | 0)) {
           i11 = i15;
           break;
          }
          i14 = i14 + 1 | 0;
          if (i14 >>> 0 >= i22 >>> 0) {
           i70 = 122;
           break;
          } else i16 = i15;
         }
         if ((i70 | 0) == 122) {
          i70 = 0;
          i11 = i16 + 2 | 0;
          i16 = i15;
         }
         i15 = _malloc(i11) | 0;
         if (!i15) {
          i17 = 83;
          i14 = i24;
          i15 = 0;
          i16 = 0;
          break;
         }
         HEAP8[i15 + i16 >> 0] = 0;
         if (i16) _memcpy(i15 | 0, i64 + (i17 + 11) | 0, i16 | 0) | 0;
         i12 = i11 + i21 | 0;
         L156 : do if (i12 >>> 0 < i22 >>> 0) {
          i21 = i12;
          i14 = 0;
          while (1) {
           i16 = i14 + 1 | 0;
           if (!(HEAP8[i64 + (i21 + 8) >> 0] | 0)) {
            i13 = i16;
            i21 = i14;
            break L156;
           }
           i21 = i21 + 1 | 0;
           if (i21 >>> 0 >= i22 >>> 0) {
            i70 = 129;
            break;
           } else i14 = i16;
          }
         } else {
          i16 = 0;
          i70 = 129;
         } while (0);
         if ((i70 | 0) == 129) {
          i70 = 0;
          i13 = i16 + 1 | 0;
          i21 = i16;
         }
         i16 = _malloc(i13) | 0;
         if (!i16) {
          i17 = 83;
          i14 = i24;
          i16 = 0;
          break;
         }
         HEAP8[i16 + i21 >> 0] = 0;
         if (i21) _memcpy(i16 | 0, i64 + (i17 + 11 + i11) | 0, i21 | 0) | 0;
         i21 = i13 + i12 | 0;
         i13 = i22 >>> 0 < i21 >>> 0 ? 0 : i22 - i21 | 0;
         do if (!(i23 << 24 >> 24)) {
          i14 = i13 + 1 | 0;
          if (!i14) i17 = 0; else {
           i17 = _realloc(0, i14) | 0;
           if (!i17) {
            i17 = 83;
            i14 = i24;
            break L135;
           }
           HEAP32[i47 >> 2] = i14;
           HEAP32[i83 >> 2] = i17;
          }
          HEAP32[i48 >> 2] = i14;
          HEAP8[i17 + i13 >> 0] = 0;
          if (!i13) break;
          i14 = i21 + 8 | 0;
          HEAP8[i17 >> 0] = HEAP8[i64 + i14 >> 0] | 0;
          if ((i13 | 0) == 1) break;
          HEAP8[i17 + 1 >> 0] = HEAP8[i64 + (i21 + 9) >> 0] | 0;
          if ((i13 | 0) == 2) break;
          HEAP8[i17 + 2 >> 0] = HEAP8[i64 + (i21 + 10) >> 0] | 0;
          if ((i13 | 0) == 3) break; else i17 = 3;
          do {
           HEAP8[(HEAP32[i83 >> 2] | 0) + i17 >> 0] = HEAP8[i64 + (i17 + i14) >> 0] | 0;
           i17 = i17 + 1 | 0;
          } while ((i17 | 0) != (i13 | 0));
         } else {
          i17 = i64 + (i21 + 8) | 0;
          i14 = HEAP32[i68 >> 2] | 0;
          if (!i14) i17 = _lodepng_zlib_decompress(i83, i48, i17, i13, i91) | 0; else i17 = FUNCTION_TABLE_iiiiii[i14 & 0](i83, i48, i17, i13, i91) | 0;
          if (i17) {
           i14 = i24;
           break L135;
          }
          i17 = HEAP32[i47 >> 2] | 0;
          i12 = HEAP32[i48 >> 2] | 0;
          if (i17 >>> 0 < i12 >>> 0) {
           HEAP32[i47 >> 2] = i12;
           i17 = i12;
          }
          i13 = i12 + 1 | 0;
          if (i17 >>> 0 < i13 >>> 0) {
           i14 = i17 << 1 >>> 0 < i13 >>> 0 ? i13 : (i13 * 3 | 0) >>> 1;
           i17 = _realloc(HEAP32[i83 >> 2] | 0, i14) | 0;
           if (!i17) break;
           HEAP32[i47 >> 2] = i14;
           HEAP32[i83 >> 2] = i17;
          } else i17 = HEAP32[i83 >> 2] | 0;
          HEAP32[i48 >> 2] = i13;
          HEAP8[i17 + i12 >> 0] = 0;
         } while (0);
         i17 = _lodepng_add_itext(i44, i24, i15, i16, HEAP32[i83 >> 2] | 0) | 0;
         i14 = i24;
        } else {
         i17 = 75;
         i14 = 0;
         i15 = 0;
         i16 = 0;
        }
       } else {
        i17 = 30;
        i14 = 0;
        i15 = 0;
        i16 = 0;
       } while (0);
       _free(i14);
       _free(i15);
       _free(i16);
       HEAP32[i47 >> 2] = 0;
       HEAP32[i48 >> 2] = 0;
       _free(HEAP32[i83 >> 2] | 0);
       HEAP32[i92 >> 2] = i17;
       if (i17) break L10; else i21 = 0;
      } else i21 = 0; else i70 = 169;
      break;
     }
    case 112:
     {
      if (((HEAP8[i7 >> 0] | 0) == 72 ? (HEAP8[i6 >> 0] | 0) == 89 : 0) ? (HEAP8[i5 >> 0] | 0) == 115 : 0) {
       if ((i22 | 0) != 9) {
        i70 = 165;
        break L10;
       }
       HEAP32[i56 >> 2] = 1;
       HEAP32[i57 >> 2] = HEAPU8[i4 >> 0] << 16 | HEAPU8[i25 >> 0] << 24 | HEAPU8[i3 >> 0] << 8 | HEAPU8[i2 >> 0];
       HEAP32[i58 >> 2] = HEAPU8[i27 >> 0] << 16 | HEAPU8[i1 >> 0] << 24 | HEAPU8[i28 >> 0] << 8 | HEAPU8[i29 >> 0];
       HEAP32[i59 >> 2] = HEAPU8[i30 >> 0];
       HEAP32[i92 >> 2] = 0;
       i21 = 0;
      } else i70 = 169;
      break;
     }
    default:
     i70 = 167;
    } while (0);
    if ((i70 | 0) == 167) if (!(i17 & 32)) {
     i70 = 168;
     break L10;
    } else i70 = 169;
    if ((i70 | 0) == 169) {
     i70 = 0;
     if (!(HEAP32[i60 >> 2] | 0)) {
      i21 = 0;
      i18 = 1;
     } else {
      i17 = i19 + -1 | 0;
      i18 = i91 + 264 + (i17 << 2) | 0;
      i17 = i91 + 276 + (i17 << 2) | 0;
      i15 = HEAP32[i17 >> 2] | 0;
      i16 = i15 + i13 | 0;
      if (i16 >>> 0 < i13 >>> 0 | i16 >>> 0 < i15 >>> 0) {
       i7 = 77;
       i70 = 175;
       break L10;
      }
      i14 = _realloc(HEAP32[i18 >> 2] | 0, i16) | 0;
      if (!i14) {
       i7 = 83;
       i70 = 175;
       break L10;
      }
      HEAP32[i18 >> 2] = i14;
      HEAP32[i17 >> 2] = i16;
      if (i13) {
       i18 = 0;
       do {
        HEAP8[i14 + (i18 + i15) >> 0] = HEAP8[i64 + i18 >> 0] | 0;
        i18 = i18 + 1 | 0;
       } while ((i18 | 0) != (i13 | 0));
      }
      HEAP32[i92 >> 2] = 0;
      i21 = 0;
      i18 = 1;
     }
    }
    if (!(HEAP32[i33 >> 2] | i18)) {
     i16 = HEAPU8[i61 >> 0] << 16 | HEAPU8[i64 >> 0] << 24 | HEAPU8[i62 >> 0] << 8 | HEAPU8[i63 >> 0];
     i14 = HEAPU8[i64 + (i16 + 9) >> 0] << 16 | HEAPU8[i64 + (i16 + 8) >> 0] << 24 | HEAPU8[i64 + (i16 + 10) >> 0] << 8 | HEAPU8[i64 + (i16 + 11) >> 0];
     i16 = i16 + 4 | 0;
     if (!i16) i17 = 0; else {
      i17 = -1;
      i15 = 0;
      do {
       i17 = HEAP32[1376 + ((HEAPU8[i64 + (i15 + 4) >> 0] ^ i17 & 255) << 2) >> 2] ^ i17 >>> 8;
       i15 = i15 + 1 | 0;
      } while ((i15 | 0) != (i16 | 0));
      i17 = ~i17;
     }
     if ((i14 | 0) != (i17 | 0)) {
      i70 = 181;
      break L10;
     }
    }
    if (!(i21 << 24 >> 24)) break; else i17 = i21;
   }
   i64 = i64 + ((HEAPU8[i61 >> 0] << 16 | HEAPU8[i64 >> 0] << 24 | HEAPU8[i62 >> 0] << 8 | HEAPU8[i63 >> 0]) + 12) | 0;
  }
  switch (i70 | 0) {
  case 12:
   {
    HEAP32[i92 >> 2] = 30;
    break;
   }
  case 14:
   {
    HEAP32[i92 >> 2] = 63;
    break;
   }
  case 17:
   {
    HEAP32[i92 >> 2] = 64;
    break;
   }
  case 25:
   {
    HEAP32[i92 >> 2] = 83;
    break;
   }
  case 36:
   {
    HEAP32[i65 >> 2] = 0;
    i7 = 83;
    i70 = 42;
    break;
   }
  case 55:
   {
    HEAP32[i92 >> 2] = i7;
    break;
   }
  case 67:
   {
    HEAP32[i92 >> 2] = i7;
    break;
   }
  case 159:
   {
    HEAP32[i92 >> 2] = 73;
    break;
   }
  case 165:
   {
    HEAP32[i92 >> 2] = 74;
    break;
   }
  case 168:
   {
    HEAP32[i92 >> 2] = 69;
    break;
   }
  case 175:
   {
    HEAP32[i92 >> 2] = i7;
    break;
   }
  case 181:
   {
    HEAP32[i92 >> 2] = 57;
    break;
   }
  }
  if ((i70 | 0) == 42) HEAP32[i92 >> 2] = i7;
  HEAP32[i86 >> 2] = 0;
  i25 = i86 + 8 | 0;
  HEAP32[i25 >> 2] = 0;
  i26 = i86 + 4 | 0;
  HEAP32[i26 >> 2] = 0;
  i10 = i91 + 136 | 0;
  i11 = HEAP32[i88 >> 2] | 0;
  if (!(HEAP32[i10 >> 2] | 0)) {
   i5 = HEAP32[i89 >> 2] | 0;
   i6 = HEAP32[i91 + 144 >> 2] | 0;
   switch (HEAP32[i69 >> 2] | 0) {
   case 3:
   case 0:
    {
     i7 = 1;
     break;
    }
   case 2:
    {
     i7 = 3;
     break;
    }
   case 4:
    {
     i7 = 2;
     break;
    }
   case 6:
    {
     i7 = 4;
     break;
    }
   default:
    i7 = 0;
   }
   i6 = (Math_imul(((Math_imul(Math_imul(i6, i11) | 0, i7) | 0) + 7 | 0) >>> 3, i5) | 0) + i5 | 0;
  } else {
   i19 = (i11 + 7 | 0) >>> 3;
   i14 = HEAP32[i89 >> 2] | 0;
   i16 = (i14 + 7 | 0) >>> 3;
   i13 = HEAP32[i69 >> 2] | 0;
   i12 = HEAP32[i91 + 144 >> 2] | 0;
   switch (i13 | 0) {
   case 3:
   case 0:
    {
     i20 = 1;
     break;
    }
   case 2:
    {
     i20 = 3;
     break;
    }
   case 4:
    {
     i20 = 2;
     break;
    }
   case 6:
    {
     i20 = 4;
     break;
    }
   default:
    i20 = 0;
   }
   i19 = (Math_imul(((Math_imul(Math_imul(i12, i19) | 0, i20) | 0) + 7 | 0) >>> 3, i16) | 0) + i16 | 0;
   i17 = i11 + 3 | 0;
   if (i11 >>> 0 > 4) {
    i18 = i17 >>> 3;
    switch (i13 | 0) {
    case 3:
    case 0:
     {
      i20 = 1;
      break;
     }
    case 2:
     {
      i20 = 3;
      break;
     }
    case 4:
     {
      i20 = 2;
      break;
     }
    case 6:
     {
      i20 = 4;
      break;
     }
    default:
     i20 = 0;
    }
    i19 = i19 + i16 + (Math_imul(((Math_imul(Math_imul(i12, i18) | 0, i20) | 0) + 7 | 0) >>> 3, i16) | 0) | 0;
   }
   i18 = i17 >>> 2;
   i15 = i14 + 3 | 0;
   i17 = i15 >>> 3;
   switch (i13 | 0) {
   case 3:
   case 0:
    {
     i20 = 1;
     break;
    }
   case 2:
    {
     i20 = 3;
     break;
    }
   case 4:
    {
     i20 = 2;
     break;
    }
   case 6:
    {
     i20 = 4;
     break;
    }
   default:
    i20 = 0;
   }
   i18 = i19 + i17 + (Math_imul(((Math_imul(Math_imul(i12, i18) | 0, i20) | 0) + 7 | 0) >>> 3, i17) | 0) | 0;
   i16 = i11 + 1 | 0;
   if (i11 >>> 0 > 2) {
    i17 = i16 >>> 2;
    i19 = i15 >>> 2;
    switch (i13 | 0) {
    case 3:
    case 0:
     {
      i20 = 1;
      break;
     }
    case 2:
     {
      i20 = 3;
      break;
     }
    case 4:
     {
      i20 = 2;
      break;
     }
    case 6:
     {
      i20 = 4;
      break;
     }
    default:
     i20 = 0;
    }
    i17 = i18 + i19 + (Math_imul(((Math_imul(Math_imul(i12, i17) | 0, i20) | 0) + 7 | 0) >>> 3, i19) | 0) | 0;
   } else i17 = i18;
   i19 = i16 >>> 1;
   i16 = i14 + 1 | 0;
   i18 = i16 >>> 2;
   switch (i13 | 0) {
   case 3:
   case 0:
    {
     i20 = 1;
     break;
    }
   case 2:
    {
     i20 = 3;
     break;
    }
   case 4:
    {
     i20 = 2;
     break;
    }
   case 6:
    {
     i20 = 4;
     break;
    }
   default:
    i20 = 0;
   }
   i20 = i17 + i18 + (Math_imul(((Math_imul(Math_imul(i12, i19) | 0, i20) | 0) + 7 | 0) >>> 3, i18) | 0) | 0;
   if (i11 >>> 0 > 1) {
    i17 = i11 >>> 1;
    i18 = i16 >>> 1;
    switch (i13 | 0) {
    case 3:
    case 0:
     {
      i19 = 1;
      break;
     }
    case 2:
     {
      i19 = 3;
      break;
     }
    case 4:
     {
      i19 = 2;
      break;
     }
    case 6:
     {
      i19 = 4;
      break;
     }
    default:
     i19 = 0;
    }
    i20 = i20 + i18 + (Math_imul(((Math_imul(Math_imul(i12, i17) | 0, i19) | 0) + 7 | 0) >>> 3, i18) | 0) | 0;
   }
   i6 = i14 >>> 1;
   switch (i13 | 0) {
   case 3:
   case 0:
    {
     i7 = 1;
     break;
    }
   case 2:
    {
     i7 = 3;
     break;
    }
   case 4:
    {
     i7 = 2;
     break;
    }
   case 6:
    {
     i7 = 4;
     break;
    }
   default:
    i7 = 0;
   }
   i6 = i20 + i6 + (Math_imul(((Math_imul(Math_imul(i12, i11) | 0, i7) | 0) + 7 | 0) >>> 3, i6) | 0) | 0;
  }
  L297 : do if (!(HEAP32[i92 >> 2] | 0)) {
   do if (i6) {
    i7 = _realloc(0, i6) | 0;
    if (i7) {
     HEAP32[i25 >> 2] = i6;
     HEAP32[i86 >> 2] = i7;
     if (!(HEAP32[i92 >> 2] | 0)) break; else break L297;
    } else {
     HEAP32[i92 >> 2] = 83;
     break L297;
    }
   } while (0);
   i7 = HEAP32[i68 >> 2] | 0;
   if (!i7) i8 = _lodepng_zlib_decompress(i86, i26, i9, i8, i91) | 0; else i8 = FUNCTION_TABLE_iiiiii[i7 & 0](i86, i26, i9, i8, i91) | 0;
   HEAP32[i92 >> 2] = ((i8 | 0) != 0 ? 1 : (HEAP32[i26 >> 2] | 0) == (i6 | 0)) ? i8 : 91;
  } while (0);
  _free(i9);
  if (!(HEAP32[i92 >> 2] | 0)) {
   i20 = HEAP32[i88 >> 2] | 0;
   i19 = HEAP32[i89 >> 2] | 0;
   i8 = HEAP32[i69 >> 2] | 0;
   i18 = i91 + 144 | 0;
   i7 = HEAP32[i18 >> 2] | 0;
   switch (i8 | 0) {
   case 3:
   case 0:
    {
     i9 = 1;
     break;
    }
   case 2:
    {
     i9 = 3;
     break;
    }
   case 4:
    {
     i9 = 2;
     break;
    }
   case 6:
    {
     i9 = 4;
     break;
    }
   default:
    i9 = 0;
   }
   i9 = ((Math_imul(Math_imul(Math_imul(i19, i20) | 0, i7) | 0, i9) | 0) + 7 | 0) >>> 3;
   do if (i9) {
    i5 = _realloc(0, i9) | 0;
    if (!i5) {
     HEAP32[i92 >> 2] = 83;
     i5 = 0;
     break;
    }
    _memset(i5 | 0, 0, i9 | 0) | 0;
    if (!(HEAP32[i92 >> 2] | 0)) {
     i24 = i5;
     i8 = HEAP32[i69 >> 2] | 0;
     i7 = HEAP32[i18 >> 2] | 0;
     i21 = HEAP32[i88 >> 2] | 0;
     i19 = HEAP32[i89 >> 2] | 0;
     i70 = 253;
    }
   } else {
    i24 = 0;
    i21 = i20;
    i70 = 253;
   } while (0);
   if ((i70 | 0) == 253) {
    i22 = i24;
    i23 = HEAP32[i86 >> 2] | 0;
    switch (i8 | 0) {
    case 3:
    case 0:
     {
      i9 = 1;
      break;
     }
    case 2:
     {
      i9 = 3;
      break;
     }
    case 4:
     {
      i9 = 2;
      break;
     }
    case 6:
     {
      i9 = 4;
      break;
     }
    default:
     i9 = 0;
    }
    i1 = Math_imul(i9, i7) | 0;
    L332 : do if (!i1) i5 = 31; else {
     L334 : do if (!(HEAP32[i10 >> 2] | 0)) {
      if (i1 >>> 0 < 8 ? (i72 = Math_imul(i1, i21) | 0, i71 = i72 + 7 & -8, (i71 | 0) != (i72 | 0)) : 0) {
       i5 = _unfilter(i23, i23, i21, i19, i1) | 0;
       if (i5) break L332;
       i2 = i71 - i72 | 0;
       if (!i19) break;
       i1 = (i72 | 0) == 0;
       i6 = 0;
       i5 = 0;
       i9 = 0;
       while (1) {
        if (!i1) {
         i8 = i5;
         i7 = i6;
         i3 = 0;
         while (1) {
          i4 = 1 << (i7 & 7 ^ 7);
          if (!(1 << (i8 & 7 ^ 7) & HEAPU8[i23 + (i8 >>> 3) >> 0])) {
           i85 = i22 + (i7 >>> 3) | 0;
           HEAP8[i85 >> 0] = HEAPU8[i85 >> 0] & (i4 ^ 255);
          } else {
           i85 = i22 + (i7 >>> 3) | 0;
           HEAP8[i85 >> 0] = HEAPU8[i85 >> 0] | i4;
          }
          i3 = i3 + 1 | 0;
          if ((i3 | 0) == (i72 | 0)) break; else {
           i8 = i8 + 1 | 0;
           i7 = i7 + 1 | 0;
          }
         }
         i5 = i5 + i72 | 0;
         i6 = i6 + i72 | 0;
        }
        i9 = i9 + 1 | 0;
        if ((i9 | 0) == (i19 | 0)) break L334; else i5 = i2 + i5 | 0;
       }
      }
      i5 = _unfilter(i22, i23, i21, i19, i1) | 0;
      if (i5) break L332;
     } else {
      _Adam7_getpassvalues(i82, i80, i76, i78, i81, i21, i19, i1);
      i12 = i1 >>> 0 < 8;
      i8 = 0;
      do {
       i11 = HEAP32[i78 + (i8 << 2) >> 2] | 0;
       i9 = HEAP32[i82 + (i8 << 2) >> 2] | 0;
       i10 = HEAP32[i80 + (i8 << 2) >> 2] | 0;
       i5 = _unfilter(i23 + i11 | 0, i23 + (HEAP32[i76 + (i8 << 2) >> 2] | 0) | 0, i9, i10, i1) | 0;
       if (i5) break L332;
       if (i12 ? (i73 = HEAP32[i81 + (i8 << 2) >> 2] | 0, i74 = Math_imul(i9, i1) | 0, i75 = (i74 + 7 & -8) - i74 | 0, (i10 | 0) != 0) : 0) {
        i14 = (i74 | 0) == 0;
        i9 = 0;
        i20 = 0;
        i13 = 0;
        while (1) {
         if (!i14) {
          i18 = i20;
          i17 = i9;
          i15 = 0;
          while (1) {
           i16 = 1 << (i17 & 7 ^ 7);
           if (!(1 << (i18 & 7 ^ 7) & HEAPU8[i23 + ((i18 >>> 3) + i11) >> 0])) {
            i72 = i23 + ((i17 >>> 3) + i73) | 0;
            HEAP8[i72 >> 0] = HEAPU8[i72 >> 0] & (i16 ^ 255);
           } else {
            i72 = i23 + ((i17 >>> 3) + i73) | 0;
            HEAP8[i72 >> 0] = HEAPU8[i72 >> 0] | i16;
           }
           i15 = i15 + 1 | 0;
           if ((i15 | 0) == (i74 | 0)) break; else {
            i18 = i18 + 1 | 0;
            i17 = i17 + 1 | 0;
           }
          }
          i20 = i20 + i74 | 0;
          i9 = i9 + i74 | 0;
         }
         i13 = i13 + 1 | 0;
         if ((i13 | 0) == (i10 | 0)) break; else i20 = i75 + i20 | 0;
        }
       }
       i8 = i8 + 1 | 0;
      } while ((i8 | 0) != 7);
      _Adam7_getpassvalues(i83, i84, i77, i79, i85, i21, i19, i1);
      if (i1 >>> 0 > 7) {
       i9 = i1 >>> 3;
       i8 = (i9 | 0) == 0;
       i18 = 0;
       do {
        i7 = HEAP32[i84 + (i18 << 2) >> 2] | 0;
        if (i7) {
         i6 = HEAP32[i83 + (i18 << 2) >> 2] | 0;
         i5 = (i6 | 0) == 0;
         i4 = i85 + (i18 << 2) | 0;
         i3 = 2400 + (i18 << 2) | 0;
         i2 = 2428 + (i18 << 2) | 0;
         i1 = 2456 + (i18 << 2) | 0;
         i10 = 2484 + (i18 << 2) | 0;
         i20 = 0;
         do {
          if (!i5) {
           i11 = HEAP32[i4 >> 2] | 0;
           i12 = Math_imul((Math_imul(HEAP32[i2 >> 2] | 0, i20) | 0) + (HEAP32[i3 >> 2] | 0) | 0, i21) | 0;
           i12 = i12 + (HEAP32[i1 >> 2] | 0) | 0;
           i13 = HEAP32[i10 >> 2] | 0;
           i14 = Math_imul(i20, i6) | 0;
           i19 = 0;
           do {
            i15 = (Math_imul(i19 + i14 | 0, i9) | 0) + i11 | 0;
            i16 = Math_imul(i12 + (Math_imul(i19, i13) | 0) | 0, i9) | 0;
            if (!i8) {
             i17 = 0;
             do {
              HEAP8[i22 + (i17 + i16) >> 0] = HEAP8[i23 + (i15 + i17) >> 0] | 0;
              i17 = i17 + 1 | 0;
             } while ((i17 | 0) != (i9 | 0));
            }
            i19 = i19 + 1 | 0;
           } while ((i19 | 0) != (i6 | 0));
          }
          i20 = i20 + 1 | 0;
         } while ((i20 | 0) != (i7 | 0));
        }
        i18 = i18 + 1 | 0;
       } while ((i18 | 0) != 7);
      } else {
       i18 = 0;
       do {
        i16 = HEAP32[i83 + (i18 << 2) >> 2] | 0;
        i15 = HEAP32[i84 + (i18 << 2) >> 2] | 0;
        if (i15) {
         i14 = (i16 | 0) == 0;
         i13 = i85 + (i18 << 2) | 0;
         i12 = 2400 + (i18 << 2) | 0;
         i11 = 2428 + (i18 << 2) | 0;
         i10 = 2456 + (i18 << 2) | 0;
         i9 = 2484 + (i18 << 2) | 0;
         i20 = 0;
         do {
          if (!i14) {
           i8 = HEAP32[i13 >> 2] << 3;
           i7 = Math_imul(i20, i16) | 0;
           i5 = Math_imul((Math_imul(HEAP32[i11 >> 2] | 0, i20) | 0) + (HEAP32[i12 >> 2] | 0) | 0, i21) | 0;
           i6 = HEAP32[i9 >> 2] | 0;
           i5 = i5 + (HEAP32[i10 >> 2] | 0) | 0;
           i19 = 0;
           do {
            i4 = (Math_imul(i19 + i7 | 0, i1) | 0) + i8 | 0;
            i2 = Math_imul(i5 + (Math_imul(i19, i6) | 0) | 0, i1) | 0;
            i17 = 0;
            while (1) {
             i3 = (HEAPU8[i23 + (i4 >>> 3) >> 0] | 0) >>> (i4 & 7 ^ 7) & 1;
             if (i3) {
              i82 = i22 + (i2 >>> 3) | 0;
              HEAP8[i82 >> 0] = HEAPU8[i82 >> 0] | i3 << (i2 & 7 ^ 7);
             }
             i17 = i17 + 1 | 0;
             if ((i17 | 0) == (i1 | 0)) break; else {
              i4 = i4 + 1 | 0;
              i2 = i2 + 1 | 0;
             }
            }
            i19 = i19 + 1 | 0;
           } while ((i19 | 0) != (i16 | 0));
          }
          i20 = i20 + 1 | 0;
         } while ((i20 | 0) != (i15 | 0));
        }
        i18 = i18 + 1 | 0;
       } while ((i18 | 0) != 7);
      }
     } while (0);
     i5 = 0;
    } while (0);
    HEAP32[i92 >> 2] = i5;
    i5 = i24;
   }
   HEAP32[i90 >> 2] = i5;
  }
  HEAP32[i25 >> 2] = 0;
  HEAP32[i26 >> 2] = 0;
  _free(HEAP32[i86 >> 2] | 0);
  i1 = HEAP32[i92 >> 2] | 0;
  if (i1) {
   i92 = i1;
   STACKTOP = i93;
   return i92 | 0;
  }
  i7 = i91 + 96 | 0;
  i8 = i91 + 140 | 0;
  if (!(HEAP32[i91 + 20 >> 2] | 0)) {
   i6 = i91 + 104 | 0;
   i1 = HEAP32[i6 >> 2] | 0;
   if (i1) _free(i1);
   HEAP32[i7 >> 2] = HEAP32[i8 >> 2];
   HEAP32[i7 + 4 >> 2] = HEAP32[i8 + 4 >> 2];
   HEAP32[i7 + 8 >> 2] = HEAP32[i8 + 8 >> 2];
   HEAP32[i7 + 12 >> 2] = HEAP32[i8 + 12 >> 2];
   HEAP32[i7 + 16 >> 2] = HEAP32[i8 + 16 >> 2];
   HEAP32[i7 + 20 >> 2] = HEAP32[i8 + 20 >> 2];
   HEAP32[i7 + 24 >> 2] = HEAP32[i8 + 24 >> 2];
   HEAP32[i7 + 28 >> 2] = HEAP32[i8 + 28 >> 2];
   i5 = i91 + 148 | 0;
   i2 = HEAP32[i5 >> 2] | 0;
   do if (i2) {
    i3 = _malloc(1024) | 0;
    HEAP32[i6 >> 2] = i3;
    i4 = i91 + 152 | 0;
    i1 = HEAP32[i4 >> 2] | 0;
    if (!i3) {
     if (!i1) break;
     HEAP32[i92 >> 2] = 83;
     i92 = 83;
     STACKTOP = i93;
     return i92 | 0;
    } else {
     if (!(i1 & 1073741823)) break;
     HEAP8[i3 >> 0] = HEAP8[i2 >> 0] | 0;
     HEAP8[i3 + 1 >> 0] = HEAP8[i2 + 1 >> 0] | 0;
     i1 = 2;
     do {
      HEAP8[(HEAP32[i6 >> 2] | 0) + i1 >> 0] = HEAP8[(HEAP32[i5 >> 2] | 0) + i1 >> 0] | 0;
      i1 = i1 + 1 | 0;
     } while ((i1 | 0) != (HEAP32[i4 >> 2] << 2 | 0));
    }
   } while (0);
   HEAP32[i92 >> 2] = 0;
   i92 = 0;
   STACKTOP = i93;
   return i92 | 0;
  }
  i1 = HEAP32[i7 >> 2] | 0;
  L435 : do if (((i1 | 0) == (HEAP32[i8 >> 2] | 0) ? (HEAP32[i91 + 100 >> 2] | 0) == (HEAP32[i91 + 144 >> 2] | 0) : 0) ? (i87 = HEAP32[i91 + 112 >> 2] | 0, (i87 | 0) == (HEAP32[i91 + 156 >> 2] | 0)) : 0) {
   if (i87) {
    if ((HEAP32[i91 + 116 >> 2] | 0) != (HEAP32[i91 + 160 >> 2] | 0)) break;
    if ((HEAP32[i91 + 120 >> 2] | 0) != (HEAP32[i91 + 164 >> 2] | 0)) break;
    if ((HEAP32[i91 + 124 >> 2] | 0) != (HEAP32[i91 + 168 >> 2] | 0)) break;
   }
   i5 = HEAP32[i91 + 108 >> 2] | 0;
   if ((i5 | 0) == (HEAP32[i91 + 152 >> 2] | 0)) {
    if (!(i5 & 1073741823)) {
     i92 = 0;
     STACKTOP = i93;
     return i92 | 0;
    }
    i4 = HEAP32[i91 + 104 >> 2] | 0;
    i3 = HEAP32[i91 + 148 >> 2] | 0;
    i5 = i5 << 2;
    i6 = 0;
    while (1) {
     if ((HEAP8[i4 + i6 >> 0] | 0) != (HEAP8[i3 + i6 >> 0] | 0)) break L435;
     i6 = i6 + 1 | 0;
     if ((i6 | 0) == (i5 | 0)) {
      i1 = 0;
      break;
     }
    }
    STACKTOP = i93;
    return i1 | 0;
   }
  } while (0);
  i2 = HEAP32[i90 >> 2] | 0;
  switch (i1 | 0) {
  case 6:
  case 2:
   break;
  default:
   if ((HEAP32[i91 + 100 >> 2] | 0) != 8) {
    i92 = 56;
    STACKTOP = i93;
    return i92 | 0;
   }
  }
  i3 = HEAP32[i88 >> 2] | 0;
  i6 = HEAP32[i89 >> 2] | 0;
  i5 = HEAP32[i91 + 100 >> 2] | 0;
  switch (i1 | 0) {
  case 3:
  case 0:
   {
    i4 = 1;
    break;
   }
  case 2:
   {
    i4 = 3;
    break;
   }
  case 4:
   {
    i4 = 2;
    break;
   }
  case 6:
   {
    i4 = 4;
    break;
   }
  default:
   i4 = 0;
  }
  i4 = _malloc(((Math_imul(Math_imul(Math_imul(i6, i3) | 0, i5) | 0, i4) | 0) + 7 | 0) >>> 3) | 0;
  HEAP32[i90 >> 2] = i4;
  if (!i4) i1 = 83; else {
   _lodepng_convert(i4, i2, i7, i8, i3, i6) | 0;
   i1 = 0;
  }
  HEAP32[i92 >> 2] = i1;
  _free(i2);
  i92 = HEAP32[i92 >> 2] | 0;
  STACKTOP = i93;
  return i92 | 0;
 } while (0);
 i92 = i1;
 STACKTOP = i93;
 return i92 | 0;
}

function _malloc(i9) {
 i9 = i9 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, i42 = 0, i43 = 0, i44 = 0, i45 = 0, i46 = 0, i47 = 0;
 do if (i9 >>> 0 < 245) {
  i18 = i9 >>> 0 < 11 ? 16 : i9 + 11 & -8;
  i9 = i18 >>> 3;
  i12 = HEAP32[748] | 0;
  i8 = i12 >>> i9;
  if (i8 & 3) {
   i3 = (i8 & 1 ^ 1) + i9 | 0;
   i1 = i3 << 1;
   i2 = 3032 + (i1 << 2) | 0;
   i1 = 3032 + (i1 + 2 << 2) | 0;
   i4 = HEAP32[i1 >> 2] | 0;
   i5 = i4 + 8 | 0;
   i6 = HEAP32[i5 >> 2] | 0;
   do if ((i2 | 0) == (i6 | 0)) HEAP32[748] = i12 & ~(1 << i3); else {
    if (i6 >>> 0 >= (HEAP32[752] | 0) >>> 0 ? (i11 = i6 + 12 | 0, (HEAP32[i11 >> 2] | 0) == (i4 | 0)) : 0) {
     HEAP32[i11 >> 2] = i2;
     HEAP32[i1 >> 2] = i6;
     break;
    }
    _abort();
   } while (0);
   i46 = i3 << 3;
   HEAP32[i4 + 4 >> 2] = i46 | 3;
   i46 = i4 + (i46 | 4) | 0;
   HEAP32[i46 >> 2] = HEAP32[i46 >> 2] | 1;
   break;
  }
  i1 = HEAP32[750] | 0;
  if (i18 >>> 0 > i1 >>> 0) {
   if (i8) {
    i4 = 2 << i9;
    i4 = i8 << i9 & (i4 | 0 - i4);
    i4 = (i4 & 0 - i4) + -1 | 0;
    i5 = i4 >>> 12 & 16;
    i4 = i4 >>> i5;
    i3 = i4 >>> 5 & 8;
    i4 = i4 >>> i3;
    i2 = i4 >>> 2 & 4;
    i4 = i4 >>> i2;
    i6 = i4 >>> 1 & 2;
    i4 = i4 >>> i6;
    i7 = i4 >>> 1 & 1;
    i7 = (i3 | i5 | i2 | i6 | i7) + (i4 >>> i7) | 0;
    i4 = i7 << 1;
    i6 = 3032 + (i4 << 2) | 0;
    i4 = 3032 + (i4 + 2 << 2) | 0;
    i2 = HEAP32[i4 >> 2] | 0;
    i5 = i2 + 8 | 0;
    i3 = HEAP32[i5 >> 2] | 0;
    do if ((i6 | 0) == (i3 | 0)) {
     HEAP32[748] = i12 & ~(1 << i7);
     i13 = i1;
    } else {
     if (i3 >>> 0 >= (HEAP32[752] | 0) >>> 0 ? (i10 = i3 + 12 | 0, (HEAP32[i10 >> 2] | 0) == (i2 | 0)) : 0) {
      HEAP32[i10 >> 2] = i6;
      HEAP32[i4 >> 2] = i3;
      i13 = HEAP32[750] | 0;
      break;
     }
     _abort();
    } while (0);
    i46 = i7 << 3;
    i1 = i46 - i18 | 0;
    HEAP32[i2 + 4 >> 2] = i18 | 3;
    i8 = i2 + i18 | 0;
    HEAP32[i2 + (i18 | 4) >> 2] = i1 | 1;
    HEAP32[i2 + i46 >> 2] = i1;
    if (i13) {
     i2 = HEAP32[753] | 0;
     i3 = i13 >>> 3;
     i6 = i3 << 1;
     i7 = 3032 + (i6 << 2) | 0;
     i4 = HEAP32[748] | 0;
     i3 = 1 << i3;
     if (i4 & i3) {
      i4 = 3032 + (i6 + 2 << 2) | 0;
      i6 = HEAP32[i4 >> 2] | 0;
      if (i6 >>> 0 < (HEAP32[752] | 0) >>> 0) _abort(); else {
       i15 = i4;
       i16 = i6;
      }
     } else {
      HEAP32[748] = i4 | i3;
      i15 = 3032 + (i6 + 2 << 2) | 0;
      i16 = i7;
     }
     HEAP32[i15 >> 2] = i2;
     HEAP32[i16 + 12 >> 2] = i2;
     HEAP32[i2 + 8 >> 2] = i16;
     HEAP32[i2 + 12 >> 2] = i7;
    }
    HEAP32[750] = i1;
    HEAP32[753] = i8;
    break;
   }
   i9 = HEAP32[749] | 0;
   if (i9) {
    i4 = (i9 & 0 - i9) + -1 | 0;
    i45 = i4 >>> 12 & 16;
    i4 = i4 >>> i45;
    i44 = i4 >>> 5 & 8;
    i4 = i4 >>> i44;
    i46 = i4 >>> 2 & 4;
    i4 = i4 >>> i46;
    i6 = i4 >>> 1 & 2;
    i4 = i4 >>> i6;
    i8 = i4 >>> 1 & 1;
    i8 = HEAP32[3296 + ((i44 | i45 | i46 | i6 | i8) + (i4 >>> i8) << 2) >> 2] | 0;
    i4 = (HEAP32[i8 + 4 >> 2] & -8) - i18 | 0;
    i6 = i8;
    while (1) {
     i7 = HEAP32[i6 + 16 >> 2] | 0;
     if (!i7) {
      i7 = HEAP32[i6 + 20 >> 2] | 0;
      if (!i7) {
       i1 = i4;
       break;
      }
     }
     i6 = (HEAP32[i7 + 4 >> 2] & -8) - i18 | 0;
     i46 = i6 >>> 0 < i4 >>> 0;
     i4 = i46 ? i6 : i4;
     i6 = i7;
     i8 = i46 ? i7 : i8;
    }
    i9 = HEAP32[752] | 0;
    if (i8 >>> 0 >= i9 >>> 0 ? (i21 = i8 + i18 | 0, i8 >>> 0 < i21 >>> 0) : 0) {
     i3 = HEAP32[i8 + 24 >> 2] | 0;
     i7 = HEAP32[i8 + 12 >> 2] | 0;
     do if ((i7 | 0) == (i8 | 0)) {
      i6 = i8 + 20 | 0;
      i7 = HEAP32[i6 >> 2] | 0;
      if (!i7) {
       i6 = i8 + 16 | 0;
       i7 = HEAP32[i6 >> 2] | 0;
       if (!i7) {
        i19 = 0;
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
       i19 = i7;
       break;
      }
     } else {
      i6 = HEAP32[i8 + 8 >> 2] | 0;
      if ((i6 >>> 0 >= i9 >>> 0 ? (i2 = i6 + 12 | 0, (HEAP32[i2 >> 2] | 0) == (i8 | 0)) : 0) ? (i14 = i7 + 8 | 0, (HEAP32[i14 >> 2] | 0) == (i8 | 0)) : 0) {
       HEAP32[i2 >> 2] = i7;
       HEAP32[i14 >> 2] = i6;
       i19 = i7;
       break;
      }
      _abort();
     } while (0);
     do if (i3) {
      i6 = HEAP32[i8 + 28 >> 2] | 0;
      i5 = 3296 + (i6 << 2) | 0;
      if ((i8 | 0) == (HEAP32[i5 >> 2] | 0)) {
       HEAP32[i5 >> 2] = i19;
       if (!i19) {
        HEAP32[749] = HEAP32[749] & ~(1 << i6);
        break;
       }
      } else {
       if (i3 >>> 0 < (HEAP32[752] | 0) >>> 0) _abort();
       i6 = i3 + 16 | 0;
       if ((HEAP32[i6 >> 2] | 0) == (i8 | 0)) HEAP32[i6 >> 2] = i19; else HEAP32[i3 + 20 >> 2] = i19;
       if (!i19) break;
      }
      i5 = HEAP32[752] | 0;
      if (i19 >>> 0 < i5 >>> 0) _abort();
      HEAP32[i19 + 24 >> 2] = i3;
      i6 = HEAP32[i8 + 16 >> 2] | 0;
      do if (i6) if (i6 >>> 0 < i5 >>> 0) _abort(); else {
       HEAP32[i19 + 16 >> 2] = i6;
       HEAP32[i6 + 24 >> 2] = i19;
       break;
      } while (0);
      i6 = HEAP32[i8 + 20 >> 2] | 0;
      if (i6) if (i6 >>> 0 < (HEAP32[752] | 0) >>> 0) _abort(); else {
       HEAP32[i19 + 20 >> 2] = i6;
       HEAP32[i6 + 24 >> 2] = i19;
       break;
      }
     } while (0);
     if (i1 >>> 0 < 16) {
      i46 = i1 + i18 | 0;
      HEAP32[i8 + 4 >> 2] = i46 | 3;
      i46 = i8 + (i46 + 4) | 0;
      HEAP32[i46 >> 2] = HEAP32[i46 >> 2] | 1;
     } else {
      HEAP32[i8 + 4 >> 2] = i18 | 3;
      HEAP32[i8 + (i18 | 4) >> 2] = i1 | 1;
      HEAP32[i8 + (i1 + i18) >> 2] = i1;
      i3 = HEAP32[750] | 0;
      if (i3) {
       i2 = HEAP32[753] | 0;
       i4 = i3 >>> 3;
       i6 = i4 << 1;
       i7 = 3032 + (i6 << 2) | 0;
       i5 = HEAP32[748] | 0;
       i4 = 1 << i4;
       if (i5 & i4) {
        i6 = 3032 + (i6 + 2 << 2) | 0;
        i5 = HEAP32[i6 >> 2] | 0;
        if (i5 >>> 0 < (HEAP32[752] | 0) >>> 0) _abort(); else {
         i20 = i6;
         i22 = i5;
        }
       } else {
        HEAP32[748] = i5 | i4;
        i20 = 3032 + (i6 + 2 << 2) | 0;
        i22 = i7;
       }
       HEAP32[i20 >> 2] = i2;
       HEAP32[i22 + 12 >> 2] = i2;
       HEAP32[i2 + 8 >> 2] = i22;
       HEAP32[i2 + 12 >> 2] = i7;
      }
      HEAP32[750] = i1;
      HEAP32[753] = i21;
     }
     i5 = i8 + 8 | 0;
     break;
    }
    _abort();
   } else i47 = 154;
  } else i47 = 154;
 } else if (i9 >>> 0 <= 4294967231) {
  i9 = i9 + 11 | 0;
  i22 = i9 & -8;
  i12 = HEAP32[749] | 0;
  if (i12) {
   i8 = 0 - i22 | 0;
   i9 = i9 >>> 8;
   if (i9) if (i22 >>> 0 > 16777215) i11 = 31; else {
    i21 = (i9 + 1048320 | 0) >>> 16 & 8;
    i47 = i9 << i21;
    i20 = (i47 + 520192 | 0) >>> 16 & 4;
    i47 = i47 << i20;
    i11 = (i47 + 245760 | 0) >>> 16 & 2;
    i11 = 14 - (i20 | i21 | i11) + (i47 << i11 >>> 15) | 0;
    i11 = i22 >>> (i11 + 7 | 0) & 1 | i11 << 1;
   } else i11 = 0;
   i9 = HEAP32[3296 + (i11 << 2) >> 2] | 0;
   L110 : do if (!i9) {
    i7 = 0;
    i9 = 0;
    i47 = 86;
   } else {
    i2 = i8;
    i7 = 0;
    i1 = i22 << ((i11 | 0) == 31 ? 0 : 25 - (i11 >>> 1) | 0);
    i10 = i9;
    i9 = 0;
    while (1) {
     i3 = HEAP32[i10 + 4 >> 2] & -8;
     i8 = i3 - i22 | 0;
     if (i8 >>> 0 < i2 >>> 0) if ((i3 | 0) == (i22 | 0)) {
      i3 = i10;
      i9 = i10;
      i47 = 90;
      break L110;
     } else i9 = i10; else i8 = i2;
     i47 = HEAP32[i10 + 20 >> 2] | 0;
     i10 = HEAP32[i10 + 16 + (i1 >>> 31 << 2) >> 2] | 0;
     i7 = (i47 | 0) == 0 | (i47 | 0) == (i10 | 0) ? i7 : i47;
     if (!i10) {
      i47 = 86;
      break;
     } else {
      i2 = i8;
      i1 = i1 << 1;
     }
    }
   } while (0);
   if ((i47 | 0) == 86) {
    if ((i7 | 0) == 0 & (i9 | 0) == 0) {
     i9 = 2 << i11;
     i9 = i12 & (i9 | 0 - i9);
     if (!i9) {
      i18 = i22;
      i47 = 154;
      break;
     }
     i9 = (i9 & 0 - i9) + -1 | 0;
     i19 = i9 >>> 12 & 16;
     i9 = i9 >>> i19;
     i16 = i9 >>> 5 & 8;
     i9 = i9 >>> i16;
     i20 = i9 >>> 2 & 4;
     i9 = i9 >>> i20;
     i21 = i9 >>> 1 & 2;
     i9 = i9 >>> i21;
     i7 = i9 >>> 1 & 1;
     i7 = HEAP32[3296 + ((i16 | i19 | i20 | i21 | i7) + (i9 >>> i7) << 2) >> 2] | 0;
     i9 = 0;
    }
    if (!i7) {
     i16 = i8;
     i15 = i9;
    } else {
     i3 = i7;
     i47 = 90;
    }
   }
   if ((i47 | 0) == 90) while (1) {
    i47 = 0;
    i21 = (HEAP32[i3 + 4 >> 2] & -8) - i22 | 0;
    i7 = i21 >>> 0 < i8 >>> 0;
    i8 = i7 ? i21 : i8;
    i9 = i7 ? i3 : i9;
    i7 = HEAP32[i3 + 16 >> 2] | 0;
    if (i7) {
     i3 = i7;
     i47 = 90;
     continue;
    }
    i3 = HEAP32[i3 + 20 >> 2] | 0;
    if (!i3) {
     i16 = i8;
     i15 = i9;
     break;
    } else i47 = 90;
   }
   if ((i15 | 0) != 0 ? i16 >>> 0 < ((HEAP32[750] | 0) - i22 | 0) >>> 0 : 0) {
    i9 = HEAP32[752] | 0;
    if (i15 >>> 0 >= i9 >>> 0 ? (i33 = i15 + i22 | 0, i15 >>> 0 < i33 >>> 0) : 0) {
     i8 = HEAP32[i15 + 24 >> 2] | 0;
     i7 = HEAP32[i15 + 12 >> 2] | 0;
     do if ((i7 | 0) == (i15 | 0)) {
      i6 = i15 + 20 | 0;
      i7 = HEAP32[i6 >> 2] | 0;
      if (!i7) {
       i6 = i15 + 16 | 0;
       i7 = HEAP32[i6 >> 2] | 0;
       if (!i7) {
        i24 = 0;
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
       i24 = i7;
       break;
      }
     } else {
      i6 = HEAP32[i15 + 8 >> 2] | 0;
      if ((i6 >>> 0 >= i9 >>> 0 ? (i17 = i6 + 12 | 0, (HEAP32[i17 >> 2] | 0) == (i15 | 0)) : 0) ? (i18 = i7 + 8 | 0, (HEAP32[i18 >> 2] | 0) == (i15 | 0)) : 0) {
       HEAP32[i17 >> 2] = i7;
       HEAP32[i18 >> 2] = i6;
       i24 = i7;
       break;
      }
      _abort();
     } while (0);
     do if (i8) {
      i7 = HEAP32[i15 + 28 >> 2] | 0;
      i6 = 3296 + (i7 << 2) | 0;
      if ((i15 | 0) == (HEAP32[i6 >> 2] | 0)) {
       HEAP32[i6 >> 2] = i24;
       if (!i24) {
        HEAP32[749] = HEAP32[749] & ~(1 << i7);
        break;
       }
      } else {
       if (i8 >>> 0 < (HEAP32[752] | 0) >>> 0) _abort();
       i6 = i8 + 16 | 0;
       if ((HEAP32[i6 >> 2] | 0) == (i15 | 0)) HEAP32[i6 >> 2] = i24; else HEAP32[i8 + 20 >> 2] = i24;
       if (!i24) break;
      }
      i7 = HEAP32[752] | 0;
      if (i24 >>> 0 < i7 >>> 0) _abort();
      HEAP32[i24 + 24 >> 2] = i8;
      i6 = HEAP32[i15 + 16 >> 2] | 0;
      do if (i6) if (i6 >>> 0 < i7 >>> 0) _abort(); else {
       HEAP32[i24 + 16 >> 2] = i6;
       HEAP32[i6 + 24 >> 2] = i24;
       break;
      } while (0);
      i6 = HEAP32[i15 + 20 >> 2] | 0;
      if (i6) if (i6 >>> 0 < (HEAP32[752] | 0) >>> 0) _abort(); else {
       HEAP32[i24 + 20 >> 2] = i6;
       HEAP32[i6 + 24 >> 2] = i24;
       break;
      }
     } while (0);
     L179 : do if (i16 >>> 0 >= 16) {
      HEAP32[i15 + 4 >> 2] = i22 | 3;
      HEAP32[i15 + (i22 | 4) >> 2] = i16 | 1;
      HEAP32[i15 + (i16 + i22) >> 2] = i16;
      i7 = i16 >>> 3;
      if (i16 >>> 0 < 256) {
       i5 = i7 << 1;
       i3 = 3032 + (i5 << 2) | 0;
       i4 = HEAP32[748] | 0;
       i6 = 1 << i7;
       if (i4 & i6) {
        i6 = 3032 + (i5 + 2 << 2) | 0;
        i5 = HEAP32[i6 >> 2] | 0;
        if (i5 >>> 0 < (HEAP32[752] | 0) >>> 0) _abort(); else {
         i25 = i6;
         i26 = i5;
        }
       } else {
        HEAP32[748] = i4 | i6;
        i25 = 3032 + (i5 + 2 << 2) | 0;
        i26 = i3;
       }
       HEAP32[i25 >> 2] = i33;
       HEAP32[i26 + 12 >> 2] = i33;
       HEAP32[i15 + (i22 + 8) >> 2] = i26;
       HEAP32[i15 + (i22 + 12) >> 2] = i3;
       break;
      }
      i2 = i16 >>> 8;
      if (i2) if (i16 >>> 0 > 16777215) i7 = 31; else {
       i45 = (i2 + 1048320 | 0) >>> 16 & 8;
       i46 = i2 << i45;
       i44 = (i46 + 520192 | 0) >>> 16 & 4;
       i46 = i46 << i44;
       i7 = (i46 + 245760 | 0) >>> 16 & 2;
       i7 = 14 - (i44 | i45 | i7) + (i46 << i7 >>> 15) | 0;
       i7 = i16 >>> (i7 + 7 | 0) & 1 | i7 << 1;
      } else i7 = 0;
      i6 = 3296 + (i7 << 2) | 0;
      HEAP32[i15 + (i22 + 28) >> 2] = i7;
      HEAP32[i15 + (i22 + 20) >> 2] = 0;
      HEAP32[i15 + (i22 + 16) >> 2] = 0;
      i5 = HEAP32[749] | 0;
      i4 = 1 << i7;
      if (!(i5 & i4)) {
       HEAP32[749] = i5 | i4;
       HEAP32[i6 >> 2] = i33;
       HEAP32[i15 + (i22 + 24) >> 2] = i6;
       HEAP32[i15 + (i22 + 12) >> 2] = i33;
       HEAP32[i15 + (i22 + 8) >> 2] = i33;
       break;
      }
      i2 = HEAP32[i6 >> 2] | 0;
      L197 : do if ((HEAP32[i2 + 4 >> 2] & -8 | 0) != (i16 | 0)) {
       i7 = i16 << ((i7 | 0) == 31 ? 0 : 25 - (i7 >>> 1) | 0);
       while (1) {
        i1 = i2 + 16 + (i7 >>> 31 << 2) | 0;
        i6 = HEAP32[i1 >> 2] | 0;
        if (!i6) break;
        if ((HEAP32[i6 + 4 >> 2] & -8 | 0) == (i16 | 0)) {
         i28 = i6;
         break L197;
        } else {
         i7 = i7 << 1;
         i2 = i6;
        }
       }
       if (i1 >>> 0 < (HEAP32[752] | 0) >>> 0) _abort(); else {
        HEAP32[i1 >> 2] = i33;
        HEAP32[i15 + (i22 + 24) >> 2] = i2;
        HEAP32[i15 + (i22 + 12) >> 2] = i33;
        HEAP32[i15 + (i22 + 8) >> 2] = i33;
        break L179;
       }
      } else i28 = i2; while (0);
      i2 = i28 + 8 | 0;
      i1 = HEAP32[i2 >> 2] | 0;
      i46 = HEAP32[752] | 0;
      if (i1 >>> 0 >= i46 >>> 0 & i28 >>> 0 >= i46 >>> 0) {
       HEAP32[i1 + 12 >> 2] = i33;
       HEAP32[i2 >> 2] = i33;
       HEAP32[i15 + (i22 + 8) >> 2] = i1;
       HEAP32[i15 + (i22 + 12) >> 2] = i28;
       HEAP32[i15 + (i22 + 24) >> 2] = 0;
       break;
      } else _abort();
     } else {
      i46 = i16 + i22 | 0;
      HEAP32[i15 + 4 >> 2] = i46 | 3;
      i46 = i15 + (i46 + 4) | 0;
      HEAP32[i46 >> 2] = HEAP32[i46 >> 2] | 1;
     } while (0);
     i5 = i15 + 8 | 0;
     break;
    }
    _abort();
   } else {
    i18 = i22;
    i47 = 154;
   }
  } else {
   i18 = i22;
   i47 = 154;
  }
 } else {
  i18 = -1;
  i47 = 154;
 } while (0);
 L212 : do if ((i47 | 0) == 154) {
  i9 = HEAP32[750] | 0;
  if (i9 >>> 0 >= i18 >>> 0) {
   i1 = i9 - i18 | 0;
   i2 = HEAP32[753] | 0;
   if (i1 >>> 0 > 15) {
    HEAP32[753] = i2 + i18;
    HEAP32[750] = i1;
    HEAP32[i2 + (i18 + 4) >> 2] = i1 | 1;
    HEAP32[i2 + i9 >> 2] = i1;
    HEAP32[i2 + 4 >> 2] = i18 | 3;
   } else {
    HEAP32[750] = 0;
    HEAP32[753] = 0;
    HEAP32[i2 + 4 >> 2] = i9 | 3;
    i47 = i2 + (i9 + 4) | 0;
    HEAP32[i47 >> 2] = HEAP32[i47 >> 2] | 1;
   }
   i5 = i2 + 8 | 0;
   break;
  }
  i9 = HEAP32[751] | 0;
  if (i9 >>> 0 > i18 >>> 0) {
   i47 = i9 - i18 | 0;
   HEAP32[751] = i47;
   i5 = HEAP32[754] | 0;
   HEAP32[754] = i5 + i18;
   HEAP32[i5 + (i18 + 4) >> 2] = i47 | 1;
   HEAP32[i5 + 4 >> 2] = i18 | 3;
   i5 = i5 + 8 | 0;
   break;
  }
  if (!(HEAP32[866] | 0)) _init_mparams();
  i12 = i18 + 48 | 0;
  i2 = HEAP32[868] | 0;
  i11 = i18 + 47 | 0;
  i3 = i2 + i11 | 0;
  i2 = 0 - i2 | 0;
  i10 = i3 & i2;
  if (i10 >>> 0 > i18 >>> 0) {
   i9 = HEAP32[858] | 0;
   if ((i9 | 0) != 0 ? (i28 = HEAP32[856] | 0, i33 = i28 + i10 | 0, i33 >>> 0 <= i28 >>> 0 | i33 >>> 0 > i9 >>> 0) : 0) {
    i5 = 0;
    break;
   }
   L231 : do if (!(HEAP32[859] & 4)) {
    i9 = HEAP32[754] | 0;
    L233 : do if (i9) {
     i7 = 3440;
     while (1) {
      i8 = HEAP32[i7 >> 2] | 0;
      if (i8 >>> 0 <= i9 >>> 0 ? (i23 = i7 + 4 | 0, (i8 + (HEAP32[i23 >> 2] | 0) | 0) >>> 0 > i9 >>> 0) : 0) {
       i5 = i7;
       i9 = i23;
       break;
      }
      i7 = HEAP32[i7 + 8 >> 2] | 0;
      if (!i7) {
       i47 = 172;
       break L233;
      }
     }
     i8 = i3 - (HEAP32[751] | 0) & i2;
     if (i8 >>> 0 < 2147483647) {
      i7 = _sbrk(i8 | 0) | 0;
      i33 = (i7 | 0) == ((HEAP32[i5 >> 2] | 0) + (HEAP32[i9 >> 2] | 0) | 0);
      i9 = i33 ? i8 : 0;
      if (i33) {
       if ((i7 | 0) != (-1 | 0)) {
        i26 = i7;
        i19 = i9;
        i47 = 192;
        break L231;
       }
      } else i47 = 182;
     } else i9 = 0;
    } else i47 = 172; while (0);
    do if ((i47 | 0) == 172) {
     i5 = _sbrk(0) | 0;
     if ((i5 | 0) != (-1 | 0)) {
      i9 = i5;
      i8 = HEAP32[867] | 0;
      i7 = i8 + -1 | 0;
      if (!(i7 & i9)) i8 = i10; else i8 = i10 - i9 + (i7 + i9 & 0 - i8) | 0;
      i9 = HEAP32[856] | 0;
      i7 = i9 + i8 | 0;
      if (i8 >>> 0 > i18 >>> 0 & i8 >>> 0 < 2147483647) {
       i33 = HEAP32[858] | 0;
       if ((i33 | 0) != 0 ? i7 >>> 0 <= i9 >>> 0 | i7 >>> 0 > i33 >>> 0 : 0) {
        i9 = 0;
        break;
       }
       i7 = _sbrk(i8 | 0) | 0;
       i47 = (i7 | 0) == (i5 | 0);
       i9 = i47 ? i8 : 0;
       if (i47) {
        i26 = i5;
        i19 = i9;
        i47 = 192;
        break L231;
       } else i47 = 182;
      } else i9 = 0;
     } else i9 = 0;
    } while (0);
    L253 : do if ((i47 | 0) == 182) {
     i5 = 0 - i8 | 0;
     do if (i12 >>> 0 > i8 >>> 0 & (i8 >>> 0 < 2147483647 & (i7 | 0) != (-1 | 0)) ? (i27 = HEAP32[868] | 0, i27 = i11 - i8 + i27 & 0 - i27, i27 >>> 0 < 2147483647) : 0) if ((_sbrk(i27 | 0) | 0) == (-1 | 0)) {
      _sbrk(i5 | 0) | 0;
      break L253;
     } else {
      i8 = i27 + i8 | 0;
      break;
     } while (0);
     if ((i7 | 0) != (-1 | 0)) {
      i26 = i7;
      i19 = i8;
      i47 = 192;
      break L231;
     }
    } while (0);
    HEAP32[859] = HEAP32[859] | 4;
    i47 = 189;
   } else {
    i9 = 0;
    i47 = 189;
   } while (0);
   if ((((i47 | 0) == 189 ? i10 >>> 0 < 2147483647 : 0) ? (i29 = _sbrk(i10 | 0) | 0, i30 = _sbrk(0) | 0, i29 >>> 0 < i30 >>> 0 & ((i29 | 0) != (-1 | 0) & (i30 | 0) != (-1 | 0))) : 0) ? (i31 = i30 - i29 | 0, i32 = i31 >>> 0 > (i18 + 40 | 0) >>> 0, i32) : 0) {
    i26 = i29;
    i19 = i32 ? i31 : i9;
    i47 = 192;
   }
   if ((i47 | 0) == 192) {
    i8 = (HEAP32[856] | 0) + i19 | 0;
    HEAP32[856] = i8;
    if (i8 >>> 0 > (HEAP32[857] | 0) >>> 0) HEAP32[857] = i8;
    i16 = HEAP32[754] | 0;
    L272 : do if (i16) {
     i5 = 3440;
     do {
      i9 = HEAP32[i5 >> 2] | 0;
      i8 = i5 + 4 | 0;
      i7 = HEAP32[i8 >> 2] | 0;
      if ((i26 | 0) == (i9 + i7 | 0)) {
       i34 = i9;
       i35 = i8;
       i36 = i7;
       i37 = i5;
       i47 = 202;
       break;
      }
      i5 = HEAP32[i5 + 8 >> 2] | 0;
     } while ((i5 | 0) != 0);
     if (((i47 | 0) == 202 ? (HEAP32[i37 + 12 >> 2] & 8 | 0) == 0 : 0) ? i16 >>> 0 < i26 >>> 0 & i16 >>> 0 >= i34 >>> 0 : 0) {
      HEAP32[i35 >> 2] = i36 + i19;
      i47 = (HEAP32[751] | 0) + i19 | 0;
      i46 = i16 + 8 | 0;
      i46 = (i46 & 7 | 0) == 0 ? 0 : 0 - i46 & 7;
      i45 = i47 - i46 | 0;
      HEAP32[754] = i16 + i46;
      HEAP32[751] = i45;
      HEAP32[i16 + (i46 + 4) >> 2] = i45 | 1;
      HEAP32[i16 + (i47 + 4) >> 2] = 40;
      HEAP32[755] = HEAP32[870];
      break;
     }
     i8 = HEAP32[752] | 0;
     if (i26 >>> 0 < i8 >>> 0) {
      HEAP32[752] = i26;
      i8 = i26;
     }
     i7 = i26 + i19 | 0;
     i9 = 3440;
     while (1) {
      if ((HEAP32[i9 >> 2] | 0) == (i7 | 0)) {
       i5 = i9;
       i7 = i9;
       i47 = 210;
       break;
      }
      i9 = HEAP32[i9 + 8 >> 2] | 0;
      if (!i9) {
       i7 = 3440;
       break;
      }
     }
     if ((i47 | 0) == 210) if (!(HEAP32[i7 + 12 >> 2] & 8)) {
      HEAP32[i5 >> 2] = i26;
      i14 = i7 + 4 | 0;
      HEAP32[i14 >> 2] = (HEAP32[i14 >> 2] | 0) + i19;
      i14 = i26 + 8 | 0;
      i14 = (i14 & 7 | 0) == 0 ? 0 : 0 - i14 & 7;
      i11 = i26 + (i19 + 8) | 0;
      i11 = (i11 & 7 | 0) == 0 ? 0 : 0 - i11 & 7;
      i7 = i26 + (i11 + i19) | 0;
      i15 = i14 + i18 | 0;
      i13 = i26 + i15 | 0;
      i9 = i7 - (i26 + i14) - i18 | 0;
      HEAP32[i26 + (i14 + 4) >> 2] = i18 | 3;
      L297 : do if ((i7 | 0) != (i16 | 0)) {
       if ((i7 | 0) == (HEAP32[753] | 0)) {
        i47 = (HEAP32[750] | 0) + i9 | 0;
        HEAP32[750] = i47;
        HEAP32[753] = i13;
        HEAP32[i26 + (i15 + 4) >> 2] = i47 | 1;
        HEAP32[i26 + (i47 + i15) >> 2] = i47;
        break;
       }
       i1 = i19 + 4 | 0;
       i6 = HEAP32[i26 + (i1 + i11) >> 2] | 0;
       if ((i6 & 3 | 0) == 1) {
        i10 = i6 & -8;
        i3 = i6 >>> 3;
        L305 : do if (i6 >>> 0 >= 256) {
         i2 = HEAP32[i26 + ((i11 | 24) + i19) >> 2] | 0;
         i5 = HEAP32[i26 + (i19 + 12 + i11) >> 2] | 0;
         L324 : do if ((i5 | 0) == (i7 | 0)) {
          i4 = i11 | 16;
          i5 = i26 + (i1 + i4) | 0;
          i6 = HEAP32[i5 >> 2] | 0;
          if (!i6) {
           i5 = i26 + (i4 + i19) | 0;
           i6 = HEAP32[i5 >> 2] | 0;
           if (!i6) {
            i43 = 0;
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
           i43 = i6;
           break;
          }
         } else {
          i4 = HEAP32[i26 + ((i11 | 8) + i19) >> 2] | 0;
          do if (i4 >>> 0 >= i8 >>> 0) {
           i8 = i4 + 12 | 0;
           if ((HEAP32[i8 >> 2] | 0) != (i7 | 0)) break;
           i6 = i5 + 8 | 0;
           if ((HEAP32[i6 >> 2] | 0) != (i7 | 0)) break;
           HEAP32[i8 >> 2] = i5;
           HEAP32[i6 >> 2] = i4;
           i43 = i5;
           break L324;
          } while (0);
          _abort();
         } while (0);
         if (!i2) break;
         i8 = HEAP32[i26 + (i19 + 28 + i11) >> 2] | 0;
         i6 = 3296 + (i8 << 2) | 0;
         do if ((i7 | 0) != (HEAP32[i6 >> 2] | 0)) {
          if (i2 >>> 0 < (HEAP32[752] | 0) >>> 0) _abort();
          i6 = i2 + 16 | 0;
          if ((HEAP32[i6 >> 2] | 0) == (i7 | 0)) HEAP32[i6 >> 2] = i43; else HEAP32[i2 + 20 >> 2] = i43;
          if (!i43) break L305;
         } else {
          HEAP32[i6 >> 2] = i43;
          if (i43) break;
          HEAP32[749] = HEAP32[749] & ~(1 << i8);
          break L305;
         } while (0);
         i8 = HEAP32[752] | 0;
         if (i43 >>> 0 < i8 >>> 0) _abort();
         HEAP32[i43 + 24 >> 2] = i2;
         i7 = i11 | 16;
         i6 = HEAP32[i26 + (i7 + i19) >> 2] | 0;
         do if (i6) if (i6 >>> 0 < i8 >>> 0) _abort(); else {
          HEAP32[i43 + 16 >> 2] = i6;
          HEAP32[i6 + 24 >> 2] = i43;
          break;
         } while (0);
         i7 = HEAP32[i26 + (i1 + i7) >> 2] | 0;
         if (!i7) break;
         if (i7 >>> 0 < (HEAP32[752] | 0) >>> 0) _abort(); else {
          HEAP32[i43 + 20 >> 2] = i7;
          HEAP32[i7 + 24 >> 2] = i43;
          break;
         }
        } else {
         i6 = HEAP32[i26 + ((i11 | 8) + i19) >> 2] | 0;
         i5 = HEAP32[i26 + (i19 + 12 + i11) >> 2] | 0;
         i4 = 3032 + (i3 << 1 << 2) | 0;
         do if ((i6 | 0) != (i4 | 0)) {
          if (i6 >>> 0 >= i8 >>> 0 ? (HEAP32[i6 + 12 >> 2] | 0) == (i7 | 0) : 0) break;
          _abort();
         } while (0);
         if ((i5 | 0) == (i6 | 0)) {
          HEAP32[748] = HEAP32[748] & ~(1 << i3);
          break;
         }
         do if ((i5 | 0) == (i4 | 0)) i38 = i5 + 8 | 0; else {
          if (i5 >>> 0 >= i8 >>> 0 ? (i39 = i5 + 8 | 0, (HEAP32[i39 >> 2] | 0) == (i7 | 0)) : 0) {
           i38 = i39;
           break;
          }
          _abort();
         } while (0);
         HEAP32[i6 + 12 >> 2] = i5;
         HEAP32[i38 >> 2] = i6;
        } while (0);
        i7 = i26 + ((i10 | i11) + i19) | 0;
        i9 = i10 + i9 | 0;
       }
       i7 = i7 + 4 | 0;
       HEAP32[i7 >> 2] = HEAP32[i7 >> 2] & -2;
       HEAP32[i26 + (i15 + 4) >> 2] = i9 | 1;
       HEAP32[i26 + (i9 + i15) >> 2] = i9;
       i7 = i9 >>> 3;
       if (i9 >>> 0 < 256) {
        i5 = i7 << 1;
        i3 = 3032 + (i5 << 2) | 0;
        i4 = HEAP32[748] | 0;
        i6 = 1 << i7;
        do if (!(i4 & i6)) {
         HEAP32[748] = i4 | i6;
         i44 = 3032 + (i5 + 2 << 2) | 0;
         i45 = i3;
        } else {
         i6 = 3032 + (i5 + 2 << 2) | 0;
         i5 = HEAP32[i6 >> 2] | 0;
         if (i5 >>> 0 >= (HEAP32[752] | 0) >>> 0) {
          i44 = i6;
          i45 = i5;
          break;
         }
         _abort();
        } while (0);
        HEAP32[i44 >> 2] = i13;
        HEAP32[i45 + 12 >> 2] = i13;
        HEAP32[i26 + (i15 + 8) >> 2] = i45;
        HEAP32[i26 + (i15 + 12) >> 2] = i3;
        break;
       }
       i2 = i9 >>> 8;
       do if (!i2) i7 = 0; else {
        if (i9 >>> 0 > 16777215) {
         i7 = 31;
         break;
        }
        i45 = (i2 + 1048320 | 0) >>> 16 & 8;
        i47 = i2 << i45;
        i44 = (i47 + 520192 | 0) >>> 16 & 4;
        i47 = i47 << i44;
        i7 = (i47 + 245760 | 0) >>> 16 & 2;
        i7 = 14 - (i44 | i45 | i7) + (i47 << i7 >>> 15) | 0;
        i7 = i9 >>> (i7 + 7 | 0) & 1 | i7 << 1;
       } while (0);
       i6 = 3296 + (i7 << 2) | 0;
       HEAP32[i26 + (i15 + 28) >> 2] = i7;
       HEAP32[i26 + (i15 + 20) >> 2] = 0;
       HEAP32[i26 + (i15 + 16) >> 2] = 0;
       i5 = HEAP32[749] | 0;
       i4 = 1 << i7;
       if (!(i5 & i4)) {
        HEAP32[749] = i5 | i4;
        HEAP32[i6 >> 2] = i13;
        HEAP32[i26 + (i15 + 24) >> 2] = i6;
        HEAP32[i26 + (i15 + 12) >> 2] = i13;
        HEAP32[i26 + (i15 + 8) >> 2] = i13;
        break;
       }
       i2 = HEAP32[i6 >> 2] | 0;
       L385 : do if ((HEAP32[i2 + 4 >> 2] & -8 | 0) != (i9 | 0)) {
        i7 = i9 << ((i7 | 0) == 31 ? 0 : 25 - (i7 >>> 1) | 0);
        while (1) {
         i1 = i2 + 16 + (i7 >>> 31 << 2) | 0;
         i6 = HEAP32[i1 >> 2] | 0;
         if (!i6) break;
         if ((HEAP32[i6 + 4 >> 2] & -8 | 0) == (i9 | 0)) {
          i46 = i6;
          break L385;
         } else {
          i7 = i7 << 1;
          i2 = i6;
         }
        }
        if (i1 >>> 0 < (HEAP32[752] | 0) >>> 0) _abort(); else {
         HEAP32[i1 >> 2] = i13;
         HEAP32[i26 + (i15 + 24) >> 2] = i2;
         HEAP32[i26 + (i15 + 12) >> 2] = i13;
         HEAP32[i26 + (i15 + 8) >> 2] = i13;
         break L297;
        }
       } else i46 = i2; while (0);
       i2 = i46 + 8 | 0;
       i1 = HEAP32[i2 >> 2] | 0;
       i47 = HEAP32[752] | 0;
       if (i1 >>> 0 >= i47 >>> 0 & i46 >>> 0 >= i47 >>> 0) {
        HEAP32[i1 + 12 >> 2] = i13;
        HEAP32[i2 >> 2] = i13;
        HEAP32[i26 + (i15 + 8) >> 2] = i1;
        HEAP32[i26 + (i15 + 12) >> 2] = i46;
        HEAP32[i26 + (i15 + 24) >> 2] = 0;
        break;
       } else _abort();
      } else {
       i47 = (HEAP32[751] | 0) + i9 | 0;
       HEAP32[751] = i47;
       HEAP32[754] = i13;
       HEAP32[i26 + (i15 + 4) >> 2] = i47 | 1;
      } while (0);
      i5 = i26 + (i14 | 8) | 0;
      break L212;
     } else i7 = 3440;
     while (1) {
      i5 = HEAP32[i7 >> 2] | 0;
      if (i5 >>> 0 <= i16 >>> 0 ? (i6 = HEAP32[i7 + 4 >> 2] | 0, i4 = i5 + i6 | 0, i4 >>> 0 > i16 >>> 0) : 0) break;
      i7 = HEAP32[i7 + 8 >> 2] | 0;
     }
     i7 = i5 + (i6 + -39) | 0;
     i7 = i5 + (i6 + -47 + ((i7 & 7 | 0) == 0 ? 0 : 0 - i7 & 7)) | 0;
     i8 = i16 + 16 | 0;
     i7 = i7 >>> 0 < i8 >>> 0 ? i16 : i7;
     i6 = i7 + 8 | 0;
     i5 = i26 + 8 | 0;
     i5 = (i5 & 7 | 0) == 0 ? 0 : 0 - i5 & 7;
     i47 = i19 + -40 - i5 | 0;
     HEAP32[754] = i26 + i5;
     HEAP32[751] = i47;
     HEAP32[i26 + (i5 + 4) >> 2] = i47 | 1;
     HEAP32[i26 + (i19 + -36) >> 2] = 40;
     HEAP32[755] = HEAP32[870];
     i5 = i7 + 4 | 0;
     HEAP32[i5 >> 2] = 27;
     HEAP32[i6 >> 2] = HEAP32[860];
     HEAP32[i6 + 4 >> 2] = HEAP32[861];
     HEAP32[i6 + 8 >> 2] = HEAP32[862];
     HEAP32[i6 + 12 >> 2] = HEAP32[863];
     HEAP32[860] = i26;
     HEAP32[861] = i19;
     HEAP32[863] = 0;
     HEAP32[862] = i6;
     i6 = i7 + 28 | 0;
     HEAP32[i6 >> 2] = 7;
     if ((i7 + 32 | 0) >>> 0 < i4 >>> 0) do {
      i47 = i6;
      i6 = i6 + 4 | 0;
      HEAP32[i6 >> 2] = 7;
     } while ((i47 + 8 | 0) >>> 0 < i4 >>> 0);
     if ((i7 | 0) != (i16 | 0)) {
      i9 = i7 - i16 | 0;
      HEAP32[i5 >> 2] = HEAP32[i5 >> 2] & -2;
      HEAP32[i16 + 4 >> 2] = i9 | 1;
      HEAP32[i7 >> 2] = i9;
      i4 = i9 >>> 3;
      if (i9 >>> 0 < 256) {
       i6 = i4 << 1;
       i7 = 3032 + (i6 << 2) | 0;
       i5 = HEAP32[748] | 0;
       i3 = 1 << i4;
       if (i5 & i3) {
        i2 = 3032 + (i6 + 2 << 2) | 0;
        i1 = HEAP32[i2 >> 2] | 0;
        if (i1 >>> 0 < (HEAP32[752] | 0) >>> 0) _abort(); else {
         i40 = i2;
         i41 = i1;
        }
       } else {
        HEAP32[748] = i5 | i3;
        i40 = 3032 + (i6 + 2 << 2) | 0;
        i41 = i7;
       }
       HEAP32[i40 >> 2] = i16;
       HEAP32[i41 + 12 >> 2] = i16;
       HEAP32[i16 + 8 >> 2] = i41;
       HEAP32[i16 + 12 >> 2] = i7;
       break;
      }
      i2 = i9 >>> 8;
      if (i2) if (i9 >>> 0 > 16777215) i6 = 31; else {
       i46 = (i2 + 1048320 | 0) >>> 16 & 8;
       i47 = i2 << i46;
       i45 = (i47 + 520192 | 0) >>> 16 & 4;
       i47 = i47 << i45;
       i6 = (i47 + 245760 | 0) >>> 16 & 2;
       i6 = 14 - (i45 | i46 | i6) + (i47 << i6 >>> 15) | 0;
       i6 = i9 >>> (i6 + 7 | 0) & 1 | i6 << 1;
      } else i6 = 0;
      i3 = 3296 + (i6 << 2) | 0;
      HEAP32[i16 + 28 >> 2] = i6;
      HEAP32[i16 + 20 >> 2] = 0;
      HEAP32[i8 >> 2] = 0;
      i2 = HEAP32[749] | 0;
      i1 = 1 << i6;
      if (!(i2 & i1)) {
       HEAP32[749] = i2 | i1;
       HEAP32[i3 >> 2] = i16;
       HEAP32[i16 + 24 >> 2] = i3;
       HEAP32[i16 + 12 >> 2] = i16;
       HEAP32[i16 + 8 >> 2] = i16;
       break;
      }
      i2 = HEAP32[i3 >> 2] | 0;
      L425 : do if ((HEAP32[i2 + 4 >> 2] & -8 | 0) != (i9 | 0)) {
       i6 = i9 << ((i6 | 0) == 31 ? 0 : 25 - (i6 >>> 1) | 0);
       while (1) {
        i1 = i2 + 16 + (i6 >>> 31 << 2) | 0;
        i3 = HEAP32[i1 >> 2] | 0;
        if (!i3) break;
        if ((HEAP32[i3 + 4 >> 2] & -8 | 0) == (i9 | 0)) {
         i42 = i3;
         break L425;
        } else {
         i6 = i6 << 1;
         i2 = i3;
        }
       }
       if (i1 >>> 0 < (HEAP32[752] | 0) >>> 0) _abort(); else {
        HEAP32[i1 >> 2] = i16;
        HEAP32[i16 + 24 >> 2] = i2;
        HEAP32[i16 + 12 >> 2] = i16;
        HEAP32[i16 + 8 >> 2] = i16;
        break L272;
       }
      } else i42 = i2; while (0);
      i2 = i42 + 8 | 0;
      i1 = HEAP32[i2 >> 2] | 0;
      i47 = HEAP32[752] | 0;
      if (i1 >>> 0 >= i47 >>> 0 & i42 >>> 0 >= i47 >>> 0) {
       HEAP32[i1 + 12 >> 2] = i16;
       HEAP32[i2 >> 2] = i16;
       HEAP32[i16 + 8 >> 2] = i1;
       HEAP32[i16 + 12 >> 2] = i42;
       HEAP32[i16 + 24 >> 2] = 0;
       break;
      } else _abort();
     }
    } else {
     i47 = HEAP32[752] | 0;
     if ((i47 | 0) == 0 | i26 >>> 0 < i47 >>> 0) HEAP32[752] = i26;
     HEAP32[860] = i26;
     HEAP32[861] = i19;
     HEAP32[863] = 0;
     HEAP32[757] = HEAP32[866];
     HEAP32[756] = -1;
     i2 = 0;
     do {
      i47 = i2 << 1;
      i46 = 3032 + (i47 << 2) | 0;
      HEAP32[3032 + (i47 + 3 << 2) >> 2] = i46;
      HEAP32[3032 + (i47 + 2 << 2) >> 2] = i46;
      i2 = i2 + 1 | 0;
     } while ((i2 | 0) != 32);
     i47 = i26 + 8 | 0;
     i47 = (i47 & 7 | 0) == 0 ? 0 : 0 - i47 & 7;
     i46 = i19 + -40 - i47 | 0;
     HEAP32[754] = i26 + i47;
     HEAP32[751] = i46;
     HEAP32[i26 + (i47 + 4) >> 2] = i46 | 1;
     HEAP32[i26 + (i19 + -36) >> 2] = 40;
     HEAP32[755] = HEAP32[870];
    } while (0);
    i1 = HEAP32[751] | 0;
    if (i1 >>> 0 > i18 >>> 0) {
     i47 = i1 - i18 | 0;
     HEAP32[751] = i47;
     i5 = HEAP32[754] | 0;
     HEAP32[754] = i5 + i18;
     HEAP32[i5 + (i18 + 4) >> 2] = i47 | 1;
     HEAP32[i5 + 4 >> 2] = i18 | 3;
     i5 = i5 + 8 | 0;
     break;
    }
   }
   i5 = ___errno_location() | 0;
   HEAP32[i5 >> 2] = 12;
   i5 = 0;
  } else i5 = 0;
 } while (0);
 return i5 | 0;
}

function _printf_core(i50, i2, i51, i52, i53) {
 i50 = i50 | 0;
 i2 = i2 | 0;
 i51 = i51 | 0;
 i52 = i52 | 0;
 i53 = i53 | 0;
 var i1 = 0, i3 = 0, i4 = 0, i5 = 0, d6 = 0.0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, d11 = 0.0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, i42 = 0, i43 = 0, i44 = 0, i45 = 0, i46 = 0, i47 = 0, i48 = 0, i49 = 0, i54 = 0;
 i54 = STACKTOP;
 STACKTOP = STACKTOP + 624 | 0;
 i45 = i54 + 24 | 0;
 i47 = i54 + 16 | 0;
 i46 = i54 + 588 | 0;
 i40 = i54 + 576 | 0;
 i44 = i54;
 i37 = i54 + 536 | 0;
 i49 = i54 + 8 | 0;
 i48 = i54 + 528 | 0;
 i28 = (i50 | 0) != 0;
 i29 = i37 + 40 | 0;
 i36 = i29;
 i37 = i37 + 39 | 0;
 i38 = i49 + 4 | 0;
 i39 = i40 + 12 | 0;
 i40 = i40 + 11 | 0;
 i41 = i46;
 i42 = i39;
 i43 = i42 - i41 | 0;
 i30 = -2 - i41 | 0;
 i31 = i42 + 2 | 0;
 i32 = i45 + 288 | 0;
 i33 = i46 + 9 | 0;
 i34 = i33;
 i35 = i46 + 8 | 0;
 i1 = 0;
 i12 = i2;
 i3 = 0;
 i2 = 0;
 L1 : while (1) {
  do if ((i1 | 0) > -1) if ((i3 | 0) > (2147483647 - i1 | 0)) {
   i1 = ___errno_location() | 0;
   HEAP32[i1 >> 2] = 75;
   i1 = -1;
   break;
  } else {
   i1 = i3 + i1 | 0;
   break;
  } while (0);
  i3 = HEAP8[i12 >> 0] | 0;
  if (!(i3 << 24 >> 24)) {
   i27 = 245;
   break;
  } else i4 = i12;
  L9 : while (1) {
   switch (i3 << 24 >> 24) {
   case 37:
    {
     i3 = i4;
     i27 = 9;
     break L9;
    }
   case 0:
    {
     i3 = i4;
     break L9;
    }
   default:
    {}
   }
   i26 = i4 + 1 | 0;
   i3 = HEAP8[i26 >> 0] | 0;
   i4 = i26;
  }
  L12 : do if ((i27 | 0) == 9) while (1) {
   i27 = 0;
   if ((HEAP8[i3 + 1 >> 0] | 0) != 37) break L12;
   i4 = i4 + 1 | 0;
   i3 = i3 + 2 | 0;
   if ((HEAP8[i3 >> 0] | 0) == 37) i27 = 9; else break;
  } while (0);
  i17 = i4 - i12 | 0;
  if (i28 ? (HEAP32[i50 >> 2] & 32 | 0) == 0 : 0) ___fwritex(i12, i17, i50) | 0;
  if ((i4 | 0) != (i12 | 0)) {
   i12 = i3;
   i3 = i17;
   continue;
  }
  i7 = i3 + 1 | 0;
  i4 = HEAP8[i7 >> 0] | 0;
  i5 = (i4 << 24 >> 24) + -48 | 0;
  if (i5 >>> 0 < 10) {
   i26 = (HEAP8[i3 + 2 >> 0] | 0) == 36;
   i7 = i26 ? i3 + 3 | 0 : i7;
   i4 = HEAP8[i7 >> 0] | 0;
   i18 = i26 ? i5 : -1;
   i2 = i26 ? 1 : i2;
  } else i18 = -1;
  i3 = i4 << 24 >> 24;
  L25 : do if ((i3 & -32 | 0) == 32) {
   i5 = 0;
   while (1) {
    if (!(1 << i3 + -32 & 75913)) {
     i10 = i5;
     break L25;
    }
    i5 = 1 << (i4 << 24 >> 24) + -32 | i5;
    i7 = i7 + 1 | 0;
    i4 = HEAP8[i7 >> 0] | 0;
    i3 = i4 << 24 >> 24;
    if ((i3 & -32 | 0) != 32) {
     i10 = i5;
     break;
    }
   }
  } else i10 = 0; while (0);
  do if (i4 << 24 >> 24 == 42) {
   i3 = i7 + 1 | 0;
   i5 = (HEAP8[i3 >> 0] | 0) + -48 | 0;
   if (i5 >>> 0 < 10 ? (HEAP8[i7 + 2 >> 0] | 0) == 36 : 0) {
    HEAP32[i53 + (i5 << 2) >> 2] = 10;
    i2 = 1;
    i4 = i7 + 3 | 0;
    i7 = HEAP32[i52 + ((HEAP8[i3 >> 0] | 0) + -48 << 3) >> 2] | 0;
   } else {
    if (i2) {
     i1 = -1;
     break L1;
    }
    if (!i28) {
     i15 = i10;
     i4 = i3;
     i2 = 0;
     i26 = 0;
     break;
    }
    i2 = (HEAP32[i51 >> 2] | 0) + (4 - 1) & ~(4 - 1);
    i7 = HEAP32[i2 >> 2] | 0;
    HEAP32[i51 >> 2] = i2 + 4;
    i2 = 0;
    i4 = i3;
   }
   if ((i7 | 0) < 0) {
    i15 = i10 | 8192;
    i26 = 0 - i7 | 0;
   } else {
    i15 = i10;
    i26 = i7;
   }
  } else {
   i5 = (i4 << 24 >> 24) + -48 | 0;
   if (i5 >>> 0 < 10) {
    i4 = i7;
    i7 = 0;
    do {
     i7 = (i7 * 10 | 0) + i5 | 0;
     i4 = i4 + 1 | 0;
     i5 = (HEAP8[i4 >> 0] | 0) + -48 | 0;
    } while (i5 >>> 0 < 10);
    if ((i7 | 0) < 0) {
     i1 = -1;
     break L1;
    } else {
     i15 = i10;
     i26 = i7;
    }
   } else {
    i15 = i10;
    i4 = i7;
    i26 = 0;
   }
  } while (0);
  L46 : do if ((HEAP8[i4 >> 0] | 0) == 46) {
   i5 = i4 + 1 | 0;
   i7 = HEAP8[i5 >> 0] | 0;
   if (i7 << 24 >> 24 != 42) {
    i3 = (i7 << 24 >> 24) + -48 | 0;
    if (i3 >>> 0 < 10) {
     i4 = i5;
     i7 = 0;
    } else {
     i4 = i5;
     i16 = 0;
     break;
    }
    while (1) {
     i7 = (i7 * 10 | 0) + i3 | 0;
     i4 = i4 + 1 | 0;
     i3 = (HEAP8[i4 >> 0] | 0) + -48 | 0;
     if (i3 >>> 0 >= 10) {
      i16 = i7;
      break L46;
     }
    }
   }
   i5 = i4 + 2 | 0;
   i7 = (HEAP8[i5 >> 0] | 0) + -48 | 0;
   if (i7 >>> 0 < 10 ? (HEAP8[i4 + 3 >> 0] | 0) == 36 : 0) {
    HEAP32[i53 + (i7 << 2) >> 2] = 10;
    i4 = i4 + 4 | 0;
    i16 = HEAP32[i52 + ((HEAP8[i5 >> 0] | 0) + -48 << 3) >> 2] | 0;
    break;
   }
   if (i2) {
    i1 = -1;
    break L1;
   }
   if (i28) {
    i4 = (HEAP32[i51 >> 2] | 0) + (4 - 1) & ~(4 - 1);
    i16 = HEAP32[i4 >> 2] | 0;
    HEAP32[i51 >> 2] = i4 + 4;
    i4 = i5;
   } else {
    i4 = i5;
    i16 = 0;
   }
  } else i16 = -1; while (0);
  i10 = 0;
  while (1) {
   i7 = (HEAP8[i4 >> 0] | 0) + -65 | 0;
   if (i7 >>> 0 > 57) {
    i1 = -1;
    break L1;
   }
   i8 = i4 + 1 | 0;
   i7 = HEAP8[10908 + (i10 * 58 | 0) + i7 >> 0] | 0;
   i5 = i7 & 255;
   if ((i5 + -1 | 0) >>> 0 < 8) {
    i4 = i8;
    i10 = i5;
   } else {
    i25 = i8;
    break;
   }
  }
  if (!(i7 << 24 >> 24)) {
   i1 = -1;
   break;
  }
  i8 = (i18 | 0) > -1;
  do if (i7 << 24 >> 24 == 19) if (i8) {
   i1 = -1;
   break L1;
  } else i27 = 52; else {
   if (i8) {
    HEAP32[i53 + (i18 << 2) >> 2] = i5;
    i22 = i52 + (i18 << 3) | 0;
    i23 = HEAP32[i22 + 4 >> 2] | 0;
    i27 = i44;
    HEAP32[i27 >> 2] = HEAP32[i22 >> 2];
    HEAP32[i27 + 4 >> 2] = i23;
    i27 = 52;
    break;
   }
   if (!i28) {
    i1 = 0;
    break L1;
   }
   _pop_arg(i44, i5, i51);
  } while (0);
  if ((i27 | 0) == 52 ? (i27 = 0, !i28) : 0) {
   i12 = i25;
   i3 = i17;
   continue;
  }
  i20 = HEAP8[i4 >> 0] | 0;
  i20 = (i10 | 0) != 0 & (i20 & 15 | 0) == 3 ? i20 & -33 : i20;
  i5 = i15 & -65537;
  i24 = (i15 & 8192 | 0) == 0 ? i15 : i5;
  L75 : do switch (i20 | 0) {
  case 110:
   switch (i10 | 0) {
   case 0:
    {
     HEAP32[HEAP32[i44 >> 2] >> 2] = i1;
     i12 = i25;
     i3 = i17;
     continue L1;
    }
   case 1:
    {
     HEAP32[HEAP32[i44 >> 2] >> 2] = i1;
     i12 = i25;
     i3 = i17;
     continue L1;
    }
   case 2:
    {
     i12 = HEAP32[i44 >> 2] | 0;
     HEAP32[i12 >> 2] = i1;
     HEAP32[i12 + 4 >> 2] = ((i1 | 0) < 0) << 31 >> 31;
     i12 = i25;
     i3 = i17;
     continue L1;
    }
   case 3:
    {
     HEAP16[HEAP32[i44 >> 2] >> 1] = i1;
     i12 = i25;
     i3 = i17;
     continue L1;
    }
   case 4:
    {
     HEAP8[HEAP32[i44 >> 2] >> 0] = i1;
     i12 = i25;
     i3 = i17;
     continue L1;
    }
   case 6:
    {
     HEAP32[HEAP32[i44 >> 2] >> 2] = i1;
     i12 = i25;
     i3 = i17;
     continue L1;
    }
   case 7:
    {
     i12 = HEAP32[i44 >> 2] | 0;
     HEAP32[i12 >> 2] = i1;
     HEAP32[i12 + 4 >> 2] = ((i1 | 0) < 0) << 31 >> 31;
     i12 = i25;
     i3 = i17;
     continue L1;
    }
   default:
    {
     i12 = i25;
     i3 = i17;
     continue L1;
    }
   }
  case 112:
   {
    i10 = i24 | 8;
    i4 = i16 >>> 0 > 8 ? i16 : 8;
    i9 = 120;
    i27 = 64;
    break;
   }
  case 88:
  case 120:
   {
    i10 = i24;
    i4 = i16;
    i9 = i20;
    i27 = 64;
    break;
   }
  case 111:
   {
    i5 = i44;
    i4 = HEAP32[i5 >> 2] | 0;
    i5 = HEAP32[i5 + 4 >> 2] | 0;
    if ((i4 | 0) == 0 & (i5 | 0) == 0) i3 = i29; else {
     i3 = i29;
     do {
      i3 = i3 + -1 | 0;
      HEAP8[i3 >> 0] = i4 & 7 | 48;
      i4 = _bitshift64Lshr(i4 | 0, i5 | 0, 3) | 0;
      i5 = tempRet0;
     } while (!((i4 | 0) == 0 & (i5 | 0) == 0));
    }
    if (!(i24 & 8)) {
     i7 = i24;
     i4 = i16;
     i8 = 0;
     i9 = 11388;
     i27 = 77;
    } else {
     i4 = i36 - i3 + 1 | 0;
     i7 = i24;
     i4 = (i16 | 0) < (i4 | 0) ? i4 : i16;
     i8 = 0;
     i9 = 11388;
     i27 = 77;
    }
    break;
   }
  case 105:
  case 100:
   {
    i3 = i44;
    i4 = HEAP32[i3 >> 2] | 0;
    i3 = HEAP32[i3 + 4 >> 2] | 0;
    if ((i3 | 0) < 0) {
     i4 = _i64Subtract(0, 0, i4 | 0, i3 | 0) | 0;
     i3 = tempRet0;
     i8 = i44;
     HEAP32[i8 >> 2] = i4;
     HEAP32[i8 + 4 >> 2] = i3;
     i8 = 1;
     i5 = 11388;
     i27 = 76;
     break L75;
    }
    if (!(i24 & 2048)) {
     i5 = i24 & 1;
     i8 = i5;
     i5 = (i5 | 0) == 0 ? 11388 : 11390;
     i27 = 76;
    } else {
     i8 = 1;
     i5 = 11389;
     i27 = 76;
    }
    break;
   }
  case 117:
   {
    i3 = i44;
    i4 = HEAP32[i3 >> 2] | 0;
    i3 = HEAP32[i3 + 4 >> 2] | 0;
    i8 = 0;
    i5 = 11388;
    i27 = 76;
    break;
   }
  case 99:
   {
    HEAP8[i37 >> 0] = HEAP32[i44 >> 2];
    i12 = i37;
    i4 = 1;
    i10 = 0;
    i9 = 11388;
    i7 = i29;
    break;
   }
  case 109:
   {
    i7 = ___errno_location() | 0;
    i7 = _strerror(HEAP32[i7 >> 2] | 0) | 0;
    i27 = 82;
    break;
   }
  case 115:
   {
    i7 = HEAP32[i44 >> 2] | 0;
    i7 = (i7 | 0) != 0 ? i7 : 11398;
    i27 = 82;
    break;
   }
  case 67:
   {
    HEAP32[i49 >> 2] = HEAP32[i44 >> 2];
    HEAP32[i38 >> 2] = 0;
    HEAP32[i44 >> 2] = i49;
    i3 = -1;
    i27 = 86;
    break;
   }
  case 83:
   {
    if (!i16) {
     _pad(i50, 32, i26, 0, i24);
     i4 = 0;
     i27 = 98;
    } else {
     i3 = i16;
     i27 = 86;
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
    d6 = +HEAPF64[i44 >> 3];
    HEAP32[i47 >> 2] = 0;
    HEAPF64[tempDoublePtr >> 3] = d6;
    if ((HEAP32[tempDoublePtr + 4 >> 2] | 0) >= 0) if (!(i24 & 2048)) {
     i23 = i24 & 1;
     i22 = i23;
     i23 = (i23 | 0) == 0 ? 11406 : 11411;
    } else {
     i22 = 1;
     i23 = 11408;
    } else {
     d6 = -d6;
     i22 = 1;
     i23 = 11405;
    }
    HEAPF64[tempDoublePtr >> 3] = d6;
    i21 = HEAP32[tempDoublePtr + 4 >> 2] & 2146435072;
    do if (i21 >>> 0 < 2146435072 | (i21 | 0) == 2146435072 & 0 < 0) {
     d11 = +_frexpl(d6, i47) * 2.0;
     i8 = d11 != 0.0;
     if (i8) HEAP32[i47 >> 2] = (HEAP32[i47 >> 2] | 0) + -1;
     i18 = i20 | 32;
     if ((i18 | 0) == 97) {
      i14 = i20 & 32;
      i13 = (i14 | 0) == 0 ? i23 : i23 + 9 | 0;
      i3 = i22 | 2;
      i7 = 12 - i16 | 0;
      do if (!(i16 >>> 0 > 11 | (i7 | 0) == 0)) {
       d6 = 8.0;
       do {
        i7 = i7 + -1 | 0;
        d6 = d6 * 16.0;
       } while ((i7 | 0) != 0);
       if ((HEAP8[i13 >> 0] | 0) == 45) {
        d6 = -(d6 + (-d11 - d6));
        break;
       } else {
        d6 = d11 + d6 - d6;
        break;
       }
      } else d6 = d11; while (0);
      i7 = HEAP32[i47 >> 2] | 0;
      i8 = (i7 | 0) < 0 ? 0 - i7 | 0 : i7;
      i8 = _fmt_u(i8, ((i8 | 0) < 0) << 31 >> 31, i39) | 0;
      if ((i8 | 0) == (i39 | 0)) {
       HEAP8[i40 >> 0] = 48;
       i8 = i40;
      }
      HEAP8[i8 + -1 >> 0] = (i7 >> 31 & 2) + 43;
      i10 = i8 + -2 | 0;
      HEAP8[i10 >> 0] = i20 + 15;
      i5 = (i16 | 0) < 1;
      i9 = (i24 & 8 | 0) == 0;
      i7 = i46;
      do {
       i23 = ~~d6;
       i8 = i7 + 1 | 0;
       HEAP8[i7 >> 0] = HEAPU8[11372 + i23 >> 0] | i14;
       d6 = (d6 - +(i23 | 0)) * 16.0;
       do if ((i8 - i41 | 0) == 1) {
        if (i9 & (i5 & d6 == 0.0)) {
         i7 = i8;
         break;
        }
        HEAP8[i8 >> 0] = 46;
        i7 = i7 + 2 | 0;
       } else i7 = i8; while (0);
      } while (d6 != 0.0);
      i4 = (i16 | 0) != 0 & (i30 + i7 | 0) < (i16 | 0) ? i31 + i16 - i10 | 0 : i43 - i10 + i7 | 0;
      i8 = i4 + i3 | 0;
      _pad(i50, 32, i26, i8, i24);
      if (!(HEAP32[i50 >> 2] & 32)) ___fwritex(i13, i3, i50) | 0;
      _pad(i50, 48, i26, i8, i24 ^ 65536);
      i7 = i7 - i41 | 0;
      if (!(HEAP32[i50 >> 2] & 32)) ___fwritex(i46, i7, i50) | 0;
      i5 = i42 - i10 | 0;
      _pad(i50, 48, i4 - (i7 + i5) | 0, 0, 0);
      if (!(HEAP32[i50 >> 2] & 32)) ___fwritex(i10, i5, i50) | 0;
      _pad(i50, 32, i26, i8, i24 ^ 8192);
      i3 = (i8 | 0) < (i26 | 0) ? i26 : i8;
      break;
     }
     i4 = (i16 | 0) < 0 ? 6 : i16;
     if (i8) {
      i7 = (HEAP32[i47 >> 2] | 0) + -28 | 0;
      HEAP32[i47 >> 2] = i7;
      d6 = d11 * 268435456.0;
     } else {
      d6 = d11;
      i7 = HEAP32[i47 >> 2] | 0;
     }
     i21 = (i7 | 0) < 0 ? i45 : i32;
     i19 = i21;
     i8 = i21;
     do {
      i17 = ~~d6 >>> 0;
      HEAP32[i8 >> 2] = i17;
      i8 = i8 + 4 | 0;
      d6 = (d6 - +(i17 >>> 0)) * 1.0e9;
     } while (d6 != 0.0);
     i10 = i8;
     i8 = HEAP32[i47 >> 2] | 0;
     if ((i8 | 0) > 0) {
      i7 = i21;
      do {
       i5 = (i8 | 0) > 29 ? 29 : i8;
       i8 = i10 + -4 | 0;
       do if (i8 >>> 0 >= i7 >>> 0) {
        i9 = 0;
        do {
         i17 = _bitshift64Shl(HEAP32[i8 >> 2] | 0, 0, i5 | 0) | 0;
         i17 = _i64Add(i17 | 0, tempRet0 | 0, i9 | 0, 0) | 0;
         i9 = tempRet0;
         i16 = ___uremdi3(i17 | 0, i9 | 0, 1e9, 0) | 0;
         HEAP32[i8 >> 2] = i16;
         i9 = ___udivdi3(i17 | 0, i9 | 0, 1e9, 0) | 0;
         i8 = i8 + -4 | 0;
        } while (i8 >>> 0 >= i7 >>> 0);
        if (!i9) break;
        i7 = i7 + -4 | 0;
        HEAP32[i7 >> 2] = i9;
       } while (0);
       i8 = i10;
       while (1) {
        if (i8 >>> 0 <= i7 >>> 0) {
         i10 = i8;
         break;
        }
        i9 = i8 + -4 | 0;
        if (!(HEAP32[i9 >> 2] | 0)) i8 = i9; else {
         i10 = i8;
         break;
        }
       }
       i8 = (HEAP32[i47 >> 2] | 0) - i5 | 0;
       HEAP32[i47 >> 2] = i8;
      } while ((i8 | 0) > 0);
      i9 = i7;
     } else i9 = i21;
     if ((i8 | 0) < 0) {
      i14 = ((i4 + 25 | 0) / 9 | 0) + 1 | 0;
      i12 = (i18 | 0) == 102;
      do {
       i13 = 0 - i8 | 0;
       i13 = (i13 | 0) > 9 ? 9 : i13;
       do if (i9 >>> 0 < i10 >>> 0) {
        i7 = (1 << i13) + -1 | 0;
        i5 = 1e9 >>> i13;
        i8 = 0;
        i3 = i9;
        do {
         i17 = HEAP32[i3 >> 2] | 0;
         HEAP32[i3 >> 2] = (i17 >>> i13) + i8;
         i8 = Math_imul(i17 & i7, i5) | 0;
         i3 = i3 + 4 | 0;
        } while (i3 >>> 0 < i10 >>> 0);
        i9 = (HEAP32[i9 >> 2] | 0) == 0 ? i9 + 4 | 0 : i9;
        if (!i8) break;
        HEAP32[i10 >> 2] = i8;
        i10 = i10 + 4 | 0;
       } else i9 = (HEAP32[i9 >> 2] | 0) == 0 ? i9 + 4 | 0 : i9; while (0);
       i8 = i12 ? i21 : i9;
       i10 = (i10 - i8 >> 2 | 0) > (i14 | 0) ? i8 + (i14 << 2) | 0 : i10;
       i8 = (HEAP32[i47 >> 2] | 0) + i13 | 0;
       HEAP32[i47 >> 2] = i8;
      } while ((i8 | 0) < 0);
      i3 = i9;
     } else i3 = i9;
     do if (i3 >>> 0 < i10 >>> 0) {
      i9 = (i19 - i3 >> 2) * 9 | 0;
      i7 = HEAP32[i3 >> 2] | 0;
      if (i7 >>> 0 < 10) break; else i8 = 10;
      do {
       i8 = i8 * 10 | 0;
       i9 = i9 + 1 | 0;
      } while (i7 >>> 0 >= i8 >>> 0);
     } else i9 = 0; while (0);
     i16 = (i18 | 0) == 103;
     i17 = (i4 | 0) != 0;
     i8 = i4 - ((i18 | 0) != 102 ? i9 : 0) + ((i17 & i16) << 31 >> 31) | 0;
     if ((i8 | 0) < (((i10 - i19 >> 2) * 9 | 0) + -9 | 0)) {
      i5 = i8 + 9216 | 0;
      i14 = (i5 | 0) / 9 | 0;
      i8 = i21 + (i14 + -1023 << 2) | 0;
      i5 = ((i5 | 0) % 9 | 0) + 1 | 0;
      if ((i5 | 0) < 9) {
       i7 = 10;
       do {
        i7 = i7 * 10 | 0;
        i5 = i5 + 1 | 0;
       } while ((i5 | 0) != 9);
      } else i7 = 10;
      i12 = HEAP32[i8 >> 2] | 0;
      i13 = (i12 >>> 0) % (i7 >>> 0) | 0;
      if ((i13 | 0) == 0 ? (i21 + (i14 + -1022 << 2) | 0) == (i10 | 0) : 0) i7 = i3; else i27 = 163;
      do if ((i27 | 0) == 163) {
       i27 = 0;
       d6 = (((i12 >>> 0) / (i7 >>> 0) | 0) & 1 | 0) == 0 ? 9007199254740992.0 : 9007199254740994.0;
       i5 = (i7 | 0) / 2 | 0;
       do if (i13 >>> 0 < i5 >>> 0) d11 = .5; else {
        if ((i13 | 0) == (i5 | 0) ? (i21 + (i14 + -1022 << 2) | 0) == (i10 | 0) : 0) {
         d11 = 1.0;
         break;
        }
        d11 = 1.5;
       } while (0);
       do if (i22) {
        if ((HEAP8[i23 >> 0] | 0) != 45) break;
        d6 = -d6;
        d11 = -d11;
       } while (0);
       i5 = i12 - i13 | 0;
       HEAP32[i8 >> 2] = i5;
       if (!(d6 + d11 != d6)) {
        i7 = i3;
        break;
       }
       i18 = i5 + i7 | 0;
       HEAP32[i8 >> 2] = i18;
       if (i18 >>> 0 > 999999999) {
        i9 = i3;
        while (1) {
         i7 = i8 + -4 | 0;
         HEAP32[i8 >> 2] = 0;
         if (i7 >>> 0 < i9 >>> 0) {
          i9 = i9 + -4 | 0;
          HEAP32[i9 >> 2] = 0;
         }
         i18 = (HEAP32[i7 >> 2] | 0) + 1 | 0;
         HEAP32[i7 >> 2] = i18;
         if (i18 >>> 0 > 999999999) i8 = i7; else {
          i3 = i9;
          i8 = i7;
          break;
         }
        }
       }
       i9 = (i19 - i3 >> 2) * 9 | 0;
       i5 = HEAP32[i3 >> 2] | 0;
       if (i5 >>> 0 < 10) {
        i7 = i3;
        break;
       } else i7 = 10;
       do {
        i7 = i7 * 10 | 0;
        i9 = i9 + 1 | 0;
       } while (i5 >>> 0 >= i7 >>> 0);
       i7 = i3;
      } while (0);
      i18 = i8 + 4 | 0;
      i3 = i7;
      i10 = i10 >>> 0 > i18 >>> 0 ? i18 : i10;
     }
     i14 = 0 - i9 | 0;
     while (1) {
      if (i10 >>> 0 <= i3 >>> 0) {
       i15 = 0;
       i18 = i10;
       break;
      }
      i8 = i10 + -4 | 0;
      if (!(HEAP32[i8 >> 2] | 0)) i10 = i8; else {
       i15 = 1;
       i18 = i10;
       break;
      }
     }
     do if (i16) {
      i8 = (i17 & 1 ^ 1) + i4 | 0;
      if ((i8 | 0) > (i9 | 0) & (i9 | 0) > -5) {
       i5 = i20 + -1 | 0;
       i4 = i8 + -1 - i9 | 0;
      } else {
       i5 = i20 + -2 | 0;
       i4 = i8 + -1 | 0;
      }
      i10 = i24 & 8;
      if (i10) {
       i13 = i10;
       break;
      }
      do if (i15) {
       i8 = HEAP32[i18 + -4 >> 2] | 0;
       if (!i8) {
        i10 = 9;
        break;
       }
       if (!((i8 >>> 0) % 10 | 0)) {
        i7 = 10;
        i10 = 0;
       } else {
        i10 = 0;
        break;
       }
       do {
        i7 = i7 * 10 | 0;
        i10 = i10 + 1 | 0;
       } while (((i8 >>> 0) % (i7 >>> 0) | 0 | 0) == 0);
      } else i10 = 9; while (0);
      i8 = ((i18 - i19 >> 2) * 9 | 0) + -9 | 0;
      if ((i5 | 32 | 0) == 102) {
       i13 = i8 - i10 | 0;
       i13 = (i13 | 0) < 0 ? 0 : i13;
       i4 = (i4 | 0) < (i13 | 0) ? i4 : i13;
       i13 = 0;
       break;
      } else {
       i13 = i8 + i9 - i10 | 0;
       i13 = (i13 | 0) < 0 ? 0 : i13;
       i4 = (i4 | 0) < (i13 | 0) ? i4 : i13;
       i13 = 0;
       break;
      }
     } else {
      i5 = i20;
      i13 = i24 & 8;
     } while (0);
     i12 = i4 | i13;
     i8 = (i12 | 0) != 0 & 1;
     i7 = (i5 | 32 | 0) == 102;
     if (i7) {
      i10 = (i9 | 0) > 0 ? i9 : 0;
      i14 = 0;
     } else {
      i10 = (i9 | 0) < 0 ? i14 : i9;
      i10 = _fmt_u(i10, ((i10 | 0) < 0) << 31 >> 31, i39) | 0;
      if ((i42 - i10 | 0) < 2) do {
       i10 = i10 + -1 | 0;
       HEAP8[i10 >> 0] = 48;
      } while ((i42 - i10 | 0) < 2);
      HEAP8[i10 + -1 >> 0] = (i9 >> 31 & 2) + 43;
      i14 = i10 + -2 | 0;
      HEAP8[i14 >> 0] = i5;
      i10 = i42 - i14 | 0;
     }
     i16 = i22 + 1 + i4 + i8 + i10 | 0;
     _pad(i50, 32, i26, i16, i24);
     if (!(HEAP32[i50 >> 2] & 32)) ___fwritex(i23, i22, i50) | 0;
     _pad(i50, 48, i26, i16, i24 ^ 65536);
     do if (i7) {
      i10 = i3 >>> 0 > i21 >>> 0 ? i21 : i3;
      i7 = i10;
      do {
       i8 = _fmt_u(HEAP32[i7 >> 2] | 0, 0, i33) | 0;
       do if ((i7 | 0) == (i10 | 0)) {
        if ((i8 | 0) != (i33 | 0)) break;
        HEAP8[i35 >> 0] = 48;
        i8 = i35;
       } else {
        if (i8 >>> 0 <= i46 >>> 0) break;
        do {
         i8 = i8 + -1 | 0;
         HEAP8[i8 >> 0] = 48;
        } while (i8 >>> 0 > i46 >>> 0);
       } while (0);
       if (!(HEAP32[i50 >> 2] & 32)) ___fwritex(i8, i34 - i8 | 0, i50) | 0;
       i7 = i7 + 4 | 0;
      } while (i7 >>> 0 <= i21 >>> 0);
      do if (i12) {
       if (HEAP32[i50 >> 2] & 32) break;
       ___fwritex(11440, 1, i50) | 0;
      } while (0);
      if ((i4 | 0) > 0 & i7 >>> 0 < i18 >>> 0) {
       i5 = i4;
       i8 = i7;
       while (1) {
        i7 = _fmt_u(HEAP32[i8 >> 2] | 0, 0, i33) | 0;
        if (i7 >>> 0 > i46 >>> 0) do {
         i7 = i7 + -1 | 0;
         HEAP8[i7 >> 0] = 48;
        } while (i7 >>> 0 > i46 >>> 0);
        if (!(HEAP32[i50 >> 2] & 32)) ___fwritex(i7, (i5 | 0) > 9 ? 9 : i5, i50) | 0;
        i8 = i8 + 4 | 0;
        i4 = i5 + -9 | 0;
        if (!((i5 | 0) > 9 & i8 >>> 0 < i18 >>> 0)) break; else i5 = i4;
       }
      }
      _pad(i50, 48, i4 + 9 | 0, 9, 0);
     } else {
      i5 = i15 ? i18 : i3 + 4 | 0;
      if ((i4 | 0) > -1) {
       i9 = (i13 | 0) == 0;
       i10 = i3;
       do {
        i8 = _fmt_u(HEAP32[i10 >> 2] | 0, 0, i33) | 0;
        if ((i8 | 0) == (i33 | 0)) {
         HEAP8[i35 >> 0] = 48;
         i8 = i35;
        }
        do if ((i10 | 0) == (i3 | 0)) {
         i7 = i8 + 1 | 0;
         if (!(HEAP32[i50 >> 2] & 32)) ___fwritex(i8, 1, i50) | 0;
         if (i9 & (i4 | 0) < 1) {
          i8 = i7;
          break;
         }
         if (HEAP32[i50 >> 2] & 32) {
          i8 = i7;
          break;
         }
         ___fwritex(11440, 1, i50) | 0;
         i8 = i7;
        } else {
         if (i8 >>> 0 <= i46 >>> 0) break;
         do {
          i8 = i8 + -1 | 0;
          HEAP8[i8 >> 0] = 48;
         } while (i8 >>> 0 > i46 >>> 0);
        } while (0);
        i7 = i34 - i8 | 0;
        if (!(HEAP32[i50 >> 2] & 32)) ___fwritex(i8, (i4 | 0) > (i7 | 0) ? i7 : i4, i50) | 0;
        i4 = i4 - i7 | 0;
        i10 = i10 + 4 | 0;
       } while (i10 >>> 0 < i5 >>> 0 & (i4 | 0) > -1);
      }
      _pad(i50, 48, i4 + 18 | 0, 18, 0);
      if (HEAP32[i50 >> 2] & 32) break;
      ___fwritex(i14, i42 - i14 | 0, i50) | 0;
     } while (0);
     _pad(i50, 32, i26, i16, i24 ^ 8192);
     i3 = (i16 | 0) < (i26 | 0) ? i26 : i16;
    } else {
     i3 = (i20 & 32 | 0) != 0;
     i4 = d6 != d6 | 0.0 != 0.0;
     i7 = i4 ? 0 : i22;
     i8 = i7 + 3 | 0;
     _pad(i50, 32, i26, i8, i5);
     i5 = HEAP32[i50 >> 2] | 0;
     if (!(i5 & 32)) {
      ___fwritex(i23, i7, i50) | 0;
      i5 = HEAP32[i50 >> 2] | 0;
     }
     if (!(i5 & 32)) ___fwritex(i4 ? (i3 ? 11432 : 11436) : i3 ? 11424 : 11428, 3, i50) | 0;
     _pad(i50, 32, i26, i8, i24 ^ 8192);
     i3 = (i8 | 0) < (i26 | 0) ? i26 : i8;
    } while (0);
    i12 = i25;
    continue L1;
   }
  default:
   {
    i5 = i24;
    i4 = i16;
    i10 = 0;
    i9 = 11388;
    i7 = i29;
   }
  } while (0);
  L313 : do if ((i27 | 0) == 64) {
   i5 = i44;
   i7 = HEAP32[i5 >> 2] | 0;
   i5 = HEAP32[i5 + 4 >> 2] | 0;
   i8 = i9 & 32;
   if (!((i7 | 0) == 0 & (i5 | 0) == 0)) {
    i3 = i29;
    do {
     i3 = i3 + -1 | 0;
     HEAP8[i3 >> 0] = HEAPU8[11372 + (i7 & 15) >> 0] | i8;
     i7 = _bitshift64Lshr(i7 | 0, i5 | 0, 4) | 0;
     i5 = tempRet0;
    } while (!((i7 | 0) == 0 & (i5 | 0) == 0));
    i27 = i44;
    if ((i10 & 8 | 0) == 0 | (HEAP32[i27 >> 2] | 0) == 0 & (HEAP32[i27 + 4 >> 2] | 0) == 0) {
     i7 = i10;
     i8 = 0;
     i9 = 11388;
     i27 = 77;
    } else {
     i7 = i10;
     i8 = 2;
     i9 = 11388 + (i9 >> 4) | 0;
     i27 = 77;
    }
   } else {
    i3 = i29;
    i7 = i10;
    i8 = 0;
    i9 = 11388;
    i27 = 77;
   }
  } else if ((i27 | 0) == 76) {
   i3 = _fmt_u(i4, i3, i29) | 0;
   i7 = i24;
   i4 = i16;
   i9 = i5;
   i27 = 77;
  } else if ((i27 | 0) == 82) {
   i27 = 0;
   i23 = _memchr(i7, 0, i16) | 0;
   i22 = (i23 | 0) == 0;
   i12 = i7;
   i4 = i22 ? i16 : i23 - i7 | 0;
   i10 = 0;
   i9 = 11388;
   i7 = i22 ? i7 + i16 | 0 : i23;
  } else if ((i27 | 0) == 86) {
   i27 = 0;
   i5 = 0;
   i4 = 0;
   i8 = HEAP32[i44 >> 2] | 0;
   while (1) {
    i7 = HEAP32[i8 >> 2] | 0;
    if (!i7) break;
    i4 = _wctomb(i48, i7) | 0;
    if ((i4 | 0) < 0 | i4 >>> 0 > (i3 - i5 | 0) >>> 0) break;
    i5 = i4 + i5 | 0;
    if (i3 >>> 0 > i5 >>> 0) i8 = i8 + 4 | 0; else break;
   }
   if ((i4 | 0) < 0) {
    i1 = -1;
    break L1;
   }
   _pad(i50, 32, i26, i5, i24);
   if (!i5) {
    i4 = 0;
    i27 = 98;
   } else {
    i3 = 0;
    i7 = HEAP32[i44 >> 2] | 0;
    while (1) {
     i4 = HEAP32[i7 >> 2] | 0;
     if (!i4) {
      i4 = i5;
      i27 = 98;
      break L313;
     }
     i4 = _wctomb(i48, i4) | 0;
     i3 = i4 + i3 | 0;
     if ((i3 | 0) > (i5 | 0)) {
      i4 = i5;
      i27 = 98;
      break L313;
     }
     if (!(HEAP32[i50 >> 2] & 32)) ___fwritex(i48, i4, i50) | 0;
     if (i3 >>> 0 >= i5 >>> 0) {
      i4 = i5;
      i27 = 98;
      break;
     } else i7 = i7 + 4 | 0;
    }
   }
  } while (0);
  if ((i27 | 0) == 98) {
   i27 = 0;
   _pad(i50, 32, i26, i4, i24 ^ 8192);
   i12 = i25;
   i3 = (i26 | 0) > (i4 | 0) ? i26 : i4;
   continue;
  }
  if ((i27 | 0) == 77) {
   i27 = 0;
   i5 = (i4 | 0) > -1 ? i7 & -65537 : i7;
   i7 = i44;
   i7 = (HEAP32[i7 >> 2] | 0) != 0 | (HEAP32[i7 + 4 >> 2] | 0) != 0;
   if ((i4 | 0) != 0 | i7) {
    i10 = (i7 & 1 ^ 1) + (i36 - i3) | 0;
    i12 = i3;
    i4 = (i4 | 0) > (i10 | 0) ? i4 : i10;
    i10 = i8;
    i7 = i29;
   } else {
    i12 = i29;
    i4 = 0;
    i10 = i8;
    i7 = i29;
   }
  }
  i8 = i7 - i12 | 0;
  i7 = (i4 | 0) < (i8 | 0) ? i8 : i4;
  i4 = i10 + i7 | 0;
  i3 = (i26 | 0) < (i4 | 0) ? i4 : i26;
  _pad(i50, 32, i3, i4, i5);
  if (!(HEAP32[i50 >> 2] & 32)) ___fwritex(i9, i10, i50) | 0;
  _pad(i50, 48, i3, i4, i5 ^ 65536);
  _pad(i50, 48, i7, i8, 0);
  if (!(HEAP32[i50 >> 2] & 32)) ___fwritex(i12, i8, i50) | 0;
  _pad(i50, 32, i3, i4, i5 ^ 8192);
  i12 = i25;
 }
 L348 : do if ((i27 | 0) == 245) if (!i50) if (i2) {
  i1 = 1;
  while (1) {
   i2 = HEAP32[i53 + (i1 << 2) >> 2] | 0;
   if (!i2) break;
   _pop_arg(i52 + (i1 << 3) | 0, i2, i51);
   i1 = i1 + 1 | 0;
   if ((i1 | 0) >= 10) {
    i1 = 1;
    break L348;
   }
  }
  if ((i1 | 0) < 10) while (1) {
   if (HEAP32[i53 + (i1 << 2) >> 2] | 0) {
    i1 = -1;
    break L348;
   }
   i1 = i1 + 1 | 0;
   if ((i1 | 0) >= 10) {
    i1 = 1;
    break;
   }
  } else i1 = 1;
 } else i1 = 0; while (0);
 STACKTOP = i54;
 return i1 | 0;
}

function _lodepng_inflate(i42, i43, i39, i40, i1) {
 i42 = i42 | 0;
 i43 = i43 | 0;
 i39 = i39 | 0;
 i40 = i40 | 0;
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i41 = 0, i44 = 0, i45 = 0, i46 = 0, i47 = 0;
 i41 = STACKTOP;
 STACKTOP = STACKTOP + 64 | 0;
 i36 = i41 + 40 | 0;
 i38 = i41 + 20 | 0;
 i37 = i41;
 i19 = HEAP32[i43 >> 2] | 0;
 i29 = i40 << 3;
 i30 = i38 + 4 | 0;
 i31 = i38 + 8 | 0;
 i32 = i37 + 4 | 0;
 i33 = i37 + 8 | 0;
 i34 = i38 + 16 | 0;
 i35 = i37 + 16 | 0;
 i21 = i36 + 4 | 0;
 i22 = i36 + 8 | 0;
 i23 = i36 + 16 | 0;
 i24 = i36 + 12 | 0;
 i25 = i38 + 12 | 0;
 i26 = i37 + 12 | 0;
 i8 = 0;
 i1 = i19;
 i20 = 0;
 i2 = HEAP32[i42 >> 2] | 0;
 L1 : while (1) {
  i3 = i8 + 2 | 0;
  if (i3 >>> 0 >= i29 >>> 0) {
   i3 = 52;
   i44 = 112;
   break;
  }
  i27 = HEAPU8[i39 + (i8 >>> 3) >> 0] | 0;
  i28 = i8 & 7;
  i18 = i8 + 1 | 0;
  i5 = i8 + 3 | 0;
  i3 = (HEAPU8[i39 + (i3 >>> 3) >> 0] | 0) >>> (i3 & 7) << 1 & 2 | (HEAPU8[i39 + (i18 >>> 3) >> 0] | 0) >>> (i18 & 7) & 1;
  switch (i3 | 0) {
  case 3:
   {
    i3 = 20;
    i44 = 112;
    break L1;
   }
  case 0:
   {
    if (!(i5 & 7)) i3 = i5; else {
     i3 = i5;
     do i3 = i3 + 1 | 0; while ((i3 & 7 | 0) != 0);
    }
    i3 = i3 >>> 3;
    i9 = i3 + 4 | 0;
    if (i9 >>> 0 >= i40 >>> 0) {
     i3 = 52;
     i44 = 112;
     break L1;
    }
    i8 = (HEAPU8[i39 + (i3 + 1) >> 0] | 0) << 8 | (HEAPU8[i39 + i3 >> 0] | 0);
    if ((((HEAPU8[i39 + (i3 + 3) >> 0] | 0) << 8 | (HEAPU8[i39 + (i3 + 2) >> 0] | 0)) + i8 | 0) != 65535) {
     i3 = 21;
     i44 = 112;
     break L1;
    }
    i11 = i8 + i20 | 0;
    if (i19 >>> 0 < i11 >>> 0) {
     i4 = i19 << 1 >>> 0 < i11 >>> 0 ? i11 : (i11 * 3 | 0) >>> 1;
     i3 = _realloc(i2, i4) | 0;
     if (!i3) {
      i3 = 83;
      i44 = 112;
      break L1;
     }
     i7 = i4;
     i2 = i3;
    } else i7 = i19;
    i3 = i8 + i9 | 0;
    if (i3 >>> 0 > i40 >>> 0) {
     i3 = 23;
     i1 = i11;
     i44 = 112;
     break L1;
    }
    if (!i8) {
     i1 = i20;
     i3 = i9;
    } else {
     i6 = i2;
     i5 = i20;
     i1 = 0;
     i4 = i9;
     while (1) {
      HEAP8[i6 + i5 >> 0] = HEAP8[i39 + i4 >> 0] | 0;
      i1 = i1 + 1 | 0;
      if ((i1 | 0) == (i8 | 0)) {
       i1 = i11;
       break;
      } else {
       i5 = i5 + 1 | 0;
       i4 = i4 + 1 | 0;
      }
     }
    }
    i4 = i3 << 3;
    i5 = i1;
    i6 = i7;
    i1 = i11;
    break;
   }
  default:
   {
    HEAP32[i38 >> 2] = 0;
    HEAP32[i30 >> 2] = 0;
    HEAP32[i31 >> 2] = 0;
    HEAP32[i37 >> 2] = 0;
    HEAP32[i32 >> 2] = 0;
    HEAP32[i33 >> 2] = 0;
    L6 : do switch (i3 | 0) {
    case 1:
     {
      _generateFixedLitLenTree(i38);
      _generateFixedDistanceTree(i37);
      i4 = i5;
      i44 = 73;
      break;
     }
    case 2:
     {
      i4 = i8 + 17 | 0;
      if (i4 >>> 0 <= i29 >>> 0) {
       i3 = i8 + 4 | 0;
       i17 = i8 + 5 | 0;
       i18 = i8 + 6 | 0;
       i10 = i8 + 7 | 0;
       i10 = (HEAPU8[i39 + (i3 >>> 3) >> 0] | 0) >>> (i3 & 7) << 1 & 2 | (HEAPU8[i39 + (i5 >>> 3) >> 0] | 0) >>> (i5 & 7) & 1 | (HEAPU8[i39 + (i17 >>> 3) >> 0] | 0) >>> (i17 & 7) << 2 & 4 | (HEAPU8[i39 + (i18 >>> 3) >> 0] | 0) >>> (i18 & 7) << 3 & 8 | (HEAPU8[i39 + (i10 >>> 3) >> 0] | 0) >>> (i10 & 7) << 4 & 16;
       i18 = i8 + 8 | 0;
       i17 = i10 + 257 | 0;
       i3 = i8 + 9 | 0;
       i15 = i8 + 10 | 0;
       i16 = i8 + 11 | 0;
       i11 = i8 + 12 | 0;
       i11 = (HEAPU8[i39 + (i3 >>> 3) >> 0] | 0) >>> (i3 & 7) << 1 & 2 | (HEAPU8[i39 + (i18 >>> 3) >> 0] | 0) >>> (i18 & 7) & 1 | (HEAPU8[i39 + (i15 >>> 3) >> 0] | 0) >>> (i15 & 7) << 2 & 4 | (HEAPU8[i39 + (i16 >>> 3) >> 0] | 0) >>> (i16 & 7) << 3 & 8 | (HEAPU8[i39 + (i11 >>> 3) >> 0] | 0) >>> (i11 & 7) << 4 & 16;
       i16 = i8 + 13 | 0;
       i15 = i8 + 14 | 0;
       i18 = i8 + 15 | 0;
       i3 = i8 + 16 | 0;
       i3 = ((HEAPU8[i39 + (i15 >>> 3) >> 0] | 0) >>> (i15 & 7) << 1 & 2 | (HEAPU8[i39 + (i16 >>> 3) >> 0] | 0) >>> (i16 & 7) & 1 | (HEAPU8[i39 + (i18 >>> 3) >> 0] | 0) >>> (i18 & 7) << 2 & 4 | (HEAPU8[i39 + (i3 >>> 3) >> 0] | 0) >>> (i3 & 7) << 3 & 8) + 4 | 0;
       if (((i3 * 3 | 0) + i4 | 0) >>> 0 <= i29 >>> 0) {
        HEAP32[i36 >> 2] = 0;
        HEAP32[i21 >> 2] = 0;
        HEAP32[i22 >> 2] = 0;
        i18 = _malloc(76) | 0;
        L12 : do if (i18) {
         i6 = i4;
         i5 = 0;
         while (1) {
          if (i5 >>> 0 < i3 >>> 0) {
           i15 = i6 + 1 | 0;
           i16 = i6 + 2 | 0;
           i4 = i6 + 3 | 0;
           i6 = (HEAPU8[i39 + (i15 >>> 3) >> 0] | 0) >>> (i15 & 7) << 1 & 2 | (HEAPU8[i39 + (i6 >>> 3) >> 0] | 0) >>> (i6 & 7) & 1 | (HEAPU8[i39 + (i16 >>> 3) >> 0] | 0) >>> (i16 & 7) << 2 & 4;
          } else {
           i4 = i6;
           i6 = 0;
          }
          HEAP32[i18 + (HEAP32[828 + (i5 << 2) >> 2] << 2) >> 2] = i6;
          i5 = i5 + 1 | 0;
          if ((i5 | 0) == 19) break; else i6 = i4;
         }
         i3 = _malloc(76) | 0;
         HEAP32[i22 >> 2] = i3;
         if (i3) {
          i5 = i18;
          i8 = i3 + 76 | 0;
          do {
           HEAP32[i3 >> 2] = HEAP32[i5 >> 2];
           i3 = i3 + 4 | 0;
           i5 = i5 + 4 | 0;
          } while ((i3 | 0) < (i8 | 0));
          HEAP32[i23 >> 2] = 19;
          HEAP32[i24 >> 2] = 7;
          i3 = _HuffmanTree_makeFromLengths2(i36) | 0;
          if (!i3) {
           i6 = _malloc(1152) | 0;
           i7 = _malloc(128) | 0;
           if ((i6 | 0) != 0 & (i7 | 0) != 0) {
            _memset(i6 | 0, 0, 1152) | 0;
            i3 = i7;
            i8 = i3 + 128 | 0;
            do {
             HEAP32[i3 >> 2] = 0;
             i3 = i3 + 4 | 0;
            } while ((i3 | 0) < (i8 | 0));
            i16 = i10 + 258 | 0;
            i13 = i11 + i16 | 0;
            if (i13) {
             i14 = HEAP32[i36 >> 2] | 0;
             i15 = HEAP32[i23 >> 2] | 0;
             i12 = -258 - i10 | 0;
             i3 = 0;
             i9 = 0;
             L23 : do {
              while (1) {
               i8 = 0;
               while (1) {
                if (i4 >>> 0 >= i29 >>> 0) {
                 i5 = i4;
                 i44 = 63;
                 break L23;
                }
                i8 = HEAP32[i14 + (((HEAPU8[i39 + (i4 >>> 3) >> 0] | 0) >>> (i4 & 7) & 1 | i8 << 1) << 2) >> 2] | 0;
                i5 = i4 + 1 | 0;
                if (i8 >>> 0 < i15 >>> 0) {
                 i10 = i4;
                 i4 = i5;
                 break;
                }
                i8 = i8 - i15 | 0;
                if (i8 >>> 0 >= i15 >>> 0) {
                 i44 = 63;
                 break L23;
                } else i4 = i5;
               }
               if (i8 >>> 0 >= 16) break;
               if (i9 >>> 0 < i17 >>> 0) HEAP32[i6 + (i9 << 2) >> 2] = i8; else HEAP32[i7 + (i9 - i17 << 2) >> 2] = i8;
               i9 = i9 + 1 | 0;
               if (i9 >>> 0 >= i13 >>> 0) break L23;
              }
              L38 : do switch (i8 | 0) {
              case -1:
               {
                i5 = i4;
                i44 = 63;
                break L23;
               }
              case 16:
               {
                if (!i9) {
                 i3 = 54;
                 break L12;
                }
                i11 = i10 + 3 | 0;
                if (i11 >>> 0 > i29 >>> 0) {
                 i3 = 50;
                 break L12;
                }
                i8 = i10 + 2 | 0;
                i8 = ((HEAPU8[i39 + (i8 >>> 3) >> 0] | 0) >>> (i8 & 7) << 1 & 2 | (HEAPU8[i39 + (i4 >>> 3) >> 0] | 0) >>> (i4 & 7) & 1) + 3 | 0;
                i5 = HEAP32[(i9 >>> 0 < i16 >>> 0 ? i6 + (i9 + -1 << 2) | 0 : i7 + (i12 + i9 << 2) | 0) >> 2] | 0;
                i10 = 0;
                while (1) {
                 if (i9 >>> 0 >= i13 >>> 0) {
                  i4 = i11;
                  i3 = 13;
                  break L38;
                 }
                 if (i9 >>> 0 < i17 >>> 0) HEAP32[i6 + (i9 << 2) >> 2] = i5; else HEAP32[i7 + (i9 - i17 << 2) >> 2] = i5;
                 i9 = i9 + 1 | 0;
                 i10 = i10 + 1 | 0;
                 if (i10 >>> 0 >= i8 >>> 0) {
                  i4 = i11;
                  break;
                 }
                }
                break;
               }
              case 17:
               {
                i5 = i10 + 4 | 0;
                if (i5 >>> 0 > i29 >>> 0) {
                 i3 = 50;
                 break L12;
                }
                i8 = i10 + 2 | 0;
                i10 = i10 + 3 | 0;
                i10 = ((HEAPU8[i39 + (i8 >>> 3) >> 0] | 0) >>> (i8 & 7) << 1 & 2 | (HEAPU8[i39 + (i4 >>> 3) >> 0] | 0) >>> (i4 & 7) & 1 | (HEAPU8[i39 + (i10 >>> 3) >> 0] | 0) >>> (i10 & 7) << 2 & 4) + 3 | 0;
                i8 = 0;
                while (1) {
                 if (i9 >>> 0 >= i13 >>> 0) {
                  i4 = i5;
                  i3 = 14;
                  break L38;
                 }
                 if (i9 >>> 0 < i17 >>> 0) HEAP32[i6 + (i9 << 2) >> 2] = 0; else HEAP32[i7 + (i9 - i17 << 2) >> 2] = 0;
                 i9 = i9 + 1 | 0;
                 i8 = i8 + 1 | 0;
                 if (i8 >>> 0 >= i10 >>> 0) {
                  i4 = i5;
                  break;
                 }
                }
                break;
               }
              case 18:
               {
                i5 = i10 + 8 | 0;
                if (i5 >>> 0 > i29 >>> 0) {
                 i3 = 50;
                 break L12;
                }
                i47 = i10 + 2 | 0;
                i46 = i10 + 3 | 0;
                i45 = i10 + 4 | 0;
                i8 = i10 + 5 | 0;
                i11 = i10 + 6 | 0;
                i10 = i10 + 7 | 0;
                i10 = ((HEAPU8[i39 + (i47 >>> 3) >> 0] | 0) >>> (i47 & 7) << 1 & 2 | (HEAPU8[i39 + (i4 >>> 3) >> 0] | 0) >>> (i4 & 7) & 1 | (HEAPU8[i39 + (i46 >>> 3) >> 0] | 0) >>> (i46 & 7) << 2 & 4 | (HEAPU8[i39 + (i45 >>> 3) >> 0] | 0) >>> (i45 & 7) << 3 & 8 | (HEAPU8[i39 + (i8 >>> 3) >> 0] | 0) >>> (i8 & 7) << 4 & 16 | (HEAPU8[i39 + (i11 >>> 3) >> 0] | 0) >>> (i11 & 7) << 5 & 32 | (HEAPU8[i39 + (i10 >>> 3) >> 0] | 0) >>> (i10 & 7) << 6 & 64) + 11 | 0;
                if (!i10) i4 = i5; else {
                 i8 = 0;
                 while (1) {
                  if (i9 >>> 0 >= i13 >>> 0) {
                   i4 = i5;
                   i3 = 15;
                   break L38;
                  }
                  if (i9 >>> 0 < i17 >>> 0) HEAP32[i6 + (i9 << 2) >> 2] = 0; else HEAP32[i7 + (i9 - i17 << 2) >> 2] = 0;
                  i9 = i9 + 1 | 0;
                  i8 = i8 + 1 | 0;
                  if (i8 >>> 0 >= i10 >>> 0) {
                   i4 = i5;
                   break;
                  }
                 }
                }
                break;
               }
              default:
               {
                i3 = 16;
                break L12;
               }
              } while (0);
             } while (i9 >>> 0 < i13 >>> 0);
             if ((i44 | 0) == 63) {
              i44 = 0;
              i4 = i5;
              i3 = i5 >>> 0 > i29 >>> 0 ? 10 : 11;
              break;
             }
             if (!i3) if (HEAP32[i6 + 1024 >> 2] | 0) {
              i3 = _malloc(1152) | 0;
              HEAP32[i31 >> 2] = i3;
              if (i3) {
               _memcpy(i3 | 0, i6 | 0, 1152) | 0;
               HEAP32[i34 >> 2] = 288;
               HEAP32[i25 >> 2] = 15;
               i3 = _HuffmanTree_makeFromLengths2(i38) | 0;
               if (!i3) {
                i3 = _malloc(128) | 0;
                HEAP32[i33 >> 2] = i3;
                if (!i3) i3 = 83; else {
                 i5 = i7;
                 i8 = i3 + 128 | 0;
                 do {
                  HEAP32[i3 >> 2] = HEAP32[i5 >> 2];
                  i3 = i3 + 4 | 0;
                  i5 = i5 + 4 | 0;
                 } while ((i3 | 0) < (i8 | 0));
                 HEAP32[i35 >> 2] = 32;
                 HEAP32[i26 >> 2] = 15;
                 i3 = _HuffmanTree_makeFromLengths2(i37) | 0;
                }
               }
              } else i3 = 83;
             } else i3 = 64;
            } else i3 = 64;
           } else i3 = 83;
          } else {
           i7 = 0;
           i6 = 0;
          }
         } else {
          i7 = 0;
          i6 = 0;
          i3 = 83;
         }
        } else {
         i7 = 0;
         i6 = 0;
         i3 = 83;
        } while (0);
        _free(i18);
        _free(i6);
        _free(i7);
        _free(HEAP32[i36 >> 2] | 0);
        _free(HEAP32[i21 >> 2] | 0);
        _free(HEAP32[i22 >> 2] | 0);
        if (!i3) {
         i44 = 73;
         break L6;
        }
       } else {
        i3 = 50;
        i44 = 70;
       }
      } else {
       i3 = 49;
       i4 = i5;
       i44 = 70;
      }
      if ((i44 | 0) == 70) i44 = 0;
      i8 = HEAP32[i38 >> 2] | 0;
      i11 = HEAP32[i37 >> 2] | 0;
      i6 = i19;
      i5 = i20;
      break;
     }
    default:
     {
      i4 = i5;
      i44 = 73;
     }
    } while (0);
    L80 : do if ((i44 | 0) == 73) {
     i44 = 0;
     i15 = HEAP32[i38 >> 2] | 0;
     i18 = HEAP32[i34 >> 2] | 0;
     i11 = HEAP32[i37 >> 2] | 0;
     i17 = HEAP32[i35 >> 2] | 0;
     i10 = i20;
     i6 = i19;
     L82 : while (1) {
      i16 = i6;
      while (1) {
       i6 = 0;
       while (1) {
        if (i4 >>> 0 >= i29 >>> 0) {
         i5 = i10;
         i6 = i16;
         i3 = i4;
         break L82;
        }
        i5 = HEAP32[i15 + (((HEAPU8[i39 + (i4 >>> 3) >> 0] | 0) >>> (i4 & 7) & 1 | i6 << 1) << 2) >> 2] | 0;
        i4 = i4 + 1 | 0;
        if (i5 >>> 0 < i18 >>> 0) break;
        i6 = i5 - i18 | 0;
        if (i6 >>> 0 >= i18 >>> 0) {
         i5 = i10;
         i6 = i16;
         i3 = i4;
         break L82;
        }
       }
       if (i5 >>> 0 < 256) {
        i6 = i16;
        i44 = 80;
        break;
       }
       i6 = i5 + -257 | 0;
       if (i6 >>> 0 >= 29) {
        i9 = i10;
        i6 = i16;
        i44 = 108;
        break L82;
       }
       i8 = HEAP32[904 + (i6 << 2) >> 2] | 0;
       i7 = i8 + i4 | 0;
       if (i7 >>> 0 > i29 >>> 0) {
        i8 = i15;
        i6 = i16;
        i5 = i10;
        i3 = 51;
        break L80;
       }
       i3 = HEAP32[1020 + (i6 << 2) >> 2] | 0;
       if ((i5 + -265 | 0) >>> 0 > 19) i6 = 0; else {
        i9 = 0;
        i6 = 0;
        while (1) {
         i6 = (((HEAPU8[i39 + (i4 >>> 3) >> 0] | 0) >>> (i4 & 7) & 1) << i9) + i6 | 0;
         i9 = i9 + 1 | 0;
         if ((i9 | 0) == (i8 | 0)) {
          i4 = i7;
          break;
         } else i4 = i4 + 1 | 0;
        }
       }
       i8 = i6 + i3 | 0;
       i6 = 0;
       while (1) {
        if (i4 >>> 0 >= i29 >>> 0) {
         i6 = i16;
         i7 = i4;
         i44 = 94;
         break L82;
        }
        i6 = HEAP32[i11 + (((HEAPU8[i39 + (i4 >>> 3) >> 0] | 0) >>> (i4 & 7) & 1 | i6 << 1) << 2) >> 2] | 0;
        i4 = i4 + 1 | 0;
        if (i6 >>> 0 < i17 >>> 0) break;
        i6 = i6 - i17 | 0;
        if (i6 >>> 0 >= i17 >>> 0) {
         i6 = i16;
         i7 = i4;
         i44 = 94;
         break L82;
        }
       }
       if (i6 >>> 0 > 29) {
        i6 = i16;
        i7 = i4;
        i44 = 94;
        break L82;
       }
       i7 = HEAP32[1136 + (i6 << 2) >> 2] | 0;
       i5 = i7 + i4 | 0;
       if (i5 >>> 0 > i29 >>> 0) {
        i8 = i15;
        i6 = i16;
        i5 = i10;
        i3 = 51;
        break L80;
       }
       i3 = HEAP32[1256 + (i6 << 2) >> 2] | 0;
       if (i6 >>> 0 < 4) i6 = 0; else {
        i9 = 0;
        i6 = 0;
        while (1) {
         i6 = (((HEAPU8[i39 + (i4 >>> 3) >> 0] | 0) >>> (i4 & 7) & 1) << i9) + i6 | 0;
         i9 = i9 + 1 | 0;
         if ((i9 | 0) == (i7 | 0)) {
          i4 = i5;
          break;
         } else i4 = i4 + 1 | 0;
        }
       }
       i5 = i6 + i3 | 0;
       if (i10 >>> 0 < i5 >>> 0) {
        i8 = i15;
        i6 = i16;
        i5 = i10;
        i3 = 52;
        break L80;
       }
       i7 = i8 + i10 | 0;
       if (i16 >>> 0 < i7 >>> 0) {
        i6 = i16 << 1 >>> 0 < i7 >>> 0 ? i7 : (i7 * 3 | 0) >>> 1;
        i3 = _realloc(i2, i6) | 0;
        if (!i3) {
         i8 = i15;
         i6 = i16;
         i5 = i10;
         i3 = 83;
         break L80;
        }
        i2 = i3;
       } else i6 = i16;
       if (i5 >>> 0 >= i8 >>> 0) {
        i44 = 107;
        break;
       }
       if (!i8) {
        i16 = i6;
        i1 = i7;
       } else {
        i44 = 105;
        break;
       }
      }
      if ((i44 | 0) == 80) {
       i44 = 0;
       i9 = i10 + 1 | 0;
       if (i6 >>> 0 < i9 >>> 0) {
        i3 = i6 << 1 >>> 0 < i9 >>> 0 ? i9 : (i9 * 3 | 0) >>> 1;
        i7 = _realloc(i2, i3) | 0;
        if (!i7) {
         i8 = i15;
         i5 = i10;
         i3 = 83;
         break L80;
        }
        i1 = i7;
        i6 = i3;
        i2 = i7;
       } else i1 = i2;
       HEAP8[i1 + i10 >> 0] = i5;
       i10 = i9;
       i1 = i9;
       continue;
      } else if ((i44 | 0) == 105) {
       i44 = 0;
       i1 = i2;
       i9 = i10;
       i3 = i10 - i5 | 0;
       i5 = 0;
       while (1) {
        HEAP8[i1 + i9 >> 0] = HEAP8[i1 + i3 >> 0] | 0;
        i5 = i5 + 1 | 0;
        if ((i5 | 0) == (i8 | 0)) {
         i10 = i7;
         i1 = i7;
         continue L82;
        } else {
         i9 = i9 + 1 | 0;
         i3 = i3 + 1 | 0;
        }
       }
      } else if ((i44 | 0) == 107) {
       i44 = 0;
       i1 = i2;
       _memcpy(i1 + i10 | 0, i1 + (i10 - i5) | 0, i8 | 0) | 0;
       i10 = i7;
       i1 = i7;
       continue;
      }
     }
     if ((i44 | 0) == 94) {
      i44 = 0;
      if ((i5 | 0) != -1) {
       i8 = i15;
       i4 = i7;
       i5 = i10;
       i3 = 18;
       break;
      }
      i8 = i15;
      i4 = i7;
      i5 = i10;
      i3 = i7 >>> 0 > i29 >>> 0 ? 10 : 11;
      break;
     } else if ((i44 | 0) == 108) {
      i44 = 0;
      if ((i5 | 0) == 256) {
       i8 = i15;
       i5 = i9;
       i3 = 0;
       break;
      } else {
       i5 = i9;
       i3 = i4;
      }
     }
     i8 = i15;
     i4 = i3;
     i3 = i3 >>> 0 > i29 >>> 0 ? 10 : 11;
    } while (0);
    _free(i8);
    _free(HEAP32[i30 >> 2] | 0);
    _free(HEAP32[i31 >> 2] | 0);
    _free(i11);
    _free(HEAP32[i32 >> 2] | 0);
    _free(HEAP32[i33 >> 2] | 0);
    if (i3) {
     i44 = 112;
     break L1;
    }
   }
  }
  if (!(i27 & 1 << i28)) {
   i8 = i4;
   i20 = i5;
   i19 = i6;
  } else {
   i3 = 0;
   i44 = 112;
   break;
  }
 }
 if ((i44 | 0) == 112) {
  HEAP32[i42 >> 2] = i2;
  HEAP32[i43 >> 2] = i1;
  STACKTOP = i41;
  return i3 | 0;
 }
 return 0;
}

function _draw() {
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, i42 = 0, i43 = 0, i44 = 0, i45 = 0, i46 = 0, i47 = 0, i48 = 0, i49 = 0, i50 = 0, i51 = 0, i52 = 0, f53 = f0, f54 = f0, f55 = f0, f56 = f0, f57 = f0, f58 = f0, f59 = f0, f60 = f0, f61 = f0, f62 = f0, f63 = f0, f64 = f0, f65 = f0, f66 = f0, f67 = f0, f68 = f0, d69 = 0.0, d70 = 0.0, d71 = 0.0, d72 = 0.0, d73 = 0.0, d74 = 0.0, d75 = 0.0, d76 = 0.0, d77 = 0.0, d78 = 0.0, d79 = 0.0, d80 = 0.0, d81 = 0.0, d82 = 0.0, d83 = 0.0, d84 = 0.0, d85 = 0.0, d86 = 0.0, d87 = 0.0, d88 = 0.0, d89 = 0.0, d90 = 0.0, d91 = 0.0, d92 = 0.0, d93 = 0.0, d94 = 0.0, d95 = 0.0, d96 = 0.0, d97 = 0.0, d98 = 0.0, d99 = 0.0, d100 = 0.0, d101 = 0.0, d102 = 0.0, d103 = 0.0, d104 = 0.0, d105 = 0.0, d106 = 0.0, d107 = 0.0, d108 = 0.0, d109 = 0.0;
 i52 = STACKTOP;
 STACKTOP = STACKTOP + 368 | 0;
 i51 = i52 + 152 | 0;
 i50 = i52 + 24 | 0;
 i49 = i52 + 304 | 0;
 i46 = i52 + 292 | 0;
 i47 = i52 + 280 | 0;
 _par_zcam_dmatrices(i52, i50, i51);
 _par_draw_clear();
 _par_shader_bind(HEAP32[674] | 0);
 i4 = _par_mesh_coord(HEAP32[663] | 0) | 0;
 _par_varray_enable(i4, HEAP32[675] | 0, 2, 5126, 0, 0);
 i4 = _par_mesh_uv(HEAP32[663] | 0) | 0;
 _par_varray_enable(i4, HEAP32[676] | 0, 2, 5126, 0, 0);
 d82 = +Math_fround(HEAPF32[662]) * .25;
 d101 = +HEAPF64[i51 >> 3];
 i4 = i51 + 8 | 0;
 d77 = +HEAPF64[i4 >> 3];
 i15 = i51 + 16 | 0;
 d85 = +HEAPF64[i15 >> 3];
 i18 = i51 + 24 | 0;
 d78 = +HEAPF64[i18 >> 3];
 i19 = i51 + 32 | 0;
 d96 = +HEAPF64[i19 >> 3];
 i20 = i51 + 40 | 0;
 d95 = +HEAPF64[i20 >> 3];
 i21 = i51 + 48 | 0;
 d94 = +HEAPF64[i21 >> 3];
 i22 = i51 + 56 | 0;
 d93 = +HEAPF64[i22 >> 3];
 i23 = i51 + 64 | 0;
 d69 = +HEAPF64[i23 >> 3];
 i31 = i51 + 72 | 0;
 d81 = +HEAPF64[i31 >> 3];
 i40 = i51 + 80 | 0;
 d71 = +HEAPF64[i40 >> 3];
 i41 = i51 + 88 | 0;
 d86 = +HEAPF64[i41 >> 3];
 i42 = i51 + 96 | 0;
 d76 = +HEAPF64[i42 >> 3];
 i43 = i51 + 104 | 0;
 d74 = +HEAPF64[i43 >> 3];
 i44 = i51 + 112 | 0;
 d72 = +HEAPF64[i44 >> 3];
 i45 = i51 + 120 | 0;
 d70 = +HEAPF64[i45 >> 3];
 d73 = d96 * 0.0;
 d79 = d69 * 0.0;
 d92 = d76 * 0.0;
 d100 = d101 * d82 + d73 + d79 + d92;
 d83 = d95 * 0.0;
 d87 = d81 * 0.0;
 d91 = d74 * 0.0;
 d99 = d82 * d77 + d83 + d87 + d91;
 d75 = d94 * 0.0;
 d80 = d71 * 0.0;
 d90 = d72 * 0.0;
 d98 = d82 * d85 + d75 + d80 + d90;
 d84 = d93 * 0.0;
 d88 = d86 * 0.0;
 d89 = d70 * 0.0;
 d97 = d82 * d78 + d84 + d88 + d89;
 d101 = d101 * 0.0;
 d96 = d101 + d82 * d96 + d79 + d92;
 d77 = d77 * 0.0;
 d95 = d77 + d82 * d95 + d87 + d91;
 d85 = d85 * 0.0;
 d94 = d85 + d82 * d94 + d80 + d90;
 d78 = d78 * 0.0;
 d93 = d78 + d82 * d93 + d88 + d89;
 d73 = d101 + d73;
 d92 = d73 + d82 * d69 + d92;
 d83 = d77 + d83;
 d91 = d83 + d82 * d81 + d91;
 d75 = d85 + d75;
 d90 = d75 + d82 * d71 + d90;
 d84 = d78 + d84;
 d89 = d84 + d82 * d86 + d89;
 d76 = d73 + d79 + d76;
 d74 = d83 + d87 + d74;
 d72 = d75 + d80 + d72;
 d70 = d84 + d88 + d70;
 d88 = +HEAPF64[i50 >> 3];
 i1 = i50 + 8 | 0;
 d84 = +HEAPF64[i1 >> 3];
 i2 = i50 + 16 | 0;
 d80 = +HEAPF64[i2 >> 3];
 i3 = i50 + 24 | 0;
 d75 = +HEAPF64[i3 >> 3];
 i5 = i50 + 32 | 0;
 d87 = +HEAPF64[i5 >> 3];
 i6 = i50 + 40 | 0;
 d83 = +HEAPF64[i6 >> 3];
 i7 = i50 + 48 | 0;
 d79 = +HEAPF64[i7 >> 3];
 i8 = i50 + 56 | 0;
 d73 = +HEAPF64[i8 >> 3];
 i9 = i50 + 64 | 0;
 d86 = +HEAPF64[i9 >> 3];
 i10 = i50 + 72 | 0;
 d82 = +HEAPF64[i10 >> 3];
 i11 = i50 + 80 | 0;
 d78 = +HEAPF64[i11 >> 3];
 i12 = i50 + 88 | 0;
 d71 = +HEAPF64[i12 >> 3];
 i13 = i50 + 96 | 0;
 d85 = +HEAPF64[i13 >> 3];
 i14 = i50 + 104 | 0;
 d81 = +HEAPF64[i14 >> 3];
 i16 = i50 + 112 | 0;
 d77 = +HEAPF64[i16 >> 3];
 i17 = i50 + 120 | 0;
 d69 = +HEAPF64[i17 >> 3];
 f68 = Math_fround(d100 * d88 + d99 * d87 + d98 * d86 + d97 * d85);
 f67 = Math_fround(d100 * d84 + d99 * d83 + d98 * d82 + d97 * d81);
 f66 = Math_fround(d100 * d80 + d99 * d79 + d98 * d78 + d97 * d77);
 f65 = Math_fround(d100 * d75 + d99 * d73 + d98 * d71 + d97 * d69);
 f64 = Math_fround(d96 * d88 + d95 * d87 + d94 * d86 + d93 * d85);
 f63 = Math_fround(d96 * d84 + d95 * d83 + d94 * d82 + d93 * d81);
 f62 = Math_fround(d96 * d80 + d95 * d79 + d94 * d78 + d93 * d77);
 f61 = Math_fround(d96 * d75 + d95 * d73 + d94 * d71 + d93 * d69);
 f60 = Math_fround(d92 * d88 + d91 * d87 + d90 * d86 + d89 * d85);
 f59 = Math_fround(d92 * d84 + d91 * d83 + d90 * d82 + d89 * d81);
 f58 = Math_fround(d92 * d80 + d91 * d79 + d90 * d78 + d89 * d77);
 f57 = Math_fround(d92 * d75 + d91 * d73 + d90 * d71 + d89 * d69);
 f56 = Math_fround(d76 * d88 + d74 * d87 + d72 * d86 + d70 * d85);
 f55 = Math_fround(d76 * d84 + d74 * d83 + d72 * d82 + d70 * d81);
 f54 = Math_fround(d76 * d80 + d74 * d79 + d72 * d78 + d70 * d77);
 f53 = Math_fround(d76 * d75 + d74 * d73 + d72 * d71 + d70 * d69);
 HEAPF32[i49 >> 2] = f68;
 i24 = i49 + 4 | 0;
 HEAPF32[i24 >> 2] = f67;
 i25 = i49 + 8 | 0;
 HEAPF32[i25 >> 2] = f66;
 i26 = i49 + 12 | 0;
 HEAPF32[i26 >> 2] = f65;
 i27 = i49 + 16 | 0;
 HEAPF32[i27 >> 2] = f64;
 i28 = i49 + 20 | 0;
 HEAPF32[i28 >> 2] = f63;
 i29 = i49 + 24 | 0;
 HEAPF32[i29 >> 2] = f62;
 i30 = i49 + 28 | 0;
 HEAPF32[i30 >> 2] = f61;
 i32 = i49 + 32 | 0;
 HEAPF32[i32 >> 2] = f60;
 i33 = i49 + 36 | 0;
 HEAPF32[i33 >> 2] = f59;
 i34 = i49 + 40 | 0;
 HEAPF32[i34 >> 2] = f58;
 i35 = i49 + 44 | 0;
 HEAPF32[i35 >> 2] = f57;
 i36 = i49 + 48 | 0;
 HEAPF32[i36 >> 2] = f56;
 i37 = i49 + 52 | 0;
 HEAPF32[i37 >> 2] = f55;
 i38 = i49 + 56 | 0;
 HEAPF32[i38 >> 2] = f54;
 i39 = i49 + 60 | 0;
 HEAPF32[i39 >> 2] = f53;
 _par_texture_bind(HEAP32[661] | 0, 0);
 _par_uniform_matrix4f(HEAP32[677] | 0, i49);
 _par_draw_one_quad();
 i48 = 0;
 do {
  d81 = +Math_fround(HEAPF32[662]);
  d81 = d81 / +_ldexp(1.0, HEAP32[2624 + (i48 << 2) >> 2] | 0);
  d87 = +HEAPF64[45];
  d95 = +HEAPF64[46];
  d86 = +HEAPF64[47];
  d93 = d81 + 0.0;
  d102 = d87 * 0.0;
  d73 = d93 + d102;
  d81 = d81 * 0.0 + 0.0;
  d109 = d95 * 0.0;
  d69 = d81 + d109;
  d101 = d86 * 0.0;
  d77 = d81 + d101;
  d102 = d81 + d102;
  d109 = d93 + d109;
  d101 = d93 + d101;
  d87 = d87 + 0.0;
  d95 = d95 + 0.0;
  d86 = d86 + 0.0;
  d93 = +HEAPF64[i51 >> 3];
  d99 = +HEAPF64[i4 >> 3];
  d84 = +HEAPF64[i15 >> 3];
  d83 = +HEAPF64[i18 >> 3];
  d89 = +HEAPF64[i19 >> 3];
  d92 = +HEAPF64[i20 >> 3];
  d97 = +HEAPF64[i21 >> 3];
  d90 = +HEAPF64[i22 >> 3];
  d85 = +HEAPF64[i23 >> 3];
  d88 = +HEAPF64[i31 >> 3];
  d91 = +HEAPF64[i40 >> 3];
  d82 = +HEAPF64[i41 >> 3];
  d94 = +HEAPF64[i42 >> 3];
  d96 = +HEAPF64[i43 >> 3];
  d98 = +HEAPF64[i44 >> 3];
  d100 = +HEAPF64[i45 >> 3];
  d107 = d69 * d89;
  d74 = d77 * d85;
  d78 = d81 * d94;
  d70 = d73 * d93 + d107 + d74 + d78;
  d105 = d69 * d92;
  d75 = d77 * d88;
  d79 = d81 * d96;
  d71 = d73 * d99 + d105 + d75 + d79;
  d103 = d69 * d97;
  d76 = d77 * d91;
  d80 = d81 * d98;
  d72 = d73 * d84 + d103 + d76 + d80;
  d69 = d69 * d90;
  d77 = d77 * d82;
  d81 = d81 * d100;
  d73 = d73 * d83 + d69 + d77 + d81;
  d108 = d102 * d93;
  d74 = d108 + d109 * d89 + d74 + d78;
  d106 = d102 * d99;
  d75 = d106 + d109 * d92 + d75 + d79;
  d104 = d102 * d84;
  d76 = d104 + d109 * d97 + d76 + d80;
  d102 = d102 * d83;
  d77 = d102 + d109 * d90 + d77 + d81;
  d78 = d108 + d107 + d101 * d85 + d78;
  d79 = d106 + d105 + d101 * d88 + d79;
  d80 = d104 + d103 + d101 * d91 + d80;
  d81 = d102 + d69 + d101 * d82 + d81;
  d94 = d87 * d93 + d95 * d89 + d86 * d85 + d94;
  d96 = d87 * d99 + d95 * d92 + d86 * d88 + d96;
  d98 = d87 * d84 + d95 * d97 + d86 * d91 + d98;
  d100 = d87 * d83 + d95 * d90 + d86 * d82 + d100;
  d82 = +HEAPF64[i50 >> 3];
  d86 = +HEAPF64[i1 >> 3];
  d90 = +HEAPF64[i2 >> 3];
  d95 = +HEAPF64[i3 >> 3];
  d83 = +HEAPF64[i5 >> 3];
  d87 = +HEAPF64[i6 >> 3];
  d91 = +HEAPF64[i7 >> 3];
  d97 = +HEAPF64[i8 >> 3];
  d84 = +HEAPF64[i9 >> 3];
  d88 = +HEAPF64[i10 >> 3];
  d92 = +HEAPF64[i11 >> 3];
  d99 = +HEAPF64[i12 >> 3];
  d85 = +HEAPF64[i13 >> 3];
  d89 = +HEAPF64[i14 >> 3];
  d93 = +HEAPF64[i16 >> 3];
  d101 = +HEAPF64[i17 >> 3];
  f53 = Math_fround(d70 * d82 + d71 * d83 + d72 * d84 + d73 * d85);
  f54 = Math_fround(d70 * d86 + d71 * d87 + d72 * d88 + d73 * d89);
  f55 = Math_fround(d70 * d90 + d71 * d91 + d72 * d92 + d73 * d93);
  f56 = Math_fround(d70 * d95 + d71 * d97 + d72 * d99 + d73 * d101);
  f57 = Math_fround(d74 * d82 + d75 * d83 + d76 * d84 + d77 * d85);
  f58 = Math_fround(d74 * d86 + d75 * d87 + d76 * d88 + d77 * d89);
  f59 = Math_fround(d74 * d90 + d75 * d91 + d76 * d92 + d77 * d93);
  f60 = Math_fround(d74 * d95 + d75 * d97 + d76 * d99 + d77 * d101);
  f61 = Math_fround(d78 * d82 + d79 * d83 + d80 * d84 + d81 * d85);
  f62 = Math_fround(d78 * d86 + d79 * d87 + d80 * d88 + d81 * d89);
  f63 = Math_fround(d78 * d90 + d79 * d91 + d80 * d92 + d81 * d93);
  f64 = Math_fround(d78 * d95 + d79 * d97 + d80 * d99 + d81 * d101);
  f65 = Math_fround(d94 * d82 + d96 * d83 + d98 * d84 + d100 * d85);
  f66 = Math_fround(d94 * d86 + d96 * d87 + d98 * d88 + d100 * d89);
  f67 = Math_fround(d94 * d90 + d96 * d91 + d98 * d92 + d100 * d93);
  f68 = Math_fround(d94 * d95 + d96 * d97 + d98 * d99 + d100 * d101);
  HEAPF32[i49 >> 2] = f53;
  HEAPF32[i24 >> 2] = f54;
  HEAPF32[i25 >> 2] = f55;
  HEAPF32[i26 >> 2] = f56;
  HEAPF32[i27 >> 2] = f57;
  HEAPF32[i28 >> 2] = f58;
  HEAPF32[i29 >> 2] = f59;
  HEAPF32[i30 >> 2] = f60;
  HEAPF32[i32 >> 2] = f61;
  HEAPF32[i33 >> 2] = f62;
  HEAPF32[i34 >> 2] = f63;
  HEAPF32[i35 >> 2] = f64;
  HEAPF32[i36 >> 2] = f65;
  HEAPF32[i37 >> 2] = f66;
  HEAPF32[i38 >> 2] = f67;
  HEAPF32[i39 >> 2] = f68;
  _par_texture_bind(HEAP32[2656 + (i48 << 2) >> 2] | 0, 0);
  _par_uniform_matrix4f(HEAP32[677] | 0, i49);
  _par_draw_one_quad();
  i48 = i48 + 1 | 0;
 } while ((i48 | 0) != 4);
 _par_zcam_highprec(i49, i47, i46);
 if (!(HEAP32[660] | 0)) {
  HEAPF32[i47 >> 2] = Math_fround(0.0);
  HEAPF32[i47 + 4 >> 2] = Math_fround(0.0);
  HEAPF32[i47 + 8 >> 2] = Math_fround(0.0);
 }
 _par_shader_bind(HEAP32[678] | 0);
 _par_uniform_matrix4f(HEAP32[677] | 0, i49);
 _par_uniform_point(HEAP32[679] | 0, i46);
 _par_uniform_point(HEAP32[680] | 0, i47);
 _par_varray_enable(HEAP32[670] | 0, HEAP32[675] | 0, 2, 5126, 0, 0);
 _par_draw_lines(2);
 _par_shader_bind(HEAP32[674] | 0);
 i48 = _par_mesh_coord(HEAP32[669] | 0) | 0;
 _par_varray_enable(i48, HEAP32[675] | 0, 2, 5126, 0, 0);
 d89 = +Math_fround(HEAPF32[662]) * 2.9802322387695312e-08;
 d95 = +HEAPF64[45];
 d103 = +HEAPF64[46];
 d94 = +HEAPF64[47];
 d101 = d89 + 0.0;
 d76 = d95 * 0.0;
 d81 = d76 + d101;
 d89 = d89 * 0.0 + 0.0;
 d69 = d103 * 0.0;
 d77 = d69 + d89;
 d109 = d94 * 0.0;
 d85 = d89 + d109;
 d76 = d76 + d89;
 d69 = d101 + d69;
 d109 = d101 + d109;
 d95 = d95 + 0.0;
 d103 = d103 + 0.0;
 d94 = d94 + 0.0;
 d101 = +HEAPF64[i51 >> 3];
 d107 = +HEAPF64[i4 >> 3];
 d92 = +HEAPF64[i15 >> 3];
 d91 = +HEAPF64[i18 >> 3];
 d97 = +HEAPF64[i19 >> 3];
 d100 = +HEAPF64[i20 >> 3];
 d105 = +HEAPF64[i21 >> 3];
 d98 = +HEAPF64[i22 >> 3];
 d93 = +HEAPF64[i23 >> 3];
 d96 = +HEAPF64[i31 >> 3];
 d99 = +HEAPF64[i40 >> 3];
 d90 = +HEAPF64[i41 >> 3];
 d102 = +HEAPF64[i42 >> 3];
 d104 = +HEAPF64[i43 >> 3];
 d106 = +HEAPF64[i44 >> 3];
 d108 = +HEAPF64[i45 >> 3];
 d71 = d77 * d97;
 d82 = d85 * d93;
 d86 = d89 * d102;
 d78 = d101 * d81 + d71 + d82 + d86;
 d73 = d77 * d100;
 d83 = d85 * d96;
 d87 = d89 * d104;
 d79 = d81 * d107 + d73 + d83 + d87;
 d75 = d77 * d105;
 d84 = d85 * d99;
 d88 = d89 * d106;
 d80 = d81 * d92 + d75 + d84 + d88;
 d77 = d77 * d98;
 d85 = d85 * d90;
 d89 = d89 * d108;
 d81 = d81 * d91 + d77 + d85 + d89;
 d70 = d101 * d76;
 d82 = d70 + d69 * d97 + d82 + d86;
 d72 = d107 * d76;
 d83 = d72 + d69 * d100 + d83 + d87;
 d74 = d76 * d92;
 d84 = d74 + d69 * d105 + d84 + d88;
 d76 = d76 * d91;
 d85 = d76 + d69 * d98 + d85 + d89;
 d86 = d70 + d71 + d109 * d93 + d86;
 d87 = d72 + d73 + d109 * d96 + d87;
 d88 = d74 + d75 + d109 * d99 + d88;
 d89 = d76 + d77 + d109 * d90 + d89;
 d102 = d95 * d101 + d103 * d97 + d94 * d93 + d102;
 d104 = d95 * d107 + d103 * d100 + d94 * d96 + d104;
 d106 = d95 * d92 + d103 * d105 + d94 * d99 + d106;
 d108 = d95 * d91 + d103 * d98 + d94 * d90 + d108;
 d90 = +HEAPF64[i50 >> 3];
 d94 = +HEAPF64[i1 >> 3];
 d98 = +HEAPF64[i2 >> 3];
 d103 = +HEAPF64[i3 >> 3];
 d91 = +HEAPF64[i5 >> 3];
 d95 = +HEAPF64[i6 >> 3];
 d99 = +HEAPF64[i7 >> 3];
 d105 = +HEAPF64[i8 >> 3];
 d92 = +HEAPF64[i9 >> 3];
 d96 = +HEAPF64[i10 >> 3];
 d100 = +HEAPF64[i11 >> 3];
 d107 = +HEAPF64[i12 >> 3];
 d93 = +HEAPF64[i13 >> 3];
 d97 = +HEAPF64[i14 >> 3];
 d101 = +HEAPF64[i16 >> 3];
 d109 = +HEAPF64[i17 >> 3];
 f53 = Math_fround(d78 * d90 + d79 * d91 + d80 * d92 + d81 * d93);
 f54 = Math_fround(d78 * d94 + d79 * d95 + d80 * d96 + d81 * d97);
 f55 = Math_fround(d78 * d98 + d79 * d99 + d80 * d100 + d81 * d101);
 f56 = Math_fround(d78 * d103 + d79 * d105 + d80 * d107 + d81 * d109);
 f57 = Math_fround(d82 * d90 + d83 * d91 + d84 * d92 + d85 * d93);
 f58 = Math_fround(d82 * d94 + d83 * d95 + d84 * d96 + d85 * d97);
 f59 = Math_fround(d82 * d98 + d83 * d99 + d84 * d100 + d85 * d101);
 f60 = Math_fround(d82 * d103 + d83 * d105 + d84 * d107 + d85 * d109);
 f61 = Math_fround(d86 * d90 + d87 * d91 + d88 * d92 + d89 * d93);
 f62 = Math_fround(d86 * d94 + d87 * d95 + d88 * d96 + d89 * d97);
 f63 = Math_fround(d86 * d98 + d87 * d99 + d88 * d100 + d89 * d101);
 f64 = Math_fround(d86 * d103 + d87 * d105 + d88 * d107 + d89 * d109);
 f65 = Math_fround(d102 * d90 + d104 * d91 + d106 * d92 + d108 * d93);
 f66 = Math_fround(d102 * d94 + d104 * d95 + d106 * d96 + d108 * d97);
 f67 = Math_fround(d102 * d98 + d104 * d99 + d106 * d100 + d108 * d101);
 f68 = Math_fround(d102 * d103 + d104 * d105 + d106 * d107 + d108 * d109);
 HEAPF32[i49 >> 2] = f53;
 HEAPF32[i24 >> 2] = f54;
 HEAPF32[i25 >> 2] = f55;
 HEAPF32[i26 >> 2] = f56;
 HEAPF32[i27 >> 2] = f57;
 HEAPF32[i28 >> 2] = f58;
 HEAPF32[i29 >> 2] = f59;
 HEAPF32[i30 >> 2] = f60;
 HEAPF32[i32 >> 2] = f61;
 HEAPF32[i33 >> 2] = f62;
 HEAPF32[i34 >> 2] = f63;
 HEAPF32[i35 >> 2] = f64;
 HEAPF32[i36 >> 2] = f65;
 HEAPF32[i37 >> 2] = f66;
 HEAPF32[i38 >> 2] = f67;
 HEAPF32[i39 >> 2] = f68;
 _par_texture_bind(HEAP32[668] | 0, 0);
 _par_uniform_matrix4f(HEAP32[677] | 0, i49);
 _par_draw_one_quad();
 STACKTOP = i52;
 return 1;
}

function _par_shader_load_from_buffer(i3) {
 i3 = i3 | 0;
 var i1 = 0, i2 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, i42 = 0, i43 = 0, i44 = 0, i45 = 0, i46 = 0, i47 = 0;
 i47 = STACKTOP;
 STACKTOP = STACKTOP + 48 | 0;
 i43 = i47 + 16 | 0;
 i42 = i47 + 8 | 0;
 i37 = i47;
 i34 = i47 + 40 | 0;
 i35 = i47 + 36 | 0;
 i36 = i47 + 32 | 0;
 i40 = i47 + 28 | 0;
 i41 = i47 + 24 | 0;
 i44 = _sdsnew(4145) | 0;
 i45 = _sdsnew(4156) | 0;
 i46 = _sdsnew(4166) | 0;
 if (!(HEAP32[198] | 0)) {
  i39 = _calloc(1, 28) | 0;
  HEAP32[198] = i39;
  i39 = _calloc(1, 28) | 0;
  HEAP32[199] = i39;
  i39 = _calloc(1, 28) | 0;
  HEAP32[200] = i39;
  i39 = _calloc(1, 28) | 0;
  HEAP32[201] = i39;
 }
 i39 = _par_buffer_length(i3) | 0;
 i39 = _sdssplitlen(_par_buffer_lock(i3, 0) | 0, i39, 4174, 1, i34) | 0;
 _par_buffer_unlock(i3);
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
    i11 = _sdstrim(i11, 4176) | 0;
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
    i21 = _sdscatprintf(i21, 4179, i37) | 0;
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
   i19 = _sdscat(i19, 4174) | 0;
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
   if (!(_strncmp(i15, i44, _strlen(i44) | 0) | 0)) {
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
    i10 = _sdstrim(_sdsnew(i15 + i11 | 0) | 0, 4189) | 0;
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
    i16 = _sdssplitlen(i10, i11, 4176, 1, i35) | 0;
    i19 = _sdsdup(HEAP32[i16 + ((HEAP32[i35 >> 2] | 0) + -1 << 2) >> 2] | 0) | 0;
    _sdsfreesplitres(i16, HEAP32[i35 >> 2] | 0);
    _sdsfree(i10);
    i16 = _par_token_from_string(i19) | 0;
    i17 = HEAP32[200] | 0;
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
     HEAP32[(HEAP32[(HEAP32[200] | 0) + 24 >> 2] | 0) + (i18 << 2) >> 2] = i15;
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
  i7 = _sdssplitlen(i10, i1, 4193, 1, i40) | 0;
  if ((HEAP32[i40 >> 2] | 0) > 0) {
   i4 = 0;
   do {
    _sdstrim(HEAP32[i7 + (i4 << 2) >> 2] | 0, 4176) | 0;
    i4 = i4 + 1 | 0;
    i1 = HEAP32[i40 >> 2] | 0;
   } while ((i4 | 0) < (i1 | 0));
   if ((i1 | 0) != 3) i38 = 65;
  } else i38 = 65;
  if ((i38 | 0) == 65 ? (i38 = 0, _puts(4195) | 0, (HEAP32[i40 >> 2] | 0) != 3) : 0) {
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
   i38 = 79;
   break;
  }
  i35 = HEAP32[i2 + (i4 << 2) >> 2] | 0;
  i37 = HEAP32[i2 + (i5 << 2) >> 2] | 0;
  i35 = _sdscat(_sdsdup(i8) | 0, i35) | 0;
  i37 = _sdscat(_sdscatsds(_sdsnew(4376) | 0, i8) | 0, i37) | 0;
  i39 = _par_token_from_string(HEAP32[i7 >> 2] | 0) | 0;
  _sdsfreesplitres(i7, HEAP32[i40 >> 2] | 0);
  _sdsfree(i10);
  i36 = _kh_put_smap(HEAP32[198] | 0, i39, i41) | 0;
  HEAP32[(HEAP32[(HEAP32[198] | 0) + 24 >> 2] | 0) + (i36 << 2) >> 2] = i35;
  i39 = _kh_put_smap(HEAP32[199] | 0, i39, i41) | 0;
  HEAP32[(HEAP32[(HEAP32[199] | 0) + 24 >> 2] | 0) + (i39 << 2) >> 2] = i37;
  i11 = i11 + 1 | 0;
  if (i11 >>> 0 >= i12 >>> 0) {
   i1 = i13;
   i38 = 84;
   break;
  }
 }
 if ((i38 | 0) == 66) ___assert_fail(4223, 4234, 122, 4272); else if ((i38 | 0) == 74) if (!i1) {
  _puts(4308) | 0;
  ___assert_fail(4324, 4234, 127, 4272);
 } else {
  HEAP32[i42 >> 2] = 4308;
  HEAP32[i42 + 4 >> 2] = i1;
  _printf(4300, i42) | 0;
  ___assert_fail(4324, 4234, 127, 4272);
 } else if ((i38 | 0) == 79) if (!i1) {
  _puts(4342) | 0;
  ___assert_fail(4358, 4234, 128, 4272);
 } else {
  HEAP32[i43 >> 2] = 4342;
  HEAP32[i43 + 4 >> 2] = i1;
  _printf(4300, i43) | 0;
  ___assert_fail(4358, 4234, 128, 4272);
 } else if ((i38 | 0) == 84) {
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

function _free(i23) {
 i23 = i23 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0;
 L1 : do if (i23) {
  i4 = i23 + -8 | 0;
  i9 = HEAP32[752] | 0;
  L3 : do if (i4 >>> 0 >= i9 >>> 0 ? (i3 = HEAP32[i23 + -4 >> 2] | 0, i2 = i3 & 3, (i2 | 0) != 1) : 0) {
   i20 = i3 & -8;
   i21 = i23 + (i20 + -8) | 0;
   do if (!(i3 & 1)) {
    i4 = HEAP32[i4 >> 2] | 0;
    if (!i2) break L1;
    i10 = -8 - i4 | 0;
    i12 = i23 + i10 | 0;
    i13 = i4 + i20 | 0;
    if (i12 >>> 0 < i9 >>> 0) break L3;
    if ((i12 | 0) == (HEAP32[753] | 0)) {
     i5 = i23 + (i20 + -4) | 0;
     i4 = HEAP32[i5 >> 2] | 0;
     if ((i4 & 3 | 0) != 3) {
      i27 = i12;
      i5 = i13;
      break;
     }
     HEAP32[750] = i13;
     HEAP32[i5 >> 2] = i4 & -2;
     HEAP32[i23 + (i10 + 4) >> 2] = i13 | 1;
     HEAP32[i21 >> 2] = i13;
     break L1;
    }
    i2 = i4 >>> 3;
    if (i4 >>> 0 < 256) {
     i3 = HEAP32[i23 + (i10 + 8) >> 2] | 0;
     i5 = HEAP32[i23 + (i10 + 12) >> 2] | 0;
     i4 = 3032 + (i2 << 1 << 2) | 0;
     do if ((i3 | 0) != (i4 | 0)) {
      if (i3 >>> 0 >= i9 >>> 0 ? (HEAP32[i3 + 12 >> 2] | 0) == (i12 | 0) : 0) break;
      _abort();
     } while (0);
     if ((i5 | 0) == (i3 | 0)) {
      HEAP32[748] = HEAP32[748] & ~(1 << i2);
      i27 = i12;
      i5 = i13;
      break;
     }
     do if ((i5 | 0) == (i4 | 0)) i1 = i5 + 8 | 0; else {
      if (i5 >>> 0 >= i9 >>> 0 ? (i6 = i5 + 8 | 0, (HEAP32[i6 >> 2] | 0) == (i12 | 0)) : 0) {
       i1 = i6;
       break;
      }
      _abort();
     } while (0);
     HEAP32[i3 + 12 >> 2] = i5;
     HEAP32[i1 >> 2] = i3;
     i27 = i12;
     i5 = i13;
     break;
    }
    i6 = HEAP32[i23 + (i10 + 24) >> 2] | 0;
    i4 = HEAP32[i23 + (i10 + 12) >> 2] | 0;
    do if ((i4 | 0) == (i12 | 0)) {
     i3 = i23 + (i10 + 20) | 0;
     i4 = HEAP32[i3 >> 2] | 0;
     if (!i4) {
      i3 = i23 + (i10 + 16) | 0;
      i4 = HEAP32[i3 >> 2] | 0;
      if (!i4) {
       i11 = 0;
       break;
      }
     }
     while (1) {
      i2 = i4 + 20 | 0;
      i1 = HEAP32[i2 >> 2] | 0;
      if (i1) {
       i4 = i1;
       i3 = i2;
       continue;
      }
      i2 = i4 + 16 | 0;
      i1 = HEAP32[i2 >> 2] | 0;
      if (!i1) break; else {
       i4 = i1;
       i3 = i2;
      }
     }
     if (i3 >>> 0 < i9 >>> 0) _abort(); else {
      HEAP32[i3 >> 2] = 0;
      i11 = i4;
      break;
     }
    } else {
     i3 = HEAP32[i23 + (i10 + 8) >> 2] | 0;
     if ((i3 >>> 0 >= i9 >>> 0 ? (i7 = i3 + 12 | 0, (HEAP32[i7 >> 2] | 0) == (i12 | 0)) : 0) ? (i8 = i4 + 8 | 0, (HEAP32[i8 >> 2] | 0) == (i12 | 0)) : 0) {
      HEAP32[i7 >> 2] = i4;
      HEAP32[i8 >> 2] = i3;
      i11 = i4;
      break;
     }
     _abort();
    } while (0);
    if (i6) {
     i4 = HEAP32[i23 + (i10 + 28) >> 2] | 0;
     i3 = 3296 + (i4 << 2) | 0;
     if ((i12 | 0) == (HEAP32[i3 >> 2] | 0)) {
      HEAP32[i3 >> 2] = i11;
      if (!i11) {
       HEAP32[749] = HEAP32[749] & ~(1 << i4);
       i27 = i12;
       i5 = i13;
       break;
      }
     } else {
      if (i6 >>> 0 < (HEAP32[752] | 0) >>> 0) _abort();
      i4 = i6 + 16 | 0;
      if ((HEAP32[i4 >> 2] | 0) == (i12 | 0)) HEAP32[i4 >> 2] = i11; else HEAP32[i6 + 20 >> 2] = i11;
      if (!i11) {
       i27 = i12;
       i5 = i13;
       break;
      }
     }
     i3 = HEAP32[752] | 0;
     if (i11 >>> 0 < i3 >>> 0) _abort();
     HEAP32[i11 + 24 >> 2] = i6;
     i4 = HEAP32[i23 + (i10 + 16) >> 2] | 0;
     do if (i4) if (i4 >>> 0 < i3 >>> 0) _abort(); else {
      HEAP32[i11 + 16 >> 2] = i4;
      HEAP32[i4 + 24 >> 2] = i11;
      break;
     } while (0);
     i4 = HEAP32[i23 + (i10 + 20) >> 2] | 0;
     if (i4) if (i4 >>> 0 < (HEAP32[752] | 0) >>> 0) _abort(); else {
      HEAP32[i11 + 20 >> 2] = i4;
      HEAP32[i4 + 24 >> 2] = i11;
      i27 = i12;
      i5 = i13;
      break;
     } else {
      i27 = i12;
      i5 = i13;
     }
    } else {
     i27 = i12;
     i5 = i13;
    }
   } else {
    i27 = i4;
    i5 = i20;
   } while (0);
   if (i27 >>> 0 < i21 >>> 0 ? (i14 = i23 + (i20 + -4) | 0, i15 = HEAP32[i14 >> 2] | 0, (i15 & 1 | 0) != 0) : 0) {
    if (!(i15 & 2)) {
     if ((i21 | 0) == (HEAP32[754] | 0)) {
      i26 = (HEAP32[751] | 0) + i5 | 0;
      HEAP32[751] = i26;
      HEAP32[754] = i27;
      HEAP32[i27 + 4 >> 2] = i26 | 1;
      if ((i27 | 0) != (HEAP32[753] | 0)) break L1;
      HEAP32[753] = 0;
      HEAP32[750] = 0;
      break L1;
     }
     if ((i21 | 0) == (HEAP32[753] | 0)) {
      i26 = (HEAP32[750] | 0) + i5 | 0;
      HEAP32[750] = i26;
      HEAP32[753] = i27;
      HEAP32[i27 + 4 >> 2] = i26 | 1;
      HEAP32[i27 + i26 >> 2] = i26;
      break L1;
     }
     i8 = (i15 & -8) + i5 | 0;
     i2 = i15 >>> 3;
     do if (i15 >>> 0 >= 256) {
      i1 = HEAP32[i23 + (i20 + 16) >> 2] | 0;
      i5 = HEAP32[i23 + (i20 | 4) >> 2] | 0;
      do if ((i5 | 0) == (i21 | 0)) {
       i4 = i23 + (i20 + 12) | 0;
       i5 = HEAP32[i4 >> 2] | 0;
       if (!i5) {
        i4 = i23 + (i20 + 8) | 0;
        i5 = HEAP32[i4 >> 2] | 0;
        if (!i5) {
         i22 = 0;
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
       if (i4 >>> 0 < (HEAP32[752] | 0) >>> 0) _abort(); else {
        HEAP32[i4 >> 2] = 0;
        i22 = i5;
        break;
       }
      } else {
       i4 = HEAP32[i23 + i20 >> 2] | 0;
       if ((i4 >>> 0 >= (HEAP32[752] | 0) >>> 0 ? (i18 = i4 + 12 | 0, (HEAP32[i18 >> 2] | 0) == (i21 | 0)) : 0) ? (i19 = i5 + 8 | 0, (HEAP32[i19 >> 2] | 0) == (i21 | 0)) : 0) {
        HEAP32[i18 >> 2] = i5;
        HEAP32[i19 >> 2] = i4;
        i22 = i5;
        break;
       }
       _abort();
      } while (0);
      if (i1) {
       i5 = HEAP32[i23 + (i20 + 20) >> 2] | 0;
       i4 = 3296 + (i5 << 2) | 0;
       if ((i21 | 0) == (HEAP32[i4 >> 2] | 0)) {
        HEAP32[i4 >> 2] = i22;
        if (!i22) {
         HEAP32[749] = HEAP32[749] & ~(1 << i5);
         break;
        }
       } else {
        if (i1 >>> 0 < (HEAP32[752] | 0) >>> 0) _abort();
        i5 = i1 + 16 | 0;
        if ((HEAP32[i5 >> 2] | 0) == (i21 | 0)) HEAP32[i5 >> 2] = i22; else HEAP32[i1 + 20 >> 2] = i22;
        if (!i22) break;
       }
       i5 = HEAP32[752] | 0;
       if (i22 >>> 0 < i5 >>> 0) _abort();
       HEAP32[i22 + 24 >> 2] = i1;
       i4 = HEAP32[i23 + (i20 + 8) >> 2] | 0;
       do if (i4) if (i4 >>> 0 < i5 >>> 0) _abort(); else {
        HEAP32[i22 + 16 >> 2] = i4;
        HEAP32[i4 + 24 >> 2] = i22;
        break;
       } while (0);
       i2 = HEAP32[i23 + (i20 + 12) >> 2] | 0;
       if (i2) if (i2 >>> 0 < (HEAP32[752] | 0) >>> 0) _abort(); else {
        HEAP32[i22 + 20 >> 2] = i2;
        HEAP32[i2 + 24 >> 2] = i22;
        break;
       }
      }
     } else {
      i3 = HEAP32[i23 + i20 >> 2] | 0;
      i5 = HEAP32[i23 + (i20 | 4) >> 2] | 0;
      i4 = 3032 + (i2 << 1 << 2) | 0;
      do if ((i3 | 0) != (i4 | 0)) {
       if (i3 >>> 0 >= (HEAP32[752] | 0) >>> 0 ? (HEAP32[i3 + 12 >> 2] | 0) == (i21 | 0) : 0) break;
       _abort();
      } while (0);
      if ((i5 | 0) == (i3 | 0)) {
       HEAP32[748] = HEAP32[748] & ~(1 << i2);
       break;
      }
      do if ((i5 | 0) == (i4 | 0)) i16 = i5 + 8 | 0; else {
       if (i5 >>> 0 >= (HEAP32[752] | 0) >>> 0 ? (i17 = i5 + 8 | 0, (HEAP32[i17 >> 2] | 0) == (i21 | 0)) : 0) {
        i16 = i17;
        break;
       }
       _abort();
      } while (0);
      HEAP32[i3 + 12 >> 2] = i5;
      HEAP32[i16 >> 2] = i3;
     } while (0);
     HEAP32[i27 + 4 >> 2] = i8 | 1;
     HEAP32[i27 + i8 >> 2] = i8;
     if ((i27 | 0) == (HEAP32[753] | 0)) {
      HEAP32[750] = i8;
      break L1;
     } else i5 = i8;
    } else {
     HEAP32[i14 >> 2] = i15 & -2;
     HEAP32[i27 + 4 >> 2] = i5 | 1;
     HEAP32[i27 + i5 >> 2] = i5;
    }
    i4 = i5 >>> 3;
    if (i5 >>> 0 < 256) {
     i3 = i4 << 1;
     i5 = 3032 + (i3 << 2) | 0;
     i1 = HEAP32[748] | 0;
     i2 = 1 << i4;
     if (i1 & i2) {
      i2 = 3032 + (i3 + 2 << 2) | 0;
      i1 = HEAP32[i2 >> 2] | 0;
      if (i1 >>> 0 < (HEAP32[752] | 0) >>> 0) _abort(); else {
       i24 = i2;
       i25 = i1;
      }
     } else {
      HEAP32[748] = i1 | i2;
      i24 = 3032 + (i3 + 2 << 2) | 0;
      i25 = i5;
     }
     HEAP32[i24 >> 2] = i27;
     HEAP32[i25 + 12 >> 2] = i27;
     HEAP32[i27 + 8 >> 2] = i25;
     HEAP32[i27 + 12 >> 2] = i5;
     break L1;
    }
    i1 = i5 >>> 8;
    if (i1) if (i5 >>> 0 > 16777215) i4 = 31; else {
     i24 = (i1 + 1048320 | 0) >>> 16 & 8;
     i25 = i1 << i24;
     i23 = (i25 + 520192 | 0) >>> 16 & 4;
     i25 = i25 << i23;
     i4 = (i25 + 245760 | 0) >>> 16 & 2;
     i4 = 14 - (i23 | i24 | i4) + (i25 << i4 >>> 15) | 0;
     i4 = i5 >>> (i4 + 7 | 0) & 1 | i4 << 1;
    } else i4 = 0;
    i2 = 3296 + (i4 << 2) | 0;
    HEAP32[i27 + 28 >> 2] = i4;
    HEAP32[i27 + 20 >> 2] = 0;
    HEAP32[i27 + 16 >> 2] = 0;
    i1 = HEAP32[749] | 0;
    i3 = 1 << i4;
    L168 : do if (i1 & i3) {
     i2 = HEAP32[i2 >> 2] | 0;
     L171 : do if ((HEAP32[i2 + 4 >> 2] & -8 | 0) != (i5 | 0)) {
      i4 = i5 << ((i4 | 0) == 31 ? 0 : 25 - (i4 >>> 1) | 0);
      while (1) {
       i1 = i2 + 16 + (i4 >>> 31 << 2) | 0;
       i3 = HEAP32[i1 >> 2] | 0;
       if (!i3) break;
       if ((HEAP32[i3 + 4 >> 2] & -8 | 0) == (i5 | 0)) {
        i26 = i3;
        break L171;
       } else {
        i4 = i4 << 1;
        i2 = i3;
       }
      }
      if (i1 >>> 0 < (HEAP32[752] | 0) >>> 0) _abort(); else {
       HEAP32[i1 >> 2] = i27;
       HEAP32[i27 + 24 >> 2] = i2;
       HEAP32[i27 + 12 >> 2] = i27;
       HEAP32[i27 + 8 >> 2] = i27;
       break L168;
      }
     } else i26 = i2; while (0);
     i1 = i26 + 8 | 0;
     i2 = HEAP32[i1 >> 2] | 0;
     i25 = HEAP32[752] | 0;
     if (i2 >>> 0 >= i25 >>> 0 & i26 >>> 0 >= i25 >>> 0) {
      HEAP32[i2 + 12 >> 2] = i27;
      HEAP32[i1 >> 2] = i27;
      HEAP32[i27 + 8 >> 2] = i2;
      HEAP32[i27 + 12 >> 2] = i26;
      HEAP32[i27 + 24 >> 2] = 0;
      break;
     } else _abort();
    } else {
     HEAP32[749] = i1 | i3;
     HEAP32[i2 >> 2] = i27;
     HEAP32[i27 + 24 >> 2] = i2;
     HEAP32[i27 + 12 >> 2] = i27;
     HEAP32[i27 + 8 >> 2] = i27;
    } while (0);
    i27 = (HEAP32[756] | 0) + -1 | 0;
    HEAP32[756] = i27;
    if (!i27) i1 = 3448; else break L1;
    while (1) {
     i1 = HEAP32[i1 >> 2] | 0;
     if (!i1) break; else i1 = i1 + 8 | 0;
    }
    HEAP32[756] = -1;
    break L1;
   }
  } while (0);
  _abort();
 } while (0);
 return;
}

function _dispose_chunk(i20, i21) {
 i20 = i20 | 0;
 i21 = i21 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i22 = 0, i23 = 0, i24 = 0;
 i18 = i20 + i21 | 0;
 i5 = HEAP32[i20 + 4 >> 2] | 0;
 do if (!(i5 & 1)) {
  i10 = HEAP32[i20 >> 2] | 0;
  if (i5 & 3) {
   i12 = i20 + (0 - i10) | 0;
   i5 = i10 + i21 | 0;
   i9 = HEAP32[752] | 0;
   if (i12 >>> 0 < i9 >>> 0) _abort();
   if ((i12 | 0) == (HEAP32[753] | 0)) {
    i3 = i20 + (i21 + 4) | 0;
    i4 = HEAP32[i3 >> 2] | 0;
    if ((i4 & 3 | 0) != 3) {
     i13 = 54;
     break;
    }
    HEAP32[750] = i5;
    HEAP32[i3 >> 2] = i4 & -2;
    HEAP32[i20 + (4 - i10) >> 2] = i5 | 1;
    HEAP32[i18 >> 2] = i5;
    break;
   }
   i1 = i10 >>> 3;
   if (i10 >>> 0 < 256) {
    i2 = HEAP32[i20 + (8 - i10) >> 2] | 0;
    i4 = HEAP32[i20 + (12 - i10) >> 2] | 0;
    i3 = 3032 + (i1 << 1 << 2) | 0;
    do if ((i2 | 0) != (i3 | 0)) {
     if (i2 >>> 0 >= i9 >>> 0 ? (HEAP32[i2 + 12 >> 2] | 0) == (i12 | 0) : 0) break;
     _abort();
    } while (0);
    if ((i4 | 0) == (i2 | 0)) {
     HEAP32[748] = HEAP32[748] & ~(1 << i1);
     i13 = 54;
     break;
    }
    do if ((i4 | 0) == (i3 | 0)) i6 = i4 + 8 | 0; else {
     if (i4 >>> 0 >= i9 >>> 0 ? (i7 = i4 + 8 | 0, (HEAP32[i7 >> 2] | 0) == (i12 | 0)) : 0) {
      i6 = i7;
      break;
     }
     _abort();
    } while (0);
    HEAP32[i2 + 12 >> 2] = i4;
    HEAP32[i6 >> 2] = i2;
    i13 = 54;
    break;
   }
   i7 = HEAP32[i20 + (24 - i10) >> 2] | 0;
   i4 = HEAP32[i20 + (12 - i10) >> 2] | 0;
   do if ((i4 | 0) == (i12 | 0)) {
    i2 = 16 - i10 | 0;
    i3 = i20 + (i2 + 4) | 0;
    i4 = HEAP32[i3 >> 2] | 0;
    if (!i4) {
     i3 = i20 + i2 | 0;
     i4 = HEAP32[i3 >> 2] | 0;
     if (!i4) {
      i11 = 0;
      break;
     }
    }
    while (1) {
     i2 = i4 + 20 | 0;
     i1 = HEAP32[i2 >> 2] | 0;
     if (i1) {
      i4 = i1;
      i3 = i2;
      continue;
     }
     i2 = i4 + 16 | 0;
     i1 = HEAP32[i2 >> 2] | 0;
     if (!i1) break; else {
      i4 = i1;
      i3 = i2;
     }
    }
    if (i3 >>> 0 < i9 >>> 0) _abort(); else {
     HEAP32[i3 >> 2] = 0;
     i11 = i4;
     break;
    }
   } else {
    i3 = HEAP32[i20 + (8 - i10) >> 2] | 0;
    if ((i3 >>> 0 >= i9 >>> 0 ? (i2 = i3 + 12 | 0, (HEAP32[i2 >> 2] | 0) == (i12 | 0)) : 0) ? (i8 = i4 + 8 | 0, (HEAP32[i8 >> 2] | 0) == (i12 | 0)) : 0) {
     HEAP32[i2 >> 2] = i4;
     HEAP32[i8 >> 2] = i3;
     i11 = i4;
     break;
    }
    _abort();
   } while (0);
   if (i7) {
    i4 = HEAP32[i20 + (28 - i10) >> 2] | 0;
    i3 = 3296 + (i4 << 2) | 0;
    if ((i12 | 0) == (HEAP32[i3 >> 2] | 0)) {
     HEAP32[i3 >> 2] = i11;
     if (!i11) {
      HEAP32[749] = HEAP32[749] & ~(1 << i4);
      i13 = 54;
      break;
     }
    } else {
     if (i7 >>> 0 < (HEAP32[752] | 0) >>> 0) _abort();
     i4 = i7 + 16 | 0;
     if ((HEAP32[i4 >> 2] | 0) == (i12 | 0)) HEAP32[i4 >> 2] = i11; else HEAP32[i7 + 20 >> 2] = i11;
     if (!i11) {
      i13 = 54;
      break;
     }
    }
    i2 = HEAP32[752] | 0;
    if (i11 >>> 0 < i2 >>> 0) _abort();
    HEAP32[i11 + 24 >> 2] = i7;
    i4 = 16 - i10 | 0;
    i3 = HEAP32[i20 + i4 >> 2] | 0;
    do if (i3) if (i3 >>> 0 < i2 >>> 0) _abort(); else {
     HEAP32[i11 + 16 >> 2] = i3;
     HEAP32[i3 + 24 >> 2] = i11;
     break;
    } while (0);
    i4 = HEAP32[i20 + (i4 + 4) >> 2] | 0;
    if (i4) if (i4 >>> 0 < (HEAP32[752] | 0) >>> 0) _abort(); else {
     HEAP32[i11 + 20 >> 2] = i4;
     HEAP32[i4 + 24 >> 2] = i11;
     i13 = 54;
     break;
    } else i13 = 54;
   } else i13 = 54;
  }
 } else {
  i12 = i20;
  i5 = i21;
  i13 = 54;
 } while (0);
 L74 : do if ((i13 | 0) == 54) {
  i7 = HEAP32[752] | 0;
  if (i18 >>> 0 < i7 >>> 0) _abort();
  i4 = i20 + (i21 + 4) | 0;
  i3 = HEAP32[i4 >> 2] | 0;
  if (!(i3 & 2)) {
   if ((i18 | 0) == (HEAP32[754] | 0)) {
    i24 = (HEAP32[751] | 0) + i5 | 0;
    HEAP32[751] = i24;
    HEAP32[754] = i12;
    HEAP32[i12 + 4 >> 2] = i24 | 1;
    if ((i12 | 0) != (HEAP32[753] | 0)) break;
    HEAP32[753] = 0;
    HEAP32[750] = 0;
    break;
   }
   if ((i18 | 0) == (HEAP32[753] | 0)) {
    i24 = (HEAP32[750] | 0) + i5 | 0;
    HEAP32[750] = i24;
    HEAP32[753] = i12;
    HEAP32[i12 + 4 >> 2] = i24 | 1;
    HEAP32[i12 + i24 >> 2] = i24;
    break;
   }
   i6 = (i3 & -8) + i5 | 0;
   i2 = i3 >>> 3;
   do if (i3 >>> 0 >= 256) {
    i8 = HEAP32[i20 + (i21 + 24) >> 2] | 0;
    i5 = HEAP32[i20 + (i21 + 12) >> 2] | 0;
    do if ((i5 | 0) == (i18 | 0)) {
     i4 = i20 + (i21 + 20) | 0;
     i5 = HEAP32[i4 >> 2] | 0;
     if (!i5) {
      i4 = i20 + (i21 + 16) | 0;
      i5 = HEAP32[i4 >> 2] | 0;
      if (!i5) {
       i19 = 0;
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
     if (i4 >>> 0 < i7 >>> 0) _abort(); else {
      HEAP32[i4 >> 2] = 0;
      i19 = i5;
      break;
     }
    } else {
     i4 = HEAP32[i20 + (i21 + 8) >> 2] | 0;
     if ((i4 >>> 0 >= i7 >>> 0 ? (i16 = i4 + 12 | 0, (HEAP32[i16 >> 2] | 0) == (i18 | 0)) : 0) ? (i17 = i5 + 8 | 0, (HEAP32[i17 >> 2] | 0) == (i18 | 0)) : 0) {
      HEAP32[i16 >> 2] = i5;
      HEAP32[i17 >> 2] = i4;
      i19 = i5;
      break;
     }
     _abort();
    } while (0);
    if (i8) {
     i5 = HEAP32[i20 + (i21 + 28) >> 2] | 0;
     i4 = 3296 + (i5 << 2) | 0;
     if ((i18 | 0) == (HEAP32[i4 >> 2] | 0)) {
      HEAP32[i4 >> 2] = i19;
      if (!i19) {
       HEAP32[749] = HEAP32[749] & ~(1 << i5);
       break;
      }
     } else {
      if (i8 >>> 0 < (HEAP32[752] | 0) >>> 0) _abort();
      i5 = i8 + 16 | 0;
      if ((HEAP32[i5 >> 2] | 0) == (i18 | 0)) HEAP32[i5 >> 2] = i19; else HEAP32[i8 + 20 >> 2] = i19;
      if (!i19) break;
     }
     i5 = HEAP32[752] | 0;
     if (i19 >>> 0 < i5 >>> 0) _abort();
     HEAP32[i19 + 24 >> 2] = i8;
     i4 = HEAP32[i20 + (i21 + 16) >> 2] | 0;
     do if (i4) if (i4 >>> 0 < i5 >>> 0) _abort(); else {
      HEAP32[i19 + 16 >> 2] = i4;
      HEAP32[i4 + 24 >> 2] = i19;
      break;
     } while (0);
     i2 = HEAP32[i20 + (i21 + 20) >> 2] | 0;
     if (i2) if (i2 >>> 0 < (HEAP32[752] | 0) >>> 0) _abort(); else {
      HEAP32[i19 + 20 >> 2] = i2;
      HEAP32[i2 + 24 >> 2] = i19;
      break;
     }
    }
   } else {
    i3 = HEAP32[i20 + (i21 + 8) >> 2] | 0;
    i5 = HEAP32[i20 + (i21 + 12) >> 2] | 0;
    i4 = 3032 + (i2 << 1 << 2) | 0;
    do if ((i3 | 0) != (i4 | 0)) {
     if (i3 >>> 0 >= i7 >>> 0 ? (HEAP32[i3 + 12 >> 2] | 0) == (i18 | 0) : 0) break;
     _abort();
    } while (0);
    if ((i5 | 0) == (i3 | 0)) {
     HEAP32[748] = HEAP32[748] & ~(1 << i2);
     break;
    }
    do if ((i5 | 0) == (i4 | 0)) i14 = i5 + 8 | 0; else {
     if (i5 >>> 0 >= i7 >>> 0 ? (i15 = i5 + 8 | 0, (HEAP32[i15 >> 2] | 0) == (i18 | 0)) : 0) {
      i14 = i15;
      break;
     }
     _abort();
    } while (0);
    HEAP32[i3 + 12 >> 2] = i5;
    HEAP32[i14 >> 2] = i3;
   } while (0);
   HEAP32[i12 + 4 >> 2] = i6 | 1;
   HEAP32[i12 + i6 >> 2] = i6;
   if ((i12 | 0) == (HEAP32[753] | 0)) {
    HEAP32[750] = i6;
    break;
   } else i5 = i6;
  } else {
   HEAP32[i4 >> 2] = i3 & -2;
   HEAP32[i12 + 4 >> 2] = i5 | 1;
   HEAP32[i12 + i5 >> 2] = i5;
  }
  i4 = i5 >>> 3;
  if (i5 >>> 0 < 256) {
   i3 = i4 << 1;
   i5 = 3032 + (i3 << 2) | 0;
   i1 = HEAP32[748] | 0;
   i2 = 1 << i4;
   if (i1 & i2) {
    i2 = 3032 + (i3 + 2 << 2) | 0;
    i1 = HEAP32[i2 >> 2] | 0;
    if (i1 >>> 0 < (HEAP32[752] | 0) >>> 0) _abort(); else {
     i22 = i2;
     i23 = i1;
    }
   } else {
    HEAP32[748] = i1 | i2;
    i22 = 3032 + (i3 + 2 << 2) | 0;
    i23 = i5;
   }
   HEAP32[i22 >> 2] = i12;
   HEAP32[i23 + 12 >> 2] = i12;
   HEAP32[i12 + 8 >> 2] = i23;
   HEAP32[i12 + 12 >> 2] = i5;
   break;
  }
  i1 = i5 >>> 8;
  if (i1) if (i5 >>> 0 > 16777215) i4 = 31; else {
   i22 = (i1 + 1048320 | 0) >>> 16 & 8;
   i23 = i1 << i22;
   i21 = (i23 + 520192 | 0) >>> 16 & 4;
   i23 = i23 << i21;
   i4 = (i23 + 245760 | 0) >>> 16 & 2;
   i4 = 14 - (i21 | i22 | i4) + (i23 << i4 >>> 15) | 0;
   i4 = i5 >>> (i4 + 7 | 0) & 1 | i4 << 1;
  } else i4 = 0;
  i2 = 3296 + (i4 << 2) | 0;
  HEAP32[i12 + 28 >> 2] = i4;
  HEAP32[i12 + 20 >> 2] = 0;
  HEAP32[i12 + 16 >> 2] = 0;
  i1 = HEAP32[749] | 0;
  i3 = 1 << i4;
  if (!(i1 & i3)) {
   HEAP32[749] = i1 | i3;
   HEAP32[i2 >> 2] = i12;
   HEAP32[i12 + 24 >> 2] = i2;
   HEAP32[i12 + 12 >> 2] = i12;
   HEAP32[i12 + 8 >> 2] = i12;
   break;
  }
  i2 = HEAP32[i2 >> 2] | 0;
  L170 : do if ((HEAP32[i2 + 4 >> 2] & -8 | 0) != (i5 | 0)) {
   i4 = i5 << ((i4 | 0) == 31 ? 0 : 25 - (i4 >>> 1) | 0);
   while (1) {
    i1 = i2 + 16 + (i4 >>> 31 << 2) | 0;
    i3 = HEAP32[i1 >> 2] | 0;
    if (!i3) break;
    if ((HEAP32[i3 + 4 >> 2] & -8 | 0) == (i5 | 0)) {
     i24 = i3;
     break L170;
    } else {
     i4 = i4 << 1;
     i2 = i3;
    }
   }
   if (i1 >>> 0 < (HEAP32[752] | 0) >>> 0) _abort(); else {
    HEAP32[i1 >> 2] = i12;
    HEAP32[i12 + 24 >> 2] = i2;
    HEAP32[i12 + 12 >> 2] = i12;
    HEAP32[i12 + 8 >> 2] = i12;
    break L74;
   }
  } else i24 = i2; while (0);
  i1 = i24 + 8 | 0;
  i2 = HEAP32[i1 >> 2] | 0;
  i23 = HEAP32[752] | 0;
  if (i2 >>> 0 >= i23 >>> 0 & i24 >>> 0 >= i23 >>> 0) {
   HEAP32[i2 + 12 >> 2] = i12;
   HEAP32[i1 >> 2] = i12;
   HEAP32[i12 + 8 >> 2] = i2;
   HEAP32[i12 + 12 >> 2] = i24;
   HEAP32[i12 + 24 >> 2] = 0;
   break;
  } else _abort();
 } while (0);
 return;
}

function _lodepng_convert(i27, i26, i24, i23, i4, i5) {
 i27 = i27 | 0;
 i26 = i26 | 0;
 i24 = i24 | 0;
 i23 = i23 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i25 = 0, i28 = 0;
 i28 = STACKTOP;
 STACKTOP = STACKTOP + 80 | 0;
 i25 = i28;
 i17 = i28 + 74 | 0;
 i16 = i28 + 72 | 0;
 i15 = i28 + 70 | 0;
 i14 = i28 + 68 | 0;
 i21 = i28 + 79 | 0;
 i20 = i28 + 78 | 0;
 i19 = i28 + 77 | 0;
 i18 = i28 + 76 | 0;
 i22 = Math_imul(i5, i4) | 0;
 i13 = HEAP32[i24 >> 2] | 0;
 L1 : do if (((i13 | 0) == (HEAP32[i23 >> 2] | 0) ? (i6 = HEAP32[i24 + 4 >> 2] | 0, (i6 | 0) == (HEAP32[i23 + 4 >> 2] | 0)) : 0) ? (i3 = HEAP32[i24 + 16 >> 2] | 0, (i3 | 0) == (HEAP32[i23 + 16 >> 2] | 0)) : 0) {
  if (i3) {
   if ((HEAP32[i24 + 20 >> 2] | 0) != (HEAP32[i23 + 20 >> 2] | 0)) break;
   if ((HEAP32[i24 + 24 >> 2] | 0) != (HEAP32[i23 + 24 >> 2] | 0)) break;
   if ((HEAP32[i24 + 28 >> 2] | 0) != (HEAP32[i23 + 28 >> 2] | 0)) break;
  }
  i5 = HEAP32[i24 + 12 >> 2] | 0;
  if ((i5 | 0) == (HEAP32[i23 + 12 >> 2] | 0)) {
   if (i5 & 1073741823) {
    i3 = HEAP32[i24 + 8 >> 2] | 0;
    i2 = HEAP32[i23 + 8 >> 2] | 0;
    i5 = i5 << 2;
    i4 = 0;
    do {
     if ((HEAP8[i3 + i4 >> 0] | 0) != (HEAP8[i2 + i4 >> 0] | 0)) break L1;
     i4 = i4 + 1 | 0;
    } while ((i4 | 0) != (i5 | 0));
   }
   switch (i13 | 0) {
   case 3:
   case 0:
    {
     i2 = 1;
     break;
    }
   case 2:
    {
     i2 = 3;
     break;
    }
   case 4:
    {
     i2 = 2;
     break;
    }
   case 6:
    {
     i2 = 4;
     break;
    }
   default:
    i2 = 0;
   }
   i1 = ((Math_imul(Math_imul(i6, i22) | 0, i2) | 0) + 7 | 0) >>> 3;
   if (!i1) {
    STACKTOP = i28;
    return 0;
   } else i2 = 0;
   do {
    HEAP8[i27 + i2 >> 0] = HEAP8[i26 + i2 >> 0] | 0;
    i2 = i2 + 1 | 0;
   } while ((i2 | 0) != (i1 | 0));
   STACKTOP = i28;
   return 0;
  }
 } while (0);
 if ((i13 | 0) == 3) {
  i10 = 1 << HEAP32[i24 + 4 >> 2];
  i5 = HEAP32[i24 + 12 >> 2] | 0;
  i10 = i5 >>> 0 < i10 >>> 0 ? i5 : i10;
  i5 = i25;
  i4 = i5 + 64 | 0;
  do {
   HEAP32[i5 >> 2] = 0;
   i5 = i5 + 4 | 0;
  } while ((i5 | 0) < (i4 | 0));
  HEAP32[i25 + 64 >> 2] = -1;
  if (i10) {
   i11 = i24 + 8 | 0;
   i12 = 0;
   do {
    i8 = i12 << 2;
    i5 = HEAP32[i11 >> 2] | 0;
    i7 = HEAPU8[i5 + i8 >> 0] | 0;
    i2 = HEAPU8[i5 + (i8 | 1) >> 0] | 0;
    i1 = HEAPU8[i5 + (i8 | 2) >> 0] | 0;
    i8 = HEAPU8[i5 + (i8 | 3) >> 0] | 0;
    i5 = i25;
    i9 = 0;
    do {
     i3 = i5 + ((i2 >>> i9 << 2 & 4 | i8 >>> i9 & 1 | i7 >>> i9 << 3 & 8 | i1 >>> i9 << 1 & 2) << 2) | 0;
     i5 = HEAP32[i3 >> 2] | 0;
     if (!i5) {
      i6 = _malloc(68) | 0;
      HEAP32[i3 >> 2] = i6;
      i5 = i6;
      i4 = i5 + 64 | 0;
      do {
       HEAP32[i5 >> 2] = 0;
       i5 = i5 + 4 | 0;
      } while ((i5 | 0) < (i4 | 0));
      HEAP32[i6 + 64 >> 2] = -1;
      i5 = HEAP32[i3 >> 2] | 0;
     }
     i9 = i9 + 1 | 0;
    } while ((i9 | 0) != 8);
    HEAP32[i5 + 64 >> 2] = i12;
    i12 = i12 + 1 | 0;
   } while ((i12 | 0) != (i10 | 0));
  }
 }
 i12 = i24 + 4 | 0;
 i5 = HEAP32[i12 >> 2] | 0;
 L41 : do if ((i5 | 0) == 16 ? (HEAP32[i23 + 4 >> 2] | 0) == 16 : 0) {
  if (i22) {
   i5 = 0;
   while (1) {
    HEAP16[i17 >> 1] = 0;
    HEAP16[i16 >> 1] = 0;
    HEAP16[i15 >> 1] = 0;
    HEAP16[i14 >> 1] = 0;
    _getPixelColorRGBA16(i17, i16, i15, i14, i26, i5, i23);
    i2 = HEAP16[i17 >> 1] | 0;
    i1 = HEAP16[i16 >> 1] | 0;
    i3 = HEAP16[i15 >> 1] | 0;
    i4 = HEAP16[i14 >> 1] | 0;
    switch (HEAP32[i24 >> 2] | 0) {
    case 0:
     {
      i21 = i5 << 1;
      HEAP8[i27 + i21 >> 0] = (i2 & 65535) >>> 8;
      HEAP8[i27 + (i21 | 1) >> 0] = i2;
      break;
     }
    case 2:
     {
      i21 = i5 * 6 | 0;
      HEAP8[i27 + i21 >> 0] = (i2 & 65535) >>> 8;
      HEAP8[i27 + (i21 | 1) >> 0] = i2;
      HEAP8[i27 + (i21 + 2) >> 0] = (i1 & 65535) >>> 8;
      HEAP8[i27 + (i21 + 3) >> 0] = i1;
      HEAP8[i27 + (i21 + 4) >> 0] = (i3 & 65535) >>> 8;
      HEAP8[i27 + (i21 + 5) >> 0] = i3;
      break;
     }
    case 4:
     {
      i21 = i5 << 2;
      HEAP8[i27 + i21 >> 0] = (i2 & 65535) >>> 8;
      HEAP8[i27 + (i21 | 1) >> 0] = i2;
      HEAP8[i27 + (i21 | 2) >> 0] = (i4 & 65535) >>> 8;
      HEAP8[i27 + (i21 | 3) >> 0] = i4;
      break;
     }
    case 6:
     {
      i21 = i5 << 3;
      HEAP8[i27 + i21 >> 0] = (i2 & 65535) >>> 8;
      HEAP8[i27 + (i21 | 1) >> 0] = i2;
      HEAP8[i27 + (i21 | 2) >> 0] = (i1 & 65535) >>> 8;
      HEAP8[i27 + (i21 | 3) >> 0] = i1;
      HEAP8[i27 + (i21 | 4) >> 0] = (i3 & 65535) >>> 8;
      HEAP8[i27 + (i21 | 5) >> 0] = i3;
      HEAP8[i27 + (i21 | 6) >> 0] = (i4 & 65535) >>> 8;
      HEAP8[i27 + (i21 | 7) >> 0] = i4;
      break;
     }
    default:
     {}
    }
    i5 = i5 + 1 | 0;
    if ((i5 | 0) == (i22 | 0)) break L41;
   }
  }
 } else {
  L52 : do if ((i5 | 0) == 8) switch (i13 | 0) {
  case 6:
   {
    _getPixelColorsRGBA8(i27, i22, 1, i26, i23);
    break L41;
   }
  case 2:
   {
    _getPixelColorsRGBA8(i27, i22, 0, i26, i23);
    break L41;
   }
  default:
   break L52;
  } while (0);
  HEAP8[i21 >> 0] = 0;
  HEAP8[i20 >> 0] = 0;
  HEAP8[i19 >> 0] = 0;
  HEAP8[i18 >> 0] = 0;
  if (i22) {
   i7 = 0;
   while (1) {
    _getPixelColorRGBA8(i21, i20, i19, i18, i26, i7, i23);
    i5 = HEAP8[i21 >> 0] | 0;
    i4 = HEAP8[i20 >> 0] | 0;
    i3 = HEAP8[i19 >> 0] | 0;
    i2 = HEAP8[i18 >> 0] | 0;
    L60 : do switch (HEAP32[i24 >> 2] | 0) {
    case 0:
     {
      i4 = HEAP32[i12 >> 2] | 0;
      switch (i4 | 0) {
      case 8:
       {
        HEAP8[i27 + i7 >> 0] = i5;
        break L60;
       }
      case 16:
       {
        i17 = i7 << 1;
        HEAP8[i27 + (i17 | 1) >> 0] = i5;
        HEAP8[i27 + i17 >> 0] = i5;
        break L60;
       }
      default:
       {
        i2 = (i4 | 0) == 1 ? 7 : (i4 | 0) == 2 ? 3 : 1;
        i17 = i2 & i7;
        i2 = ((1 << i4) + 255 & 255 & (i5 & 255) >>> (8 - i4 | 0)) << (Math_imul(i2 - i17 | 0, i4) | 0);
        if (!i17) {
         i17 = i27 + ((Math_imul(i4, i7) | 0) >>> 3) | 0;
         HEAP8[i17 >> 0] = i2;
         break L60;
        } else {
         i17 = i27 + ((Math_imul(i4, i7) | 0) >>> 3) | 0;
         HEAP8[i17 >> 0] = HEAPU8[i17 >> 0] | i2;
         break L60;
        }
       }
      }
     }
    case 2:
     if ((HEAP32[i12 >> 2] | 0) == 8) {
      i17 = i7 * 3 | 0;
      HEAP8[i27 + i17 >> 0] = i5;
      HEAP8[i27 + (i17 + 1) >> 0] = i4;
      HEAP8[i27 + (i17 + 2) >> 0] = i3;
      break L60;
     } else {
      i17 = i7 * 6 | 0;
      HEAP8[i27 + (i17 | 1) >> 0] = i5;
      HEAP8[i27 + i17 >> 0] = i5;
      HEAP8[i27 + (i17 + 3) >> 0] = i4;
      HEAP8[i27 + (i17 + 2) >> 0] = i4;
      HEAP8[i27 + (i17 + 5) >> 0] = i3;
      HEAP8[i27 + (i17 + 4) >> 0] = i3;
      break L60;
     }
    case 3:
     {
      i6 = i5 & 255;
      i1 = i4 & 255;
      i3 = i3 & 255;
      i5 = i2 & 255;
      i2 = i25;
      i4 = 0;
      do {
       i2 = HEAP32[i2 + ((i1 >>> i4 << 2 & 4 | i5 >>> i4 & 1 | i6 >>> i4 << 3 & 8 | i3 >>> i4 << 1 & 2) << 2) >> 2] | 0;
       i4 = i4 + 1 | 0;
       if (!i2) break L60;
      } while ((i4 | 0) < 8);
      i2 = HEAP32[i2 + 64 >> 2] | 0;
      if ((i2 | 0) >= 0) {
       i4 = HEAP32[i12 >> 2] | 0;
       if ((i4 | 0) == 8) {
        HEAP8[i27 + i7 >> 0] = i2;
        break L60;
       }
       i16 = (i4 | 0) == 1 ? 7 : (i4 | 0) == 2 ? 3 : 1;
       i17 = i16 & i7;
       i2 = ((1 << i4) + -1 & i2) << (Math_imul(i16 - i17 | 0, i4) | 0);
       if (!i17) {
        i17 = i27 + ((Math_imul(i4, i7) | 0) >>> 3) | 0;
        HEAP8[i17 >> 0] = i2;
        break L60;
       } else {
        i17 = i27 + ((Math_imul(i4, i7) | 0) >>> 3) | 0;
        HEAP8[i17 >> 0] = HEAPU8[i17 >> 0] | i2;
        break L60;
       }
      }
      break;
     }
    case 4:
     switch (HEAP32[i12 >> 2] | 0) {
     case 8:
      {
       i17 = i7 << 1;
       HEAP8[i27 + i17 >> 0] = i5;
       HEAP8[i27 + (i17 | 1) >> 0] = i2;
       break L60;
      }
     case 16:
      {
       i17 = i7 << 2;
       HEAP8[i27 + (i17 | 1) >> 0] = i5;
       HEAP8[i27 + i17 >> 0] = i5;
       HEAP8[i27 + (i17 | 3) >> 0] = i2;
       HEAP8[i27 + (i17 | 2) >> 0] = i2;
       break L60;
      }
     default:
      break L60;
     }
    case 6:
     if ((HEAP32[i12 >> 2] | 0) == 8) {
      i17 = i7 << 2;
      HEAP8[i27 + i17 >> 0] = i5;
      HEAP8[i27 + (i17 | 1) >> 0] = i4;
      HEAP8[i27 + (i17 | 2) >> 0] = i3;
      HEAP8[i27 + (i17 | 3) >> 0] = i2;
      break L60;
     } else {
      i17 = i7 << 3;
      HEAP8[i27 + (i17 | 1) >> 0] = i5;
      HEAP8[i27 + i17 >> 0] = i5;
      HEAP8[i27 + (i17 | 3) >> 0] = i4;
      HEAP8[i27 + (i17 | 2) >> 0] = i4;
      HEAP8[i27 + (i17 | 5) >> 0] = i3;
      HEAP8[i27 + (i17 | 4) >> 0] = i3;
      HEAP8[i27 + (i17 | 7) >> 0] = i2;
      HEAP8[i27 + (i17 | 6) >> 0] = i2;
      break L60;
     }
    default:
     {}
    } while (0);
    i7 = i7 + 1 | 0;
    if ((i7 | 0) == (i22 | 0)) break L41;
   }
  }
 } while (0);
 if ((HEAP32[i24 >> 2] | 0) != 3) {
  STACKTOP = i28;
  return 0;
 }
 _color_tree_cleanup(i25);
 STACKTOP = i28;
 return 0;
}

function _par_shader_bind(i23) {
 i23 = i23 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i24 = 0, i25 = 0;
 i25 = STACKTOP;
 STACKTOP = STACKTOP + 1216 | 0;
 i24 = i25 + 40 | 0;
 i17 = i25 + 32 | 0;
 i16 = i25 + 24 | 0;
 i12 = i25 + 16 | 0;
 i13 = i25 + 8 | 0;
 i14 = i25;
 i22 = i25 + 1208 | 0;
 i19 = i25 + 1080 | 0;
 i21 = i25 + 56 | 0;
 i18 = i25 + 52 | 0;
 i20 = i25 + 48 | 0;
 i2 = HEAP32[203] | 0;
 if (!i2) {
  i2 = _calloc(1, 28) | 0;
  HEAP32[203] = i2;
 }
 i5 = HEAP32[i2 >> 2] | 0;
 L4 : do if (!i5) i5 = 0; else {
  i8 = i5 + -1 | 0;
  i7 = i8 & i23;
  i6 = HEAP32[i2 + 16 >> 2] | 0;
  i10 = i2 + 20 | 0;
  i4 = i7;
  i11 = 0;
  while (1) {
   i1 = HEAP32[i6 + (i4 >>> 4 << 2) >> 2] | 0;
   i3 = i4 << 1 & 30;
   i9 = i1 >>> i3;
   if (i9 & 2) break;
   if ((i9 & 1 | 0) == 0 ? (HEAP32[(HEAP32[i10 >> 2] | 0) + (i4 << 2) >> 2] | 0) == (i23 | 0) : 0) break;
   i11 = i11 + 1 | 0;
   i4 = i11 + i4 & i8;
   if ((i4 | 0) == (i7 | 0)) break L4;
  }
  i5 = (3 << i3 & i1 | 0) == 0 ? i4 : i5;
 } while (0);
 if ((i5 | 0) == (HEAP32[i2 >> 2] | 0)) {
  i4 = HEAP32[198] | 0;
  i5 = HEAP32[i4 >> 2] | 0;
  L16 : do if (!i5) {
   i4 = 0;
   i15 = 18;
  } else {
   i9 = i5 + -1 | 0;
   i8 = i9 & i23;
   i1 = HEAP32[i4 + 16 >> 2] | 0;
   i7 = i4 + 20 | 0;
   i4 = i8;
   i10 = 0;
   while (1) {
    i2 = HEAP32[i1 + (i4 >>> 4 << 2) >> 2] | 0;
    i3 = i4 << 1 & 30;
    i6 = i2 >>> i3;
    if (i6 & 2) break;
    if ((i6 & 1 | 0) == 0 ? (HEAP32[(HEAP32[i7 >> 2] | 0) + (i4 << 2) >> 2] | 0) == (i23 | 0) : 0) break;
    i10 = i10 + 1 | 0;
    i4 = i10 + i4 & i9;
    if ((i4 | 0) == (i8 | 0)) {
     i15 = 19;
     break L16;
    }
   }
   i4 = (3 << i3 & i2 | 0) == 0 ? i4 : i5;
   i15 = 18;
  } while (0);
  if ((i15 | 0) == 18) if ((i4 | 0) == (i5 | 0)) i15 = 19; else i5 = i4;
  do if ((i15 | 0) == 19) if (!(_par_token_to_string(i23) | 0)) {
   _puts(4556) | 0;
   break;
  } else {
   i15 = _par_token_to_string(i23) | 0;
   HEAP32[i14 >> 2] = 4556;
   HEAP32[i14 + 4 >> 2] = i15;
   _printf(4300, i14) | 0;
   break;
  } while (0);
  i2 = HEAP32[198] | 0;
  if ((i5 | 0) == (HEAP32[i2 >> 2] | 0)) ___assert_fail(4567, 4234, 176, 4608);
  HEAP32[i22 >> 2] = HEAP32[(HEAP32[i2 + 24 >> 2] | 0) + (i5 << 2) >> 2];
  i5 = HEAP32[199] | 0;
  i1 = HEAP32[i5 >> 2] | 0;
  L36 : do if (!i1) {
   i3 = 0;
   i15 = 31;
  } else {
   i8 = i1 + -1 | 0;
   i9 = i8 & i23;
   i10 = HEAP32[i5 + 16 >> 2] | 0;
   i2 = i5 + 20 | 0;
   i5 = i9;
   i7 = 0;
   while (1) {
    i3 = HEAP32[i10 + (i5 >>> 4 << 2) >> 2] | 0;
    i4 = i5 << 1 & 30;
    i6 = i3 >>> i4;
    if (i6 & 2) break;
    if ((i6 & 1 | 0) == 0 ? (HEAP32[(HEAP32[i2 >> 2] | 0) + (i5 << 2) >> 2] | 0) == (i23 | 0) : 0) break;
    i7 = i7 + 1 | 0;
    i5 = i7 + i5 & i8;
    if ((i5 | 0) == (i9 | 0)) {
     i15 = 32;
     break L36;
    }
   }
   i3 = (3 << i4 & i3 | 0) == 0 ? i5 : i1;
   i15 = 31;
  } while (0);
  if ((i15 | 0) == 31) if ((i3 | 0) == (i1 | 0)) i15 = 32; else i1 = i3;
  do if ((i15 | 0) == 32) if (!(_par_token_to_string(i23) | 0)) {
   _puts(4624) | 0;
   break;
  } else {
   i14 = _par_token_to_string(i23) | 0;
   HEAP32[i13 >> 2] = 4624;
   HEAP32[i13 + 4 >> 2] = i14;
   _printf(4300, i13) | 0;
   break;
  } while (0);
  i2 = HEAP32[199] | 0;
  if ((i1 | 0) == (HEAP32[i2 >> 2] | 0)) ___assert_fail(4635, 4234, 182, 4608);
  HEAP32[i19 >> 2] = HEAP32[(HEAP32[i2 + 24 >> 2] | 0) + (i1 << 2) >> 2];
  HEAP32[i18 >> 2] = 0;
  i3 = _glCreateShader(35633) | 0;
  _glShaderSource(i3 | 0, 1, i22 | 0, 0);
  _glCompileShader(i3 | 0);
  _glGetShaderiv(i3 | 0, 35713, i18 | 0);
  _glGetShaderInfoLog(i3 | 0, 1024, 0, i21 | 0);
  if ((HEAP32[i18 >> 2] | 0) == 0 ? (i14 = _par_token_to_string(i23) | 0, HEAP32[i12 >> 2] = i14, HEAP32[i12 + 4 >> 2] = i21, _printf(4300, i12) | 0, (HEAP32[i18 >> 2] | 0) == 0) : 0) ___assert_fail(4676, 4234, 194, 4608);
  i2 = _glCreateShader(35632) | 0;
  _glShaderSource(i2 | 0, 1, i19 | 0, 0);
  _glCompileShader(i2 | 0);
  _glGetShaderiv(i2 | 0, 35713, i18 | 0);
  _glGetShaderInfoLog(i2 | 0, 1024, 0, i21 | 0);
  if ((HEAP32[i18 >> 2] | 0) == 0 ? (i14 = _par_token_to_string(i23) | 0, HEAP32[i16 >> 2] = i14, HEAP32[i16 + 4 >> 2] = i21, _printf(4300, i16) | 0, (HEAP32[i18 >> 2] | 0) == 0) : 0) ___assert_fail(4676, 4234, 201, 4608);
  i1 = _glCreateProgram() | 0;
  _glAttachShader(i1 | 0, i3 | 0);
  _glAttachShader(i1 | 0, i2 | 0);
  i2 = HEAP32[200] | 0;
  if (HEAP32[i2 >> 2] | 0) {
   i3 = 0;
   do {
    if (!(3 << (i3 << 1 & 30) & HEAP32[(HEAP32[i2 + 16 >> 2] | 0) + (i3 >>> 4 << 2) >> 2])) {
     i16 = HEAP32[(HEAP32[i2 + 24 >> 2] | 0) + (i3 << 2) >> 2] | 0;
     _glBindAttribLocation(i1 | 0, i16 | 0, _par_token_to_string(HEAP32[(HEAP32[i2 + 20 >> 2] | 0) + (i3 << 2) >> 2] | 0) | 0);
     i2 = HEAP32[200] | 0;
    }
    i3 = i3 + 1 | 0;
   } while ((i3 | 0) != (HEAP32[i2 >> 2] | 0));
  }
  _glLinkProgram(i1 | 0);
  _glGetProgramiv(i1 | 0, 35714, i20 | 0);
  _glGetProgramInfoLog(i1 | 0, 1024, 0, i21 | 0);
  if ((HEAP32[i20 >> 2] | 0) == 0 ? (i16 = _par_token_to_string(i23) | 0, HEAP32[i17 >> 2] = i16, HEAP32[i17 + 4 >> 2] = i21, _printf(4300, i17) | 0, (HEAP32[i20 >> 2] | 0) == 0) : 0) ___assert_fail(4692, 4234, 222, 4608);
  i13 = HEAP32[203] | 0;
  i14 = i13 + 8 | 0;
  do if ((HEAP32[i14 >> 2] | 0) >>> 0 >= (HEAP32[i13 + 12 >> 2] | 0) >>> 0) {
   i2 = HEAP32[i13 >> 2] | 0;
   if (i2 >>> 0 > HEAP32[i13 + 4 >> 2] << 1 >>> 0) {
    if ((_kh_resize_glmap(i13, i2 + -1 | 0) | 0) >= 0) {
     i15 = 56;
     break;
    }
    i2 = HEAP32[i13 >> 2] | 0;
    break;
   } else {
    if ((_kh_resize_glmap(i13, i2 + 1 | 0) | 0) >= 0) {
     i15 = 56;
     break;
    }
    i2 = HEAP32[i13 >> 2] | 0;
    break;
   }
  } else i15 = 56; while (0);
  do if ((i15 | 0) == 56) {
   i3 = HEAP32[i13 >> 2] | 0;
   i10 = i3 + -1 | 0;
   i5 = i10 & i23;
   i12 = HEAP32[i13 + 16 >> 2] | 0;
   do if (!(2 << (i5 << 1 & 30) & HEAP32[i12 + (i5 >>> 4 << 2) >> 2])) {
    i9 = i13 + 20 | 0;
    i8 = i5;
    i2 = i3;
    i11 = 0;
    while (1) {
     i7 = HEAP32[i12 + (i8 >>> 4 << 2) >> 2] | 0;
     i6 = i8 << 1 & 30;
     i4 = i7 >>> i6;
     if (i4 & 2) {
      i5 = i8;
      break;
     }
     if ((i4 & 1 | 0) == 0 ? (HEAP32[(HEAP32[i9 >> 2] | 0) + (i8 << 2) >> 2] | 0) == (i23 | 0) : 0) {
      i5 = i8;
      break;
     }
     i2 = (i7 & 1 << i6 | 0) == 0 ? i2 : i8;
     i11 = i11 + 1 | 0;
     i8 = i11 + i8 & i10;
     if ((i8 | 0) == (i5 | 0)) {
      i15 = 62;
      break;
     }
    }
    if ((i15 | 0) == 62) if ((i2 | 0) == (i3 | 0)) i2 = i3; else break;
    i2 = ((i2 | 0) == (i3 | 0) ? 1 : (2 << (i5 << 1 & 30) & HEAP32[i12 + (i5 >>> 4 << 2) >> 2] | 0) == 0) ? i5 : i2;
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
  HEAP32[(HEAP32[(HEAP32[203] | 0) + 24 >> 2] | 0) + (i2 << 2) >> 2] = i1;
  _glGetProgramiv(i1 | 0, 35718, i22 | 0);
  i17 = HEAP32[i22 >> 2] | 0;
  i2 = i17 + -1 | 0;
  HEAP32[i22 >> 2] = i2;
  if (i17) do {
   _glGetActiveUniform(i1 | 0, i2 | 0, 128, 0, i21 | 0, i18 | 0, i19 | 0);
   i16 = _glGetUniformLocation(i1 | 0, i19 | 0) | 0;
   i17 = (_par_token_from_string(i19) | 0) ^ i23;
   i17 = _kh_put_imap(HEAP32[201] | 0, i17, i20) | 0;
   HEAP32[(HEAP32[(HEAP32[201] | 0) + 24 >> 2] | 0) + (i17 << 2) >> 2] = i16;
   i17 = HEAP32[i22 >> 2] | 0;
   i2 = i17 + -1 | 0;
   HEAP32[i22 >> 2] = i2;
  } while ((i17 | 0) != 0);
 } else i1 = HEAP32[(HEAP32[i2 + 24 >> 2] | 0) + (i5 << 2) >> 2] | 0;
 if (i1) {
  _glUseProgram(i1 | 0);
  HEAP32[202] = i23;
  STACKTOP = i25;
  return;
 }
 if (!(_par_token_to_string(i23) | 0)) {
  _puts(4705) | 0;
  ___assert_fail(4716, 4234, 280, 4724);
 } else {
  i25 = _par_token_to_string(i23) | 0;
  HEAP32[i24 >> 2] = 4705;
  HEAP32[i24 + 4 >> 2] = i25;
  _printf(4300, i24) | 0;
  ___assert_fail(4716, 4234, 280, 4724);
 }
}

function _strstr(i1, i17) {
 i1 = i1 | 0;
 i17 = i17 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i18 = 0, i19 = 0;
 i19 = STACKTOP;
 STACKTOP = STACKTOP + 1056 | 0;
 i16 = i19 + 1024 | 0;
 i18 = i19;
 i4 = HEAP8[i17 >> 0] | 0;
 do if (i4 << 24 >> 24) {
  i15 = _strchr(i1, i4 << 24 >> 24) | 0;
  if (i15) {
   i5 = HEAP8[i17 + 1 >> 0] | 0;
   if (i5 << 24 >> 24) {
    i2 = i15 + 1 | 0;
    i9 = HEAP8[i2 >> 0] | 0;
    if (i9 << 24 >> 24) {
     i7 = HEAP8[i17 + 2 >> 0] | 0;
     if (!(i7 << 24 >> 24)) {
      i6 = i5 & 255 | (i4 & 255) << 8;
      i1 = i9;
      i5 = i15;
      i3 = HEAPU8[i15 >> 0] << 8 | i9 & 255;
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
      i1 = i1 << 24 >> 24 != 0 ? i2 : 0;
      break;
     }
     i2 = i15 + 2 | 0;
     i8 = HEAP8[i2 >> 0] | 0;
     if (i8 << 24 >> 24) {
      i6 = HEAP8[i17 + 3 >> 0] | 0;
      if (!(i6 << 24 >> 24)) {
       i5 = (i5 & 255) << 16 | (i4 & 255) << 24 | (i7 & 255) << 8;
       i1 = (i8 & 255) << 8 | (i9 & 255) << 16 | HEAPU8[i15 >> 0] << 24;
       if ((i1 | 0) == (i5 | 0)) i1 = i8; else {
        i3 = i1;
        do {
         i2 = i2 + 1 | 0;
         i1 = HEAP8[i2 >> 0] | 0;
         i3 = (i1 & 255 | i3) << 8;
        } while (!(i1 << 24 >> 24 == 0 | (i3 | 0) == (i5 | 0)));
       }
       i1 = i1 << 24 >> 24 != 0 ? i2 + -2 | 0 : 0;
       break;
      }
      i2 = i15 + 3 | 0;
      i1 = HEAP8[i2 >> 0] | 0;
      if (i1 << 24 >> 24) {
       if (!(HEAP8[i17 + 4 >> 0] | 0)) {
        i6 = (i5 & 255) << 16 | (i4 & 255) << 24 | (i7 & 255) << 8 | i6 & 255;
        i3 = (i8 & 255) << 8 | (i9 & 255) << 16 | i1 & 255 | HEAPU8[i15 >> 0] << 24;
        if ((i3 | 0) != (i6 | 0)) do {
         i2 = i2 + 1 | 0;
         i1 = HEAP8[i2 >> 0] | 0;
         i3 = i1 & 255 | i3 << 8;
        } while (!(i1 << 24 >> 24 == 0 | (i3 | 0) == (i6 | 0)));
        i1 = i1 << 24 >> 24 != 0 ? i2 + -3 | 0 : 0;
        break;
       };
       HEAP32[i16 >> 2] = 0;
       HEAP32[i16 + 4 >> 2] = 0;
       HEAP32[i16 + 8 >> 2] = 0;
       HEAP32[i16 + 12 >> 2] = 0;
       HEAP32[i16 + 16 >> 2] = 0;
       HEAP32[i16 + 20 >> 2] = 0;
       HEAP32[i16 + 24 >> 2] = 0;
       HEAP32[i16 + 28 >> 2] = 0;
       i5 = 0;
       while (1) {
        if (!(HEAP8[i15 + i5 >> 0] | 0)) {
         i1 = 0;
         break;
        }
        i3 = i16 + (((i4 & 255) >>> 5 & 255) << 2) | 0;
        HEAP32[i3 >> 2] = HEAP32[i3 >> 2] | 1 << (i4 & 31);
        i3 = i5 + 1 | 0;
        HEAP32[i18 + ((i4 & 255) << 2) >> 2] = i3;
        i4 = HEAP8[i17 + i3 >> 0] | 0;
        if (!(i4 << 24 >> 24)) {
         i14 = i5;
         i10 = 23;
         break;
        } else i5 = i3;
       }
       L32 : do if ((i10 | 0) == 23) {
        L34 : do if (i3 >>> 0 > 1) {
         i4 = 1;
         i10 = -1;
         i5 = 0;
         L35 : while (1) {
          i8 = 1;
          while (1) {
           L39 : while (1) {
            i2 = 1;
            while (1) {
             i1 = HEAP8[i17 + (i2 + i10) >> 0] | 0;
             i6 = HEAP8[i17 + i4 >> 0] | 0;
             if (i1 << 24 >> 24 != i6 << 24 >> 24) {
              i7 = i4;
              i4 = i1;
              break L39;
             }
             if ((i2 | 0) == (i8 | 0)) break;
             i2 = i2 + 1 | 0;
             i4 = i2 + i5 | 0;
             if (i4 >>> 0 >= i3 >>> 0) {
              i5 = i10;
              i13 = i8;
              break L35;
             }
            }
            i5 = i5 + i8 | 0;
            i4 = i5 + 1 | 0;
            if (i4 >>> 0 >= i3 >>> 0) {
             i5 = i10;
             i13 = i8;
             break L35;
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
            i13 = i8;
            break L35;
           }
          }
          i4 = i5 + 2 | 0;
          if (i4 >>> 0 >= i3 >>> 0) {
           i13 = 1;
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
           L54 : while (1) {
            i1 = 1;
            while (1) {
             i8 = HEAP8[i17 + (i1 + i2) >> 0] | 0;
             i7 = HEAP8[i17 + i6 >> 0] | 0;
             if (i8 << 24 >> 24 != i7 << 24 >> 24) {
              i1 = i6;
              i6 = i9;
              break L54;
             }
             if ((i1 | 0) == (i4 | 0)) break;
             i1 = i1 + 1 | 0;
             i6 = i1 + i9 | 0;
             if (i6 >>> 0 >= i3 >>> 0) {
              i6 = i13;
              break L34;
             }
            }
            i9 = i9 + i4 | 0;
            i6 = i9 + 1 | 0;
            if (i6 >>> 0 >= i3 >>> 0) {
             i6 = i13;
             break L34;
            }
           }
           i4 = i1 - i2 | 0;
           if ((i8 & 255) >= (i7 & 255)) {
            i4 = i6;
            break;
           }
           i6 = i1 + 1 | 0;
           if (i6 >>> 0 >= i3 >>> 0) {
            i6 = i13;
            break L34;
           }
          }
          i6 = i4 + 2 | 0;
          if (i6 >>> 0 >= i3 >>> 0) {
           i2 = i4;
           i6 = i13;
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
        i12 = (i2 + 1 | 0) >>> 0 > (i5 + 1 | 0) >>> 0;
        i6 = i12 ? i4 : i6;
        i12 = i12 ? i2 : i5;
        i11 = i12 + 1 | 0;
        if (!(_memcmp(i17, i17 + i6 | 0, i11) | 0)) i13 = i3 - i6 | 0; else {
         i6 = i3 - i12 + -1 | 0;
         i13 = 0;
         i6 = (i12 >>> 0 > i6 >>> 0 ? i12 : i6) + 1 | 0;
        }
        i9 = i3 | 63;
        i4 = (i13 | 0) != 0;
        i2 = i3 - i6 | 0;
        i1 = i15;
        i10 = 0;
        i5 = i15;
        L69 : while (1) {
         i8 = i1;
         do if ((i5 - i8 | 0) >>> 0 < i3 >>> 0) {
          i7 = _memchr(i5, 0, i9) | 0;
          if (i7) if ((i7 - i8 | 0) >>> 0 < i3 >>> 0) {
           i1 = 0;
           break L32;
          } else {
           i5 = i7;
           break;
          } else {
           i5 = i5 + i9 | 0;
           break;
          }
         } while (0);
         i8 = HEAP8[i1 + i14 >> 0] | 0;
         if (!(1 << (i8 & 31) & HEAP32[i16 + (((i8 & 255) >>> 5 & 255) << 2) >> 2])) {
          i1 = i1 + i3 | 0;
          i10 = 0;
          continue;
         }
         i15 = HEAP32[i18 + ((i8 & 255) << 2) >> 2] | 0;
         i8 = i3 - i15 | 0;
         if ((i3 | 0) != (i15 | 0)) {
          i1 = i1 + (i4 & (i10 | 0) != 0 & i8 >>> 0 < i6 >>> 0 ? i2 : i8) | 0;
          i10 = 0;
          continue;
         }
         i7 = i11 >>> 0 > i10 >>> 0 ? i11 : i10;
         i8 = HEAP8[i17 + i7 >> 0] | 0;
         L83 : do if (!(i8 << 24 >> 24)) i8 = i11; else {
          while (1) {
           if (i8 << 24 >> 24 != (HEAP8[i1 + i7 >> 0] | 0)) break;
           i7 = i7 + 1 | 0;
           i8 = HEAP8[i17 + i7 >> 0] | 0;
           if (!(i8 << 24 >> 24)) {
            i8 = i11;
            break L83;
           }
          }
          i1 = i1 + (i7 - i12) | 0;
          i10 = 0;
          continue L69;
         } while (0);
         do {
          if (i8 >>> 0 <= i10 >>> 0) break L32;
          i8 = i8 + -1 | 0;
         } while ((HEAP8[i17 + i8 >> 0] | 0) == (HEAP8[i1 + i8 >> 0] | 0));
         i1 = i1 + i6 | 0;
         i10 = i13;
        }
       } while (0);
      } else i1 = 0;
     } else i1 = 0;
    } else i1 = 0;
   } else i1 = i15;
  } else i1 = 0;
 } while (0);
 STACKTOP = i19;
 return i1 | 0;
}

function _getPixelColorsRGBA8(i1, i15, i2, i14, i7) {
 i1 = i1 | 0;
 i15 = i15 | 0;
 i2 = i2 | 0;
 i14 = i14 | 0;
 i7 = i7 | 0;
 var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0;
 i12 = (i2 | 0) != 0;
 i13 = i12 ? 4 : 3;
 switch (HEAP32[i7 >> 2] | 0) {
 case 0:
  {
   i11 = i7 + 4 | 0;
   i6 = HEAP32[i11 >> 2] | 0;
   switch (i6 | 0) {
   case 8:
    {
     if (!i15) return;
     i5 = i7 + 16 | 0;
     i4 = i7 + 20 | 0;
     i2 = 0;
     while (1) {
      i3 = i14 + i2 | 0;
      i11 = HEAP8[i3 >> 0] | 0;
      HEAP8[i1 + 2 >> 0] = i11;
      HEAP8[i1 + 1 >> 0] = i11;
      HEAP8[i1 >> 0] = i11;
      if (i12) {
       if (!(HEAP32[i5 >> 2] | 0)) i3 = 0; else i3 = (HEAPU8[i3 >> 0] | 0 | 0) == (HEAP32[i4 >> 2] | 0);
       HEAP8[i1 + 3 >> 0] = (i3 ^ 1) << 31 >> 31;
      }
      i2 = i2 + 1 | 0;
      if ((i2 | 0) == (i15 | 0)) break; else i1 = i1 + i13 | 0;
     }
     return;
    }
   case 16:
    {
     if (!i15) return;
     i6 = i7 + 16 | 0;
     i5 = i7 + 20 | 0;
     i4 = 0;
     while (1) {
      i3 = i4 << 1;
      i2 = i14 + i3 | 0;
      i11 = HEAP8[i2 >> 0] | 0;
      HEAP8[i1 + 2 >> 0] = i11;
      HEAP8[i1 + 1 >> 0] = i11;
      HEAP8[i1 >> 0] = i11;
      if (i12) {
       if (!(HEAP32[i6 >> 2] | 0)) i3 = 0; else i3 = ((HEAPU8[i2 >> 0] | 0) << 8 | (HEAPU8[i14 + (i3 | 1) >> 0] | 0) | 0) == (HEAP32[i5 >> 2] | 0);
       HEAP8[i1 + 3 >> 0] = (i3 ^ 1) << 31 >> 31;
      }
      i4 = i4 + 1 | 0;
      if ((i4 | 0) == (i15 | 0)) break; else i1 = i1 + i13 | 0;
     }
     return;
    }
   default:
    {
     i3 = (1 << i6) + -1 | 0;
     if (!i15) return;
     i2 = i7 + 16 | 0;
     i8 = i7 + 20 | 0;
     i4 = 0;
     i9 = 0;
     while (1) {
      if (!i6) i5 = 0; else {
       i7 = i4;
       i10 = i6 + -1 | 0;
       i5 = 0;
       while (1) {
        i4 = i7 + 1 | 0;
        i5 = (((HEAPU8[i14 + (i7 >>> 3) >> 0] | 0) >>> (i7 & 7 ^ 7) & 1) << i10) + i5 | 0;
        i10 = i10 + -1 | 0;
        if (i10 >>> 0 >= i6 >>> 0) break; else i7 = i4;
       }
      }
      i10 = (((i5 * 255 | 0) >>> 0) / (i3 >>> 0) | 0) & 255;
      HEAP8[i1 + 2 >> 0] = i10;
      HEAP8[i1 + 1 >> 0] = i10;
      HEAP8[i1 >> 0] = i10;
      if (i12) {
       if (!(HEAP32[i2 >> 2] | 0)) i5 = 0; else i5 = (i5 | 0) == (HEAP32[i8 >> 2] | 0);
       HEAP8[i1 + 3 >> 0] = (i5 ^ 1) << 31 >> 31;
      }
      i5 = i9 + 1 | 0;
      if ((i5 | 0) == (i15 | 0)) break;
      i1 = i1 + i13 | 0;
      i6 = HEAP32[i11 >> 2] | 0;
      i9 = i5;
     }
     return;
    }
   }
  }
 case 2:
  {
   i2 = (i15 | 0) == 0;
   if ((HEAP32[i7 + 4 >> 2] | 0) == 8) {
    if (i2) return;
    i8 = i7 + 16 | 0;
    i9 = i7 + 20 | 0;
    i10 = i7 + 24 | 0;
    i7 = i7 + 28 | 0;
    i2 = 0;
    while (1) {
     i4 = i2 * 3 | 0;
     i6 = HEAP8[i14 + i4 >> 0] | 0;
     HEAP8[i1 >> 0] = i6;
     i5 = HEAP8[i14 + (i4 + 1) >> 0] | 0;
     HEAP8[i1 + 1 >> 0] = i5;
     i4 = HEAP8[i14 + (i4 + 2) >> 0] | 0;
     HEAP8[i1 + 2 >> 0] = i4;
     if (i12) {
      if (((HEAP32[i8 >> 2] | 0) != 0 ? (i6 & 255 | 0) == (HEAP32[i9 >> 2] | 0) : 0) ? (i5 & 255 | 0) == (HEAP32[i10 >> 2] | 0) : 0) i3 = (i4 & 255 | 0) == (HEAP32[i7 >> 2] | 0); else i3 = 0;
      HEAP8[i1 + 3 >> 0] = (i3 ^ 1) << 31 >> 31;
     }
     i2 = i2 + 1 | 0;
     if ((i2 | 0) == (i15 | 0)) break; else i1 = i1 + i13 | 0;
    }
    return;
   } else {
    if (i2) return;
    i10 = i7 + 16 | 0;
    i9 = i7 + 20 | 0;
    i8 = i7 + 24 | 0;
    i2 = i7 + 28 | 0;
    i7 = 0;
    while (1) {
     i6 = i7 * 6 | 0;
     i5 = i14 + i6 | 0;
     HEAP8[i1 >> 0] = HEAP8[i5 >> 0] | 0;
     i4 = i14 + (i6 + 2) | 0;
     HEAP8[i1 + 1 >> 0] = HEAP8[i4 >> 0] | 0;
     i3 = i14 + (i6 + 4) | 0;
     HEAP8[i1 + 2 >> 0] = HEAP8[i3 >> 0] | 0;
     if (i12) {
      if (((HEAP32[i10 >> 2] | 0) != 0 ? ((HEAPU8[i5 >> 0] | 0) << 8 | (HEAPU8[i14 + (i6 | 1) >> 0] | 0) | 0) == (HEAP32[i9 >> 2] | 0) : 0) ? ((HEAPU8[i4 >> 0] | 0) << 8 | (HEAPU8[i14 + (i6 + 3) >> 0] | 0) | 0) == (HEAP32[i8 >> 2] | 0) : 0) i4 = ((HEAPU8[i3 >> 0] | 0) << 8 | (HEAPU8[i14 + (i6 + 5) >> 0] | 0) | 0) == (HEAP32[i2 >> 2] | 0); else i4 = 0;
      HEAP8[i1 + 3 >> 0] = (i4 ^ 1) << 31 >> 31;
     }
     i7 = i7 + 1 | 0;
     if ((i7 | 0) == (i15 | 0)) break; else i1 = i1 + i13 | 0;
    }
    return;
   }
  }
 case 3:
  {
   if (!i15) return;
   i8 = i7 + 4 | 0;
   i2 = i7 + 12 | 0;
   i9 = i7 + 8 | 0;
   i4 = 0;
   i10 = 0;
   while (1) {
    i3 = HEAP32[i8 >> 2] | 0;
    switch (i3 | 0) {
    case 8:
     {
      i6 = i4;
      i4 = HEAPU8[i14 + i10 >> 0] | 0;
      break;
     }
    case 0:
     {
      i6 = i4;
      i4 = 0;
      break;
     }
    default:
     {
      i7 = i3 + -1 | 0;
      i5 = 0;
      while (1) {
       i6 = i4 + 1 | 0;
       i5 = (((HEAPU8[i14 + (i4 >>> 3) >> 0] | 0) >>> (i4 & 7 ^ 7) & 1) << i7) + i5 | 0;
       i7 = i7 + -1 | 0;
       if (i7 >>> 0 >= i3 >>> 0) {
        i4 = i5;
        break;
       } else i4 = i6;
      }
     }
    }
    if (i4 >>> 0 < (HEAP32[i2 >> 2] | 0) >>> 0) {
     i4 = i4 << 2;
     HEAP8[i1 >> 0] = HEAP8[(HEAP32[i9 >> 2] | 0) + i4 >> 0] | 0;
     HEAP8[i1 + 1 >> 0] = HEAP8[(HEAP32[i9 >> 2] | 0) + (i4 | 1) >> 0] | 0;
     HEAP8[i1 + 2 >> 0] = HEAP8[(HEAP32[i9 >> 2] | 0) + (i4 | 2) >> 0] | 0;
     if (i12) HEAP8[i1 + 3 >> 0] = HEAP8[(HEAP32[i9 >> 2] | 0) + (i4 | 3) >> 0] | 0;
    } else {
     HEAP8[i1 + 2 >> 0] = 0;
     HEAP8[i1 + 1 >> 0] = 0;
     HEAP8[i1 >> 0] = 0;
     if (i12) HEAP8[i1 + 3 >> 0] = -1;
    }
    i10 = i10 + 1 | 0;
    if ((i10 | 0) == (i15 | 0)) break; else {
     i1 = i1 + i13 | 0;
     i4 = i6;
    }
   }
   return;
  }
 case 4:
  {
   i2 = (i15 | 0) == 0;
   if ((HEAP32[i7 + 4 >> 2] | 0) != 8) {
    if (i2) return; else i3 = 0;
    while (1) {
     i2 = i3 << 2;
     i11 = HEAP8[i14 + i2 >> 0] | 0;
     HEAP8[i1 + 2 >> 0] = i11;
     HEAP8[i1 + 1 >> 0] = i11;
     HEAP8[i1 >> 0] = i11;
     if (i12) HEAP8[i1 + 3 >> 0] = HEAP8[i14 + (i2 | 2) >> 0] | 0;
     i3 = i3 + 1 | 0;
     if ((i3 | 0) == (i15 | 0)) break; else i1 = i1 + i13 | 0;
    }
    return;
   }
   if (i2) return;
   if (i12) {
    i2 = 0;
    while (1) {
     i12 = i2 << 1;
     i11 = HEAP8[i14 + i12 >> 0] | 0;
     HEAP8[i1 + 2 >> 0] = i11;
     HEAP8[i1 + 1 >> 0] = i11;
     HEAP8[i1 >> 0] = i11;
     HEAP8[i1 + 3 >> 0] = HEAP8[i14 + (i12 | 1) >> 0] | 0;
     i2 = i2 + 1 | 0;
     if ((i2 | 0) == (i15 | 0)) break; else i1 = i1 + i13 | 0;
    }
    return;
   } else {
    i2 = 0;
    while (1) {
     i12 = HEAP8[i14 + (i2 << 1) >> 0] | 0;
     HEAP8[i1 + 2 >> 0] = i12;
     HEAP8[i1 + 1 >> 0] = i12;
     HEAP8[i1 >> 0] = i12;
     i2 = i2 + 1 | 0;
     if ((i2 | 0) == (i15 | 0)) break; else i1 = i1 + i13 | 0;
    }
    return;
   }
  }
 case 6:
  {
   i2 = (i15 | 0) == 0;
   if ((HEAP32[i7 + 4 >> 2] | 0) == 8) {
    if (i2) return; else i3 = 0;
    while (1) {
     i2 = i3 << 2;
     HEAP8[i1 >> 0] = HEAP8[i14 + i2 >> 0] | 0;
     HEAP8[i1 + 1 >> 0] = HEAP8[i14 + (i2 | 1) >> 0] | 0;
     HEAP8[i1 + 2 >> 0] = HEAP8[i14 + (i2 | 2) >> 0] | 0;
     if (i12) HEAP8[i1 + 3 >> 0] = HEAP8[i14 + (i2 | 3) >> 0] | 0;
     i3 = i3 + 1 | 0;
     if ((i3 | 0) == (i15 | 0)) break; else i1 = i1 + i13 | 0;
    }
    return;
   } else {
    if (i2) return; else i3 = 0;
    while (1) {
     i2 = i3 << 3;
     HEAP8[i1 >> 0] = HEAP8[i14 + i2 >> 0] | 0;
     HEAP8[i1 + 1 >> 0] = HEAP8[i14 + (i2 | 2) >> 0] | 0;
     HEAP8[i1 + 2 >> 0] = HEAP8[i14 + (i2 | 4) >> 0] | 0;
     if (i12) HEAP8[i1 + 3 >> 0] = HEAP8[i14 + (i2 | 6) >> 0] | 0;
     i3 = i3 + 1 | 0;
     if ((i3 | 0) == (i15 | 0)) break; else i1 = i1 + i13 | 0;
    }
    return;
   }
  }
 default:
  return;
 }
}

function _try_realloc_chunk(i1, i17) {
 i1 = i1 | 0;
 i17 = i17 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0;
 i15 = i1 + 4 | 0;
 i16 = HEAP32[i15 >> 2] | 0;
 i10 = i16 & -8;
 i11 = i1 + i10 | 0;
 i9 = HEAP32[752] | 0;
 i5 = i16 & 3;
 if ((i5 | 0) != 1 & i1 >>> 0 >= i9 >>> 0 & i1 >>> 0 < i11 >>> 0 ? (i4 = i1 + (i10 | 4) | 0, i3 = HEAP32[i4 >> 2] | 0, (i3 & 1 | 0) != 0) : 0) {
  do if (!i5) if (i17 >>> 0 < 256) i1 = 0; else {
   if (i10 >>> 0 >= (i17 + 4 | 0) >>> 0 ? (i10 - i17 | 0) >>> 0 <= HEAP32[868] << 1 >>> 0 : 0) break;
   i1 = 0;
  } else {
   if (i10 >>> 0 >= i17 >>> 0) {
    i3 = i10 - i17 | 0;
    if (i3 >>> 0 <= 15) break;
    HEAP32[i15 >> 2] = i16 & 1 | i17 | 2;
    HEAP32[i1 + (i17 + 4) >> 2] = i3 | 3;
    HEAP32[i4 >> 2] = HEAP32[i4 >> 2] | 1;
    _dispose_chunk(i1 + i17 | 0, i3);
    break;
   }
   if ((i11 | 0) == (HEAP32[754] | 0)) {
    i3 = (HEAP32[751] | 0) + i10 | 0;
    if (i3 >>> 0 <= i17 >>> 0) {
     i1 = 0;
     break;
    }
    i14 = i3 - i17 | 0;
    HEAP32[i15 >> 2] = i16 & 1 | i17 | 2;
    HEAP32[i1 + (i17 + 4) >> 2] = i14 | 1;
    HEAP32[754] = i1 + i17;
    HEAP32[751] = i14;
    break;
   }
   if ((i11 | 0) == (HEAP32[753] | 0)) {
    i3 = (HEAP32[750] | 0) + i10 | 0;
    if (i3 >>> 0 < i17 >>> 0) {
     i1 = 0;
     break;
    }
    i2 = i3 - i17 | 0;
    if (i2 >>> 0 > 15) {
     HEAP32[i15 >> 2] = i16 & 1 | i17 | 2;
     HEAP32[i1 + (i17 + 4) >> 2] = i2 | 1;
     HEAP32[i1 + i3 >> 2] = i2;
     i3 = i1 + (i3 + 4) | 0;
     HEAP32[i3 >> 2] = HEAP32[i3 >> 2] & -2;
     i3 = i1 + i17 | 0;
    } else {
     HEAP32[i15 >> 2] = i16 & 1 | i3 | 2;
     i3 = i1 + (i3 + 4) | 0;
     HEAP32[i3 >> 2] = HEAP32[i3 >> 2] | 1;
     i3 = 0;
     i2 = 0;
    }
    HEAP32[750] = i2;
    HEAP32[753] = i3;
    break;
   }
   if ((i3 & 2 | 0) == 0 ? (i14 = (i3 & -8) + i10 | 0, i14 >>> 0 >= i17 >>> 0) : 0) {
    i13 = i14 - i17 | 0;
    i4 = i3 >>> 3;
    do if (i3 >>> 0 >= 256) {
     i8 = HEAP32[i1 + (i10 + 24) >> 2] | 0;
     i5 = HEAP32[i1 + (i10 + 12) >> 2] | 0;
     do if ((i5 | 0) == (i11 | 0)) {
      i2 = i1 + (i10 + 20) | 0;
      i3 = HEAP32[i2 >> 2] | 0;
      if (!i3) {
       i2 = i1 + (i10 + 16) | 0;
       i3 = HEAP32[i2 >> 2] | 0;
       if (!i3) {
        i12 = 0;
        break;
       }
      }
      while (1) {
       i4 = i3 + 20 | 0;
       i5 = HEAP32[i4 >> 2] | 0;
       if (i5) {
        i3 = i5;
        i2 = i4;
        continue;
       }
       i5 = i3 + 16 | 0;
       i4 = HEAP32[i5 >> 2] | 0;
       if (!i4) break; else {
        i3 = i4;
        i2 = i5;
       }
      }
      if (i2 >>> 0 < i9 >>> 0) _abort(); else {
       HEAP32[i2 >> 2] = 0;
       i12 = i3;
       break;
      }
     } else {
      i3 = HEAP32[i1 + (i10 + 8) >> 2] | 0;
      if ((i3 >>> 0 >= i9 >>> 0 ? (i2 = i3 + 12 | 0, (HEAP32[i2 >> 2] | 0) == (i11 | 0)) : 0) ? (i7 = i5 + 8 | 0, (HEAP32[i7 >> 2] | 0) == (i11 | 0)) : 0) {
       HEAP32[i2 >> 2] = i5;
       HEAP32[i7 >> 2] = i3;
       i12 = i5;
       break;
      }
      _abort();
     } while (0);
     if (i8) {
      i3 = HEAP32[i1 + (i10 + 28) >> 2] | 0;
      i2 = 3296 + (i3 << 2) | 0;
      if ((i11 | 0) == (HEAP32[i2 >> 2] | 0)) {
       HEAP32[i2 >> 2] = i12;
       if (!i12) {
        HEAP32[749] = HEAP32[749] & ~(1 << i3);
        break;
       }
      } else {
       if (i8 >>> 0 < (HEAP32[752] | 0) >>> 0) _abort();
       i3 = i8 + 16 | 0;
       if ((HEAP32[i3 >> 2] | 0) == (i11 | 0)) HEAP32[i3 >> 2] = i12; else HEAP32[i8 + 20 >> 2] = i12;
       if (!i12) break;
      }
      i2 = HEAP32[752] | 0;
      if (i12 >>> 0 < i2 >>> 0) _abort();
      HEAP32[i12 + 24 >> 2] = i8;
      i3 = HEAP32[i1 + (i10 + 16) >> 2] | 0;
      do if (i3) if (i3 >>> 0 < i2 >>> 0) _abort(); else {
       HEAP32[i12 + 16 >> 2] = i3;
       HEAP32[i3 + 24 >> 2] = i12;
       break;
      } while (0);
      i3 = HEAP32[i1 + (i10 + 20) >> 2] | 0;
      if (i3) if (i3 >>> 0 < (HEAP32[752] | 0) >>> 0) _abort(); else {
       HEAP32[i12 + 20 >> 2] = i3;
       HEAP32[i3 + 24 >> 2] = i12;
       break;
      }
     }
    } else {
     i5 = HEAP32[i1 + (i10 + 8) >> 2] | 0;
     i3 = HEAP32[i1 + (i10 + 12) >> 2] | 0;
     i2 = 3032 + (i4 << 1 << 2) | 0;
     do if ((i5 | 0) != (i2 | 0)) {
      if (i5 >>> 0 >= i9 >>> 0 ? (HEAP32[i5 + 12 >> 2] | 0) == (i11 | 0) : 0) break;
      _abort();
     } while (0);
     if ((i3 | 0) == (i5 | 0)) {
      HEAP32[748] = HEAP32[748] & ~(1 << i4);
      break;
     }
     do if ((i3 | 0) == (i2 | 0)) i6 = i3 + 8 | 0; else {
      if (i3 >>> 0 >= i9 >>> 0 ? (i8 = i3 + 8 | 0, (HEAP32[i8 >> 2] | 0) == (i11 | 0)) : 0) {
       i6 = i8;
       break;
      }
      _abort();
     } while (0);
     HEAP32[i5 + 12 >> 2] = i3;
     HEAP32[i6 >> 2] = i5;
    } while (0);
    if (i13 >>> 0 < 16) {
     HEAP32[i15 >> 2] = i14 | i16 & 1 | 2;
     i17 = i1 + (i14 | 4) | 0;
     HEAP32[i17 >> 2] = HEAP32[i17 >> 2] | 1;
     break;
    } else {
     HEAP32[i15 >> 2] = i16 & 1 | i17 | 2;
     HEAP32[i1 + (i17 + 4) >> 2] = i13 | 3;
     i16 = i1 + (i14 | 4) | 0;
     HEAP32[i16 >> 2] = HEAP32[i16 >> 2] | 1;
     _dispose_chunk(i1 + i17 | 0, i13);
     break;
    }
   } else i1 = 0;
  } while (0);
  return i1 | 0;
 }
 _abort();
 return 0;
}

function _getPixelColorRGBA8(i11, i9, i8, i7, i6, i1, i10) {
 i11 = i11 | 0;
 i9 = i9 | 0;
 i8 = i8 | 0;
 i7 = i7 | 0;
 i6 = i6 | 0;
 i1 = i1 | 0;
 i10 = i10 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0;
 switch (HEAP32[i10 >> 2] | 0) {
 case 0:
  {
   i2 = HEAP32[i10 + 4 >> 2] | 0;
   switch (i2 | 0) {
   case 8:
    {
     i6 = HEAP8[i6 + i1 >> 0] | 0;
     HEAP8[i8 >> 0] = i6;
     HEAP8[i9 >> 0] = i6;
     HEAP8[i11 >> 0] = i6;
     if ((HEAP32[i10 + 16 >> 2] | 0) != 0 ? (i6 & 255 | 0) == (HEAP32[i10 + 20 >> 2] | 0) : 0) {
      HEAP8[i7 >> 0] = 0;
      return;
     }
     HEAP8[i7 >> 0] = -1;
     return;
    }
   case 16:
    {
     i5 = i1 << 1;
     i4 = i6 + i5 | 0;
     i3 = HEAP8[i4 >> 0] | 0;
     HEAP8[i8 >> 0] = i3;
     HEAP8[i9 >> 0] = i3;
     HEAP8[i11 >> 0] = i3;
     if ((HEAP32[i10 + 16 >> 2] | 0) != 0 ? ((HEAPU8[i4 >> 0] | 0) << 8 | (HEAPU8[i6 + (i5 | 1) >> 0] | 0) | 0) == (HEAP32[i10 + 20 >> 2] | 0) : 0) {
      HEAP8[i7 >> 0] = 0;
      return;
     }
     HEAP8[i7 >> 0] = -1;
     return;
    }
   default:
    {
     i5 = (1 << i2) + -1 | 0;
     if (!i2) i1 = 0; else {
      i4 = Math_imul(i2, i1) | 0;
      i3 = i2 + -1 | 0;
      i1 = 0;
      while (1) {
       i1 = (((HEAPU8[i6 + (i4 >>> 3) >> 0] | 0) >>> (i4 & 7 ^ 7) & 1) << i3) + i1 | 0;
       i3 = i3 + -1 | 0;
       if (i3 >>> 0 >= i2 >>> 0) break; else i4 = i4 + 1 | 0;
      }
     }
     i6 = (((i1 * 255 | 0) >>> 0) / (i5 >>> 0) | 0) & 255;
     HEAP8[i8 >> 0] = i6;
     HEAP8[i9 >> 0] = i6;
     HEAP8[i11 >> 0] = i6;
     if ((HEAP32[i10 + 16 >> 2] | 0) != 0 ? (i1 | 0) == (HEAP32[i10 + 20 >> 2] | 0) : 0) {
      HEAP8[i7 >> 0] = 0;
      return;
     }
     HEAP8[i7 >> 0] = -1;
     return;
    }
   }
  }
 case 2:
  if ((HEAP32[i10 + 4 >> 2] | 0) == 8) {
   i5 = i1 * 3 | 0;
   HEAP8[i11 >> 0] = HEAP8[i6 + i5 >> 0] | 0;
   HEAP8[i9 >> 0] = HEAP8[i6 + (i5 + 1) >> 0] | 0;
   i6 = HEAP8[i6 + (i5 + 2) >> 0] | 0;
   HEAP8[i8 >> 0] = i6;
   if ((((HEAP32[i10 + 16 >> 2] | 0) != 0 ? (HEAPU8[i11 >> 0] | 0 | 0) == (HEAP32[i10 + 20 >> 2] | 0) : 0) ? (HEAPU8[i9 >> 0] | 0 | 0) == (HEAP32[i10 + 24 >> 2] | 0) : 0) ? (i6 & 255 | 0) == (HEAP32[i10 + 28 >> 2] | 0) : 0) {
    HEAP8[i7 >> 0] = 0;
    return;
   }
   HEAP8[i7 >> 0] = -1;
   return;
  } else {
   i5 = i1 * 6 | 0;
   i3 = i6 + i5 | 0;
   HEAP8[i11 >> 0] = HEAP8[i3 >> 0] | 0;
   i4 = i6 + (i5 + 2) | 0;
   HEAP8[i9 >> 0] = HEAP8[i4 >> 0] | 0;
   i11 = i6 + (i5 + 4) | 0;
   HEAP8[i8 >> 0] = HEAP8[i11 >> 0] | 0;
   if ((((HEAP32[i10 + 16 >> 2] | 0) != 0 ? ((HEAPU8[i3 >> 0] | 0) << 8 | (HEAPU8[i6 + (i5 | 1) >> 0] | 0) | 0) == (HEAP32[i10 + 20 >> 2] | 0) : 0) ? ((HEAPU8[i4 >> 0] | 0) << 8 | (HEAPU8[i6 + (i5 + 3) >> 0] | 0) | 0) == (HEAP32[i10 + 24 >> 2] | 0) : 0) ? ((HEAPU8[i11 >> 0] | 0) << 8 | (HEAPU8[i6 + (i5 + 5) >> 0] | 0) | 0) == (HEAP32[i10 + 28 >> 2] | 0) : 0) {
    HEAP8[i7 >> 0] = 0;
    return;
   }
   HEAP8[i7 >> 0] = -1;
   return;
  }
 case 3:
  {
   i4 = HEAP32[i10 + 4 >> 2] | 0;
   switch (i4 | 0) {
   case 8:
    {
     i1 = HEAPU8[i6 + i1 >> 0] | 0;
     break;
    }
   case 0:
    {
     i1 = 0;
     break;
    }
   default:
    {
     i2 = Math_imul(i4, i1) | 0;
     i3 = i4 + -1 | 0;
     i1 = 0;
     while (1) {
      i1 = (((HEAPU8[i6 + (i2 >>> 3) >> 0] | 0) >>> (i2 & 7 ^ 7) & 1) << i3) + i1 | 0;
      i3 = i3 + -1 | 0;
      if (i3 >>> 0 >= i4 >>> 0) break; else i2 = i2 + 1 | 0;
     }
    }
   }
   if (i1 >>> 0 < (HEAP32[i10 + 12 >> 2] | 0) >>> 0) {
    i6 = i1 << 2;
    i10 = i10 + 8 | 0;
    HEAP8[i11 >> 0] = HEAP8[(HEAP32[i10 >> 2] | 0) + i6 >> 0] | 0;
    HEAP8[i9 >> 0] = HEAP8[(HEAP32[i10 >> 2] | 0) + (i6 | 1) >> 0] | 0;
    HEAP8[i8 >> 0] = HEAP8[(HEAP32[i10 >> 2] | 0) + (i6 | 2) >> 0] | 0;
    HEAP8[i7 >> 0] = HEAP8[(HEAP32[i10 >> 2] | 0) + (i6 | 3) >> 0] | 0;
    return;
   } else {
    HEAP8[i8 >> 0] = 0;
    HEAP8[i9 >> 0] = 0;
    HEAP8[i11 >> 0] = 0;
    HEAP8[i7 >> 0] = -1;
    return;
   }
  }
 case 4:
  if ((HEAP32[i10 + 4 >> 2] | 0) == 8) {
   i10 = i1 << 1;
   i5 = HEAP8[i6 + i10 >> 0] | 0;
   HEAP8[i8 >> 0] = i5;
   HEAP8[i9 >> 0] = i5;
   HEAP8[i11 >> 0] = i5;
   HEAP8[i7 >> 0] = HEAP8[i6 + (i10 | 1) >> 0] | 0;
   return;
  } else {
   i10 = i1 << 2;
   i5 = HEAP8[i6 + i10 >> 0] | 0;
   HEAP8[i8 >> 0] = i5;
   HEAP8[i9 >> 0] = i5;
   HEAP8[i11 >> 0] = i5;
   HEAP8[i7 >> 0] = HEAP8[i6 + (i10 | 2) >> 0] | 0;
   return;
  }
 case 6:
  if ((HEAP32[i10 + 4 >> 2] | 0) == 8) {
   i10 = i1 << 2;
   HEAP8[i11 >> 0] = HEAP8[i6 + i10 >> 0] | 0;
   HEAP8[i9 >> 0] = HEAP8[i6 + (i10 | 1) >> 0] | 0;
   HEAP8[i8 >> 0] = HEAP8[i6 + (i10 | 2) >> 0] | 0;
   HEAP8[i7 >> 0] = HEAP8[i6 + (i10 | 3) >> 0] | 0;
   return;
  } else {
   i10 = i1 << 3;
   HEAP8[i11 >> 0] = HEAP8[i6 + i10 >> 0] | 0;
   HEAP8[i9 >> 0] = HEAP8[i6 + (i10 | 2) >> 0] | 0;
   HEAP8[i8 >> 0] = HEAP8[i6 + (i10 | 4) >> 0] | 0;
   HEAP8[i7 >> 0] = HEAP8[i6 + (i10 | 6) >> 0] | 0;
   return;
  }
 default:
  return;
 }
}

function _sdsMakeRoomFor(i10, i3) {
 i10 = i10 | 0;
 i3 = i3 | 0;
 var i1 = 0, i2 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0;
 i2 = HEAPU8[i10 + -1 >> 0] | 0;
 i7 = i2 & 7;
 switch (i7 | 0) {
 case 4:
  {
   i8 = i10 + -9 | 0;
   i6 = i8;
   i8 = i8 + 4 | 0;
   i1 = i10 + -17 | 0;
   i9 = i1;
   i1 = i1 + 4 | 0;
   i1 = _i64Subtract(HEAPU8[i6 >> 0] | HEAPU8[i6 + 1 >> 0] << 8 | HEAPU8[i6 + 2 >> 0] << 16 | HEAPU8[i6 + 3 >> 0] << 24 | 0, HEAPU8[i8 >> 0] | HEAPU8[i8 + 1 >> 0] << 8 | HEAPU8[i8 + 2 >> 0] << 16 | HEAPU8[i8 + 3 >> 0] << 24 | 0, HEAPU8[i9 >> 0] | HEAPU8[i9 + 1 >> 0] << 8 | HEAPU8[i9 + 2 >> 0] << 16 | HEAPU8[i9 + 3 >> 0] << 24 | 0, HEAPU8[i1 >> 0] | HEAPU8[i1 + 1 >> 0] << 8 | HEAPU8[i1 + 2 >> 0] << 16 | HEAPU8[i1 + 3 >> 0] << 24 | 0) | 0;
   break;
  }
 case 1:
  {
   i1 = (HEAPU8[i10 + -2 >> 0] | 0) - (HEAPU8[i10 + -3 >> 0] | 0) | 0;
   break;
  }
 case 2:
  {
   i1 = i10 + -5 | 0;
   i9 = i10 + -3 | 0;
   i1 = ((HEAPU8[i9 >> 0] | HEAPU8[i9 + 1 >> 0] << 8) & 65535) - ((HEAPU8[i1 >> 0] | HEAPU8[i1 + 1 >> 0] << 8) & 65535) | 0;
   break;
  }
 case 3:
  {
   i1 = i10 + -9 | 0;
   i9 = i10 + -5 | 0;
   i1 = (HEAPU8[i9 >> 0] | HEAPU8[i9 + 1 >> 0] << 8 | HEAPU8[i9 + 2 >> 0] << 16 | HEAPU8[i9 + 3 >> 0] << 24) - (HEAPU8[i1 >> 0] | HEAPU8[i1 + 1 >> 0] << 8 | HEAPU8[i1 + 2 >> 0] << 16 | HEAPU8[i1 + 3 >> 0] << 24) | 0;
   break;
  }
 default:
  i1 = 0;
 }
 if (i1 >>> 0 >= i3 >>> 0) return i10 | 0;
 switch (i7 | 0) {
 case 0:
  {
   i1 = 1;
   i8 = i2 >>> 3;
   break;
  }
 case 1:
  {
   i1 = 3;
   i8 = HEAPU8[i10 + -3 >> 0] | 0;
   break;
  }
 case 2:
  {
   i8 = i10 + -5 | 0;
   i1 = 5;
   i8 = (HEAPU8[i8 >> 0] | HEAPU8[i8 + 1 >> 0] << 8) & 65535;
   break;
  }
 case 3:
  {
   i8 = i10 + -9 | 0;
   i1 = 9;
   i8 = HEAPU8[i8 >> 0] | HEAPU8[i8 + 1 >> 0] << 8 | HEAPU8[i8 + 2 >> 0] << 16 | HEAPU8[i8 + 3 >> 0] << 24;
   break;
  }
 case 4:
  {
   i8 = i10 + -17 | 0;
   i1 = 17;
   i8 = HEAPU8[i8 >> 0] | HEAPU8[i8 + 1 >> 0] << 8 | HEAPU8[i8 + 2 >> 0] << 16 | HEAPU8[i8 + 3 >> 0] << 24;
   break;
  }
 default:
  {
   i1 = 0;
   i8 = 0;
  }
 }
 i2 = i10 + (0 - i1) | 0;
 i9 = i8 + i3 | 0;
 i9 = i9 >>> 0 < 1048576 ? i9 << 1 : i9 + 1048576 | 0;
 if (i9 >>> 0 >= 32) if (i9 >>> 0 >= 255) if (i9 >>> 0 < 65535) i1 = 2; else i1 = (i9 | 0) == -1 ? 4 : 3; else i1 = 1; else i1 = 0;
 i4 = i1 << 24 >> 24 == 0 ? 1 : i1;
 i5 = i4 & 255;
 switch (i5 | 0) {
 case 0:
  {
   i6 = 1;
   break;
  }
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
 default:
  i6 = 0;
 }
 i3 = i9 + 1 + i6 | 0;
 L29 : do if ((i7 | 0) == (i5 | 0)) {
  i1 = _realloc(i2, i3) | 0;
  if (!i1) {
   i10 = 0;
   return i10 | 0;
  } else {
   i1 = i1 + i6 | 0;
   break;
  }
 } else {
  i3 = _malloc(i3) | 0;
  if (!i3) {
   i10 = 0;
   return i10 | 0;
  }
  i1 = i3 + i6 | 0;
  _memcpy(i1 | 0, i10 | 0, i8 + 1 | 0) | 0;
  _free(i2);
  i2 = i3 + (i6 + -1) | 0;
  HEAP8[i2 >> 0] = i4;
  switch (i5 | 0) {
  case 0:
   {
    HEAP8[i2 >> 0] = i8 << 3;
    break L29;
   }
  case 1:
   {
    HEAP8[i3 + (i6 + -3) >> 0] = i8;
    break L29;
   }
  case 2:
   {
    i8 = i8 & 65535;
    i10 = i3 + (i6 + -5) | 0;
    HEAP8[i10 >> 0] = i8;
    HEAP8[i10 + 1 >> 0] = i8 >> 8;
    break L29;
   }
  case 3:
   {
    i10 = i3 + (i6 + -9) | 0;
    HEAP8[i10 >> 0] = i8;
    HEAP8[i10 + 1 >> 0] = i8 >> 8;
    HEAP8[i10 + 2 >> 0] = i8 >> 16;
    HEAP8[i10 + 3 >> 0] = i8 >> 24;
    break L29;
   }
  case 4:
   {
    i10 = i3 + (i6 + -17) | 0;
    i7 = i10;
    HEAP8[i7 >> 0] = i8;
    HEAP8[i7 + 1 >> 0] = i8 >> 8;
    HEAP8[i7 + 2 >> 0] = i8 >> 16;
    HEAP8[i7 + 3 >> 0] = i8 >> 24;
    i10 = i10 + 4 | 0;
    HEAP8[i10 >> 0] = 0;
    HEAP8[i10 + 1 >> 0] = 0;
    HEAP8[i10 + 2 >> 0] = 0;
    HEAP8[i10 + 3 >> 0] = 0;
    break L29;
   }
  default:
   break L29;
  }
 } while (0);
 switch ((HEAPU8[i1 + -1 >> 0] | 0) & 7 | 0) {
 case 4:
  {
   i10 = i1 + -9 | 0;
   i8 = i10;
   HEAP8[i8 >> 0] = i9;
   HEAP8[i8 + 1 >> 0] = i9 >> 8;
   HEAP8[i8 + 2 >> 0] = i9 >> 16;
   HEAP8[i8 + 3 >> 0] = i9 >> 24;
   i10 = i10 + 4 | 0;
   HEAP8[i10 >> 0] = 0;
   HEAP8[i10 + 1 >> 0] = 0;
   HEAP8[i10 + 2 >> 0] = 0;
   HEAP8[i10 + 3 >> 0] = 0;
   i10 = i1;
   return i10 | 0;
  }
 case 1:
  {
   HEAP8[i1 + -2 >> 0] = i9;
   i10 = i1;
   return i10 | 0;
  }
 case 2:
  {
   i9 = i9 & 65535;
   i10 = i1 + -3 | 0;
   HEAP8[i10 >> 0] = i9;
   HEAP8[i10 + 1 >> 0] = i9 >> 8;
   i10 = i1;
   return i10 | 0;
  }
 case 3:
  {
   i10 = i1 + -5 | 0;
   HEAP8[i10 >> 0] = i9;
   HEAP8[i10 + 1 >> 0] = i9 >> 8;
   HEAP8[i10 + 2 >> 0] = i9 >> 16;
   HEAP8[i10 + 3 >> 0] = i9 >> 24;
   i10 = i1;
   return i10 | 0;
  }
 default:
  {
   i10 = i1;
   return i10 | 0;
  }
 }
 return 0;
}

function _lodepng_inspect(i9, i8, i16, i15, i1) {
 i9 = i9 | 0;
 i8 = i8 | 0;
 i16 = i16 | 0;
 i15 = i15 | 0;
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i17 = 0;
 i5 = i16 + 128 | 0;
 if ((i15 | 0) == 0 | (i1 | 0) == 0) {
  HEAP32[i16 + 288 >> 2] = 48;
  i17 = 48;
  return i17 | 0;
 }
 if (i1 >>> 0 < 33) {
  HEAP32[i16 + 288 >> 2] = 27;
  i17 = 27;
  return i17 | 0;
 }
 _lodepng_info_cleanup(i5);
 i3 = i16 + 156 | 0;
 i4 = i16 + 140 | 0;
 HEAP32[i3 >> 2] = 0;
 HEAP32[i3 + 4 >> 2] = 0;
 HEAP32[i3 + 8 >> 2] = 0;
 HEAP32[i3 + 12 >> 2] = 0;
 HEAP32[i4 >> 2] = 6;
 i3 = i16 + 144 | 0;
 HEAP32[i3 >> 2] = 8;
 HEAP32[i16 + 148 >> 2] = 0;
 HEAP32[i16 + 152 >> 2] = 0;
 i7 = i16 + 136 | 0;
 HEAP32[i7 >> 2] = 0;
 HEAP32[i5 >> 2] = 0;
 i6 = i16 + 132 | 0;
 HEAP32[i6 >> 2] = 0;
 HEAP32[i16 + 248 >> 2] = 0;
 i1 = i16 + 264 | 0;
 HEAP32[i1 >> 2] = 0;
 HEAP32[i1 + 4 >> 2] = 0;
 HEAP32[i1 + 8 >> 2] = 0;
 HEAP32[i1 + 12 >> 2] = 0;
 HEAP32[i1 + 16 >> 2] = 0;
 HEAP32[i1 + 20 >> 2] = 0;
 i1 = i16 + 172 | 0;
 i2 = i1 + 52 | 0;
 do {
  HEAP32[i1 >> 2] = 0;
  i1 = i1 + 4 | 0;
 } while ((i1 | 0) < (i2 | 0));
 if ((((((((HEAP8[i15 >> 0] | 0) == -119 ? (HEAP8[i15 + 1 >> 0] | 0) == 80 : 0) ? (HEAP8[i15 + 2 >> 0] | 0) == 78 : 0) ? (HEAP8[i15 + 3 >> 0] | 0) == 71 : 0) ? (HEAP8[i15 + 4 >> 0] | 0) == 13 : 0) ? (HEAP8[i15 + 5 >> 0] | 0) == 10 : 0) ? (HEAP8[i15 + 6 >> 0] | 0) == 26 : 0) ? (HEAP8[i15 + 7 >> 0] | 0) == 10 : 0) {
  if ((((HEAP8[i15 + 12 >> 0] | 0) == 73 ? (HEAP8[i15 + 13 >> 0] | 0) == 72 : 0) ? (HEAP8[i15 + 14 >> 0] | 0) == 68 : 0) ? (HEAP8[i15 + 15 >> 0] | 0) == 82 : 0) {
   HEAP32[i9 >> 2] = HEAPU8[i15 + 17 >> 0] << 16 | HEAPU8[i15 + 16 >> 0] << 24 | HEAPU8[i15 + 18 >> 0] << 8 | HEAPU8[i15 + 19 >> 0];
   HEAP32[i8 >> 2] = HEAPU8[i15 + 21 >> 0] << 16 | HEAPU8[i15 + 20 >> 0] << 24 | HEAPU8[i15 + 22 >> 0] << 8 | HEAPU8[i15 + 23 >> 0];
   i14 = HEAPU8[i15 + 24 >> 0] | 0;
   HEAP32[i3 >> 2] = i14;
   i13 = HEAPU8[i15 + 25 >> 0] | 0;
   HEAP32[i4 >> 2] = i13;
   i12 = HEAP8[i15 + 26 >> 0] | 0;
   HEAP32[i5 >> 2] = i12 & 255;
   i11 = HEAP8[i15 + 27 >> 0] | 0;
   HEAP32[i6 >> 2] = i11 & 255;
   i10 = HEAP8[i15 + 28 >> 0] | 0;
   HEAP32[i7 >> 2] = i10 & 255;
   if ((HEAP32[i9 >> 2] | 0) != 0 ? (HEAP32[i8 >> 2] | 0) != 0 : 0) {
    do if (!(HEAP32[i16 + 16 >> 2] | 0)) {
     i5 = HEAPU8[i15 + 29 >> 0] | 0;
     i3 = HEAPU8[i15 + 30 >> 0] << 16;
     i6 = HEAPU8[i15 + 31 >> 0] << 8;
     i2 = HEAPU8[i15 + 32 >> 0] | 0;
     i1 = -1;
     i4 = 0;
     do {
      i1 = HEAP32[1376 + ((HEAPU8[i15 + (i4 + 12) >> 0] ^ i1 & 255) << 2) >> 2] ^ i1 >>> 8;
      i4 = i4 + 1 | 0;
     } while ((i4 | 0) != 17);
     if ((i3 | i5 << 24 | i6 | i2 | 0) == (~i1 | 0)) break;
     HEAP32[i16 + 288 >> 2] = 57;
     i17 = 57;
     return i17 | 0;
    } while (0);
    if (i12 << 24 >> 24) {
     HEAP32[i16 + 288 >> 2] = 32;
     i17 = 32;
     return i17 | 0;
    }
    if (i11 << 24 >> 24) {
     HEAP32[i16 + 288 >> 2] = 33;
     i17 = 33;
     return i17 | 0;
    }
    if ((i10 & 255) > 1) {
     HEAP32[i16 + 288 >> 2] = 34;
     i17 = 34;
     return i17 | 0;
    }
    switch (i13 | 0) {
    case 0:
     {
      switch (i14 | 0) {
      case 1:
      case 2:
      case 4:
      case 8:
      case 16:
       {
        i17 = 39;
        break;
       }
      default:
       i1 = 37;
      }
      break;
     }
    case 2:
     {
      switch (i14 | 0) {
      case 8:
      case 16:
       {
        i17 = 39;
        break;
       }
      default:
       i1 = 37;
      }
      break;
     }
    case 3:
     {
      switch (i14 | 0) {
      case 1:
      case 2:
      case 4:
      case 8:
       {
        i17 = 39;
        break;
       }
      default:
       i1 = 37;
      }
      break;
     }
    case 4:
     {
      switch (i14 | 0) {
      case 8:
      case 16:
       {
        i17 = 39;
        break;
       }
      default:
       i1 = 37;
      }
      break;
     }
    case 6:
     {
      switch (i14 | 0) {
      case 8:
      case 16:
       {
        i17 = 39;
        break;
       }
      default:
       i1 = 37;
      }
      break;
     }
    default:
     i1 = 31;
    }
    if ((i17 | 0) == 39) i1 = 0;
    HEAP32[i16 + 288 >> 2] = i1;
    i17 = i1;
    return i17 | 0;
   }
   HEAP32[i16 + 288 >> 2] = 93;
   i17 = 93;
   return i17 | 0;
  }
  HEAP32[i16 + 288 >> 2] = 29;
  i17 = 29;
  return i17 | 0;
 }
 HEAP32[i16 + 288 >> 2] = 28;
 i17 = 28;
 return i17 | 0;
}

function _unfilter(i15, i14, i1, i13, i2) {
 i15 = i15 | 0;
 i14 = i14 | 0;
 i1 = i1 | 0;
 i13 = i13 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0;
 i12 = (i2 + 7 | 0) >>> 3;
 i6 = ((Math_imul(i2, i1) | 0) + 7 | 0) >>> 3;
 if (!i13) {
  i15 = 0;
  return i15 | 0;
 }
 i7 = i6 + 1 | 0;
 i8 = (i6 | 0) == 0;
 i9 = (i12 | 0) == 0;
 i10 = i12 >>> 0 < i6 >>> 0;
 i3 = 0;
 i11 = 0;
 L4 : while (1) {
  i4 = Math_imul(i11, i6) | 0;
  i2 = Math_imul(i11, i7) | 0;
  i5 = i2 + 1 | 0;
  L6 : do switch (HEAPU8[i14 + i2 >> 0] | 0 | 0) {
  case 0:
   {
    if (!i8) {
     i2 = 0;
     do {
      HEAP8[i15 + (i2 + i4) >> 0] = HEAP8[i14 + (i2 + i5) >> 0] | 0;
      i2 = i2 + 1 | 0;
     } while ((i2 | 0) != (i6 | 0));
    }
    break;
   }
  case 1:
   {
    if (!i9) {
     i2 = 0;
     do {
      HEAP8[i15 + (i2 + i4) >> 0] = HEAP8[i14 + (i2 + i5) >> 0] | 0;
      i2 = i2 + 1 | 0;
     } while ((i2 | 0) != (i12 | 0));
    }
    if (i10) {
     i2 = i4 - i12 | 0;
     i1 = i12;
     do {
      HEAP8[i15 + (i1 + i4) >> 0] = (HEAPU8[i15 + (i2 + i1) >> 0] | 0) + (HEAPU8[i14 + (i1 + i5) >> 0] | 0);
      i1 = i1 + 1 | 0;
     } while ((i1 | 0) != (i6 | 0));
    }
    break;
   }
  case 2:
   {
    if (!i3) {
     if (i8) break L6; else i2 = 0;
     do {
      HEAP8[i15 + (i2 + i4) >> 0] = HEAP8[i14 + (i2 + i5) >> 0] | 0;
      i2 = i2 + 1 | 0;
     } while ((i2 | 0) != (i6 | 0));
    } else {
     if (i8) break L6; else i2 = 0;
     do {
      HEAP8[i15 + (i2 + i4) >> 0] = (HEAPU8[i3 + i2 >> 0] | 0) + (HEAPU8[i14 + (i2 + i5) >> 0] | 0);
      i2 = i2 + 1 | 0;
     } while ((i2 | 0) != (i6 | 0));
    }
    break;
   }
  case 3:
   {
    if (!i3) {
     if (!i9) {
      i2 = 0;
      do {
       HEAP8[i15 + (i2 + i4) >> 0] = HEAP8[i14 + (i2 + i5) >> 0] | 0;
       i2 = i2 + 1 | 0;
      } while ((i2 | 0) != (i12 | 0));
     }
     if (!i10) break L6;
     i2 = i4 - i12 | 0;
     i1 = i12;
     do {
      HEAP8[i15 + (i1 + i4) >> 0] = ((HEAPU8[i15 + (i2 + i1) >> 0] | 0) >>> 1 & 255) + (HEAPU8[i14 + (i1 + i5) >> 0] | 0);
      i1 = i1 + 1 | 0;
     } while ((i1 | 0) != (i6 | 0));
    } else {
     if (!i9) {
      i2 = 0;
      do {
       HEAP8[i15 + (i2 + i4) >> 0] = ((HEAPU8[i3 + i2 >> 0] | 0) >>> 1 & 255) + (HEAPU8[i14 + (i2 + i5) >> 0] | 0);
       i2 = i2 + 1 | 0;
      } while ((i2 | 0) != (i12 | 0));
     }
     if (!i10) break L6;
     i2 = i4 - i12 | 0;
     i1 = i12;
     do {
      HEAP8[i15 + (i1 + i4) >> 0] = (((HEAPU8[i3 + i1 >> 0] | 0) + (HEAPU8[i15 + (i2 + i1) >> 0] | 0) | 0) >>> 1) + (HEAPU8[i14 + (i1 + i5) >> 0] | 0);
      i1 = i1 + 1 | 0;
     } while ((i1 | 0) != (i6 | 0));
    }
    break;
   }
  case 4:
   {
    if (i3) {
     if (!i9) {
      i2 = 0;
      do {
       HEAP8[i15 + (i2 + i4) >> 0] = (HEAPU8[i3 + i2 >> 0] | 0) + (HEAPU8[i14 + (i2 + i5) >> 0] | 0);
       i2 = i2 + 1 | 0;
      } while ((i2 | 0) != (i12 | 0));
     }
     if (i10) i2 = i12; else break L6;
     while (1) {
      i19 = i2 - i12 | 0;
      i1 = HEAP8[i15 + (i19 + i4) >> 0] | 0;
      i16 = HEAP8[i3 + i2 >> 0] | 0;
      i19 = HEAP8[i3 + i19 >> 0] | 0;
      i22 = i16 & 255;
      i20 = i19 & 255;
      i17 = i22 - i20 | 0;
      i17 = (i17 | 0) > -1 ? i17 : 0 - i17 | 0;
      i21 = i1 & 255;
      i18 = i21 - i20 | 0;
      i18 = (i18 | 0) > -1 ? i18 : 0 - i18 | 0;
      i20 = i22 + i21 - (i20 << 1) | 0;
      i20 = (i20 | 0) > -1 ? i20 : 0 - i20 | 0;
      HEAP8[i15 + (i2 + i4) >> 0] = (((i20 | 0) < (i17 | 0) & (i20 | 0) < (i18 | 0) ? i19 : (i18 | 0) < (i17 | 0) ? i16 : i1) & 255) + (HEAPU8[i14 + (i2 + i5) >> 0] | 0);
      i2 = i2 + 1 | 0;
      if ((i2 | 0) == (i6 | 0)) break L6;
     }
    }
    if (!i9) {
     i2 = 0;
     do {
      HEAP8[i15 + (i2 + i4) >> 0] = HEAP8[i14 + (i2 + i5) >> 0] | 0;
      i2 = i2 + 1 | 0;
     } while ((i2 | 0) != (i12 | 0));
    }
    if (i10) {
     i2 = i4 - i12 | 0;
     i1 = i12;
     do {
      HEAP8[i15 + (i1 + i4) >> 0] = (HEAPU8[i15 + (i2 + i1) >> 0] | 0) + (HEAPU8[i14 + (i1 + i5) >> 0] | 0);
      i1 = i1 + 1 | 0;
     } while ((i1 | 0) != (i6 | 0));
    }
    break;
   }
  default:
   {
    i1 = 36;
    i2 = 38;
    break L4;
   }
  } while (0);
  i3 = i15 + i4 | 0;
  i11 = i11 + 1 | 0;
  if (i11 >>> 0 >= i13 >>> 0) {
   i1 = 0;
   i2 = 38;
   break;
  }
 }
 if ((i2 | 0) == 38) return i1 | 0;
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

function _HuffmanTree_makeFromLengths2(i8) {
 i8 = i8 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0;
 i9 = i8 + 16 | 0;
 i7 = _malloc(HEAP32[i9 >> 2] << 2) | 0;
 i13 = i8 + 4 | 0;
 HEAP32[i13 >> 2] = i7;
 i7 = (i7 | 0) == 0;
 i6 = i8 + 12 | 0;
 i4 = (HEAP32[i6 >> 2] | 0) + 1 | 0;
 i3 = i4 << 2;
 if (i3) {
  i2 = _realloc(0, i3) | 0;
  if (!i2) {
   i2 = 0;
   i1 = 0;
  } else i14 = 4;
 } else {
  i2 = 0;
  i14 = 4;
 }
 do if ((i14 | 0) == 4) {
  if (i4) _memset(i2 | 0, 0, i3 | 0) | 0;
  i4 = (HEAP32[i6 >> 2] | 0) + 1 | 0;
  i3 = i4 << 2;
  if (!i3) i1 = 0; else {
   i1 = _realloc(0, i3) | 0;
   if (!i1) {
    i1 = 0;
    break;
   }
  }
  if (i4) _memset(i1 | 0, 0, i3 | 0) | 0;
  if (!i7) {
   i3 = HEAP32[i9 >> 2] | 0;
   i7 = (i3 | 0) == 0;
   if (!i7) {
    i4 = HEAP32[i8 + 8 >> 2] | 0;
    i5 = 0;
    do {
     i12 = i2 + (HEAP32[i4 + (i5 << 2) >> 2] << 2) | 0;
     HEAP32[i12 >> 2] = (HEAP32[i12 >> 2] | 0) + 1;
     i5 = i5 + 1 | 0;
    } while ((i5 | 0) != (i3 | 0));
   }
   i4 = HEAP32[i6 >> 2] | 0;
   if (i4) {
    i5 = HEAP32[i1 >> 2] | 0;
    i6 = 1;
    do {
     i5 = (HEAP32[i2 + (i6 + -1 << 2) >> 2] | 0) + i5 << 1;
     HEAP32[i1 + (i6 << 2) >> 2] = i5;
     i6 = i6 + 1 | 0;
    } while (i6 >>> 0 <= i4 >>> 0);
   }
   if (!i7) {
    i5 = HEAP32[i8 + 8 >> 2] | 0;
    i6 = 0;
    do {
     i4 = HEAP32[i5 + (i6 << 2) >> 2] | 0;
     if (i4) {
      i12 = i1 + (i4 << 2) | 0;
      i3 = HEAP32[i12 >> 2] | 0;
      HEAP32[i12 >> 2] = i3 + 1;
      HEAP32[(HEAP32[i13 >> 2] | 0) + (i6 << 2) >> 2] = i3;
      i3 = HEAP32[i9 >> 2] | 0;
     }
     i6 = i6 + 1 | 0;
    } while ((i6 | 0) != (i3 | 0));
   }
   _free(i2);
   _free(i1);
   i10 = HEAP32[i9 >> 2] | 0;
   i12 = _malloc(i10 << 3) | 0;
   HEAP32[i8 >> 2] = i12;
   if (!i12) {
    i14 = 83;
    return i14 | 0;
   }
   i11 = (i10 & 2147483647 | 0) == 0;
   if (!i11) {
    i3 = i10 << 1;
    i2 = 0;
    do {
     HEAP32[i12 + (i2 << 2) >> 2] = 32767;
     i2 = i2 + 1 | 0;
    } while (i2 >>> 0 < i3 >>> 0);
   }
   if (!i10) {
    i14 = 0;
    return i14 | 0;
   }
   i8 = HEAP32[i8 + 8 >> 2] | 0;
   i9 = 0;
   i6 = 0;
   i4 = 0;
   L46 : do {
    i2 = i8 + (i9 << 2) | 0;
    i5 = HEAP32[i2 >> 2] | 0;
    if (i5) {
     i1 = (HEAP32[i13 >> 2] | 0) + (i9 << 2) | 0;
     i7 = 0;
     do {
      if ((i4 | 0) < 0 | (i4 + 2 | 0) >>> 0 > i10 >>> 0) {
       i1 = 55;
       i14 = 45;
       break L46;
      }
      i3 = i12 + (((HEAP32[i1 >> 2] | 0) >>> (i5 + ~i7 | 0) & 1 | i4 << 1) << 2) | 0;
      i4 = HEAP32[i3 >> 2] | 0;
      do if ((i4 | 0) == 32767) {
       i4 = i7 + 1 | 0;
       if ((i4 | 0) == (i5 | 0)) {
        HEAP32[i3 >> 2] = i9;
        i7 = i5;
        i4 = 0;
        break;
       } else {
        i5 = i6 + 1 | 0;
        HEAP32[i3 >> 2] = i10 + i5;
        i7 = i4;
        i6 = i5;
        i4 = i5;
        break;
       }
      } else {
       i7 = i7 + 1 | 0;
       i4 = i4 - i10 | 0;
      } while (0);
      i5 = HEAP32[i2 >> 2] | 0;
     } while ((i5 | 0) != (i7 | 0));
    }
    i9 = i9 + 1 | 0;
   } while (i9 >>> 0 < i10 >>> 0);
   if ((i14 | 0) == 45) return i1 | 0;
   if (i11) {
    i14 = 0;
    return i14 | 0;
   }
   i2 = i10 << 1;
   i3 = 0;
   do {
    i1 = i12 + (i3 << 2) | 0;
    if ((HEAP32[i1 >> 2] | 0) == 32767) HEAP32[i1 >> 2] = 0;
    i3 = i3 + 1 | 0;
   } while (i3 >>> 0 < i2 >>> 0);
   i1 = 0;
   return i1 | 0;
  }
 } while (0);
 _free(i2);
 _free(i1);
 i14 = 83;
 return i14 | 0;
}

function _lodepng_add_itext(i3, i6, i8, i10, i13) {
 i3 = i3 | 0;
 i6 = i6 | 0;
 i8 = i8 | 0;
 i10 = i10 | 0;
 i13 = i13 | 0;
 var i1 = 0, i2 = 0, i4 = 0, i5 = 0, i7 = 0, i9 = 0, i11 = 0, i12 = 0, i14 = 0;
 i5 = i3 + 76 | 0;
 i12 = i3 + 72 | 0;
 i4 = _realloc(HEAP32[i5 >> 2] | 0, (HEAP32[i12 >> 2] << 2) + 4 | 0) | 0;
 i7 = i3 + 80 | 0;
 i2 = _realloc(HEAP32[i7 >> 2] | 0, (HEAP32[i12 >> 2] << 2) + 4 | 0) | 0;
 i9 = i3 + 84 | 0;
 i1 = _realloc(HEAP32[i9 >> 2] | 0, (HEAP32[i12 >> 2] << 2) + 4 | 0) | 0;
 i11 = i3 + 88 | 0;
 i3 = _realloc(HEAP32[i11 >> 2] | 0, (HEAP32[i12 >> 2] << 2) + 4 | 0) | 0;
 if (!((i4 | 0) != 0 & (i2 | 0) != 0 & (i1 | 0) != 0 & (i3 | 0) != 0)) {
  _free(i4);
  _free(i2);
  _free(i1);
  _free(i3);
  i13 = 83;
  return i13 | 0;
 }
 i14 = HEAP32[i12 >> 2] | 0;
 HEAP32[i12 >> 2] = i14 + 1;
 HEAP32[i5 >> 2] = i4;
 HEAP32[i7 >> 2] = i2;
 HEAP32[i9 >> 2] = i1;
 HEAP32[i11 >> 2] = i3;
 i3 = i4 + (i14 << 2) | 0;
 HEAP32[i3 >> 2] = 0;
 i2 = _realloc(0, 1) | 0;
 if (i2) {
  HEAP8[i2 >> 0] = 0;
  HEAP32[i3 >> 2] = i2;
 }
 i2 = (HEAP32[i5 >> 2] | 0) + ((HEAP32[i12 >> 2] | 0) + -1 << 2) | 0;
 i1 = _strlen(i6) | 0;
 i3 = _realloc(HEAP32[i2 >> 2] | 0, i1 + 1 | 0) | 0;
 if (((i3 | 0) != 0 ? (HEAP8[i3 + i1 >> 0] = 0, HEAP32[i2 >> 2] = i3, (i1 | 0) != 0) : 0) ? (HEAP8[i3 >> 0] = HEAP8[i6 >> 0] | 0, (i1 | 0) != 1) : 0) {
  i3 = 1;
  do {
   HEAP8[(HEAP32[i2 >> 2] | 0) + i3 >> 0] = HEAP8[i6 + i3 >> 0] | 0;
   i3 = i3 + 1 | 0;
  } while ((i3 | 0) != (i1 | 0));
 }
 i3 = (HEAP32[i7 >> 2] | 0) + ((HEAP32[i12 >> 2] | 0) + -1 << 2) | 0;
 HEAP32[i3 >> 2] = 0;
 i2 = _realloc(0, 1) | 0;
 if (i2) {
  HEAP8[i2 >> 0] = 0;
  HEAP32[i3 >> 2] = i2;
 }
 i2 = (HEAP32[i7 >> 2] | 0) + ((HEAP32[i12 >> 2] | 0) + -1 << 2) | 0;
 i1 = _strlen(i8) | 0;
 i3 = _realloc(HEAP32[i2 >> 2] | 0, i1 + 1 | 0) | 0;
 if (((i3 | 0) != 0 ? (HEAP8[i3 + i1 >> 0] = 0, HEAP32[i2 >> 2] = i3, (i1 | 0) != 0) : 0) ? (HEAP8[i3 >> 0] = HEAP8[i8 >> 0] | 0, (i1 | 0) != 1) : 0) {
  i3 = 1;
  do {
   HEAP8[(HEAP32[i2 >> 2] | 0) + i3 >> 0] = HEAP8[i8 + i3 >> 0] | 0;
   i3 = i3 + 1 | 0;
  } while ((i3 | 0) != (i1 | 0));
 }
 i3 = (HEAP32[i9 >> 2] | 0) + ((HEAP32[i12 >> 2] | 0) + -1 << 2) | 0;
 HEAP32[i3 >> 2] = 0;
 i2 = _realloc(0, 1) | 0;
 if (i2) {
  HEAP8[i2 >> 0] = 0;
  HEAP32[i3 >> 2] = i2;
 }
 i2 = (HEAP32[i9 >> 2] | 0) + ((HEAP32[i12 >> 2] | 0) + -1 << 2) | 0;
 i1 = _strlen(i10) | 0;
 i3 = _realloc(HEAP32[i2 >> 2] | 0, i1 + 1 | 0) | 0;
 if (((i3 | 0) != 0 ? (HEAP8[i3 + i1 >> 0] = 0, HEAP32[i2 >> 2] = i3, (i1 | 0) != 0) : 0) ? (HEAP8[i3 >> 0] = HEAP8[i10 >> 0] | 0, (i1 | 0) != 1) : 0) {
  i3 = 1;
  do {
   HEAP8[(HEAP32[i2 >> 2] | 0) + i3 >> 0] = HEAP8[i10 + i3 >> 0] | 0;
   i3 = i3 + 1 | 0;
  } while ((i3 | 0) != (i1 | 0));
 }
 i1 = (HEAP32[i11 >> 2] | 0) + ((HEAP32[i12 >> 2] | 0) + -1 << 2) | 0;
 HEAP32[i1 >> 2] = 0;
 i2 = _realloc(0, 1) | 0;
 if (i2) {
  HEAP8[i2 >> 0] = 0;
  HEAP32[i1 >> 2] = i2;
 }
 i2 = (HEAP32[i11 >> 2] | 0) + ((HEAP32[i12 >> 2] | 0) + -1 << 2) | 0;
 i3 = _strlen(i13) | 0;
 i1 = _realloc(HEAP32[i2 >> 2] | 0, i3 + 1 | 0) | 0;
 if (!i1) {
  i14 = 0;
  return i14 | 0;
 }
 HEAP8[i1 + i3 >> 0] = 0;
 HEAP32[i2 >> 2] = i1;
 if (!i3) {
  i14 = 0;
  return i14 | 0;
 }
 HEAP8[i1 >> 0] = HEAP8[i13 >> 0] | 0;
 if ((i3 | 0) == 1) {
  i14 = 0;
  return i14 | 0;
 } else i1 = 1;
 do {
  HEAP8[(HEAP32[i2 >> 2] | 0) + i1 >> 0] = HEAP8[i13 + i1 >> 0] | 0;
  i1 = i1 + 1 | 0;
 } while ((i1 | 0) != (i3 | 0));
 i1 = 0;
 return i1 | 0;
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

function _init(f3, f2, f1) {
 f3 = Math_fround(f3);
 f2 = Math_fround(f2);
 f1 = Math_fround(f1);
 var i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0;
 i10 = STACKTOP;
 STACKTOP = STACKTOP + 80 | 0;
 i11 = i10 + 56 | 0;
 i9 = i10 + 24 | 0;
 i8 = i10 + 16 | 0;
 i7 = i10 + 8 | 0;
 i6 = i10;
 i12 = i10 + 40 | 0;
 i5 = i10 + 32 | 0;
 i4 = i10 + 28 | 0;
 HEAPF32[i12 >> 2] = Math_fround(.800000011);
 HEAPF32[i12 + 4 >> 2] = Math_fround(.800000011);
 HEAPF32[i12 + 8 >> 2] = Math_fround(.800000011);
 HEAPF32[i12 + 12 >> 2] = Math_fround(1.0);
 HEAP32[i11 >> 2] = HEAP32[i12 >> 2];
 HEAP32[i11 + 4 >> 2] = HEAP32[i12 + 4 >> 2];
 HEAP32[i11 + 8 >> 2] = HEAP32[i12 + 8 >> 2];
 HEAP32[i11 + 12 >> 2] = HEAP32[i12 + 12 >> 2];
 _par_state_clearcolor(i11);
 _par_shader_load_from_asset(HEAP32[671] | 0);
 i11 = _par_texture_from_asset(HEAP32[672] | 0) | 0;
 HEAP32[661] = i11;
 _par_texture_info(i11, i5, i4);
 if ((HEAP32[i5 >> 2] | 0) == (HEAP32[i4 >> 2] | 0)) {
  HEAPF32[662] = Math_fround(5.0);
  _par_zcam_init(Math_fround(1.0), Math_fround(1.0), Math_fround(.558505356));
  _par_zcam_grab_update(Math_fround(.5), Math_fround(.5), Math_fround(20.0));
  i12 = _par_mesh_rectangle(Math_fround(1.0), Math_fround(1.0)) | 0;
  HEAP32[663] = i12;
  HEAPF64[45] = -.3397902846336365;
  HEAPF64[46] = .11382861247657848;
  i12 = _sdsnew(5687) | 0;
  HEAP32[i6 >> 2] = 5;
  i12 = _sdscatprintf(i12, 5696, i6) | 0;
  i11 = _par_texture_from_asset(_par_token_from_string(i12) | 0) | 0;
  HEAP32[664] = i11;
  _sdsfree(i12);
  i12 = _sdsnew(5687) | 0;
  HEAP32[i7 >> 2] = 10;
  i12 = _sdscatprintf(i12, 5696, i7) | 0;
  i11 = _par_texture_from_asset(_par_token_from_string(i12) | 0) | 0;
  HEAP32[665] = i11;
  _sdsfree(i12);
  i12 = _sdsnew(5687) | 0;
  HEAP32[i8 >> 2] = 15;
  i12 = _sdscatprintf(i12, 5696, i8) | 0;
  i11 = _par_texture_from_asset(_par_token_from_string(i12) | 0) | 0;
  HEAP32[666] = i11;
  _sdsfree(i12);
  i12 = _sdsnew(5687) | 0;
  HEAP32[i9 >> 2] = 20;
  i12 = _sdscatprintf(i12, 5696, i9) | 0;
  i11 = _par_texture_from_asset(_par_token_from_string(i12) | 0) | 0;
  HEAP32[667] = i11;
  _sdsfree(i12);
  i12 = _par_texture_from_asset(HEAP32[673] | 0) | 0;
  HEAP32[668] = i12;
  _par_texture_info(i12, i5, i4);
  f3 = Math_fround(HEAP32[i4 >> 2] | 0);
  i12 = _par_mesh_rectangle(Math_fround(1.0), Math_fround(f3 / Math_fround(HEAP32[i5 >> 2] | 0))) | 0;
  HEAP32[669] = i12;
  i12 = _par_buffer_alloc(32, 2) | 0;
  HEAP32[670] = i12;
  i12 = _par_buffer_lock(i12, 1) | 0;
  f3 = Math_fround(+HEAPF64[45]);
  HEAPF32[i12 >> 2] = f3;
  HEAPF32[i12 + 4 >> 2] = Math_fround(-1.0);
  HEAPF32[i12 + 8 >> 2] = f3;
  HEAPF32[i12 + 12 >> 2] = Math_fround(1.0);
  HEAPF32[i12 + 16 >> 2] = Math_fround(-1.0);
  f3 = Math_fround(+HEAPF64[46]);
  HEAPF32[i12 + 20 >> 2] = f3;
  HEAPF32[i12 + 24 >> 2] = Math_fround(1.0);
  HEAPF32[i12 + 28 >> 2] = f3;
  _par_buffer_unlock(HEAP32[670] | 0);
  STACKTOP = i10;
  return;
 } else ___assert_fail(5642, 5664, 53, 5682);
}

function _par_zcam_highprec(i3, i2, i1) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 var f4 = f0, f5 = f0, f6 = f0, f7 = f0, f8 = f0, f9 = f0, d10 = 0.0, d11 = 0.0, d12 = 0.0, f13 = f0, f14 = f0, f15 = f0, f16 = f0, f17 = f0, f18 = f0, f19 = f0, f20 = f0, f21 = f0, f22 = f0, d23 = 0.0, d24 = 0.0, d25 = 0.0, d26 = 0.0, d27 = 0.0, d28 = 0.0, d29 = 0.0, d30 = 0.0, d31 = 0.0, d32 = 0.0, d33 = 0.0, d34 = 0.0, d35 = 0.0, d36 = 0.0, d37 = 0.0, d38 = 0.0, d39 = 0.0, d40 = 0.0, d41 = 0.0, d42 = 0.0, d43 = 0.0, d44 = 0.0, d45 = 0.0, d46 = 0.0, d47 = 0.0, d48 = 0.0, d49 = 0.0, d50 = 0.0, d51 = 0.0;
 d51 = +HEAPF64[10];
 d50 = +HEAPF64[11];
 d49 = +HEAPF64[12];
 d48 = +HEAPF64[13];
 d35 = +HEAPF64[14];
 d31 = +HEAPF64[15];
 d27 = +HEAPF64[16];
 d23 = +HEAPF64[17];
 d46 = +HEAPF64[18];
 d43 = +HEAPF64[19];
 d40 = +HEAPF64[20];
 d37 = +HEAPF64[21];
 d32 = +HEAPF64[22];
 d28 = +HEAPF64[23];
 d24 = +HEAPF64[24];
 d12 = +HEAPF64[25];
 d47 = d35 * 0.0;
 d33 = d46 * 0.0;
 d45 = d32 * 0.0;
 d44 = d31 * 0.0;
 d29 = d43 * 0.0;
 d42 = d28 * 0.0;
 d41 = d27 * 0.0;
 d25 = d40 * 0.0;
 d39 = d24 * 0.0;
 d38 = d23 * 0.0;
 d11 = d37 * 0.0;
 d36 = d12 * 0.0;
 d34 = d51 * 0.0;
 d30 = d50 * 0.0;
 d26 = d49 * 0.0;
 d10 = d48 * 0.0;
 f22 = Math_fround(d51 + d47 + d33 + d45);
 f21 = Math_fround(d50 + d44 + d29 + d42);
 f20 = Math_fround(d49 + d41 + d25 + d39);
 f19 = Math_fround(d48 + d38 + d11 + d36);
 f18 = Math_fround(d34 + d35 + d33 + d45);
 f17 = Math_fround(d30 + d31 + d29 + d42);
 f16 = Math_fround(d26 + d27 + d25 + d39);
 f15 = Math_fround(d10 + d23 + d11 + d36);
 f14 = Math_fround(d34 + d47 + d46 + d45);
 f13 = Math_fround(d30 + d44 + d43 + d42);
 f7 = Math_fround(d26 + d41 + d40 + d39);
 f8 = Math_fround(d10 + d38 + d37 + d36);
 f9 = Math_fround(d35 * -0.0 - d34 - d33 + d32);
 f4 = Math_fround(d31 * -0.0 - d30 - d29 + d28);
 f5 = Math_fround(d27 * -0.0 - d26 - d25 + d24);
 f6 = Math_fround(d23 * -0.0 - d10 - d11 + d12);
 HEAPF32[i3 >> 2] = f22;
 HEAPF32[i3 + 4 >> 2] = f21;
 HEAPF32[i3 + 8 >> 2] = f20;
 HEAPF32[i3 + 12 >> 2] = f19;
 HEAPF32[i3 + 16 >> 2] = f18;
 HEAPF32[i3 + 20 >> 2] = f17;
 HEAPF32[i3 + 24 >> 2] = f16;
 HEAPF32[i3 + 28 >> 2] = f15;
 HEAPF32[i3 + 32 >> 2] = f14;
 HEAPF32[i3 + 36 >> 2] = f13;
 HEAPF32[i3 + 40 >> 2] = f7;
 HEAPF32[i3 + 44 >> 2] = f8;
 HEAPF32[i3 + 48 >> 2] = f9;
 HEAPF32[i3 + 52 >> 2] = f4;
 HEAPF32[i3 + 56 >> 2] = f5;
 HEAPF32[i3 + 60 >> 2] = f6;
 d12 = +HEAPF64[2];
 d11 = +HEAPF64[3];
 d10 = +HEAPF64[4];
 f6 = Math_fround(d12);
 f5 = Math_fround(d11);
 f4 = Math_fround(d10);
 f9 = Math_fround(d12 - +f6);
 f8 = Math_fround(d11 - +f5);
 f7 = Math_fround(d10 - +f4);
 HEAPF32[i2 >> 2] = f9;
 HEAPF32[i2 + 4 >> 2] = f8;
 HEAPF32[i2 + 8 >> 2] = f7;
 HEAPF32[i1 >> 2] = f6;
 HEAPF32[i1 + 4 >> 2] = f5;
 HEAPF32[i1 + 8 >> 2] = f4;
 return;
}

function _par_token_from_string(i16) {
 i16 = i16 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0;
 i14 = HEAP8[i16 >> 0] | 0;
 i2 = i14 << 24 >> 24;
 if (i14 << 24 >> 24 != 0 ? (i1 = i16 + 1 | 0, i3 = HEAP8[i1 >> 0] | 0, i3 << 24 >> 24 != 0) : 0) do {
  i2 = (i2 * 31 | 0) + (i3 << 24 >> 24) | 0;
  i1 = i1 + 1 | 0;
  i3 = HEAP8[i1 >> 0] | 0;
 } while (i3 << 24 >> 24 != 0);
 i1 = HEAP32[205] | 0;
 if (!i1) {
  i14 = _calloc(1, 28) | 0;
  HEAP32[205] = i14;
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
 HEAP32[(HEAP32[(HEAP32[205] | 0) + 24 >> 2] | 0) + (i1 << 2) >> 2] = i16;
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
    i1 = _realloc(i4, i6 << 3) | 0;
    if (!i1) {
     i5 = i2;
     break L11;
    }
    i6 = i6 << 1;
    i4 = i1;
   }
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
   if ((i5 | 0) >= (i8 | 0)) {
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

function _par_asset_onload(i1, i16) {
 i1 = i1 | 0;
 i16 = i16 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0;
 i15 = _par_token_from_string(i1) | 0;
 if (!i16) {
  _puts(3828) | 0;
  ___assert_fail(4019, 3849, 18, 3886);
 }
 i1 = HEAP32[196] | 0;
 if (!i1) {
  i14 = _calloc(1, 28) | 0;
  HEAP32[196] = i14;
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
 HEAP32[(HEAP32[(HEAP32[196] | 0) + 24 >> 2] | 0) + (i1 << 2) >> 2] = i16;
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
 case 0:
  {
   i4 = 1;
   break;
  }
 case 1:
  {
   i4 = 3;
   break;
  }
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

function _pop_arg(i2, i3, i1) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i1 = i1 | 0;
 var i4 = 0, i5 = 0, d6 = 0.0;
 L1 : do if (i3 >>> 0 <= 20) do switch (i3 | 0) {
 case 9:
  {
   i4 = (HEAP32[i1 >> 2] | 0) + (4 - 1) & ~(4 - 1);
   i3 = HEAP32[i4 >> 2] | 0;
   HEAP32[i1 >> 2] = i4 + 4;
   HEAP32[i2 >> 2] = i3;
   break L1;
  }
 case 10:
  {
   i4 = (HEAP32[i1 >> 2] | 0) + (4 - 1) & ~(4 - 1);
   i3 = HEAP32[i4 >> 2] | 0;
   HEAP32[i1 >> 2] = i4 + 4;
   i4 = i2;
   HEAP32[i4 >> 2] = i3;
   HEAP32[i4 + 4 >> 2] = ((i3 | 0) < 0) << 31 >> 31;
   break L1;
  }
 case 11:
  {
   i4 = (HEAP32[i1 >> 2] | 0) + (4 - 1) & ~(4 - 1);
   i3 = HEAP32[i4 >> 2] | 0;
   HEAP32[i1 >> 2] = i4 + 4;
   i4 = i2;
   HEAP32[i4 >> 2] = i3;
   HEAP32[i4 + 4 >> 2] = 0;
   break L1;
  }
 case 12:
  {
   i4 = (HEAP32[i1 >> 2] | 0) + (8 - 1) & ~(8 - 1);
   i3 = i4;
   i5 = HEAP32[i3 >> 2] | 0;
   i3 = HEAP32[i3 + 4 >> 2] | 0;
   HEAP32[i1 >> 2] = i4 + 8;
   i4 = i2;
   HEAP32[i4 >> 2] = i5;
   HEAP32[i4 + 4 >> 2] = i3;
   break L1;
  }
 case 13:
  {
   i5 = (HEAP32[i1 >> 2] | 0) + (4 - 1) & ~(4 - 1);
   i4 = HEAP32[i5 >> 2] | 0;
   HEAP32[i1 >> 2] = i5 + 4;
   i4 = (i4 & 65535) << 16 >> 16;
   i5 = i2;
   HEAP32[i5 >> 2] = i4;
   HEAP32[i5 + 4 >> 2] = ((i4 | 0) < 0) << 31 >> 31;
   break L1;
  }
 case 14:
  {
   i5 = (HEAP32[i1 >> 2] | 0) + (4 - 1) & ~(4 - 1);
   i4 = HEAP32[i5 >> 2] | 0;
   HEAP32[i1 >> 2] = i5 + 4;
   i5 = i2;
   HEAP32[i5 >> 2] = i4 & 65535;
   HEAP32[i5 + 4 >> 2] = 0;
   break L1;
  }
 case 15:
  {
   i5 = (HEAP32[i1 >> 2] | 0) + (4 - 1) & ~(4 - 1);
   i4 = HEAP32[i5 >> 2] | 0;
   HEAP32[i1 >> 2] = i5 + 4;
   i4 = (i4 & 255) << 24 >> 24;
   i5 = i2;
   HEAP32[i5 >> 2] = i4;
   HEAP32[i5 + 4 >> 2] = ((i4 | 0) < 0) << 31 >> 31;
   break L1;
  }
 case 16:
  {
   i5 = (HEAP32[i1 >> 2] | 0) + (4 - 1) & ~(4 - 1);
   i4 = HEAP32[i5 >> 2] | 0;
   HEAP32[i1 >> 2] = i5 + 4;
   i5 = i2;
   HEAP32[i5 >> 2] = i4 & 255;
   HEAP32[i5 + 4 >> 2] = 0;
   break L1;
  }
 case 17:
  {
   i5 = (HEAP32[i1 >> 2] | 0) + (8 - 1) & ~(8 - 1);
   d6 = +HEAPF64[i5 >> 3];
   HEAP32[i1 >> 2] = i5 + 8;
   HEAPF64[i2 >> 3] = d6;
   break L1;
  }
 case 18:
  {
   i5 = (HEAP32[i1 >> 2] | 0) + (8 - 1) & ~(8 - 1);
   d6 = +HEAPF64[i5 >> 3];
   HEAP32[i1 >> 2] = i5 + 8;
   HEAPF64[i2 >> 3] = d6;
   break L1;
  }
 default:
  break L1;
 } while (0); while (0);
 return;
}

function _lodepng_decode_memory(i8, i9, i5, i6, i7, i4, i3) {
 i8 = i8 | 0;
 i9 = i9 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 i7 = i7 | 0;
 i4 = i4 | 0;
 i3 = i3 | 0;
 var i1 = 0, i2 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0;
 i15 = STACKTOP;
 STACKTOP = STACKTOP + 304 | 0;
 i14 = i15;
 HEAP32[i14 + 20 >> 2] = 1;
 HEAP32[i14 + 24 >> 2] = 1;
 HEAP32[i14 + 28 >> 2] = 0;
 HEAP32[i14 >> 2] = 0;
 HEAP32[i14 + 4 >> 2] = 0;
 HEAP32[i14 + 8 >> 2] = 0;
 HEAP32[i14 + 12 >> 2] = 0;
 HEAP32[i14 + 16 >> 2] = 0;
 HEAP32[i14 + 32 >> 2] = 2;
 HEAP32[i14 + 36 >> 2] = 1;
 HEAP32[i14 + 40 >> 2] = 2048;
 HEAP32[i14 + 44 >> 2] = 3;
 HEAP32[i14 + 48 >> 2] = 128;
 HEAP32[i14 + 52 >> 2] = 1;
 HEAP32[i14 + 56 >> 2] = 0;
 HEAP32[i14 + 60 >> 2] = 0;
 HEAP32[i14 + 64 >> 2] = 0;
 HEAP32[i14 + 72 >> 2] = 1;
 HEAP32[i14 + 76 >> 2] = 1;
 HEAP32[i14 + 68 >> 2] = 1;
 HEAP32[i14 + 84 >> 2] = 0;
 HEAP32[i14 + 80 >> 2] = 0;
 HEAP32[i14 + 88 >> 2] = 0;
 HEAP32[i14 + 92 >> 2] = 1;
 i1 = i14 + 112 | 0;
 i2 = i14 + 96 | 0;
 HEAP32[i1 >> 2] = 0;
 HEAP32[i1 + 4 >> 2] = 0;
 HEAP32[i1 + 8 >> 2] = 0;
 HEAP32[i1 + 12 >> 2] = 0;
 i1 = i14 + 100 | 0;
 i12 = i14 + 104 | 0;
 HEAP32[i12 >> 2] = 0;
 i13 = i14 + 108 | 0;
 HEAP32[i13 >> 2] = 0;
 i10 = i14 + 156 | 0;
 HEAP32[i10 >> 2] = 0;
 HEAP32[i10 + 4 >> 2] = 0;
 HEAP32[i10 + 8 >> 2] = 0;
 HEAP32[i10 + 12 >> 2] = 0;
 HEAP32[i14 + 140 >> 2] = 6;
 HEAP32[i14 + 144 >> 2] = 8;
 HEAP32[i14 + 148 >> 2] = 0;
 HEAP32[i14 + 152 >> 2] = 0;
 HEAP32[i14 + 136 >> 2] = 0;
 HEAP32[i14 + 128 >> 2] = 0;
 HEAP32[i14 + 132 >> 2] = 0;
 HEAP32[i14 + 248 >> 2] = 0;
 i10 = i14 + 264 | 0;
 HEAP32[i10 >> 2] = 0;
 HEAP32[i10 + 4 >> 2] = 0;
 HEAP32[i10 + 8 >> 2] = 0;
 HEAP32[i10 + 12 >> 2] = 0;
 HEAP32[i10 + 16 >> 2] = 0;
 HEAP32[i10 + 20 >> 2] = 0;
 i10 = i14 + 172 | 0;
 i11 = i10 + 52 | 0;
 do {
  HEAP32[i10 >> 2] = 0;
  i10 = i10 + 4 | 0;
 } while ((i10 | 0) < (i11 | 0));
 HEAP32[i14 + 288 >> 2] = 1;
 HEAP32[i2 >> 2] = i4;
 HEAP32[i1 >> 2] = i3;
 i1 = _lodepng_decode(i8, i9, i5, i14, i6, i7) | 0;
 i2 = HEAP32[i12 >> 2] | 0;
 if (!i2) {
  HEAP32[i12 >> 2] = 0;
  HEAP32[i13 >> 2] = 0;
  i14 = i14 + 128 | 0;
  _lodepng_info_cleanup(i14);
  STACKTOP = i15;
  return i1 | 0;
 }
 _free(i2);
 HEAP32[i12 >> 2] = 0;
 HEAP32[i13 >> 2] = 0;
 i14 = i14 + 128 | 0;
 _lodepng_info_cleanup(i14);
 STACKTOP = i15;
 return i1 | 0;
}

function _sdscatsds(i3, i4) {
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i1 = 0, i2 = 0;
 i1 = HEAPU8[i4 + -1 >> 0] | 0;
 switch (i1 & 7 | 0) {
 case 0:
  {
   i1 = i1 >>> 3;
   break;
  }
 case 1:
  {
   i1 = HEAPU8[i4 + -3 >> 0] | 0;
   break;
  }
 case 2:
  {
   i1 = i4 + -5 | 0;
   i1 = (HEAPU8[i1 >> 0] | HEAPU8[i1 + 1 >> 0] << 8) & 65535;
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
 case 4:
  {
   i2 = i3 + -17 | 0;
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
 case 0:
  {
   HEAP8[i2 >> 0] = i1 << 3;
   break;
  }
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
 case 1:
  {
   i1 = HEAPU8[i6 + -3 >> 0] | 0;
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
 case 4:
  {
   i1 = i6 + -17 | 0;
   i1 = HEAPU8[i1 >> 0] | HEAPU8[i1 + 1 >> 0] << 8 | HEAPU8[i1 + 2 >> 0] << 16 | HEAPU8[i1 + 3 >> 0] << 24;
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

function _getPixelColorRGBA16(i7, i3, i2, i1, i5, i4, i6) {
 i7 = i7 | 0;
 i3 = i3 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 i5 = i5 | 0;
 i4 = i4 | 0;
 i6 = i6 | 0;
 var i8 = 0, i9 = 0, i10 = 0, i11 = 0;
 switch (HEAP32[i6 >> 2] | 0) {
 case 0:
  {
   i8 = i4 << 1;
   i4 = i5 + i8 | 0;
   i5 = i5 + (i8 | 1) | 0;
   i8 = ((HEAPU8[i4 >> 0] | 0) << 8 | (HEAPU8[i5 >> 0] | 0)) & 65535;
   HEAP16[i2 >> 1] = i8;
   HEAP16[i3 >> 1] = i8;
   HEAP16[i7 >> 1] = i8;
   if ((HEAP32[i6 + 16 >> 2] | 0) != 0 ? ((HEAPU8[i4 >> 0] | 0) << 8 | (HEAPU8[i5 >> 0] | 0) | 0) == (HEAP32[i6 + 20 >> 2] | 0) : 0) {
    HEAP16[i1 >> 1] = 0;
    return;
   }
   HEAP16[i1 >> 1] = -1;
   return;
  }
 case 2:
  {
   i8 = i4 * 6 | 0;
   i11 = i5 + i8 | 0;
   i10 = i5 + (i8 | 1) | 0;
   HEAP16[i7 >> 1] = (HEAPU8[i11 >> 0] | 0) << 8 | (HEAPU8[i10 >> 0] | 0);
   i9 = i5 + (i8 + 2) | 0;
   i4 = i5 + (i8 + 3) | 0;
   HEAP16[i3 >> 1] = (HEAPU8[i9 >> 0] | 0) << 8 | (HEAPU8[i4 >> 0] | 0);
   i7 = i5 + (i8 + 4) | 0;
   i8 = i5 + (i8 + 5) | 0;
   HEAP16[i2 >> 1] = (HEAPU8[i7 >> 0] | 0) << 8 | (HEAPU8[i8 >> 0] | 0);
   if ((((HEAP32[i6 + 16 >> 2] | 0) != 0 ? ((HEAPU8[i11 >> 0] | 0) << 8 | (HEAPU8[i10 >> 0] | 0) | 0) == (HEAP32[i6 + 20 >> 2] | 0) : 0) ? ((HEAPU8[i9 >> 0] | 0) << 8 | (HEAPU8[i4 >> 0] | 0) | 0) == (HEAP32[i6 + 24 >> 2] | 0) : 0) ? ((HEAPU8[i7 >> 0] | 0) << 8 | (HEAPU8[i8 >> 0] | 0) | 0) == (HEAP32[i6 + 28 >> 2] | 0) : 0) {
    HEAP16[i1 >> 1] = 0;
    return;
   }
   HEAP16[i1 >> 1] = -1;
   return;
  }
 case 4:
  {
   i11 = i4 << 2;
   i10 = ((HEAPU8[i5 + i11 >> 0] | 0) << 8 | (HEAPU8[i5 + (i11 | 1) >> 0] | 0)) & 65535;
   HEAP16[i2 >> 1] = i10;
   HEAP16[i3 >> 1] = i10;
   HEAP16[i7 >> 1] = i10;
   HEAP16[i1 >> 1] = (HEAPU8[i5 + (i11 | 2) >> 0] | 0) << 8 | (HEAPU8[i5 + (i11 | 3) >> 0] | 0);
   return;
  }
 case 6:
  {
   i11 = i4 << 3;
   HEAP16[i7 >> 1] = (HEAPU8[i5 + i11 >> 0] | 0) << 8 | (HEAPU8[i5 + (i11 | 1) >> 0] | 0);
   HEAP16[i3 >> 1] = (HEAPU8[i5 + (i11 | 2) >> 0] | 0) << 8 | (HEAPU8[i5 + (i11 | 3) >> 0] | 0);
   HEAP16[i2 >> 1] = (HEAPU8[i5 + (i11 | 4) >> 0] | 0) << 8 | (HEAPU8[i5 + (i11 | 5) >> 0] | 0);
   HEAP16[i1 >> 1] = (HEAPU8[i5 + (i11 | 6) >> 0] | 0) << 8 | (HEAPU8[i5 + (i11 | 7) >> 0] | 0);
   return;
  }
 default:
  return;
 }
}

function ___stdio_write(i14, i2, i1) {
 i14 = i14 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i15 = 0;
 i15 = STACKTOP;
 STACKTOP = STACKTOP + 48 | 0;
 i11 = i15 + 16 | 0;
 i10 = i15;
 i3 = i15 + 32 | 0;
 i12 = i14 + 28 | 0;
 i4 = HEAP32[i12 >> 2] | 0;
 HEAP32[i3 >> 2] = i4;
 i13 = i14 + 20 | 0;
 i4 = (HEAP32[i13 >> 2] | 0) - i4 | 0;
 HEAP32[i3 + 4 >> 2] = i4;
 HEAP32[i3 + 8 >> 2] = i2;
 HEAP32[i3 + 12 >> 2] = i1;
 i8 = i14 + 60 | 0;
 i9 = i14 + 44 | 0;
 i2 = 2;
 i4 = i4 + i1 | 0;
 while (1) {
  if (!(HEAP32[735] | 0)) {
   HEAP32[i11 >> 2] = HEAP32[i8 >> 2];
   HEAP32[i11 + 4 >> 2] = i3;
   HEAP32[i11 + 8 >> 2] = i2;
   i6 = ___syscall_ret(___syscall146(146, i11 | 0) | 0) | 0;
  } else {
   _pthread_cleanup_push(20, i14 | 0);
   HEAP32[i10 >> 2] = HEAP32[i8 >> 2];
   HEAP32[i10 + 4 >> 2] = i3;
   HEAP32[i10 + 8 >> 2] = i2;
   i6 = ___syscall_ret(___syscall146(146, i10 | 0) | 0) | 0;
   _pthread_cleanup_pop(0);
  }
  if ((i4 | 0) == (i6 | 0)) {
   i4 = 6;
   break;
  }
  if ((i6 | 0) < 0) {
   i4 = 8;
   break;
  }
  i4 = i4 - i6 | 0;
  i5 = HEAP32[i3 + 4 >> 2] | 0;
  if (i6 >>> 0 <= i5 >>> 0) if ((i2 | 0) == 2) {
   HEAP32[i12 >> 2] = (HEAP32[i12 >> 2] | 0) + i6;
   i7 = i5;
   i2 = 2;
  } else i7 = i5; else {
   i7 = HEAP32[i9 >> 2] | 0;
   HEAP32[i12 >> 2] = i7;
   HEAP32[i13 >> 2] = i7;
   i7 = HEAP32[i3 + 12 >> 2] | 0;
   i6 = i6 - i5 | 0;
   i3 = i3 + 8 | 0;
   i2 = i2 + -1 | 0;
  }
  HEAP32[i3 >> 2] = (HEAP32[i3 >> 2] | 0) + i6;
  HEAP32[i3 + 4 >> 2] = i7 - i6;
 }
 if ((i4 | 0) == 6) {
  i11 = HEAP32[i9 >> 2] | 0;
  HEAP32[i14 + 16 >> 2] = i11 + (HEAP32[i14 + 48 >> 2] | 0);
  i14 = i11;
  HEAP32[i12 >> 2] = i14;
  HEAP32[i13 >> 2] = i14;
 } else if ((i4 | 0) == 8) {
  HEAP32[i14 + 16 >> 2] = 0;
  HEAP32[i12 >> 2] = 0;
  HEAP32[i13 >> 2] = 0;
  HEAP32[i14 >> 2] = HEAP32[i14 >> 2] | 32;
  if ((i2 | 0) == 2) i1 = 0; else i1 = i1 - (HEAP32[i3 + 4 >> 2] | 0) | 0;
 }
 STACKTOP = i15;
 return i1 | 0;
}

function _sdsrange(i6, i3, i2) {
 i6 = i6 | 0;
 i3 = i3 | 0;
 i2 = i2 | 0;
 var i1 = 0, i4 = 0, i5 = 0;
 i5 = i6 + -1 | 0;
 i1 = HEAPU8[i5 >> 0] | 0;
 switch (i1 & 7 | 0) {
 case 0:
  {
   i4 = i1 >>> 3;
   break;
  }
 case 1:
  {
   i4 = HEAPU8[i6 + -3 >> 0] | 0;
   break;
  }
 case 2:
  {
   i4 = i6 + -5 | 0;
   i4 = (HEAPU8[i4 >> 0] | HEAPU8[i4 + 1 >> 0] << 8) & 65535;
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
 default:
  return;
 }
}

function _par_zcam_tick(f6, f1) {
 f6 = Math_fround(f6);
 f1 = Math_fround(f1);
 var d2 = 0.0, i3 = 0, i4 = 0, i5 = 0, i7 = 0, d8 = 0.0, d9 = 0.0, d10 = 0.0, d11 = 0.0;
 i7 = STACKTOP;
 STACKTOP = STACKTOP + 80 | 0;
 i3 = i7 + 48 | 0;
 i4 = i7 + 16 | 0;
 i5 = i7;
 d2 = +f6;
 if (!(+HEAPF64[9] != d2)) {
  STACKTOP = i7;
  return;
 }
 HEAPF64[9] = d2;
 d10 = +HEAPF64[6];
 d9 = +HEAPF64[7];
 d11 = +Math_fround(+Math_tan(+Math_fround(1.5707963705062866 - +HEAPF64[8] * .5)));
 d8 = 1.0 / (d10 - d9);
 HEAP32[i3 >> 2] = 0;
 HEAP32[i3 + 4 >> 2] = 0;
 HEAP32[i3 + 8 >> 2] = 0;
 HEAP32[i3 + 12 >> 2] = 0;
 HEAP32[i3 + 16 >> 2] = 0;
 HEAP32[i3 + 20 >> 2] = 0;
 HEAP32[i3 + 24 >> 2] = 0;
 HEAP32[i3 + 28 >> 2] = 0;
 HEAP32[i4 >> 2] = 0;
 HEAP32[i4 + 4 >> 2] = 0;
 HEAP32[i4 + 8 >> 2] = 0;
 HEAP32[i4 + 12 >> 2] = 0;
 HEAP32[i4 + 16 >> 2] = 0;
 HEAP32[i4 + 20 >> 2] = 0;
 HEAP32[i4 + 24 >> 2] = 0;
 HEAP32[i4 + 28 >> 2] = 0;
 HEAP32[i5 >> 2] = 0;
 HEAP32[i5 + 4 >> 2] = 0;
 HEAP32[i5 + 8 >> 2] = 0;
 HEAP32[i5 + 12 >> 2] = 0;
 HEAPF64[10] = d11 / d2;
 HEAP32[22] = HEAP32[i3 >> 2];
 HEAP32[23] = HEAP32[i3 + 4 >> 2];
 HEAP32[24] = HEAP32[i3 + 8 >> 2];
 HEAP32[25] = HEAP32[i3 + 12 >> 2];
 HEAP32[26] = HEAP32[i3 + 16 >> 2];
 HEAP32[27] = HEAP32[i3 + 20 >> 2];
 HEAP32[28] = HEAP32[i3 + 24 >> 2];
 HEAP32[29] = HEAP32[i3 + 28 >> 2];
 HEAPF64[15] = d11;
 HEAP32[32] = HEAP32[i4 >> 2];
 HEAP32[33] = HEAP32[i4 + 4 >> 2];
 HEAP32[34] = HEAP32[i4 + 8 >> 2];
 HEAP32[35] = HEAP32[i4 + 12 >> 2];
 HEAP32[36] = HEAP32[i4 + 16 >> 2];
 HEAP32[37] = HEAP32[i4 + 20 >> 2];
 HEAP32[38] = HEAP32[i4 + 24 >> 2];
 HEAP32[39] = HEAP32[i4 + 28 >> 2];
 HEAPF64[20] = (d10 + d9) * d8;
 HEAPF64[21] = -1.0;
 HEAP32[44] = HEAP32[i5 >> 2];
 HEAP32[45] = HEAP32[i5 + 4 >> 2];
 HEAP32[46] = HEAP32[i5 + 8 >> 2];
 HEAP32[47] = HEAP32[i5 + 12 >> 2];
 HEAPF64[24] = d10 * d9 * d8 * 2.0;
 HEAPF64[25] = 0.0;
 STACKTOP = i7;
 return;
}

function _lodepng_add_text(i3, i4, i7) {
 i3 = i3 | 0;
 i4 = i4 | 0;
 i7 = i7 | 0;
 var i1 = 0, i2 = 0, i5 = 0, i6 = 0, i8 = 0;
 i1 = i3 + 64 | 0;
 i6 = i3 + 60 | 0;
 i2 = _realloc(HEAP32[i1 >> 2] | 0, (HEAP32[i6 >> 2] << 2) + 4 | 0) | 0;
 i5 = i3 + 68 | 0;
 i3 = _realloc(HEAP32[i5 >> 2] | 0, (HEAP32[i6 >> 2] << 2) + 4 | 0) | 0;
 if (!((i2 | 0) != 0 & (i3 | 0) != 0)) {
  _free(i2);
  _free(i3);
  i7 = 83;
  return i7 | 0;
 }
 i8 = HEAP32[i6 >> 2] | 0;
 HEAP32[i6 >> 2] = i8 + 1;
 HEAP32[i1 >> 2] = i2;
 HEAP32[i5 >> 2] = i3;
 i3 = i2 + (i8 << 2) | 0;
 HEAP32[i3 >> 2] = 0;
 i2 = _realloc(0, 1) | 0;
 if (i2) {
  HEAP8[i2 >> 0] = 0;
  HEAP32[i3 >> 2] = i2;
 }
 i2 = (HEAP32[i1 >> 2] | 0) + ((HEAP32[i6 >> 2] | 0) + -1 << 2) | 0;
 i1 = _strlen(i4) | 0;
 i3 = _realloc(HEAP32[i2 >> 2] | 0, i1 + 1 | 0) | 0;
 if (((i3 | 0) != 0 ? (HEAP8[i3 + i1 >> 0] = 0, HEAP32[i2 >> 2] = i3, (i1 | 0) != 0) : 0) ? (HEAP8[i3 >> 0] = HEAP8[i4 >> 0] | 0, (i1 | 0) != 1) : 0) {
  i3 = 1;
  do {
   HEAP8[(HEAP32[i2 >> 2] | 0) + i3 >> 0] = HEAP8[i4 + i3 >> 0] | 0;
   i3 = i3 + 1 | 0;
  } while ((i3 | 0) != (i1 | 0));
 }
 i1 = (HEAP32[i5 >> 2] | 0) + ((HEAP32[i6 >> 2] | 0) + -1 << 2) | 0;
 HEAP32[i1 >> 2] = 0;
 i2 = _realloc(0, 1) | 0;
 if (i2) {
  HEAP8[i2 >> 0] = 0;
  HEAP32[i1 >> 2] = i2;
 }
 i2 = (HEAP32[i5 >> 2] | 0) + ((HEAP32[i6 >> 2] | 0) + -1 << 2) | 0;
 i3 = _strlen(i7) | 0;
 i1 = _realloc(HEAP32[i2 >> 2] | 0, i3 + 1 | 0) | 0;
 if (!i1) {
  i8 = 0;
  return i8 | 0;
 }
 HEAP8[i1 + i3 >> 0] = 0;
 HEAP32[i2 >> 2] = i1;
 if (!i3) {
  i8 = 0;
  return i8 | 0;
 }
 HEAP8[i1 >> 0] = HEAP8[i7 >> 0] | 0;
 if ((i3 | 0) == 1) {
  i8 = 0;
  return i8 | 0;
 } else i1 = 1;
 do {
  HEAP8[(HEAP32[i2 >> 2] | 0) + i1 >> 0] = HEAP8[i7 + i1 >> 0] | 0;
  i1 = i1 + 1 | 0;
 } while ((i1 | 0) != (i3 | 0));
 i1 = 0;
 return i1 | 0;
}

function __ZN53EmscriptenBindingInitializer_native_and_builtin_typesC2Ev(i1) {
 i1 = i1 | 0;
 __embind_register_void(640, 5886);
 __embind_register_bool(656, 5891, 1, 1, 0);
 __embind_register_integer(664, 5896, 1, -128, 127);
 __embind_register_integer(680, 5901, 1, -128, 127);
 __embind_register_integer(672, 5913, 1, 0, 255);
 __embind_register_integer(688, 5927, 2, -32768, 32767);
 __embind_register_integer(696, 5933, 2, 0, 65535);
 __embind_register_integer(704, 5948, 4, -2147483648, 2147483647);
 __embind_register_integer(712, 5952, 4, 0, -1);
 __embind_register_integer(720, 5965, 4, -2147483648, 2147483647);
 __embind_register_integer(728, 5970, 4, 0, -1);
 __embind_register_float(736, 5984, 4);
 __embind_register_float(744, 5990, 8);
 __embind_register_std_string(312, 5997);
 __embind_register_std_string(384, 6009);
 __embind_register_std_wstring(408, 4, 6042);
 __embind_register_emval(344, 6055);
 __embind_register_memory_view(432, 0, 6071);
 __embind_register_memory_view(440, 0, 6101);
 __embind_register_memory_view(448, 1, 6138);
 __embind_register_memory_view(456, 2, 6177);
 __embind_register_memory_view(464, 3, 6208);
 __embind_register_memory_view(472, 4, 6248);
 __embind_register_memory_view(480, 5, 6277);
 __embind_register_memory_view(488, 4, 6315);
 __embind_register_memory_view(496, 5, 6345);
 __embind_register_memory_view(440, 0, 6384);
 __embind_register_memory_view(448, 1, 6416);
 __embind_register_memory_view(456, 2, 6449);
 __embind_register_memory_view(464, 3, 6482);
 __embind_register_memory_view(472, 4, 6516);
 __embind_register_memory_view(480, 5, 6549);
 __embind_register_memory_view(504, 6, 6583);
 __embind_register_memory_view(512, 7, 6614);
 __embind_register_memory_view(520, 7, 6646);
 return;
}

function _par_zcam_dmatrices(i4, i1, i5) {
 i4 = i4 | 0;
 i1 = i1 | 0;
 i5 = i5 | 0;
 var i2 = 0, i3 = 0, d6 = 0.0, d7 = 0.0, d8 = 0.0, d9 = 0.0, d10 = 0.0, d11 = 0.0, d12 = 0.0, d13 = 0.0, d14 = 0.0, d15 = 0.0, d16 = 0.0, d17 = 0.0;
 i2 = 80;
 i3 = i1 + 128 | 0;
 do {
  HEAP32[i1 >> 2] = HEAP32[i2 >> 2];
  i1 = i1 + 4 | 0;
  i2 = i2 + 4 | 0;
 } while ((i1 | 0) < (i3 | 0));
 d11 = +HEAPF64[2];
 d9 = +HEAPF64[3];
 d7 = +HEAPF64[4];
 d10 = d11 - d11;
 d8 = d9 - d9;
 d6 = +Math_fround(Math_fround(1.0) / Math_fround(Math_sqrt(Math_fround(d7 * d7 + (d10 * d10 + d8 * d8)))));
 d10 = d10 * d6;
 d8 = d8 * d6;
 d6 = d7 * d6;
 d15 = d8 * 0.0;
 d17 = d6 - d15;
 d16 = d10 * 0.0 - d6 * 0.0;
 d15 = d15 - d10;
 d14 = +Math_fround(Math_fround(1.0) / Math_fround(Math_sqrt(Math_fround(d15 * d15 + (d17 * d17 + d16 * d16)))));
 d17 = d14 * d17;
 d16 = d14 * d16;
 d15 = d14 * d15;
 d14 = d8 * d15 - d6 * d16;
 d13 = d6 * d17 - d10 * d15;
 d12 = d10 * d16 - d8 * d17;
 HEAPF64[i5 >> 3] = d17;
 HEAPF64[i5 + 8 >> 3] = d14;
 HEAPF64[i5 + 16 >> 3] = d10;
 HEAPF64[i5 + 24 >> 3] = 0.0;
 HEAPF64[i5 + 32 >> 3] = d16;
 HEAPF64[i5 + 40 >> 3] = d13;
 HEAPF64[i5 + 48 >> 3] = d8;
 HEAPF64[i5 + 56 >> 3] = 0.0;
 HEAPF64[i5 + 64 >> 3] = d15;
 HEAPF64[i5 + 72 >> 3] = d12;
 HEAPF64[i5 + 80 >> 3] = d6;
 HEAPF64[i5 + 88 >> 3] = 0.0;
 HEAPF64[i5 + 96 >> 3] = -(d11 * d17 + (d9 * d16 + d7 * d15));
 HEAPF64[i5 + 104 >> 3] = -(d11 * d14 + (d9 * d13 + d7 * d12));
 HEAPF64[i5 + 112 >> 3] = -(d11 * d10 + (d9 * d8 + d7 * d6));
 HEAPF64[i5 + 120 >> 3] = 1.0;
 HEAP32[i4 >> 2] = HEAP32[4];
 HEAP32[i4 + 4 >> 2] = HEAP32[5];
 HEAP32[i4 + 8 >> 2] = HEAP32[6];
 HEAP32[i4 + 12 >> 2] = HEAP32[7];
 HEAP32[i4 + 16 >> 2] = HEAP32[8];
 HEAP32[i4 + 20 >> 2] = HEAP32[9];
 return;
}

function _sdscat(i1, i5) {
 i1 = i1 | 0;
 i5 = i5 | 0;
 var i2 = 0, i3 = 0, i4 = 0;
 i3 = _strlen(i5) | 0;
 i2 = HEAPU8[i1 + -1 >> 0] | 0;
 switch (i2 & 7 | 0) {
 case 0:
  {
   i2 = i2 >>> 3;
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
 case 3:
  {
   i2 = i1 + -9 | 0;
   i2 = HEAPU8[i2 >> 0] | HEAPU8[i2 + 1 >> 0] << 8 | HEAPU8[i2 + 2 >> 0] << 16 | HEAPU8[i2 + 3 >> 0] << 24;
   break;
  }
 case 4:
  {
   i2 = i1 + -17 | 0;
   i2 = HEAPU8[i2 >> 0] | HEAPU8[i2 + 1 >> 0] << 8 | HEAPU8[i2 + 2 >> 0] << 16 | HEAPU8[i2 + 3 >> 0] << 24;
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

function _Adam7_getpassvalues(i14, i12, i10, i11, i13, i1, i2, i9) {
 i14 = i14 | 0;
 i12 = i12 | 0;
 i10 = i10 | 0;
 i11 = i11 | 0;
 i13 = i13 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i9 = i9 | 0;
 var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0;
 i4 = i1 + -1 | 0;
 i2 = i2 + -1 | 0;
 i3 = 0;
 do {
  i7 = HEAP32[2484 + (i3 << 2) >> 2] | 0;
  i1 = i14 + (i3 << 2) | 0;
  HEAP32[i1 >> 2] = ((i4 + i7 - (HEAP32[2456 + (i3 << 2) >> 2] | 0) | 0) >>> 0) / (i7 >>> 0) | 0;
  i7 = HEAP32[2428 + (i3 << 2) >> 2] | 0;
  i7 = ((i2 + i7 - (HEAP32[2400 + (i3 << 2) >> 2] | 0) | 0) >>> 0) / (i7 >>> 0) | 0;
  i6 = i12 + (i3 << 2) | 0;
  HEAP32[i6 >> 2] = i7;
  i7 = (HEAP32[i1 >> 2] | 0) == 0 ? 0 : i7;
  HEAP32[i6 >> 2] = i7;
  if (!i7) HEAP32[i1 >> 2] = 0;
  i3 = i3 + 1 | 0;
 } while ((i3 | 0) != 7);
 HEAP32[i13 >> 2] = 0;
 HEAP32[i11 >> 2] = 0;
 HEAP32[i10 >> 2] = 0;
 i6 = 0;
 i7 = 0;
 while (1) {
  i5 = i14 + (i7 << 2) | 0;
  i4 = HEAP32[i5 >> 2] | 0;
  i1 = i12 + (i7 << 2) | 0;
  if ((i4 | 0) != 0 ? (i8 = HEAP32[i1 >> 2] | 0, (i8 | 0) != 0) : 0) i4 = Math_imul(i8, (((Math_imul(i4, i9) | 0) + 7 | 0) >>> 3) + 1 | 0) | 0; else i4 = 0;
  i3 = i7 + 1 | 0;
  i2 = i10 + (i3 << 2) | 0;
  HEAP32[i2 >> 2] = i4 + i6;
  i6 = (Math_imul(((Math_imul(HEAP32[i5 >> 2] | 0, i9) | 0) + 7 | 0) >>> 3, HEAP32[i1 >> 2] | 0) | 0) + (HEAP32[i11 + (i7 << 2) >> 2] | 0) | 0;
  HEAP32[i11 + (i3 << 2) >> 2] = i6;
  i7 = (((Math_imul(Math_imul(HEAP32[i1 >> 2] | 0, i9) | 0, HEAP32[i5 >> 2] | 0) | 0) + 7 | 0) >>> 3) + (HEAP32[i13 + (i7 << 2) >> 2] | 0) | 0;
  HEAP32[i13 + (i3 << 2) >> 2] = i7;
  if ((i3 | 0) == 7) break;
  i6 = HEAP32[i2 >> 2] | 0;
  i7 = i3;
 }
 return;
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

function _lodepng_zlib_decompress(i8, i7, i4, i5, i6) {
 i8 = i8 | 0;
 i7 = i7 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i9 = 0;
 if (i5 >>> 0 < 2) {
  i9 = 53;
  return i9 | 0;
 }
 i3 = HEAP8[i4 >> 0] | 0;
 i2 = i3 & 255;
 i1 = HEAPU8[i4 + 1 >> 0] | 0;
 if (((i2 << 8 | i1) >>> 0) % 31 | 0) {
  i9 = 24;
  return i9 | 0;
 }
 if (i3 << 24 >> 24 < 0 | (i2 & 15 | 0) != 8) {
  i9 = 25;
  return i9 | 0;
 }
 if (i1 & 32) {
  i9 = 26;
  return i9 | 0;
 }
 i3 = i4 + 2 | 0;
 i1 = i5 + -2 | 0;
 i2 = HEAP32[i6 + 8 >> 2] | 0;
 if (!i2) i3 = _lodepng_inflate(i8, i7, i3, i1, 0) | 0; else i3 = FUNCTION_TABLE_iiiiii[i2 & 0](i8, i7, i3, i1, i6) | 0;
 if (i3) {
  i9 = i3;
  return i9 | 0;
 }
 if (!(HEAP32[i6 >> 2] | 0)) {
  i9 = (HEAPU8[i4 + (i5 + -3) >> 0] | 0) << 16 | (HEAPU8[i4 + (i5 + -4) >> 0] | 0) << 24 | (HEAPU8[i4 + i1 >> 0] | 0) << 8 | (HEAPU8[i4 + (i5 + -1) >> 0] | 0);
  i2 = HEAP32[i7 >> 2] | 0;
  if (!i2) {
   i3 = 1;
   i1 = 0;
  } else {
   i6 = HEAP32[i8 >> 2] | 0;
   i8 = i2;
   i1 = 1;
   i2 = 0;
   do {
    i3 = i8 >>> 0 > 5550 ? 5550 : i8;
    i7 = i8;
    i8 = i8 - i3 | 0;
    if (i3) {
     i5 = i6;
     i4 = i3;
     while (1) {
      i1 = (HEAPU8[i5 >> 0] | 0) + i1 | 0;
      i2 = i1 + i2 | 0;
      i4 = i4 + -1 | 0;
      if (!i4) break; else i5 = i5 + 1 | 0;
     }
     i6 = i6 + (i7 >>> 0 < 5550 ? i7 : 5550) | 0;
    }
    i1 = (i1 >>> 0) % 65521 | 0;
    i2 = (i2 >>> 0) % 65521 | 0;
   } while ((i7 | 0) != (i3 | 0));
   i3 = i1;
   i1 = i2 << 16;
  }
  if ((i3 | i1 | 0) != (i9 | 0)) {
   i9 = 58;
   return i9 | 0;
  }
 }
 i9 = 0;
 return i9 | 0;
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
 i3 = i13 + 16 | 0;
 i2 = i13 + 20 | 0;
 i1 = i13 + 24 | 0;
 i4 = i13 + 28 | 0;
 i5 = i13 + 32 | 0;
 i6 = i13 + 40 | 0;
 i7 = (i11 | 0) == (i12 | 0);
 i8 = i3;
 i9 = i8 + 36 | 0;
 do {
  HEAP32[i8 >> 2] = 0;
  i8 = i8 + 4 | 0;
 } while ((i8 | 0) < (i9 | 0));
 HEAP16[i3 + 36 >> 1] = 0;
 HEAP8[i3 + 38 >> 0] = 0;
 L1 : do if (i7) {
  HEAP32[i13 + 48 >> 2] = 1;
  FUNCTION_TABLE_viiiiii[HEAP32[(HEAP32[i12 >> 2] | 0) + 20 >> 2] & 3](i12, i13, i10, i10, 1, 0);
  i1 = (HEAP32[i1 >> 2] | 0) == 1 ? i10 : 0;
 } else {
  FUNCTION_TABLE_viiiii[HEAP32[(HEAP32[i11 >> 2] | 0) + 24 >> 2] & 3](i11, i13, i10, 1, 0);
  switch (HEAP32[i13 + 36 >> 2] | 0) {
  case 0:
   {
    i1 = (HEAP32[i6 >> 2] | 0) == 1 & (HEAP32[i4 >> 2] | 0) == 1 & (HEAP32[i5 >> 2] | 0) == 1 ? HEAP32[i2 >> 2] | 0 : 0;
    break L1;
   }
  case 1:
   break;
  default:
   {
    i1 = 0;
    break L1;
   }
  }
  if ((HEAP32[i1 >> 2] | 0) != 1 ? !((HEAP32[i6 >> 2] | 0) == 0 & (HEAP32[i4 >> 2] | 0) == 1 & (HEAP32[i5 >> 2] | 0) == 1) : 0) {
   i1 = 0;
   break;
  }
  i1 = HEAP32[i3 >> 2] | 0;
 } while (0);
 STACKTOP = i14;
 return i1 | 0;
}

function _vfprintf(i15, i11, i2) {
 i15 = i15 | 0;
 i11 = i11 | 0;
 i2 = i2 | 0;
 var i1 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i12 = 0, i13 = 0, i14 = 0, i16 = 0;
 i16 = STACKTOP;
 STACKTOP = STACKTOP + 224 | 0;
 i10 = i16 + 80 | 0;
 i14 = i16 + 96 | 0;
 i13 = i16;
 i12 = i16 + 136 | 0;
 i1 = i14;
 i3 = i1 + 40 | 0;
 do {
  HEAP32[i1 >> 2] = 0;
  i1 = i1 + 4 | 0;
 } while ((i1 | 0) < (i3 | 0));
 HEAP32[i10 >> 2] = HEAP32[i2 >> 2];
 if ((_printf_core(0, i11, i10, i13, i14) | 0) < 0) i1 = -1; else {
  if ((HEAP32[i15 + 76 >> 2] | 0) > -1) i8 = ___lockfile(i15) | 0; else i8 = 0;
  i2 = HEAP32[i15 >> 2] | 0;
  i9 = i2 & 32;
  if ((HEAP8[i15 + 74 >> 0] | 0) < 1) HEAP32[i15 >> 2] = i2 & -33;
  i3 = i15 + 48 | 0;
  if (!(HEAP32[i3 >> 2] | 0)) {
   i1 = i15 + 44 | 0;
   i4 = HEAP32[i1 >> 2] | 0;
   HEAP32[i1 >> 2] = i12;
   i5 = i15 + 28 | 0;
   HEAP32[i5 >> 2] = i12;
   i6 = i15 + 20 | 0;
   HEAP32[i6 >> 2] = i12;
   HEAP32[i3 >> 2] = 80;
   i7 = i15 + 16 | 0;
   HEAP32[i7 >> 2] = i12 + 80;
   i2 = _printf_core(i15, i11, i10, i13, i14) | 0;
   if (i4) {
    FUNCTION_TABLE_iiii[HEAP32[i15 + 36 >> 2] & 15](i15, 0, 0) | 0;
    i2 = (HEAP32[i6 >> 2] | 0) == 0 ? -1 : i2;
    HEAP32[i1 >> 2] = i4;
    HEAP32[i3 >> 2] = 0;
    HEAP32[i7 >> 2] = 0;
    HEAP32[i5 >> 2] = 0;
    HEAP32[i6 >> 2] = 0;
   }
  } else i2 = _printf_core(i15, i11, i10, i13, i14) | 0;
  i1 = HEAP32[i15 >> 2] | 0;
  HEAP32[i15 >> 2] = i1 | i9;
  if (i8) ___unlockfile(i15);
  i1 = (i1 & 32 | 0) == 0 ? i2 : -1;
 }
 STACKTOP = i16;
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

function _par_shader_uniform_get(i12) {
 i12 = i12 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i13 = 0, i14 = 0;
 i14 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i13 = i14;
 i7 = HEAP32[202] ^ i12;
 i3 = HEAP32[201] | 0;
 i11 = HEAP32[i3 >> 2] | 0;
 L1 : do if (!i11) {
  i2 = 0;
  i1 = 8;
 } else {
  i8 = i11 + -1 | 0;
  i9 = i8 & i7;
  i10 = HEAP32[i3 + 16 >> 2] | 0;
  i5 = i3 + 20 | 0;
  i2 = i9;
  i6 = 0;
  while (1) {
   i3 = HEAP32[i10 + (i2 >>> 4 << 2) >> 2] | 0;
   i1 = i2 << 1 & 30;
   i4 = i3 >>> i1;
   if (i4 & 2) break;
   if ((i4 & 1 | 0) == 0 ? (HEAP32[(HEAP32[i5 >> 2] | 0) + (i2 << 2) >> 2] | 0) == (i7 | 0) : 0) break;
   i6 = i6 + 1 | 0;
   i2 = i6 + i2 & i8;
   if ((i2 | 0) == (i9 | 0)) {
    i2 = i11;
    i1 = 9;
    break L1;
   }
  }
  i2 = (3 << i1 & i3 | 0) == 0 ? i2 : i11;
  i1 = 8;
 } while (0);
 if ((i1 | 0) == 8) if ((i2 | 0) == (i11 | 0)) i1 = 9;
 do if ((i1 | 0) == 9) if (!(_par_token_to_string(i12) | 0)) {
  _puts(4478) | 0;
  break;
 } else {
  i12 = _par_token_to_string(i12) | 0;
  HEAP32[i13 >> 2] = 4478;
  HEAP32[i13 + 4 >> 2] = i12;
  _printf(4300, i13) | 0;
  break;
 } while (0);
 i1 = HEAP32[201] | 0;
 if ((i2 | 0) == (HEAP32[i1 >> 2] | 0)) ___assert_fail(4495, 4234, 260, 4533); else {
  STACKTOP = i14;
  return HEAP32[(HEAP32[i1 + 24 >> 2] | 0) + (i2 << 2) >> 2] | 0;
 }
 return 0;
}

function _par_texture_from_asset(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0;
 i12 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i11 = i12;
 i1 = _par_buffer_from_asset(i1) | 0;
 i9 = _malloc(12) | 0;
 i8 = _par_buffer_lock(i1, 0) | 0;
 i10 = i9 + 4 | 0;
 if (_lodepng_decode_memory(i11, i9, i10, i8, _par_buffer_length(i1) | 0, 0, 8) | 0) {
  _puts(4740) | 0;
  ___assert_fail(4759, 4768, 22, 4807);
 }
 _par_buffer_unlock(i1);
 _par_buffer_free(i1);
 i2 = i9 + 8 | 0;
 _glGenTextures(1, i2 | 0);
 _glBindTexture(3553, HEAP32[i2 >> 2] | 0);
 i2 = HEAP32[i11 >> 2] | 0;
 i5 = HEAP32[i9 >> 2] | 0;
 i1 = HEAP32[i10 >> 2] | 0;
 i6 = _malloc(i5) | 0;
 i7 = (i1 | 0) / 2 | 0;
 if ((i1 | 0) > 1) {
  i8 = 0 - i5 | 0;
  i3 = i2 + (Math_imul(i1, i5) | 0) | 0;
  i4 = 0;
  i1 = i2;
  while (1) {
   i3 = i3 + i8 | 0;
   _memcpy(i6 | 0, i1 | 0, i5 | 0) | 0;
   _memcpy(i1 | 0, i3 | 0, i5 | 0) | 0;
   _memcpy(i3 | 0, i6 | 0, i5 | 0) | 0;
   i4 = i4 + 1 | 0;
   if ((i4 | 0) >= (i7 | 0)) break; else i1 = i1 + i5 | 0;
  }
 }
 _free(i6);
 _glTexImage2D(3553, 0, 6409, HEAP32[i9 >> 2] | 0, HEAP32[i10 >> 2] | 0, 0, 6409, 5121, HEAP32[i11 >> 2] | 0);
 _free(HEAP32[i11 >> 2] | 0);
 _glTexParameteri(3553, 10240, 9729);
 _glTexParameteri(3553, 10241, 9987);
 _glGenerateMipmap(3553);
 STACKTOP = i12;
 return i9 | 0;
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
 if (!((i2 | 0) == (i1 | 0) | (i1 | 0) == 648)) if (((i1 | 0) != 0 ? (i3 = ___dynamic_cast(i1, 560, 608, 0) | 0, (i3 | 0) != 0) : 0) ? (HEAP32[i3 + 8 >> 2] & ~HEAP32[i2 + 8 >> 2] | 0) == 0 : 0) {
  i1 = HEAP32[i2 + 12 >> 2] | 0;
  i2 = i3 + 12 | 0;
  if (!((i1 | 0) == 640 ? 1 : (i1 | 0) == (HEAP32[i2 >> 2] | 0))) if ((((i1 | 0) != 0 ? (i5 = ___dynamic_cast(i1, 560, 576, 0) | 0, (i5 | 0) != 0) : 0) ? (i4 = HEAP32[i2 >> 2] | 0, (i4 | 0) != 0) : 0) ? (i6 = ___dynamic_cast(i4, 560, 576, 0) | 0, (i6 | 0) != 0) : 0) {
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

function _par_shader_attrib_get(i11) {
 i11 = i11 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i12 = 0, i13 = 0;
 i13 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i12 = i13;
 i2 = HEAP32[200] | 0;
 i10 = HEAP32[i2 >> 2] | 0;
 L1 : do if (!i10) {
  i2 = 0;
  i1 = 8;
 } else {
  i7 = i10 + -1 | 0;
  i8 = i7 & i11;
  i9 = HEAP32[i2 + 16 >> 2] | 0;
  i5 = i2 + 20 | 0;
  i2 = i8;
  i6 = 0;
  while (1) {
   i3 = HEAP32[i9 + (i2 >>> 4 << 2) >> 2] | 0;
   i1 = i2 << 1 & 30;
   i4 = i3 >>> i1;
   if (i4 & 2) break;
   if ((i4 & 1 | 0) == 0 ? (HEAP32[(HEAP32[i5 >> 2] | 0) + (i2 << 2) >> 2] | 0) == (i11 | 0) : 0) break;
   i6 = i6 + 1 | 0;
   i2 = i6 + i2 & i7;
   if ((i2 | 0) == (i8 | 0)) {
    i2 = i10;
    i1 = 9;
    break L1;
   }
  }
  i2 = (3 << i1 & i3 | 0) == 0 ? i2 : i10;
  i1 = 8;
 } while (0);
 if ((i1 | 0) == 8) if ((i2 | 0) == (i10 | 0)) i1 = 9;
 do if ((i1 | 0) == 9) if (!(_par_token_to_string(i11) | 0)) {
  _puts(4400) | 0;
  break;
 } else {
  i11 = _par_token_to_string(i11) | 0;
  HEAP32[i12 >> 2] = 4400;
  HEAP32[i12 + 4 >> 2] = i11;
  _printf(4300, i12) | 0;
  break;
 } while (0);
 i1 = HEAP32[200] | 0;
 if ((i2 | 0) == (HEAP32[i1 >> 2] | 0)) ___assert_fail(4418, 4234, 250, 4456); else {
  STACKTOP = i13;
  return HEAP32[(HEAP32[i1 + 24 >> 2] | 0) + (i2 << 2) >> 2] | 0;
 }
 return 0;
}

function _generateFixedDistanceTree(i5) {
 i5 = i5 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0;
 i4 = _malloc(128) | 0;
 if (!i4) return;
 HEAP32[i4 >> 2] = 5;
 HEAP32[i4 + 4 >> 2] = 5;
 HEAP32[i4 + 8 >> 2] = 5;
 HEAP32[i4 + 12 >> 2] = 5;
 HEAP32[i4 + 16 >> 2] = 5;
 HEAP32[i4 + 20 >> 2] = 5;
 HEAP32[i4 + 24 >> 2] = 5;
 HEAP32[i4 + 28 >> 2] = 5;
 HEAP32[i4 + 32 >> 2] = 5;
 HEAP32[i4 + 36 >> 2] = 5;
 HEAP32[i4 + 40 >> 2] = 5;
 HEAP32[i4 + 44 >> 2] = 5;
 HEAP32[i4 + 48 >> 2] = 5;
 HEAP32[i4 + 52 >> 2] = 5;
 HEAP32[i4 + 56 >> 2] = 5;
 HEAP32[i4 + 60 >> 2] = 5;
 HEAP32[i4 + 64 >> 2] = 5;
 HEAP32[i4 + 68 >> 2] = 5;
 HEAP32[i4 + 72 >> 2] = 5;
 HEAP32[i4 + 76 >> 2] = 5;
 HEAP32[i4 + 80 >> 2] = 5;
 HEAP32[i4 + 84 >> 2] = 5;
 HEAP32[i4 + 88 >> 2] = 5;
 HEAP32[i4 + 92 >> 2] = 5;
 HEAP32[i4 + 96 >> 2] = 5;
 HEAP32[i4 + 100 >> 2] = 5;
 HEAP32[i4 + 104 >> 2] = 5;
 HEAP32[i4 + 108 >> 2] = 5;
 HEAP32[i4 + 112 >> 2] = 5;
 HEAP32[i4 + 116 >> 2] = 5;
 HEAP32[i4 + 120 >> 2] = 5;
 HEAP32[i4 + 124 >> 2] = 5;
 i1 = _malloc(128) | 0;
 HEAP32[i5 + 8 >> 2] = i1;
 if (i1) {
  i2 = i4;
  i3 = i1 + 128 | 0;
  do {
   HEAP32[i1 >> 2] = HEAP32[i2 >> 2];
   i1 = i1 + 4 | 0;
   i2 = i2 + 4 | 0;
  } while ((i1 | 0) < (i3 | 0));
  HEAP32[i5 + 16 >> 2] = 32;
  HEAP32[i5 + 12 >> 2] = 15;
  _HuffmanTree_makeFromLengths2(i5) | 0;
 }
 _free(i4);
 return;
}

function _generateFixedLitLenTree(i3) {
 i3 = i3 | 0;
 var i1 = 0, i2 = 0;
 i2 = _malloc(1152) | 0;
 if (!i2) return; else i1 = 0;
 do {
  HEAP32[i2 + (i1 << 2) >> 2] = 8;
  i1 = i1 + 1 | 0;
 } while ((i1 | 0) != 144);
 i1 = 144;
 do {
  HEAP32[i2 + (i1 << 2) >> 2] = 9;
  i1 = i1 + 1 | 0;
 } while ((i1 | 0) != 256);
 HEAP32[i2 + 1024 >> 2] = 7;
 HEAP32[i2 + 1028 >> 2] = 7;
 HEAP32[i2 + 1032 >> 2] = 7;
 HEAP32[i2 + 1036 >> 2] = 7;
 HEAP32[i2 + 1040 >> 2] = 7;
 HEAP32[i2 + 1044 >> 2] = 7;
 HEAP32[i2 + 1048 >> 2] = 7;
 HEAP32[i2 + 1052 >> 2] = 7;
 HEAP32[i2 + 1056 >> 2] = 7;
 HEAP32[i2 + 1060 >> 2] = 7;
 HEAP32[i2 + 1064 >> 2] = 7;
 HEAP32[i2 + 1068 >> 2] = 7;
 HEAP32[i2 + 1072 >> 2] = 7;
 HEAP32[i2 + 1076 >> 2] = 7;
 HEAP32[i2 + 1080 >> 2] = 7;
 HEAP32[i2 + 1084 >> 2] = 7;
 HEAP32[i2 + 1088 >> 2] = 7;
 HEAP32[i2 + 1092 >> 2] = 7;
 HEAP32[i2 + 1096 >> 2] = 7;
 HEAP32[i2 + 1100 >> 2] = 7;
 HEAP32[i2 + 1104 >> 2] = 7;
 HEAP32[i2 + 1108 >> 2] = 7;
 HEAP32[i2 + 1112 >> 2] = 7;
 HEAP32[i2 + 1116 >> 2] = 7;
 HEAP32[i2 + 1120 >> 2] = 8;
 HEAP32[i2 + 1124 >> 2] = 8;
 HEAP32[i2 + 1128 >> 2] = 8;
 HEAP32[i2 + 1132 >> 2] = 8;
 HEAP32[i2 + 1136 >> 2] = 8;
 HEAP32[i2 + 1140 >> 2] = 8;
 HEAP32[i2 + 1144 >> 2] = 8;
 HEAP32[i2 + 1148 >> 2] = 8;
 _HuffmanTree_makeFromLengths(i3, i2, 288, 15) | 0;
 _free(i2);
 return;
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
   HEAP32[i3 >> 2] = HEAP32[734];
   _abort_message(7917, i3);
  }
  if ((i2 | 0) == 1126902529 & (i1 | 0) == 1129074247) i1 = HEAP32[i4 + 44 >> 2] | 0; else i1 = i4 + 80 | 0;
  HEAP32[i5 >> 2] = i1;
  i4 = HEAP32[i4 >> 2] | 0;
  i1 = HEAP32[i4 + 4 >> 2] | 0;
  if (FUNCTION_TABLE_iiii[HEAP32[(HEAP32[544 >> 2] | 0) + 16 >> 2] & 15](544, i4, i5) | 0) {
   i8 = HEAP32[i5 >> 2] | 0;
   i5 = HEAP32[734] | 0;
   i8 = FUNCTION_TABLE_ii[HEAP32[(HEAP32[i8 >> 2] | 0) + 8 >> 2] & 7](i8) | 0;
   HEAP32[i6 >> 2] = i5;
   HEAP32[i6 + 4 >> 2] = i1;
   HEAP32[i6 + 8 >> 2] = i8;
   _abort_message(7831, i6);
  } else {
   HEAP32[i8 >> 2] = HEAP32[734];
   HEAP32[i8 + 4 >> 2] = i1;
   _abort_message(7876, i8);
  }
 }
 _abort_message(7955, i7);
}

function _par_asset_to_buffer(i12) {
 i12 = i12 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0;
 i1 = HEAP32[196] | 0;
 if (!i1) {
  _puts(3903) | 0;
  i1 = HEAP32[196] | 0;
  if (!i1) ___assert_fail(3932, 3849, 45, 3948); else i2 = i1;
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
  _puts(4929) | 0;
  i2 = HEAP32[196] | 0;
  i3 = HEAP32[i2 >> 2] | 0;
 }
 if ((i1 | 0) == (i3 | 0)) ___assert_fail(3968, 3849, 47, 3948); else return HEAP32[(HEAP32[i2 + 24 >> 2] | 0) + (i1 << 2) >> 2] | 0;
 return 0;
}

function _par_token_to_sds(i12) {
 i12 = i12 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0;
 i1 = HEAP32[205] | 0;
 if (!i1) {
  _puts(4830) | 0;
  i1 = HEAP32[205] | 0;
  if (!i1) ___assert_fail(4859, 4875, 13, 4912); else i2 = i1;
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
  _puts(4929) | 0;
  i2 = HEAP32[205] | 0;
  i3 = HEAP32[i2 >> 2] | 0;
 }
 if ((i1 | 0) == (i3 | 0)) ___assert_fail(4943, 4875, 15, 4912); else return HEAP32[(HEAP32[i2 + 24 >> 2] | 0) + (i1 << 2) >> 2] | 0;
 return 0;
}

function _main(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0;
 i3 = _par_token_from_string(5714) | 0;
 HEAP32[674] = i3;
 i3 = _par_token_from_string(5725) | 0;
 HEAP32[678] = i3;
 i3 = _par_token_from_string(5733) | 0;
 HEAP32[675] = i3;
 i3 = _par_token_from_string(5744) | 0;
 HEAP32[676] = i3;
 i3 = _par_token_from_string(5755) | 0;
 HEAP32[677] = i3;
 i3 = _par_token_from_string(5761) | 0;
 HEAP32[679] = i3;
 i3 = _par_token_from_string(5770) | 0;
 HEAP32[680] = i3;
 i3 = _par_token_from_string(5787) | 0;
 HEAP32[671] = i3;
 _par_asset_preload(i3);
 i3 = _par_token_from_string(5799) | 0;
 HEAP32[673] = i3;
 _par_asset_preload(i3);
 i3 = _par_token_from_string(5811) | 0;
 HEAP32[672] = i3;
 _par_asset_preload(i3);
 _par_asset_preload(_par_token_from_string(5826) | 0);
 _par_asset_preload(_par_token_from_string(5841) | 0);
 _par_asset_preload(_par_token_from_string(5856) | 0);
 _par_asset_preload(_par_token_from_string(5871) | 0);
 _par_window_setargs(i1, i2);
 _par_window_oninit(2);
 _par_window_ontick(2);
 _par_window_ondraw(2);
 _par_window_onexit(4);
 _par_window_oninput(3);
 _par_window_onmessage(18);
 return _par_window_exec(Math_fround(400.0), Math_fround(300.0), 1) | 0;
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

function _par_mesh_rectangle(f2, f1) {
 f2 = Math_fround(f2);
 f1 = Math_fround(f1);
 var i3 = 0, i4 = 0, i5 = 0, f6 = f0, f7 = f0;
 i3 = _malloc(20) | 0;
 HEAP32[i3 + 8 >> 2] = 0;
 HEAP32[i3 + 12 >> 2] = 0;
 HEAP32[i3 + 16 >> 2] = 2;
 i4 = _par_buffer_alloc(32, 2) | 0;
 HEAP32[i3 >> 2] = i4;
 i5 = _par_buffer_lock(i4, 1) | 0;
 f6 = Math_fround(f2 * Math_fround(.5));
 f2 = Math_fround(f1 * Math_fround(.5));
 f1 = Math_fround(-f6);
 HEAPF32[i5 >> 2] = f1;
 f7 = Math_fround(-f2);
 HEAPF32[i5 + 4 >> 2] = f7;
 HEAPF32[i5 + 8 >> 2] = f6;
 HEAPF32[i5 + 12 >> 2] = f7;
 HEAPF32[i5 + 16 >> 2] = f1;
 HEAPF32[i5 + 20 >> 2] = f2;
 HEAPF32[i5 + 24 >> 2] = f6;
 HEAPF32[i5 + 28 >> 2] = f2;
 _par_buffer_unlock(i4);
 i4 = _par_buffer_alloc(32, 2) | 0;
 HEAP32[i3 + 4 >> 2] = i4;
 i5 = _par_buffer_lock(i4, 1) | 0;
 HEAPF32[i5 >> 2] = Math_fround(0.0);
 HEAPF32[i5 + 4 >> 2] = Math_fround(0.0);
 HEAPF32[i5 + 8 >> 2] = Math_fround(1.0);
 HEAPF32[i5 + 12 >> 2] = Math_fround(0.0);
 HEAPF32[i5 + 16 >> 2] = Math_fround(0.0);
 HEAPF32[i5 + 20 >> 2] = Math_fround(1.0);
 HEAPF32[i5 + 24 >> 2] = Math_fround(1.0);
 HEAPF32[i5 + 28 >> 2] = Math_fround(1.0);
 _par_buffer_unlock(i4);
 return i3 | 0;
}

function ___fwritex(i3, i4, i6) {
 i3 = i3 | 0;
 i4 = i4 | 0;
 i6 = i6 | 0;
 var i1 = 0, i2 = 0, i5 = 0, i7 = 0;
 i1 = i6 + 16 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 if (!i2) if (!(___towrite(i6) | 0)) {
  i2 = HEAP32[i1 >> 2] | 0;
  i5 = 4;
 } else i1 = 0; else i5 = 4;
 L4 : do if ((i5 | 0) == 4) {
  i7 = i6 + 20 | 0;
  i5 = HEAP32[i7 >> 2] | 0;
  if ((i2 - i5 | 0) >>> 0 < i4 >>> 0) {
   i1 = FUNCTION_TABLE_iiii[HEAP32[i6 + 36 >> 2] & 15](i6, i3, i4) | 0;
   break;
  }
  L9 : do if ((HEAP8[i6 + 75 >> 0] | 0) > -1) {
   i1 = i4;
   while (1) {
    if (!i1) {
     i2 = i5;
     i1 = 0;
     break L9;
    }
    i2 = i1 + -1 | 0;
    if ((HEAP8[i3 + i2 >> 0] | 0) == 10) break; else i1 = i2;
   }
   if ((FUNCTION_TABLE_iiii[HEAP32[i6 + 36 >> 2] & 15](i6, i3, i1) | 0) >>> 0 < i1 >>> 0) break L4;
   i4 = i4 - i1 | 0;
   i3 = i3 + i1 | 0;
   i2 = HEAP32[i7 >> 2] | 0;
  } else {
   i2 = i5;
   i1 = 0;
  } while (0);
  _memcpy(i2 | 0, i3 | 0, i4 | 0) | 0;
  HEAP32[i7 >> 2] = (HEAP32[i7 >> 2] | 0) + i4;
  i1 = i1 + i4 | 0;
 } while (0);
 return i1 | 0;
}

function _LodePNGIText_cleanup(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0;
 i5 = i1 + 72 | 0;
 i6 = i1 + 76 | 0;
 i3 = i1 + 80 | 0;
 i4 = i1 + 84 | 0;
 i1 = i1 + 88 | 0;
 if (!(HEAP32[i5 >> 2] | 0)) {
  i6 = HEAP32[i6 >> 2] | 0;
  _free(i6);
  i6 = HEAP32[i3 >> 2] | 0;
  _free(i6);
  i6 = HEAP32[i4 >> 2] | 0;
  _free(i6);
  i6 = HEAP32[i1 >> 2] | 0;
  _free(i6);
  return;
 } else i2 = 0;
 do {
  i7 = (HEAP32[i6 >> 2] | 0) + (i2 << 2) | 0;
  _free(HEAP32[i7 >> 2] | 0);
  HEAP32[i7 >> 2] = 0;
  i7 = (HEAP32[i3 >> 2] | 0) + (i2 << 2) | 0;
  _free(HEAP32[i7 >> 2] | 0);
  HEAP32[i7 >> 2] = 0;
  i7 = (HEAP32[i4 >> 2] | 0) + (i2 << 2) | 0;
  _free(HEAP32[i7 >> 2] | 0);
  HEAP32[i7 >> 2] = 0;
  i7 = (HEAP32[i1 >> 2] | 0) + (i2 << 2) | 0;
  _free(HEAP32[i7 >> 2] | 0);
  HEAP32[i7 >> 2] = 0;
  i2 = i2 + 1 | 0;
 } while ((i2 | 0) != (HEAP32[i5 >> 2] | 0));
 i7 = HEAP32[i6 >> 2] | 0;
 _free(i7);
 i7 = HEAP32[i3 >> 2] | 0;
 _free(i7);
 i7 = HEAP32[i4 >> 2] | 0;
 _free(i7);
 i7 = HEAP32[i1 >> 2] | 0;
 _free(i7);
 return;
}

function _vsnprintf(i3, i1, i10, i8) {
 i3 = i3 | 0;
 i1 = i1 | 0;
 i10 = i10 | 0;
 i8 = i8 | 0;
 var i2 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i9 = 0, i11 = 0;
 i11 = STACKTOP;
 STACKTOP = STACKTOP + 128 | 0;
 i2 = i11 + 112 | 0;
 i9 = i11;
 i4 = i9;
 i5 = 3492;
 i6 = i4 + 112 | 0;
 do {
  HEAP32[i4 >> 2] = HEAP32[i5 >> 2];
  i4 = i4 + 4 | 0;
  i5 = i5 + 4 | 0;
 } while ((i4 | 0) < (i6 | 0));
 if ((i1 + -1 | 0) >>> 0 > 2147483646) if (!i1) {
  i1 = 1;
  i7 = 4;
 } else {
  i1 = ___errno_location() | 0;
  HEAP32[i1 >> 2] = 75;
  i1 = -1;
 } else {
  i2 = i3;
  i7 = 4;
 }
 if ((i7 | 0) == 4) {
  i7 = -2 - i2 | 0;
  i7 = i1 >>> 0 > i7 >>> 0 ? i7 : i1;
  HEAP32[i9 + 48 >> 2] = i7;
  i3 = i9 + 20 | 0;
  HEAP32[i3 >> 2] = i2;
  HEAP32[i9 + 44 >> 2] = i2;
  i1 = i2 + i7 | 0;
  i2 = i9 + 16 | 0;
  HEAP32[i2 >> 2] = i1;
  HEAP32[i9 + 28 >> 2] = i1;
  i1 = _vfprintf(i9, i10, i8) | 0;
  if (i7) {
   i10 = HEAP32[i3 >> 2] | 0;
   HEAP8[i10 + (((i10 | 0) == (HEAP32[i2 >> 2] | 0)) << 31 >> 31) >> 0] = 0;
  }
 }
 STACKTOP = i11;
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
 i1 = (_strlen(i5) | 0) << 1;
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

function ___strchrnul(i1, i4) {
 i1 = i1 | 0;
 i4 = i4 | 0;
 var i2 = 0, i3 = 0, i5 = 0;
 i3 = i4 & 255;
 L1 : do if (!i3) i1 = i1 + (_strlen(i1) | 0) | 0; else {
  if (i1 & 3) {
   i2 = i4 & 255;
   do {
    i5 = HEAP8[i1 >> 0] | 0;
    if (i5 << 24 >> 24 == 0 ? 1 : i5 << 24 >> 24 == i2 << 24 >> 24) break L1;
    i1 = i1 + 1 | 0;
   } while ((i1 & 3 | 0) != 0);
  }
  i3 = Math_imul(i3, 16843009) | 0;
  i2 = HEAP32[i1 >> 2] | 0;
  L10 : do if (!((i2 & -2139062144 ^ -2139062144) & i2 + -16843009)) do {
   i5 = i2 ^ i3;
   if ((i5 & -2139062144 ^ -2139062144) & i5 + -16843009) break L10;
   i1 = i1 + 4 | 0;
   i2 = HEAP32[i1 >> 2] | 0;
  } while (((i2 & -2139062144 ^ -2139062144) & i2 + -16843009 | 0) == 0); while (0);
  i2 = i4 & 255;
  while (1) {
   i5 = HEAP8[i1 >> 0] | 0;
   if (i5 << 24 >> 24 == 0 ? 1 : i5 << 24 >> 24 == i2 << 24 >> 24) break; else i1 = i1 + 1 | 0;
  }
 } while (0);
 return i1 | 0;
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

function _par_zcam_grab_update(f2, f3, f1) {
 f2 = Math_fround(f2);
 f3 = Math_fround(f3);
 f1 = Math_fround(f1);
 var d4 = 0.0, d5 = 0.0, d6 = 0.0, d7 = 0.0, d8 = 0.0, d9 = 0.0, d10 = 0.0, d11 = 0.0, d12 = 0.0;
 if (HEAP32[206] | 0) {
  d5 = +Math_tan(+(+HEAPF64[8] * .5)) * 2.0;
  d5 = d5 * +HEAPF64[4];
  d4 = d5 * +HEAPF64[9];
  HEAPF64[3] = +HEAPF64[27] - (+f3 + -.5) * d5;
  HEAPF64[2] = +HEAPF64[26] - (+f2 + -.5) * d4;
  return;
 }
 if (!(f1 != Math_fround(0.0))) return;
 d10 = +Math_tan(+(+HEAPF64[8] * .5)) * 2.0;
 d12 = +HEAPF64[4];
 d7 = d10 * d12;
 d4 = +HEAPF64[9];
 d8 = +f3 + -.5;
 d9 = +HEAPF64[3] + d8 * d7;
 d6 = +f2 + -.5;
 d7 = +HEAPF64[2] + d6 * (d7 * d4);
 d12 = d12 - +f1 * d12 * .01;
 d11 = +HEAPF64[5];
 d5 = +HEAPF64[1];
 d5 = d5 > d12 ? d12 : d5;
 d5 = d11 > d5 ? d11 : d5;
 HEAPF64[4] = d5;
 d5 = d10 * d5;
 HEAPF64[3] = d9 - d8 * d5;
 HEAPF64[2] = d7 - d6 * (d4 * d5);
 return;
}

function ___stpcpy(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0;
 i3 = i2;
 L1 : do if (!((i3 ^ i1) & 3)) {
  if (i3 & 3) do {
   i3 = HEAP8[i2 >> 0] | 0;
   HEAP8[i1 >> 0] = i3;
   if (!(i3 << 24 >> 24)) break L1;
   i2 = i2 + 1 | 0;
   i1 = i1 + 1 | 0;
  } while ((i2 & 3 | 0) != 0);
  i3 = HEAP32[i2 >> 2] | 0;
  if (!((i3 & -2139062144 ^ -2139062144) & i3 + -16843009)) {
   i4 = i1;
   while (1) {
    i2 = i2 + 4 | 0;
    i1 = i4 + 4 | 0;
    HEAP32[i4 >> 2] = i3;
    i3 = HEAP32[i2 >> 2] | 0;
    if ((i3 & -2139062144 ^ -2139062144) & i3 + -16843009) break; else i4 = i1;
   }
  }
  i4 = 8;
 } else i4 = 8; while (0);
 if ((i4 | 0) == 8) {
  i4 = HEAP8[i2 >> 0] | 0;
  HEAP8[i1 >> 0] = i4;
  if (i4 << 24 >> 24) do {
   i2 = i2 + 1 | 0;
   i1 = i1 + 1 | 0;
   i4 = HEAP8[i2 >> 0] | 0;
   HEAP8[i1 >> 0] = i4;
  } while (i4 << 24 >> 24 != 0);
 }
 return i1 | 0;
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

function __ZL4initN10emscripten3valE(i1) {
 i1 = i1 | 0;
 var i2 = 0, f3 = f0, f4 = f0, i5 = 0, i6 = 0, i7 = 0, d8 = 0.0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i6 = i2 + 12 | 0;
 i5 = i2;
 i1 = HEAP32[i1 >> 2] | 0;
 __emval_incref(i1 | 0);
 d8 = +__emval_as(i1 | 0, 312, i6 | 0);
 i6 = HEAP32[i6 >> 2] | 0;
 i7 = ~~d8 >>> 0;
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcj(i5, i7 + 4 | 0, HEAP32[i7 >> 2] | 0);
 __emval_run_destructors(i6 | 0);
 FUNCTION_TABLE_vi[HEAP32[2536 >> 2] & 31]((HEAP8[i5 >> 0] & 1) == 0 ? i5 + 1 | 0 : HEAP32[i5 + 8 >> 2] | 0);
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i5);
 __emval_decref(i1 | 0);
 f4 = Math_fround(HEAP32[635] | 0);
 f3 = Math_fround(HEAP32[636] | 0);
 FUNCTION_TABLE_vfff[HEAP32[2516 >> 2] & 3](f4, f3, Math_fround(1.0));
 STACKTOP = i2;
 return;
}

function _wcrtomb(i1, i3, i2) {
 i1 = i1 | 0;
 i3 = i3 | 0;
 i2 = i2 | 0;
 do if (i1) {
  if (i3 >>> 0 < 128) {
   HEAP8[i1 >> 0] = i3;
   i1 = 1;
   break;
  }
  if (i3 >>> 0 < 2048) {
   HEAP8[i1 >> 0] = i3 >>> 6 | 192;
   HEAP8[i1 + 1 >> 0] = i3 & 63 | 128;
   i1 = 2;
   break;
  }
  if (i3 >>> 0 < 55296 | (i3 & -8192 | 0) == 57344) {
   HEAP8[i1 >> 0] = i3 >>> 12 | 224;
   HEAP8[i1 + 1 >> 0] = i3 >>> 6 & 63 | 128;
   HEAP8[i1 + 2 >> 0] = i3 & 63 | 128;
   i1 = 3;
   break;
  }
  if ((i3 + -65536 | 0) >>> 0 < 1048576) {
   HEAP8[i1 >> 0] = i3 >>> 18 | 240;
   HEAP8[i1 + 1 >> 0] = i3 >>> 12 & 63 | 128;
   HEAP8[i1 + 2 >> 0] = i3 >>> 6 & 63 | 128;
   HEAP8[i1 + 3 >> 0] = i3 & 63 | 128;
   i1 = 4;
   break;
  } else {
   i1 = ___errno_location() | 0;
   HEAP32[i1 >> 2] = 84;
   i1 = -1;
   break;
  }
 } else i1 = 1; while (0);
 return i1 | 0;
}

function __ZN10emscripten8internal12MethodCallerIvJRNSt3__112basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEEEE4callEPNS0_7_EM_VALEPKcS9_(i3, i4, i1) {
 i3 = i3 | 0;
 i4 = i4 | 0;
 i1 = i1 | 0;
 var i2 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i2 = i5;
 if ((HEAP8[352] | 0) == 0 ? (___cxa_guard_acquire(352) | 0) != 0 : 0) {
  i6 = __emval_get_method_caller(2, 2612) | 0;
  HEAP32[655] = i6;
  ___cxa_guard_release(352);
 }
 i6 = HEAP32[655] | 0;
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
 if ((i6 | 0) != (i1 | 0)) if ((i1 | 0) != 0 ? (i3 = ___dynamic_cast(i1, 560, 576, 0) | 0, (i3 | 0) != 0) : 0) {
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
 __embind_register_class(232, 240, 256, 0, 5099, 3, 5102, 0, 5102, 0, 5104, 5111, 12);
 __embind_register_class_class_function(232, 5682, 2, 2548, 5114, 1, 13);
 __embind_register_class_class_function(232, 5118, 1, 2556, 5111, 14, 3);
 __embind_register_class_class_function(232, 5123, 2, 2560, 5128, 1, 1);
 __embind_register_class_class_function(232, 5132, 5, 2568, 5138, 1, 2);
 __embind_register_class_class_function(232, 5145, 2, 2548, 5114, 1, 15);
 __embind_register_class(272, 280, 296, 0, 5099, 4, 5102, 0, 5102, 0, 5153, 5111, 16);
 __embind_register_class_class_function(272, 5159, 3, 2588, 5165, 8, 1);
 __embind_register_class_class_function(272, 5170, 2, 2600, 5114, 2, 17);
 _par_asset_set_baseurl(5177);
 return;
}

function _lodepng_info_cleanup(i5) {
 i5 = i5 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i6 = 0;
 i1 = i5 + 20 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 if (i2) _free(i2);
 HEAP32[i1 >> 2] = 0;
 HEAP32[i5 + 24 >> 2] = 0;
 i1 = i5 + 60 | 0;
 i3 = i5 + 64 | 0;
 i2 = i5 + 68 | 0;
 if (HEAP32[i1 >> 2] | 0) {
  i4 = 0;
  do {
   i6 = (HEAP32[i3 >> 2] | 0) + (i4 << 2) | 0;
   _free(HEAP32[i6 >> 2] | 0);
   HEAP32[i6 >> 2] = 0;
   i6 = (HEAP32[i2 >> 2] | 0) + (i4 << 2) | 0;
   _free(HEAP32[i6 >> 2] | 0);
   HEAP32[i6 >> 2] = 0;
   i4 = i4 + 1 | 0;
  } while ((i4 | 0) != (HEAP32[i1 >> 2] | 0));
 }
 _free(HEAP32[i3 >> 2] | 0);
 _free(HEAP32[i2 >> 2] | 0);
 _LodePNGIText_cleanup(i5);
 _free(HEAP32[i5 + 136 >> 2] | 0);
 _free(HEAP32[i5 + 140 >> 2] | 0);
 _free(HEAP32[i5 + 144 >> 2] | 0);
 return;
}

function _fputc(i5, i6) {
 i5 = i5 | 0;
 i6 = i6 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i7 = 0;
 if ((HEAP32[i6 + 76 >> 2] | 0) >= 0 ? (___lockfile(i6) | 0) != 0 : 0) {
  if ((HEAP8[i6 + 75 >> 0] | 0) != (i5 | 0) ? (i2 = i6 + 20 | 0, i3 = HEAP32[i2 >> 2] | 0, i3 >>> 0 < (HEAP32[i6 + 16 >> 2] | 0) >>> 0) : 0) {
   HEAP32[i2 >> 2] = i3 + 1;
   HEAP8[i3 >> 0] = i5;
   i1 = i5 & 255;
  } else i1 = ___overflow(i6, i5) | 0;
  ___unlockfile(i6);
 } else i7 = 3;
 do if ((i7 | 0) == 3) {
  if ((HEAP8[i6 + 75 >> 0] | 0) != (i5 | 0) ? (i4 = i6 + 20 | 0, i1 = HEAP32[i4 >> 2] | 0, i1 >>> 0 < (HEAP32[i6 + 16 >> 2] | 0) >>> 0) : 0) {
   HEAP32[i4 >> 2] = i1 + 1;
   HEAP8[i1 >> 0] = i5;
   i1 = i5 & 255;
   break;
  }
  i1 = ___overflow(i6, i5) | 0;
 } while (0);
 return i1 | 0;
}

function ___overflow(i8, i6) {
 i8 = i8 | 0;
 i6 = i6 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i7 = 0, i9 = 0;
 i9 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i7 = i9;
 i5 = i6 & 255;
 HEAP8[i7 >> 0] = i5;
 i2 = i8 + 16 | 0;
 i3 = HEAP32[i2 >> 2] | 0;
 if (!i3) if (!(___towrite(i8) | 0)) {
  i3 = HEAP32[i2 >> 2] | 0;
  i4 = 4;
 } else i1 = -1; else i4 = 4;
 do if ((i4 | 0) == 4) {
  i2 = i8 + 20 | 0;
  i4 = HEAP32[i2 >> 2] | 0;
  if (i4 >>> 0 < i3 >>> 0 ? (i1 = i6 & 255, (i1 | 0) != (HEAP8[i8 + 75 >> 0] | 0)) : 0) {
   HEAP32[i2 >> 2] = i4 + 1;
   HEAP8[i4 >> 0] = i5;
   break;
  }
  if ((FUNCTION_TABLE_iiii[HEAP32[i8 + 36 >> 2] & 15](i8, i7, 1) | 0) == 1) i1 = HEAPU8[i7 >> 0] | 0; else i1 = -1;
 } while (0);
 STACKTOP = i9;
 return i1 | 0;
}

function _pad(i6, i3, i5, i4, i2) {
 i6 = i6 | 0;
 i3 = i3 | 0;
 i5 = i5 | 0;
 i4 = i4 | 0;
 i2 = i2 | 0;
 var i1 = 0, i7 = 0, i8 = 0;
 i8 = STACKTOP;
 STACKTOP = STACKTOP + 256 | 0;
 i7 = i8;
 do if ((i5 | 0) > (i4 | 0) & (i2 & 73728 | 0) == 0) {
  i1 = i5 - i4 | 0;
  _memset(i7 | 0, i3 | 0, (i1 >>> 0 > 256 ? 256 : i1) | 0) | 0;
  i2 = HEAP32[i6 >> 2] | 0;
  i3 = (i2 & 32 | 0) == 0;
  if (i1 >>> 0 > 255) {
   i5 = i5 - i4 | 0;
   do {
    if (i3) {
     ___fwritex(i7, 256, i6) | 0;
     i2 = HEAP32[i6 >> 2] | 0;
    }
    i1 = i1 + -256 | 0;
    i3 = (i2 & 32 | 0) == 0;
   } while (i1 >>> 0 > 255);
   if (i3) i1 = i5 & 255; else break;
  } else if (!i3) break;
  ___fwritex(i7, i1, i6) | 0;
 } while (0);
 STACKTOP = i8;
 return;
}

function ___remdi3(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
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

function _scalbn(d1, i3) {
 d1 = +d1;
 i3 = i3 | 0;
 var i2 = 0;
 if ((i3 | 0) > 1023) {
  d1 = d1 * 8988465674311579538646525.0e283;
  i2 = i3 + -1023 | 0;
  if ((i2 | 0) > 1023) {
   i2 = i3 + -2046 | 0;
   i2 = (i2 | 0) > 1023 ? 1023 : i2;
   d1 = d1 * 8988465674311579538646525.0e283;
  }
 } else if ((i3 | 0) < -1022) {
  d1 = d1 * 2.2250738585072014e-308;
  i2 = i3 + 1022 | 0;
  if ((i2 | 0) < -1022) {
   i2 = i3 + 2044 | 0;
   i2 = (i2 | 0) < -1022 ? -1022 : i2;
   d1 = d1 * 2.2250738585072014e-308;
  }
 } else i2 = i3;
 i2 = _bitshift64Shl(i2 + 1023 | 0, 0, 52) | 0;
 i3 = tempRet0;
 HEAP32[tempDoublePtr >> 2] = i2;
 HEAP32[tempDoublePtr + 4 >> 2] = i3;
 return +(d1 * +HEAPF64[tempDoublePtr >> 3]);
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
 switch (i4 | 0) {
 case 0:
  {
   if (d1 != 0.0) {
    d1 = +_frexp(d1 * 18446744073709551616.0, i5);
    i2 = (HEAP32[i5 >> 2] | 0) + -64 | 0;
   } else i2 = 0;
   HEAP32[i5 >> 2] = i2;
   break;
  }
 case 2047:
  break;
 default:
  {
   HEAP32[i5 >> 2] = i4 + -1022;
   HEAP32[tempDoublePtr >> 2] = i2;
   HEAP32[tempDoublePtr + 4 >> 2] = i3 & -2146435073 | 1071644672;
   d1 = +HEAPF64[tempDoublePtr >> 3];
  }
 }
 return +d1;
}

function _sdsdup(i2) {
 i2 = i2 | 0;
 var i1 = 0;
 i1 = HEAPU8[i2 + -1 >> 0] | 0;
 switch (i1 & 7 | 0) {
 case 0:
  {
   i1 = i1 >>> 3;
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
 case 3:
  {
   i1 = i2 + -9 | 0;
   i1 = HEAPU8[i1 >> 0] | HEAPU8[i1 + 1 >> 0] << 8 | HEAPU8[i1 + 2 >> 0] << 16 | HEAPU8[i1 + 3 >> 0] << 24;
   break;
  }
 case 4:
  {
   i1 = i2 + -17 | 0;
   i1 = HEAPU8[i1 >> 0] | HEAPU8[i1 + 1 >> 0] << 8 | HEAPU8[i1 + 2 >> 0] << 16 | HEAPU8[i1 + 3 >> 0] << 24;
   break;
  }
 default:
  i1 = 0;
 }
 return _sdsnewlen(i2, i1) | 0;
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

function _realloc(i3, i2) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 var i1 = 0, i4 = 0;
 do if (i3) {
  if (i2 >>> 0 > 4294967231) {
   i1 = ___errno_location() | 0;
   HEAP32[i1 >> 2] = 12;
   i1 = 0;
   break;
  }
  i1 = _try_realloc_chunk(i3 + -8 | 0, i2 >>> 0 < 11 ? 16 : i2 + 11 & -8) | 0;
  if (i1) {
   i1 = i1 + 8 | 0;
   break;
  }
  i1 = _malloc(i2) | 0;
  if (!i1) i1 = 0; else {
   i4 = HEAP32[i3 + -4 >> 2] | 0;
   i4 = (i4 & -8) - ((i4 & 3 | 0) == 0 ? 8 : 4) | 0;
   _memcpy(i1 | 0, i3 | 0, (i4 >>> 0 < i2 >>> 0 ? i4 : i2) | 0) | 0;
   _free(i3);
  }
 } else i1 = _malloc(i2) | 0; while (0);
 return i1 | 0;
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

function _fmt_u(i2, i3, i1) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i1 = i1 | 0;
 var i4 = 0;
 if (i3 >>> 0 > 0 | (i3 | 0) == 0 & i2 >>> 0 > 4294967295) {
  i4 = i2;
  while (1) {
   i2 = ___uremdi3(i4 | 0, i3 | 0, 10, 0) | 0;
   i1 = i1 + -1 | 0;
   HEAP8[i1 >> 0] = i2 | 48;
   i2 = ___udivdi3(i4 | 0, i3 | 0, 10, 0) | 0;
   if (i3 >>> 0 > 9 | (i3 | 0) == 9 & i4 >>> 0 > 4294967295) {
    i4 = i2;
    i3 = tempRet0;
   } else break;
  }
 }
 if (i2) while (1) {
  i1 = i1 + -1 | 0;
  HEAP8[i1 >> 0] = (i2 >>> 0) % 10 | 0 | 48;
  if (i2 >>> 0 < 10) break; else i2 = (i2 >>> 0) / 10 | 0;
 }
 return i1 | 0;
}

function _par_asset_preload(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i4 = i2;
 i3 = __emval_get_module_property(5080) | 0;
 i1 = _par_token_to_string(i1) | 0;
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcj(i4, i1, _strlen(i1) | 0);
 __ZN10emscripten8internal12MethodCallerIvJRNSt3__112basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEEEE4callEPNS0_7_EM_VALEPKcS9_(i3, 5085, i4);
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
   case 0:
    {
     i2 = 1;
     break;
    }
   case 1:
    {
     i2 = 3;
     break;
    }
   case 2:
    {
     i2 = 5;
     break;
    }
   case 3:
    {
     i2 = 9;
     break;
    }
   case 4:
    {
     i2 = 17;
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

function _strlen(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0;
 i4 = i1;
 L1 : do if (!(i4 & 3)) i3 = 4; else {
  i2 = i4;
  while (1) {
   if (!(HEAP8[i1 >> 0] | 0)) {
    i1 = i2;
    break L1;
   }
   i1 = i1 + 1 | 0;
   i2 = i1;
   if (!(i2 & 3)) {
    i3 = 4;
    break;
   }
  }
 } while (0);
 if ((i3 | 0) == 4) {
  while (1) {
   i2 = HEAP32[i1 >> 2] | 0;
   if (!((i2 & -2139062144 ^ -2139062144) & i2 + -16843009)) i1 = i1 + 4 | 0; else break;
  }
  if ((i2 & 255) << 24 >> 24) do i1 = i1 + 1 | 0; while ((HEAP8[i1 >> 0] | 0) != 0);
 }
 return i1 - i4 | 0;
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
 if (!i2) i1 = 0; else {
  i3 = HEAP8[i4 >> 0] | 0;
  L3 : do if (!(i3 << 24 >> 24)) i3 = 0; else while (1) {
   i2 = i2 + -1 | 0;
   i5 = HEAP8[i1 >> 0] | 0;
   if (!(i3 << 24 >> 24 == i5 << 24 >> 24 & ((i2 | 0) != 0 & i5 << 24 >> 24 != 0))) break L3;
   i4 = i4 + 1 | 0;
   i1 = i1 + 1 | 0;
   i3 = HEAP8[i4 >> 0] | 0;
   if (!(i3 << 24 >> 24)) {
    i3 = 0;
    break;
   }
  } while (0);
  i1 = (i3 & 255) - (HEAPU8[i1 >> 0] | 0) | 0;
 }
 return i1 | 0;
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
 _printf(5284, i3) | 0;
 i1 = __emval_get_module_property(5080) | 0;
 i3 = _par_buffer_alloc(i2, 0) | 0;
 HEAP32[652] = i3;
 i3 = _par_buffer_lock(i3, 1) | 0;
 __emval_decref(i1 | 0);
 STACKTOP = i4;
 return i3 | 0;
}

function _puts(i3) {
 i3 = i3 | 0;
 var i1 = 0, i2 = 0, i4 = 0, i5 = 0;
 i4 = HEAP32[747] | 0;
 if ((HEAP32[i4 + 76 >> 2] | 0) > -1) i5 = ___lockfile(i4) | 0; else i5 = 0;
 do if ((_fputs(i3, i4) | 0) < 0) i1 = 1; else {
  if ((HEAP8[i4 + 75 >> 0] | 0) != 10 ? (i1 = i4 + 20 | 0, i2 = HEAP32[i1 >> 2] | 0, i2 >>> 0 < (HEAP32[i4 + 16 >> 2] | 0) >>> 0) : 0) {
   HEAP32[i1 >> 2] = i2 + 1;
   HEAP8[i2 >> 0] = 10;
   i1 = 0;
   break;
  }
  i1 = (___overflow(i4, 10) | 0) < 0;
 } while (0);
 if (i5) ___unlockfile(i4);
 return i1 << 31 >> 31 | 0;
}

function _strerror(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0;
 i2 = 0;
 while (1) {
  if ((HEAPU8[7976 + i2 >> 0] | 0) == (i1 | 0)) {
   i3 = 2;
   break;
  }
  i2 = i2 + 1 | 0;
  if ((i2 | 0) == 87) {
   i2 = 87;
   i1 = 8064;
   i3 = 5;
   break;
  }
 }
 if ((i3 | 0) == 2) if (!i2) i1 = 8064; else {
  i1 = 8064;
  i3 = 5;
 }
 if ((i3 | 0) == 5) while (1) {
  while (1) {
   i3 = i1 + 1 | 0;
   if (!(HEAP8[i1 >> 0] | 0)) {
    i1 = i3;
    break;
   } else i1 = i3;
  }
  i2 = i2 + -1 | 0;
  if (!i2) break; else i3 = 5;
 }
 return i1 | 0;
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
 d5 = +__emval_as(HEAP32[i2 >> 2] | 0, 312, i4 | 0);
 i2 = HEAP32[i4 >> 2] | 0;
 i4 = ~~d5 >>> 0;
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcj(i1, i4 + 4 | 0, HEAP32[i4 >> 2] | 0);
 __emval_run_destructors(i2 | 0);
 STACKTOP = i3;
 return;
}

function ___stdio_seek(i1, i2, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i4 = i4 | 0;
 var i3 = 0, i5 = 0, i6 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 32 | 0;
 i6 = i5;
 i3 = i5 + 20 | 0;
 HEAP32[i6 >> 2] = HEAP32[i1 + 60 >> 2];
 HEAP32[i6 + 4 >> 2] = 0;
 HEAP32[i6 + 8 >> 2] = i2;
 HEAP32[i6 + 12 >> 2] = i3;
 HEAP32[i6 + 16 >> 2] = i4;
 if ((___syscall_ret(___syscall140(140, i6 | 0) | 0) | 0) < 0) {
  HEAP32[i3 >> 2] = -1;
  i1 = -1;
 } else i1 = HEAP32[i3 >> 2] | 0;
 STACKTOP = i5;
 return i1 | 0;
}

function _HuffmanTree_makeFromLengths(i6, i2, i5, i4) {
 i6 = i6 | 0;
 i2 = i2 | 0;
 i5 = i5 | 0;
 i4 = i4 | 0;
 var i1 = 0, i3 = 0;
 i1 = _malloc(i5 << 2) | 0;
 HEAP32[i6 + 8 >> 2] = i1;
 if (!i1) {
  i6 = 83;
  return i6 | 0;
 }
 if (i5) {
  i3 = 0;
  do {
   HEAP32[i1 + (i3 << 2) >> 2] = HEAP32[i2 + (i3 << 2) >> 2];
   i3 = i3 + 1 | 0;
  } while ((i3 | 0) != (i5 | 0));
 }
 HEAP32[i6 + 16 >> 2] = i5;
 HEAP32[i6 + 12 >> 2] = i4;
 i6 = _HuffmanTree_makeFromLengths2(i6) | 0;
 return i6 | 0;
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
  i1 = HEAP32[i2 + 44 >> 2] | 0;
  HEAP32[i2 + 28 >> 2] = i1;
  HEAP32[i2 + 20 >> 2] = i1;
  HEAP32[i2 + 16 >> 2] = i1 + (HEAP32[i2 + 48 >> 2] | 0);
  i1 = 0;
 } else {
  HEAP32[i2 >> 2] = i1 | 32;
  i1 = -1;
 }
 return i1 | 0;
}

function ___stdout_write(i2, i1, i3) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 i3 = i3 | 0;
 var i4 = 0, i5 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 80 | 0;
 i4 = i5;
 HEAP32[i2 + 36 >> 2] = 5;
 if ((HEAP32[i2 >> 2] & 64 | 0) == 0 ? (HEAP32[i4 >> 2] = HEAP32[i2 + 60 >> 2], HEAP32[i4 + 4 >> 2] = 21505, HEAP32[i4 + 8 >> 2] = i5 + 12, (___syscall54(54, i4 | 0) | 0) != 0) : 0) HEAP8[i2 + 75 >> 0] = -1;
 i4 = ___stdio_write(i2, i1, i3) | 0;
 STACKTOP = i5;
 return i4 | 0;
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

function _memcmp(i1, i3, i2) {
 i1 = i1 | 0;
 i3 = i3 | 0;
 i2 = i2 | 0;
 var i4 = 0, i5 = 0;
 L1 : do if (!i2) i1 = 0; else {
  i5 = i2;
  i4 = i1;
  while (1) {
   i2 = HEAP8[i4 >> 0] | 0;
   i1 = HEAP8[i3 >> 0] | 0;
   if (i2 << 24 >> 24 != i1 << 24 >> 24) break;
   i5 = i5 + -1 | 0;
   if (!i5) {
    i1 = 0;
    break L1;
   } else {
    i4 = i4 + 1 | 0;
    i3 = i3 + 1 | 0;
   }
  }
  i1 = (i2 & 255) - (i1 & 255) | 0;
 } while (0);
 return i1 | 0;
}

function __ZL7messageN10emscripten3valE(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i3 = i2;
 __ZNK10emscripten3val2asINSt3__112basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEEEET_v(i3, i1);
 FUNCTION_TABLE_vi[HEAP32[2536 >> 2] & 31]((HEAP8[i3 >> 0] & 1) == 0 ? i3 + 1 | 0 : HEAP32[i3 + 8 >> 2] | 0);
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
  HEAP32[i2 >> 2] = 2736;
  ___cxa_throw(i2 | 0, 528, 2);
 } while (0);
 return i1 | 0;
}

function __ZSt9terminatev() {
 var i1 = 0, i2 = 0;
 i1 = ___cxa_get_globals_fast() | 0;
 if (((i1 | 0) != 0 ? (i2 = HEAP32[i1 >> 2] | 0, (i2 | 0) != 0) : 0) ? (i1 = i2 + 48 | 0, (HEAP32[i1 >> 2] & -256 | 0) == 1126902528 ? (HEAP32[i1 + 4 >> 2] | 0) == 1129074247 : 0) : 0) __ZSt11__terminatePFvvE(HEAP32[i2 + 12 >> 2] | 0);
 i2 = HEAP32[681] | 0;
 HEAP32[681] = i2 + 0;
 __ZSt11__terminatePFvvE(i2);
}

function _fwrite(i2, i5, i1, i3) {
 i2 = i2 | 0;
 i5 = i5 | 0;
 i1 = i1 | 0;
 i3 = i3 | 0;
 var i4 = 0, i6 = 0;
 i4 = Math_imul(i1, i5) | 0;
 if ((HEAP32[i3 + 76 >> 2] | 0) > -1) {
  i6 = (___lockfile(i3) | 0) == 0;
  i2 = ___fwritex(i2, i4, i3) | 0;
  if (!i6) ___unlockfile(i3);
 } else i2 = ___fwritex(i2, i4, i3) | 0;
 if ((i2 | 0) != (i4 | 0)) i1 = (i2 >>> 0) / (i5 >>> 0) | 0;
 return i1 | 0;
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

function _par_buffer_alloc(i2, i4) {
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

function _par_zcam_init(f3, f2, f1) {
 f3 = Math_fround(f3);
 f2 = Math_fround(f2);
 f1 = Math_fround(f1);
 var d4 = 0.0, d5 = 0.0;
 d4 = +f1;
 d5 = +f2 * .5 / +Math_tan(+(d4 * .5));
 HEAPF64[1] = d5;
 HEAP32[4] = 0;
 HEAP32[5] = 0;
 HEAP32[6] = 0;
 HEAP32[7] = 0;
 HEAPF64[4] = d5;
 HEAPF64[5] = 1.0e-07;
 HEAPF64[6] = 9.0e-08;
 HEAPF64[7] = d5 * 1.1;
 HEAPF64[8] = d4;
 return;
}

function _input(i1, f2, f3, f4) {
 i1 = i1 | 0;
 f2 = Math_fround(f2);
 f3 = Math_fround(f3);
 f4 = Math_fround(f4);
 switch (i1 | 0) {
 case 0:
  {
   _par_zcam_grab_begin(f2, f3);
   return;
  }
 case 1:
  {
   _par_zcam_grab_update(f2, f3, f4);
   _par_zcam_grab_end();
   return;
  }
 case 2:
  {
   _par_zcam_grab_update(f2, f3, f4);
   return;
  }
 default:
  return;
 }
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

function _sdsfree(i2) {
 i2 = i2 | 0;
 var i1 = 0;
 if (!i2) return;
 switch ((HEAPU8[i2 + -1 >> 0] | 0) & 7 | 0) {
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
 default:
  i1 = 0;
 }
 _free(i2 + (0 - i1) | 0);
 return;
}

function _par_buffer_unlock(i2) {
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

function ___cxa_can_catch(i1, i2, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i4 = i4 | 0;
 var i3 = 0, i5 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i3 = i5;
 HEAP32[i3 >> 2] = HEAP32[i4 >> 2];
 i1 = FUNCTION_TABLE_iiii[HEAP32[(HEAP32[i1 >> 2] | 0) + 16 >> 2] & 15](i1, i2, i3) | 0;
 if (i1) HEAP32[i4 >> 2] = HEAP32[i3 >> 2];
 STACKTOP = i5;
 return i1 & 1 | 0;
}

function _init_mparams() {
 var i1 = 0;
 do if (!(HEAP32[866] | 0)) {
  i1 = _sysconf(30) | 0;
  if (!(i1 + -1 & i1)) {
   HEAP32[868] = i1;
   HEAP32[867] = i1;
   HEAP32[869] = -1;
   HEAP32[870] = -1;
   HEAP32[871] = 0;
   HEAP32[859] = 0;
   i1 = (_time(0) | 0) & -16 ^ 1431655768;
   HEAP32[866] = i1;
   break;
  } else _abort();
 } while (0);
 return;
}

function _par_buffer_gpu_bind(i3) {
 i3 = i3 | 0;
 var i1 = 0, i2 = 0;
 i2 = i3 + 8 | 0;
 i1 = HEAP32[i2 >> 2] | 0;
 if ((i1 & -2 | 0) != 2) {
  _puts(4079) | 0;
  i1 = HEAP32[i2 >> 2] | 0;
 }
 if ((i1 & -2 | 0) == 2) {
  _glBindBuffer(((i1 | 0) == 2 ? 34962 : 34963) | 0, HEAP32[i3 + 12 >> 2] | 0);
  return;
 } else ___assert_fail(4099, 4023, 118, 4125);
}

function _dispose() {
 _par_buffer_free(HEAP32[670] | 0);
 _par_mesh_free(HEAP32[663] | 0);
 _par_mesh_free(HEAP32[669] | 0);
 _par_texture_free(HEAP32[661] | 0);
 _par_texture_free(HEAP32[668] | 0);
 _par_texture_free(HEAP32[664] | 0);
 _par_texture_free(HEAP32[665] | 0);
 _par_texture_free(HEAP32[666] | 0);
 _par_texture_free(HEAP32[667] | 0);
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
 if ((i1 | 0) != 0 ? (HEAP32[i1 + -4 >> 2] & 3 | 0) != 0 : 0) _memset(i1 | 0, 0, i2 | 0) | 0;
 return i1 | 0;
}

function _par_zcam_grab_begin(f1, f2) {
 f1 = Math_fround(f1);
 f2 = Math_fround(f2);
 var d3 = 0.0, d4 = 0.0;
 HEAP32[206] = 1;
 d4 = +Math_tan(+(+HEAPF64[8] * .5)) * 2.0;
 d4 = d4 * +HEAPF64[4];
 d3 = +HEAPF64[3] + (+f2 + -.5) * d4;
 HEAPF64[26] = +HEAPF64[2] + (+f1 + -.5) * (d4 * +HEAPF64[9]);
 HEAPF64[27] = d3;
 HEAPF64[28] = 0.0;
 return;
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

function _par_varray_enable(i2, i1, i3, i6, i5, i4) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 i3 = i3 | 0;
 i6 = i6 | 0;
 i5 = i5 | 0;
 i4 = i4 | 0;
 _par_buffer_gpu_bind(i2);
 i2 = _par_shader_attrib_get(i1) | 0;
 _glEnableVertexAttribArray(i2 | 0);
 _glVertexAttribPointer(i2 | 0, i3 | 0, i6 | 0, 0, i5 | 0, i4 | 0);
 return;
}

function ___uremdi3(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i5 = 0, i6 = 0;
 i6 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
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

function _par_state_clearcolor(i1) {
 i1 = i1 | 0;
 var f2 = f0, f3 = f0, f4 = f0;
 f4 = Math_fround(HEAPF32[i1 >> 2]);
 f3 = Math_fround(HEAPF32[i1 + 4 >> 2]);
 f2 = Math_fround(HEAPF32[i1 + 8 >> 2]);
 _glClearColor(+f4, +f3, +f2, +Math_fround(HEAPF32[i1 + 12 >> 2]));
 return;
}

function _color_tree_cleanup(i4) {
 i4 = i4 | 0;
 var i1 = 0, i2 = 0, i3 = 0;
 i3 = 0;
 do {
  i1 = i4 + (i3 << 2) | 0;
  i2 = HEAP32[i1 >> 2] | 0;
  if (i2) {
   _color_tree_cleanup(i2);
   _free(HEAP32[i1 >> 2] | 0);
  }
  i3 = i3 + 1 | 0;
 } while ((i3 | 0) != 16);
 return;
}

function _par_buffer_lock(i2, i1) {
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
 if (!(_pthread_once(2932, 5) | 0)) {
  i2 = _pthread_getspecific(HEAP32[732] | 0) | 0;
  STACKTOP = i1;
  return i2 | 0;
 } else _abort_message(7501, i1);
 return 0;
}

function __ZL6commitNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE(i1) {
 i1 = i1 | 0;
 _par_buffer_unlock(HEAP32[652] | 0);
 if (!(HEAP8[i1 >> 0] & 1)) i1 = i1 + 1 | 0; else i1 = HEAP32[i1 + 8 >> 2] | 0;
 _par_asset_onload(i1, HEAP32[652] | 0);
 return;
}
function __ZN10__cxxabiv112_GLOBAL__N_19destruct_EPv(i1) {
 i1 = i1 | 0;
 var i2 = 0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 _free(i1);
 if (!(_pthread_setspecific(HEAP32[732] | 0, 0) | 0)) {
  STACKTOP = i2;
  return;
 } else _abort_message(7655, i2);
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

function dynCall_vffff(i5, f1, f2, f3, f4) {
 i5 = i5 | 0;
 f1 = Math_fround(f1);
 f2 = Math_fround(f2);
 f3 = Math_fround(f3);
 f4 = Math_fround(f4);
 FUNCTION_TABLE_vffff[i5 & 3](Math_fround(f1), Math_fround(f2), Math_fround(f3), Math_fround(f4));
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

function ___stdio_close(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i3 = i2;
 HEAP32[i3 >> 2] = HEAP32[i1 + 60 >> 2];
 i1 = ___syscall_ret(___syscall6(6, i3 | 0) | 0) | 0;
 STACKTOP = i2;
 return i1 | 0;
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

function _par_mesh_free(i1) {
 i1 = i1 | 0;
 _par_buffer_free(HEAP32[i1 >> 2] | 0);
 _par_buffer_free(HEAP32[i1 + 12 >> 2] | 0);
 _par_buffer_free(HEAP32[i1 + 8 >> 2] | 0);
 _par_buffer_free(HEAP32[i1 + 4 >> 2] | 0);
 _free(i1);
 return;
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

function _printf(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0;
 i3 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i4 = i3;
 HEAP32[i4 >> 2] = i2;
 i2 = _vfprintf(HEAP32[747] | 0, i1, i4) | 0;
 STACKTOP = i3;
 return i2 | 0;
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

function __ZL4tickf(f1) {
 f1 = Math_fround(f1);
 var f2 = f0, f3 = f0;
 f3 = Math_fround(HEAP32[635] | 0);
 f2 = Math_fround(HEAP32[636] | 0);
 FUNCTION_TABLE_vffff[HEAP32[2520 >> 2] & 3](f3, f2, Math_fround(1.0), f1);
 return;
}

function _abort_message(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0;
 i3 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 HEAP32[i3 >> 2] = i2;
 i2 = HEAP32[746] | 0;
 _vfprintf(i2, i1, i3) | 0;
 _fputc(10, i2) | 0;
 _abort();
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

function __ZN10__cxxabiv112_GLOBAL__N_110construct_Ev() {
 var i1 = 0;
 i1 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if (!(_pthread_key_create(2928, 19) | 0)) {
  STACKTOP = i1;
  return;
 } else _abort_message(7605, i1);
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

function dynCall_iiiiii(i6, i1, i2, i3, i4, i5) {
 i6 = i6 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 return FUNCTION_TABLE_iiiiii[i6 & 0](i1 | 0, i2 | 0, i3 | 0, i4 | 0, i5 | 0) | 0;
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

function dynCall_vfff(i4, f1, f2, f3) {
 i4 = i4 | 0;
 f1 = Math_fround(f1);
 f2 = Math_fround(f2);
 f3 = Math_fround(f3);
 FUNCTION_TABLE_vfff[i4 & 3](Math_fround(f1), Math_fround(f2), Math_fround(f3));
}

function _par_window_exec(f3, f2, i1) {
 f3 = Math_fround(f3);
 f2 = Math_fround(f2);
 i1 = i1 | 0;
 HEAP32[635] = ~~f3;
 HEAP32[636] = ~~f2;
 _emscripten_asm_const_2(0, +(+f3), +(+f2)) | 0;
 return 0;
}

function __ZL5inputifff(i1, f2, f3, f4) {
 i1 = i1 | 0;
 f2 = Math_fround(f2);
 f3 = Math_fround(f3);
 f4 = Math_fround(f4);
 FUNCTION_TABLE_vifff[HEAP32[2532 >> 2] & 3](i1, f2, f3, f4);
 return;
}

function _par_buffer_free(i1) {
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

function _tick(f4, f3, f1, f2) {
 f4 = Math_fround(f4);
 f3 = Math_fround(f3);
 f1 = Math_fround(f1);
 f2 = Math_fround(f2);
 _par_zcam_tick(Math_fround(f4 / f3), f2);
 return;
}

function ___syscall_ret(i1) {
 i1 = i1 | 0;
 var i2 = 0;
 if (i1 >>> 0 > 4294963200) {
  i2 = ___errno_location() | 0;
  HEAP32[i2 >> 2] = 0 - i1;
  i1 = -1;
 }
 return i1 | 0;
}

function ___errno_location() {
 var i1 = 0;
 if (!(HEAP32[735] | 0)) i1 = 3488; else {
  i1 = (_pthread_self() | 0) + 60 | 0;
  i1 = HEAP32[i1 >> 2] | 0;
 }
 return i1 | 0;
}

function _par_buffer_length(i1) {
 i1 = i1 | 0;
 if (!i1) {
  _puts(4007) | 0;
  ___assert_fail(4019, 4023, 50, 4061);
 } else return HEAP32[i1 + 4 >> 2] | 0;
 return 0;
}

function __ZSt11__terminatePFvvE(i1) {
 i1 = i1 | 0;
 var i2 = 0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 FUNCTION_TABLE_v[i1 & 7]();
 _abort_message(7565, i2);
}

function _par_texture_info(i2, i3, i1) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i1 = i1 | 0;
 HEAP32[i3 >> 2] = HEAP32[i2 >> 2];
 HEAP32[i1 >> 2] = HEAP32[i2 + 4 >> 2];
 return;
}

function __ZN10emscripten8internal14raw_destructorIZN32EmscriptenBindingInitializer_parC1EvE6WindowEEvPT_(i1) {
 i1 = i1 | 0;
 if (!i1) return;
 __ZdlPv(i1);
 return;
}

function _message(i1) {
 i1 = i1 | 0;
 if (!(_strcmp(i1, 5705) | 0)) {
  HEAP32[660] = 1;
  return;
 }
 if (_strcmp(i1, 5710) | 0) return;
 HEAP32[660] = 0;
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

function dynCall_iiii(i4, i1, i2, i3) {
 i4 = i4 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 return FUNCTION_TABLE_iiii[i4 & 15](i1 | 0, i2 | 0, i3 | 0) | 0;
}

function _par_shader_load_from_asset(i1) {
 i1 = i1 | 0;
 i1 = _par_buffer_from_asset(i1) | 0;
 _par_shader_load_from_buffer(i1);
 _par_buffer_free(i1);
 return;
}

function _strdup(i2) {
 i2 = i2 | 0;
 var i1 = 0;
 i1 = _malloc((_strlen(i2) | 0) + 1 | 0) | 0;
 if (!i1) return i1 | 0;
 _strcpy(i1, i2) | 0;
 return i1 | 0;
}

function _strchr(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 i2 = ___strchrnul(i2, i1) | 0;
 return ((HEAP8[i2 >> 0] | 0) == (i1 & 255) << 24 >> 24 ? i2 : 0) | 0;
}

function _par_texture_bind(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 _glActiveTexture(i1 + 33984 | 0);
 _glBindTexture(3553, HEAP32[i2 + 8 >> 2] | 0);
 return;
}

function __ZN10emscripten8internal7InvokerIvJfEE6invokeEPFvfEf(i2, f1) {
 i2 = i2 | 0;
 f1 = Math_fround(f1);
 FUNCTION_TABLE_vf[i2 & 1](f1);
 return;
}

function __ZL4drawv() {
 if (!(FUNCTION_TABLE_i[HEAP32[2524 >> 2] & 3]() | 0)) return;
 if (!(_glGetError() | 0)) return;
 _puts(5459) | 0;
 return;
}

function __ZL10null_input9par_eventfff(i1, f2, f3, f4) {
 i1 = i1 | 0;
 f2 = Math_fround(f2);
 f3 = Math_fround(f3);
 f4 = Math_fround(f4);
 return;
}
function stackAlloc(i1) {
 i1 = i1 | 0;
 var i2 = 0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + i1 | 0;
 STACKTOP = STACKTOP + 15 & -16;
 return i2 | 0;
}

function _par_uniform_matrix4f(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 _glUniformMatrix4fv(_par_shader_uniform_get(i1) | 0, 1, 0, i2 | 0);
 return;
}

function __ZL9null_tickffff(f1, f2, f3, f4) {
 f1 = Math_fround(f1);
 f2 = Math_fround(f2);
 f3 = Math_fround(f3);
 f4 = Math_fround(f4);
 return;
}

function ___cxa_is_pointer_type(i1) {
 i1 = i1 | 0;
 if (!i1) i1 = 0; else i1 = (___dynamic_cast(i1, 560, 608, 0) | 0) != 0;
 return i1 & 1 | 0;
}

function b10(i1, i2, f3, f4, f5) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 f3 = Math_fround(f3);
 f4 = Math_fround(f4);
 f5 = Math_fround(f5);
 abort(10);
}

function dynCall_vif(i3, i1, f2) {
 i3 = i3 | 0;
 i1 = i1 | 0;
 f2 = Math_fround(f2);
 FUNCTION_TABLE_vif[i3 & 1](i1 | 0, Math_fround(f2));
}

function ___udivdi3(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 return ___udivmoddi4(i1, i2, i3, i4, 0) | 0;
}

function __ZN10emscripten8internal13getActualTypeIZN32EmscriptenBindingInitializer_parC1EvE6WindowEEPKvPT_(i1) {
 i1 = i1 | 0;
 return 232;
}

function __ZN10emscripten8internal13getActualTypeIZN32EmscriptenBindingInitializer_parC1EvE5AssetEEPKvPT_(i1) {
 i1 = i1 | 0;
 return 272;
}

function b13(i1, i2, i3, i4, i5, i6) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 abort(13);
}

function _par_uniform_point(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 _glUniform3fv(_par_shader_uniform_get(i1) | 0, 1, i2 | 0);
 return;
}

function _llvm_bswap_i32(i1) {
 i1 = i1 | 0;
 return (i1 & 255) << 24 | (i1 >> 8 & 255) << 16 | (i1 >> 16 & 255) << 8 | i1 >>> 24 | 0;
}

function __ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv(i1) {
 i1 = i1 | 0;
 ___assert_fail(7708, 7737, 1164, 7810);
}

function dynCall_iii(i3, i1, i2) {
 i3 = i3 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 return FUNCTION_TABLE_iii[i3 & 1](i1 | 0, i2 | 0) | 0;
}

function b8(f1, f2, f3, f4) {
 f1 = Math_fround(f1);
 f2 = Math_fround(f2);
 f3 = Math_fround(f3);
 f4 = Math_fround(f4);
 abort(8);
}

function b15(i1, i2, i3, i4, i5) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 abort(15);
 return 0;
}

function _sdsnew(i2) {
 i2 = i2 | 0;
 var i1 = 0;
 if (!i2) i1 = 0; else i1 = _strlen(i2) | 0;
 return _sdsnewlen(i2, i1) | 0;
}

function b12(i1, f2, f3, f4) {
 i1 = i1 | 0;
 f2 = Math_fround(f2);
 f3 = Math_fround(f3);
 f4 = Math_fround(f4);
 abort(12);
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

function b5(i1, i2, i3, i4, i5) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 abort(5);
}

function _fputs(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 return (_fwrite(i2, _strlen(i2) | 0, 1, i1) | 0) + -1 | 0;
}

function dynCall_vf(i2, f1) {
 i2 = i2 | 0;
 f1 = Math_fround(f1);
 FUNCTION_TABLE_vf[i2 & 1](Math_fround(f1));
}

function __ZSt15get_new_handlerv() {
 var i1 = 0;
 i1 = HEAP32[687] | 0;
 HEAP32[687] = i1 + 0;
 return i1 | 0;
}

function _par_draw_lines(i1) {
 i1 = i1 | 0;
 _glLineWidth(2.0);
 _glDrawArrays(1, 0, i1 << 1 | 0);
 return;
}

function ___clang_call_terminate(i1) {
 i1 = i1 | 0;
 ___cxa_begin_catch(i1 | 0) | 0;
 __ZSt9terminatev();
}

function b7(f1, f2, f3) {
 f1 = Math_fround(f1);
 f2 = Math_fround(f2);
 f3 = Math_fround(f3);
 abort(7);
}

function dynCall_ii(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 return FUNCTION_TABLE_ii[i2 & 7](i1 | 0) | 0;
}

function _par_texture_free(i1) {
 i1 = i1 | 0;
 _glDeleteTextures(1, i1 + 8 | 0);
 _free(i1);
 return;
}

function _par_asset_set_baseurl(i1) {
 i1 = i1 | 0;
 i1 = _sdsnew(i1) | 0;
 HEAP32[197] = i1;
 return;
}

function _cleanup397(i1) {
 i1 = i1 | 0;
 if (!(HEAP32[i1 + 68 >> 2] | 0)) ___unlockfile(i1);
 return;
}

function establishStackSpace(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 STACKTOP = i1;
 STACK_MAX = i2;
}

function b16(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 abort(16);
}

function __GLOBAL__sub_I_bindings_cpp() {
 __ZN32EmscriptenBindingInitializer_parC2Ev(0);
 return;
}

function __ZN10__cxxabiv123__fundamental_type_infoD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function _ntohs(i1) {
 i1 = i1 | 0;
 i1 = i1 & 65535;
 return (i1 << 8 | i1 >>> 8) & 65535 | 0;
}

function _htons(i1) {
 i1 = i1 | 0;
 i1 = i1 & 65535;
 return (i1 << 8 | i1 >>> 8) & 65535 | 0;
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

function _strcpy(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 ___stpcpy(i1, i2) | 0;
 return i1 | 0;
}

function _par_window_setargs(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 HEAP32[628] = i2;
 return;
}

function _par_draw_clear() {
 _glClear(((HEAP32[204] | 0) == 0 ? 16384 : 16640) | 0);
 return;
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

function __ZN10__cxxabiv117__class_type_infoD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function b1(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 abort(1);
 return 0;
}

function _par_buffer_from_asset(i1) {
 i1 = i1 | 0;
 return _par_asset_to_buffer(i1) | 0;
}

function ___getTypeName(i1) {
 i1 = i1 | 0;
 return _strdup(HEAP32[i1 + 4 >> 2] | 0) | 0;
}

function _par_token_to_string(i1) {
 i1 = i1 | 0;
 return _par_token_to_sds(i1) | 0;
}

function __ZNK10__cxxabiv116__shim_type_info5noop2Ev(i1) {
 i1 = i1 | 0;
 return;
}

function __ZNK10__cxxabiv116__shim_type_info5noop1Ev(i1) {
 i1 = i1 | 0;
 return;
}

function _ldexp(d2, i1) {
 d2 = +d2;
 i1 = i1 | 0;
 return +(+_scalbn(d2, i1));
}

function _frexpl(d2, i1) {
 d2 = +d2;
 i1 = i1 | 0;
 return +(+_frexp(d2, i1));
}

function dynCall_i(i1) {
 i1 = i1 | 0;
 return FUNCTION_TABLE_i[i1 & 3]() | 0;
}

function _par_window_onmessage(i1) {
 i1 = i1 | 0;
 HEAP32[634] = i1;
 return;
}

function _par_window_oninput(i1) {
 i1 = i1 | 0;
 HEAP32[633] = i1;
 return;
}

function __ZN10__cxxabiv116__shim_type_infoD2Ev(i1) {
 i1 = i1 | 0;
 return;
}

function _par_window_ontick(i1) {
 i1 = i1 | 0;
 HEAP32[630] = i1;
 return;
}

function _par_window_oninit(i1) {
 i1 = i1 | 0;
 HEAP32[629] = i1;
 return;
}

function _par_window_onexit(i1) {
 i1 = i1 | 0;
 HEAP32[632] = i1;
 return;
}

function _par_window_ondraw(i1) {
 i1 = i1 | 0;
 HEAP32[631] = i1;
 return;
}

function _par_mesh_uv(i1) {
 i1 = i1 | 0;
 return HEAP32[i1 + 4 >> 2] | 0;
}

function b14(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 abort(14);
 return 0;
}

function _par_mesh_coord(i1) {
 i1 = i1 | 0;
 return HEAP32[i1 >> 2] | 0;
}

function _htonl(i1) {
 i1 = i1 | 0;
 return _llvm_bswap_i32(i1 | 0) | 0;
}

function __ZNSt9bad_allocD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function b3(i1, f2) {
 i1 = i1 | 0;
 f2 = Math_fround(f2);
 abort(3);
}

function dynCall_v(i1) {
 i1 = i1 | 0;
 FUNCTION_TABLE_v[i1 & 7]();
}

function __ZNKSt9bad_alloc4whatEv(i1) {
 i1 = i1 | 0;
 return 7550;
}

function _par_draw_one_quad() {
 _glDrawArrays(5, 0, 4);
 return;
}

function b2(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 abort(2);
}

function __ZL12null_messagePKc(i1) {
 i1 = i1 | 0;
 return;
}

function _par_zcam_grab_end() {
 HEAP32[206] = 0;
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
 return _sdsnewlen(4982, 0) | 0;
}

function b9(i1) {
 i1 = i1 | 0;
 abort(9);
 return 0;
}

function b4(f1) {
 f1 = Math_fround(f1);
 abort(4);
}

function ___unlockfile(i1) {
 i1 = i1 | 0;
 return;
}

function ___lockfile(i1) {
 i1 = i1 | 0;
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
 return 0;
}

function b6() {
 abort(6);
 return 0;
}

function b11() {
 abort(11);
}

// EMSCRIPTEN_END_FUNCS
var FUNCTION_TABLE_vi = [b0,__ZL12null_messagePKc,__ZNSt9bad_allocD2Ev,__ZNSt9bad_allocD0Ev,__ZN10__cxxabiv116__shim_type_infoD2Ev,__ZN10__cxxabiv123__fundamental_type_infoD0Ev,__ZNK10__cxxabiv116__shim_type_info5noop1Ev,__ZNK10__cxxabiv116__shim_type_info5noop2Ev,__ZN10__cxxabiv117__class_type_infoD0Ev,__ZN10__cxxabiv120__si_class_type_infoD0Ev,__ZN10__cxxabiv121__vmi_class_type_infoD0Ev,__ZN10__cxxabiv119__pointer_type_infoD0Ev,__ZN10emscripten8internal14raw_destructorIZN32EmscriptenBindingInitializer_parC1EvE6WindowEEvPT_,__ZL4initN10emscripten3valE,__ZN10emscripten8internal7InvokerIvJEE6invokeEPFvvE,__ZL7messageN10emscripten3valE,__ZN10emscripten8internal14raw_destructorIZN32EmscriptenBindingInitializer_parC1EvE5AssetEEvPT_,__ZL6commitNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE,_message,__ZN10__cxxabiv112_GLOBAL__N_19destruct_EPv,_cleanup397,b0,b0,b0,b0,b0,b0,b0,b0
,b0,b0,b0];
var FUNCTION_TABLE_iiii = [b1,__ZNK10__cxxabiv123__fundamental_type_info9can_catchEPKNS_16__shim_type_infoERPv,__ZNK10__cxxabiv117__class_type_info9can_catchEPKNS_16__shim_type_infoERPv,__ZNK10__cxxabiv119__pointer_type_info9can_catchEPKNS_16__shim_type_infoERPv,_sn_write,___stdio_write,___stdio_seek,___stdout_write,__ZN10emscripten8internal7InvokerIiJNSt3__112basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEEiEE6invokeEPFiS8_iEPNS0_11BindingTypeIS8_EUt_Ei,b1,b1,b1,b1,b1,b1,b1];
var FUNCTION_TABLE_vii = [b2,__ZN10emscripten8internal7InvokerIvJNS_3valEEE6invokeEPFvS2_EPNS0_7_EM_VALE,__ZN10emscripten8internal7InvokerIvJNSt3__112basic_stringIcNS2_11char_traitsIcEENS2_9allocatorIcEEEEEE6invokeEPFvS8_EPNS0_11BindingTypeIS8_EUt_E,b2];
var FUNCTION_TABLE_vif = [b3,__ZN10emscripten8internal7InvokerIvJfEE6invokeEPFvfEf];
var FUNCTION_TABLE_vf = [b4,__ZL4tickf];
var FUNCTION_TABLE_viiiii = [b5,__ZNK10__cxxabiv117__class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,__ZNK10__cxxabiv120__si_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,__ZNK10__cxxabiv121__vmi_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib];
var FUNCTION_TABLE_i = [b6,__ZL9null_drawv,_draw,b6];
var FUNCTION_TABLE_vfff = [b7,__ZL9null_initfff,_init,b7];
var FUNCTION_TABLE_vffff = [b8,__ZL9null_tickffff,_tick,b8];
var FUNCTION_TABLE_ii = [b9,__ZNKSt9bad_alloc4whatEv,___stdio_close,__ZN10emscripten8internal13getActualTypeIZN32EmscriptenBindingInitializer_parC1EvE6WindowEEPKvPT_,__ZN10emscripten8internal13getActualTypeIZN32EmscriptenBindingInitializer_parC1EvE5AssetEEPKvPT_,b9,b9,b9];
var FUNCTION_TABLE_viifff = [b10,__ZN10emscripten8internal7InvokerIvJifffEE6invokeEPFvifffEifff];
var FUNCTION_TABLE_v = [b11,__ZL12null_disposev,__ZL25default_terminate_handlerv,__ZL4drawv,_dispose,__ZN10__cxxabiv112_GLOBAL__N_110construct_Ev,b11,b11];
var FUNCTION_TABLE_vifff = [b12,__ZL10null_input9par_eventfff,__ZL5inputifff,_input];
var FUNCTION_TABLE_viiiiii = [b13,__ZNK10__cxxabiv117__class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,__ZNK10__cxxabiv120__si_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,__ZNK10__cxxabiv121__vmi_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib];
var FUNCTION_TABLE_iii = [b14,__ZL5allocNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEEi];
var FUNCTION_TABLE_iiiiii = [b15];
var FUNCTION_TABLE_viiii = [b16,__ZNK10__cxxabiv117__class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,__ZNK10__cxxabiv120__si_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,__ZNK10__cxxabiv121__vmi_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi];

  return { ___cxa_can_catch: ___cxa_can_catch, _free: _free, _main: _main, _htonl: _htonl, ___cxa_is_pointer_type: ___cxa_is_pointer_type, _i64Add: _i64Add, _memmove: _memmove, _i64Subtract: _i64Subtract, _memset: _memset, _malloc: _malloc, _memcpy: _memcpy, ___getTypeName: ___getTypeName, _bitshift64Lshr: _bitshift64Lshr, _htons: _htons, _bitshift64Shl: _bitshift64Shl, _llvm_bswap_i32: _llvm_bswap_i32, _ntohs: _ntohs, __GLOBAL__sub_I_bindings_cpp: __GLOBAL__sub_I_bindings_cpp, __GLOBAL__sub_I_bind_cpp: __GLOBAL__sub_I_bind_cpp, runPostSets: runPostSets, _emscripten_replace_memory: _emscripten_replace_memory, stackAlloc: stackAlloc, stackSave: stackSave, stackRestore: stackRestore, establishStackSpace: establishStackSpace, setThrew: setThrew, setTempRet0: setTempRet0, getTempRet0: getTempRet0, dynCall_vi: dynCall_vi, dynCall_iiii: dynCall_iiii, dynCall_vii: dynCall_vii, dynCall_vif: dynCall_vif, dynCall_vf: dynCall_vf, dynCall_viiiii: dynCall_viiiii, dynCall_i: dynCall_i, dynCall_vfff: dynCall_vfff, dynCall_vffff: dynCall_vffff, dynCall_ii: dynCall_ii, dynCall_viifff: dynCall_viifff, dynCall_v: dynCall_v, dynCall_vifff: dynCall_vifff, dynCall_viiiiii: dynCall_viiiiii, dynCall_iii: dynCall_iii, dynCall_iiiiii: dynCall_iiiiii, dynCall_viiii: dynCall_viiii };
})
// EMSCRIPTEN_END_ASM
(Module.asmGlobalArg, Module.asmLibraryArg, buffer);
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var ___cxa_can_catch = Module["___cxa_can_catch"] = asm["___cxa_can_catch"];
var __GLOBAL__sub_I_bind_cpp = Module["__GLOBAL__sub_I_bind_cpp"] = asm["__GLOBAL__sub_I_bind_cpp"];
var _free = Module["_free"] = asm["_free"];
var _main = Module["_main"] = asm["_main"];
var _htonl = Module["_htonl"] = asm["_htonl"];
var ___cxa_is_pointer_type = Module["___cxa_is_pointer_type"] = asm["___cxa_is_pointer_type"];
var _i64Add = Module["_i64Add"] = asm["_i64Add"];
var _memmove = Module["_memmove"] = asm["_memmove"];
var __GLOBAL__sub_I_bindings_cpp = Module["__GLOBAL__sub_I_bindings_cpp"] = asm["__GLOBAL__sub_I_bindings_cpp"];
var _i64Subtract = Module["_i64Subtract"] = asm["_i64Subtract"];
var _memset = Module["_memset"] = asm["_memset"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _ntohs = Module["_ntohs"] = asm["_ntohs"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var ___getTypeName = Module["___getTypeName"] = asm["___getTypeName"];
var _bitshift64Lshr = Module["_bitshift64Lshr"] = asm["_bitshift64Lshr"];
var _htons = Module["_htons"] = asm["_htons"];
var _emscripten_replace_memory = Module["_emscripten_replace_memory"] = asm["_emscripten_replace_memory"];
var _llvm_bswap_i32 = Module["_llvm_bswap_i32"] = asm["_llvm_bswap_i32"];
var _bitshift64Shl = Module["_bitshift64Shl"] = asm["_bitshift64Shl"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_vif = Module["dynCall_vif"] = asm["dynCall_vif"];
var dynCall_vf = Module["dynCall_vf"] = asm["dynCall_vf"];
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_i = Module["dynCall_i"] = asm["dynCall_i"];
var dynCall_vfff = Module["dynCall_vfff"] = asm["dynCall_vfff"];
var dynCall_vffff = Module["dynCall_vffff"] = asm["dynCall_vffff"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_viifff = Module["dynCall_viifff"] = asm["dynCall_viifff"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_vifff = Module["dynCall_vifff"] = asm["dynCall_vifff"];
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm["dynCall_viiiiii"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_iiiiii = Module["dynCall_iiiiii"] = asm["dynCall_iiiiii"];
var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];
Runtime.stackAlloc = asm["stackAlloc"];
Runtime.stackSave = asm["stackSave"];
Runtime.stackRestore = asm["stackRestore"];
Runtime.establishStackSpace = asm["establishStackSpace"];
Runtime.setTempRet0 = asm["setTempRet0"];
Runtime.getTempRet0 = asm["getTempRet0"];
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
 initialStackTop = Runtime.stackSave();
 try {
  var ret = Module["_main"](argc, argv, 0);
  exit(ret, true);
 } catch (e) {
  if (e instanceof ExitStatus) {
   return;
  } else if (e == "SimulateInfiniteLoop") {
   Module["noExitRuntime"] = true;
   Runtime.stackRestore(initialStackTop);
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
